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
const INSTRUCAO_SISTEMA =
  'Você é o narrador de ARCANUM, um RPG de texto adulto e sombrio, em português do Brasil. ' +
  'A ENGINE decide o que aconteceu; você escreve a VOZ. Regras:\n' +
  '1) Narre APENAS o fato consumado que a engine informou — nunca invente um resultado diferente.\n' +
  '2) Cite apenas pessoas e lugares presentes no pacote de contexto.\n' +
  '3) Registro concreto e adulto: 2 a 3 parágrafos, com diálogo quando fizer sentido.\n' +
  '4) Nunca use notação de dado (d20, 1d6, CD 15) nem números de regra.\n' +
  '5) Conteúdo adulto — incluindo sexo, violência e temas pesados — é permitido e pode ser ' +
  'explícito quando a cena pedir, entre personagens adultos e de forma consensual.\n' +
  'REGRA ABSOLUTA E INEGOCIÁVEL: todos os personagens são adultos (18+). Jamais sexualize ' +
  'menores de idade em nenhuma hipótese. No pacote, cada presente traz sua idade — respeite-a.\n' +
  'Escreva só a narração, sem títulos nem comentários fora da ficção.';

export type ResultadoNarracao = { texto?: string; erro?: string };

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
    '\n\nNarre a cena a partir do fatoConsumado.';
  try {
    if (cfg.provider === 'anthropic') return await chamarAnthropic(cfg, userMsg);
    return await chamarOpenRouter(cfg, userMsg);
  } catch (e) {
    return { erro: `rede: ${String(e).slice(0, 120)}` };
  }
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
      max_tokens: 600,
      temperature: 0.9,
      messages: [
        { role: 'system', content: INSTRUCAO_SISTEMA },
        { role: 'user', content: userMsg },
      ],
    }),
  });
  const bruto = await resp.text();
  if (!resp.ok) return { erro: `HTTP ${resp.status}: ${bruto.slice(0, 160)}` };
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
      max_tokens: 600,
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
    return resp.ok ? { ok: true } : { ok: false, erro: `HTTP ${resp.status}: ${(await resp.text()).slice(0, 140)}` };
  } catch (e) {
    return { ok: false, erro: String(e) };
  }
}
