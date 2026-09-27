// ARCANUM · O pedido ao narrador (engine/llm.ts, montarMensagemNarracao).
// O que estes testes seguram:
// - extensão, ritmo e menção à decisão chegam ao modelo como o jogador pediu;
// - a aba Dizer manda as palavras exatas como fala do jogador;
// - o fim de luta leva o log da engine como batidas numeradas, sem ruído;
// - capítulo pede fôlego e estrutura, sem fatos novos;
// - lembretes do jogador entram como memória, nunca como regra;
// - com menor na cena, a engine tira o corpo do pacote e proíbe teor sexual.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { calcularContexto } from './availability';
import { montarMensagemNarracao, batidaDeCombate, ESTILO_PADRAO } from './llm';
import { menoresNaCena } from './protecao';
import type { ResultadoTurno } from './turn';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed = 'narrador'): Campaign => {
  const c = criarCampanha(C, { nome: 'Torvald', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  c.personagem.idade = 20;
  return c;
};
const pedido = (extra: Partial<ResultadoTurno> = {}): ResultadoTurno =>
  ({ fato: 'Você observa o pátio.', custoPeriodos: 0, efeitosAplicados: [], ...extra }) as ResultadoTurno;

{
  const c = nova();
  const ctx = calcularContexto(C, c);
  const m = montarMensagemNarracao(C, c, ctx, pedido());
  ok(m.includes('EXTENSÃO: de 4 a 7 parágrafos.'), 'padrão: 4 a 7 parágrafos');
  ok(m.includes('Mostre a ação acontecendo'), 'padrão: a ação do jogador aparece na cena');
  const curta = montarMensagemNarracao(C, c, ctx, pedido(), { ...ESTILO_PADRAO, extensao: 'curta', ritmo: 'trama', mencao: 'direto' });
  ok(curta.includes('de 3 a 5') && curta.includes('RITMO: ande a trama') && curta.includes('não reconte a ação'), 'curta, trama rápida e direto à consequência');
  const longa = montarMensagemNarracao(C, c, ctx, pedido(), { ...ESTILO_PADRAO, extensao: 'longa', ritmo: 'atmosfera' });
  ok(longa.includes('de 8 a 12') && longa.includes('dê tempo à atmosfera'), 'longa com atmosfera');
}
{
  const c = nova('dizer');
  const m = montarMensagemNarracao(C, c, calcularContexto(C, c), pedido({ fato: 'Você diz: “Quem mandou você?”', acaoLivre: 'Quem mandou você?', tipoAcaoLivre: 'dizer' }));
  ok(m.includes('O JOGADOR DISSE, com estas palavras: "Quem mandou você?"') && m.includes('fala [você]'), 'Dizer: palavras exatas como fala [você]');
}
{
  const c = nova('luta');
  const log = [
    'O combate começa. Salteador contra você.',
    'Torvald acerta Salteador em cheio — 12 de dano cortante. [crítico]',
    '🔥 [Chamas Solares]: Salteador queima no fogo purificador (-4 PV)!',
    'Salteador ataca Torvald e erra.',
    'Você subiu para o nível 2.',
    'Vitória. 35 de experiência.',
  ];
  const m = montarMensagemNarracao(C, c, calcularContexto(C, c), pedido({ fato: 'A luta terminou e você ficou de pé.', batidasCombate: log }));
  ok(m.includes('1. Torvald acerta Salteador em cheio') && m.includes('3. Salteador ataca Torvald e erra.'), 'luta: log da engine vira batidas numeradas, na ordem');
  ok(!m.includes('🔥') && !m.includes('subiu para o nível') && !/\d\. Vitória/.test(m), 'luta: sem emoji nem linhas de sistema');
  ok(m.includes('DIRETRIZ DE COMBATE') && !m.includes('"cronica"'), 'luta: diretriz de combate e sem crônica do lugar');
  ok(batidaDeCombate('O combate começa. X.') === null, 'abertura do log não é batida');
}
{
  const c = nova('capitulo');
  const m = montarMensagemNarracao(C, c, calcularContexto(C, c), pedido({ fato: 'Você chegou a Halvet.', modoCena: 'capitulo' }));
  ok(m.includes('MODO CAPÍTULO') && m.includes('de 8 a 12') && m.includes('Nenhum fato novo'), 'capítulo: fôlego e estrutura, sem fatos novos');
}
{
  const c = nova('lembrete');
  c.lembretesNarrador = ['a cicatriz de Elza é na mão esquerda'];
  const m = montarMensagemNarracao(C, c, calcularContexto(C, c), pedido());
  ok(m.includes('- a cicatriz de Elza é na mão esquerda') && m.includes('o pacote vence'), 'lembrete entra como memória, com o pacote acima dele');
}
{
  const c = nova('menor');
  const ctx = calcularContexto(C, c);
  ok(menoresNaCena(c, ctx).length === 0 && !montarMensagemNarracao(C, c, ctx, pedido()).includes('RESTRIÇÃO DA ENGINE'), 'cena só de adultos: sem restrição');
  c.personagem.idade = 12;
  const m = montarMensagemNarracao(C, c, ctx, pedido());
  ok(m.includes('RESTRIÇÃO DA ENGINE') && m.includes('você (12 anos)') && !m.includes('volúpia'), 'jogador menor: restrição e nada de volúpia');
  c.personagem.idade = 20;
  const alguem = ctx.presentes[0];
  if (alguem) {
    c.npcState[alguem.id] = { ...(c.npcState[alguem.id] ?? {}), idade: 14 } as Campaign['npcState'][string];
    const m2 = montarMensagemNarracao(C, c, ctx, pedido());
    const pacote = JSON.parse(m2.slice(m2.indexOf('{'), m2.indexOf('\n\nATENÇÃO')));
    const pr = pacote.presentes.find((x: { nome: string }) => x.nome === alguem.nome);
    ok(m2.includes(`${alguem.nome} (14 anos)`) && pr && !('corpo' in pr), `presente menor (${alguem.nome}): restrição e corpo fora do pacote`);
  } else {
    console.log('· sem presentes no começo; teste de NPC menor pulado');
  }
}
console.log('\nNarrador: OK.');
