package spartanreport

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	requests "spartanreport/requests"

	"github.com/gin-gonic/gin"
)

const HaloDataContextKey = "HaloData"

var httpClient = &http.Client{}

func GetStats(gamerInfo requests.GamerInfo, c *gin.Context) (HaloData, error) {
	var data HaloData

	req, err := http.NewRequest("GET", "https://halostats.svc.halowaypoint.com/hi/players/xuid("+gamerInfo.XUID+")/matches", nil)
	if err != nil {
		return data, fmt.Errorf("Failed to create request: %w", err)
	}

	req.Header.Set("X-343-Authorization-Spartan", gamerInfo.SpartanKey)
	req.Header.Set("Accept", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return data, fmt.Errorf("Failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		return data, fmt.Errorf("Received a non-OK status code. Response body: %s", string(bodyBytes))
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return data, fmt.Errorf("Failed to read response body: %w", err)
	}

	err = json.Unmarshal(body, &data)
	if err != nil {
		return data, fmt.Errorf("Failed to parse JSON response: %w", err)
	}

	return data, nil
}

func HandleMSIdentity(c *gin.Context) {
	IdentityPayload := map[string]interface{}{
		"associatedApplications": []map[string]string{
			{
				"applicationId": os.Getenv("CLIENT_ID"),
			},
		},
	}

	c.JSON(http.StatusOK, IdentityPayload)
}
