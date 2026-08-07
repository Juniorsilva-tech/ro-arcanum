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

// Encontra quem falou. Ordem de busca, do mais confiável ao menos: a própria
// linha ("— …, disse Elza"), o parágrafo anterior, e por fim o seguinte —
// porque "— Fala.\n\nElza vira as costas." também é português corrente.
function atribuir(
  anterior: string,
  linha: string,
  seguinte: string,
  nomes: string[],
): string | undefined {
  const candidatos = nomes.filter(Boolean);
  const acharUltimo = (t: string): string | undefined => {
    let achado: string | undefined;
    let pos = -1;
    for (const n of candidatos) {
      const i = t.lastIndexOf(n);
      if (i > pos) {
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
  return (
    acharUltimo(linha) ??
    acharUltimo(anterior.slice(-200)) ??
    acharPrimeiro(seguinte.slice(0, 200))
  );
}

// Converte a narração crua em blocos prontos para a tela.
export function emBlocos(bruto: string, nomes: string[] = []): Bloco[] {
  const paragrafos = emParagrafos(bruto);
  const out: Bloco[] = [];
  let anterior = '';

  for (let i = 0; i < paragrafos.length; i += 1) {
    const p = paragrafos[i];
    const travessao = RE_TRAVESSAO.test(p);
    const aspas = RE_SO_ASPAS.exec(p);
    if (travessao || aspas) {
      const texto = travessao ? p.replace(RE_TRAVESSAO, '').trim() : (aspas?.[1] ?? p).trim();
      out.push({ tipo: 'fala', texto, quem: atribuir(anterior, p, paragrafos[i + 1] ?? '', nomes) });
    } else {
      out.push({ tipo: 'prosa', texto: p });
    }
    anterior = p;
  }
  return out;
}
