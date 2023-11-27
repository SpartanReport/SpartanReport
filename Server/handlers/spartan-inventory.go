package spartanreport

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"image/png"
	"io"
	"io/ioutil"
	"net/http"
	"os/exec"
	"spartanreport/db"
	requests "spartanreport/requests"
	"strings"

	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis"
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
type ArmoryRowCore struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	IsHighlighted bool   `json:"isHighlighted"`
	Image         string `json:"Image,omitempty"`
	Description   string `json:"Description,omitempty"`
	CoreId        string `json:"CoreId"`
	Type          string `json:"Type"`
	GetInv        bool   `json:"GetInv"`
	CoreTitle     string `json:"CoreTitle"`
	Rarity        string `json:"Rarity"`
}

type ArmoryRowElements struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	IsHighlighted bool   `json:"isHighlighted"`
	Image         string `json:"Image,omitempty"`
	CoreId        string `json:"CoreId"`
	BelongsToCore string `json:"BelongsToCore"`
	Rarity        string `json:"Rarity"`
	ImagePath     string `json:"ImagePath,omitempty"`
	IsCrossCore   bool   `json:"IsCrossCore"`
	Type          string `json:"Type"`
	CorePath      string `json:"CorePath"`
}
type ArmoryRowItems struct {
	ArmoryRowElements          []ArmoryRowElements `json:"Helmets"`
	ArmoryRowGloves            []ArmoryRowElements `json:"Gloves"`
	ArmoryRowVisors            []ArmoryRowElements `json:"Visors"`
	ArmoryRowLeftShoulderPads  []ArmoryRowElements `json:"LeftShoulderPads"`
	ArmoryRowRightShoulderPads []ArmoryRowElements `json:"RightShoulderPads"`
	ArmoryRowWristAttachments  []ArmoryRowElements `json:"WristAttachments"`
	ArmoryRowHipAttachments    []ArmoryRowElements `json:"HipAttachments"`
	ArmoryRowKneePads          []ArmoryRowElements `json:"KneePads"`
	ArmoryRowChestAttachments  []ArmoryRowElements `json:"ChestAttachments"`
}

type CurrentlyEquipped struct {
	Helmet            ArmoryRowElements `json:"CurrentlyEquippedHelmet"`
	Core              ArmoryRowCore     `json:"CurrentlyEquippedCore"`
	Visor             ArmoryRowElements `json:"CurrentlyEquippedVisor"`
	Gloves            ArmoryRowElements `json:"CurrentlyEquippedGlove"`
	Coatings          ArmoryRowElements `json:"CurrentlyEquippedCoating"`
	LeftShoulderPads  ArmoryRowElements `json:"CurrentlyEquippedLeftShoulderPad"`
	RightShoulderPads ArmoryRowElements `json:"CurrentlyEquippedRightShoulderPad"`
	WristAttachments  ArmoryRowElements `json:"CurrentlyEquippedWristAttachment"`
	HipAttachments    ArmoryRowElements `json:"CurrentlyEquippedHipAttachment"`
	KneePads          ArmoryRowElements `json:"CurrentlyEquippedKneePad"`
	ChestAttachments  ArmoryRowElements `json:"CurrentlyEquippedChestAttachment"`
}

type DataToReturn struct {
	GamerInfo                  requests.GamerInfo `json:"GamerInfo"`
	PlayerInventory            []SpartanInventory
	ArmoryRow                  []ArmoryRowCore
	ArmoryRowHelmets           []ArmoryRowElements
	ArmoryRowVisors            []ArmoryRowElements
	ArmoryRowGloves            []ArmoryRowElements
	ArmoryRowCoatings          []ArmoryRowElements
	ArmoryRowLeftShoulderPads  []ArmoryRowElements
	ArmoryRowRightShoulderPads []ArmoryRowElements
	ArmoryRowWristAttachments  []ArmoryRowElements
	ArmoryRowHipAttachments    []ArmoryRowElements
	ArmoryRowKneePads          []ArmoryRowElements
	ArmoryRowChestAttachments  []ArmoryRowElements

	CurrentlyEquipped CurrentlyEquipped
	Items             Items
}

func HandleInventory(c *gin.Context) {
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	newGamerInfo := requests.CheckAndUpdateGamerInfo(c, gamerInfo)
	if newGamerInfo.SpartanKey == "" {
		c.JSON(http.StatusForbidden, "Empty GamerInfo received")
		return
	}
	playerInventory, err := GetInventory(c, newGamerInfo)
	if err != nil {
		fmt.Println("Error getting inventory: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}
	includeArmory := c.Query("includeArmory") == "true"
	data := DataToReturn{
		GamerInfo:       newGamerInfo,
		PlayerInventory: playerInventory,
	}
	if includeArmory {
		objects := []ArmoryRowCore{}
		var coreResults = []InventoryReward{}
		// Get Player Inventory
		var InventoryResults = Items{}
		url := "https://economy.svc.halowaypoint.com/hi/players/xuid(" + gamerInfo.XUID + ")/Inventory"
		hdrs := map[string]string{}
		hdrs["343-clearance"] = gamerInfo.ClearanceCode
		makeAPIRequest(gamerInfo.SpartanKey, url, hdrs, &InventoryResults)
		if err != nil {
			fmt.Println(err)
			return
		}
		var missingItems Items
		var existingItems Items
		for _, item := range InventoryResults.InventoryItems {
			var existingItem ItemsInInventory
			if isExcludedItemType(item.ItemType) {
				continue
			}
			// Retrieve the item from Redis
			ctx := context.Background()
			val, err := db.RedisClient.HGet(ctx, "items", item.ItemPath).Result()
			if err != nil {
				if err == redis.Nil {
					fmt.Println("Covered in nil check")
					missingItems.InventoryItems = append(missingItems.InventoryItems, item)
				} else {
					fmt.Printf("Error getting from Redis: %v\n", err)
					missingItems.InventoryItems = append(missingItems.InventoryItems, item)
				}
			} else {
				if err := json.Unmarshal([]byte(val), &existingItem); err != nil {
					fmt.Printf("Error unmarshalling item from Redis: %v", err)
				} else {
					// Item found, add to existing items
					existingItems.InventoryItems = append(existingItems.InventoryItems, existingItem)

				}
			}
		}
		fetchedItems := GetInventoryItemImages(gamerInfo, missingItems)
		var completeItems Items

		completeItems.InventoryItems = append(existingItems.InventoryItems, fetchedItems.InventoryItems...)
		data.Items = completeItems
		// Get Armor Cores
		err = db.QueryDataByType("item_data", "ArmorCore", &coreResults)
		for i, reward := range coreResults {
			coreData := ArmoryRowCore{}
			coreData.ID = i + 1
			coreData.Name = reward.ItemMetaData.Title.Value
			coreData.IsHighlighted = false
			coreData.Rarity = reward.ItemMetaData.Quality
			coreData.Image = reward.ItemImageData
			coreData.Description = reward.ItemMetaData.Description.Value
			coreData.CoreId = reward.ItemMetaData.Core
			coreData.CoreTitle = reward.ItemMetaData.CoreTitle
			coreData.Type = "ArmorCore"
			// Mark core if it's the equipped core
			if reward.ItemMetaData.Core == playerInventory[0].CoreDetails.CommonData.Id {
				coreData.IsHighlighted = true
				data.CurrentlyEquipped.Core = coreData
			}
			objects = append(objects, coreData)
		}
		if err != nil {
			fmt.Println("Error querying item data")
		}
		data.ArmoryRow = objects
	}

	// Aggregate Armory Row For Helmets
	data = loadArmoryRow(data, playerInventory)
	data.GamerInfo = newGamerInfo
	data.Items = Items{}

	c.JSON(http.StatusOK, data)
}

func loadArmoryRow(data DataToReturn, playerInventory []SpartanInventory) DataToReturn {
	helmets := []ArmoryRowElements{}
	gloves := []ArmoryRowElements{}
	visors := []ArmoryRowElements{}
	coatings := []ArmoryRowElements{}
	leftshoulderpads := []ArmoryRowElements{}
	rightshoulderpads := []ArmoryRowElements{}
	wristattachments := []ArmoryRowElements{}
	hipattachments := []ArmoryRowElements{}
	kneepads := []ArmoryRowElements{}
	chestattachments := []ArmoryRowElements{}

	for i, item := range data.Items.InventoryItems {
		// Skip if the item path is empty
		if item.ItemPath == "" {
			continue
		}

		switch item.ItemType {
		case "ArmorHelmet":
			helmet := createArmoryRowElement(i, item, "ArmorHelmet", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].HelmetPath)
			helmets = append(helmets, helmet)
			if helmet.IsHighlighted {
				data.CurrentlyEquipped.Helmet = helmet
			}

		case "ArmorVisor":
			visor := createArmoryRowElement(i, item, "ArmorVisor", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].VisorPath)
			visors = append(visors, visor)
			if visor.IsHighlighted {
				data.CurrentlyEquipped.Visor = visor
			}
		case "ArmorLeftShoulderPad":
			leftshoulderpad := createArmoryRowElement(i, item, "ArmorLeftShoulderPad", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].LeftShoulderPadPath)
			leftshoulderpads = append(leftshoulderpads, leftshoulderpad)
			if leftshoulderpad.IsHighlighted {
				data.CurrentlyEquipped.LeftShoulderPads = leftshoulderpad
			}
		case "ArmorRightShoulderPad":
			rightshoulderpad := createArmoryRowElement(i, item, "ArmorRightShoulderPad", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].RightShoulderPadPath)
			rightshoulderpads = append(rightshoulderpads, rightshoulderpad)
			if rightshoulderpad.IsHighlighted {
				data.CurrentlyEquipped.RightShoulderPads = rightshoulderpad
			}
		case "ArmorWristAttachment":
			wristattachment := createArmoryRowElement(i, item, "ArmorWristAttachment", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].WristAttachmentPath)
			wristattachments = append(wristattachments, wristattachment)
			if wristattachment.IsHighlighted {
				data.CurrentlyEquipped.WristAttachments = wristattachment
			}
		case "ArmorHipAttachment":
			hipattachment := createArmoryRowElement(i, item, "ArmorHipAttachment", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].HipAttachmentPath)
			hipattachments = append(hipattachments, hipattachment)
			if hipattachment.IsHighlighted {
				data.CurrentlyEquipped.HipAttachments = hipattachment
			}
		case "ArmorKneePad":
			kneepad := createArmoryRowElement(i, item, "ArmorKneePad", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].KneePadPath)
			kneepads = append(kneepads, kneepad)
			if kneepad.IsHighlighted {
				data.CurrentlyEquipped.KneePads = kneepad
			}
		case "ArmorChestAttachment":
			chestattachment := createArmoryRowElement(i, item, "ArmorChestAttachment", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].ChestAttachmentPath)
			chestattachments = append(chestattachments, chestattachment)
			if chestattachment.IsHighlighted {
				data.CurrentlyEquipped.ChestAttachments = chestattachment
			}

		case "ArmorGlove":
			glove := createArmoryRowElement(i, item, "ArmorGlove", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].GlovePath)
			gloves = append(gloves, glove)
			if glove.IsHighlighted {
				data.CurrentlyEquipped.Gloves = glove
			}

		case "ArmorCoating":
			coating := createArmoryRowElement(i, item, "ArmorCoating", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].CoatingPath)
			coatings = append(coatings, coating)
			if coating.IsHighlighted {
				data.CurrentlyEquipped.Coatings = coating
			}
		default:
			continue
		}
	}
	data.ArmoryRowHelmets = helmets
	data.ArmoryRowGloves = gloves
	data.ArmoryRowVisors = visors
	data.ArmoryRowCoatings = coatings
	data.ArmoryRowLeftShoulderPads = leftshoulderpads
	data.ArmoryRowRightShoulderPads = rightshoulderpads
	data.ArmoryRowWristAttachments = wristattachments
	data.ArmoryRowHipAttachments = hipattachments
	data.ArmoryRowKneePads = kneepads
	data.ArmoryRowChestAttachments = chestattachments
	return data

}

func createArmoryRowElement(id int, item ItemsInInventory, itemType, equippedPath string) ArmoryRowElements {
	element := ArmoryRowElements{
		ID:            id,
		CorePath:      item.ItemPath,
		Image:         item.ItemImageData,
		ImagePath:     item.ItemMetaData.Media.Media.MediaUrl.Path,
		BelongsToCore: getCoreIDFromInventoryItemPath(item.ItemPath),
		Rarity:        item.ItemMetaData.Quality,
		CoreId:        item.ItemMetaData.Core,
		Name:          item.ItemMetaData.Title.Value,
		IsCrossCore:   item.ItemMetaData.IsCrossCompatible,
		Type:          itemType,
		IsHighlighted: item.ItemPath == equippedPath,
	}
	return element
}

func GetInventoryItemImages(gamerInfo requests.GamerInfo, Items Items) Items {
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
			fmt.Println("Error getting image data: ", err)
		}
		rawImageData, err = compressPNGWithImaging(rawImageData, true, 140, 140)
		if err != nil {
			// fmt.Println("Error getting item image: ", err)
			results <- RewardResult{} // Send an empty result to ensure channel doesn't block
		} else {
			currentItemResponse.CommonData.CoreTitle = core // Assign Core
			results <- RewardResult{Path: path, ImageData: rawImageData, Item: currentItemResponse.CommonData}
		}
	}

	totalPaths := 0
	var filteredRewards []ItemsInInventory

	for _, item := range Items.InventoryItems {
		if item.ItemPath != "" {
			if !isExcludedItemType(item.ItemType) {
				go makeRequest(item.ItemPath)
				totalPaths++
				filteredRewards = append(filteredRewards, item)
			}
		}
	}

	// Replace the original InventoryRewards with the filtered list
	Items.InventoryItems = filteredRewards

	// Collect results from the channel and update the InventoryReward structs
	for i := 0; i < totalPaths; i++ {
		result := <-results

		// Image is broken
		if result.Item.Title.Value == "" {
			continue
		}
		for _, item := range Items.InventoryItems {
			// Update Free Rewards
			if item.ItemPath == result.Path {
				item.ItemImageData = result.ImageData
				item.ItemMetaData = result.Item

				ctx := context.Background()
				itemPath := item.ItemPath
				itemBytes, err := json.Marshal(item)
				if err != nil {
					fmt.Printf("Error marshalling item: %v", err)
				}

				if err := db.RedisClient.HSet(ctx, "items", itemPath, itemBytes).Err(); err != nil {
					fmt.Printf("error setting value in Redis: %v", err)
				}

			}
		}
	}
	return Items
}

// compressPNGWithImaging optimizes and compresses a PNG image.
func compressPNGWithImaging(base64PNG string, resize bool, width, height int) (string, error) {
	// Decode the base64 string to get the raw PNG data
	pngData, err := base64.StdEncoding.DecodeString(base64PNG)
	if err != nil {
		return "", err
	}

	// Decode PNG data
	img, _, err := image.Decode(bytes.NewReader(pngData))
	if err != nil {
		return "", err
	}

	// Resize if needed
	if resize {
		img = imaging.Resize(img, width, height, imaging.Lanczos)
	}

	// Encode the image to PNG
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return "", err
	}

	optimizedImage, err := optimizePNGWithPngquant(buf.Bytes())
	if err != nil {
		return "", err
	}

	// Convert back to base64
	compressedBase64 := base64.StdEncoding.EncodeToString(optimizedImage)
	return compressedBase64, nil
}

func optimizePNGWithPngquant(input []byte) ([]byte, error) {
	// Set up the pngquant command with desired options.
	// The following example uses "--quality=65-80" for quality settings,
	cmd := exec.Command("pngquant", "--quality=60-80", "--speed", "1", "--floyd=0.5 ", "--force", "--output", "-", "-")

	// Provide the input image data.
	cmd.Stdin = bytes.NewReader(input)

	// Capture the output.
	var out bytes.Buffer
	cmd.Stdout = &out

	// Run the command.
	if err := cmd.Run(); err != nil {
		return nil, err
	}

	// Return the optimized image data.
	return out.Bytes(), nil
}

func isExcludedItemType(itemType string) bool {
	excludedTypes := map[string]bool{
		"WeaponEmblem":                  true,
		"SpartanEmblem":                 true,
		"WeaponCoating":                 true,
		"VehicleCoating":                true,
		"VehicleEmblem":                 true,
		"VehicleTheme":                  true,
		"SpartanVoice":                  true,
		"SpartanActionPose":             true,
		"ArmorFx":                       true,
		"AiColor":                       true,
		"ArmorEmblem":                   true,
		"WeaponTheme":                   true,
		"WeaponAlternateGeometryRegion": true,
		"SpartanBackdropImage":          true,
		"WeaponCharm":                   true,
		"ArmorMythicFx":                 true,
		"WeaponDeathFx":                 true,
		"AiModel":                       true,
		"AiTheme":                       true,
	}

	_, found := excludedTypes[itemType]
	return found
}

func GetInventory(c *gin.Context, gamerInfo requests.GamerInfo) ([]SpartanInventory, error) {
	fmt.Println("Getting Inventory!")
	hdrs := map[string]string{}
	hdrs["343-clearance"] = gamerInfo.ClearanceCode
	hdrs["Accept"] = "application/json"

	var inventoryResponse InventoryResponse
	url := "https://economy.svc.halowaypoint.com/hi/customization?players=xuid(" + gamerInfo.XUID + ")"
	fmt.Println("querying ", url)
	err := makeAPIRequest(gamerInfo.SpartanKey, url, hdrs, &inventoryResponse)
	if err != nil {
		fmt.Println("Error getting inventory: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})

		HandleLogout(c)
		return nil, err
	}

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

	return spartanInventories, nil
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

	reward := InventoryReward{}
	reward.InventoryItemPath = t.Path
	reward.Amount = 1
	reward.Type = "ArmorCore"
	reward.ItemImageData = rawImageData
	reward.ItemMetaData = currentItemResponse.CommonData
	reward.ItemMetaData.Core = armorcore
	db.StoreData("item_data", reward)

}
