// O mapa dos cartógrafos (assets/feudo/mapa_continente.jpg), lido símbolo por
// símbolo. Cada coisa pintada vira parte do mundo:
// - "nome_antigo": o nome pintado de um lugar que o jogo já tem (Tesselgarde é
//   Tessel no mapa velho). O cartão do lugar mostra os dois.
// - "lenda": um símbolo sem lugar de visita — o dragão do bosque, as serpentes
//   do mar, o redemoinho, os estandartes. É crença: o povo da região conta, o
//   narrador pode citar, ninguém confirma.
// As coordenadas são do desenho (0–100), onde o símbolo está pintado.

export type MarcoPintado = {
  id: string;
  nome: string;
  tipo: 'nome_antigo' | 'lenda';
  regiao: string;
  x: number;
  y: number;
  /** Lugar do jogo que este nome pintado designa (nome_antigo) ou o mais perto (lenda). */
  localId?: string;
  /** O que o povo conta, em duas ou três frases. */
  lenda: string;
  /** Uma frase de boca de taverna, para o narrador soltar numa fala. */
  boato: string;
};

export const MARCOS_PINTADOS: MarcoPintado[] = [
  // ── Nomes antigos pintados ────────────────────────────────────────────────
  { id: 'n_tesselgarde', nome: 'Tesselgarde', tipo: 'nome_antigo', regiao: 'Marca de Tessel', x: 50, y: 18, localId: 'tessel',
    lenda: 'Tesselgarde era o nome da cidade quando ela ainda era só a guarda do passo, antes do marechal fazer dela capital da Marca.',
    boato: 'Os velhos de Tessel ainda dizem "subir à Garde" quando vão ao castelo.' },
  { id: 'n_gelo_fortis', nome: 'Gelo-Fortis', tipo: 'nome_antigo', regiao: 'Marca de Tessel', x: 64, y: 13, localId: 'forte_agulha',
    lenda: 'Os cartógrafos pintaram o Forte Agulha como Gelo-Fortis, o forte de gelo: a muralha norte passa o ano coberta de geada que não derrete.',
    boato: 'Na Agulha a água da cisterna congela até no verão, e os soldados juram que é a pedra que é fria.' },
  { id: 'n_vintraborg', nome: 'Vintraborg', tipo: 'nome_antigo', regiao: 'Bosque de Vintra', x: 28.5, y: 38.5, localId: 'vintra',
    lenda: 'Vintraborg foi o burgo cercado de estacas que virou Vintra. A paliçada caiu; o nome velho ficou só nos mapas.',
    boato: 'Tem estaca da paliçada velha ainda enterrada no quintal de meia Vintra.' },
  { id: 'n_clareira_negra', nome: 'Clareira Negra', tipo: 'nome_antigo', regiao: 'Bosque de Vintra', x: 33, y: 58, localId: 'clareira_pedras',
    lenda: 'O mapa chama de Clareira Negra o lugar do círculo de pedras. Negra pela terra queimada no meio do círculo, onde a grama nunca volta.',
    boato: 'No meio das pedras a terra é preta e quente, até no inverno.' },
  { id: 'n_sombraltrar', nome: 'Sombraltrar', tipo: 'nome_antigo', regiao: 'Bosque de Vintra', x: 18, y: 60, localId: 'pantano_lodo',
    lenda: 'Sombraltrar, "o altar da sombra", é o nome velho do Lodaçal: dizem que havia ali um altar antes do pântano engolir tudo.',
    boato: 'Quando o Lodaçal baixa na seca, aparece uma pedra lisa demais para ser natural.' },
  { id: 'n_pedra_alta', nome: 'Pedra-Alta', tipo: 'nome_antigo', regiao: 'Planalto de Corveira', x: 34.5, y: 70, localId: 'colina_forcados',
    lenda: 'Pedra-Alta é a Colina dos Forcados no mapa: o morro onde a Coroa enforcava ladrão de minério, à vista do planalto inteiro.',
    boato: 'Do alto da Pedra-Alta se vê fumaça de bando dois dias antes de ele chegar.' },
  { id: 'n_corveiraborg', nome: 'Corveiraborg', tipo: 'nome_antigo', regiao: 'Planalto de Corveira', x: 43, y: 75.5, localId: 'corveira',
    lenda: 'Corveiraborg, o burgo dos corvos: Corveira no tempo em que os corvos das minas eram mais numerosos que os mineiros.',
    boato: 'Corvo pousado na porta da mina é sinal de desabamento, e ninguém entra.' },
  { id: 'n_mina_ferro', nome: 'Mina de Ferro', tipo: 'nome_antigo', regiao: 'Planalto de Corveira', x: 51, y: 61.5, localId: 'aldeia_ferro',
    lenda: 'A mina pintada no mapa é a de Ferro Velho: o veio que deu o ferro das espadas do Vale por três gerações.',
    boato: 'O veio de Ferro Velho está no fim, e os donos fingem que não.' },
  { id: 'n_mina_prata', nome: 'Mina de Prata', tipo: 'nome_antigo', regiao: 'Planalto de Corveira', x: 57, y: 64.5, localId: 'mina_corveira',
    lenda: 'O Poço Fundo foi mina de prata antes de ser só poço. A prata acabou; o nome ficou no mapa e a cobiça ficou nas pessoas.',
    boato: 'Dizem que ainda tem prata no fundo do Poço, e que por isso ninguém que desce volta falando.' },
  { id: 'n_solgar_capital', nome: 'Solgar Capital', tipo: 'nome_antigo', regiao: 'Ermo de Solgar', x: 29, y: 83, localId: 'solgar',
    lenda: 'O mapa chama Solgar de capital. Foi, de um reino de areia que durou uma geração; hoje é vila de oásis que ainda cobra pedágio de caravana.',
    boato: 'Em Solgar ainda tem quem se chame de príncipe, e cobra como tal.' },
  { id: 'n_halvetia', nome: 'Halvetia Capital', tipo: 'nome_antigo', regiao: 'Vale de Halvet', x: 68.5, y: 50, localId: 'casa_senhorial',
    lenda: 'Halvetia era como a Casa de Halvet queria que o Vale se chamasse. O mapa foi pago por ela; o povo nunca usou o nome.',
    boato: 'Quem chama o Vale de Halvetia está puxando saco da Casa de Pedra.' },
  { id: 'n_mareuborg', nome: 'Mareuborg Porto', tipo: 'nome_antigo', regiao: 'Costa de Mareu', x: 69, y: 75, localId: 'mareu',
    lenda: 'Mareuborg foi o nome do porto quando as três vilas ainda brigavam; o mapa o pinta duas vezes porque cada vila jurava ser o porto de verdade.',
    boato: 'Os cartógrafos pintaram Mareuborg duas vezes, e as duas vilas ainda brigam por qual é a certa.' },
  { id: 'n_enseada_velha', nome: 'Enseada Velha', tipo: 'nome_antigo', regiao: 'Costa de Mareu', x: 84.5, y: 76, localId: 'aldeia_rede',
    lenda: 'A Enseada Velha é onde fica Rede Rota. "Velha" porque o porto de antes da Coroa era ali, antes do mar assorear a entrada.',
    boato: 'Debaixo da lama da Enseada tem cais de pedra, e às vezes a maré mostra uma argola de ferro.' },

  // ── Lendas: símbolos sem lugar de visita ──────────────────────────────────
  { id: 'l_dragao_vintra', nome: 'O Dragão do Bosque', tipo: 'lenda', regiao: 'Bosque de Vintra', x: 36, y: 32, localId: 'vintra',
    lenda: 'Os cartógrafos pintaram um dragão enrolado no norte do Bosque de Vintra, onde a névoa nunca levanta. Ninguém em Vintra viu dragão; todos viram gente entrar na névoa e não sair.',
    boato: 'O dragão do mapa é aviso: onde ele está pintado, a névoa come quem entra.' },
  { id: 'l_serpente_leste', nome: 'A Serpente de Fora', tipo: 'lenda', regiao: 'Costa de Mareu', x: 90, y: 82, localId: 'aldeia_rede',
    lenda: 'Além das pedras de Rede Rota, o mapa pinta uma serpente do mar. Os pescadores dizem que ela segue os cardumes e vira barco que pesca demais.',
    boato: 'Quem pesca além das pedras de fora devolve o primeiro peixe, para a Serpente não cobrar o barco.' },
  { id: 'l_serpente_sul', nome: 'As Duas Cabeças do Sul', tipo: 'lenda', regiao: 'Costa de Mareu', x: 75.5, y: 92, localId: 'porto_sal',
    lenda: 'Ao sul do Porto do Sal o mapa mostra outra serpente, de duas cabeças. A guilda do sal paga uma missa por ano para ela ficar longe das barcaças.',
    boato: 'A missa da serpente é a única que a guilda do sal paga sem reclamar.' },
  { id: 'l_redemoinho', nome: 'O Redemoinho do Oceanus', tipo: 'lenda', regiao: 'Bosque de Vintra', x: 3.5, y: 72, localId: 'pantano_lodo',
    lenda: 'Na costa oeste, depois do Lodaçal, o mar gira num redemoinho que o mapa pinta como espiral. Navio que entra não sai; o que sai, sai sem gente.',
    boato: 'O redemoinho do oeste devolve os barcos vazios na praia do Lodaçal, com a mesa posta.' },
  { id: 'l_naufragio', nome: 'O Naufrágio de Sombraltrar', tipo: 'lenda', regiao: 'Bosque de Vintra', x: 12.5, y: 63.5, localId: 'pantano_lodo',
    lenda: 'As pedras pintadas diante de Sombraltrar guardam o casco de um navio da Coroa que trazia o Tributo de Sangue. O que ia no porão nunca foi achado.',
    boato: 'O navio do Tributo afundou com o porão cheio, e o Lodaçal sabe onde.' },
  { id: 'l_velas', nome: 'As Velas do Oceanus', tipo: 'lenda', regiao: 'Costa de Mareu', x: 94.5, y: 63, localId: 'farol_quebrado',
    lenda: 'Os navios pintados no mar leste são as naus que vinham de além do Oceanus antes do farol apagar. Desde que ele quebrou, nenhuma voltou.',
    boato: 'Se o farol acender de novo, as naus de fora voltam — e ninguém sabe se isso é bom.' },
  { id: 'l_estandarte_norte', nome: 'O Estandarte do Leão Rubro', tipo: 'lenda', regiao: 'Baixios de Halvern', x: 47, y: 33, localId: 'vau_pedra',
    lenda: 'O estandarte vermelho pintado no norte do Vale marca onde Tessel e Halvet assinaram a divisa. O marco de pedra ainda está lá, e cada Casa diz que o outro o moveu.',
    boato: 'O marco da divisa já andou três passos para o sul desde que eu era menino.' },
  { id: 'l_estandarte_centro', nome: 'O Estandarte do Coração', tipo: 'lenda', regiao: 'Halvern', x: 58.5, y: 34, localId: 'estrada_real',
    lenda: 'O segundo estandarte, de coração em campo vermelho, é o da Casa de Halvet no tempo em que ela jurava proteger a estrada real. O juramento ficou no mapa.',
    boato: 'Halvet jura proteger a estrada, e a estrada nunca viu um soldado de Halvet.' },
  { id: 'l_estandarte_leste', nome: 'O Estandarte Dourado', tipo: 'lenda', regiao: 'Fora do Vale', x: 76, y: 44, localId: 'torre',
    lenda: 'O estandarte dourado a leste marca a torre de onde se vigiava o vale para a Coroa. O dourado é da Coroa; a torre, hoje, é do Vigia e de ninguém.',
    boato: 'A Coroa ainda paga um vigia na torre do leste, e ele ainda não sabe para quem vigia.' },
  { id: 'l_ponte_velha', nome: 'A Ponte-Velha', tipo: 'lenda', regiao: 'Fora do Vale', x: 77, y: 55, localId: 'ruinas',
    lenda: 'A Ponte-Velha pintada a leste é a travessia de pedra das Ruínas de Mir, mais velha que o Vale. Tem nomes gravados nos arcos numa língua que ninguém lê.',
    boato: 'Os nomes da Ponte-Velha mudam de lugar entre uma lua e outra.' },
  { id: 'l_campos_rio_verde', nome: 'Os Campos do Rio-Verde', tipo: 'lenda', regiao: 'Vale de Halvet', x: 53.5, y: 49, localId: 'moinho',
    lenda: 'Os campos quadriculados pintados na beira do Rio-Verde são as terras do Moinho, que já alimentaram o Vale inteiro. O moinho parou; os campos o mapa ainda mostra cheios.',
    boato: 'Desde que o Moinho parou, o Rio-Verde corre mais devagar, como se esperasse.' },
  { id: 'l_rio_verde', nome: 'O Rio-Verde', tipo: 'lenda', regiao: 'Baixios de Halvern', x: 46.5, y: 43, localId: 'vau_pedra',
    lenda: 'O Rio-Verde nasce na Marca e morre no mar de Mareu. A água é verde por causa do limo das pedras, dizem os sábios; por causa do sangue do gigante, diz o povo.',
    boato: 'Quem bebe do Rio-Verde na lua cheia sonha com a batalha dos gigantes.' },
  { id: 'l_castelo_serra', nome: 'O Castelo no Alto da Serra', tipo: 'lenda', regiao: 'Marca de Tessel', x: 50.5, y: 7, localId: 'tessel',
    lenda: 'No pico mais alto da Marca o mapa pinta um castelo que nenhuma patrulha de Tessel encontrou. Os pastores dizem que ele aparece só de noite, e que as janelas mudam de lugar.',
    boato: 'Um pastor viu o castelo da serra aceso, contou as janelas, e na noite seguinte eram outras.' },
  { id: 'l_boca_serra', nome: 'A Boca na Serra', tipo: 'lenda', regiao: 'Planalto de Corveira', x: 52, y: 78, localId: 'corveira',
    lenda: 'A caverna pintada no sul do planalto seria uma forja de antes da Coroa, afundada num desabamento. Na chuva, sai fumaça dela.',
    boato: 'Tem martelo batendo dentro da serra em noite de tempestade.' },
  { id: 'l_petra_aurea', nome: 'Petra-Áurea', tipo: 'lenda', regiao: 'Ermo de Solgar', x: 27, y: 89, localId: 'poco_seco',
    lenda: 'Petra-Áurea é uma rocha que brilha como ouro ao pôr do sol, perto do Poço Seco. Os caravaneiros a usam de marco; os tolos cavam em volta atrás do ouro que ela não tem.',
    boato: 'Petra-Áurea não é ouro, mas já matou mais gente que o ouro de Corveira.' },
  { id: 'l_oasis', nome: 'O Oásis de Solgar', tipo: 'lenda', regiao: 'Ermo de Solgar', x: 25.5, y: 86, localId: 'solgar',
    lenda: 'O oásis que dá vida a Solgar nunca secou, nem no ano sem chuva. O povo diz que é lágrima de uma deusa morta; a Ordem manda dizer que é providência.',
    boato: 'Quem cospe na água do oásis vê ela baixar um palmo naquela noite.' },
  { id: 'l_deserto_cranios', nome: 'O Deserto dos Crânios', tipo: 'lenda', regiao: 'Ermo de Solgar', x: 33, y: 95, localId: 'ruina_areia',
    lenda: 'O sul do Ermo é o Deserto dos Crânios: os caveirões pintados no mapa são de caravanas que tentaram o atalho para Mareu sem guia de Solgar.',
    boato: 'No Deserto dos Crânios, se você vê uma caveira limpa, alguém morreu esta semana.' },
];

/** Os nomes antigos de um lugar do jogo, se o mapa pintou algum. */
export function nomesAntigosDe(localId: string): MarcoPintado[] {
  return MARCOS_PINTADOS.filter((m) => m.tipo === 'nome_antigo' && m.localId === localId);
}

/** Lendas pintadas na região (para o narrador e o mapa). */
export function lendasDaRegiao(regiao: string): MarcoPintado[] {
  return MARCOS_PINTADOS.filter((m) => m.tipo === 'lenda' && m.regiao === regiao);
}

/** O que o povo deste lugar conta do mapa: primeiro as lendas ligadas a ele, depois as da região. */
export function lendasPerto(localId: string, regiao: string, max = 2): MarcoPintado[] {
  const daqui = MARCOS_PINTADOS.filter((m) => m.tipo === 'lenda' && m.localId === localId);
  const regiaoToda = lendasDaRegiao(regiao).filter((m) => !daqui.includes(m));
  return [...daqui, ...regiaoToda].slice(0, max);
}
