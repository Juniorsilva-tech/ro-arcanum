// ARCANUM · Cultivos por sítio (resto da etapa C da colônia).
//
// A roça rendia pelo solo e só: trigo em todo lugar, com nome e sem escolha.
// Aqui cada sítio tem as plantas que a região aceita, e cada planta faz uma
// coisa diferente no jogo — não é só o nome no relatório:
// - trigo: comida cheia;
// - centeio: rende menos, mas não quebra no inverno;
// - cevada: rende menos e vira cerveja — a colônia fica mais estável;
// - linho: pouca comida, tecido que vira moeda;
// - nabo de forragem: rende menos, mas o rebanho come nabo no inverno em vez
//   do celeiro;
// - ervas: pouca comida, remédio para o boticário;
// - painço: aguenta solo ruim (o ermo), rende quase igual em qualquer terra;
// - arroz: rende mais, mas só onde há muita água;
// - vinha: quase nenhuma comida, vinho que vale ouro.
// Trocar de planta custa: a roça fica parada enquanto a nova brota.
//
// Nada aqui consome o RNG da campanha.
import type { Campaign, ContentBundle, FeudoState } from './types';

export type CultivoId = 'trigo' | 'centeio' | 'cevada' | 'linho' | 'nabo' | 'ervas' | 'painco' | 'arroz' | 'vinha';

export type Cultivo = {
  id: CultivoId;
  nome: string;
  /** O que ela faz, em uma frase — a tela mostra isto. */
  efeito: string;
  /** Quanto da comida da roça ela dá (1 = trigo). */
  comida: number;
  /** Piso de rendimento no inverno (substitui o do terreno, se maior). */
  invernoMinimo?: number;
  /** Ignora o solo fraco: rende pelo menos isto do trigo em terra boa. */
  soloMinimo?: number;
  /** Água mínima do terreno (0 a 3) para plantar. */
  aguaMinima?: number;
  /** Por nível de lavoura e silos, por dia. */
  ouroDia?: number;
  remediosDia?: number;
  /** Estabilidade ganha a cada 5 dias. */
  estabilidade5d?: number;
  /** Fração do feno de inverno que o nabo cobre. */
  forragem?: number;
};

export const CULTIVOS: Record<CultivoId, Cultivo> = {
  trigo: { id: 'trigo', nome: 'Trigo', efeito: 'comida cheia', comida: 1 },
  centeio: { id: 'centeio', nome: 'Centeio', efeito: 'rende 85%, mas não quebra no inverno', comida: 0.85, invernoMinimo: 0.8 },
  cevada: { id: 'cevada', nome: 'Cevada', efeito: 'rende 80%; a cerveja deixa a colônia mais estável', comida: 0.8, estabilidade5d: 1 },
  linho: { id: 'linho', nome: 'Linho', efeito: 'rende 30% de comida; o tecido vende', comida: 0.3, ouroDia: 3 },
  nabo: { id: 'nabo', nome: 'Nabo de forragem', efeito: 'rende 70%; no inverno o rebanho come nabo, não o celeiro', comida: 0.7, forragem: 0.6 },
  ervas: { id: 'ervas', nome: 'Ervas de cura', efeito: 'rende 40%; o boticário ganha remédio todo dia', comida: 0.4, remediosDia: 2 },
  painco: { id: 'painco', nome: 'Painço', efeito: 'rende 90% até em terra ruim', comida: 0.9, soloMinimo: 0.9 },
  arroz: { id: 'arroz', nome: 'Arroz', efeito: 'rende 125%, só com muita água', comida: 1.25, aguaMinima: 3 },
  vinha: { id: 'vinha', nome: 'Vinha', efeito: 'quase nenhuma comida; o vinho vale ouro', comida: 0.15, ouroDia: 5 },
};

/** Plantas que cada sítio aceita (a primeira é a que a colônia já tem ao ser fundada). */
export const CULTIVOS_POR_SITIO: Record<string, CultivoId[]> = {
  campo_ceifa: ['trigo', 'cevada', 'centeio', 'linho'],
  colina_forcados: ['centeio', 'cevada', 'nabo'],
  clareira_pedras: ['centeio', 'ervas', 'nabo'],
  farol_quebrado: ['cevada', 'linho', 'nabo'],
  ruina_areia: ['painco', 'ervas'],
  vau_pedra: ['trigo', 'arroz', 'linho', 'vinha'],
};

/** Dias sem colheita depois de trocar de planta. */
export const DIAS_REPLANTIO = 10;

export function cultivosDoSitio(sitioId: string | undefined): CultivoId[] {
  return (sitioId && CULTIVOS_POR_SITIO[sitioId]) || ['trigo'];
}

export function cultivoAtual(f: FeudoState): Cultivo {
  const id = (f.cultivo as CultivoId | undefined) ?? cultivosDoSitio(f.sitio)[0];
  return CULTIVOS[id] ?? CULTIVOS.trigo;
}

export function replantando(f: FeudoState, dia: number): boolean {
  return (f.replantioAte ?? 0) > dia;
}

export function podePlantar(content: ContentBundle, camp: Campaign, id: CultivoId): { pode: boolean; motivo?: string } {
  const f = camp.feudo;
  if (!f?.fundado || !f.sitio) return { pode: false, motivo: 'Sem colônia fundada.' };
  if (!cultivosDoSitio(f.sitio).includes(id)) return { pode: false, motivo: `${CULTIVOS[id].nome} não dá nesta terra.` };
  if (cultivoAtual(f).id === id) return { pode: false, motivo: `A roça já é de ${CULTIVOS[id].nome.toLowerCase()}.` };
  const agua = content.sitiosColonia?.find((s) => s.id === f.sitio)?.terreno.agua ?? 0;
  const c = CULTIVOS[id];
  if (c.aguaMinima !== undefined && agua < c.aguaMinima) return { pode: false, motivo: `${c.nome} pede muita água, e esta terra não tem.` };
  return { pode: true };
}

/** Troca a planta da roça. A colheita para por DIAS_REPLANTIO dias. */
export function plantar(content: ContentBundle, camp: Campaign, id: CultivoId): { ok: boolean; texto: string } {
  const p = podePlantar(content, camp, id);
  if (!p.pode) return { ok: false, texto: p.motivo! };
  const f = camp.feudo!;
  f.cultivo = id;
  f.replantioAte = camp.calendario.dia + DIAS_REPLANTIO;
  return { ok: true, texto: `A roça foi arada e semeada de ${CULTIVOS[id].nome.toLowerCase()}. Em ${DIAS_REPLANTIO} dias, a primeira colheita.` };
}

/**
 * Ajusta a colheita do dia pela planta. Recebe o rendimento que a roça teria
 * com trigo (solo, inverno e gente já contados) e devolve o que ela dá, mais os
 * efeitos que não são comida.
 */
export function colheitaDoDia(
  f: FeudoState,
  dia: number,
  base: { rocaTrigo: number; niveis: number; fatorSolo: number; inverno: boolean; fatorInverno: number },
): { comida: number; ouro: number; remedios: number; estabilidade: number; forragem: number } {
  const c = cultivoAtual(f);
  if (replantando(f, dia) || base.niveis <= 0) return { comida: 0, ouro: 0, remedios: 0, estabilidade: 0, forragem: 0 };
  let comida = base.rocaTrigo * c.comida;
  // Painço: terra ruim não o derruba tanto.
  if (c.soloMinimo && base.fatorSolo < c.soloMinimo && base.fatorSolo > 0) comida *= c.soloMinimo / base.fatorSolo;
  // Centeio: o inverno não o quebra como quebra o trigo.
  if (c.invernoMinimo && base.inverno && base.fatorInverno < c.invernoMinimo && base.fatorInverno > 0) comida *= c.invernoMinimo / base.fatorInverno;
  return {
    comida,
    ouro: (c.ouroDia ?? 0) * base.niveis,
    remedios: (c.remediosDia ?? 0) * base.niveis,
    estabilidade: c.estabilidade5d && dia % 5 === 0 ? c.estabilidade5d : 0,
    forragem: base.inverno ? c.forragem ?? 0 : 0,
  };
}
