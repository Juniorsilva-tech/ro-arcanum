import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { encontrosElegiveis, solDireto } from './kimetsu';
import { rolarEncontroDeViagem, rolarEncontroContextual, presencaOniCasual } from './viagem';
import { PERIODOS } from './time';
import { registrarFato } from './historiaViva';
import { oferecerMissao, processarMissoesVivas, encerrarMissao } from './missoesVivas';
import { normalizarCampanha } from './migracao';
import type { MissaoViva } from './vivoTypes';
import { executarAcaoMundo } from './acoesMundo';
import { viajar } from './viagem';
import { ondeForjar, forjar } from './forja';
import { comprar, precoCompra, itemPorId } from './items';
import { descontoDeCompra } from './classe';
import { multiplicadorDePreco } from './mundo';

const assert = Object.assign((v: unknown) => { if (!v) throw new Error('Invariante da jornada falhou'); }, {
  equal: (a: unknown, b: unknown) => { if (a !== b) throw new Error(`Esperado ${b}; obtido ${a}`); },
  deepEqual: (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('Save de missões divergiu'); },
});

const nova = (seed: string) => criarCampanha(C, { nome: 'Viajante', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
const contagens: number[] = [];
for (const modo of ['paz', 'crise', 'investigacao']) {
  let onis = 0;
  for (let seed = 0; seed < 8; seed++) {
    const c = nova(`presenca-${seed}`); c.localAtual = 'estrada'; c.calendario.periodoIndex = 5;
    if (modo === 'crise') c.continuidade!.ameacas.push({ id: 'fixture', rivalId: 'fixture', criaturaId: 'oni_faminto', local: 'estrada', inicio: 0, prazo: 99999, estado: 'ativa', descoberta: true });
    if (modo === 'investigacao') {
      const f = registrarFato(c, { tipo: 'fixture', local: 'estrada', texto: 'Rastros', atores: [], publico: true });
      oferecerMissao(c, 'investigar', f)!.estado = 'aceita';
    }
    for (let i = 0; i < 1000; i++) {
      c.calendario.dia = i;
      const r = rolarEncontroContextual(C, c, 'noite', 5, C.encontrosPorTipo!.estrada);
      if (r?.some(id => C.criaturas.find(m => m.id === id)?.oni)) onis++;
    }
  }
  contagens.push(onis); console.log(`Presença ${modo}: ${onis}/8000 sorteios com oni`);
}
assert(contagens[0] < contagens[1] && contagens[1] < contagens[2]);
{
  const c = nova('respiro'); c.localAtual = 'estrada'; c.calendario.periodoIndex = 5;
  c.flags['narrativa.ultimoOniCasual'] = c.calendario.dia;
  assert.equal(presencaOniCasual(c), 0);
  assert.equal(rolarEncontroContextual(C, c, 'noite', 5, ['oni_faminto']), null);
  c.calendario.dia += 3; assert.equal(presencaOniCasual(c), .08);
  c.calendario.periodoIndex = 1;
  for (let i = 0; i < 100; i++) assert.equal(rolarEncontroContextual(C, c, 'manha', 5, ['oni_faminto']), null);
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  assert.equal(salvo.flags['narrativa.ultimoOniCasual'], c.flags['narrativa.ultimoOniCasual']);
}
let amostras = 0, combates = 0, onis = 0, casos = 0;
for (const local of C.locais) for (let periodo = 0; periodo < PERIODOS.length; periodo++) {
  const c = nova(`${local.id}-${periodo}`);
  c.localAtual = local.id; c.calendario.periodoIndex = periodo;
  const pool = encontrosElegiveis(C, c, C.encontrosPorTipo?.[local.tipo] ?? []);
  assert(pool.every(id => C.criaturas.some(m => m.id === id)));
  if (solDireto(C, c)) assert(pool.every(id => { const m = C.criaturas.find(m => m.id === id)!; return !m.oni || m.imuneLuz; }));
  let n = 0, o = 0;
  for (let i = 0; i < 400; i++) {
    const encontro = rolarEncontroDeViagem(c, PERIODOS[periodo], local.perigo, pool);
    if (encontro) {
      n++;
      assert(encontro.every(id => pool.includes(id)));
      if (encontro.some(id => C.criaturas.find(m => m.id === id)?.oni)) o++;
    }
  }
  amostras += 400; combates += n; onis += o;
  if (local.id === 'estrada') console.log(`Estrada ${PERIODOS[periodo]}: ${o}/400 sorteios com oni; ${n} encontros totais`);
  casos++;
}
console.log(`Encontros: ${casos} locais/horários, ${amostras} sorteios, ${combates} encontros, ${onis} com oni. Fixture sem viagem/Nemesis.`);

const tipos: MissaoViva['tipo'][] = ['abastecer', 'tratar', 'escoltar', 'reconstruir', 'resgatar', 'investigar'];
for (const tipo of ['abastecer', 'tratar', 'reconstruir', 'resgatar'] as const) {
  const c = nova(`acao-${tipo}`), local = Object.keys(c.vivo!.cidades)[0];
  c.localAtual = local; c.familia!.prologoConcluido = true; c.calendario.periodoIndex = 1;
  c.personagem.condicoes = []; c.personagem.dinheiro = 100;
  const cidade = c.vivo!.cidades[local];
  cidade.comida = 0; cidade.fomeDias = 4; cidade.doenca = 70;
  c.continuidade!.locais[local].integridade = 30;
  const ator = Object.keys(c.vivo!.pessoas).find(id => c.npcState[id]?.vivo)!;
  c.vivo!.pessoas[ator].objetivo = 'cativo';
  const fato = registrarFato(c, { tipo: 'fixture', local, texto: 'Necessidade real', atores: [], publico: true });
  const q = oferecerMissao(c, tipo, fato, tipo === 'resgatar' ? { ator } : {}, C)!;
  assert(executarAcaoMundo(C, c, { tipo: 'missao', id: q.id, escolha: 'aceitar' }).ok);
  assert(executarAcaoMundo(C, c, { tipo: 'missao', id: q.id, escolha: 'ajudar' }).ok);
  assert.equal(q.estado, 'concluida');
  assert.equal(c.personagem.dinheiro, 100 - 30 + q.recompensa);
  if (tipo === 'abastecer') assert(cidade.comida > 0 && cidade.fomeDias === 0);
  if (tipo === 'tratar') assert(cidade.doenca < 70);
  if (tipo === 'reconstruir') assert(c.continuidade!.locais[local].integridade > 30);
  if (tipo === 'resgatar') assert.equal(c.vivo!.pessoas[ator].objetivo, 'trabalhar');
  console.log(`Ação real ${tipo}: aceitação, ajuda, débito e consequência OK`);
}
for (const tipo of tipos) for (const aceita of [false, true]) {
  const c = nova(`${tipo}-${aceita}`), local = Object.keys(c.vivo!.cidades)[0];
  c.localAtual = local; c.vivo!.missoes = [];
  const cidade = c.vivo!.cidades[local];
  cidade.fomeDias = 4; cidade.comida = 0; cidade.doenca = 70;
  c.continuidade!.locais[local].integridade = 30;
  const fato = registrarFato(c, { tipo: 'fixture', local, texto: 'Crise controlada', atores: [], publico: true });
  const q = oferecerMissao(c, tipo, fato, {}, C)!;
  assert(q && q.prazo > c.calendario.dia);
  assert(!oferecerMissao(c, tipo, fato, {}, C));
  if (aceita) { q.estado = 'aceita'; q.aceitaEm = c.calendario.dia; }
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  assert.deepEqual(salvo.vivo!.missoes, c.vivo!.missoes);
  const dinheiro = c.personagem.dinheiro;
  c.calendario.dia = q.prazo + 1;
  processarMissoesVivas(C, c);
  assert.equal(q.estado, 'falhada');
  assert.equal(c.personagem.dinheiro, dinheiro);
  assert.equal(c.vivo!.contadores[aceita ? 'compromissosFalhados' : 'oportunidadesExpiradas'], 1);
  encerrarMissao(c, q, 'concluida', 'Não pode pagar missão encerrada');
  assert.equal(c.personagem.dinheiro, dinheiro);
  const outra = oferecerMissao(c, tipo, fato, {}, C)!;
  outra.estado = 'aceita';
  encerrarMissao(c, outra, 'concluida', 'Fixture do contrato de recompensa');
  encerrarMissao(c, outra, 'concluida', 'Repetição');
  assert.equal(c.personagem.dinheiro, dinheiro + outra.recompensa);
  console.log(`Missão ${tipo}, aceita=${aceita}: prazo, duplicata, save, expiração, contador, recompensa única OK`);
}

// Jornada da primeira forja (sessão 52, Fase 6): da taverna onde o jogo
// começa, sem saber de lugar escondido, até a primeira peça. A Feira Coberta
// é vizinha, tem ferraria e vende carvão e minério; o dinheiro inicial (12)
// não paga tudo, então a jornada trabalha na comunidade antes de comprar.
{
  const c = nova('primeira-forja');
  if (c.familia) c.familia.prologoConcluido = true;
  assert.equal(c.localAtual, C.localInicial);
  const ida = viajar(C, c, 'mercado');
  assert(ida.ok);
  c.combate = null;
  assert(ondeForjar(C, c).pode);
  const preco = (id: string) => precoCompra(itemPorId(C, id)!, descontoDeCompra(c, false), multiplicadorDePreco(c));
  const custo = preco('carvao') + 2 * preco('minerio_de_ferro');
  let turnos = 0;
  while (c.personagem.dinheiro < custo && turnos < 6) {
    assert(executarAcaoMundo(C, c, { tipo: 'trabalhar' }).ok);
    turnos++;
  }
  assert(c.personagem.dinheiro >= custo && turnos <= 3);
  assert(comprar(C, c, 'carvao').ok);
  assert(comprar(C, c, 'minerio_de_ferro').ok);
  assert(comprar(C, c, 'minerio_de_ferro').ok);
  const r = forjar(C, c, 'lamina_curta', 'minerio_de_ferro');
  assert(r.ok && !!r.item && (c.personagem.inventario[r.item.id] ?? 0) === 1);
  console.log(`Primeira forja: taverna → Feira Coberta, ${turnos} ${turnos === 1 ? 'turno' : 'turnos'} de trabalho, ${custo} moedas de material, ${r.item!.nome} (dia ${c.calendario.dia})`);
}
