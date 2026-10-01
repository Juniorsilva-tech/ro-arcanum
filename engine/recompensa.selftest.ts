// ARCANUM · Caçador com nome, fugitivos e a caçada de recompensa.
// O que estes testes seguram:
// - cada região tem um caçador de recompensas com nome; ele lembra de você
//   (correu, pagou), aprende a cada encontro e cobra mais a cada pagamento;
//   morto, some, e só depois de 30 dias aparece outro, com outro nome;
// - NPC preso foge da cela onde a guarda é fraca, ganha cartaz e se esconde
//   no ermo; a guarda forte acha e devolve à cela; o caso esfria em 120 dias;
// - o jogador caça a recompensa: vivo paga sempre e não é crime; morto paga
//   só com "vivo ou morto"; matar quem o cartaz pede vivo é crime;
// - "capturo X" é briga de soco; o narrador e a tela recebem os cartazes.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { calcularContexto } from './availability';
import { iniciarMundoVivo, cidadeIdDoLocal, localEfetivo } from './historiaViva';
import { iniciarBriga, concluirBriga } from './briga';
import { jogadorAtaca } from './combat';
import { processarCrimeUrbano, DIAS_PARA_ESQUECER_FUGITIVO } from './crimeUrbano';
import { processarAutonomia } from './autonomia';
import { registrarCrime, checarPerseguicao, responderAbordagem, concluirConfrontoGuarda, custoDoSuborno, procuraAqui, cacadorDaRegiao, regiaoDe } from './guarda';
import { montarPacote, cartazesDaRegiao } from './llm';
import { todosNpcs } from './elenco';
import { classificarBriga } from '../ui/freeAction';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string, local = 'taverna'): Campaign => {
  const c = criarCampanha(C, { nome: 'Torvald', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  c.personagem.idade = 20;
  if (!c.vivo) iniciarMundoVivo(C, c);
  c.localAtual = local;
  return c;
};
const umDia = (c: Campaign) => { c.turno++; c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 }; };
const lutar = (c: Campaign, dano: number) => {
  const s = c.combate!;
  const eu = s.atores.find((a) => a.ehJogador)!;
  eu.vida = eu.vidaMax = 999; eu.acerto = 40; eu.dano = { base: dano, dispersao: 0.1, tipo: dano > 50 ? 'cortante' : 'contusão' };
  for (let i = 0; i < 80 && !s.terminado; i++) {
    const alvo = s.atores.find((a) => !a.ehJogador && !a.ehAliado && a.vida > 0 && !a.capturado);
    if (!alvo) break;
    jogadorAtaca(C, c, alvo.id);
  }
};
/** Insiste até o caçador aparecer no ermo. */
const esperarCacador = (c: Campaign): string | undefined => {
  for (let i = 0; i < 80; i++) {
    umDia(c);
    const pr = procuraAqui(C, c); if (pr) pr.pontos = 150;
    const t = checarPerseguicao(C, c);
    if (t && c.abordagem?.cacador) return t;
    c.abordagem = undefined;
  }
  return undefined;
};

{
  // O caçador da região tem nome e memória.
  const c = nova('cacador', 'floresta');
  registrarCrime(C, c, 'sangue', 150, 'matou três na taverna');
  const regiao = regiaoDe(C, c.localAtual);
  const t1 = esperarCacador(c)!;
  const ca = c.cacadores![regiao];
  ok(t1 && ca && t1.includes(ca.nome), `o caçador tem nome (${ca?.nome})`);
  c.personagem.atributos.fisico = 20; c.personagem.atributos.percepcao = 20;
  let fugiu = false;
  for (let i = 0; i < 20 && !fugiu; i++) {
    const r = responderAbordagem(C, c, 'fugir');
    if (r.combate) { c.combate = undefined; c.abordagem = undefined; esperarCacador(c); continue; }
    fugiu = true;
  }
  ok(fugiu && ca.encontros >= 1 && ca.ultimo === 'fugiu' && ca.nivel > 8, `ele lembra que você correu e aprendeu (nível ${ca.nivel})`);
  const t2 = esperarCacador(c)!;
  ok(/De novo você/.test(t2), `no reencontro ele lembra ("${t2.slice(0, 40)}…")`);
  const preco1 = custoDoSuborno(C, c)!;
  c.personagem.dinheiro = 10000;
  responderAbordagem(C, c, 'subornar');
  esperarCacador(c);
  const preco2 = custoDoSuborno(C, c)!;
  ok(preco2 > preco1, `quem paga uma vez paga mais na próxima (${preco1} → ${preco2})`);
  const r = responderAbordagem(C, c, 'lutar');
  ok(r.combate, 'lutar com ele abre combate');
  lutar(c, 300);
  concluirConfrontoGuarda(C, c);
  c.combate = undefined;
  ok(!ca.vivo, `matar ${ca.nome} tira ele do mundo`);
  ok(!cacadorDaRegiao(c, regiao), 'nos 30 dias seguintes não há caçador na região');
  c.calendario = { ...c.calendario, dia: c.calendario.dia + 31 };
  const novo = cacadorDaRegiao(c, regiao);
  ok(novo && novo.vivo && novo.nome !== ca.nome && novo.encontros === 0, `depois, aparece outro com outro nome (${novo?.nome})`);
}

/** Uma pessoa da cidade da taverna, presa por morte. */
const prenderAlguem = (c: Campaign, crime: 'furto' | 'morte' = 'morte'): string => {
  const cidadeId = cidadeIdDoLocal(C, c, c.localAtual)!;
  const id = Object.entries(c.vivo!.pessoas).find(([pid, p]) => cidadeIdDoLocal(C, c, p.local) === cidadeId && c.npcState[pid]?.vivo !== false
    && !todosNpcs(C, c).find((n) => n.id === pid)?.parentesco && (c.npcState[pid]?.idade ?? 30) >= 18)![0];
  const p = c.vivo!.pessoas[id];
  p.objetivo = 'preso'; p.presoAte = c.calendario.dia + 400; p.presoPor = crime;
  return id;
};

{
  // NPC foge da cela com guarda fraca, ganha cartaz e se esconde.
  const c = nova('fugitivo');
  const cidadeId = cidadeIdDoLocal(C, c, c.localAtual)!;
  const cidade = c.vivo!.cidades[cidadeId];
  const id = prenderAlguem(c, 'morte');
  for (let d = 0; d < 300 && !c.procuradosNpc?.[id]; d++) {
    cidade.inseguranca = 95; cidade.fomeDias = 6; cidade.edificios.muralha = 0;
    umDia(c);
    processarCrimeUrbano(C, c);
  }
  const f = c.procuradosNpc?.[id];
  ok(f && f.vivoOuMorto && f.recompensa === 80, `preso por morte foge e vira cartaz "vivo ou morto" (${id})`);
  ok(c.vivo!.fatos.some((x) => x.tipo === 'cartaz_procurado' && x.atores.includes(id)), 'o cartaz do fugitivo vira fato público');
  const npc = todosNpcs(C, c).find((n) => n.id === id)!;
  ok(localEfetivo(c, npc, undefined, C) === f!.esconderijo, `ele está no esconderijo (${f!.esconderijo})`);
  processarAutonomia(C, c);
  ok(localEfetivo(c, npc, undefined, C) === f!.esconderijo, 'e não volta para casa enquanto tem cartaz');
  ok((cartazesDaRegiao(C, c) ?? []).some((t) => t.includes(npc.nome.split(',')[0])), 'o cartaz aparece na lista da região');

  // Guarda forte acha.
  for (let d = 0; d < 400 && c.procuradosNpc?.[id]; d++) {
    cidade.inseguranca = 0; cidade.fomeDias = 0; cidade.edificios.muralha = 4;
    c.procuradosNpc![id].desdeDia = c.calendario.dia; // não deixar esfriar no teste
    umDia(c);
    processarCrimeUrbano(C, c);
  }
  ok(!c.procuradosNpc?.[id] && c.vivo!.pessoas[id].objetivo === 'preso', 'a guarda forte acha o fugitivo e devolve à cela');
}

{
  // O caso esfria.
  const c = nova('esfria');
  const id = prenderAlguem(c, 'furto');
  const cidade = c.vivo!.cidades[cidadeIdDoLocal(C, c, c.localAtual)!];
  for (let d = 0; d < 300 && !c.procuradosNpc?.[id]; d++) { cidade.inseguranca = 95; cidade.edificios.muralha = 0; umDia(c); processarCrimeUrbano(C, c); }
  ok(c.procuradosNpc?.[id], 'o ladrão fugiu');
  cidade.inseguranca = 100; cidade.fomeDias = 9; cidade.edificios.muralha = 0;
  c.procuradosNpc![id].desdeDia = c.calendario.dia - DIAS_PARA_ESQUECER_FUGITIVO - 1;
  umDia(c); processarCrimeUrbano(C, c);
  ok(!c.procuradosNpc?.[id], `depois de ${DIAS_PARA_ESQUECER_FUGITIVO} dias a guarda para de procurar`);
}

/** Um fugitivo pronto, no lugar do jogador. */
const fugitivoAqui = (c: Campaign, vivoOuMorto: boolean): string => {
  const alvo = calcularContexto(C, c).presentes.find((n) => !n.parentesco && (c.npcState[n.id]?.idade ?? n.idade) >= 18)!;
  const p = c.vivo!.pessoas[alvo.id];
  p.presoPor = vivoOuMorto ? 'morte' : 'furto';
  (c.procuradosNpc ??= {})[alvo.id] = {
    crime: vivoOuMorto ? 'a morte no beco' : 'furto', cidade: cidadeIdDoLocal(C, c, c.localAtual)!,
    regiao: regiaoDe(C, c.localAtual), recompensa: vivoOuMorto ? 80 : 25, vivoOuMorto, desdeDia: c.calendario.dia, esconderijo: c.localAtual,
  };
  return alvo.id;
};

{
  // Caçar a recompensa: vivo paga e não é crime.
  const c = nova('caca-vivo');
  const id = fugitivoAqui(c, false);
  const nome = todosNpcs(C, c).find((n) => n.id === id)!.nome.split(',')[0];
  const b = classificarBriga(`Capturo ${nome}.`, calcularContexto(C, c));
  ok(b && !b.letal && b.alvos[0] === id, `"Capturo ${nome}" é briga de soco`);
  const dinheiro = c.personagem.dinheiro;
  iniciarBriga(C, c, [id], false);
  lutar(c, 8);
  const r = concluirBriga(C, c)!;
  ok(c.personagem.dinheiro === dinheiro + 25 && /recompensa/.test(r.fato), `entregar vivo paga a recompensa ("${r.fato.slice(0, 50)}…")`);
  ok(c.vivo!.pessoas[id].objetivo === 'preso' && !c.procuradosNpc?.[id], 'o fugitivo volta para a cela');
  ok(!procuraAqui(C, c), 'caçar recompensa não é crime');
}

{
  // Morto: só paga com "vivo ou morto"; senão é crime.
  const c = nova('caca-morto');
  const id = fugitivoAqui(c, true);
  const dinheiro = c.personagem.dinheiro;
  iniciarBriga(C, c, [id], true);
  lutar(c, 300);
  concluirBriga(C, c);
  ok(c.npcState[id]?.vivo === false && c.personagem.dinheiro === dinheiro + 80 && !procuraAqui(C, c), '"vivo ou morto": o corpo também paga, e não é crime');

  const d = nova('caca-queriam-vivo');
  const id2 = fugitivoAqui(d, false);
  const din2 = d.personagem.dinheiro;
  iniciarBriga(C, d, [id2], true);
  lutar(d, 300);
  const r = concluirBriga(C, d)!;
  ok(d.personagem.dinheiro === din2 && procuraAqui(C, d)?.gravidade === 'sangue' && /pedia vivo/.test(r.fato), 'matar quem o cartaz pede vivo não paga e é crime');
}

{
  // O narrador sabe quem é procurado.
  const c = nova('pacote');
  const id = fugitivoAqui(c, true);
  const pacote = montarPacote(C, c, calcularContexto(C, c), 'x') as { presentes: { nome: string; procurado?: { recompensa: number } }[]; cartazesDaRegiao?: string[] };
  const nome = todosNpcs(C, c).find((n) => n.id === id)!.nome;
  ok(pacote.presentes.find((p) => p.nome === nome)?.procurado?.recompensa === 80, 'o presente procurado vem marcado no pacote');
  ok(pacote.cartazesDaRegiao?.length, 'os cartazes da região vão no pacote');
}

console.log('\nRecompensa: OK.');
