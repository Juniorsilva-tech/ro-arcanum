import type { Campaign, ContentBundle, NPC } from './types';
import { cidadeIdDoLocal, localEfetivo, proximoPasso, registrarFato } from './historiaViva';
import { nextFloat, pick } from './rng';
import { oferecerMissao, encerrarMissao, periodosDeViagem } from './missoesVivas';
import { registrarMorteFamiliar } from './familia';
import { treinarNpc } from './progressaoNpc';
import { processarFormacao } from './formacao';

/** A cidade de origem voltou a ser lugar de morar? */
function casaHabitavel(content: ContentBundle, camp: Campaign, casa: string): boolean {
  const id = cidadeIdDoLocal(content, camp, casa);
  const c = id ? camp.vivo?.cidades[id] : undefined;
  if (!c || !id) return false;
  const povo = camp.continuidade?.locais[id];
  return c.fomeDias === 0 && c.inseguranca < 55 && (povo?.integridade ?? 0) >= 40;
}

/**
 * Para onde alguém foge: o assentamento mais PERTO que tenha comida, calma e
 * espaço. Capacidade importa — uma cidade cheia deixa de atrair, e é isso que
 * espalha a população em vez de concentrá-la.
 */
function destinoDeMigracao(
  content: ContentBundle,
  camp: Campaign,
  origem: string,
  cidadeAtual: string | undefined,
): string | undefined {
  const v = camp.vivo!;
  const candidatos = Object.keys(v.cidades)
    .filter(id => {
      if (id === cidadeAtual) return false;
      const d = v.cidades[id];
      const povo = camp.continuidade?.locais[id];
      if (!povo || d.fomeDias > 0 || d.inseguranca >= 40) return false;
      if (povo.populacao >= d.edificios.moradias * 90) return false;
      return !!proximoPasso(content, origem, id);
    })
    .map(id => ({ id, perto: periodosDeViagem(content, origem, id), calma: v.cidades[id].inseguranca }))
    .filter(x => Number.isFinite(x.perto))
    .sort((a, b) => a.perto - b.perto || a.calma - b.calma);
  return candidatos[0]?.id;
}

export function processarAutonomia(content: ContentBundle, camp: Campaign): void {
  const v = camp.vivo!, dia = camp.calendario.dia;
  const elenco = [...content.npcs, ...(camp.npcsProcedurais ?? [])];
  camp.grupo = (camp.grupo ?? []).filter(id => camp.npcState[id]?.vivo);
  for (const npc of elenco) {
    const p = v.pessoas[npc.id], din = camp.npcState[npc.id];
    if (!p || !din?.vivo || npc.especie === 'oni') continue;
    if ((din.idade ?? npc.idade) < 18) {
      const tutor = p.tutores?.find(id => camp.npcState[id]?.vivo);
      if (tutor) { p.local = v.pessoas[tutor].local; p.casa = v.pessoas[tutor].casa; }
      continue;
    }
    if ((camp.grupo ?? []).includes(npc.id)) {
      p.local = camp.localAtual; p.viagem = undefined;
      // Respect decisions only between fights, never remove an actor mid-turn.
      if ((!camp.combate || camp.combate.terminado) && (din.eixos.confianca ?? 0) < -5) {
        camp.grupo = camp.grupo!.filter(id => id !== npc.id); p.deslocado = true;
        registrarFato(camp, { tipo: 'ruptura_grupo', local: p.local, texto: `${npc.nome} deixou o grupo após perder a confiança em você.`, atores: [npc.id, 'jogador'], publico: false, conhecimento: 'testemunhado' });
      } else continue;
    }
    if (p.objetivo === 'cativo') {
      const parente = camp.familia?.membros.find(m => m.id === npc.id);
      if (parente?.condicao === 'livre') { p.objetivo = 'rotina'; p.local = npc.localBase; }
      else if (p.cativoAte !== undefined && dia >= p.cativoAte) {
        p.objetivo = 'trabalhar'; p.cativoAte = undefined; p.deslocado = true;
        if (parente) parente.condicao = 'livre';
        registrarFato(camp, { tipo: 'fuga_cativeiro', local: p.local, texto: `${npc.nome} escapou do cativeiro e procura recompor a vida.`, atores: [npc.id], publico: true });
      } else continue;
    }
    if (p.viagem) {
      if (dia < p.viagem.chegada) continue;
      const destinoFinal = p.viagem.destino;
      const passo = proximoPasso(content, p.local, destinoFinal);
      if (!passo) { p.viagem = undefined; continue; }
      p.local = passo; p.deslocado = true;
      if (p.local !== destinoFinal) { p.viagem.chegada = dia + 1; continue; }
      p.viagem = undefined;
      if (p.objetivo !== 'cacar') p.casa = p.local;
      registrarFato(camp, { tipo: 'mudanca', local: p.local, texto: `${npc.nome} chegou e estabeleceu uma nova moradia.`, atores: [npc.id], publico: true });
    }
    const local = localEfetivo(camp, npc, undefined, content) ?? p.local;
    const cidadeId = cidadeIdDoLocal(content, camp, local), c = cidadeId && v.cidades[cidadeId];
    if (!c) continue;
    p.fome = Math.max(0, Math.min(100, p.fome + (c.fomeDias ? 6 : -12)));
    p.saude = Math.max(0, Math.min(100, p.saude + (c.doenca > 30 ? -1.5 : .8) - (p.fome > 80 ? 2 : 0)));
    if (p.saude <= 0) {
      din.vivo = false; registrarMorteFamiliar(camp, npc.id);
      registrarFato(camp, { tipo: 'morte_doenca', local, texto: `${npc.nome} não resistiu à doença e à falta de cuidados.`, atores: [npc.id], publico: true }); continue;
    }
    if (dia < p.proximaDecisao) continue;
    p.proximaDecisao = dia + 3;
    if (processarFormacao(content, camp, npc)) continue;
    const ameaca = camp.continuidade?.ameacas.find(a => a.estado !== 'resolvida' && camp.kimetsu?.rivais[a.rivalId]?.vivo && proximoPasso(content, local, a.local));
    if (npc.combatente?.nichirin && ameaca && p.saude >= 65 && p.fome < 45) {
      p.objetivo = 'cacar'; p.local = local; p.deslocado = true;
      if (local !== ameaca.local) p.viagem = { destino: ameaca.local, chegada: dia + 1 };
      continue;
    }
    if (p.saude < 65 && c.remedios >= 2) {
      p.objetivo = 'tratar'; c.remedios -= 2; p.saude = Math.min(100, p.saude + 12);
    } else if (p.deslocado && (p.natal ?? p.casa) !== local && casaHabitavel(content, camp, p.natal ?? p.casa)) {
      // Ninguém fica fora de casa por gosto. Se o lugar de origem voltou a
      // servir, a pessoa volta — e é isso que impede o mundo de se esvaziar
      // num ponto só.
      p.objetivo = 'migrar'; p.local = local; p.viagem = { destino: p.natal ?? p.casa, chegada: dia + 1 };
      registrarFato(camp, { tipo: 'retorno_npc', local, texto: `${npc.nome} arrumou o que tinha e voltou para casa.`, atores: [npc.id], publico: true });
    } else if (p.fome > 60 || c.inseguranca > 75) {
      // Sair de casa é último recurso, e o destino é o mais PERTO que sirva —
      // não o primeiro da lista. Antes era `[0]`, a mesma cidade na ordem do
      // objeto, sempre: todo mundo que migrava em dez anos ia parar no mesmo
      // lugar, e o resto do mundo esvaziava. Medido: vinte de vinte e três
      // assentamentos sem uma alma ao fim de uma década.
      const destino = destinoDeMigracao(content, camp, local, cidadeId);
      if (destino) {
        p.objetivo = 'migrar'; p.local = local; p.viagem = { destino, chegada: dia + 1 };
        registrarFato(camp, { tipo: 'partida_npc', local, texto: `${npc.nome} partiu em busca de segurança e alimento.`, atores: [npc.id], publico: true });
      }
    } else if (p.moedas < 40) {
      p.objetivo = 'trabalhar';
      const salario = Math.min(c.tesouro, 3 + Math.floor(p.habilidade / 3));
      c.tesouro -= salario; p.moedas = Math.min(250, p.moedas + salario); c.materiais = Math.min(250, c.materiais + 2);
    } else if (npc.combatente && nextFloat(camp.rng) < .5) {
      p.objetivo = 'treinar'; p.habilidade = Math.min(20, p.habilidade + .2); p.moedas -= 1;
      treinarNpc(camp, npc, 1);
    } else {
      p.objetivo = 'rotina';
      const conhecida = elenco.find(n => n.id !== npc.id && camp.npcState[n.id]?.vivo && (camp.npcState[n.id]?.idade ?? n.idade) >= 18 && n.especie !== 'oni' && localEfetivo(camp, n, undefined, content) === local && !n.parentesco && !npc.parentesco);
      if (conhecida) {
        p.parceiros[conhecida.id] = Math.min(100, (p.parceiros[conhecida.id] ?? 0) + 3);
        const outra = v.pessoas[conhecida.id];
        if (outra && p.parceiros[conhecida.id] >= 30 && !p.conjuge && !outra.conjuge && npc.relacoes?.some(r => r.npc === conhecida.id && r.tipo === 'amante')) {
          p.conjuge = conhecida.id; outra.conjuge = npc.id;
          registrarFato(camp, { tipo: 'uniao', local, texto: `${npc.nome} e ${conhecida.nome} formaram uma casa em comum.`, atores: [npc.id, conhecida.id], publico: true });
        }
      }
    }
    // Captivity follows actual insecurity and poverty; it is not a global random death roll.
    if (c.inseguranca > 75 && p.moedas < 10 && !npc.combatente && nextFloat(camp.rng) < .02) {
      p.objetivo = 'cativo'; p.cativoAte = dia + 25; p.deslocado = true;
      const parente = camp.familia?.membros.find(m => m.id === npc.id);
      if (parente) parente.condicao = 'cativo';
      const fato = registrarFato(camp, { tipo: 'captura', local, texto: `${npc.nome} foi levado por captores que exploram a desordem local.`, atores: [npc.id], publico: true });
      oferecerMissao(camp, 'resgatar', fato, { ator: npc.id });
    }
    // NPCs can finish civic work; the protagonist never receives their reward.
    if (p.objetivo === 'trabalhar' && p.habilidade >= 3 && nextFloat(camp.rng) < .15) {
      const q = v.missoes.find(q => q.local === cidadeId && q.estado === 'oferecida' && ['tratar', 'reconstruir'].includes(q.tipo));
      if (q?.tipo === 'tratar' && c.remedios >= 5) { c.remedios -= 5; c.doenca = Math.max(0, c.doenca - 20); }
      if (q?.tipo === 'reconstruir' && c.materiais >= 8) { c.materiais -= 8; camp.continuidade!.locais[cidadeId!].integridade = Math.min(100, camp.continuidade!.locais[cidadeId!].integridade + 10); }
      if (q && ((q.tipo === 'tratar' && c.doenca === 0) || (q.tipo === 'reconstruir' && camp.continuidade!.locais[cidadeId!].integridade >= 95))) {
        p.prestigio = Math.min(100, p.prestigio + 5);
        encerrarMissao(camp, q, 'resolvida_por_outros', `${npc.nome} organizou a ajuda e resolveu ${q.titulo.toLowerCase()}.`);
      }
    }
  }
  // New residents keep the world populated over decades. Children stay out of adult interactions.
  if (dia % 90 === 0 && (camp.npcsProcedurais?.length ?? 0) < 160) {
    const casas = elenco.filter(n => camp.npcState[n.id]?.vivo && n.especie !== 'oni' && !n.parentesco && (v.pessoas[n.id]?.moedas ?? 0) >= 30 && v.pessoas[n.id].filhos.length < 2 && !v.pessoas[n.id].viagem && v.pessoas[n.id].objetivo !== 'cativo');
    if (casas.length) {
      const tutor = pick(camp.rng, casas), casa = v.pessoas[tutor.id];
      const cidade = cidadeIdDoLocal(content, camp, casa.local);
      if (cidade && v.cidades[cidade].fomeDias === 0) {
        const id = `residente_${++v.sequencia}`;
        const nome = `${pick(camp.rng, ['Ari', 'Neri', 'Lian', 'Sora', 'Ren', 'Yuna'])} ${v.sequencia}`;
        const novo: NPC = { id, nome, idade: 0, especie: 'humano', ocupacao: 'criança acolhida', faccaoId: tutor.faccaoId, localBase: casa.local, rotina: {}, vozNarrativa: 'curiosa e direta', personalidade: pick(camp.rng, ['observadora e paciente', 'impulsiva e leal', 'reservada e inventiva']), corpo: 'Aparência registrada conforme cresce.', relacoes: [{ npc: tutor.id, tipo: 'sangue', nota: 'família por acolhimento' }] };
        (camp.npcsProcedurais ??= []).push(novo);
        camp.npcState[id] = { vivo: true, idade: 0, tensao: 0, eixos: {}, memoria: [] };
        v.pessoas[id] = { natal: casa.local, casa: casa.local, local: casa.local, deslocado: true, objetivo: 'rotina', moedas: 0, fome: 0, saude: 100, habilidade: nextFloat(camp.rng) < .05 ? 8 : 1, prestigio: 0, proximaDecisao: dia + 3, parceiros: {}, filhos: [], tutores: [tutor.id] };
        casa.filhos.push(id); casa.moedas -= 10;
        registrarFato(camp, { tipo: 'acolhimento', local: casa.local, texto: `${tutor.nome} acolheu ${nome}, uma criança recém-chegada à comunidade.`, atores: [tutor.id, id], publico: true });
      }
    }
  }
}
