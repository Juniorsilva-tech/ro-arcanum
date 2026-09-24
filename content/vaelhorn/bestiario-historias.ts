// ARCANUM · O bestiário do vale (sessão 55).
//
// Cada criatura tinha nome, número e uma frase de descrição — o que se vê no
// instante do encontro. Faltava o resto: de onde ela vem, o que o vale conta
// dela, e o que quem sobreviveu aprendeu. `historia` é o que se sabe; `sinais`
// é o que serve na estrada (como reconhecer, o que funciona, o que não).
// Aparece no Bestiário da Crônica para as criaturas que o jogador já venceu,
// e vai ao narrador quando ela está em cena.
//
// Ficam de fora as feras da Grande Terra Desolada e de Tsige (Tsukimichi),
// que o dono pediu para deixar para depois.
export type HistoriaCriatura = { historia: string; sinais: string };

export const HISTORIAS_CRIATURAS: Record<string, HistoriaCriatura> = {
  // ─────────────────────────────── Fauna do vale e dos arredores
  rato_gigante: {
    historia: 'Vieram com os celeiros: onde o vale guarda grão, eles crescem. Depois da ponte, com menos gente para caçar e mais casa vazia para morar, cresceram mais do que deviam.',
    sinais: 'Andam pelo rodapé e fogem da luz. Mordida suja: ferida de rato que não se lava vira febre em três dias.',
  },
  cao_selvagem: {
    historia: 'Filhos e netos dos cães das casas que a Leva esvaziou. Ninguém os mandou embora; só pararam de chamá-los. Aprenderam a caçar em grupo com o que sobrou do faro de pastor.',
    sinais: 'Latem antes de atacar, e o latido é o aviso honesto. Quem mostra as costas vira presa; quem para e encara costuma ver o bando hesitar.',
  },
  lobo: {
    historia: 'O Passo do Lobo tem o nome deles. Nos invernos duros descem até a Mata de Corvos, e as velhas contam os invernos pelo número de uivos que se ouve da vila.',
    sinais: 'Nunca vem só: se você vê um, os outros já te viram. Rodeiam pela esquerda, testam, e só fecham quando alguém sangra.',
  },
  javali: {
    historia: 'Reviram as roças da beira da mata no outono, quando a bolota cai. As lavradoras de Halvet têm uma lança só para eles, mais curta e mais grossa que a de guerra.',
    sinais: 'Carrega em linha reta e não sabe virar. Sair da frente vale mais que qualquer escudo.',
  },
  corvo_gigante: {
    historia: 'Deram o nome à Mata de Corvos. No outono chegam em revoada do norte, e a vila diz que contam os mortos do ano antes de decidir onde pousar.',
    sinais: 'Descem sobre os olhos, sempre. Um grito alto e um braço erguido espantam os pequenos; os grandes voltam.',
  },
  aranha_das_arvores: {
    historia: 'Tecem entre os galhos altos da mata, onde a luz não chega. As coletoras de ervas sabem que teia com orvalho de manhã quer dizer ninho perto.',
    sinais: 'Espera em cima. Quem olha para o chão na mata não vê a aranha até ela cair. O veneno adormece o braço antes de doer.',
  },
  raposa_raivosa: {
    historia: 'Raposa que perdeu o medo de gente não é coragem: é doença. Na primavera aparecem mais, e a capela manda queimar o corpo.',
    sinais: 'Espuma no focinho, andar torto, e não foge. Não deixe morder — a febre da raiva não tem remédio no vale.',
  },
  enxame_de_morcegos: {
    historia: 'Moram nos forros da cripta, na torre e nas galerias velhas. No verão saem ao anoitecer como fumaça preta, e voltam antes de clarear.',
    sinais: 'Barulho e movimento os atraem; tocha os espalha. Quem se abaixa e espera costuma sair só com arranhões.',
  },
  serpente_do_junco: {
    historia: 'Vive na margem do lago e nos baixios, onde o junco é mais alto que gente. As mulheres de Juncal de Baixo tecem a pele dela em anéis para dar sorte na pesca.',
    sinais: 'O junco se mexe contra o vento um palmo antes do bote. No frio ela quase não se mexe; no verão, é rápida demais para ver.',
  },
  lobo_branco: {
    historia: 'Um por matilha, quando muito. As caçadoras da marca dizem que o branco não nasce assim: embranquece depois de comer gente. Ninguém quer testar.',
    sinais: 'Os outros lobos esperam por ele. Derrubar o branco primeiro faz a matilha recuar; deixá-lo por último é lutar com todos.',
  },
  urso_pardo: {
    historia: 'Dorme o inverno todo nas tocas da colina e acorda com fome na primavera. Uma ursa com filhote já esvaziou uma aldeia inteira de Lenha Alta por uma estação.',
    sinais: 'Levanta nas patas de trás para ver melhor, não para atacar. Quem corre, desperta a caça. Quem fica grande e recua devagar, às vezes sai inteiro.',
  },
  sanguessuga_do_lodo: {
    historia: 'Do tamanho de um antebraço, vive no lodo do lago e dos charcos. As curandeiras usam as pequenas para tirar sangue ruim; as grandes, ninguém usa para nada.',
    sinais: 'Não se sente a mordida, só o frio que sobe pela perna. Sal e fogo a fazem soltar; puxar arranca a carne junto.',
  },
  verme_de_pedra: {
    historia: 'Come pedra e deixa galeria atrás de si. As mineiras de Corveira dizem que metade dos túneis antigos não foi cavada por ninguém, e que o terraço quarto caiu em cima de um ninho.',
    sinais: 'A parede respira antes de abrir. O couro é duro como a rocha que ele come; a boca, por dentro, não.',
  },

  // ─────────────────────────────── Gente da estrada
  salteador: {
    historia: 'Vêm de fora, pela estrada do sal, e nunca ficam muito: o vale não tem homem para roubar, mas tem carga. A maioria anda em bando sob um capitão que ganhou o posto na última briga.',
    sinais: 'Ataca quem parece sozinho e cansado. Um grito de aviso de outro viajante costuma bastar para o salteador sozinho mudar de ideia.',
  },
  bandido: {
    historia: 'O salteador que durou o bastante para comprar uma cota de malha. Já matou por dinheiro e sabe que não vai morrer velho.',
    sinais: 'Protege o flanco e bate forte uma vez. Não luta até o fim: quando sangra, pensa na fuga.',
  },
  salteador_arqueiro: {
    historia: 'Fica atrás das pedras no alto da curva e cobra pedágio antes de mostrar o rosto. Os bandos pagam mais a quem sabe atirar do que a quem sabe bater.',
    sinais: 'Mira nas pernas para derrubar e roubar sem sujar a carga. Fechar a distância acaba com ele; ficar na estrada aberta é o que ele quer.',
  },
  foragido_veterano: {
    historia: 'Desertor de alguma guerra de fora, que ainda usa a cota do regimento com a insígnia arrancada. Sabe formar linha, sabe esperar, e não acredita em mais nada.',
    sinais: 'Luta como soldado: guarda alta, golpe curto, nunca se expõe. Paciência ganha dele; pressa, não.',
  },
  capitao_bandoleiro: {
    historia: 'Manda no bando porque foi o último de pé na briga anterior, e sabe que o próximo capitão sai do mesmo jeito. Guarda rancor e guarda nomes.',
    sinais: 'Nunca luta sozinho se puder evitar. Derrotado e vivo, volta mais esperto, com cicatriz e alcunha nova.',
  },
  capanga_do_senhorio: {
    historia: 'Pago pela casa ou por quem manda na terra para não perguntar e acertar primeiro. Em Halvet, a casa já não paga os seus; os que sobram trabalham para quem paga.',
    sinais: 'Obedece a quem está pagando. Descobrir quem é costuma resolver mais que a espada.',
  },
  cao_de_guarda: {
    historia: 'Bem alimentado, mal amado, treinado para uma coisa só. As casas que ainda têm o que guardar têm um.',
    sinais: 'Não late: morde. Carne jogada longe compra um instante; não compra a noite.',
  },
  mineiro_enlouquecido: {
    historia: 'Desceu na galeria funda e ficou tempo demais onde a pedra é morna. Voltou falando com a picareta, e a picareta, dizem, responde.',
    sinais: 'Não sente dor nem medo, mas se distrai com barulho de metal. Nem sempre quer matar; às vezes só quer que alguém escute.',
  },
  contrabandista_do_sal: {
    historia: 'Leva sal sem o selo da guilda de Mareu pelos caminhos dos baixios. A guilda caça os contrabandistas, e às vezes compra deles o que não quer comprar à luz do dia.',
    sinais: 'Carrega mais faca do que carga. Prefere pagar para passar a lutar; lutando, luta sujo.',
  },

  // ─────────────────────────────── Os mortos e o que a Leva devolveu errado
  ghoul: {
    historia: 'O que a cripta cospe quando é alimentada. As irmãs de São Vandro dizem que carniçal não nasce: é gente morta que alguém deixou com fome.',
    sinais: 'Garra imunda que apodrece a ferida. Fogo e sal benzido o fazem recuar; lâmina comum corta, mas demora.',
  },
  morto_ambulante: {
    historia: 'Alguém que deveria estar descansando. No vale há uma crença que ninguém diz em voz alta: que alguns são os meninos que a Leva levou, voltando pelo caminho errado.',
    sinais: 'Lento e insistente. Não para por dor; para quando o corpo não se sustenta mais. Não olhe o rosto por muito tempo.',
  },
  esqueleto_da_cova: {
    historia: 'Sai do cemitério quando o selo sob a capela racha um pouco mais. Oda, a coveira, jura que enterra bem; os esqueletos discordam.',
    sinais: 'Golpe cortante escorrega nas costelas. Maça e martelo resolvem; quebrar o crânio acaba com ele.',
  },
  carnical_de_cova: {
    historia: 'Come o que Oda enterra, e às vezes não espera. Cresce na terra funda do cemitério velho, onde a vila enterrou os mortos da peste.',
    sinais: 'Ataca de baixo, de dentro da cova aberta. Luz e barulho de pá o afastam por uma noite.',
  },
  afogado: {
    historia: 'Vem do lago devagar, porque não tem pressa nem fôlego a perder. As pescadoras não pescam na parte funda desde a noite da ponte: dizem que os afogados daquela noite ainda estão procurando a margem.',
    sinais: 'Pesado de água, forte no abraço. Não deixe que o arraste para a água. Fora dela, cansa.',
  },
  sombra_de_mir: {
    historia: 'Tem forma de gente até você tentar lembrar de qual gente. Nasce nas Ruínas de Mir, onde o fogo não queimou só casas.',
    sinais: 'Não sangra e não para com golpe comum. Magia e prata a ferem; a lembrança de um nome verdadeiro, dizem, a desfaz.',
  },
  fogo_fatuo: {
    historia: 'Uma luz gentil que quer muito que você a siga. As mães do vale dizem às filhas que é a alma de quem se perdeu no charco, procurando companhia.',
    sinais: 'Nunca vá atrás. Ele leva ao lodo fundo e ao que mora lá. Parado, perde o interesse.',
  },
  gargula_partida: {
    historia: 'Estátua da capela velha de Mir que acordou sem as asas. Anda pelas ruínas como quem procura a torre onde ficava.',
    sinais: 'Pedra não sente corte. Martelo, fogo arcano ou o próprio peso dela contra o chão — quando cai, custa a levantar.',
  },

  // ─────────────────────────────── Os que têm nome no vale
  vess_fiador: {
    historia: 'Vess empresta a quem ninguém mais empresta, e cobra do jeito que ninguém mais cobra. A Corrente no cinto dela faz a pessoa esquecer o que Vess quiser que ela esqueça — inclusive a própria dívida, quando convém a Vess.',
    sinais: 'Nunca ergue a voz. Luta com a Corrente, que apaga um laço seu por golpe. Ganhar dela em aposta é possível; enganá-la, não.',
  },
  o_afogado_do_espelho: {
    historia: 'Sobe do lago com a roupa de domingo e o rosto de alguém que a vila enterrou de caixão fechado. Cada família que o viu jura que era o seu.',
    sinais: 'Espelha quem luta com ele: a guarda, o golpe, o medo. A água do espelho que ele deixa ao morrer é das coisas mais caras do vale.',
  },
  a_que_queimou_mir: {
    historia: 'A que acendeu o fogo, ou a que o fogo deixou. Anda entre as colunas caídas sem levantar cinza, e o calor chega antes dela.',
    sinais: 'Tudo perto dela arde. Água benta e distância ajudam; quem fica muito perto, queima por dentro.',
  },
  o_selado: {
    historia: 'O que Sarine trancou embaixo da capela, e que puxa os filhos do vale até a ponte. O selo rachou uma vez, na noite em que a ponte caiu. Não tem forma fixa porque nunca precisou de uma.',
    sinais: 'Não se vence o Selado com força só. Quem desce sem o que Sarine deixou escrito não volta para contar.',
  },

  // ─────────────────────────────── Onis sem nome
  oni_da_estrada: {
    historia: 'A Casa Sem Nome na Névoa conta dezenas deles pelos caminhos do continente: gente que alguém transformou e soltou para comer sozinha. Caçam de noite, na estrada, onde ninguém ouve.',
    sinais: 'A carne fecha logo depois do corte. Só lâmina Nichirin no pescoço ou o sol o matam de vez; o resto só o atrasa.',
  },
  oni_faminto: {
    historia: 'Magro demais até para um oni: um que nunca comeu o bastante desde que virou isso. A Casa Sem Nome diz que os famintos ainda lembram de quem eram, e que isso dói neles.',
    sinais: 'Ataca por desespero, e desespero é descuidado. Fraco para oni; ainda assim, só morre pelo pescoço ou pelo sol.',
  },
  oni_sussurrante: {
    historia: 'Fala baixo, perto do ouvido, antes de aparecer. As meninas de Halvet contam histórias dele para assustar as menores; as caçadoras não acham graça.',
    sinais: 'Some entre as sombras e prefere fugir a lutar. Luz forte o deixa sem esconderijo.',
  },
  oni_ancestral: {
    historia: 'Velho demais para ter um nome que alguém lembre. A carne se reorganiza sozinha embaixo da pele. A Casa Sem Nome tem um registro dele de antes de Mir queimar.',
    sinais: 'Regenera rápido demais para golpe fraco. Só o pescoço, de uma vez, com lâmina que o sol forjou.',
  },

  // ─────────────────────────────── Os guardiões das expedições
  sentinela_de_basalto: {
    historia: 'Posta pela rainha diante da galeria onde esconderam a coroa de Valtorius, quando o reino ficou sem rei. Não dorme, não come, e não reconhece rainha nenhuma desde então.',
    sinais: 'Pedra que anda, sem sangue de oni. Lenta para virar; quem a rodeia encontra as juntas.',
  },
  espadachim_sem_bandeira: {
    historia: 'Uma veterana de caravanas que vende a lâmina e exige duelo de quem atravessa o posto dela no acampamento. No cinto, embainhada, uma cimitarra que não é dela: a Lâmina de Idrin.',
    sinais: 'Duelista honesta: aceita rendição e não bate em quem caiu. Lê a guarda do outro em três golpes.',
  },
  quimera_do_desfiladeiro: {
    historia: 'Caça nas pedras altas e deixa os restos pendurados nas árvores, como despensa. Entre os ossos do ninho, há um arco que ninguém conseguiu alcançar.',
    sinais: 'Ataca de cima e de trás. Cada cabeça tem sua vontade; quem faz uma brigar com a outra ganha um instante.',
  },
  arauto_da_cripta: {
    historia: 'Um morto armado, de juramento, que marcha no ossuário desde que enterraram São Vandro com a lança. A madre diz que ele não defende a lança dos vivos: defende os vivos do que a lança lembra.',
    sinais: 'A marcha faz o ossuário tremer, e os outros mortos acordam com ela. Silenciar a cripta antes de enfrentá-lo muda a luta.',
  },
  colosso_da_mina: {
    historia: 'A máquina de uma gente que cavou Corveira antes das sete casas. Acordou no desabamento do terraço quarto e ficou de pé em cima do lugar onde o Quebra-Rocha caiu.',
    sinais: 'O punho fecha túnel. Ele não sai da galeria: quem luta perto da saída tem para onde recuar.',
  },
  guardia_do_horizonte: {
    historia: 'A única aluna que venceu Bai Long. Subiu a torre para provar alguma coisa e ficou guardando a passagem de cima, com as manoplas do mestre nas mãos.',
    sinais: 'A lâmina descreve círculos curtos e as manoplas quebram arma. Quem luta desarmado com ela, ela respeita — e bate mais forte.',
  },
  draco_das_cinzas: {
    historia: 'O que sobrou do fogo de Mir: uma fera que guarda calor sob as escamas e dorme sobre as cinzas mais quentes das ruínas. Não é oni e caça de dia. No meio da ninhada de brasas brilha uma lâmina.',
    sinais: 'O sopro é brasa viva. Água, lama e distância; de perto, a barriga é mais fina que o dorso.',
  },
  cavaleira_do_eclipse: {
    historia: 'Uma duelista que ninguém sabe de onde veio, com a espada do último rei no cinto. Diz que a achou fincada numa coluna de Mir, apontando para onde o fogo começou, e que só a desembainha contra quem está à altura.',
    sinais: 'Arte e aço no mesmo golpe. Ela avalia antes de lutar; quem chega ferido, ela manda embora.',
  },
  arconte_de_vidro: {
    historia: 'O constructo que vigia o salão de baixo da Torre do Vigia. Tem as rachaduras que a Rainha Ladra deixou nele, e guarda o que tirou de cada um que tentou roubar o salão.',
    sinais: 'As rachaduras mudam o ritmo dos golpes. Golpe contundente na rachadura certa faz o resto do vidro ceder.',
  },
  besta_do_primeiro_inverno: {
    historia: 'Antiga demais para fugir de gente. As velhas de Lenha Alta dizem que ela já estava na mata quando o primeiro inverno veio, e que a mata profunda só existe porque ela não deixa ninguém entrar.',
    sinais: 'Imensa e paciente. Não persegue quem sai da mata. Quem entra, entra sabendo.',
  },

  // ─────────────────────────────── As presas dos contratos
  lobo_alpha_val_cinza: {
    historia: 'Um lobo cinzento do tamanho de um potro que tomou as matilhas errantes da Mata de Corvos e aprendeu que carroça de grão é presa fácil. As mercadoras da Feira Coberta pagam pela cabeça dele.',
    sinais: 'Ataca a mula, não o condutor, e deixa a matilha terminar. Óleo contra feras na lâmina encurta a luta.',
  },
  gargula_abissal_mir: {
    historia: 'Diferente da gárgula partida, esta ainda tem asas, e desce das torres das ruínas sobre os peregrinos no fim da tarde. A Capela de São Vandro paga pelo coração de pedra dela.',
    sinais: 'Dorme no alto da torre quebrada enquanto há sol. Enxofre a fere como a nenhuma outra coisa.',
  },
  oni_carniceiro_fronteira: {
    historia: 'Um oni velho, de chifre quebrado, que mora nas névoas do Juncal e leva as pescadoras que saem cedo demais. As pescadoras de Juncal de Baixo juntaram o dinheiro do contrato moeda por moeda.',
    sinais: 'A carne regenera sob a névoa. Glicínia na lâmina e o pescoço, de uma vez.',
  },
  quimera_do_sulco: {
    historia: 'Três cabeças, asas de couro e um ferrão, aninhada nas ravinas do Passo do Lobo. A Casa Tessel paga para tirar o que nenhuma patrulha consegue alcançar.',
    sinais: 'Ataca quando o vento sopra do passo. O ferrão envenena; enxofre na lâmina e costas contra a pedra.',
  },

  // ─────────────────────────────── As Luas e o que a Casa Sem Nome sabe delas
  lua_inferior_seis: {
    historia: 'A Sexta Lua Inferior é o posto que mais troca de dono. A Casa Sem Nome sabe que Kamanue anda pelas estradas do continente, e que tem medo de quem o pôs ali mais do que de qualquer caçador.',
    sinais: 'Garras e pressa. Quer provar o posto, e quem quer provar se expõe.',
  },
  lua_inferior_cinco: {
    historia: 'Rui montou uma "família" de onis na mata, dando rosto e papel a cada um, e castiga quem não faz o papel direito. A Casa Sem Nome perdeu uma equipe inteira de caçadores nos fios dele.',
    sinais: 'Os fios cortam aço comum. Só o pescoço, e o pescoço dele é mais duro que os fios.',
  },
  lua_inferior_quatro: {
    historia: 'Mukago viu o próprio mestre matar Luas Inferiores por menos que um erro. Luta como quem sabe que recuar também é morrer.',
    sinais: 'Não recua. Cansa-a e espere o golpe desesperado.',
  },
  lua_inferior_tres: {
    historia: 'Wakuraba vive olhando para trás. A Casa Sem Nome acha que é por medo de quem está acima dele, não de quem está na frente.',
    sinais: 'Rápido e desconfiado, muda de lugar antes de cada golpe. Quem mantém a posição o obriga a vir.',
  },
  lua_inferior_dois: {
    historia: 'Rokuro pede sangue a quem está acima sempre que perde. Um dia vão cansar de dar.',
    sinais: 'Forte e lento. Bate como quem derruba porta; não esteja atrás da porta.',
  },
  lua_inferior_um: {
    historia: 'Enmu faz sonhar. A Casa Sem Nome tem cartas de caçadores que pararam de lutar no meio do combate porque, no sonho, a família deles estava viva.',
    sinais: 'Não luta de frente. Acordar é a luta: dor e lembrança do que é real quebram o sonho.',
  },
  lua_superior_seis: {
    historia: 'Gyutaro e Daki são dois e são um: a Sexta Lua Superior. Viveram na miséria de um bairro de prazeres de uma cidade grande do sul antes de virarem isso.',
    sinais: 'O veneno das foices não fecha a ferida. Os dois precisam cair juntos: um pescoço sozinho não basta.',
  },
  daki: {
    historia: 'A irmã de Gyutaro. As faixas de seda dela guardam gente viva dentro, como quem guarda comida.',
    sinais: 'Só morre com o irmão, no mesmo instante. Cortar as faixas liberta quem está preso nelas.',
  },
  lua_superior_cinco: {
    historia: 'Gyokko chama os próprios vasos de obras-primas. A Casa Sem Nome desconfia que ele ataca vilas de artesãs só para ter plateia.',
    sinais: 'Some num vaso e sai em outro. Quebre os vasos antes de procurar o corpo.',
  },
  lua_superior_quatro: {
    historia: 'Hantengu chora de medo e se divide em emoções que lutam por ele. Nunca assumiu a culpa de nada, nem quando era gente.',
    sinais: 'Os pedaços não são ele. O verdadeiro é pequeno e se esconde; ache-o e corte.',
  },
  lua_superior_tres: {
    historia: 'Akaza detesta os fracos com um ódio que parece antigo, e oferece a eternidade a quem luta bem. Foi gente que prometeu proteger alguém, e não protegeu.',
    sinais: 'A bússola no chão lê a intenção de quem luta. Sem intenção — o golpe sem pensar — ele não vê chegar.',
  },
  lua_superior_dois: {
    historia: 'Doma fundou uma seita e come os fiéis com ternura. Não sente nada, e sabe fingir tudo.',
    sinais: 'A geada dele queima os pulmões: não respire perto. Veneno de glicínia o atrasa mais do que ele admite.',
  },
  lua_superior_um: {
    historia: 'Kokushibo foi caçador, da mesma casa de respiração que a primeira. Trocou tudo pela eternidade e pela lâmina da própria carne.',
    sinais: 'As luas do corte ficam no ar depois do golpe. Distância não protege; só estar onde ele não espera.',
  },
  muzan: {
    historia: 'Todo oni que existe veio do sangue dele. Anda entre as pessoas com rostos diferentes há mil anos. A Casa Sem Nome existe para uma coisa só: o dia em que o sol o encontrar.',
    sinais: 'Nada o mata além do sol. Tudo o resto é ganhar tempo até o amanhecer.',
  },
  nakime: {
    historia: 'A tocadora de biwa que guarda o Castelo Infinito. Cada nota muda o castelo de lugar, e quem entra junto sai separado.',
    sinais: 'Enquanto ela toca, o chão não é chão. Chegar até ela é a luta inteira.',
  },
  kyogai: {
    historia: 'Escrevia histórias quando era gente, e ninguém quis ler. Guarda o rancor junto com os tambores que cresceram do corpo dele.',
    sinais: 'Cada batida gira o quarto. Aprender o ritmo dos tambores é aprender onde vai estar o chão.',
  },
  kaigaku: {
    historia: 'Foi aluno da respiração do Trovão e trocou o mestre por uma lua no olho. A Casa Sem Nome guarda o nome dele junto com o do mestre, que pagou pela traição com a vida.',
    sinais: 'Ainda luta como espadachim do Trovão, rápido e em linha reta. O relâmpago preto queima por dentro de quem ele toca.',
  },
  ubume: {
    historia: 'Uma antiga Lua Inferior que chega com o rosto de quem você esperava ver. O que ela mostra não está ali.',
    sinais: 'Confie no corte que você sente, não no que você vê.',
  },
  hairo: {
    historia: 'Uma antiga Lua Inferior que tira armas da própria sombra e as larga quando acabam. Perdeu o posto e ainda luta como se tivesse um arsenal.',
    sinais: 'Cada arma nova tem um alcance diferente. Luz forte encurta a sombra de onde elas saem.',
  },
  oni_da_mao: {
    historia: 'Conta as vítimas nos dedos e já não tem dedos que bastem. A Casa Sem Nome tem um registro dele de décadas atrás, na mesma montanha onde treina as recrutas.',
    sinais: 'Os braços protegem o pescoço. Corte os braços primeiro, e rápido: crescem de volta.',
  },
  oni_do_pantano: {
    historia: 'Afunda no chão como se fosse água e sai atrás de você. Leva moças na véspera do casamento, e ninguém sabe por quê.',
    sinais: 'Divide-se em três quando tem fome. Chão firme o obriga a sair; pântano é a casa dele.',
  },
  susamaru: {
    historia: 'Ri como criança e joga bolas bordadas que arrancam pedaços de muro. Quer brincar até alguém parar de se mexer.',
    sinais: 'As bolas voltam para a mão dela. Quem para de fugir e corta a trajetória a deixa sem brinquedo.',
  },
  yahaba: {
    historia: 'Tem olhos nas palmas das mãos e vê setas que ninguém mais vê. Anda sempre com Susamaru.',
    sinais: 'As setas puxam o corpo e a lâmina. Cortar as setas antes do golpe, ou fechar os olhos das mãos dele.',
  },
};
