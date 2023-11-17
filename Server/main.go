package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"spartanreport/db"
	spartanreport "spartanreport/handlers"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	mongodb_host := os.Getenv("MONGODB_HOST")
	host := os.Getenv("HOST")
	// Initialize Google Cloud Storage Client
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	client.Bucket("haloseasondata")

	// Initialize MongoDB Client
	db.MongoClient, err = mongo.NewClient(options.Client().ApplyURI(mongodb_host))
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
	err = db.CreateIndex("item_data", bson.D{{"inventoryitempath", 1}})

	if err != nil {
		fmt.Println("Error creating index:", err)
		return
	}

	r := gin.Default()

	// Global CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", host)
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin")
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
	r.POST("/operationdetails", spartanreport.HandleOperationDetails)
	r.POST("/store", spartanreport.HandleStore)
	r.POST("/ranking", spartanreport.SendRanks)
	r.POST("/challengedeck", spartanreport.HandleChallengeDeck)
	r.POST("/match/:id", spartanreport.HandleMatch)
	r.POST("/armorcore", spartanreport.HandleEquipArmor)
	r.GET("/home", spartanreport.HandleEventsHome)
	r.GET("/logout", spartanreport.HandleLogout)
	fmt.Println("Server started at :8080")
	r.Run(":8080")
}
