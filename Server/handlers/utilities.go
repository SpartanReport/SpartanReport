package spartanreport

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"spartanreport/db"
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
	ArmorEmblemPath      string   `json:"ArmorEmblemPath"`
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
		customizationData.Themes[0].HelmetPath = ArmorCoreData.CurrentlyEquipped.Helmet.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.Visor.CorePath != "" && !GetCore {
		customizationData.Themes[0].VisorPath = ArmorCoreData.CurrentlyEquipped.Visor.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.Gloves.CorePath != "" && !GetCore {
		customizationData.Themes[0].GlovePath = ArmorCoreData.CurrentlyEquipped.Gloves.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.Coatings.CorePath != "" && !GetCore {
		customizationData.Themes[0].CoatingPath = ArmorCoreData.CurrentlyEquipped.Coatings.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.LeftShoulderPads.CorePath != "" && !GetCore {
		customizationData.Themes[0].LeftShoulderPadPath = ArmorCoreData.CurrentlyEquipped.LeftShoulderPads.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.RightShoulderPads.CorePath != "" && !GetCore {
		customizationData.Themes[0].RightShoulderPadPath = ArmorCoreData.CurrentlyEquipped.RightShoulderPads.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.ChestAttachments.CorePath != "" && !GetCore {
		customizationData.Themes[0].ChestAttachmentPath = ArmorCoreData.CurrentlyEquipped.ChestAttachments.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.KneePads.CorePath != "" && !GetCore {
		customizationData.Themes[0].KneePadPath = ArmorCoreData.CurrentlyEquipped.KneePads.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.WristAttachments.CorePath != "" && !GetCore {
		customizationData.Themes[0].WristAttachmentPath = ArmorCoreData.CurrentlyEquipped.WristAttachments.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.HipAttachments.CorePath != "" && !GetCore {
		customizationData.Themes[0].HipAttachmentPath = ArmorCoreData.CurrentlyEquipped.HipAttachments.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.ArmorFxs.CorePath != "" && !GetCore {
		customizationData.Themes[0].ArmorFxPath = ArmorCoreData.CurrentlyEquipped.ArmorFxs.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.MythicFxs.CorePath != "" && !GetCore {
		customizationData.Themes[0].MythicFxPath = ArmorCoreData.CurrentlyEquipped.MythicFxs.CorePath
	}
	if ArmorCoreData.CurrentlyEquipped.ArmorEmblems.CorePath != "" && !GetCore {
		// if length of Emblems[] is 0, then append the emblem to the array
		if len(customizationData.Themes[0].Emblems) == 0 {
			customizationData.Themes[0].Emblems = append(customizationData.Themes[0].Emblems, Emblem{EmblemPath: ArmorCoreData.CurrentlyEquipped.ArmorEmblems.CorePath})
		}
		// if length of Emblems[] is 1, then replace the emblem in the array
		if len(customizationData.Themes[0].Emblems) == 1 {
			customizationData.Themes[0].Emblems[0].EmblemPath = ArmorCoreData.CurrentlyEquipped.ArmorEmblems.CorePath
		}
	}

	customizationData.Themes[0].CoreId = ArmorCoreData.CurrentlyEquipped.Core.CoreId
	customizationData.Themes[0].IsEquipped = true
	customizationData.IsEquipped = true
	return customizationData
}

func remove(slice []CoreTheme, s int) []CoreTheme {
	return append(slice[:s], slice[s+1:]...)
}

// LoadAndInsertData loads data from a JSON file and inserts it into the specified MongoDB collection.
func LoadAndInsertData(jsonFilename, collectionName string) error {
	jsonFile, err := os.Open(jsonFilename)
	if err != nil {
		return fmt.Errorf("error opening JSON file: %w", err)
	}
	defer jsonFile.Close()

	byteValue, err := io.ReadAll(jsonFile)
	if err != nil {
		return fmt.Errorf("error reading JSON file: %w", err)
	}

	var data []map[string]interface{}
	if err := json.Unmarshal(byteValue, &data); err != nil {
		return fmt.Errorf("error unmarshalling JSON: %w", err)
	}

	for _, document := range data {
		convertDocumentID(document)
		encodeImageToBinary(document, "emblemimagedata")
		encodeImageToBinary(document, "nameplateimagedata")

		// You can do similar encoding for other fields if necessary.
	}

	empty, err := db.IsCollectionEmpty(collectionName)
	if err != nil {
		return fmt.Errorf("error checking if collection is empty: %w", err)
	}

	if empty {
		for _, document := range data {
			if err := db.StoreData(collectionName, document); err != nil {
				return fmt.Errorf("error storing data: %w", err)
			}
		}
	} else {
		fmt.Println("Collection is not empty, no action taken.")
	}

	return nil
}

func convertDocumentID(document map[string]interface{}) {
	if idField, ok := document["_id"].(map[string]interface{}); ok {
		if oid, ok := idField["$oid"].(string); ok {
			document["_id"] = oid
		}
	}
}

// encodeImageToBinary replaces the base64 encoded string with its binary equivalent.
func encodeImageToBinary(document map[string]interface{}, key string) {
	if imageData, ok := document[key].(map[string]interface{}); ok {
		if b64, ok := imageData["$binary"].(map[string]interface{}); ok {
			if b64data, ok := b64["base64"].(string); ok {
				data, err := base64.StdEncoding.DecodeString(b64data)
				if err == nil {
					document[key] = data
				}
			}
		}
	}
}
