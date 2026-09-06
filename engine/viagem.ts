// ARCANUM · Encontros de viagem: risco real ao se mover entre locais.
// Puxa do "perigo" que a rota já declara em content/vaelhorn/locations.ts e
// do período do dia — sem grafo de waypoints novo, sem hora de relógio de
// parede, sem Math.random(). Tudo em cima do RNG determinístico da
// campanha, então é reproduzível como qualquer outro sorteio do jogo.
import type { Campaign } from './types';
import { nextFloat, pick } from './rng';
import type { Periodo } from './time';

const PERIODOS_DE_RISCO = new Set<Periodo>(['anoitecer', 'noite', 'madrugada']);

// Retorna os ids das criaturas do encontro, ou null se a viagem correu em paz.
// `pool` é o elenco possível para o tipo de local de destino (ver
// content/vaelhorn/bestiary.ts, encontrosPorTipo) — a engine não conhece
// bestiário, só resolve o sorteio.
export function rolarEncontroDeViagem(
  camp: Campaign,
  periodo: Periodo,
  perigoRota: number,
  pool: string[],
): string[] | null {
  if (pool.length === 0) return null;
  const noturno = PERIODOS_DE_RISCO.has(periodo);
  const chance = Math.min(0.5, 0.05 + perigoRota * 0.04 + (noturno ? 0.12 : 0));
  if (nextFloat(camp.rng) >= chance) return null;

  const ids = [pick(camp.rng, pool)];
  // Emboscada rara em dupla — chance pequena, independente da chance de
  // encontro em si.
  if (nextFloat(camp.rng) < 0.2) ids.push(pick(camp.rng, pool));
  return ids;
}
