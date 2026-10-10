// ARCANUM · Cenário Vaelhorn — medieval sombrio (GDD §6).
import type { Cenario } from '../../engine/types';

export const vaelhorn: Cenario = {
  id: 'vaelhorn',
  nome: 'Vaelhorn',
  genero: 'Medieval sombrio',
  ancoraCalendario: 'desde que a ponte caiu',
  nomesAtributos: {
    fisico: 'Força',
    precisao: 'Destreza',
    resiliencia: 'Constituição',
    raciocinio: 'Inteligência',
    percepcao: 'Sabedoria',
    social: 'Carisma',
  },
  recursos: [
    { id: 'mana', nome: 'Mana' },
    { id: 'vigor', nome: 'Vigor' },
  ],
  pressoes: [
    { id: 'sanidade', nome: 'Sanidade', descricao: 'quanto mais alta, mais perto da ruptura da mente' },
    { id: 'corrupcao', nome: 'Corrupção', descricao: 'a mancha que o pacto e o sangue deixam' },
  ],
  eixosRelacao: [
    { id: 'disposicao', nome: 'Disposição' },
    { id: 'confianca', nome: 'Confiança' },
    { id: 'medo', nome: 'Medo' },
  ],
  acentoCor: '#CFA82D', // ouro
  k: 4,
  tabuCentral: 'heresia contra a Ordem do Santo Selo, deserção e feitiçaria são crimes capitais',
  premissa: [
    'A LEVA. Há vinte anos, Mir queimou numa noite só, e o que saiu do fogo pediu os filhos. Naquela mesma noite, todo homem feito de Halvet ' +
      'levantou da cama, caminhou até a ponte e entrou no rio. Ninguém o obrigou. Desde então, cada menino nascido no vale faz o mesmo no ' +
      'inverno em que completa dezoito anos, como quem lembra de um combinado que nunca fez. Nenhum volta, ou volta errado.',
    'Por isso o vale é das mulheres. Foram elas que ficaram, enterraram e herdaram. Em vinte anos aprenderam a forja, a rede, a lança e o ' +
      'livro de dívidas, e hoje toda profissão de Halvet tem nome de mulher. As mais velhas ainda lembram do vale com homens; as moças, não.',
    'O SELO. Sarine, uma arcanista sem casa, desceu sob a Capela de São Vandro e selou o que puxa os meninos. A Leva ficou mais lenta, mas ' +
      'não parou. Na noite em que o selo rachou pela primeira vez, a ponte caiu, e o vale passou a contar os dias a partir dali. Em volta do ' +
      'selo cresceu a Ordem do Santo Selo, que prega que a Leva é penitência e que mãe que esconde o filho condena o vale inteiro.',
    'A LEVA DA MARCA. Do outro lado do rio, a Casa Tessel tem a sua própria leva, que nada tem de mistério: recruta à força os rapazes das ' +
      'terras da Marca para a guarnição e para as galerias de Corveira, e vende a isenção a quem pode pagar. Tessel e a Ordem usam a Leva ' +
      'verdadeira de desculpa para a deles, e quem confunde as duas é quem lucra.',
    'O JOGADOR é homem e é de fora. Veio pela estrada do sal e não deve nada ao vale, nem à ponte. Faz anos que nenhum homem adulto dorme ' +
      'duas noites em Halvet. Metade do vale acha que você quebra o ciclo; a outra metade acha que você o alimenta. A guarda da Marca vê em ' +
      'você um desertor, e a Ordem, uma heresia que anda.',
    'Os inimigos vêm de fora ou vêm de volta: salteadores da estrada, desertores sem bandeira, fiscais da Marca, onis que a Casa Sem Nome ' +
      'na Névoa caça, e o que a Leva levou e devolveu errado. Esses podem ser homens. A gente do vale, não.',
    'Desejo aqui é assunto de adulto e de escolha. Nenhuma mulher de Halvet deve nada a você, e nenhuma finge o contrário. O que acontece ' +
      'acontece porque as duas partes quiseram, e o vale comenta no dia seguinte.',
  ],
};
