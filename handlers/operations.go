package halotestapp

import (
	"fmt"
	requests "halotestapp/requests"
	"net/http"
	"sort"
	"time"

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
	StartDate             Date `json:"StartDate"`
	EndDate               Date `json:"EndDate"`
	IsActive              bool `json:"IsActive"`
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
}

type CurrencyReward struct {
	CurrencyPath  string `json:"CurrencyPath"`
	Amount        int    `json:"Amount"`
	ItemImageData string `json:"ItemImageData"`
}
type Reward struct {
	InventoryRewards []InventoryReward `json:"InventoryRewards"` // I changed this to a slice
	CurrencyRewards  []CurrencyReward  `json:"CurrencyRewards"`  // I changed this to a slice
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

type Item struct {
	IsCrossCompatible bool        `json:"IsCrossCompatible"`
	SeasonNumber      int         `json:"SeasonNumber"`
	Quality           string      `json:"Quality"`
	Media             DisplayPath `json:"DisplayPath"`
	Description       Field       `json:"Description"`
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
	Seasons   Seasons
	GamerInfo requests.GamerInfo
}
type SpecificOpsData struct {
	GamerInfo requests.GamerInfo `json:"gamerInfo"`
	Season    Season             `json:"seasonData"`
}

// Struct to hold the path and the image data
type RewardResult struct {
	Path      string
	ImageData string
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

	data := OperationsData{
		Seasons:   seasons,
		GamerInfo: gamerInfo,
	}

	c.JSON(http.StatusOK, data)
}

func HandleOperationDetails(c *gin.Context) {
	var SpecificOpsData SpecificOpsData
	if err := c.ShouldBindJSON(&SpecificOpsData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	gamerInfo := SpecificOpsData.GamerInfo
	season := SpecificOpsData.Season
	track := GetSeasonRewards(gamerInfo, season)
	track.Ranks = GetTrackImages(gamerInfo, track.Ranks)
	fmt.Println("Sending Track Data")
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
func printItemDetails(item Item) {
	fmt.Println("IsCrossCompatible:", item.IsCrossCompatible)
	fmt.Println("SeasonNumber:", item.SeasonNumber)
	fmt.Println("Quality:", item.Quality)
	fmt.Println("Media Path:", item.Media.Media.MediaUrl.Path)
	fmt.Println("Description:", item.Description.Value) // Assuming Field type has a value field
}

func GetTrackImages(gamerInfo requests.GamerInfo, Ranks []Rank) []Rank {
	// Create a channel to receive the results
	results := make(chan RewardResult)

	// Function to make an API request and send the result to the channel
	makeRequest := func(path string) {
		url := "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/" + path
		currentItemResponse := ItemResponse{}
		// Make API Request to get item data
		err := makeAPIRequest(gamerInfo.SpartanKey, url, nil, &currentItemResponse)
		printItemDetails(currentItemResponse.CommonData)
		if err != nil {
			fmt.Println("Error making request for item data: ", err)
		}
		// Next, Get the image data for that item
		itemImagePath := currentItemResponse.CommonData.Media.Media.MediaUrl.Path
		url = "https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/" + itemImagePath
		rawImageData, err := makeAPIRequestImage(gamerInfo.SpartanKey, url, nil)
		if err != nil {
			fmt.Println("Error getting item image: ", err)
			results <- RewardResult{} // Send an empty result to ensure channel doesn't block
		} else {
			results <- RewardResult{Path: path, ImageData: rawImageData}
		}
	}

	totalPaths := 0

	for _, rank := range Ranks {
		fmt.Println("Rank ", rank.Rank)
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
				}
			}
			for idx, currReward := range rank.FreeRewards.CurrencyRewards {
				if currReward.CurrencyPath == result.Path {
					rank.FreeRewards.CurrencyRewards[idx].ItemImageData = result.ImageData
				}
			}

			// Update Paid Rewards
			for idx, invReward := range rank.PaidRewards.InventoryRewards {
				if invReward.InventoryItemPath == result.Path {
					rank.PaidRewards.InventoryRewards[idx].ItemImageData = result.ImageData
				}
			}
			for idx, currReward := range rank.PaidRewards.CurrencyRewards {
				if currReward.CurrencyPath == result.Path {
					rank.PaidRewards.CurrencyRewards[idx].ItemImageData = result.ImageData
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
	// Get Season Background Image
	url = "https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/" + metadata.CardBackgroundImage
	metadata.SeasonImage, err = makeAPIRequestImage(gamerInfo.SpartanKey, url, nil)
	if err != nil {
		fmt.Println("Error while getting season image: ", err)
		return metadata

	}
	return metadata
}
