package halotestapp

import (
	"encoding/json"
	"fmt"
	requests "halotestapp/requests"
	"io/ioutil"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ISO8601Date struct {
	ISO8601Date string `json:"ISO8601Date"`
}

type Emblem struct {
	Path            string `json:"Path"`
	LocationId      int    `json:"LocationId"`
	ConfigurationId int    `json:"ConfigurationId"`
}

type Theme struct {
	FirstModifiedDateUtc        ISO8601Date `json:"FirstModifiedDateUtc"`
	LastModifiedDateUtc         ISO8601Date `json:"LastModifiedDateUtc"`
	IsEquipped                  bool        `json:"IsEquipped"`
	IsDefault                   bool        `json:"IsDefault"`
	ThemePath                   string      `json:"ThemePath"`
	CoatingPath                 string      `json:"CoatingPath"`
	GlovePath                   string      `json:"GlovePath"`
	HelmetPath                  string      `json:"HelmetPath"`
	HelmetAttachmentPath        string      `json:"HelmetAttachmentPath"`
	ChestAttachmentPath         string      `json:"ChestAttachmentPath"`
	KneePadPath                 string      `json:"KneePadPath"`
	LeftShoulderPadPath         string      `json:"LeftShoulderPadPath"`
	RightShoulderPadPath        string      `json:"RightShoulderPadPath"`
	Emblems                     []Emblem    `json:"Emblems"`
	ArmorFxPath                 string      `json:"ArmorFxPath"`
	MythicFxPath                string      `json:"MythicFxPath"`
	VisorPath                   string      `json:"VisorPath"`
	HipAttachmentPath           string      `json:"HipAttachmentPath"`
	WristAttachmentPath         string      `json:"WristAttachmentPath"`
	ArmorFxPaths                []string    `json:"ArmorFxPaths"`
	DeathFxPath                 string      `json:"DeathFxPath,omitempty"`
	AmmoCounterColorPath        string      `json:"AmmoCounterColorPath,omitempty"`
	StatTrackerPath             string      `json:"StatTrackerPath,omitempty"`
	WeaponCharmPath             string      `json:"WeaponCharmPath,omitempty"`
	AlternateGeometryRegionPath string      `json:"AlternateGeometryRegionPath,omitempty"`
}
type Core struct {
	CorePath   string  `json:"CorePath"`
	IsEquipped bool    `json:"IsEquipped"`
	Themes     []Theme `json:"Themes"`
	CoreId     string  `json:"CoreId"`
	CoreType   string  `json:"CoreType"`
}

type ArmorCores struct {
	ArmorCores []Core `json:"ArmorCores"`
}

type SpartanBody struct {
	LastModifiedDateUtc ISO8601Date `json:"LastModifiedDateUtc"`
	LeftArm             string      `json:"LeftArm"`
	RightArm            string      `json:"RightArm"`
	LeftLeg             string      `json:"LeftLeg"`
	RightLeg            string      `json:"RightLeg"`
	BodyType            string      `json:"BodyType"`
	VoicePath           string      `json:"VoicePath"`
}

type Appearance struct {
	LastModifiedDateUtc ISO8601Date `json:"LastModifiedDateUtc"`
	ActionPosePath      string      `json:"ActionPosePath"`
	BackdropImagePath   string      `json:"BackdropImagePath"`
	Emblem              Emblem      `json:"Emblem"`
	ServiceTag          string      `json:"ServiceTag"`
	IntroEmotePath      string      `json:"IntroEmotePath"`
	PlayerTitlePath     string      `json:"PlayerTitlePath"`
}

type WeaponCores struct {
	WeaponCores []Core `json:"WeaponCores"`
}

type AiCores struct {
	AiCores []Core `json:"AiCores"`
}

type VehicleCores struct {
	VehicleCores []Core `json:"VehicleCores"`
}

type SpartanInventory struct {
	ArmorCores   ArmorCores   `json:"ArmorCores"`
	SpartanBody  SpartanBody  `json:"SpartanBody"`
	Appearance   Appearance   `json:"Appearance"`
	WeaponCores  WeaponCores  `json:"WeaponCores"`
	AiCores      AiCores      `json:"AiCores"`
	VehicleCores VehicleCores `json:"VehicleCores"`
}

type PlayerCustomization struct {
	Id         string           `json:"Id"`
	ResultCode string           `json:"ResultCode"`
	Result     SpartanInventory `json:"Result"`
}

type InventoryResponse struct {
	PlayerCustomizations []PlayerCustomization `json:"PlayerCustomizations"`
}

func HandleInventory(c *gin.Context) {
	spartanToken := c.DefaultQuery("spartanKey", "")
	if spartanToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No SpartanKey found"})
		return
	}
	gamerInfo, err := requests.RequestUserProfile(spartanToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while getting user profile"})
		fmt.Println("Error While Getting User Profile:", err)
		return
	}

	playerInventory := GetInventory(c, gamerInfo)

	c.Set("gamerInfoKey", gamerInfo)

	// Return the playerInventory as JSON
	fmt.Println("player inventory: ", playerInventory)
	c.JSON(http.StatusOK, playerInventory)
}
func GetInventory(c *gin.Context, gamerInfo requests.GamerInfo) SpartanInventory {
	hdrs := http.Header{}

	hdrs.Set("X-343-Authorization-Spartan", gamerInfo.SpartanKey)
	hdrs.Set("343-clearance", gamerInfo.ClearanceCode)

	hdrs.Set("Accept", "application/json")

	client := &http.Client{}
	req, err := http.NewRequest("GET", "https://economy.svc.halowaypoint.com/hi/customization?players=xuid("+gamerInfo.XUID+")", nil)
	if err != nil {
		fmt.Println("oops")
		fmt.Println(err)
	}

	req.Header = hdrs
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Received a non-OK status code %d. Response body: %s\n", resp.StatusCode, string(bodyBytes))
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Failed to read response body:", err)
		return SpartanInventory{}
	}

	// Check if the response body is empty
	if len(body) == 0 {
		fmt.Println("Received an empty response body")
		return SpartanInventory{}
	}

	// Unmarshal the response body into the inventoryResponse variable
	var inventoryResponse InventoryResponse
	err = json.Unmarshal(body, &inventoryResponse)
	if err != nil {
		fmt.Println("Error unmarshaling inventory:", err)
		return SpartanInventory{}
	}

	if len(inventoryResponse.PlayerCustomizations) > 0 {
		return inventoryResponse.PlayerCustomizations[0].Result
	}

	return SpartanInventory{}
}
