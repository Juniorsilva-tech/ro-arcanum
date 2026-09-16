"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularContexto = void 0;
exports.resolverIntencao = resolverIntencao;
const resolution_1 = require("./resolution");
const time_1 = require("./time");
const mundo_1 = require("./mundo");
const character_1 = require("./character");
const impulsos_1 = require("./impulsos");
const risco_1 = require("./risco");
const availability_1 = require("./availability");
Object.defineProperty(exports, "calcularContexto", { enumerable: true, get: function () { return availability_1.calcularContexto; } });
const effects_1 = require("./effects");
const classe_1 = require("./classe");
const memoria_1 = require("./memoria");
const elenco_1 = require("./elenco");
const aptidao_1 = require("./aptidao");
function nomeAlvo(content, camp, alvoId) {
    if (!alvoId)
        return undefined;
    return (0, elenco_1.npcPorId)(content, camp, alvoId);
}
// Constrói o "fato consumado" seco que a narração recebe (GDD §4.4).
function construirFato(verbo, alvo, res) {
    const acao = verbo.nome.toLowerCase();
    const alvoTxt = alvo ? ` ${alvo.nome}` : '';
    if (!res)
        return `Você foi ${acao}${alvoTxt}.`;
    const g = res.grau;
    const quase = res.grau === 'falha' && res.r < res.p + (1 - res.p) * 0.5;
    switch (g) {
        case 'critico':
            return `Você tentou ${acao}${alvoTxt} — e saiu melhor do que esperava.`;
        case 'sucesso':
            return `Você tentou ${acao}${alvoTxt} — deu certo.`;
        case 'sucesso_com_custo':
            return `Você tentou ${acao}${alvoTxt} — deu certo, mas cobrou.`;
        case 'falha':
            return `Você tentou ${acao}${alvoTxt} — falhou${quase ? ' por pouco' : ''}.`;
        case 'falha_grave':
            return `Você tentou ${acao}${alvoTxt} — falhou feio, e algo piorou.`;
    }
}
// Quem foi alvo lembra do que houve; quem foi ignorado acumula tensão.
function atualizarNpcs(camp, content, alvo, verbo, grau, rotulo) {
    for (const npc of (0, elenco_1.todosNpcs)(content, camp)) {
        const din = camp.npcState[npc.id];
        if (!din || !din.vivo)
            continue;
        if (alvo && npc.id === alvo.id) {
            din.tensao = Math.max(0, din.tensao - 20);
        }
        else {
            // Negligência: tensão sobe passivamente (GDD §10.4).
            din.tensao = Math.min(100, din.tensao + 1);
        }
    }
    // A lembrança dela é escrita do ponto de vista dela, e pesada pelo que foi.
    if (alvo)
        (0, memoria_1.lembrarDoTurno)(camp, alvo, verbo, grau, rotulo);
}
function resolverIntencao(content, camp, intencao) {
    const p = camp.personagem;
    if (p.condicoes.includes('cativo'))
        return { fato: 'Você continua cativo; precisa recuperar a liberdade antes de agir fora do cativeiro.', custoPeriodos: 0, efeitosAplicados: [] };
    camp.turno += 1;
    let verbo;
    let teste;
    let custoPeriodos = 0;
    let efeitosSempre = [];
    let efeitosPorGrau = {};
    let impulsoQueSacia;
    let rotulo = '';
    if (intencao.tipo === 'verbo') {
        verbo = content.verbos.find((v) => v.id === intencao.verboId);
        if (!verbo)
            throw new Error(`verbo desconhecido: ${intencao.verboId}`);
        custoPeriodos = verbo.custo.periodos;
        efeitosSempre = verbo.efeitosSempre ?? [];
        efeitosPorGrau = verbo.efeitosPorGrau ?? {};
        impulsoQueSacia = verbo.impulsoQueSacia;
        rotulo = verbo.nome;
        if (verbo.teste) {
            teste = {
                atributo: verbo.teste.atributo,
                pericia: verbo.teste.pericia,
                dificuldade: verbo.teste.dificuldadeBase,
            };
        }
    }
    else {
        const o = intencao.opcao;
        custoPeriodos = o.custoPeriodos;
        teste = o.teste;
        impulsoQueSacia = o.impulsoQueSacia;
        rotulo = o.rotulo;
        // Opção de cena: efeitos aplicam no sucesso; falha aplica um custo leve.
        if (o.efeitos)
            efeitosPorGrau = { critico: o.efeitos, sucesso: o.efeitos, sucesso_com_custo: o.efeitos };
    }
    const alvo = nomeAlvo(content, camp, intencao.alvoId);
    const cenario = content.cenario;
    // Resolve o teste, se houver. Uma carta de memória "jogada" (ver
    // engine/genese.ts, cartaDeInfancia) entra como bônus de circunstância
    // pontual e é consumida — só quando um teste de fato acontece.
    let resultado;
    let cartaUsada;
    if (teste) {
        let bonusCarta = 0;
        if (camp.cartaAtiva) {
            const carta = camp.memoriasInfancia?.find((c) => c.id === camp.cartaAtiva);
            if (carta && carta.usosRestantes > 0) {
                bonusCarta = carta.bonusCircunstancia;
                cartaUsada = carta.titulo;
            }
        }
        resultado = (0, resolution_1.resolverTeste)(camp.rng, {
            atributo: p.atributos[teste.atributo],
            pericia: teste.pericia ? p.pericias[teste.pericia] ?? 0 : 0,
            circunstancia: bonusCarta,
            penalidadeEstado: (0, risco_1.penalidadeEstado)(camp),
            dificuldade: teste.dificuldade,
            k: cenario.k,
        });
        if (cartaUsada) {
            const carta = camp.memoriasInfancia.find((c) => c.id === camp.cartaAtiva);
            carta.usosRestantes -= 1;
        }
        camp.cartaAtiva = undefined;
    }
    const grau = resultado?.grau;
    // Aplica efeitos (com o placeholder $alvo já resolvido).
    const aplicados = [];
    for (const ef of (0, effects_1.substituirAlvo)(efeitosSempre, intencao.alvoId)) {
        (0, effects_1.aplicarEfeito)(camp, ef);
        aplicados.push(ef);
    }
    const baldeGrau = grau && efeitosPorGrau[grau] ? efeitosPorGrau[grau] : !resultado ? (efeitosPorGrau.sucesso ?? []) : [];
    for (const ef of (0, effects_1.substituirAlvo)(baldeGrau, intencao.alvoId)) {
        (0, effects_1.aplicarEfeito)(camp, ef);
        aplicados.push(ef);
    }
    // Arcanista: estudar devolve mana a ela, e so a ela (engine/classe.ts).
    // Para o resto do elenco, estudar continua sendo o que sempre foi.
    if (verbo?.id === 'estudar') {
        const extra = (0, classe_1.manaDeEstudo)(camp);
        if (extra > 0) {
            const ef = { tipo: 'recurso', recurso: 'mana', delta: extra };
            (0, effects_1.aplicarEfeito)(camp, ef);
            aplicados.push(ef);
        }
    }
    // Saciar impulso em caso de sucesso (ou verbo sem teste).
    const deuCerto = !resultado || resultado.sucesso;
    if (impulsoQueSacia && deuCerto) {
        (0, impulsos_1.saciar)(camp, impulsoQueSacia, 60);
    }
    // Fazer é treinar, e fazer na frente dos outros é mostrar. O domínio sai da
    // perícia testada (ou da categoria do verbo); as testemunhas são quem está
    // presente AGORA, antes de o tempo andar e a cena mudar de gente.
    if (teste) {
        const dominio = (0, aptidao_1.dominioDaAcao)(teste.pericia, verbo?.categoria);
        if (dominio) {
            const plateia = (0, availability_1.calcularContexto)(content, camp).presentes;
            (0, aptidao_1.treinar)(content, camp, dominio, { mestre: 0.2, esforco: 0.5, recursos: 0.5 });
            (0, aptidao_1.registrarDemonstracao)(content, camp, {
                dominio,
                dificuldade: Math.min(100, teste.dificuldade * 4),
                sucesso: !!resultado?.sucesso,
                testemunhas: plateia,
            });
        }
    }
    // Avança o tempo e cresce impulsos (GDD §1, §5).
    if (custoPeriodos > 0) {
        camp.calendario = (0, time_1.avancarPeriodos)(camp.calendario, custoPeriodos);
        (0, impulsos_1.crescerImpulsos)(camp, custoPeriodos);
        // O vale não espera: o tempo cobra de todo mundo, não só do jogador.
        (0, mundo_1.avancarMundo)(content, camp);
    }
    const fatoBase = verbo
        ? construirFato(verbo, alvo, resultado)
        : `${rotulo}${resultado ? ` — ${resolution_1.NOME_GRAU[resultado.grau]}` : ''}.`;
    const fato = cartaUsada ? `${fatoBase} (a memória de "${cartaUsada}" pesou na hora.)` : fatoBase;
    atualizarNpcs(camp, content, alvo, verbo, grau, rotulo);
    // Sequela: se a vida chegou a 0 (GDD §15) — marca condição agonizante.
    if (p.recursos.vida <= 0 && !p.condicoes.includes('agonizante')) {
        p.condicoes.push('agonizante');
    }
    (0, character_1.clampRecursos)(p);
    camp.ultimoResultado = {
        grau: grau ?? 'sucesso',
        verboNome: verbo?.nome ?? rotulo,
        alvoNome: alvo?.nome,
    };
    return {
        resultado,
        grau,
        verbo,
        alvo,
        fato,
        custoPeriodos,
        efeitosAplicados: aplicados,
    };
}
