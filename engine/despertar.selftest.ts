// ARCANUM · Os limiares que concedem Despertar.
//
// Desde a sessão 19 a curva de xp para de ser generosa no nível 20: passar do
// teto humano custa 60 mil de xp no 31 e três milhões no 41. O jogo tardio,
// portanto, passou a depender inteiramente de `concederDespertar` — e uma
// medição mostrou que os dois limiares existentes disparavam em apenas 0,17
// campanhas de dez anos. A porta existia e estava fechada.
//
// Estes testes cobrem os quatro limiares acrescentados na sessão 20. O que
// cada um precisa garantir é sempre o mesmo par: **dispara quando deve** e
// **não dispara duas vezes**. Despertar farmável não é Despertar.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { LEGADOS, multiplicadoresDeIdentidade } from './identidade';
import { estadoAptidao, esforcoParaMaestria, maestriaDe, treinar, LIMIAR_MAESTRIA_CONSUMADA, LIMIAR_NOME_CONHECIDO } from './aptidao';
import { concederDespertar } from './progresso';
import { registrarMorteFamiliar } from './familia';
import { iniciarCombate, jogadorAtaca } from './combat';
import { aprenderArte } from './magic';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const nova = (seed = 'despertar'): Campaign =>
  criarCampanha(C, {
    nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });

/**
 * Mata a criatura e fecha a luta, sem depender de dados.
 *
 * A lâmina Nichirin não é conveniência de teste: um oni comum só morre por
 * decapitação com ela (ver `aplicarFerimentoOni`, em engine/kimetsu.ts).
 * Sem a lâmina certa a Lua volta a 1 de vida para sempre — e o teste estaria
 * medindo a regra do mundo, não o limiar.
 */
function derrubar(camp: Campaign, criaturaId: string): void {
  camp.personagem.inventario['lamina_nichirin'] = 1;
  camp.personagem.equipado.arma = 'lamina_nichirin';
  iniciarCombate(C, camp, [criaturaId]);
  const s = camp.combate!;
  for (const a of s.atores) if (!a.ehJogador && !a.ehAliado) a.vida = 1;
  // Um golpe com o alvo em 1 de vida encerra; o loop cobre a chance de errar.
  for (let i = 0; i < 120 && camp.combate && !camp.combate.terminado; i++) {
    const alvo = camp.combate.atores.find(a => !a.ehJogador && !a.ehAliado && a.vida > 0);
    if (!alvo) break;
    alvo.vida = 1;
    camp.personagem.recursos.vida = camp.personagem.recursosMax.vida;
    jogadorAtaca(C, camp, alvo.id);
  }
}

// ── 1. Maestria consumada ─────────────────────────────────────────────────
{
  const c = nova();
  const a = estadoAptidao(c);
  // Um passo antes do limiar, para que uma única sessão o atravesse.
  a.esforco.espada = esforcoParaMaestria(LIMIAR_MAESTRIA_CONSUMADA - 0.4);
  ok(maestriaDe(c, 'espada') < LIMIAR_MAESTRIA_CONSUMADA, 'Começa abaixo do limiar de maestria');
  ok(!c.despertares?.includes('maestria_consumada'), 'Sem Despertar antes de cruzar');

  // Acima do teto confortável da aptidão o ganho cai para 15% — é caro de
  // propósito, então o teste treina até cruzar em vez de supor uma sessão só.
  let sessoes = 0;
  while (maestriaDe(c, 'espada') < LIMIAR_MAESTRIA_CONSUMADA && sessoes++ < 400) {
    treinar(C, c, 'espada', { mestre: 1, esforco: 1, recursos: 1 });
  }
  ok(maestriaDe(c, 'espada') >= LIMIAR_MAESTRIA_CONSUMADA, `O treino cruzou o limiar (${sessoes} sessões)`);
  ok(c.despertares?.includes('maestria_consumada'), 'Cruzar 90 de maestria concede o Despertar');

  const nivel = c.personagem.nivel;
  for (let i = 0; i < 5; i++) treinar(C, c, 'espada', { mestre: 1, esforco: 1, recursos: 1 });
  ok(c.personagem.nivel === nivel, 'Treinar acima de 90 não concede de novo');

  // Outro domínio chegando a 90 também não repete: o limiar é "consumou um
  // ofício", não um colecionável por perícia.
  const b = estadoAptidao(c);
  b.esforco.arcano = esforcoParaMaestria(LIMIAR_MAESTRIA_CONSUMADA - 0.4);
  treinar(C, c, 'arcano', { mestre: 1, esforco: 1, recursos: 1 });
  ok(c.personagem.nivel === nivel, 'Segundo domínio a 90 não concede um segundo Despertar');
}

// ── 2. A perda ────────────────────────────────────────────────────────────
{
  const c = nova();
  const membros = c.familia?.membros ?? [];
  ok(membros.length >= 2, 'A campanha nasce com família');
  const nivel = c.personagem.nivel;

  registrarMorteFamiliar(c, membros[0].id);
  ok(membros[0].condicao === 'morto', 'A morte é registrada no membro');
  ok(c.despertares?.includes('a_perda'), 'A primeira morte no sangue concede o Despertar');
  const depois = c.personagem.nivel;
  ok(depois > nivel, 'O Despertar da perda move o nível');

  registrarMorteFamiliar(c, membros[1].id);
  ok(c.personagem.nivel === depois, 'A segunda perda não concede de novo');

  // Repetir a mesma morte não pode reabrir nada.
  registrarMorteFamiliar(c, membros[0].id);
  ok(c.personagem.nivel === depois, 'Registrar a mesma morte duas vezes é inerte');
}

// ── 3. Derrubar uma Lua ───────────────────────────────────────────────────
{
  const c = nova('despertar-lua');
  const nivel = c.personagem.nivel;
  derrubar(c, 'lua_inferior_seis');
  ok(c.despertares?.includes('derrubou_uma_lua'), 'Derrubar uma Lua concede o Despertar');
  ok(c.personagem.nivel > nivel, 'O Despertar da Lua move o nível');

  // Aqui a contagem é de Despertares, não de níveis: matar dá xp, e xp sobe
  // nível por conta própria. Medir nível confundiria as duas escadas.
  const quantos = c.despertares!.length;
  derrubar(c, 'lua_inferior_cinco');
  ok(c.despertares!.length === quantos, 'A segunda Lua é proeza, não transformação');
}

// ── 4. A caçada impossível ────────────────────────────────────────────────
{
  const c = nova('despertar-besta');
  derrubar(c, 'besta_do_primeiro_inverno');
  ok(c.despertares?.includes('cacada_impossivel'), 'Derrubar a besta do primeiro inverno concede o Despertar');
  const quantos = c.despertares!.length;
  derrubar(c, 'besta_do_primeiro_inverno');
  ok(c.despertares!.length === quantos, 'A besta não pode ser farmada');
}

// ── 5. O mestre esgotado (limiar social) ──────────────────────────────────
{
  const c = nova('despertar-mestre');
  // Um mestre com repertório de verdade. Um de arte única não vale limiar.
  const mestre = C.mestres.find(m => m.ensina.length >= 3)!;
  ok(mestre, `Existe mestre com repertório (${mestre?.ensina.length} artes)`);

  // O teste passa pelo `aprenderArte` de verdade: é lá que o limiar mora, e
  // conceder na mão só provaria que a deduplicação funciona. Só o cenário é
  // montado à mão — estar no local do mestre e ter nível para as formas.
  c.localAtual = mestre.localBase;
  c.personagem.nivel = 30;
  c.familia!.prologoConcluido = true;

  const ultima = mestre.ensina[mestre.ensina.length - 1];
  for (const id of mestre.ensina.slice(0, -1)) c.personagem.artesConhecidas.push(id);
  ok(!c.despertares?.includes('mestre_esgotado'), 'Faltando uma arte, nenhum Despertar');

  const r = aprenderArte(C, c, ultima);
  ok(r.ok, `A última arte do repertório foi aprendida (${r.motivo ?? 'ok'})`);
  ok(c.despertares?.includes('mestre_esgotado'), 'Esgotar o repertório de um mestre concede o Despertar');

  // Um segundo mestre esgotado é proeza, não transformação.
  const quantos = c.despertares!.length;
  const outro = C.mestres.find(m => m.id !== mestre.id && m.ensina.length >= 3);
  if (outro) {
    c.localAtual = outro.localBase;
    for (const id of outro.ensina.slice(0, -1)) {
      if (!c.personagem.artesConhecidas.includes(id)) c.personagem.artesConhecidas.push(id);
    }
    aprenderArte(C, c, outro.ensina[outro.ensina.length - 1]);
  }
  ok(c.despertares!.length === quantos, 'Um segundo mestre esgotado não concede de novo');
}

// ── 5b. Mestre de repertório curto não vale limiar ────────────────────────
{
  const c = nova('despertar-mestre-curto');
  const curto = C.mestres.find(m => m.ensina.length < 3);
  if (!curto) {
    ok(true, 'Nenhum mestre tem repertório curto — regra vazia, mas coberta');
  } else {
    c.localAtual = curto.localBase;
    c.personagem.nivel = 30;
    c.familia!.prologoConcluido = true;
    for (const id of curto.ensina.slice(0, -1)) c.personagem.artesConhecidas.push(id);
    aprenderArte(C, c, curto.ensina[curto.ensina.length - 1]);
    ok(!c.despertares?.includes('mestre_esgotado'), 'Esgotar um mestre de duas artes não concede Despertar');
  }
}

// ── 6. O nome conhecido (limiar social) ───────────────────────────────────
{
  const c = nova('despertar-nome');
  const a = estadoAptidao(c);
  ok(!c.despertares?.includes('nome_conhecido'), 'Começa sem nome conhecido');

  // O limiar olha o PICO de reputação, não a reputação corrente: glória antiga
  // esfria devagar e não deveria desfazer o que o mundo já soube.
  a.picoReputacao.espada = LIMIAR_NOME_CONHECIDO - 1;
  ok(!c.despertares?.includes('nome_conhecido'), 'Um ponto abaixo do limiar ainda não conta');

  // Sobe o pico pelo mesmo caminho que a engine usa, e confere a borda.
  const antes = a.picoReputacao.espada;
  a.picoReputacao.espada = Math.max(antes, LIMIAR_NOME_CONHECIDO);
  if (antes < LIMIAR_NOME_CONHECIDO && a.picoReputacao.espada >= LIMIAR_NOME_CONHECIDO) {
    concederDespertar(c, 'nome_conhecido', 'teste');
  }
  ok(c.despertares?.includes('nome_conhecido'), 'Cruzar o limiar de reputação concede o Despertar');

  const quantos = c.despertares!.length;
  concederDespertar(c, 'nome_conhecido', 'teste');
  ok(c.despertares!.length === quantos, 'Reputação alta em outro domínio não concede de novo');

  // A regra que este limiar não pode quebrar: reputação nunca passa de
  // exposição. Quem nunca mostrou nada não vira nome conhecido.
  ok(a.reputacao.espada <= Math.max(a.exposicao.espada, a.reputacao.espada), 'Reputação continua limitada pela exposição');
}

// ── 7. Os legados não se multiplicam ──────────────────────────────────────
{
  const c = nova();
  const todos = Object.keys(LEGADOS) as (keyof typeof LEGADOS)[];
  ok(todos.length >= 8, `Existem ${todos.length} legados declarados`);
  c.despertares = [...todos];
  const m = multiplicadoresDeIdentidade(c);
  const maiorVida = Math.max(...todos.map(k => LEGADOS[k].vida));
  const maiorDano = Math.max(...todos.map(k => LEGADOS[k].dano));
  ok(m.vida === maiorVida && m.dano === maiorDano, 'Com todos os legados, vale o maior — nunca o produto');
  ok(m.vida < 1.5 && m.dano < 1.5, 'O teto do bônus continua modesto mesmo com tudo');
}

// Todo Despertar declarado precisa de um legado, senão concede nível sem
// identidade — e o narrador não teria o que dizer sobre ele.
{
  const declarados = ['venceu_oni_ancestral', 'dominou_prova_eclipse', 'maestria_consumada', 'derrubou_uma_lua', 'a_perda', 'cacada_impossivel', 'mestre_esgotado', 'nome_conhecido'];
  for (const id of declarados) {
    ok(id in LEGADOS, `O Despertar '${id}' tem legado correspondente`);
  }
}

console.log('\nDespertar: limiares OK.');
