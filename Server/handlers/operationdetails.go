package spartanreport

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"spartanreport/db"
	requests "spartanreport/requests"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
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
	ctx := context.Background()
	seasonID := "SeasonData"
	cachedSeasons, exists := seasonCache.Get(ctx, seasonID)
	if exists {
		for _, season := range cachedSeasons.Seasons {
			if season.OperationTrackPath == operationPath {
				// If it does, set season to the current season and break out of the loop
				fmt.Println("Found season!")
				seasonFound = season
				break

			}
		}
	}

	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error binding data": err.Error()})
		return
	}

	key := seasonFound.OperationTrackPath
	fmt.Println("key: ", key)

	// Read from redis instead. Redis stores the data in a hash
	obj, err := db.RedisClient.HGet(ctx, "haloseasondata", key).Result()
	// Data exists, decode and return it
	var trackData Track

	if err == redis.Nil {
		// If data doesn't exist, fetch and store it
		track := GetSeasonRewards(gamerInfo, seasonFound)
		track.Ranks = GetTrackImages(gamerInfo, track.Ranks)
		trackJSON, err := json.Marshal(track)
		if err != nil {
			fmt.Printf("error marshaling Track struct to JSON: %v", err)
		}

		// Save the serialized JSON string to Redis
		if err := db.RedisClient.HSet(ctx, "haloseasondata", key, trackJSON).Err(); err != nil {
			fmt.Printf("error setting value in Redis: %v", err)
		}

		trackData = track
	} else {
		// Marshall Obj into track

		if err := json.Unmarshal([]byte(obj), &trackData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't decode data"})
			return
		}

	}

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

}

func appendMatchingSeasonProgression(season Season, userTrack OperationRewardTracks) Season {
	season.SeasonProgression = userTrack
	return season
}
