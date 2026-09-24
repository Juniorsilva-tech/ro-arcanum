// ARCANUM · Jornada da colônia, do começo ao fim (sessão 58).
//
// As etapas A a F têm cada uma o seu teste. Este prova que elas estão ligadas
// no jogo de verdade: funda em cada um dos seis sítios e deixa o relógio do
// MUNDO andar (avancarMundo → processarDiaColonia → gente, rebanho, ameaça,
// renome, audiência), com um jogador simples que responde o que aparece. Todo
// dia confere invariantes; no fim, confere que cada sistema aconteceu.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { avancarMundo } from './mundo';
import { avancarPeriodos, PERIODOS } from './time';
import { fundarColonia } from './colonia';
import { aceitarChegada, designarFuncao, melhorOficio } from './colonos';
import { resolverAudiencia } from './audiencias';
import { decidirAssembleia } from './ameacas';
import { comprarAnimais } from './rebanhos';
import { exportar, importar } from './persistencia';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
// Um ano inteiro: o jogo começa no outono, e a primavera (crias) só chega
// perto do dia 225.
const DIAS = 400;
const SITIOS = ['campo_ceifa', 'colina_forcados', 'clareira_pedras', 'farol_quebrado', 'ruina_areia', 'vau_pedra'];

const conta = { audiencias: 0, enviados: 0, ameacas: 0, batalhas: 0, chegadas: 0, crias: 0, nivel: 0 };

function conferir(c: Campaign, sitio: string, dia: number) {
  const f = c.feudo!;
  const onde = `${sitio} dia ${dia}`;
  for (const k of ['comida', 'materiais', 'tesouro', 'populacao', 'seguranca', 'estabilidade'] as const) {
    const v = f[k];
    if (typeof v !== 'number' || Number.isNaN(v)) throw new Error(`${onde}: ${k} não é número (${v})`);
    if (v < 0) throw new Error(`${onde}: ${k} negativo (${v})`);
  }
  if ((f.colonos?.length ?? 0) > f.populacao) throw new Error(`${onde}: ${f.colonos!.length} com nome e só ${f.populacao} de população`);
  for (const x of f.colonos ?? []) if (x.humor < 0 || x.humor > 100 || Number.isNaN(x.humor)) throw new Error(`${onde}: humor fora de 0-100 (${x.nome}: ${x.humor})`);
  for (const [e, n] of Object.entries(f.rebanhos ?? {})) if (!Number.isInteger(n) || n < 0) throw new Error(`${onde}: rebanho ${e} = ${n}`);
  if (f.tierReino < 1 || f.tierReino > 10) throw new Error(`${onde}: nível ${f.tierReino}`);
}

for (const sitio of SITIOS) {
  const c = criarCampanha(C, { nome: 'Fundadora', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: `jornada-${sitio}`, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  c.localAtual = sitio;
  const r = fundarColonia(C, c, '');
  if (!r.ok) throw new Error(`fundar em ${sitio}: ${r.mensagem}`);
  const f = c.feudo!;
  f.tesouro += 200; // o jogador trouxe algum dinheiro
  for (const x of f.colonos ?? []) designarFuncao(c, x.id, melhorOficio(x));
  const animal = Object.keys(C.sitiosColonia!.find(s => s.id === sitio)!.animais)[0] as never;
  comprarAnimais(C, c, animal, 4);
  let tierInicial = f.tierReino, ultimaBatalha = f.ultimaBatalha?.dia;

  for (let d = 0; d < DIAS; d++) {
    // O relógio do jogo (vira a estação), não um dia somado à mão.
    c.calendario = avancarPeriodos(c.calendario, PERIODOS.length);
    avancarMundo(C, c);
    // O jogador responde o que aparece.
    for (const ch of [...(f.chegadas ?? [])]) if (aceitarChegada(C, c, ch.id).ok) conta.chegadas++;
    for (const x of f.colonos ?? []) if (!x.funcao) designarFuncao(c, x.id, melhorOficio(x));
    if (f.audiencia) {
      if (f.audiencia.tipo === 'enviado') conta.enviados++;
      // Um jogador razoável: no furto põe vigia ou perdoa antes de expulsar;
      // no resto, a primeira resposta que o bolso permite.
      const preferidas = f.audiencia.tipo === 'furto' ? ['vigia', 'perdoar', 'expulsar'] : f.audiencia.opcoes.map(o => o.id);
      const escolha = preferidas.find(id => resolverAudiencia(c, id, C).ok);
      if (escolha) conta.audiencias++;
    }
    if (f.ameaca && Object.keys(f.ameaca.preparacoes).length === 0) {
      conta.ameacas++;
      decidirAssembleia(c, 'paliçada, vigias e armem a milícia');
    }
    if (f.ultimaBatalha && f.ultimaBatalha.dia !== ultimaBatalha) { conta.batalhas++; ultimaBatalha = f.ultimaBatalha.dia; }
    if (f.ultimoRelatorio?.rebanho?.nasceram.length) conta.crias++;
    conferir(c, sitio, d);
  }
  if (f.tierReino > tierInicial) conta.nivel++;
  const volta = importar(exportar(c));
  if (!volta.ok || JSON.stringify(volta.valor.feudo) !== JSON.stringify(f)) throw new Error(`${sitio}: a colônia não volta igual do save`);
  console.log(`  ${sitio.padEnd(16)} pop ${String(f.populacao).padStart(3)} · com nome ${String(f.colonos?.length ?? 0).padStart(2)} · renome ${Math.floor(f.renome ?? 0)} · nível ${f.tierReino} · animais ${Object.values(f.rebanhos ?? {}).reduce((a, b) => a + b, 0)} · batalha: ${f.ultimaBatalha?.desfecho ?? '—'}`);
}

ok(true, `seis colônias, ${DIAS} dias cada, pelo relógio do mundo, sem nenhuma invariante quebrada`);
ok(conta.chegadas > 0, `gente chegou à porta e entrou (${conta.chegadas} vezes)`);
ok(conta.audiencias > 0, `audiências apareceram e foram respondidas (${conta.audiencias})`);
ok(conta.enviados > 0, `casas mandaram enviados (${conta.enviados})`);
ok(conta.ameacas > 0 && conta.batalhas > 0, `ameaças vieram (${conta.ameacas}) e foram resolvidas em batalha (${conta.batalhas})`);
ok(conta.crias > 0, `o rebanho teve crias (${conta.crias} dias com nascimento)`);
ok(true, `colônias que subiram de nível: ${conta.nivel} de 6`);
ok(true, 'todas voltam iguais do save');

console.log('\nJornada da colônia: OK.');
