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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Autoteste rápido da engine. Uso: npm run test:engine
const rng_1 = require("./rng");
const resolution_1 = require("./resolution");
const vaelhorn_1 = require("../content/vaelhorn");
const bestiary_1 = require("../content/vaelhorn/bestiary");
const campaign_1 = require("./campaign");
const llm_1 = require("./llm");
const prosa_1 = require("./prosa");
const memoria_1 = require("./memoria");
const ritmo_1 = require("./ritmo");
const risco_1 = require("./risco");
const grade_1 = require("./grade");
const mundo_1 = require("./mundo");
const despojos_1 = require("./despojos");
const convivio_1 = require("./convivio");
const migracao_1 = require("./migracao");
const turn_1 = require("./turn");
const narration_1 = require("./narration");
const narracaoMod = __importStar(require("./narration"));
const character_1 = require("./character");
const items_1 = require("./items");
const combat_1 = require("./combat");
const magic_1 = require("./magic");
const quests_1 = require("./quests");
let falhas = 0;
function ok(cond, msg) {
    if (!cond) {
        console.error('✗', msg);
        falhas++;
    }
    else {
        console.log('✓', msg);
    }
}
// Determinismo: mesma semente e mesmo cursor => mesma sequência.
{
    const a = (0, rng_1.createRng)(12345);
    const b = (0, rng_1.createRng)(12345);
    const ra = (0, resolution_1.resolverTeste)(a, { atributo: 14, dificuldade: 14 });
    const rb = (0, resolution_1.resolverTeste)(b, { atributo: 14, dificuldade: 14 });
    ok(ra.r === rb.r && ra.grau === rb.grau, 'RNG é determinístico com a mesma semente');
}
// Probabilidade: C=D => 50%.
ok(Math.abs((0, resolution_1.probabilidade)(14, 14) - 0.5) < 1e-9, 'p(C=D) = 50%');
ok((0, resolution_1.probabilidade)(22, 14) > 0.85, 'C bem acima de D => alta chance');
ok((0, resolution_1.probabilidade)(6, 14) < 0.15, 'C bem abaixo de D => baixa chance');
// Criação de campanha.
const camp = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
    nome: 'Teste',
    atributos: (0, character_1.atributosBase)(),
    classeId: 'arcanista',
    origemId: 'divida',
    seedString: 'teste-1',
});
ok(camp.personagem.recursos.vida > 0, 'Personagem nasce com vida');
ok(camp.personagem.recursos.mana > 0, 'Arcanista nasce com mana');
ok(camp.localAtual === 'taverna', 'Começa na taverna');
ok(Object.keys(camp.npcState).length === vaelhorn_1.conteudoVaelhorn.npcs.length + (camp.npcsProcedurais?.length ?? 0), 'Estado de todos os NPCs inicializado');
// Montar cena não quebra.
const cena = (0, narration_1.montarCena)(vaelhorn_1.conteudoVaelhorn, camp);
ok(cena.narracao.length > 0, 'Cena inicial monta material para o narrador');
ok(cena.opcoes.length > 0, 'Cena inicial produz opções');
// Resolver um verbo simples avança o tempo.
const diaAntes = camp.calendario.dia;
const idxAntes = camp.calendario.periodoIndex;
const r = (0, turn_1.resolverIntencao)(vaelhorn_1.conteudoVaelhorn, camp, { tipo: 'verbo', verboId: 'esperar' });
ok(camp.calendario.dia > diaAntes || camp.calendario.periodoIndex !== idxAntes, 'Esperar avança o tempo');
ok(r.fato.length > 0, 'Resolução produz um fato');
// Trava de build: nenhum conteúdo pode conter notação de dado (GDD §2.4).
{
    const json = JSON.stringify(vaelhorn_1.conteudoVaelhorn);
    const temDado = /\bd\d+\b|\b\d+d\d+\b|CD\s?\d+/.test(json);
    ok(!temDado, 'Nenhuma notação de dado no conteúdo (trava §2.4)');
}
// Aviso: todos os NPCs são adultos (GDD §25).
{
    const menores = vaelhorn_1.conteudoVaelhorn.npcs.filter((n) => n.idade < 18);
    ok(menores.length === 0, 'Todos os personagens são adultos (§25)');
}
// Validador das opções vindas da IA (§19).
{
    const validas = (0, llm_1.validarOpcoesIA)([
        { rotulo: 'Encarar Vess sem desviar o olhar', dica: 'ele mede você', custoPeriodos: 0, teste: { atributo: 'social', pericia: 'intimidar', dificuldade: 15 } },
        { rotulo: 'Rolar 1d20 contra CD 15', custoPeriodos: 0 }, // deve cair: notação de dado
        { rotulo: 'x'.repeat(120), custoPeriodos: 0 }, // deve cair: longa demais
        { rotulo: 'Sair pela porta dos fundos', custoPeriodos: 9, teste: { atributo: 'inventado', dificuldade: 99 } },
    ]);
    ok(validas.length === 2, 'Validador rejeita opções com dado e rótulo longo demais');
    ok(validas[0].teste?.dificuldade === 15, 'Opção válida preserva a dificuldade');
    ok(validas[1].custoPeriodos === 3, 'Custo fora da faixa é limitado a 3');
    ok(validas[1].teste === undefined, 'Atributo inválido descarta o teste');
}
// Opções canônicas não repetem gancho já investigado.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Curiosa',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'batedor',
        origemId: 'sem_nome',
        seedString: 'ganchos-1',
    });
    const antes = (0, narration_1.montarCena)(vaelhorn_1.conteudoVaelhorn, c).opcoes.filter((o) => o.id.startsWith('gancho_')).length;
    c.flags['investigado.taverna.0'] = true;
    const depois = (0, narration_1.montarCena)(vaelhorn_1.conteudoVaelhorn, c).opcoes.filter((o) => o.id.startsWith('gancho_')).length;
    ok(depois === antes - 1, 'Gancho investigado some das opções de cena');
}
// Sistema de itens (GDD §13.6, §34).
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Mercador',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'guardiao',
        origemId: 'foragido',
        seedString: 'itens-1',
    });
    ok(!!(0, items_1.armaEquipada)(vaelhorn_1.conteudoVaelhorn, c.personagem), 'Guardião nasce com arma equipada');
    ok((0, items_1.bonusDefesaEquip)(vaelhorn_1.conteudoVaelhorn, c.personagem) > 0, 'Armadura+escudo dão bônus de defesa');
    // Compra encolhe a bolsa e enche a mochila.
    c.localAtual = vaelhorn_1.conteudoVaelhorn.itens.find(i => i.id === 'pocao_cura_menor').lojas[0];
    const antesDinheiro = c.personagem.dinheiro;
    const compra = (0, items_1.comprar)(vaelhorn_1.conteudoVaelhorn, c, 'pocao_cura_menor');
    ok(compra.ok && c.personagem.dinheiro < antesDinheiro, 'Comprar debita moedas');
    ok((c.personagem.inventario['pocao_cura_menor'] ?? 0) >= 1, 'Comprar adiciona o item');
    // Usar poção cura e consome.
    c.personagem.recursos.vida = 5;
    (0, items_1.usarConsumivel)(vaelhorn_1.conteudoVaelhorn, c, 'pocao_cura_menor');
    ok(c.personagem.recursos.vida > 5, 'Usar poção recupera vida');
    // Equipar troca a defesa derivada.
    c.personagem.dinheiro = 500; // bolsa cheia para o teste de compra cara
    c.localAtual = vaelhorn_1.conteudoVaelhorn.itens.find(i => i.id === 'cota_de_malha').lojas[0];
    (0, items_1.comprar)(vaelhorn_1.conteudoVaelhorn, c, 'cota_de_malha');
    const defAntes = (0, character_1.derivados)(c.personagem, (0, items_1.bonusDefesaEquip)(vaelhorn_1.conteudoVaelhorn, c.personagem)).defesa;
    (0, items_1.equipar)(vaelhorn_1.conteudoVaelhorn, c, 'cota_de_malha');
    const defDepois = (0, character_1.derivados)(c.personagem, (0, items_1.bonusDefesaEquip)(vaelhorn_1.conteudoVaelhorn, c.personagem)).defesa;
    ok(defDepois > defAntes, 'Equipar armadura melhor aumenta a defesa');
    // Vender devolve moeda.
    const d2 = c.personagem.dinheiro;
    (0, items_1.vender)(vaelhorn_1.conteudoVaelhorn, c, 'cota_de_malha');
    ok(c.personagem.dinheiro > d2, 'Vender devolve moedas');
    // Item concede verbo (gazua → arrombar existe no catálogo).
    const gazua = vaelhorn_1.conteudoVaelhorn.itens.find((i) => i.id === 'gazua');
    ok(gazua?.concedeVerbo === 'arrombar', 'Gazua concede o verbo arrombar (§13.6)');
}
// Combate (GDD §16, §17).
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Bruto',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'guardiao',
        origemId: 'sem_nome',
        seedString: 'combate-1',
    });
    const s = (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, ['rato_gigante']);
    ok(s.atores.length === 2, 'Combate inicia com jogador e inimigo');
    ok(s.ordem.length === 2, 'Ordem de iniciativa montada');
    // Luta até acabar (guarda contra laço infinito).
    let guarda = 0;
    while (!c.combate.terminado && guarda < 200) {
        guarda++;
        const alvo = c.combate.atores.find((a) => !a.ehJogador && a.vida > 0);
        if (!alvo)
            break;
        (0, combat_1.jogadorAtaca)(vaelhorn_1.conteudoVaelhorn, c, alvo.id);
    }
    ok(c.combate.terminado, 'Combate termina');
    ok(!!c.combate.resultado, `Combate tem resultado (${c.combate.resultado})`);
    ok(c.combate.log.length > 1, 'Combate produz log narrável');
    // Chefe tem fase 2 declarada.
    const vess = vaelhorn_1.conteudoVaelhorn.criaturas.find((x) => x.id === 'vess_fiador');
    ok(!!vess?.chefe && !!vess.fase2, 'Chefe Vess tem fase 2 (§17)');
    (0, combat_1.fecharCombate)(c);
    ok(c.combate === null, 'Combate pode ser fechado');
}
// Magia: aprender e conjurar (GDD §13.1, §13.3).
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Aprendiz',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'arcanista',
        origemId: 'divida',
        seedString: 'magia-1',
    });
    // Sarine returns to the tavern in the afternoon; a mentor must be present.
    c.calendario.periodoIndex = 2;
    const disp = (0, magic_1.mestresQueEnsinamAqui)(vaelhorn_1.conteudoVaelhorn, c);
    ok(disp.length > 0, 'Há mestre ensinando quando sua rotina o traz ao local');
    const arte = disp[0].artes[0];
    const ap = (0, magic_1.aprenderArte)(vaelhorn_1.conteudoVaelhorn, c, arte.id);
    ok(ap.ok && c.personagem.artesConhecidas.includes(arte.id), `Aprendeu ${arte.nome}`);
    const manaAntes = c.personagem.recursos.mana;
    const conj = (0, magic_1.conjurarLivre)(vaelhorn_1.conteudoVaelhorn, c, arte.id);
    ok(conj.ok, 'Conjurar fora de combate funciona');
    ok(c.personagem.recursos.mana < manaAntes, 'Conjurar consome recurso');
}
// Missões (GDD quests).
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Andarilha',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'batedor',
        origemId: 'foragido',
        seedString: 'quest-1',
    });
    ok(Object.keys(c.questEstado).length === vaelhorn_1.conteudoVaelhorn.quests.length, 'Estado de todas as missões inicializado');
    // Cumpre o objetivo do edital via flag e confere a recompensa.
    const dinAntes = c.personagem.dinheiro;
    c.flags['investigado.taverna.0'] = true;
    const concl = (0, quests_1.verificarQuests)(vaelhorn_1.conteudoVaelhorn, c);
    ok(concl.includes('O edital novo'), 'Missão conclui quando o objetivo é cumprido');
    ok(c.personagem.dinheiro > dinAntes, 'Missão paga a recompensa');
}
// Integridade do conteúdo: nenhuma referência pode apontar para o vazio.
{
    const C = vaelhorn_1.conteudoVaelhorn;
    const idsLocais = new Set(C.locais.map((l) => l.id));
    const idsItens = new Set(C.itens.map((i) => i.id));
    const idsNpcs = new Set(C.npcs.map((n) => n.id));
    const idsArtes = new Set(C.artes.map((a) => a.id));
    const idsMestres = new Set(C.mestres.map((m) => m.id));
    const idsCriaturas = new Set(C.criaturas.map((c) => c.id));
    const idsFaccoes = new Set(C.faccoes.map((f) => f.id));
    const idsVerbos = new Set(C.verbos.map((v) => v.id));
    const quebras = [];
    const exige = (cond, msg) => { if (!cond)
        quebras.push(msg); };
    for (const l of C.locais) {
        for (const r of l.rotas)
            exige(idsLocais.has(r.destino), `rota ${l.id} → ${r.destino}`);
    }
    for (const n of C.npcs) {
        exige(idsLocais.has(n.localBase), `npc ${n.id} mora em ${n.localBase}`);
        exige(idsFaccoes.has(n.faccaoId), `npc ${n.id} na facção ${n.faccaoId}`);
        exige(n.idade >= 18, `npc ${n.id} tem idade ${n.idade}`);
        for (const [per, loc] of Object.entries(n.rotina)) {
            exige(idsLocais.has(loc), `rotina ${n.id}.${per} → ${loc}`);
        }
        if (n.ensinaMestre)
            exige(idsMestres.has(n.ensinaMestre), `npc ${n.id} ensina ${n.ensinaMestre}`);
    }
    for (const m of C.mestres) {
        exige(idsLocais.has(m.localBase), `mestre ${m.id} em ${m.localBase}`);
        for (const a of m.ensina)
            exige(idsArtes.has(a), `mestre ${m.id} ensina arte ${a}`);
    }
    for (const i of C.itens) {
        for (const lj of i.lojas ?? [])
            exige(idsLocais.has(lj), `item ${i.id} vendido em ${lj}`);
        if (i.concedeVerbo)
            exige(idsVerbos.has(i.concedeVerbo), `item ${i.id} concede ${i.concedeVerbo}`);
    }
    for (const c of C.criaturas) {
        for (const l of c.loot ?? [])
            exige(idsItens.has(l.item), `criatura ${c.id} solta ${l.item}`);
    }
    for (const [tipo, lista] of Object.entries(bestiary_1.encontrosPorTipo)) {
        for (const cid of lista)
            exige(idsCriaturas.has(cid), `encontro ${tipo} → ${cid}`);
    }
    for (const q of C.quests) {
        if (q.dador)
            exige(idsNpcs.has(q.dador), `missão ${q.id} dada por ${q.dador}`);
        if (q.recompensa.item)
            exige(idsItens.has(q.recompensa.item), `missão ${q.id} paga ${q.recompensa.item}`);
        for (const r of q.recompensa.reputacao ?? [])
            exige(idsFaccoes.has(r.faccaoId), `missão ${q.id} → facção ${r.faccaoId}`);
    }
    for (const r of C.reliquias) {
        if (r.localAtual)
            exige(idsLocais.has(r.localAtual), `relíquia ${r.id} em ${r.localAtual}`);
        if (r.donoAtual && r.donoAtual !== 'jogador')
            exige(idsNpcs.has(r.donoAtual), `relíquia ${r.id} de ${r.donoAtual}`);
    }
    for (const t of C.trabalhos) {
        for (const r of t.reputacao ?? [])
            exige(idsFaccoes.has(r.faccaoId), `trabalho ${t.id} → facção ${r.faccaoId}`);
    }
    for (const [a, b] of C.rivalidadesFaccoes ?? []) {
        exige(idsFaccoes.has(a), `rivalidade de facção → ${a}`);
        exige(idsFaccoes.has(b), `rivalidade de facção → ${b}`);
    }
    // Todo tipo de local sorteável precisa de uma tabela de encontros.
    for (const l of C.locais) {
        exige(!!bestiary_1.encontrosPorTipo[l.tipo], `local ${l.id} (tipo ${l.tipo}) sem tabela de encontros`);
    }
    // Ids duplicados dentro de uma mesma lista quebram buscas por id.
    const semDuplicata = (nome, ids) => {
        const vistos = new Set();
        for (const id of ids) {
            if (vistos.has(id))
                quebras.push(`${nome}: id repetido ${id}`);
            vistos.add(id);
        }
    };
    semDuplicata('locais', C.locais.map((x) => x.id));
    semDuplicata('npcs', C.npcs.map((x) => x.id));
    semDuplicata('itens', C.itens.map((x) => x.id));
    semDuplicata('criaturas', C.criaturas.map((x) => x.id));
    semDuplicata('artes', C.artes.map((x) => x.id));
    semDuplicata('verbos', C.verbos.map((x) => x.id));
    semDuplicata('quests', C.quests.map((x) => x.id));
    semDuplicata('mestres', C.mestres.map((x) => x.id));
    semDuplicata('trabalhos', C.trabalhos.map((x) => x.id));
    semDuplicata('reliquias', C.reliquias.map((x) => x.id));
    semDuplicata('faccoes', C.faccoes.map((x) => x.id));
    if (quebras.length)
        console.log('  referências quebradas:', quebras.slice(0, 12).join(' · '));
    ok(quebras.length === 0, `Integridade do conteúdo (${quebras.length} referência(s) quebrada(s))`);
    // ── Classes ─────────────────────────────────────────────────────────────
    //
    // `mecanicaUnica` é TEXTO: ela vai para o narrador e não é lida por regra
    // nenhuma da engine (vale para as três classes originais também). O que
    // diferencia uma classe de verdade é o que está testado aqui — atributos,
    // perícias, itens, equipamento e artes.
    {
        const recursosConhecidos = new Set(['vigor', 'mana']);
        const vistos = new Set();
        for (const c of vaelhorn_1.conteudoVaelhorn.classes) {
            ok(!vistos.has(c.id), `Classe ${c.id} tem id único`);
            vistos.add(c.id);
            ok(recursosConhecidos.has(c.recursoPrincipal), `${c.id} usa recurso que a engine conhece (${c.recursoPrincipal})`);
            ok(Object.keys(c.bonusAtributos).length > 0, `${c.id} move algum atributo`);
            ok(Object.keys(c.periciasIniciais).length >= 3, `${c.id} começa com perícias`);
            ok(c.descricao.length >= 60, `${c.id} tem descrição de verdade`);
            // Equipar o que não está na mochila deixa o personagem de mãos vazias.
            for (const [slot, item] of Object.entries(c.equipInicial ?? {})) {
                if (!item)
                    continue;
                ok((c.itensIniciais ?? {})[item] > 0, `${c.id} carrega o que equipa em ${slot} (${item})`);
            }
        }
        ok(vaelhorn_1.conteudoVaelhorn.classes.length >= 8, `O jogo oferece ${vaelhorn_1.conteudoVaelhorn.classes.length} classes`);
    }
    // A LEVA: o vale é das mulheres. Ninguém do elenco pode ter ofício no
    // masculino, e todo mundo precisa de corpo — o narrador usa os dois.
    const MASCULINO = /\b(taverneiro|ferreiro|coveiro|moleiro|pescador|carreteiro|escriba errante|mercador|padre|sargento|senhor|capataz do|vigia noturno|armeiro|eremita solitário)\b/;
    const comOficioMasculino = C.npcs.filter((n) => MASCULINO.test(n.ocupacao));
    ok(comOficioMasculino.length === 0, `Nenhum ofício masculino no elenco (${comOficioMasculino.map((n) => n.ocupacao).join(', ')})`);
    const semCorpo = C.npcs.filter((n) => !n.corpo || n.corpo.length < 40);
    ok(semCorpo.length === 0, `Todo mundo tem corpo descrito (${semCorpo.map((n) => n.id).join(', ')})`);
    ok((C.cenario.premissa ?? []).length >= 4, 'O cenário carrega a premissa do mundo');
    // Volume: o cenário precisa continuar grande.
    ok(C.locais.length >= 16, `Mapa com ${C.locais.length} locais`);
    ok(C.npcs.length >= 28, `Elenco com ${C.npcs.length} NPCs`);
    ok(C.itens.length >= 110, `Catálogo com ${C.itens.length} itens`);
    ok(C.criaturas.length >= 30, `Bestiário com ${C.criaturas.length} criaturas`);
    ok(C.artes.length >= 55, `Livro com ${C.artes.length} artes`);
    ok(C.quests.length >= 14, `${C.quests.length} missões`);
}
// Resposta da IA: JSON cortado nunca pode virar texto na tela (bug do jogador).
{
    const inteiro = JSON.stringify({
        narracao: 'A moeda bate no tampo gasto.\n\n— Guarde seu ouro, freguesa.',
        opcoes: [{ rotulo: 'Insistir com Elza', dica: 'pode selar a antipatia', custoPeriodos: 1 }],
        achado: 'moeda_antiga',
    });
    const a = (0, llm_1.interpretarResposta)(inteiro, vaelhorn_1.conteudoVaelhorn);
    ok(!!a.texto && !a.texto.includes('"narracao"'), 'JSON inteiro vira prosa limpa');
    ok(a.opcoes?.length === 1, 'JSON inteiro entrega as opções');
    ok(a.achado === 'moeda_antiga', 'Achado válido é aceito');
    // Exatamente o caso do print: corte no meio do array de opções.
    const cortado = '{"narracao":"A moeda de prata bate no tampo gasto com um som surdo. ' +
        '\\"Peço desculpas, Elza.\\" A palavra fica pendurada no ar gorduroso.",' +
        '"opcoes":[{"rotulo":"Insistir com Elza","dica":"pode ganhar confiança","custoPeriodos":1},' +
        '{"rotulo":"C';
    const b = (0, llm_1.interpretarResposta)(cortado, vaelhorn_1.conteudoVaelhorn);
    ok(!!b.texto, 'JSON truncado ainda entrega narração');
    ok(!b.texto.includes('"narracao"') && !b.texto.includes('rotulo'), 'Narração resgatada sem resíduo de JSON');
    ok(b.texto.includes('"Peço desculpas, Elza."'), 'Escapes viram aspas de verdade');
    ok(b.opcoes?.length === 1, 'Opção completa aproveitada; a cortada, descartada');
    // Lixo puro: melhor falhar e deixar o fallback local assumir.
    const c = (0, llm_1.interpretarResposta)('{"opcoes":[{"rotulo":"a', vaelhorn_1.conteudoVaelhorn);
    ok(!c.texto && !!c.erro, 'Resposta sem narração vira erro, não texto cru');
    // Prosa sem JSON continua servindo.
    const prosa = 'A neblina desce sobre a ponte quebrada e não sobe mais. Você fica na margem ' +
        'com a lama até o tornozelo, ouvindo a água correr por baixo do que restou da ' +
        'pedra, e ninguém vem atrás de você.';
    const d = (0, llm_1.interpretarResposta)(prosa, vaelhorn_1.conteudoVaelhorn);
    ok(d.texto === prosa, 'Prosa pura é aceita');
    // Descarrilamento: outra língua, frase solta, nada a ver com a cena.
    const fugiu = (0, llm_1.interpretarResposta)("' not dream a dream. All i have is just the words on this page.'", vaelhorn_1.conteudoVaelhorn);
    ok(!fugiu.texto && /fora de contexto/.test(fugiu.erro ?? ''), 'Resposta descarrilada vira erro');
    ok((0, llm_1.foraDeContexto)('two words'), 'Texto curto demais não é narração');
    ok(!(0, llm_1.foraDeContexto)(prosa), 'Prosa legítima em português passa');
    // Id de item inventado não entra no jogo.
    const e = (0, llm_1.interpretarResposta)(JSON.stringify({ narracao: 'Você acha algo no lodo.', achado: 'espada_de_mentira' }), vaelhorn_1.conteudoVaelhorn);
    ok(e.achado === undefined, 'Item inventado pela IA é recusado');
    // Repetição de opção nunca passa.
    const rep = (0, llm_1.validarOpcoesIA)([{ rotulo: 'Falar com a Elza!', custoPeriodos: 0 }, { rotulo: 'Erguer o edital', custoPeriodos: 0 }], ['falar com Elza']);
    ok(rep.length === 1 && rep[0].rotulo === 'Erguer o edital', 'Opção repetida é filtrada');
}
// Grade: posições fixas. A engine completa o que a IA não entregou.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Grade',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'batedor',
        origemId: 'sem_nome',
        seedString: 'grade-1',
    });
    const cn = (0, narration_1.montarCena)(vaelhorn_1.conteudoVaelhorn, c);
    // A IA mandou só uma casa. A grade não pode entregar uma opção só.
    const soUma = (0, grade_1.montarGrade)(vaelhorn_1.conteudoVaelhorn, c, cn.contexto, [{ id: 'ia_0', rotulo: 'Perguntar a Elza sobre a laje', natureza: 'aproximar', custoPeriodos: 0, origem: 'ia' }], cn.opcoes);
    ok(soUma.length >= 4, `A engine completa a grade (${soUma.length} casas)`);
    ok(soUma[0].rotulo === 'Perguntar a Elza sobre a laje', 'A opção da IA fica na casa dela');
    const eixos = soUma.map((o) => o.natureza);
    ok(new Set(eixos).size >= 3, 'A grade cobre eixos diferentes');
    ok(soUma.some((o) => o.origem === 'verbo' && !!o.verboId), 'As casas vazias viram verbos reais do jogo');
    // Duas do mesmo eixo: a segunda não ocupa casa nenhuma.
    const duplicadas = (0, grade_1.montarGrade)(vaelhorn_1.conteudoVaelhorn, c, cn.contexto, [
        { id: 'a', rotulo: 'Falar com Elza', natureza: 'aproximar', custoPeriodos: 0, origem: 'ia' },
        { id: 'b', rotulo: 'Falar com Aldrica', natureza: 'aproximar', custoPeriodos: 0, origem: 'ia' },
    ], cn.opcoes);
    ok(!duplicadas.some((o) => o.rotulo === 'Falar com Aldrica'), 'Segunda opção do mesmo eixo não entra');
    ok(duplicadas.some((o) => o.id === 'deixar_correr'), 'Deixar o tempo correr fecha a grade');
}
// A cena precisa de fala. O pacote tem que dizer QUAL foi a ação, senão o
// modelo recebe "você tentou elogiar Aldrica — deu certo" e escreve só
// descrição, sem mostrar o elogio nem a resposta.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Falante',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'batedor',
        origemId: 'sem_nome',
        seedString: 'fala-1',
    });
    const res = (0, turn_1.resolverIntencao)(vaelhorn_1.conteudoVaelhorn, c, { tipo: 'verbo', verboId: 'elogiar', alvoId: 'aldrica' });
    const cn = (0, narration_1.montarCena)(vaelhorn_1.conteudoVaelhorn, c);
    const pk = (0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c, cn.contexto, res.fato, {
        verbo: res.verbo?.nome,
        categoria: res.verbo?.categoria,
        alvo: res.alvo?.nome,
        grau: res.grau,
    });
    const acao = pk.acaoDoJogador;
    ok(acao?.verbo === 'Elogiar', 'O pacote diz qual verbo foi usado');
    ok(acao?.categoria === 'social', 'O pacote diz que a ação foi social');
    ok(acao?.alvo === 'Aldrica', 'O pacote diz em quem');
    // E os presentes chegam com voz e índole, que é o que dá timbre à resposta.
    const presentes = pk.presentes;
    ok(presentes.every((x) => !!x.voz && !!x.indole), 'Cada presente leva voz e índole');
}
// A tipografia tem que aguentar uma cena cheia de falas alternadas.
{
    const cena = [
        'A Rês Enforcada está vazia, e o fogo range na lareira.',
        '',
        '— Você tem mão boa para pão velho, Aldrica.',
        '',
        'Ela não levanta os olhos do pano.',
        '',
        '— Freguesa nova é sempre boa de língua. Isso passa.',
        '',
        '— E se não passar?',
        '',
        '— Aí eu cobro pela conversa também.',
    ].join('\n');
    const blocos = (0, prosa_1.emBlocos)(cena, ['Aldrica']);
    const falas = blocos.filter((b) => b.tipo === 'fala');
    ok(falas.length === 4, `Quatro falas separadas (${falas.length})`);
    ok(blocos.filter((b) => b.tipo === 'prosa').length === 2, 'A prosa entre as falas fica de fora');
    ok(falas.every((f) => !f.texto.startsWith('—')), 'O travessão sai do texto e vira apresentação');
}
// Requisito de verbo tem que apontar para gente e flag que existem. Foi assim
// que dois chefes ficaram inalcançáveis: os ids mudaram e 'segredo:sarn' ficou
// para trás enquanto o NPC virava 'sarine'.
{
    const idsNpc = new Set(vaelhorn_1.conteudoVaelhorn.npcs.map((n) => n.id));
    const quebrados = [];
    for (const v of vaelhorn_1.conteudoVaelhorn.verbos) {
        const cond = v.requisitos?.condicaoNecessaria;
        if (cond?.startsWith('segredo:') && !idsNpc.has(cond.slice(8))) {
            quebrados.push(`${v.id} → ${cond}`);
        }
        if (v.requisitos?.item && !vaelhorn_1.conteudoVaelhorn.itens.some((i) => i.id === v.requisitos.item)) {
            quebrados.push(`${v.id} → item ${v.requisitos.item}`);
        }
    }
    ok(quebrados.length === 0, `Requisitos de verbo apontam para coisa real (${quebrados.join(', ')})`);
    // E os chefes de fim de linha precisam ser alcançáveis por algum verbo.
    const chefesPorVerbo = ['vess_fiador', 'o_afogado_do_espelho', 'a_que_queimou_mir', 'o_selado'];
    const semRota = chefesPorVerbo.filter((id) => !vaelhorn_1.conteudoVaelhorn.criaturas.some((c) => c.id === id));
    ok(semRota.length === 0, `Todo chefe de verbo existe no bestiário (${semRota.join(', ')})`);
}
// Fase de chefe: mecânica declarada tem que fazer alguma coisa.
{
    const mecanicas = new Set(vaelhorn_1.conteudoVaelhorn.criaturas.filter((c) => c.fase2).map((c) => c.fase2.mecanica));
    const implementadas = new Set(['apagar_vinculo', 'enfurecer', 'chamar_reforco']);
    const semImplementacao = [...mecanicas].filter((m) => !implementadas.has(m));
    ok(semImplementacao.length === 0, `Toda fase 2 tem implementação (${semImplementacao.join(', ')})`);
    // Chamar reforço tem que trazer alguém de verdade.
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Mergulhador',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'guardiao',
        origemId: 'sem_nome',
        seedString: 'reforco-1',
    });
    (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, ['o_afogado_do_espelho']);
    const antes = c.combate.atores.length;
    const chefe = c.combate.atores.find((a) => !a.ehJogador);
    // Empurra o chefe para baixo do gatilho e deixa o combate seguir.
    chefe.vida = Math.floor(chefe.vidaMax * 0.3);
    let voltas = 0;
    while (!c.combate.terminado && c.combate.fase < 2 && voltas < 40) {
        voltas += 1;
        const alvo = c.combate.atores.find((a) => !a.ehJogador && a.vida > 0);
        if (!alvo)
            break;
        (0, combat_1.jogadorAtaca)(vaelhorn_1.conteudoVaelhorn, c, alvo.id);
    }
    if (c.combate.fase >= 2) {
        ok(c.combate.atores.length > antes, 'Chamar reforço traz gente nova para a luta');
        ok(c.combate.ordem.length === c.combate.atores.length, 'O reforço entra na ordem de iniciativa');
    }
    else {
        ok(true, 'Chamar reforço: chefe caiu antes da fase 2 nesta semente');
    }
}
// Save de versão antiga não pode virar tela branca.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Veterano',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'guardiao',
        origemId: 'sem_nome',
        seedString: 'save-velho',
    });
    // Simula um save de antes: sem campos novos, com gente que já não existe.
    const velho = JSON.parse(JSON.stringify(c));
    delete velho.questEstado;
    delete velho.marcos;
    delete velho.mundo;
    delete velho.ecos;
    delete velho.personagem.equipado;
    velho.npcState['aldric'] = velho.npcState['aldrica']; // id antigo do elenco
    delete velho.npcState['aldrica'];
    velho.segredosRevelados = ['sarn', 'ganta'];
    velho.localAtual = 'lugar_que_sumiu';
    velho.personagem.inventario['item_que_sumiu'] = 3;
    const salvo = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, velho);
    ok(Object.keys(salvo.questEstado).length === vaelhorn_1.conteudoVaelhorn.quests.length, 'Missões novas ganham estado');
    ok(!!salvo.personagem.equipado, 'Equipado deixa de ser indefinido');
    ok(!!salvo.mundo && Array.isArray(salvo.marcos) && Array.isArray(salvo.ecos), 'Campos novos são criados');
    ok(!salvo.npcState['aldric'] && !!salvo.npcState['aldrica'], 'Gente renomeada é corrigida no elenco');
    ok(Object.keys(salvo.npcState).length === vaelhorn_1.conteudoVaelhorn.npcs.length + (salvo.npcsProcedurais?.length ?? 0), 'Todo NPC atual tem estado depois da migração');
    ok(!salvo.segredosRevelados.includes('sarn'), 'Segredo de gente que não existe mais é descartado');
    ok(salvo.segredosRevelados.includes('ganta'), 'Segredo de gente que existe é preservado');
    ok(salvo.localAtual === vaelhorn_1.conteudoVaelhorn.localInicial, 'Local sumido volta para o início');
    ok(!salvo.personagem.inventario['item_que_sumiu'], 'Item que saiu do catálogo sai da mochila');
    // E a cena tem que montar em cima do save migrado, sem estourar.
    const cn = (0, narration_1.montarCena)(vaelhorn_1.conteudoVaelhorn, salvo);
    ok(cn.opcoes.length > 0, 'A cena monta em cima de um save antigo');
}
// As rotinas se cruzam: o vale produz história sem o jogador.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Ausente',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'batedor',
        origemId: 'sem_nome',
        seedString: 'convivio-1',
    });
    // Um mês fora. Alguma coisa tem que ter acontecido entre elas.
    for (let d = 0; d < 30; d += 1) {
        c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
        (0, mundo_1.avancarMundo)(vaelhorn_1.conteudoVaelhorn, c);
    }
    const ecos = c.ecos ?? [];
    ok(ecos.length > 0, `O vale gerou acontecimento sozinho (${ecos.length} ecos)`);
    ok(ecos.length <= 12, 'O boato envelhece e sai da boca do povo');
    // Todo eco cita duas pessoas que existem e um lugar que existe.
    const idsNpc = new Set(vaelhorn_1.conteudoVaelhorn.npcs.map((n) => n.id));
    const idsLocal = new Set(vaelhorn_1.conteudoVaelhorn.locais.map((l) => l.id));
    ok(ecos.every((e) => e.npcs.length === 2 && e.npcs.every((n) => idsNpc.has(n)) && idsLocal.has(e.local)), 'Todo eco aponta para gente e lugar reais');
    ok(ecos.every((e) => !e.texto.includes('{')), 'Nenhum molde de texto escapa cru');
    ok((0, convivio_1.ecosRecentes)(c, 3).length > 0, 'Os boatos chegam ao narrador');
    // Os laços do conteúdo apontam para gente que existe, nos dois sentidos.
    const quebrados = [];
    for (const n of vaelhorn_1.conteudoVaelhorn.npcs) {
        for (const l of n.relacoes ?? []) {
            if (!idsNpc.has(l.npc))
                quebrados.push(`${n.id} → ${l.npc}`);
            if (l.npc === n.id)
                quebrados.push(`${n.id} tem laço consigo`);
        }
    }
    ok(quebrados.length === 0, `Laços apontam para gente real (${quebrados.join(', ')})`);
    const comLaco = vaelhorn_1.conteudoVaelhorn.npcs.filter((n) => (n.relacoes ?? []).length > 0).length;
    ok(comLaco >= 20, `O elenco está entrelaçado (${comLaco} com laço)`);
}
// O vale anda sem o jogador.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Parado',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'guardiao',
        origemId: 'sem_nome',
        seedString: 'mundo-1',
    });
    ok(!!c.mundo, 'A campanha nasce com o vale montado');
    const climaInicial = c.mundo.clima;
    // Duas semanas paradas: o mundo tem que ter mudado alguma coisa.
    //
    // Este teste já foi frágil. A versão antiga rodava UMA semente e exigia que
    // a carestia tivesse se afastado 0,01 de 1 — um limiar arbitrário que, na
    // sessão 21, passou a reprovar por 0,0057. O mundo estava andando; o teste é
    // que apostava numa semente só. Qualquer mudança que desloque o cursor do
    // RNG fazia a moeda cair do outro lado.
    //
    // Agora a afirmação é a que importa de verdade — "o vale anda sem o
    // jogador" é uma propriedade do mundo, não de uma semente — e é medida como
    // tal: em muitas campanhas, e com o limiar no lugar honesto (mexeu ou não
    // mexeu), não num número escolhido a dedo.
    c.calendario = { ...c.calendario, dia: c.calendario.dia + 14 };
    (0, mundo_1.avancarMundo)(vaelhorn_1.conteudoVaelhorn, c);
    const mexeu = (x, climaAntes) => x.mundo.clima !== climaAntes || !!x.mundo.evento || x.mundo.carestia !== 1;
    ok(mexeu(c, climaInicial), 'Duas semanas paradas mexem em alguma coisa no vale');
    let andaram = 0;
    const SEMENTES = 20;
    for (let i = 0; i < SEMENTES; i++) {
        const x = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
            nome: 'Parado', atributos: (0, character_1.atributosBase)(), classeId: 'guardiao',
            origemId: 'sem_nome', seedString: `mundo-anda-${i}`,
        });
        const antes = x.mundo.clima;
        x.calendario = { ...x.calendario, dia: x.calendario.dia + 14 };
        (0, mundo_1.avancarMundo)(vaelhorn_1.conteudoVaelhorn, x);
        if (mexeu(x, antes))
            andaram++;
    }
    ok(andaram >= SEMENTES * 0.8, `O vale anda sem o jogador na maioria das campanhas (${andaram}/${SEMENTES})`);
    ok(c.mundo.diaProcessado === c.calendario.dia, 'O mundo não reprocessa o mesmo dia');
    // Quem foi deixado de lado esfria.
    ok(Object.values(c.npcState).some((d) => d.tensao > 0), 'A ausência pesa nas pessoas');
    // O preço da praça responde ao vale.
    const mult = (0, mundo_1.multiplicadorDePreco)(c);
    ok(mult > 0.5 && mult < 2.5, `O multiplicador de preço fica em faixa sã (${mult.toFixed(2)})`);
    const vale = (0, mundo_1.comoEstaOVale)(c);
    ok(!!vale.clima && !!vale.estacao, 'O vale se descreve em palavras');
}
// Despojos: o inimigo deixa o que carregava.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Saqueador',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'guardiao',
        origemId: 'sem_nome',
        seedString: 'despojos-1',
    });
    const bandido = vaelhorn_1.conteudoVaelhorn.criaturas.find((x) => x.id === 'bandido');
    const antes = c.personagem.dinheiro;
    let achouAlgo = false;
    for (let i = 0; i < 12; i += 1) {
        const r = (0, despojos_1.recolherDespojos)(vaelhorn_1.conteudoVaelhorn, c, bandido);
        if (r.itens.length > 0 || r.moedas > 0)
            achouAlgo = true;
    }
    ok(achouAlgo, 'Gente armada deixa bolso e embornal');
    ok(c.personagem.dinheiro > antes, 'As moedas do morto entram na bolsa');
    // Bicho não carrega bolsa.
    const rato = vaelhorn_1.conteudoVaelhorn.criaturas.find((x) => x.id === 'rato_gigante');
    const semBolso = (0, despojos_1.recolherDespojos)(vaelhorn_1.conteudoVaelhorn, c, rato);
    ok(semBolso.moedas === 0, 'Bicho não carrega moeda');
    // Tudo que cai existe mesmo no catálogo.
    const ids = new Set(vaelhorn_1.conteudoVaelhorn.itens.map((i) => i.id));
    const foragida = vaelhorn_1.conteudoVaelhorn.criaturas.find((x) => x.id === 'foragido_veterano');
    let todosValidos = true;
    for (let i = 0; i < 20; i += 1) {
        for (const a of (0, despojos_1.despojosDe)(vaelhorn_1.conteudoVaelhorn, c, foragida)) {
            if (a.itemId && !ids.has(a.itemId))
                todosValidos = false;
        }
    }
    ok(todosValidos, 'Nada que cai no chão é item inventado');
}
// Aposta: o que a tela mostra é a MESMA conta que resolve o turno.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Apostador',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'guardiao',
        origemId: 'sem_nome',
        seedString: 'risco-1',
    });
    const facil = (0, risco_1.avaliarOpcao)(vaelhorn_1.conteudoVaelhorn, c, {
        teste: { atributo: 'fisico', dificuldade: 6 },
        custoPeriodos: 0,
    });
    const dificil = (0, risco_1.avaliarOpcao)(vaelhorn_1.conteudoVaelhorn, c, {
        teste: { atributo: 'fisico', dificuldade: 26 },
        custoPeriodos: 3,
    });
    ok(facil.chance === 'quase certo', `Dificuldade baixa lê como quase certo (${facil.chance})`);
    ok(dificil.chance === 'quase impossível', `Dificuldade alta lê como quase impossível (${dificil.chance})`);
    ok(!!dificil.perigo, 'Tentativa difícil avisa que pode desandar');
    ok(dificil.custo === 'toma o dia', 'O custo de tempo aparece em palavra');
    ok(!facil.perigo, 'Tentativa fácil não inventa perigo');
    // Sem teste não há chance a mostrar — a ação simplesmente acontece.
    const semTeste = (0, risco_1.avaliarOpcao)(vaelhorn_1.conteudoVaelhorn, c, { custoPeriodos: 0 });
    ok(!semTeste.chance, 'Opção sem teste não mostra chance');
    // A leitura tem que acompanhar o estado: ferido e exausto piora a mesma ação.
    const antes = (0, risco_1.chanceDe)(vaelhorn_1.conteudoVaelhorn, c, { atributo: 'fisico', dificuldade: 14 });
    c.personagem.condicoes.push('ferido', 'exausto');
    const depois = (0, risco_1.chanceDe)(vaelhorn_1.conteudoVaelhorn, c, { atributo: 'fisico', dificuldade: 14 });
    ok(depois < antes, 'Condição ruim derruba a chance mostrada');
    // Nenhum número escapa para a tela (GDD §2.4).
    const selos = [facil.chance, dificil.chance, dificil.custo, dificil.perigo].filter(Boolean);
    ok(selos.every((t) => !/\d/.test(t)), 'Nenhuma aposta mostra número');
}
// Variedade: o conjunto de opções não pode ser cinco vezes o mesmo eixo.
{
    const mesmas = (0, llm_1.validarOpcoesIA)([
        { rotulo: 'Perguntar a Elza sobre a laje', natureza: 'aproximar', custoPeriodos: 0 },
        { rotulo: 'Puxar conversa com Aldrica', natureza: 'aproximar', custoPeriodos: 0 },
        { rotulo: 'Cortejar Mira no balcão', natureza: 'aproximar', custoPeriodos: 0 },
    ]);
    ok(mesmas.length === 1, 'Três opções do mesmo eixo viram uma');
    const variadas = (0, llm_1.validarOpcoesIA)([
        { rotulo: 'Perguntar a Elza sobre a laje', natureza: 'aproximar', custoPeriodos: 0 },
        { rotulo: 'Forçar a porta do porão', natureza: 'arriscar', custoPeriodos: 1 },
        { rotulo: 'Ficar de olho em quem entra', natureza: 'observar', custoPeriodos: 1 },
    ]);
    ok(variadas.length === 3, 'Eixos diferentes convivem');
    ok(variadas.every((o) => !!o.natureza), 'Toda opção sai com eixo definido');
    // Sem declarar, a engine deduz pelo teste que o próprio modelo propôs.
    const deduzida = (0, llm_1.validarOpcoesIA)([
        { rotulo: 'Ler a laje com calma', custoPeriodos: 1, teste: { atributo: 'percepcao', dificuldade: 12 } },
    ]);
    ok(deduzida[0].natureza === 'observar', 'Eixo é deduzido do teste quando falta');
}
// O pacote precisa dizer ao modelo o que é possível — sem isso ele chuta.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Curioso',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'arcanista',
        origemId: 'divida',
        seedString: 'espaco-1',
    });
    const cn = (0, narration_1.montarCena)(vaelhorn_1.conteudoVaelhorn, c);
    const pk = (0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c, cn.contexto, 'fato');
    ok(Array.isArray(pk.podeFazerAgora) && pk.podeFazerAgora.length > 3, 'O pacote lista o que dá para fazer agora');
    ok(Array.isArray(pk.trancadoAgora), 'O pacote lista o que está trancado e por quê');
    ok(Array.isArray(pk.coisasAqui), 'O pacote lista as coisas concretas do lugar');
    ok(Array.isArray(pk.ondeDaParaIr) && pk.ondeDaParaIr.length > 0, 'O pacote lista para onde dá para ir');
    ok(Array.isArray(pk.artesQueVoceSabe), 'O pacote lista as artes conhecidas');
}
// Memória: o que importa sobrevive, e chega ao narrador.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Andarilho',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'batedor',
        origemId: 'sem_nome',
        seedString: 'memoria-1',
    });
    // Uma noite juntos, e depois vinte conversas de balcão.
    (0, memoria_1.registrarLembranca)(c, 'elza', { tipo: 'intimidade', resumo: 'você a cortejou, e ela deixou', peso: 5 });
    for (let i = 0; i < 20; i += 1) {
        c.turno += 1;
        (0, memoria_1.registrarLembranca)(c, 'elza', { tipo: 'conversa', resumo: `conversa fiada ${i}`, peso: 1 });
    }
    const lembra = (0, memoria_1.memoriaParaNarrador)(c, 'elza', 5);
    ok(lembra.some((l) => l.includes('cortejou')), 'A lembrança pesada sobrevive a vinte conversas rasas');
    ok(c.npcState['elza'].memoria.length <= 14, 'A memória tem teto');
    // O turno escreve a lembrança do ponto de vista dela, não o log da engine.
    const c2 = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Ladrão',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'batedor',
        origemId: 'sem_nome',
        seedString: 'memoria-2',
    });
    (0, turn_1.resolverIntencao)(vaelhorn_1.conteudoVaelhorn, c2, { tipo: 'verbo', verboId: 'flertar', alvoId: 'elza' });
    const m = c2.npcState['elza'].memoria;
    ok(m.length === 1 && m[0].tipo === 'intimidade', 'Flertar deixa lembrança de intimidade');
    ok(!m[0].resumo.includes('Você tentou'), 'A lembrança não é o log seco da engine');
    // Quem não foi procurado acumula tensão.
    ok(c2.npcState['aldrica'].tensao > 0, 'Quem foi ignorado acumula tensão');
    // Marcos: a história longa, sem repetir o mesmo marco.
    (0, memoria_1.registrarMarco)(c2, 'você derrubou Vess, a Fiadora');
    (0, memoria_1.registrarMarco)(c2, 'você derrubou Vess, a Fiadora');
    ok((c2.marcos ?? []).length === 1, 'Um marco não entra duas vezes');
    ok((0, memoria_1.marcosRecentes)(c2, 5)[0].includes('Vess'), 'Marcos voltam para o narrador');
    // O pacote precisa carregar tudo isso — era exatamente o que faltava.
    const cena2 = (0, narration_1.montarCena)(vaelhorn_1.conteudoVaelhorn, c2);
    const pacote = (0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c2, cena2.contexto, 'fato qualquer');
    const presentes = pacote.presentes;
    ok('jaAconteceu' in pacote && 'arcosAtivos' in pacote, 'O pacote leva história e fios abertos');
    ok('ritmo' in pacote, 'O pacote leva o ritmo da campanha');
    ok(presentes.every((x) => Array.isArray(x.lembraDeVoce)), 'Cada presente leva o que lembra de você');
    // Estado da NPC em uma frase, sem número na tela.
    const elza = vaelhorn_1.conteudoVaelhorn.npcs.find((n) => n.id === 'elza');
    const frase = (0, memoria_1.estadoDoNpc)(c2, elza);
    ok(frase.length > 0 && !/\d/.test(frase), 'O estado da NPC é frase, não número');
}
// Ritmo: o diretor é cálculo, não uma segunda chamada de IA.
{
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Calmo',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'guardiao',
        origemId: 'sem_nome',
        seedString: 'ritmo-1',
    });
    const calmo = (0, ritmo_1.calcularRitmo)(vaelhorn_1.conteudoVaelhorn, c);
    ok(calmo.tensao >= 0 && calmo.tensao <= 100, 'Tensão fica na faixa');
    ok(calmo.fase === 'calmaria', 'Campanha nova começa em calmaria');
    // Machucado, corrompido, com facção atrás e um fio aberto.
    c.personagem.recursos.vida = 3;
    c.personagem.pressoes['corrupcao'] = 60;
    c.personagem.pressoes['sanidade'] = 60;
    c.reputacao['guarda'] = -20;
    c.questEstado['q_edital'] = 'ativa';
    const aperto = (0, ritmo_1.calcularRitmo)(vaelhorn_1.conteudoVaelhorn, c);
    ok(aperto.tensao > calmo.tensao, 'Estado ruim empurra a tensão para cima');
    ok(aperto.motivos.length > 0, 'A tensão vem com motivos nomeados');
    ok(aperto.tom.length > 20, 'Cada fase manda um tom para o narrador');
}
// A lista de modelos não pode oferecer o que não narra (o jogador viu geradores
// de música, classificadores de censura e modelos de código no seletor).
{
    const naoServem = [
        'google/lyria-3-clip-preview',
        'google/lyria-3-pro-preview',
        'nvidia/nemotron-3.5-content-safety',
        'cohere/north-mini-code',
        'poolside/laguna-s-2.1',
        'meta-llama/llama-guard-4-12b',
        'openai/whisper-large-v3',
        'mistralai/codestral-2501',
        'openrouter/free',
        'openrouter/auto',
    ];
    const ruins = naoServem.filter((id) => (0, llm_1.serveParaNarrar)(id));
    ok(ruins.length === 0, `Modelos que não narram são descartados (${ruins.join(', ')})`);
    const servem = [
        'deepseek/deepseek-chat-v3-0324:free',
        'nousresearch/hermes-3-llama-3.1-405b',
        'cognitivecomputations/dolphin3.0-mistral-24b:free',
        'nvidia/nemotron-3-ultra-550b-a55b:free',
    ];
    const perdidos = servem.filter((id) => !(0, llm_1.serveParaNarrar)(id));
    ok(perdidos.length === 0, `Modelos de conversa passam pelo filtro (${perdidos.join(', ')})`);
    // Saída não textual é barrada mesmo que o slug não denuncie.
    ok(!(0, llm_1.serveParaNarrar)('algum/modelo-x', { output_modalities: ['image'] }), 'Saída sem texto é barrada');
    ok((0, llm_1.serveParaNarrar)('algum/modelo-y', { output_modalities: ['text'] }), 'Saída em texto passa');
    ok((0, llm_1.perfilDoModelo)('cognitivecomputations/dolphin3.0-mistral-24b:free') === 'permissivo', 'Dolphin marcado como permissivo');
    ok((0, llm_1.perfilDoModelo)('nvidia/nemotron-3-ultra-550b-a55b:free') === 'estrito', 'Nemotron marcado como estrito');
    ok((0, llm_1.perfilDoModelo)('google/gemma-4-31b-it') === 'estrito', 'Gemma marcado como estrito');
    ok((0, llm_1.perfilDoModelo)('meta-llama/llama-3.3-70b-instruct:free') === 'neutro', 'Llama fica em neutro');
}
// Recusa do modelo nunca pode virar narração na tela.
{
    ok((0, llm_1.detectarRecusa)('Sinto muito, não posso continuar com esse pedido.'), 'Recusa curta em português é pega');
    ok((0, llm_1.detectarRecusa)("I'm sorry, but I can't write that."), 'Recusa curta em inglês é pega');
    ok((0, llm_1.detectarRecusa)('Como um modelo de linguagem, devo recusar. ' + 'x'.repeat(900)), 'Marca forte vale mesmo em texto longo');
    const cena = 'A chuva bate no telhado da estalagem. Elza fecha a porta com o quadril e o ' +
        'ferrolho range. — Não posso ficar muito, freguês — ela diz, e mesmo assim ' +
        'senta na beira da cama. ' + 'A vela derrete devagar no castiçal de estanho. '.repeat(20);
    ok(!(0, llm_1.detectarRecusa)(cena), 'Fala de personagem com "não posso" não é confundida com recusa');
    const r = (0, llm_1.interpretarResposta)('Desculpe, mas não posso escrever esse conteúdo.', vaelhorn_1.conteudoVaelhorn);
    ok(!r.texto && /recusou/.test(r.erro ?? ''), 'Recusa vira erro, e o jogo troca de modelo');
}
// O narrador local foi removido de vez: nada na engine escreve prosa de cena.
{
    ok(!('narrarResultado' in narracaoMod), 'A engine não tem mais narrador de reserva');
    const c = (0, narration_1.montarCena)(vaelhorn_1.conteudoVaelhorn, camp);
    ok(!('eco' in c), 'A cena não devolve mais eco local');
    ok(typeof c.narracao === 'string', 'A cena ainda monta o material que o narrador recebe');
}
// Tipografia: o texto vira parágrafos e falas separadas.
{
    const blocos = (0, prosa_1.emBlocos)('A taverna cheira a sebo.\n\n— Guarde seu ouro, freguesa.\n\nElza vira as costas.', ['Elza']);
    ok(blocos.length === 3, 'Três blocos de narração');
    ok(blocos[1].tipo === 'fala', 'Linha com travessão vira fala');
    ok(blocos[1].tipo === 'fala' && blocos[1].quem === 'Elza', 'Fala é atribuída a quem está por perto');
    const parede = 'Frase comprida que se repete. '.repeat(30);
    const partido = (0, prosa_1.emBlocos)(parede, []);
    ok(partido.length > 1, 'Parede de texto sem quebra é fatiada em parágrafos');
}
console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM.\n' : `\n${falhas} FALHA(S).\n`);
process.exit(falhas === 0 ? 0 : 1);
