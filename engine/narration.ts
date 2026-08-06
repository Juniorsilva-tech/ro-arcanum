// ARCANUM · Narração canônica de fallback (GDD §20, requisito P0).
// Sem rede / com o modelo fora do ar, o jogo continua mais seco e NÃO trava.
import type { Campaign, ContentBundle } from './types';
import type { ResultadoTurno, OpcaoResolvida } from './turn';
import { calcularContexto, type Contexto } from './availability';
import { pick, type RngState } from './rng';
import { NOME_PERIODO } from './time';

// O jogo NARRA, não descreve: registro seco, concreto (GDD §0.2).
export function montarCena(content: ContentBundle, camp: Campaign): {
  narracao: string;
  eco?: string;
  opcoes: OpcaoResolvida[];
  contexto: Contexto;
} {
  const ctx = calcularContexto(content, camp);
  const atmosfera =
    ctx.local.atmosferaPorPeriodo[ctx.periodo] ?? ctx.local.descricaoBase;

  const presencaTxt =
    ctx.presentes.length === 0
      ? 'Você está só.'
      : ctx.presentes.length === 1
        ? `${ctx.presentes[0].nome} está aqui.`
        : `${ctx.presentes.slice(0, -1).map((n) => n.nome).join(', ')} e ${
            ctx.presentes[ctx.presentes.length - 1].nome
          } estão aqui.`;

  const narracao = `${atmosfera} ${presencaTxt}`;
  const opcoes = opcoesCanonicas(content, camp, ctx);
  return { narracao, opcoes, contexto: ctx };
}

// Narra o fato consumado devolvido pela engine (GDD §4.4).
export function narrarResultado(camp: Campaign, r: ResultadoTurno): { narracao: string; eco?: string } {
  const rng = camp.rng;
  const base = r.fato;
  const cor = corDaConsequencia(r);
  const eco = ecoDeConsequencia(rng, r);
  return { narracao: `${base} ${cor}`.trim(), eco };
}

function corDaConsequencia(r: ResultadoTurno): string {
  if (!r.grau) return '';
  switch (r.grau) {
    case 'critico':
      return 'Por um momento, tudo se encaixa.';
    case 'sucesso':
      return '';
    case 'sucesso_com_custo':
      return 'Ficou uma conta em aberto.';
    case 'falha':
      return 'Nada acontece — e isso também é uma resposta.';
    case 'falha_grave':
      return 'O silêncio depois é pior que o erro.';
  }
}

function ecoDeConsequencia(rng: RngState, r: ResultadoTurno): string | undefined {
  const ecos: string[] = [];
  for (const ef of r.efeitosAplicados) {
    if (ef.tipo === 'pressao' && ef.delta > 0) ecos.push(`Algo em você cede um pouco.`);
    if (ef.tipo === 'dinheiro' && ef.delta > 0) ecos.push(`As moedas pesam no bolso agora.`);
    if (ef.tipo === 'dinheiro' && ef.delta < 0) ecos.push(`O bolso ficou mais leve.`);
    if (ef.tipo === 'relacao' && ef.delta < 0) ecos.push(`Ficou uma frieza no ar.`);
    if (ef.tipo === 'danoJogador') ecos.push(`A dor chega depois, sempre depois.`);
    if (ef.tipo === 'revelarSegredo') ecos.push(`Agora você sabe de algo que não devia.`);
  }
  if (ecos.length === 0) return undefined;
  return pick(rng, ecos);
}

// Opções de cena canônicas por tipo de ponto (GDD §20). Situacionais, escritas à mão.
function opcoesCanonicas(content: ContentBundle, camp: Campaign, ctx: Contexto): OpcaoResolvida[] {
  const out: OpcaoResolvida[] = [];

  // Ganchos do local que AINDA não foram investigados (§0.2: efeito que some
  // não entra no jogo — investigar duas vezes o mesmo edital não é opção).
  ctx.local.ganchos.forEach((g, i) => {
    if (camp.flags[`investigado.${ctx.local.id}.${i}`]) return;
    out.push({
      id: `gancho_${i}`,
      rotulo: `Investigar: ${g}`,
      dica: 'ver de perto pode revelar algo',
      custoPeriodos: 0,
      origem: 'cena',
      teste: { atributo: 'percepcao', pericia: 'perceber', dificuldade: 12 },
      efeitos: [{ tipo: 'flag', chave: `investigado.${ctx.local.id}.${i}`, valor: true }],
    });
  });

  // Cada pessoa presente é uma porta — não só a primeira.
  ctx.presentes.slice(0, 3).forEach((alvo) => {
    out.push({
      id: `abordar_${alvo.id}`,
      rotulo: `Puxar assunto com ${alvo.nome}`,
      dica: `${alvo.ocupacao}; pode saber de algo`,
      custoPeriodos: 0,
      origem: 'cena',
      teste: { atributo: 'social', pericia: 'persuadir', dificuldade: 12 },
      efeitos: [{ tipo: 'relacao', npc: alvo.id, eixo: content.cenario.eixosRelacao[0].id, delta: 3 }],
    });
  });

  // Se já vasculhou tudo aqui, o lugar oferece a saída como opção viva.
  if (out.length === 0) {
    const rota = ctx.local.rotas[0];
    if (rota) {
      out.push({
        id: 'sair_daqui',
        rotulo: 'Procurar o que fazer em outro lugar',
        dica: 'este canto já deu o que tinha',
        custoPeriodos: 0,
        origem: 'cena',
        efeitos: [{ tipo: 'flag', chave: 'quer.sair', valor: true }],
      });
    }
  }

  // Deixar o período correr é sempre uma escolha.
  out.push({
    id: 'deixar_correr',
    rotulo: 'Deixar o tempo correr',
    dica: `espera até ${NOME_PERIODO[proximoPeriodoNome(camp)].toLowerCase()}`,
    custoPeriodos: 1,
    origem: 'cena',
  });

  return out;
}

function proximoPeriodoNome(camp: Campaign) {
  const ordem = ['madrugada', 'manha', 'tarde', 'entardecer', 'anoitecer', 'noite'] as const;
  return ordem[(camp.calendario.periodoIndex + 1) % ordem.length];
}
