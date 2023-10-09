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

type FileDetail struct {
	Prefix string `json:"Prefix"`
}

type AssetStats struct {
	PlaysRecent int `json:"PlaysRecent"`
	// ... other fields
}

type PlaylistInfo struct {
	AssetId    string     `json:"AssetId"`
	VersionId  string     `json:"VersionId"`
	PublicName string     `json:"PublicName"`
	Files      FileDetail `json:"Files"`
	AssetStats AssetStats `json:"AssetStats"`
	// ... add other fields as needed
}

type Medal struct {
	NameId                    int64 `json:"NameId"`
	Count                     int   `json:"Count"`
	TotalPersonalScoreAwarded int   `json:"TotalPersonalScoreAwarded"`
}

type PersonalScore struct {
	NameId                    int64 `json:"NameId"`
	Count                     int   `json:"Count"`
	TotalPersonalScoreAwarded int   `json:"TotalPersonalScoreAwarded"`
}

type CoreStats struct {
	Score          int             `json:"Score"`
	PersonalScore  int             `json:"PersonalScore"`
	RoundsWon      int             `json:"RoundsWon"`
	RoundsLost     int             `json:"RoundsLost"`
	Kills          int             `json:"Kills"`
	Deaths         int             `json:"Deaths"`
	Assists        int             `json:"Assists"`
	KDA            float64         `json:"KDA"`
	Suicides       int             `json:"Suicides"`
	Betrayals      int             `json:"Betrayals"`
	Medals         []Medal         `json:"Medals"`
	PersonalScores []PersonalScore `json:"PersonalScores"`
}

type Stats struct {
	CoreStats CoreStats `json:"CoreStats"`
	// ... other fields if needed
}

type Team struct {
	TeamId  int   `json:"TeamId"`
	Outcome int   `json:"Outcome"`
	Rank    int   `json:"Rank"`
	Stats   Stats `json:"Stats"`
}

type AssetDetailed struct {
	AssetKind int    `json:"AssetKind"`
	AssetId   string `json:"AssetId"`
	VersionId string `json:"VersionId"`
}

type MatchInfoDetailed struct {
	StartTime           string       `json:"StartTime"`
	EndTime             string       `json:"EndTime"`
	Duration            string       `json:"Duration"`
	MapVariant          Asset        `json:"MapVariant"`
	UgcGameVariant      Asset        `json:"UgcGameVariant"`
	Playlist            Asset        `json:"Playlist"`
	PlaylistMapModePair Asset        `json:"PlaylistMapModePair"`
	PlaylistInfo        PlaylistInfo `json:"PlaylistInfo"`
}

type ParticipationInfo struct {
	FirstJoinedTime string `json:"FirstJoinedTime"`
	// ... other fields
}

type PlayerTeamStats struct {
	TeamId int   `json:"TeamId"`
	Stats  Stats `json:"Stats"`
}

type Gamerpic struct {
	Small  string `json:"small"`
	Medium string `json:"medium"`
	Large  string `json:"large"`
	Xlarge string `json:"xlarge"`
}

type PlayerProfile struct {
	XUID     string   `json:"xuid"`
	Gamertag string   `json:"gamertag"`
	Gamerpic Gamerpic `json:"gamerpic"`
}

// Add PlayerProfile to the Player struct
type Player struct {
	PlayerId          string            `json:"PlayerId"`
	PlayerType        int               `json:"PlayerType"`
	ParticipationInfo ParticipationInfo `json:"ParticipationInfo"`
	PlayerTeamStats   []PlayerTeamStats `json:"PlayerTeamStats"`
	Profile           PlayerProfile     // Add this line to include the PlayerProfile
}

type Match struct {
	MatchId   string    `json:"MatchId"`
	MatchInfo MatchInfo `json:"MatchInfo"`
	Teams     []Team    `json:"Teams"`
	Players   []Player  `json:"Players"`
}

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
	var matchStats Match
	matchStats = GetMatchStats(c, spartanKey, matchId) // Note that GetMatchStats now returns Match
	matchStats = formatMatchStats(spartanKey, matchStats)

	// Instantiate a PlaylistInfo struct to populate
	var playlistInfo PlaylistInfo

	// Get assetID and versionID from your existing data, perhaps like this:
	playlistAssetID := matchStats.MatchInfo.Playlist.AssetId
	playlistVersionID := matchStats.MatchInfo.Playlist.VersionId
	err := FetchPlaylistDetails(spartanKey, playlistAssetID, playlistVersionID, &playlistInfo)
	if err != nil {
		fmt.Println(err)
	}
	matchStats.MatchInfo = formatMatchTimes(matchStats.MatchInfo)
	fetchPlayerProfiles(spartanKey, &matchStats)
	matchStats.MatchInfo.PlaylistInfo = playlistInfo
	c.JSON(http.StatusOK, matchStats)
}

func GetMatchStats(c *gin.Context, spartanToken string, matchId string) Match {
	hdrs := http.Header{}
	var data Match // Note that it's now a Match type instead of a map

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

func formatMatchStats(spartanToken string, match Match) Match {
	assetID := ""
	versionID := ""

	// Get VersionID / AssetID's of map played on
	mapVariant := match.MatchInfo.MapVariant
	versionID = mapVariant.VersionId
	assetID = mapVariant.AssetId

	fmt.Printf("VersionId: %s, AssetId: %s\n", versionID, assetID)

	// Your HTTP header and request logic
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

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err)
		return match // Returning the unchanged match
	}

	// Unmarshal logic
	var rawResponse map[string]interface{}
	err = json.Unmarshal(body, &rawResponse)
	if err != nil {
		fmt.Println("Error unmarshaling raw response:", err)
		return match // Returning the unchanged match
	}

	prefix, _ := rawResponse["Files"].(map[string]interface{})["Prefix"].(string)
	filePaths, _ := rawResponse["Files"].(map[string]interface{})["FileRelativePaths"].([]interface{})
	publicName, _ := rawResponse["PublicName"].(string)

	var mapImagePath string
	var fallbackImagePath string

	for _, path := range filePaths {
		strPath, ok := path.(string)
		if ok {
			if strPath == "images/thumbnail.jpg" {
				mapImagePath = prefix + strPath
				break // found the thumbnail.jpg
			} else if fallbackImagePath == "" && (strings.HasSuffix(strPath, ".png") || strings.HasSuffix(strPath, ".jpg")) {
				fallbackImagePath = prefix + strPath
			}
		}
	}

	if mapImagePath == "" {
		mapImagePath = fallbackImagePath // Use fallback if thumbnail.jpg not found
	}

	match.MatchInfo.MapImagePath = mapImagePath
	match.MatchInfo.PublicName = publicName

	return match
}

func fetchPlayerProfiles(spartanToken string, match *Match) {
	hdrs := http.Header{}
	hdrs.Set("X-343-Authorization-Spartan", spartanToken)

	client := &http.Client{}

	// Extract xuids from the PlayerIds in the Match struct
	var xuids []string
	for _, player := range match.Players {
		xuid := strings.TrimPrefix(player.PlayerId, "xuid(")
		xuid = strings.TrimSuffix(xuid, ")")
		xuids = append(xuids, xuid)
	}

	// Join the xuids slice into a comma-separated string
	xuidsStr := strings.Join(xuids, ",")

	url := fmt.Sprintf("https://profile.svc.halowaypoint.com/users?xuids=%s", xuidsStr)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Println("Failed to create request:", err)
		return
	}

	req.Header = hdrs

	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Failed to make request:", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Received a non-OK status code %d. Response body: %s\n", resp.StatusCode, string(bodyBytes))
		return
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Failed to read response body:", err)
		return
	}

	// Unmarshal the JSON into a slice of PlayerProfile structs
	var playerProfiles []PlayerProfile
	err = json.Unmarshal(body, &playerProfiles)
	if err != nil {
		fmt.Println("Failed to parse JSON response:", err)
		return
	}

	// Attach each PlayerProfile to the corresponding Player in the Match
	for _, profile := range playerProfiles {
		for i, player := range match.Players {
			xuid := strings.TrimPrefix(player.PlayerId, "xuid(")
			xuid = strings.TrimSuffix(xuid, ")")
			if profile.XUID == xuid {
				match.Players[i].Profile = profile
				break
			}
		}
	}
}

func FetchPlaylistDetails(spartanToken, assetID, versionID string, playlistInfo *PlaylistInfo) error {
	hdrs := http.Header{}
	hdrs.Set("X-343-Authorization-Spartan", spartanToken)
	hdrs.Set("Accept", "application/json")

	client := &http.Client{}
	url := fmt.Sprintf("https://discovery-infiniteugc.svc.halowaypoint.com/hi/Playlists/%s/versions/%s", assetID, versionID)
	fmt.Println(url)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("Failed to create request: %v", err)
	}
	req.Header = hdrs

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("Received a non-OK status code %d. Response body: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("Failed to read response body: %v", err)
	}

	err = json.Unmarshal(body, playlistInfo)
	if err != nil {
		return fmt.Errorf("Failed to parse JSON response: %v", err)
	}
	return nil
}
