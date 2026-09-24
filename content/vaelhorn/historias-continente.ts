// ARCANUM · Histórias da Marca de Tessel, do Planalto de Corveira e da
// gente de fora do vale (sessão 47, Fase 3). Mesmas regras de
// historias-vale.ts: concreto, sem entregar segredo, coerente com a família.
import type { HistoriaNpc } from '../../engine/types';

export const HISTORIAS_CONTINENTE: Record<string, HistoriaNpc> = {
  // ───────────────────────────── TESSEL
  marechala_odile: {
    origem: 'Gêmea de Ketta, filha da marechala Idrun Varn. Cresceu no quartel de Tessel ouvindo que seria a próxima, porque nasceu primeiro.',
    ferida: 'Tinha vinte e nove anos no trigésimo dia do cerco de quarenta, quando a mãe caiu na muralha oeste e o posto caiu nas mãos dela no mesmo dia.',
    desejo: 'Entregar a marca inteira à filha, com a muralha de pé e as contas fechadas.',
    medo: 'Ser a Varn que perde o que três gerações seguraram.',
  },
  morador_tessel_7: {
    origem: 'Gêmea de Odile, criada no mesmo quarto e educada para a mesma coisa, até o dia em que o registro disse qual das duas mandava.',
    ferida: 'No enterro da mãe, durante o cerco, ficou atrás da irmã na fila dos Varn. Ficou atrás desde então.',
    desejo: 'Que a sobrinha seja marechala melhor do que a mãe, e que saiba a quem agradecer.',
    medo: 'Que a irmã morra antes de as duas conversarem sobre o livro.',
  },
  morador_tessel_17: {
    origem: 'Filha única de Odile Varn, nascida um ano antes do cerco. Aprendeu a ler nos editos da mãe.',
    ferida: 'Pediu aos quinze um posto no quartel e a mãe a pôs de pregoeira, "para aprender a voz da marca". Tomou como desprezo.',
    desejo: 'O posto de marechala antes dos trinta, e sem precisar da tia.',
    medo: 'Que a tia Ketta goste dela de verdade.',
  },
  sargenta_brila: {
    origem: 'Filha de Cera Ost, veterana do cerco. Entrou para a guarda de Tessel aos dezesseis e subiu a sargenta do portão aos vinte e oito.',
    ferida: 'O irmão, Tobin, foi na leva da marca aos dezoito e morreu no primeiro inverno do Forte Agulha. A mãe não tinha com que comprar a dispensa.',
    desejo: 'Que nenhuma mãe de Tessel passe pelo que a dela passou por falta de grão.',
    medo: 'O dia em que a marechala decidir o que fazer com ela.',
  },
  morador_tessel_18: {
    origem: 'Soldada da marca desde os quinze. Lutou os quarenta dias do cerco na muralha oeste e saiu sem posto quando a guerra acabou.',
    ferida: 'Perdeu o filho Tobin para a leva no primeiro inverno de paz, depois de sobreviver à guerra inteira.',
    desejo: 'Que as filhas nunca precisem escolher entre a lei da marca e a família.',
    medo: 'Perguntar à filha mais velha uma coisa que ela não quer saber.',
  },
  morador_tessel_6: {
    origem: 'Caçula de Cera Ost. Taverneira desde os vinte, na taverna da muralha que serve a guarda.',
    ferida: 'Tinha oito anos quando o irmão foi na leva. Lembra dele pelo cheiro de couro da farda que ele não chegou a usar.',
    desejo: 'Tirar a mãe de Tessel e abrir uma taverna longe de qualquer quartel.',
    medo: 'Que a irmã seja presa e a mãe fique sozinha com ela.',
  },
  armeira_de_tessel: {
    origem: 'Caçula das Pé-de-Ferro, aprendiz da irmã Nevin até os vinte. Foi para a guarnição quando as duas brigaram por causa de uma encomenda do quartel.',
    ferida: 'Refez, depois do cerco, as armaduras dos mortos da muralha oeste para vestir os recrutas novos. Contou quarenta e duas.',
    desejo: 'Uma armadura de placa que ela assine, usada por uma marechala.',
    medo: 'Que a irmã passe fome por orgulho antes de pedir ajuda.',
  },
  morador_tessel_4: {
    origem: 'A mais velha das Pé-de-Ferro, armeira da cidade de Tessel há vinte e cinco anos. Ensinou o ofício à irmã e às duas filhas; ficou com uma aprendiz só.',
    ferida: 'A irmã levou a encomenda do quartel e a clientela da guarda com ela, e a oficina da cidade passou a viver de ferradura.',
    desejo: 'Que uma das filhas volte à bigorna antes que as mãos dela parem.',
    medo: 'Ferro caro demais para comprar honestamente.',
  },
  morador_tessel_3: {
    origem: 'Filha mais velha de Nevin Pé-de-Ferro, criada no calor da forja. Aos dezoito largou a bigorna e abriu uma loja de secos e molhados.',
    ferida: 'A mãe não falou com ela durante um ano inteiro depois que ela largou a forja, e depois voltou a falar como se nada fosse.',
    desejo: 'Uma loja que não dependa de ninguém da família.',
    medo: 'Que a irmã caçula morra na rua de um inverno que ela podia ter evitado.',
  },
  morador_tessel_13: {
    origem: 'Caçula de Nevin Pé-de-Ferro. Saiu de casa aos dezesseis e vive na rua de Tessel, olhando tudo.',
    ferida: 'Escapou da leva da marca aos dezoito sem entender como, e vê todo dia na rua gente que não escapou.',
    desejo: 'Saber o bastante para nunca mais depender da sorte.',
    medo: 'Voltar para casa e ter de explicar por que saiu.',
  },
  morador_tessel_1: {
    origem: 'Capitã da guarda de Tessel desde o fim do cerco, promovida no lugar de uma capitã que morreu na muralha oeste.',
    ferida: 'Criou duas filhas sozinha dentro do quartel, e as duas saíram de casa para longe dela, cada uma por uma porta.',
    desejo: 'Ver as duas filhas na mesma mesa sem que uma delas esteja algemada.',
    medo: 'Ter de prender a própria filha na fronteira que ela guarda.',
  },
  morador_tessel_19: {
    origem: 'Filha mais velha da capitã Roan, criada no quartel. Aprendeu a fronteira patrulhando com a mãe, e hoje a atravessa sem ela.',
    ferida: 'A mãe escolheu a guarda antes da família numa noite de febre da irmã, e Ferran nunca esqueceu quem ficou cuidando.',
    desejo: 'Ter dinheiro para não precisar de ninguém com farda.',
    medo: 'Encontrar a mãe do outro lado da fronteira numa noite de carga.',
  },
  morador_forte_agulha_3: {
    origem: 'Filha caçula da capitã Roan, criada entre o quartel e a casa da irmã contrabandista. Alistou-se no Forte Agulha aos trinta, velha para recruta.',
    ferida: 'Cuidou sozinha da própria febre, aos dez, enquanto a mãe patrulhava e a irmã estava na fronteira.',
    desejo: 'Uma vida em que ninguém saiba de quem ela é filha.',
    medo: 'Que a mãe apareça no forte numa inspeção.',
  },
  morador_forte_agulha_0: {
    origem: 'Comandante do Forte Agulha há doze anos. Veio da guarnição de condenados: trocou forca por serviço aos vinte e subiu por não desertar.',
    ferida: 'Estava no forte na segunda queda, como cabo, e desde então conta os sacos de farinha duas vezes ao dia.',
    desejo: 'Ser a primeira comandante a devolver o forte ao tratado sem que ele tenha caído.',
    medo: 'Um inverno comprido com o celeiro pela metade.',
  },
  morador_forte_agulha_1: {
    origem: 'Sargenta do Forte Agulha, da mesma turma de condenados que a comandante Elna. Nunca subiu além de sargenta.',
    ferida: 'Viveu as duas quedas do forte por fome, e na segunda comeu couro de sela com a irmã para chegar ao tratado.',
    desejo: 'Sair do forte antes da terceira queda, com a irmã.',
    medo: 'Que a comandante resolva a conta antiga entre as duas.',
  },
  morador_forte_agulha_2: {
    origem: 'Cozinheira da guarnição há vinte anos. Entrou no forte como condenada junto com a irmã Davet e ficou quando a pena acabou.',
    ferida: 'Racionou a última farinha da segunda queda para os feridos, e viu os saudáveis olharem para ela como se ela fosse comida.',
    desejo: 'Um celeiro que ela nunca precise contar.',
    medo: 'O barulho de gente com fome batendo colher em tigela vazia.',
  },
  morador_tessel_8: {
    origem: 'Campeã da arena de Tessel há onze anos, depois de uma juventude na guarnição do Forte Agulha.',
    ferida: 'Perdeu a única luta que importava, aos trinta, contra uma lutadora que morreu dos ferimentos na semana seguinte. Ganhou todas depois.',
    desejo: 'Aposentar-se invicta, antes que o corpo a desminta na frente de todo mundo.',
    medo: 'Lutar diante da filha de alguém que ela venceu.',
  },
  morador_tessel_9: {
    origem: 'Nasceu no bairro de barracas de Tessel, onde metade das casas ainda tem planta de acampamento. Manda no crime da cidade aos vinte.',
    ferida: 'A mãe morreu enforcada na praça por roubar grão da leva, no ano em que Orla tinha onze e a marca inteira comia pão.',
    desejo: 'Ver um Varn pagar por alguma coisa, em praça pública.',
    medo: 'Envelhecer e ficar como as velhas do bairro, vendendo o que sabe por pão.',
  },

  // ───────────────────────────── PEDRAVEL
  ancia_pedravel: {
    origem: 'Nasceu em Pedravel quando a vila era um punhado de casas de pedra solta. Manda nela desde os vinte e um, e governou sob quatro marechalas.',
    ferida: 'No quinto ano da isenção a vila não tinha grão para pagar, e a filha Anja morreu naquele inverno.',
    desejo: 'Que Pedravel continue de pé depois dela, com a neta no lugar e o neto vivo.',
    medo: 'Os fiscais da marca, e a memória boa demais de Odile Varn.',
  },
  morador_vila_pedravel_0: {
    origem: 'Neta de Mora Quelha, filha de Anja. Criada pela avó desde os três anos e posta como chefe de Pedravel aos dezessete.',
    ferida: 'Não lembra da mãe, só do inverno em que ela morreu, porque a avó chorou uma única vez na vida e foi aquela.',
    desejo: 'Mandar de verdade na vila cujos papéis ela assina.',
    medo: 'Ser presa por uma assinatura que não foi decisão dela.',
  },
  rapaz_da_leva: {
    origem: 'Neto de uma prima de Mora Quelha, criado em Pedravel como neto da anciã. Foi na leva da marca aos dezoito, com outros da vila.',
    ferida: 'Voltou. Viu, no caminho do forte, os rapazes da vila que não voltaram, e não consegue explicar a ninguém por que ele sim.',
    desejo: 'Ser útil à avó sem que ninguém pergunte o que ele fez para estar ali.',
    medo: 'A estrada de Tessel, e qualquer farda nela.',
  },
  morador_vila_pedravel_3: {
    origem: 'Curandeira de Pedravel há quarenta anos, aprendeu com a ferreira Roan a Magra a costurar carne como se costura couro.',
    ferida: 'Teve Rhea aos quarenta e dois, depois de perder dois filhos para a febre, e criou a caçula com medo de tudo.',
    desejo: 'Que Rhea largue o moinho e seja curandeira depois dela.',
    medo: 'Que a vila precise dela para uma coisa que não se cura.',
  },
  morador_vila_pedravel_7: {
    origem: 'Filha temporã da curandeira Yara a Calada. Moleira de Pedravel desde os dezoito, quando a moleira velha morreu.',
    ferida: 'Os dois irmãos que ela não conheceu morreram de febre antes de ela nascer, e ela cresceu sendo o que sobrou.',
    desejo: 'Sair de Pedravel com Quilda, as duas, para qualquer lugar sem avó e sem mãe.',
    medo: 'Que Quilda vá embora sem ela.',
  },
  morador_vila_pedravel_4: {
    origem: 'Guarda de Pedravel desde os vinte, filha de uma tropeira que morreu na estrada de Tessel.',
    ferida: 'A mãe foi parada na estrada por fiscais da marca com carga de grão e nunca chegou em casa.',
    desejo: 'Uma vila que não precise temer a estrada.',
    medo: 'Descobrir que a mãe morreu por nada.',
  },
  morador_vila_pedravel_8: {
    origem: 'Caçadora de peles de Pedravel, criada nos Campos da Ceifa. Anda manca desde os vinte.',
    ferida: 'Quebrou a perna aos vinte e passou o inverno de cama; foi quando aprendeu a curtir pele sentada.',
    desejo: 'Ser paga pelo que caça, não pelo que carrega.',
    medo: 'Ficar para trás numa caçada.',
  },

  // ───────────────────────────── CORVEIRA
  senhora_corveira: {
    origem: 'Cabeça da casa Verrão, uma das sete de Corveira. Herdou a casa aos trinta e cinco, dos cofres ao voto no conselho das sete.',
    ferida: 'O marido, Oren, morreu no desabamento do quarto terraço com duzentas e dez outras pessoas, e ela enterrou o marido no mesmo dia em que assinou as indenizações.',
    desejo: 'Que a casa Verrão passe inteira às filhas, sem dívida e sem mancha.',
    medo: 'Papel. Qualquer papel que ela não tenha lido.',
  },
  morador_corveira_0: {
    origem: 'Filha mais velha de Halda Verrão, posta como senhora da cidade aos vinte e oito para a casa ter voz no pregão.',
    ferida: 'Tinha vinte anos quando o pai morreu no desabamento. A mãe foi ao enterro de manhã e ao conselho de tarde.',
    desejo: 'Governar a cidade uma vez sem a mãe mandar recado.',
    medo: 'Descobrir que o pai morreu por conta da casa.',
  },
  irma_copista: {
    origem: 'Filha do meio de Halda Verrão. Entrou para o Mosteiro do Alto aos dezoito, um ano depois da morte do pai, para fugir da mesa da mãe.',
    ferida: 'Tinha dezessete anos no desabamento e foi quem abriu a porta para o mensageiro que trouxe a notícia do pai.',
    desejo: 'Guardar a verdade de alguma coisa, qualquer coisa, que a casa não possa comprar.',
    medo: 'Esquecer uma palavra.',
  },
  morador_corveira_7: {
    origem: 'Caçula de Halda Verrão. Escrivã do registro de Corveira desde os vinte.',
    ferida: 'Tinha treze anos quando o pai morreu, e o registro onde ela trabalha tem o nome dele na lista dos duzentos e onze.',
    desejo: 'Um registro onde tudo o que está escrito seja verdade.',
    medo: 'Receber uma ordem da mãe por escrito.',
  },
  perita_do_desabamento: {
    origem: 'Perita de galeria formada no Poço Fundo, filha de mineira. Assinou o primeiro laudo aos vinte e quatro.',
    ferida: 'Assinou o laudo do desabamento aos trinta e dois, e duzentos e onze nomes passaram a caber numa assinatura.',
    desejo: 'Uma noite inteira de sono sem beber antes.',
    medo: 'A filha saber o que a mãe assinou.',
  },
  morador_corveira_5: {
    origem: 'Filha de Sibel Arne, criada entre as galerias e a botica. Curandeira em Corveira desde os vinte e dois.',
    ferida: 'A mãe começou a beber quando Jarek tinha quinze anos, e desde então é ela quem cuida da mãe e não o contrário.',
    desejo: 'Que a mãe pare de beber antes de parar de tremer.',
    medo: 'O casaco da mãe.',
  },
  morador_corveira_11: {
    origem: 'Agiota do bairro de fora de Corveira, filha de uma família que perdeu tudo no desabamento e reconstruiu emprestando.',
    ferida: 'Recebeu a indenização da família em minério que ninguém comprava, e aprendeu que a cidade paga em pedra quem ela quebra.',
    desejo: 'Que o Sexto inteiro deva a ela, e que as casas precisem dela para cobrar.',
    medo: 'As próprias filhas, juntas.',
  },
  morador_corveira_14: {
    origem: 'Filha mais velha de Jarek o Gordo, estalajadeira do bairro de fora desde os vinte e cinco.',
    ferida: 'A mãe cobrou dela, com juros, o dinheiro que ela usou para abrir a estalagem. Pagou tudo e parou de chamar a mãe de mãe.',
    desejo: 'Uma estalagem onde a mãe não possa entrar.',
    medo: 'Precisar de dinheiro emprestado outra vez.',
  },
  morador_corveira_12: {
    origem: 'Caçula de Jarek o Gordo, carregadora no cais do Sexto desde os dezesseis.',
    ferida: 'Carrega no cais o que a mãe manda carregar, desde os dezesseis, e aprendeu a não perguntar o que é.',
    desejo: 'Que a irmã a leve para morar na estalagem.',
    medo: 'A mãe, e a voz da mãe quando conta dinheiro.',
  },
  morador_corveira_1: {
    origem: 'Capitã da guarda de Corveira. Foi mineira de galeria até os quarenta e três, quando veio o desabamento do quarto terraço.',
    ferida: 'Carregou corpos do quarto terraço por nove dias e depois não desceu mais em galeria nenhuma.',
    desejo: 'Que ninguém mais precise da guarda para tirar gente de baixo de pedra.',
    medo: 'Descer de novo a qualquer galeria.',
  },
  morador_corveira_8: {
    origem: 'Campeã de arena de Corveira, filha de mineira. Veste na arena as cores de uma das sete casas desde os vinte e cinco.',
    ferida: 'A mãe morreu no desabamento e a casa pela qual Veski luta pagou a indenização em minério.',
    desejo: 'Lutar uma temporada inteira sem a cor de casa nenhuma.',
    medo: 'Morrer na arena pela casa que pagou a mãe em pedra.',
  },
  morador_corveira_9: {
    origem: 'Manda no crime de Corveira há trinta anos. Nasceu no Sexto quando ele ainda era terraço de mineiros, não de refugiados.',
    ferida: 'Viu o Sexto encher de sobreviventes depois do desabamento e as casas decidirem que o bairro não existia para imposto.',
    desejo: 'Que o Sexto seja reconhecido, nem que seja pelo crime.',
    medo: 'Morrer antes de ter alguém para deixar o bairro.',
  },
  morador_corveira_18: {
    origem: 'Veterana de guerra sem posto, voltou a Corveira depois de dez anos de campanha e encontrou a casa da família debaixo do quarto terraço.',
    ferida: 'Voltou da guerra para descobrir que a família tinha morrido no desabamento enquanto ela lutava por uma casa que pagou em minério.',
    desejo: 'Que alguém das sete casas responda por aquilo na Colina dos Forcados, como antigamente.',
    medo: 'Esquecer o rosto da irmã.',
  },
  morador_corveira_4: {
    origem: 'Filha de Nevin Bico-Fino, criada pelas tias em Ferro Velho e no Terraço Sexto. Armeira em Corveira desde os vinte.',
    ferida: 'A mãe foi embora para Solgar quando Wyn tinha seis anos, levando a mula e o dote das tias.',
    desejo: 'Ver a mãe uma vez, como adulta, e decidir sozinha o que sente.',
    medo: 'Parecer com a mãe no que a mãe tem de pior.',
  },
  morador_aldeia_ferro_0: {
    origem: 'A mais velha das três Bico-Fino que ficaram no planalto. Manda em Ferro Velho desde os trinta, quando a anciã anterior morreu.',
    ferida: 'Estava de cama com a mãe doente, na parada da estrada, quando Nevin levou a mula e o dote. Foi quem contou às irmãs.',
    desejo: 'Que Ferro Velho deixe de ser o lixo de Corveira.',
    medo: 'Perdoar Nevin sem querer, num dia de cansaço.',
  },
  morador_vila_terraco_3: {
    origem: 'Filha do meio de Yara Bico-Fino, curandeira no Terraço Sexto. Tratou os sobreviventes do desabamento quando chegaram ao Sexto.',
    ferida: 'Costurou gente do quarto terraço durante dez dias sem dormir, e a casa Verrão mandou a conta dos panos.',
    desejo: 'Um bairro que as casas não possam fingir que não existe.',
    medo: 'Que Nevin bata na porta dela.',
  },
  morador_vila_terraco_6: {
    origem: 'Caçula das Bico-Fino do planalto, tropeira desde os dezessete. Conhece a estrada de Corveira a Solgar de olho fechado.',
    ferida: 'Era a caçula, e a mãe sempre disse que ela era parecida com Nevin.',
    desejo: 'Uma tropa própria e um nome que não seja comparado com o de ninguém.',
    medo: 'A mãe ter razão.',
  },
  morador_vila_terraco_0: {
    origem: 'Chefe do Terraço Sexto desde os quarenta. Chegou ao Sexto como sobrevivente do desabamento e ficou.',
    ferida: 'Tirou a filha dos escombros do quarto terraço com as mãos, e o apelido veio da briga de rua em que defendeu o lugar dela na fila da água.',
    desejo: 'Que o Sexto seja bairro no registro das casas.',
    medo: 'O terraço de cima.',
  },
  morador_vila_terraco_8: {
    origem: 'Filha de Zeno Meia-Orelha, tirada dos escombros do quarto terraço aos treze anos. Caçadora de peles no planalto.',
    ferida: 'Lembra do escuro e do peso, e de mais nada daquele dia.',
    desejo: 'Caçar o que ninguém mais caça no planalto.',
    medo: 'Ficar presa em lugar apertado e escuro.',
  },
  morador_vila_terraco_4: {
    origem: 'Guarda do Terraço Sexto, veio de Tessel com a leva e ficou no planalto quando a guerra acabou.',
    ferida: 'Fez a ronda do quarto terraço na semana do desabamento e não viu nada, porque não era ela quem subia na galeria.',
    desejo: 'Uma ronda inteira sem subir escada de terraço.',
    medo: 'Ouvir pedra estalar à noite.',
  },
  morador_forja_afundada_0: {
    origem: 'Mestra da Forja Afundada. Aprendeu aço solar nas fundições de Corveira, quando ainda era permitido, e desceu com a forja quando proibiram.',
    ferida: 'Perdeu a mestra que a ensinou no dia em que as casas fecharam as fundições de aço solar.',
    desejo: 'Deixar alguém capaz de forjar depois dela, antes que as casas a encontrem.',
    medo: 'O barulho de passos na escada de cima.',
  },
  morador_forja_afundada_1: {
    origem: 'Companheira de Wyn de Baixo, aprendiz da forja aos quarenta anos. Devota áspera; reza pela forja todo amanhecer.',
    ferida: 'Ficou surda e aprendeu a ler lábios para continuar ouvindo Wyn.',
    desejo: 'Morrer ao lado da bigorna, não numa cela das casas.',
    medo: 'Wyn subir sozinha à cidade.',
  },
  ferreira_do_ferro_velho: {
    origem: 'Nasceu em Ferro Velho, filha de catadora de metal. Aprendeu a forjar com restos de Corveira e virou a melhor lâmina-ferreira do planalto.',
    ferida: 'Viu a casa Verrão comprar de volta, a preço de nada, o metal que a aldeia recuperou do quarto terraço.',
    desejo: 'Uma lâmina tão boa que nenhuma casa consiga dizer que é sucata.',
    medo: 'Trabalhar para os Verrão.',
  },
  morador_corveira_17: {
    origem: 'Neta de Sela Meia-Orelha, filha de Calder. Saiu do Mercado do Peixe aos dezoito para ser pregoeira em Corveira, onde ninguém a conhecia.',
    ferida: 'Descobriu no primeiro mês que em Corveira "Meia-Orelha" é xingamento de ladra.',
    desejo: 'Subir no registro até o apelido virar título.',
    medo: 'Ler em praça o nome de alguém da família.',
  },

  // ───────────────────────────── FORA DO VALE (moradores)
  morador_acampamento_0: {
    origem: 'Mãe das quatro Bico-Fino. Tocou a parada da estrada dos Sem-Nome a vida inteira, entre foragidos e caravanas.',
    ferida: 'Adoeceu num inverno e, quando levantou, Nevin tinha ido embora com a mula e o dote das irmãs.',
    desejo: 'Que as quatro filhas estejam no enterro dela, na mesma fila.',
    medo: 'Uma caravana que chegue de Solgar com notícia.',
  },
  morador_solgar_5: {
    origem: 'Segunda filha de Yara Bico-Fino, a que fugiu. Vive em Solgar há mais de vinte anos, conhecida de todos como ladra.',
    ferida: 'Deixou a filha de seis anos com as irmãs no planalto quando fugiu, e soube pela estrada que a menina virou armeira.',
    desejo: 'Que a filha fale com ela uma vez, sem as irmãs por perto.',
    medo: 'Que a filha a trate como as irmãs tratam.',
  },
  morador_acampamento_2: {
    origem: 'Escolta de comboio desde os vinte, filha de soldada de Tessel. Conhece a Mata de Corvos de ponta a ponta.',
    ferida: 'Voltou sozinha de uma escolta na mata, e desde então as caravanas pedem outra escolta e aceitam ela só quando não têm dinheiro.',
    desejo: 'Uma escolta grande, bem paga, que chegue inteira.',
    medo: 'O nevoeiro da Mata de Corvos.',
  },
  morador_acampamento_1: {
    origem: 'Chefe de caravana entre o Acampamento dos Sem-Nome e o vale. Nasceu numa carroça e nunca teve casa de pedra.',
    ferida: 'Perdeu uma caravana inteira para o frio no Passo do Lobo, aos trinta, e só ela e duas mulas chegaram.',
    desejo: 'Uma casa de pedra, uma só, com porta que tranca.',
    medo: 'Perguntas sobre o que leva no fundo da carroça.',
  },
  morador_acampamento_3: {
    origem: 'Viajante que não diz de onde vem. Chegou ao Acampamento dos Sem-Nome há três anos pelo lado de Tessel e ficou.',
    ferida: 'Tem marcas de corrente nos tornozelos que não deixa ninguém ver.',
    desejo: 'Um lugar onde ninguém pergunte o nome antigo dela.',
    medo: 'Farda da marca.',
  },
};
