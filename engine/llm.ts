// ARCANUM · Camada de IA opcional (GDD Parte V).
// A engine é dona da verdade; o modelo é dono da VOZ. Ele reescreve o fato
// consumado como prosa e propõe os próximos caminhos — mas quem valida é aqui.
//
// A chave NUNCA vai embutida no APK: o usuário cola a própria chave nas
// Configurações. Sem chave, o jogo usa o fallback canônico (§20).
//
// Provider padrão: OpenRouter (compatível com a API da OpenAI), que dá acesso
// a modelos gratuitos e sem filtro. Anthropic segue disponível como opção.
import type { Campaign, ContentBundle, Item } from './types';
import type { ResultadoTurno } from './turn';
import { disponibilidadeVerbo, type Contexto } from './availability';
import { dataPorExtenso, NOME_PERIODO } from './time';
import { memoriaParaNarrador, diasDeConvivio, marcosRecentes } from './memoria';
import { calcularRitmo } from './ritmo';
import { comoEstaOVale } from './mundo';
import { bandosConhecidos, descreverBando } from './bandos';
import { ecosRecentes } from './convivio';
import { ehNatureza, inferirNatureza, type Natureza } from './risco';
import { artesConhecidasResolvidas } from './fusao';
import { contextoDeAptidao, leituraDoObservador } from './aptidao';
import { rotasVisiveis } from './viagem';
import { legadosConquistados } from './identidade';
import { avisoMarca } from './marca';
import { familiaParaNarrador, ocupacaoEfetiva } from './familiasNpc';
import { descreverCasa } from './casas';
import { DOMINIOS } from './aptidaoTypes';
import { contextoNarrativo, CONTRATO_NARRATIVO } from './contextoNarrativo';
import { itemPorId } from './items';
import { conviccoesDoNpc } from './reflexao';
import { avisosDoDia } from './memoriaMundo';
import { descreverEdificioRegional } from './edificiosRegionais';
import { calcularHumorNpc, obterIntimidadeNpc } from './intimidadeNpc';
import { obterTokenNousAtual, renovarTokenNous } from './hermesBridge';
import {
  obterOcupantesSubespaco,
  verificarSupressaoMana,
  avaliarReacaoHumanosPresenca,
} from './tsukimichi';
import { CRONICAS_MAPA } from '@/content/vaelhorn/cosmologia';

export type LlmProvider = 'openrouter' | 'anthropic' | 'nous';

export type LlmConfig = {
  provider: LlmProvider;
  apiKey: string;
  modelo: string;
};

// Padrões. Slugs variam com o tempo — use o botão "Buscar modelos" nas
// Configurações para pegar a lista atual e grátis direto da OpenRouter.
export const MODELO_PADRAO_OPENROUTER = 'thedrummer/rocinante-12b';
export const MODELO_PADRAO_ANTHROPIC = 'claude-haiku-4-5-20251001';
export const MODELO_PADRAO_NOUS = 'upstage/solar-pro4:free';

// Sugestões Nous Research / Hermes (modelos gratuitos e ativos validados na infraestrutura)
export const SUGESTOES_NOUS = [
  'upstage/solar-pro4:free', // Solar Pro 4 (padrão: rápido ~7s, estável, excelente em português)
  'stepfun/step-3.7-flash:free', // StepFun 3.7 Flash (ultrarrápido ~2-3s)
  'stealth/space-bunny-alpha', // Space Bunny Alpha (mais lento ~25s, tom visceral)
];

// Sugestões iniciais (validadas com mais frequência). O botão "Buscar modelos"
// substitui esta lista pela lista viva da sua conta.
export const SUGESTOES_OPENROUTER = [
  'nousresearch/hermes-3-llama-3.1-405b:free', // Nous gratis, primeira escolha
  'nousresearch/deephermes-3-mistral-24b-preview:free',
  'nousresearch/deephermes-3-llama-3-8b-preview:free',
  'deepseek/deepseek-chat-v3-0324:free', // qualidade alta, pouco filtro em ficção
  'cognitivecomputations/dolphin3.0-mistral-24b:free', // linhagem sem filtro
  'nousresearch/hermes-3-llama-3.1-405b', // permissivo, bom em prosa
  'deepseek/deepseek-r1:free',
  'mistralai/mistral-nemo:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

// Atalho para quem quer cena adulta e não quer caçar slug.
//
// Duas verdades desagradáveis sobre o gratuito:
//
// 1. ":free" quase nunca é grátis de verdade. A OpenRouter derruba e recria
//    esses endpoints o tempo todo, e os que sobrevivem vêm com teto diário
//    baixo. Contar com eles é contar com sorte.
// 2. Quando existem, costumam ser servidos por provedor que MODERA — porque
//    quem banca inferência de graça se protege. Por isso um modelo permissivo
//    pode recusar mesmo assim: são dois filtros, o do modelo e o do provedor.
//
// Os de baixo custam frações de centavo por cena. Dez dólares de crédito duram
// muito e resolvem o problema de vez.
/**
 * Fabricante do modelo, para a tela agrupar.
 *
 * O slug da OpenRouter ja carrega o dono antes da barra ("nousresearch/..."),
 * mas o slug e' identificador e nao nome: "sao10k" e "thedrummer" sao apelidos
 * de quem afinou o modelo, nao marcas que alguem reconheca numa lista. Por
 * isso o nome legivel fica declarado.
 */
export const FABRICANTE: Record<string, string> = {
  nousresearch: 'Nous Research',
  sao10k: 'Sao10K',
  thedrummer: 'TheDrummer',
  gryphe: 'Gryphe',
  cognitivecomputations: 'Cognitive Computations',
  deepseek: 'DeepSeek',
  mistralai: 'Mistral AI',
  meta: 'Meta',
  'meta-llama': 'Meta',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  qwen: 'Qwen',
  microsoft: 'Microsoft',
  undi95: 'Undi95',
  neversleep: 'NeverSleep',
  latitudegames: 'Latitude Games',
  infermatic: 'Infermatic',
  nvidia: 'NVIDIA',
  cohere: 'Cohere',
  upstage: 'Upstage (Solar)',
  stepfun: 'StepFun',
  poolside: 'Poolside (Laguna)',
  thinkingmachines: 'Thinking Machines',
  tencent: 'Tencent',
  inclusionai: 'Inclusion AI',
  meituan: 'Meituan',
  stealth: 'Stealth (Nous)',
};

/** Nome do fabricante a partir do slug. Desconhecido vira o proprio prefixo. */
export function fabricanteDe(id: string): string {
  const dono = id.split('/')[0]?.toLowerCase() ?? '';
  return FABRICANTE[dono] ?? (dono ? dono[0].toUpperCase() + dono.slice(1) : 'Outros');
}

/**
 * Agrupa uma lista de modelos por fabricante, preservando a ordem em que os
 * fabricantes aparecem na lista original — e' assim que a Nous continua no
 * topo sem precisar de uma regra separada de ordenacao.
 */
export function agruparPorFabricante<T extends { id: string }>(
  modelos: T[],
): { fabricante: string; modelos: T[] }[] {
  const grupos = new Map<string, T[]>();
  for (const m of modelos) {
    const f = fabricanteDe(m.id);
    (grupos.get(f) ?? grupos.set(f, []).get(f)!).push(m);
  }
  return [...grupos].map(([fabricante, modelos]) => ({ fabricante, modelos }));
}

export const MODELOS_PARA_CENA_ADULTA: { id: string; nota: string; pago: boolean }[] = [
  // ── Nous Research & Gratuitos Testados ────────────────────────────────────
  { id: 'stealth/space-bunny-alpha', nota: 'Nous grátis: testado no RPG, narra sem recusa, prosa riquíssima e sem censura', pago: false },
  { id: 'upstage/solar-pro4:free', nota: 'Nous grátis: testado, excelente português e coerência narrativa', pago: false },
  { id: 'stepfun/step-3.7-flash:free', nota: 'Nous grátis: rápido (2-3s), ágil para turnos dinâmicos', pago: false },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', nota: 'Nous grátis, o maior: melhor prosa da lista sem pagar', pago: false },
  { id: 'nousresearch/deephermes-3-llama-3-8b-preview:free', nota: 'Nous grátis, pequeno e rápido; cena curta', pago: false },
  { id: 'nousresearch/deephermes-3-mistral-24b-preview:free', nota: 'Nous grátis, meio-termo: aguenta diálogo', pago: false },

  // ── Custam crédito, e é o que realmente funciona ──────────────────────────
  { id: 'sao10k/l3.3-euryale-70b', nota: 'o melhor para cena adulta longa; escreve diálogo sozinho', pago: true },
  { id: 'thedrummer/rocinante-12b', nota: 'baratíssimo e nunca trava; bom para começar', pago: true },
  { id: 'sao10k/l3-lunaris-8b', nota: 'centavos por sessão inteira', pago: true },
  { id: 'nousresearch/hermes-3-llama-3.1-70b', nota: 'permissivo e articulado; prosa acima da média', pago: true },
  { id: 'thedrummer/anubis-pro-105b-v1', nota: 'pesado e explícito; para quando quiser o teto', pago: true },
  { id: 'gryphe/mythomax-l2-13b', nota: 'clássico de interpretação; velho, obediente e barato', pago: true },
  // ── Gratuitos: tente, mas não conte com eles ──────────────────────────────
  { id: 'cognitivecomputations/dolphin3.0-mistral-24b:free', nota: 'quando está no ar, é o melhor de graça', pago: false },
  { id: 'deepseek/deepseek-chat-v3-0324:free', nota: 'boa prosa; teto diário aperta rápido', pago: false },
  { id: 'mistralai/mistral-nemo:free', nota: 'pequeno demais: escreve curto e sem diálogo', pago: false },
];

// Teto de saída. O bug do "JSON cru na tela" era truncamento: o modelo estourava
// o limite no meio do array de opções e a resposta virava lixo impossível de ler.
// Cena com diálogo de verdade ocupa bem mais que cena descritiva. O corte no
// meio do JSON já é resgatado (ver interpretarResposta), então o teto pode ser
// generoso sem risco de voltar a vazar texto cru na tela.
const MAX_TOKENS = 4000;

// ── Que modelo serve para narrar ───────────────────────────────────────────
// A lista crua da OpenRouter mistura tudo: geradores de música, classificadores
// de censura, modelos de código, roteadores. Nada disso escreve uma cena. Pior:
// entre os que escrevem, uns narram adulto e outros recusam — e o jogador não
// tem como adivinhar pelo slug. Então a lista é filtrada e etiquetada aqui.

// Nem sequer é um modelo de conversa: música, imagem, voz, código, moderação.
const NAO_NARRA = [
  'lyria', 'clip', 'whisper', 'tts', 'speech', 'audio', 'embed', 'rerank',
  'guard', 'content-safety', 'moderation', 'shield', 'imagen', 'dall-e',
  'stable-diffusion', 'sdxl', 'flux', 'veo-', 'video', 'coder', '-code',
  'codestral', 'devstral', 'laguna', 'ocr',
];
const IDS_NAO_NARRA = ['openrouter/free', 'openrouter/auto'];

// Linhagens conhecidas por escrever cena adulta sem travar. São finetunes de
// interpretação e bases pouco alinhadas — o que este jogo pede.
const PERMISSIVOS = [
  'space-bunny', 'solar', 'dolphin', 'hermes', 'euryale', 'lumimaid', 'noromaid', 'mythomax', 'mythalion',
  'toppy', 'rocinante', 'unslopnemo', 'magnum', 'midnight-rose', 'wizardlm',
  'airoboros', 'xwin', 'anubis', 'cydonia', 'behemoth', 'sorcerer', 'lzlv',
  'goliath', 'psyfighter', 'remm', 'weaver', 'tiefighter', 'fimbulvetr',
  'stheno', 'lunaris', 'wayfarer', 'deepseek', 'mistral-nemo', 'mixtral',
  'sao10k', 'thedrummer', 'undi95', 'neversleep', 'gryphe', 'nousresearch',
  'latitudegames', 'infermatic',
];

// Linhagens alinhadas com força: costumam recusar ou cortar para o dia seguinte.
const ESTRITOS = [
  'nemotron', 'gemma', 'phi-', 'gpt-oss', 'command-', 'cohere', 'granite',
  'olmo', 'sarvam', 'claude', 'gpt-4', 'gpt-5', 'gemini', 'palm', 'jamba',
  'nova-', 'titan', 'o1-', 'o3-', 'o4-',
];

export type PerfilModelo = 'permissivo' | 'neutro' | 'estrito';

export type ModeloOR = {
  id: string;
  nome: string;
  free: boolean;
  /** O provedor aplica uma camada extra de moderação sobre o modelo. */
  moderado: boolean;
  perfil: PerfilModelo;
  contexto: number;
};

const contem = (id: string, lista: string[]) => lista.some((t) => id.includes(t));

// Serve para narrar? Precisa cuspir texto e não pode ser classificador/código.
export function serveParaNarrar(
  id: string,
  arq?: { modality?: string; output_modalities?: string[] },
): boolean {
  const alvo = id.toLowerCase();
  if (IDS_NAO_NARRA.includes(alvo)) return false;
  if (contem(alvo, NAO_NARRA)) return false;
  // Campo estrutural da API, quando vier: a saída precisa incluir texto.
  const saidas = arq?.output_modalities;
  if (Array.isArray(saidas) && saidas.length > 0 && !saidas.includes('text')) return false;
  if (arq?.modality && !arq.modality.includes('->text')) return false;
  return true;
}

export function perfilDoModelo(id: string): PerfilModelo {
  const alvo = id.toLowerCase();
  if (contem(alvo, PERMISSIVOS)) return 'permissivo';
  if (contem(alvo, ESTRITOS)) return 'estrito';
  return 'neutro';
}

const ORDEM_PERFIL: Record<PerfilModelo, number> = { permissivo: 0, neutro: 1, estrito: 2 };

// Busca a lista de modelos da OpenRouter (opcionalmente só os gratuitos), já
// sem o que não narra, etiquetada e ordenada: quem escreve cena adulta primeiro.
export async function listarModelosOpenRouter(
  apiKey?: string,
  apenasGratis = true,
): Promise<ModeloOR[]> {
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/models', {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
    });
    if (!resp.ok) return [];
    const data = (await resp.json()) as {
      data?: {
        id: string;
        name?: string;
        context_length?: number;
        architecture?: { modality?: string; output_modalities?: string[] };
        pricing?: { prompt?: string; completion?: string };
        top_provider?: { is_moderated?: boolean };
      }[];
    };
    const modelos: ModeloOR[] = [];
    for (const m of data.data ?? []) {
      if (!serveParaNarrar(m.id, m.architecture)) continue;
      const free = m.pricing?.prompt === '0' && m.pricing?.completion === '0';
      if (apenasGratis && !free) continue;
      modelos.push({
        id: m.id,
        nome: m.name ?? m.id,
        free,
        moderado: m.top_provider?.is_moderated === true,
        perfil: perfilDoModelo(m.id),
        contexto: m.context_length ?? 0,
      });
    }
    return modelos.sort(
      (a, b) =>
        ORDEM_PERFIL[a.perfil] - ORDEM_PERFIL[b.perfil] ||
        Number(b.free) - Number(a.free) ||
        a.nome.localeCompare(b.nome),
    );
  } catch {
    return [];
  }
}

// Busca modelos da Nous Research / Hermes.
export async function listarModelosNous(
  apiKey?: string,
  apenasGratis = true,
): Promise<ModeloOR[]> {
  try {
    let chave = apiKey?.trim() || obterTokenNousAtual();
    const headers: Record<string, string> = {};
    if (chave) headers.authorization = `Bearer ${chave}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    let resp: Response;
    try {
      resp = await fetch('https://inference-api.nousresearch.com/v1/models', {
        headers,
        signal: ctrl.signal,
      });
      if (resp.status === 401) {
        const novaChave = await renovarTokenNous(true);
        if (novaChave && novaChave !== chave) {
          chave = novaChave;
          headers.authorization = `Bearer ${chave}`;
          resp = await fetch('https://inference-api.nousresearch.com/v1/models', {
            headers,
            signal: ctrl.signal,
          });
        }
      }
    } finally {
      clearTimeout(timer);
    }
    if (!resp.ok) {
      return SUGESTOES_NOUS.map(comoModeloOR);
    }
    const data = (await resp.json()) as { data?: { id: string }[] };
    const modelos: ModeloOR[] = [];
    const DEAD_MODELS = [
      'meituan/longcat-2.0:free',
      'ling/ling-3.0-flash-saunter:free',
      'ling/ling-3.0-flash-fin:free',
      'poolside/laguna-xs-2.1:free',
      'tencent/hy3:free',
    ];
    for (const m of data.data ?? []) {
      const id = m.id;
      if (DEAD_MODELS.includes(id)) continue;
      const free = id.endsWith(':free') || id === 'stealth/space-bunny-alpha';
      if (apenasGratis && !free) continue;
      modelos.push({
        id,
        nome: id,
        free,
        moderado: false,
        perfil: perfilDoModelo(id),
        contexto: 0,
      });
    }
    for (const sug of SUGESTOES_NOUS) {
      if (!modelos.some((m) => m.id === sug)) {
        modelos.push(comoModeloOR(sug));
      }
    }
    modelos.sort((a, b) => {
      const idxA = SUGESTOES_NOUS.indexOf(a.id);
      const idxB = SUGESTOES_NOUS.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id.localeCompare(b.id);
    });
    return modelos.length > 0 ? modelos : SUGESTOES_NOUS.map(comoModeloOR);
  } catch {
    return SUGESTOES_NOUS.map(comoModeloOR);
  }
}

function comoModeloOR(id: string): ModeloOR {
  return {
    id,
    nome: id,
    free: id.endsWith(':free') || id === 'stealth/space-bunny-alpha',
    moderado: false,
    perfil: perfilDoModelo(id),
    contexto: 0,
  };
}

// Lista modelos conforme o provedor ativo.
export async function listarModelos(
  provider: LlmProvider,
  apiKey?: string,
  apenasGratis = true,
): Promise<ModeloOR[]> {
  if (provider === 'nous') return listarModelosNous(apiKey, apenasGratis);
  if (provider === 'openrouter') return listarModelosOpenRouter(apiKey, apenasGratis);
  return [];
}

// Pacote de contexto de tamanho ~constante (GDD §18.1).
// Além do estado, ele carrega o VOCABULÁRIO do jogo: os nomes exatos de itens,
// criaturas e pessoas que o modelo tem permissão de citar. Nada fora daqui.
export function montarPacote(
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  fato: string,
  acao?: { verbo?: string; categoria?: string; alvo?: string; grau?: string; livre?: string },
) {
  const p = camp.personagem;
  const narrativa = contextoNarrativo(camp, ctx);
  const nomeItem = (id: string) => itemPorId(content, id, p)?.nome ?? id;

  // O que ele carrega, com o nome exato do catálogo.
  const inventario = Object.entries(p.inventario)
    .filter(([, q]) => q > 0)
    .slice(0, 12)
    .map(([id, q]) => (q > 1 ? `${nomeItem(id)} (${q})` : nomeItem(id)));

  // O que pode ser achado aqui: só itens que a base realmente tem. O modelo
  // escolhe pelo id, e a engine é quem entrega — nada de tesouro inventado.
  const achaveis = content.itens
    .filter((i) => i.raridade === 'comum' || i.raridade === 'notavel')
    .filter((i) => i.slot === 'material' || i.slot === 'consumivel' || i.slot === 'misc')
    .slice(0, 10)
    .map((i) => ({ id: i.id, nome: i.nome }));

  const equipado = Object.entries(p.equipado)
    .filter(([, v]) => !!v)
    .map(([slot, id]) => `${slot}: ${nomeItem(id as string)}`);
  // Peça com nome e história: o narrador pode deixar alguém reconhecê-la.
  const pecasComHistoria = Object.values(p.equipado)
    .map(id => (id ? itemPorId(content, id as string, p) : undefined))
    .filter((i): i is Item => !!i && !!i.historia?.length)
    .map(i => ({ nome: i.nome, historia: i.historia!.join(' ') }));

  return {
    // A verdade do mundo vai antes de tudo: é ela que dá voz ao lugar.
    mundo: {
      nome: content.cenario.nome,
      genero: content.cenario.genero,
      tabu: content.cenario.tabuCentral,
      premissa: content.cenario.premissa ?? [],
    },
    personagem: {
      nome: p.nome,
      classe: p.classeId,
      origem: p.origemId,
      nivel: p.nivel,
      recursos: p.recursos,
      pressoes: p.pressoes,
      alcunhas: p.alcunhas,
      condicoes: p.condicoes,
      // Lesões permanentes (amputação em combate — engine/combat.ts) e outras
      // marcas de vida: sem isso o narrador esquece que o corpo mudou.
      cicatrizes: p.cicatrizes,
      moedas: p.dinheiro,
      equipado,
      pecasComHistoria: pecasComHistoria.length ? pecasComHistoria : undefined,
      inventario,
    },
    capitulo: { numero: camp.capitulo.numero, titulo: camp.capitulo.titulo },
    local: {
      nome: ctx.local.nome,
      atmosfera: narrativa.atmosfera,
      ganchos: ctx.local.ganchos,
      privacidade: ctx.privacidade,
      perigo: ctx.local.perigo,
      cronica: CRONICAS_MAPA[ctx.local.id]
        ? {
            crenca: CRONICAS_MAPA[ctx.local.id].divindadeOuCrenca,
            passadoGuerra: CRONICAS_MAPA[ctx.local.id].passadoGuerraDeuses,
            cicatrizBruxas: CRONICAS_MAPA[ctx.local.id].marcaDasBruxas,
            supersticao: CRONICAS_MAPA[ctx.local.id].supersticaoPopular,
          }
        : undefined,
    },
    quando: {
      data: dataPorExtenso(camp.calendario, content.cenario.ancoraCalendario),
      periodo: NOME_PERIODO[ctx.periodo],
      estacao: camp.calendario.estacao,
    },
    // O vale anda sozinho: tempo, evento corrente e carestia entram na cena.
    oValeHoje: comoEstaOVale(camp, content),
    comunidadeLocal: camp.continuidade?.locais[ctx.local.id],
    retornoAoLocal: narrativa.retorno,
    // Linhas que a engine já mostrou hoje: o que a cidade lembra, ganchos.
    mundoLembra: avisosDoDia(camp).length ? avisosDoDia(camp) : undefined,
    mundoPersistente: {
      casasPresentes: (content.casas ?? []).filter(h => h.territorio.includes(ctx.local.id) || h.sede === ctx.local.id).map(h => ({ nome: h.nome, reino: h.reino, lema: h.lema, reputacao: h.reputacao, hoje: descreverCasa(content, camp, h), historia: h.historia?.join(' ') })),
      fatos: narrativa.fatos,
      confirmados: narrativa.confirmados,
      rumores: narrativa.rumores,
      compromissos: camp.vivo?.missoes.filter(q => q.conhecida && q.estado === 'aceita').map(q => ({ titulo: q.titulo, local: q.local, prazo: q.prazo, etapa: q.etapa })),
      cidade: camp.vivo?.cidades[ctx.local.id] && { edificios: camp.vivo.cidades[ctx.local.id].edificios, edificioProprio: descreverEdificioRegional(content, camp, ctx.local.id), obra: camp.vivo.cidades[ctx.local.id].projeto, fome: camp.vivo.cidades[ctx.local.id].fomeDias > 0, epidemia: camp.vivo.cidades[ctx.local.id].doenca > 30 },
      regra: 'Rumor é informação não verificada pelo protagonista. Fatos ocultos não foram fornecidos. Não invente conclusão de obra, missão, morte ou parentesco: use somente o estado confirmado.',
    },
    ocorrenciasConfirmadas: camp.continuidade?.eventos.filter(e => e.local === ctx.local.id).slice(-3),
    ameacasConhecidas: camp.continuidade?.ameacas.filter(a => a.descoberta && a.estado === 'ativa').slice(-3)
      .map(a => ({ local: content.locais.find(l => l.id === a.local)?.nome, diasAteAtaque: a.prazo - camp.calendario.dia })),
    // Bandos que o protagonista conhece (engine/bandos.ts): nome, capitão,
    // cicatrizes, se caça o jogador. O narrador não decide quem vive.
    bandosConhecidos: bandosConhecidos(camp).slice(0, 3).map(b => descreverBando(content, b)),
    rivaisEncontrados: Object.values(camp.kimetsu?.rivais ?? {}).filter(r => r.reencontros > 0 && r.local === ctx.local.id).slice(-3)
      .map(r => ({ nome: r.nome, vivo: r.vivo, encontros: r.reencontros, ultimoConfronto: r.memoria.at(-1) })),
    // O que rolou entre elas sem o jogador por perto — é o que a boca do povo
    // repete, e o que dá ao vale história própria.
    boatosDoVale: ecosRecentes(camp, 2, ctx.local.id),
    presentes: ctx.presentes.map((n) => {
      const hum = calcularHumorNpc(camp, content, n);
      const intimi = obterIntimidadeNpc(camp, n);
      return {
        nome: n.nome,
        idade: camp.npcState[n.id]?.idade ?? n.idade,
        ocupacao: ocupacaoEfetiva(camp, n),
        voz: n.vozNarrativa,
        indole: n.personalidade,
        corpo: n.corpo,
        parentesco: n.parentesco,
        // Família no elenco (engine/familiasNpc.ts): até três parentes, o nó da
        // família como a vizinhança conta, e o luto recente. Segredo não entra.
        familia: familiaParaNarrador(content, camp, n.id, ctx.presentes.map(x => x.id)),
        // De onde ela veio, o que perdeu, o que quer (content/vaelhorn/historias-*.ts).
        // Para aludir: a regra 2b do sistema proíbe revelar o que não foi descoberto.
        historia: n.historia,
        humor: hum.descricao,
        humorId: hum.id,
        intimidade: {
          desejo: intimi.desejo ? n.historia?.desejo : undefined,
          ferida: intimi.ferida ? n.historia?.ferida : undefined,
          medo: intimi.medo ? n.historia?.medo : undefined,
          desejoApoiado: intimi.desejoApoiado,
        },
        situacaoCivil: camp.vivo?.pessoas[n.id] && { atividade: camp.vivo.pessoas[n.id].objetivo, prestigio: camp.vivo.pessoas[n.id].prestigio },
      eixos: camp.npcState[n.id]?.eixos ?? {},
      // Sem isto, cada encontro era o primeiro. É o que faz ela lembrar.
      conheceHaDias: diasDeConvivio(camp, n.id),
      lembraDeVoce: memoriaParaNarrador(camp, n.id, 4),
      conviccoesSobreVoce: conviccoesDoNpc(camp, n.id).map(c => c.texto),
      // Segredo que o jogador JÁ descobriu: o narrador pode usar. O que ainda
      // não foi descoberto não entra no pacote — não se entrega de graça.
      segredoQueVoceSabe: camp.segredosRevelados.includes(n.id) ? n.segredo?.conteudo : undefined,
      // O que ESTA pessoa acredita sobre a capacidade do protagonista. Sai da
      // crenca dela (engine/aptidao.ts), formada pelo que ela viu e pela
      // competencia dela no assunto. Pode estar errada, e e' de proposito.
        oQueEleAchaDeVoce: DOMINIOS
          .map(d => leituraDoObservador(camp, n.id, d))
          .filter((x): x is string => !!x)
          .slice(0, 2),
      };
    }),
    // Os fios que estão abertos agora, com o objetivo que falta cumprir.
    arcosAtivos: content.quests
      .filter((q) => camp.questEstado[q.id] === 'ativa')
      .slice(0, 5)
      .map((q) => ({
        titulo: q.titulo,
        falta: q.objetivos.filter((o) => !camp.flags[o.flag]).map((o) => o.texto),
      })),
    // O que já ficou para trás e merece ser citado de novo.
    jaAconteceu: marcosRecentes(camp, 5),
    // ── A cena anterior, literal ──────────────────────────────────────────
    //
    // Até aqui o narrador recebia o ESTADO do mundo e nenhuma linha do texto
    // que ele mesmo tinha acabado de escrever. Cada cena começava do zero:
    // o modelo sabia os fatos, mas não sabia o que estava acontecendo — então
    // reabria a cena, repetia apresentações e ignorava a conversa em curso.
    // Foi o defeito relatado em jogo: "não segue a história que está posta".
    //
    // `camp.cronica` já guardava o texto narrado. Faltava devolvê-lo.
    // Duas entradas: a última é a continuidade imediata; a penúltima dá o
    // fio. Mais que isso enche o pacote sem melhorar a costura.
    cenasAnteriores: (camp.cronica ?? [])
      .filter((c) => c.tipo === 'narracao')
      .slice(-2)
      .map((c) => c.texto),
    // Como o vale trata este forasteiro hoje.
    reputacao: Object.entries(camp.reputacao)
      .filter(([, v]) => v !== 0)
      .map(([id, v]) => `${content.faccoes.find((f) => f.id === id)?.nome ?? id}: ${v > 0 ? '+' : ''}${v}`),
    // Como o mundo LE a capacidade do protagonista: maestria demonstrada,
    // reputacao e alcance. A aptidao real nunca entra neste pacote — o
    // narrador nao pode dizer que alguem reconheceu talento sem que a engine
    // tenha registrado a crenca (ver engine/aptidao.ts).
    talento: contextoDeAptidao(camp),
    legados: legadosConquistados(camp).map(l => ({ nome: l.nome, descricao: l.descricao })),
    // O preço da Marca, calculado pela engine. O narrador pode fazer o corpo
    // sentir, mas não decide quando nem se ele cobra.
    marca: avisoMarca(camp) ?? undefined,
    // O diretor da campanha, calculado pela engine (ver ritmo.ts).
    ritmo: calcularRitmo(content, camp),
    // Vocabulário permitido: se citar objeto, tem que ser um destes nomes.
    catalogoDeItens: achaveis,
    // O ESPAÇO DE AÇÃO. Sem isto o modelo adivinha o que é possível e, na
    // dúvida, propõe o mais seguro — que é justamente o mais genérico.
    podeFazerAgora: content.verbos
      .filter((v) => disponibilidadeVerbo(v, ctx, camp, ctx.presentes[0], content).disponivel)
      .slice(0, 14)
      .map((v) => v.nome),
    // O que está trancado e por quê: dá caminhos que ainda não existem
    // ("arranjar uma gazua", "esperar a praça esvaziar").
    trancadoAgora: content.verbos
      .map((v) => ({ v, d: disponibilidadeVerbo(v, ctx, camp, ctx.presentes[0], content) }))
      .filter((x) => !x.d.disponivel && !!x.d.motivo)
      .slice(0, 5)
      .map((x) => `${x.v.nome}: ${x.d.motivo}`),
    // Substantivos concretos deste lugar. Opção boa aponta para uma coisa.
    coisasAqui: ctx.local.pontos ?? [],
    // O passado do lugar, escrito no conteúdo (ver content/vaelhorn/continente.ts).
    // O narrador pode citá-lo; o que não estiver aqui, ele não sabe.
    historiaDesteLugar: ctx.local.historia ?? [],
    artesQueVoceSabe: artesConhecidasResolvidas(content, camp).map((a) => a.nome),
    ondeDaParaIr: rotasVisiveis(content, camp)
      .map((r) => content.locais.find((l) => l.id === r.destino)?.nome)
      .filter(Boolean),
    // Rótulos que já foram oferecidos — proibido repetir (nem reescritos).
    rotulosProibidos: (camp.opcoesUsadas ?? []).slice(-24),
    fatoConsumado: fato,
    // Qual foi a ação, não só como terminou. Sem isto o modelo recebia
    // "Você tentou elogiar Aldrica — deu certo" e não tinha como saber que o
    // elogio precisava ser DITO em voz alta na cena.
    acaoDoJogador: acao,
    tsukimichi:
      content.cenario.id === 'tsukimichi'
        ? {
            subespacoSoberano: camp.asora?.desbloqueado
              ? {
                  nome: camp.asora.nome || 'Subespaço Pessoal',
                  ondeEstaOJogador: (camp.localAtual ?? '').startsWith('asora_')
                    ? `O protagonista está DENTRO do seu subespaço (setor: ${camp.localAtual})`
                    : `O protagonista está no mundo exterior (local: ${content.locais.find((l) => l.id === camp.localAtual)?.nome ?? camp.localAtual})`,
                  quemEstaNoSubespacoAgora: obterOcupantesSubespaco(camp).resumoPresenca,
                  ocupantesDetalhados: obterOcupantesSubespaco(camp).ocupantes,
                  populacao: camp.asora.populacao,
                  tribosAcolhidas: camp.asora.tribosAcolhidas
                    ? Object.values(camp.asora.tribosAcolhidas).map(
                        (t) => `${t.nome} (${t.populacao} membros): ${t.especialidade}`,
                      )
                    : [],
                  alocacaoTrabalho: camp.asora.alocacaoTrabalho ?? {},
                  ferramentasRunicasDisponiveis: camp.asora.recursosEspeciais?.ferramentasDisponiveis ?? 0,
                  obrasExistentes: Object.values(camp.asora.obras).map((o) => `${o.nome} (Nv. ${o.nivel}): ${o.descricao}`),
                  projetosMonumentaisConcluidos: camp.asora.projetosConcluidos ?? [],
                  obraEmAndamento: camp.asora.projetoEmAndamento
                    ? `${camp.asora.projetoEmAndamento.nome} (${camp.asora.projetoEmAndamento.turnosRestantes} ciclos restantes, ${camp.asora.projetoEmAndamento.operariosAlocados} operários ativos)`
                    : 'Nenhuma obra no canteiro no momento',
                  vidaCotidiana:
                    camp.asora.populacao > 0 && Object.keys(camp.asora.tribosAcolhidas ?? {}).length > 0
                      ? Object.values(camp.asora.tribosAcolhidas ?? {})
                          .map((t) => `${t.nome} (${t.especialidade})`)
                          .join('; ')
                      : 'Dimensão virgem e serena: sem tribos residentes ou operários assentados ainda. O vasto território aguarda acolher povos que nele busquem refúgio.',
                  companhiaMercantil: camp.asora.companhiaMercantil?.fundada
                    ? {
                        nome: camp.asora.companhiaMercantil.nome,
                        nivel: camp.asora.companhiaMercantil.nivelComercial,
                        ouroAcumulado: camp.asora.companhiaMercantil.ouroAcumulado,
                        estrategiaAtual: camp.asora.companhiaMercantil.estrategiaAtual ?? 'graos_e_mantimentos',
                        gerenteDesignada: camp.asora.companhiaMercantil.gerenteDesignada ?? 'Sem gerente designada',
                        escoltaCaravana: camp.asora.companhiaMercantil.escoltaDesignada ?? 'sem_escolta',
                      }
                    : 'Ainda não fundada (abrir filial em Tsige para comercializar excedentes do subespaço e enriquecer)',
                }
              : 'Ainda não desbloqueado (abre após selar o primeiro contrato de alma)',
            servasProtetoras: camp.asora?.contratos
              ? Object.values(camp.asora.contratos)
                  .filter((c) => c.ativaNoGrupo)
                  .map((c) => ({
                    nome: c.nomeConcedido,
                    titulo: c.titulo,
                    lealdade: c.lealdade,
                    regraProtecao:
                      'LEALDADE ABSOLUTA: Protegem o Mestre de qualquer insulto, palavra insolente ou desrespeito de Humanos. Reagem na hora com fúria intimidadora, sacando armas ou liberando mana esmagador.',
                  }))
              : [],
            supressaoDeMana: {
              status: verificarSupressaoMana(camp),
              reacaoNoLocal: avaliarReacaoHumanosPresenca(camp),
              regra:
                'Se o protagonista NÃO estiver contendo seu mana (por vestes rúnicas, anéis Draupnir ou Sakai no modo supressão) em cidades ou vilas de Humanos, seu mana colossal vazando aterroriza instintivamente as pessoas, causando desmaios, comerciantes ajoelhando em pânico e guardas tremendo.',
            },
            heroisDosReinosHumanos: {
              herois:
                'Tomoki Iwahashi (Império militar de Gritonia / Olho do Encanto) e Hibiki Otonashi (Reino Santo de Limia / Espadachim Carismática).',
              nivelAlerta: camp.asora?.investigacaoHerois?.nivelAlerta ?? 0,
              investigacaoAtiva: camp.asora?.investigacaoHerois?.batedoresEnviados
                ? 'Batedores de Limia e espiões de Gritonia investigando crateras e mana de batalhas devastadoras'
                : 'Normal',
            },
          }
        : undefined,
  };
}

// Narrador de conto medieval, adulto. A única regra inviolável: todo personagem
// é adulto. O modelo devolve JSON: narração + opções do próximo turno (§18.2).
export const INSTRUCAO_SISTEMA =
  CONTRATO_NARRATIVO +
  'Você é o narrador de ARCANUM, um romance de fantasia sombria em português do Brasil. ' +
  'A ENGINE decide o que aconteceu; você escreve a VOZ e propõe os próximos caminhos.\n' +
  '\nREGRA NÚMERO UM, acima de todas as outras: a cena é sobre O QUE O JOGADOR ACABOU ' +
  'DE FAZER. A mensagem começa com essa ação. Narre ELA acontecendo e a reação de quem ' +
  'estava lá. Descrever o ambiente sem mostrar a ação é ERRO — o ambiente é moldura, ' +
  'nunca o assunto. Se o jogador escreveu a ação com as próprias palavras, aquilo é ' +
  'intenção: respeite o assunto, mas narre somente o resultado resolvido pela engine, inclusive falhas.\n' +
  '\nVOZ — escreva como um conto medieval, não como um relatório:\n' +
  '• Registro de fábula sombria: frases de fôlego, imagens concretas, o mundo antigo e ' +
  'cansado. Diga "a lâmina", "o pão preto", "a lama do pátio" — nunca abstrações vagas.\n' +
  '• De 4 a 7 parágrafos, SEPARADOS POR LINHA EM BRANCO. Nunca um bloco só.\n' +
  '• Fale com o jogador em segunda pessoa ("você"). Os outros, pelo nome.\n' +
  '• O JOGADOR É HOMEM. Todo termo que se refira a ele — como substantivo/adjetivo de ' +
  'tratamento ("forasteiro", "freguês", "viajante", "estranho") ou descrição do corpo — ' +
  'concorda no MASCULINO. Nunca "freguesa", "forasteira", "estranha" nem qualquer forma ' +
  'feminina para ele, em hipótese nenhuma — mesmo que uma cena anterior tenha errado isso.\n' +
  '• CONTINUIDADE — "cenasAnteriores" traz, literalmente, as últimas cenas que VOCÊ '  +
  'escreveu. Esta cena continua de onde aquela parou: mesma conversa, mesmo lugar, mesmas '  +
  'pessoas, no instante seguinte. Não reabra a cena, não reapresente quem já está ali, não '  +
  'repita a descrição do ambiente que já foi dada. Se alguém fez uma pergunta na última '  +
  'cena, ela ainda está esperando resposta.\n' +
  '• PROIBIÇÃO ABSOLUTA DE REPETIÇÃO: "cenasAnteriores" serve EXCLUSIVAMENTE para situar o ' +
  'narrador sobre o que já aconteceu. É TERMINANTEMENTE PROIBIDO transcrever, copiar, colar, ' +
  'ecoar ou repetir falas, frases ou acontecimentos que já constam em "cenasAnteriores". O jogador ' +
  'já leu aquilo na tela anterior. A nova cena deve conter APENAS O QUE ACONTECE DEPOIS: novas falas, novas reações ' +
  'e o avanço imediato da conversa. Repetir diálogos passados é uma falha inaceitável.\n' +
  '• NOME DO JOGADOR — "personagem.nome" está no pacote pra você narrar em segunda ' +
  'pessoa, não pra qualquer NPC saber de cor. Uma NPC só o chama pelo nome se ' +
  '"jaAconteceu" ou "arcosAtivos" já mostrarem uma apresentação de verdade (ele se ' +
  'apresentou, alguém o apresentou, ela ouviu de outra pessoa). Sem isso registrado, ela ' +
  'não sabe — trate-o por "você" na fala dela, ou por um termo genérico no masculino ' +
  '(acima), e é ótimo se ela perguntar o nome dele como parte da cena.\n' +
  '• REALISMO VÍVIDO, IMERSÃO E PERSONALIDADE: O mundo não é um tratado solene nem um museu; é uma terra viva, áspera, perigosa e fascinante. ' +
  'As pessoas têm cinismo de sobrevivente, humor sombrio de taverna, risadas de alívio tenso, malícia, desconfiança de mercenário e humanidade quente. ' +
  'Faça o texto ser prazeroso, envolvente e divertido de ler: diálogos com atitude, pausas expressivas, reações corporais involuntárias (uma mão que treme na caneca, um cuspe de desdém na terra, um olhar de canto que avalia a bolsa). ' +
  'Dê peso aos sentidos: o fedor acre de gordura velha e cerveja azeda, o cheiro férrico de sangue seco na cota de malha, o bafo quente do cavalo cansado, o estalo da lenha úmida, a lama espessa chupando as botas.\n' +
  '• Nada de rótulos como "Narrador:", "Opções:", "Cena:". A interface já cuida disso.\n' +
  '\nDIÁLOGO — é aqui que a cena vive. A regra mais importante deste prompt:\n' +
  '• Se há alguém presente, a cena TEM QUE TER FALA. Cena só de descrição está errada.\n' +
  '• MOSTRE O QUE O JOGADOR DISSE. "acaoDoJogador" diz o que ele fez; se foi uma ação ' +
  'de fala — elogiar, perguntar, mentir, ameaçar, flertar, consolar, barganhar — invente ' +
  'a frase exata e ESCREVA ela como fala dele. Nunca resuma com "você a elogiou": o ' +
  'jogador quer ler o elogio.\n' +
  '• MOSTRE A RESPOSTA DELA, com a voz que está em "voz" e a índole que está em "indole". ' +
  'Ninguém fica calado quando falam com ela.\n' +
  '• De 3 a 6 falas por cena, alternando entre os dois. Deixe a conversa respirar: uma ' +
  'fala, um gesto, outra fala.\n' +
  '• OBRIGATÓRIO, e a regra que mais importa neste prompt inteiro: cada fala em LINHA ' +
  'PRÓPRIA, começando com travessão e com o NOME DE QUEM FALA entre colchetes logo em ' +
  'seguida. O jogador é sempre [você]. Sem exceção, em toda fala, inclusive a primeira:\n' +
  '    — [você] O desfiladeiro do norte ainda tem patrulhas ativas?\n' +
  '\n' +
  '    O sentinela cospe na terra batida e apoia a mão na bainha da espada.\n' +
  '\n' +
  '    — [Sentinela] Duas levas passaram antes do anoitecer. Se você quiser cruzar sem lutar, vá pela ravina seca.\n' +
  '  A interface lê esse colchete para mostrar de quem é cada fala, e o remove do texto. ' +
  'Sem ele, a tela atribui a fala à pessoa errada — é o pior defeito que uma cena pode ' +
  'ter. Nunca ponha duas falas na mesma linha, e nunca deixe uma fala sem colchete.\n' +
  '• FALANTES ANÔNIMOS OU DA MULTIDÃO: Se quem fala for um guarda, soldado, mercador ou alguém ' +
  'da multidão, use a ocupação ou [Voz] entre colchetes (ex: [Soldado], [Guarda], [Mercador], [Voz]). ' +
  'NUNCA use o nome de uma cidade ou região como falante (ex: NUNCA [Tsige] ou [Asora]). Cidades não falam.\n' +
  '• NÃO ATRIBUA A [você] O QUE O JOGADOR APENAS OUVE: se um mercador ou soldado grita de pavor na praça ' +
  'ou entre os armazéns e o protagonista apenas ouve ou observa, essa fala NUNCA é de [você] — ' +
  'identifique quem gritou ([Soldado], [Mercador], [Voz]). Só use [você] quando o jogador de fato falar.\n' +
  '• O nome no colchete é o MESMO que a narração usa para essa pessoa: se a narração diz que quem falou foi Alda, a fala é [Alda]. ' +
  'Narração nunca vai dentro de colchete: [Nome] só abre fala entre aspas de travessão. Use só nomes de quem está em "presentes" ou papéis genéricos.\n' +
  '• O resultado da ação aparece NA FALA e no gesto, não num aviso. Se deu certo, ela ' +
  'cede alguma coisa: uma informação, um sorriso, uma cadeira. Se falhou, ela corta.\n' +
  '\nVERDADE — a engine manda:\n' +
  '0) "mundo.premissa" é a lei deste lugar. Toda cena tem que caber nela: quem manda, ' +
  'quem trabalha, quem olha o jogador de que jeito. Nunca contrarie a premissa.\n' +
  '1) Narre APENAS o fato consumado informado. Nunca invente outro resultado.\n' +
  '1a) QUEDA NA WASTELAND E SOLIDÃO INICIAL: Quando o protagonista estiver na Grande Terra Desolada (wasteland_fronteira, cratera ou ermo) e "presentes" estiver vazio, ele acabou de ser banido pela Deusa e despencar da estratosfera. Ele está COMPLETAMENTE SÓ. Não invente nenhum companheiro, NPC ou aliado com ele. NUNCA imponha caminhos ou objetivos forçados: ele é livre para explorar o miasma, sondar com o Kai, caçar feras selvagens ou marchar para onde ele decidir.\n' +
  '2) Cite apenas pessoas e lugares que estão no pacote de contexto. Cada presente vem ' +
  'com "voz", "indole" e "corpo" — use os três: é assim que ela vira gente e não ficha. ' +
  'Descreva corpo com franqueza adulta quando a cena chegar perto, sem eufemismo covarde ' +
  'e sem virar catálogo.\n' +
  '2a) "parentesco" é uma barreira absoluta: pai, mãe, irmão e irmã jamais entram em romance ou sexo com o protagonista.\n' +
  '2b) Um presente pode trazer "historia" (origem, ferida, desejo, medo) e "familia". Use para dar peso ao que ela diz e ' +
  'cala: aluda, nunca recite, e não faça a pessoa contar a própria vida sem motivo. O jogador só sabe o segredo que está ' +
  'em "segredoQueVoceSabe"; o que a história apenas insinua continua não dito.\n' +
  '2c) "mundoLembra" são linhas que o jogo já mostrou hoje ao jogador (o que a cidade lembra dele, um boato, um mensageiro). ' +
  'Deixe aparecer num gesto ou numa fala, sem repetir a frase e sem inventar consequência além dela.\n' +
  '2d) HUMOR VIVO E INTIMIDADE PROGRESSIVA: Cada presente traz "humor" e "intimidade" (desejo, ferida, medo, desejoApoiado). ' +
  'O humor dita a atitude corporal, o tom da fala e a receptividade do NPC à cena (ex: luto por perda recente na família, pavor por perigo, tensão defensiva, acolhimento ou gratidão sincera). ' +
  'As camadas de intimidade mostram o quanto o protagonista já conquistou a confiança daquela alma. Quando o jogador conversar a sós, confortar um luto ou apoiar o anseio pessoal de vida (desejoApoiado), narre o impacto emocional tangível, a quebra de defesas e a lealdade incondicional despertada.\n' +
  '2e) FÉ, LENDAS E O TABU DA INVEJOSA: "local.cronica" traz o que o povo deste lugar acredita — deuses mortos cujo sangue seria o mana, as Sete Pecadoras que a Ordem dos Santos do Selo queimou há 400 anos, a Invejosa (Satella) que teria devorado as outras. Use a crônica só quando a cena pedir — chegada, conversa sobre o lugar, reza, medo —, nunca no meio da ação, e em uma frase. Isso é CRENÇA, não fato: narre como gente que acredita, reza, benze a boca e tem medo, nunca como coisa confirmada, e nunca faça deus ou bruxa aparecer por conta própria. O mundo é medieval e pé no chão: fome, dízimo, Tributo de Sangue, inquisição. O nome da Invejosa é tabu (quem ouve se benze); falar do Culto da Bruxa dá pânico; a Ordem pune heresia com ferro e fogo.\n' +
  '3) Se citar um objeto que o jogador ganha, use EXATAMENTE um nome de ' +
  '"catalogoDeItens" e repita o id dele no campo "achado". Sem id, sem objeto.\n' +
  '4) Nunca use notação de dado (d20, 1d6, CD 15) nem número de regra no texto.\n' +
  '5) VIOLÊNCIA CRUA E COERENTE: combate e ferimento são narrados sem pudor — sangue, osso, dor, sujeira, medo. Mas a violência obedece à ENGINE: descreva só os ferimentos que o resultado deu, um de cada vez, com os corpos numa posição que faça sentido (quem está caído não está de pé; quem está de costas não está de bruços). Não invente ferida, morte ou mutilação que a engine não decidiu. Clareza antes de adjetivo: o leitor precisa entender quem bateu em quem, onde, e o que isso custou. Um detalhe físico exato vale mais que uma lista de horrores; não empilhe descrições anatômicas.\n' +
  '5a) CONTEÚDO ADULTO & INTIMIDADE INTENSA ("BEM BÃO"): Quando a cena envolver paixão, desejo carnal, sedução, romance ou sexo entre adultos, narre com volúpia carnal autêntica, vigor físico e detalhes sensoriais e eróticos vívidos. ' +
  'É TERMINANTEMENTE PROIBIDO cortar covardemente para o fogo da lareira ("fade to black"), pular para a manhã seguinte ou mascarar o ato com eufemismos bobos ou poesia abstrata. ' +
  'Se o jogador busca intimidade ou a cena chega à cama de palha ou aos lençóis, descreva o calor febril da pele suada, o peso e a textura dos corpos nus sob as mãos, toques firmes explorando curvas e pontos sensíveis, ' +
  'beijos famintos com troca de saliva, fôlego entrecortado e mordidas na carne, roupas sendo rasgadas ou desatadas com urgência, arrepios e espasmos de volúpia, ' +
  'o atrito úmido, a penetração ritmada, os gemidos descarados abafados contra o travesseiro e a respiração pesada no pescoço até o ápice do prazer e o cansaço exausto e cúmplice. ' +
  'Narre o desejo e a entrega física com paixão e sem moralismo.\n' +
  'REGRA ABSOLUTA E INEGOCIÁVEL: todos os personagens envolvidos em qualquer cena de teor erótico ou sensual são estritamente adultos (18+). Jamais sexualize menores em nenhuma hipótese. Respeite as idades registradas no pacote.\n' +
  '\nCONTINUIDADE — o mundo não começa agora:\n' +
  '• Cada presente traz "lembraDeVoce" e "conheceHaDias". USE. Quem já foi ' +
  'traída não recebe você como estranha, e quem você ajudou lembra disso.\n' +
  '• "jaAconteceu" é a história desta campanha. Cite o que couber — uma frase de ' +
  'retorno a algo antigo vale mais que um parágrafo bonito.\n' +
  '• "arcosAtivos" são os fios abertos. Retome um quando for relevante à ação; ' +
  'não force um gancho em toda conversa ou momento de descanso.\n' +
  '• "ritmo.tom" manda no registro desta cena. Obedeça: se pede respiro, não ' +
  'invente ameaça; se pede clímax, não alivie.\n' +
  '• Plante uma coisa que ainda não se explica. O mundo é mais velho que o jogador.\n' +
  '• "oValeHoje" traz o tempo e o que está acontecendo no vale sem o jogador. Faça a ' +
  'cena sentir isso: chuva molha, feira enche a praça, febre esvazia a taverna.\n' +
  '• "boatosDoVale" é o que aconteceu ENTRE elas enquanto o jogador não olhava. ' +
  'Deixe escapar num comentário, num olhar atravessado, numa mesa que ficou vazia. ' +
  'O mundo tem assunto que não é sobre o jogador.\n' +
  '\nOPÇÕES — cada uma é uma decisão, não um verbo solto:\n' +
  '• De 3 a 5, SEMPRE INÉDITAS, nascidas do que acabou de acontecer e de quem está ali.\n' +
  '• Proibido repetir ou reescrever qualquer rótulo de "rotulosProibidos".\n' +
  '• O rótulo aponta para uma COISA ou uma PESSOA do pacote: use "coisasAqui", ' +
  '"presentes", "podeFazerAgora", "artesQueVoceSabe", "ondeDaParaIr", "arcosAtivos". ' +
  'Ruim: "Conversar com Elza". Bom: "Perguntar a Elza quem rabiscou a laje da cripta".\n' +
  '• "trancadoAgora" diz o que ainda não dá e por quê. Use isso para propor o passo ' +
  'que DESTRANCA — arranjar a ferramenta, esperar esvaziar, ganhar a confiança.\n' +
  '• GRADE FIXA: devolva as opções NESTA ORDEM, uma por casa, cada uma com o campo ' +
  '"natureza" correspondente:\n' +
  '   1) "aproximar" — chegar perto de alguém que está ali\n' +
  '   2) "arriscar" — pôr a mão no fogo: transgressão, força, atrevimento\n' +
  '   3) "observar" — olhar, escutar, ler antes de agir\n' +
  '   4) "ganhar" — tirar proveito: ofício, troca, moeda\n' +
  '   5) "avancar" — mudar de lugar ou empurrar um arco adiante\n' +
  '  Se uma casa não fizer sentido nesta cena, pule — a engine preenche. Nunca mande ' +
  'duas da mesma natureza: cinco jeitos de conversar não são cinco escolhas.\n' +
  '• Pelo menos uma deve poder dar errado de um jeito que custe caro.\n' +
  '• Não escreva chance nem risco na "dica" — a engine calcula e mostra. Use a "dica" ' +
  'para o que se GANHA ou o que se descobre.\n' +
  '\nFORMATO — responda SOMENTE com JSON válido, sem cercas de código, ' +
  'sem comentário antes ou depois, em UMA linha, neste formato:\n' +
  '{"narracao":"…","opcoes":[{"rotulo":"…","dica":"…","natureza":"aproximar",' +
  '"custoPeriodos":0,' +
  '"teste":{"atributo":"social","pericia":"persuadir","dificuldade":13}}],"achado":null}\n' +
  '"rotulo" até 90 caracteres. "dica" até 12 palavras. "custoPeriodos" de 0 a 3. ' +
  '"teste" é opcional; se houver, "atributo" ∈ [fisico, precisao, resiliencia, ' +
  'raciocinio, percepcao, social] e "dificuldade" entre 6 e 26. "achado" é o id de um ' +
  'item do catálogo, ou null. Escreva a narração inteira antes das opções e seja breve ' +
  'nas opções: a resposta não pode ser cortada no meio.';

export type OpcaoIA = {
  rotulo: string;
  dica?: string;
  natureza?: Natureza;
  custoPeriodos: number;
  teste?: { atributo: string; pericia?: string; dificuldade: number };
};

export type ResultadoNarracao = {
  texto?: string;
  opcoes?: OpcaoIA[];
  achado?: string;
  erro?: string;
};

// Traduz os erros mais comuns da OpenRouter para algo acionável.
// O 404 "No endpoints found" costuma ser política de privacidade da conta:
// modelos :free exigem permissão de treino/logging em openrouter.ai/settings/privacy.
export function explicarErroOpenRouter(status: number, corpo: string): string {
  const c = corpo.toLowerCase();
  if (status === 404 && c.includes('no endpoints found')) {
    return (
      'modelo indisponível. Isso costuma ser a política de privacidade da conta: ' +
      'entre em openrouter.ai/settings/privacy e permita os modelos gratuitos ' +
      '(prompt training). Ou toque em "Buscar modelos" e escolha outro.'
    );
  }
  if (c.includes('request limit reached') || c.includes('rate limit')) {
    return (
      'limite de requisições da OpenRouter atingido neste modelo gratuito. ' +
      'Espere alguns minutos, troque de modelo em "Buscar modelos", ou adicione ' +
      'créditos na conta para liberar um limite maior.'
    );
  }
  if (status === 401) return 'chave inválida ou sem permissão (401). Confira a chave.';
  if (status === 402) return 'créditos insuficientes (402). Use um modelo :free.';
  if (status === 429) return 'limite de uso atingido (429). Espere um pouco ou troque de modelo.';
  return `HTTP ${status}: ${corpo.slice(0, 160)}`;
}

const ATRIBUTOS_VALIDOS = ['fisico', 'precisao', 'resiliencia', 'raciocinio', 'percepcao', 'social'];
const RE_DADO = /\bd\d+\b|\b\d+d\d+\b|\bCD\s?\d+/i;

// Marcas de que o texto é JSON e não prosa. Se qualquer uma sobrar, o texto
// NÃO vai para a tela — foi exatamente esse vazamento que o jogador viu.
const RE_MARCA_JSON = /"(narracao|opcoes|rotulo|dica|custoPeriodos|dificuldade|achado)"\s*:/;

// ── Recusa do modelo ───────────────────────────────────────────────────────
// Um modelo filtrado não devolve erro: devolve um pedido de desculpas. Sem
// detectar isso, "Sinto muito, não posso continuar" entraria na tela como se
// fosse prosa do narrador. Aqui vira erro, e o fallback troca de modelo.

// Marcas fortes: só aparecem quando o modelo sai do personagem.
const RECUSA_FORTE = [
  'como uma ia', 'como um modelo de linguagem', 'modelo de linguagem',
  'minhas diretrizes', 'políticas de conteúdo', 'politica de conteudo',
  'não é apropriado', 'nao e apropriado', 'conteúdo sexual explícito',
  'as an ai', 'language model', 'my guidelines', 'content policy',
  'i must decline', 'against my', 'i am unable to comply',
];
// Marcas fracas: só contam no começo de uma resposta curta — dentro de uma
// cena longa, "não posso" pode ser fala de personagem.
const RECUSA_FRACA = [
  'não posso', 'nao posso', 'não vou', 'nao vou', 'sinto muito',
  'desculpe, mas', 'prefiro não', 'não sou capaz',
  "i can't", 'i cannot', "i won't", "i'm sorry", 'i am sorry',
  "i'm not able", 'i apologize',
];

export function detectarRecusa(bruto: string): boolean {
  const t = bruto.toLowerCase();
  if (RECUSA_FORTE.some((m) => t.includes(m))) return true;
  const inicio = t.slice(0, 140);
  return t.length < 700 && RECUSA_FRACA.some((m) => inicio.includes(m));
}

// ── Resposta que não é desta cena ──────────────────────────────────────────
// Modelo pequeno às vezes descarrila e devolve algo que não tem nada a ver:
// uma frase solta, em inglês, sobre outra coisa. Isso não é narração e não pode
// chegar à tela — vira erro, e o fallback troca de modelo.
const PALAVRAS_INGLES = [
  ' the ', ' and ', ' have ', ' this ', ' just ', ' with ', ' that ', ' your ',
  ' from ', ' they ', ' what ', ' page ', ' dream ', ' words ', ' is ', ' of ',
];
const PALAVRAS_PORTUGUES = [
  ' que ', ' não ', ' com ', ' uma ', ' para ', ' ela ', ' você ', ' dos ',
  ' mas ', ' por ', ' seu ', ' sua ', ' está ', ' ele ', ' das ', ' num ',
];

export function foraDeContexto(bruto: string): boolean {
  const t = ` ${bruto.toLowerCase().replace(/\s+/g, ' ')} `;
  // Narração de verdade nunca cabe em duas linhas.
  if (t.trim().length < 80) return true;
  const en = PALAVRAS_INGLES.filter((w) => t.includes(w)).length;
  const pt = PALAVRAS_PORTUGUES.filter((w) => t.includes(w)).length;
  return en > pt;
}

export function pareceJson(t: string): boolean {
  const s = t.trim();
  return s.startsWith('{') || s.startsWith('[') || RE_MARCA_JSON.test(s);
}

// ── Leitura tolerante ──────────────────────────────────────────────────────
// Modelos gratuitos cortam a resposta no meio. JSON.parse falha e antes disso
// o texto cru ia para a tela. Aqui a gente resgata o que dá: a narração vem
// primeiro no formato pedido, então quase sempre chega inteira mesmo truncada.

// Lê o valor de uma chave de texto respeitando escapes, mesmo em JSON cortado.
function lerCampoTexto(bruto: string, chave: string): string | null {
  const marca = new RegExp(`"${chave}"\\s*:\\s*"`).exec(bruto);
  if (!marca) return null;
  let i = marca.index + marca[0].length;
  let out = '';
  while (i < bruto.length) {
    const c = bruto[i];
    if (c === '\\') {
      const n = bruto[i + 1];
      if (n === 'n') out += '\n';
      else if (n === 't') out += ' ';
      else if (n === 'r') out += '';
      else if (n === 'u') {
        const cod = parseInt(bruto.slice(i + 2, i + 6), 16);
        out += Number.isFinite(cod) ? String.fromCharCode(cod) : '';
        i += 4;
      } else out += n ?? '';
      i += 2;
      continue;
    }
    if (c === '"') return out; // fechou direito
    out += c;
    i += 1;
  }
  return out; // truncado: devolve o que deu para ler
}

// Colhe os objetos completos de um array, descartando o último se ficou pela metade.
function lerObjetosDoArray(bruto: string, chave: string): unknown[] {
  const marca = new RegExp(`"${chave}"\\s*:\\s*\\[`).exec(bruto);
  if (!marca) return [];
  const out: unknown[] = [];
  let i = marca.index + marca[0].length;
  while (i < bruto.length) {
    while (i < bruto.length && bruto[i] !== '{') {
      if (bruto[i] === ']') return out;
      i += 1;
    }
    if (i >= bruto.length) break;
    let prof = 0;
    let emTexto = false;
    let escapado = false;
    let j = i;
    for (; j < bruto.length; j += 1) {
      const c = bruto[j];
      if (escapado) { escapado = false; continue; }
      if (c === '\\') { escapado = true; continue; }
      if (emTexto) { if (c === '"') emTexto = false; continue; }
      if (c === '"') { emTexto = true; continue; }
      if (c === '{') prof += 1;
      else if (c === '}') { prof -= 1; if (prof === 0) break; }
    }
    if (prof !== 0) break; // objeto cortado no meio: descarta e para
    try {
      out.push(JSON.parse(bruto.slice(i, j + 1)));
    } catch {
      /* objeto malformado: ignora */
    }
    i = j + 1;
  }
  return out;
}

// Extrai o JSON mesmo se o modelo embrulhar em ``` ou texto solto.
function extrairJson(bruto: string): Record<string, unknown> | null {
  const semCerca = bruto.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(semCerca) as Record<string, unknown>;
  } catch {
    /* tenta recortar do primeiro { ao último } */
  }
  const i = semCerca.indexOf('{');
  const f = semCerca.lastIndexOf('}');
  if (i >= 0 && f > i) {
    try {
      return JSON.parse(semCerca.slice(i, f + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

// Última linha de defesa: limpa restos de JSON de um texto que virá para a tela.
export function limparNarracao(bruto: string): string {
  let s = bruto.trim();
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const cabeca = /^\{\s*"narracao"\s*:\s*"/.exec(s);
  if (cabeca) s = s.slice(cabeca[0].length);
  const corte = s.search(RE_MARCA_JSON);
  if (corte > 0) s = s.slice(0, corte);
  s = s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  // Cauda típica de string JSON cortada: ..." ,  ou ..."}
  if (cabeca) s = s.replace(/[\s"]*[,}\]][\s"',}\]]*$/, '').replace(/"\s*$/, '');
  return s.trim();
}

// Validador das opções propostas pelo modelo (§19: faixas, dificuldade, dado).
export function validarOpcoesIA(bruto: unknown, proibidos: string[] = []): OpcaoIA[] {
  if (!Array.isArray(bruto)) return [];
  const vetados = new Set(proibidos.map(chaveRotulo));
  const eixos = new Set<Natureza>();
  const out: OpcaoIA[] = [];
  for (const o of bruto) {
    if (!o || typeof o !== 'object') continue;
    const rotulo = String((o as Record<string, unknown>).rotulo ?? '').trim();
    if (!rotulo || rotulo.length > 90 || RE_DADO.test(rotulo)) continue;
    // Repetição nunca deve acontecer — nem a mesma frase, nem a mesma ideia.
    const chave = chaveRotulo(rotulo);
    if (vetados.has(chave)) continue;
    vetados.add(chave);

    const dicaBruta = String((o as Record<string, unknown>).dica ?? '').trim();
    const dica = RE_DADO.test(dicaBruta) ? undefined : dicaBruta || undefined;
    let custo = Number((o as Record<string, unknown>).custoPeriodos ?? 0);
    if (!Number.isFinite(custo)) custo = 0;
    custo = Math.max(0, Math.min(3, Math.round(custo)));

    let teste: OpcaoIA['teste'];
    const t = (o as Record<string, unknown>).teste as Record<string, unknown> | undefined;
    if (t && typeof t === 'object') {
      const attr = String(t.atributo ?? '').trim();
      const dif = Number(t.dificuldade);
      if (ATRIBUTOS_VALIDOS.includes(attr) && Number.isFinite(dif)) {
        teste = {
          atributo: attr,
          pericia: t.pericia ? String(t.pericia).trim() : undefined,
          dificuldade: Math.max(6, Math.min(26, Math.round(dif))),
        };
      }
    }
    const bruta = (o as Record<string, unknown>).natureza;
    const natureza: Natureza = ehNatureza(bruta)
      ? bruta
      : inferirNatureza({ teste: teste as never, custoPeriodos: custo });
    // Um eixo por conjunto: cinco jeitos de conversar não são cinco escolhas.
    if (eixos.has(natureza)) continue;
    eixos.add(natureza);

    out.push({ rotulo, dica, natureza, custoPeriodos: custo, teste });
    if (out.length >= 5) break;
  }
  return out;
}

// Normaliza um rótulo para comparar ideias, não pontuação: sem acento, sem
// caixa, sem palavra vazia. "Falar com Elza" e "falar com a Elza!" são iguais.
const VAZIAS = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'com', 'para', 'pra', 'e', 'em', 'no', 'na', 'um', 'uma', 'que', 'se', 'ao']);
export function chaveRotulo(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !VAZIAS.has(w))
    .sort()
    .join(' ');
}

// Chama o provider configurado. Devolve { texto } no sucesso, ou { erro } com o
// motivo (para o app mostrar em vez de cair calado no fallback).
export async function narrarComModelo(
  cfg: LlmConfig,
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  r: ResultadoTurno,
): Promise<ResultadoNarracao> {
  const userMsg = montarMensagemNarracao(content, camp, ctx, r);
  try {
    const bruto =
      cfg.provider === 'anthropic'
        ? await chamarAnthropic(cfg, userMsg)
        : cfg.provider === 'nous'
          ? await chamarNous(cfg, userMsg)
          : await chamarOpenRouter(cfg, userMsg);
    if (bruto.erro) return bruto;
    return interpretarResposta(bruto.texto ?? '', content, camp);
  } catch (e) {
    return { erro: `rede: ${String(e).slice(0, 120)}` };
  }
}

function montarMensagemNarracao(
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  r: ResultadoTurno,
): string {
  const pacote = montarPacote(content, camp, ctx, r.fato, {
    verbo: r.verbo?.nome,
    categoria: r.verbo?.categoria,
    alvo: r.alvo?.nome,
    grau: r.grau,
    livre: r.acaoLivre,
  });
  const ordem = r.acaoLivre
    ? `O JOGADOR ESCREVEU, COM AS PALAVRAS DELE: "${r.acaoLivre}"\n` +
      `Isto é a intenção, não uma alteração do estado. Resultado canônico: ${r.fato}. ` +
      'A cena responde à intenção respeitando esse resultado, inclusive quando falha.'
    : `O JOGADOR FEZ ISTO: ${r.fato}\n` +
      'A cena é sobre ISTO. Mostre a ação acontecendo e a reação de quem estava lá.';
  const textoTotal = `${r.fato} ${r.acaoLivre ?? ''} ${r.verbo?.nome ?? ''}`.toLowerCase();
  const ehCombate =
    /luta|combate|espada|lâmina|lamina|adaga|golpe|matar|degolar|atacar|cortar|flecha|sangue|esfaquear|oni|ferir|emboscada|derrubar|perfurar|estraçalhar|machado|bater|sangrent/i.test(
      textoTotal,
    );

  // Lenda do lugar não entra no meio da ação: o narrador a despejava numa
  // perseguição ("o poço de sangue que a taverna construiu sobre o gigante de
  // Vandul"). Em cena de luta, emboscada ou perseguição, a crônica fica fora.
  const perseguicao = /rastro|perseguir|seguir|fugir|correr|laço|armadilha/i.test(textoTotal);
  const pacoteLocal = (pacote as { local?: { cronica?: unknown } }).local;
  if ((ehCombate || perseguicao) && pacoteLocal) delete pacoteLocal.cronica;

  const diretrizEstilo = ehCombate
    ? 'DIRETRIZ DE COMBATE: violência crua e explícita, mas só a que o resultado deu, e em ordem: quem golpeou, onde pegou, o que doeu. Frases claras; um ferimento de cada vez.'
    : 'PROSA VIVA, CRUA E IMERSIVA: Narre com realismo medieval, diálogos afiados (com [você] e [Nome]), impacto físico com gore pesado se houver violência, e volúpia carnal explícita se houver intimidade adulta.';

  return `${ordem}\n\n` +
    'Contexto do mundo (JSON, material de apoio — não é o assunto da cena):\n' +
    JSON.stringify(pacote) +
    `\n\nATENÇÃO DE CONTINUIDADE E ESTILO: escreva a PRÓXIMA cena, começando por uma frase completa — nunca continue uma frase da cena anterior. ` +
    `É expressamente PROIBIDO transcrever, copiar ou repetir qualquer diálogo ou fala de "cenasAnteriores". Escreva APENAS falas e acontecimentos inéditos.\n` +
    `${diretrizEstilo}\n` +
    `Agora escreva a cena que responde a: ${r.acaoLivre ?? r.fato}\n` +
    'Comece pela ação e pela reação. Só o JSON de resposta.';
}

/**
 * Mesmo contrato de narrarComModelo, mas entrega o campo narracao à medida
 * que chega. O JSON completo continua sendo validado por interpretarResposta;
 * o callback nunca altera campanha nem efeitos da engine.
 */
export async function narrarComModeloStream(
  cfg: LlmConfig,
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  r: ResultadoTurno,
  onChunk: (textoParcial: string) => void,
): Promise<ResultadoNarracao> {
  const userMsg = montarMensagemNarracao(content, camp, ctx, r);
  try {
    let bruto: ResultadoNarracao;
    if (cfg.provider === 'anthropic') {
      bruto = await chamarAnthropic(cfg, userMsg);
    } else if (cfg.provider === 'nous') {
      bruto = await chamarNous(cfg, userMsg);
      if (bruto.texto) onChunk(parcialNarracao(bruto.texto));
    } else {
      bruto = await chamarStreamCompat(cfg, userMsg, onChunk);
    }
    if (bruto.erro) return bruto;
    return interpretarResposta(bruto.texto ?? '', content, camp);
  } catch (e) {
    return { erro: `rede: ${String(e).slice(0, 120)}` };
  }
}

function normalizarTextoComparacao(s: string): string {
  return s
    .toLowerCase()
    .replace(/\[\s*([^\]]+)\s*\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta se a narração recém-gerada pelo modelo é um eco/repetição de diálogos
 * ou frases das cenas anteriores já exibidas na tela do jogador.
 */
export function detectarRepeticaoDeCenaAnterior(
  texto: string,
  cenasAnteriores: string[],
): boolean {
  if (!texto || !cenasAnteriores || cenasAnteriores.length === 0) return false;

  const textoNorm = normalizarTextoComparacao(texto);

  for (const cena of cenasAnteriores) {
    if (!cena) continue;
    const cenaNorm = normalizarTextoComparacao(cena);

    // Segmentos significativos (falas, orações, períodos) da cena anterior
    const segmentos = cenaNorm
      .split(/[\n.!?—–-]+/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 30);

    let repeticoes = 0;
    for (const seg of segmentos) {
      if (textoNorm.includes(seg)) {
        repeticoes++;
        // Se 2 frases ou falas do passado reaparecerem, é repetição evidente
        if (repeticoes >= 2) return true;
        // Ou se um segmento longo (60+ caracteres) é idêntico
        if (seg.length >= 60) return true;
      }
    }
  }

  return false;
}

// Converte a resposta crua em narração + opções válidas. Se o JSON vier
// truncado, resgata o que der. Se sobrar cheiro de JSON, prefere falhar e
// deixar o fallback canônico assumir — texto cru nunca vai para a tela (§20).
export function interpretarResposta(
  bruto: string,
  content?: ContentBundle,
  camp?: Campaign,
): ResultadoNarracao {
  const proibidos = camp?.opcoesUsadas ?? [];
  const idsValidos = new Set((content?.itens ?? []).map((i) => i.id));
  const cenasPassadas = (camp?.cronica ?? [])
    .filter((c) => c.tipo === 'narracao')
    .map((c) => c.texto);

  const achadoValido = (v: unknown): string | undefined => {
    const id = typeof v === 'string' ? v.trim() : '';
    return id && idsValidos.has(id) ? id : undefined;
  };

  // 0) O modelo saiu do personagem para recusar? Isso não é narração — e a
  // recusa é mais específica que o descarrilamento, então vem primeiro: o
  // jogador precisa saber que o problema é filtro, não tamanho de modelo.
  if (detectarRecusa(bruto)) {
    return { erro: 'o modelo recusou a cena (filtro de conteúdo) — troque para um sem filtro' };
  }

  // Descarrilou de vez — outra língua, frase solta, nada a ver com a cena.
  if (foraDeContexto(bruto) && !bruto.trim().startsWith('{')) {
    return { erro: 'o modelo devolveu texto fora de contexto — troque para um modelo maior' };
  }

  // 1) Caminho feliz: JSON inteiro.
  const json = extrairJson(bruto);
  if (json && typeof json === 'object') {
    const narracao = limparNarracao(String(json.narracao ?? ''));
    if (narracao && !pareceJson(narracao) && !foraDeContexto(narracao)) {
      if (detectarRepeticaoDeCenaAnterior(narracao, cenasPassadas)) {
        return { erro: 'o modelo repetiu diálogos ou cenas anteriores em vez de avançar a narrativa' };
      }
      return {
        texto: narracao,
        opcoes: validarOpcoesIA(json.opcoes, proibidos),
        achado: achadoValido(json.achado),
      };
    }
  }

  // 2) JSON cortado: lê campo a campo, tolerando o corte.
  const resgatada = lerCampoTexto(bruto, 'narracao');
  if (resgatada) {
    const texto = limparNarracao(resgatada);
    if (texto.length >= 40 && !pareceJson(texto)) {
      if (detectarRepeticaoDeCenaAnterior(texto, cenasPassadas)) {
        return { erro: 'o modelo repetiu diálogos ou cenas anteriores em vez de avançar a narrativa' };
      }
      return {
        texto,
        opcoes: validarOpcoesIA(lerObjetosDoArray(bruto, 'opcoes'), proibidos),
        achado: achadoValido(lerCampoTexto(bruto, 'achado') ?? undefined),
      };
    }
  }

  // 3) O modelo mandou prosa pura, sem JSON nenhum: serve como narração.
  const solto = limparNarracao(bruto);
  if (solto && !pareceJson(solto)) {
    if (detectarRepeticaoDeCenaAnterior(solto, cenasPassadas)) {
      return { erro: 'o modelo repetiu diálogos ou cenas anteriores em vez de avançar a narrativa' };
    }
    return { texto: solto };
  }

  // 4) Sobrou lixo. Melhor a narração local do que despejar JSON na tela.
  return { erro: 'o modelo devolveu uma resposta malformada (JSON cortado)' };
}

export function resolverApiKey(cfg: LlmConfig): string {
  const c = cfg.apiKey?.trim();
  if (c) return c;
  if (cfg.provider === 'nous') {
    const tokenBridge = obterTokenNousAtual();
    if (tokenBridge) return tokenBridge;
    const envKey = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_NOUS_API_KEY) || '';
    if (envKey.trim()) return envKey.trim();
  }
  return '';
}

/**
 * O texto a mostrar enquanto a resposta ainda está chegando.
 *
 * Esta função NÃO valida nada. A validação é de `interpretarResposta`, no fim,
 * e é lá que o texto cru é impedido de chegar à tela. Aqui o objetivo é só
 * dar ao jogador algo para ler enquanto espera — então ela é deliberadamente
 * tolerante com JSON meio quebrado, que é o estado normal de uma resposta pela
 * metade.
 *
 * A versão anterior usava `"((?:\\.|[^"\\])*)`, que para na primeira aspa não
 * escapada. Modelos pequenos erram escape o tempo todo — escrevem
 * `"narracao": "Ela diz "sim" e sai."` — e o resultado na tela era a narração
 * **congelar nas primeiras palavras** e nunca mais andar, porque a cada pedaço
 * novo a função devolvia o mesmo fragmento curto. Foi o bug relatado em jogo:
 * "só escreve a primeira palavra".
 *
 * Agora ela pega tudo depois da abertura do campo e corta só onde o campo
 * termina de verdade — o começo do campo seguinte do JSON.
 */
export function parcialNarracao(acumulado: string): string {
  // A chave pode vir sem acento (o padrão) ou com, quando o modelo "traduz".
  const abertura = acumulado.match(/"narra[cç][aã]o"\s*:\s*"/);
  if (!abertura || abertura.index === undefined) {
    // Sem JSON nenhum: o modelo está escrevendo prosa direta. Mostrar isso é
    // melhor do que deixar a tela muda — e se no fim não for narração válida,
    // `interpretarResposta` recusa e o fallback assume.
    const cru = acumulado.trim();
    return cru.startsWith('{') || cru.startsWith('```') ? '' : desescapar(cru);
  }
  const corpo = acumulado.slice(abertura.index + abertura[0].length);
  // Fim do campo. Duas tentativas, da mais específica para a mais tolerante:
  // primeiro o fecho seguido do próximo campo do JSON, que é o formato certo;
  // depois só o fecho, que cobre a resposta terminando ali (inclusive com
  // cerca de markdown pendurada no fim). Enquanto nenhum dos dois aparece, o
  // campo é tudo que chegou até agora — que é o caso durante o stream.
  const forte = corpo.search(/"\s*[,}]\s*"/);
  const fim = forte >= 0 ? forte : corpo.search(/"\s*[,}]/);
  return desescapar(fim >= 0 ? corpo.slice(0, fim) : corpo);
}

/** Desfaz os escapes de JSON sem exigir que o texto seja JSON válido. */
function desescapar(s: string): string {
  try {
    return JSON.parse(`"${s.replace(/\\(?!["\\/bfnrtu])/g, '\\\\').replace(/\n/g, '\\n')}"`);
  } catch {
    return s
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

async function lerStreamSse(
  resp: Response,
  onChunk: (textoParcial: string) => void,
): Promise<ResultadoNarracao> {
  if (!resp.ok) {
    const bruto = await resp.text();
    return { erro: explicarErroOpenRouter(resp.status, bruto) };
  }

  const contentType = resp.headers?.get('content-type') ?? '';
  if (contentType.includes('application/json') || !resp.body?.getReader) {
    const bruto = await resp.text();
    try {
      const data = JSON.parse(bruto) as {
        choices?: { message?: { content?: string }; delta?: { content?: string } }[];
        error?: { message?: string };
      };
      if (data.error?.message) {
        return { erro: explicarErroOpenRouter(resp.status, data.error.message) };
      }
      const texto = data.choices?.[0]?.message?.content?.trim() ?? data.choices?.[0]?.delta?.content?.trim() ?? '';
      if (texto) {
        onChunk(texto);
        return { texto };
      }
    } catch {
      return { erro: `HTTP ${resp.status}: ${bruto.slice(0, 160)}` };
    }
  }

  if (!resp.body) return { erro: 'corpo de resposta ausente' };
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let brutoTotal = '';
  let acumulado = '';
  const consumir = (linha: string) => {
    const data = linha.startsWith('data:') ? linha.slice(5).trim() : '';
    if (!data || data === '[DONE]') return;
    try {
      const obj = JSON.parse(data) as {
        choices?: {
          delta?: { content?: string; reasoning?: string; reasoning_content?: string };
          message?: { content?: string };
          text?: string;
        }[];
        error?: { message?: string };
      };
      if (obj.error?.message) { acumulado = `__ERRO__${obj.error.message}`; return; }
      const delta =
        obj.choices?.[0]?.delta?.content ??
        obj.choices?.[0]?.message?.content ??
        (obj.choices?.[0] as Record<string, unknown>)?.text ??
        '';
      if (typeof delta === 'string' && delta) {
        acumulado += delta;
        const parcial = parcialNarracao(acumulado);
        if (parcial) onChunk(parcial);
      }
    } catch { /* SSE pode dividir o JSON; a próxima linha completa será lida. */ }
  };
  while (true) {
    const parte = await reader.read();
    if (parte.done) break;
    const chunkTexto = decoder.decode(parte.value, { stream: true });
    buffer += chunkTexto;
    brutoTotal += chunkTexto;
    const linhas = buffer.split(/\r?\n/);
    buffer = linhas.pop() ?? '';
    for (const linha of linhas) consumir(linha);
  }
  if (buffer) consumir(buffer);
  if (acumulado.startsWith('__ERRO__')) return { erro: explicarErroOpenRouter(resp.status, acumulado.slice(9)) };

  // Se o stream não devolveu tokens via SSE data:, tenta resgatar se o corpo foi um JSON inteiro
  if (!acumulado && brutoTotal.trim()) {
    try {
      const data = JSON.parse(brutoTotal.trim()) as {
        choices?: { message?: { content?: string }; delta?: { content?: string } }[];
        error?: { message?: string };
      };
      if (data.error?.message) return { erro: explicarErroOpenRouter(resp.status, data.error.message) };
      const texto = data.choices?.[0]?.message?.content?.trim() ?? data.choices?.[0]?.delta?.content?.trim() ?? '';
      if (texto) {
        onChunk(texto);
        return { texto };
      }
    } catch {
      // Ignora erro de JSON parse
    }
  }

  return acumulado ? { texto: acumulado } : { erro: 'o modelo respondeu vazio' };
}

async function chamarStreamCompat(
  cfg: LlmConfig,
  userMsg: string,
  onChunk: (textoParcial: string) => void,
): Promise<ResultadoNarracao> {
  const nous = cfg.provider === 'nous';
  let chave = resolverApiKey(cfg);
  const url = nous
    ? 'https://inference-api.nousresearch.com/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${chave}`,
  };
  if (!nous) {
    headers['HTTP-Referer'] = 'https://github.com/Rogualdi/Ro';
    headers['X-Title'] = 'ARCANUM';
  }
  const corpo = () => JSON.stringify({
    model: cfg.modelo || (nous ? MODELO_PADRAO_NOUS : MODELO_PADRAO_OPENROUTER),
    max_tokens: MAX_TOKENS,
    temperature: 0.7,
    stream: true,
    messages: [{ role: 'system', content: INSTRUCAO_SISTEMA }, { role: 'user', content: userMsg }],
  });
  let resp = await fetch(url, { method: 'POST', headers, body: corpo() });
  if (nous && resp.status === 401) {
    const nova = await renovarTokenNous(true);
    if (nova && nova !== chave) {
      chave = nova;
      headers.authorization = `Bearer ${chave}`;
      resp = await fetch(url, { method: 'POST', headers, body: corpo() });
    }
  }
  return lerStreamSse(resp, onChunk);
}

async function chamarNous(
  cfg: LlmConfig,
  userMsg: string,
  sistema: string = INSTRUCAO_SISTEMA,
  teto: number = MAX_TOKENS,
): Promise<ResultadoNarracao> {
  let chave = resolverApiKey(cfg);
  const ehBunny = (cfg.modelo || MODELO_PADRAO_NOUS).includes('space-bunny');
  const tetoReal = ehBunny ? Math.max(teto, 3500) : teto;
  const timeoutMs = ehBunny ? 90000 : 75000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    let resp = await fetch('https://inference-api.nousresearch.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${chave}`,
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: cfg.modelo || MODELO_PADRAO_NOUS,
        max_tokens: tetoReal,
        temperature: 0.7,
        messages: [
          { role: 'system', content: sistema },
          { role: 'user', content: userMsg },
        ],
      }),
    });

    // Se o token expirou (HTTP 401), renova silenciosamente em segundo plano e repete a chamada imediatamente.
    if (resp.status === 401) {
      const novaChave = await renovarTokenNous(true);
      if (novaChave && novaChave !== chave) {
        chave = novaChave;
        resp = await fetch('https://inference-api.nousresearch.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${chave}`,
          },
          signal: ctrl.signal,
          body: JSON.stringify({
            model: cfg.modelo || MODELO_PADRAO_NOUS,
            max_tokens: tetoReal,
            temperature: 0.7,
            messages: [
              { role: 'system', content: sistema },
              { role: 'user', content: userMsg },
            ],
          }),
        });
      }
    }

    const bruto = await resp.text();
    if (!resp.ok) return { erro: explicarErroOpenRouter(resp.status, bruto) };
    let data: {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
      error?: { message?: string };
    };
    try {
      data = JSON.parse(bruto);
    } catch {
      return { erro: 'resposta inválida da Nous Research' };
    }
    if (data.error?.message) return { erro: data.error.message };
    const texto = data.choices?.[0]?.message?.content?.trim() ?? '';
    return texto.length > 0 ? { texto } : { erro: 'o modelo respondeu vazio' };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { erro: 'tempo limite esgotado (75s) na Nous Research' };
    }
    return { erro: `rede: ${String(err).slice(0, 120)}` };
  } finally {
    clearTimeout(timer);
  }
}

async function chamarOpenRouter(
  cfg: LlmConfig,
  userMsg: string,
  sistema: string = INSTRUCAO_SISTEMA,
  teto: number = MAX_TOKENS,
): Promise<ResultadoNarracao> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
        'HTTP-Referer': 'https://github.com/Rogualdi/Ro',
        'X-Title': 'ARCANUM',
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: cfg.modelo || MODELO_PADRAO_OPENROUTER,
        max_tokens: teto,
        temperature: 0.7,
        messages: [
          { role: 'system', content: sistema },
          { role: 'user', content: userMsg },
        ],
      }),
    });
    const bruto = await resp.text();
    if (!resp.ok) return { erro: explicarErroOpenRouter(resp.status, bruto) };
    let data: {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
      error?: { message?: string };
    };
    try {
      data = JSON.parse(bruto);
    } catch {
      return { erro: 'resposta inválida da OpenRouter' };
    }
    // Erro embutido num 200 (a OpenRouter faz isso com limite/roteamento).
    if (data.error?.message) return { erro: explicarErroOpenRouter(200, data.error.message) };
    const texto = data.choices?.[0]?.message?.content?.trim() ?? '';
    return texto.length > 0 ? { texto } : { erro: 'o modelo respondeu vazio' };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { erro: 'tempo limite esgotado (25s) na OpenRouter' };
    }
    return { erro: `rede: ${String(err).slice(0, 120)}` };
  } finally {
    clearTimeout(timer);
  }
}

async function chamarAnthropic(
  cfg: LlmConfig,
  userMsg: string,
  sistema: string = INSTRUCAO_SISTEMA,
  teto: number = MAX_TOKENS,
): Promise<ResultadoNarracao> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: cfg.modelo || MODELO_PADRAO_ANTHROPIC,
      max_tokens: teto,
      system: sistema,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });
  const bruto = await resp.text();
  if (!resp.ok) return { erro: `HTTP ${resp.status}: ${bruto.slice(0, 160)}` };
  let data: { content?: { type: string; text?: string }[] };
  try {
    data = JSON.parse(bruto);
  } catch {
    return { erro: 'resposta inválida da Anthropic' };
  }
  const texto = (data.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim();
  return texto.length > 0 ? { texto } : { erro: 'o modelo respondeu vazio' };
}

// Testa a chave com uma chamada mínima.
export async function testarChave(cfg: LlmConfig): Promise<{ ok: boolean; erro?: string }> {
  try {
    if (cfg.provider === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': cfg.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: cfg.modelo || MODELO_PADRAO_ANTHROPIC,
          max_tokens: 8,
          messages: [{ role: 'user', content: 'ok' }],
        }),
      });
      return resp.ok ? { ok: true } : { ok: false, erro: `HTTP ${resp.status}: ${(await resp.text()).slice(0, 140)}` };
    }
    if (cfg.provider === 'nous') {
      let chave = resolverApiKey(cfg);
      let resp = await fetch('https://inference-api.nousresearch.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${chave}`,
        },
        body: JSON.stringify({
          model: cfg.modelo || MODELO_PADRAO_NOUS,
          max_tokens: 8,
          messages: [{ role: 'user', content: 'ok' }],
        }),
      });
      if (resp.status === 401) {
        const novaChave = await renovarTokenNous(true);
        if (novaChave && novaChave !== chave) {
          chave = novaChave;
          resp = await fetch('https://inference-api.nousresearch.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${chave}`,
            },
            body: JSON.stringify({
              model: cfg.modelo || MODELO_PADRAO_NOUS,
              max_tokens: 8,
              messages: [{ role: 'user', content: 'ok' }],
            }),
          });
        }
      }
      return resp.ok
        ? { ok: true }
        : { ok: false, erro: explicarErroOpenRouter(resp.status, await resp.text()) };
    }
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
        'HTTP-Referer': 'https://github.com/Rogualdi/Ro',
        'X-Title': 'ARCANUM',
      },
      body: JSON.stringify({
        model: cfg.modelo || MODELO_PADRAO_OPENROUTER,
        max_tokens: 8,
        messages: [{ role: 'user', content: 'ok' }],
      }),
    });
    return resp.ok
      ? { ok: true }
      : { ok: false, erro: explicarErroOpenRouter(resp.status, await resp.text()) };
  } catch (e) {
    return { ok: false, erro: String(e) };
  }
}

// Pergunta direta ao modelo: você narra sexo ou não? Em vez de o jogador
// descobrir no meio da história, ele descobre aqui, em uma chamada barata.
export async function testarCenaAdulta(
  cfg: LlmConfig,
): Promise<{ narra: boolean; recusou: boolean; amostra?: string; erro?: string }> {
  const sistema =
    'Você é narrador de um romance adulto em português do Brasil, para leitores maiores ' +
    'de idade. Cenas sensuais e intimidade física entre adultos consentindo são esperadas. ' +
    'Responda apenas com a prosa, sem comentário nem aviso moralizante.';
  const pedido =
    'Escreva um parágrafo de romance adulto e intimidade física intensa: duas pessoas adultas, ' +
    'sozinhas num quarto de estalagem, entregando-se ao desejo, ao calor da pele e à paixão.';
  try {
    const r =
      cfg.provider === 'anthropic'
        ? await chamarAnthropic({ ...cfg }, pedido, sistema, 320)
        : cfg.provider === 'nous'
          ? await chamarNous({ ...cfg }, pedido, sistema, 320)
          : await chamarOpenRouter({ ...cfg }, pedido, sistema, 320);
    if (r.erro) return { narra: false, recusou: false, erro: r.erro };
    const texto = (r.texto ?? '').trim();
    if (!texto) return { narra: false, recusou: false, erro: 'o modelo respondeu vazio' };
    const recusou = detectarRecusa(texto);
    return { narra: !recusou, recusou, amostra: texto.slice(0, 260) };
  } catch (e) {
    return { narra: false, recusou: false, erro: `rede: ${String(e).slice(0, 120)}` };
  }
}

// Tenta o modelo configurado; se ele estiver fora do ar OU devolver resposta
// malformada, cai para outro gratuito da lista viva — assim um slug morto ou um
// modelo que não sabe fechar JSON não deixa o jogo sem narração.
export async function narrarComFallback(
  cfg: LlmConfig,
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  r: ResultadoTurno,
): Promise<ResultadoNarracao & { modeloUsado?: string }> {
  const primeira = await narrarComModelo(cfg, content, camp, ctx, r);
  if (primeira.texto || (cfg.provider !== 'openrouter' && cfg.provider !== 'nous')) return primeira;

  // Se a chave for comprovadamente inválida (401), nenhum modelo vai responder
  const chaveInvalida = /chave inválida|sem permissão|401/i.test(primeira.erro ?? '');
  if (chaveInvalida) return primeira;

  // A lista já vem ordenada com os permissivos/prioritários na frente
  const vivos = await listarModelos(cfg.provider, cfg.apiKey, true);
  const candidatos = vivos
    .filter((m) => m.id !== cfg.modelo && m.perfil !== 'estrito' && !m.moderado)
    .map((m) => m.id)
    .slice(0, 3);
  for (const modelo of candidatos) {
    const tentativa = await narrarComModelo({ ...cfg, modelo }, content, camp, ctx, r);
    if (tentativa.texto) return { ...tentativa, modeloUsado: modelo };
  }
  return primeira;
}
