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
	// Set CORS headers
	host := os.Getenv("HOST")

	c.Header("Access-Control-Allow-Origin", host)
	c.Header("Access-Control-Allow-Credentials", "true")

	SpartanCookie, err := c.Cookie("SpartanToken")
	XBLToken, err := c.Cookie("XBLToken")

	if err != nil {
		err := godotenv.Load("azure-keys.env")
		if err != nil {
			log.Fatal("Error loading .env file", err)
		}

		clientID := os.Getenv("CLIENT_ID")
		redirectURI := os.Getenv("REDIRECT_URI")

		c.Redirect(http.StatusSeeOther, requests.RequestLink(clientID, redirectURI))
		return
	}

	spartanToken := SpartanCookie
	gamerInfo, err := requests.RequestUserProfile(spartanToken)
	gamerInfo.XBLToken = XBLToken
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while getting user profile"})
		fmt.Println("Error While Getting User Profile:", err)
		return
	}

	// Render the base template, which should include authenticated.html
	c.JSON(http.StatusOK, gin.H{
		"gamerInfo": gamerInfo,
	})
}

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
