package spartanreport

import requests "spartanreport/requests"

// Struct stored in
type ProgressionDataToStore struct {
	HaloStats HaloData
	GamerInfo requests.GamerInfo
}

// Full Collection of Matches for a Player
type HaloData struct {
	Start       int      `json:"Start"`
	Count       int      `json:"Count"`
	ResultCount int      `json:"ResultCount"`
	Results     []Result `json:"Results"`
}
type TruncatedResultsToStore struct {
	MatchId             string `bson:"MatchId"`
	LastTeamId          int    `bson:"LastTeamId"`
	Outcome             int    `bson:"Outcome"`
	Rank                int    `bson:"Rank"`
	PresentAtEndOfMatch bool   `bson:"PresentAtEndOfMatch"`
}
type ResultsTruncated struct {
	Results []TruncatedResultsToStore
}

// Results of Match
type Result struct {
	MatchId             string `json:"MatchId"`
	Match               Match  `json:"Match"`
	LastTeamId          int    `json:"LastTeamId"`
	Outcome             int    `json:"Outcome"`
	Rank                int    `json:"Rank"`
	PresentAtEndOfMatch bool   `json:"PresentAtEndOfMatch"`
}

// Overarching Match Details
type Match struct {
	MatchId   string    `json:"MatchId" gorm:"primaryKey"`
	MatchInfo MatchInfo `json:"MatchInfo" gorm:"embedded"`
	Teams     []Team    `json:"Teams" gorm:"foreignKey:MatchId"`
	Players   []Player  `json:"Players" gorm:"foreignKey:MatchId"`
}

// Specific Details relating to Match
type MatchInfo struct {
	StartTime           string       `json:"StartTime"`
	EndTime             string       `json:"EndTime"`
	Duration            string       `json:"Duration"`
	LifecycleMode       int          `json:"LifecycleMode"`
	GameVariantCategory int          `json:"GameVariantCategory"`
	LevelId             string       `json:"LevelId"`
	MapVariant          Asset        `json:"MapVariant"`
	UgcGameVariant      Asset        `json:"UgcGameVariant"`
	Playlist            Asset        `json:"Playlist"`
	PlaylistInfo        PlaylistInfo `json:"PlaylistInfo"`
	PlaylistMapModePair Asset        `json:"PlaylistMapModePair"`
	ClearanceId         string       `json:"ClearanceId"`
	PlaylistExperience  int          `json:"PlaylistExperience"`
	SeasonId            string       `json:"SeasonId"`
	PlayableDuration    string       `json:"PlayableDuration"`
	TeamsEnabled        bool         `json:"TeamsEnabled"`
	TeamScoringEnabled  bool         `json:"TeamScoringEnabled"`
	GameplayInteraction int          `json:"GameplayInteraction"`
	FormattedStartTime  string
	FormattedEndTime    string
	PublicName          string `json:"PublicName"`
	MapImagePath        string `json:"MapImagePath"`
}

// Info containing ID's and names of playlist played in match
type PlaylistInfo struct {
	AssetId    string     `json:"AssetId"`
	VersionId  string     `json:"VersionId"`
	PublicName string     `json:"PublicName"`
	Files      FileDetail `json:"Files"`
	AssetStats AssetStats `json:"AssetStats"`
}

// Common Structs
type Asset struct {
	AssetKind int    `json:"AssetKind"`
	AssetId   string `json:"AssetId"`
	VersionId string `json:"VersionId"`
}
type FileDetail struct {
	Prefix string `json:"Prefix"`
}
