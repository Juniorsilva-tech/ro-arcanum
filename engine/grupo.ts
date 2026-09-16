import type { Campaign, ContentBundle } from './types';
import { periodoAtual } from './time';
import { npcPorId } from './elenco';
import { localEfetivo } from './historiaViva';

export function alternarCompanheiro(content: ContentBundle, camp: Campaign, npcId: string): { ok: boolean; motivo?: string; entrou?: boolean } {
  if (camp.combate && !camp.combate.terminado) return { ok: false, motivo: 'termine o combate primeiro' };
  camp.grupo ??= [];
  if (camp.grupo.includes(npcId)) {
    camp.grupo = camp.grupo.filter(id => id !== npcId);
    const civil = camp.vivo?.pessoas[npcId];
    if (civil) { civil.local = camp.localAtual; civil.deslocado = true; }
    return { ok: true, entrou: false };
  }
  if (camp.grupo.length >= 2) return { ok: false, motivo: 'o grupo já tem dois companheiros' };
  const npc = npcPorId(content, camp, npcId);
  if (!npc?.combatente) return { ok: false, motivo: 'essa pessoa não atua como combatente' };
  if (!camp.npcState[npcId]?.vivo) return { ok: false, motivo: `${npc.nome} está morto` };
  const local = localEfetivo(camp, npc, undefined, content);
  if (camp.vivo?.pessoas[npcId]?.objetivo === 'cativo') return { ok: false, motivo: 'essa pessoa está em cativeiro' };
  if (local !== camp.localAtual) return { ok: false, motivo: `${npc.nome} não está aqui agora` };
  const confianca = camp.npcState[npcId]?.eixos.confianca ?? 0;
  if (confianca < 5 && (camp.reputacao[npc.faccaoId] ?? 0) < 5) return { ok: false, motivo: 'é preciso confiança ou reputação com a facção' };
  camp.grupo.push(npcId);
  return { ok: true, entrou: true };
}
