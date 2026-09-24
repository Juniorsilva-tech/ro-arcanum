// ARCANUM · Ameaça à colônia e assembleia (sessão 58, etapa E).
//
// Até aqui ninguém atacava a colônia: "declarar guerra" só gravava um id. Agora
// a ameaça vem do que JÁ existe no mundo, nunca de uma tabela solta:
//
// - o bando da região (engine/bandos.ts), que mira colônia rica;
// - feras do entorno, mais no inverno e onde o perigo do sítio é alto;
// - a casa que reivindica a terra, quando a colônia cresce sem acordo;
// - onis, onde há rival oni vivo — o círculo da Clareira os mantém longe.
//
// A ameaça é avisada com dias de antecedência (+2 na Colina dos Forcados: o
// traço "vista do planalto" que a etapa A prometia). Nesse prazo, a assembleia
// decide o que preparar. O jogador fala em texto livre; a engine traduz para um
// CATÁLOGO fechado de preparações reais, cada uma com custo, gente e dias. O
// que não se traduz vira "não entendi" com a lista do que dá para fazer. O
// conselho (colonas com nome) opina conforme o temperamento.
//
// No dia, a batalha é resolvida pela engine e o relatório diz o que cada
// preparação fez. O resultado volta ao mundo: bando repelido perde gente,
// bando que saqueia ganha tesouro, fato público para o vale comentar.
import type { Campaign, ContentBundle, FeudoState } from './types';
import type { SitioColonia } from '../content/vaelhorn/sitios';
import { createRng, nextFloat, seedFromString, type RngState } from './rng';
import { registrarFato } from './historiaViva';
import { registrarMarco } from './memoria';
import { deBando, estadoBandos, temBandos } from './bandos';
import { segurancaDosCavalos } from './rebanhos';
import { eficiencia } from './colonos';

export type TipoAmeaca = 'bando' | 'feras' | 'casa' | 'oni';

export type Preparacao =
  | 'armadilhas' | 'palicada' | 'fosso' | 'vigias' | 'evacuar' | 'estocar' | 'milicia' | 'ajuda' | 'tributo';

export type FichaPreparacao = {
  nome: string;
  /** Palavras que a assembleia entende como esta preparação. */
  palavras: string[];
  custo: { materiais?: number; ouro?: number; comida?: number };
  /** Gente mínima na colônia para fazer. */
  gente: number;
  /** Dias de trabalho: só vale se ficar pronta antes da chegada. */
  dias: number;
  /** Defesa que soma na batalha. */
  defesa: number;
  descricao: string;
};

export const PREPARACOES: Record<Preparacao, FichaPreparacao> = {
  armadilhas: { nome: 'armadilhas', palavras: ['armadilha', 'fojo', 'estaca', 'laço', 'laco'], custo: { materiais: 15 }, gente: 3, dias: 1, defesa: 8, descricao: 'fojos e estacas nas trilhas de chegada; ferem os primeiros' },
  palicada: { nome: 'paliçada', palavras: ['paliçada', 'palicada', 'cerca', 'barricada', 'muro de madeira', 'tronco'], custo: { materiais: 40 }, gente: 6, dias: 2, defesa: 18, descricao: 'troncos fincados em volta das casas' },
  fosso: { nome: 'fosso', palavras: ['fosso', 'vala', 'trincheira', 'cavar'], custo: { materiais: 10, comida: 10 }, gente: 8, dias: 3, defesa: 14, descricao: 'vala funda diante da entrada' },
  vigias: { nome: 'vigias', palavras: ['vigia', 'sentinela', 'guarda noturna', 'torre', 'vigiar'], custo: { comida: 6 }, gente: 2, dias: 0, defesa: 6, descricao: 'gente acordada a noite inteira: ninguém é pego de surpresa' },
  evacuar: { nome: 'evacuar', palavras: ['evacuar', 'fugir', 'esconder', 'mata', 'retirar', 'sair'], custo: {}, gente: 0, dias: 1, defesa: 0, descricao: 'a gente se esconde; ninguém morre, mas o que ficar é levado' },
  estocar: { nome: 'estocar', palavras: ['estocar', 'enterrar', 'guardar', 'esconder comida', 'celeiro'], custo: { materiais: 5 }, gente: 2, dias: 1, defesa: 0, descricao: 'metade do celeiro e do tesouro enterrada longe das casas' },
  milicia: { nome: 'milícia', palavras: ['milícia', 'milicia', 'armar', 'lutar', 'lanças', 'lancas', 'treinar', 'defender'], custo: { ouro: 20 }, gente: 5, dias: 2, defesa: 16, descricao: 'lanças e escudos para quem aguenta segurar' },
  ajuda: { nome: 'pedir ajuda', palavras: ['ajuda', 'socorro', 'reforço', 'reforco', 'casa', 'aliado', 'pedir'], custo: { ouro: 15 }, gente: 0, dias: 2, defesa: 22, descricao: 'mensageiro à casa aliada: vêm se houver acordo ou boa reputação' },
  tributo: { nome: 'pagar tributo', palavras: ['tributo', 'pagar', 'comprar', 'negociar', 'acordo', 'suborno'], custo: {}, gente: 0, dias: 0, defesa: 0, descricao: 'oferecer ouro para que não venham — só serve para quem aceita moeda' },
};
export const LISTA_PREPARACOES = Object.keys(PREPARACOES) as Preparacao[];

export type AmeacaColonia = {
  id: string;
  tipo: TipoAmeaca;
  /** Quem vem (id do bando, da casa...). */
  origem?: string;
  nome: string;
  forca: number;
  avisadaEm: number;
  chegaEm: number;
  texto: string;
  /** Preparações decididas: dia em que começaram. */
  preparacoes: Partial<Record<Preparacao, number>>;
  conselho: string[];
  /** Ouro que aceitam como tributo (0 = não aceitam). */
  tributo: number;
};

export type ResultadoBatalha = {
  desfecho: 'repelida' | 'resistida' | 'saqueada' | 'evitada';
  defesa: number;
  ataque: number;
  linhas: string[];
  mortos: number;
  perdas: { comida: number; materiais: number; ouro: number };
};

const DIAS_DE_AVISO = 3;
const INTERVALO_MINIMO = 20;

function rngDe(camp: Campaign, chave: string): RngState {
  return createRng((camp.rng.seed ^ seedFromString(`ameaca:${chave}:${camp.calendario.dia}`)) >>> 0);
}

export function diasDeAviso(s: SitioColonia): number {
  return DIAS_DE_AVISO + (s.traco === 'vista_do_planalto' ? 2 : 0);
}

/** Riqueza à vista: o que atrai bando. */
function riqueza(f: FeudoState): number {
  return f.tesouro + f.comida * 0.5 + f.materiais * 0.3;
}

// ── De onde vem ───────────────────────────────────────────────────────────

type Candidata = Omit<AmeacaColonia, 'id' | 'avisadaEm' | 'chegaEm' | 'preparacoes' | 'conselho'> & { peso: number };

function candidatas(content: ContentBundle, camp: Campaign, s: SitioColonia): Candidata[] {
  const f = camp.feudo!;
  const out: Candidata[] = [];
  const inverno = camp.calendario.estacao === 'inverno';

  if (temBandos(content)) {
    for (const b of Object.values(estadoBandos(content, camp).bandos)) {
      if (b.estado !== 'ativo' || b.regiao !== s.regiao || b.membros < 4) continue;
      out.push({
        tipo: 'bando', origem: b.id, nome: b.nome, forca: 8 + b.membros * 4, tributo: Math.round(20 + b.membros * 4),
        texto: `Batedores ${deBando(b.nome)} foram vistos rondando a colônia. Contaram as casas, o celeiro e o curral.`,
        // Bando mira colônia rica e onde passa gente.
        peso: 0.004 + riqueza(f) / 40000 + s.terreno.passagem * 0.002,
      });
    }
  }
  if (s.terreno.perigo >= 1) {
    out.push({
      tipo: 'feras', nome: 'uma matilha', forca: 10 + s.terreno.perigo * 6 + (inverno ? 8 : 0), tributo: 0,
      texto: inverno ? 'Uivos na borda da mata, cada noite mais perto. A fome desceu com o inverno.' : 'Rastros grandes em volta do curral. Alguma coisa está medindo a colônia.',
      peso: 0.002 * s.terreno.perigo * (inverno ? 2.5 : 1),
    });
  }
  if (s.reivindicadaPor && !f.acordos?.includes(s.reivindicadaPor) && f.populacao >= 15) {
    const nomeCasa = content.casas?.find(c => c.id === s.reivindicadaPor)?.nome ?? s.reivindicadaPor;
    out.push({
      tipo: 'casa', origem: s.reivindicadaPor, nome: nomeCasa, forca: 40, tributo: 60,
      texto: `Cavaleiros com as cores de ${nomeCasa} vêm cobrar a terra que dizem ser deles.`,
      peso: 0.002 + f.populacao / 20000,
    });
  }
  const oniVivo = Object.values(camp.kimetsu?.rivais ?? {}).some(r => r.vivo);
  if (oniVivo && s.traco !== 'circulo_de_pedras') {
    out.push({
      tipo: 'oni', nome: 'um oni', forca: 45, tributo: 0,
      texto: 'Gente sumiu da estrada perto daqui, à noite. O que levou não deixa pegada de bicho.',
      peso: 0.0015,
    });
  }
  return out;
}

/**
 * Chamado no dia da colônia. Resolve a ameaça que chegou, ou talvez anuncia
 * uma nova. Devolve linhas para o relatório do dia.
 */
export function processarAmeacas(content: ContentBundle, camp: Campaign, s: SitioColonia): string[] {
  const f = camp.feudo!;
  const dia = camp.calendario.dia;
  const linhas: string[] = [];
  if (f.ameaca && dia >= f.ameaca.chegaEm) {
    const r = resolverBatalha(content, camp);
    if (r) linhas.push(...r.linhas);
    return linhas;
  }
  if (f.ameaca || dia - (f.ultimaAmeaca ?? -INTERVALO_MINIMO) < INTERVALO_MINIMO) return linhas;
  const rng = rngDe(camp, 'surge');
  for (const c of candidatas(content, camp, s)) {
    if (nextFloat(rng) >= c.peso) continue;
    const seq = (f.seqAmeacas = (f.seqAmeacas ?? 0) + 1);
    const { peso: _peso, ...resto } = c;
    const a: AmeacaColonia = {
      ...resto, id: `ameaca_${seq}`, avisadaEm: dia, chegaEm: dia + diasDeAviso(s), preparacoes: {},
      conselho: opinioesDoConselho(f, c.tipo, c.tributo > 0),
    };
    f.ameaca = a;
    f.ultimaAmeaca = dia;
    linhas.push(`${a.texto} Chegam em ${a.chegaEm - dia} dias. A assembleia precisa decidir o que fazer.`);
    break;
  }
  return linhas;
}

// ── A assembleia ──────────────────────────────────────────────────────────

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Traduz o que o jogador disse na assembleia para preparações do catálogo. */
export function interpretarAssembleia(texto: string): { entendidas: Preparacao[]; resto: boolean } {
  const t = normalizar(texto);
  const entendidas = LISTA_PREPARACOES.filter(p => PREPARACOES[p].palavras.some(w => t.includes(normalizar(w))));
  return { entendidas, resto: entendidas.length === 0 && t.trim().length > 0 };
}

function opinioesDoConselho(f: FeudoState, tipo: TipoAmeaca, aceitaTributo: boolean): string[] {
  const falas: Record<string, (n: string) => string> = {
    briguenta: n => `${n}: "Arma quem aguenta e espera no portão. Quem foge uma vez foge sempre."`,
    medrosa: n => aceitaTributo ? `${n}: "Paga. Ouro volta; gente morta não."` : `${n}: "Leva as crianças para a mata antes que cheguem."`,
    esperta: n => `${n}: "Fojo nas trilhas e vigia no alto. Que venham cansados e já sangrando."`,
    trabalhadora: n => `${n}: "Paliçada. Dois dias de tronco e ninguém entra fácil."`,
    ambiciosa: n => `${n}: "Manda chamar a casa. Se a gente segurar isso sozinha, ninguém nunca mais nos leva a sério — mas se cair, cai tudo."`,
    devota: n => tipo === 'oni' ? `${n}: "Fogo aceso a noite inteira. Isso não gosta de luz."` : `${n}: "Vigia e oração. O resto é soberba."`,
    leal: n => `${n}: "O que você decidir, eu seguro."`,
    preguicosa: n => `${n}: "Enterra o celeiro e deixa levarem o resto. Casa se levanta de novo."`,
  };
  return [...(f.colonos ?? [])].sort((a, b) => b.lealdade - a.lealdade).slice(0, 3)
    .map(c => falas[c.temperamento]?.(c.nome.split(' ')[0]) ?? `${c.nome}: "Não sei."`);
}

/** Pode fazer esta preparação a tempo, com o que há? */
export function podePreparar(camp: Campaign, p: Preparacao): { pode: boolean; motivo?: string } {
  const f = camp.feudo;
  const a = f?.ameaca;
  if (!f || !a) return { pode: false, motivo: 'Não há ameaça à vista.' };
  if (a.preparacoes[p] !== undefined) return { pode: false, motivo: `${PREPARACOES[p].nome} já está decidida.` };
  const ficha = PREPARACOES[p];
  if (p === 'tributo' && !a.tributo) return { pode: false, motivo: `${a.nome} não aceita moeda.` };
  if (f.populacao < ficha.gente) return { pode: false, motivo: `${ficha.nome} pede pelo menos ${ficha.gente} pessoas.` };
  const custo = p === 'tributo' ? { ouro: a.tributo } : ficha.custo;
  if ((custo.materiais ?? 0) > f.materiais) return { pode: false, motivo: `Falta material para ${ficha.nome}.` };
  if ((custo.ouro ?? 0) > f.tesouro) return { pode: false, motivo: `Falta ouro para ${ficha.nome}.` };
  if ((custo.comida ?? 0) > f.comida) return { pode: false, motivo: `Falta comida para ${ficha.nome}.` };
  return { pode: true };
}

/**
 * O que a assembleia decidiu. Aceita texto livre (traduzido pelo catálogo) ou
 * a lista de preparações escolhidas nos botões.
 */
export function decidirAssembleia(camp: Campaign, entrada: string | Preparacao[]): { ok: boolean; mensagem: string; feitas: Preparacao[] } {
  const f = camp.feudo;
  const a = f?.ameaca;
  if (!f || !a) return { ok: false, mensagem: 'Não há ameaça à vista.', feitas: [] };
  const lista = typeof entrada === 'string' ? interpretarAssembleia(entrada).entendidas : entrada;
  if (!lista.length) {
    return { ok: false, feitas: [], mensagem: `A assembleia não entendeu. Dá para decidir: ${LISTA_PREPARACOES.map(p => PREPARACOES[p].nome).join(', ')}.` };
  }
  const dia = camp.calendario.dia;
  const feitas: Preparacao[] = [];
  const recusas: string[] = [];
  for (const p of lista) {
    const pode = podePreparar(camp, p);
    if (!pode.pode) { recusas.push(pode.motivo!); continue; }
    const ficha = PREPARACOES[p];
    const custo = p === 'tributo' ? { ouro: a.tributo } : ficha.custo;
    f.materiais -= custo.materiais ?? 0;
    f.tesouro -= custo.ouro ?? 0;
    f.comida -= custo.comida ?? 0;
    a.preparacoes[p] = dia;
    feitas.push(p);
  }
  const atrasadas = feitas.filter(p => dia + PREPARACOES[p].dias > a.chegaEm);
  const partes = [
    feitas.length ? `A assembleia decidiu: ${feitas.map(p => PREPARACOES[p].nome).join(', ')}.` : '',
    atrasadas.length ? `Não dá tempo de terminar ${atrasadas.map(p => PREPARACOES[p].nome).join(', ')} antes que cheguem.` : '',
    recusas.join(' '),
  ].filter(Boolean);
  const mensagem = partes.join(' ');
  if (feitas.length) f.historicoEventos.push({ dia, texto: mensagem });
  return { ok: feitas.length > 0, mensagem, feitas };
}

// ── A batalha ─────────────────────────────────────────────────────────────

const pronta = (a: AmeacaColonia, p: Preparacao) => a.preparacoes[p] !== undefined && a.preparacoes[p]! + PREPARACOES[p].dias <= a.chegaEm;

export function resolverBatalha(content: ContentBundle, camp: Campaign): ResultadoBatalha | undefined {
  const f = camp.feudo;
  const a = f?.ameaca;
  if (!f || !a) return undefined;
  const rng = rngDe(camp, `batalha:${a.id}`);
  const linhas: string[] = [];
  const perdas = { comida: 0, materiais: 0, ouro: 0 };
  const fim = (r: ResultadoBatalha) => {
    f.ameaca = undefined;
    for (const l of r.linhas) f.historicoEventos.push({ dia: camp.calendario.dia, texto: l });
    f.ultimaBatalha = { dia: camp.calendario.dia, nome: a.nome, ...r };
    return r;
  };

  // Tributo pago: quem aceita moeda não vem.
  if (a.preparacoes.tributo !== undefined) {
    linhas.push(`${a.nome} recebeu ${a.tributo} de ouro e seguiu outro caminho. A estrada vai saber que aqui se paga.`);
    f.renome = Math.max(0, (f.renome ?? 0) - 3);
    if (a.tipo === 'bando' && a.origem) { const b = camp.bandos?.bandos[a.origem]; if (b) b.tesouro += a.tributo; }
    if (a.tipo === 'casa') (f.acordos ??= []).includes(a.origem!) || f.acordos!.push(a.origem!);
    return fim({ desfecho: 'evitada', defesa: 0, ataque: a.forca, linhas, mortos: 0, perdas });
  }

  // Defesa: o que a colônia é, mais o que se preparou a tempo.
  let defesa = f.seguranca * 0.4 + (f.edificios.muralha_baluarte ?? 0) * 10 + (f.edificios.quartel ?? 0) * 8;
  defesa += segurancaDosCavalos(f) + (eficiencia(f, 'guarda') - 0.6) * 20;
  linhas.push(`${a.nome} chegou. A colônia tinha ${Math.round(defesa)} de defesa antes do que foi preparado.`);
  for (const p of LISTA_PREPARACOES) {
    if (a.preparacoes[p] === undefined || p === 'tributo') continue;
    const ficha = PREPARACOES[p];
    if (!pronta(a, p)) { linhas.push(`${ficha.nome}: não ficou pronta a tempo.`); continue; }
    let valor = ficha.defesa;
    if (p === 'ajuda') {
      // Vem quem tem acordo com a colônia ou gosta do jogador (reputação 10+).
      // Contra a própria casa que reivindica a terra, ninguém se mete.
      const amigas = Object.entries(camp.mundo?.casas ?? {}).filter(([id, e]) => id !== a.origem && ((f.acordos ?? []).includes(id) || (e.reputacao ?? 0) >= 10));
      const aliada = amigas.length > 0 || (f.acordos ?? []).some(id => id !== a.origem);
      if (!aliada || a.tipo === 'casa') { linhas.push('pedir ajuda: ninguém veio. Não há acordo nem nome que chame reforço.'); continue; }
    }
    if (p === 'vigias' && a.tipo === 'oni') valor += 6; // fogo aceso a noite toda
    if (valor) linhas.push(`${ficha.nome}: ${ficha.descricao} (+${valor}).`);
    defesa += valor;
  }
  const evacuou = pronta(a, 'evacuar');
  const estocou = pronta(a, 'estocar');
  const ataque = a.forca * (0.85 + nextFloat(rng) * 0.3);
  defesa = Math.round(defesa);

  let desfecho: ResultadoBatalha['desfecho'];
  let mortos = 0;
  let levar = 0;
  if (defesa >= ataque * 1.2) { desfecho = 'repelida'; levar = 0; }
  else if (defesa >= ataque * 0.8) { desfecho = 'resistida'; levar = 0.15; mortos = evacuou ? 0 : Math.max(0, Math.round((ataque - defesa * 0.8) / 20)); }
  else { desfecho = 'saqueada'; levar = evacuou ? 0.6 : 0.4; mortos = evacuou ? 0 : Math.max(1, Math.round((ataque - defesa) / 12)); }
  if (estocou) levar /= 2;
  perdas.comida = Math.round(f.comida * levar);
  perdas.materiais = Math.round(f.materiais * levar);
  perdas.ouro = Math.round(f.tesouro * levar);
  f.comida -= perdas.comida; f.materiais -= perdas.materiais; f.tesouro -= perdas.ouro;
  // Saque é tragédia, não extermínio: no máximo um quarto da gente.
  mortos = Math.min(mortos, Math.ceil(f.populacao * 0.25), Math.max(0, f.populacao - 2));
  if (mortos) {
    f.populacao -= mortos;
    // Morre primeiro quem não tem nome; se só sobrou gente com nome, alguém com nome.
    const semNome = f.populacao - (f.colonos?.length ?? 0);
    if (semNome < 0 && f.colonos?.length) f.colonos.splice(0, -semNome);
  }

  if (desfecho === 'repelida') {
    linhas.push(`Repelidos: ${Math.round(defesa)} de defesa contra ${Math.round(ataque)} de ataque. Ninguém da colônia caiu.`);
    f.renome = Math.min(200, (f.renome ?? 0) + 6);
    f.estabilidade = Math.min(100, f.estabilidade + 8);
  } else if (desfecho === 'resistida') {
    linhas.push(`A colônia resistiu, a custo: ${Math.round(defesa)} contra ${Math.round(ataque)}. ${mortos ? `${mortos} não voltaram.` : 'Ninguém morreu.'} Levaram ${perdas.comida} de comida, ${perdas.materiais} de material e ${perdas.ouro} de ouro.`);
    f.renome = Math.min(200, (f.renome ?? 0) + 2);
  } else {
    linhas.push(`Saqueada: ${Math.round(defesa)} contra ${Math.round(ataque)}. ${mortos ? `${mortos} morreram.` : 'A gente escapou para a mata.'} Levaram ${perdas.comida} de comida, ${perdas.materiais} de material e ${perdas.ouro} de ouro.`);
    f.renome = Math.max(0, (f.renome ?? 0) - 4);
    f.estabilidade = Math.max(0, f.estabilidade - 12);
  }
  if (estocou && levar) linhas.push('O que estava enterrado ficou: metade do que levariam.');

  // O mundo sente o resultado.
  if (a.tipo === 'bando' && a.origem) {
    const b = camp.bandos?.bandos[a.origem];
    if (b) {
      if (desfecho === 'repelida') { b.membros = Math.max(0, b.membros - 3); b.pistas += 1; }
      if (desfecho === 'resistida') b.membros = Math.max(0, b.membros - 1);
      b.tesouro += perdas.ouro + Math.round(perdas.comida / 4);
    }
  }
  if (a.tipo === 'feras' && desfecho === 'repelida') { f.comida += 12; linhas.push('Da matilha abatida, carne para alguns dias.'); }
  if (camp.vivo) {
    registrarFato(camp, {
      tipo: `colonia_${desfecho}`, local: f.sitio ?? f.localId, publico: true, atores: ['jogador'],
      texto: desfecho === 'repelida' ? `${f.nome} repeliu ${a.nome}.` : desfecho === 'resistida' ? `${f.nome} resistiu a ${a.nome}, com perdas.` : `${a.nome} saqueou ${f.nome}.`,
    });
  }
  if (desfecho !== 'resistida') registrarMarco(camp, linhas[linhas.length - 1]);
  return fim({ desfecho, defesa, ataque: Math.round(ataque), linhas, mortos, perdas });
}
