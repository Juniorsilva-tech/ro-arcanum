// ARCANUM · Encontros de viagem: risco real ao se mover entre locais.
// Puxa do "perigo" que a rota já declara em content/vaelhorn/locations.ts e
// do período do dia — sem grafo de waypoints novo, sem hora de relógio de
// parede, sem Math.random(). Tudo em cima do RNG determinístico da
// campanha, então é reproduzível como qualquer outro sorteio do jogo.
import { lembrarAoChegar } from './memoriaMundo';
import { encontroDeBandoNaViagem, prepararCombateDeBando } from './bandos';
import type { Campaign, ContentBundle, Local } from './types';
import { nextFloat, pick } from './rng';
import { avancarPeriodos, periodoAtual, type Periodo } from './time';
import { crescerImpulsos } from './impulsos';
import { avancarMundo } from './mundo';
import { alivioDeRota } from './classe';
import { registrarMarco } from './memoria';
import { descobrirNoticias, cidadeIdDoLocal } from './historiaViva';
import { encontrosElegiveis } from './kimetsu';
import { emboscadaNemesis } from './nemesis';
import { iniciarCombate } from './combat';
import { registrarSaidaNarrativa } from './contextoNarrativo';
import { fatorDaEstacao, perigoDoInverno, sortearNaEstacao, tamanhoDaMatilha, tetoDeGrupo } from './estacoes';

const PERIODOS_DE_RISCO = new Set<Periodo>(['anoitecer', 'noite', 'madrugada']);

// Só regula o acaso. Caçadas escolhidas e perseguições já causadas continuam reais.
export function presencaOniCasual(camp: Campaign): number {
  const investigando = camp.vivo?.missoes.some(q => q.tipo === 'investigar' && q.estado === 'aceita' && q.local === camp.localAtual);
  if (investigando) return .65;
  const crise = camp.continuidade?.ameacas.some(a => a.local === camp.localAtual && a.estado === 'ativa');
  if (crise) return .45;
  const ultimo = camp.flags['narrativa.ultimoOniCasual'];
  if (typeof ultimo === 'number' && camp.calendario.dia < ultimo + 3) return 0;
  return .08;
}

export function rolarEncontroContextual(content: ContentBundle, camp: Campaign, periodo: Periodo, perigo: number, pool: string[]): string[] | null {
  const elegiveis = encontrosElegiveis(content, camp, pool);
  const comuns = elegiveis.filter(id => !content.criaturas.find(c => c.id === id)?.oni);
  const temOni = comuns.length !== elegiveis.length;
  const chance = temOni ? presencaOniCasual(camp) : 0;
  const permitir = temOni && chance > 0 && nextFloat(camp.rng) < chance;
  const encontro = rolarEncontroDeViagem(camp, periodo, perigo, permitir ? elegiveis : comuns, content);
  if (encontro?.some(id => content.criaturas.find(c => c.id === id)?.oni)) {
    camp.flags['narrativa.ultimoOniCasual'] = camp.calendario.dia;
  }
  return encontro;
}

/**
 * Perigo efetivo de uma rota — o número que o sorteio de encontro deveria ter
 * usado desde sempre.
 *
 * `rota.perigo` é constante escrita à mão no conteúdo: idêntica no dia 1 e no
 * dia 3000, com o vale em paz ou em guerra. Enquanto isso a engine já mantinha
 * `cidade.inseguranca` (sobe com ameaça ativa, com guerra e com missão vencida;
 * desce com muralha), e nove módulos liam esse número. A viagem não era um
 * deles — o mapa de risco estava congelado sobre um mundo que muda.
 *
 * Agora a base de conteúdo é o piso, e o estado real das duas pontas move o
 * resto: uma estrada entre duas vilas em paz continua tranquila; a mesma
 * estrada com a vila do outro lado tomada fica perigosa sozinha, sem que
 * ninguém reescreva o conteúdo.
 */
export function perigoEfetivoDaRota(
  content: ContentBundle,
  camp: Campaign,
  origem: string,
  destino: string,
  perigoBase: number,
): number {
  let perigo = perigoBase;
  for (const ponta of [origem, destino]) {
    const cidadeId = cidadeIdDoLocal(content, camp, ponta);
    const cidade = cidadeId ? camp.vivo?.cidades[cidadeId] : undefined;
    // Insegurança de 0 a 100 vira até +3 de perigo por ponta.
    if (cidade) perigo += (cidade.inseguranca / 100) * 3;
    // Ameaça anunciada e ainda não resolvida pesa mais do que estatística.
    const ameaca = camp.continuidade?.ameacas.some(a => a.local === ponta && a.estado === 'ativa');
    if (ameaca) perigo += 2;
    // Quem caça naquele local devolve segurança: é o laço que faltava fechar.
    const guardiao = [...content.npcs, ...(camp.npcsProcedurais ?? [])].some(n =>
      n.combatente && camp.npcState[n.id]?.vivo && camp.vivo?.pessoas[n.id]?.objetivo === 'cacar'
      && camp.vivo.pessoas[n.id].local === ponta);
    if (guardiao) perigo -= 1.5;
  }
  // Rival acampado em qualquer das pontas: ele escolheu aquele refúgio de
  // propósito (ver engine/nemesis.ts) e sai à noite.
  for (const r of Object.values(camp.kimetsu?.rivais ?? {})) {
    if (!r.vivo) continue;
    if (r.local === origem || r.local === destino || r.evolucao?.refugio === destino) {
      perigo += 1 + (r.evolucao?.servos ?? 0) * 0.4;
      break;
    }
  }
  // Nevasca: passos e colinas ficam traiçoeiros (engine/estacoes.ts).
  perigo += perigoDoInverno(content, camp, origem, destino);
  // Quem sabe a hora do Passo do Lobo (segredo da caçadora de Vintra, ver
  // content/vaelhorn/segredos.ts) atravessa quando o que come lá não está.
  if (camp.flags['sabe.hora_do_passo'] && (origem === 'passo_lobo' || destino === 'passo_lobo')) perigo -= 2;
  // Batedor conhece os atalhos (engine/classe.ts).
  return Math.max(0, perigo - alivioDeRota(camp));
}

/** O lugar já foi descoberto por esta campanha? */
export function localConhecido(camp: Campaign, local: Local): boolean {
  if (!local.oculto) return true;
  return camp.flags[local.oculto.flag] === true || camp.locaisVisitados.includes(local.id);
}

/**
 * Rotas que o jogador pode ver e usar daqui. Lugar oculto não aparece na lista
 * até ser descoberto — é o que separa "secreto na ficção" de "secreto de
 * verdade". Quem chama isto: a tela do mapa, o pacote do narrador e o
 * planejador do simulador.
 */
export function rotasVisiveis(content: ContentBundle, camp: Campaign, localId = camp.localAtual) {
  const local = content.locais.find(l => l.id === localId);
  if (!local) return [];
  return local.rotas.filter(r => {
    const destino = content.locais.find(l => l.id === r.destino);
    return !destino || localConhecido(camp, destino);
  });
}

/**
 * Confere as condições declaradas de cada lugar oculto e revela os que já
 * foram satisfeitos. Roda no tique diário do mundo — a descoberta chega como
 * notícia, não como recompensa de menu.
 */
export function avaliarDescobertas(content: ContentBundle, camp: Campaign): string[] {
  const revelados: string[] = [];
  for (const l of content.locais) {
    const o = l.oculto;
    if (!o || camp.flags[o.flag] === true) continue;
    const porReputacao = o.exigeReputacao
      && (camp.reputacao[o.exigeReputacao.faccaoId] ?? 0) >= o.exigeReputacao.minimo;
    const porVisita = o.exigeVisita && camp.locaisVisitados.includes(o.exigeVisita);
    if (!porReputacao && !porVisita) continue;
    if (descobrirLocal(content, camp, l.id)) revelados.push(l.id);
  }
  return revelados;
}

/** Marca um lugar oculto como descoberto e registra o momento. */
export function descobrirLocal(content: ContentBundle, camp: Campaign, localId: string): boolean {
  const local = content.locais.find(l => l.id === localId);
  if (!local?.oculto || camp.flags[local.oculto.flag] === true) return false;
  camp.flags[local.oculto.flag] = true;
  registrarMarco(camp, `você descobriu onde fica ${local.nome}`);
  return true;
}

/**
 * O elenco possível de um lugar: o que o TIPO dele sorteia, mais o que é
 * característico da REGIÃO onde ele fica.
 *
 * Até a sessão 21 só o tipo contava. O perigo de cada região já variava como
 * número — Vale 3,7, Bosque de Vintra 6,0, Ermo de Solgar 5,5 — mas uma
 * floresta em Vintra e uma floresta em Tessel cuspiam exatamente a mesma
 * lista. A região tinha intensidade e não tinha rosto.
 *
 * As duas listas somam em vez de filtrar, de propósito: filtrar poderia
 * esvaziar a tabela de um lugar, e `selftest.ts` cobra que todo tipo sorteável
 * tenha encontro. Exclusividade de verdade é decisão da criatura, via
 * `regiaoExclusiva` — e essa sim filtra, porque é o autor dizendo onde aquilo
 * pode existir.
 */
export function encontrosDoLugar(content: ContentBundle, local?: Local): string[] {
  if (!local) return [];
  const doTipo = content.encontrosPorTipo?.[local.tipo] ?? [];
  const daRegiao = local.regiao ? content.encontrosPorRegiao?.[local.regiao] ?? [] : [];
  const juntos = [...new Set([...doTipo, ...daRegiao])];
  return juntos.filter(id => {
    const exclusiva = content.criaturas.find(c => c.id === id)?.regiaoExclusiva;
    return !exclusiva || exclusiva === local.regiao;
  });
}

// Retorna os ids das criaturas do encontro, ou null se a viagem correu em paz.
// `pool` é o elenco possível para o tipo de local de destino (ver
// content/vaelhorn/bestiary.ts, encontrosPorTipo) — a engine não conhece
// bestiário, só resolve o sorteio.
export function rolarEncontroDeViagem(
  camp: Campaign,
  periodo: Periodo,
  perigoRota: number,
  pool: string[],
  content?: ContentBundle,
): string[] | null {
  if (pool.length === 0) return null;
  const noturno = PERIODOS_DE_RISCO.has(periodo);
  const estacao = camp.calendario.estacao;
  // A estação mexe na chance (engine/estacoes.ts): pool de bicho de verão
  // fica mais calmo no inverno, e o contrário.
  const fator = content ? fatorDaEstacao(content, pool, estacao) : 1;
  const chance = Math.min(0.5, (0.05 + perigoRota * 0.04 + (noturno ? 0.12 : 0)) * fator);
  if (nextFloat(camp.rng) >= chance) return null;

  const primeiro = content ? sortearNaEstacao(camp.rng, content, pool, estacao) : pick(camp.rng, pool);
  if (!primeiro) return null;
  const ids = [primeiro];
  const teto = tetoDeGrupo(camp.personagem.nivel);
  const criatura = content?.criaturas.find(c => c.id === primeiro);
  if (criatura?.bando) {
    // Fera de matilha vem em matilha, com o teto do nível.
    const n = tamanhoDaMatilha(camp.rng, criatura, camp.personagem.nivel);
    for (let i = 1; i < n; i++) ids.push(primeiro);
  } else if (teto > 1 && nextFloat(camp.rng) < 0.2) {
    // Emboscada rara em dupla — nunca contra quem ainda não passou do nível 2.
    ids.push(content ? sortearNaEstacao(camp.rng, content, pool, estacao) ?? primeiro : pick(camp.rng, pool));
  }
  return ids.slice(0, teto);
}

// ── A viagem em si ────────────────────────────────────────────────────────
//
// Esta regra morava em ui/store.ts. Isso a deixava inalcançável para qualquer
// coisa que não fosse a tela: o simulador headless não conseguia andar pelo
// mapa, e um segundo cliente teria de reimplementar o custo de tempo, o tique
// do mundo, o primeiro pisar, a descoberta de notícias e o sorteio de
// encontro — cinco chances de divergir do jogo real. Agora a engine resolve a
// viagem inteira, inclusive abrir o combate, e a UI cuida só do que é tela:
// feed, narração e autosave.
export type ResultadoViagem = {
  ok: boolean;
  motivo?: string;
  destino?: Local;
  primeiraVez?: boolean;
  // Ids das criaturas do encontro. Quando presente, o combate JÁ FOI aberto —
  // quem chama só precisa levar o jogador para a tela de combate.
  encontro?: string[];
  /** Linha da engine quando se volta a um lugar onde se fez algo (memoriaMundo.ts). */
  lembranca?: string;
};

export function viajar(content: ContentBundle, camp: Campaign, destino: string): ResultadoViagem {
  if (camp.combate && !camp.combate.terminado) return { ok: false, motivo: 'termine o combate primeiro' };
  if (camp.personagem.condicoes.includes('cativo')) return { ok: false, motivo: 'recupere a liberdade antes de viajar' };
  if (camp.abordagem) return { ok: false, motivo: 'a patrulha te cercou: responda primeiro' };
  if (camp.personagem.condicoes.includes('preso')) return { ok: false, motivo: 'você está na cela da guarda' };
  const local = content.locais.find((l) => l.id === camp.localAtual);
  const rota = local?.rotas.find((r) => r.destino === destino);
  if (!rota) return { ok: false, motivo: 'não há rota daqui para lá' };
  const alvoOculto = content.locais.find(l => l.id === destino);
  if (alvoOculto && !localConhecido(camp, alvoOculto)) {
    return { ok: false, motivo: alvoOculto.oculto!.dica };
  }

  const origemDaViagem = camp.localAtual;
  registrarSaidaNarrativa(camp);
  if (rota.periodos > 0) {
    camp.calendario = avancarPeriodos(camp.calendario, rota.periodos);
    crescerImpulsos(camp, rota.periodos);
    camp.capitulo.periodosDecorridos += rota.periodos;
    avancarMundo(content, camp);
  }
  camp.localAtual = destino;
  const alvo = content.locais.find((l) => l.id === destino);
  const primeiraVez = !camp.locaisVisitados.includes(destino);
  if (primeiraVez) {
    camp.locaisVisitados.push(destino);
    registrarMarco(camp, `você pisou em ${alvo?.nome ?? destino} pela primeira vez`);
  }
  camp.flags[`visitou.${destino}`] = true;
  descobrirNoticias(content, camp);

  const pool = encontrosElegiveis(content, camp, encontrosDoLugar(content, alvo));
  const nemesis = emboscadaNemesis(content, camp);
  // Bando antes da tabela genérica: quem manda na estrada é ele (engine/bandos.ts).
  const bando = nemesis ? null : encontroDeBandoNaViagem(
    content, camp, origemDaViagem, destino, PERIODOS_DE_RISCO.has(periodoAtual(camp.calendario)),
  );
  const encontro =
    nemesis ??
    bando?.criaturas ??
    rolarEncontroContextual(
      content, camp, periodoAtual(camp.calendario),
      perigoEfetivoDaRota(content, camp, origemDaViagem, destino, rota.perigo),
      pool,
    );

  if (encontro) {
    iniciarCombate(content, camp, encontro);
    if (bando) prepararCombateDeBando(content, camp, bando);
  }
  // O mundo lembra: só na chegada sem luta — com emboscada, a cena é outra.
  const lembranca = encontro ? undefined : lembrarAoChegar(content, camp, destino);
  return { ok: true, destino: alvo, primeiraVez, encontro: encontro ?? undefined, lembranca };
}
