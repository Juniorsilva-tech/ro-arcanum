// ARCANUM · A trama principal, ato por ato (docs/BIBLIA-DA-HISTORIA.md).
//
// Cada ato mora no seu módulo (engine/atoI.ts, engine/atoII.ts). Este arquivo
// só junta os atos para quem está de fora: o dia do mundo, a tela de jogo e o
// narrador. Os ids que saem daqui levam o ato na frente ("I:levar",
// "II:carta") para a tela não precisar saber de qual ato veio cada coisa.
import type { Campaign, ContentBundle } from './types';
import { processarDiaAtoI, avisosAtoI, marcarAvisoAtoI, acoesAtoI, executarAcaoAtoI, objetivoAtoI, contextoAtoI, type AcaoAtoI } from './atoI';
import { processarDiaAtoII, avisosAtoII, marcarAvisoAtoII, acoesAtoII, executarAcaoAtoII, objetivoAtoII, contextoAtoII } from './atoII';

export type AvisoTrama = { id: string; titulo: string; texto: string };
export type AcaoTrama = { id: string; rotulo: string; descricao: string; titulo: string; destaque?: boolean };

/** Roda uma vez por dia, dentro do dia do mundo (engine/mundo.ts). */
export function processarDiaTrama(content: ContentBundle, camp: Campaign): void {
  processarDiaAtoI(content, camp);
  processarDiaAtoII(content, camp);
}

export function avisosDaTrama(content: ContentBundle, camp: Campaign): AvisoTrama[] {
  return [
    ...avisosAtoI(content, camp).map(a => ({ ...a, id: `I:${a.id}` })),
    ...avisosAtoII(content, camp).map(a => ({ ...a, id: `II:${a.id}` })),
  ];
}

export function marcarAvisoTrama(content: ContentBundle, camp: Campaign, id: string): void {
  const [ato, resto] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
  if (ato === 'I') marcarAvisoAtoI(camp, resto as 'abertura' | 'desfecho');
  else if (ato === 'II') marcarAvisoAtoII(content, camp, resto);
}

export function acoesDaTrama(content: ContentBundle, camp: Campaign): AcaoTrama[] {
  const tituloI = content.atoI?.titulo ?? '', tituloII = content.atoII?.titulo ?? '';
  return [
    ...acoesAtoI(content, camp).map(a => ({ ...a, id: `I:${a.id}`, titulo: tituloI, destaque: a.id === 'levar' || a.id === 'toca' })),
    ...acoesAtoII(content, camp).map(a => ({ ...a, id: `II:${a.id}`, titulo: tituloII, destaque: a.id.startsWith('aliar_') })),
  ];
}

export function executarAcaoTrama(content: ContentBundle, camp: Campaign, id: string): { ok: boolean; mensagem: string } {
  const [ato, resto] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
  if (ato === 'I') return executarAcaoAtoI(content, camp, resto as AcaoAtoI['id']);
  if (ato === 'II') return executarAcaoAtoII(content, camp, resto);
  return { ok: false, mensagem: 'Não há nada aberto.' };
}

/** Linhas para o "o que está aberto", ato mais antigo primeiro. */
export function objetivosDaTrama(content: ContentBundle, camp: Campaign): string[] {
  return [objetivoAtoI(content, camp), objetivoAtoII(content, camp)].filter((x): x is string => !!x);
}

/** O bloco "trama" do pacote do narrador. */
export function contextoDaTrama(content: ContentBundle, camp: Campaign) {
  const atoI = contextoAtoI(content, camp), atoII = contextoAtoII(content, camp);
  if (!atoI && !atoII) return undefined;
  return { ato: camp.trama?.ato, ...(atoI ? { atoI } : {}), ...(atoII ? { atoII } : {}) };
}
