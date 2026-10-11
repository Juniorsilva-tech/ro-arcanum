# Bíblia da história de Vaelhorn

Decisões do dono (sessões 58 e 93): Mir queimou há vinte anos; o jogador é um homem de fora; o jogo tem vários finais. Tsukimichi é outro universo (DLC) e não entra aqui. Kimetsu entra como linha de missões secundárias.

Este documento é a referência para escrever missões. O que já existe no jogo está em `docs/HISTORIA-ATE-AQUI.md`; aqui está o que falta: a trama, os arcos e os finais. Toda missão nova deve caber nisto ou mudar este documento antes.

## As duas levas

A Leva de Halvet é sobrenatural. Há vinte anos, na noite em que Mir queimou, todos os homens feitos do vale levantaram, caminharam até a ponte e entraram no rio. Desde então cada menino nascido em Halvet faz o mesmo no inverno dos dezoito. Ninguém sabe por quê.

A leva da Marca é política. A Casa Tessel recruta à força os rapazes das terras dela para a guarnição e para as galerias de Corveira, e vende isenção (Pedravel pagou quatro anos em grão e no quinto não teve). A Ordem do Santo Selo prega que as duas são a mesma penitência. Não são, e quem as confunde lucra: Tessel ganha recruta sem revolta, a Ordem ganha mães obedientes, Corveira ganha braço barato.

## Linha do tempo

- Antes de tudo: Valtorius, o último rei de Halvern, é enterrado no templo de Mir. São Vandro desce a uma fenda embaixo do vale e a fecha com a lança. As sete terras viram as casas de hoje.
- 40 anos atrás: a peste chega pelo porto de Mareu. O galpão da quarentena é trancado com gente viva.
- 22 anos atrás: começa o inverno longo. Duas colheitas perdidas em Halvet. O conselho de Halvet, ainda de homens, procura saída.
- 20 anos atrás: Mir queima numa noite. Os homens de Halvet entram no rio. Começa a Leva. Sarine tira o menino Vell do fogo.
- 19 anos atrás: Sarine sela sob a Capela de São Vandro o que puxa os meninos. A Leva fica mais lenta. Nasce a Ordem do Santo Selo.
- 18 anos atrás: o cerco de Tessel, quarenta dias. Idrun Varn cai na trigésima noite; Odile segura as dez restantes.
- 12 anos atrás: o terraço quarto de Corveira desaba. Duzentos e onze mortos, entre eles Oren, marido de Halda Verrão. O Quebra-Rocha fica lá embaixo.
- Algum inverno entre eles: o selo racha pela primeira vez e a ponte cai. O vale passa a contar os dias "desde que a ponte caiu".
- Hoje: o jogador chega pela estrada do sal. É o primeiro homem adulto a dormir duas noites em Halvet em muitos anos.

## O segredo do centro

Vinte anos atrás, no segundo inverno de fome, os homens do conselho de Halvet desceram à fenda que São Vandro fechou, sob o templo de Mir. Pediram colheita. O que respondeu lá de baixo pediu, em troca, "o que vocês têm de mais caro". Eles entenderam ouro, assinaram e subiram.

A colheita do ano seguinte foi a maior da história do vale, e a terra de Halvet nunca mais deu pouco. O preço era outro. Na noite em que a sacerdotisa do templo descobriu o acordo e tentou desfazê-lo, Mir queimou (ela é A Que Queimou Mir), e os homens que assinaram foram os primeiros a caminhar para o rio. Desde então a coisa cobra, um menino por vez, o que o vale tem de mais caro.

O pacto vale para quem nasceu de Halvet. Um homem de fora não está no contrato. Por isso o jogador pode descer onde nenhum homem do vale pode, e por isso a coisa lá embaixo tem tanto interesse nele.

Quem sabe de partes da verdade:

- Sarine: sabe o que selou, não sabe do contrato.
- Morda: ouviu alguém rir do outro lado da ponte na noite em que ela caiu.
- Vell: ouve, nas ruínas, a voz que fala o nome dele.
- A madre Corvane: guarda o livro do templo de Mir, que a Ordem esconde.
- Dama Valda: o marido dela era de fora, por isso não assinou. O pai dela assinou.

## A trama principal

Cinco atos. Cada ato termina numa decisão que muda o mundo e abre caminhos diferentes no ato seguinte. Estimativa: 15 a 20 horas só na trama.

### Ato I: o forasteiro (Halvet)

Implementado na sessão 94 (`engine/atoI.ts`, `content/vaelhorn/atoI.ts`).

O jogador chega à Rês Enforcada pela estrada do sal e descobre, pelo jeito como o olham, onde está. O ato mostra a Leva e não explica nada.

- Abertura: no primeiro dia em que o jogador amanhece no vale, Brida, a tecelã da praça, o procura. O filho dela, Edrin, faz dezoito anos em sete dias. Ela não pode sair com ele (a Ordem vê) e ele não pode sair sozinho (a Marca recruta). Um homem de fora com um rapaz do lado passa por pai.
- Edrin não é NPC do elenco: tem dezessete anos, e o elenco só tem adultos (GDD §25). Ele existe no estado do ato e chega ao narrador pelo bloco "trama".
- No caminho: Sarine observa na taverna; Morda vira o rosto na ponte; a cripta tem um nicho aberto por dentro (pistas por lugar, só para o narrador).
- Decisão do ato, decidida pela engine na noite dos dezoito:
  - Toca do Juncal: o jogador leva Edrin a Juncal de Baixo, e Orla o esconde. A Toca segura quem está dentro: Edrin vive, preso embaixo do charco. Lá está também o filho de Cera a Surda, dado por levado há sete anos. A Toca passa a existir no mapa.
  - Ordem: entregue na capela, as irmãs o cantam até a ponte. Reputação com a capela sobe, com a praça desce, e Brida não perdoa.
  - Vigília: Edrin passa a noite com o jogador no vale. Levanta sem acordar e entra no rio. O jogador entra atrás e a correnteza o empurra de volta, como se a água não o quisesse (flag `trama.agua_recusou`, pista do Ato III: o homem de fora não está no contrato). Morda ouve.
  - Estrada: Edrin passa a noite com o jogador fora do vale. Volta andando e é achado numa vala, virado para Halvet (flag `trama.leva_alcanca_longe`: fugir não basta).
  - Nada: ele vai sozinho.
- Mudança em relação ao rascunho: o menino é do vale, não do Juncal. O conteúdo já dizia que Orla abre a Toca a quem "chega ao Juncal com um menino do vale", e que o filho de Cera a Surda vive lá há sete anos; isso fixou a regra de que a Toca protege enquanto se fica dentro.

### Ato II: as duas levas (o continente)

O jogador segue a pergunta "para onde vão os meninos que não entram no rio?" e descobre a leva da Marca.

- Pistas levam a Tessel (a isenção vendida, o livro das gêmeas Varn), a Corveira (rapazes da Marca nas galerias, o relatório queimado) e a Mareu (a guilda que financia a guarnição).
- Cada cidade é a porta de um arco de facção (abaixo). O jogador escolhe a ordem.
- Decisão do ato: com quem ele se alia para enfrentar a leva da Marca. Halvet, Tessel (Ketta, a gêmea do registro), Corveira ou Mareu (Mirel). A aliança decide quem ajuda e quem caça o jogador no ato IV.

### Ato III: Mir

O jogador entra nas Ruínas de Mir com Vell, encontra A Que Queimou Mir e o livro do templo, e descobre o contrato.

- A Que Queimou Mir pode ser derrotada ou ouvida. Ouvida, ela conta o acordo e diz onde fica a fenda.
- A Cavaleira do Eclipse guarda a entrada mais funda das ruínas com a espada de Valtorius.
- Decisão do ato: contar a verdade a alguém, ou guardá-la. Contar a Valda, à madre, a Sarine ou à Ordem muda quem controla a notícia, e a notícia muda o vale: mães que se revoltam, a Ordem que racha, Tessel que vê uma arma.

### Ato IV: o selo racha

O selo de Sarine racha de novo. A Leva acelera: meninos de quinze, de dezesseis, começam a ouvir o chamado. A Ordem aproveita o pânico; Tessel marcha sobre o vale "para manter a ordem". O jogador, os aliados do ato II e, se houver, a colônia dele seguram o vale. Este ato é o mais longo em combate e onde a colônia, as casas e os bandos entram de verdade.

- A colônia do jogador pode receber os meninos e as mães que fogem (se ele fundou fora do vale).
- A assembleia de defesa da colônia (etapa E do sistema de colônia) entra aqui.
- Decisão do ato: o que salvar primeiro, porque não dá para salvar tudo.

### Ato V: a fenda

O jogador desce sob a capela, passa pelo que Sarine selou e chega à fenda de São Vandro, onde a coisa do contrato espera. A lança de São Vandro (Arauto da cripta) e a Lâmina do Primeiro Sol (o draco) importam aqui.

## Os finais

Cada final tem um epílogo por facção (Halvet, Tessel, Corveira, Mareu, a Ordem, a colônia, a Casa Sem Nome), escolhido pelo estado do mundo no fim. Os finais não são bons ou maus; cada um cobra.

1. Desfazer o contrato. O jogador rasga o acordo com a lança de São Vandro. A Leva acaba. A terra de Halvet volta a ser o que era antes do pacto: pobre. O primeiro inverno depois disso mata de fome quem não foi preparado. Os meninos ficam; nem todos sobrevivem a ficar.
2. Selar de vez. Com Sarine, o jogador refaz o selo com algo que não racha: alguém fica lá embaixo, para sempre. Pode ser Sarine, pode ser o jogador, pode ser outro com laço forte o bastante. A Leva para enquanto o guardião durar.
3. Tomar o contrato. O jogador, que não está no acordo, assina como parte nova. A Leva para em Halvet e passa a cobrar onde ele quiser. Ele vira o dono da terra mais fértil do continente e da arma mais temida dele. Tessel se ajoelha. É o final do tirano, e o epílogo mostra o preço.
4. Êxodo. O jogador não enfrenta a coisa: leva as mães e os meninos para fora do vale, para a colônia dele ou para longe. O pacto vale para quem nasce em Halvet; quem nasce fora não ouve o chamado. Halvet esvazia, as casas perdem o vale, e a terra fértil fica para quem tiver coragem. Exige colônia forte.
5. Vender a verdade. O jogador entrega o contrato a Tessel ou à Ordem e vai embora rico. O epílogo mostra o que eles fizeram com ele.
6. Morrer tentando. Se o jogador morre na fenda, o jogo mostra o vale um ano depois, pelo estado em que ficou.

## Arcos de facção

Cada arco tem cinco a oito missões, começo, meio e fim, e um desfecho que entra no epílogo. Estimativa: 4 a 6 horas por arco. Quase tudo já está plantado nos segredos e nas famílias.

### Halvet: a pedra que permanece

- Material: a falência da casa (Teoda escreve os dois livros), a carta escondida de Maelis, Ilse que quer sair da linha, Ysolde que sabe quanto a casa vale, Aldren levado aos dezoito, o pai de Valda entre os que assinaram.
- Desfechos: a casa vendida a Mareu; a casa salva por Ysolde; a casa entregue a Maelis pela carta; a casa que se oferece para guardar o selo (liga com o final 2).

### Tessel: a gêmea do registro

- Material: Ketta e o livro com os nomes trocados (ela é a marechala no papel); a morte de Idrun pelo tônico, não pela flecha; a muralha oeste feita com verba da leva; Mira que prepara o sonífero; Quilda financiada pela capitã Roan; Pedravel e a isenção; Orla, que viu a mãe enforcada por ordem de Odile.
- Desfechos: Odile cai e Ketta assume; Ketta é presa; a leva da Marca acaba (só se o jogador expuser a verba); Tessel vira a mão armada do final 3.

### Corveira: os trinta e quatro nomes

- Material: o relatório do escoramento queimado; Fenn que assinou o laudo; Wyn que apaga nomes e guarda trinta e quatro no forro do casaco; Quilda Boca-Seca nos degraus com o registro verdadeiro; o Colosso sobre o Quebra-Rocha; o duelo de sucessão das Verrão; rapazes da Marca nas galerias.
- Desfechos: o registro lido no conselho e a casa Verrão derrubada; o Quebra-Rocha devolvido e as sete casas em paz armada; as galerias fechadas para os recrutas de Tessel.

### Mareu: o galpão trancado

- Material: a quarentena decretada tarde por Calder a pedido da guilda; Vidar que passou a tranca; Brida que perdeu a mãe lá dentro; Mirel que compra as dívidas de Rede Rota para quebrar a guilda; Halvo da Ponte com a ponta de arpão que falta no tridente; o farol apagado.
- Desfechos: a guilda quebrada por Mirel; Vidar exposta; Mareu financia o vale no ato IV ou financia Tessel.

### Juncal: a Toca

- Material: Orla e os meninos escondidos; Cera a Surda e o filho dado por levado; os juncos com nomes na viga de Cera Mão-Curta; os três que voltaram e foram à ponte assim mesmo; Bran e o fiscal afogado.
- É o arco que abre o ato I e alimenta o final 4.

### A Ordem do Santo Selo

- Material: a madre Corvane e o livro do templo de Mir; a irmã Perla; a comitiva da Ordem (`engine/familia.ts`); mães que escondem filhos.
- Desfechos: a Ordem racha quando a verdade sai; a Ordem vira dona do vale; a madre se volta contra a própria ordem.

### A colônia do jogador

O sistema de colônia (etapas A a F) é um arco por si: o lugar que o jogador funda decide o que ele pode oferecer no ato IV e se o final 4 é possível.

## Kimetsu: missões secundárias

A Casa Sem Nome na Névoa caça onis há mais tempo do que as casas do vale existem. Para o jogador, é uma linha paralela que dá poder e conhece segredos, e que não decide a trama principal.

- Entrada: a Casa só recebe quem prova que merece confiança. A trilha que some se abre depois de o jogador matar o primeiro oni da estrada.
- Linha: as Luas Inferiores, depois as Superiores, e o Castelo Infinito como fim da linha. Cada Lua é uma missão com história própria (o bestiário já tem a base).
- Ligação com a trama: a Lâmina do Primeiro Sol (com o draco nas ruínas de Mir) e o círculo de pedras da Clareira, onde onis não entram. Os onis não são a causa da Leva, e a Casa Sem Nome sabe disso; a madre já pediu ajuda a eles uma vez, e eles recusaram.
- Estimativa: 15 a 20 horas.

## Missões menores e emergentes

- Segredos com consequência (as 249 pessoas): cada segredo já tem caminho para descobrir; transformar os melhores em missões curtas de uma a três etapas.
- Contratos de monstro, caçadas de recompensa, bandos, caravanas e audiências da colônia: geradas pelo motor.
- As peças lendárias: cada uma é uma missão curta com o guardião dela.
- Estimativa: 30 horas ou mais, sem teto.

## Somando

| Camada | Horas |
| --- | --- |
| Trama principal | 15 a 20 |
| Arcos de facção (seis) | 25 a 35 |
| Kimetsu | 15 a 20 |
| Colônia | 10 a 15 |
| Menores e emergentes | 30 ou mais |

## Regras para quem escrever missão

- A engine decide; a IA narra. Toda missão grava flags e muda estado de verdade.
- Nenhum homem do vale aparece adulto e livre em Halvet, salvo os que vieram de fora.
- Nenhuma missão revela o contrato antes do ato III.
- Português do Brasil falado, sem palavra fora de época (nada de dinamite, canhão, eletricidade, "Santa Sé").
- Quem escrever confere o elenco em `docs/HISTORIA-ATE-AQUI.md` antes de pôr alguém numa cena.
