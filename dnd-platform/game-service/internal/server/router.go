// Package server expõe os endpoints do game-service (dados, Mestre, saúde).
package server

import (
	"encoding/json"
	"net/http"

	"github.com/seu-usuario/dnd-platform/game-service/internal/dice"
	"github.com/seu-usuario/dnd-platform/game-service/internal/dm"
)

type Server struct {
	dmSvc *dm.Service
}

func New(dmSvc *dm.Service) *Server {
	return &Server{dmSvc: dmSvc}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.health)
	mux.HandleFunc("POST /dice/roll", s.rollDice)
	mux.HandleFunc("POST /campaigns/{id}/turn", s.dmTurn)
	return withCORS(mux)
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "game-service"})
}

type rollReq struct {
	Sides    int       `json:"sides"`
	Modifier int       `json:"modifier"`
	Mode     dice.Mode `json:"mode"`
}

func (s *Server) rollDice(w http.ResponseWriter, r *http.Request) {
	var req rollReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "corpo inválido")
		return
	}
	if req.Mode == "" {
		req.Mode = dice.Normal
	}
	writeJSON(w, http.StatusOK, dice.Roll(req.Sides, req.Modifier, req.Mode))
}

type turnReq struct {
	Content string `json:"content"`
}

func (s *Server) dmTurn(w http.ResponseWriter, r *http.Request) {
	campaignID := r.PathValue("id")
	var req turnReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Content == "" {
		writeErr(w, http.StatusBadRequest, "conteúdo obrigatório")
		return
	}
	reply, err := s.dmSvc.Turn(r.Context(), campaignID, req.Content)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"reply": reply})
}

// ---- helpers ----

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		h.ServeHTTP(w, r)
	})
}
