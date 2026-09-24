// ARCANUM · O passado dos lugares do vale (sessão 55).
//
// Os lugares do continente (content/vaelhorn/continente.ts) já tinham duas ou
// três linhas de história cada; os dezenove do coração do vale — a taverna, a
// praça, a capela, a ponte — não tinham nenhuma, e o narrador recebia
// `historiaDesteLugar: []` justamente onde o jogo começa. Estas linhas são o
// que qualquer moradora sabe contar; segredo continua morando nos segredos.
//
// Nenhuma linha data o incêndio de Mir: o conteúdo antigo diz "faz vinte
// anos" (As Ruínas de Mir, Vell) e o cenário diz "três gerações" de Leva. A
// decisão é do dono (registrada no HANDOFF da sessão 55).
//
// Também corrige quatro descrições que contradiziam o mundo: a Casa de Pedra
// tinha "o senhor de Halvet", o lago tinha "pescadores", a mina "mineiros" e a
// capela um "Cristo de madeira" em vez do santo que dá nome a ela.
export const HISTORIAS_LOCAIS: Record<string, string[]> = {
  taverna: [
    'A Rês Enforcada tem o nome de uma vaca que a primeira taverneira pendurou na viga para secar, num inverno em que não havia mais onde guardar carne. A viga ainda tem o gancho.',
    'Depois da Leva, a taverna virou o lugar onde as mulheres do vale fecham negócio, casamento e vingança, nessa ordem de frequência. O quarto de cima é alugado por noite e por silêncio.',
  ],
  praca: [
    'O patíbulo é mais velho que a vila. A última enforcada foi uma ladra de sal, e desde então a forca serve de poste para os éditos da casa.',
    'O poço nunca secou, nem no verão em que o rio baixou até mostrar as pedras. As velhas dizem que é porque ninguém jamais jogou nada dentro dele que não quisesse de volta.',
  ],
  mercado: [
    'A Feira Coberta começou como três bancas debaixo de uma lona só, para dividir o preço da lona. Hoje são quarenta, e ainda se discute quem paga o remendo.',
    'A ferraria da feira foi de Ilde Bigorna, e é a única do vale que não fecha no inverno. Ilde morreu na bigorna sem dizer qual das filhas ficava com ela; Torana ficou, Duna montou a dela a dez passos, e as duas irmãs não dividem mais nem o carvão.',
  ],
  capela: [
    'A capela leva o nome de São Vandro, o santo que desceu a uma fenda embaixo do vale e a fechou com a lança. O santo de madeira do altar está gasto no joelho de tanto ser tocado por quem pede alguém de volta.',
    'Sarine selou sob o piso da capela o que puxa os filhos do vale. Desde então a porta da cripta tem cadeado, e as irmãs trocam a vela da laje central todos os dias, sem faltar um.',
  ],
  cripta: [
    'Os nichos de cima são das famílias do vale; os de baixo, de gente que ninguém lembra. Os nomes apagados não foram apagados pelo tempo: alguém raspou, e as irmãs sabem quem.',
    'A lança de São Vandro foi enterrada aqui, com o pouco que acharam dele. O guarda que marcha no ossuário faz parte do enterro.',
  ],
  floresta: [
    'A Mata de Corvos era do rei, quando havia rei: caça proibida, lenha proibida, entrada proibida. A proibição morreu com ele; o medo de entrar ficou.',
    'A árvore dos enforcados não tem esse nome por justiça. Tem porque, nos anos mais duros da Leva, era para lá que algumas mães iam quando o inverno dos dezoito chegava para o filho.',
  ],
  ponte: [
    'A ponte uniu as duas margens do vale por trezentos anos. Caiu numa noite só, na noite em que o selo de Sarine rachou pela primeira vez, e o vale passou a contar os dias a partir dali.',
    'Os meninos que a Leva leva ainda caminham até onde ela era, e seguem para dentro da água como se a ponte ainda estivesse lá. Morda estava do lado de cá quando ela caiu; senta no coto norte todos os dias, e escuta.',
  ],
  moinho: [
    'O moinho moía o grão de meio vale. Numa noite de cheia a roda parou e nunca mais girou, e havia gente no açude naquela noite que o vale não gosta de nomear.',
    'Heska, a moleira, ainda abre a porta todas as manhãs e varre a farinha velha. Diz que o moinho não parou: está esperando o rio pedir desculpas.',
  ],
  cemiterio: [
    'O Campo de Pedras fica numa encosta que escorrega devagar, um palmo por década. As lápides mais antigas já estão no pé do morro, longe de quem enterraram.',
    'Há trezentos anos uma Cava-Fundo cava aqui. Das covas dos últimos invernos, muitas não têm ninguém dentro: é pedra com o nome de um menino da Leva, para a mãe ter onde chorar. Algumas covas amanhecem rasas mesmo assim — Oda chama isso de trabalho, não de mistério.',
  ],
  ruinas: [
    'Mir era a cidade do templo, onde o último rei de Halvern foi enterrado e onde o vale ia rezar nas festas grandes. Virou carvão numa noite só.',
    'As paredes que sobraram continuam pretas, e a chuva não lava aquilo. Uma casa não queimou, a única com a porta trancada por dentro, e ninguém que entrou nela quis contar o que viu.',
    'O que saiu do fogo pediu os filhos. É por isso que nenhuma mulher do vale diz o nome de Mir perto de uma criança de colo.',
  ],
  estrada: [
    'A Estrada do Sal ligava o vale ao litoral e pagava a Casa de Pedra: cada carroça deixava uma medida de sal no marco. Quando a ponte caiu, a estrada virou caminho de quem não tem outro.',
    'Os marcos de pedra têm o nome do povoado seguinte gravado. Alguém anda raspando os nomes, um por um, e ninguém sabe se é para confundir quem chega ou quem sai.',
  ],
  casa_senhorial: [
    'A Casa de Pedra é a única de dois andares do vale porque a primeira senhora de Halvet a construiu com a pedra da torre que caiu, e sobrou pedra. Por quatrocentos anos foi o lugar onde o vale decidia as coisas.',
    'Hoje o vale decide as coisas na taverna. Dama Valda vende as terras da casa aos pedaços para a gente do sal, e as janelas de cima ficam fechadas para que ninguém veja os quartos vazios.',
  ],
  mina: [
    'A Mina de Ferro deu ao vale as ferramentas e as lanças por duzentos anos. Borka é capataz desde que a anterior ficou soterrada na galeria funda, e tem catorze nomes riscados numa viga da boca da mina.',
    'Duas versões circulam: que o veio secou, ou que as mineiras pararam de subir. As duas são verdade, em anos diferentes, e Borka não gosta que se misture.',
  ],
  vila_ferreiros: [
    'Ninguém encontra a vila duas vezes pelo mesmo caminho. As ferreiras de lá dizem que é a vila que escolhe quem chega, e que escolhe pelo que a pessoa vai fazer com o aço.',
    'É aqui que se forja o aço que muda de cor na mão de quem caça onis. A Casa Sem Nome na Névoa paga as ferreiras em proteção, e as ferreiras cobram em teimosia.',
  ],
  torre: [
    'A Torre do Vigia foi posta na fronteira pela coroa, quando havia coroa, para avisar o vale de exército chegando. A coroa acabou e ninguém mandou parar. Na noite em que a ponte caiu, o sino da torre não tocou; a vigia de hoje sobe todas as noites e anota o que vê, para que ninguém possa dizer isso de novo.',
    'O salão de baixo guarda o que a torre tirou de quem tentou tomá-la. O constructo de vidro que vigia o salão é mais velho que a torre, e ninguém lembra de quem o pôs lá.',
  ],
  lago: [
    'O Espelho de Halvet tem água parada demais para lago de rio. Na noite em que a ponte caiu, muita gente morreu no rio e nunca apareceu; as pescadoras dizem que apareceu no lago.',
    'As oferendas na margem — pão, sal, às vezes um dente de leite — são para os afogados daquela noite. Ninguém admite que deixa; todo mundo sabe quem deixa.',
  ],
  acampamento: [
    'O Acampamento dos Sem-Nome começou com as mulheres que a vila expulsou, por dívida, por crime ou por dizerem o que não deviam. Ruvela chegou da guarda da vila com metade da tropa atrás dela, e na primeira semana já era a chefe.',
    'Quem vive aqui abre mão do nome da família e ganha o sobrenome Sem-Nome. Há quem volte à vila anos depois e ninguém a reconheça, e há quem prefira assim.',
  ],
  mansao_ubuyashiki: [
    'A Casa Sem Nome na Névoa caça onis há mais tempo do que qualquer casa do vale existe. Não tem brasão nem terra; tem um mapa na parede e uma data ao lado de cada ponto.',
    'Os guardiões que moram aqui chegam e partem sem aviso. Quem guarda a casa de verdade é a névoa, e a trilha que some para quem a casa não quer receber.',
  ],
  castelo_infinito: [
    'O Castelo Infinito não fica em lugar nenhum do mapa. É onde o progenitor dos onis reúne as Luas, e a tocadora de biwa decide, nota por nota, onde fica cada sala.',
    'Quem entra sai separado de quem entrou junto, se sair. A Casa Sem Nome tem um único mapa dele, desenhado por uma caçadora que não voltou para terminar.',
  ],
};

/** Descrições que contradiziam o mundo (o vale é das mulheres; a capela é de São Vandro). */
export const DESCRICOES_CORRIGIDAS: Record<string, string> = {
  casa_senhorial: 'A única casa de dois andares do vale. A senhora de Halvet não sai dela há meses, e as janelas de cima ficam sempre fechadas.',
  lago: 'Água parada demais para um lago alimentado por rio. As pescadoras vêm cedo, pescam pouco e vão embora antes do meio-dia.',
  mina: 'Abandonada quando o veio secou — ou quando as mineiras pararam de subir. As duas versões circulam.',
  capela: 'Pedra fria e um São Vandro de madeira gasto de tanto ser tocado. A fé aqui é mais medo que amor.',
};
