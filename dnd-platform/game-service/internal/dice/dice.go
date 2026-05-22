// Package dice implementa rolagem de dados no servidor — fonte única de
// aleatoriedade, para o jogador não conseguir manipular resultados no cliente.
package dice

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

// Mode representa vantagem/desvantagem em rolagens de d20.
type Mode string

const (
	Normal Mode = "normal"
	Adv    Mode = "adv"
	Dis    Mode = "dis"
)

// Result é o resultado detalhado de uma rolagem.
type Result struct {
	Sides     int    `json:"sides"`
	Modifier  int    `json:"modifier"`
	Mode      Mode   `json:"mode"`
	Rolls     []int  `json:"rolls"`     // dados efetivamente rolados (2 em adv/dis de d20)
	Natural   int    `json:"natural"`   // valor escolhido do dado, antes do modificador
	Total     int    `json:"total"`     // natural + modificador
	Formatted string `json:"formatted"` // ex.: "1d20+5 (vantagem): 18"
}

// rollOne rola um dado de N lados com aleatoriedade criptográfica.
func rollOne(sides int) int {
	if sides < 1 {
		sides = 1
	}
	n, err := rand.Int(rand.Reader, big.NewInt(int64(sides)))
	if err != nil {
		// rand.Reader falhar é praticamente impossível; cai num valor seguro.
		return 1
	}
	return int(n.Int64()) + 1
}

// Roll executa a rolagem. Vantagem/desvantagem só se aplicam a d20.
func Roll(sides, modifier int, mode Mode) Result {
	r := Result{Sides: sides, Modifier: modifier, Mode: mode}

	if sides == 20 && (mode == Adv || mode == Dis) {
		a, b := rollOne(20), rollOne(20)
		r.Rolls = []int{a, b}
		if mode == Adv {
			r.Natural = max(a, b)
		} else {
			r.Natural = min(a, b)
		}
	} else {
		r.Mode = Normal
		v := rollOne(sides)
		r.Rolls = []int{v}
		r.Natural = v
	}

	r.Total = r.Natural + modifier
	r.Formatted = format(r)
	return r
}

func format(r Result) string {
	mod := ""
	if r.Modifier > 0 {
		mod = fmt.Sprintf("+%d", r.Modifier)
	} else if r.Modifier < 0 {
		mod = fmt.Sprintf("%d", r.Modifier)
	}
	adv := ""
	switch r.Mode {
	case Adv:
		adv = " (vantagem)"
	case Dis:
		adv = " (desvantagem)"
	}
	return fmt.Sprintf("1d%d%s%s: %d", r.Sides, mod, adv, r.Total)
}
