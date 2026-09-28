// ARCANUM · As moradoras que ainda não tinham história (sessão 55).
//
// A sessão 49 escreveu 178 histórias e deixou 71 pessoas sem nenhuma. Além
// disso, 49 moradoras tinham um "segredo" que era só a história pública do
// lugar com uma frase na frente ("Mentiu no depoimento da época. O cerco de
// dezoito anos atrás durou quarenta dias."): o povoamento sorteava uma linha
// de Local.historia e chamava de segredo. Aqui cada uma ganha a história que
// falta e um segredo que é dela — casados com o que o elenco já tinha
// (famílias, relações, o cerco de Tessel, o desabamento de Corveira, a peste
// de Mareu, a Leva).
import type { HistoriaNpc, NPC } from '../../engine/types';

export const HISTORIAS_MORADORES: Record<string, HistoriaNpc> = {
  // ───────────────────────────── Tessel
  morador_tessel_0: {
    origem: 'Senhora da cidade de Tessel no papel desde os trinta; a marechala manda, ela assina e responde pelo que a marechala manda.',
    ferida: 'Tinha quinze anos no cerco e carregou água para a muralha oeste até ela cair. Deu depoimento depois, e o depoimento não bate com o que ela viu.',
    desejo: 'Uma cidade que ela possa governar sem pedir licença ao quartel.',
    medo: 'Que alguém leia o depoimento dela ao lado do de outra testemunha.',
  },
  morador_tessel_2: {
    origem: 'Mestra da guilda dos tecelões da marca, nascida no bairro de baixo, onde os fios secam na rua.',
    ferida: 'Viu a vizinha criar a filha para a leva da marca e não aguentou olhar.',
    desejo: 'Que a menina que ela salvou nunca saiba quem pagou.',
    medo: 'Quilda cobrar a dívida em voz alta, na frente da vizinha.',
  },
  morador_tessel_5: {
    origem: 'Curandeira do quartel de Tessel, formada tratando os feridos do cerco com dezenove anos e sem mestra.',
    ferida: 'Estava de plantão no quartel na noite em que a marechala velha morreu, e desde então não trata ninguém da família Varn.',
    desejo: 'Ensinar uma aprendiz antes que as mãos comecem a tremer.',
    medo: 'Que Ketta Varn pergunte a ela, diretamente, o que viu naquela noite.',
  },
  morador_tessel_10: {
    origem: 'Criada pela cocheira Ansel desde os quatro anos, depois que a mãe foi embora pela estrada do sul sem ela.',
    ferida: 'Descobriu aos quinze que Ansel estava doente e que o remédio custava mais do que a cocheira ganhava num mês.',
    desejo: 'Pagar o remédio de Ansel com dinheiro que ela não precise esconder.',
    medo: 'Ser pega e Ansel ter de ir buscá-la na guarda.',
  },
  morador_tessel_11: {
    origem: 'Filha de uma contadora do quartel, aprendeu a somar antes de ler. Empresta dinheiro em Tessel desde os dezoito.',
    ferida: 'A primeira pessoa a quem emprestou morreu devendo, e Quilda cobrou da filha. Nunca mais soube deixar uma dívida morrer.',
    desejo: 'Ter dinheiro próprio o bastante para dizer não à capitã Roan.',
    medo: 'Que a cidade descubra de quem é o dinheiro que ela empresta.',
  },
  morador_tessel_12: {
    origem: 'Carregadora do cais do rio de Tessel desde os catorze. Tem os ombros tortos de um lado só, o lado do saco.',
    ferida: 'Carregou os sacos de grão do Forte Agulha no inverno da segunda queda e soube depois que o forte tinha caído de fome.',
    desejo: 'Uma casa de dois cômodos longe do cais, com uma cama que seja só dela.',
    medo: 'Que alguém conte os sacos na porta do forte e na porta dos fundos no mesmo dia.',
  },
  morador_tessel_14: {
    origem: 'Estalajadeira do bairro de fora da muralha, onde param as carroças que a guarda não deixa entrar de noite.',
    ferida: 'Nasceu três meses depois do cerco, de uma mãe que perdeu o marido na brecha e nunca contou a ela o nome dele.',
    desejo: 'Saber o nome do pai, mesmo que seja só um nome.',
    medo: 'Que a muralha feche de vez para o bairro de fora.',
  },
  morador_tessel_15: {
    origem: 'Boticária de fundos de Tessel, sobrinha de uma ervanária que tratava a guarnição do Forte Agulha.',
    ferida: 'A tia foi presa por um tônico que matou um oficial, e Mira sabe que a dose certa estava escrita na receita e a errada, na mão de outra pessoa.',
    desejo: 'Uma botica com porta para a rua e nome na placa.',
    medo: 'Que a marechala durma demais uma noite e não acorde.',
  },
  morador_tessel_16: {
    origem: 'Cocheira de aluguel de Tessel há trinta anos. Leva a guarda, a marechala e quem pagar.',
    ferida: 'Achou Zeno com quatro anos dormindo dentro da carroça dela, na estrada do sul, e nunca achou a mãe da menina.',
    desejo: 'Viver o bastante para ver Zeno com ofício honesto.',
    medo: 'Morrer da doença e Zeno ficar sozinha na praça.',
  },
  // ───────────────────────────── Pedravel
  morador_vila_pedravel_1: {
    origem: 'Ferreira de Pedravel há quarenta anos. Fundiu metade do ferro da vila, e a outra metade veio do forte.',
    ferida: 'No segundo inverno do roubo da pedra, a vila passou fome, e ela fundiu o que não era dela para fazer foice.',
    desejo: 'Que as foices durem mais que a vergonha.',
    medo: 'A guarnição voltar a contar as dobradiças do portão.',
  },
  morador_vila_pedravel_2: {
    origem: 'Taverneira de Pedravel, dona da única taverna da vila, herdada da mãe no inverno em que a isenção da leva acabou.',
    ferida: 'No quinto ano, quando a vila não teve grão para pagar a isenção, o filho dela estava na lista.',
    desejo: 'Que Pedravel nunca mais compre nada da marca.',
    medo: 'Ver a lista do ano que vem.',
  },
  morador_vila_pedravel_5: {
    origem: 'Ladra conhecida de toda Pedravel desde menina, filha da tropeira Jarek a Velha.',
    ferida: 'Foi pega aos quinze roubando pão e a anciã a pôs no pelourinho da vila por um dia inteiro.',
    desejo: 'Ter com que negociar se um dia a marca vier atrás dela.',
    medo: 'A cela do Forte Agulha, que ela já viu por dentro uma vez.',
  },
  morador_vila_pedravel_6: {
    origem: 'Tropeira de Pedravel desde os vinte, com três mulas e uma rota que passa pelo Juncal.',
    ferida: 'Levou o primeiro rapaz escondido no feno de graça, porque era sobrinho dela. O segundo já foi cobrado.',
    desejo: 'Parar de cobrar antes de alguém cobrar dela.',
    medo: 'Um fiscal da marca que saiba contar mulas.',
  },
  // ───────────────────────────── Corveira
  morador_corveira_2: {
    origem: 'Mestra da guilda dos escoradores de Corveira, a gente que segura o teto das galerias com madeira e cálculo.',
    ferida: 'Assinou como escoradora-chefe o laudo do nível três no mês antes do desabamento. O laudo sumiu, e a assinatura dela não.',
    desejo: 'Escorar o terraço quarto de novo, para que as viúvas possam descer e enterrar alguém.',
    medo: 'Que o relatório queimado reapareça com o nome dela em cima.',
  },
  morador_corveira_3: {
    origem: 'Lojista de secos e molhados em Corveira, filha de uma vendedora de estrada que chegou ao planalto sem nada.',
    ferida: 'Cresceu vendo a mãe ser enganada pelas casas no peso do minério, e jurou que ia aprender a pesar do outro lado.',
    desejo: 'Uma cadeira no conselho das sete, comprada com o minério delas.',
    medo: 'Que as viúvas façam a conta do que venderam a ela.',
  },
  morador_corveira_6: {
    origem: 'Taverneira em Corveira, prima distante das Olho-Vivo de Mareu, casada com o planalto há trinta anos.',
    ferida: 'Serviu cerveja à turma do terraço quarto na noite antes do desabamento, e ouviu o que eles disseram sobre o escoramento.',
    desejo: 'Que alguém pergunte o que ela ouviu, e que seja alguém que não trabalhe para uma das casas.',
    medo: 'Que a casa Verrão saiba que ela lembra.',
  },
  morador_corveira_10: {
    origem: 'Batedora de carteira de Corveira, manca de uma perna desde uma queda na escadaria dos terraços.',
    ferida: 'A irmã morreu no desabamento, e a casa pagou à família em minério que ninguém comprava.',
    desejo: 'Juntar papel suficiente para que o conselho não possa dizer que não sabia.',
    medo: 'Ser pega por um escrivão com papel que ela ainda não leu.',
  },
  morador_corveira_13: {
    origem: 'Mendiga dos degraus da casa das balanças, onde as sete casas pesam o minério. Senta ali há quinze anos.',
    ferida: 'Foi escrivã de uma das casas até o dia em que se recusou a apagar um nome do registro. Perdeu o posto e a casa no mesmo mês.',
    desejo: 'Ver o registro verdadeiro do desabamento lido em voz alta no conselho.',
    medo: 'Morrer nos degraus com os papéis ainda escondidos.',
  },
  morador_corveira_15: {
    origem: 'Boticária de fundos de Corveira, surda de um ouvido desde uma explosão de pólvora na galeria.',
    ferida: 'Tratou os soterrados que saíram vivos do terraço quarto e sabe quantos morreram depois, sem entrar na lista.',
    desejo: 'Um lugar onde o pó que ela vende sirva para curar, e só para isso.',
    medo: 'Saber para que serve o pó que a capela compra.',
  },
  morador_corveira_19: {
    origem: 'Contrabandista de fronteira entre Corveira e Tessel, filha de mineira do terraço quarto.',
    ferida: 'A mãe morreu no desabamento, e a indenização veio em minério que ninguém quis comprar em Corveira.',
    desejo: 'Transformar em moeda cada pedra que as casas pagaram pelas mortas.',
    medo: 'Que a armeira de Tessel descubra de onde vem o ferro.',
  },
  // ───────────────────────────── Ferro Velho
  morador_aldeia_ferro_1: {
    origem: 'Lavradora de Ferro Velho, filha de sucateira. Planta no único pedaço de chão da aldeia que não é entulho.',
    ferida: 'Achou o caçador morto na carroça da estrada e enterrou o corpo sozinha, à noite, com medo de quem o matou.',
    desejo: 'Que a lâmina que Tança está refazendo chegue a quem tem direito a ela.',
    medo: 'Que quem matou o caçador volte pela mesma estrada.',
  },
  morador_aldeia_ferro_2: {
    origem: 'Benzedeira de Ferro Velho, veio de Corveira para a aldeia quando as casas proibiram benzer dentro da cidade.',
    ferida: 'Benzeu os primeiros corpos que a aldeia tirou do entulho do desabamento, e os nomes não batiam com os da lista.',
    desejo: 'Que os mortos de Ferro Velho sejam contados como mortos de Corveira.',
    medo: 'Benzer um corpo e reconhecer o rosto.',
  },
  morador_aldeia_ferro_3: {
    origem: 'Nascida em Ferro Velho, perdeu a ponta da orelha numa briga de sucata aos doze. Some por dias desde os vinte.',
    ferida: 'Seguiu uma carroça de sucata até o fundo do terraço quarto e viu de onde vinha o metal que a aldeia recupera.',
    desejo: 'Nunca mais ter de guiar uma carroça até o fundo do terraço quarto.',
    medo: 'Que a aldeia saiba do que é feito o metal que a sustenta.',
  },
  morador_aldeia_ferro_4: {
    origem: 'Pastora de cabras de Ferro Velho, manca desde menina. Dorme fora, nas encostas, desde que a mãe morreu.',
    ferida: 'Reconheceu a fivela da mãe numa carroça de metal recuperado que seguia para Corveira.',
    desejo: 'Uma encosta onde nenhuma carroça de metal recuperado passe perto das cabras.',
    medo: 'Que a aldeia a mande descer nas covas também.',
  },
  // ───────────────────────────── Mareu
  morador_mareu_3: {
    origem: 'Lojista de secos e molhados em Mareu há vinte anos, com um nome que não é o dela. Veio de Rede Rota.',
    ferida: 'Fugiu da aldeia com a cobrança da guilda atrás dela e deixou a irmã pagando a dívida sozinha.',
    desejo: 'Mandar para a irmã, sem que ninguém saiba de onde, o dinheiro da dívida inteira.',
    medo: 'Que a senhora da cidade morra e leve junto a proteção do nome.',
  },
  morador_mareu_4: {
    origem: 'A armeira mais nova de Mareu, aprendiz de Kelda Cais até os vinte, quando saiu brigada.',
    ferida: 'Kelda jogou fora o primeiro molde que Torv desenhou sozinha, na frente de todo o cais.',
    desejo: 'Uma forja própria, com a placa pendurada antes da de Kelda na rua.',
    medo: 'Que uma ponta de arpão dela seja achada no corpo de um fiscal da guilda.',
  },
  morador_mareu_5: {
    origem: 'Curandeira de Mareu, manca de uma queda no cais aos vinte. Aprendeu com a curandeira da quarentena da peste.',
    ferida: 'A mestra dela morreu dentro do galpão da quarentena, cuidando de quem a cidade mandou esquecer.',
    desejo: 'Que Mareu nunca mais tranque doente num galpão.',
    medo: 'Que a febre dos três marinheiros tenha ido para outro lugar sem ela saber.',
  },
  morador_mareu_6: {
    origem: 'Taverneira da taverna do cais de Mareu, calada por ofício: quem serve marinheiro aprende a não repetir.',
    ferida: 'Trabalhou a vida inteira para uma taverneira que subiu a guilda e esqueceu quem limpava o balcão.',
    desejo: 'Ser dona do balcão em que trabalha, com o nome dela na placa do cais.',
    medo: 'Que o quadro atrás do balcão seja lido por quem está nele.',
  },
  morador_mareu_7: {
    origem: 'Escrivã do registro de Mareu há trinta anos, surda de um ouvido, devota da capela do cais.',
    ferida: 'Escreveu no registro, no ano da peste, a data da quarentena que a senhora da cidade mandou mudar.',
    desejo: 'Morrer com um registro limpo, mesmo que seja o dela.',
    medo: 'Falar dormindo — e ela fala.',
  },
  morador_mareu_11: {
    origem: 'Agiota de Mareu há vinte anos. Começou emprestando às salgadeiras, que ninguém mais emprestava.',
    ferida: 'Perdeu o marido e o filho na peste, num navio que a quarentena deixou passar.',
    desejo: 'Que cada pessoa que pagou para o navio passar pague a ela, em voto.',
    medo: 'Que o conselho decida que é mais barato matá-la do que devê-la.',
  },
  morador_mareu_13: {
    origem: 'Mendiga do cais de Mareu, filha de uma das três vilas que viraram cidade. Senta sempre no mesmo poste.',
    ferida: 'A vila da família dela foi a que perdeu a disputa do galpão, duzentos anos atrás, e nunca deixou de perder.',
    desejo: 'Que a vila dela tenha um voto no conselho, mesmo que seja o dela, sentada no poste.',
    medo: 'Esquecer as histórias que a avó contava sobre a vila.',
  },
  morador_mareu_15: {
    origem: 'Boticária de fundos de Mareu, devota da capela do cais. Prepara remédio para a senhora da cidade há dez anos.',
    ferida: 'Foi ela quem preparou os unguentos da quarentena, e viu que não adiantavam, e continuou preparando.',
    desejo: 'Que o sonífero que ela faz sirva para alguém dormir, e só isso.',
    medo: 'Que a escrivã Sabra acorde no meio do chá.',
  },
  morador_mareu_16: {
    origem: 'Cocheira de aluguel de Mareu, ruiva, conhecida por não perguntar para onde vai a carga.',
    ferida: 'A campeã Bran a tirou de uma briga no cais aos dezesseis, e nunca cobrou.',
    desejo: 'Pagar o que deve a Bran e parar de carregar sal de madrugada.',
    medo: 'Uma patrulha da guilda na Trilha Costeira, antes de clarear.',
  },
  // ───────────────────────────── Porto do Sal
  morador_porto_sal_2: {
    origem: 'Mestra da guilda das salineiras do Porto do Sal, bisneta de degredada das salinas.',
    ferida: 'A bisavó morreu na salina sem ter terminado a pena, e o nome da família ainda está no livro dos degredados.',
    desejo: 'Riscar o nome da família do livro, com a pena cumprida, nem que seja pelos mortos.',
    medo: 'Que a guilda de Mareu use o livro contra ela na eleição da guilda.',
  },
  morador_porto_sal_3: {
    origem: 'Lojista do Porto do Sal, falastrona, sabe o preço de tudo que entra e sai do ancoradouro.',
    ferida: 'Começou vendendo sal refugado de graça às famílias pobres; hoje vende com selo, e cobra.',
    desejo: 'Um armazém em Mareu, longe das salinas e do caderno da escrivã.',
    medo: 'Que Corin cobre a parte da culpa em vez da parte do lucro.',
  },
  morador_porto_sal_5: {
    origem: 'Curandeira do Porto do Sal, veio pela estrada do litoral e ficou por causa das mãos rachadas das salineiras.',
    ferida: 'A mãe foi salineira e morreu com as mãos abertas até o osso, sem que ninguém tratasse.',
    desejo: 'Que o unguento dela fique com as salineiras quando ela morrer, e não com as famílias de feitor.',
    medo: 'Que a guilda descubra a receita e ponha preço.',
  },
  morador_porto_sal_7: {
    origem: 'Escrivã do registro do Porto do Sal, a mais nova do porto a ocupar o posto.',
    ferida: 'Entrou no posto no lugar de uma escrivã que foi presa por carimbar errado, e soube depois que ela não tinha carimbado.',
    desejo: 'Ter o caderno completo o bastante para nunca ser a próxima presa.',
    medo: 'Que Halvo leia o caderno antes dela usá-lo.',
  },
  // ───────────────────────────── Rede Rota
  morador_aldeia_rede_0: {
    origem: 'Anciã de Rede Rota desde os quarenta, filha de pescadora. Lembra de tudo o que a aldeia prefere esquecer.',
    ferida: 'Tinha vinte e dois anos na noite em que a aldeia afundou o coletor da guilda, e foi ela quem deu o nó.',
    desejo: 'Que a aldeia nunca mais pague a guilda em nada, nem em culpa.',
    medo: 'Uma rede que traga do ponto da enseada o que ficou lá.',
  },
  morador_aldeia_rede_2: {
    origem: 'Benzedeira de Rede Rota, filha de uma das mulheres que caminharam da ponte de volta na primeira noite da Leva.',
    ferida: 'Benzeu a rede de Quim Vares sem saber o que ela ia trazer, e desde então benze com medo.',
    desejo: 'Uma rede que traga só peixe, por um ano inteiro.',
    medo: 'Que a caixa com o selo do porto seja desenterrada por quem a procura.',
  },
  morador_aldeia_rede_3: {
    origem: 'Pescadora de Rede Rota que some por dias no mar, sozinha, num barco pequeno demais para isso.',
    ferida: 'Voltou de um dos sumiços sem o barco da mãe e com outro, maior, que ninguém na aldeia reconhece.',
    desejo: 'Uma rota por mar até Mareu que a guilda não conheça.',
    medo: 'Que a dona do barco novo venha procurar por ele.',
  },
  // ───────────────────────────── Vintra
  morador_vintra_2: {
    origem: 'Taverneira de Vintra, filha de uma das famílias que reconstruíram a vila pela segunda vez.',
    ferida: 'Na segunda queimada, a taverna foi a última casa a pegar fogo, e ela viu da janela quem acendeu a primeira.',
    desejo: 'Que Vintra dure o bastante para a filha herdar a taverna inteira.',
    medo: 'Um cheiro de fumaça à noite, qualquer um.',
  },
  morador_vintra_3: {
    origem: 'Curandeira de Vintra, aprendeu com as ervas da mata e com as feridas da paliçada.',
    ferida: 'Tratou uma mordida que sabia não ser de lobo e escreveu "cão" no livro, porque escrever a verdade fecharia a estrada.',
    desejo: 'Saber o que mordeu Elna, sem ter de ver.',
    medo: 'Que a ferida de Elna abra de novo numa noite de lua.',
  },
  morador_vintra_6: {
    origem: 'Tropeira de Vintra, gorda e rápida, faz a rota do carvão entre a Carvoeira e Corveira há vinte anos.',
    ferida: 'A fundição de Corveira cobrou da Carvoeira uma dívida que já tinha sido paga, e a aldeia não tinha o recibo.',
    desejo: 'Que a Carvoeira nunca mais dependa de papel que não guarda.',
    medo: 'Que alguém da fundição conte as carroças que ela levou naquele mês.',
  },
  morador_vintra_7: {
    origem: 'Moleira de Vintra, fala de tudo o dia inteiro e não diz nada que importe.',
    ferida: 'A assembleia multou a mãe dela por faltar numa sessão no dia em que a mãe estava morrendo.',
    desejo: 'Uma assembleia que não cobre de quem tem motivo.',
    medo: 'Que o moinho seja revistado de noite.',
  },
  // ───────────────────────────── Carvoeira
  morador_aldeia_carvoeira_0: {
    origem: 'Anciã da Carvoeira há dez anos, filha de carvoeira. Conhece cada forno da aldeia pelo cheiro.',
    ferida: 'Perdeu a filha para a mata aos seis anos: saiu para buscar lenha e não voltou.',
    desejo: 'Que a menina que ela esconde tenha o que a filha dela não teve.',
    medo: 'Que a menina tenha fome de alguma coisa que não seja pão.',
  },
  morador_aldeia_carvoeira_1: {
    origem: 'Lavradora da Carvoeira, trabalha nos fornos desde menina. Tem sete dedos e conta os dias nos que faltam.',
    ferida: 'Perdeu os dedos no forno numa briga com Tavro do Norte, e as duas nunca mais trabalharam no mesmo turno.',
    desejo: 'Uma desculpa de Tavro, em voz alta, na frente da aldeia.',
    medo: 'Precisar da benzedeira um dia.',
  },
  morador_aldeia_carvoeira_2: {
    origem: 'Benzedeira da Carvoeira, veio do norte ainda moça e ficou por causa de um homem que foi embora.',
    ferida: 'Empurrou Greta no forno numa briga e passou a benzer a lenha dos outros desde então, como quem paga.',
    desejo: 'Ser a benzedeira de quem as ferreiras do vale dependem, e que elas saibam.',
    medo: 'Que Greta conte a verdade sobre os dedos.',
  },
  // ───────────────────────────── Solgar e o ermo
  morador_solgar_2: {
    origem: 'Taverneira de Solgar, torta de uma perna desde uma queda do muro baixo. Serve água como vinho há quinze anos.',
    ferida: 'Pagou o imposto da água um ano inteiro sem conseguir, e a chefe da vila propôs o acordo.',
    desejo: 'Servir vinho de verdade uma vez, para ver se alguém nota.',
    medo: 'Uma caravana com uma provadora de vinho.',
  },
  morador_solgar_3: {
    origem: 'Curandeira de Solgar desde a segunda tentativa de tomar a cisterna, quando tratava os feridos no pátio.',
    ferida: 'Tratou os de fora com o mesmo cuidado que os de dentro, e a vila nunca a perdoou.',
    desejo: 'Que os mortos da Ruína de Areia tenham nome em algum lugar.',
    medo: 'Uma quarta tentativa, e ter de escolher de novo.',
  },
  morador_solgar_6: {
    origem: 'Tropeira do ermo há trinta anos, conhece cada poço entre Solgar e o planalto.',
    ferida: 'Comprou de Nevin Bico-Fino, sem perguntar, uma mula e um dote que eram de outra família.',
    desejo: 'Devolver o dote às irmãs de Corveira sem ter de explicar como o conseguiu.',
    medo: 'Encontrar a filha de Nevin na estrada.',
  },
  morador_solgar_7: {
    origem: 'Moleira de Solgar, ruiva, a única da vila com moinho de pedra em vez de pilão.',
    ferida: 'Comprou o moinho da família do Poço Seco quando eles precisaram vender para pagar a água.',
    desejo: 'Que ninguém em Solgar pergunte de onde vem o grão.',
    medo: 'Que o Poço Seco volte a ter água e não precise mais dela.',
  },
  morador_poco_seco_0: {
    origem: 'Anciã do Poço Seco, ambiciosa como quem nunca teve nada para perder. Manda na aldeia desde que a aldeia se mudou para perto de Solgar.',
    ferida: 'Viu Ura Seca descer nos poços com o sal e não disse nada, porque Ura prometeu que ela seria a anciã.',
    desejo: 'Que a aldeia nunca descubra o preço do posto dela.',
    medo: 'Que Ura morra e alguém abra o último poço.',
  },
  morador_poco_seco_2: {
    origem: 'Benzedeira do Poço Seco, a mais nova da aldeia a ter um ofício de respeito.',
    ferida: 'A mãe foi enforcada em Solgar por roubar água, e ela passou a esconder quem Solgar procura.',
    desejo: 'Que Solgar enforque alguém e ache a forca vazia.',
    medo: 'Que a lista dela caia na mão da chefe de Solgar.',
  },
  morador_poco_seco_3: {
    origem: 'Nascida no Poço Seco, manca de um tombo no ermo. Some por dias desde os vinte, pela rota do sul.',
    ferida: 'Levou pelo ermo o filho de Eda de Baixo antes que os recrutadores passassem, e o deixou com gente que ela não conhecia.',
    desejo: 'Voltar ao sul e saber se o menino está vivo.',
    medo: 'Que Eda pergunte onde ele está e ela não saiba responder.',
  },
  morador_poco_seco_4: {
    origem: 'Pastora do Poço Seco, dorme fora com as cabras desde que o filho foi levado para o sul.',
    ferida: 'Deu o filho para a moça que some, pelo ermo, e desde então não sabe se o salvou ou o perdeu.',
    desejo: 'Uma notícia do sul, qualquer uma, que diga que o menino chegou vivo.',
    medo: 'Que os recrutadores da marca voltem e perguntem pelo menino.',
  },
  morador_caravancerai_3: {
    origem: 'Viajante velha, surda de um ouvido, que não diz de onde vem. Chegou à Parada de Idrin numa caravana do sul.',
    ferida: 'Cresceu ouvindo a mãe dizer que o avô construiu uma parada no meio do nada e morreu antes de ver ela servir para alguma coisa.',
    desejo: 'Ver o nome de Idrin ainda na porta, e ir embora sem dizer quem é.',
    medo: 'Que a parada tenha mudado de nome.',
  },
  // ───────────────────────────── Juncal de Baixo
  morador_vila_juncal_2: {
    origem: 'Benzedeira de Juncal de Baixo, filha de benzedeira. A viga da casa dela é cheia de juncos trançados que ela não deixa ninguém tocar.',
    ferida: 'Benzeu meninos a vida inteira para que nada os levasse, e viu a benção falhar mais de uma vez.',
    desejo: 'Um junco que ela nunca precise desamarrar.',
    medo: 'Que a Toca seja encontrada pela gente da marca.',
  },
  morador_vila_juncal_3: {
    origem: 'Nascida em Juncal de Baixo, surda desde uma febre de criança. Some por dias pelo charco, sempre com um saco nas costas.',
    ferida: 'Perdeu o filho no inverno dos dezoito dele, como tantas, e nunca chorou onde a vila pudesse ver.',
    desejo: 'Que o filho possa sair da Toca um dia, e morar em algum lugar com o nome dele.',
    medo: 'Que levem o filho aos dezoito, como levaram os outros três.',
  },
  morador_vila_juncal_4: {
    origem: 'Pastora de Juncal de Baixo, conhece o charco como a palma da mão. Dorme fora desde que ficou viúva.',
    ferida: 'Desenhou para o fiscal da marca o caminho errado e o viu afundar do alto do barranco.',
    desejo: 'Que o charco guarde o fiscal e ninguém mais.',
    medo: 'Que Cera conte o que sabe na próxima briga.',
  },
  // ───────────────────────────── Terraço Sexto
  morador_vila_terraco_1: {
    origem: 'A ferreira mais nova do Terraço Sexto, filha de sobrevivente do desabamento. Fala demais e forja bem.',
    ferida: 'Aprendeu o ofício com a mãe, que forjava as escoras do terraço quarto e nunca mais pegou num martelo depois dele.',
    desejo: 'Portões que as casas não possam arrombar.',
    medo: 'Que o livro das casas descubra ferro que não está no livro.',
  },
  morador_vila_terraco_2: {
    origem: 'Taverneira do Terraço Sexto, torta de uma perna desde que a tiraram do entulho do terraço quarto.',
    ferida: 'Saiu viva do desabamento e a mãe não. A casa Verrão pagou a mãe em minério e cobrou o pano da maca.',
    desejo: 'Que o Sexto seja bairro no registro das casas, com nome e poço próprio.',
    medo: 'O barulho do chão tremendo quando os martelos batem lá embaixo.',
  },
  morador_vila_terraco_5: {
    origem: 'Ladra conhecida de todo o Sexto, criada na rua depois do desabamento.',
    ferida: 'Tinha oito anos quando o terraço quarto caiu e esperou três dias na fila da água pela mãe, que não veio.',
    desejo: 'Roubar das casas o suficiente para o Sexto não precisar delas.',
    medo: 'Ser mandada para as covas de Ferro Velho.',
  },
  morador_vila_terraco_7: {
    origem: 'Moleira do Terraço Sexto, a mais velha do bairro, chegou antes do desabamento e ficou depois dele.',
    ferida: 'Recebeu os sobreviventes do quarto terraço na porta do moinho, e um ano depois fechou a porta para a casa Verrão sem explicar a ninguém.',
    desejo: 'Moer de graça de novo, sem ninguém no meio.',
    medo: 'Que as Verrão cobrem dela o que ela doou.',
  },
  // ───────────────────────────── Lenha Alta
  morador_aldeia_lenha_0: {
    origem: 'Anciã de Lenha Alta desde os trinta, a mais nova que a aldeia já teve. Assumiu no inverno em que algo entrou na aldeia.',
    ferida: 'Tirou a filha de Veski de dentro do que entrou, e a menina nunca mais falou.',
    desejo: 'Que a aldeia passe um inverno inteiro sem porta trancada.',
    medo: 'Que o que entrou naquele inverno lembre do caminho.',
  },
  morador_aldeia_lenha_1: {
    origem: 'Lavradora de Lenha Alta, planta nas encostas o pouco que o frio deixa.',
    ferida: 'Cortou a corda da escada da vizinha com a vizinha do lado de fora, no inverno em que algo entrou.',
    desejo: 'Que a vizinha tenha morrido antes de saber quem cortou a corda.',
    medo: 'A primeira noite de neve de cada ano.',
  },
  morador_aldeia_lenha_2: {
    origem: 'Benzedeira de Lenha Alta, cansada de benzer lenha que não pede benção.',
    ferida: 'Riscou a primeira lenha com carvão no inverno em que algo entrou na aldeia, e a lenha riscada nunca queimou.',
    desejo: 'Entender o que o risco faz, antes de ensinar a outra pessoa.',
    medo: 'Que a lenha riscada seja queimada por engano numa forja.',
  },
  morador_aldeia_lenha_3: {
    origem: 'Nascida em Lenha Alta, gorda e calma, leva lenha até a Carvoeira e some por dias no caminho.',
    ferida: 'Viu, no caminho da Carvoeira, o que a lenha riscada não deixa passar.',
    desejo: 'Nunca perguntar o que o risco significa.',
    medo: 'Uma carga de lenha sem risco.',
  },
  morador_aldeia_lenha_4: {
    origem: 'Pastora de Lenha Alta, dorme fora com as ovelhas desde que a filha parou de falar.',
    ferida: 'Deixou a filha sozinha em casa na noite em que algo entrou na aldeia.',
    desejo: 'Ouvir a voz da filha uma vez, nem que seja para ela dizer o que viu.',
    medo: 'Que a filha fale, e diga o que viu.',
  },
  // ───────────────────────────── Mercado do Peixe
  morador_mercado_peixe_3: {
    origem: 'Lojista do Mercado do Peixe, sete dedos e uma balança que pesa sempre um pouco a mais.',
    ferida: 'Perdeu os dedos na faca de limpar peixe no primeiro ano de banca, e aprendeu que honestidade não paga dedo.',
    desejo: 'Uma banca dentro do galpão das Olho-Vivo, e não mais na calçada.',
    medo: 'Que Calder Meia-Orelha resolva falar dos pesos para se livrar dela.',
  },
  morador_mercado_peixe_6: {
    origem: 'Taverneira do Mercado do Peixe há trinta anos, gorda e cansada, serve a guilda de manhã e as salgadeiras de noite.',
    ferida: 'Viu a guilda fechar a banca da família de Brida do Norte com a mãe dela dentro do galpão da quarentena.',
    desejo: 'Fechar a taverna um dia e não abrir no seguinte.',
    medo: 'Que a guilda saiba o que ela ouve atrás do balcão.',
  },
  morador_mercado_peixe_7: {
    origem: 'Escrivã do registro do Mercado do Peixe há quarenta anos, de uma família antiga do galpão que hoje não tem banca nenhuma.',
    ferida: 'A avó morreu vendendo peixe na calçada, do lado de fora de um galpão onde a família dela já tinha tido lugar.',
    desejo: 'Mostrar o registro na primeira eleição da casa em que a mestra da guilda for candidata.',
    medo: 'Morrer de medo antes da mestra da guilda.',
  },
};

// Segredos no lugar dos segredos-modelo (história pública vestida de segredo).
// `comoDescobrir` diz o caminho em jogo: confiança com a pessoa, ou vigiar.
export const SEGREDOS_MORADORES: Record<string, NonNullable<NPC['segredo']>> = {
  morador_tessel_0: { conteudo: 'Ondra jurou no depoimento do cerco que a muralha oeste caiu por aríete. Viu, com quinze anos, que ela caiu por dentro: a argamassa daquele trecho tinha sido feita com metade da cal que o livro diz.', comoDescobrir: 'ganhar a confiança dela e perguntar por que ela nunca passa perto da muralha oeste' },
  morador_tessel_1: { conteudo: 'Roan financia a agiota Quilda para saber quem deve a quem em Tessel. A lista das devedoras é o que ela usa para escolher quem entra na guarda.', comoDescobrir: 'seguir o dinheiro de Quilda até a sala da capitã' },
  morador_tessel_5: { conteudo: 'Vidar tratou a marechala Idrun na trigésima noite do cerco. Idrun não morreu da flecha na brecha: morreu do tônico para dormir que alguém mandou do quartel, e Vidar reconheceu o cheiro.', comoDescobrir: 'perguntar a ela, sem testemunhas, por que não trata a marechala Odile' },
  morador_tessel_6: { conteudo: 'Mira a Velha guarda na taverna da muralha a farda que o irmão não chegou a usar. Usa-a de noite, às vezes, para ser atendida no quartel como recruta e ouvir o que se fala da leva da marca.', comoDescobrir: 'vigiar a porta dos fundos da taverna depois do toque de recolher' },
  morador_tessel_7: { conteudo: 'Ketta sabe, pelo registro que ela mesma guarda, que ela e Odile nasceram com a diferença de uma hora — e que a parteira anotou os nomes trocados. A marechala é Ketta, no papel.', comoDescobrir: 'ganhar a confiança dela contra a irmã e pedir para ver a primeira página do livro das Varn' },
  morador_tessel_9: { conteudo: 'Orla guarda a corda com que enforcaram a mãe dela na praça. Sabe o nome de quem assinou a ordem: a marechala Odile, no primeiro ano de posto.', comoDescobrir: 'falar da mãe dela sem pena, e esperar' },
  morador_tessel_13: { conteudo: 'Ketta Pé-de-Ferro descobriu que não escapou da leva da marca por sorte: alguém pagou a dispensa. Ela vigia a rua há dois anos para descobrir quem, e já desconfia de Wenna de Baixo.', comoDescobrir: 'dar a ela uma informação que valha, e pedir outra em troca' },
  morador_tessel_14: { conteudo: 'Wenna sabe o nome do pai: está gravado por dentro do elmo da sentinela, entre as marcas de guarda do cerco. A mãe mostrou uma vez, e fez jurar que ela nunca pediria o elmo à casa.', comoDescobrir: 'ganhar a confiança dela e perguntar pelo pai' },
  morador_forte_agulha_0: { conteudo: 'Elna mandou abrir o celeiro do Forte Agulha para Pedravel no inverno da fome, contra ordem da marca. O forte quase caiu de novo, e o livro diz que o grão estragou.', comoDescobrir: 'contar a ela o que Pedravel deve ao forte' },
  morador_forte_agulha_2: { conteudo: 'Ulla escondeu, na segunda queda, um saco de farinha para ela e a irmã Davet. Os feridos comeram menos por causa dele, e ela conta isso todo dia, sozinha, enquanto conta os sacos.', comoDescobrir: 'trabalhar na cozinha com ela por uma semana' },
  morador_vila_pedravel_0: { conteudo: 'Quilda a Velha assina os papéis da vila sem ler, porque não sabe ler, e a avó não sabe que ela não sabe. Quem lê para ela é a ladra Ansel.', comoDescobrir: 'pedir que ela leia um papel em voz alta' },
  morador_vila_pedravel_2: { conteudo: 'Sabra pagou do próprio bolso a isenção do filho no quinto ano, quando a vila não tinha grão, e deixou a vila acreditar que ele foi levado. Ele está vivo, no Juncal, com outro nome.', comoDescobrir: 'ganhar a confiança dela e falar de Jarek a Velha e das mulas' },
  morador_corveira_0: { conteudo: 'Pell guarda uma carta do pai, escrita na manhã do desabamento, dizendo que não ia descer porque o escoramento do nível três cedia. Ele desceu mesmo assim, porque a mãe mandou.', comoDescobrir: 'ganhar a confiança dela e perguntar da última manhã do pai' },
  morador_corveira_2: { conteudo: 'Fenn assinou o laudo do nível três dizendo que o escoramento cedia, um mês antes do desabamento. Quando o laudo sumiu, deixou que a culpassem pela assinatura e ficou calada em troca da guilda.', comoDescobrir: 'mostrar que você sabe do relatório queimado' },
  morador_corveira_6: { conteudo: 'Corin ouviu, na véspera do desabamento, a turma do terraço quarto dizer que a casa Verrão tinha mandado descer mesmo com o escoramento cedendo. Uma das vozes era de Oren.', comoDescobrir: 'beber com ela até tarde e falar de Oren Verrão' },
  morador_corveira_7: { conteudo: 'Wyn apaga do registro, a mando da mãe, os nomes que não cabem na lista dos duzentos e onze. Guarda cada nome apagado numa folha costurada no forro do casaco. São trinta e quatro.', comoDescobrir: 'vigiá-la saindo do registro no fim do expediente' },
  morador_corveira_13: { conteudo: 'Quilda Boca-Seca é a escrivã que se recusou a apagar um nome. Compra de Elna os papéis roubados dos escrivães e já tem quase o registro verdadeiro inteiro, escondido nos degraus da casa das balanças.', comoDescobrir: 'sentar com ela nos degraus e contar um nome do desabamento que não está na lista' },
  morador_corveira_14: { conteudo: 'Ilsa a Gorda abriu a estalagem com dinheiro da mãe, e pagou a mãe com dinheiro de Aldric da Ponte. A estalagem é dela no nome e da lojista na conta.', comoDescobrir: 'ver os livros da estalagem' },
  morador_aldeia_ferro_0: { conteudo: 'Ilsa Bico-Fino recebe, todo inverno, uma bolsa de Nevin para as irmãs, igual à que Wyn recebe. Nunca contou às irmãs: gasta o dinheiro na aldeia e diz que é da casa.', comoDescobrir: 'falar de Nevin na frente dela e ver para onde ela olha' },
  morador_aldeia_ferro_2: { conteudo: 'Aldric a Nova enterrou, com as próprias mãos, doze corpos do desabamento que chegaram a Ferro Velho nas carroças de sucata. Não estão na lista dos duzentos e onze.', comoDescobrir: 'pedir a ela uma benção para um morto do desabamento' },
  morador_aldeia_ferro_3: { conteudo: 'Tavro Meia-Orelha sabe que as carroças de metal recuperado descem até o terraço quarto e voltam com o que os mortos levavam. É ela quem guia as carroças, porque é a única que não tem medo do escuro lá embaixo.', comoDescobrir: 'segui-la num dos sumiços' },
  morador_mareu_0: { conteudo: 'Calder decretou a quarentena da peste uma semana tarde porque a guilda pediu que os navios de sal descarregassem primeiro. Assinou a data mudada no registro.', comoDescobrir: 'perguntar a ela o que fez na semana em que a peste chegou' },
  morador_mareu_1: { conteudo: 'Yara Boca-Seca deixa passar, uma noite por mês, o sal de Brida do Norte pela porta do cais. O dinheiro vai para a mãe, no Porto do Sal, que acha que é da guarda.', comoDescobrir: 'vigiar a porta do cais na noite sem lua' },
  morador_mareu_7: { conteudo: 'Sabra escreveu no registro a data errada da quarentena, a mando da senhora da cidade. Guardou a folha verdadeira dentro do livro de rezas da capela do cais.', comoDescobrir: 'acompanhá-la à capela e pedir para ver o livro de rezas' },
  morador_mareu_9: { conteudo: 'Loris recebe da guilda uma parte do sal sem selo que a guarda apreende. Em troca, entrega à guilda uma contrabandista por estação — sempre uma que não seja da Brida.', comoDescobrir: 'descobrir quem foi presa na última estação, e por quê' },
  morador_mareu_13: { conteudo: 'Halvo da Ponte é da família que perdeu a disputa do galpão. Tem, costurado no forro do casaco, o arpão de osso da avó — o que a Olho-Vivo quebrou naquela tarde. A ponta é a que falta no tridente da casa.', comoDescobrir: 'sentar ao lado dela no poste e perguntar pela vila da família' },
  morador_mareu_18: { conteudo: 'Pell Meia-Orelha desertou do regimento no último ano da guerra, levando o soldo de três. Voltou sem posto porque o posto teria pedido os papéis.', comoDescobrir: 'falar da guerra com ela até ela errar o nome do regimento' },
  morador_mareu_19: { conteudo: 'Brida do Norte sabe quem trancou a mãe dela no galpão da quarentena: foi Ansel Olho-Vivo, que ficou com a banca da família no mês seguinte.', comoDescobrir: 'ganhar a confiança dela e perguntar da banca da família' },
  morador_porto_sal_0: { conteudo: 'O dinheiro que a filha armeira emprestou a Nolan no inverno ruim veio de Aldric a Gorda, a chefe do crime do porto, que encomendou armas à filha em troca. Nolan paga a guarda com dinheiro do crime que a guarda devia prender, e sabe.', comoDescobrir: 'seguir o pagamento da guarda até a origem' },
  morador_porto_sal_1: { conteudo: 'Torv a Magra contou os mortos da peste em Mareu e anotou os que a lista oficial não tinha. A lista dela está com a agiota Jarek, que paga a capitã para guardá-la longe de Mareu.', comoDescobrir: 'perguntar a ela quantos morreram na peste e esperar o número' },
  morador_porto_sal_2: { conteudo: 'Ferran do Norte já riscou o nome da família do livro dos degredados, à noite, com tinta da escrivã. A guilda de Mareu tem uma cópia do livro e ainda não percebeu.', comoDescobrir: 'comparar o livro do porto com a cópia da guilda' },
  morador_porto_sal_9: { conteudo: 'Aldric a Gorda arma a gente dela com as pontas de arpão que Torv forja em Mareu. Paga a armeira em sal sem selo.', comoDescobrir: 'seguir uma entrega de sal sem selo até Mareu' },
  morador_aldeia_rede_3: { conteudo: 'Ilsa trocou o barco da mãe por um barco da guilda de Mareu que achou à deriva, com um fiscal morto dentro. Afundou o fiscal onde ninguém pesca e pintou o barco por cima.', comoDescobrir: 'examinar o barco dela por baixo da tinta' },
  morador_vintra_2: { conteudo: 'Quilda do Norte viu quem acendeu a primeira casa na segunda queimada de Vintra: a própria assembleia, que queria a vila reconstruída do zero e sem as dívidas de antes.', comoDescobrir: 'ganhar a confiança dela e perguntar por que a taverna foi a última a queimar' },
  morador_aldeia_carvoeira_3: { conteudo: 'Yara a Velha passa os sumiços na trilha escondida da vila das ferreiras, a que muda de lugar. As ferreiras de lá a deixam entrar porque ela leva carvão da Carvoeira, e ela é a única da aldeia que sabe voltar.', comoDescobrir: 'segui-la num dos sumiços, sem que ela perceba' },
  morador_solgar_0: { conteudo: 'Wenna Pé-de-Ferro recebe a diferença da água diluída na taverna de Solgar. O imposto da água não fecha a conta da vila desde a terceira tentativa, e ela prefere roubar dos bêbados a cobrar mais dos sedentos.', comoDescobrir: 'provar o vinho da taverna e perguntar à chefe o preço' },
  morador_solgar_5: { conteudo: 'Nevin Bico-Fino não roubou a mula e o dote para si: vendeu para pagar a febre da irmã do meio, que morreu mesmo assim. As irmãs nunca souberam que a febre era dela.', comoDescobrir: 'falar das irmãs com ela até ela perder a paciência' },
  morador_poco_seco_3: { conteudo: 'Ansel a Manca leva gente de Solgar pelo ermo até o sul por dinheiro, e leva de graça os meninos que os recrutadores da marca vão buscar. Sabe o nome de onze que estão vivos do outro lado.', comoDescobrir: 'pagar a ela uma travessia e perguntar pelo filho de Eda' },
  morador_caravancerai_1: { conteudo: 'Hedra do Norte perdeu as duas carroças da primeira caravana de propósito: estavam carregadas com armas para quem ia tentar tomar a cisterna de Solgar pela quarta vez. A mãe não sabe.', comoDescobrir: 'ganhar a confiança dela e perguntar da primeira caravana' },
  morador_vila_terraco_0: { conteudo: 'Zeno Meia-Orelha sabe que o Sexto recebeu os sobreviventes porque a casa Verrão pagou para esconder ali quem tinha visto o escoramento ceder. O dinheiro fez a primeira cisterna do bairro.', comoDescobrir: 'perguntar a ela quem pagou a cisterna do Sexto' },
  morador_vila_terraco_2: { conteudo: 'Perin a Torta guarda no porão da taverna a picareta da mãe, tirada do entulho, com a marca da casa Verrão. A casa diz que as ferramentas do terraço quarto eram das mineiras.', comoDescobrir: 'ganhar a confiança dela e pedir para ver o porão' },
  morador_vila_terraco_3: { conteudo: 'Aldric Bico-Fino anotou, nos dez dias em que costurou os sobreviventes, o nome e a ferida de cada um. Três deles tinham marca de corda no pulso — foram amarrados à escora para não subir antes da hora.', comoDescobrir: 'pedir a ela as anotações para tratar alguém do Sexto' },
  morador_vila_terraco_5: { conteudo: 'Aldric, a ladra do Sexto, rouba das casas e deixa o que rouba na porta das famílias do desabamento. Já roubou do cofre das Verrão uma vez e ninguém percebeu, porque ela devolveu metade.', comoDescobrir: 'vigiá-la uma noite inteira' },
  morador_aldeia_lenha_0: { conteudo: 'Kalen sabe o que entrou em Lenha Alta naquele inverno: era um oni que a Casa Sem Nome feriu e deixou fugir. Ela o viu sair pela janela da casa de Veski ao amanhecer, e escreveu à Casa. Ninguém respondeu.', comoDescobrir: 'ganhar a confiança dela e falar da Casa Sem Nome na Névoa' },
  morador_aldeia_lenha_2: { conteudo: 'Veski Boca-Seca aprendeu o risco de carvão com um caçador de onis que passou pela aldeia antes daquele inverno. O risco é glicínia queimada. Ela cobra das outras como se fosse benção.', comoDescobrir: 'mostrar a ela uma dose de glicínia' },
  morador_mercado_peixe_5: { conteudo: 'Ulla Meia-Orelha trata de graça, no Mercado do Peixe, as salgadeiras que a guilda não paga, e cobra da guilda em dobro. A mestra da guilda sabe e deixa, porque Ulla sabe o que houve no galpão da quarentena.', comoDescobrir: 'ser tratado por ela e ver a conta' },
  morador_mercado_peixe_6: { conteudo: 'Loris a Gorda viu, da taverna, a guilda trancar o galpão da quarentena com gente viva dentro. Uma das pessoas que passou a tranca era Vidar Olho-Vivo, hoje mestra da guilda.', comoDescobrir: 'beber com ela até tarde e falar da peste' },
  morador_mercado_peixe_9: { conteudo: 'Ysolt sabe quem pôs a chefe anterior no porão da guilda, porque foi ela quem abriu a porta. Fez isso a mando de Vidar Olho-Vivo, e guarda a chave.', comoDescobrir: 'perguntar a ela, longe do galpão, por que nunca desce ao porão' },
  morador_forja_afundada_0: { conteudo: 'Wyn de Baixo ainda forja aço solar na Forja Afundada, e vende as lâminas à Casa Sem Nome na Névoa. As casas de Corveira fecharam as fundições de aço solar porque uma delas vendia ao outro lado.', comoDescobrir: 'ganhar a confiança dela e mostrar uma lâmina Nichirin' },
  morador_ponta_areia_0: { conteudo: 'Roan a Nova sabe que o barco do marido não saiu na maré errada: foi furado na duna, por quem queria o ponto de pesca da família. Sabe quem, e deixa a filha dessa pessoa casar com o neto dela.', comoDescobrir: 'perguntar do barco do marido e ouvir o que ela não repete' },
  morador_ponta_areia_1: { conteudo: 'Aldric a Ruiva não perdeu o campo por dízimo: vendeu a divisa ao cobrador em troca de não ir presa por um incêndio no celeiro do senhor. O fogo foi dela.', comoDescobrir: 'falar do celeiro que queimou no Vale e ver a mão dela parar' },
  morador_ponta_areia_2: { conteudo: 'Gilda a Torta guarda embaixo da cabana os ossos grandes que a maré mostra nas pedras de fora. O padre manda cobrir; ela desenterra e vende o pó como remédio.', comoDescobrir: 'pedir a ela o remédio para febre de afogado' },
  morador_ponta_areia_4: { conteudo: 'Bran Sete-Dedos viu, numa noite de lua nova, gente de Forrarborg enterrar um homem de uniforme da Coroa na duna das cabras. Marcou o lugar com três pedras.', comoDescobrir: 'ganhar a confiança dela e perguntar por que as cabras não pastam numa duna' },
  morador_ponta_areia_3: { conteudo: 'Mira a Gorda responde, com lanterna, à fogueira de Forrarborg: ela é quem leva o sal sem selo das pedras de fora até o barco sem bandeira. O peixe é o disfarce.', comoDescobrir: 'estar nas pedras de fora numa noite sem lua e ver para onde ela rema' },
};
