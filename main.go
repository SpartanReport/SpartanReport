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
	r.GET("/account", halotestapp.HandleAuthenticated)
	r.POST("/spartan", halotestapp.HandleInventory)
	r.POST("/stats", halotestapp.HandleStats)
	r.POST("/match/:id", halotestapp.HandleMatch)

	fmt.Println("Server started at :8080")
	r.Run(":8080")
}
