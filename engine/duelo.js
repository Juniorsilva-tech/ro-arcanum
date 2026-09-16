"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolverDueloDeFundo = resolverDueloDeFundo;
exports.processarDuelosDeFundo = processarDuelosDeFundo;
const rng_1 = require("./rng");
const memoria_1 = require("./memoria");
const time_1 = require("./time");
// `reforco` = true quando mais de um caçador de peso participa do embate
// (dois Hashiras vivos, ou um Hashira mais um aprendiz forte o bastante).
// `vantagemNivel` é a diferença de "poder" entre os caçadores e a Lua
// Superior — pode vir negativa (a Lua é mais forte, o normal do mundo).
function resolverDueloDeFundo(rng, vantagemNivel, reforco) {
    const baseVitoria = reforco ? 0.22 : 0.04; // sem reforço, quase nunca vence — é o ponto do "113 anos"
    const chanceVitoria = Math.max(0.02, Math.min(0.55, baseVitoria + vantagemNivel * 0.015));
    const chanceFuga = reforco ? 0.4 : 0.55; // fugir pra viver é a saída mais comum, não a derrota
    const r = (0, rng_1.nextFloat)(rng);
    if (r < chanceVitoria)
        return 'vitoria';
    if (r < chanceVitoria + chanceFuga)
        return 'fuga';
    return 'derrota';
}
const CHANCE_DIARIA = 0.03;
const COOLDOWN_DIAS = 20;
// Roda uma vez por dia virado (chamada de dentro de avancarMundo). Não sabe
// nada sobre Demon Slayer, Onis ou Luas — só lê o `duelo` que o pacote de
// conteúdo colocou em cada NPC (content/vaelhorn/npcs.ts) e resolve.
function processarDuelosDeFundo(content, camp) {
    const hoje = camp.calendario.dia;
    const mundo = camp.mundo;
    if (mundo && (mundo.proximoDueloDeFundo ?? 0) > hoje)
        return;
    const candidatos = content.npcs.filter((n) => n.duelo && camp.npcState[n.id]?.vivo && !(camp.grupo ?? []).includes(n.id));
    if (candidatos.length === 0)
        return;
    if ((0, rng_1.nextFloat)(camp.rng) >= CHANCE_DIARIA)
        return;
    const duelista = (0, rng_1.pick)(camp.rng, candidatos);
    const cfg = duelista.duelo;
    // Named adversaries must actually be alive and located in reach. Never
    // manufacture an anonymous Upper Moon victory or kill a distant Hashira.
    const periodo = (0, time_1.periodoAtual)(camp.calendario);
    const localDuelo = duelista.rotina[periodo] ?? duelista.localBase;
    const rival = Object.values(camp.kimetsu?.rivais ?? {}).find(r => r.vivo && r.local === localDuelo && r.criaturaId.startsWith('lua_superior_'));
    if (!rival)
        return;
    const criatura = content.criaturas.find(c => c.id === rival.criaturaId);
    if (!criatura || criatura.perfilOni?.morte === 'gemeos')
        return;
    const aliadosVivos = candidatos.filter((n) => n.duelo.grupo === cfg.grupo && (n.rotina[periodo] ?? n.localBase) === localDuelo).length;
    // Reforço também conta se o jogador aprendeu com o mestre ligado a esse
    // grupo e já tem nível pra pesar num embate desse porte.
    const mestreDoGrupo = content.mestres.find((m) => m.id === duelista.ensinaMestre);
    const aprendizForte = camp.localAtual === localDuelo && !!mestreDoGrupo &&
        camp.personagem.artesConhecidas.some((a) => mestreDoGrupo.ensina.includes(a)) &&
        camp.personagem.nivel >= Math.max(1, cfg.forca - 2);
    const reforco = aliadosVivos >= 2 || aprendizForte;
    const vantagem = cfg.forca - criatura.nivel + (reforco ? 3 : 0);
    const resultado = resolverDueloDeFundo(camp.rng, vantagem, reforco);
    if (camp.mundo)
        camp.mundo.proximoDueloDeFundo = hoje + COOLDOWN_DIAS;
    if (resultado === 'vitoria') {
        rival.vivo = false;
        rival.vida = 0;
        camp.flags[`matou.${rival.criaturaId}`] = true;
        (0, memoria_1.registrarMarco)(camp, `dia ${hoje}: ${duelista.nome} venceu ${rival.nome}.`);
        if (cfg.faccaoGanho && aprendizForte)
            camp.reputacao[cfg.faccaoGanho] = (camp.reputacao[cfg.faccaoGanho] ?? 0) + 5;
    }
    else if (resultado === 'fuga') {
        (0, memoria_1.registrarMarco)(camp, `dia ${hoje}: ${duelista.nome} recuou de ${rival.nome}.`);
    }
    else {
        (0, memoria_1.registrarMarco)(camp, `dia ${hoje}: ${duelista.nome} não voltou do encontro com ${rival.nome}.`);
        camp.npcState[duelista.id].vivo = false;
    }
}
