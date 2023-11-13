package spartanreport

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"spartanreport/db"
	requests "spartanreport/requests"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gin-gonic/gin"
)

type Date struct {
	ISO8601Date  string `json:"ISO8601Date"`
	FormatedDate string `json:"FormatedDate"`
}

type Seasons struct {
	Seasons []Season `json:"Seasons"`
}

type Season struct {
	CsrSeasonFilePath     string `json:"CsrSeasonFilePath"`
	OperationTrackPath    string `json:"OperationTrackPath"`
	SeasonMetadata        string `json:"SeasonMetadata"`
	SeasonMetadataDetails SeasonMetadata
	StartDate             Date                  `json:"StartDate"`
	EndDate               Date                  `json:"EndDate"`
	IsActive              bool                  `json:"IsActive"`
	SeasonProgression     OperationRewardTracks `json:"UserSeasonProgression"`
}

type Event struct {
	RewardTrackPath string `json:"RewardTrackPath"`
	StartDate       Date   `json:"StartDate"`
	EndDate         Date   `json:"EndDate"`
}

type Root struct {
	Seasons []Season `json:"Seasons"`
	Events  []Event  `json:"Events"`
}

// What's returned from SeasonMetadata path query
type SeasonMetadata struct {
	DateRange                       Field  `json:"DateRange"`
	Name                            Field  `json:"Name"`
	Logo                            string `json:"Logo"`
	Number                          int    `json:"Number"`
	Description                     Field  `json:"Description"`
	SummaryBackgroundPath           string `json:"SummaryBackgroundPath"`
	ChallengesBackgroundPath        string `json:"ChallengesBackgroundPath"`
	BattlePassLogoImage             string `json:"BattlePassLogoImage"`
	SeasonLogoImage                 string `json:"SeasonLogoImage"`
	RitualLogoImage                 string `json:"RitualLogoImage"`
	StorefrontBackgroundImage       string `json:"StorefrontBackgroundImage"`
	CardBackgroundImage             string `json:"CardBackgroundImage"`
	NarrativeBlurb                  Field  `json:"NarrativeBlurb"`
	BattlePassSeasonUpsellImagePath string `json:"BattlePassSeasonUpsellBackgroundImage"`
	ProgressionBackgroundImage      string `json:"ProgressionBackgroundImage"`
	SeasonImage                     string `json:"SeasonImage"`
}

type Field struct {
	Status       string            `json:"status"`
	Value        string            `json:"value"`
	Translations map[string]string `json:"translations"`
}

// What's returned from OperationTrackPath query

type InventoryReward struct {
	InventoryItemPath string `json:"InventoryItemPath"`
	Amount            int    `json:"Amount"`
	Type              string `json:"Type"`
	ItemImageData     string `json:"ItemImageData"`
	ItemMetaData      Item   `json:"Item"`
}

type CurrencyReward struct {
	CurrencyPath  string `json:"CurrencyPath"`
	Amount        int    `json:"Amount"`
	ItemImageData string `json:"ItemImageData"`
	ItemMetaData  Item   `json:"Item"`
}
type Reward struct {
	InventoryRewards []InventoryReward `json:"InventoryRewards"`
	CurrencyRewards  []CurrencyReward  `json:"CurrencyRewards"`
}
type Rank struct {
	Rank        int    `json:"Rank"`
	FreeRewards Reward `json:"FreeRewards"`
	PaidRewards Reward `json:"PaidRewards"`
}

type LocalizedField struct {
	Status       string            `json:"status"`
	Value        string            `json:"value"`
	Translations map[string]string `json:"translations"`
}

type Track struct {
	TrackId             string         `json:"TrackId"`
	XpPerRank           int            `json:"XpPerRank"`
	HideIfNotOwned      bool           `json:"HideIfNotOwned"`
	Ranks               []Rank         `json:"Ranks"`
	Name                LocalizedField `json:"Name"`
	Description         LocalizedField `json:"Description"`
	OperationNumber     int            `json:"OperationNumber"`
	DateRange           LocalizedField `json:"DateRange"`
	IsRitual            bool           `json:"IsRitual"`
	SummaryImagePath    string         `json:"SummaryImagePath"`
	WeekNumber          interface{}    `json:"WeekNumber"`
	BackgroundImagePath string         `json:"BackgroundImagePath"`
}

// Individual Item Data

type ItemResponse struct {
	CommonData Item `json:"CommonData"`
}
type Title struct {
	Value string `json:"value"`
}
type Item struct {
	Title             Title       `json:"Title"`
	IsCrossCompatible bool        `json:"IsCrossCompatible"`
	SeasonNumber      int         `json:"SeasonNumber"`
	Quality           string      `json:"Quality"`
	ManufacturerId    int         `json:"ManufacturerId"`
	CoreTitle         string      `json:"CoreTitle"`
	Media             DisplayPath `json:"DisplayPath"`
	Description       Field       `json:"Description"`
	Core              string      `json:"Core"`
}
type DisplayPath struct {
	Width  int       `json:"Width"`
	Height int       `json:"Height"`
	Media  MediaInfo `json:"Media"`
}

type MediaInfo struct {
	MediaUrl MediaURL `json:"MediaUrl"`
}

type MediaURL struct {
	Path string `json:"Path"`
}

type OperationsData struct {
	Seasons         Seasons
	GamerInfo       requests.GamerInfo
	UserProgression UserSeasonProgression
}
type SpecificOpsData struct {
	GamerInfo requests.GamerInfo `json:"gamerInfo"`
	Season    Season             `json:"seasonData"`
}

// Struct to hold the path and the image data
type RewardResult struct {
	Path      string
	ImageData string
	Item      Item
}
type StoredData struct {
	SeasonOperationTrackPath string `bson:"season_operation_track_path"`
	Data                     Track  `bson:"data"`
}

type CurrentProgressSeason struct {
	Rank              int  `json:"Rank"`
	PartialProgress   int  `json:"PartialProgress"`
	IsOwned           bool `json:"IsOwned"`
	HasReachedMaxRank bool `json:"HasReachedMaxRank"`
}

type OperationRewardTracks struct {
	RewardTrackPath  string          `json:"RewardTrackPath"`
	TrackType        string          `json:"TrackType"`
	CurrentProgress  CurrentProgress `json:"CurrentProgress"`
	PreviousProgress interface{}     `json:"PreviousProgress"`
	IsOwned          bool            `json:"IsOwned"`
	BaseXp           interface{}     `json:"BaseXp"`
	BoostXp          interface{}     `json:"BoostXp"`
}

type UserSeasonProgression struct {
	ActiveOperationRewardTrackPath    string                  `json:"ActiveOperationRewardTrackPath"`
	OperationRewardTracks             []OperationRewardTracks `json:"OperationRewardTracks"`
	ScheduledOperationRewardTrackPath string                  `json:"ScheduledOperationRewardTrackPath"`
}

func appendMatchingSeasonProgression(seasons []Season, userSeasonProgression UserSeasonProgression) []Season {
	for i := range seasons {
		for _, operationRewardTrack := range userSeasonProgression.OperationRewardTracks {
			if operationRewardTrack.RewardTrackPath == seasons[i].OperationTrackPath {
				seasons[i].SeasonProgression = operationRewardTrack
				break
			}
		}
	}
	return seasons
}

func getCoreFromInventoryItemPath(inventoryItemPath string) string {
	if strings.Contains(inventoryItemPath, "olympus") {
		return "Mark VII Core"
	} else if strings.Contains(inventoryItemPath, "reach") {
		return "Mark V [B] Core"
	} else if strings.Contains(inventoryItemPath, "wlv") {
		return "Rakshasa Core"
	} else if strings.Contains(inventoryItemPath, "spi") {
		return "Mirage Core"
	} else if strings.Contains(inventoryItemPath, "samurai") {
		return "Yoroi Core"
	} else if strings.Contains(inventoryItemPath, "eag") {
		return "Eaglestrike Core"
	} else if strings.Contains(inventoryItemPath, "fwl") {
		return "Chimera Core"
	} else if strings.Contains(inventoryItemPath, "haz") {
		return "Hazmat Core"
	}
	// If none of the keywords match, return "Unknown Core"
	return "Unknown Core"
}

func getCoreIDFromInventoryItemPath(inventoryItemPath string) string {
	if strings.Contains(inventoryItemPath, "olympus") {
		return "017-001-olympus-c13d0b38"
	} else if strings.Contains(inventoryItemPath, "reach") {
		return "017-001-reach-2564121f"
	} else if strings.Contains(inventoryItemPath, "wlv") {
		return "017-001-wlv-c13d0b38"
	} else if strings.Contains(inventoryItemPath, "spi") {
		return "017-001-spi-c13d0b38"
	} else if strings.Contains(inventoryItemPath, "samurai") {
		return "017-001-samurai-55badb14"
	} else if strings.Contains(inventoryItemPath, "eag") {
		return "017-001-eag-c13d0b38"
	} else if strings.Contains(inventoryItemPath, "fwl") {
		return "017-001-fwl-c13d0b38"
	} else if strings.Contains(inventoryItemPath, "haz") {
		return "017-001-haz-c13d0b38"
	}
	// If none of the keywords match, return "Unknown Core"
	return "Unknown Core"
}
func HandleOperations(c *gin.Context) {
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	seasons := Seasons{}
	err := makeAPIRequest(gamerInfo.SpartanKey, "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/calendars/seasons/seasoncalendar.json", nil, &seasons)
	if err != nil {
		fmt.Println("Error Obtaining Season Info")
		return
	}

	// Populate IsActive flag
	currentTime := time.Now().UTC()
	for i := range seasons.Seasons {
		startTime, _ := time.Parse(time.RFC3339, seasons.Seasons[i].StartDate.ISO8601Date)
		endTime, _ := time.Parse(time.RFC3339, seasons.Seasons[i].EndDate.ISO8601Date)
		seasons.Seasons[i].IsActive = currentTime.After(startTime) && currentTime.Before(endTime)
	}

	// Sort by start date
	sort.Slice(seasons.Seasons, func(i, j int) bool {
		startTimeI, _ := time.Parse(time.RFC3339, seasons.Seasons[i].StartDate.ISO8601Date)
		startTimeJ, _ := time.Parse(time.RFC3339, seasons.Seasons[j].StartDate.ISO8601Date)
		return startTimeI.After(startTimeJ)
	})

	// Printing out each season
	for i, season := range seasons.Seasons {
		fmt.Printf("Season %d:\n", i)
		fmt.Printf("  CsrSeasonFilePath: %s\n", season.CsrSeasonFilePath)
		fmt.Printf("  OperationTrackPath: %s\n", season.OperationTrackPath)
		fmt.Printf("  SeasonMetadata: %s\n", season.SeasonMetadata)
		fmt.Printf("  StartDate: %s\n", season.StartDate.ISO8601Date)
		fmt.Printf("  EndDate: %s\n", season.EndDate.ISO8601Date)
		fmt.Printf("  IsActive: %t\n", season.IsActive)

		// Get Season Metadata details
		season := &seasons.Seasons[i]
		season.SeasonMetadataDetails = GetSeasonMetadata(gamerInfo, *season)

	}
	userProgress := UserSeasonProgression{}

	// Get Season Progress
	if gamerInfo.XUID != "" {
		url := "https://economy.svc.halowaypoint.com/hi/players/xuid(" + gamerInfo.XUID + ")/rewardtracks/operations?view=all"
		hdrs := map[string]string{}
		hdrs["343-clearance"] = gamerInfo.ClearanceCode
		err = makeAPIRequest(gamerInfo.SpartanKey, url, hdrs, &userProgress)
		if err != nil {
			fmt.Println("Error while getting user season progression: ", err)
			return
		}
		seasons.Seasons = appendMatchingSeasonProgression(seasons.Seasons, userProgress)
	}

	data := OperationsData{
		Seasons:   seasons,
		GamerInfo: gamerInfo,
	}

	c.JSON(http.StatusOK, data)
}

func LoadArmorCores(gamerInfo requests.GamerInfo, armorcore string) {
	url := "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/cores/armorcores/" + armorcore + ".json"
	currentItemResponse := ItemResponse{}

	// Make API Request to get item data
	err := makeAPIRequest(gamerInfo.SpartanKey, url, nil, &currentItemResponse)
	if err != nil {
		fmt.Println("Error making request for item data: ", err)
	}
	itemImagePath := currentItemResponse.CommonData.Media.Media.MediaUrl.Path
	url = "https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/" + itemImagePath
	rawImageData, err := makeAPIRequestImage(gamerInfo.SpartanKey, url, nil)
	path := "cores/armorcores/" + armorcore + ".json"
	t := RewardResult{Path: path, ImageData: rawImageData, Item: currentItemResponse.CommonData}
	/*
		type InventoryReward struct {
			InventoryItemPath string `json:"InventoryItemPath"`
			Amount            int    `json:"Amount"`
			Type              string `json:"Type"`
			ItemImageData     string `json:"ItemImageData"`
			ItemMetaData      Item   `json:"Item"`
		}
	*/
	reward := InventoryReward{}
	reward.InventoryItemPath = t.Path
	reward.Amount = 1
	reward.Type = "ArmorCore"
	reward.ItemImageData = rawImageData
	reward.ItemMetaData = currentItemResponse.CommonData
	reward.ItemMetaData.Core = armorcore
	db.StoreData("item_data", reward)

}

func HandleOperationDetails(c *gin.Context) {
	var SpecificOpsData SpecificOpsData
	if err := c.ShouldBindJSON(&SpecificOpsData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	gamerInfo := SpecificOpsData.GamerInfo
	season := SpecificOpsData.Season
	key := season.OperationTrackPath
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't initialize GCS client"})
		return
	}
	bucket := client.Bucket("haloseasondata")
	obj := bucket.Object(key)

	// Quick Function to load all armor cores

	// Try to read the data from Google Cloud Storage first
	rc, err := obj.NewReader(ctx)
	if err == nil {
		// Data exists, decode and return it
		var trackData Track
		if err := json.NewDecoder(rc).Decode(&trackData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't decode stored data"})
			return
		}
		rc.Close()
		c.JSON(http.StatusOK, trackData)
		return
	} else if err != storage.ErrObjectNotExist {
		// Some other error occurred
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't retrieve data"})
		return
	}

	// If data doesn't exist, fetch and store it
	track := GetSeasonRewards(gamerInfo, season)
	track.Ranks = GetTrackImages(gamerInfo, track.Ranks)

	// Store the data into Google Cloud Storage
	wc := obj.NewWriter(ctx)
	if err := json.NewEncoder(wc).Encode(track); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't encode data"})
		return
	}
	if err := wc.Close(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't write data"})
		return
	}

	c.JSON(http.StatusOK, track)
}

func GetSeasonRewards(gamerInfo requests.GamerInfo, season Season) Track {
	url := "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/" + season.OperationTrackPath
	trackData := Track{}
	err := makeAPIRequest(gamerInfo.SpartanKey, url, nil, &trackData)
	if err != nil {
		fmt.Println("Error when getting track data: ", err)
		return trackData
	}
	return trackData
}

func GetTrackImages(gamerInfo requests.GamerInfo, Ranks []Rank) []Rank {
	// Create a channel to receive the results
	results := make(chan RewardResult)

	// Function to make an API request and send the result to the channel
	makeRequest := func(path string) {
		// Determine the core based on InventoryItemPath
		core := getCoreFromInventoryItemPath(path)
		url := "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/" + path
		currentItemResponse := ItemResponse{}

		// Make API Request to get item data
		err := makeAPIRequest(gamerInfo.SpartanKey, url, nil, &currentItemResponse)
		if err != nil {
			fmt.Println("Error making request for item data: ", err)
		}
		itemImagePath := currentItemResponse.CommonData.Media.Media.MediaUrl.Path
		url = "https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/" + itemImagePath
		rawImageData, err := makeAPIRequestImage(gamerInfo.SpartanKey, url, nil)
		if err != nil {
			fmt.Println("Error getting item image: ", err)
			results <- RewardResult{} // Send an empty result to ensure channel doesn't block
		} else {
			currentItemResponse.CommonData.CoreTitle = core // Assign Core
			results <- RewardResult{Path: path, ImageData: rawImageData, Item: currentItemResponse.CommonData}
		}
	}

	totalPaths := 0

	for _, rank := range Ranks {
		// Free Rewards
		for _, invReward := range rank.FreeRewards.InventoryRewards {
			if invReward.InventoryItemPath != "" {
				go makeRequest(invReward.InventoryItemPath)
				totalPaths++
			}
		}
		for _, currReward := range rank.FreeRewards.CurrencyRewards {
			if currReward.CurrencyPath != "" {
				go makeRequest(currReward.CurrencyPath)
				totalPaths++
			}
		}

		// Paid Rewards
		for _, invReward := range rank.PaidRewards.InventoryRewards {
			if invReward.InventoryItemPath != "" {
				go makeRequest(invReward.InventoryItemPath)
				totalPaths++
			}
		}
		for _, currReward := range rank.PaidRewards.CurrencyRewards {
			if currReward.CurrencyPath != "" {
				go makeRequest(currReward.CurrencyPath)
				totalPaths++
			}
		}
	}

	// Collect results from the channel and update the InventoryReward/CurrencyReward structs
	for i := 0; i < totalPaths; i++ {
		result := <-results
		for _, rank := range Ranks {
			// Update Free Rewards
			for idx, invReward := range rank.FreeRewards.InventoryRewards {
				if invReward.InventoryItemPath == result.Path {
					rank.FreeRewards.InventoryRewards[idx].ItemImageData = result.ImageData
					rank.FreeRewards.InventoryRewards[idx].ItemMetaData = result.Item
					db.StoreData("item_data", rank.FreeRewards.InventoryRewards[idx])

				}
			}
			for idx, currReward := range rank.FreeRewards.CurrencyRewards {
				if currReward.CurrencyPath == result.Path {
					rank.FreeRewards.CurrencyRewards[idx].ItemImageData = result.ImageData
					rank.FreeRewards.CurrencyRewards[idx].ItemMetaData = result.Item

				}
			}

			// Update Paid Rewards
			for idx, invReward := range rank.PaidRewards.InventoryRewards {
				if invReward.InventoryItemPath == result.Path {
					rank.PaidRewards.InventoryRewards[idx].ItemImageData = result.ImageData
					rank.PaidRewards.InventoryRewards[idx].ItemMetaData = result.Item
					fmt.Println("Loading in ", rank.PaidRewards.InventoryRewards[idx].ItemMetaData.Title)
					db.StoreData("item_data", rank.PaidRewards.InventoryRewards[idx])

				}
			}
			for idx, currReward := range rank.PaidRewards.CurrencyRewards {
				if currReward.CurrencyPath == result.Path {
					rank.PaidRewards.CurrencyRewards[idx].ItemImageData = result.ImageData
					rank.PaidRewards.CurrencyRewards[idx].ItemMetaData = result.Item

				}
			}
		}
	}
	return Ranks
}

func GetSeasonMetadata(gamerInfo requests.GamerInfo, season Season) SeasonMetadata {
	metadata := SeasonMetadata{}
	url := "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/" + season.SeasonMetadata
	err := makeAPIRequest(gamerInfo.SpartanKey, url, nil, &metadata)
	if err != nil {
		fmt.Println("Error while getting season metadata: ", err)
		return metadata
	}

	// Special Case: WC3 and CA
	if season.OperationTrackPath == "RewardTracks/Operations/S05OpPassM01.json" {
		metadata.SeasonImage, err = makeAPIRequestImage("", "https://wpassets.halowaypoint.com/wp-content/2023/10/OperationCombinedArms.jpg", nil)
		return metadata
	}
	if season.OperationTrackPath == "RewardTracks/Operations/S05OpPassM02.json" {
		metadata.SeasonImage, err = makeAPIRequestImage("", "https://wpassets.halowaypoint.com/wp-content/2023/10/OperationWinterContingency.jpg", nil)
		return metadata
	}
	// Get Season Background Image
	url = "https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/" + metadata.CardBackgroundImage
	metadata.SeasonImage, err = makeAPIRequestImage(gamerInfo.SpartanKey, url, nil)
	if err != nil {
		fmt.Println("Error while getting season image: ", err)
		return metadata

	}
	return metadata
}
