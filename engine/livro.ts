// ARCANUM · O Livro se preenche jogando (GDD §13: "preencher o Livro é o jogo").
//
// O estado de cada entrada (camp.livro) existia desde o começo — desconhecida,
// ouvida, localizada, acessível, obtida, perdida — mas nada nunca o mudava, e a
// tela mostrava todos os mestres, trabalhos, artes e relíquias completos no
// primeiro minuto de jogo. Agora a engine deriva a camada de cada entrada do
// que o jogador fez de verdade:
//
// - OUVIDA: o lugar da entrada fica na região de algum lugar em que você já
//   esteve, ou é vizinho por estrada de um deles. É o boato do povo.
// - LOCALIZADA: você esteve no lugar (o mestre mora ali, a relíquia está ali,
//   o trabalho se faz ali), ou conhece quem guarda a relíquia.
// - ACESSÍVEL: você está com o mestre e ele pode te ensinar agora.
// - OBTIDA: você aprendeu uma arte dele, tem a relíquia, conhece a arte.
// - PERDIDA: o mestre morreu.
//
// A camada só sobe (o que se descobriu não se esquece), exceto PERDIDA, que
// vale por cima de tudo. `estadoNoLivro` lê sempre a camada atual, sem esperar
// o dia virar; `atualizarLivro` grava, e roda no dia do mundo.
import type { Campaign, ContentBundle, EstadoEntrada } from './types';
import { calcularContexto } from './availability';

export type SecaoLivro = 'mestres' | 'trabalhos' | 'artes' | 'reliquias';

const ORDEM: EstadoEntrada[] = ['desconhecida', 'ouvida', 'localizada', 'acessivel', 'obtida'];
const nivel = (e: EstadoEntrada | undefined) => (e ? ORDEM.indexOf(e) : 0);
const maior = (a: EstadoEntrada, b: EstadoEntrada): EstadoEntrada => (nivel(b) > nivel(a) ? b : a);

type Conhecimento = { visitados: Set<string>; vizinhos: Set<string>; regioes: Set<string> };

function conhecimento(content: ContentBundle, camp: Campaign): Conhecimento {
  const visitados = new Set([...camp.locaisVisitados, camp.localAtual]);
  const vizinhos = new Set<string>();
  const regioes = new Set<string>();
  for (const id of visitados) {
    const l = content.locais.find((x) => x.id === id);
    if (!l) continue;
    if (l.regiao) regioes.add(l.regiao);
    for (const r of l.rotas) vizinhos.add(r.destino);
  }
  return { visitados, vizinhos, regioes };
}

/** Camada de um lugar: esteve lá (localizada), ou é da região / vizinho (ouvida). */
function camadaDoLugar(content: ContentBundle, k: Conhecimento, localId?: string): EstadoEntrada {
  if (!localId) return 'desconhecida';
  if (k.visitados.has(localId)) return 'localizada';
  const regiao = content.locais.find((l) => l.id === localId)?.regiao;
  if (k.vizinhos.has(localId) || (regiao && k.regioes.has(regiao))) return 'ouvida';
  return 'desconhecida';
}

function derivar(content: ContentBundle, camp: Campaign, secao: SecaoLivro, id: string, k: Conhecimento, presentes: Set<string>): EstadoEntrada {
  const p = camp.personagem;
  if (secao === 'mestres') {
    const m = content.mestres.find((x) => x.id === id);
    if (!m) return 'desconhecida';
    const npc = content.npcs.find((n) => n.ensinaMestre === m.id);
    if (m.podeMorrer && npc && camp.npcState[npc.id]?.vivo === false) return 'perdida';
    if (m.ensina.some((a) => p.artesConhecidas.includes(a))) return 'obtida';
    const aqui = npc ? presentes.has(npc.id) : m.localBase === camp.localAtual;
    if (aqui) return 'acessivel';
    return camadaDoLugar(content, k, npc?.localBase ?? m.localBase);
  }
  if (secao === 'artes') {
    if (p.artesConhecidas.includes(id) || (camp.artesCriadas ?? []).some((a) => a.id === id)) return 'obtida';
    // Uma arte é tão conhecida quanto o melhor mestre que a ensina.
    let e: EstadoEntrada = 'desconhecida';
    for (const m of content.mestres.filter((x) => x.ensina.includes(id))) {
      const em = derivar(content, camp, 'mestres', m.id, k, presentes);
      if (em !== 'perdida') e = maior(e, em === 'obtida' ? 'acessivel' : em);
    }
    return e;
  }
  if (secao === 'reliquias') {
    const r = content.reliquias.find((x) => x.id === id);
    if (!r) return 'desconhecida';
    if (r.donoAtual === 'jogador' || (p.inventario[id] ?? 0) > 0 || Object.values(p.equipado ?? {}).includes(id)) return 'obtida';
    let e = camadaDoLugar(content, k, r.localAtual);
    if (r.donoAtual) {
      const dono = content.npcs.find((n) => n.id === r.donoAtual);
      // Conhecer quem guarda a relíquia é saber onde ela está.
      if ((camp.npcState[r.donoAtual]?.memoria?.length ?? 0) > 0 || presentes.has(r.donoAtual)) e = maior(e, 'localizada');
      else e = maior(e, camadaDoLugar(content, k, dono?.localBase) === 'desconhecida' ? 'desconhecida' : 'ouvida');
    }
    return e;
  }
  const t = content.trabalhos.find((x) => x.id === id);
  if (!t) return 'desconhecida';
  const e = camadaDoLugar(content, k, t.onde);
  return t.onde === camp.localAtual ? 'acessivel' : e;
}

function combinar(guardado: EstadoEntrada | undefined, derivado: EstadoEntrada): EstadoEntrada {
  if (derivado === 'perdida') return 'perdida';
  if (guardado === 'perdida') return 'perdida';
  return maior(guardado ?? 'desconhecida', derivado);
}

/** A camada atual de uma entrada do Livro (sem gravar). */
export function estadoNoLivro(content: ContentBundle, camp: Campaign, secao: SecaoLivro, id: string): EstadoEntrada {
  const k = conhecimento(content, camp);
  const presentes = new Set(calcularContexto(content, camp).presentes.map((n) => n.id));
  return combinar(camp.livro?.[secao]?.[id], derivar(content, camp, secao, id, k, presentes));
}

/** Todas as camadas de uma seção de uma vez (a tela usa esta: o contexto é caro). */
export function estadosDaSecao(content: ContentBundle, camp: Campaign, secao: SecaoLivro, ids: string[]): Record<string, EstadoEntrada> {
  const k = conhecimento(content, camp);
  const presentes = new Set(calcularContexto(content, camp).presentes.map((n) => n.id));
  return Object.fromEntries(ids.map((id) => [id, combinar(camp.livro?.[secao]?.[id], derivar(content, camp, secao, id, k, presentes))]));
}

/** Grava as camadas atuais em camp.livro. Chamado no dia do mundo. */
export function atualizarLivro(content: ContentBundle, camp: Campaign): void {
  if (!camp.livro) return;
  const secoes: [SecaoLivro, string[]][] = [
    ['mestres', content.mestres.map((x) => x.id)],
    ['trabalhos', content.trabalhos.map((x) => x.id)],
    ['artes', content.artes.map((x) => x.id)],
    ['reliquias', content.reliquias.map((x) => x.id)],
  ];
  for (const [secao, ids] of secoes) {
    const agora = estadosDaSecao(content, camp, secao, ids);
    const destino = (camp.livro[secao] ??= {});
    for (const id of ids) destino[id] = agora[id];
  }
}

/** Quantas entradas da seção já saíram do escuro. */
export function descobertas(estados: Record<string, EstadoEntrada>): number {
  return Object.values(estados).filter((e) => e !== 'desconhecida').length;
}
