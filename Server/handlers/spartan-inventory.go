package spartanreport

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"spartanreport/db"
	requests "spartanreport/requests"
	"strings"

	"github.com/gin-gonic/gin"
)

type ISO8601Date struct {
	ISO8601Date string `json:"ISO8601Date"`
}

type EmblemInfo struct {
	EmblemCmsPath      string `json:"emblemCmsPath"`
	NameplateCmsPath   string `json:"nameplateCmsPath"`
	TextColor          string `json:"textColor"`
	EmblemImageData    []byte `json:"EmblemImageData,omitempty"`
	NameplateImageData []byte `json:"NameplateImageData,omitempty"`
}

type Emblem struct {
	EmblemPath      string `json:"EmblemPath"`
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
	ModelPath                   string      `json:"ModelPath"`
	ColorPath                   string      `json:"ColorPath"`
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
	AiCores   []Core `json:"AiCores"`
	ModelPath string `json:"ModelPath"`
	ColorPath string `json:"ColorPath"`
}

type VehicleCores struct {
	VehicleCores []Core `json:"VehicleCores"`
}

type SpartanInventory struct {
	ArmorCores   ArmorCores        `json:"ArmorCores"`
	SpartanBody  SpartanBody       `json:"SpartanBody"`
	Appearance   Appearance        `json:"Appearance"`
	WeaponCores  WeaponCores       `json:"WeaponCores"`
	AiCores      AiCores           `json:"AiCores"`
	VehicleCores VehicleCores      `json:"VehicleCores"`
	CoreDetails  CoreDetails       `json:"CoreDetails,omitempty"`
	EmblemInfo   EmblemInfo        `json:"EmblemInfo"`
	EmblemColors map[string]string `json:"EmblemColors"`
}

type PlayerCustomization struct {
	Id         string           `json:"Id"`
	ResultCode string           `json:"ResultCode"`
	Result     SpartanInventory `json:"Result"`
}

type InventoryResponse struct {
	PlayerCustomizations []PlayerCustomization `json:"PlayerCustomizations"`
}

type CoreDetails struct {
	CommonData struct {
		Id        string `json:"Id"`
		ImageData []byte `json:"ImageData,omitempty"`
		Title     struct {
			Value string `json:"value"`
		} `json:"Title"`
		Description struct {
			Value string `json:"value"`
		} `json:"Description"`
		DisplayPath struct {
			Media struct {
				MediaUrl struct {
					Path string `json:"Path"`
				} `json:"MediaUrl"`
			} `json:"Media"`
		} `json:"DisplayPath"`
	} `json:"CommonData"`
}
type ArmoryRowData struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	IsHighlighted bool   `json:"isHighlighted"`
	Image         string `json:"Image,omitempty"`
	Description   string `json:"Description,omitempty"`
}

type DataToReturn struct {
	PlayerInventory []SpartanInventory
	ArmoryRow       []ArmoryRowData
}

func HandleInventory(c *gin.Context) {
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	playerInventory := GetInventory(c, gamerInfo)
	includeArmory := c.Query("includeArmory") == "true"
	data := DataToReturn{
		PlayerInventory: playerInventory,
	}
	if includeArmory {
		objects := []ArmoryRowData{}
		var results = []InventoryReward{}

		err := db.QueryDataByType("item_data", "ArmorCore", &results)
		for i, reward := range results {
			coreData := ArmoryRowData{}
			coreData.ID = i + 1
			coreData.Name = reward.ItemMetaData.Title.Value
			coreData.IsHighlighted = false
			coreData.Image = reward.ItemImageData
			coreData.Description = reward.ItemMetaData.Description.Value

			// Mark core if it's the equipped core
			if reward.ItemMetaData.Core == playerInventory[0].CoreDetails.CommonData.Id {
				coreData.IsHighlighted = true
			}
			fmt.Printf("Iteration %d: %v\n", i, reward.ItemMetaData.Core)
			objects = append(objects, coreData)
		}
		if err != nil {
			fmt.Println("Error querying item data")
		}
		data.ArmoryRow = objects

	}

	c.JSON(http.StatusOK, data)
}

func GetInventory(c *gin.Context, gamerInfo requests.GamerInfo) []SpartanInventory {
	fmt.Println("Getting Inventory!")
	hdrs := map[string]string{}
	hdrs["343-clearance"] = gamerInfo.ClearanceCode
	hdrs["Accept"] = "application/json"

	var inventoryResponse InventoryResponse
	url := "https://economy.svc.halowaypoint.com/hi/customization?players=xuid(" + gamerInfo.XUID + ")"
	fmt.Println("querying ", url)
	makeAPIRequest(gamerInfo.SpartanKey, url, hdrs, &inventoryResponse)

	spartanInventories := make([]SpartanInventory, 0, len(inventoryResponse.PlayerCustomizations))
	fmt.Println("Spartan Customization Length: ", len(inventoryResponse.PlayerCustomizations))
	for _, customization := range inventoryResponse.PlayerCustomizations {
		FetchCoreDetails(&customization.Result, gamerInfo)
		// Logic for fetching the emblem path and processing emblem data
		var rawResponse map[string]interface{}
		if err := makeAPIRequest(gamerInfo.SpartanKey, "https://gamecms-hacs.svc.halowaypoint.com/hi/Waypoint/file/images/emblems/mapping.json", nil, &rawResponse); err != nil {
			c.Error(err)
			continue // Skip this iteration due to error
		}

		configID := customization.Result.Appearance.Emblem.ConfigurationId
		emblemPath := customization.Result.Appearance.Emblem.EmblemPath
		parts := strings.Split(emblemPath, "/")
		targetPart := parts[len(parts)-1]
		targetPart = strings.TrimSuffix(targetPart, ".json")

		emblemData, found := rawResponse[targetPart].(map[string]interface{})
		if !found {
			c.Error(fmt.Errorf("Emblem data for %s not found", targetPart))
			continue // Skip this iteration due to error
		}
		configData, found := emblemData[fmt.Sprint(configID)]
		if !found {
			c.Error(fmt.Errorf("Config data for ID %v not found", configID))
			continue // Skip this iteration due to error
		}

		configDataBytes, err := json.Marshal(configData)
		if err != nil {
			c.Error(err)
			continue // Skip this iteration due to error
		}

		var emblem EmblemInfo
		if err := json.Unmarshal(configDataBytes, &emblem); err != nil {
			c.Error(err)
			continue // Skip this iteration due to error
		}

		emblemPngPath := "https://gamecms-hacs.svc.halowaypoint.com/hi/Waypoint/file/" + emblem.EmblemCmsPath
		nameplatePngPath := "https://gamecms-hacs.svc.halowaypoint.com/hi/Waypoint/file/" + emblem.NameplateCmsPath

		emblem.EmblemImageData = FetchImageData(emblemPngPath, gamerInfo)
		emblem.NameplateImageData = FetchImageData(nameplatePngPath, gamerInfo)
		emblemColors := GetColorPercentages(emblem.NameplateImageData)
		customization.Result.EmblemInfo = emblem
		customization.Result.EmblemColors = emblemColors

		// Add the customized SpartanInventory to the slice.
		spartanInventories = append(spartanInventories, customization.Result)
	}
	fmt.Println("Done!")

	return spartanInventories
}

func FetchCoreDetails(spartanInventory *SpartanInventory, gamerInfo requests.GamerInfo) {
	// Extract CorePath from the first ArmorCore in the list (modify this as needed)
	corePath := spartanInventory.ArmorCores.ArmorCores[0].CorePath

	// Prepare the URL
	url := "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/" + corePath

	// Initialize headers
	hdrs := http.Header{}
	hdrs.Set("X-343-Authorization-Spartan", gamerInfo.SpartanKey)

	// Create a new HTTP client and request
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Println("Error creating request:", err)
		return
	}

	// Set the headers for the request
	req.Header = hdrs

	// Make the request
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error making request:", err)
		return
	}
	defer resp.Body.Close()

	// Handle the response (you can modify this part as needed)
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response:", err)
		return
	}
	details := ParseCoreDetails(body)
	// Add image data to details
	url = "https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/" + details.CommonData.DisplayPath.Media.MediaUrl.Path
	details.CommonData.ImageData = FetchImageData(url, gamerInfo)
	spartanInventory.CoreDetails = details

}

func ParseCoreDetails(responseBody []byte) CoreDetails {
	var details CoreDetails
	err := json.Unmarshal(responseBody, &details)
	if err != nil {
		fmt.Println("Error unmarshaling JSON:", err)
		return details
	}

	return details
}

func FetchImageData(imageURL string, gamerInfo requests.GamerInfo) []byte {
	hdrs := http.Header{}
	hdrs.Set("X-343-Authorization-Spartan", gamerInfo.SpartanKey)
	client := &http.Client{}
	req, err := http.NewRequest("GET", imageURL, nil)
	if err != nil {
		fmt.Println("Error creating request:", err)
		return nil
	}
	req.Header = hdrs
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error making request:", err)
		return nil
	}
	defer resp.Body.Close()
	imgData, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading image data:", err)
		return nil
	}
	return imgData
}
