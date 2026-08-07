// ARCANUM · A grade de opções.
//
// Antes, o validador apenas derrubava a segunda opção do mesmo eixo. Isso
// evitava repetição mas não GARANTIA variedade: se o modelo devolvesse três
// jeitos de conversar, o jogador ficava com uma opção só.
//
// A grade inverte a lógica. As posições são fixas e cada uma tem uma categoria
// definida de antemão. A primeira é sempre de aproximação, a segunda sempre de
// risco, e assim por diante. O que o modelo manda é encaixado na posição certa;
// o que ele não mandou, a engine preenche com uma ação real do jogo. O jogador
// nunca vê um slate torto — e nunca vê cinco versões da mesma escolha.
import type { Campaign, ContentBundle, CategoriaVerbo, Verbo } from './types';
import type { OpcaoResolvida } from './turn';
import type { Contexto } from './availability';
import { disponibilidadeVerbo } from './availability';
import { type Natureza, inferirNatureza } from './risco';

// A ordem é estável de propósito: o jogador aprende onde fica cada tipo de
// escolha e para de reler as cinco toda vez.
export const GRADE: Natureza[] = ['aproximar', 'arriscar', 'observar', 'ganhar', 'avancar'];

// Que categoria de verbo serve para preencher cada posição da grade.
const CATEGORIAS_POR_EIXO: Record<Natureza, CategoriaVerbo[]> = {
  aproximar: ['social'],
  arriscar: ['transgressao', 'corpo'],
  observar: ['observacao'],
  ganhar: ['ganho', 'pratica'],
  avancar: ['deslocamento', 'cenario'],
};

// Encaixa cada opção da IA na posição a que ela pertence. Duas do mesmo eixo:
// fica a primeira, a segunda é descartada (a grade não tem duas casas iguais).
function encaixar(
  opcoes: OpcaoResolvida[],
): Partial<Record<Natureza, OpcaoResolvida>> {
  const casas: Partial<Record<Natureza, OpcaoResolvida>> = {};
  for (const o of opcoes) {
    const eixo = o.natureza ?? inferirNatureza(o);
    if (!casas[eixo]) casas[eixo] = { ...o, natureza: eixo };
  }
  return casas;
}

// Uma ação de verdade para preencher a casa vazia — tirada do que o jogo
// realmente permite aqui e agora, nunca inventada.
function preencher(
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  eixo: Natureza,
  jaUsados: Set<string>,
): OpcaoResolvida | undefined {
  const categorias = CATEGORIAS_POR_EIXO[eixo];
  const alvo = ctx.presentes[0];

  const candidatos = content.verbos.filter((v) => {
    if (!categorias.includes(v.categoria)) return false;
    if (jaUsados.has(v.id)) return false;
    if (v.alvo === 'pessoa' && !alvo) return false;
    return disponibilidadeVerbo(v, ctx, camp, alvo).disponivel;
  });
  if (candidatos.length === 0) return undefined;

  // Escolha estável por turno: varia com o tempo sem tocar no RNG da campanha
  // (o cursor da semente é sagrado — ver narration.ts).
  const escolhido: Verbo = candidatos[(camp.turno + eixo.length) % candidatos.length];
  jaUsados.add(escolhido.id);

  const precisaAlvo = escolhido.alvo === 'pessoa' && alvo;
  return {
    id: `grade_${eixo}_${escolhido.id}`,
    rotulo: precisaAlvo ? `${escolhido.nome} — ${alvo.nome}` : escolhido.nome,
    dica: escolhido.descricao,
    natureza: eixo,
    custoPeriodos: escolhido.custo.periodos,
    teste: escolhido.teste
      ? {
          atributo: escolhido.teste.atributo,
          pericia: escolhido.teste.pericia,
          dificuldade: escolhido.teste.dificuldadeBase,
        }
      : undefined,
    origem: 'verbo',
    verboId: escolhido.id,
    alvoId: precisaAlvo ? alvo.id : undefined,
  };
}

// Monta o slate final: posições fixas, IA onde deu, engine onde faltou.
export function montarGrade(
  content: ContentBundle,
  camp: Campaign,
  ctx: Contexto,
  daIA: OpcaoResolvida[],
  canonicas: OpcaoResolvida[] = [],
): OpcaoResolvida[] {
  const casas = encaixar(daIA);
  const usados = new Set<string>();
  const out: OpcaoResolvida[] = [];

  for (const eixo of GRADE) {
    const daModelo = casas[eixo];
    if (daModelo) {
      out.push(daModelo);
      continue;
    }
    // Sem opção do modelo para esta casa: uma ação real do jogo entra no lugar.
    const daEngine = preencher(content, camp, ctx, eixo, usados);
    if (daEngine) out.push(daEngine);
  }

  // "Deixar o tempo correr" fecha a grade — é sempre uma escolha (GDD §1).
  const correr = canonicas.find((o) => o.id === 'deixar_correr');
  if (correr) out.push({ ...correr, natureza: 'avancar' });
  return out;
}
