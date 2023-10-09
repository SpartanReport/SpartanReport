package halotestapp

import (
	"encoding/json"
	"fmt"
	requests "halotestapp/requests"
	"io/ioutil"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

func HandleProgression(c *gin.Context) {
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Let's assume you want to fetch 500 matches for this example
	targetMatchCount := 50
	allHaloStats, err := GetProgression(gamerInfo, c, targetMatchCount)
	if err != nil {
		HandleError(c, err)
		return
	}
	// Initialize an empty HaloData to store the merged results
	mergedHaloData := HaloData{}
	var mu sync.Mutex // Mutex for concurrent writes

	if err != nil {
		HandleError(c, err)
		return
	}

	var wg sync.WaitGroup

	// Loop through each batch of HaloData
	for _, haloStats := range allHaloStats {
		// Loop through the matches in each HaloData batch
		for i := range haloStats.Results {
			wg.Add(1) // Increment the WaitGroup counter

			go func(haloStats HaloData, i int) {
				defer wg.Done() // Decrement the counter when the goroutine completes
				matchID := haloStats.Results[i].MatchId

				// Fetch and format MatchInfo
				fetchedMatch := GetMatchStats(c, gamerInfo.SpartanKey, matchID)
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
					return
				} else {
					haloStats.Results[i].Match.MatchInfo.PlaylistInfo = playlistInfo
				}
				mu.Lock()
				mergedHaloData.Results = append(mergedHaloData.Results, haloStats.Results[i])
				mu.Unlock()
			}(haloStats, i)
		}
	}

	wg.Wait() // Wait for all goroutines to complete

	data := TemplateData{
		HaloStats: mergedHaloData,
		GamerInfo: gamerInfo,
	}

	c.JSON(http.StatusOK, data)
}

func GetProgression(gamerInfo requests.GamerInfo, c *gin.Context, targetMatchCount int) ([]HaloData, error) {
	var allData []HaloData
	dataChan := make(chan HaloData)
	errChan := make(chan error)

	// Calculate the number of requests
	numRequests := targetMatchCount / 25
	if targetMatchCount%25 != 0 {
		numRequests++
	}

	var wg sync.WaitGroup
	wg.Add(numRequests)

	for start := 0; start < targetMatchCount; start += 25 {
		go func(start int) {
			defer wg.Done()
			var data HaloData

			url := fmt.Sprintf("https://halostats.svc.halowaypoint.com/hi/players/xuid(%s)/matches?start=%d&count=25", gamerInfo.XUID, start)
			req, err := http.NewRequest("GET", url, nil)
			if err != nil {
				errChan <- fmt.Errorf("Failed to create request: %w", err)
				return
			}

			req.Header.Set("X-343-Authorization-Spartan", gamerInfo.SpartanKey)
			req.Header.Set("Accept", "application/json")

			resp, err := httpClient.Do(req)
			if err != nil {
				errChan <- fmt.Errorf("Failed to make request: %w", err)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				bodyBytes, _ := ioutil.ReadAll(resp.Body)
				errChan <- fmt.Errorf("Received a non-OK status code. Response body: %s", string(bodyBytes))
				return
			}

			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				errChan <- fmt.Errorf("Failed to read response body: %w", err)
				return
			}

			err = json.Unmarshal(body, &data)
			if err != nil {
				errChan <- fmt.Errorf("Failed to parse JSON response: %w", err)
				return
			}

			dataChan <- data
		}(start)
	}

	go func() {
		wg.Wait()
		close(dataChan)
		close(errChan)
	}()

	// Collect the results and errors
	for i := 0; i < numRequests; i++ {
		select {
		case data := <-dataChan:
			allData = append(allData, data)
		case err := <-errChan:
			return nil, err
		}
	}

	return allData, nil
}
