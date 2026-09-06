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
  /\b(?:disse|diz|perguntou|pergunta|respondeu|responde|sussurrou|sussurra|murmurou|murmura|gritou|grita|insistiu|insiste|completou|completa|concordou|concorda|retrucou|retruca|provocou|provoca|reclamou|reclama|repetiu|repete|explicou|explica|ofereceu|oferece|avisou|avisa)\s+([\p{Lu}][\p{L}'-]*)/u;

function acharPorTag(linha: string, candidatos: string[]): string | undefined {
  const m = RE_VERBO_FALA.exec(linha);
  if (!m) return undefined;
  return candidatos.find((n) => n === m[1] || m[1].startsWith(n)) ?? undefined;
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
function nomesCitadosNoTexto(bruto: string): string[] {
  const achados = new Set<string>();
  for (const m of bruto.matchAll(RE_NOME_NO_TEXTO)) {
    if (m.index === undefined) continue;
    if (PALAVRAS_COMUNS_MAIUSCULAS.has(m[0])) continue;
    if (ehTituloComArtigo(bruto, m.index)) continue;
    achados.add(m[0]);
  }
  return [...achados];
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
  return acharUltimo(anterior.slice(-200)) ?? acharPrimeiro(seguinte.slice(0, 200));
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
export function emBlocos(bruto: string, nomes: string[] = [], nomeJogador?: string): Bloco[] {
  // Elenco conhecido primeiro (mais confiável), depois nomes só citados no
  // próprio texto (ver nomesCitadosNoTexto) — sem duplicar.
  const candidatos = [...new Set([...nomes.filter(Boolean), ...nomesCitadosNoTexto(bruto)])];
  const paragrafos = emParagrafos(bruto);
  const out: Bloco[] = [];

  for (const p of paragrafos) {
    const travessao = RE_TRAVESSAO.test(p);
    const aspas = RE_SO_ASPAS.exec(p);
    if (travessao || aspas) {
      const texto = travessao ? p.replace(RE_TRAVESSAO, '').trim() : (aspas?.[1] ?? p).trim();
      out.push({ tipo: 'fala', texto, quem: acharPorTag(p, candidatos) });
    } else {
      out.push({ tipo: 'prosa', texto: p });
    }
  }

  const falas = out.filter((b): b is Extract<Bloco, { tipo: 'fala' }> => b.tipo === 'fala');

  // Preenche pela dupla: uma fala sem dono ao lado de uma já resolvida
  // herda o OUTRO nome da conversa — o jogador, se a vizinha for de outra
  // pessoa; ou a outra pessoa (a primeira NPC que apareceu resolvida na
  // cena), se a vizinha for do jogador.
  const preencherPorAlternancia = () => {
    if (!nomeJogador) return;
    const outro = falas.map((f) => f.quem).find((q): q is string => !!q && q !== nomeJogador);
    for (let i = 0; i < falas.length; i += 1) {
      if (falas[i].quem) continue;
      const vizinha = falas[i - 1] ?? falas[i + 1];
      if (!vizinha?.quem) continue;
      if (vizinha.quem === nomeJogador) {
        if (outro) falas[i].quem = outro;
      } else {
        falas[i].quem = nomeJogador;
      }
    }
  };

  preencherPorAlternancia();

  if (falas.some((f) => !f.quem)) {
    const indicesDosParagrafos = out
      .map((b, i) => (b.tipo === 'fala' ? i : -1))
      .filter((i) => i >= 0);
    for (let k = 0; k < falas.length; k += 1) {
      if (falas[k].quem) continue;
      const i = indicesDosParagrafos[k];
      // Só conta narração (prosa) de verdade como vizinha — o parágrafo de
      // OUTRA fala carrega a própria tag de quem falou aquela linha, não
      // desta. Sem isso, "— Pergunta? \n\n — Resposta — diz Vess." fazia a
      // pergunta roubar o "Vess" que era tag da resposta seguinte.
      const anterior = i > 0 && out[i - 1].tipo === 'prosa' ? out[i - 1].texto : '';
      const seguinte = i < out.length - 1 && out[i + 1].tipo === 'prosa' ? out[i + 1].texto : '';
      falas[k].quem = acharPorProximidade(anterior, seguinte, falas[k].texto, candidatos);
      // Propaga IMEDIATAMENTE, antes de adivinhar a próxima fala por
      // proximidade. A alternância (jogador/outro batendo de volta) é sinal
      // mais confiável que "o parágrafo seguinte cita esse nome" — esse
      // segundo sinal pode ser a REAÇÃO de quem ouviu, não quem falou (foi
      // o que fez uma fala do jogador ser atribuída à NPC, por engano).
      // Resolver na ordem e propagar a cada passo deixa a alternância vencer
      // antes que o próximo palpite fraco tenha a chance de errar.
      preencherPorAlternancia();
    }
  }

  return out;
}
