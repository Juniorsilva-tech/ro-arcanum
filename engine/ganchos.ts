// ARCANUM · Os ganchos dos lugares viram razão para sair de casa.
//
// O mapa carrega 55 ganchos escritos à mão — "o celeiro está cheio e a vila
// come pouco", "três rapazes não voltaram da última leva e a lista diz que
// voltaram", "uma galeria foi interditada e a interdição foi removida por
// dentro". Até a sessão 21 esse material só chegava ao narrador como sabor de
// ambiente: ele aparecia na descrição do lugar e morria ali. Nenhum deles
// gerava uma única razão para o jogador ir a lugar nenhum.
//
// Este módulo fecha essa ponta. Um gancho vira uma missão de investigar cuja
// CAUSA é o texto do próprio gancho — ou seja, a missão não é procedural com
// um rótulo colado por cima: ela é a ficção que já estava escrita, entrando no
// jogo pela porta que o mundo vivo já usa.
//
// Três regras governam o ritmo, e todas existem por um motivo:
//
//  1. **Só lugar conhecido.** Um gancho de um assentamento que o jogador nunca
//     ouviu falar não é convite, é ruído — e o mundo vivo já trata rumor por
//     rota real (ver `proximoPasso`, em historiaViva.ts).
//  2. **Um gancho por vez, e nunca o mesmo duas vezes.** A flag
//     `gancho.usado.<local>.<i>` é permanente: um segredo revelado não volta a
//     ser segredo.
//  3. **Devagar.** O mundo já gera missão por fome, doença, ruína, sequestro e
//     nemesis. Se os ganchos entrassem em todo tique, a lista de missões viveria
//     estourada e nada teria peso.
import type { Campaign, ContentBundle, Local } from './types';
import { nextFloat } from './rng';
import { registrarFato } from './historiaViva';
import { localConhecido } from './viagem';
import { oferecerMissao } from './missoesVivas';

/**
 * Chance, por dia, de um gancho conhecido virar missão.
 *
 * Calibrado medindo, não escolhido no olho. Campanhas de dez anos, política
 * por objetivos, três sementes:
 *
 * | chance | ganchos engajados | missões concluídas | falhadas |
 * | ---    | ---               | ---                | ---      |
 * | 0 (sem)| 0                 | 171                | 201      |
 * | 0,008  | 26                | 144                | 223      |
 * | 0,015  | 42                | 141                | 251      |
 * | 0,025  | 71                | 133                | 265      |
 * | 0,06   | 102 (de ~110)     | —                  | —        |
 *
 * A leitura importante: gancho **desloca** missão do mundo quase um por um,
 * porque o tempo do jogador é finito. A 0,06 o mapa inteiro se esgotava numa
 * campanha e a lista virava assinatura de jornal. Em 0,01 o jogador engaja uns
 * três por ano — o tamanho de "ouvi uma coisa na praça e fui ver".
 */
export const CHANCE_DIARIA_DE_GANCHO = 0.01;

/** Teto de missões de gancho abertas ao mesmo tempo. */
export const MAX_GANCHOS_ABERTOS = 2;

/**
 * Dias que um gancho ignorado passa fora da fila.
 *
 * Sem carência, devolver o gancho ao mundo virou um moinho: em dez anos a
 * lista de missões dobrava (229 → 469) com o mesmo punhado de rumores sendo
 * reoferecido a cada poucas semanas. Um assunto que ninguém foi checar não
 * volta à boca do povo no mês seguinte — ele esfria, e ressurge quando já
 * virou história velha de novo.
 */
export const CARENCIA_DO_GANCHO = 240;

export function flagDoGancho(local: string, indice: number): string {
  return `gancho.usado.${local}.${indice}`;
}

function flagDeCarencia(local: string, indice: number): string {
  return `gancho.frio.${local}.${indice}`;
}

/** Já existe missão aberta para este gancho? Evita oferta duplicada. */
function jaOferecido(camp: Campaign, local: string, indice: number): boolean {
  return (camp.vivo?.missoes ?? []).some(
    q => (q.estado === 'oferecida' || q.estado === 'aceita')
      && q.causa.id.startsWith(`gancho_${local}#${indice}_`),
  );
}

/**
 * Ganchos que ainda podem virar missão: de lugares que o jogador conhece, e
 * que nunca foram usados nesta campanha.
 */
export function ganchosDisponiveis(
  content: ContentBundle,
  camp: Campaign,
): { local: string; indice: number; texto: string }[] {
  const saida: { local: string; indice: number; texto: string }[] = [];
  for (const l of content.locais) {
    if (!l.ganchos?.length) continue;
    if (!aoAlcanceDoRumor(content, camp, l)) continue;
    l.ganchos.forEach((texto, indice) => {
      if (camp.flags[flagDoGancho(l.id, indice)]) return;
      if (jaOferecido(camp, l.id, indice)) return;
      const frioAte = camp.flags[flagDeCarencia(l.id, indice)];
      if (typeof frioAte === 'number' && camp.calendario.dia < frioAte) return;
      saida.push({ local: l.id, indice, texto });
    });
  }
  return saida;
}


/**
 * O rumor de um gancho chega até o jogador?
 *
 * Duas condições, nesta ordem. A primeira é a do mundo: lugar oculto não
 * vaza segredo antes de ser descoberto — é o que separa "secreto na ficção"
 * de "secreto de verdade" (ver `localConhecido`, em viagem.ts).
 *
 * A segunda é a do alcance. Notícia anda por rota, não por telepatia: vale o
 * lugar onde o jogador já pisou e o que faz fronteira com ele. Sem esse
 * limite, um gancho do Ermo de Solgar chegaria a quem nunca saiu do Vale, e
 * a lista de missões viraria um catálogo do mapa inteiro em vez do que se
 * ouve na praça.
 */
function aoAlcanceDoRumor(content: ContentBundle, camp: Campaign, local: Local): boolean {
  if (!localConhecido(camp, local)) return false;
  const visitados = new Set([...camp.locaisVisitados, camp.localAtual]);
  if (visitados.has(local.id)) return true;
  return content.locais.some(
    l => visitados.has(l.id) && l.rotas.some(r => r.destino === local.id),
  );
}

/**
 * Tique diário. Devolve a missão criada, se criou — o simulador usa isso para
 * medir, e quem chama no mundo vivo ignora.
 */
export function processarGanchos(content: ContentBundle, camp: Campaign) {
  const v = camp.vivo;
  if (!v) return;

  const abertos = v.missoes.filter(
    q => (q.estado === 'oferecida' || q.estado === 'aceita') && q.causa.id.startsWith('gancho_'),
  ).length;
  if (abertos >= MAX_GANCHOS_ABERTOS) return;
  if (nextFloat(camp.rng) >= CHANCE_DIARIA_DE_GANCHO) return;

  const pool = ganchosDisponiveis(content, camp);
  if (!pool.length) return;
  const escolhido = pool[Math.floor(nextFloat(camp.rng) * pool.length)];

  // O fato entra no histórico causal como qualquer outro acontecimento do
  // mundo: com local, texto e visibilidade. É ele que vira a causa da missão,
  // então a missão herda a ficção escrita à mão em vez de um rótulo genérico.
  const fato = registrarFato(camp, {
    tipo: 'gancho',
    local: escolhido.local,
    texto: escolhido.texto,
    atores: [],
    publico: true,
    conhecimento: 'rumor',
  });
  // Prefixo que identifica a origem sem precisar de campo novo no save — é o
  // que o teto de ganchos abertos consulta lá em cima.
  fato.id = marcarOrigem(fato.id, escolhido.local, escolhido.indice);

  const missao = oferecerMissao(camp, 'investigar', fato, {}, content);
  if (missao) missao.titulo = tituloDoGancho(escolhido.texto);
  return missao;
}

/**
 * Queima o gancho quando o jogador de fato se envolveu, e o devolve ao mundo
 * quando não se envolveu.
 *
 * A primeira versão marcava o gancho como usado no instante da OFERTA. O
 * resultado medido foi ruim: missão de gancho que expirava sem ninguém chegar
 * perto queimava a ficção escrita à mão para sempre, e em dez anos o mapa
 * ficava sem nenhum segredo por contar. Um rumor que ninguém foi checar não
 * deixa de ser verdade — ele volta a circular.
 *
 * Então: aceitou ou concluiu, o gancho é consumido de vez. Deixou vencer, ele
 * volta para a fila e pode ressurgir mais tarde.
 */
export function conciliarGanchos(camp: Campaign): void {
  const v = camp.vivo;
  if (!v) return;
  for (const q of v.missoes) {
    const marca = lerMarca(q.causa.id);
    if (!marca) continue;
    if (q.estado === 'aceita' || q.estado === 'concluida' || q.estado === 'resolvida_por_outros') {
      camp.flags[flagDoGancho(marca.local, marca.indice)] = true;
    } else if (q.estado === 'falhada') {
      // Vencida sem ninguém aceitar: o gancho não queima, mas esfria.
      const chave = flagDeCarencia(marca.local, marca.indice);
      if (camp.flags[chave] === undefined || (camp.flags[chave] as number) <= camp.calendario.dia) {
        camp.flags[chave] = camp.calendario.dia + CARENCIA_DO_GANCHO;
      }
    }
  }
}

/** Codifica o gancho de origem dentro do id do fato, sem campo novo no save. */
function marcarOrigem(fatoId: string, local: string, indice: number): string {
  return `gancho_${local}#${indice}_${fatoId}`;
}

function lerMarca(causaId: string): { local: string; indice: number } | undefined {
  if (!causaId.startsWith('gancho_')) return;
  const corpo = causaId.slice('gancho_'.length);
  const corte = corpo.indexOf('#');
  if (corte < 0) return;
  const local = corpo.slice(0, corte);
  const indice = Number.parseInt(corpo.slice(corte + 1), 10);
  return Number.isFinite(indice) ? { local, indice } : undefined;
}

/**
 * Título curto a partir do gancho. Os ganchos são frases inteiras — "o celeiro
 * está cheio e a vila come pouco" — e a lista de missões precisa de algo que
 * caiba numa linha sem perder o que chamou atenção.
 */
export function tituloDoGancho(texto: string): string {
  const corte = texto.split(/,| e | que /)[0].trim();
  const curto = corte.length > 42 ? `${corte.slice(0, 40).trimEnd()}…` : corte;
  return curto.charAt(0).toUpperCase() + curto.slice(1);
}
