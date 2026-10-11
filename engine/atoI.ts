// ARCANUM · Ato I da trama: o forasteiro (docs/BIBLIA-DA-HISTORIA.md).
//
// No primeiro dia que o jogador amanhece no vale, uma mãe o procura: o filho
// faz dezoito anos em sete dias. A engine guarda onde o menino está e decide,
// ao processar o dia seguinte à noite dos dezoito, o que aconteceu:
//
// - na Toca do Juncal: a Toca segura, o menino vive, preso embaixo do charco;
// - entregue à Ordem: as irmãs o cantam até a ponte;
// - com o jogador, no vale: a vigília. O menino entra no rio, e a água
//   empurra o jogador de volta (flag `trama.agua_recusou`, que o Ato III usa);
// - com o jogador, fora do vale: ele volta andando e morre no caminho
//   (flag `trama.leva_alcanca_longe`);
// - em casa: vai sozinho.
//
// O menino não é NPC do elenco: tem dezessete anos, e o elenco só tem adultos
// (GDD §25). Ele vive no estado do ato: casa, com o jogador, na Toca ou na
// capela. Não aparece em "presentes"; o narrador o recebe por `contextoAtoI`.
//
// Nada aqui consome o RNG da campanha: o desfecho depende só do que o
// jogador fez. O conteúdo (nomes, lugares, textos) vem de `content.atoI`;
// cenário sem esse bloco não tem Ato I.
import type { Campaign, ContentBundle, NPC } from './types';
import { registrarMarco } from './memoria';
import { registrarFato } from './historiaViva';
import { revelarSegredo } from './segredos';
import { processarSubidaDeNivel } from './progresso';
import { npcPorId } from './elenco';

export type DesfechoAtoI = 'toca' | 'ordem' | 'vigilia' | 'estrada' | 'sozinho';

export type ConteudoAtoI = {
  regiao: string;
  mae: string;
  menino: { nome: string; casa: string; retrato: string };
  /** Quem leva o menino para dentro da Toca (o segredo dela abre o lugar). */
  guia: string;
  /** Quem ouve a vigília da ponte. */
  testemunha: string;
  capela: string;
  aldeia: string;
  toca: string;
  diasAteANoite: number;
  titulo: string;
  textos: {
    abertura: string;
    levar: string;
    devolver: string;
    ordem: string;
    toca: string;
    desfechos: Record<DesfechoAtoI, string>;
    /** Uma linha por lugar, para o narrador, enquanto o ato está aberto. */
    pistas: Record<string, string>;
  };
};

export type EstadoAtoI = {
  /** Dia em que a mãe procurou o jogador. */
  aberto: number;
  /** Dia da noite dos dezoito. O desfecho sai ao processar o dia seguinte. */
  noite: number;
  comJogador?: boolean;
  destino?: 'toca' | 'ordem';
  desfecho?: DesfechoAtoI;
  diaDesfecho?: number;
  /** Textos que o jogador já leu no cartão do ato (o pedido da mãe, o desfecho). */
  lidos?: AvisoAtoI['id'][];
};

export type AvisoAtoI = { id: 'abertura' | 'desfecho'; titulo: string; texto: string };

export type TramaState = { ato: number; atoI?: EstadoAtoI; atoII?: import('./atoII').EstadoAtoII };

export type AcaoAtoI = { id: 'levar' | 'devolver' | 'ordem' | 'toca'; rotulo: string; descricao: string };

const XP_DESFECHO: Record<DesfechoAtoI, number> = { toca: 60, ordem: 40, vigilia: 60, estrada: 40, sozinho: 15 };

function regiaoDe(content: ContentBundle, local: string): string | undefined {
  return content.locais.find(l => l.id === local)?.regiao;
}

function nomeDe(content: ContentBundle, camp: Campaign, id: string, padrao: string): string {
  const n: NPC | undefined = npcPorId(content, camp, id);
  return n?.nome ?? padrao;
}

function ajustar(camp: Campaign, npcId: string, eixo: string, delta: number): void {
  const din = camp.npcState[npcId];
  if (!din) return;
  din.eixos[eixo] = Math.max(-20, Math.min(20, (din.eixos[eixo] ?? 0) + delta));
}

function reputar(camp: Campaign, faccao: string, delta: number): void {
  camp.reputacao[faccao] = (camp.reputacao[faccao] ?? 0) + delta;
}

export function estadoAtoI(camp: Campaign): EstadoAtoI | undefined {
  return camp.trama?.atoI;
}

/** Aberto e sem desfecho. */
export function atoIEmCurso(camp: Campaign): boolean {
  const e = camp.trama?.atoI;
  return !!e && !e.desfecho;
}

/** Onde o menino está agora, ou undefined depois que a Leva o levou. */
export function ondeEstaOMenino(content: ContentBundle, camp: Campaign): string | undefined {
  const a = content.atoI, e = camp.trama?.atoI;
  if (!a || !e) return;
  if (e.desfecho) return e.desfecho === 'toca' ? a.toca : undefined;
  if (e.destino === 'toca') return a.toca;
  if (e.destino === 'ordem') return a.capela;
  return e.comJogador ? camp.localAtual : a.menino.casa;
}

/** Roda uma vez por dia, dentro do dia do mundo (engine/mundo.ts). */
export function processarDiaAtoI(content: ContentBundle, camp: Campaign): void {
  const a = content.atoI;
  if (!a || !camp.vivo) return;
  if (camp.familia && !camp.familia.prologoConcluido) return;
  const dia = camp.calendario.dia;
  const e = camp.trama?.atoI;
  if (!e) {
    // Abre no primeiro dia em que o jogador amanhece no vale.
    if (dia < 1 || regiaoDe(content, camp.localAtual) !== a.regiao) return;
    if (camp.npcState[a.mae]?.vivo === false) return;
    camp.trama = { ato: 1, atoI: { aberto: dia, noite: dia + a.diasAteANoite } };
    camp.flags['trama.atoI.aberto'] = true;
    registrarMarco(camp, `${nomeDe(content, camp, a.mae, 'uma mãe')} pediu ajuda: o filho faz dezoito anos em ${a.diasAteANoite} dias`);
    registrarFato(camp, { tipo: 'trama_ato_i', local: camp.localAtual, texto: a.textos.abertura, atores: ['jogador', a.mae], publico: false, conhecimento: 'testemunhado' });
    camp.cronica.push({ turno: camp.turno, texto: a.textos.abertura, tipo: 'sistema' });
    return;
  }
  if (e.desfecho || dia <= e.noite) return;
  resolverNoite(content, camp, e);
}

function resolverNoite(content: ContentBundle, camp: Campaign, e: EstadoAtoI): void {
  const a = content.atoI!;
  const longe = regiaoDe(content, camp.localAtual) !== a.regiao;
  const desfecho: DesfechoAtoI = e.destino ?? (e.comJogador ? (longe ? 'estrada' : 'vigilia') : 'sozinho');
  e.desfecho = desfecho;
  e.diaDesfecho = camp.calendario.dia;
  e.comJogador = false;

  if (desfecho === 'toca') {
    ajustar(camp, a.mae, 'confianca', 10);
    camp.flags['trama.menino_na_toca'] = true;
  } else if (desfecho === 'vigilia') {
    camp.flags['trama.agua_recusou'] = true;
    ajustar(camp, a.mae, 'confianca', 5);
    ajustar(camp, a.testemunha, 'confianca', 4);
    reputar(camp, 'vila', 3);
  } else if (desfecho === 'estrada') {
    camp.flags['trama.leva_alcanca_longe'] = true;
    ajustar(camp, a.mae, 'confianca', -5);
  } else if (desfecho === 'sozinho') {
    ajustar(camp, a.mae, 'disposicao', -5);
  }
  camp.flags[`trama.atoI.${desfecho}`] = true;
  camp.flags['trama.atoI.concluido'] = true;
  camp.trama!.ato = 2;

  const texto = a.textos.desfechos[desfecho];
  const testemunhou = desfecho === 'vigilia' || desfecho === 'estrada';
  registrarFato(camp, {
    tipo: 'trama_ato_i_desfecho', local: desfecho === 'toca' ? a.toca : desfecho === 'estrada' ? camp.localAtual : 'ponte',
    texto, atores: [a.mae, ...(testemunhou ? ['jogador'] : [])],
    publico: desfecho === 'ordem' || desfecho === 'sozinho', conhecimento: testemunhou ? 'testemunhado' : 'rumor',
  });
  camp.cronica.push({ turno: camp.turno, texto, tipo: 'sistema' });
  registrarMarco(camp, `a noite dos dezoito de ${a.menino.nome} passou`);
  camp.personagem.xp += XP_DESFECHO[desfecho];
  processarSubidaDeNivel(camp);
}

/** O que o jogador pode fazer pelo menino aqui e agora. */
export function acoesAtoI(content: ContentBundle, camp: Campaign): AcaoAtoI[] {
  const a = content.atoI, e = camp.trama?.atoI;
  if (!a || !e || e.desfecho || e.destino) return [];
  if (camp.combate && !camp.combate.terminado) return [];
  const nome = a.menino.nome;
  if (!e.comJogador) {
    return camp.localAtual === a.menino.casa
      ? [{ id: 'levar', rotulo: `Levar ${nome} com você`, descricao: 'Ele passa a andar com você até a noite dos dezoito.' }]
      : [];
  }
  const out: AcaoAtoI[] = [];
  if (camp.localAtual === a.aldeia) {
    out.push({ id: 'toca', rotulo: `Pedir que escondam ${nome} na Toca`, descricao: 'O Juncal tem um lugar embaixo da água. Dizem que quem entra não sai.' });
  }
  if (camp.localAtual === a.capela) {
    out.push({ id: 'ordem', rotulo: `Entregar ${nome} à Ordem`, descricao: 'A Ordem acompanha os meninos até a ponte. A mãe dele não vai perdoar.' });
  }
  if (regiaoDe(content, camp.localAtual) === a.regiao) {
    out.push({ id: 'devolver', rotulo: `Deixar ${nome} com a mãe`, descricao: 'Ele volta para casa e passa a noite lá.' });
  }
  return out;
}

export function executarAcaoAtoI(content: ContentBundle, camp: Campaign, id: AcaoAtoI['id']): { ok: boolean; mensagem: string } {
  const a = content.atoI, e = camp.trama?.atoI;
  if (!a || !e) return { ok: false, mensagem: 'Não há nada aberto.' };
  if (!acoesAtoI(content, camp).some(x => x.id === id)) return { ok: false, mensagem: 'Isso não dá para fazer aqui.' };
  if (id === 'levar') {
    e.comJogador = true;
    camp.flags['trama.atoI.levou'] = true;
    return { ok: true, mensagem: a.textos.levar };
  }
  if (id === 'devolver') {
    e.comJogador = false;
    return { ok: true, mensagem: a.textos.devolver };
  }
  e.comJogador = false;
  if (id === 'ordem') {
    e.destino = 'ordem';
    reputar(camp, 'igreja', 8);
    reputar(camp, 'vila', -5);
    ajustar(camp, a.mae, 'confianca', -15);
    ajustar(camp, a.mae, 'disposicao', -10);
    registrarFato(camp, { tipo: 'trama_entregou_a_ordem', local: a.capela, texto: a.textos.ordem, atores: ['jogador'], publico: true, conhecimento: 'testemunhado' });
    return { ok: true, mensagem: a.textos.ordem };
  }
  // toca
  e.destino = 'toca';
  // Orla só ensina o caminho a quem chega com um menino do vale: é o segredo
  // dela, e a consequência abre a Toca no mapa.
  revelarSegredo(content, camp, a.guia);
  ajustar(camp, a.guia, 'confianca', 3);
  return { ok: true, mensagem: a.textos.toca };
}

/**
 * O que o jogador ainda não leu. O dia do ato roda dentro do dia do mundo,
 * que qualquer ação pode avançar; o cartão da tela de jogo garante que o
 * pedido da mãe e a noite dos dezoito sejam lidos, com ou sem IA.
 */
export function avisosAtoI(content: ContentBundle, camp: Campaign): AvisoAtoI[] {
  const a = content.atoI, e = camp.trama?.atoI;
  if (!a || !e) return [];
  const lidos = e.lidos ?? [];
  const out: AvisoAtoI[] = [];
  if (!lidos.includes('abertura')) out.push({ id: 'abertura', titulo: a.titulo, texto: a.textos.abertura });
  if (e.desfecho && !lidos.includes('desfecho')) out.push({ id: 'desfecho', titulo: `A noite dos dezoito de ${a.menino.nome}`, texto: a.textos.desfechos[e.desfecho] });
  return out;
}

export function marcarAvisoAtoI(camp: Campaign, id: AvisoAtoI['id']): void {
  const e = camp.trama?.atoI;
  if (!e) return;
  e.lidos = [...new Set([...(e.lidos ?? []), id])];
}

/** Uma linha para o "o que está aberto". */
export function objetivoAtoI(content: ContentBundle, camp: Campaign): string | undefined {
  const a = content.atoI, e = camp.trama?.atoI;
  if (!a || !e || e.desfecho) return;
  const faltam = e.noite - camp.calendario.dia;
  const quando = faltam <= 0 ? 'é esta noite' : faltam === 1 ? 'é amanhã à noite' : `faltam ${faltam} dias`;
  const onde = e.destino === 'toca' ? ', escondido na Toca' : e.destino === 'ordem' ? ', com a Ordem' : e.comJogador ? ', com você' : '';
  return `${a.menino.nome} faz dezoito anos: ${quando}${onde}`;
}

/** O que o narrador recebe. Nunca fala do contrato (regra da bíblia). */
export function contextoAtoI(content: ContentBundle, camp: Campaign) {
  const a = content.atoI, e = camp.trama?.atoI;
  if (!a || !e) return undefined;
  if (e.desfecho) {
    if (camp.calendario.dia - (e.diaDesfecho ?? 0) > 10) return undefined;
    return { titulo: a.titulo, aconteceu: a.textos.desfechos[e.desfecho] };
  }
  const aqui = ondeEstaOMenino(content, camp) === camp.localAtual;
  return {
    titulo: a.titulo,
    situacao: objetivoAtoI(content, camp),
    menino: a.menino.nome,
    meninoComVoce: !!e.comJogador,
    // Retrato só quando ele está na cena: é gente, não ficha.
    meninoAqui: aqui ? a.menino.retrato : undefined,
    mae: nomeDe(content, camp, a.mae, 'a mãe'),
    pistaDoLugar: a.textos.pistas[camp.localAtual],
  };
}
