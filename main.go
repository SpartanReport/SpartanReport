package main

import (
	"context"
	"fmt"
	"halotestapp/db"
	halotestapp "halotestapp/handlers"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/newrelic/go-agent/v3/integrations/nrgin"
	"github.com/newrelic/go-agent/v3/newrelic"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	app, err := newrelic.NewApplication(
		newrelic.ConfigAppName("Halo Tracker"),
		newrelic.ConfigLicense("b21e4fbeac174bef0b2e89db026e09b2FFFFNRAL"),
		newrelic.ConfigAppLogForwardingEnabled(true),
	)
	if err != nil {
		fmt.Println("Error with NR!")
	}

	// Initialize MongoDB Client
	db.MongoClient, err = mongo.NewClient(options.Client().ApplyURI("mongodb://localhost:27017"))

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

	if err != nil {
		fmt.Println("Error creating index:", err)
	}
	r := gin.Default()
	r.Use(nrgin.Middleware(app))
	r.LoadHTMLGlob("client/build/index.html")
	// Static files
	r.StaticFile("/styles.css", "./client/build/styles.css")
	r.Static("/static", "./client/build/static")

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

	r.POST("/match/:id", halotestapp.HandleMatch)

	fmt.Println("Server started at :8080")
	r.Run(":8080")
}
