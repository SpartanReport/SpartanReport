package spartanreport

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

func makeAPIRequest(spartanToken, url string, hdrs map[string]string, responseStruct interface{}) error {
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("Failed to create request: %v", err)
	}
	req.Header.Set("X-343-Authorization-Spartan", spartanToken)
	req.Header.Set("Accept", "application/json")

	for key, value := range hdrs {
		req.Header.Set(key, value)
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("Received a non-OK status code %d. Response body: %s url: %s, headers: %s", resp.StatusCode, string(bodyBytes), url, hdrs)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("Failed to read response body: %v", err)
	}

	if err := json.Unmarshal(body, responseStruct); err != nil {
		return fmt.Errorf("Failed to parse JSON response: %v", err)
	}

	return nil
}

func makeAPIRequestImage(spartanToken, url string, hdrs map[string]string) (string, error) {

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("x-343-authorization-spartan", spartanToken)

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	base64ImageData := base64.StdEncoding.EncodeToString(data)
	return base64ImageData, nil
}
