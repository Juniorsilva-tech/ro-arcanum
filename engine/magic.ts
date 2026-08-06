// ARCANUM · Aprender e conjurar artes fora de combate (GDD §13.1, §13.3).
import type { Campaign, ContentBundle, Arte, Mestre } from './types';
import { clampRecursos } from './character';

// Mestres que ensinam no local atual, com as artes que ainda dá para aprender.
export function mestresQueEnsinamAqui(
  content: ContentBundle,
  camp: Campaign,
): { mestre: Mestre; artes: Arte[] }[] {
  const out: { mestre: Mestre; artes: Arte[] }[] = [];
  for (const m of content.mestres) {
    if (m.localBase !== camp.localAtual) continue;
    const artes = m.ensina
      .map((id) => content.artes.find((a) => a.id === id))
      .filter((a): a is Arte => !!a && !camp.personagem.artesConhecidas.includes(a.id));
    if (artes.length > 0) out.push({ mestre: m, artes });
  }
  return out;
}

export function podeAprender(
  content: ContentBundle,
  camp: Campaign,
  arteId: string,
): { ok: boolean; motivo?: string } {
  if (camp.personagem.artesConhecidas.includes(arteId)) return { ok: false, motivo: 'você já sabe' };
  const ensinaAqui = content.mestres.some(
    (m) => m.localBase === camp.localAtual && m.ensina.includes(arteId),
  );
  if (!ensinaAqui) return { ok: false, motivo: 'nenhum mestre ensina isto aqui' };
  return { ok: true };
}

export function aprenderArte(
  content: ContentBundle,
  camp: Campaign,
  arteId: string,
): { ok: boolean; motivo?: string } {
  const pode = podeAprender(content, camp, arteId);
  if (!pode.ok) return pode;
  camp.personagem.artesConhecidas.push(arteId);
  return { ok: true };
}

// Conjurar fora de combate: consome recurso, gera pressão, devolve uma linha.
export function conjurarLivre(
  content: ContentBundle,
  camp: Campaign,
  arteId: string,
): { ok: boolean; motivo?: string; texto?: string } {
  const p = camp.personagem;
  if (!p.artesConhecidas.includes(arteId)) return { ok: false, motivo: 'você não conhece essa arte' };
  const arte = content.artes.find((a) => a.id === arteId);
  if (!arte) return { ok: false, motivo: 'arte desconhecida' };
  if ((p.recursos[arte.custo.recurso] ?? 0) < arte.custo.valor) {
    return { ok: false, motivo: `sem ${arte.custo.recurso} suficiente` };
  }
  p.recursos[arte.custo.recurso] -= arte.custo.valor;
  if (arte.pressaoGerada) {
    p.pressoes[arte.pressaoGerada.medidor] = (p.pressoes[arte.pressaoGerada.medidor] ?? 0) + arte.pressaoGerada.valor;
  }
  if (/cura|curativo/.test(arte.id)) {
    p.recursos.vida = Math.min(p.recursosMax.vida, p.recursos.vida + 10);
  }
  clampRecursos(p);
  return { ok: true, texto: `Você conjura ${arte.nome}. ${arte.efeito}` };
}
