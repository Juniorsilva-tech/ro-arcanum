// ARCANUM · O que cada classe faz de diferente, de verdade.
//
// Auditoria da sessão 22: o campo `mecanicaUnica` das classes era TEXTO. Ele
// ia para o pacote do narrador e nenhuma regra da engine o lia — nem para as
// três classes originais. "Guardião aguenta o primeiro golpe de cada combate"
// estava escrito na ficha e não acontecia no combate. A promessa existia na
// tela de criação e em lugar nenhum além dela.
//
// Este módulo é a regra. Cada classe passa a ter um efeito mensurável, e cada
// efeito tem um lugar só onde é aplicado — nunca espalhado por meio motor.
//
// Regra de projeto: o efeito é modesto e claro. Uma classe deve mudar COMO se
// joga, não quanto se ganha. Nada aqui multiplica dano por dois; o que muda é
// quando o golpe importa, quanto custa a estadia, quem fala com você.
import type { Campaign, CombatActor, ContentBundle } from './types';

/** Chave da classe do personagem, ou string vazia. */
export function classeDe(camp: Campaign): string {
  return camp.personagem.classeId ?? '';
}

// ── Guardião ──────────────────────────────────────────────────────────────

/**
 * O primeiro golpe de cada combate não passa.
 *
 * Absorve o dano uma vez por luta. A marca vive no ATOR do combate, não no
 * personagem: é por combate, e um save no meio da luta preserva se já foi
 * usada ou não.
 *
 * Por que absorver e não reduzir: a promessa escrita era "como se não fosse
 * nada". Meia redução seria outra frase.
 */
export const CLASSE_GUARDIAO = 'guardiao';

export function absorveuOPrimeiroGolpe(camp: Campaign, alvo: CombatActor): boolean {
  if (!alvo.ehJogador) return false;
  if (classeDe(camp) !== CLASSE_GUARDIAO) return false;
  if (alvo.primeiroGolpeAbsorvido) return false;
  alvo.primeiroGolpeAbsorvido = true;
  return true;
}

// ── Espadachim ────────────────────────────────────────────────────────────

/**
 * Um alvo por vez. Cada golpe que acerta o MESMO inimigo facilita o seguinte.
 *
 * Acumula +1 de acerto por acerto consecutivo, até o teto. Trocar de alvo
 * zera — é isso que faz a classe ser sobre foco, e não sobre um bônus grátis
 * que cresce sozinho. O teto existe para a classe não virar acerto garantido
 * numa luta longa.
 */
export const CLASSE_ESPADACHIM = 'espadachim';
export const CLASSE_ESPADACHIM_ASORA = 'espadachim_asora';
export const CLASSE_ARQUEIRO_AZUSA = 'arqueiro_azusa';
export const CLASSE_SEM_BENCAO = 'sem_bencao';
export const CLASSE_AVENTUREIRO_TSIGE = 'aventureiro_tsige';
export const TETO_FOCO_ESPADACHIM = 4;

export function ehClasseEspadachim(camp: Campaign): boolean {
  const c = classeDe(camp);
  return c === CLASSE_ESPADACHIM || c === CLASSE_ESPADACHIM_ASORA;
}

export function bonusDeFoco(camp: Campaign, atacante: CombatActor, alvoId: string): number {
  if (!atacante.ehJogador || !ehClasseEspadachim(camp)) return 0;
  return atacante.focoAlvo === alvoId ? Math.min(TETO_FOCO_ESPADACHIM, atacante.focoAcertos ?? 0) : 0;
}

export function registrarFoco(camp: Campaign, atacante: CombatActor, alvoId: string, acertou: boolean): void {
  if (!atacante.ehJogador || !ehClasseEspadachim(camp)) return;
  if (atacante.focoAlvo !== alvoId) {
    atacante.focoAlvo = alvoId;
    atacante.focoAcertos = 0;
  }
  // Errar não zera o acúmulo: quem insiste no mesmo alvo continua insistindo.
  // Trocar de alvo zera, e é só isso que zera.
  if (acertou) atacante.focoAcertos = (atacante.focoAcertos ?? 0) + 1;
}

export type EfeitoRupturaAsora = {
  bonusDano: number;
  ignoraGuarda: boolean;
  ruptura: boolean;
};

/**
 * Limites do Espadachim de Asora:
 * - Cada acúmulo de foco gera +2 de dano puro imbuído com mana.
 * - No foco máximo (4 acertos), descarrega a Ruptura de Asora:
 *   o corte fatia o próprio espaço, anula a guarda inimiga e causa dano colossal.
 */
export function efeitoEspadachimAsora(
  camp: Campaign,
  atacante: CombatActor,
  alvoId: string,
): EfeitoRupturaAsora {
  if (!atacante.ehJogador || classeDe(camp) !== CLASSE_ESPADACHIM_ASORA) {
    return { bonusDano: 0, ignoraGuarda: false, ruptura: false };
  }
  const foco =
    atacante.focoAlvo === alvoId ? Math.min(TETO_FOCO_ESPADACHIM, atacante.focoAcertos ?? 0) : 0;
  const bonusDano = foco * 2;
  const ruptura = foco >= TETO_FOCO_ESPADACHIM;
  return {
    bonusDano: bonusDano + (ruptura ? 8 : 0),
    ignoraGuarda: ruptura,
    ruptura,
  };
}

/**
 * Disciplina de Kyudo de Azusa:
 * - Postura absoluta que ignora cobertura inimiga e adiciona +3 ao acerto cirúrgico.
 */
export function bonusArqueiroAzusa(
  camp: Campaign,
  atacante: CombatActor,
  alvo: CombatActor,
): { bonusAcerto: number; anulaCobertura: boolean } {
  if (!atacante.ehJogador || classeDe(camp) !== CLASSE_ARQUEIRO_AZUSA) {
    return { bonusAcerto: 0, anulaCobertura: false };
  }
  return {
    bonusAcerto: 3,
    anulaCobertura: alvo.posicao === 'cobertura',
  };
}

// ── Caçadora ──────────────────────────────────────────────────────────────

/**
 * O corpo obedece ao fôlego: descansar rende mais.
 *
 * A caçadora recupera metade a mais em cada descanso. Não é vida infinita —
 * é poder sair de novo na mesma noite.
 */
export const CLASSE_CACADORA = 'cacadora';
export const BONUS_DESCANSO_CACADORA = 1.5;

/** Multiplicador da recuperação de recursos ao descansar. */
export function multiplicadorDeDescanso(camp: Campaign): number {
  return classeDe(camp) === CLASSE_CACADORA ? BONUS_DESCANSO_CACADORA : 1;
}

// ── Curandeira ────────────────────────────────────────────────────────────

/**
 * Cuidar rende: o descanso dela também limpa condições que o descanso comum
 * não limpa, e ela trata envenenamento em si mesma.
 */
export const CLASSE_CURANDEIRA = 'curandeira';
const CONDICOES_QUE_A_CURANDEIRA_TRATA = ['envenenado', 'doente', 'infeccionado'];

export function condicoesTratadasAoDescansar(camp: Campaign): string[] {
  const comuns = ['agonizante', 'ferido'];
  return classeDe(camp) === CLASSE_CURANDEIRA
    ? [...comuns, ...CONDICOES_QUE_A_CURANDEIRA_TRATA]
    : comuns;
}

// ── Contrabandista ────────────────────────────────────────────────────────

/**
 * Conhece quem compra. Paga menos e recebe mais.
 *
 * Vinte por cento nos dois lados. É o mesmo desconto que a barganha já dava,
 * e por isso não empilha com ela: quem barganha bem não barganha duas vezes.
 */
export const CLASSE_CONTRABANDISTA = 'contrabandista';
export const VANTAGEM_CONTRABANDISTA = 0.2;

export function descontoDeCompra(camp: Campaign, jaTemDesconto: boolean): boolean {
  return jaTemDesconto || classeDe(camp) === CLASSE_CONTRABANDISTA;
}

export function multiplicadorDeVenda(camp: Campaign): number {
  return classeDe(camp) === CLASSE_CONTRABANDISTA ? 1 + VANTAGEM_CONTRABANDISTA : 1;
}

// ── Penitente ─────────────────────────────────────────────────────────────

/**
 * Carrega o peso de propósito: quanto mais ferida, mais forte o que invoca.
 *
 * O bônus cresce com a vida PERDIDA. Cheia de vida ela não ganha nada; à
 * beira da morte, bate bem mais. É a única classe do jogo que premia estar
 * machucada, e por isso o teto importa: até 50% a mais, e só nas artes.
 */
export const CLASSE_PENITENTE = 'penitente';
export const TETO_PENITENTE = 0.5;

export function multiplicadorDeArte(camp: Campaign): number {
  if (classeDe(camp) !== CLASSE_PENITENTE) return 1;
  const p = camp.personagem;
  const max = p.recursosMax.vida || 1;
  const perdida = Math.max(0, Math.min(1, 1 - (p.recursos.vida ?? max) / max));
  return 1 + perdida * TETO_PENITENTE;
}

// ── Arcanista ─────────────────────────────────────────────────────────────

/**
 * Mana gasta volta estudando. O verbo `estudar` devolve mana a ela, e só a
 * ela — para o resto do elenco estudar continua sendo só tempo passado.
 */
export const CLASSE_ARCANISTA = 'arcanista';
export const MANA_POR_ESTUDO = 3;

export function manaDeEstudo(camp: Campaign): number {
  return classeDe(camp) === CLASSE_ARCANISTA ? MANA_POR_ESTUDO : 0;
}

// ── Batedor ───────────────────────────────────────────────────────────────

/**
 * Conhece as rotas e os atalhos: viaja mais seguro.
 *
 * Reduz o perigo efetivo de qualquer rota. Note que a ficha da classe dizia
 * outra coisa — "vê a oportunidade um período antes" — e essa frase foi
 * trocada de propósito na sessão 22: ela descrevia um sistema de oportunidades
 * que a engine não expõe, e manter a frase seria repetir o defeito que esta
 * sessão veio consertar. A regra implementada é a que a DESCRIÇÃO da classe
 * sempre prometeu: "conhece as rotas, os atalhos e quem anda por eles".
 */
export const CLASSE_BATEDOR = 'batedor';
export const ALIVIO_DE_ROTA_BATEDOR = 1.5;

export function alivioDeRota(camp: Campaign): number {
  return classeDe(camp) === CLASSE_BATEDOR ? ALIVIO_DE_ROTA_BATEDOR : 0;
}

// ── Para a tela e para o narrador ─────────────────────────────────────────

/**
 * Descrição curta do efeito ATIVO, gerada da regra e não de um texto solto.
 * Se um dia a regra mudar e esta linha não mudar junto, o teste reclama.
 */
export function efeitoDaClasse(camp: Campaign): string | undefined {
  switch (classeDe(camp)) {
    case CLASSE_GUARDIAO: return 'O primeiro golpe de cada combate não passa.';
    case CLASSE_ESPADACHIM: return `Cada acerto no mesmo alvo soma +1 de acerto, até +${TETO_FOCO_ESPADACHIM}. Trocar de alvo zera.`;
    case CLASSE_CACADORA: return 'Descansar recupera metade a mais.';
    case CLASSE_CURANDEIRA: return 'Descansar também trata veneno, doença e infecção.';
    case CLASSE_CONTRABANDISTA: return 'Compra 20% mais barato e vende 20% mais caro.';
    case CLASSE_PENITENTE: return `Quanto mais ferida, mais forte a arte — até +${Math.round(TETO_PENITENTE * 100)}%.`;
    case CLASSE_ARCANISTA: return `Estudar devolve ${MANA_POR_ESTUDO} de mana.`;
    case CLASSE_BATEDOR: return `Conhece os atalhos: toda rota fica ${ALIVIO_DE_ROTA_BATEDOR} menos perigosa.`;
    case CLASSE_ESPADACHIM_ASORA: return 'Caminho da Espada: acertos consecutivos somam acerto e dano. No foco máximo, o golpe atinge o Vazio, ignora guarda e desfere dano colossal.';
    case CLASSE_ARQUEIRO_AZUSA: return 'Disciplina do Arco: tiros de mana ganham +3 de acerto cirúrgico e ignoram cobertura inimiga.';
    case CLASSE_SEM_BENCAO: return 'Mago: reserva de mana colossal que abala a moral dos inimigos no início do combate.';
    case CLASSE_AVENTUREIRO_TSIGE: return 'Aventureiro: adaptado à fronteira extrema com mobilidade e instinto tático.';
    default: return undefined;
  }
}
