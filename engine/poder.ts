// ARCANUM · Poder efetivo — régua interna de balanceamento.
//
// Não é atributo, não aparece em tela e não entra no pacote do narrador. É uma
// régua para responder uma pergunta que antes ninguém conseguia responder:
// "este personagem está acima ou abaixo daquela criatura, e por quanto?"
//
// A ideia é medir os dois lados contra o MESMO boneco de referência e comparar
// o resultado. Poder = quanto dano você entrega × quanto tempo você dura. As
// duas metades importam: quem bate forte e morre em dois golpes não é forte, e
// quem não morre mas não fere também não.
//
// Deliberadamente NÃO usa nível. Um oni nível 15 pode valer mais que um humano
// nível 20 — é para isso que a régua serve: comparar poder real, não patente.
import type { Campaign, ContentBundle, Criatura, PerfilDano } from './types';
import { modificador } from './character';
import { probabilidade } from './resolution';
import { armaEquipada, bonusDefesaEquip } from './items';
import { acertoJogador, danoJogador, defesaJogador, janelaCriticaJogador } from './combat';

/** O boneco. Fixo de propósito: mudar isso muda toda a escala histórica. */
export const REFERENCIA = { defesa: 14, acerto: 14, dano: 8, dispersao: 0.3 } as const;

/** Multiplicador médio de dano dada a janela de crítico (crítico vale 1,75×). */
export function fatorCritico(janela: number): number {
  const j = Math.max(0, Math.min(1, janela));
  return (1 - j) + j * 1.75;
}

export type FichaDePoder = {
  vida: number;
  defesa: number;
  acerto: number;
  dano: PerfilDano;
  /** Fração dos acertos que sai como crítico. Padrão do combate: 0,25. */
  janelaCritica?: number;
  /** Regeneração por turno, como fração da vida máxima (onis). */
  regeneracao?: number;
};

/** Dano por rodada de um atacante contra uma defesa concreta. */
export function danoPorRodada(atacante: FichaDePoder, alvo: FichaDePoder): number {
  const p = probabilidade(atacante.acerto, alvo.defesa, 4);
  return p * atacante.dano.base * fatorCritico(atacante.janelaCritica ?? 0.25);
}

/**
 * Rodadas até o atacante derrubar o alvo. A regeneração do oni entra como
 * dano negativo — é assim que ela funciona no combate real (um turno dele
 * devolve `vidaMax × regeneracao`). Quem não supera a regeneração nunca
 * derruba, por mais tempo que passe: o resultado é infinito, e é honesto.
 */
export function rodadasParaDerrubar(atacante: FichaDePoder, alvo: FichaDePoder): number {
  const liquido = danoPorRodada(atacante, alvo) - (alvo.regeneracao ?? 0) * alvo.vida;
  return liquido <= 0 ? Infinity : alvo.vida / liquido;
}

/** Dano por rodada que esta ficha entrega no boneco de referência. */
export function ofensiva(f: FichaDePoder): number {
  return danoPorRodada(f, { ...f, defesa: REFERENCIA.defesa });
}

/** Rodadas que esta ficha sobrevive ao boneco de referência. */
export function resiliencia(f: FichaDePoder): number {
  const boneco: FichaDePoder = {
    vida: 100, defesa: REFERENCIA.defesa, acerto: REFERENCIA.acerto,
    dano: { base: REFERENCIA.dano, dispersao: REFERENCIA.dispersao, tipo: 'referência' },
  };
  const r = rodadasParaDerrubar(boneco, f);
  return Number.isFinite(r) ? r : 9999;
}

/**
 * Vantagem de A sobre B num duelo: quantas vezes A derruba B mais rápido do
 * que B derruba A. 1,0 é equivalência real, 1,2 é vinte por cento de vantagem.
 *
 * Esta é a régua que a tabela de referência de vitória usa. Ela substituiu uma
 * primeira versão que media os dois lados contra um boneco fixo — método que
 * inflava absurdamente qualquer criatura com regeneração, porque contra o
 * boneco fraco ela era imortal, mesmo sendo fácil para um caçador de verdade.
 */
export function vantagemNoDuelo(a: FichaDePoder, b: FichaDePoder): number {
  const aDerruba = rodadasParaDerrubar(a, b);
  const bDerruba = rodadasParaDerrubar(b, a);
  if (!Number.isFinite(aDerruba)) return 0;
  if (!Number.isFinite(bDerruba)) return Infinity;
  return bDerruba / aDerruba;
}

/**
 * Poder efetivo. Escala livre — só a RAZÃO entre dois poderes tem significado.
 * A raiz mantém a régua num intervalo legível e faz "o dobro de poder" querer
 * dizer "o dobro de vantagem", não quatro vezes.
 */
export function poderEfetivo(f: FichaDePoder): number {
  return Math.sqrt(Math.max(0.0001, ofensiva(f) * resiliencia(f)));
}

/** Ficha do jogador como ele entra em combate hoje. */
export function fichaDoJogador(content: ContentBundle, camp: Campaign): FichaDePoder {
  const p = camp.personagem;
  return {
    vida: p.recursosMax.vida,
    defesa: defesaJogador(content, camp),
    acerto: acertoJogador(content, camp),
    dano: danoJogador(content, camp),
    janelaCritica: janelaCriticaJogador(camp),
  };
}

/** Ficha de uma criatura a partir do que o bestiário declara — nunca do nível. */
export function fichaDaCriatura(c: Criatura): FichaDePoder {
  return {
    vida: c.vida,
    defesa: c.defesa,
    acerto: c.acerto,
    dano: c.dano,
    regeneracao: c.perfilOni?.regeneracao,
  };
}

/**
 * O jogador consegue, em princípio, encerrar esta criatura?
 *
 * Um oni comum só morre por decapitação com Nichirin (ver
 * `aplicarFerimentoOni`, em engine/kimetsu.ts): sem a lâmina certa ele volta a
 * 1 de vida indefinidamente, por mais dano que leve. Isso não é desequilíbrio,
 * é a regra do mundo — e é o exemplo mais claro de por que poder não se mede
 * por nível. Quem ignorar isto compara números que nunca vão se encontrar.
 */
export function podeDerrotar(content: ContentBundle, camp: Campaign, c: Criatura): boolean {
  if (!c.oni) return true;
  if (c.perfilOni?.morte === 'sol') return false; // exige luz do dia, não lâmina
  return !!armaEquipada(content, camp.personagem)?.contraOni;
}

/**
 * Razão de poder entre jogador e criatura. 1,0 é equivalência; 1,2 é o jogador
 * 20% superior. É este número, e não a diferença de nível, que a tabela de
 * referência de vitória usa. Contra um alvo que o jogador não tem como
 * encerrar, a razão é 0: nenhuma quantidade de dano resolve.
 */
export function razaoDePoder(content: ContentBundle, camp: Campaign, c: Criatura): number {
  if (!podeDerrotar(content, camp, c)) return 0;
  return vantagemNoDuelo(fichaDoJogador(content, camp), fichaDaCriatura(c));
}

/**
 * Constrói um adversário artificial que fica exatamente na razão pedida contra
 * esta ficha. Existe porque a tabela de referência fala de RAZÃO DE PODER, e
 * validar a matemática do combate contra o bestiário confunde duas perguntas
 * diferentes: "a fórmula está certa?" e "o bestiário tem inimigo para este
 * nível?". Esta função responde a primeira; o relatório responde a segunda.
 */
export function adversarioNaRazao(jogador: FichaDePoder, razao: number): FichaDePoder {
  const defesa = jogador.defesa;
  const acerto = jogador.acerto;
  const r = Math.max(0.01, razao);
  // A diferença é dividida entre as duas metades do poder, não jogada toda no
  // dano. Um inimigo superior é mais duro E bate mais forte; concentrar tudo
  // numa metade produzia lutas decididas antes de começarem e afastava o
  // resultado da tabela de referência nas pontas.
  const fator = 1 / Math.sqrt(r);
  const vida = jogador.vida * fator;
  const alvoProvisorio: FichaDePoder = { vida, defesa, acerto, dano: { base: 1, dispersao: 0.3, tipo: 'aferição' } };
  const dprJogador = danoPorRodada(jogador, alvoProvisorio);
  const chance = probabilidade(acerto, jogador.defesa, 4);
  const base = (dprJogador * fator) / Math.max(0.001, chance * fatorCritico(0.25));
  return { vida, defesa, acerto, dano: { base, dispersao: 0.3, tipo: 'aferição' } };
}

/**
 * A régua de duelo pressupõe um contra um até alguém cair. Alvos que morrem
 * por regra própria — decapitação simultânea dos gêmeos, luz do sol — não são
 * mensuráveis assim, e incluí-los na aferição mediria a regra, não o balanço.
 */
export function mensuravelPorDuelo(c: Criatura): boolean {
  const morte = c.perfilOni?.morte;
  return morte === undefined || morte === 'nichirin';
}

/** Explicação legível da conta, para depuração de balanceamento. */
export function detalharPoder(f: FichaDePoder): string {
  const o = ofensiva(f);
  const r = resiliencia(f);
  return `poder ${poderEfetivo(f).toFixed(1)} (dano/rodada ${o.toFixed(1)} × rodadas ${r.toFixed(1)})`;
}

/** Só para ferramentas: contribuição bruta do equipamento na ofensiva. */
export function pesoDoEquipamento(content: ContentBundle, camp: Campaign): number {
  const arma = armaEquipada(content, camp.personagem);
  const p = camp.personagem;
  const semArma = 3 + Math.max(0, modificador(p.atributos.fisico));
  return (arma?.dano?.base ?? semArma) + bonusDefesaEquip(content, p);
}
