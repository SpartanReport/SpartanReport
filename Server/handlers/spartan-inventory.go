package spartanreport

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
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
	. "spartanreport/structures"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
	"github.com/patrickmn/go-cache"
	"go.mongodb.org/mongo-driver/bson"
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
	ArmorEmblemPath             string      `json:"ArmorEmblemPath"`
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
	ArmoryRowMythicFxs         []ArmoryRowElements `json:"ArmorMythicFxs"`
	ArmoryRowFxs               []ArmoryRowElements `json:"ArmorFxs"`
	ArmoryRowEmblems           []ArmoryRowElements `json:"ArmorEmblems"`
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
	ArmoryRowKits              []ArmoryKitRowElements
	ArmoryRowMythicFxs         []ArmoryRowElements
	ArmoryRowFxs               []ArmoryRowElements
	ArmoryRowEmblems           []ArmoryRowElements

	CurrentlyEquipped CurrentlyEquipped
	Items             Items
}

// Initialize the cache. DefaultExpiration is 0 which means no expiration, and CleanupInterval is 5 minutes.
var invCache = cache.New(5*time.Minute, 10*time.Minute)

func encryptData(data interface{}, key []byte) ([]byte, error) {
	plaintext, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return ciphertext, nil
}
func decryptData(ciphertext, key []byte) (*Items, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	if len(ciphertext) < gcm.NonceSize() {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:gcm.NonceSize()], ciphertext[gcm.NonceSize():]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	var inventoryResults Items
	err = json.Unmarshal(plaintext, &inventoryResults)
	if err != nil {
		return nil, err
	}

	return &inventoryResults, nil
}

func HandleInventory(c *gin.Context) {
	// Get GamerInfo from request
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Check GamerInfo token to ensure it's valid
	newGamerInfo := gamerInfo
	// Get Player Inventory
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
	// If includeArmory is true, get every armor piece in the players inventory and organize them into their own rows.
	if includeArmory {
		// Armory Row for Cores
		objects := []ArmoryRowCore{}
		var coreResults = []InventoryReward{}

		// Get Player Inventory
		var InventoryResults = Items{}
		// If not found in cache, proceed to make the API request.
		url := "https://economy.svc.halowaypoint.com/hi/players/xuid(" + gamerInfo.XUID + ")/Inventory"
		hdrs := map[string]string{
			"343-clearance": gamerInfo.ClearanceCode,
		}
		start := time.Now()
		makeAPIRequest(gamerInfo.SpartanKey, url, hdrs, &InventoryResults)
		elapsed := time.Since(start)
		fmt.Printf("Time to get inventory: %s\n", elapsed)

		var missingItems Items
		var existingItems Items
		// For loop that goes through every item in the player's inventory
		// And checks if the item's data is in the redis server, if not
		// It adds it to the missingItems struct
		var itemPaths []string
		start = time.Now()
		for _, item := range InventoryResults.InventoryItems {
			if isExcludedItemType(item.ItemType) {
				continue
			}
			itemPaths = append(itemPaths, item.ItemPath)
		}
		elapsed = time.Since(start)
		fmt.Printf("Time to get item paths: %s\n", elapsed)

		ctx := context.Background()
		start = time.Now()
		vals, err := db.RedisClient.HMGet(ctx, "items", itemPaths...).Result()
		elapsed = time.Since(start)
		fmt.Printf("Time to get from Redis: %s\n", elapsed)
		if err != nil {
			fmt.Printf("Error getting from Redis: %v\n", err)
			return
		}

		// Time this function
		start = time.Now()
		for i, val := range vals {
			if val == nil {
				fmt.Println("Covered in nil check")
				missingItems.InventoryItems = append(missingItems.InventoryItems, InventoryResults.InventoryItems[i])
				continue
			}

			var existingItem ItemsInInventory
			if err := json.Unmarshal([]byte(val.(string)), &existingItem); err != nil {
				fmt.Printf("Error unmarshalling item from Redis: %v\n", err)
			} else {
				// If the item is not a Custom Armor Kit, remove the image data
				if existingItem.ItemType != "ArmorKitCustom" && existingItem.ItemType != "ArmorKit" {
					existingItem.ItemImageData = ""
				}
				// Item found, add to existing items
				existingItems.InventoryItems = append(existingItems.InventoryItems, existingItem)
			}
		}
		elapsed = time.Since(start)
		fmt.Printf("Time to fetch items from Redis: %s\n", elapsed)
		// Fetch and insert missing items into redis database
		start = time.Now()
		fetchedItems := FetchInventoryItems(gamerInfo, missingItems)
		elapsed = time.Since(start)
		fmt.Printf("Time to fetch missing items: %s\n", elapsed)
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
			coreData.Description = reward.ItemMetaData.Description.Value
			coreData.CoreId = reward.ItemMetaData.Core
			coreData.CorePath = LoadArmorCores(gamerInfo, reward.ItemMetaData.Core)
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

	data = loadArmoryRow(data, playerInventory)
	data.GamerInfo = newGamerInfo
	data.Items = Items{}

	c.JSON(http.StatusOK, data)
}

func StripKitDataFromItem(item ItemResponse) ItemResponse {
	emptyItemOptions := ItemOptions{}
	item.Coatings = emptyItemOptions
	item.ChestAttachments = emptyItemOptions
	item.Visors = emptyItemOptions
	item.Helmets = emptyItemOptions
	item.Gloves = emptyItemOptions
	item.KneePads = emptyItemOptions
	item.LeftShoulderPads = emptyItemOptions
	item.RightShoulderPads = emptyItemOptions
	item.WristAttachments = emptyItemOptions
	item.HipAttachments = emptyItemOptions

	return item

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
	armorkits := []ArmoryKitRowElements{}
	myhticfxs := []ArmoryRowElements{}
	armorfxs := []ArmoryRowElements{}
	armoremblems := []ArmoryRowElements{}
	armorcores := []ArmoryRowElements{}
	// time
	start := time.Now()
	for i, item := range data.Items.InventoryItems {
		// Skip if the item path is empty
		if item.ItemPath == "" {
			continue
		}
		switch item.ItemType {
		case "ArmorTheme":
			armorkit := createArmoryRowKit(i, item, "ArmorTheme", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].ThemePath)
			armorkits = append(armorkits, armorkit)
			if armorkit.IsHighlighted {
				data.CurrentlyEquipped.Kit = armorkit
			}
		case "ArmorHelmet":
			helmet := createArmoryRowElement(i, item, "ArmorHelmet", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].HelmetPath)
			helmets = append(helmets, helmet)
			if helmet.IsHighlighted {
				data.CurrentlyEquipped.Helmet = helmet
			}
		case "ArmorCore":
			core := createArmoryRowElement(i, item, "ArmorCore", playerInventory[0].ArmorCores.ArmorCores[0].CorePath)
			armorcores = append(armorcores, core)
			if core.IsHighlighted {
				data.CurrentlyEquipped.Helmet = core
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
		case "ArmorMythicFx":
			mythicfx := createArmoryRowElement(i, item, "ArmorMythicFx", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].MythicFxPath)
			myhticfxs = append(myhticfxs, mythicfx)
			if mythicfx.IsHighlighted {
				data.CurrentlyEquipped.MythicFxs = mythicfx
			}
		case "ArmorFx":
			armorfx := createArmoryRowElement(i, item, "ArmorFx", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].ArmorFxPath)
			armorfxs = append(armorfxs, armorfx)
			if armorfx.IsHighlighted {
				data.CurrentlyEquipped.ArmorFxs = armorfx
			}
		case "ArmorEmblem":
			armoremblem := createArmoryRowElement(i, item, "ArmorEmblem", playerInventory[0].ArmorCores.ArmorCores[0].Themes[0].ArmorEmblemPath)
			armoremblems = append(armoremblems, armoremblem)
			if armoremblem.IsHighlighted {
				data.CurrentlyEquipped.ArmorEmblems = armoremblem
			}

		default:
			continue
		}
	}
	// if armorkit.name is in data.armoryrow.name (object) then remove it from armorkit
	elapsed := time.Since(start)
	fmt.Println("Time Elapsed loading armory rows: ", elapsed)

	start = time.Now()
	for i := len(armorkits) - 1; i >= 0; i-- {
		kit := armorkits[i]
		for _, core := range data.ArmoryRow {
			if kit.Name == core.Name || kit.Name == "Mark VII" || kit.Name == "" {
				armorkits = append(armorkits[:i], armorkits[i+1:]...)
				break // Break out of the inner loop once you've removed an element
			}
		}
	}
	elapsed = time.Since(start)
	fmt.Println("Time Elapsed modifying armorkits: ", elapsed)

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
	data.ArmoryRowKits = armorkits
	data.ArmoryRowMythicFxs = myhticfxs
	data.ArmoryRowFxs = armorfxs
	// data.ArmoryRowEmblems = armoremblems

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

// Add Labels to detailedItems
func addLabelsToDetailedItems(details ItemResponse) ItemResponse {
	details.Coatings.ItemType = "ArmorCoating"
	details.ChestAttachments.ItemType = "ArmorChestAttachment"
	details.Visors.ItemType = "ArmorVisor"
	details.Helmets.ItemType = "ArmorHelmet"
	details.Gloves.ItemType = "ArmorGlove"
	details.KneePads.ItemType = "ArmorKneePad"
	details.LeftShoulderPads.ItemType = "ArmorLeftShoulderPad"
	details.RightShoulderPads.ItemType = "ArmorRightShoulderPad"
	details.WristAttachments.ItemType = "ArmorWristAttachment"
	details.HipAttachments.ItemType = "ArmorHipAttachment"
	details.ArmorEmblems.ItemType = "ArmorEmblem"
	details.ArmorFxs.ItemType = "ArmorFx"
	details.ArmorMythicFxs.ItemType = "ArmorMythicFx"
	return details

}

func createArmoryRowKit(id int, item ItemsInInventory, itemType, equippedPath string) ArmoryKitRowElements {
	KitEquippablePieces := []ItemOptions{}
	item.DetailedItem = addLabelsToDetailedItems(item.DetailedItem)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.Coatings)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.ChestAttachments)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.Visors)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.Helmets)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.Gloves)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.KneePads)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.LeftShoulderPads)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.RightShoulderPads)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.WristAttachments)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.HipAttachments)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.ArmorEmblems)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.ArmorFxs)
	KitEquippablePieces = append(KitEquippablePieces, item.DetailedItem.ArmorMythicFxs)
	parentCorePath := ""
	// Iterate over ParentPaths and check for "ArmorCore"
	for _, parentPath := range item.ItemMetaData.ParentPaths {
		if parentPath.Type == "ArmorCore" {
			// remove the beginning Cores/ArmorCores/ from the string and trailing .json
			parentCorePath = strings.Replace(parentPath.Path, "Cores/ArmorCores/", "", 1)
			parentCorePath = strings.Replace(parentCorePath, ".json", "", 1)

		}
	}
	element := ArmoryKitRowElements{
		ID:                  id,
		CorePath:            item.ItemPath,
		Image:               item.ItemImageData,
		ImagePath:           item.ItemMetaData.Media.Media.MediaUrl.Path,
		Rarity:              item.ItemMetaData.Quality,
		BelongsToCore:       parentCorePath,
		CoreId:              item.ItemMetaData.Core,
		Name:                item.ItemMetaData.Title.Value,
		IsCrossCore:         item.ItemMetaData.IsCrossCompatible,
		Type:                itemType,
		IsHighlighted:       item.ItemPath == equippedPath,
		KitName:             equippedPath,
		KitEquippablePieces: KitEquippablePieces,
	}

	return element
}
func FetchInventoryItems(gamerInfo requests.GamerInfo, Items Items) Items {
	// Create a channel to receive the results
	results := make(chan RewardResult)

	// Skips these specific items as they are currently returning 404s
	skipTitles := map[string]bool{
		"Deep Ocean":       true,
		"SOFTPOINT":        true,
		"UA/Viator-2A3":    true,
		"UA/VALENS":        true,
		"Tarnished Scale":  true,
		"Violent Darkness": true,
		"Blue Pop":         true,
		"Autumn Offensive": true,
	}
	// Function to make an API request and send the result to the channel
	makeRequest := func(path string) {
		// Determine the core based on InventoryItemPath
		core := getCoreFromInventoryItemPath(path)
		url := "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/" + path
		currentItemResponse := ItemResponse{}

		// Make API Request to get item data
		err := makeAPIRequest(gamerInfo.SpartanKey, url, nil, &currentItemResponse)
		// Check if the title is in the skip list
		title := currentItemResponse.CommonData.Title.Value

		if _, found := skipTitles[title]; found {
			results <- RewardResult{} // Send an empty result to ensure channel doesn't block
		}
		if err != nil {
			fmt.Println("Error making request for item data: ", err)
		}

		// Strip extraneous data if not armor kit
		if !currentItemResponse.IsKit {
			currentItemResponse = StripKitDataFromItem(currentItemResponse)
		}
		itemImagePath := currentItemResponse.CommonData.Media.Media.MediaUrl.Path
		fmt.Println("Making request for ", itemImagePath)

		url = "https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/" + itemImagePath
		rawImageData, err := makeAPIRequestImage(gamerInfo.SpartanKey, url, nil)
		if err != nil {
			fmt.Println("Error getting image data: ", err)
		}

		// Compress the raw image to be stored in the redis database
		// Images is resized to 140x140, this is done to reduce the size of the response
		// (Also, the images are displayed at 140x140 on the front end, so it's not a big deal to resize them here)
		rawImageData, err = compressPNGWithImaging(rawImageData, true, 140, 140)

		if err != nil {
			results <- RewardResult{} // Send an empty result to ensure channel doesn't block
		} else {
			currentItemResponse.CommonData.CoreTitle = core // Assign Core
			results <- RewardResult{Path: path, ImageData: rawImageData, Item: currentItemResponse.CommonData, DetailedItem: currentItemResponse}
		}
	}

	totalPaths := 0
	var filteredRewards []ItemsInInventory

	for _, item := range Items.InventoryItems {
		if item.ItemPath != "" {
			if !isExcludedItemType(item.ItemType) {
				// Concurrently fetch item data
				if strings.Contains(item.ItemPath, "Emblem") || item.ItemPath == "" || strings.Contains(item.ItemPath, "002-001-wlv-e781426b") {
					continue
				}

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
		fmt.Println("Checking result: ", result.Path)

		for _, item := range Items.InventoryItems {
			// Update Free Rewards
			if item.ItemPath == result.Path {
				item.ItemMetaData = result.Item
				item.DetailedItem = result.DetailedItem

				ctx := context.Background()
				itemPath := item.ItemPath
				itemBytes, err := json.Marshal(item)
				if err != nil {
					fmt.Printf("Error marshalling item: %v", err)
				}

				itemJustImageData := ItemJustImage{
					ItemImageData: result.ImageData,
				}
				itemBytesJustImageData, err := json.Marshal(itemJustImageData)
				if err != nil {
					fmt.Printf("Error marshalling item: %v", err)
				}

				// Insert twice into Redis. Once with the full item data and once with just the image data

				if err := db.RedisClient.HSet(ctx, "items_images", itemPath, itemBytesJustImageData).Err(); err != nil {
					fmt.Printf("error setting value in Redis: %v", err)
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
		fmt.Println("Error decoding png")

		return "", err
	}

	// Resize if needed
	if resize {
		img = imaging.Resize(img, width, height, imaging.Lanczos)
	}

	// Encode the image to PNG
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		fmt.Println("Error encoding to png")
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
		"AiColor":                       true,
		"WeaponTheme":                   true,
		"WeaponAlternateGeometryRegion": true,
		"SpartanBackdropImage":          true,
		"WeaponCharm":                   true,
		"WeaponDeathFx":                 true,
		"AiModel":                       true,
		"AiTheme":                       true,
	}

	_, found := excludedTypes[itemType]
	return found
}

// WAYPOINT ENDPOINTS
// https://economy.svc.halowaypoint.com/hi/customization?players=xuid() => returns Inventory Response
// https://gamecms-hacs.svc.halowaypoint.com/hi/Waypoint/file/images/emblems/mapping.json => returns Emblem Mapping
// https://gamecms-hacs.svc.halowaypoint.com/hi/Waypoint/file/ => returns Emblem Image/Nameplate Image

func GetInventory(c *gin.Context, gamerInfo requests.GamerInfo) ([]SpartanInventory, error) {
	fmt.Println("Getting Inventory!")
	// Headers
	hdrs := map[string]string{}
	hdrs["Accept"] = "application/json"

	// Adds Clearance Code from GamerInfo to headers. Required for querying the economy.svc.halowaypoint.com endpoint
	hdrs["343-clearance"] = gamerInfo.ClearanceCode

	// Create a structure to hold the response. The response from the endpoint is a list of the players currently equipped items.
	var inventoryResponse InventoryResponse
	url := "https://economy.svc.halowaypoint.com/hi/customization?players=xuid(" + gamerInfo.XUID + ")"
	err := makeAPIRequest(gamerInfo.SpartanKey, url, hdrs, &inventoryResponse)
	if err != nil {
		fmt.Println("Error getting inventory: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
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
			fmt.Println("Emblem data for not found", targetPart)
			fmt.Println("Setting to default emblem")

			db.GetData("default_emblem_info", bson.M{}, &customization.Result.EmblemInfo)
			db.GetData("default_emblem_colors", bson.M{}, &customization.Result.EmblemColors)
			// Add the customized SpartanInventory to the slice.
			spartanInventories = append(spartanInventories, customization.Result)
			continue

		}
		configData, found := emblemData[fmt.Sprint(configID)]
		if !found {
			err = db.GetData("default_emblem_config", bson.M{}, &configData)
			if err != nil {
				c.Error(err)
				fmt.Println("Error getting default emblem config")
			}

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
	spartanInventory.CoreDetails = details

}

// Unmarshall the JSON response from the core details endpoint
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

// Loads Armor Cores in from an endpoint and stores them in the database
func LoadArmorCores(gamerInfo requests.GamerInfo, armorcore string) string {
	url := "https://gamecms-hacs.svc.halowaypoint.com/hi/progression/file/cores/armorcores/" + armorcore + ".json"
	currentItemResponse := ItemResponse{}

	// Make API Request to get item data
	err := makeAPIRequest(gamerInfo.SpartanKey, url, nil, &currentItemResponse)
	if err != nil {
		fmt.Println("Error making request for item data: ", err)
	}
	itemImagePath := currentItemResponse.CommonData.Media.Media.MediaUrl.Path
	// 	url = "https://gamecms-hacs.svc.halowaypoint.com/hi/images/file/" + itemImagePath
	return itemImagePath
}

type ItemRequest struct {
	ImagePath string `json:"ImagePath"`
}

// Returns the image data from the redis server for a given item
func HandleGetItemImage(c *gin.Context) {
	fmt.Println("in item image!")
	var item ItemRequest
	var existingItem ItemsInInventory

	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Println("Getting Image!", item.ImagePath)

	// Retrieve the item from Redis
	ctx := context.Background()
	val, err := db.RedisClient.HGet(ctx, "items_images", item.ImagePath).Result()

	if err != nil {
		fmt.Println("Error getting from Redis: ", err)
	}

	if err := json.Unmarshal([]byte(val), &existingItem); err != nil {
		fmt.Printf("Error unmarshalling item from Redis: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"imageData": existingItem.ItemImageData,
	})
}
