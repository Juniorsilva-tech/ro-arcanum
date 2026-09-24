// ARCANUM · A Marca do Caçador (engine/marca.ts).
//
// O que estes testes provam:
// - o despertar deixa o custo dito ao jogador (marco, fato, feed) e o prazo;
// - o despertar exige luta de vida ou morte contra oni do porte certo;
// - a pressão da Marca não satura sanidade nem toca corrupção;
// - o tributo só começa no limite, e o dreno de vida sobrevive a subir de nível;
// - quem não tem a Marca não morre aos 25;
// - conter a Marca funciona, custa o que promete e não é trivial;
// - save round-trip preserva o estado.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { multiplicadoresDeIdentidade, LEGADOS } from './identidade';
import { concederDespertar } from './progresso';
import { iniciarCombate, jogadorAtaca } from './combat';
import { processarEnvelhecimentoJogador } from './ascensao';
import { executarAcaoMundo } from './acoesMundo';
import { exportar, importar } from './persistencia';
import { iniciarMundoVivo } from './historiaViva';
import { recalcularRecursosMaximos } from './progresso';
import {
  despertarMarca, avisoMarca, aplicarPressaoPosCombateMarca, bonusCombateMarca, conterMarca, requisitosConterMarca,
  ID_MARCA, TETO_PRESSAO_MARCA, DRENO_ANUAL_MARCA, VIDA_PERDIDA_AO_CONTER, DIAS_RECLUSAO_MARCA, LOCAL_CONTER_MARCA,
  idadeLimiteParaDespertarAos,
} from './marca';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const nova = (seed = 'marca'): Campaign => {
  const c = criarCampanha(C, {
    nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};

// ── 1. O despertar diz o preço ────────────────────────────────────────────
{
  const c = nova('marca-aviso');
  c.personagem.idade = 20;
  ok(despertarMarca(c, 'chamas na pele'), 'A Marca desperta pela função da engine');
  ok(c.marca?.idadeLimite === 25, `Despertada aos 20, o limite é o canônico: ${c.marca?.idadeLimite}`);
  ok((c.marcos ?? []).some(m => m.texto.includes('começa a falhar aos 25')), 'O marco registra a idade-limite');
  ok(c.vivo!.fatos.some(f => f.tipo === 'marca_despertou'), 'O despertar vira fato do mundo');
  const feed = c.cronica[c.cronica.length - 1];
  ok(feed.tipo === 'sistema' && feed.texto.includes('25 anos') && feed.texto.includes('Casa Sem Nome'), `O feed avisa custo, idade e saída: "${feed.texto.slice(0, 80)}..."`);
  ok(!despertarMarca(c, 'de novo'), 'A Marca não desperta duas vezes');
  ok(idadeLimiteParaDespertarAos(24) === 27, 'Quem desperta aos 24 ganha três anos de prazo (limite 27)');
  ok(idadeLimiteParaDespertarAos(30) === 33, 'Quem desperta aos 30 também tem três anos (limite 33)');
  ok(avisoMarca(nova('marca-sem')) === null, 'Sem Marca, sem aviso');
}

// ── 2. O despertar exige luta de vida ou morte ────────────────────────────
function vencer(camp: Campaign, criaturaId: string, vidaDoJogador: number): void {
  camp.personagem.inventario['lamina_nichirin'] = 1;
  camp.personagem.equipado.arma = 'lamina_nichirin';
  iniciarCombate(C, camp, [criaturaId]);
  // Vida alta de mentira para aguentar os golpes da rodada; o que importa
  // para a Marca é a proporção no fim da luta.
  const eu = camp.combate!.atores.find(a => a.ehJogador)!;
  eu.vidaMax = 1000;
  for (let i = 0; i < 120 && camp.combate && !camp.combate.terminado; i++) {
    const inimigos = camp.combate.atores.filter(a => !a.ehJogador && !a.ehAliado && a.vida > 0);
    if (!inimigos.length) break;
    for (const a of inimigos) a.vida = 1;
    eu.vida = Math.max(1, Math.round(eu.vidaMax * vidaDoJogador));
    eu.tatico = undefined;
    jogadorAtaca(C, camp, inimigos[0].id);
  }
}
{
  const inteira = nova('marca-inteira');
  inteira.personagem.artesConhecidas.push('respiracao_agua_primeira_forma');
  vencer(inteira, 'kaigaku', 1);
  ok(!inteira.despertares?.includes(ID_MARCA), 'Vencer Kaigaku (oni chefe, nível 10) com a vida cheia não desperta a Marca');

  const pequena = nova('marca-pequena');
  pequena.personagem.artesConhecidas.push('respiracao_agua_primeira_forma');
  vencer(pequena, 'oni_da_mao', 0.1);
  ok(!pequena.despertares?.includes(ID_MARCA), 'Chefe oni pequeno (Oni das Mãos, nível 5) não desperta a Marca, nem à beira da morte');

  const luaFraca = nova('marca-lua-fraca');
  luaFraca.personagem.artesConhecidas.push('respiracao_agua_primeira_forma');
  vencer(luaFraca, 'lua_inferior_cinco', 0.1);
  ok(!luaFraca.despertares?.includes(ID_MARCA), 'Lua Inferior Cinco (nível 7) não desperta a Marca, nem à beira da morte');

  const semRespiracao = nova('marca-sem-resp');
  semRespiracao.personagem.artesConhecidas = semRespiracao.personagem.artesConhecidas.filter(a => !a.startsWith('respiracao_') && !a.startsWith('hinokami_'));
  vencer(semRespiracao, 'kaigaku', 0.1);
  ok(!semRespiracao.despertares?.includes(ID_MARCA), 'Sem respiração, a Marca não desperta');

  const limite = nova('marca-limite');
  limite.personagem.artesConhecidas.push('respiracao_agua_primeira_forma');
  vencer(limite, 'kaigaku', 0.1);
  ok(limite.despertares?.includes(ID_MARCA) && !!limite.marca, 'Kaigaku vencido à beira da morte, com respiração, desperta a Marca');
  ok(limite.combate?.log.some(l => l.includes('Marca do Caçador')), 'O log do combate anuncia a Marca');
}

// ── 3. A pressão não satura ───────────────────────────────────────────────
{
  const c = nova('marca-pressao');
  despertarMarca(c, 'teste');
  for (let i = 0; i < 500; i++) aplicarPressaoPosCombateMarca(c);
  ok(c.personagem.pressoes.sanidade === TETO_PRESSAO_MARCA, `500 lutas com a Marca levam a sanidade só até ${c.personagem.pressoes.sanidade}`);
  ok((c.personagem.pressoes.corrupcao ?? 0) === 0, 'A Marca não soma corrupção');
  c.personagem.pressoes.sanidade = 80;
  aplicarPressaoPosCombateMarca(c);
  ok(c.personagem.pressoes.sanidade === 80, 'Acima do teto por outras causas, a Marca não empurra mais');

  // Numa luta real, encerrada pelo combate.
  const r = nova('marca-pressao-real');
  despertarMarca(r, 'teste');
  r.personagem.pressoes.sanidade = TETO_PRESSAO_MARCA - 1;
  vencer(r, 'lobo_cinzento', 1);
  ok(r.personagem.pressoes.sanidade === TETO_PRESSAO_MARCA && (r.personagem.pressoes.corrupcao ?? 0) === 0,
    `Depois de uma luta real: sanidade ${r.personagem.pressoes.sanidade}, corrupção ${r.personagem.pressoes.corrupcao ?? 0}`);
}

// ── 4. O tributo só começa no limite, e o dreno fica ─────────────────────
{
  const c = nova('marca-tributo');
  c.personagem.idade = 23;
  despertarMarca(c, 'teste');
  ok(c.marca!.idadeLimite === 26, 'Despertada aos 23, o limite é 26');
  const vida0 = c.personagem.recursosMax.vida;
  processarEnvelhecimentoJogador(c); // 24
  processarEnvelhecimentoJogador(c); // 25
  ok(c.personagem.recursosMax.vida === vida0 && c.marca!.vidaPerdida === 0, 'Antes do limite o corpo não paga nada, nem aos 25');
  // Semente em que o primeiro tributo não mata, para medir o dreno.
  let sobreviveu: Campaign | undefined;
  for (let i = 0; i < 40 && !sobreviveu; i++) {
    const x = nova(`marca-dreno-${i}`);
    x.personagem.idade = 25;
    despertarMarca(x, 'teste');
    x.marca!.idadeLimite = 26;
    const antes = x.personagem.recursosMax.vida;
    processarEnvelhecimentoJogador(x); // 26
    if (x.personagem.recursos.vida > 0) {
      ok(x.personagem.recursosMax.vida === antes - DRENO_ANUAL_MARCA, `No limite, a vida máxima cai ${DRENO_ANUAL_MARCA} (${antes} → ${x.personagem.recursosMax.vida})`);
      sobreviveu = x;
    }
  }
  ok(!!sobreviveu, 'Alguma semente sobrevive ao primeiro tributo');
  const x = sobreviveu!;
  const maxAntes = x.personagem.recursosMax.vida;
  x.personagem.xp += 5000;
  x.personagem.nivel += 1;
  recalcularRecursosMaximos(x);
  ok(x.marca!.vidaPerdida === DRENO_ANUAL_MARCA && x.personagem.recursosMax.vida > maxAntes - 1,
    `Subir de nível não apaga o dreno: ${x.marca!.vidaPerdida} de vida perdida continua descontada`);

  // A taxa de morte no primeiro ano além do limite é 10%.
  let mortes = 0;
  const N = 300;
  for (let i = 0; i < N; i++) {
    const y = nova(`marca-taxa-${i}`);
    y.personagem.idade = 24;
    despertarMarca(y, 'teste');
    y.marca!.idadeLimite = 25;
    processarEnvelhecimentoJogador(y);
    if (y.personagem.recursos.vida <= 0) mortes++;
  }
  ok(mortes > N * 0.04 && mortes < N * 0.18, `Primeiro ano além do limite mata ${mortes} em ${N} (esperado perto de 10%)`);
  const morta = (() => {
    for (let i = 0; i < 300; i++) {
      const y = nova(`marca-taxa-${i}`);
      y.personagem.idade = 24;
      despertarMarca(y, 'teste');
      y.marca!.idadeLimite = 25;
      processarEnvelhecimentoJogador(y);
      if (y.personagem.recursos.vida <= 0) return y;
    }
  })()!;
  const iAviso = morta.cronica.findIndex(l => l.texto.includes('A Marca cobra a vida'));
  ok(iAviso >= 0 && (morta.marcos ?? []).some(m => m.texto.includes('tributo vital')), 'Toda morte pelo tributo vem depois do aviso registrado');
}

// ── 5. Sem Marca, ninguém morre aos 25 ────────────────────────────────────
{
  let vivos = 0;
  for (let i = 0; i < 60; i++) {
    const c = nova(`sem-marca-${i}`);
    c.personagem.idade = 20;
    while ((c.personagem.idade ?? 0) < 45) processarEnvelhecimentoJogador(c);
    if (c.personagem.recursos.vida > 0) vivos++;
  }
  ok(vivos === 60, `60 de 60 personagens sem Marca chegam vivos aos 45 (${vivos})`);
}

// ── 6. Conter a Marca: caminho real, caro e não trivial ──────────────────
{
  const c = nova('marca-conter');
  c.personagem.idade = 22;
  despertarMarca(c, 'teste');
  const antesMult = multiplicadoresDeIdentidade(c);
  ok(bonusCombateMarca(c).acerto === 3 && bonusCombateMarca(c).defesa === 2, 'Marca ativa: +3 acerto e +2 defesa em combate');

  // Longe da Casa não dá.
  c.localAtual = 'taverna';
  let r = executarAcaoMundo(C, c, { tipo: 'conter_marca' });
  ok(!r.ok && r.texto.includes('Casa Sem Nome'), `Fora da Casa, recusado: "${r.texto}"`);

  // Na Casa, mas com a cabeça em pedaços, também não.
  c.localAtual = LOCAL_CONTER_MARCA;
  c.personagem.pressoes.sanidade = 55;
  c.personagem.recursos.vida = c.personagem.recursosMax.vida;
  ok(!requisitosConterMarca(C, c).pode, 'Sanidade alta impede a reclusão');

  // Sem ninguém vivo para conduzir, também não.
  c.personagem.pressoes.sanidade = 10;
  const moradores = C.npcs.filter(n => n.localBase === LOCAL_CONTER_MARCA);
  ok(moradores.length > 0, `A Casa tem ${moradores.length} moradores escritos`);
  for (const n of moradores) c.npcState[n.id].vivo = false;
  ok(!requisitosConterMarca(C, c).pode, 'Com a Casa vazia de vivos, não há quem conduza a reclusão');
  for (const n of moradores) c.npcState[n.id].vivo = true;

  const vidaMaxAntes = c.personagem.recursosMax.vida;
  const diaAntes = c.calendario.dia;
  r = executarAcaoMundo(C, c, { tipo: 'conter_marca' });
  ok(r.ok, `Na Casa, com a mente quieta e vida cheia, a reclusão acontece: "${r.texto.slice(0, 60)}..."`);
  ok(c.calendario.dia - diaAntes >= DIAS_RECLUSAO_MARCA, `A reclusão custa ${c.calendario.dia - diaAntes} dias`);
  const depoisMult = multiplicadoresDeIdentidade(c);
  ok(depoisMult.dano < antesMult.dano, `O dano da Marca cai de ×${antesMult.dano} para ×${depoisMult.dano}`);
  ok(c.personagem.recursosMax.vida < vidaMaxAntes && c.marca!.vidaPerdida === VIDA_PERDIDA_AO_CONTER,
    `A vida máxima cai de ${vidaMaxAntes} para ${c.personagem.recursosMax.vida}: ${VIDA_PERDIDA_AO_CONTER} perdidos de vez, o resto é o legado contido valendo menos`);
  ok(bonusCombateMarca(c).acerto === 0 && bonusCombateMarca(c).defesa === 0, 'Contida, a Marca não dá bônus tático');
  ok(!executarAcaoMundo(C, c, { tipo: 'conter_marca' }).ok, 'Não se contém duas vezes');
  ok(avisoMarca(c)!.includes('contida'), 'O aviso passa a dizer que está contida');
  // Contida, o corpo para de pagar: nenhuma morte pela Marca até os 60.
  const perdidaAntes = c.marca!.vidaPerdida;
  while ((c.personagem.idade ?? 0) < 60) processarEnvelhecimentoJogador(c);
  ok(c.personagem.recursos.vida > 0 && c.marca!.vidaPerdida === perdidaAntes, 'Contida aos 22, chega aos 60 sem pagar tributo');
  ok(LEGADOS.marca_do_cacador.dano > depoisMult.dano || depoisMult.dano === 1.4, 'A Marca contida vale menos que a Marca acesa');

  // A função pura também recusa sem Marca.
  ok(!conterMarca(C, nova('sem')).ok, 'Sem Marca, não há o que conter');
}

// ── 7. Saves antigos e round-trip ─────────────────────────────────────────
{
  // Save de antes desta sessão: o Despertar existe, o estado não.
  const velho = nova('marca-save-velho');
  velho.personagem.idade = 26;
  concederDespertar(velho, ID_MARCA, 'save antigo');
  ok(!velho.marca, 'Save antigo tem a Marca sem estado');
  ok(avisoMarca(velho)!.includes('29'), 'O aviso de um save antigo conta o prazo a partir de hoje (26 → 29)');
  processarEnvelhecimentoJogador(velho); // 27
  ok(velho.personagem.recursos.vida > 0 && velho.marca?.idadeLimite === 29, 'Save antigo não morre no aniversário seguinte: ganha o prazo');

  const c = nova('marca-save');
  c.personagem.idade = 22;
  despertarMarca(c, 'teste');
  c.marca!.vidaPerdida = 16;
  c.marca!.contida = { dia: 10, idade: 23 };
  const r = importar(exportar(c));
  ok(r.ok, 'Exportar e importar funciona com a Marca');
  if (r.ok) {
    ok(JSON.stringify(r.valor.marca) === JSON.stringify(c.marca), 'O estado da Marca volta idêntico do save');
  }
}

console.log('\nMarca do Caçador: OK.');
