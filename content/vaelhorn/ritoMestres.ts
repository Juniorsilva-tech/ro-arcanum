// O rito do mestre: antes de ensinar, o mestre cruza o aço (ou o punho, ou a
// mão) com quem pede para aprender. Cada mestre tem um nível de verdade — a
// ferreira da vila não é o Santo da Espada — e vira um adversário de prova
// que nunca aparece na estrada (regiaoExclusiva inexistente).
import type { Criatura, Mestre, NPC } from '../../engine/types';

/** Nível de luta de cada mestre. Ausente = 8 (mestre de vila). */
export const NIVEL_MESTRE: Record<string, number> = {
  mestre_neve: 9, mestre_torana: 6, mestre_sarine: 10, mestre_halda: 7, mestre_kesta: 10,
  mestre_nadja: 8, mestre_vell: 11, mestre_duna: 9,
  mestre_tanjiro: 16, mestre_giyu: 20, mestre_gyomei: 24, mestre_shinobu: 18, mestre_rengoku: 22,
  mestre_muichiro: 20, mestre_mitsuri: 19, mestre_obanai: 20, mestre_sanemi: 21, mestre_tengen: 20,
  mestre_musashi: 26, mestre_bai_long: 22, mestre_zenitsu: 15, mestre_inosuke: 15, mestre_kanao: 16,
  mestre_kanae: 18, mestre_shinjuro: 17,
};

export const REGIAO_DO_RITO = 'Rito do Mestre';

export function idDoRito(mestreId: string): string {
  return `rito_${mestreId}`;
}

/** O adversário de prova de cada mestre, com a força do nível dele. */
export function criaturasDoRito(mestres: Mestre[], npcs: NPC[]): Criatura[] {
  return mestres.map((m) => {
    const n = NIVEL_MESTRE[m.id] ?? 8;
    const pessoa = npcs.find((x) => x.ensinaMestre === m.id);
    const nome = pessoa?.nome ?? m.nome;
    return {
      id: idDoRito(m.id),
      nome,
      descricao: `${nome} testa quem pede para aprender: ${m.dominio}.`,
      historia: `Ninguém aprende com ${nome} sem antes cruzar com ${nome}. A prova não mata, mas mostra tudo.`,
      sinais: 'O mestre para quando um dos dois não aguenta mais.',
      nivel: n,
      vida: Math.round(40 + n * 9),
      defesa: Math.round(11 + n * 0.6),
      acerto: Math.round(11 + n * 0.7),
      ataqueNome: 'golpe de mestre',
      dano: { base: Math.round(6 + n * 0.9), dispersao: 0.25, tipo: 'contusão' },
      moralBase: 100,
      xp: n * 3,
      humano: true,
      regiaoExclusiva: REGIAO_DO_RITO,
    } as Criatura;
  });
}
