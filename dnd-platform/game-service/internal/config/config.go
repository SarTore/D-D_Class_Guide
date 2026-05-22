package config

import "os"

// Config reúne as variáveis de ambiente do serviço.
type Config struct {
	Port            string // porta HTTP do game-service
	DataServiceURL  string // base URL do data-service (Python)
	AnthropicAPIKey string // chave da API da Anthropic (fica só no backend)
	AnthropicModel  string // modelo a usar
}

func Load() Config {
	return Config{
		Port:            getenv("PORT", "8080"),
		DataServiceURL:  getenv("DATA_SERVICE_URL", "http://localhost:8000"),
		AnthropicAPIKey: os.Getenv("ANTHROPIC_API_KEY"),
		AnthropicModel:  getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
	}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
