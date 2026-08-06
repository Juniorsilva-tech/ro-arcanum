// ARCANUM · Classes de Vaelhorn. Definidas por recurso principal + mecânica única (GDD §6.3).
import type { Classe } from '../../engine/types';

export const classesVaelhorn: Classe[] = [
  {
    id: 'guardiao',
    nome: 'Guardião',
    recursoPrincipal: 'vigor',
    mecanicaUnica: 'Aguenta o primeiro golpe de cada combate como se não fosse nada.',
    descricao:
      'Escudo antes de espada. Fica de pé quando os outros caem, e é por isso que confiam em você — ou temem.',
    bonusAtributos: { fisico: 2, resiliencia: 2 },
    periciasIniciais: { intimidar: 1, perceber: 1, atletismo: 1 },
    itensIniciais: { espada_curta: 1, escudo_gasto: 1, gibao_de_couro: 1, racao: 3, pocao_cura_menor: 1 },
    equipInicial: { arma: 'espada_curta', escudo: 'escudo_gasto', armadura: 'gibao_de_couro' },
  },
  {
    id: 'batedor',
    nome: 'Batedor',
    recursoPrincipal: 'vigor',
    mecanicaUnica: 'Vê a oportunidade um período antes: oportunidades ficam destacadas mais cedo.',
    descricao:
      'Conhece as rotas, os atalhos e quem anda por eles. Chega antes, sai antes, e ninguém lembra que você passou.',
    bonusAtributos: { precisao: 2, percepcao: 2 },
    periciasIniciais: { furtividade: 1, perceber: 1, rastrear: 1, prestidigitacao: 1 },
    itensIniciais: { arco_curto: 1, adaga: 1, gibao_de_couro: 1, racao: 3, gazua: 1, tocha: 2 },
    equipInicial: { arma: 'arco_curto', armadura: 'gibao_de_couro' },
  },
  {
    id: 'arcanista',
    nome: 'Arcanista',
    recursoPrincipal: 'mana',
    mecanicaUnica: 'Cada arte lançada grava um traço; mana gasta pode ser recuperada estudando.',
    descricao:
      'Leu o que não devia e sobreviveu para usar. A vila te tolera enquanto for útil e enquanto não fizer perguntas.',
    bonusAtributos: { raciocinio: 3, percepcao: 1 },
    periciasIniciais: { arcana: 2, decifrar: 1, perceber: 1 },
    itensIniciais: { grimorio_gasto: 1, cajado_de_carvalho: 1, adaga: 1, roupa_acolchoada: 1, racao: 2, tonico_de_mana: 1 },
    equipInicial: { arma: 'cajado_de_carvalho', armadura: 'roupa_acolchoada' },
    artesIniciais: ['centelha', 'ler_aura'],
  },
];
