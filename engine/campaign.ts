// ARCANUM · Fábrica e ciclo de vida de uma campanha.
import type { Campaign, ContentBundle, Atributos, NpcDinamico, LivroState, MarcaInfancia, ReacaoInfancia } from './types';
import { createRng, seedFromString } from './rng';
import { criarPersonagem } from './character';
import { impulsosIniciais } from './impulsos';
import { mundoInicial } from './mundo';
import { inicializarKimetsu } from './kimetsu';
import { iniciarContinuidade } from './continuidade';
import { iniciarFamilia } from './familia';
import { iniciarMundoVivo } from './historiaViva';
import { iniciarAptidao } from './aptidao';
import { montarGenese, aplicarHeranca, cartaDeInfancia } from './genese';

export type EntradaCriacao = {
  nome: string;
  atributos: Atributos;
  classeId: string;
  origemId: string;
  seedString?: string;
  // Escolha do jogador sobre a própria infância (ver engine/genese.ts).
  // Opcional para não quebrar chamadas antigas/de teste — cai em "comum" /
  // "entendimento", a combinação mais neutra.
  marcaInfancia?: MarcaInfancia;
  reacaoInfancia?: ReacaoInfancia;
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

  const seedStr = entrada.seedString ?? `${entrada.nome}:${Date.now()}`;
  const rng = createRng(seedFromString(seedStr));

  // Gênese primeiro: os pais e a infância existem antes do personagem
  // jogável, e empurram (sem apagar) os atributos que o jogador escolheu.
  // Marca e reação vêm da escolha do jogador na criação; pais/irmãos e a
  // herança em si continuam sorteados.
  const genese = montarGenese(rng, entrada.marcaInfancia ?? 'comum', entrada.reacaoInfancia ?? 'entendimento');
  const atributosHerdados = aplicarHeranca(rng, entrada.atributos, genese);
  const cartaInicial = cartaDeInfancia(genese);
  const personagem = criarPersonagem(
    entrada.nome,
    atributosHerdados,
    classe,
    origem,
    content.cenario,
  );

  const npcState: Record<string, NpcDinamico> = {};
  for (const npc of content.npcs) {
    const eixos: Record<string, number> = {};
    for (const e of content.cenario.eixosRelacao) eixos[e.id] = 0;
    npcState[npc.id] = { eixos, vivo: true, tensao: 0, memoria: [] };
  }

  const reputacao: Record<string, number> = {};
  for (const f of content.faccoes) reputacao[f.id] = 0;

  const flags: Record<string, boolean | number | string> = { ...(origem.flagsIniciais ?? {}) };
  flags['versao.idades_kimetsu'] = 1;
  if (genese.marca === 'tragedia') flags['orfao'] = true;

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
    grupo: [],
    questEstado,
    genese,
    memoriasInfancia: [cartaInicial],
  };

  // O vale já começa com um tempo e um estado — nada nasce congelado.
  camp.mundo = mundoInicial(camp);
  inicializarKimetsu(camp);
  iniciarContinuidade(content, camp);
  iniciarFamilia(content, camp);
  iniciarMundoVivo(content, camp);
  // A aptidao nasce com a pessoa e fica oculta ate ser demonstrada.
  camp.aptidao = iniciarAptidao(camp);
  return camp;
}

export const CAPITULO_MIN_PERIODOS = 12;
export const CAPITULO_MAX_PERIODOS = 18;

// Fim de capítulo (GDD §26): fecha quando passa do teto de períodos.
export function deveFecharCapitulo(camp: Campaign): boolean {
  return camp.capitulo.periodosDecorridos >= CAPITULO_MAX_PERIODOS;
}
