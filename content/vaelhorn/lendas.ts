// ARCANUM · As armas com nome e onde elas estão (sessão 54).
//
// A sessão 45 pôs no catálogo dezesseis peças lendárias — as relíquias das
// casas, a espada e a coroa do último rei, quatro armas perdidas e as
// manoplas de Bai Long — e nenhuma saía de lugar nenhum: nem loja, nem
// espólio, nem missão. Existiam só no arquivo. E o texto delas falava de
// barões, almirantes e patriarcas num vale onde a Leva leva os homens aos
// dezoito anos e toda profissão tem nome de mulher.
//
// Aqui cada peça ganha história (origem, quem a empunhou, como se perdeu) e
// um caminho até a mão do jogador:
// - as oito perdidas estão com os adversários fixos das expedições
//   (content/vaelhorn/desafios.ts), que as guardam — vencer a expedição é
//   ganhar a peça;
// - as das casas são confiadas pela casa a quem ela passou a chamar de sua
//   (reputação com a casa, engine/casas.ts): a arma primeiro, a outra peça
//   depois. O machado de Corveira é exceção: ficou soterrado no desabamento
//   do terraço quarto, e quem o traz de volta é quem vence o Colosso.
//
// A história entra no item (`Item.historia`), aparece no inventário e vai para
// o narrador quando a peça está equipada.

export type Lenda = {
  /** Nome novo, quando o antigo contradizia o mundo. */
  nome?: string;
  descricao: string;
  /** Dois a quatro parágrafos curtos: origem, quem empunhou, como chegou aqui. */
  historia: string[];
};

export const LENDAS_ITENS: Record<string, Lenda> = {
  // ─────────────────────────────────────────── Casa de Halvet
  espada_ancestral_halvet: {
    descricao: 'Espada pesada de guarda reta, passada de senhora em senhora da Casa de Pedra. O pomo é um bloco de granito da primeira torre, cravado em aço.',
    historia: [
      'A primeira senhora de Halvet mandou fazer a espada com a pedra que sobrou da torre, para que a casa carregasse a torre para onde fosse. Quem a forjou foi uma ferreira da Vila que Ninguém Encontra Duas Vezes, e o preço, dizem, foi um nome que a casa nunca mais pôde usar.',
      'Por quatro séculos a espada passou de mãe para filha. Dama Valda a recebeu da mãe e a guardou para Aldren, o filho que ela preparou para herdar tudo — espada, sinete, lugar à mesa. A Leva o levou no inverno dos dezoito, e a espada ficou na parede. A casa de Halvet não tem mais guerra que se ganhe com espada, só dívida.',
      'Valda só a entrega a quem a casa passou a considerar dela. Diz que prefere ver a pedra na mão de alguém de fora a vê-la penhorada em Mareu.',
    ],
  },
  escudo_halvet: {
    descricao: 'Escudo de torre, pesado como uma porta, com a torre de Halvet em relevo gasto pelo uso. Foi porta antes de ser escudo.',
    historia: [
      'Na noite em que a ponte caiu, a porta da Casa de Pedra foi arrancada e usada para segurar a água na margem enquanto tiravam gente do rio. A senhora da casa mandou pôr alças nela no dia seguinte: o que salvou a vila uma vez ia salvar de novo.',
      'Desde então ele fica pendurado no salão, e só desce quando a casa manda alguém para longe em nome dela.',
    ],
  },
  // ─────────────────────────────────────────── Casa Mareu
  tridente_mareu: {
    descricao: 'Tridente de três pontas farpadas, cabo de madeira de navio envernizado mil vezes. Foi arpão de pesca antes de ser arma da guilda.',
    historia: [
      'Quando Mareu ainda eram três vilas que brigavam, a disputa pela bancada do galpão foi decidida por uma pescadora das Olho-Vivo com este arpão na mão e ninguém disposto a pegar outro. A guilda do sal nasceu naquela tarde.',
      'Desde então o tridente fica atrás da cadeira da cabeça da casa, na sala onde o conselho vota o que a guilda escreveu na véspera. Pesca não pesca mais; decide.',
      'A casa o confia a quem a guilda quer ver do lado dela quando a eleição vier.',
    ],
  },
  manto_mareu: {
    nome: 'Manto das Sete Marés',
    descricao: 'Manto de lona encerada, forrado de pele de foca, com sete nós de cordame costurados na gola. Seca em minutos e o vento não o atravessa.',
    historia: [
      'Cada nó da gola é de uma capitã do sal que voltou de uma travessia que ninguém esperava que voltasse. O manto vai para a próxima que fizer o mesmo, e ela costura o oitavo.',
      'O sétimo nó é da mãe de Ansel Olho-Vivo. Faz trinta anos que ninguém costura o oitavo.',
    ],
  },
  // ─────────────────────────────────────────── As Sete Casas de Corveira
  machado_corveira: {
    nome: 'Quebra-Rocha das Sete Casas',
    descricao: 'Machado de cabeça larga, forjado com minério do primeiro veio do Poço Fundo. O fio nunca foi amolado: nunca precisou.',
    historia: [
      'Nas sete casas de Corveira, quem abre galeria nova bate o primeiro golpe com o Quebra-Rocha. É contrato: a pedra que ele parte é da casa que o empunhou. Por isso o machado muda de mão a cada geração, sempre depois de um duelo.',
      'Doze anos atrás, a casa Verrão desceu com ele para abrir o terraço quarto; quem levava o machado era Oren, o marido de Halda. O terraço veio abaixo, levou duzentas e onze pessoas, e o machado ficou lá embaixo com elas. As casas pagaram as famílias em minério e nunca mandaram ninguém buscá-lo.',
      'O que se mexe no fundo da galeria desde então — o Colosso — está de pé em cima do lugar onde ele caiu.',
    ],
  },
  peitoral_corveira: {
    nome: 'Couraça de Ferro Negro',
    descricao: 'Placa maciça temperada em piche, preta como o chão de Corveira. Pesa como uma pessoa e para quase tudo.',
    historia: [
      'Foi feita para a campeã das Verrão depois que uma herdeira morreu em duelo de sucessão por um golpe que uma couraça qualquer teria parado. Desde então a campeã luta com ela, e nenhuma herdeira Verrão morreu em duelo.',
      'Veski, a campeã de agora, diz que a couraça não protege quem a veste: protege quem ela representa. A casa só a empresta a quem já lutou pelo nome dela.',
    ],
  },
  // ─────────────────────────────────────────── Casa Tessel
  espada_tessel: {
    nome: 'Gélida da Marca',
    descricao: 'Espada longa de aço claro, temperada na neve do Passo do Lobo. O fio fica frio mesmo no verão.',
    historia: [
      'A primeira marechala Varn a forjou no inverno em que Tessel ainda era acampamento, com a neve do passo como têmpera, porque não havia água que não estivesse congelada. A lâmina guardou o frio.',
      'No cerco de dezoito anos atrás, a marechala Idrun Varn a segurou na brecha da muralha oeste por trinta noites, até cair. A filha, Odile, tirou a espada da mão dela e segurou as dez que faltavam. A muralha caiu; a brecha, não.',
      'A casa a entrega a quem a marca aprendeu a chamar pelo nome — é o costume das Varn com quem fica na fronteira sem ter nascido nela.',
    ],
  },
  elmo_tessel: {
    nome: 'Elmo da Sentinela',
    descricao: 'Elmo fechado, de viseira estreita, com a crista gasta de tanto bater em portal baixo. Por dentro, riscos: um por noite de guarda.',
    historia: [
      'Quem veste o elmo risca uma marca por dentro a cada noite de guarda. Já não há onde riscar; a casa conta que são mais de nove mil.',
      'A última marca é da capitã que morreu na muralha oeste, a quem Roan substituiu no fim do cerco. A casa só passa o elmo adiante quando alguém de fora da família fica de sentinela por Tessel.',
    ],
  },
  // ─────────────────────────────────────────── Solgar e o ermo
  cimitarra_solgar: {
    nome: 'Lâmina de Idrin',
    descricao: 'Cimitarra de aço ondulado, cabo enrolado em couro de camelo. Corta num movimento só, do jeito que a areia corta.',
    historia: [
      'Idrin, que construiu a parada no meio do ermo e morreu antes da primeira caravana, deixou a lâmina para quem guardasse o portão. Por três gerações, as matriarcas da parada a passaram entre si, e a parada foi neutra porque todo mundo sabia de quem era a lâmina.',
      'Há onze anos uma guarda de caravana a levou como pagamento de um serviço que ninguém quis dizer qual foi. Desde então ela vende a espada — a outra, a dela — e aceita duelo de quem cruza seu posto no acampamento. A Lâmina de Idrin fica embainhada, no cinto, para quem a vencer.',
    ],
  },
  // ─────────────────────────────────────────── O último rei
  espada_imperial_vaelhorn: {
    nome: 'Soberana do Eclipse',
    descricao: 'Espada longa de aço escurecido, com a lua comendo o sol gravada na guarda. É a espada do último rei de Halvern.',
    historia: [
      'Valtorius foi o último rei de Halvern, tão antes das casas que as casas se lembram dele só pelo nome. Mandou fazer a espada no ano do eclipse e, com ela, juntou as sete terras que a coroa dele lista por dentro.',
      'Morreu sem herdeira que aceitasse a coroa, e o reino se desfez nas casas que existem hoje, cada uma com um pedaço da terra dele. A espada foi enterrada com ele, no templo de Mir.',
      'Quando Mir queimou, o templo foi junto. A espada reapareceu no cinto de uma duelista que ninguém sabe de onde veio e que só a desembainha contra quem julga à altura. Ela diz que a achou fincada numa coluna das ruínas, apontando para o lugar onde o fogo começou.',
    ],
  },
  coroa_espinhos_valtorius: {
    nome: 'Coroa de Ferro de Valtorius',
    descricao: 'Aro de ferro frio, sem pedra nenhuma, com os nomes das sete terras de Halvern entalhados por dentro. Pesa mais do que parece.',
    historia: [
      'Quando o rei morreu, a rainha mandou esconder a coroa: disse que as casas iam se matar por ela, e que preferia sete casas vivas a um reino de uma casa só em cima das outras seis.',
      'Esconderam-na numa galeria da mina e puseram diante da porta uma sentinela de pedra que não dorme nem come. A sentinela ainda está lá. Os mineiros de Corveira descem por outro caminho e não falam do assunto.',
    ],
  },
  // ─────────────────────────────────────────── As armas perdidas
  lamina_da_origem_solar: {
    nome: 'Lâmina do Primeiro Sol',
    descricao: 'Lâmina curva, fina, que nunca esfria: segurá-la por muito tempo queima a palma. Contra carne de oni, o corte não fecha.',
    historia: [
      'A Casa Sem Nome na Névoa conta que o primeiro caçador a enfrentar o progenitor dos onis usava uma lâmina assim, e que ela era quente porque guardava o sol dentro. É uma história da casa deles, não do vale, e ninguém em Halvet a conhecia.',
      'Até o draco. Quando Mir queimou, a lâmina estava na cidade — ninguém sabe na mão de quem —, e o que sobrou do fogo foi uma fera que guarda calor sob as escamas e dorme em cima das cinzas mais quentes das ruínas. Os caçadores que foram atrás dela voltaram contando que a fera não é oni e caça de dia, e que no meio da ninhada de brasas brilha uma coisa que não é brasa.',
    ],
  },
  arco_do_cacador_de_astros: {
    nome: 'Arco do Céu Partido',
    descricao: 'Arco curto de chifre, escuro e liso como pedra de rio. A flecha sai com um estalo de trovão.',
    historia: [
      'As velhas de Lenha Alta contam que, no ano em que choveu pedra, uma fera caiu do céu no fundo da mata, e que uma caçadora cortou o chifre dela e passou a vida fazendo um arco dele. O arco ficou pronto no dia em que ela morreu.',
      'A quimera do desfiladeiro deixa os restos das presas nas árvores, e entre os ossos pendurados no ninho dela há um arco que ninguém conseguiu alcançar. Quem subiu e voltou jura que é aquele.',
    ],
  },
  lanca_de_sao_vandro: {
    nome: 'Lança de São Vandro',
    descricao: 'Lança de haste escura e ponta de prata baça. Morna ao toque, mesmo na cripta.',
    historia: [
      'Vandro foi o santo que a capela ainda guarda no nome. Muito antes de Sarine, desceu a uma fenda que se abriu embaixo do vale e a fechou com a ponta da lança. A fenda fechou; ele não voltou a subir. As irmãs dizem que o que Sarine selou depois saiu pela mesma fenda, procurando a porta que ele fechou.',
      'As irmãs enterraram a lança com o que acharam dele, na cripta, e puseram um guarda: um morto armado, de juramento, que ainda marcha no ossuário. A madre de hoje diz que o guarda não defende a lança dos vivos. Defende os vivos do que a lança ainda lembra.',
    ],
  },
  adaga_do_rei_ladrao: {
    nome: 'Adaga da Rainha Ladra',
    descricao: 'Adaga fina, de lâmina preta fosca que não brilha nem ao sol. Entra sem barulho e sai sem sangue na ponta.',
    historia: [
      'A Rainha Ladra — ninguém lembra do nome, só do título — foi quem ensinou as ladras do vale a trabalhar juntas, há tanto tempo que as ladras de hoje juram por ela como as irmãs juram por São Vandro. A última coisa que ela quis roubar foi o que a Torre do Vigia guarda no salão de baixo.',
      'Entrou, e não saiu. O constructo de vidro que vigia o salão continua lá, com as rachaduras que ela deixou nele. A adaga, dizem as ladras, ele guardou junto com as outras coisas que tirou de quem tentou.',
    ],
  },
  manoplas_vajra_celestial: {
    nome: 'Manoplas dos Oito Portais',
    descricao: 'Manoplas de metal claro, sem costura, que se ajustam à mão como pele. Cada golpe desarmado soa como sino.',
    historia: [
      'Bai Long diz que as manoplas foram dele, e que ele as perdeu para a única aluna que o venceu. A aluna subiu a torre para provar alguma coisa a alguém, e de lá não desceu: ficou guardando a passagem de cima, e ninguém sobe sem passar por ela.',
      'O mestre não pede as manoplas de volta. Diz que são de quem vencer a guardiã, e que a guardiã também sabe disso.',
    ],
  },
};

/** Quem guarda qual peça: adversário fixo de expedição → item. */
export const GUARDIOES_LENDARIOS: Record<string, string> = {
  sentinela_de_basalto: 'coroa_espinhos_valtorius',
  espadachim_sem_bandeira: 'cimitarra_solgar',
  quimera_do_desfiladeiro: 'arco_do_cacador_de_astros',
  arauto_da_cripta: 'lanca_de_sao_vandro',
  colosso_da_mina: 'machado_corveira',
  guardia_do_horizonte: 'manoplas_vajra_celestial',
  draco_das_cinzas: 'lamina_da_origem_solar',
  cavaleira_do_eclipse: 'espada_imperial_vaelhorn',
  arconte_de_vidro: 'adaga_do_rei_ladrao',
};

/**
 * O que cada casa confia a quem ela passou a chamar de sua. Reputação com a
 * casa vai de −50 a 50 (engine/casas.ts): cada missão cumprida para um membro
 * vale 5.
 */
export const RELIQUIAS_DAS_CASAS: Record<string, { item: string; reputacao: number; texto: string }[]> = {
  halvet: [
    { item: 'escudo_halvet', reputacao: 25, texto: 'Dama Valda manda descer o escudo do salão. "Foi porta antes de ser escudo. Leve em nome da casa — e traga de volta, se puder."' },
    { item: 'espada_ancestral_halvet', reputacao: 40, texto: 'Dama Valda põe o Bastião de Pedra na mesa entre vocês. "Prefiro na sua mão do que penhorado em Mareu."' },
  ],
  mareu: [
    { item: 'manto_mareu', reputacao: 25, texto: 'A guilda manda o Manto das Sete Marés embrulhado em papel de alfândega, com um bilhete: "A gola tem espaço para o oitavo nó."' },
    { item: 'tridente_mareu', reputacao: 40, texto: 'O tridente sai de trás da cadeira da cabeça da casa. "A guilda quer você do lado dela quando a eleição vier. Isto é o lado dela."' },
  ],
  corveira: [
    { item: 'peitoral_corveira', reputacao: 30, texto: 'Veski entrega a Couraça de Ferro Negro com as duas mãos. "Não protege quem veste. Protege quem ela representa. Agora é a casa."' },
  ],
  tessel: [
    { item: 'elmo_tessel', reputacao: 25, texto: 'Roan traz o elmo da sentinela. "Não tem mais onde riscar por dentro. Risque por fora."' },
    { item: 'espada_tessel', reputacao: 40, texto: 'A marechala Odile desembainha a Gélida, mostra o fio e a entrega pelo cabo. "A marca aprendeu o seu nome."' },
  ],
};
