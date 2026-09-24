// ARCANUM · Famílias entre NPCs do elenco.
//
// Até a sessão 46, nenhum dos 246 NPCs de Vaelhorn tinha mãe, filha, irmã ou
// cônjuge declarada. A única família do jogo era a do jogador
// (engine/familia.ts). O convívio (convivio.ts) e a vida de fundo
// (vidanpc.ts, autonomia.ts) liam `relacoes` — aliada, rival, devedora — e
// com isso o vale tinha rixas, mas não tinha sangue.
//
// O parentesco é CONTEÚDO (content/vaelhorn/familias.ts): laços de mãe, pai,
// irmãs, cônjuges, avó, tia e prima, escritos à mão. Daqui sai o que é
// deduzido (irmã por mãe em comum, avó por mãe da mãe, tia, prima) e o que a
// engine faz com isso:
//
// - luto: quem morre deixa tensão, disposição mais baixa e o registro do
//   luto nos parentes vivos, e um fato público com o nome da família;
// - herança: a filha assume o ofício da mãe que morreu, ou que passou dos 75;
// - o jogador: o que ele faz a uma pessoa (efeito de relação, resgate) chega
//   à família dela com peso menor;
// - uniões: autonomia.ts não junta parentes;
// - narrador e tela: os parentes de quem está em cena.
//
// Por que um passe diário e não um gancho em cada morte: há oito caminhos de
// morte de NPC (velhice, rixa, guerra, doença, combate, duelo...) e nenhum
// recebe `content`. O passe diário pega todos, inclusive o duelo, que nem
// chamava registrarMorteFamiliar.
import type { Campaign, ContentBundle, EstadoFamiliasNpc, FamiliaNpc, NPC } from './types';
import { registrarFato } from './historiaViva';
import { idadeAtual } from './vidanpc';

export type LacoParente =
  | 'mae' | 'pai' | 'filha' | 'filho' | 'irma' | 'irmao' | 'conjuge'
  | 'avo' | 'avoM' | 'neta' | 'neto' | 'tia' | 'tio' | 'sobrinha' | 'sobrinho' | 'prima' | 'primo';

export type Parente = { npc: string; laco: LacoParente; familia: string };

export const NOME_LACO: Record<LacoParente, string> = {
  mae: 'mãe', pai: 'pai', filha: 'filha', filho: 'filho', irma: 'irmã', irmao: 'irmão', conjuge: 'companheira',
  avo: 'avó', avoM: 'avô', neta: 'neta', neto: 'neto', tia: 'tia', tio: 'tio', sobrinha: 'sobrinha', sobrinho: 'sobrinho', prima: 'prima', primo: 'primo',
};

const PROXIMOS: ReadonlySet<LacoParente> = new Set(['mae', 'pai', 'filha', 'filho', 'irma', 'irmao', 'conjuge']);
// Ordem de preferência quando duas regras dão laços diferentes para o mesmo par.
const PRIORIDADE: LacoParente[] = ['mae', 'pai', 'filha', 'filho', 'conjuge', 'irma', 'irmao', 'avo', 'avoM', 'neta', 'neto', 'tia', 'tio', 'sobrinha', 'sobrinho', 'prima', 'primo'];

/** Nome do laço com o gênero de quem é o parente (companheira/companheiro). */
export function rotuloLaco(content: ContentBundle, p: Parente): string {
  if (p.laco === 'conjuge' && indice(content).masculino.has(p.npc)) return 'companheiro';
  return NOME_LACO[p.laco];
}

function morta(content: ContentBundle, id: string): string {
  return indice(content).masculino.has(id) ? 'morto' : 'morta';
}

export function lacoProximo(l: LacoParente): boolean {
  return PROXIMOS.has(l);
}

type Indice = {
  parentes: Map<string, Parente[]>;
  familiaDe: Map<string, FamiliaNpc[]>;
  masculino: Set<string>;
};

const CACHE = new WeakMap<FamiliaNpc[], Indice>();

function montarIndice(familias: FamiliaNpc[]): Indice {
  const masculino = new Set<string>();
  const familiaDe = new Map<string, FamiliaNpc[]>();
  for (const f of familias) {
    for (const m of f.membros) {
      if (m.genero === 'm') masculino.add(m.npc);
      familiaDe.set(m.npc, [...(familiaDe.get(m.npc) ?? []), f]);
    }
  }
  const g = (id: string) => (masculino.has(id) ? 'm' : 'f');
  const pares = new Map<string, Map<string, { laco: LacoParente; familia: string }>>();
  const por = (x: string) => pares.get(x) ?? (pares.set(x, new Map()), pares.get(x)!);
  const ligar = (x: string, y: string, laco: LacoParente, familia: string) => {
    if (x === y) return;
    const atual = por(x).get(y);
    if (!atual || PRIORIDADE.indexOf(laco) < PRIORIDADE.indexOf(atual.laco)) por(x).set(y, { laco, familia });
  };

  // Genitores de cada um (para deduzir irmã, avó, tia, prima).
  const genitores = new Map<string, Set<string>>();
  const irmasDecl: [string, string, string][] = [];
  for (const f of familias) {
    for (const l of f.lacos) {
      const { a, b } = l;
      switch (l.tipo) {
        case 'mae':
        case 'pai':
          ligar(a, b, g(b) === 'm' ? 'filho' : 'filha', f.id);
          ligar(b, a, l.tipo, f.id);
          (genitores.get(b) ?? (genitores.set(b, new Set()), genitores.get(b)!)).add(a);
          break;
        case 'avo':
          ligar(a, b, g(b) === 'm' ? 'neto' : 'neta', f.id);
          ligar(b, a, g(a) === 'm' ? 'avoM' : 'avo', f.id);
          break;
        case 'tia':
          ligar(a, b, g(b) === 'm' ? 'sobrinho' : 'sobrinha', f.id);
          ligar(b, a, g(a) === 'm' ? 'tio' : 'tia', f.id);
          break;
        case 'irmas':
          irmasDecl.push([a, b, f.id]);
          break;
        case 'conjuges':
          ligar(a, b, 'conjuge', f.id);
          ligar(b, a, 'conjuge', f.id);
          break;
        case 'primas':
          ligar(a, b, g(b) === 'm' ? 'primo' : 'prima', f.id);
          ligar(b, a, g(a) === 'm' ? 'primo' : 'prima', f.id);
          break;
      }
    }
  }
  const familiaComum = (x: string, y: string) =>
    (familiaDe.get(x) ?? []).find(f => (familiaDe.get(y) ?? []).includes(f))?.id ?? familiaDe.get(x)?.[0]?.id ?? '';

  // Irmãs: declaradas, ou com genitor em comum.
  const irmaos = new Map<string, Set<string>>();
  const juntarIrmas = (x: string, y: string) => {
    if (x === y) return;
    (irmaos.get(x) ?? (irmaos.set(x, new Set()), irmaos.get(x)!)).add(y);
    (irmaos.get(y) ?? (irmaos.set(y, new Set()), irmaos.get(y)!)).add(x);
  };
  for (const [a, b] of irmasDecl) juntarIrmas(a, b);
  const filhosDe = new Map<string, string[]>();
  for (const [filho, gs] of genitores) for (const gen of gs) filhosDe.set(gen, [...(filhosDe.get(gen) ?? []), filho]);
  for (const filhos of filhosDe.values()) for (const x of filhos) for (const y of filhos) juntarIrmas(x, y);
  for (const [x, ys] of irmaos) for (const y of ys) ligar(x, y, g(y) === 'm' ? 'irmao' : 'irma', familiaComum(x, y));

  // Avó: genitor do genitor. Tia: irmã do genitor. Prima: filha da irmã do genitor.
  for (const [pessoa, gs] of genitores) {
    for (const gen of gs) {
      for (const avo of genitores.get(gen) ?? []) {
        ligar(pessoa, avo, g(avo) === 'm' ? 'avoM' : 'avo', familiaComum(pessoa, avo));
        ligar(avo, pessoa, g(pessoa) === 'm' ? 'neto' : 'neta', familiaComum(pessoa, avo));
      }
      for (const tia of irmaos.get(gen) ?? []) {
        ligar(pessoa, tia, g(tia) === 'm' ? 'tio' : 'tia', familiaComum(pessoa, tia));
        ligar(tia, pessoa, g(pessoa) === 'm' ? 'sobrinho' : 'sobrinha', familiaComum(pessoa, tia));
        for (const prima of filhosDe.get(tia) ?? []) {
          ligar(pessoa, prima, g(prima) === 'm' ? 'primo' : 'prima', familiaComum(pessoa, prima));
        }
      }
    }
  }

  const parentes = new Map<string, Parente[]>();
  for (const [x, m] of pares) {
    parentes.set(x, [...m].map(([npc, v]) => ({ npc, laco: v.laco, familia: v.familia }))
      .sort((p, q) => PRIORIDADE.indexOf(p.laco) - PRIORIDADE.indexOf(q.laco)));
  }
  return { parentes, familiaDe, masculino };
}

function indice(content: ContentBundle): Indice {
  const familias = content.familias ?? [];
  let i = CACHE.get(familias);
  if (!i) { i = montarIndice(familias); CACHE.set(familias, i); }
  return i;
}

export function parentesDe(content: ContentBundle, npcId: string): Parente[] {
  return indice(content).parentes.get(npcId) ?? [];
}

export function familiasDe(content: ContentBundle, npcId: string): FamiliaNpc[] {
  return indice(content).familiaDe.get(npcId) ?? [];
}

export function saoParentes(content: ContentBundle, a: string, b: string): boolean {
  return parentesDe(content, a).some(p => p.npc === b);
}

export function lacoEntre(content: ContentBundle, de: string, para: string): LacoParente | undefined {
  return parentesDe(content, de).find(p => p.npc === para)?.laco;
}

/** Todo id de NPC que aparece em alguma família. */
export function membrosComFamilia(content: ContentBundle): string[] {
  return [...indice(content).familiaDe.keys()];
}

// ── Estado ────────────────────────────────────────────────────────────────

function npcDoBundle(content: ContentBundle, camp: Campaign, id: string): NPC | undefined {
  return content.npcs.find(n => n.id === id) ?? camp.npcsProcedurais?.find(n => n.id === id);
}

/**
 * Criado sob demanda. Quem já estava morto quando o sistema nasceu (save
 * antigo) conta como pranteado: senão o primeiro dia depois da atualização
 * despejaria anos de luto de uma vez.
 */
export function estadoFamiliasNpc(content: ContentBundle, camp: Campaign): EstadoFamiliasNpc {
  if (!camp.familiasNpc) {
    camp.familiasNpc = {
      pranteados: membrosComFamilia(content).filter(id => camp.npcState[id] && !camp.npcState[id].vivo),
      herancas: {},
      aposentadas: {},
      lutos: {},
      fatoVisto: camp.vivo?.sequencia ?? 0,
    };
  }
  return camp.familiasNpc;
}

/** O ofício que a pessoa exerce hoje, contando herança e aposentadoria. */
export function ocupacaoEfetiva(camp: Campaign, npc: NPC): string {
  const h = camp.familiasNpc?.herancas[npc.id];
  if (h) return h.ocupacao;
  if (camp.familiasNpc?.aposentadas[npc.id] !== undefined) return `${npc.ocupacao}, já sem o posto`;
  return npc.ocupacao;
}

const TENSAO_LUTO_PROXIMO = 20;
const TENSAO_LUTO_DISTANTE = 8;
const IDADE_APOSENTADORIA = 75;

function clampDisp(v: number): number {
  return Math.max(-20, Math.min(20, v));
}

/**
 * Luto de quem acabou de morrer. Chamado pelo passe diário; exportado para
 * teste.
 */
export function prantear(content: ContentBundle, camp: Campaign, mortoId: string): void {
  const e = estadoFamiliasNpc(content, camp);
  if (e.pranteados.includes(mortoId)) return;
  e.pranteados.push(mortoId);
  const morto = npcDoBundle(content, camp, mortoId);
  if (!morto) return;
  const vivos = parentesDe(content, mortoId).filter(p => camp.npcState[p.npc]?.vivo);
  const hoje = camp.calendario.dia;
  for (const p of vivos) {
    const din = camp.npcState[p.npc];
    const proximo = lacoProximo(p.laco);
    din.tensao = Math.min(100, din.tensao + (proximo ? TENSAO_LUTO_PROXIMO : TENSAO_LUTO_DISTANTE));
    if (proximo && din.eixos.disposicao !== undefined) din.eixos.disposicao = clampDisp(din.eixos.disposicao - 2);
    // O laço do morto visto do lado de quem fica: a mãe perdeu a filha.
    const lacoDoMorto = lacoEntre(content, p.npc, mortoId) ?? p.laco;
    (e.lutos[p.npc] ??= []).push({ morto: mortoId, laco: lacoDoMorto, dia: hoje });
    if (e.lutos[p.npc].length > 6) e.lutos[p.npc].shift();
  }
  const familia = familiasDe(content, mortoId)[0];
  if (familia && camp.vivo) {
    const quem = vivos.filter(p => lacoProximo(p.laco)).map(p => npcDoBundle(content, camp, p.npc)?.nome).filter(Boolean);
    registrarFato(camp, {
      tipo: 'luto_familia', local: morto.localBase, publico: true,
      atores: [mortoId, ...vivos.map(p => p.npc)],
      texto: quem.length
        ? `Luto entre ${familia.nome}: ${morto.nome} morreu, e ${quem.join(', ')} ${quem.length === 1 ? 'ficou' : 'ficaram'}.`
        : `Luto entre ${familia.nome}: ${morto.nome} morreu, e não sobrou ninguém próximo para enterrar.`,
    });
  }
  herdarOficio(content, camp, morto, 'morte');
}

/** A filha (ou neta) mais velha, viva e no mesmo lugar, assume o ofício. */
function herdarOficio(content: ContentBundle, camp: Campaign, de: NPC, motivo: 'morte' | 'idade'): void {
  const e = estadoFamiliasNpc(content, camp);
  const herdeira = parentesDe(content, de.id)
    .filter(p => ['filha', 'filho', 'neta', 'neto'].includes(p.laco) && camp.npcState[p.npc]?.vivo && !e.herancas[p.npc])
    .map(p => npcDoBundle(content, camp, p.npc)!)
    .filter(n => n && n.localBase === de.localBase && idadeAtual(camp, n) >= 18 && n.ocupacao !== de.ocupacao)
    .sort((a, b) => idadeAtual(camp, b) - idadeAtual(camp, a))[0];
  if (!herdeira) return;
  const ocupacao = e.herancas[de.id]?.ocupacao ?? de.ocupacao;
  e.herancas[herdeira.id] = { ocupacao, de: de.id, dia: camp.calendario.dia };
  // A casa e o que havia nela vão junto (estado civil de autonomia.ts).
  const pessoas = camp.vivo?.pessoas;
  if (pessoas?.[de.id] && pessoas[herdeira.id]) {
    pessoas[herdeira.id].moedas = Math.min(250, pessoas[herdeira.id].moedas + pessoas[de.id].moedas);
    pessoas[de.id].moedas = 0;
    pessoas[herdeira.id].casa = pessoas[de.id].casa;
  }
  if (camp.vivo) {
    registrarFato(camp, {
      tipo: 'heranca_oficio', local: de.localBase, publico: true, atores: [herdeira.id, de.id],
      texto: motivo === 'morte'
        ? `${herdeira.nome} assumiu o ofício de ${de.nome} (${ocupacao}) depois do enterro.`
        : `${de.nome} passou o ofício (${ocupacao}) para ${herdeira.nome}. Diz que as mãos já não obedecem.`,
    });
  }
}

/**
 * Gratidão e ressentimento que o jogador provoca numa pessoa chegam à
 * família dela com peso menor: próximos a 35%, os outros a 15%.
 */
export function propagarParaFamilia(content: ContentBundle, camp: Campaign, npcId: string, eixo: string, delta: number): void {
  if (!delta) return;
  for (const p of parentesDe(content, npcId)) {
    const din = camp.npcState[p.npc];
    if (!din?.vivo) continue;
    const parte = Math.round(delta * (lacoProximo(p.laco) ? 0.35 : 0.15));
    if (!parte) continue;
    din.eixos[eixo] = (din.eixos[eixo] ?? 0) + parte;
    if (eixo === 'disposicao') din.eixos.disposicao = clampDisp(din.eixos.disposicao);
  }
}

const GRATIDAO_RESGATE = 6;

/** Passe diário: luto, aposentadoria e gratidão por resgate. */
export function processarFamiliasNpc(content: ContentBundle, camp: Campaign): void {
  if (!content.familias?.length) return;
  const e = estadoFamiliasNpc(content, camp);
  for (const id of membrosComFamilia(content)) {
    const din = camp.npcState[id];
    if (!din) continue;
    if (!din.vivo) { prantear(content, camp, id); continue; }
    if (e.aposentadas[id] === undefined) {
      const npc = npcDoBundle(content, camp, id);
      if (npc && npc.especie !== 'oni' && idadeAtual(camp, npc) >= IDADE_APOSENTADORIA) {
        e.aposentadas[id] = camp.calendario.dia;
        herdarOficio(content, camp, npc, 'idade');
      }
    }
  }
  // Resgate concluído pelo jogador: a família agradece.
  const v = camp.vivo;
  if (v) {
    for (const f of v.fatos) {
      const n = Number(f.id.slice(5));
      if (!(n > e.fatoVisto)) continue;
      if (f.tipo === 'missao_concluida' && f.atores[0]) propagarParaFamilia(content, camp, f.atores[0], 'disposicao', GRATIDAO_RESGATE);
    }
    e.fatoVisto = v.sequencia;
  }
}

// ── Narrador e tela ───────────────────────────────────────────────────────

export type FamiliaParaNarrador = {
  familia: string;
  tensao: string;
  parentes: string[];
  luto?: string;
};

/**
 * Até três parentes, os presentes primeiro, depois os próximos. Curto: é
 * para o narrador saber que a ferreira da praça é irmã da outra, não para
 * contar a árvore inteira.
 */
export function familiaParaNarrador(content: ContentBundle, camp: Campaign, npcId: string, presentes: string[] = []): FamiliaParaNarrador | undefined {
  const familia = familiasDe(content, npcId)[0];
  if (!familia) return undefined;
  const lista = parentesDe(content, npcId)
    .map(p => ({ p, aqui: presentes.includes(p.npc), vivo: !!camp.npcState[p.npc]?.vivo }))
    .sort((x, y) => Number(y.aqui) - Number(x.aqui) || Number(lacoProximo(y.p.laco)) - Number(lacoProximo(x.p.laco)))
    .slice(0, 3)
    .map(({ p, aqui, vivo }) => {
      const nome = npcDoBundle(content, camp, p.npc)?.nome ?? p.npc;
      return `${nome}, ${rotuloLaco(content, p)}${!vivo ? ` (${morta(content, p.npc)})` : aqui ? ' (está aqui)' : ''}`;
    });
  const ultimoLuto = camp.familiasNpc?.lutos[npcId]?.at(-1);
  const luto = ultimoLuto && camp.calendario.dia - ultimoLuto.dia <= 60
    ? `de luto: perdeu ${npcDoBundle(content, camp, ultimoLuto.morto)?.nome ?? ultimoLuto.morto} (${NOME_LACO[ultimoLuto.laco as LacoParente] ?? ultimoLuto.laco}) há ${camp.calendario.dia - ultimoLuto.dia} dias`
    : undefined;
  return { familia: familia.nome, tensao: familia.tensao, parentes: lista, ...(luto ? { luto } : {}) };
}

/** Parentes que o jogador conhece (já conviveu com ele), para a ficha. */
export function parentesConhecidos(content: ContentBundle, camp: Campaign, npcId: string): { nome: string; laco: string; vivo: boolean }[] {
  return parentesDe(content, npcId)
    .filter(p => (camp.npcState[p.npc]?.memoria.length ?? 0) > 0)
    .map(p => ({ nome: npcDoBundle(content, camp, p.npc)?.nome ?? p.npc, laco: rotuloLaco(content, p), vivo: !!camp.npcState[p.npc]?.vivo }));
}
