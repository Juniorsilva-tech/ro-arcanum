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
import { registrarSaidaNarrativa } from './contextoNarrativo';

const PERIODOS_DE_RISCO = new Set<Periodo>(['anoitecer', 'noite', 'madrugada']);

// Só regula o acaso. Caçadas escolhidas e perseguições já causadas continuam reais.
export function presencaOniCasual(camp: Campaign): number {
  const investigando = camp.vivo?.missoes.some(q => q.tipo === 'investigar' && q.estado === 'aceita' && q.local === camp.localAtual);
  if (investigando) return .65;
  const crise = camp.continuidade?.ameacas.some(a => a.local === camp.localAtual && a.estado === 'ativa');
  if (crise) return .45;
  const ultimo = camp.flags['narrativa.ultimoOniCasual'];
  if (typeof ultimo === 'number' && camp.calendario.dia < ultimo + 3) return 0;
  return .08;
}

export function rolarEncontroContextual(content: ContentBundle, camp: Campaign, periodo: Periodo, perigo: number, pool: string[]): string[] | null {
  const elegiveis = encontrosElegiveis(content, camp, pool);
  const comuns = elegiveis.filter(id => !content.criaturas.find(c => c.id === id)?.oni);
  const temOni = comuns.length !== elegiveis.length;
  const chance = temOni ? presencaOniCasual(camp) : 0;
  const permitir = temOni && chance > 0 && nextFloat(camp.rng) < chance;
  const encontro = rolarEncontroDeViagem(camp, periodo, perigo, permitir ? elegiveis : comuns);
  if (encontro?.some(id => content.criaturas.find(c => c.id === id)?.oni)) {
    camp.flags['narrativa.ultimoOniCasual'] = camp.calendario.dia;
  }
  return encontro;
}

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

  registrarSaidaNarrativa(camp);
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
    rolarEncontroContextual(content, camp, periodoAtual(camp.calendario), rota.perigo, pool);

  if (encontro) iniciarCombate(content, camp, encontro);
  return { ok: true, destino: alvo, primeiraVez, encontro: encontro ?? undefined };
}
