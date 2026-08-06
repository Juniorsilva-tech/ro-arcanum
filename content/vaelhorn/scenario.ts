// ARCANUM · Cenário Vaelhorn — medieval sombrio (GDD §6).
import type { Cenario } from '../../engine/types';

export const vaelhorn: Cenario = {
  id: 'vaelhorn',
  nome: 'Vaelhorn',
  genero: 'Medieval sombrio',
  ancoraCalendario: 'desde que a ponte caiu',
  nomesAtributos: {
    fisico: 'Força',
    precisao: 'Destreza',
    resiliencia: 'Constituição',
    raciocinio: 'Inteligência',
    percepcao: 'Sabedoria',
    social: 'Carisma',
  },
  recursos: [
    { id: 'mana', nome: 'Mana' },
    { id: 'vigor', nome: 'Vigor' },
  ],
  pressoes: [
    { id: 'sanidade', nome: 'Sanidade', descricao: 'quanto mais alta, mais perto da ruptura da mente' },
    { id: 'corrupcao', nome: 'Corrupção', descricao: 'a mancha que o pacto e o sangue deixam' },
  ],
  eixosRelacao: [
    { id: 'disposicao', nome: 'Disposição' },
    { id: 'confianca', nome: 'Confiança' },
    { id: 'medo', nome: 'Medo' },
  ],
  acentoCor: '#CFA82D', // ouro
  k: 4,
  tabuCentral: 'necromancia e pactos são crime capital',
};
