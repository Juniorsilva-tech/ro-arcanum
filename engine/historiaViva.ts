import type { Campaign, ContentBundle, NPC, Periodo } from './types';
import type { FatoHistorico, MundoVivo } from './vivoTypes';
import { periodoAtual } from './time';

export function iniciarMundoVivo(content: ContentBundle, camp: Campaign): MundoVivo {
  const v = camp.vivo ??= {
    versao: 1, ultimoDia: camp.mundo?.diaProcessado ?? camp.calendario.dia, sequencia: 0,
    cidades: {}, pessoas: {}, governos: {}, fatos: [], missoes: [], arquivo: [],
    diretor: { proximoIncidente: camp.calendario.dia + 10, intensidade: 0 }, contadores: {},
  };
  for (const [id] of Object.entries(camp.continuidade?.locais ?? {})) {
    v.cidades[id] ??= {
      comida: 160, materiais: 90, remedios: 30, tesouro: 150,
      edificios: { lavoura: 1, moradias: 1, enfermaria: 1, muralha: 1, mercado: 1 },
      fomeDias: 0, doenca: 0, inseguranca: 5, secaAte: 0, ultimoIncidente: -100,
      estoque: {},
    };
  }
  // Shops can be outside a population centre; they share the nearest reachable market.
  for (const item of content.itens) for (const local of item.lojas ?? []) {
    const cidade = cidadeDoLocal(content, camp, local);
    if (cidade) cidade.estoque[item.id] ??= item.raridade === 'comum' ? 12 : 2;
  }
  for (const npc of [...content.npcs, ...(camp.npcsProcedurais ?? [])]) {
    if (!camp.npcState[npc.id]) continue;
    const cativo = camp.familia?.membros.find(m => m.id === npc.id)?.condicao === 'cativo';
    v.pessoas[npc.id] ??= {
      casa: npc.localBase, local: npc.localBase, deslocado: false,
      objetivo: cativo ? 'cativo' : 'rotina', moedas: 20, fome: 0, saude: 100,
      habilidade: npc.combatente ? 5 : 1, prestigio: 0, proximaDecisao: camp.calendario.dia + 3,
      parceiros: {}, filhos: [],
    };
  }
  for (const f of content.faccoes.filter(f => !['onis', 'cacadores'].includes(f.id))) {
    v.governos[f.id] ??= { legitimidade: 65, sucessoes: 0, relacoes: {}, treguaAte: {} };
  }
  return v;
}

export function proximoPasso(content: ContentBundle, origem: string, destino: string): string | undefined {
  if (origem === destino) return origem;
  const fila = [{ id: origem, primeiro: '' }];
  const vistos = new Set([origem]);
  for (let i = 0; i < fila.length; i++) {
    const atual = fila[i];
    for (const r of content.locais.find(l => l.id === atual.id)?.rotas ?? []) {
      if (vistos.has(r.destino)) continue;
      const primeiro = atual.primeiro || r.destino;
      if (r.destino === destino) return primeiro;
      vistos.add(r.destino); fila.push({ id: r.destino, primeiro });
    }
  }
}

export function cidadeIdDoLocal(content: ContentBundle, camp: Campaign, local: string): string | undefined {
  const cidades = camp.vivo?.cidades ?? {};
  if (cidades[local]) return local;
  const fila = [local], vistos = new Set(fila);
  for (let i = 0; i < fila.length; i++) {
    for (const r of content.locais.find(l => l.id === fila[i])?.rotas ?? []) {
      if (cidades[r.destino]) return r.destino;
      if (!vistos.has(r.destino)) { vistos.add(r.destino); fila.push(r.destino); }
    }
  }
}
export function cidadeDoLocal(content: ContentBundle, camp: Campaign, local: string) {
  const id = cidadeIdDoLocal(content, camp, local);
  return id ? camp.vivo?.cidades[id] : undefined;
}

export function localEfetivo(camp: Campaign, npc: NPC, periodo: Periodo = periodoAtual(camp.calendario)): string | undefined {
  if (camp.npcState[npc.id]?.vivo === false) return;
  if ((camp.grupo ?? []).includes(npc.id)) return camp.localAtual;
  const pessoa = camp.vivo?.pessoas[npc.id];
  if (pessoa?.viagem) return; // In transit, not simultaneously at both ends.
  if (pessoa?.deslocado || pessoa?.objetivo === 'cativo') return pessoa.local;
  return npc.rotina[periodo] ?? npc.localBase;
}

export function registrarFato(camp: Campaign, entrada: Omit<FatoHistorico, 'id' | 'dia' | 'conhecimento'> & { conhecimento?: FatoHistorico['conhecimento'] }): FatoHistorico {
  const v = camp.vivo!;
  const fato: FatoHistorico = {
    ...entrada, id: `fato_${++v.sequencia}`, dia: camp.calendario.dia,
    conhecimento: entrada.conhecimento ?? (entrada.local === camp.localAtual && entrada.publico ? 'testemunhado' : 'oculto'),
  };
  v.fatos.push(fato);
  v.contadores[fato.tipo] = (v.contadores[fato.tipo] ?? 0) + 1;
  // Causal links carry their own immutable summary when old entries are compacted.
  while (v.fatos.length > 300) {
    const velho = v.fatos.shift()!;
    const ano = Math.floor(velho.dia / 365);
    let arquivo = v.arquivo.find(a => a.ano === ano);
    if (!arquivo) { arquivo = { ano, acontecimentos: 0, tipos: {} }; v.arquivo.push(arquivo); }
    arquivo.acontecimentos++; arquivo.tipos[velho.tipo] = (arquivo.tipos[velho.tipo] ?? 0) + 1;
  }
  return fato;
}

export function descobrirNoticias(content: ContentBundle, camp: Campaign): void {
  const v = camp.vivo;
  if (!v) return;
  for (const f of v.fatos) {
    if (!f.publico || f.conhecimento !== 'oculto') continue;
    if (f.local === camp.localAtual) f.conhecimento = 'confirmado';
    else if (camp.calendario.dia - f.dia >= 3 && camp.locaisVisitados.includes(f.local) && proximoPasso(content, f.local, camp.localAtual)) f.conhecimento = 'rumor';
  }
  for (const q of v.missoes) if (q.local === camp.localAtual || v.fatos.some(f => f.id === q.causa.id && f.conhecimento !== 'oculto')) q.conhecida = true;
}

export function fatosConhecidos(camp: Campaign, quantos = 12) {
  return (camp.vivo?.fatos ?? []).filter(f => f.conhecimento !== 'oculto').slice(-quantos);
}

export function biografiaCivil(camp: Campaign, npcId: string): string[] {
  return fatosConhecidos(camp, 300).filter(f => f.atores.includes(npcId)).slice(-8).map(f => `Dia ${f.dia}: ${f.texto}`);
}
