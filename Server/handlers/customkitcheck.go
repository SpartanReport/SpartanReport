package spartanreport

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	requests "spartanreport/requests"
	"spartanreport/structures"
)

type kitcheck struct {
	ItemsToCheck structures.CurrentlyEquipped `json:"currentlyEquippedItems"`
	GamerInfo    requests.GamerInfo           `json:"gamerInfo"`
}

// EquippedItemsCheck is the struct to hold the check results
type EquippedItemsCheck struct {
	Helmet            bool `json:"HelmetCheck"`
	Core              bool `json:"CoreCheck"`
	Visor             bool `json:"VisorCheck"`
	Gloves            bool `json:"GloveCheck"`
	Coatings          bool `json:"CoatingCheck"`
	LeftShoulderPads  bool `json:"LeftShoulderPadCheck"`
	RightShoulderPads bool `json:"RightShoulderPadCheck"`
	WristAttachments  bool `json:"WristAttachmentCheck"`
	HipAttachments    bool `json:"HipAttachmentCheck"`
	KneePads          bool `json:"KneePadCheck"`
	ChestAttachments  bool `json:"ChestAttachmentCheck"`
	MythicFxs         bool `json:"MythicFxCheck"`
	ArmorFxs          bool `json:"ArmorFxCheck"`
}

func HandleCustomKitCheck(c *gin.Context) {
	// Get GamerInfo from request
	var kitcheck kitcheck
	if err := c.ShouldBindJSON(&kitcheck); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error couldn't bind": err.Error()})
		return
	}
	equipmentCheck := EquippedItemsCheck{}
	// Get Player Inventory
	var InventoryResults = Items{}
	url := "https://economy.svc.halowaypoint.com/hi/players/xuid(" + kitcheck.GamerInfo.XUID + ")/Inventory"
	hdrs := map[string]string{}
	hdrs["343-clearance"] = kitcheck.GamerInfo.ClearanceCode
	err := makeAPIRequest(kitcheck.GamerInfo.SpartanKey, url, hdrs, &InventoryResults)
	if err != nil {
		fmt.Println(err)
		return
	}
	// For each inventory result, check if its item.Type matches any of the currentlyequipped item.Type
	// If it does, add it to a list of items to return
	for _, item := range InventoryResults.InventoryItems {
		switch item.ItemType {
		case "ArmorHelmet":
			if item.ItemPath == kitcheck.ItemsToCheck.Helmet.CorePath {
				equipmentCheck.Helmet = true
			}
		case "ArmorVisor":
			if item.ItemPath == kitcheck.ItemsToCheck.Visor.CorePath {
				equipmentCheck.Visor = true
			}
		case "ArmorGlove":
			if item.ItemPath == kitcheck.ItemsToCheck.Gloves.CorePath {
				equipmentCheck.Gloves = true
			}
		case "ArmorCoating":
			if item.ItemPath == kitcheck.ItemsToCheck.Coatings.CorePath {
				equipmentCheck.Coatings = true
			}
		case "ArmorLeftShoulderPad":
			if item.ItemPath == kitcheck.ItemsToCheck.LeftShoulderPads.CorePath {
				equipmentCheck.LeftShoulderPads = true
			}
		case "ArmorRightShoulderPad":
			if item.ItemPath == kitcheck.ItemsToCheck.RightShoulderPads.CorePath {
				equipmentCheck.RightShoulderPads = true
			}
		case "ArmorWristAttachment":
			if item.ItemPath == kitcheck.ItemsToCheck.WristAttachments.CorePath {
				equipmentCheck.WristAttachments = true
			}
		case "ArmorHipAttachment":
			if item.ItemPath == kitcheck.ItemsToCheck.HipAttachments.CorePath {
				equipmentCheck.HipAttachments = true
			}
		case "ArmorKneePad":
			if item.ItemPath == kitcheck.ItemsToCheck.KneePads.CorePath {
				equipmentCheck.KneePads = true
			}
		case "ArmorChestAttachment":
			if item.ItemPath == kitcheck.ItemsToCheck.ChestAttachments.CorePath {
				equipmentCheck.ChestAttachments = true
			}

		case "ArmorMythicFx":
			if item.ItemPath == kitcheck.ItemsToCheck.MythicFxs.CorePath {
				equipmentCheck.MythicFxs = true
			}
		case "ArmorFx":
			if item.ItemPath == kitcheck.ItemsToCheck.ArmorFxs.CorePath {
				equipmentCheck.ArmorFxs = true
			}
		}
	}
	c.JSON(http.StatusOK, equipmentCheck)

}
