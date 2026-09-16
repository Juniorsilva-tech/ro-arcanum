"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.periodosDeViagem = periodosDeViagem;
exports.janelaMissao = janelaMissao;
exports.oferecerMissao = oferecerMissao;
exports.encerrarMissao = encerrarMissao;
exports.processarMissoesVivas = processarMissoesVivas;
const historiaViva_1 = require("./historiaViva");
const time_1 = require("./time");
// Shortest travel time, not player level. Unreachable destinations offer no mission.
function periodosDeViagem(content, origem, destino) {
    const dist = new Map([[origem, 0]]), visitados = new Set();
    while (true) {
        const atual = [...dist].filter(([id]) => !visitados.has(id)).sort((a, b) => a[1] - b[1])[0];
        if (!atual)
            return Infinity;
        const [id, custo] = atual;
        if (id === destino)
            return custo;
        visitados.add(id);
        for (const rota of content.locais.find(l => l.id === id)?.rotas ?? []) {
            const novo = custo + Math.max(1, rota.periodos);
            if (novo < (dist.get(rota.destino) ?? Infinity))
                dist.set(rota.destino, novo);
        }
    }
}
function janelaMissao(camp, tipo, local, viagem = 0) {
    const c = camp.vivo?.cidades[local];
    const urgente = tipo === 'resgatar' || (tipo === 'tratar' && (c?.doenca ?? 0) > 60) || (tipo === 'abastecer' && (c?.fomeDias ?? 0) > 2);
    const diasViagem = Math.ceil(viagem / time_1.PERIODOS.length);
    const dias = (urgente ? 6 : tipo === 'reconstruir' ? 24 : tipo === 'escoltar' ? 12 : 14) + diasViagem;
    return { dias, motivo: `${urgente ? 'Crise urgente' : tipo === 'reconstruir' ? 'Obra de recuperação' : 'Janela de organização'}; inclui ${diasViagem} dias de deslocamento previsto. O prazo corre mesmo sem sua participação.` };
}
const TITULOS = {
    abastecer: 'Pão antes do êxodo', tratar: 'Conter a febre', escoltar: 'Uma casa em outro lugar',
    reconstruir: 'Erguer de novo', resgatar: 'Uma pessoa levada', investigar: 'Rastros sob a noite',
};
function oferecerMissao(camp, tipo, fato, extra = {}, content) {
    const v = camp.vivo;
    const abertas = v.missoes.filter(q => ['oferecida', 'aceita'].includes(q.estado));
    if (abertas.some(q => q.tipo === tipo && q.local === fato.local && q.ator === extra.ator && q.rival === extra.rival) || abertas.length >= 12)
        return;
    // Deslocamento previsto, em duas pernas. A segunda (local → destino) é a
    // viagem que a missão exige em si, e sempre foi contada. A primeira
    // (onde você está → onde é a crise) passou a existir na sessão 21, quando o
    // continente ganhou escala: antes nenhum par do mapa ficava a mais de dois
    // dias, então ignorar a chegada não custava nada. Com a mediana em quatro
    // dias, um resgate de prazo seis oferecido do outro lado do mapa não é
    // oferta, é formalidade.
    const ida = content ? periodosDeViagem(content, camp.localAtual, fato.local) : 0;
    const tarefa = content && extra.destino ? periodosDeViagem(content, fato.local, extra.destino) : 0;
    if (!Number.isFinite(tarefa))
        return;
    // Lugar inalcançável a partir daqui não vira missão — é o mesmo critério que
    // o destino já usava.
    if (!Number.isFinite(ida))
        return;
    const viagem = ida + tarefa;
    const janela = janelaMissao(camp, tipo, fato.local, viagem);
    const q = {
        id: `missao_${++v.sequencia}`, tipo, titulo: TITULOS[tipo], local: fato.local,
        causa: { id: fato.id, texto: fato.texto }, prazo: camp.calendario.dia + janela.dias,
        criadaEm: camp.calendario.dia, motivoPrazo: janela.motivo,
        estado: 'oferecida', etapa: 0, conhecida: fato.conhecimento !== 'oculto', tentativas: 0,
        recompensa: tipo === 'investigar' || tipo === 'resgatar' ? 35 : 20, ...extra,
    };
    v.missoes.push(q);
    v.contadores.missoesGeradas = (v.contadores.missoesGeradas ?? 0) + 1;
    return q;
}
function encerrarMissao(camp, q, estado, texto) {
    if (!['oferecida', 'aceita'].includes(q.estado))
        return;
    const participou = q.estado === 'aceita' && estado === 'concluida';
    if (estado === 'falhada') {
        const chave = q.estado === 'aceita' ? 'compromissosFalhados' : 'oportunidadesExpiradas';
        camp.vivo.contadores[chave] = (camp.vivo.contadores[chave] ?? 0) + 1;
    }
    q.estado = estado;
    q.desfecho = texto;
    if (participou) {
        camp.personagem.dinheiro += q.recompensa;
        camp.personagem.xp += 15;
        camp.reputacao.vila = (camp.reputacao.vila ?? 0) + 2;
    }
    (0, historiaViva_1.registrarFato)(camp, { tipo: `missao_${estado}`, local: q.local, texto, atores: q.ator ? [q.ator] : [], causa: q.causa, publico: true });
}
function processarMissoesVivas(content, camp) {
    const v = camp.vivo;
    for (const q of v.missoes.filter(q => ['oferecida', 'aceita'].includes(q.estado))) {
        const cidade = v.cidades[q.local];
        if (q.ator && !camp.npcState[q.ator]?.vivo) {
            encerrarMissao(camp, q, 'falhada', 'A pessoa envolvida morreu. O compromisso ficou sem resolução.');
            continue;
        }
        const rival = q.rival ? camp.kimetsu?.rivais[q.rival] : undefined;
        if (q.tipo === 'investigar' && rival && !rival.vivo) {
            // Participation is checked against the real confrontation record.
            const matou = q.estado === 'aceita' && rival.memoria.at(-1)?.resultado === 'vitoria' && rival.ultimoDia >= (q.aceitaEm ?? q.criadaEm ?? q.prazo - 10);
            encerrarMissao(camp, q, matou ? 'concluida' : 'resolvida_por_outros', `${rival.nome} foi eliminado; a origem dos desaparecimentos acabou.`);
            continue;
        }
        const civil = q.ator && v.pessoas[q.ator];
        if (q.tipo === 'resgatar' && civil && civil.objetivo !== 'cativo') {
            encerrarMissao(camp, q, 'resolvida_por_outros', 'A pessoa recuperou a liberdade por outro caminho.');
            continue;
        }
        if ((q.tipo === 'abastecer' && cidade?.fomeDias === 0 && cidade.comida >= 80) ||
            (q.tipo === 'tratar' && cidade?.doenca === 0) ||
            (q.tipo === 'reconstruir' && (camp.continuidade?.locais[q.local]?.integridade ?? 0) >= 95)) {
            encerrarMissao(camp, q, 'resolvida_por_outros', 'A comunidade resolveu a necessidade com os próprios recursos.');
            continue;
        }
        if (camp.calendario.dia > q.prazo) {
            encerrarMissao(camp, q, 'falhada', `${q.titulo}: o prazo passou. As pessoas seguiram vivendo com as consequências.`);
            if (cidade)
                cidade.inseguranca = Math.min(100, cidade.inseguranca + 8);
            if (q.tipo === 'abastecer' && cidade && cidade.fomeDias > 0) {
                const fato = (0, historiaViva_1.registrarFato)(camp, { tipo: 'exodo', local: q.local, texto: 'Sem abastecimento, famílias passaram a procurar uma saída da vila.', atores: [], causa: q.causa, publico: true });
                const destino = Object.keys(v.cidades).find(id => id !== q.local && v.cidades[id].comida > 100);
                if (destino)
                    oferecerMissao(camp, 'escoltar', fato, { destino }, content);
            }
        }
    }
    v.missoes = [...v.missoes.filter(q => !['oferecida', 'aceita'].includes(q.estado)).slice(-60), ...v.missoes.filter(q => ['oferecida', 'aceita'].includes(q.estado))];
    void content;
}
