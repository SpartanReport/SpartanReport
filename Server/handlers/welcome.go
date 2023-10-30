package halotestapp

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleWelcome(c *gin.Context) {
	c.Redirect(http.StatusSeeOther, "/account")
}
