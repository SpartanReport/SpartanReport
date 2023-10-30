package halotestapp

import (
	"encoding/json"
	"fmt"
	requests "halotestapp/requests"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var matchInfoMutex sync.Mutex
var playlistInfoMutex sync.Mutex

type TemplateData struct {
	HaloStats HaloData
	GamerInfo requests.GamerInfo // Assuming GamerInfo is of type requests.GamerInfo
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

	var wg sync.WaitGroup

	for i := range haloStats.Results {
		wg.Add(1) // Increment the WaitGroup counter

		go func(i int) {
			defer wg.Done() // Decrement the counter when the goroutine completes

			matchID := haloStats.Results[i].MatchId

			// Fetch and format MatchInfo
			fetchedMatch, _ := GetMatchStats(c, gamerInfo.SpartanKey, matchID)
			formattedMatch := formatMatchStats(gamerInfo.SpartanKey, fetchedMatch) // Assuming formatMatchStats returns Match
			formattedMatch.MatchInfo = formatMatchTimes(formattedMatch.MatchInfo)  // Assuming formatMatchTimes returns MatchInfo

			haloStats.Results[i].Match = formattedMatch

			// For PlaylistInfo
			playlistAssetID := haloStats.Results[i].Match.MatchInfo.Playlist.AssetId
			playlistVersionID := haloStats.Results[i].Match.MatchInfo.Playlist.VersionId

			var playlistInfo PlaylistInfo
			err := FetchPlaylistDetails(gamerInfo.SpartanKey, playlistAssetID, playlistVersionID, &playlistInfo)
			if err != nil {
				fmt.Println("Error fetching playlist details ", err)
			} else {
				haloStats.Results[i].Match.MatchInfo.PlaylistInfo = playlistInfo
			}
		}(i)
	}

	wg.Wait() // Wait for all goroutines to complete

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
