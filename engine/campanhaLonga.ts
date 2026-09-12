// ARCANUM · Simulador de campanhas longas.
//
// O que já existia validava peças: `selftest.ts` testa regras isoladas e
// `sim.ts` roda 20 períodos com o menu de verbos. Nenhum dos dois nunca
// atravessou um ano de calendário — e praticamente todo sistema novo do vale
// (cidades, autonomia, política, nemesis, missões vivas, diretor) só começa a
// se comportar de verdade depois de centenas de dias. Fome, migração,
// sucessão, obra concluída e rival que evolui não cabem em vinte períodos.
//
// Este módulo joga a campanha inteira sem tela e sem narrador: um agente
// escolhe verbos reais, viaja pelo mapa real, entra nos combates reais e
// salva/carrega no meio do caminho. A cada passo ele confere invariantes —
// coisas que NUNCA podem acontecer, não importa a semente. Uma violação é um
// bug encontrado, com dia e detalhe, e não uma impressão.
//
// Uso: npm run sim:longo -- <anos> <campanhas>
import type { Campaign, ContentBundle, MarcaInfancia } from './types';
import { criarCampanha } from './campaign';
import { calcularContexto, disponibilidadeVerbo } from './availability';
import { resolverIntencao } from './turn';
import { atributosBase } from './character';
import { nextFloat, pick } from './rng';
import { viajar, rotasVisiveis } from './viagem';
import { jogadorAtaca, jogadorFoge, jogadorAcaoTatica, jogadorConjura, jogadorUsaItemCombate, fecharCombate } from './combat';
import { normalizarCampanha } from './migracao';
import { executarAcaoMundo } from './acoesMundo';
import { resolverEtapaInfancia } from './familia';
import { aprenderArte, mestresQueEnsinamAqui } from './magic';
import { DIAS_POR_ANO } from './vidanpc';
import { DOMINIOS } from './aptidaoTypes';
import { contextoDeAptidao, maestriaDe } from './aptidao';
import { planejarMissao } from './planejadorSim';

export type Violacao = { dia: number; regra: string; detalhe: string };

export type Metricas = {
  seed: string;
  dias: number;
  anos: number;
  causaFim: 'idade' | 'morte' | 'fim_do_prazo' | 'limite_acoes' | 'travado_em_combate';
  acoes: number;
  viagens: number;
  combates: number;
  combatesIniciados: number;
  combatesPorViagem: number;
  combatesPorPainel: number;
  combatesPorVerbo: number;
  vitorias: number;
  derrotas: number;
  fugas: number;
  passosSemVerbo: number;
  passosSemEfeito: number;
  conjuracoes: number;
  rodadaMaisLonga: number;
  artesAprendidas: number;
  /** Expedicoes de desafio enfrentadas (o topo nao-oni do bestiario). */
  expedicoes: number;
  etapasDeInfancia: number;
  missoesGeradas: number;
  missoesConcluidas: number;
  missoesFalhadas: number;
  compromissosFalhados: number;
  oportunidadesExpiradas: number;
  missoesResolvidasPorOutros: number;
  npcsMortos: number;
  npcsNascidos: number;
  rivaisCriados: number;
  rivaisMortos: number;
  guerras: number;
  emboscadas: number;
  cidadesArruinadas: number;
  picoDeFome: number;
  diasCidadeEmFome: number;
  diasComRival: number;
  populacaoFinal: number;
  nivelFinal: number;
  /** Despertares concedidos pela historia (ver engine/progresso.ts). */
  despertares: number;
  /**
   * Ganchos do mapa que viraram missao (ver engine/ganchos.ts). A flag so e'
   * gravada quando a missao nasceu de fato, entao este numero e' a contagem
   * de missoes de gancho da campanha.
   */
  ganchosUsados: number;
  idadeFinal: number;
  tiposDeFato: number;
  assinatura: string;
  /** Vitorias, derrotas e fugas por faixa de nivel na hora do combate. */
  porFaixa: Record<string, { v: number; d: number; f: number }>;
};

export type ResultadoSimulacao = { metricas: Metricas; violacoes: Violacao[] };

export type OpcoesSimulacao = {
  seed: string;
  anos: number;
  /** Marca de nascimento, para medir se a genese muda o desfecho. */
  marca?: MarcaInfancia;
  /** De quantos em quantos dias fazer um ciclo salvar → carregar. */
  intervaloSave?: number;
  /** Teto de ações, para uma campanha travada não rodar para sempre. */
  maxAcoes?: number;
  politica?: 'exploratoria' | 'objetivos';
};

// A pergunta que importa nao e a taxa global de vitoria, e se a escada de
// poder chega ao combate: um personagem de nivel 22 tem de ganhar mais do que
// um de nivel 4. Sem isso, nascer prodigio tambem nao significaria nada.
function faixaDeNivel(n: number): string {
  return n <= 5 ? '01-05' : n <= 10 ? '06-10' : n <= 15 ? '11-15' : n <= 20 ? '16-20' : n <= 25 ? '21-25' : '26+';
}

const finito = (n: unknown): boolean => typeof n === 'number' && Number.isFinite(n);

// ── Invariantes ───────────────────────────────────────────────────────────
//
// Cada regra abaixo descreve algo que a engine promete e que nenhuma semente
// pode quebrar. O verificador não julga balanceamento — só consistência.
function conferirInvariantes(
  content: ContentBundle,
  camp: Campaign,
  mortosConhecidos: Set<string>,
  idadeAnterior: number,
  fora: Violacao[],
): void {
  const emCombateAgora = !!(camp.combate && !camp.combate.terminado);
  const dia = camp.calendario.dia;
  const viola = (regra: string, detalhe: string) => {
    if (fora.length < 200) fora.push({ dia, regra, detalhe });
  };

  const p = camp.personagem;
  for (const [k, v] of Object.entries(p.recursos)) {
    if (!finito(v)) viola('recurso_nao_finito', `recursos.${k} = ${v}`);
    else if (v > (p.recursosMax[k] ?? Infinity)) viola('recurso_acima_do_teto', `${k} ${v} > ${p.recursosMax[k]}`);
  }
  for (const [k, v] of [['dinheiro', p.dinheiro], ['xp', p.xp], ['nivel', p.nivel], ['idade', p.idade ?? 20]] as const) {
    if (!finito(v)) viola('numero_nao_finito', `personagem.${k} = ${v}`);
  }
  if (p.dinheiro < 0) viola('dinheiro_negativo', `dinheiro = ${p.dinheiro}`);
  if ((p.idade ?? 20) < idadeAnterior) viola('idade_regrediu', `${idadeAnterior} -> ${p.idade}`);

  const grupo = camp.grupo ?? [];
  if (grupo.length > 2) viola('grupo_acima_do_limite', `${grupo.length} companheiros`);
  for (const id of grupo) {
    if (camp.npcState[id]?.vivo === false) viola('morto_no_grupo', id);
  }

  // Quem morreu não volta a andar pelo mapa.
  const presentes = calcularContexto(content, camp).presentes;
  for (const npc of presentes) {
    if (camp.npcState[npc.id]?.vivo === false) viola('morto_presente_na_cena', npc.id);
  }

  const v = camp.vivo;
  if (v) {
    if (v.fatos.length > 300) viola('historico_sem_teto', `${v.fatos.length} fatos`);
    const abertas = v.missoes.filter(q => q.estado === 'oferecida' || q.estado === 'aceita');
    if (abertas.length > 12) viola('missoes_abertas_acima_do_teto', `${abertas.length} abertas`);
    // Durante um combate o calendario anda (uma rodada a cada doze vira um
    // periodo) mas o mundo NAO tiquetaqueia: nao da para uma cidade produzir
    // no meio de uma troca de golpes. O mundo recupera os dias quando a luta
    // acaba (ver encerrar(), em engine/combat.ts). Cobrar prazo de missao com
    // combate aberto e' cobrar um atraso legitimo.
    if (!emCombateAgora) {
      for (const q of abertas) {
        if (q.prazo < dia - 1) viola('missao_vencida_ainda_aberta', `${q.id} prazo ${q.prazo}`);
      }
    }
    for (const [id, c] of Object.entries(v.cidades)) {
      for (const [k, n] of [['comida', c.comida], ['materiais', c.materiais], ['remedios', c.remedios], ['tesouro', c.tesouro]] as const) {
        if (!finito(n)) viola('estoque_nao_finito', `${id}.${k} = ${n}`);
        else if (n < 0) viola('estoque_negativo', `${id}.${k} = ${n}`);
      }
      if (c.doenca < 0 || c.doenca > 100) viola('doenca_fora_da_faixa', `${id} = ${c.doenca}`);
      if (c.inseguranca < 0 || c.inseguranca > 100) viola('inseguranca_fora_da_faixa', `${id} = ${c.inseguranca}`);
      const povo = camp.continuidade?.locais[id];
      if (povo) {
        if (povo.populacao < 0) viola('populacao_negativa', `${id} = ${povo.populacao}`);
        if (povo.integridade < 0 || povo.integridade > 100) viola('integridade_fora_da_faixa', `${id} = ${povo.integridade}`);
      }
    }
    for (const [id, pessoa] of Object.entries(v.pessoas)) {
      if (!finito(pessoa.saude) || !finito(pessoa.fome) || !finito(pessoa.moedas)) {
        viola('vida_civil_nao_finita', `${id}`);
      }
      if (pessoa.moedas < 0) viola('moedas_civis_negativas', `${id} = ${pessoa.moedas}`);
    }
  }

  // Morte única: um rival marcado como morto nunca reaparece vivo.
  for (const r of Object.values(camp.kimetsu?.rivais ?? {})) {
    if (!r.vivo) mortosConhecidos.add(r.id);
    else if (mortosConhecidos.has(r.id)) viola('morto_ressuscitou', `${r.id} (${r.nome})`);
  }

  const s = camp.combate;
  if (s && !s.terminado) {
    for (const a of s.atores) {
      if (a.mortoDefinitivo && a.vida > 0) viola('morto_definitivo_com_vida', `${a.id} vida ${a.vida}`);
      if (!finito(a.vida)) viola('vida_de_ator_nao_finita', `${a.id} = ${a.vida}`);
    }
  }

  // Aptidao: o mundo nunca pode saber mais do que foi mostrado, e o numero
  // oculto nunca pode vazar para o pacote publico.
  const apt = camp.aptidao;
  if (apt) {
    const publico = JSON.stringify(contextoDeAptidao(camp) ?? {});
    for (const d of DOMINIOS) {
      if (!finito(apt.aptidao[d]) || apt.aptidao[d] < 0 || apt.aptidao[d] > 100) {
        viola('aptidao_fora_da_faixa', `${d} = ${apt.aptidao[d]}`);
      }
      if (apt.reputacao[d] > apt.exposicao[d] + 0.5) {
        viola('reputacao_acima_da_exposicao', `${d} rep ${apt.reputacao[d].toFixed(1)} > exp ${apt.exposicao[d].toFixed(1)}`);
      }
      // A fama pode passar da reputacao ATUAL: gloria antiga esfria devagar.
      // O que ela nunca pode ultrapassar e' o pico historico.
      if (apt.fama[d] > (apt.picoReputacao[d] ?? 0) + 0.5) {
        viola('fama_acima_do_pico', `${d} fama ${apt.fama[d].toFixed(1)} > pico ${(apt.picoReputacao[d] ?? 0).toFixed(1)}`);
      }
      const m = maestriaDe(camp, d);
      if (m < 0 || m > 100 || !finito(m)) viola('maestria_fora_da_faixa', `${d} = ${m}`);
      if (publico.includes(`"aptidaoReal"`)) viola('aptidao_vazou', d);
    }
    for (const [npcId, porDominio] of Object.entries(apt.crencas)) {
      for (const [d, c] of Object.entries(porDominio)) {
        if (!c) continue;
        if (c.observacoes === 0 && c.valor !== 0) viola('crenca_sem_observacao', `${npcId}/${d}`);
        if (!finito(c.valor) || c.valor < 0 || c.valor > 100) viola('crenca_fora_da_faixa', `${npcId}/${d} = ${c.valor}`);
      }
    }
    const degraus = apt.reacoes.map(r => `${r.dominio}:${r.degrau}`);
    if (new Set(degraus).size !== degraus.length) viola('degrau_repetido', degraus.join(','));
  }

  if (camp.mundo && camp.mundo.diaProcessado > dia) {
    viola('mundo_adiantado', `diaProcessado ${camp.mundo.diaProcessado} > dia ${dia}`);
  }
}

// Retrato barato do estado, para comparar antes/depois de salvar e carregar.
function retrato(camp: Campaign): string {
  const mortos = Object.values(camp.kimetsu?.rivais ?? {}).filter(r => !r.vivo).length;
  return [
    camp.calendario.dia, camp.localAtual, camp.personagem.dinheiro, camp.personagem.nivel,
    camp.personagem.recursos.vida, camp.vivo?.fatos.length ?? 0,
    camp.vivo?.missoes.length ?? 0, mortos, (camp.grupo ?? []).length,
  ].join('|');
}

function contarVivos(camp: Campaign): number {
  return Object.values(camp.npcState).filter(d => d.vivo).length;
}


// O painel do mundo é metade do jogo: cativeiro, descanso, trabalho, notícias
// e as missões vivas só existem por ali (ver engine/acoesMundo.ts). Um agente
// que só aperta verbos joga um jogo que nenhum jogador joga — e mede errado.
// Devolve true quando gastou o passo aqui.
function acaoDeMundo(content: ContentBundle, camp: Campaign, m: Metricas, objetivos = false): boolean | 'viagem' {
  const p = camp.personagem;
  // A campanha começa no nascimento: o prólogo dos 0 aos 18 anos tranca todo o
  // resto até acabar (ver engine/familia.ts e a guarda em acoesMundo.ts).
  const f = camp.familia;
  if (f && !f.prologoConcluido) {
    const evento = f.eventoAtual;
    if (!evento) return false;
    resolverEtapaInfancia(content, camp, pick(camp.rng, evento.opcoes).id);
    m.etapasDeInfancia++;
    return true;
  }

  // Preso: a única saída é esta. Verbo nenhum funciona, e o turno não anda.
  if (p.condicoes.includes('cativo')) {
    executarAcaoMundo(content, camp, { tipo: 'libertar_se' });
    return true;
  }
  // Machucado o bastante para valer a estadia.
  if (p.recursos.vida < p.recursosMax.vida * 0.45 && p.dinheiro >= 3) {
    if (executarAcaoMundo(content, camp, { tipo: 'descansar' }).ok) return true;
  }
  // Sem dinheiro para nada: trabalha.
  if (p.dinheiro < 30 && nextFloat(camp.rng) < 0.4) {
    if (executarAcaoMundo(content, camp, { tipo: 'trabalhar' }).ok) return true;
  }

  if (objetivos) {
    const plano = planejarMissao(content, camp);
    if (plano?.tipo === 'viajar') {
      const r = viajar(content, camp, plano.destino);
      if (r.ok) { m.viagens++; return 'viagem'; }
    } else if (plano && executarAcaoMundo(content, camp, plano.acao).ok) return true;
  }

  // Um mestre por perto que ensina algo alcançável é oportunidade que ninguém
  // deixa passar — e é o único caminho para as respirações entrarem em jogo.
  for (const { artes } of mestresQueEnsinamAqui(content, camp)) {
    for (const a of artes) {
      if (aprenderArte(content, camp, a.id).ok) {
        m.artesAprendidas++;
        return true;
      }
    }
  }

  // Expedicoes (content/vaelhorn/desafios.ts). Sao o topo do que nao e' oni:
  // fichas fixas de nivel 10 a 32, cacadas de proposito, nunca sorteadas na
  // estrada. Ate a sessao 19 o simulador jamais encostava numa delas, e o
  // resultado era uma taxa de vitoria medida so' contra bicho de beira de
  // estrada — o numero parecia otimo e nao dizia nada sobre o topo do jogo.
  //
  // O agente aceita como um jogador aceitaria: inteiro de vida e com lamina
  // treinada. Nao consulta a regua de poder, que o jogador nao tem. Perder
  // aqui e' resultado legitimo, e e' justamente o que queremos poder medir.
  const inteiro = p.recursos.vida >= p.recursosMax.vida * 0.9;
  if (inteiro && maestriaDe(camp, 'espada') >= 25) {
    for (const d of content.desafios ?? []) {
      if (d.local !== camp.localAtual || camp.flags[`desafio.concluido.${d.id}`]) continue;
      if (executarAcaoMundo(content, camp, { tipo: 'desafio', id: d.id }).ok) {
        m.expedicoes++;
        return true;
      }
    }
  }

  const v = camp.vivo;
  if (v && !objetivos) {
    const conhecidas = v.missoes.filter(q => q.conhecida && camp.calendario.dia <= q.prazo);
    const aceitar = conhecidas.find(q => q.estado === 'oferecida');
    if (aceitar && nextFloat(camp.rng) < 0.7) {
      if (executarAcaoMundo(content, camp, { tipo: 'missao', id: aceitar.id, escolha: 'aceitar' }).ok) return true;
    }
    for (const q of conhecidas.filter(q => q.estado === 'aceita')) {
      const alvo = q.tipo === 'escoltar' && q.etapa > 0 ? q.destino : q.local;
      if (camp.localAtual !== alvo) continue;
      const escolha =
        q.tipo === 'investigar' ? (q.etapa === 0 ? 'investigar' : 'confrontar') :
        p.dinheiro >= 30 ? 'ajudar' : 'negociar';
      const r = executarAcaoMundo(content, camp, { tipo: 'missao', id: q.id, escolha });
      if (r.ok) return true;
    }
    if (nextFloat(camp.rng) < 0.05 && executarAcaoMundo(content, camp, { tipo: 'noticias' }).ok) return true;
  }
  return false;
}

// ── O agente ──────────────────────────────────────────────────────────────
export function simularCampanhaLonga(content: ContentBundle, opts: OpcoesSimulacao): ResultadoSimulacao {
  const { seed, anos } = opts;
  const intervaloSave = opts.intervaloSave ?? 90;
  const maxAcoes = opts.maxAcoes ?? anos * 4000;
  const diaAlvo = anos * DIAS_POR_ANO;

  let camp = criarCampanha(content, {
    nome: 'Simulado',
    atributos: atributosBase(),
    classeId: 'batedor',
    origemId: 'foragido',
    seedString: seed,
    marcaInfancia: opts.marca,
  });

  const violacoes: Violacao[] = [];
  const mortosConhecidos = new Set<string>();
  const m: Metricas = {
    seed, dias: 0, anos: 0, causaFim: 'fim_do_prazo',
    acoes: 0, viagens: 0, combates: 0, combatesIniciados: 0, combatesPorViagem: 0, combatesPorPainel: 0, combatesPorVerbo: 0, vitorias: 0, derrotas: 0, fugas: 0,
    passosSemVerbo: 0, passosSemEfeito: 0, conjuracoes: 0, rodadaMaisLonga: 0, artesAprendidas: 0, expedicoes: 0, etapasDeInfancia: 0, missoesGeradas: 0, missoesConcluidas: 0, missoesFalhadas: 0, compromissosFalhados: 0, oportunidadesExpiradas: 0,
    missoesResolvidasPorOutros: 0, npcsMortos: 0, npcsNascidos: 0,
    rivaisCriados: 0, rivaisMortos: 0, guerras: 0, emboscadas: 0, cidadesArruinadas: 0,
    picoDeFome: 0, diasCidadeEmFome: 0, diasComRival: 0, populacaoFinal: 0, nivelFinal: 1, despertares: 0, ganchosUsados: 0, idadeFinal: 20,
    tiposDeFato: 0, assinatura: '', porFaixa: {},
  };

  const vivosIniciais = contarVivos(camp);
  const npcsIniciais = Object.keys(camp.npcState).length;
  let guerraAnterior = false;
  let proximoSave = intervaloSave;
  let idadeAnterior = camp.personagem.idade ?? 20;

  let combateAnterior = false;
  let ultimoDiaContado = 0;
  while (camp.calendario.dia < diaAlvo && m.acoes < maxAcoes) {
    let origemAcao: boolean | 'viagem' = false;
    const emCombate = !!(camp.combate && !camp.combate.terminado);
    if (emCombate && !combateAnterior) m.combatesIniciados++;
    combateAnterior = emCombate;
    const p = camp.personagem;
    const s = camp.combate;
    if (s && !s.terminado) {
      // Combate real, com as mesmas funções que a tela usa.
      const inimigos = s.atores.filter(a => !a.ehJogador && !a.ehAliado && a.vida > 0);
      const eu = s.atores.find(a => a.ehJogador);
      m.rodadaMaisLonga = Math.max(m.rodadaMaisLonga, s.rodada);
      const antes = `${s.rodada}/${s.turno}/${s.log.length}`;
      if (!inimigos.length || !eu) {
        fecharCombate(camp);
      } else if (eu.tatico?.sono) {
        // Indução ao sono (Enmu): atacar não faz nada enquanto o sonho segura.
        jogadorAcaoTatica(content, camp, 'despertar');
      } else if (eu.tatico?.preso) {
        jogadorAcaoTatica(content, camp, 'libertar');
      } else {
        const alvo = [...inimigos].sort((a, b) => a.vida - b.vida)[0];
        // Um jogador de verdade cura, conjura e só foge quando não há saída.
        const cura = Object.keys(p.inventario).find(id => {
          const it = content.itens.find(i => i.id === id);
          return it?.slot === 'consumivel' && it.efeitosUso?.some(e => e.tipo === 'recurso' && e.recurso === 'vida' && e.delta > 0);
        });
        const arte = p.artesConhecidas.find(id => (eu.recargas?.[id] ?? 0) <= s.rodada);
        if (eu.vida < eu.vidaMax * 0.4 && cura) {
          jogadorUsaItemCombate(content, camp, cura);
        } else if (eu.vida < eu.vidaMax * 0.25) {
          jogadorFoge(content, camp);
        } else if (arte && nextFloat(camp.rng) < 0.6 && jogadorConjura(content, camp, arte, alvo.id).ok) {
          m.conjuracoes++;
        } else {
          jogadorAtaca(content, camp, alvo.id);
        }
      }
      // Um passo que não mexeu em nada é um travamento real, não um turno.
      if (camp.combate && !camp.combate.terminado && `${camp.combate.rodada}/${camp.combate.turno}/${camp.combate.log.length}` === antes) {
        m.passosSemEfeito++;
        if (m.passosSemEfeito > 200) { m.causaFim = 'travado_em_combate'; break; }
      }
      if (camp.combate?.terminado) {
        m.combates++;
        const r = camp.combate.resultado;
        const cel = (m.porFaixa[faixaDeNivel(p.nivel)] ??= { v: 0, d: 0, f: 0 });
        if (r === 'vitoria') { m.vitorias++; cel.v++; }
        else if (r === 'fuga') { m.fugas++; cel.f++; }
        else { m.derrotas++; cel.d++; }
        fecharCombate(camp);
      }
      m.acoes++;
    } else if ((origemAcao = acaoDeMundo(content, camp, m, opts.politica === 'objetivos'))) {
      if (camp.combate && !camp.combate.terminado) {
        if (origemAcao === 'viagem') m.combatesPorViagem++; else m.combatesPorPainel++;
      }
      m.acoes++;
    } else {
      const ctx = calcularContexto(content, camp);
      const rotas = rotasVisiveis(content, camp);
      // Um jogador real não fica parado num lugar só: viaja de vez em quando.
      if (rotas.length && nextFloat(camp.rng) < 0.18) {
        const r = viajar(content, camp, pick(camp.rng, rotas).destino);
        if (r.ok) m.viagens++;
        if (r.encontro) m.combatesPorViagem++;
        m.acoes++;
      } else {
        const disponiveis = content.verbos.filter(v => {
          const alvo = v.alvo === 'pessoa' ? ctx.presentes[0] : undefined;
          if (v.alvo === 'pessoa' && !alvo) return false;
          return disponibilidadeVerbo(v, ctx, camp, alvo).disponivel;
        });
        if (disponiveis.length === 0) {
          m.passosSemVerbo++;
          // Deixar o tempo correr é sempre uma escolha (GDD §1).
          resolverIntencao(content, camp, {
            tipo: 'opcao',
            opcao: { id: 'esperar', rotulo: 'Deixar o tempo correr', custoPeriodos: 1, origem: 'livre' },
          });
        } else {
          const verbo = pick(camp.rng, disponiveis);
          resolverIntencao(content, camp, {
            tipo: 'verbo',
            verboId: verbo.id,
            alvoId: verbo.alvo === 'pessoa' ? ctx.presentes[0]?.id : undefined,
          });
          if (camp.combate && !camp.combate.terminado) m.combatesPorVerbo++;
        }
        m.acoes++;
      }
    }

    // Acumuladores por dia virado: fome medida em dias-cidade, não em pico.
    if (camp.calendario.dia > ultimoDiaContado) {
      const dias = camp.calendario.dia - ultimoDiaContado;
      ultimoDiaContado = camp.calendario.dia;
      const cidades = Object.values(camp.vivo?.cidades ?? {});
      m.diasCidadeEmFome += dias * cidades.filter(c => c.fomeDias > 0).length;
      m.diasComRival += dias * Object.values(camp.kimetsu?.rivais ?? {}).filter(r => r.vivo).length;
    }
    if (camp.mundo?.guerraAtiva && !guerraAnterior) m.guerras++;
    guerraAnterior = !!camp.mundo?.guerraAtiva;

    conferirInvariantes(content, camp, mortosConhecidos, idadeAnterior, violacoes);
    idadeAnterior = camp.personagem.idade ?? idadeAnterior;

    if (p.recursos.vida <= 0 && !camp.combate) {
      m.causaFim = 'morte';
      break;
    }

    // Salvar, fechar e voltar — o ciclo que uma campanha de anos faz centenas
    // de vezes e que nenhum teste anterior exercitava.
    if (camp.calendario.dia >= proximoSave) {
      proximoSave = camp.calendario.dia + intervaloSave;
      const antes = retrato(camp);
      const recarregada = normalizarCampanha(content, JSON.parse(JSON.stringify(camp)) as Campaign);
      const depois = retrato(recarregada);
      if (antes !== depois) {
        violacoes.push({
          dia: camp.calendario.dia,
          regra: 'save_alterou_o_estado',
          detalhe: `antes ${antes} / depois ${depois}`,
        });
      }
      camp = recarregada;
    }
  }

  // ── Coleta final ────────────────────────────────────────────────────────
  const v = camp.vivo;
  m.dias = camp.calendario.dia;
  m.anos = Math.floor(m.dias / DIAS_POR_ANO);
  m.nivelFinal = camp.personagem.nivel;
  m.despertares = camp.despertares?.length ?? 0;
  m.ganchosUsados = Object.keys(camp.flags).filter(k => k.startsWith('gancho.usado.')).length;
  m.idadeFinal = camp.personagem.idade ?? 20;
  if (m.causaFim !== 'morte' && m.acoes >= maxAcoes) m.causaFim = 'limite_acoes';
  if (m.causaFim === 'morte' && m.idadeFinal >= 65) m.causaFim = 'idade';
  if (v) {
    m.missoesGeradas = v.contadores.missoesGeradas ?? 0;
    // v.missoes guarda no máximo 60 encerradas (ver missoesVivas.ts); contar
    // por ali subestima a campanha inteira. Os contadores não são podados.
    m.missoesConcluidas = v.contadores.missao_concluida ?? 0;
    m.missoesFalhadas = v.contadores.missao_falhada ?? 0;
    m.compromissosFalhados = v.contadores.compromissosFalhados ?? 0;
    m.oportunidadesExpiradas = v.contadores.oportunidadesExpiradas ?? 0;
    m.missoesResolvidasPorOutros = v.contadores.missao_resolvida_por_outros ?? 0;
    m.emboscadas = v.contadores.emboscada ?? 0;
    m.picoDeFome = Math.max(0, ...Object.values(v.cidades).map(c => c.fomeDias));
    m.tiposDeFato = new Set(v.fatos.map(f => f.tipo)).size;
    m.assinatura = Object.entries(v.contadores)
      .filter(([k]) => k !== 'missoesGeradas')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, n]) => `${k}:${n}`)
      .join(',');
  }
  m.npcsNascidos = Object.keys(camp.npcState).length - npcsIniciais;
  m.npcsMortos = vivosIniciais + m.npcsNascidos - contarVivos(camp);
  const rivais = Object.values(camp.kimetsu?.rivais ?? {});
  m.rivaisCriados = rivais.length;
  m.rivaisMortos = rivais.filter(r => !r.vivo).length;
  const locais = Object.values(camp.continuidade?.locais ?? {});
  m.cidadesArruinadas = locais.filter(l => l.integridade <= 0).length;
  m.populacaoFinal = locais.reduce((t, l) => t + l.populacao, 0);
  return { metricas: m, violacoes };
}

// ── Relatório em lote ─────────────────────────────────────────────────────
export function simularLote(
  content: ContentBundle,
  anos: number,
  campanhas: number,
  prefixo = 'longa',
  marca?: MarcaInfancia,
  politica: OpcoesSimulacao['politica'] = 'exploratoria',
): { resultados: ResultadoSimulacao[]; violacoes: Violacao[] } {
  const resultados: ResultadoSimulacao[] = [];
  const violacoes: Violacao[] = [];
  for (let i = 0; i < campanhas; i++) {
    const r = simularCampanhaLonga(content, { seed: `${prefixo}-${i}`, anos, marca, politica });
    resultados.push(r);
    for (const x of r.violacoes) violacoes.push({ ...x, detalhe: `[${r.metricas.seed}] ${x.detalhe}` });
  }
  return { resultados, violacoes };
}

// Vitoria por faixa de nivel, somando todas as campanhas do lote.
export function porFaixaAgregado(resultados: ResultadoSimulacao[]): Record<string, { v: number; d: number; f: number; taxa: number }> {
  const out: Record<string, { v: number; d: number; f: number; taxa: number }> = {};
  for (const r of resultados) {
    for (const [faixa, c] of Object.entries(r.metricas.porFaixa)) {
      const a = (out[faixa] ??= { v: 0, d: 0, f: 0, taxa: 0 });
      a.v += c.v; a.d += c.d; a.f += c.f;
    }
  }
  for (const a of Object.values(out)) a.taxa = a.v + a.d + a.f ? +(100 * a.v / (a.v + a.d + a.f)).toFixed(1) : 0;
  return out;
}

export function resumir(resultados: ResultadoSimulacao[]): Record<string, number> {
  const ms = resultados.map(r => r.metricas);
  const med = (f: (m: Metricas) => number) => ms.reduce((t, m) => t + f(m), 0) / Math.max(1, ms.length);
  const distintas = new Set(ms.map(m => m.assinatura)).size;
  return {
    campanhas: ms.length,
    anosMedios: +med(m => m.anos).toFixed(1),
    acoesMedias: Math.round(med(m => m.acoes)),
    viagens: +med(m => m.viagens).toFixed(1),
    combates: +med(m => m.combates).toFixed(1),
    combatesIniciados: +med(m => m.combatesIniciados).toFixed(1),
    porViagem: +med(m => m.combatesPorViagem).toFixed(1),
    porPainel: +med(m => m.combatesPorPainel).toFixed(1),
    porVerbo: +med(m => m.combatesPorVerbo).toFixed(1),
    vitorias: +med(m => m.vitorias).toFixed(1),
    derrotas: +med(m => m.derrotas).toFixed(1),
    fugas: +med(m => m.fugas).toFixed(1),
    missoesGeradas: +med(m => m.missoesGeradas).toFixed(1),
    missoesConcluidas: +med(m => m.missoesConcluidas).toFixed(1),
    missoesFalhadas: +med(m => m.missoesFalhadas).toFixed(1),
    compromissosFalhados: +med(m => m.compromissosFalhados).toFixed(1),
    oportunidadesExpiradas: +med(m => m.oportunidadesExpiradas).toFixed(1),
    resolvidasPorOutros: +med(m => m.missoesResolvidasPorOutros).toFixed(1),
    npcsMortos: +med(m => m.npcsMortos).toFixed(1),
    npcsNascidos: +med(m => m.npcsNascidos).toFixed(1),
    rivaisCriados: +med(m => m.rivaisCriados).toFixed(1),
    rivaisMortos: +med(m => m.rivaisMortos).toFixed(1),
    guerras: +med(m => m.guerras).toFixed(1),
    emboscadas: +med(m => m.emboscadas).toFixed(1),
    cidadesArruinadas: +med(m => m.cidadesArruinadas).toFixed(1),
    picoDeFome: Math.round(med(m => m.picoDeFome)),
    diasCidadeEmFome: Math.round(med(m => m.diasCidadeEmFome)),
    rivaisVivosPorDia: +(med(m => m.diasComRival) / Math.max(1, med(m => m.dias))).toFixed(1),
    populacaoFinal: Math.round(med(m => m.populacaoFinal)),
    nivelFinal: +med(m => m.nivelFinal).toFixed(1),
    despertares: +med(m => m.despertares).toFixed(2),
    ganchosUsados: +med(m => m.ganchosUsados).toFixed(1),
    tiposDeFato: +med(m => m.tiposDeFato).toFixed(1),
    passosSemVerbo: Math.round(med(m => m.passosSemVerbo)),
    passosSemEfeito: Math.round(med(m => m.passosSemEfeito)),
    conjuracoes: Math.round(med(m => m.conjuracoes)),
    rodadaMaisLonga: Math.round(med(m => m.rodadaMaisLonga)),
    artesAprendidas: +med(m => m.artesAprendidas).toFixed(1),
    expedicoes: +med(m => m.expedicoes).toFixed(1),
    historiasDistintas: distintas,
  };
}
