package spartanreport

import (
	"encoding/json"
	"fmt"
	"net/http"
	"spartanreport/db"
	requests "spartanreport/requests"
	. "spartanreport/structures"

	"github.com/gin-gonic/gin"
)

type SaveCustomKit struct {
	CustomKit CustomKit          `json:"newDummyObject"`
	GamerInfo requests.GamerInfo `json:"gamerInfo"`
}
type UpdateCustomKit struct {
	GamerInfo requests.GamerInfo `json:"gamerInfo"`
	CustomKit CustomKit          `json:"newDummyObject"`
}
type DeleteCustomKit struct {
	Id        string             `json:"idToRemove"`
	GamerInfo requests.GamerInfo `json:"gamerInfo"`
}

type GetCustomKit struct {
	GamerInfo requests.GamerInfo `json:"gamerInfo"`
}

func HandleSaveCustomKit(c *gin.Context) {
	fmt.Println("Custom Kit received")
	var customKitData SaveCustomKit
	if err := c.ShouldBindJSON(&customKitData); err != nil {
		fmt.Println("Error binding JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newGamerInfo := customKitData.GamerInfo
	if newGamerInfo.SpartanKey == "" {
		c.JSON(http.StatusForbidden, "Empty GamerInfo received")
		return
	}
	prettyJSON, err := json.MarshalIndent(customKitData.CustomKit, "", "    ")
	if err != nil {
		fmt.Println("Error marshalling to pretty JSON:", err)
		return
	}
	fmt.Println("Pretty JSON of customKitData.CustomKit:")
	fmt.Println(string(prettyJSON))

	// Calculate the size of customKitData in KB
	rawJSON, err := json.Marshal(customKitData)
	if err != nil {
		fmt.Println("Error marshalling to raw JSON:", err)
		return
	}
	sizeInBytes := len(rawJSON)
	sizeInKB := float64(sizeInBytes) / 1024.0
	fmt.Printf("Size of customKitData: %.2f KB\n", sizeInKB)
	// First, add the gamerInfo to progression_data, if it already exists, nothing happens.
	// Remove sensitive information from storing
	truncatedGamerInfo := newGamerInfo
	truncatedGamerInfo.XBLToken = ""
	truncatedGamerInfo.SpartanKey = ""
	dataToStore := struct {
		GamerInfo requests.GamerInfo
	}{
		GamerInfo: truncatedGamerInfo,
	}
	err = db.CheckAndAddProgression("progression_data", dataToStore, "gamerinfo.xuid", newGamerInfo.XUID)
	if err != nil {
		fmt.Println("Error adding gamerinfo to db")
	}
	db.AddKit("progression_data", newGamerInfo.XUID, customKitData.CustomKit)

}

func HandleUpdateCustomKit(c *gin.Context) {
	fmt.Println("Custom Kit update request!")
	var requestData UpdateCustomKit
	if err := c.ShouldBindJSON(&requestData); err != nil {
		fmt.Println("Error binding JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newGamerInfo := requestData.GamerInfo

	err := db.UpdateKit("progression_data", newGamerInfo.XUID, requestData.CustomKit.Id, requestData.CustomKit)
	if err != nil {
		fmt.Println("Error updating kit:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update kit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kit updated successfully"})
}

func HandleRemoveCustomKit(c *gin.Context) {
	fmt.Println("Custom Kit remove request!")
	var customKitData DeleteCustomKit
	if err := c.ShouldBindJSON(&customKitData); err != nil {
		fmt.Println("Error binding JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newGamerInfo := customKitData.GamerInfo
	if newGamerInfo.SpartanKey == "" {
		c.JSON(http.StatusForbidden, "Empty GamerInfo received")
		return
	}
	db.DeleteKit("progression_data", newGamerInfo.XUID, customKitData.Id)
}

func HandleGetCustomKit(c *gin.Context) {
	fmt.Println("Checking Custom Kit")
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		fmt.Println("Error binding JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	kits, err := db.GetKit("progression_data", gamerInfo.XUID)
	if err != nil {
		fmt.Println("Error getting kit:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve kits"})
		return
	}

	// Check if kits is not empty
	if len(kits) == 0 {
		fmt.Println("No kits found")
		c.JSON(http.StatusNotFound, gin.H{"message": "No kits found"})
		return
	}

	// If kits is already in JSON format, send it directly
	fmt.Println("Kits data:", string(kits))
	c.Data(http.StatusOK, "application/json", kits)
}

func HandleGetCustomKitById(c *gin.Context) {
	kitID := c.Param("kitId")
	xuid := c.Param("xuid")

	kits, err := db.GetKitByID("progression_data", xuid, kitID)
	userInfo, err := db.GetGamerInfoByXUID("progression_data", xuid)
	if err != nil {
		fmt.Println("Error getting kit:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve kits"})
		return
	}
	if err != nil {
		fmt.Println("Error getting kit:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve kits"})
		return
	}

	kits.Image = userInfo

	// Convert kits struct to json and send it
	kitsJSON, err := json.Marshal(kits)
	if err != nil {
		fmt.Println("Error marshalling kits to JSON:", err)
		return

	}

	c.Data(http.StatusOK, "application/json", kitsJSON)
}
