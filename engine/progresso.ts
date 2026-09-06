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

// Curva simples e crescente — cada nível pede mais que o anterior.
export function xpParaProximoNivel(nivelAtual: number): number {
  return 20 + nivelAtual * 15;
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
  p.recursos.vida = Math.max(1, Math.round(p.recursosMax.vida * proporcao));
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
  return VIDA_BASE + modificador(p.atributos.resiliencia) * 4
    + (p.nivel - 1) * ganhoDeVidaPorNivel(camp);
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
  registrarMarco(camp, `despertar: ${motivo}`);
  return true;
}
