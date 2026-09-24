// ARCANUM · Estações nos encontros, matilhas com teto por nível e inverno
// rigoroso (engine/estacoes.ts).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { rolarEncontroDeViagem, perigoEfetivoDaRota, viajar, rotasVisiveis } from './viagem';
import { pesoNaEstacao, fatorDaEstacao, tetoDeGrupo, processarEstacoes, invernoRigorosoAtivo, PERIGO_INVERNO_RIGOROSO } from './estacoes';
import { exportar, importar } from './persistencia';
import { createRng } from './rng';
import type { Campaign } from './types';
import type { Estacao } from './time';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string): Campaign => {
  const c = criarCampanha(C, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};
const cri = (id: string) => C.criaturas.find(c => c.id === id)!;

// ── 1. Pesos declarados ───────────────────────────────────────────────────
ok(pesoNaEstacao(cri('lobo'), 'inverno') > 1.5 && pesoNaEstacao(cri('urso_pardo'), 'inverno') < 0.2, 'Lobo com fome no inverno, urso hibernando');
ok(pesoNaEstacao(cri('corvo_gigante'), 'outono') > pesoNaEstacao(cri('corvo_gigante'), 'primavera'), 'Corvos migram no outono');
ok(pesoNaEstacao(cri('ghoul'), 'inverno') === 1, 'Quem não declara estação pesa 1');
ok(C.criaturas.filter(c => c.estacoes).length >= 10, `${C.criaturas.filter(c => c.estacoes).length} feras com peso por estação`);
const verao = ['serpente_do_junco', 'enxame_de_morcegos', 'aranha_das_arvores'];
ok(fatorDaEstacao(C, verao, 'inverno') < fatorDaEstacao(C, verao, 'verao'), `Pool de bicho de verão fica mais calmo no inverno (fator ${fatorDaEstacao(C, verao, 'inverno')} contra ${fatorDaEstacao(C, verao, 'verao')})`);

// ── 2. Quem aparece, por estação ─────────────────────────────────────────
function contar(estacao: Estacao, nivel: number, pool: string[], n = 3000) {
  const c = nova(`estacao-${estacao}-${nivel}`);
  c.calendario.estacao = estacao;
  c.personagem.nivel = nivel;
  const vezes: Record<string, number> = {};
  let encontros = 0, maior = 0;
  for (let i = 0; i < n; i++) {
    const e = rolarEncontroDeViagem(c, 'noite', 6, pool, C);
    if (!e) continue;
    encontros++;
    maior = Math.max(maior, e.length);
    vezes[e[0]] = (vezes[e[0]] ?? 0) + 1;
  }
  return { vezes, encontros, maior };
}
{
  const pool = ['lobo', 'urso_pardo', 'serpente_do_junco', 'javali'];
  const inv = contar('inverno', 10, pool), ver = contar('verao', 10, pool);
  ok((inv.vezes.lobo ?? 0) > (ver.vezes.lobo ?? 0) * 1.5, `Mais lobo no inverno (${inv.vezes.lobo}) que no verão (${ver.vezes.lobo})`);
  ok((inv.vezes.urso_pardo ?? 0) < (ver.vezes.urso_pardo ?? 0) / 3, `Quase nenhum urso no inverno (${inv.vezes.urso_pardo ?? 0} contra ${ver.vezes.urso_pardo})`);
  ok((inv.vezes.serpente_do_junco ?? 0) < (ver.vezes.serpente_do_junco ?? 0) / 3, `Serpente some no inverno (${inv.vezes.serpente_do_junco ?? 0} contra ${ver.vezes.serpente_do_junco})`);
  const serpentes = contar('inverno', 10, verao), serpentesV = contar('verao', 10, verao);
  ok(serpentes.encontros < serpentesV.encontros, `Estrada de bicho de verão tem menos encontro no inverno (${serpentes.encontros} contra ${serpentesV.encontros} em 3000)`);
}

// ── 3. Matilha com teto por nível ────────────────────────────────────────
{
  ok(tetoDeGrupo(1) === 1 && tetoDeGrupo(2) === 1 && tetoDeGrupo(3) === 2 && tetoDeGrupo(12) === 4, 'Teto de grupo: 1, 1, 2 ... 4 (o mesmo dos bandos)');
  const pool = ['lobo', 'lobo_branco', 'cao_selvagem', 'javali', 'corvo_gigante'];
  const n1 = contar('inverno', 1, pool, 4000);
  ok(n1.maior === 1, `Nível 1 nunca enfrenta mais de 1 inimigo (${n1.encontros} encontros, maior grupo ${n1.maior})`);
  const n9 = contar('inverno', 9, pool, 4000);
  ok(n9.maior >= 2 && n9.maior <= tetoDeGrupo(9), `Nível 9 encontra matilha (maior grupo ${n9.maior}, teto ${tetoDeGrupo(9)})`);
  // Pelo caminho real: 200 viagens de nível 1.
  const c = nova('viagem-nivel-1');
  c.personagem.nivel = 1;
  let viagens = 0, maior = 0, combates = 0;
  for (let i = 0; i < 400 && viagens < 200; i++) {
    const rotas = rotasVisiveis(C, c);
    if (!rotas.length) break;
    const r = viajar(C, c, rotas[i % rotas.length].destino);
    if (!r.ok) continue;
    viagens++;
    if (r.encontro) { combates++; maior = Math.max(maior, r.encontro.length); }
    c.combate = null;
    c.personagem.recursos.vida = c.personagem.recursosMax.vida;
    c.personagem.nivel = 1;
  }
  ok(viagens >= 150 && maior <= 1, `Em ${viagens} viagens reais de nível 1, ${combates} encontros e nunca mais de 1 inimigo`);
}

// ── 4. Inverno rigoroso ───────────────────────────────────────────────────
{
  const c = nova('inverno-rigoroso');
  c.calendario.estacao = 'inverno';
  let dias = 0;
  while (!invernoRigorosoAtivo(c) && dias < 400) { c.calendario.dia++; dias++; processarEstacoes(C, c); }
  ok(invernoRigorosoAtivo(c), `A nevasca chega no inverno (depois de ${dias} dias)`);
  ok(c.vivo!.fatos.some(f => f.tipo === 'inverno_rigoroso'), 'A nevasca vira fato público');
  const passo = C.locais.find(l => l.tipo === 'passo')!;
  const rota = passo.rotas[0];
  const com = perigoEfetivoDaRota(C, c, passo.id, rota.destino, rota.perigo);
  const planicie = C.locais.find(l => l.tipo === 'estrada' && l.rotas.every(r => !['passo', 'colina'].includes(C.locais.find(x => x.id === r.destino)?.tipo ?? '')))!;
  const outra = perigoEfetivoDaRota(C, c, planicie.id, planicie.rotas[0].destino, planicie.rotas[0].perigo);
  const r = importar(exportar(c));
  ok(r.ok && JSON.stringify(r.valor.mundo!.invernoRigoroso) === JSON.stringify(c.mundo!.invernoRigoroso), 'A nevasca sobrevive ao save');
  const ate = c.mundo!.invernoRigoroso!.ate;
  c.calendario.dia = ate; processarEstacoes(C, c);
  ok(!invernoRigorosoAtivo(c) && c.vivo!.fatos.some(f => f.tipo === 'degelo'), 'No fim, degelo com fato público');
  const depois = perigoEfetivoDaRota(C, c, passo.id, rota.destino, rota.perigo);
  ok(com - depois === PERIGO_INVERNO_RIGOROSO, `Na nevasca a rota do ${passo.nome} fica ${PERIGO_INVERNO_RIGOROSO} mais perigosa (${com.toFixed(1)} contra ${depois.toFixed(1)} depois do degelo)`);
  const outraDepois = perigoEfetivoDaRota(C, c, planicie.id, planicie.rotas[0].destino, planicie.rotas[0].perigo);
  ok(outra === outraDepois, `Estrada de planície não muda com a nevasca (${outra.toFixed(1)})`);
  const v = nova('verao-sem-nevasca');
  v.calendario.estacao = 'verao';
  for (let i = 0; i < 300; i++) { v.calendario.dia++; processarEstacoes(C, v); }
  ok(!v.mundo!.invernoRigoroso, 'Fora do inverno não neva nos passos');
}

// ── 5. Sem mexer no RNG principal ────────────────────────────────────────
{
  const c = nova('inverno-rng');
  c.calendario.estacao = 'inverno';
  const antes = JSON.stringify(c.rng);
  for (let i = 0; i < 100; i++) { c.calendario.dia++; processarEstacoes(C, c); }
  ok(JSON.stringify(c.rng) === antes, 'O inverno rigoroso não consome o RNG da campanha');
  void createRng;
}

console.log('\nEstações: OK.');
