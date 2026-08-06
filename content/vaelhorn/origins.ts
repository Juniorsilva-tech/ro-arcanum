// ARCANUM · Origens. Definidas PELO QUE FALTA (GDD §6.3).
import type { Origem } from '../../engine/types';

export const origensVaelhorn: Origem[] = [
  {
    id: 'divida',
    nome: 'Herdeiro de uma dívida',
    arquetipo: 'poder com dívida',
    descricao:
      'Alguém te deu uma vantagem — e cobra juros. O nome que te abre portas é o mesmo que te prende.',
    oQueFalta: 'liberdade',
    bonusAtributos: { raciocinio: 1, social: 1 },
    dinheiroInicial: 12,
    flagsIniciais: { 'divida.credor': 'agiota', 'divida.valor': 40 },
  },
  {
    id: 'foragido',
    nome: 'Foragido de outro condado',
    arquetipo: 'recursos com perseguição',
    descricao:
      'Você chegou com algo no bolso e alguém no encalço. Enquanto ninguém te reconhecer, respira.',
    oQueFalta: 'segurança',
    bonusAtributos: { precisao: 1, resiliencia: 1 },
    dinheiroInicial: 30,
    flagsIniciais: { 'foragido.cacadores': true },
  },
  {
    id: 'sem_nome',
    nome: 'Sem nome nem terra',
    arquetipo: 'força sem identidade',
    descricao:
      'Ninguém sabe de onde você veio, e você tampouco. Sem passado para te prender — e sem ninguém para te socorrer.',
    oQueFalta: 'pertencimento',
    bonusAtributos: { fisico: 1, resiliencia: 1 },
    dinheiroInicial: 6,
    flagsIniciais: { 'sem_nome': true },
  },
];
