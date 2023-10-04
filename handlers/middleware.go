package halotestapp

import (
	"encoding/json"
	"errors"
	"fmt"
	requests "halotestapp/requests"
	"io/ioutil"
	"net/http"

	"github.com/gin-gonic/gin"
)

const GamerInfoContextKey = "gamerInfoKey"
const HaloDataContextKey = "HaloData"

var httpClient = &http.Client{}

func GamerInfoMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Cookie("SpartanToken")
		if err != nil {
			// Only redirect to /account if the current route is not /account
			if c.Request.URL.Path != "/account" {
				fmt.Println("Error GamerInfoMiddleWare:", err)
				c.Redirect(http.StatusSeeOther, requests.RequestLink())
			}
			return
		}

		gamerInfo, err := requests.RequestUserProfile(cookie)
		if err != nil {
			fmt.Println("Error While Getting User Profile:", err)
			c.Redirect(http.StatusSeeOther, requests.RequestLink())
			c.Abort()
			return
		}

		c.Set(GamerInfoContextKey, gamerInfo)
		c.Next()
	}
}

func HaloDataMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		haloData, err := GetStats(c)
		if err != nil {
			c.String(http.StatusInternalServerError, "Failed to get Halo data: %v", err)
			c.Abort()
			return
		}
		c.Set(HaloDataContextKey, haloData)
		c.Next()
	}
}

func GetStats(c *gin.Context) (HaloData, error) {
	var data HaloData
	gamerInfo, ok := c.Get(GamerInfoContextKey)
	if !ok {
		return data, errors.New("GamerInfo not found in context")
	}

	gInfo, ok := gamerInfo.(requests.GamerInfo)
	if !ok {
		return data, errors.New("Failed to assert type for GamerInfo")
	}

	req, err := http.NewRequest("GET", "https://halostats.svc.halowaypoint.com/hi/players/xuid("+gInfo.XUID+")/matches", nil)
	if err != nil {
		return data, fmt.Errorf("Failed to create request: %w", err)
	}

	req.Header.Set("X-343-Authorization-Spartan", gInfo.SpartanKey)
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
