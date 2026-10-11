// ARCANUM · Ato II da trama: as duas levas (docs/BIBLIA-DA-HISTORIA.md).
//
// Abre alguns dias depois da noite dos dezoito (engine/atoI.ts), com uma carta
// de Tessel: a leva da Marca levou o filho de Cera, e a guarnição nega. O
// rastro passa por três cidades. Cada pista é um segredo que já existe
// (engine/segredos.ts): descobrir qualquer um da lista de uma cidade é achar
// a pista dela. Com pistas bastantes, o jogador escolhe um aliado; a aliança
// diz quem caça o jogador no Ato IV.
//
// Nada aqui consome RNG. As pistas não têm estado próprio: saem das flags de
// segredo, então valem para segredo descoberto antes do ato abrir.
import type { Campaign, ContentBundle } from './types';
import type { DesfechoAtoI } from './atoI';
import { registrarMarco } from './memoria';
import { registrarFato, localEfetivo } from './historiaViva';
import { npcPorId } from './elenco';
import { processarSubidaDeNivel } from './progresso';

export type PistaAtoII = {
  id: string;
  cidade: string;
  /** Onde a dica do lugar vale (cidade e arredores). */
  lugares: string[];
  /** Descobrir o segredo de qualquer uma destas pessoas é achar a pista. */
  segredos: string[];
  dica: string;
  texto: string;
};

export type AliadoAtoII = {
  id: string;
  npc: string;
  /** Quem passa a caçar o jogador (Ato IV). */
  cacam: string[];
  exigePista?: string;
  rotulo: string;
  descricao: string;
  texto: string;
};

export type ConteudoAtoII = {
  titulo: string;
  diasDepoisDoAtoI: number;
  remetente: string;
  cidadeDoRemetente: string;
  pistasParaAlianca: number;
  carta: Record<DesfechoAtoI, string> & { corpo: string };
  pistas: PistaAtoII[];
  tobin: { rotulo: string; texto: string };
  aliados: AliadoAtoII[];
};

export type EstadoAtoII = {
  aberto: number;
  contouACera?: boolean;
  alianca?: string;
  /** Quem caça o jogador por causa da aliança (Ato IV lê isto). */
  cacam?: string[];
  diaAlianca?: number;
  lidos?: string[];
};

export type AvisoAtoII = { id: string; titulo: string; texto: string };
export type AcaoAtoII = { id: string; rotulo: string; descricao: string };

const XP_PISTA = 30;
const XP_ALIANCA = 80;

export function pistasAchadas(content: ContentBundle, camp: Campaign): PistaAtoII[] {
  const a = content.atoII;
  if (!a) return [];
  return a.pistas.filter(p => p.segredos.some(id => camp.flags[`segredo.${id}`]));
}

function achou(content: ContentBundle, camp: Campaign, pista: string): boolean {
  return pistasAchadas(content, camp).some(p => p.id === pista);
}

function ajustar(camp: Campaign, npcId: string, eixo: string, delta: number): void {
  const din = camp.npcState[npcId];
  if (!din) return;
  din.eixos[eixo] = Math.max(-20, Math.min(20, (din.eixos[eixo] ?? 0) + delta));
}

function presente(content: ContentBundle, camp: Campaign, npcId: string): boolean {
  const n = npcPorId(content, camp, npcId);
  return !!n && camp.npcState[npcId]?.vivo !== false && localEfetivo(camp, n, undefined, content) === camp.localAtual;
}

/** Roda uma vez por dia, dentro do dia do mundo (engine/mundo.ts). */
export function processarDiaAtoII(content: ContentBundle, camp: Campaign): void {
  const a = content.atoII, t = camp.trama;
  if (!a || !t?.atoI?.desfecho || t.atoII) return;
  // A carta espera o jogador ler a noite dos dezoito, e mais uns dias.
  if (!(t.atoI.lidos ?? []).includes('desfecho')) return;
  if (camp.calendario.dia < (t.atoI.diaDesfecho ?? 0) + a.diasDepoisDoAtoI) return;
  t.atoII = { aberto: camp.calendario.dia };
  t.ato = Math.max(t.ato, 2);
  camp.flags['trama.atoII.aberto'] = true;
  const texto = textoDaCarta(content, camp);
  registrarMarco(camp, 'uma carta de Tessel perguntou para onde vão os meninos da Marca');
  registrarFato(camp, { tipo: 'trama_ato_ii', local: camp.localAtual, texto, atores: ['jogador', a.remetente], publico: false, conhecimento: 'testemunhado' });
  camp.cronica.push({ turno: camp.turno, texto, tipo: 'sistema' });
}

function textoDaCarta(content: ContentBundle, camp: Campaign): string {
  const a = content.atoII!;
  const d = camp.trama?.atoI?.desfecho ?? 'sozinho';
  return `${a.carta.corpo} ${a.carta[d]}`;
}

export function avisosAtoII(content: ContentBundle, camp: Campaign): AvisoAtoII[] {
  const a = content.atoII, e = camp.trama?.atoII;
  if (!a || !e) return [];
  const lidos = e.lidos ?? [];
  const out: AvisoAtoII[] = [];
  if (!lidos.includes('carta')) out.push({ id: 'carta', titulo: 'Uma carta de Tessel', texto: textoDaCarta(content, camp) });
  for (const p of pistasAchadas(content, camp)) {
    if (!lidos.includes(`pista_${p.id}`)) out.push({ id: `pista_${p.id}`, titulo: `O rastro da leva: ${p.cidade}`, texto: p.texto });
  }
  if (e.alianca && !lidos.includes('alianca')) {
    const al = a.aliados.find(x => x.id === e.alianca);
    if (al) out.push({ id: 'alianca', titulo: al.rotulo, texto: al.texto });
  }
  return out;
}

/** Ler o aviso de uma pista paga o achado (uma vez). */
export function marcarAvisoAtoII(content: ContentBundle, camp: Campaign, id: string): void {
  const e = camp.trama?.atoII;
  if (!e || (e.lidos ?? []).includes(id)) return;
  e.lidos = [...(e.lidos ?? []), id];
  if (id.startsWith('pista_')) {
    const pista = content.atoII?.pistas.find(p => `pista_${p.id}` === id);
    camp.flags[`trama.atoII.pista.${id.slice(6)}`] = true;
    if (pista) registrarMarco(camp, `o rastro da leva da Marca passa por ${pista.cidade}`);
    camp.personagem.xp += XP_PISTA;
    processarSubidaDeNivel(camp);
  }
}

export function acoesAtoII(content: ContentBundle, camp: Campaign): AcaoAtoII[] {
  const a = content.atoII, e = camp.trama?.atoII;
  if (!a || !e || e.alianca) return [];
  if (camp.combate && !camp.combate.terminado) return [];
  if (!(e.lidos ?? []).includes('carta')) return [];
  const out: AcaoAtoII[] = [];
  if (!e.contouACera && achou(content, camp, 'corveira') && presente(content, camp, a.remetente)) {
    out.push({ id: 'contar_cera', rotulo: a.tobin.rotulo, descricao: 'Ela pediu para saber. O que você achou em Corveira responde.' });
  }
  if (pistasAchadas(content, camp).length >= a.pistasParaAlianca) {
    for (const al of a.aliados) {
      if (al.exigePista && !achou(content, camp, al.exigePista)) continue;
      if (!presente(content, camp, al.npc)) continue;
      out.push({ id: `aliar_${al.id}`, rotulo: al.rotulo, descricao: al.descricao });
    }
  }
  return out;
}

export function executarAcaoAtoII(content: ContentBundle, camp: Campaign, id: string): { ok: boolean; mensagem: string } {
  const a = content.atoII, e = camp.trama?.atoII;
  if (!a || !e) return { ok: false, mensagem: 'Não há nada aberto.' };
  if (!acoesAtoII(content, camp).some(x => x.id === id)) return { ok: false, mensagem: 'Isso não dá para fazer aqui.' };
  if (id === 'contar_cera') {
    e.contouACera = true;
    ajustar(camp, a.remetente, 'confianca', 8);
    camp.flags['trama.atoII.cera_sabe'] = true;
    registrarFato(camp, { tipo: 'trama_cera_sabe', local: camp.localAtual, texto: a.tobin.texto, atores: ['jogador', a.remetente], publico: false, conhecimento: 'testemunhado' });
    return { ok: true, mensagem: a.tobin.texto };
  }
  const al = a.aliados.find(x => `aliar_${x.id}` === id)!;
  e.alianca = al.id;
  e.cacam = [...al.cacam];
  e.diaAlianca = camp.calendario.dia;
  ajustar(camp, al.npc, 'confianca', 8);
  for (const inimigo of al.cacam) {
    ajustar(camp, inimigo, 'disposicao', -10);
    ajustar(camp, inimigo, 'confianca', -8);
  }
  camp.flags[`trama.atoII.alianca.${al.id}`] = true;
  camp.flags['trama.atoII.concluido'] = true;
  camp.trama!.ato = 3;
  registrarMarco(camp, `você se aliou contra a leva da Marca: ${al.rotulo.replace(/^Aliar-se (a |à )?/, '')}`);
  registrarFato(camp, { tipo: 'trama_alianca', local: camp.localAtual, texto: al.texto, atores: ['jogador', al.npc], publico: true, conhecimento: 'testemunhado' });
  camp.personagem.xp += XP_ALIANCA;
  processarSubidaDeNivel(camp);
  return { ok: true, mensagem: al.texto };
}

export function objetivoAtoII(content: ContentBundle, camp: Campaign): string | undefined {
  const a = content.atoII, e = camp.trama?.atoII;
  if (!a || !e || e.alianca) return;
  const n = pistasAchadas(content, camp).length;
  if (n >= a.pistasParaAlianca) return `A leva da Marca: ${n} de ${a.pistas.length} rastros; dá para escolher um aliado`;
  const faltam = a.pistas.filter(p => !achou(content, camp, p.id)).map(p => p.cidade).join(', ');
  return `A leva da Marca: ${n} de ${a.pistas.length} rastros (falta ${faltam})`;
}

/** O que o narrador recebe. */
export function contextoAtoII(content: ContentBundle, camp: Campaign) {
  const a = content.atoII, e = camp.trama?.atoII;
  if (!a || !e) return undefined;
  if (e.alianca) {
    const al = a.aliados.find(x => x.id === e.alianca);
    return { titulo: a.titulo, alianca: al?.rotulo, cacamVoce: (e.cacam ?? []).map(id => npcPorId(content, camp, id)?.nome ?? id) };
  }
  const aqui = a.pistas.find(p => p.lugares.includes(camp.localAtual) && !achou(content, camp, p.id));
  return {
    titulo: a.titulo,
    situacao: objetivoAtoII(content, camp),
    rastrosAchados: pistasAchadas(content, camp).map(p => p.texto),
    // Quem sabe alguma coisa aqui, sem dizer o quê: o segredo continua delas.
    quemSabeAqui: aqui?.dica,
  };
}
