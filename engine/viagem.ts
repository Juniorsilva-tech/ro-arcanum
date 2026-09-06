// ARCANUM · Encontros de viagem: risco real ao se mover entre locais.
// Puxa do "perigo" que a rota já declara em content/vaelhorn/locations.ts e
// do período do dia — sem grafo de waypoints novo, sem hora de relógio de
// parede, sem Math.random(). Tudo em cima do RNG determinístico da
// campanha, então é reproduzível como qualquer outro sorteio do jogo.
import type { Campaign, ContentBundle, Local } from './types';
import { nextFloat, pick } from './rng';
import { avancarPeriodos, periodoAtual, type Periodo } from './time';
import { crescerImpulsos } from './impulsos';
import { avancarMundo } from './mundo';
import { registrarMarco } from './memoria';
import { descobrirNoticias } from './historiaViva';
import { encontrosElegiveis } from './kimetsu';
import { emboscadaNemesis } from './nemesis';
import { iniciarCombate } from './combat';

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

// ── A viagem em si ────────────────────────────────────────────────────────
//
// Esta regra morava em ui/store.ts. Isso a deixava inalcançável para qualquer
// coisa que não fosse a tela: o simulador headless não conseguia andar pelo
// mapa, e um segundo cliente teria de reimplementar o custo de tempo, o tique
// do mundo, o primeiro pisar, a descoberta de notícias e o sorteio de
// encontro — cinco chances de divergir do jogo real. Agora a engine resolve a
// viagem inteira, inclusive abrir o combate, e a UI cuida só do que é tela:
// feed, narração e autosave.
export type ResultadoViagem = {
  ok: boolean;
  motivo?: string;
  destino?: Local;
  primeiraVez?: boolean;
  // Ids das criaturas do encontro. Quando presente, o combate JÁ FOI aberto —
  // quem chama só precisa levar o jogador para a tela de combate.
  encontro?: string[];
};

export function viajar(content: ContentBundle, camp: Campaign, destino: string): ResultadoViagem {
  if (camp.combate && !camp.combate.terminado) return { ok: false, motivo: 'termine o combate primeiro' };
  if (camp.personagem.condicoes.includes('cativo')) return { ok: false, motivo: 'recupere a liberdade antes de viajar' };
  const local = content.locais.find((l) => l.id === camp.localAtual);
  const rota = local?.rotas.find((r) => r.destino === destino);
  if (!rota) return { ok: false, motivo: 'não há rota daqui para lá' };

  if (rota.periodos > 0) {
    camp.calendario = avancarPeriodos(camp.calendario, rota.periodos);
    crescerImpulsos(camp, rota.periodos);
    camp.capitulo.periodosDecorridos += rota.periodos;
    avancarMundo(content, camp);
  }
  camp.localAtual = destino;
  const alvo = content.locais.find((l) => l.id === destino);
  const primeiraVez = !camp.locaisVisitados.includes(destino);
  if (primeiraVez) {
    camp.locaisVisitados.push(destino);
    registrarMarco(camp, `você pisou em ${alvo?.nome ?? destino} pela primeira vez`);
  }
  camp.flags[`visitou.${destino}`] = true;
  descobrirNoticias(content, camp);

  const pool = encontrosElegiveis(content, camp, content.encontrosPorTipo?.[alvo?.tipo ?? ''] ?? []);
  const encontro =
    emboscadaNemesis(content, camp) ??
    rolarEncontroDeViagem(camp, periodoAtual(camp.calendario), rota.perigo, pool);

  if (encontro) iniciarCombate(content, camp, encontro);
  return { ok: true, destino: alvo, primeiraVez, encontro: encontro ?? undefined };
}
