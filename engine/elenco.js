"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.todosNpcs = todosNpcs;
exports.npcPorId = npcPorId;
// A campanha pode criar pessoas que não existem no catálogo, como a família
// do protagonista. Menores continuam no estado familiar, mas não entram nas
// interações gerais nem no pacote do narrador adulto.
function todosNpcs(content, camp) {
    return [...content.npcs, ...(camp.npcsProcedurais ?? [])].filter(n => {
        return (camp.npcState[n.id]?.idade ?? n.idade) >= 18;
    });
}
function npcPorId(content, camp, id) {
    return todosNpcs(content, camp).find(n => n.id === id);
}
