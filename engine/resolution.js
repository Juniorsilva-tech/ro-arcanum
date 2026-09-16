"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIFICULDADE = exports.NOME_GRAU = void 0;
exports.probabilidade = probabilidade;
exports.grauDeResultado = grauDeResultado;
exports.competencia = competencia;
exports.resolverTeste = resolverTeste;
exports.calcularDano = calcularDano;
// ARCANUM · Resolução SEM DADOS (GDD §2). Curva logística + cinco graus.
const rng_1 = require("./rng");
// p = 1 / (1 + e^(−(C − D) / k))
function probabilidade(C, D, k = 4) {
    return 1 / (1 + Math.exp(-(C - D) / k));
}
exports.NOME_GRAU = {
    critico: 'crítico',
    sucesso: 'sucesso',
    sucesso_com_custo: 'sucesso com custo',
    falha: 'falha',
    falha_grave: 'falha grave',
};
// Cinco graus a partir de um sorteio r contra p (GDD §2.2).
function grauDeResultado(p, r) {
    if (r < p * 0.25)
        return 'critico';
    if (r < p)
        return 'sucesso';
    if (r < p + (1 - p) * 0.35)
        return 'sucesso_com_custo';
    if (r < p + (1 - p) * 0.85)
        return 'falha';
    return 'falha_grave';
}
// C = atributo + 2×perícia + equipamento + circunstância − penalidade_de_estado (GDD §2.1)
function competencia(e) {
    const vant = (e.vantagem ?? 0) * 3;
    return (e.atributo +
        2 * (e.pericia ?? 0) +
        (e.equipamento ?? 0) +
        (e.circunstancia ?? 0) -
        (e.penalidadeEstado ?? 0) +
        vant);
}
function resolverTeste(rng, e) {
    const C = competencia(e);
    const D = e.dificuldade;
    const p = probabilidade(C, D, e.k ?? 4);
    const r = (0, rng_1.nextFloat)(rng);
    const grau = grauDeResultado(p, r);
    return {
        C,
        D,
        p,
        r,
        grau,
        sucesso: grau === 'critico' || grau === 'sucesso' || grau === 'sucesso_com_custo',
    };
}
function calcularDano(rng, perfil, critico = false) {
    const r2 = (0, rng_1.nextFloat)(rng);
    let base = perfil.base;
    if (critico)
        base *= 1.75;
    const valor = base * (1 + (r2 - 0.5) * 2 * perfil.dispersao);
    return { valor: Math.max(1, Math.round(valor)), tipo: perfil.tipo };
}
// Faixas de dificuldade nomeadas (GDD §2.1).
exports.DIFICULDADE = {
    trivial: 6,
    facil: 10,
    media: 14,
    dificil: 18,
    severa: 22,
    quase_impossivel: 26,
};
