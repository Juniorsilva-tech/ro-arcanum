// ARCANUM · Gente com nome no continente.
//
// Até a sessão 21 o continente tinha 156 moradores gerados e **zero pessoas
// escritas à mão**. Os 56 personagens autorais do jogo estavam todos no Vale
// de Halvet e arredores — o mapa novo tinha densidade e não tinha ninguém de
// quem se lembrar depois.
//
// Cada pessoa aqui está amarrada a algo que o mapa JÁ dizia. A história de
// Pedravel diz que o celeiro foi erguido com pedra roubada do forte, de noite,
// peça por peça, e que todo mundo sabe e ninguém diz — então Pedravel tem
// alguém que carregou aquelas pedras. Corveira pertence a sete famílias que se
// comportam como reinos e teve um desabamento que matou duzentos e onze —
// então Corveira tem quem assinou o laudo. A ficção vem primeiro; a ficha vem
// depois.
//
// Regra do mundo, cobrada por `engine/selftest.ts`: ofício no feminino, e
// ninguém entra sem corpo descrito — o narrador usa os dois.
import type { NPC } from '../../engine/types';

export const elencoDoContinente: NPC[] = [
  // ── Marca de Tessel ─────────────────────────────────────────────────────
  {
    id: 'marechala_odile',
    nome: 'Odile Varn',
    idade: 47,
    ocupacao: 'marechala da marca',
    faccaoId: 'senhorio',
    localBase: 'tessel',
    rotina: {
      madrugada: 'tessel', manha: 'tessel', tarde: 'forte_agulha',
      entardecer: 'forte_agulha', anoitecer: 'tessel', noite: 'tessel',
    },
    vozNarrativa: 'Fala em frases curtas, como quem dita ordem. Só alonga quando explica por que uma ordem antiga ainda vale.',
    personalidade: 'Herdou o posto como se herda dívida. Governa bem por medo de ser a que perde o que três gerações seguraram.',
    corpo: 'Alta e seca, com a postura de quem dorme de armadura quando precisa. Cicatriz do queixo à orelha esquerda, cabelo grisalho cortado rente, mãos de rédea e punho.',
    relacoes: [
      { npc: 'sargenta_brila', tipo: 'desconfia', nota: 'Sabe que Brila vende dispensa e ainda não decidiu o que fazer.' },
      { npc: 'ancia_pedravel', tipo: 'desconfia', nota: 'Nunca provou de onde veio a pedra do celeiro de Pedravel.' },
    ],
    segredo: {
      conteudo: 'A muralha oeste, refeita depois do cerco, foi erguida com verba desviada da própria leva. Ela assinou sabendo.',
      comoDescobrir: 'Os livros de obra no Forte Agulha, ou a confiança dela em noite de bebida.',
    },
  },
  {
    id: 'sargenta_brila',
    nome: 'Brila Ost',
    idade: 33,
    ocupacao: 'sargenta do portão',
    faccaoId: 'guarda',
    localBase: 'tessel',
    rotina: {
      madrugada: 'tessel', manha: 'tessel', tarde: 'tessel',
      entardecer: 'tessel', anoitecer: 'tessel', noite: 'campo_ceifa',
    },
    vozNarrativa: 'Simpática demais, rápido demais. Usa o nome da pessoa em toda frase, como quem já está cobrando um favor.',
    personalidade: 'Convenceu-se de que vender dispensa é misericórdia. Metade das vezes é mesmo, e é isso que a mantém de pé.',
    corpo: 'Baixa e encorpada, pescoço largo, braços de quem ergue tranca de portão sozinha. Sobrancelha partida por um golpe antigo e um sorriso que chega primeiro que ela.',
    combatente: { vida: 52, defesa: 14, acerto: 13, dano: { base: 9, dispersao: 0.3, tipo: 'cortante' }, tecnicas: [] },
    relacoes: [
      { npc: 'marechala_odile', tipo: 'aliada', nota: 'Jura que a marechala não sabe. Sabe que a marechala sabe.' },
    ],
    segredo: {
      conteudo: 'Guarda a lista verdadeira da leva — a de nomes riscados — enterrada sob a terceira pedra do Campo da Ceifa.',
      comoDescobrir: 'Segui-la à noite, ou pagar mais do que ela cobra por dispensa.',
    },
  },
  {
    id: 'ancia_pedravel',
    nome: 'Mora Quelha',
    idade: 71,
    ocupacao: 'anciã da vila',
    faccaoId: 'vila',
    localBase: 'vila_pedravel',
    rotina: {
      madrugada: 'vila_pedravel', manha: 'vila_pedravel', tarde: 'campo_ceifa',
      entardecer: 'vila_pedravel', anoitecer: 'vila_pedravel', noite: 'vila_pedravel',
    },
    vozNarrativa: 'Conta tudo em forma de caso antigo, mesmo o que aconteceu ontem. Nunca responde a primeira pergunta.',
    personalidade: 'Guardou a vila por cinquenta anos mentindo o necessário. Não considera isso um defeito e não pretende parar.',
    corpo: 'Miúda e curvada, mãos nodosas de artrite que ainda descascam o que precisa ser descascado. Olhos claros que não perderam nada, trança branca até a cintura.',
    relacoes: [
      { npc: 'rapaz_da_leva', tipo: 'protege', nota: 'Um dos três que "voltaram" segundo a lista.' },
    ],
    segredo: {
      conteudo: 'Foi ela quem organizou o roubo da pedra do forte, noite após noite, durante dois invernos. Tem a conta escrita.',
      comoDescobrir: 'O livro de contas dentro do altar do celeiro, ou fazê-la contar um caso até o fim.',
    },
  },
  {
    id: 'rapaz_da_leva',
    nome: 'Ivo Quelha',
    idade: 19,
    ocupacao: 'foragido da leva',
    faccaoId: 'vila',
    localBase: 'vila_pedravel',
    rotina: {
      madrugada: 'campo_ceifa', manha: 'campo_ceifa', tarde: 'vila_pedravel',
      entardecer: 'vila_pedravel', anoitecer: 'campo_ceifa', noite: 'campo_ceifa',
    },
    vozNarrativa: 'Fala olhando a saída. Responde pouco e pergunta menos, porque pergunta demais é como se descobre quem não devia estar ali.',
    personalidade: 'Sobrevivente sem heroísmo. Fugiu da leva, viu quem não fugiu, e carrega isso sem conseguir explicar a ninguém.',
    corpo: 'Magro de fome recente, alto demais para se esconder bem. Mão esquerda sem dois dedos — não foi a guerra, foi a debulhadora.',
    relacoes: [
      { npc: 'ancia_pedravel', tipo: 'sangue', nota: 'Neto de uma prima. Ela o chama de neto e ninguém corrige.' },
    ],
  },

  // ── Planalto de Corveira ────────────────────────────────────────────────
  {
    id: 'senhora_corveira',
    nome: 'Halda Verrão',
    idade: 58,
    ocupacao: 'cabeça de casa',
    faccaoId: 'senhorio',
    localBase: 'corveira',
    rotina: {
      madrugada: 'corveira', manha: 'corveira', tarde: 'mina_corveira',
      entardecer: 'corveira', anoitecer: 'corveira', noite: 'corveira',
    },
    vozNarrativa: 'Educada de um jeito que soa como ameaça. Agradece muito, e cada agradecimento é uma conta aberta.',
    personalidade: 'Enxerga a cidade como patrimônio da família e as pessoas como despesa de manutenção. Não é cruel — é contábil.',
    corpo: 'Encorpada e vertical, vestida de escuro caro. Anéis de sinete nas duas mãos, queixo forte, cabelo preso tão firme que puxa as têmporas.',
    relacoes: [
      { npc: 'perita_do_desabamento', tipo: 'aliada', nota: 'Pagou pelo laudo que inocentou a casa dela.' },
      { npc: 'ferreira_do_ferro_velho', tipo: 'desconfia', nota: 'Precisa do metal recuperado e finge que não.' },
    ],
    segredo: {
      conteudo: 'O escoramento do nível três já cedia antes do desabamento do quarto. O relatório que dizia isso foi comprado e queimado.',
      comoDescobrir: 'A cópia que a perita não queimou, ou o registro do mosteiro.',
    },
  },
  {
    id: 'perita_do_desabamento',
    nome: 'Sibel Arne',
    idade: 44,
    ocupacao: 'perita de galeria',
    faccaoId: 'vila',
    localBase: 'mina_corveira',
    rotina: {
      madrugada: 'mina_corveira', manha: 'mina_corveira', tarde: 'mina_corveira',
      entardecer: 'corveira', anoitecer: 'corveira', noite: 'corveira',
    },
    vozNarrativa: 'Técnica e precisa até o assunto encostar no quarto terraço. Aí ela muda de assunto com uma habilidade que já é hábito.',
    personalidade: 'Assinou o laudo falso aos trinta e dois e construiu a vida em cima dele. Bebe porque a conta não fecha nunca.',
    corpo: 'Seca, de ombros altos e permanentemente tensos. Pó de pedra entranhado nas dobras das mãos; tosse funda que ela finge ser de poeira recente.',
    relacoes: [
      { npc: 'senhora_corveira', tipo: 'devedora', nota: 'Não é dinheiro. É a assinatura dela num papel.' },
    ],
    segredo: {
      conteudo: 'Guardou o relatório original — o que dizia que o nível três ia cair — costurado no forro do casaco de trabalho.',
      comoDescobrir: 'Vê-la bêbada tocando o forro do casaco, ou dar-lhe motivo para deixar de ter medo.',
    },
  },
  {
    id: 'ferreira_do_ferro_velho',
    nome: 'Tança',
    idade: 39,
    ocupacao: 'lâmina-ferreira',
    faccaoId: 'vila',
    localBase: 'aldeia_ferro',
    rotina: {
      madrugada: 'aldeia_ferro', manha: 'aldeia_ferro', tarde: 'aldeia_ferro',
      entardecer: 'aldeia_ferro', anoitecer: 'aldeia_ferro', noite: 'colina_forcados',
    },
    vozNarrativa: 'Grita por cima do próprio martelo mesmo quando ele está parado. Ri alto e corta conversa quando o assunto vira encomenda.',
    personalidade: 'Orgulho de ofício acima de qualquer lealdade. Faz lâmina boa para quem merece e sucata para quem paga bem e não merece.',
    corpo: 'Ombros e antebraços desproporcionais ao resto, queimaduras velhas salpicadas do pulso ao cotovelo. Cabeça raspada pelo calor, sobrancelhas quase sumidas.',
    relacoes: [
      { npc: 'senhora_corveira', tipo: 'rival', nota: 'Devolve metal bom a preço de nada e sabe exatamente por quê.' },
    ],
    segredo: {
      conteudo: 'A peça boa demais que apareceu no refugo foi ela quem pôs lá — é uma lâmina de caçador, e ela está reconstruindo a que faltou.',
      comoDescobrir: 'Segui-la à Colina dos Forcados de madrugada, ou mostrar-lhe uma Nichirin.',
    },
  },
  {
    id: 'irma_copista',
    nome: 'Irmã Velun',
    idade: 29,
    ocupacao: 'copista do mosteiro',
    faccaoId: 'vila',
    localBase: 'mosteiro_alto',
    rotina: {
      madrugada: 'mosteiro_alto', manha: 'mosteiro_alto', tarde: 'mosteiro_alto',
      entardecer: 'mosteiro_alto', anoitecer: 'mosteiro_alto', noite: 'mosteiro_alto',
    },
    vozNarrativa: 'Sussurra por hábito de biblioteca. Cita o que copia sem perceber que está citando.',
    personalidade: 'Copia o mesmo texto há semanas e queima cada cópia porque decorar é a única forma de guardar o que mandaram destruir.',
    corpo: 'Pequena e pálida de pouco sol, dedos manchados de tinta até a segunda falange. Vista já ruim aos vinte e nove, aperta os olhos para tudo que está a mais de um braço.',
    relacoes: [
      { npc: 'senhora_corveira', tipo: 'desconfia', nota: 'Foi a casa dela que mandou destruir o registro.' },
      { npc: 'perita_do_desabamento', tipo: 'desconfia', nota: 'Reconheceu a assinatura no laudo que copiou.' },
    ],
    segredo: {
      conteudo: 'O texto que ela copia e queima é o registro de propriedade da galeria que desabou. Ela já o sabe de cor, palavra por palavra.',
      comoDescobrir: 'Estar na ala leste quando ela queima, ou convencê-la de que há onde guardar em segurança.',
    },
  },

  // ── Costa de Mareu ──────────────────────────────────────────────────────
  {
    id: 'mestra_do_porto',
    nome: 'Oria Sal',
    idade: 51,
    ocupacao: 'mestra do porto',
    faccaoId: 'senhorio',
    localBase: 'porto_sal',
    rotina: {
      madrugada: 'porto_sal', manha: 'porto_sal', tarde: 'mareu',
      entardecer: 'mareu', anoitecer: 'porto_sal', noite: 'porto_sal',
    },
    vozNarrativa: 'Fala em preço. Descreve pessoas como carga: peso, origem, o que custa mover.',
    personalidade: 'Honesta no livro e no resto não. Entende o contrabando como maré: reclamar dela é perder tempo, cobrar dela não.',
    corpo: 'Larga de ombro, pele curtida de vento salgado, cabelo curto e duro de sal. Falta metade da orelha direita, arrancada por cabo de guindaste.',
    relacoes: [
      { npc: 'viuva_do_farol', tipo: 'rival', nota: 'Partiram sociedade quando o farol apagou. Nenhuma das duas conta por quê.' },
    ],
    segredo: {
      conteudo: 'Metade da carga que entra pelo Sal não passa no livro, e a outra metade passa duas vezes para cobrir o buraco.',
      comoDescobrir: 'Comparar o livro do porto com o do mercado de peixe.',
    },
  },
  {
    id: 'viuva_do_farol',
    nome: 'Nera Quilm',
    idade: 63,
    ocupacao: 'faroleira',
    faccaoId: 'vila',
    localBase: 'farol_quebrado',
    rotina: {
      madrugada: 'farol_quebrado', manha: 'farol_quebrado', tarde: 'estrada_costeira',
      entardecer: 'farol_quebrado', anoitecer: 'farol_quebrado', noite: 'farol_quebrado',
    },
    vozNarrativa: 'Longas pausas no meio da frase, como quem espera uma resposta do mar. Chama todo navio de "ele".',
    personalidade: 'Mantém aceso um farol que já não serve para nada, porque apagar seria admitir a noite em que ele apagou.',
    corpo: 'Ossuda e alta, mãos de corda. Cataratas leitosas no olho esquerdo; inclina a cabeça para olhar as pessoas com o direito.',
    relacoes: [
      { npc: 'mestra_do_porto', tipo: 'rival', nota: 'Não a perdoou. Também nunca a acusou em público.' },
    ],
    segredo: {
      conteudo: 'Na noite em que o farol apagou, não faltou óleo. Alguém pagou para que ele apagasse, e o navio que bateu levava a família dela.',
      comoDescobrir: 'O recibo que ela guarda há vinte anos, ou o livro velho do porto.',
    },
  },
  {
    id: 'pescadora_da_rede',
    nome: 'Quim Vares',
    idade: 26,
    ocupacao: 'pescadora de rede funda',
    faccaoId: 'vila',
    localBase: 'aldeia_rede',
    rotina: {
      madrugada: 'aldeia_rede', manha: 'estrada_costeira', tarde: 'aldeia_rede',
      entardecer: 'aldeia_rede', anoitecer: 'aldeia_rede', noite: 'aldeia_rede',
    },
    vozNarrativa: 'Rápida e debochada, cheia de gíria de barco que ela não se dá ao trabalho de traduzir.',
    personalidade: 'Jovem o bastante para achar que o mar é negociável. Puxou coisa demais na rede e continua descendo fundo.',
    corpo: 'Compacta e forte, pernas grossas de se firmar em convés. Tatuagem de linha azul do pulso ao ombro, feita a agulha de osso.',
    relacoes: [
      { npc: 'viuva_do_farol', tipo: 'aliada', nota: 'A única que ainda sobe ao farol para conversar.' },
    ],
    segredo: {
      conteudo: 'Puxou da rede funda uma caixa lacrada com o selo do porto, e não a abriu nem entregou. Está enterrada sob o barco dela.',
      comoDescobrir: 'Vê-la mexendo na areia sob o casco, ou ganhar confiança suficiente para ela pedir ajuda.',
    },
  },

  // ── Bosque de Vintra ────────────────────────────────────────────────────
  {
    id: 'guarda_do_bosque',
    nome: 'Saía Vintra',
    idade: 41,
    ocupacao: 'guardiã do bosque',
    faccaoId: 'vila',
    localBase: 'vintra',
    rotina: {
      madrugada: 'aldeia_carvoeira', manha: 'vintra', tarde: 'vintra',
      entardecer: 'clareira_pedras', anoitecer: 'clareira_pedras', noite: 'vintra',
    },
    vozNarrativa: 'Poucas palavras e nenhuma cortesia. Interrompe para apontar barulho que ninguém mais ouviu.',
    personalidade: 'Conhece cada trilha do bosque e não confia em nenhuma. Trata o mato como vizinho armado, não como casa.',
    corpo: 'Nervosa e magra, toda tendão. Riscos de galho velhos nos antebraços, cabelo preso com tira de couro, olhos que não param no rosto de ninguém.',
    combatente: { vida: 58, defesa: 15, acerto: 15, dano: { base: 10, dispersao: 0.35, tipo: 'cortante' }, tecnicas: [] },
    relacoes: [
      { npc: 'carvoeira_velha', tipo: 'aliada', nota: 'A única pessoa do bosque cujo aviso ela nunca ignorou.' },
    ],
    segredo: {
      conteudo: 'Já viu de perto o que come no Passo do Lobo, e não era lobo. Nunca disse a ninguém porque ninguém acreditaria e ela precisa do posto.',
      comoDescobrir: 'Estar com ela quando acontecer de novo.',
    },
  },
  {
    id: 'carvoeira_velha',
    nome: 'Ferna Braza',
    idade: 68,
    ocupacao: 'carvoeira',
    faccaoId: 'vila',
    localBase: 'aldeia_carvoeira',
    rotina: {
      madrugada: 'aldeia_carvoeira', manha: 'aldeia_lenha', tarde: 'aldeia_carvoeira',
      entardecer: 'aldeia_carvoeira', anoitecer: 'aldeia_carvoeira', noite: 'aldeia_carvoeira',
    },
    vozNarrativa: 'Rouca de fumaça de cinquenta anos. Fala devagar e não repete, então quem não ouviu perdeu.',
    personalidade: 'Sabe ler o bosque pelo cheiro da fumaça. Avisou três vezes na vida e nas três tinha razão.',
    corpo: 'Baixa e quadrada, pele escurecida de fuligem que não sai mais. Unhas pretas até a raiz, e um chiado no peito a cada frase longa.',
    relacoes: [
      { npc: 'guarda_do_bosque', tipo: 'protege', nota: 'Ensinou a ler fumaça e nunca cobrou nada por isso.' },
    ],
    segredo: {
      conteudo: 'Há uma quarta coisa que ela notou e não avisou, porque desta vez o cheiro vem de dentro da aldeia.',
      comoDescobrir: 'Perguntar sobre as três vezes anteriores até ela chegar na quarta.',
    },
  },

  // ── Ermo de Solgar ──────────────────────────────────────────────────────
  {
    id: 'dona_do_caravancerai',
    nome: 'Beth Solgar',
    idade: 49,
    ocupacao: 'dona do caravançarai',
    faccaoId: 'vila',
    localBase: 'caravancerai',
    rotina: {
      madrugada: 'caravancerai', manha: 'caravancerai', tarde: 'caravancerai',
      entardecer: 'caravancerai', anoitecer: 'caravancerai', noite: 'caravancerai',
    },
    vozNarrativa: 'Hospitaleira de profissão, calorosa de fachada. Cobra tudo e cobra na frente, sorrindo.',
    personalidade: 'Ouve todas as conversas da estrada e vende as que valem. Não considera isso traição — considera estoque.',
    corpo: 'Rechonchuda e ágil, o oposto do que o ermo costuma produzir. Anéis de cobre em quase todos os dedos, véu de pó permanentemente no cabelo.',
    relacoes: [
      { npc: 'aguadeira_do_poco', tipo: 'aliada', nota: 'Compra água a preço justo, o que no ermo é quase afeto.' },
    ],
    segredo: {
      conteudo: 'Mantém um caderno com o que cada viajante disse dormindo. Três nomes desse caderno já morreram.',
      comoDescobrir: 'Dormir ali e voltar de madrugada, ou comprar dela o que ela vende.',
    },
  },
  {
    id: 'aguadeira_do_poco',
    nome: 'Ura Seca',
    idade: 35,
    ocupacao: 'aguadeira',
    faccaoId: 'vila',
    localBase: 'poco_seco',
    rotina: {
      madrugada: 'poco_seco', manha: 'poco_seco', tarde: 'ruina_areia',
      entardecer: 'poco_seco', anoitecer: 'poco_seco', noite: 'poco_seco',
    },
    vozNarrativa: 'Econômica até nas palavras, como quem racionaria a própria voz se pudesse.',
    personalidade: 'Guarda o único poço que ainda dá. Distribui com justiça rígida e sem exceção, mesmo para criança, mesmo para moribundo.',
    corpo: 'Queimada de sol até o couro, lábios rachados permanentes. Magra de músculo, não de fome; costas marcadas pela corda do balde.',
    relacoes: [
      { npc: 'dona_do_caravancerai', tipo: 'aliada', nota: 'A única cliente que paga sem discutir.' },
    ],
    segredo: {
      conteudo: 'O poço do Forte Agulha não secou sozinho. Ela sabe o que foi feito e por quem, porque foi a ela que pediram para fazer.',
      comoDescobrir: 'A marca de giz recente na borda do poço, e perguntar quem a pôs.',
    },
  },

  // ── Baixios de Halvern ──────────────────────────────────────────────────
  {
    id: 'barqueira_do_vau',
    nome: 'Tela Junco',
    idade: 44,
    ocupacao: 'barqueira do vau',
    faccaoId: 'vila',
    localBase: 'vau_pedra',
    rotina: {
      madrugada: 'vau_pedra', manha: 'vau_pedra', tarde: 'charco_juncal',
      entardecer: 'vau_pedra', anoitecer: 'vau_pedra', noite: 'vau_pedra',
    },
    vozNarrativa: 'Conversa o tempo todo durante a travessia e cala assim que a vara toca o fundo do outro lado.',
    personalidade: 'Atravessa qualquer um que pague e não pergunta nada. Tem uma única regra, e é sobre a hora, não sobre a pessoa.',
    corpo: 'Comprida e curtida, pés descalços e calejados de lodo. Ombro direito mais baixo que o esquerdo, de trinta anos empurrando a mesma vara.',
    segredo: {
      conteudo: 'Não atravessa ninguém depois do anoitecer, e a razão não é o escuro: é o que ela já levou uma vez e viu chegar do outro lado.',
      comoDescobrir: 'Insistir na travessia noturna até ela recusar e explicar.',
    },
  },
];
