package spartanreport

import (
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type EventsHome struct {
	PreviousSeason Season `json:"PreviousSeason"`
	CurrentSeason  Season `json:"CurrentSeason"`
}

func HandleEventsHome(c *gin.Context) {
	fmt.Println("HandleEventsHome")
	ctx := context.Background()
	seasonID := "SeasonData"
	cachedSeasons, exists := seasonCache.Get(ctx, seasonID)
	if exists {
		var activeIndex int
		for i, season := range cachedSeasons.Seasons {
			if season.IsActive {
				activeIndex = i
				break
			}
		}

		// Check if the active season is not the first one in the list
		if activeIndex > 0 {
			EventsToReturn := EventsHome{
				PreviousSeason: cachedSeasons.Seasons[activeIndex],
				CurrentSeason:  cachedSeasons.Seasons[activeIndex+1],
			}
			c.JSON(http.StatusOK, EventsToReturn)
			return
		}

		// Handle case where the active season is the first in the list
		EventsToReturn := EventsHome{
			PreviousSeason: cachedSeasons.Seasons[activeIndex], // or set a default value
			CurrentSeason:  cachedSeasons.Seasons[activeIndex+1],
		}
		c.JSON(http.StatusOK, EventsToReturn)
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while getting events"})
}
