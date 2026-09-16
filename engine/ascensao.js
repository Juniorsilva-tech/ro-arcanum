"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALMAS_MINIMAS_ASCENSAO = exports.IDADE_MINIMA_ASCENSAO = exports.NIVEL_MINIMO_ASCENSAO = exports.IDADE_MORTE_MIN_JOGADOR = exports.DIAS_POR_ANO_JOGADOR = void 0;
exports.idadeJogador = idadeJogador;
exports.chimAlcancado = chimAlcancado;
exports.processarEnvelhecimentoJogador = processarEnvelhecimentoJogador;
exports.condicoesDeAscensao = condicoesDeAscensao;
exports.selarAlma = selarAlma;
exports.tentarAscender = tentarAscender;
const rng_1 = require("./rng");
const memoria_1 = require("./memoria");
const familia_1 = require("./familia");
exports.DIAS_POR_ANO_JOGADOR = 365;
exports.IDADE_MORTE_MIN_JOGADOR = 65;
const IDADE_MORTE_CHANCE_MAX_JOGADOR = 0.35;
exports.NIVEL_MINIMO_ASCENSAO = 15;
exports.IDADE_MINIMA_ASCENSAO = 60;
exports.ALMAS_MINIMAS_ASCENSAO = 3;
// Idade efetiva do jogador — saves de antes desse campo existir caem no
// padrão de 20 (normalizarCampanha também preenche isso, ver migracao.ts).
function idadeJogador(camp) {
    return camp.personagem.idade ?? 20;
}
function chimAlcancado(camp) {
    return !!camp.ascensao?.chim;
}
// Chamada uma vez por ano de calendário virado, no mesmo gatilho que já
// envelhece as NPCs (ver mundo.ts) — o jogador envelhece junto com o resto
// do vale. Sem Ascensão, corre o mesmo risco real de morte por velhice que
// qualquer NPC corre (ver vidanpc.ts): a idade sobe até pesar de verdade.
function processarEnvelhecimentoJogador(camp) {
    const p = camp.personagem;
    p.idade = idadeJogador(camp) + 1;
    (0, familia_1.sincronizarIdadeFamilia)(camp);
    if (chimAlcancado(camp))
        return; // imortalidade biológica de verdade — o corpo parou de contar
    if (p.idade < exports.IDADE_MORTE_MIN_JOGADOR)
        return;
    const chance = Math.min(IDADE_MORTE_CHANCE_MAX_JOGADOR, (p.idade - exports.IDADE_MORTE_MIN_JOGADOR) * 0.02);
    if ((0, rng_1.nextFloat)(camp.rng) < chance) {
        p.recursos.vida = 0;
        (0, memoria_1.registrarMarco)(camp, `dia ${camp.calendario.dia}: aos ${p.idade} anos, o corpo finalmente parou.`);
    }
}
function condicoesDeAscensao(camp) {
    const nivel = camp.personagem.nivel >= exports.NIVEL_MINIMO_ASCENSAO;
    const idade = idadeJogador(camp) >= exports.IDADE_MINIMA_ASCENSAO;
    const almas = (camp.almasSeladas?.length ?? 0) >= exports.ALMAS_MINIMAS_ASCENSAO;
    return { nivel, idade, almas, completo: nivel && idade && almas };
}
// Chamada quando uma Lua Superior (ou Muzan) cai em combate (nível 10+ —
// ver engine/combat.ts). Selar não exige um verbo/ação separada: a vitória
// em si já é rara e cara o bastante, e um verbo novo só pra incrementar um
// contador seria cerimônia sem substância.
function selarAlma(camp, nomeCriatura) {
    const lista = camp.almasSeladas ?? (camp.almasSeladas = []);
    if (lista.includes(nomeCriatura))
        return;
    lista.push(nomeCriatura);
    (0, memoria_1.registrarMarco)(camp, `a alma de ${nomeCriatura} está selada — mais um pilar da Ascensão cumprido.`);
}
// Tentativa deliberada do jogador (chamada por uma ação da UI, não
// automaticamente) — só funciona quando os três pilares já estão cumpridos.
function tentarAscender(camp) {
    if (chimAlcancado(camp))
        return { ok: false, motivo: 'você já alcançou o CHIM — não há mais o que ascender' };
    const cond = condicoesDeAscensao(camp);
    if (!cond.completo) {
        const faltando = [];
        if (!cond.nivel)
            faltando.push(`nível ${exports.NIVEL_MINIMO_ASCENSAO}+`);
        if (!cond.idade)
            faltando.push(`${exports.IDADE_MINIMA_ASCENSAO}+ anos`);
        if (!cond.almas)
            faltando.push(`${exports.ALMAS_MINIMAS_ASCENSAO} almas seladas`);
        return { ok: false, motivo: `ainda falta: ${faltando.join(', ')}` };
    }
    camp.ascensao = { chim: true, dia: camp.calendario.dia };
    (0, memoria_1.registrarMarco)(camp, `dia ${camp.calendario.dia}: você rompeu a barreira — o CHIM despertou, e o corpo parou de contar os anos.`);
    return { ok: true };
}
