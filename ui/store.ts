// ARCANUM · Store da aplicação (Zustand). Orquestra engine, narração e save.
import { create } from 'zustand';
import type { Campaign, ContentBundle, Atributos, AttrKey, NPC } from '@/engine/types';
import {
  criarCampanha,
  montarCena,
  narrarResultado,
  resolverIntencao,
  avancarPeriodos,
  crescerImpulsos,
  atributosBase,
  narrarComModelo,
  CAPITULO_MAX_PERIODOS,
  type OpcaoResolvida,
  type Contexto,
} from '@/engine';
import { bundlePorId } from '@/content';
import {
  salvarCampanha,
  carregarCampanha,
  apagarCampanha,
  salvarConfig,
  carregarConfig,
  configPadrao,
  type ConfigApp,
} from './storage';
import { classificarAcaoLivre } from './freeAction';

export type Tela =
  | 'entrada'
  | 'aviso17'
  | 'cenario'
  | 'classe'
  | 'origem'
  | 'criacao'
  | 'jogo'
  | 'mapa'
  | 'livro'
  | 'ficha'
  | 'vinculos'
  | 'cronica'
  | 'config'
  | 'fimcapitulo';

export type EntradaFeed = { id: string; texto: string; tipo: 'narracao' | 'eco' | 'sistema' | 'acao' };

type Rascunho = {
  cenarioId?: string;
  classeId?: string;
  origemId?: string;
  nome: string;
  atributos: Atributos;
};

const ATTR_MIN = 8;
const ATTR_MAX = 16;
const PONTOS_TOTAIS = 66; // 6×10 + 6 de distribuição

let feedSeq = 0;
const nf = (texto: string, tipo: EntradaFeed['tipo']): EntradaFeed => ({
  id: `f${feedSeq++}`,
  texto,
  tipo,
});

interface GameState {
  pronto: boolean;
  tela: Tela;
  telaAnterior: Tela;
  content?: ContentBundle;
  camp?: Campaign;
  cena?: { narracao: string; opcoes: OpcaoResolvida[]; contexto: Contexto };
  feed: EntradaFeed[];
  ocupado: boolean;
  temSave: boolean;
  config: ConfigApp;
  rascunho: Rascunho;

  init: () => Promise<void>;
  irPara: (t: Tela) => void;
  voltar: () => void;

  novoJogo: () => void;
  continuar: () => Promise<void>;
  aceitarAviso: () => Promise<void>;
  escolherCenario: (id: string) => void;
  escolherClasse: (id: string) => void;
  escolherOrigem: (id: string) => void;
  ajustarAtributo: (k: AttrKey, delta: number) => void;
  setNome: (n: string) => void;
  pontosRestantes: () => number;
  iniciarCampanha: () => Promise<void>;
  abandonar: () => Promise<void>;

  agirVerbo: (verboId: string, alvoId?: string) => Promise<void>;
  agirOpcao: (op: OpcaoResolvida, alvoId?: string) => Promise<void>;
  acaoLivre: (texto: string) => Promise<void>;
  viajar: (destino: string) => Promise<void>;

  setConfig: (patch: Partial<ConfigApp>) => Promise<void>;
  proximoCapitulo: () => Promise<void>;
  testarChaveApi: () => Promise<{ ok: boolean; erro?: string }>;
}

function recomputarCena(get: () => GameState, set: (p: Partial<GameState>) => void) {
  const { content, camp } = get();
  if (!content || !camp) return;
  const cena = montarCena(content, camp);
  set({ cena });
}

export const useGame = create<GameState>((set, get) => ({
  pronto: false,
  tela: 'entrada',
  telaAnterior: 'entrada',
  feed: [],
  ocupado: false,
  temSave: false,
  config: configPadrao,
  rascunho: { nome: '', atributos: atributosBase() },

  async init() {
    const config = await carregarConfig();
    const save = await carregarCampanha();
    set({ config, temSave: !!save, pronto: true });
  },

  irPara(t) {
    set({ telaAnterior: get().tela, tela: t });
  },
  voltar() {
    set({ tela: get().telaAnterior === get().tela ? 'jogo' : get().telaAnterior });
  },

  novoJogo() {
    set({
      rascunho: { nome: '', atributos: atributosBase() },
      tela: get().config.avisoAceito ? 'cenario' : 'aviso17',
    });
  },

  async continuar() {
    const camp = await carregarCampanha();
    if (!camp) return;
    const content = bundlePorId(camp.cenarioId);
    if (!content) return;
    set({ camp, content, feed: [nf('Você retoma de onde parou.', 'sistema')], tela: 'jogo' });
    recomputarCena(get, set);
  },

  async aceitarAviso() {
    const config = { ...get().config, avisoAceito: true };
    await salvarConfig(config);
    set({ config, tela: 'cenario' });
  },

  escolherCenario(id) {
    set({ rascunho: { ...get().rascunho, cenarioId: id }, tela: 'classe' });
  },
  escolherClasse(id) {
    set({ rascunho: { ...get().rascunho, classeId: id }, tela: 'origem' });
  },
  escolherOrigem(id) {
    set({ rascunho: { ...get().rascunho, origemId: id }, tela: 'criacao' });
  },

  ajustarAtributo(k, delta) {
    const r = get().rascunho;
    const atual = r.atributos[k];
    const novo = atual + delta;
    if (novo < ATTR_MIN || novo > ATTR_MAX) return;
    const soma = Object.values(r.atributos).reduce((a, b) => a + b, 0) + delta;
    if (soma > PONTOS_TOTAIS) return;
    set({ rascunho: { ...r, atributos: { ...r.atributos, [k]: novo } } });
  },
  setNome(n) {
    set({ rascunho: { ...get().rascunho, nome: n } });
  },
  pontosRestantes() {
    const r = get().rascunho;
    return PONTOS_TOTAIS - Object.values(r.atributos).reduce((a, b) => a + b, 0);
  },

  async iniciarCampanha() {
    const r = get().rascunho;
    const content = bundlePorId(r.cenarioId ?? 'vaelhorn');
    if (!content || !r.classeId || !r.origemId) return;
    const camp = criarCampanha(content, {
      nome: r.nome.trim() || 'Andarilho',
      atributos: r.atributos,
      classeId: r.classeId,
      origemId: r.origemId,
    });
    const cena = montarCena(content, camp);
    set({
      content,
      camp,
      cena,
      tela: 'jogo',
      temSave: true,
      feed: [nf(cena.narracao, 'narracao')],
    });
    await salvarCampanha(camp);
  },

  async abandonar() {
    await apagarCampanha();
    set({ camp: undefined, content: undefined, cena: undefined, feed: [], temSave: false, tela: 'entrada' });
  },

  async agirVerbo(verboId, alvoId) {
    await executar(get, set, { tipo: 'verbo', verboId, alvoId }, 'acao');
  },
  async agirOpcao(op, alvoId) {
    await executar(get, set, { tipo: 'opcao', opcao: op, alvoId }, 'acao');
  },

  async acaoLivre(texto) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const t = texto.trim();
    if (!t) return;
    set({ feed: [...get().feed, nf(`» ${t}`, 'acao')] });
    const cls = classificarAcaoLivre(t, content, get().cena?.contexto);
    if (cls) {
      await executar(get, set, { tipo: 'verbo', verboId: cls.verboId, alvoId: cls.alvoId }, undefined);
    } else {
      set({
        feed: [
          ...get().feed,
          nf('Você tenta, mas o gesto se perde no ar — talvez precise ser mais direto, ou usar o menu de Ações.', 'sistema'),
        ],
      });
    }
  },

  async viajar(destino) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const local = content.locais.find((l) => l.id === camp.localAtual);
    const rota = local?.rotas.find((r) => r.destino === destino);
    if (!rota) return;
    set({ ocupado: true });
    if (rota.periodos > 0) {
      camp.calendario = avancarPeriodos(camp.calendario, rota.periodos);
      crescerImpulsos(camp, rota.periodos);
      camp.capitulo.periodosDecorridos += rota.periodos;
    }
    camp.localAtual = destino;
    if (!camp.locaisVisitados.includes(destino)) camp.locaisVisitados.push(destino);
    const alvo = content.locais.find((l) => l.id === destino);
    const cena = montarCena(content, { ...camp });
    set({
      camp: { ...camp },
      cena,
      ocupado: false,
      tela: 'jogo',
      feed: [
        ...get().feed,
        nf(`Você segue para ${alvo?.nome ?? destino}.`, 'sistema'),
        nf(cena.narracao, 'narracao'),
      ],
    });
    await salvarCampanha(camp);
    checarCapitulo(get, set);
  },

  async setConfig(patch) {
    const config = { ...get().config, ...patch };
    await salvarConfig(config);
    set({ config });
  },

  async proximoCapitulo() {
    const { content, camp } = get();
    if (!content || !camp) return;
    camp.capitulo = {
      numero: camp.capitulo.numero + 1,
      titulo: `Capítulo ${romano(camp.capitulo.numero + 1)}`,
      periodosDecorridos: 0,
    };
    const cena = montarCena(content, { ...camp });
    set({
      camp: { ...camp },
      cena,
      tela: 'jogo',
      feed: [
        nf(`— ${camp.capitulo.titulo} —`, 'sistema'),
        nf(cena.narracao, 'narracao'),
      ],
    });
    await salvarCampanha(camp);
  },

  async testarChaveApi() {
    const { config } = get();
    if (!config.apiKey) return { ok: false, erro: 'Sem chave.' };
    const { testarChave } = await import('@/engine');
    return testarChave({ apiKey: config.apiKey, modelo: config.modelo });
  },
}));

function romano(n: number): string {
  const m = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return m[n] ?? String(n);
}

async function executar(
  get: () => GameState,
  set: (p: Partial<GameState>) => void,
  intencao: Parameters<typeof resolverIntencao>[2],
  _tipo?: string,
) {
  const { content, camp, config } = get();
  if (!content || !camp || get().ocupado) return;
  set({ ocupado: true });

  const r = resolverIntencao(content, camp, intencao);
  camp.capitulo.periodosDecorridos += r.custoPeriodos;

  const { narracao, eco } = narrarResultado(camp, r);
  const novasEntradas: EntradaFeed[] = [nf(narracao, 'narracao')];
  if (eco) novasEntradas.push(nf(eco, 'eco'));

  // Revela segredo do alvo se o verbo/flag indicar (gatilho simples de descoberta).
  talvezRevelarSegredo(camp, r.alvo);

  const cena = montarCena(content, { ...camp });
  set({ camp: { ...camp }, cena, feed: [...get().feed, ...novasEntradas], ocupado: false });
  await salvarCampanha(camp);

  // Narração ao vivo pelo modelo, se configurado (substitui o fallback).
  if (config.usarModelo && config.apiKey && cena.contexto) {
    const idAlvo = novasEntradas[0].id;
    const texto = await narrarComModelo(
      { apiKey: config.apiKey, modelo: config.modelo },
      content,
      camp,
      cena.contexto,
      r,
    );
    if (texto) {
      set({
        feed: get().feed.map((e) => (e.id === idAlvo ? { ...e, texto } : e)),
      });
    }
  }

  checarCapitulo(get, set);
}

// Descoberta de segredo: se o jogador vigiou/ouviu/ganhou confiança alta.
function talvezRevelarSegredo(camp: Campaign, alvo?: NPC) {
  if (!alvo || !alvo.segredo) return;
  const din = camp.npcState[alvo.id];
  const confiancaAlta = (din?.eixos.confianca ?? 0) >= 12;
  const vigiado = camp.flags[`vigiou.${alvo.id}`] === true;
  if ((confiancaAlta || vigiado) && !camp.segredosRevelados.includes(alvo.id)) {
    camp.segredosRevelados.push(alvo.id);
  }
}

function checarCapitulo(get: () => GameState, set: (p: Partial<GameState>) => void) {
  const camp = get().camp;
  if (!camp) return;
  if (camp.capitulo.periodosDecorridos >= CAPITULO_MAX_PERIODOS) {
    set({ tela: 'fimcapitulo' });
  }
}
