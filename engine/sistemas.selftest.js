"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Integration fixtures: resources/positions prepared explicitly, actions use real APIs.
const vaelhorn_1 = require("../content/vaelhorn");
const balanco_1 = require("./balanco");
const items_1 = require("./items");
const grupo_1 = require("./grupo");
const combat_1 = require("./combat");
const migracao_1 = require("./migracao");
const historiaViva_1 = require("./historiaViva");
const cidades_1 = require("./cidades");
const politica_1 = require("./politica");
const ascensao_1 = require("./ascensao");
const time_1 = require("./time");
const fusao_1 = require("./fusao");
const duelo_1 = require("./duelo");
const rng_1 = require("./rng");
const ok = (v, texto) => { if (!v)
    throw new Error(texto); };
const nova = (seed) => (0, balanco_1.jogadorDeTeste)(vaelhorn_1.conteudoVaelhorn, { nivel: 25, maestriaEspada: 80, atributo: 14, arma: 'espada_longa' }, seed);
const nichirin = vaelhorn_1.conteudoVaelhorn.itens.find(i => i.contraOni && i.slot === 'arma' && i.lojas?.length);
ok(nichirin, 'Catálogo precisa permitir comprar uma arma Nichirin');
{
    const c = nova('fusao');
    c.personagem.artesConhecidas = vaelhorn_1.conteudoVaelhorn.artes.map(a => a.id);
    const [a, b] = (0, fusao_1.escolasDominadas)(vaelhorn_1.conteudoVaelhorn, c), dia = c.calendario.dia;
    ok(!(0, fusao_1.fundirEscolas)(vaelhorn_1.conteudoVaelhorn, c, a, a, 'Inválida').ok, 'Fusão exige escolas diferentes');
    for (let i = 0; i < 3; i++) {
        const r = (0, fusao_1.fundirEscolas)(vaelhorn_1.conteudoVaelhorn, c, a, b, `Estilo ${i}`);
        ok(r.ok && !!(0, fusao_1.artePorId)(vaelhorn_1.conteudoVaelhorn, c, r.arte.id), 'Fusão cria arte resolvível');
    }
    ok(c.calendario.dia >= dia + 9, 'Fusões consomem tempo real');
    ok(!(0, fusao_1.fundirEscolas)(vaelhorn_1.conteudoVaelhorn, c, a, b, 'Quarta').ok, 'Limite de três fusões');
    const salvo = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(c)));
    ok(JSON.stringify(salvo.artesCriadas) === JSON.stringify(c.artesCriadas), 'Save preserva artes criadas');
    const solo = (0, rng_1.createRng)(42), grupo = (0, rng_1.createRng)(42), resultados = new Set();
    let vSolo = 0, vGrupo = 0;
    for (let i = 0; i < 5000; i++) {
        const r = (0, duelo_1.resolverDueloDeFundo)(solo, 0, false);
        resultados.add(r);
        if (r === 'vitoria')
            vSolo++;
        if ((0, duelo_1.resolverDueloDeFundo)(grupo, 0, true) === 'vitoria')
            vGrupo++;
    }
    ok(resultados.size === 3 && vGrupo > vSolo, 'Duelo produz três desfechos e reforço melhora vitória');
    console.log('✓ Fusão, persistência de artes e 10.000 resoluções de duelo');
}
for (let seed = 0; seed < 4; seed++) {
    for (const criatura of vaelhorn_1.conteudoVaelhorn.criaturas) {
        let c = nova(`sistemas-${seed}-${criatura.id}`);
        c.localAtual = nichirin.lojas[0];
        c.personagem.dinheiro = 10000;
        const estoque = (0, items_1.estoqueNaLoja)(vaelhorn_1.conteudoVaelhorn, c, nichirin.id), moedas = c.personagem.dinheiro;
        ok((0, items_1.comprar)(vaelhorn_1.conteudoVaelhorn, c, nichirin.id).ok, 'Compra real da Nichirin');
        ok(c.personagem.dinheiro < moedas && (0, items_1.estoqueNaLoja)(vaelhorn_1.conteudoVaelhorn, c, nichirin.id) === estoque - 1, 'Compra debita moedas e estoque');
        ok((0, items_1.equipar)(vaelhorn_1.conteudoVaelhorn, c, nichirin.id).ok && (0, items_1.armaEquipada)(vaelhorn_1.conteudoVaelhorn, c.personagem)?.contraOni, 'Equipamento real habilita finalização');
        const aliados = vaelhorn_1.conteudoVaelhorn.npcs.filter(n => n.combatente && c.npcState[n.id]?.vivo && (c.npcState[n.id].idade ?? n.idade) >= 18).slice(0, 3);
        for (const n of aliados) {
            c.npcState[n.id].eixos.confianca = 10;
            Object.assign(c.vivo.pessoas[n.id], { local: c.localAtual, deslocado: true, viagem: undefined, objetivo: 'rotina' });
        }
        ok((0, grupo_1.alternarCompanheiro)(vaelhorn_1.conteudoVaelhorn, c, aliados[0].id).ok, 'Primeiro aliado recrutado');
        ok((0, grupo_1.alternarCompanheiro)(vaelhorn_1.conteudoVaelhorn, c, aliados[1].id).ok, 'Segundo aliado recrutado');
        ok(!(0, grupo_1.alternarCompanheiro)(vaelhorn_1.conteudoVaelhorn, c, aliados[2].id).ok, 'Terceiro aliado recusado');
        (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, [criatura.id]);
        if (!c.combate.terminado)
            ok(!(0, grupo_1.alternarCompanheiro)(vaelhorn_1.conteudoVaelhorn, c, aliados[0].id).ok, 'Grupo não muda durante combate');
        // Normalize once to accommodate optional defaults; thereafter full save must match.
        c = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(c)));
        const antes = JSON.stringify(c);
        c = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(antes));
        ok(JSON.stringify(c) === antes, `Save completo com grupo: ${criatura.id}`);
        let passos = 0;
        while (c.combate && !c.combate.terminado && passos++ < 2000) {
            const eu = c.combate.atores.find(a => a.ehJogador);
            const alvo = c.combate.atores.find(a => !a.ehJogador && !a.ehAliado && a.vida > 0 && !a.retirado);
            if (eu.tatico?.sono)
                (0, combat_1.jogadorAcaoTatica)(vaelhorn_1.conteudoVaelhorn, c, 'despertar');
            else if (eu.tatico?.preso)
                (0, combat_1.jogadorAcaoTatica)(vaelhorn_1.conteudoVaelhorn, c, 'libertar');
            else if (alvo)
                (0, combat_1.jogadorAtaca)(vaelhorn_1.conteudoVaelhorn, c, alvo.id);
            else
                break;
        }
        ok(c.combate?.terminado, `Combate termina: ${criatura.id}, seed ${seed}`);
        ok(Number.isFinite(c.personagem.recursos.vida), 'Vida finita após combate');
        ok(c.grupo.length <= 2, 'Grupo respeita limite após combate');
    }
}
console.log(`✓ ${vaelhorn_1.conteudoVaelhorn.criaturas.length * 4} combates de catálogo com compra, grupo e save completos`);
{
    const c = nova('cidade-estavel'), id = Object.keys(c.vivo.cidades)[0], cidade = c.vivo.cidades[id];
    c.continuidade.ameacas = [];
    c.mundo.guerraAtiva = undefined;
    c.continuidade.locais[id].integridade = 100;
    c.continuidade.locais[id].populacao = 100;
    Object.assign(cidade, { comida: 160, materiais: 200, doenca: 0, fomeDias: 0, secaAte: 0 });
    ok((0, cidades_1.iniciarObra)(c, id, 'enfermaria'), 'Obra inicia com materiais');
    ok(!(0, cidades_1.iniciarObra)(c, id, 'muralha'), 'Obras simultâneas bloqueadas');
    const nivel = cidade.edificios.enfermaria;
    for (let d = 0; d < 365; d++) {
        c.calendario = (0, time_1.avancarPeriodos)(c.calendario, time_1.PERIODOS.length);
        (0, cidades_1.processarCidades)(vaelhorn_1.conteudoVaelhorn, c);
        ok(cidade.fomeDias === 0, 'Cidade saudável permanece alimentada nas quatro estações');
    }
    ok(cidade.edificios.enfermaria > nivel, 'Obra termina e serviço entra em funcionamento');
    const ligado = (0, historiaViva_1.cidadeIdDoLocal)(vaelhorn_1.conteudoVaelhorn, c, id);
    ok(ligado === id, 'Mercado resolve cidade correta');
    cidade.secaAte = c.calendario.dia + 30;
    cidade.comida = 0;
    c.calendario = (0, time_1.avancarPeriodos)(c.calendario, time_1.PERIODOS.length);
    (0, cidades_1.processarCidades)(vaelhorn_1.conteudoVaelhorn, c);
    ok(cidade.fomeDias > 0, 'Seca real cria falta de alimento');
    (0, politica_1.processarPolitica)(vaelhorn_1.conteudoVaelhorn, c);
    for (const [faccao, governo] of Object.entries(c.vivo.governos)) {
        ok(!['onis', 'cacadores'].includes(faccao), 'Organizações clandestinas não governam publicamente');
        if (!governo.lider)
            continue;
        const antigo = governo.lider;
        c.npcState[antigo].vivo = false;
        (0, politica_1.processarPolitica)(vaelhorn_1.conteudoVaelhorn, c);
        ok(governo.lider !== antigo, 'Morte provoca substituição da liderança');
    }
    console.log('✓ Ano civil, construção, escassez e sucessão');
}
{
    const c = nova('ascensao');
    c.personagem.idade = 20;
    ok(!(0, ascensao_1.tentarAscender)(c).ok, 'Ascensão exige idade e almas');
    for (const nome of ['A', 'B', 'C'])
        (0, ascensao_1.selarAlma)(c, nome);
    (0, ascensao_1.selarAlma)(c, 'A');
    ok(c.almasSeladas.length === 3, 'Alma não duplica');
    c.personagem.idade = 70;
    ok((0, ascensao_1.tentarAscender)(c).ok, 'Ascensão respeita requisitos');
    ok(!(0, ascensao_1.tentarAscender)(c).ok, 'Ascensão não repete');
    for (let i = 0; i < 100; i++)
        (0, ascensao_1.processarEnvelhecimentoJogador)(c);
    ok(c.personagem.recursos.vida > 0, 'CHIM impede morte por velhice');
    console.log('✓ Requisitos, unicidade e efeito real da ascensão');
}
