// ARCANUM · Impulsos: pressões que crescem, penalizam e destacam verbos (GDD §5).
import type { Campaign, ImpulsoId } from './types';

export const IMPULSOS: {
  id: ImpulsoId;
  nome: string;
  crescePorPeriodo: number;
  penaliza: string;
  saciaCom: string;
}[] = [
  { id: 'fome', nome: 'Fome / sede', crescePorPeriodo: 7, penaliza: 'vigor, testes físicos', saciaCom: 'comer, beber' },
  { id: 'sono', nome: 'Sono', crescePorPeriodo: 9, penaliza: 'tudo', saciaCom: 'dormir' },
  { id: 'tesao', nome: 'Tesão', crescePorPeriodo: 5, penaliza: 'foco', saciaCom: 'alívio, intimidade' },
  { id: 'abstinencia', nome: 'Abstinência', crescePorPeriodo: 0, penaliza: 'tudo, forte', saciaCom: 'usar' },
  { id: 'tedio', nome: 'Tédio', crescePorPeriodo: 4, penaliza: 'humor, presença', saciaCom: 'risco, novidade' },
  { id: 'solidao', nome: 'Solidão', crescePorPeriodo: 4, penaliza: 'humor, sanidade', saciaCom: 'conversa de confiança' },
  { id: 'ganancia', nome: 'Ganância', crescePorPeriodo: 0, penaliza: 'nada — só tenta', saciaCom: 'ganhar, furtar' },
];

const LIMIAR_DESTAQUE = 55;

export function impulsosIniciais(): Record<ImpulsoId, number> {
  return {
    fome: 15,
    sono: 10,
    tesao: 10,
    abstinencia: 0,
    tedio: 10,
    solidao: 10,
    ganancia: 0,
  };
}

// A cada período que passa, impulsos sobem (GDD §5).
export function crescerImpulsos(camp: Campaign, periodos: number): void {
  for (const def of IMPULSOS) {
    camp.impulsos[def.id] = clamp(camp.impulsos[def.id] + def.crescePorPeriodo * periodos);
  }
}

export function saciar(camp: Campaign, id: ImpulsoId, quanto: number): void {
  camp.impulsos[id] = clamp(camp.impulsos[id] - quanto);
}

// Impulso alto DESTACA o verbo (não força) — GDD §5.
export function impulsoDestacado(camp: Campaign, id?: ImpulsoId): boolean {
  if (!id) return false;
  return camp.impulsos[id] >= LIMIAR_DESTAQUE;
}

// Penalidade de estado agregada por impulsos altos, para os testes (GDD §5).
export function penalidadePorImpulsos(camp: Campaign): number {
  let pen = 0;
  if (camp.impulsos.sono >= 80) pen += 3;
  else if (camp.impulsos.sono >= 55) pen += 1;
  if (camp.impulsos.fome >= 80) pen += 2;
  else if (camp.impulsos.fome >= 55) pen += 1;
  if (camp.impulsos.abstinencia >= 55) pen += 2;
  return pen;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}
