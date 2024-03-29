package spartanreport

import (
	"fmt"
	"net/http"
	requests "spartanreport/requests"
	. "spartanreport/structures"

	"github.com/gin-gonic/gin"
)

type ArmorCoreEquip struct {
	GamerInfo         requests.GamerInfo
	CurrentlyEquipped CurrentlyEquipped
}

type Items struct {
	InventoryItems []ItemsInInventory `json:"Items"`
}

type ItemsInInventory struct {
	Amount        int          `json:"Amount"`
	ItemId        string       `json:"ItemId"`
	ItemPath      string       `json:"ItemPath"`
	ItemType      string       `json:"ItemType"`
	ItemImageData string       `json:"ItemImageData"`
	ItemMetaData  Item         `json:"Item"`
	DetailedItem  ItemResponse `json:"DetailedItem"`
}
type ItemJustImage struct {
	ItemImageData string `json:"ItemImageData"`
}

func HandleEquipArmor(c *gin.Context) {
	var ArmorCoreData ArmorCoreEquip
	if err := c.ShouldBindJSON(&ArmorCoreData); err != nil {
		fmt.Println("could not bind data")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	gamerInfo := ArmorCoreData.GamerInfo
	fmt.Println("Helmet Path: ", ArmorCoreData.CurrentlyEquipped.Helmet.CoreId)
	fmt.Println("Visor Path: ", ArmorCoreData.CurrentlyEquipped.Visor.CoreId)

	// Send Core inventory data
	if ArmorCoreData.CurrentlyEquipped.Core.GetInv {
		customization := GetCurrentArmor(gamerInfo, ArmorCoreData, true)
		ChangeCurrentArmor(gamerInfo, customization)
		c.JSON(http.StatusOK, customization)
		return

	}
	// Print the formatted JSON
	customization := GetCurrentArmor(gamerInfo, ArmorCoreData, false)
	ChangeCurrentArmor(gamerInfo, customization)
	fmt.Println("Armor Changed!")

	c.JSON(http.StatusOK, gin.H{"message": "Done"})
}
