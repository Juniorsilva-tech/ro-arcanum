// ARCANUM · Personagem: derivados e criação (GDD §3).
import type { AttrKey, Atributos, Personagem, Classe, Origem, Cenario } from './types';

export function modificador(attr: number): number {
  return Math.floor((attr - 10) / 2);
}

export type Derivados = {
  defesa: number;
  iniciativa: number;
  acerto: number;
  poder: number;
  dificuldadeImposta: number;
  cargaMax: number;
  deslocamento: number;
  percepcaoPassiva: number;
};

export function derivados(p: Personagem, bonusDefesa = 0): Derivados {
  const a = p.atributos;
  return {
    defesa: 10 + modificador(a.precisao) + modificador(a.resiliencia) + bonusDefesa,
    iniciativa: modificador(a.precisao) + modificador(a.percepcao),
    acerto: p.nivel + modificador(a.precisao),
    poder: p.nivel + modificador(a.raciocinio),
    dificuldadeImposta: 10 + p.nivel + modificador(a.social),
    cargaMax: a.fisico * 7,
    deslocamento: 6 + modificador(a.precisao),
    percepcaoPassiva: 10 + modificador(a.percepcao),
  };
}

export const ATRIBUTO_BASE = 10;

// Distribuição inicial (point-buy simples resolvido no criador de UI).
export function atributosBase(): Atributos {
  return {
    fisico: ATRIBUTO_BASE,
    precisao: ATRIBUTO_BASE,
    resiliencia: ATRIBUTO_BASE,
    raciocinio: ATRIBUTO_BASE,
    percepcao: ATRIBUTO_BASE,
    social: ATRIBUTO_BASE,
  };
}

function somaAttr(base: Atributos, bonus: Partial<Atributos>): Atributos {
  const out = { ...base };
  (Object.keys(bonus) as AttrKey[]).forEach((k) => {
    out[k] = (out[k] ?? 0) + (bonus[k] ?? 0);
  });
  return out;
}

export function criarPersonagem(
  nome: string,
  atributos: Atributos,
  classe: Classe,
  origem: Origem,
  cenario: Cenario,
): Personagem {
  const attrFinal = somaAttr(somaAttr(atributos, classe.bonusAtributos), origem.bonusAtributos);

  const recursos: Record<string, number> = { vida: 0 };
  const recursosMax: Record<string, number> = { vida: 0 };
  const vidaMax = 20 + modificador(attrFinal.resiliencia) * 4;
  recursos.vida = vidaMax;
  recursosMax.vida = vidaMax;

  cenario.recursos.forEach((r) => {
    const max = recursoMaximo(r.id, attrFinal);
    recursos[r.id] = max;
    recursosMax[r.id] = max;
  });

  const pressoes: Record<string, number> = {};
  cenario.pressoes.forEach((pr) => {
    pressoes[pr.id] = 0;
  });

  return {
    nome,
    classeId: classe.id,
    origemId: origem.id,
    nivel: 1,
    xp: 0,
    atributos: attrFinal,
    recursos,
    recursosMax,
    pressoes,
    dinheiro: origem.dinheiroInicial,
    pericias: { ...classe.periciasIniciais },
    inventario: { ...(classe.itensIniciais ?? {}) },
    equipado: { ...(classe.equipInicial ?? {}) },
    artesConhecidas: [...(classe.artesIniciais ?? [])],
    alcunhas: [],
    cicatrizes: [],
    condicoes: [],
    idade: 20,
  };
}

function recursoMaximo(id: string, a: Atributos): number {
  switch (id) {
    case 'mana':
      return 8 + modificador(a.raciocinio) * 3;
    case 'vigor':
      return 10 + modificador(a.fisico) * 2 + modificador(a.resiliencia) * 2;
    default:
      return 10;
  }
}

export function clampRecursos(p: Personagem): void {
  for (const k of Object.keys(p.recursos)) {
    const max = p.recursosMax[k] ?? p.recursos[k];
    p.recursos[k] = Math.max(0, Math.min(max, p.recursos[k]));
  }
  for (const k of Object.keys(p.pressoes)) {
    p.pressoes[k] = Math.max(0, Math.min(100, p.pressoes[k]));
  }
}
