// ARCANUM · Renome da colônia e reação do mundo (engine/renome.ts), sessão 58.
// O que estes testes seguram:
// - o nível vem de renome, gente e governo, com teto pelo renome;
// - o nível não oscila a cada dia ruim, mas cai quando o renome despenca;
// - cada marco de renome traz um enviado da casa da região, uma vez;
// - acordo acaba com a cobrança (o quinto do trigo de Tessel e a ameaça da
//   casa); proteção paga sobe a segurança; recusa deixa a casa hostil;
// - fundar e subir de nível viram fato público;
// - a colônia com sítio não sobe mais de nível por contar prédio.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { fundarColonia, processarDiaColonia, sitioDe } from './colonia';
import { processarCicloReino } from './reino';
import { resolverAudiencia } from './audiencias';
import { tierDaColonia, processarRenome, casaDaRegiao, MARCOS_DE_RENOME } from './renome';
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

// ── Nível pelo renome ─────────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'tier');
  const f = c.feudo!;
  ok(c.vivo!.fatos.some(x => x.tipo === 'colonia_fundada'), 'fundar vira fato público: o vale fica sabendo');
  f.populacao = 300; f.renome = 0;
  ok(tierDaColonia(f) === 2, 'trezentas pessoas e renome zero: não passa de nível 2');
  f.renome = 120;
  ok(tierDaColonia(f) > 5, `com renome 120 a mesma gente vira nível ${tierDaColonia(f)}`);
  const s = sitioDe(C, f.sitio)!;
  f.tierReino = 1; f.audiencia = undefined; f.marcosRenome = [...MARCOS_DE_RENOME];
  const linhas = processarRenome(C, c, s);
  ok(f.tierReino === tierDaColonia(f) && linhas.length > 0, `subir de nível avisa: "${linhas[0]}"`);
  ok(c.vivo!.fatos.some(x => x.tipo === 'colonia_cresce'), 'e vira fato público');
  const alto = f.tierReino;
  f.renome = 100;
  processarRenome(C, c, s);
  ok(tierDaColonia(f) === alto - 1 && f.tierReino === alto, `um dia ruim não derruba o nível (o cálculo dá ${tierDaColonia(f)}, fica ${f.tierReino})`);
  f.renome = 0;
  processarRenome(C, c, s);
  ok(f.tierReino === alto - 1, 'o renome despencou: o nível cai um degrau por vez');

  // Prédio não sobe nível de colônia com sítio.
  const d = fundada('campo_ceifa', 'predios');
  const g = d.feudo!;
  for (const k of Object.keys(g.edificios)) (g.edificios as Record<string, number>)[k] = 5;
  g.renome = 0;
  processarCicloReino(d, 4);
  ok(g.tierReino === 1, 'encher a colônia de prédios não sobe o nível sem renome');
}

// ── Enviado: acordo ───────────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'acordo');
  const f = c.feudo!, s = sitioDe(C, f.sitio)!;
  ok(casaDaRegiao(C, s) === 'tessel', 'nos Campos da Ceifa, quem responde é a casa que reivindica: Tessel');
  f.renome = 20; f.tesouro = 500;
  processarRenome(C, c, s);
  ok(f.audiencia?.tipo === 'enviado' && f.audiencia.origem === 'tessel', 'renome 15 cruzado: chega o enviado de Tessel');
  const repAntes = c.mundo?.casas?.tessel?.reputacao ?? 0;
  const r = resolverAudiencia(c, 'acordo', C);
  ok(r.ok && f.acordos!.includes('tessel'), `acordo selado: "${r.mensagem}"`);
  ok(!!c.mundo?.casas?.tessel && (c.mundo.casas.tessel.reputacao ?? 0) > repAntes, `a reputação com a casa sobe (${repAntes} → ${c.mundo?.casas?.tessel?.reputacao})`);
  f.edificios.lavoura_silos = 3; f.comida = 200;
  c.calendario.dia++;
  const rel = processarDiaColonia(C, c)!;
  ok(rel.tributo === 0, 'com acordo, Tessel deixa de levar o quinto do trigo');
  f.audiencia = undefined;
  processarRenome(C, c, s);
  ok(!f.audiencia, 'com acordo, a casa não manda outro enviado');
}

// ── Enviado: proteção, recusa, e só uma vez por marco ─────────────────────
{
  const c = fundada('farol_quebrado', 'protecao');
  const f = c.feudo!, s = sitioDe(C, f.sitio)!;
  f.renome = 45; f.tesouro = 500;
  processarRenome(C, c, s);
  const seg = f.seguranca;
  ok(resolverAudiencia(c, 'protecao', C).ok && f.seguranca === Math.min(100, seg + 10), 'proteção paga: a segurança sobe 10');

  const d = fundada('colina_forcados', 'recusa');
  const g = d.feudo!, t = sitioDe(C, g.sitio)!;
  g.renome = 20;
  processarRenome(C, d, t);
  resolverAudiencia(d, 'recusar', C);
  ok(g.casasHostis?.includes('corveira'), 'recusar deixa Corveira hostil');
  processarRenome(C, d, t);
  ok(!g.audiencia, 'o mesmo marco não traz outro enviado');
  g.renome = 45;
  processarRenome(C, d, t);
  ok(g.audiencia?.tipo === 'enviado', 'o marco seguinte traz de novo');

  const semCasa = fundada('clareira_pedras', 'semcasa');
  const h = semCasa.feudo!, u = sitioDe(C, h.sitio)!;
  h.renome = 90;
  processarRenome(C, semCasa, u);
  ok(!casaDaRegiao(C, u) && !h.audiencia, 'no Bosque de Vintra não há casa: ninguém manda enviado');
}

// ── Save ──────────────────────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'save');
  const f = c.feudo!;
  f.renome = 20;
  processarRenome(C, c, sitioDe(C, f.sitio)!);
  const volta = importar(exportar(c));
  ok(volta.ok && JSON.stringify(volta.valor.feudo!.audiencia) === JSON.stringify(f.audiencia)
    && JSON.stringify(volta.valor.feudo!.marcosRenome) === JSON.stringify(f.marcosRenome), 'enviado e marcos voltam iguais do save');
}

console.log('\nRenome e mundo: OK.');
