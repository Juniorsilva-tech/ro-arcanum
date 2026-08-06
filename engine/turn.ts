// ARCANUM · Resolvedor de turno. A engine resolve; o modelo (ou o fallback) narra (GDD §4.4, §35).
import type {
  Campaign,
  ContentBundle,
  Verbo,
  NPC,
  Efeito,
  AttrKey,
  ImpulsoId,
  Grau,
} from './types';
import { resolverTeste, type ResultadoTeste, NOME_GRAU } from './resolution';
import { avancarPeriodos } from './time';
import { clampRecursos } from './character';
import { crescerImpulsos, saciar, penalidadePorImpulsos } from './impulsos';
import { calcularContexto } from './availability';
import { aplicarEfeito, substituirAlvo } from './effects';

export type OpcaoResolvida = {
  id: string;
  rotulo: string;
  dica?: string;
  custoPeriodos: number;
  teste?: { atributo: AttrKey; pericia?: string; dificuldade: number };
  efeitos?: Efeito[];
  impulsoQueSacia?: ImpulsoId;
  origem: 'cena' | 'verbo' | 'livre';
};

export type Intencao =
  | { tipo: 'verbo'; verboId: string; alvoId?: string }
  | { tipo: 'opcao'; opcao: OpcaoResolvida; alvoId?: string };

export type ResultadoTurno = {
  resultado?: ResultadoTeste;
  grau?: Grau;
  verbo?: Verbo;
  alvo?: NPC;
  // O "fato consumado" que a narração transforma em prosa (GDD §4.4).
  fato: string;
  custoPeriodos: number;
  efeitosAplicados: Efeito[];
};

function penalidadeCondicoes(camp: Campaign): number {
  let pen = 0;
  if (camp.personagem.condicoes.includes('ferido')) pen += 2;
  if (camp.personagem.condicoes.includes('exausto')) pen += 2;
  if (camp.personagem.condicoes.includes('bebado')) pen += 3;
  return pen;
}

function nomeAlvo(content: ContentBundle, alvoId?: string): NPC | undefined {
  if (!alvoId) return undefined;
  return content.npcs.find((n) => n.id === alvoId);
}

// Constrói o "fato consumado" seco que a narração recebe (GDD §4.4).
function construirFato(verbo: Verbo, alvo: NPC | undefined, res?: ResultadoTeste): string {
  const acao = verbo.nome.toLowerCase();
  const alvoTxt = alvo ? ` ${alvo.nome}` : '';
  if (!res) return `Você foi ${acao}${alvoTxt}.`;
  const g = res.grau;
  const quase = res.grau === 'falha' && res.r < res.p + (1 - res.p) * 0.5;
  switch (g) {
    case 'critico':
      return `Você tentou ${acao}${alvoTxt} — e saiu melhor do que esperava.`;
    case 'sucesso':
      return `Você tentou ${acao}${alvoTxt} — deu certo.`;
    case 'sucesso_com_custo':
      return `Você tentou ${acao}${alvoTxt} — deu certo, mas cobrou.`;
    case 'falha':
      return `Você tentou ${acao}${alvoTxt} — falhou${quase ? ' por pouco' : ''}.`;
    case 'falha_grave':
      return `Você tentou ${acao}${alvoTxt} — falhou feio, e algo piorou.`;
  }
}

function atualizarNpcs(camp: Campaign, content: ContentBundle, alvoId: string | undefined, turno: number, resumo: string): void {
  const periodo = camp.calendario.periodoIndex;
  for (const npc of content.npcs) {
    const din = camp.npcState[npc.id];
    if (!din || !din.vivo) continue;
    if (npc.id === alvoId) {
      din.tensao = Math.max(0, din.tensao - 20);
      din.memoria.push({ turno, resumo, peso: 2 });
      if (din.memoria.length > 10) din.memoria.shift();
    } else {
      // Negligência: tensão sobe passivamente (GDD §10.4).
      din.tensao = Math.min(100, din.tensao + 1);
    }
  }
  void periodo;
}

export function resolverIntencao(
  content: ContentBundle,
  camp: Campaign,
  intencao: Intencao,
): ResultadoTurno {
  const p = camp.personagem;
  camp.turno += 1;

  let verbo: Verbo | undefined;
  let teste: { atributo: AttrKey; pericia?: string; dificuldade: number } | undefined;
  let custoPeriodos = 0;
  let efeitosSempre: Efeito[] = [];
  let efeitosPorGrau: Partial<Record<Grau, Efeito[]>> = {};
  let impulsoQueSacia: ImpulsoId | undefined;
  let rotulo = '';

  if (intencao.tipo === 'verbo') {
    verbo = content.verbos.find((v) => v.id === intencao.verboId);
    if (!verbo) throw new Error(`verbo desconhecido: ${intencao.verboId}`);
    custoPeriodos = verbo.custo.periodos;
    efeitosSempre = verbo.efeitosSempre ?? [];
    efeitosPorGrau = verbo.efeitosPorGrau ?? {};
    impulsoQueSacia = verbo.impulsoQueSacia;
    rotulo = verbo.nome;
    if (verbo.teste) {
      teste = {
        atributo: verbo.teste.atributo,
        pericia: verbo.teste.pericia,
        dificuldade: verbo.teste.dificuldadeBase,
      };
    }
  } else {
    const o = intencao.opcao;
    custoPeriodos = o.custoPeriodos;
    teste = o.teste;
    impulsoQueSacia = o.impulsoQueSacia;
    rotulo = o.rotulo;
    // Opção de cena: efeitos aplicam no sucesso; falha aplica um custo leve.
    if (o.efeitos) efeitosPorGrau = { critico: o.efeitos, sucesso: o.efeitos, sucesso_com_custo: o.efeitos };
  }

  const alvo = nomeAlvo(content, intencao.alvoId);
  const cenario = content.cenario;

  // Resolve o teste, se houver.
  let resultado: ResultadoTeste | undefined;
  if (teste) {
    resultado = resolverTeste(camp.rng, {
      atributo: p.atributos[teste.atributo],
      pericia: teste.pericia ? p.pericias[teste.pericia] ?? 0 : 0,
      circunstancia: 0,
      penalidadeEstado: penalidadePorImpulsos(camp) + penalidadeCondicoes(camp),
      dificuldade: teste.dificuldade,
      k: cenario.k,
    });
  }

  const grau: Grau | undefined = resultado?.grau;

  // Aplica efeitos (com o placeholder $alvo já resolvido).
  const aplicados: Efeito[] = [];
  for (const ef of substituirAlvo(efeitosSempre, intencao.alvoId)) {
    aplicarEfeito(camp, ef);
    aplicados.push(ef);
  }
  const baldeGrau = grau && efeitosPorGrau[grau] ? efeitosPorGrau[grau]! : !resultado ? (efeitosPorGrau.sucesso ?? []) : [];
  for (const ef of substituirAlvo(baldeGrau, intencao.alvoId)) {
    aplicarEfeito(camp, ef);
    aplicados.push(ef);
  }

  // Saciar impulso em caso de sucesso (ou verbo sem teste).
  const deuCerto = !resultado || resultado.sucesso;
  if (impulsoQueSacia && deuCerto) {
    saciar(camp, impulsoQueSacia, 60);
  }

  // Avança o tempo e cresce impulsos (GDD §1, §5).
  if (custoPeriodos > 0) {
    camp.calendario = avancarPeriodos(camp.calendario, custoPeriodos);
    crescerImpulsos(camp, custoPeriodos);
  }

  const fato = verbo
    ? construirFato(verbo, alvo, resultado)
    : `${rotulo}${resultado ? ` — ${NOME_GRAU[resultado.grau]}` : ''}.`;

  atualizarNpcs(camp, content, intencao.alvoId, camp.turno, fato);

  // Sequela: se a vida chegou a 0 (GDD §15) — marca condição agonizante.
  if (p.recursos.vida <= 0 && !p.condicoes.includes('agonizante')) {
    p.condicoes.push('agonizante');
  }

  clampRecursos(p);

  camp.ultimoResultado = {
    grau: grau ?? 'sucesso',
    verboNome: verbo?.nome ?? rotulo,
    alvoNome: alvo?.nome,
  };

  return {
    resultado,
    grau,
    verbo,
    alvo,
    fato,
    custoPeriodos,
    efeitosAplicados: aplicados,
  };
}

export { calcularContexto };
