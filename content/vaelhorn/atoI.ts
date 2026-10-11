// ARCANUM · Ato I da trama: o forasteiro (docs/BIBLIA-DA-HISTORIA.md).
//
// Brida, tecelã da praça, tem um filho que faz dezoito anos em sete dias.
// Ela procura o jogador porque ele é de fora: uma mulher do vale saindo com
// o filho na semana dos dezoito é vista pela Ordem, e um menino sozinho na
// estrada é recrutado pelos fiscais da Marca. Um homem de fora com um rapaz
// passa por pai.
//
// A engine decide o desfecho na noite dos dezoito (engine/atoI.ts). O ato
// mostra a Leva e não explica nada: nenhuma linha daqui fala do contrato.
//
// Edrin nasceu em Halvet de pai de fora, como o filho de Dama Valda: quem
// nasce no vale entra no rio, seja quem for o pai.
//
// Edrin não é NPC do elenco: tem dezessete anos, e o elenco só tem adultos
// (GDD §25, checado em engine/selftest.ts). Ele existe no estado do ato:
// nome, casa, onde está. Não entra em "presentes" nem em lista de pessoas.
import type { NPC } from '../../engine/types';
import type { ConteudoAtoI } from '../../engine/atoI';

export const NPCS_ATO_I: NPC[] = [
  {
    id: 'brida',
    nome: 'Brida, a Tecelã',
    idade: 41,
    ocupacao: 'tecelã',
    faccaoId: 'vila',
    localBase: 'praca',
    rotina: {
      madrugada: 'praca',
      manha: 'mercado',
      tarde: 'mercado',
      entardecer: 'capela',
      anoitecer: 'praca',
      noite: 'praca',
    },
    vozNarrativa: 'Fala contando: dias, fios, passos. Quando perde a conta, perde a voz.',
    personalidade: 'Prática até o osso. Já decidiu tudo e só precisa de alguém de fora para fazer o que ela não pode.',
    corpo: 'Ombros curvos de tear, calo na ponta de cada dedo, cabelo preso com um fio de lã vermelha.',
    historia: {
      origem: 'Tecelã da praça, filha de tecelã. Teve o filho de um tropeiro do sal que passou um inverno no vale e foi embora antes do parto.',
      ferida: 'Os dois irmãos dela entraram no rio na noite em que Mir queimou. O mais novo parou na porta e virou a cabeça, como quem ouve chamar.',
      desejo: 'Que o filho chegue aos dezenove em qualquer lugar do mundo, mesmo que ela nunca mais o veja.',
      medo: 'Que, na última hora, ela mesma não tenha coragem de esconder o filho.',
    },
    segredo: {
      conteudo: 'Vendeu o tear grande para pagar a Grimma pelo caminho do charco até o Juncal. Grimma pegou o dinheiro e nunca mais passou pela praça.',
      comoDescobrir: 'Perguntar pelo tear que falta na casa dela.',
    },
    relacoes: [
      { npc: 'grimma', tipo: 'desconfia', nota: 'Pagou pelo caminho do charco e ficou sem o caminho e sem o tear.' },
    ],
  },
];

export const CONTEUDO_ATO_I: ConteudoAtoI = {
  regiao: 'Vale de Halvet',
  mae: 'brida',
  menino: {
    nome: 'Edrin',
    casa: 'praca',
    retrato: 'Dezessete anos, magro de crescer depressa, um fio de lã vermelha no pulso. Fala pouco e baixo e pergunta tudo sobre a estrada. Quer ver o mar, que o pai dizia ser maior que o vale.',
  },
  guia: 'morador_vila_juncal_0',
  testemunha: 'morda',
  capela: 'capela',
  aldeia: 'vila_juncal',
  toca: 'toca_juncal',
  diasAteANoite: 7,
  titulo: 'O inverno dos dezoito',
  textos: {
    abertura:
      'Brida, a tecelã da praça, sentou na sua frente sem pedir licença. O filho dela, Edrin, faz dezoito anos em sete dias. ' +
      'Ela não explicou o que isso quer dizer e não precisou: viu na sua cara que você ainda não sabia. ' +
      '"Você é de fora. Uma mulher daqui saindo com o filho nesta semana, a Ordem vê. Um menino sozinho na estrada, a Marca leva. ' +
      'Um homem de fora com um rapaz do lado passa por pai." Disse onde ele dorme e foi embora antes que você respondesse.',
    levar:
      'Brida pôs na mão de Edrin um pão, uma faca pequena e um fio de lã vermelha amarrado no pulso. Não chorou. ' +
      'Edrin anda com você agora, meio passo atrás, olhando a estrada como quem olha o mar.',
    devolver:
      'Você deixou Edrin com a mãe. Brida não perguntou por quê. Fechou a porta devagar.',
    ordem:
      'A madre recebeu Edrin na porta da capela como quem recebe uma oferta. A Irmã Perla não olhou para você. ' +
      'Na praça, até a noite, já se sabia: o forasteiro entregou o filho da tecelã à Ordem.',
    toca:
      'Orla a Manca olhou para Edrin, depois para você, e não perguntou nada. Contou as estacas do charco em voz baixa, uma por uma, ' +
      'e levou o menino para baixo da água. Lá dentro há outros. Um deles tem o rosto de Cera a Surda.',
    desfechos: {
      toca:
        'Na noite dos dezoito, Edrin acordou na Toca, levantou e foi até a parede. Orla e os outros o seguraram até o dia clarear. ' +
        'Ele está vivo, embaixo do charco, e não pode mais sair de lá. Alguém vai precisar contar a Brida.',
      ordem:
        'Na noite dos dezoito, a Ordem cantou Edrin da capela até a ponte, com velas. Ele foi andando na frente delas, de olhos abertos, ' +
        'e entrou no rio sem parar de andar. As irmãs chamam isso de penitência cumprida. Brida não foi.',
      vigilia:
        'Na noite dos dezoito, Edrin levantou sem acordar e caminhou para a ponte. Você o segurou pelo braço e ele continuou andando, ' +
        'arrastando você junto, com a força de três homens. Na margem você entrou atrás dele até a cintura, e a correnteza empurrou você ' +
        'de volta para a lama, como se a água não quisesse você. Edrin afundou sem fazer onda. Do coto norte, Morda virou o rosto para o seu lado.',
      estrada:
        'Na noite dos dezoito, longe do vale, Edrin levantou sem acordar e saiu andando de volta pela estrada. Foi achado de manhã ' +
        'numa vala cheia de água da chuva, de bruços, com o rosto virado para Halvet.',
      sozinho:
        'Na noite dos dezoito, Edrin saiu de casa sozinho e caminhou até a ponte. Brida o seguiu até a porta e não passou dela. ' +
        'De manhã havia um ramo novo de flores no parapeito.',
    },
    pistas: {
      taverna: 'Sarine, no canto, observa o forasteiro desde que ele entrou e não puxa conversa.',
      ponte: 'Morda, no coto norte, vira o rosto para o forasteiro antes que ele diga qualquer coisa, como se conhecesse o passo.',
      cripta: 'Um dos nichos foi aberto por dentro, e a laje central tem uma trinca nova.',
      praca: 'As mulheres da praça olham o forasteiro e depois olham a porta da casa dos dois teares.',
    },
  },
};
