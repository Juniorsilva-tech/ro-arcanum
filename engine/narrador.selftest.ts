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
import { montarMensagemNarracao, INSTRUCAO_SISTEMA, batidaDeCombate, ESTILO_PADRAO, detectarRecusa, foraDeContexto, semPensamento, limparNarracao, tipoDeCena } from './llm';
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
  const c = nova('conversa-comum');
  const m = montarMensagemNarracao(C, c, calcularContexto(C, c), pedido({
    fato: 'Você puxa conversa com a taverneira sobre o movimento da estrada.',
    verbo: { nome: 'conversar', categoria: 'social' } as ResultadoTurno['verbo'],
    acaoLivre: 'Quero saber se a estrada está segura.',
  }));
  ok(m.includes('DIRETRIZ DE CONVERSA COMUM'), 'conversa comum recebe uma diretriz própria');
  ok(m.includes('português brasileiro revisado') && m.includes('sem monólogo de lore'), 'conversa comum exige português natural e evita exposição');
  ok(m.includes('2 a 4 falas naturais'), 'conversa comum limita o diálogo a uma troca focada');
}
{
  // A aba Dizer ("Você diz: …") é conversa: antes a regex não reconhecia "diz".
  const c = nova('dizer-taverna');
  c.localAtual = 'taverna';
  const ctx = calcularContexto(C, c);
  const m = montarMensagemNarracao(C, c, ctx, pedido({ fato: 'Você diz: “Me vê uma cerveja.”', acaoLivre: 'Me vê uma cerveja.', tipoAcaoLivre: 'dizer' }));
  ok(ctx.presentes.length === 0 || m.includes('DIRETRIZ DE CONVERSA COMUM'), 'fala pela aba Dizer recebe a diretriz de conversa comum');
  ok(!m.includes('gore pesado'), 'cena comum não pede gore');
  ok(!INSTRUCAO_SISTEMA.includes('fábula sombria') && INSTRUCAO_SISTEMA.includes('O TOM CERTO, num exemplo'), 'sistema pede prosa clara e traz um exemplo de tom');
  ok(!INSTRUCAO_SISTEMA.includes('"pela peste", "pelos deuses", "maldito seja")'), 'sistema não manda mais encher a fala de pragas');
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
{
  // Caso real (Groq, gpt-oss-120b): recusa curta em inglês, com apóstrofo curvo,
  // era lida como "narra cena adulta ✓".
  const recusa = 'I’m sorry, but I can’t help with that.';
  ok(detectarRecusa(recusa) && foraDeContexto(recusa), 'recusa em inglês com apóstrofo curvo é recusa');
  const cena = 'O machado desce e abre o ventre do salteador. O sangue esguicha na lama, e ele cai de joelhos, as mãos tentando segurar o que escapa. Você puxa a lâmina de volta com um estalo úmido.';
  ok(!detectarRecusa(cena) && !foraDeContexto(cena), 'cena em português não é recusa');
}
// O narrador não pergunta ao jogador no fim; o personagem pode (sessão 80 cortava a fala).
ok(limparNarracao('A porta range. O que você fará?') === 'A porta range.', 'pergunta do narrador no fim sai');
ok(limparNarracao('A porta range.\n\n— [Guarda] O que você faz aqui?').endsWith('— [Guarda] O que você faz aqui?'), 'pergunta de personagem, em fala, fica');
ok(semPensamento('<think>devo narrar {isto}?</think>\n{"narracao":"x"}') ==='{"narracao":"x"}', 'raciocínio <think> sai antes de ler a cena');
ok(tipoDeCena({ fato: 'Você tenta o seguinte: beijo Elza e a levo para a cama' }) === 'adulto', 'cena íntima vai para quem narra adulto');
ok(tipoDeCena({ fato: 'A luta terminou.', batidasCombate: ['x acerta y'] }) === 'gore', 'fim de luta vai para quem narra gore');
ok(tipoDeCena({ fato: 'Você compra pão no mercado.' }) === 'comum', 'cena comum segue a ordem de sempre');
console.log('\nNarrador: OK.');
