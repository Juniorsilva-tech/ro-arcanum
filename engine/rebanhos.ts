// ARCANUM · Os animais da colônia (sessão 58, etapa C).
//
// Até aqui `rebanhos` era só um número por espécie que a chegada de gente
// somava (etapa B) e nada lia. Agora cada espécie tem função real:
//
// - galinha põe ovo, cabra e vaca dão leite: comida todo dia;
// - ovelha dá lã, que vira ouro;
// - porco não dá nada vivo — é carne guardada, que se abate quando falta;
// - mula puxa carga: mais material por dia;
// - cavalo monta patrulha: a segurança sobe (até um teto).
//
// Todo animal come. O pasto do sítio sustenta um tanto; o resto sai do
// celeiro como feno. No inverno o pasto quase some. Sem feno, animal morre.
// Na primavera nascem crias; o rebanho apertado adoece, e quem cuida dele
// (o ofício `rebanho`, engine/colonos.ts) muda tanto o que rende quanto o
// quanto adoece.
//
// O sorteio usa RNG derivado do dia (como o resto da colônia): não consome
// o RNG da campanha.
import type { Campaign, ContentBundle, FeudoState } from './types';
import type { AnimalColonia, SitioColonia } from '../content/vaelhorn/sitios';
import { createRng, nextFloat, seedFromString } from './rng';
import { eficiencia } from './colonos';

export type { AnimalColonia } from '../content/vaelhorn/sitios';

export type FichaAnimal = {
  nome: string;
  plural: string;
  /** Para o artigo: "uma galinha", "um porco". */
  feminino: boolean;
  /** Ouro para comprar um. */
  preco: number;
  /** Quanto come por dia (unidades de pasto/feno). */
  come: number;
  /** Comida por dia (ovo, leite). */
  comidaDia: number;
  /** Ouro por dia (lã). */
  ouroDia: number;
  /** Carne ao abater. 0 = não se abate. */
  carne: number;
  /** Crias por animal ao longo de uma primavera inteira. */
  crias: number;
  /** Material por dia (tração). */
  materialDia: number;
  /** Segurança que cada um soma (patrulha montada). */
  seguranca: number;
  /** O que ele dá, em palavras, para a tela. */
  funcao: string;
};

export const ANIMAIS: Record<AnimalColonia, FichaAnimal> = {
  galinha: { nome: 'galinha', feminino: true, plural: 'galinhas', preco: 2, come: 0.05, comidaDia: 0.15, ouroDia: 0, carne: 1, crias: 1.5, materialDia: 0, seguranca: 0, funcao: 'ovos todo dia' },
  porco: { nome: 'porco', feminino: false, plural: 'porcos', preco: 8, come: 0.4, comidaDia: 0, ouroDia: 0, carne: 14, crias: 1.2, materialDia: 0, seguranca: 0, funcao: 'carne guardada: abata quando faltar comida' },
  cabra: { nome: 'cabra', feminino: true, plural: 'cabras', preco: 10, come: 0.3, comidaDia: 0.3, ouroDia: 0, carne: 6, crias: 0.8, materialDia: 0, seguranca: 0, funcao: 'leite todo dia, comendo pouco' },
  ovelha: { nome: 'ovelha', feminino: true, plural: 'ovelhas', preco: 12, come: 0.3, comidaDia: 0.05, ouroDia: 0.3, carne: 7, crias: 0.6, materialDia: 0, seguranca: 0, funcao: 'lã, que vira ouro' },
  vaca: { nome: 'vaca', feminino: true, plural: 'vacas', preco: 30, come: 1.0, comidaDia: 0.8, ouroDia: 0, carne: 25, crias: 0.3, materialDia: 0, seguranca: 0, funcao: 'leite em quantidade' },
  cavalo: { nome: 'cavalo', feminino: false, plural: 'cavalos', preco: 45, come: 1.0, comidaDia: 0, ouroDia: 0, carne: 0, crias: 0.15, materialDia: 0, seguranca: 1.5, funcao: 'patrulha montada: mais segurança' },
  mula: { nome: 'mula', feminino: true, plural: 'mulas', preco: 25, come: 0.8, comidaDia: 0, ouroDia: 0, carne: 0, crias: 0, materialDia: 0.5, seguranca: 0, funcao: 'puxa carga: mais material por dia' },
};

export const ESPECIES = Object.keys(ANIMAIS) as AnimalColonia[];
/** Unidades de comida de animal que cada ponto de pasto do terreno sustenta. */
export const PASTO_POR_PONTO = 6;
/** Fração do pasto que sobra no inverno. */
export const PASTO_NO_INVERNO = 0.2;
/** Teto de segurança que a patrulha montada pode somar. */
export const TETO_SEGURANCA_CAVALO = 15;
const DIAS_DE_PRIMAVERA = 90;

export function rebanhoDe(f: FeudoState): Record<string, number> {
  return (f.rebanhos ??= {});
}

export function totalDeAnimais(f: FeudoState): number {
  return Object.values(f.rebanhos ?? {}).reduce((a, b) => a + b, 0);
}

/** Quanto o rebanho come por dia, em unidades de pasto. */
export function fomeDoRebanho(f: FeudoState): number {
  return ESPECIES.reduce((s, e) => s + (f.rebanhos?.[e] ?? 0) * ANIMAIS[e].come, 0);
}

/** Pasto do sítio hoje. */
export function pastoDoDia(s: SitioColonia, inverno: boolean): number {
  return s.terreno.pasto * PASTO_POR_PONTO * (inverno ? PASTO_NO_INVERNO : 1);
}

export type RelatorioRebanho = {
  comida: number;
  ouro: number;
  material: number;
  feno: number;
  nasceram: string[];
  morreram: string[];
};

function rngDe(camp: Campaign, chave: string) {
  return createRng((camp.rng.seed ^ seedFromString(`rebanho:${chave}:${camp.calendario.dia}`)) >>> 0);
}

/**
 * O dia do rebanho. Chamado por `processarDiaColonia` depois do consumo das
 * pessoas: o celeiro alimenta gente primeiro, bicho depois.
 */
export function processarRebanhos(camp: Campaign, s: SitioColonia, inverno: boolean, forragem = 0): RelatorioRebanho {
  const f = camp.feudo!;
  const reb = rebanhoDe(f);
  const r: RelatorioRebanho = { comida: 0, ouro: 0, material: 0, feno: 0, nasceram: [], morreram: [] };
  if (totalDeAnimais(f) === 0) return r;
  const cuidado = eficiencia(f, 'rebanho');

  // Comer: pasto primeiro, feno do celeiro no que faltar.
  const fome = fomeDoRebanho(f);
  // Nabo de forragem (engine/cultivos.ts) cobre parte do que faltaria.
  const faltaFeno = Math.max(0, fome - pastoDoDia(s, inverno)) * (1 - Math.min(1, forragem));
  const feno = Math.min(f.comida, faltaFeno);
  f.comida -= feno;
  r.feno = feno;
  if (faltaFeno > 0 && feno < faltaFeno) {
    // Sem feno para todos: morre um bicho, o que mais come primeiro.
    const faminta = [...ESPECIES].filter(e => (reb[e] ?? 0) > 0).sort((a, b) => ANIMAIS[b].come - ANIMAIS[a].come)[0];
    reb[faminta] -= 1;
    r.morreram.push(`Sem feno, morreu ${ANIMAIS[faminta].feminino ? 'uma' : 'um'} ${ANIMAIS[faminta].nome}.`);
  }

  // Produzir: bicho bem alimentado rende conforme quem cuida.
  for (const e of ESPECIES) {
    const n = reb[e] ?? 0;
    if (!n) continue;
    r.comida += n * ANIMAIS[e].comidaDia * cuidado;
    r.ouro += n * ANIMAIS[e].ouroDia * cuidado;
    r.material += n * ANIMAIS[e].materialDia;
  }
  f.comida += r.comida;
  f.tesouro += r.ouro;
  f.materiais = Math.min(9999, f.materiais + r.material);

  // Crias na primavera, só onde há casal e pasto para mais.
  if (camp.calendario.estacao === 'primavera' && fomeDoRebanho(f) < pastoDoDia(s, false) * 1.2) {
    const acumulado = (f.criasAcumuladas ??= {});
    for (const e of ESPECIES) {
      const n = reb[e] ?? 0;
      if (n < 2 || !ANIMAIS[e].crias) continue;
      acumulado[e] = (acumulado[e] ?? 0) + (n * ANIMAIS[e].crias * cuidado) / DIAS_DE_PRIMAVERA;
      const nascidos = Math.floor(acumulado[e]);
      if (nascidos > 0) {
        acumulado[e] -= nascidos;
        reb[e] = n + nascidos;
        r.nasceram.push(`${nascidos} ${nascidos === 1 ? ANIMAIS[e].nome : ANIMAIS[e].plural}`);
      }
    }
  }

  // Doença: rebanho apertado adoece; quem sabe cuidar segura.
  const aperto = fomeDoRebanho(f) / Math.max(1, pastoDoDia(s, false));
  const chance = 0.004 * (1 + Math.max(0, aperto - 1) * 3) * (1.6 - cuidado);
  if (nextFloat(rngDe(camp, 'doenca')) < chance) {
    const doentes = [...ESPECIES].filter(e => (reb[e] ?? 0) >= 3);
    if (doentes.length) {
      const e = doentes[Math.floor(nextFloat(rngDe(camp, 'qual')) * doentes.length)];
      const perda = Math.max(1, Math.round((reb[e] ?? 0) * 0.2));
      reb[e] -= perda;
      r.morreram.push(`Peste no rebanho: morreram ${perda} ${perda === 1 ? ANIMAIS[e].nome : ANIMAIS[e].plural}.`);
    }
  }
  for (const e of ESPECIES) if ((reb[e] ?? 0) <= 0) delete reb[e];
  return r;
}

/** Segurança que a patrulha montada soma, com teto. */
export function segurancaDosCavalos(f: FeudoState): number {
  return Math.min(TETO_SEGURANCA_CAVALO, (f.rebanhos?.cavalo ?? 0) * ANIMAIS.cavalo.seguranca);
}

// ── Comprar e abater ──────────────────────────────────────────────────────

function chaveDaEstacao(camp: Campaign): string {
  return `${Math.floor(camp.calendario.dia / 360)}:${camp.calendario.estacao}`;
}

/** Quantos ainda dá para comprar desta espécie nesta estação, no sítio. */
export function aVendaNaEstacao(camp: Campaign, s: SitioColonia, e: AnimalColonia): number {
  const f = camp.feudo!;
  const teto = s.animais[e] ?? 0;
  const compras = f.comprasAnimais?.estacao === chaveDaEstacao(camp) ? f.comprasAnimais.qtd[e] ?? 0 : 0;
  return Math.max(0, teto - compras);
}

export function comprarAnimais(content: ContentBundle, camp: Campaign, e: AnimalColonia, qtd: number): { ok: boolean; mensagem: string } {
  const f = camp.feudo;
  const s = f?.fundado ? content.sitiosColonia?.find(x => x.id === f.sitio) : undefined;
  if (!f || !s) return { ok: false, mensagem: 'Não há colônia com sítio para levar animais.' };
  if (!ANIMAIS[e] || qtd < 1) return { ok: false, mensagem: 'Esse animal não se compra.' };
  const disponivel = aVendaNaEstacao(camp, s, e);
  if (disponivel <= 0) return { ok: false, mensagem: `Não há mais ${ANIMAIS[e].plural} à venda na região nesta estação.` };
  const n = Math.min(qtd, disponivel);
  const custo = n * ANIMAIS[e].preco;
  if (f.tesouro < custo) return { ok: false, mensagem: `${n} ${n === 1 ? ANIMAIS[e].nome : ANIMAIS[e].plural} custam ${custo} de ouro; o tesouro tem ${Math.floor(f.tesouro)}.` };
  f.tesouro -= custo;
  const reb = rebanhoDe(f);
  reb[e] = (reb[e] ?? 0) + n;
  const chave = chaveDaEstacao(camp);
  if (f.comprasAnimais?.estacao !== chave) f.comprasAnimais = { estacao: chave, qtd: {} };
  f.comprasAnimais!.qtd[e] = (f.comprasAnimais!.qtd[e] ?? 0) + n;
  const texto = `Chegaram ${n} ${n === 1 ? ANIMAIS[e].nome : ANIMAIS[e].plural} à colônia, por ${custo} de ouro.`;
  f.historicoEventos.push({ dia: camp.calendario.dia, texto });
  return { ok: true, mensagem: texto };
}

export function abaterAnimais(camp: Campaign, e: AnimalColonia, qtd: number): { ok: boolean; mensagem: string } {
  const f = camp.feudo;
  if (!f?.fundado) return { ok: false, mensagem: 'Não há colônia.' };
  const ficha = ANIMAIS[e];
  const tem = f.rebanhos?.[e] ?? 0;
  if (!ficha?.carne) return { ok: false, mensagem: `Ninguém aqui abate ${ficha?.plural ?? 'isso'}.` };
  if (tem < 1) return { ok: false, mensagem: `Não há ${ficha.plural} para abater.` };
  const n = Math.min(qtd, tem);
  f.rebanhos![e] = tem - n;
  if (!f.rebanhos![e]) delete f.rebanhos![e];
  const carne = n * ficha.carne;
  f.comida += carne;
  const texto = `Abatidos ${n} ${n === 1 ? ficha.nome : ficha.plural}: ${carne} de comida no celeiro.`;
  f.historicoEventos.push({ dia: camp.calendario.dia, texto });
  return { ok: true, mensagem: texto };
}
