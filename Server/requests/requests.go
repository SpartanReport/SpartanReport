package spartanreport

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"

	"github.com/go-resty/resty/v2"
)

type Properties struct {
	UserTokens []string `json:"UserTokens"`
	SandboxId  string   `json:"SandboxId"`
}

type XstsRequest struct {
	RelyingParty string     `json:"RelyingParty"`
	TokenType    string     `json:"TokenType"`
	Properties   Properties `json:"Properties"`
}
type XstsTokenResponse struct {
	DisplayClaims struct {
		Xui []struct {
			Uhs string `json:"uhs"`
		} `json:"xui"`
	} `json:"DisplayClaims"`
	IssueInstant string `json:"IssueInstant"`
	NotAfter     string `json:"NotAfter"`
	Token        string `json:"Token"`
}

type SpartanTokenProof struct {
	Token     string `json:"Token"`
	TokenType string `json:"TokenType"`
}

type SpartanTokenRequest struct {
	Audience   string              `json:"Audience"`
	MinVersion string              `json:"MinVersion"`
	Proof      []SpartanTokenProof `json:"Proof"`
}

type SpartanTokenResponse struct {
	ExpiresUtc struct {
		ISO8601Date string `json:"ISO8601Date"`
	} `json:"ExpiresUtc"`
	SpartanToken  string `json:"SpartanToken"`
	TokenDuration string `json:"TokenDuration"`
	XBLToken      string `json:"XBLToken"`
}

type GamerInfo struct {
	SpartanKey string `json:"spartankey" bson:"spartankey"`
	XBLToken   string `json:"xbltoken" bson:"xbltoken"`

	XUID     string `json:"xuid" bson:"xuid"`
	Gamertag string `json:"gamertag" bson:"gamertag"`
	Gamerpic struct {
		Small  string `json:"small" bson:"small"`
		Medium string `json:"medium" bson:"medium"`
		Large  string `json:"large" bson:"large"`
		XLarge string `json:"xlarge" bson:"xlarge"`
	} `json:"gamerpic" bson:"gamerpic"`
	ClearanceCode string   `bson:"clearancecode"`
	Seasons       []string `bson:"seasons"`
}

type Date struct {
	ISO8601Date string `json:"ISO8601Date"`
}

type Season struct {
	CsrSeasonFilePath  string `json:"CsrSeasonFilePath"`
	OperationTrackPath string `json:"OperationTrackPath"`
	SeasonMetadata     string `json:"SeasonMetadata"`
	StartDate          Date   `json:"StartDate"`
	EndDate            Date   `json:"EndDate"`
}

type Seasons struct {
	Seasons []Season `json:"Seasons"`
}

var discoveredRoutes = make(map[string]bool)
var httpClient = &http.Client{}

func RequestLink(clientID string, redirectURI string) string {

	// Base URL for Microsoft OAuth 2.0 Authorization
	baseURL := "https://login.live.com/oauth20_authorize.srf"
	// Query parameters
	params := url.Values{}
	params.Add("client_id", clientID)
	params.Add("response_type", "code")
	params.Add("redirect_uri", redirectURI)
	params.Add("scope", "XboxLive.signin offline_access")
	// Generate the complete URL
	authURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	return authURL
}

func RequestOAuth(clientID string, clientSecret string, redirectURI string, authCode string) []byte {
	oauthTokenURL := "https://login.live.com/oauth20_token.srf"

	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")
	data.Set("code", authCode)
	req, err := http.NewRequest("POST", oauthTokenURL, bytes.NewBufferString(data.Encode()))
	if err != nil {
		fmt.Println("Error creating request:", err)
		return nil
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error executing request:", err)
		return nil
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return body
}

// RequestOAuthWithRefreshToken requests a new access token using a refresh token
func RequestOAuthWithRefreshToken(clientID string, clientSecret string, redirectURI string, refreshToken string) ([]byte, error) {
	oauthTokenURL := "https://login.live.com/oauth20_token.srf"

	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", refreshToken)

	req, err := http.NewRequest("POST", oauthTokenURL, bytes.NewBufferString(data.Encode()))
	if err != nil {
		fmt.Println("Error creating request:", err)

		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error executing request:", err)
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return body, nil
}

func RequestXstsToken(userTokenResp UserTokenResponse) (error, SpartanTokenResponse) {
	var reqData XstsRequest
	reqData.RelyingParty = "https://prod.xsts.halowaypoint.com/"
	reqData.TokenType = "JWT"
	reqData.Properties.UserTokens = []string{userTokenResp.Token}
	reqData.Properties.SandboxId = "RETAIL"
	jsonData, err := json.Marshal(reqData)
	if err != nil {
		return err, SpartanTokenResponse{}
	}
	req, err := http.NewRequest("POST", "https://xsts.auth.xboxlive.com/xsts/authorize", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("Error While Creating Request")
		return err, SpartanTokenResponse{}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-xbl-contract-version", "1")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error While Executing Request")
		return err, SpartanTokenResponse{}
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error While Parsing Response")
		return err, SpartanTokenResponse{}
	}
	var xstsTokenResp XstsTokenResponse
	err = json.Unmarshal(body, &xstsTokenResp)
	if err != nil {
		fmt.Println("Error While Unmarshalling")
		return err, SpartanTokenResponse{}
	}
	spartanTokenResp, err := requestSpartanToken(xstsTokenResp.Token)
	userHash := xstsTokenResp.DisplayClaims.Xui[0].Uhs
	userToken := xstsTokenResp.Token
	v3Token := GetXboxLiveV3Token(userHash, userToken)
	fmt.Println("v3 token: ", v3Token)
	spartanTokenResp.XBLToken = v3Token
	return nil, *spartanTokenResp
}
func GetXboxLiveV3Token(userHash string, userToken string) string {
	return fmt.Sprintf("XBL3.0 x=%s;%s", userHash, userToken)
}

func requestSpartanToken(xstsToken string) (*SpartanTokenResponse, error) {
	var reqData SpartanTokenRequest
	reqData.Audience = "urn:343:s3:services"
	reqData.MinVersion = "4"
	reqData.Proof = []SpartanTokenProof{
		{
			Token:     xstsToken,
			TokenType: "Xbox_XSTSv3",
		},
	}
	jsonData, err := json.Marshal(reqData)
	if err != nil {
		return nil, fmt.Errorf("Error marshaling JSON: %v", err)
	}
	req, err := http.NewRequest("POST", "https://settings.svc.halowaypoint.com/spartan-token", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("Error creating request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "HALO_WAYPOINT_USER_AGENT")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Error executing request: %v", err)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Error reading response body: %v", err)
	}
	var spartanTokenResp SpartanTokenResponse
	err = json.Unmarshal(body, &spartanTokenResp)
	if err != nil {
		return nil, fmt.Errorf("Error unmarshaling JSON: %v", err)
	}
	return &spartanTokenResp, nil
}

func requestUserClearance(spartanKey string, userID string) (string, error) {
	// Create a new HTTP client
	client := &http.Client{}

	editedUserID := "xuid(" + userID + ")"
	url := "https://settings.svc.halowaypoint.com/oban/flight-configurations/titles/hi/audiences/RETAIL/players/" + editedUserID + "/active?sandbox=UNUSED&build=210921.22.01.10.1706-0"

	// Create the request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("Error creating request: %v", err)
	}

	// Add the header
	req.Header.Set("x-343-authorization-spartan", spartanKey)

	// Execute the request
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Error executing request: %v", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("Error reading response body: %v", err)
	}

	var clearanceCode struct {
		FlightConfigurationId string `json:"FlightConfigurationId"`
	}
	err = json.Unmarshal(body, &clearanceCode)
	if err != nil {
		return "", fmt.Errorf("Error unmarshaling JSON: %v", err)
	}

	return clearanceCode.FlightConfigurationId, nil

}

func RequestUserProfile(spartanKey string) (GamerInfo, error) {
	client := resty.New()
	gamerInfo := GamerInfo{}

	resp, err := client.R().
		SetHeader("x-343-authorization-spartan", spartanKey).
		SetResult(&gamerInfo).
		Get("https://profile.svc.halowaypoint.com/users/me")

	if err != nil {
		return gamerInfo, err
	}

	if resp.IsError() {
		return gamerInfo, fmt.Errorf("API request failed with status %v", resp.Status())
	}

	// Handle additional logic, if needed
	clearanceCode, err := requestUserClearance(spartanKey, gamerInfo.XUID)
	if err != nil {
		return gamerInfo, err
	}
	gamerInfo.SpartanKey = spartanKey
	gamerInfo.ClearanceCode = clearanceCode

	return gamerInfo, nil
}
