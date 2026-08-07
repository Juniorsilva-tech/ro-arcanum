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
    dador: 'aldrica',
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
    titulo: 'A Corrente da Fiadora',
    descricao: 'Vess guarda uma relíquia que apaga memórias. Descubra seu segredo — e decida o que fazer.',
    objetivos: [{ id: 'segredo', texto: 'Descobrir o segredo de Vess', flag: 'segredo.vess' }],
    recompensa: { xp: 40 },
  },

  // ── Segunda leva: o vale inteiro ─────────────────────────────────────────
  {
    id: 'q_ponte',
    titulo: 'A noite em que a ponte caiu',
    descricao: 'Todo mundo conta a história e ninguém conta a mesma. Morda ouviu algo que os outros não.',
    dador: 'morda',
    objetivos: [
      { id: 'ir', texto: 'Ir até a Ponte Caída', flag: 'visitou.ponte' },
      { id: 'segredo', texto: 'Arrancar de Morda o que ela ouviu', flag: 'segredo.morda' },
    ],
    recompensa: { dinheiro: 20, xp: 25, reputacao: [{ faccaoId: 'vila', delta: 3 }] },
  },
  {
    id: 'q_roda_parada',
    titulo: 'A roda parada',
    descricao: 'O moinho não mói desde a cheia. Heska jura que é a água. A trava diz outra coisa.',
    dador: 'heska',
    objetivos: [
      { id: 'ir', texto: 'Chegar ao Moinho Parado', flag: 'visitou.moinho' },
      { id: 'segredo', texto: 'Descobrir por que Heska travou a roda', flag: 'segredo.heska' },
    ],
    recompensa: { dinheiro: 30, xp: 30, item: 'lanterna_surda' },
  },
  {
    id: 'q_covas_vazias',
    titulo: 'Três covas vazias',
    descricao: 'Oda enterrou três e desenterrou nenhum. Alguém chegou antes da terra assentar.',
    dador: 'oda',
    objetivos: [
      { id: 'ir', texto: 'Percorrer o Campo de Pedras', flag: 'visitou.cemiterio' },
      { id: 'revistar', texto: 'Revistar o canto norte', flag: 'revistou' },
      { id: 'segredo', texto: 'Fazer Oda dizer quem lhe pagou', flag: 'segredo.oda' },
    ],
    recompensa: { dinheiro: 40, xp: 40, reputacao: [{ faccaoId: 'igreja', delta: 4 }] },
  },
  {
    id: 'q_galeria_funda',
    titulo: 'A galeria funda',
    descricao: 'Borka selou a boca de pedra e não diz por quê. A Irmandade quer o veio de volta.',
    dador: 'borka',
    objetivos: [
      { id: 'ir', texto: 'Descer até a Mina de Ferro', flag: 'visitou.mina' },
      { id: 'segredo', texto: 'Saber o que respondeu lá dentro', flag: 'segredo.borka' },
      { id: 'verme', texto: 'Matar o que abre a parede', flag: 'matou.verme_de_pedra' },
    ],
    recompensa: { dinheiro: 70, xp: 70, item: 'picareta_de_mina', reputacao: [{ faccaoId: 'mineiros', delta: 8 }] },
  },
  {
    id: 'q_livro_caixa',
    titulo: 'Duas colunas',
    descricao: 'Teoda escreve um livro para Dama Valda e outro para a verdade. Um dos dois está atrás da lareira.',
    dador: 'teoda',
    objetivos: [
      { id: 'ir', texto: 'Entrar na Casa de Pedra', flag: 'visitou.casa_senhorial' },
      { id: 'segredo', texto: 'Achar o segundo livro-caixa', flag: 'segredo.teoda' },
    ],
    recompensa: { dinheiro: 90, xp: 55, item: 'livro_caixa', reputacao: [{ faccaoId: 'senhorio', delta: -6 }, { faccaoId: 'vila', delta: 6 }] },
  },
  {
    id: 'q_espelho',
    titulo: 'O que a rede traz',
    descricao: 'Ganta devolve à água tudo que não devia subir. Guardou uma peça — a que não afundava.',
    dador: 'ganta',
    objetivos: [
      { id: 'ir', texto: 'Chegar ao Espelho de Halvet', flag: 'visitou.lago' },
      { id: 'segredo', texto: 'Ver o que Ganta guardou no fundo do barco', flag: 'segredo.ganta' },
      { id: 'afogado', texto: 'Enfrentar o que sobe do lago', flag: 'matou.o_afogado_do_espelho' },
    ],
    recompensa: { dinheiro: 120, xp: 110, item: 'anel_de_junco' },
  },
  {
    id: 'q_sem_nome',
    titulo: 'Os Sem-Nome',
    descricao: 'Ruvela comanda um acampamento de desertores. A guarda quer a cabeça dela; ela quer um recado entregue.',
    dador: 'ruvela',
    objetivos: [
      { id: 'ir', texto: 'Achar o Acampamento dos Sem-Nome', flag: 'visitou.acampamento' },
      { id: 'segredo', texto: 'Descobrir de que regimento Ruvela desertou', flag: 'segredo.ruvela' },
    ],
    recompensa: { dinheiro: 60, xp: 60, reputacao: [{ faccaoId: 'foragidos', delta: 8 }, { faccaoId: 'guarda', delta: -5 }] },
  },
  {
    id: 'q_mir',
    titulo: 'A que queimou Mir',
    descricao: 'Vell sobreviveu porque estava dentro. E continua ouvindo. As ruínas ainda têm dona.',
    dador: 'vell',
    objetivos: [
      { id: 'ir', texto: 'Alcançar as Ruínas de Mir', flag: 'visitou.ruinas' },
      { id: 'segredo', texto: 'Fazer Vell contar o que ouve', flag: 'segredo.vell' },
      { id: 'sombra', texto: 'Dispersar uma Sombra de Mir', flag: 'matou.sombra_de_mir' },
      { id: 'ela', texto: 'Encarar A Que Queimou Mir', flag: 'matou.a_que_queimou_mir' },
    ],
    recompensa: { dinheiro: 200, xp: 200, item: 'talisma_de_cinza' },
  },
  {
    id: 'q_sino',
    titulo: 'O sino que não tocou',
    descricao: 'A torre tinha um vigia acordado naquela noite. Ou deveria ter.',
    dador: 'lunn',
    objetivos: [
      { id: 'ir', texto: 'Subir à Torre do Vigia', flag: 'visitou.torre' },
      { id: 'vigiar', texto: 'Ficar de vigia com ela', flag: 'vigiou.lunn' },
      { id: 'segredo', texto: 'Fazer Lunn admitir o que houve', flag: 'segredo.lunn' },
    ],
    recompensa: { dinheiro: 35, xp: 45, reputacao: [{ faccaoId: 'guarda', delta: 5 }] },
  },
  {
    id: 'q_selado',
    titulo: 'O Último Selo',
    descricao: 'Sarine trancou algo sob a capela e passou a vida bebendo por causa disso. O selo está cedendo.',
    dador: 'sarine',
    objetivos: [
      { id: 'presagio', texto: 'Ler um presságio claro', flag: 'presagio.claro' },
      { id: 'sarine', texto: 'Arrancar a confissão de Sarine', flag: 'segredo.sarine' },
      { id: 'corvane', texto: 'Descobrir o que a madre desce para fazer', flag: 'segredo.madre_corvane' },
      { id: 'fim', texto: 'Enfrentar O Selado', flag: 'matou.o_selado' },
    ],
    recompensa: { dinheiro: 400, xp: 400, item: 'selo_partido', reputacao: [{ faccaoId: 'igreja', delta: 10 }, { faccaoId: 'vila', delta: 10 }] },
  },
];
