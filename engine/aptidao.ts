// ARCANUM · Aptidão oculta, maestria ganha, e o mundo descobrindo aos poucos.
//
// A regra que governa este módulo inteiro: **a engine sabe a aptidão; mais
// ninguém sabe**. Nenhuma função aqui deixa `aptidao` sair para o narrador,
// para um NPC ou para a UI. O mundo reage a `reputacao` e `fama`, que são
// construídas a partir do que foi efetivamente demonstrado na frente de
// alguém — e um observador pode errar, subestimar ou atribuir à sorte.
//
// Por isso não existe `if (jogador.prodigio) npc.reagir()` em lugar nenhum.
// Existe `crencas[npcId][dominio]`, formada por observação, competência do
// observador, viés pessoal dele e relação com o protagonista.
import type { Campaign, ContentBundle, NPC } from './types';
import type { AptidaoState, Crenca, Dominio, FaixaAptidao } from './aptidaoTypes';
import { DOMINIOS, NOME_DOMINIO } from './aptidaoTypes';
import { createRng, nextFloat, seedFromString } from './rng';
import { registrarFato } from './historiaViva';
import { registrarMarco } from './memoria';
import { concederDespertar } from './progresso';

// ── Vocabulário: como os domínios conversam com o que já existe ───────────
//
// Perícias e categorias de verbo já são o vocabulário do conteúdo. Em vez de
// inventar um paralelo, os domínios apontam para eles.
const PERICIAS_DO_DOMINIO: Record<Dominio, string[]> = {
  espada: ['atletismo'],
  arcano: ['arcana'],
  estrategia: ['decifrar'],
  alquimia: ['oficio'],
  diplomacia: ['persuadir', 'enganar', 'intimidar'],
  percepcao: ['perceber', 'rastrear'],
  medicina: ['oficio'],
  furtividade: ['furtividade', 'prestidigitacao'],
  oficio: ['oficio'],
};

const DOMINIO_DA_PERICIA: Record<string, Dominio> = {
  atletismo: 'espada', arcana: 'arcano', decifrar: 'estrategia',
  persuadir: 'diplomacia', enganar: 'diplomacia', intimidar: 'diplomacia',
  perceber: 'percepcao', rastrear: 'percepcao',
  furtividade: 'furtividade', prestidigitacao: 'furtividade',
  oficio: 'oficio',
};

const DOMINIO_DA_CATEGORIA: Record<string, Dominio> = {
  social: 'diplomacia', observacao: 'percepcao', transgressao: 'furtividade',
  corpo: 'espada', pratica: 'oficio', ganho: 'oficio',
  cenario: 'percepcao', deslocamento: 'percepcao',
};

/** Domínio exercitado por uma ação, pela perícia testada ou pela categoria. */
export function dominioDaAcao(pericia?: string, categoria?: string): Dominio | undefined {
  if (pericia && DOMINIO_DA_PERICIA[pericia]) return DOMINIO_DA_PERICIA[pericia];
  if (categoria && DOMINIO_DA_CATEGORIA[categoria]) return DOMINIO_DA_CATEGORIA[categoria];
  return undefined;
}

/** Domínio de uma arte: respiração e forma são lâmina; o resto é arcano. */
export function dominioDaArte(estilo?: string): Dominio {
  return estilo && estilo !== 'arcano' ? 'espada' : 'arcano';
}

// ── Aptidão ───────────────────────────────────────────────────────────────

export function faixaDeAptidao(n: number): FaixaAptidao {
  if (n >= 100) return 'fenomeno_historico';
  if (n >= 99) return 'prodigio_extraordinario';
  if (n >= 95) return 'prodigio';
  if (n >= 85) return 'excepcional';
  if (n >= 70) return 'talentoso';
  if (n >= 50) return 'competente';
  return 'comum';
}

export const NOME_FAIXA: Record<FaixaAptidao, string> = {
  comum: 'comum',
  competente: 'competente',
  talentoso: 'talentoso',
  excepcional: 'excepcional',
  prodigio: 'prodígio',
  prodigio_extraordinario: 'prodígio extraordinário',
  fenomeno_historico: 'fenômeno histórico',
};

const zerado = (): Record<Dominio, number> =>
  Object.fromEntries(DOMINIOS.map(d => [d, 0])) as Record<Dominio, number>;

/**
 * Sorteia a aptidão de nascimento. A maioria dos domínios fica no comum; um
 * domínio de vocação recebe uma segunda chance de subir, e só ela pode chegar
 * a prodígio. Nascer prodígio é raro de propósito, e mesmo assim é só
 * potencial: quem nasce com 97 na lâmina e nunca treina morre sem saber.
 */
export function iniciarAptidao(camp: Campaign): AptidaoState {
  const marca = camp.genese?.marca;
  const empurrao = marca === 'genio' ? 12 : marca === 'indigno' ? -8 : 0;

  // RNG próprio, derivado da semente da campanha. Duas razões: a aptidão é
  // sempre a mesma para a mesma semente, e migrar um save antigo não empurra
  // o cursor do RNG de jogo — o que mudaria todos os sorteios seguintes de
  // uma campanha em andamento.
  const rng = createRng(seedFromString(`aptidao:${camp.rng.seed}`));

  const aptidao = zerado();
  for (const d of DOMINIOS) {
    // Curva puxada para baixo: a média humana é comum, não talentosa.
    const base = 18 + nextFloat(rng) * 34 + nextFloat(rng) * 14;
    aptidao[d] = Math.max(1, Math.min(100, Math.round(base + empurrao * 0.4)));
  }
  // A vocação. Sorteada, não escolhida — o personagem descobre jogando.
  const vocacao = DOMINIOS[Math.floor(nextFloat(rng) * DOMINIOS.length)];
  const salto = nextFloat(rng) ** 2.6; // cauda curta: 95+ é incomum
  aptidao[vocacao] = Math.max(
    aptidao[vocacao],
    Math.min(100, Math.round(55 + salto * 46 + empurrao)),
  );

  return {
    versao: 1,
    aptidao,
    esforco: zerado(),
    exposicao: zerado(),
    reputacao: zerado(),
    picoReputacao: zerado(),
    fama: zerado(),
    crencas: {},
    ocultando: false,
    sessoes: zerado(),
    reacoes: [],
  };
}

export function estadoAptidao(camp: Campaign): AptidaoState {
  return (camp.aptidao ??= iniciarAptidao(camp));
}

/**
 * Save de antes deste sistema existir. A aptidão é sorteada da semente (então
 * a mesma campanha dá sempre o mesmo resultado), e a maestria é reconstruída
 * a partir do que o personagem já tinha: perícias treinadas, nível e artes
 * aprendidas. Sem isso, um veterano de dez anos acordaria sem saber nada.
 */
export function migrarAptidao(camp: Campaign): void {
  if (camp.aptidao) {
    // Campo que nasceu depois do resto do sistema.
    camp.aptidao.picoReputacao ??= { ...camp.aptidao.reputacao };
    return;
  }
  const a = (camp.aptidao = iniciarAptidao(camp));
  const p = camp.personagem;

  for (const [per, grau] of Object.entries(p.pericias ?? {})) {
    const d = DOMINIO_DA_PERICIA[per];
    if (!d || grau <= 0) continue;
    // Uma perícia de grau 1 equivale a mais ou menos 20 de maestria.
    a.esforco[d] = Math.max(a.esforco[d], esforcoParaMaestria(Math.min(80, grau * 20)));
  }
  // Nível e artes conhecidas contam como bagagem real de combate.
  const bagagem = Math.min(75, (p.nivel ?? 1) * 2 + (p.artesConhecidas?.length ?? 0) * 3);
  if (bagagem > 0) a.esforco.espada = Math.max(a.esforco.espada, esforcoParaMaestria(bagagem));
  for (const d of DOMINIOS) {
    a.sessoes[d] = Math.round(maestriaPorEsforco(a.esforco[d]));
    sincronizarPericias(camp, d);
  }
}

// ── Maestria: retorno decrescente de verdade ──────────────────────────────
//
// Maestria não é somada, é derivada do esforço por saturação exponencial.
// Isso dá a curva pedida sem tabela de faixas espalhada pelo código:
//   esforço  70 → 27      350 → 80
//   esforço 170 → 54      500 → 90
//   esforço 660 → 95     1010 → 99
// Os primeiros pontos saem baratos; os últimos custam uma vida.
const ESCALA_ESFORCO = 220;

/**
 * Topo real do que se treina. Noventa, e nao cem, porque a curva de esforco e'
 * assintotica: cem exigiria esforco infinito e ninguem chegaria nunca.
 */
export const LIMIAR_MAESTRIA_CONSUMADA = 90;

/**
 * Reputacao a partir da qual o mundo trata o nome como referencia. Menor que o
 * limiar de maestria de proposito: reputacao e' teto-limitada pela exposicao e
 * pesada pela confianca de quem observou, entao 78 de reputacao publica e'
 * mais raro do que 78 de maestria privada.
 */
export const LIMIAR_NOME_CONHECIDO = 78;

export function maestriaPorEsforco(esforco: number): number {
  return 100 * (1 - Math.exp(-Math.max(0, esforco) / ESCALA_ESFORCO));
}

export function esforcoParaMaestria(maestria: number): number {
  const m = Math.min(99.9, Math.max(0, maestria));
  return -ESCALA_ESFORCO * Math.log(1 - m / 100);
}

export function maestriaDe(camp: Campaign, d: Dominio): number {
  return maestriaPorEsforco(estadoAptidao(camp).esforco[d]);
}

/**
 * Teto confortável: acima dele o ganho quase seca. Não é um muro — quem tem
 * aptidão 40 ainda chega a 90, só que levando anos. É o que separa "talento
 * acelera" de "talento decide".
 */
export function tetoConfortavel(aptidao: number): number {
  return 55 + aptidao * 0.45;
}

export type FatoresDeTreino = {
  /** 0-1. Qualidade do mestre; sem mestre, treino solitário rende menos. */
  mestre?: number;
  /** 0-1. Esforço aplicado na sessão. */
  esforco?: number;
  /** 0-1. Recursos: equipamento, material, lugar adequado. */
  recursos?: number;
  /** Id de quem está observando o treino, se houver. */
  observadorId?: string;
};

/**
 * Uma sessão de treino. Devolve o ganho de maestria em pontos.
 *
 * Aptidão é multiplicador forte mas finito (0,5× a 2,5×). Disciplina,
 * mestre e recursos pesam junto, então um comum obstinado com bom mestre
 * aprende mais rápido que um prodígio relaxado e sozinho.
 */
export function treinar(
  content: ContentBundle,
  camp: Campaign,
  d: Dominio,
  fatores: FatoresDeTreino = {},
): number {
  const a = estadoAptidao(camp);
  const p = camp.personagem;

  const mestre = fatores.mestre ?? 0.35;
  const empenho = fatores.esforco ?? 0.6;
  const recursos = fatores.recursos ?? 0.5;

  // Corpo e cabeça entram: exausto ou em pânico não se aprende.
  const vitalidade = (p.recursos.vida ?? 1) / Math.max(1, p.recursosMax.vida ?? 1);
  const sanidade = 1 - (p.pressoes.sanidade ?? 0) / 140;
  const estado = Math.max(0.25, Math.min(1, vitalidade * 0.5 + sanidade * 0.5));

  const multAptidao = 0.5 + a.aptidao[d] / 50;
  const maestriaAtual = maestriaPorEsforco(a.esforco[d]);
  const acimaDoTeto = maestriaAtual > tetoConfortavel(a.aptidao[d]);
  // Conter-se de propósito também custa aprendizado: quem esconde, treina menos.
  const contencao = a.ocultando ? 0.75 : 1;

  const ganhoEsforco =
    3.2 * (0.4 + mestre) * (0.4 + empenho) * (0.6 + recursos * 0.6) * estado *
    multAptidao * contencao * (acimaDoTeto ? 0.15 : 1);

  a.esforco[d] += ganhoEsforco;
  a.sessoes[d] += 1;
  const maestriaNova = maestriaPorEsforco(a.esforco[d]);

  sincronizarPericias(camp, d);

  // Maestria consumada. Noventa num dominio nao se alcanca por acaso: acima do
  // teto confortavel da aptidao o ganho cai para 15%, entao chegar aqui e'
  // teimosia de anos, e aptidao alta so' encurta o caminho — nao o dispensa.
  // Concedido uma vez, em qualquer dominio: e' o limiar de "consumou um
  // oficio", nao um colecionavel por pericia.
  if (maestriaAtual < LIMIAR_MAESTRIA_CONSUMADA && maestriaNova >= LIMIAR_MAESTRIA_CONSUMADA) {
    concederDespertar(camp, 'maestria_consumada', `você alcançou o topo real do que se pode treinar em ${d}`);
  }

  // Quem estava olhando pode notar o RITMO, não a aptidão. É assim que um
  // mestre desconfia antes de qualquer torneio: o sujeito pega rápido demais.
  if (fatores.observadorId) {
    observarRitmo(content, camp, fatores.observadorId, d);
  }
  return maestriaNova - maestriaAtual;
}

/**
 * Ponte com o vocabulário antigo: perícia acompanha a maestria por faixas.
 * Sem isso, os verbos que exigem `pericias[x] > 0` nunca abririam para quem
 * treinou o domínio correspondente.
 */
function sincronizarPericias(camp: Campaign, d: Dominio): void {
  const m = maestriaDe(camp, d);
  const grau = m >= 80 ? 4 : m >= 60 ? 3 : m >= 35 ? 2 : m >= 12 ? 1 : 0;
  if (grau <= 0) return;
  for (const per of PERICIAS_DO_DOMINIO[d]) {
    camp.personagem.pericias[per] = Math.max(camp.personagem.pericias[per] ?? 0, grau);
  }
}

// ── Observadores: quem enxerga o quê ──────────────────────────────────────

/**
 * Competência do observador naquele domínio, 0-1. Um ferreiro não avalia
 * esgrima como um Hashira avalia. Quem não entende nada ainda vê "foi bom",
 * mas não distingue bom de excepcional.
 */
export function competenciaObservador(
  content: ContentBundle,
  camp: Campaign,
  npc: NPC,
  d: Dominio,
): number {
  let c = 0.15; // civil: percebe que foi impressionante, e só
  const ensina = content.mestres.find(m => m.id === npc.ensinaMestre);
  if (ensina) {
    const artes = ensina.ensina.map(id => content.artes.find(a => a.id === id));
    if (artes.some(a => a && dominioDaArte(a.tecnica?.estilo) === d)) c = 0.9;
    else c = 0.5;
  }
  if (d === 'espada' && npc.combatente) c = Math.max(c, npc.combatente.nichirin ? 0.8 : 0.5);
  if (d === 'arcano' && npc.combatente?.tecnicas?.length) c = Math.max(c, 0.55);
  const prestigio = camp.vivo?.pessoas[npc.id]?.prestigio ?? 0;
  return Math.min(1, c + prestigio / 400);
}

/**
 * Viés pessoal estável do observador, -10 a +10. Nasce do id, então a mesma
 * pessoa é sempre igualmente cética — e não é sorteado a cada cena.
 */
function viesDe(npcId: string): number {
  return ((seedFromString(`vies:${npcId}`) % 2001) / 100) - 10;
}

function crenca(a: AptidaoState, npcId: string, d: Dominio): Crenca {
  const doNpc = (a.crencas[npcId] ??= {});
  return (doNpc[d] ??= { valor: 0, confianca: 0, suspeita: 0, ultimoDia: 0, observacoes: 0 });
}

export function crencaDe(camp: Campaign, npcId: string, d: Dominio): Crenca | undefined {
  return camp.aptidao?.crencas[npcId]?.[d];
}

// ── Demonstração: a única forma de o mundo aprender qualquer coisa ────────

export type Demonstracao = {
  dominio: Dominio;
  /** Dificuldade do que foi feito, 0-100. */
  dificuldade: number;
  sucesso: boolean;
  /** NPCs que presenciaram. Sem testemunha, não há exposição. */
  testemunhas: NPC[];
  /** Marca demonstrações que o próprio jogador não escolheu esconder. */
  publico?: boolean;
};

/**
 * Registra o que foi visto. Atualiza a crença de cada testemunha conforme a
 * competência DELA, o viés DELA e a relação DELA com o protagonista — nunca
 * consultando a aptidão real.
 */
export function registrarDemonstracao(
  content: ContentBundle,
  camp: Campaign,
  demo: Demonstracao,
): void {
  const a = estadoAptidao(camp);
  const d = demo.dominio;
  const dia = camp.calendario.dia;

  // O sinal é o desempenho aparente: o que foi enfrentado, e se deu certo.
  const sinal = Math.max(0, Math.min(100, demo.dificuldade * (demo.sucesso ? 1 : 0.35)));

  // Conter-se corta a exposição pela raiz, e é decisão do jogador.
  const fator = a.ocultando ? 0.2 : 1;
  const testemunhas = demo.testemunhas.filter(n => camp.npcState[n.id]?.vivo !== false);

  if (testemunhas.length && demo.publico !== false) {
    const ganho = fator * (0.6 + testemunhas.length * 0.25) * (sinal / 100) * 1.4;
    a.exposicao[d] = Math.min(100, a.exposicao[d] + ganho);
  }

  for (const npc of testemunhas) {
    const comp = competenciaObservador(content, camp, npc, d);
    const c = crenca(a, npc.id, d);
    const disposicao = camp.npcState[npc.id]?.eixos.disposicao ?? 0;

    // Quem não gosta de você desconta; quem gosta arredonda para cima.
    const vies = viesDe(npc.id) + disposicao * 0.25;
    // Observador incompetente comprime tudo para o meio: para ele, todo
    // espadachim bom parece igualmente bom.
    const percebido = Math.max(0, Math.min(100, 50 + (sinal - 50) * (0.35 + comp * 0.65) + vies));

    const peso = comp * fator;
    c.valor += (percebido - c.valor) * (peso / (1 + c.confianca / 45));
    c.confianca = Math.min(100, c.confianca + 6 * comp + 1);
    c.observacoes += 1;
    c.ultimoDia = dia;

    // Especialista percebe o descompasso: desempenho alto demais para a
    // bagagem aparente. Isso é suspeita de talento, não certeza de aptidão.
    const bagagem = a.sessoes[d] + a.exposicao[d];
    if (comp >= 0.5 && percebido > 45 && bagagem < percebido * 0.9) {
      c.suspeita = Math.min(100, c.suspeita + comp * (percebido - bagagem) * 0.12);
    }
  }

  atualizarReputacao(camp);
  reagirAoTalento(content, camp, d);
}

/**
 * Observação de RITMO de aprendizado — o que faz um mestre desconfiar antes
 * de qualquer demonstração pública. Compara maestria alcançada com número de
 * sessões gastas.
 */
function observarRitmo(content: ContentBundle, camp: Campaign, npcId: string, d: Dominio): void {
  const a = estadoAptidao(camp);
  const npc = [...content.npcs, ...(camp.npcsProcedurais ?? [])].find(n => n.id === npcId);
  if (!npc) return;
  const comp = competenciaObservador(content, camp, npc, d);
  if (comp < 0.4) return; // quem não entende do assunto não mede ritmo

  const m = maestriaDe(camp, d);
  const sessoes = Math.max(1, a.sessoes[d]);
  const ritmo = m / sessoes;
  const c = crenca(a, npcId, d);
  c.observacoes += 1;
  c.ultimoDia = camp.calendario.dia;
  c.confianca = Math.min(100, c.confianca + 4 * comp);
  // O ritmo de um aprendiz comum fica perto de 0,9 ponto por sessão.
  if (ritmo > 1.35) c.suspeita = Math.min(100, c.suspeita + comp * (ritmo - 1.35) * 22);
  c.valor += (m - c.valor) * comp * 0.5;
}

// ── Reputação e fama ──────────────────────────────────────────────────────

/**
 * Reputação pública é a média das crenças de quem observou, pesada pela
 * confiança de cada um, e limitada pela exposição: ninguém pode ser famoso
 * por algo que nunca mostrou.
 */
function atualizarReputacao(camp: Campaign): void {
  const a = estadoAptidao(camp);
  for (const d of DOMINIOS) {
    let soma = 0;
    let peso = 0;
    for (const doNpc of Object.values(a.crencas)) {
      const c = doNpc[d];
      if (!c || c.observacoes === 0) continue;
      const w = 0.2 + c.confianca / 100;
      soma += c.valor * w;
      peso += w;
    }
    const media = peso > 0 ? soma / peso : 0;
    const teto = a.exposicao[d];
    a.reputacao[d] += (Math.min(media, teto) - a.reputacao[d]) * 0.35;
    a.reputacao[d] = Math.max(0, Math.min(100, a.reputacao[d]));
    const picoAnterior = a.picoReputacao[d] ?? 0;
    a.picoReputacao[d] = Math.max(picoAnterior, a.reputacao[d]);

    // Limiar social: o nome reconhecido. Diferente de todos os outros
    // Despertares — este não depende do que você É, e sim do que o mundo
    // passou a acreditar. Chegar aqui exige exposição real (a reputação é
    // limitada por ela) e observadores que confiem no que viram; ninguém se
    // torna nome conhecido treinando sozinho num celeiro.
    if (picoAnterior < LIMIAR_NOME_CONHECIDO && a.picoReputacao[d] >= LIMIAR_NOME_CONHECIDO) {
      concederDespertar(camp, 'nome_conhecido', `seu nome passou a ser dito em ${NOME_DOMINIO[d]} sem que você precise estar presente`);
    }
  }
}

/**
 * Tique diário. A fama persegue a reputação com atraso e alcance limitado
 * pelo mundo que o personagem realmente percorreu; sem novidade, esfria.
 */
export function processarAptidao(content: ContentBundle, camp: Campaign): void {
  const a = camp.aptidao;
  if (!a) return;
  const alcance = Math.min(1, 0.25 + camp.locaisVisitados.length / 18);
  for (const d of DOMINIOS) {
    const alvo = a.reputacao[d] * alcance;
    a.fama[d] += (alvo - a.fama[d]) * (alvo > a.fama[d] ? 0.02 : 0.006);
    a.fama[d] = Math.max(0, Math.min(100, a.fama[d]));
    // Exposição envelhece: façanha antiga vira história, não prova. E a
    // reputação não pode sobreviver à exposição que a sustentava — sem
    // novidade, ela esfria junto. A fama é que fica para trás, e de propósito
    // (é o que `picoReputacao` guarda).
    a.exposicao[d] = Math.max(0, a.exposicao[d] - 0.015);
    a.reputacao[d] = Math.min(a.reputacao[d], a.exposicao[d]);
    reagirAoTalento(content, camp, d);
  }
}

// ── O mundo reagindo ──────────────────────────────────────────────────────

const DEGRAUS: { reputacao: number; fama: number; texto: (dom: string) => string }[] = [
  {
    reputacao: 30, fama: 0,
    texto: dom => `Comentam nos treinos que apareceu alguém com mão boa para ${dom}.`,
  },
  {
    reputacao: 50, fama: 20,
    texto: dom => `Uma casa de instrução mandou perguntar quem é o forasteiro de ${dom}. Falam em convite.`,
  },
  {
    reputacao: 68, fama: 40,
    texto: dom => `O nome do protagonista chegou a quem decide: há interesse em patrocinar — e há quem prefira ver esse talento de ${dom} parado.`,
  },
  {
    reputacao: 84, fama: 62,
    texto: dom => `Falam do protagonista como se fosse lenda em ${dom}. Vêm desafios, vêm propostas, e vem gente que só quer medir.`,
  },
];

/** Dispara, no máximo uma vez cada, os degraus de reação já merecidos. */
function reagirAoTalento(content: ContentBundle, camp: Campaign, d: Dominio): void {
  const a = camp.aptidao;
  if (!a || !camp.vivo) return;
  for (let i = 0; i < DEGRAUS.length; i++) {
    const deg = DEGRAUS[i];
    if (a.reputacao[d] < deg.reputacao || a.fama[d] < deg.fama) continue;
    if (a.reacoes.some(r => r.dominio === d && r.degrau === i)) continue;
    a.reacoes.push({ dominio: d, degrau: i, dia: camp.calendario.dia });
    const texto = deg.texto(NOME_DOMINIO[d]);
    registrarFato(camp, {
      tipo: 'talento_reconhecido',
      local: camp.localAtual,
      texto,
      atores: ['jogador'],
      publico: true,
    });
    registrarMarco(camp, texto);
    // Degraus altos mexem em quem manda: interesse e atrito, não só elogio.
    if (i >= 2) {
      for (const f of content.faccoes) {
        if (['onis'].includes(f.id)) continue;
        camp.reputacao[f.id] = (camp.reputacao[f.id] ?? 0) + (i >= 3 ? 2 : 1);
      }
    }
    void content;
  }
}

// ── Decisão do jogador: mostrar ou esconder ───────────────────────────────

export function alternarOcultacao(camp: Campaign): boolean {
  const a = estadoAptidao(camp);
  a.ocultando = !a.ocultando;
  registrarMarco(
    camp,
    a.ocultando
      ? 'você decidiu se conter: mostrar menos do que sabe, e deixar que subestimem'
      : 'você parou de se conter — daqui para a frente, quem olhar vai ver',
  );
  return a.ocultando;
}

// ── O que sai daqui para fora ─────────────────────────────────────────────

/**
 * Pacote para narrador e UI. **Nunca inclui `aptidao`.** O narrador só pode
 * dizer que alguém reconheceu talento se a engine registrou a crença.
 */
export function contextoDeAptidao(camp: Campaign): {
  ocultando: boolean;
  dominios: { dominio: string; maestria: number; reputacao: number; fama: number }[];
  quemDesconfia: { dominio: string; observacoes: number }[];
} | undefined {
  const a = camp.aptidao;
  if (!a) return undefined;
  const dominios = DOMINIOS
    .map(d => ({
      dominio: NOME_DOMINIO[d],
      maestria: Math.round(maestriaPorEsforco(a.esforco[d])),
      reputacao: Math.round(a.reputacao[d]),
      fama: Math.round(a.fama[d]),
    }))
    .filter(x => x.maestria >= 5 || x.reputacao >= 5);

  const quemDesconfia = DOMINIOS
    .map(d => ({
      dominio: NOME_DOMINIO[d],
      observacoes: Object.values(a.crencas).filter(c => (c[d]?.suspeita ?? 0) >= 30).length,
    }))
    .filter(x => x.observacoes > 0);

  return { ocultando: a.ocultando, dominios, quemDesconfia };
}

/**
 * Leitura de um observador específico, em palavras — para diálogo e para o
 * pacote do narrador. Sai da crença dele, não da verdade.
 */
export function leituraDoObservador(camp: Campaign, npcId: string, d: Dominio): string | undefined {
  const c = crencaDe(camp, npcId, d);
  if (!c || c.observacoes === 0) return undefined;
  const nome = NOME_DOMINIO[d];
  const nivel =
    c.valor >= 85 ? `é dos melhores que já viu em ${nome}` :
    c.valor >= 65 ? `é muito bom em ${nome}` :
    c.valor >= 40 ? `se defende bem em ${nome}` :
    c.valor >= 18 ? `tem alguma noção de ${nome}` :
    `não impressiona em ${nome}`;
  const certeza = c.confianca >= 60 ? 'tem certeza de que' : c.confianca >= 25 ? 'acha que' : 'desconfia que';
  const extra = c.suspeita >= 45 ? ' — e acha que aprendeu rápido demais para ser só treino' : '';
  return `${certeza} você ${nivel}${extra}`;
}

/** Só para testes e ferramentas internas. Não use em UI nem no narrador. */
export function aptidaoRealParaTestes(camp: Campaign, d: Dominio): number {
  return estadoAptidao(camp).aptidao[d];
}
