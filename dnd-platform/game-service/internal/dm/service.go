package dm

import (
	"context"

	"github.com/seu-usuario/dnd-platform/game-service/internal/dataclient"
)

// Service orquestra um turno do Mestre:
//  1. busca ficha e campanha no data-service
//  2. monta o system prompt com o estado atual
//  3. persiste a mensagem do jogador
//  4. chama a Anthropic com o histórico
//  5. persiste e devolve a resposta do Mestre
type Service struct {
	data *dataclient.Client
	ai   *AnthropicClient
}

func NewService(data *dataclient.Client, ai *AnthropicClient) *Service {
	return &Service{data: data, ai: ai}
}

// Turn processa a mensagem do jogador e devolve a fala do Mestre.
func (s *Service) Turn(ctx context.Context, campaignID, userText string) (string, error) {
	camp, err := s.data.GetCampaign(ctx, campaignID)
	if err != nil {
		return "", err
	}
	ch, err := s.data.GetCharacter(ctx, camp.CharacterID)
	if err != nil {
		return "", err
	}

	// Persiste a mensagem do jogador antes de chamar a IA.
	if err := s.data.AddMessage(ctx, campaignID, dataclient.Message{Role: "user", Content: userText}); err != nil {
		return "", err
	}

	history, err := s.data.ListMessages(ctx, campaignID)
	if err != nil {
		return "", err
	}
	msgs := make([]apiMessage, 0, len(history))
	for _, m := range history {
		msgs = append(msgs, apiMessage{Role: m.Role, Content: m.Content})
	}

	system := BuildSystem(ch, camp)
	reply, err := s.ai.Complete(ctx, system, msgs)
	if err != nil {
		return "", err
	}

	if err := s.data.AddMessage(ctx, campaignID, dataclient.Message{Role: "assistant", Content: reply}); err != nil {
		return "", err
	}
	return reply, nil
}
