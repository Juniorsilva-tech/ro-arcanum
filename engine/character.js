"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATRIBUTO_BASE = void 0;
exports.modificador = modificador;
exports.derivados = derivados;
exports.atributosBase = atributosBase;
exports.criarPersonagem = criarPersonagem;
exports.recursoMaximo = recursoMaximo;
exports.clampRecursos = clampRecursos;
function modificador(attr) {
    return Math.floor((attr - 10) / 2);
}
function derivados(p, bonusDefesa = 0) {
    const a = p.atributos;
    return {
        defesa: 10 + modificador(a.precisao) + modificador(a.resiliencia) + bonusDefesa,
        iniciativa: modificador(a.precisao) + modificador(a.percepcao),
        acerto: p.nivel + modificador(a.precisao),
        poder: p.nivel + modificador(a.raciocinio),
        dificuldadeImposta: 10 + p.nivel + modificador(a.social),
        cargaMax: a.fisico * 7,
        deslocamento: 6 + modificador(a.precisao),
        percepcaoPassiva: 10 + modificador(a.percepcao),
    };
}
exports.ATRIBUTO_BASE = 10;
// Distribuição inicial (point-buy simples resolvido no criador de UI).
function atributosBase() {
    return {
        fisico: exports.ATRIBUTO_BASE,
        precisao: exports.ATRIBUTO_BASE,
        resiliencia: exports.ATRIBUTO_BASE,
        raciocinio: exports.ATRIBUTO_BASE,
        percepcao: exports.ATRIBUTO_BASE,
        social: exports.ATRIBUTO_BASE,
    };
}
function somaAttr(base, bonus) {
    const out = { ...base };
    Object.keys(bonus).forEach((k) => {
        out[k] = (out[k] ?? 0) + (bonus[k] ?? 0);
    });
    return out;
}
function criarPersonagem(nome, atributos, classe, origem, cenario) {
    const attrFinal = somaAttr(somaAttr(atributos, classe.bonusAtributos), origem.bonusAtributos);
    const recursos = { vida: 0 };
    const recursosMax = { vida: 0 };
    const vidaMax = 20 + modificador(attrFinal.resiliencia) * 4;
    recursos.vida = vidaMax;
    recursosMax.vida = vidaMax;
    cenario.recursos.forEach((r) => {
        const max = recursoMaximo(r.id, attrFinal);
        recursos[r.id] = max;
        recursosMax[r.id] = max;
    });
    const pressoes = {};
    cenario.pressoes.forEach((pr) => {
        pressoes[pr.id] = 0;
    });
    return {
        nome,
        classeId: classe.id,
        origemId: origem.id,
        nivel: 1,
        xp: 0,
        atributos: attrFinal,
        recursos,
        recursosMax,
        pressoes,
        dinheiro: origem.dinheiroInicial,
        pericias: { ...classe.periciasIniciais },
        inventario: { ...(classe.itensIniciais ?? {}) },
        equipado: { ...(classe.equipInicial ?? {}) },
        artesConhecidas: [...(classe.artesIniciais ?? [])],
        alcunhas: [],
        cicatrizes: [],
        condicoes: [],
        idade: 20,
    };
}
function recursoMaximo(id, a) {
    switch (id) {
        case 'mana':
            return 8 + modificador(a.raciocinio) * 3;
        case 'vigor':
            return 10 + modificador(a.fisico) * 2 + modificador(a.resiliencia) * 2;
        default:
            return 10;
    }
}
function clampRecursos(p) {
    for (const k of Object.keys(p.recursos)) {
        const max = p.recursosMax[k] ?? p.recursos[k];
        p.recursos[k] = Math.max(0, Math.min(max, p.recursos[k]));
    }
    for (const k of Object.keys(p.pressoes)) {
        p.pressoes[k] = Math.max(0, Math.min(100, p.pressoes[k]));
    }
}
