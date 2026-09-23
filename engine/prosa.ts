// ARCANUM · Tipografia da narração.
// O modelo devolve um bloco só de texto. Aqui ele vira parágrafos e falas
// separadas, com quem falou identificado — a interface é que mostra, nunca
// um rótulo escrito no meio do texto (GDD §31: tudo pela interface).

export type Bloco =
  | { tipo: 'prosa'; texto: string }
  | { tipo: 'fala'; texto: string; quem?: string };

// Comprimento a partir do qual um parágrafo sem respiro vira parede de texto.
const LIMITE_PAREDE = 420;
const ALVO_FATIA = 260;

// Quebra o texto em parágrafos, mesmo quando o modelo esquece a linha em branco.
function emParagrafos(bruto: string): string[] {
  const limpo = bruto
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!limpo) return [];

  let partes = limpo.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  // Sem linha em branco nenhuma? Então cada quebra simples já serve.
  if (partes.length === 1 && limpo.includes('\n')) {
    partes = limpo.split(/\n/).map((s) => s.trim()).filter(Boolean);
  }

  // Duas falas grudadas no mesmo parágrafo.
  //
  // O modelo às vezes separa réplicas com UMA quebra de linha em vez de uma
  // linha em branco. Quando isso acontece no meio de um texto que tem linhas
  // em branco em outros lugares, o corte acima não pega — e "— Você não é
  // daqui.\n— Não. Passei a ponte ontem." virava UM bloco, com UM rótulo, com
  // as falas de duas pessoas diferentes dentro. Era o segundo dos dois erros
  // que faziam a tela mentir sobre quem estava falando.
  //
  // Toda linha que começa com travessão é fala de alguém e merece bloco
  // próprio, sempre.
  partes = partes.flatMap((p) => {
    if (!p.includes('\n')) return [p];
    const linhas = p.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!linhas.some((l, i) => i > 0 && RE_TRAVESSAO.test(l))) return [p];
    const junto: string[] = [];
    for (const linha of linhas) {
      if (RE_TRAVESSAO.test(linha) || junto.length === 0) junto.push(linha);
      else junto[junto.length - 1] += ` ${linha}`;
    }
    return junto;
  });

  // Parágrafo gigante sem quebra: fatia em grupos de frases inteiras.
  const out: string[] = [];
  for (const p of partes) {
    if (p.length <= LIMITE_PAREDE) {
      out.push(p);
      continue;
    }
    out.push(...fatiarPorFrases(p));
  }
  return out;
}

// Corta um texto longo em pedaços de frases completas, sem partir no meio.
function fatiarPorFrases(texto: string): string[] {
  const frases = texto.match(/[^.!?…]+[.!?…]+["'”»]?\s*/g) ?? [texto];
  const out: string[] = [];
  let atual = '';
  for (const f of frases) {
    if (atual && atual.length + f.length > ALVO_FATIA) {
      out.push(atual.trim());
      atual = '';
    }
    atual += f;
  }
  if (atual.trim()) out.push(atual.trim());
  return out;
}

// Uma linha é fala quando abre com travessão (o jeito português) ou é toda ela
// um trecho entre aspas.
const RE_TRAVESSAO = /^[—–-]\s*/;
const RE_SO_ASPAS = /^["“«](.+)["”»][.,;!?]?$/s;

// ── Marcador explícito de quem fala ───────────────────────────────────────
//
// A camada zero, e a única que não adivinha nada.
//
// Todo o resto deste arquivo é inferência: tag de verbo, alternância,
// proximidade. Cada uma acerta a maioria e erra alguma — e um erro de
// atribuição não é um detalhe de tipografia, é a tela dizendo que outra pessoa
// falou. Numa cena real do jogo, uma única assinatura perdida logo na primeira
// fala inverteu o diálogo inteiro da conversa.
//
// Por isso o narrador passou a ser obrigado a marcar cada fala com o nome de
// quem fala entre colchetes (ver engine/llm.ts). Quando o marcador vem, ele
// vale sozinho e encerra a decisão. As heurísticas continuam existindo como
// rede para modelos pequenos que ignoram o formato — mas deixam de ser o
// caminho principal.
//
// `[você]` é o jogador: é assim que o narrador se refere a ele o tempo todo,
// e pedir o nome próprio ali só criaria mais uma forma de errar.
const RE_MARCADOR = /^\s*\[\s*([^\]\n]{1,40}?)\s*\]\s*/;
const MARCAS_DO_JOGADOR = new Set(['você', 'voce', 'vc', 'jogador', 'eu']);

// Nomes de lugares, conceitos, entidades e termos do mundo que nunca são personagens falando
export const NOMES_NAO_PERSONAGENS = new Set([
  // Lugares e Regiões de Tsukimichi e Vaelhorn
  'Tsige', 'Asora', 'Wasteland', 'Rotsgard', 'Limia', 'Gritonia', 'Halvern',
  'Halvet', 'Mareu', 'Corveira', 'Tessel', 'Vintra', 'Solgar', 'Vaelhorn',
  'Japão', 'Japao', 'Terra', 'Ermo', 'Ermos', 'Baixios', 'Planalto',
  'Ubuyashiki', 'Castelo', 'Kyudo',
  // Conceitos, Facções, Títulos, Entidades e Itens que não são pessoas
  'Deusa', 'Deusas', 'Deus', 'Deuses', 'Calamidade', 'Calamidades',
  'Guilda', 'Companhia', 'Kuzunoha', 'Irmandade', 'Igreja', 'Templo',
  'Reino', 'Reinos', 'Império', 'Imperio', 'Impérios', 'Imperios',
  'Katana', 'Draupnir', 'Sakai', 'Nichirin', 'Orbe', 'Portal',
  'Humanos', 'Humano', 'Demônios', 'Demonios', 'Demônio', 'Demonio',
  'Hyumans', 'Hyuman', 'Demi-humanos', 'Demi-humano', 'Orcs', 'Orc',
  'Anões', 'Anoes', 'Anão', 'Anao', 'Alkes', 'Alke', 'Lizards',
  'Gorin', 'Niten', 'Ichi', 'Musashi', 'Outono', 'Inverno', 'Primavera', 'Verão', 'Verao',
]);

// Papéis genéricos descritivos que podem falar em cenas de multidão/guarda.
export const PAPEIS_GENERICOS_VALIDOS = new Set([
  'soldado', 'guarda', 'sentinela', 'vigia', 'patrulheiro', 'cavaleiro',
  'mercador', 'comerciante', 'lojista', 'vendedor', 'estalajadeiro', 'taverneiro',
  'ferreiro', 'artesão', 'artesao', 'plebeu', 'camponês', 'campones', 'lavrador',
  'homem', 'mulher', 'ancia', 'ancião', 'anciao', 'jovem', 'rapaz', 'garoto', 'menina',
  'voz', 'voz na multidão', 'vozes', 'guerreiro', 'batedor', 'oficial', 'capitão', 'capitao',
]);

function capitalizar(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Separa o marcador do texto. Devolve `quem: undefined` quando não há
 * marcador — e aí as camadas de inferência assumem.
 */
function lerMarcador(
  linha: string,
  nomeJogador: string | undefined,
  candidatos: string[],
): { quem?: string; resto: string } {
  const m = RE_MARCADOR.exec(linha);
  if (!m) return { resto: linha };
  const bruto = m[1].trim();
  const resto = linha.slice(m[0].length).trim();
  if (MARCAS_DO_JOGADOR.has(bruto.toLowerCase())) {
    return { quem: nomeJogador, resto };
  }
  // Se for nome de lugar ou conceito que não fala (ex: [Tsige], [Asora], [Calamidade])
  if (NOMES_NAO_PERSONAGENS.has(bruto)) {
    return { resto };
  }
  // Papéis descritivos válidos (ex: [Soldado], [Guarda], [Mercador], [Voz])
  if (PAPEIS_GENERICOS_VALIDOS.has(bruto.toLowerCase())) {
    return { quem: capitalizar(bruto), resto };
  }
  // O nome tem de ser de alguém que a cena conhece. Um marcador inventado
  // ("[a mulher]") é melhor tratado como fala sem dono do que como uma pessoa
  // nova que ninguém sabe quem é.
  const conhecido = candidatos.find(
    (n) => n.toLowerCase() === bruto.toLowerCase() || bruto.toLowerCase().startsWith(n.toLowerCase()),
  );
  if (conhecido) return { quem: conhecido, resto };
  if (nomeJogador && bruto.toLowerCase() === nomeJogador.toLowerCase()) {
    return { quem: nomeJogador, resto };
  }
  return { resto };
}

// Um nome logo depois de vírgula e perto do fim da fala ("— O que você
// quer, Vess?") é chamamento — quem fala está se dirigindo a Vess, não é
// Vess quem fala. Isso nunca conta como assinatura de autoria, em lugar nenhum.
function ehVocativo(t: string, nome: string, i: number): boolean {
  const antes = t.slice(Math.max(0, i - 3), i);
  const depois = t.slice(i + nome.length, i + nome.length + 2);
  return /,\s*$/.test(antes) && /^[?!.…]?\s*$/.test(depois);
}

// Verbo de fala + nome logo depois ("— Fala — disse Elza." ou "— Fala — diz
// Elza.") é a assinatura mais confiável que existe: ninguém escreve isso
// sem ser mesmo quem falou. Cobre presente e pretérito — o narrador mistura
// os dois.
const RE_VERBO_FALA =
  /\b(?:disse|diz|perguntou|pergunta|respondeu|responde|sussurrou|sussurra|murmurou|murmura|gritou|grita|insistiu|insiste|completou|completa|concordou|concorda|retrucou|retruca|provocou|provoca|reclamou|reclama|repetiu|repete|explicou|explica|ofereceu|oferece|avisou|avisa)\s+(?:o|a|um|uma)?\s*([\p{L}'-]+)/u;

function acharPorTag(linha: string, candidatos: string[]): string | undefined {
  const m = RE_VERBO_FALA.exec(linha);
  if (!m) return undefined;
  const termo = m[1];
  if (PAPEIS_GENERICOS_VALIDOS.has(termo.toLowerCase())) {
    return capitalizar(termo);
  }
  if (NOMES_NAO_PERSONAGENS.has(termo)) {
    return undefined;
  }
  return candidatos.find((n) => n === termo || termo.startsWith(n)) ?? undefined;
}

// ── A assinatura do próprio jogador ───────────────────────────────────────
//
// O narrador fala com o jogador em SEGUNDA PESSOA. Quando ele marca uma fala
// como sendo do jogador, ele não escreve "— …, disse Andarilho": escreve
// "— …, você pergunta" ou "— …, pergunta você". Nenhuma das duas formas casa
// com `RE_VERBO_FALA`, que exige verbo seguido de nome próprio maiúsculo.
//
// O resultado disso era o pior erro possível na tela: a fala mais claramente
// identificada de todas — o texto dizendo literalmente que foi VOCÊ quem
// falou — ficava sem dono, caía na adivinhação por proximidade, pegava o
// nome da NPC que a prosa vizinha mencionava, e a alternância então propagava
// a troca para TODAS as falas seguintes da cena. Uma assinatura perdida
// invertia o diálogo inteiro.
//
// Este sinal é tão forte quanto a tag de terceira pessoa, e por isso entra na
// mesma primeira camada.
const VERBOS_DE_FALA =
  'disse|diz|perguntou|pergunta|respondeu|responde|sussurrou|sussurra|murmurou|murmura|' +
  'gritou|grita|insistiu|insiste|completou|completa|concordou|concorda|retrucou|retruca|' +
  'provocou|provoca|reclamou|reclama|repetiu|repete|explicou|explica|ofereceu|oferece|' +
  'avisou|avisa|emenda|emendou|solta|soltou|devolve|devolveu|arrisca|arriscou';

// Atenção ao limite de palavra: em JavaScript `\b` se baseia em [A-Za-z0-9_]
// mesmo com a flag `u`. Depois de "você", o `ê` não conta como caractere de
// palavra, então `você\b` NUNCA casa — e foi exatamente isso que fez
// "pergunta você" passar despercebido enquanto "você pergunta" funcionava.
// O limite do lado direito é uma antevisão de "não vem letra", não um `\b`.
const FIM = '(?![\\p{L}])';

const RE_FALA_DO_JOGADOR = new RegExp(
  `(?:\\bvocê\\s+(?:${VERBOS_DE_FALA})${FIM}|\\b(?:${VERBOS_DE_FALA})\\s+você${FIM})`,
  'iu',
);

/** A própria linha diz que quem falou foi o jogador? */
function ehFalaDoJogador(linha: string): boolean {
  return RE_FALA_DO_JOGADOR.test(linha);
}

// ── O turno que a prosa já gastou ─────────────────────────────────────────
//
// A alternância supõe que as falas se revezam. Elas não se revezam quando uma
// das partes fala DENTRO da narração em vez de entre travessões:
//
//   "…você tenta um elogio. Agradece o pão, a mão boa dela. Ela segura um
//    sorriso."
//   — Freguês novo é sempre bom de língua. Isso passa.
//
// O elogio do jogador aconteceu — só que narrado. A resposta é dela. Mas para
// a alternância, a última fala com dono ainda era do jogador, então a próxima
// "tinha" de ser da NPC... ou o contrário, dependendo de onde a cadeia começou.
// Contar só as falas entre travessões faz o parser perder metade da conversa.
//
// Este sinal repara isso: quando a prosa IMEDIATAMENTE anterior narra o
// jogador falando, a fala citada logo depois é resposta — e portanto é do
// outro lado. É um sinal negativo ("não é o jogador"), mais confiável que a
// proximidade, e por isso roda antes dela.
const RE_JOGADOR_FALA_NA_PROSA = new RegExp(
  `\\bvocê\\s+(?:${VERBOS_DE_FALA}|agradece|elogia|conta|explica|comenta|saúda|cumprimenta|` +
  `tenta\\s+um\\s+elogio|puxa\\s+assunto|pede|ordena|xinga|provoca)${FIM}`,
  'iu',
);

function prosaNarraFalaDoJogador(prosa: string): boolean {
  return RE_JOGADOR_FALA_NA_PROSA.test(prosa);
}

// Tag de narração pendurada no fim da fala ("— Está aberto? você pergunta.").
// Serve para atribuir, mas não para LER: deixá-la dentro do balão faz a tela
// mostrar a marcação do narrador como se fosse parte do que a pessoa disse.
// Só corta no fim, e só o que sobrou depois de um travessão ou vírgula —
// nunca no meio, onde poderia comer conteúdo de verdade.
const RE_TAG_NO_FIM = new RegExp(
  `[\\s,—–-]+(?:(?:${VERBOS_DE_FALA})\\s+[\\p{Lu}][\\p{L}'-]*|` +
  `você\\s+(?:${VERBOS_DE_FALA})|(?:${VERBOS_DE_FALA})\\s+você)\\s*[.!?…]*\\s*$`,
  'iu',
);

function semTagNoFim(texto: string): string {
  const cortado = texto.replace(RE_TAG_NO_FIM, '').trim();
  // Se cortar esvaziaria a fala, a "tag" era a fala inteira: melhor manter.
  if (!cortado) return texto;
  return /[.!?…"”»]$/.test(cortado) ? cortado : `${cortado}.`;
}

// Nem toda NPC de uma cena está no elenco fixo do conteúdo — narração livre
// cria gente de passagem o tempo todo ("a voz de Hilda", "resmunga o
// ferreiro Bael"), e sem enxergar esses nomes uma fala inteira fica sem
// dono. Pior: se for a PRIMEIRA fala da cena, a alternância não tem em quem
// se apoiar e a cena inteira sai sem nome nenhum, nem o do jogador. Por
// isso, além do elenco conhecido, também conta nome próprio citado no meio
// de uma frase do próprio texto (maiúscula que não é início de frase) —
// sinal mais fraco que o elenco fixo (pode pegar lugar ou facção por
// engano), mas errar um nome ocasional é melhor do que a cena inteira ficar
// muda — foi exatamente esse buraco que deixou até o nome do jogador sumir.
const RE_NOME_NO_TEXTO = /(?<=[\p{Ll},]\s)[\p{Lu}][\p{Ll}'-]{2,}/gu;
const PALAVRAS_COMUNS_MAIUSCULAS = new Set([
  'Você', 'Voce', 'Ele', 'Ela', 'Eles', 'Elas', 'Isso', 'Aquilo', 'Aqui', 'Ali',
  'Deus', 'Senhor', 'Senhora', 'Nada', 'Algo', 'Alguém', 'Alguem', 'Ninguém', 'Ninguem', 'Talvez',
]);
// "Vess, a Fiadora, observa..." — "a"/"o" isolado logo antes é artigo de
// epíteto/título ("a Fiadora", "o Ferreiro"), não gente nova entrando na
// cena. Sem isso, o título rouba a fala de quem estava logo ao lado.
function ehTituloComArtigo(bruto: string, indice: number): boolean {
  return /\b[ao]\s$/.test(bruto.slice(Math.max(0, indice - 3), indice));
}
function nomesCitadosNoTexto(bruto: string, ignorar: string[] = []): string[] {
  const achados = new Set<string>();
  const ignorarSet = new Set([...NOMES_NAO_PERSONAGENS, ...ignorar]);
  for (const m of bruto.matchAll(RE_NOME_NO_TEXTO)) {
    if (m.index === undefined) continue;
    const palavra = m[0];
    if (PALAVRAS_COMUNS_MAIUSCULAS.has(palavra)) continue;
    if (ignorarSet.has(palavra)) continue;
    if (ehTituloComArtigo(bruto, m.index)) continue;

    // Ignora se for precedido por termos geográficos ou de insígnia ("emblema de Tsige", "cidade de Tsige")
    const antes = bruto.slice(Math.max(0, m.index - 25), m.index);
    if (/\b(?:emblema|cidade|reino|vila|portão|portao|distrito|rua|praça|praca|estrada|lago|rio|floresta|bosque|vale|marca|costa|planalto)\s+de\s+$/i.test(antes)) {
      continue;
    }

    achados.add(palavra);
  }
  return [...achados];
}

// Detecta se a prosa indica que o jogador é apenas um ouvinte/observador da cena
const RE_JOGADOR_OUVE = new RegExp(
  `\\b(?:você\\s+(?:ouviu|ouve|escuta|escutou|olha|olhou|observa|observou|viu|vê|sentiu|sente)|` +
  `aos\\s+seus\\s+ouvidos|você\\s+não\\s+disse|em\\s+silêncio)\\b`,
  'iu',
);
function prosaNarraJogadorOuvinte(prosa: string): boolean {
  return RE_JOGADOR_OUVE.test(prosa);
}

// Detecta se a prosa descreve uma voz externa, clamor na multidão ou terceiro anônimo
const RE_VOZ_DE_TERCEIRO = new RegExp(
  `\\b(?:a\\s+voz\\s+(?:saiu|veio|ecoou|tremia|soou|gritou|sussurrou)|` +
  `uma\\s+voz|vozes|alguém\\s+(?:gritou|disse|falou|exclamou)|ouviu-se|gritou\\s+alguém|` +
  `grita\\s+alguém|de\\s+algum\\s+lugar|entre\\s+os\\s+armazéns|na\\s+multidão)\\b`,
  'iu',
);
function prosaNarraVozDeTerceiro(prosa: string): boolean {
  return RE_VOZ_DE_TERCEIRO.test(prosa);
}

// Extrai papel genérico/descritivo de um personagem na prosa (ex: soldado, guarda, mercador, voz na multidão)
function extrairPapelGenerico(prosa: string): string | undefined {
  if (!prosa) return undefined;

  // Soldado / Guarda
  if (/\b(?:soldado|homem\s+de\s+armadura|homem\s+em\s+armadura|homem\s+com\s+armadura|guarda|sentinela|vigia|patrulheiro|cavaleiro)\b/i.test(prosa)) {
    if (/\bguarda\b/i.test(prosa)) return 'Guarda';
    return 'Soldado';
  }

  // Mercador / Comerciante
  if (/\b(?:mercador|mercadores|comerciante|comerciantes|lojista|vendedor)\b/i.test(prosa)) {
    return 'Mercador';
  }

  // Plebeu / Homem / Mulher
  if (/\b(?:uma\s+mulher)\b/i.test(prosa)) return 'Mulher';
  if (/\b(?:um\s+homem)\b/i.test(prosa)) return 'Homem';
  if (/\b(?:plebeu|camponês|campones|lavrador|morador)\b/i.test(prosa)) return 'Plebeu';

  // Voz na multidão / Voz
  if (/\b(?:a\s+voz\s+(?:saiu|veio|ecoou|tremia|soou)|uma\s+voz|vozes|alguém\s+gritou|entre\s+os\s+armazéns|na\s+multidão|no\s+meio\s+do\s+povo)\b/i.test(prosa)) {
    return 'Voz na multidão';
  }

  return undefined;
}

function ehPapelGenerico(quem?: string): boolean {
  if (!quem) return false;
  const q = quem.toLowerCase();
  return (
    q === 'soldado' ||
    q.startsWith('soldado') ||
    q === 'guarda' ||
    q.startsWith('guarda') ||
    q === 'sentinela' ||
    q === 'vigia' ||
    q === 'mercador' ||
    q === 'comerciante' ||
    q === 'plebeu' ||
    q === 'homem' ||
    q === 'mulher' ||
    q === 'voz' ||
    q.startsWith('voz')
  );
}

// Um nome que a própria fala usa como vocativo (o jogador chamando a NPC
// pelo nome, "— O que você quer, Vess?") não é quem está falando — é pra
// quem a fala se dirige. Checa todas as ocorrências do nome na fala.
function nomeEhVocativoNaFala(textoDaFala: string, nome: string): boolean {
  let i = -1;
  while ((i = textoDaFala.indexOf(nome, i + 1)) !== -1) {
    if (ehVocativo(textoDaFala, nome, i)) return true;
  }
  return false;
}

// Achado no parágrafo anterior/seguinte — sinal fraco, só serve de último
// recurso: narração que MENCIONA alguém não quer dizer que essa pessoa vai
// falar a seguir. O parágrafo ANTERIOR é o lado traiçoeiro disso: uma cena
// costuma abrir descrevendo a NPC presente antes mesmo do jogador dizer a
// primeira palavra ("Vess limpa o balcão... — O que você quer, Vess?"), e aí
// o "anterior" aponta pra NPC errada bem na primeira fala — mas SÓ nesse
// caso específico: quando é o próprio jogador chamando essa NPC pelo nome
// na fala atual (ver nomeEhVocativoNaFala, acima). Fora desse caso — como
// uma fala no FIM de cena com um antecedente claro logo antes ("Vess...
// observa você... diz ela.") — o parágrafo anterior é um sinal bom demais
// para descartar sempre que o nome do jogador é conhecido, e descartá-lo
// sempre foi o que deixava esse tipo de fala sem dono nenhum.
function acharPorProximidade(
  anterior: string,
  seguinte: string,
  textoDaFala: string,
  candidatos: string[],
): string | undefined {
  const acharUltimo = (t: string): string | undefined => {
    let achado: string | undefined;
    let pos = -1;
    for (const n of candidatos) {
      if (nomeEhVocativoNaFala(textoDaFala, n)) continue;
      const i = t.lastIndexOf(n);
      if (i > pos && !ehVocativo(t, n, i)) {
        pos = i;
        achado = n;
      }
    }
    return achado;
  };
  const acharPrimeiro = (t: string): string | undefined => {
    let achado: string | undefined;
    let pos = Number.MAX_SAFE_INTEGER;
    for (const n of candidatos) {
      const i = t.indexOf(n);
      if (i >= 0 && i < pos) {
        pos = i;
        achado = n;
      }
    }
    return achado;
  };
  const achado = acharUltimo(anterior.slice(-200)) ?? acharPrimeiro(seguinte.slice(0, 200));
  if (achado) return achado;

  // Se nenhum candidato com nome próprio foi encontrado, busca papéis genéricos descritos na prosa adjacente:
  return extrairPapelGenerico(seguinte.slice(0, 250)) ?? extrairPapelGenerico(anterior.slice(-250));
}

// Converte a narração crua em blocos prontos para a tela. `nomeJogador`
// (opcional) entra na resolução em duas frentes:
//
// A atribuição roda em camadas, da mais confiável à mais fraca — parar cedo
// importa tanto quanto parar tarde:
//  1) Tag de verbo de fala na própria linha ("— …, disse Elza") — o único
//     sinal forte o bastante pra confiar de cara.
//  2) Alternância: o prompt do narrador pede falas ALTERNADAS entre o
//     jogador e quem está na cena (ver engine/llm.ts), e fala com o
//     jogador em segunda pessoa — a fala dele quase nunca cita o nome dele
//     por perto. Uma fala sem dono ao lado de uma já resolvida herda o
//     outro nome da dupla.
//  3) Só como último recurso — e só pra quem ainda ficou sem dono depois
//     das duas primeiras passadas — o parágrafo anterior/seguinte por
//     proximidade (sinal fraco: mencionar alguém não é o mesmo que essa
//     pessoa falar a seguir), seguido de outra rodada de alternância pra
//     propagar o que essa passada conseguiu resolver.
export function emBlocos(
  bruto: string,
  nomes: string[] = [],
  nomeJogador?: string,
  locaisIgnorados: string[] = [],
): Bloco[] {
  // Elenco conhecido primeiro (mais confiável), depois nomes só citados no
  // próprio texto (ver nomesCitadosNoTexto) — sem duplicar.
  const candidatos = [...new Set([...nomes.filter(Boolean), ...nomesCitadosNoTexto(bruto, locaisIgnorados)])];
  const paragrafos = emParagrafos(bruto);
  const out: Bloco[] = [];

  for (const p of paragrafos) {
    const travessao = RE_TRAVESSAO.test(p);
    const aspas = RE_SO_ASPAS.exec(p);
    if (travessao || aspas) {
      const semTravessao = travessao ? p.replace(RE_TRAVESSAO, '').trim() : (aspas?.[1] ?? p).trim();
      // Camada zero: marcador explícito. Se veio, decide sozinho.
      const marcado = lerMarcador(semTravessao, nomeJogador, candidatos);
      if (marcado.quem) {
        out.push({ tipo: 'fala', texto: semTagNoFim(marcado.resto), quem: marcado.quem });
        continue;
      }
      const brutoTexto = marcado.resto;
      // Duas assinaturas fortes, nesta ordem: a de terceira pessoa ("disse
      // Elza") e a de segunda pessoa ("você pergunta"), que é como o narrador
      // marca as falas do próprio jogador. A segunda vem antes da adivinhação
      // por vizinhança, e não depois — era essa inversão que fazia a fala do
      // jogador ser atribuída à NPC citada na prosa ao lado.
      const porTag = acharPorTag(p, candidatos);
      const quem = porTag ?? (nomeJogador && ehFalaDoJogador(p) ? nomeJogador : undefined);
      out.push({ tipo: 'fala', texto: semTagNoFim(brutoTexto), quem });
    } else {
      out.push({ tipo: 'prosa', texto: p });
    }
  }

  const falas = out.filter((b): b is Extract<Bloco, { tipo: 'fala' }> => b.tipo === 'fala');

  const indicesDosParagrafos = out
    .map((b, i) => (b.tipo === 'fala' ? i : -1))
    .filter((i) => i >= 0);
  const prosaAcimaDe = (k: number) => {
    const i = indicesDosParagrafos[k];
    return i > 0 && out[i - 1].tipo === 'prosa' ? out[i - 1].texto : '';
  };
  const prosaAbaixoDe = (k: number) => {
    const i = indicesDosParagrafos[k];
    return i < out.length - 1 && out[i + 1].tipo === 'prosa' ? out[i + 1].texto : '';
  };

  // Camada 1: o turno que a prosa já gastou falando pelo jogador. Roda ANTES da alternância, de
  // propósito — a alternância enxerga só falas citadas, então ela reivindicaria
  // esta linha para o jogador sem nunca saber que ele já falou na narração
  // logo acima.
  if (nomeJogador) {
    for (let k = 0; k < falas.length; k += 1) {
      if (falas[k].quem) continue;
      const anterior = prosaAcimaDe(k);
      if (!prosaNarraFalaDoJogador(anterior)) continue;
      const outro = candidatos.find((n) => n !== nomeJogador && anterior.includes(n))
        ?? falas.map((f) => f.quem).find((q): q is string => !!q && q !== nomeJogador);
      if (outro) falas[k].quem = outro;
    }
  }

  // Camada 2: busca por proximidade nas falas que ainda estão sem dono.
  // Resolve primeiro o que a prosa direta nomeia ou descreve (inclusive papéis genéricos como Soldado, Guarda ou Voz na multidão).
  for (let k = 0; k < falas.length; k += 1) {
    if (falas[k].quem) continue;
    const anterior = prosaAcimaDe(k);
    const seguinte = prosaAbaixoDe(k);
    falas[k].quem = acharPorProximidade(anterior, seguinte, falas[k].texto, candidatos);
  }

  // Camada 3: alternância entre interlocutores conhecidos (1-on-1).
  // Só atua se for diálogo de duas partes e a fala não tiver sinais de ser voz externa ou de ouvinte.
  if (nomeJogador) {
    const outro = falas.map((f) => f.quem).find((q): q is string => !!q && q !== nomeJogador && !ehPapelGenerico(q));
    for (let i = 0; i < falas.length; i += 1) {
      if (falas[i].quem) continue;
      const vizinha = falas[i - 1] ?? falas[i + 1];
      if (!vizinha?.quem) continue;

      if (vizinha.quem === nomeJogador) {
        if (outro) falas[i].quem = outro;
      } else {
        // Não alterna para o jogador se a vizinha for papel genérico da multidão/guarda
        if (ehPapelGenerico(vizinha.quem)) continue;

        const anterior = prosaAcimaDe(i);
        const seguinte = prosaAbaixoDe(i);

        // Se a prosa diz que o jogador está ouvindo/observando, jamais atribui a fala a ele
        if (prosaNarraJogadorOuvinte(anterior) || prosaNarraJogadorOuvinte(seguinte)) {
          continue;
        }
        // Se a prosa diz que é uma voz de terceiro/multidão
        if (prosaNarraVozDeTerceiro(anterior) || prosaNarraVozDeTerceiro(seguinte)) {
          falas[i].quem = 'Voz na multidão';
          continue;
        }

        falas[i].quem = nomeJogador;
      }
    }
  }

  return out;
}
