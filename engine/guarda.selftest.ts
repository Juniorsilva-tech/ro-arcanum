// ARCANUM · A guarda: procurado, perseguição e cela (engine/guarda.ts).
// O que estes testes seguram:
// - matar em público deixa o jogador procurado por sangue na região; briga
//   vista deixa procurado por arruaça;
// - a patrulha acha quem é procurado (com guarda na cena, quase certo), no
//   máximo uma vez por dia, e nunca acha quem não deve nada;
// - render-se leva à cela: arma confiscada, condição 'preso', não age nem viaja;
// - cumprir devolve a arma, passa os dias e limpa a procura; fiança só para
//   arruaça; fugir da cela deixa fugitivo e sem a arma;
// - perder para a patrulha leva à cela sem roubo; matar guarda soma sangue;
// - o narrador recebe procurado, cerco e cela.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { calcularContexto } from './availability';
import { iniciarBriga, concluirBriga } from './briga';
import { jogadorAtaca } from './combat';
import { viajar } from './viagem';
import { resolverIntencao } from './turn';
import {
  registrarCrime, procuraAqui, checarPerseguicao, responderAbordagem, agirNaCela,
  concluirConfrontoGuarda, regiaoDe, PATRULHA,
} from './guarda';
import { montarPacote } from './llm';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string): Campaign => {
  const c = criarCampanha(C, { nome: 'Torvald', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  c.personagem.idade = 20;
  c.localAtual = 'taverna';
  return c;
};
const vencer = (c: Campaign) => {
  const s = c.combate!;
  const eu = s.atores.find((a) => a.ehJogador)!;
  eu.vida = eu.vidaMax = 999; eu.acerto = 40; eu.dano = { base: 80, dispersao: 0.1, tipo: 'cortante' };
  for (let i = 0; i < 80 && !s.terminado; i++) {
    const alvo = s.atores.find((a) => !a.ehJogador && !a.ehAliado && a.vida > 0 && !a.capturado);
    if (!alvo) break;
    jogadorAtaca(C, c, alvo.id);
  }
};
/** Insiste até a patrulha achar (ou desistir depois de muitos períodos). */
const ateAchar = (c: Campaign): string | undefined => {
  for (let i = 0; i < 60; i++) {
    const t = checarPerseguicao(C, c);
    if (t) return t;
    c.turno++;
    c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
  }
  return undefined;
};

{
  // Sem crime, ninguém te procura.
  const c = nova('limpo');
  ok(!procuraAqui(C, c) && !ateAchar(c), 'quem não deve nada nunca é abordado');
}

{
  // Matar em público: procurado por sangue, cercado, preso, cumpre a pena.
  const c = nova('sangue');
  const alvo = calcularContexto(C, c).presentes[0];
  const arma = c.personagem.equipado.arma;
  iniciarBriga(C, c, [alvo.id], true);
  vencer(c);
  concluirBriga(C, c);
  c.combate = undefined;
  const pr = procuraAqui(C, c);
  ok(pr?.gravidade === 'sangue' && pr.pontos >= 40, `matar deixa procurado por sangue (${pr?.pontos} pontos)`);
  const aviso = ateAchar(c);
  ok(aviso && c.abordagem, `a patrulha acha o assassino ("${aviso?.slice(0, 50)}…")`);
  ok(!checarPerseguicao(C, c), 'enquanto o cerco espera resposta, não há segundo cerco');
  const pacote = montarPacote(C, c, calcularContexto(C, c), 'x') as { personagem: { procuradoAqui?: unknown; cercadoPelaGuarda?: string } };
  ok(pacote.personagem.procuradoAqui && pacote.personagem.cercadoPelaGuarda, 'o narrador sabe que você é procurado e está cercado');

  const r = responderAbordagem(C, c, 'render');
  ok(r.ok && c.prisao && c.personagem.condicoes.includes('preso'), 'render-se leva à cela');
  ok(!c.personagem.equipado.arma && c.prisao!.armaConfiscada === arma, 'a arma fica confiscada');
  ok(!c.prisao!.fianca, 'para sangue não há fiança');
  ok(agirNaCela(C, c, 'fianca').ok === false, 'pedir fiança por sangue é recusado');
  ok(!viajar(C, c, 'praca').ok, 'preso não viaja');
  const t = resolverIntencao(C, c, { tipo: 'verbo', verboId: 'descansar' } as Parameters<typeof resolverIntencao>[2]);
  ok(/cela/.test(t.fato), 'preso não age no mundo');
  ok((montarPacote(C, c, calcularContexto(C, c), 'x') as { personagem: { naCela?: unknown } }).personagem.naCela, 'o narrador sabe que você está na cela');

  const dia = c.calendario.dia;
  const pena = c.prisao!.ateDia - dia;
  const cumpriu = agirNaCela(C, c, 'cumprir');
  ok(cumpriu.ok && !c.prisao && !c.personagem.condicoes.includes('preso'), 'cumprir a pena solta');
  ok(c.calendario.dia >= dia + pena, `os ${pena} dias passaram`);
  ok(c.personagem.equipado.arma === arma, 'a arma volta na soltura');
  ok(!procuraAqui(C, c), 'pena cumprida, a guarda para de procurar');
}

{
  // Arruaça: fiança resolve.
  const c = nova('arruaca');
  registrarCrime(C, c, 'arruaca', 10, 'briga na taverna');
  ok(procuraAqui(C, c)?.gravidade === 'arruaca', 'briga deixa procurado por arruaça');
  c.abordagem = { dia: c.calendario.dia, local: c.localAtual, regiao: regiaoDe(C, c.localAtual), guarda: 'a patrulha' };
  responderAbordagem(C, c, 'render');
  ok(c.prisao?.fianca, `arruaça tem fiança (${c.prisao?.fianca} moedas)`);
  c.personagem.dinheiro = 999;
  ok(agirNaCela(C, c, 'fianca').ok && !c.prisao && !procuraAqui(C, c), 'fiança paga solta e limpa a procura');

  // Esfria com o tempo.
  registrarCrime(C, c, 'arruaca', 10, 'briga na taverna');
  c.calendario = { ...c.calendario, dia: c.calendario.dia + 10 };
  ok(!procuraAqui(C, c), 'arruaça esfria em dias');
}

{
  // Suborno de arruaça sempre cola, se houver moeda.
  const c = nova('suborno');
  registrarCrime(C, c, 'arruaca', 20, 'briga na feira');
  c.abordagem = { dia: c.calendario.dia, local: c.localAtual, regiao: regiaoDe(C, c.localAtual), guarda: 'a patrulha' };
  c.personagem.dinheiro = 0;
  ok(!responderAbordagem(C, c, 'subornar').ok && c.abordagem, 'sem moeda, sem suborno');
  c.personagem.dinheiro = 100;
  const r = responderAbordagem(C, c, 'subornar');
  ok(r.ok && !c.abordagem && !c.prisao && c.personagem.dinheiro < 100, 'suborno de arruaça paga e a patrulha segue');
}

{
  // Fugir da cela: livre, sem a arma, fugitivo.
  const c = nova('fuga');
  registrarCrime(C, c, 'sangue', 40, 'matou alguém');
  c.abordagem = { dia: c.calendario.dia, local: c.localAtual, regiao: regiaoDe(C, c.localAtual), guarda: 'a patrulha' };
  responderAbordagem(C, c, 'render');
  c.personagem.atributos.fisico = 20; c.personagem.atributos.percepcao = 20;
  let r = agirNaCela(C, c, 'fugir');
  for (let i = 0; i < 20 && c.prisao; i++) { c.turno++; c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 }; r = agirNaCela(C, c, 'fugir'); }
  ok(!c.prisao, `fugir da cela acaba dando certo com corpo bom (${r.texto.slice(0, 40)}…)`);
  ok(!c.personagem.equipado.arma, 'quem foge deixa a arma no depósito');
  ok(procuraAqui(C, c)?.fugitivo, 'e vira fugitivo');
}

{
  // Lutar contra a patrulha: perder leva à cela sem roubo; vencer soma sangue.
  const c = nova('patrulha');
  registrarCrime(C, c, 'arruaca', 20, 'briga na taverna');
  c.abordagem = { dia: c.calendario.dia, local: c.localAtual, regiao: regiaoDe(C, c.localAtual), guarda: 'a patrulha' };
  const dinheiro = c.personagem.dinheiro;
  const r = responderAbordagem(C, c, 'lutar');
  ok(r.combate && c.combate?.guarda && c.combate.atores.some((a) => a.criaturaId === PATRULHA), 'lutar abre combate contra a patrulha');
  const eu = c.combate!.atores.find((a) => a.ehJogador)!;
  eu.vida = 1; eu.defesa = 0;
  for (let i = 0; i < 40 && !c.combate!.terminado; i++) {
    const alvo = c.combate!.atores.find((a) => !a.ehJogador && a.vida > 0)!;
    jogadorAtaca(C, c, alvo.id);
  }
  ok(c.combate!.resultado === 'derrota', 'o jogador fraco perde para a patrulha');
  const fim = concluirConfrontoGuarda(C, c)!;
  ok(fim.preso && c.prisao, 'perder para a patrulha leva à cela');
  ok(c.personagem.dinheiro === dinheiro, 'a patrulha não rouba');

  const d = nova('patrulha-vence');
  registrarCrime(C, d, 'arruaca', 20, 'briga na taverna');
  d.abordagem = { dia: d.calendario.dia, local: d.localAtual, regiao: regiaoDe(C, d.localAtual), guarda: 'a patrulha' };
  responderAbordagem(C, d, 'lutar');
  vencer(d);
  const venceu = concluirConfrontoGuarda(C, d)!;
  ok(!venceu.preso && !d.abordagem, 'vencer a patrulha não prende');
  ok(procuraAqui(C, d)?.gravidade === 'sangue', 'matar guarda vira procurado por sangue');
}

console.log('\nGuarda: OK.');
