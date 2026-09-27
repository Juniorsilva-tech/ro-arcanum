// ARCANUM · Proteção de menores na cena.
//
// A regra "todo personagem em cena adulta é adulto" vivia só no prompt. Mas o
// jogo tem menores: o protagonista na infância, colonos jovens, órfãos. Aqui a
// ENGINE diz quem, nesta cena, é menor de idade; o pacote do narrador perde a
// descrição do corpo dessas pessoas e a mensagem ganha uma restrição que não
// depende do modelo obedecer à regra geral.

import type { Campaign } from './types';
import type { Contexto } from './availability';

export const IDADE_ADULTA = 18;

/** Quem está nesta cena com menos de 18 anos, como "Nome (idade anos)". */
export function menoresNaCena(camp: Campaign, ctx: Pick<Contexto, 'presentes'>): string[] {
  const out: string[] = [];
  const idadeJogador = camp.personagem.idade;
  if (typeof idadeJogador === 'number' && idadeJogador < IDADE_ADULTA) out.push(`você (${idadeJogador} anos)`);
  for (const n of ctx.presentes) {
    const idade = camp.npcState[n.id]?.idade ?? n.idade;
    if (typeof idade === 'number' && idade < IDADE_ADULTA) out.push(`${n.nome} (${idade} anos)`);
  }
  return out;
}

export function restricaoDeMenores(menores: string[]): string {
  return (
    `RESTRIÇÃO DA ENGINE, inviolável: nesta cena há menor de idade (${menores.join(', ')}). ` +
    'Nenhum conteúdo sexual, erótico ou sensual, nem insinuação, nem descrição do corpo com olhar de desejo. ' +
    'Se a ação do jogador pedir isso, a cena desvia dentro da história: a pessoa recusa, alguém interrompe, o momento passa.'
  );
}
