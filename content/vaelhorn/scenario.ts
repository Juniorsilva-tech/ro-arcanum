// ARCANUM · Cenário Vaelhorn — medieval sombrio (GDD §6).
import type { Cenario } from '../../engine/types';

export const vaelhorn: Cenario = {
  id: 'vaelhorn',
  nome: 'Vaelhorn',
  genero: 'Medieval sombrio',
  ancoraCalendario: 'do Santo Selo',
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
  tabuCentral: 'heresia contra a Santa Sé, deserção e feitiçaria são crimes capitais',
  premissa: [
    'A LEVA MILITAR & O TRIBUTO DE SANGUE — a verdade que explica a miséria deste vale. Há três gerações, após a grande insurreição que reduziu a cidade de Mir a cinzas, o Vale de Halvet foi derrotado pelas legiões da Marca de Tessel e condenado por heresia. ' +
      'Como pena de submissão perpétua, o Tratado da Coroa impôs a Leva Obrigatória: todo jovem que atinge dezoito anos é arrancado de sua família pelas patrulhas armadas, acorrentado em comboios e marchado para morrer como bucha de canhão nas trincheiras do norte ou escravizado nas galerias fundas das minas de Corveira. ' +
      'Nenhum homem volta vivo. Quem resiste é enforcado nas árvores da praça, e a aldeia aprendeu que a forca não perdoa.',
    'Por isso o vale é das mulheres. Não por virtude poética, mas pela crueza da guerra e da sobrevivência: foram elas que ficaram para enterrar os mortos e sustentar as casas. ' +
      'Elas herdaram a forja pesada, aprenderam a martelar o ferro, a puxar a rede de pesca no lodo, a cobrar as dívidas dos celeiros e a empunhar lanças contra saqueadores. ' +
      'Toda linhagem e ofício de Halvet passou de mãe para filha em três gerações de viuvez amarga e trabalho braçal.',
    'O CERCO DA FRONTEIRA & O SANTO SELO: A antiga ponte militar de pedra sobre a garganta do rio — por onde os comboios de recrutas e os cobradores de dízimo passavam — foi dinamitada e sabotada numa tentativa desesperada de cortar o avanço dos soldados imperiais. ' +
      'A sabotagem isolou o vale numa quarentena econômica sufocante: o tráfego agora é estrangulado pelo pedágio corrupto do Vau de Pedra, controlado por oficiais venais e contrabandistas. ' +
      'A Igreja dos Santos do Selo domina a província com terror inquisitorial, pregando que o sacrifício dos filhos é a expiação exigida pelos céus. O calendário conta os anos e dias a partir da instituição do Santo Selo.',
    'O JOGADOR é um forasteiro livre vindo das rotas de contrabando do sal, e é homem. Num vale onde nenhum homem adulto livre consegue andar sem grilhões há décadas, sua presença é um choque elétrico. ' +
      'As patrulhas veem você como um desertor foragido, um rebelde ou um mercenário perigoso que deve ser capturado ou extorquido; ' +
      'as mulheres de Halvet olham para você com desconfiança afiada, lembrança dolorosa dos filhos e maridos arrancados, desejo carnal cru e a suspeita de que você pode ser a faísca de uma nova guerra.',
    'Os inimigos vêm das estradas ou das cinzas do passado: desertores sem bandeira, salteadores famintos, fiscais corruptos da Marca e os homens que a guerra devolveu mutilados e desumanizados.',
    'Desejo e intimidade aqui são escolhas de adultos calejados pela sobrevivência. Nenhuma mulher de Halvet deve servidão a você, e a vida dura ensinou cada uma a cobrar o que vale. O que acontece entre dois corpos na palha de uma estalagem ou num celeiro fechado nasce de vontade própria, necessidade ou paixão, sem hipocrisia puritana.',
  ],
};
