// ARCANUM · Vida emergente dos NPCs: elas envelhecem, e o que sentem umas
// pelas outras às vezes vira acontecimento de verdade — não só clima, gente
// que morre de velhice, rompe de vez, ou aprofunda o que já tinha.
//
// Não é simulação de população: isso pediria uma ficha pra cada pessoa do
// vale inteiro, com casamento/gravidez/sucessão de todo mundo — escopo de
// jogo bem maior do que este é. É a mesma ideia de engine/duelo.ts, aplicada
// à vida civil: acontecimento raro, sorteado, com consequência REAL no
// npcState (idade, tensão, eixos, vivo) — nunca só floreio de texto solto.
import type { Campaign, ContentBundle, LacoTipo, NPC } from './types';
import type { RngState } from './rng';
import { nextFloat, pick } from './rng';
import { registrarMarco } from './memoria';
import { todosNpcs } from './elenco';
import { registrarMorteFamiliar } from './familia';

export const DIAS_POR_ANO = 365;
const IDADE_MORTE_MIN = 65;
const IDADE_MORTE_CHANCE_MAX = 0.35;
const CHANCE_DRAMA_DIARIA = 0.05;

// Idade efetiva NESTA campanha — pode já ter andado além da idade estática
// do conteúdo, se o calendário já correu um ano ou mais.
export function idadeAtual(camp: Campaign, npc: NPC): number {
  return camp.npcState[npc.id]?.idade ?? npc.idade;
}

// Chamada uma vez por ano de calendário virado. Cada NPC viva envelhece um
// ano; passado os 65, corre um risco real de não acordar mais — sem
// combate, sem drama de cena, só o peso do tempo, do jeito que o resto do
// mundo também sente.
function envelhecerTodos(content: ContentBundle, camp: Campaign): void {
  for (const npc of [...content.npcs, ...(camp.npcsProcedurais ?? [])]) {
    const din = camp.npcState[npc.id];
    if (!din || !din.vivo || npc.especie === 'oni') continue;
    const idade = idadeAtual(camp, npc) + 1;
    din.idade = idade;
    if (idade < IDADE_MORTE_MIN) continue;
    const chance = Math.min(IDADE_MORTE_CHANCE_MAX, (idade - IDADE_MORTE_MIN) * 0.02);
    if (nextFloat(camp.rng) < chance) {
      din.vivo = false;
      registrarMorteFamiliar(camp, npc.id);
      registrarMarco(camp, `dia ${camp.calendario.dia}: ${npc.nome} morreu de velhice, com ${idade} anos.`);
    }
  }
}

export type ResultadoRivalidade = 'paz' | 'racha' | 'morte';

// Rivalidade que já azedou de verdade (tensão alta nos dois lados) tem uma
// chance pequena de virar acontecimento: na maioria das vezes esfria
// sozinha; raro, vira ruptura definitiva; raríssimo, alguém não sobrevive.
export function resolverRivalidadeDeFundo(rng: RngState): ResultadoRivalidade {
  const r = nextFloat(rng);
  if (r < 0.55) return 'paz';
  if (r < 0.94) return 'racha';
  return 'morte';
}

type ParNpc = { a: NPC; b: NPC; tipo: LacoTipo };

// Junta os pares vivos que têm um dos laços pedidos entre si — olhando pros
// dois lados da relação (às vezes só uma delas lista a outra), sem repetir
// o mesmo par duas vezes no mesmo dia.
function paresElegiveis(content: ContentBundle, camp: Campaign, tipos: LacoTipo[]): ParNpc[] {
  const vistos = new Set<string>();
  const pares: ParNpc[] = [];
  const elenco = todosNpcs(content, camp);
  for (const a of elenco) {
    if (!camp.npcState[a.id]?.vivo) continue;
    for (const laco of a.relacoes ?? []) {
      if (!tipos.includes(laco.tipo)) continue;
      const b = elenco.find((n) => n.id === laco.npc);
      if (!b || !camp.npcState[b.id]?.vivo) continue;
      const chave = [a.id, b.id].sort().join('|');
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      pares.push({ a, b, tipo: laco.tipo });
    }
  }
  return pares;
}

// Rivalidade que já está no limite (tensão alta nos dois lados) de vez em
// quando estoura de verdade — e a resolução mexe no estado das duas, não só
// no texto.
function processarRivalidades(content: ContentBundle, camp: Campaign): void {
  const pares = paresElegiveis(content, camp, ['rival']).filter(
    (p) => !(camp.grupo ?? []).includes(p.a.id) && !(camp.grupo ?? []).includes(p.b.id) &&
      (camp.npcState[p.a.id]?.tensao ?? 0) >= 65 && (camp.npcState[p.b.id]?.tensao ?? 0) >= 65,
  );
  if (pares.length === 0) return;
  if (nextFloat(camp.rng) >= CHANCE_DRAMA_DIARIA) return;

  const par = pick(camp.rng, pares);
  const resultado = resolverRivalidadeDeFundo(camp.rng);
  const dinA = camp.npcState[par.a.id];
  const dinB = camp.npcState[par.b.id];
  const hoje = camp.calendario.dia;

  if (resultado === 'paz') {
    dinA.tensao = Math.max(0, dinA.tensao - 40);
    dinB.tensao = Math.max(0, dinB.tensao - 40);
    registrarMarco(
      camp,
      `dia ${hoje}: ${par.a.nome} e ${par.b.nome} fizeram as pazes, do jeito estranho que rivais fazem.`,
    );
  } else if (resultado === 'racha') {
    dinA.tensao = 100;
    dinB.tensao = 100;
    for (const d of [dinA, dinB]) {
      if (d.eixos.disposicao !== undefined) d.eixos.disposicao = Math.max(-20, d.eixos.disposicao - 6);
    }
    registrarMarco(camp, `dia ${hoje}: ${par.a.nome} e ${par.b.nome} romperam de vez — não se falam mais.`);
  } else {
    const perdedor = pick(camp.rng, [par.a, par.b]);
    const vencedor = perdedor.id === par.a.id ? par.b : par.a;
    camp.npcState[perdedor.id].vivo = false;
    registrarMorteFamiliar(camp, perdedor.id);
    registrarMarco(camp, `dia ${hoje}: ${perdedor.nome} não sobreviveu à rixa com ${vencedor.nome}.`);
  }
}

// Vínculo que já vem forte (tensão baixa, disposição alta) de vez em quando
// se aprofunda de verdade — não muda a régua além do que já mudaria
// sozinho, só marca que aconteceu, pra o narrador poder citar depois.
function processarAproximacoes(content: ContentBundle, camp: Campaign): void {
  const pares = paresElegiveis(content, camp, ['aliada', 'amante']).filter((p) => {
    const dinA = camp.npcState[p.a.id];
    const dinB = camp.npcState[p.b.id];
    return (
      dinA.tensao <= 15 &&
      dinB.tensao <= 15 &&
      (dinA.eixos.disposicao ?? 0) >= 15 &&
      (dinB.eixos.disposicao ?? 0) >= 15
    );
  });
  if (pares.length === 0) return;
  if (nextFloat(camp.rng) >= CHANCE_DRAMA_DIARIA) return;

  const par = pick(camp.rng, pares);
  const hoje = camp.calendario.dia;
  const texto =
    par.tipo === 'amante'
      ? `dia ${hoje}: ${par.a.nome} e ${par.b.nome} assumiram o que já era claro pra todo mundo.`
      : `dia ${hoje}: ${par.a.nome} e ${par.b.nome} andam inseparáveis — todo mundo no vale já notou.`;
  registrarMarco(camp, texto);
}

// Chamada de dentro de avancarMundo, uma vez por dia virado. Envelhecimento
// só roda quando um ano inteiro já passou desde o último; o drama de fundo
// roda (com chance baixa) todo dia — a maioria não dá em nada, do jeito que
// a vida de verdade é.
export function processarVidaDeFundo(content: ContentBundle, camp: Campaign): void {
  const m = camp.mundo;
  const hoje = camp.calendario.dia;
  if ((m?.proximoEnvelhecimento ?? DIAS_POR_ANO) <= hoje) {
    envelhecerTodos(content, camp);
    if (m) m.proximoEnvelhecimento = hoje + DIAS_POR_ANO;
  }
  processarRivalidades(content, camp);
  processarAproximacoes(content, camp);
}
