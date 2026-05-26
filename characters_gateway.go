// Package server — proxy reverso das rotas de personagem para o data-service.
//
// Coloque este arquivo em: game-service/internal/server/characters_gateway.go
//
// Como o gateway só repassa o JSON adiante, ele NÃO precisa conhecer o schema
// do personagem — fica imune a mudanças de campos no data-service. Todo o
// mapeamento camelCase<->snake_case e string<->array é feito no front.
//
// Usa apenas a biblioteca padrão (consistente com o resto do game-service).
package server

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

// NewCharacterProxy cria um proxy reverso que encaminha /characters e
// /characters/{id} para o data-service (FastAPI).
//
//	dataServiceBaseURL: a MESMA URL que o seu dataclient já usa, vinda do
//	config (ex.: "http://data-service:8000" no docker-compose, ou
//	"http://localhost:8000" em dev).
func NewCharacterProxy(dataServiceBaseURL string) (http.Handler, error) {
	target, err := url.Parse(dataServiceBaseURL)
	if err != nil {
		return nil, err
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	// O caminho é mantido 1:1 (o data-service também expõe /characters).
	// Só garantimos que o Host do request aponte para o destino.
	baseDirector := proxy.Director
	proxy.Director = func(r *http.Request) {
		baseDirector(r)
		r.Host = target.Host
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, e error) {
		log.Printf("gateway: falha ao repassar %s %s: %v", r.Method, r.URL.Path, e)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		_, _ = w.Write([]byte(`{"error":"bad gateway: data-service indisponível"}`))
	}

	return proxy, nil
}

// WithCORS habilita CORS para o navegador. Em desenvolvimento, allowOrigin
// pode ser "*"; em produção, use a origem exata do front
// (ex.: "https://guia.seudominio.com").
func WithCORS(allowOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "600")

		// Responde ao preflight sem repassar adiante.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ------------------------------------------------------------------------
// COMO LIGAR no seu internal/server/router.go (ao montar o *http.ServeMux):
//
//	proxy, err := NewCharacterProxy(cfg.DataServiceURL) // use o nome real do
//	if err != nil {                                     // campo no seu config
//		log.Fatalf("proxy de personagens: %v", err)
//	}
//	characters := WithCORS(cfg.AllowOrigin, proxy)
//	mux.Handle("/characters", characters)  // POST (criar) e GET (listar)
//	mux.Handle("/characters/", characters) // GET/PUT/DELETE por id
//
// Adicione ao seu config (internal/config/config.go) e ao docker-compose:
//	DataServiceURL string // ex.: os.Getenv("DATA_SERVICE_URL")
//	AllowOrigin    string // ex.: os.Getenv("CORS_ALLOW_ORIGIN"), default "*"
// ------------------------------------------------------------------------
