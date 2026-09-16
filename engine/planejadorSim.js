"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pontuarRotaPlanejador = pontuarRotaPlanejador;
exports.planejarMissao = planejarMissao;
const missoesVivas_1 = require("./missoesVivas");
const time_1 = require("./time");
const items_1 = require("./items");
const viagem_1 = require("./viagem");
/** Custo de apresentação para o agente do mundo, não custo da viagem física. */
function pontuarRotaPlanejador(content, camp, origem, rota, restantePeriodos) {
    const tempo = Math.max(1, rota.periodos);
    const perigo = (0, viagem_1.perigoEfetivoDaRota)(content, camp, origem, rota.destino, rota.perigo);
    const vida = camp.personagem.recursos.vida ?? 0;
    const vidaMax = camp.personagem.recursosMax.vida ?? 1;
    const ferido = vidaMax > 0 && vida / vidaMax < 0.5;
    // Prazo apertado vence segurança; com folga, uma pessoa ferida evita risco.
    const urgente = restantePeriodos <= time_1.PERIODOS.length * 2;
    const pesoPerigo = urgente ? 0.15 : ferido ? 2.5 : 0.8;
    return tempo + perigo * pesoPerigo;
}
// Only public mission information; no access to hidden aptitude or rival positions.
function planejarMissao(content, camp) {
    const dia = camp.calendario.dia;
    const abertas = (camp.vivo?.missoes ?? []).filter(q => q.conhecida && q.prazo >= dia && ['aceita', 'oferecida'].includes(q.estado));
    const aceitas = abertas.filter(q => q.estado === 'aceita');
    const candidatas = (aceitas.length ? aceitas : abertas).sort((a, b) => a.prazo - b.prazo);
    for (const q of candidatas) {
        if (q.tipo === 'investigar' && q.etapa > 0 && q.rival) {
            const rival = camp.kimetsu?.rivais[q.rival];
            const ultimo = rival?.memoria.at(-1);
            // Only witnessed defeat/retreat informs the cooldown, not hidden enemy stats.
            if (ultimo && ultimo.resultado !== 'vitoria' && dia < ultimo.dia + 7)
                continue;
            if (!(0, items_1.armaEquipada)(content, camp.personagem)?.contraOni)
                continue;
        }
        const destino = q.tipo === 'escoltar' && q.etapa > 0 ? q.destino : q.local;
        if (!destino)
            continue;
        const ida = (0, missoesVivas_1.periodosDeViagem)(content, camp.localAtual, destino);
        const escolta = q.tipo === 'escoltar' && !q.etapa && q.destino ? (0, missoesVivas_1.periodosDeViagem)(content, destino, q.destino) : 0;
        const necessario = ida + escolta + (q.tipo === 'investigar' ? 12 : 3);
        if (!Number.isFinite(necessario) || necessario > (q.prazo - dia + 1) * time_1.PERIODOS.length)
            continue;
        if (q.estado === 'oferecida')
            return { tipo: 'agir', acao: { tipo: 'missao', id: q.id, escolha: 'aceitar' } };
        if (camp.localAtual !== destino) {
            const rotas = (0, viagem_1.rotasVisiveis)(content, camp);
            const restante = Math.max(0, (q.prazo - dia + 1) * time_1.PERIODOS.length - (q.tipo === 'investigar' ? 12 : 3));
            const rota = rotas.map(r => ({
                ...r,
                total: Math.max(1, r.periodos) + (0, missoesVivas_1.periodosDeViagem)(content, r.destino, destino),
                score: pontuarRotaPlanejador(content, camp, camp.localAtual, r, restante),
            }))
                .filter(r => Number.isFinite(r.total)).sort((a, b) => a.score - b.score || a.total - b.total)[0];
            if (rota)
                return { tipo: 'viajar', destino: rota.destino };
            continue;
        }
        if (!['investigar', 'escoltar'].includes(q.tipo) && camp.personagem.dinheiro < 30 && q.tentativas >= 2)
            return { tipo: 'agir', acao: { tipo: 'trabalhar' } };
        return { tipo: 'agir', acao: { tipo: 'missao', id: q.id, escolha: q.tipo === 'investigar' ? q.etapa ? 'confrontar' : 'investigar' : q.tipo === 'escoltar' || camp.personagem.dinheiro >= 30 ? 'ajudar' : 'negociar' } };
    }
}
