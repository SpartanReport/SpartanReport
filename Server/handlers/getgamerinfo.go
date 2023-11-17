package spartanreport

import (
	"encoding/json"
	"net/http"
	requests "spartanreport/requests"
)

// Endpoint to retrieve and delete gamerInfo
func HandleGetGamerInfo(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")

	if gamerInfo, exists := requests.GetGamerInfo(token); exists {
		json.NewEncoder(w).Encode(gamerInfo)
	} else {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
	}
}
