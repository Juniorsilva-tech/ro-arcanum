"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conteudoVaelhorn = void 0;
const scenario_1 = require("./scenario");
const classes_1 = require("./classes");
const origins_1 = require("./origins");
const verbs_1 = require("./verbs");
const locations_1 = require("./locations");
const continente_1 = require("./continente");
const povoamento_1 = require("./povoamento");
const npcs_1 = require("./npcs");
const elenco_continente_1 = require("./elenco-continente");
const items_1 = require("./items");
const bestiary_1 = require("./bestiary");
const quests_1 = require("./quests");
const kimetsu_1 = require("./kimetsu");
const desafios_1 = require("./desafios");
const casas_1 = require("./casas");
const book_1 = require("./book");
// O mapa primeiro, porque o povoamento depende dele: cada morador nasce de um
// lugar, e o segredo dele se apoia na historia daquele lugar.
const mapaVaelhorn = (0, continente_1.integrarContinente)(locations_1.locaisVaelhorn);
const moradores = (0, povoamento_1.povoarContinente)(mapaVaelhorn, book_1.faccoesVaelhorn);
exports.conteudoVaelhorn = (0, kimetsu_1.integrarKimetsu)({
    cenario: scenario_1.vaelhorn,
    classes: classes_1.classesVaelhorn,
    origens: origins_1.origensVaelhorn,
    verbos: verbs_1.verbosVaelhorn,
    locais: mapaVaelhorn,
    npcs: [...npcs_1.npcsVaelhorn, ...elenco_continente_1.elencoDoContinente, ...moradores],
    mestres: book_1.mestresVaelhorn,
    trabalhos: book_1.trabalhosVaelhorn,
    artes: book_1.artesVaelhorn,
    reliquias: book_1.reliquiasVaelhorn,
    itens: items_1.itensVaelhorn,
    criaturas: [...bestiary_1.criaturasVaelhorn, ...desafios_1.criaturasDeDesafio],
    desafios: desafios_1.desafiosVaelhorn,
    quests: quests_1.questsVaelhorn,
    faccoes: book_1.faccoesVaelhorn,
    casas: casas_1.casasVaelhorn,
    rivalidadesFaccoes: book_1.rivalidadesVaelhorn,
    encontrosPorTipo: bestiary_1.encontrosPorTipo,
    encontrosPorRegiao: bestiary_1.encontrosPorRegiao,
    localInicial: 'taverna',
});
