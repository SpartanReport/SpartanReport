package halotestapp

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

type RouteInfo struct {
	Route string `json:"route"`
	Type  string `json:"type"`
}

func FetchData(url string, headers http.Header) (interface{}, error) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header = headers
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Received a non-OK status code %d. Response body: %s\n", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("Received a non-OK status code %d", resp.StatusCode)
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var jsonData interface{}
	err = json.Unmarshal(body, &jsonData)
	if err != nil {
		return nil, err
	}
	return jsonData, nil
}

func ExtractRoutesAndFetch(baseURL string, data interface{}, headers http.Header, routeInfo *[]RouteInfo) {
	switch v := data.(type) {
	case map[string]interface{}:
		for _, val := range v {
			ExtractRoutesAndFetch(baseURL, val, headers, routeInfo)
		}
	case []interface{}:
		for _, val := range v {
			ExtractRoutesAndFetch(baseURL, val, headers, routeInfo)
		}
	case string:
		if strings.HasSuffix(v, ".json") || strings.HasSuffix(v, ".png") {
			// Fetch data for this route and continue exploring.
			newURL := baseURL + v
			newData, err := FetchData(newURL, headers)
			if err != nil {
				fmt.Println("Error fetching data from ", newURL, ":", err)
				return
			}

			switch newData := newData.(type) {
			case string:
				// Check if the data starts with an invalid character
				if strings.HasPrefix(newData, "U") {
					fmt.Println("Invalid data received: ", newData)
					return
				}
			}

			*routeInfo = append(*routeInfo, RouteInfo{Route: newURL, Type: "file"})
			ExtractRoutesAndFetch(baseURL, newData, headers, routeInfo)
		}
	}
}
