// ARCANUM · Histórias do Vale de Halvet e arredores (sessão 47, Fase 3).
//
// Cada história diz de onde a pessoa veio, o que perdeu, o que quer e, às
// vezes, do que tem medo — com lugar, pessoa ou fato do mundo, nunca
// "infância difícil". Vai ao narrador para ele aludir; o segredo da pessoa
// continua fora do pacote até ser descoberto (engine/llm.ts).
//
// Irmãs e mães contam a mesma perda de lados diferentes de propósito (as da
// Bigorna, as Cava-Fundo, a casa de Halvet).
import type { HistoriaNpc } from '../../engine/types';

export const HISTORIAS_VALE: Record<string, HistoriaNpc> = {
  aldrica: {
    origem: 'Nasceu na Rês Enforcada, filha da taverneira anterior, e nunca dormiu uma noite fora do vale. Herdou o balcão aos vinte e cinco, com a dívida junto.',
    ferida: 'Viu os dois irmãos caminharem até a ponte, um em cada inverno, e serviu cerveja na noite seguinte porque a taverna não fecha.',
    desejo: 'Que Elza herde a taverna sem herdar a dívida com a Fiadora, e que um dia escolha ficar.',
    medo: 'Que Elza vá embora pela estrada do sal e não mande notícia, como a mãe dela fez com a própria família.',
  },
  neve: {
    origem: 'Filha de caçadora da Mata de Corvos, aprendeu a andar no mato antes de aprender a ler. Mora na mata porque na vila as paredes a apertam.',
    ferida: 'A mãe entrou na mata num outono e voltou só o arco, pendurado num galho alto demais para um bicho alcançar.',
    desejo: 'Saber o que pendurou o arco da mãe naquele galho, e matar a coisa com a mesma flecha.',
    medo: 'Ficar velha na vila, contando para crianças histórias de uma mata que ela não consegue mais atravessar.',
  },
  madre_corvane: {
    origem: 'Veio de um convento do sul para a Capela de São Vandro com vinte anos, mandada para ficar um inverno. Ficou quarenta.',
    ferida: 'Rezou na capela a noite inteira em que a ponte caiu e ouviu, debaixo do chão, alguma coisa responder à reza.',
    desejo: 'Morrer antes que o que está debaixo da capela acorde, e que ninguém descubra o preço que ela pagou para isso.',
    medo: 'A Irmã Perla, que é boa demais para entender que certas coisas se mantêm fechadas com as mãos sujas.',
  },
  mira: {
    origem: 'Chegou ao vale aos catorze como aprendiz de Nadja das Cinzas, carregando cesto de erva. Aprendeu tudo o que Nadja sabia em cinco anos, e mais depressa do que Nadja gostaria.',
    ferida: 'Ficou com a banca da mestra no dia em que a vila expulsou Nadja, e ninguém na feira a chamou de ladra — só a própria Nadja, pela janela da carroça.',
    desejo: 'Juntar dinheiro bastante para não depender de nenhum cliente, nem da capela.',
    medo: 'Que a feira um dia faça com ela o que fez com Nadja, pelo mesmo motivo.',
  },
  sargenta_bael: {
    origem: 'Veio da guarda de Tessel, transferida para o vale depois do cerco com uma recomendação que ninguém leu inteira.',
    ferida: 'A antecessora no posto morreu na Praça da Forca com uma lâmina nas costas, e Bael assumiu no dia seguinte sem que ninguém fosse preso.',
    desejo: 'Aposentar-se com a filha longe da Torre do Vigia e com a conta da ponte enterrada junto.',
    medo: 'Ruvela, que conhece o jeito dela de comandar e sabe onde ela fica cega.',
  },
  vess: {
    origem: 'Ninguém no vale lembra de Vess jovem. Diz que chegou pela estrada do sal com uma arca e uma corrente, e que a arca estava vazia.',
    ferida: 'Emprestou uma vez sem cobrar, a uma mulher que depois caminhou para a ponte atrás do filho. Desde então cobra de todo mundo.',
    desejo: 'Ter o vale inteiro devendo a ela no dia em que a Leva parar, porque aí será ela quem decide o que o vale vira.',
    medo: 'Que alguém toque na Corrente sem saber o que faz.',
  },
  halda: {
    origem: 'Já teve casa na praça, onde hoje é o poço. Foi parteira até os cinquenta e fez nascer metade das mulheres do vale.',
    ferida: 'Disse na praça, anos atrás, que a porta errada tinha sido selada. Perdeu as clientes, depois a casa, e ficou com o que via.',
    desejo: 'Que Sarine admita, na frente da praça, que selou a porta errada.',
    medo: 'Morrer antes de alguém descer à cripta e ver com os próprios olhos.',
  },
  torana: {
    origem: 'Filha caçula de Ilde Bigorna, aprendeu o ferro na mesma forja que a irmã, três anos depois dela, e aprendeu melhor.',
    ferida: 'A mãe morreu na bigorna sem dizer qual filha ficava com a forja, e Duna nunca mais entrou na forja que foi das duas.',
    desejo: 'Uma peça feita a quatro mãos com a irmã antes de uma das duas morrer.',
    medo: 'Que a última palavra entre as duas seja sobre têmpera.',
  },
  duna: {
    origem: 'A mais velha das filhas de Ilde Bigorna. Aprendeu a forjar armas de guerra quando o vale ainda tinha guerra para vender.',
    ferida: 'Esperou a mãe dizer que a forja era dela, porque era a mais velha e a que ficou quando Torana foi aprender em Corveira. A mãe morreu sem dizer.',
    desejo: 'Que a filha, Elna, seja a melhor armeira do vale, e que isso fique dito na praça.',
    medo: 'Que Elna prefira a têmpera da tia.',
  },
  elza: {
    origem: 'Filha de Maren, uma lavadeira que morreu de febre quando Elza tinha dois anos. Aldrica a levou para a taverna enrolada num avental.',
    ferida: 'Descobriu aos doze que Aldrica a registrou como serva e não como filha, para não pagar o imposto de herdeira.',
    desejo: 'Sair do vale com dinheiro próprio e um ofício que não seja servir.',
    medo: 'Descobrir que Aldrica tinha razão sobre o mundo lá fora.',
  },
  grimma: {
    origem: 'Nasceu em Juncal de Baixo e aprendeu o caminho do charco com a avó, que o ensinava só a filho. Grimma era neta, e aprendeu escondida.',
    ferida: 'Foi expulsa do Juncal por vender o caminho a um contrabandista do sal. Nunca mais voltou, nem para o enterro da avó.',
    desejo: 'Comprar de volta, com o dinheiro do contrabando, o direito de voltar ao Juncal.',
    medo: 'Que Neve descubra o que ela move pela mata e deixe de ser a única pessoa em quem confia.',
  },
  irma_perla: {
    origem: 'Órfã criada pelas freiras da Capela de São Vandro. A madre a ensinou a ler, e é isso que a madre hoje lamenta.',
    ferida: 'Foi a madre quem a ensinou a rezar, e foi a madre quem ela viu, numa madrugada, voltar do subsolo sem conseguir rezar.',
    desejo: 'Uma capela que sirva ao vale e não ao que está debaixo dela.',
    medo: 'Estar errada sobre a madre e destruir a única pessoa que já cuidou dela.',
  },
  sarine: {
    origem: 'Veio de uma academia do outro lado das montanhas, com outro nome, antes de Mir queimar. Chegou ao vale com as roupas chamuscadas e um menino no colo.',
    ferida: 'Tirou Vell do fogo de Mir e deixou lá dentro todas as outras pessoas que conhecia.',
    desejo: 'Ensinar a alguém o que ela sabe antes que o selo termine de rachar, para que não seja ela a última.',
    medo: 'Que Halda esteja certa.',
  },
  heska: {
    origem: 'Moleira como a mãe e a avó, no Moinho Parado, quando ele ainda girava e moía o grão de meio vale.',
    ferida: 'Na noite da cheia a roda parou e nunca mais girou, e havia gente no açude que o vale não gosta de nomear.',
    desejo: 'Pôr a roda para girar de novo sem ter de explicar por que parou.',
    medo: 'Que Serla pergunte pela noite da cheia de um jeito que não dê para mudar de assunto.',
  },
  oda: {
    origem: 'Coveira como a mãe, a avó e uma tia-avó que foi enterrada pela própria sobrinha. No Campo de Pedras há trezentos anos de Cava-Fundo.',
    ferida: 'Enterrou pedra no lugar de meninos da Leva, com o nome deles gravado, porque as mães precisavam de algum lugar para chorar.',
    desejo: 'Que Pia nunca precise segurar uma pá, nem saber onde cada um foi posto.',
    medo: 'Ter de cavar a cova da tia Morda e não saber o que pôr na pedra.',
  },
  lunn: {
    origem: 'Filha da sargenta Bael, criada no quartel de Tessel até os seis e no vale depois. Nunca quis a guarda; quis a torre, porque de lá se vê longe.',
    ferida: 'Na noite em que a ponte caiu, o sino não tocou. O vale inteiro sabe que o sino não tocou.',
    desejo: 'Um turno inteiro, um só, em que nada aconteça e ninguém pergunte nada.',
    medo: 'O escuro da escada da torre, que ela sobe toda noite contando os degraus em voz alta.',
  },
  dama_valda: {
    origem: 'Última de uma casa que teve voto no conselho da estrada do sal. Casou-se tarde, com um homem de fora que morreu cedo, e criou dois filhos na Casa de Pedra.',
    ferida: 'Preparou Aldren para herdar tudo — espada, sinete, lugar à mesa — e a Leva o levou no inverno dos dezoito.',
    desejo: 'Que a casa de Halvet ainda signifique alguma coisa quando ela morrer, nem que seja o nome.',
    medo: 'Que Ysolde venda a casa pelo que ela vale, que é pouco.',
  },
  ysolde: {
    origem: 'A filha caçula da casa de Halvet, criada no quarto dos fundos enquanto o irmão aprendia a ser herdeiro.',
    ferida: 'Tinha quinze anos quando levaram Aldren. A mãe olhou para ela no jantar seguinte como quem olha uma cadeira errada.',
    desejo: 'Uma vida que não caiba na Casa de Pedra.',
    medo: 'Virar a mãe: pôr um lugar vazio à mesa e esperar por quem não volta.',
  },
  borka: {
    origem: 'Mineira desde os doze na Mina de Ferro, capataz desde os trinta, quando a capataz anterior ficou soterrada na galeria funda.',
    ferida: 'Tem os nomes de catorze mulheres que a pedra levou riscados numa viga da boca da mina, e sabe que cinco eram responsabilidade dela.',
    desejo: 'Fechar a mina com todo mundo vivo do lado de fora, no dia em que o ferro acabar.',
    medo: 'A galeria funda, que ela mesma mandou fechar e não deixa ninguém reabrir.',
  },
  kesta: {
    origem: 'Chegou à Mina de Ferro fugida de uma arena do sul, onde lutava por comida. Ficou porque debaixo da terra ninguém olha para ela.',
    ferida: 'Na arena do sul, matou uma lutadora que não precisava morrer, e o público pediu outra.',
    desejo: 'Que Borka pare de olhar para ela como quem guarda uma conta.',
    medo: 'Voltar a lutar por dinheiro.',
  },
  ganta: {
    origem: 'Pescadora do Espelho de Halvet como a mãe. Casou com um carreteiro de fora que ficou três anos e deixou Iva e uma dívida.',
    ferida: 'A rede já trouxe do lago coisas que nenhuma pescadora devia ver, e ela aprendeu a não contar o que devolve.',
    desejo: 'Que o lago a deixe morrer velha, como deixou a mãe.',
    medo: 'Que Iva pegue a estrada do sal um dia e faça o que o pai fez.',
  },
  iva: {
    origem: 'Filha de Ganta, criada no lago e na estrada. Aprendeu a conduzir carroça com o pai antes de ele ir embora.',
    ferida: 'O pai subiu a Estrada do Sal com a carroça que era dela por herança, e Iva teve de comprar outra fiado.',
    desejo: 'Uma carroça paga, com as quatro rodas iguais, e nenhuma dívida no nome.',
    medo: 'Que alguém ligue a carroça dela à caravana desaparecida.',
  },
  ruvela: {
    origem: 'Filha de Nadja das Cinzas, criada entre ervas na feira do vale. Entrou para a guarda aos dezesseis para limpar o nome da mãe.',
    ferida: 'Serviu sob a sargenta Bael até o dia em que não conseguiu mais, e saiu levando metade da tropa.',
    desejo: 'Um lugar onde os Sem-Nome não precisem se esconder, e onde ninguém pergunte pela mãe dela.',
    medo: 'Precisar decidir sobre Nadja do jeito que decide sobre os outros.',
  },
  nadja: {
    origem: 'Ervanária da feira do vale por vinte anos, com banca própria e aprendiz. Tratou metade do vale de febre e a outra metade de parto.',
    ferida: 'A vila a expulsou pela morte de uma paciente que chorou, e a aprendiz ficou com a banca no dia seguinte.',
    desejo: 'Ver Mira perder a banca do mesmo jeito que ela perdeu.',
    medo: 'Que a filha pergunte, um dia, pela paciente que a vila chorou.',
  },
  vell: {
    origem: 'Menino das Ruínas de Mir quando Mir ainda era cidade. Sarine o carregou para fora do fogo, e ele não lembra de nada de antes.',
    ferida: 'Voltou a Mir aos vinte para procurar o nome dos pais e ouviu, nas ruínas, alguém dizer o nome dele.',
    desejo: 'Entender o que fala com ele nas ruínas antes que termine de falar.',
    medo: 'Que Sarine o tenha tirado do fogo por outro motivo que não a bondade.',
  },
  morda: {
    origem: 'Irmã caçula da mãe de Oda, cega desde os trinta por uma febre de inverno. Mendiga na Ponte Caída desde que a ponte caiu.',
    ferida: 'Estava na ponte, do lado de cá, quando ela caiu, e ouviu o que ninguém mais ouviu.',
    desejo: 'Que alguém atravesse o rio de novo pelo lugar onde era a ponte, enquanto ela ainda estiver sentada ali.',
    medo: 'Esquecer a voz que riu do outro lado.',
  },
  serla: {
    origem: 'Lavadeira do vale desde menina. Casou com um homem de fora que veio pela estrada, e ele foi embora na primeira noite em que ouviu falar da Leva.',
    ferida: 'Ficou viúva de um homem vivo, e o vale a chama de viúva por delicadeza.',
    desejo: 'Uma vida com Heska no moinho, sem que o vale comente.',
    medo: 'O dia em que a casa de pedra precisar de um favor maior do que lavar roupa.',
  },
  teoda: {
    origem: 'Filha de uma escrivã de Corveira, mandada à casa de Halvet aos dezoito para pôr os livros em ordem. Pôs.',
    ferida: 'A mãe dela assinou papéis das casas de Corveira durante o desabamento do quarto terraço e morreu achando que tinha feito o certo.',
    desejo: 'Sair do vale com prova bastante para nunca mais depender da letra de ninguém.',
    medo: 'A lareira da Casa de Pedra no inverno, quando a Dama manda acender todas.',
  },
  azira: {
    origem: 'Nasceu em Além-Sal, do outro lado do Porto do Sal, numa família de mercadoras que atravessava o continente com uma única mula.',
    ferida: 'Perdeu a carga inteira da família no primeiro ano de estrada sozinha e passou dez anos pagando a mãe de volta.',
    desejo: 'Uma loja com porta, em qualquer cidade que não mude de dono a cada guerra.',
    medo: 'Receber, um dia, uma encomenda que ela não consiga recusar.',
  },
  pia: {
    origem: 'Filha de Oda Cava-Fundo, criada entre as covas do Campo de Pedras. Aos doze fugiu para a praça e nunca mais dormiu em casa por inteiro.',
    ferida: 'Carregou, aos catorze, o recado que avisava uma mulher de que o filho não tinha voltado da ponte, e ficou para ver a mulher abrir o papel.',
    desejo: 'Saber o bastante sobre todo mundo para que ninguém nunca mais a mande embora de lugar nenhum.',
    medo: 'Ler um dia o próprio nome num recado.',
  },
  hotaru: {
    origem: 'Nasceu na Vila que Ninguém Encontra Duas Vezes, filho de ferreiro de lâminas de caçador, e nunca saiu dela por mais de uma semana.',
    ferida: 'O pai o proibiu de forjar para caçadores até os trinta, e ele desobedeceu aos vinte e dois. Nunca disse ao pai como terminou.',
    desejo: 'Forjar uma lâmina que não quebre em mão nenhuma.',
    medo: 'Que o nome dele fique gravado numa lâmina que falhou.',
  },

  // ───────────────────────────── A FEIRA COBERTA (moradores)
  morador_mercado_0: {
    origem: 'Neta de Yara Velha, que abriu a primeira banca da Feira Coberta. Assumiu o posto de senhora da feira aos trinta, quando a mãe morreu.',
    ferida: 'No inverno em que a ponte caiu, a feira quase fechou, e foi a prima da rua de baixo quem pagou a conta. Nunca deixou Yara esquecer.',
    desejo: 'Pagar a prima de volta e governar a feira sem ninguém por trás.',
    medo: 'Precisar da prima outra vez.',
  },
  morador_mercado_1: {
    origem: 'Filha de Urda do Norte, criada para a guilda da feira. Trocou a guilda pela lança da guarda aos dezessete.',
    ferida: 'A mãe arrancou o nome dela do livro da guilda no mesmo dia, e ela foi morar na rua de baixo.',
    desejo: 'Ser capitã em que a feira confia sem precisar ser filha de ninguém.',
    medo: 'O dia em que a Sete-Dedos cobrar o favor.',
  },
  morador_mercado_2: {
    origem: 'Mestra da guilda da Feira Coberta há vinte anos, e filha de mestra. Veio do norte do vale, de onde vem o apelido.',
    ferida: 'Criou duas filhas para a guilda e perdeu uma para a guarda. Não perdoa, e protege a filha assim mesmo.',
    desejo: 'Ver Zeno voltar ao livro da guilda, pelas próprias pernas.',
    medo: 'Morrer sem que Zeno volte a pisar na casa da guilda.',
  },
  morador_mercado_3: {
    origem: 'A filha de Urda do Norte que ficou. Abriu a loja de secos e molhados com dinheiro da mãe aos vinte e dois.',
    ferida: 'Passou a juventude servindo de mensageira entre a mãe e a irmã, que não se falam direito desde que Zeno saiu da guilda.',
    desejo: 'Um almoço de domingo com as três na mesma mesa.',
    medo: 'Ter de escolher um lado na frente da feira inteira.',
  },
  morador_mercado_4: {
    origem: 'Filha de Duna Braço-Curto, nasceu na forja e aprendeu a malhar ferro antes dos dez. Armeira da feira desde os vinte.',
    ferida: 'Cresceu ouvindo a mãe falar mal da tia Torana, e descobriu aos quinze que a tia era a melhor ferreira do vale.',
    desejo: 'Pôr a mãe e a tia na mesma forja uma vez, com a porta fechada.',
    medo: 'Que a mãe a veja trabalhar ao lado da tia.',
  },
  morador_mercado_5: {
    origem: 'Curandeira da feira, formada no mosteiro de Corveira antes de voltar ao vale para cuidar da mãe doente.',
    ferida: 'A mãe morreu no segundo inverno depois da volta, e Torv ficou no vale sem saber mais por quê.',
    desejo: 'Ir embora do vale com uma boa desculpa, antes de virar a mãe.',
    medo: 'Que a arena feche e ela perca a única freguesa que paga em dia.',
  },
  morador_mercado_6: {
    origem: 'Filha de Yara Sete-Dedos, criada na rua de baixo. Toca a taverna da feira desde os vinte e cinco.',
    ferida: 'Cresceu ouvindo a feira chamar a mãe de Sete-Dedos e aprendeu cedo a não perguntar pelos dedos.',
    desejo: 'Uma taverna onde a mãe não faça negócio.',
    medo: 'Que a taverna vire, de vez, o escritório da mãe.',
  },
  morador_mercado_7: {
    origem: 'Escrivã do registro da feira, filha de outra escrivã. Anota nascimento, morte e dívida de quem compra e vende no vale.',
    ferida: 'Anotou o nome de todos os rapazes que a Leva levou nos últimos dez invernos, com a data. Sabe todos de cor.',
    desejo: 'Um inverno sem nenhum nome novo na lista.',
    medo: 'Um inverno em que a lista cresça mais depressa do que ela consegue escrever.',
  },
  morador_mercado_8: {
    origem: 'Lutadora da arena da feira desde os dezoito, quando chegou ao vale vinda de Tessel sem dizer por quê.',
    ferida: 'Perdeu de verdade a primeira luta no vale e passou uma semana sem sair do quarto, ouvindo a feira rir dela pela janela.',
    desejo: 'Juntar o bastante para abrir a própria arena e escolher as próprias lutas.',
    medo: 'Voltar para Tessel pelo mesmo caminho por onde veio.',
  },
  morador_mercado_9: {
    origem: 'Neta de Yara Velha, criada na rua de baixo. Manda no que se vende na feira depois que escurece desde os trinta.',
    ferida: 'Perdeu três dedos de uma vez, num inverno ruim, e nunca contou a ninguém da família como foi.',
    desejo: 'Que a prima de cima diga obrigada, uma vez, em voz alta.',
    medo: 'Que Greta tenha de pagar, um dia, alguma conta que é dela.',
  },
};
