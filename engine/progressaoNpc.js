"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inicializarProgressaoNpc = inicializarProgressaoNpc;
exports.fichaCombatente = fichaCombatente;
exports.treinarNpc = treinarNpc;
exports.migrarProgressaoNpcs = migrarProgressaoNpcs;
exports.retratoProgressaoNpc = retratoProgressaoNpc;
const rng_1 = require("./rng");
const aptidao_1 = require("./aptidao");
function potencial(camp, npc) {
    const rng = (0, rng_1.createRng)((0, rng_1.seedFromString)(`aptidao-npc:${camp.rng.seed}:${npc.id}`));
    const parente = camp.familia?.membros.find(m => m.id === npc.id);
    return parente?.prodigio ? 95 + Math.floor((0, rng_1.nextFloat)(rng) * 5) : 20 + Math.floor((0, rng_1.nextFloat)(rng) * 76);
}
function inicializarProgressaoNpc(camp, npc) {
    const din = camp.npcState[npc.id];
    if (!din || !npc.combatente)
        return;
    // A saved veteran retains old skill gains, without retroactive XP or moving RNG.
    return din.progressao ??= {
        versao: 1, aptidao: potencial(camp, npc),
        esforco: Math.max(0, (camp.vivo?.pessoas[npc.id]?.habilidade ?? 5) - 5) * 12,
        experiencia: 0, sessoes: 0,
    };
}
function fichaCombatente(camp, npc) {
    if (!npc.combatente)
        return;
    const base = npc.combatente, e = camp.npcState[npc.id]?.progressao;
    const maestria = (0, aptidao_1.maestriaPorEsforco)(e?.esforco ?? 0);
    const patamar = Math.min(20, Math.floor(Math.sqrt((e?.experiencia ?? 0) / 30)));
    const praticaAntiga = Math.floor((camp.vivo?.pessoas[npc.id]?.habilidade ?? 5) / 5) - 1;
    return {
        ...base,
        vida: Math.round(base.vida * (1 + maestria / 250) + patamar * 3),
        acerto: base.acerto + praticaAntiga + Math.floor(maestria / 25) + Math.floor(patamar / 5),
        defesa: base.defesa + Math.floor(maestria / 20) + Math.floor(patamar / 5),
        dano: { ...base.dano, base: base.dano.base * (1 + maestria / 200) + patamar / 3 },
    };
}
function treinarNpc(camp, npc, esforco = 1, experiencia = 0) {
    const din = camp.npcState[npc.id];
    if (!din?.vivo || (din.idade ?? npc.idade) < 18 || camp.vivo?.pessoas[npc.id]?.objetivo === 'cativo')
        return false;
    const e = inicializarProgressaoNpc(camp, npc);
    if (!e)
        return false;
    const antes = fichaCombatente(camp, npc);
    const vida = din.vida ?? antes.vida;
    if (vida <= 0)
        return false;
    const saude = Math.max(.1, Math.min(1, vida / antes.vida));
    const teto = (0, aptidao_1.maestriaPorEsforco)(e.esforco) > (0, aptidao_1.tetoConfortavel)(e.aptidao) ? .15 : 1;
    e.esforco += Math.max(0, Math.min(5, esforco)) * (0.5 + e.aptidao / 50) * saude * teto;
    e.experiencia += Math.max(0, Math.min(100, experiencia));
    e.sessoes++;
    const depois = fichaCombatente(camp, npc);
    din.vida = Math.min(depois.vida, Math.max(1, Math.round(depois.vida * vida / antes.vida)));
    return true;
}
function migrarProgressaoNpcs(content, camp) {
    for (const n of [...content.npcs, ...(camp.npcsProcedurais ?? [])]) {
        if (camp.npcState[n.id]?.progressao || !n.combatente)
            continue;
        const antiga = fichaCombatente(camp, n);
        const vida = camp.npcState[n.id]?.vida;
        inicializarProgressaoNpc(camp, n);
        if (vida !== undefined && vida > 0)
            camp.npcState[n.id].vida = Math.round(vida / antiga.vida * fichaCombatente(camp, n).vida);
    }
}
// Only earned skill and training history are observable; never birth potential.
function retratoProgressaoNpc(camp, npc) {
    const e = camp.npcState[npc.id]?.progressao;
    const ficha = fichaCombatente(camp, npc);
    if (!ficha)
        return;
    return { maestria: Math.round((0, aptidao_1.maestriaPorEsforco)(e?.esforco ?? 0)), sessoes: e?.sessoes ?? 0, vidaMax: ficha.vida, acerto: ficha.acerto, defesa: ficha.defesa, dano: Math.round(ficha.dano.base * 10) / 10 };
}
