"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Relatório do banco de provas do combate (ver engine/balanco.ts).
// Uso: npm run balanco -- [combatesPorFaixa]
const vaelhorn_1 = require("../content/vaelhorn");
const balanco_1 = require("./balanco");
const porFaixa = Number(process.argv[2] ?? 300);
const PERFIS = [
    { rotulo: 'recruta', opts: { nivel: 1, maestriaEspada: 5, arma: 'espada_curta', armadura: 'gibao_de_couro', atributo: 10 } },
    { rotulo: 'veterano', opts: { nivel: 12, maestriaEspada: 45, arma: 'espada_curta', armadura: 'gibao_de_couro', atributo: 12 } },
    { rotulo: 'mestre', opts: { nivel: 25, maestriaEspada: 80, arma: 'espada_curta', armadura: 'gibao_de_couro', atributo: 14 } },
    { rotulo: 'cacador com nichirin', opts: { nivel: 20, maestriaEspada: 70, arma: 'lamina_nichirin', armadura: 'gibao_de_couro', atributo: 13 } },
];
let foraDaFaixa = 0;
for (const { rotulo, opts } of PERFIS) {
    console.log(`\n=== ${rotulo.toUpperCase()} ===`);
    console.log(`  ${(0, balanco_1.descreverJogador)(vaelhorn_1.conteudoVaelhorn, opts)}\n`);
    for (const r of (0, balanco_1.medirFaixas)(vaelhorn_1.conteudoVaelhorn, opts, porFaixa)) {
        const alvo = `${r.faixa.alvo[0]}-${r.faixa.alvo[1]}%`;
        const marca = r.dentro ? 'ok  ' : 'FORA';
        if (!r.dentro)
            foraDaFaixa++;
        console.log(`  ${marca} ${r.faixa.nome.padEnd(13)} alvo ${alvo.padEnd(7)}` +
            ` obtido ${String(r.taxa.toFixed(1)).padStart(5)}%` +
            `   razão ${r.razaoMedia.toFixed(2)}   vs ${r.exemplo}`);
    }
    console.log('\n  Cobertura do bestiário (estimativa de duelo, não taxa de vitória):');
    for (const linha of (0, balanco_1.cobertura)(vaelhorn_1.conteudoVaelhorn, opts))
        console.log(`    ${linha}`);
}
console.log(`\n${foraDaFaixa} de ${PERFIS.length * 5} faixas fora do alvo.\n`);
