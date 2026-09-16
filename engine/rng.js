"use strict";
// ARCANUM · RNG determinístico com semente + cursor.
// Mesma semente e mesmo cursor produzem exatamente a mesma sequência.
// Isso permite save/load honesto, replay e bug reproduzível (GDD §2.5).
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedFromString = seedFromString;
exports.createRng = createRng;
exports.nextFloat = nextFloat;
exports.nextInt = nextInt;
exports.pick = pick;
// Hash de string -> semente numérica (32 bits). Estável entre plataformas.
function seedFromString(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
// mulberry32 — rápido, determinístico, suficiente para um RPG.
function mulberry32(a) {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function createRng(seed, cursor = 0) {
    return { seed: seed >>> 0, cursor };
}
// Retorna [0,1) e AVANÇA o cursor. A verdade do RNG é {seed, cursor}.
function nextFloat(rng) {
    // Combina semente e cursor num único inteiro antes de gerar,
    // para que o cursor caminhe de forma imprevisível mas reproduzível.
    const mixed = (rng.seed ^ Math.imul(rng.cursor + 1, 0x9e3779b1)) >>> 0;
    rng.cursor += 1;
    return mulberry32(mixed);
}
// Inteiro em [min, max] inclusivo.
function nextInt(rng, min, max) {
    return min + Math.floor(nextFloat(rng) * (max - min + 1));
}
// Escolhe um elemento de um array (não vazio).
function pick(rng, arr) {
    return arr[Math.floor(nextFloat(rng) * arr.length)];
}
