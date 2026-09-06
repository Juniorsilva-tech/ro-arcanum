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

// Curva simples e crescente — cada nível pede mais que o anterior.
export function xpParaProximoNivel(nivelAtual: number): number {
  return 20 + nivelAtual * 15;
}

// Sobe quantos níveis o xp acumulado permitir, de uma vez só — cobre saves
// antigos que já tinham xp de sobra parado sem nunca ter subido nível.
export function processarSubidaDeNivel(camp: Campaign): void {
  const p = camp.personagem;
  while (p.xp >= xpParaProximoNivel(p.nivel)) {
    p.xp -= xpParaProximoNivel(p.nivel);
    p.nivel += 1;
    registrarMarco(camp, `nível ${p.nivel}: dia ${camp.calendario.dia}, você sente a diferença no corpo.`);
  }
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
