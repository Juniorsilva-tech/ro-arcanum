"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.povoarContinente = povoarContinente;
const rng_1 = require("../../engine/rng");
// ── Vocabulário de nomes ──────────────────────────────────────────────────
const PROPRIOS = [
    'Aldric', 'Bela', 'Corin', 'Davet', 'Elna', 'Ferran', 'Gilda', 'Hedra', 'Ivo', 'Jorna',
    'Kalen', 'Lira', 'Maud', 'Nevin', 'Orla', 'Perin', 'Quilda', 'Roan', 'Sela', 'Tavro',
    'Urda', 'Veski', 'Wenna', 'Ysolt', 'Bran', 'Cera', 'Dorn', 'Eda', 'Fenn', 'Greta',
    'Halvo', 'Ilsa', 'Jarek', 'Ketta', 'Loris', 'Mira', 'Nolan', 'Ondra', 'Pell', 'Rhea',
    'Sabra', 'Torv', 'Ulla', 'Vidar', 'Wyn', 'Yara', 'Zeno', 'Ansel', 'Brida', 'Calder',
];
const ALCUNHAS = [
    'da Ponte', 'de Baixo', 'o Torto', 'a Ruiva', 'Mão-Curta', 'Boca-Seca', 'o Manco',
    'da Estrada', 'Meia-Orelha', 'a Velha', 'o Novo', 'Pé-de-Ferro', 'a Calada',
    'Sete-Dedos', 'do Norte', 'o Gordo', 'a Magra', 'Olho-Vivo', 'Bico-Fino', 'o Surdo',
];
const INDOLES = [
    'desconfiada com forasteiro e leal com quem prova o contrário',
    'falastrona, sabe de tudo e conta metade',
    'seca no trato e correta na conta',
    'medrosa por experiência, não por natureza',
    'ambiciosa de um jeito que não disfarça bem',
    'cansada, faz o serviço e não quer confusão',
    'orgulhosa do ofício e intolerante com desleixo',
    'generosa até o limite do próprio prato',
    'ressentida com quem subiu na vida',
    'curiosa demais para a própria segurança',
    'devota de um jeito áspero, sem doçura',
    'calculista e educada, o que assusta mais',
];
const VOZES = [
    'fala baixo e obriga o outro a chegar perto',
    'fala rápido, atropela as próprias frases',
    'usa provérbio para tudo, mesmo quando não cabe',
    'responde com pergunta',
    'trata todo mundo por apelido no primeiro minuto',
    'mede cada palavra como se custasse dinheiro',
    'ri antes de dizer coisa séria',
    'repete a última palavra de quem fala com ela',
];
const CORPOS = [
    'Mãos grossas de quem trabalha com elas todo dia.',
    'Magro de fome antiga; a roupa sobra nos ombros.',
    'Encorpada, ombros largos, postura de quem carrega peso.',
    'Baixo, atarracado, com uma cicatriz clara no queixo.',
    'Alta e curvada de tanto se abaixar em porta baixa.',
    'Rosto queimado de sol e olhos apertados por hábito.',
    'Cabelo grisalho preso às pressas, dedos manchados do ofício.',
    'Jovem demais para o cargo, e ciente disso.',
];
const RITMO_DIURNO = ['casa', 'casa', 'casa', 'casa', 'casa', 'casa'];
const RITMO_LAVOURA = ['casa', 'campo', 'campo', 'campo', 'casa', 'casa'];
const RITMO_TAVERNA = ['casa', 'casa', 'casa', 'casa', 'casa', 'casa'];
const RITMO_RONDA = ['casa', 'casa', 'campo', 'campo', 'casa', 'casa'];
const RITMO_NOTURNO = ['retiro', 'retiro', 'retiro', 'casa', 'casa', 'casa'];
const RITMO_ERRANTE = ['casa', 'campo', 'campo', 'casa', 'retiro', 'retiro'];
const PAPEIS_CIDADE = [
    { ocupacao: 'senhora da cidade', faccao: 'senhorio', segredo: 0.8, ritmo: RITMO_DIURNO },
    { ocupacao: 'capitã da guarda', faccao: 'guarda', segredo: 0.5, combatente: true, ritmo: RITMO_RONDA },
    { ocupacao: 'mestra de guilda', faccao: 'vila', segredo: 0.7, ritmo: RITMO_DIURNO },
    { ocupacao: 'lojista de secos e molhados', faccao: 'vila', ritmo: RITMO_DIURNO },
    { ocupacao: 'armeira', faccao: 'vila', ritmo: RITMO_DIURNO },
    { ocupacao: 'curandeira', faccao: 'vila', segredo: 0.4, ritmo: RITMO_RONDA },
    { ocupacao: 'taverneira', faccao: 'vila', segredo: 0.6, ritmo: RITMO_TAVERNA },
    { ocupacao: 'escrivã do registro', faccao: 'senhorio', segredo: 0.5, ritmo: RITMO_DIURNO },
    { ocupacao: 'campeã de arena', faccao: 'guarda', combatente: true, ritmo: RITMO_RONDA },
    { ocupacao: 'chefe do crime local', faccao: 'ladroes', segredo: 0.9, combatente: true, ritmo: RITMO_NOTURNO },
    { ocupacao: 'batedora de carteira', faccao: 'ladroes', ritmo: RITMO_NOTURNO },
    { ocupacao: 'agiota', faccao: 'ladroes', segredo: 0.6, ritmo: RITMO_NOTURNO },
    { ocupacao: 'carregadora do cais', faccao: 'vila', ritmo: RITMO_LAVOURA },
    { ocupacao: 'mendiga que vê tudo', faccao: 'foragidos', segredo: 0.7, ritmo: RITMO_DIURNO },
    { ocupacao: 'estalajadeira do bairro de fora', faccao: 'vila', segredo: 0.4, ritmo: RITMO_TAVERNA },
    { ocupacao: 'boticária de fundos', faccao: 'vila', segredo: 0.7, ritmo: RITMO_NOTURNO },
    { ocupacao: 'cocheira de aluguel', faccao: 'vila', ritmo: RITMO_ERRANTE },
    { ocupacao: 'pregoeira do registro', faccao: 'senhorio', ritmo: RITMO_DIURNO },
    { ocupacao: 'veterana de guerra sem posto', faccao: 'foragidos', segredo: 0.6, combatente: true, ritmo: RITMO_RONDA },
    { ocupacao: 'contrabandista de fronteira', faccao: 'ladroes', segredo: 0.8, ritmo: RITMO_NOTURNO },
];
const PAPEIS_VILA = [
    { ocupacao: 'chefe da vila', faccao: 'vila', segredo: 0.6, ritmo: RITMO_DIURNO },
    { ocupacao: 'ferreira', faccao: 'vila', ritmo: RITMO_DIURNO },
    { ocupacao: 'taverneira', faccao: 'vila', segredo: 0.5, ritmo: RITMO_TAVERNA },
    { ocupacao: 'curandeira', faccao: 'vila', segredo: 0.3, ritmo: RITMO_RONDA },
    { ocupacao: 'guarda da vila', faccao: 'guarda', combatente: true, ritmo: RITMO_RONDA },
    { ocupacao: 'ladra conhecida de todos', faccao: 'ladroes', segredo: 0.7, ritmo: RITMO_NOTURNO },
    { ocupacao: 'tropeira', faccao: 'vila', ritmo: RITMO_ERRANTE },
    { ocupacao: 'moleira do povoado', faccao: 'vila', ritmo: RITMO_LAVOURA },
    { ocupacao: 'caçadora de peles', faccao: 'vila', combatente: true, ritmo: RITMO_ERRANTE },
];
const PAPEIS_ALDEIA = [
    { ocupacao: 'anciã da aldeia', faccao: 'vila', segredo: 0.5, ritmo: RITMO_DIURNO },
    { ocupacao: 'lavradora de mão pesada', faccao: 'vila', ritmo: RITMO_LAVOURA },
    { ocupacao: 'benzedeira', faccao: 'vila', segredo: 0.4, ritmo: RITMO_RONDA },
    { ocupacao: 'moça que some por dias', faccao: 'foragidos', segredo: 0.6, ritmo: RITMO_NOTURNO },
    { ocupacao: 'pastora que dorme fora', faccao: 'vila', ritmo: RITMO_LAVOURA },
];
const PAPEIS_PARADA = [
    { ocupacao: 'dona da parada', faccao: 'vila', segredo: 0.7, ritmo: RITMO_TAVERNA },
    { ocupacao: 'chefe de caravana', faccao: 'vila', segredo: 0.5, ritmo: RITMO_ERRANTE },
    { ocupacao: 'escolta de comboio', faccao: 'guarda', combatente: true, ritmo: RITMO_ERRANTE },
    { ocupacao: 'viajante de passagem que não diz de onde vem', faccao: 'foragidos', segredo: 0.8, ritmo: RITMO_NOTURNO },
];
// Forja escondida nao e' povoado: e' oficina. Duas pessoas, e ja e' muita.
const PAPEIS_FORJA = [
    { ocupacao: 'ferreira mestra', faccao: 'cacadores', segredo: 0.8, ritmo: RITMO_DIURNO },
    { ocupacao: 'aprendiz de forja', faccao: 'cacadores', segredo: 0.3, ritmo: RITMO_DIURNO },
];
const PAPEIS_POSTO = [
    { ocupacao: 'comandante do posto', faccao: 'guarda', segredo: 0.6, combatente: true, ritmo: RITMO_DIURNO },
    { ocupacao: 'sargenta veterana', faccao: 'guarda', combatente: true, ritmo: RITMO_RONDA },
    { ocupacao: 'cozinheira da guarnição', faccao: 'guarda', segredo: 0.4, ritmo: RITMO_DIURNO },
    { ocupacao: 'recruta que não devia estar aqui', faccao: 'guarda', ritmo: RITMO_RONDA },
];
/** Quantas pessoas com nome cada porte comporta, e com que elenco. */
function elencoDoLugar(tipo) {
    switch (tipo) {
        case 'cidade': return { papeis: PAPEIS_CIDADE, quantos: 20 };
        case 'porto':
        case 'mercado': return { papeis: PAPEIS_CIDADE, quantos: 10 };
        case 'vila': return { papeis: PAPEIS_VILA, quantos: 9 };
        case 'forte': return { papeis: PAPEIS_POSTO, quantos: 4 };
        case 'acampamento': return { papeis: PAPEIS_PARADA, quantos: 4 };
        case 'forja': return { papeis: PAPEIS_FORJA, quantos: 2 };
        case 'aldeia': return { papeis: PAPEIS_ALDEIA, quantos: 5 };
        default: return { papeis: [], quantos: 0 };
    }
}
// ── Segredos costurados na história do lugar ──────────────────────────────
//
// O segredo não é genérico: ele se apoia no que o lugar já carrega em
// `Local.historia`. Assim, descobrir uma pessoa é descobrir o lugar.
function segredoDoLugar(rng, local, papel) {
    const base = local.historia?.length ? (0, rng_1.pick)(rng, local.historia) : undefined;
    if (!base)
        return undefined;
    const conteudo = (0, rng_1.pick)(rng, [
        `Sabe a parte que não se conta sobre isto: ${base.toLowerCase()}`,
        `Esteve envolvida no que ficou registrado assim: ${base.toLowerCase()}`,
        `Guarda prova do que aconteceu — ${base.toLowerCase()}`,
        `Mentiu no depoimento da época. ${base}`,
    ]);
    const comoDescobrir = (0, rng_1.pick)(rng, [
        'beber com ela até tarde, sem pressa',
        'mostrar que você já sabe metade',
        'fazer um favor que ela não pediu',
        'pegá-la sozinha, longe de quem a conhece',
        'pagar o que ela deve a outra pessoa',
    ]);
    void papel;
    return { conteudo, comoDescobrir };
}
// ── Traduzir ritmo em lugares de verdade ──────────────────────────────────
//
// 'campo' e 'retiro' viram vizinhos REAIS do assentamento, escolhidos pelo
// tipo do lugar. Nunca um lugar oculto: mandar uma taverneira dormir na forja
// secreta entregaria de graça o que a sessão 14 acabou de esconder.
const TIPOS_ABERTOS = new Set(['campo', 'estrada', 'floresta', 'lago', 'praca', 'mercado', 'colina', 'porto']);
const TIPOS_RECOLHIDOS = new Set(['ruina', 'cripta', 'cemiterio', 'pantano', 'mina', 'floresta', 'passo', 'torre']);
function vizinhancaDe(local, porId) {
    const vizinhos = local.rotas
        .map(r => porId.get(r.destino))
        .filter((l) => !!l && !l.oculto);
    const aberto = vizinhos.find(l => TIPOS_ABERTOS.has(l.tipo));
    const recolhido = vizinhos.find(l => TIPOS_RECOLHIDOS.has(l.tipo));
    return {
        campo: aberto?.id ?? vizinhos[0]?.id ?? local.id,
        retiro: recolhido?.id ?? vizinhos[vizinhos.length - 1]?.id ?? local.id,
    };
}
const PERIODOS_DIA = ['madrugada', 'manha', 'tarde', 'entardecer', 'anoitecer', 'noite'];
const FEITIOS = [
    { nome: 'madrugadora', desvio: { 0: 'campo' } },
    { nome: 'que dorme tarde', desvio: { 5: 'campo' } },
    { nome: 'caseira', desvio: { 1: 'casa', 4: 'casa' } },
    { nome: 'que some à tarde', desvio: { 2: 'retiro' } },
    { nome: 'de anoitecer no mato', desvio: { 4: 'retiro' } },
    { nome: 'inquieta', desvio: { 1: 'campo', 5: 'campo' } },
    { nome: 'que reza sozinha', desvio: { 0: 'retiro' } },
    { nome: 'sem feitio', desvio: {} },
];
function rotinaDe(ritmo, local, viz, feitio = FEITIOS[FEITIOS.length - 1]) {
    const usado = ritmo ?? RITMO_DIURNO;
    const rotina = {};
    usado.forEach((ponto, i) => {
        const efetivo = feitio.desvio[i] ?? ponto;
        rotina[PERIODOS_DIA[i]] =
            efetivo === 'casa' ? local.id : efetivo === 'campo' ? viz.campo : viz.retiro;
    });
    return rotina;
}
function expedienteDe(rotina, localBase, ocupacao) {
    const periodos = PERIODOS_DIA.filter((p) => rotina[p] !== undefined && rotina[p] !== localBase);
    const noturno = /crime|ladra|agiota|contrabandista|boticária|viajante/.test(ocupacao);
    return {
        diasTrabalho: noturno ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5],
        periodos: periodos.length ? periodos : ['manha', 'tarde'],
    };
}
function nomeUnico(rng, usados) {
    for (let i = 0; i < 40; i++) {
        const n = (0, rng_1.nextFloat)(rng) < 0.45
            ? `${(0, rng_1.pick)(rng, PROPRIOS)} ${(0, rng_1.pick)(rng, ALCUNHAS)}`
            : (0, rng_1.pick)(rng, PROPRIOS);
        if (!usados.has(n)) {
            usados.add(n);
            return n;
        }
    }
    const fallback = `${(0, rng_1.pick)(rng, PROPRIOS)} ${usados.size}`;
    usados.add(fallback);
    return fallback;
}
/**
 * Gera o elenco de um lugar. Determinístico pelo id: Tessel tem sempre a mesma
 * gente, em toda campanha, como se tivesse sido escrita à mão.
 */
function povoar(local, faccoesValidas, usados, porId) {
    const { papeis, quantos } = elencoDoLugar(local.tipo);
    if (!papeis.length)
        return [];
    const rng = (0, rng_1.createRng)((0, rng_1.seedFromString)(`povoamento:${local.id}`));
    const viz = vizinhancaDe(local, porId);
    const saida = [];
    for (let i = 0; i < Math.min(quantos, papeis.length); i++) {
        const papel = papeis[i];
        const faccao = faccoesValidas.has(papel.faccao) ? papel.faccao : 'vila';
        const nome = nomeUnico(rng, usados);
        const temSegredo = papel.segredo !== undefined && (0, rng_1.nextFloat)(rng) < papel.segredo;
        // Sorteado do mesmo RNG determinístico do lugar: Tessel tem sempre a mesma
        // gente com os mesmos hábitos, mas a taverneira de Tessel e a de Corveira
        // deixam de viver o mesmo dia.
        const feitio = (0, rng_1.pick)(rng, FEITIOS);
        const rotina = rotinaDe(papel.ritmo, local, viz, feitio);
        const npc = {
            id: `morador_${local.id}_${i}`,
            nome,
            idade: (0, rng_1.nextInt)(rng, 19, 64),
            ocupacao: papel.ocupacao,
            faccaoId: faccao,
            localBase: local.id,
            rotina,
            expediente: expedienteDe(rotina, local.id, papel.ocupacao),
            vozNarrativa: (0, rng_1.pick)(rng, VOZES),
            personalidade: (0, rng_1.pick)(rng, INDOLES),
            corpo: (0, rng_1.pick)(rng, CORPOS),
            segredo: temSegredo ? segredoDoLugar(rng, local, papel) : undefined,
            relacoes: [],
        };
        if (papel.combatente) {
            const grau = local.tipo === 'cidade' ? 3 : local.tipo === 'forte' ? 2 : 1;
            npc.combatente = {
                vida: 30 + grau * 12,
                defesa: 12 + grau,
                acerto: 11 + grau,
                dano: { base: 6 + grau * 2, dispersao: 0.3, tipo: 'cortante' },
                tecnicas: [],
            };
        }
        saida.push(npc);
    }
    // Gente de um lugar se conhece. Duas ligações por pessoa bastam para o
    // convívio produzir acontecimento sem o jogador (ver engine/convivio.ts).
    for (const npc of saida) {
        const outros = saida.filter(o => o.id !== npc.id);
        if (!outros.length)
            continue;
        const quantas = Math.min(2, outros.length);
        const escolhidos = new Set();
        for (let i = 0; i < quantas; i++) {
            const o = (0, rng_1.pick)(rng, outros);
            if (escolhidos.has(o.id))
                continue;
            escolhidos.add(o.id);
            npc.relacoes.push({
                npc: o.id,
                tipo: (0, rng_1.pick)(rng, ['aliada', 'rival', 'protege', 'devedora', 'desconfia']),
                nota: (0, rng_1.pick)(rng, [
                    'moram na mesma rua há anos',
                    'brigaram por causa de dinheiro e nunca resolveram',
                    'trabalharam juntos antes de cada um seguir seu rumo',
                    'devem um favor um ao outro e ninguém cobra',
                    'a família de um serviu a família do outro',
                ]),
            });
        }
    }
    return saida;
}
/**
 * Povoa todos os assentamentos do mapa. Chamada uma vez na montagem do bundle.
 */
function povoarContinente(locais, faccoes) {
    const validas = new Set(faccoes.map(f => f.id));
    const usados = new Set();
    const porId = new Map(locais.map(l => [l.id, l]));
    const saida = [];
    for (const l of locais)
        saida.push(...povoar(l, validas, usados, porId));
    return saida;
}
