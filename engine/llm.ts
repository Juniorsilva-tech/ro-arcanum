// ARCANUM · Camada de IA opcional (GDD Parte V).
// A engine é dona da verdade; o modelo é dono da VOZ. Aqui ele só reescreve
// a narração do fato consumado — as opções continuam canônicas da engine,
// o que respeita a filosofia do validador (§19) num app offline-first.
//
// A chave NUNCA vai embutida no APK: o usuário cola a própria chave nas
// Configurações (GDD §33, §36). Sem chave, o jogo usa o fallback canônico.
import type { Campaign, ContentBundle } from './types';
import type { ResultadoTurno } from './turn';
import type { Contexto } from './availability';
import { dataPorExtenso, NOME_PERIODO } from './time';

export type LlmConfig = {
  apiKey: string;
  modelo: string; // ex.: claude-haiku-4-5-20251001
};

export const MODELO_PADRAO = 'claude-haiku-4-5-20251001';

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
      voz: n.vozNarrativa,
      eixos: camp.npcState[n.id]?.eixos ?? {},
    })),
    fatoConsumado: fato,
  };
}

const INSTRUCAO_SISTEMA =
  'Você é o narrador de ARCANUM, um RPG de texto sombrio em português do Brasil. ' +
  'A ENGINE decide o que aconteceu; você só escreve a VOZ. ' +
  'Regras invioláveis: ' +
  '1) Narre APENAS o fato consumado que a engine informou — nunca invente um resultado diferente. ' +
  '2) Só cite pessoas e lugares presentes no pacote de contexto. ' +
  '3) Registro seco e concreto: 2 a 3 parágrafos curtos, 6 a 9 frases, com algum diálogo. ' +
  '4) Nunca use notação de dado (d20, 1d6, CD 15) nem números de regra. ' +
  '5) Todos os personagens são adultos; cenas de intimidade CORTAM. ' +
  'Escreva só a narração, sem títulos nem comentários.';

// Chama a API da Anthropic diretamente com a chave do usuário. Retorna null em falha
// para que o chamador caia no fallback canônico (GDD §20).
export async function narrarComModelo(
  cfg: LlmConfig,
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  r: ResultadoTurno,
): Promise<string | null> {
  try {
    const pacote = montarPacote(content, camp, ctx, r.fato);
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: cfg.modelo || MODELO_PADRAO,
        max_tokens: 500,
        system: INSTRUCAO_SISTEMA,
        messages: [
          {
            role: 'user',
            content:
              'Pacote de contexto (JSON):\n' +
              JSON.stringify(pacote, null, 2) +
              '\n\nNarre a cena a partir do fatoConsumado.',
          },
        ],
      }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      content?: { type: string; text?: string }[];
    };
    const texto = (data.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('')
      .trim();
    return texto.length > 0 ? texto : null;
  } catch {
    return null;
  }
}

// Testa a chave com uma chamada mínima.
export async function testarChave(cfg: LlmConfig): Promise<{ ok: boolean; erro?: string }> {
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: cfg.modelo || MODELO_PADRAO,
        max_tokens: 8,
        messages: [{ role: 'user', content: 'ok' }],
      }),
    });
    if (resp.ok) return { ok: true };
    const t = await resp.text();
    return { ok: false, erro: `HTTP ${resp.status}: ${t.slice(0, 120)}` };
  } catch (e) {
    return { ok: false, erro: String(e) };
  }
}
