// ARCANUM · Combate por turnos, resolvido 100% pela engine (GDD §16, §17).
import type {
  Campaign,
  ContentBundle,
  CombatState,
  CombatActor,
  Criatura,
  PerfilDano,
  AttrKey,
} from './types';
import { probabilidade, calcularDano } from './resolution';
import { nextFloat, nextInt, pick } from './rng';
import { modificador, clampRecursos } from './character';
import { bonusDefesaEquip, armaEquipada } from './items';

export function criaturaPorId(content: ContentBundle, id: string): Criatura | undefined {
  return content.criaturas.find((c) => c.id === id);
}

// Intensidade base por grau de arte (para dano/cura em combate).
function grauBase(grau: string): number {
  switch (grau) {
    case 'comum':
      return 2;
    case 'notavel':
      return 5;
    case 'rara':
      return 9;
    case 'proibida':
      return 10;
    case 'unica':
    case 'perdida':
      return 12;
    case 'mitica':
      return 16;
    default:
      return 4;
  }
}

// Acerto de combate do jogador (escala comparável à defesa das criaturas).
export function acertoJogador(content: ContentBundle, camp: Campaign): number {
  const p = camp.personagem;
  const arma = armaEquipada(content, p);
  const attr: AttrKey = arma?.atributoAtaque ?? 'fisico';
  return 10 + p.nivel + modificador(p.atributos[attr]) + (arma ? 2 : 0);
}

export function danoJogador(content: ContentBundle, camp: Campaign): PerfilDano {
  const arma = armaEquipada(content, camp.personagem);
  if (arma?.dano) return arma.dano;
  return { base: 3 + Math.max(0, modificador(camp.personagem.atributos.fisico)), dispersao: 0.4, tipo: 'desarmado' };
}

export function iniciarCombate(
  content: ContentBundle,
  camp: Campaign,
  criaturaIds: string[],
): CombatState {
  const p = camp.personagem;
  const jogador: CombatActor = {
    id: 'jogador',
    nome: p.nome,
    ehJogador: true,
    vida: p.recursos.vida,
    vidaMax: p.recursosMax.vida,
    defesa: 10 + modificador(p.atributos.precisao) + modificador(p.atributos.resiliencia) + bonusDefesaEquip(content, p),
    acerto: acertoJogador(content, camp),
    dano: danoJogador(content, camp),
    condicoes: [],
  };

  const inimigos: CombatActor[] = criaturaIds.map((cid, i) => {
    const c = criaturaPorId(content, cid)!;
    return {
      id: `inim_${i}_${cid}`,
      nome: c.nome,
      ehJogador: false,
      vida: c.vida,
      vidaMax: c.vida,
      defesa: c.defesa,
      acerto: c.acerto,
      dano: c.dano,
      criaturaId: cid,
      condicoes: [],
    };
  });

  const atores = [jogador, ...inimigos];
  // Iniciativa: um sorteio por ator, maior age primeiro.
  const ini = new Map<string, number>();
  for (const a of atores) ini.set(a.id, nextFloat(camp.rng) + (a.ehJogador ? modificador(p.atributos.precisao) * 0.05 : 0));
  const ordem = [...atores].sort((a, b) => (ini.get(b.id) ?? 0) - (ini.get(a.id) ?? 0)).map((a) => a.id);

  const moral = Math.round(inimigos.reduce((s, a) => s + (criaturaPorId(content, a.criaturaId!)?.moralBase ?? 60), 0) / Math.max(1, inimigos.length));

  const state: CombatState = {
    rodada: 1,
    atores,
    ordem,
    turno: 0,
    moralInimiga: moral,
    terminado: false,
    log: [`O combate começa. ${inimigos.map((i) => i.nome).join(', ')} contra você.`],
    fase: 1,
  };

  camp.combate = state;
  // Se algum inimigo age antes do jogador, processa até chegar a vez do jogador.
  avancarAteJogador(content, camp);
  return camp.combate!;
}

function vivo(a: CombatActor): boolean {
  return a.vida > 0;
}

function inimigosVivos(s: CombatState): CombatActor[] {
  return s.atores.filter((a) => !a.ehJogador && vivo(a));
}

function jogadorAtor(s: CombatState): CombatActor {
  return s.atores.find((a) => a.ehJogador)!;
}

function resolverAtaque(
  camp: Campaign,
  atacante: CombatActor,
  alvo: CombatActor,
  perfil: PerfilDano,
): string {
  const defEfetiva = alvo.defesa + (alvo.defendendo ? 4 : 0);
  const p = probabilidade(atacante.acerto, defEfetiva, 4);
  const r = nextFloat(camp.rng);
  if (r >= p) return `${atacante.nome} ataca ${alvo.nome} e erra.`;
  const crit = r < p * 0.25;
  const dano = calcularDano(camp.rng, perfil, crit);
  alvo.vida = Math.max(0, alvo.vida - dano.valor);
  const morte = alvo.vida <= 0 ? ` ${alvo.nome} cai.` : '';
  return `${atacante.nome} acerta ${alvo.nome}${crit ? ' em cheio' : ''} — ${dano.valor} de dano ${dano.tipo}.${morte}`;
}

// ── Ações do jogador ────────────────────────────────────────────────
export function jogadorAtaca(content: ContentBundle, camp: Campaign, alvoId: string): void {
  const s = camp.combate;
  if (!s || s.terminado) return;
  const jog = jogadorAtor(s);
  const alvo = s.atores.find((a) => a.id === alvoId);
  if (!alvo || !vivo(alvo)) return;
  jog.defendendo = false;
  s.log.push(resolverAtaque(camp, jog, alvo, jog.dano ?? danoJogador(content, camp)));
  depoisDaAcaoDoJogador(content, camp);
}

export function jogadorDefende(content: ContentBundle, camp: Campaign): void {
  const s = camp.combate;
  if (!s || s.terminado) return;
  jogadorAtor(s).defendendo = true;
  s.log.push(`Você firma a guarda.`);
  depoisDaAcaoDoJogador(content, camp);
}

export function jogadorConjura(
  content: ContentBundle,
  camp: Campaign,
  arteId: string,
  alvoId?: string,
): { ok: boolean; motivo?: string } {
  const s = camp.combate;
  if (!s || s.terminado) return { ok: false, motivo: 'sem combate' };
  const p = camp.personagem;
  if (!p.artesConhecidas.includes(arteId)) return { ok: false, motivo: 'você não conhece essa arte' };
  const arte = content.artes.find((a) => a.id === arteId);
  if (!arte) return { ok: false, motivo: 'arte desconhecida' };
  if ((p.recursos[arte.custo.recurso] ?? 0) < arte.custo.valor) return { ok: false, motivo: `sem ${arte.custo.recurso}` };

  p.recursos[arte.custo.recurso] -= arte.custo.valor;
  if (arte.pressaoGerada) {
    p.pressoes[arte.pressaoGerada.medidor] = (p.pressoes[arte.pressaoGerada.medidor] ?? 0) + arte.pressaoGerada.valor;
  }
  const jog = jogadorAtor(s);
  jog.defendendo = false;

  const ofensiva = ['Evocação', 'Necromancia', 'Técnica'].includes(arte.escola);
  const cura = /cura|curativo/.test(arte.id);

  if (cura) {
    const v = 8 + grauBase(arte.grau);
    jog.vida = Math.min(jog.vidaMax, jog.vida + v);
    p.recursos.vida = jog.vida;
    s.log.push(`Você conjura ${arte.nome}: ${v} de vida restaurada.`);
  } else if (ofensiva) {
    const alvo = s.atores.find((a) => a.id === alvoId && !a.ehJogador && vivo(a)) ?? inimigosVivos(s)[0];
    if (alvo) {
      const perfil: PerfilDano = { base: 6 + grauBase(arte.grau) + modificador(p.atributos.raciocinio), dispersao: 0.3, tipo: 'arcano' };
      const jogMag = { ...jog, acerto: 10 + p.nivel + modificador(p.atributos.raciocinio) };
      s.log.push(`Você conjura ${arte.nome}. ` + resolverAtaque(camp, jogMag, alvo, perfil));
    }
  } else {
    s.log.push(`Você conjura ${arte.nome}.`);
  }
  clampRecursos(p);
  depoisDaAcaoDoJogador(content, camp);
  return { ok: true };
}

export function jogadorUsaItemCombate(
  content: ContentBundle,
  camp: Campaign,
  itemId: string,
): { ok: boolean; motivo?: string } {
  const s = camp.combate;
  if (!s || s.terminado) return { ok: false, motivo: 'sem combate' };
  const p = camp.personagem;
  const item = content.itens.find((i) => i.id === itemId);
  if (!item || item.slot !== 'consumivel' || !item.efeitosUso) return { ok: false, motivo: 'não dá para usar' };
  if ((p.inventario[itemId] ?? 0) <= 0) return { ok: false, motivo: 'você não tem' };
  // aplica efeitos de recurso diretamente (foco em cura/vigor em combate)
  for (const ef of item.efeitosUso) {
    if (ef.tipo === 'recurso') p.recursos[ef.recurso] = (p.recursos[ef.recurso] ?? 0) + ef.delta;
    if (ef.tipo === 'condicao' && !ef.adicionar) p.condicoes = p.condicoes.filter((c) => c !== ef.condicao);
  }
  p.inventario[itemId] -= 1;
  if (p.inventario[itemId] <= 0) delete p.inventario[itemId];
  clampRecursos(p);
  jogadorAtor(s).vida = p.recursos.vida;
  s.log.push(`Você usa ${item.nome}.`);
  depoisDaAcaoDoJogador(content, camp);
  return { ok: true };
}

export function jogadorFoge(content: ContentBundle, camp: Campaign): void {
  const s = camp.combate;
  if (!s || s.terminado) return;
  const p = camp.personagem;
  const chance = probabilidade(10 + modificador(p.atributos.precisao), 12, 4);
  if (nextFloat(camp.rng) < chance) {
    s.log.push('Você rompe o cerco e foge.');
    encerrar(camp, 'fuga');
  } else {
    s.log.push('Você tenta fugir, mas não encontra a brecha.');
    depoisDaAcaoDoJogador(content, camp);
  }
}

// ── Fluxo de turnos ─────────────────────────────────────────────────
function depoisDaAcaoDoJogador(content: ContentBundle, camp: Campaign): void {
  const s = camp.combate!;
  if (inimigosVivos(s).length === 0) {
    encerrar(camp, 'vitoria', content);
    return;
  }
  avancaTurno(s);
  avancarAteJogador(content, camp);
}

function avancaTurno(s: CombatState): void {
  s.turno += 1;
  if (s.turno >= s.ordem.length) {
    s.turno = 0;
    s.rodada += 1;
  }
}

// Processa turnos de inimigos até voltar ao jogador (ou o combate acabar).
function avancarAteJogador(content: ContentBundle, camp: Campaign): void {
  const s = camp.combate!;
  let guarda = 0;
  while (!s.terminado && guarda < 50) {
    guarda++;
    const atorId = s.ordem[s.turno];
    const ator = s.atores.find((a) => a.id === atorId);
    if (!ator || !vivo(ator)) {
      avancaTurno(s);
      continue;
    }
    if (ator.ehJogador) return; // vez do jogador: devolve o controle à UI

    // Turno do inimigo.
    checarFaseChefe(content, camp, ator);
    if (moralQuebrada(camp, s)) return;
    const jog = jogadorAtor(s);
    if (vivo(jog)) {
      s.log.push(resolverAtaque(camp, ator, jog, ator.dano ?? { base: 5, dispersao: 0.4, tipo: 'golpe' }));
      camp.personagem.recursos.vida = jog.vida;
    }
    if (jog.vida <= 0) {
      encerrar(camp, 'derrota', content);
      return;
    }
    avancaTurno(s);
  }
}

// Moral baixa: inimigos podem debandar (GDD §16).
function moralQuebrada(camp: Campaign, s: CombatState): boolean {
  if (s.moralInimiga >= 25) return false;
  if (nextFloat(camp.rng) < 0.5) {
    s.log.push('Sem estômago para continuar, os que restam recuam para as sombras.');
    encerrar(camp, 'vitoria');
    return true;
  }
  return false;
}

// Fase de chefe (GDD §17).
function checarFaseChefe(content: ContentBundle, camp: Campaign, ator: CombatActor): void {
  const s = camp.combate!;
  const c = ator.criaturaId ? criaturaPorId(content, ator.criaturaId) : undefined;
  if (!c?.chefe || !c.fase2 || s.fase >= 2) return;
  if (ator.vida <= ator.vidaMax * c.fase2.gatilhoPct) {
    s.fase = 2;
    s.log.push(`— ${c.nome} muda. ${c.fase2.descricao}`);
    if (c.fase2.mecanica === 'apagar_vinculo') {
      const conhecidos = content.npcs.filter((n) => (camp.npcState[n.id]?.memoria.length ?? 0) > 0);
      const alvo = conhecidos.length ? pick(camp.rng, conhecidos) : undefined;
      if (alvo) {
        const din = camp.npcState[alvo.id];
        din.memoria = [];
        for (const k of Object.keys(din.eixos)) din.eixos[k] = 0;
        s.log.push(`${alvo.nome} deixa de lembrar de você.`);
      }
    } else if (c.fase2.mecanica === 'enfurecer') {
      ator.acerto += 3;
      s.log.push(`${c.nome} ataca com fúria renovada.`);
    }
  }
}

function encerrar(camp: Campaign, resultado: 'vitoria' | 'derrota' | 'fuga', content?: ContentBundle): void {
  const s = camp.combate!;
  s.terminado = true;
  s.resultado = resultado;
  const p = camp.personagem;

  if (resultado === 'vitoria' && content) {
    let xp = 0;
    const loot: string[] = [];
    for (const a of s.atores) {
      if (a.ehJogador || vivo(a)) continue;
      const c = a.criaturaId ? criaturaPorId(content, a.criaturaId) : undefined;
      if (!c) continue;
      xp += c.xp;
      for (const l of c.loot ?? []) {
        if (nextFloat(camp.rng) < l.chance) {
          loot.push(l.item);
          p.inventario[l.item] = (p.inventario[l.item] ?? 0) + 1;
        }
      }
    }
    p.xp += xp;
    s.recompensa = { xp, loot };
    s.log.push(`Vitória. ${xp} de experiência${loot.length ? ` · saque: ${loot.join(', ')}` : ''}.`);
  } else if (resultado === 'derrota') {
    // GDD §15: sobrevive com sequela; o inimigo leva algo seu.
    p.recursos.vida = 1;
    if (!p.condicoes.includes('ferido')) p.condicoes.push('ferido');
    const perda = Math.min(p.dinheiro, Math.round(p.dinheiro * 0.3));
    p.dinheiro -= perda;
    s.log.push(`Você desaba. Acorda depois, ferido, com ${perda} moedas a menos.`);
  }
  clampRecursos(p);
}

export function fecharCombate(camp: Campaign): void {
  camp.combate = null;
}
