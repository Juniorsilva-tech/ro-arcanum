// ARCANUM · Quem sabe o nome do jogador.
//
// O narrador fazia uma estranha chamar o jogador pelo nome na primeira cena
// ("O que você trouxe, Kael…" de uma agiota que nunca o viu). A regra estava
// só no prompt, e o modelo a ignorava. Aqui a ENGINE guarda quem sabe:
// - a família sabe desde sempre;
// - quem convive com ele há uns dias sabe;
// - quem estava presente quando ele disse o próprio nome passa a saber.
// E a fala de quem NÃO sabe tem o nome trocado por um tratamento genérico,
// antes de chegar à tela.
import type { Campaign, NPC } from './types';
import { diasDeConvivio } from './memoria';

/** Dias de convivência a partir dos quais alguém já ouviu o nome dele. */
export const DIAS_PARA_SABER_O_NOME = 3;

export function sabeONome(camp: Campaign, npc: Pick<NPC, 'id' | 'parentesco'>): boolean {
  if (npc.parentesco || npc.id.startsWith('familia_')) return true;
  if (camp.sabemSeuNome?.includes(npc.id)) return true;
  return diasDeConvivio(camp, npc.id) >= DIAS_PARA_SABER_O_NOME;
}

function regexNome(nome: string): RegExp | null {
  const primeiro = nome.trim().split(/\s+/)[0];
  if (!primeiro || primeiro.length < 2) return null;
  const esc = primeiro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<!\\p{L})${esc}(?!\\p{L})`, 'u');
}

/** O jogador disse o próprio nome (na ação livre ou numa fala [você])? */
export function disseONome(texto: string, nomeJogador: string): boolean {
  const re = regexNome(nomeJogador);
  return !!re && re.test(texto);
}

/** Quem está presente passa a saber o nome. */
export function apresentar(camp: Campaign, presentes: Pick<NPC, 'id'>[]): void {
  const s = new Set(camp.sabemSeuNome ?? []);
  for (const n of presentes) s.add(n.id);
  camp.sabemSeuNome = [...s];
}

/**
 * Nas falas de quem não sabe o nome, troca o nome do jogador por
 * "forasteiro". Narração e falas [você] ficam como estão (o narrador usa o
 * nome em segunda pessoa de vez em quando; o problema é a boca de estranho).
 */
export function protegerNome(texto: string, nomeJogador: string, quemNaoSabe: string[]): string {
  const re = regexNome(nomeJogador);
  if (!re || !quemNaoSabe.length) return texto;
  const global = new RegExp(re.source, 'gu');
  const naoSabe = new Set(quemNaoSabe.map((n) => n.toLowerCase()));
  return texto
    .split('\n')
    .map((linha) => {
      const m = /^(\s*[—–-]\s*\[([^\]]+)\])(.*)$/.exec(linha);
      if (!m) return linha;
      const quem = m[2].trim().toLowerCase();
      const ehDeQuemNaoSabe = [...naoSabe].some((n) => n === quem || n.startsWith(`${quem},`) || n.split(',')[0] === quem);
      if (!ehDeQuemNaoSabe) return linha;
      return m[1] + m[3].replace(global, 'forasteiro');
    })
    .join('\n');
}
