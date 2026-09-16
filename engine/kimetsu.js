"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSAO_COMBATE = void 0;
exports.inicializarKimetsu = inicializarKimetsu;
exports.haAbrigoSolar = haAbrigoSolar;
exports.solDireto = solDireto;
exports.encontrosElegiveis = encontrosElegiveis;
exports.obterRival = obterRival;
exports.registrarConfronto = registrarConfronto;
exports.aplicarFerimentoOni = aplicarFerimentoOni;
const time_1 = require("./time");
exports.VERSAO_COMBATE = 2;
function inicializarKimetsu(camp) {
    camp.kimetsu ??= { versao: 1, sequencia: 0, rivais: {} };
}
function haAbrigoSolar(content, localId) {
    const tipo = content.locais.find(l => l.id === localId)?.tipo;
    // A covered battlefield is explicit. Clouds and forest canopy are not shelter.
    return ['castelo', 'cripta', 'mina', 'mansao', 'taverna', 'capela', 'oficina', 'forja'].includes(tipo ?? '');
}
function solDireto(content, camp) {
    const periodo = (0, time_1.periodoAtual)(camp.calendario);
    return ['manha', 'tarde'].includes(periodo) && !haAbrigoSolar(content, camp.localAtual);
}
function encontrosElegiveis(content, camp, pool) {
    return [...new Set(pool)].filter(id => {
        const c = content.criaturas.find(c => c.id === id);
        if (!c)
            return false;
        const unico = c.perfilOni?.identidade;
        if (unico && (camp.flags[`matou.${id}`] || camp.kimetsu?.rivais[unico]?.vivo === false))
            return false;
        return !c.oni || c.imuneLuz || !solDireto(content, camp);
    });
}
function obterRival(camp, c, ocupados, local = camp.localAtual, alvoId) {
    if (!c.oni)
        return undefined;
    inicializarKimetsu(camp);
    const estado = camp.kimetsu;
    const unico = c.perfilOni?.identidade;
    const ameaca = camp.continuidade?.ameacas.find(a => a.local === local && a.criaturaId === c.id && a.estado !== 'resolvida');
    const alvo = alvoId && estado.rivais[alvoId];
    const preferido = alvo && alvo.vivo && alvo.local === local && alvo.criaturaId === c.id ? alvo : ameaca && estado.rivais[ameaca.rivalId];
    let rival = unico ? estado.rivais[unico] : preferido && preferido.vivo && !ocupados.includes(preferido.id) ? preferido : Object.values(estado.rivais).find(r => r.vivo && r.criaturaId === c.id && r.local === local && !ocupados.includes(r.id));
    if (!rival) {
        const id = unico ?? `oni_${++estado.sequencia}`;
        rival = estado.rivais[id] = {
            id, criaturaId: c.id, nome: unico ? c.nome : `${c.nome} · ${estado.sequencia}`,
            vivo: !camp.flags[`matou.${c.id}`] || !unico,
            vida: c.vida, local, ultimoDia: camp.calendario.dia,
            reencontros: 0, vitorias: 0, fugas: 0, rancor: 0, memoria: [],
        };
    }
    // Rest regenerates wounds, never death. Same-day re-encounters retain damage.
    if (rival.vivo && camp.calendario.dia > rival.ultimoDia)
        rival.vida = c.vida;
    return rival;
}
function registrarConfronto(camp, resultado) {
    const s = camp.combate;
    if (!s)
        return;
    for (const a of s.atores) {
        const r = a.rivalId && camp.kimetsu?.rivais[a.rivalId];
        if (!r)
            continue;
        r.vida = a.vida;
        r.vivo = !a.mortoDefinitivo && a.vida > 0;
        r.local = camp.localAtual;
        r.ultimoDia = camp.calendario.dia;
        r.reencontros++;
        if (r.vivo)
            r.rancor = Math.min(10, r.rancor + 1);
        if (resultado === 'derrota' && r.vivo)
            r.vitorias++;
        if (resultado === 'fuga')
            r.fugas++;
        r.memoria.push({ dia: camp.calendario.dia, resultado, tecnica: s.ultimaTecnica, local: camp.localAtual,
            testemunhas: s.atores.filter(x => x.ehAliado && x.npcId && x.vida > 0).map(x => x.npcId) });
        r.comportamento ??= { recuperarAte: 0, pistaAte: 0, ultimoFeito: 0, ultimaAmeacaPessoal: -100 };
        r.comportamento.pista = camp.localAtual;
        r.comportamento.pistaAte = camp.calendario.dia + 14;
        if (r.vivo && a.vida < a.vidaMax * .4)
            r.comportamento.recuperarAte = camp.calendario.dia + 7;
        r.memoria = r.memoria.slice(-12);
        if (!r.vivo && a.perfilOni?.identidade)
            camp.flags[`matou.${a.criaturaId}`] = true;
    }
}
// An oni at zero endurance is exposed, not necessarily dead.
function aplicarFerimentoOni(camp, alvo, nichirin) {
    if (!alvo.oni || alvo.vida > 0)
        return;
    if (!nichirin || alvo.perfilOni?.morte === 'sol' || (alvo.perfilOni?.arte === 'emocoes' && !alvo.tatico?.revelado)) {
        alvo.vida = 1;
        camp.combate?.log.push(`${alvo.nome} perdeu a postura, mas a ferida não encerra sua existência.`);
        return;
    }
    if (alvo.perfilOni?.morte === 'gemeos') {
        alvo.vida = 1;
        alvo.decapitadoAte = (camp.combate?.rodada ?? 1) + 2;
        const outro = camp.combate?.atores.find(a => a.criaturaId === alvo.perfilOni?.parceiro);
        if (outro?.decapitadoAte && outro.decapitadoAte >= camp.combate.rodada) {
            for (const a of [alvo, outro]) {
                a.vida = 0;
                a.mortoDefinitivo = true;
            }
            camp.combate.log.push('Os dois pescoços foram cortados na mesma janela. O vínculo se desfaz.');
        }
        else
            camp.combate?.log.push('O outro irmão precisa ser decapitado antes que este se recomponha.');
        return;
    }
    alvo.mortoDefinitivo = true;
}
