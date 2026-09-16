"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cruzarRotinas = cruzarRotinas;
exports.periodoQualquer = periodoQualquer;
exports.ecosRecentes = ecosRecentes;
const rng_1 = require("./rng");
const time_1 = require("./time");
const elenco_1 = require("./elenco");
const historiaViva_1 = require("./historiaViva");
// Onde cada uma está num período (mesma regra da disponibilidade — GDD §10.3).
function ondeEsta(npc, periodo) {
    return npc.rotina[periodo] ?? npc.localBase;
}
// O que costuma acontecer quando essas duas se esbarram.
const ENCONTROS = {
    rival: {
        texto: [
            '{A} e {B} trocaram desaforo em {L}, e o resto calou para ouvir',
            '{A} virou as costas para {B} em {L} sem disfarçar',
            '{B} derrubou a caneca de {A} em {L} e não pediu desculpa',
        ],
        tensaoA: 8,
        tensaoB: 8,
        disposicao: -2,
    },
    aliada: {
        texto: [
            '{A} e {B} passaram a tarde juntas em {L}, rindo do que ninguém entendeu',
            '{A} cobriu o turno de {B} em {L}',
            '{B} dividiu o pão com {A} em {L}',
        ],
        tensaoA: -10,
        tensaoB: -10,
        disposicao: 2,
    },
    amante: {
        texto: [
            '{A} e {B} sumiram juntas de {L} por um bom tempo',
            'alguém viu {A} sair de {L} pela porta dos fundos, e {B} logo atrás',
            '{A} e {B} não se falaram em {L}, o que é pior do que se tivessem falado',
        ],
        tensaoA: -14,
        tensaoB: -14,
        disposicao: 3,
    },
    devedora: {
        texto: [
            '{B} cobrou {A} na frente de todo mundo em {L}',
            '{A} evitou {B} a manhã inteira em {L}',
            '{B} deixou um recado com quem estava em {L}, para {A} entender',
        ],
        tensaoA: 12,
        tensaoB: 2,
        disposicao: -3,
    },
    protege: {
        texto: [
            '{A} tirou {B} de uma confusão em {L}',
            '{A} não deixou ninguém encostar em {B} em {L}',
            '{A} levou {B} para casa de {L} quando a coisa esquentou',
        ],
        tensaoA: -6,
        tensaoB: -12,
        disposicao: 3,
    },
    desconfia: {
        texto: [
            '{A} ficou de olho em {B} o tempo todo em {L}',
            '{A} perguntou por {B} em {L} a quem não devia',
            '{B} percebeu que {A} a estava medindo em {L}',
        ],
        tensaoA: 4,
        tensaoB: 6,
        disposicao: -1,
    },
    sangue: {
        texto: [
            '{A} e {B} discutiram coisa de família em {L}, e nenhuma cedeu',
            '{A} e {B} ficaram caladas lado a lado em {L}, do jeito que só parente fica',
            '{B} lembrou {A} de uma dívida velha em {L} que não é de dinheiro',
        ],
        tensaoA: 3,
        tensaoB: 3,
        disposicao: 0,
    },
};
function registrarEco(camp, local, texto, npcs) {
    const lista = camp.ecos ?? (camp.ecos = []);
    lista.push({ turno: camp.turno, dia: camp.calendario.dia, local, texto, npcs });
    // O boato envelhece: o vale não guarda mais que isso na boca do povo.
    if (lista.length > 12)
        lista.shift();
}
// Roda um período de convívio. Chamada uma vez por dia (ver mundo.ts): o vale
// não precisa simular as vinte e quatro horas para parecer vivo.
function cruzarRotinas(content, camp, periodo) {
    const porLocal = new Map();
    for (const npc of (0, elenco_1.todosNpcs)(content, camp)) {
        if (!camp.npcState[npc.id]?.vivo)
            continue;
        const onde = (0, historiaViva_1.localEfetivo)(camp, npc, periodo, content);
        if (!onde || camp.vivo?.pessoas[npc.id]?.objetivo === 'cativo')
            continue;
        const arr = porLocal.get(onde) ?? [];
        arr.push(npc);
        porLocal.set(onde, arr);
    }
    for (const [localId, gente] of porLocal) {
        if (gente.length < 2)
            continue;
        const nomeLocal = content.locais.find((l) => l.id === localId)?.nome ?? localId;
        for (const a of gente) {
            for (const laco of a.relacoes ?? []) {
                const b = gente.find((x) => x.id === laco.npc);
                if (!b)
                    continue; // ela não está aqui agora
                // Nem todo encontro vira acontecimento — senão o vale vira novela.
                if ((0, rng_1.nextFloat)(camp.rng) > 0.3)
                    continue;
                const regra = ENCONTROS[laco.tipo];
                const dinA = camp.npcState[a.id];
                const dinB = camp.npcState[b.id];
                if (!dinA || !dinB)
                    continue;
                dinA.tensao = Math.max(0, Math.min(100, dinA.tensao + regra.tensaoA));
                dinB.tensao = Math.max(0, Math.min(100, dinB.tensao + regra.tensaoB));
                // O humor delas com o jogador também balança: gente contente é mais
                // fácil de abordar do que gente que acabou de brigar.
                for (const d of [dinA, dinB]) {
                    if (d.eixos.disposicao !== undefined) {
                        d.eixos.disposicao = Math.max(-20, Math.min(20, d.eixos.disposicao + regra.disposicao));
                    }
                }
                const molde = (0, rng_1.pick)(camp.rng, regra.texto);
                registrarEco(camp, localId, molde.replace('{A}', a.nome).replace('{B}', b.nome).replace('{L}', nomeLocal), [a.id, b.id]);
            }
        }
    }
}
// Sorteia o período do dia em que o vale foi observado.
function periodoQualquer(camp) {
    return (0, rng_1.pick)(camp.rng, [...time_1.PERIODOS]);
}
// O que a boca do povo anda repetindo. Vai para o narrador e para quem
// perguntar por aí.
function ecosRecentes(camp, quantos = 4, localId) {
    const todos = camp.ecos ?? [];
    const filtrados = localId ? todos.filter((e) => e.local === localId) : todos;
    const base = filtrados.length > 0 ? filtrados : todos;
    return base.slice(-quantos).map((e) => `dia ${e.dia}: ${e.texto}`);
}
