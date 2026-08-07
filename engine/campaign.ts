// ARCANUM · Fábrica e ciclo de vida de uma campanha.
import type { Campaign, ContentBundle, Atributos, NpcDinamico, LivroState } from './types';
import { createRng, seedFromString } from './rng';
import { criarPersonagem } from './character';
import { impulsosIniciais } from './impulsos';
import { mundoInicial } from './mundo';

export type EntradaCriacao = {
  nome: string;
  atributos: Atributos;
  classeId: string;
  origemId: string;
  seedString?: string;
};

function livroInicial(content: ContentBundle): LivroState {
  const mk = <T extends { id: string }>(arr: T[]) =>
    Object.fromEntries(arr.map((x) => [x.id, 'desconhecida' as const]));
  return {
    mestres: mk(content.mestres),
    trabalhos: mk(content.trabalhos),
    artes: mk(content.artes),
    reliquias: mk(content.reliquias),
  };
}

export function criarCampanha(content: ContentBundle, entrada: EntradaCriacao): Campaign {
  const classe = content.classes.find((c) => c.id === entrada.classeId)!;
  const origem = content.origens.find((o) => o.id === entrada.origemId)!;
  const personagem = criarPersonagem(
    entrada.nome,
    entrada.atributos,
    classe,
    origem,
    content.cenario,
  );

  const seedStr = entrada.seedString ?? `${entrada.nome}:${Date.now()}`;
  const rng = createRng(seedFromString(seedStr));

  const npcState: Record<string, NpcDinamico> = {};
  for (const npc of content.npcs) {
    const eixos: Record<string, number> = {};
    for (const e of content.cenario.eixosRelacao) eixos[e.id] = 0;
    npcState[npc.id] = { eixos, vivo: true, tensao: 0, memoria: [] };
  }

  const reputacao: Record<string, number> = {};
  for (const f of content.faccoes) reputacao[f.id] = 0;

  const flags: Record<string, boolean | number | string> = { ...(origem.flagsIniciais ?? {}) };

  const questEstado: Record<string, import('./types').QuestEstado> = {};
  for (const q of content.quests) questEstado[q.id] = q.dador ? 'desconhecida' : 'ativa';

  const camp: Campaign = {
    id: `camp_${Date.now().toString(36)}`,
    cenarioId: content.cenario.id,
    criadaEm: Date.now(),
    rng,
    calendario: { dia: 0, periodoIndex: 1, estacao: 'outono' }, // começa de manhã
    capitulo: { numero: 1, titulo: 'Capítulo I', periodosDecorridos: 0 },
    personagem,
    localAtual: content.localInicial,
    npcState,
    impulsos: impulsosIniciais(),
    flags,
    reputacao,
    livro: livroInicial(content),
    cronica: [],
    locaisVisitados: [content.localInicial],
    segredosRevelados: [],
    turno: 0,
    combate: null,
    questEstado,
  };

  // O vale já começa com um tempo e um estado — nada nasce congelado.
  camp.mundo = mundoInicial(camp);
  return camp;
}

export const CAPITULO_MIN_PERIODOS = 12;
export const CAPITULO_MAX_PERIODOS = 18;

// Fim de capítulo (GDD §26): fecha quando passa do teto de períodos.
export function deveFecharCapitulo(camp: Campaign): boolean {
  return camp.capitulo.periodosDecorridos >= CAPITULO_MAX_PERIODOS;
}
