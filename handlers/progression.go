package halotestapp

import (
	"context"
	"encoding/base64"
	"fmt"
	"halotestapp/db"
	requests "halotestapp/requests"
	"io/ioutil"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type CurrentProgress struct {
	TotalXPEarned        int    `json:"TotalXPEarned"`
	Rank                 int    `json:"Rank"`
	PartialProgress      int    `json:"PartialProgress"`
	IsOwned              bool   `json:"IsOwned"`
	HasReachedMaxRank    bool   `json:"HasReachedMaxRank"`
	RankIconData         string `json:"RankIconData"`
	PreviousRankIconData string `json:"PreviousRankIconData"`
	NextRankIconData     string `json:"NextRankIconData"`
}

type RewardTrackResponse struct {
	RewardTrackPath  string          `json:"RewardTrackPath"`
	TrackType        string          `json:"TrackType"`
	CurrentProgress  CurrentProgress `json:"CurrentProgress"`
	PreviousProgress interface{}     `json:"PreviousProgress"` // Could be `nil` or a similar struct to CurrentProgress
	IsOwned          bool            `json:"IsOwned"`
	BaseXp           interface{}     `json:"BaseXp"`  // Could be `nil` or a specific type
	BoostXp          interface{}     `json:"BoostXp"` // Could be `nil` or a specific type
}

type Reward struct {
	InventoryRewards []interface{} `json:"InventoryRewards"`
	CurrencyRewards  []interface{} `json:"CurrencyRewards"`
}

type RankInfo struct {
	Rank              int         `json:"Rank"`
	FreeRewards       Reward      `json:"FreeRewards"`
	PaidRewards       Reward      `json:"PaidRewards"`
	XpRequiredForRank int         `json:"XpRequiredForRank"`
	RankTitle         interface{} `json:"RankTitle"`
	RankSubTitle      interface{} `json:"RankSubTitle"`
	RankTier          interface{} `json:"RankTier"`
	RankIcon          interface{} `json:"RankIcon"`
	RankLargeIcon     interface{} `json:"RankLargeIcon"`
	RankAdornmentIcon interface{} `json:"RankAdornmentIcon"`
	TierType          interface{} `json:"TierType"`
	RankGrade         int         `json:"RankGrade"`
}

type CareerLadderResponse struct {
	Ranks []RankInfo `json:"Ranks"`
}
type RankImage struct {
	Rank  int    `bson:"rank"`
	Image string `bson:"image"`
}

type ProgressionDataToSend struct {
	RankImages       []RankImage `json:"RankImages"`
	HaloStats        HaloData
	GamerInfo        requests.GamerInfo // Assuming GamerInfo is of type requests.GamerInfo
	CareerTrack      RewardTrackResponse
	CareerLadder     CareerLadderResponse
	AdjustedAverages map[string]int
	AverageDurations map[string]string
}

type PlayerMatchCount struct {
	MatchmadeMatchesPlayedCount int `json:"MatchmadeMatchesPlayedCount"`
}

func GetRankImagesFromDB() ([]RankImage, error) {
	collection := db.GetCollection("rank_images")
	cur, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(context.TODO())

	var rankImages []RankImage
	for cur.Next(context.TODO()) {
		var rankImage RankImage
		err := cur.Decode(&rankImage)
		if err != nil {
			return nil, err
		}
		rankImages = append(rankImages, rankImage)
	}

	if err := cur.Err(); err != nil {
		return nil, err
	}

	return rankImages, nil
}
func PopulatePlayerProgressionData(progressionData *ProgressionDataToSend, gamerInfo requests.GamerInfo, c *gin.Context) {
	progressionData.GamerInfo = gamerInfo
	careerTrack := GetCareerStats(gamerInfo, c)
	careerLadder := GetCareerLadder(gamerInfo, c)
	careerTrack.CurrentProgress.TotalXPEarned = CalculateTotalXPGainedSoFar(careerLadder, careerTrack.CurrentProgress.Rank) + careerTrack.CurrentProgress.PartialProgress
	GetCareerRankImage(careerLadder, &careerTrack, gamerInfo)

	targetPlayerId := "xuid(" + gamerInfo.XUID + ")"
	averages, averageDuration := calculateAveragePersonalScoreForPlaylists(progressionData.HaloStats, targetPlayerId)

	// Apply multipliers
	adjustedAverages := applyMultiplierToScores(averages)

	progressionData.GamerInfo = gamerInfo
	progressionData.AdjustedAverages = adjustedAverages
	progressionData.CareerLadder = careerLadder
	progressionData.CareerTrack = careerTrack
	progressionData.AverageDurations = averageDuration
	// Query the database for rank images
	rankImages, err := GetRankImagesFromDB()
	if err != nil {
		HandleError(c, err) // Assume HandleError is a function you've defined to handle errors
		return
	}

	progressionData.RankImages = rankImages
	progressionData.RankImages = rankImages

}

func HandleProgression(c *gin.Context) {
	// Get GamerInfo from front end
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check for cached data
	var progressionData ProgressionDataToSend
	var rankImages []RankImage
	err := db.GetData("progression_data", bson.M{"gamerinfo.xuid": gamerInfo.XUID}, &progressionData)
	// Match Data from Database found!
	if err == nil {
		PopulatePlayerProgressionData(&progressionData, gamerInfo, c)
		c.JSON(http.StatusOK, progressionData)
		return

	}
	// Endpoint to get total matches played by user
	playerMatchCount := PlayerMatchCount{}
	url := fmt.Sprintf("https://halostats.svc.halowaypoint.com/hi/players/xuid(%s)/matches/count", gamerInfo.XUID)
	makeAPIRequest(gamerInfo.SpartanKey, url, nil, &playerMatchCount)
	matchCount := playerMatchCount.MatchmadeMatchesPlayedCount

	// Get Every Single Match Stat for the player
	allHaloStats, err := GetProgression(gamerInfo, c, matchCount)
	if err != nil {
		HandleError(c, err)
		return
	}

	mergedHaloData := HaloData{}
	var mu sync.Mutex // Mutex for concurrent writes

	if err != nil {
		HandleError(c, err)
		return
	}
	var wg sync.WaitGroup
	// Get Details for each match
	for _, haloStats := range allHaloStats {
		// Loop through the matches in each HaloData batch
		for i := range haloStats.Results {
			wg.Add(1) // Increment the WaitGroup counter

			go func(haloStats HaloData, i int) {
				defer wg.Done() // Decrement the counter when the goroutine completes
				matchID := haloStats.Results[i].MatchId

				// Fetch and format MatchInfo
				fetchedMatch, _ := GetMatchStats(c, gamerInfo.SpartanKey, matchID)
				formattedMatch := formatMatchStats(gamerInfo.SpartanKey, fetchedMatch)
				formattedMatch.MatchInfo = formatMatchTimes(formattedMatch.MatchInfo)
				haloStats.Results[i].Match = formattedMatch

				// For PlaylistInfo
				playlistAssetID := haloStats.Results[i].Match.MatchInfo.Playlist.AssetId
				playlistVersionID := haloStats.Results[i].Match.MatchInfo.Playlist.VersionId
				if playlistAssetID == "" || playlistVersionID == "" {
					return
				}
				var playlistInfo PlaylistInfo
				err := FetchPlaylistDetails(gamerInfo.SpartanKey, playlistAssetID, playlistVersionID, &playlistInfo)

				if err != nil {
					fmt.Println("Error fetching playlist details ", err)
					return
				} else {
					haloStats.Results[i].Match.MatchInfo.PlaylistInfo = playlistInfo
				}
				mu.Lock()
				mergedHaloData.Results = append(mergedHaloData.Results, haloStats.Results[i])
				mu.Unlock()
			}(haloStats, i)
		}
	}

	wg.Wait() // Wait for all goroutines to complete
	careerTrack := GetCareerStats(gamerInfo, c)
	careerLadder := GetCareerLadder(gamerInfo, c)
	careerTrack.CurrentProgress.TotalXPEarned = CalculateTotalXPGainedSoFar(careerLadder, careerTrack.CurrentProgress.Rank) + careerTrack.CurrentProgress.PartialProgress
	rankImages, err = GetRankImagesFromDB()
	if err != nil {
		HandleError(c, err) // Assume HandleError is a function you've defined to handle errors
		return
	}

	targetPlayerId := "xuid(" + gamerInfo.XUID + ")"
	averages, averageDurations := calculateAveragePersonalScoreForPlaylists(mergedHaloData, targetPlayerId)

	// Apply multipliers
	adjustedAverages := applyMultiplierToScores(averages)

	data := ProgressionDataToSend{
		HaloStats:        mergedHaloData,
		GamerInfo:        gamerInfo,
		CareerTrack:      careerTrack,
		CareerLadder:     careerLadder,
		AdjustedAverages: adjustedAverages,
		AverageDurations: averageDurations,
		RankImages:       rankImages,
	}
	data.RankImages = rankImages

	dataToStore := ProgressionDataToSend{
		HaloStats: mergedHaloData,
		GamerInfo: gamerInfo,
	}

	// Cache the data for future use
	err = db.StoreData("progression_data", dataToStore)
	if err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, data)
}

func AreRankImagesStored() (bool, error) {
	var result bson.M
	err := db.GetData("rank_images", bson.M{}, &result)

	if err != nil {
		return false, err
	}
	rankImages, exists := result["rankImages"]
	return exists && len(rankImages.([]interface{})) > 0, nil
}

type RankImageSlice []RankImage

// Bit of a janky approach to sorting each image by rank number but it works!
func (ris RankImageSlice) Len() int           { return len(ris) }
func (ris RankImageSlice) Less(i, j int) bool { return ris[i].Rank < ris[j].Rank }
func (ris RankImageSlice) Swap(i, j int)      { ris[i], ris[j] = ris[j], ris[i] }

func GetAllRankImages(careerLadder CareerLadderResponse, gamerInfo requests.GamerInfo) ([]RankImage, error) {
	var rankImages RankImageSlice
	var mu sync.Mutex
	var wg sync.WaitGroup
	for i := 0; i < len(careerLadder.Ranks); i++ {
		wg.Add(1)
		go func(rankIndex int) {
			defer wg.Done()
			imageData, err := getRankImageData(rankIndex, careerLadder, gamerInfo)
			if err != nil {
				log.Println(err)
				return
			}
			mu.Lock()
			rankImages = append(rankImages, RankImage{
				Rank:  rankIndex,
				Image: imageData,
			})
			mu.Unlock()
		}(i)
	}
	wg.Wait()

	// Sort rankImages by Rank in ascending order
	sort.Sort(rankImages)

	// Store each RankImage as a separate document
	for _, rankImage := range rankImages {
		err := db.StoreData("rank_images", rankImage)
		if err != nil {
			return nil, err
		}
	}

	return rankImages, nil
}
func getRankImageData(rankIndex int, careerLadder CareerLadderResponse, gamerInfo requests.GamerInfo) (string, error) {
	rankLargeIcon := careerLadder.Ranks[rankIndex].RankLargeIcon
	url := fmt.Sprintf("https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/%s", rankLargeIcon)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("x-343-authorization-spartan", gamerInfo.SpartanKey)

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	base64ImageData := base64.StdEncoding.EncodeToString(data)
	return base64ImageData, nil
}

func GetCareerRankImage(careerLadder CareerLadderResponse, careerTrack *RewardTrackResponse, gamerInfo requests.GamerInfo) {
	currentRankIndex := careerTrack.CurrentProgress.Rank

	// Get image data for current rank
	imageData, err := getRankImageData(currentRankIndex, careerLadder, gamerInfo)
	if err != nil {
		fmt.Println(err)
		return
	}
	careerTrack.CurrentProgress.RankIconData = imageData

	// Get image data for previous rank, if applicable
	if currentRankIndex > 0 {
		imageData, err := getRankImageData(currentRankIndex-1, careerLadder, gamerInfo)
		if err != nil {
			fmt.Println(err)
		} else {
			careerTrack.CurrentProgress.PreviousRankIconData = imageData
		}
	}

	// Get image data for next rank, if applicable
	if currentRankIndex < len(careerLadder.Ranks)-1 {
		imageData, err := getRankImageData(currentRankIndex+1, careerLadder, gamerInfo)
		if err != nil {
			fmt.Println(err)
		} else {
			careerTrack.CurrentProgress.NextRankIconData = imageData
		}
	}
}

func CalculateTotalXPGainedSoFar(careerLadder CareerLadderResponse, currentRank int) int {
	totalXpRequiredForRank := 0

	for _, rankInfo := range careerLadder.Ranks {
		totalXpRequiredForRank += rankInfo.XpRequiredForRank

		if rankInfo.Rank >= currentRank {
			break
		}
	}

	return totalXpRequiredForRank
}

func GetProgression(gamerInfo requests.GamerInfo, c *gin.Context, targetMatchCount int) ([]HaloData, error) {
	var allData []HaloData
	dataChan := make(chan HaloData)
	errChan := make(chan error)

	numRequests := (targetMatchCount + 24) / 25
	var wg sync.WaitGroup
	wg.Add(numRequests)

	for start := 0; start < targetMatchCount; start += 25 {
		go func(start int) {
			defer wg.Done()
			var data HaloData
			url := fmt.Sprintf("https://halostats.svc.halowaypoint.com/hi/players/xuid(%s)/matches?start=%d&count=25", gamerInfo.XUID, start)

			if err := makeAPIRequest(gamerInfo.SpartanKey, url, nil, &data); err != nil {
				errChan <- err
				return
			}

			dataChan <- data
		}(start)
	}

	go func() {
		wg.Wait()
		close(dataChan)
		close(errChan)
	}()

	for i := 0; i < numRequests; i++ {
		select {
		case data := <-dataChan:
			allData = append(allData, data)
		case err := <-errChan:
			return nil, err
		}
	}

	return allData, nil
}

func GetCareerLadder(gamerInfo requests.GamerInfo, c *gin.Context) CareerLadderResponse {
	url := "https://gamecms-hacs.svc.halowaypoint.com/hi/Progression/file/RewardTracks/CareerRanks/careerRank1.json"
	var careerLadder CareerLadderResponse

	headers := map[string]string{
		"343-clearance": gamerInfo.ClearanceCode,
	}

	if err := makeAPIRequest(gamerInfo.SpartanKey, url, headers, &careerLadder); err != nil {
		log.Fatal("Error:", err)
	}

	return careerLadder
}

func GetCareerStats(gamerInfo requests.GamerInfo, c *gin.Context) RewardTrackResponse {
	url := fmt.Sprintf("https://economy.svc.halowaypoint.com/hi/players/xuid(%s)/rewardtracks/careerranks/careerrank1", gamerInfo.XUID)
	var careerTrack RewardTrackResponse

	headers := map[string]string{
		"343-clearance": gamerInfo.ClearanceCode,
	}

	if err := makeAPIRequest(gamerInfo.SpartanKey, url, headers, &careerTrack); err != nil {
		log.Fatal("Error:", err)
	}

	return careerTrack
}

func calculateAveragePersonalScoreForPlaylists(data HaloData, targetPlayerId string) (map[string]float64, map[string]string) {
	sums := make(map[string]int)
	counts := make(map[string]int)
	layoutInput := time.RFC3339Nano // Layout to parse the input time
	averageDurations := make(map[string]string)
	durationSums := make(map[string]time.Duration)
	cutoffDate, err := time.Parse("01/02/2006", "06/20/2023")
	if err != nil {
		fmt.Println("Error parsing cutoff date:", err)
		return map[string]float64{}, nil
	}
	for _, result := range data.Results {
		if !result.PresentAtEndOfMatch {
			continue
		}

		// Parse the start time and check if it's before the cutoff date
		startTime, err := time.Parse(layoutInput, result.Match.MatchInfo.StartTime)
		if err != nil {
			fmt.Println("Error parsing start time:", err)
			continue
		}

		if startTime.Before(cutoffDate) {
			continue
		}

		// Identify the playlist name
		playlistName := result.Match.MatchInfo.PlaylistInfo.PublicName
		// Parse duration
		durationStr := result.Match.MatchInfo.Duration
		re := regexp.MustCompile(`PT(\d+)M(\d+(\.\d+)?)S`)
		matches := re.FindStringSubmatch(durationStr)
		if matches == nil {
			fmt.Println("Failed to parse Duration:", durationStr)
			continue
		}
		minutes, _ := strconv.Atoi(matches[1])
		seconds, _ := strconv.ParseFloat(matches[2], 64)
		duration := time.Duration(minutes)*time.Minute + time.Duration(seconds*1e9)*time.Nanosecond

		if _, exists := durationSums[playlistName]; !exists {
			durationSums[playlistName] = 0
		}
		durationSums[playlistName] += duration

		for _, player := range result.Match.Players {
			if player.PlayerId != targetPlayerId {
				continue
			}

			// Loop through the player's team stats to get the PersonalScore.
			for _, teamStat := range player.PlayerTeamStats {
				personalScore := teamStat.Stats.CoreStats.PersonalScore

				if _, exists := sums[playlistName]; !exists {
					sums[playlistName] = 0
					counts[playlistName] = 0
				}
				sums[playlistName] += personalScore
				counts[playlistName]++
			}
		}
	}

	// Calculate averages
	averages := make(map[string]float64)
	for playlist, sum := range sums {
		averages[playlist] = float64(sum) / float64(counts[playlist])
		averageDuration := durationSums[playlist] / time.Duration(counts[playlist])
		minutes := int(averageDuration.Minutes())
		seconds := int(averageDuration.Seconds()) % 60
		averageDurations[playlist] = fmt.Sprintf("%02d:%02d", minutes, seconds)
		fmt.Printf("Average duration for playlist %s: %s\n", playlist, averageDurations[playlist])
	}

	return averages, averageDurations
}

func getPlaylistMultipliers() map[string]float64 {
	return map[string]float64{
		"Bot Bootcamp": 0.2,
		// Add other playlist names and multipliers here
	}
}

// Some playlist allow for higher score multipliers
func applyMultiplierToScores(averages map[string]float64) map[string]int {
	multipliers := getPlaylistMultipliers()
	adjustedAverages := make(map[string]int)

	for playlist, average := range averages {
		multiplier, exists := multipliers[playlist]

		// Default Multiplier
		if !exists {
			multiplier = 1.0
		}
		// Big Team Battle Multiplier
		if strings.Contains(playlist, "BTB") || strings.Contains(playlist, "Big Team") {
			multiplier = 1.8
		}

		adjustedAverages[playlist] = int(average * multiplier)
	}

	return adjustedAverages
}
