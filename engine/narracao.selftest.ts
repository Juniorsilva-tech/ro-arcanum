// ARCANUM · O texto que aparece na tela, e a história que continua.
//
// Dois defeitos relatados em jogo, na mesma sessão:
//
//  1. "só escreve a primeira palavra" — a narração aparecia truncada no painel
//     e congelava ali. Causa: o extrator do texto parcial parava na primeira
//     aspa não escapada, e modelo pequeno erra escape o tempo todo. Como ele
//     devolvia sempre o mesmo fragmento curto, a tela nunca mais atualizava.
//  2. "não segue a história que está posta" — o narrador recebia o ESTADO do
//     mundo e nenhuma linha do texto que ele mesmo tinha acabado de escrever.
//     Cada cena começava do zero. `camp.cronica` existia desde o começo e
//     ninguém escrevia nela.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { parcialNarracao } from './llm';
import { registrarNaCronica, MAX_CRONICA } from './memoria';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const nova = (): Campaign =>
  criarCampanha(C, {
    nome: 'Provadora', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida',
    seedString: 'narracao', marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });

/** Entrega a resposta em pedaços, como o SSE faz, e devolve o que a tela viu. */
function comoChegaNaTela(resposta: string, tamanhoDoPedaco = 5): string {
  let acumulado = '';
  let ultimo = '';
  for (let i = 0; i < resposta.length; i += tamanhoDoPedaco) {
    acumulado += resposta.slice(i, i + tamanhoDoPedaco);
    const p = parcialNarracao(acumulado);
    if (p) ultimo = p;
  }
  return ultimo;
}

// ── O texto não pode congelar no meio ─────────────────────────────────────
{
  const FRASE = 'A taverna cheira a cevada velha e Elza ergue os olhos do balcão.';

  const casos: [string, string][] = [
    ['JSON correto', `{"narracao": "${FRASE}"}`],
    // O caso que causou o defeito: modelo pequeno não escapa aspas.
    ['aspas não escapadas no meio', '{"narracao": "Ela diz "sim" e volta ao balcão, sem pressa."}'],
    ['cerca de markdown em volta', `\`\`\`json\n{"narracao": "${FRASE}"}\n\`\`\``],
    ['outro campo antes', `{"opcoes": [], "narracao": "${FRASE}"}`],
    ['chave acentuada', `{"narração": "${FRASE}"}`],
    ['prosa crua, sem JSON', FRASE],
  ];

  for (const [nome, resposta] of casos) {
    const visto = comoChegaNaTela(resposta);
    ok(visto.length >= 40, `${nome}: a tela recebe a cena inteira (${visto.length} chars)`);
    ok(!visto.includes('"narracao"'), `${nome}: e não recebe o JSON cru`);
  }

  // A regressão específica, nomeada: a frase com aspas tem de passar do ponto
  // onde o parser antigo parava.
  const comAspas = comoChegaNaTela('{"narracao": "Ela diz "sim" e volta ao balcão, sem pressa."}');
  ok(comAspas.includes('volta ao balcão'),
    `Aspas no meio não congelam mais a narração ("${comAspas.slice(0, 32)}…")`);
}

// ── O parcial cresce a cada pedaço, nunca encolhe ─────────────────────────
{
  const resposta = '{"narracao": "Primeira frase inteira aqui. Segunda frase vem logo depois. Terceira fecha."}';
  let acumulado = '';
  let anterior = '';
  let cresceu = 0;
  for (let i = 0; i < resposta.length; i += 4) {
    acumulado += resposta.slice(i, i + 4);
    const p = parcialNarracao(acumulado);
    if (!p) continue;
    ok(p.length >= anterior.length - 2, 'O texto parcial nunca encolhe de um pedaço para o outro');
    if (p.length > anterior.length) cresceu++;
    anterior = p;
  }
  ok(cresceu >= 8, `O texto cresce ao longo do stream (${cresceu} atualizações)`);
}

// ── Antes da narração começar, não há o que mostrar ───────────────────────
{
  ok(parcialNarracao('') === '', 'Nada acumulado, nada na tela');
  ok(parcialNarracao('{"narr') === '', 'JSON começando não vira texto na tela');
  ok(parcialNarracao('{"narracao": "') === '', 'Campo aberto e vazio não vira texto na tela');
}

// ── A crônica passa a existir de verdade ──────────────────────────────────
{
  const c = nova();
  ok(Array.isArray(c.cronica) && c.cronica.length === 0, 'A campanha nasce com crônica vazia');

  registrarNaCronica(c, 'A taverna cheira a cevada velha.');
  ok(c.cronica.length === 1, 'A narração entra na crônica');
  ok(c.cronica[0].tipo === 'narracao', 'E entra marcada como narração');
  ok(c.cronica[0].turno === c.turno, 'Com o turno em que aconteceu');

  registrarNaCronica(c, '   ');
  ok(c.cronica.length === 1, 'Texto vazio não entra');

  registrarNaCronica(c, 'A taverna cheira a cevada velha.');
  ok(c.cronica.length === 1, 'A mesma cena duas vezes seguidas não duplica');

  registrarNaCronica(c, 'Elza ergue os olhos do balcão.');
  ok(c.cronica.length === 2, 'Cena diferente entra normalmente');

  // Campanha de anos escreveria milhares de cenas, e o save inteiro passa por
  // JSON a cada gravação.
  for (let i = 0; i < MAX_CRONICA + 50; i++) registrarNaCronica(c, `cena número ${i}`);
  ok(c.cronica.length === MAX_CRONICA, `A crônica para em ${MAX_CRONICA} entradas`);
  ok(c.cronica[c.cronica.length - 1].texto.includes(`${MAX_CRONICA + 49}`),
    'E o que fica é o mais recente, não o mais antigo');
}

// ── O narrador recebe a cena anterior ─────────────────────────────────────
//
// É o que faltava para a história continuar. Sem isso o modelo reabria a cena
// a cada turno: reapresentava quem já estava ali e ignorava a conversa.
{
  const c = nova();
  registrarNaCronica(c, 'Primeira cena: você entra na taverna.');
  registrarNaCronica(c, 'Segunda cena: Elza serve o pão.');
  registrarNaCronica(c, 'Terceira cena: a mulher encapuzada levanta.');

  const anteriores = (c.cronica ?? [])
    .filter((x) => x.tipo === 'narracao')
    .slice(-2)
    .map((x) => x.texto);

  ok(anteriores.length === 2, 'O pacote leva as duas últimas cenas');
  ok(anteriores[1].includes('encapuzada'), 'A última é a mais recente');
  ok(anteriores[0].includes('pão'), 'E a penúltima dá o fio da conversa');
  ok(!anteriores.some((x) => x.includes('Primeira cena')), 'Cena antiga não entope o pacote');
}

console.log('\nNarração: o texto chega inteiro na tela, e a cena seguinte sabe da anterior.');
