"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vaelhorn_1 = require("../content/vaelhorn");
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const kimetsu_1 = require("./kimetsu");
const viagem_1 = require("./viagem");
const time_1 = require("./time");
const historiaViva_1 = require("./historiaViva");
const missoesVivas_1 = require("./missoesVivas");
const migracao_1 = require("./migracao");
const acoesMundo_1 = require("./acoesMundo");
const assert = Object.assign((v) => { if (!v)
    throw new Error('Invariante da jornada falhou'); }, {
    equal: (a, b) => { if (a !== b)
        throw new Error(`Esperado ${b}; obtido ${a}`); },
    deepEqual: (a, b) => { if (JSON.stringify(a) !== JSON.stringify(b))
        throw new Error('Save de missões divergiu'); },
});
const nova = (seed) => (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, { nome: 'Viajante', atributos: (0, character_1.atributosBase)(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
const contagens = [];
for (const modo of ['paz', 'crise', 'investigacao']) {
    let onis = 0;
    for (let seed = 0; seed < 8; seed++) {
        const c = nova(`presenca-${seed}`);
        c.localAtual = 'estrada';
        c.calendario.periodoIndex = 5;
        if (modo === 'crise')
            c.continuidade.ameacas.push({ id: 'fixture', rivalId: 'fixture', criaturaId: 'oni_faminto', local: 'estrada', inicio: 0, prazo: 99999, estado: 'ativa', descoberta: true });
        if (modo === 'investigacao') {
            const f = (0, historiaViva_1.registrarFato)(c, { tipo: 'fixture', local: 'estrada', texto: 'Rastros', atores: [], publico: true });
            (0, missoesVivas_1.oferecerMissao)(c, 'investigar', f).estado = 'aceita';
        }
        for (let i = 0; i < 1000; i++) {
            c.calendario.dia = i;
            const r = (0, viagem_1.rolarEncontroContextual)(vaelhorn_1.conteudoVaelhorn, c, 'noite', 5, vaelhorn_1.conteudoVaelhorn.encontrosPorTipo.estrada);
            if (r?.some(id => vaelhorn_1.conteudoVaelhorn.criaturas.find(m => m.id === id)?.oni))
                onis++;
        }
    }
    contagens.push(onis);
    console.log(`Presença ${modo}: ${onis}/8000 sorteios com oni`);
}
assert(contagens[0] < contagens[1] && contagens[1] < contagens[2]);
{
    const c = nova('respiro');
    c.localAtual = 'estrada';
    c.calendario.periodoIndex = 5;
    c.flags['narrativa.ultimoOniCasual'] = c.calendario.dia;
    assert.equal((0, viagem_1.presencaOniCasual)(c), 0);
    assert.equal((0, viagem_1.rolarEncontroContextual)(vaelhorn_1.conteudoVaelhorn, c, 'noite', 5, ['oni_faminto']), null);
    c.calendario.dia += 3;
    assert.equal((0, viagem_1.presencaOniCasual)(c), .08);
    c.calendario.periodoIndex = 1;
    for (let i = 0; i < 100; i++)
        assert.equal((0, viagem_1.rolarEncontroContextual)(vaelhorn_1.conteudoVaelhorn, c, 'manha', 5, ['oni_faminto']), null);
    const salvo = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(c)));
    assert.equal(salvo.flags['narrativa.ultimoOniCasual'], c.flags['narrativa.ultimoOniCasual']);
}
let amostras = 0, combates = 0, onis = 0, casos = 0;
for (const local of vaelhorn_1.conteudoVaelhorn.locais)
    for (let periodo = 0; periodo < time_1.PERIODOS.length; periodo++) {
        const c = nova(`${local.id}-${periodo}`);
        c.localAtual = local.id;
        c.calendario.periodoIndex = periodo;
        const pool = (0, kimetsu_1.encontrosElegiveis)(vaelhorn_1.conteudoVaelhorn, c, vaelhorn_1.conteudoVaelhorn.encontrosPorTipo?.[local.tipo] ?? []);
        assert(pool.every(id => vaelhorn_1.conteudoVaelhorn.criaturas.some(m => m.id === id)));
        if ((0, kimetsu_1.solDireto)(vaelhorn_1.conteudoVaelhorn, c))
            assert(pool.every(id => { const m = vaelhorn_1.conteudoVaelhorn.criaturas.find(m => m.id === id); return !m.oni || m.imuneLuz; }));
        let n = 0, o = 0;
        for (let i = 0; i < 400; i++) {
            const encontro = (0, viagem_1.rolarEncontroDeViagem)(c, time_1.PERIODOS[periodo], local.perigo, pool);
            if (encontro) {
                n++;
                assert(encontro.every(id => pool.includes(id)));
                if (encontro.some(id => vaelhorn_1.conteudoVaelhorn.criaturas.find(m => m.id === id)?.oni))
                    o++;
            }
        }
        amostras += 400;
        combates += n;
        onis += o;
        if (local.id === 'estrada')
            console.log(`Estrada ${time_1.PERIODOS[periodo]}: ${o}/400 sorteios com oni; ${n} encontros totais`);
        casos++;
    }
console.log(`Encontros: ${casos} locais/horários, ${amostras} sorteios, ${combates} encontros, ${onis} com oni. Fixture sem viagem/Nemesis.`);
const tipos = ['abastecer', 'tratar', 'escoltar', 'reconstruir', 'resgatar', 'investigar'];
for (const tipo of ['abastecer', 'tratar', 'reconstruir', 'resgatar']) {
    const c = nova(`acao-${tipo}`), local = Object.keys(c.vivo.cidades)[0];
    c.localAtual = local;
    c.familia.prologoConcluido = true;
    c.calendario.periodoIndex = 1;
    c.personagem.condicoes = [];
    c.personagem.dinheiro = 100;
    const cidade = c.vivo.cidades[local];
    cidade.comida = 0;
    cidade.fomeDias = 4;
    cidade.doenca = 70;
    c.continuidade.locais[local].integridade = 30;
    const ator = Object.keys(c.vivo.pessoas).find(id => c.npcState[id]?.vivo);
    c.vivo.pessoas[ator].objetivo = 'cativo';
    const fato = (0, historiaViva_1.registrarFato)(c, { tipo: 'fixture', local, texto: 'Necessidade real', atores: [], publico: true });
    const q = (0, missoesVivas_1.oferecerMissao)(c, tipo, fato, tipo === 'resgatar' ? { ator } : {}, vaelhorn_1.conteudoVaelhorn);
    assert((0, acoesMundo_1.executarAcaoMundo)(vaelhorn_1.conteudoVaelhorn, c, { tipo: 'missao', id: q.id, escolha: 'aceitar' }).ok);
    assert((0, acoesMundo_1.executarAcaoMundo)(vaelhorn_1.conteudoVaelhorn, c, { tipo: 'missao', id: q.id, escolha: 'ajudar' }).ok);
    assert.equal(q.estado, 'concluida');
    assert.equal(c.personagem.dinheiro, 100 - 30 + q.recompensa);
    if (tipo === 'abastecer')
        assert(cidade.comida > 0 && cidade.fomeDias === 0);
    if (tipo === 'tratar')
        assert(cidade.doenca < 70);
    if (tipo === 'reconstruir')
        assert(c.continuidade.locais[local].integridade > 30);
    if (tipo === 'resgatar')
        assert.equal(c.vivo.pessoas[ator].objetivo, 'trabalhar');
    console.log(`Ação real ${tipo}: aceitação, ajuda, débito e consequência OK`);
}
for (const tipo of tipos)
    for (const aceita of [false, true]) {
        const c = nova(`${tipo}-${aceita}`), local = Object.keys(c.vivo.cidades)[0];
        c.localAtual = local;
        c.vivo.missoes = [];
        const cidade = c.vivo.cidades[local];
        cidade.fomeDias = 4;
        cidade.comida = 0;
        cidade.doenca = 70;
        c.continuidade.locais[local].integridade = 30;
        const fato = (0, historiaViva_1.registrarFato)(c, { tipo: 'fixture', local, texto: 'Crise controlada', atores: [], publico: true });
        const q = (0, missoesVivas_1.oferecerMissao)(c, tipo, fato, {}, vaelhorn_1.conteudoVaelhorn);
        assert(q && q.prazo > c.calendario.dia);
        assert(!(0, missoesVivas_1.oferecerMissao)(c, tipo, fato, {}, vaelhorn_1.conteudoVaelhorn));
        if (aceita) {
            q.estado = 'aceita';
            q.aceitaEm = c.calendario.dia;
        }
        const salvo = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(c)));
        assert.deepEqual(salvo.vivo.missoes, c.vivo.missoes);
        const dinheiro = c.personagem.dinheiro;
        c.calendario.dia = q.prazo + 1;
        (0, missoesVivas_1.processarMissoesVivas)(vaelhorn_1.conteudoVaelhorn, c);
        assert.equal(q.estado, 'falhada');
        assert.equal(c.personagem.dinheiro, dinheiro);
        assert.equal(c.vivo.contadores[aceita ? 'compromissosFalhados' : 'oportunidadesExpiradas'], 1);
        (0, missoesVivas_1.encerrarMissao)(c, q, 'concluida', 'Não pode pagar missão encerrada');
        assert.equal(c.personagem.dinheiro, dinheiro);
        const outra = (0, missoesVivas_1.oferecerMissao)(c, tipo, fato, {}, vaelhorn_1.conteudoVaelhorn);
        outra.estado = 'aceita';
        (0, missoesVivas_1.encerrarMissao)(c, outra, 'concluida', 'Fixture do contrato de recompensa');
        (0, missoesVivas_1.encerrarMissao)(c, outra, 'concluida', 'Repetição');
        assert.equal(c.personagem.dinheiro, dinheiro + outra.recompensa);
        console.log(`Missão ${tipo}, aceita=${aceita}: prazo, duplicata, save, expiração, contador, recompensa única OK`);
    }
