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
		c.Redirect(http.StatusSeeOther, requests.RequestLink())
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
	fmt.Println("gamerinfo: ", gamerInfo)
	// Render the base template, which should include authenticated.html
	c.JSON(http.StatusOK, gin.H{
		"gamerInfo": gamerInfo,
	})
}

func HandleAuth(c *gin.Context) {
	authURL := requests.RequestLink()
	c.Redirect(http.StatusSeeOther, authURL)

}
