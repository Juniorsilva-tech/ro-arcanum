"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processarPolitica = processarPolitica;
exports.registrarResultadoPolitico = registrarResultadoPolitico;
const historiaViva_1 = require("./historiaViva");
const rng_1 = require("./rng");
function processarPolitica(content, camp) {
    const v = camp.vivo, dia = camp.calendario.dia;
    const elenco = [...content.npcs, ...(camp.npcsProcedurais ?? [])];
    for (const [id, g] of Object.entries(v.governos)) {
        if (!g.lider || !camp.npcState[g.lider]?.vivo) {
            const anterior = g.lider;
            const candidatos = elenco.filter(n => n.faccaoId === id && n.especie !== 'oni' && camp.npcState[n.id]?.vivo && (camp.npcState[n.id].idade ?? n.idade) >= 18 && v.pessoas[n.id]?.objetivo !== 'cativo');
            candidatos.sort((a, b) => ((v.pessoas[b.id]?.prestigio ?? 0) + (v.pessoas[b.id]?.habilidade ?? 0)) - ((v.pessoas[a.id]?.prestigio ?? 0) + (v.pessoas[a.id]?.habilidade ?? 0)) || a.id.localeCompare(b.id));
            g.lider = candidatos[0]?.id;
            if (g.lider && anterior !== g.lider) {
                if (anterior)
                    g.sucessoes++;
                g.legitimidade = anterior ? 40 : 65;
                (0, historiaViva_1.registrarFato)(camp, { tipo: anterior ? 'sucessao' : 'lideranca', local: (0, historiaViva_1.localEfetivo)(camp, candidatos[0], undefined, content) ?? candidatos[0].localBase, texto: `${candidatos[0].nome} assumiu a liderança de ${content.faccoes.find(f => f.id === id)?.nome ?? id}.`, atores: [g.lider, ...(anterior ? [anterior] : [])], publico: true });
            }
        }
        const dominios = Object.entries(v.cidades).filter(([, c]) => c.governo === id);
        const crise = dominios.some(([, c]) => c.fomeDias > 0 || c.doenca > 50);
        g.legitimidade = Math.max(0, Math.min(100, g.legitimidade + (crise ? -.6 : .15)));
        const forca = camp.mundo?.faccoes?.[id];
        if (forca && !camp.mundo?.guerraAtiva) {
            forca.recursos = Math.min(200, forca.recursos + .5 + dominios.length * .2);
            forca.forca = Math.min(100, forca.forca + .1);
            forca.moral = Math.min(100, forca.moral + .1);
        }
        if (g.legitimidade < 20 && dia % 15 === 0) {
            const cidade = dominios[0];
            if (cidade) {
                cidade[1].governo = undefined;
                cidade[1].inseguranca = Math.min(100, cidade[1].inseguranca + 10);
                g.legitimidade = 35;
                (0, historiaViva_1.registrarFato)(camp, { tipo: 'revolta', local: cidade[0], texto: 'Moradores romperam com o governo após uma crise prolongada. A comunidade passou a se administrar.', atores: g.lider ? [g.lider] : [], publico: true });
            }
        }
    }
    // Civil governments only. Hunters and onis do not acquire public territories.
    if (!camp.flags['vivo.territorios_iniciais']) {
        for (const [local, c] of Object.entries(v.cidades))
            c.governo = elenco.find(n => n.localBase === local && v.governos[n.faccaoId])?.faccaoId;
        camp.flags['vivo.territorios_iniciais'] = true;
    }
    for (const [a, b] of content.rivalidadesFaccoes ?? []) {
        const ga = v.governos[a], gb = v.governos[b];
        if (!ga || !gb)
            continue;
        ga.relacoes[b] ??= -35;
        gb.relacoes[a] ??= -35;
        if (dia % 7 !== 0 || camp.mundo?.guerraAtiva)
            continue;
        const disputa = Object.values(v.cidades).some(c => [a, b].includes(c.governo ?? '') && c.fomeDias > 0);
        const delta = disputa ? -5 : (0, rng_1.nextFloat)(camp.rng) < .4 ? 4 : -2;
        ga.relacoes[b] = Math.max(-100, Math.min(100, ga.relacoes[b] + delta));
        gb.relacoes[a] = ga.relacoes[b];
        if (ga.relacoes[b] <= -55 && dia >= (ga.treguaAte[b] ?? 0) && dia >= (camp.mundo?.proximaGuerra ?? 0)) {
            const local = Object.keys(v.cidades).find(l => [a, b].includes(v.cidades[l].governo ?? ''));
            if (local && camp.mundo?.faccoes?.[a] && camp.mundo.faccoes[b] && camp.mundo.faccoes[a].recursos > 30 && camp.mundo.faccoes[b].recursos > 30) {
                camp.mundo.guerraAtiva = { a, b, local, diasRestantes: 16, impulsoA: 0, impulsoB: 0 };
                (0, historiaViva_1.registrarFato)(camp, { tipo: 'guerra', local, texto: 'As negociações fracassaram. A disputa política se tornou uma frente de guerra.', atores: [ga.lider, gb.lider].filter((x) => !!x), publico: true });
                break;
            }
        }
    }
}
function registrarResultadoPolitico(camp, local, a, b, vencedor) {
    const v = camp.vivo;
    if (!v)
        return;
    const ga = v.governos[a], gb = v.governos[b];
    if (!ga || !gb)
        return;
    ga.treguaAte[b] = camp.calendario.dia + 45;
    gb.treguaAte[a] = ga.treguaAte[b];
    ga.relacoes[b] = -25;
    gb.relacoes[a] = -25;
    if (vencedor && v.cidades[local])
        v.cidades[local].governo = vencedor;
    (0, historiaViva_1.registrarFato)(camp, { tipo: 'fim_guerra', local, texto: vencedor ? `A frente terminou. ${vencedor} passou a administrar a comunidade; uma trégua entrou em vigor.` : 'A guerra terminou sem vencedor. Uma trégua interrompeu os combates.', atores: [], publico: true });
}
