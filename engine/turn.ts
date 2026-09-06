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
import { avancarMundo } from './mundo';
import { clampRecursos } from './character';
import { crescerImpulsos, saciar } from './impulsos';
import { penalidadeEstado } from './risco';
import { calcularContexto } from './availability';
import type { Natureza } from './risco';
import { aplicarEfeito, substituirAlvo } from './effects';
import { lembrarDoTurno } from './memoria';
import { todosNpcs, npcPorId } from './elenco';
import { dominioDaAcao, treinar, registrarDemonstracao } from './aptidao';

export type OpcaoResolvida = {
  id: string;
  rotulo: string;
  dica?: string;
  // O eixo da escolha, para o conjunto nunca ser cinco vezes a mesma coisa.
  natureza?: Natureza;
  custoPeriodos: number;
  teste?: { atributo: AttrKey; pericia?: string; dificuldade: number };
  efeitos?: Efeito[];
  impulsoQueSacia?: ImpulsoId;
  origem: 'cena' | 'verbo' | 'livre' | 'ia';
  // Quando a opção É um verbo do catálogo, guarda a referência: assim ela roda
  // com os efeitos reais do verbo em vez de virar uma opção genérica.
  verboId?: string;
  alvoId?: string;
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
  // Quando o jogador escreveu a ação com as próprias palavras, o texto CRU vem
  // aqui. É ordem literal para o narrador, não material de apoio.
  acaoLivre?: string;
  custoPeriodos: number;
  efeitosAplicados: Efeito[];
};


function nomeAlvo(content: ContentBundle, camp: Campaign, alvoId?: string): NPC | undefined {
  if (!alvoId) return undefined;
  return npcPorId(content, camp, alvoId);
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

// Quem foi alvo lembra do que houve; quem foi ignorado acumula tensão.
function atualizarNpcs(
  camp: Campaign,
  content: ContentBundle,
  alvo: NPC | undefined,
  verbo: Verbo | undefined,
  grau: Grau | undefined,
  rotulo: string,
): void {
  for (const npc of todosNpcs(content, camp)) {
    const din = camp.npcState[npc.id];
    if (!din || !din.vivo) continue;
    if (alvo && npc.id === alvo.id) {
      din.tensao = Math.max(0, din.tensao - 20);
    } else {
      // Negligência: tensão sobe passivamente (GDD §10.4).
      din.tensao = Math.min(100, din.tensao + 1);
    }
  }
  // A lembrança dela é escrita do ponto de vista dela, e pesada pelo que foi.
  if (alvo) lembrarDoTurno(camp, alvo, verbo, grau, rotulo);
}

export function resolverIntencao(
  content: ContentBundle,
  camp: Campaign,
  intencao: Intencao,
): ResultadoTurno {
  const p = camp.personagem;
  if (p.condicoes.includes('cativo')) return { fato: 'Você continua cativo; precisa recuperar a liberdade antes de agir fora do cativeiro.', custoPeriodos: 0, efeitosAplicados: [] };
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

  const alvo = nomeAlvo(content, camp, intencao.alvoId);
  const cenario = content.cenario;

  // Resolve o teste, se houver. Uma carta de memória "jogada" (ver
  // engine/genese.ts, cartaDeInfancia) entra como bônus de circunstância
  // pontual e é consumida — só quando um teste de fato acontece.
  let resultado: ResultadoTeste | undefined;
  let cartaUsada: string | undefined;
  if (teste) {
    let bonusCarta = 0;
    if (camp.cartaAtiva) {
      const carta = camp.memoriasInfancia?.find((c) => c.id === camp.cartaAtiva);
      if (carta && carta.usosRestantes > 0) {
        bonusCarta = carta.bonusCircunstancia;
        cartaUsada = carta.titulo;
      }
    }
    resultado = resolverTeste(camp.rng, {
      atributo: p.atributos[teste.atributo],
      pericia: teste.pericia ? p.pericias[teste.pericia] ?? 0 : 0,
      circunstancia: bonusCarta,
      penalidadeEstado: penalidadeEstado(camp),
      dificuldade: teste.dificuldade,
      k: cenario.k,
    });
    if (cartaUsada) {
      const carta = camp.memoriasInfancia!.find((c) => c.id === camp.cartaAtiva)!;
      carta.usosRestantes -= 1;
    }
    camp.cartaAtiva = undefined;
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

  // Fazer é treinar, e fazer na frente dos outros é mostrar. O domínio sai da
  // perícia testada (ou da categoria do verbo); as testemunhas são quem está
  // presente AGORA, antes de o tempo andar e a cena mudar de gente.
  if (teste) {
    const dominio = dominioDaAcao(teste.pericia, verbo?.categoria);
    if (dominio) {
      const plateia = calcularContexto(content, camp).presentes;
      treinar(content, camp, dominio, { mestre: 0.2, esforco: 0.5, recursos: 0.5 });
      registrarDemonstracao(content, camp, {
        dominio,
        dificuldade: Math.min(100, teste.dificuldade * 4),
        sucesso: !!resultado?.sucesso,
        testemunhas: plateia,
      });
    }
  }

  // Avança o tempo e cresce impulsos (GDD §1, §5).
  if (custoPeriodos > 0) {
    camp.calendario = avancarPeriodos(camp.calendario, custoPeriodos);
    crescerImpulsos(camp, custoPeriodos);
    // O vale não espera: o tempo cobra de todo mundo, não só do jogador.
    avancarMundo(content, camp);
  }

  const fatoBase = verbo
    ? construirFato(verbo, alvo, resultado)
    : `${rotulo}${resultado ? ` — ${NOME_GRAU[resultado.grau]}` : ''}.`;
  const fato = cartaUsada ? `${fatoBase} (a memória de "${cartaUsada}" pesou na hora.)` : fatoBase;

  atualizarNpcs(camp, content, alvo, verbo, grau, rotulo);

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
