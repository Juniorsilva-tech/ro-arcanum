"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presencaOniCasual = presencaOniCasual;
exports.rolarEncontroContextual = rolarEncontroContextual;
exports.perigoEfetivoDaRota = perigoEfetivoDaRota;
exports.localConhecido = localConhecido;
exports.rotasVisiveis = rotasVisiveis;
exports.avaliarDescobertas = avaliarDescobertas;
exports.descobrirLocal = descobrirLocal;
exports.encontrosDoLugar = encontrosDoLugar;
exports.rolarEncontroDeViagem = rolarEncontroDeViagem;
exports.viajar = viajar;
const rng_1 = require("./rng");
const time_1 = require("./time");
const impulsos_1 = require("./impulsos");
const mundo_1 = require("./mundo");
const classe_1 = require("./classe");
const memoria_1 = require("./memoria");
const historiaViva_1 = require("./historiaViva");
const kimetsu_1 = require("./kimetsu");
const nemesis_1 = require("./nemesis");
const combat_1 = require("./combat");
const contextoNarrativo_1 = require("./contextoNarrativo");
const PERIODOS_DE_RISCO = new Set(['anoitecer', 'noite', 'madrugada']);
// Só regula o acaso. Caçadas escolhidas e perseguições já causadas continuam reais.
function presencaOniCasual(camp) {
    const investigando = camp.vivo?.missoes.some(q => q.tipo === 'investigar' && q.estado === 'aceita' && q.local === camp.localAtual);
    if (investigando)
        return .65;
    const crise = camp.continuidade?.ameacas.some(a => a.local === camp.localAtual && a.estado === 'ativa');
    if (crise)
        return .45;
    const ultimo = camp.flags['narrativa.ultimoOniCasual'];
    if (typeof ultimo === 'number' && camp.calendario.dia < ultimo + 3)
        return 0;
    return .08;
}
function rolarEncontroContextual(content, camp, periodo, perigo, pool) {
    const elegiveis = (0, kimetsu_1.encontrosElegiveis)(content, camp, pool);
    const comuns = elegiveis.filter(id => !content.criaturas.find(c => c.id === id)?.oni);
    const temOni = comuns.length !== elegiveis.length;
    const chance = temOni ? presencaOniCasual(camp) : 0;
    const permitir = temOni && chance > 0 && (0, rng_1.nextFloat)(camp.rng) < chance;
    const encontro = rolarEncontroDeViagem(camp, periodo, perigo, permitir ? elegiveis : comuns);
    if (encontro?.some(id => content.criaturas.find(c => c.id === id)?.oni)) {
        camp.flags['narrativa.ultimoOniCasual'] = camp.calendario.dia;
    }
    return encontro;
}
/**
 * Perigo efetivo de uma rota — o número que o sorteio de encontro deveria ter
 * usado desde sempre.
 *
 * `rota.perigo` é constante escrita à mão no conteúdo: idêntica no dia 1 e no
 * dia 3000, com o vale em paz ou em guerra. Enquanto isso a engine já mantinha
 * `cidade.inseguranca` (sobe com ameaça ativa, com guerra e com missão vencida;
 * desce com muralha), e nove módulos liam esse número. A viagem não era um
 * deles — o mapa de risco estava congelado sobre um mundo que muda.
 *
 * Agora a base de conteúdo é o piso, e o estado real das duas pontas move o
 * resto: uma estrada entre duas vilas em paz continua tranquila; a mesma
 * estrada com a vila do outro lado tomada fica perigosa sozinha, sem que
 * ninguém reescreva o conteúdo.
 */
function perigoEfetivoDaRota(content, camp, origem, destino, perigoBase) {
    let perigo = perigoBase;
    for (const ponta of [origem, destino]) {
        const cidadeId = (0, historiaViva_1.cidadeIdDoLocal)(content, camp, ponta);
        const cidade = cidadeId ? camp.vivo?.cidades[cidadeId] : undefined;
        // Insegurança de 0 a 100 vira até +3 de perigo por ponta.
        if (cidade)
            perigo += (cidade.inseguranca / 100) * 3;
        // Ameaça anunciada e ainda não resolvida pesa mais do que estatística.
        const ameaca = camp.continuidade?.ameacas.some(a => a.local === ponta && a.estado === 'ativa');
        if (ameaca)
            perigo += 2;
        // Quem caça naquele local devolve segurança: é o laço que faltava fechar.
        const guardiao = [...content.npcs, ...(camp.npcsProcedurais ?? [])].some(n => n.combatente && camp.npcState[n.id]?.vivo && camp.vivo?.pessoas[n.id]?.objetivo === 'cacar'
            && camp.vivo.pessoas[n.id].local === ponta);
        if (guardiao)
            perigo -= 1.5;
    }
    // Rival acampado em qualquer das pontas: ele escolheu aquele refúgio de
    // propósito (ver engine/nemesis.ts) e sai à noite.
    for (const r of Object.values(camp.kimetsu?.rivais ?? {})) {
        if (!r.vivo)
            continue;
        if (r.local === origem || r.local === destino || r.evolucao?.refugio === destino) {
            perigo += 1 + (r.evolucao?.servos ?? 0) * 0.4;
            break;
        }
    }
    // Batedor conhece os atalhos (engine/classe.ts).
    return Math.max(0, perigo - (0, classe_1.alivioDeRota)(camp));
}
/** O lugar já foi descoberto por esta campanha? */
function localConhecido(camp, local) {
    if (!local.oculto)
        return true;
    return camp.flags[local.oculto.flag] === true || camp.locaisVisitados.includes(local.id);
}
/**
 * Rotas que o jogador pode ver e usar daqui. Lugar oculto não aparece na lista
 * até ser descoberto — é o que separa "secreto na ficção" de "secreto de
 * verdade". Quem chama isto: a tela do mapa, o pacote do narrador e o
 * planejador do simulador.
 */
function rotasVisiveis(content, camp, localId = camp.localAtual) {
    const local = content.locais.find(l => l.id === localId);
    if (!local)
        return [];
    return local.rotas.filter(r => {
        const destino = content.locais.find(l => l.id === r.destino);
        return !destino || localConhecido(camp, destino);
    });
}
/**
 * Confere as condições declaradas de cada lugar oculto e revela os que já
 * foram satisfeitos. Roda no tique diário do mundo — a descoberta chega como
 * notícia, não como recompensa de menu.
 */
function avaliarDescobertas(content, camp) {
    const revelados = [];
    for (const l of content.locais) {
        const o = l.oculto;
        if (!o || camp.flags[o.flag] === true)
            continue;
        const porReputacao = o.exigeReputacao
            && (camp.reputacao[o.exigeReputacao.faccaoId] ?? 0) >= o.exigeReputacao.minimo;
        const porVisita = o.exigeVisita && camp.locaisVisitados.includes(o.exigeVisita);
        if (!porReputacao && !porVisita)
            continue;
        if (descobrirLocal(content, camp, l.id))
            revelados.push(l.id);
    }
    return revelados;
}
/** Marca um lugar oculto como descoberto e registra o momento. */
function descobrirLocal(content, camp, localId) {
    const local = content.locais.find(l => l.id === localId);
    if (!local?.oculto || camp.flags[local.oculto.flag] === true)
        return false;
    camp.flags[local.oculto.flag] = true;
    (0, memoria_1.registrarMarco)(camp, `você descobriu onde fica ${local.nome}`);
    return true;
}
/**
 * O elenco possível de um lugar: o que o TIPO dele sorteia, mais o que é
 * característico da REGIÃO onde ele fica.
 *
 * Até a sessão 21 só o tipo contava. O perigo de cada região já variava como
 * número — Vale 3,7, Bosque de Vintra 6,0, Ermo de Solgar 5,5 — mas uma
 * floresta em Vintra e uma floresta em Tessel cuspiam exatamente a mesma
 * lista. A região tinha intensidade e não tinha rosto.
 *
 * As duas listas somam em vez de filtrar, de propósito: filtrar poderia
 * esvaziar a tabela de um lugar, e `selftest.ts` cobra que todo tipo sorteável
 * tenha encontro. Exclusividade de verdade é decisão da criatura, via
 * `regiaoExclusiva` — e essa sim filtra, porque é o autor dizendo onde aquilo
 * pode existir.
 */
function encontrosDoLugar(content, local) {
    if (!local)
        return [];
    const doTipo = content.encontrosPorTipo?.[local.tipo] ?? [];
    const daRegiao = local.regiao ? content.encontrosPorRegiao?.[local.regiao] ?? [] : [];
    const juntos = [...new Set([...doTipo, ...daRegiao])];
    return juntos.filter(id => {
        const exclusiva = content.criaturas.find(c => c.id === id)?.regiaoExclusiva;
        return !exclusiva || exclusiva === local.regiao;
    });
}
// Retorna os ids das criaturas do encontro, ou null se a viagem correu em paz.
// `pool` é o elenco possível para o tipo de local de destino (ver
// content/vaelhorn/bestiary.ts, encontrosPorTipo) — a engine não conhece
// bestiário, só resolve o sorteio.
function rolarEncontroDeViagem(camp, periodo, perigoRota, pool) {
    if (pool.length === 0)
        return null;
    const noturno = PERIODOS_DE_RISCO.has(periodo);
    const chance = Math.min(0.5, 0.05 + perigoRota * 0.04 + (noturno ? 0.12 : 0));
    if ((0, rng_1.nextFloat)(camp.rng) >= chance)
        return null;
    const ids = [(0, rng_1.pick)(camp.rng, pool)];
    // Emboscada rara em dupla — chance pequena, independente da chance de
    // encontro em si.
    if ((0, rng_1.nextFloat)(camp.rng) < 0.2)
        ids.push((0, rng_1.pick)(camp.rng, pool));
    return ids;
}
function viajar(content, camp, destino) {
    if (camp.combate && !camp.combate.terminado)
        return { ok: false, motivo: 'termine o combate primeiro' };
    if (camp.personagem.condicoes.includes('cativo'))
        return { ok: false, motivo: 'recupere a liberdade antes de viajar' };
    const local = content.locais.find((l) => l.id === camp.localAtual);
    const rota = local?.rotas.find((r) => r.destino === destino);
    if (!rota)
        return { ok: false, motivo: 'não há rota daqui para lá' };
    const alvoOculto = content.locais.find(l => l.id === destino);
    if (alvoOculto && !localConhecido(camp, alvoOculto)) {
        return { ok: false, motivo: alvoOculto.oculto.dica };
    }
    const origemDaViagem = camp.localAtual;
    (0, contextoNarrativo_1.registrarSaidaNarrativa)(camp);
    if (rota.periodos > 0) {
        camp.calendario = (0, time_1.avancarPeriodos)(camp.calendario, rota.periodos);
        (0, impulsos_1.crescerImpulsos)(camp, rota.periodos);
        camp.capitulo.periodosDecorridos += rota.periodos;
        (0, mundo_1.avancarMundo)(content, camp);
    }
    camp.localAtual = destino;
    const alvo = content.locais.find((l) => l.id === destino);
    const primeiraVez = !camp.locaisVisitados.includes(destino);
    if (primeiraVez) {
        camp.locaisVisitados.push(destino);
        (0, memoria_1.registrarMarco)(camp, `você pisou em ${alvo?.nome ?? destino} pela primeira vez`);
    }
    camp.flags[`visitou.${destino}`] = true;
    (0, historiaViva_1.descobrirNoticias)(content, camp);
    const pool = (0, kimetsu_1.encontrosElegiveis)(content, camp, encontrosDoLugar(content, alvo));
    const encontro = (0, nemesis_1.emboscadaNemesis)(content, camp) ??
        rolarEncontroContextual(content, camp, (0, time_1.periodoAtual)(camp.calendario), perigoEfetivoDaRota(content, camp, origemDaViagem, destino, rota.perigo), pool);
    if (encontro)
        (0, combat_1.iniciarCombate)(content, camp, encontro);
    return { ok: true, destino: alvo, primeiraVez, encontro: encontro ?? undefined };
}
