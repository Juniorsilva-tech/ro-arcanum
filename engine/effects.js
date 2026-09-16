"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aplicarEfeito = aplicarEfeito;
exports.substituirAlvo = substituirAlvo;
const resolution_1 = require("./resolution");
const progresso_1 = require("./progresso");
function clamp100(v) {
    return Math.max(0, Math.min(100, v));
}
function aplicarEfeito(camp, ef) {
    const p = camp.personagem;
    switch (ef.tipo) {
        case 'recurso':
            p.recursos[ef.recurso] = (p.recursos[ef.recurso] ?? 0) + ef.delta;
            break;
        case 'pressao':
            p.pressoes[ef.pressao] = (p.pressoes[ef.pressao] ?? 0) + ef.delta;
            break;
        case 'impulso':
            camp.impulsos[ef.impulso] = clamp100((camp.impulsos[ef.impulso] ?? 0) + ef.delta);
            break;
        case 'relacao': {
            const din = camp.npcState[ef.npc];
            if (din)
                din.eixos[ef.eixo] = (din.eixos[ef.eixo] ?? 0) + ef.delta;
            break;
        }
        case 'reputacao':
            camp.reputacao[ef.faccao] = (camp.reputacao[ef.faccao] ?? 0) + ef.delta;
            break;
        case 'dinheiro':
            p.dinheiro = Math.max(0, p.dinheiro + ef.delta);
            break;
        case 'xp':
            p.xp += ef.delta;
            (0, progresso_1.processarSubidaDeNivel)(camp);
            break;
        case 'flag':
            camp.flags[ef.chave] = ef.valor;
            break;
        case 'item':
            p.inventario[ef.item] = Math.max(0, (p.inventario[ef.item] ?? 0) + ef.delta);
            if (p.inventario[ef.item] === 0)
                delete p.inventario[ef.item];
            break;
        case 'revelarSegredo':
            if (!camp.segredosRevelados.includes(ef.npc))
                camp.segredosRevelados.push(ef.npc);
            break;
        case 'condicao':
            if (ef.adicionar) {
                if (!p.condicoes.includes(ef.condicao))
                    p.condicoes.push(ef.condicao);
            }
            else {
                p.condicoes = p.condicoes.filter((c) => c !== ef.condicao);
            }
            break;
        case 'danoJogador': {
            const dano = (0, resolution_1.calcularDano)(camp.rng, ef.perfil);
            p.recursos.vida = (p.recursos.vida ?? 0) - dano.valor;
            break;
        }
    }
}
// Substitui o placeholder "$alvo" pelo NPC realmente alvejado.
function substituirAlvo(efeitos, alvoId) {
    return efeitos.map((ef) => {
        if ('npc' in ef && ef.npc === '$alvo') {
            return { ...ef, npc: alvoId ?? ef.npc };
        }
        if (ef.tipo === 'flag' && ef.chave.includes('$alvo')) {
            return { ...ef, chave: ef.chave.replace('$alvo', alvoId ?? 'alvo') };
        }
        return ef;
    });
}
