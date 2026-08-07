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
import type { Contexto } from './availability';
import { dataPorExtenso, NOME_PERIODO } from './time';

export type LlmProvider = 'openrouter' | 'anthropic';

export type LlmConfig = {
  provider: LlmProvider;
  apiKey: string;
  modelo: string;
};

// Padrões. Slugs variam com o tempo — use o botão "Buscar modelos" nas
// Configurações para pegar a lista atual e grátis direto da OpenRouter.
export const MODELO_PADRAO_OPENROUTER = 'deepseek/deepseek-chat-v3-0324:free';
export const MODELO_PADRAO_ANTHROPIC = 'claude-haiku-4-5-20251001';

// Sugestões iniciais (validadas com mais frequência). O botão "Buscar modelos"
// substitui esta lista pela lista viva da sua conta.
export const SUGESTOES_OPENROUTER = [
  'deepseek/deepseek-chat-v3-0324:free', // qualidade alta, pouco filtro em ficção
  'deepseek/deepseek-r1:free',
  'nousresearch/hermes-3-llama-3.1-405b', // permissivo
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-nemo:free',
];

// Teto de saída. O bug do "JSON cru na tela" era truncamento: o modelo estourava
// o limite no meio do array de opções e a resposta virava lixo impossível de ler.
const MAX_TOKENS = 2400;

// Busca a lista de modelos da OpenRouter (opcionalmente só os gratuitos).
// Assim o app nunca depende de um slug chumbado que pode ter saído do ar.
export async function listarModelosOpenRouter(
  apiKey?: string,
  apenasGratis = true,
): Promise<{ id: string; free: boolean }[]> {
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/models', {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
    });
    if (!resp.ok) return [];
    const data = (await resp.json()) as {
      data?: { id: string; pricing?: { prompt?: string; completion?: string } }[];
    };
    const modelos = (data.data ?? []).map((m) => {
      const free = m.pricing?.prompt === '0' && m.pricing?.completion === '0';
      return { id: m.id, free };
    });
    const filtrados = apenasGratis ? modelos.filter((m) => m.free) : modelos;
    return filtrados.sort((a, b) => a.id.localeCompare(b.id));
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
) {
  const p = camp.personagem;
  const nomeItem = (id: string) => content.itens.find((i) => i.id === id)?.nome ?? id;

  // O que ele carrega, com o nome exato do catálogo.
  const inventario = Object.entries(p.inventario)
    .filter(([, q]) => q > 0)
    .slice(0, 20)
    .map(([id, q]) => (q > 1 ? `${nomeItem(id)} (${q})` : nomeItem(id)));

  // O que pode ser achado aqui: só itens que a base realmente tem. O modelo
  // escolhe pelo id, e a engine é quem entrega — nada de tesouro inventado.
  const achaveis = content.itens
    .filter((i) => i.raridade === 'comum' || i.raridade === 'notavel')
    .filter((i) => i.slot === 'material' || i.slot === 'consumivel' || i.slot === 'misc')
    .slice(0, 24)
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
      moedas: p.dinheiro,
      equipado,
      inventario,
    },
    capitulo: { numero: camp.capitulo.numero, titulo: camp.capitulo.titulo },
    local: {
      nome: ctx.local.nome,
      atmosfera: ctx.local.atmosferaPorPeriodo[ctx.periodo] ?? ctx.local.descricaoBase,
      ganchos: ctx.local.ganchos,
      privacidade: ctx.privacidade,
      perigo: ctx.local.perigo,
    },
    quando: {
      data: dataPorExtenso(camp.calendario, content.cenario.ancoraCalendario),
      periodo: NOME_PERIODO[ctx.periodo],
      estacao: camp.calendario.estacao,
    },
    presentes: ctx.presentes.map((n) => ({
      nome: n.nome,
      idade: n.idade,
      ocupacao: n.ocupacao,
      voz: n.vozNarrativa,
      indole: n.personalidade,
      corpo: n.corpo,
      eixos: camp.npcState[n.id]?.eixos ?? {},
    })),
    // Vocabulário permitido: se citar objeto, tem que ser um destes nomes.
    catalogoDeItens: achaveis,
    // Rótulos que já foram oferecidos — proibido repetir (nem reescritos).
    rotulosProibidos: (camp.opcoesUsadas ?? []).slice(-24),
    fatoConsumado: fato,
  };
}

// Narrador de conto medieval, adulto. A única regra inviolável: todo personagem
// é adulto. O modelo devolve JSON: narração + opções do próximo turno (§18.2).
const INSTRUCAO_SISTEMA =
  'Você é o narrador de ARCANUM, um romance de fantasia sombria em português do Brasil. ' +
  'A ENGINE decide o que aconteceu; você escreve a VOZ e propõe os próximos caminhos.\n' +
  '\nVOZ — escreva como um conto medieval, não como um relatório:\n' +
  '• Registro de fábula sombria: frases de fôlego, imagens concretas, o mundo antigo e ' +
  'cansado. Diga "a lâmina", "o pão preto", "a lama do pátio" — nunca abstrações vagas.\n' +
  '• De 2 a 4 parágrafos curtos, SEPARADOS POR LINHA EM BRANCO. Nunca um bloco só.\n' +
  '• Toda fala em linha própria, começando com travessão: — Assim, freguesa.\n' +
  '  Diga quem falou na mesma linha ou na anterior. O leitor nunca deve se perder.\n' +
  '• Fale com o jogador em segunda pessoa ("você"). Os outros, pelo nome.\n' +
  '• Nada de rótulos como "Narrador:", "Opções:", "Cena:". A interface já cuida disso.\n' +
  '\nVERDADE — a engine manda:\n' +
  '0) "mundo.premissa" é a lei deste lugar. Toda cena tem que caber nela: quem manda, ' +
  'quem trabalha, quem olha o jogador de que jeito. Nunca contrarie a premissa.\n' +
  '1) Narre APENAS o fato consumado informado. Nunca invente outro resultado.\n' +
  '2) Cite apenas pessoas e lugares que estão no pacote de contexto. Cada presente vem ' +
  'com "voz", "indole" e "corpo" — use os três: é assim que ela vira gente e não ficha. ' +
  'Descreva corpo com franqueza adulta quando a cena chegar perto, sem eufemismo covarde ' +
  'e sem virar catálogo.\n' +
  '3) Se citar um objeto que o jogador ganha, use EXATAMENTE um nome de ' +
  '"catalogoDeItens" e repita o id dele no campo "achado". Sem id, sem objeto.\n' +
  '4) Nunca use notação de dado (d20, 1d6, CD 15) nem número de regra no texto.\n' +
  '5) Conteúdo adulto — sexo, violência, temas pesados — é permitido e pode ser ' +
  'explícito quando a cena pedir, entre adultos e de forma consensual.\n' +
  'REGRA ABSOLUTA E INEGOCIÁVEL: todos os personagens são adultos (18+). Jamais ' +
  'sexualize menores em nenhuma hipótese. Cada presente traz a idade — respeite-a.\n' +
  '\nOPÇÕES — cada uma é uma decisão, não um verbo solto:\n' +
  '• De 3 a 5, SEMPRE INÉDITAS, nascidas do que acabou de acontecer e de quem está ali.\n' +
  '• Proibido repetir ou reescrever qualquer rótulo de "rotulosProibidos".\n' +
  '• Ruim: "Conversar com Elza". Bom: "Perguntar a Elza quem pagou pelo silêncio dela".\n' +
  '• O rótulo diz a AÇÃO e o ALVO; a "dica" diz o que se arrisca ou se ganha.\n' +
  '• Pelo menos uma opção deve poder dar errado de um jeito que custe caro.\n' +
  '\nFORMATO — responda SOMENTE com JSON válido, sem cercas de código, ' +
  'sem comentário antes ou depois, em UMA linha, neste formato:\n' +
  '{"narracao":"…","opcoes":[{"rotulo":"…","dica":"…","custoPeriodos":0,' +
  '"teste":{"atributo":"social","pericia":"persuadir","dificuldade":13}}],"achado":null}\n' +
  '"rotulo" até 90 caracteres. "dica" até 12 palavras. "custoPeriodos" de 0 a 3. ' +
  '"teste" é opcional; se houver, "atributo" ∈ [fisico, precisao, resiliencia, ' +
  'raciocinio, percepcao, social] e "dificuldade" entre 6 e 26. "achado" é o id de um ' +
  'item do catálogo, ou null. Escreva a narração inteira antes das opções e seja breve ' +
  'nas opções: a resposta não pode ser cortada no meio.';

export type OpcaoIA = {
  rotulo: string;
  dica?: string;
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
    out.push({ rotulo, dica, custoPeriodos: custo, teste });
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
  const pacote = montarPacote(content, camp, ctx, r.fato);
  const userMsg =
    'Pacote de contexto (JSON):\n' +
    JSON.stringify(pacote) +
    '\n\nNarre a cena a partir do fatoConsumado e proponha caminhos novos. Só o JSON.';
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

  // 1) Caminho feliz: JSON inteiro.
  const json = extrairJson(bruto);
  if (json && typeof json === 'object') {
    const narracao = limparNarracao(String(json.narracao ?? ''));
    if (narracao && !pareceJson(narracao)) {
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

async function chamarOpenRouter(cfg: LlmConfig, userMsg: string): Promise<ResultadoNarracao> {
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
      max_tokens: MAX_TOKENS,
      temperature: 0.9,
      messages: [
        { role: 'system', content: INSTRUCAO_SISTEMA },
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

async function chamarAnthropic(cfg: LlmConfig, userMsg: string): Promise<ResultadoNarracao> {
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
      max_tokens: MAX_TOKENS,
      system: INSTRUCAO_SISTEMA,
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

  const trocavel = /modelo indisponível|no endpoints|HTTP 404|malformada/i.test(primeira.erro ?? '');
  if (!trocavel) return primeira;

  const vivos = await listarModelosOpenRouter(cfg.apiKey, true);
  const candidatos = vivos.map((m) => m.id).filter((id) => id !== cfg.modelo).slice(0, 3);
  for (const modelo of candidatos) {
    const tentativa = await narrarComModelo({ ...cfg, modelo }, content, camp, ctx, r);
    if (tentativa.texto) return { ...tentativa, modeloUsado: modelo };
  }
  return primeira;
}
