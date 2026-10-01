// ARCANUM · A arma que ganha nome pelo uso.
//
// A forja faz a arma; o uso faz a fama. Cada inimigo derrubado com uma arma
// conta para ela. Aos 10 abates ela é CONHECIDA (o vale fala dela e o dono
// ganha +5% de dano com ela, a mão já sabe o peso); aos 30, LENDÁRIA (+10%, o
// nome da arma entra nos marcos e nos boatos). A fama é da arma: vendida,
// roubada ou herdada, vai junto.
import type { Campaign, ContentBundle } from './types';
import { itemPorId } from './items';
import { registrarMarco } from './memoria';
import { registrarFato } from './historiaViva';

export const ABATES_CONHECIDA = 10;
export const ABATES_LENDARIA = 30;

export function famaDaArma(camp: Campaign, armaId: string | undefined): { abates: number; nivel: 'comum' | 'conhecida' | 'lendaria' } {
  return (armaId && camp.famaArmas?.[armaId]) || { abates: 0, nivel: 'comum' };
}

/** Multiplicador de dano que a fama da arma dá a quem a empunha. */
export function bonusDeFamaDaArma(camp: Campaign, armaId: string | undefined): number {
  const n = famaDaArma(camp, armaId).nivel;
  return n === 'lendaria' ? 1.1 : n === 'conhecida' ? 1.05 : 1;
}

/** Conta os abates de uma luta vencida para a arma que o jogador empunhava. */
export function registrarAbates(content: ContentBundle, camp: Campaign, abates: number): string | undefined {
  const armaId = camp.personagem.equipado.arma;
  if (!armaId || abates <= 0) return undefined;
  const f = ((camp.famaArmas ??= {})[armaId] ??= { abates: 0, nivel: 'comum' });
  const antes = f.nivel;
  f.abates += abates;
  f.nivel = f.abates >= ABATES_LENDARIA ? 'lendaria' : f.abates >= ABATES_CONHECIDA ? 'conhecida' : 'comum';
  if (f.nivel === antes) return undefined;
  const nome = itemPorId(content, armaId, camp.personagem)?.nome ?? 'a arma';
  const dono = camp.personagem.nome;
  const texto = f.nivel === 'lendaria'
    ? `${nome} de ${dono} já derrubou ${f.abates}. Virou lenda: quem ouve o nome da arma sabe de quem é.`
    : `${nome} de ${dono} já derrubou ${f.abates}. O vale começa a falar dela.`;
  registrarMarco(camp, texto);
  if (camp.vivo) registrarFato(camp, { tipo: 'arma_famosa', local: camp.localAtual, texto, atores: ['jogador'], publico: true });
  return texto;
}
