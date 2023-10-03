package halotestapp

import (
	"encoding/json"
	"fmt"
	requests "halotestapp/requests"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type MatchInfo struct {
	StartTime           string `json:"StartTime"`
	EndTime             string `json:"EndTime"`
	Duration            string `json:"Duration"`
	LifecycleMode       int    `json:"LifecycleMode"`
	GameVariantCategory int    `json:"GameVariantCategory"`
	LevelId             string `json:"LevelId"`
	MapVariant          Asset  `json:"MapVariant"`
	UgcGameVariant      Asset  `json:"UgcGameVariant"`
	Playlist            Asset  `json:"Playlist"`
	PlaylistMapModePair Asset  `json:"PlaylistMapModePair"`
	ClearanceId         string `json:"ClearanceId"`
	PlaylistExperience  int    `json:"PlaylistExperience"`
	SeasonId            string `json:"SeasonId"`
	PlayableDuration    string `json:"PlayableDuration"`
	TeamsEnabled        bool   `json:"TeamsEnabled"`
	TeamScoringEnabled  bool   `json:"TeamScoringEnabled"`
	GameplayInteraction int    `json:"GameplayInteraction"`
	FormattedStartTime  string
	FormattedEndTime    string
}

type Result struct {
	MatchId             string    `json:"MatchId"`
	MatchInfo           MatchInfo `json:"MatchInfo"`
	LastTeamId          int       `json:"LastTeamId"`
	Outcome             int       `json:"Outcome"`
	Rank                int       `json:"Rank"`
	PresentAtEndOfMatch bool      `json:"PresentAtEndOfMatch"`
}

type HaloData struct {
	Start       int      `json:"Start"`
	Count       int      `json:"Count"`
	ResultCount int      `json:"ResultCount"`
	Results     []Result `json:"Results"`
}
type TemplateData struct {
	HaloStats HaloData
	GamerInfo requests.GamerInfo // Assuming GamerInfo is of type requests.GamerInfo
}

// Define a common Asset struct
type Asset struct {
	AssetKind int    `json:"AssetKind"`
	AssetId   string `json:"AssetId"`
	VersionId string `json:"VersionId"`
}

const GamerInfoKey = "gamerInfoKey"

func HandleError(c *gin.Context, err error) {
	// Log the error and respond with a generic message
	fmt.Println("Error:", err)
	c.String(http.StatusInternalServerError, "Internal server error")
}

func ParseGamerInfo(data interface{}) (requests.GamerInfo, error) {
	var gamerInfo requests.GamerInfo

	// Convert the interface{} type to JSON bytes
	jsonData, err := json.Marshal(data)
	if err != nil {
		return gamerInfo, fmt.Errorf("error marshalling data: %w", err)
	}

	// Unmarshal the JSON bytes into the GamerInfo struct
	err = json.Unmarshal(jsonData, &gamerInfo)
	if err != nil {
		return gamerInfo, fmt.Errorf("error unmarshalling data: %w", err)
	}

	return gamerInfo, nil
}

func HandleStats(c *gin.Context) {
	// Check for the SpartanToken cookie
	_, err := c.Cookie("SpartanToken")
	if err != nil {
		// Cookie is not set, so do something (like redirecting to login)
		c.Redirect(http.StatusSeeOther, requests.RequestLink())
		return
	}

	// Get HaloStats data

	haloStats, err := GetStats(c)
	if err != nil {
		HandleError(c, err)
		return
	}

	for i, result := range haloStats.Results {
		haloStats.Results[i].MatchInfo = formatMatchTimes(result.MatchInfo)
	}

	c.Set("HaloStats", haloStats)

	gamerInfo, exists := c.Get(GamerInfoKey)
	if !exists {
		// Handle the error case
		HandleError(c, fmt.Errorf("GamerInfo not found in context"))
		return
	}

	parsedStats, ok := gamerInfo.(requests.GamerInfo)
	if !ok {
		// Handle the error case
		HandleError(c, fmt.Errorf("Failed to assert type for GamerInfo"))
		return
	}

	data := TemplateData{
		HaloStats: haloStats,
		GamerInfo: parsedStats,
	}

	c.HTML(http.StatusOK, "base.html", gin.H{
		"data":         data,
		"gamerInfo":    gamerInfo,
		"contentBlock": "stats",
	})
}
func formatMatchTimes(matchInfo MatchInfo) MatchInfo {
	layoutInput := time.RFC3339Nano // This layout matches the provided format
	layoutOutput := "01/02/2006 03:04pm"

	startTime, err := time.Parse(layoutInput, matchInfo.StartTime)
	if err != nil {
		// handle error, for example, log it and return an empty MatchInfo
		fmt.Println("Error parsing start time:", err)
		return MatchInfo{}
	}

	endTime, err := time.Parse(layoutInput, matchInfo.EndTime)
	if err != nil {
		// handle error, for example, log it and return an empty MatchInfo
		fmt.Println("Error parsing end time:", err)
		return MatchInfo{}
	}

	matchInfo.FormattedStartTime = startTime.In(time.Local).Format(layoutOutput)
	matchInfo.FormattedEndTime = endTime.In(time.Local).Format(layoutOutput)
	return matchInfo
}
