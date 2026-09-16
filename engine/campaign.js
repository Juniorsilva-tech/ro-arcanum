"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAPITULO_MAX_PERIODOS = exports.CAPITULO_MIN_PERIODOS = void 0;
exports.criarCampanha = criarCampanha;
exports.deveFecharCapitulo = deveFecharCapitulo;
const rng_1 = require("./rng");
const character_1 = require("./character");
const impulsos_1 = require("./impulsos");
const mundo_1 = require("./mundo");
const kimetsu_1 = require("./kimetsu");
const continuidade_1 = require("./continuidade");
const familia_1 = require("./familia");
const progressaoNpc_1 = require("./progressaoNpc");
const progresso_1 = require("./progresso");
const historiaViva_1 = require("./historiaViva");
const aptidao_1 = require("./aptidao");
const genese_1 = require("./genese");
function livroInicial(content) {
    const mk = (arr) => Object.fromEntries(arr.map((x) => [x.id, 'desconhecida']));
    return {
        mestres: mk(content.mestres),
        trabalhos: mk(content.trabalhos),
        artes: mk(content.artes),
        reliquias: mk(content.reliquias),
    };
}
function criarCampanha(content, entrada) {
    const classe = content.classes.find((c) => c.id === entrada.classeId);
    const origem = content.origens.find((o) => o.id === entrada.origemId);
    const seedStr = entrada.seedString ?? `${entrada.nome}:${Date.now()}`;
    const rng = (0, rng_1.createRng)((0, rng_1.seedFromString)(seedStr));
    // Gênese primeiro: os pais e a infância existem antes do personagem
    // jogável, e empurram (sem apagar) os atributos que o jogador escolheu.
    // Marca e reação vêm da escolha do jogador na criação; pais/irmãos e a
    // herança em si continuam sorteados.
    const genese = (0, genese_1.montarGenese)(rng, entrada.marcaInfancia ?? 'comum', entrada.reacaoInfancia ?? 'entendimento');
    const atributosHerdados = (0, genese_1.aplicarHeranca)(rng, entrada.atributos, genese);
    const cartaInicial = (0, genese_1.cartaDeInfancia)(genese);
    const personagem = (0, character_1.criarPersonagem)(entrada.nome, atributosHerdados, classe, origem, content.cenario);
    const npcState = {};
    for (const npc of content.npcs) {
        const eixos = {};
        for (const e of content.cenario.eixosRelacao)
            eixos[e.id] = 0;
        npcState[npc.id] = { eixos, vivo: true, tensao: 0, memoria: [] };
    }
    const reputacao = {};
    for (const f of content.faccoes)
        reputacao[f.id] = 0;
    const flags = { ...(origem.flagsIniciais ?? {}) };
    flags['versao.idades_kimetsu'] = 1;
    if (genese.marca === 'tragedia')
        flags['orfao'] = true;
    const questEstado = {};
    for (const q of content.quests)
        questEstado[q.id] = q.dador ? 'desconhecida' : 'ativa';
    const camp = {
        id: `camp_${Date.now().toString(36)}`,
        cenarioId: content.cenario.id,
        criadaEm: Date.now(),
        rng,
        calendario: { dia: 0, periodoIndex: 1, estacao: 'outono' }, // começa de manhã
        capitulo: { numero: 1, titulo: 'Capítulo I', periodosDecorridos: 0 },
        personagem,
        localAtual: content.localInicial,
        npcState,
        impulsos: (0, impulsos_1.impulsosIniciais)(),
        flags,
        reputacao,
        livro: livroInicial(content),
        cronica: [],
        locaisVisitados: [content.localInicial],
        segredosRevelados: [],
        turno: 0,
        combate: null,
        grupo: [],
        questEstado,
        genese,
        memoriasInfancia: [cartaInicial],
    };
    // O vale já começa com um tempo e um estado — nada nasce congelado.
    camp.mundo = (0, mundo_1.mundoInicial)(camp);
    (0, kimetsu_1.inicializarKimetsu)(camp);
    (0, continuidade_1.iniciarContinuidade)(content, camp);
    (0, familia_1.iniciarFamilia)(content, camp);
    (0, historiaViva_1.iniciarMundoVivo)(content, camp);
    // A aptidao nasce com a pessoa e fica oculta ate ser demonstrada.
    camp.aptidao = (0, aptidao_1.iniciarAptidao)(camp);
    (0, progressaoNpc_1.migrarProgressaoNpcs)(content, camp);
    (0, progresso_1.recalcularRecursosMaximos)(camp);
    camp.flags['versao.legados'] = 1;
    return camp;
}
exports.CAPITULO_MIN_PERIODOS = 12;
exports.CAPITULO_MAX_PERIODOS = 18;
// Fim de capítulo (GDD §26): fecha quando passa do teto de períodos.
function deveFecharCapitulo(camp) {
    return camp.capitulo.periodosDecorridos >= exports.CAPITULO_MAX_PERIODOS;
}
