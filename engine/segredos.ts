// ARCANUM · Segredos que mudam alguma coisa (sessão 47, Fase 3).
//
// Até aqui descobrir um segredo empurrava o id para `segredosRevelados`,
// escrevia um marco e parava. Três verbos (`chamar_o_afogado`,
// `encarar_a_que_queimou`, `romper_o_selo`) e o `chantagear` liam a lista; o
// resto dos segredos era texto para o narrador. A regra de quando se descobre
// morava na interface (ui/store.ts).
//
// Agora a regra está na engine e o segredo pode declarar, no conteúdo, a
// consequência de ser descoberto: efeitos (a relação com outra pessoa muda, a
// reputação com uma facção, uma flag que um verbo lê, um item) e uma missão
// viva. A consequência acontece uma vez só, no momento da descoberta.
import type { Campaign, ContentBundle, NPC } from './types';
import { aplicarEfeito } from './effects';
import { registrarMarco } from './memoria';
import { cidadeIdDoLocal, registrarFato } from './historiaViva';
import { oferecerMissao } from './missoesVivas';
import { propagarParaFamilia } from './familiasNpc';

function npcDoBundle(content: ContentBundle, camp: Campaign, id: string): NPC | undefined {
  return content.npcs.find(n => n.id === id) ?? camp.npcsProcedurais?.find(n => n.id === id);
}

/** Confiança a partir da qual alguém conta o que esconde. */
export const CONFIANCA_PARA_SEGREDO = 12;

/**
 * Revela e aplica a consequência. Devolve true se era novidade. Idempotente:
 * a consequência nunca acontece duas vezes.
 */
export function revelarSegredo(content: ContentBundle, camp: Campaign, npcId: string): boolean {
  const npc = npcDoBundle(content, camp, npcId);
  if (!npc?.segredo) return false;
  const novo = !camp.segredosRevelados.includes(npcId);
  if (novo) camp.segredosRevelados.push(npcId);
  camp.flags[`segredo.${npcId}`] = true;
  if (novo) registrarMarco(camp, `você descobriu o que ${npc.nome} escondia`);
  aplicarConsequenciaDeSegredo(content, camp, npc);
  return novo;
}

export function aplicarConsequenciaDeSegredo(content: ContentBundle, camp: Campaign, npc: NPC): void {
  const c = npc.segredo?.consequencia;
  const chave = `segredo.consequencia.${npc.id}`;
  if (!c || camp.flags[chave]) return;
  camp.flags[chave] = true;
  for (const ef of c.efeitos ?? []) {
    aplicarEfeito(camp, ef);
    // Quem sabe mais sobre uma pessoa muda o jeito de tratar a família dela.
    if (ef.tipo === 'relacao') propagarParaFamilia(content, camp, ef.npc, ef.eixo, ef.delta);
  }
  if (camp.vivo) {
    // A missão mora no assentamento da pessoa: é lá que a comunidade existe
    // (tratar, abastecer e reconstruir mexem na cidade).
    const cidade = cidadeIdDoLocal(content, camp, npc.localBase);
    const fato = registrarFato(camp, {
      tipo: 'segredo_descoberto', local: cidade ?? npc.localBase, atores: ['jogador', npc.id],
      texto: c.texto, publico: false, conhecimento: 'testemunhado',
    });
    if (c.missao && cidade && camp.vivo.cidades[cidade]) oferecerMissao(camp, c.missao, fato, { ator: npc.id }, content);
  }
  camp.cronica.push({ turno: camp.turno, texto: c.texto, tipo: 'sistema' });
}

/**
 * A regra que antes vivia em ui/store.ts: depois de um turno com alguém,
 * confiança alta ou tê-la vigiado faz o segredo sair.
 */
export function talvezRevelarSegredo(content: ContentBundle, camp: Campaign, alvo?: NPC): boolean {
  if (!alvo?.segredo || camp.segredosRevelados.includes(alvo.id)) return false;
  const din = camp.npcState[alvo.id];
  const confiancaAlta = (din?.eixos.confianca ?? 0) >= CONFIANCA_PARA_SEGREDO;
  const vigiado = camp.flags[`vigiou.${alvo.id}`] === true;
  if (!confiancaAlta && !vigiado) return false;
  return revelarSegredo(content, camp, alvo.id);
}
