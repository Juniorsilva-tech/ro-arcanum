// ARCANUM · Segredos do elenco de Vaelhorn (sessão 47, Fase 3).
//
// Até aqui 130 dos 246 NPCs não tinham segredo, e nenhum segredo mudava nada
// ao ser descoberto. Este arquivo faz duas coisas:
//
// 1. SEGREDOS_NOVOS: um segredo para cada NPC que não tinha. Escrito sobre o
//    que já existia — família (content/vaelhorn/familias.ts), lugar
//    (Local.historia), ofício, rivalidades — para que descobrir uma pessoa
//    seja descobrir um pedaço do lugar. `comoDescobrir` é o caminho que o
//    narrador pode sugerir; a regra real de descoberta está em
//    engine/segredos.ts (confiança alta ou vigiar).
// 2. CONSEQUENCIAS: o que muda no mundo quando o segredo sai — de segredos
//    novos e de alguns antigos. Efeitos da engine (relação com outra pessoa,
//    reputação, item, flag) e, às vezes, uma missão viva de tratar, abastecer
//    ou reconstruir no assentamento da pessoa.
//
// Nada aqui vai ao narrador antes de descoberto (ver `segredoQueVoceSabe` em
// engine/llm.ts).
import type { ConsequenciaSegredo, Efeito, NPC } from '../../engine/types';

type Segredo = NonNullable<NPC['segredo']>;
const rel = (npc: string, eixo: 'disposicao' | 'confianca' | 'medo', delta: number): Efeito => ({ tipo: 'relacao', npc, eixo, delta });
const rep = (faccao: string, delta: number): Efeito => ({ tipo: 'reputacao', faccao, delta });
const item = (id: string): Efeito => ({ tipo: 'item', item: id, delta: 1 });

export const SEGREDOS_NOVOS: Record<string, Segredo> = {
  // ───────────────────────────── VALE DE HALVET
  halda: {
    conteudo: 'Na noite do selo, era Halda quem segurava a lanterna para Sarine na cripta. Viu que a porta fechada tinha outra ao lado, menor, e que essa ficou aberta. Ninguém acreditou numa mendiga, e ela parou de contar.',
    comoDescobrir: 'levar comida quente à praça três noites seguidas e perguntar pela lanterna',
  },
  torana: {
    conteudo: 'Torana sabe temperar aço solar. Aprendeu com a mãe, que forjava para os caçadores antes de Corveira proibir, e nunca contou nem a Duna. Faz uma lâmina por inverno, de noite, e a entrega na Casa Sem Nome na Névoa.',
    comoDescobrir: 'ficar na praça depois do toque de recolher, no inverno, e ver a forja acesa',
  },
  rapaz_da_leva: {
    conteudo: 'Ivo não fugiu da leva: foi dispensado. Brila Ost vendeu a dispensa à avó dele por dois anos de grão, e Ivo guarda o recibo com o sinete da sargenta costurado no cano da bota.',
    comoDescobrir: 'dividir com ele uma noite de vigia e não perguntar nada até o amanhecer',
  },
  morador_mercado_0: {
    conteudo: 'Yara assina como senhora da feira, mas quem tem as chaves do celeiro coberto é a prima Sete-Dedos, desde o enterro da avó. Foi o preço do empréstimo que salvou a feira no inverno em que a ponte caiu.',
    comoDescobrir: 'reparar em quem abre o celeiro de madrugada',
  },
  morador_mercado_1: {
    conteudo: 'Zeno de Baixo deve a vida à Yara Sete-Dedos, que a tirou de uma briga de faca na rua de baixo quando ela era recruta. Desde então a capitã não revista carga que venha da Sete-Dedos.',
    comoDescobrir: 'perguntar pela cicatriz do antebraço a quem serviu com ela',
  },
  morador_mercado_2: {
    conteudo: 'Urda arrancou do livro da guilda a página com o nome de Zeno no dia em que a filha entrou para a guarda, e guarda a folha dobrada dentro da caixa de pesos.',
    comoDescobrir: 'pedir para conferir os pesos da guilda e mexer na caixa quando ela se distrair',
  },
  morador_mercado_3: {
    conteudo: 'Ulla faz duas contas: a da loja e a das dívidas entre a mãe e a irmã. O caderno diz que Urda deve a Zeno mais do que Zeno a Urda, e nenhuma das duas sabe.',
    comoDescobrir: 'ajudar a fechar o caixa num dia de feira cheia',
  },
  morador_mercado_4: {
    conteudo: 'Elna leva as lâminas da mãe para a tia Torana temperar de novo, à noite, porque a têmpera de Duna racha no frio. Duna vende essas lâminas como suas e não sabe.',
    comoDescobrir: 'seguir a armeira depois que a praça esvazia',
  },
  morador_mercado_5: {
    conteudo: 'Torv costurou Dorn tantas vezes que sabe quais lutas da arena foram compradas: as cicatrizes das lutas vendidas são rasas e retas, de lâmina que sabia onde parar.',
    comoDescobrir: 'ser costurado por ela depois de uma luta e perguntar se a sua foi de verdade',
  },
  morador_mercado_6: {
    conteudo: 'Greta guarda no barril vazio do fundo o livro de apostas da mãe, e já raspou dele duas dívidas de gente que ela quis salvar. A Sete-Dedos ainda não conferiu.',
    comoDescobrir: 'ficar para fechar a taverna e oferecer ajuda com os barris',
  },
  morador_mercado_7: {
    conteudo: 'Lira registra os nascimentos da feira e já inventou três meninas para esconder três meninos da Leva. Os meninos estão em Juncal de Baixo, com gente que não pergunta.',
    comoDescobrir: 'conferir o registro de nascimentos e contar quantas meninas nasceram no mesmo inverno',
  },
  morador_mercado_8: {
    conteudo: 'Dorn não é surda. Finge desde a primeira luta, porque quem acha que ela não ouve fala perto dela — e é assim que ela sabe em quem apostar.',
    comoDescobrir: 'dizer uma coisa baixa demais pelas costas dela e ver se ela vira',
  },
  morador_mercado_9: {
    conteudo: 'A Sete-Dedos perdeu os três dedos pagando uma dívida da prima: foi a Yara de cima quem pegou o dinheiro. Nunca cobrou nada além das chaves do celeiro, e isso ela não devolve.',
    comoDescobrir: 'perguntar pelos dedos a quem bebe com ela, não a ela',
  },

  // ───────────────────────────── FORA DO VALE
  morador_acampamento_0: {
    conteudo: 'Yara Bico-Fino escreve toda semana só para Nevin, a filha ladra, e nunca manda as cartas. Estão todas numa arca debaixo do balcão da parada, com o dote das irmãs devolvido moeda por moeda dentro.',
    comoDescobrir: 'dormir na parada e ouvir a velha contar moeda de madrugada',
  },
  morador_acampamento_1: {
    conteudo: 'Gilda leva escondida, em cada caravana, uma carta de Ruvela para alguém da guarda do vale. Não sabe para quem, nem abre; recebe o dobro por não abrir.',
    comoDescobrir: 'revistar a carga dela com a permissão dela, e reparar no fundo falso',
  },
  morador_acampamento_2: {
    conteudo: 'Brida escoltou a caravana que sumiu na Mata de Corvos e voltou sozinha, sem um arranhão. Disse que se perdeu no nevoeiro. Recebeu metade do pagamento de alguém que nunca contratou escolta.',
    comoDescobrir: 'perguntar pela caravana desaparecida na frente de Gilda e ver quem desvia o olho',
  },
  morador_acampamento_3: {
    conteudo: 'Ivo a Magra não diz de onde vem porque vem do Forte Agulha: cumpria pena na guarnição de condenados e saiu na segunda queda, pelo portão que alguém abriu por dentro. Se voltar à marca, é forca.',
    comoDescobrir: 'falar do Forte Agulha perto dela e ver a mão ir ao pescoço',
  },

  // ───────────────────────────── MARCA DE TESSEL
  morador_tessel_2: {
    conteudo: 'Wenna de Baixo deve à agiota Quilda porque pagou em segredo a dispensa da filha da vizinha. A vizinha é Ketta Pé-de-Ferro, que pensa ter escapado da leva por sorte.',
    comoDescobrir: 'ver a mestra de guilda pagar à agiota no beco, sempre no mesmo dia do mês',
  },
  morador_tessel_3: {
    conteudo: 'Greta Pé-de-Ferro vende na loja, por baixo do balcão, as ferraduras que a mãe faz com o ferro que a tia desvia da guarnição. Reza toda noite pelo perdão de um crime que não chama de crime.',
    comoDescobrir: 'pedir ferradura boa e barata demais e perguntar por que é tão barata',
  },
  morador_tessel_4: {
    conteudo: 'Nevin compra ferro de contrabando de Ferran Mão-Curta e sabe que é o mesmo ferro que a irmã Vana desvia da guarnição. Paga à contrabandista para a irmã nunca descobrir que as duas estão no mesmo esquema.',
    comoDescobrir: 'conferir a marca de fundição num lingote da armeira da cidade',
  },
  morador_tessel_8: {
    conteudo: 'Bela, campeã de arena aos cinquenta e sete, não perde uma luta há onze anos porque a escrivã Ketta Varn escolhe os adversários dela. Em troca, Bela leva recados para quem Ketta não pode ser vista visitando.',
    comoDescobrir: 'apostar contra ela e perguntar quem marcou a luta',
  },
  morador_tessel_10: {
    conteudo: 'Zeno bate carteira na praça de Tessel para pagar o remédio de Ansel, a cocheira que a criou. Nunca rouba de quem usa a insígnia da guarda, porque Ansel pediu.',
    comoDescobrir: 'deixar a bolsa à vista na praça e segui-la até a botica',
  },
  morador_tessel_11: {
    conteudo: 'Quilda empresta a juros para a cidade inteira com dinheiro que não é dela: é da capitã Roan, que financia a agiota para saber quem deve a quem em Tessel.',
    comoDescobrir: 'pedir um empréstimo grande demais e ver a quem ela vai perguntar',
  },
  morador_tessel_12: {
    conteudo: 'Maud a Magra carrega no cais de Tessel o grão que a marca diz ter mandado para o Forte Agulha. Metade dos sacos volta para a cidade pela porta dos fundos do celeiro.',
    comoDescobrir: 'contar os sacos que entram e os que saem num dia de carga',
    consequencia: {
      texto: 'Maud lhe mostrou os sacos que voltam do forte para o celeiro de Tessel. Alguém precisa fazer esse grão chegar a quem passa fome.',
      missao: 'abastecer',
    },
  },
  morador_tessel_16: {
    conteudo: 'Ansel, a cocheira, criou Zeno batedora de carteira desde menina e sabe de onde vem o dinheiro do remédio. Toma assim mesmo e reza pela menina na Capela dos Ceifeiros.',
    comoDescobrir: 'acompanhá-la numa viagem longa e falar da menina',
  },
  morador_tessel_17: {
    conteudo: 'Dorn Varn lê os editos da mãe na praça e copia cada um à noite, com a letra da tia. Está juntando prova de que a marechala assina o que a escrivã escreve.',
    comoDescobrir: 'ver a luz acesa na janela da pregoeira depois da meia-noite',
  },
  morador_tessel_18: {
    conteudo: 'Cera Ost sabe que Brila tira nomes da lista da leva, e sabe que um dos nomes tirados foi o de uma criança de Pedravel que a própria Cera denunciou. Nunca teve coragem de perguntar se foi por isso.',
    comoDescobrir: 'perguntar pelo filho dela na frente da Capela dos Ceifeiros',
  },
  morador_forte_agulha_1: {
    conteudo: 'Na segunda queda do forte, Davet abriu o portão por dentro. Não foi traição: a irmã tinha racionado a última farinha para os feridos e ela escolheu entregar o forte a ver a guarnição comer os mortos.',
    comoDescobrir: 'estar de guarda com ela numa noite de inverno e falar de fome',
    consequencia: {
      texto: 'Davet contou do portão aberto por dentro. A comandante desconfia dela há anos, e agora você sabe por quê.',
      efeitos: [rel('morador_forte_agulha_1', 'confianca', 3), rel('morador_forte_agulha_0', 'medo', 2)],
    },
  },
  morador_forte_agulha_3: {
    conteudo: 'Loris se alistou no forte com o nome de uma prima morta, porque a mãe, capitã da guarda de Tessel, teria impedido. A comandante do posto descobriu e a protege por dívida antiga com Roan.',
    comoDescobrir: 'chamá-la pelo nome verdadeiro no meio do pátio',
  },
  morador_vila_pedravel_1: {
    conteudo: 'Roan a Magra fundiu as dobradiças do portão do forte que sumiram no segundo inverno do roubo da pedra. As dobradiças viraram as foices da vila.',
    comoDescobrir: 'olhar a marca de fundição de uma foice de Pedravel',
  },
  morador_vila_pedravel_3: {
    conteudo: 'Yara a Calada tratou o menino que voltou da leva antes de Ivo, e ele morreu na maca dela. Ela enterrou o rapaz como forasteiro para a vila não ter de explicar por que ele voltou.',
    comoDescobrir: 'perguntar pela cova sem nome atrás da casa da curandeira',
  },
  morador_vila_pedravel_4: {
    conteudo: 'Ketta da Ponte, a guarda da vila, é quem avisa a anciã quando os fiscais da marca saem de Tessel. Recebe em grão, e o grão sai do celeiro que ela deveria vigiar.',
    comoDescobrir: 'vigiar a estrada de Tessel e ver quem corre para a vila antes dos fiscais',
  },
  morador_vila_pedravel_5: {
    conteudo: 'Ansel a Magra roubou da própria vila o livro onde a anciã anota a pedra levada do forte, página por página, e o esconde para ter com que negociar se um dia for presa.',
    comoDescobrir: 'pegá-la sozinha e dizer que a anciã sabe',
    consequencia: {
      texto: 'Ansel lhe entregou uma página arrancada do livro da anciã: a conta da pedra do forte, com a letra de Mora Quelha.',
      efeitos: [item('livro_caixa'), rel('ancia_pedravel', 'medo', 3)],
    },
  },
  morador_vila_pedravel_6: {
    conteudo: 'Jarek a Velha leva nas mulas, escondidos no feno, os rapazes da vila que a anciã manda para o Juncal antes do alistamento. Cobra por cabeça e já cobrou de quem não podia.',
    comoDescobrir: 'desfazer um fardo de feno das mulas dela na estrada',
  },
  morador_vila_pedravel_7: {
    conteudo: 'Rhea mói no moinho, junto com o trigo, a pedra que sobrou do celeiro. O pó branco vai para a farinha da vila e ninguém repara, porque a vila inteira come pão ruim há anos.',
    comoDescobrir: 'morder o pão de Pedravel e sentir areia',
    consequencia: {
      texto: 'A farinha de Pedravel tem pó de pedra. Metade da vila anda com dor de barriga e acha que é o inverno.',
      missao: 'tratar',
    },
  },
  morador_vila_pedravel_8: {
    conteudo: 'Perin a Manca não é manca de nascença: caiu de um muro do forte carregando pedra na terceira noite do roubo. A vila paga as peles dela mais caro desde então, e ela sabe por quê.',
    comoDescobrir: 'perguntar pela perna a quem é de fora da vila',
  },

  // ───────────────────────────── PLANALTO DE CORVEIRA
  morador_corveira_1: {
    conteudo: 'Halvo a Nova, capitã da guarda de Corveira, sobreviveu ao desabamento do quarto terraço porque tinha saído da galeria para beber. Os onze da turma dela morreram, e ela ganhou o posto no enterro.',
    comoDescobrir: 'beber com ela no aniversário do desabamento',
  },
  morador_corveira_3: {
    conteudo: 'Aldric da Ponte compra das casas, por quase nada, as indenizações em minério que as famílias do desabamento receberam e não conseguiram vender. Ficou rica com o luto dos outros e ainda chama isso de ajuda.',
    comoDescobrir: 'perguntar de onde vem o minério que ela vende a preço de moeda',
  },
  morador_corveira_4: {
    conteudo: 'Wyn Bico-Fino sabe que a mãe é ladra em Solgar: recebe, todo inverno, uma bolsa de moedas sem bilhete, com o nó que só Nevin faz. Guarda todas sem gastar nenhuma.',
    comoDescobrir: 'reparar no nó da bolsa que ela carrega no cinto',
    consequencia: {
      texto: 'Wyn lhe contou das bolsas de inverno. Se você for a Solgar, ela quer que Nevin saiba que a filha nunca gastou uma moeda.',
      efeitos: [rel('morador_corveira_4', 'confianca', 3), rel('morador_solgar_5', 'disposicao', 3)],
    },
  },
  morador_corveira_5: {
    conteudo: 'Jarek, a curandeira, sabe que a mãe não treme de bebida: treme de medo. Achou o forro do casaco de Sibel descosturado e recosturado muitas vezes, e nunca teve coragem de abrir.',
    comoDescobrir: 'tratar as mãos da perita com ela presente e falar do casaco',
  },
  morador_corveira_8: {
    conteudo: 'Veski, campeã de arena, luta em Corveira pelas cores de uma das sete casas e perde de propósito sempre que a casa rival aposta alto. Metade do que ganha perdendo vai para as viúvas do desabamento.',
    comoDescobrir: 'apostar na rival e perguntar a ela, depois, se doeu',
  },
  morador_corveira_10: {
    conteudo: 'Elna a Manca bate carteira só dos escrivães das casas. Não quer as moedas: quer os papéis, e vende à mendiga Quilda Boca-Seca os que falam do desabamento.',
    comoDescobrir: 'deixar um documento das casas à vista e ver quem some com ele',
  },
  morador_corveira_12: {
    conteudo: 'Hedra a Gorda carrega no cais do Sexto os sacos de minério da indenização que a mãe agiota tomou das famílias. Anota cada saco num pano escondido, para um dia devolver.',
    comoDescobrir: 'ajudar a carregar e reparar no pano com riscos',
  },
  morador_corveira_15: {
    conteudo: 'Lira a Surda vende na botica de fundos o pó que a ervanária do vale leva à capela. Não sabe para que serve; sabe que o pagamento chega em prata cunhada pela Igreja.',
    comoDescobrir: 'comprar o mesmo pó e dizer o nome de Mira',
  },
  morador_corveira_16: {
    conteudo: 'Eda a Torta, a cocheira, levou a perita e o relatório do desabamento até a casa Verrão na noite em que o papel foi queimado na lareira. Viu a perita sair de mãos vazias e com o casaco fechado demais, e continua levando a família Verrão aonde ela quiser.',
    comoDescobrir: 'alugar a carroça dela até o Poço Fundo e perguntar pela noite do laudo',
  },
  morador_corveira_17: {
    conteudo: 'Nolan Meia-Orelha lê em Corveira os editos das casas, e já leu duas vezes a sentença de uma ladra com o mesmo apelido dela. Nas duas, trocou uma palavra para a pena ser menor.',
    comoDescobrir: 'comparar o edito lido com o edito afixado',
  },
  morador_aldeia_ferro_1: {
    conteudo: 'Jorna achou, numa carroça caída da estrada, um caçador morto com a bainha vazia. Enterrou o corpo no canto do campo e não contou a ninguém — nem a Tança, que desde aquele mês reconstrói uma lâmina de caçador sem dizer para quem.',
    comoDescobrir: 'ajudar a lavrar o canto do campo onde ela não deixa ninguém cavar',
  },
  morador_aldeia_ferro_4: {
    conteudo: 'Pell a Manca dorme fora com as cabras porque em casa ouve a aldeia inteira contar o metal recuperado. Sabe que metade do metal que volta para Corveira é das covas do desabamento.',
    comoDescobrir: 'dormir no pasto com ela e perguntar de onde vem o metal',
  },
  morador_vila_terraco_1: {
    conteudo: 'Hedra a Magra forja, aos vinte e um, as dobradiças dos portões do Sexto com ferro que não existe no livro de nenhuma casa. Deve à taverneira porque é a taverneira quem traz o ferro.',
    comoDescobrir: 'perguntar pela procedência do ferro de uma dobradiça nova',
  },
  morador_vila_terraco_4: {
    conteudo: 'Bran Boca-Seca, guarda do Sexto, sabe que o terraço de cima tem a mesma rachadura que o quarto tinha antes de cair. Relatou às casas duas vezes; nas duas, o relatório voltou com o selo de "bairro inexistente".',
    comoDescobrir: 'subir com ela ao terraço de cima numa ronda de madrugada',
    consequencia: {
      texto: 'Bran lhe mostrou a rachadura do terraço de cima. Se as casas não escoram, o Sexto precisa escorar sozinho.',
      missao: 'reconstruir',
    },
  },
  morador_vila_terraco_6: {
    conteudo: 'Gilda Bico-Fino leva nas mulas, para Solgar, cartas da irmã curandeira para Nevin, sem a irmã saber. Troca as cartas no caminho por outras que ela mesma escreve, mais duras.',
    comoDescobrir: 'ler uma das cartas antes de ela sair com as mulas',
  },
  morador_vila_terraco_7: {
    conteudo: 'Ondra da Ponte moeu farinha para os sobreviventes do quarto terraço de graça durante um ano inteiro. Parou quando descobriu que a casa Verrão cobrava das famílias pela farinha que ela doava.',
    comoDescobrir: 'perguntar por que a moleira não vende para a casa Verrão',
  },
  morador_vila_terraco_8: {
    conteudo: 'Pell a Gorda caça no Planalto uma coisa que não é bicho: segue o rastro do que sai da galeria funda do Poço Fundo em noite sem lua. Já viu duas vezes e nunca contou à mãe.',
    comoDescobrir: 'acompanhá-la numa caçada de noite sem lua',
  },
  morador_forja_afundada_1: {
    conteudo: 'Ysolt não ficou surda na bigorna: ficou surda na explosão da fundição alta de Corveira, no dia em que tentaram forjar aço solar lá em cima. Era a mestra de Wyn, e aceitou virar aprendiz para ninguém procurar a mestra que morreu.',
    comoDescobrir: 'falar das fundições de Corveira perto dela e ver se ela lê seus lábios',
  },

  // ───────────────────────────── COSTA DE MAREU
  morador_mareu_2: {
    conteudo: 'Maud, mestra da guilda do sal, sabe que o conselho de Mareu vota o que a guilda escreve na véspera. Ela escreve. A senhora da cidade só assina.',
    comoDescobrir: 'estar na casa da guilda na véspera de uma sessão do conselho',
  },
  morador_mareu_3: {
    conteudo: 'Calder a Magra não se chama Calder. Chegou de Rede Rota fugida da cobrança da guilda e tomou o nome da senhora da cidade, porque ninguém em Mareu cobra dívida de alguém com esse nome. A senhora sabe e deixa, porque a lojista sabe o que ela fez na peste.',
    comoDescobrir: 'chamar a lojista pelo nome de Rede Rota que a velha da aldeia usa',
  },
  morador_mareu_4: {
    conteudo: 'Torv, a armeira de vinte e dois anos, forja pontas de arpão para o contrabando da Baía dos Naufrágios com o molde que Kelda Cais jogou fora. Deve à batedora de carteira porque foi ela quem achou o molde.',
    comoDescobrir: 'mostrar um arpão da baía e perguntar quem fez a ponta',
  },
  morador_mareu_5: {
    conteudo: 'Davet a Manca tratou em segredo, no ano passado, três marinheiros com a febre que veio pelo porto. Não denunciou o navio porque o navio era da guilda, e a quarentena teria parado o sal por um mês.',
    comoDescobrir: 'perguntar pela febre do cais a quem ela curou',
    consequencia: {
      texto: 'Davet contou da febre escondida no cais. Os marinheiros tratados voltaram ao mar, mas a febre ficou nos cortiços do porto.',
      missao: 'tratar',
    },
  },
  morador_mareu_6: {
    conteudo: 'Davet a Calada serve na taverna do cais as bebidas que a contrabandista Brida do Norte traz sem imposto, e anota num quadro atrás do balcão quem da guarda bebe de graça.',
    comoDescobrir: 'pedir a bebida mais cara da casa e perguntar por que é tão barata',
  },
  morador_mareu_8: {
    conteudo: 'Bran a Manca, campeã de arena, deve dinheiro à mendiga Halvo da Ponte, que a sustentou quando ela perdeu a perna boa numa luta arranjada. A mendiga sabe quem arranjou.',
    comoDescobrir: 'pagar a dívida dela à mendiga e perguntar pela luta',
  },
  morador_mareu_10: {
    conteudo: 'Sela Meia-Orelha não rouba por fome desde que as filhas cresceram. Rouba os livros de registro dos escrivães, um por mês, procurando a página da própria sentença para arrancar.',
    comoDescobrir: 'deixar um livro de registro ao alcance dela e ver o que ela procura',
    consequencia: {
      texto: 'Sela lhe mostrou o que procura: a página da sentença. Se você a encontrar no registro de Mareu, as filhas perdem o apelido.',
      efeitos: [rel('morador_mareu_10', 'confianca', 4), rel('morador_mareu_17', 'disposicao', 2)],
    },
  },
  morador_mareu_12: {
    conteudo: 'Fenn do Norte já abriu a porta do depósito da mãe. Lá dentro há sal com o selo do Porto do Sal que nunca passou pela alfândega, e um livro com o nome de metade da guarda.',
    comoDescobrir: 'trabalhar no cais ao lado dela e falar da mãe',
    consequencia: {
      texto: 'Fenn lhe deu uma chave do depósito da mãe. O livro de propinas de Brida do Norte está lá dentro.',
      efeitos: [item('chave_enferrujada'), rel('morador_mareu_19', 'medo', 3)],
    },
  },
  morador_mareu_14: {
    conteudo: 'Davet Olho-Vivo emprestou o dinheiro da primeira banca do Mercado do Peixe às primas e tem o papel assinado pela mãe delas. Pelo papel, metade do mercado é da estalagem de fora da muralha.',
    comoDescobrir: 'ganhar a confiança dela numa festa e falar da primeira banca',
  },
  morador_mareu_15: {
    conteudo: 'Perin, a boticária de fundos, prepara para a senhora da cidade um sonífero que a senhora não toma: vai para o chá da escrivã Sabra, que fala dormindo sobre o que a guilda escreve na véspera do conselho.',
    comoDescobrir: 'comprar o mesmo sonífero e perguntar para quem ela costuma vender',
  },
  morador_mareu_16: {
    conteudo: 'Sela a Ruiva leva de carroça, de madrugada, o sal sem selo do depósito de Brida até a Trilha Costeira. Não é contrabandista: faz isso pela campeã Bran, que deve a Brida e não tem outro jeito de pagar.',
    comoDescobrir: 'alugar a carroça dela para a madrugada e ver se está livre',
  },
  morador_mareu_17: {
    conteudo: 'Kalen Meia-Orelha leu em praça, aos vinte anos, a sentença da própria mãe por um segundo roubo que Sela não cometeu. Sabe quem cometeu e leu assim mesmo, para não perder o posto.',
    comoDescobrir: 'perguntar a ela pelo segundo roubo, não pelo primeiro',
  },
  morador_porto_sal_3: {
    conteudo: 'Halvo, a lojista do Porto do Sal, compra das salinas o sal refugado e o revende com o selo do porto que a escrivã Corin carimba sem ver. As duas dividem o lucro e a culpa.',
    comoDescobrir: 'comparar o sal da loja com o sal da salina',
  },
  morador_porto_sal_4: {
    conteudo: 'Roan a Velha empresta dinheiro à própria mãe, senhora do porto, com o que ganha vendendo lâminas a Aldric a Gorda. A cidade foi salva no inverno ruim com dinheiro do crime, e só as duas sabem.',
    comoDescobrir: 'ver a armeira entrar na casa da senhora pela porta de serviço',
  },
  morador_porto_sal_7: {
    conteudo: 'Corin Pé-de-Ferro carimba o selo do porto em sal refugado, e guarda cópia de cada carimbo errado num caderno. Diz que é para se proteger; é para cobrar.',
    comoDescobrir: 'pedir um carimbo com pressa e ver onde ela anota',
  },
  morador_porto_sal_8: {
    conteudo: 'Urda, campeã de arena aos sessenta e um, foi condenada às salinas na juventude por matar um capataz. Fugiu, voltou com outro nome e hoje luta nas festas da guilda que a condenou.',
    comoDescobrir: 'perguntar pelas marcas nos pulsos dela',
  },
  morador_aldeia_rede_0: {
    conteudo: 'Greta Mão-Curta sabe por que ninguém pesca no ponto da enseada: foi ali que a aldeia afundou, amarrado, o coletor da guilda que veio cobrar à força, trinta anos atrás.',
    comoDescobrir: 'perguntar pelo ponto proibido quando ela já tiver bebido',
  },
  morador_aldeia_rede_1: {
    conteudo: 'Cera Sete-Dedos deve à guilda de Mareu uma dívida que a aldeia não paga, e paga escondida, em peixe salgado, para a guilda não mandar outro coletor. A filha descobriu e paga a outra metade.',
    comoDescobrir: 'estar na trilha quando o peixe salgado sai de madrugada',
  },
  morador_aldeia_rede_2: {
    conteudo: 'Ferran da Ponte benzeu a rede de Quim Vares na noite em que a rede trouxe a caixa com selo do porto. Sabe onde está enterrada e tem medo de benzer outra coisa daquele barco.',
    comoDescobrir: 'pedir que ela benza o barco de Quim na sua frente',
  },
  morador_aldeia_rede_4: {
    conteudo: 'Yara a Surda junta, nas noites que dorme fora, moedas da pesca escondida que vende em Mareu. Metade vai para a dívida da mãe com a guilda; a outra metade é para ir embora num navio.',
    comoDescobrir: 'seguir a pastora na noite em que ela não volta com as cabras',
  },
  morador_mercado_peixe_0: {
    conteudo: 'Ansel Olho-Vivo nunca pagou a prima Davet pela primeira banca. Diz que pagou em peixe; o papel assinado pela mãe diz outra coisa, e está com a prima.',
    comoDescobrir: 'falar da primeira banca na frente das duas primas',
  },
  morador_mercado_peixe_1: {
    conteudo: 'Nolan a Calada paga, com o soldo da guarda, parte da dívida da filha campeã com a senhora do mercado. A dívida é de luta perdida de propósito, e a senhora sabe disso.',
    comoDescobrir: 'ver a capitã entrar na casa da senhora no dia de pagamento',
  },
  morador_mercado_peixe_2: {
    conteudo: 'Vidar Olho-Vivo tem medo de Ivo Pé-de-Ferro porque a escrivã guarda o registro original do galpão: a bancada que deu origem à guilda do sal era de uma família que as Olho-Vivo expulsaram.',
    comoDescobrir: 'pedir para ver o registro antigo do galpão com a mestra presente',
  },
  morador_mercado_peixe_3: {
    conteudo: 'Orla Sete-Dedos pesa o peixe com pedras escondidas na balança, e a lojista rival Calder Meia-Orelha sabe porque forjou os pesos. As duas se odeiam em público e dividem o lucro.',
    comoDescobrir: 'pesar a mesma cesta nas duas balanças',
  },
  morador_mercado_peixe_4: {
    conteudo: 'Calder Meia-Orelha forjou os pesos viciados da lojista Orla Sete-Dedos para pagar a dívida da filha Nolan com um escrivão de Corveira. A filha não sabe o que a mãe fez pelo posto de pregoeira.',
    comoDescobrir: 'mostrar um peso viciado e perguntar quem funde peso no galpão',
  },
  morador_mercado_peixe_8: {
    conteudo: 'Ondra a Torta perde de propósito uma luta em cada três. A senhora do mercado aposta contra ela e desconta da dívida; a mãe paga o resto sem saber que a filha já está quitando.',
    comoDescobrir: 'perguntar a ela qual luta vai perder na semana',
  },

  // ───────────────────────────── BOSQUE DE VINTRA
  morador_vintra_0: {
    conteudo: 'Torv a Torta sabe por que Vintra foi reconstruída duas vezes no mesmo lugar: debaixo da praça há uma entrada para a Clareira das Pedras, e a assembleia jurou nunca deixar ninguém construir por cima.',
    comoDescobrir: 'ir à assembleia e perguntar por que não mudaram a vila de lugar',
  },
  morador_vintra_1: {
    conteudo: 'Elna a Velha forjou a trava que fecha a entrada debaixo da praça de Vintra. É a única cópia da chave, e ela a usa pendurada no pescoço, junto com o dente da irmã Ferna.',
    comoDescobrir: 'perguntar pelo que ela carrega no pescoço',
  },
  morador_vintra_3: {
    conteudo: 'Ilsa Boca-Seca, a curandeira de Vintra, tratou a guarda Elna da Ponte de uma mordida que não era de lobo. Registrou como cão. Desde então Elna não ronda o Passo do Lobo.',
    comoDescobrir: 'pedir para ver o registro de mordidas da curandeira',
  },
  morador_vintra_4: {
    conteudo: 'Elna da Ponte quer prender Veski a Torta porque Veski viu o que a mordeu no bosque e ameaçou contar. A ladra não quer dinheiro: quer que a guarda pare de rondar a casa da chefe.',
    comoDescobrir: 'ver a guarda recuar na frente da ladra e perguntar por quê',
  },
  morador_vintra_5: {
    conteudo: 'Veski a Torta rouba de quem pode pagar e devolve o troco — e devolve de verdade, numa caixa na porta da assembleia, com o nome de quem foi roubado. A mãe sabe e guarda a caixa.',
    comoDescobrir: 'ser roubado por ela e procurar a caixa na manhã seguinte',
    consequencia: {
      texto: 'Veski lhe devolveu o que tirou, e mais uma moeda antiga "pelo incômodo". Na assembleia de Vintra, a chefe passa a olhar você como alguém de casa.',
      efeitos: [item('moeda_antiga'), rel('morador_vintra_0', 'disposicao', 3)],
    },
  },
  morador_vintra_6: {
    conteudo: 'Sela a Gorda, a tropeira, levou para Corveira o carvão que a Carvoeira diz ter queimado no incêndio do ano passado. O incêndio não queimou carvão nenhum: queimou o livro da dívida com a fundição.',
    comoDescobrir: 'conferir as marcas de carvão que chegam à fundição',
  },
  morador_vintra_7: {
    conteudo: 'Hedra a Calada mói de noite, no moinho de Vintra, o grão que os moradores escondem da assembleia para não pagar a multa de quem falta. Fala de tudo, menos disso.',
    comoDescobrir: 'vigiar o moinho numa noite sem vento',
  },
  morador_vintra_8: {
    conteudo: 'Sela a Surda, a caçadora de peles, sabe que o que come no Passo do Lobo tem hora: só atravessa quem passa antes da terceira hora da noite. Vende a informação a caravaneiros pelo preço de uma pele.',
    comoDescobrir: 'comprar peles dela e perguntar pelo passo',
    consequencia: {
      texto: 'Sela lhe ensinou a hora do Passo do Lobo. As rotas do passo ficam menos perigosas para você; a guardiã do bosque também sabe que você sabe.',
      efeitos: [{ tipo: 'flag', chave: 'sabe.hora_do_passo', valor: true }, rel('guarda_do_bosque', 'confianca', 2)],
    },
  },
  morador_aldeia_carvoeira_0: {
    conteudo: 'Tavro, a anciã da Carvoeira, esconde na casa uma menina que apareceu na borda da mata sem saber o próprio nome. A menina não come de dia, e Tavro diz a todos que é sobrinha doente.',
    comoDescobrir: 'visitar a casa da anciã ao entardecer',
  },
  morador_aldeia_carvoeira_1: {
    conteudo: 'Greta Sete-Dedos perdeu os dedos na queimada do carvão e diz que foi acidente. Foi a benzedeira Tavro do Norte quem a empurrou, numa briga por um homem de fora que foi embora antes de as duas se reconciliarem.',
    comoDescobrir: 'perguntar pela queimada na frente das duas',
  },
  morador_aldeia_carvoeira_2: {
    conteudo: 'Tavro do Norte benze a lenha que vai para a forja do vale com sal de Mareu e sangue da própria mão. Diz que é para o ferro não pegar o que vem da mata. As ferreiras do vale pagam por isso sem saber.',
    comoDescobrir: 'olhar a palma da mão da benzedeira',
  },
  morador_aldeia_carvoeira_4: {
    conteudo: 'Wyn a Ruiva sabe onde a filha passa os dias em que some: na Clareira das Pedras, onde a menina encontrou alguém que fala com ela. Wyn foi atrás uma vez e voltou com a mecha branca que a filha também tem.',
    comoDescobrir: 'perguntar pela mecha branca da mãe, não da filha',
  },
  morador_aldeia_lenha_1: {
    conteudo: 'Aldric Mão-Curta cortou, no inverno em que algo entrou três noites em Lenha Alta, a corda da escada da vizinha para o que estava lá fora não subir. A vizinha estava do lado de fora.',
    comoDescobrir: 'perguntar pela terceira noite a quem mora na casa mais baixa',
  },
  morador_aldeia_lenha_3: {
    conteudo: 'Tavro a Gorda some por dias porque leva até Carvoeira a lenha que a benzedeira Veski Boca-Seca risca com carvão. Nunca perguntou o que o risco significa, e a lenha riscada nunca queima.',
    comoDescobrir: 'seguir o fardo de lenha com o risco de carvão',
  },
  morador_aldeia_lenha_4: {
    conteudo: 'Veski Pé-de-Ferro deve à anciã Kalen a vida da filha, que a anciã tirou de dentro do que entrou na aldeia naquele inverno. A filha nunca mais falou, e Veski paga a dívida pastoreando sem receber.',
    comoDescobrir: 'perguntar pela filha dela a quem mora em Lenha Alta',
  },

  // ───────────────────────────── ERMO DE SOLGAR
  morador_solgar_1: {
    conteudo: 'Ysolt Boca-Seca forja em Solgar as trancas da cisterna, e fez uma segunda chave que ninguém pediu. Guarda para o dia em que a vila fechar a água para alguém que ela ame.',
    comoDescobrir: 'perguntar a ela quantas chaves a tranca da cisterna tem',
    consequencia: {
      texto: 'Ysolt lhe mostrou a segunda chave da cisterna de Solgar. Não entregou, mas agora você sabe onde está e ela sabe que você sabe.',
      efeitos: [rel('morador_solgar_1', 'confianca', 2), rel('morador_solgar_0', 'medo', 2)],
    },
  },
  morador_solgar_2: {
    conteudo: 'Zeno a Torta, taverneira de Solgar, serve água da cisterna diluída no vinho e cobra como vinho. A chefe da vila sabe e recebe a diferença, porque o imposto da água não fecha a conta.',
    comoDescobrir: 'pedir água na taverna e depois pedir vinho',
  },
  morador_solgar_3: {
    conteudo: 'Pell Sete-Dedos tratou os feridos das três tentativas de tomar a cisterna. Dos dois lados. Os mortos do lado de fora foram enterrados na Ruína de Areia, e ela é a única que sabe onde.',
    comoDescobrir: 'perguntar pela terceira tentativa, não pela primeira',
  },
  morador_solgar_4: {
    conteudo: 'Ansel a Velha, guarda de Solgar, desconfia da ladra Nevin porque a viu entrar na casa da cisterna de madrugada e sair sem nada. Não sabe que Nevin estava devolvendo o que Gilda Bico-Fino tinha roubado.',
    comoDescobrir: 'fazer a ronda da madrugada com ela',
  },
  morador_solgar_6: {
    conteudo: 'Jorna do Norte, tropeira, trouxe para Solgar a mula e o dote das irmãs Bico-Fino que Nevin roubou. Soube depois de quem eram e nunca contou às irmãs de Corveira que Nevin tentou comprar tudo de volta.',
    comoDescobrir: 'perguntar pela mula mais velha do estábulo dela',
  },
  morador_solgar_7: {
    conteudo: 'Eda a Ruiva mói em Solgar grão que vem do Poço Seco, de gente que não pode entrar na vila. Paga menos da metade e vende como grão de Solgar.',
    comoDescobrir: 'olhar os sacos de grão que chegam de madrugada pelo lado do ermo',
  },
  morador_solgar_8: {
    conteudo: 'Lira da Ponte caça peles para pagar uma dívida com a ladra Nevin, que lhe emprestou para comprar água nos dias em que a mãe fechou a cisterna para ela. Não sabe que a mãe paga a Nevin por baixo.',
    comoDescobrir: 'perguntar à ladra quem paga a dívida da caçadora',
    consequencia: {
      texto: 'Lira soube que a mãe paga a dívida dela escondida. Entre a chefe de Solgar e a filha, alguma coisa cede.',
      efeitos: [rel('morador_solgar_0', 'disposicao', 3), rel('morador_solgar_8', 'confianca', 2)],
    },
  },
  morador_poco_seco_0: {
    conteudo: 'Ferran a Gorda, a anciã do Poço Seco, sabe que os poços da aldeia não secaram sozinhos: viu Ura Seca descer em cada um com um saco de sal, na mesma semana. O único que ficou foi o que Ura guarda, e foi Ura quem guiou a aldeia até Solgar.',
    comoDescobrir: 'perguntar pela véspera da seca a quem ficou por último',
  },
  morador_poco_seco_1: {
    conteudo: 'Gilda sabe que a mãe salgou os poços da aldeia a pedido de gente de Solgar, e que o poço que a mãe guarda é o único porque ela quis. Não a perdoa e não a denuncia: sem a água da mãe, ninguém no Poço Seco bebe.',
    comoDescobrir: 'falar do sal na frente dela e ver o rosto mudar',
  },
  morador_poco_seco_2: {
    conteudo: 'Ferran, a benzedeira, esconde no Poço Seco gente procurada em Solgar e cobra em água. Tem uma lista de quem já passou, e três nomes da lista são de gente que Solgar diz ter enforcado.',
    comoDescobrir: 'pedir abrigo a ela como quem foge',
  },
  morador_poco_seco_4: {
    conteudo: 'Eda de Baixo, a pastora, deve à moça que some porque a moça levou o filho dela para o sul, pelo ermo, antes que os recrutadores da marca passassem pelo Poço Seco. O filho está vivo, e Eda não sabe onde.',
    comoDescobrir: 'perguntar pelo filho dela, que ninguém mais menciona',
  },
  morador_caravancerai_0: {
    conteudo: 'Elna a Magra deve à filha porque a Parada de Idrin esteve a um mês de fechar, e o dinheiro que Hedra emprestou veio de uma caravana que ninguém declarou em Solgar.',
    comoDescobrir: 'olhar o livro da parada e o livro da caravana lado a lado',
  },
  morador_caravancerai_2: {
    conteudo: 'Torv Boca-Seca cumpriu a vingança de fora do portão da parada, no ano da neutralidade quebrada. Matou quem tinha matado o irmão dela, no minuto seguinte à saída, e a parada nunca soube quem foi.',
    comoDescobrir: 'perguntar pela vingança do portão a quem escolta com ela',
  },
  morador_caravancerai_3: {
    conteudo: 'Greta a Surda não diz de onde vem porque vem de Idrin: é neta do homem que construiu a parada e morreu antes da primeira caravana. Voltou para ver se o nome ainda estava na porta.',
    comoDescobrir: 'perguntar a ela quem foi Idrin',
  },

  // ───────────────────────────── BAIXIOS DE HALVERN
  morador_vila_juncal_0: {
    conteudo: 'Orla, anciã de Juncal de Baixo aos vinte e dois, guia os meninos que chegam do vale fugindo da Leva pelo charco até a Toca do Juncal. Faz isso manca, de noite, e a avó acha que ela está dormindo.',
    comoDescobrir: 'chegar ao Juncal com um menino do vale',
    consequencia: {
      texto: 'Orla contou as estacas do caminho do charco para você. A Toca do Juncal passa a existir no seu mapa; os juncaleiros só ensinam isso a quem é da família.',
      efeitos: [{ tipo: 'flag', chave: 'descoberto.toca_juncal', valor: true }, rel('morador_vila_juncal_0', 'confianca', 3)],
    },
  },
  morador_vila_juncal_1: {
    conteudo: 'Corin, a avó, sabe por que a filha não atravessa ninguém depois do anoitecer: foi ela quem pediu a Tela que levasse aquela carga, naquela noite, e viu o que desembarcou do outro lado.',
    comoDescobrir: 'perguntar pela carga da noite a quem tem idade para lembrar',
  },
  morador_vila_juncal_2: {
    conteudo: 'Cera Mão-Curta benze cada menino que Orla leva à Toca e anota o nome num junco trançado. Tem quarenta e um juncos pendurados na viga. Três desses meninos voltaram para o vale e foram à ponte assim mesmo.',
    comoDescobrir: 'contar os juncos trançados na viga da benzedeira',
  },
  morador_vila_juncal_3: {
    conteudo: 'Cera a Surda some por dias porque leva comida à Toca do Juncal. Um dos que se escondem lá é filho dela, que a vila deu por levado pela Leva sete anos atrás.',
    comoDescobrir: 'seguir o cesto de comida que sai de madrugada',
  },
  morador_vila_juncal_4: {
    conteudo: 'Bran Mão-Curta, a pastora, já vendeu a um fiscal da marca o caminho do charco uma vez. O fiscal se afogou no caminho errado que ela desenhou, e a benzedeira sabe.',
    comoDescobrir: 'perguntar pelo fiscal que nunca chegou',
  },

  // ───────────────────────────── FORA DO MUNDO
  morador_vila_ferreiros_0: {
    conteudo: 'Eda virou mestra porque a mestra que criou as irmãs escolheu a mais nova — e escolheu porque Ondra quebrou, aos catorze, a lâmina de um caçador que morreu na primeira luta. Ondra nunca soube que foi por isso.',
    comoDescobrir: 'perguntar a Eda pela primeira lâmina que a irmã fez',
  },
  morador_vila_ferreiros_1: {
    conteudo: 'Ondra, a aprendiz, forja à noite lâminas melhores que as da irmã e as destempera de manhã para ninguém ver. Espera o dia em que a irmã errar em alguma coisa que importe.',
    comoDescobrir: 'entrar na forja antes do amanhecer',
  },

  // ───────────────────────────── KIMETSU
  zenitsu: {
    conteudo: 'Zenitsu só consegue a primeira forma do Trovão desmaiado de medo, e só aprendeu essa. O mestre sabia e treinou só ela, mil vezes, até a forma ser mais rápida que o medo.',
    comoDescobrir: 'lutar ao lado dele e reparar quando ele fecha os olhos',
  },
  inosuke: {
    conteudo: 'Inosuke foi criado por javalis porque a mãe o jogou do penhasco para salvá-lo de um oni que a caçava. Ele não lembra; guarda só um nome de mulher que às vezes diz dormindo.',
    comoDescobrir: 'dormir no mesmo acampamento e ouvir o nome',
  },
  kanao: {
    conteudo: 'Kanao decide jogando uma moeda porque, quando menina, não conseguia decidir nada sem apanhar. A moeda foi presente de Kanae, e as duas faces são iguais.',
    comoDescobrir: 'pedir para ver a moeda de perto',
  },
  genya: {
    conteudo: 'Genya come carne de oni para ganhar, por algumas horas, a força e a regeneração deles. Nenhum Hashira sabe, exceto Gyomei, que o protege em silêncio.',
    comoDescobrir: 'estar com ele depois de uma luta e ver o ferimento fechar',
  },
  kagaya: {
    conteudo: 'Kagaya sabe que a maldição da família vem de um parente de sangue: o oni que os caçadores perseguem nasceu Ubuyashiki. A família caça o próprio sangue há mil anos.',
    comoDescobrir: 'ganhar a confiança da casa e perguntar por que a doença poupa as mulheres',
  },
  amane: {
    conteudo: 'Amane já preparou a casa para o dia em que Kagaya morrer: pólvora nas vigas, e a promessa de ficar dentro com ele se o inimigo vier buscá-lo. Não contou a nenhum caçador.',
    comoDescobrir: 'reparar no cheiro das vigas da casa num dia de chuva',
  },
  urokodaki: {
    conteudo: 'Urokodaki usa a máscara vermelha porque tem rosto gentil demais e os onis não o levavam a sério. As máscaras que faz para os discípulos têm um feitiço de proteção — e todas as que deu antes de Giyu voltaram sem dono.',
    comoDescobrir: 'perguntar pela prateleira de máscaras vazias da cabana',
  },
  jigoro: {
    conteudo: 'Jigoro teve dois discípulos. Um virou oni. Jigoro prometeu tirar a própria vida no dia em que o antigo discípulo matasse um caçador, e a carta com essa promessa está com o mestre dos caçadores.',
    comoDescobrir: 'perguntar pelo discípulo mais velho, o que ninguém menciona',
  },
  shinjuro: {
    conteudo: 'Shinjuro largou a espada no dia em que leu os registros da Respiração do Sol na biblioteca da família. Convenceu-se de que as Chamas eram cópia imperfeita e que nenhum Rengoku seria mais que sombra.',
    comoDescobrir: 'beber com ele até ele falar da biblioteca',
  },
  kanae: {
    conteudo: 'Kanae deveria ter morrido numa luta contra a Lua Superior Dois. Sobreviveu porque a irmã chegou com veneno antes do amanhecer, e desde então sabe que o veneno de Shinobu é a coisa mais perigosa da casa.',
    comoDescobrir: 'perguntar pela cicatriz no ombro dela',
  },
  sabito: {
    conteudo: 'Sabito morreu na Seleção Final matando todos os onis da montanha, menos o último. A espada dele quebrou no pescoço do Oni das Mãos, e ele continua na mata porque o oni ainda come alunos de Urokodaki.',
    comoDescobrir: 'treinar na mata ao entardecer até ele aparecer',
    consequencia: {
      texto: 'Sabito lhe mostrou onde a lâmina dele quebrou. Enquanto o Oni das Mãos viver, os mortos da mata não descansam.',
      efeitos: [rel('urokodaki', 'confianca', 3), rel('giyu', 'confianca', 2)],
    },
  },
  makomo: {
    conteudo: 'Makomo foi morta pelo mesmo oni que matou Sabito, e sabe o número exato de alunos de Urokodaki que ele comeu. Conta cada um nas pedras do riacho, e ainda sobra pedra.',
    comoDescobrir: 'perguntar pelas pedras empilhadas no riacho',
  },
  tamayo: {
    conteudo: 'Tamayo virou oni por escolha, doente, para ver os filhos crescerem. Matou o marido e os filhos na primeira noite. Tudo o que pesquisa desde então é para desfazer aquilo em alguém, já que nela não há volta.',
    comoDescobrir: 'ganhar a confiança dela e perguntar por que ela nunca come',
  },
  yushiro: {
    conteudo: 'Yushiro era um menino doente que Tamayo transformou para salvá-lo. Não lembra do nome que tinha antes, e não quer lembrar: o único nome que importa foi ela quem deu.',
    comoDescobrir: 'perguntar a ele de onde é, sem Tamayo por perto',
  },
};

/**
 * Segredos-modelo do povoamento que saíam IGUAIS em duas ou três pessoas de
 * lugares diferentes ("Mentiu no depoimento da época..."). Um fica com o
 * texto original; os outros ganham segredo próprio aqui.
 */
export const SEGREDOS_REESCRITOS: Record<string, Segredo> = {
  morador_tessel_19: {
    conteudo: 'Ferran passa ferro de Corveira pela fronteira da marca pelo caminho que a mãe patrulha, nas noites em que a mãe dobra o turno para não estar lá. Nenhuma das duas combinou isso; as duas sabem.',
    comoDescobrir: 'vigiar a fronteira numa noite de turno dobrado da capitã',
  },
  morador_tessel_15: {
    conteudo: 'Mira prepara para a escrivã Ketta Varn o tônico que a marechala toma para dormir. A dose é de Ketta, a mão é de Mira, e a marechala dorme mais do que devia nas noites de conselho.',
    comoDescobrir: 'comprar o tônico da marechala e comparar a dose com a da curandeira',
  },
  morador_corveira_11: {
    conteudo: 'Jarek a Gorda empresta às famílias do Sexto o dinheiro que as casas deveriam ter pago de indenização, com juros, e recebe das casas por fora para manter o Sexto quieto.',
    comoDescobrir: 'perguntar a uma família do Sexto de quem é o dinheiro que ela deve',
  },
  morador_corveira_9: {
    conteudo: 'Sela guarda as plantas das galerias debaixo de Corveira desde antes do desabamento. É por onde a gente dela anda sem ser vista, e foi por uma dessas galerias que o quarto terraço começou a ceder.',
    comoDescobrir: 'pagar para atravessar a cidade sem ser visto e reparar por onde ela manda você ir',
    consequencia: {
      texto: 'Sela lhe mostrou as plantas das galerias. A que passa debaixo do Sexto está do mesmo jeito que a do quarto terraço estava antes de cair.',
      missao: 'reconstruir',
    },
  },
  morador_corveira_18: {
    conteudo: 'Ivo voltou da guerra a tempo de ver o corpo da irmã sair dos escombros, com o bracelete de uma das sete casas no braço. A irmã não trabalhava na galeria: estava lá a mando de alguém.',
    comoDescobrir: 'perguntar pela irmã dela e pelo bracelete',
  },
  morador_corveira_19: {
    conteudo: 'Hedra atravessa para Tessel o minério da indenização que ninguém quer e o vende à armeira da cidade como ferro de fundição. O ferro é bom; o que pesa é de onde ele saiu.',
    comoDescobrir: 'seguir a carroça dela até a fronteira da marca',
  },
  morador_mareu_11: {
    conteudo: 'Jarek a Magra tem a lista dos navios que a quarentena deixou passar na peste, e de quem pagou por isso. Empresta a metade do conselho de Mareu sem cobrar juros.',
    comoDescobrir: 'pedir um empréstimo sem juros e perguntar por que ela oferece',
  },
  morador_porto_sal_6: {
    conteudo: 'Loris guarda o livro das salinas da avó, com o nome de cada degredado e de quem os comprou para o trabalho. Metade dos sobrenomes de feitor do porto está lá, inclusive o da senhora da cidade.',
    comoDescobrir: 'beber na taverna até tarde e falar da avó dela',
  },
  morador_porto_sal_5: {
    conteudo: 'Ulla trata de graça as mãos rachadas das salineiras e cobra em dobro das famílias de feitor. Tem um unguento que fecha a rachadura em dois dias e só o vende a quem já trabalhou na salina.',
    comoDescobrir: 'pedir o unguento para mãos que nunca pegaram em sal',
  },
  morador_mercado_peixe_7: {
    conteudo: 'Ivo Pé-de-Ferro é neta da família que tinha a primeira bancada do galpão, expulsa pelas Olho-Vivo. Guarda o registro original e espera a mestra da guilda envelhecer de medo antes de mostrar.',
    comoDescobrir: 'perguntar a ela pela família que tinha a primeira bancada',
  },
};

/**
 * O que muda ao descobrir. Inclui segredos que já existiam no conteúdo e
 * agora ganham consequência.
 */
export const CONSEQUENCIAS: Record<string, ConsequenciaSegredo> = {
  halda: {
    texto: 'Halda contou da segunda porta da cripta. A Irmã Perla quer saber tudo o que você ouviu.',
    efeitos: [rel('irma_perla', 'confianca', 3), rel('madre_corvane', 'medo', 2)],
  },
  torana: {
    texto: 'Torana fechou a porta da forja com você dentro: se guardar o segredo, ela ensina o que a mãe ensinou. Os caçadores sabem que você sabe.',
    efeitos: [rel('torana', 'confianca', 3), rep('cacadores', 1)],
  },
  rapaz_da_leva: {
    texto: 'Ivo lhe mostrou o recibo da dispensa com o sinete de Brila Ost. Com isso, a sargenta do portão de Tessel passa a ter medo de você.',
    efeitos: [item('carta_lacrada'), rel('sargenta_brila', 'medo', 4)],
  },
  morador_mercado_7: {
    texto: 'Lira lhe confiou os nomes dos meninos escondidos em Juncal de Baixo. Se a Leva vier cobrar, eles contam com você; a Madre Corvane não pode saber.',
    efeitos: [rel('morador_mercado_7', 'confianca', 4), rel('morador_vila_juncal_0', 'confianca', 2)],
  },
  morador_mercado_8: {
    texto: 'Dorn sabe que você sabe que ela ouve. Na arena da feira, ela passa a olhar você antes de escolher em quem apostar.',
    efeitos: [rel('morador_mercado_8', 'medo', 4), rel('morador_mercado_5', 'confianca', 2)],
  },
  morador_acampamento_2: {
    texto: 'Brida admitiu que recebeu para se perder na Mata de Corvos. Neve, que sabe onde a caravana foi emboscada, passa a confiar em você.',
    efeitos: [rel('neve', 'confianca', 3), rel('morador_acampamento_2', 'medo', 3)],
  },
  morador_corveira_16: {
    texto: 'Eda a Torta viu quem queimou o laudo verdadeiro. A copista do mosteiro, que decorou o registro, quer ouvir de você cada palavra.',
    efeitos: [rel('irma_copista', 'confianca', 4), rel('senhora_corveira', 'medo', 2)],
  },
  // Segredos que já existiam e passam a ter consequência.
  sargenta_bael: {
    texto: 'Você sabe que Bael derrubou os arcos da ponte de propósito durante a revolta. Ruvela, que desertou naquela noite, passa a tratar você como quem enfim entendeu.',
    efeitos: [rel('ruvela', 'confianca', 4), rel('sargenta_bael', 'medo', 5)],
  },
  lunn: {
    texto: 'Lunn confessou que dormiu na sentinela na noite da sabotagem da ponte e não tocou o sino de alarme. Ela passa a confiar em você como confia na mãe — e com o mesmo medo.',
    efeitos: [rel('lunn', 'confianca', 4), rel('lunn', 'medo', 2)],
  },
  teoda: {
    texto: 'O segundo livro-caixa da Casa de Pedra está atrás da lareira. Com ele, a Dama Valda deixa de ter o que esconder de você.',
    efeitos: [item('livro_caixa'), rel('dama_valda', 'medo', 4), rel('teoda', 'confianca', 2)],
  },
  perita_do_desabamento: {
    texto: 'Sibel descosturou o forro do casaco na sua frente. O relatório original do desabamento está com você, e a casa Verrão vai saber que alguém o tem.',
    efeitos: [item('carta_lacrada'), rel('senhora_corveira', 'medo', 4), rel('irma_copista', 'confianca', 3)],
  },
  pescadora_da_rede: {
    texto: 'Quim lhe mostrou onde está a caixa com o selo do porto. O que tem dentro pode dizer quem pagou para o farol apagar.',
    efeitos: [item('selo_partido'), rel('viuva_do_farol', 'confianca', 3), rel('mestra_do_porto', 'medo', 3)],
  },
  sargenta_brila: {
    texto: 'Você sabe onde está a lista verdadeira da leva, sob a terceira pedra do Campo da Ceifa. As famílias dos nomes riscados vão querer saber.',
    efeitos: [rel('sargenta_brila', 'medo', 4), rel('morador_tessel_18', 'confianca', 2), rel('ancia_pedravel', 'confianca', 2)],
  },
  aguadeira_do_poco: {
    texto: 'Ura contou que secou o poço do Forte Agulha a pedido de alguém. Sem água, a guarnição racionou; alguém precisa levar mantimento ao forte antes da próxima queda.',
    missao: 'abastecer',
  },
  ferreira_de_mareu: {
    texto: 'Kelda admitiu os ganchos e arpões da frota clandestina. A mestra do porto perde o argumento contra ela, e Kelda passa a contar com você.',
    efeitos: [rel('ferreira_de_mareu', 'confianca', 3), rel('mestra_do_porto', 'disposicao', -2)],
  },
  guarda_do_bosque: {
    texto: 'Saía contou o que viu no Passo do Lobo. A guardiã passa a mandar você pelo caminho seguro, e a mãe dela, na Carvoeira, também sabe que você sabe.',
    efeitos: [rel('guarda_do_bosque', 'confianca', 4), rel('carvoeira_velha', 'confianca', 2)],
  },
  carvoeira_velha: {
    texto: 'O quarto cheiro vem de dentro da Carvoeira, e Ferna disse de onde. A aldeia tem gente doente que ninguém quer ver.',
    missao: 'tratar',
  },
  irma_perla: {
    texto: 'Perla lhe mostrou as provas contra a madre. A capela tem dois lados agora, e você está num deles.',
    efeitos: [rel('irma_perla', 'confianca', 4), rel('madre_corvane', 'disposicao', -4), rep('igreja', -2)],
  },
  morda: {
    texto: 'Morda estava na margem na noite da sabotagem e ouviu a ordem de dinamitar os arcos antes do estrondo. Oda, que nunca a deixou passar fome, passa a confiar em quem a escutou.',
    efeitos: [rel('oda', 'confianca', 3), rel('morda', 'confianca', 3)],
  },
  viuva_do_farol: {
    texto: 'Nera contou que o farol foi apagado por dinheiro. A neta dela, Quim, merece saber, e a mestra do porto sabe que agora alguém sabe.',
    efeitos: [rel('pescadora_da_rede', 'confianca', 3), rel('mestra_do_porto', 'medo', 3)],
  },
};
