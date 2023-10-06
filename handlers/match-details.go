package halotestapp

import (
	"encoding/json"
	"fmt"
	requests "halotestapp/requests"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type MatchData map[string]interface{}
type MapData struct {
	AssetId      string   `json:"AssetId"`
	VersionId    string   `json:"VersionId"`
	Prefix       string   `json:"Files.Prefix"`
	FilePaths    []string `json:"Files.FileRelativePaths"`
	MapImagePath string   // New field
	// Add other fields as needed
}
type CompositeData struct {
	HaloStats HaloData           `json:"HaloStats"`
	GamerInfo requests.GamerInfo `json:"gamerInfo"`
}

func HandleMatch(c *gin.Context) {
	matchId := c.Param("id")
	var compData CompositeData

	if err := c.ShouldBindJSON(&compData); err != nil {
		fmt.Println("could not bind data")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	spartanKey := compData.GamerInfo.SpartanKey

	// Fetch match stats
	matchStats := GetMatchStats(c, spartanKey, matchId)
	// Format match stats
	matchStats = formatMatchStats(spartanKey, matchStats)

	c.JSON(http.StatusOK, matchStats)
}

func GetMatchStats(c *gin.Context, spartanToken string, matchId string) MatchData {
	hdrs := http.Header{}
	var data MatchData

	hdrs.Set("X-343-Authorization-Spartan", spartanToken)
	hdrs.Set("Accept", "application/json")

	client := &http.Client{}
	url := fmt.Sprintf("https://halostats.svc.halowaypoint.com/hi/matches/%s/stats", matchId)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to create request")
		return data
	}

	req.Header = hdrs

	resp, err := client.Do(req)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to make request")
		return data
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		c.String(resp.StatusCode, "Received a non-OK status code. Response body: %s\n", string(bodyBytes))
		return data
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to read response body")
		return data
	}

	err = json.Unmarshal(body, &data)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to parse JSON response")
		return data
	}

	return data
}

func formatMatchStats(spartanToken string, matchStats MatchData) MatchData {
	assetID := ""
	versionID := ""
	// Get VersionID / AssetID's of map played on
	if matchInfo, ok := matchStats["MatchInfo"].(map[string]interface{}); ok {
		// Assert that 'UgcGameVariant' exists and is a map
		if ugcGameVariant, ok := matchInfo["MapVariant"].(map[string]interface{}); ok {
			// Extract VersionId and AssetId
			versionID = ugcGameVariant["VersionId"].(string)
			assetID = ugcGameVariant["AssetId"].(string)

			fmt.Printf("VersionId: %s, AssetId: %s\n", versionID, assetID)
		}
	}

	// https://discovery-infiniteugc.svc.halowaypoint.com/hi/maps/6ae862f6-6a00-42e7-b1c6-3d2c337de7ed/versions/9f7faf2d-56cd-45ce-af42-011eb9218434
	hdrs := http.Header{}

	if spartanToken == "" {
		fmt.Println("SpartanToken is empty")

	}

	hdrs.Set("X-343-Authorization-Spartan", spartanToken)
	hdrs.Set("Accept", "application/json")
	if assetID == "" && versionID == "" {
		fmt.Println("Unable to get asset ID and version ID of map")
	}
	url := "https://discovery-infiniteugc.svc.halowaypoint.com/hi/maps/" + assetID + "/versions/" + versionID
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Println("oops")
		fmt.Println(err)
	}
	client := &http.Client{}
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
		fmt.Println(err)
		return matchStats
	}
	// Unmarshal the raw response body into a map
	var rawResponse map[string]interface{}
	err = json.Unmarshal(body, &rawResponse)
	if err != nil {
		fmt.Println("Error unmarshaling raw response:", err)
		return matchStats
	}

	// Find the Prefix and FileRelativePaths
	prefix, _ := rawResponse["Files"].(map[string]interface{})["Prefix"].(string)
	filePaths, _ := rawResponse["Files"].(map[string]interface{})["FileRelativePaths"].([]interface{})
	// Find the PublicName
	publicName, _ := rawResponse["PublicName"].(string)
	// Find the first .png or .jpg image in FileRelativePaths
	var mapImagePath string
	var fallbackImagePath string

	for _, path := range filePaths {
		strPath, ok := path.(string)
		fmt.Println("Path: ", strPath)
		if ok {
			if strPath == "images/thumbnail.jpg" {
				mapImagePath = prefix + strPath
				break // Exit the loop because we found the thumbnail.jpg
			} else if fallbackImagePath == "" && (strings.HasSuffix(strPath, ".png") || strings.HasSuffix(strPath, ".jpg")) {
				fallbackImagePath = prefix + strPath
			}
		}
	}

	if mapImagePath == "" {
		mapImagePath = fallbackImagePath // Use the fallback if thumbnail.jpg was not found
	}

	// Append it to the existing matchStats
	if matchInfo, ok := matchStats["MatchInfo"].(map[string]interface{}); ok {
		matchInfo["MapImagePath"] = mapImagePath
		matchInfo["PublicName"] = publicName
	} else {
		// If "MatchInfo" doesn't exist in matchStats, create it
		matchStats["MatchInfo"] = map[string]interface{}{
			"MapImagePath": mapImagePath,
		}
	}

	return matchStats

}
