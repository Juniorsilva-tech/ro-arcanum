import type { Campaign, ContentBundle } from './types';
import { haAbrigoSolar, encontrosElegiveis } from './kimetsu';
import { cidadeIdDoLocal, proximoPasso, registrarFato } from './historiaViva';
import { oferecerMissao } from './missoesVivas';
import { nextFloat } from './rng';

export function processarNemesis(content: ContentBundle, camp: Campaign): void {
  const v = camp.vivo!, dia = camp.calendario.dia;
  for (const r of Object.values(camp.kimetsu?.rivais ?? {})) {
    if (!r.vivo) continue;
    const criatura = content.criaturas.find(c => c.id === r.criaturaId);
    if (!criatura) continue;
    r.evolucao ??= {
      nivel: 0, servos: 0, papel: 'errante', plano: 'alimentar', proximaAcao: dia + 7,
      refugio: content.locais.find(l => haAbrigoSolar(content, l.id) && proximoPasso(content, r.local, l.id))?.id ?? r.local,
      adaptacoes: {},
    };
    const e = r.evolucao;
    // Learning uses the enemy's actual witnessed history; no omniscient counter selection.
    for (const m of r.memoria) if (m.tecnica) e.adaptacoes[m.tecnica] = Math.min(3, r.memoria.filter(x => x.tecnica === m.tecnica).length);
    if (dia < e.proximaAcao) continue;
    e.proximaAcao = dia + 7;
    const local = cidadeIdDoLocal(content, camp, r.local), cidade = local && v.cidades[local];
    if (r.rancor >= 2 && r.reencontros > 0) {
      e.plano = 'perseguir';
      // Advances one map edge per week by night, resting in concealment by day.
      const passo = proximoPasso(content, r.local, camp.localAtual);
      if (passo && !camp.continuidade?.ameacas.some(a => a.rivalId === r.id && a.estado !== 'resolvida')) r.local = passo;
    } else if ((cidade && cidade.inseguranca < 10) || r.fugas >= 3) e.plano = 'ocultar';
    else e.plano = 'alimentar';
    if (e.plano === 'alimentar' && cidade && cidade.inseguranca > 25) {
      e.servos = Math.min(5, e.servos + 1);
      if (e.servos % 2 === 0) e.nivel = Math.min(4, e.nivel + 1);
      e.papel = e.nivel >= 3 ? 'agente' : 'predador';
      registrarFato(camp, { tipo: 'rede_oni', local: r.local, texto: `${r.nome} ampliou uma rede de servos e esconderijos.`, atores: [r.id], publico: false });
    }
    const ameaca = camp.continuidade?.ameacas.find(a => a.rivalId === r.id && a.estado !== 'resolvida');
    if (ameaca && !v.missoes.some(q => q.rival === r.id)) {
      const fato = registrarFato(camp, { tipo: 'rastros_oni', local: ameaca.local, texto: 'Pessoas desapareceram à noite. Restaram pistas que podem levar ao esconderijo.', atores: [], publico: true });
      oferecerMissao(camp, 'investigar', fato, { rival: r.id });
    }
    if (ameaca && dia - ameaca.inicio > 14 && !criatura.chefe && r.reencontros === 0) {
      const defensor = content.npcs.find(n => n.combatente?.nichirin && camp.npcState[n.id]?.vivo && !(camp.grupo ?? []).includes(n.id) && v.pessoas[n.id]?.objetivo === 'cacar' && !v.pessoas[n.id].viagem && v.pessoas[n.id].local === ameaca.local && (v.pessoas[n.id]?.habilidade ?? 0) + n.combatente.acerto >= criatura.nivel * 5);
      if (defensor && nextFloat(camp.rng) < .12) {
        r.vivo = false; r.vida = 0; r.ultimoDia = dia;
        v.pessoas[defensor.id].prestigio = Math.min(100, v.pessoas[defensor.id].prestigio + 10);
        registrarFato(camp, { tipo: 'cacada_npc', local: ameaca.local, texto: `${defensor.nome} retornou de uma caçada e confirmou a morte de ${r.nome}.`, atores: [defensor.id, r.id], publico: true });
      }
    }
  }
}

export function emboscadaNemesis(content: ContentBundle, camp: Campaign): string[] | null {
  for (const r of Object.values(camp.kimetsu?.rivais ?? {})) {
    if (!r.vivo || r.evolucao?.plano !== 'perseguir' || r.local !== camp.localAtual || camp.calendario.dia < (r.evolucao.ultimaEmboscada ?? -100) + 3) continue;
    if (!encontrosElegiveis(content, camp, [r.criaturaId]).length) continue;
    r.evolucao.ultimaEmboscada = camp.calendario.dia;
    if (camp.vivo) registrarFato(camp, { tipo: 'emboscada', local: r.local, texto: `${r.nome} reconheceu seus rastros e preparou uma emboscada.`, atores: [r.id], publico: true });
    return [r.criaturaId];
  }
  return null;
}
