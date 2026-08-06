// ARCANUM · Geografia de Vaelhorn. Mapa fixo e autoral (GDD §7).
import type { Local } from '../../engine/types';
import type { Periodo } from '../../engine/time';

const P = (n: 0 | 1 | 2 | 3): Record<Periodo, 0 | 1 | 2 | 3> => ({
  madrugada: n,
  manha: n,
  tarde: n,
  entardecer: n,
  anoitecer: n,
  noite: n,
});

export const locaisVaelhorn: Local[] = [
  {
    id: 'taverna',
    nome: 'A Rês Enforcada',
    regiao: 'Vale de Halvet',
    tipo: 'taverna',
    descricaoBase:
      'Vigas baixas, fumaça parada e o cheiro de sebo. A taverna é o coração sujo da vila.',
    atmosferaPorPeriodo: {
      madrugada: 'A taverna range vazia; só as brasas ainda respiram na lareira.',
      manha: 'Cheiro de pão dormido e cerveja rala. Poucos, e caladas as bocas.',
      tarde: 'Mesas ocupadas por quem não tem para onde ir. O ruído engrossa.',
      entardecer: 'A casa enche. Vozes se sobrepõem, e alguém já ri alto demais.',
      anoitecer: 'Lotada, quente, perigosa do jeito bom e do jeito ruim.',
      noite: 'Restam os bêbados e os que negociam o que não se negocia de dia.',
    },
    privacidadeBase: { madrugada: 2, manha: 1, tarde: 0, entardecer: 0, anoitecer: 0, noite: 1 },
    perigo: 3,
    ganchos: [
      'Um edital novo no quadro, ainda com a cera fresca',
      'Um homem encapuzado bebe sozinho no canto',
    ],
    pontos: ['balcão', 'lareira', 'quarto de cima', 'porão'],
    rotas: [
      { destino: 'praca', periodos: 0, perigo: 1 },
      { destino: 'mercado', periodos: 0, perigo: 1 },
    ],
  },
  {
    id: 'praca',
    nome: 'Praça da Forca',
    regiao: 'Vale de Halvet',
    tipo: 'praca',
    descricaoBase:
      'A praça em torno do patíbulo velho. Lajes rachadas, um poço, e o silêncio de quem já viu demais aqui.',
    atmosferaPorPeriodo: {
      madrugada: 'Névoa rente ao chão. A forca é uma sombra mais escura no escuro.',
      manha: 'Vendedores ambulantes, uma guarda entediada, o sino distante.',
      tarde: 'Movimento seco. Todos passam, ninguém para.',
      entardecer: 'A luz baixa dá à forca um comprimento que ela não tem de dia.',
      anoitecer: 'Vazia. Só o vento e o ranger da corda.',
      noite: 'Ninguém de bem cruza a praça a esta hora.',
    },
    privacidadeBase: { madrugada: 2, manha: 0, tarde: 0, entardecer: 1, anoitecer: 2, noite: 3 },
    perigo: 2,
    ganchos: ['O poço tem uma marca de giz recente na borda', 'Cartazes de procurados descascam no muro'],
    pontos: ['poço', 'patíbulo', 'muro dos éditos'],
    rotas: [
      { destino: 'taverna', periodos: 0, perigo: 1 },
      { destino: 'mercado', periodos: 0, perigo: 1 },
      { destino: 'capela', periodos: 0, perigo: 1 },
      { destino: 'floresta', periodos: 1, perigo: 4 },
    ],
  },
  {
    id: 'mercado',
    nome: 'A Feira Coberta',
    regiao: 'Vale de Halvet',
    tipo: 'mercado',
    descricaoBase:
      'Toldos remendados sobre bancas de tudo e de nada. Aqui se compra o pão e se vende o silêncio.',
    atmosferaPorPeriodo: {
      manha: 'A feira acorda: pregões, galinhas, o cheiro de peixe e ferrugem.',
      tarde: 'Auge do movimento. Cotovelos, moedas trocando de mão, olhos atentos a bolsos.',
      entardecer: 'As bancas começam a recolher. Restam os preços de fim de dia.',
      anoitecer: 'Toldos vazios batendo ao vento. Um ou outro vulto recolhendo caixotes.',
      noite: 'Fechada. Só ratos e quem procura o que só se acha fechado.',
      madrugada: 'Escuro entre os toldos. Um bom lugar para não ser visto.',
    },
    privacidadeBase: { madrugada: 2, manha: 0, tarde: 0, entardecer: 1, anoitecer: 2, noite: 2 },
    perigo: 2,
    ganchos: ['Uma banca vende amuletos que o padre condenaria', 'O ferreiro discute alto com um cliente'],
    pontos: ['banca de ervas', 'ferraria', 'beco dos fundos'],
    rotas: [
      { destino: 'taverna', periodos: 0, perigo: 1 },
      { destino: 'praca', periodos: 0, perigo: 1 },
    ],
  },
  {
    id: 'capela',
    nome: 'Capela de São Vandro',
    regiao: 'Vale de Halvet',
    tipo: 'capela',
    descricaoBase:
      'Pedra fria e um Cristo de madeira gasto de tanto ser tocado. A fé aqui é mais medo que amor.',
    atmosferaPorPeriodo: {
      madrugada: 'Velas quase no fim. O padre reza sozinho, ou finge.',
      manha: 'Missa rala. Cabeças baixas, orações mecânicas.',
      tarde: 'Vazia e silenciosa. Só o gotejar em algum canto.',
      entardecer: 'A luz colorida das vidraças se arrasta pelo chão.',
      anoitecer: 'Trancada para os de fora. Aberta para os de dentro.',
      noite: 'Escura. A cripta lá embaixo respira frio.',
    },
    privacidadeBase: { madrugada: 2, manha: 0, tarde: 2, entardecer: 1, anoitecer: 3, noite: 3 },
    perigo: 1,
    ganchos: ['A porta da cripta está com o cadeado arranhado', 'Um exame recente foi feito no altar — cera derramada em círculo'],
    pontos: ['altar', 'confessionário', 'porta da cripta'],
    rotas: [
      { destino: 'praca', periodos: 0, perigo: 1 },
      { destino: 'cripta', periodos: 0, perigo: 3 },
    ],
  },
  {
    id: 'cripta',
    nome: 'A Cripta',
    regiao: 'Vale de Halvet',
    tipo: 'cripta',
    descricaoBase:
      'Sob a capela, fileiras de nichos e nomes apagados. O ar é denso, e algo aqui não descansa.',
    atmosferaPorPeriodo: {
      madrugada: 'Escuro absoluto, quebrado só pela tocha que você trouxe.',
      manha: 'A luz não desce até aqui. Nunca desceu.',
      tarde: 'Frio de pedra e o cheiro adocicado do que não deveria estar aqui.',
      entardecer: 'Um rangido fundo, como pedra sobre pedra, sem vento que explique.',
      anoitecer: 'A escuridão parece atenta.',
      noite: 'Aqui embaixo, a noite é a única estação.',
    },
    privacidadeBase: P(3),
    perigo: 6,
    ganchos: ['Um nicho foi aberto por dentro', 'Símbolos frescos rabiscados numa laje'],
    pontos: ['nicho profanado', 'laje central', 'poço seco'],
    rotas: [{ destino: 'capela', periodos: 0, perigo: 1 }],
  },
  {
    id: 'floresta',
    nome: 'A Mata de Corvos',
    regiao: 'Vale de Halvet',
    tipo: 'floresta',
    descricaoBase:
      'Árvores altas demais e caladas demais. A estrada some cedo, e depois é só você e o que a mata guarda.',
    atmosferaPorPeriodo: {
      madrugada: 'Névoa entre os troncos. Cada som parece vir de todo lado.',
      manha: 'A luz entra em lâminas. Corvos observam do alto.',
      tarde: 'Sombra verde e o cheiro de terra molhada e coisa morta.',
      entardecer: 'A mata escurece uma hora antes do resto do mundo.',
      anoitecer: 'Você não devia estar aqui a esta hora.',
      noite: 'Olhos entre as árvores, ou a sua imaginação. Difícil saber.',
    },
    privacidadeBase: P(3),
    perigo: 7,
    ganchos: ['Uma trilha pisada leva para longe da estrada', 'Restos de uma fogueira recente, ainda morna'],
    pontos: ['clareira', 'árvore dos enforcados', 'trilha oculta'],
    rotas: [{ destino: 'praca', periodos: 1, perigo: 4 }],
  },
];
