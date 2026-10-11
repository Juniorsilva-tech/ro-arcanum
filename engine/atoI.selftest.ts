// ARCANUM · Ato I da trama: a semana dos dezoito (engine/atoI.ts).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { avancarMundo } from './mundo';
import { acoesAtoI, executarAcaoAtoI, objetivoAtoI, contextoAtoI, processarDiaAtoI, ondeEstaOMenino, avisosAtoI, marcarAvisoAtoI, type AcaoAtoI } from './atoI';
import { exportar, importar } from './persistencia';
import { normalizarCampanha } from './migracao';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const A = C.atoI!;
const nova = (seed: string): Campaign => {
  const c = criarCampanha(C, { nome: 'T', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};
/** Avança o mundo até o dia `d`, com o jogador onde estiver. */
const ate = (c: Campaign, d: number) => { c.calendario = { ...c.calendario, dia: d }; avancarMundo(C, c); };
const aberta = (seed: string): Campaign => { const c = nova(seed); ate(c, 1); return c; };
const fazer = (c: Campaign, id: AcaoAtoI['id']) => {
  const r = executarAcaoAtoI(C, c, id);
  if (!r.ok) throw new Error(`${id}: ${r.mensagem}`);
  return r;
};
const ondeEsta = (c: Campaign) => ondeEstaOMenino(C, c);
const buscar = (c: Campaign) => { c.localAtual = A.menino.casa; fazer(c, 'levar'); };
const noite = (c: Campaign) => ate(c, c.trama!.atoI!.noite + 1);

// ── 1. Abertura ───────────────────────────────────────────────────────────
{
  const c = nova('abre');
  ok(!c.trama, 'Antes do primeiro amanhecer não há ato');
  const p = nova('prologo'); p.familia!.prologoConcluido = false; ate(p, 1);
  ok(!p.trama, 'Durante a infância, não abre');
  const fora = nova('fora'); fora.localAtual = 'porto_sal'; ate(fora, 3);
  ok(!fora.trama, 'Fora do vale, não abre');
  fora.localAtual = 'taverna'; ate(fora, 4);
  ok(fora.trama?.atoI?.aberto === 4 && fora.trama.atoI.noite === 4 + A.diasAteANoite, 'Abre no primeiro dia em que ele amanhece no vale, com a noite marcada');
  ate(c, 1);
  const e = c.trama!.atoI!;
  ok(c.trama!.ato === 1 && e.noite === 1 + A.diasAteANoite && !e.desfecho, `Dia 1 no vale: a mãe procura o jogador; a noite é no dia ${e.noite}`);
  ok(c.cronica.some(x => x.texto === A.textos.abertura), 'A abertura vai para a crônica');
  ok(objetivoAtoI(C, c)!.includes(`faltam ${A.diasAteANoite} dias`), `Objetivo: "${objetivoAtoI(C, c)}"`);
  ok(!contextoAtoI(C, c)!.situacao!.match(/contrato|pacto|assin/i) && !JSON.stringify(A.textos).match(/contrato|pacto|assinaram/i), 'Nada do ato fala do contrato (regra da bíblia)');
  ok(avisosAtoI(C, c).map(x => x.id).join() === 'abertura', 'O pedido da mãe espera ser lido no cartão');
  marcarAvisoAtoI(c, 'abertura'); marcarAvisoAtoI(c, 'abertura');
  ok(avisosAtoI(C, c).length === 0 && c.trama!.atoI!.lidos!.length === 1, 'Lido uma vez, some');
  ate(c, 2);
  ok(c.trama!.atoI!.aberto === 1, 'Não abre duas vezes');
  ok(!C.npcs.some(n => n.nome === A.menino.nome), 'O menino não está no elenco: tem dezessete anos (GDD §25)');
  c.localAtual = 'lago';
  ok(!contextoAtoI(C, c)!.meninoAqui, 'Longe dele, o narrador não recebe o retrato');
  c.localAtual = A.menino.casa;
  ok(contextoAtoI(C, c)!.meninoAqui === A.menino.retrato, 'Na casa dele, recebe');
}

// ── 2. Ações dependem do lugar ────────────────────────────────────────────
{
  const c = aberta('acoes');
  c.localAtual = 'lago';
  ok(ondeEsta(c) !== 'lago' && acoesAtoI(C, c).length === 0, 'Longe do menino, nada a fazer');
  ok(!executarAcaoAtoI(C, c, 'levar').ok, 'Não se leva quem não está aqui');
  buscar(c);
  ok(c.trama!.atoI!.comJogador && ondeEsta(c) === c.localAtual && !(c.grupo ?? []).length, 'Levar: ele anda com você (fora do grupo de combate)');
  c.localAtual = 'taverna';
  ok(ondeEsta(c) === 'taverna', 'Para onde você vai, ele vai');
  const ids = () => acoesAtoI(C, c).map(a => a.id);
  ok(!ids().includes('ordem') && !ids().includes('toca') && ids().includes('devolver'), 'Na taverna: só devolver');
  c.localAtual = A.capela;
  ok(ids().includes('ordem'), 'Na capela: entregar à Ordem');
  c.localAtual = A.aldeia;
  ok(ids().includes('toca') && !ids().includes('devolver'), 'Em Juncal de Baixo: a Toca; devolver não, a mãe está longe');
  c.localAtual = 'taverna';
  fazer(c, 'devolver');
  ok(!c.trama!.atoI!.comJogador && ondeEsta(c) === A.menino.casa, 'Devolver: ele volta para casa');
}

// ── 3. Os cinco desfechos ─────────────────────────────────────────────────
{
  // Toca
  const t = aberta('toca');
  buscar(t);
  t.localAtual = A.aldeia;
  ok(!t.flags['descoberto.toca_juncal'], 'Antes, a Toca é segredo');
  fazer(t, 'toca');
  ok(t.flags['descoberto.toca_juncal'] && t.segredosRevelados.includes(A.guia), 'Chegar ao Juncal com um menino do vale: Orla abre a Toca (o segredo dela)');
  ok(ondeEsta(t) === A.toca && acoesAtoI(C, t).length === 0, 'Ele fica na Toca, e não há mais o que decidir');
  const confT = t.npcState[A.mae].eixos.confianca ?? 0;
  t.localAtual = 'taverna';
  noite(t);
  ok(t.trama!.atoI!.desfecho === 'toca' && ondeEsta(t) === A.toca, 'Toca: passou da noite e continua embaixo do charco');
  ok((t.npcState[A.mae].eixos.confianca ?? 0) > confT && t.flags['trama.menino_na_toca'] && t.trama!.ato === 2, 'A mãe confia mais, e o ato II fica marcado');

  // Ordem
  const o = aberta('ordem');
  buscar(o);
  o.localAtual = A.capela;
  const igreja = o.reputacao.igreja ?? 0, vila = o.reputacao.vila ?? 0;
  fazer(o, 'ordem');
  ok((o.reputacao.igreja ?? 0) === igreja + 8 && (o.reputacao.vila ?? 0) === vila - 5 && (o.npcState[A.mae].eixos.confianca ?? 0) < 0, 'Ordem: a capela gosta, a praça não, e a mãe não perdoa');
  noite(o);
  ok(o.trama!.atoI!.desfecho === 'ordem' && ondeEsta(o) === undefined, 'Ordem: cantado até a ponte');

  // Vigília
  const v = aberta('vigilia');
  buscar(v);
  v.localAtual = 'taverna';
  const morda = v.npcState[A.testemunha].eixos.confianca ?? 0;
  noite(v);
  ok(v.trama!.atoI!.desfecho === 'vigilia' && ondeEsta(v) === undefined && v.flags['trama.agua_recusou'], 'Vigília no vale: ele entra no rio, e a água recusa o jogador (flag para o ato III)');
  ok((v.npcState[A.testemunha].eixos.confianca ?? 0) > morda && !v.trama!.atoI!.comJogador, 'Morda ouviu; o menino não anda mais com você');
  ok(v.cronica.some(x => x.texto === A.textos.desfechos.vigilia), 'O desfecho vai para a crônica');
  ok(avisosAtoI(C, v).some(x => x.id === 'desfecho' && x.texto === A.textos.desfechos.vigilia), 'E espera ser lido no cartão');

  // Estrada
  const e = aberta('estrada');
  buscar(e);
  e.localAtual = 'porto_sal';
  noite(e);
  ok(e.trama!.atoI!.desfecho === 'estrada' && ondeEsta(e) === undefined && e.flags['trama.leva_alcanca_longe'], 'Fora do vale: ele volta andando e morre no caminho');

  // Sozinho
  const s = aberta('sozinho');
  const xp = s.personagem.xp;
  noite(s);
  ok(s.trama!.atoI!.desfecho === 'sozinho' && ondeEsta(s) === undefined && s.personagem.xp > xp, 'Sem fazer nada: ele vai sozinho');
  ok(acoesAtoI(C, s).length === 0 && !objetivoAtoI(C, s), 'Depois da noite, o ato some do "o que está aberto"');
}

// ── 4. Determinismo, RNG e save ───────────────────────────────────────────
{
  const c = aberta('rng');
  const rng = JSON.stringify(c.rng);
  c.calendario = { ...c.calendario, dia: c.trama!.atoI!.noite + 1 };
  processarDiaAtoI(C, c);
  ok(JSON.stringify(c.rng) === rng && c.trama!.atoI!.desfecho === 'sozinho', 'O ato não consome o RNG da campanha');

  const meio = aberta('save');
  buscar(meio);
  const r = importar(exportar(meio));
  if (!r.ok) throw new Error('save');
  const volta = normalizarCampanha(C, r.valor);
  ok(volta.trama?.atoI?.comJogador && ondeEsta(volta) === volta.localAtual, 'Save no meio do ato volta com o menino ao lado');
  noite(volta);
  ok(volta.trama!.atoI!.desfecho === 'vigilia', 'E a noite resolve igual depois de carregar');

  const antigo = nova('antigo');
  delete (antigo as Partial<Campaign>).trama;
  const r2 = importar(exportar(antigo));
  if (!r2.ok) throw new Error('save antigo');
  const n = normalizarCampanha(C, r2.valor);
  ate(n, 1);
  ok(n.trama?.atoI?.aberto === 1, 'Save sem trama abre o ato normalmente');
}

// ── 5. A família do jogador mora fora do vale ─────────────────────────────
{
  const c = nova('familia');
  const parentes = (c.npcsProcedurais ?? []).filter(n => n.id.startsWith('familia_'));
  ok(parentes.length > 0 && parentes.every(n => n.localBase === 'porto_sal' || n.localBase === 'acampamento'), 'A família do jogador mora em Porto do Sal: ele é de fora');
  for (const n of parentes) { n.localBase = 'taverna'; const civil = c.vivo!.pessoas[n.id]; if (civil) { civil.casa = 'taverna'; civil.local = 'taverna'; civil.deslocado = false; } }
  const m = normalizarCampanha(C, c);
  ok(m.npcsProcedurais!.filter(n => n.id.startsWith('familia_')).every(n => n.localBase === 'porto_sal' && (!m.vivo!.pessoas[n.id] || m.vivo!.pessoas[n.id].casa === 'porto_sal')), 'Save antigo com a família na taverna: ela volta para Porto do Sal');
}

console.log('\nAto I: OK.');
