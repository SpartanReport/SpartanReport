package main

import (
	"fmt"
	halotestapp "halotestapp/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
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
	authenticated := r.Group("/")
	authenticated.Use(halotestapp.GamerInfoMiddleware())
	{
		authenticated.GET("/account", halotestapp.HandleAuthenticated)
		authenticated.GET("/spartan", halotestapp.HandleInventory)
		authenticated.GET("/stats", halotestapp.HandleStats)
		authenticated.GET("/match/:id", halotestapp.HaloDataMiddleware(), halotestapp.HandleMatch)
	}

	fmt.Println("Server started at :8080")
	r.Run(":8080")
}
