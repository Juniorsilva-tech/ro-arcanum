import type { Campaign, ContentBundle } from './types';
export type EstadoCasa = { lider?: string; legitimidade: number; tesouro: number; influencia: number; sucessoes: number; herdeiro?: string };
export function processarCasas(content: ContentBundle, camp: Campaign): void {
  const mundo = camp.mundo; if (!mundo || !content.casas?.length) return;
  mundo.casas ??= {};
  for (const casa of content.casas) {
    const estado = mundo.casas[casa.id] ??= { legitimidade: 65, tesouro: casa.riqueza === 'alta' ? 140 : casa.riqueza === 'media' ? 90 : 50, influencia: 30, sucessoes: 0 };
    const pessoas = content.npcs.filter(n => n.localBase === casa.sede && n.especie !== 'oni' && camp.npcState[n.id]?.vivo);
    estado.lider ??= pessoas[0]?.id; estado.herdeiro ??= pessoas.find(n => n.id !== estado.lider)?.id;
    if (estado.lider && camp.npcState[estado.lider]?.vivo === false) {
      const anterior = estado.lider, novo = estado.herdeiro && camp.npcState[estado.herdeiro]?.vivo ? estado.herdeiro : pessoas.find(n => n.id !== anterior)?.id;
      if (novo) { estado.lider = novo; estado.sucessoes++; estado.legitimidade = Math.max(25, estado.legitimidade - 15); }
    }
    const cidade = camp.vivo?.cidades[casa.sede];
    estado.tesouro = Math.max(0, Math.min(300, estado.tesouro + (cidade?.fomeDias ? -1 : .2)));
    estado.legitimidade = Math.max(0, Math.min(100, estado.legitimidade + (cidade?.fomeDias ? -.5 : .05)));
    estado.influencia = Math.max(0, Math.min(100, estado.influencia + (estado.tesouro > 100 ? .05 : -.05)));
  }
}
