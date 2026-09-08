// ARCANUM · Camada de IA opcional (GDD Parte V).
// A engine é dona da verdade; o modelo é dono da VOZ. Ele reescreve o fato
// consumado como prosa e propõe os próximos caminhos — mas quem valida é aqui.
//
// A chave NUNCA vai embutida no APK: o usuário cola a própria chave nas
// Configurações. Sem chave, o jogo usa o fallback canônico (§20).
//
// Provider padrão: OpenRouter (compatível com a API da OpenAI), que dá acesso
// a modelos gratuitos e sem filtro. Anthropic segue disponível como opção.
import type { Campaign, ContentBundle } from './types';
import type { ResultadoTurno } from './turn';
import { disponibilidadeVerbo, type Contexto } from './availability';
import { dataPorExtenso, NOME_PERIODO } from './time';
import { memoriaParaNarrador, diasDeConvivio, marcosRecentes } from './memoria';
import { calcularRitmo } from './ritmo';
import { comoEstaOVale } from './mundo';
import { ecosRecentes } from './convivio';
import { ehNatureza, inferirNatureza, type Natureza } from './risco';
import { artesConhecidasResolvidas } from './fusao';
import { contextoDeAptidao, leituraDoObservador } from './aptidao';
import { legadosConquistados } from './identidade';
import { DOMINIOS } from './aptidaoTypes';
import { contextoNarrativo, CONTRATO_NARRATIVO } from './contextoNarrativo';

export type LlmProvider = 'openrouter' | 'anthropic';

export type LlmConfig = {
  provider: LlmProvider;
  apiKey: string;
  modelo: string;
};

// Padrões. Slugs variam com o tempo — use o botão "Buscar modelos" nas
// Configurações para pegar a lista atual e grátis direto da OpenRouter.
export const MODELO_PADRAO_OPENROUTER = 'thedrummer/rocinante-12b';
export const MODELO_PADRAO_ANTHROPIC = 'claude-haiku-4-5-20251001';

// Sugestões iniciais (validadas com mais frequência). O botão "Buscar modelos"
// substitui esta lista pela lista viva da sua conta.
export const SUGESTOES_OPENROUTER = [
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
export const MODELOS_PARA_CENA_ADULTA: { id: string; nota: string; pago: boolean }[] = [
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
  'dolphin', 'hermes', 'euryale', 'lumimaid', 'noromaid', 'mythomax', 'mythalion',
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
    return modelos.sort((a, b) => {
      // Moderação do provedor pesa tanto quanto a linhagem do modelo.
      const pa = ORDEM_PERFIL[a.perfil] + (a.moderado ? 1 : 0);
      const pb = ORDEM_PERFIL[b.perfil] + (b.moderado ? 1 : 0);
      return pa !== pb ? pa - pb : a.id.localeCompare(b.id);
    });
  } catch {
    return [];
  }
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
  const nomeItem = (id: string) => content.itens.find((i) => i.id === id)?.nome ?? id;

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
      inventario,
    },
    capitulo: { numero: camp.capitulo.numero, titulo: camp.capitulo.titulo },
    local: {
      nome: ctx.local.nome,
      atmosfera: narrativa.atmosfera,
      ganchos: ctx.local.ganchos,
      privacidade: ctx.privacidade,
      perigo: ctx.local.perigo,
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
    mundoPersistente: {
      fatos: narrativa.fatos,
      confirmados: narrativa.confirmados,
      rumores: narrativa.rumores,
      compromissos: camp.vivo?.missoes.filter(q => q.conhecida && q.estado === 'aceita').map(q => ({ titulo: q.titulo, local: q.local, prazo: q.prazo, etapa: q.etapa })),
      cidade: camp.vivo?.cidades[ctx.local.id] && { edificios: camp.vivo.cidades[ctx.local.id].edificios, obra: camp.vivo.cidades[ctx.local.id].projeto, fome: camp.vivo.cidades[ctx.local.id].fomeDias > 0, epidemia: camp.vivo.cidades[ctx.local.id].doenca > 30 },
      regra: 'Rumor é informação não verificada pelo protagonista. Fatos ocultos não foram fornecidos. Não invente conclusão de obra, missão, morte ou parentesco: use somente o estado confirmado.',
    },
    ocorrenciasConfirmadas: camp.continuidade?.eventos.filter(e => e.local === ctx.local.id).slice(-3),
    ameacasConhecidas: camp.continuidade?.ameacas.filter(a => a.descoberta && a.estado === 'ativa').slice(-3)
      .map(a => ({ local: content.locais.find(l => l.id === a.local)?.nome, diasAteAtaque: a.prazo - camp.calendario.dia })),
    rivaisEncontrados: Object.values(camp.kimetsu?.rivais ?? {}).filter(r => r.reencontros > 0 && r.local === ctx.local.id).slice(-3)
      .map(r => ({ nome: r.nome, vivo: r.vivo, encontros: r.reencontros, ultimoConfronto: r.memoria.at(-1) })),
    // O que rolou entre elas sem o jogador por perto — é o que a boca do povo
    // repete, e o que dá ao vale história própria.
    boatosDoVale: ecosRecentes(camp, 2, ctx.local.id),
    presentes: ctx.presentes.map((n) => ({
      nome: n.nome,
      idade: camp.npcState[n.id]?.idade ?? n.idade,
      ocupacao: n.ocupacao,
      voz: n.vozNarrativa,
      indole: n.personalidade,
      corpo: n.corpo,
      parentesco: n.parentesco,
      situacaoCivil: camp.vivo?.pessoas[n.id] && { atividade: camp.vivo.pessoas[n.id].objetivo, prestigio: camp.vivo.pessoas[n.id].prestigio },
      eixos: camp.npcState[n.id]?.eixos ?? {},
      // Sem isto, cada encontro era o primeiro. É o que faz ela lembrar.
      conheceHaDias: diasDeConvivio(camp, n.id),
      lembraDeVoce: memoriaParaNarrador(camp, n.id, 4),
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
    })),
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
    // O diretor da campanha, calculado pela engine (ver ritmo.ts).
    ritmo: calcularRitmo(content, camp),
    // Vocabulário permitido: se citar objeto, tem que ser um destes nomes.
    catalogoDeItens: achaveis,
    // O ESPAÇO DE AÇÃO. Sem isto o modelo adivinha o que é possível e, na
    // dúvida, propõe o mais seguro — que é justamente o mais genérico.
    podeFazerAgora: content.verbos
      .filter((v) => disponibilidadeVerbo(v, ctx, camp, ctx.presentes[0]).disponivel)
      .slice(0, 14)
      .map((v) => v.nome),
    // O que está trancado e por quê: dá caminhos que ainda não existem
    // ("arranjar uma gazua", "esperar a praça esvaziar").
    trancadoAgora: content.verbos
      .map((v) => ({ v, d: disponibilidadeVerbo(v, ctx, camp, ctx.presentes[0]) }))
      .filter((x) => !x.d.disponivel && !!x.d.motivo)
      .slice(0, 5)
      .map((x) => `${x.v.nome}: ${x.d.motivo}`),
    // Substantivos concretos deste lugar. Opção boa aponta para uma coisa.
    coisasAqui: ctx.local.pontos ?? [],
    // O passado do lugar, escrito no conteúdo (ver content/vaelhorn/continente.ts).
    // O narrador pode citá-lo; o que não estiver aqui, ele não sabe.
    historiaDesteLugar: ctx.local.historia ?? [],
    artesQueVoceSabe: artesConhecidasResolvidas(content, camp).map((a) => a.nome),
    ondeDaParaIr: ctx.local.rotas
      .map((r) => content.locais.find((l) => l.id === r.destino)?.nome)
      .filter(Boolean),
    // Rótulos que já foram oferecidos — proibido repetir (nem reescritos).
    rotulosProibidos: (camp.opcoesUsadas ?? []).slice(-24),
    fatoConsumado: fato,
    // Qual foi a ação, não só como terminou. Sem isto o modelo recebia
    // "Você tentou elogiar Aldrica — deu certo" e não tinha como saber que o
    // elogio precisava ser DITO em voz alta na cena.
    acaoDoJogador: acao,
  };
}

// Narrador de conto medieval, adulto. A única regra inviolável: todo personagem
// é adulto. O modelo devolve JSON: narração + opções do próximo turno (§18.2).
const INSTRUCAO_SISTEMA =
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
  '• NOME DO JOGADOR — "personagem.nome" está no pacote pra você narrar em segunda ' +
  'pessoa, não pra qualquer NPC saber de cor. Uma NPC só o chama pelo nome se ' +
  '"jaAconteceu" ou "arcosAtivos" já mostrarem uma apresentação de verdade (ele se ' +
  'apresentou, alguém o apresentou, ela ouviu de outra pessoa). Sem isso registrado, ela ' +
  'não sabe — trate-o por "você" na fala dela, ou por um termo genérico no masculino ' +
  '(acima), e é ótimo se ela perguntar o nome dele como parte da cena.\n' +
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
  '• Cada fala em LINHA PRÓPRIA começando com travessão, e o nome de quem falou na mesma ' +
  'linha ou na anterior:\n' +
  '    — Você tem mão boa para pão velho, Aldrica.\n' +
  '\n' +
  '    Ela não levanta os olhos do pano.\n' +
  '\n' +
  '    — Freguês novo é sempre bom de língua. Isso passa.\n' +
  '• O resultado da ação aparece NA FALA e no gesto, não num aviso. Se deu certo, ela ' +
  'cede alguma coisa: uma informação, um sorriso, uma cadeira. Se falhou, ela corta.\n' +
  '\nVERDADE — a engine manda:\n' +
  '0) "mundo.premissa" é a lei deste lugar. Toda cena tem que caber nela: quem manda, ' +
  'quem trabalha, quem olha o jogador de que jeito. Nunca contrarie a premissa.\n' +
  '1) Narre APENAS o fato consumado informado. Nunca invente outro resultado.\n' +
  '2) Cite apenas pessoas e lugares que estão no pacote de contexto. Cada presente vem ' +
  'com "voz", "indole" e "corpo" — use os três: é assim que ela vira gente e não ficha. ' +
  'Descreva corpo com franqueza adulta quando a cena chegar perto, sem eufemismo covarde ' +
  'e sem virar catálogo.\n' +
  '2a) "parentesco" é uma barreira absoluta: pai, mãe, irmão e irmã jamais entram em romance ou sexo com o protagonista.\n' +
  '3) Se citar um objeto que o jogador ganha, use EXATAMENTE um nome de ' +
  '"catalogoDeItens" e repita o id dele no campo "achado". Sem id, sem objeto.\n' +
  '4) Nunca use notação de dado (d20, 1d6, CD 15) nem número de regra no texto.\n' +
  '5) Conteúdo adulto — sexo, violência, temas pesados — é permitido e pode ser ' +
  'explícito quando a cena pedir, entre adultos e de forma consensual. Se o jogador ' +
  'PEDE uma cena explícita, escreva a cena explícita, com o corpo e os atos nomeados. ' +
  'Não corte para o amanhecer, não troque por sugestão poética, não descreva a mobília ' +
  'no lugar. Fugir do pedido é pior do que recusar.\n' +
  'REGRA ABSOLUTA E INEGOCIÁVEL: todos os personagens são adultos (18+). Jamais ' +
  'sexualize menores em nenhuma hipótese. Cada presente traz a idade — respeite-a.\n' +
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
  const pacote = montarPacote(content, camp, ctx, r.fato, {
    verbo: r.verbo?.nome,
    categoria: r.verbo?.categoria,
    alvo: r.alvo?.nome,
    grau: r.grau,
    livre: r.acaoLivre,
  });
  // A ação do jogador vai PRIMEIRO, em texto puro, e é repetida no fim. Ela
  // estava enterrada como um campo no meio do JSON, e modelo pequeno se afogava
  // no contexto e narrava ambiente em vez de reagir ao que foi feito.
  const ordem = r.acaoLivre
    ? `O JOGADOR ESCREVEU, COM AS PALAVRAS DELE: "${r.acaoLivre}"\n` +
      `Isto é a intenção, não uma alteração do estado. Resultado canônico: ${r.fato}. ` +
      'A cena responde à intenção respeitando esse resultado, inclusive quando falha.'
    : `O JOGADOR FEZ ISTO: ${r.fato}\n` +
      'A cena é sobre ISTO. Mostre a ação acontecendo e a reação de quem estava lá.';

  const userMsg =
    `${ordem}\n\n` +
    'Contexto do mundo (JSON, material de apoio — não é o assunto da cena):\n' +
    JSON.stringify(pacote) +
    `\n\nAgora escreva a cena que responde a: ${r.acaoLivre ?? r.fato}\n` +
    'Comece pela ação e pela reação. Só o JSON de resposta.';
  try {
    const bruto =
      cfg.provider === 'anthropic'
        ? await chamarAnthropic(cfg, userMsg)
        : await chamarOpenRouter(cfg, userMsg);
    if (bruto.erro) return bruto;
    return interpretarResposta(bruto.texto ?? '', content, camp);
  } catch (e) {
    return { erro: `rede: ${String(e).slice(0, 120)}` };
  }
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
      return {
        texto,
        opcoes: validarOpcoesIA(lerObjetosDoArray(bruto, 'opcoes'), proibidos),
        achado: achadoValido(lerCampoTexto(bruto, 'achado') ?? undefined),
      };
    }
  }

  // 3) O modelo mandou prosa pura, sem JSON nenhum: serve como narração.
  const solto = limparNarracao(bruto);
  if (solto && !pareceJson(solto)) return { texto: solto };

  // 4) Sobrou lixo. Melhor a narração local do que despejar JSON na tela.
  return { erro: 'o modelo devolveu uma resposta malformada (JSON cortado)' };
}

async function chamarOpenRouter(
  cfg: LlmConfig,
  userMsg: string,
  sistema: string = INSTRUCAO_SISTEMA,
  teto: number = MAX_TOKENS,
): Promise<ResultadoNarracao> {
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
      max_tokens: teto,
      temperature: 0.9,
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
    'de idade. Sexo explícito entre adultos consentindo é permitido e esperado. ' +
    'Responda apenas com a prosa, sem comentário nem aviso.';
  const pedido =
    'Escreva um único parágrafo explícito: duas pessoas adultas, sozinhas num quarto de ' +
    'estalagem, transando. Nomeie as partes do corpo sem eufemismo.';
  try {
    const r =
      cfg.provider === 'anthropic'
        ? await chamarAnthropic({ ...cfg }, pedido, sistema, 320)
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
  if (primeira.texto || cfg.provider !== 'openrouter') return primeira;

  const trocavel = /modelo indisponível|no endpoints|HTTP 404|malformada|recusou|fora de contexto/i.test(primeira.erro ?? '');
  if (!trocavel) return primeira;

  // A lista já vem ordenada com os permissivos na frente — é justamente o que
  // se quer quando o modelo atual recusou a cena.
  const vivos = await listarModelosOpenRouter(cfg.apiKey, true);
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
