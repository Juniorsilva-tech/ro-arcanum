// ARCANUM · Expansão Tsukimichi: O Novo Mundo & Subespaço de Asora.
//
// Conecta o continente clássico ao Novo Mundo (Tsige, Wasteland e Rotsgard)
// e ao domínio dimensional autônomo de Asora.
import type { Local } from '../../engine/types';
import type { Periodo } from '../../engine/time';

type Def = {
  id: string;
  nome: string;
  regiao: string;
  tipo: string;
  perigo: number;
  descricao: string;
  atmosfera: [string, string, string];
  privacidade: [0 | 1 | 2 | 3, 0 | 1 | 2 | 3];
  ganchos: string[];
  pontos: string[];
  historia: string[];
};

function expandir(d: Def): Local {
  const [dia, entre, noite] = d.atmosfera;
  const [pd, pn] = d.privacidade;
  const atmosferaPorPeriodo: Partial<Record<Periodo, string>> = {
    madrugada: noite,
    manha: dia,
    tarde: dia,
    entardecer: entre,
    anoitecer: entre,
    noite,
  };
  return {
    id: d.id,
    nome: d.nome,
    regiao: d.regiao,
    tipo: d.tipo,
    descricaoBase: d.descricao,
    atmosferaPorPeriodo,
    privacidadeBase: {
      madrugada: pn,
      manha: pd,
      tarde: pd,
      entardecer: pd,
      anoitecer: pn,
      noite: pn,
    },
    perigo: d.perigo,
    ganchos: d.ganchos,
    pontos: d.pontos,
    historia: d.historia,
    rotas: [],
  };
}

// ── Tsige: Cidade Mercantil na Fronteira da Wasteland ─────────────────────
const TSIGE: Def[] = [
  {
    id: 'tsige_distrito_comercial',
    nome: 'Tsige - Distrito Comercial',
    regiao: 'Tsige',
    tipo: 'cidade',
    perigo: 2,
    descricao:
      'A capital do comércio fronteiriço. O cheiro de especiarias da Wasteland mistura-se ao tinir de ouro e contratos de aventureiros.',
    atmosfera: [
      'Mercadores hyumans negociam peles de bestas e minérios raros aos gritos enquanto carroças pesadas entram pela via principal.',
      'As lanternas de óleo das lojas acendem-se e os aventureiros contam suas baixas nas tabernas de esquina.',
      'Rondas privadas de guildas mercantis patrulham com cães de caça e bestas armadas contra salteadores da noite.',
    ],
    privacidade: [0, 1],
    ganchos: [
      'A Casa Rembrandt procura suprimentos raros que a guilda oficial não conseguiu trazer da Wasteland.',
      'Contrabandistas vendem artefatos demi-humanos em becos escuros longe da vista da guarda.',
    ],
    pontos: ['praça do mercado central', 'armazéns rembrandt', 'rua das especiarias', 'taberna do ermo'],
    historia: [
      'Tsige nasceu de um entreposto rebelde que se recusou a pagar os dízimos estipulados pelos nobres do Reino de Aion.',
      'Quase metade das fortunas da cidade foi erguida explorando a carcaça de monstros gigantes abatidos nas primeiras expedições da Wasteland.',
    ],
  },
  {
    id: 'tsige_portao_ermo',
    nome: 'Tsige - Portão do Ermo',
    regiao: 'Tsige',
    tipo: 'forte',
    perigo: 4,
    descricao:
      'Uma muralha ciclópica de pedra e runas anti-monstro que separa a civilização hyuman da barbárie inóspita da Grande Terra Desolada.',
    atmosfera: [
      'Batedores e aventureiros com armaduras estilhaçadas voltam do ermo enquanto novatos ajustam cintos com olhares aterrorizados.',
      'Balistas pesadas no topo da muralha são lubrificadas e apontadas para o horizonte poeirento.',
      'O vento seco da Wasteland sopra cinzas e uivos distantes contra os pesados batentes de ferro.',
    ],
    privacidade: [1, 2],
    ganchos: [
      'Um grupo de caçadores não retornou após o pôr do sol e seus cartões de aventureiro pararam de ressoar.',
      'Oficiais do portão cobram pedágio ilegal para deixar caravanas sem registro cruzarem a fronteira.',
    ],
    pontos: ['muralha externa', 'posto da guilda de aventureiros', 'balista três', 'pátio das caravanas'],
    historia: [
      'O portão foi reforçado três vezes após ondas de monstros calamitosos quase varrerem a fundação original da colônia.',
      'Diz-se que sob a rocha do portão jazem as cinzas de uma expedição inteira de magos de alto nível.',
    ],
  },
  {
    id: 'tsige_guilda_aventureiros',
    nome: 'Tsige - Guilda de Aventureiros',
    regiao: 'Tsige',
    tipo: 'forte',
    perigo: 1,
    descricao:
      'O monumental salão da Guilda de Aventureiros de Tsige. Murais de recompensas cobrem os pilares de pedra e aventureiros veteranos observam os recém-chegados. No centro do balcão de mármore reluz a Orbe de Medição da Deusa, usada para avaliar a assinatura de mana e emitir o Cartão de Aventureiro.',
    atmosfera: [
      'Aventureiros veteranos de armaduras arranhadas por bestas observam novatos com olhares gélidos e risos zombeteiros.',
      'A recepcionista carimba cartões com movimentos secos enquanto moedas de prata tilintam sobre o balcão.',
      'O zumbido suave da Orbe de Medição ressoa no salão, alternando clarões arcanos conforme mãos tocam sua superfície.',
    ],
    privacidade: [1, 2],
    ganchos: [
      'A orbe de cristal parece vibrar em sobrecarga instável sempre que uma presença anômala se aproxima.',
      'Um grupo de elite nível 350 procura batedores descartáveis para mapear ninhos na Wasteland.',
    ],
    pontos: ['balcão de registro e recepção', 'orbe de medição de mana', 'mural de caçadas da wasteland', 'mesa dos veteranos'],
    historia: [
      'A guilda de Tsige registra a maior taxa de mortalidade de novatos de todo o continente.',
      'Poucos aventureiros passam do nível 150 nesta fronteira; quem atinge o nível 350 é tratado como lenda viva.',
    ],
  },
  {
    id: 'tsige_companhia_kuzunoha',
    nome: 'Companhia Kuzunoha (Sede Tsige)',
    regiao: 'Tsige',
    tipo: 'mercado',
    perigo: 1,
    descricao:
      'A elegante sede comercial da Companhia Kuzunoha. Prateleiras exibem remédios milagrosos, tecidos de seda inquebrável e armas forjadas em padrões jamais vistos.',
    atmosfera: [
      'Clientes nobres e batedores disputam frascos medicinais enquanto assistentes silenciosas organizam caixotes com eficiência milimétrica.',
      'Aroma suave de incenso e folhas de chá preparadas em fogões de cerâmica refinada.',
      'Luz suave de lâmpadas arcanas nos aposentos internos, onde contratos e rotas dimensionais são revisados.',
    ],
    privacidade: [1, 3],
    ganchos: [
      'Comerciantes rivais tentam infiltrar espiões para descobrir quem forja as armas sem costura da loja.',
      'Um carregamento de tecidos de seda de Asora precisa ser despachado em segredo.',
    ],
    pontos: ['balcão de poções e elixires', 'sala de audiências reservada', 'armazém selado', 'jardim de descanso'],
    historia: [
      'A loja surgiu da noite para o dia vendendo produtos que os melhores artesãos de Tsige julgavam impossíveis de confeccionar.',
      'Nenhum ladrão jamais conseguiu furtar um único item dos armazéns: quem tentou acordou do lado de fora desarmado e sem memória.',
    ],
  },
];

// ── Grande Terra Desolada (Wasteland) ─────────────────────────────────────
const WASTELAND: Def[] = [
  {
    id: 'wasteland_fronteira',
    nome: 'Wasteland - Borda Desolada',
    regiao: 'Grande Terra Desolada',
    tipo: 'campo',
    perigo: 8,
    descricao:
      'Uma vastidão implacável de terra calcinada, ossadas de leviatãs e miasma mágico denso. Onde apenas bestas atrozes e párias sobrevivem.',
    atmosfera: [
      'Sol abrasador reflete na poeira mágica e carcaças secas estalam sob o calor sufocante.',
      'Sombras colossais de feras aladas cruzam as nuvens vermelhas e a terra vibra com passadas pesadas.',
      'O miasma esfria em névoas ácidas que corroem armaduras descuidadas.',
    ],
    privacidade: [2, 3],
    ganchos: [
      'Pegadas imensas de répteis de escamas blindadas seguem em direção a um ninho desconhecido.',
      'Restos de uma carroça mágica contêm pedras preciosas brutas e um diário de expedição incompleto.',
    ],
    pontos: ['duna das carcaças', 'rocha do vigia solitário', 'cratera de impacto miasmático'],
    historia: [
      'As lendas dizem que a Wasteland é a cicatriz de uma guerra primordial travada entre deuses e bestas fundadoras.',
      'A densidade de mana nesta terra é tão violenta que humanos comuns adoecem sem treinamento de circulação interna.',
    ],
  },
  {
    id: 'wasteland_desfiladeiro',
    nome: 'Desfiladeiro do Dragão Adormecido',
    regiao: 'Grande Terra Desolada',
    tipo: 'passo',
    perigo: 9,
    descricao:
      'Paredões verticais de rocha negra cortados por névoas perpétuas. O ar estala com resquícios do poder milenar de Shen, o Dragão das Névoas.',
    atmosfera: [
      'Névoas ilusórias distorcem a distância e projetam vozes e visões do passado dos viajantes.',
      'Ecos de trovões sem nuvens reverberam nas fendas do cânion rochoso.',
      'Silêncio espectral onde nem mesmo as bestas vorazes ousam pisar sem permissão.',
    ],
    privacidade: [2, 3],
    ganchos: [
      'Um altar de névoa antiga responde à ressonância de mana com desafios de intelecto e shogi.',
      'Fendas no chão gotejam água pura condensada de ilusão com propriedades curativas.',
    ],
    pontos: ['plataforma da névoa eterna', 'fenda dos ecos', 'antigo covil das miragens'],
    historia: [
      'Durante milhares de anos o dragão Muteki Shen dormiu aqui para escapar do tédio dos mortais e da Deusa.',
      'Aventureiros lendários que entraram no cânion nunca morreram: apenas viveram vidas inteiras dentro de ilusões prazerosas.',
    ],
  },
  {
    id: 'wasteland_pantano_bruma',
    nome: 'Pântano da Calamidade',
    regiao: 'Grande Terra Desolada',
    tipo: 'pantano',
    perigo: 9,
    descricao:
      'Uma planície encharcada envolta em escuridão e fios de seda de aranha resistentes como aço. Antigo território de caça da Aranha Negra.',
    atmosfera: [
      'O lodo borbulha emanando miasma corrosivo e casulos de seda gigante pendem de árvores retorcidas.',
      'Fios quase invisíveis vibram com a passagem do vento, denunciando qualquer presa incauta.',
      'A escuridão engole a luz das tochas e a sensação de uma fome insaciável paira no ar.',
    ],
    privacidade: [2, 3],
    ganchos: [
      'Alkes (pequenas aranhas conscientes) observam das copas e aceitam oferendas de comida saborosa.',
      'Um lago de lodo esconde minérios impregnados de absorção mágica absoluta.',
    ],
    pontos: ['ninho dos fios de ébano', 'clareira do casulo ancestral', 'charco do banquete eterno'],
    historia: [
      'A Aranha Negra da Calamidade consumiu exércitos inteiros e florestas sem nunca saciar a fome voraz que a consumia.',
      'Somente quando encontrou um mestre capaz de alimentá-la com mana condensado e iguarias arcanas o pântano conheceu a paz.',
    ],
  },
  {
    id: 'wasteland_ninho_fenix',
    nome: 'Penhasco de Chamas de Suzaku',
    regiao: 'Grande Terra Desolada',
    tipo: 'colina',
    perigo: 10,
    descricao:
      'Um pico vulcânico onde rochas incandescentes vertem rios de fogo eterno. O território sagrado do Pássaro Vermelho Primordial.',
    atmosfera: [
      'O ar queima as narinas e plumas de fogo dançam no vento térmico ascendente.',
      'Rochas de obsidiana brilham como brasas sob a luz ofuscante da cratera.',
      'Cinzas douradas caem como chuva suave sobre as fendas fumegantes do penhasco.',
    ],
    privacidade: [2, 3],
    ganchos: [
      'Penas incandescentes incrustadas na lava que concedem imunidade a chamas se colhidas com perícia.',
      'O ninho pulsa com calor maternal aguardando um soberano digno de firmar pacto.',
    ],
    pontos: ['cratera das cinzas eternas', 'altar da pluma carmesim', 'pico dos ventos solares'],
    historia: [
      'Suzaku incendiou os céus durante o nascimento do mundo e dorme sob o fogo quando não é cortejada por almas de fogo superior.',
    ],
  },
];

// ── Academia de Rotsgard: Polo de Cultura e Magia Hyuman ──────────────────
const ROTSGARD: Def[] = [
  {
    id: 'rotsgard_distrito_central',
    nome: 'Rotsgard - Praça da Academia',
    regiao: 'Academia de Rotsgard',
    tipo: 'cidade',
    perigo: 2,
    descricao:
      'A capital acadêmica dos reinos hyumans. Torres brancas e jardins geométricos onde nobres e prodígios estudam encantamentos e esgrima.',
    atmosfera: [
      'Estudantes de mantos bordados discutem teorias de círculos mágicos em torno da estátua central da Deusa.',
      'Sinos de cristal marcam o término dos exames práticos nas arenas de duelo.',
      'Passeios ladeados de lamparinas alquímicas onde carruagens de nobres desfilam sob escoltas de cavalheiros.',
    ],
    privacidade: [0, 1],
    ganchos: [
      'Professores aristocratas conspiram para desacreditar instrutores e comerciantes estrangeiros.',
      'O festival escolar de combate aproxima-se e academias buscam mestres para treinar alunos desajustados.',
    ],
    pontos: ['auditório das palestras', 'jardins da deusa', 'arena de duelos práticos', 'quarteirão dos mestres'],
    historia: [
      'Rotsgard foi fundada como território neutro para evitar que as nações entrassem em guerra pela tutela dos maiores círculos mágicos.',
      'A biblioteca subterrânea guarda grimórios de eras anteriores que foram expurgados pelo dogma da Deusa.',
    ],
  },
  {
    id: 'rotsgard_biblioteca_arcanum',
    nome: 'Rotsgard - Grande Biblioteca',
    regiao: 'Academia de Rotsgard',
    tipo: 'torre',
    perigo: 1,
    descricao:
      'Um labirinto colossal de pergaminhos, estantes infinitas e tomos encadernados em couro de wyvern. O santuário do saber do continente.',
    atmosfera: [
      'Silêncio absoluto quebrado apenas pelo deslizar suave de penas sobre folhas de pergaminho.',
      'Luz filtrada por vitrais azuis ilumina poeira dourada suspensa no ar climatizado.',
      'Gárgulas encantadas observam corredores restritos para impedir o roubo de tomos proibidos.',
    ],
    privacidade: [1, 3],
    ganchos: [
      'Um tomo sobre a língua comum dos monstros e demi-humanos foi escondido na ala de heresias.',
      'Um estudante pede ajuda para decifrar a fórmula de um catalisador de mana comprimido.',
    ],
    pontos: ['ala dos grimórios elementais', 'arquivo de genealogias nobres', 'seção proibida dos apócrifos'],
    historia: [
      'Quase um terço dos manuscritos antigos foi queimado durante a grande inquisição de beleza da Deusa.',
    ],
  },
];

// ── Subespaço de Asora: Assentamento Multirracial Soberano ─────────────────
const ASORA: Def[] = [
  {
    id: 'asora_vila_central',
    nome: 'Asora - Vila Central',
    regiao: 'Subespaço de Asora',
    tipo: 'subespaco',
    perigo: 0,
    descricao:
      'O coração do subespaço criado pelo poder de Shen e expandido pela mana do Mestre. Um paraíso pacífico onde orcs de highland, anões e lagartos convivem em perfeita harmonia.',
    atmosfera: [
      'Crianças de highland correm entre canteiros viçosos de arroz e cevada enquanto guerreiros lizard cumprimentam com respeito.',
      'Cheiro delicioso de banquetes sendo preparados com peixes de rio puro e vegetais gigantescos.',
      'Céu límpido iluminado por duas luas amenas refletidas nas águas tranquilas do lago central.',
    ],
    privacidade: [1, 3],
    ganchos: [
      'Ema apresenta o balanço da safra de grãos e pede autorização para construir novos armazéns.',
      'Uma delegação de novas espécies pede audiência para jurar lealdade e migrar para Asora.',
    ],
    pontos: ['mansão do senhor de asora', 'praça dos banquetes multirraciais', 'lago das duas luas', 'pomares férteis'],
    historia: [
      'Asora nasceu no instante em que o contrato de alma foi selado, condensando o mar de névoas de Shen em terra fértil inabalável.',
      'Nenhum hyuman jamais pisou em Asora sem o convite expresso e a permissão do Mestre da dimensão.',
    ],
  },
  {
    id: 'asora_forja_anoes',
    nome: 'Asora - Forja dos Anões Anciãos',
    regiao: 'Subespaço de Asora',
    tipo: 'subespaco',
    perigo: 0,
    descricao:
      'O complexo metalúrgico onde Beren e os Mestres Elder Dwarves martelam metais celestiais. Chamas que nunca se apagam iluminam fornalhas rúnicas.',
    atmosfera: [
      'Martelos pesados caem em ritmo musical sobre bigornas de mithril enquanto faíscas azuis iluminam o galpão.',
      'Vapor denso de têmpera aromática envolve canos de cobre polido e caldeiras geotérmicas.',
      'Anões veteranos analisam lâminas e anéis Draupnir com lentes de aumento e orgulho inabalável.',
    ],
    privacidade: [1, 2],
    ganchos: [
      'Beren precisa de minérios brutos da Wasteland para forjar a próxima fornada de anéis de contenção.',
      'Uma katana lendária acaba de sair da têmpera aguardando o teste do Mestre.',
    ],
    pontos: ['bigorna primordial', 'forno de oricalco', 'bancada dos anéis draupnir', 'armazém de lingotes'],
    historia: [
      'Os Elder Dwarves estavam à beira da extinção na Wasteland até serem acolhidos em Asora com pleno respeito à sua arte.',
    ],
  },
  {
    id: 'asora_fontes_termais',
    nome: 'Asora - Fontes Termais Shinto',
    regiao: 'Subespaço de Asora',
    tipo: 'subespaco',
    perigo: 0,
    descricao:
      'Um retiro tradicional em estilo japonês com pavilhões de madeira de cedro, esteiras de tatame e banheiras de pedra natural alimentadas por fontes minerais purificadoras.',
    atmosfera: [
      'Vapor aromático sobe das águas quentes cercadas por rochas lisas e bambuzais bem cuidados.',
      'O som suave de um shishi-odoshi batendo na pedra entrecortado pelo vento nas folhas.',
      'As servas de contrato descansam e disputam sutilmente a atenção do Mestre após as jornadas.',
    ],
    privacidade: [2, 3],
    ganchos: [
      'Tomoe desfruta de uma garrafa de sake especial enquanto assiste a uma encenação de drama histórico.',
      'Mio testa novas receitas com ingredientes raros no pavilhão de chá.',
    ],
    pontos: ['banho termal das névoas', 'pavilhão de sake e descanso', 'jardim shinto zen', 'vestiário privativo'],
    historia: [
      'Construído por insistência de Tomoe com base nas memórias transferidas pelo Mestre durante o ritual do pacto.',
    ],
  },
  {
    id: 'asora_atelie_seda',
    nome: 'Asora - Ateliê das Alkes',
    regiao: 'Subespaço de Asora',
    tipo: 'subespaco',
    perigo: 0,
    descricao:
      'Oficina onde as aranhas Alkes fiam seda arcana de Mio em teares delicados, produzindo tecidos imunes a lâminas e fogo com elegância sem igual.',
    atmosfera: [
      'Teares de madeira deslizam com precisão rápida urdindo fios negros e dourados que reluzem na penumbra.',
      'Pequenas aranhas de seda descansam em almofadas de veludo após sessões produtivas.',
      'Rolos de quimonos magníficos aguardam entrega para o Mestre e para a vitrine da Companhia Kuzunoha.',
    ],
    privacidade: [1, 2],
    ganchos: [
      'As artesãs terminaram um novo manto reforçado com propriedades de camuflagem miasmática.',
      'Uma nova linhagem de fios mágicos precisa de mana para estabilizar o tingimento.',
    ],
    pontos: ['grande tear de seda negra', 'bancada de alfaiataria de luxo', 'depósito dos casulos primorosos'],
    historia: [
      'As Alkes foram resgatadas da fome do pântano por Mio e agora encontram realização criando os trajes mais cobiçados do mundo.',
    ],
  },
];

export const locaisTsukimichi: Local[] = [
  ...TSIGE.map(expandir),
  ...WASTELAND.map(expandir),
  ...ROTSGARD.map(expandir),
  ...ASORA.map(expandir),
];

/**
 * Arestas do Novo Mundo e conexões com Halvern.
 * Estrutura: [origem, destino, periodos, perigo]
 * Toda rota é bidirecional.
 */
export const ARESTAS_TSUKIMICHI: [string, string, number, number][] = [
  // Conexão Transcontinental: Fim de Halvern (Solgar) ao Portão do Novo Mundo (Tsige)
  ['solgar', 'tsige_portao_ermo', 3, 6],

  // Tsige interna
  ['tsige_portao_ermo', 'tsige_distrito_comercial', 0, 1],
  ['tsige_distrito_comercial', 'tsige_guilda_aventureiros', 0, 1],
  ['tsige_portao_ermo', 'tsige_guilda_aventureiros', 0, 1],
  ['tsige_distrito_comercial', 'tsige_companhia_kuzunoha', 0, 1],

  // Expedições de Tsige para a Grande Terra Desolada (Wasteland)
  ['tsige_portao_ermo', 'wasteland_fronteira', 1, 7],
  ['wasteland_fronteira', 'wasteland_desfiladeiro', 1, 8],
  ['wasteland_desfiladeiro', 'wasteland_pantano_bruma', 1, 9],
  ['wasteland_desfiladeiro', 'wasteland_ninho_fenix', 1, 9],

  // Estrada de Caravanas: Tsige para Academia de Rotsgard
  ['tsige_distrito_comercial', 'rotsgard_distrito_central', 2, 4],
  ['rotsgard_distrito_central', 'rotsgard_biblioteca_arcanum', 0, 1],

  // Estrutura interna do Subespaço de Asora
  ['asora_vila_central', 'asora_forja_anoes', 0, 0],
  ['asora_vila_central', 'asora_fontes_termais', 0, 0],
  ['asora_vila_central', 'asora_atelie_seda', 0, 0],

  // Portais de Névoa (Mist Gate) conectando Asora ao mundo físico
  ['asora_vila_central', 'tsige_companhia_kuzunoha', 0, 0],
  ['asora_vila_central', 'solgar', 0, 0],
];
