// ARCANUM · Resolvedor de turno. A engine resolve; o modelo (ou o fallback) narra (GDD §4.4, §35).
import { atualizarLivro } from './livro';
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
import { processarSubidaDeNivel } from './progresso';
import { avancarPeriodos } from './time';
import { avancarMundo } from './mundo';
import { clampRecursos } from './character';
import { crescerImpulsos, saciar } from './impulsos';
import { penalidadeEstado } from './risco';
import { calcularContexto } from './availability';
import type { Natureza } from './risco';
import { aplicarEfeito, substituirAlvo } from './effects';
import { propagarParaFamilia } from './familiasNpc';
import { manaDeEstudo } from './classe';
import { lembrarDoTurno } from './memoria';
import { todosNpcs, npcPorId } from './elenco';
import { dominioDaAcao, treinar, registrarDemonstracao } from './aptidao';
import {
  registrarNaGuildaTsige,
  realizarContratoAlma,
  ativarSakai,
  executarTreinoConcentracaoQuaseMorte,
  executarMomentoRomanceServa,
} from './tsukimichi';
import { iniciarCombate } from './combat';
import { registrarCrime } from './guarda';
import {
  conversarASos,
  apoiarDesejoNpc,
  confortarLutoNpc,
  presentearNpc,
} from './intimidadeNpc';

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
  // "dizer": acaoLivre é fala do jogador, palavra por palavra.
  tipoAcaoLivre?: 'fazer' | 'dizer';
  // Fim de combate: o log da engine, na ordem, vira as batidas da cena.
  batidasCombate?: string[];
  // Abertura, chegada, capítulo novo: cena longa com estrutura de capítulo.
  modoCena?: 'capitulo';
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
  // Regência: flerta-se COM alguém, mente-se PARA alguém.
  const prep: Record<string, string> = { flertar: 'com ', conversar: 'com ', conversar_a_sos: 'com ', mentir: 'para ', barganhar: 'com ', negociar: 'com ' };
  const alvoTxt = alvo ? ` ${prep[verbo.id] ?? ''}${alvo.nome}` : '';
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
  if (camp.abordagem) return { fato: `${camp.abordagem.guarda} te cercou e espera resposta: render-se, subornar, fugir ou lutar.`, custoPeriodos: 0, efeitosAplicados: [] };
  if (p.condicoes.includes('preso')) return { fato: 'Você está na cela da guarda; daqui só se sai cumprindo a pena, pagando fiança ou fugindo.', custoPeriodos: 0, efeitosAplicados: [] };
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

  // Aprender fazendo: todo teste de verdade dá um pouco de experiência — até
  // a sessão 87 só luta e quatro verbos davam XP, e quem vivia de conversa,
  // ofício e investigação ficava no nível 1 (e com 44 de vida) para sempre.
  // Não soma se o próprio verbo já pagou XP.
  if (teste && resultado && !aplicados.some((ef) => ef.tipo === 'xp')) {
    const peso = Math.max(0, teste.dificuldade - 10) / 2;
    const xp = resultado.grau === 'critico' ? Math.round(6 + peso * 2)
      : resultado.sucesso ? Math.round(3 + peso)
      : 1;
    const ef: Efeito = { tipo: 'xp', delta: xp };
    aplicarEfeito(camp, ef);
    aplicados.push(ef);
    processarSubidaDeNivel(camp);
  }

  // Arcanista: estudar devolve mana a ela, e so a ela (engine/classe.ts).
  // Para o resto do elenco, estudar continua sendo o que sempre foi.
  if (verbo?.id === 'estudar') {
    const extra = manaDeEstudo(camp);
    if (extra > 0) {
      const ef: Efeito = { tipo: 'recurso', recurso: 'mana', delta: extra };
      aplicarEfeito(camp, ef);
      aplicados.push(ef);
    }
  }

  // O que o jogador fez a uma pessoa chega à família dela, mais fraco
  // (engine/familiasNpc.ts).
  // A guarda viu: todo efeito que derruba a reputação com ela é crime visto
  // (furto pego, agressão em público…) e deixa o jogador procurado por
  // arruaça na região (engine/guarda.ts).
  const vistoPelaGuarda = aplicados.reduce((s, ef) => s + (ef.tipo === 'reputacao' && ef.faccao === 'guarda' && ef.delta < 0 ? -ef.delta : 0), 0);
  if (vistoPelaGuarda > 0 && !camp.prisao) {
    const nomeVerbo = intencao.tipo === 'verbo' ? content.verbos.find((v) => v.id === intencao.verboId)?.nome?.toLowerCase() : undefined;
    const lugar = content.locais.find((l) => l.id === camp.localAtual)?.nome ?? 'aqui';
    registrarCrime(content, camp, 'arruaca', Math.round(vistoPelaGuarda * 1.5), `${nomeVerbo ?? 'desordem'} em ${lugar}`);
  }
  for (const ef of aplicados) {
    if (ef.tipo === 'relacao') propagarParaFamilia(content, camp, ef.npc, ef.eixo, ef.delta);
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

  let fatoBase = verbo
    ? construirFato(verbo, alvo, resultado)
    : `${rotulo}${resultado ? ` — ${NOME_GRAU[resultado.grau]}` : ''}.`;

  if (
    (intencao.tipo === 'opcao' && intencao.opcao.id === 'registrar_guilda_tsige') ||
    (intencao.tipo === 'verbo' && intencao.verboId === 'registrar_guilda')
  ) {
    const resGuilda = registrarNaGuildaTsige(camp);
    fatoBase = resGuilda.mensagem;
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'sondar_wasteland_kai') {
    if (camp.personagem.sakai?.desbloqueado) {
      ativarSakai(camp, 'percepcao');
    }
    fatoBase =
      'Você expande a membrana do Kai como uma cúpula translúcida sobre a terra calcinada. A vastidão do miasma se abre aos seus sentidos: correntes colossais de mana pulsam a leste no Desfiladeiro do Dragão Adormecido envolto em bruma perpétua, enquanto a sudoeste jazem carcaças secas que marcam o caminho para o Portão do Ermo de Tsige. Feras espreitam além das dunas.';
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'cacar_feras_wasteland') {
    fatoBase =
      'Você marcha pelas dunas de cinza e rastreia pegadas monstruosas até um ninho de feras selvagens da Wasteland. As criaturas erguem as carapaças e investem com presas faiscantes.';
    iniciarCombate(content, camp, ['lobo_chifre']);
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'meditar_cratera_wasteland') {
    p.recursos.vida += 20;
    p.recursos.vigor += 20;
    fatoBase =
      'Sentado nas rochas vitrificadas da cratera da queda, você fecha os olhos e guia o turbilhão primordial de mana que queima nas suas veias. O corpo assimila o impacto do desterro celestial, o vigor retoma o ritmo firme e a mente alcança o Vazio sereno.';
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'treino_concentracao_quase_morte') {
    const resTreino = executarTreinoConcentracaoQuaseMorte(camp);
    fatoBase = resTreino.mensagem;
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'pacto_shen') {
    fatoBase =
      'Você avança resoluto em direção ao Desfiladeiro do Dragão Adormecido. A névoa perpétua se fecha em labirintos ilusórios e a colossal silhueta de Muteki Shen desce dos céus com sopros de vácuo para desafiar sua força em combate!';
    iniciarCombate(content, camp, ['dragao_shen']);
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'pacto_aranha') {
    fatoBase =
      'Você adentra as águas turvas do Pântano da Bruma. Fios negros de mana vibram no ar e a monstruosa Aranha da Calamidade emerge em frenesi faminto, pronta para a batalha!';
    iniciarCombate(content, camp, ['aranha_calamidade']);
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'pacto_suzaku') {
    fatoBase =
      'Você atinge o cume ardente do Ninho da Fênix. O horizonte incendeia-se em chamas celestes quando Suzaku desce com plumas solares abrasadoras para o confronto!';
    iniciarCombate(content, camp, ['fenix_suzaku']);
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'romance_mio_termas') {
    const resRomance = executarMomentoRomanceServa(camp, 'aranha_calamidade', 'termas_mio');
    fatoBase = resRomance.fato;
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'romance_tomoe_sake') {
    const resRomance = executarMomentoRomanceServa(camp, 'dragao_shen', 'sake_tomoe');
    fatoBase = resRomance.fato;
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'romance_suzaku_chamas') {
    const resRomance = executarMomentoRomanceServa(camp, 'fenix_suzaku', 'chamas_suzaku');
    fatoBase = resRomance.fato;
  } else if (intencao.tipo === 'opcao' && intencao.opcao.id === 'romance_passeio_vila') {
    const resRomance = executarMomentoRomanceServa(camp, '', 'passeio_vila');
    fatoBase = resRomance.fato;
  } else if (
    intencao.tipo === 'opcao' &&
    (intencao.opcao.id.startsWith('grade_aproximar_conversar_a_sos_') ||
      intencao.opcao.id.startsWith('conversar_a_sos_'))
  ) {
    const alvoId = intencao.alvoId ?? intencao.opcao.alvoId ?? alvo?.id;
    if (alvoId) {
      const res = conversarASos(content, camp, alvoId);
      fatoBase = res.texto;
    }
  } else if (
    intencao.tipo === 'opcao' &&
    (intencao.opcao.id.startsWith('grade_aproximar_apoiar_desejo_') ||
      intencao.opcao.id.startsWith('apoiar_desejo_'))
  ) {
    const alvoId = intencao.alvoId ?? intencao.opcao.alvoId ?? alvo?.id;
    if (alvoId) {
      const res = apoiarDesejoNpc(content, camp, alvoId);
      fatoBase = res.texto;
    }
  } else if (
    intencao.tipo === 'opcao' &&
    (intencao.opcao.id.startsWith('grade_aproximar_confortar_luto_') ||
      intencao.opcao.id.startsWith('confortar_luto_'))
  ) {
    const alvoId = intencao.alvoId ?? intencao.opcao.alvoId ?? alvo?.id;
    if (alvoId) {
      const res = confortarLutoNpc(content, camp, alvoId);
      fatoBase = res.texto;
    }
  } else if (
    intencao.tipo === 'opcao' &&
    (intencao.opcao.id.startsWith('grade_aproximar_presentear_') ||
      intencao.opcao.id.startsWith('presentear_'))
  ) {
    const alvoId = intencao.alvoId ?? intencao.opcao.alvoId ?? alvo?.id;
    if (alvoId) {
      const res = presentearNpc(content, camp, alvoId);
      fatoBase = res.texto;
    }
  }

  const fato = cartaUsada ? `${fatoBase} (a memória de "${cartaUsada}" pesou na hora.)` : fatoBase;

  atualizarNpcs(camp, content, alvo, verbo, grau, rotulo);

  // Sequela: se a vida chegou a 0 (GDD §15) — marca condição agonizante.
  if (p.recursos.vida <= 0 && !p.condicoes.includes('agonizante')) {
    p.condicoes.push('agonizante');
  }

  clampRecursos(p);
  // O que passou pela mão neste turno entra no Livro (engine/livro.ts).
  atualizarLivro(content, camp);

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
