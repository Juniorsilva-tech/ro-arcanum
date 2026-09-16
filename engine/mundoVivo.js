"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processarMundoVivo = processarMundoVivo;
const historiaViva_1 = require("./historiaViva");
const cidades_1 = require("./cidades");
const autonomia_1 = require("./autonomia");
const politica_1 = require("./politica");
const nemesis_1 = require("./nemesis");
const missoesVivas_1 = require("./missoesVivas");
const continuidade_1 = require("./continuidade");
const aptidao_1 = require("./aptidao");
const viagem_1 = require("./viagem");
const ganchos_1 = require("./ganchos");
// Called once for each elapsed calendar day, using the same campaign RNG as gameplay.
function processarMundoVivo(content, camp) {
    const v = camp.vivo ?? (0, historiaViva_1.iniciarMundoVivo)(content, camp);
    if (v.ultimoDia >= camp.calendario.dia)
        return;
    (0, cidades_1.processarCidades)(content, camp);
    (0, autonomia_1.processarAutonomia)(content, camp);
    (0, politica_1.processarPolitica)(content, camp);
    (0, nemesis_1.processarNemesis)(content, camp);
    (0, continuidade_1.atualizarAmeacas)(content, camp);
    (0, missoesVivas_1.processarMissoesVivas)(content, camp);
    (0, cidades_1.processarDiretor)(content, camp);
    // Os ganchos escritos a mao nos lugares viram missao. Depois do diretor, de
    // proposito: as crises do mundo tem prioridade na lista, e o gancho entra no
    // espaco que sobra.
    (0, ganchos_1.processarGanchos)(content, camp);
    // Gancho so' queima quando o jogador se envolveu; ignorado, volta a circular.
    (0, ganchos_1.conciliarGanchos)(camp);
    (0, historiaViva_1.descobrirNoticias)(content, camp);
    // Fama persegue a reputacao com atraso, e esfria sem novidade.
    (0, aptidao_1.processarAptidao)(content, camp);
    // Lugar secreto se revela quando a condicao dele e' cumprida, nao por menu.
    (0, viagem_1.avaliarDescobertas)(content, camp);
    v.ultimoDia = camp.calendario.dia;
}
