import type { Campaign, ContentBundle, NPC } from './types';

// A campanha pode criar pessoas que não existem no catálogo, como a família
// do protagonista. Menores continuam no estado familiar, mas não entram nas
// interações gerais nem no pacote do narrador adulto.
export function todosNpcs(content: ContentBundle, camp: Campaign): NPC[] {
  return [...content.npcs, ...(camp.npcsProcedurais ?? [])].filter(n => {
    return (camp.npcState[n.id]?.idade ?? n.idade) >= 18;
  });
}

export function npcPorId(content: ContentBundle, camp: Campaign, id: string): NPC | undefined {
  return todosNpcs(content, camp).find(n => n.id === id);
}
