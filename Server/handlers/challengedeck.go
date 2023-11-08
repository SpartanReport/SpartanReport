package spartanreport

import (
	"fmt"
	"net/http"
	requests "spartanreport/requests"
	"time"

	"github.com/gin-gonic/gin"
)

type PlayerData struct {
	AssignedDecks        []Deck      `json:"AssignedDecks"`
	ClearanceId          string      `json:"ClearanceId"`
	ActiveRewardTrack    RewardTrack `json:"ActiveRewardTrack"`
	ScheduledRewardTrack RewardTrack `json:"ScheduledRewardTrack"`
}

type Deck struct {
	Id                  string      `json:"Id"`
	Path                string      `json:"Path"`
	ActiveChallenges    []Challenge `json:"ActiveChallenges"`
	UpcomingChallenges  []Challenge `json:"UpcomingChallenges"`
	Expiration          Expiration  `json:"Expiration"`
	CompletedChallenges []Challenge `json:"CompletedChallenges"`
}

type Challenge struct {
	Path            string          `json:"Path"`
	Progress        int             `json:"Progress"`
	Id              string          `json:"Id"`
	CanReroll       bool            `json:"CanReroll"`
	ChallengeDetail ChallengeDetail `json:"ChallengeDetail"`
}

type ChallengeDetail struct {
	Description         Description     `json:"Description"`
	Difficulty          string          `json:"Difficulty"`
	Category            string          `json:"Category"`
	Reward              RewardChallenge `json:"Reward"`
	ThresholdForSuccess int             `json:"ThresholdForSuccess"`
	Title               Title           `json:"Title"`
}

type Description struct {
	Status       string            `json:"status"`
	Value        string            `json:"value"`
	Translations map[string]string `json:"translations"`
}
type RewardChallenge struct {
	InventoryItems      []string `json:"InventoryItems"`
	OperationExperience int      `json:"OperationExperience"`
}

type Expiration struct {
	ISO8601Date time.Time `json:"ISO8601Date"`
}

type RewardTrack struct {
	RewardTrackPath   string `json:"RewardTrackPath"`
	IsOwned           bool   `json:"IsOwned"`
	HasReachedMaxRank bool   `json:"HasReachedMaxRank"`
}

func HandleChallengeDeck(c *gin.Context) {

	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var playerData PlayerData
	url := "https://halostats.svc.halowaypoint.com/hi/players/xuid(" + gamerInfo.XUID + ")/decks"

	err := makeAPIRequest(gamerInfo.SpartanKey, url, nil, &playerData)
	if err != nil {
		fmt.Println("Error API Challenge Deck: ", err)
	}
	baseURL := "https://gamecms-hacs.svc.halowaypoint.com/hi/Progression/file/"
	hdrs := map[string]string{}
	hdrs["343-clearance"] = gamerInfo.ClearanceCode

	for _, deck := range playerData.AssignedDecks {
		for i, chal := range deck.ActiveChallenges {
			var chalDetail ChallengeDetail
			challengeURL := baseURL + chal.Path
			err := makeAPIRequest(gamerInfo.SpartanKey, challengeURL, hdrs, &chalDetail)
			if err != nil {
				fmt.Println("Error fetching Challenge Detail: ", err)
			}
			deck.ActiveChallenges[i].ChallengeDetail = chalDetail
		}
	}

	c.JSON(http.StatusOK, playerData)
}
