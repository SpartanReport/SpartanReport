package halotestapp

import (
	"fmt"
	requests "halotestapp/requests"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleAuthenticated(c *gin.Context) {
	SpartanCookie, err := c.Cookie("SpartanToken")
	XBLToken, err := c.Cookie("XBLToken")

	if err != nil {
		c.Redirect(http.StatusSeeOther, requests.RequestLink())
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
	authURL := requests.RequestLink()
	c.Redirect(http.StatusSeeOther, authURL)

}
