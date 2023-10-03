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

func HandleMatch(c *gin.Context) {
	// Check for the SpartanToken cookie
	cookie, err := c.Cookie("SpartanToken")
	if err != nil {
		c.Redirect(http.StatusSeeOther, requests.RequestLink())
		return
	}

	// Extract matchId from URL
	matchId := c.Param("id")
	if matchId == "" {
		c.String(http.StatusBadRequest, "Match ID is missing")
		return
	}

	// Fetch match stats
	matchStats := GetMatchStats(c, matchId)

	// Format match stats
	matchStats = formatMatchStats(cookie, matchStats)

	// Get HaloStats from Gin context
	value, exists := c.Get("HaloData")
	if !exists {
		c.String(http.StatusInternalServerError, "Internal server error")
		return
	}
	HaloStats, ok := value.(HaloData)
	if !ok {
		c.String(http.StatusInternalServerError, "Internal server error")
		return
	}

	// Get GamerInfo from Gin context
	gamerInfo, exists := c.Get("gamerInfoKey")
	if !exists {
		c.String(http.StatusInternalServerError, "Internal server error")
		return
	}

	parsedStats, err := ParseGamerInfo(gamerInfo.(requests.GamerInfo))
	if err != nil {
		c.String(http.StatusInternalServerError, "Internal server error")
		return
	}

	data := struct {
		MatchStats MatchData
		HaloStats  HaloData
		GamerInfo  requests.GamerInfo
	}{
		MatchStats: matchStats,
		HaloStats:  HaloStats,
		GamerInfo:  parsedStats,
	}

	c.HTML(http.StatusOK, "base.html", gin.H{
		"data":         data,
		"gamerInfo":    gamerInfo,
		"contentBlock": "match-details",
	})
}

func GetMatchStats(c *gin.Context, matchId string) MatchData {
	hdrs := http.Header{}
	var data MatchData

	// Check for the SpartanToken cookie in Gin context
	spartanToken, err := c.Cookie("SpartanToken")
	if err != nil {
		c.String(http.StatusBadRequest, "SpartanToken not found or empty")
		return data
	}

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
	for _, path := range filePaths {
		strPath, ok := path.(string)
		if ok && (strings.HasSuffix(strPath, ".png") || strings.HasSuffix(strPath, ".jpg")) {
			mapImagePath = prefix + strPath
			break
		}
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
	fmt.Println(matchStats["MatchInfo"])
	return matchStats

}
