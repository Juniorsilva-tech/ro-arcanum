// ARCANUM · Briga com quem está na cena (engine/briga.ts, ui/freeAction.ts).
// O que estes testes seguram:
// - "agrido", "ataco", "soco", "esfaqueio", "chuto" viram briga (antes só o
//   infinitivo casava e a frase ia crua para o narrador);
// - "mato todo mundo" briga com quem está aqui, não sorteia bandido de fora;
// - conversa sobre ataque e "me escondo no mato" não viram briga;
// - soco não mata, não rouba e não arranca membro; lâmina mata de verdade,
//   com fato público, reputação e medo em quem viu;
// - menor de idade nunca entra em briga.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { calcularContexto } from './availability';
import { iniciarBriga, concluirBriga, alvosDaBriga } from './briga';
import { jogadorAtaca } from './combat';
import { classificarBriga, classificarAcaoLivre } from '../ui/freeAction';
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

{
  const c = nova('classificar');
  const ctx = calcularContexto(C, c);
  ok(ctx.presentes.length >= 2, `há gente na taverna (${ctx.presentes.length})`);
  const alvo = ctx.presentes[0];
  const nome = alvo.nome.split(',')[0].split(' ')[0];
  for (const frase of [`Agrido ${nome}.`, `Ataco ${nome}.`, `Dou um soco na cara de ${nome}.`, `Chuto ${nome}.`, `Parto pra cima de ${nome}.`]) {
    const b = classificarBriga(frase, ctx);
    ok(b && b.alvos[0] === alvo.id && !b.letal, `"${frase}" é briga de soco com ${nome}`);
  }
  for (const frase of [`Esfaqueio ${nome}.`, `Saco a espada e ataco ${nome}.`]) {
    const b = classificarBriga(frase, ctx);
    ok(b && b.letal, `"${frase}" é luta letal`);
  }
  const todos = classificarBriga('Mato todo mundo na taverna.', ctx);
  ok(todos && todos.letal && todos.alvos.length === ctx.presentes.length, '"Mato todo mundo" é contra todos os presentes');
  const cls = classificarAcaoLivre('Mato todo mundo na taverna.', C, ctx);
  ok(cls?.briga && cls.verboId !== 'cacar', '"Mato todo mundo" não sorteia bandido de fora');
  ok(!classificarBriga(`Pergunto pra ${nome} sobre o ataque de ontem.`, ctx), 'conversa sobre ataque não é briga');
  ok(!classificarBriga('Me escondo no mato atrás da taverna.', ctx), '"no mato" não é matar');
  ok(!classificarBriga('Ataco.', { ...ctx, presentes: [] }), 'sem ninguém na cena, não há briga');
  const comTitulo = { ...ctx, presentes: [{ ...ctx.presentes[0], nome: 'Sargenta Bael' }, ...ctx.presentes.slice(1)] };
  ok(classificarBriga('Dou um soco na cara da Bael.', comTitulo)?.alvos[0] === ctx.presentes[0].id, '"a Bael" acha a "Sargenta Bael"');
}

{
  // Soco: ninguém morre, ninguém rouba, nenhum membro sai.
  const c = nova('soco');
  const ctx = calcularContexto(C, c);
  const alvo = ctx.presentes[0];
  const dinheiro = c.personagem.dinheiro;
  ok(iniciarBriga(C, c, [alvo.id], false).ok, 'briga de soco começa');
  const s = c.combate!;
  ok(s.briga && !s.briga.letal, 'combate marcado como briga não letal');
  const eu = s.atores.find((a) => a.ehJogador)!;
  ok(eu.dano?.tipo === 'contusão', 'o jogador bate de punho');
  eu.vida = eu.vidaMax = 999; eu.acerto = 40;
  for (let i = 0; i < 60 && !s.terminado; i++) {
    const inimigo = s.atores.find((a) => !a.ehJogador && a.vida > 0 && !a.capturado);
    if (!inimigo) break;
    jogadorAtaca(C, c, inimigo.id);
  }
  ok(s.atores.every((a) => !a.membrosPerdidos?.length), 'ninguém perde membro numa briga de soco');
  const r = concluirBriga(C, c)!;
  ok(r && r.mortos.length === 0, 'soco não mata');
  ok(c.npcState[alvo.id]?.vivo !== false, `${alvo.nome} continua viva`);
  ok((c.npcState[alvo.id]?.eixos?.medo ?? 0) > 0, `${alvo.nome} ficou com medo`);
  ok(c.personagem.dinheiro >= dinheiro, 'ninguém mexeu na bolsa');
}

{
  // Lâmina: quem cai morre, o vale sabe, a guarda odeia, quem viu treme.
  const c = nova('letal');
  const ctx = calcularContexto(C, c);
  const [alvo, ...resto] = ctx.presentes;
  const guarda = (c.reputacao as unknown as Record<string, number>).guarda ?? 0;
  ok(iniciarBriga(C, c, [alvo.id], true).ok, 'luta letal começa');
  const s = c.combate!;
  const eu = s.atores.find((a) => a.ehJogador)!;
  eu.vida = eu.vidaMax = 999; eu.acerto = 40; eu.dano = { base: 80, dispersao: 0.1, tipo: 'cortante' };
  for (let i = 0; i < 60 && !s.terminado; i++) {
    const inimigo = s.atores.find((a) => !a.ehJogador && a.vida > 0 && !a.capturado);
    if (!inimigo) break;
    jogadorAtaca(C, c, inimigo.id);
  }
  const r = concluirBriga(C, c)!;
  ok(r.mortos.length === 1 && c.npcState[alvo.id]?.vivo === false, `${alvo.nome} morreu de verdade`);
  ok(!calcularContexto(C, c).presentes.some((n) => n.id === alvo.id), 'quem morreu sai da cena');
  ok(((c.reputacao as unknown as Record<string, number>).guarda ?? 0) <= guarda - 15, 'a guarda passa a odiar');
  ok(resto.every((t) => (c.npcState[t.id]?.eixos?.medo ?? 0) >= 25), 'quem viu fica com pavor');
  ok(/matou/.test(r.fato), 'o fato da cena diz quem morreu');
  const pacote = montarPacote(C, c, calcularContexto(C, c), 'Você olha em volta.') as { presentes?: { sabeDoQueVoceFez?: string[] }[] };
  ok(pacote.presentes?.length && pacote.presentes.every((pr) => pr.sabeDoQueVoceFez?.some((t) => /matou/.test(t))), 'quem está na cena sabe do sangue derramado (sabeDoQueVoceFez)');
}

{
  // Menor nunca entra em briga.
  const c = nova('menor');
  const ctx = calcularContexto(C, c);
  const alvo = ctx.presentes[0];
  c.npcState[alvo.id].idade = 12;
  ok(alvosDaBriga(C, c, [alvo.id]).length === 0, 'menor de idade não entra em briga');
  ok(!iniciarBriga(C, c, [alvo.id], true).ok, 'luta contra menor é recusada');
}

console.log('\nBriga na cena: OK.');
