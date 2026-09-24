// ARCANUM · Caravanas de comida entre cidades (sessão 51, Fase 5).
//
// As cidades já tinham comida, fome e migração (engine/cidades.ts), mas
// nada ligava uma cidade com celeiro cheio a outra passando fome: cada uma
// vivia sozinha. Agora, de cinco em cinco dias, uma cidade com sobra manda
// uma caravana de grão para a cidade com fome mais perto (até três dias de
// estrada). A caravana passa um dia no ponto de partida — é quando o jogador
// pode escoltá-la — e depois viaja. Na chegada, bando ativo na região da
// origem ou do destino pode atacar: a comida vira tesouro do bando, e o
// destino fica mais inseguro. Escoltada, ela não é atacada na chegada: o
// bando cai sobre o jogador na saída, e quem decide é a luta.
//
// Só em bundle que tem bandos (Vaelhorn). Sorte vem de RNG derivado, para não
// mexer no RNG principal.
import type { Campaign, Caravana, ContentBundle, EstadoCaravanas } from './types';
import { createRng, nextFloat, seedFromString } from './rng';
import { cidadeIdDoLocal, registrarFato } from './historiaViva';
import { periodosDeViagem } from './missoesVivas';
import { estadoBandos, temBandos, encontroContraCaravana, prepararCombateDeBando } from './bandos';
import { iniciarCombate } from './combat';
import { fatorAtaqueCaravana } from './edificiosRegionais';

export const INTERVALO_DESPACHO = 5;
export const MAX_CARAVANAS_NA_ESTRADA = 3;
export const COMIDA_PARA_MANDAR = 280;
export const CARGA_MAXIMA = 90;
export const ALCANCE_MAXIMO = 18; // períodos: três dias de estrada
export const INSEGURANCA_POR_ATAQUE = 10;
export const RECOMPENSA_ESCOLTA = 12;

export function estadoCaravanas(camp: Campaign): EstadoCaravanas {
  return (camp.caravanas ??= { seq: 0, lista: [], entregues: 0, perdidas: 0 });
}

function nome(content: ContentBundle, id: string): string {
  return content.locais.find(l => l.id === id)?.nome ?? id;
}

function regiao(content: ContentBundle, id: string): string | undefined {
  return content.locais.find(l => l.id === id)?.regiao;
}

/** Bando ativo e grande o bastante na região da origem ou do destino. */
export function bandoNaRota(content: ContentBundle, camp: Campaign, c: Caravana) {
  const regioes = new Set([regiao(content, c.origem), regiao(content, c.destino)]);
  return Object.values(estadoBandos(content, camp).bandos).find(b => b.estado === 'ativo' && b.membros >= 3 && regioes.has(b.regiao));
}

export function chanceDeAtaque(membros: number): number {
  return Math.min(0.7, 0.35 + membros * 0.03);
}

function despachar(content: ContentBundle, camp: Campaign, e: EstadoCaravanas): void {
  const v = camp.vivo!, dia = camp.calendario.dia;
  const naEstrada = e.lista.filter(c => c.estado === 'partindo' || c.estado === 'viajando');
  if (naEstrada.length >= MAX_CARAVANAS_NA_ESTRADA) return;
  const povo = (id: string) => camp.continuidade?.locais[id]?.populacao ?? 0;
  const origens = Object.entries(v.cidades)
    .filter(([id, c]) => c.comida >= COMIDA_PARA_MANDAR && povo(id) > 0 && !naEstrada.some(x => x.origem === id))
    .sort((a, b) => b[1].comida - a[1].comida);
  for (const [origem, co] of origens) {
    const destinos = Object.entries(v.cidades)
      .filter(([id, c]) => id !== origem && povo(id) > 0 && (c.fomeDias > 0 || c.comida < 80) && !naEstrada.some(x => x.destino === id))
      .map(([id]) => ({ id, p: periodosDeViagem(content, origem, id) }))
      .filter(d => Number.isFinite(d.p) && d.p <= ALCANCE_MAXIMO)
      .sort((a, b) => a.p - b.p);
    const d = destinos[0];
    if (!d) continue;
    const carga = Math.min(CARGA_MAXIMA, Math.floor(co.comida - 200));
    co.comida -= carga;
    const c: Caravana = {
      id: `caravana_${++e.seq}`, origem, destino: d.id, carga, parte: dia,
      chega: dia + 1 + Math.ceil(d.p / 6), estado: 'partindo',
    };
    e.lista.push(c);
    registrarFato(camp, {
      tipo: 'caravana_parte', local: origem, publico: true, atores: [],
      texto: `Uma caravana com ${carga} medidas de grão sai amanhã de ${nome(content, origem)} para ${nome(content, d.id)}, onde falta comida.`,
    });
    return; // uma por despacho
  }
}

function resolverChegada(content: ContentBundle, camp: Campaign, e: EstadoCaravanas, c: Caravana): void {
  const destino = camp.vivo!.cidades[c.destino];
  const bando = c.escoltada ? undefined : bandoNaRota(content, camp, c);
  const rng = createRng((camp.rng.seed ^ seedFromString(`caravana:${c.id}`)) >>> 0);
  // Caravana que sai de cidade com cais vai pela costa (edifício regional).
  if (bando && nextFloat(rng) < chanceDeAtaque(bando.membros) * fatorAtaqueCaravana(content, camp, c.origem)) {
    c.estado = 'perdida';
    e.perdidas++;
    bando.tesouro += Math.round(c.carga / 10);
    if (destino) destino.inseguranca = Math.min(100, destino.inseguranca + INSEGURANCA_POR_ATAQUE);
    registrarFato(camp, {
      tipo: 'caravana_atacada', local: c.destino, publico: true, atores: [],
      texto: `${bando.nome} atacou a caravana de ${nome(content, c.origem)} na estrada. O grão não chegou a ${nome(content, c.destino)}.`,
    });
    return;
  }
  c.estado = 'entregue';
  e.entregues++;
  if (destino) destino.comida = Math.min(600, destino.comida + c.carga);
  registrarFato(camp, {
    tipo: 'caravana_entregue', local: c.destino, publico: true, atores: c.escoltada ? ['jogador'] : [],
    texto: `A caravana de ${nome(content, c.origem)} chegou a ${nome(content, c.destino)} com ${c.carga} medidas de grão${c.escoltada ? ', escoltada por você' : ''}.`,
  });
  if (c.escoltada) {
    camp.personagem.dinheiro += RECOMPENSA_ESCOLTA;
    camp.reputacao.vila = (camp.reputacao.vila ?? 0) + 1;
    camp.cronica.push({ turno: camp.turno, texto: `A caravana que você escoltou chegou a ${nome(content, c.destino)}. Mandaram ${RECOMPENSA_ESCOLTA} moedas de agradecimento.`, tipo: 'sistema' });
  }
}

/** Passe diário, chamado em avancarMundo depois das cidades. */
export function processarCaravanas(content: ContentBundle, camp: Campaign): void {
  if (!temBandos(content) || !camp.vivo) return;
  const e = estadoCaravanas(camp);
  const dia = camp.calendario.dia;
  for (const c of e.lista) {
    if (c.estado === 'partindo' && dia >= c.parte + 1) c.estado = 'viajando';
    if (c.estado === 'viajando' && dia >= c.chega) resolverChegada(content, camp, e, c);
  }
  if (dia % INTERVALO_DESPACHO === 0) despachar(content, camp, e);
  // Guarda as últimas: o resto já virou fato.
  const encerradas = e.lista.filter(c => c.estado === 'entregue' || c.estado === 'perdida');
  if (encerradas.length > 20) e.lista = e.lista.filter(c => !encerradas.slice(0, encerradas.length - 20).includes(c));
}

/** Caravanas partindo da comunidade onde o jogador está. */
export function caravanasPartindoAqui(content: ContentBundle, camp: Campaign): Caravana[] {
  const aqui = cidadeIdDoLocal(content, camp, camp.localAtual);
  return (camp.caravanas?.lista ?? []).filter(c => c.estado === 'partindo' && c.origem === aqui && !c.escoltada);
}

/**
 * O jogador escolta a caravana. Se um bando manda na rota, ele cai sobre a
 * escolta na saída: vencer protege a carga até o destino; perder ou fugir a
 * deixa à própria sorte. Devolve se abriu combate.
 */
export function escoltarCaravana(content: ContentBundle, camp: Campaign, id: string): { ok: boolean; texto: string; combate?: boolean } {
  const c = caravanasPartindoAqui(content, camp).find(x => x.id === id);
  if (!c) return { ok: false, texto: 'Não há caravana partindo daqui para escoltar.' };
  const bando = bandoNaRota(content, camp, c);
  if (!bando) {
    c.escoltada = true;
    return { ok: true, texto: `Você acompanha a caravana para ${nome(content, c.destino)} até a estrada ficar segura. Ninguém aparece.` };
  }
  const encontro = encontroContraCaravana(content, camp, bando.id);
  if (!encontro) { c.escoltada = true; return { ok: true, texto: 'A estrada está limpa.' }; }
  iniciarCombate(content, camp, encontro.criaturas);
  prepararCombateDeBando(content, camp, encontro);
  camp.combate!.caravana = c.id;
  camp.combate!.log.push(`${bando.nome} sai do mato atrás da carga. Eles não esperavam escolta.`);
  return { ok: true, texto: `${bando.nome} cai sobre a caravana na saída de ${nome(content, c.origem)}.`, combate: true };
}

/** Chamado pelo combate ao terminar: a luta decide se a caravana segue protegida. */
export function registrarDesfechoCaravana(camp: Campaign, resultado: 'vitoria' | 'derrota' | 'fuga'): void {
  const id = camp.combate?.caravana;
  const c = id && camp.caravanas?.lista.find(x => x.id === id);
  if (!c) return;
  c.escoltada = resultado === 'vitoria';
}
