// ARCANUM · Um edifício por região (sessão 52, Fase 6).
//
// As cidades tinham os mesmos cinco edifícios (lavoura, moradias, enfermaria,
// muralha, mercado), com o mesmo teto, em qualquer lugar do mapa. Corveira,
// construída em cima da mina, não vendia nada de diferente de Mareu, que vive
// do cais. Aqui cada região ganha o edifício que a descrição dela já prometia
// — a fundição alta, o cais grande, a praça de armas, a cisterna, o pátio da
// madeira —, com efeito declarado e medido em engine/edificiosRegionais.ts.
//
// Os números são pequenos de propósito: o edifício dá caráter à cidade, não
// resolve a economia dela sozinho. As capitais (Tessel, Corveira, Mareu)
// podem levar os edifícios comuns até o nível 7; o resto continua em 5.
import type { EdificioRegional } from '../../engine/types';

export const edificiosRegionaisVaelhorn: EdificioRegional[] = [
  {
    id: 'fundicao_alta',
    nome: 'Fundição Alta',
    cidade: 'corveira',
    responsavel: 'morador_corveira_4',
    descricao: 'O forno da mina, três andares de tijolo preto no terraço de cima. Nunca apaga: quem traz a peça bate na bigorna do pátio com o fogo da cidade.',
    efeito: 'Vende carvão e minério; quem forja em Corveira usa o fogo da fundição e não gasta carvão.',
    efeitos: { vende: ['carvao', 'minerio_de_ferro', 'estilhaco_de_pedra'], forja: true, forjaSemCarvao: true },
  },
  {
    id: 'cais_grande',
    nome: 'Cais Grande',
    cidade: 'mareu',
    descricao: 'As barcas de pesca saem antes da primeira luz e voltam cheias quando o mar deixa. O que não se vende fresco vai para o sal.',
    efeito: 'O peixe entra no celeiro todo dia; as caravanas que partem de Mareu vão pela costa, e metade das emboscadas não as alcança.',
    efeitos: { comidaPorDia: 5, fatorAtaqueCaravana: 0.5 },
  },
  {
    id: 'praca_de_armas',
    nome: 'Praça de Armas',
    cidade: 'tessel',
    responsavel: 'armeira_de_tessel',
    descricao: 'A guarnição treina no pátio de pedra ao pé da casa do marechal. De quinze em quinze dias sai uma ronda para as estradas da Marca.',
    efeito: 'A muralha de Tessel sobe até o nível 8; a ronda da guarnição derruba salteadores dos bandos da Marca.',
    efeitos: { tetoMuralha: 8, patrulhaCadaDias: 15 },
  },
  {
    id: 'cisterna_funda',
    nome: 'Cisterna Funda e Bazar',
    cidade: 'solgar',
    responsavel: 'morador_solgar_1',
    descricao: 'A cisterna tem tranca, dono e fila. Em volta dela, no pátio, as caravanas do ermo trocam prata e frascos de botica por água.',
    efeito: 'Na seca, Solgar ainda colhe metade do que colheria; o bazar do pátio vende prata e frascos de botica, e guarda mais peças raras.',
    efeitos: { fertilidadeNaSeca: 0.55, tetoRaros: 4, vende: ['fio_de_prata', 'pocao_cura', 'tonico_de_mana'] },
  },
  {
    id: 'patio_da_madeira',
    nome: 'Pátio da Madeira',
    cidade: 'vintra',
    responsavel: 'morador_vintra_1',
    descricao: 'Toras empilhadas até a altura da paliçada, e os fornos de carvão logo atrás. A vila já foi reconstruída duas vezes com o que sai daqui.',
    efeito: 'Vende carvão; a madeira adianta as obras da vila.',
    efeitos: { vende: ['carvao', 'couro_cru'], materiaisPorDia: 0.6 },
  },
];

/** Teto dos edifícios comuns nas capitais. As outras cidades ficam em 5. */
export const tetoEdificiosVaelhorn: Record<string, number> = {
  tessel: 7,
  corveira: 7,
  mareu: 7,
};
