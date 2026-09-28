// ARCANUM · Quem sabe o nome do jogador (engine/nomeDoJogador.ts).
// Caso real (sessão 87): a agiota Vess, que nunca o viu, disse "O que você
// trouxe, Kael…" na primeira cena.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { calcularContexto } from './availability';
import { montarPacote } from './llm';
import { sabeONome, disseONome, apresentar, protegerNome, DIAS_PARA_SABER_O_NOME } from './nomeDoJogador';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const c = criarCampanha(C, { nome: 'Kael', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida', seedString: 'nome', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
if (c.familia) c.familia.prologoConcluido = true;
c.localAtual = 'taverna';
const ctx = calcularContexto(C, c);
const estranha = ctx.presentes.find((n) => !n.parentesco && !n.id.startsWith('familia_'))!;
ok(estranha && !sabeONome(c, estranha), `${estranha.nome}, que nunca o viu, não sabe o nome`);
ok(sabeONome(c, { id: 'familia_pai', parentesco: 'pai' }), 'a família sabe o nome');

const pacote = montarPacote(C, c, ctx, 'x') as { presentes: { nome: string; sabeSeuNome: boolean }[] };
ok(pacote.presentes.find((p) => p.nome === estranha.nome)?.sabeSeuNome === false, 'o narrador recebe sabeSeuNome: false');

const primeiro = estranha.nome.split(',')[0];
const cena = `A agiota sorri.\n\n— [${primeiro}] O que você trouxe, Kael, não é só couro.\n\n— [você] Kael não deve nada a ninguém.`;
const limpo = protegerNome(cena, 'Kael', [estranha.nome]);
ok(limpo.includes(`— [${primeiro}] O que você trouxe, forasteiro,`), 'na boca de quem não sabe, o nome vira "forasteiro"');
ok(limpo.includes('— [você] Kael não deve'), 'a fala do próprio jogador fica como está');

ok(disseONome('Sou Kael, de Vaelhorn.', 'Kael') && !disseONome('Olho o fogo.', 'Kael'), 'reconhece quando ele diz o próprio nome');
apresentar(c, [estranha]);
ok(sabeONome(c, estranha) && protegerNome(cena, 'Kael', []).includes(', Kael,'), 'depois de ele se apresentar, ela sabe e pode dizer');

const c2 = criarCampanha(C, { nome: 'Kael', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida', seedString: 'nome2', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
c2.npcState[estranha.id] = { ...(c2.npcState[estranha.id] ?? {}), memoria: [{ turno: 0, resumo: 'conheceu', peso: 1, dia: c2.calendario.dia }] } as typeof c2.npcState[string];
c2.calendario.dia += DIAS_PARA_SABER_O_NOME;
ok(sabeONome(c2, estranha), `quem convive com ele há ${DIAS_PARA_SABER_O_NOME} dias já sabe`);
console.log('\nNome do jogador: OK.');
