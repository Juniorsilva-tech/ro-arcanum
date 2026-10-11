// ARCANUM · Cosmologia, religião e as Sete Pecadoras.
//
// Tudo neste arquivo é CRENÇA: o que a Igreja ensina, o que as avós contam e o
// que os cultos juram. A engine não confirma deus nenhum. O mundo do vale é
// medieval e pé no chão (sessão 67: conscrição, dízimo, inquisição, ponte
// sabotada numa revolta); a fé é o modo como essa gente explica o que sofre.
//
// As "Sete Pecadoras" são o caso mais claro. Há quatrocentos anos a Ordem dos
// Santos do Selo queimou nove pessoas — curandeiras, uma escrivã, uma
// parteira, um viúvo que pregava — e as chamou de bruxas dos pecados. O povo
// guardou as lendas dos poderes; os autos da Ordem guardam outra história. O
// narrador conta as duas como coisas que se dizem, nunca como fato.
//
// (Sessão 69: as bruxas usam os nomes e os termos de Re:Zero — Autoridade,
// Evangelho, Culto da Bruxa, Bispos do Pecado, o Santo da Espada, o Dragão
// Divino e o Grande Sábio —, a pedido do dono: o jogo é local e não será
// vendido. As lendas e os autos da Ordem são do vale.)

export type Divindade = {
  id: string;
  nome: string;
  titulo: string;
  dominio: string;
  culto: string;
  simbolo: string;
  mito: string;
};

export type BruxaPecado = {
  id: string;
  pecado: string;
  nome: string;
  autoridade: string;
  naturezaPoder: string;
  desfecho: string;
  reliquiaOuMarca: string;
};

export type FaccaoAntiga = {
  id: string;
  nome: string;
  crenca: string;
  sede: string;
  dogma: string;
  relacaoComBruxas: string;
};

export type CronicaLocalMapa = {
  id: string;
  nome: string;
  regiao: string;
  divindadeOuCrenca: string;
  passadoGuerraDeuses: string;
  marcaDasBruxas: string;
  supersticaoPopular: string;
};

// ── 1. O QUE A IGREJA ENSINA SOBRE A ORIGEM DO MUNDO ────────────────────────
export const MITO_ORIGEM_MAGIA = {
  titulo: 'A Guerra do Firmamento (o que se ensina na capela)',
  texto:
    'Os padres ensinam que, antes dos reis e dos calendários, os Deuses Maiores guerrearam sobre o continente ' +
    'até partir as montanhas, e que caíram mortos na terra. O que os letrados chamam de mana seria o sangue ' +
    'deles ainda correndo debaixo das pedras, e por isso toda conjuração é pecado: mexe na ferida de um deus. ' +
    'É a doutrina da Ordem dos Santos do Selo, dita do púlpito todo domingo. Ninguém viu deus nenhum cair. ' +
    'Os mineiros de Corveira acham ferro negro fundo na rocha e chamam de costela de Vandul; os pescadores ' +
    'de Mareu jogam cobre no mar para Yrmara. Acreditar é o que o vale faz com o medo.',
};

export const DEUSES_PRIMORDIAIS: Divindade[] = [
  {
    id: 'sol_voraz',
    nome: 'Sol-Voraz (Solaris de Pedra)',
    titulo: 'O Juiz do Firmamento Branco',
    dominio: 'Ordem implacável, juramentos de sangue e luz cegante',
    culto: 'A Igreja Ortodoxa de Halvern e os nobres das fortalezas',
    simbolo: 'Círculo de ferro fundido atravessado por três pregos',
    mito:
      'Diz-se que Sol-Voraz queimou o próprio peito para banhar o vale numa luz que não permite segredos. ' +
      'Seus devotos raspam a cabeça e erguem capelas de granito sem janelas para que a sombra não entre.',
  },
  {
    id: 'abismo_ferro',
    nome: 'O Forjador das Profundezas (Vandul)',
    titulo: 'O Deus das Rochas e dos Ossos da Terra',
    dominio: 'Minérios, adamante, forja e sepulturas eternas',
    culto: 'Os clãs de Corveira, ferreiros de lâminas e mineiros antigos',
    simbolo: 'Uma bigorna rachada cravada na pedra viva',
    mito:
      'Caiu sobre o planalto de Corveira como um meteorito de ferro negro. As veias de adamante do mundo ' +
      'brotaram de suas costelas partidas. Nenhuma lâmina afia de verdade sem uma gota de cerveja jogada nas brasas em seu nome.',
  },
  {
    id: 'mar_afogados',
    nome: 'A Senhora das Marés Cinzentas (Yrmara)',
    titulo: 'A Mãe dos Náufragos e dos Segredos Submersos',
    dominio: 'Águas salgadas, correntes profundas, luto e esquecimento',
    culto: 'Os pescadores de Mareu e os marinheiros que dobram as falésias',
    simbolo: 'Um anzol de osso amarrado a um bufo de alga marinha',
    mito:
      'Afundou na Fossa de Mareu na noite em que o mar se recolheu por três léguas. Ela guarda os corpos ' +
      'que a terra recusa e exige uma moeda de cobre jogada ao mar a cada partida de caravela.',
  },
  {
    id: 'floresta_cega',
    nome: 'O Velho dos Galhos (Vintrath)',
    titulo: 'O Senhor do Silêncio e das Raízes Noturnas',
    dominio: 'Matas intocadas, caça primitiva, fungos e o ciclo da podridão',
    culto: 'Os carvoeiros de Vintra e os ermitões das brenhas',
    simbolo: 'Chifre de cervo entrelaçado com espinheiros',
    mito:
      'Um deus que sangrou folhas pretas ao morrer. Quem adentra o bosque de Vintra sem pedir passagem ' +
      'sente a floresta fechar as trilhas atrás de si: ele ainda escuta cada passo pesado.',
  },
];

// ── 2. AS SETE PECADORAS (E AS DUAS QUE A ORDEM ACRESCENTOU) ────────────────
// Cada uma tem a lenda (o que o povo conta) e o que os autos da Ordem
// registram. Os campos seguem o tipo BruxaPecado: `autoridade` é o dom que a
// lenda atribui; `naturezaPoder`, a lenda; `desfecho`, o que se sabe do fim;
// `reliquiaOuMarca`, o que sobrou no mundo.
export const BRUXAS_DOS_PECADOS: BruxaPecado[] = [
  {
    id: 'inveja',
    pecado: 'Inveja',
    nome: 'Satella · A Invejosa',
    autoridade: 'A sombra que come o que os outros têm',
    naturezaPoder:
      'A lenda diz que ela cobiçou tudo o que as outras tinham — o dom, o amor, o nome — e as engoliu uma a uma ' +
      'com mãos de sombra que saíam do chão, e que metade do vale morreu no inverno em que ela foi presa. ' +
      'Contam que ela amava alguém com um amor que não deixava espaço para mais ninguém no mundo, e que repetia ' +
      '"eu te amo" até a voz virar outra coisa, e que só o Santo da Espada, o Dragão Divino e o Grande Sábio, ' +
      'juntos, conseguiram selá-la além do véu. O povo não diz o nome dela em voz alta.',
    desfecho:
      'Foi a última queimada, no Ano do Selo. Os autos dizem que era a irmã mais nova de uma das outras e que ' +
      'testemunhou contra todas para salvar a própria pele; a fogueira veio mesmo assim. O "inverno da Invejosa" ' +
      'foi uma peste que chegou pelo rio no mesmo ano.',
    reliquiaOuMarca:
      'O nome proibido. Dizer "Satella" dentro de casa é chamar desgraça; as mães benzem a boca da criança que diz.',
  },
  {
    id: 'soberba',
    pecado: 'Soberba',
    nome: 'Typhon · A Juíza',
    autoridade: 'Fazer a culpa pesar no corpo',
    naturezaPoder:
      'Conta-se que era uma menina de olhar manso, e que quem mentia diante dela caía com os ossos quebrados ' +
      'na medida exata da culpa que carregava. Quem não devia nada saía sem um arranhão — e isso dava mais medo.',
    desfecho:
      'Era juíza de aldeia numa terra sem juiz, e julgou contra um cônego. Os autos a acusam de "usurpar o foro da Igreja".',
    reliquiaOuMarca: 'A pedra da Praça da Forca onde ela julgava, que ninguém usa para sentar.',
  },
  {
    id: 'ira',
    pecado: 'Ira',
    nome: 'Minerva · A Colérica',
    autoridade: 'Curar com raiva',
    naturezaPoder:
      'Dizem que odiava a dor dos outros com tanta raiva que curava aos socos: cada golpe fechava uma ferida, ' +
      'e a força dele derrubava a casa em volta. A febre saía do doente com medo dela.',
    desfecho:
      'Curandeira de Corveira que ameaçou o mosteiro quando os monges deixaram morrer os mineiros de uma galeria. ' +
      'Os autos registram "blasfêmia e ameaça ao abade".',
    reliquiaOuMarca: 'As fitas vermelhas que as curandeiras ainda amarram no pulso de quem tem febre.',
  },
  {
    id: 'preguica',
    pecado: 'Preguiça',
    nome: 'Sekhmet · A Adormecida',
    autoridade: 'O sono que não acaba',
    naturezaPoder:
      'A lenda diz que respirar já a cansava, que passava os dias deitada, e que ainda assim nenhum exército ' +
      'passava pela terra dela: mãos que ninguém via derrubavam os homens do cavalo. Quem dormia ali não acordava.',
    desfecho:
      'Os autos falam de uma fiandeira que deu papoula aos filhos das vizinhas no inverno da fome, para que ' +
      'dormissem em vez de chorar. Algumas crianças não acordaram.',
    reliquiaOuMarca: 'As clareiras onde as avós proíbem cochilar, e a papoula que ninguém planta perto de casa.',
  },
  {
    id: 'gula',
    pecado: 'Gula',
    nome: 'Daphne · A Faminta',
    autoridade: 'Parir as feras do ermo',
    naturezaPoder:
      'Conta-se que andava de olhos vendados para não ver o mundo como comida, e que tinha tanta fome — dela e ' +
      'do mundo — que pariu as feras para que ninguém mais passasse fome: os lobos grandes, as sanguessugas do ' +
      'charco, as bestas da fronteira. Deu errado, como tudo o que se faz com fome.',
    desfecho:
      'Os autos a descrevem como uma mulher de Solgar que roubou grão do celeiro da Ordem num ano de seca e o deu aos pobres.',
    reliquiaOuMarca: 'Toda fera grande demais para o tamanho do mato ainda é "cria da Faminta".',
  },
  {
    id: 'luxuria',
    pecado: 'Luxúria',
    nome: 'Carmilla · A Encantadora',
    autoridade: 'Ser amada até a morte',
    naturezaPoder:
      'Dizem que era tímida e não tinha rosto que se lembrasse: quem a olhava via nela quem mais amou na vida, ' +
      'e esquecia de comer, de fugir e de respirar, feliz, até o coração parar.',
    desfecho:
      'Os autos registram uma viúva que recusou casar de novo com um capitão da Ordem. A acusação de feitiço veio depois da recusa.',
    reliquiaOuMarca: 'As fontes do caminho que os viajantes evitam beber sozinhos.',
  },
  {
    id: 'ganancia',
    pecado: 'Ganância',
    nome: 'Echidna · A Escrivã',
    autoridade: 'Querer saber tudo',
    naturezaPoder:
      'A lenda diz que queria saber tudo o que foi e o que será, que guardava as almas dos mortos em livros e ' +
      'que servia chá a quem a visitasse em sonho — e que o chá tinha gosto do que a pessoa mais queria esquecer. ' +
      'Daí vem o "chá das bruxas" que as avós ainda juram ter visto no sonho de algum doente.',
    desfecho:
      'Escrivã leiga que copiava os registros de dízimo e descobriu o desvio. Os livros dela foram queimados junto.',
    reliquiaOuMarca: 'As páginas soltas que ainda circulam escondidas, e o costume de enterrar um papel com os mortos.',
  },
  {
    id: 'tristeza',
    pecado: 'Tristeza (Melancolia)',
    nome: 'Hector · O Enlutado',
    autoridade: 'O peso do luto',
    naturezaPoder:
      'Conta-se que onde ele chorava o ar ficava pesado como chumbo, que as casas afundavam na lama e os homens ' +
      'caíam de joelhos sem saber por quê, e que nada cresce ereto onde ele pregou.',
    desfecho:
      'Viúvo que pregava nas estradas contra o Tributo de Sangue, depois que a Coroa levou os três filhos dele. ' +
      'O único homem da lista. Os autos o chamam de "pregador sem licença".',
    reliquiaOuMarca: 'O Marco Esmagado nas colinas de Mir, onde as mães dos conscritos ainda deixam pedras.',
  },
  {
    id: 'va_gloria',
    pecado: 'Vã-Glória',
    nome: 'Pandora · A Vaidosa',
    autoridade: 'Desfazer o que aconteceu',
    naturezaPoder:
      'Uma moça de cabelos de prata e vestido branco. A lenda diz que, se a ferissem, ela sorria e dizia ' +
      '"isso não aconteceu", e a ferida, a espada e até a lembrança de quem golpeou sumiam.',
    desfecho:
      'Os autos não dizem quem era. Há um nome, uma data e uma nota de outro punho: "não encontrada". ' +
      'Por isso se diz que ela nunca queimou.',
    reliquiaOuMarca: 'O costume de dizer "não aconteceu" três vezes depois de um agouro.',
  },
];

// ── 3. FACÇÕES ANTIGAS & CULTOS ─────────────────────────────────────────────
export const FACCOES_ANTIGAS: FaccaoAntiga[] = [
  {
    id: 'igreja_santos_selo',
    nome: 'A Ordem dos Santos do Selo',
    crenca: 'A salvação reside em manter as pecadoras esquecidas e o povo longe do que elas sabiam.',
    sede: 'Catedral de Granito da Casa Senhorial e Mosteiro do Alto',
    dogma: 'Todo saber fora da Igreja é mácula; quem diz o nome da Invejosa responde ao tribunal da Ordem.',
    relacaoComBruxas: 'Foram eles que as queimaram. Ainda caçam quem guarda páginas da Escrivã ou fitas da Colérica.',
  },
  {
    id: 'culto_da_bruxa',
    nome: 'O Culto da Bruxa (Filhos do Véu Negro)',
    crenca: 'A Invejosa não morreu na fogueira e vai voltar para cobrar da Ordem cada uma das nove.',
    sede: 'Criptas secretas sob as Ruínas de Mir e cavernas de Solgar',
    dogma: 'Seguir o Evangelho que cada fiel carrega e obedecer aos Bispos do Pecado, que falam em nome da Bruxa.',
    relacaoComBruxas: 'Devotos da Invejosa; as outras oito são para eles as mártires que ela vingará.',
  },
  {
    id: 'conclave_magos_mir',
    nome: 'O Conclave Arruinado de Mir',
    crenca: 'O que a Igreja chama de milagre e de feitiço pode ser explicado, anotado e ensinado.',
    sede: 'As Cinzas do Grande Templo de Mir',
    dogma: 'Nenhum conhecimento é proibido para quem possui mente de aço e instrumentos de precisão.',
    relacaoComBruxas: 'Estudiosos que procuram os livros da Escrivã e os autos verdadeiros dos julgamentos.',
  },
  {
    id: 'casa_sem_nome',
    nome: 'A Fraternidade da Lâmina Escura',
    crenca: 'O mundo sobrevive porque alguns homens e mulheres aceitam morrer no escuro sem glória nem epitáfio.',
    sede: 'A Mansão Oculta na Névoa e Vilas dos Ferreiros',
    dogma: 'Aço bem temperado e boca fechada resolvem mais que reza.',
    relacaoComBruxas: 'Caçam as feras grandes que o povo chama de cria da Faminta, e desconfiam dos Filhos do Véu.',
  },
];

// ── 4. AS CRÔNICAS DOS 53 PONTOS DO MAPA ────────────────────────────────────
// Cada um dos 53 lugares do continente com história viva, crença e marcas dos deuses/pecados.
export const CRONICAS_MAPA: Record<string, CronicaLocalMapa> = {
  // ── Vale de Halvet ──
  taverna: {
    id: 'taverna',
    nome: 'A Rês Enforcada',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Superstição dos Três Nós de Salto contra o Cheiro da Bruxa.',
    passadoGuerraDeuses: 'Construída sobre o antigo poço de sangue onde um gigante de Vandul tombou.',
    marcaDasBruxas: 'A viga mestra da taverna nunca apodrece: foi entalhada de uma árvore da Floresta da Preguiça.',
    supersticaoPopular: 'Se a cerveja espumar azeda de repente, alguém com o cheiro da Inveja entrou pela porta.',
  },
  praca: {
    id: 'praca',
    nome: 'A Praça do Patíbulo',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Altar de São Vandro e ritos de apaziguamento do solo.',
    passadoGuerraDeuses: 'O poço central foi a primeira cratera aberta quando lanças de fogo caíram do céu.',
    marcaDasBruxas: 'A forca velha foi erguida após a execução de um herege do Culto da Bruxa que não sangrou.',
    supersticaoPopular: 'Ninguém joga moedas no poço sem fazer o sinal dos pregos cruzados de Sol-Voraz.',
  },
  mercado: {
    id: 'mercado',
    nome: 'Feira Coberta & Ferraria',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Veneração a Vandul nas brasas do carvão de pedra.',
    passadoGuerraDeuses: 'As lonas cobrem alicerces de mármore arrancados de uma basílica dos Deuses da Ordem.',
    marcaDasBruxas: 'A bigorna de Ilde tilinta sozinha quando monstros criados pela Bruxa da Gula farejam o vale.',
    supersticaoPopular: 'Ferreiro que apaga a forja sem rezar acorda com a bigorna virada para o poente.',
  },
  capela: {
    id: 'capela',
    nome: 'Capela de São Vandro',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'A Igreja Ortodoxa dos Santos do Selo.',
    passadoGuerraDeuses: 'São Vandro cravou sua lança divina numa fenda para estancar o sangue negro do mundo.',
    marcaDasBruxas: 'A laje central tampa um túnel onde fanáticos da Inveja foram emparedados vivos.',
    supersticaoPopular: 'Passar a mão no joelho do santo de madeira cura a tosse, mas atrai o peso da melancolia.',
  },
  cripta: {
    id: 'cripta',
    nome: 'Cripta dos Fundadores',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Guardiões do Silêncio dos Ossos.',
    passadoGuerraDeuses: 'Câmara mortuária erguida sobre os fragmentos da lança quebrada de São Vandro.',
    marcaDasBruxas: 'Três nichos tiveram seus nomes raspados: eram devotos da Bruxa da Ganância que venderam seus filhos.',
    supersticaoPopular: 'A vela do corredor nunca se apaga; se apagar, as mãos invisíveis da Preguiça descem a escada.',
  },
  floresta: {
    id: 'floresta',
    nome: 'Mata de Corvos',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'O Velho dos Galhos (Vintrath) e o medo do Oculto.',
    passadoGuerraDeuses: 'Antiga floresta de caça real onde cadáveres de bestas estelares apodreceram e viraram húmus.',
    marcaDasBruxas: 'A Árvore dos Enforcados acolheu mães desesperadas que fugiram do abraço devorador da Inveja.',
    supersticaoPopular: 'Quem ouve um corvo falar o próprio nome deve jogar um dente no chão e correr sem olhar para trás.',
  },
  ponte: {
    id: 'ponte',
    nome: 'Coto da Ponte Caída',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Preces aos Afogados do Rio-Verde.',
    passadoGuerraDeuses: 'Os padres diziam que as fundações de pedra branca foram abençoadas para durar para sempre. Duraram trezentos anos.',
    marcaDasBruxas: 'O relatório da guarda diz que foi sabotagem. Quem desceu ao leito diz que nenhuma pedra tem marca de ferramenta, e as velhas dizem que foi a Invejosa.',
    supersticaoPopular: 'À meia-noite ainda se ouve os passos da Leva marchando no vazio sobre as águas.',
  },
  moinho: {
    id: 'moinho',
    nome: 'Moinho do Rio-Verde',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Espíritos das Correntes Fluviais.',
    passadoGuerraDeuses: 'O açude foi cavado pela queda de um escudo sagrado durante a Guerra Primordial.',
    marcaDasBruxas: 'A roda d’água parou na noite do massacre das bruxas e trava se alguém tentar forçar sem reza.',
    supersticaoPopular: 'A farinha moída na lua minguante amarga com as cinzas da Grande Guerra.',
  },
  cemiterio: {
    id: 'cemiterio',
    nome: 'Campo de Pedras',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Culto às Cava-Fundo e aos Mortos sem Nome.',
    passadoGuerraDeuses: 'Encosta de solo instável saturada por resíduos divinos que empurram as covas colina abaixo.',
    marcaDasBruxas: 'Muitas lápides não cobrem corpos, mas roupas de rapazes levados pelo Tributo de Sangue aos dezoito anos.',
    supersticaoPopular: 'Cova que amanhece aberta não foi desenterrada por homens: a terra cuspiu o que rejeitou.',
  },
  lago: {
    id: 'lago',
    nome: 'Espelho de Halvet',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'A Senhora das Marés e os Afogados.',
    passadoGuerraDeuses: 'Água que brotou pura para lavar as feridas do Forjador Vandul.',
    marcaDasBruxas: 'Dizem que no fundo do lago jaz o reflexo da Bruxa da Luxúria, atraindo os pescadores incautos.',
    supersticaoPopular: 'Quem se debruça no barco e vê os próprios olhos brilhando em roxo nunca mais alcança a praia.',
  },
  casa_senhorial: {
    id: 'casa_senhorial',
    nome: 'A Casa de Pedra',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Altar Solene de Sol-Voraz.',
    passadoGuerraDeuses: 'Edificada com blocos retirados da Fortaleza Branca dos Santos da Ordem.',
    marcaDasBruxas: 'O porão de ferro guarda correntes que prenderam um Apóstolo do Culto da Bruxa.',
    supersticaoPopular: 'As janelas altas estão sempre cerradas para que a Inveja não enxergue a linhagem de Halvet definhar.',
  },
  acampamento: {
    id: 'acampamento',
    nome: 'Acampamento dos Sem-Nome',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Nenhuma. Rejeitam os santos e cospem no chão para os deuses.',
    passadoGuerraDeuses: 'Trincheira de refugiados esquecida desde as marchas militares antigas.',
    marcaDasBruxas: 'Muitos que chegam aqui fogem do estigma de terem nascido com olhos cor de ametista ou cabelos albinos.',
    supersticaoPopular: 'Quem assume o nome "Sem-Nome" apaga seu rastro perante o livro da Bruxa da Ganância.',
  },
  ruinas: {
    id: 'ruinas',
    nome: 'Ruínas Calcinadas de Mir',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Antigo Templo Ecumênico do Conclave.',
    passadoGuerraDeuses: 'Local onde os deuses e os primeiros magos sentaram-se em tratado antes da quebra cósmica.',
    marcaDasBruxas: 'Arrasada pela Coroa quando esmagou a revolta. O povo diz que as cinzas são da Invejosa, porque é mais fácil culpar uma bruxa do que um rei.',
    supersticaoPopular: 'Nunca diga a palavra "Mir" perto de um recém-nascido; o cheiro de cinzas atrai a sombra devoradora.',
  },
  estrada: {
    id: 'estrada',
    nome: 'Estrada do Sal',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Preces aos Marcos de Pedra Protetores.',
    passadoGuerraDeuses: 'Rota militar esculpida para transporte de catapultas celestes durante a guerra dos deuses.',
    marcaDasBruxas: 'Os marcos de milha têm nomes raspados para desorientar os Apóstolos do Culto da Bruxa.',
    supersticaoPopular: 'Quem viaja sem uma pitada de sal grosso na bota acorda com as pernas dormentes da Preguiça.',
  },
  torre: {
    id: 'torre',
    nome: 'Torre do Vigia',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Sino Consagrado aos Santos da Vigília.',
    passadoGuerraDeuses: 'Pilar de observação erguido sobre a ossada de um arconte dos céus.',
    marcaDasBruxas: 'No salão inferior repousa um constructo de vidro imune às mãos invisíveis da Preguiça.',
    supersticaoPopular: 'Se o sino tocar à meia-noite sem vento, as bestas da Gula romperam a cerca do vale.',
  },
  mina: {
    id: 'mina',
    nome: 'Mina Velha de Ferro',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'Preces silenciosas a Vandul nas galerias profundas.',
    passadoGuerraDeuses: 'Túneis escavados onde uma veia de sangue divino solidificou-se em minério negro.',
    marcaDasBruxas: 'A galeria inferior foi lacrada com doze vigas após mineiras ouvirem o choro da Bruxa da Tristeza ecoar na rocha.',
    supersticaoPopular: 'Bater na pedra três vezes antes de cavar: uma para o ferro, uma para a viga e uma para a alma.',
  },
  mansao_ubuyashiki: {
    id: 'mansao_ubuyashiki',
    nome: 'Casa Sem Nome na Névoa',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'O Voto Solene do Alvorecer.',
    passadoGuerraDeuses: 'Santuário secreto protegido por brumas densas originadas da respiração divina de Yrmara.',
    marcaDasBruxas: 'Seus registros contêm o único mapa dos fragmentos das almas deixadas pelas bruxas massacradas.',
    supersticaoPopular: 'Quem a casa não quer receber vaga em círculos na névoa até sair na estrada sem lembrar do caminho.',
  },
  castelo_infinito: {
    id: 'castelo_infinito',
    nome: 'O Castelo Dimensional Infinito',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'A Heresia do Progenitor da Noite.',
    passadoGuerraDeuses: 'Espaço dobrado na fenda onde a realidade ruiu sob o impacto do machado de Vandul.',
    marcaDasBruxas: 'Arquitetura que zomba das leis do espaço, reflexo distorcido da autoridade da Vã-Glória.',
    supersticaoPopular: 'O eco de uma biwa ao longe significa que uma sala do mundo mudou de lugar.',
  },
  vila_ferreiros: {
    id: 'vila_ferreiros',
    nome: 'Vila Oculta dos Ferreiros',
    regiao: 'Vale de Halvet',
    divindadeOuCrenca: 'A Chama Perpétua do Aço Solar.',
    passadoGuerraDeuses: 'Local onde se recolhem as areias de ferro banhadas pelo sangue de Sol-Voraz.',
    marcaDasBruxas: 'Forjam lâminas especiais que revelam a cor da alma e cortam o miasma das bestas da Gula.',
    supersticaoPopular: 'Ferreira que quebra uma lâmina na têmpera deve jejuar três dias para afastar o olhar da Soberba.',
  },

  // ── Marca de Tessel (Fronteira Militar Norte) ──
  tessel: {
    id: 'tessel',
    nome: 'Fortaleza de Tessel',
    regiao: 'Marca de Tessel',
    divindadeOuCrenca: 'Bastião dos Cavaleiros do Selo e Altares de Sol-Voraz.',
    passadoGuerraDeuses: 'A grande muralha foi erguida sobre a espinha dorsal petrificada de um leviatã celeste.',
    marcaDasBruxas: 'Primeira linha de defesa contra os bandos heréticos e feras que o povo chama de cria da Faminta.',
    supersticaoPopular: 'Cão que uiva para o norte em noite sem lua viu a sombra da Inveja caminhando sobre o gelo.',
  },
  forte_agulha: {
    id: 'forte_agulha',
    nome: 'Forte da Agulha',
    regiao: 'Marca de Tessel',
    divindadeOuCrenca: 'Voto Marcial dos Lanceiros do Selo.',
    passadoGuerraDeuses: 'Posto avançado construído em volta de um obelisco de granito deixado pelos deuses da ordem.',
    marcaDasBruxas: 'Muralhas cravejadas de pontas de ferro para repelir quimeras voadoras da Gula.',
    supersticaoPopular: 'Soldado que dorme na vigia tem o nome escrito no livro negro da Preguiça.',
  },
  casa_da_agulha: {
    id: 'casa_da_agulha',
    nome: 'Casa da Agulha',
    regiao: 'Marca de Tessel',
    divindadeOuCrenca: 'Santuário dos Mestres de Armas.',
    passadoGuerraDeuses: 'Antiga forja de pontas de lança abençoadas pelo sopro de Vandul.',
    marcaDasBruxas: 'Guarda manuais de combate criados para perfurar corpos possuídos por autoridades de bruxas.',
    supersticaoPopular: 'Aço que canta na bainha pede sangue antes do pôr do sol.',
  },
  passo_lobo: {
    id: 'passo_lobo',
    nome: 'Passo do Lobo',
    regiao: 'Marca de Tessel',
    divindadeOuCrenca: 'Espíritos Ferais da Tundra.',
    passadoGuerraDeuses: 'Garganta rochosa aberta por uma espada colossal na batalha do firmamento.',
    marcaDasBruxas: 'Território de caça das matilhas monstruosas geradas pela fome insaciável da Bruxa da Gula.',
    supersticaoPopular: 'Nunca viaje o passo sozinho: o uivo do lobo do ermo imita a voz da mãe de quem escuta.',
  },
  vila_pedravel: {
    id: 'vila_pedravel',
    nome: 'Pedravel',
    regiao: 'Marca de Tessel',
    divindadeOuCrenca: 'Culto aos Antepassados do Granito.',
    passadoGuerraDeuses: 'Casas escavadas diretamente nas rochas onde guerreiros divinos amolaram seus escudos.',
    marcaDasBruxas: 'Aldeões usam cruzes de pedra no pescoço para afastar o toque esmagador do Bruxo da Tristeza.',
    supersticaoPopular: 'Pão amassado com água do degelo não se oferece a forasteiro sem bênção.',
  },
  campo_ceifa: {
    id: 'campo_ceifa',
    nome: 'Campo da Ceifa',
    regiao: 'Marca de Tessel',
    divindadeOuCrenca: 'Ritos da Colheita Sobrevivente.',
    passadoGuerraDeuses: 'Planície que serviu de cemitério coletivo na primeira grande leva de combatentes.',
    marcaDasBruxas: 'O trigo cresce com tom arroxeado nas áreas onde o sangue das bruxas tocou a terra.',
    supersticaoPopular: 'Espiga que nasce bifurcada deve ser queimada na fogueira dos santos.',
  },
  capela_campo: {
    id: 'capela_campo',
    nome: 'Capela do Campo Branco',
    regiao: 'Marca de Tessel',
    divindadeOuCrenca: 'A Ordem dos Monges Silenciosos do Selo.',
    passadoGuerraDeuses: 'Refúgio erguido sobre um poço de cura consagrado por preces antigas.',
    marcaDasBruxas: 'Guarda fragmentos das roupas brancas da Bruxa da Vã-Glória, isolados sob três redomas de chumbo.',
    supersticaoPopular: 'Monge que sonha com mulher de prata acorda sem voz para sempre.',
  },

  // ── Bosque de Vintra (Mata Antiga a Oeste) ──
  vintra: {
    id: 'vintra',
    nome: 'Cidadela de Vintra',
    regiao: 'Bosque de Vintra',
    divindadeOuCrenca: 'O Velho dos Galhos (Vintrath) e o Carvalho Centenário.',
    passadoGuerraDeuses: 'Baluarte dos povos da floresta erguido onde um deus selvagem sangrou no musgo.',
    marcaDasBruxas: 'As adegas guardam barris selados com vinho de 400 anos, prensado antes do massacre das bruxas.',
    supersticaoPopular: 'Vinho que pinga no chão sem oferenda traz o cheiro do luto para a mesa da família.',
  },
  aldeia_carvoeira: {
    id: 'aldeia_carvoeira',
    nome: 'Aldeia Carvoeira',
    regiao: 'Bosque de Vintra',
    divindadeOuCrenca: 'Os Espíritos da Fumaça e da Brasa.',
    passadoGuerraDeuses: 'Covas de carvão escavadas sobre florestas fósseis queimadas pelo fogo divino de Sol-Voraz.',
    marcaDasBruxas: 'A fumaça afasta as mãos invisíveis da Preguiça; por isso os fornos nunca se apagam.',
    supersticaoPopular: 'Carvoeiro com cinza preta nos olhos não tem medo de fantasma, mas foge de sombra sem corpo.',
  },
  clareira_pedras: {
    id: 'clareira_pedras',
    nome: 'Clareira das Sete Pedras',
    regiao: 'Bosque de Vintra',
    divindadeOuCrenca: 'Alinhamento Druídico Ancestral.',
    passadoGuerraDeuses: 'Monólitos erguidos para canalizar o mana das veias rompidas da terra.',
    marcaDasBruxas: 'Sete menires que representam as Sete Bruxas dos Pecados antes de serem aniquiladas pela Inveja.',
    supersticaoPopular: 'Quem senta na pedra do centro na lua nova ouve sussurros da biblioteca da Escrivã.',
  },
  pantano_lodo: {
    id: 'pantano_lodo',
    nome: 'Pântano do Lodo Negro',
    regiao: 'Bosque de Vintra',
    divindadeOuCrenca: 'Os Deuses da Podridão e da Renovação.',
    passadoGuerraDeuses: 'Depressão lodosa onde apodreceram os restos de armaduras dos exércitos celestes.',
    marcaDasBruxas: 'Infestado pelos vermes e sanguessugas gigantes que o povo diz serem cria da Faminta.',
    supersticaoPopular: 'Fogo-fátuo que pula duas vezes no charco é riso de bruxa morta chamando para o fundo.',
  },
  aldeia_lenha: {
    id: 'aldeia_lenha',
    nome: 'Povoado dos Madeireiros',
    regiao: 'Bosque de Vintra',
    divindadeOuCrenca: 'Respeito ao Machado e aos Juramentos de Madeira.',
    passadoGuerraDeuses: 'Trilhas de transporte de troncos para os navios de guerra dos tempos primordiais.',
    marcaDasBruxas: 'Árvores com nós que parecem rostos chorando: dizem ser os que olharam para a Encantadora e esqueceram de piscar.',
    supersticaoPopular: 'Machado que escorrega e corta o pé do lenhador foi enfeitiçado pela preguiça.',
  },

  // ── Planalto de Corveira (Forjas de Adamante ao Sul/Centro) ──
  corveira: {
    id: 'corveira',
    nome: 'Cidade Mineira de Corveira',
    regiao: 'Planalto de Corveira',
    divindadeOuCrenca: 'Catedral Subterrânea de Vandul.',
    passadoGuerraDeuses: 'Cratera titânica onde o Forjador Vandul caiu com sua bigorna incandescente.',
    marcaDasBruxas: 'Seus arsenais foram forjados para resistir ao ataque da Inveja quando o mundo antigo se partiu.',
    supersticaoPopular: 'Ouro achado em veio virgem deve pagar dez por cento ao templo antes de ir à balança.',
  },
  aldeia_ferro: {
    id: 'aldeia_ferro',
    nome: 'Vila do Ferro Frio',
    regiao: 'Planalto de Corveira',
    divindadeOuCrenca: 'Irmandade dos Fundidores de Vandul.',
    passadoGuerraDeuses: 'Fornos antigos alimentados pelas emanações de calor das fendas divinas.',
    marcaDasBruxas: 'Aqui se funde o ferro negro que aprisiona os Apóstolos do Culto da Bruxa.',
    supersticaoPopular: 'Gota de metal derretido que cai na água em forma de garra avisa perigo na montanha.',
  },
  mina_corveira: {
    id: 'mina_corveira',
    nome: 'Grandes Galerias de Corveira',
    regiao: 'Planalto de Corveira',
    divindadeOuCrenca: 'Protetores dos Poços Escuros.',
    passadoGuerraDeuses: 'A mais profunda escavação do homem, atingindo a couraça de pedra do mundo antigo.',
    marcaDasBruxas: 'No nível trinta e três encontra-se a "Porta Trancada por Dentro", intocada desde o massacre das bruxas.',
    supersticaoPopular: 'Mineiro que escuta sino no fundo da terra apaga a lanterna e senta de costas para a parede.',
  },
  colina_forcados: {
    id: 'colina_forcados',
    nome: 'Colina dos Enforcados',
    regiao: 'Planalto de Corveira',
    divindadeOuCrenca: 'O Julgamento da Soberba e o Medo da Lei.',
    passadoGuerraDeuses: 'Ponto alto onde os generais do firmamento empalavam os rebeldes.',
    marcaDasBruxas: 'Inspirada no tribunal da Juíza Typhon: quem mente diante da forca tem os membros partidos pela própria consciência.',
    supersticaoPopular: 'Corvo pousado em corda vazia aponta o próximo condenado com o bico.',
  },
  mosteiro_alto: {
    id: 'mosteiro_alto',
    nome: 'Mosteiro do Alto da Serra',
    regiao: 'Planalto de Corveira',
    divindadeOuCrenca: 'A Ordem Contemplativa dos Santos do Selo.',
    passadoGuerraDeuses: 'Ermida construída sobre o cume onde um anjo de Sol-Voraz tocou trombeta na batalha final.',
    marcaDasBruxas: 'Guarda as transcrições das últimas palavras das bruxas antes de serem engolidas pelas sombras da Inveja.',
    supersticaoPopular: 'Vento que uiva pelas frestas do campanário repete os nomes dos pecados capitais.',
  },
  vila_terraco: {
    id: 'vila_terraco',
    nome: 'Vila dos Terraços de Minério',
    regiao: 'Planalto de Corveira',
    divindadeOuCrenca: 'Culto aos Degraus da Rocha.',
    passadoGuerraDeuses: 'Escadarias gigantescas esculpidas para os pés dos titãs de ferro.',
    marcaDasBruxas: 'Muralhas construídas para conter as feras que o povo chama de cria da Faminta.',
    supersticaoPopular: 'Pedra que rola sozinha do terraço de cima foi empurrada por mão invisível.',
  },
  forja_afundada: {
    id: 'forja_afundada',
    nome: 'A Forja Afundada',
    regiao: 'Planalto de Corveira',
    divindadeOuCrenca: 'A Centelha Sagrada Primordial.',
    passadoGuerraDeuses: 'Fosso de magma que nunca esfria, remanescente do impacto do martelo de Vandul.',
    marcaDasBruxas: 'Diz-se que aqui Minerva, a Colérica, curou uma aldeia inteira de febre gritando uma noite inteira.',
    supersticaoPopular: 'Água lançada no poço de lava ferve em vapor que profetiza desgraças da guerra.',
  },

  // ── Ermo de Solgar (Deserto Amarelo a Sudoeste) ──
  solgar: {
    id: 'solgar',
    nome: 'Oásis Imperial de Solgar',
    regiao: 'Ermo de Solgar',
    divindadeOuCrenca: 'O Culto Majestoso do Sol Radiante (Sol-Voraz).',
    passadoGuerraDeuses: 'Oásis nascido da gota de lágrima que o deus solar verteu sobre a areia calcinada.',
    marcaDasBruxas: 'Fogueiras de incenso são mantidas acesas dia e noite nos muros: o fogo afasta as sombras da Inveja.',
    supersticaoPopular: 'Quem entra no deserto sem queimar incenso nos portões acorda com as pegadas da sombra ao lado da tenda.',
  },
  poco_seco: {
    id: 'poco_seco',
    nome: 'Poço Seco de Al-Vadir',
    regiao: 'Ermo de Solgar',
    divindadeOuCrenca: 'Espíritos da Sede e da Penúria.',
    passadoGuerraDeuses: 'Antiga cisterna que sustentava os destacamentos solares na Grande Guerra.',
    marcaDasBruxas: 'Secou no instante exato em que a Bruxa da Inveja devorou as fontes de água do sul.',
    supersticaoPopular: 'Gritar dentro do poço seco devolve a voz de quem você mais sente falta.',
  },
  caravancerai: {
    id: 'caravancerai',
    nome: 'Caravançarai dos Três Ventos',
    regiao: 'Ermo de Solgar',
    divindadeOuCrenca: 'Os Santos Guias dos Viajantes do Deserto.',
    passadoGuerraDeuses: 'Pátio fortificado que repousa sobre as ruínas de um mercado celeste.',
    marcaDasBruxas: 'Mercadores vendem cópias clandestinas de páginas do livro da Escrivã.',
    supersticaoPopular: 'Camelo que empaca diante do portão farejou apóstolo do culto da bruxa na estalagem.',
  },
  ruina_areia: {
    id: 'ruina_areia',
    nome: 'Necrópole das Dunas Negras',
    regiao: 'Ermo de Solgar',
    divindadeOuCrenca: 'Templos Perdidos dos Deuses Esquecidos.',
    passadoGuerraDeuses: 'Cúpulas de arenito dourado soterradas pela tempestade que encerrou a Guerra dos Deuses.',
    marcaDasBruxas: 'Suposto túmulo da Bruxa da Gula, onde bestas de duas cabeças ainda guardam os sarcófagos.',
    supersticaoPopular: 'Areia que canta ao vento à noite repete os segredos que a Escrivã deixou enterrados.',
  },

  // ── Costa de Mareu (Portos e Marés a Sudeste) ──
  mareu: {
    id: 'mareu',
    nome: 'Porto Branco de Mareu',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'A Catedral dos Navegantes de Yrmara.',
    passadoGuerraDeuses: 'As falésias brancas foram erguidas pelas mãos marinhas de Yrmara para frear as chamas de Sol-Voraz.',
    marcaDasBruxas: 'As águas do ancoradouro guardam a lenda da Encantadora: marinheiros juram ouvir cantos de fascínio da névoa.',
    supersticaoPopular: 'Barco que zarpa sem amarrar fita azul no mastro atrai o abraço sufocante das águas.',
  },
  porto_sal: {
    id: 'porto_sal',
    nome: 'Armazéns do Porto do Sal',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'A Guilda dos Mercadores dos Santos do Selo.',
    passadoGuerraDeuses: 'Salinas milenares que cristalizaram o mar salgado durante a queima cósmica.',
    marcaDasBruxas: 'O sal daqui é benzido com três ritos e exportado para todo o continente como proteção contra a Bruxa da Inveja.',
    supersticaoPopular: 'Derrubar saco de sal no cais exige cuspir três vezes por cima do ombro esquerdo.',
  },
  farol_quebrado: {
    id: 'farol_quebrado',
    nome: 'Farol das Marés Quebradas',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'O Olho Solitário da Rocha.',
    passadoGuerraDeuses: 'Torre de pedra negra construída para guiar as arcas dos deuses do oceano.',
    marcaDasBruxas: 'A lente colossal quebrou na noite em que as sombras da Inveja subiram do abismo marinho.',
    supersticaoPopular: 'Luz que pisca no farol abandonado à noite não vem de lamparina: são os olhos das bruxas afogadas.',
  },
  aldeia_rede: {
    id: 'aldeia_rede',
    nome: 'Aldeia das Redes Trançadas',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'Pescadoras de Yrmara e Culto aos Peixes Prateados.',
    passadoGuerraDeuses: 'Vila assentada sobre conchas fósseis gigantescas do início dos tempos.',
    marcaDasBruxas: 'Redes trançadas com cabelos de afogadas para não rasgar nas mandíbulas das quimeras do mar.',
    supersticaoPopular: 'Peixe que vem com escama roxa deve ser devolvido vivo à onda na mesma hora.',
  },
  estrada_costeira: {
    id: 'estrada_costeira',
    nome: 'Falésias da Estrada Costeira',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'Marcos de Pedra dos Naufrágios.',
    passadoGuerraDeuses: 'Caminho cortado a machado nas falésias pelos primeiros colonizadores celestes.',
    marcaDasBruxas: 'Fendas onde o vento produz sons de luto, herança do luto de Hector, o Enlutado.',
    supersticaoPopular: 'Caminhar na beirada do abismo ao entardecer convida a mão invisível da Preguiça a empurrá-lo.',
  },
  forrarborg: {
    id: 'forrarborg',
    nome: 'Forrarborg Aelha',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'A Fogueira que Responde: o fogo do topo seria aceso por quem morreu de vigia.',
    passadoGuerraDeuses: 'O morro seria o dedo de um gigante que caiu apontando para o deserto.',
    marcaDasBruxas: 'As pedras do topo são pretas de fogo antigo; a Ordem diz que ali queimaram hereges do Culto da Bruxa.',
    supersticaoPopular: 'Se a fogueira da torre acende sozinha, uma caravana vai morrer no Deserto dos Crânios.',
  },
  ponta_areia: {
    id: 'ponta_areia',
    nome: 'Ponta da Areia',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'Oferendas de sal na última pedra, para a maré devolver quem levou.',
    passadoGuerraDeuses: 'A língua de areia seria o rastro de uma serpente do mar que se arrastou para morrer em terra.',
    marcaDasBruxas: 'Na maré mais baixa do ano aparecem ossos grandes demais nas pedras de fora; o padre manda cobrir com areia.',
    supersticaoPopular: 'Quem conta os barcos puxados na duna e erra a conta vai sair ao mar e não voltar.',
  },
  mercado_peixe: {
    id: 'mercado_peixe',
    nome: 'Mercado das Docas de Peixe',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'A Bênção das Redes Cheias.',
    passadoGuerraDeuses: 'Antiga rampa de desembarque de tributos marítimos dos reinos antigos.',
    marcaDasBruxas: 'Balcões de pedra onde monges inspecionam o pescado em busca de mutações que atribuem à Faminta.',
    supersticaoPopular: 'Pagar peixe com moeda suja de ferrugem atrai calmaria sem vento no mar.',
  },

  // ── Halvern e os Baixios ──
  estrada_real: {
    id: 'estrada_real',
    nome: 'A Grande Estrada Real de Halvern',
    regiao: 'Halvern',
    divindadeOuCrenca: 'Os Santos Patronos da Coroa e da Lei.',
    passadoGuerraDeuses: 'A espinha viária do continente antigo, calçada com pedras trazidas do palácio do Sol-Voraz.',
    marcaDasBruxas: 'Postos de guarda antigos onde os Cavaleiros do Selo caçavam peregrinos suspeitos de bruxaria.',
    supersticaoPopular: 'Carroça que quebra o eixo na estrada real tem que deixar uma vela no marco para a alma não ficar para trás.',
  },
  vau_pedra: {
    id: 'vau_pedra',
    nome: 'O Vau de Pedra',
    regiao: 'Baixios de Halvern',
    divindadeOuCrenca: 'Preces aos Santos dos Passos Seguros.',
    passadoGuerraDeuses: 'Lajes naturais colocadas como passadeiras durante a marcha dos deuses para a batalha.',
    marcaDasBruxas: 'A água que corre sobre as pedras tem sabor ferroso do sangue divino que nunca secou.',
    supersticaoPopular: 'Atravessar o vau à meia-noite sem molhar o queixo faz a sombra da pessoa desaparecer por um ano.',
  },
  charco_juncal: {
    id: 'charco_juncal',
    nome: 'Charco do Juncal',
    regiao: 'Baixios de Halvern',
    divindadeOuCrenca: 'A Senhora das Águas Paradas e dos Juncos.',
    passadoGuerraDeuses: 'Bacia de água estagnada formada pela pegada de um titã celeste abatido.',
    marcaDasBruxas: 'Ninhos de sanguessugas negras e quimeras aquáticas que o povo diz serem cria da Faminta.',
    supersticaoPopular: 'Quem colhe junco com as duas mãos amaldiçoa o parto da filha mais velha.',
  },
  vila_juncal: {
    id: 'vila_juncal',
    nome: 'Vila dos Pescadores do Junco',
    regiao: 'Baixios de Halvern',
    divindadeOuCrenca: 'A Fé Humilde das Chupadas de Lama.',
    passadoGuerraDeuses: 'Povoamento camponês assentado sobre estacas que repousam em armaduras oxidadas.',
    marcaDasBruxas: 'Aldeões trançam bonecos de palha para atrair o mau-olhado da Inveja e jogam na correnteza todo solstício.',
    supersticaoPopular: 'Porta que fica aberta para o charco deixa o ar da melancolia entrar na casa.',
  },
  toca_juncal: {
    id: 'toca_juncal',
    nome: 'A Toca Escondida no Juncal',
    regiao: 'Baixios de Halvern',
    divindadeOuCrenca: 'Nenhuma. Esconderijo de proscritos e contrabandistas.',
    passadoGuerraDeuses: 'Refúgio de ladrões escavado num banco de areia criado pela queda de um carro divino.',
    marcaDasBruxas: 'Local onde se comercializam relicários proibidos contendo cinzas do massacre de Mir.',
    supersticaoPopular: 'Falar o nome de um guarda traz a patrulha; falar o nome da Inveja traz o fim do mundo.',
  },

  // ── Tsukimichi & Ermos Adjacentes ──
  tsige_distrito_comercial: {
    id: 'tsige_distrito_comercial',
    nome: 'Distrito Comercial de Tsige',
    regiao: 'Tsige',
    divindadeOuCrenca: 'O Deus das Moedas e dos Contratos Comerciais.',
    passadoGuerraDeuses: 'Cidade fronteiriça assentada na borda do mundo onde os homens negociam a sobrevivência.',
    marcaDasBruxas: 'Seus mercadores pagam ouro pesado por artefatos que anulam autoridades mágicas e bruxaria antiga.',
    supersticaoPopular: 'Balança de mercador que pende sem peso está pesando a ganância do comprador.',
  },
  tsige_guilda_aventureiros: {
    id: 'tsige_guilda_aventureiros',
    nome: 'Guilda dos Aventureiros de Tsige',
    regiao: 'Tsige',
    divindadeOuCrenca: 'A Orbe de Medição e o Rank de Sangue.',
    passadoGuerraDeuses: 'Construída para registrar quem ousa enfrentar os ermos que sobraram da guerra primordial.',
    marcaDasBruxas: 'A Orbe de Cristal vibra em tom negro diante de qualquer alma marcada pelo Fator de Pecado.',
    supersticaoPopular: 'Aventureiro de rank alto que não volta da Wasteland foi engolido pela névoa da calamidade.',
  },
  tsige_companhia_kuzunoha: {
    id: 'tsige_companhia_kuzunoha',
    nome: 'Sede da Companhia Kuzunoha',
    regiao: 'Tsige',
    divindadeOuCrenca: 'A soberania mútua e a confiança inabalável entre mestre e servas.',
    passadoGuerraDeuses: 'Erguida na interseção dimensional entre o mundo dos homens e as terras de além-fronteira.',
    marcaDasBruxas: 'Suas receitas medicinais curam maldições profundas que nem mesmo a Colérica sanou.',
    supersticaoPopular: 'Quem entra na Kuzunoha com respeito sai curado; quem entra com traição não sai.',
  },
  tsige_portao_ermo: {
    id: 'tsige_portao_ermo',
    nome: 'Portão de Ferro do Ermo',
    regiao: 'Tsige',
    divindadeOuCrenca: 'O Voto da Sentinela de Tsige.',
    passadoGuerraDeuses: 'Portão colossal reforçado com adamante para barrar as levas de bestas monstruosas.',
    marcaDasBruxas: 'Inscrições antigas alertam: "Além desta porta, o mundo ainda chora sob o massacre das bruxas".',
    supersticaoPopular: 'Olhar para o miasma do ermo por mais de uma hora rouba a cor dos olhos do sentinela.',
  },
  wasteland_fronteira: {
    id: 'wasteland_fronteira',
    nome: 'Fronteira da Wasteland (Grande Terra Desolada)',
    regiao: 'Grande Terra Desolada',
    divindadeOuCrenca: 'A Deusa Implacável do Banimento.',
    passadoGuerraDeuses: 'Cratera aberta pelo desterro e queda livre do protagonista através da estratosfera.',
    marcaDasBruxas: 'Terra calcinada saturada por miasma violento, onde feras mutantes vagam em agonia.',
    supersticaoPopular: 'Caminhar no ermo sem dominar o Kai é entregar a própria carne ao festim das quimeras.',
  },
  wasteland_desfiladeiro: {
    id: 'wasteland_desfiladeiro',
    nome: 'Desfiladeiro do Dragão Adormecido',
    regiao: 'Grande Terra Desolada',
    divindadeOuCrenca: 'O Pacto de Ilusão e Névoa (Muteki Shen / Tomoe).',
    passadoGuerraDeuses: 'Canion profundo esculpido pelo hálito milenar do dragão primordial.',
    marcaDasBruxas: 'Labirinto de bruma que aprisiona invasores em ilusões de suas maiores soberbas e medos.',
    supersticaoPopular: 'Névoa que tem cheiro de sake leva ao covil da serpente que corta o céu.',
  },
  wasteland_pantano_bruma: {
    id: 'wasteland_pantano_bruma',
    nome: 'Pântano Negro da Bruma',
    regiao: 'Grande Terra Desolada',
    divindadeOuCrenca: 'A Fome Calamitosa (Aranha da Calamidade / Mio).',
    passadoGuerraDeuses: 'Charco abissal onde o miasma da queda de um deus antigo condensou-se em piche mágico.',
    marcaDasBruxas: 'Ninho da Aranha Negra cuja voracidade quase engoliu o mundo, eco da autoridade da Gula.',
    supersticaoPopular: 'Fios pretos vibrando no ar significam que a Calamidade despertou para o banquete.',
  },
  wasteland_ninho_fenix: {
    id: 'wasteland_ninho_fenix',
    nome: 'Ninho Ardente da Fênix (Suzaku)',
    regiao: 'Grande Terra Desolada',
    divindadeOuCrenca: 'A Chama Solar Eterna de Suzaku.',
    passadoGuerraDeuses: 'Pico incandescente que mantém a chama viva do sol primitivo que nunca se apaga.',
    marcaDasBruxas: 'O fogo celestial queima qualquer miasma ou resquício corrupto de bruxaria ancestral.',
    supersticaoPopular: 'Pluma dourada que cai do cume cura a cegueira de quem tem coração destemido.',
  },
  rotsgard_distrito_central: {
    id: 'rotsgard_distrito_central',
    nome: 'Distrito Central de Rotsgard',
    regiao: 'Academia de Rotsgard',
    divindadeOuCrenca: 'A Deusa Suprema dos Homens.',
    passadoGuerraDeuses: 'Metrópole acadêmica erguida sobre os fundamentos da civilização hyuman.',
    marcaDasBruxas: 'Bibliotecas que tentam ocultar os pecados do mundo antigo sob tratados de nobreza e linhagem.',
    supersticaoPopular: 'Erudito que cita a Bruxa da Inveja em tese acadêmica tem seu diploma queimado na praça.',
  },
  rotsgard_biblioteca_arcanum: {
    id: 'rotsgard_biblioteca_arcanum',
    nome: 'Grande Arquivo Arcanum',
    regiao: 'Academia de Rotsgard',
    divindadeOuCrenca: 'O Culto da Teoria Mágica e dos Tomos Selados.',
    passadoGuerraDeuses: 'Cripta de manuscritos resgatados das chamas da Guerra Primordial.',
    marcaDasBruxas: 'O setor restrito contém cópias censuradas dos páginas da Escrivã Echidna.',
    supersticaoPopular: 'Tomo com capa de pele que sangra quando aberto nunca deve ser lido sem três amuletos de chumbo.',
  },
  asora_vila_central: {
    id: 'asora_vila_central',
    nome: 'Vila Central de Asora',
    regiao: 'Subespaço de Asora',
    divindadeOuCrenca: 'O Soberano de Asora e a Harmonia Interespécies.',
    passadoGuerraDeuses: 'Dimensão idílica criada pelo pacto supremo entre o protagonista, Shen e a Calamidade.',
    marcaDasBruxas: 'Espaço incorruptível onde o miasma da Inveja e as maldições do mundo exterior não conseguem penetrar.',
    supersticaoPopular: 'Em Asora, quem trabalha com amor recebe a bênção de um solo que produz três colheitas por estação.',
  },
  asora_forja_anoes: {
    id: 'asora_forja_anoes',
    nome: 'Complexo de Forja dos Anões Antigos',
    regiao: 'Subespaço de Asora',
    divindadeOuCrenca: 'O Orgulho da Criação e o Aço Celestial.',
    passadoGuerraDeuses: 'Oficinas subterrâneas dos Eldwa onde a têmpera transcende o ferro de Vandul.',
    marcaDasBruxas: 'Criam armas e anéis capazes de canalizar e conter reservas colossais de mana sem explodir.',
    supersticaoPopular: 'Martelo que acerta a bigorna no compasso certo ecoa a música de fundação do mundo.',
  },
  asora_fontes_termais: {
    id: 'asora_fontes_termais',
    nome: 'Fontes Termais Naturais de Asora',
    regiao: 'Subespaço de Asora',
    divindadeOuCrenca: 'O Descanso e a Pureza dos Corpos.',
    passadoGuerraDeuses: 'Águas vulcânicas enriquecidas por minerais primordiais que restauram vigor e vigor espiritual.',
    marcaDasBruxas: 'Águas que lavam o estresse, o ciúme e restauram afeto genuíno entre o protagonista e suas servas.',
    supersticaoPopular: 'Banquete servido nas termas sob o luar renova o pacto de lealdade eterna.',
  },
  asora_atelie_seda: {
    id: 'asora_atelie_seda',
    nome: 'Ateliê de Fiação e Tecelagem de Seda',
    regiao: 'Subespaço de Asora',
    divindadeOuCrenca: 'O Voto da Fiação Divina de Mio.',
    passadoGuerraDeuses: 'Teares mágicos movidos por fios celestes colhidos da carapaça da Calamidade.',
    marcaDasBruxas: 'Produz quimonos e vestimentas imunes a cortes mágicos e fogo de bruxaria.',
    supersticaoPopular: 'Vestir a seda de Asora faz o coração bater no mesmo ritmo dos guardiões da névoa.',
  },
};
