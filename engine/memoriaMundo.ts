// ARCANUM · O mundo lembra (sessão 53, Fase 8).
//
// Muita coisa que o jogador faz vira fato (registrarFato) e chega ao narrador
// como contexto, mas o jogador raramente VIA o efeito: voltava à cidade onde
// derrubou o capitão de um bando e a cena começava igual a qualquer outra.
// Aqui a engine — não a IA — escreve uma linha quando ele volta a um lugar
// onde fez algo marcante, uma vez por feito. A linha vai para a tela (fila
// de avisos, consumida pelo store antes da narração) e para o pacote do
// narrador do dia.
//
// A mesma fila recebe os ganchos do Diretor de Arcos (engine/diretor.ts).
import type { Campaign, ContentBundle } from './types';
import type { FatoHistorico } from './vivoTypes';
import { cidadeIdDoLocal } from './historiaViva';
import { registrarNaCronica } from './memoria';

export type AvisoDoMundo = { dia: number; texto: string; tipo: 'lembranca' | 'gancho'; local?: string };
export type MemoriaMundo = {
  /** Ids de fatos do jogador já lembrados ao voltar: cada feito, uma vez. */
  lembrados: string[];
  /** Linhas escritas pela engine que a tela ainda não mostrou. */
  avisos: AvisoDoMundo[];
  /** As últimas linhas, para o narrador da cena. */
  recentes: AvisoDoMundo[];
  /** Estado do Diretor de Arcos. */
  diretor: { ultimoDia: number; alvos: Record<string, number>; ganchos: number };
};

const MAX_LEMBRADOS = 300;
const MAX_AVISOS = 3;
const MAX_RECENTES = 6;

export function estadoMemoria(camp: Campaign): MemoriaMundo {
  return camp.memoriaMundo ??= { lembrados: [], avisos: [], recentes: [], diretor: { ultimoDia: -1000, alvos: {}, ganchos: 0 } };
}

/** Põe uma linha na fila da tela, na crônica persistente e nas recentes. */
export function avisar(camp: Campaign, aviso: AvisoDoMundo): void {
  const m = estadoMemoria(camp);
  m.avisos.push(aviso);
  if (m.avisos.length > MAX_AVISOS) m.avisos.splice(0, m.avisos.length - MAX_AVISOS);
  m.recentes.push(aviso);
  if (m.recentes.length > MAX_RECENTES) m.recentes.splice(0, m.recentes.length - MAX_RECENTES);
  registrarNaCronica(camp, aviso.texto, 'eco');
}

/** A tela chama antes de narrar: devolve as linhas pendentes e esvazia a fila. */
export function consumirAvisos(camp: Campaign): AvisoDoMundo[] {
  const m = camp.memoriaMundo;
  if (!m?.avisos.length) return [];
  const saida = m.avisos;
  m.avisos = [];
  return saida;
}

/** Linhas do dia para o narrador (o que a engine já disse ao jogador hoje). */
export function avisosDoDia(camp: Campaign): string[] {
  return (camp.memoriaMundo?.recentes ?? []).filter(a => a.dia === camp.calendario.dia).map(a => a.texto);
}

// Feitos que a cidade comenta, e como ela começa a comentar. O resto da
// linha é o próprio texto do fato, escrito pela engine quando aconteceu.
const MEMORAVEIS: Record<string, string> = {
  capitao_morto: 'gente que você não conhece te cumprimenta pelo nome. Ainda contam:',
  capitao_preso: 'há quem acene da porta quando você passa. Ainda contam:',
  esconderijo_tomado: 'as crianças brincam de tomar esconderijo. Ainda contam:',
  capitao_venceu: 'alguém repara em você e desvia o olho. A história que corre é outra:',
  obra_prima: 'ainda se fala do seu trabalho na bigorna.',
  missao_concluida: 'lembram do que você fez aqui.',
  missao_falhada: 'há quem se lembre da promessa que você não cumpriu.',
  caravana_entregue: 'reconhecem quem veio escoltando a caravana.',
  mediacao: 'a trégua que você costurou ainda é assunto.',
};

/** "Em Tessel", "Na Feira Coberta", "No Moinho Parado": o artigo do nome vira contração. */
export function emLocal(nome: string): string {
  const m = /^(A|O|As|Os) (.+)$/.exec(nome);
  if (!m) return `Em ${nome}`;
  return `${{ A: 'Na', O: 'No', As: 'Nas', Os: 'Nos' }[m[1] as 'A' | 'O' | 'As' | 'Os']} ${m[2]}`;
}

function doJogador(f: FatoHistorico): boolean {
  return f.publico && f.atores.includes('jogador') && f.tipo in MEMORAVEIS;
}

/**
 * Chamado quando o jogador chega a um lugar. Se houver feito dele ali (ou na
 * comunidade a que o lugar pertence) de um dia anterior, ainda não lembrado,
 * escreve a linha. Um por chegada: o mais recente.
 */
export function lembrarAoChegar(content: ContentBundle, camp: Campaign, destino: string): string | undefined {
  const v = camp.vivo;
  if (!v) return undefined;
  const m = estadoMemoria(camp);
  const cidade = cidadeIdDoLocal(content, camp, destino);
  const aqui = (local: string) => local === destino || (!!cidade && cidadeIdDoLocal(content, camp, local) === cidade);
  const feito = [...v.fatos].reverse().find(f => doJogador(f) && f.dia < camp.calendario.dia && !m.lembrados.includes(f.id) && aqui(f.local));
  if (!feito) return undefined;
  m.lembrados.push(feito.id);
  if (m.lembrados.length > MAX_LEMBRADOS) m.lembrados.splice(0, m.lembrados.length - MAX_LEMBRADOS);
  const nome = content.locais.find(l => l.id === (cidade ?? destino))?.nome ?? destino;
  const texto = `${emLocal(nome)}, ${MEMORAVEIS[feito.tipo]} ${feito.texto}`;
  avisar(camp, { dia: camp.calendario.dia, texto, tipo: 'lembranca', local: destino });
  return texto;
}

/** Os fatos em que o jogador foi ator, em ordem, para a Crônica. */
export function feitosDoJogador(content: ContentBundle, camp: Campaign, limite = 15): { dia: number; local: string; texto: string }[] {
  // Quem fez sabe o que fez: o conhecimento do fato (oculto, rumor) é do mundo.
  const fatos = (camp.vivo?.fatos ?? []).filter(f => f.atores.includes('jogador'));
  return fatos.slice(-limite).map(f => ({
    dia: f.dia,
    local: content.locais.find(l => l.id === f.local)?.nome ?? f.local,
    texto: f.texto,
  }));
}
