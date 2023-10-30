package spartanreport

import (
	"fmt"
	"net/http"
	requests "spartanreport/requests"
)

// handleCallback handles the OAuth callback and processes the authorization code
func HandleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	fmt.Println("code: ", code)
	if code != "" {
		requests.ProcessAuthCode(code, w, r)
	} else {
		fmt.Println("No code received")
	}
}
