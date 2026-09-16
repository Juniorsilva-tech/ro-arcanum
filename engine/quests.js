"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarQuests = verificarQuests;
const memoria_1 = require("./memoria");
const progresso_1 = require("./progresso");
// Ativa missões cujo dador você já conheceu, e conclui as que tiveram todos os
// objetivos (flags) cumpridos, entregando a recompensa. Retorna títulos concluídos.
function verificarQuests(content, camp) {
    // Ativação por contato com o dador.
    for (const q of content.quests) {
        if (camp.questEstado[q.id] !== 'desconhecida')
            continue;
        if (!q.dador) {
            camp.questEstado[q.id] = 'ativa';
            continue;
        }
        const din = camp.npcState[q.dador];
        if (din && din.memoria.length > 0)
            camp.questEstado[q.id] = 'ativa';
    }
    const concluidas = [];
    for (const q of content.quests) {
        if (camp.questEstado[q.id] !== 'ativa')
            continue;
        const completa = q.objetivos.every((o) => !!camp.flags[o.flag]);
        if (!completa)
            continue;
        camp.questEstado[q.id] = 'concluida';
        const p = camp.personagem;
        if (q.recompensa.dinheiro)
            p.dinheiro += q.recompensa.dinheiro;
        if (q.recompensa.xp) {
            p.xp += q.recompensa.xp;
            (0, progresso_1.processarSubidaDeNivel)(camp);
        }
        if (q.recompensa.item)
            p.inventario[q.recompensa.item] = (p.inventario[q.recompensa.item] ?? 0) + 1;
        for (const r of q.recompensa.reputacao ?? []) {
            camp.reputacao[r.faccaoId] = (camp.reputacao[r.faccaoId] ?? 0) + r.delta;
        }
        (0, memoria_1.registrarMarco)(camp, `você cumpriu "${q.titulo}"`);
        concluidas.push(q.titulo);
    }
    return concluidas;
}
