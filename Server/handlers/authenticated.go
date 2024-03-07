package spartanreport

import (
	"fmt"
	"log"
	"net/http"
	"os"
	requests "spartanreport/requests"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func HandleAuthenticated(c *gin.Context) {
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		fmt.Println("Error binding JSON:", err)
		c.JSON(http.StatusOK, gin.H{
			"GamerInfo": nil,
			"IsNew":     false,
		})
		return
	}

	return

}

// Redirects to authentication page
func HandleAuth(c *gin.Context) {
	err := godotenv.Load("azure-keys.env")
	if err != nil {
		log.Fatal("Error loading .env file", err)
	}

	clientID := os.Getenv("CLIENT_ID")
	redirectURI := os.Getenv("REDIRECT_URI")

	authURL := requests.RequestLink(clientID, redirectURI)
	c.Redirect(http.StatusSeeOther, authURL)

}

func HandleLogout(c *gin.Context) {
	var gamerInfo requests.GamerInfo
	if err := c.ShouldBindJSON(&gamerInfo); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": err,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out",
	})
}
