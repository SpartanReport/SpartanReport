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
	PublicName          string `json:"PublicName"`
	MapImagePath        string `json:"MapImagePath"`
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
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	haloStats, err := GetStats(gamerInfo, c)
	if err != nil {
		HandleError(c, err)
		return
	}

	for i, result := range haloStats.Results {
		haloStats.Results[i].MatchInfo = formatMatchTimes(result.MatchInfo)
	}

	data := TemplateData{
		HaloStats: haloStats,
		GamerInfo: gamerInfo,
	}

	c.JSON(http.StatusOK, data)
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
