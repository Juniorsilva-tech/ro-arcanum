// ARCANUM · Famílias do elenco de Vaelhorn (sessão 47).
//
// Parentesco entre gente que já existia. Ninguém foi inventado para caber
// numa árvore: cada família saiu da idade, do lugar, do ofício, do segredo e
// das relações que o NPC já tinha — a rival que vira irmã, a protegida que
// vira filha. Os moradores gerados por content/vaelhorn/povoamento.ts têm
// id estável pelo lugar (`morador_<local>_<n>`), então entram aqui como se
// tivessem sido escritos à mão.
//
// Duas regras do cenário pesam em tudo abaixo:
// - O vale é das mulheres. Os homens da família existem, mas estão AUSENTES:
//   foram à ponte aos dezoito, morreram no desabamento, vieram de fora e não
//   ficaram. Por isso `ausentes`, e não NPC novo.
// - Em Tessel, "leva" é o recrutamento da marca, não o chamado da ponte.
//
// `tensao` é o que a vizinhança conta. Segredo de NPC não entra aqui — o
// narrador recebe este texto antes de o jogador descobrir qualquer coisa.
import type { FamiliaNpc } from '../../engine/types';

export const familiasVaelhorn: FamiliaNpc[] = [
  // ───────────────────────────── VALE DE HALVET
  {
    id: 'casa_de_halvet',
    nome: 'a casa de Halvet',
    sede: 'casa_senhorial',
    tensao:
      'Dama Valda criou o filho para herdar o nome e a Leva o levou no inverno dos dezoito. ' +
      'Desde então a herdeira é Ysolde, a filha que ninguém preparou, e as duas jantam na mesma mesa sem dividir nada além dela.',
    membros: [
      { npc: 'dama_valda', papel: 'A mãe. Ainda põe o lugar do filho à mesa no dia em que ele faria anos, e não deixa Ysolde sentar ali.' },
      { npc: 'ysolde', papel: 'A filha que virou herdeira por falta de outra. Aprendeu a esperar porque a mãe nunca lhe deu o que fazer.' },
    ],
    lacos: [{ tipo: 'mae', a: 'dama_valda', b: 'ysolde' }],
    ausentes: [{ nome: 'Aldren de Halvet', laco: 'filho de Valda, irmão de Ysolde', destino: 'foi à ponte no inverno em que fez dezoito anos' }],
  },
  {
    id: 'gente_da_taverna',
    nome: 'a gente da taverna',
    sede: 'taverna',
    tensao:
      'Aldrica pegou Elza para criar quando a mãe da menina morreu de febre, e a criou atrás do balcão. ' +
      'Elza chama a taverna de casa e o serviço de prisão; Aldrica finge não ouvir a segunda parte.',
    membros: [
      { npc: 'aldrica', papel: 'Mãe de criação. Paga a dívida com a Fiadora em dia para que ela nunca passe para Elza.' },
      { npc: 'elza', papel: 'Criada como filha e posta para servir como empregada. Guarda moeda num vão da parede para o dia de ir embora.' },
    ],
    lacos: [{ tipo: 'mae', a: 'aldrica', b: 'elza' }],
    ausentes: [{ nome: 'Maren', laco: 'mãe de sangue de Elza, amiga de Aldrica', destino: 'morreu de febre quando Elza tinha dois anos' }],
  },
  {
    id: 'as_do_norte',
    nome: 'as do Norte',
    sede: 'mercado',
    tensao:
      'Urda do Norte queria as duas filhas na guilda. Zeno escolheu a lança da guarda e trocou o nome da família pelo da rua de baixo, onde foi morar. ' +
      'Ulla ficou, abriu a loja com dinheiro da mãe e é a única que ainda almoça com ela.',
    membros: [
      { npc: 'morador_mercado_2', papel: 'A mãe, mestra de guilda. Protege a filha capitã em público e não a perdoa em casa.' },
      { npc: 'morador_mercado_1', papel: 'A filha que saiu da guilda para a guarda. Todo mundo no mercado a chama de "de Baixo", menos a mãe, que ainda a chama pelo nome inteiro.' },
      { npc: 'morador_mercado_3', papel: 'A filha que ficou. Faz a conta da loja e a conta das brigas das outras duas, e cobra das duas.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'morador_mercado_2', b: 'morador_mercado_1' },
      { tipo: 'mae', a: 'morador_mercado_2', b: 'morador_mercado_3' },
    ],
  },
  {
    id: 'as_duas_yaras',
    nome: 'as duas Yaras',
    sede: 'mercado',
    tensao:
      'Duas primas batizadas com o nome da mesma avó, a Yara que abriu a primeira banca da praça. ' +
      'Uma responde pelo mercado; a outra, pelo que se vende nele depois que escurece. Devem dinheiro uma à outra desde o enterro da avó e nenhuma aceita dizer quanto.',
    membros: [
      { npc: 'morador_mercado_0', papel: 'A prima que ficou com o posto de senhora do mercado. Fala baixo porque aprendeu cedo que a outra ouve tudo.' },
      { npc: 'morador_mercado_9', papel: 'A prima que ficou com a rua. Generosa com todo mundo, menos com a Yara de cima.' },
      { npc: 'morador_mercado_6', papel: 'Filha da Yara de baixo. Toca a taverna onde a mãe faz negócio e não quer saber de que negócio.' },
    ],
    lacos: [
      { tipo: 'primas', a: 'morador_mercado_0', b: 'morador_mercado_9' },
      { tipo: 'mae', a: 'morador_mercado_9', b: 'morador_mercado_6' },
    ],
    ausentes: [{ nome: 'Yara Velha', laco: 'avó das duas', destino: 'morreu na banca, contando moeda, trinta anos atrás' }],
  },
  {
    id: 'as_da_bigorna',
    nome: 'as da Bigorna',
    sede: 'mercado',
    tensao:
      'Ilde Bigorna deixou uma forja e duas filhas e morreu sem dizer qual herdava. Torana e Duna dividiram a praça ao meio e cada uma diz que a outra tempera mal. ' +
      'A filha de Duna aprendeu com a mãe e hoje leva o ferro para a tia experimentar, escondida.',
    membros: [
      { npc: 'torana', papel: 'A irmã mais nova. Honesta a ponto de dizer que a forja devia ter sido de Duna — e de continuar batendo ferro nela assim mesmo.' },
      { npc: 'duna', papel: 'A irmã mais velha. Recusa trabalho indigno e recusa também qualquer peça que passe pela bigorna da irmã.' },
      { npc: 'morador_mercado_4', papel: 'Filha de Duna, armeira. A única que atravessa a praça entre as duas bigornas.' },
    ],
    lacos: [
      { tipo: 'irmas', a: 'torana', b: 'duna' },
      { tipo: 'mae', a: 'duna', b: 'morador_mercado_4' },
    ],
    ausentes: [{ nome: 'Ilde Bigorna', laco: 'mãe de Torana e Duna', destino: 'morreu na forja sem deixar testamento' }],
  },
  {
    id: 'as_cava_fundo',
    nome: 'as Cava-Fundo',
    sede: 'cemiterio',
    tensao:
      'Na família de Oda o silêncio é ofício: a mãe cava e sabe onde cada um foi posto, a filha carrega recado e sabe o que cada um diz. ' +
      'A tia, cega na ponte, sabe o que passa. As três se encontram para comer e nunca contam umas às outras o que sabem.',
    membros: [
      { npc: 'oda', papel: 'A mãe, coveira. Queria Pia longe do cemitério e conseguiu: a filha foi parar na praça, que é pior.' },
      { npc: 'pia', papel: 'A filha. Corre o vale inteiro com recado alheio e volta para casa só quando a mãe está dormindo.' },
      { npc: 'morda', papel: 'Tia de Oda, irmã caçula da mãe dela. Não enxerga, e é quem Oda mais escuta.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'oda', b: 'pia' },
      { tipo: 'tia', a: 'morda', b: 'oda' },
    ],
  },
  {
    id: 'as_do_espelho',
    nome: 'as do Espelho',
    sede: 'lago',
    tensao:
      'Ganta pesca no lago e Iva leva o peixe da mãe até a estrada toda semana. ' +
      'Mãe e filha brigam pelo preço, pela chuva e pela carroça, e nunca pelo que importa: cada uma guarda alguma coisa que não era dela.',
    membros: [
      { npc: 'ganta', papel: 'A mãe. Diz que a filha puxou o pai, que era de fora e medroso, e diz isso com carinho.' },
      { npc: 'iva', papel: 'A filha carreteira. Deve dinheiro a meio mundo e nunca deixou de pagar o peixe da mãe.' },
    ],
    lacos: [{ tipo: 'mae', a: 'ganta', b: 'iva' }],
    ausentes: [{ nome: 'Tarn', laco: 'pai de Iva', destino: 'carreteiro de fora; subiu a estrada do sal e não desceu' }],
  },
  {
    id: 'as_bael',
    nome: 'as Bael',
    sede: 'praca',
    tensao:
      'A sargenta pôs a filha na torre de vigia com dezessete anos, e o vale inteiro chamou aquilo de favor. ' +
      'Desde a noite em que a ponte caiu, Bael e Lunn não falam dessa noite, e cada uma trata a outra como quem guarda um vidro rachado.',
    membros: [
      { npc: 'sargenta_bael', papel: 'A mãe. Pôs a filha na torre e responde por ela antes que alguém pergunte.' },
      { npc: 'lunn', papel: 'A filha, vigia da torre. Deve à mãe o posto, e tem do escuro o medo que a mãe nunca teve.' },
    ],
    lacos: [{ tipo: 'mae', a: 'sargenta_bael', b: 'lunn' }],
  },

  // ───────────────────────────── FORA DO VALE
  {
    id: 'as_das_cinzas',
    nome: 'as das Cinzas',
    sede: 'acampamento',
    tensao:
      'Nadja foi a ervanária do vale até a vila chorar alguém que ela tratou. A filha entrou para a guarda para limpar o nome da mãe e desertou para o mesmo acampamento. ' +
      'Ruvela jogou fora o sobrenome e manda no acampamento; a mãe cuida dos feridos dela e as duas não se chamam de mãe e filha na frente de ninguém.',
    membros: [
      { npc: 'nadja', papel: 'A mãe, curandeira dos foragidos. Cobra em segredo de todo ferido, menos dos que a filha traz.' },
      { npc: 'ruvela', papel: 'A filha que virou Sem-Nome. Decide sozinha quem deve morrer, e nunca decidiu isso sobre a mãe, embora tenha motivo.' },
    ],
    lacos: [{ tipo: 'mae', a: 'nadja', b: 'ruvela' }],
  },
  {
    id: 'as_bico_fino',
    nome: 'as Bico-Fino',
    sede: 'acampamento',
    tensao:
      'Yara Bico-Fino criou quatro filhas numa parada de estrada e as mandou para longe umas das outras, uma por caminho. ' +
      'No ano em que a mãe adoeceu, Nevin levou a mula e o dote das irmãs e sumiu para Solgar. Yara nunca a deserdou; as três de Corveira nunca perdoaram nenhuma das duas.',
    membros: [
      { npc: 'morador_acampamento_0', papel: 'A mãe, dona da parada dos foragidos. Reza áspero pelas quatro filhas e escreve só para uma delas.' },
      { npc: 'morador_solgar_5', papel: 'A filha que levou a herança. Virou ladra conhecida em Solgar e tem orgulho do ofício, não do começo dele.' },
      { npc: 'morador_aldeia_ferro_0', papel: 'A mais velha das três que ficaram no planalto. Chamam de anciã porque manda na aldeia desde os trinta, e ela fala da irmã ladra por provérbio.' },
      { npc: 'morador_vila_terraco_3', papel: 'A do meio, curandeira no Terraço. Cuida de quem aparece e nunca abriu a porta para Nevin.' },
      { npc: 'morador_vila_terraco_6', papel: 'A caçula, tropeira. Ambiciosa como a irmã que foi embora, e é por isso que as outras a vigiam.' },
      { npc: 'morador_corveira_4', papel: 'Filha de Nevin, criada pelas tias no planalto. Armeira na cidade; sabe o nome da mãe e não o que ela faz.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'morador_acampamento_0', b: 'morador_solgar_5' },
      { tipo: 'mae', a: 'morador_acampamento_0', b: 'morador_aldeia_ferro_0' },
      { tipo: 'mae', a: 'morador_acampamento_0', b: 'morador_vila_terraco_3' },
      { tipo: 'mae', a: 'morador_acampamento_0', b: 'morador_vila_terraco_6' },
      { tipo: 'mae', a: 'morador_solgar_5', b: 'morador_corveira_4' },
    ],
  },
  {
    id: 'kamado',
    nome: 'os Kamado',
    sede: 'estrada',
    tensao:
      'Dois irmãos que sobraram de uma família inteira morta numa noite de neve. Viajam juntos, dormem em turnos e não se separam por nada. ' +
      'Quem pergunta pela família ouve de Tanjiro que eram seis, e dele não ouve mais nada.',
    membros: [
      { npc: 'tanjiro', genero: 'm', papel: 'O irmão mais velho. Carrega a irmã, a caixa e a culpa de ter estado fora vendendo carvão naquela noite.' },
      { npc: 'nezuko', papel: 'A irmã que sobrou com ele. Fala pouco, anda coberta e não se afasta do irmão por nada.' },
    ],
    lacos: [{ tipo: 'irmas', a: 'tanjiro', b: 'nezuko' }],
    ausentes: [
      { nome: 'Kie Kamado', laco: 'mãe', destino: 'morta com quatro dos filhos na noite do ataque' },
      { nome: 'Tanjuro Kamado', laco: 'pai', destino: 'morreu de doença antes do ataque; ensinou ao filho a dança do fogo' },
    ],
    naoHumanos: { nezuko: 'Nasceu humana, filha de Kie e Tanjuro Kamado. Foi transformada em oni na noite em que a família morreu; o laço de sangue é anterior à mudança.' },
  },
  {
    id: 'kocho',
    nome: 'as Kocho',
    sede: 'mansao_ubuyashiki',
    tensao:
      'Duas irmãs órfãs que juraram caçar juntas, e uma menina tirada de um vendedor de gente que as duas criaram como terceira irmã. ' +
      'Kanae sorri de verdade; Shinobu sorri para esconder; Kanao ainda precisa de uma moeda para decidir o que sente.',
    membros: [
      { npc: 'kanae', papel: 'A irmã mais velha. Acredita que até oni pode ser salvo, e é a crença que mais assusta Shinobu.' },
      { npc: 'shinobu', papel: 'A irmã do meio. Sorri para quem a irrita, e sorri mais quando a irritação cresce; só com Kanae o sorriso é de verdade.' },
      { npc: 'kanao', papel: 'A irmã de criação, comprada de volta pelas duas quando menina. Obedece às duas e só começou agora a desobedecer a si mesma.' },
    ],
    lacos: [
      { tipo: 'irmas', a: 'kanae', b: 'shinobu' },
      { tipo: 'irmas', a: 'kanae', b: 'kanao' },
      { tipo: 'irmas', a: 'shinobu', b: 'kanao' },
    ],
    ausentes: [{ nome: 'os pais Kocho', laco: 'pais de Kanae e Shinobu', destino: 'mortos por um oni quando as filhas eram crianças' }],
  },
  {
    id: 'shinazugawa',
    nome: 'os Shinazugawa',
    sede: 'mansao_ubuyashiki',
    tensao:
      'Os dois irmãos que sobraram de uma casa cheia. Sanemi manda Genya embora da caça sempre que o encontra, com as piores palavras que tem. ' +
      'Genya fica, e treina com o que a espada não lhe deu. Nenhum dos dois diz ao outro por que faz o que faz.',
    membros: [
      { npc: 'sanemi', genero: 'm', papel: 'O mais velho. Quer o irmão longe da espada para que ele viva, e diz isso do jeito que só afasta.' },
      { npc: 'genya', genero: 'm', papel: 'O mais novo. Gritou com o irmão numa noite que nenhum dos dois conta, e passou a vida querendo desdizer.' },
    ],
    lacos: [{ tipo: 'irmas', a: 'sanemi', b: 'genya' }],
    ausentes: [{ nome: 'Shizu Shinazugawa', laco: 'mãe', destino: 'morreu quando os filhos ainda eram crianças; Sanemi não diz como' }],
  },
  {
    id: 'rengoku',
    nome: 'os Rengoku',
    sede: 'mansao_ubuyashiki',
    tensao:
      'O pai largou a espada e o filho mais velho a pegou do chão e seguiu. ' +
      'Kyojuro ainda escreve ao pai contando cada missão; Shinjuro não responde e guarda todas as cartas.',
    membros: [
      { npc: 'shinjuro', genero: 'm', papel: 'O pai. Bebe e diz que a técnica da família não serve para nada, e lê as cartas do filho até decorar.' },
      { npc: 'rengoku', genero: 'm', papel: 'O filho mais velho. Acredita pelos dois, e pelo irmão caçula também.' },
    ],
    lacos: [{ tipo: 'pai', a: 'shinjuro', b: 'rengoku' }],
    ausentes: [
      { nome: 'Ruka Rengoku', laco: 'mãe de Kyojuro', destino: 'morreu quando Kyojuro era menino; pediu ao filho que usasse a força por quem não tem' },
      { nome: 'Senjuro Rengoku', laco: 'irmão caçula', destino: 'ficou na casa da família, sem cor no cabelo para as chamas' },
    ],
  },
  {
    id: 'ubuyashiki',
    nome: 'os Ubuyashiki',
    sede: 'mansao_ubuyashiki',
    tensao:
      'Uma linhagem amaldiçoada em que nenhum homem passa dos trinta, e a mulher que se casou com ela sabendo disso. ' +
      'Kagaya comanda os caçadores deitado; Amane governa a casa em pé, e os dois fingem para os filhos que a doença é cansaço.',
    membros: [
      { npc: 'kagaya', genero: 'm', papel: 'O chefe da casa. Lembra o nome de cada caçador morto e visita os túmulos enquanto consegue andar.' },
      { npc: 'amane', papel: 'A esposa, de uma família de sacerdotes. Escolheu o casamento e a maldição junto, e não aceita pena de ninguém.' },
    ],
    lacos: [{ tipo: 'conjuges', a: 'kagaya', b: 'amane' }],
    ausentes: [{ nome: 'os cinco filhos', laco: 'filhos de Kagaya e Amane', destino: 'crianças, guardadas na casa; a mais velha já ajuda a mãe' }],
  },

  // ───────────────────────────── MARCA DE TESSEL
  {
    id: 'as_varn',
    nome: 'as Varn',
    sede: 'tessel',
    tensao:
      'Odile e Ketta são gêmeas. A marca foi para a que nasceu primeiro, e só o livro do registro diz qual foi — e quem cuida do livro é Ketta. ' +
      'A filha de Odile é pregoeira aos dezenove e já anuncia os editos da mãe como quem ensaia os seus.',
    membros: [
      { npc: 'marechala_odile', papel: 'A gêmea que herdou a marca. Governa com medo de ser a Varn que perde o que três gerações seguraram.' },
      { npc: 'morador_tessel_7', papel: 'A gêmea do registro. Educada com a irmã, calculista com o livro, e nunca disse em voz alta qual das duas nasceu primeiro.' },
      { npc: 'morador_tessel_17', papel: 'Filha de Odile, pregoeira. Ambiciosa sem disfarce; a tia é a única que ela não consegue ler.' },
    ],
    lacos: [
      { tipo: 'irmas', a: 'marechala_odile', b: 'morador_tessel_7' },
      { tipo: 'mae', a: 'marechala_odile', b: 'morador_tessel_17' },
    ],
    ausentes: [{ nome: 'Idrun Varn', laco: 'mãe das gêmeas, marechala antes delas', destino: 'morreu no trigésimo dia do cerco de quarenta' }],
  },
  {
    id: 'as_ost',
    nome: 'as Ost',
    sede: 'tessel',
    tensao:
      'Cera Ost perdeu o filho para a leva da marca e voltou da guerra sem posto. A filha mais velha virou sargenta do portão e vende dispensa da mesma leva; a mais nova serve cerveja a quem compra. ' +
      'A mãe sabe de onde vem o dinheiro que as filhas lhe dão, e aceita porque é o preço que ela não pôde pagar pelo filho.',
    membros: [
      { npc: 'morador_tessel_18', papel: 'A mãe, veterana sem posto. Curiosa de tudo, menos do que a filha sargenta faz no portão.' },
      { npc: 'sargenta_brila', papel: 'A filha mais velha. Diz que vender dispensa é misericórdia porque o irmão não teve nenhuma.' },
      { npc: 'morador_tessel_6', papel: 'A caçula, taverneira aos vinte e cinco. Cuida da mãe e sabe os nomes que a irmã tira da lista antes de a lista chegar à praça.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'morador_tessel_18', b: 'sargenta_brila' },
      { tipo: 'mae', a: 'morador_tessel_18', b: 'morador_tessel_6' },
    ],
    ausentes: [{ nome: 'Tobin Ost', laco: 'filho de Cera, irmão das duas', destino: 'levado pela leva da marca aos dezoito; morreu no primeiro inverno do forte' }],
  },
  {
    id: 'as_pe_de_ferro',
    nome: 'as Pé-de-Ferro',
    sede: 'tessel',
    tensao:
      'Duas irmãs armeiras, uma para a cidade e outra para a guarnição, disputando o mesmo ferro caro numa marca sem mina. ' +
      'Das filhas de Nevin, uma recusou a forja e abriu uma loja; a outra largou tudo e vive na rua olhando todo mundo — e as duas ainda atendem pelo apelido do ofício da mãe.',
    membros: [
      { npc: 'morador_tessel_4', papel: 'A irmã mais velha, armeira da cidade. Cansada, deve favor a quem traz ferro barato e não pergunta de onde.' },
      { npc: 'armeira_de_tessel', papel: 'A irmã mais nova, armeira da guarnição. Despreza o trabalho da irmã em voz alta e pede a opinião dela quando ninguém vê.' },
      { npc: 'morador_tessel_3', papel: 'A filha que recusou a bigorna. Devota áspera, dona de loja, e a única da família que dorme cedo.' },
      { npc: 'morador_tessel_13', papel: 'A filha caçula, que largou a casa e vive na rua. Vê o que a mãe e a tia fazem com o ferro, e guarda para cobrar.' },
    ],
    lacos: [
      { tipo: 'irmas', a: 'morador_tessel_4', b: 'armeira_de_tessel' },
      { tipo: 'mae', a: 'morador_tessel_4', b: 'morador_tessel_3' },
      { tipo: 'mae', a: 'morador_tessel_4', b: 'morador_tessel_13' },
    ],
  },
  {
    id: 'as_mao_curta',
    nome: 'as Mão-Curta',
    sede: 'tessel',
    tensao:
      'A mãe é capitã da guarda da cidade. Uma filha contrabandeia pela fronteira que a mãe guarda; a outra se alistou no forte para ficar longe das duas. ' +
      'Roan reza por elas do jeito dela, que é de joelhos e sem pedir nada.',
    membros: [
      { npc: 'morador_tessel_1', papel: 'A mãe, capitã da guarda. Protege a filha contrabandista em nome de uma família que já serviu a outra, e não diz qual.' },
      { npc: 'morador_tessel_19', papel: 'A filha mais velha, contrabandista. Ressente quem subiu na vida, a começar pela própria mãe.' },
      { npc: 'morador_forte_agulha_3', papel: 'A filha mais nova, recruta que não devia estar no forte. Fala demais de tudo, menos de casa.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'morador_tessel_1', b: 'morador_tessel_19' },
      { tipo: 'mae', a: 'morador_tessel_1', b: 'morador_forte_agulha_3' },
    ],
  },
  {
    id: 'irmas_do_forte',
    nome: 'as irmãs do forte',
    sede: 'forte_agulha',
    tensao:
      'O Forte Agulha caiu duas vezes, sempre por fome, e as duas irmãs estavam lá dentro na segunda. ' +
      'Continuam lá, uma racionando e a outra vigiando, e a guarnição nova não sabe por que elas se calam quando alguém fala do celeiro.',
    membros: [
      { npc: 'morador_forte_agulha_1', papel: 'A mais velha, sargenta. Ressente a comandante da mesma idade que subiu e ela não.' },
      { npc: 'morador_forte_agulha_2', papel: 'A mais nova, cozinheira. Ri antes de dizer coisa séria, e a coisa séria é sempre sobre comida.' },
    ],
    lacos: [{ tipo: 'irmas', a: 'morador_forte_agulha_1', b: 'morador_forte_agulha_2' }],
  },
  {
    id: 'as_quelha',
    nome: 'as Quelha',
    sede: 'vila_pedravel',
    tensao:
      'Mora Quelha governa Pedravel há cinquenta anos, e há dois anos pôs a neta de dezenove no posto de chefe para ter quem assine. ' +
      'Ivo, o rapaz que voltou da leva, é neto de uma prima; ela o chama de neto e ninguém na vila corrige. Quilda e Ivo cresceram como irmãos e hoje não sabem o que são um do outro.',
    membros: [
      { npc: 'ancia_pedravel', papel: 'A avó. Mente o necessário pela vila e pelos dois netos, e não considera isso defeito.' },
      { npc: 'morador_vila_pedravel_0', papel: 'A neta de sangue, chefe da vila aos dezenove. Ressente a avó por mandar através dela.' },
      { npc: 'rapaz_da_leva', genero: 'm', papel: 'O neto de criação, que fugiu da leva. Deve à avó o esconderijo e a mentira da lista.' },
    ],
    lacos: [
      { tipo: 'avo', a: 'ancia_pedravel', b: 'morador_vila_pedravel_0' },
      { tipo: 'avo', a: 'ancia_pedravel', b: 'rapaz_da_leva' },
    ],
    ausentes: [{ nome: 'Anja Quelha', laco: 'filha de Mora, mãe de Quilda', destino: 'morreu no quinto inverno da isenção, quando a vila parou de pagar em grão' }],
  },
  {
    id: 'as_caladas',
    nome: 'as Caladas',
    sede: 'vila_pedravel',
    tensao:
      'Yara teve Rhea aos quarenta e dois, quando a vila já a dava por velha para isso. Criou a filha para ser curandeira e a filha foi para o moinho. ' +
      'A vila chama as duas de Caladas, e é engano: falam o dia inteiro, só que uma com a outra não.',
    membros: [
      { npc: 'morador_vila_pedravel_3', papel: 'A mãe, curandeira. Desconfia da ferreira com quem aprendeu tudo e protege a taverneira que ninguém mais protege.' },
      { npc: 'morador_vila_pedravel_7', papel: 'A filha temporã, moleira. Cansada aos vinte e um, e amiga da chefe da vila porque as duas têm quem mande por elas.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_vila_pedravel_3', b: 'morador_vila_pedravel_7' }],
  },

  // ───────────────────────────── PLANALTO DE CORVEIRA
  {
    id: 'as_verrao',
    nome: 'as Verrão',
    sede: 'corveira',
    tensao:
      'Halda Verrão é a cabeça de uma das sete casas de Corveira e tem três filhas: uma no posto de senhora da cidade, uma no registro e uma no mosteiro. ' +
      'O marido de Halda morreu no desabamento do quarto terraço. As filhas cresceram ouvindo que foi a pedra, e a cidade ainda discute de quem era a pedra.',
    membros: [
      { npc: 'senhora_corveira', papel: 'A mãe. Vê as filhas como vê a cidade: patrimônio a manter, com custo a controlar.' },
      { npc: 'morador_corveira_0', papel: 'A filha mais velha, senhora da cidade no papel. Leal com quem prova valor, e a mãe nunca provou.' },
      { npc: 'irma_copista', papel: 'A filha do meio, que entrou para o mosteiro. Recebeu da casa da própria mãe a ordem de destruir um registro, e decorou antes de queimar.' },
      { npc: 'morador_corveira_7', papel: 'A caçula, escrivã do registro. Orgulhosa do ofício, e o ofício é justamente o que a mãe manda apagar.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'senhora_corveira', b: 'morador_corveira_0' },
      { tipo: 'mae', a: 'senhora_corveira', b: 'irma_copista' },
      { tipo: 'mae', a: 'senhora_corveira', b: 'morador_corveira_7' },
    ],
    ausentes: [{ nome: 'Oren Verrão', laco: 'marido de Halda, pai das três', destino: 'homem de fora; morreu no desabamento do quarto terraço' }],
  },
  {
    id: 'as_do_gordo',
    nome: 'as do Gordo',
    sede: 'corveira',
    tensao:
      'Jarek o Gordo empresta dinheiro a metade do Sexto e cobrou das próprias filhas o dote que não deu. ' +
      'Ilsa e Hedra se juntaram contra a mãe: a estalajadeira e a carregadora dividem a mesma conta, a mesma raiva e o mesmo apelido.',
    membros: [
      { npc: 'morador_corveira_11', papel: 'A mãe, agiota. Ressente quem subiu na vida, e as filhas subiram sem pedir licença.' },
      { npc: 'morador_corveira_14', papel: 'A filha mais velha, estalajadeira do bairro de fora. Seca na conta, e a primeira conta que fechou foi a da mãe.' },
      { npc: 'morador_corveira_12', papel: 'A caçula, carregadora do cais. Tem medo da mãe por experiência, e anda com a irmã por isso.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'morador_corveira_11', b: 'morador_corveira_14' },
      { tipo: 'mae', a: 'morador_corveira_11', b: 'morador_corveira_12' },
    ],
  },
  {
    id: 'as_arne',
    nome: 'as Arne',
    sede: 'mina_corveira',
    tensao:
      'Sibel Arne assinou um laudo aos trinta e dois e bebe desde então. A filha virou curandeira em Corveira e cuida das mãos trêmulas da mãe sem perguntar de onde vem o tremor. ' +
      'Jarek manda metade do que ganha para a galeria e a outra metade some no mesmo lugar que o resto.',
    membros: [
      { npc: 'perita_do_desabamento', papel: 'A mãe, perita de galeria. Nunca tira o casaco de trabalho, nem na casa da filha.' },
      { npc: 'morador_corveira_5', papel: 'A filha, curandeira. Cansada, faz o serviço e não quer confusão — com a mãe, menos ainda.' },
    ],
    lacos: [{ tipo: 'mae', a: 'perita_do_desabamento', b: 'morador_corveira_5' }],
  },
  {
    id: 'as_da_forja_funda',
    nome: 'as da Forja Funda',
    sede: 'forja_afundada',
    tensao:
      'Quando as casas proibiram o aço solar, Wyn desceu com a forja e Ysolt desceu com Wyn. Ysolt começou a aprender o ofício aos quarenta, ficou surda na bigorna da mulher e não se arrepende. ' +
      'É a única casa do planalto onde a mestra é a mais nova.',
    membros: [
      { npc: 'morador_forja_afundada_0', papel: 'A mestra. Ri antes de dizer coisa séria, e a coisa séria é sempre que um dia vão ser encontradas.' },
      { npc: 'morador_forja_afundada_1', papel: 'A companheira e aprendiz. Devota áspera; reza pela forja como quem reza por gente.' },
    ],
    lacos: [{ tipo: 'conjuges', a: 'morador_forja_afundada_0', b: 'morador_forja_afundada_1' }],
  },

  // ───────────────────────────── COSTA DE MAREU
  {
    id: 'as_meia_orelha',
    nome: 'as Meia-Orelha',
    sede: 'mareu',
    tensao:
      'Sela perdeu meia orelha para a lei de Mareu por roubo, quarenta anos atrás, e a cidade deu o apelido às filhas junto. ' +
      'Kalen virou pregoeira do mesmo registro que leu a sentença da mãe; Pell foi para a guerra para perder o nome e voltou com ele; Ulla e Calder mudaram para o Mercado do Peixe. Sela, aos sessenta e quatro, continua batendo carteira.',
    membros: [
      { npc: 'morador_mareu_10', papel: 'A mãe, batedora de carteira. Cansada, e sem vergonha nenhuma do apelido.' },
      { npc: 'morador_mareu_17', papel: 'A filha pregoeira. Anuncia sentença na praça com medo de um dia ler o nome da mãe outra vez.' },
      { npc: 'morador_mareu_18', papel: 'A filha que foi à guerra. Voltou sem posto e fala demais, menos da orelha da mãe.' },
      { npc: 'morador_mercado_peixe_5', papel: 'A filha curandeira do Mercado do Peixe. Mudou de cidade para trocar de apelido e não conseguiu.' },
      { npc: 'morador_mercado_peixe_4', papel: 'A filha armeira, no mesmo galpão da irmã. Cansada de explicar que não rouba.' },
      { npc: 'morador_corveira_17', papel: 'Neta de Sela, filha de Calder. Pregoeira em Corveira, ressentida com quem subiu — e em Corveira, Meia-Orelha virou xingamento de ladra.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'morador_mareu_10', b: 'morador_mareu_17' },
      { tipo: 'mae', a: 'morador_mareu_10', b: 'morador_mareu_18' },
      { tipo: 'mae', a: 'morador_mareu_10', b: 'morador_mercado_peixe_5' },
      { tipo: 'mae', a: 'morador_mareu_10', b: 'morador_mercado_peixe_4' },
      { tipo: 'mae', a: 'morador_mercado_peixe_4', b: 'morador_corveira_17' },
    ],
  },
  {
    id: 'as_olho_vivo',
    nome: 'as Olho-Vivo',
    sede: 'mercado_peixe',
    tensao:
      'Ansel é senhora do Mercado do Peixe e a irmã Vidar é mestra da guilda: as duas chaves do galpão na mesma família. ' +
      'A prima Davet ficou com uma estalagem do lado de fora da muralha de Mareu e com a mania de lembrar, em toda festa, quem emprestou o dinheiro da primeira banca.',
    membros: [
      { npc: 'morador_mercado_peixe_0', papel: 'A irmã mais velha, senhora do mercado. Generosa até o limite do prato — e o prato é dela.' },
      { npc: 'morador_mercado_peixe_2', papel: 'A irmã mais nova, mestra da guilda. Medrosa por experiência; o medo tem o nome da escrivã que guarda o registro antigo.' },
      { npc: 'morador_mareu_14', papel: 'A prima de fora da muralha. Seca na conta e correta nela, e a conta que ela nunca fecha é a da família.' },
    ],
    lacos: [
      { tipo: 'irmas', a: 'morador_mercado_peixe_0', b: 'morador_mercado_peixe_2' },
      { tipo: 'primas', a: 'morador_mareu_14', b: 'morador_mercado_peixe_0' },
      { tipo: 'primas', a: 'morador_mareu_14', b: 'morador_mercado_peixe_2' },
    ],
  },
  {
    id: 'as_boca_seca',
    nome: 'as Boca-Seca',
    sede: 'porto_sal',
    tensao:
      'Loris serve bebida no Porto do Sal há trinta anos e criou duas filhas que subiram: uma capitã da guarda em Mareu, outra ferreira em Solgar. ' +
      'Ressente as duas por isso, e as duas mandam dinheiro todo mês, o que ela ressente mais.',
    membros: [
      { npc: 'morador_porto_sal_6', papel: 'A mãe, taverneira. Chama as filhas pelo apelido na frente dos fregueses para lembrar de onde elas saíram.' },
      { npc: 'morador_mareu_1', papel: 'A filha capitã. Generosa com a guarda inteira, e a generosidade veio da mãe, que nunca admitiria.' },
      { npc: 'morador_solgar_1', papel: 'A filha ferreira, a mais longe. Desconfiada com forasteiro, e escreve para a mãe mais do que a irmã.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'morador_porto_sal_6', b: 'morador_mareu_1' },
      { tipo: 'mae', a: 'morador_porto_sal_6', b: 'morador_solgar_1' },
    ],
  },
  {
    id: 'as_quilm',
    nome: 'as Quilm',
    sede: 'farol_quebrado',
    tensao:
      'Nera mantém aceso um farol que já não serve para nada e criou a neta dentro dele, depois que o mar levou a mãe da menina. ' +
      'Quim é a única que ainda sobe ao farol para conversar, e desce fundo demais no mar, como se procurasse alguém.',
    membros: [
      { npc: 'viuva_do_farol', papel: 'A avó. Criou a neta na torre e nunca a deixou dormir no escuro.' },
      { npc: 'pescadora_da_rede', papel: 'A neta, pescadora de rede funda. Acha que o mar é negociável porque ele já lhe cobrou tudo uma vez.' },
    ],
    lacos: [{ tipo: 'avo', a: 'viuva_do_farol', b: 'pescadora_da_rede' }],
    ausentes: [{ nome: 'Sena Quilm', laco: 'filha de Nera, mãe de Quim', destino: 'afogada no mar quando Quim era de colo' }],
  },
  {
    id: 'as_do_norte_do_cais',
    nome: 'as do Norte do cais',
    sede: 'mareu',
    tensao:
      'Brida do Norte contrabandeia pela fronteira e a filha carrega saco no cais, pago por jornada. ' +
      'Fenn recusou todo trabalho que a mãe ofereceu, e as duas brigam na frente do cais inteiro porque é o único jeito que sabem de conversar.',
    membros: [
      { npc: 'morador_mareu_19', papel: 'A mãe, contrabandista. Ambiciosa sem disfarce, e a ambição inclui a filha.' },
      { npc: 'morador_mareu_12', papel: 'A filha carregadora. Curiosa demais, e a curiosidade para exatamente na porta do depósito da mãe.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_mareu_19', b: 'morador_mareu_12' }],
  },
  {
    id: 'as_calada_da_guarda',
    nome: 'as Calada da guarda',
    sede: 'mercado_peixe',
    tensao:
      'Nolan comanda a guarda do Mercado do Peixe há vinte anos e a filha luta na arena por dinheiro, contra quem pagar. ' +
      'A capitã não assiste às lutas, mas sabe o resultado antes de todo mundo, e a filha deve à senhora do mercado mais do que a mãe consegue cobrir.',
    membros: [
      { npc: 'morador_mercado_peixe_1', papel: 'A mãe, capitã da guarda. Curiosa de tudo e usa provérbio para não dizer o que pensa da arena.' },
      { npc: 'morador_mercado_peixe_8', papel: 'A filha, campeã de arena. Calculista e educada, e cada luta é uma parcela da dívida.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_mercado_peixe_1', b: 'morador_mercado_peixe_8' }],
  },
  {
    id: 'as_do_porto_sal',
    nome: 'as do Porto do Sal',
    sede: 'porto_sal',
    tensao:
      'A senhora do Porto do Sal deve dinheiro à própria filha, que é armeira e vende lâmina ao chefe do crime do porto. ' +
      'Nolan diz que a filha salvou a cidade num inverno ruim; Roan diz que salvou a mãe, e que não é a mesma coisa.',
    membros: [
      { npc: 'morador_porto_sal_0', papel: 'A mãe, senhora da cidade. Ressentida com quem subiu, e quem subiu mais depressa foi a filha.' },
      { npc: 'morador_porto_sal_4', papel: 'A filha, armeira, chamada de "a Velha" desde menina por falar como avó. Desconfiada, leal a quem prova — e a mãe ainda não provou.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_porto_sal_0', b: 'morador_porto_sal_4' }],
  },
  {
    id: 'as_da_rede_rota',
    nome: 'as da Rede Rota',
    sede: 'aldeia_rede',
    tensao:
      'Cera Sete-Dedos lavra o pouco de terra que a aldeia tem e a filha dorme fora com as cabras. ' +
      'A menina protege a mãe de uma dívida que a mãe nem sabe que tem, e quer sair da aldeia antes de herdar a mesma enxada.',
    membros: [
      { npc: 'morador_aldeia_rede_1', papel: 'A mãe, lavradora. Orgulhosa do ofício e intolerante com o desleixo da filha, que não é desleixo.' },
      { npc: 'morador_aldeia_rede_4', papel: 'A filha pastora, dezenove anos. Ambiciosa, ri antes de dizer coisa séria, e a coisa séria é ir embora.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_aldeia_rede_1', b: 'morador_aldeia_rede_4' }],
  },

  // ───────────────────────────── BOSQUE DE VINTRA
  {
    id: 'as_braza',
    nome: 'as Braza',
    sede: 'aldeia_carvoeira',
    tensao:
      'Ferna ensinou a filha a ler fumaça e a filha trocou o sobrenome pelo do posto: guardiã do bosque se chama Vintra, como a vila. ' +
      'A mãe ainda a chama de Saía Braza. A tia, ferreira em Vintra, é quem leva recado de uma para a outra.',
    membros: [
      { npc: 'carvoeira_velha', papel: 'A mãe, carvoeira. Avisou três vezes na vida e nas três tinha razão; a filha conta os avisos como quem conta dívida.' },
      { npc: 'guarda_do_bosque', papel: 'A filha que virou Vintra. O único aviso que nunca ignora é o da mãe.' },
      { npc: 'morador_vintra_1', papel: 'Irmã mais nova de Ferna, ferreira em Vintra. Cansada, e faz o serviço de mensageira entre as duas sem cobrar.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'carvoeira_velha', b: 'guarda_do_bosque' },
      { tipo: 'irmas', a: 'carvoeira_velha', b: 'morador_vintra_1' },
    ],
  },
  {
    id: 'as_do_torto',
    nome: 'as do Torto',
    sede: 'vintra',
    tensao:
      'Torv chefia a vila e a filha é a ladra que a vila inteira conhece. A guarda quer prender Veski há dois anos e a mãe impede com uma palavra. ' +
      'Vintra queimou duas vezes e foi reconstruída; a família de Torv, nenhuma das duas.',
    membros: [
      { npc: 'morador_vintra_0', papel: 'A mãe, chefe da vila. Curiosa demais, e nunca curiosa sobre o que a filha leva para casa.' },
      { npc: 'morador_vintra_5', papel: 'A filha ladra. Seca e correta na conta — rouba de quem pode pagar e devolve o troco.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_vintra_0', b: 'morador_vintra_5' }],
  },
  {
    id: 'as_da_carvoeira',
    nome: 'as da Carvoeira',
    sede: 'aldeia_carvoeira',
    tensao:
      'Wyn a Ruiva pastoreia e dorme no pasto; a filha, que o vilarejo chama de Velha por troça, some por dias e volta sem dizer onde esteve. ' +
      'A mãe protege a filha e a filha protege a anciã, e ninguém protege a mãe.',
    membros: [
      { npc: 'morador_aldeia_carvoeira_4', papel: 'A mãe, pastora que dorme fora. Desconfia da anciã e protege a filha de qualquer pergunta.' },
      { npc: 'morador_aldeia_carvoeira_3', papel: 'A filha que some. Chamam de "a Velha" desde que voltou de uma dessas ausências com o cabelo branco numa mecha.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_aldeia_carvoeira_4', b: 'morador_aldeia_carvoeira_3' }],
  },

  // ───────────────────────────── ERMO DE SOLGAR
  {
    id: 'as_pe_de_ferro_do_ermo',
    nome: 'as da água de Solgar',
    sede: 'solgar',
    tensao:
      'Wenna chefia Solgar e cobra pela água como a vila sempre cobrou. A filha caçadora acha a cobrança um roubo e diz isso na praça. ' +
      'As duas são rivais em público e a mãe paga, escondida, a dívida da filha com a ladra da vila.',
    membros: [
      { npc: 'morador_solgar_0', papel: 'A mãe, chefe da vila. Orgulhosa, intolerante com desleixo, e com a filha a única exceção.' },
      { npc: 'morador_solgar_8', papel: 'A filha caçadora de peles. Calculista e educada, e a educação acaba quando o assunto é a água.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_solgar_0', b: 'morador_solgar_8' }],
  },
  {
    id: 'as_secas',
    nome: 'as Secas',
    sede: 'poco_seco',
    tensao:
      'Ura guarda o único poço que ainda dá e distribui a água sem exceção, nem para a própria filha. ' +
      'Gilda lavra a terra que bebe dessa água e deve o balde a meio povoado, porque a mãe não lhe dá nem um a mais.',
    membros: [
      { npc: 'aguadeira_do_poco', papel: 'A mãe, aguadeira. Justa até com a filha, e é a justiça que a filha não perdoa.' },
      { npc: 'morador_poco_seco_1', papel: 'A filha lavradora, vinte anos. Rival de meio poço por causa de água e devedora da benzedeira.' },
    ],
    lacos: [{ tipo: 'mae', a: 'aguadeira_do_poco', b: 'morador_poco_seco_1' }],
  },
  {
    id: 'as_da_parada',
    nome: 'as da parada',
    sede: 'caravancerai',
    tensao:
      'A menina tem dezenove anos e já chefia caravana; a mãe, dona da parada, pediu emprestado à filha para não fechar as portas. ' +
      'Hedra cobra os juros na frente dos tropeiros porque a mãe a ensinou que conta de família também é conta.',
    membros: [
      { npc: 'morador_caravancerai_0', papel: 'A mãe, dona da parada. Deve à filha, e é a dívida que mais a orgulha.' },
      { npc: 'morador_caravancerai_1', papel: 'A filha chefe de caravana. Mais nova que qualquer tropeira que manda, e mais dura que todas.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_caravancerai_0', b: 'morador_caravancerai_1' }],
  },

  // ───────────────────────────── BAIXIOS DE HALVERN
  {
    id: 'as_junco',
    nome: 'as Junco',
    sede: 'vila_juncal',
    tensao:
      'Três gerações: a avó lavra, a mãe atravessa o vau e a neta, aos vinte e dois, é anciã da vila. O posto devia ter ido para Tela, que recusou para não largar o barco. ' +
      'A neta governa com a avó atrás e a mãe do outro lado do rio, e nenhuma das duas atravessa depois do anoitecer para vê-la.',
    membros: [
      { npc: 'morador_vila_juncal_1', papel: 'A avó, lavradora de mão pesada. Protege a neta e desconfia de quem chega pelo rio.' },
      { npc: 'barqueira_do_vau', papel: 'A mãe, barqueira. Recusou o posto de anciã e mantém uma única regra, sobre a hora, que nem a filha conhece o motivo.' },
      { npc: 'morador_vila_juncal_0', papel: 'A neta, anciã aos vinte e dois. Manca de uma queda no vau quando menina, e desde então não entra no barco da mãe.' },
    ],
    lacos: [
      { tipo: 'mae', a: 'morador_vila_juncal_1', b: 'barqueira_do_vau' },
      { tipo: 'mae', a: 'barqueira_do_vau', b: 'morador_vila_juncal_0' },
    ],
  },

  // ───────────────────────────── FORA DO MUNDO
  {
    id: 'irmas_da_vila_dos_ferreiros',
    nome: 'as irmãs da Vila dos Ferreiros',
    sede: 'vila_ferreiros',
    tensao:
      'Eda é mestra e Ondra, um ano mais velha, é aprendiz — porque a mestra que as criou escolheu a mais nova. ' +
      'Ondra mede cada palavra e nenhuma é de inveja; Eda fala baixo e nunca deixa a irmã ver a lâmina antes de pronta.',
    membros: [
      { npc: 'morador_vila_ferreiros_0', papel: 'A caçula, ferreira mestra aos vinte e um. Calculista e educada, o que assusta mais a irmã do que a quem encomenda.' },
      { npc: 'morador_vila_ferreiros_1', papel: 'A mais velha, aprendiz. Correta na conta, e a conta que faz toda noite é quanto falta para a irmã errar.' },
    ],
    lacos: [{ tipo: 'irmas', a: 'morador_vila_ferreiros_0', b: 'morador_vila_ferreiros_1' }],
  },

  // ───────────────────────────── PLANALTO DE CORVEIRA (Terraço)
  {
    id: 'as_do_terraco',
    nome: 'as do Terraço',
    sede: 'vila_terraco',
    tensao:
      'Zeno chefia o Terraço e protege a filha caçadora de todo mundo, inclusive da guarda a quem a filha deve. ' +
      'O apelido de Zeno veio de uma briga de rua, não do sangue de Mareu, e ela corrige quem confunde com uma raiva que diz muito.',
    membros: [
      { npc: 'morador_vila_terraco_0', papel: 'A mãe, chefe da vila. Guarda prova do que o Sexto sofreu no desabamento e não a mostra nem à filha.' },
      { npc: 'morador_vila_terraco_8', papel: 'A filha caçadora. Fala demais e mede cada palavra ao mesmo tempo, e só com a mãe as duas coisas brigam.' },
    ],
    lacos: [{ tipo: 'mae', a: 'morador_vila_terraco_0', b: 'morador_vila_terraco_8' }],
  },
];
