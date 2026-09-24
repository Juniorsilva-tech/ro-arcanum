// ARCANUM · Onde se pode fundar uma colônia (sessão 57).
//
// Até aqui o assentamento se fundava num "ponto estratégico" que não existia
// no mapa (`halvet_colinas`), de qualquer lugar do mundo, e as vantagens eram
// texto: nenhuma delas estava no código, e nenhum lugar tinha desvantagem.
//
// Agora cada sítio é um LUGAR REAL do mapa, vazio de dona (as cidades e aldeias
// já têm gente), e só se funda estando nele. O terreno é descrito em números
// de 0 a 3 — a engine (engine/colonia.ts) transforma cada número em efeito, e
// a tela lista vantagens e desvantagens a partir do mesmo número, para que o
// texto nunca prometa o que o jogo não faz. Cada sítio tem ainda um traço
// próprio, tirado da descrição que o lugar já tinha.
import type { BiomaFeudo } from '../../engine/types';

export type AnimalColonia = 'galinha' | 'porco' | 'cabra' | 'ovelha' | 'vaca' | 'cavalo' | 'mula';
export type TracoSitio =
  | 'trigo_do_marechal'   // Campos da Ceifa
  | 'vista_do_planalto'   // Colina dos Forcados
  | 'circulo_de_pedras'   // Clareira das Pedras
  | 'farol_apagado'       // Farol Quebrado
  | 'areia_que_devolve'   // Ruína de Areia
  | 'a_travessia';        // Vau de Pedra

export type TerrenoSitio = {
  /** Água doce ao alcance: 0 = nenhuma (tem de cavar cisterna ou carregar). */
  agua: number;
  /** Solo para lavoura. */
  solo: number;
  madeira: number;
  pedra: number;
  caca: number;
  pesca: number;
  /** Pasto para rebanho. */
  pasto: number;
  /** Defesa natural (altura, água em volta, acesso difícil). */
  defesa: number;
  /** Quanta gente e carga passa por perto. Traz comércio, gente e cobiça. */
  passagem: number;
  /** Perigo do entorno (feras, bandos, o que mora perto). */
  perigo: number;
  /** Dureza do inverno. */
  inverno: number;
};

export type SitioColonia = {
  /** Id do lugar no mapa (content/vaelhorn/continente.ts). */
  id: string;
  nome: string;
  regiao: string;
  bioma: BiomaFeudo;
  /** Por que alguém funda aqui, em duas frases. */
  descricao: string;
  terreno: TerrenoSitio;
  traco: TracoSitio;
  /** O traço, em palavras: o que ele faz na prática. */
  tracoTexto: string;
  /** Casa que considera essa terra dela e cobra por ela. */
  reivindicadaPor?: string;
  /** Animais que dá para comprar ou juntar na região, e quantos no máximo por estação. */
  animais: Partial<Record<AnimalColonia, number>>;
  recursosIniciais: { comida: number; materiais: number; ouro: number };
};

export const SITIOS_COLONIA: SitioColonia[] = [
  {
    id: 'campo_ceifa',
    nome: 'Campos da Ceifa',
    regiao: 'Marca de Tessel',
    bioma: 'planicie',
    descricao: 'Terra boa e plana até onde a vista alcança, com valas de drenagem já cavadas. Perto de Tessel: há mercado, há proteção, e há quem cobre por ela.',
    terreno: { agua: 2, solo: 3, madeira: 1, pedra: 1, caca: 1, pesca: 0, pasto: 3, defesa: 0, passagem: 2, perigo: 1, inverno: 2 },
    traco: 'trigo_do_marechal',
    tracoTexto: 'O trigo daqui é "do marechal": a Casa Tessel leva um quinto de toda colheita enquanto não houver acordo com ela — e, em troca, a ronda da marca passa por aqui.',
    reivindicadaPor: 'tessel',
    animais: { cavalo: 6, vaca: 8, ovelha: 10, porco: 6, galinha: 20 },
    recursosIniciais: { comida: 90, materiais: 40, ouro: 40 },
  },
  {
    id: 'colina_forcados',
    nome: 'Colina dos Forcados',
    regiao: 'Planalto de Corveira',
    bioma: 'montanha',
    descricao: 'Uma elevação pelada de onde se vê meio planalto, coroada por um círculo de estacas antigas. Pedra de sobra e quem subir para atacar sobe cansado.',
    terreno: { agua: 0, solo: 1, madeira: 0, pedra: 3, caca: 1, pesca: 0, pasto: 2, defesa: 3, passagem: 1, perigo: 2, inverno: 3 },
    traco: 'vista_do_planalto',
    tracoTexto: 'Do alto se vê meio planalto: qualquer ameaça que venha na direção da colônia é avistada dois dias antes do que seria.',
    reivindicadaPor: 'corveira',
    animais: { cabra: 12, ovelha: 8, mula: 4, cavalo: 2, porco: 2, galinha: 8 },
    recursosIniciais: { comida: 60, materiais: 90, ouro: 50 },
  },
  {
    id: 'clareira_pedras',
    nome: 'Clareira das Pedras',
    regiao: 'Bosque de Vintra',
    bioma: 'floresta',
    descricao: 'Um vazio redondo no meio da mata, com blocos de pedra lisa que a vegetação não invade. Madeira e caça ao alcance da mão, e ninguém para cobrar.',
    terreno: { agua: 2, solo: 1, madeira: 3, pedra: 2, caca: 3, pesca: 0, pasto: 1, defesa: 1, passagem: 0, perigo: 3, inverno: 2 },
    traco: 'circulo_de_pedras',
    tracoTexto: 'Nada que seja oni entra no círculo das pedras. Mas quem dorme dentro dele sonha, e o sono ruim custa um pouco de estabilidade toda semana enquanto não houver santuário.',
    animais: { porco: 12, galinha: 10, cabra: 4, vaca: 2 },
    recursosIniciais: { comida: 70, materiais: 80, ouro: 30 },
  },
  {
    id: 'farol_quebrado',
    nome: 'Farol Quebrado',
    regiao: 'Costa de Mareu',
    bioma: 'costa',
    descricao: 'Uma torre de pedra sem topo, num promontório batido de vento. O mar dá peixe todo dia, e os naufrágios lá embaixo dão o resto.',
    terreno: { agua: 1, solo: 1, madeira: 0, pedra: 2, caca: 0, pesca: 3, pasto: 1, defesa: 2, passagem: 1, perigo: 2, inverno: 1 },
    traco: 'farol_apagado',
    tracoTexto: 'Enquanto o farol estiver apagado, os navios quebram nas pedras e alguém recolhe a carga: a colônia ganha destroços de vez em quando, e a guilda de Mareu não gosta. Reacendê-lo (uma obra) acaba com os destroços e compra a paz com a guilda.',
    reivindicadaPor: 'mareu',
    animais: { galinha: 12, ovelha: 6, cabra: 6, porco: 4, vaca: 1, cavalo: 1 },
    recursosIniciais: { comida: 80, materiais: 50, ouro: 50 },
  },
  {
    id: 'ruina_areia',
    nome: 'Ruína de Areia',
    regiao: 'Ermo de Solgar',
    bioma: 'deserto',
    descricao: 'Colunas e um pedaço de parede saindo da areia, na rota das caravanas do ermo. Longe de todo mundo, e a areia guarda coisa.',
    terreno: { agua: 0, solo: 0, madeira: 0, pedra: 2, caca: 1, pesca: 0, pasto: 0, defesa: 1, passagem: 2, perigo: 3, inverno: 0 },
    traco: 'areia_que_devolve',
    tracoTexto: 'A cada tempestade a areia devolve alguma coisa — moeda antiga, ferro, às vezes um achado raro —, e engole outra: toda tempestade atrasa as obras em andamento.',
    animais: { cabra: 10, mula: 6, galinha: 6, ovelha: 2, cavalo: 2 },
    recursosIniciais: { comida: 50, materiais: 40, ouro: 90 },
  },
  {
    id: 'vau_pedra',
    nome: 'Vau de Pedra',
    regiao: 'Baixios de Halvern',
    bioma: 'planicie',
    descricao: 'Onde o rio se abre raso sobre um leito de laje, e toda carroça do sul espera a vez de atravessar. Água, pasto de várzea e uma fila de gente que paga para passar.',
    terreno: { agua: 3, solo: 2, madeira: 2, pedra: 2, caca: 2, pesca: 2, pasto: 3, defesa: 1, passagem: 3, perigo: 2, inverno: 1 },
    traco: 'a_travessia',
    tracoTexto: 'Quem controla o vau cobra a travessia: ouro todo dia, mais com mercado. Mas o rio sobe fora de época e leva o que estiver na margem, e todo bando do sul atravessa aqui.',
    animais: { vaca: 10, porco: 6, galinha: 14, cavalo: 4, ovelha: 4, mula: 2 },
    recursosIniciais: { comida: 80, materiais: 60, ouro: 40 },
  },
];

/** Assentamentos antigos (sessões 43-45) foram fundados num ponto que não era lugar do mapa. */
export const SITIO_POR_PONTO_ANTIGO: Record<string, string> = {
  halvet_colinas: 'campo_ceifa',
  solgar_oasis: 'ruina_areia',
  tessel_penhasco: 'colina_forcados',
  vintra_bosque: 'clareira_pedras',
  mareu_enseada: 'farol_quebrado',
  corveira_minas: 'colina_forcados',
};
