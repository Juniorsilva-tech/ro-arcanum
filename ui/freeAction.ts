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

export function classificarAcaoLivre(
  texto: string,
  content: ContentBundle,
  ctx?: Contexto,
): { verboId: string; alvoId?: string } | null {
  const t = normalizar(texto);

  // Encontra o verbo cuja palavra-chave melhor casa (a mais longa vence).
  let melhor: { verbo: string; peso: number } | null = null;
  for (const entrada of MAPA) {
    for (const palavra of entrada.palavras) {
      if (t.includes(palavra) && (!melhor || palavra.length > melhor.peso)) {
        melhor = { verbo: entrada.verbo, peso: palavra.length };
      }
    }
  }
  if (!melhor) return null;

  const verbo = content.verbos.find((v) => v.id === melhor!.verbo);
  if (!verbo) return null;

  // Tenta achar um alvo citado pelo nome, entre os presentes.
  let alvoId: string | undefined;
  if (ctx) {
    const citado = ctx.presentes.find((n) => t.includes(n.nome.toLowerCase().split(',')[0].split(' ')[0]));
    alvoId = citado?.id ?? (verbo.alvo === 'pessoa' ? ctx.presentes[0]?.id : undefined);
  }

  return { verboId: verbo.id, alvoId };
}
