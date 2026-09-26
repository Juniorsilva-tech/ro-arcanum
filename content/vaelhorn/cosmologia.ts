// ARCANUM · Cosmologia, Religião, Guerra dos Deuses & As Bruxas dos Pecados.
//
// A magia deste mundo não é uma força harmoniosa: é o sangue pisado e as cinzas
// de uma guerra primordial entre Deuses. Abaixo deles ergueram-se as Bruxas dos
// Pecados e os Bruxos esquecidos, cujas Autoridades rasgaram nações até que uma
// só — a Bruxa da Inveja — devorou suas irmãs e engoliu metade do mundo.

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

// ── 1. A GUERRA PRIMORDIAL DOS DEUSES & O SANGUE DO MANA ────────────────────
export const MITO_ORIGEM_MAGIA = {
  titulo: 'A Guerra do Firmamento & A Queda dos Deuses',
  texto:
    'Antes de haver reis, muros ou calendários, os Deuses Maiores digladiaram-se sobre o continente ' +
    'numa carnificina que partiu as montanhas e ferveu os oceanos. Não houve vencedores: as divindades ' +
    'tombaram trespassadas por lanças celestes e suas carcaças afundaram na crosta terrestre. ' +
    'O que os homens chamam de "Mana" nada mais é do que o sangue estelar e o miasma incandescente ' +
    'desses cadáveres divinos escorrendo pelas veias da terra. Toda conjuração mágica é uma profanação: ' +
    'um sussurro que acorda a dor de um deus sepultado sob as pedras.',
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

// ── 2. AS BRUXAS DOS PECADOS & A BRUXA DA INVEJA ────────────────────────────
export const BRUXAS_DOS_PECADOS: BruxaPecado[] = [
  {
    id: 'inveja',
    pecado: 'Inveja',
    nome: 'Satella · A Bruxa da Inveja',
    autoridade: 'A Sombra Infinita & O Devoramento do Destino',
    naturezaPoder:
      'Manifesta mares de mãos negras espectrais capazes de engolir montanhas, rasgar a causalidade e ' +
      'apagar cidades inteiras da existência. Seu amor é doentio, possessivo e absoluto.',
    desfecho:
      'Há 400 anos consumiu e massacrou todas as outras Bruxas dos Pecados, engoliu metade de todo o mundo ' +
      'e só pôde ser confinada num Santuário Selado pela aliança sacrifical do Santo da Espada, do Dragão Divino e do Grande Sábio.',
    reliquiaOuMarca:
      'O Manto das Sombras Vivas e o terror milenar. Dizer seu nome atrai desgraça imediata; é o maior tabu do continente.',
  },
  {
    id: 'soberba',
    pecado: 'Soberba',
    nome: 'Typhon · A Bruxa do Orgulho',
    autoridade: 'Juízo da Consciência Inexorável',
    naturezaPoder:
      'Uma criança de olhar cândido cujo toque não fere a carne, mas quebra os ossos e decepa membros ' +
      'na proporção exata da culpa que o próprio indivíduo abriga no fundo da própria alma.',
    desfecho: 'Devorada e desfeita pelo turbilhão sombrio da Bruxa da Inveja.',
    reliquiaOuMarca: 'A Balança de Vidro Negro e os ossos de julgadores antigos.',
  },
  {
    id: 'ira',
    pecado: 'Ira',
    nome: 'Minerva · A Bruxa da Cólera',
    autoridade: 'Cura Destrutiva por Impacto Sísmico',
    naturezaPoder:
      'Odiava a dor alheia com uma fúria incontrolável. Seus socos estrondosos fecham qualquer ferida e curam qualquer ' +
      'enfermidade instantaneamente, mas a força do golpe arrebenta a terra e derruba vilas ao redor.',
    desfecho: 'Engolida pelas sombras famintas da Inveja ao tentar curar uma terra que já morria.',
    reliquiaOuMarca: 'Fitas escarlates de guerra e o punho de ferro estilhaçado.',
  },
  {
    id: 'preguica',
    pecado: 'Preguiça',
    nome: 'Sekhmet · A Bruxa do Torpor',
    autoridade: 'As Mãos Ocultas & O Peso do Fim',
    naturezaPoder:
      'A mais forte das irmãs em combate físico puro. Respirar já lhe causava tédio e dor; movimentava centenas ' +
      'de braços invisíveis que partiam exércitos e quebravam dragões enquanto ela permanecia deitada.',
    desfecho: 'Arrastada para o abismo pela Bruxa da Inveja sem sequer abrir os olhos para resistir.',
    reliquiaOuMarca: 'O Alento da Inércia: fendas onde o vento para e as criaturas adormecem para sempre.',
  },
  {
    id: 'gula',
    pecado: 'Gula',
    nome: 'Daphne · A Bruxa da Fome',
    autoridade: 'Criação das Bestas do Ermo & Voracidade Sem Fim',
    naturezaPoder:
      'Acorrentada num caixão flutuante com os olhos vendados para não enlouquecer o mundo com sua fome. ' +
      'Para tentar alimentar a terra e a si mesma, pariu as monstruosidades e quimeras que assolam as florestas.',
    desfecho: 'Devorada pela boca sem fim da Bruxa da Inveja nas dunas do deserto primitivo.',
    reliquiaOuMarca: 'O Chifre das Quimeras e as Bestas da Calamidade que ainda vagam pelas fronteiras.',
  },
  {
    id: 'luxuria',
    pecado: 'Luxúria',
    nome: 'Carmilla · A Bruxa do Fascínio',
    autoridade: 'Miragem da Devoção Cega',
    naturezaPoder:
      'Sem traços de guerreira, tímida e vacilante, sua simples presença fazia qualquer criatura viva enxergar nela ' +
      'a pessoa mais amada de sua vida, esquecendo de comer, fugir ou respirar até o coração parar de bater por êxtase.',
    desfecho: 'Consumida pela Inveja que não suportou ver outro afeto além do seu próprio.',
    reliquiaOuMarca: 'O Véu dos Olhos Cegos e as fontes de águas perfumadas que enlouquecem os viandantes.',
  },
  {
    id: 'ganancia',
    pecado: 'Ganância',
    nome: 'Echidna · A Bruxa do Arquivo',
    autoridade: 'Santuário da Onisciência & Curiosidade Eterna',
    naturezaPoder:
      'Desejava conhecer tudo o que existiu, existe e existirá. Capaz de calcular infinitos futuros e guardar ' +
      'as almas dos homens em livros vivos de memória eterna.',
    desfecho: 'Morta e aprisionada no Santuário de Pedra quando as sombras da Inveja cobriram suas bibliotecas.',
    reliquiaOuMarca: 'O Evangelho da Sabedoria e o chá das almas nos túmulos do vale.',
  },
  {
    id: 'tristeza',
    pecado: 'Tristeza (Melancolia)',
    nome: 'Hector · O Bruxo da Tristeza',
    autoridade: 'O Colapso do Pesar & Gravidade Abissal',
    naturezaPoder:
      'Vestia negro e falava com a voz quebrada de um viúvo. Sua autoridade não usava mana: era o puro peso do luto ' +
      'que fazia a gravidade aumentar dez mil vezes, achatando palácios, magia e fortalezas contra a lama.',
    desfecho: 'Engolido pelas sombras da Inveja no Grande Cerco do Santuário.',
    reliquiaOuMarca: 'O Marco Esmagado nas colinas de Mir, onde nem o capim consegue crescer ereto.',
  },
  {
    id: 'va_gloria',
    pecado: 'Vã-Glória',
    nome: 'Pandora · A Bruxa da Desdita',
    autoridade: 'Reescrita do Fenômeno Existente',
    naturezaPoder:
      'Uma garota imaculada de cabelos prateados que nega a causalidade. Se executada, diz simplesmente ' +
      '"seus olhos devem tê-lo enganado" e o golpe desfaz-se no ar como se nunca houvesse ocorrido.',
    desfecho: 'Sua presença foi engolida pela Inveja, mas sussurra-se que ela espreita por trás de cada heresia.',
    reliquiaOuMarca: 'O Espelho Vazio que não reflete a pessoa que olha para ele.',
  },
];

// ── 3. FACÇÕES ANTIGAS & CULTOS ─────────────────────────────────────────────
export const FACCOES_ANTIGAS: FaccaoAntiga[] = [
  {
    id: 'igreja_santos_selo',
    nome: 'A Ordem dos Santos do Selo',
    crenca: 'A salvação reside em manter as fendas fechadas e as bruxas esquecidas sob a rocha sagrada.',
    sede: 'Catedral de Granito da Casa Senhorial e Mosteiro do Alto',
    dogma: 'Todo sangue mágico é mácula; toda evocação da Inveja deve ser punida com o fogo e o ferro frio.',
    relacaoComBruxas: 'Inimigos mortais. Caçam qualquer indivíduo com aroma do pecado ou relíquia de bruxa.',
  },
  {
    id: 'culto_da_bruxa',
    nome: 'O Culto da Bruxa (Apóstolos do Véu Negro)',
    crenca: 'A Bruxa da Inveja é a verdadeira mãe do mundo e retornará para acolher seus filhos no manto da noite perpétua.',
    sede: 'Criptas secretas sob as Ruínas de Mir e cavernas de Solgar',
    dogma: 'Seguir à risca as instruções reveladas nos Evangelhos Negros deixados por seus Bispos do Pecado.',
    relacaoComBruxas: 'Fanáticos devotos da Inveja; consideram as outras bruxas como oferendas consumidas pela sua rainha.',
  },
  {
    id: 'conclave_magos_mir',
    nome: 'O Conclave Arruinado de Mir',
    crenca: 'O mana dos deuses mortos e as autoridades das bruxas podem ser catalogados e dominados pela razão.',
    sede: 'As Cinzas do Grande Templo de Mir',
    dogma: 'Nenhum conhecimento é proibido para quem possui mente de aço e instrumentos de precisão.',
    relacaoComBruxas: 'Eruditos obcecados por desenterrar os caixões e relíquias das bruxas devoradas.',
  },
  {
    id: 'casa_sem_nome',
    nome: 'A Fraternidade da Lâmina Escura',
    crenca: 'O mundo sobrevive porque alguns homens e mulheres aceitam morrer no escuro sem glória nem epitáfio.',
    sede: 'A Mansão Oculta na Névoa e Vilas dos Ferreiros',
    dogma: 'Aço temperado com sangue de demônio corta qualquer autoridade, por mais soberba que seja.',
    relacaoComBruxas: 'Exterminadores pragmáticos que enfrentam os frutos da Gula e as seitas da Inveja.',
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
    passadoGuerraDeuses: 'As fundações de pedra branca foram unidas por magia solar que resistiu por trezentos anos.',
    marcaDasBruxas: 'Rachou ao meio na noite em que a Bruxa da Inveja tentou arrancar o selo de Sarine debaixo do rio.',
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
    marcaDasBruxas: 'Muitas lápides não cobrem corpos, mas roupas de meninos levados pelas sombras da Inveja.',
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
    marcaDasBruxas: 'Epicentro do massacre: a Bruxa da Inveja incendiou Mir com chamas pretas que a chuva não apaga até hoje.',
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
    marcaDasBruxas: 'Primeira linha de defesa contra os bandos heréticos e bestas criadas pela fome de Daphne.',
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
    supersticaoPopular: 'Quem senta na pedra do centro na lua nova ouve sussurros da biblioteca de Echidna.',
  },
  pantano_lodo: {
    id: 'pantano_lodo',
    nome: 'Pântano do Lodo Negro',
    regiao: 'Bosque de Vintra',
    divindadeOuCrenca: 'Os Deuses da Podridão e da Renovação.',
    passadoGuerraDeuses: 'Depressão lodosa onde apodreceram os restos de armaduras dos exércitos celestes.',
    marcaDasBruxas: 'Infestado pelos vermes e sanguessugas gigantes paridos pela gula de Daphne.',
    supersticaoPopular: 'Fogo-fátuo que pula duas vezes no charco é riso de bruxa morta chamando para o fundo.',
  },
  aldeia_lenha: {
    id: 'aldeia_lenha',
    nome: 'Povoado dos Madeireiros',
    regiao: 'Bosque de Vintra',
    divindadeOuCrenca: 'Respeito ao Machado e aos Juramentos de Madeira.',
    passadoGuerraDeuses: 'Trilhas de transporte de troncos para os navios de guerra dos tempos primordiais.',
    marcaDasBruxas: 'Árvores com nós que parecem rostos chorando: dizem ser os que olharam para Carmilla e esqueceram de piscar.',
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
    marcaDasBruxas: 'Inspirada no tribunal implacável da Bruxa Typhon: quem mente diante da forca tem os membros partidos pela própria consciência.',
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
    marcaDasBruxas: 'Muralhas construídas para conter as quimeras famintas da Bruxa Daphne.',
    supersticaoPopular: 'Pedra que rola sozinha do terraço de cima foi empurrada por mão invisível.',
  },
  forja_afundada: {
    id: 'forja_afundada',
    nome: 'A Forja Afundada',
    regiao: 'Planalto de Corveira',
    divindadeOuCrenca: 'A Centelha Sagrada Primordial.',
    passadoGuerraDeuses: 'Fosso de magma que nunca esfria, remanescente do impacto do martelo de Vandul.',
    marcaDasBruxas: 'Aqui Minerva golpeou o solo com sua fúria, criando um bolsão de cura cercado por lava.',
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
    marcaDasBruxas: 'Mercadores vendem cópias clandestinas de páginas do Livro da Sabedoria de Echidna.',
    supersticaoPopular: 'Camelo que empaca diante do portão farejou apóstolo do culto da bruxa na estalagem.',
  },
  ruina_areia: {
    id: 'ruina_areia',
    nome: 'Necrópole das Dunas Negras',
    regiao: 'Ermo de Solgar',
    divindadeOuCrenca: 'Templos Perdidos dos Deuses Esquecidos.',
    passadoGuerraDeuses: 'Cúpulas de arenito dourado soterradas pela tempestade que encerrou a Guerra dos Deuses.',
    marcaDasBruxas: 'Suposto túmulo da Bruxa da Gula, onde bestas de duas cabeças ainda guardam os sarcófagos.',
    supersticaoPopular: 'Areia que canta ao vento à noite repete os segredos que Echidna deixou enterrados.',
  },

  // ── Costa de Mareu (Portos e Marés a Sudeste) ──
  mareu: {
    id: 'mareu',
    nome: 'Porto Branco de Mareu',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'A Catedral dos Navegantes de Yrmara.',
    passadoGuerraDeuses: 'As falésias brancas foram erguidas pelas mãos marinhas de Yrmara para frear as chamas de Sol-Voraz.',
    marcaDasBruxas: 'As águas do ancoradouro guardam a lenda de Carmilla: marinheiros juram ouvir cantos de fascínio da névoa.',
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
    marcaDasBruxas: 'Fendas onde o vento produz sons de luto, herança do peso opressor do Bruxo Hector.',
    supersticaoPopular: 'Caminhar na beirada do abismo ao entardecer convida a mão invisível da Preguiça a empurrá-lo.',
  },
  mercado_peixe: {
    id: 'mercado_peixe',
    nome: 'Mercado das Docas de Peixe',
    regiao: 'Costa de Mareu',
    divindadeOuCrenca: 'A Bênção das Redes Cheias.',
    passadoGuerraDeuses: 'Antiga rampa de desembarque de tributos marítimos dos reinos antigos.',
    marcaDasBruxas: 'Balcões de pedra onde monges inspecionam o pescado em busca de mutações provocadas pela Gula de Daphne.',
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
    marcaDasBruxas: 'Ninhos de sanguessugas negras e quimeras aquáticas que sobreviveram à queda de Daphne.',
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
    marcaDasBruxas: 'Suas receitas medicinais curam maldições profundas que nem mesmo a autoridade de Minerva sanou.',
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
    marcaDasBruxas: 'O setor restrito contém cópias censuradas dos Evangelhos da Ganância de Echidna.',
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
