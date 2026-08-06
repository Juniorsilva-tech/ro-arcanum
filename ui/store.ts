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
  narrarComFallback,
  CAPITULO_MAX_PERIODOS,
  equipar as equiparEngine,
  desequipar as desequiparEngine,
  usarConsumivel,
  comprar as comprarEngine,
  vender as venderEngine,
  iniciarCombate,
  jogadorAtaca,
  jogadorDefende,
  jogadorConjura,
  jogadorUsaItemCombate,
  jogadorFoge,
  fecharCombate,
  verificarQuests,
  aprenderArte as aprenderArteEngine,
  conjurarLivre,
  type OpcaoResolvida,
  type Contexto,
} from '@/engine';
import { bundlePorId, encontrosPorTipo } from '@/content';
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
  | 'inventario'
  | 'loja'
  | 'combate'
  | 'missoes'
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
  iaStatus: 'off' | 'pensando' | 'ok' | 'erro';
  iaErro?: string;

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
  equiparItem: (id: string) => Promise<void>;
  desequiparSlot: (slot: 'arma' | 'armadura' | 'escudo' | 'acessorio') => Promise<void>;
  usarItem: (id: string) => Promise<void>;
  comprarItem: (id: string) => Promise<void>;
  venderItem: (id: string) => Promise<void>;
  iniciarLutaLocal: () => void;
  iniciarLuta: (criaturaIds: string[]) => void;
  combAtacar: (alvoId: string) => Promise<void>;
  combDefender: () => Promise<void>;
  combConjurar: (arteId: string, alvoId?: string) => Promise<void>;
  combUsar: (itemId: string) => Promise<void>;
  combFugir: () => Promise<void>;
  fecharLuta: () => Promise<void>;
  aprenderArteAcao: (arteId: string) => Promise<void>;
  conjurarArteLivre: (arteId: string) => Promise<void>;
  acaoLivre: (texto: string) => Promise<void>;
  viajar: (destino: string) => Promise<void>;

  setConfig: (patch: Partial<ConfigApp>) => Promise<void>;
  proximoCapitulo: () => Promise<void>;
  testarChaveApi: () => Promise<{ ok: boolean; erro?: string }>;
  buscarModelosGratis: () => Promise<string[]>;
  testarNarracaoReal: () => Promise<{ ok: boolean; amostra?: string; erro?: string; modelo?: string }>;
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
  iaStatus: 'off',

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
    // Comprar/vender abrem a Loja em vez de gastar um turno.
    if (verboId === 'comprar' || verboId === 'vender') {
      get().irPara('loja');
      return;
    }
    // Verbos que abrem combate.
    if (verboId === 'cacar') {
      get().iniciarLutaLocal();
      return;
    }
    if (verboId === 'confrontar_vess') {
      get().iniciarLuta(['vess_fiador']);
      return;
    }
    await executar(get, set, { tipo: 'verbo', verboId, alvoId }, 'acao');
  },

  async equiparItem(id) {
    const { content, camp } = get();
    if (!content || !camp) return;
    equiparEngine(content, camp, id);
    set({ camp: { ...camp } });
    await salvarCampanha(camp);
  },
  async desequiparSlot(slot) {
    const { camp } = get();
    if (!camp) return;
    desequiparEngine(camp, slot);
    set({ camp: { ...camp } });
    await salvarCampanha(camp);
  },
  async usarItem(id) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const r = usarConsumivel(content, camp, id);
    set({
      camp: { ...camp },
      feed: r.ok ? [...get().feed, nf('Você usa e o corpo responde.', 'sistema')] : get().feed,
    });
    await salvarCampanha(camp);
  },
  async comprarItem(id) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const desconto = camp.flags['desconto'] === true;
    comprarEngine(content, camp, id, desconto);
    set({ camp: { ...camp } });
    await salvarCampanha(camp);
  },
  async venderItem(id) {
    const { content, camp } = get();
    if (!content || !camp) return;
    venderEngine(content, camp, id);
    set({ camp: { ...camp } });
    await salvarCampanha(camp);
  },

  // ── Combate ──────────────────────────────────────────────
  iniciarLutaLocal() {
    const { content, camp } = get();
    if (!content || !camp) return;
    const local = content.locais.find((l) => l.id === camp.localAtual);
    const pool = encontrosPorTipo[local?.tipo ?? ''] ?? ['cao_selvagem'];
    const count = 1 + (Math.random() < 0.4 ? 1 : 0);
    const ids = Array.from({ length: count }, () => pool[Math.floor(Math.random() * pool.length)]);
    iniciarCombate(content, camp, ids);
    set({ camp: { ...camp }, tela: 'combate' });
    void salvarCampanha(camp);
  },
  iniciarLuta(criaturaIds) {
    const { content, camp } = get();
    if (!content || !camp) return;
    iniciarCombate(content, camp, criaturaIds);
    set({ camp: { ...camp }, tela: 'combate' });
    void salvarCampanha(camp);
  },
  async combAtacar(alvoId) {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    jogadorAtaca(content, camp, alvoId);
    set({ camp: { ...camp } });
    await salvarCampanha(camp);
  },
  async combDefender() {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    jogadorDefende(content, camp);
    set({ camp: { ...camp } });
    await salvarCampanha(camp);
  },
  async combConjurar(arteId, alvoId) {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    const r = jogadorConjura(content, camp, arteId, alvoId);
    if (!r.ok && r.motivo) camp.combate.log.push(`Não deu: ${r.motivo}.`);
    set({ camp: { ...camp } });
    await salvarCampanha(camp);
  },
  async combUsar(itemId) {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    const r = jogadorUsaItemCombate(content, camp, itemId);
    if (!r.ok && r.motivo) camp.combate.log.push(`Não deu: ${r.motivo}.`);
    set({ camp: { ...camp } });
    await salvarCampanha(camp);
  },
  async combFugir() {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    jogadorFoge(content, camp);
    set({ camp: { ...camp } });
    await salvarCampanha(camp);
  },
  async fecharLuta() {
    const { content, camp } = get();
    if (!content || !camp) return;
    const resultado = camp.combate?.resultado;
    const rec = camp.combate?.recompensa;
    fecharCombate(camp);
    const cena = montarCena(content, { ...camp });
    const linhas: EntradaFeed[] = [];
    if (resultado === 'vitoria') linhas.push(nf(`Você venceu o combate${rec?.xp ? ` (+${rec.xp} xp)` : ''}.`, 'sistema'));
    else if (resultado === 'derrota') linhas.push(nf('Você foi derrotado, mas sobreviveu — ferido.', 'sistema'));
    else if (resultado === 'fuga') linhas.push(nf('Você escapou do combate.', 'sistema'));
    set({ camp: { ...camp }, cena, tela: 'jogo', feed: [...get().feed, ...linhas] });
    await salvarCampanha(camp);
    const concl = verificarQuests(content, camp);
    if (concl.length) set({ feed: [...get().feed, ...concl.map((t) => nf(`Missão concluída: ${t}.`, 'sistema'))] });
  },

  // ── Magia ────────────────────────────────────────────────
  async aprenderArteAcao(arteId) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const r = aprenderArteEngine(content, camp, arteId);
    if (r.ok) {
      camp.calendario = avancarPeriodos(camp.calendario, 2);
      crescerImpulsos(camp, 2);
      camp.capitulo.periodosDecorridos += 2;
      const arte = content.artes.find((a) => a.id === arteId);
      set({ camp: { ...camp }, feed: [...get().feed, nf(`Você aprendeu ${arte?.nome ?? arteId}.`, 'sistema')] });
    } else {
      set({ feed: [...get().feed, nf(`Não deu para aprender: ${r.motivo}.`, 'sistema')] });
    }
    await salvarCampanha(camp);
    checarCapitulo(get, set);
  },
  async conjurarArteLivre(arteId) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const r = conjurarLivre(content, camp, arteId);
    set({
      camp: { ...camp },
      feed: [...get().feed, nf(r.ok ? r.texto! : `Falha: ${r.motivo}.`, r.ok ? 'narracao' : 'sistema')],
    });
    await salvarCampanha(camp);
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
    return testarChave({ provider: config.provider, apiKey: config.apiKey, modelo: config.modelo });
  },

  async buscarModelosGratis() {
    const { config } = get();
    const { listarModelosOpenRouter } = await import('@/engine');
    const modelos = await listarModelosOpenRouter(config.apiKey, true);
    return modelos.map((m) => m.id);
  },

  // Diagnóstico honesto: roda o MESMO caminho do jogo e mostra o que voltou.
  async testarNarracaoReal() {
    const { config } = get();
    if (!config.apiKey) return { ok: false, erro: 'Sem chave salva.' };
    const content = get().content ?? bundlePorId('vaelhorn')!;
    const camp =
      get().camp ??
      criarCampanha(content, {
        nome: 'Teste',
        atributos: atributosBase(),
        classeId: content.classes[0].id,
        origemId: content.origens[0].id,
        seedString: 'diagnostico',
      });
    const cena = montarCena(content, camp);
    const r = {
      fato: 'Você entrou na taverna e olhou em volta — sucesso.',
      custoPeriodos: 0,
      efeitosAplicados: [],
    } as unknown as Parameters<typeof narrarComFallback>[4];
    const res = await narrarComFallback(
      { provider: config.provider, apiKey: config.apiKey, modelo: config.modelo },
      content,
      camp,
      cena.contexto,
      r,
    );
    if (res.texto) {
      return { ok: true, amostra: res.texto.slice(0, 220), modelo: res.modeloUsado ?? config.modelo };
    }
    return { ok: false, erro: res.erro ?? 'sem resposta' };
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

  // Missões concluídas neste turno.
  const concl = verificarQuests(content, camp);
  if (concl.length) {
    set({ camp: { ...camp }, feed: [...get().feed, ...concl.map((t) => nf(`Missão concluída: ${t}.`, 'sistema'))] });
  }

  // Narração ao vivo pelo modelo: reescreve o texto E propõe as novas opções
  // de cena (§18.2). O menu fixo de verbos continua embaixo, sempre.
  if (config.usarModelo && config.apiKey && cena.contexto) {
    const idAlvo = novasEntradas[0].id;
    set({ iaStatus: 'pensando', iaErro: undefined });
    const res = await narrarComFallback(
      { provider: config.provider, apiKey: config.apiKey, modelo: config.modelo },
      content,
      camp,
      cena.contexto,
      r,
    );
    if (res.texto) {
      const cenaAtual = get().cena;
      const opcoesIA: OpcaoResolvida[] = (res.opcoes ?? []).map((o, i) => ({
        id: `ia_${camp.turno}_${i}`,
        rotulo: o.rotulo,
        dica: o.dica,
        custoPeriodos: o.custoPeriodos,
        teste: o.teste
          ? {
              atributo: o.teste.atributo as AttrKey,
              pericia: o.teste.pericia,
              dificuldade: o.teste.dificuldade,
            }
          : undefined,
        origem: 'cena',
      }));
      set({
        feed: get().feed.map((e) => (e.id === idAlvo ? { ...e, texto: res.texto! } : e)),
        cena:
          cenaAtual && opcoesIA.length > 0
            ? { ...cenaAtual, opcoes: [...opcoesIA, ...opcoesFixas(cenaAtual.opcoes)] }
            : cenaAtual,
        iaStatus: 'ok',
      });
    } else if (res.erro) {
      // Não silencia: mostra por que a IA não respondeu (§20 mantém o jogo de pé).
      set({
        iaStatus: 'erro',
        iaErro: res.erro,
        feed: [...get().feed, nf(`IA indisponível — narração local. (${res.erro})`, 'sistema')],
      });
    }
  }

  checarCapitulo(get, set);
}

// Mantém só a opção canônica de "deixar o tempo correr" abaixo das da IA.
function opcoesFixas(opcoes: OpcaoResolvida[]): OpcaoResolvida[] {
  return opcoes.filter((o) => o.id === 'deixar_correr');
}

// Descoberta de segredo: se o jogador vigiou/ouviu/ganhou confiança alta.
function talvezRevelarSegredo(camp: Campaign, alvo?: NPC) {
  if (!alvo || !alvo.segredo) return;
  const din = camp.npcState[alvo.id];
  const confiancaAlta = (din?.eixos.confianca ?? 0) >= 12;
  const vigiado = camp.flags[`vigiou.${alvo.id}`] === true;
  if ((confiancaAlta || vigiado) && !camp.segredosRevelados.includes(alvo.id)) {
    camp.segredosRevelados.push(alvo.id);
    camp.flags[`segredo.${alvo.id}`] = true;
  }
}

function checarCapitulo(get: () => GameState, set: (p: Partial<GameState>) => void) {
  const camp = get().camp;
  if (!camp) return;
  if (camp.capitulo.periodosDecorridos >= CAPITULO_MAX_PERIODOS) {
    set({ tela: 'fimcapitulo' });
  }
}
