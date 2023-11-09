package spartanreport

import (
	"fmt"
	"net/http"
	requests "spartanreport/requests"

	"github.com/gin-gonic/gin"
)

type ArmorCoreEquip struct {
	GamerInfo requests.GamerInfo
	Core      string
}

type Items struct {
	InventoryItems []ItemsInInventory `json:"Items"`
}

type ItemsInInventory struct {
	Amount        int    `json:"Amount"`
	ItemId        string `json:"ItemId"`
	ItemPath      string `json:"ItemPath"`
	ItemType      string `json:"ItemType"`
	ItemImageData string `json:"ItemImageData"`
	ItemMetaData  Item   `json:"Item"`
}

func HandleEquipArmor(c *gin.Context) {
	var ArmorCoreData ArmorCoreEquip
	if err := c.ShouldBindJSON(&ArmorCoreData); err != nil {
		fmt.Println("could not bind data")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	gamerInfo := ArmorCoreData.GamerInfo
	core := ArmorCoreData.Core

	customization := GetCurrentArmor(gamerInfo, core)
	ChangeCurrentArmor(gamerInfo, customization)
	fmt.Println("Armor Changed!")
	c.JSON(http.StatusOK, gin.H{"message": "Done"})
}