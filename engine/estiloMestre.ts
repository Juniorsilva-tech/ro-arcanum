// ARCANUM · O estilo que o mestre deixa, e o mestre que recusa.
//
// Aprender com um mestre muda o jeito de lutar, não só a lista de artes:
// quem aprende com a Kesta briga de perto e aguenta; quem aprende com a Neve
// acerta onde quer. O ÚLTIMO mestre que ensinou (ou que aprovou na prova)
// define o estilo, e o estilo mexe no combate:
// - agressivo: +1 acerto, −1 defesa;
// - defensivo: +2 defesa, −1 acerto;
// - preciso: +5% de chance de crítico;
// - bruto: +8% de dano, −1 acerto.
// E o mestre recusa quem ele despreza: com a confiança dele muito baixa
// (−20 ou menos), não há lição nem prova.
import type { Campaign, ContentBundle, Personagem } from './types';

export type EstiloMarcial = NonNullable<Personagem['estiloMarcial']>;

export const ESTILO_DO_MESTRE: Record<string, EstiloMarcial> = {
  mestre_neve: 'preciso', mestre_torana: 'defensivo', mestre_sarine: 'preciso', mestre_halda: 'defensivo',
  mestre_kesta: 'bruto', mestre_nadja: 'preciso', mestre_vell: 'defensivo', mestre_duna: 'bruto',
  mestre_tanjiro: 'agressivo', mestre_giyu: 'defensivo', mestre_gyomei: 'bruto', mestre_shinobu: 'preciso',
  mestre_rengoku: 'agressivo', mestre_muichiro: 'preciso', mestre_mitsuri: 'agressivo', mestre_obanai: 'preciso',
  mestre_sanemi: 'agressivo', mestre_tengen: 'agressivo', mestre_musashi: 'preciso', mestre_bai_long: 'bruto',
  mestre_zenitsu: 'preciso', mestre_inosuke: 'bruto', mestre_kanao: 'preciso', mestre_kanae: 'defensivo',
  mestre_shinjuro: 'agressivo',
};

export const NOME_ESTILO: Record<EstiloMarcial, string> = {
  agressivo: 'agressivo (+1 acerto, −1 defesa)',
  defensivo: 'defensivo (+2 defesa, −1 acerto)',
  preciso: 'preciso (+5% de crítico)',
  bruto: 'bruto (+8% de dano, −1 acerto)',
};

export function efeitoDoEstilo(estilo: EstiloMarcial | undefined): { acerto: number; defesa: number; critico: number; dano: number } {
  switch (estilo) {
    case 'agressivo': return { acerto: 1, defesa: -1, critico: 0, dano: 1 };
    case 'defensivo': return { acerto: -1, defesa: 2, critico: 0, dano: 1 };
    case 'preciso': return { acerto: 0, defesa: 0, critico: 0.05, dano: 1 };
    case 'bruto': return { acerto: -1, defesa: 0, critico: 0, dano: 1.08 };
    default: return { acerto: 0, defesa: 0, critico: 0, dano: 1 };
  }
}

/** O mestre marca o jeito de lutar de quem ele ensinou. */
export function adotarEstilo(camp: Campaign, mestreId: string | undefined): void {
  const e = mestreId ? ESTILO_DO_MESTRE[mestreId] : undefined;
  if (e) camp.personagem.estiloMarcial = e;
}

/** O mestre recusa quem ele despreza. */
export function mestreRecusa(content: ContentBundle, camp: Campaign, mestreId: string): string | undefined {
  const pessoa = content.npcs.find((n) => n.ensinaMestre === mestreId);
  if (!pessoa) return undefined;
  const confianca = camp.npcState[pessoa.id]?.eixos?.confianca ?? 0;
  return confianca <= -20 ? `${pessoa.nome} não ensina quem despreza` : undefined;
}
