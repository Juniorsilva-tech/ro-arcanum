// ARCANUM · Ato II da trama: as duas levas (engine/atoII.ts, engine/trama.ts).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo, localEfetivo } from './historiaViva';
import { avancarMundo } from './mundo';
import { revelarSegredo } from './segredos';
import { pistasAchadas, contextoAtoII } from './atoII';
import { avisosDaTrama, marcarAvisoTrama, acoesDaTrama, executarAcaoTrama, objetivosDaTrama, contextoDaTrama, processarDiaTrama } from './trama';
import { exportar, importar } from './persistencia';
import { normalizarCampanha } from './migracao';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const A = C.atoII!;
const nova = (seed: string): Campaign => {
  const c = criarCampanha(C, { nome: 'T', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};
const ate = (c: Campaign, d: number) => { c.calendario = { ...c.calendario, dia: d }; avancarMundo(C, c); };
const lerTudo = (c: Campaign) => { for (const a of avisosDaTrama(C, c)) marcarAvisoTrama(C, c, a.id); };
/** Ato I resolvido (sozinho) e lido; Ato II aberto e a carta lida. */
const noAtoII = (seed: string): Campaign => {
  const c = nova(seed);
  ate(c, 1); lerTudo(c);
  ate(c, c.trama!.atoI!.noite + 1); lerTudo(c);
  ate(c, c.trama!.atoI!.diaDesfecho! + A.diasDepoisDoAtoI); lerTudo(c);
  return c;
};
/** Põe o jogador onde a pessoa está agora. */
const irAte = (c: Campaign, npcId: string) => {
  const n = C.npcs.find(x => x.id === npcId)!;
  c.localAtual = localEfetivo(c, n, undefined, C)!;
};
const temAcao = (c: Campaign, id: string) => acoesDaTrama(C, c).some(a => a.id === id);

// ── 0. Os ids gerados ainda apontam para as pessoas certas ───────────────
{
  const nome = (id: string) => C.npcs.find(n => n.id === id)?.nome;
  const esperado: Record<string, string> = {
    morador_tessel_18: 'Cera', morador_tessel_7: 'Ketta', morador_tessel_6: 'Mira a Velha',
    morador_corveira_7: 'Wyn', morador_corveira_13: 'Quilda Boca-Seca', morador_corveira_2: 'Fenn',
    morador_mareu_12: 'Fenn do Norte', morador_mercado_peixe_2: 'Vidar Olho-Vivo',
  };
  const errados = Object.entries(esperado).filter(([id, n]) => nome(id) !== n);
  ok(errados.length === 0, `Ids de moradores do Ato II apontam para as pessoas certas${errados.length ? ': ' + errados.map(([id]) => `${id}=${nome(id)}`).join(', ') : ''}`);
}

// ── 1. A carta ────────────────────────────────────────────────────────────
{
  const c = nova('carta');
  ate(c, 1); lerTudo(c);
  ate(c, c.trama!.atoI!.noite + 1);
  ate(c, c.trama!.atoI!.diaDesfecho! + A.diasDepoisDoAtoI + 2);
  ok(!c.trama!.atoII, 'Sem ler a noite dos dezoito, a carta não chega');
  lerTudo(c);
  ate(c, c.calendario.dia + 1);
  ok(c.trama!.atoII?.aberto === c.calendario.dia && c.trama!.ato === 2, 'Lida a noite, a carta chega no dia seguinte');
  const carta = avisosDaTrama(C, c).find(a => a.id === 'II:carta')!;
  ok(carta.texto.includes(A.carta.sozinho) && carta.texto.includes('Tobin'), 'A carta fala de Tobin e do que Tessel ouviu do Ato I');
  ok(acoesDaTrama(C, c).filter(a => a.id.startsWith('II:')).length === 0, 'Antes de ler a carta, nada do ato II');
  ok(!JSON.stringify(A).match(/contrato|pacto|assinaram/i), 'Nada do ato fala do contrato do vale');

  const v = nova('carta-vigilia');
  ate(v, 1); lerTudo(v);
  v.localAtual = C.atoI!.menino.casa; executarAcaoTrama(C, v, 'I:levar');
  ate(v, v.trama!.atoI!.noite + 1); lerTudo(v);
  ate(v, v.trama!.atoI!.diaDesfecho! + A.diasDepoisDoAtoI);
  ok(avisosDaTrama(C, v).find(a => a.id === 'II:carta')!.texto.includes(A.carta.vigilia), 'Quem fez a vigília recebe a carta da vigília');
}

// ── 2. As pistas são segredos que já existem ──────────────────────────────
{
  const c = noAtoII('pistas');
  ok(pistasAchadas(C, c).length === 0 && objetivosDaTrama(C, c).some(o => o.includes('0 de 3')), 'Começa sem rastro: "0 de 3"');
  c.localAtual = 'tessel';
  ok(contextoAtoII(C, c)!.quemSabeAqui === A.pistas[0].dica, 'Em Tessel, o narrador sabe quem guarda o rastro (sem saber o segredo)');
  revelarSegredo(C, c, 'marechala_odile');
  ok(pistasAchadas(C, c).map(p => p.id).join() === 'tessel', 'O segredo de Odile é o rastro de Tessel');
  const progresso = () => JSON.stringify([c.personagem.nivel, c.personagem.xp]);
  const xp = progresso();
  ok(avisosDaTrama(C, c).some(a => a.id === 'II:pista_tessel'), 'E aparece no cartão');
  lerTudo(c);
  ok(progresso() !== xp && c.flags['trama.atoII.pista.tessel'], 'Ler a pista paga e marca a flag');
  const xp2 = progresso();
  marcarAvisoTrama(C, c, 'II:pista_tessel');
  ok(progresso() === xp2, 'Não paga duas vezes');
  ok(!contextoAtoII(C, c)!.quemSabeAqui, 'Achada a pista, Tessel não aponta mais ninguém');

  const antes = nova('antes');
  revelarSegredo(C, antes, 'mirel');
  ate(antes, 1); lerTudo(antes);
  ate(antes, antes.trama!.atoI!.noite + 1); lerTudo(antes);
  ate(antes, antes.trama!.atoI!.diaDesfecho! + A.diasDepoisDoAtoI);
  ok(pistasAchadas(C, antes).some(p => p.id === 'mareu'), 'Segredo descoberto antes do ato também conta');
}

// ── 3. Tobin e Cera ───────────────────────────────────────────────────────
{
  const c = noAtoII('tobin');
  irAte(c, A.remetente);
  ok(!temAcao(c, 'II:contar_cera'), 'Sem o rastro de Corveira, não há o que contar a Cera');
  revelarSegredo(C, c, 'morador_corveira_7'); lerTudo(c);
  ok(A.pistas[1].texto.includes('Tobin Ost'), 'O rastro de Corveira tem o nome de Tobin');
  c.localAtual = 'mareu';
  ok(!temAcao(c, 'II:contar_cera'), 'Longe de Cera, não');
  irAte(c, A.remetente);
  const conf = c.npcState[A.remetente].eixos.confianca ?? 0;
  ok(executarAcaoTrama(C, c, 'II:contar_cera').ok && (c.npcState[A.remetente].eixos.confianca ?? 0) > conf, 'Contar a Cera: ela confia mais');
  ok(!temAcao(c, 'II:contar_cera'), 'Uma vez só');
}

// ── 4. A aliança ──────────────────────────────────────────────────────────
{
  const c = noAtoII('alianca');
  revelarSegredo(C, c, 'marechala_odile'); lerTudo(c);
  irAte(c, 'dama_valda');
  ok(!temAcao(c, 'II:aliar_halvet'), 'Com um rastro só, ainda não se escolhe aliado');
  revelarSegredo(C, c, 'mirel'); lerTudo(c);
  irAte(c, 'dama_valda');
  ok(temAcao(c, 'II:aliar_halvet') && !temAcao(c, 'II:aliar_mareu'), 'Com dois: Halvet na casa de pedra; Mirel não está aqui');
  irAte(c, 'morador_corveira_2');
  ok(!temAcao(c, 'II:aliar_corveira'), 'Fenn exige o rastro de Corveira');
  irAte(c, 'mirel');
  ok(temAcao(c, 'II:aliar_mareu'), 'Mirel, onde ela está, com o rastro de Mareu');
  const odile = c.npcState.marechala_odile.eixos.disposicao ?? 0;
  const vidar = c.npcState.morador_mercado_peixe_2.eixos.disposicao ?? 0;
  ok(executarAcaoTrama(C, c, 'II:aliar_mareu').ok, 'Aliar-se a Mirel');
  const e = c.trama!.atoII!;
  ok(e.alianca === 'mareu' && e.cacam!.includes('morador_mercado_peixe_2') && c.trama!.ato === 3, 'A aliança fica gravada, com quem caça o jogador, e o ato III fica marcado');
  ok((c.npcState.morador_mercado_peixe_2.eixos.disposicao ?? 0) < vidar && (c.npcState.marechala_odile.eixos.disposicao ?? 0) === odile, 'A mãe de Mirel vira inimiga; Odile não muda');
  ok(avisosDaTrama(C, c).some(a => a.id === 'II:alianca'), 'O texto da aliança vai para o cartão');
  lerTudo(c);
  ok(acoesDaTrama(C, c).length === 0 && objetivosDaTrama(C, c).length === 0, 'Depois da aliança, nada do ato II fica aberto');
  ok(contextoDaTrama(C, c)!.atoII!.cacamVoce!.length === 1, 'O narrador sabe quem caça');
}

// ── 5. RNG e save ─────────────────────────────────────────────────────────
{
  const c = noAtoII('rng');
  const rng = JSON.stringify(c.rng);
  processarDiaTrama(C, c);
  revelarSegredo(C, c, 'marechala_odile'); lerTudo(c);
  ok(JSON.stringify(c.rng) === rng, 'O ato II não consome o RNG da campanha');
  const r = importar(exportar(c));
  if (!r.ok) throw new Error('save');
  const v = normalizarCampanha(C, r.valor);
  ok(v.trama?.atoII?.aberto === c.trama!.atoII!.aberto && pistasAchadas(C, v).length === 1 && avisosDaTrama(C, v).length === 0, 'Save no meio do ato II volta igual');
}

console.log('\nAto II: OK.');
