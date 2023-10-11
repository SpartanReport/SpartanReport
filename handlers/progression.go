package halotestapp

import (
	"encoding/base64"
	"fmt"
	requests "halotestapp/requests"
	"io/ioutil"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
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

type ProgressionDataToSend struct {
	HaloStats    HaloData
	GamerInfo    requests.GamerInfo // Assuming GamerInfo is of type requests.GamerInfo
	CareerTrack  RewardTrackResponse
	CareerLadder CareerLadderResponse
}

func HandleProgression(c *gin.Context) {
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	/* Let's assume you want to fetch 500 matches for this example
	targetMatchCount := 25
	allHaloStats, err := GetProgression(gamerInfo, c, targetMatchCount)
	if err != nil {
		HandleError(c, err)
		return
	}
	// Initialize an empty HaloData to store the merged results
	// mergedHaloData := HaloData{}
	// var mu sync.Mutex // Mutex for concurrent writes

	if err != nil {
		HandleError(c, err)
		return
	}
	*/
	var wg sync.WaitGroup

	/* Loop through each batch of HaloData
	for _, haloStats := range allHaloStats {
		// Loop through the matches in each HaloData batch
		for i := range haloStats.Results {
			wg.Add(1) // Increment the WaitGroup counter

			go func(haloStats HaloData, i int) {
				defer wg.Done() // Decrement the counter when the goroutine completes
				matchID := haloStats.Results[i].MatchId

				// Fetch and format MatchInfo
				fetchedMatch := GetMatchStats(c, gamerInfo.SpartanKey, matchID)
				formattedMatch := formatMatchStats(gamerInfo.SpartanKey, fetchedMatch) // Assuming formatMatchStats returns Match
				formattedMatch.MatchInfo = formatMatchTimes(formattedMatch.MatchInfo)  // Assuming formatMatchTimes returns MatchInfo
				haloStats.Results[i].Match = formattedMatch

				// For PlaylistInfo
				playlistAssetID := haloStats.Results[i].Match.MatchInfo.Playlist.AssetId
				playlistVersionID := haloStats.Results[i].Match.MatchInfo.Playlist.VersionId

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
	*/

	wg.Wait() // Wait for all goroutines to complete
	careerTrack := GetCareerStats(gamerInfo, c)
	careerLadder := GetCareerLadder(gamerInfo, c)
	careerTrack.CurrentProgress.TotalXPEarned = CalculateTotalXPGainedSoFar(careerLadder, careerTrack.CurrentProgress.Rank) + careerTrack.CurrentProgress.PartialProgress
	GetCareerRankImage(careerLadder, &careerTrack, gamerInfo)
	data := ProgressionDataToSend{
		// HaloStats:    mergedHaloData,
		GamerInfo:    gamerInfo,
		CareerTrack:  careerTrack,
		CareerLadder: careerLadder,
	}
	c.JSON(http.StatusOK, data)
}

func getRankImageData(rankIndex int, careerLadder CareerLadderResponse, gamerInfo requests.GamerInfo) (string, error) {
	rankLargeIcon := careerLadder.Ranks[rankIndex].RankLargeIcon
	url := fmt.Sprintf("https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/%s", rankLargeIcon)

	// Creating the GET request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("x-343-authorization-spartan", gamerInfo.SpartanKey)

	// Sending the GET request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Reading the response body
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// Convert raw image data to base64
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
