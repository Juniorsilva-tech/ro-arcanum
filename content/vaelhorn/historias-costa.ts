// ARCANUM · Histórias da Costa de Mareu, do Bosque de Vintra, do Ermo de
// Solgar, dos Baixios de Halvern e da Vila dos Ferreiros (sessão 47, Fase 3).
// Mesmas regras de historias-vale.ts.
import type { HistoriaNpc } from '../../engine/types';

export const HISTORIAS_COSTA: Record<string, HistoriaNpc> = {
  // ───────────────────────────── MAREU
  morador_mareu_10: {
    origem: 'Nasceu numa das três vilas que viraram Mareu, filha de pescadora. Bate carteira no cais desde os catorze.',
    ferida: 'Perdeu meia orelha para a lei de Mareu aos vinte e quatro, e a cidade deu o apelido às filhas junto com a pena.',
    desejo: 'Que as filhas morram com o nome que ela deu a elas, e não com o que a cidade deu.',
    medo: 'Parar de roubar e descobrir que não sabe fazer mais nada.',
  },
  morador_mareu_17: {
    origem: 'Filha mais velha de Sela Meia-Orelha. Pregoeira do registro de Mareu desde os vinte, a voz que lê sentença na praça.',
    ferida: 'Ouviu a mãe ser sentenciada na praça aos cinco anos, de mãos dadas com a avó, e decidiu ali que seria ela a ler, um dia.',
    desejo: 'Ler uma sentença justa por inteiro, sem tremer a voz.',
    medo: 'O nome da mãe numa folha que ela tenha de ler.',
  },
  morador_mareu_18: {
    origem: 'Segunda filha de Sela Meia-Orelha. Foi para a guerra aos dezenove para perder o apelido e voltou aos trinta e cinco sem posto e com ele.',
    ferida: 'No regimento, o apelido chegou antes dela, na boca de uma recruta de Mareu. Nunca foi promovida.',
    desejo: 'Um posto de guarda em qualquer lugar onde ninguém saiba o que é Meia-Orelha.',
    medo: 'Ficar velha no cais contando a guerra para quem não pediu.',
  },
  morador_mercado_peixe_5: {
    origem: 'Terceira filha de Sela Meia-Orelha. Curandeira no Mercado do Peixe, para onde mudou aos vinte e dois para trocar de apelido.',
    ferida: 'No primeiro dia no Mercado do Peixe, uma freguesa perguntou se ela era parente da ladra de Mareu.',
    desejo: 'Que o galpão a chame pelo ofício, só, sem apelido nenhum.',
    medo: 'A mãe aparecer no galpão num dia de feira.',
  },
  morador_mercado_peixe_4: {
    origem: 'Caçula de Sela Meia-Orelha, armeira no mesmo galpão da irmã curandeira. Criou a filha Nolan sozinha.',
    ferida: 'Viu a filha ir para Corveira com dezoito anos para ser pregoeira e voltar a primeira carta perguntando o que o apelido significa lá.',
    desejo: 'Que Nolan suba no registro de Corveira até ninguém lembrar de Mareu.',
    medo: 'Que a filha precise voltar ao Mercado do Peixe.',
  },
  morador_mareu_0: {
    origem: 'Senhora da cidade de Mareu há vinte anos, filha de uma das três vilas que viraram cidade. Chegou ao posto porque a guilda precisava de alguém que assinasse.',
    ferida: 'Governava o cais no ano da peste e viu um terço da cidade morrer sob uma quarentena que ela decretou tarde.',
    desejo: 'Uma sessão do conselho, uma só, em que o voto seja decidido na sala e não na véspera.',
    medo: 'Que alguém pergunte o que ela fez na semana em que a peste chegou.',
  },
  morador_mareu_2: {
    origem: 'Mestra da guilda do sal em Mareu aos trinta e cinco, aprendiz da mestra anterior desde os catorze. Desconfia de forasteiro por ofício.',
    ferida: 'A mestra que a criou morreu à mesa do conselho, no meio de uma votação, e ninguém interrompeu a votação.',
    desejo: 'Que a guilda sobreviva à briga das Olho-Vivo pela casa.',
    medo: 'A herdeira que voltou de Corveira falando de imposto.',
  },
  morador_mareu_1: {
    origem: 'Filha de Loris Boca-Seca, criada na taverna do Porto do Sal. Capitã da guarda de Mareu aos trinta e cinco.',
    ferida: 'Saiu do Porto do Sal para Mareu aos dezoito sem que a mãe dissesse adeus, e só voltou a ver a mãe no enterro da avó.',
    desejo: 'Que a mãe aceite, um dia, um presente sem devolver com juros.',
    medo: 'Uma nova peste no porto.',
  },
  morador_mareu_8: {
    origem: 'Campeã de arena de Mareu, filha de estivadora. Luta desde os dezesseis.',
    ferida: 'Perdeu a força da perna boa numa luta, aos trinta, e ficou manca.',
    desejo: 'Uma última luta limpa, contra alguém que não saiba o nome dela.',
    medo: 'Que a arena a esqueça antes de ela parar.',
  },
  morador_mareu_9: {
    origem: 'Nasceu no bairro das salgadeiras de Mareu e manda no crime da cidade aos trinta e cinco, com a bênção de quem manda no sal.',
    ferida: 'A mãe salgou peixe a vida inteira para a guilda e morreu com as mãos em carne viva, sem um pedaço de chão.',
    desejo: 'Uma cadeira no conselho que se reúne na casa da guilda.',
    medo: 'Que a guilda decida que ela não serve mais.',
  },
  morador_mareu_12: {
    origem: 'Filha de Brida do Norte, criada no cais de Mareu. Carregadora desde os dezesseis, paga por jornada.',
    ferida: 'Aos doze, viu a mãe ser levada presa por uma noite e solta de manhã, e entendeu naquele dia de quem era a guarda.',
    desejo: 'Um navio onde ela seja marinheira, não carga.',
    medo: 'Virar a mãe sem perceber.',
  },
  morador_mareu_19: {
    origem: 'Contrabandista de sal pela Trilha Costeira há trinta anos, desde que a guilda fechou a banca da família no Mercado do Peixe.',
    ferida: 'A banca da família foi fechada pela guilda no ano da peste, com a mãe dentro do galpão da quarentena.',
    desejo: 'Que a filha tome o negócio e o faça melhor do que ela.',
    medo: 'Que a filha seja honesta a vida inteira e morra pobre.',
  },
  morador_mareu_14: {
    origem: 'Prima das Olho-Vivo do Mercado do Peixe, estalajadeira do lado de fora da muralha de Mareu desde os trinta.',
    ferida: 'Ficou com a estalagem de fora enquanto as primas ficaram com o mercado, e a conta disso nunca fechou na festa de família.',
    desejo: 'Que as primas digam, em voz alta, a quem devem a primeira banca.',
    medo: 'Morrer do lado de fora da muralha.',
  },
  morador_mercado_peixe_0: {
    origem: 'A mais velha das Olho-Vivo, senhora do Mercado do Peixe desde os quarenta. Nasceu no galpão, entre as bancas.',
    ferida: 'A mãe morreu sem dizer qual das filhas ficava com o galpão, e Ansel pegou o posto antes da irmã abrir a boca.',
    desejo: 'Que o Mercado do Peixe mande em Mareu, como mandava antes de haver Mareu.',
    medo: 'Que a prima Davet fale demais numa festa.',
  },
  morador_mercado_peixe_2: {
    origem: 'Caçula das Olho-Vivo, mestra da guilda do sal no galpão onde a guilda nasceu.',
    ferida: 'Foi posta na guilda pela irmã, que não queria concorrência no posto de senhora. Aprendeu a mandar num lugar que não escolheu.',
    desejo: 'Uma guilda que ela tenha escolhido, não herdado da irmã.',
    medo: 'Que a irmã decida que a guilda também é dela.',
  },
  morador_mercado_peixe_1: {
    origem: 'Capitã da guarda do Mercado do Peixe há vinte anos. Veio de Rede Rota aos vinte; a filha nasceu no quartel.',
    ferida: 'Deixou Rede Rota no ano em que a guilda mandou cobrar a aldeia à força, e nunca mais voltou, nem para enterrar a mãe.',
    desejo: 'Que a filha largue a arena antes de perder uma luta de verdade.',
    medo: 'Ser mandada de volta a Rede Rota para cobrar.',
  },
  morador_mercado_peixe_8: {
    origem: 'Filha da capitã Nolan a Calada, criada no quartel do Mercado do Peixe. Luta na arena desde os vinte.',
    ferida: 'Perdeu, aos vinte e dois, uma aposta que não podia pagar, e a dívida mudou de dono até cair na mão da senhora do mercado.',
    desejo: 'Terminar de pagar e lutar só pelo prazer de vencer.',
    medo: 'Que a mãe descubra o tamanho da dívida.',
  },
  morador_mercado_peixe_9: {
    origem: 'Manda no crime do Mercado do Peixe desde os trinta, depois de anos de ajudante da chefe anterior.',
    ferida: 'A chefe anterior foi achada no porão da guilda, e Ysolt herdou o posto sem que ninguém perguntasse quem a pôs lá.',
    desejo: 'Uma guilda que não possa dispensá-la como dispensou a outra.',
    medo: 'O porão da guilda.',
  },
  morador_porto_sal_6: {
    origem: 'Taverneira do Porto do Sal há trinta anos, neta de salineira degredada. Criou duas filhas atrás do balcão.',
    ferida: 'O nome da família ainda pesa no porto: a avó veio acorrentada para as salinas, e a taverna nunca foi convidada a festa de guilda nenhuma.',
    desejo: 'Que as filhas mandem no porto que desprezou a avó.',
    medo: 'Que as filhas tenham vergonha dela.',
  },
  morador_solgar_1: {
    origem: 'Filha caçula de Loris Boca-Seca. Foi para Solgar aos vinte como aprendiz de ferreira e ficou com a forja da vila.',
    ferida: 'Chegou ao ermo sem conhecer ninguém e pagou pela água, no primeiro verão, com o que ganhava de aprendiz.',
    desejo: 'Uma forja no Porto do Sal, perto da mãe, antes que a mãe morra.',
    medo: 'Ficar no ermo até ser velha demais para voltar.',
  },
  morador_porto_sal_0: {
    origem: 'Senhora do Porto do Sal, de família de feitores das salinas. Governa o porto há quinze anos.',
    ferida: 'Governou o porto no inverno ruim em que a guilda cortou o crédito, e teve de aceitar dinheiro da própria filha para pagar a guarda.',
    desejo: 'Devolver à filha cada moeda antes de deixar o posto.',
    medo: 'Morrer devendo.',
  },
  morador_porto_sal_4: {
    origem: 'Filha da senhora do Porto do Sal, armeira desde os vinte. Chamada de "a Velha" desde menina, por falar como avó.',
    ferida: 'Salvou a mãe num inverno ruim e a mãe não disse obrigada: disse que ia pagar.',
    desejo: 'Que a mãe um dia peça ajuda, em vez de anotar a dívida.',
    medo: 'Que o comprador das lâminas dela peça outra coisa.',
  },
  morador_porto_sal_1: {
    origem: 'Capitã da guarda do Porto do Sal, veio da guarda de Mareu depois da peste.',
    ferida: 'Contou os mortos da peste no cais de Mareu e pediu transferência para um porto menor, onde houvesse menos para contar.',
    desejo: 'Terminar o serviço sem precisar tomar lado entre a guilda e o porto.',
    medo: 'Navio de quarentena.',
  },
  morador_porto_sal_8: {
    origem: 'Campeã de arena do Porto do Sal aos sessenta e um. Luta nas festas da guilda há trinta anos.',
    ferida: 'Tem marcas nos pulsos que nenhuma luta explica, e a guilda nunca perguntou.',
    desejo: 'Morrer lutando numa festa da guilda, na frente de todos eles.',
    medo: 'Que alguém da idade dela a reconheça numa festa.',
  },
  morador_porto_sal_9: {
    origem: 'Manda no crime do Porto do Sal, filha de salineira. Veio das salinas para o cais e do cais para a rua.',
    ferida: 'Trabalhou nas salinas dos dez aos dezoito e tem as mãos rachadas até hoje.',
    desejo: 'Que nenhuma criança do porto veja uma salina por dentro.',
    medo: 'Que a guarda descubra quem arma a gente dele.',
  },
  mestra_do_porto: {
    origem: 'Mestra do Porto do Sal há vinte anos. Foi sócia de Nera Quilm no tempo em que o farol ainda servia e o porto ainda dependia dele.',
    ferida: 'Rompeu a sociedade com Nera na semana em que o farol apagou, e perdeu a única amiga que tinha no porto.',
    desejo: 'Um porto que funcione sem farol e sem perguntas.',
    medo: 'Nera falando em público.',
  },
  viuva_do_farol: {
    origem: 'Faroleira do Farol Quebrado por quarenta anos, filha e neta de faroleira. Sócia da mestra do porto até o farol apagar.',
    ferida: 'O mar levou a filha, Sena, e deixou a neta, Quim, de colo, para ela criar dentro da torre.',
    desejo: 'Que Quim viva longe do mar, numa casa sem janela para a enseada.',
    medo: 'Apagar a luz, uma noite que seja.',
  },
  pescadora_da_rede: {
    origem: 'Neta de Nera Quilm, criada dentro do Farol Quebrado. Pesca com rede funda em Rede Rota desde os dezesseis.',
    ferida: 'Cresceu sem mãe, com uma avó que acende uma luz que não guia ninguém.',
    desejo: 'Descer mais fundo do que qualquer pescadora já desceu.',
    medo: 'Que a avó morra sem contar o que sabe da noite do farol.',
  },
  ferreira_de_mareu: {
    origem: 'Ferreira naval de Mareu, filha de calafate. Forja ferragem de navio desde os dezoito.',
    ferida: 'Viu um navio afundar na saída do porto por uma ferragem condenada que outra ferreira assinou, com a tripulação inteira dentro.',
    desejo: 'Que nenhum navio saia de Mareu com ferro ruim.',
    medo: 'Ser ela a ferreira da próxima ferragem que quebrar.',
  },
  morador_aldeia_rede_1: {
    origem: 'Lavradora de Rede Rota, nascida e criada na aldeia que não paga taxa à guilda.',
    ferida: 'Cresceu ouvindo a aldeia jurar que não paga taxa, e aprendeu cedo que juramento de aldeia se paga de outro jeito.',
    desejo: 'Que a filha herde a terra sem herdar a guerra com a guilda.',
    medo: 'Outra coletora na enseada.',
  },
  morador_aldeia_rede_4: {
    origem: 'Filha de Cera Sete-Dedos, pastora de cabras em Rede Rota. Dorme fora mais do que dorme em casa.',
    ferida: 'Nasceu surda de um ouvido e ganhou o apelido antes de aprender a andar.',
    desejo: 'Ver uma cidade grande, com porto e navio, de dentro.',
    medo: 'Morrer na mesma enxada que a mãe.',
  },

  // ───────────────────────────── BOSQUE DE VINTRA
  carvoeira_velha: {
    origem: 'Carvoeira da aldeia de Carvoeira há cinquenta anos, filha de carvoeira. Lê o bosque pela cor e pelo cheiro da fumaça.',
    ferida: 'No terceiro aviso da vida dela, Vintra não escutou a tempo e queimou pela segunda vez.',
    desejo: 'Que a filha seja chamada de Braza pelo menos no enterro dela.',
    medo: 'Um cheiro que ela não saiba nomear.',
  },
  guarda_do_bosque: {
    origem: 'Filha de Ferna Braza, criada na Carvoeira. Tomou o nome de Vintra aos vinte e cinco, quando assumiu o posto de guardiã do bosque.',
    ferida: 'Perdeu a primeira aprendiz no Passo do Lobo, numa noite em que confiou no próprio olho e não no aviso da mãe.',
    desejo: 'Um bosque em que ela possa andar sem arma.',
    medo: 'Precisar do posto mais do que da verdade.',
  },
  morador_vintra_1: {
    origem: 'Irmã mais nova de Ferna Braza, ferreira em Vintra desde que a vila foi reconstruída pela segunda vez.',
    ferida: 'Forjou os pregos das duas reconstruções de Vintra, e na segunda já sabia que ia forjar uma terceira.',
    desejo: 'Morrer antes de Vintra queimar pela terceira vez.',
    medo: 'Que alguém peça a ela para abrir alguma coisa.',
  },
  morador_vintra_0: {
    origem: 'Chefe de Vintra eleita pela assembleia há doze anos. Nasceu na vila, filha de uma das famílias que reconstruíram a segunda vez.',
    ferida: 'Criou a filha sozinha e a filha virou a ladra que a assembleia inteira conhece.',
    desejo: 'Que Vintra dure mais do que duraram as duas anteriores.',
    medo: 'Uma assembleia que decida construir onde não se constrói.',
  },
  morador_vintra_5: {
    origem: 'Filha da chefe de Vintra, ladra conhecida da vila inteira desde os dezesseis.',
    ferida: 'Roubou pela primeira vez aos doze, pão, num inverno em que a mãe gastou tudo o que tinham na reconstrução da praça.',
    desejo: 'Que a mãe diga na assembleia que tem orgulho dela, por algum motivo.',
    medo: 'A guarda Elna da Ponte, que não esquece nada.',
  },
  morador_vintra_4: {
    origem: 'Guarda da vila de Vintra, nascida na Ponte, no Vale de Halvet, e mandada para o bosque aos vinte.',
    ferida: 'Voltou de uma ronda no bosque com o braço enfaixado e nunca mais fez aquela ronda.',
    desejo: 'Uma transferência de volta para o vale, para a guarda da praça.',
    medo: 'O Passo do Lobo depois do escurecer.',
  },
  morador_vintra_8: {
    origem: 'Caçadora de peles de Vintra, criada entre o bosque e o Passo do Lobo. Conhece a mata como a curandeira conhece gente.',
    ferida: 'Perdeu o irmão caçador no Passo do Lobo aos vinte, e passou dez anos aprendendo o passo para entender como.',
    desejo: 'Que nenhuma caravana morra no passo por falta de informação.',
    medo: 'Ouvir o passo em silêncio.',
  },
  morador_aldeia_carvoeira_4: {
    origem: 'Pastora da Carvoeira, dorme fora com as cabras desde os vinte. Criou a filha sozinha, entre o pasto e a borda da mata.',
    ferida: 'Tem uma mecha branca no cabelo desde um dia de que não fala, e a filha tem outra igual.',
    desejo: 'Que a filha pare de sumir e volte a dormir no pasto com ela.',
    medo: 'Que a filha um dia não volte.',
  },
  morador_aldeia_carvoeira_3: {
    origem: 'Filha da pastora Wyn a Ruiva, nascida na Carvoeira. Some por dias desde os dezoito.',
    ferida: 'Voltou de um dos sumiços com uma mecha branca no cabelo e sem lembrar de três dias.',
    desejo: 'Voltar ao lugar para onde ela vai, e ficar.',
    medo: 'Que a mãe a siga.',
  },

  // ───────────────────────────── ERMO DE SOLGAR
  morador_solgar_0: {
    origem: 'Chefe de Solgar há quinze anos, de família que guarda a cisterna desde que houve cisterna.',
    ferida: 'Defendeu a cisterna na terceira tentativa de tomá-la, aos trinta, e viu a água ficar vermelha por uma semana.',
    desejo: 'Que Solgar exista depois dela do mesmo jeito que existiu antes: por causa da água.',
    medo: 'Uma quarta tentativa.',
  },
  morador_solgar_8: {
    origem: 'Filha de Wenna Pé-de-Ferro, caçadora de peles no Ermo de Solgar desde os dezesseis.',
    ferida: 'A mãe fechou a cisterna para ela num verão, como faz com qualquer devedor, e ela teve de comprar água emprestada.',
    desejo: 'Uma vila onde a água da cisterna não tenha dono.',
    medo: 'Ficar igual à mãe no dia em que tiver o que a mãe tem.',
  },
  morador_solgar_4: {
    origem: 'Guarda de Solgar, nascida no Poço Seco antes da seca. Chegou à vila menina, na caminhada da aldeia.',
    ferida: 'Metade da gente que saiu a pé do Poço Seco morreu no caminho, e a irmã dela foi uma.',
    desejo: 'Que ninguém mais precise atravessar o ermo sem água.',
    medo: 'Sede de novo, como na caminhada.',
  },
  aguadeira_do_poco: {
    origem: 'Aguadeira do Poço Seco, guarda o único poço que ainda dá. Guiou a aldeia até Solgar na seca e voltou para o poço depois.',
    ferida: 'Metade da aldeia morreu no caminho que ela guiou, e a outra metade a chama de salvadora.',
    desejo: 'Que a filha herde o poço e a justiça que vem com ele.',
    medo: 'Que alguém volte a pedir a ela o que pediram uma vez.',
  },
  morador_poco_seco_1: {
    origem: 'Filha de Ura Seca, lavradora no Poço Seco. Tinha dois anos na caminhada até Solgar e foi carregada nas costas da mãe.',
    ferida: 'Deve balde de água a meio povoado porque a mãe não lhe dá nem um a mais do que dá a qualquer um.',
    desejo: 'Ir embora do ermo para um lugar onde chova.',
    medo: 'Ficar com o poço.',
  },
  dona_do_caravancerai: {
    origem: 'Dona do caravançarai da estrada de Solgar, filha de estalajadeira do ermo. Ouve a estrada inteira passar pelo balcão.',
    ferida: 'Perdeu o marido para uma caravana que saiu da parada e nunca chegou a Solgar, e soube pelo balcão quem sabia e não avisou.',
    desejo: 'Saber de tudo o que passa pela estrada antes de todo mundo.',
    medo: 'Que a estrada pare de passar pela porta dela.',
  },
  morador_caravancerai_0: {
    origem: 'Dona da Parada de Idrin há vinte anos. Criou a filha entre tropeiros, cavalos e brigas de portão.',
    ferida: 'A parada esteve a um mês de fechar, e quem a salvou foi a filha de dezenove anos.',
    desejo: 'Pagar a filha e deixar a parada para ela, sem dívida.',
    medo: 'Que a neutralidade da parada acabe no tempo dela.',
  },
  morador_caravancerai_1: {
    origem: 'Filha da dona da Parada de Idrin. Chefia caravana desde os dezessete, a mais nova do ermo.',
    ferida: 'Na primeira caravana que chefiou, perdeu duas carroças no ermo e aprendeu que tropeira velha não obedece menina.',
    desejo: 'Uma rota própria, do ermo até o Porto do Sal.',
    medo: 'Ficar presa na parada.',
  },
  morador_caravancerai_2: {
    origem: 'Escolta de comboio da Parada de Idrin há trinta anos. Veio de Mareu atrás do irmão, que escoltava caravanas no ermo.',
    ferida: 'O irmão morreu do lado de fora do portão da parada, no minuto seguinte à saída de uma caravana.',
    desejo: 'Morrer de velha, do lado de dentro do portão da parada.',
    medo: 'Que alguém pergunte pelo irmão dela.',
  },

  // ───────────────────────────── BAIXIOS DE HALVERN
  barqueira_do_vau: {
    origem: 'Barqueira do Vau de Pedra, filha de Corin, a lavradora de Juncal de Baixo. Atravessa gente desde os dezoito.',
    ferida: 'Recusou o posto de anciã da vila para ficar no barco, e o posto caiu na filha de dezenove anos.',
    desejo: 'Que a filha entre no barco com ela uma vez.',
    medo: 'A travessia depois do anoitecer.',
  },
  morador_vila_juncal_1: {
    origem: 'Lavradora de Juncal de Baixo, mãe da barqueira e avó da anciã. Planta a terra dos juncaleiros há quarenta anos.',
    ferida: 'Viu a filha recusar o posto de anciã e a neta aceitar manca, aos dezenove, porque alguém tinha de aceitar.',
    desejo: 'Que a neta governe sem ela por trás antes de ela morrer.',
    medo: 'O rio à noite, e o que a filha já viu atravessar.',
  },
  morador_vila_juncal_0: {
    origem: 'Neta de Corin e filha da barqueira Tela. Anciã de Juncal de Baixo desde os dezenove.',
    ferida: 'Caiu no vau aos oito, tentando subir no barco da mãe, e ficou manca. Desde então não entra no barco.',
    desejo: 'Que o Juncal nunca precise de guia para ser encontrado por quem foge, e nunca seja encontrado por quem caça.',
    medo: 'Um coletor que chegue sem guia.',
  },

  // ───────────────────────────── A VILA QUE NINGUÉM ENCONTRA DUAS VEZES
  morador_vila_ferreiros_0: {
    origem: 'Criada com a irmã pela mestra da Vila que Ninguém Encontra Duas Vezes, depois que um oni matou os pais das duas na estrada.',
    ferida: 'Foi escolhida mestra no lugar da irmã mais velha, e a irmã passou a chamá-la de mestra na frente de todo mundo.',
    desejo: 'Que a irmã volte a chamá-la pelo nome, e não de mestra.',
    medo: 'Errar numa lâmina que importe.',
  },
  morador_vila_ferreiros_1: {
    origem: 'A mais velha das duas irmãs criadas pela mestra da Vila dos Ferreiros. Aprendiz de forja aos vinte e dois.',
    ferida: 'Viu a mestra escolher a irmã mais nova e nunca soube por quê.',
    desejo: 'Uma lâmina dela na mão de um Hashira, com o nome dela na espiga.',
    medo: 'Morrer aprendiz.',
  },
};
