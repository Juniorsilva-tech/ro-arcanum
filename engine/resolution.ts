// ARCANUM · Resolução SEM DADOS (GDD §2). Curva logística + cinco graus.
import { nextFloat, type RngState } from './rng';

// p = 1 / (1 + e^(−(C − D) / k))
export function probabilidade(C: number, D: number, k = 4): number {
  return 1 / (1 + Math.exp(-(C - D) / k));
}

export type Grau =
  | 'critico'
  | 'sucesso'
  | 'sucesso_com_custo'
  | 'falha'
  | 'falha_grave';

export const NOME_GRAU: Record<Grau, string> = {
  critico: 'crítico',
  sucesso: 'sucesso',
  sucesso_com_custo: 'sucesso com custo',
  falha: 'falha',
  falha_grave: 'falha grave',
};

export type ResultadoTeste = {
  C: number;
  D: number;
  p: number;
  r: number;
  grau: Grau;
  sucesso: boolean;
};

// Cinco graus a partir de um sorteio r contra p (GDD §2.2).
export function grauDeResultado(p: number, r: number): Grau {
  if (r < p * 0.25) return 'critico';
  if (r < p) return 'sucesso';
  if (r < p + (1 - p) * 0.35) return 'sucesso_com_custo';
  if (r < p + (1 - p) * 0.85) return 'falha';
  return 'falha_grave';
}

export type EntradaTeste = {
  atributo: number; // valor do atributo efetivo
  pericia?: number; // graus de perícia
  equipamento?: number;
  circunstancia?: number;
  penalidadeEstado?: number;
  vantagem?: number; // +1 vantagem, -1 desvantagem (cada = ±3)
  dificuldade: number; // D
  k?: number;
};

// C = atributo + 2×perícia + equipamento + circunstância − penalidade_de_estado (GDD §2.1)
export function competencia(e: EntradaTeste): number {
  const vant = (e.vantagem ?? 0) * 3;
  return (
    e.atributo +
    2 * (e.pericia ?? 0) +
    (e.equipamento ?? 0) +
    (e.circunstancia ?? 0) -
    (e.penalidadeEstado ?? 0) +
    vant
  );
}

export function resolverTeste(rng: RngState, e: EntradaTeste): ResultadoTeste {
  const C = competencia(e);
  const D = e.dificuldade;
  const p = probabilidade(C, D, e.k ?? 4);
  const r = nextFloat(rng);
  const grau = grauDeResultado(p, r);
  return {
    C,
    D,
    p,
    r,
    grau,
    sucesso: grau === 'critico' || grau === 'sucesso' || grau === 'sucesso_com_custo',
  };
}

// Dano sem notação de dado (GDD §2.3).
export type PerfilDano = { base: number; dispersao: number; tipo: string };

export function calcularDano(
  rng: RngState,
  perfil: PerfilDano,
  critico = false,
): { valor: number; tipo: string } {
  const r2 = nextFloat(rng);
  let base = perfil.base;
  if (critico) base *= 1.75;
  const valor = base * (1 + (r2 - 0.5) * 2 * perfil.dispersao);
  return { valor: Math.max(1, Math.round(valor)), tipo: perfil.tipo };
}

// Faixas de dificuldade nomeadas (GDD §2.1).
export const DIFICULDADE = {
  trivial: 6,
  facil: 10,
  media: 14,
  dificil: 18,
  severa: 22,
  quase_impossivel: 26,
} as const;
