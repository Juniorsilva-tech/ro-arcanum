"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DESCRICAO_CLIMA = void 0;
exports.mundoInicial = mundoInicial;
exports.avancarMundo = avancarMundo;
exports.multiplicadorDePreco = multiplicadorDePreco;
exports.comoEstaOVale = comoEstaOVale;
const rng_1 = require("./rng");
const memoria_1 = require("./memoria");
const convivio_1 = require("./convivio");
const duelo_1 = require("./duelo");
const vidanpc_1 = require("./vidanpc");
const guerra_1 = require("./guerra");
const ascensao_1 = require("./ascensao");
const time_1 = require("./time");
const continuidade_1 = require("./continuidade");
const elenco_1 = require("./elenco");
const progressaoNpc_1 = require("./progressaoNpc");
const mundoVivo_1 = require("./mundoVivo");
const casas_1 = require("./casas");
const CLIMA_POR_ESTACAO = {
    primavera: ['limpo', 'nublado', 'chuva', 'chuva', 'neblina'],
    verao: ['limpo', 'limpo', 'limpo', 'nublado', 'temporal'],
    outono: ['nublado', 'chuva', 'neblina', 'chuva', 'temporal'],
    inverno: ['geada', 'nublado', 'neblina', 'geada', 'temporal'],
};
exports.DESCRICAO_CLIMA = {
    limpo: 'céu aberto',
    nublado: 'céu fechado',
    chuva: 'chuva fina',
    temporal: 'temporal',
    neblina: 'neblina',
    geada: 'geada',
};
// O que pode acontecer no vale sem o jogador mexer um dedo.
const EVENTOS = [
    {
        id: 'feira',
        nome: 'Feira de fim de semana',
        descricao: 'Carroças de fora encheram a praça. Há mais gente, mais fofoca e mais barganha.',
        precos: 0.8,
    },
    {
        id: 'caravana',
        nome: 'Caravana do sal',
        descricao: 'A caravana atracou na estrada. Mercadoria nova, e olhos novos junto.',
        precos: 0.85,
    },
    {
        id: 'escassez',
        nome: 'Falta de pão',
        descricao: 'O moinho parado começou a doer. O que ainda tem farinha cobra caro.',
        precos: 1.5,
    },
    {
        id: 'febre',
        nome: 'Febre na vila',
        descricao: 'Uma febre correu as casas de baixo. Metade do vale tosse, e a capela vive cheia.',
        precos: 1.25,
    },
    {
        id: 'ronda',
        nome: 'A guarda dobrou a ronda',
        descricao: 'Bael pôs gente na rua a noite inteira. Quem tem o que esconder anda por dentro.',
    },
    {
        id: 'luto',
        nome: 'Luto no vale',
        descricao: 'Enterraram alguém que fazia falta. As portas ficam encostadas e as vozes baixas.',
    },
    {
        id: 'lua_cheia',
        nome: 'Lua cheia',
        descricao: 'A noite fica clara demais para quem precisa de escuro, e a mata fica barulhenta.',
    },
];
function mundoInicial(camp) {
    return {
        clima: (0, rng_1.pick)(camp.rng, CLIMA_POR_ESTACAO[camp.calendario.estacao]),
        carestia: 1,
        diaProcessado: camp.calendario.dia,
        proximoEnvelhecimento: camp.calendario.dia + vidanpc_1.DIAS_POR_ANO,
    };
}
// Chamada sempre que o calendário anda. Roda uma vez por DIA virado — esperar
// uma semana faz o mundo mudar sete vezes, não uma.
function avancarMundo(content, camp) {
    const m = camp.mundo ?? (camp.mundo = mundoInicial(camp));
    const hoje = camp.calendario.dia;
    // Guarda contra saves antigos e contra o dia andar para trás.
    const calendarioFinal = { ...camp.calendario };
    try {
        while (m.diaProcessado < hoje) {
            const dia = m.diaProcessado + 1;
            camp.calendario = { ...calendarioFinal, dia, estacao: (0, time_1.estacaoNoDia)(calendarioFinal, dia) };
            // O tempo vira, com peso da estação.
            if ((0, rng_1.nextFloat)(camp.rng) < 0.55) {
                m.clima = (0, rng_1.pick)(camp.rng, CLIMA_POR_ESTACAO[camp.calendario.estacao]);
            }
            // O evento corrente envelhece e sai.
            if (m.evento) {
                m.evento.diasRestantes -= 1;
                if (m.evento.diasRestantes <= 0)
                    m.evento = undefined;
            }
            // E de vez em quando entra um novo.
            if (!m.evento && (0, rng_1.nextFloat)(camp.rng) < 0.22) {
                const base = (0, rng_1.pick)(camp.rng, EVENTOS);
                m.evento = { ...base, diasRestantes: (0, rng_1.nextInt)(camp.rng, 2, 5) };
                (0, memoria_1.registrarMarco)(camp, `no vale: ${base.nome.toLowerCase()}`);
            }
            // Preço anda sozinho e volta devagar ao normal.
            const deriva = ((0, rng_1.nextFloat)(camp.rng) - 0.5) * 0.08;
            m.carestia = Math.max(0.7, Math.min(1.8, m.carestia + deriva + (1 - m.carestia) * 0.15));
            // A vida das pessoas também anda. Quem foi deixado de lado esfria; quem
            // está muito magoado começa a esquecer o que houve de bom.
            for (const [npcId, din] of Object.entries(camp.npcState)) {
                if (!din.vivo)
                    continue;
                if ((camp.grupo ?? []).includes(npcId)) {
                    din.tensao = Math.max(0, din.tensao - 1);
                    continue;
                }
                din.tensao = Math.min(100, din.tensao + 1);
                if (din.tensao > 80 && din.eixos.disposicao !== undefined) {
                    din.eixos.disposicao = Math.max(-20, din.eixos.disposicao - 1);
                }
            }
            // Companheiros carregam os ferimentos entre combates, mas também se
            // recuperam enquanto o mundo anda. A cura é lenta para que sobreviver a
            // uma Lua Superior continue tendo peso por vários dias.
            for (const npc of (0, elenco_1.todosNpcs)(content, camp)) {
                const din = camp.npcState[npc.id];
                if (!npc.combatente || !din?.vivo)
                    continue;
                const ficha = (0, progressaoNpc_1.fichaCombatente)(camp, npc);
                const atual = din.vida ?? ficha.vida;
                din.vida = Math.min(ficha.vida, atual + Math.max(2, Math.ceil(ficha.vida * .08)));
            }
            // E elas se esbarram. Um período por dia basta para o vale ter história
            // própria sem virar novela (ver convivio.ts).
            (0, convivio_1.cruzarRotinas)(content, camp, (0, convivio_1.periodoQualquer)(camp));
            // E, raramente, alguém com um embate de fundo pendente (Hashira contra
            // Lua Superior, por ora) o resolve longe dos seus olhos (ver duelo.ts).
            (0, duelo_1.processarDuelosDeFundo)(content, camp);
            // O jogador envelhece no mesmo aniversário que o resto do vale — checa
            // ANTES de processarVidaDeFundo, que é quem empurra proximoEnvelhecimento
            // pro próximo ano (ver vidanpc.ts).
            if ((m.proximoEnvelhecimento ?? vidanpc_1.DIAS_POR_ANO) <= dia) {
                (0, ascensao_1.processarEnvelhecimentoJogador)(camp);
            }
            // E a vida civil segue: elas envelhecem, e o que sentem umas pelas
            // outras às vezes vira acontecimento de verdade (ver vidanpc.ts).
            (0, vidanpc_1.processarVidaDeFundo)(content, camp);
            // E, raro, uma rivalidade de facções esquenta demais e vira guerra
            // aberta longe do jogador (ver guerra.ts).
            (0, guerra_1.processarGuerrasDeFundo)(content, camp);
            (0, casas_1.processarCasas)(content, camp);
            (0, continuidade_1.processarContinuidade)(content, camp);
            (0, mundoVivo_1.processarMundoVivo)(content, camp);
            m.diaProcessado = dia;
        }
    }
    finally {
        camp.calendario = calendarioFinal;
    }
}
// Preço que a loja deve cobrar hoje.
function multiplicadorDePreco(camp) {
    const m = camp.mundo;
    if (!m)
        return 1;
    const integridade = camp.continuidade?.locais[camp.localAtual]?.integridade ?? 100;
    const cidade = camp.vivo?.cidades[camp.localAtual];
    const escassez = cidade ? 1 + (cidade.fomeDias > 0 ? .6 : 0) + cidade.inseguranca / 250 : 1;
    return m.carestia * (m.evento?.precos ?? 1) * (1 + (100 - integridade) / 200) * escassez;
}
// Como o vale está hoje, em palavras — vai para o narrador e para o HUD.
// `content` é opcional só para não quebrar quem já chamava sem ele; sem ele,
// a guerra de fundo (que precisa do nome das facções) fica de fora.
function comoEstaOVale(camp, content) {
    const m = camp.mundo;
    const mult = multiplicadorDePreco(camp);
    return {
        clima: exports.DESCRICAO_CLIMA[m?.clima ?? 'nublado'],
        estacao: camp.calendario.estacao,
        evento: m?.evento ? `${m.evento.nome}: ${m.evento.descricao}` : undefined,
        carestia: mult >= 1.25 ? 'tudo está caro' : mult <= 0.85 ? 'há pechincha na praça' : undefined,
        guerra: content ? (0, guerra_1.comoEstaAGuerra)(content, camp) : undefined,
    };
}
