import type { Campaign, ContentBundle } from './types';
import { haAbrigoSolar, encontrosElegiveis } from './kimetsu';
import { cidadeIdDoLocal, proximoPasso, registrarFato } from './historiaViva';
import { oferecerMissao } from './missoesVivas';
import { nextFloat } from './rng';
import { fichaCombatente, treinarNpc } from './progressaoNpc';

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
    const b = r.comportamento ??= { recuperarAte: 0, pistaAte: 0, ultimoFeito: 0, ultimaAmeacaPessoal: -100 };
    // Learning uses the enemy's actual witnessed history; no omniscient counter selection.
    for (const m of r.memoria) if (m.tecnica) e.adaptacoes[m.tecnica] = Math.min(3, r.memoria.filter(x => x.tecnica === m.tecnica).length);
    if (dia < e.proximaAcao) continue;
    e.proximaAcao = dia + 7;
    const local = cidadeIdDoLocal(content, camp, r.local), cidade = local && v.cidades[local];
    if (b.recuperarAte > dia) {
      e.plano = 'ocultar';
    } else if (r.rancor >= 2 && r.reencontros > 0 && b.pista && dia <= b.pistaAte) {
      e.plano = 'perseguir';
      // Advances one map edge per week by night, resting in concealment by day.
      const passo = proximoPasso(content, r.local, b.pista);
      if (passo && !camp.continuidade?.ameacas.some(a => a.rivalId === r.id && a.estado !== 'resolvida')) r.local = passo;
    } else if ((cidade && cidade.inseguranca < 10) || r.fugas >= 3) e.plano = 'ocultar';
    else e.plano = 'alimentar';
    if (b.pista && dia > b.pistaAte) {
      b.pista = undefined;
      r.rancor = Math.max(0, r.rancor - 1);
      registrarFato(camp, { tipo: 'pista_perdida', local: r.local, texto: `${r.nome} perdeu o rastro e abandonou a perseguição por enquanto.`, atores: [r.id], publico: false });
    }
    if (e.plano === 'alimentar' && cidade && cidade.inseguranca > 25) {
      const antes = e.servos;
      e.servos = Math.min(5, e.servos + 1);
      if (e.servos > antes && e.servos % 2 === 0) e.nivel = Math.min(4, e.nivel + 1);
      e.papel = e.nivel >= 3 ? 'agente' : 'predador';
      if (e.servos > antes) registrarFato(camp, { tipo: 'rede_oni', local: r.local, texto: `${r.nome} ampliou uma rede de servos e esconderijos.`, atores: [r.id], publico: false });
    }
    if (e.plano === 'ocultar' && cidade && cidade.inseguranca < 10) e.servos = Math.max(0, e.servos - 1);
    // Actual victories can teach; elapsed weeks alone cannot grant fighting skill.
    if (r.vitorias > b.ultimoFeito) { e.nivel = Math.min(4, e.nivel + 1); b.ultimoFeito = r.vitorias; }
    const ameaca = camp.continuidade?.ameacas.find(a => a.rivalId === r.id && a.estado !== 'resolvida');
    if (ameaca && !v.missoes.some(q => q.rival === r.id && ['oferecida', 'aceita'].includes(q.estado)) && dia >= b.ultimaAmeacaPessoal + 30) {
      const conhecido = r.memoria.at(-1)?.testemunhas?.find(id => camp.npcState[id]?.vivo);
      const fato = registrarFato(camp, { tipo: 'rastros_oni', local: ameaca.local, texto: 'Pessoas desapareceram à noite. Restaram pistas que podem levar ao esconderijo.', atores: [], publico: true });
      const pessoal = conhecido && registrarFato(camp, { tipo: 'ameaca_pessoal', local: ameaca.local, texto: `${r.nome} reconheceu um companheiro do confronto anterior. Os rastros podem esclarecer o risco para essa pessoa.`, atores: [r.id, conhecido], causa: { id: fato.id, texto: fato.texto }, publico: true });
      if (oferecerMissao(camp, 'investigar', pessoal || fato, { rival: r.id, ator: conhecido }, content)) b.ultimaAmeacaPessoal = dia;
    }
    if (ameaca && dia - ameaca.inicio > 14 && !criatura.chefe && r.reencontros === 0) {
      const defensor = [...content.npcs, ...(camp.npcsProcedurais ?? [])].find(n => n.combatente?.nichirin && camp.npcState[n.id]?.vivo && !(camp.grupo ?? []).includes(n.id) && v.pessoas[n.id]?.objetivo === 'cacar' && !v.pessoas[n.id].viagem && v.pessoas[n.id].local === ameaca.local && (v.pessoas[n.id]?.habilidade ?? 0) + (fichaCombatente(camp, n)?.acerto ?? 0) >= criatura.nivel * 5);
      if (defensor && nextFloat(camp.rng) < .12) {
        r.vivo = false; r.vida = 0; r.ultimoDia = dia;
        treinarNpc(camp, defensor, 1, criatura.nivel * 2);
        v.pessoas[defensor.id].prestigio = Math.min(100, v.pessoas[defensor.id].prestigio + 10);
        registrarFato(camp, { tipo: 'cacada_npc', local: ameaca.local, texto: `${defensor.nome} retornou de uma caçada e confirmou a morte de ${r.nome}.`, atores: [defensor.id, r.id], publico: true });
      }
    }
  }
}

export function emboscadaNemesis(content: ContentBundle, camp: Campaign): string[] | null {
  for (const r of Object.values(camp.kimetsu?.rivais ?? {})) {
    if (!r.vivo || r.evolucao?.plano !== 'perseguir' || !r.comportamento?.pista || camp.calendario.dia > r.comportamento.pistaAte || camp.calendario.dia < r.comportamento.recuperarAte || r.local !== camp.localAtual || camp.calendario.dia < (r.evolucao.ultimaEmboscada ?? -100) + 3) continue;
    if (!encontrosElegiveis(content, camp, [r.criaturaId]).length) continue;
    r.evolucao.ultimaEmboscada = camp.calendario.dia;
    if (camp.vivo) registrarFato(camp, { tipo: 'emboscada', local: r.local, texto: `${r.nome} reconheceu seus rastros e preparou uma emboscada.`, atores: [r.id], publico: true });
    return [r.criaturaId];
  }
  return null;
}
