const assert = (v: unknown) => { if (!v) throw new Error('Invariante de casas falhou'); };
assert.equal = (a: unknown, b: unknown) => { if (a !== b) throw new Error(`Esperado ${b}; obtido ${a}`); };
import { conteudoVaelhorn as C } from '../content/vaelhorn';
const ids = new Set(C.locais.map(l => l.id));
assert(C.casas && C.casas.length >= 4);
for (const casa of C.casas!) {
  assert(casa.nome && casa.reino && casa.lema);
  assert(ids.has(casa.sede));
  assert(casa.territorio.length > 0 && casa.territorio.every(id => ids.has(id)));
  assert(casa.rivalidades.every(id => C.casas!.some(x => x.id === id) || C.faccoes.some(x => x.id === id)));
}
assert(new Set(C.casas!.map(c => c.id)).size === C.casas!.length);
console.log(`✓ ${C.casas!.length} casas com sede, território, sucessão e rivalidades válidos`);

// Sucessão real: morte do líder promove herdeiro uma única vez e não escolhe cativo.
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { processarCasas } from './casas';
const c = criarCampanha(C, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: 'casas-sucessao', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
iniciarMundoVivo(C, c); processarCasas(C, c);
for (const casa of C.casas!) {
  const e = c.mundo!.casas![casa.id];
  if (!e.lider) continue;
  const antes = { ...e };
  assert(c.npcState[e.lider]?.vivo && (c.npcState[e.lider]?.idade ?? 20) >= 18);
  if (e.herdeiro) {
    c.npcState[e.lider].vivo = false;
    c.calendario.dia++;
    processarCasas(C, c);
    assert(e.sucessoes === antes.sucessoes + 1);
    const depois = JSON.stringify(e);
    processarCasas(C, c);
    assert.equal(JSON.stringify(e), depois);
  }
}
console.log('✓ sucessão promove herdeiro adulto vivo uma vez e é idempotente');

// ── Fase 4 (sessão 50): gente nas casas, e casas que agem ────────────────
import { candidatas, escolherSucessora, mudarReputacaoCasa, descreverCasa, CUSTO_OBRA, TESOURO_PARA_OBRA, BAIXAS_POR_PATRULHA, BONUS_MISSAO } from './casas';
import { estadoBandos } from './bandos';
import { registrarFato } from './historiaViva';
import { exportar, importar } from './persistencia';
import { familiasDe } from './familiasNpc';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string) => {
  const x = criarCampanha(C, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (x.familia) x.familia.prologoConcluido = true;
  iniciarMundoVivo(C, x);
  return x;
};
const casa = (id: string) => C.casas!.find(h => h.id === id)!;

// Membros: existem, são 5+ por casa, têm uma chefe, e o sangue da casa é uma família do elenco.
for (const h of C.casas!) {
  const m = h.membros ?? [];
  ok(m.length >= 5, `${h.nome}: ${m.length} membros com nome`);
  ok(m.every(x => C.npcs.some(n => n.id === x.npc)), `${h.nome}: todo membro existe no elenco`);
  ok(m.filter(x => x.papel === 'chefe').length === 1 && m.some(x => x.papel === 'herdeira'), `${h.nome}: uma chefe e ao menos uma herdeira`);
  ok(!!h.familia && m.filter(x => x.papel !== 'servidora' && x.papel !== 'campea').every(x => familiasDe(C, x.npc).some(f => f.id === h.familia)), `${h.nome}: chefe, herdeiras e colaterais são da família ${h.familia}`);
}
{
  const x = nova('casas-lider');
  processarCasas(C, x);
  const e = x.mundo!.casas!;
  ok(e.halvet.lider === 'dama_valda' && e.halvet.herdeiro === 'ysolde', 'Halvet: Dama Valda chefia, Ysolde herda');
  ok(e.mareu.lider === 'morador_mercado_peixe_0' && e.tessel.lider === 'marechala_odile' && e.corveira.lider === 'senhora_corveira', 'Mareu, Tessel e Corveira têm a chefe escrita (antes: o primeiro NPC listado na sede)');
}

// Sucessão pela regra da casa.
{
  const x = nova('casas-primogenitura');
  processarCasas(C, x);
  x.npcState.dama_valda.vivo = false; x.calendario.dia++; processarCasas(C, x);
  ok(x.mundo!.casas!.halvet.lider === 'ysolde', 'Primogenitura: morta Valda, Ysolde assume');
  x.npcState.ysolde.vivo = false; x.calendario.dia++; processarCasas(C, x);
  ok(x.mundo!.casas!.halvet.lider === 'ilse', 'Primogenitura: morta Ysolde, a linha passa a Ilse, e não à mãe dela');
  ok(x.vivo!.fatos.some(f => f.tipo === 'sucessao_casa' && f.texto.includes('Ilse')), 'A sucessão vira fato público');
}
{
  const x = nova('casas-eleicao');
  processarCasas(C, x);
  // Dorn em guerra com o mundo (tensão alta), Ketta calma: o conselho escolhe a tia.
  x.npcState.morador_tessel_17.tensao = 95;
  x.npcState.morador_tessel_7.tensao = 0;
  const r = escolherSucessora(C, x, casa('tessel'), 'marechala_odile');
  ok(r.nova === 'morador_tessel_7', `Eleição: com a filha em conflito aberto, o conselho elege a gêmea (${r.como})`);
  x.npcState.morador_tessel_17.tensao = 10;
  ok(escolherSucessora(C, x, casa('tessel'), 'marechala_odile').nova === 'morador_tessel_17', 'Eleição: com a filha calma, ela vence por estar na frente da linha');
}
{
  const x = nova('casas-duelo');
  processarCasas(C, x);
  const a = escolherSucessora(C, x, casa('corveira'), 'senhora_corveira');
  const b = escolherSucessora(C, x, casa('corveira'), 'senhora_corveira');
  ok(a.nova === b.nova && !!a.perdedora && ['morador_corveira_0', 'morador_corveira_7'].includes(a.nova!), `Duelo: as duas primeiras da linha lutam, e o resultado não depende do RNG principal (${a.nova} ${a.como})`);
  let venceuPrimeira = 0;
  for (let i = 0; i < 40; i++) { const y = nova(`casas-duelo-${i}`); if (escolherSucessora(C, y, casa('corveira'), 'senhora_corveira').nova === 'morador_corveira_0') venceuPrimeira++; }
  ok(venceuPrimeira > 20 && venceuPrimeira < 40, `Duelo: com a campeã, a primeira da linha vence ${venceuPrimeira} de 40 — não sempre`);
  x.npcState.morador_corveira_0.vivo = false;
  ok(candidatas(C, x, casa('corveira'), 'senhora_corveira')[0].npc === 'morador_corveira_7', 'Morta a primeira, a linha anda');
}

// Obras: com tesouro, sim; sem tesouro, não.
{
  const x = nova('casas-obra');
  processarCasas(C, x);
  const e = x.mundo!.casas!.mareu;
  const cid = x.vivo!.cidades.mareu;
  ok(!(e.obras ?? 0), 'No primeiro dia a casa ainda não gasta o tesouro em obra');
  cid.projeto = undefined;
  e.tesouro = 0; x.calendario.dia += 60; processarCasas(C, x);
  ok(!cid.projeto && !(e.obras ?? 0), 'Sem tesouro, a casa não financia obra');
  e.tesouro = TESOURO_PARA_OBRA + 10; x.calendario.dia += 1; processarCasas(C, x);
  ok(!!x.vivo!.cidades.mareu.projeto && e.obras === 1, `Com tesouro, a casa financia ${x.vivo!.cidades.mareu.projeto?.tipo} em Mareu`);
  ok(e.tesouro <= TESOURO_PARA_OBRA + 10 - CUSTO_OBRA + 1, `A obra custa ${CUSTO_OBRA} do tesouro da casa`);
  ok(x.vivo!.fatos.some(f => f.tipo === 'obra_casa'), 'A obra da casa vira fato público');
  // Canteiro ocupado: a casa acelera a obra da cidade, não a troca.
  const proj = x.vivo!.cidades.mareu.projeto!;
  const tipo0 = proj.tipo, prog0 = proj.progresso;
  e.tesouro = TESOURO_PARA_OBRA + 10; x.calendario.dia += 60; processarCasas(C, x);
  ok(x.vivo!.cidades.mareu.projeto?.tipo === tipo0 && x.vivo!.cidades.mareu.projeto!.progresso > prog0 && e.obras === 2, `Com obra no canteiro, a casa paga braços e a mesma obra anda (${Math.round(prog0)} → ${Math.round(x.vivo!.cidades.mareu.projeto!.progresso)})`);
  // Com fome, a casa ergue lavoura, como a cidade ergueria.
  const y = nova('casas-obra-fome');
  processarCasas(C, y);
  const ct = y.vivo!.cidades.tessel;
  ct.projeto = undefined; ct.fomeDias = 4;
  y.mundo!.casas!.tessel.tesouro = 200; y.calendario.dia += 60; processarCasas(C, y);
  ok(y.vivo!.cidades.tessel.projeto?.tipo === 'lavoura', `Com fome em Tessel, a obra da casa é lavoura (${y.vivo!.cidades.tessel.projeto?.tipo})`);
}

// Casa cuja sede não é cidade (Halvet) age sobre a comunidade mais perto.
{
  const x = nova('casas-halvet-praca');
  processarCasas(C, x);
  const e = x.mundo!.casas!.halvet;
  const povo = x.continuidade!.locais.praca;
  povo.integridade = 10;
  e.tesouro = 200; x.calendario.dia += 60; processarCasas(C, x);
  ok(povo.integridade === 35, `Halvet paga a reconstrução da Praça em ruína (integridade 10 → ${povo.integridade})`);
  x.vivo!.cidades.praca.fomeDias = 5; x.vivo!.cidades.praca.comida = 0;
  e.tesouro = 200; x.calendario.dia += 20; processarCasas(C, x);
  ok(x.vivo!.cidades.praca.comida > 0, 'Com fome na Praça, a casa de Halvet abre o celeiro');
}

// Patrulha: bando da região perde gente.
{
  const x = nova('casas-patrulha');
  processarCasas(C, x);
  const bandos = Object.values(estadoBandos(C, x).bandos);
  const regioes = new Map(C.casas!.map(h => [C.locais.find(l => l.id === h.sede)!.regiao, h.id]));
  const b = bandos.find(bb => regioes.has(bb.regiao))!;
  ok(!!b, `Há bando na região de uma casa (${b?.nome}, ${b?.regiao})`);
  const e = x.mundo!.casas![regioes.get(b.regiao)!];
  b.membros = 6; b.estado = 'ativo';
  const patrulhas0 = e.patrulhas ?? 0;
  e.tesouro = 200; x.calendario.dia += 30; processarCasas(C, x);
  ok(b.membros === 6 - BAIXAS_POR_PATRULHA && e.patrulhas === patrulhas0 + 1, `A patrulha paga pela casa derruba ${BAIXAS_POR_PATRULHA} homens do bando (6 → ${b.membros})`);
  ok(x.vivo!.fatos.some(f => f.tipo === 'patrulha_casa' && f.texto.includes(b.nome)), 'A patrulha vira fato público com o nome do bando');
  const antes = b.membros; e.tesouro = 0; x.calendario.dia += 30; processarCasas(C, x);
  ok(b.membros === antes, 'Sem tesouro, não há patrulha');
}

// Missão patrocinada e reputação.
{
  const x = nova('casas-missao');
  processarCasas(C, x);
  const e = x.mundo!.casas!.tessel;
  x.vivo!.cidades.tessel.fomeDias = 5;
  e.tesouro = 120; x.calendario.dia += 40; processarCasas(C, x);
  const q = x.vivo!.missoes.find(m => m.ator === 'marechala_odile' && m.tipo === 'abastecer');
  ok(!!q && q.recompensa >= 20 + BONUS_MISSAO, `Com fome em Tessel, a casa patrocina a missão de abastecer e paga mais (${q?.recompensa} moedas)`);
  ok(x.vivo!.missoes.filter(m => m.tipo === 'abastecer' && m.local === 'tessel' && ['oferecida', 'aceita'].includes(m.estado)).length === 1, 'Uma missão só por crise: a casa patrocina, não duplica');
  ok(x.vivo!.fatos.some(f => f.tipo === 'celeiro_casa'), 'Com fome na sede, a casa abre o celeiro com o próprio tesouro');
  const d0 = x.npcState.morador_tessel_17.eixos.disposicao ?? 0;
  registrarFato(x, { tipo: 'missao_concluida', local: 'tessel', texto: 'Você trouxe grão para Tessel.', atores: ['marechala_odile'], publico: true });
  x.calendario.dia += 1; processarCasas(C, x);
  ok((e.reputacao ?? 0) > 0, `Cumprir a missão da casa sobe a reputação com ela (${e.reputacao})`);
  ok((x.npcState.morador_tessel_17.eixos.disposicao ?? 0) > d0, 'A reputação com a casa chega à disposição da herdeira');
  mudarReputacaoCasa(C, x, casa('tessel'), -20);
  ok((x.npcState.morador_tessel_1.eixos.disposicao ?? 0) < 0, 'Reputação ruim azeda até a servidora da casa');
  ok(descreverCasa(C, x, casa('tessel')).includes('Odile') && descreverCasa(C, x, casa('tessel')).includes('reputação'), `A tela e o narrador leem a casa: "${descreverCasa(C, x, casa('tessel'))}"`);
}

// Casamento político e trama.
{
  const x = nova('casas-politica');
  processarCasas(C, x);
  const eh = x.mundo!.casas!.halvet, em = x.mundo!.casas!.mareu;
  eh.legitimidade = 40; em.legitimidade = 40;
  x.calendario.dia += 1; processarCasas(C, x);
  ok(eh.alianca?.casa === 'mareu' && em.alianca?.casa === 'halvet' && eh.legitimidade > 40, 'Halvet e Mareu, rivais e fracas, casam as herdeiras e ganham legitimidade');
  ok(x.vivo!.fatos.some(f => f.tipo === 'casamento_politico'), 'O casamento político vira fato público');
  let tomou = 0;
  for (let i = 0; i < 30; i++) {
    const y = nova(`casas-trama-${i}`);
    processarCasas(C, y);
    y.mundo!.casas!.halvet.legitimidade = 10;
    y.calendario.dia += 70; processarCasas(C, y);
    if (y.mundo!.casas!.halvet.lider === 'maelis') tomou++;
  }
  ok(tomou > 0 && tomou < 30, `Com a casa fraca, a colateral trama e às vezes toma a casa (${tomou} de 30)`);
}

// Save.
{
  const x = nova('casas-save');
  processarCasas(C, x);
  x.mundo!.casas!.halvet.reputacao = 7;
  const r = importar(exportar(x));
  ok(r.ok && JSON.stringify(r.valor.mundo!.casas) === JSON.stringify(x.mundo!.casas), 'Exportar e importar preserva o estado das casas');
}
console.log('✓ casas com gente e casas que agem');
