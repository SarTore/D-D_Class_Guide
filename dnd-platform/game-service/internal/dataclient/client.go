// Package dataclient conversa com o data-service (Python) por HTTP.
// O game-service nunca toca no banco direto — toda persistência passa por aqui.
package dataclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	baseURL string
	http    *http.Client
}

func New(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 15 * time.Second},
	}
}

// Message é uma mensagem da campanha (espelha o schema do data-service).
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Campaign é o subconjunto que o game-service precisa.
type Campaign struct {
	ID          string         `json:"id"`
	CharacterID string         `json:"character_id"`
	Title       string         `json:"title"`
	Tone        string         `json:"tone"`
	State       map[string]any `json:"state"`
}

// Character idem.
type Character struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Race      string   `json:"race"`
	CharClass string   `json:"char_class"`
	Subclass  string   `json:"subclass"`
	Level     int      `json:"level"`
	Str       int      `json:"str"`
	Dex       int      `json:"dex"`
	Con       int      `json:"con"`
	Int       int      `json:"int"`
	Wis       int      `json:"wis"`
	Cha       int      `json:"cha"`
	AC        int      `json:"ac"`
	MaxHP     int      `json:"max_hp"`
	Skills    []string `json:"skills"`
	Spells    []string `json:"spells"`
	Equipment string   `json:"equipment"`
}

func (c *Client) GetCharacter(ctx context.Context, id string) (*Character, error) {
	var out Character
	if err := c.get(ctx, "/characters/"+id, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) GetCampaign(ctx context.Context, id string) (*Campaign, error) {
	var out Campaign
	if err := c.get(ctx, "/campaigns/"+id, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) ListMessages(ctx context.Context, campaignID string) ([]Message, error) {
	var out []Message
	if err := c.get(ctx, "/campaigns/"+campaignID+"/messages", &out); err != nil {
		return nil, err
	}
	return out, nil
}

func (c *Client) AddMessage(ctx context.Context, campaignID string, m Message) error {
	return c.post(ctx, "/campaigns/"+campaignID+"/messages", m, nil)
}

// ---- helpers ----

func (c *Client) get(ctx context.Context, path string, out any) error {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	return c.do(req, out)
}

func (c *Client) post(ctx context.Context, path string, body, out any) error {
	b, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	return c.do(req, out)
}

func (c *Client) do(req *http.Request, out any) error {
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("data-service %d: %s", resp.StatusCode, string(body))
	}
	if out == nil {
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(out)
}
