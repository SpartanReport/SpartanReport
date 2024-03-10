package spartanreport

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
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

type RefreshTokenInfo struct {
	RefreshToken    string    `json:"refresh_token"`
	ExpirationData  time.Time `json:"expiration_data"`
	OAuthExpiration time.Time `json:"oauth_expiration"`
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

// tempGamerInfoMap for temporary storage
var tempGamerInfoMap = make(map[string]GamerInfo)

// SetGamerInfo adds gamerInfo to the map
func SetGamerInfo(token string, gamerInfo GamerInfo) {
	tempGamerInfoMap[token] = gamerInfo
}

// GetGamerInfo retrieves and deletes gamerInfo from the map
func GetGamerInfo(token string) (GamerInfo, bool) {
	gamerInfo, exists := tempGamerInfoMap[token]
	if exists {
		delete(tempGamerInfoMap, token) // Delete after retrieval
	}
	return gamerInfo, exists
}

func ProcessAuthCode(code string, c *gin.Context) {
	userToken, err := RequestUserToken(code)
	if err != nil {
		fmt.Println("Error with AccessToken:", err)
		return
	}

	// Request the XSTS token
	err, SpartanResp := RequestXstsToken(*userToken)

	if err != nil {
		fmt.Println("Error with XSTS Token:", err)
		return
	}

	gamerInfo, err := RequestUserProfile(SpartanResp.SpartanToken)
	if err != nil {
		fmt.Println("Error when getting user profile: ", err)

	}
	// Send the SpartanToken to the client
	c.JSON(http.StatusOK, gamerInfo)
}
