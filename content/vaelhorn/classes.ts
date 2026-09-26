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
    mecanicaUnica: 'Conhece os atalhos: toda rota fica menos perigosa.',
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
    mecanicaUnica: 'Mana gasta volta estudando: cada estudo devolve mana a mais.',
    descricao:
      'Leu o que não devia e sobreviveu para usar. A vila te tolera enquanto for útil e enquanto não fizer perguntas.',
    bonusAtributos: { raciocinio: 3, percepcao: 1 },
    periciasIniciais: { arcana: 2, decifrar: 1, perceber: 1 },
    itensIniciais: { grimorio_gasto: 1, cajado_de_carvalho: 1, adaga: 1, roupa_acolchoada: 1, racao: 2, tonico_de_mana: 1 },
    equipInicial: { arma: 'cajado_de_carvalho', armadura: 'roupa_acolchoada' },
    artesIniciais: ['centelha', 'ler_aura'],
  },
  {
    id: 'espadachim',
    nome: 'Espadachim',
    recursoPrincipal: 'vigor',
    mecanicaUnica: 'Um alvo por vez: cada acerto no mesmo inimigo facilita o próximo. Trocar de alvo zera.',
    descricao:
      'Aprendeu a lâmina como quem aprende um idioma: cedo, apanhando, e sem escolha. Não carrega escudo — carrega a certeza de que o segundo golpe não vai ser preciso.',
    bonusAtributos: { precisao: 3, fisico: 1 },
    periciasIniciais: { atletismo: 2, perceber: 1, intimidar: 1 },
    itensIniciais: { espada_longa: 1, pedra_de_amolar: 1, gibao_de_couro: 1, racao: 3, oleo_de_lamina: 1 },
    equipInicial: { arma: 'espada_longa', armadura: 'gibao_de_couro' },
  },
  {
    id: 'cacadora',
    nome: 'Caçador',
    recursoPrincipal: 'vigor',
    mecanicaUnica: 'O corpo obedece ao fôlego: descansar recupera metade a mais.',
    descricao:
      'Não caça bicho. Caça o que aparece depois que o sol se põe — e aprendeu a respirar de um jeito que o corpo aguenta a noite inteira.',
    bonusAtributos: { fisico: 2, percepcao: 2 },
    periciasIniciais: { atletismo: 1, perceber: 2, rastrear: 1 },
    itensIniciais: { espada_curta: 1, lanterna_surda: 1, peles_de_cacador: 1, racao: 3, sal_bento: 1, pocao_cura_menor: 1 },
    equipInicial: { arma: 'espada_curta', armadura: 'peles_de_cacador' },
    artesIniciais: ['segundo_folego'],
  },
  {
    id: 'curandeira',
    nome: 'Curandeiro',
    recursoPrincipal: 'mana',
    mecanicaUnica: 'Descansar também trata veneno, doença e infecção.',
    descricao:
      'Sabe o nome de cada erva e o preço de cada uma. Foi chamado em toda casa da vila pelo menos uma vez, e por isso sabe o que cada família esconde.',
    bonusAtributos: { raciocinio: 2, percepcao: 2 },
    periciasIniciais: { oficio: 2, perceber: 1, persuadir: 1 },
    itensIniciais: { adaga: 1, ervas_secas: 3, compressa_de_ervas: 2, habito_de_la: 1, antidoto: 1, racao: 2 },
    equipInicial: { arma: 'adaga', armadura: 'habito_de_la' },
    artesIniciais: ['cura_menor', 'febre_quebrada'],
  },
  {
    id: 'contrabandista',
    nome: 'Contrabandista',
    recursoPrincipal: 'vigor',
    mecanicaUnica: 'Conhece quem compra: 20% mais barato para comprar, 20% mais caro para vender.',
    descricao:
      'Atravessa o que os outros não atravessam, pelo caminho que os outros não conhecem. Deve favor a gente demais em cidade demais.',
    bonusAtributos: { social: 2, precisao: 2 },
    periciasIniciais: { enganar: 2, furtividade: 1, prestidigitacao: 1 },
    itensIniciais: { estilete: 1, saco_de_contrabando: 1, gazua: 1, capuz_de_lona: 1, moeda_antiga: 2, racao: 2 },
    equipInicial: { arma: 'estilete', armadura: 'capuz_de_lona' },
  },
  {
    id: 'penitente',
    nome: 'Penitente',
    recursoPrincipal: 'mana',
    mecanicaUnica: 'Carrega o peso de propósito: quanto mais ferido, mais forte a arte que invoca.',
    descricao:
      'Fez uma promessa que ninguém ouviu e cumpre desde então. Reza pouco e em voz baixa, mas alguma coisa do outro lado atende.',
    bonusAtributos: { resiliencia: 3, social: 1 },
    periciasIniciais: { intimidar: 1, perceber: 1, decifrar: 1, atletismo: 1 },
    itensIniciais: { bastao_ferrado: 1, habito_de_la: 1, agua_benta: 1, incenso_de_purga: 1, racao: 3 },
    equipInicial: { arma: 'bastao_ferrado', armadura: 'habito_de_la' },
    artesIniciais: ['coragem', 'palavra_de_calma'],
  },
  {
    id: 'lutador',
    nome: 'Lutador',
    recursoPrincipal: 'vigor',
    mecanicaUnica: 'Combate Desarmado e Quebra de Lâmina: causa dano contundente com punhos nus e manoplas, e pode quebrar a arma do inimigo ao contra-atacar.',
    descricao:
      'Rejeita o aço como muleta. Condicionou os nós dos dedos, as canelas e o fôlego nas brigas de chão e na poeira das estradas. Luta com as próprias mãos — e aprendeu a medir o tempo exato para aparar e quebrar a lâmina de quem vem armado.',
    bonusAtributos: { fisico: 2, precisao: 2 },
    periciasIniciais: { atletismo: 2, perceber: 1, intimidar: 1 },
    itensIniciais: { faixas_marciais: 1, roupa_acolchoada: 1, unguento_de_sebo: 2, racao: 3 },
    equipInicial: { arma: 'faixas_marciais', armadura: 'roupa_acolchoada' },
    artesIniciais: ['palma_de_ferro', 'partir_espada'],
  },
];
