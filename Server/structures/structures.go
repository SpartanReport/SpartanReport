package structures

type CustomKit struct {
	ImageIndex int    `bson:"ImageIndex"`
	ImageType  string `bson:"ImageType"`
	Image      string `bson:"Image"`

	IsCrossCore       bool              `bson:"IsCrossCore"`
	Rarity            string            `bson:"Rarity"`
	Type              string            `bson:"Type"`
	IsHighlighted     bool              `bson:"isHighlighted"`
	Name              string            `bson:"name"`
	CurrentlyEquipped CurrentlyEquipped `bson:"currentlyEquipped"`
	Id                string            `bson:"id"`
}
type CurrentlyEquipped struct {
	Helmet            ArmoryRowElements    `bson:"CurrentlyEquippedHelmet" json:"CurrentlyEquippedHelmet"`
	Core              ArmoryRowCore        `bson:"CurrentlyEquippedCore" json:"CurrentlyEquippedCore"`
	Visor             ArmoryRowElements    `bson:"CurrentlyEquippedVisor" json:"CurrentlyEquippedVisor"`
	Gloves            ArmoryRowElements    `bson:"CurrentlyEquippedGlove" json:"CurrentlyEquippedGlove"`
	Coatings          ArmoryRowElements    `bson:"CurrentlyEquippedCoating" json:"CurrentlyEquippedCoating"`
	LeftShoulderPads  ArmoryRowElements    `bson:"CurrentlyEquippedLeftShoulderPad" json:"CurrentlyEquippedLeftShoulderPad"`
	RightShoulderPads ArmoryRowElements    `bson:"CurrentlyEquippedRightShoulderPad" json:"CurrentlyEquippedRightShoulderPad"`
	WristAttachments  ArmoryRowElements    `bson:"CurrentlyEquippedWristAttachment" json:"CurrentlyEquippedWristAttachment"`
	HipAttachments    ArmoryRowElements    `bson:"CurrentlyEquippedHipAttachment" json:"CurrentlyEquippedHipAttachment"`
	KneePads          ArmoryRowElements    `bson:"CurrentlyEquippedKneePad" json:"CurrentlyEquippedKneePad"`
	ChestAttachments  ArmoryRowElements    `bson:"CurrentlyEquippedChestAttachment" json:"CurrentlyEquippedChestAttachment"`
	Kit               ArmoryKitRowElements `bson:"CurrentlyEquippedKit" json:"CurrentlyEquippedKit"`
	MythicFxs         ArmoryRowElements    `bson:"CurrentlyEquippedArmorMythicFx" json:"CurrentlyEquippedArmorMythicFx"`
	ArmorFxs          ArmoryRowElements    `bson:"CurrentlyEquippedArmorFx" json:"CurrentlyEquippedArmorFx"`
	ArmorEmblems      ArmoryRowElements    `bson:"CurrentlyEquippedArmorEmblem" json:"CurrentlyEquippedArmorEmblem"`
}

type ArmoryRowElements struct {
	ID            int    `bson:"id" json:"id"`
	Name          string `bson:"name" json:"name"`
	IsHighlighted bool   `bson:"isHighlighted" json:"isHighlighted"`
	Image         string `bson:"Image,omitempty" json:"Image,omitempty"`
	CoreId        string `bson:"CoreId" json:"CoreId"`
	BelongsToCore string `bson:"BelongsToCore" json:"BelongsToCore"`
	Rarity        string `bson:"Rarity" json:"Rarity"`
	ImagePath     string `bson:"ImagePath,omitempty" json:"ImagePath,omitempty"`
	IsCrossCore   bool   `bson:"IsCrossCore" json:"IsCrossCore"`
	Type          string `bson:"Type" json:"Type"`
	CorePath      string `bson:"CorePath" json:"CorePath"`
}

type ArmoryRowCore struct {
	ID            int    `bson:"id" json:"id"`
	Name          string `bson:"name" json:"name"`
	IsHighlighted bool   `bson:"isHighlighted" json:"isHighlighted"`
	Image         string `bson:"Image,omitempty" json:"Image,omitempty"`
	Description   string `bson:"Description,omitempty" json:"Description,omitempty"`
	CoreId        string `bson:"CoreId" json:"CoreId"`
	Type          string `bson:"Type" json:"Type"`
	GetInv        bool   `bson:"GetInv" json:"GetInv"`
	CoreTitle     string `bson:"CoreTitle" json:"CoreTitle"`
	Rarity        string `bson:"Rarity" json:"Rarity"`
}

type ArmoryKitRowElements struct {
	ID                  int           `bson:"id" json:"id"`
	Name                string        `bson:"name" json:"name"`
	IsHighlighted       bool          `bson:"isHighlighted" json:"isHighlighted"`
	Image               string        `bson:"Image,omitempty" json:"Image,omitempty"`
	CoreId              string        `bson:"CoreId" json:"CoreId"`
	BelongsToCore       string        `bson:"BelongsToCore" json:"BelongsToCore"`
	Rarity              string        `bson:"Rarity" json:"Rarity"`
	ImagePath           string        `bson:"ImagePath,omitempty" json:"ImagePath,omitempty"`
	IsCrossCore         bool          `bson:"IsCrossCore" json:"IsCrossCore"`
	Type                string        `bson:"Type" json:"Type"`
	CorePath            string        `bson:"CorePath" json:"CorePath"`
	KitName             string        `bson:"KitName" json:"KitName"`
	KitEquippablePieces []ItemOptions `bson:"KitEquippablePieces" json:"KitEquippablePieces"`
}
type ItemOptions struct {
	ItemType          string   `bson:"ItemType" json:"ItemType"`
	IsRequired        bool     `bson:"IsRequired" json:"IsRequired"`
	DefaultOptionPath string   `bson:"DefaultOptionPath" json:"DefaultOptionPath"`
	OptionPaths       []string `bson:"OptionPaths" json:"OptionPaths"`
}
