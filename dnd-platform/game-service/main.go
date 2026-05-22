// game-service — orquestração de jogo em Go ("o resto").
//
// Responsabilidades:
//   • Gateway que o frontend chama
//   • Rolagem de dados no servidor (anti-manipulação)
//   • Turno do Mestre: monta prompt, chama a Anthropic, persiste no data-service
//   • Futuro: simulador de combate / modo arena
//
// NÃO acessa o banco — toda persistência passa pelo data-service (Python).
package main

import (
	"log"
	"net/http"

	"github.com/seu-usuario/dnd-platform/game-service/internal/config"
	"github.com/seu-usuario/dnd-platform/game-service/internal/dataclient"
	"github.com/seu-usuario/dnd-platform/game-service/internal/dm"
	"github.com/seu-usuario/dnd-platform/game-service/internal/server"
)

func main() {
	cfg := config.Load()

	data := dataclient.New(cfg.DataServiceURL)
	ai := dm.NewAnthropic(cfg.AnthropicAPIKey, cfg.AnthropicModel)
	dmSvc := dm.NewService(data, ai)

	srv := server.New(dmSvc)

	log.Printf("game-service ouvindo em :%s (data-service: %s)", cfg.Port, cfg.DataServiceURL)
	if err := http.ListenAndServe(":"+cfg.Port, srv.Routes()); err != nil {
		log.Fatal(err)
	}
}
