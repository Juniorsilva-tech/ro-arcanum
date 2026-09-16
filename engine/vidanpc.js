"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIAS_POR_ANO = void 0;
exports.idadeAtual = idadeAtual;
exports.resolverRivalidadeDeFundo = resolverRivalidadeDeFundo;
exports.processarVidaDeFundo = processarVidaDeFundo;
const rng_1 = require("./rng");
const memoria_1 = require("./memoria");
const elenco_1 = require("./elenco");
const familia_1 = require("./familia");
exports.DIAS_POR_ANO = 365;
const IDADE_MORTE_MIN = 65;
const IDADE_MORTE_CHANCE_MAX = 0.35;
const CHANCE_DRAMA_DIARIA = 0.05;
// Idade efetiva NESTA campanha — pode já ter andado além da idade estática
// do conteúdo, se o calendário já correu um ano ou mais.
function idadeAtual(camp, npc) {
    return camp.npcState[npc.id]?.idade ?? npc.idade;
}
// Chamada uma vez por ano de calendário virado. Cada NPC viva envelhece um
// ano; passado os 65, corre um risco real de não acordar mais — sem
// combate, sem drama de cena, só o peso do tempo, do jeito que o resto do
// mundo também sente.
function envelhecerTodos(content, camp) {
    for (const npc of [...content.npcs, ...(camp.npcsProcedurais ?? [])]) {
        const din = camp.npcState[npc.id];
        if (!din || !din.vivo || npc.especie === 'oni')
            continue;
        const idade = idadeAtual(camp, npc) + 1;
        din.idade = idade;
        if (idade < IDADE_MORTE_MIN)
            continue;
        const chance = Math.min(IDADE_MORTE_CHANCE_MAX, (idade - IDADE_MORTE_MIN) * 0.02);
        if ((0, rng_1.nextFloat)(camp.rng) < chance) {
            din.vivo = false;
            (0, familia_1.registrarMorteFamiliar)(camp, npc.id);
            (0, memoria_1.registrarMarco)(camp, `dia ${camp.calendario.dia}: ${npc.nome} morreu de velhice, com ${idade} anos.`);
        }
    }
}
// Rivalidade que já azedou de verdade (tensão alta nos dois lados) tem uma
// chance pequena de virar acontecimento: na maioria das vezes esfria
// sozinha; raro, vira ruptura definitiva; raríssimo, alguém não sobrevive.
function resolverRivalidadeDeFundo(rng) {
    const r = (0, rng_1.nextFloat)(rng);
    if (r < 0.55)
        return 'paz';
    if (r < 0.94)
        return 'racha';
    return 'morte';
}
// Junta os pares vivos que têm um dos laços pedidos entre si — olhando pros
// dois lados da relação (às vezes só uma delas lista a outra), sem repetir
// o mesmo par duas vezes no mesmo dia.
function paresElegiveis(content, camp, tipos) {
    const vistos = new Set();
    const pares = [];
    const elenco = (0, elenco_1.todosNpcs)(content, camp);
    for (const a of elenco) {
        if (!camp.npcState[a.id]?.vivo)
            continue;
        for (const laco of a.relacoes ?? []) {
            if (!tipos.includes(laco.tipo))
                continue;
            const b = elenco.find((n) => n.id === laco.npc);
            if (!b || !camp.npcState[b.id]?.vivo)
                continue;
            const chave = [a.id, b.id].sort().join('|');
            if (vistos.has(chave))
                continue;
            vistos.add(chave);
            pares.push({ a, b, tipo: laco.tipo });
        }
    }
    return pares;
}
// Rivalidade que já está no limite (tensão alta nos dois lados) de vez em
// quando estoura de verdade — e a resolução mexe no estado das duas, não só
// no texto.
function processarRivalidades(content, camp) {
    const pares = paresElegiveis(content, camp, ['rival']).filter((p) => !(camp.grupo ?? []).includes(p.a.id) && !(camp.grupo ?? []).includes(p.b.id) &&
        (camp.npcState[p.a.id]?.tensao ?? 0) >= 65 && (camp.npcState[p.b.id]?.tensao ?? 0) >= 65);
    if (pares.length === 0)
        return;
    if ((0, rng_1.nextFloat)(camp.rng) >= CHANCE_DRAMA_DIARIA)
        return;
    const par = (0, rng_1.pick)(camp.rng, pares);
    const resultado = resolverRivalidadeDeFundo(camp.rng);
    const dinA = camp.npcState[par.a.id];
    const dinB = camp.npcState[par.b.id];
    const hoje = camp.calendario.dia;
    if (resultado === 'paz') {
        dinA.tensao = Math.max(0, dinA.tensao - 40);
        dinB.tensao = Math.max(0, dinB.tensao - 40);
        (0, memoria_1.registrarMarco)(camp, `dia ${hoje}: ${par.a.nome} e ${par.b.nome} fizeram as pazes, do jeito estranho que rivais fazem.`);
    }
    else if (resultado === 'racha') {
        dinA.tensao = 100;
        dinB.tensao = 100;
        for (const d of [dinA, dinB]) {
            if (d.eixos.disposicao !== undefined)
                d.eixos.disposicao = Math.max(-20, d.eixos.disposicao - 6);
        }
        (0, memoria_1.registrarMarco)(camp, `dia ${hoje}: ${par.a.nome} e ${par.b.nome} romperam de vez — não se falam mais.`);
    }
    else {
        const perdedor = (0, rng_1.pick)(camp.rng, [par.a, par.b]);
        const vencedor = perdedor.id === par.a.id ? par.b : par.a;
        camp.npcState[perdedor.id].vivo = false;
        (0, familia_1.registrarMorteFamiliar)(camp, perdedor.id);
        (0, memoria_1.registrarMarco)(camp, `dia ${hoje}: ${perdedor.nome} não sobreviveu à rixa com ${vencedor.nome}.`);
    }
}
// Vínculo que já vem forte (tensão baixa, disposição alta) de vez em quando
// se aprofunda de verdade — não muda a régua além do que já mudaria
// sozinho, só marca que aconteceu, pra o narrador poder citar depois.
function processarAproximacoes(content, camp) {
    const pares = paresElegiveis(content, camp, ['aliada', 'amante']).filter((p) => {
        const dinA = camp.npcState[p.a.id];
        const dinB = camp.npcState[p.b.id];
        return (dinA.tensao <= 15 &&
            dinB.tensao <= 15 &&
            (dinA.eixos.disposicao ?? 0) >= 15 &&
            (dinB.eixos.disposicao ?? 0) >= 15);
    });
    if (pares.length === 0)
        return;
    if ((0, rng_1.nextFloat)(camp.rng) >= CHANCE_DRAMA_DIARIA)
        return;
    const par = (0, rng_1.pick)(camp.rng, pares);
    const hoje = camp.calendario.dia;
    const texto = par.tipo === 'amante'
        ? `dia ${hoje}: ${par.a.nome} e ${par.b.nome} assumiram o que já era claro pra todo mundo.`
        : `dia ${hoje}: ${par.a.nome} e ${par.b.nome} andam inseparáveis — todo mundo no vale já notou.`;
    (0, memoria_1.registrarMarco)(camp, texto);
}
// Chamada de dentro de avancarMundo, uma vez por dia virado. Envelhecimento
// só roda quando um ano inteiro já passou desde o último; o drama de fundo
// roda (com chance baixa) todo dia — a maioria não dá em nada, do jeito que
// a vida de verdade é.
function processarVidaDeFundo(content, camp) {
    const m = camp.mundo;
    const hoje = camp.calendario.dia;
    if ((m?.proximoEnvelhecimento ?? exports.DIAS_POR_ANO) <= hoje) {
        envelhecerTodos(content, camp);
        if (m)
            m.proximoEnvelhecimento = hoje + exports.DIAS_POR_ANO;
    }
    processarRivalidades(content, camp);
    processarAproximacoes(content, camp);
}
