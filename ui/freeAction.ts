// ARCANUM · Ação livre → verbo. A terceira porta (GDD §4).
// Offline, classifica por palavra-chave. Com o modelo ligado, a narração é
// enriquecida depois; a RESOLUÇÃO continua sendo da engine (§4.4).
import type { ContentBundle } from '@/engine/types';
import type { Contexto } from '@/engine';

const MAPA: { verbo: string; palavras: string[] }[] = [
  { verbo: 'dormir', palavras: ['dormir', 'deitar', 'cama', 'descansar a noite'] },
  { verbo: 'descansar', palavras: ['descansar', 'sentar', 'respirar', 'recuperar'] },
  { verbo: 'comer', palavras: ['comer', 'comida', 'refeição', 'refeicao', 'jantar', 'almoçar', 'almocar'] },
  { verbo: 'beber', palavras: ['beber', 'água', 'agua', 'cerveja', 'gole'] },
  { verbo: 'beber_ate_esquecer', palavras: ['bêbado', 'bebado', 'embriagar', 'encher a cara', 'esquecer bebendo'] },
  { verbo: 'rezar', palavras: ['rezar', 'orar', 'oração', 'oracao', 'prece'] },
  { verbo: 'treinar_corpo', palavras: ['treinar', 'exercício', 'exercicio', 'malhar'] },
  { verbo: 'conversar', palavras: ['conversar', 'falar', 'papo', 'puxar assunto', 'perguntar a'] },
  { verbo: 'elogiar', palavras: ['elogiar', 'elogio', 'gabar'] },
  { verbo: 'provocar', palavras: ['provocar', 'zombar', 'debochar'] },
  { verbo: 'flertar', palavras: ['flertar', 'paquerar', 'cantar', 'seduzir'] },
  { verbo: 'mentir', palavras: ['mentir', 'mentira', 'enganar'] },
  { verbo: 'ameacar', palavras: ['ameaçar', 'ameacar', 'intimidar', 'assustar'] },
  { verbo: 'presentear', palavras: ['presentear', 'presente', 'dar um', 'oferecer'] },
  { verbo: 'consolar', palavras: ['consolar', 'confortar', 'acalmar'] },
  { verbo: 'trabalhar', palavras: ['trabalhar', 'trabalho', 'bico', 'ganhar dinheiro'] },
  { verbo: 'apostar', palavras: ['apostar', 'aposta', 'jogo', 'dados', 'cartas'] },
  { verbo: 'pedir_esmola', palavras: ['esmola', 'mendigar', 'pedir moeda'] },
  { verbo: 'furtar', palavras: ['furtar', 'roubar', 'surrupiar'] },
  { verbo: 'bater_carteira', palavras: ['carteira', 'batedor de carteira', 'punga'] },
  { verbo: 'arrombar', palavras: ['arrombar', 'forçar a fechadura', 'forcar a fechadura', 'gazua'] },
  { verbo: 'agredir', palavras: ['agredir', 'bater', 'socar', 'atacar', 'brigar'] },
  { verbo: 'cacar', palavras: ['caçar', 'cacar', 'procurar briga', 'arrumar briga'] },
  { verbo: 'subornar', palavras: ['subornar', 'suborno', 'comprar o silêncio', 'comprar o silencio'] },
  { verbo: 'chantagear', palavras: ['chantagear', 'chantagem'] },
  { verbo: 'estudar', palavras: ['estudar', 'ler', 'livro', 'grimório', 'grimorio'] },
  { verbo: 'procurar_mestre', palavras: ['mestre', 'professor', 'aprender com'] },
  { verbo: 'examinar', palavras: ['examinar', 'olhar', 'inspecionar', 'analisar'] },
  { verbo: 'revistar', palavras: ['revistar', 'vasculhar', 'procurar em'] },
  { verbo: 'vigiar', palavras: ['vigiar', 'observar', 'espreitar'] },
  { verbo: 'escutar_escondido', palavras: ['escutar', 'ouvir escondido', 'espionar'] },
  { verbo: 'perguntar_por_ai', palavras: ['perguntar por aí', 'perguntar por ai', 'boato', 'fofoca', 'informação', 'informacao'] },
  { verbo: 'esconder_se', palavras: ['esconder', 'sumir', 'ocultar-se'] },
  { verbo: 'esperar', palavras: ['esperar', 'aguardar', 'passar o tempo'] },
  { verbo: 'conjurar', palavras: ['conjurar', 'lançar magia', 'lancar magia', 'feitiço', 'feitico'] },
  { verbo: 'realizar_ritual', palavras: ['ritual', 'invocar'] },
  { verbo: 'ler_presagios', palavras: ['presságio', 'presagio', 'augúrio', 'augurio', 'ler os sinais'] },
];

function normalizar(s: string): string {
  return s.toLowerCase();
}

// Luta de verdade nao e a mesma coisa que um soco. 'agredir' e um verbo
// social: um golpe, medo, reputacao com a guarda — e o turno acaba ali.
// Quem escreve 'matar' ou 'lutar' quer combate com vida, dano e fim.
// Sem esta separacao, 'matar os bandidos' nao casava com verbo nenhum,
// caia na narracao livre e a cena girava no vazio para sempre.
const LETAIS = [
  'matar', 'mato ', 'matando', 'lutar', 'luta', 'duelar', 'duelo',
  'enfrentar', 'combate', 'combater', 'batalha', 'exterminar',
  'acabar com', 'partir para cima', 'meter a mao', 'meter a mão',
];

function temIntencaoLetal(t: string): boolean {
  return LETAIS.some((p) => t.includes(p));
}

// Violência contra quem está na cena vira briga de verdade (engine/briga.ts).
// O mapa acima só tinha o infinitivo: "agrido", "ataco", "soco", "esfaqueio"
// e "chuto" não casavam, e a frase ia crua para o narrador inventar.
const B = '(?<!\\p{L})';
const F = '(?!\\p{L})';
const VIOLENCIA = new RegExp(`${B}(agrid\\p{L}*|agred\\p{L}*|ataq\\p{L}*|atac\\p{L}*|bat(?:o|e|i|eu|er|endo)|soc(?:o|a|ar|ou|ando|am)|murr\\p{L}*|chut\\p{L}*|esbofet\\p{L}*|tapa|espanc\\p{L}*|brig(?:a|o|ar)|parto pra cima|parto para cima|partir pra cima|vou pra cima|pra cima d[aeo]|empurr\\p{L}*|derrub\\p{L}*|golpe\\p{L}*|soquei|chutei|bati|prend(?:o|er)|captur\\p{L}*|amarr\\p{L}*|imobiliz\\p{L}*)${F}`, 'iu');
const LETAL = new RegExp(`${B}(mat(?:o|a|ar|ei|ando|em|ou)|assassin\\p{L}*|esfaque\\p{L}*|apunhal\\p{L}*|degol\\p{L}*|estrangul\\p{L}*|esgan\\p{L}*|chacin\\p{L}*|massacr\\p{L}*|extermin\\p{L}*|cort(?:o|ar) a garganta)${F}`, 'iu');
const ARMA_NA_MAO = new RegExp(`${B}(espada|faca|adaga|lâmina|lamina|machado|punhal|katana|lança|lanca)${F}`, 'iu');
const TODOS = new RegExp(`${B}(todo mundo|todos|todas|todo o mundo|a taverna inteira|o salão inteiro|geral|quem estiver)${F}`, 'iu');
// "Falo com a Elza sobre o ataque" é conversa, não briga.
const CONVERSA = new RegExp(`${B}(sobre|falo|falar|pergunt\\p{L}*|conto|contar|convers\\p{L}*|lembr\\p{L}*|históri\\p{L}*|digo|dizer)${F}`, 'iu');

// Qualquer palavra do nome serve: "Sargenta Bael" é citada como "a Bael".
const NAO_E_NOME = new Set(['das', 'dos', 'que', 'com']);
function citado(t: string, nome: string): boolean {
  const palavras = nome.toLowerCase().split(',')[0].split(/\s+/).filter((p) => p.length >= 3 && !NAO_E_NOME.has(p));
  return palavras.some((p) => new RegExp(`${B}${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${F}`, 'iu').test(t));
}

export type Briga = { alvos: string[]; letal: boolean };

export function classificarBriga(texto: string, ctx?: Contexto): Briga | null {
  if (!ctx?.presentes.length) return null;
  const t = normalizar(texto);
  if (CONVERSA.test(t)) return null;
  const letal = LETAL.test(t);
  if (!letal && !VIOLENCIA.test(t)) return null;
  let alvos = TODOS.test(t) ? ctx.presentes.map((n) => n.id) : ctx.presentes.filter((n) => citado(t, n.nome)).map((n) => n.id);
  // Só uma pessoa na cena: "ataco ela" é com ela. "Mato"/"mata" sozinho é
  // ambíguo (o mato, a mata) — só conta com alvo dito.
  const soMato = letal && /(?<!\p{L})mat[oa](?!\p{L})/iu.test(t) && !LETAL.test(t.replace(/(?<!\p{L})mat[oa](?!\p{L})/giu, ''));
  if (!alvos.length && ctx.presentes.length === 1 && !soMato) alvos = [ctx.presentes[0].id];
  if (!alvos.length) return null;
  return { alvos, letal: letal || ARMA_NA_MAO.test(t) };
}

export function classificarAcaoLivre(
  texto: string,
  content: ContentBundle,
  ctx?: Contexto,
): { verboId: string; alvoId?: string; briga?: Briga } | null {
  const t = normalizar(texto);
  const briga = classificarBriga(texto, ctx);
  if (briga) return { verboId: 'agredir', alvoId: briga.alvos[0], briga };

  // Encontra o verbo cuja palavra-chave melhor casa (a mais longa vence).
  let melhor: { verbo: string; peso: number } | null = null;
  for (const entrada of MAPA) {
    for (const palavra of entrada.palavras) {
      if (t.includes(palavra) && (!melhor || palavra.length > melhor.peso)) {
        melhor = { verbo: entrada.verbo, peso: palavra.length };
      }
    }
  }
  // Intencao letal abre combate de verdade, mesmo que nenhuma palavra do
  // mapa acima tenha casado ('matar os bandidos' nao casava com nada).
  if (temIntencaoLetal(t) && (!melhor || melhor.verbo === 'agredir')) {
    melhor = { verbo: 'cacar', peso: 99 };
  }

  // Agredir precisa de alguem na frente. Sem ninguem presente, quem manda
  // 'atacar' esta procurando briga, nao batendo em ninguem em especifico.
  if (melhor?.verbo === 'agredir' && ctx && ctx.presentes.length === 0) {
    melhor = { verbo: 'cacar', peso: melhor.peso };
  }

  if (!melhor) return null;

  const verbo = content.verbos.find((v) => v.id === melhor!.verbo);
  if (!verbo) return null;

  // Tenta achar um alvo citado pelo nome, entre os presentes.
  let alvoId: string | undefined;
  if (ctx) {
    const quem = ctx.presentes.find((n) => citado(t, n.nome));
    alvoId = quem?.id ?? (verbo.alvo === 'pessoa' ? ctx.presentes[0]?.id : undefined);
  }

  return { verboId: verbo.id, alvoId };
}
