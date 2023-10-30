package halotestapp

import (
	requests "halotestapp/requests"
	"net/http"
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
	Title                           string  `json:"Title"`
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
}

func HandleStore(c *gin.Context) {
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
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
			defer wg.Done() // Decrement the counter when the goroutine completes

			fullPath := basePath + store.Offerings[i].OfferingDisplayPath
			var offeringDetails OfferingDetails // Replace with your actual struct
			makeAPIRequest(gamerInfo.SpartanKey, fullPath, hdrs, &offeringDetails)

			// Safely update the original Offering object
			store.Offerings[i].OfferingDetails = offeringDetails
		}(i)
	}

	// Wait for all API requests to complete
	wg.Wait()

	data := StoreDataToReturn{
		gamerInfo: gamerInfo,
		StoreData: store,
	}

	c.JSON(http.StatusOK, data)
}

// https://gamecms-hacs.svc.halowaypoint.com/hi/Progression/file/
// https://gamecms-hacs.svc.halowaypoint.com/hi/Progression/file/Metadata/Metadata.json THIS GETS MANUFACTURERS
