// ARCANUM · Intimidade, Desejos Pessoais & Humor Vivo dos NPCs (GDD §10).
//
// Cada pessoa no vale tem origem, anseio de vida (desejo), trauma passado (ferida)
// e pavor íntimo (medo). A intimidade é desvendada em camadas pelo convívio,
// confiança e conversas a sós. Apoiar o anseio pessoal de um NPC sela lealdade
// permanente e transforma a relação.
import type { Campaign, ContentBundle, Conviccao, NPC } from './types';
import { diasDeConvivio, registrarMarco } from './memoria';
import { npcPorId } from './elenco';
import { propagarParaFamilia } from './familiasNpc';
import { registrarFato } from './historiaViva';

export type IntimidadeProgresso = {
  origem: boolean;
  desejo: boolean;
  ferida: boolean;
  medo: boolean;
  desejoApoiado: boolean;
};

export type HumorNpc = {
  id: 'luto' | 'aterrorizado' | 'tenso' | 'cauteloso' | 'acolhedor' | 'grato' | 'sereno' | 'morto';
  rotulo: string;
  descricao: string;
  cor: string;
  icone: string;
};

/**
 * Retorna as camadas de intimidade conhecidas pelo jogador a respeito de um NPC.
 * O convívio no grupo ou níveis crescentes de confiança destravam as camadas.
 */
export function obterIntimidadeNpc(camp: Campaign, npc: NPC): IntimidadeProgresso {
  const salvo = camp.intimidadeNpc?.[npc.id] ?? {};
  const din = camp.npcState[npc.id];
  const confianca = din?.eixos.confianca ?? 0;
  const noGrupo = (camp.grupo ?? []).includes(npc.id);
  const diasConvivio = diasDeConvivio(camp, npc.id);

  // Origem: conhecida ao viajar junto ou após qualquer interação mínima
  const origem = salvo.origem ?? (noGrupo || confianca >= 0 || diasConvivio >= 1 || !!din?.memoria?.length);
  // Desejo: desabafado em confiança moderada (>= 8), no grupo ou com 3+ dias de convívio
  const desejo = salvo.desejo ?? (noGrupo || confianca >= 8 || diasConvivio >= 3);
  // Ferida: confidenciada sob alta confiança (>= 16) ou 5+ dias de grupo
  const ferida = salvo.ferida ?? (confianca >= 16 || (noGrupo && diasConvivio >= 5));
  // Medo: compartilhado em cumplicidade profunda (>= 22) ou 10+ dias de grupo
  const medo = salvo.medo ?? (confianca >= 22 || (noGrupo && diasConvivio >= 10));
  const desejoApoiado = !!salvo.desejoApoiado;

  return { origem, desejo, ferida, medo, desejoApoiado };
}

/**
 * Calcula o estado de espírito / humor humano autêntico do NPC no momento.
 * Considera lutos recentes, estresse/tensão, convicções sintetizadas e anseios.
 */
export function calcularHumorNpc(camp: Campaign, content: ContentBundle, npc: NPC): HumorNpc {
  const din = camp.npcState[npc.id];
  if (!din || !din.vivo) {
    return {
      id: 'morto',
      rotulo: 'Morto',
      descricao: 'Não caminha mais entre os vivos.',
      cor: '#776E65',
      icone: '🪦',
    };
  }

  // Luto recente na família (últimos 60 dias)
  const lutos = camp.familiasNpc?.lutos?.[npc.id];
  const ultimoLuto = lutos?.at(-1);
  if (ultimoLuto && camp.calendario.dia - ultimoLuto.dia <= 60) {
    return {
      id: 'luto',
      rotulo: 'Em luto',
      descricao: `Guarda o silêncio e o peso pelo familiar que partiu há ${camp.calendario.dia - ultimoLuto.dia} dia(s).`,
      cor: '#C94A29',
      icone: '🕯️',
    };
  }

  // Medo extremo ou ameaça imediata
  const medo = din.eixos.medo ?? 0;
  if (medo >= 14) {
    return {
      id: 'aterrorizado',
      rotulo: 'Aterrorizado',
      descricao: 'Olha ao redor com inquietação febril, temendo por sua segurança.',
      cor: '#C94A29',
      icone: '😨',
    };
  }

  // Tensão alta por negligência ou conflito
  if (din.tensao >= 60) {
    return {
      id: 'tenso',
      rotulo: 'Arredio & Tenso',
      descricao: 'Distante e desconfortável com a cobrança ou o afastamento recente.',
      cor: '#E07A34',
      icone: '⚡',
    };
  }

  // Anseio pessoal apoiado
  const intimidade = obterIntimidadeNpc(camp, npc);
  if (intimidade.desejoApoiado) {
    return {
      id: 'grato',
      rotulo: 'Esperançoso & Grato',
      descricao: 'Aliviado e leal pelo apoio que você dedicou ao seu maior anseio.',
      cor: '#D4A346',
      icone: '🌟',
    };
  }

  // Convicções cognitivas
  const conviccoes = din.conviccoes ?? [];
  if (conviccoes.some(c => c.valencia === 'cautela')) {
    return {
      id: 'cauteloso',
      rotulo: 'Guardado',
      descricao: 'Mede as palavras com prudência, sem baixar a guarda por completo.',
      cor: '#D4A346',
      icone: '🛡️',
    };
  }

  if (conviccoes.some(c => c.valencia === 'afeto') || (din.eixos.confianca ?? 0) >= 15) {
    return {
      id: 'acolhedor',
      rotulo: 'Acolhedor',
      descricao: 'Recebe você com respeito genuíno e afeto sincero.',
      cor: '#4D997A',
      icone: '✨',
    };
  }

  return {
    id: 'sereno',
    rotulo: 'Sereno',
    descricao: 'Concentrado em seus deveres e na rotina do vale.',
    cor: '#A89F91',
    icone: '🌿',
  };
}

/**
 * Diálogo a sós com o NPC: aprofunda o laço, diminui a tensão e
 * revela camadas íntimas de sua história (desejo, ferida ou medo).
 */
export function conversarASos(
  content: ContentBundle,
  camp: Campaign,
  npcId: string,
): { ok: boolean; texto: string; revelou?: 'desejo' | 'ferida' | 'medo' } {
  const npc = npcPorId(content, camp, npcId);
  const din = camp.npcState[npcId];
  if (!npc || !din || !din.vivo) {
    return { ok: false, texto: 'Esta pessoa não pode responder.' };
  }

  // Alivia tensão e aproxima
  din.tensao = Math.max(0, din.tensao - 15);
  din.eixos.confianca = Math.min(20, (din.eixos.confianca ?? 0) + 2);

  camp.intimidadeNpc ??= {};
  const salvo = (camp.intimidadeNpc[npcId] ??= { origem: true });
  salvo.origem = true;

  const h = npc.historia;
  const confianca = din.eixos.confianca ?? 0;

  // 1. Revelar Desejo
  if (!salvo.desejo && h?.desejo) {
    salvo.desejo = true;
    din.memoria.push({
      turno: camp.turno,
      dia: camp.calendario.dia,
      resumo: `Desabafou com você a sós sobre seu anseio: ${h.desejo}`,
      peso: 3,
      tipo: 'intimidade',
    });
    registrarMarco(camp, `dia ${camp.calendario.dia}: ${npc.nome} desabafou com você sobre seu anseio de vida.`);
    return {
      ok: true,
      revelou: 'desejo',
      texto: `Você e ${npc.nome} conversam a sós. Entre um silêncio e outro, ela olha nos seus olhos e confidencia seu anseio: "${h.desejo}".`,
    };
  }

  // 2. Revelar Ferida
  if (salvo.desejo && !salvo.ferida && h?.ferida && confianca >= 12) {
    salvo.ferida = true;
    din.memoria.push({
      turno: camp.turno,
      dia: camp.calendario.dia,
      resumo: `Confidenciou a você sua ferida passada: ${h.ferida}`,
      peso: 4,
      tipo: 'intimidade',
    });
    registrarMarco(camp, `dia ${camp.calendario.dia}: ${npc.nome} confiou a você a dor que carrega do passado.`);
    return {
      ok: true,
      revelou: 'ferida',
      texto: `A sós com você, a postura firme de ${npc.nome} vacila por um instante e ela confessa a dor que a marcou: "${h.ferida}".`,
    };
  }

  // 3. Revelar Medo
  if (salvo.ferida && !salvo.medo && h?.medo && confianca >= 18) {
    salvo.medo = true;
    din.memoria.push({
      turno: camp.turno,
      dia: camp.calendario.dia,
      resumo: `Confessou em segredo seu receio mais profundo: ${h.medo}`,
      peso: 4,
      tipo: 'intimidade',
    });
    registrarMarco(camp, `dia ${camp.calendario.dia}: ${npc.nome} confessou seu maior temor a você.`);
    return {
      ok: true,
      revelou: 'medo',
      texto: `Em tom baixo, ${npc.nome} divide com você seu pavor mais íntimo: "${h.medo}".`,
    };
  }

  // Diálogo cotidiano afetuoso
  din.memoria.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    resumo: `Conversaram a sós sobre o vale e seus afazeres`,
    peso: 2,
    tipo: 'conversa',
  });

  return {
    ok: true,
    texto: `Você e ${npc.nome} conversam a sós por algum tempo. A voz dela mantém sua índole própria e a tensão entre vocês se dissipa.`,
  };
}

/** Custo de moedas para apoiar concretamente o anseio de um NPC */
export const CUSTO_APOIAR_DESEJO = 20;

/**
 * O jogador estende a mão para realizar ou apoiar o desejo de vida do NPC.
 * Reduz a tensão a zero, eleva a confiança e sintetiza uma Convicção duradoura de Lealdade.
 */
export function apoiarDesejoNpc(
  content: ContentBundle,
  camp: Campaign,
  npcId: string,
): { ok: boolean; texto: string } {
  const npc = npcPorId(content, camp, npcId);
  const din = camp.npcState[npcId];
  if (!npc || !din || !din.vivo) {
    return { ok: false, texto: 'Esta pessoa não pode receber auxílio.' };
  }

  const intimidade = obterIntimidadeNpc(camp, npc);
  if (!intimidade.desejo || !npc.historia?.desejo) {
    return { ok: false, texto: `Você ainda não conhece o que ${npc.nome} realmente deseja na vida.` };
  }
  if (intimidade.desejoApoiado) {
    return { ok: false, texto: `Você já apoiou o anseio de ${npc.nome}.` };
  }
  if (camp.personagem.dinheiro < CUSTO_APOIAR_DESEJO) {
    return { ok: false, texto: `Você precisa de pelo menos ${CUSTO_APOIAR_DESEJO} moedas para apoiar este anseio.` };
  }

  camp.personagem.dinheiro -= CUSTO_APOIAR_DESEJO;
  camp.intimidadeNpc ??= {};
  camp.intimidadeNpc[npcId] = {
    ...(camp.intimidadeNpc[npcId] ?? {}),
    origem: true,
    desejo: true,
    desejoApoiado: true,
  };

  din.tensao = 0;
  din.eixos.confianca = Math.min(20, (din.eixos.confianca ?? 0) + 8);
  if (din.eixos.medo !== undefined) {
    din.eixos.medo = Math.max(-20, din.eixos.medo - 6);
  }

  const conviccao: Conviccao = {
    id: `apoio_desejo_${npc.id}`,
    texto: `Nutre lealdade e afeto inabalável por você ter estendido a mão e apoiado seu anseio de vida.`,
    valencia: 'afeto',
    intensidade: 5,
    turno: camp.turno,
    dia: camp.calendario.dia,
    baseadaEmTipos: ['ajuda', 'intimidade'],
  };
  din.conviccoes = [conviccao, ...(din.conviccoes ?? []).filter(c => c.id !== conviccao.id)].slice(0, 3);

  din.memoria.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    resumo: `Você investiu seus próprios recursos para apoiar o anseio de vida dela`,
    peso: 5,
    tipo: 'ajuda',
  });

  registrarMarco(camp, `dia ${camp.calendario.dia}: você apoiou o sonho de ${npc.nome} e selou um vínculo inabalável.`);
  registrarFato(camp, {
    tipo: 'apoio_desejo',
    local: npc.localBase,
    texto: `${camp.personagem.nome} apoiou o anseio de ${npc.nome}, mudando os rumos de sua vida.`,
    atores: ['jogador', npc.id],
    publico: false,
    conhecimento: 'testemunhado',
  });

  // A família nota e reconhece o gesto nobre
  propagarParaFamilia(content, camp, npc.id, 'confianca', 3);

  return {
    ok: true,
    texto: `Você entregou recursos e apoio para o anseio de ${npc.nome} ("${npc.historia.desejo}"). Um alívio profundo brilha no rosto dela; sua lealdade está selada.`,
  };
}

/**
 * Conforta o luto de um NPC que perdeu um ente querido recentemente.
 */
export function confortarLutoNpc(
  content: ContentBundle,
  camp: Campaign,
  npcId: string,
): { ok: boolean; texto: string } {
  const npc = npcPorId(content, camp, npcId);
  const din = camp.npcState[npcId];
  if (!npc || !din || !din.vivo) {
    return { ok: false, texto: 'Esta pessoa não pode receber condolências.' };
  }

  const lutos = camp.familiasNpc?.lutos?.[npcId];
  const ultimoLuto = lutos?.at(-1);
  if (!ultimoLuto || camp.calendario.dia - ultimoLuto.dia > 60) {
    return { ok: false, texto: `${npc.nome} não está sob luto recente.` };
  }

  din.tensao = Math.max(0, din.tensao - 25);
  din.eixos.confianca = Math.min(20, (din.eixos.confianca ?? 0) + 4);

  din.memoria.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    resumo: `Você prestou condolências sinceras e esteve ao lado dela no luto`,
    peso: 4,
    tipo: 'intimidade',
  });

  registrarMarco(camp, `dia ${camp.calendario.dia}: você confortou o luto de ${npc.nome}.`);
  propagarParaFamilia(content, camp, npc.id, 'confianca', 2);

  return {
    ok: true,
    texto: `Você prestou sinceras condolências a ${npc.nome} pelo luto de sua família. O silêncio compartilhado trouxe conforto e a dor foi atenuada.`,
  };
}

/**
 * Presenteia um NPC com uma pequena lembrança (10 moedas) para fortalecer o afeto.
 */
export function presentearNpc(
  content: ContentBundle,
  camp: Campaign,
  npcId: string,
): { ok: boolean; texto: string } {
  const npc = npcPorId(content, camp, npcId);
  const din = camp.npcState[npcId];
  if (!npc || !din || !din.vivo) {
    return { ok: false, texto: 'Esta pessoa não pode receber presentes.' };
  }
  if (camp.personagem.dinheiro < 10) {
    return { ok: false, texto: 'Você precisa de pelo menos 10 moedas para comprar um presente.' };
  }

  camp.personagem.dinheiro -= 10;
  din.tensao = Math.max(0, din.tensao - 10);
  din.eixos.confianca = Math.min(20, (din.eixos.confianca ?? 0) + 3);

  din.memoria.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    resumo: `Recebeu um presente atencioso das suas mãos`,
    peso: 3,
    tipo: 'presente',
  });

  return {
    ok: true,
    texto: `Você ofereceu um presente atencioso a ${npc.nome}. Ela aceitou com gratidão visível e o laço entre vocês se fortaleceu.`,
  };
}
