// ARCANUM · Missões de Vaelhorn (GDD §13.2 / quests). Objetivos ligados a flags
// que os verbos já produzem — assim são cumpríveis sem árvore de diálogo.
import type { Quest } from '../../engine/types';

export const questsVaelhorn: Quest[] = [
  {
    id: 'q_edital',
    titulo: 'O edital novo',
    descricao: 'Um edital fresco no quadro da taverna. Vale ler o que pedem.',
    objetivos: [{ id: 'ler', texto: 'Investigar o edital na taverna', flag: 'investigado.taverna.0' }],
    recompensa: { dinheiro: 15, xp: 10 },
  },
  {
    id: 'q_boato',
    titulo: 'Ouvidos na vila',
    descricao: 'Quem anda por aí e escuta, cedo ou tarde sabe de tudo.',
    dador: 'aldric',
    objetivos: [{ id: 'boato', texto: 'Colher um boato perguntando por aí', flag: 'boato.ouvido' }],
    recompensa: { xp: 15, reputacao: [{ faccaoId: 'vila', delta: 3 }] },
  },
  {
    id: 'q_escuta',
    titulo: 'Paredes têm ouvidos',
    descricao: 'Alguém, em algum canto, diz o que não devia. Basta escutar escondido.',
    objetivos: [{ id: 'ouvir', texto: 'Escutar uma conversa escondido', flag: 'ouviu.conversa' }],
    recompensa: { dinheiro: 12, xp: 10 },
  },
  {
    id: 'q_cripta',
    titulo: 'O que dorme sob a capela',
    descricao: 'Presságios apontam para a cripta. Descubra o que profanaram lá embaixo.',
    dador: 'irma_perla',
    objetivos: [
      { id: 'presagio', texto: 'Ler os presságios na capela', flag: 'presagio.vago' },
      { id: 'abrir', texto: 'Chegar à porta da cripta', flag: 'porta.aberta' },
    ],
    recompensa: { item: 'incenso_de_purga', xp: 30, reputacao: [{ faccaoId: 'igreja', delta: 5 }] },
  },
  {
    id: 'q_fiador',
    titulo: 'A Corrente do Fiador',
    descricao: 'Vess guarda uma relíquia que apaga memórias. Descubra seu segredo — e decida o que fazer.',
    objetivos: [{ id: 'segredo', texto: 'Descobrir o segredo de Vess', flag: 'segredo.vess' }],
    recompensa: { xp: 40 },
  },
];
