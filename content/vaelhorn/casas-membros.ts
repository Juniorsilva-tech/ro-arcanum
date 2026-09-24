// ARCANUM · Gente que faltava nas casas nobres (sessão 50, Fase 4).
//
// As quatro casas tinham lema, sede e rivalidade, e nenhum membro com nome.
// Quase todos os membros já existiam no elenco (Dama Valda, as Varn, as
// Verrão, as Olho-Vivo). Faltavam três, criados aqui com o mesmo nível de
// detalhe do elenco escrito: a prima que vive de favor na Casa de Pedra, a
// filha dela, segunda na linha, e a herdeira das Olho-Vivo.
import type { NPC } from '../../engine/types';

export const membrosDasCasas: NPC[] = [
  {
    id: 'maelis',
    nome: 'Maelis de Halvet',
    idade: 57,
    ocupacao: 'dama de companhia da casa de pedra',
    faccaoId: 'senhorio',
    localBase: 'casa_senhorial',
    rotina: {
      madrugada: 'casa_senhorial',
      manha: 'capela',
      tarde: 'casa_senhorial',
      entardecer: 'praca',
      anoitecer: 'casa_senhorial',
      noite: 'casa_senhorial',
    },
    vozNarrativa: 'Fala baixo e sempre no plural — "nós, da casa" — mesmo quando a casa não a inclui. Termina frase dura com um sorriso.',
    personalidade: 'Paciente como quem é segunda na fila há trinta anos. Sorri para Ysolde à mesa e conta a linha de sucessão depois, no quarto.',
    corpo: 'Alta, magra, cabelo grisalho preso em trança de dama antiga. Vestidos bons e remendados por dentro, onde não aparece. Anéis demais para mãos que já não usam anel.',
    relacoes: [
      { npc: 'dama_valda', tipo: 'devedora', nota: 'Vive na Casa de Pedra por favor da prima há vinte anos.' },
      { npc: 'ysolde', tipo: 'rival', nota: 'Sorri para ela à mesa e conta a linha de sucessão depois.' },
      { npc: 'teoda', tipo: 'desconfia', nota: 'Sabe que a escriba sabe mais do que escreve.' },
    ],
    segredo: {
      conteudo: 'Maelis guarda uma carta do falecido marido de Valda que deixava a casa à prima, e não à esposa, se o filho morresse. Nunca foi registrada. Ela espera a Dama morrer para apresentar.',
      comoDescobrir: 'ganhar a confiança dela contra Ysolde e perguntar o que ela faria se a casa fosse dela',
      consequencia: {
        texto: 'Você sabe da carta de Maelis. Ysolde passa a contar com você; Maelis passa a ter medo.',
        efeitos: [
          { tipo: 'relacao', npc: 'ysolde', eixo: 'confianca', delta: 3 },
          { tipo: 'relacao', npc: 'maelis', eixo: 'medo', delta: 4 },
        ],
      },
    },
    historia: {
      origem: 'Prima de Valda pelo lado das mães, criada numa casa menor do sul do vale que a Leva e as dívidas esvaziaram. Mudou-se para a Casa de Pedra viúva, aos trinta e sete, com uma filha de colo.',
      ferida: 'Chegou pedindo abrigo por um inverno e ficou vinte anos como parente pobre, sentando no fim da mesa.',
      desejo: 'Ver a filha como senhora da casa que a recebeu por favor.',
      medo: 'Morrer na cama emprestada, com a carta ainda no fundo do baú.',
    },
  },
  {
    id: 'ilse',
    nome: 'Ilse de Halvet',
    idade: 22,
    ocupacao: 'herdeira em segunda linha',
    faccaoId: 'senhorio',
    localBase: 'casa_senhorial',
    rotina: {
      madrugada: 'casa_senhorial',
      manha: 'casa_senhorial',
      tarde: 'mercado',
      entardecer: 'lago',
      anoitecer: 'casa_senhorial',
      noite: 'casa_senhorial',
    },
    vozNarrativa: 'Pergunta antes de afirmar, e pergunta bem. Baixa a voz quando a mãe entra, e só com a mãe.',
    personalidade: 'Estudiosa, tímida diante da mãe e ousada com o resto. Quer a casa menos do que a mãe quer por ela.',
    corpo: 'Baixa, de rosto redondo e mãos manchadas de tinta. Usa os vestidos velhos de Ysolde, ajustados por ela mesma, e anda rápido como quem sempre está atrasada para alguma coisa.',
    relacoes: [
      { npc: 'ysolde', tipo: 'aliada', nota: 'A prima mais velha é a única da casa que a trata como gente e não como peça.' },
      { npc: 'teoda', tipo: 'aliada', nota: 'Ajuda a escriba com os livros em troca de aprender a ler números.' },
    ],
    segredo: {
      conteudo: 'Ilse ajuda Teoda a fechar os livros da casa e sabe o tamanho exato da falência de Halvet. Não contou à mãe, porque a mãe usaria contra a Dama no mesmo dia.',
      comoDescobrir: 'pegá-la voltando da sala da escriba com tinta nas mãos e perguntar o que ela anda somando',
    },
    historia: {
      origem: 'Filha de Maelis, nascida no sul do vale e trazida para a Casa de Pedra de colo. Nunca morou em outro lugar.',
      ferida: 'Cresceu ouvindo a mãe contar quem morreria antes de quem na linha da casa, como outras mães contam histórias de dormir.',
      desejo: 'Sair da linha de sucessão e estudar contas em Corveira, com a bênção da prima Ysolde.',
      medo: 'Que Ysolde morra e a casa caia no colo dela antes de ela saber recusar.',
    },
  },
  {
    id: 'mirel',
    nome: 'Mirel Olho-Vivo',
    idade: 26,
    ocupacao: 'contadora da guilda e herdeira das Olho-Vivo',
    faccaoId: 'senhorio',
    localBase: 'mercado_peixe',
    rotina: {
      madrugada: 'mercado_peixe',
      manha: 'mercado_peixe',
      tarde: 'mareu',
      entardecer: 'mareu',
      anoitecer: 'mercado_peixe',
      noite: 'mercado_peixe',
    },
    expediente: { diasTrabalho: [1, 2, 3, 4, 5], periodos: ['tarde', 'entardecer'] },
    vozNarrativa: 'Fala em números e cobra em nomes. Educada em Corveira, e deixa isso claro na segunda frase.',
    personalidade: 'Contadora de cabeça, impaciente com a tia Vidar e com as regras velhas do galpão. Acha a guilda do sal uma dívida que a cidade paga por costume.',
    corpo: 'Magra, de ombros retos e roupa de corte de Corveira que não serve para o cheiro de peixe. Olhos claros de Olho-Vivo, sempre franzidos, como quem confere uma soma.',
    relacoes: [
      { npc: 'morador_mercado_peixe_2', tipo: 'rival', nota: 'A tia e ela disputam a eleição da casa antes de haver eleição.' },
      { npc: 'morador_mareu_14', tipo: 'aliada', nota: 'A prima da estalagem é a única que conta a história da primeira banca inteira.' },
    ],
    segredo: {
      conteudo: 'Mirel está comprando, em nome de terceiros, as dívidas que Rede Rota tem com a guilda do sal. No dia em que a mãe morrer e ela assumir, pretende perdoar todas e quebrar a guilda por dentro.',
      comoDescobrir: 'seguir os papéis de dívida de Rede Rota até quem os comprou',
      consequencia: {
        texto: 'Você sabe o que Mirel pretende fazer com as dívidas de Rede Rota. A aldeia passa a confiar em quem sabe; a tia Vidar, a temer.',
        efeitos: [
          { tipo: 'relacao', npc: 'morador_aldeia_rede_1', eixo: 'confianca', delta: 3 },
          { tipo: 'relacao', npc: 'morador_mercado_peixe_2', eixo: 'medo', delta: 3 },
        ],
      },
    },
    historia: {
      origem: 'Filha única de Ansel Olho-Vivo, nascida no galpão do Mercado do Peixe e mandada aos quinze para estudar contas em Corveira.',
      ferida: 'Voltou a Mareu aos vinte e dois e encontrou a guilda do sal decidindo, na casa da tia, o que o conselho votaria na semana seguinte.',
      desejo: 'Uma Mareu em que o sal pague imposto como qualquer peixe.',
      medo: 'Virar a tia, mandando num lugar que não escolheu.',
    },
  },
];
