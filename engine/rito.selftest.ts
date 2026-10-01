// ARCANUM · O rito do mestre (engine/rito.ts).
// O que estes testes seguram:
// - a prova é um duelo de verdade e ninguém morre (para a um quarto da vida);
// - perder a prova não tira dinheiro nem deixa cativo;
// - o resultado sai da luta (aprovado / promissor / cru) e diz o que falta;
// - aprovado aprende a primeira arte na hora e sem gastar tempo;
// - o gênio bom de espada passa na prova do mestre de vila e cai na do Santo
//   da Espada — a força do mestre é dele, não se ajusta ao jogador.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { jogadorDeTeste } from './balanco';
import { iniciarCombate, jogadorAtaca } from './combat';
import { concluirRito } from './rito';
import { aprenderArte } from './magic';
import { idDoRito, NIVEL_MESTRE } from '../content/vaelhorn/ritoMestres';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

function prova(c: Campaign, mestreId: string) {
  const s = iniciarCombate(C, c, [idDoRito(mestreId)]);
  s.rito = { mestreId };
  let g = 0;
  while (c.combate && !c.combate.terminado && g++ < 80) {
    const alvo = c.combate.atores.find((a) => !a.ehJogador && !a.ehAliado)!;
    jogadorAtaca(C, c, alvo.id);
  }
  return concluirRito(C, c)!;
}

ok(C.mestres.every((m) => C.criaturas.some((k) => k.id === idDoRito(m.id))), 'todo mestre tem adversário de prova');

// Gênio de 18 anos, bom de espada, nível 1.
const genio = (seed: string) => jogadorDeTeste(C, { nivel: 1, maestriaEspada: 35, atributo: 15, arma: 'espada_longa' }, seed);
const comum = (seed: string) => jogadorDeTeste(C, { nivel: 1, maestriaEspada: 5, atributo: 10, arma: 'espada_curta' }, seed);

const contar = (fab: (s: string) => Campaign, mestre: string, n = 60) => {
  const r = { aprovado: 0, promissor: 0, cru: 0, mortes: 0, perdas: 0 };
  for (let i = 0; i < n; i++) {
    const c = fab(`${mestre}-${i}`);
    const din = c.personagem.dinheiro;
    const res = prova(c, mestre);
    r[res.resultado]++;
    if (c.personagem.recursos.vida <= 0) r.mortes++;
    if (c.personagem.dinheiro < din || c.personagem.condicoes.includes('cativo')) r.perdas++;
  }
  return r;
};

const vila = contar(genio, 'mestre_kesta');
const santo = contar(genio, 'mestre_musashi');
const novato = contar(comum, 'mestre_kesta');
console.log(`  gênio × Kesta (nível ${NIVEL_MESTRE.mestre_kesta}): ${JSON.stringify(vila)}`);
console.log(`  gênio × Musashi (nível ${NIVEL_MESTRE.mestre_musashi}): ${JSON.stringify(santo)}`);
console.log(`  comum × Kesta: ${JSON.stringify(novato)}`);
ok(vila.mortes + santo.mortes + novato.mortes === 0, 'ninguém morre na prova');
ok(vila.perdas + santo.perdas + novato.perdas === 0, 'perder a prova não tira dinheiro nem deixa cativo');
ok(vila.aprovado + vila.promissor > novato.aprovado + novato.promissor, 'o gênio vai melhor que o novato na mesma prova');
ok(santo.aprovado === 0 && santo.cru > 0, 'o Santo da Espada não se ajusta ao gênio: ele cai');

// Resultado e o que vem dele.
{
  const c = genio('aprovado');
  let res = prova(c, 'mestre_kesta');
  for (let i = 0; res.resultado !== 'aprovado' && i < 30; i++) { const d = genio(`aprovado-${i}`); res = prova(d, 'mestre_kesta'); Object.assign(c, d); }
  ok(res.resultado === 'aprovado' && c.ritos?.mestre_kesta?.resultado === 'aprovado', `prova registrada: ${res.fato.slice(0, 90)}…`);
  const primeira = C.mestres.find((m) => m.id === 'mestre_kesta')!.ensina[0];
  ok(c.personagem.artesConhecidas.includes(primeira), 'aprovado aprende a primeira arte na hora');
}
{
  const c = comum('cru');
  const res = prova(c, 'mestre_musashi');
  ok(res.resultado === 'cru' && /O que falta: .{10,}/.test(res.fato), `o mestre diz o que falta: ${res.fato.slice(res.fato.indexOf('O que falta'), res.fato.indexOf('O que falta') + 110)}`);
}
console.log('\nRito do mestre: OK.');
