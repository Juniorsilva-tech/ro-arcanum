// ARCANUM · Lógica de missões (GDD §13.2 / quests).
import type { Campaign, ContentBundle } from './types';

// Ativa missões cujo dador você já conheceu, e conclui as que tiveram todos os
// objetivos (flags) cumpridos, entregando a recompensa. Retorna títulos concluídos.
export function verificarQuests(content: ContentBundle, camp: Campaign): string[] {
  // Ativação por contato com o dador.
  for (const q of content.quests) {
    if (camp.questEstado[q.id] !== 'desconhecida') continue;
    if (!q.dador) {
      camp.questEstado[q.id] = 'ativa';
      continue;
    }
    const din = camp.npcState[q.dador];
    if (din && din.memoria.length > 0) camp.questEstado[q.id] = 'ativa';
  }

  const concluidas: string[] = [];
  for (const q of content.quests) {
    if (camp.questEstado[q.id] !== 'ativa') continue;
    const completa = q.objetivos.every((o) => !!camp.flags[o.flag]);
    if (!completa) continue;
    camp.questEstado[q.id] = 'concluida';
    const p = camp.personagem;
    if (q.recompensa.dinheiro) p.dinheiro += q.recompensa.dinheiro;
    if (q.recompensa.xp) p.xp += q.recompensa.xp;
    if (q.recompensa.item) p.inventario[q.recompensa.item] = (p.inventario[q.recompensa.item] ?? 0) + 1;
    for (const r of q.recompensa.reputacao ?? []) {
      camp.reputacao[r.faccaoId] = (camp.reputacao[r.faccaoId] ?? 0) + r.delta;
    }
    concluidas.push(q.titulo);
  }
  return concluidas;
}
