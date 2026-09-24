// ARCANUM · A estação no mundo (sessão 51, Fase 5).
//
// Até aqui a estação mudava o clima e a lavoura (cidades.ts: fertilidade 0,8
// no inverno) e só. O encontro de viagem sorteava uma criatura qualquer do
// lugar e, em 20% das vezes, uma segunda — inclusive contra personagem de
// nível 1. Agora:
//
// - cada fera declara no bestiário o peso dela por estação (lobo com fome no
//   inverno, urso hibernando, corvo migrando no outono). O peso escolhe QUEM
//   aparece e mexe na CHANCE de aparecer: um pool cheio de bicho de verão fica
//   mais calmo no inverno;
// - fera que anda em grupo (`bando`) vem em grupo, com o mesmo teto por nível
//   dos bandos de salteadores (engine/bandos.ts): nível 1 nunca enfrenta mais
//   de um inimigo em encontro aleatório;
// - inverno rigoroso: de vez em quando, no inverno, a neve fecha os passos e
//   as colinas — as rotas que tocam esses lugares ficam bem mais perigosas por
//   alguns dias, com fato público no começo e no fim.
import type { Campaign, ContentBundle, Criatura, Local } from './types';
import type { Estacao } from './time';
import { createRng, nextFloat, nextInt, seedFromString, type RngState } from './rng';
import { registrarFato } from './historiaViva';

/** Peso de uma criatura na estação (1 se ela não declarar). */
export function pesoNaEstacao(c: Criatura | undefined, estacao: Estacao): number {
  return c?.estacoes?.[estacao] ?? 1;
}

/**
 * Quanto a estação mexe na chance de haver encontro: a média dos pesos do
 * pool, dentro de [0,6; 1,5]. Pool sem nenhuma fera marcada fica em 1.
 */
export function fatorDaEstacao(content: ContentBundle, pool: string[], estacao: Estacao): number {
  if (!pool.length) return 1;
  const pesos = pool.map(id => pesoNaEstacao(content.criaturas.find(c => c.id === id), estacao));
  const media = pesos.reduce((a, b) => a + b, 0) / pesos.length;
  return Math.max(0.6, Math.min(1.5, media));
}

/** Sorteio ponderado pelo peso da estação. Peso 0 não sai. */
export function sortearNaEstacao(rng: RngState, content: ContentBundle, pool: string[], estacao: Estacao): string | undefined {
  const pesos = pool.map(id => Math.max(0, pesoNaEstacao(content.criaturas.find(c => c.id === id), estacao)));
  const total = pesos.reduce((a, b) => a + b, 0);
  if (total <= 0) return undefined;
  let r = nextFloat(rng) * total;
  for (let i = 0; i < pool.length; i++) {
    r -= pesos[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** Teto de inimigos por nível: o mesmo de tamanhoDoGrupo em bandos.ts. */
export function tetoDeGrupo(nivelJogador: number): number {
  return Math.max(1, Math.min(4, 1 + Math.floor(nivelJogador / 3)));
}

/** Quantos vêm de uma fera que anda em grupo, já com o teto do nível. */
export function tamanhoDaMatilha(rng: RngState, c: Criatura | undefined, nivelJogador: number): number {
  if (!c?.bando) return 1;
  const querem = nextInt(rng, c.bando.min, c.bando.max);
  return Math.max(1, Math.min(querem, tetoDeGrupo(nivelJogador)));
}

// ── Inverno rigoroso ──────────────────────────────────────────────────────

export const CHANCE_INVERNO_RIGOROSO = 1 / 40;
export const PERIGO_INVERNO_RIGOROSO = 3;
const TIPOS_DE_MONTANHA = new Set(['passo', 'colina']);

export function invernoRigorosoAtivo(camp: Campaign): boolean {
  const i = camp.mundo?.invernoRigoroso;
  return !!i && camp.calendario.dia < i.ate;
}

/** Perigo extra de uma rota que toca passo ou colina durante o inverno rigoroso. */
export function perigoDoInverno(content: ContentBundle, camp: Campaign, origem: string, destino: string): number {
  if (!invernoRigorosoAtivo(camp)) return 0;
  const toca = [origem, destino].some(id => TIPOS_DE_MONTANHA.has(content.locais.find(l => l.id === id)?.tipo ?? ''));
  return toca ? PERIGO_INVERNO_RIGOROSO : 0;
}

/**
 * Passe diário, chamado em avancarMundo. RNG derivado (semente + dia), para
 * não mexer na sequência do RNG principal.
 */
export function processarEstacoes(content: ContentBundle, camp: Campaign): void {
  const m = camp.mundo;
  if (!m) return;
  const dia = camp.calendario.dia;
  const montanhas = content.locais.filter((l: Local) => TIPOS_DE_MONTANHA.has(l.tipo));
  if (!montanhas.length) return;
  const i = m.invernoRigoroso;
  if (i && dia >= i.ate && !i.anunciouFim) {
    i.anunciouFim = true;
    if (camp.vivo) registrarFato(camp, {
      tipo: 'degelo', local: montanhas[0].id, publico: true, atores: [],
      texto: 'A neve cedeu nos passos. Os caminhos de montanha voltaram a ser só perigosos, não mortais.',
    });
  }
  if (camp.calendario.estacao !== 'inverno' || invernoRigorosoAtivo(camp)) return;
  const rng = createRng((camp.rng.seed ^ seedFromString(`inverno:${dia}`)) >>> 0);
  if (nextFloat(rng) >= CHANCE_INVERNO_RIGOROSO) return;
  const dias = nextInt(rng, 4, 8);
  m.invernoRigoroso = { desde: dia, ate: dia + dias };
  if (camp.vivo) registrarFato(camp, {
    tipo: 'inverno_rigoroso', local: montanhas[0].id, publico: true, atores: [],
    texto: `Nevasca nos passos e nas colinas: ${montanhas.map(l => l.nome).slice(0, 3).join(', ')} e os caminhos até eles ficam traiçoeiros por ${dias} dias.`,
  });
}
