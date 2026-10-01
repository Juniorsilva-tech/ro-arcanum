type AssertFn = ((valor: unknown, mensagem?: string) => asserts valor) & {
  equal: (a: unknown, b: unknown) => void;
  deepEqual: (a: unknown, b: unknown) => void;
};
const assert: AssertFn = Object.assign(
  (valor: unknown, mensagem?: string) => { if (!valor) throw new Error(mensagem ?? 'asserção falhou'); },
  {
    equal: (a: unknown, b: unknown) => { if (a !== b) throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`); },
    deepEqual: (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} != ${JSON.stringify(b)}`); },
  },
) as AssertFn;
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarCombate, jogadorAtaca, jogadorConjura, jogadorDefende, jogadorAcaoTatica, fecharCombate } from './combat';
import { aplicarFerimentoOni, encontrosElegiveis, obterRival } from './kimetsu';
import { normalizarCampanha } from './migracao';
import { podeAprender } from './magic';
import { avancarPeriodos } from './time';
import { avancarMundo, multiplicadorDePreco } from './mundo';
import { criarAmeacaLocal, atualizarAmeacas, ajudarReconstrucao } from './continuidade';
import { alternarCompanheiro } from './grupo';
import { calcularContexto } from './availability';
import { processarNemesis } from './nemesis';
import type { Campaign } from './types';

let testes = 0;
function teste(nome: string, fn: () => void) { fn(); testes++; console.log(`✓ ${nome}`); }
function campanha(seed = 'kimetsu-regressao'): Campaign {
  const c = criarCampanha(C, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed });
  c.personagem.idade = 20;
  if (c.familia) { c.familia.idadeJogador = 20; c.familia.prologoConcluido = true; c.familia.eventoAtual = undefined; }
  return c;
}
function luta(ids: string[], local = 'castelo_infinito') {
  const c = campanha();
  c.localAtual = local;
  c.calendario.periodoIndex = 5;
  c.personagem.recursos.vida = c.personagem.recursosMax.vida = 10000;
  c.personagem.recursos.vigor = c.personagem.recursosMax.vigor = 1000;
  c.personagem.artesConhecidas = C.artes.filter(a => a.tecnica).map(a => a.id);
  c.personagem.inventario.lamina_nichirin = 1;
  c.personagem.equipado.arma = 'lamina_nichirin';
  iniciarCombate(C, c, ids);
  const s = c.combate!;
  s.ordem = ['jogador', ...s.atores.filter(a => !a.ehJogador).map(a => a.id)];
  s.turno = 0;
  s.atores[0].acerto = 1000;
  s.atores[0].defesa = 1000;
  return c;
}

teste('Elenco jovem, vínculos e onis não confundidos com humanos', () => {
  for (const id of ['tanjiro', 'nezuko', 'muichiro', 'kanao', 'genya', 'zenitsu', 'inosuke']) {
    const n = C.npcs.find(n => n.id === id)!;
    assert(n.idade >= 18 && n.idade <= 20);
  }
  assert.equal(C.npcs.find(n => n.id === 'nezuko')?.especie, 'oni');
  assert.equal(C.criaturas.find(c => c.id === 'muzan')?.imuneLuz, false);
  assert(!C.rivalidadesFaccoes?.some(p => p.includes('onis') || p.includes('cacadores')));
});

teste('Dia e abrigo filtram encontros; criaturas desconhecidas não iniciam lutas inválidas', () => {
  const c = campanha(); c.localAtual = 'estrada';
  assert.deepEqual(encontrosElegiveis(C, c, ['oni_faminto', 'lobo', 'inexistente']), ['lobo']);
  c.localAtual = 'castelo_infinito';
  assert.deepEqual(encontrosElegiveis(C, c, ['muzan']), ['muzan']);
  const s = iniciarCombate(C, c, ['inexistente']);
  assert(s.terminado); assert.equal(s.recompensa?.xp, 0);
});

teste('Dano comum não mata oni; Nichirin encerra apenas vulneráveis', () => {
  const c = luta(['oni_faminto']); const a = c.combate!.atores[1];
  a.vida = 0; aplicarFerimentoOni(c, a, false); assert.equal(a.vida, 1);
  a.vida = 0; aplicarFerimentoOni(c, a, true); assert(a.mortoDefinitivo);
  const m = luta(['muzan']).combate!.atores[1];
  m.vida = 0; aplicarFerimentoOni(c, m, true); assert.equal(m.vida, 1);
});

teste('Gyutaro e Daki vêm juntos, sem duplicatas, e exigem a mesma janela', () => {
  const c = luta(['lua_superior_seis', 'lua_superior_seis']);
  const s = c.combate!; assert.equal(s.atores.length, 3);
  const [a, b] = s.atores.filter(a => !a.ehJogador);
  a.vida = 0; aplicarFerimentoOni(c, a, true); assert.equal(a.vida, 1);
  b.vida = 0; aplicarFerimentoOni(c, b, true);
  assert(a.mortoDefinitivo && b.mortoDefinitivo);
});

teste('Janela dos irmãos expira e exige nova decapitação', () => {
  const c = luta(['daki']); const s = c.combate!;
  const [a, b] = s.atores.filter(a => !a.ehJogador);
  a.vida = 0; aplicarFerimentoOni(c, a, true);
  s.rodada += 3;
  b.vida = 0; aplicarFerimentoOni(c, b, true);
  assert(!a.mortoDefinitivo && !b.mortoDefinitivo);
});

teste('Hantengu exige identificar o corpo verdadeiro', () => {
  const c = luta(['lua_superior_quatro']); const a = c.combate!.atores[1];
  a.vida = 0; aplicarFerimentoOni(c, a, true); assert.equal(a.vida, 1);
  jogadorAcaoTatica(C, c, 'observar', a.id);
  a.vida = 0; aplicarFerimentoOni(c, a, true); assert(a.mortoDefinitivo);
});

teste('Calmaria protege sem causar dano e respeita recuperação', () => {
  const c = luta(['lobo']); const a = c.combate!.atores[1];
  const id = 'respiracao_agua_decima_primeira_forma'; const vida = a.vida;
  assert(jogadorConjura(C, c, id).ok); assert.equal(a.vida, vida);
  assert((c.combate!.atores[0].tatico?.guarda ?? 0) > 0);
  const vigor = c.personagem.recursos.vigor;
  assert(!jogadorConjura(C, c, id).ok); assert.equal(c.personagem.recursos.vigor, vigor);
});

teste('Glicínia consome dose somente em ação válida, e respiração não é magia genérica', () => {
  const c = luta(['oni_ancestral']); const a = c.combate!.atores[1];
  const id = 'respiracao_inseto_danca_da_borboleta'; const vigor = c.personagem.recursos.vigor;
  assert(!jogadorConjura(C, c, id, a.id).ok); assert.equal(c.personagem.recursos.vigor, vigor);
  c.personagem.inventario.dose_glicinia = 1;
  assert(jogadorConjura(C, c, id, a.id).ok);
  assert(!c.personagem.inventario.dose_glicinia);
  assert((a.imuneRegenTurnos ?? 0) > 0);
});

teste('Sono e prisão têm contramedidas jogáveis; custo inválido não passa', () => {
  const c = luta(['lobo']); const jog = c.combate!.atores[0]; const alvo = c.combate!.atores[1];
  jog.tatico = { sono: 1 };
  const vida = alvo.vida;
  jogadorAtaca(C, c, alvo.id); assert.equal(alvo.vida, vida);
  jogadorAcaoTatica(C, c, 'despertar'); assert.equal(jog.tatico.sono, 0);
  jog.tatico.preso = 2;
  assert(!jogadorConjura(C, c, 'respiracao_agua_primeira_forma').ok);
  jogadorAcaoTatica(C, c, 'libertar'); assert.equal(jog.tatico.preso, 0);
});

teste('Morte única persiste e não concede XP duas vezes', () => {
  const c = luta(['lua_inferior_cinco']); const a = c.combate!.atores[1];
  a.vida = 1;
  jogadorAcaoTatica(C, c, 'decapitar', a.id);
  assert(c.combate!.terminado); assert.equal(c.kimetsu!.rivais.lua_inferior_cinco.vivo, false);
  const xp = c.personagem.xp;
  fecharCombate(c); iniciarCombate(C, c, ['lua_inferior_cinco']);
  assert.equal(c.combate!.atores.length, 1); assert.equal(c.personagem.xp, xp);
});

teste('Sobrevivente mantém identidade, ferida e histórico no reencontro', () => {
  const c = luta(['oni_faminto']); const a = c.combate!.atores[1];
  const id = a.rivalId!;
  a.vida = 12;
  c.combate!.atores[0].vida = 1;
  c.combate!.atores[0].defesa = -1000;
  a.acerto = 1000; a.dano = { base: 10000, dispersao: 0, tipo: 'teste' };
  // A campanha de teste é de guardião, e guardião absorve o primeiro golpe de
  // cada combate (ver engine/classe.ts, sessão 22). Antes dessa regra, um
  // turno bastava para derrubar o jogador; agora o primeiro golpe morre na
  // guarda e é o segundo que mata. O teste é sobre o que acontece na DERROTA,
  // então ele precisa chegar até ela.
  jogadorDefende(C, c);
  if (!c.combate!.terminado) {
    c.combate!.atores[0].vida = 1;
    jogadorDefende(C, c);
  }
  assert.equal(c.combate!.resultado, 'derrota');
  assert.equal(c.kimetsu!.rivais[id].vitorias, 1);
  const vida = c.kimetsu!.rivais[id].vida;
  fecharCombate(c);
  const r = obterRival(c, C.criaturas.find(x => x.id === a.criaturaId)!, []);
  assert.equal(r?.id, id); assert.equal(r?.vida, vida);
});

teste('Sol mata inclusive Muzan; cobertura e castelo não são céu aberto', () => {
  const c = luta(['muzan'], 'capela'); c.calendario.periodoIndex = 1;
  jogadorDefende(C, c); assert(!c.combate!.terminado);
  jogadorAcaoTatica(C, c, 'expor_sol'); assert(c.combate!.terminado);
  assert.equal(c.kimetsu!.rivais.muzan.vivo, false);
  const d = luta(['muzan']); d.calendario.periodoIndex = 1;
  jogadorAcaoTatica(C, d, 'expor_sol'); assert(d.combate!.ambiente?.abrigoSolar);
});

teste('Migração idempotente preserva mortes, recargas e avanço das idades', () => {
  const c = luta(['lua_inferior_cinco']);
  c.npcState.tanjiro.idade = 28;
  delete c.flags['versao.idades_kimetsu'];
  c.flags['matou.lua_superior_um'] = true;
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  assert.equal(salvo.npcState.tanjiro.idade, 21);
  assert(salvo.combate); assert(salvo.flags['matou.lua_superior_um']);
  const json = JSON.stringify(salvo);
  normalizarCampanha(C, salvo); assert.equal(JSON.stringify(salvo), json);
  assert.deepEqual(encontrosElegiveis(C, salvo, ['lua_superior_um']), []);
});

teste('Mestre ausente ou morto não ensina; formas avançadas exigem progressão', () => {
  const c = campanha(); c.localAtual = 'estrada';
  assert(podeAprender(C, c, 'respiracao_agua_primeira_forma').ok);
  assert(!podeAprender(C, c, 'respiracao_agua_decima_forma').ok);
  c.npcState.tanjiro.vivo = false;
  assert(!podeAprender(C, c, 'respiracao_agua_primeira_forma').ok);
});

teste('Calendário anual e simulação em lote equivalem a dias consecutivos', () => {
  const a = campanha('tempo'), b = campanha('tempo');
  // O Livro fica de fora: ele sobe de camada quando um mestre está onde o
  // jogador está NO MOMENTO da atualização, e dia a dia há 740 momentos contra
  // um só no lote. A igualdade só valia por sorte (nenhum mestre passava pela
  // taverna de manhã); o crime urbano da sessão 92d mexe na fome e a Sarine
  // passou a ir para casa no dia 143. O resto do mundo continua idêntico.
  const identidade = (c: Campaign) => JSON.stringify({ ...c, id: '', criadaEm: 0, livro: undefined });
  for (let i = 0; i < 740; i++) { a.calendario = avancarPeriodos(a.calendario, 6); avancarMundo(C, a); }
  b.calendario = avancarPeriodos(b.calendario, 740 * 6); avancarMundo(C, b);
  assert.equal(identidade(a), identidade(b));
  assert.equal(b.personagem.idade, 22);
  assert.equal(b.mundo!.diaProcessado, 740);
  assert(b.continuidade!.eventos.every(e => e.dia <= 740));
  const json = identidade(b); avancarMundo(C, b); assert.equal(identidade(b), json);
});

teste('Ameaça vencida resolve a missão exata e paga uma única vez', () => {
  const c = luta(['lobo'], 'praca'); fecharCombate(c);
  c.locaisVisitados.push('praca');
  const a = criarAmeacaLocal(C, c, 'praca', 'oni_faminto')!;
  iniciarCombate(C, c, [a.criaturaId]); const alvo = c.combate!.atores[1];
  assert.equal(alvo.rivalId, a.rivalId);
  c.combate!.ordem = ['jogador', alvo.id]; c.combate!.turno = 0; alvo.vida = 1;
  jogadorAcaoTatica(C, c, 'decapitar', alvo.id);
  assert.equal(a.estado, 'resolvida');
  const moedas = c.personagem.dinheiro;
  atualizarAmeacas(C, c); assert.equal(c.personagem.dinheiro, moedas);
});

teste('Ameaça ignorada deixa danos; reparo custa recursos e tem efeito real', () => {
  const c = campanha(); c.localAtual = 'praca'; c.locaisVisitados.push('praca');
  const a = criarAmeacaLocal(C, c, 'praca', 'oni_faminto')!;
  c.calendario = avancarPeriodos(c.calendario, 8 * 6); avancarMundo(C, c);
  assert.equal(a.estado, 'devastou');
  const lugar = c.continuidade!.locais.praca;
  assert.equal(lugar.integridade, 65); assert.equal(lugar.populacao, 52);
  const preco = multiplicadorDePreco(c);
  c.personagem.dinheiro = 20; assert(ajudarReconstrucao(c).ok);
  assert.equal(c.personagem.dinheiro, 0); assert.equal(lugar.integridade, 75);
  assert(multiplicadorDePreco(c) < preco);
});

teste('Companheiro exige vínculo e presença, luta com sua técnica e conserva ferimentos', () => {
  const c = campanha('grupo');
  c.localAtual = 'estrada';
  assert(!alternarCompanheiro(C, c, 'tanjiro').ok);
  c.npcState.tanjiro.eixos.confianca = 5;
  assert(alternarCompanheiro(C, c, 'tanjiro').ok);
  assert.deepEqual(c.grupo, ['tanjiro']);

  c.calendario.periodoIndex = 5;
  iniciarCombate(C, c, ['lobo']);
  const s = c.combate!;
  const aliado = s.atores.find(a => a.ehAliado)!;
  const inimigo = s.atores.find(a => !a.ehJogador && !a.ehAliado)!;
  aliado.acerto = 1000;
  inimigo.defesa = -1000;
  inimigo.vida = inimigo.vidaMax = 100;
  aliado.vida = 40;
  s.ordem = ['jogador', aliado.id, inimigo.id];
  s.turno = 0;
  const antes = inimigo.vida;
  jogadorDefende(C, c);
  assert(inimigo.vida < antes);
  assert(s.log.some(l => l.includes('Tanjiro Kamado executa')));

  inimigo.vida = 1;
  s.ordem = ['jogador', aliado.id, inimigo.id];
  s.turno = 0;
  c.combate!.atores[0].acerto = 1000;
  jogadorAtaca(C, c, inimigo.id);
  assert.equal(c.npcState.tanjiro.vida, 40);
  fecharCombate(c);

  c.localAtual = 'praca';
  assert(calcularContexto(C, c).presentes.some(n => n.id === 'tanjiro'));
  const tensao = c.npcState.tanjiro.tensao = 5;
  c.calendario = avancarPeriodos(c.calendario, 6);
  avancarMundo(C, c);
  assert((c.npcState.tanjiro.vida ?? 0) > 40);
  assert(c.npcState.tanjiro.tensao < tensao);
});

teste('Derrota de Nemesis causa regressão de nível, dispersão de servos, quebra de adaptação e cicatrizes', () => {
  const c = luta(['oni_faminto']);
  const s = c.combate!;
  const inimigo = s.atores.find(a => !a.ehJogador && !a.ehAliado)!;
  const rivalId = inimigo.rivalId!;
  const rival = c.kimetsu!.rivais[rivalId];

  // Simula Nemesis já experiente com nível 3 e 4 servos e adaptação à técnica de água
  rival.evolucao = {
    nivel: 3,
    servos: 4,
    papel: 'agente',
    plano: 'perseguir',
    proximaAcao: c.calendario.dia + 7,
    refugio: c.localAtual,
    adaptacoes: { respiracao_agua_primeira_forma: 2 },
  };

  // Jogador usa a primeira forma de água com espada comum para derrotar sem decapitar com nichirin
  inimigo.vida = 1;
  c.personagem.inventario.espada_curta = 1;
  c.personagem.equipado.arma = 'espada_curta';
  c.personagem.atributos.precisao = 20;
  const resConjura = jogadorConjura(C, c, 'respiracao_agua_primeira_forma', inimigo.id);
  assert(resConjura.ok, 'Deveria conjurar técnica com espada');
  // O oni sem postura recua do confronto
  inimigo.retirado = true;
  jogadorDefende(C, c);

  assert(s.terminado, 'Combate deveria terminar');
  assert.equal(s.resultado, 'vitoria');
  assert(rival.vivo, 'Oni sobreviveu sem nichirin/sol mas sofreu derrota');

  // Verifica regressão real de nível e servos
  assert.equal(rival.evolucao.nivel, 2);
  assert.equal(rival.evolucao.servos, 2);
  assert.equal(rival.evolucao.plano, 'ocultar');
  assert.equal(rival.evolucao.adaptacoes.respiracao_agua_primeira_forma, 1);

  // Verifica aquisição de cicatriz
  assert(rival.cicatrizes && rival.cicatrizes.length > 0, 'Deveria ter adquirido cicatrizes');
  assert(rival.cicatrizes.includes('cicatriz_agua_primeira_forma'), 'Cicatriz deve referenciar a técnica');
  assert(rival.comportamento!.recuperarAte >= c.calendario.dia + 14, 'Recuperação deve ser estendida');
});

teste('Nemesis: Vetores de parâmetros (imunidade a veneno, fobia a fogo e fúria por sangue)', () => {
  const c = luta(['oni_faminto']);
  const s = c.combate!;
  const inimigo = s.atores.find(a => !a.ehJogador && !a.ehAliado)!;
  const rival = c.kimetsu!.rivais[inimigo.rivalId!];

  // Atribui traços
  rival.tracos = {
    imunidades: ['imune_veneno'],
    fraquezas: ['fobia_fogo'],
    odios: ['furia_sangue'],
  };

  // Testa imunidade a veneno: veneno de glicínia não suprime regeneração
  c.personagem.inventario.dose_glicinia = 2;
  c.personagem.inventario.adaga = 1;
  c.personagem.equipado.arma = 'adaga';
  c.personagem.artesConhecidas.push('respiracao_inseto_ferrao');
  const resVeneno = jogadorConjura(C, c, 'respiracao_inseto_ferrao', inimigo.id);
  if (resVeneno.ok) {
    assert(s.log.some(l => l.includes('desenvolveu tolerância à glicínia')), 'Deveria acusar imunidade a veneno');
    assert.equal(inimigo.imuneRegenTurnos ?? 0, 0);
  }

  // Testa fobia a fogo: técnica de fogo reduz moral
  const moralAntes = s.moralInimiga;
  c.personagem.inventario.espada_curta = 1;
  c.personagem.equipado.arma = 'espada_curta';
  c.personagem.artesConhecidas.push('respiracao_chamas_primeira_forma');
  const resFogo = jogadorConjura(C, c, 'respiracao_chamas_primeira_forma', inimigo.id);
  if (resFogo.ok) {
    assert(s.moralInimiga < moralAntes, 'Moral deveria cair com fobia a fogo');
    assert(s.log.some(l => l.includes('fobia ativada')), 'Deveria registrar log de fobia');
  }

  // Testa fúria por sangue: quando vida fica <= 40%
  inimigo.vida = Math.floor(inimigo.vidaMax * 0.2);
  const acertoAntes = inimigo.acerto;
  jogadorDefende(C, c); // avança para turno do inimigo
  assert(inimigo.tatico?.emFuria, 'Deveria ativar estado de fúria');
  assert(inimigo.acerto > acertoAntes, 'Deveria ganhar bônus de acerto na fúria');
});

teste('Nemesis: Ação tática Humilhar quebra nível, dispersa servos e imprime trauma psicológico', () => {
  const c = luta(['oni_faminto']);
  const s = c.combate!;
  const inimigo = s.atores.find(a => !a.ehJogador && !a.ehAliado)!;
  const rival = c.kimetsu!.rivais[inimigo.rivalId!];

  rival.evolucao = {
    nivel: 3,
    servos: 4,
    papel: 'agente',
    plano: 'perseguir',
    proximaAcao: c.calendario.dia + 7,
    refugio: c.localAtual,
    adaptacoes: {},
  };

  // Enfraquece o inimigo para permitir humilhação
  inimigo.vida = Math.floor(inimigo.vidaMax * 0.2);
  jogadorAcaoTatica(C, c, 'humilhar', inimigo.id);

  assert(s.terminado, 'Combate deveria encerrar com fuga humilhada');
  assert.equal(s.resultado, 'vitoria');
  assert.equal(rival.traumaJogador, true);
  assert.equal(rival.evolucao.nivel, 1);
  assert.equal(rival.evolucao.servos, 0);
  assert(rival.titulo?.includes('Humilhado'), 'Deveria receber o título de Humilhado');
});

teste('Nemesis: Pipeline Cheat Death programa retorno com título procedural, cicatriz e adaptação', () => {
  const c = luta(['oni_faminto']);
  const s = c.combate!;
  const inimigo = s.atores.find(a => !a.ehJogador && !a.ehAliado)!;
  const rival = c.kimetsu!.rivais[inimigo.rivalId!];

  rival.rancor = 4;
  c.personagem.inventario.lamina_nichirin = 1;
  c.personagem.equipado.arma = 'lamina_nichirin';
  inimigo.vida = Math.floor(inimigo.vidaMax * 0.1);

  // Decapita o oni
  jogadorAcaoTatica(C, c, 'decapitar', inimigo.id);
  assert(s.terminado, 'Combate deveria terminar após decapitação');
  assert.equal(rival.vivo, true);
  assert(rival.comportamento!.recuperarAte > c.calendario.dia, 'Deveria estar em recuperação oculta');
  assert(rival.cheatDeath, 'Deveria ter agendado Cheat Death');
  assert(rival.cheatDeath.diaRetorno! > c.calendario.dia, 'Deveria definir dia de retorno');

  // Avança o tempo até o dia de retorno e processa o Nemesis
  c.calendario.dia = rival.cheatDeath.diaRetorno!;
  processarNemesis(C, c);

  assert.equal(rival.vivo, true);
  assert(rival.titulo?.includes('Renascido'), 'Deveria ganhar título de Renascido');
  assert(rival.cicatrizes?.some(x => x.includes('quase_morte')), 'Deveria trazer cicatriz de quase-morte');
  assert.equal(rival.evolucao?.plano, 'perseguir');
});

teste('Nemesis: Vingança de Irmão de Sangue ativa perseguição e ódio vingativo', () => {
  const c = campanha();
  c.kimetsu = { versao: 1, sequencia: 2, rivais: {} };
  const oniA = C.criaturas.find(x => x.oni && !x.perfilOni?.identidade)!;

  c.kimetsu.rivais['oni_irmao_1'] = {
    id: 'oni_irmao_1', criaturaId: oniA.id, nome: 'Oni Alfa',
    vivo: true, vida: oniA.vida, local: c.localAtual, ultimoDia: c.calendario.dia,
    reencontros: 0, vitorias: 0, fugas: 0, rancor: 2, memoria: [],
    relacoes: { irmaoDeSangueId: 'oni_irmao_2' },
  };
  c.kimetsu.rivais['oni_irmao_2'] = {
    id: 'oni_irmao_2', criaturaId: oniA.id, nome: 'Oni Beta',
    vivo: false, vida: 0, local: c.localAtual, ultimoDia: c.calendario.dia,
    reencontros: 1, vitorias: 0, fugas: 0, rancor: 1, memoria: [],
  };

  processarNemesis(C, c);

  const alfa = c.kimetsu.rivais['oni_irmao_1'];
  assert.equal(alfa.rancor, 10);
  assert.equal(alfa.evolucao?.plano, 'perseguir');
  assert(alfa.tracos?.odios?.includes('furia_vinganca_sangue'), 'Deveria ganhar ódio furia_vinganca_sangue');
  assert(alfa.titulo?.includes('Vingador'), 'Deveria ganhar título de Vingador');
});

console.log(`${testes} testes de integração Kimetsu/continuidade passaram.`);

