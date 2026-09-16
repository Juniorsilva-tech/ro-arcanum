"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_CONVICCOES = exports.LIMIAR_REFLEXAO = void 0;
exports.acumularReflexao = acumularReflexao;
exports.sintetizarConviccao = sintetizarConviccao;
exports.conviccoesDoNpc = conviccoesDoNpc;
exports.retratoConviccoes = retratoConviccoes;
exports.LIMIAR_REFLEXAO = 10;
exports.MAX_CONVICCOES = 3;
// Categorização psicológica das lembranças
const CATEGORIAS_LEMBRANCA = {
    hostil: ['violencia', 'roubo', 'ofensa', 'mentira'],
    afetiva: ['ajuda', 'presente', 'intimidade', 'promessa'],
    social: ['conversa', 'segredo', 'dinheiro', 'marco'],
};
// Acumula pontos de carga emocional no NPC e dispara a reflexão se atingir o limiar.
function acumularReflexao(camp, npcId, peso) {
    const din = camp.npcState[npcId];
    if (!din || !din.vivo)
        return undefined;
    din.pontosReflexao = (din.pontosReflexao ?? 0) + Math.max(1, peso);
    if (din.pontosReflexao >= exports.LIMIAR_REFLEXAO) {
        din.pontosReflexao = 0;
        return sintetizarConviccao(camp, npcId);
    }
    return undefined;
}
// Sintetiza uma convicção baseada nas memórias mais impactantes do NPC.
function sintetizarConviccao(camp, npcId) {
    const din = camp.npcState[npcId];
    if (!din || !din.vivo || !din.memoria || din.memoria.length === 0)
        return undefined;
    let pesoHostil = 0;
    let pesoAfetivo = 0;
    const tiposPresentes = new Set();
    for (const lembranca of din.memoria) {
        const tipo = lembranca.tipo ?? 'conversa';
        tiposPresentes.add(tipo);
        if (CATEGORIAS_LEMBRANCA.hostil.includes(tipo)) {
            pesoHostil += lembranca.peso;
        }
        else if (CATEGORIAS_LEMBRANCA.afetiva.includes(tipo)) {
            pesoAfetivo += lembranca.peso;
        }
    }
    let valencia;
    let texto;
    let intensidade;
    if (pesoHostil > 0 && pesoAfetivo > 0 && Math.abs(pesoHostil - pesoAfetivo) <= 4) {
        // Experiências fortemente conflitantes: gera cautela e ambivalência
        valencia = 'cautela';
        intensidade = Math.min(5, Math.max(2, Math.round((pesoHostil + pesoAfetivo) / 4)));
        texto = 'Reconhece seus gestos de apoio, mas mantém guarda firme pelas traições e ofensas passadas.';
        ajustarEixosAposReflexao(din, { confianca: -2, tensao: 6 });
    }
    else if (pesoHostil > pesoAfetivo) {
        // Predomínio de hostilidade ou dano
        if (tiposPresentes.has('violencia')) {
            valencia = 'temor';
            intensidade = Math.min(5, Math.max(3, Math.round(pesoHostil / 3)));
            texto = 'Vê você como uma força violenta e perigosa, preferindo submissão cautelosa ao confronto.';
            ajustarEixosAposReflexao(din, { confianca: -6, medo: 8, tensao: 10 });
        }
        else {
            valencia = 'desconfianca';
            intensidade = Math.min(5, Math.max(2, Math.round(pesoHostil / 3)));
            texto = 'Desconfia abertamente do seu caráter, esperando mentiras ou intenções escusas a qualquer momento.';
            ajustarEixosAposReflexao(din, { confianca: -5, tensao: 8 });
        }
    }
    else if (pesoAfetivo > 0) {
        // Predomínio de ajuda, presentes e intimidade
        valencia = 'afeto';
        intensidade = Math.min(5, Math.max(2, Math.round(pesoAfetivo / 3)));
        if (tiposPresentes.has('intimidade') || tiposPresentes.has('promessa')) {
            texto = 'Sente um vínculo genuíno de lealdade e cumplicidade com você.';
        }
        else {
            texto = 'Considera você uma pessoa confiável e valoriza as ajudas recebidas.';
        }
        ajustarEixosAposReflexao(din, { confianca: 6, tensao: -8, medo: -4 });
    }
    else {
        // Apenas conversas neutras sem peso emocional marcante
        return undefined;
    }
    const novaConviccao = {
        id: `conv_${npcId}_${camp.turno}_${camp.calendario.dia}`,
        texto,
        valencia,
        intensidade,
        turno: camp.turno,
        dia: camp.calendario.dia,
        baseadaEmTipos: Array.from(tiposPresentes),
    };
    const lista = din.conviccoes ?? (din.conviccoes = []);
    // Evita duplicatas idênticas consecutivas de mesma valência
    const anterior = lista.find(c => c.valencia === novaConviccao.valencia);
    if (anterior) {
        anterior.texto = novaConviccao.texto;
        anterior.intensidade = Math.min(5, Math.max(anterior.intensidade, novaConviccao.intensidade));
        anterior.turno = novaConviccao.turno;
        anterior.dia = novaConviccao.dia;
        anterior.baseadaEmTipos = novaConviccao.baseadaEmTipos;
        return anterior;
    }
    lista.push(novaConviccao);
    // Mantém no máximo MAX_CONVICCOES, priorizando maior intensidade e recência
    if (lista.length > exports.MAX_CONVICCOES) {
        lista.sort((a, b) => (b.intensidade - a.intensidade) || (b.turno - a.turno));
        lista.length = exports.MAX_CONVICCOES;
    }
    return novaConviccao;
}
// Atualiza eixos numéricos garantindo limites estritos [-20, 20] ou [0, 100].
function ajustarEixosAposReflexao(din, deltas) {
    if (deltas.confianca !== undefined) {
        const atual = din.eixos.confianca ?? 0;
        din.eixos.confianca = Math.max(-20, Math.min(20, atual + deltas.confianca));
    }
    if (deltas.medo !== undefined) {
        const atual = din.eixos.medo ?? 0;
        din.eixos.medo = Math.max(-20, Math.min(20, atual + deltas.medo));
    }
    if (deltas.tensao !== undefined) {
        din.tensao = Math.max(0, Math.min(100, din.tensao + deltas.tensao));
    }
}
// Retorna as convicções formuladas pelo NPC.
function conviccoesDoNpc(camp, npcId) {
    return camp.npcState[npcId]?.conviccoes ?? [];
}
// Formata uma descrição psicológica condensada das convicções para contexto narrativo.
function retratoConviccoes(camp, npcId) {
    const lista = conviccoesDoNpc(camp, npcId);
    if (lista.length === 0)
        return undefined;
    return lista.map(c => `[${c.valencia.toUpperCase()}] ${c.texto}`).join(' ');
}
