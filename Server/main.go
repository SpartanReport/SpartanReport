package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"spartanreport/db"
	"time"

	spartanreport "spartanreport/handlers"

	"github.com/gin-gonic/contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8" // Updated import statement
	"github.com/newrelic/go-agent/v3/integrations/nrgin"
	"github.com/newrelic/go-agent/v3/integrations/nrmongo"
	"github.com/newrelic/go-agent/v3/newrelic"
	"go.mongodb.org/mongo-driver/bson"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	REDIS_HOST := os.Getenv("REDIS_HOST")
	mongodb_host := os.Getenv("MONGODB_HOST")
	// Initialize a Redis client
	db.RedisClient = redis.NewClient(&redis.Options{
		Addr: REDIS_HOST, // Redis server address
	})

	// Initialize New Relic for monitoring
	// Create an Application:
	app, err := newrelic.NewApplication(
		// Name your application
		newrelic.ConfigAppName("SpartanReport"),
		// Fill in your New Relic license key
		newrelic.ConfigLicense(os.Getenv("NEW_RELIC_LICENSE_KEY")),
		// Add logging:
		// Optional: add additional changes to your configuration via a config function:
		func(cfg *newrelic.Config) {
			cfg.CustomInsightsEvents.Enabled = false
		},
	)
	if err != nil {
		fmt.Println("unable to create New Relic Application", err)
	}
	app.WaitForConnection(10 * time.Second)
	nrMon := nrmongo.NewCommandMonitor(nil)
	host := os.Getenv("HOST")

	// Initialize MongoDB Client
	db.MongoClient, err = mongo.NewClient(options.Client().ApplyURI(mongodb_host).SetMonitor(nrMon))
	if err != nil {
		fmt.Println("Error creating MongoDB client:", err)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err = db.MongoClient.Connect(ctx)
	if err != nil {
		fmt.Println("Error connecting to MongoDB:", err)
		return
	}
	err = db.StoreData("rank_images", bson.M{"init": true})
	if err != nil {
		log.Fatal(err)
	}
	defer db.MongoClient.Disconnect(ctx)

	err = db.CreateIndex("detailed_matches", bson.D{{"MatchId", 1}})
	if err != nil {
		fmt.Println("Error creating index:", err)
		return
	}
	err = db.CreateIndex("item_data", bson.D{{"inventoryitempath", 1}})

	if err != nil {
		fmt.Println("Error creating index:", err)
		return
	}
	InitialBootSetup()
	r := gin.Default()
	r.Use(nrgin.Middleware(app))
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	// Global CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", host)
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, newrelic, traceparent, tracestate")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})
	// Routes without middleware
	r.GET("/", spartanreport.HandleWelcome)
	// callback is the route that the OAuth server redirects to. Processes Auth Code and redirects
	r.GET("/callback", func(c *gin.Context) {
		spartanreport.HandleCallback(c.Writer, c.Request)
	})

	r.GET("/getGamerInfo", func(c *gin.Context) {
		spartanreport.HandleGetGamerInfo(c.Writer, c.Request)
	})

	// startAuth is the route that redirects to the authentication page
	r.GET("/startAuth", spartanreport.HandleAuth)
	r.POST("/account", spartanreport.HandleAuthenticated)
	r.POST("/spartan", spartanreport.HandleInventory)
	r.POST("/stats", spartanreport.HandleStats)
	r.POST("/progression", spartanreport.HandleProgression)
	r.POST("/operations", spartanreport.HandleOperations)
	r.POST("/operations/:id", spartanreport.HandleOperationDetails)
	r.POST("/store", spartanreport.HandleStore)
	r.POST("/ranking", spartanreport.SendRanks)
	r.POST("/challengedeck", spartanreport.HandleChallengeDeck)
	r.POST("/match/:id", spartanreport.HandleMatch)
	r.POST("/armorcore", spartanreport.HandleEquipArmor)
	r.GET("/home", spartanreport.HandleEventsHome)
	r.GET("/logout", spartanreport.HandleLogout)
	r.POST("/saveCustomKit", spartanreport.HandleSaveCustomKit)
	r.POST("/deleteCustomKit", spartanreport.HandleRemoveCustomKit)
	r.POST("/updateCustomKit", spartanreport.HandleUpdateCustomKit)
	r.POST("/getCustomKit", spartanreport.HandleGetCustomKit)
	r.POST("/getItemImage", spartanreport.HandleGetItemImage)
	r.GET("/.well-known/microsoft-identity-association.json", spartanreport.HandleMSIdentity)

	fmt.Println("Server started at :8080")
	r.Run(":8080")
}

// Inserts data into the specified collection if it is empty
func insertDataIfCollectionEmpty(collectionName string, data []map[string]interface{}) {
	empty, err := db.IsCollectionEmpty(collectionName)
	if err != nil {
		fmt.Println(err)
		return
	}

	if empty {
		fmt.Println("Collection", collectionName, "is empty, inserting data...")
		for _, document := range data {
			err := db.StoreData(collectionName, document)
			if err != nil {
				fmt.Println("Error storing data in", collectionName, ":", err)
			}
		}
	} else {
		fmt.Println("Collection", collectionName, "is not empty, no action taken.")
	}
}

// General function to read and unmarshal JSON file data
func readJSONData(filePath string) ([]map[string]interface{}, error) {
	jsonFile, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer jsonFile.Close()

	byteValue, err := io.ReadAll(jsonFile)
	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	err = json.Unmarshal(byteValue, &data)
	if err != nil {
		return nil, err
	}

	// Convert $oid fields to plain string _id values
	for _, document := range data {
		if idField, ok := document["_id"].(map[string]interface{}); ok {
			if oid, ok := idField["$oid"].(string); ok {
				document["_id"] = oid
			}
		}
	}

	return data, nil
}

// Loads in required initial armor cores and default emblem tags
// A lot of the emblem data is missing from the Halo API, so we need to provide it ourselves if a users emblem cannot be retrieved
func InitialBootSetup() {
	if err := spartanreport.LoadAndInsertData("armorcoredata.json", "item_data"); err != nil {
		fmt.Println(err)
	}
	if err := spartanreport.LoadAndInsertData("default_emblem_colors.json", "default_emblem_colors"); err != nil {
		fmt.Println(err)
	}
	if err := spartanreport.LoadAndInsertData("default_emblem_info.json", "default_emblem_info"); err != nil {
		fmt.Println(err)
	}
}
