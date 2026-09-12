// ARCANUM · Aprender e conjurar artes fora de combate (GDD §13.1, §13.3).
import type { Campaign, ContentBundle, Arte, Mestre } from './types';
import { clampRecursos } from './character';
import { artePorId } from './fusao';
import { calcularContexto } from './availability';
import { avancarPeriodos } from './time';
import { crescerImpulsos } from './impulsos';
import { avancarMundo } from './mundo';
import { dominioDaArte, treinar } from './aptidao';
import { concederDespertar } from './progresso';

// O contexto é caro: percorre o elenco inteiro, que cresce com os moradores
// procedurais (ver engine/autonomia.ts). Calcular um por mestre fazia a
// varredura custar N vezes o mesmo trabalho — daí ele entra pronto por
// parâmetro e é calculado uma vez só por quem chama.
function mestreDisponivel(
  content: ContentBundle,
  camp: Campaign,
  mestre: Mestre,
  ctx = calcularContexto(content, camp),
): boolean {
  const vinculado = content.npcs.find(n => n.ensinaMestre === mestre.id);
  if (!vinculado) return mestre.localBase === camp.localAtual;
  return ctx.presentes.some(n => n.id === vinculado.id);
}

// Mestres que ensinam no local atual, com as artes que ainda dá para aprender.
/**
 * Repertorio minimo para um mestre esgotado valer um Despertar. Abaixo disso
 * "aprendi tudo que ele sabia" nao diz nada sobre o aluno.
 */
const MIN_ARTES_PARA_LIMIAR = 3;

export function mestresQueEnsinamAqui(
  content: ContentBundle,
  camp: Campaign,
): { mestre: Mestre; artes: Arte[] }[] {
  const out: { mestre: Mestre; artes: Arte[] }[] = [];
  const ctx = calcularContexto(content, camp);
  for (const m of content.mestres) {
    if (!mestreDisponivel(content, camp, m, ctx)) continue;
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
  const ctx = calcularContexto(content, camp);
  const ensinaAqui = content.mestres.some(
    (m) => m.ensina.includes(arteId) && mestreDisponivel(content, camp, m, ctx),
  );
  if (!ensinaAqui) return { ok: false, motivo: 'nenhum mestre ensina isto aqui' };
  const tecnica = content.artes.find(a => a.id === arteId)?.tecnica;
  if (tecnica) {
    if (camp.personagem.nivel < tecnica.nivelMinimo) return { ok: false, motivo: `exige nível ${tecnica.nivelMinimo}` };
    if (tecnica.exige && !camp.personagem.artesConhecidas.includes(tecnica.exige)) return { ok: false, motivo: 'aprenda a forma anterior primeiro' };
  }
  return { ok: true };
}

// Aprender custa os mesmos dois períodos que a tela sempre cobrou — o custo
// morava em ui/store.ts, então qualquer outro chamador (simulador, um segundo
// cliente) ganhava a arte de graça e sem o mundo andar.
export const PERIODOS_PARA_APRENDER = 2;

export function aprenderArte(
  content: ContentBundle,
  camp: Campaign,
  arteId: string,
): { ok: boolean; motivo?: string } {
  const pode = podeAprender(content, camp, arteId);
  if (!pode.ok) return pode;
  camp.personagem.artesConhecidas.push(arteId);
  // Quem ensinou fica olhando o ritmo: e' assim que um mestre desconfia de
  // talento antes de qualquer plateia (ver engine/aptidao.ts).
  const arte = content.artes.find(a => a.id === arteId);
  const mestreDaArte = content.mestres.find(m => m.ensina.includes(arteId));
  const observador = content.npcs.find(n => n.ensinaMestre === mestreDaArte?.id);
  treinar(content, camp, dominioDaArte(arte?.tecnica?.estilo), {
    mestre: 0.85, esforco: 0.8, recursos: 0.7, observadorId: observador?.id,
  });
  // Limiar social: o mestre esgotado. Aprender a ÚLTIMA arte de um mestre que
  // tinha um repertório de verdade não é um item a mais na lista — é o fim de
  // uma relação de anos, e o momento em que quem ensinava passa a não ter mais
  // o que dar. Exige repertório mínimo de propósito: um mestre de uma arte só
  // seria um limiar barato demais, alcançável na primeira semana de jogo.
  if (mestreDaArte && mestreDaArte.ensina.length >= MIN_ARTES_PARA_LIMIAR) {
    const faltando = mestreDaArte.ensina.filter(id => !camp.personagem.artesConhecidas.includes(id));
    if (faltando.length === 0) {
      const nome = content.npcs.find(n => n.ensinaMestre === mestreDaArte.id)?.nome ?? mestreDaArte.nome;
      concederDespertar(camp, 'mestre_esgotado', `${nome} não tem mais o que te ensinar`);
    }
  }

  camp.calendario = avancarPeriodos(camp.calendario, PERIODOS_PARA_APRENDER);
  crescerImpulsos(camp, PERIODOS_PARA_APRENDER);
  camp.capitulo.periodosDecorridos += PERIODOS_PARA_APRENDER;
  avancarMundo(content, camp);
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
  const arte = artePorId(content, camp, arteId);
  if (!arte) return { ok: false, motivo: 'arte desconhecida' };
  if (arte.tecnica) return { ok: false, motivo: 'esta forma exige um combate; seus efeitos são resolvidos contra um alvo' };
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
