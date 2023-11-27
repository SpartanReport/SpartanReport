package spartanreport

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"spartanreport/db"
	requests "spartanreport/requests"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis"
)

type StoreData struct {
	StoreID                  string            `json:"StoreId"`
	StorefrontExpirationDate ISO8601DateStruct `json:"StorefrontExpirationDate"`
	StorefrontDisplayPath    string            `json:"StorefrontDisplayPath"`
	Offerings                []Offering        `json:"Offerings"`
}

type ISO8601DateStruct struct {
	ISO8601Date time.Time `json:"ISO8601Date"`
}

type Offering struct {
	OfferingID             string             `json:"OfferingId"`
	OfferingDisplayPath    string             `json:"OfferingDisplayPath"`
	OfferingExpirationDate *ISO8601DateStruct `json:"OfferingExpirationDate"`
	IncludedItems          []IncludedItem     `json:"IncludedItems"`
	Prices                 []Price            `json:"Prices"`
	IncludedCurrencies     []interface{}      `json:"IncludedCurrencies"`
	IncludedRewardTracks   []interface{}      `json:"IncludedRewardTracks"`
	BoostPath              *string            `json:"BoostPath"`
	OperationXp            int                `json:"OperationXp"`
	EventXp                int                `json:"EventXp"`
	MatchBoosts            *interface{}       `json:"MatchBoosts"`
	RewardTrackAdjustments []interface{}      `json:"RewardTrackAdjustments"`
	OfferingDetails        OfferingDetails    `json:"OfferingDetails"`
}

type IncludedItem struct {
	Amount   int    `json:"Amount"`
	ItemPath string `json:"ItemPath"`
	ItemType string `json:"ItemType"`
}

type Price struct {
	Cost         int    `json:"Cost"`
	CurrencyPath string `json:"CurrencyPath"`
}

type StoreDataToReturn struct {
	gamerInfo requests.GamerInfo
	StoreData StoreData
}
type OfferingDetails struct {
	Title struct {
		Value string `json:"value"`
	} `json:"Title"`
	Description                     string  `json:"Description"`
	Quality                         string  `json:"Quality"`
	WidthHint                       int     `json:"WidthHint"`
	HeightHint                      int     `json:"HeightHint"`
	FlairText                       string  `json:"FlairText"`
	FlairIconPath                   string  `json:"FlairIconPath"`
	FlairBackgroundPath             string  `json:"FlairBackgroundPath"`
	ObjectImagePath                 string  `json:"ObjectImagePath"`
	StoreTileType                   string  `json:"StoreTileType"`
	HasGleam                        bool    `json:"HasGleam"`
	IsOnSale                        *bool   `json:"IsOnSale"` // Using pointer for nullable fields
	SalePercentage                  *int    `json:"SalePercentage"`
	IsEventItem                     *bool   `json:"IsEventItem"`
	IsNew                           *bool   `json:"IsNew"`
	FlairBackgroundColorOverrideRGB *string `json:"FlairBackgroundColorOverrideRGB"`
	FlairTextColorOverrideRGB       *string `json:"FlairTextColorOverrideRGB"`
	TitleColorOverrideRGB           *string `json:"TitleColorOverrideRGB"`
	PriceColorOverrideRGB           *string `json:"PriceColorOverrideRGB"`
	PriceShadowColorOverrideRGB     *string `json:"PriceShadowColorOverrideRGB"`
	HasFlair                        bool    `json:"HasFlair"`
	OfferingImage                   string  `json:"OfferingImage"`
}

var storeDataCache *StoreDataCache

type StoreDataCache struct {
}

func (sc *StoreDataCache) Get(ctx context.Context, key string) (StoreDataToReturn, bool) {
	val, err := db.RedisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		return StoreDataToReturn{}, false
	} else if err != nil {
		fmt.Println("Error getting from Redis:", err)
		return StoreDataToReturn{}, false
	}

	var data StoreDataToReturn
	err = json.Unmarshal([]byte(val), &data)
	if err != nil {
		fmt.Println("Error unmarshalling JSON:", err)
		return StoreDataToReturn{}, false
	}

	return data, true
}

func (sc *StoreDataCache) Set(ctx context.Context, key string, data StoreDataToReturn) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error marshalling to JSON:", err)
		return
	}

	_, err = db.RedisClient.Set(ctx, key, jsonData, 24*time.Hour).Result()
	if err != nil {
		fmt.Println("Error setting in Redis:", err)
	}
}

func getNextInvalidateTimeCST() time.Time {
	loc, _ := time.LoadLocation("America/Chicago")
	now := time.Now().In(loc)

	// Set the next invalidate time to today at 1:30 PM CST
	nextInvalidateTime := time.Date(now.Year(), now.Month(), now.Day(), 13, 30, 0, 0, loc)

	// If the current time is past today's 1:30 PM CST, set the next invalidate time to tomorrow at 1:30 PM CST
	if now.After(nextInvalidateTime) {
		nextInvalidateTime = nextInvalidateTime.AddDate(0, 0, 1)
	}

	return nextInvalidateTime
}
func HandleStore(c *gin.Context) {
	expirationTime := getNextInvalidateTimeCST()
	cacheKey := "storeData:" + expirationTime.Format("2006-01-02")

	ctx := context.Background()
	storeCache := &StoreDataCache{} // Assuming this is now interfacing with Redis

	if cachedData, exists := storeCache.Get(ctx, cacheKey); exists {
		c.JSON(http.StatusOK, cachedData)
		return
	}

	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if gamerInfo is nil or empty and serve from cache
	if gamerInfo.SpartanKey == "" {
		cachedData, found := c.Get("storeData")
		if found {
			cachedStoreData := cachedData
			c.JSON(http.StatusOK, cachedStoreData)
			return

		}
	}

	url := "https://economy.svc.halowaypoint.com/hi/players/xuid(" + gamerInfo.XUID + ")/stores/Main"
	var store StoreData
	hdrs := map[string]string{}
	hdrs["343-clearance"] = gamerInfo.ClearanceCode

	makeAPIRequest(gamerInfo.SpartanKey, url, hdrs, &store)
	basePath := "https://gamecms-hacs.svc.halowaypoint.com/hi/Progression/file/"

	var wg sync.WaitGroup
	wg.Add(len(store.Offerings))

	for i := range store.Offerings {
		go func(i int) {
			defer wg.Done()

			fullPath := basePath + store.Offerings[i].OfferingDisplayPath
			var offeringDetails OfferingDetails
			makeAPIRequest(gamerInfo.SpartanKey, fullPath, hdrs, &offeringDetails)

			// Safely update the original Offering object
			store.Offerings[i].OfferingDetails = offeringDetails

			url := "https://gamecms-hacs.svc.halowaypoint.com/hi/Images/file/" + offeringDetails.ObjectImagePath
			offeringImage, _ := makeAPIRequestImage(gamerInfo.SpartanKey, url, hdrs)
			offeringImage, err := compressPNGWithImaging(offeringImage, false, 0, 0)
			if err != nil {
				fmt.Println("Error Compressing Store Data: ", err)
			}
			store.Offerings[i].OfferingDetails.OfferingImage = offeringImage
		}(i)
	}

	wg.Wait()
	dataToStore := StoreDataToReturn{
		gamerInfo: requests.GamerInfo{},
		StoreData: store,
	}
	// Store the new data in Redis, do not delete the old entry
	storeCache.Set(ctx, cacheKey, dataToStore)

	data := StoreDataToReturn{
		gamerInfo: gamerInfo,
		StoreData: store,
	}
	c.JSON(http.StatusOK, data)
}

// https://gamecms-hacs.svc.halowaypoint.com/hi/Progression/file/Metadata/Metadata.json THIS GETS MANUFACTURERS
