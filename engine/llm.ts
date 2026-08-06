// ARCANUM · Camada de IA opcional (GDD Parte V).
// A engine é dona da verdade; o modelo é dono da VOZ. Aqui ele só reescreve
// a narração do fato consumado — as opções continuam canônicas da engine.
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
export function montarPacote(
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  fato: string,
) {
  const p = camp.personagem;
  return {
    personagem: {
      nome: p.nome,
      classe: p.classeId,
      origem: p.origemId,
      nivel: p.nivel,
      recursos: p.recursos,
      pressoes: p.pressoes,
      alcunhas: p.alcunhas,
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
      voz: n.vozNarrativa,
      eixos: camp.npcState[n.id]?.eixos ?? {},
    })),
    fatoConsumado: fato,
  };
}

// Narrador adulto. A única regra inviolável é: TODOS os personagens são adultos.
// O modelo devolve JSON: narração + as opções de cena do próximo turno (§18.2).
const INSTRUCAO_SISTEMA =
  'Você é o narrador de ARCANUM, um RPG de texto adulto e sombrio, em português do Brasil. ' +
  'A ENGINE decide o que aconteceu; você escreve a VOZ e propõe os próximos caminhos.\n' +
  'Regras:\n' +
  '1) Narre APENAS o fato consumado que a engine informou — nunca invente outro resultado.\n' +
  '2) Cite apenas pessoas e lugares presentes no pacote de contexto.\n' +
  '3) Registro concreto e adulto: 2 a 3 parágrafos, com diálogo quando fizer sentido.\n' +
  '4) Nunca use notação de dado (d20, 1d6, CD 15) nem números de regra no texto.\n' +
  '5) Conteúdo adulto — sexo, violência, temas pesados — é permitido e pode ser explícito ' +
  'quando a cena pedir, entre personagens adultos e de forma consensual.\n' +
  'REGRA ABSOLUTA E INEGOCIÁVEL: todos os personagens são adultos (18+). Jamais sexualize ' +
  'menores de idade em nenhuma hipótese. Cada presente traz sua idade no pacote — respeite-a.\n' +
  '\nRESPONDA SOMENTE COM JSON VÁLIDO, sem cercas de código, neste formato:\n' +
  '{"narracao":"…","opcoes":[{"rotulo":"…","dica":"…","custoPeriodos":0,' +
  '"teste":{"atributo":"social","pericia":"persuadir","dificuldade":13}}]}\n' +
  'Sobre as opções: de 3 a 5, SEMPRE NOVAS e específicas para o que acabou de acontecer e ' +
  'para quem está presente. "rotulo" até 90 caracteres, imperativo e concreto. "dica" é a ' +
  'consequência provável em até 12 palavras. "custoPeriodos" de 0 a 3. "teste" é opcional; ' +
  'se houver, "atributo" ∈ [fisico, precisao, resiliencia, raciocinio, percepcao, social] e ' +
  '"dificuldade" entre 6 e 26. Não repita opções anteriores.';

export type OpcaoIA = {
  rotulo: string;
  dica?: string;
  custoPeriodos: number;
  teste?: { atributo: string; pericia?: string; dificuldade: number };
};

export type ResultadoNarracao = { texto?: string; opcoes?: OpcaoIA[]; erro?: string };

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
  if (status === 401) return 'chave inválida ou sem permissão (401). Confira a chave.';
  if (status === 402) return 'créditos insuficientes (402). Use um modelo :free.';
  if (status === 429) return 'limite de uso atingido (429). Espere um pouco ou troque de modelo.';
  return `HTTP ${status}: ${corpo.slice(0, 160)}`;
}

const ATRIBUTOS_VALIDOS = ['fisico', 'precisao', 'resiliencia', 'raciocinio', 'percepcao', 'social'];
const RE_DADO = /\bd\d+\b|\b\d+d\d+\b|\bCD\s?\d+/i;

// Extrai o JSON mesmo se o modelo embrulhar em ``` ou texto solto.
function extrairJson(bruto: string): any | null {
  const semCerca = bruto.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(semCerca);
  } catch {
    /* tenta recortar do primeiro { ao último } */
  }
  const i = semCerca.indexOf('{');
  const f = semCerca.lastIndexOf('}');
  if (i >= 0 && f > i) {
    try {
      return JSON.parse(semCerca.slice(i, f + 1));
    } catch {
      return null;
    }
  }
  return null;
}

// Validador das opções propostas pelo modelo (§19: faixas, dificuldade, dado).
export function validarOpcoesIA(bruto: unknown): OpcaoIA[] {
  if (!Array.isArray(bruto)) return [];
  const out: OpcaoIA[] = [];
  for (const o of bruto) {
    if (!o || typeof o !== 'object') continue;
    const rotulo = String((o as any).rotulo ?? '').trim();
    if (!rotulo || rotulo.length > 90 || RE_DADO.test(rotulo)) continue;
    const dicaBruta = String((o as any).dica ?? '').trim();
    const dica = RE_DADO.test(dicaBruta) ? undefined : dicaBruta || undefined;
    let custo = Number((o as any).custoPeriodos ?? 0);
    if (!Number.isFinite(custo)) custo = 0;
    custo = Math.max(0, Math.min(3, Math.round(custo)));

    let teste: OpcaoIA['teste'];
    const t = (o as any).teste;
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
    JSON.stringify(pacote, null, 2) +
    '\n\nNarre a cena a partir do fatoConsumado e proponha as novas opções. Responda só o JSON.';
  try {
    const bruto =
      cfg.provider === 'anthropic'
        ? await chamarAnthropic(cfg, userMsg)
        : await chamarOpenRouter(cfg, userMsg);
    if (bruto.erro) return bruto;
    return interpretarResposta(bruto.texto ?? '');
  } catch (e) {
    return { erro: `rede: ${String(e).slice(0, 120)}` };
  }
}

// Converte a resposta crua em narração + opções válidas. Se o modelo mandar
// texto puro (sem JSON), aproveita como narração — o jogo nunca trava (§20).
function interpretarResposta(bruto: string): ResultadoNarracao {
  const json = extrairJson(bruto);
  if (json && typeof json === 'object') {
    const narracao = String(json.narracao ?? '').trim();
    const opcoes = validarOpcoesIA(json.opcoes);
    if (narracao) return { texto: narracao, opcoes };
  }
  const texto = bruto.trim();
  return texto ? { texto } : { erro: 'o modelo respondeu vazio' };
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
      max_tokens: 1000,
      temperature: 0.9,
      messages: [
        { role: 'system', content: INSTRUCAO_SISTEMA },
        { role: 'user', content: userMsg },
      ],
    }),
  });
  const bruto = await resp.text();
  if (!resp.ok) return { erro: explicarErroOpenRouter(resp.status, bruto) };
  let data: { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
  try {
    data = JSON.parse(bruto);
  } catch {
    return { erro: 'resposta inválida da OpenRouter' };
  }
  if (data.error?.message) return { erro: data.error.message.slice(0, 160) };
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
      max_tokens: 1000,
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

// Tenta o modelo configurado; se ele estiver fora do ar, cai para outro
// gratuito da lista viva — assim um slug morto não deixa o jogo sem IA.
export async function narrarComFallback(
  cfg: LlmConfig,
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  r: ResultadoTurno,
): Promise<ResultadoNarracao & { modeloUsado?: string }> {
  const primeira = await narrarComModelo(cfg, content, camp, ctx, r);
  if (primeira.texto || cfg.provider !== 'openrouter') return primeira;

  const indisponivel = /modelo indisponível|no endpoints|HTTP 404/i.test(primeira.erro ?? '');
  if (!indisponivel) return primeira;

  const vivos = await listarModelosOpenRouter(cfg.apiKey, true);
  const candidatos = vivos.map((m) => m.id).filter((id) => id !== cfg.modelo).slice(0, 3);
  for (const modelo of candidatos) {
    const tentativa = await narrarComModelo({ ...cfg, modelo }, content, camp, ctx, r);
    if (tentativa.texto) return { ...tentativa, modeloUsado: modelo };
  }
  return primeira;
}
