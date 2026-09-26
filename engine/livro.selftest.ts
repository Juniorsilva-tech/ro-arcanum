// ARCANUM · O Livro se preenche jogando (engine/livro.ts).
// O que estes testes seguram:
// - no começo, quase tudo está no escuro: só boato do que fica perto;
// - estar no lugar localiza; estar com o mestre deixa ao alcance; aprender dá;
// - relíquia na mochila é sua; mestre morto fica perdido;
// - o que se descobriu não se esquece; tudo volta igual do save.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { avancarMundo } from './mundo';
import { estadosDaSecao, estadoNoLivro, atualizarLivro, descobertas } from './livro';
import { exportar, importar } from './persistencia';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed = 'livro'): Campaign => {
  const c = criarCampanha(C, { nome: 'Leitora', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  return c;
};
const contar = (c: Campaign) => ({
  mestres: descobertas(estadosDaSecao(C, c, 'mestres', C.mestres.map((x) => x.id))),
  trabalhos: descobertas(estadosDaSecao(C, c, 'trabalhos', C.trabalhos.map((x) => x.id))),
  artes: descobertas(estadosDaSecao(C, c, 'artes', C.artes.map((x) => x.id))),
  reliquias: descobertas(estadosDaSecao(C, c, 'reliquias', C.reliquias.map((x) => x.id))),
});

// ── Começo: quase tudo no escuro ──────────────────────────────────────────
{
  const c = nova();
  const n = contar(c);
  ok(n.mestres < C.mestres.length / 2 && n.artes < C.artes.length / 2 && n.reliquias < C.reliquias.length, `no começo o Livro mostra pouco: ${n.mestres}/${C.mestres.length} mestres, ${n.trabalhos}/${C.trabalhos.length} trabalhos, ${n.artes}/${C.artes.length} artes, ${n.reliquias}/${C.reliquias.length} relíquias`);
  ok(n.mestres + n.trabalhos > 0, 'mas o que fica perto já é boato');
  ok(C.trabalhos.every((t) => !!t.onde && C.locais.some((l) => l.id === t.onde)), 'todo trabalho diz onde se faz, e o lugar existe');
  const longe = C.mestres.find((m) => m.localBase === 'passo_lobo')!;
  ok(estadoNoLivro(C, c, 'mestres', longe.id) === 'desconhecida', `${longe.nome}, em outra região, é desconhecido no começo`);
}

// ── Camadas sobem com o que se faz ────────────────────────────────────────
{
  const c = nova('camadas');
  const neve = C.mestres.find((m) => m.id === 'mestre_neve')!;
  c.locaisVisitados = c.locaisVisitados.filter((l) => l !== neve.localBase);
  c.localAtual = 'taverna';
  const antes = estadoNoLivro(C, c, 'mestres', neve.id);
  c.locaisVisitados.push(neve.localBase);
  const depois = estadoNoLivro(C, c, 'mestres', neve.id);
  ok(['desconhecida', 'ouvida'].includes(antes) && ['localizada', 'acessivel'].includes(depois), `estar em ${neve.localBase} localiza a Neve (${antes} → ${depois})`);
  const arte = neve.ensina[0];
  ok(['ouvida', 'localizada', 'acessivel'].includes(estadoNoLivro(C, c, 'artes', arte)), 'e as artes dela saem do escuro junto');
  c.personagem.artesConhecidas.push(arte);
  ok(estadoNoLivro(C, c, 'mestres', neve.id) === 'obtida' && estadoNoLivro(C, c, 'artes', arte) === 'obtida', 'aprender com ela deixa mestre e arte como seus');

  const trab = C.trabalhos.find((t) => t.id === 'turno_na_mina')!;
  c.localAtual = trab.onde!;
  ok(estadoNoLivro(C, c, 'trabalhos', trab.id) === 'acessivel', 'estar na mina deixa o turno na mina ao alcance');

  const rel = C.reliquias.find((r) => !r.donoAtual)!;
  c.personagem.inventario[rel.id] = 1;
  ok(estadoNoLivro(C, c, 'reliquias', rel.id) === 'obtida', `${rel.nome} na mochila é sua`);
}

// ── Mestre morto; memória do Livro; save ──────────────────────────────────
{
  const c = nova('perda');
  const m = C.mestres.find((x) => x.podeMorrer && C.npcs.some((n) => n.ensinaMestre === x.id))!;
  const npc = C.npcs.find((n) => n.ensinaMestre === m.id)!;
  c.locaisVisitados.push(m.localBase);
  atualizarLivro(C, c);
  c.npcState[npc.id].vivo = false;
  ok(estadoNoLivro(C, c, 'mestres', m.id) === 'perdida', `${m.nome}: morte registrada, fica perdido no Livro`);

  const d = nova('memoria');
  const alvo = C.mestres.find((x) => x.localBase === 'mina')!;
  d.locaisVisitados.push('mina');
  atualizarLivro(C, d);
  const gravado = d.livro.mestres[alvo.id];
  d.locaisVisitados = d.locaisVisitados.filter((l) => l !== 'mina');
  ok(estadoNoLivro(C, d, 'mestres', alvo.id) === gravado && gravado !== 'desconhecida', `o que se descobriu não se esquece (${gravado})`);

  avancarMundo(C, d);
  const volta = importar(exportar(d));
  ok(volta.ok && JSON.stringify(volta.valor.livro) === JSON.stringify(d.livro), 'o Livro volta igual do save');
  ok(Object.values(d.livro.mestres).some((e) => e !== 'desconhecida'), 'e o dia do mundo grava as camadas');
}

// ── Lugares ───────────────────────────────────────────────────────────────
{
  const c = nova('lugares');
  const est = estadosDaSecao(C, c, 'lugares', C.locais.map((l) => l.id));
  const ocultos = C.locais.filter((l) => l.oculto);
  ok(ocultos.length > 0 && ocultos.every((l) => est[l.id] === 'desconhecida'), `lugar escondido não aparece antes de descoberto (${ocultos.map((l) => l.id).join(', ')})`);
  ok(est[c.localAtual] === 'obtida', 'onde você está, você esteve');
  const vizinho = C.locais.find((l) => l.id === c.localAtual)!.rotas.map((r) => r.destino).find((d) => !C.locais.find((l) => l.id === d)?.oculto)!;
  ok(['localizada', 'obtida'].includes(est[vizinho]), `vizinho por estrada: sabe o caminho (${vizinho})`);
  ok(Object.values(est).some((e) => e === 'ouvida') && descobertas(est) < C.locais.length, `da região, boato; e muito ainda no escuro (${descobertas(est)} de ${C.locais.length})`);
  const oculto = ocultos[0];
  c.flags[oculto.oculto!.flag] = true;
  c.locaisVisitados.push(oculto.id);
  ok(estadoNoLivro(C, c, 'lugares', oculto.id) === 'obtida', `descoberto e visitado, ${oculto.nome} entra no Livro`);
}

// ── Itens ─────────────────────────────────────────────────────────────────
{
  const c = nova('itens');
  const doMercado = C.itens.find((i) => (i.lojas ?? []).length === 1 && i.lojas![0] === 'mercado')!;
  c.localAtual = 'taverna';
  c.locaisVisitados = c.locaisVisitados.filter((l) => l !== 'mercado');
  const antes = estadoNoLivro(C, c, 'itens', doMercado.id);
  c.locaisVisitados.push('mercado');
  const depois = estadoNoLivro(C, c, 'itens', doMercado.id);
  c.localAtual = 'mercado';
  const aqui = estadoNoLivro(C, c, 'itens', doMercado.id);
  ok(antes === 'desconhecida' && depois === 'localizada' && aqui === 'acessivel', `${doMercado.nome}: ${antes} → visto no mercado (${depois}) → à venda aqui (${aqui})`);
  const n0 = descobertas(estadosDaSecao(C, nova('itens0'), 'itens', C.itens.map((i) => i.id)));
  ok(n0 < C.itens.length / 3, `no começo, poucos itens conhecidos (${n0} de ${C.itens.length}): item comum só vendo a loja`);
  c.personagem.inventario[doMercado.id] = 1;
  atualizarLivro(C, c);
  delete c.personagem.inventario[doMercado.id];
  ok(estadoNoLivro(C, c, 'itens', doMercado.id) === 'obtida', 'o que passou pela mochila fica como seu, mesmo vendido');
  const semLoja = (id: string) => !C.itens.find((i) => i.id === id)?.lojas?.length;
  const cria = C.criaturas.find((k) => (k.loot ?? []).some((x) => semLoja(x.item) && C.itens.some((i) => i.id === x.item)))!;
  const saque = cria.loot!.find((x) => semLoja(x.item) && C.itens.some((i) => i.id === x.item))!.item;
  const c2 = nova('saque');
  ok(estadoNoLivro(C, c2, 'itens', saque) === 'desconhecida', `${saque}, que ninguém vende, começa desconhecido`);
  c2.flags[`matou.${cria.id}`] = true;
  ok(estadoNoLivro(C, c2, 'itens', saque) === 'localizada', `vencer ${cria.nome} mostra que carrega ${saque}`);
}

console.log('\nO Livro: OK.');
