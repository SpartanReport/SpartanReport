package spartanreport

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"spartanreport/db"
	requests "spartanreport/requests"
	. "spartanreport/structures"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis"
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

type ItemResponse struct {
	CommonData        Item        `json:"CommonData"`
	IsKit             bool        `json:"IsKit"`
	KitBaseThemePath  string      `json:"KitBaseThemePath"`
	Coatings          ItemOptions `json:"Coatings"`
	Visors            ItemOptions `json:"Visors"`
	Helmets           ItemOptions `json:"Helmets"`
	LeftShoulderPads  ItemOptions `json:"LeftShoulderPads"`
	RightShoulderPads ItemOptions `json:"RightShoulderPads"`
	Gloves            ItemOptions `json:"Gloves"`
	KneePads          ItemOptions `json:"KneePads"`
	WristAttachments  ItemOptions `json:"WristAttachments"`
	ChestAttachments  ItemOptions `json:"ChestAttachments"`
	HipAttachments    ItemOptions `json:"HipAttachments"`
}
type Title struct {
	Value string `json:"value"`
}
type Item struct {
	Title             Title        `json:"Title"`
	IsCrossCompatible bool         `json:"IsCrossCompatible"`
	SeasonNumber      int          `json:"SeasonNumber"`
	Quality           string       `json:"Quality"`
	ManufacturerId    int          `json:"ManufacturerId"`
	CoreTitle         string       `json:"CoreTitle"`
	Media             DisplayPath  `json:"DisplayPath"`
	ParentPaths       []ParentPath `json:"ParentPaths"`
	Description       Field        `json:"Description"`
	Core              string       `json:"Core"`
}
type ParentPath struct {
	Path string `json:"Path"`
	Type string `json:"Type"`
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

func (od OperationsData) IsEmpty() bool {
	// Adjust the condition based on what signifies an empty OperationsData
	return len(od.Seasons.Seasons) == 0
}

type SpecificOpsData struct {
	GamerInfo requests.GamerInfo `json:"gamerInfo"`
	Season    Season             `json:"seasonData"`
}

// Struct to hold the path and the image data
type RewardResult struct {
	Path         string
	ImageData    string
	Item         Item
	DetailedItem ItemResponse
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
	ActiveOperationRewardTrackPath    string                `json:"ActiveOperationRewardTrackPath"`
	OperationRewardTracks             OperationRewardTracks `json:"OperationRewardTracks"`
	ScheduledOperationRewardTrackPath string                `json:"ScheduledOperationRewardTrackPath"`
}

var (
	seasonCache *SeasonCache
	once        sync.Once
)

type SeasonCache struct {
}

func (sc *SeasonCache) Get(ctx context.Context, seasonID string) (Seasons, bool) {
	val, err := db.RedisClient.Get(ctx, seasonID).Result()
	if err != nil {
		if err == redis.Nil {
			fmt.Println("Covered in nil check")
			return Seasons{}, false
		} else {
			fmt.Printf("Error getting from Redis: %v\n", err)
			return Seasons{}, false
		}
	}

	var data Seasons
	err = json.Unmarshal([]byte(val), &data)
	if err != nil {
		fmt.Println("Error getting", err) // Handle the error appropriately
	}

	return data, true
}

func (sc *SeasonCache) Set(ctx context.Context, seasonID string, data Seasons) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		panic(err) // Handle the error appropriately
	}

	// Set in Redis only if it does not already exist
	_, err = db.RedisClient.SetNX(ctx, seasonID, jsonData, 0).Result()
	if err != nil {
		panic(err) // Handle the error appropriately
	}
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
	} else if strings.Contains(inventoryItemPath, "hws") {
		return "Mark IV Core"
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
	} else if strings.Contains(inventoryItemPath, "hws") {
		return "017-001-hws-c13d0b38"
	}
	// If none of the keywords match, return "Unknown Core"
	return "Unknown Core"
}

func HandleOperations(c *gin.Context) {
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		fmt.Println("Couldn't bind")
		return
	}

	ctx := context.Background()
	seasonCache := &SeasonCache{}

	// Use a static key for all season data
	const seasonDataKey = "SeasonData"

	// Check Redis cache first
	seasonsData, found := seasonCache.Get(ctx, seasonDataKey)
	if !found {
		// Make API request if data not in cache
		seasons := Seasons{}
		err := makeAPIRequest(gamerInfo.SpartanKey, "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/calendars/seasons/seasoncalendar.json", nil, &seasons)
		if err != nil {
			fmt.Println("Error Obtaining Season Info")
			return
		}

		processSeasons(gamerInfo, &seasons, true)
		seasonsData = seasons
	}

	// Respond with the seasons data
	data := OperationsData{
		Seasons:   seasonsData,
		GamerInfo: gamerInfo,
	}
	c.JSON(http.StatusOK, data)
}
func processSeasons(gamerInfo requests.GamerInfo, seasons *Seasons, cache bool) {
	// Populate IsActive flag
	currentTime := time.Now().UTC()
	for i := range seasons.Seasons {
		startTime, _ := time.Parse(time.RFC3339, seasons.Seasons[i].StartDate.ISO8601Date)
		endTime, _ := time.Parse(time.RFC3339, seasons.Seasons[i].EndDate.ISO8601Date)
		seasons.Seasons[i].IsActive = currentTime.After(startTime) && currentTime.Before(endTime)
		seasons.Seasons[i].SeasonMetadataDetails = GetSeasonMetadata(gamerInfo, seasons.Seasons[i])

	}

	// Sort seasons by start date in descending order
	sort.Slice(seasons.Seasons, func(i, j int) bool {
		startTimeI, _ := time.Parse(time.RFC3339, seasons.Seasons[i].StartDate.ISO8601Date)
		startTimeJ, _ := time.Parse(time.RFC3339, seasons.Seasons[j].StartDate.ISO8601Date)
		return startTimeI.After(startTimeJ)
	})

	ctx := context.Background()
	seasonCache := &SeasonCache{}

	// Cache the processed seasons data using a static key
	const seasonDataKey = "SeasonData"
	seasonCache.Set(ctx, seasonDataKey, *seasons)

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
					result.ImageData, _ = compressPNGWithImaging(result.ImageData, false, 0, 0)
					rank.FreeRewards.InventoryRewards[idx].ItemImageData = result.ImageData
					rank.FreeRewards.InventoryRewards[idx].ItemMetaData = result.Item
					ctx := context.Background()
					itemPath := rank.FreeRewards.InventoryRewards[idx].InventoryItemPath
					itemBytes, err := json.Marshal(rank.FreeRewards.InventoryRewards[idx])
					if err != nil {
						fmt.Println("Error marshalling item: ", err)
					}
					if err := db.RedisClient.HSet(ctx, "items", itemPath, itemBytes).Err(); err != nil {
						fmt.Printf("error setting value in Redis: %v", err)
					}
				}
			}
			for idx, currReward := range rank.FreeRewards.CurrencyRewards {
				if currReward.CurrencyPath == result.Path {
					result.ImageData, _ = compressPNGWithImaging(result.ImageData, false, 0, 0)

					rank.FreeRewards.CurrencyRewards[idx].ItemImageData = result.ImageData
					rank.FreeRewards.CurrencyRewards[idx].ItemMetaData = result.Item

				}
			}

			// Update Paid Rewards
			for idx, invReward := range rank.PaidRewards.InventoryRewards {
				if invReward.InventoryItemPath == result.Path {
					result.ImageData, _ = compressPNGWithImaging(result.ImageData, false, 0, 0)

					rank.PaidRewards.InventoryRewards[idx].ItemImageData = result.ImageData
					rank.PaidRewards.InventoryRewards[idx].ItemMetaData = result.Item
					ctx := context.Background()
					itemPath := rank.PaidRewards.InventoryRewards[idx].InventoryItemPath
					itemBytes, err := json.Marshal(rank.PaidRewards.InventoryRewards[idx])
					if err != nil {
						fmt.Printf("error marshalling value in Redis: %v", err)
					}
					if err := db.RedisClient.HSet(ctx, "items", itemPath, itemBytes).Err(); err != nil {
						fmt.Printf("error setting value in Redis: %v", err)
					}

				}
			}
			for idx, currReward := range rank.PaidRewards.CurrencyRewards {
				if currReward.CurrencyPath == result.Path {
					result.ImageData, _ = compressPNGWithImaging(result.ImageData, false, 0, 0)

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

	// Special Case: WC3
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

	// Compress Images
	metadata.SeasonImage, err = compressPNGWithImaging(metadata.SeasonImage, false, 0, 0)
	return metadata
}
