package spartanreport

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	requests "spartanreport/requests"

	"cloud.google.com/go/storage"
	"github.com/gin-gonic/gin"
)

type OpsDetailsToReturn struct {
	Season Season `json:"selectedSeason"`
	Track  Track  `json:"track"`
}

func HandleOperationDetails(c *gin.Context) {
	operationID := c.Param("id")
	// Create a new string with the operation ID and RewardTracks/Operations/ appended to the front and .json appended to the end
	operationPath := "RewardTracks/Operations/" + operationID + ".json"
	fmt.Println("operationPath: ", operationPath)
	seasonFound := Season{}
	// For each season in cachedSeasons check if the operation ID matches the one we are looking for
	seasons := GetCachedSeasons()
	for _, season := range seasons.Seasons.Seasons {
		if season.OperationTrackPath == operationPath {
			// If it does, set season to the current season and break out of the loop
			fmt.Println("Found season!")
			seasonFound = season
			break

		}
	}

	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error binding data": err.Error()})
		return
	}

	key := seasonFound.OperationTrackPath
	fmt.Println("key: ", key)
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't initialize GCS client"})
		return
	}
	bucket := client.Bucket("haloseasondata")
	obj := bucket.Object(key)

	// Try to read the data from Google Cloud Storage first
	rc, err := obj.NewReader(ctx)
	if err == nil {
		// Data exists, decode and return it
		var trackData Track
		if err := json.NewDecoder(rc).Decode(&trackData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't decode stored data"})
			return
		}
		rc.Close()

		// Populate User Track
		// Retrieve user season progression and append it to the seasons data
		userProgress := OperationRewardTracks{}
		if gamerInfo.XUID != "" {
			url := "https://economy.svc.halowaypoint.com/hi/players/xuid(" + gamerInfo.XUID + ")/rewardtracks/operations/" + operationID
			fmt.Println("Querying: ", url)
			hdrs := map[string]string{"343-clearance": gamerInfo.ClearanceCode}
			if err := makeAPIRequest(gamerInfo.SpartanKey, url, hdrs, &userProgress); err != nil {
				fmt.Println("Error while getting user season progression: ", err)
				return
			}
			seasonFound = appendMatchingSeasonProgression(seasonFound, userProgress)
		}

		c.JSON(http.StatusOK, OpsDetailsToReturn{Season: seasonFound, Track: trackData})
		return
	} else if err != storage.ErrObjectNotExist {
		// Some other error occurred
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't retrieve data"})
		return
	}

	// If data doesn't exist, fetch and store it
	track := GetSeasonRewards(gamerInfo, seasonFound)
	track.Ranks = GetTrackImages(gamerInfo, track.Ranks)

	// Store the data into Google Cloud Storage
	wc := obj.NewWriter(ctx)
	if err := json.NewEncoder(wc).Encode(track); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't encode data"})
		return
	}
	if err := wc.Close(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't write data"})
		return
	}

	c.JSON(http.StatusOK, OpsDetailsToReturn{Season: seasonFound, Track: track})
}

func appendMatchingSeasonProgression(season Season, userTrack OperationRewardTracks) Season {
	season.SeasonProgression = userTrack
	return season
}
