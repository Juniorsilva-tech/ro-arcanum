import type { Campaign } from './types';

// RPG adaptation for already-earned awakenings, not a Demon Slayer Mark.
// Birth potential alone never grants these multipliers. Known story milestones do.
export const LEGADOS = {
  venceu_oni_ancestral: { nome: 'Despertar ancestral', vida: 1.2, dano: 1.25, descricao: 'A sobrevivência à caçada ancestral fortaleceu seu corpo e sua execução.' },
  dominou_prova_eclipse: { nome: 'Legado do eclipse', vida: 1.1, dano: 1.15, descricao: 'Maestria elevada e a vitória na prova do eclipse consolidaram uma técnica própria.' },
} as const;

export function legadosConquistados(camp: Campaign) {
  return Object.entries(LEGADOS).filter(([id]) => camp.despertares?.includes(id)).map(([id, regra]) => ({ id, ...regra }));
}

export function multiplicadoresDeIdentidade(camp: Campaign): { vida: number; dano: number } {
  // Strongest benefit, not an unbounded product of collectible buffs.
  const lista = legadosConquistados(camp);
  return { vida: Math.max(1, ...lista.map(l => l.vida)), dano: Math.max(1, ...lista.map(l => l.dano)) };
}
