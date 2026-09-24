// ARCANUM · Casas nobres do continente (content/vaelhorn/casas.ts).
//
// Até a sessão 49 este arquivo tinha 23 linhas: tesouro e legitimidade
// subiam e desciam, e o "líder" de cada casa era o primeiro NPC listado na
// sede — em Mareu, a ferreira naval; em Tessel, a herdeira aparente seria a
// sargenta do portão. Na Fase 4 as casas ganharam gente (`membros`) e agem:
//
// - sucessão pela regra declarada: primogenitura (a linha, em ordem),
//   eleição (o conselho escolhe entre herdeiras e colaterais, e pesa quem está
//   menos em guerra com o mundo) ou duelo (as duas primeiras candidatas
//   lutam; a campeã da casa luta pela primeira da linha);
// - obras: com tesouro sobrando, a casa financia um edifício na cidade-sede,
//   escolhido pela necessidade da cidade (engine/cidades.ts);
// - patrulha: bando ativo na região da casa perde gente quando a casa paga
//   patrulha (engine/bandos.ts);
// - casamento político entre casas rivais quando as duas estão fracas, e
//   trama de usurpação da colateral quando a legitimidade cai muito;
// - o jogador: a casa patrocina a missão viva de crise da sede (paga mais e
//   põe a chefe como quem pede), e a reputação com a casa sobe quando o
//   jogador cumpre — e chega à disposição de todos os membros.
//
// Nada disso usa o RNG principal: o que é sorte (duelo, trama) sai de um RNG
// derivado da semente, do id da casa e do dia, como em engine/bandos.ts.
import type { Campaign, ContentBundle, NPC } from './types';
import type { CasaNobre, MembroCasa } from '../content/vaelhorn/casas';
import type { TipoEdificio } from './vivoTypes';
import { createRng, nextFloat, seedFromString } from './rng';
import { cidadeIdDoLocal, registrarFato } from './historiaViva';
import { iniciarObra } from './cidades';
import { oferecerMissao } from './missoesVivas';
import { estadoBandos, temBandos, encerrarBando } from './bandos';
import { idadeAtual } from './vidanpc';

export type EstadoCasa = {
  lider?: string; legitimidade: number; tesouro: number; influencia: number; sucessoes: number; herdeiro?: string; ultimoDia?: number;
  /** Reputação do jogador com a casa (-50 a 50). */
  reputacao?: number;
  ultimaObra?: number;
  ultimaPatrulha?: number;
  ultimaMissao?: number;
  ultimoCeleiro?: number;
  ultimaTrama?: number;
  /** Casa com quem selou casamento político, e quando. */
  alianca?: { casa: string; dia: number; noivas: [string, string] };
  obras?: number;
  patrulhas?: number;
  /** Último fato lido para reconhecer missão cumprida pelo jogador. */
  fatoVisto?: number;
};

export const INTERVALO_OBRA = 45;
export const CUSTO_OBRA = 60;
export const TESOURO_PARA_OBRA = 110;
export const INTERVALO_PATRULHA = 20;
export const CUSTO_PATRULHA = 25;
export const TESOURO_PARA_PATRULHA = 50;
export const BAIXAS_POR_PATRULHA = 2;
export const INTERVALO_MISSAO = 30;
export const BONUS_MISSAO = 25;
export const REPUTACAO_POR_MISSAO = 6;
export const LEGITIMIDADE_PARA_TRAMA = 30;

function npc(content: ContentBundle, camp: Campaign, id: string): NPC | undefined {
  return content.npcs.find(n => n.id === id) ?? camp.npcsProcedurais?.find(n => n.id === id);
}

function apta(content: ContentBundle, camp: Campaign, id: string): boolean {
  const n = npc(content, camp, id);
  return !!n && n.especie !== 'oni' && !!camp.npcState[id]?.vivo && idadeAtual(camp, n) >= 18
    && camp.vivo?.pessoas[id]?.objetivo !== 'cativo';
}

/** Herdeiras em ordem de linha, depois colaterais. Só gente viva, adulta, livre. */
export function candidatas(content: ContentBundle, camp: Campaign, casa: CasaNobre, excluir?: string): MembroCasa[] {
  const m = (casa.membros ?? []).filter(x => x.npc !== excluir && apta(content, camp, x.npc));
  const herdeiras = m.filter(x => x.papel === 'herdeira').sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
  const colaterais = m.filter(x => x.papel === 'colateral');
  return [...herdeiras, ...colaterais];
}

function rngDaCasa(camp: Campaign, casa: CasaNobre, tema: string) {
  return createRng((camp.rng.seed ^ seedFromString(`casa:${casa.id}:${tema}:${camp.calendario.dia}`)) >>> 0);
}

/**
 * Quem assume, pela regra da casa. Devolve também o texto do fato e, no
 * duelo, quem perdeu.
 */
export function escolherSucessora(content: ContentBundle, camp: Campaign, casa: CasaNobre, anterior?: string): { nova?: string; perdedora?: string; como: string } {
  const lista = candidatas(content, camp, casa, anterior);
  if (!lista.length) return { como: 'sem ninguém na linha' };
  if (casa.sucessao === 'primogenitura') return { nova: lista[0].npc, como: 'pela linha' };
  if (casa.sucessao === 'eleicao') {
    // O conselho prefere quem está na frente da linha e quem está menos em
    // conflito (tensão baixa). Sem sorteio: a mesma casa decide igual.
    const nota = (m: MembroCasa, i: number) => 10 - i * 2 + (40 - (camp.npcState[m.npc]?.tensao ?? 20)) / 10;
    const eleita = lista.map((m, i) => ({ m, n: nota(m, i) })).sort((a, b) => b.n - a.n)[0].m;
    return { nova: eleita.npc, como: 'eleita pelo conselho' };
  }
  // Duelo: as duas primeiras lutam. A campeã viva luta pela primeira da linha.
  if (lista.length === 1) return { nova: lista[0].npc, como: 'sem rival para o duelo' };
  const [a, b] = lista;
  const forca = (m: MembroCasa, comCampea: boolean) => {
    const ficha = npc(content, camp, m.npc)?.combatente;
    return (ficha?.vida ?? 20) + (ficha?.acerto ?? 8) + (comCampea ? 25 : 0);
  };
  const campea = (casa.membros ?? []).find(x => x.papel === 'campea' && apta(content, camp, x.npc));
  const fa = forca(a, !!campea), fb = forca(b, false);
  const venceA = nextFloat(rngDaCasa(camp, casa, 'duelo')) < fa / (fa + fb);
  return venceA ? { nova: a.npc, perdedora: b.npc, como: campea ? 'no duelo, pela mão da campeã' : 'no duelo' } : { nova: b.npc, perdedora: a.npc, como: 'no duelo' };
}

/**
 * A comunidade que a casa sustenta: a própria sede, ou a cidade mais perto
 * dela. A Casa de Pedra de Halvet não é cidade no mundo vivo; a comunidade
 * dela é a Praça. Na primeira versão a casa de Halvet nunca agia, e foi a
 * Praça que terminou uma campanha simulada com 261 dias de fome.
 */
export function cidadeDaCasa(content: ContentBundle, camp: Campaign, casa: CasaNobre): string | undefined {
  return cidadeIdDoLocal(content, camp, casa.sede);
}

function nomeDe(content: ContentBundle, camp: Campaign, id?: string): string {
  return (id && npc(content, camp, id)?.nome) ?? 'ninguém';
}

function assumir(content: ContentBundle, camp: Campaign, casa: CasaNobre, estado: EstadoCasa, anterior: string | undefined, motivo: 'morte' | 'trama'): void {
  const r = motivo === 'trama'
    ? { nova: (casa.membros ?? []).find(x => x.papel === 'colateral' && apta(content, camp, x.npc) && x.npc !== anterior)?.npc, como: 'tomando a casa numa trama', perdedora: anterior }
    : escolherSucessora(content, camp, casa, anterior);
  if (!r.nova) return;
  estado.lider = r.nova;
  estado.sucessoes++;
  estado.legitimidade = motivo === 'trama' ? 40 : Math.max(25, estado.legitimidade - 15);
  if (r.perdedora && camp.npcState[r.perdedora]) camp.npcState[r.perdedora].tensao = Math.min(100, camp.npcState[r.perdedora].tensao + 30);
  if (camp.vivo) registrarFato(camp, {
    tipo: motivo === 'trama' ? 'trama_casa' : 'sucessao_casa', local: casa.sede, publico: true,
    atores: [r.nova, ...(anterior ? [anterior] : [])],
    texto: motivo === 'trama'
      ? `${nomeDe(content, camp, r.nova)} tomou a ${casa.nome} de ${nomeDe(content, camp, anterior)}, ${r.como}.`
      : `${nomeDe(content, camp, r.nova)} assumiu a ${casa.nome}, ${r.como}${r.perdedora ? `; ${nomeDe(content, camp, r.perdedora)} perdeu` : ''}.`,
  });
}

/**
 * O edifício que a própria cidade ergueria agora (mesmas prioridades de
 * processarCidades). A cidade tem um canteiro só: na primeira versão a casa
 * escolhia mercado antes de lavoura, tomava o lugar da obra de comida, e a
 * simulação longa mostrou a conta — pico de fome de 6 para 43 dias.
 */
function obraNecessaria(camp: Campaign, cidadeId: string): TipoEdificio | undefined {
  const c = camp.vivo?.cidades[cidadeId];
  const povo = camp.continuidade?.locais[cidadeId];
  if (!c || c.projeto || !povo) return undefined;
  const prioridades: TipoEdificio[] = c.fomeDias ? ['lavoura']
    : povo.populacao > c.edificios.moradias * 50 ? ['moradias']
    : ['lavoura', 'moradias', 'enfermaria', 'muralha', 'mercado'];
  return prioridades.find(t => (c.edificios[t] ?? 0) < 5);
}

function financiarObra(content: ContentBundle, camp: Campaign, casa: CasaNobre, estado: EstadoCasa): void {
  const dia = camp.calendario.dia;
  if (estado.tesouro < TESOURO_PARA_OBRA || dia - (estado.ultimaObra ?? -Infinity) < INTERVALO_OBRA) return;
  const cid = cidadeDaCasa(content, camp, casa);
  const c = cid ? camp.vivo?.cidades[cid] : undefined;
  const povo = cid ? camp.continuidade?.locais[cid] : undefined;
  if (!cid || !c || !povo) return;
  const nomeSede = content.locais.find(l => l.id === cid)?.nome ?? cid;
  // Estrutura arruinada primeiro: com integridade baixa a produção da cidade
  // cai a 15% e nenhuma obra termina (cidades.ts). É daí que a comunidade
  // não sai sozinha.
  if (povo.integridade < 60) {
    povo.integridade = Math.min(100, povo.integridade + 25);
    estado.tesouro -= CUSTO_OBRA;
    estado.ultimaObra = dia;
    estado.obras = (estado.obras ?? 0) + 1;
    estado.legitimidade = Math.min(100, estado.legitimidade + 4);
    registrarFato(camp, {
      tipo: 'obra_casa', local: cid, publico: true, atores: estado.lider ? [estado.lider] : [],
      texto: `A ${casa.nome} pagou a reconstrução do que estava em ruína em ${nomeSede}.`,
    });
    return;
  }
  // Obra já no canteiro: a casa paga braços, e a obra da cidade anda mais
  // depressa. Não disputa o canteiro com ela.
  if (c.projeto) {
    c.projeto.progresso = Math.min(c.projeto.necessario, c.projeto.progresso + c.projeto.necessario * 0.3);
    estado.tesouro -= CUSTO_OBRA;
    estado.ultimaObra = dia;
    estado.obras = (estado.obras ?? 0) + 1;
    estado.legitimidade = Math.min(100, estado.legitimidade + 3);
    registrarFato(camp, {
      tipo: 'obra_casa', local: cid, publico: true, atores: estado.lider ? [estado.lider] : [],
      texto: `A ${casa.nome} pagou braços para a obra de ${c.projeto.tipo === 'moradias' ? 'moradias' : c.projeto.tipo} em ${nomeSede}.`,
    });
    return;
  }
  const tipo = obraNecessaria(camp, cid);
  if (!tipo) return;
  // A casa compra o material que falta e põe a obra de pé.
  const antes = c.materiais;
  c.materiais += 60;
  if (!iniciarObra(camp, cid, tipo)) { c.materiais = antes; return; }
  estado.tesouro -= CUSTO_OBRA;
  estado.ultimaObra = dia;
  estado.obras = (estado.obras ?? 0) + 1;
  estado.legitimidade = Math.min(100, estado.legitimidade + 4);
  registrarFato(camp, {
    tipo: 'obra_casa', local: cid, publico: true, atores: estado.lider ? [estado.lider] : [],
    texto: `A ${casa.nome} pagou a obra de ${tipo === 'moradias' ? 'moradias' : tipo} em ${nomeSede}.`,
  });
}

function pagarPatrulha(content: ContentBundle, camp: Campaign, casa: CasaNobre, estado: EstadoCasa): void {
  const dia = camp.calendario.dia;
  if (!temBandos(content) || estado.tesouro < TESOURO_PARA_PATRULHA || dia - (estado.ultimaPatrulha ?? -Infinity) < INTERVALO_PATRULHA) return;
  const regiao = content.locais.find(l => l.id === casa.sede)?.regiao;
  const bando = Object.values(estadoBandos(content, camp).bandos).find(b => b.estado !== 'destruido' && b.regiao === regiao && b.membros > 0);
  if (!bando) return;
  estado.tesouro -= CUSTO_PATRULHA;
  estado.ultimaPatrulha = dia;
  estado.patrulhas = (estado.patrulhas ?? 0) + 1;
  const baixas = Math.min(bando.membros, BAIXAS_POR_PATRULHA);
  bando.membros -= baixas;
  registrarFato(camp, {
    tipo: 'patrulha_casa', local: bando.esconderijo, publico: true, atores: estado.lider ? [estado.lider] : [],
    texto: `A patrulha paga pela ${casa.nome} caçou ${bando.nome}: ${baixas} ${baixas === 1 ? 'homem caiu' : 'homens caíram'}.`,
  });
  if (bando.membros <= 0) encerrarBando(camp, bando, `${bando.nome} acabou sob a patrulha da ${casa.nome}.`);
}

/**
 * A casa patrocina a missão de crise da sede: a que a cidade já abriu, se
 * houver (paga mais e põe a chefe como quem pede), ou uma nova. Nunca duas
 * para a mesma crise — na primeira versão a casa abria uma segunda missão
 * igual à da cidade, e cada missão que expira sobe a insegurança em 8.
 */
function patrocinarMissao(content: ContentBundle, camp: Campaign, casa: CasaNobre, estado: EstadoCasa): void {
  const dia = camp.calendario.dia;
  const cid = cidadeDaCasa(content, camp, casa);
  const v = camp.vivo, c = cid ? v?.cidades[cid] : undefined;
  if (!v || !cid || !c || !estado.lider || estado.tesouro < 40 || dia - (estado.ultimaMissao ?? -Infinity) < INTERVALO_MISSAO) return;
  const tipo = c.fomeDias >= 3 ? 'abastecer' : c.doenca > 40 ? 'tratar' : undefined;
  if (!tipo) return;
  let q = v.missoes.find(m => m.tipo === tipo && m.local === cid && ['oferecida', 'aceita'].includes(m.estado));
  const fato = registrarFato(camp, {
    tipo: 'casa_convoca', local: cid, publico: true, atores: [estado.lider],
    texto: `${nomeDe(content, camp, estado.lider)} mandou pregar na praça: a ${casa.nome} paga a quem ${tipo === 'abastecer' ? 'trouxer comida para a cidade' : 'ajudar a conter a febre'}.`,
  });
  q ??= oferecerMissao(camp, tipo, fato, { ator: estado.lider }, content);
  if (!q) return;
  q.ator ??= estado.lider;
  q.recompensa += BONUS_MISSAO;
  estado.tesouro -= BONUS_MISSAO;
  estado.ultimaMissao = dia;
}

export const INTERVALO_CELEIRO = 10;
export const CUSTO_CELEIRO = 30;
export const COMIDA_DO_CELEIRO = 70;

/** Com fome na sede, a casa compra comida com o tesouro. */
function abrirCeleiro(content: ContentBundle, camp: Campaign, casa: CasaNobre, estado: EstadoCasa): void {
  const dia = camp.calendario.dia;
  const cid = cidadeDaCasa(content, camp, casa);
  const c = cid ? camp.vivo?.cidades[cid] : undefined;
  if (!cid || !c || c.fomeDias < 2 || estado.tesouro < CUSTO_CELEIRO || dia - (estado.ultimoCeleiro ?? -Infinity) < INTERVALO_CELEIRO) return;
  estado.tesouro -= CUSTO_CELEIRO;
  estado.ultimoCeleiro = dia;
  c.comida = Math.min(600, c.comida + COMIDA_DO_CELEIRO);
  estado.legitimidade = Math.min(100, estado.legitimidade + 2);
  registrarFato(camp, {
    tipo: 'celeiro_casa', local: cid, publico: true, atores: estado.lider ? [estado.lider] : [],
    texto: `A ${casa.nome} comprou grão com o próprio tesouro e abriu o celeiro para ${content.locais.find(l => l.id === cid)?.nome ?? cid}.`,
  });
}

/** A reputação com a casa chega a quem é da casa. */
export function mudarReputacaoCasa(content: ContentBundle, camp: Campaign, casa: CasaNobre, delta: number): void {
  const estado = camp.mundo?.casas?.[casa.id];
  if (!estado || !delta) return;
  estado.reputacao = Math.max(-50, Math.min(50, (estado.reputacao ?? 0) + delta));
  for (const m of casa.membros ?? []) {
    const din = camp.npcState[m.npc];
    if (!din?.vivo) continue;
    const peso = m.papel === 'servidora' || m.papel === 'campea' ? 0.3 : 0.5;
    const parte = Math.round(delta * peso);
    if (parte) din.eixos.disposicao = Math.max(-20, Math.min(20, (din.eixos.disposicao ?? 0) + parte));
  }
}

function lerMissoesCumpridas(content: ContentBundle, camp: Campaign, casa: CasaNobre, estado: EstadoCasa): void {
  const v = camp.vivo;
  if (!v) return;
  const membros = new Set((casa.membros ?? []).map(m => m.npc));
  const visto = estado.fatoVisto ?? v.sequencia;
  for (const f of v.fatos) {
    if (!(Number(f.id.slice(5)) > visto)) continue;
    if (f.tipo === 'missao_concluida' && f.atores.some(a => membros.has(a))) mudarReputacaoCasa(content, camp, casa, REPUTACAO_POR_MISSAO);
  }
  estado.fatoVisto = v.sequencia;
}

function tramar(content: ContentBundle, camp: Campaign, casa: CasaNobre, estado: EstadoCasa): void {
  const dia = camp.calendario.dia;
  if (estado.legitimidade >= LEGITIMIDADE_PARA_TRAMA || dia - (estado.ultimaTrama ?? -Infinity) < 60) return;
  estado.ultimaTrama = dia;
  if (nextFloat(rngDaCasa(camp, casa, 'trama')) < 0.3) assumir(content, camp, casa, estado, estado.lider, 'trama');
}

function casamentoPolitico(content: ContentBundle, camp: Campaign, casa: CasaNobre, estado: EstadoCasa): void {
  if (estado.alianca || estado.legitimidade >= 50) return;
  for (const outraId of casa.rivalidades) {
    const outra = content.casas?.find(c => c.id === outraId);
    const eo = outra && camp.mundo?.casas?.[outraId];
    if (!outra || !eo || eo.alianca || eo.legitimidade >= 50) continue;
    const noiva = candidatas(content, camp, casa, estado.lider)[0];
    const outraNoiva = candidatas(content, camp, outra, eo.lider)[0];
    if (!noiva || !outraNoiva) continue;
    const dia = camp.calendario.dia;
    estado.alianca = { casa: outra.id, dia, noivas: [noiva.npc, outraNoiva.npc] };
    eo.alianca = { casa: casa.id, dia, noivas: [outraNoiva.npc, noiva.npc] };
    estado.legitimidade = Math.min(100, estado.legitimidade + 12);
    eo.legitimidade = Math.min(100, eo.legitimidade + 12);
    registrarFato(camp, {
      tipo: 'casamento_politico', local: casa.sede, publico: true, atores: [noiva.npc, outraNoiva.npc],
      texto: `A ${casa.nome} e a ${outra.nome} casaram as herdeiras para estancar a rivalidade: ${nomeDe(content, camp, noiva.npc)} e ${nomeDe(content, camp, outraNoiva.npc)}.`,
    });
    return;
  }
}

export function processarCasas(content: ContentBundle, camp: Campaign): void {
  const mundo = camp.mundo; if (!mundo || !content.casas?.length) return;
  mundo.casas ??= {};
  for (const casa of content.casas) {
    const estado = mundo.casas[casa.id] ??= { legitimidade: 65, tesouro: casa.riqueza === 'alta' ? 140 : casa.riqueza === 'media' ? 90 : 50, influencia: 30, sucessoes: 0 };
    if (estado.ultimoDia === camp.calendario.dia) continue;
    estado.ultimoDia = camp.calendario.dia;

    if (casa.membros?.length) {
      // Chefe declarada; saves antigos que tinham "o primeiro da sede" como
      // líder passam para a chefe escrita enquanto a linha original não muda.
      const chefe = casa.membros.find(m => m.papel === 'chefe')?.npc;
      if (!estado.lider || (estado.sucessoes === 0 && chefe && estado.lider !== chefe && apta(content, camp, chefe))) estado.lider = chefe;
      if (estado.lider && camp.npcState[estado.lider]?.vivo === false) assumir(content, camp, casa, estado, estado.lider, 'morte');
      estado.herdeiro = candidatas(content, camp, casa, estado.lider)[0]?.npc;
    } else {
      // Casa sem membros escritos (outros bundles): regra antiga.
      const pessoas = content.npcs.filter(n => n.localBase === casa.sede && n.especie !== 'oni' && camp.npcState[n.id]?.vivo);
      estado.lider ??= pessoas[0]?.id; estado.herdeiro ??= pessoas.find(n => n.id !== estado.lider)?.id;
      if (estado.herdeiro && (!camp.npcState[estado.herdeiro]?.vivo || !pessoas.some(n => n.id === estado.herdeiro))) estado.herdeiro = undefined;
      if (estado.lider && camp.npcState[estado.lider]?.vivo === false) {
        const anterior = estado.lider, novo = estado.herdeiro && camp.npcState[estado.herdeiro]?.vivo ? estado.herdeiro : pessoas.find(n => n.id !== anterior)?.id;
        if (novo) { estado.lider = novo; estado.herdeiro = pessoas.find(n => n.id !== novo)?.id; estado.sucessoes++; estado.legitimidade = Math.max(25, estado.legitimidade - 15); }
      }
    }

    const cidadeId = casa.membros?.length ? cidadeDaCasa(content, camp, casa) : casa.sede;
    const cidade = cidadeId ? camp.vivo?.cidades[cidadeId] : undefined;
    estado.tesouro = Math.max(0, Math.min(300, estado.tesouro + (cidade?.fomeDias ? -1 : .2)));
    estado.legitimidade = Math.max(0, Math.min(100, estado.legitimidade + (cidade?.fomeDias ? -.5 : .05)));
    estado.influencia = Math.max(0, Math.min(100, estado.influencia + (estado.tesouro > 100 ? .05 : -.05)));

    if (!camp.vivo || !casa.membros?.length) continue;
    // A primeira obra espera o intervalo inteiro: casa recém-chegada ao jogo
    // (campanha nova ou save antigo) não gasta o tesouro no primeiro dia.
    estado.ultimaObra ??= camp.calendario.dia;
    lerMissoesCumpridas(content, camp, casa, estado);
    abrirCeleiro(content, camp, casa, estado);
    patrocinarMissao(content, camp, casa, estado);
    financiarObra(content, camp, casa, estado);
    pagarPatrulha(content, camp, casa, estado);
    casamentoPolitico(content, camp, casa, estado);
    tramar(content, camp, casa, estado);
  }
}

/** Uma linha por casa, para o narrador e para a tela. */
export function descreverCasa(content: ContentBundle, camp: Campaign, casa: CasaNobre): string {
  const e = camp.mundo?.casas?.[casa.id];
  if (!e) return `${casa.nome}: "${casa.lema}".`;
  const partes = [`${casa.nome} ("${casa.lema}")`, `chefiada por ${nomeDe(content, camp, e.lider)}`];
  if (e.herdeiro) partes.push(`herdeira: ${nomeDe(content, camp, e.herdeiro)}`);
  partes.push(`legitimidade ${Math.round(e.legitimidade)}`);
  if (e.alianca) partes.push(`aliada por casamento à ${content.casas?.find(c => c.id === e.alianca!.casa)?.nome ?? e.alianca.casa}`);
  if (e.reputacao) partes.push(`sua reputação com ela: ${e.reputacao > 0 ? '+' : ''}${e.reputacao}`);
  return partes.join('; ') + '.';
}
