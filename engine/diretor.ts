// ARCANUM · Diretor de Arcos (sessão 53, Fase 8).
//
// Não confundir com processarDiretor (engine/cidades.ts), que sorteia os
// incidentes das cidades (seca, epidemia, incêndio). Este não cria nada: olha
// o que já existe — compromisso perto do prazo, capitão de bando que caça o
// jogador, pedido de ajuda na cidade onde ele está, casa nobre por um fio,
// gente conhecida de luto — e empurra no máximo UM gancho por dia para perto
// dele, como boato ou mensageiro, na fila de avisos (engine/memoriaMundo.ts).
//
// Regras:
// - no máximo um gancho por dia de jogo, com intervalo mínimo entre eles;
// - o mesmo alvo não volta antes de DIAS_PARA_REPETIR_ALVO;
// - cada gancho aponta para estado que existe agora (o teste confere);
// - ordem fixa de prioridade, sem RNG: não mexe na sequência de sorteios.
import type { Campaign, ContentBundle } from './types';
import { avisar, emLocal, estadoMemoria } from './memoriaMundo';
import { cidadeIdDoLocal } from './historiaViva';
import { estadoBandos, nomeDoCapitao } from './bandos';
import { rotuloLaco, type LacoParente } from './familiasNpc';

export const DIAS_ENTRE_GANCHOS = 3;
export const DIAS_PARA_REPETIR_ALVO = 20;
/** Casa com legitimidade abaixo disto está "por um fio". */
export const LEGITIMIDADE_EM_CRISE = 30;

export type Gancho = { alvo: string; texto: string; local?: string };

function nomeLocal(content: ContentBundle, id: string): string {
  return content.locais.find(l => l.id === id)?.nome ?? id;
}
function nomeNpc(content: ContentBundle, camp: Campaign, id: string): string {
  return [...content.npcs, ...(camp.npcsProcedurais ?? [])].find(n => n.id === id)?.nome ?? id;
}

function maiuscula(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
/** "na Marca de Tessel", "no Vale de Halvet", "nos Baixios de Halvern". */
function naRegiao(regiao: string): string {
  const primeira = regiao.split(' ')[0];
  return `${primeira.endsWith('s') ? 'nos' : primeira.endsWith('a') ? 'na' : 'no'} ${regiao}`;
}

/** Todos os ganchos possíveis agora, em ordem de prioridade. */
export function ganchosPossiveis(content: ContentBundle, camp: Campaign): Gancho[] {
  const dia = camp.calendario.dia;
  const saida: Gancho[] = [];
  const v = camp.vivo;
  const aqui = cidadeIdDoLocal(content, camp, camp.localAtual);

  // 1. Compromisso aceito perto do prazo: um mensageiro vem lembrar.
  for (const q of v?.missoes ?? []) {
    if (q.estado !== 'aceita' || q.prazo < dia || q.prazo - dia > 2) continue;
    const faltam = q.prazo - dia;
    saida.push({
      alvo: `missao:${q.id}`, local: q.local,
      texto: `Um mensageiro de ${nomeLocal(content, q.local)} te encontra: "${q.titulo}" — ${faltam === 0 ? 'o prazo acaba hoje' : faltam === 1 ? 'falta um dia' : `faltam ${faltam} dias`}.`,
    });
  }

  // 2. Capitão de bando vivo que quer o jogador.
  for (const b of Object.values(camp.bandos?.bandos ?? {})) {
    const c = b.capitao;
    if (b.estado === 'destruido' || !c.vivo || c.preso || !(c.caca || c.rancor >= 2)) continue;
    saida.push({
      alvo: `capitao:${b.id}`, local: b.esconderijo,
      texto: `Na estrada contam que ${nomeDoCapitao(c)} ainda pergunta por você. ${maiuscula(b.nome)} anda ${naRegiao(b.regiao)}.`,
    });
  }

  // 3. Pedido de ajuda aberto na comunidade onde o jogador está.
  for (const q of v?.missoes ?? []) {
    if (q.estado !== 'oferecida' || q.prazo < dia || !aqui || cidadeIdDoLocal(content, camp, q.local) !== aqui) continue;
    saida.push({ alvo: `oferta:${q.id}`, local: q.local, texto: `${emLocal(nomeLocal(content, q.local))}, pedem ajuda: ${q.titulo}.` });
  }

  // 4. Casa nobre por um fio.
  for (const casa of content.casas ?? []) {
    const e = camp.mundo?.casas?.[casa.id];
    if (!e?.lider || e.legitimidade >= LEGITIMIDADE_EM_CRISE) continue;
    saida.push({
      alvo: `casa:${casa.id}`, local: casa.sede,
      texto: `${emLocal(nomeLocal(content, casa.sede))} dizem que a ${casa.nome} não segura a própria gente: ${nomeNpc(content, camp, e.lider)} manda cada vez menos.`,
    });
  }

  // 5. Gente que o jogador conhece, de luto recente.
  for (const [vivo, lutos] of Object.entries(camp.familiasNpc?.lutos ?? {})) {
    const din = camp.npcState[vivo];
    if (!din?.vivo || ((din.eixos.confianca ?? 0) + (din.eixos.disposicao ?? 0)) < 5) continue;
    const l = lutos.at(-1);
    if (!l || dia - l.dia > 20) continue;
    saida.push({
      alvo: `luto:${vivo}:${l.morto}`,
      texto: `${nomeNpc(content, camp, vivo)} está de luto por ${nomeNpc(content, camp, l.morto)} (${rotuloLaco(content, { npc: l.morto, laco: l.laco as LacoParente, familia: '' })}). Quem conhece a família sabe onde encontrá-la.`,
    });
  }
  return saida;
}

/**
 * Passe diário (avancarMundo). Escolhe o primeiro gancho da lista cujo alvo
 * não foi usado há pouco, respeitando o intervalo entre ganchos.
 */
export function processarDiretorDeArcos(content: ContentBundle, camp: Campaign): void {
  if (!camp.vivo || camp.personagem.condicoes.includes('cativo') || camp.personagem.condicoes.includes('preso')) return;
  const dia = camp.calendario.dia;
  const d = estadoMemoria(camp).diretor;
  if (dia - d.ultimoDia < DIAS_ENTRE_GANCHOS) return;
  const g = ganchosPossiveis(content, camp).find(x => dia - (d.alvos[x.alvo] ?? -Infinity) >= DIAS_PARA_REPETIR_ALVO);
  if (!g) return;
  d.ultimoDia = dia;
  d.alvos[g.alvo] = dia;
  d.ganchos++;
  // Alvos antigos saem da memória: só importam os da janela de repetição.
  for (const [alvo, quando] of Object.entries(d.alvos)) if (dia - quando > DIAS_PARA_REPETIR_ALVO * 3) delete d.alvos[alvo];
  if (g.alvo.startsWith('oferta:')) {
    const q = camp.vivo.missoes.find(m => `oferta:${m.id}` === g.alvo);
    if (q) q.conhecida = true;
  }
  avisar(camp, { dia, texto: g.texto, tipo: 'gancho', local: g.local });
}
