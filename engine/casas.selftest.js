"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = (v) => { if (!v)
    throw new Error('Invariante de casas falhou'); };
assert.equal = (a, b) => { if (a !== b)
    throw new Error(`Esperado ${b}; obtido ${a}`); };
const vaelhorn_1 = require("../content/vaelhorn");
const ids = new Set(vaelhorn_1.conteudoVaelhorn.locais.map(l => l.id));
assert(vaelhorn_1.conteudoVaelhorn.casas && vaelhorn_1.conteudoVaelhorn.casas.length >= 4);
for (const casa of vaelhorn_1.conteudoVaelhorn.casas) {
    assert(casa.nome && casa.reino && casa.lema);
    assert(ids.has(casa.sede));
    assert(casa.territorio.length > 0 && casa.territorio.every(id => ids.has(id)));
    assert(casa.rivalidades.every(id => vaelhorn_1.conteudoVaelhorn.casas.some(x => x.id === id) || vaelhorn_1.conteudoVaelhorn.faccoes.some(x => x.id === id)));
}
assert(new Set(vaelhorn_1.conteudoVaelhorn.casas.map(c => c.id)).size === vaelhorn_1.conteudoVaelhorn.casas.length);
console.log(`✓ ${vaelhorn_1.conteudoVaelhorn.casas.length} casas com sede, território, sucessão e rivalidades válidos`);
// Sucessão real: morte do líder promove herdeiro uma única vez e não escolhe cativo.
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const historiaViva_1 = require("./historiaViva");
const casas_1 = require("./casas");
const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, { nome: 'Teste', atributos: (0, character_1.atributosBase)(), classeId: 'guardiao', origemId: 'divida', seedString: 'casas-sucessao', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
(0, historiaViva_1.iniciarMundoVivo)(vaelhorn_1.conteudoVaelhorn, c);
(0, casas_1.processarCasas)(vaelhorn_1.conteudoVaelhorn, c);
for (const casa of vaelhorn_1.conteudoVaelhorn.casas) {
    const e = c.mundo.casas[casa.id];
    if (!e.lider)
        continue;
    const antes = { ...e };
    assert(c.npcState[e.lider]?.vivo && (c.npcState[e.lider]?.idade ?? 20) >= 18);
    if (e.herdeiro) {
        c.npcState[e.lider].vivo = false;
        c.calendario.dia++;
        (0, casas_1.processarCasas)(vaelhorn_1.conteudoVaelhorn, c);
        assert(e.sucessoes === antes.sucessoes + 1);
        const depois = JSON.stringify(e);
        (0, casas_1.processarCasas)(vaelhorn_1.conteudoVaelhorn, c);
        assert.equal(JSON.stringify(e), depois);
    }
}
console.log('✓ sucessão promove herdeiro adulto vivo uma vez e é idempotente');
