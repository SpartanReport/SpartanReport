package spartanreport

import (
	"net/http"
	requests "spartanreport/requests"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
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

func init() {
	storeDataCache = &StoreDataCache{
		data: make(map[string]StoreDataToReturn),
	}
}

type StoreDataCache struct {
	data  map[string]StoreDataToReturn
	mutex sync.RWMutex
}

func (sc *StoreDataCache) Get(key string) (StoreDataToReturn, bool) {
	sc.mutex.RLock()
	defer sc.mutex.RUnlock()
	data, exists := sc.data[key]
	return data, exists
}

func (sc *StoreDataCache) Set(key string, data StoreDataToReturn) {
	sc.mutex.Lock()
	defer sc.mutex.Unlock()
	sc.data[key] = data
}

func (sc *StoreDataCache) Delete(key string) {
	sc.mutex.Lock()
	defer sc.mutex.Unlock()
	delete(sc.data, key)
}

func getNextTuesdayCST() time.Time {
	loc, _ := time.LoadLocation("America/Chicago")
	now := time.Now().In(loc)
	daysUntilTuesday := (9 - int(now.Weekday())) % 7
	nextTuesday := now.AddDate(0, 0, daysUntilTuesday)
	return time.Date(nextTuesday.Year(), nextTuesday.Month(), nextTuesday.Day(), 13, 0, 0, 0, loc)
}

func HandleStore(c *gin.Context) {
	expirationTime := getNextTuesdayCST()
	cacheKey := expirationTime.Format(time.RFC3339)

	if time.Now().After(expirationTime) {
		storeDataCache.Delete(cacheKey) // Clear the expired cache
	}

	if cachedData, exists := storeDataCache.Get(cacheKey); exists {
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
			store.Offerings[i].OfferingDetails.OfferingImage = offeringImage
		}(i)
	}

	wg.Wait()
	dataToStore := StoreDataToReturn{
		gamerInfo: requests.GamerInfo{},
		StoreData: store,
	}
	storeDataCache.Set(cacheKey, dataToStore)
	data := StoreDataToReturn{
		gamerInfo: gamerInfo,
		StoreData: store,
	}

	c.JSON(http.StatusOK, data)
}

// https://gamecms-hacs.svc.halowaypoint.com/hi/Progression/file/
// https://gamecms-hacs.svc.halowaypoint.com/hi/Progression/file/Metadata/Metadata.json THIS GETS MANUFACTURERS
