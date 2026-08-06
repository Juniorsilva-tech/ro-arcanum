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

// Sugestão de modelo gratuito e permissivo no OpenRouter. Editável nas Configurações.
export const MODELO_PADRAO_OPENROUTER = 'cognitivecomputations/dolphin3.0-mistral-24b:free';
export const MODELO_PADRAO_ANTHROPIC = 'claude-haiku-4-5-20251001';

// Modelos sugeridos (troque à vontade em openrouter.ai/models — filtre por :free).
export const SUGESTOES_OPENROUTER = [
  'cognitivecomputations/dolphin3.0-mistral-24b:free', // uncensored, bom p/ roleplay
  'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
  'nousresearch/hermes-3-llama-3.1-405b', // permissivo (pago barato)
  'deepseek/deepseek-chat-v3-0324:free', // qualidade alta, pouco filtro em ficção
  'sao10k/l3-euryale-70b', // roleplay adulto (pago)
];

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

type ChamadaArgs = {
  cfg: LlmConfig;
  content: ContentBundle;
  camp: Campaign;
  ctx: Contexto;
  r: ResultadoTurno;
};

// Chama o provider configurado. Retorna null em falha → o chamador cai no fallback (§20).
export async function narrarComModelo(
  cfg: LlmConfig,
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  r: ResultadoTurno,
): Promise<string | null> {
  const pacote = montarPacote(content, camp, ctx, r.fato);
  const userMsg =
    'Pacote de contexto (JSON):\n' +
    JSON.stringify(pacote, null, 2) +
    '\n\nNarre a cena a partir do fatoConsumado.';
  try {
    if (cfg.provider === 'anthropic') {
      return await chamarAnthropic(cfg, userMsg);
    }
    return await chamarOpenRouter(cfg, userMsg);
  } catch {
    return null;
  }
}

async function chamarOpenRouter(cfg: LlmConfig, userMsg: string): Promise<string | null> {
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
  if (!resp.ok) return null;
  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const texto = data.choices?.[0]?.message?.content?.trim() ?? '';
  return texto.length > 0 ? texto : null;
}

async function chamarAnthropic(cfg: LlmConfig, userMsg: string): Promise<string | null> {
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
  if (!resp.ok) return null;
  const data = (await resp.json()) as { content?: { type: string; text?: string }[] };
  const texto = (data.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim();
  return texto.length > 0 ? texto : null;
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
