package main

import (
	"context"
	"fmt"
	"halotestapp/db"
	halotestapp "halotestapp/handlers"
	"log"
	"os"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/api/option"
)

func main() {
	// Initialize Google Cloud Storage Client
	ctx := context.Background()

	client, err := storage.NewClient(ctx, option.WithCredentialsFile("./google-key.json"))
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	client.Bucket("haloseasondata")
	err = godotenv.Load("./initialsetup.env")
	if err != nil {
		log.Fatal("Error loading .env file", err)
	}

	mongodb_host := os.Getenv("MONGODB_HOST")

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
	if err != nil {
		fmt.Println("Error creating index:", err)
		return
	}

	r := gin.Default()

	// Global CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	r.LoadHTMLGlob("../client/build/index.html")
	// Static files
	r.StaticFile("/styles.css", "../client/build/src/Styles/styles.css")
	r.Static("/static", "../client/build/src/Styles")

	// Routes without middleware
	r.GET("/", halotestapp.HandleWelcome)

	// Wrap the standard http HandlerFunc to gin.HandlerFunc
	r.GET("/callback", func(c *gin.Context) {
		halotestapp.HandleCallback(c.Writer, c.Request)
	})
	r.GET("/startAuth", halotestapp.HandleAuth)

	// Grouping routes that require gamer info
	r.GET("/account", halotestapp.HandleAuthenticated)
	r.POST("/spartan", halotestapp.HandleInventory)
	r.POST("/stats", halotestapp.HandleStats)
	r.POST("/progression", halotestapp.HandleProgression)
	r.POST("/operations", halotestapp.HandleOperations)
	r.POST("/operationdetails", halotestapp.HandleOperationDetails)
	r.POST("/store", halotestapp.HandleStore)

	r.POST("/match/:id", halotestapp.HandleMatch)

	fmt.Println("Server started at :8080")
	r.Run(":8080")
}
