// ARCANUM · Caravanas de comida entre cidades (engine/caravanas.ts).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { processarCaravanas, estadoCaravanas, caravanasPartindoAqui, chanceDeAtaque, ALCANCE_MAXIMO, INSEGURANCA_POR_ATAQUE, RECOMPENSA_ESCOLTA } from './caravanas';
import { periodosDeViagem } from './missoesVivas';
import { estadoBandos } from './bandos';
import { executarAcaoMundo } from './acoesMundo';
import { jogadorAtaca } from './combat';
import { exportar, importar } from './persistencia';
import type { Campaign } from './types';

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

/** Um par de cidades a até três dias de estrada. */
function par(c: Campaign, filtro?: (o: string, d: string) => boolean): [string, string] {
  const ids = Object.keys(c.vivo!.cidades);
  for (const o of ids) for (const d of ids) {
    if (o === d) continue;
    const p = periodosDeViagem(C, o, d);
    if (Number.isFinite(p) && p <= ALCANCE_MAXIMO && (!filtro || filtro(o, d))) return [o, d];
  }
  throw new Error('sem par de cidades');
}
function prepararFome(c: Campaign, origem: string, destino: string): void {
  for (const [id, cid] of Object.entries(c.vivo!.cidades)) { cid.comida = 150; cid.fomeDias = 0; void id; }
  c.vivo!.cidades[origem].comida = 450;
  c.vivo!.cidades[destino].comida = 20;
  c.vivo!.cidades[destino].fomeDias = 3;
}
const regiao = (id: string) => C.locais.find(l => l.id === id)?.regiao;
function semBandos(c: Campaign) { for (const b of Object.values(estadoBandos(C, c).bandos)) { b.estado = 'destruido'; b.membros = 0; } }

// ── 1. Despacho e entrega ────────────────────────────────────────────────
{
  const c = nova('caravana-entrega');
  semBandos(c);
  const [o, d] = par(c);
  prepararFome(c, o, d);
  c.calendario.dia = 5;
  processarCaravanas(C, c);
  const cv = estadoCaravanas(c).lista.at(-1)!;
  ok(cv && cv.origem === o && cv.destino === d && cv.estado === 'partindo', `Com sobra em ${o} e fome em ${d}, sai uma caravana`);
  ok(c.vivo!.cidades[o].comida === 450 - cv.carga && cv.carga > 0, `A carga sai do celeiro da origem (${cv.carga} medidas)`);
  ok(c.vivo!.fatos.some(f => f.tipo === 'caravana_parte'), 'A partida vira fato público');
  const comida0 = c.vivo!.cidades[d].comida;
  c.calendario.dia = cv.chega; processarCaravanas(C, c);
  ok(cv.estado === 'entregue' && c.vivo!.cidades[d].comida === Math.min(600, comida0 + cv.carga), `Sem bando na rota, a caravana entrega (${d}: ${comida0} → ${c.vivo!.cidades[d].comida})`);
  ok(estadoCaravanas(c).entregues === 1 && c.vivo!.fatos.some(f => f.tipo === 'caravana_entregue'), 'Entrega contada e em fato');
}
{
  const c = nova('caravana-sem-fome');
  semBandos(c);
  for (const cid of Object.values(c.vivo!.cidades)) { cid.comida = 200; cid.fomeDias = 0; }
  c.calendario.dia = 5; processarCaravanas(C, c);
  ok(estadoCaravanas(c).lista.length === 0, 'Sem fome em lugar nenhum, ninguém manda caravana');
}

// ── 2. Ataque de bando ────────────────────────────────────────────────────
{
  let perdidas = 0, entregues = 0, insegurancaSubiu = true, tesouroSubiu = true;
  for (let i = 0; i < 30; i++) {
    const c = nova(`caravana-ataque-${i}`);
    const bandos = Object.values(estadoBandos(C, c).bandos);
    const [o, d] = par(c, (o2, d2) => bandos.some(b => b.regiao === regiao(o2) || b.regiao === regiao(d2)));
    for (const b of bandos) { b.estado = 'ativo'; b.membros = 8; }
    prepararFome(c, o, d);
    c.calendario.dia = 5; processarCaravanas(C, c);
    const cv = estadoCaravanas(c).lista.at(-1)!;
    const inseg0 = c.vivo!.cidades[d].inseguranca;
    const tesouros0 = bandos.reduce((t, b) => t + b.tesouro, 0);
    c.calendario.dia = cv.chega; processarCaravanas(C, c);
    if (cv.estado === 'perdida') {
      perdidas++;
      if (c.vivo!.cidades[d].inseguranca !== Math.min(100, inseg0 + INSEGURANCA_POR_ATAQUE)) insegurancaSubiu = false;
      if (bandos.reduce((t, b) => t + b.tesouro, 0) <= tesouros0) tesouroSubiu = false;
    } else entregues++;
  }
  ok(perdidas > 0 && entregues > 0, `Com bando de 8 na rota, ${perdidas} de 30 caravanas são atacadas (chance ${Math.round(chanceDeAtaque(8) * 100)}%)`);
  ok(insegurancaSubiu && tesouroSubiu, `Caravana perdida: a comida vira tesouro do bando e o destino fica ${INSEGURANCA_POR_ATAQUE} mais inseguro`);
}

// ── 3. Escolta ────────────────────────────────────────────────────────────
{
  // Sem bando: escolta tranquila, caravana chega, jogador é pago.
  const c = nova('caravana-escolta-livre');
  semBandos(c);
  const [o, d] = par(c);
  prepararFome(c, o, d);
  c.calendario.dia = 5; processarCaravanas(C, c);
  c.localAtual = o;
  const cv = caravanasPartindoAqui(C, c)[0];
  ok(!!cv, 'Na origem, a caravana partindo aparece para escolta');
  const din0 = c.personagem.dinheiro;
  const r = executarAcaoMundo(C, c, { tipo: 'escoltar_caravana', id: cv.id });
  ok(r.ok && !r.combate && cv.escoltada, `Escolta sem bando na rota: "${r.texto}"`);
  c.calendario.dia = cv.chega; processarCaravanas(C, c);
  ok(cv.estado === 'entregue' && c.personagem.dinheiro === din0 + RECOMPENSA_ESCOLTA, `Entregue com escolta, a cidade manda ${RECOMPENSA_ESCOLTA} moedas`);
}
{
  // Com bando: a luta é do jogador; vencendo, a carga chega mesmo com bando.
  const c = nova('caravana-escolta-luta');
  const bandos = Object.values(estadoBandos(C, c).bandos);
  const [o, d] = par(c, (o2, d2) => bandos.some(b => b.regiao === regiao(o2) || b.regiao === regiao(d2)));
  for (const b of bandos) { b.estado = 'ativo'; b.membros = 20; }
  prepararFome(c, o, d);
  c.calendario.dia = 5; processarCaravanas(C, c);
  c.localAtual = o;
  c.personagem.nivel = 1;
  const cv = caravanasPartindoAqui(C, c)[0];
  const r = executarAcaoMundo(C, c, { tipo: 'escoltar_caravana', id: cv.id });
  ok(r.ok && r.combate && c.combate?.caravana === cv.id, 'Com bando na rota, a escolta vira luta');
  ok(c.combate!.atores.filter(a => !a.ehJogador && !a.ehAliado).length === 1, 'Nível 1: um só salteador cai sobre a escolta');
  for (let i = 0; i < 100 && c.combate && !c.combate.terminado; i++) {
    const alvo = c.combate.atores.find(a => !a.ehJogador && !a.ehAliado && a.vida > 0);
    if (!alvo) break;
    alvo.vida = 1;
    c.personagem.recursos.vida = c.personagem.recursosMax.vida;
    const eu = c.combate.atores.find(a => a.ehJogador)!; eu.vida = eu.vidaMax; eu.tatico = undefined;
    jogadorAtaca(C, c, alvo.id);
  }
  ok(c.combate?.resultado === 'vitoria' && cv.escoltada === true, 'Vencida a emboscada, a caravana segue protegida');
  c.combate = null;
  c.calendario.dia = cv.chega; processarCaravanas(C, c);
  ok(cv.estado === 'entregue', 'Escoltada, chega mesmo com bando de 20 na região');
}

// ── 4. Só em Vaelhorn, e save ────────────────────────────────────────────
{
  const c = nova('caravana-save');
  semBandos(c);
  const [o, d] = par(c);
  prepararFome(c, o, d);
  c.calendario.dia = 5; processarCaravanas(C, c);
  const r = importar(exportar(c));
  ok(r.ok && JSON.stringify(r.valor.caravanas) === JSON.stringify(c.caravanas), 'As caravanas voltam idênticas do save');
  const semBando = { ...C, criaturas: C.criaturas.filter(x => x.id !== 'capitao_bandoleiro') };
  const t = nova('caravana-outro-bundle');
  prepararFome(t, o, d);
  t.calendario.dia = 5; processarCaravanas(semBando, t);
  ok(!t.caravanas, 'Bundle sem bandos (Tsukimichi) não tem caravanas');
}

console.log('\nCaravanas: OK.');
