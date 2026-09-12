// ARCANUM · O continente de Halvern.
//
// O Vale de Halvet era o mundo inteiro: dezenove lugares, cinco deles com vida
// econômica. Isso servia para uma fatia vertical, não para uma campanha de
// décadas — e obrigava o simulador a rodar as mesmas quatro estradas por dez
// anos de calendário.
//
// Aqui o vale vira uma província de um continente. Cinco regiões novas, cada
// uma com sua economia, sua gente e sua razão de existir:
//
//   Marca de Tessel     — fronteira militar ao norte. Fortes, leva, guerra.
//   Planalto de Corveira— minério e nobreza velha a leste.
//   Costa de Mareu      — porto, sal e comércio ao sul.
//   Bosque de Vintra    — mata funda a oeste, gente isolada.
//   Ermo de Solgar      — o fim do mapa. Água contada, caravanas.
//
// Cada lugar carrega `historia`: o que aconteceu ali antes de o jogador chegar.
// Não é enfeite — vai para o pacote do narrador, que passa a poder citar o
// passado de um lugar em vez de inventar um.
import type { Local } from '../../engine/types';
import type { Periodo } from '../../engine/time';

type Def = {
  id: string;
  nome: string;
  regiao: string;
  tipo: string;
  perigo: number;
  descricao: string;
  /** Atmosfera em três tempos: dia, entardecer e noite. */
  atmosfera: [string, string, string];
  /** Privacidade de dia e de noite. */
  privacidade: [0 | 1 | 2 | 3, 0 | 1 | 2 | 3];
  ganchos: string[];
  pontos: string[];
  /** O que aconteceu aqui antes de você chegar. */
  historia: string[];
};

function expandir(d: Def): Local {
  const [dia, entre, noite] = d.atmosfera;
  const [pd, pn] = d.privacidade;
  const atmosferaPorPeriodo: Partial<Record<Periodo, string>> = {
    madrugada: noite, manha: dia, tarde: dia, entardecer: entre, anoitecer: entre, noite,
  };
  return {
    id: d.id, nome: d.nome, regiao: d.regiao, tipo: d.tipo,
    descricaoBase: d.descricao,
    atmosferaPorPeriodo,
    privacidadeBase: { madrugada: pn, manha: pd, tarde: pd, entardecer: pd, anoitecer: pn, noite: pn },
    perigo: d.perigo,
    ganchos: d.ganchos,
    pontos: d.pontos,
    historia: d.historia,
    rotas: [],
  };
}

// ── Marca de Tessel ───────────────────────────────────────────────────────
const TESSEL: Def[] = [
  {
    id: 'tessel', nome: 'Tessel', regiao: 'Marca de Tessel', tipo: 'cidade', perigo: 2,
    descricao: 'Cidade murada de pedra cinzenta, erguida para segurar uma fronteira que já mudou de lugar três vezes. As ruas sobem em degraus até a casa do marechal.',
    atmosfera: [
      'Carroças de suprimento entopem a rua principal. Recrutas marcham mal e alguém grita a cadência.',
      'Os sinos dobram o recolher e os portões começam a fechar por dentro.',
      'Ronda dobrada nas muralhas. Quem anda a esta hora leva salvo-conduto ou apanha.',
    ],
    privacidade: [0, 1],
    ganchos: ['Lista de leva nova pregada no portão, com nomes riscados', 'Um sargento vende dispensa por baixo do pano'],
    pontos: ['portão do sul', 'praça de armas', 'casa do marechal', 'quartel velho'],
    historia: [
      'Tessel foi fundada como acampamento de inverno e nunca deixou de ser um: metade das casas ainda tem planta de barraca.',
      'O cerco de dezoito anos atrás durou quarenta dias. A muralha oeste é mais nova que o resto porque a antiga veio abaixo.',
      'O marechal atual herdou o posto do pai, que herdou do dele. Ninguém em Tessel lembra de eleição para nada.',
    ],
  },
  {
    id: 'forte_agulha', nome: 'Forte Agulha', regiao: 'Marca de Tessel', tipo: 'forte', perigo: 5,
    descricao: 'Uma torre quadrada e um muro baixo num esporão de rocha. Guarda o único ponto onde a estrada do norte não tem como desviar.',
    atmosfera: [
      'Vinte homens para um posto de cem. Fazem o que dá e fingem que basta.',
      'A luz raspa o muro e mostra cada falha na argamassa.',
      'Fogueira no pátio, sentinela única, e o barulho do vento no vão da agulha.',
    ],
    privacidade: [1, 2],
    ganchos: ['O poço do forte secou há duas semanas e ninguém reportou', 'Há mais cavalos na cocheira do que homens na muralha'],
    pontos: ['muro norte', 'pátio', 'cocheira', 'poço seco'],
    historia: [
      'O forte nunca caiu por assalto. Caiu duas vezes por fome, e nas duas foi devolvido no tratado seguinte.',
      'A guarnição é feita de condenados que trocaram forca por serviço. Deserção aqui não é vergonha, é aritmética.',
    ],
  },
  {
    id: 'vila_pedravel', nome: 'Pedravel', regiao: 'Marca de Tessel', tipo: 'vila', perigo: 3,
    descricao: 'Casas de pedra seca em volta de um pátio comum, com um celeiro alto demais para o tamanho do lugar.',
    atmosfera: [
      'Mulheres debulham no pátio. Os homens que sobraram estão no campo ou na leva.',
      'A luz baixa e o celeiro projeta sombra sobre a vila inteira.',
      'Portas fechadas cedo. Cachorro late para o lado da estrada e ninguém vai ver.',
    ],
    privacidade: [1, 2],
    ganchos: ['O celeiro está cheio e a vila come pouco', 'Três rapazes não voltaram da última leva e a lista diz que voltaram'],
    pontos: ['celeiro', 'pátio comum', 'forno coletivo'],
    historia: [
      'Pedravel comprou isenção de leva por quatro anos pagando em grão. No quinto ano o preço subiu e a vila não tinha.',
      'O celeiro foi erguido com pedra do forte, levada de noite, peça por peça. Todo mundo sabe e ninguém diz.',
    ],
  },
  {
    id: 'campo_ceifa', nome: 'Campos da Ceifa', regiao: 'Marca de Tessel', tipo: 'campo', perigo: 4,
    descricao: 'Terra boa e plana até onde a vista alcança, cortada por valas de drenagem e marcos de pedra que ninguém respeita mais.',
    atmosfera: [
      'Ceifeiros curvados em fila. O trigo aqui é do marechal, e todos sabem qual parte fica.',
      'O sol deita sobre a palha e o campo inteiro fica cor de ferrugem.',
      'Campo aberto sem lua é o pior lugar do mundo para estar sozinho.',
    ],
    privacidade: [2, 3],
    ganchos: ['Uma vala foi aberta e não é de drenagem', 'Marcos de pedra deslocados durante a noite'],
    pontos: ['valas', 'palheiros', 'marcos de pedra'],
    historia: [
      'Estes campos alimentaram os dois lados da última guerra. Nenhum exército os queimou — precisavam deles.',
      'Cada marco de pedra é uma sentença antiga sobre quem colhe o quê. Metade dos processos da marca é sobre eles.',
    ],
  },
  {
    id: 'passo_lobo', nome: 'Passo do Lobo', regiao: 'Marca de Tessel', tipo: 'passo', perigo: 7,
    descricao: 'Uma garganta estreita entre paredes de rocha, com vento constante e sem um palmo de abrigo por meia légua.',
    atmosfera: [
      'O vento não para nunca. Falar aqui exige gritar.',
      'A garganta escurece cedo: o sol some atrás da parede muito antes de se pôr.',
      'Escuro total e eco. Um passo solto lá em cima soa como uma avalanche.',
    ],
    privacidade: [2, 3],
    ganchos: ['Ossos de montaria no acostamento, limpos demais', 'Alguém empilhou pedras num monte que não é marco'],
    pontos: ['garganta', 'monte de pedras', 'saliência alta'],
    historia: [
      'O passo tem o nome do que come quem tenta atravessá-lo de noite, e não é figura de linguagem.',
      'Dois exércitos já se recusaram a cruzá-lo em campanha. Preferiram o rodeio de nove dias.',
    ],
  },
];

// ── Planalto de Corveira ──────────────────────────────────────────────────
const CORVEIRA: Def[] = [
  {
    id: 'corveira', nome: 'Corveira', regiao: 'Planalto de Corveira', tipo: 'cidade', perigo: 2,
    descricao: 'Construída sobre a própria mina, em terraços que descem o flanco do planalto. O ar tem gosto de metal e o chão treme de leve quando os martelos batem lá embaixo.',
    atmosfera: [
      'Turnos trocam ao meio-dia. Duas multidões se cruzam na escadaria, uma subindo suja, outra descendo limpa.',
      'Fumo das fundições assenta sobre os terraços e a cidade fica cor de bronze.',
      'Só as fornalhas ficam acesas. O resto da cidade dorme cedo porque acorda cedo.',
    ],
    privacidade: [0, 1],
    ganchos: ['Um veio novo foi encontrado e a casa dona não anunciou', 'Fundição parada há três dias sem explicação'],
    pontos: ['escadaria', 'fundição alta', 'casa das balanças', 'boca da mina'],
    historia: [
      'Corveira pertence a sete famílias desde antes de haver registro. Elas se chamam de casas e se comportam como reinos.',
      'O desabamento do terraço quarto matou duzentos e onze. As casas pagaram indenização em minério, não em moeda.',
      'A cidade nunca teve muralha. A defesa dela sempre foi ser indispensável para quem quisesse atacá-la.',
    ],
  },
  {
    id: 'aldeia_ferro', nome: 'Ferro Velho', regiao: 'Planalto de Corveira', tipo: 'aldeia', perigo: 3,
    descricao: 'Uma dúzia de casas em volta de uma forja comunal, onde vai parar tudo o que Corveira descarta.',
    atmosfera: [
      'Marteladas o dia inteiro. Aqui se conserta o que a cidade jogou fora.',
      'A forja esfria e as crianças aparecem para catar o que caiu.',
      'Brasa coberta, portas encostadas, e o cheiro de metal que não sai da roupa.',
    ],
    privacidade: [1, 2],
    ganchos: ['Uma peça de arma boa demais apareceu no monte de refugo', 'O ferreiro não aceita encomenda de fora há um mês'],
    pontos: ['forja comunal', 'monte de refugo', 'poço'],
    historia: [
      'Ferro Velho nasceu do lixo de Corveira e virou o único lugar do planalto onde um pobre consegue uma lâmina que presta.',
      'As casas de Corveira toleram a aldeia porque ela devolve metal recuperado a preço de nada.',
    ],
  },
  {
    id: 'colina_forcados', nome: 'Colina dos Forcados', regiao: 'Planalto de Corveira', tipo: 'colina', perigo: 5,
    descricao: 'Uma elevação pelada de onde se vê meio planalto, coroada por estacas de madeira antigas plantadas em círculo.',
    atmosfera: [
      'Do alto dá para ver as fumaças de Corveira e, em dia limpo, a linha do mar.',
      'As estacas fazem sombras longas e regulares, como uma cerca de dentes.',
      'Vento e mais nada. As estacas rangem sem que ninguém as toque.',
    ],
    privacidade: [2, 3],
    ganchos: ['Uma estaca foi trocada por outra nova, recentemente', 'Há oferendas frescas ao pé do círculo'],
    pontos: ['círculo de estacas', 'topo', 'trilha de descida'],
    historia: [
      'A colina foi tribunal e forca das casas de Corveira por trezentos anos. Cada estaca marca uma execução.',
      'Depois que a prática acabou, a gente do planalto continuou subindo aqui — agora para pedir, não para assistir.',
    ],
  },
  {
    id: 'mosteiro_alto', nome: 'Mosteiro do Alto', regiao: 'Planalto de Corveira', tipo: 'capela', perigo: 2,
    descricao: 'Pedra nua, corredores frios e uma biblioteca que é grande demais para o número de irmãos que sobrou.',
    atmosfera: [
      'Silêncio de regra. Passos e páginas, e nada mais.',
      'A luz entra baixa pelas frestas altas e corta o corredor em faixas.',
      'Vigília na capela. Uma voz só, repetindo, madrugada adentro.',
    ],
    privacidade: [2, 3],
    ganchos: ['Um irmão copia o mesmo texto há semanas e queima cada cópia', 'A ala leste está trancada e a chave sumiu'],
    pontos: ['biblioteca', 'claustro', 'ala leste trancada', 'sino'],
    historia: [
      'O mosteiro guarda os registros das casas de Corveira desde antes de as casas existirem com esse nome.',
      'Duas vezes na história alguém tentou levar a biblioteca. Nas duas, os irmãos queimaram a ala antes de entregar.',
    ],
  },
];

// ── Costa de Mareu ────────────────────────────────────────────────────────
const MAREU: Def[] = [
  {
    id: 'mareu', nome: 'Mareu', regiao: 'Costa de Mareu', tipo: 'cidade', perigo: 3,
    descricao: 'A cidade cresceu do cais para dentro e nunca parou. Ruas estreitas, sacadas que quase se tocam, e tudo cheirando a maresia e peixe salgado.',
    atmosfera: [
      'Grito de leilão no cais, carga descendo, e três línguas diferentes na mesma esquina.',
      'A frota volta com a maré e a cidade inteira se vira para o mar.',
      'As tavernas do porto enchem e o resto da cidade tranca as janelas.',
    ],
    privacidade: [0, 1],
    ganchos: ['Um navio ancorado há seis dias sem descarregar nada', 'A guilda do sal fechou o preço e ninguém sabe por ordem de quem'],
    pontos: ['cais grande', 'casa da guilda', 'beco dos cordoeiros', 'alfândega'],
    historia: [
      'Mareu foi três vilas de pescadores que brigaram por duzentos anos até descobrirem que juntas cobravam mais caro.',
      'A guilda do sal manda mais na cidade do que qualquer título. O conselho se reúne na casa dela, não no palácio.',
      'A peste que veio pelo porto há quarenta anos levou um terço da cidade. Desde então todo navio fica de quarentena — em teoria.',
    ],
  },
  {
    id: 'porto_sal', nome: 'Porto do Sal', regiao: 'Costa de Mareu', tipo: 'porto', perigo: 4,
    descricao: 'Salinas retangulares até o horizonte, com montes brancos cobertos de palha e um ancoradouro de tábua para barcaças rasas.',
    atmosfera: [
      'Homens de pele queimada raspando o fundo das salinas. A luz refletida cega.',
      'Os montes de sal ficam rosados e a água das salinas vira espelho.',
      'Ninguém trabalha à noite. As barcaças ficam amarradas e o lugar fica branco no escuro.',
    ],
    privacidade: [1, 3],
    ganchos: ['Uma barcaça carrega de madrugada e não passa pela alfândega', 'Um tanque foi contaminado de propósito'],
    pontos: ['salinas', 'montes cobertos', 'ancoradouro de tábua'],
    historia: [
      'O sal daqui pagou a muralha de Tessel, a fundição alta de Corveira e metade das dívidas do Vale.',
      'Trabalhar nas salinas foi pena de degredo por gerações. Hoje é emprego, mas o nome das famílias ainda pesa.',
    ],
  },
  {
    id: 'aldeia_rede', nome: 'Rede Rota', regiao: 'Costa de Mareu', tipo: 'aldeia', perigo: 3,
    descricao: 'Casas sobre estacas numa enseada rasa, ligadas por passarelas que sobem e descem com a maré.',
    atmosfera: [
      'Redes estendidas em toda superfície plana. Cheiro forte e constante.',
      'Os barcos voltam e a aldeia inteira desce para a praia ajudar a puxar.',
      'A maré sobe por baixo das casas e o lugar range a noite toda.',
    ],
    privacidade: [1, 2],
    ganchos: ['Um barco voltou vazio e a tripulação não fala', 'Alguém pesca à noite no ponto proibido'],
    pontos: ['passarelas', 'praia de puxar', 'casa das redes'],
    historia: [
      'Rede Rota se recusa a pagar a taxa da guilda de Mareu desde sempre. A guilda cobra, a aldeia não paga, e assim seguem.',
      'A enseada tem um ponto que ninguém pesca. Os velhos dizem o motivo baixo e não repetem.',
    ],
  },
  {
    id: 'farol_quebrado', nome: 'Farol Quebrado', regiao: 'Costa de Mareu', tipo: 'torre', perigo: 6,
    descricao: 'Uma torre de pedra com o topo desabado, num promontório batido por vento e maresia. A escada interna ainda sobe, até certo ponto.',
    atmosfera: [
      'Gaivotas ocupam o topo aberto. Dá para ver a costa inteira daqui.',
      'O sol entra pela ruína do topo e desenha o círculo onde ficava a fogueira.',
      'Sem luz, o promontório inteiro é uma armadilha. Os naufrágios ali embaixo são todos recentes.',
    ],
    privacidade: [2, 3],
    ganchos: ['Alguém acendeu fogo lá em cima na semana passada', 'Há corda nova amarrada na escada quebrada'],
    pontos: ['escada interna', 'topo aberto', 'base do promontório'],
    historia: [
      'O farol caiu num temporal e Mareu decidiu que sairia mais barato pagar os naufrágios do que reconstruí-lo.',
      'Houve anos em que uma luz falsa foi acesa ali de propósito, para atrair navio até a pedra. Nunca se provou quem.',
    ],
  },
];

// ── Bosque de Vintra ──────────────────────────────────────────────────────
const VINTRA: Def[] = [
  {
    id: 'vintra', nome: 'Vintra', regiao: 'Bosque de Vintra', tipo: 'vila', perigo: 4,
    descricao: 'A última vila antes da mata fechar de vez. Casas de madeira escura, telhados íngremes, e uma paliçada que já foi mais alta.',
    atmosfera: [
      'Lenhadores saindo em grupo, sempre em grupo. Ninguém entra na mata sozinho.',
      'A paliçada é fechada bem antes do sol sumir atrás das árvores.',
      'Tocha em cada canto da paliçada e alguém acordado a noite inteira, por turno.',
    ],
    privacidade: [1, 2],
    ganchos: ['A paliçada tem uma tábua nova no lado que dá para a mata', 'Um grupo de lenhadores voltou com um a menos e conta duas versões'],
    pontos: ['paliçada', 'casa da assembleia', 'pátio da madeira'],
    historia: [
      'Vintra queimou por completo duas vezes e foi reconstruída no mesmo lugar nas duas. Ninguém explica por que não mudaram.',
      'A vila não tem senhor. Decide em assembleia, e a assembleia é obrigatória — faltar é multa.',
    ],
  },
  {
    id: 'aldeia_carvoeira', nome: 'Carvoeira', regiao: 'Bosque de Vintra', tipo: 'aldeia', perigo: 5,
    descricao: 'Meia dúzia de barracos entre fornos de carvão que fumegam sem parar. O chão é preto e o ar arde nos olhos.',
    atmosfera: [
      'Fumaça baixa e constante. A gente daqui tosse ao falar e não repara mais.',
      'Os fornos brilham por dentro quando a luz cai, como se a terra tivesse buracos acesos.',
      'Vigília nos fornos. Deixar apagar custa uma fornada inteira.',
    ],
    privacidade: [2, 3],
    ganchos: ['Um forno foi aberto antes da hora e estava vazio', 'Alguém acampou perto e apagou a fogueira às pressas'],
    pontos: ['fornos', 'pilha de toras', 'barraco do mestre'],
    historia: [
      'Carvoeira abastece a fundição de Corveira e a forja do Vale. Sem ela, os dois param em uma estação.',
      'A aldeia é o ponto mais fundo da mata onde ainda chega estrada. Depois daqui é trilha, e trilha some.',
    ],
  },
  {
    id: 'clareira_pedras', nome: 'Clareira das Pedras', regiao: 'Bosque de Vintra', tipo: 'ruina', perigo: 7,
    descricao: 'Um vazio redondo no meio da mata fechada, com blocos de pedra lisa meio enterrados dispostos num padrão que a vegetação não invade.',
    atmosfera: [
      'A clareira é silenciosa de um jeito errado: a mata em volta faz barulho, aqui dentro não.',
      'A luz cai reta no círculo e as pedras não fazem sombra na direção certa.',
      'Escuro fechado, e ainda assim dá para ver os blocos. Ninguém sabe explicar por quê.',
    ],
    privacidade: [3, 3],
    ganchos: ['Uma pedra foi movida e o padrão mudou', 'Há pegadas que entram na clareira e não saem'],
    pontos: ['círculo de blocos', 'pedra central', 'borda da mata'],
    historia: [
      'A gente de Vintra sabe chegar à clareira e evita. Não há proibição nem história oficial — é só uma coisa que não se faz.',
      'Os blocos são anteriores a qualquer registro da região. Quem os cortou usava ferramenta que ninguém tem hoje.',
    ],
  },
  {
    id: 'pantano_lodo', nome: 'Lodaçal de Vintra', regiao: 'Bosque de Vintra', tipo: 'pantano', perigo: 8,
    descricao: 'Água parada até o joelho, raízes que emergem como costelas e um chão que decide sozinho se aguenta o passo.',
    atmosfera: [
      'Mosquito, mau cheiro e a sensação constante de estar sendo observado por baixo.',
      'A luz baixa e a água fica preta. Não dá para saber o que é raiz e o que não é.',
      'Fogo-fátuo à distância, sempre à distância, sempre na direção errada.',
    ],
    privacidade: [3, 3],
    ganchos: ['Uma trilha de estacas atravessa o lodaçal e é recente', 'Há um barco emborcado onde não passa barco'],
    pontos: ['trilha de estacas', 'raízes altas', 'poça funda'],
    historia: [
      'O lodaçal cresceu depois que o rio mudou de curso. Engoliu duas aldeias e a estrada que as ligava.',
      'Quem atravessa jura ouvir sino debaixo d\'água. Havia uma capela numa das aldeias engolidas.',
    ],
  },
];

// ── Ermo de Solgar ────────────────────────────────────────────────────────
const SOLGAR: Def[] = [
  {
    id: 'solgar', nome: 'Solgar', regiao: 'Ermo de Solgar', tipo: 'vila', perigo: 4,
    descricao: 'A última água antes do ermo. Casas de barro em volta de uma cisterna funda, com muro baixo mais contra vento do que contra gente.',
    atmosfera: [
      'A cisterna é o centro de tudo. Há fila, há ordem, e há quem fiscalize a ordem.',
      'O calor cede e a vila inteira sai de casa ao mesmo tempo.',
      'Frio seco. As caravanas que dormem aqui acendem fogo do lado de fora do muro.',
    ],
    privacidade: [1, 2],
    ganchos: ['O nível da cisterna baixou mais rápido que o normal', 'Uma caravana pagou o dobro para partir antes do amanhecer'],
    pontos: ['cisterna', 'muro baixo', 'pátio das caravanas'],
    historia: [
      'Solgar existe por causa da cisterna e por mais nada. Sem ela, a rota do ermo não fecha.',
      'A vila cobra pela água e sempre cobrou. Já houve três tentativas de tomá-la à força e as três terminaram mal para quem tentou.',
    ],
  },
  {
    id: 'poco_seco', nome: 'Poço Seco', regiao: 'Ermo de Solgar', tipo: 'aldeia', perigo: 6,
    descricao: 'O que sobrou de uma aldeia em volta de um poço que não dá mais água. Metade das casas sem telhado, a outra metade ocupada por quem não tem para onde ir.',
    atmosfera: [
      'Poeira e vento. Umas poucas pessoas, todas de passagem, nenhuma disposta a explicar.',
      'As paredes sem telhado projetam sombras compridas de moldura vazia.',
      'Fogueiras pequenas dentro das ruínas, longe umas das outras de propósito.',
    ],
    privacidade: [2, 3],
    ganchos: ['Alguém desceu no poço com corda e não subiu', 'Há mais fogueiras do que gente à vista'],
    pontos: ['poço', 'casas sem telhado', 'antigo curral'],
    historia: [
      'Poço Seco secou em uma estação. A aldeia inteira saiu a pé para Solgar e menos da metade chegou.',
      'Hoje serve de abrigo para quem não pode ser visto em Solgar. Todo mundo sabe, inclusive Solgar.',
    ],
  },
  {
    id: 'caravancerai', nome: 'Parada de Idrin', regiao: 'Ermo de Solgar', tipo: 'acampamento', perigo: 5,
    descricao: 'Um pátio murado no meio do nada, com estábulo, cisterna coberta e quartos que são mais celas que quartos.',
    atmosfera: [
      'Caravanas trocando carga e notícia. Aqui se sabe de tudo antes de qualquer cidade.',
      'O portão fecha ao pôr do sol, com ou sem retardatário na estrada.',
      'Lá dentro, gente demais de origem demais para o tamanho do pátio. Ninguém dorme de costas.',
    ],
    privacidade: [1, 2],
    ganchos: ['Uma carga trocou de dono no meio da noite', 'O guarda do portão não é o mesmo de ontem e ninguém comenta'],
    pontos: ['pátio', 'estábulo', 'cisterna coberta', 'portão'],
    historia: [
      'Idrin construiu a parada e morreu antes de ver a primeira caravana. O nome ficou porque ninguém quis mudar.',
      'A parada é neutra por costume, não por lei. Já se cumpriu vingança do lado de fora do portão no minuto seguinte à saída.',
    ],
  },
];

// ── Estradas que costuram o continente ────────────────────────────────────
const ESTRADAS: Def[] = [
  {
    id: 'estrada_real', nome: 'Estrada Real', regiao: 'Halvern', tipo: 'estrada', perigo: 5,
    descricao: 'A via calçada que liga a marca ao sul, larga o bastante para duas carroças e mal conservada há tempo demais.',
    atmosfera: [
      'Tráfego constante: carga, gente de leva, peregrino e quem prefere não dizer.',
      'As pedras soltas ficam evidentes na luz rasante. Roda quebrada é o acidente do dia.',
      'A estrada esvazia de uma vez. Quem fica é porque não teve escolha.',
    ],
    privacidade: [1, 3],
    ganchos: ['Um trecho da calçada foi levantado e reposto errado', 'Marco de légua derrubado apontando para o lado errado'],
    pontos: ['marcos de légua', 'bebedouro', 'trecho levantado'],
    historia: [
      'A Estrada Real foi construída para mover exército, não mercadoria. Por isso é reta onde deveria contornar.',
      'A manutenção cabe a cada senhorio no trecho dele. É por isso que ela muda de qualidade a cada meia légua.',
    ],
  },
  {
    id: 'estrada_costeira', nome: 'Trilha Costeira', regiao: 'Costa de Mareu', tipo: 'estrada', perigo: 4,
    descricao: 'Trilha de terra batida acompanhando a falésia, estreita nos trechos altos e alagada nos baixos.',
    atmosfera: [
      'Vento de mar constante e vista aberta. Dá para ver quem vem de longe, e ser visto.',
      'O sol cai no mar de um lado e a trilha fica dourada e traiçoeira.',
      'Sem lua, andar aqui é apostar contra a falésia.',
    ],
    privacidade: [2, 3],
    ganchos: ['Um trecho desabou e a trilha foi desviada por dentro', 'Fogo aceso na praia lá embaixo, fora de rota de pesca'],
    pontos: ['trecho alto', 'desvio por dentro', 'descida para a praia'],
    historia: [
      'A trilha é mais velha que Mareu. Era o caminho das três vilas antes de elas virarem cidade.',
      'Contrabando de sal usa a costeira desde sempre, porque a alfândega fica no cais e não na falésia.',
    ],
  },
];

// ── Baixios de Halvern e povoados menores ─────────────────────────────────
const BAIXIOS: Def[] = [
  {
    id: 'vau_pedra', nome: 'Vau de Pedra', regiao: 'Baixios de Halvern', tipo: 'estrada', perigo: 5,
    descricao: 'Onde o rio se abre raso o bastante para atravessar a pé, sobre um leito de laje. A travessia só existe quando a água deixa.',
    atmosfera: [
      'Carroças esperando a vez. A fila anda conforme o rio permite.',
      'A luz baixa e o leito de laje brilha molhado. Quem for atravessar, atravessa agora.',
      'De noite ninguém cruza. A pedra escorrega e o rio não devolve.',
    ],
    privacidade: [1, 3],
    ganchos: ['A água subiu fora de época e não choveu', 'Alguém marcou a profundidade errado, de propósito'],
    pontos: ['leito de laje', 'marco de profundidade', 'abrigo da espera'],
    historia: [
      'O vau é a única travessia entre o Vale e o sul quando a ponte está interditada, e ela é interditada com frequência conveniente.',
      'Cobrou-se pedágio aqui por sessenta anos, até que uma cheia levou a guarita e ninguém a reconstruiu.',
    ],
  },
  {
    id: 'charco_juncal', nome: 'Juncal', regiao: 'Baixios de Halvern', tipo: 'pantano', perigo: 7,
    descricao: 'Braço morto do rio tomado por junco alto, onde a água some sob a vegetação e o caminho é decorado, não visto.',
    atmosfera: [
      'Junco acima da cabeça. Ouve-se tudo e não se vê nada.',
      'O junco fica dourado e o vento faz o charco inteiro parecer que anda.',
      'Rãs, e depois o silêncio que vem quando as rãs param todas de uma vez.',
    ],
    privacidade: [3, 3],
    ganchos: ['Um caminho de junco pisado que não leva a lugar nenhum', 'Armadilha de pesca cheia e abandonada'],
    pontos: ['caminho decorado', 'braço morto', 'moita alta'],
    historia: [
      'Os juncaleiros conhecem o caminho de cor e o ensinam só a filho. É o capital deles.',
      'Mais de um fugitivo do Vale se escondeu aqui. Alguns saíram.',
    ],
  },
  {
    id: 'vila_juncal', nome: 'Juncal de Baixo', regiao: 'Baixios de Halvern', tipo: 'aldeia', perigo: 4,
    descricao: 'Casas de junco trançado sobre plataformas, todas viradas para o mesmo canal, todas com barco amarrado embaixo.',
    atmosfera: [
      'Trançado de esteira em toda varanda. Aqui se vive do junco e da enguia.',
      'Os barcos voltam pelo canal em fila, um atrás do outro.',
      'Lamparina em cada plataforma, e o canal preto refletindo tudo em dobro.',
    ],
    privacidade: [1, 2],
    ganchos: ['Uma plataforma foi abandonada com tudo dentro', 'O canal foi represado rio acima e ninguém avisou'],
    pontos: ['canal', 'plataformas', 'secador de junco'],
    historia: [
      'Juncal de Baixo não paga imposto a ninguém porque nenhum coletor consegue chegar sem guia — e nenhum guia leva.',
      'A aldeia inteira é aparentada. Casar fora é regra, não escolha.',
    ],
  },
  {
    id: 'capela_campo', nome: 'Capela dos Ceifeiros', regiao: 'Marca de Tessel', tipo: 'capela', perigo: 3,
    descricao: 'Uma capela de uma nave só no meio do trigo, com telhado remendado e um cemitério pequeno atrás.',
    atmosfera: [
      'Vazia quase sempre. O padre atende três vilas e está sempre na outra.',
      'A luz entra pela porta aberta e atravessa a nave inteira até o altar.',
      'Uma vela acesa por quem passou. Nunca se sabe quem.',
    ],
    privacidade: [2, 3],
    ganchos: ['Nomes recentes no cemitério que não constam em registro nenhum', 'Alguém dorme no coro e sai antes do amanhecer'],
    pontos: ['nave', 'altar', 'cemitério de trás', 'coro'],
    historia: [
      'A capela foi erguida no ponto exato onde a linha de batalha parou, há três gerações. É marco e é túmulo.',
      'Nos anos de leva, é aqui que as famílias vêm despedir. O padre parou de contar quantos voltaram.',
    ],
  },
  {
    id: 'vila_terraco', nome: 'Terraço Sexto', regiao: 'Planalto de Corveira', tipo: 'vila', perigo: 3,
    descricao: 'Um dos terraços de moradia de Corveira que cresceu o bastante para ter nome, mercado e brigas próprias.',
    atmosfera: [
      'Corda de roupa de um lado ao outro da rua. Aqui mora quem trabalha lá embaixo.',
      'O sol some atrás do terraço de cima duas horas antes do resto do planalto.',
      'Vozes através das paredes finas. Ninguém tem segredo no Sexto.',
    ],
    privacidade: [0, 1],
    ganchos: ['Uma casa foi desocupada às pressas e ninguém ocupou depois', 'A água do terraço chega suja há uma semana'],
    pontos: ['rua das cordas', 'mercado pequeno', 'escada para o quinto'],
    historia: [
      'O Sexto foi o terraço que menos sofreu no desabamento do quarto, e por isso recebeu os sobreviventes. Nunca mais esvaziou.',
      'As casas de Corveira não reconhecem o Sexto como bairro. Para efeito de imposto, ele não existe.',
    ],
  },
  {
    id: 'aldeia_lenha', nome: 'Lenha Alta', regiao: 'Bosque de Vintra', tipo: 'aldeia', perigo: 6,
    descricao: 'Casas sobre esteios altos numa encosta de mata, ligadas por escadas de tora. Fica-se acima do chão de propósito.',
    atmosfera: [
      'Serra e machado o dia inteiro. As toras descem a encosta por calha.',
      'A mata fecha a luz cedo. Aqui o entardecer chega uma hora antes.',
      'Escadas recolhidas para cima. É assim que se dorme em Lenha Alta.',
    ],
    privacidade: [2, 3],
    ganchos: ['Uma escada não foi recolhida esta noite', 'A calha de toras foi usada para descer outra coisa'],
    pontos: ['calha de toras', 'escadas de tora', 'esteios'],
    historia: [
      'Construíram alto depois do inverno em que algo entrou na aldeia três noites seguidas. Nunca disseram o quê.',
      'Lenha Alta abastece Carvoeira, que abastece Corveira. Toda a cadeia do metal começa nesta encosta.',
    ],
  },
  {
    id: 'ruina_areia', nome: 'Ruína de Areia', regiao: 'Ermo de Solgar', tipo: 'ruina', perigo: 7,
    descricao: 'Colunas e um trecho de parede saindo da areia, com o resto enterrado. Muda de forma a cada tempestade.',
    atmosfera: [
      'A areia devolve algo novo e engole outra coisa. Nunca é a mesma ruína duas vezes.',
      'As colunas fazem sombras longas que se cruzam num padrão quase regular.',
      'A areia esfria rápido e range sozinha. Não é vento.',
    ],
    privacidade: [3, 3],
    ganchos: ['Uma escavação recente, mal disfarçada', 'A parede exposta tem inscrição que não é da região'],
    pontos: ['colunas', 'parede exposta', 'escavação'],
    historia: [
      'Havia cidade aqui quando havia água. A cisterna de Solgar é o último poço daquele sistema.',
      'Caravaneiros não acampam na ruína. Acampam à vista dela, o que é diferente.',
    ],
  },
  {
    id: 'mercado_peixe', nome: 'Mercado do Peixe', regiao: 'Costa de Mareu', tipo: 'mercado', perigo: 3,
    descricao: 'Galpão aberto no cais de Mareu, com bancadas de pedra lavadas o dia inteiro e gato em cada viga.',
    atmosfera: [
      'Grito, gelo, faca. O melhor peixe some na primeira hora.',
      'Lavam as bancadas e a água escorre para o mar levando o dia embora.',
      'Fechado, escuro e limpo. Só os gatos ficam.',
    ],
    privacidade: [0, 2],
    ganchos: ['Uma bancada não abriu e o dono não avisou a guilda', 'Carga desembarcou aqui e não era peixe'],
    pontos: ['bancadas', 'poço de gelo', 'vigas'],
    historia: [
      'O mercado é o chão mais antigo de Mareu: as três vilas originais vendiam aqui antes de haver cidade.',
      'A guilda do sal nasceu de uma disputa de bancada neste galpão, e nunca deixou de mandar nele.',
    ],
  },
];

// ── Lugares que ninguém acha por acaso ────────────────────────────────────
//
// A mansão Ubuyashiki e a vila dos ferreiros sempre foram secretas na ficção e
// públicas na mecânica: apareciam na lista de rotas como qualquer outro
// destino. Agora `Local.oculto` existe, e estes três nascem escondidos — cada
// um com a sua condição de revelação declarada.
const OCULTOS: (Def & { oculto: NonNullable<Local['oculto']> })[] = [
  {
    id: 'casa_da_agulha', nome: 'A Casa da Agulha', regiao: 'Marca de Tessel', tipo: 'mansao', perigo: 3,
    descricao: 'Uma casa comum numa rua comum de Tessel, com porta dos fundos que dá para outra rua e um porão que não consta na planta.',
    atmosfera: [
      'Por fora, casa de família. Cortina fechada e ninguém à janela.',
      'Alguém entra pela porta dos fundos e não sai pela da frente.',
      'Luz sob a porta do porão a noite inteira.',
    ],
    privacidade: [3, 3],
    ganchos: ['Um mapa da marca com alfinetes que mudam de lugar', 'Correio que chega sem selo e parte sem destinatário'],
    pontos: ['porão', 'porta dos fundos', 'mesa de mapas'],
    historia: [
      'É daqui que os caçadores coordenam a marca inteira. Tessel não sabe, e a Casa prefere assim.',
      'Três chefes de posto já foram substituídos por decisão tomada nesta mesa, e nenhum soube por quê.',
    ],
    oculto: {
      flag: 'descoberto.casa_da_agulha',
      dica: 'Falam de uma casa em Tessel onde as ordens de verdade são dadas. Ninguém aponta qual.',
      exigeReputacao: { faccaoId: 'cacadores', minimo: 3 },
    },
  },
  {
    id: 'forja_afundada', nome: 'A Forja Afundada', regiao: 'Planalto de Corveira', tipo: 'forja', perigo: 6,
    descricao: 'Uma oficina inteira dentro de uma galeria abandonada do Poço Fundo, com fole movido pela própria água que inundou o nível de baixo.',
    atmosfera: [
      'Calor onde deveria haver frio. O fole respira com a água.',
      'A brasa ilumina a galeria e mostra até onde ela vai — não muito.',
      'Só o fole e a água. Quem trabalha aqui trabalha sozinho.',
    ],
    privacidade: [3, 3],
    ganchos: ['Uma lâmina inacabada na bigorna, esperando alguém', 'Marcas de mão pequena na poeira do chão'],
    pontos: ['bigorna', 'fole de água', 'galeria alagada'],
    historia: [
      'Quando as casas de Corveira proibiram forjar aço solar, a forja desceu. Está aqui desde então.',
      'Quem forja aqui não vende para a cidade. Vende para quem precisa matar o que a cidade finge que não existe.',
    ],
    oculto: {
      flag: 'descoberto.forja_afundada',
      dica: 'Há quem jure que ainda se forja no Poço Fundo, num nível que a casa dona diz estar interditado.',
      exigeVisita: 'mina_corveira',
    },
  },
  {
    id: 'toca_juncal', nome: 'A Toca do Juncal', regiao: 'Baixios de Halvern', tipo: 'cripta', perigo: 7,
    descricao: 'Uma câmara seca sob o charco, alcançada por um caminho de estacas que só existe para quem sabe contá-las.',
    atmosfera: [
      'Seco, quieto e mais alto do que deveria caber ali embaixo.',
      'A luz que entra vem de cima, por uma fenda entre as raízes.',
      'De noite ouve-se o charco inteiro através da pedra.',
    ],
    privacidade: [3, 3],
    ganchos: ['Mercadoria empilhada que não passou por alfândega nenhuma', 'Uma lista de nomes pregada na parede, alguns riscados'],
    pontos: ['câmara seca', 'caminho de estacas', 'parede dos nomes'],
    historia: [
      'A capela da aldeia engolida ficava aqui. O que sobrou dela virou depósito de quem não pode ser visto.',
      'Os juncaleiros sabem onde é e não contam. Contar custaria mais caro do que guardar.',
    ],
    oculto: {
      flag: 'descoberto.toca_juncal',
      dica: 'No Juncal se diz que existe chão seco embaixo da água. Quem sabe onde não diz, e quem diz não sabe.',
      exigeReputacao: { faccaoId: 'ladroes', minimo: 5 },
    },
  },
];

export const locaisContinente: Local[] = [
  ...TESSEL, ...CORVEIRA, ...MAREU, ...VINTRA, ...SOLGAR, ...ESTRADAS, ...BAIXIOS,
].map(expandir).concat(
  OCULTOS.map(d => ({ ...expandir(d), oculto: d.oculto })),
);

// ── O grafo ───────────────────────────────────────────────────────────────
//
// Arestas declaradas UMA vez e aplicadas nos dois sentidos. O mapa antigo tinha
// rotas escritas à mão em cada ponta, o que permite (e permitiu) caminho de mão
// única por engano — e caminho de mão única quebra a busca de rota que a
// autonomia dos NPCs e o planejador usam.
type Aresta = [string, string, number, number];

const ARESTAS: Aresta[] = [
  // O Vale se abre para o continente pela estrada que já existia.
  ['estrada', 'estrada_real', 1, 4],
  ['estrada_real', 'tessel', 2, 4],
  ['estrada_real', 'corveira', 2, 4],
  ['estrada_real', 'mareu', 2, 5],
  ['estrada_real', 'vintra', 2, 5],

  // Marca de Tessel
  ['tessel', 'forte_agulha', 1, 5],
  ['tessel', 'vila_pedravel', 1, 3],
  ['tessel', 'campo_ceifa', 1, 4],
  ['vila_pedravel', 'campo_ceifa', 1, 3],
  ['forte_agulha', 'passo_lobo', 1, 7],
  ['passo_lobo', 'corveira', 2, 6],

  // Planalto de Corveira
  ['corveira', 'aldeia_ferro', 1, 3],
  ['corveira', 'mina_corveira', 1, 5],
  ['corveira', 'mosteiro_alto', 1, 2],
  ['aldeia_ferro', 'colina_forcados', 1, 5],
  ['colina_forcados', 'mosteiro_alto', 1, 4],
  ['corveira', 'vila_ferreiros', 2, 4],

  // Costa de Mareu
  ['mareu', 'porto_sal', 1, 4],
  ['mareu', 'estrada_costeira', 1, 3],
  ['estrada_costeira', 'aldeia_rede', 1, 3],
  ['estrada_costeira', 'farol_quebrado', 1, 6],
  ['porto_sal', 'aldeia_rede', 1, 4],

  // Bosque de Vintra
  ['vintra', 'aldeia_carvoeira', 1, 5],
  ['aldeia_carvoeira', 'clareira_pedras', 1, 7],
  ['aldeia_carvoeira', 'pantano_lodo', 1, 8],
  ['vintra', 'floresta', 2, 5],

  // Baixios de Halvern — a travessia do sul e o juncal
  ['ponte', 'vau_pedra', 1, 4],
  ['vau_pedra', 'charco_juncal', 1, 7],
  ['charco_juncal', 'vila_juncal', 1, 4],
  ['vau_pedra', 'estrada_real', 1, 4],
  ['vila_juncal', 'lago', 2, 4],

  // Povoados menores costurados às regiões que os sustentam
  ['campo_ceifa', 'capela_campo', 1, 3],
  ['capela_campo', 'vila_pedravel', 1, 3],
  ['corveira', 'vila_terraco', 0, 2],
  ['vila_terraco', 'aldeia_ferro', 1, 3],
  ['aldeia_carvoeira', 'aldeia_lenha', 1, 6],
  ['aldeia_lenha', 'vintra', 1, 5],
  ['poco_seco', 'ruina_areia', 1, 7],
  ['mareu', 'mercado_peixe', 0, 3],
  ['mercado_peixe', 'porto_sal', 1, 4],

  // Os ocultos: têm rota, mas a rota não aparece até se descobrir o lugar.
  ['tessel', 'casa_da_agulha', 0, 3],
  ['mina_corveira', 'forja_afundada', 1, 6],
  ['charco_juncal', 'toca_juncal', 1, 7],

  // Ermo de Solgar
  ['solgar', 'poco_seco', 1, 6],
  ['solgar', 'caravancerai', 1, 5],
  ['caravancerai', 'estrada_real', 2, 5],
  ['poco_seco', 'passo_lobo', 2, 7],
];

// A mina de Corveira é local próprio, e não a mina do Vale.
locaisContinente.push(
  expandir({
    id: 'mina_corveira', nome: 'Poço Fundo', regiao: 'Planalto de Corveira', tipo: 'mina', perigo: 6,
    descricao: 'A mina que sustenta Corveira. Galerias em três níveis, escoradas com madeira que já devia ter sido trocada.',
    atmosfera: [
      'Turno cheio. Lamparina, martelo e o vagonete gritando no trilho.',
      'A boca da mina cospe gente suja e engole gente limpa.',
      'Turno da noite: menos homens, mesma rocha, e ninguém acima para ouvir grito.',
    ],
    privacidade: [1, 3],
    ganchos: ['Uma galeria foi interditada e a interdição foi removida por dentro', 'O escoramento do nível três está cedendo e a casa dona sabe'],
    pontos: ['boca da mina', 'nível três', 'sala das bombas'],
    historia: [
      'O Poço Fundo é o buraco de onde Corveira saiu. A cidade foi construída em cima do que ele cuspiu.',
      'O desabamento do terraço quarto começou aqui embaixo, e a investigação foi conduzida pela casa que era dona da galeria.',
    ],
  }),
);

/**
 * Aplica as arestas nos dois sentidos e devolve o mapa completo. Rotas antigas
 * escritas à mão são preservadas; só se acrescenta o que falta.
 */
export function integrarContinente(base: Local[]): Local[] {
  const todos = [...base, ...locaisContinente];
  const porId = new Map(todos.map(l => [l.id, l]));
  const ligar = (de: string, para: string, periodos: number, perigo: number) => {
    const local = porId.get(de);
    if (!local || !porId.has(para)) return;
    if (local.rotas.some(r => r.destino === para)) return;
    local.rotas = [...local.rotas, { destino: para, periodos, perigo }];
  };
  for (const [a, b, periodos, perigo] of ARESTAS) {
    ligar(a, b, periodos, perigo);
    ligar(b, a, periodos, perigo);
  }
  // O mapa antigo tinha rota de mão única — `casa_senhorial → cemiterio` sem a
  // volta, entre outras. Isso não é atalho de design: `proximoPasso` (a busca
  // que a autonomia dos NPCs e o planejador usam) enxerga o grafo como
  // dirigido, então um NPC podia entrar num lugar e não ter caminho de saída.
  // Aqui toda rota existente ganha a contrapartida, com o mesmo custo.
  for (const l of todos) {
    for (const r of l.rotas) {
      const destino = porId.get(r.destino);
      if (destino && !destino.rotas.some(v => v.destino === l.id)) {
        destino.rotas = [...destino.rotas, { destino: l.id, periodos: r.periodos, perigo: r.perigo }];
      }
    }
  }
  escalarTravessias(todos, porId);
  return todos;
}

/**
 * Dá escala geográfica ao continente.
 *
 * Medido na sessão 21: com 53 lugares no mapa, **nenhum par estava a mais de
 * dois dias de distância**. As arestas eram declaradas em 1 ou 2 períodos, e o
 * dia tem seis — o continente inteiro tinha a largura de uma tarde. Isso
 * esvaziava três coisas de uma vez: prazo de missão nunca apertava, perigo de
 * rota nunca acumulava, e escolher para onde ir não era decisão nenhuma.
 *
 * A regra é simples e fica nos dados, não em quarenta arestas reescritas à
 * mão: **atravessar região custa dia, andar dentro dela custa hora**. Um
 * período declarado numa aresta que cruza fronteira passa a valer um dia
 * inteiro de estrada.
 *
 * Duas exceções deliberadas:
 * - Aresta declarada com 0 período fica com 0. Zero é o autor dizendo "isto é
 *   praticamente o mesmo lugar" — o mercado de peixe colado em Mareu, a casa
 *   escondida na saia de Tessel. Escalar isso inventaria distância que a
 *   ficção nega.
 * - Regiões de fora do mundo (o Castelo Infinito e o que vier depois) não
 *   entram: não se chega lá andando, e medir em dias de estrada seria mentira.
 */
export const FATOR_ENTRE_REGIOES = 6;
const FORA_DO_MUNDO = 'Fora do Mundo';

function escalarTravessias(todos: Local[], porId: Map<string, Local>): void {
  for (const l of todos) {
    if (l.regiao === FORA_DO_MUNDO) continue;
    l.rotas = l.rotas.map(r => {
      const destino = porId.get(r.destino);
      if (!destino || destino.regiao === FORA_DO_MUNDO) return r;
      if (r.periodos <= 0 || destino.regiao === l.regiao) return r;
      return { ...r, periodos: r.periodos * FATOR_ENTRE_REGIOES };
    });
  }
}
