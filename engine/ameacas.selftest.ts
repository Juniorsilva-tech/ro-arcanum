// ARCANUM · Ameaça e assembleia da colônia (engine/ameacas.ts), sessão 58.
// O que estes testes seguram:
// - a ameaça nasce do mundo: bando da região, feras do entorno, casa que
//   reivindica, oni vivo — e o círculo da Clareira afasta onis;
// - a Colina dos Forcados avisa dois dias antes (o traço da etapa A);
// - a assembleia entende texto livre pelo catálogo, e recusa o que falta;
// - preparação que não fica pronta a tempo não conta;
// - mais preparação, melhor desfecho; evacuar salva gente e perde bens;
//   estocar guarda metade; tributo evita e paga o bando;
// - o resultado volta ao mundo (bando perde gente, fato público);
// - nada consome o RNG da campanha; tudo volta igual do save.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { fundarColonia, processarDiaColonia, sitioDe } from './colonia';
import { estadoBandos } from './bandos';
import {
  interpretarAssembleia, decidirAssembleia, resolverBatalha, processarAmeacas, diasDeAviso, podePreparar,
  type AmeacaColonia,
} from './ameacas';
import { exportar, importar } from './persistencia';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const fundada = (sitio: string, seed = sitio): Campaign => {
  const c = criarCampanha(C, { nome: 'T', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  c.localAtual = sitio;
  if (!fundarColonia(C, c, '').ok) throw new Error('fundar');
  return c;
};

/** Põe uma ameaça conhecida na colônia, para testar assembleia e batalha. */
const ameacar = (c: Campaign, extra: Partial<AmeacaColonia> = {}): AmeacaColonia => {
  const dia = c.calendario.dia;
  const a: AmeacaColonia = {
    id: 'ameaca_t', tipo: 'feras', nome: 'uma matilha', forca: 40, avisadaEm: dia, chegaEm: dia + 3,
    texto: 'teste', preparacoes: {}, conselho: [], tributo: 0, ...extra,
  };
  c.feudo!.ameaca = a;
  return a;
};
const rico = (c: Campaign) => { const f = c.feudo!; f.materiais = 500; f.tesouro = 500; f.comida = 500; f.populacao = 20; };

// ── Nasce do mundo ────────────────────────────────────────────────────────
{
  // Bando da região, crescido e com a colônia rica: aparece.
  let deBando = 0, primeira: AmeacaColonia | undefined;
  for (let t = 0; t < 6 && !primeira; t++) {
    const c = fundada('colina_forcados', `bando-${t}`);
    const f = c.feudo!, s = sitioDe(C, f.sitio)!;
    const b = Object.values(estadoBandos(C, c).bandos).find(x => x.regiao === s.regiao);
    if (!b) continue;
    b.membros = 10;
    for (let i = 0; i < 400 && !f.ameaca; i++) { rico(c); c.calendario.dia++; processarAmeacas(C, c, s); }
    if (f.ameaca?.tipo === 'bando') { deBando++; primeira = f.ameaca; }
  }
  ok(!!primeira, `o bando da região ameaça a colônia rica: "${primeira?.texto}"`);
  ok(primeira!.chegaEm - primeira!.avisadaEm === 5, 'na Colina dos Forcados o aviso vem 5 dias antes (3 + a vista do planalto)');
  ok(diasDeAviso(sitioDe(C, 'campo_ceifa')!) === 3, 'nos outros sítios, 3 dias');

  // Oni vivo não chega na Clareira das Pedras.
  const clareira = fundada('clareira_pedras', 'oni');
  const f = clareira.feudo!, s = sitioDe(C, f.sitio)!;
  clareira.kimetsu = { ...(clareira.kimetsu ?? {}), rivais: { r1: { vivo: true } } } as never;
  let oni = false;
  for (let i = 0; i < 600; i++) { clareira.calendario.dia++; processarAmeacas(C, clareira, s); if (f.ameaca?.tipo === 'oni') oni = true; f.ameaca = undefined; f.ultimaAmeaca = undefined; }
  ok(!oni, 'o círculo de pedras mantém onis longe da Clareira');
}

// ── Assembleia ────────────────────────────────────────────────────────────
{
  const i = interpretarAssembleia('Cavem uma vala na entrada, ponham sentinela e armem as mulheres com lanças');
  ok(i.entendidas.includes('fosso') && i.entendidas.includes('vigias') && i.entendidas.includes('milicia'), `texto livre vira catálogo: ${i.entendidas.join(', ')}`);
  ok(interpretarAssembleia('cantar para a lua').resto, 'o que não se traduz é dito como não entendido');

  const c = fundada('campo_ceifa', 'assembleia');
  rico(c);
  const a = ameacar(c);
  const r = decidirAssembleia(c, 'paliçada e armadilhas');
  ok(r.ok && a.preparacoes.palicada !== undefined && a.preparacoes.armadilhas !== undefined && c.feudo!.materiais === 500 - 40 - 15, `a assembleia decide e paga: "${r.mensagem}"`);
  ok(!decidirAssembleia(c, 'cantar para a lua').ok, 'sem nada entendido, nada é feito');
  ok(!podePreparar(c, 'tributo').pode, 'matilha não aceita tributo');
  c.feudo!.materiais = 0;
  ok(!decidirAssembleia(c, ['fosso']).ok, 'sem material, o fosso não sai');
  c.feudo!.populacao = 2;
  ok(!podePreparar(c, 'milicia').pode, 'milícia pede gente');
}

// ── A preparação muda a batalha ───────────────────────────────────────────
{
  const semNada = fundada('campo_ceifa', 'b1'), preparada = fundada('campo_ceifa', 'b1');
  for (const x of [semNada, preparada]) { rico(x); ameacar(x, { forca: 55 }); }
  decidirAssembleia(preparada, ['palicada', 'milicia', 'armadilhas', 'vigias']);
  const r1 = resolverBatalha(C, semNada)!, r2 = resolverBatalha(C, preparada)!;
  ok(r2.defesa > r1.defesa && ['repelida', 'resistida'].includes(r2.desfecho),
    `preparada, a colônia ${r2.desfecho} (defesa ${r2.defesa}); sem preparo, ${r1.desfecho} (defesa ${r1.defesa})`);
  ok(r2.linhas.some(l => l.startsWith('paliçada')), 'o relatório diz o que a paliçada fez');
  ok(!semNada.feudo!.ameaca && !!semNada.feudo!.ultimaBatalha, 'depois da batalha, a ameaça sai e o relatório fica');

  // Preparação atrasada não conta.
  const tarde = fundada('campo_ceifa', 'tarde');
  rico(tarde);
  const a = ameacar(tarde, { chegaEm: tarde.calendario.dia + 1 });
  decidirAssembleia(tarde, ['fosso']);
  const r3 = resolverBatalha(C, tarde)!;
  ok(r3.linhas.some(l => l.includes('não ficou pronta')) && a.preparacoes.fosso !== undefined, 'fosso de 3 dias decidido na véspera não fica pronto');

  // Evacuar salva gente; estocar guarda metade.
  const fugiu = fundada('campo_ceifa', 'b2'), ficou = fundada('campo_ceifa', 'b2');
  for (const x of [fugiu, ficou]) { rico(x); x.feudo!.seguranca = 0; ameacar(x, { forca: 200 }); }
  decidirAssembleia(fugiu, ['evacuar', 'estocar']);
  const rf = resolverBatalha(C, fugiu)!, rc = resolverBatalha(C, ficou)!;
  ok(rf.mortos === 0 && rc.mortos > 0, `evacuar: ninguém morre (${rf.mortos} contra ${rc.mortos})`);
  ok(rf.perdas.comida < rc.perdas.comida && rf.linhas.some(l => l.includes('enterrado')), `estocar: mesmo evacuando, perde menos (${rf.perdas.comida} contra ${rc.perdas.comida} de comida)`);
  ok(rc.mortos <= Math.ceil(20 * 0.25), `saque mata no máximo um quarto da gente (${rc.mortos} de 20)`);
}

// ── Tributo e o mundo ─────────────────────────────────────────────────────
{
  const c = fundada('colina_forcados', 'tributo');
  rico(c);
  const s = sitioDe(C, c.feudo!.sitio)!;
  const b = Object.values(estadoBandos(C, c).bandos).find(x => x.regiao === s.regiao) ?? Object.values(estadoBandos(C, c).bandos)[0];
  b.membros = 10;
  const tesouroBando = b.tesouro;
  ameacar(c, { tipo: 'bando', origem: b.id, nome: b.nome, tributo: 60, forca: 60 });
  decidirAssembleia(c, 'vamos pagar o tributo');
  const r = resolverBatalha(C, c)!;
  ok(r.desfecho === 'evitada' && b.tesouro === tesouroBando + 60, 'tributo pago: não vêm, e o ouro vai para o tesouro do bando');

  const d = fundada('colina_forcados', 'repele');
  rico(d);
  const bd = Object.values(estadoBandos(C, d).bandos)[0];
  bd.membros = 10;
  ameacar(d, { tipo: 'bando', origem: bd.id, nome: bd.nome, forca: 30 });
  decidirAssembleia(d, ['palicada', 'milicia']);
  const rd = resolverBatalha(C, d)!;
  ok(rd.desfecho === 'repelida' && bd.membros === 7, `bando repelido perde gente (10 → ${bd.membros})`);
  ok(d.vivo!.fatos.some(f => f.tipo === 'colonia_repelida'), 'e o vale fica sabendo');
}

// ── No dia da colônia, determinismo e save ────────────────────────────────
{
  const c = fundada('campo_ceifa', 'dia');
  rico(c);
  const a = ameacar(c, { chegaEm: c.calendario.dia + 1 });
  const cursor = c.rng.cursor;
  c.calendario.dia++;
  const rel = processarDiaColonia(C, c)!;
  ok(!c.feudo!.ameaca && rel.eventos.some(e => e.includes(a.nome)), 'no dia marcado, o dia da colônia resolve a batalha');
  ok(c.rng.cursor === cursor, 'ameaça e batalha não consomem o RNG da campanha');
  const d = fundada('campo_ceifa', 'save');
  rico(d);
  ameacar(d);
  decidirAssembleia(d, ['armadilhas']);
  const volta = importar(exportar(d));
  ok(volta.ok && JSON.stringify(volta.valor.feudo!.ameaca) === JSON.stringify(d.feudo!.ameaca), 'a ameaça e o que foi decidido voltam iguais do save');
}

console.log('\nAmeaça e assembleia: OK.');
