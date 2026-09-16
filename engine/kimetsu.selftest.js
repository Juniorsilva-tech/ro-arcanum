"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = Object.assign((valor, mensagem) => { if (!valor)
    throw new Error(mensagem ?? 'asserção falhou'); }, {
    equal: (a, b) => { if (a !== b)
        throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`); },
    deepEqual: (a, b) => { if (JSON.stringify(a) !== JSON.stringify(b))
        throw new Error(`${JSON.stringify(a)} != ${JSON.stringify(b)}`); },
});
const vaelhorn_1 = require("../content/vaelhorn");
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const combat_1 = require("./combat");
const kimetsu_1 = require("./kimetsu");
const migracao_1 = require("./migracao");
const magic_1 = require("./magic");
const time_1 = require("./time");
const mundo_1 = require("./mundo");
const continuidade_1 = require("./continuidade");
const grupo_1 = require("./grupo");
const availability_1 = require("./availability");
let testes = 0;
function teste(nome, fn) { fn(); testes++; console.log(`✓ ${nome}`); }
function campanha(seed = 'kimetsu-regressao') {
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, { nome: 'Teste', atributos: (0, character_1.atributosBase)(), classeId: 'guardiao', origemId: 'divida', seedString: seed });
    c.personagem.idade = 20;
    if (c.familia) {
        c.familia.idadeJogador = 20;
        c.familia.prologoConcluido = true;
        c.familia.eventoAtual = undefined;
    }
    return c;
}
function luta(ids, local = 'castelo_infinito') {
    const c = campanha();
    c.localAtual = local;
    c.calendario.periodoIndex = 5;
    c.personagem.recursos.vida = c.personagem.recursosMax.vida = 10000;
    c.personagem.recursos.vigor = c.personagem.recursosMax.vigor = 1000;
    c.personagem.artesConhecidas = vaelhorn_1.conteudoVaelhorn.artes.filter(a => a.tecnica).map(a => a.id);
    c.personagem.inventario.lamina_nichirin = 1;
    c.personagem.equipado.arma = 'lamina_nichirin';
    (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, ids);
    const s = c.combate;
    s.ordem = ['jogador', ...s.atores.filter(a => !a.ehJogador).map(a => a.id)];
    s.turno = 0;
    s.atores[0].acerto = 1000;
    s.atores[0].defesa = 1000;
    return c;
}
teste('Elenco jovem, vínculos e onis não confundidos com humanos', () => {
    for (const id of ['tanjiro', 'nezuko', 'muichiro', 'kanao', 'genya', 'zenitsu', 'inosuke']) {
        const n = vaelhorn_1.conteudoVaelhorn.npcs.find(n => n.id === id);
        assert(n.idade >= 18 && n.idade <= 20);
    }
    assert.equal(vaelhorn_1.conteudoVaelhorn.npcs.find(n => n.id === 'nezuko')?.especie, 'oni');
    assert.equal(vaelhorn_1.conteudoVaelhorn.criaturas.find(c => c.id === 'muzan')?.imuneLuz, false);
    assert(!vaelhorn_1.conteudoVaelhorn.rivalidadesFaccoes?.some(p => p.includes('onis') || p.includes('cacadores')));
});
teste('Dia e abrigo filtram encontros; criaturas desconhecidas não iniciam lutas inválidas', () => {
    const c = campanha();
    c.localAtual = 'estrada';
    assert.deepEqual((0, kimetsu_1.encontrosElegiveis)(vaelhorn_1.conteudoVaelhorn, c, ['oni_faminto', 'lobo', 'inexistente']), ['lobo']);
    c.localAtual = 'castelo_infinito';
    assert.deepEqual((0, kimetsu_1.encontrosElegiveis)(vaelhorn_1.conteudoVaelhorn, c, ['muzan']), ['muzan']);
    const s = (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, ['inexistente']);
    assert(s.terminado);
    assert.equal(s.recompensa?.xp, 0);
});
teste('Dano comum não mata oni; Nichirin encerra apenas vulneráveis', () => {
    const c = luta(['oni_faminto']);
    const a = c.combate.atores[1];
    a.vida = 0;
    (0, kimetsu_1.aplicarFerimentoOni)(c, a, false);
    assert.equal(a.vida, 1);
    a.vida = 0;
    (0, kimetsu_1.aplicarFerimentoOni)(c, a, true);
    assert(a.mortoDefinitivo);
    const m = luta(['muzan']).combate.atores[1];
    m.vida = 0;
    (0, kimetsu_1.aplicarFerimentoOni)(c, m, true);
    assert.equal(m.vida, 1);
});
teste('Gyutaro e Daki vêm juntos, sem duplicatas, e exigem a mesma janela', () => {
    const c = luta(['lua_superior_seis', 'lua_superior_seis']);
    const s = c.combate;
    assert.equal(s.atores.length, 3);
    const [a, b] = s.atores.filter(a => !a.ehJogador);
    a.vida = 0;
    (0, kimetsu_1.aplicarFerimentoOni)(c, a, true);
    assert.equal(a.vida, 1);
    b.vida = 0;
    (0, kimetsu_1.aplicarFerimentoOni)(c, b, true);
    assert(a.mortoDefinitivo && b.mortoDefinitivo);
});
teste('Janela dos irmãos expira e exige nova decapitação', () => {
    const c = luta(['daki']);
    const s = c.combate;
    const [a, b] = s.atores.filter(a => !a.ehJogador);
    a.vida = 0;
    (0, kimetsu_1.aplicarFerimentoOni)(c, a, true);
    s.rodada += 3;
    b.vida = 0;
    (0, kimetsu_1.aplicarFerimentoOni)(c, b, true);
    assert(!a.mortoDefinitivo && !b.mortoDefinitivo);
});
teste('Hantengu exige identificar o corpo verdadeiro', () => {
    const c = luta(['lua_superior_quatro']);
    const a = c.combate.atores[1];
    a.vida = 0;
    (0, kimetsu_1.aplicarFerimentoOni)(c, a, true);
    assert.equal(a.vida, 1);
    (0, combat_1.jogadorAcaoTatica)(vaelhorn_1.conteudoVaelhorn, c, 'observar', a.id);
    a.vida = 0;
    (0, kimetsu_1.aplicarFerimentoOni)(c, a, true);
    assert(a.mortoDefinitivo);
});
teste('Calmaria protege sem causar dano e respeita recuperação', () => {
    const c = luta(['lobo']);
    const a = c.combate.atores[1];
    const id = 'respiracao_agua_decima_primeira_forma';
    const vida = a.vida;
    assert((0, combat_1.jogadorConjura)(vaelhorn_1.conteudoVaelhorn, c, id).ok);
    assert.equal(a.vida, vida);
    assert((c.combate.atores[0].tatico?.guarda ?? 0) > 0);
    const vigor = c.personagem.recursos.vigor;
    assert(!(0, combat_1.jogadorConjura)(vaelhorn_1.conteudoVaelhorn, c, id).ok);
    assert.equal(c.personagem.recursos.vigor, vigor);
});
teste('Glicínia consome dose somente em ação válida, e respiração não é magia genérica', () => {
    const c = luta(['oni_ancestral']);
    const a = c.combate.atores[1];
    const id = 'respiracao_inseto_danca_da_borboleta';
    const vigor = c.personagem.recursos.vigor;
    assert(!(0, combat_1.jogadorConjura)(vaelhorn_1.conteudoVaelhorn, c, id, a.id).ok);
    assert.equal(c.personagem.recursos.vigor, vigor);
    c.personagem.inventario.dose_glicinia = 1;
    assert((0, combat_1.jogadorConjura)(vaelhorn_1.conteudoVaelhorn, c, id, a.id).ok);
    assert(!c.personagem.inventario.dose_glicinia);
    assert((a.imuneRegenTurnos ?? 0) > 0);
});
teste('Sono e prisão têm contramedidas jogáveis; custo inválido não passa', () => {
    const c = luta(['lobo']);
    const jog = c.combate.atores[0];
    const alvo = c.combate.atores[1];
    jog.tatico = { sono: 1 };
    const vida = alvo.vida;
    (0, combat_1.jogadorAtaca)(vaelhorn_1.conteudoVaelhorn, c, alvo.id);
    assert.equal(alvo.vida, vida);
    (0, combat_1.jogadorAcaoTatica)(vaelhorn_1.conteudoVaelhorn, c, 'despertar');
    assert.equal(jog.tatico.sono, 0);
    jog.tatico.preso = 2;
    assert(!(0, combat_1.jogadorConjura)(vaelhorn_1.conteudoVaelhorn, c, 'respiracao_agua_primeira_forma').ok);
    (0, combat_1.jogadorAcaoTatica)(vaelhorn_1.conteudoVaelhorn, c, 'libertar');
    assert.equal(jog.tatico.preso, 0);
});
teste('Morte única persiste e não concede XP duas vezes', () => {
    const c = luta(['lua_inferior_cinco']);
    const a = c.combate.atores[1];
    a.vida = 1;
    (0, combat_1.jogadorAcaoTatica)(vaelhorn_1.conteudoVaelhorn, c, 'decapitar', a.id);
    assert(c.combate.terminado);
    assert.equal(c.kimetsu.rivais.lua_inferior_cinco.vivo, false);
    const xp = c.personagem.xp;
    (0, combat_1.fecharCombate)(c);
    (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, ['lua_inferior_cinco']);
    assert.equal(c.combate.atores.length, 1);
    assert.equal(c.personagem.xp, xp);
});
teste('Sobrevivente mantém identidade, ferida e histórico no reencontro', () => {
    const c = luta(['oni_faminto']);
    const a = c.combate.atores[1];
    const id = a.rivalId;
    a.vida = 12;
    c.combate.atores[0].vida = 1;
    c.combate.atores[0].defesa = -1000;
    a.acerto = 1000;
    a.dano = { base: 10000, dispersao: 0, tipo: 'teste' };
    // A campanha de teste é de guardião, e guardião absorve o primeiro golpe de
    // cada combate (ver engine/classe.ts, sessão 22). Antes dessa regra, um
    // turno bastava para derrubar o jogador; agora o primeiro golpe morre na
    // guarda e é o segundo que mata. O teste é sobre o que acontece na DERROTA,
    // então ele precisa chegar até ela.
    (0, combat_1.jogadorDefende)(vaelhorn_1.conteudoVaelhorn, c);
    if (!c.combate.terminado) {
        c.combate.atores[0].vida = 1;
        (0, combat_1.jogadorDefende)(vaelhorn_1.conteudoVaelhorn, c);
    }
    assert.equal(c.combate.resultado, 'derrota');
    assert.equal(c.kimetsu.rivais[id].vitorias, 1);
    const vida = c.kimetsu.rivais[id].vida;
    (0, combat_1.fecharCombate)(c);
    const r = (0, kimetsu_1.obterRival)(c, vaelhorn_1.conteudoVaelhorn.criaturas.find(x => x.id === a.criaturaId), []);
    assert.equal(r?.id, id);
    assert.equal(r?.vida, vida);
});
teste('Sol mata inclusive Muzan; cobertura e castelo não são céu aberto', () => {
    const c = luta(['muzan'], 'capela');
    c.calendario.periodoIndex = 1;
    (0, combat_1.jogadorDefende)(vaelhorn_1.conteudoVaelhorn, c);
    assert(!c.combate.terminado);
    (0, combat_1.jogadorAcaoTatica)(vaelhorn_1.conteudoVaelhorn, c, 'expor_sol');
    assert(c.combate.terminado);
    assert.equal(c.kimetsu.rivais.muzan.vivo, false);
    const d = luta(['muzan']);
    d.calendario.periodoIndex = 1;
    (0, combat_1.jogadorAcaoTatica)(vaelhorn_1.conteudoVaelhorn, d, 'expor_sol');
    assert(d.combate.ambiente?.abrigoSolar);
});
teste('Migração idempotente preserva mortes, recargas e avanço das idades', () => {
    const c = luta(['lua_inferior_cinco']);
    c.npcState.tanjiro.idade = 28;
    delete c.flags['versao.idades_kimetsu'];
    c.flags['matou.lua_superior_um'] = true;
    const salvo = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(c)));
    assert.equal(salvo.npcState.tanjiro.idade, 21);
    assert(salvo.combate);
    assert(salvo.flags['matou.lua_superior_um']);
    const json = JSON.stringify(salvo);
    (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, salvo);
    assert.equal(JSON.stringify(salvo), json);
    assert.deepEqual((0, kimetsu_1.encontrosElegiveis)(vaelhorn_1.conteudoVaelhorn, salvo, ['lua_superior_um']), []);
});
teste('Mestre ausente ou morto não ensina; formas avançadas exigem progressão', () => {
    const c = campanha();
    c.localAtual = 'estrada';
    assert((0, magic_1.podeAprender)(vaelhorn_1.conteudoVaelhorn, c, 'respiracao_agua_primeira_forma').ok);
    assert(!(0, magic_1.podeAprender)(vaelhorn_1.conteudoVaelhorn, c, 'respiracao_agua_decima_forma').ok);
    c.npcState.tanjiro.vivo = false;
    assert(!(0, magic_1.podeAprender)(vaelhorn_1.conteudoVaelhorn, c, 'respiracao_agua_primeira_forma').ok);
});
teste('Calendário anual e simulação em lote equivalem a dias consecutivos', () => {
    const a = campanha('tempo'), b = campanha('tempo');
    const identidade = (c) => JSON.stringify({ ...c, id: '', criadaEm: 0 });
    for (let i = 0; i < 740; i++) {
        a.calendario = (0, time_1.avancarPeriodos)(a.calendario, 6);
        (0, mundo_1.avancarMundo)(vaelhorn_1.conteudoVaelhorn, a);
    }
    b.calendario = (0, time_1.avancarPeriodos)(b.calendario, 740 * 6);
    (0, mundo_1.avancarMundo)(vaelhorn_1.conteudoVaelhorn, b);
    assert.equal(identidade(a), identidade(b));
    assert.equal(b.personagem.idade, 22);
    assert.equal(b.mundo.diaProcessado, 740);
    assert(b.continuidade.eventos.every(e => e.dia <= 740));
    const json = identidade(b);
    (0, mundo_1.avancarMundo)(vaelhorn_1.conteudoVaelhorn, b);
    assert.equal(identidade(b), json);
});
teste('Ameaça vencida resolve a missão exata e paga uma única vez', () => {
    const c = luta(['lobo'], 'praca');
    (0, combat_1.fecharCombate)(c);
    c.locaisVisitados.push('praca');
    const a = (0, continuidade_1.criarAmeacaLocal)(vaelhorn_1.conteudoVaelhorn, c, 'praca', 'oni_faminto');
    (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, [a.criaturaId]);
    const alvo = c.combate.atores[1];
    assert.equal(alvo.rivalId, a.rivalId);
    c.combate.ordem = ['jogador', alvo.id];
    c.combate.turno = 0;
    alvo.vida = 1;
    (0, combat_1.jogadorAcaoTatica)(vaelhorn_1.conteudoVaelhorn, c, 'decapitar', alvo.id);
    assert.equal(a.estado, 'resolvida');
    const moedas = c.personagem.dinheiro;
    (0, continuidade_1.atualizarAmeacas)(vaelhorn_1.conteudoVaelhorn, c);
    assert.equal(c.personagem.dinheiro, moedas);
});
teste('Ameaça ignorada deixa danos; reparo custa recursos e tem efeito real', () => {
    const c = campanha();
    c.localAtual = 'praca';
    c.locaisVisitados.push('praca');
    const a = (0, continuidade_1.criarAmeacaLocal)(vaelhorn_1.conteudoVaelhorn, c, 'praca', 'oni_faminto');
    c.calendario = (0, time_1.avancarPeriodos)(c.calendario, 8 * 6);
    (0, mundo_1.avancarMundo)(vaelhorn_1.conteudoVaelhorn, c);
    assert.equal(a.estado, 'devastou');
    const lugar = c.continuidade.locais.praca;
    assert.equal(lugar.integridade, 65);
    assert.equal(lugar.populacao, 52);
    const preco = (0, mundo_1.multiplicadorDePreco)(c);
    c.personagem.dinheiro = 20;
    assert((0, continuidade_1.ajudarReconstrucao)(c).ok);
    assert.equal(c.personagem.dinheiro, 0);
    assert.equal(lugar.integridade, 75);
    assert((0, mundo_1.multiplicadorDePreco)(c) < preco);
});
teste('Companheiro exige vínculo e presença, luta com sua técnica e conserva ferimentos', () => {
    const c = campanha('grupo');
    c.localAtual = 'estrada';
    assert(!(0, grupo_1.alternarCompanheiro)(vaelhorn_1.conteudoVaelhorn, c, 'tanjiro').ok);
    c.npcState.tanjiro.eixos.confianca = 5;
    assert((0, grupo_1.alternarCompanheiro)(vaelhorn_1.conteudoVaelhorn, c, 'tanjiro').ok);
    assert.deepEqual(c.grupo, ['tanjiro']);
    c.calendario.periodoIndex = 5;
    (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, ['lobo']);
    const s = c.combate;
    const aliado = s.atores.find(a => a.ehAliado);
    const inimigo = s.atores.find(a => !a.ehJogador && !a.ehAliado);
    aliado.acerto = 1000;
    inimigo.defesa = -1000;
    inimigo.vida = inimigo.vidaMax = 100;
    aliado.vida = 40;
    s.ordem = ['jogador', aliado.id, inimigo.id];
    s.turno = 0;
    const antes = inimigo.vida;
    (0, combat_1.jogadorDefende)(vaelhorn_1.conteudoVaelhorn, c);
    assert(inimigo.vida < antes);
    assert(s.log.some(l => l.includes('Tanjiro Kamado executa')));
    inimigo.vida = 1;
    s.ordem = ['jogador', aliado.id, inimigo.id];
    s.turno = 0;
    c.combate.atores[0].acerto = 1000;
    (0, combat_1.jogadorAtaca)(vaelhorn_1.conteudoVaelhorn, c, inimigo.id);
    assert.equal(c.npcState.tanjiro.vida, 40);
    (0, combat_1.fecharCombate)(c);
    c.localAtual = 'praca';
    assert((0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, c).presentes.some(n => n.id === 'tanjiro'));
    const tensao = c.npcState.tanjiro.tensao = 5;
    c.calendario = (0, time_1.avancarPeriodos)(c.calendario, 6);
    (0, mundo_1.avancarMundo)(vaelhorn_1.conteudoVaelhorn, c);
    assert((c.npcState.tanjiro.vida ?? 0) > 40);
    assert(c.npcState.tanjiro.tensao < tensao);
});
console.log(`${testes} testes de integração Kimetsu/continuidade passaram.`);
