// ARCANUM · Os animais da colônia (engine/rebanhos.ts), sessão 58.
// O que estes testes seguram:
// - cada espécie faz o que a ficha diz (ovo/leite, lã, carne, tração, patrulha);
// - o pasto do sítio sustenta um tanto, o resto sai do celeiro, o inverno aperta;
// - sem feno, animal morre;
// - crias só na primavera, só com casal, e quem cuida muda o quanto nasce;
// - a região só vende tantos por estação; abater dá a carne da ficha;
// - nada consome o RNG da campanha; tudo volta igual do save.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { fundarColonia, processarDiaColonia, sitioDe } from './colonia';
import { designarFuncao } from './colonos';
import {
  ANIMAIS, processarRebanhos, comprarAnimais, abaterAnimais, aVendaNaEstacao, pastoDoDia, fomeDoRebanho,
  segurancaDosCavalos, TETO_SEGURANCA_CAVALO,
} from './rebanhos';
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
  c.feudo!.rebanhos = {};
  return c;
};
const estacao = (c: Campaign, e: 'primavera' | 'verao' | 'outono' | 'inverno') => { c.calendario.estacao = e; };

// ── Cada espécie faz o que promete ────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'funcao');
  const f = c.feudo!, s = sitioDe(C, f.sitio)!;
  estacao(c, 'verao');
  f.rebanhos = { galinha: 10, vaca: 2, ovelha: 5, mula: 2 };
  f.comida = 200; f.tesouro = 0; f.materiais = 0;
  const r = processarRebanhos(c, s, false);
  ok(r.comida > 0, `galinha e vaca dão comida (${r.comida.toFixed(2)} no dia)`);
  ok(r.ouro > 0 && f.tesouro === r.ouro, `ovelha dá lã que vira ouro (${r.ouro.toFixed(2)})`);
  ok(r.material === 2 * ANIMAIS.mula.materialDia, 'a mula puxa carga: material por dia');
  f.rebanhos = { cavalo: 4 };
  ok(segurancaDosCavalos(f) === 4 * ANIMAIS.cavalo.seguranca, 'o cavalo soma segurança');
  f.rebanhos = { cavalo: 40 };
  ok(segurancaDosCavalos(f) === TETO_SEGURANCA_CAVALO, 'com teto: 40 cavalos não viram fortaleza');
}

// ── Pasto, feno e inverno ─────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'pasto');
  const f = c.feudo!, s = sitioDe(C, f.sitio)!;
  f.rebanhos = { vaca: 4 };
  f.comida = 100;
  const verao = processarRebanhos(c, s, false);
  f.comida = 100;
  const inverno = processarRebanhos(c, s, true);
  ok(pastoDoDia(s, true) < pastoDoDia(s, false), 'no inverno o pasto quase some');
  ok(inverno.feno > verao.feno, `no inverno o rebanho come do celeiro (${inverno.feno.toFixed(1)} de feno contra ${verao.feno.toFixed(1)})`);

  const areia = fundada('ruina_areia', 'sem-pasto');
  const fa = areia.feudo!, sa = sitioDe(C, fa.sitio)!;
  fa.rebanhos = { vaca: 3 };
  fa.comida = 0;
  const r = processarRebanhos(areia, sa, true);
  ok(r.morreram.length === 1 && fa.rebanhos!.vaca === 2, `sem feno, animal morre: "${r.morreram[0]}"`);
}

// ── Crias ─────────────────────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'crias');
  const f = c.feudo!, s = sitioDe(C, f.sitio)!;
  f.rebanhos = { galinha: 10 };
  estacao(c, 'verao');
  for (let i = 0; i < 30; i++) { f.comida = 500; processarRebanhos(c, s, false); c.calendario.dia++; }
  ok(f.rebanhos.galinha === 10, 'fora da primavera, nada nasce');
  estacao(c, 'primavera');
  for (let i = 0; i < 90; i++) { f.comida = 500; processarRebanhos(c, s, false); c.calendario.dia++; }
  ok(f.rebanhos.galinha! > 10, `numa primavera, 10 galinhas viram ${f.rebanhos.galinha}`);
  f.rebanhos = { vaca: 1 };
  for (let i = 0; i < 90; i++) { f.comida = 500; processarRebanhos(c, s, false); c.calendario.dia++; }
  ok(f.rebanhos.vaca === 1, 'uma vaca sozinha não tem cria');

  // Quem cuida muda o quanto nasce.
  const semCuidado = fundada('campo_ceifa', 'cuidado-a'), comCuidado = fundada('campo_ceifa', 'cuidado-b');
  const cuidadora = comCuidado.feudo!.colonos!.find(x => (x.aptidoes.rebanho ?? 0) >= 1) ?? comCuidado.feudo!.colonos![0];
  cuidadora.aptidoes.rebanho = 5;
  designarFuncao(comCuidado, cuidadora.id, 'rebanho');
  for (const x of [semCuidado, comCuidado]) {
    estacao(x, 'primavera');
    x.feudo!.rebanhos = { ovelha: 20 };
    for (let i = 0; i < 90; i++) { x.feudo!.comida = 500; processarRebanhos(x, sitioDe(C, x.feudo!.sitio)!, false); x.calendario.dia++; }
  }
  ok(comCuidado.feudo!.rebanhos!.ovelha! > semCuidado.feudo!.rebanhos!.ovelha!,
    `com pastora responsável nascem mais (${comCuidado.feudo!.rebanhos!.ovelha} contra ${semCuidado.feudo!.rebanhos!.ovelha} ovelhas)`);
}

// ── Comprar e abater ──────────────────────────────────────────────────────
{
  const c = fundada('colina_forcados', 'compra');
  const f = c.feudo!, s = sitioDe(C, f.sitio)!;
  f.tesouro = 1000;
  const teto = s.animais.cabra!;
  ok(!s.animais.vaca && !comprarAnimais(C, c, 'vaca', 1).ok && !f.rebanhos!.vaca, 'na Colina dos Forcados não se cria vaca, e não se compra');
  const r = comprarAnimais(C, c, 'cabra', teto + 5);
  ok(r.ok && f.rebanhos!.cabra === teto && aVendaNaEstacao(c, s, 'cabra') === 0, `a região vende no máximo ${teto} cabras por estação`);
  ok(!comprarAnimais(C, c, 'cabra', 1).ok, 'esgotado na estação, não há mais');
  ok(f.tesouro === 1000 - teto * ANIMAIS.cabra.preco, 'e cobra o preço da ficha');
  c.calendario.estacao = c.calendario.estacao === 'verao' ? 'outono' : 'verao';
  ok(aVendaNaEstacao(c, s, 'cabra') === teto, 'na estação seguinte, a região volta a vender');
  f.tesouro = 0;
  ok(!comprarAnimais(C, c, 'cabra', 1).ok, 'sem ouro, não compra');
  const comida = f.comida;
  const ab = abaterAnimais(c, 'cabra', 2);
  ok(ab.ok && f.comida === comida + 2 * ANIMAIS.cabra.carne && f.rebanhos!.cabra === teto - 2, `abater dá a carne da ficha: "${ab.mensagem}"`);
  f.rebanhos!.mula = 2;
  ok(!abaterAnimais(c, 'mula', 1).ok, 'mula não se abate');
}

// ── Integração: o dia da colônia ──────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'integra');
  const f = c.feudo!;
  f.rebanhos = { vaca: 3, cavalo: 4 };
  f.comida = 300;
  c.calendario.dia++;
  const r = processarDiaColonia(C, c)!;
  ok(!!r.rebanho && r.rebanho.comida > 0, 'o dia da colônia roda o rebanho e mostra no relatório');
  ok(fomeDoRebanho(f) > 0, 'e o rebanho come');
}

// ── Determinismo e save ───────────────────────────────────────────────────
{
  const c = fundada('clareira_pedras', 'rng');
  const f = c.feudo!, s = sitioDe(C, f.sitio)!;
  f.rebanhos = { porco: 12, galinha: 30 };
  estacao(c, 'primavera');
  const cursor = c.rng.cursor;
  for (let i = 0; i < 60; i++) { f.comida = 500; processarRebanhos(c, s, false); c.calendario.dia++; }
  ok(c.rng.cursor === cursor, 'o rebanho não consome o RNG da campanha');
  const volta = importar(exportar(c));
  ok(volta.ok && JSON.stringify(volta.valor.feudo!.rebanhos) === JSON.stringify(f.rebanhos)
    && JSON.stringify(volta.valor.feudo!.criasAcumuladas) === JSON.stringify(f.criasAcumuladas), 'o rebanho volta igual do save');
}

console.log('\nRebanho da colônia: OK.');
