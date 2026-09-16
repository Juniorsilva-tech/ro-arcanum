"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOME_NATUREZA = void 0;
exports.penalidadeEstado = penalidadeEstado;
exports.chanceDe = chanceDe;
exports.lerChance = lerChance;
exports.avaliarOpcao = avaliarOpcao;
exports.ehNatureza = ehNatureza;
exports.inferirNatureza = inferirNatureza;
const resolution_1 = require("./resolution");
const impulsos_1 = require("./impulsos");
// Penalidade de estado, num lugar só — o risco mostrado tem que ser calculado
// com exatamente os mesmos modificadores da resolução, ou a tela mente.
function penalidadeEstado(camp) {
    let pen = (0, impulsos_1.penalidadePorImpulsos)(camp);
    const c = camp.personagem.condicoes;
    if (c.includes('ferido'))
        pen += 2;
    if (c.includes('exausto'))
        pen += 2;
    if (c.includes('bebado'))
        pen += 3;
    return pen;
}
function chanceDe(content, camp, teste) {
    const p = camp.personagem;
    const C = (0, resolution_1.competencia)({
        atributo: p.atributos[teste.atributo],
        pericia: teste.pericia ? p.pericias[teste.pericia] ?? 0 : 0,
        penalidadeEstado: penalidadeEstado(camp),
        dificuldade: teste.dificuldade,
    });
    return (0, resolution_1.probabilidade)(C, teste.dificuldade, content.cenario.k);
}
// A escada de chance. Cinco degraus, porque cinco é o que se lê de relance.
function lerChance(p) {
    if (p >= 0.85)
        return 'quase certo';
    if (p >= 0.65)
        return 'a favor';
    if (p >= 0.45)
        return 'no fio';
    if (p >= 0.25)
        return 'contra você';
    return 'quase impossível';
}
// O que a opção pede e o que ela pode cobrar.
function avaliarOpcao(content, camp, op, ctx) {
    const out = {};
    if (op.teste) {
        const p = chanceDe(content, camp, op.teste);
        out.chance = lerChance(p);
        // A falha grave é a última fatia da banda de fracasso (GDD §2.2).
        const grave = (1 - p) * 0.15;
        if (grave >= 0.12)
            out.perigo = 'pode desandar feio';
        else if (grave >= 0.06)
            out.perigo = 'tem como dar errado';
    }
    if (op.custoPeriodos >= 3)
        out.custo = 'toma o dia';
    else if (op.custoPeriodos === 2)
        out.custo = 'leva um bom tempo';
    else if (op.custoPeriodos === 1)
        out.custo = 'gasta um período';
    // Olhos mudam o preço do que é feio.
    if (ctx && ctx.testemunhas >= 3 && out.perigo)
        out.perigo = 'e tem gente vendo';
    return out;
}
exports.NOME_NATUREZA = {
    avancar: 'seguir em frente',
    arriscar: 'pôr a mão no fogo',
    aproximar: 'chegar perto',
    observar: 'olhar antes',
    ganhar: 'tirar proveito',
};
const NATUREZAS = ['avancar', 'arriscar', 'aproximar', 'observar', 'ganhar'];
function ehNatureza(v) {
    return typeof v === 'string' && NATUREZAS.includes(v);
}
// Quando o modelo não declara, a engine deduz pelo teste que ele mesmo propôs.
function inferirNatureza(op) {
    const a = op.teste?.atributo;
    if (a === 'social')
        return 'aproximar';
    if (a === 'percepcao' || a === 'raciocinio')
        return 'observar';
    if (a === 'fisico' || a === 'resiliencia')
        return 'arriscar';
    if (a === 'precisao')
        return 'ganhar';
    return 'avancar';
}
