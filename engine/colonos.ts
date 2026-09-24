// ARCANUM · A gente da colônia (sessão 57, etapa B).
//
// A população do assentamento antigo era um número que só crescia por
// refugiados — quatro por vez, sempre que qualquer cidade do continente
// estivesse em crise. Aqui a colônia tem gente com nome: quem chega, sozinha
// ou em pequeno grupo, traz história, aptidões por ofício e temperamento, e
// pode ficar responsável por alguma coisa. O resto da população é gente comum,
// contada.
//
// - Chegada: a chance diária depende do RENOME da colônia, de quanta gente
//   passa pelo sítio, de haver comida e espaço (água e abrigo). Quem chega
//   espera à porta: o jogador aceita ou recusa. Ninguém espera para sempre.
// - Ofícios: lavoura, rebanho, obras, guarda, cura, comércio, oficina, caça e
//   pesca. A eficiência de cada um depende da melhor aptidão entre as
//   responsáveis, do temperamento e do humor. Sem ninguém responsável, o
//   ofício anda a 60%.
// - Humor: comida, ordem, cargo certo, santuário para as devotas, segurança
//   para as medrosas. Humor no chão por dias seguidos: ela vai embora.
// - Renome: cresce devagar com a colônia alimentada e em ordem, cai com fome
//   e desordem. As etapas seguintes (audiências, batalhas) mexem nele mais
//   forte.
//
// Tudo com RNG derivado (semente + dia): nada consome o RNG da campanha.
import type { Campaign, ContentBundle, FeudoState } from './types';
import type { ArquetipoColono, OficioColonia, Temperamento } from '../content/vaelhorn/colonos';
export type { OficioColonia, Temperamento } from '../content/vaelhorn/colonos';
import { createRng, nextFloat, nextInt, pick, seedFromString, type RngState } from './rng';
import { capacidadeReal } from './colonia';

export type Colono = {
  id: string;
  nome: string;
  genero: 'f' | 'm';
  idade: number;
  arquetipo: string;
  historia: string;
  aptidoes: Partial<Record<OficioColonia, number>>;
  temperamento: Temperamento;
  lealdade: number;
  humor: number;
  funcao?: OficioColonia;
  chegouEm: number;
  /** Dias seguidos com humor abaixo de 15. */
  diasInfeliz?: number;
  /** Com quem se uniu na colônia (engine/audiencias.ts). */
  conjuge?: string;
};

export type ChegadaPendente = {
  id: string;
  dia: number;
  /** Até quando espera à porta. */
  ate: number;
  colonos: Colono[];
  comuns: number;
  texto: string;
  traz?: Record<string, number>;
};

export const OFICIOS: OficioColonia[] = ['lavoura', 'rebanho', 'obras', 'guarda', 'cura', 'comercio', 'oficina', 'caca'];
export const NOME_OFICIO: Record<OficioColonia, string> = {
  lavoura: 'lavoura', rebanho: 'rebanho', obras: 'obras', guarda: 'guarda', cura: 'cura',
  comercio: 'comércio', oficina: 'oficina', caca: 'caça e pesca',
};
export const NOME_TEMPERAMENTO: Record<Temperamento, string> = {
  trabalhadora: 'trabalhadora', briguenta: 'briguenta', ambiciosa: 'ambiciosa', leal: 'leal',
  preguicosa: 'preguiçosa', devota: 'devota', esperta: 'esperta', medrosa: 'medrosa',
};
/** Quantas pessoas com nome a colônia guarda; depois disso, quem chega vem como gente comum. */
export const MAX_COLONOS = 40;
export const DIAS_NA_PORTA = 3;

export function estadoGente(f: FeudoState) {
  f.colonos ??= [];
  f.chegadas ??= [];
  f.renome ??= 0;
  return { colonos: f.colonos, chegadas: f.chegadas };
}

function rngDe(camp: Campaign, chave: string): RngState {
  return createRng((camp.rng.seed ^ seedFromString(`colonos:${chave}:${camp.calendario.dia}`)) >>> 0);
}

function arquetipoPara(content: ContentBundle, rng: RngState, regiao: string | undefined): ArquetipoColono {
  const lista = content.arquetiposColono ?? [];
  // Quem é da região do sítio aparece o dobro; os de qualquer lugar, normal.
  const pesos = lista.map(a => (!a.regioes?.length ? 1 : a.regioes.includes(regiao ?? '') ? 2 : 0.4));
  let r = nextFloat(rng) * pesos.reduce((x, y) => x + y, 0);
  for (let i = 0; i < lista.length; i++) { r -= pesos[i]; if (r < 0) return lista[i]; }
  return lista[lista.length - 1];
}

export function gerarColono(content: ContentBundle, camp: Campaign, rng: RngState, a: ArquetipoColono, id: string): Colono {
  const f = camp.feudo!;
  const usados = new Set((f.colonos ?? []).map(c => c.nome.split(' ')[0]));
  const nomes = (a.genero === 'm' ? content.nomesColonos : content.nomesColonas) ?? ['Sem-Nome'];
  const livres = nomes.filter(n => !usados.has(n));
  const primeiro = pick(rng, livres.length ? livres : nomes);
  const aptidoes = { ...a.aptidoes };
  // Um pouco de gente é gente: um ofício qualquer sobe um ponto.
  const extra = pick(rng, OFICIOS);
  aptidoes[extra] = Math.min(5, (aptidoes[extra] ?? 0) + 1);
  return {
    id, nome: `${primeiro} ${a.epiteto}`, genero: a.genero,
    idade: nextInt(rng, a.idade[0], a.idade[1]),
    arquetipo: a.id, historia: pick(rng, a.historias),
    aptidoes, temperamento: pick(rng, a.temperamentos),
    lealdade: nextInt(rng, 45, 70), humor: 60,
    chegouEm: camp.calendario.dia,
  };
}

/** As duas primeiras pessoas com nome, na fundação. As outras quatro são gente comum. */
export function colonosFundadores(content: ContentBundle, camp: Campaign, regiao: string): void {
  const f = camp.feudo!;
  const { colonos } = estadoGente(f);
  if (colonos.length || !content.arquetiposColono?.length) return;
  const rng = rngDe(camp, 'fundacao');
  for (let i = 0; i < 2; i++) colonos.push(gerarColono(content, camp, rng, arquetipoPara(content, rng, regiao), `colono_${f.sitio}_${i + 1}`));
}

// ── Eficiência dos ofícios ────────────────────────────────────────────────

/** 0,6 sem responsável; até ~1,35 com gente boa, feliz e trabalhadora. */
export function eficiencia(f: FeudoState, oficio: OficioColonia): number {
  const resp = (f.colonos ?? []).filter(c => c.funcao === oficio);
  if (!resp.length) return 0.6;
  const melhor = resp.reduce((a, b) => ((b.aptidoes[oficio] ?? 0) > (a.aptidoes[oficio] ?? 0) ? b : a));
  let e = 0.7 + (melhor.aptidoes[oficio] ?? 0) * 0.1 + Math.min(0.15, (resp.length - 1) * 0.05);
  if (melhor.temperamento === 'trabalhadora') e += 0.05;
  if (melhor.temperamento === 'preguicosa') e -= 0.1;
  if (melhor.humor < 30) e -= 0.1;
  return Math.max(0.4, e);
}

export function responsavel(f: FeudoState, oficio: OficioColonia): Colono | undefined {
  const resp = (f.colonos ?? []).filter(c => c.funcao === oficio);
  return resp.sort((a, b) => (b.aptidoes[oficio] ?? 0) - (a.aptidoes[oficio] ?? 0))[0];
}

export function melhorOficio(c: Colono): OficioColonia {
  return OFICIOS.reduce((a, b) => ((c.aptidoes[b] ?? 0) > (c.aptidoes[a] ?? 0) ? b : a));
}

// ── Ações ─────────────────────────────────────────────────────────────────

export function designarFuncao(camp: Campaign, colonoId: string, oficio: OficioColonia | undefined): { ok: boolean; mensagem: string } {
  const c = camp.feudo?.colonos?.find(x => x.id === colonoId);
  if (!c) return { ok: false, mensagem: 'Ninguém com esse nome na colônia.' };
  c.funcao = oficio;
  const apt = oficio ? c.aptidoes[oficio] ?? 0 : 0;
  const juizo = !oficio ? 'fica sem cargo' : apt >= 3 ? 'sabe o que está fazendo' : apt >= 1 ? 'vai aprender no caminho' : 'não entende nada disso, e sabe';
  return { ok: true, mensagem: oficio ? `${c.nome} fica responsável por ${NOME_OFICIO[oficio]}: ${juizo}.` : `${c.nome} ${juizo}.` };
}

export function aceitarChegada(content: ContentBundle, camp: Campaign, id: string): { ok: boolean; mensagem: string } {
  const f = camp.feudo;
  if (!f) return { ok: false, mensagem: 'Não há colônia.' };
  const { colonos, chegadas } = estadoGente(f);
  const ch = chegadas.find(x => x.id === id);
  if (!ch) return { ok: false, mensagem: 'Ninguém esperando à porta.' };
  const total = ch.colonos.length + ch.comuns;
  if (f.populacao + total > capacidadeParaGente(content, f)) return { ok: false, mensagem: `Não há lugar para mais ${total}: falta ${faltaDe(content, f)}.` };
  for (const c of ch.colonos) {
    if (colonos.length < MAX_COLONOS) colonos.push({ ...c, chegouEm: camp.calendario.dia });
  }
  f.populacao += total;
  for (const [animal, n] of Object.entries(ch.traz ?? {})) {
    (f.rebanhos ??= {})[animal] = ((f.rebanhos ?? {})[animal] ?? 0) + n;
  }
  f.chegadas = chegadas.filter(x => x.id !== id);
  f.renome = (f.renome ?? 0) + 1;
  const nomes = ch.colonos.map(c => c.nome).join(' e ');
  const texto = `${nomes}${ch.comuns ? ` e mais ${ch.comuns}` : ''} ${total > 1 ? 'entraram' : 'entrou'} para a colônia.`;
  f.historicoEventos.push({ dia: camp.calendario.dia, texto });
  return { ok: true, mensagem: texto };
}

export function recusarChegada(camp: Campaign, id: string): { ok: boolean; mensagem: string } {
  const f = camp.feudo;
  const ch = f?.chegadas?.find(x => x.id === id);
  if (!f || !ch) return { ok: false, mensagem: 'Ninguém esperando à porta.' };
  f.chegadas = f.chegadas!.filter(x => x.id !== id);
  // Quem é mandado embora conta na estrada.
  f.renome = Math.max(0, (f.renome ?? 0) - 0.5);
  const texto = `${ch.colonos.map(c => c.nome).join(' e ')} ${ch.colonos.length > 1 ? 'foram mandadas' : 'foi mandada'} embora da porta.`;
  f.historicoEventos.push({ dia: camp.calendario.dia, texto });
  return { ok: true, mensagem: texto };
}

// ── O dia ─────────────────────────────────────────────────────────────────

/** Espaço de verdade para gente: o menor entre abrigo e água (engine/colonia.ts). */
function capacidadeParaGente(content: ContentBundle, f: FeudoState): number {
  return capacidadeReal(content, f);
}
function faltaDe(content: ContentBundle, f: FeudoState): string {
  return capacidadeParaGente(content, f) < f.capacidadeHabitacional ? 'água' : 'abrigo';
}

export function chanceDeChegada(content: ContentBundle, f: FeudoState, passagem: number): number {
  if (f.comida < f.populacao * 2 || f.populacao >= capacidadeParaGente(content, f) || f.estabilidade < 25) return 0;
  return Math.min(0.35, 0.02 + (f.renome ?? 0) / 400 + passagem * 0.015);
}

export type RelatorioGente = { chegou?: string; foram: string[]; renome: number };

export function processarGente(content: ContentBundle, camp: Campaign, regiao: string, passagem: number): RelatorioGente {
  const f = camp.feudo!;
  const { colonos } = estadoGente(f);
  const dia = camp.calendario.dia;
  const rel: RelatorioGente = { foram: [], renome: 0 };

  // Renome: colônia alimentada e em ordem é notícia boa na estrada.
  const alimentada = f.comida >= f.populacao * 3;
  const antes = f.renome ?? 0;
  if (f.comida === 0 || f.estabilidade < 30) f.renome = Math.max(0, antes - 0.3);
  else if (alimentada && f.estabilidade >= 60) f.renome = Math.min(200, antes + 0.2);
  rel.renome = (f.renome ?? 0) - antes;

  // Quem espera à porta desiste.
  f.chegadas = (f.chegadas ?? []).filter(ch => ch.ate > dia);

  // Chegada.
  const rng = rngDe(camp, 'chegada');
  if ((f.chegadas?.length ?? 0) < 2 && content.arquetiposColono?.length && nextFloat(rng) < chanceDeChegada(content, f, passagem)) {
    const a = arquetipoPara(content, rng, regiao);
    const grupos = (content.gruposChegada ?? []).filter(g => !g.arquetipos.length || g.arquetipos.includes(a.id));
    const g = grupos.length ? pick(rng, grupos) : undefined;
    const seq = (f.seqColonos = (f.seqColonos ?? 0) + 1);
    const primeira = gerarColono(content, camp, rng, a, `colono_${seq}`);
    const lista = [primeira];
    if (g?.id === 'irmas') {
      const seq2 = (f.seqColonos = seq + 1);
      const irma = gerarColono(content, camp, rng, a, `colono_${seq2}`);
      irma.nome = `${irma.nome.split(' ')[0]} ${a.epiteto}`;
      irma.historia = `Irmã de ${primeira.nome.split(' ')[0]}. ${irma.historia}`;
      lista.push(irma);
    }
    const comuns = g ? nextInt(rng, g.comuns[0], g.comuns[1]) : 0;
    const texto = `${primeira.nome}, ${primeira.idade} anos, à porta. ${g?.texto ?? ''} ${primeira.historia}`.replace(/\s+/g, ' ').trim();
    (f.chegadas ??= []).push({ id: `chegada_${seq}`, dia, ate: dia + DIAS_NA_PORTA, colonos: lista, comuns, texto, traz: a.traz as Record<string, number> | undefined });
    rel.chegou = texto;
  }

  // Humor e quem vai embora.
  // Fome é não ter o do dia para todos: o punhado que a caça trouxe hoje não
  // alimenta seis bocas, e contar isso como "tem comida" deixava a colônia
  // faminta com humor de colônia farta.
  const comidaOk = f.comida >= f.populacao;
  for (const c of [...colonos]) {
    let alvo = 50 + (comidaOk ? 10 : -25) + (f.estabilidade - 50) / 2;
    if (c.funcao) alvo += (c.aptidoes[c.funcao] ?? 0) >= 3 ? 10 : (c.aptidoes[c.funcao] ?? 0) === 0 ? -10 : 0;
    else if (c.temperamento === 'ambiciosa') alvo -= 15;
    if (c.temperamento === 'devota') alvo += (f.edificios.igreja_santuario ?? 0) ? 10 : -10;
    if (c.temperamento === 'medrosa' && f.seguranca < 40) alvo -= 20;
    if (c.temperamento === 'leal') alvo += 5;
    c.humor = Math.max(0, Math.min(100, c.humor + Math.sign(alvo - c.humor) * Math.min(3, Math.abs(alvo - c.humor))));
    c.diasInfeliz = c.humor < 15 ? (c.diasInfeliz ?? 0) + 1 : 0;
    if (c.diasInfeliz >= (c.temperamento === 'leal' ? 10 : 5)) {
      f.colonos = f.colonos!.filter(x => x.id !== c.id);
      f.populacao = Math.max(0, f.populacao - 1);
      f.renome = Math.max(0, (f.renome ?? 0) - 1);
      const texto = `${c.nome} foi embora. Disse que não tinha vindo até aqui para isso.`;
      f.historicoEventos.push({ dia, texto });
      rel.foram.push(texto);
    }
  }
  return rel;
}
