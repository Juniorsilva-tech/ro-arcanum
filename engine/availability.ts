// ARCANUM · Privacidade, testemunhas e disponibilidade de verbos (GDD §8, §4.3).
import type { Campaign, ContentBundle, Verbo, NPC, Local } from './types';
import { periodoAtual, NOME_PERIODO, type Periodo } from './time';

export type Contexto = {
  local: Local;
  periodo: Periodo;
  privacidade: 0 | 1 | 2 | 3;
  presentes: NPC[]; // NPCs vivos neste local agora
  testemunhas: number; // quantos olhos governam o ilegal/social
};

function localDeNpcNoPeriodo(npc: NPC, periodo: Periodo): string {
  return npc.rotina[periodo] ?? npc.localBase;
}

export function calcularContexto(content: ContentBundle, camp: Campaign): Contexto {
  const local = content.locais.find((l) => l.id === camp.localAtual)!;
  const periodo = periodoAtual(camp.calendario);

  const presentes = content.npcs.filter((npc) => {
    const din = camp.npcState[npc.id];
    if (din && !din.vivo) return false;
    return localDeNpcNoPeriodo(npc, periodo) === local.id;
  });

  let privacidade: 0 | 1 | 2 | 3 = local.privacidadeBase[periodo] ?? 0;
  // Chuva/estação e oportunidades podem elevar (GDD §9). Flag simples:
  if (camp.flags['clima.chuva'] === true && privacidade < 3) {
    privacidade = (privacidade + 1) as 0 | 1 | 2 | 3;
  }

  // Testemunhas: presentes ajustados por privacidade do lugar.
  // Lugar íntimo com poucas pessoas => quase ninguém "vê" o social/ilegal.
  const testemunhas = privacidade >= 3 ? 0 : presentes.length;

  return { local, periodo, privacidade, presentes, testemunhas };
}

export type Disponibilidade = { disponivel: boolean; motivo?: string };

// Verbo indisponível NUNCA some — permanece apagado, com o motivo (GDD §4.3).
export function disponibilidadeVerbo(
  verbo: Verbo,
  ctx: Contexto,
  camp: Campaign,
  alvo?: NPC,
): Disponibilidade {
  const p = camp.personagem;
  const req = verbo.requisitos ?? {};

  if (ctx.local.verbosBloqueados?.includes(verbo.id)) {
    return { disponivel: false, motivo: 'não cabe aqui' };
  }

  if (verbo.alvo === 'pessoa' && ctx.presentes.length === 0 && verbo.categoria !== 'deslocamento') {
    return { disponivel: false, motivo: 'não há ninguém aqui' };
  }

  if (verbo.categoria === 'transgressao' && verbo.alvo === 'pessoa') {
    const sozinho = ctx.presentes.length === 1 && ctx.testemunhas <= 1;
    if (!sozinho && ctx.testemunhas > 1) {
      return { disponivel: false, motivo: `${ctx.testemunhas} pessoas te veriam` };
    }
  }

  if (req.privacidadeMin !== undefined && ctx.privacidade < req.privacidadeMin) {
    return { disponivel: false, motivo: privacidadeMotivo(ctx) };
  }

  if (req.testemunhasMax !== undefined && ctx.testemunhas > req.testemunhasMax) {
    return { disponivel: false, motivo: `${ctx.testemunhas} pessoas te veriam` };
  }

  if (req.item && (p.inventario[req.item] ?? 0) <= 0) {
    return { disponivel: false, motivo: `precisa de ${req.item}` };
  }

  if (req.pericia && (p.pericias[req.pericia] ?? 0) <= 0) {
    return { disponivel: false, motivo: `você não sabe ${req.pericia}` };
  }

  if (req.periodo && !req.periodo.includes(ctx.periodo)) {
    const quando = req.periodo.map((x) => NOME_PERIODO[x].toLowerCase()).join(' ou ');
    return { disponivel: false, motivo: `só ao ${quando}` };
  }

  if (req.localTipo && !req.localTipo.includes(ctx.local.tipo)) {
    return { disponivel: false, motivo: 'não é o lugar para isso' };
  }

  if (req.condicaoNecessaria === 'sabe_segredo') {
    if (!alvo || !camp.segredosRevelados.includes(alvo.id)) {
      return { disponivel: false, motivo: 'você não sabe nada que sirva' };
    }
  } else if (req.condicaoNecessaria === 'sabe_segredo_vess') {
    if (!camp.segredosRevelados.includes('vess')) {
      return { disponivel: false, motivo: 'você ainda não sabe o que ele guarda' };
    }
  } else if (req.condicaoNecessaria && !p.condicoes.includes(req.condicaoNecessaria)) {
    return { disponivel: false, motivo: `exige estar ${req.condicaoNecessaria}` };
  }
  if (req.condicaoProibida && p.condicoes.includes(req.condicaoProibida)) {
    return { disponivel: false, motivo: `não enquanto ${req.condicaoProibida}` };
  }

  if (verbo.custo.dinheiro && p.dinheiro < verbo.custo.dinheiro) {
    return { disponivel: false, motivo: 'sem dinheiro suficiente' };
  }

  if (alvo) {
    const din = camp.npcState[alvo.id];
    if (din && !din.vivo) return { disponivel: false, motivo: `${alvo.nome} está morto` };
  }

  return { disponivel: true };
}

function privacidadeMotivo(ctx: Contexto): string {
  if (ctx.testemunhas > 0) {
    return ctx.testemunhas === 1 ? 'alguém te veria' : `${ctx.testemunhas} pessoas te veriam`;
  }
  return 'aqui não há privacidade';
}

export function rotuloPrivacidade(v: 0 | 1 | 2 | 3): string {
  return ['nenhuma', 'baixa', 'alta', 'total'][v];
}
