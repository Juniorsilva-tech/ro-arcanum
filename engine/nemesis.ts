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

    // Resolução do pipeline Cheat Death (Enganar a Morte)
    if (r.cheatDeath?.diaRetorno && dia >= r.cheatDeath.diaRetorno) {
      r.vida = Math.ceil(criatura.vida * 0.7);
      r.rancor = Math.min(10, r.rancor + 3);
      r.reencontros++;
      r.evolucao ??= {
        nivel: 1, servos: 0, papel: 'predador', plano: 'perseguir', proximaAcao: dia + 3,
        refugio: r.local, adaptacoes: {},
      };
      r.evolucao.plano = 'perseguir';
      r.titulo = r.titulo ? `${r.titulo}, o Renascido` : 'o Renascido da Morte';
      if (r.cheatDeath.tecnicaSobrevivida) {
        r.evolucao.adaptacoes[r.cheatDeath.tecnicaSobrevivida] = 3;
      }
      r.tracos ??= {};
      r.tracos.odios ??= [];
      if (!r.tracos.odios.includes('furia_ao_sangrar')) r.tracos.odios.push('furia_ao_sangrar');
      r.comportamento ??= { recuperarAte: 0, pistaAte: dia + 14, ultimoFeito: 0, ultimaAmeacaPessoal: -100 };
      r.comportamento.pista = camp.localAtual;
      r.comportamento.pistaAte = dia + 14;
      r.cheatDeath.diaRetorno = undefined;

      if (camp.vivo) {
        registrarFato(camp, {
          tipo: 'retorno_nemesis',
          local: r.local,
          texto: `${r.nome}, agora conhecido como ${r.titulo}, sobreviveu à ferida fatal e retornou com sede de sangue.`,
          atores: [r.id],
          publico: true,
        });
      }
    }

    // Irmãos de Sangue (Blood Brothers): notificação de vingança
    if (r.relacoes?.irmaoDeSangueId) {
      const irmao = camp.kimetsu?.rivais[r.relacoes.irmaoDeSangueId];
      if (irmao && !irmao.vivo && (!r.tracos?.odios?.includes('furia_vinganca_sangue'))) {
        r.evolucao ??= {
          nivel: 0, servos: 0, papel: 'predador', plano: 'perseguir', proximaAcao: dia + 3,
          refugio: r.local, adaptacoes: {},
        };
        r.evolucao.plano = 'perseguir';
        r.rancor = 10;
        r.tracos ??= {};
        r.tracos.odios ??= [];
        r.tracos.odios.push('furia_vinganca_sangue');
        r.titulo = r.titulo ? `${r.titulo}, o Vingador de Sangue` : 'o Vingador de Sangue';
        if (camp.vivo) {
          registrarFato(camp, {
            tipo: 'vinganca_sangue',
            local: r.local,
            texto: `${r.nome} jurou vingança pela morte de seu irmão ${irmao.nome}, abandonando a cautela para caçar o responsável.`,
            atores: [r.id, irmao.id],
            publico: true,
          });
        }
      }
    }

    r.evolucao ??= {
      nivel: 0, servos: 0, papel: 'errante', plano: 'alimentar', proximaAcao: dia + 7,
      refugio: content.locais.find(l => haAbrigoSolar(content, l.id) && proximoPasso(content, r.local, l.id))?.id ?? r.local,
      adaptacoes: {},
    };
    const e = r.evolucao;
    const b = r.comportamento ??= { recuperarAte: 0, pistaAte: 0, ultimoFeito: 0, ultimaAmeacaPessoal: -100 };
    // Learning uses the enemy's actual witnessed history; defeats against a technique break the adaptation.
    for (const m of r.memoria) {
      if (m.tecnica) {
        const sucessos = r.memoria.filter(x => x.tecnica === m.tecnica && x.resultado !== 'vitoria').length;
        const derrotas = r.memoria.filter(x => x.tecnica === m.tecnica && x.resultado === 'vitoria').length;
        e.adaptacoes[m.tecnica] = Math.max(0, Math.min(3, sucessos - derrotas));
      }
    }
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
  processarDisputasPoder(content, camp);
}

function processarDisputasPoder(content: ContentBundle, camp: Campaign): void {
  const rivaisVivos = Object.values(camp.kimetsu?.rivais ?? {}).filter(r => r.vivo && r.evolucao && r.evolucao.plano === 'alimentar');
  if (rivaisVivos.length < 2) return;
  for (let i = 0; i < rivaisVivos.length; i++) {
    for (let j = i + 1; j < rivaisVivos.length; j++) {
      const a = rivaisVivos[i];
      const b = rivaisVivos[j];
      if (a.local === b.local && nextFloat(camp.rng) < 0.2) {
        const nivelA = (a.evolucao?.nivel ?? 0) + (a.evolucao?.servos ?? 0);
        const nivelB = (b.evolucao?.nivel ?? 0) + (b.evolucao?.servos ?? 0);
        const vencedor = nivelA >= nivelB ? a : b;
        const perdedor = nivelA >= nivelB ? b : a;
        vencedor.evolucao!.nivel = Math.min(4, vencedor.evolucao!.nivel + 1);
        vencedor.evolucao!.servos = Math.min(5, vencedor.evolucao!.servos + Math.max(1, Math.floor(perdedor.evolucao!.servos / 2)));
        perdedor.evolucao!.servos = Math.max(0, Math.floor(perdedor.evolucao!.servos / 2));
        perdedor.evolucao!.plano = 'ocultar';
        vencedor.relacoes ??= {};
        vencedor.relacoes.servosIds ??= [];
        if (!vencedor.relacoes.servosIds.includes(perdedor.id)) vencedor.relacoes.servosIds.push(perdedor.id);
        perdedor.relacoes ??= {};
        perdedor.relacoes.liderId = vencedor.id;
        if (camp.vivo) {
          registrarFato(camp, {
            tipo: 'disputa_oni',
            local: a.local,
            texto: `Disputa de poder entre onis em ${a.local}: ${vencedor.nome} subjugou ${perdedor.nome} e assumiu o comando de seus subordinados.`,
            atores: [vencedor.id, perdedor.id],
            publico: false,
          });
        }
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
