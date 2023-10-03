package halotestapp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

type OAuthResponse struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	TokenType    string `json:"token_type"`
	UserID       string `json:"user_id"`
}

type UserTokenRequest struct {
	Properties struct {
		AuthMethod string `json:"AuthMethod"`
		SiteName   string `json:"SiteName"`
		RpsTicket  string `json:"RpsTicket"`
	} `json:"Properties"`
	RelyingParty string `json:"RelyingParty"`
	TokenType    string `json:"TokenType"`
}

type UserTokenResponse struct {
	DisplayClaims struct {
		Xui []struct {
			Uhs string `json:"uhs"`
		} `json:"xui"`
	} `json:"DisplayClaims"`
	Token string `json:"Token"`
}

// requestUserToken sends a request to get the user token and returns the response body.
func RequestUserToken(accessToken string) (*UserTokenResponse, error) {
	userTokenResp := &UserTokenResponse{}
	// Prepare the request payload
	reqData := UserTokenRequest{
		Properties: struct {
			AuthMethod string `json:"AuthMethod"`
			SiteName   string `json:"SiteName"`
			RpsTicket  string `json:"RpsTicket"`
		}{
			AuthMethod: "RPS",
			SiteName:   "user.auth.xboxlive.com",
			RpsTicket:  "d=" + accessToken,
		},
		RelyingParty: "http://auth.xboxlive.com",
		TokenType:    "JWT",
	}

	// Marshal the payload to JSON
	jsonData, err := json.Marshal(reqData)
	if err != nil {
		return userTokenResp, fmt.Errorf("Error marshaling JSON: %v", err)
	}

	// Create the HTTP request
	req, err := http.NewRequest("POST", "https://user.auth.xboxlive.com/user/authenticate", bytes.NewBuffer(jsonData))
	if err != nil {
		return userTokenResp, fmt.Errorf("Error creating request: %v", err)
	}

	// Set request headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-xbl-contract-version", "1")

	// Execute the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return userTokenResp, fmt.Errorf("Error executing request: %v", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return userTokenResp, fmt.Errorf("Error reading response body: %v", err)
	}

	// Unmarshal the response body into the UserTokenResponse struct
	err = json.Unmarshal(body, &userTokenResp)
	if err != nil {
		return userTokenResp, fmt.Errorf("Error unmarshaling response: %v", err)
	}

	return userTokenResp, nil
}

func ProcessAuthCode(code string, w http.ResponseWriter, r *http.Request) {
	fmt.Println("Received authorization code:", code)

	// Make the OAuth request
	body := RequestOAuth("4267a656-30e6-4027-a973-edf079a6b52b", "5HM8Q~DtSXdaDnvcBVxaFWvpfr9Wi9y8dtgLLc1p", "http://localhost:8080/callback", code)

	// Parse the OAuth response
	var oauthResp OAuthResponse
	err := json.Unmarshal(body, &oauthResp)
	fmt.Println("oauthresp: ", string(body))

	if err != nil {
		fmt.Println("Error parsing JSON:", err)
		return
	}

	// Request the user token
	userToken, err := RequestUserToken(oauthResp.AccessToken)
	if err != nil {
		fmt.Println("Error with AccessToken:", err)
		return
	}

	// Request the XSTS token
	err, SpartanToken := RequestXstsToken(*userToken)

	if err != nil {
		fmt.Println("Error with XSTS Token:", err)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:  "SpartanToken",
		Value: SpartanToken,
	})
	// Redirect to authenticated page
	http.Redirect(w, r, "/account", http.StatusSeeOther)
}
