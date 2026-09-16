"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIDA_BASE = exports.TETO_HUMANO = void 0;
exports.xpParaProximoNivel = xpParaProximoNivel;
exports.recalcularRecursosMaximos = recalcularRecursosMaximos;
exports.ganhoDeVidaPorNivel = ganhoDeVidaPorNivel;
exports.vidaMaxima = vidaMaxima;
exports.processarSubidaDeNivel = processarSubidaDeNivel;
exports.concederDespertar = concederDespertar;
const memoria_1 = require("./memoria");
const character_1 = require("./character");
const identidade_1 = require("./identidade");
// O teto humano. Não é um limite duro — ninguém é impedido de passar dele —
// mas é onde a curva deixa de ser generosa. Vinte é o nível do ser mais
// perigoso que existe no mundo (Muzan, no bestiário); um caçador que chega
// perto disso já está no alto do que gente alcança treinando.
exports.TETO_HUMANO = 20;
// Quanto cada nível acima do teto custa a mais que o anterior. Multiplicativo
// de propósito: subir do 21 pro 22 é caro, do 30 pro 31 é quase impossível
// sem que a história conceda um Despertar.
const CUSTO_ACIMA_DO_TETO = 1.45;
/**
 * XP do próximo nível. Abaixo do teto humano a curva é a antiga — linear,
 * generosa, para que a primeira metade da campanha ande.
 *
 * Acima do teto ela acelera, e isso conserta um erro medido na sessão 19: com
 * a curva puramente linear, dez anos de campanha entregavam nível 66-68 num
 * mundo cujo ser mais perigoso é nível 20. O resultado era um jogador com
 * cento e dezessete vezes a força do inimigo mais duro que conseguia derrotar
 * — combate deixava de ser risco e virava trâmite por volta do nível 40.
 *
 * O comentário do Despertar, logo abaixo, sempre disse que o teto normal "não
 * leva ninguém perto de um Yoriichi — de propósito". Agora a curva cumpre o
 * que aquele comentário promete: passar do teto humano é caminho da história
 * (`concederDespertar`), não de acumular xp.
 */
function xpParaProximoNivel(nivelAtual) {
    const base = 20 + nivelAtual * 15;
    const excedente = Math.max(0, nivelAtual - exports.TETO_HUMANO);
    return Math.round(base * Math.pow(CUSTO_ACIMA_DO_TETO, excedente));
}
// Sobe quantos níveis o xp acumulado permitir, de uma vez só — cobre saves
// antigos que já tinham xp de sobra parado sem nunca ter subido nível.
// Tetos de recurso derivados de atributos e nivel. Ate aqui a vida era fixada
// na criacao do personagem e nunca mais mexia — subir de nivel nao dava um
// ponto de vida sequer.
function recalcularRecursosMaximos(camp) {
    const p = camp.personagem;
    const antes = p.recursosMax.vida || 1;
    const proporcao = Math.min(1, (p.recursos.vida ?? antes) / antes);
    p.recursosMax.vida = vidaMaxima(camp);
    // Ferido continua ferido na mesma proporcao; ganhar nivel nao cura.
    p.recursos.vida = p.recursos.vida <= 0 ? 0 : Math.max(1, Math.round(p.recursosMax.vida * proporcao));
    // Vigor e mana tambem acompanham o nivel, de forma mais discreta.
    for (const id of Object.keys(p.recursosMax)) {
        if (id === 'vida')
            continue;
        const max = (0, character_1.recursoMaximo)(id, p.atributos) + Math.floor(p.nivel / 2);
        p.recursosMax[id] = max;
        p.recursos[id] = Math.min(max, p.recursos[id] ?? max);
    }
}
// Vida por nivel. A parte fixa continua vindo da resiliencia; a parte que
// cresce e' a correcao: antes a vida era carimbada na criacao do personagem e
// nunca mais mexia, entao nivel 25 tinha o mesmo corpo de nivel 1.
// Piso de vida. Subiu de 20 para 34 por medicao, nao por gosto: com 20, um
// personagem de nivel 1 morria em dois golpes e a luta virava cara ou coroa —
// o banco de provas mostrava todas as faixas colapsando perto de 50%, porque
// nao havia rodadas suficientes para a diferenca de poder aparecer.
exports.VIDA_BASE = 44;
function ganhoDeVidaPorNivel(camp) {
    return 2 + Math.max(0, (0, character_1.modificador)(camp.personagem.atributos.resiliencia));
}
function vidaMaxima(camp) {
    const p = camp.personagem;
    return Math.round((exports.VIDA_BASE + (0, character_1.modificador)(p.atributos.resiliencia) * 4
        + (p.nivel - 1) * ganhoDeVidaPorNivel(camp)) * (0, identidade_1.multiplicadoresDeIdentidade)(camp).vida);
}
function processarSubidaDeNivel(camp) {
    const p = camp.personagem;
    let subiu = false;
    while (p.xp >= xpParaProximoNivel(p.nivel)) {
        p.xp -= xpParaProximoNivel(p.nivel);
        p.nivel += 1;
        subiu = true;
        (0, memoria_1.registrarMarco)(camp, `nível ${p.nivel}: dia ${camp.calendario.dia}, você sente a diferença no corpo.`);
    }
    if (subiu)
        recalcularRecursosMaximos(camp);
}
// ── Despertar: o teto normal de nível (o que a curva de xp acima concede)
// não leva ninguém perto de um Yoriichi — de propósito. Um Despertar é um
// avanço raro e ganho, não farmado: concedido pelo conteúdo (mestre, missão,
// marco de história) quando o jogador cruza um limiar real da história, não
// um número de xp.
//
// Mecanicamente é simples e permanente: soma um bônus fixo de nível acima
// da curva normal. Propaga sozinho pra tudo que já lê p.nivel (acerto e
// poder em character.ts, preço de loja em despojos.ts, reforço em
// duelo.ts) sem precisar mudar assinatura de função nenhuma.
// camp.despertares só existe pra saber quais já foram concedidos (evita
// conceder duas vezes) e pro narrador saber o que já aconteceu.
const BONUS_POR_DESPERTAR = 3;
function concederDespertar(camp, id, motivo) {
    const lista = camp.despertares ?? (camp.despertares = []);
    if (lista.includes(id))
        return false;
    lista.push(id);
    camp.personagem.nivel += BONUS_POR_DESPERTAR;
    recalcularRecursosMaximos(camp);
    (0, memoria_1.registrarMarco)(camp, `despertar: ${motivo}`);
    return true;
}
