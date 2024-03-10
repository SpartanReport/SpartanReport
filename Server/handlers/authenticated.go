package spartanreport

import (
	"fmt"
	"net/http"
	requests "spartanreport/requests"

	"github.com/gin-gonic/gin"
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
