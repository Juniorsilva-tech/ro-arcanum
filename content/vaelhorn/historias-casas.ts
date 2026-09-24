// ARCANUM · A história das quatro casas (sessão 55).
//
// As casas tinham lema, sede, uma linha de reputação e, desde a Fase 4, gente
// com nome. Faltava o passado: de onde cada uma veio, o que perdeu, o que a
// move hoje. Aparece na seção "casas nobres" da Comunidade e vai ao narrador
// em casasPresentes. As datas seguem o que o conteúdo já dizia (o cerco de
// Tessel, dezoito anos; o desabamento de Corveira, doze).
export const HISTORIAS_CASAS: Record<string, string[]> = {
  halvet: [
    'A Casa de Halvet nasceu de uma torre que caiu. A primeira senhora construiu a casa de dois andares com a pedra que sobrou, e o lema — a pedra permanece — é menos orgulho que teimosia.',
    'Por quatro séculos foi a casa que tinha voto no conselho da estrada do sal. Cada carroça deixava uma medida de sal no marco, e o sal pagava a casa. A ponte caiu, a estrada secou, e o voto ficou sem nada para votar.',
    'Dama Valda preparou o filho, Aldren, para herdar tudo. A Leva o levou no inverno dos dezoito. Desde então ela vende as terras da vila por baixo do pano para a gente do sal, e a herdeira é Ysolde, que sabe fazer conta e sabe quanto a casa vale.',
  ],
  mareu: [
    'A Casa Mareu não tem sangue nobre: tem uma bancada. As três vilas de pescadores que viraram Mareu disputavam o galpão do Mercado do Peixe, e uma Olho-Vivo ganhou a disputa com um arpão na mão e ninguém disposto a pegar outro. A guilda do sal nasceu naquela tarde, e a casa é a guilda.',
    'A peste que veio pelo porto há quarenta anos levou um terço da cidade e deixou a guilda com as dívidas de todo mundo. Desde então, quem manda em Mareu é quem cobra, e o conselho se reúne na casa da guilda, não no palácio.',
    'A casa elege a cabeça entre as Olho-Vivo. Ansel pegou o posto quando a mãe morreu sem dizer qual filha ficava com o galpão; a irmã, Vidar, espera a eleição que ainda não houve, e a filha, Mirel, voltou de Corveira querendo uma Mareu em que o sal pague imposto como qualquer peixe.',
  ],
  corveira: [
    'Corveira pertence a sete famílias desde antes de haver registro, e as sete se chamam de casas e se comportam como reinos. Nenhuma governa sozinha: o lema é um tratado, não um desejo. Quem responde pela cidade no conselho muda por duelo, e o duelo muda a cidade.',
    'Hoje responde a casa Verrão. Doze anos atrás, as Verrão desceram para abrir o terraço quarto com o Quebra-Rocha das sete casas; o terraço veio abaixo, levou duzentas e onze pessoas, entre elas Oren, o marido de Halda. As casas pagaram as famílias em minério, não em moeda, e o machado ficou lá embaixo.',
    'Halda assinou as indenizações no dia do enterro. Há quem diga que o escoramento do nível três já cedia antes, e que houve um relatório. Halda tem medo de papel, qualquer papel que não tenha lido.',
  ],
  tessel: [
    'Tessel foi fundada como acampamento de inverno para segurar uma fronteira que já mudou de lugar três vezes. A primeira marechala Varn forjou a Gélida com a neve do passo, e desde então três gerações de Varn seguraram a marca.',
    'No cerco de dezoito anos atrás, a marechala Idrun Varn segurou a brecha da muralha oeste por trinta noites e caiu na trigésima. A filha, Odile, pegou a espada e segurou as dez que faltavam. A muralha oeste foi refeita depois, com verba que ninguém quer saber de onde veio.',
    'A casa elege a marechala pelo livro, e o livro diz que Odile nasceu primeiro. A gêmea, Ketta, é a candidata que a guarda velha prefere. A casa troca proteção por lealdade, e cobra as duas.',
  ],
};
