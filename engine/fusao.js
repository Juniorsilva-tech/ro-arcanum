"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIMITE_FUSOES = void 0;
exports.escolasDominadas = escolasDominadas;
exports.podeFundir = podeFundir;
exports.poderDeFusao = poderDeFusao;
exports.fundirEscolas = fundirEscolas;
exports.artePorId = artePorId;
exports.artesConhecidasResolvidas = artesConhecidasResolvidas;
const character_1 = require("./character");
const combat_1 = require("./combat");
const memoria_1 = require("./memoria");
const time_1 = require("./time");
const mundo_1 = require("./mundo");
const impulsos_1 = require("./impulsos");
exports.LIMITE_FUSOES = 3;
const MINIMO_POR_ESCOLA = 2; // quantas artes já conhecidas contam como "domínio"
// Fundir não é escolher de uma lista — é dojo, retiro, meditação sob
// cachoeira (documento original de fusão). Não é o ANO INTEIRO que o
// documento pedia (isso travaria toda a campanha por 365 dias, longe
// demais do resto do jogo), mas custa tempo de verdade: alguns dias
// fechados de treino, do mesmo jeito que qualquer verbo custa períodos.
const CUSTO_PERIODOS_FUSAO = 18; // três dias inteiros
// Quem nasceu gênio (ver engine/genese.ts) funde melhor — o mesmo espírito
// do "Bônus de Inovação de 10%" do documento original, só que aplicado ao
// grau/poder do Vaelhorn em vez de multiplicadores de dano numéricos novos.
const BONUS_GENIO = 1.1;
const ESCOLAS_MARCIAIS = new Set(['Técnica', 'Ofício']);
function pesoDoAtributo(escola, atributos) {
    const base = ESCOLAS_MARCIAIS.has(escola) ? atributos.fisico : atributos.raciocinio;
    return 1 + (0, character_1.modificador)(base) * 0.1;
}
// Todas as escolas onde o personagem já sabe artes suficientes para fundir.
function escolasDominadas(content, camp) {
    const conhecidas = new Set(camp.personagem.artesConhecidas);
    const porEscola = new Map();
    for (const a of content.artes) {
        if (!conhecidas.has(a.id))
            continue;
        porEscola.set(a.escola, (porEscola.get(a.escola) ?? 0) + 1);
    }
    return [...porEscola.entries()].filter(([, n]) => n >= MINIMO_POR_ESCOLA).map(([e]) => e);
}
function podeFundir(content, camp, escolaA, escolaB) {
    if ((camp.personagem.fusoesFeitas ?? 0) >= exports.LIMITE_FUSOES) {
        return { ok: false, motivo: `você já criou ${exports.LIMITE_FUSOES} estilos nesta vida — o limite é esse` };
    }
    if (escolaA === escolaB)
        return { ok: false, motivo: 'precisa de duas escolas diferentes' };
    const dominadas = new Set(escolasDominadas(content, camp));
    if (!dominadas.has(escolaA) || !dominadas.has(escolaB)) {
        return { ok: false, motivo: `domínio insuficiente: precisa de pelo menos ${MINIMO_POR_ESCOLA} artes conhecidas em cada escola` };
    }
    return { ok: true };
}
function slug(s) {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}
function grauMedioDaEscola(content, camp, escola) {
    const conhecidas = new Set(camp.personagem.artesConhecidas);
    const artes = content.artes.filter((a) => a.escola === escola && conhecidas.has(a.id));
    if (artes.length === 0)
        return 2; // não deveria acontecer — podeFundir já garantiu domínio
    return artes.reduce((s, a) => s + (0, combat_1.grauBase)(a.grau), 0) / artes.length;
}
function grauFinal(poder) {
    if (poder < 4)
        return 'comum';
    if (poder < 7)
        return 'notavel';
    return 'rara';
}
// Poder bruto da fusão — extraído à parte pra dar pra testar o bônus de
// gênio (ver BONUS_GENIO) sem depender de arredondamento de grau/custo, que
// nem sempre muda de faixa com um bônus de 10%.
function poderDeFusao(content, camp, escolaA, escolaB) {
    const p = camp.personagem;
    const mediaA = grauMedioDaEscola(content, camp, escolaA);
    const mediaB = grauMedioDaEscola(content, camp, escolaB);
    let poder = (mediaA * pesoDoAtributo(escolaA, p.atributos) + mediaB * pesoDoAtributo(escolaB, p.atributos)) / 2;
    // Quem nasceu gênio funde melhor — ver BONUS_GENIO acima.
    if (camp.genese?.marca === 'genio')
        poder *= BONUS_GENIO;
    return poder;
}
// Cria a arte fundida — não mais na hora: consome dias reais de treino
// fechado (ver CUSTO_PERIODOS_FUSAO) antes de aprendê-la, e consome uma das
// 3 fusões da vida.
function fundirEscolas(content, camp, escolaA, escolaB, nome) {
    const pode = podeFundir(content, camp, escolaA, escolaB);
    if (!pode.ok)
        return pode;
    const p = camp.personagem;
    const poder = poderDeFusao(content, camp, escolaA, escolaB);
    const grau = grauFinal(poder);
    const usaVigor = ESCOLAS_MARCIAIS.has(escolaA) && ESCOLAS_MARCIAIS.has(escolaB);
    const custoValor = Math.max(1, Math.round(2 + poder / 3));
    const nomeFinal = nome.trim() || `${escolaA}-${escolaB}`;
    const arte = {
        id: `fusao_${slug(nomeFinal)}_${camp.turno}`,
        nome: nomeFinal,
        escola: `${escolaA} + ${escolaB}`,
        grau,
        custo: { recurso: usaVigor ? 'vigor' : 'mana', valor: custoValor },
        efeito: `Um estilo só seu, nascido de ${escolaA} e ${escolaB} — ninguém mais o conhece.`,
        origem: 'fusao',
        escolasOrigem: [escolaA, escolaB],
    };
    // O treino fechado consome dias de verdade — o vale não espera, do mesmo
    // jeito que qualquer outro custo em períodos (ver engine/turn.ts).
    camp.calendario = (0, time_1.avancarPeriodos)(camp.calendario, CUSTO_PERIODOS_FUSAO);
    (0, impulsos_1.crescerImpulsos)(camp, CUSTO_PERIODOS_FUSAO);
    (0, mundo_1.avancarMundo)(content, camp);
    (camp.artesCriadas ??= []).push(arte);
    p.artesConhecidas.push(arte.id);
    p.fusoesFeitas = (p.fusoesFeitas ?? 0) + 1;
    (0, memoria_1.registrarMarco)(camp, `você forjou um estilo próprio: ${arte.nome}`);
    return { ok: true, arte };
}
// Junta o catálogo estático com as artes fundidas desta campanha — todo lugar
// que precisa achar uma arte pelo id deve passar por aqui, não só por
// content.artes.find(...), senão uma arte fundida "some" da narração e do
// combate assim que é criada.
function artePorId(content, camp, arteId) {
    return content.artes.find((a) => a.id === arteId) ?? camp.artesCriadas?.find((a) => a.id === arteId);
}
// Todas as artes conhecidas pelo personagem, já resolvidas (estáticas + fundidas).
function artesConhecidasResolvidas(content, camp) {
    return camp.personagem.artesConhecidas
        .map((id) => artePorId(content, camp, id))
        .filter((a) => !!a);
}
