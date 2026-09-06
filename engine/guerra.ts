// Guerra persistente: recursos das facções, frente física e baixas reais.
// A reputação do protagonista registra participação; não decide exércitos distantes.
import type { Campaign, ContentBundle } from './types';
import type { RngState } from './rng';
import { nextFloat, nextInt, pick } from './rng';
import { registrarMarco } from './memoria';
import { todosNpcs } from './elenco';
import { registrarMorteFamiliar } from './familia';
import { registrarResultadoPolitico } from './politica';
import { localEfetivo } from './historiaViva';

export type ResultadoGuerra = 'vitoriaA' | 'vitoriaB' | 'impasse';
export type FaccaoMundo = { forca: number; recursos: number; moral: number; baixas: number };

export function resolverGuerraDeFundo(rng: RngState, poderA: number, poderB: number): ResultadoGuerra {
  const total = Math.max(1, poderA + poderB);
  const chanceA = Math.max(.15, Math.min(.75, poderA / total));
  const r = nextFloat(rng);
  if (r < chanceA * .85) return 'vitoriaA';
  if (r > chanceA + (1 - chanceA) * .15) return 'vitoriaB';
  return 'impasse';
}

const CHANCE_GUERRA_DIARIA = .012;
const COOLDOWN_DIAS = 40;

function estadosFaccoes(content: ContentBundle, camp: Campaign): Record<string, FaccaoMundo> {
  const m = camp.mundo!;
  m.faccoes ??= {};
  for (const f of content.faccoes) {
    const membros = todosNpcs(content, camp).filter(n => n.faccaoId === f.id && camp.npcState[n.id]?.vivo).length;
    m.faccoes[f.id] ??= { forca: 30 + membros * 5, recursos: 60 + membros * 4, moral: 60, baixas: 0 };
  }
  return m.faccoes;
}

function localDeGuerra(content: ContentBundle, camp: Campaign, a: string, b: string): string {
  const ocupados = todosNpcs(content, camp).filter(n => [a, b].includes(n.faccaoId));
  const candidatos = ocupados.map(n => n.localBase).filter(id => !!camp.continuidade?.locais[id]);
  const todos = Object.keys(camp.continuidade?.locais ?? {});
  return pick(camp.rng, candidatos.length ? candidatos : todos.length ? todos : [camp.localAtual]);
}

function causarBaixa(content: ContentBundle, camp: Campaign, faccao: string, local: string): void {
  const candidatos = todosNpcs(content, camp).filter(n =>
    n.faccaoId === faccao && localEfetivo(camp, n) === local && camp.npcState[n.id]?.vivo && !(camp.grupo ?? []).includes(n.id));
  if (!candidatos.length || nextFloat(camp.rng) >= .08) return;
  const vitima = pick(camp.rng, candidatos);
  camp.npcState[vitima.id].vivo = false;
  registrarMorteFamiliar(camp, vitima.id);
  registrarMarco(camp, `dia ${camp.calendario.dia}: ${vitima.nome} morreu na frente de ${content.locais.find(l => l.id === local)?.nome ?? local}.`);
}

function resolverFim(content: ContentBundle, camp: Campaign): void {
  const m = camp.mundo!;
  const g = m.guerraAtiva!;
  const faccoes = estadosFaccoes(content, camp);
  const fa = faccoes[g.a], fb = faccoes[g.b];
  const nomeA = content.faccoes.find(f => f.id === g.a)?.nome ?? g.a;
  const nomeB = content.faccoes.find(f => f.id === g.b)?.nome ?? g.b;
  const poderA = Math.max(1, fa.forca + fa.moral / 2 + (g.impulsoA ?? 0));
  const poderB = Math.max(1, fb.forca + fb.moral / 2 + (g.impulsoB ?? 0));
  const resultado = resolverGuerraDeFundo(camp.rng, poderA, poderB);
  const localNome = content.locais.find(l => l.id === g.local)?.nome ?? g.local;
  if (resultado === 'vitoriaA') {
    fa.moral = Math.min(100, fa.moral + 12); fb.moral = Math.max(0, fb.moral - 15); fb.forca = Math.max(5, fb.forca - 8);
    registrarMarco(camp, `dia ${camp.calendario.dia}: ${nomeA} venceu ${nomeB} na disputa por ${localNome}.`);
  } else if (resultado === 'vitoriaB') {
    fb.moral = Math.min(100, fb.moral + 12); fa.moral = Math.max(0, fa.moral - 15); fa.forca = Math.max(5, fa.forca - 8);
    registrarMarco(camp, `dia ${camp.calendario.dia}: ${nomeB} venceu ${nomeA} na disputa por ${localNome}.`);
  } else {
    fa.moral = Math.max(0, fa.moral - 6); fb.moral = Math.max(0, fb.moral - 6);
    registrarMarco(camp, `dia ${camp.calendario.dia}: a disputa entre ${nomeA} e ${nomeB} terminou em impasse em ${localNome}.`);
  }
  if (g.apoiou) camp.reputacao[g.apoiou] = (camp.reputacao[g.apoiou] ?? 0) + 6;
  registrarResultadoPolitico(camp, g.local!, g.a, g.b, resultado === 'vitoriaA' ? g.a : resultado === 'vitoriaB' ? g.b : undefined);
  m.guerraAtiva = undefined;
  m.proximaGuerra = camp.calendario.dia + COOLDOWN_DIAS;
}

export function processarGuerrasDeFundo(content: ContentBundle, camp: Campaign): void {
  const m = camp.mundo;
  if (!m) return;
  const pares = (content.rivalidadesFaccoes ?? []).filter(([a, b]) => ![a, b].some(id => ['onis', 'cacadores'].includes(id)));
  if (!pares.length) return;
  const faccoes = estadosFaccoes(content, camp);
  const hoje = camp.calendario.dia;
  const g = m.guerraAtiva;
  if (g) {
    g.local ??= localDeGuerra(content, camp, g.a, g.b);
    g.impulsoA ??= 0; g.impulsoB ??= 0;
    const a = faccoes[g.a], b = faccoes[g.b];
    const perdaA = nextInt(camp.rng, 1, 4), perdaB = nextInt(camp.rng, 1, 4);
    a.recursos = Math.max(0, a.recursos - perdaA); b.recursos = Math.max(0, b.recursos - perdaB);
    a.baixas += perdaA; b.baixas += perdaB;
    g.impulsoA += nextInt(camp.rng, -2, 3); g.impulsoB += nextInt(camp.rng, -2, 3);
    if (g.diasRestantes % 3 === 0) {
      const lugar = g.local && camp.continuidade?.locais[g.local];
      if (lugar) { lugar.integridade = Math.max(0, lugar.integridade - 3); lugar.populacao = Math.max(0, lugar.populacao - 1); }
      causarBaixa(content, camp, nextFloat(camp.rng) < .5 ? g.a : g.b, g.local!);
    }
    g.diasRestantes--;
    if (g.diasRestantes <= 0 || a.recursos <= 0 || b.recursos <= 0) resolverFim(content, camp);
    return;
  }
  if (camp.vivo) return; // Diplomacy now owns declarations; this module resolves the front.
  if ((m.proximaGuerra ?? 0) > hoje || nextFloat(camp.rng) >= CHANCE_GUERRA_DIARIA) return;
  const [a, b] = pick(camp.rng, pares);
  const local = localDeGuerra(content, camp, a, b);
  m.guerraAtiva = { a, b, local, diasRestantes: nextInt(camp.rng, 10, 25), impulsoA: 0, impulsoB: 0 };
  registrarMarco(camp, `dia ${hoje}: o conflito entre ${content.faccoes.find(f => f.id === a)?.nome} e ${content.faccoes.find(f => f.id === b)?.nome} chegou a ${content.locais.find(l => l.id === local)?.nome}.`);
}

export function intervirNaGuerra(content: ContentBundle, camp: Campaign, faccao: string): { ok: boolean; motivo?: string } {
  const g = camp.mundo?.guerraAtiva;
  if (!g || ![g.a, g.b].includes(faccao)) return { ok: false, motivo: 'essa facção não participa do conflito atual' };
  if (g.local !== camp.localAtual) return { ok: false, motivo: 'você precisa alcançar a frente do conflito' };
  if (g.apoiou) return { ok: false, motivo: 'sua participação nesta guerra já foi decidida' };
  const impacto = 5 + camp.personagem.nivel * 2;
  if (faccao === g.a) g.impulsoA = (g.impulsoA ?? 0) + impacto;
  else g.impulsoB = (g.impulsoB ?? 0) + impacto;
  g.apoiou = faccao;
  camp.personagem.recursos.vida = Math.max(1, camp.personagem.recursos.vida - nextInt(camp.rng, 2, 9));
  registrarMarco(camp, `dia ${camp.calendario.dia}: você entrou na frente de ${content.faccoes.find(f => f.id === faccao)?.nome}.`);
  return { ok: true };
}

export function comoEstaAGuerra(content: ContentBundle, camp: Campaign): string | undefined {
  const g = camp.mundo?.guerraAtiva;
  if (!g) return;
  const a = content.faccoes.find(f => f.id === g.a)?.nome ?? g.a;
  const b = content.faccoes.find(f => f.id === g.b)?.nome ?? g.b;
  const local = content.locais.find(l => l.id === g.local)?.nome ?? g.local;
  return `${a} e ${b} disputam ${local}; restam cerca de ${g.diasRestantes} dias`;
}
