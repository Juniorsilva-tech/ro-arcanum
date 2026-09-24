// ARCANUM · A Marca do Caçador — o preço, dito antes de ser cobrado.
//
// A sessão 24 criou a Marca (legado em identidade.ts, bônus em combat.ts,
// tributo em ascensao.ts). A sessão 46 mediu o resultado: metade das
// campanhas longas morria dela entre os 25 e os 28 anos, sem que o jogo
// jamais tivesse dito ao jogador o que a Marca custava. No cânone a Marca é
// uma troca trágica e conhecida — quem a desperta sabe que o corpo não passa
// muito dos 25. Aqui ela continua sendo isso, com três correções:
//
// 1) Aviso. O despertar registra marco, fato e uma linha no feed com o custo
//    e a idade-limite. O painel de progressão repete o aviso enquanto valer.
// 2) Prazo mínimo. O limite é 25 anos, ou três anos depois do despertar, o
//    que vier mais tarde. Quem desperta aos 24 não morre no ano seguinte sem
//    ter tido tempo de fazer nada com o aviso.
// 3) Saída cara. Na Casa Sem Nome na Névoa, onde os caçadores guardam o que
//    sabem da Marca, é possível conter a chama: o tributo para, mas a Marca
//    perde a maior parte do que dava, e a reclusão custa semanas e um pedaço
//    permanente da vida máxima. O dono decidiu na sessão 23 que o
//    protagonista pode passar dos 25 como Yoriichi; esta é a porta para isso,
//    e ela não é de graça.
//
// A pressão que a Marca soma depois de cada luta também mudou: antes ela
// empurrava +2 em TODAS as pressões, inclusive corrupção (que no cenário é a
// mancha do pacto e do sangue, nada a ver com a Marca), e sem teto — em
// poucas centenas de combates tudo chegava a 100. Agora ela pesa só na
// sanidade, e sozinha não passa de TETO_PRESSAO_MARCA.
import type { Campaign, ContentBundle, EstadoMarca } from './types';
import { nextFloat } from './rng';
import { registrarMarco } from './memoria';
import { registrarFato } from './historiaViva';
import { concederDespertar, recalcularRecursosMaximos } from './progresso';

export const ID_MARCA = 'marca_do_cacador';
/** Nível mínimo do oni (Lua ou chefe) cuja queda, à beira da morte, desperta a Marca. */
export const NIVEL_MINIMO_ONI_MARCA = 8;
/** Idade canônica em que o corpo marcado começa a falhar. */
export const IDADE_LIMITE_MARCA = 25;
/** Anos mínimos entre o despertar e o primeiro tributo. */
export const ANOS_DE_GRACA_MARCA = 3;
/** Vida máxima perdida a cada ano vivido além do limite. */
export const DRENO_ANUAL_MARCA = 8;
/** A pressão que a Marca soma sozinha nunca leva a sanidade além disto. */
export const TETO_PRESSAO_MARCA = 60;
export const PRESSAO_POR_COMBATE_MARCA = 2;
/** Onde a chama pode ser contida, e o que a reclusão cobra. */
export const LOCAL_CONTER_MARCA = 'mansao_ubuyashiki';
export const DIAS_RECLUSAO_MARCA = 14;
export const VIDA_PERDIDA_AO_CONTER = 12;
export const SANIDADE_MAXIMA_PARA_CONTER = 40;

export function temMarca(camp: Campaign): boolean {
  return !!camp.despertares?.includes(ID_MARCA);
}

export function marcaContida(camp: Campaign): boolean {
  return !!camp.marca?.contida;
}

function idadeAtual(camp: Campaign): number {
  return camp.personagem.idade ?? 20;
}

export function idadeLimiteParaDespertarAos(idade: number): number {
  return Math.max(IDADE_LIMITE_MARCA, idade + ANOS_DE_GRACA_MARCA);
}

/**
 * Estado da Marca, criado sob demanda. Saves de antes desta sessão têm o
 * despertar sem o estado: contam como despertados agora, com o prazo mínimo
 * a partir de hoje — o aviso que eles nunca receberam vale a partir daqui.
 */
export function estadoMarca(camp: Campaign): EstadoMarca | undefined {
  if (!temMarca(camp)) return undefined;
  return (camp.marca ??= lerMarca(camp));
}

/** O mesmo estado, sem gravar nada — para tela e narrador. */
export function lerMarca(camp: Campaign): EstadoMarca | undefined {
  if (!temMarca(camp)) return undefined;
  if (camp.marca) return camp.marca;
  const idade = idadeAtual(camp);
  return { dia: camp.calendario.dia, idadeDespertar: idade, idadeLimite: idadeLimiteParaDespertarAos(idade), vidaPerdida: 0 };
}

/** O custo em uma frase, para o feed, o painel e o narrador. */
export function avisoMarca(camp: Campaign): string | null {
  const m = lerMarca(camp);
  if (!m) return null;
  if (m.contida) {
    return `A Marca está contida desde os ${m.contida.idade} anos: o corpo parou de pagar o tributo, e a chama não arde mais como ardia.`;
  }
  const idade = idadeAtual(camp);
  const anos = m.idadeLimite - idade;
  const prazo = anos > 0
    ? `Faltam ${anos} ${anos === 1 ? 'ano' : 'anos'} para os ${m.idadeLimite}.`
    : `Você já passou dos ${m.idadeLimite}: cada ano a mais pode ser o último, e o corpo perde vigor a cada inverno.`;
  return `A Marca cobra a vida: a partir dos ${m.idadeLimite} anos o corpo começa a falhar. ${prazo} Os caçadores da Casa Sem Nome na Névoa guardam o que se sabe sobre conter a chama.`;
}

/**
 * Chamado pelo combate quando as condições do despertar se cumprem. Concede o
 * Despertar e deixa o custo registrado em três lugares: marco (para o
 * narrador), fato (para a história do mundo) e crônica (para o jogador ler
 * agora, no feed).
 */
export function despertarMarca(camp: Campaign, motivo: string): boolean {
  if (!concederDespertar(camp, ID_MARCA, motivo)) return false;
  const idade = idadeAtual(camp);
  camp.marca = { dia: camp.calendario.dia, idadeDespertar: idade, idadeLimite: idadeLimiteParaDespertarAos(idade), vidaPerdida: 0 };
  const aviso = avisoMarca(camp)!;
  registrarMarco(camp, `aos ${idade} anos a Marca do Caçador despertou; o corpo marcado começa a falhar aos ${camp.marca.idadeLimite}.`);
  if (camp.vivo) {
    registrarFato(camp, {
      tipo: 'marca_despertou', local: camp.localAtual, atores: ['jogador'], publico: false, conhecimento: 'testemunhado',
      texto: `A Marca do Caçador apareceu na pele de quem a despertou, aos ${idade} anos. Quem conhece a Marca sabe o preço.`,
    });
  }
  camp.cronica.push({ turno: camp.turno, texto: aviso, tipo: 'sistema' });
  return true;
}

/** Bônus táticos da Marca no combate. Contida, ela não dá mais nenhum. */
export function bonusCombateMarca(camp: Campaign): { acerto: number; defesa: number } {
  if (!temMarca(camp) || marcaContida(camp)) return { acerto: 0, defesa: 0 };
  return { acerto: 3, defesa: 2 };
}

/** O calor da Marca depois de cada luta: só na sanidade, e com teto próprio. */
export function aplicarPressaoPosCombateMarca(camp: Campaign): void {
  if (!temMarca(camp) || marcaContida(camp)) return;
  const p = camp.personagem;
  const atual = p.pressoes.sanidade ?? 0;
  if (atual >= TETO_PRESSAO_MARCA) return;
  p.pressoes.sanidade = Math.min(TETO_PRESSAO_MARCA, atual + PRESSAO_POR_COMBATE_MARCA);
}

/** Chance de o tributo cobrar a vida no aniversário, a partir do limite. */
export function chanceTributo(anosAlemDoLimite: number): number {
  return Math.min(0.4, 0.1 + anosAlemDoLimite * 0.05);
}

/**
 * Chamado no aniversário do jogador (ascensao.ts), antes da morte comum por
 * velhice. Devolve true se o tributo cobrou a vida.
 */
export function cobrarTributoAnual(camp: Campaign): boolean {
  const m = estadoMarca(camp);
  if (!m || m.contida) return false;
  const p = camp.personagem;
  const idade = idadeAtual(camp);
  if (idade < m.idadeLimite) return false;
  m.vidaPerdida += DRENO_ANUAL_MARCA;
  recalcularRecursosMaximos(camp);
  if (nextFloat(camp.rng) < chanceTributo(idade - m.idadeLimite)) {
    p.recursos.vida = 0;
    registrarMarco(camp, `dia ${camp.calendario.dia}: aos ${idade} anos, o tributo vital da Marca do Caçador cobrou a dívida final do sangue.`);
    return true;
  }
  camp.cronica.push({ turno: camp.turno, texto: `Aos ${idade} anos, a Marca cobra outro inverno: o fôlego encurta e o corpo não volta inteiro.`, tipo: 'sistema' });
  return false;
}

export type RequisitosConter = { pode: boolean; faltando: string[] };

export function requisitosConterMarca(content: ContentBundle, camp: Campaign): RequisitosConter {
  const faltando: string[] = [];
  const m = estadoMarca(camp);
  if (!m) return { pode: false, faltando: ['a Marca não despertou'] };
  if (m.contida) return { pode: false, faltando: ['a Marca já está contida'] };
  if (camp.localAtual !== LOCAL_CONTER_MARCA) faltando.push('estar na Casa Sem Nome na Névoa');
  // O saber é de gente, não do lugar: se todos os moradores da casa morreram,
  // não há mais quem conduza a reclusão.
  const guardioes = content.npcs.filter(n => n.localBase === LOCAL_CONTER_MARCA && camp.npcState[n.id]?.vivo);
  if (!guardioes.length) faltando.push('alguém vivo na Casa que saiba conduzir a reclusão');
  if ((camp.personagem.pressoes.sanidade ?? 0) > SANIDADE_MAXIMA_PARA_CONTER) faltando.push(`sanidade em no máximo ${SANIDADE_MAXIMA_PARA_CONTER} (a mente precisa estar quieta)`);
  if (camp.personagem.recursos.vida < camp.personagem.recursosMax.vida) faltando.push('estar com a vida cheia');
  return { pode: faltando.length === 0, faltando };
}

/**
 * A reclusão. Quem chama avança o tempo (DIAS_RECLUSAO_MARCA dias): esta
 * função só aplica o custo e muda o estado.
 */
export function conterMarca(content: ContentBundle, camp: Campaign): { ok: boolean; texto: string } {
  const req = requisitosConterMarca(content, camp);
  if (!req.pode) return { ok: false, texto: `Ainda não: ${req.faltando.join('; ')}.` };
  const m = camp.marca!;
  const idade = idadeAtual(camp);
  m.contida = { dia: camp.calendario.dia, idade };
  m.vidaPerdida += VIDA_PERDIDA_AO_CONTER;
  recalcularRecursosMaximos(camp);
  registrarMarco(camp, `aos ${idade} anos você conteve a Marca do Caçador; a chama baixou e o corpo parou de pagar o tributo.`);
  if (camp.vivo) {
    registrarFato(camp, {
      tipo: 'marca_contida', local: camp.localAtual, atores: ['jogador'], publico: false, conhecimento: 'testemunhado',
      texto: 'Depois de semanas de reclusão na Casa Sem Nome na Névoa, a Marca do Caçador baixou na pele de quem a carregava.',
    });
  }
  return {
    ok: true,
    texto: `Foram ${DIAS_RECLUSAO_MARCA} dias de respiração contada, frio e silêncio. A Marca desbotou até virar uma cicatriz morna. O corpo parou de pagar o tributo, mas a chama que cortava por você não volta mais do mesmo jeito.`,
  };
}
