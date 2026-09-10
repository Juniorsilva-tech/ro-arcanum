// ARCANUM · Progressão de nível.
//
// Achado ao integrar o Esquadrão Oculto (engine/duelo.ts usa camp.personagem.nivel
// pra decidir se você pesa reforço num duelo): o personagem ganha XP em três
// lugares (combat.ts na vitória, effects.ts em efeitos do tipo 'xp', quests.ts
// na entrega de recompensa) mas nada nunca converteu esse XP em `nivel`. O
// campo nascia em 1 (character.ts) e ficava lá pra sempre — o que quebra
// silenciosamente tudo que escala com nível: acerto e poder em combate,
// dificuldade que você impõe em testes sociais, preço do que as lojas vendem
// pro seu nível (despojos.ts), e agora o reforço nos duelos de fundo.
//
// Este módulo não muda onde o XP é concedido — só fecha o ciclo: chame
// `processarSubidaDeNivel(camp)` logo depois de qualquer `p.xp += ...`.
import type { Campaign } from './types';
import { registrarMarco } from './memoria';
import { modificador, recursoMaximo } from './character';
import { multiplicadoresDeIdentidade } from './identidade';

// O teto humano. Não é um limite duro — ninguém é impedido de passar dele —
// mas é onde a curva deixa de ser generosa. Vinte é o nível do ser mais
// perigoso que existe no mundo (Muzan, no bestiário); um caçador que chega
// perto disso já está no alto do que gente alcança treinando.
export const TETO_HUMANO = 20;

// Quanto cada nível acima do teto custa a mais que o anterior. Multiplicativo
// de propósito: subir do 21 pro 22 é caro, do 30 pro 31 é quase impossível
// sem que a história conceda um Despertar.
const CUSTO_ACIMA_DO_TETO = 1.45;

/**
 * XP do próximo nível. Abaixo do teto humano a curva é a antiga — linear,
 * generosa, para que a primeira metade da campanha ande.
 *
 * Acima do teto ela acelera, e isso conserta um erro medido na sessão 19: com
 * a curva puramente linear, dez anos de campanha entregavam nível 66-68 num
 * mundo cujo ser mais perigoso é nível 20. O resultado era um jogador com
 * cento e dezessete vezes a força do inimigo mais duro que conseguia derrotar
 * — combate deixava de ser risco e virava trâmite por volta do nível 40.
 *
 * O comentário do Despertar, logo abaixo, sempre disse que o teto normal "não
 * leva ninguém perto de um Yoriichi — de propósito". Agora a curva cumpre o
 * que aquele comentário promete: passar do teto humano é caminho da história
 * (`concederDespertar`), não de acumular xp.
 */
export function xpParaProximoNivel(nivelAtual: number): number {
  const base = 20 + nivelAtual * 15;
  const excedente = Math.max(0, nivelAtual - TETO_HUMANO);
  return Math.round(base * Math.pow(CUSTO_ACIMA_DO_TETO, excedente));
}

// Sobe quantos níveis o xp acumulado permitir, de uma vez só — cobre saves
// antigos que já tinham xp de sobra parado sem nunca ter subido nível.
// Tetos de recurso derivados de atributos e nivel. Ate aqui a vida era fixada
// na criacao do personagem e nunca mais mexia — subir de nivel nao dava um
// ponto de vida sequer.
export function recalcularRecursosMaximos(camp: Campaign): void {
  const p = camp.personagem;
  const antes = p.recursosMax.vida || 1;
  const proporcao = Math.min(1, (p.recursos.vida ?? antes) / antes);
  p.recursosMax.vida = vidaMaxima(camp);
  // Ferido continua ferido na mesma proporcao; ganhar nivel nao cura.
  p.recursos.vida = p.recursos.vida <= 0 ? 0 : Math.max(1, Math.round(p.recursosMax.vida * proporcao));
  // Vigor e mana tambem acompanham o nivel, de forma mais discreta.
  for (const id of Object.keys(p.recursosMax)) {
    if (id === 'vida') continue;
    const max = recursoMaximo(id, p.atributos) + Math.floor(p.nivel / 2);
    p.recursosMax[id] = max;
    p.recursos[id] = Math.min(max, p.recursos[id] ?? max);
  }
}

// Vida por nivel. A parte fixa continua vindo da resiliencia; a parte que
// cresce e' a correcao: antes a vida era carimbada na criacao do personagem e
// nunca mais mexia, entao nivel 25 tinha o mesmo corpo de nivel 1.
// Piso de vida. Subiu de 20 para 34 por medicao, nao por gosto: com 20, um
// personagem de nivel 1 morria em dois golpes e a luta virava cara ou coroa —
// o banco de provas mostrava todas as faixas colapsando perto de 50%, porque
// nao havia rodadas suficientes para a diferenca de poder aparecer.
export const VIDA_BASE = 44;
export function ganhoDeVidaPorNivel(camp: Campaign): number {
  return 2 + Math.max(0, modificador(camp.personagem.atributos.resiliencia));
}
export function vidaMaxima(camp: Campaign): number {
  const p = camp.personagem;
  return Math.round((VIDA_BASE + modificador(p.atributos.resiliencia) * 4
    + (p.nivel - 1) * ganhoDeVidaPorNivel(camp)) * multiplicadoresDeIdentidade(camp).vida);
}

export function processarSubidaDeNivel(camp: Campaign): void {
  const p = camp.personagem;
  let subiu = false;
  while (p.xp >= xpParaProximoNivel(p.nivel)) {
    p.xp -= xpParaProximoNivel(p.nivel);
    p.nivel += 1;
    subiu = true;
    registrarMarco(camp, `nível ${p.nivel}: dia ${camp.calendario.dia}, você sente a diferença no corpo.`);
  }
  if (subiu) recalcularRecursosMaximos(camp);
}

// ── Despertar: o teto normal de nível (o que a curva de xp acima concede)
// não leva ninguém perto de um Yoriichi — de propósito. Um Despertar é um
// avanço raro e ganho, não farmado: concedido pelo conteúdo (mestre, missão,
// marco de história) quando o jogador cruza um limiar real da história, não
// um número de xp.
//
// Mecanicamente é simples e permanente: soma um bônus fixo de nível acima
// da curva normal. Propaga sozinho pra tudo que já lê p.nivel (acerto e
// poder em character.ts, preço de loja em despojos.ts, reforço em
// duelo.ts) sem precisar mudar assinatura de função nenhuma.
// camp.despertares só existe pra saber quais já foram concedidos (evita
// conceder duas vezes) e pro narrador saber o que já aconteceu.
const BONUS_POR_DESPERTAR = 3;

export function concederDespertar(camp: Campaign, id: string, motivo: string): boolean {
  const lista = camp.despertares ?? (camp.despertares = []);
  if (lista.includes(id)) return false;
  lista.push(id);
  camp.personagem.nivel += BONUS_POR_DESPERTAR;
  recalcularRecursosMaximos(camp);
  registrarMarco(camp, `despertar: ${motivo}`);
  return true;
}
