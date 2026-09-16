"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularContexto = calcularContexto;
exports.disponibilidadeVerbo = disponibilidadeVerbo;
exports.rotuloPrivacidade = rotuloPrivacidade;
const time_1 = require("./time");
const elenco_1 = require("./elenco");
const historiaViva_1 = require("./historiaViva");
function localDeNpcNoPeriodo(npc, periodo) {
    return npc.rotina[periodo] ?? npc.localBase;
}
function calcularContexto(content, camp) {
    const local = content.locais.find((l) => l.id === camp.localAtual);
    const periodo = (0, time_1.periodoAtual)(camp.calendario);
    const presentes = (0, elenco_1.todosNpcs)(content, camp).filter((npc) => {
        const din = camp.npcState[npc.id];
        if (din && !din.vivo)
            return false;
        // Quem aceitou viajar com o protagonista está onde ele está; a rotina
        // normal volta a valer assim que a pessoa deixa o grupo.
        if ((camp.grupo ?? []).includes(npc.id))
            return true;
        if (camp.vivo?.pessoas[npc.id]?.objetivo === 'cativo')
            return false;
        return (0, historiaViva_1.localEfetivo)(camp, npc, periodo, content) === local.id;
    });
    let privacidade = local.privacidadeBase[periodo] ?? 0;
    // Chuva/estação e oportunidades podem elevar (GDD §9). Flag simples:
    if (camp.flags['clima.chuva'] === true && privacidade < 3) {
        privacidade = (privacidade + 1);
    }
    // Testemunhas: presentes ajustados por privacidade do lugar.
    // Lugar íntimo com poucas pessoas => quase ninguém "vê" o social/ilegal.
    const testemunhas = privacidade >= 3 ? 0 : presentes.length;
    return { local, periodo, privacidade, presentes, testemunhas };
}
// Verbo indisponível NUNCA some — permanece apagado, com o motivo (GDD §4.3).
function disponibilidadeVerbo(verbo, ctx, camp, alvo) {
    const p = camp.personagem;
    if (p.condicoes.includes('cativo'))
        return { disponivel: false, motivo: 'recupere a liberdade no painel do mundo' };
    const req = verbo.requisitos ?? {};
    if (ctx.local.verbosBloqueados?.includes(verbo.id)) {
        return { disponivel: false, motivo: 'não cabe aqui' };
    }
    if (verbo.alvo === 'pessoa' && ctx.presentes.length === 0 && verbo.categoria !== 'deslocamento') {
        return { disponivel: false, motivo: 'não há ninguém aqui' };
    }
    if (verbo.categoria === 'transgressao' && verbo.alvo === 'pessoa') {
        const sozinho = ctx.presentes.length === 1 && ctx.testemunhas <= 1;
        if (!sozinho && ctx.testemunhas > 1) {
            return { disponivel: false, motivo: `${ctx.testemunhas} pessoas te veriam` };
        }
    }
    if (req.privacidadeMin !== undefined && ctx.privacidade < req.privacidadeMin) {
        return { disponivel: false, motivo: privacidadeMotivo(ctx) };
    }
    if (req.testemunhasMax !== undefined && ctx.testemunhas > req.testemunhasMax) {
        return { disponivel: false, motivo: `${ctx.testemunhas} pessoas te veriam` };
    }
    if (req.item && (p.inventario[req.item] ?? 0) <= 0) {
        return { disponivel: false, motivo: `precisa de ${req.item}` };
    }
    if (req.pericia && (p.pericias[req.pericia] ?? 0) <= 0) {
        return { disponivel: false, motivo: `você não sabe ${req.pericia}` };
    }
    if (req.periodo && !req.periodo.includes(ctx.periodo)) {
        const quando = req.periodo.map((x) => time_1.NOME_PERIODO[x].toLowerCase()).join(' ou ');
        return { disponivel: false, motivo: `só ao ${quando}` };
    }
    if (req.localTipo && !req.localTipo.includes(ctx.local.tipo)) {
        return { disponivel: false, motivo: 'não é o lugar para isso' };
    }
    if (req.condicaoNecessaria === 'sabe_segredo') {
        if (!alvo || !camp.segredosRevelados.includes(alvo.id)) {
            return { disponivel: false, motivo: 'você não sabe nada que sirva' };
        }
    }
    else if (req.condicaoNecessaria === 'sabe_segredo_vess') {
        if (!camp.segredosRevelados.includes('vess')) {
            return { disponivel: false, motivo: 'você ainda não sabe o que ele guarda' };
        }
    }
    else if (req.condicaoNecessaria?.startsWith('flag:')) {
        // Exige uma flag da campanha (ex.: ter visitado um lugar, ter cumprido um passo).
        if (!camp.flags[req.condicaoNecessaria.slice(5)]) {
            return { disponivel: false, motivo: 'ainda não é hora disso' };
        }
    }
    else if (req.condicaoNecessaria?.startsWith('segredo:')) {
        // Exige conhecer o segredo de um NPC específico.
        if (!camp.segredosRevelados.includes(req.condicaoNecessaria.slice(8))) {
            return { disponivel: false, motivo: 'você ainda não sabe o bastante' };
        }
    }
    else if (req.condicaoNecessaria && !p.condicoes.includes(req.condicaoNecessaria)) {
        return { disponivel: false, motivo: `exige estar ${req.condicaoNecessaria}` };
    }
    if (req.condicaoProibida && p.condicoes.includes(req.condicaoProibida)) {
        return { disponivel: false, motivo: `não enquanto ${req.condicaoProibida}` };
    }
    if (verbo.custo.dinheiro && p.dinheiro < verbo.custo.dinheiro) {
        return { disponivel: false, motivo: 'sem dinheiro suficiente' };
    }
    if (alvo) {
        if (alvo.parentesco && verbo.id === 'flertar')
            return { disponivel: false, motivo: 'família não é alvo romântico' };
        const din = camp.npcState[alvo.id];
        if (din && !din.vivo)
            return { disponivel: false, motivo: `${alvo.nome} está morto` };
    }
    return { disponivel: true };
}
function privacidadeMotivo(ctx) {
    if (ctx.testemunhas > 0) {
        return ctx.testemunhas === 1 ? 'alguém te veria' : `${ctx.testemunhas} pessoas te veriam`;
    }
    return 'aqui não há privacidade';
}
function rotuloPrivacidade(v) {
    return ['nenhuma', 'baixa', 'alta', 'total'][v];
}
