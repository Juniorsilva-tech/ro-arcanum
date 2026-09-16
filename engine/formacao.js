"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processarFormacao = processarFormacao;
const rng_1 = require("./rng");
const historiaViva_1 = require("./historiaViva");
const progressaoNpc_1 = require("./progressaoNpc");
// Only campaign-owned people can acquire a new sheet. Never mutate the catalogue.
function processarFormacao(content, camp, npc) {
    if (!camp.npcsProcedurais?.includes(npc) || npc.combatente || npc.especie === 'oni')
        return false;
    const p = camp.vivo?.pessoas[npc.id], din = camp.npcState[npc.id];
    if (!p || !din?.vivo || din.vida === 0 || (din.idade ?? npc.idade) < 18 || p.objetivo === 'cativo' || p.viagem)
        return false;
    if (!p.formacao) {
        const oficioMarcial = /soldado|espada|caçador|caçadora|batedor|herói/.test(npc.ocupacao);
        const rng = (0, rng_1.createRng)((0, rng_1.seedFromString)(`vocacao:${camp.rng.seed}:${npc.id}`));
        p.formacao = { caminho: oficioMarcial || (0, rng_1.nextFloat)(rng) < .25 ? 'guarda' : 'civil', sessoes: 0, concluida: false };
    }
    const f = p.formacao;
    if (f.caminho === 'civil' || f.concluida || p.saude < 65 || p.fome > 40 || p.moedas < 8)
        return false;
    const mentor = [...content.npcs, ...(camp.npcsProcedurais ?? [])].find(n => {
        const estado = camp.npcState[n.id], civil = camp.vivo?.pessoas[n.id];
        return n.id !== npc.id && n.combatente && n.especie !== 'oni' && estado?.vivo
            && (estado.vida ?? n.combatente.vida) > 0 && (estado.idade ?? n.idade) >= 18
            && (civil?.saude ?? 100) >= 65 && (civil?.fome ?? 0) <= 40
            && civil?.objetivo !== 'cativo' && !civil?.viagem
            && (0, historiaViva_1.localEfetivo)(camp, n, undefined, content) === (0, historiaViva_1.localEfetivo)(camp, npc, undefined, content);
    });
    if (!mentor)
        return false;
    f.mentor = mentor.id;
    f.sessoes++;
    p.moedas--;
    p.objetivo = 'treinar';
    if (f.sessoes === 1)
        (0, historiaViva_1.registrarFato)(camp, { tipo: 'aprendizado_npc', local: p.local, texto: `${npc.nome} começou a aprender defesa com ${mentor.nome}.`, atores: [npc.id, mentor.id], publico: true });
    if (f.sessoes >= 20) {
        f.concluida = true;
        npc.combatente = { vida: 32, defesa: 12, acerto: 12, dano: { base: 5, dispersao: .25, tipo: 'corte' }, tecnicas: [] };
        (0, progressaoNpc_1.inicializarProgressaoNpc)(camp, npc);
        din.vida = Math.max(1, Math.round((0, progressaoNpc_1.fichaCombatente)(camp, npc).vida * p.saude / 100));
        (0, historiaViva_1.registrarFato)(camp, { tipo: 'formacao_concluida', local: p.local, texto: `${npc.nome} concluiu o treinamento básico e agora pode atuar na defesa e acompanhar expedições. Seu ofício anterior permanece parte da sua história.`, atores: [npc.id, mentor.id], publico: true });
    }
    return true;
}
