package halotestapp

import (
	"fmt"
	requests "halotestapp/requests"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleAuthenticated(c *gin.Context) {
	cookie, err := c.Cookie("SpartanToken")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No cookie found"})
		return
	}

	spartanToken := cookie
	gamerInfo, err := requests.RequestUserProfile(spartanToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while getting user profile"})
		fmt.Println("Error While Getting User Profile:", err)
		return
	}

	// Store gamerInfo in Gin context if needed for later handlers
	c.Set("gamerInfoKey", gamerInfo)

	// Render the base template, which should include authenticated.html
	c.HTML(http.StatusOK, "base.html", gin.H{
		"gamerInfo":    gamerInfo,
		"contentBlock": "authenticatedContent",
	})
}
