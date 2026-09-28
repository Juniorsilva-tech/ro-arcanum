// ARCANUM · Colônia num lugar real: terreno, água, traços (engine/colonia.ts).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import {
  fundarColonia, podeFundarAqui, efeitosDoSitio, modificadoresDoSitio, processarDiaColonia, capacidadeReal,
  migrarColonia, reacenderFarol, sitioDe, RENDE_LAVOURA, GENTE_POR_AGUA,
} from './colonia';
import { obterFeudo } from './reino';
import { avancarMundo } from './mundo';
import { exportar, importar } from './persistencia';
import type { Campaign } from './types';
import type { Estacao } from './time';
import { eficiencia } from './colonos';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string): Campaign => {
  const c = criarCampanha(C, { nome: 'T', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};
const fundada = (sitio: string, seed = sitio): Campaign => {
  const c = nova(seed);
  c.localAtual = sitio;
  const r = fundarColonia(C, c, '');
  if (!r.ok) throw new Error(r.mensagem);
  return c;
};
const dias = (c: Campaign, n: number, estacao?: Estacao) => {
  for (let i = 0; i < n; i++) { c.calendario.dia++; if (estacao) c.calendario.estacao = estacao; processarDiaColonia(C, c); }
};

// ── 1. Os sítios ──────────────────────────────────────────────────────────
{
  const sitios = C.sitiosColonia ?? [];
  ok(sitios.length === 6, `Seis sítios: ${sitios.map(s => s.nome).join(', ')}`);
  const c = nova('sitios');
  ok(sitios.every(s => { const l = C.locais.find(x => x.id === s.id); return l && !l.oculto && !c.vivo!.cidades[s.id]; }), 'Todos são lugares reais do mapa, visíveis, sem cidade dona');
  ok(sitios.every(s => { const e = efeitosDoSitio(s); return e.some(x => x.tipo === 'vantagem') && e.some(x => x.tipo === 'desvantagem'); }), 'Todo sítio tem vantagem e desvantagem');
  ok(sitios.every(s => Object.values(s.terreno).every(v => v >= 0 && v <= 3)), 'Terreno de 0 a 3');
  const campo = sitioDe(C, 'campo_ceifa')!, areia = sitioDe(C, 'ruina_areia')!;
  ok(efeitosDoSitio(campo).some(e => e.texto.includes(`${Math.round(RENDE_LAVOURA[3] * 100)}%`)) && efeitosDoSitio(areia).some(e => e.texto.includes(`no máximo ${GENTE_POR_AGUA[0]} pessoas`)), 'O texto cita o mesmo número que a regra usa');
}

// ── 2. Fundar ─────────────────────────────────────────────────────────────
{
  const c = nova('fundar');
  c.localAtual = 'taverna';
  ok(!podeFundarAqui(C, c).pode && !fundarColonia(C, c, 'X').ok, 'Na taverna não se funda');
  c.localAtual = 'campo_ceifa';
  const r = fundarColonia(C, c, 'Pedra Nova');
  const f = obterFeudo(c);
  ok(r.ok && f.sitio === 'campo_ceifa' && f.localId === 'campo_ceifa' && f.nome === 'Pedra Nova', 'No Campo da Ceifa, funda, e a colônia fica no lugar do mapa');
  ok(f.populacao === 6 && !f.edificios.castelo && !f.edificios.quartel && !f.edificios.muralha_baluarte && f.edificios.lavoura_silos === 1, 'Começa pequena: seis pessoas, uma roça, nada de castelo');
  ok(!fundarColonia(C, c, 'Outra').ok, 'Uma colônia por campanha');
}

// ── 3. O terreno decide a economia ────────────────────────────────────────
{
  const campo = fundada('campo_ceifa'), areia = fundada('ruina_areia');
  // A mesma planta nos dois: o painço do ermo existe justamente para encurtar
  // essa diferença (engine/cultivos.ts), e aqui o assunto é o terreno.
  for (const c of [campo, areia]) { c.feudo!.comida = 100; c.feudo!.populacao = 10; c.feudo!.cultivo = 'trigo'; }
  // Mede o que o TERRENO deu (roça + caça − consumo − tributo), pelo relatório
  // do dia: desde as etapas D e E, furto e ameaça também mexem no celeiro, e
  // este teste é sobre o terreno.
  const saldo = (c: Campaign) => {
    let t = 0;
    for (let i = 0; i < 10; i++) {
      c.calendario.dia++; c.calendario.estacao = 'verao';
      const r = processarDiaColonia(C, c)!;
      t += r.lavoura + r.selvagem - r.consumo - r.tributo;
    }
    return t;
  };
  const sCampo = saldo(campo), sAreia = saldo(areia);
  ok(sCampo > sAreia + 20, `Em 10 dias, o terreno do Campo da Ceifa dá ${Math.round(sCampo)} de comida e o da Ruína de Areia ${Math.round(sAreia)}`);
  const clareiraM = modificadoresDoSitio(sitioDe(C, 'clareira_pedras')!).materiaisDia, areiaM = modificadoresDoSitio(sitioDe(C, 'ruina_areia')!).materiaisDia;
  const cl = fundada('clareira_pedras', 'madeira'), ar = fundada('ruina_areia', 'sem-madeira');
  for (const c of [cl, ar]) { c.feudo!.comida = 500; c.feudo!.materiais = 0; }
  dias(cl, 1, 'verao'); dias(ar, 1, 'verao');
  // Desde a etapa B, o material do dia passa pela mão de quem cuida das obras
  // (engine/colonos.ts): sem responsável, 60%.
  const efObras = eficiencia(cl.feudo!, 'obras');
  ok(Math.abs(cl.feudo!.materiais - clareiraM * efObras) < 1e-9 && clareiraM > areiaM, `Madeira da mata: ${clareiraM} de material por dia na clareira (${(clareiraM * efObras).toFixed(1)} sem responsável pelas obras), ${areiaM} na areia`);
  ok(modificadoresDoSitio(sitioDe(C, 'colina_forcados')!).segurancaBase > modificadoresDoSitio(sitioDe(C, 'campo_ceifa')!).segurancaBase, 'A colina começa mais segura que o campo aberto');
  const vau = fundada('vau_pedra'), clareira = fundada('clareira_pedras');
  const o0 = vau.feudo!.tesouro, o1 = clareira.feudo!.tesouro;
  dias(vau, 10, 'verao'); dias(clareira, 10, 'verao');
  ok(vau.feudo!.tesouro - o0 > clareira.feudo!.tesouro - o1, `O vau cobra travessia: +${Math.round(vau.feudo!.tesouro - o0)} de ouro em 10 dias, contra +${Math.round(clareira.feudo!.tesouro - o1)} na clareira isolada`);
  const inv = fundada('colina_forcados', 'inverno'), ver = fundada('colina_forcados', 'verao');
  for (const c of [inv, ver]) { c.feudo!.comida = 200; c.feudo!.populacao = 10; }
  dias(inv, 10, 'inverno'); dias(ver, 10, 'verao');
  ok(inv.feudo!.comida < ver.feudo!.comida, 'Inverno duro na colina: menos comida que no verão');
}

// ── 4. Água ───────────────────────────────────────────────────────────────
{
  const c = fundada('ruina_areia', 'agua');
  const f = c.feudo!;
  f.capacidadeHabitacional = 100; f.populacao = 20; f.comida = 500;
  ok(capacidadeReal(C, f) === GENTE_POR_AGUA[0], `Sem água, a capacidade real é ${GENTE_POR_AGUA[0]}, mesmo com abrigo para 100`);
  dias(c, 10, 'verao');
  ok(f.populacao === GENTE_POR_AGUA[0], `Quem passou disso foi embora (${f.populacao})`);
  f.edificios.cisterna_poco = 1;
  ok(capacidadeReal(C, f) === GENTE_POR_AGUA[0] + 40, 'Uma cisterna: mais 40');
}

// ── 5. Os traços ──────────────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'marechal');
  const t0 = c.vivo!.cidades.tessel.comida;
  c.vivo!.cidades.tessel.comida = 100;
  dias(c, 5, 'verao');
  ok(c.feudo!.ultimoRelatorio!.tributo > 0 && c.vivo!.cidades.tessel.comida > 100, 'Trigo do marechal: um quinto da roça vai para Tessel');
  c.feudo!.acordos = ['tessel'];
  dias(c, 1, 'verao');
  ok(c.feudo!.ultimoRelatorio!.tributo === 0, 'Com acordo com Tessel, não');
  void t0;

  const a = fundada('ruina_areia', 'tempestade');
  a.feudo!.obrasEmAndamento.push({ id: 'o', tipo: 'moradias', nome: 'Casas', nivelAlvo: 1, periodosRestantes: 100, periodosTotais: 100, custoOuro: 0, custoMateriais: 0 });
  a.feudo!.comida = 999;
  dias(a, 90, 'verao');
  ok(a.feudo!.historicoEventos.some(e => e.texto.startsWith('Tempestade de areia')) && a.feudo!.obrasEmAndamento[0].periodosRestantes > 100, 'A areia devolve moedas e soterra obra');

  const fq = fundada('farol_quebrado', 'farol');
  fq.feudo!.comida = 999;
  dias(fq, 60, 'verao');
  ok(fq.feudo!.historicoEventos.some(e => e.texto.startsWith('Um navio quebrou')), 'Farol apagado: o mar traz destroços');
  fq.feudo!.materiais = 100; fq.feudo!.tesouro = 100;
  ok(reacenderFarol(C, fq).ok && fq.feudo!.farolAceso && fq.feudo!.acordos!.includes('mareu'), 'Reacender o farol: acordo com a guilda de Mareu');

  const cl = fundada('clareira_pedras', 'sonho');
  cl.feudo!.comida = 999;
  const e0 = cl.feudo!.estabilidade;
  dias(cl, 21, 'verao');
  ok(cl.feudo!.estabilidade < e0, 'O círculo de pedras: sem santuário, a colônia dorme mal');

  const vau = fundada('vau_pedra', 'cheia');
  vau.feudo!.comida = 400;
  dias(vau, 120, 'primavera');
  ok(vau.feudo!.historicoEventos.some(e => e.texto.startsWith('O rio subiu')), 'O vau: o rio sobe na primavera');
}

// ── 6. Integração e save ──────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'mundo');
  const rng = JSON.stringify(c.rng);
  processarDiaColonia(C, c);
  ok(JSON.stringify(c.rng) === rng, 'A colônia não consome o RNG da campanha');
  c.feudo!.comida = 300;
  const d0 = c.calendario.dia;
  c.calendario.periodoIndex = 3;
  avancarMundo(C, c);
  c.calendario = { ...c.calendario, dia: d0 + 1, periodoIndex: 0 };
  avancarMundo(C, c);
  ok(c.feudo!.ultimoRelatorio?.dia === d0 + 1, 'O dia da colônia roda dentro do dia do mundo');

  const antigo = nova('antigo');
  const f = obterFeudo(antigo);
  f.fundado = true; f.localId = 'halvet_colinas'; f.bioma = 'planicie';
  const r = importar(exportar(antigo));
  if (!r.ok) throw new Error('save');
  migrarColonia(C, r.valor);
  ok(r.valor.feudo!.sitio === 'campo_ceifa' && r.valor.feudo!.localId === 'campo_ceifa', 'Save antigo (ponto que não era lugar do mapa) vai para o sítio real');
}

console.log('\nColônia: OK.');
