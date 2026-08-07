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
      'Uma mulher encapuzada bebe sozinha no canto',
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
      { destino: 'ponte', periodos: 0, perigo: 1 },
      { destino: 'cemiterio', periodos: 0, perigo: 2 },
      { destino: 'casa_senhorial', periodos: 0, perigo: 1 },
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
    ganchos: ['Uma banca vende amuletos que a madre condenaria', 'A ferreira discute alto com uma freguesa'],
    pontos: ['banca de ervas', 'ferraria', 'beco dos fundos'],
    rotas: [
      { destino: 'taverna', periodos: 0, perigo: 1 },
      { destino: 'praca', periodos: 0, perigo: 1 },
      { destino: 'moinho', periodos: 0, perigo: 1 },
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
      { destino: 'cemiterio', periodos: 0, perigo: 2 },
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
    rotas: [
      { destino: 'praca', periodos: 1, perigo: 4 },
      { destino: 'ruinas', periodos: 1, perigo: 6 },
      { destino: 'acampamento', periodos: 1, perigo: 5 },
      { destino: 'lago', periodos: 1, perigo: 3 },
    ],
  },

  // ─────────────────────────── A PONTE (o evento que ancora o calendário)
  {
    id: 'ponte',
    nome: 'A Ponte Caída',
    regiao: 'Vale de Halvet',
    tipo: 'ruina',
    descricaoBase:
      'Dois cotos de pedra de cada lado do rio e, no meio, nada. O que uniu o vale por trezentos anos agora é entulho na água.',
    atmosferaPorPeriodo: {
      madrugada: 'A neblina sobe do rio e engole os cotos. Só se ouve a água passando por onde havia arco.',
      manha: 'Homens medem a ruína com cordas e desistem antes do meio-dia. Ninguém sabe por onde começar.',
      tarde: 'Crianças atiram pedras no vão. Os pais as puxam pelo braço sem explicar por quê.',
      entardecer: 'A luz baixa mostra o que a pressa esconde: as pedras não caíram — foram derrubadas.',
      anoitecer: 'O vau improvisado rio abaixo cobra pedágio. Aqui não passa mais ninguém.',
      noite: 'A água conversa sozinha entre os escombros.',
    },
    privacidadeBase: { madrugada: 3, manha: 1, tarde: 0, entardecer: 1, anoitecer: 2, noite: 3 },
    perigo: 3,
    ganchos: [
      'As marcas de ferramenta nas pedras não combinam com um desabamento',
      'Um saco encharcado preso entre as vigas submersas',
    ],
    pontos: ['coto norte', 'entulho na água', 'vau improvisado'],
    rotas: [
      { destino: 'praca', periodos: 0, perigo: 1 },
      { destino: 'estrada', periodos: 1, perigo: 3 },
      { destino: 'moinho', periodos: 0, perigo: 2 },
    ],
  },

  // ─────────────────────────── MOINHO
  {
    id: 'moinho',
    nome: 'O Moinho Parado',
    regiao: 'Vale de Halvet',
    tipo: 'oficina',
    descricaoBase:
      'A roda parou quando o rio mudou de humor. Dentro, farinha velha cobre tudo como uma neve suja e antiga.',
    atmosferaPorPeriodo: {
      madrugada: 'O maquinário estala sozinho, dilatando no frio. Parece que alguém anda lá em cima.',
      manha: 'Poeira de farinha suspensa na luz. O moleiro varre o que não adianta varrer.',
      tarde: 'Quente, abafado, cheirando a grão fermentado.',
      entardecer: 'Sombras compridas entre as engrenagens paradas.',
      anoitecer: 'Trancado por fora — o que não impede quem já está dentro.',
      noite: 'Um bom lugar para guardar o que não pode ser guardado em casa.',
    },
    privacidadeBase: { madrugada: 3, manha: 1, tarde: 1, entardecer: 2, anoitecer: 3, noite: 3 },
    perigo: 3,
    ganchos: [
      'Pegadas frescas na farinha, subindo a escada',
      'Um alçapão sob os sacos empilhados',
    ],
    pontos: ['roda d’água', 'sótão', 'alçapão', 'mó'],
    rotas: [
      { destino: 'ponte', periodos: 0, perigo: 2 },
      { destino: 'mercado', periodos: 0, perigo: 1 },
      { destino: 'lago', periodos: 1, perigo: 3 },
    ],
  },

  // ─────────────────────────── CEMITÉRIO
  {
    id: 'cemiterio',
    nome: 'O Campo de Pedras',
    regiao: 'Vale de Halvet',
    tipo: 'cemiterio',
    descricaoBase:
      'Lápides tortas numa encosta que escorrega devagar. Enterram fundo aqui, e mesmo assim algumas covas amanhecem rasas.',
    atmosferaPorPeriodo: {
      madrugada: 'Terra revolvida em pelo menos três covas. O orvalho não assentou por cima.',
      manha: 'O coveiro trabalha de costas para o portão, como quem não quer ser abordado.',
      tarde: 'Vento constante. As flores secas rolam entre as pedras.',
      entardecer: 'As sombras das lápides se alongam morro abaixo, todas na mesma direção.',
      anoitecer: 'O portão range mesmo sem vento.',
      noite: 'Aqui, à noite, você entende por que a madre benze o caminho de volta.',
    },
    privacidadeBase: { madrugada: 3, manha: 1, tarde: 2, entardecer: 2, anoitecer: 3, noite: 3 },
    perigo: 5,
    ganchos: [
      'Três covas recentes sem nome na pedra',
      'A pá da coveira largada no meio do caminho, ainda com terra fresca',
    ],
    pontos: ['portão de ferro', 'cova aberta', 'casa da coveira', 'ossário'],
    rotas: [
      { destino: 'capela', periodos: 0, perigo: 2 },
      { destino: 'praca', periodos: 0, perigo: 1 },
    ],
  },

  // ─────────────────────────── RUÍNAS DE MIR
  {
    id: 'ruinas',
    nome: 'As Ruínas de Mir',
    regiao: 'Fora do Vale',
    tipo: 'ruina',
    descricaoBase:
      'Uma vila que virou carvão numa noite só, faz vinte anos. As paredes que sobraram continuam pretas — a chuva não lava aquilo.',
    atmosferaPorPeriodo: {
      madrugada: 'Nada canta aqui. Nem grilo, nem coruja.',
      manha: 'A luz mostra o que deveria ficar escondido: contornos de gente no chão de algumas casas.',
      tarde: 'O cheiro de queimado ainda está na pedra, vinte anos depois.',
      entardecer: 'As sombras enchem os vãos das janelas como se alguém morasse neles.',
      anoitecer: 'Você jura ter visto uma luz na antiga capela. Jura menos a cada minuto.',
      noite: 'Aqui a noite é mais escura que nos outros lugares. Não é impressão.',
    },
    privacidadeBase: P(3),
    perigo: 8,
    ganchos: [
      'Uma casa não queimou — a única com a porta trancada por dentro',
      'Marcas de giz recentes numa parede antiga',
    ],
    pontos: ['capela queimada', 'casa intacta', 'poço entupido', 'praça de cinzas'],
    rotas: [
      { destino: 'floresta', periodos: 1, perigo: 6 },
      { destino: 'mina', periodos: 1, perigo: 7 },
    ],
  },

  // ─────────────────────────── ESTRADA
  {
    id: 'estrada',
    nome: 'A Estrada do Sal',
    regiao: 'Fora do Vale',
    tipo: 'estrada',
    descricaoBase:
      'A via velha que ligava o vale ao litoral. Desde que a ponte caiu, só passam os desesperados e os que lucram com eles.',
    atmosferaPorPeriodo: {
      madrugada: 'Vazia e fria. Cada curva parece guardar alguém.',
      manha: 'Uma carroça ou outra, a carreteira olhando para trás mais do que para frente.',
      tarde: 'Poeira, calor e o cheiro de esterco secando.',
      entardecer: 'A hora em que os salteadores gostam: luz baixa e viajante cansado.',
      anoitecer: 'Ninguém viaja a esta hora por escolha.',
      noite: 'Só as tochas de quem não podia esperar o amanhecer.',
    },
    privacidadeBase: { madrugada: 3, manha: 1, tarde: 1, entardecer: 2, anoitecer: 3, noite: 3 },
    perigo: 5,
    ganchos: [
      'Uma carroça tombada, a carga intacta — o que é pior que a carga roubada',
      'Um marco de pedra com o nome do próximo povoado raspado',
    ],
    pontos: ['marco de pedra', 'curva cega', 'carroça tombada'],
    rotas: [
      { destino: 'ponte', periodos: 1, perigo: 3 },
      { destino: 'torre', periodos: 1, perigo: 4 },
      { destino: 'acampamento', periodos: 1, perigo: 5 },
    ],
  },

  // ─────────────────────────── CASA SENHORIAL
  {
    id: 'casa_senhorial',
    nome: 'A Casa de Pedra',
    regiao: 'Vale de Halvet',
    tipo: 'mansao',
    descricaoBase:
      'A única casa de dois andares do vale. O senhor de Halvet não sai dela há meses, e as janelas de cima ficam sempre fechadas.',
    atmosferaPorPeriodo: {
      madrugada: 'Uma vela acesa na janela do segundo andar. Sempre a mesma janela.',
      manha: 'Criados entram e saem pela porta de serviço, de cabeça baixa.',
      tarde: 'O portão da frente permanece fechado. Ninguém bate.',
      entardecer: 'Cheiro de comida boa escapando pela chaminé — comida demais para as duas que moram aqui.',
      anoitecer: 'Vozes lá dentro. Mais de uma. Todas baixas.',
      noite: 'A casa dorme, menos aquela janela.',
    },
    privacidadeBase: { madrugada: 2, manha: 0, tarde: 1, entardecer: 1, anoitecer: 2, noite: 2 },
    perigo: 4,
    ganchos: [
      'A porta de serviço fica destrancada entre uma entrega e outra',
      'O jardim dos fundos foi revirado recentemente, e replantado às pressas',
    ],
    pontos: ['portão da frente', 'porta de serviço', 'jardim dos fundos', 'janela acesa'],
    rotas: [
      { destino: 'praca', periodos: 0, perigo: 1 },
      { destino: 'cemiterio', periodos: 0, perigo: 2 },
    ],
  },

  // ─────────────────────────── MINA
  {
    id: 'mina',
    nome: 'A Mina de Ferro',
    regiao: 'Fora do Vale',
    tipo: 'mina',
    descricaoBase:
      'Abandonada quando o veio secou — ou quando os mineiros pararam de subir. As duas versões circulam.',
    atmosferaPorPeriodo: {
      madrugada: 'A boca da mina exala ar morno. Lá dentro é sempre a mesma hora.',
      manha: 'Vigas podres sustentando pedra que não perdoa.',
      tarde: 'Gotejar constante. E, mais fundo, um som que não é goteira.',
      entardecer: 'A luz do dia morre três passos depois da entrada.',
      anoitecer: 'Algo se move onde a tocha não alcança.',
      noite: 'Dentro da mina, noite e dia são a mesma coisa. O que muda é o que está acordado.',
    },
    privacidadeBase: P(3),
    perigo: 8,
    ganchos: [
      'Ferramentas largadas no meio do trabalho, como se todos saíssem no mesmo instante',
      'Um túnel mais novo que os outros, escavado de dentro para fora',
    ],
    pontos: ['boca da mina', 'galeria principal', 'poço inundado', 'túnel novo'],
    rotas: [{ destino: 'ruinas', periodos: 1, perigo: 7 }],
  },

  // ─────────────────────────── TORRE DO VIGIA
  {
    id: 'torre',
    nome: 'A Torre do Vigia',
    regiao: 'Fora do Vale',
    tipo: 'torre',
    descricaoBase:
      'Uma torre de fronteira que a coroa esqueceu de pagar. Uma vigia ainda sobe todo dia, por hábito, e acende o farol que ninguém vê.',
    atmosferaPorPeriodo: {
      madrugada: 'O farol arde no alto. Contra o quê, já ninguém lembra.',
      manha: 'Do topo se enxerga o vale inteiro — e a ponte, ou o que sobrou dela.',
      tarde: 'Vento forte. A pedra range como madeira.',
      entardecer: 'A melhor vista de Vaelhorn, e ninguém para ver com você.',
      anoitecer: 'O vigia acende o farol às cegas, do mesmo jeito, há vinte anos.',
      noite: 'A luz gira. O escuro em volta é maior do que devia ser.',
    },
    privacidadeBase: { madrugada: 3, manha: 2, tarde: 2, entardecer: 2, anoitecer: 3, noite: 3 },
    perigo: 4,
    ganchos: [
      'Um registro de sinais luminosos com uma entrada na noite em que Mir queimou',
      'A escada do último lance foi serrada e reposta',
    ],
    pontos: ['topo do farol', 'quarto da vigia', 'arquivo de sinais'],
    rotas: [{ destino: 'estrada', periodos: 1, perigo: 4 }],
  },

  // ─────────────────────────── LAGO
  {
    id: 'lago',
    nome: 'O Espelho de Halvet',
    regiao: 'Vale de Halvet',
    tipo: 'lago',
    descricaoBase:
      'Água parada demais para um lago alimentado por rio. Os pescadores vêm cedo, pescam pouco e vão embora antes do meio-dia.',
    atmosferaPorPeriodo: {
      madrugada: 'Névoa rasteira sobre a água. O silêncio tem textura.',
      manha: 'Dois ou três barcos, distantes uns dos outros de propósito.',
      tarde: 'A superfície devolve o céu inteiro sem uma ruga.',
      entardecer: 'A água fica cor de cobre e você vê o fundo onde não deveria haver fundo.',
      anoitecer: 'Nenhum pescador fica depois que a luz vai.',
      noite: 'Algo grande se move sob a superfície, sem quebrá-la.',
    },
    privacidadeBase: { madrugada: 3, manha: 1, tarde: 1, entardecer: 2, anoitecer: 3, noite: 3 },
    perigo: 5,
    ganchos: [
      'Uma rede rasgada de baixo para cima, presa num tronco',
      'Oferendas recentes na margem: pão, sal e um dente',
    ],
    pontos: ['margem de pedras', 'píer podre', 'ilhota', 'juncal'],
    rotas: [
      { destino: 'moinho', periodos: 1, perigo: 3 },
      { destino: 'floresta', periodos: 1, perigo: 4 },
    ],
  },

  // ─────────────────────────── ACAMPAMENTO
  {
    id: 'acampamento',
    nome: 'O Acampamento dos Sem-Nome',
    regiao: 'Fora do Vale',
    tipo: 'acampamento',
    descricaoBase:
      'Lonas remendadas entre as árvores, longe de qualquer estrada. Quem vive aqui não quer ser encontrado, e recebe visita com a mão perto do cinto.',
    atmosferaPorPeriodo: {
      madrugada: 'Uma sentinela cochilando e uma fogueira em brasa.',
      manha: 'Panelas, tosse, uma discussão sobre a divisão de alguma coisa.',
      tarde: 'Vazio — todos foram trabalhar no que fazem, e ninguém pergunta o quê.',
      entardecer: 'Voltam em duplas, carregando o que não compraram.',
      anoitecer: 'A fogueira grande. Aqui se decide quem fica e quem some.',
      noite: 'Riso alto e depois silêncio abrupto. Alguém sempre está de vigia.',
    },
    privacidadeBase: { madrugada: 2, manha: 1, tarde: 3, entardecer: 1, anoitecer: 0, noite: 1 },
    perigo: 6,
    ganchos: [
      'Uma pilha de mercadoria com o selo da casa senhorial ainda intacto',
      'Alguém amarrado numa árvore, nos fundos, e ninguém comenta',
    ],
    pontos: ['fogueira grande', 'lona do chefe', 'depósito', 'árvore dos fundos'],
    rotas: [
      { destino: 'floresta', periodos: 1, perigo: 5 },
      { destino: 'estrada', periodos: 1, perigo: 5 },
    ],
  },
];
