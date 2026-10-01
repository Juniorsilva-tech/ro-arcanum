import type { Campaign, ContentBundle, NPC } from './types';
import { createRng, nextFloat, seedFromString } from './rng';
import { maestriaPorEsforco, tetoConfortavel } from './aptidao';

export type ProgressaoNpc = {
  versao: 1;
  aptidao: number; // Internal learning potential, never included in public context.
  esforco: number;
  experiencia: number;
  sessoes: number;
};

function potencial(camp: Campaign, npc: NPC): number {
  const rng = createRng(seedFromString(`aptidao-npc:${camp.rng.seed}:${npc.id}`));
  const parente = camp.familia?.membros.find(m => m.id === npc.id);
  return parente?.prodigio ? 95 + Math.floor(nextFloat(rng) * 5) : 20 + Math.floor(nextFloat(rng) * 76);
}

export function inicializarProgressaoNpc(camp: Campaign, npc: NPC): ProgressaoNpc | undefined {
  const din = camp.npcState[npc.id];
  if (!din || !npc.combatente) return;
  // A saved veteran retains old skill gains, without retroactive XP or moving RNG.
  return din.progressao ??= {
    versao: 1, aptidao: potencial(camp, npc),
    esforco: Math.max(0, (camp.vivo?.pessoas[npc.id]?.habilidade ?? 5) - 5) * 12,
    experiencia: 0, sessoes: 0,
  };
}

export function fichaCombatente(camp: Campaign, npc: NPC): NPC['combatente'] {
  if (!npc.combatente) return;
  const base = npc.combatente, e = camp.npcState[npc.id]?.progressao;
  const maestria = maestriaPorEsforco(e?.esforco ?? 0);
  const patamar = Math.min(20, Math.floor(Math.sqrt((e?.experiencia ?? 0) / 30)));
  const praticaAntiga = Math.floor((camp.vivo?.pessoas[npc.id]?.habilidade ?? 5) / 5) - 1;
  return {
    ...base,
    vida: Math.round(base.vida * (1 + maestria / 250) + patamar * 3),
    acerto: base.acerto + praticaAntiga + Math.floor(maestria / 25) + Math.floor(patamar / 5),
    defesa: base.defesa + Math.floor(maestria / 20) + Math.floor(patamar / 5),
    dano: { ...base.dano, base: base.dano.base * (1 + maestria / 200) + patamar / 3 },
  };
}

export function treinarNpc(camp: Campaign, npc: NPC, esforco = 1, experiencia = 0): boolean {
  const din = camp.npcState[npc.id];
  if (!din?.vivo || (din.idade ?? npc.idade) < 18 || (camp.vivo?.pessoas[npc.id]?.objetivo === 'cativo' || camp.vivo?.pessoas[npc.id]?.objetivo === 'preso')) return false;
  const e = inicializarProgressaoNpc(camp, npc);
  if (!e) return false;
  const antes = fichaCombatente(camp, npc)!;
  const vida = din.vida ?? antes.vida;
  if (vida <= 0) return false;
  const saude = Math.max(.1, Math.min(1, vida / antes.vida));
  const teto = maestriaPorEsforco(e.esforco) > tetoConfortavel(e.aptidao) ? .15 : 1;
  e.esforco += Math.max(0, Math.min(5, esforco)) * (0.5 + e.aptidao / 50) * saude * teto;
  e.experiencia += Math.max(0, Math.min(100, experiencia));
  e.sessoes++;
  const depois = fichaCombatente(camp, npc)!;
  din.vida = Math.min(depois.vida, Math.max(1, Math.round(depois.vida * vida / antes.vida)));
  return true;
}

export function migrarProgressaoNpcs(content: ContentBundle, camp: Campaign): void {
  for (const n of [...content.npcs, ...(camp.npcsProcedurais ?? [])]) {
    if (camp.npcState[n.id]?.progressao || !n.combatente) continue;
    const antiga = fichaCombatente(camp, n)!;
    const vida = camp.npcState[n.id]?.vida;
    inicializarProgressaoNpc(camp, n);
    if (vida !== undefined && vida > 0) camp.npcState[n.id].vida = Math.round(vida / antiga.vida * fichaCombatente(camp, n)!.vida);
  }
}

// Only earned skill and training history are observable; never birth potential.
export function retratoProgressaoNpc(camp: Campaign, npc: NPC) {
  const e = camp.npcState[npc.id]?.progressao;
  const ficha = fichaCombatente(camp, npc);
  if (!ficha) return;
  return { maestria: Math.round(maestriaPorEsforco(e?.esforco ?? 0)), sessoes: e?.sessoes ?? 0, vidaMax: ficha.vida, acerto: ficha.acerto, defesa: ficha.defesa, dano: Math.round(ficha.dano.base * 10) / 10 };
}
