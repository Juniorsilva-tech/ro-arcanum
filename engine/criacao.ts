// ARCANUM · Técnica própria, a partir de princípios.
//
// A fusão de escolas (engine/fusao.ts) cria uma arte só de nome: sem
// `tecnica`, ela não faz nada em combate. Aqui o jogador que já domina o aço
// inventa um golpe dele escolhendo, de um catálogo fechado:
// - o PRINCÍPIO (corte, precisão, área, guarda, esquiva) — o que o golpe faz;
// - a FORMA (rápida, equilibrada, pesada) — o preço em tempo e fôlego.
// A ENGINE calcula a potência pelas técnicas que ele já conhece e pela
// maestria, com teto: nunca passa da melhor técnica dele por mais de 3, nem de
// 26 (a Nona Forma da Chama tem 24). A IA não decide nada disso.
// Divide o limite de três criações por vida com a fusão.
import type { Arte, Campaign, ContentBundle } from './types';
import type { TecnicaCombate } from './kimetsuTypes';
import { maestriaDe } from './aptidao';
import { artesConhecidasResolvidas, LIMITE_FUSOES } from './fusao';
import { registrarMarco } from './memoria';
import { registrarFato } from './historiaViva';
import { avancarPeriodos } from './time';
import { avancarMundo } from './mundo';
import { crescerImpulsos } from './impulsos';
import { afamarNome } from './linhagem';

export type Principio = 'corte' | 'precisao' | 'area' | 'guarda' | 'esquiva';
export type Forma = 'rapida' | 'equilibrada' | 'pesada';

export const PRINCIPIOS: Record<Principio, string> = {
  corte: 'um golpe que abre a carne',
  precisao: 'um golpe que encontra a fresta',
  area: 'um arco que pega mais de um',
  guarda: 'uma defesa que para o próximo golpe',
  esquiva: 'um passo que tira o corpo da linha',
};
export const FORMAS: Record<Forma, { nome: string; recarga: number; mult: number; custo: number }> = {
  rapida: { nome: 'rápida', recarga: 1, mult: 0.8, custo: -1 },
  equilibrada: { nome: 'equilibrada', recarga: 2, mult: 1, custo: 0 },
  pesada: { nome: 'pesada', recarga: 3, mult: 1.25, custo: 2 },
};

export const MAESTRIA_PARA_CRIAR = 40;
export const TECNICAS_PARA_CRIAR = 2;
export const TETO_POTENCIA = 26;
const PERIODOS_PARA_CRIAR = 12;

function tecnicasConhecidas(content: ContentBundle, camp: Campaign): TecnicaCombate[] {
  return artesConhecidasResolvidas(content, camp).map((a) => a.tecnica).filter((t): t is TecnicaCombate => !!t);
}

export function podeCriarTecnica(content: ContentBundle, camp: Campaign): { pode: boolean; motivo?: string } {
  const p = camp.personagem;
  if ((p.fusoesFeitas ?? 0) >= LIMITE_FUSOES) return { pode: false, motivo: `você já criou ${LIMITE_FUSOES} coisas suas nesta vida` };
  if (maestriaDe(camp, 'espada') < MAESTRIA_PARA_CRIAR) return { pode: false, motivo: `precisa de maestria ${MAESTRIA_PARA_CRIAR} no aço` };
  if (tecnicasConhecidas(content, camp).length < TECNICAS_PARA_CRIAR) return { pode: false, motivo: `precisa conhecer ${TECNICAS_PARA_CRIAR} técnicas de combate antes de inventar a sua` };
  return { pode: true };
}

/** A técnica que sairia, sem criá-la — a tela mostra antes de o jogador decidir. */
export function preverTecnica(content: ContentBundle, camp: Campaign, principio: Principio, forma: Forma): { tecnica: TecnicaCombate; custo: number } {
  const conhecidas = tecnicasConhecidas(content, camp);
  const comPotencia = conhecidas.filter((t) => t.potencia > 0);
  const melhor = Math.max(0, ...comPotencia.map((t) => t.potencia));
  const media = comPotencia.length ? comPotencia.reduce((s, t) => s + t.potencia, 0) / comPotencia.length : 8;
  const f = FORMAS[forma];
  const bruta = media * (1 + maestriaDe(camp, 'espada') / 200) * f.mult;
  const potencia = principio === 'guarda' ? 0 : Math.round(Math.min(TETO_POTENCIA, melhor + 3, bruta));
  const tecnica: TecnicaCombate = {
    estilo: 'proprio',
    modo: principio,
    potencia,
    golpes: 1,
    nivelMinimo: 1,
    recarga: f.recarga,
    descricaoRegra: `${PRINCIPIOS[principio]}, na forma ${f.nome}`,
  };
  const custo = Math.max(2, Math.round((principio === 'guarda' ? 12 : potencia) / 4) + f.custo);
  return { tecnica, custo };
}

export function criarTecnica(
  content: ContentBundle,
  camp: Campaign,
  nome: string,
  principio: Principio,
  forma: Forma,
): { ok: boolean; motivo?: string; arte?: Arte } {
  const pode = podeCriarTecnica(content, camp);
  if (!pode.pode) return { ok: false, motivo: pode.motivo };
  const nomeFinal = nome.trim();
  if (nomeFinal.length < 3) return { ok: false, motivo: 'dê um nome à técnica' };
  const { tecnica, custo } = preverTecnica(content, camp, principio, forma);
  const p = camp.personagem;
  const arte: Arte = {
    id: `criada_${nomeFinal.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${camp.turno}`,
    nome: nomeFinal,
    escola: 'Técnica',
    grau: tecnica.potencia >= 18 ? 'rara' : tecnica.potencia >= 11 ? 'notavel' : 'comum',
    custo: { recurso: 'vigor', valor: custo },
    efeito: `Técnica criada por ${p.nome}: ${tecnica.descricaoRegra}.`,
    origem: 'fusao',
    tecnica,
  } as Arte;

  camp.calendario = avancarPeriodos(camp.calendario, PERIODOS_PARA_CRIAR);
  crescerImpulsos(camp, PERIODOS_PARA_CRIAR);
  avancarMundo(content, camp);

  (camp.artesCriadas ??= []).push(arte);
  p.artesConhecidas.push(arte.id);
  p.fusoesFeitas = (p.fusoesFeitas ?? 0) + 1;
  registrarMarco(camp, `você inventou uma técnica: ${arte.nome}`);
  if (camp.vivo) registrarFato(camp, { tipo: 'tecnica_criada', local: camp.localAtual, texto: `${p.nome} inventou um golpe próprio, que chama de ${arte.nome}.`, atores: ['jogador'], publico: true });
  afamarNome(camp, camp.localAtual, 2);
  return { ok: true, arte };
}
