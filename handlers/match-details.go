package halotestapp

import (
	"fmt"
	requests "halotestapp/requests"
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
	GamerInfo     requests.GamerInfo `json:"gamerInfo"`
	SelectedMatch Match              `json:"selectedMatch"`
}

func HandleMatch(c *gin.Context) {
	var compData CompositeData
	if err := c.ShouldBindJSON(&compData); err != nil {
		fmt.Println("could not bind data")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	spartanKey := compData.GamerInfo.SpartanKey

	matchStats := compData.SelectedMatch
	fmt.Println("stats", matchStats.Players)
	fetchPlayerProfiles(spartanKey, &matchStats)
	c.JSON(http.StatusOK, matchStats)
}

func GetMatchStats(c *gin.Context, spartanToken string, matchId string) (Match, error) {
	var data Match
	url := fmt.Sprintf("https://halostats.svc.halowaypoint.com/hi/matches/%s/stats", matchId)
	err := makeAPIRequest(spartanToken, url, nil, &data)
	if err != nil {
		c.String(http.StatusInternalServerError, "%v", err)
		return data, err
	}
	return data, nil
}

func formatMatchStats(spartanToken string, match Match) Match {
	assetID := match.MatchInfo.MapVariant.AssetId
	versionID := match.MatchInfo.MapVariant.VersionId

	if assetID == "" || versionID == "" {
		fmt.Println("Unable to get asset ID and version ID of map")
		return match
	}

	url := fmt.Sprintf("https://discovery-infiniteugc.svc.halowaypoint.com/hi/maps/%s/versions/%s", assetID, versionID)
	var rawResponse map[string]interface{}
	if err := makeAPIRequest(spartanToken, url, nil, &rawResponse); err != nil {
		fmt.Println("Error fetching map details:", err)
		return match
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
				break
			} else if fallbackImagePath == "" && (strings.HasSuffix(strPath, ".png") || strings.HasSuffix(strPath, ".jpg")) {
				fallbackImagePath = prefix + strPath
			}
		}
	}

	if mapImagePath == "" {
		mapImagePath = fallbackImagePath
	}

	match.MatchInfo.MapImagePath = mapImagePath
	match.MatchInfo.PublicName = publicName
	return match
}

func fetchPlayerProfiles(spartanToken string, match *Match) {
	var xuids []string
	for _, player := range match.Players {
		xuid := player.PlayerId
		if strings.HasPrefix(xuid, "bid(") {
			continue
		}
		xuid = strings.TrimPrefix(xuid, "xuid(")
		xuid = strings.TrimSuffix(xuid, ")")
		xuids = append(xuids, xuid)
	}
	xuidsStr := strings.Join(xuids, ",")
	url := fmt.Sprintf("https://profile.svc.halowaypoint.com/users?xuids=%s", xuidsStr)

	var playerProfiles []PlayerProfile
	err := makeAPIRequest(spartanToken, url, nil, &playerProfiles)
	if err != nil {
		fmt.Println("Error while fetching player profiles:", err)
		return
	}

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
	url := fmt.Sprintf("https://discovery-infiniteugc.svc.halowaypoint.com/hi/Playlists/%s/versions/%s", assetID, versionID)
	return makeAPIRequest(spartanToken, url, nil, playlistInfo)
}
