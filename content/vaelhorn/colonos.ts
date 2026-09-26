// ARCANUM · Quem chega a uma colônia (sessão 57, etapa B).
//
// Cada arquétipo é uma pessoa possível do mundo que já existe: a salineira que
// cumpriu pena, a viúva de Rede Rota, a desertora do Forte Agulha, a mineira
// que saiu viva do terraço quarto. Diz de onde vem, o que sabe fazer (0 a 5
// por ofício), o temperamento mais provável e duas histórias possíveis — a
// engine (engine/colonos.ts) sorteia uma, com o nome.
//
// A maioria é mulher, porque o vale e o continente em volta são das mulheres;
// os homens que aparecem vêm de fora, pela estrada do sal, e o texto diz isso.
import type { AnimalColonia } from './sitios';

export type OficioColonia = 'lavoura' | 'rebanho' | 'obras' | 'guarda' | 'cura' | 'comercio' | 'oficina' | 'caca';
export type Temperamento = 'trabalhadora' | 'briguenta' | 'ambiciosa' | 'leal' | 'preguicosa' | 'devota' | 'esperta' | 'medrosa';

export type ArquetipoColono = {
  id: string;
  /** Epíteto que vira sobrenome: "Dagna, a Salineira". */
  epiteto: string;
  genero: 'f' | 'm';
  idade: [number, number];
  aptidoes: Partial<Record<OficioColonia, number>>;
  temperamentos: Temperamento[];
  historias: [string, string];
  /** Regiões de onde costuma vir (vazio = qualquer). Pesa na chance por sítio. */
  regioes?: string[];
  /** Traz animais quando chega. */
  traz?: Partial<Record<AnimalColonia, number>>;
};

export const ARQUETIPOS_COLONO: ArquetipoColono[] = [
  { id: 'salineira', epiteto: 'a Salineira', genero: 'f', idade: [25, 45], aptidoes: { obras: 3, rebanho: 1, comercio: 1 }, temperamentos: ['trabalhadora', 'leal', 'briguenta'], regioes: ['Costa de Mareu'],
    historias: ['Cumpriu pena nas salinas do Porto do Sal e saiu com as mãos rachadas e mais nada. Quer um lugar onde o nome da família não esteja em livro nenhum.', 'Filha de degredada, nasceu na salina e nunca saiu dela até agora. Trabalha como quem ainda está devendo.'] },
  { id: 'viuva_pescadora', epiteto: 'de Rede Rota', genero: 'f', idade: [30, 55], aptidoes: { caca: 4, obras: 1 }, temperamentos: ['leal', 'medrosa', 'trabalhadora'], regioes: ['Costa de Mareu'],
    historias: ['O barco da família voltou sem ninguém dentro numa manhã de névoa. Vendeu a rede para pagar a guilda e veio procurar água onde ninguém cobre por ela.', 'Pescou a vida inteira em Rede Rota até a guilda tomar o ponto da enseada. Diz que peixe se acha em qualquer água, desde que ninguém esteja olhando.'] },
  { id: 'desertora', epiteto: 'do Forte', genero: 'f', idade: [22, 40], aptidoes: { guarda: 4, obras: 2 }, temperamentos: ['briguenta', 'leal', 'ambiciosa'], regioes: ['Marca de Tessel'],
    historias: ['Trocou a forca pelo serviço no Forte Agulha e, na segunda queda, trocou o serviço pela estrada. Sabe segurar uma porta e não pergunta de quem é.', 'Guardou o portão do Forte Agulha por seis invernos. No sétimo, a marca mandou menos farinha do que gente, e ela foi embora antes de ter de escolher quem comia.'] },
  { id: 'mineira_terraco', epiteto: 'do Terraço', genero: 'f', idade: [28, 50], aptidoes: { obras: 4, oficina: 2 }, temperamentos: ['trabalhadora', 'medrosa', 'leal'], regioes: ['Planalto de Corveira'],
    historias: ['Saiu viva do desabamento do terraço quarto e nunca mais desceu em galeria. Constrói bem qualquer coisa que fique em cima da terra.', 'Escorava galeria em Corveira até o dia em que a escora não segurou. Conta os pregos de cada viga que ergue, em voz alta.'] },
  { id: 'curandeira', epiteto: 'das Ervas', genero: 'f', idade: [35, 60], aptidoes: { cura: 4, lavoura: 1 }, temperamentos: ['devota', 'esperta', 'leal'],
    historias: ['Tinha banca de ervas numa feira até uma paciente morrer e a feira decidir de quem era a culpa. Traz as sementes numa bolsa costurada por dentro do casaco.', 'Aprendeu a curar com a mãe, que aprendeu com a avó, e as três trataram febre de graça. Ela quer, pela primeira vez, ser paga.'] },
  { id: 'pastora', epiteto: 'a Pastora', genero: 'f', idade: [20, 50], aptidoes: { rebanho: 4, caca: 1 }, temperamentos: ['trabalhadora', 'leal', 'medrosa'], regioes: ['Bosque de Vintra', 'Planalto de Corveira'], traz: { cabra: 2 },
    historias: ['Perdeu o rebanho para os lobos num inverno de Lenha Alta e chegou com as duas cabras que sobraram. Conhece cada animal pelo nome e pelo jeito de mancar.', 'Dormiu fora com as ovelhas a vida inteira. Diz que dorme melhor no pasto do que em casa, e que isso nunca foi problema até agora.'] },
  { id: 'carpinteira', epiteto: 'de Vintra', genero: 'f', idade: [25, 50], aptidoes: { obras: 4, oficina: 3 }, temperamentos: ['trabalhadora', 'ambiciosa', 'briguenta'], regioes: ['Bosque de Vintra'],
    historias: ['Ajudou a reconstruir Vintra depois da segunda queimada e não quis estar lá para a terceira. Traz a própria serra e não empresta.', 'Filha de carpinteira da paliçada de Vintra. Quer construir alguma coisa que ninguém tenha tido de construir duas vezes.'] },
  { id: 'tropeira', epiteto: 'a Tropeira', genero: 'f', idade: [30, 55], aptidoes: { comercio: 3, rebanho: 3 }, temperamentos: ['esperta', 'ambiciosa', 'leal'], regioes: ['Ermo de Solgar', 'Bosque de Vintra'], traz: { mula: 2 },
    historias: ['Levou carga pelo ermo por vinte anos e cansou de dormir em parada dos outros. Chegou com duas mulas e a lista de quem compra o quê em cada vila.', 'Fazia a rota do carvão até a fundição cobrar uma dívida já paga. Agora prefere trabalhar para quem ela possa olhar na cara.'] },
  { id: 'ferreira_aprendiz', epiteto: 'do Ferro Velho', genero: 'f', idade: [17, 30], aptidoes: { oficina: 4, obras: 1 }, temperamentos: ['ambiciosa', 'trabalhadora', 'esperta'], regioes: ['Planalto de Corveira'],
    historias: ['Aprendeu o ferro recuperando sucata em Ferro Velho e quer uma forja que não dependa do lixo de Corveira.', 'Foi aprendiz de uma ferreira que nunca lhe deixou fechar uma peça sozinha. Veio para fechar todas.'] },
  { id: 'lavradora', epiteto: 'de Pedravel', genero: 'f', idade: [25, 55], aptidoes: { lavoura: 4, rebanho: 1 }, temperamentos: ['trabalhadora', 'leal', 'medrosa'], regioes: ['Marca de Tessel'],
    historias: ['A família dela lavrou a mesma terra em Pedravel por três gerações, até o ano em que a vila não teve grão para pagar a isenção da leva. Veio com uma enxada e um saco de semente.', 'Planta em qualquer chão que não seja pedra, e em pedra também, se lhe derem tempo. Não fala muito, nem precisa.'] },
  { id: 'ceifeira', epiteto: 'a Ceifeira', genero: 'f', idade: [20, 45], aptidoes: { lavoura: 3, guarda: 1 }, temperamentos: ['briguenta', 'trabalhadora', 'ambiciosa'], regioes: ['Marca de Tessel'],
    historias: ['Cansou de ceifar trigo que era do marechal. Quer ceifar trigo que seja de alguém que ela conheça.', 'Ceifou em fila nos Campos da Ceifa desde menina, curvada, e decidiu que a próxima colheita ia ser de pé.'] },
  { id: 'contrabandista', epiteto: 'do Cais', genero: 'f', idade: [25, 45], aptidoes: { comercio: 4, guarda: 1 }, temperamentos: ['esperta', 'ambiciosa', 'briguenta'], regioes: ['Costa de Mareu'],
    historias: ['Levou sal sem selo pela trilha costeira até a guilda pôr o nome dela na lista. Diz que é comerciante; é, de certo modo.', 'Sabe o preço de tudo e o caminho de tudo. O que ela não diz é por que precisa de um lugar onde a guilda não chegue.'] },
  { id: 'freira', epiteto: 'a Irmã', genero: 'f', idade: [25, 50], aptidoes: { cura: 3, lavoura: 1 }, temperamentos: ['devota', 'leal', 'medrosa'], regioes: ['Vale de Halvet'],
    historias: ['Deixou a Capela de São Vandro sem pedir licença à madre. Quer rezar num lugar onde a reza não seja contra alguma coisa.', 'Foi mandada da capela para ajudar numa vila que morreu de febre antes de ela chegar. Seguiu andando e parou aqui.'] },
  { id: 'cacadora', epiteto: 'da Mata', genero: 'f', idade: [20, 40], aptidoes: { caca: 4, guarda: 2 }, temperamentos: ['leal', 'briguenta', 'esperta'], regioes: ['Bosque de Vintra', 'Vale de Halvet'],
    historias: ['Caçou na Mata de Corvos até a mata ficar perigosa demais até para ela. Traz arco, faca e a pele do último lobo.', 'Rastreia qualquer coisa que tenha pés. Diz que gente é mais fácil de rastrear do que bicho, e não diz como sabe.'] },
  { id: 'orfa', epiteto: 'a Menina', genero: 'f', idade: [13, 16], aptidoes: { lavoura: 1, rebanho: 1 }, temperamentos: ['medrosa', 'esperta', 'trabalhadora'],
    historias: ['Chegou sozinha, com os pés em carne viva e o nome de uma tia que ninguém aqui conhece. Não sabe fazer muita coisa, mas aprende vendo.', 'Foi criada por uma vizinha que morreu no inverno. Andou atrás da primeira carroça que passou, e a carroça vinha para cá.'] },
  { id: 'parteira', epiteto: 'a Velha', genero: 'f', idade: [55, 70], aptidoes: { cura: 3, lavoura: 1 }, temperamentos: ['leal', 'devota', 'esperta'],
    historias: ['Trouxe ao mundo metade de uma vila que não existe mais. Diz que uma colônia sem parteira não é colônia, é acampamento.', 'Parteira há quarenta anos. Sabe o nome de todas as crianças que ajudou a nascer, e das que não conseguiu.'] },
  { id: 'mae_da_leva', epiteto: 'de Halvet', genero: 'f', idade: [40, 60], aptidoes: { lavoura: 2, cura: 1 }, temperamentos: ['devota', 'leal', 'medrosa'], regioes: ['Vale de Halvet'],
    historias: ['O filho foi levado acorrentado pelo Tributo de Sangue no inverno dos dezoito, como os outros. Ela saiu do vale no mesmo mês para não ter de ver a estrada da Coroa nunca mais.', 'Criou três filhos e a Leva levou os três, um por inverno. Não chora; planta, e conta as covas pelo nome.'] },
  { id: 'escriva', epiteto: 'a Escrivã', genero: 'f', idade: [25, 50], aptidoes: { comercio: 3, obras: 1 }, temperamentos: ['esperta', 'ambiciosa', 'leal'], regioes: ['Planalto de Corveira', 'Costa de Mareu'],
    historias: ['Perdeu o posto no registro de Corveira por se recusar a apagar um nome. Sabe contar, escrever e guardar o que está escrito.', 'Escreveu contratos para uma casa que nunca pagou os dela. Agora quer escrever os de alguém que pague.'] },
  { id: 'cozinheira', epiteto: 'da Guarnição', genero: 'f', idade: [30, 55], aptidoes: { lavoura: 2, cura: 1, comercio: 1 }, temperamentos: ['trabalhadora', 'leal', 'briguenta'], regioes: ['Marca de Tessel'],
    historias: ['Cozinhou para a guarnição do Forte Agulha e aprendeu a fazer quarenta pratos com o que dá para dez. Diz que fome é problema de conta, não de comida.', 'Racionou farinha no Forte Agulha durante uma queda inteira e não perdoa desperdício. Nem de comida, nem de gente.'] },
  { id: 'oleira', epiteto: 'a Oleira', genero: 'f', idade: [25, 50], aptidoes: { oficina: 3, obras: 2 }, temperamentos: ['trabalhadora', 'esperta', 'devota'], regioes: ['Planalto de Corveira'],
    historias: ['Fazia potes e telhas no Terraço Sexto para os sobreviventes do desabamento. Quer um forno onde ninguém cobre pelo barro.', 'Tem as mãos sempre sujas de barro e o humor sempre limpo. Diz que qualquer casa começa com uma telha.'] },
  { id: 'ladra', epiteto: 'Mão-Leve', genero: 'f', idade: [18, 35], aptidoes: { comercio: 2, guarda: 2 }, temperamentos: ['esperta', 'briguenta', 'ambiciosa'],
    historias: ['Roubou em três cidades e foi pega em duas. Jura que parou; ninguém acredita, e ela acha graça.', 'Conhecida de todos na vila de onde veio, pelo que levava dos outros. Diz que numa colônia nova não há nada de ninguém ainda, então não é roubo.'] },
  { id: 'desertor', epiteto: 'de Fora', genero: 'm', idade: [25, 45], aptidoes: { guarda: 4, obras: 2 }, temperamentos: ['briguenta', 'leal', 'medrosa'],
    historias: ['Homem de fora, desertor de uma guerra do sul, chegou pela estrada do sal com uma lança e sem bandeira. Olha para as mulheres da colônia como quem espera ser mandado embora.', 'Veio de longe, onde os homens ficam. Lutou por um senhor que perdeu, e prefere não dizer qual. Sabe cavar trincheira e segurar uma linha.'] },
  { id: 'tropeiro_de_fora', epiteto: 'do Litoral', genero: 'm', idade: [30, 50], aptidoes: { comercio: 3, rebanho: 2 }, temperamentos: ['esperta', 'leal', 'ambiciosa'], traz: { cavalo: 1 },
    historias: ['Tropeiro de fora do vale, que passou pela colônia uma vez, voltou na segunda e ficou na terceira. Traz um cavalo velho e notícias de longe.', 'Homem do litoral de fora, que ouviu falar da colônia numa estalagem e veio ver se era verdade. Sabe comprar barato e vender caro, e diz isso como se fosse virtude.'] },
  { id: 'veterana', epiteto: 'Meia-Espada', genero: 'f', idade: [40, 60], aptidoes: { guarda: 3, obras: 1, cura: 1 }, temperamentos: ['leal', 'briguenta', 'devota'], regioes: ['Marca de Tessel', 'Costa de Mareu'],
    historias: ['Foi para a guerra jovem e voltou sem posto e sem metade da espada. Ensina as outras a segurar lança por comida e teto.', 'Veterana de um regimento que não existe mais. Conta a guerra para quem não pediu, mas guarda a porta como ninguém.'] },
];

/** Grupos que chegam juntos: um arquétipo principal e quantos vêm com ela. */
export type GrupoChegada = { id: string; texto: string; arquetipos: string[]; comuns: [number, number] };
export const GRUPOS_CHEGADA: GrupoChegada[] = [
  { id: 'sozinha', texto: 'Chegou sozinha.', arquetipos: [], comuns: [0, 0] },
  { id: 'com_filhas', texto: 'Chegou com as filhas.', arquetipos: [], comuns: [1, 3] },
  { id: 'irmas', texto: 'Chegaram duas irmãs.', arquetipos: ['lavradora', 'ceifeira', 'pastora', 'viuva_pescadora'], comuns: [0, 1] },
  { id: 'familia', texto: 'Chegou uma família inteira atrás dela.', arquetipos: [], comuns: [2, 4] },
  { id: 'tropa', texto: 'Chegou com um punhado de gente da mesma tropa.', arquetipos: ['desertora', 'veterana', 'desertor'], comuns: [2, 3] },
];

export const NOMES_COLONAS = ['Adela', 'Berta', 'Clara', 'Dagna', 'Edwina', 'Frida', 'Gisela', 'Hilde', 'Imke', 'Jutta', 'Karin', 'Lotte', 'Magda', 'Nella', 'Ottilie', 'Petra', 'Resa', 'Senta', 'Thea', 'Ursel', 'Vreni', 'Wilma', 'Zelda', 'Agnet', 'Bettina', 'Carlota', 'Dorte', 'Elke', 'Femke', 'Gunda', 'Hedwig', 'Ingrid', 'Jolien', 'Kaja', 'Lene', 'Mette', 'Nomi', 'Olga', 'Rosel', 'Sabine'];
export const NOMES_COLONOS = ['Anselm', 'Bertram', 'Casimir', 'Detlef', 'Emil', 'Falko', 'Gerolf', 'Harald', 'Ingo', 'Jost'];
