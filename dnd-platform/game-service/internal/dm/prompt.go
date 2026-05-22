package dm

import (
	"fmt"
	"strings"

	"github.com/seu-usuario/dnd-platform/game-service/internal/dataclient"
)

// basePrompt traz as regras de conduta do Mestre. Mantido curto aqui; a versão
// completa pode ser carregada de arquivo/embed em produção.
const basePrompt = `Você é o Mestre (DM) de uma campanha solo de D&D 5e, em tom de fantasia heroica clássica.
- Use as regras 5e fielmente (CDs 10/15/20/25, vantagem/desvantagem, condições, descansos).
- O JOGADOR rola: ataques dele, dano dele, salvaguardas dele, testes dele. VOCÊ rola o resto.
- As rolagens do jogador chegam como mensagens "🎲 Rolagem — 1d20+5: 17"; trate como oficiais.
- Descreva cenas com prosa sensorial e concisa, pergunte "O que você faz?", narre consequências reais.
- Nunca mate o personagem sem testes de morte e chance de resgate. Sem deus ex machina.
- NPCs com voz própria; o mundo reage. Nunca revele o que o personagem não saberia.`

// BuildSystem monta o system prompt injetando ficha e estado atuais.
func BuildSystem(ch *dataclient.Character, camp *dataclient.Campaign) string {
	var b strings.Builder
	b.WriteString(basePrompt)
	b.WriteString("\n\n## PERSONAGEM\n")
	fmt.Fprintf(&b, "Nome: %s\n", ch.Name)
	sub := ""
	if ch.Subclass != "" {
		sub = " / " + ch.Subclass
	}
	fmt.Fprintf(&b, "%s %s%s nível %d\n", ch.Race, ch.CharClass, sub, ch.Level)
	fmt.Fprintf(&b, "Atributos: FOR %d DES %d CON %d INT %d SAB %d CAR %d\n",
		ch.Str, ch.Dex, ch.Con, ch.Int, ch.Wis, ch.Cha)
	fmt.Fprintf(&b, "CA: %d  HP máx: %d\n", ch.AC, ch.MaxHP)
	if len(ch.Skills) > 0 {
		fmt.Fprintf(&b, "Perícias: %s\n", strings.Join(ch.Skills, ", "))
	}
	if len(ch.Spells) > 0 {
		fmt.Fprintf(&b, "Magias: %s\n", strings.Join(ch.Spells, ", "))
	}

	b.WriteString("\n## ESTADO DA CAMPANHA\n")
	for _, k := range []string{"hp", "gold", "location", "conditions", "inventory", "quests", "xp"} {
		if v, ok := camp.State[k]; ok {
			fmt.Fprintf(&b, "%s: %v\n", k, v)
		}
	}
	return b.String()
}
