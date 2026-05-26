import React, { useState, useEffect } from 'react';
import { Swords, Shield, Sparkles, RotateCcw, Plus, Minus, X, Edit3, FileText, Heart } from 'lucide-react';

// =====================================================================
// GUIA DE CRIAÇÃO DE PERSONAGEM — D&D 5e
// Versão sem o Mestre por IA: mantém apenas a criação de personagem,
// o construtor de trilha de classe (progressão) e o glossário.
// =====================================================================

const mod = (score) => {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
};

const profBonus = (level) => Math.ceil(level / 4) + 1;

const modNum = (score) => Math.floor((score - 10) / 2);

// =====================================================================
// DADOS DE D&D 5e (SRD simplificado)
// =====================================================================

// Compra de pontos
const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUY_BUDGET = 27;
const STANDARD_ARRAY = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };

// Bônus raciais (aproximação do PHB)
const RACE_DATA = {
  'Humano':     { asi: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 } },
  'Elfo':       { asi: { dex: 2 } },
  'Meio-elfo':  { asi: { cha: 2, dex: 1, con: 1 } },
  'Anão':       { asi: { con: 2 } },
  'Halfling':   { asi: { dex: 2 } },
  'Meio-orc':   { asi: { str: 2, con: 1 } },
  'Tiefling':   { asi: { cha: 2, int: 1 } },
  'Draconato':  { asi: { str: 2, cha: 1 } },
  'Gnomo':      { asi: { int: 2 } },
};

// Perícias e seus atributos
const SKILL_ABILITY = {
  'Acrobacia': 'dex', 'Adestrar Animais': 'wis', 'Arcanismo': 'int', 'Atletismo': 'str',
  'Atuação': 'cha', 'Enganação': 'cha', 'Furtividade': 'dex', 'História': 'int',
  'Intimidação': 'cha', 'Intuição': 'wis', 'Investigação': 'int', 'Medicina': 'wis',
  'Natureza': 'int', 'Percepção': 'wis', 'Persuasão': 'cha', 'Prestidigitação': 'dex',
  'Religião': 'int', 'Sobrevivência': 'wis',
};
const ALL_SKILLS = Object.keys(SKILL_ABILITY);

// Dados por classe
const CLASS_DATA = {
  'Bárbaro':     { hitDie: 12, saves: ['str','con'], skillChoices: 2, skills: ['Adestrar Animais','Atletismo','Intimidação','Natureza','Percepção','Sobrevivência'], ac: 14, caster: null,
    equipment: 'Machado grande (ou arma marcial à escolha) • duas machadinhas (ou arma simples) • pacote de explorador • 4 azagaias' },
  'Bardo':       { hitDie: 8, saves: ['dex','cha'], skillChoices: 3, skills: 'ANY', ac: 13, caster: 'cha', cantripsKnown: 2, spellsKnown: 4,
    equipment: 'Rapieira (ou arma simples) • pacote de artista (ou diplomata) • armadura de couro • adaga • instrumento musical' },
  'Bruxo':       { hitDie: 8, saves: ['wis','cha'], skillChoices: 2, skills: ['Arcanismo','Enganação','História','Intimidação','Investigação','Natureza','Religião'], ac: 11, caster: 'cha', cantripsKnown: 2, spellsKnown: 2,
    equipment: 'Besta leve e 20 virotes (ou arma simples) • foco arcano (ou bolsa de componentes) • pacote de erudito • armadura de couro • 2 adagas' },
  'Clérigo':     { hitDie: 8, saves: ['wis','cha'], skillChoices: 2, skills: ['História','Intuição','Medicina','Persuasão','Religião'], ac: 16, caster: 'wis', cantripsKnown: 3, prepares: true,
    equipment: 'Maça (ou martelo de guerra) • cota de escamas (ou couro) • besta leve e 20 virotes • pacote de sacerdote • escudo • símbolo sagrado' },
  'Druida':      { hitDie: 8, saves: ['int','wis'], skillChoices: 2, skills: ['Adestrar Animais','Arcanismo','Intuição','Medicina','Natureza','Percepção','Religião','Sobrevivência'], ac: 13, caster: 'wis', cantripsKnown: 2, prepares: true,
    equipment: 'Escudo de madeira (ou arma simples) • cimitarra (ou arma simples corpo-a-corpo) • armadura de couro • pacote de explorador • foco druídico' },
  'Feiticeiro':  { hitDie: 6, saves: ['con','cha'], skillChoices: 2, skills: ['Arcanismo','Enganação','Intuição','Intimidação','Persuasão','Religião'], ac: 11, caster: 'cha', cantripsKnown: 4, spellsKnown: 2,
    equipment: 'Besta leve e 20 virotes (ou arma simples) • foco arcano (ou bolsa de componentes) • pacote de explorador • 2 adagas' },
  'Guerreiro':   { hitDie: 10, saves: ['str','con'], skillChoices: 2, skills: ['Acrobacia','Adestrar Animais','Atletismo','História','Intuição','Intimidação','Percepção','Sobrevivência'], ac: 16, caster: null,
    equipment: 'Cota de malha (ou couro batido + arco longo) • arma marcial e escudo (ou duas marciais) • besta leve e 20 virotes (ou 2 machadinhas) • pacote de masmorra' },
  'Ladino':      { hitDie: 8, saves: ['dex','int'], skillChoices: 4, skills: ['Acrobacia','Atletismo','Atuação','Enganação','Furtividade','Intimidação','Intuição','Investigação','Percepção','Persuasão','Prestidigitação'], ac: 13, caster: null,
    equipment: 'Rapieira (ou espada curta) • arco curto e 20 flechas (ou espada curta) • pacote de assaltante • armadura de couro • 2 adagas • ferramentas de ladrão' },
  'Mago':        { hitDie: 6, saves: ['int','wis'], skillChoices: 2, skills: ['Arcanismo','História','Intuição','Investigação','Medicina','Religião'], ac: 11, caster: 'int', cantripsKnown: 3, spellbook: 6, prepares: true,
    equipment: 'Bordão (ou adaga) • foco arcano (ou bolsa de componentes) • pacote de erudito • grimório' },
  'Monge':       { hitDie: 8, saves: ['str','dex'], skillChoices: 2, skills: ['Acrobacia','Atletismo','Furtividade','História','Intuição','Religião'], ac: 13, caster: null,
    equipment: 'Espada curta (ou arma simples) • pacote de explorador • 10 dardos' },
  'Paladino':    { hitDie: 10, saves: ['wis','cha'], skillChoices: 2, skills: ['Atletismo','Intimidação','Intuição','Medicina','Persuasão','Religião'], ac: 18, caster: 'cha', casterFrom: 2, half: true, prepares: true, casterNote: 'Conjuração a partir do nível 2 (atributo: Carisma).',
    equipment: 'Arma marcial e escudo (ou duas marciais) • 5 azagaias (ou arma simples) • pacote de sacerdote • cota de malha • símbolo sagrado' },
  'Patrulheiro': { hitDie: 10, saves: ['str','dex'], skillChoices: 3, skills: ['Adestrar Animais','Atletismo','Furtividade','Intuição','Investigação','Natureza','Percepção','Sobrevivência'], ac: 14, caster: 'wis', casterFrom: 2, half: true, prepares: true, casterNote: 'Conjuração a partir do nível 2 (atributo: Sabedoria).',
    equipment: 'Cota de escamas (ou couro) • 2 espadas curtas (ou 2 simples) • pacote de masmorra • arco longo e aljava com 20 flechas' },
};

// Magias por classe e por nível de magia — seleção curada do SRD (truques + níveis 1–3)
const SPELL_DATA = {
  'Bardo': {
    cantrips: ['Zombaria Viciosa','Prestidigitação','Ilusão Menor','Mãos Mágicas','Luzes Dançantes','Mensagem'],
    1: ['Enfeitiçar Pessoa','Curar Ferimentos','Palavra Curativa','Fogo das Fadas','Sono','Onda Trovejante','Heroísmo','Detectar Magia'],
    2: ['Invisibilidade','Suspensão de Pessoa','Sugestão','Silêncio','Acalmar Emoções','Restauração Menor','Detectar Pensamentos','Estilhaçar'],
    3: ['Dissipar Magia','Medo','Clarividência','Padrão Hipnótico','Imagem Maior','Línguas','Praga','Enviar Mensagem'],
  },
  'Bruxo': {
    cantrips: ['Rajada Mística','Toque Gélido','Mãos Mágicas','Ilusão Menor','Spray de Veneno','Prestidigitação'],
    1: ['Feitiço (Hex)','Armadura de Agathys','Enfeitiçar Pessoa','Comando','Repreensão Infernal','Retirada Expedita','Raio Bruxo'],
    2: ['Escuridão','Suspensão de Pessoa','Invisibilidade','Imagens Espelhadas','Passo Enevoado','Sugestão','Estilhaçar','Raio do Enfraquecimento'],
    3: ['Contramágica','Dissipar Magia','Medo','Voo','Padrão Hipnótico','Toque Vampírico','Forma Gasosa','Círculo Mágico'],
  },
  'Clérigo': {
    cantrips: ['Chama Sagrada','Orientação','Taumaturgia','Luz','Resistência','Reparar'],
    1: ['Curar Ferimentos','Palavra Curativa','Bênção','Comando','Escudo da Fé','Santuário','Infligir Ferimentos','Detectar Magia'],
    2: ['Auxílio','Arma Espiritual','Restauração Menor','Suspensão de Pessoa','Silêncio','Oração de Cura','Aprimorar Atributo','Zona da Verdade'],
    3: ['Revivificar','Dissipar Magia','Guardiões Espirituais','Palavra Curativa em Massa','Farol da Esperança','Luz do Dia','Remover Maldição','Animar Mortos'],
  },
  'Druida': {
    cantrips: ['Druidismo','Chicote de Espinhos','Produzir Chama','Orientação','Reparar','Spray de Veneno'],
    1: ['Curar Ferimentos','Enredar','Fogo das Fadas','Frutos Benéficos','Palavra Curativa','Falar com Animais','Onda Trovejante','Névoa'],
    2: ['Pele de Carvalho','Esfera Flamejante','Raio de Luar','Aquecer Metal','Restauração Menor','Suspensão de Pessoa','Passar sem Deixar Rastro','Visão no Escuro'],
    3: ['Conjurar Animais','Convocar Relâmpago','Dissipar Magia','Crescimento Vegetal','Luz do Dia','Respirar na Água','Muralha de Vento','Proteção contra Energia'],
  },
  'Feiticeiro': {
    cantrips: ['Raio de Fogo','Toque Gélido','Luz','Prestidigitação','Mãos Mágicas','Raio de Gelo'],
    1: ['Mãos Flamejantes','Mísseis Mágicos','Escudo','Enfeitiçar Pessoa','Sono','Onda Trovejante','Detectar Magia'],
    2: ['Passo Enevoado','Raio Ardente','Invisibilidade','Imagens Espelhadas','Suspensão de Pessoa','Escuridão','Borrão','Estilhaçar'],
    3: ['Bola de Fogo','Relâmpago','Contramágica','Dissipar Magia','Pressa','Lentidão','Voo','Padrão Hipnótico'],
  },
  'Mago': {
    cantrips: ['Raio de Fogo','Toque Gélido','Mãos Mágicas','Ilusão Menor','Luz','Raio de Gelo'],
    1: ['Mísseis Mágicos','Escudo','Mãos Flamejantes','Sono','Detectar Magia','Armadura Arcana','Onda Trovejante','Queda Suave'],
    2: ['Passo Enevoado','Raio Ardente','Imagens Espelhadas','Invisibilidade','Teia','Suspensão de Pessoa','Esfera Flamejante','Borrão'],
    3: ['Bola de Fogo','Relâmpago','Contramágica','Dissipar Magia','Voo','Pressa','Padrão Hipnótico','Piscar'],
  },
  'Paladino': {
    cantrips: [],
    1: ['Bênção','Comando','Curar Ferimentos','Detectar Magia','Favor Divino','Heroísmo','Escudo da Fé','Golpe Trovejante'],
    2: ['Auxílio','Restauração Menor','Encontrar Corcel','Arma Mágica','Golpe Marcante','Zona da Verdade','Proteção contra Veneno','Localizar Objeto'],
  },
  'Patrulheiro': {
    cantrips: [],
    1: ['Curar Ferimentos','Detectar Magia','Marca do Caçador','Névoa','Frutos Benéficos','Falar com Animais','Passos Longos','Amizade Animal'],
    2: ['Pele de Carvalho','Restauração Menor','Passar sem Deixar Rastro','Visão no Escuro','Silêncio','Crescimento de Espinhos','Localizar Objeto','Proteção contra Veneno'],
  },
};

// Maior nível de magia acessível ao personagem (com base nos espaços de magia)
function maxSpellLevel(charClass, level) {
  const slots = calcSpellSlots(charClass, level);
  let max = 0;
  slots.forEach((s, i) => { if (s.max > 0) max = i + 1; });
  return max;
}

// Cores por escola de magia
const SCHOOL_COLOR = {
  'Abjuração':    'text-sky-300 border-sky-700/50 bg-sky-950/40',
  'Adivinhação':  'text-cyan-300 border-cyan-700/50 bg-cyan-950/40',
  'Conjuração':   'text-orange-300 border-orange-700/50 bg-orange-950/40',
  'Encantamento': 'text-pink-300 border-pink-700/50 bg-pink-950/40',
  'Evocação':     'text-red-300 border-red-700/50 bg-red-950/40',
  'Ilusão':       'text-fuchsia-300 border-fuchsia-700/50 bg-fuchsia-950/40',
  'Necromancia':  'text-emerald-300 border-emerald-700/50 bg-emerald-950/40',
  'Transmutação': 'text-teal-300 border-teal-700/50 bg-teal-950/40',
};

// Escola + descrição curta de cada magia (para etiquetas e tooltips)
const SPELL_INFO = {
  // Truques
  'Zombaria Viciosa': { school: 'Encantamento', desc: 'Insulto mágico: o alvo faz uma salvaguarda ou sofre 1d4 psíquico e fica com desvantagem no próximo ataque.' },
  'Prestidigitação': { school: 'Transmutação', desc: 'Truques mágicos menores: limpar, sujar, acender vela, criar cheiro ou som fraco.' },
  'Ilusão Menor': { school: 'Ilusão', desc: 'Cria um som OU uma imagem pequena por 1 minuto para enganar ou distrair.' },
  'Mãos Mágicas': { school: 'Conjuração', desc: 'Uma mão espectral flutuante que pega, empurra ou manipula objetos a distância.' },
  'Luzes Dançantes': { school: 'Evocação', desc: 'Até 4 luzes flutuantes que você move — ilumina sem ocupar as mãos.' },
  'Mensagem': { school: 'Transmutação', desc: 'Sussurra uma mensagem curta a alguém a distância; só essa pessoa ouve.' },
  'Rajada Mística': { school: 'Evocação', desc: 'O ataque assinatura do Bruxo: feixe de energia, 1d10. Ganha mais feixes em níveis altos.' },
  'Toque Gélido': { school: 'Necromancia', desc: 'Mão fantasmagórica: 1d8 necrótico e o alvo não pode se curar até seu próximo turno.' },
  'Spray de Veneno': { school: 'Conjuração', desc: 'Lufada tóxica a curta distância: salvaguarda de CON ou 1d12 de veneno.' },
  'Chama Sagrada': { school: 'Evocação', desc: 'Luz radiante cai sobre o alvo: salvaguarda de DES ou 1d8 — ignora cobertura.' },
  'Orientação': { school: 'Adivinhação', desc: 'Toca um aliado: ele soma +1d4 a UM teste de atributo. Concentração.' },
  'Taumaturgia': { school: 'Transmutação', desc: 'Sinais divinos: voz amplificada, tremores leves, portas se abrindo. Puro drama.' },
  'Luz': { school: 'Evocação', desc: 'Faz um objeto brilhar como uma tocha por 1 hora.' },
  'Resistência': { school: 'Abjuração', desc: 'Toca um aliado: ele soma +1d4 a UMA salvaguarda. Concentração.' },
  'Reparar': { school: 'Transmutação', desc: 'Conserta uma quebra ou rasgo pequeno num objeto (corda, corrente, jarro).' },
  'Druidismo': { school: 'Transmutação', desc: 'Efeitos menores da natureza: prever o tempo, florescer uma flor, faísca.' },
  'Chicote de Espinhos': { school: 'Transmutação', desc: 'Chicote de espinhos: 1d6 perfurante e puxa o alvo até 3m em sua direção.' },
  'Produzir Chama': { school: 'Conjuração', desc: 'Chama na mão que ilumina ou pode ser arremessada por 1d8 de fogo.' },
  'Raio de Fogo': { school: 'Evocação', desc: 'Dardo de fogo à distância: 1d10. O truque de dano clássico de magos.' },
  'Raio de Gelo': { school: 'Evocação', desc: '1d8 de frio e reduz o deslocamento do alvo em 3m até seu próximo turno.' },
  // 1º nível
  'Enfeitiçar Pessoa': { school: 'Encantamento', desc: 'O alvo te vê como amigo (salvaguarda de SAB). Bom pra negociar, não pra combate.' },
  'Curar Ferimentos': { school: 'Evocação', desc: 'Toca uma criatura e restaura 1d8 + seu modificador de conjuração de HP.' },
  'Palavra Curativa': { school: 'Evocação', desc: 'Cura 1d4 + modificador a distância como AÇÃO BÔNUS — ideal pra reerguer aliado caído.' },
  'Fogo das Fadas': { school: 'Evocação', desc: 'Ilumina os alvos numa área: ataques contra eles têm vantagem. Concentração.' },
  'Sono': { school: 'Encantamento', desc: 'Adormece criaturas num total de 5d8 pontos de vida, das mais fracas primeiro.' },
  'Onda Trovejante': { school: 'Evocação', desc: 'Explosão sonora à sua volta: 2d8 trovejante e empurra os inimigos 3m.' },
  'Heroísmo': { school: 'Encantamento', desc: 'Um aliado fica imune a medo e ganha HP temporário a cada turno. Concentração.' },
  'Detectar Magia': { school: 'Adivinhação', desc: 'Sente a presença e a escola de magia num raio de 9m. Pode ser usada como ritual.' },
  'Feitiço (Hex)': { school: 'Encantamento', desc: 'Amaldiçoa um alvo: +1d6 necrótico nos seus ataques contra ele. Concentração.' },
  'Armadura de Agathys': { school: 'Abjuração', desc: 'Ganha HP temporário; quem te acerta corpo a corpo leva dano gélido de volta.' },
  'Comando': { school: 'Encantamento', desc: 'Uma ordem de uma palavra que o alvo obedece no próximo turno (largar, fugir, deitar).' },
  'Repreensão Infernal': { school: 'Evocação', desc: 'Reação contra quem te feriu: 2d10 de fogo (salvaguarda de DES pela metade).' },
  'Retirada Expedita': { school: 'Transmutação', desc: 'Permite usar Disparada como ação bônus em cada turno. Concentração.' },
  'Raio Bruxo': { school: 'Evocação', desc: 'Raio contínuo: 1d12 e, nos turnos seguintes, repete o dano automaticamente. Concentração.' },
  'Bênção': { school: 'Encantamento', desc: 'Até 3 aliados somam +1d4 a ataques e salvaguardas. Concentração. Um clássico.' },
  'Escudo da Fé': { school: 'Abjuração', desc: '+2 de CA num alvo por até 10 min. Concentração.' },
  'Santuário': { school: 'Abjuração', desc: 'Protege um aliado: inimigos precisam passar numa salvaguarda pra conseguir atacá-lo.' },
  'Infligir Ferimentos': { school: 'Necromancia', desc: 'Ataque de toque brutal: 3d10 de dano necrótico se acertar.' },
  'Enredar': { school: 'Conjuração', desc: 'Plantas brotam e prendem (enredam) criaturas numa área quadrada. Concentração.' },
  'Frutos Benéficos': { school: 'Transmutação', desc: 'Cria 10 bagas; cada uma cura 1 HP e alimenta por um dia.' },
  'Falar com Animais': { school: 'Adivinhação', desc: 'Conversa com bestas por 10 min. Pode ser usada como ritual.' },
  'Névoa': { school: 'Conjuração', desc: 'Cria uma nuvem de névoa de 6m que bloqueia a visão. Concentração.' },
  'Mãos Flamejantes': { school: 'Evocação', desc: 'Cone de fogo de 4,5m: 3d6 (salvaguarda de DES pela metade). Acerta vários.' },
  'Mísseis Mágicos': { school: 'Evocação', desc: '3 dardos que SEMPRE acertam, 1d4+1 cada. Dano garantido, ótimo contra alvos esquivos.' },
  'Escudo': { school: 'Abjuração', desc: 'Reação: +5 de CA até o próximo turno e anula Mísseis Mágicos. Salva-vidas.' },
  'Armadura Arcana': { school: 'Abjuração', desc: 'CA base vira 13 + DES por 8h. Essencial pro mago sem armadura.' },
  'Queda Suave': { school: 'Transmutação', desc: 'Reação: até 5 criaturas caem devagar e não sofrem dano de queda.' },
  'Marca do Caçador': { school: 'Adivinhação', desc: '+1d6 de dano nos seus ataques contra um alvo marcado. Concentração, ação bônus.' },
  'Passos Longos': { school: 'Transmutação', desc: '+3m de deslocamento por 1 hora.' },
  'Amizade Animal': { school: 'Encantamento', desc: 'Convence uma besta de que você não é ameaça (salvaguarda de SAB).' },
  'Favor Divino': { school: 'Evocação', desc: 'Seus ataques com arma causam +1d4 de dano radiante. Concentração, ação bônus.' },
  'Golpe Trovejante': { school: 'Evocação', desc: 'No próximo acerto corpo a corpo: +2d6 trovejante e pode derrubar/empurrar o alvo. Concentração.' },
  // 2º nível
  'Invisibilidade': { school: 'Ilusão', desc: 'Torna um alvo invisível até atacar ou conjurar. Concentração.' },
  'Suspensão de Pessoa': { school: 'Encantamento', desc: 'Paralisa um humanoide (salvaguarda de SAB a cada turno). Devastador. Concentração.' },
  'Sugestão': { school: 'Encantamento', desc: 'Sugere um curso de ação razoável que o alvo segue. Concentração.' },
  'Silêncio': { school: 'Ilusão', desc: 'Esfera de 6m sem nenhum som — bloqueia magias com componente verbal. Ritual.' },
  'Acalmar Emoções': { school: 'Encantamento', desc: 'Suprime medo ou hostilidade de criaturas numa área. Concentração.' },
  'Restauração Menor': { school: 'Abjuração', desc: 'Cura uma doença OU uma condição (cego, surdo, paralisado, envenenado).' },
  'Detectar Pensamentos': { school: 'Adivinhação', desc: 'Lê pensamentos superficiais e pode sondar mais fundo. Concentração.' },
  'Estilhaçar': { school: 'Evocação', desc: 'Estrondo agudo: 3d8 trovejante numa esfera (salvaguarda de CON pela metade).' },
  'Escuridão': { school: 'Evocação', desc: 'Escuridão mágica de 4,5m que nem visão no escuro atravessa. Concentração.' },
  'Imagens Espelhadas': { school: 'Ilusão', desc: '3 duplicatas suas confundem os ataques — boa chance de errarem em você.' },
  'Passo Enevoado': { school: 'Conjuração', desc: 'Teleporte de 9m como AÇÃO BÔNUS. Fuga e mobilidade excelentes.' },
  'Raio do Enfraquecimento': { school: 'Necromancia', desc: 'O alvo causa só metade do dano com ataques de Força. Concentração.' },
  'Arma Espiritual': { school: 'Evocação', desc: 'Arma flutuante: 1d8 + modificador, e ataca como AÇÃO BÔNUS todo turno. Sem concentração.' },
  'Auxílio': { school: 'Abjuração', desc: 'Até 3 aliados ganham +5 de HP máximo e atual por 8h. Não exige concentração.' },
  'Oração de Cura': { school: 'Evocação', desc: 'Cura 2d8 + modificador em até 6 aliados (leva 10 min — fora de combate).' },
  'Aprimorar Atributo': { school: 'Transmutação', desc: 'Dá vantagem em testes de um atributo (e mais, conforme a escolha). Concentração.' },
  'Zona da Verdade': { school: 'Encantamento', desc: 'Numa área, criaturas não conseguem mentir deliberadamente. Ótimo pra interrogar.' },
  'Pele de Carvalho': { school: 'Transmutação', desc: 'A CA do alvo passa a ser no mínimo 16. Concentração.' },
  'Esfera Flamejante': { school: 'Conjuração', desc: 'Bola de fogo móvel (2d6) que você reposiciona como ação bônus. Concentração.' },
  'Raio de Luar': { school: 'Evocação', desc: 'Feixe lunar de 2d10 radiante que você move a cada turno. Concentração.' },
  'Aquecer Metal': { school: 'Transmutação', desc: 'Esquenta um objeto de metal: 2d8 e o alvo tende a largá-lo. Concentração.' },
  'Passar sem Deixar Rastro': { school: 'Abjuração', desc: '+10 em Furtividade pra todo o grupo e não deixam rastros. Concentração.' },
  'Visão no Escuro': { school: 'Transmutação', desc: 'Concede a um alvo visão no escuro de 18m por 8h.' },
  'Raio Ardente': { school: 'Evocação', desc: '3 raios de fogo (2d6 cada) que você distribui entre os alvos. Escala muito bem.' },
  'Borrão': { school: 'Ilusão', desc: 'Sua imagem fica embaçada: ataques contra você têm desvantagem. Concentração.' },
  'Teia': { school: 'Conjuração', desc: 'Enche uma área com teias que prendem (enredam) os inimigos. Concentração.' },
  'Crescimento de Espinhos': { school: 'Transmutação', desc: 'Terreno espinhoso que fere quem o atravessa (2d4 a cada 1,5m). Concentração.' },
  'Encontrar Corcel': { school: 'Conjuração', desc: 'Invoca uma montaria espiritual leal e inteligente, ligada a você.' },
  'Arma Mágica': { school: 'Transmutação', desc: 'Transforma uma arma comum em +1 (ou mais em níveis altos). Concentração.' },
  'Golpe Marcante': { school: 'Evocação', desc: 'No próximo acerto: +2d6 radiante e o alvo brilha, revelando invisíveis. Concentração.' },
  'Localizar Objeto': { school: 'Adivinhação', desc: 'Sente a direção de um objeto conhecido a até 300m. Concentração.' },
  'Proteção contra Veneno': { school: 'Abjuração', desc: 'Neutraliza um veneno e dá resistência e vantagem contra envenenamento.' },
  // 3º nível
  'Dissipar Magia': { school: 'Abjuração', desc: 'Encerra efeitos mágicos num alvo. Anula buffs inimigos e armadilhas mágicas.' },
  'Medo': { school: 'Ilusão', desc: 'Inimigos num cone largam o que seguram e fogem em pânico. Concentração.' },
  'Clarividência': { school: 'Adivinhação', desc: 'Cria um sensor invisível para ver OU ouvir um local distante. Concentração.' },
  'Padrão Hipnótico': { school: 'Ilusão', desc: 'Padrão de cores que deixa inimigos enfeitiçados e incapacitados. Concentração. Forte controle.' },
  'Imagem Maior': { school: 'Ilusão', desc: 'Ilusão realista do tamanho de um objeto, com som, cheiro e temperatura. Concentração.' },
  'Línguas': { school: 'Adivinhação', desc: 'Por 1h, você entende qualquer idioma falado e é entendido por quem te ouve.' },
  'Praga': { school: 'Necromancia', desc: 'Amaldiçoa o alvo (desvantagem, dano extra ou outros efeitos à escolha). Concentração.' },
  'Enviar Mensagem': { school: 'Evocação', desc: 'Envia 25 palavras a alguém conhecido em qualquer distância, que pode responder.' },
  'Contramágica': { school: 'Abjuração', desc: 'Reação que interrompe e cancela a magia que um inimigo está conjurando. Decisiva.' },
  'Voo': { school: 'Transmutação', desc: 'Concede voo a 18m de deslocamento por 10 min. Concentração.' },
  'Toque Vampírico': { school: 'Necromancia', desc: '3d6 necrótico e você se cura na metade do dano. Concentração, repetível a cada turno.' },
  'Forma Gasosa': { school: 'Transmutação', desc: 'Transforma um alvo em névoa: passa por frestas, resiste a dano físico. Concentração.' },
  'Círculo Mágico': { school: 'Abjuração', desc: 'Cilindro que impede um tipo de criatura (demônios, mortos-vivos...) de entrar.' },
  'Revivificar': { school: 'Necromancia', desc: 'Revive quem morreu há até 1 minuto (precisa de diamante de 300 po). Sem sequelas.' },
  'Guardiões Espirituais': { school: 'Conjuração', desc: 'Espíritos giram à sua volta: 3d8 e terreno difícil pros inimigos. Concentração. Excelente.' },
  'Palavra Curativa em Massa': { school: 'Evocação', desc: 'Cura 1d4 + modificador em até 6 aliados a distância, como AÇÃO BÔNUS.' },
  'Farol da Esperança': { school: 'Abjuração', desc: 'Aliados ganham vantagem em SAB e testes de morte, e curam o máximo. Concentração.' },
  'Luz do Dia': { school: 'Evocação', desc: 'Esfera de 18m de luz solar que dissipa escuridão mágica.' },
  'Remover Maldição': { school: 'Abjuração', desc: 'Encerra todas as maldições num alvo ou objeto.' },
  'Animar Mortos': { school: 'Necromancia', desc: 'Ergue um esqueleto ou zumbi servo a partir de ossos ou cadáver.' },
  'Bola de Fogo': { school: 'Evocação', desc: 'A explosão clássica: 8d6 de fogo numa esfera de 6m (salvaguarda de DES pela metade).' },
  'Relâmpago': { school: 'Evocação', desc: 'Linha de raio de 30m: 8d6 (salvaguarda de DES pela metade). Pega vários enfileirados.' },
  'Pressa': { school: 'Transmutação', desc: 'Dobra o deslocamento, +2 de CA e uma ação extra limitada. Concentração. Cuidado ao acabar.' },
  'Lentidão': { school: 'Transmutação', desc: 'Reduz drasticamente até 6 alvos (metade do movimento, sem reação). Concentração.' },
  'Piscar': { school: 'Transmutação', desc: 'A cada turno, há chance de você sumir para o Plano Etéreo e reaparecer — difícil de acertar.' },
  'Conjurar Animais': { school: 'Conjuração', desc: 'Invoca feras aliadas (várias fracas ou poucas fortes) que lutam com você. Concentração.' },
  'Convocar Relâmpago': { school: 'Conjuração', desc: 'Chama raios de uma nuvem: 3d10, repetível a cada turno. Concentração.' },
  'Crescimento Vegetal': { school: 'Transmutação', desc: 'Faz a vegetação explodir (terreno difícil) ou enriquece uma plantação por um ano.' },
  'Respirar na Água': { school: 'Transmutação', desc: 'Até 10 criaturas respiram debaixo d\u2019água por 24h. Ritual.' },
  'Muralha de Vento': { school: 'Evocação', desc: 'Parede de vento forte que desvia flechas e pequenos voadores. Concentração.' },
  'Proteção contra Energia': { school: 'Abjuração', desc: 'Dá resistência a um tipo de dano (fogo, gelo, ácido, raio ou trovão). Concentração.' },
};

// Progressão de espaços de magia
const FULL_CASTER_SLOTS = {
  1:[2],2:[3],3:[4,2],4:[4,3],5:[4,3,2],6:[4,3,3],7:[4,3,3,1],8:[4,3,3,2],9:[4,3,3,3,1],
  10:[4,3,3,3,2],11:[4,3,3,3,2,1],12:[4,3,3,3,2,1],13:[4,3,3,3,2,1,1],14:[4,3,3,3,2,1,1],
  15:[4,3,3,3,2,1,1,1],16:[4,3,3,3,2,1,1,1],17:[4,3,3,3,2,1,1,1,1],18:[4,3,3,3,3,1,1,1,1],
  19:[4,3,3,3,3,2,1,1,1],20:[4,3,3,3,3,2,2,1,1]
};
const HALF_CASTER_SLOTS = {
  1:[],2:[2],3:[3],4:[3],5:[4,2],6:[4,2],7:[4,3],8:[4,3],9:[4,3,2],10:[4,3,2],
  11:[4,3,3],12:[4,3,3],13:[4,3,3,1],14:[4,3,3,1],15:[4,3,3,2],16:[4,3,3,2],
  17:[4,3,3,3,1],18:[4,3,3,3,1],19:[4,3,3,3,2],20:[4,3,3,3,2]
};
const WARLOCK_SLOTS = {
  1:{n:1,lvl:1},2:{n:2,lvl:1},3:{n:2,lvl:2},4:{n:2,lvl:2},5:{n:2,lvl:3},6:{n:2,lvl:3},
  7:{n:2,lvl:4},8:{n:2,lvl:4},9:{n:2,lvl:5},10:{n:2,lvl:5},11:{n:3,lvl:5},12:{n:3,lvl:5},
  13:{n:3,lvl:5},14:{n:3,lvl:5},15:{n:3,lvl:5},16:{n:3,lvl:5},17:{n:4,lvl:5},18:{n:4,lvl:5},19:{n:4,lvl:5},20:{n:4,lvl:5}
};

const FULL_CASTERS = ['Bardo','Clérigo','Druida','Feiticeiro','Mago'];
const HALF_CASTERS = ['Paladino','Patrulheiro'];

// HP máximo: nível 1 = dado cheio + CON; demais = média (dado/2 + 1) + CON
function calcMaxHp(charClass, level, conScore) {
  const hd = CLASS_DATA[charClass].hitDie;
  const cm = modNum(conScore);
  let hp = hd + cm;
  for (let i = 2; i <= level; i++) hp += (hd / 2 + 1) + cm;
  return Math.max(1, hp);
}

// Espaços de magia conforme classe e nível
function calcSpellSlots(charClass, level) {
  const slots = Array.from({ length: 9 }, () => ({ max: 0, used: 0 }));
  if (FULL_CASTERS.includes(charClass)) {
    (FULL_CASTER_SLOTS[level] || []).forEach((n, i) => { slots[i] = { max: n, used: 0 }; });
  } else if (HALF_CASTERS.includes(charClass)) {
    (HALF_CASTER_SLOTS[level] || []).forEach((n, i) => { slots[i] = { max: n, used: 0 }; });
  } else if (charClass === 'Bruxo') {
    const p = WARLOCK_SLOTS[level];
    if (p) slots[p.lvl - 1] = { max: p.n, used: 0 };
  }
  return slots;
}

// =====================================================================
// PROGRESSÃO DE CLASSE (trilha de níveis) — começando pelo Monge
// =====================================================================

const monkMartialDie = (l) => l >= 17 ? '1d10' : l >= 11 ? '1d8' : l >= 5 ? '1d6' : '1d4';
const monkMove = (l) => l >= 18 ? 9 : l >= 14 ? 7.5 : l >= 10 ? 6 : l >= 6 ? 4.5 : l >= 2 ? 3 : 0;

// Tradições Monásticas (subclasses). Detalhes completos só para a do SRD (Mão Aberta);
// as demais entram como opções reais com nome e fonte.
const MONK_SUBCLASSES = [
  { name: 'Mão Aberta', source: 'Livro do Jogador', srd: true,
    blurb: 'A tradição marcial por excelência. Transforma a Rajada de Golpes em controle total: derruba, empurra ou nega reações. Ganha cura, defesa e um golpe lendário.',
    features: {
      3: [{ name: 'Técnica da Mão Aberta', desc: 'Quando você acerta uma criatura com a Rajada de Golpes, pode impor um efeito: derrubá-la (salvaguarda de DES), empurrá-la 4,5 m (salvaguarda de FOR) ou impedi-la de usar reações até o fim do seu próximo turno.' }],
      6: [{ name: 'Totalidade do Corpo', desc: 'Como ação, você cura a si mesmo em pontos de vida iguais a 3 × seu nível de monge. Uma vez por descanso longo.' }],
      11: [{ name: 'Tranquilidade', desc: 'Ao terminar um descanso longo, você ganha o efeito da magia Santuário até o início do seu próximo descanso longo (ou até atacar/conjurar).' }],
      17: [{ name: 'Palma Vibrante', desc: 'Você inicia vibrações letais num corpo. Tocando um alvo e gastando 3 de Ki, pode depois, com uma ação, encerrá-las: salvaguarda de CON ou 10d10 de dano necrótico (metade se passar).' }],
    },
  },
  { name: 'Sombras', source: 'Livro do Jogador', srd: false,
    blurb: 'Magia das sombras e furtividade. Conjura escuridão, teleporta entre sombras e fica praticamente invisível na penumbra. O ninja.' },
  { name: 'Quatro Elementos', source: 'Livro do Jogador', srd: false,
    blurb: 'Canaliza Ki em disciplinas elementais — rajadas de fogo, ondas, escudos e até voo. Um conjurador marcial.' },
  { name: 'Mestre Bêbado', source: 'Guia de Xanathar', srd: false,
    blurb: 'Movimento imprevisível: esquiva, reposiciona e derruba inimigos imitando um bêbado. Muito mobilidade e zoeira.' },
  { name: 'Kensei', source: 'Guia de Xanathar', srd: false,
    blurb: 'Mestre de armas escolhidas, tratando-as como armas de monge, com bônus de precisão e dano à distância.' },
  { name: 'Alma Solar', source: 'Guia de Xanathar / SCAG', srd: false,
    blurb: 'Dispara feixes de luz radiante a distância e irradia chamas — o monge "à distância".' },
  { name: 'Morte Longa', source: 'Guia da Costa da Espada', srd: false,
    blurb: 'Estuda a morte: rouba vitalidade dos inimigos, resiste a quedas fatais e amedronta.' },
  { name: 'Eu Astral', source: 'Caldeirão de Tudo de Tasha', srd: false,
    blurb: 'Manifesta braços de energia espiritual que estendem alcance e mudam o atributo dos ataques para Sabedoria.' },
  { name: 'Misericórdia', source: 'Caldeirão de Tudo de Tasha', srd: false,
    blurb: 'Um curandeiro-assassino: o mesmo toque que cura aliados pode infligir dano necrótico nos inimigos. Anda na linha tênue entre a vida e a morte.',
    features: {
      3: [
        { name: 'Instrumentos da Misericórdia', desc: 'Você ganha proficiência em Intuição e Medicina e com o kit de ervas, além de uma máscara que identifica sua ordem. É o monge-médico que percorre a fronteira entre curar e matar.' },
        { name: 'Mão da Cura', desc: 'Como ação, gaste 1 ponto de Ki e toque uma criatura para curá-la em 1 dado de Artes Marciais + seu modificador de Sabedoria. Durante a Rajada de Golpes, você pode trocar um dos golpes por uma Mão da Cura sem gastar Ki por essa cura.' },
        { name: 'Mão do Dano', desc: 'Uma vez por turno, ao acertar um ataque desarmado, gaste 1 ponto de Ki para causar dano necrótico adicional igual a 1 dado de Artes Marciais + seu modificador de Sabedoria.' },
      ],
      6: [
        { name: 'Toque do Médico', desc: 'Sua Mão da Cura também encerra uma doença ou uma condição (cego, surdo, paralisado, envenenado ou atordoado) no alvo. E sua Mão do Dano passa a deixar o alvo envenenado até o fim do seu próximo turno.' },
      ],
      11: [
        { name: 'Rajada de Cura e Dano', desc: 'A Mão da Cura passa a não custar Ki. Durante a Rajada de Golpes, você pode trocar cada golpe por uma Mão da Cura e, ainda, aplicar a Mão do Dano em um dos golpes (uma vez por turno) sem gastar Ki por isso.' },
      ],
      17: [
        { name: 'Mão da Misericórdia Suprema', desc: 'Com uma ação, toque uma criatura morta há até 24 horas e gaste 5 pontos de Ki: ela volta à vida com 4d10 + seu modificador de Sabedoria pontos de vida, livre das condições cego, surdo, paralisado, envenenado e atordoado. Uma vez por descanso longo.' },
      ],
    },
  },
  { name: 'Dragão Ascendente', source: 'Tesouro de Fizban', srd: false,
    blurb: 'Empresta poder dracônico: sopros elementais, voo e presença intimidadora.' },
];

// Talentos (feats) — seleção curada e útil para iniciantes, descrições resumidas
const FEATS = [
  { name: 'Mobilidade', desc: '+3 m de deslocamento. Após atacar um inimigo corpo a corpo, você não provoca ataque de oportunidade dele. Quase feito para o monge.' },
  { name: 'Alerta', desc: '+5 na iniciativa e você não pode ser surpreendido. Costuma agir primeiro.' },
  { name: 'Sortudo', desc: '3 vezes por descanso longo, role um d20 extra e escolha qual usar em um ataque, teste ou salvaguarda.' },
  { name: 'Durão', desc: '+2 de pontos de vida por nível de personagem. Mais resistência.' },
  { name: 'Sentinela', desc: 'Inimigo atingido pelo seu ataque de oportunidade tem o deslocamento zerado. Pune quem ignora você.' },
  { name: 'Atleta', desc: '+1 em Força ou Destreza; levanta-se gastando menos movimento e escala mais rápido.' },
  { name: 'Brigão de Taverna', desc: '+1 em Força ou Constituição; proficiência com golpes desarmados e pode agarrar como ação bônus após acertar.' },
  { name: 'Iniciado em Magia', desc: 'Aprende 2 truques e 1 magia de 1º nível de uma classe à escolha. Versatilidade mágica.' },
];

const PROGRESSION = {
  'Monge': {
    hitDie: 8,
    primary: 'Destreza + Sabedoria',
    saves: 'Força e Destreza',
    asiLevels: [4, 8, 12, 16, 19],
    subclassName: 'Tradição Monástica',
    subclassChoiceLevel: 3,
    subclassFeatureLevels: [3, 6, 11, 17],
    subclasses: MONK_SUBCLASSES,
    resources: (l) => [
      { label: 'Artes Marciais', value: monkMartialDie(l), tip: 'O dado de dano dos seus ataques desarmados e armas de monge. Cresce com o nível: 1d4 → 1d6 (nv5) → 1d8 (nv11) → 1d10 (nv17).' },
      { label: 'Pontos de Ki', value: l >= 2 ? `${l}` : '—', tip: 'Energia que alimenta suas técnicas (Rajada de Golpes, Defesa Paciente, Passo do Vento, Golpe Atordoante). Você tem tantos pontos quanto seu nível e recupera todos num descanso curto.' },
      { label: 'Movimento extra', value: l >= 2 ? `+${monkMove(l)} m` : '—', tip: 'Bônus de deslocamento enquanto estiver sem armadura. Vai de +3 m (nv2) até +9 m (nv18) — monges são extremamente rápidos.' },
      { label: 'Ataques', value: l >= 5 ? '2 + golpe bônus' : '1 + golpe bônus', tip: 'Quantos ataques na ação de Atacar, mais o golpe desarmado de ação bônus das Artes Marciais. No nível 5, Ataque Extra dobra os ataques principais.' },
    ],
    features: {
      1: [
        { name: 'Defesa sem Armadura', desc: 'Sem armadura nem escudo, sua CA é 10 + mod. de Destreza + mod. de Sabedoria. O monge troca armadura por reflexo e disciplina.' },
        { name: 'Artes Marciais', desc: 'Você luta com o próprio corpo. Pode usar Destreza no lugar de Força nos ataques desarmados e armas de monge, o dano vira 1d4 (cresce com o nível) e, ao usar a ação de Atacar, ganha um golpe desarmado extra como ação bônus.' },
      ],
      2: [
        { name: 'Ki', desc: 'Sua energia interior. Você ganha pontos de Ki iguais ao seu nível, gastos em técnicas: Rajada de Golpes (dois golpes bônus), Defesa Paciente (Esquiva como bônus) e Passo do Vento (Disparada/Desengajar + salto dobrado). Recupera tudo num descanso curto.' },
        { name: 'Movimento sem Armadura', desc: 'Sem armadura, seu deslocamento aumenta +3 m (sobe ao longo dos níveis até +9 m).' },
      ],
      3: [
        { name: 'Defletir Projéteis', desc: 'Como reação, reduz muito o dano de um ataque à distância. Se zerar o dano, pode arremessar o projétil de volta gastando 1 Ki.' },
      ],
      4: [
        { name: 'Queda Suave', desc: 'Como reação, reduz o dano de uma queda — um monge raramente se machuca caindo.' },
      ],
      5: [
        { name: 'Ataque Extra', desc: 'Ao usar a ação de Atacar, você ataca duas vezes em vez de uma.' },
        { name: 'Golpe Atordoante', desc: 'Ao acertar um ataque corpo a corpo, gaste 1 Ki para forçar uma salvaguarda de Constituição. Se falhar, o alvo fica atordoado até o fim do seu próximo turno. Uma das jogadas mais fortes do monge.' },
      ],
      6: [
        { name: 'Golpes Imbuídos de Ki', desc: 'Seus golpes desarmados contam como mágicos para superar resistência e imunidade a dano não-mágico.' },
        { name: 'Habilidade da Tradição', desc: 'Você ganha um novo poder específico da escola monástica escolhida no 3º nível.' },
      ],
      7: [
        { name: 'Evasão', desc: 'Em efeitos de área com salvaguarda de Destreza (como bola de fogo): sucesso = nenhum dano; falha = metade do dano.' },
        { name: 'Quietude da Mente', desc: 'Como ação, você encerra um efeito de medo ou enfeitiçamento atuando sobre você.' },
      ],
      9: [
        { name: 'Movimento Aprimorado', desc: 'Você passa a correr por superfícies verticais e sobre líquidos sem cair, desde que termine o movimento em chão firme.' },
      ],
      10: [
        { name: 'Pureza do Corpo', desc: 'Sua disciplina te torna imune a doenças e venenos.' },
      ],
      11: [
        { name: 'Habilidade da Tradição', desc: 'Mais um poder da sua escola monástica é desbloqueado.' },
      ],
      13: [
        { name: 'Língua do Sol e da Lua', desc: 'Você entende e é entendido por qualquer criatura que fale alguma língua.' },
      ],
      14: [
        { name: 'Alma de Diamante', desc: 'Proficiência em TODAS as salvaguardas. E, ao falhar numa, pode gastar 1 Ki para rolar de novo.' },
      ],
      15: [
        { name: 'Corpo Atemporal', desc: 'Você não envelhece visivelmente, não pode ser envelhecido por magia e dispensa comida e água.' },
      ],
      17: [
        { name: 'Habilidade da Tradição', desc: 'O poder máximo da sua escola monástica.' },
      ],
      18: [
        { name: 'Corpo Vazio', desc: 'Gaste Ki para ficar invisível e resistente a quase todos os tipos de dano por um tempo; ou projete-se para o Plano Astral.' },
      ],
      20: [
        { name: 'Perfeição do Ser', desc: 'Ao rolar iniciativa sem nenhum Ki, você recupera 4 pontos na hora. O ápice da maestria física e espiritual.' },
      ],
    },
  },
};

// =====================================================================
// CLIENTE DE API — fala com o gateway em Go, que repassa ao data-service
// =====================================================================
// Rotas esperadas no gateway (proxy reverso para o FastAPI):
//   GET    /characters?user_id=...   -> lista de personagens do usuário
//   POST   /characters               -> cria  (corpo = toApi(character))
//   PUT    /characters/{id}          -> atualiza
//   DELETE /characters/{id}          -> remove
//
// Configurável em runtime via window.__GATEWAY_URL__ / window.__USER_ID__,
// ou troque os defaults abaixo. Sem autenticação ainda: um único usuário local.
const GATEWAY_URL = (typeof window !== 'undefined' && window.__GATEWAY_URL__) || 'http://localhost:8080';
const USER_ID = (typeof window !== 'undefined' && window.__USER_ID__) || 'guia-local';

const splitList = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);
const joinList = (v) => (Array.isArray(v) ? v.join(', ') : (v || ''));

// Front (camelCase + strings) -> API (snake_case + arrays)
function toApi(c) {
  return {
    user_id: USER_ID,
    name: c.name,
    race: c.race,
    char_class: c.charClass,
    level: c.level,
    background: c.background,
    motivation: c.motivation,
    str: c.str, dex: c.dex, con: c.con, int: c.int, wis: c.wis, cha: c.cha,
    ac: c.ac,
    max_hp: c.maxHp,
    skills: splitList(c.skills),
    spells: splitList(c.spells),
    equipment: c.equipment,
  };
}

// API (snake_case + arrays) -> Front (camelCase + strings)
function fromApi(d) {
  return {
    id: d.id,
    name: d.name,
    race: d.race,
    charClass: d.char_class,
    level: d.level,
    background: d.background,
    motivation: d.motivation,
    str: d.str, dex: d.dex, con: d.con, int: d.int, wis: d.wis, cha: d.cha,
    ac: d.ac,
    maxHp: d.max_hp,
    skills: joinList(d.skills),
    spells: joinList(d.spells),
    equipment: d.equipment,
  };
}

async function apiLoadCharacter() {
  const res = await fetch(`${GATEWAY_URL}/characters?user_id=${encodeURIComponent(USER_ID)}`);
  if (!res.ok) throw new Error(`GET /characters falhou: ${res.status}`);
  const list = await res.json();
  return (Array.isArray(list) && list.length) ? fromApi(list[0]) : null;
}

async function apiCreateCharacter(character) {
  const res = await fetch(`${GATEWAY_URL}/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApi(character)),
  });
  if (!res.ok) throw new Error(`POST /characters falhou: ${res.status}`);
  return fromApi(await res.json());
}

async function apiUpdateCharacter(id, character) {
  const res = await fetch(`${GATEWAY_URL}/characters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApi(character)),
  });
  if (!res.ok) throw new Error(`PUT /characters/${id} falhou: ${res.status}`);
  return fromApi(await res.json());
}

async function apiDeleteCharacter(id) {
  const res = await fetch(`${GATEWAY_URL}/characters/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(`DELETE /characters/${id} falhou: ${res.status}`);
}

// =====================================================================
// COMPONENTS
// =====================================================================

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;600&display=swap');
      .font-display { font-family: 'Cinzel', serif; letter-spacing: 0.02em; }
      .font-body { font-family: 'EB Garamond', serif; }
      .font-mono-pretty { font-family: 'JetBrains Mono', monospace; }
      
      .parchment-bg {
        background-color: #1a1208;
        background-image: 
          radial-gradient(at 20% 30%, rgba(120, 80, 40, 0.15) 0px, transparent 50%),
          radial-gradient(at 80% 70%, rgba(80, 50, 20, 0.2) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(60, 35, 15, 0.3) 0px, transparent 70%);
      }
      
      .panel-bg {
        background: linear-gradient(135deg, rgba(42, 30, 20, 0.85) 0%, rgba(30, 21, 13, 0.85) 100%);
        backdrop-filter: blur(8px);
      }
      
      .gold-border {
        border: 1px solid rgba(212, 175, 122, 0.3);
        box-shadow: 0 0 20px rgba(212, 175, 122, 0.05), inset 0 1px 0 rgba(212, 175, 122, 0.1);
      }
      
      .gold-border-hover:hover {
        border-color: rgba(212, 175, 122, 0.6);
        box-shadow: 0 0 25px rgba(212, 175, 122, 0.15), inset 0 1px 0 rgba(212, 175, 122, 0.2);
      }
      
      .scroll-pretty::-webkit-scrollbar { width: 8px; }
      .scroll-pretty::-webkit-scrollbar-track { background: rgba(26, 18, 8, 0.3); }
      .scroll-pretty::-webkit-scrollbar-thumb { background: rgba(212, 175, 122, 0.3); border-radius: 4px; }
      .scroll-pretty::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 122, 0.5); }
      
      @keyframes flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
      .flicker { animation: flicker 3s ease-in-out infinite; }
    `}</style>
  );
}

// ---------- TOOLTIP ----------
function Tooltip({ content, children, width = 256 }) {
  return (
    <span className="relative group inline-flex items-center align-middle">
      {children}
      <span role="tooltip"
        className="pointer-events-none absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 p-3 rounded-lg text-left text-xs font-body leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ width: `${width}px`, maxWidth: '78vw', background: 'rgba(28,20,12,0.98)', border: '1px solid rgba(212,175,122,0.45)', boxShadow: '0 10px 30px rgba(0,0,0,0.55)', color: '#f0e6d0' }}>
        {content}
      </span>
    </span>
  );
}

// Chip de magia/truque: checkbox + nome + etiqueta de escola + tooltip de descrição
function SpellChip({ name, selected, disabled, onToggle }) {
  const info = SPELL_INFO[name];
  const school = info?.school;
  const schoolCls = school ? SCHOOL_COLOR[school] : 'text-stone-400 border-stone-700/50 bg-stone-900/40';
  return (
    <div className="relative group">
      <button onClick={onToggle} disabled={disabled}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded border text-left font-body text-sm transition-all ${selected ? 'bg-indigo-900/40 border-indigo-500/60 text-indigo-100' : disabled ? 'border-amber-900/20 text-stone-600 cursor-not-allowed' : 'border-amber-900/30 text-amber-200/70 hover:border-indigo-600/50'}`}>
        <span className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${selected ? 'bg-indigo-400 border-indigo-300' : 'border-amber-700/50'}`}></span>
        <span className="truncate flex-1">{name}</span>
        {school && <span className={`text-[8px] font-display tracking-wider px-1 py-0.5 rounded border flex-shrink-0 ${schoolCls}`}>{school.slice(0, 4).toUpperCase()}</span>}
      </button>
      {info && (
        <span role="tooltip"
          className="pointer-events-none absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 p-3 rounded-lg text-left opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ width: '256px', maxWidth: '78vw', background: 'rgba(28,20,12,0.98)', border: '1px solid rgba(212,175,122,0.45)', boxShadow: '0 10px 30px rgba(0,0,0,0.55)' }}>
          <span className={`inline-block text-[9px] font-display tracking-widest px-1.5 py-0.5 rounded border mb-1.5 ${schoolCls}`}>{school}</span>
          <span className="block text-xs font-body leading-relaxed" style={{ color: '#f0e6d0' }}>{info.desc}</span>
        </span>
      )}
    </div>
  );
}

// Etiqueta de magia somente-leitura (usada na ficha)
function SpellTag({ raw }) {
  const isCantrip = / \(truque\)$/.test(raw);
  const name = raw.replace(/ \(truque\)$/, '');
  const info = SPELL_INFO[name];
  const school = info?.school;
  const schoolCls = school ? SCHOOL_COLOR[school] : 'text-stone-400 border-stone-700/50 bg-stone-900/40';
  return (
    <div className="relative group inline-block">
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border border-amber-900/30 bg-stone-900/40 text-amber-100/90 font-body text-sm ${info ? 'cursor-help' : ''}`}>
        {name}
        {isCantrip && <span className="text-[9px] text-amber-400/60">truque</span>}
        {school && <span className={`text-[8px] font-display tracking-wider px-1 py-0.5 rounded border ${schoolCls}`}>{school.slice(0, 4).toUpperCase()}</span>}
      </span>
      {info && (
        <span role="tooltip"
          className="pointer-events-none absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 p-3 rounded-lg text-left opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ width: '256px', maxWidth: '78vw', background: 'rgba(28,20,12,0.98)', border: '1px solid rgba(212,175,122,0.45)', boxShadow: '0 10px 30px rgba(0,0,0,0.55)' }}>
          <span className={`inline-block text-[9px] font-display tracking-widest px-1.5 py-0.5 rounded border mb-1.5 ${schoolCls}`}>{school}</span>
          <span className="block text-xs font-body leading-relaxed" style={{ color: '#f0e6d0' }}>{info.desc}</span>
        </span>
      )}
    </div>
  );
}

// ---------- WELCOME ----------
function WelcomeScreen({ onNew, onExplore }) {
  return (
    <div className="min-h-screen parchment-bg flex items-center justify-center p-6">
      <FontLoader />
      <div className="max-w-xl panel-bg gold-border rounded-lg p-10 text-center">
        <div className="flex justify-center mb-6">
          <Swords className="w-16 h-16 text-amber-500/80 flicker" />
        </div>
        <h1 className="font-display text-4xl text-amber-100 mb-2 tracking-wider">GUIA DO HERÓI</h1>
        <p className="font-body text-amber-200/60 italic mb-8 text-lg">Aprenda D&amp;D 5ª edição montando seu personagem: distribua atributos, escolha perícias e magias, e veja seus poderes crescerem nível a nível.</p>
        <div className="font-body text-amber-100/70 text-left mb-8 leading-relaxed space-y-3">
          <p>Monte um personagem completo, do zero, seguindo as regras 5e — atributos por compra de pontos, perícias, magias e equipamento inicial.</p>
          <p>Explore como cada classe evolui: habilidades, subclasses, talentos e magias, nível a nível, no construtor de trilha.</p>
          <p className="text-amber-300/80 italic text-sm">Um guia interativo de criação e progressão de personagem.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onNew}
            className="font-display tracking-widest text-amber-100 bg-amber-900/40 hover:bg-amber-800/50 gold-border gold-border-hover px-8 py-3 rounded transition-all"
          >
            FORJAR HERÓI
          </button>
          <button
            onClick={onExplore}
            className="font-display tracking-widest text-indigo-100 bg-indigo-900/30 hover:bg-indigo-800/40 border border-indigo-700/50 px-8 py-3 rounded transition-all"
          >
            VER TRILHA DE CLASSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- GLOSSÁRIO (legenda lateral) ----------
const GLOSSARY = {
  'Atributos': [
    ['FOR — Força', 'Ataques corpo a corpo, carregar peso, Atletismo.'],
    ['DES — Destreza', 'CA, iniciativa, ataques ágeis e à distância, Furtividade.'],
    ['CON — Constituição', 'Define seus pontos de vida e fôlego.'],
    ['INT — Inteligência', 'Conhecimento, Investigação, magia de Mago.'],
    ['SAB — Sabedoria', 'Percepção, intuição, magia de Clérigo e Druida.'],
    ['CAR — Carisma', 'Presença social, magia de Bardo, Feiticeiro e Bruxo.'],
  ],
  'Termos': [
    ['CA — Classe de Armadura', 'Número que um ataque precisa alcançar para te acertar.'],
    ['prof. — Proficiência', 'Bônus no que você domina; vai de +2 a +6 com o nível.'],
    ['HP — Pontos de Vida', 'Sua saúde. Ao chegar a 0, você cai.'],
    ['Ki', 'Energia do monge que alimenta técnicas; volta no descanso curto.'],
    ['Salvaguarda', 'Teste para resistir a um efeito (veneno, magia, queda...).'],
    ['Iniciativa', 'Ordem dos turnos no combate (rolagem de Destreza).'],
    ['ASI / Talento', 'Em certos níveis: +atributo ou um talento especial.'],
    ['Vantagem / Desvantagem', 'Role 2d20 e fique com o maior / o menor.'],
    ['CD — Dificuldade', 'Número-alvo que um teste precisa alcançar.'],
  ],
};

function Glossary() {
  return (
    <div className="panel-bg gold-border rounded-lg p-4 lg:sticky lg:top-24">
      <h3 className="font-display text-sm tracking-widest text-amber-100 mb-3 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-400/70" />LEGENDA</h3>
      {Object.entries(GLOSSARY).map(([group, items]) => (
        <div key={group} className="mb-3 last:mb-0">
          <div className="font-display text-[10px] tracking-widest text-indigo-300/70 mb-1.5">{group.toUpperCase()}</div>
          <dl className="space-y-1.5">
            {items.map(([term, def]) => (
              <div key={term}>
                <dt className="font-body text-xs text-amber-200">{term}</dt>
                <dd className="font-body text-[11px] text-amber-100/60 leading-snug">{def}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

// ---------- PROGRESSION VIEW (construtor interativo de nível) ----------
function ProgressionView({ initialClass, currentLevel, onClose }) {
  const allClasses = Object.keys(CLASS_DATA);
  const startClass = PROGRESSION[initialClass] ? initialClass : 'Monge';
  const [selected, setSelected] = useState(startClass);
  const data = PROGRESSION[selected];

  const [builtLevel, setBuiltLevel] = useState(1);
  const [subclass, setSubclass] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [openLevel, setOpenLevel] = useState(1);
  const [choosingSubclass, setChoosingSubclass] = useState(false);

  const changeClass = (cl) => {
    if (!PROGRESSION[cl]) return;
    setSelected(cl); setBuiltLevel(1); setSubclass(null); setDecisions({}); setOpenLevel(1); setChoosingSubclass(false);
  };
  const reset = () => { setBuiltLevel(1); setSubclass(null); setDecisions({}); setOpenLevel(1); setChoosingSubclass(false); };

  const choiceLevel = data.subclassChoiceLevel;
  const subFeatureLevels = data.subclassFeatureLevels || [];

  const needsSubclass = !!choiceLevel && builtLevel >= choiceLevel && !subclass;
  const asiPending = data.asiLevels.includes(builtLevel) && (() => {
    const d = decisions[builtLevel];
    return !d || (d.kind === 'feat' && !d.feat);
  })();
  const canLevelUp = builtLevel < 20 && !needsSubclass && !asiPending;
  const showSubclassChooser = needsSubclass || choosingSubclass;
  const levelUp = () => { if (canLevelUp) { const nl = builtLevel + 1; setBuiltLevel(nl); setOpenLevel(nl); } };
  const pickSubclass = (sc) => { setSubclass(sc); setChoosingSubclass(false); };

  const res = data.resources(builtLevel);

  const tipStyle = { width: '256px', maxWidth: '78vw', background: 'rgba(28,20,12,0.98)', border: '1px solid rgba(212,175,122,0.45)', boxShadow: '0 10px 30px rgba(0,0,0,0.55)' };

  return (
    <div className="fixed inset-0 z-50 parchment-bg overflow-y-auto scroll-pretty">
      <FontLoader />
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4 sticky top-0 panel-bg gold-border rounded-lg px-5 py-3 z-20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-300/80" />
            <h1 className="font-display text-lg sm:text-xl text-amber-100 tracking-widest">CONSTRUTOR DE NÍVEL</h1>
          </div>
          <button onClick={onClose} className="text-amber-300/60 hover:text-amber-200"><X className="w-5 h-5" /></button>
        </div>

        {/* Seletor de classe */}
        <div className="flex flex-wrap gap-2 mb-4">
          {allClasses.map(cl => {
            const has = !!PROGRESSION[cl]; const sel = cl === selected;
            return (
              <button key={cl} onClick={() => changeClass(cl)} disabled={!has}
                className={`font-display text-[11px] tracking-widest px-3 py-1.5 rounded border transition-all ${sel ? 'bg-indigo-800/50 text-indigo-100 border-indigo-500/60' : has ? 'bg-stone-900/40 text-amber-200/70 border-amber-900/40 hover:border-indigo-600/50' : 'bg-stone-900/20 text-stone-600 border-stone-800/40 cursor-not-allowed'}`}>
                {cl.toUpperCase()}{!has && ' · em breve'}
              </button>
            );
          })}
        </div>

        <div className="lg:flex lg:gap-6 lg:items-start">
          <div className="lg:flex-1 lg:max-w-2xl w-full min-w-0">

        {/* Painel do personagem em construção */}
        <div className="panel-bg gold-border rounded-lg p-5 mb-5 font-body">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="font-display text-2xl text-amber-100 tracking-wide">{selected}</h2>
            <span className="font-display text-sm tracking-widest text-indigo-200 flex items-center gap-2">
              NÍVEL {builtLevel}{subclass ? ` · ${subclass.name}` : ''}
              {subclass && (
                <button onClick={() => setChoosingSubclass(true)} className="font-body text-[11px] tracking-normal text-indigo-300/70 hover:text-indigo-200 underline">trocar</button>
              )}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-amber-200/70 mt-1">
            <span>Dado de vida: <span className="font-mono-pretty text-amber-100">d{data.hitDie}</span></span>
            <span>Atributos-chave: <span className="text-amber-100">{data.primary}</span></span>
            <span>Salvaguardas: <span className="text-amber-100">{data.saves}</span></span>
          </div>
          <div className="mt-3 h-1.5 bg-stone-900/60 rounded-full overflow-hidden border border-amber-900/30">
            <div className="h-full bg-indigo-500/70 transition-all" style={{ width: `${(builtLevel / 20) * 100}%` }}></div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="font-mono-pretty text-[10px] bg-stone-900/50 border border-amber-900/30 rounded px-2 py-0.5 text-amber-200/80">prof.: <span className="text-amber-100">+{profBonus(builtLevel)}</span></span>
            {res.map(r => {
              const chip = (
                <span className={`font-mono-pretty text-[10px] bg-stone-900/50 border rounded px-2 py-0.5 text-amber-200/80 ${r.tip ? 'border-amber-600/40 cursor-help' : 'border-amber-900/30'}`}>
                  {r.label}: <span className="text-amber-100">{r.value}</span>{r.tip && <span className="text-amber-400/60 ml-0.5">·?</span>}
                </span>
              );
              return r.tip
                ? <Tooltip key={r.label} content={<span className="block whitespace-pre-line text-amber-100/90">{r.tip}</span>}>{chip}</Tooltip>
                : <span key={r.label}>{chip}</span>;
            })}
          </div>
          <button onClick={reset} className="mt-3 text-[11px] font-display tracking-widest text-amber-400/50 hover:text-amber-300 flex items-center gap-1"><RotateCcw className="w-3 h-3" />RECOMEÇAR DO NÍVEL 1</button>
        </div>

        {/* Cartões de nível (acordeão) */}
        <div className="space-y-2">
          {Array.from({ length: builtLevel }, (_, i) => i + 1).map(L => {
            const open = openLevel === L;
            const isNew = L === builtLevel;
            const isASI = data.asiLevels.includes(L);
            const baseFeats = data.features[L] || [];
            const subFeats = (subclass && subFeatureLevels.includes(L) && subclass.features && subclass.features[L]) || [];
            const subPending = subFeatureLevels.includes(L) && subclass && (!subclass.features || !subclass.features[L]);
            const decision = decisions[L];
            const r2 = data.resources(L);
            return (
              <div key={L} className={`rounded-lg overflow-hidden border ${isNew ? 'border-indigo-500/50 ring-1 ring-indigo-400/30' : 'border-amber-900/25'}`}>
                <button onClick={() => setOpenLevel(open ? -1 : L)} className="w-full flex items-center justify-between px-4 py-2.5 panel-bg">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono-pretty text-[11px] font-bold border ${isNew ? 'bg-indigo-500 border-indigo-300 text-white' : 'bg-amber-900/60 border-amber-600/50 text-amber-100'}`}>{L}</span>
                    <span className="font-display text-sm tracking-widest text-amber-200">NÍVEL {L}</span>
                    {isNew && <span className="font-display text-[9px] tracking-widest bg-indigo-500/30 text-indigo-100 border border-indigo-400/50 rounded px-1.5 py-0.5">NOVO</span>}
                  </div>
                  <span className="text-amber-400/50 text-xs">{open ? '\u25B2' : '\u25BC'}</span>
                </button>
                {open && (
                  <div className="px-4 py-3 bg-stone-950/30">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="font-mono-pretty text-[10px] bg-stone-900/50 border border-amber-900/30 rounded px-2 py-0.5 text-amber-200/80">prof. +{profBonus(L)}</span>
                      <span className="font-mono-pretty text-[10px] bg-stone-900/50 border border-amber-900/30 rounded px-2 py-0.5 text-emerald-400/70">+{data.hitDie / 2 + 1} HP <span className="text-amber-300/40">+CON</span></span>
                      {r2.map(r => (
                        <span key={r.label} className="font-mono-pretty text-[10px] bg-stone-900/50 border border-amber-900/30 rounded px-2 py-0.5 text-amber-200/80">{r.label}: <span className="text-amber-100">{r.value}</span></span>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {baseFeats.map(f => (
                        <div key={f.name} className="flex gap-2 items-start">
                          <Sparkles className="w-3 h-3 text-indigo-400/70 mt-1 flex-shrink-0" />
                          <p className="font-body text-sm text-amber-100/90"><strong className="text-amber-200">{f.name}</strong> — {f.desc}</p>
                        </div>
                      ))}
                      {subFeats.map(f => (
                        <div key={f.name} className="flex gap-2 items-start">
                          <Sparkles className="w-3 h-3 text-amber-400/80 mt-1 flex-shrink-0" />
                          <p className="font-body text-sm text-amber-100/90"><strong className="text-amber-300">{subclass.name}: {f.name}</strong> — {f.desc}</p>
                        </div>
                      ))}
                      {subPending && (
                        <p className="font-body text-xs italic text-amber-400/50 pl-5">Habilidade de <strong className="text-amber-300/80">{subclass.name}</strong> neste nível — consulte {subclass.source}. (Tabela completa via fonte licenciada na versão final.)</p>
                      )}
                      {isASI && decision && (decision.kind === 'asi' || decision.feat) && (
                        <div className="flex gap-2 items-start">
                          <span className="font-display text-[9px] tracking-widest bg-amber-600/30 text-amber-100 border border-amber-500/50 rounded px-1.5 py-0.5 mt-0.5 flex-shrink-0">ESCOLHA</span>
                          <p className="font-body text-sm text-amber-100/90">
                            {decision.kind === 'asi'
                              ? <span><strong className="text-amber-200">Aumento de Atributo</strong> — +2 em um atributo (ou +1 em dois).</span>
                              : <span><strong className="text-amber-200">Talento: {decision.feat}</strong></span>}
                            {' '}
                            <button onClick={() => setDecisions(d => { const c = { ...d }; delete c[L]; return c; })} className="text-[11px] text-indigo-300/70 hover:text-indigo-200 underline">trocar</button>
                          </p>
                        </div>
                      )}
                      {baseFeats.length === 0 && subFeats.length === 0 && !subPending && !isASI && (
                        <p className="font-body text-xs italic text-amber-300/40">Sem nova habilidade — seus recursos acima melhoram.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Escolha / troca de subclasse */}
        {showSubclassChooser && (
          <div className="mt-4 panel-bg gold-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-lg text-amber-100 tracking-wide">{subclass ? `Trocar ${data.subclassName}` : `Escolha sua ${data.subclassName}`}</h3>
              {choosingSubclass && subclass && (
                <button onClick={() => setChoosingSubclass(false)} className="font-display text-[11px] tracking-widest text-amber-300/70 hover:text-amber-200">CANCELAR</button>
              )}
            </div>
            <p className="font-body text-xs italic text-amber-300/50 mb-3">
              {subclass ? 'Troque para comparar builds — seu nível e talentos são mantidos.' : `No nível ${choiceLevel} você se compromete com uma tradição.`} Passe o mouse para ver o estilo de cada uma.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.subclasses.map(sc => {
                const sel = subclass && subclass.name === sc.name;
                return (
                  <div key={sc.name} className="relative group">
                    <button onClick={() => pickSubclass(sc)} className={`w-full text-left px-3 py-2 rounded border transition-all ${sel ? 'border-indigo-500/60 bg-indigo-900/40' : 'border-amber-900/30 hover:border-indigo-500/50 bg-stone-900/40'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-body text-sm text-amber-100">{sc.name}</span>
                        {(sc.srd || sc.features)
                          ? <span className="text-[8px] font-display tracking-wider px-1 py-0.5 rounded border text-emerald-300 border-emerald-700/50 bg-emerald-950/40 flex-shrink-0">DETALHADA</span>
                          : <span className="text-[8px] font-display tracking-wider px-1 py-0.5 rounded border text-amber-300/60 border-amber-800/40 flex-shrink-0">{sc.source}</span>}
                      </div>
                    </button>
                    <span role="tooltip" className="pointer-events-none absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 p-3 rounded-lg text-left opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={tipStyle}>
                      <span className="block font-display text-[10px] tracking-widest text-amber-300 mb-1">{sc.source}</span>
                      <span className="block text-xs font-body leading-relaxed" style={{ color: '#f0e6d0' }}>{sc.blurb}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Escolha pendente: ASI ou Talento */}
        {asiPending && (
          <div className="mt-4 panel-bg gold-border rounded-lg p-5">
            <h3 className="font-display text-lg text-amber-100 tracking-wide mb-1">Nível {builtLevel}: Atributo ou Talento</h3>
            <p className="font-body text-xs italic text-amber-300/50 mb-3">Escolha um caminho para continuar.</p>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setDecisions(d => ({ ...d, [builtLevel]: { kind: 'asi' } }))}
                className={`flex-1 font-display text-xs tracking-widest px-3 py-2 rounded border ${decisions[builtLevel]?.kind === 'asi' ? 'bg-amber-800/50 text-amber-100 border-amber-500/60' : 'bg-stone-900/40 text-amber-200/70 border-amber-900/40 hover:border-amber-600/50'}`}>
                AUMENTO DE ATRIBUTO
              </button>
              <button onClick={() => setDecisions(d => ({ ...d, [builtLevel]: { kind: 'feat', feat: null } }))}
                className={`flex-1 font-display text-xs tracking-widest px-3 py-2 rounded border ${decisions[builtLevel]?.kind === 'feat' ? 'bg-indigo-800/50 text-indigo-100 border-indigo-500/60' : 'bg-stone-900/40 text-amber-200/70 border-amber-900/40 hover:border-indigo-600/50'}`}>
                TALENTO
              </button>
            </div>
            {decisions[builtLevel]?.kind === 'feat' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FEATS.map(ft => (
                  <div key={ft.name} className="relative group">
                    <button onClick={() => setDecisions(d => ({ ...d, [builtLevel]: { kind: 'feat', feat: ft.name } }))}
                      className={`w-full text-left px-3 py-2 rounded border text-sm font-body transition-all ${decisions[builtLevel]?.feat === ft.name ? 'bg-indigo-900/40 border-indigo-500/60 text-indigo-100' : 'border-amber-900/30 text-amber-200/70 hover:border-indigo-600/50'}`}>
                      {ft.name}
                    </button>
                    <span role="tooltip" className="pointer-events-none absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 p-3 rounded-lg text-left opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={tipStyle}>
                      <span className="block text-xs font-body leading-relaxed" style={{ color: '#f0e6d0' }}>{ft.desc}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subir de nível */}
        <div className="text-center py-6">
          {builtLevel < 20 ? (
            <button onClick={levelUp} disabled={!canLevelUp}
              className={`font-display tracking-widest px-8 py-3 rounded border transition-all flex items-center gap-2 mx-auto ${canLevelUp ? 'text-indigo-100 bg-indigo-800/40 hover:bg-indigo-700/50 border-indigo-500/60' : 'text-stone-500 bg-stone-900/30 border-stone-800/40 cursor-not-allowed'}`}>
              <Sparkles className="w-4 h-4" />SUBIR PARA O NÍVEL {builtLevel + 1}
            </button>
          ) : (
            <p className="font-display tracking-widest text-amber-300/80">NÍVEL MÁXIMO — JORNADA COMPLETA ✦</p>
          )}
          {(needsSubclass || asiPending) && <p className="font-body text-xs italic text-amber-400/50 mt-2">Faça a escolha acima para continuar.</p>}
        </div>

          </div>{/* fim coluna principal */}

          <aside className="lg:w-72 lg:flex-shrink-0 mt-6 lg:mt-0">
            <Glossary />
          </aside>
        </div>{/* fim layout de colunas */}

        <div className="text-center pb-6">
          <button onClick={onClose} className="font-display tracking-widest text-amber-300/70 hover:text-amber-200 border border-amber-900/40 rounded px-6 py-2">FECHAR</button>
        </div>
      </div>
    </div>
  );
}

// ---------- CHARACTER CREATION ----------
function CharacterCreation({ onCreate, onCancel, initial }) {
  const [name, setName] = useState(initial?.name || '');
  const [motivation, setMotivation] = useState(initial?.motivation || '');
  const [race, setRace] = useState(initial?.race || 'Humano');
  const [charClass, setCharClass] = useState(initial?.charClass || 'Guerreiro');
  const [level, setLevel] = useState(initial?.level || 1);
  const [background, setBackground] = useState(initial?.background || 'Soldado');
  const [bases, setBases] = useState({ ...STANDARD_ARRAY });
  const [skills, setSkills] = useState([]);
  const [cantrips, setCantrips] = useState([]);
  const [spells, setSpells] = useState([]);
  const [equipment, setEquipment] = useState(CLASS_DATA[initial?.charClass || 'Guerreiro'].equipment);
  const [acOverride, setAcOverride] = useState(null);

  const cd = CLASS_DATA[charClass];
  const racial = RACE_DATA[race].asi;

  // Atributos finais (base + racial)
  const totals = {};
  ['str','dex','con','int','wis','cha'].forEach(a => {
    totals[a] = bases[a] + (racial[a] || 0);
  });

  // Pontos de compra
  const pointsUsed = ['str','dex','con','int','wis','cha'].reduce((s, a) => s + POINT_BUY_COST[bases[a]], 0);
  const pointsLeft = POINT_BUY_BUDGET - pointsUsed;

  // Derivados
  const maxHp = calcMaxHp(charClass, level, totals.con);
  const ac = acOverride !== null ? acOverride : cd.ac;

  // Perícias disponíveis
  const skillOptions = cd.skills === 'ANY' ? ALL_SKILLS : cd.skills;
  const skillLimit = cd.skillChoices;

  // Magias
  const spellInfo = SPELL_DATA[charClass];
  const isCaster = !!cd.caster && !!spellInfo && level >= (cd.casterFrom || 1);
  const cantripLimit = cd.cantripsKnown || 0;
  const spellLimit = cd.spellsKnown ?? cd.spellbook ?? (cd.caster ? Math.max(1, modNum(totals[cd.caster]) + (cd.half ? Math.ceil(level / 2) : level)) : 0);
  const accessibleLevel = isCaster ? maxSpellLevel(charClass, level) : 0;
  const spellLevels = [];
  for (let L = 1; L <= accessibleLevel; L++) {
    if (spellInfo && spellInfo[L] && spellInfo[L].length) spellLevels.push(L);
  }
  const hasHigherLevels = accessibleLevel > (spellLevels[spellLevels.length - 1] || 0);

  const changeClass = (newClass) => {
    setCharClass(newClass);
    setEquipment(CLASS_DATA[newClass].equipment);
    setSkills([]); setCantrips([]); setSpells([]); setAcOverride(null);
  };

  const adjBase = (attr, delta) => {
    setBases(prev => {
      const v = prev[attr] + delta;
      if (v < 8 || v > 15) return prev;
      const cost = POINT_BUY_COST[v] - POINT_BUY_COST[prev[attr]];
      if (delta > 0 && cost > pointsLeft) return prev;
      return { ...prev, [attr]: v };
    });
  };

  const toggle = (arr, setArr, item, limit) => {
    if (arr.includes(item)) setArr(arr.filter(x => x !== item));
    else if (arr.length < limit) setArr([...arr, item]);
  };

  const skillsOk = skills.length === skillLimit;
  const cantripsOk = !isCaster || cantrips.length === cantripLimit;
  const canSubmit = name.trim().length > 0 && skillsOk && cantripsOk;

  const submit = () => {
    onCreate({
      name, race, charClass, level, background, motivation,
      str: totals.str, dex: totals.dex, con: totals.con, int: totals.int, wis: totals.wis, cha: totals.cha,
      ac, maxHp,
      skills: skills.join(', '),
      spells: isCaster ? [...cantrips.map(s => `${s} (truque)`), ...spells].join(', ') : '',
      equipment,
    });
  };

  return (
    <div className="min-h-screen parchment-bg p-6">
      <FontLoader />
      <div className="max-w-3xl mx-auto panel-bg gold-border rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-amber-100 tracking-wider">FORJA DO HERÓI</h1>
          <button onClick={onCancel} className="text-amber-300/60 hover:text-amber-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-body text-amber-100">
          <Field label="Nome">
            <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Aelric Stormblade" />
          </Field>
          <Field label="Motivação (1 linha)">
            <input value={motivation} onChange={e => setMotivation(e.target.value)} className="input" placeholder="Vingar meu vilarejo destruído" />
          </Field>
          <Field label="Raça">
            <select value={race} onChange={e => setRace(e.target.value)} className="input">
              {Object.keys(RACE_DATA).map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Classe">
            <select value={charClass} onChange={e => changeClass(e.target.value)} className="input">
              {Object.keys(CLASS_DATA).map(cl => <option key={cl}>{cl}</option>)}
            </select>
          </Field>
          <Field label="Antecedente">
            <input value={background} onChange={e => setBackground(e.target.value)} className="input" placeholder="Soldado, Eremita, Nobre..." />
          </Field>
          <Field label="Nível">
            <input type="number" min="1" max="20" value={level} onChange={e => setLevel(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} className="input" />
          </Field>
        </div>

        {/* ATRIBUTOS - COMPRA DE PONTOS */}
        <div className="flex items-center justify-between mt-6 mb-2">
          <h2 className="font-display text-lg text-amber-200 tracking-wide">ATRIBUTOS</h2>
          <div className="flex items-center gap-3">
            <span className={`font-mono-pretty text-sm ${pointsLeft < 0 ? 'text-red-400' : 'text-amber-300/80'}`}>
              {pointsLeft} pts restantes
            </span>
            <button onClick={() => setBases({ ...STANDARD_ARRAY })}
              className="font-display text-[10px] tracking-widest text-amber-300/70 hover:text-amber-200 border border-amber-900/40 rounded px-2 py-1">
              ARRAY PADRÃO
            </button>
          </div>
        </div>
        <p className="text-amber-300/60 text-xs font-body italic mb-3">Compra de pontos (8–15, 27 pontos). Bônus racial de {race} aplicado automaticamente.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['str','dex','con','int','wis','cha'].map(attr => (
            <div key={attr} className="bg-stone-900/40 border border-amber-900/30 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-xs text-amber-300/80 tracking-widest">{attr.toUpperCase()}</span>
                {racial[attr] ? <span className="font-mono-pretty text-[10px] text-emerald-400/80">+{racial[attr]} racial</span> : <span className="text-[10px] text-stone-500">—</span>}
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => adjBase(attr, -1)} className="w-7 h-7 rounded bg-stone-800/70 hover:bg-stone-700 text-amber-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                <div className="text-center">
                  <div className="font-mono-pretty text-2xl text-amber-100">{totals[attr]}</div>
                  <div className="font-mono-pretty text-xs text-amber-300/60">base {bases[attr]} • {mod(totals[attr])}</div>
                </div>
                <button onClick={() => adjBase(attr, 1)} className="w-7 h-7 rounded bg-stone-800/70 hover:bg-stone-700 text-amber-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* DERIVADOS */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-stone-900/40 border border-amber-900/30 rounded p-3 text-center">
            <div className="font-display text-[10px] text-amber-400/70 tracking-widest">HP MÁXIMO</div>
            <div className="font-mono-pretty text-2xl text-amber-100">{maxHp}</div>
            <div className="text-[10px] text-amber-300/50">d{cd.hitDie} + CON</div>
          </div>
          <div className="bg-stone-900/40 border border-amber-900/30 rounded p-3 text-center">
            <div className="font-display text-[10px] text-amber-400/70 tracking-widest">CA</div>
            <input type="number" value={ac} onChange={e => setAcOverride(parseInt(e.target.value) || 0)}
              className="w-full bg-transparent text-center font-mono-pretty text-2xl text-amber-100 outline-none" />
            <div className="text-[10px] text-amber-300/50">padrão da classe</div>
          </div>
          <div className="bg-stone-900/40 border border-amber-900/30 rounded p-3 text-center">
            <div className="font-display text-[10px] text-amber-400/70 tracking-widest">PROF.</div>
            <div className="font-mono-pretty text-2xl text-amber-100">+{profBonus(level)}</div>
            <div className="text-[10px] text-amber-300/50">salv: {cd.saves.join(', ').toUpperCase()}</div>
          </div>
        </div>

        {/* PERÍCIAS */}
        <div className="flex items-center justify-between mt-6 mb-2">
          <h2 className="font-display text-lg text-amber-200 tracking-wide">PERÍCIAS</h2>
          <span className={`font-mono-pretty text-sm ${skillsOk ? 'text-emerald-400/80' : 'text-amber-300/80'}`}>{skills.length}/{skillLimit}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {skillOptions.map(sk => {
            const sel = skills.includes(sk);
            const dis = !sel && skills.length >= skillLimit;
            return (
              <button key={sk} onClick={() => toggle(skills, setSkills, sk, skillLimit)} disabled={dis}
                className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left font-body text-sm transition-all ${sel ? 'bg-amber-900/40 border-amber-600/60 text-amber-100' : dis ? 'border-amber-900/20 text-stone-600 cursor-not-allowed' : 'border-amber-900/30 text-amber-200/70 hover:border-amber-700/50'}`}>
                <span className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${sel ? 'bg-amber-400 border-amber-300' : 'border-amber-700/50'}`}></span>
                <span className="truncate">{sk} <span className="text-[10px] text-amber-400/40">{SKILL_ABILITY[sk].toUpperCase()}</span></span>
              </button>
            );
          })}
        </div>

        {/* MAGIAS */}
        {isCaster && (
          <>
            {cantripLimit > 0 && (
              <>
                <div className="flex items-center justify-between mt-6 mb-2">
                  <h2 className="font-display text-lg text-amber-200 tracking-wide">TRUQUES</h2>
                  <span className={`font-mono-pretty text-sm ${cantripsOk ? 'text-emerald-400/80' : 'text-amber-300/80'}`}>{cantrips.length}/{cantripLimit}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {spellInfo.cantrips.map(sp => (
                    <SpellChip key={sp} name={sp}
                      selected={cantrips.includes(sp)}
                      disabled={!cantrips.includes(sp) && cantrips.length >= cantripLimit}
                      onToggle={() => toggle(cantrips, setCantrips, sp, cantripLimit)} />
                  ))}
                </div>
              </>
            )}

            <div className="flex items-center justify-between mt-6 mb-1">
              <h2 className="font-display text-lg text-amber-200 tracking-wide">MAGIAS {cd.prepares ? 'PREPARADAS' : 'CONHECIDAS'}</h2>
              <span className={`font-mono-pretty text-sm ${spells.length === spellLimit ? 'text-emerald-400/80' : 'text-amber-300/80'}`}>{spells.length}/{spellLimit}</span>
            </div>
            <p className="font-body text-xs italic text-amber-300/50 mb-2">
              Escolha em qualquer combinação de níveis — você tem espaços até o {accessibleLevel}º nível de magia. Passe o mouse sobre uma magia para ver o que ela faz.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.keys(SCHOOL_COLOR).map(s => (
                <span key={s} className={`text-[9px] font-display tracking-wider px-1.5 py-0.5 rounded border ${SCHOOL_COLOR[s]}`}>{s}</span>
              ))}
            </div>

            {spellLevels.map(L => (
              <div key={L} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-display text-xs tracking-widest text-indigo-300/80 bg-indigo-950/40 border border-indigo-800/40 rounded px-2 py-0.5">{L}º NÍVEL</span>
                  <div className="flex-1 h-px bg-indigo-900/30"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {spellInfo[L].map(sp => (
                    <SpellChip key={sp} name={sp}
                      selected={spells.includes(sp)}
                      disabled={!spells.includes(sp) && spells.length >= spellLimit}
                      onToggle={() => toggle(spells, setSpells, sp, spellLimit)} />
                  ))}
                </div>
              </div>
            ))}

            {hasHigherLevels && (
              <p className="font-body text-xs italic text-amber-400/40 mb-2">
                Você acessa magias acima do 3º nível, mas a lista curada do protótipo vai até o 3º. Adicione-as manualmente no equipamento/anotações. (Na versão final, lista completa via SRD.)
              </p>
            )}
          </>
        )}
        {!isCaster && cd.casterNote && (
          <p className="mt-6 text-sm font-body italic text-amber-300/60">{cd.casterNote}</p>
        )}

        {/* EQUIPAMENTO */}
        <div className="mt-6">
          <Field label="Equipamento inicial (padrão da classe — edite à vontade)">
            <textarea value={equipment} onChange={e => setEquipment(e.target.value)} className="input min-h-[70px]" />
          </Field>
        </div>

        <div className="flex justify-end gap-3 mt-8 items-center">
          {!canSubmit && (
            <span className="font-body text-xs italic text-amber-300/50">
              {name.trim().length === 0 ? 'Dê um nome ao herói. ' : ''}
              {!skillsOk ? `Escolha ${skillLimit} perícias. ` : ''}
              {!cantripsOk ? `Escolha ${cantripLimit} truques.` : ''}
            </span>
          )}
          <button onClick={onCancel} className="font-display tracking-wider text-amber-300/70 hover:text-amber-200 px-4 py-2">CANCELAR</button>
          <button onClick={submit} disabled={!canSubmit}
            className="font-display tracking-widest text-amber-100 bg-amber-900/50 hover:bg-amber-800/60 disabled:opacity-30 disabled:cursor-not-allowed gold-border px-6 py-2 rounded">
            {initial ? 'SALVAR' : 'CRIAR PERSONAGEM'}
          </button>
        </div>

        <style>{`
          .input {
            width: 100%; background: rgba(26, 18, 8, 0.6);
            border: 1px solid rgba(212, 175, 122, 0.3); border-radius: 4px;
            padding: 0.5rem 0.75rem; color: #fbeed0;
            font-family: 'EB Garamond', serif; outline: none; transition: border-color 0.2s;
          }
          .input:focus { border-color: rgba(212, 175, 122, 0.7); box-shadow: 0 0 10px rgba(212, 175, 122, 0.2); }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-display text-xs text-amber-300/80 tracking-widest mb-1">{label}</label>
      {children}
    </div>
  );
}

// ---------- CHARACTER SHEET (resultado do guia) ----------
function SheetStat({ icon, label, value }) {
  return (
    <div className="panel-bg gold-border rounded-lg p-3 text-center">
      <div className="font-display text-[10px] text-amber-400/70 tracking-widest flex items-center justify-center gap-1">{icon}{label}</div>
      <div className="font-mono-pretty text-2xl text-amber-100 mt-1">{value}</div>
    </div>
  );
}

function CharacterSheet({ character, onEdit, onOpenProgression, onNew }) {
  const skills = character.skills ? character.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const spells = character.spells ? character.spells.split(',').map(s => s.trim()).filter(Boolean) : [];
  const abilities = [
    ['FOR', character.str], ['DES', character.dex], ['CON', character.con],
    ['INT', character.int], ['SAB', character.wis], ['CAR', character.cha],
  ];

  return (
    <div className="min-h-screen parchment-bg p-4 sm:p-6">
      <FontLoader />
      <div className="max-w-4xl mx-auto">
        {/* Barra superior */}
        <div className="flex items-center justify-between mb-4 panel-bg gold-border rounded-lg px-5 py-3">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-500/80" />
            <h1 className="font-display text-lg sm:text-xl text-amber-100 tracking-widest">FICHA DO HERÓI</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onOpenProgression} className="text-xs font-display tracking-wider text-indigo-200/80 hover:text-indigo-100 flex items-center gap-1.5 px-3 py-1 border border-indigo-800/50 rounded">
              <Sparkles className="w-3.5 h-3.5" />TRILHA
            </button>
            <button onClick={onEdit} className="text-xs font-display tracking-wider text-amber-300/70 hover:text-amber-200 flex items-center gap-1.5 px-3 py-1 border border-amber-900/40 rounded">
              <Edit3 className="w-3.5 h-3.5" />EDITAR
            </button>
          </div>
        </div>

        {/* Identidade */}
        <div className="panel-bg gold-border rounded-lg p-6 mb-4 font-body">
          <h2 className="font-display text-3xl text-amber-100 tracking-wide">{character.name}</h2>
          <p className="text-amber-300/70 italic mt-1">{character.race} • {character.charClass} • nível {character.level}{character.background ? ` • ${character.background}` : ''}</p>
          {character.motivation && <p className="text-amber-200/70 italic mt-3">"{character.motivation}"</p>}
        </div>

        {/* Derivados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <SheetStat icon={<Heart className="w-3.5 h-3.5" />} label="HP MÁXIMO" value={character.maxHp} />
          <SheetStat icon={<Shield className="w-3.5 h-3.5" />} label="CA" value={character.ac} />
          <SheetStat label="PROFICIÊNCIA" value={`+${profBonus(character.level)}`} />
          <SheetStat label="NÍVEL" value={character.level} />
        </div>

        {/* Atributos */}
        <div className="panel-bg gold-border rounded-lg p-5 mb-4">
          <h3 className="font-display text-sm tracking-widest text-amber-200 mb-3">ATRIBUTOS</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {abilities.map(([l, v]) => (
              <div key={l} className="bg-stone-900/40 border border-amber-900/30 rounded p-2 text-center">
                <div className="font-display text-[10px] text-amber-400/70 tracking-wider">{l}</div>
                <div className="font-mono-pretty text-xl text-amber-100">{v}</div>
                <div className="font-mono-pretty text-xs text-amber-300/60">{mod(v)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Perícias */}
        <div className="panel-bg gold-border rounded-lg p-5 mb-4">
          <h3 className="font-display text-sm tracking-widest text-amber-200 mb-3">PERÍCIAS</h3>
          {skills.length ? (
            <div className="flex flex-wrap gap-2">
              {skills.map(sk => {
                const ab = SKILL_ABILITY[sk];
                return (
                  <span key={sk} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-amber-900/30 bg-stone-900/40 text-amber-100/90 font-body text-sm">
                    {sk}{ab && <span className="text-[10px] text-amber-400/50">{ab.toUpperCase()}</span>}
                  </span>
                );
              })}
            </div>
          ) : <p className="font-body text-sm italic text-amber-300/50">Nenhuma perícia registrada.</p>}
        </div>

        {/* Magias */}
        {spells.length > 0 && (
          <div className="panel-bg gold-border rounded-lg p-5 mb-4">
            <h3 className="font-display text-sm tracking-widest text-amber-200 mb-3">MAGIAS</h3>
            <div className="flex flex-wrap gap-2">
              {spells.map((sp, i) => <SpellTag key={i} raw={sp} />)}
            </div>
          </div>
        )}

        {/* Equipamento */}
        <div className="panel-bg gold-border rounded-lg p-5 mb-4">
          <h3 className="font-display text-sm tracking-widest text-amber-200 mb-3">EQUIPAMENTO</h3>
          <p className="font-body text-amber-100/85 whitespace-pre-line leading-relaxed">{character.equipment || '—'}</p>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap justify-center gap-3 py-4">
          <button onClick={onEdit} className="font-display tracking-widest text-amber-100 bg-amber-900/40 hover:bg-amber-800/50 gold-border gold-border-hover px-6 py-2.5 rounded flex items-center gap-2">
            <Edit3 className="w-4 h-4" />EDITAR FICHA
          </button>
          <button onClick={onOpenProgression} className="font-display tracking-widest text-indigo-100 bg-indigo-900/30 hover:bg-indigo-800/40 border border-indigo-700/50 px-6 py-2.5 rounded flex items-center gap-2">
            <Sparkles className="w-4 h-4" />VER TRILHA
          </button>
          <button onClick={onNew} className="font-display tracking-widest text-red-300/80 hover:text-red-200 border border-red-900/40 px-6 py-2.5 rounded flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />NOVO HERÓI
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MAIN APP
// =====================================================================

function ApiBanner({ msg, onClose }) {
  return (
    <div className="fixed top-0 inset-x-0 z-[60] flex justify-center p-2 pointer-events-none">
      <div className="panel-bg border border-red-700/50 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg pointer-events-auto">
        <span className="font-body text-sm text-red-200">{msg}</span>
        <button onClick={onClose} className="text-red-300/70 hover:text-red-100"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function SavingOverlay() {
  return (
    <div className="fixed inset-0 z-[55] bg-black/40 flex items-center justify-center pointer-events-none">
      <div className="panel-bg gold-border rounded-lg px-5 py-3 font-display tracking-widest text-amber-200 flicker">SALVANDO…</div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('loading');
  const [character, setCharacter] = useState(null);
  const [editingChar, setEditingChar] = useState(false);
  const [showProgression, setShowProgression] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Carrega o personagem do gateway
  useEffect(() => {
    (async () => {
      try {
        const saved = await apiLoadCharacter();
        if (saved) { setCharacter(saved); setView('sheet'); }
        else setView('welcome');
      } catch (e) {
        console.error(e);
        setApiError('Não foi possível conectar à API. Verifique se o gateway está no ar.');
        setView('welcome');
      }
    })();
  }, []);

  const handleCreate = async (newChar) => {
    setSaving(true); setApiError(null);
    try {
      const created = await apiCreateCharacter(newChar);
      setCharacter(created); setView('sheet');
    } catch (e) {
      console.error(e); setApiError('Falha ao criar o personagem na API.');
    } finally { setSaving(false); }
  };

  const handleSaveEdit = async (newChar) => {
    setSaving(true); setApiError(null);
    try {
      const updated = character && character.id
        ? await apiUpdateCharacter(character.id, newChar)
        : await apiCreateCharacter(newChar);
      setCharacter(updated); setEditingChar(false); setView('sheet');
    } catch (e) {
      console.error(e); setApiError('Falha ao salvar as alterações na API.');
    } finally { setSaving(false); }
  };

  const confirmNew = async () => {
    setApiError(null);
    try { if (character && character.id) await apiDeleteCharacter(character.id); }
    catch (e) { console.error(e); }
    setCharacter(null); setShowNewConfirm(false); setView('welcome');
  };

  if (view === 'loading') {
    return <div className="min-h-screen parchment-bg flex items-center justify-center"><FontLoader /><div className="font-display text-amber-300 tracking-widest flicker">CARREGANDO…</div></div>;
  }

  if (view === 'welcome') {
    return (
      <>
        {apiError && <ApiBanner msg={apiError} onClose={() => setApiError(null)} />}
        <WelcomeScreen onNew={() => setView('create')} onExplore={() => setShowProgression(true)} />
        {showProgression && (
          <ProgressionView initialClass="Monge" currentLevel={null} onClose={() => setShowProgression(false)} />
        )}
      </>
    );
  }

  if (view === 'create') {
    return (
      <>
        {apiError && <ApiBanner msg={apiError} onClose={() => setApiError(null)} />}
        {saving && <SavingOverlay />}
        <CharacterCreation onCreate={handleCreate} onCancel={() => setView(character ? 'sheet' : 'welcome')} />
      </>
    );
  }

  if (editingChar) {
    return (
      <>
        {apiError && <ApiBanner msg={apiError} onClose={() => setApiError(null)} />}
        {saving && <SavingOverlay />}
        <CharacterCreation onCreate={handleSaveEdit} onCancel={() => setEditingChar(false)} initial={character} />
      </>
    );
  }

  return (
    <>
      {apiError && <ApiBanner msg={apiError} onClose={() => setApiError(null)} />}
      <CharacterSheet
        character={character}
        onEdit={() => setEditingChar(true)}
        onOpenProgression={() => setShowProgression(true)}
        onNew={() => setShowNewConfirm(true)}
      />
      {showProgression && (
        <ProgressionView initialClass={character.charClass} currentLevel={character.level} onClose={() => setShowProgression(false)} />
      )}
      {showNewConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <FontLoader />
          <div className="panel-bg gold-border rounded-lg max-w-md w-full p-6 text-center">
            <h2 className="font-display text-xl text-amber-100 tracking-wider mb-3">NOVO HERÓI</h2>
            <p className="font-body text-amber-100/80 mb-1">Isto vai apagar o personagem atual.</p>
            <p className="font-body text-red-300/80 italic text-sm mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowNewConfirm(false)}
                className="font-display tracking-wider text-amber-300/80 hover:text-amber-200 px-5 py-2 border border-amber-900/40 rounded">
                CANCELAR
              </button>
              <button onClick={confirmNew}
                className="font-display tracking-widest text-red-100 bg-red-900/50 hover:bg-red-800/60 border border-red-700/50 px-5 py-2 rounded">
                APAGAR E RECOMEÇAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
