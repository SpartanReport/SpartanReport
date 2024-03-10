package spartanreport

import (
	"fmt"
	"net/http"
	requests "spartanreport/requests"

	"github.com/gin-gonic/gin"
)

type AuthExchange struct {
	Code string `json:"token"`
}

func HandleAuth(c *gin.Context) {
	var authCode AuthExchange
	if err := c.ShouldBindJSON(&authCode); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"could not bind": err.Error()})
		return
	}

	if authCode.Code != "" {
		requests.ProcessAuthCode(authCode.Code, c)
	} else {
		fmt.Println("No code received")
	}
}
