// ARCANUM · Ato II da trama: as duas levas (docs/BIBLIA-DA-HISTORIA.md).
//
// Depois da noite dos dezoito, chega uma carta de Tessel. Cera, veterana do
// cerco, perdeu o filho Tobin para a leva da Marca, não para o rio, e a
// guarnição diz que nunca o recebeu. A pergunta do ato é para onde vão os
// meninos que não entram no rio.
//
// O rastro passa por segredos que já existem no jogo (engine/segredos.ts):
// descobrir um deles numa cidade é achar a pista daquela cidade. Nenhum texto
// daqui fala do contrato do vale; o assunto deste ato é a leva da Marca.
import type { ConteudoAtoII } from '../../engine/atoII';

export const CONTEUDO_ATO_II: ConteudoAtoII = {
  titulo: 'As duas levas',
  diasDepoisDoAtoI: 3,
  remetente: 'morador_tessel_18',
  cidadeDoRemetente: 'tessel',
  pistasParaAlianca: 2,
  carta: {
    toca: 'Em Tessel corre que o forasteiro do vale esconde meninos.',
    ordem: 'Em Tessel corre que o forasteiro do vale entregou um menino à Ordem, e que portanto sabe para onde eles vão.',
    vigilia: 'Em Tessel corre que o forasteiro do vale entrou no rio atrás de um menino, e que o rio o devolveu.',
    estrada: 'Em Tessel corre que o forasteiro do vale tentou levar um menino para longe, e que o menino voltou andando para morrer.',
    sozinho: 'Em Tessel corre que tem um homem de fora dormindo no vale, e isso basta.',
    corpo:
      'Pia, a recadeira, entregou uma carta dobrada em quatro, com cheiro de fumaça de quartel. ' +
      '"Me chamo Cera. Lutei os quarenta dias do cerco na muralha oeste. Meu filho Tobin foi levado pela leva da Marca no primeiro inverno de paz. ' +
      'Não pela do rio, pela nossa. Disseram que foi para a guarnição, e a guarnição diz que nunca o recebeu. ' +
      'Se você sabe para onde vão os meninos, venha a Tessel e me diga para onde vão os nossos."',
  },
  pistas: [
    {
      id: 'tessel',
      cidade: 'Tessel',
      lugares: ['tessel', 'forte_agulha', 'campo_ceifa', 'vila_pedravel'],
      segredos: ['marechala_odile', 'morador_tessel_7', 'morador_tessel_6'],
      dica: 'Em Tessel, o dinheiro da leva passa pela marechala Odile e pelo livro da escrivã Ketta.',
      texto:
        'A leva da Marca não enche só a guarnição. A isenção que as vilas pagam em grão e em moeda foi parar na muralha oeste, ' +
        'refeita depois do cerco, e a marechala assinou sabendo. Cada rapaz dispensado é uma pedra no muro; cada rapaz levado também.',
    },
    {
      id: 'corveira',
      cidade: 'Corveira',
      lugares: ['corveira', 'mina_corveira', 'vila_terraco', 'aldeia_ferro'],
      segredos: ['morador_corveira_7', 'morador_corveira_13', 'senhora_corveira'],
      dica: 'Em Corveira, quem guarda os nomes do desabamento são as escrivãs: Wyn, do registro, e Quilda Boca-Seca, nos degraus.',
      texto:
        'A lista do desabamento tem duzentos e onze nomes. Os trinta e quatro que não cabem nela são de rapazes da Marca, ' +
        'mandados para as galerias pela leva e nunca registrados como mineiros. No meio deles está escrito, com letra de escrivã: Tobin Ost.',
    },
    {
      id: 'mareu',
      cidade: 'Mareu',
      lugares: ['mareu', 'mercado_peixe', 'porto_sal', 'aldeia_rede'],
      segredos: ['morador_mareu_12', 'mirel'],
      dica: 'Em Mareu, o dinheiro que paga a guarda passa pelo cais e pelos papéis de dívida das Olho-Vivo.',
      texto:
        'O sal que entra em Mareu sem selo paga a guarda da Marca, e o livro do depósito tem o nome de metade dela. ' +
        'A guilda não financia a leva por fé: é ela quem compra o braço barato das galerias depois.',
    },
  ],
  tobin: {
    rotulo: 'Contar a Cera o que houve com Tobin',
    texto:
      'Você disse o nome da galeria e o número da lista. Cera não perguntou se você tinha certeza. Ficou um tempo olhando a muralha oeste, ' +
      'a que ela defendeu, e disse que agora sabia de que era feita. Depois pediu que você voltasse quando fosse fazer alguma coisa a respeito.',
  },
  aliados: [
    {
      id: 'halvet', npc: 'dama_valda', cacam: ['marechala_odile'], exigePista: undefined,
      rotulo: 'Aliar-se à Casa de Halvet',
      descricao: 'Dama Valda tem nome, voto antigo na estrada do sal e nenhum dinheiro. Tessel vai tratar você como inimigo.',
      texto:
        'Dama Valda ouviu tudo sem interromper e depois mandou buscar o sinete. "Halvet perdeu os homens para o rio. Não vai perder os meninos para Tessel." ' +
        'A casa não tem ouro, mas tem o direito de cobrar passagem na estrada do sal, e vai usá-lo contra a Marca.',
    },
    {
      id: 'tessel', npc: 'morador_tessel_7', cacam: ['marechala_odile'], exigePista: 'tessel',
      rotulo: 'Aliar-se a Ketta, a escrivã',
      descricao: 'Ketta guarda o livro das Varn e o que ele diz sobre quem é a marechala. Odile vai caçar vocês dois.',
      texto:
        'Ketta abriu o livro das Varn na primeira página e pôs o dedo no nome trocado. "No papel, quem manda na Marca sou eu. ' +
        'Me ajude a fazer o papel valer, e a leva acaba no dia seguinte." A irmã dela ainda não sabe. Vai saber.',
    },
    {
      id: 'corveira', npc: 'morador_corveira_2', cacam: ['senhora_corveira'], exigePista: 'corveira',
      rotulo: 'Aliar-se a Fenn e à guilda das galerias',
      descricao: 'Fenn assinou o laudo que ninguém leu. Com ela, as galerias fecham para os recrutas da Marca. Halda Verrão não perdoa.',
      texto:
        'Fenn pôs o capacete na mesa e disse que a guilda para as galerias no dia em que entrar o próximo rapaz de Tessel. ' +
        '"Assinei um laudo e fiquei calada doze anos. Não vou ficar calada treze."',
    },
    {
      id: 'mareu', npc: 'mirel', cacam: ['morador_mercado_peixe_2'], exigePista: 'mareu',
      rotulo: 'Aliar-se a Mirel Olho-Vivo',
      descricao: 'Mirel compra as dívidas que prendem a costa à guilda. Com ela, o dinheiro da guarda seca. A mãe dela vira inimiga.',
      texto:
        'Mirel fez as contas na sua frente, em voz baixa, e sorriu no fim. "Sem o sal sem selo, a guarda da Marca não se paga por três meses. ' +
        'Em três meses eu sou a guilda." Vidar Olho-Vivo, a mãe, vai entender isso antes de você sair da cidade.',
    },
  ],
};
