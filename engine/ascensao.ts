// ARCANUM · Ascensão — o fim de linha da progressão de poder, além do
// Despertar (engine/progresso.ts). Vem do documento "Sistema de Ascensão
// Divina e Poder Mitopoético" (inspirado em Talos/CHIM de The Elder
// Scrolls — mais um IP externo empilhado sobre Demon Slayer, mesma
// ressalva de uso pessoal já combinada com ele).
//
// O documento original pedia contagem de devotos e uma fórmula de buff
// mitopoético logarítmica sobre esse número — mas o jogo não simula
// população nenhuma, então "quantidade de fiéis" seria inventado do nada,
// sem nada real por trás. Esta versão troca "devotos" por três pilares
// REAIS, cada um já rastreável em algum lugar do jogo:
//   1) Nível alto — a régua de poder que já existe (engine/progresso.ts).
//   2) Idade avançada — o jogador agora envelhece de verdade (ver
//      processarEnvelhecimentoJogador), do mesmo jeito que as NPCs já
//      envelhecem (engine/vidanpc.ts) — sem isso, "imunidade à morte por
//      velhice" seria uma flag que não anula nada.
//   3) Almas seladas — Luas Superiores (ou Muzan) vencidas em combate, ver
//      engine/combat.ts.
// A recompensa também é mecânica de verdade, não decoração: imunidade real
// à morte por velhice, e anulação real da penalidade de membro amputado
// (engine/combat.ts). Fora do escopo, por não terem nada real por trás
// ainda: contagem de devotos, Muzan caçando o jogador ativamente.
import type { Campaign } from './types';
import { nextFloat } from './rng';
import { registrarMarco } from './memoria';
import { sincronizarIdadeFamilia } from './familia';
import { cobrarTributoAnual, estadoMarca } from './marca';

export const DIAS_POR_ANO_JOGADOR = 365;
export const IDADE_MORTE_MIN_JOGADOR = 65;
const IDADE_MORTE_CHANCE_MAX_JOGADOR = 0.35;

export const NIVEL_MINIMO_ASCENSAO = 15;
export const IDADE_MINIMA_ASCENSAO = 60;
export const ALMAS_MINIMAS_ASCENSAO = 3;

// Idade efetiva do jogador — saves de antes desse campo existir caem no
// padrão de 20 (normalizarCampanha também preenche isso, ver migracao.ts).
export function idadeJogador(camp: Campaign): number {
  return camp.personagem.idade ?? 20;
}

export function chimAlcancado(camp: Campaign): boolean {
  return !!camp.ascensao?.chim;
}

// Chamada uma vez por ano de calendário virado, no mesmo gatilho que já
// envelhece as NPCs (ver mundo.ts) — o jogador envelhece junto com o resto
// do vale. Sem Ascensão, corre o mesmo risco real de morte por velhice que
// qualquer NPC corre (ver vidanpc.ts): a idade sobe até pesar de verdade.
export function processarEnvelhecimentoJogador(camp: Campaign): void {
  const p = camp.personagem;
  estadoMarca(camp); // prazo de save antigo conta da idade de antes do aniversário
  p.idade = idadeJogador(camp) + 1;
  sincronizarIdadeFamilia(camp);
  if (chimAlcancado(camp)) return; // imortalidade biológica de verdade — o corpo parou de contar

  // Consequência biológica da Marca do Caçador (engine/marca.ts): a partir
  // da idade-limite avisada no despertar, o corpo perde vida máxima a cada
  // ano e pode parar de vez. Contida, ela não cobra mais.
  if (cobrarTributoAnual(camp)) return;

  if (p.idade < IDADE_MORTE_MIN_JOGADOR) return;
  const chance = Math.min(IDADE_MORTE_CHANCE_MAX_JOGADOR, (p.idade - IDADE_MORTE_MIN_JOGADOR) * 0.02);
  if (nextFloat(camp.rng) < chance) {
    p.recursos.vida = 0;
    registrarMarco(camp, `dia ${camp.calendario.dia}: aos ${p.idade} anos, o corpo finalmente parou.`);
  }
}

export type CondicoesAscensao = {
  nivel: boolean;
  idade: boolean;
  almas: boolean;
  completo: boolean;
};

export function condicoesDeAscensao(camp: Campaign): CondicoesAscensao {
  const nivel = camp.personagem.nivel >= NIVEL_MINIMO_ASCENSAO;
  const idade = idadeJogador(camp) >= IDADE_MINIMA_ASCENSAO;
  const almas = (camp.almasSeladas?.length ?? 0) >= ALMAS_MINIMAS_ASCENSAO;
  return { nivel, idade, almas, completo: nivel && idade && almas };
}

// Chamada quando uma Lua Superior (ou Muzan) cai em combate (nível 10+ —
// ver engine/combat.ts). Selar não exige um verbo/ação separada: a vitória
// em si já é rara e cara o bastante, e um verbo novo só pra incrementar um
// contador seria cerimônia sem substância.
export function selarAlma(camp: Campaign, nomeCriatura: string): void {
  const lista = camp.almasSeladas ?? (camp.almasSeladas = []);
  if (lista.includes(nomeCriatura)) return;
  lista.push(nomeCriatura);
  registrarMarco(camp, `a alma de ${nomeCriatura} está selada — mais um pilar da Ascensão cumprido.`);
}

// Tentativa deliberada do jogador (chamada por uma ação da UI, não
// automaticamente) — só funciona quando os três pilares já estão cumpridos.
export function tentarAscender(camp: Campaign): { ok: boolean; motivo?: string } {
  if (chimAlcancado(camp)) return { ok: false, motivo: 'você já alcançou o CHIM — não há mais o que ascender' };
  const cond = condicoesDeAscensao(camp);
  if (!cond.completo) {
    const faltando: string[] = [];
    if (!cond.nivel) faltando.push(`nível ${NIVEL_MINIMO_ASCENSAO}+`);
    if (!cond.idade) faltando.push(`${IDADE_MINIMA_ASCENSAO}+ anos`);
    if (!cond.almas) faltando.push(`${ALMAS_MINIMAS_ASCENSAO} almas seladas`);
    return { ok: false, motivo: `ainda falta: ${faltando.join(', ')}` };
  }
  camp.ascensao = { chim: true, dia: camp.calendario.dia };
  registrarMarco(
    camp,
    `dia ${camp.calendario.dia}: você rompeu a barreira — o CHIM despertou, e o corpo parou de contar os anos.`,
  );
  return { ok: true };
}
