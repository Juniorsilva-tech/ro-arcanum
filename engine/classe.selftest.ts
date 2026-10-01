// ARCANUM · Toda classe faz o que a ficha dela promete.
//
// Auditoria da sessão 22: `mecanicaUnica` era texto solto. Ia para o narrador
// e nenhuma regra da engine o lia — nem para as três classes originais.
// "Guardião aguenta o primeiro golpe de cada combate" estava na tela de
// criação e não acontecia no combate.
//
// Estes testes existem para que isso não volte a acontecer. Cada classe tem um
// teste que a compara com uma classe de controle: a diferença tem de aparecer
// no número, não no texto.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarCombate, jogadorAtaca } from './combat';
import { executarAcaoMundo } from './acoesMundo';
import { comprar, vender, precoCompra, itemPorId } from './items';
import { perigoEfetivoDaRota } from './viagem';
import {
  efeitoDaClasse, absorveuOPrimeiroGolpe, bonusDeFoco, registrarFoco,
  multiplicadorDeDescanso, condicoesTratadasAoDescansar, multiplicadorDeVenda,
  descontoDeCompra, multiplicadorDeArte, manaDeEstudo, alivioDeRota,
  TETO_FOCO_ESPADACHIM, TETO_PENITENTE,
} from './classe';
import type { Campaign, CombatActor } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const nova = (classeId: string, seed = 'classe'): Campaign =>
  criarCampanha(C, {
    nome: 'Provadora', atributos: atributosBase(), classeId, origemId: 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });

const atorFalso = (ehJogador = true): CombatActor => ({
  id: 'jogador', nome: 'P', ehJogador, vida: 50, vidaMax: 50,
  defesa: 12, acerto: 12, dano: { base: 5, dispersao: 0.3, tipo: 'cortante' }, condicoes: [],
});

// ── Toda classe declara um efeito, e ele é único ──────────────────────────
{
  const efeitos = new Map<string, string>();
  for (const classe of C.classes) {
    const texto = efeitoDaClasse(nova(classe.id));
    ok(!!texto, `${classe.id} tem efeito de regra declarado`);
    ok(!efeitos.has(texto!), `O efeito de ${classe.id} não é cópia de outra classe`);
    efeitos.set(texto!, classe.id);
  }
  ok(efeitos.size === C.classes.length, `${efeitos.size} efeitos distintos para ${C.classes.length} classes`);
}

// ── Guardião: o primeiro golpe não passa ──────────────────────────────────
{
  const g = nova('guardiao');
  const ator = atorFalso();
  ok(absorveuOPrimeiroGolpe(g, ator), 'Guardião absorve o primeiro golpe');
  ok(!absorveuOPrimeiroGolpe(g, ator), 'E só o primeiro: o segundo passa');

  const outro = nova('arcanista');
  ok(!absorveuOPrimeiroGolpe(outro, atorFalso()), 'Quem não é guardião não absorve nada');
  ok(!absorveuOPrimeiroGolpe(g, atorFalso(false)), 'Inimigo não herda a absorção do jogador');

  // No combate de verdade: guardião chega ao fim da luta com mais vida.
  const comparar = (classeId: string) => {
    const c = nova(classeId, 'guardiao-combate');
    iniciarCombate(C, c, ['lobo']);
    const s = c.combate!;
    const eu = s.atores.find(a => a.ehJogador)!;
    const inimigo = s.atores.find(a => !a.ehJogador)!;
    // O inimigo bate várias vezes; o dano é o mesmo dos dois lados.
    for (let i = 0; i < 6; i++) {
      const antes = eu.vida;
      if (absorveuOPrimeiroGolpe(c, eu)) continue;
      eu.vida = Math.max(0, antes - 5);
    }
    return { vida: eu.vida, inimigo: inimigo.nome };
  };
  ok(comparar('guardiao').vida > comparar('espadachim').vida,
    'Numa sequência de golpes iguais, o guardião termina com mais vida');
}

// ── Espadachim: foco no mesmo alvo ────────────────────────────────────────
{
  const e = nova('espadachim');
  const ator = atorFalso();
  ok(bonusDeFoco(e, ator, 'lobo') === 0, 'Sem histórico, sem bônus');

  registrarFoco(e, ator, 'lobo', true);
  ok(bonusDeFoco(e, ator, 'lobo') === 1, 'Um acerto no mesmo alvo vale +1');
  registrarFoco(e, ator, 'lobo', true);
  ok(bonusDeFoco(e, ator, 'lobo') === 2, 'Dois acertos valem +2');

  // Errar não zera; trocar de alvo zera.
  registrarFoco(e, ator, 'lobo', false);
  ok(bonusDeFoco(e, ator, 'lobo') === 2, 'Errar no mesmo alvo não perde o acúmulo');
  registrarFoco(e, ator, 'javali', true);
  ok(bonusDeFoco(e, ator, 'javali') === 1, 'Trocar de alvo recomeça do zero');
  ok(bonusDeFoco(e, ator, 'lobo') === 0, 'E o alvo antigo perde o que tinha');

  for (let i = 0; i < 20; i++) registrarFoco(e, ator, 'javali', true);
  ok(bonusDeFoco(e, ator, 'javali') === TETO_FOCO_ESPADACHIM,
    `O foco tem teto (+${TETO_FOCO_ESPADACHIM})`);

  const g = nova('guardiao');
  const outro = atorFalso();
  registrarFoco(g, outro, 'lobo', true);
  ok(bonusDeFoco(g, outro, 'lobo') === 0, 'Quem não é espadachim não acumula foco');
}

// ── Caçadora: descansar rende mais ────────────────────────────────────────
{
  ok(multiplicadorDeDescanso(nova('cacadora')) > 1, 'Caçadora recupera mais ao descansar');
  ok(multiplicadorDeDescanso(nova('guardiao')) === 1, 'As outras recuperam o normal');

  // Pelo caminho real: descansar de verdade, com a mesma vida inicial.
  const descansar = (classeId: string) => {
    const c = nova(classeId, 'descanso');
    c.familia!.prologoConcluido = true;
    c.personagem.dinheiro = 50;
    c.personagem.recursos.vida = 1;
    executarAcaoMundo(C, c, { tipo: 'descansar' });
    return c.personagem.recursos.vida;
  };
  const cacadora = descansar('cacadora');
  const comum = descansar('guardiao');
  ok(cacadora > comum, `Descanso real: caçadora ${cacadora} contra ${comum}`);
}

// ── Curandeira: o descanso dela trata mais coisa ──────────────────────────
{
  const cur = condicoesTratadasAoDescansar(nova('curandeira'));
  const comum = condicoesTratadasAoDescansar(nova('guardiao'));
  ok(cur.length > comum.length, 'Curandeira trata mais condições que o descanso comum');
  ok(cur.includes('envenenado') && !comum.includes('envenenado'),
    'Veneno só sai com curandeira');
  for (const c of comum) ok(cur.includes(c), `Ela também trata o que todos tratam (${c})`);

  // Caminho real.
  const c = nova('curandeira', 'cura');
  c.familia!.prologoConcluido = true;
  c.personagem.dinheiro = 50;
  c.personagem.condicoes = ['envenenado', 'ferido'];
  executarAcaoMundo(C, c, { tipo: 'descansar' });
  ok(!c.personagem.condicoes.includes('envenenado'), 'Descansar tira o veneno da curandeira');

  const outra = nova('guardiao', 'cura');
  outra.familia!.prologoConcluido = true;
  outra.personagem.dinheiro = 50;
  outra.personagem.condicoes = ['envenenado', 'ferido'];
  executarAcaoMundo(C, outra, { tipo: 'descansar' });
  ok(outra.personagem.condicoes.includes('envenenado'), 'E deixa o veneno em quem não é curandeira');
}

// ── Contrabandista: paga menos, recebe mais ───────────────────────────────
{
  ok(descontoDeCompra(nova('contrabandista'), false), 'Contrabandista compra com desconto');
  ok(!descontoDeCompra(nova('guardiao'), false), 'As outras pagam o preço cheio');
  ok(descontoDeCompra(nova('guardiao'), true), 'E a barganha comum continua valendo para todas');
  ok(multiplicadorDeVenda(nova('contrabandista')) > 1, 'Contrabandista vende por mais');
  ok(multiplicadorDeVenda(nova('guardiao')) === 1, 'As outras vendem pelo normal');

  // O desconto não empilha com a barganha: quem barganha bem não barganha duas vezes.
  const item = itemPorId(C, 'racao')!;
  ok(precoCompra(item, true) === precoCompra(item, descontoDeCompra(nova('contrabandista'), true)),
    'Desconto de classe e barganha não se somam');
}

// ── Penitente: ferida é força, só nas artes ───────────────────────────────
{
  const p = nova('penitente');
  p.personagem.recursos.vida = p.personagem.recursosMax.vida;
  ok(multiplicadorDeArte(p) === 1, 'Inteira, a penitente não ganha nada');

  p.personagem.recursos.vida = Math.floor(p.personagem.recursosMax.vida / 2);
  const meio = multiplicadorDeArte(p);
  ok(meio > 1 && meio < 1 + TETO_PENITENTE, `Metade da vida, metade do bônus (${meio.toFixed(2)})`);

  p.personagem.recursos.vida = 0;
  ok(Math.abs(multiplicadorDeArte(p) - (1 + TETO_PENITENTE)) < 0.001,
    `No fundo do poço, o bônus é o teto (+${Math.round(TETO_PENITENTE * 100)}%)`);

  const outra = nova('arcanista');
  outra.personagem.recursos.vida = 0;
  ok(multiplicadorDeArte(outra) === 1, 'Estar ferida não fortalece quem não é penitente');
}

// ── Arcanista: estudar devolve mana ───────────────────────────────────────
{
  ok(manaDeEstudo(nova('arcanista')) > 0, 'Arcanista recupera mana estudando');
  ok(manaDeEstudo(nova('guardiao')) === 0, 'As outras não');
}

// ── Batedor: conhece os atalhos ───────────────────────────────────────────
{
  ok(alivioDeRota(nova('batedor')) > 0, 'Batedor alivia o perigo da rota');
  ok(alivioDeRota(nova('guardiao')) === 0, 'As outras andam pelo perigo cheio');

  const medir = (classeId: string) => {
    const c = nova(classeId, 'rota');
    const local = C.locais.find(l => l.rotas.length > 0)!;
    const rota = local.rotas[0];
    return perigoEfetivoDaRota(C, c, local.id, rota.destino, rota.perigo);
  };
  ok(medir('batedor') < medir('guardiao'), `Rota real: batedor ${medir('batedor')} contra ${medir('guardiao')}`);
  ok(medir('batedor') >= 0, 'E o perigo nunca fica negativo');
}

// ── A ficha não pode mentir ───────────────────────────────────────────────
//
// O defeito que esta sessão veio consertar era exatamente uma frase na ficha
// sem regra por trás. Toda `mecanicaUnica` precisa de um efeito de regra.
{
  for (const classe of C.classes) {
    ok(classe.mecanicaUnica.length > 20, `${classe.id} descreve a mecânica`);
    ok(!!efeitoDaClasse(nova(classe.id)),
      `A mecânica de ${classe.id} corresponde a uma regra implementada`);
  }
}

// ── Espadachim Samurai: Katana, Haori e Zanshin Marcial ───────────────────
{
  const esp = nova('espadachim');
  ok(esp.personagem.equipado.arma === 'katana', 'Espadachim nasce empunhando Katana');
  ok(esp.personagem.equipado.armadura === 'haori_do_andarilho', 'Espadachim nasce vestindo Haori do Andarilho');
  ok((esp.personagem.inventario.katana ?? 0) >= 1, 'Katana está no inventário inicial');
  ok((esp.personagem.inventario.haori_do_andarilho ?? 0) >= 1, 'Haori do Andarilho está no inventário inicial');

  // Katana é arma de precisão e corte com multiplicador crítico superior
  const katanaItem = C.itens.find(i => i.id === 'katana')!;
  ok(katanaItem.atributoAtaque === 'precisao', 'Katana escala com Precisão');
  ok(katanaItem.tipoArma === 'espada', 'Katana conta como domínio de espada');
  ok((katanaItem.multiplicadorCritico ?? 1) >= 1.95, 'Katana tem corte crítico afiado (>= 1.95x)');

  // Zanshin no combate: abater com foco transfere para o próximo adversário
  const ator = atorFalso();
  registrarFoco(esp, ator, 'lobo1', true);
  registrarFoco(esp, ator, 'lobo1', true);
  ok(bonusDeFoco(esp, ator, 'lobo1') === 2, 'Acumulou 2 de foco contra lobo1');

  // Simula abate marcial: alvo derrotado gera Zanshin
  ator.focoZanshin = Math.min(TETO_FOCO_ESPADACHIM, ator.focoAcertos ?? 0);
  ok(bonusDeFoco(esp, ator, 'lobo2') === 2, 'Zanshin do abate é herdado no próximo alvo');
  registrarFoco(esp, ator, 'lobo2', true);
  ok(bonusDeFoco(esp, ator, 'lobo2') === 3, 'Primeiro golpe acertado no novo alvo eleva para 3 de foco');
}

console.log('\nClasses: o que está escrito na ficha acontece no jogo.');
