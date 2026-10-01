// ARCANUM · Store da aplicação (Zustand). Orquestra engine, narração e save.
import { create } from 'zustand';
import type { Campaign, ContentBundle, Atributos, AttrKey, NPC, MarcaInfancia, ReacaoInfancia } from '@/engine/types';
import type { ModeloOR } from '@/engine';
import {
  criarCampanha,
  montarCena,
  consumirAvisos,
  resolverIntencao,
  avancarPeriodos,
  crescerImpulsos,
  atributosBase,
  narrarComFallback,
  tipoDeCena,
  concluirRito,
  concluirBriga,
  disseONome,
  apresentar,
  protegerNome,
  sabeONome,
  batidaDeCombate,
  PROVEDORES_GRATIS,
  narrarComModeloStream,
  CAPITULO_MAX_PERIODOS,
  equipar as equiparEngine,
  desequipar as desequiparEngine,
  usarConsumivel,
  comprar as comprarEngine,
  vender as venderEngine,
  iniciarCombate,
  jogadorAtaca,
  jogadorDefende,
  jogadorAcaoTatica,
  encontrosElegiveis,
  type AcaoTatica,
  ajudarReconstrucao,
  jogadorConjura,
  jogadorUsaItemCombate,
  jogadorFoge,
  fecharCombate,
  verificarQuests,
  aprenderArte as aprenderArteEngine,
  conjurarLivre,
  fundirEscolas,
  tentarAscender,
  processarEnvelhecimentoJogador,
  fatoDeAbertura,
  artePorId,
  viajar,
  nextFloat,
  pick,
  chaveRotulo,
  montarGrade,
  avancarMundo,
  normalizarCampanha,
  registrarMarco,
  registrarNaCronica,
  NOME_PERIODO,
  PERIODOS,
  type OpcaoResolvida,
  type Contexto,
  resolverEtapaInfancia,
  concluirPrologoInfancia,
  resgatarParente,
  intervirNaGuerra,
  alternarCompanheiro,
  executarAcaoMundo,
  type AcaoMundo,
  obterTokenNousAtual,
  iniciarMonitoramentoNous,
  jwtExpirado,
  acolherTriboWasteland,
  definirAlocacaoTrabalho,
  iniciarProjetoConstrucao,
  avancarCicloSubespaco,
  definirEstrategiaCompanhia,
  despacharCaravanaMercantil,
  ativarSakai,
  processarAcaoLivreKai,
  executarTreinoConcentracaoQuaseMorte,
  type SetorTrabalhoSubespaco,
  type TriboAcolhida,
  type EstrategiaCompanhia,
  type ModoKai,
  obterFeudo,
  fundarFeudo,
  iniciarObraFeudo,
  avancarObrasFeudo,
  despacharCaravanaFeudo,
  definirRotaPatrulhaFeudo,
  processarCicloReino,
  fundarColonia,
  reacenderFarol,
  aceitarChegada,
  recusarChegada,
  comprarAnimais,
  abaterAnimais,
  resolverAudiencia,
  decidirAssembleia,
  designarFuncao,
  fundarCasaDinastica,
  nomearConselheiro,
  removerConselheiro,
  recrutarOficial,
  promoverOficial,
  designarMissaoOficial,
  treinarOficiais,
  celebrarCasamento,
  iniciarGestacao,
  darLuzHerdeiro,
  designarHerdeiroAparente,
  concederFeudoVassalo,
  convocarLevasVassalos,
  convocarAssembleiaGuerra,
  firmarTratadoPaz,
  iniciarTramaUsurpacao,
  type TipoEdificioModular,
  type CargaCaravana,
  type BiomaFeudo,
  type CargoConselho,
  type DesignacaoOficial,
  type PatenteMilitar,
  pagarPedagio,
  talvezRevelarSegredo,
} from '@/engine';
import { bundlePorId, encontrosPorTipo } from '@/content';
import {
  salvarCampanha,
  carregarCampanha,
  carregarCampanhaDetalhado,
  carregarSlotAtivo,
  migrarSaveAntigo,
  apagarCampanha,
  salvarSessao,
  carregarSessao,
  apagarSessao,
  salvarConfig,
  carregarConfig,
  configPadrao,
  exportarCampanha,
  importarCampanha,
  slotAtual,
  type ConfigApp,
} from './storage';

import { classificarAcaoLivre } from './freeAction';

export type Tela =
  | 'entrada'
  | 'aviso17'
  | 'cenario'
  | 'classe'
  | 'origem'
  | 'infancia'
  | 'criacao'
  | 'prologo'
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
  | 'assentamento'
  | 'fimcapitulo';

export type EntradaFeed = {
  id: string;
  texto: string;
  tipo: 'narracao' | 'eco' | 'sistema' | 'acao';
  // Abre um turno novo na tela: a interface desenha o separador e o cabeçalho.
  // Sem isso o feed vira um rolo só e ninguém sabe onde uma ação terminou.
  abreTurno?: boolean;
  cabecalho?: string;
  // Quem narrou esta cena (provedor · modelo). O rodízio de reservas e o
  // fallback trocam de modelo sem avisar; a tela mostra qual respondeu.
  modelo?: string;
};

// O retrato exato da tela — feed e cena correntes — persistido à parte da
// campanha (ver ui/storage.ts, K_SESSAO). É o que deixa "continuar" retomar
// EXATAMENTE de onde parou, em vez de pedir pro narrador inventar uma cena
// nova (o que às vezes saía até com fala inventada na boca do jogador).
type SessaoSalva = {
  feed: EntradaFeed[];
  cena?: { narracao: string; opcoes: OpcaoResolvida[]; contexto: Contexto };
  // O turno que esperava o narrador. A engine já aplicou a ação; sem isto,
  // recarregar a página perdia a narração dela (a fala ficava sem resposta).
  pendente?: GameState['pendente'];
};

type Rascunho = {
  cenarioId?: string;
  classeId?: string;
  origemId?: string;
  nome: string;
  atributos: Atributos;
  marcaInfancia?: MarcaInfancia;
  reacaoInfancia?: ReacaoInfancia;
};

const ATTR_MIN = 8;
const ATTR_MAX = 16;
const PONTOS_TOTAIS = 66; // 6×10 + 6 de distribuição

let feedSeq = 0;
// O feed volta do save com ids f0, f1…; sem renumerar, as entradas novas
// repetiam esses ids (e saves antigos já vinham repetidos) e o React
// misturava as linhas.
function renumerarFeed<T extends { id: string }>(feed: T[]): T[] {
  feedSeq = 0;
  return feed.map((e) => ({ ...e, id: `f${feedSeq++}` }));
}
const nf = (
  texto: string,
  tipo: EntradaFeed['tipo'],
  extra?: { abreTurno?: boolean; cabecalho?: string },
): EntradaFeed => ({
  id: `f${feedSeq++}`,
  texto,
  tipo,
  ...extra,
});

// Cabeçalho curto do turno: onde e quando aquilo aconteceu.
function marcaDoTurno(content: ContentBundle, camp: Campaign): string {
  const local = content.locais.find((l) => l.id === camp.localAtual);
  return `${local?.nome ?? ''} · ${NOME_PERIODO[PERIODOS[camp.calendario.periodoIndex % PERIODOS.length]]}`;
}

// Guarda o que já foi oferecido para a IA nunca repetir uma opção (§18.2).
function lembrarOpcao(camp: Campaign, rotulo: string) {
  const lista = camp.opcoesUsadas ?? (camp.opcoesUsadas = []);
  const chave = chaveRotulo(rotulo);
  if (!lista.some((r) => chaveRotulo(r) === chave)) lista.push(rotulo);
  if (lista.length > 60) lista.splice(0, lista.length - 60);
}

// A IA só sugere o id; quem entrega o item é a engine, e só se o id existir
// mesmo na base. Assim o que aparece na narração é o que entra na bolsa.
function entregarAchado(
  content: ContentBundle,
  camp: Campaign,
  id?: string,
): EntradaFeed | undefined {
  if (!id) return undefined;
  const item = content.itens.find((i) => i.id === id);
  if (!item) return undefined;
  camp.personagem.inventario[item.id] = (camp.personagem.inventario[item.id] ?? 0) + 1;
  return nf(`Você guarda: ${item.nome}.`, 'sistema');
}

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
  /**
   * Ultimo problema ou aviso do save. A camada antiga engolia falha de
   * gravacao em silencio; agora o erro sobe ate aqui e a tela mostra.
   */
  avisoSave?: string;
  config: ConfigApp;
  rascunho: Rascunho;
  iaStatus: 'off' | 'pensando' | 'ok' | 'erro';
  textoStreaming?: string;
  iaErro?: string;
  // Turno já resolvido pela engine, esperando o narrador. Guardar isso é o que
  // permite tentar de novo sem repetir a ação nem gastar tempo do mundo.
  pendente?: { fato: string; acaoLivre?: string; extra?: ExtraNarracao };
  // Texto da aba Dizer: a próxima narração o trata como fala do jogador.
  falaJogador?: string;
  // O jogador pediu o narrador local depois de uma falha: fica até mexer na configuração.
  iaSuspensa?: boolean;

  init: () => Promise<void>;
  irPara: (t: Tela) => void;
  voltar: () => void;

  novoJogo: () => void;
  continuar: () => Promise<void>;
  aceitarAviso: () => Promise<void>;
  escolherCenario: (id: string) => void;
  escolherClasse: (id: string) => void;
  escolherOrigem: (id: string) => void;
  escolherMarcaInfancia: (id: MarcaInfancia) => void;
  escolherReacaoInfancia: (id: ReacaoInfancia) => void;
  ajustarAtributo: (k: AttrKey, delta: number) => void;
  setNome: (n: string) => void;
  pontosRestantes: () => number;
  iniciarCampanha: () => Promise<void>;
  avancarInfancia: (opcaoId: string) => Promise<void>;
  pularInfancia: () => Promise<void>;
  resgatarFamiliar: (id: string, modo: 'resgate' | 'infiltracao') => Promise<void>;
  alternarCompanheiroAcao: (id: string) => Promise<string>;
  apoiarFaccao: (id: string) => Promise<void>;
  abandonar: () => Promise<void>;

  acolherTriboAcao: (triboId: TriboAcolhida['id']) => Promise<string>;
  definirAlocacaoTrabalhoAcao: (alocacao: Partial<Record<SetorTrabalhoSubespaco, number>>) => Promise<string>;
  iniciarConstrucaoAcao: (projetoId: string) => Promise<string>;
  avancarCicloSubespacoAcao: () => Promise<string>;
  definirEstrategiaCompanhiaAcao: (estrategia: EstrategiaCompanhia) => Promise<string>;
  despacharCaravanaAcao: () => Promise<string>;
  alternarSakaiModoAcao: (modo: ModoKai) => Promise<string>;
  executarTreinoQuaseMorteAcao: () => Promise<string>;

  fundarFeudoAcao: (nome: string, localId: string, bioma?: BiomaFeudo) => Promise<string>;
  fundarColoniaAcao: (nome: string) => Promise<string>;
  reacenderFarolAcao: () => Promise<string>;
  aceitarChegadaAcao: (id: string) => Promise<string>;
  resolverAudienciaAcao: (opcaoId: string) => Promise<string>;
  decidirAssembleiaAcao: (entrada: string | import('@/engine').Preparacao[]) => Promise<string>;
  comprarAnimaisAcao: (especie: import('@/engine').AnimalColonia, qtd: number) => Promise<string>;
  abaterAnimaisAcao: (especie: import('@/engine').AnimalColonia, qtd: number) => Promise<string>;
  plantarCultivoAcao: (id: import('@/engine').CultivoId) => Promise<string>;
  pedirRitoAcao: (mestreId: string) => Promise<void>;
  brigarAcao: (npcIds: string[], letal: boolean, texto?: string) => Promise<void>;
  criarTecnicaAcao: (nome: string, principio: import('@/engine').Principio, forma: import('@/engine').Forma) => Promise<string>;
  passarLegadoAcao: (herdeiroId?: string) => Promise<string>;
  recusarChegadaAcao: (id: string) => Promise<string>;
  designarFuncaoAcao: (colonoId: string, oficio?: import('@/engine').OficioColonia) => Promise<string>;
  iniciarObraFeudoAcao: (tipo: TipoEdificioModular) => Promise<string>;
  despacharCaravanaFeudoAcao: (destinoId: string, destinoNome: string, cargaTipo: CargaCaravana) => Promise<string>;
  definirPatrulhaFeudoAcao: (regiaoAlvo: string, nomeRegiao: string, soldados: number) => Promise<string>;
  supervisionarObrasAcao: () => Promise<string>;
  fundarCasaDinasticaAcao: (nome: string, lema: string, corPrimaria?: string, corSecundaria?: string, figura?: string) => Promise<string>;
  nomearConselheiroAcao: (cargo: CargoConselho, npcId: string, nomeNpc: string) => Promise<string>;
  removerConselheiroAcao: (cargo: CargoConselho) => Promise<string>;
  recrutarOficialAcao: (npcId: string, nomeNpc: string) => Promise<string>;
  promoverOficialAcao: (oficialId: string) => Promise<string>;
  designarMissaoOficialAcao: (oficialId: string, designacao: DesignacaoOficial) => Promise<string>;
  treinarOficiaisAcao: (oficialId?: string) => Promise<string>;
  celebrarCasamentoAcao: (npcId: string, nomeNpc: string) => Promise<string>;
  iniciarGestacaoAcao: () => Promise<string>;
  darLuzHerdeiroAcao: (nomeBebe: string, genero: 'm' | 'f') => Promise<string>;
  designarHerdeiroAparenteAcao: (filhoId: string) => Promise<string>;
  concederFeudoVassaloAcao: (lordeNpcId: string, nomeLorde: string, feudoCedidoId: string, nomeFeudo: string) => Promise<string>;
  convocarLevasVassalosAcao: () => Promise<string>;
  convocarAssembleiaGuerraAcao: (alvoCidadeId: string, casusBelli: string) => Promise<string>;
  firmarTratadoPazAcao: () => Promise<string>;
  iniciarTramaUsurpacaoAcao: (alvoCidadeId: string, alvoNome: string, liderNpcId: string, liderNome: string) => Promise<string>;

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
  reconstruirLocal: () => Promise<void>;
  acaoMundo: (acao: AcaoMundo) => Promise<void>;
  cacarAmeaca: (id: string) => void;
  combTatica: (acao: AcaoTatica, alvoId?: string) => Promise<void>;
  combConjurar: (arteId: string, alvoId?: string) => Promise<void>;
  combUsar: (itemId: string) => Promise<void>;
  combFugir: () => Promise<void>;
  combPagarPedagio: () => Promise<void>;
  fecharLuta: () => Promise<void>;
  aprenderArteAcao: (arteId: string) => Promise<void>;
  conjurarArteLivre: (arteId: string) => Promise<void>;
  fundirEstilos: (escolaA: string, escolaB: string, nome: string) => Promise<void>;
  ascender: () => Promise<void>;
  jogarCartaMemoria: (id: string) => Promise<void>;
  acaoLivre: (texto: string, tipo?: 'fazer' | 'dizer') => Promise<void>;
  lembrarNarrador: (texto: string) => Promise<void>;
  esquecerLembrete: (indice: number) => Promise<void>;
  viajar: (destino: string) => Promise<void>;

  setConfig: (patch: Partial<ConfigApp>) => Promise<void>;
  proximoCapitulo: () => Promise<void>;
  testarChaveApi: () => Promise<{ ok: boolean; erro?: string }>;
  renovarHermes: () => Promise<{ ok: boolean; token?: string; erro?: string }>;
  buscarModelosGratis: () => Promise<ModeloOR[]>;
  testarSeNarraAdulto: (modeloEspecifico?: string) => Promise<{ narra: boolean; recusou: boolean; amostra?: string; erro?: string; modelo?: string }>;
  testarNarracaoReal: (modeloEspecifico?: string) => Promise<{ ok: boolean; amostra?: string; texto?: string; opcoes?: number; erro?: string; modelo?: string }>;
  tentarNarrarDeNovo: () => Promise<void>;
  desistirIaEUsarLocal: () => Promise<void>;
  exportarSave: () => Promise<void>;
  importarSave: (json: string) => Promise<void>;
}

// Verbos que abrem direto a luta contra um chefe (GDD §17).
const CHEFES_POR_VERBO: Record<string, string> = {
  confrontar_vess: 'vess_fiador',
  chamar_o_afogado: 'o_afogado_do_espelho',
  encarar_a_que_queimou: 'a_que_queimou_mir',
  romper_o_selo: 'o_selado',
};

function recomputarCena(get: () => GameState, set: (p: Partial<GameState>) => void) {
  const { content, camp } = get();
  if (!content || !camp) return;
  const cena = montarCena(content, camp);
  set({ cena });
}

function chaveEfetiva(cfg: ConfigApp): string | undefined {
  const manual = cfg.apiKey?.trim();
  if (cfg.provider === 'nous') {
    // Para o provedor Nous, prioriza o token dinâmico atualizado pelo Hermes
    const bridgeToken = obterTokenNousAtual();
    if (bridgeToken && !jwtExpirado(bridgeToken, 60)) return bridgeToken;
    if (manual && !jwtExpirado(manual, 60)) return manual;
    const envKey = (typeof process !== 'undefined' && process.env?.NOUS_API_KEY_LOCAL) || '';
    if (envKey.trim() && !jwtExpirado(envKey.trim(), 60)) return envKey.trim();
    return bridgeToken || manual || envKey.trim() || undefined;
  } else if (manual) {
    return manual;
  }
  return undefined;
}

/**
 * Grava a campanha e faz o erro chegar a tela.
 *
 * Todas as gravacoes do jogo passam por aqui. A camada antiga tinha um
 * `catch {}` vazio com o comentario "perder um autosave nao deve travar o
 * jogo" — verdade, mas perder em SILENCIO e' pior: o jogador segue jogando
 * horas confiando num save que nao existe.
 */
async function persistir(camp: Campaign, set: (p: Partial<GameState>) => void): Promise<void> {
  const r = await salvarCampanha(camp);
  if (!r.ok) set({ avisoSave: `Não foi possível salvar: ${r.erro}` });
  else if (r.aviso) set({ avisoSave: r.aviso });
}

export const useGame = create<GameState>((set, get) => ({
  pronto: false,
  tela: 'entrada',
  telaAnterior: 'entrada',
  feed: [],
  ocupado: false,
  temSave: false,
  avisoSave: undefined,
  config: configPadrao,
  rascunho: { nome: '', atributos: atributosBase() },
  iaStatus: 'off',
  textoStreaming: undefined,

  async init() {
    iniciarMonitoramentoNous();
    const config = await carregarConfig();
    if (config.provider === 'nous') {
      try {
        const { renovarTokenNous } = await import('@/engine');
        void renovarTokenNous(false);
      } catch {}
    }
    await carregarSlotAtivo();
    // Save de antes dos slots vira slot 0. O antigo nao e' apagado.
    await migrarSaveAntigo();
    const r = await carregarCampanhaDetalhado();
    set({
      config,
      temSave: !!r.camp,
      avisoSave: r.aviso ?? r.erro,
      pronto: true,
    });
  },

  irPara(t) {
    set({ telaAnterior: get().tela, tela: t });
  },
  voltar() {
    const { tela, telaAnterior, rascunho } = get();
    if (tela === 'infancia' && rascunho.marcaInfancia) {
      set({ rascunho: { ...rascunho, marcaInfancia: undefined } });
      return;
    }
    set({ tela: telaAnterior === tela ? 'jogo' : telaAnterior });
  },

  novoJogo() {
    set({
      // O mundo é escolhido primeiro. Antes esta ação fixava 'vaelhorn' e pulava
      // direto para a classe, e a tela de cenário nunca era alcançada: a DLC
      // Tsukimichi estava registrada em content/index.ts e era impossível de
      // jogar pela interface. escolherCenario() segue para o aviso ou a classe.
      rascunho: { nome: '', atributos: atributosBase() },
      telaAnterior: 'entrada',
      tela: 'cenario',
    });
  },

  async continuar() {
    const r = await carregarCampanhaDetalhado();
    const bruto = r.camp;
    if (!bruto) { set({ avisoSave: r.erro ?? 'Não há campanha para continuar.' }); return; }
    // Recuperado de instantaneo: o jogador precisa saber quanto perdeu.
    if (r.aviso) set({ avisoSave: r.aviso });
    const content = bundlePorId(bruto.cenarioId);
    if (!content) return;
    // Save de uma versão anterior não pode virar tela branca: completa o que
    // falta e descarta o que aponta para gente ou item que não existe mais.
    const camp = normalizarCampanha(content, bruto);
    if (camp.familia && !camp.familia.prologoConcluido) {
      set({ camp, content, feed: [], cena: undefined, tela: 'prologo', ocupado: false });
      return;
    }
    if (camp.combate) {
      const sessaoCombate = await carregarSessao<SessaoSalva>();
      set({ camp, content, feed: renumerarFeed(sessaoCombate?.feed ?? []), cena: undefined, tela: 'combate', ocupado: false });
      return;
    }

    // O retrato exato da tela (ver ui/storage.ts, K_SESSAO): se existe,
    // retoma EXATAMENTE onde parou — mesmo texto, mesmas opções na tela,
    // sem pedir pro narrador inventar uma cena nova (era isso que às vezes
    // colocava fala na boca do jogador que ele nunca disse).
    const sessao = await carregarSessao<SessaoSalva>();
    if (sessao?.feed?.length) {
      const cena = sessao.cena ?? montarCena(content, camp);
      set({ camp, content, feed: renumerarFeed(sessao.feed), cena, tela: 'jogo', ocupado: false });
      if (sessao.pendente) {
        // Voltou com um turno sem narração: ele aparece esperando, com
        // "Tentar de novo" e "Usar narrador local", como numa falha de rede.
        set({ pendente: sessao.pendente, iaStatus: 'erro', iaErro: 'a narração foi interrompida quando a página fechou' });
      }
      return;
    }

    // Sem sessão salva (save de antes dessa funcionalidade existir, ou a
    // sessão não sobreviveu): melhor esforço, do jeito antigo.
    set({
      camp,
      content,
      feed: [nf('Você retoma de onde parou.', 'sistema', { abreTurno: true, cabecalho: marcaDoTurno(content, camp) })],
      tela: 'jogo',
      ocupado: true,
    });
    recomputarCena(get, set);
    await narrar(get, set, 'Você retoma a jornada de onde parou.');
  },

  async aceitarAviso() {
    const config = { ...get().config, avisoAceito: true };
    await salvarConfig(config);
    set({ config, tela: 'classe' });
  },

  escolherCenario(id) {
    set({
      rascunho: { ...get().rascunho, cenarioId: id },
      telaAnterior: 'cenario',
      tela: get().config.avisoAceito ? 'classe' : 'aviso17',
    });
  },
  escolherClasse(id) {
    set({ rascunho: { ...get().rascunho, classeId: id }, telaAnterior: 'classe', tela: 'origem' });
  },
  escolherOrigem(id) {
    set({ rascunho: { ...get().rascunho, origemId: id }, telaAnterior: 'origem', tela: 'infancia' });
  },
  escolherMarcaInfancia(id) {
    // Fica na mesma tela: ela passa a mostrar o segundo passo (a reação).
    set({ rascunho: { ...get().rascunho, marcaInfancia: id } });
  },
  escolherReacaoInfancia(id) {
    set({ rascunho: { ...get().rascunho, reacaoInfancia: id }, telaAnterior: 'infancia', tela: 'criacao' });
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
      marcaInfancia: r.marcaInfancia,
      reacaoInfancia: r.reacaoInfancia,
    });
    set({
      content,
      camp,
      cena: undefined,
      tela: 'prologo',
      temSave: true,
      feed: [],
      ocupado: false,
    });
    await persistir(camp, set);
  },

  async avancarInfancia(opcaoId) {
    const { content, camp } = get();
    if (!content || !camp?.familia) return;
    const resultado = resolverEtapaInfancia(content, camp, opcaoId);
    if (!resultado.ok) return;
    await persistir(camp, set);
    if (!resultado.concluida) {
      set({ camp: { ...camp } });
      return;
    }
    const cena = montarCena(content, camp);
    const grade = montarGrade(content, camp, cena.contexto, [], cena.opcoes);
    const memoria = camp.familia.historia.map(h => `Aos ${h.idade}: ${h.texto}`).join(' ');
    const genesePrefacio = camp.genese ? fatoDeAbertura(camp.genese, camp.personagem.nome) + ' ' : '';
    const textoAbertura = camp.cenarioId === 'tsukimichi'
      ? `Descartado da presença da Deusa, seu corpo abriu uma cratera na Grande Terra Desolada. Você se ergue sozinho nas terras calcinadas da Wasteland aos dezoito anos. Completamente só, sem ninguém ao seu lado e sem trilhos pré-determinados — apenas seu mana colossal, o domínio do Kai e um mundo desconhecido à sua frente. ${cena.narracao}`
      : `${genesePrefacio}${memoria} Aos dezoito anos, a vida adulta começa. ${cena.narracao}`;

    // Entrega a cena imediatamente com as opções da engine, sem travar em tela em branco
    set({
      camp: { ...camp },
      cena: { ...cena, opcoes: grade },
      tela: 'jogo',
      feed: [nf(textoAbertura, 'narracao')],
      ocupado: false,
    });
    await persistir(camp, set);

    const chave = chaveEfetiva(get().config);
    if (chave) {
      try {
        await narrar(get, set, textoAbertura, undefined, { modoCena: 'capitulo' });
      } catch {
        set({ ocupado: false });
      }
    }
  },

  async pularInfancia() {
    const { content, camp } = get();
    if (!content || !camp?.familia) return;
    concluirPrologoInfancia(content, camp);
    const cena = montarCena(content, camp);
    const grade = montarGrade(content, camp, cena.contexto, [], cena.opcoes);
    const genesePrefacio = camp.genese ? fatoDeAbertura(camp.genese, camp.personagem.nome) + ' ' : '';
    const textoAbertura = camp.cenarioId === 'tsukimichi'
      ? `Descartado da presença da Deusa, seu corpo atinge a Grande Terra Desolada em queda livre da estratosfera. Você se ergue sozinho na cratera da Wasteland aos dezoito anos. Nenhum aliado, nenhum caminho pré-programado: você é livre para explorar, treinar, caçar ou marchar para onde quiser. ${cena.narracao}`
      : `${genesePrefacio}A infância ficou para trás. Aos dezoito anos, sua vida adulta começa. ${cena.narracao}`;
    registrarNaCronica(camp, textoAbertura);
    set({
      camp: { ...camp },
      cena: { ...cena, opcoes: grade },
      tela: 'jogo',
      feed: [nf(textoAbertura, 'narracao')],
      ocupado: false,
    });
    await persistir(camp, set);
  },


  async resgatarFamiliar(id, modo) {
    const { camp } = get();
    if (!camp) return;
    const r = resgatarParente(camp, id, modo);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.texto, 'sistema')] });
    await persistir(camp, set);
  },

  async alternarCompanheiroAcao(id) {
    const { content, camp } = get();
    if (!content || !camp) return '';
    const npc = [...content.npcs, ...(camp.npcsProcedurais ?? [])].find(n => n.id === id);
    const r = alternarCompanheiro(content, camp, id);
    const texto = r.ok
      ? `${npc?.nome ?? id} ${r.entrou ? 'passou a acompanhar você' : 'deixou o grupo'}.`
      : r.motivo ?? 'Não foi possível mudar o grupo.';
    set({ camp: { ...camp }, feed: [...get().feed, nf(texto, 'sistema')] });
    await persistir(camp, set);
    return texto;
  },

  async acolherTriboAcao(triboId) {
    const { camp } = get();
    if (!camp) return '';
    const r = acolherTriboWasteland(camp, triboId);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async definirAlocacaoTrabalhoAcao(alocacao) {
    const { camp } = get();
    if (!camp) return '';
    const r = definirAlocacaoTrabalho(camp, alocacao);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async iniciarConstrucaoAcao(projetoId) {
    const { camp } = get();
    if (!camp) return '';
    const r = iniciarProjetoConstrucao(camp, projetoId);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async avancarCicloSubespacoAcao() {
    const { camp } = get();
    if (!camp) return '';
    const r = avancarCicloSubespaco(camp);
    const texto = r.eventos.length > 0 ? r.eventos.join(' | ') : 'Ciclo de Asora avançou sem eventos extraordinários.';
    set({ camp: { ...camp }, feed: [...get().feed, nf(texto, 'sistema')] });
    await persistir(camp, set);
    return texto;
  },

  async definirEstrategiaCompanhiaAcao(estrategia) {
    const { camp } = get();
    if (!camp) return '';
    const r = definirEstrategiaCompanhia(camp, estrategia);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async despacharCaravanaAcao() {
    const { camp } = get();
    if (!camp) return '';
    const r = despacharCaravanaMercantil(camp);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async alternarSakaiModoAcao(modo) {
    const { camp } = get();
    if (!camp) return '';
    const r = ativarSakai(camp, modo);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async executarTreinoQuaseMorteAcao() {
    const { camp } = get();
    if (!camp) return '';
    const r = executarTreinoConcentracaoQuaseMorte(camp);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async fundarColoniaAcao(nome) {
    const { camp, content } = get();
    if (!camp || !content) return '';
    const r = fundarColonia(content, camp, nome);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async decidirAssembleiaAcao(entrada) {
    const { camp } = get();
    if (!camp) return '';
    const r = decidirAssembleia(camp, entrada);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async resolverAudienciaAcao(opcaoId) {
    const { camp, content } = get();
    if (!camp) return '';
    const r = resolverAudiencia(camp, opcaoId, content ?? undefined);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async comprarAnimaisAcao(especie, qtd) {
    const { camp, content } = get();
    if (!camp || !content) return '';
    const r = comprarAnimais(content, camp, especie, qtd);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async abaterAnimaisAcao(especie, qtd) {
    const { camp } = get();
    if (!camp) return '';
    const r = abaterAnimais(camp, especie, qtd);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async criarTecnicaAcao(nome, principio, forma) {
    const { camp, content } = get();
    if (!camp || !content) return '';
    const { criarTecnica } = await import('@/engine');
    const r = criarTecnica(content, camp, nome, principio, forma);
    const texto = r.ok ? `Você inventou ${r.arte!.nome}.` : r.motivo ?? 'não deu';
    set({ camp: { ...camp }, feed: [...get().feed, nf(texto, 'sistema')] });
    await persistir(camp, set);
    return texto;
  },

  async passarLegadoAcao(herdeiroId?: string) {
    const { camp, content } = get();
    if (!camp || !content) return '';
    const { assumirLegado } = await import('@/engine');
    const r = assumirLegado(content, camp, 'legado', herdeiroId);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.texto, 'sistema')] });
    await persistir(camp, set);
    if (r.ok) await narrar(get, set, r.texto, undefined, { modoCena: 'capitulo' });
    return r.texto;
  },

  async pedirRitoAcao(mestreId) {
    const { camp, content } = get();
    if (!camp || !content) return;
    const { iniciarRito } = await import('@/engine');
    const r = iniciarRito(content, camp, mestreId);
    if (!r.ok) {
      set({ feed: [...get().feed, nf(r.motivo ?? 'o mestre recusou a prova', 'sistema')] });
      return;
    }
    set({ camp: { ...camp }, tela: 'combate' });
    await persistir(camp, set);
  },

  // Briga com quem está na cena (engine/briga.ts): soco nocauteia, lâmina mata.
  async brigarAcao(npcIds, letal, texto) {
    const { camp, content } = get();
    if (!camp || !content) return;
    const { iniciarBriga } = await import('@/engine');
    const linhaAcao = texto ? [nf(texto, 'acao', { abreTurno: true, cabecalho: marcaDoTurno(content, camp) })] : [];
    const r = iniciarBriga(content, camp, npcIds, letal);
    if (!r.ok) {
      set({ feed: [...get().feed, ...linhaAcao, nf(r.motivo ?? 'não há com quem brigar', 'sistema')] });
      return;
    }
    set({ camp: { ...camp }, tela: 'combate', feed: [...get().feed, ...linhaAcao] });
    await persistir(camp, set);
  },

  async plantarCultivoAcao(id) {
    const { camp, content } = get();
    if (!camp || !content) return '';
    const { plantar } = await import('@/engine');
    const r = plantar(content, camp, id);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.texto, 'sistema')] });
    await persistir(camp, set);
    return r.texto;
  },

  async aceitarChegadaAcao(id) {
    const { camp, content } = get();
    if (!camp || !content) return '';
    const r = aceitarChegada(content, camp, id);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async recusarChegadaAcao(id) {
    const { camp } = get();
    if (!camp) return '';
    const r = recusarChegada(camp, id);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async designarFuncaoAcao(colonoId, oficio) {
    const { camp } = get();
    if (!camp) return '';
    const r = designarFuncao(camp, colonoId, oficio);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async reacenderFarolAcao() {
    const { camp, content } = get();
    if (!camp || !content) return '';
    const r = reacenderFarol(content, camp);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async fundarFeudoAcao(nome, localId, bioma) {
    const { camp } = get();
    if (!camp) return '';
    const r = fundarFeudo(camp, nome, localId, bioma);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async iniciarObraFeudoAcao(tipo) {
    const { camp } = get();
    if (!camp) return '';
    const r = iniciarObraFeudo(camp, tipo);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async despacharCaravanaFeudoAcao(destinoId, destinoNome, cargaTipo) {
    const { camp } = get();
    if (!camp) return '';
    const r = despacharCaravanaFeudo(camp, destinoId, destinoNome, cargaTipo);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async definirPatrulhaFeudoAcao(regiaoAlvo, nomeRegiao, soldados) {
    const { camp } = get();
    if (!camp) return '';
    const r = definirRotaPatrulhaFeudo(camp, regiaoAlvo, nomeRegiao, soldados);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async supervisionarObrasAcao() {
    const { camp, content } = get();
    if (!camp || !content) return '';
    camp.turno++;
    // "Avançar 1 dia" é um dia inteiro: PERIODOS.length (6), não 4. Com 4, cada
    // clique andava dois terços de dia e a ameaça anunciada "em 3 dias" pedia
    // quatro cliques e meio.
    const umDia = PERIODOS.length;
    camp.capitulo.periodosDecorridos += umDia;
    camp.calendario = avancarPeriodos(camp.calendario, umDia);
    crescerImpulsos(camp, umDia);
    // avancarMundo já processa o dia do feudo; chamar processarCicloReino de
    // novo aqui contava a produção duas vezes.
    avancarMundo(content, camp);
    const msg = 'Você passou o dia supervisionando as obras, inspecionando os armazéns e organizando o feudo.';
    set({ camp: { ...camp }, feed: [...get().feed, nf(msg, 'sistema')] });
    await persistir(camp, set);
    recomputarCena(get, set);
    return msg;
  },

  async fundarCasaDinasticaAcao(nome, lema, corPrimaria, corSecundaria, figura) {
    const { camp } = get();
    if (!camp) return '';
    const r = fundarCasaDinastica(camp, nome, lema, corPrimaria, corSecundaria, figura);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async nomearConselheiroAcao(cargo, npcId, nomeNpc) {
    const { camp } = get();
    if (!camp) return '';
    const r = nomearConselheiro(camp, cargo, npcId, nomeNpc);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async removerConselheiroAcao(cargo) {
    const { camp } = get();
    if (!camp) return '';
    const r = removerConselheiro(camp, cargo);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async recrutarOficialAcao(npcId, nomeNpc) {
    const { camp } = get();
    if (!camp) return '';
    const r = recrutarOficial(camp, npcId, nomeNpc);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async promoverOficialAcao(oficialId) {
    const { camp } = get();
    if (!camp) return '';
    const r = promoverOficial(camp, oficialId);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async designarMissaoOficialAcao(oficialId, designacao) {
    const { camp } = get();
    if (!camp) return '';
    const r = designarMissaoOficial(camp, oficialId, designacao);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async treinarOficiaisAcao(oficialId) {
    const { camp } = get();
    if (!camp) return '';
    const r = treinarOficiais(camp, oficialId);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async celebrarCasamentoAcao(npcId, nomeNpc) {
    const { camp } = get();
    if (!camp) return '';
    const r = celebrarCasamento(camp, npcId, nomeNpc);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async iniciarGestacaoAcao() {
    const { camp } = get();
    if (!camp) return '';
    const r = iniciarGestacao(camp);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async darLuzHerdeiroAcao(nomeBebe, genero) {
    const { camp } = get();
    if (!camp) return '';
    const r = darLuzHerdeiro(camp, nomeBebe, genero);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async designarHerdeiroAparenteAcao(filhoId) {
    const { camp } = get();
    if (!camp) return '';
    const r = designarHerdeiroAparente(camp, filhoId);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async concederFeudoVassaloAcao(lordeNpcId, nomeLorde, feudoCedidoId, nomeFeudo) {
    const { camp } = get();
    if (!camp) return '';
    const r = concederFeudoVassalo(camp, lordeNpcId, nomeLorde, feudoCedidoId, nomeFeudo);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async convocarLevasVassalosAcao() {
    const { camp } = get();
    if (!camp) return '';
    const r = convocarLevasVassalos(camp);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async convocarAssembleiaGuerraAcao(alvoCidadeId, casusBelli) {
    const { camp } = get();
    if (!camp) return '';
    const r = convocarAssembleiaGuerra(camp, alvoCidadeId, casusBelli);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async firmarTratadoPazAcao() {
    const { camp } = get();
    if (!camp) return '';
    const r = firmarTratadoPaz(camp);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async iniciarTramaUsurpacaoAcao(alvoCidadeId, alvoNome, liderNpcId, liderNome) {
    const { camp } = get();
    if (!camp) return '';
    const r = iniciarTramaUsurpacao(camp, alvoCidadeId, alvoNome, liderNpcId, liderNome);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async apoiarFaccao(id) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const r = intervirNaGuerra(content, camp, id);
    const nome = content.faccoes.find(f => f.id === id)?.nome ?? id;
    const texto = r.ok ? `Você entrou na frente ao lado de ${nome}. O resultado ainda dependerá dos dias seguintes.` : r.motivo ?? 'Não foi possível intervir.';
    set({ camp: { ...camp }, feed: [...get().feed, nf(texto, 'sistema')] });
    await persistir(camp, set);
  },

  async abandonar() {
    await apagarCampanha();
    await apagarSessao();
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
    const chefe = CHEFES_POR_VERBO[verboId];
    if (chefe) {
      get().iniciarLuta([chefe]);
      return;
    }
    await executar(get, set, { tipo: 'verbo', verboId, alvoId }, 'acao');
  },

  async equiparItem(id) {
    const { content, camp } = get();
    if (!content || !camp) return;
    equiparEngine(content, camp, id);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },
  async desequiparSlot(slot) {
    const { camp } = get();
    if (!camp) return;
    desequiparEngine(camp, slot);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },
  async usarItem(id) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const r = usarConsumivel(content, camp, id);
    set({
      camp: { ...camp },
      feed: r.ok ? [...get().feed, nf('Você usa e o corpo responde.', 'sistema')] : get().feed,
    });
    await persistir(camp, set);
  },
  async comprarItem(id) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const desconto = camp.flags['desconto'] === true;
    const resultado = comprarEngine(content, camp, id, desconto);
    if (!resultado.ok) set({ feed: [...get().feed, nf(resultado.motivo ?? 'Compra indisponível.', 'sistema')] });
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },
  async venderItem(id) {
    const { content, camp } = get();
    if (!content || !camp) return;
    const resultado = venderEngine(content, camp, id);
    if (!resultado.ok) set({ feed: [...get().feed, nf(resultado.motivo ?? 'Venda indisponível.', 'sistema')] });
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },

  // ── Combate ──────────────────────────────────────────────
  async acaoMundo(acao) {
    const { camp, content, ocupado } = get();
    if (!camp || !content || ocupado) return;
    const r = executarAcaoMundo(content, camp, acao);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.texto, 'sistema')], ...(r.combate ? { tela: 'combate' as const } : {}) });
    await persistir(camp, set);
  },
  async reconstruirLocal() {
    const { camp } = get();
    if (!camp) return;
    const r = ajudarReconstrucao(camp);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.ok ? 'Você contribuiu com materiais para a reconstrução.' : r.motivo ?? 'Não foi possível.', 'sistema')] });
    await persistir(camp, set);
  },
  cacarAmeaca(id) {
    const { camp, content } = get();
    if (!camp || !content) return;
    const ameaca = camp.continuidade?.ameacas.find(a => a.id === id && a.estado !== 'resolvida' && a.descoberta);
    if (!ameaca || ameaca.local !== camp.localAtual) return;
    if (!encontrosElegiveis(content, camp, [ameaca.criaturaId]).length) {
      set({ feed: [...get().feed, nf('A criatura se esconde da luz. Retorne durante a noite.', 'sistema')] }); return;
    }
    get().iniciarLuta([ameaca.criaturaId]);
  },
  iniciarLutaLocal() {
    const { content, camp } = get();
    if (!content || !camp) return;
    const local = content.locais.find((l) => l.id === camp.localAtual);
    const pool = encontrosElegiveis(content, camp, encontrosPorTipo[local?.tipo ?? ''] ?? ['cao_selvagem']);
    if (!pool.length) { set({ feed: [...get().feed, nf('Não há uma ameaça acessível aqui agora.', 'sistema')] }); return; }
    // RNG determinístico da campanha, não Math.random() — senão o mesmo
    // save/seed produz combates diferentes a cada vez que você tenta de novo.
    const count = 1 + (nextFloat(camp.rng) < 0.4 ? 1 : 0);
    const ids = Array.from({ length: count }, () => pick(camp.rng, pool));
    iniciarCombate(content, camp, ids);
    set({ camp: { ...camp }, tela: 'combate' });
    void persistir(camp, set);
  },
  iniciarLuta(criaturaIds) {
    const { content, camp } = get();
    if (!content || !camp) return;
    iniciarCombate(content, camp, criaturaIds);
    set({ camp: { ...camp }, tela: 'combate' });
    void persistir(camp, set);
  },
  async combAtacar(alvoId) {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    jogadorAtaca(content, camp, alvoId);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },
  async combDefender() {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    jogadorDefende(content, camp);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },
  async combTatica(acao, alvoId) {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    jogadorAcaoTatica(content, camp, acao, alvoId);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },
  async combConjurar(arteId, alvoId) {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    const r = jogadorConjura(content, camp, arteId, alvoId);
    if (!r.ok && r.motivo) camp.combate.log.push(`Não deu: ${r.motivo}.`);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },
  async combUsar(itemId) {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    const r = jogadorUsaItemCombate(content, camp, itemId);
    if (!r.ok && r.motivo) camp.combate.log.push(`Não deu: ${r.motivo}.`);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },
  async combPagarPedagio() {
    const { camp } = get();
    if (!camp?.combate) return;
    const r = pagarPedagio(camp);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.texto, 'sistema')] });
    await persistir(camp, set);
  },
  async combFugir() {
    const { content, camp } = get();
    if (!content || !camp?.combate) return;
    jogadorFoge(content, camp);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },
  async fecharLuta() {
    const { content, camp } = get();
    if (!content || !camp) return;
    const resultado = camp.combate?.resultado;
    const rec = camp.combate?.recompensa;
    // Prova do mestre: o resultado e o que falta viram o fato da cena.
    const rito = camp.combate?.rito ? concluirRito(content, camp) : undefined;
    // Briga na cena: mortos, nocauteados e testemunhas viram o fato da cena.
    const briga = camp.combate?.briga ? concluirBriga(content, camp) : undefined;
    const batidasCombate = [...(camp.combate?.log ?? [])];
    fecharCombate(camp);
    avancarMundo(content, camp);
    const saque = rec?.loot?.length
      ? ` Do chão você recolhe: ${rec.loot
          .map((id) => content.itens.find((i) => i.id === id)?.nome ?? id)
          .join(', ')}.`
      : '';
    const fato = rito
      ? rito.fato
      : briga
        ? briga.fato
      : resultado === 'vitoria'
        ? `A luta terminou e você ficou de pé.${saque}`
        : resultado === 'derrota'
          ? 'A luta terminou com você no chão. Você acorda depois, ferido, e mais pobre.'
          : 'Você virou as costas e correu, e conseguiu.';
    const linhas: EntradaFeed[] = [
      nf(
        rito
          ? `Prova do mestre · ${rito.resultado === 'aprovado' ? 'aprovado' : rito.resultado === 'promissor' ? 'promissor' : 'ainda cru'}`
          : briga?.mortos.length
          ? `Mortos · ${briga.mortos.join(', ')}`
          : briga
          ? (resultado === 'vitoria' ? 'Briga vencida' : resultado === 'derrota' ? 'Briga perdida' : 'Fuga da briga')
          : resultado === 'vitoria'
          ? `Combate vencido${rec?.xp ? ` · +${rec.xp} xp` : ''}`
          : resultado === 'derrota'
            ? 'Combate perdido'
            : 'Fuga',
        'acao',
        { abreTurno: true, cabecalho: marcaDoTurno(content, camp) },
      ),
    ];
    set({ camp: { ...camp }, tela: 'jogo', ocupado: true, feed: [...get().feed, ...linhas] });
    await persistir(camp, set);
    const concl = verificarQuests(content, camp);
    if (concl.length) set({ feed: [...get().feed, ...concl.map((t) => nf(`Missão concluída: ${t}.`, 'sistema'))] });
    // Até o fim de um combate é narrado pelo modelo, batida por batida.
    await narrar(get, set, fato, undefined, { batidasCombate });
  },

  // ── Magia ────────────────────────────────────────────────
  async aprenderArteAcao(arteId) {
    const { content, camp } = get();
    if (!content || !camp) return;
    // O custo de tempo e o tique do mundo agora vivem na engine (magic.ts).
    const r = aprenderArteEngine(content, camp, arteId);
    if (r.ok) {
      const arte = content.artes.find((a) => a.id === arteId);
      set({ camp: { ...camp }, feed: [...get().feed, nf(`Você aprendeu ${arte?.nome ?? arteId}.`, 'sistema')] });
      await persistir(camp, set);
      get().irPara('jogo');
      // A cena precisa reagir: novas opções depois de aprender (§7.1).
      registrarMarco(camp, `você aprendeu ${arte?.nome ?? arteId}`);
      await narrar(get, set, `Você passou períodos aprendendo ${arte?.nome ?? arteId} com a mestra.`);
      checarCapitulo(get, set);
      return;
    }
    set({ feed: [...get().feed, nf(`Não deu para aprender: ${r.motivo}.`, 'sistema')] });
    await persistir(camp, set);
    checarCapitulo(get, set);
  },
  // Funde duas escolas dominadas num estilo original (engine/fusao.ts,
  // GDD original: até 3 criações de assinatura por vida).
  async fundirEstilos(escolaA, escolaB, nome) {
    const { content, camp } = get();
    if (!content || !camp || get().ocupado) return;
    const r = fundirEscolas(content, camp, escolaA, escolaB, nome);
    if (!r.ok || !r.arte) {
      set({ feed: [...get().feed, nf(`Não deu para fundir: ${r.motivo}.`, 'sistema')] });
      return;
    }
    set({ camp: { ...camp } });
    await persistir(camp, set);
    get().irPara('jogo');
    set({
      feed: [
        ...get().feed,
        nf(`Fundir estilo: ${r.arte.nome}`, 'acao', { abreTurno: true, cabecalho: marcaDoTurno(content, camp) }),
      ],
    });
    await narrar(
      get,
      set,
      `Você passou a fundir ${escolaA} e ${escolaB} num estilo só seu: ${r.arte.nome}.`,
    );
  },

  // Tentativa de Ascensão (engine/ascensao.ts) — só funciona quando os três
  // pilares reais já estão cumpridos (nível, idade, almas seladas).
  async ascender() {
    const { content, camp } = get();
    if (!content || !camp || get().ocupado) return;
    const r = tentarAscender(camp);
    if (!r.ok) {
      set({ feed: [...get().feed, nf(`Ainda não: ${r.motivo}.`, 'sistema')] });
      return;
    }
    set({ camp: { ...camp } });
    await persistir(camp, set);
    get().irPara('jogo');
    set({
      feed: [
        ...get().feed,
        nf('Ascensão', 'acao', { abreTurno: true, cabecalho: marcaDoTurno(content, camp) }),
      ],
    });
    await narrar(get, set, `Você rompeu a barreira entre o mortal e o que vem depois — o CHIM despertou em você.`);
  },

  // Ativa uma carta de memória de infância (engine/genese.ts) para o
  // próximo teste — o bônus só é gasto quando um teste de fato acontece
  // (ver engine/turn.ts, resolverIntencao).
  async jogarCartaMemoria(id) {
    const { camp } = get();
    if (!camp) return;
    const carta = camp.memoriasInfancia?.find((c) => c.id === id);
    if (!carta || carta.usosRestantes <= 0) return;
    camp.cartaAtiva = id;
    set({
      camp: { ...camp },
      feed: [...get().feed, nf(`Memória jogada: ${carta.titulo}.`, 'sistema')],
    });
    await persistir(camp, set);
  },

  async conjurarArteLivre(arteId) {
    const { content, camp } = get();
    if (!content || !camp || get().ocupado) return;
    const r = conjurarLivre(content, camp, arteId);
    const arte = artePorId(content, camp, arteId);
    set({ camp: { ...camp } });
    await persistir(camp, set);
    if (!r.ok) {
      set({ feed: [...get().feed, nf(`Não deu: ${r.motivo}.`, 'sistema')] });
      return;
    }
    get().irPara('jogo');
    set({
      feed: [
        ...get().feed,
        nf(`Conjurar ${arte?.nome ?? 'a arte'}`, 'acao', { abreTurno: true, cabecalho: marcaDoTurno(content, camp) }),
      ],
    });
    await narrar(get, set, r.texto ?? `Você conjurou ${arte?.nome ?? 'uma arte'}.`);
  },
  async agirOpcao(op, alvoId) {
    // Opção que é um verbo do catálogo roda como verbo, com os efeitos dele.
    if (op.verboId) {
      await get().agirVerbo(op.verboId, op.alvoId ?? alvoId);
      return;
    }
    await executar(get, set, { tipo: 'opcao', opcao: op, alvoId }, 'acao');
  },

  async lembrarNarrador(texto) {
    const camp = get().camp;
    const t = texto.trim().slice(0, 200);
    if (!camp || !t) return;
    camp.lembretesNarrador = [...(camp.lembretesNarrador ?? []), t].slice(-8);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },

  async esquecerLembrete(indice) {
    const camp = get().camp;
    if (!camp?.lembretesNarrador) return;
    camp.lembretesNarrador = camp.lembretesNarrador.filter((_, k) => k !== indice);
    set({ camp: { ...camp } });
    await persistir(camp, set);
  },

  async acaoLivre(texto, tipo = 'fazer') {
    const { content, camp } = get();
    if (!content || !camp) return;
    const t = texto.trim();
    if (!t) return;
    const dizer = tipo === 'dizer';
    set({ falaJogador: dizer ? t : undefined });

    // Domínio do Kai (Sakai): intercepta e resolve comandos livres do Kai diretamente na engine
    const resKai = processarAcaoLivreKai(t, camp);
    if (resKai) {
      set({
        camp: { ...camp },
        feed: [
          ...get().feed,
          nf(t, 'acao', { abreTurno: true, cabecalho: marcaDoTurno(content, camp) }),
          nf(resKai.mensagem, 'sistema'),
        ],
      });
      await persistir(camp, set);
      await narrar(get, set, `Você canalizou o Domínio do Kai: ${resKai.mensagem}. Situação: ${t}`, t);
      return;
    }

    const cls = classificarAcaoLivre(t, content, get().cena?.contexto);
    // Violência contra quem está aqui vira briga de verdade, com regra.
    if (cls?.briga && !dizer) {
      await get().brigarAcao(cls.briga.alvos, cls.briga.letal, t);
      return;
    }
    if (cls) {
      // 'cacar' e os verbos de chefe abrem combate estruturado de verdade
      // (tela de PV, dano, vitoria/derrota) — agirVerbo ja sabe disso.
      // Chamar executar() direto aqui pulava essa checagem: a acao livre
      // ('matar os bandidos') nunca abria o combate real, so a narracao
      // livre, que nao tem vida nem fim — o combate parecia nao terminar.
      const abreCombate = cls.verboId === 'cacar' || !!CHEFES_POR_VERBO[cls.verboId];
      // Fala não abre combate: "vou te matar" dito é ameaça, não ataque; cai
      // na narração livre abaixo.
      if (abreCombate && !dizer) {
        await get().agirVerbo(cls.verboId, cls.alvoId);
        return;
      }
      if (!abreCombate) {
        await executar(get, set, { tipo: 'verbo', verboId: cls.verboId, alvoId: cls.alvoId }, undefined);
        return;
      }
    }
    // Não casou com nenhum verbo? A ação livre não pode morrer no ar: o
    // narrador assume e escreve o que aconteceu, com opções novas depois.
    set({
      feed: [...get().feed, nf(dizer ? `“${t}”` : t, 'acao', { abreTurno: true, cabecalho: marcaDoTurno(content, camp) })],
    });
    await narrar(get, set, dizer ? `Você diz: “${t}”` : `Você tenta o seguinte: ${t}`, t, { tipoAcaoLivre: tipo });
  },

  async viajar(destino) {
    const { content, camp } = get();
    if (!content || !camp) return;
    if (get().ocupado) return;
    set({ ocupado: true });
    // A regra da viagem inteira vive na engine (engine/viagem.ts): custo de
    // tempo, tique do mundo, primeiro pisar, notícias e sorteio de encontro —
    // inclusive abrir o combate. Aqui fica só o que é tela.
    const viagem = viajar(content, camp, destino);
    if (!viagem.ok) {
      set({ ocupado: false });
      return;
    }
    const alvo = viagem.destino;
    const encontro = viagem.encontro;

    set({
      camp: { ...camp },
      ocupado: true,
      tela: 'jogo',
      feed: [
        ...get().feed,
        nf(`Você segue para ${alvo?.nome ?? destino}.`, 'sistema', {
          abreTurno: true,
          cabecalho: `${alvo?.nome ?? destino} · ${NOME_PERIODO[PERIODOS[camp.calendario.periodoIndex % PERIODOS.length]]}`,
        }),
      ],
    });
    await persistir(camp, set);

    if (encontro) {
      set({
        camp: { ...camp },
        tela: 'combate',
        ocupado: false,
        feed: [...get().feed, nf('No caminho, alguém — ou algo — te alcança.', 'sistema')],
      });
      await persistir(camp, set);
      return;
    }

    await narrar(get, set, `Você chegou a ${alvo?.nome ?? destino}.`, undefined, { modoCena: 'capitulo' });
    checarCapitulo(get, set);
  },

  async setConfig(patch) {
    const config = { ...get().config, ...patch };
    await salvarConfig(config);
    set({ config, iaSuspensa: false });
  },

  async proximoCapitulo() {
    const { content, camp } = get();
    if (!content || !camp) return;
    camp.capitulo = {
      numero: camp.capitulo.numero + 1,
      titulo: `Capítulo ${romano(camp.capitulo.numero + 1)}`,
      periodosDecorridos: 0,
    };
    set({
      camp: { ...camp },
      tela: 'jogo',
      ocupado: true,
      feed: [nf(`— ${camp.capitulo.titulo} —`, 'sistema', { abreTurno: true, cabecalho: marcaDoTurno(content, camp) })],
    });
    await persistir(camp, set);
    await narrar(get, set, `Começa o ${camp.capitulo.titulo}.`, undefined, { modoCena: 'capitulo' });
  },

  async testarChaveApi() {
    const { config } = get();
    let chave = chaveEfetiva(config);
    if (!chave && config.provider === 'nous') {
      const { renovarTokenNous } = await import('@/engine');
      chave = (await renovarTokenNous(true)) ?? undefined;
    }
    if (!chave) return { ok: false, erro: 'Sem chave.' };
    const { testarChave } = await import('@/engine');
    let res = await testarChave({ provider: config.provider, apiKey: chave, modelo: config.modelo });
    if (!res.ok && res.erro && /401|chave inválida|sem permissão/i.test(res.erro) && config.provider === 'nous') {
      const { renovarTokenNous } = await import('@/engine');
      const nova = await renovarTokenNous(true);
      if (nova && nova !== chave) {
        res = await testarChave({ provider: config.provider, apiKey: nova, modelo: config.modelo });
        if (res.ok && config.apiKey) {
          await get().setConfig({ apiKey: undefined });
        }
      }
    }
    return res;
  },

  async renovarHermes() {
    const { renovarTokenNous, testarChave } = await import('@/engine');
    const novo = await renovarTokenNous(true);
    if (!novo) {
      return {
        ok: false,
        erro: 'Não foi possível renovar via Hermes local. O servidor do jogo (porta 8081) não respondeu ou a conta Nous precisa de reconexão no terminal (hermes auth login nous).',
      };
    }
    // Remove qualquer chave manual antiga do store para usar o token dinâmico
    const cfgAtual = get().config;
    if (cfgAtual.apiKey) {
      await get().setConfig({ apiKey: undefined, provider: 'nous' });
    }
    // Valida imediatamente com a API Nous
    const teste = await testarChave({ provider: 'nous', apiKey: novo, modelo: cfgAtual.modelo });
    if (!teste.ok) {
      return {
        ok: false,
        token: novo,
        erro: teste.erro || 'Token obtido do Hermes, mas a Nous recusou a autenticação (401).',
      };
    }
    set({ iaSuspensa: false, iaErro: undefined });
    return { ok: true, token: novo };
  },

  async buscarModelosGratis() {
    const { config } = get();
    let chave = chaveEfetiva(config);
    if (!chave && config.provider === 'nous') {
      const { renovarTokenNous } = await import('@/engine');
      chave = (await renovarTokenNous(true)) ?? undefined;
    }
    const { listarModelos } = await import('@/engine');
    return listarModelos(config.provider, chave, true);
  },

  // Responde de uma vez a pergunta que não se responde pelo slug: este modelo
  // narra sexo/romance adulto, ou recusa?
  async testarSeNarraAdulto(modeloEspecifico?: string) {
    const { config } = get();
    let chave = chaveEfetiva(config);
    if (!chave && config.provider === 'nous') {
      const { renovarTokenNous } = await import('@/engine');
      chave = (await renovarTokenNous(true)) ?? undefined;
    }
    if (!chave) return { narra: false, recusou: false, erro: 'Sem chave salva.' };
    const modeloAlvo = (modeloEspecifico && modeloEspecifico.trim()) || config.modelo;
    const { testarCenaAdulta } = await import('@/engine');
    let r = await testarCenaAdulta({ provider: config.provider, apiKey: chave, modelo: modeloAlvo });
    if (r.erro && /401|chave inválida|sem permissão/i.test(r.erro) && config.provider === 'nous') {
      const { renovarTokenNous } = await import('@/engine');
      const nova = await renovarTokenNous(true);
      if (nova && nova !== chave) {
        r = await testarCenaAdulta({ provider: config.provider, apiKey: nova, modelo: modeloAlvo });
      }
    }
    if (!r.erro) {
      const v = get().config.vereditos ?? {};
      const k = `${config.provider}:${modeloAlvo}`;
      await get().setConfig({ vereditos: { ...v, [k]: { ...(v[k] ?? {}), adulto: r.narra } } });
    }
    return { ...r, modelo: modeloAlvo };
  },

  // Diagnóstico honesto: roda O MODELO EXATO escolhido pelo jogador,
  // sem trocar silenciosamente por outro modelo de reserva.
  async testarNarracaoReal(modeloEspecifico?: string) {
    const { config } = get();
    let chave = chaveEfetiva(config);
    if (!chave && config.provider === 'nous') {
      const { renovarTokenNous } = await import('@/engine');
      chave = (await renovarTokenNous(true)) ?? undefined;
    }
    if (!chave) return { ok: false, erro: 'Sem chave salva.' };
    const modeloAlvo = (modeloEspecifico && modeloEspecifico.trim()) || config.modelo;
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
    // Usa narrarComModelo diretamente: testa o modelo exato que o jogador pediu para testar!
    const { narrarComModelo } = await import('@/engine');
    let res = await narrarComModelo(
      { provider: config.provider, apiKey: chave, modelo: modeloAlvo },
      content,
      camp,
      cena.contexto,
      r,
    );
    if (res.erro && /401|chave inválida|sem permissão/i.test(res.erro) && config.provider === 'nous') {
      const { renovarTokenNous } = await import('@/engine');
      const nova = await renovarTokenNous(true);
      if (nova && nova !== chave) {
        res = await narrarComModelo(
          { provider: config.provider, apiKey: nova, modelo: modeloAlvo },
          content,
          camp,
          cena.contexto,
          r,
        );
      }
    }
    if (res.texto) {
      return { ok: true, amostra: res.texto.slice(0, 220), texto: res.texto, opcoes: res.opcoes?.length, modelo: modeloAlvo };
    }
    return { ok: false, erro: res.erro ?? 'sem resposta', modelo: modeloAlvo };
  },

  // Sem narrador não há história: o turno fica guardado e o jogador reemite o
  // pedido quando a chave ou a rede voltarem.
  async tentarNarrarDeNovo() {
    const pend = get().pendente;
    if (!pend || get().ocupado) return;
    set({ iaSuspensa: false });
    if (get().config.provider === 'nous') {
      const { renovarTokenNous } = await import('@/engine');
      await renovarTokenNous(true);
    }
    await narrar(get, set, pend.fato, pend.acaoLivre, pend.extra);
  },

  async desistirIaEUsarLocal() {
    const pend = get().pendente;
    const camp = get().camp;
    const content = get().content;
    const cena = get().cena;
    if (!pend || !camp || !content || !cena) return;
    const fato = pend.fato;
    const grade = montarGrade(content, camp, cena.contexto, [], cena.opcoes);
    registrarNaCronica(camp, fato);
    // A abertura já está no feed quando a IA falha nela: não repetir.
    const ultima = get().feed.at(-1);
    const jaNaTela = ultima?.tipo === 'narracao' && ultima.texto === fato;
    set({
      // O jogador escolheu o narrador local: vale até mudar a configuração,
      // não só neste turno (senão cada ação tentava a chave ruim de novo).
      iaSuspensa: true,
      camp: { ...camp },
      feed: jaNaTela ? get().feed : [...get().feed, nf(textoLocal(fato, pend.extra), 'narracao')],
      cena: { ...cena, opcoes: grade },
      iaStatus: 'off',
      iaErro: undefined,
      textoStreaming: undefined,
      ocupado: false,
      pendente: undefined,
    });
    await persistir(camp, set);
  },

  // Exporta a campanha ativa como JSON e dispara download no browser.
  async exportarSave() {
    const { camp } = get();
    if (!camp) { set({ avisoSave: 'Sem campanha para exportar.' }); return; }
    try {
      const json = exportarCampanha(camp);
      const nome = `arcanum-${camp.personagem.nome.toLowerCase().replace(/\s+/g, '-')}-dia${camp.calendario.dia}.json`;
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nome;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      set({ avisoSave: `Erro ao exportar: ${String(e).slice(0, 120)}` });
    }
  },

  // Importa uma campanha de um JSON e a carrega no jogo.
  async importarSave(json: string) {
    const r = importarCampanha(json);
    if (!r.ok) { set({ avisoSave: `Erro ao importar: ${r.erro}` }); return; }
    const camp = r.valor;
    const content = bundlePorId(camp.cenarioId);
    if (!content) { set({ avisoSave: 'Cenário do save importado não foi encontrado.' }); return; }
    await salvarCampanha(camp);
    set({
      camp,
      content,
      feed: [nf('Campanha importada. Retomando de onde você salvou.', 'sistema', { abreTurno: true })],
      cena: undefined,
      temSave: true,
      avisoSave: undefined,
      tela: 'jogo',
      ocupado: true,
    });
    recomputarCena(get, set);
    await narrar(get, set, 'Você retoma de onde a campanha importada estava.');
  },
}));


// Persiste o retrato da tela (feed + cena) toda vez que ele muda, enquanto
// houver uma campanha em andamento — é o que faz "continuar" retomar
// exatamente de onde parou (ver K_SESSAO em ui/storage.ts) em vez de perder
// a conversa a cada fechamento do app. Fica de fora de toda ação individual
// de propósito: mais seguro que espalhar salvarSessao(...) por dezenas de
// pontos de set() e arriscar esquecer um.
useGame.subscribe((state, anterior) => {
  if (!state.camp) return;
  if (state.feed === anterior.feed && state.cena === anterior.cena && state.pendente === anterior.pendente) return;
  void salvarSessao({ feed: state.feed, cena: state.cena, pendente: state.pendente } satisfies SessaoSalva);
});

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
  const { content, camp } = get();
  if (!content || !camp || get().ocupado) return;
  // Tranca ANTES de qualquer await. O autosave é assíncrono: sem isto, um
  // segundo toque durante a gravação executava um turno inteiro por cima.
  set({ ocupado: true, iaStatus: 'pensando', iaErro: undefined });

  // O que o jogador escolheu vira um cartão próprio na interface — nunca texto
  // solto no meio da narração, e nunca um rótulo tipo "Narrador:".
  const rotuloEscolhido =
    intencao.tipo === 'opcao'
      ? intencao.opcao.rotulo
      : content.verbos.find((v) => v.id === intencao.verboId)?.nome ?? '';
  if (rotuloEscolhido) lembrarOpcao(camp, rotuloEscolhido);

  const r = resolverIntencao(content, camp, intencao);
  camp.capitulo.periodosDecorridos += r.custoPeriodos;
  talvezRevelarSegredo(content, camp, r.alvo);

  if (rotuloEscolhido) {
    set({
      feed: [
        ...get().feed,
        nf(rotuloEscolhido, 'acao', { abreTurno: true, cabecalho: marcaDoTurno(content, camp) }),
      ],
    });
  }
  set({ camp: { ...camp }, ocupado: true });
  await persistir(camp, set);

  const concl = verificarQuests(content, camp);
  if (concl.length) {
    set({ feed: [...get().feed, ...concl.map((t) => nf(`Missão concluída: ${t}.`, 'sistema'))] });
  }

  // Quem narra é o modelo. Sempre. Não existe texto local de reserva.
  await narrar(get, set, r.fato);
  checarCapitulo(get, set);
}

// Converte as sugestões da IA em opções de cena, já filtrando repetição contra
// tudo que o jogador viu antes — opção repetida nunca deve chegar à tela.
function montarOpcoesIA(
  brutas: import('@/engine').OpcaoIA[] | undefined,
  camp: Campaign,
  sufixo: string,
): OpcaoResolvida[] {
  const vistas = new Set((camp.opcoesUsadas ?? []).map(chaveRotulo));
  const out: OpcaoResolvida[] = [];
  for (const o of brutas ?? []) {
    const chave = chaveRotulo(o.rotulo);
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    out.push({
      id: `ia_${sufixo}_${out.length}`,
      rotulo: o.rotulo,
      dica: o.dica,
      natureza: o.natureza,
      custoPeriodos: o.custoPeriodos,
      teste: o.teste
        ? {
            atributo: o.teste.atributo as AttrKey,
            pericia: o.teste.pericia,
            dificuldade: o.teste.dificuldade,
          }
        : undefined,
      origem: 'ia',
    });
  }
  // Oferecida já conta como usada: uma opção que apareceu uma vez não volta,
  // mesmo que o jogador não a tenha escolhido.
  for (const o of out) lembrarOpcao(camp, o.rotulo);
  return out;
}

// ÚNICO caminho de narração do jogo (GDD §18, com a Parte V endurecida a
// pedido: sem modelo não há prosa). A engine resolve o que aconteceu; o
// narrador escreve. Se ele não escrever, o turno fica pendente e o jogador
// manda tentar de novo — o jogo NUNCA inventa um texto de reserva.
// Narrador local: sem modelo, a luta ainda é contada batida por batida, com o
// log que a engine escreveu, antes do fato final.
function textoLocal(fato: string, extra?: ExtraNarracao): string {
  const batidas = (extra?.batidasCombate ?? []).map(batidaDeCombate).filter((b): b is string => !!b);
  return batidas.length ? [...batidas, fato].join('\n\n') : fato;
}

type ExtraNarracao = {
  tipoAcaoLivre?: 'fazer' | 'dizer';
  batidasCombate?: string[];
  modoCena?: 'capitulo';
};

async function narrar(
  get: () => GameState,
  set: (p: Partial<GameState>) => void,
  fato: string,
  acaoLivre?: string,
  extra: ExtraNarracao = {},
) {
  const { content, camp, config } = get();
  if (!content || !camp) return;

  // Linhas da engine (o mundo lembra, ganchos do diretor) entram antes da cena.
  const avisos = consumirAvisos(camp);
  if (avisos.length) set({ feed: [...get().feed, ...avisos.map(a => nf(a.texto, 'eco'))] });

  // Disse o próprio nome ("Sou Kael")? Quem está aqui passa a saber — antes
  // do pacote ir para o narrador.
  const presentesAntes = get().cena?.contexto.presentes ?? [];
  const falaOuAcao = get().falaJogador ?? acaoLivre;
  if (falaOuAcao && disseONome(falaOuAcao, camp.personagem.nome)) apresentar(camp, presentesAntes);

  const cena = montarCena(content, { ...camp });
  // Fala do jogador (aba Dizer): vale para esta narração, qualquer que tenha
  // sido o caminho da engine até aqui.
  const fala = get().falaJogador;
  if (fala) {
    set({ falaJogador: undefined });
    acaoLivre = fala;
    extra = { ...extra, tipoAcaoLivre: 'dizer' };
  }
  let chave = chaveEfetiva(config);
  if (config.provider === 'nous' && (!chave || jwtExpirado(chave, 120))) {
    const { renovarTokenNous } = await import('@/engine');
    const novo = await renovarTokenNous(false);
    if (novo) {
      chave = novo;
      if (get().iaSuspensa) {
        set({ iaSuspensa: false });
      }
    }
  }

  const reservas = (config.reservas ?? []).filter((r) => r.apiKey?.trim());

  if ((!chave && !reservas.length) || get().iaSuspensa) {
    // Narrador canônico local (GDD §20, P0: o jogo tem que rodar sem rede e
    // sem modelo). As peças já existiam — 'fato' é a frase que a própria
    // engine escreve reagindo ao grau do teste (construirFato em turn.ts), e
    // montarGrade(...) com lista de IA vazia já preenche as cinco casas com
    // ações reais do jogo. Isto só estava sendo descartado por um retorno
    // antecipado aqui, que travava o jogo pedindo chave.
    const grade = montarGrade(content, camp, cena.contexto, [], cena.opcoes);
    registrarNaCronica(camp, fato);
    set({
      camp: { ...camp },
      feed: [...get().feed, nf(textoLocal(fato, extra), 'narracao')],
      cena: { ...cena, opcoes: grade },
      iaStatus: 'off',
      iaErro: undefined,
      textoStreaming: undefined,
      ocupado: false,
      pendente: undefined,
    });
    await persistir(camp, set);
    return;
  }

  set({ ocupado: true, iaStatus: 'pensando', iaErro: undefined });

  const pedido = { fato, acaoLivre, ...extra, custoPeriodos: 0, efeitosAplicados: [] } as unknown as Parameters<
    typeof narrarComFallback
  >[4];
  // Principal primeiro; depois as reservas grátis, em rodízio. Somar as
  // camadas grátis de vários provedores é o que dá fôlego sem pagar.
  const todos = [
    ...(chave ? [{ provider: config.provider, apiKey: chave, modelo: config.modelo, estilo: config.estilo }] : []),
    ...reservas.map((r) => ({ provider: r.provider, apiKey: r.apiKey.trim(), modelo: r.modelo || PROVEDORES_GRATIS[r.provider].modeloPadrao, estilo: config.estilo })),
  ];
  // Rodízio por tipo de cena: numa cena íntima ou de luta, quem passou no teste
  // daquele conteúdo vai na frente e quem recusou vai por último. Quem nunca foi
  // testado fica no meio, na ordem de sempre.
  const tipo = tipoDeCena({ fato, acaoLivre, batidasCombate: extra.batidasCombate });
  const nota = (c: { provider: string; modelo: string }) => {
    if (tipo === 'comum') return 0;
    const v = config.vereditos?.[`${c.provider}:${c.modelo || ''}`]?.[tipo];
    return v === true ? -1 : v === false ? 1 : 0;
  };
  const cfgs = todos.map((c, k) => ({ c, k })).sort((a, b) => nota(a.c) - nota(b.c) || a.k - b.k).map((x) => x.c);

  set({ textoStreaming: '' });
  let res: Awaited<ReturnType<typeof narrarComFallback>> = { erro: 'sem narrador' };
  const erros: string[] = [];
  let quemNarrou: string | undefined;
  for (const [k, cfg] of cfgs.entries()) {
    // Só o primeiro vai em streaming; a segunda tentativa automática cobre
    // falha de rede antes de passar para a reserva seguinte.
    if (k === 0) {
      res = await narrarComModeloStream(cfg, content, camp, cena.contexto, pedido, (parcial) => {
        set({ textoStreaming: parcial });
      });
    }
    if (!res.texto) res = await narrarComFallback(cfg, content, camp, cena.contexto, pedido);
    if (res.texto) {
      quemNarrou = `${cfg.provider} · ${res.modeloUsado ?? cfg.modelo ?? 'padrão'}`;
      break;
    }
    erros.push(`${cfg.provider}: ${res.erro ?? 'sem resposta'}`);
  }
  if (!res.texto && erros.length > 1) res = { erro: erros.join(' · ') };

  const cenaAtual = get().cena;
  if (res.texto) {
    const opcoesIA = montarOpcoesIA(res.opcoes, camp, `${camp.turno}_${feedSeq}`);
    // Quem não sabe o nome do jogador não o diz (engine/nomeDoJogador.ts). Se
    // na cena ele mesmo disse o nome numa fala [você], aí os presentes sabem.
    const presentes = cena.contexto.presentes;
    const nomeJ = camp.personagem.nome;
    const falasDele = res.texto.split('\n').filter((l) => /^\s*[—–-]\s*\[(você|voce)\]/i.test(l)).join(' ');
    if (disseONome(falasDele, nomeJ)) apresentar(camp, presentes);
    const textoFinal = protegerNome(res.texto, nomeJ, presentes.filter((n) => !sabeONome(camp, n)).map((n) => n.nome));
    registrarNaCronica(camp, textoFinal);
    const extras: EntradaFeed[] = [{ ...nf(textoFinal, 'narracao'), modelo: quemNarrou }];
    const achado = entregarAchado(content, camp, res.achado);
    if (achado) extras.push(achado);
    set({
      camp: { ...camp },
      feed: [...get().feed, ...extras],
      cena: cenaAtual
        ? {
            ...cenaAtual,
            // Grade de posições fixas: a IA preenche o que consegue, a engine
            // completa o resto com ações reais deste lugar.
            opcoes: montarGrade(content, camp, cenaAtual.contexto, opcoesIA, cenaAtual.opcoes),
          }
        : cenaAtual,
      iaStatus: 'ok',
      iaErro: undefined,
      iaSuspensa: false,
      ocupado: false,
      textoStreaming: undefined,
      pendente: undefined,
    });
    await persistir(camp, set);
    return;
  }

  // Falhou de novo: o turno fica guardado, esperando "tentar de novo".
  set({ iaStatus: 'erro', iaErro: res.erro ?? 'sem resposta', ocupado: false, textoStreaming: undefined });
}


// Descoberta de segredo: a regra e a consequência vivem em engine/segredos.ts.

function checarCapitulo(get: () => GameState, set: (p: Partial<GameState>) => void) {
  const camp = get().camp;
  if (!camp) return;
  if (camp.capitulo.periodosDecorridos >= CAPITULO_MAX_PERIODOS) {
    set({ tela: 'fimcapitulo' });
  }
}

if (typeof window !== 'undefined') {
  (window as unknown as { __GAME_STORE__?: typeof useGame }).__GAME_STORE__ = useGame;
  (window as unknown as { __ABRIR_COMBATE__?: (inimigos?: string[]) => void }).__ABRIR_COMBATE__ = (inimigos = ['salteador', 'lobo']) => {
    const store = useGame.getState();
    const { content, camp } = store;
    if (!content || !camp) return;
    iniciarCombate(content, camp, inimigos);
    useGame.setState({ camp: { ...camp }, tela: 'combate' });
  };
  (window as unknown as { __FUNDAR_COLONIA__?: (nome?: string) => { ok: boolean; mensagem: string } }).__FUNDAR_COLONIA__ = (nome = 'Baluarte de Torvald') => {
    const store = useGame.getState();
    const { content, camp } = store;
    if (!content || !camp) return { ok: false, mensagem: 'Sem campanha ativa' };
    camp.localAtual = 'campo_ceifa';
    const r = fundarColonia(content, camp, nome);
    const f = camp.feudo;
    if (f) {
      iniciarObraFeudo(camp, 'muralha_baluarte');
      iniciarObraFeudo(camp, 'lavoura_silos');
    }
    const feed = [...store.feed, {
      id: 'fundacao_colonia_' + Date.now(),
      tipo: 'sistema' as const,
      texto: r.mensagem,
      timestamp: Date.now(),
      abreTurno: true,
      cabecalho: `Baluarte Fundado · Dia ${camp.calendario.dia}`,
    }];
    useGame.setState({
      camp: { ...camp },
      tela: 'assentamento',
      feed,
    });
    return r;
  };
  (window as unknown as { __PREPARAR_VAELHORN_FORJA__?: () => void }).__PREPARAR_VAELHORN_FORJA__ = () => {
    const store = useGame.getState();
    const { camp } = store;
    if (!camp) return;
    camp.localAtual = 'vila_ferreiros';
    camp.personagem.inventario = {
      ...(camp.personagem.inventario ?? {}),
      minerio_de_ferro: 15,
      carvao: 10,
      lingote_ferro: 6,
      lamina_curta: 1,
      lanca_caca: 1,
      escudo_madeira: 1,
    };
    useGame.setState({ camp: { ...camp }, tela: 'inventario' });
  };
  (window as unknown as { __AVANCAR_TEMPO_2_ANOS__?: () => { idade: number; dia: number; ano: number } }).__AVANCAR_TEMPO_2_ANOS__ = () => {
    const store = useGame.getState();
    const { content, camp } = store;
    if (!content || !camp) return { idade: 0, dia: 0, ano: 0 };
    camp.calendario = avancarPeriodos(camp.calendario, 730 * PERIODOS.length);
    avancarMundo(content, camp);
    const idade = camp.personagem.idade ?? 20;
    const ano = Math.floor(camp.calendario.dia / 365) + 1;
    const novaCena = montarCena(content, camp);
    const feed = [...store.feed, {
      id: 'marcador_2_anos_' + Date.now(),
      tipo: 'sistema' as const,
      texto: `DOIS ANOS SE PASSARAM NO VALE. Você agora tem ${idade} anos. As quatro estações sucederam-se, rumores envelheceram e novas linhagens emergiram.`,
      timestamp: Date.now(),
      abreTurno: true,
      cabecalho: `Ano ${ano} · Dia ${camp.calendario.dia} · ${idade} anos`,
    }];
    useGame.setState({
      camp: { ...camp },
      cena: novaCena,
      tela: 'jogo',
      feed,
    });
    return { idade, dia: camp.calendario.dia, ano };
  };
  (window as unknown as { __AVANCAR_TEMPO_10_ANOS__?: () => { idade: number; dia: number; ano: number } }).__AVANCAR_TEMPO_10_ANOS__ = () => {
    const store = useGame.getState();
    const { content, camp } = store;
    if (!content || !camp) return { idade: 0, dia: 0, ano: 0 };
    const DIAS_10_ANOS = 3650;
    for (let i = 0; i < DIAS_10_ANOS; i++) {
      camp.calendario = avancarPeriodos(camp.calendario, PERIODOS.length);
      avancarMundo(content, camp);
    }
    const idade = camp.personagem.idade ?? 28;
    const ano = Math.floor(camp.calendario.dia / 365) + 1;
    const novaCena = montarCena(content, camp);
    const feed = [...store.feed, {
      id: 'marcador_10_anos_' + Date.now(),
      tipo: 'sistema' as const,
      texto: `DEZ ANOS SE PASSARAM NO VALE DE VAELHORN. Você agora tem ${idade} anos. Casas senhoriais guerrearam, alianças foram refeitas, safras alimentaram o feudo e novas linhagens ascenderam.`,
      timestamp: Date.now(),
      abreTurno: true,
      cabecalho: `Ano ${ano} · Dia ${camp.calendario.dia} · ${idade} anos`,
    }];
    useGame.setState({
      camp: { ...camp },
      cena: novaCena,
      tela: 'jogo',
      feed,
    });
    return { idade, dia: camp.calendario.dia, ano };
  };
}


