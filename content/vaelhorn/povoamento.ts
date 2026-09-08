// ARCANUM · Quem mora nos lugares.
//
// O censo que motivou este arquivo: 58 pessoas com identidade para uma
// população escalar de 1320, e dezessete dos vinte e dois assentamentos sem
// **uma única** pessoa com nome dentro. Tessel tinha cerco, marechal e lista de
// leva escritos na história do lugar, e ninguém para falar com o jogador.
//
// `populacao: 372` é o inteiro 372 — massa que produz, adoece e migra como
// estatística. Isso continua existindo e é barato. O que faltava era a camada
// de cima: gente com nome, ofício, voz e, às vezes, um segredo.
//
// Duas decisões que valem explicar:
//
// 1. O elenco é gerado, mas é CONTEÚDO, não estado de campanha. A semente vem
//    do id do lugar, então Tessel tem exatamente as mesmas pessoas em toda
//    campanha, como se tivessem sido escritas à mão. Não incha o save e não
//    vira sorteio por partida.
// 2. A densidade acompanha o porte. Cidade tem que dar sensação de gente:
//    quem manda, quem guarda, quem vende, quem cura, quem rouba. Aldeia tem
//    ancião e pouco mais. Vinte pessoas numa aldeia de trinta almas seria tão
//    falso quanto uma cidade com três.
import type { Local, NPC } from '../../engine/types';
import { createRng, nextFloat, nextInt, pick, seedFromString } from '../../engine/rng';
import type { RngState } from '../../engine/types';

// ── Vocabulário de nomes ──────────────────────────────────────────────────
const PROPRIOS = [
  'Aldric', 'Bela', 'Corin', 'Davet', 'Elna', 'Ferran', 'Gilda', 'Hedra', 'Ivo', 'Jorna',
  'Kalen', 'Lira', 'Maud', 'Nevin', 'Orla', 'Perin', 'Quilda', 'Roan', 'Sela', 'Tavro',
  'Urda', 'Veski', 'Wenna', 'Ysolt', 'Bran', 'Cera', 'Dorn', 'Eda', 'Fenn', 'Greta',
  'Halvo', 'Ilsa', 'Jarek', 'Ketta', 'Loris', 'Mira', 'Nolan', 'Ondra', 'Pell', 'Rhea',
  'Sabra', 'Torv', 'Ulla', 'Vidar', 'Wyn', 'Yara', 'Zeno', 'Ansel', 'Brida', 'Calder',
];
const ALCUNHAS = [
  'da Ponte', 'de Baixo', 'o Torto', 'a Ruiva', 'Mão-Curta', 'Boca-Seca', 'o Manco',
  'da Estrada', 'Meia-Orelha', 'a Velha', 'o Novo', 'Pé-de-Ferro', 'a Calada',
  'Sete-Dedos', 'do Norte', 'o Gordo', 'a Magra', 'Olho-Vivo', 'Bico-Fino', 'o Surdo',
];

const INDOLES = [
  'desconfiada com forasteiro e leal com quem prova o contrário',
  'falastrona, sabe de tudo e conta metade',
  'seca no trato e correta na conta',
  'medrosa por experiência, não por natureza',
  'ambiciosa de um jeito que não disfarça bem',
  'cansada, faz o serviço e não quer confusão',
  'orgulhosa do ofício e intolerante com desleixo',
  'generosa até o limite do próprio prato',
  'ressentida com quem subiu na vida',
  'curiosa demais para a própria segurança',
  'devota de um jeito áspero, sem doçura',
  'calculista e educada, o que assusta mais',
];
const VOZES = [
  'fala baixo e obriga o outro a chegar perto',
  'fala rápido, atropela as próprias frases',
  'usa provérbio para tudo, mesmo quando não cabe',
  'responde com pergunta',
  'trata todo mundo por apelido no primeiro minuto',
  'mede cada palavra como se custasse dinheiro',
  'ri antes de dizer coisa séria',
  'repete a última palavra de quem fala com ela',
];
const CORPOS = [
  'Mãos grossas de quem trabalha com elas todo dia.',
  'Magro de fome antiga; a roupa sobra nos ombros.',
  'Encorpada, ombros largos, postura de quem carrega peso.',
  'Baixo, atarracado, com uma cicatriz clara no queixo.',
  'Alta e curvada de tanto se abaixar em porta baixa.',
  'Rosto queimado de sol e olhos apertados por hábito.',
  'Cabelo grisalho preso às pressas, dedos manchados do ofício.',
  'Jovem demais para o cargo, e ciente disso.',
];

// ── Papéis por porte ──────────────────────────────────────────────────────
//
// Os ofícios vão no feminino porque essa é a premissa do cenário — o vale é
// das mulheres — e `selftest.ts` reprova elenco com ofício masculino. Não é
// detalhe de estilo: é regra de mundo, com trava automática.
//
// Cada papel diz o que a pessoa é, com que facção se alinha e se ela carrega
// segredo. Cidade recebe o elenco inteiro; aldeia recebe o começo da lista.
/**
 * O ritmo do dia de um ofício, em seis casas: madrugada, manhã, tarde,
 * entardecer, anoitecer, noite.
 *
 *   'casa'    — o próprio assentamento
 *   'campo'   — o vizinho aberto: campo, estrada, floresta, lago
 *   'retiro'  — o vizinho recolhido: cripta, ruína, mata, onde se some
 *
 * `localEfetivo` resolve presença por `rotina[periodo] ?? localBase`. Sem
 * rotina a pessoa fica no mesmo lugar às três da manhã e ao meio-dia, o que
 * apaga a diferença entre procurar alguém de dia e à noite — e tira o sentido
 * de privacidade, de vigia e de encontro.
 */
type Ponto = 'casa' | 'campo' | 'retiro';
type Ritmo = [Ponto, Ponto, Ponto, Ponto, Ponto, Ponto];

const RITMO_DIURNO: Ritmo = ['casa', 'casa', 'casa', 'casa', 'casa', 'casa'];
const RITMO_LAVOURA: Ritmo = ['casa', 'campo', 'campo', 'campo', 'casa', 'casa'];
const RITMO_TAVERNA: Ritmo = ['casa', 'casa', 'casa', 'casa', 'casa', 'casa'];
const RITMO_RONDA: Ritmo = ['casa', 'casa', 'campo', 'campo', 'casa', 'casa'];
const RITMO_NOTURNO: Ritmo = ['retiro', 'retiro', 'retiro', 'casa', 'casa', 'casa'];
const RITMO_ERRANTE: Ritmo = ['casa', 'campo', 'campo', 'casa', 'retiro', 'retiro'];

type Papel = {
  ocupacao: string;
  faccao: string;
  /** Peso de chance de a pessoa carregar um segredo ligado ao lugar. */
  segredo?: number;
  combatente?: boolean;
  /** Onde ela está a cada período do dia. Padrão: fica no assentamento. */
  ritmo?: Ritmo;
};

const PAPEIS_CIDADE: Papel[] = [
  { ocupacao: 'senhora da cidade', faccao: 'senhorio', segredo: 0.8, ritmo: RITMO_DIURNO },
  { ocupacao: 'capitã da guarda', faccao: 'guarda', segredo: 0.5, combatente: true, ritmo: RITMO_RONDA },
  { ocupacao: 'mestra de guilda', faccao: 'vila', segredo: 0.7, ritmo: RITMO_DIURNO },
  { ocupacao: 'lojista de secos e molhados', faccao: 'vila', ritmo: RITMO_DIURNO },
  { ocupacao: 'armeira', faccao: 'vila', ritmo: RITMO_DIURNO },
  { ocupacao: 'curandeira', faccao: 'vila', segredo: 0.4, ritmo: RITMO_RONDA },
  { ocupacao: 'taverneira', faccao: 'vila', segredo: 0.6, ritmo: RITMO_TAVERNA },
  { ocupacao: 'escrivã do registro', faccao: 'senhorio', segredo: 0.5, ritmo: RITMO_DIURNO },
  { ocupacao: 'campeã de arena', faccao: 'guarda', combatente: true, ritmo: RITMO_RONDA },
  { ocupacao: 'chefe do crime local', faccao: 'ladroes', segredo: 0.9, combatente: true, ritmo: RITMO_NOTURNO },
  { ocupacao: 'batedora de carteira', faccao: 'ladroes', ritmo: RITMO_NOTURNO },
  { ocupacao: 'agiota', faccao: 'ladroes', segredo: 0.6, ritmo: RITMO_NOTURNO },
  { ocupacao: 'carregadora do cais', faccao: 'vila', ritmo: RITMO_LAVOURA },
  { ocupacao: 'mendiga que vê tudo', faccao: 'foragidos', segredo: 0.7, ritmo: RITMO_DIURNO },
  { ocupacao: 'estalajadeira do bairro de fora', faccao: 'vila', segredo: 0.4, ritmo: RITMO_TAVERNA },
  { ocupacao: 'boticária de fundos', faccao: 'vila', segredo: 0.7, ritmo: RITMO_NOTURNO },
  { ocupacao: 'cocheira de aluguel', faccao: 'vila', ritmo: RITMO_ERRANTE },
  { ocupacao: 'pregoeira do registro', faccao: 'senhorio', ritmo: RITMO_DIURNO },
  { ocupacao: 'veterana de guerra sem posto', faccao: 'foragidos', segredo: 0.6, combatente: true, ritmo: RITMO_RONDA },
  { ocupacao: 'contrabandista de fronteira', faccao: 'ladroes', segredo: 0.8, ritmo: RITMO_NOTURNO },
];

const PAPEIS_VILA: Papel[] = [
  { ocupacao: 'chefe da vila', faccao: 'vila', segredo: 0.6, ritmo: RITMO_DIURNO },
  { ocupacao: 'ferreira', faccao: 'vila', ritmo: RITMO_DIURNO },
  { ocupacao: 'taverneira', faccao: 'vila', segredo: 0.5, ritmo: RITMO_TAVERNA },
  { ocupacao: 'curandeira', faccao: 'vila', segredo: 0.3, ritmo: RITMO_RONDA },
  { ocupacao: 'guarda da vila', faccao: 'guarda', combatente: true, ritmo: RITMO_RONDA },
  { ocupacao: 'ladra conhecida de todos', faccao: 'ladroes', segredo: 0.7, ritmo: RITMO_NOTURNO },
  { ocupacao: 'tropeira', faccao: 'vila', ritmo: RITMO_ERRANTE },
  { ocupacao: 'moleira do povoado', faccao: 'vila', ritmo: RITMO_LAVOURA },
  { ocupacao: 'caçadora de peles', faccao: 'vila', combatente: true, ritmo: RITMO_ERRANTE },
];

const PAPEIS_ALDEIA: Papel[] = [
  { ocupacao: 'anciã da aldeia', faccao: 'vila', segredo: 0.5, ritmo: RITMO_DIURNO },
  { ocupacao: 'lavradora de mão pesada', faccao: 'vila', ritmo: RITMO_LAVOURA },
  { ocupacao: 'benzedeira', faccao: 'vila', segredo: 0.4, ritmo: RITMO_RONDA },
  { ocupacao: 'moça que some por dias', faccao: 'foragidos', segredo: 0.6, ritmo: RITMO_NOTURNO },
  { ocupacao: 'pastora que dorme fora', faccao: 'vila', ritmo: RITMO_LAVOURA },
];

const PAPEIS_PARADA: Papel[] = [
  { ocupacao: 'dona da parada', faccao: 'vila', segredo: 0.7, ritmo: RITMO_TAVERNA },
  { ocupacao: 'chefe de caravana', faccao: 'vila', segredo: 0.5, ritmo: RITMO_ERRANTE },
  { ocupacao: 'escolta de comboio', faccao: 'guarda', combatente: true, ritmo: RITMO_ERRANTE },
  { ocupacao: 'viajante de passagem que não diz de onde vem', faccao: 'foragidos', segredo: 0.8, ritmo: RITMO_NOTURNO },
];

// Forja escondida nao e' povoado: e' oficina. Duas pessoas, e ja e' muita.
const PAPEIS_FORJA: Papel[] = [
  { ocupacao: 'ferreira mestra', faccao: 'cacadores', segredo: 0.8, ritmo: RITMO_DIURNO },
  { ocupacao: 'aprendiz de forja', faccao: 'cacadores', segredo: 0.3, ritmo: RITMO_DIURNO },
];

const PAPEIS_POSTO: Papel[] = [
  { ocupacao: 'comandante do posto', faccao: 'guarda', segredo: 0.6, combatente: true, ritmo: RITMO_DIURNO },
  { ocupacao: 'sargenta veterana', faccao: 'guarda', combatente: true, ritmo: RITMO_RONDA },
  { ocupacao: 'cozinheira da guarnição', faccao: 'guarda', segredo: 0.4, ritmo: RITMO_DIURNO },
  { ocupacao: 'recruta que não devia estar aqui', faccao: 'guarda', ritmo: RITMO_RONDA },
];

/** Quantas pessoas com nome cada porte comporta, e com que elenco. */
function elencoDoLugar(tipo: string): { papeis: Papel[]; quantos: number } {
  switch (tipo) {
    case 'cidade': return { papeis: PAPEIS_CIDADE, quantos: 20 };
    case 'porto':
    case 'mercado': return { papeis: PAPEIS_CIDADE, quantos: 10 };
    case 'vila': return { papeis: PAPEIS_VILA, quantos: 9 };
    case 'forte': return { papeis: PAPEIS_POSTO, quantos: 4 };
    case 'acampamento': return { papeis: PAPEIS_PARADA, quantos: 4 };
    case 'forja': return { papeis: PAPEIS_FORJA, quantos: 2 };
    case 'aldeia': return { papeis: PAPEIS_ALDEIA, quantos: 5 };
    default: return { papeis: [], quantos: 0 };
  }
}

// ── Segredos costurados na história do lugar ──────────────────────────────
//
// O segredo não é genérico: ele se apoia no que o lugar já carrega em
// `Local.historia`. Assim, descobrir uma pessoa é descobrir o lugar.
function segredoDoLugar(rng: RngState, local: Local, papel: Papel): NPC['segredo'] | undefined {
  const base = local.historia?.length ? pick(rng, local.historia) : undefined;
  if (!base) return undefined;
  const conteudo = pick(rng, [
    `Sabe a parte que não se conta sobre isto: ${base.toLowerCase()}`,
    `Esteve envolvida no que ficou registrado assim: ${base.toLowerCase()}`,
    `Guarda prova do que aconteceu — ${base.toLowerCase()}`,
    `Mentiu no depoimento da época. ${base}`,
  ]);
  const comoDescobrir = pick(rng, [
    'beber com ela até tarde, sem pressa',
    'mostrar que você já sabe metade',
    'fazer um favor que ela não pediu',
    'pegá-la sozinha, longe de quem a conhece',
    'pagar o que ela deve a outra pessoa',
  ]);
  void papel;
  return { conteudo, comoDescobrir };
}

// ── Traduzir ritmo em lugares de verdade ──────────────────────────────────
//
// 'campo' e 'retiro' viram vizinhos REAIS do assentamento, escolhidos pelo
// tipo do lugar. Nunca um lugar oculto: mandar uma taverneira dormir na forja
// secreta entregaria de graça o que a sessão 14 acabou de esconder.
const TIPOS_ABERTOS = new Set(['campo', 'estrada', 'floresta', 'lago', 'praca', 'mercado', 'colina', 'porto']);
const TIPOS_RECOLHIDOS = new Set(['ruina', 'cripta', 'cemiterio', 'pantano', 'mina', 'floresta', 'passo', 'torre']);

type Vizinhanca = { campo: string; retiro: string };

function vizinhancaDe(local: Local, porId: Map<string, Local>): Vizinhanca {
  const vizinhos = local.rotas
    .map(r => porId.get(r.destino))
    .filter((l): l is Local => !!l && !l.oculto);
  const aberto = vizinhos.find(l => TIPOS_ABERTOS.has(l.tipo));
  const recolhido = vizinhos.find(l => TIPOS_RECOLHIDOS.has(l.tipo));
  return {
    campo: aberto?.id ?? vizinhos[0]?.id ?? local.id,
    retiro: recolhido?.id ?? vizinhos[vizinhos.length - 1]?.id ?? local.id,
  };
}

const PERIODOS_DIA = ['madrugada', 'manha', 'tarde', 'entardecer', 'anoitecer', 'noite'] as const;

function rotinaDe(ritmo: Ritmo | undefined, local: Local, viz: Vizinhanca): NPC['rotina'] {
  const usado = ritmo ?? RITMO_DIURNO;
  const rotina: NPC['rotina'] = {};
  usado.forEach((ponto, i) => {
    rotina[PERIODOS_DIA[i]] =
      ponto === 'casa' ? local.id : ponto === 'campo' ? viz.campo : viz.retiro;
  });
  return rotina;
}

function nomeUnico(rng: RngState, usados: Set<string>): string {
  for (let i = 0; i < 40; i++) {
    const n = nextFloat(rng) < 0.45
      ? `${pick(rng, PROPRIOS)} ${pick(rng, ALCUNHAS)}`
      : pick(rng, PROPRIOS);
    if (!usados.has(n)) { usados.add(n); return n; }
  }
  const fallback = `${pick(rng, PROPRIOS)} ${usados.size}`;
  usados.add(fallback);
  return fallback;
}

/**
 * Gera o elenco de um lugar. Determinístico pelo id: Tessel tem sempre a mesma
 * gente, em toda campanha, como se tivesse sido escrita à mão.
 */
function povoar(local: Local, faccoesValidas: Set<string>, usados: Set<string>, porId: Map<string, Local>): NPC[] {
  const { papeis, quantos } = elencoDoLugar(local.tipo);
  if (!papeis.length) return [];
  const rng = createRng(seedFromString(`povoamento:${local.id}`));
  const viz = vizinhancaDe(local, porId);
  const saida: NPC[] = [];

  for (let i = 0; i < Math.min(quantos, papeis.length); i++) {
    const papel = papeis[i];
    const faccao = faccoesValidas.has(papel.faccao) ? papel.faccao : 'vila';
    const nome = nomeUnico(rng, usados);
    const temSegredo = papel.segredo !== undefined && nextFloat(rng) < papel.segredo;
    const npc: NPC = {
      id: `morador_${local.id}_${i}`,
      nome,
      idade: nextInt(rng, 19, 64),
      ocupacao: papel.ocupacao,
      faccaoId: faccao,
      localBase: local.id,
      rotina: rotinaDe(papel.ritmo, local, viz),
      vozNarrativa: pick(rng, VOZES),
      personalidade: pick(rng, INDOLES),
      corpo: pick(rng, CORPOS),
      segredo: temSegredo ? segredoDoLugar(rng, local, papel) : undefined,
      relacoes: [],
    };
    if (papel.combatente) {
      const grau = local.tipo === 'cidade' ? 3 : local.tipo === 'forte' ? 2 : 1;
      npc.combatente = {
        vida: 30 + grau * 12,
        defesa: 12 + grau,
        acerto: 11 + grau,
        dano: { base: 6 + grau * 2, dispersao: 0.3, tipo: 'cortante' },
        tecnicas: [],
      };
    }
    saida.push(npc);
  }

  // Gente de um lugar se conhece. Duas ligações por pessoa bastam para o
  // convívio produzir acontecimento sem o jogador (ver engine/convivio.ts).
  for (const npc of saida) {
    const outros = saida.filter(o => o.id !== npc.id);
    if (!outros.length) continue;
    const quantas = Math.min(2, outros.length);
    const escolhidos = new Set<string>();
    for (let i = 0; i < quantas; i++) {
      const o = pick(rng, outros);
      if (escolhidos.has(o.id)) continue;
      escolhidos.add(o.id);
      npc.relacoes!.push({
        npc: o.id,
        tipo: pick(rng, ['aliada', 'rival', 'protege', 'devedora', 'desconfia'] as const),
        nota: pick(rng, [
          'moram na mesma rua há anos',
          'brigaram por causa de dinheiro e nunca resolveram',
          'trabalharam juntos antes de cada um seguir seu rumo',
          'devem um favor um ao outro e ninguém cobra',
          'a família de um serviu a família do outro',
        ]),
      });
    }
  }
  return saida;
}

/**
 * Povoa todos os assentamentos do mapa. Chamada uma vez na montagem do bundle.
 */
export function povoarContinente(locais: Local[], faccoes: { id: string }[]): NPC[] {
  const validas = new Set(faccoes.map(f => f.id));
  const usados = new Set<string>();
  const porId = new Map(locais.map(l => [l.id, l]));
  const saida: NPC[] = [];
  for (const l of locais) saida.push(...povoar(l, validas, usados, porId));
  return saida;
}
