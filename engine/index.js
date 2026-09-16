"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Superfície pública da engine (pacote TS puro, zero dependência de UI — GDD §33).
__exportStar(require("./rng"), exports);
__exportStar(require("./time"), exports);
__exportStar(require("./resolution"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./character"), exports);
__exportStar(require("./effects"), exports);
__exportStar(require("./items"), exports);
__exportStar(require("./combat"), exports);
__exportStar(require("./fusao"), exports);
__exportStar(require("./genese"), exports);
__exportStar(require("./magic"), exports);
__exportStar(require("./quests"), exports);
__exportStar(require("./availability"), exports);
__exportStar(require("./impulsos"), exports);
__exportStar(require("./turn"), exports);
__exportStar(require("./campaign"), exports);
__exportStar(require("./narration"), exports);
__exportStar(require("./llm"), exports);
__exportStar(require("./prosa"), exports);
__exportStar(require("./memoria"), exports);
__exportStar(require("./ritmo"), exports);
__exportStar(require("./risco"), exports);
__exportStar(require("./grade"), exports);
__exportStar(require("./mundo"), exports);
__exportStar(require("./convivio"), exports);
__exportStar(require("./migracao"), exports);
__exportStar(require("./despojos"), exports);
__exportStar(require("./viagem"), exports);
__exportStar(require("./duelo"), exports);
__exportStar(require("./progresso"), exports);
__exportStar(require("./vidanpc"), exports);
__exportStar(require("./guerra"), exports);
__exportStar(require("./ascensao"), exports);
__exportStar(require("./kimetsu"), exports);
__exportStar(require("./aptidao"), exports);
__exportStar(require("./aptidaoTypes"), exports);
__exportStar(require("./continuidade"), exports);
__exportStar(require("./familia"), exports);
__exportStar(require("./elenco"), exports);
__exportStar(require("./grupo"), exports);
__exportStar(require("./progressaoNpc"), exports);
__exportStar(require("./identidade"), exports);
__exportStar(require("./vivoTypes"), exports);
__exportStar(require("./historiaViva"), exports);
__exportStar(require("./acoesMundo"), exports);
__exportStar(require("./cidades"), exports);
__exportStar(require("./nemesis"), exports);
__exportStar(require("./reflexao"), exports);
__exportStar(require("./hermesBridge"), exports);
