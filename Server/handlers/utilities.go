package spartanreport

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	requests "spartanreport/requests"
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

// Define a struct that matches the JSON structure
type Customization struct {
	IsEquipped bool        `json:"IsEquipped"`
	Themes     []CoreTheme `json:"Themes"`
}

type CoreTheme struct {
	IsEquipped           bool     `json:"IsEquipped"`
	IsDefault            bool     `json:"IsDefault"`
	ThemePath            string   `json:"ThemePath"`
	CoatingPath          string   `json:"CoatingPath"`
	GlovePath            string   `json:"GlovePath"`
	HelmetPath           string   `json:"HelmetPath"`
	ChestAttachmentPath  string   `json:"ChestAttachmentPath"`
	KneePadPath          string   `json:"KneePadPath"`
	LeftShoulderPadPath  string   `json:"LeftShoulderPadPath"`
	RightShoulderPadPath string   `json:"RightShoulderPadPath"`
	Emblems              []Emblem `json:"Emblems"`
	ArmorFxPath          string   `json:"ArmorFxPath"`
	MythicFxPath         string   `json:"MythicFxPath"`
	VisorPath            string   `json:"VisorPath"`
	HipAttachmentPath    string   `json:"HipAttachmentPath"`
	WristAttachmentPath  string   `json:"WristAttachmentPath"`
	CoreId               string   `json:"CoreId"`
}

func ChangeCurrentArmor(gamerInfo requests.GamerInfo, customizationData Customization) {
	// First, print out the customizationData in JSON format for verification
	jsonCustomizationData, err := json.MarshalIndent(customizationData, "", "  ")
	if err != nil {
		fmt.Printf("Error marshaling customizationData: %v\n", err)
		return
	}
	fmt.Println("Customization Data being passed to ChangeCurrentArmor:")
	fmt.Println(string(jsonCustomizationData))
	// Marshal the struct into JSON
	jsonBody, err := json.Marshal(customizationData)
	if err != nil {
		panic(err)
	}

	// Construct the request URL and headers
	url := "https://economy.svc.halowaypoint.com/hi/players/xuid(" + gamerInfo.XUID + ")/customization/armors/" + customizationData.Themes[0].CoreId + "?flight=" + gamerInfo.ClearanceCode
	req, err := http.NewRequest("PUT", url, bytes.NewReader(jsonBody))
	if err != nil {
		panic(err)
	}

	// Add headers to the request
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")
	req.Header.Add("343-clearance", gamerInfo.ClearanceCode)
	req.Header.Add("X-343-Authorization-Spartan", gamerInfo.SpartanKey)
	req.Header.Add("Host", "economy.svc.halowaypoint.com")

	// Send the request using an http.Client
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	// Read the response body
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println("Response Status:", resp.Status)
	fmt.Println("Response Body:", string(responseBody))
	fmt.Println("Changed Armor")
}

func GetCurrentArmor(gamerInfo requests.GamerInfo, ArmorCoreData ArmorCoreEquip, GetCore bool) Customization {

	// Construct the request URL and headers
	url := "https://economy.svc.halowaypoint.com/hi/players/xuid(" + gamerInfo.XUID + ")/customization/armors/" + ArmorCoreData.CurrentlyEquipped.Core.CoreId + "?flight=" + gamerInfo.ClearanceCode
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		panic(err)
	}

	// Add headers to the request
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")
	req.Header.Add("343-clearance", gamerInfo.ClearanceCode)
	req.Header.Add("X-343-Authorization-Spartan", gamerInfo.SpartanKey)
	req.Header.Add("Host", "economy.svc.halowaypoint.com")

	// Send the request using an http.Client
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	// Read the response body
	responseBody, err := io.ReadAll(resp.Body)

	// Instead of printing, unmarshal the responseBody into the Customization struct
	var customizationData Customization
	err = json.Unmarshal(responseBody, &customizationData)
	if err != nil {
		panic(err)
	}
	fmt.Println("You received customization struct: ")
	fmt.Println(string(responseBody))

	// If there are multiple themes equipped, then the user has an armor kit equipped
	// Remove the non-armor kit from the array so it's just the armor kit that remains
	if len(customizationData.Themes) != 1 {
		customizationData.Themes[1].CoreId = ArmorCoreData.CurrentlyEquipped.Core.CoreId
		customizationData.Themes[1].IsEquipped = true
		customizationData.IsEquipped = true
		customizationData.Themes = remove(customizationData.Themes, 0)
		return customizationData

	}
	if ArmorCoreData.CurrentlyEquipped.Helmet.CorePath != "" && !GetCore {
		fmt.Println("Helmet Path: ", ArmorCoreData.CurrentlyEquipped.Helmet.CorePath)
		customizationData.Themes[0].HelmetPath = ArmorCoreData.CurrentlyEquipped.Helmet.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.Visor.CorePath != "" && !GetCore {
		fmt.Println("Visor Path: ", ArmorCoreData.CurrentlyEquipped.Visor.CorePath)
		customizationData.Themes[0].VisorPath = ArmorCoreData.CurrentlyEquipped.Visor.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.Gloves.CorePath != "" && !GetCore {
		fmt.Println("Glove Path: ", ArmorCoreData.CurrentlyEquipped.Gloves.CorePath)
		customizationData.Themes[0].GlovePath = ArmorCoreData.CurrentlyEquipped.Gloves.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.Coatings.CorePath != "" && !GetCore {
		fmt.Println("Coating Name: ", ArmorCoreData.CurrentlyEquipped.Coatings.Name)
		fmt.Println("Coating Path: ", ArmorCoreData.CurrentlyEquipped.Coatings.CorePath)
		customizationData.Themes[0].CoatingPath = ArmorCoreData.CurrentlyEquipped.Coatings.CorePath
	}

	customizationData.Themes[0].CoreId = ArmorCoreData.CurrentlyEquipped.Core.CoreId
	customizationData.Themes[0].IsEquipped = true
	customizationData.IsEquipped = true
	return customizationData
}

func remove(slice []CoreTheme, s int) []CoreTheme {
	return append(slice[:s], slice[s+1:]...)
}
