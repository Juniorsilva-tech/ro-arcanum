// ARCANUM · Edifícios regionais (sessão 52, Fase 6).
//
// Cada cidade grande tem um edifício que nenhuma outra tem, declarado no
// conteúdo (content/vaelhorn/edificiosRegionais.ts). Aqui fica só a regra de
// cada efeito — o cenário diz qual cidade tem o quê e quanto.
//
// Um edifício regional funciona enquanto a cidade tiver gente e estrutura
// (integridade acima de 20, a mesma régua da reposição do mercado). Cidade
// arrasada não tem fundição acesa nem barca no mar.
//
// Nenhum efeito consome o RNG: tudo aqui é contínuo ou por calendário, para
// não mudar a sequência de sorteios de quem já tinha save.
import type { Campaign, ContentBundle, EdificioRegional } from './types';
import type { CidadeViva, TipoEdificio } from './vivoTypes';
import { registrarFato } from './historiaViva';
import { estadoBandos, encerrarBando, temBandos } from './bandos';

/** Teto comum dos edifícios de uma cidade sem declaração. */
export const TETO_EDIFICIO_PADRAO = 5;
/** Estoque máximo de item não comum numa loja sem bazar. */
export const TETO_RAROS_PADRAO = 2;
/** Fertilidade da lavoura na seca, sem cisterna. */
export const FERTILIDADE_NA_SECA = 0.15;

export function edificioRegionalDe(content: ContentBundle, cidadeId: string | undefined): EdificioRegional | undefined {
  if (!cidadeId) return undefined;
  return content.edificiosRegionais?.find(e => e.cidade === cidadeId);
}

/** O edifício existe e a cidade tem gente e estrutura para mantê-lo. */
export function edificioRegionalAtivo(content: ContentBundle, camp: Campaign, cidadeId: string | undefined): EdificioRegional | undefined {
  const e = edificioRegionalDe(content, cidadeId);
  if (!e) return undefined;
  const povo = camp.continuidade?.locais[e.cidade];
  if (!povo || povo.populacao <= 0 || povo.integridade <= 20) return undefined;
  return e;
}

/** Até que nível um edifício comum pode subir nesta cidade. */
export function tetoDoEdificio(content: ContentBundle | undefined, cidadeId: string, tipo: TipoEdificio): number {
  const base = content?.tetoEdificios?.[cidadeId] ?? TETO_EDIFICIO_PADRAO;
  if (tipo !== 'muralha' || !content) return base;
  return Math.max(base, edificioRegionalDe(content, cidadeId)?.efeitos.tetoMuralha ?? 0);
}

export function fertilidadeNaSeca(content: ContentBundle, camp: Campaign, cidadeId: string): number {
  return edificioRegionalAtivo(content, camp, cidadeId)?.efeitos.fertilidadeNaSeca ?? FERTILIDADE_NA_SECA;
}

export function tetoDeRaros(content: ContentBundle, camp: Campaign, cidadeId: string): number {
  return edificioRegionalAtivo(content, camp, cidadeId)?.efeitos.tetoRaros ?? TETO_RAROS_PADRAO;
}

/** Multiplicador da chance de emboscada de caravana que parte da cidade. */
export function fatorAtaqueCaravana(content: ContentBundle, camp: Campaign, origem: string): number {
  return edificioRegionalAtivo(content, camp, origem)?.efeitos.fatorAtaqueCaravana ?? 1;
}

/**
 * A forja da cidade onde o jogador está, se houver. Só no próprio lugar da
 * cidade (não nos arredores): a fundição fica em Corveira, não na boca da
 * mina.
 */
export function forjaDaCidade(content: ContentBundle, camp: Campaign): EdificioRegional | undefined {
  const e = edificioRegionalAtivo(content, camp, camp.localAtual);
  return e?.efeitos.forja ? e : undefined;
}

/**
 * Efeitos diários, chamados dentro de processarCidades para cada cidade:
 * comida e materiais entram antes de a fome ser medida; a ronda sai por
 * calendário.
 */
export function aplicarEdificioRegional(content: ContentBundle, camp: Campaign, cidadeId: string, c: CidadeViva, guerra: boolean): void {
  const e = edificioRegionalAtivo(content, camp, cidadeId);
  if (!e) return;
  const v = camp.vivo!;
  const ef = e.efeitos;
  if (ef.comidaPorDia && !guerra) {
    c.comida = Math.min(600, c.comida + ef.comidaPorDia);
    v.contadores.comidaRegional = (v.contadores.comidaRegional ?? 0) + ef.comidaPorDia;
  }
  if (ef.materiaisPorDia && !guerra) c.materiais = Math.min(250, c.materiais + ef.materiaisPorDia);
  if (ef.patrulhaCadaDias && temBandos(content) && camp.calendario.dia > 0 && camp.calendario.dia % ef.patrulhaCadaDias === 0) {
    rondar(content, camp, e);
  }
}

function rondar(content: ContentBundle, camp: Campaign, e: EdificioRegional): void {
  const regiao = content.locais.find(l => l.id === e.cidade)?.regiao;
  const bando = Object.values(estadoBandos(content, camp).bandos)
    .filter(b => b.estado !== 'destruido' && b.membros > 0 && b.regiao === regiao)
    .sort((a, b) => b.membros - a.membros)[0];
  if (!bando) return;
  bando.membros -= 1;
  camp.vivo!.contadores.rondasRegionais = (camp.vivo!.contadores.rondasRegionais ?? 0) + 1;
  const nome = content.locais.find(l => l.id === e.cidade)?.nome ?? e.cidade;
  registrarFato(camp, {
    tipo: 'ronda_guarnicao', local: bando.esconderijo, publico: true, atores: e.responsavel ? [e.responsavel] : [],
    texto: `A ronda da ${e.nome} de ${nome} voltou da estrada com um salteador preso. É um a menos para ${bando.nome}.`,
  });
  if (bando.membros <= 0) encerrarBando(camp, bando, `${bando.nome} acabou: a ronda de ${nome} levou o último.`);
}

/** Uma linha para a tela e para o narrador. */
export function descreverEdificioRegional(content: ContentBundle, camp: Campaign, cidadeId: string): string | undefined {
  const e = edificioRegionalDe(content, cidadeId);
  if (!e) return undefined;
  const ativo = !!edificioRegionalAtivo(content, camp, cidadeId);
  return `${e.nome}: ${ativo ? e.efeito : 'parado enquanto a cidade não se reerguer.'}`;
}
