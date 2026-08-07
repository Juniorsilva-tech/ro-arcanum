// ARCANUM · O que está em jogo, em palavras.
//
// A engine sempre soube a chance exata de cada tentativa: p = 1/(1+e^-((C-D)/k)).
// O jogador nunca viu nada disso — nem número (certo, GDD §2.4) nem palavra
// (errado). Escolher entre duas opções sem saber qual é a arriscada não é
// escolher, é apostar no escuro.
//
// Aqui a MESMA conta que resolve o turno vira uma frase. Nenhum número na tela,
// e nenhuma mentira: se diz "no fio", é porque a curva diz isso.
import type { AttrKey, Campaign, ContentBundle } from './types';
import { competencia, probabilidade } from './resolution';
import { penalidadePorImpulsos } from './impulsos';

// Penalidade de estado, num lugar só — o risco mostrado tem que ser calculado
// com exatamente os mesmos modificadores da resolução, ou a tela mente.
export function penalidadeEstado(camp: Campaign): number {
  let pen = penalidadePorImpulsos(camp);
  const c = camp.personagem.condicoes;
  if (c.includes('ferido')) pen += 2;
  if (c.includes('exausto')) pen += 2;
  if (c.includes('bebado')) pen += 3;
  return pen;
}

export type Teste = { atributo: AttrKey; pericia?: string; dificuldade: number };

export function chanceDe(content: ContentBundle, camp: Campaign, teste: Teste): number {
  const p = camp.personagem;
  const C = competencia({
    atributo: p.atributos[teste.atributo],
    pericia: teste.pericia ? p.pericias[teste.pericia] ?? 0 : 0,
    penalidadeEstado: penalidadeEstado(camp),
    dificuldade: teste.dificuldade,
  });
  return probabilidade(C, teste.dificuldade, content.cenario.k);
}

// A escada de chance. Cinco degraus, porque cinco é o que se lê de relance.
export function lerChance(p: number): string {
  if (p >= 0.85) return 'quase certo';
  if (p >= 0.65) return 'a favor';
  if (p >= 0.45) return 'no fio';
  if (p >= 0.25) return 'contra você';
  return 'quase impossível';
}

export type Aposta = {
  chance?: string; // ausente quando não há teste: a ação simplesmente acontece
  custo?: string; // o que custa antes de dar certo ou errado
  perigo?: string; // o que acontece se desandar feio
};

// O que a opção pede e o que ela pode cobrar.
export function avaliarOpcao(
  content: ContentBundle,
  camp: Campaign,
  op: { teste?: Teste; custoPeriodos: number },
  ctx?: { testemunhas: number },
): Aposta {
  const out: Aposta = {};

  if (op.teste) {
    const p = chanceDe(content, camp, op.teste);
    out.chance = lerChance(p);
    // A falha grave é a última fatia da banda de fracasso (GDD §2.2).
    const grave = (1 - p) * 0.15;
    if (grave >= 0.12) out.perigo = 'pode desandar feio';
    else if (grave >= 0.06) out.perigo = 'tem como dar errado';
  }

  if (op.custoPeriodos >= 3) out.custo = 'toma o dia';
  else if (op.custoPeriodos === 2) out.custo = 'leva um bom tempo';
  else if (op.custoPeriodos === 1) out.custo = 'gasta um período';

  // Olhos mudam o preço do que é feio.
  if (ctx && ctx.testemunhas >= 3 && out.perigo) out.perigo = 'e tem gente vendo';

  return out;
}

// ── Natureza da opção ──────────────────────────────────────────────────────
// Não é categoria de menu: é o EIXO da escolha. Serve para o conjunto de 3 a 5
// opções nunca ser cinco versões da mesma coisa — que é a raiz da sensação de
// "opção genérica". Cinco jeitos de conversar não são cinco escolhas.
export type Natureza = 'avancar' | 'arriscar' | 'aproximar' | 'observar' | 'ganhar';

export const NOME_NATUREZA: Record<Natureza, string> = {
  avancar: 'seguir em frente',
  arriscar: 'pôr a mão no fogo',
  aproximar: 'chegar perto',
  observar: 'olhar antes',
  ganhar: 'tirar proveito',
};

const NATUREZAS: Natureza[] = ['avancar', 'arriscar', 'aproximar', 'observar', 'ganhar'];

export function ehNatureza(v: unknown): v is Natureza {
  return typeof v === 'string' && (NATUREZAS as string[]).includes(v);
}

// Quando o modelo não declara, a engine deduz pelo teste que ele mesmo propôs.
export function inferirNatureza(op: { teste?: Teste; custoPeriodos: number }): Natureza {
  const a = op.teste?.atributo;
  if (a === 'social') return 'aproximar';
  if (a === 'percepcao' || a === 'raciocinio') return 'observar';
  if (a === 'fisico' || a === 'resiliencia') return 'arriscar';
  if (a === 'precisao') return 'ganhar';
  return 'avancar';
}
