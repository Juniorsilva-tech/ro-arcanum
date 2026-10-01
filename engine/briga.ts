// ARCANUM · Briga com quem está na cena.
//
// Até aqui, "dou um soco na Elza" ou "mato todo mundo na taverna" não tinham
// regra: o texto ia direto para o narrador, que inventava o resultado, ou
// "matar" sorteava um bandido de fora da cena. Agora a engine decide:
// - cada NPC adulto presente vira um adversário com a força do ofício (a
//   guarda e o caçador batem; a serva e o velho, quase nada; o mestre, como
//   na prova);
// - briga de soco (não letal): quem cai está nocauteado; ninguém morre e,
//   se você apanhar, ninguém leva sua bolsa;
// - luta letal (matar, esfaquear, sacar a lâmina): quem cai MORRE de verdade
//   (npcState.vivo = false), o vale fica sabendo, a guarda e a vila passam a
//   te odiar, e quem viu fica com pavor;
// - menor de idade nunca entra em briga.
import type { Campaign, ContentBundle, Criatura, NPC } from './types';
import { iniciarCombate } from './combat';
import { calcularContexto } from './availability';
import { npcPorId } from './elenco';
import { registrarMarco } from './memoria';
import { registrarFato, cidadeIdDoLocal } from './historiaViva';
import { registrarMorteFamiliar } from './familia';
import { NIVEL_MESTRE } from '../content/vaelhorn/ritoMestres';
import { registrarCrime, ehAssentamentoDoJogador, OFICIO_GUARDA } from './guarda';

export const PREFIXO_BRIGA = 'briga_';
/** Fugitivo pego pelo jogador volta à cela com pena dobrada (engine/crimeUrbano.ts). */
const PENA_FUGITIVO = { furto: 10, briga: 6, morte: 80 } as const;
export const REGIAO_DA_BRIGA = 'Briga';

const OFICIO_DE_LUTA = /guard|soldad|sentinel|mercen|capit|cavaleir|caçad|cacad|ferreir|lutador|patrulh|batedor|carrasc|miliciano|guerreir|inquisi|caçador/i;

function idadeDe(camp: Campaign, npc: NPC): number {
  return camp.npcState[npc.id]?.idade ?? npc.idade ?? 30;
}

/** Nível de luta de uma pessoa comum, pelo ofício e pela idade. */
function nivelDaPessoa(camp: Campaign, npc: NPC): number {
  if (npc.ensinaMestre) return NIVEL_MESTRE[npc.ensinaMestre] ?? 8;
  const idade = idadeDe(camp, npc);
  if (OFICIO_DE_LUTA.test(npc.ocupacao ?? '')) return 5;
  if (idade >= 60) return 1;
  return 2;
}

/** O adversário que a pessoa vira numa briga. Gerado na hora: serve também para família e gente do mundo vivo. */
export function criaturaDaBriga(camp: Campaign, npc: NPC): Criatura {
  const n = nivelDaPessoa(camp, npc);
  return {
    id: PREFIXO_BRIGA + npc.id,
    nome: npc.nome,
    descricao: `${npc.nome}, ${npc.ocupacao ?? 'gente do lugar'}, se defende como pode.`,
    historia: `${npc.nome} não estava esperando briga hoje.`,
    sinais: 'Gente comum: luta para sair viva, não para vencer.',
    nivel: n,
    vida: Math.round(16 + n * 7),
    defesa: Math.round(9 + n * 0.7),
    acerto: Math.round(9 + n * 0.8),
    ataqueNome: n >= 5 ? 'golpe treinado' : 'murro desajeitado',
    dano: { base: Math.round(3 + n * 0.9), dispersao: 0.3, tipo: 'contusão' },
    moralBase: n >= 5 ? 80 : 45,
    xp: Math.max(2, n * 2),
    humano: true,
    regiaoExclusiva: REGIAO_DA_BRIGA,
  } as Criatura;
}

/** Quem dá para enfrentar: presente, vivo e adulto. */
export function alvosDaBriga(content: ContentBundle, camp: Campaign, npcIds: string[]): NPC[] {
  const presentes = calcularContexto(content, camp).presentes;
  return presentes.filter((n) => npcIds.includes(n.id) && idadeDe(camp, n) >= 18);
}

export function iniciarBriga(
  content: ContentBundle,
  camp: Campaign,
  npcIds: string[],
  letal: boolean,
): { ok: boolean; motivo?: string } {
  if (camp.combate && !camp.combate.terminado) return { ok: false, motivo: 'já há uma luta em curso' };
  if (camp.prisao) return { ok: false, motivo: 'você está na cela' };
  if (camp.abordagem) return { ok: false, motivo: 'a patrulha te cercou: escolha lutar, fugir, subornar ou render-se' };
  const alvos = alvosDaBriga(content, camp, npcIds);
  if (!alvos.length) return { ok: false, motivo: 'não há com quem brigar aqui' };
  // As criaturas da briga nascem na hora (família e gente do mundo vivo não
  // estão no conteúdo fixo). Entram no catálogo da sessão uma vez só.
  for (const n of alvos) {
    const c = criaturaDaBriga(camp, n);
    if (!content.criaturas.some((x) => x.id === c.id)) content.criaturas.push(c);
  }
  const s = iniciarCombate(content, camp, alvos.map((n) => PREFIXO_BRIGA + n.id), undefined, { letal });
  // Soco é soco: sem lâmina, dano de punho pelo físico.
  if (!letal) {
    const eu = s.atores.find((a) => a.ehJogador);
    if (eu) eu.dano = { base: Math.max(3, Math.round(4 + (camp.personagem.atributos.fisico - 10) / 2)), dispersao: 0.3, tipo: 'contusão' };
  }
  s.log.push(letal
    ? 'Não é mais briga: é para matar. Quem cair aqui não levanta.'
    : 'Briga de soco. Quem cair fica no chão, mas vivo.');
  return { ok: true };
}

function ajustar(camp: Campaign, npcId: string, eixo: string, delta: number): void {
  const din = camp.npcState[npcId];
  if (!din) return;
  din.eixos ??= {};
  din.eixos[eixo] = Math.max(-100, Math.min(100, (din.eixos[eixo] ?? 0) + delta));
}

// "Vess, a Fiadora" numa lista com vírgulas vira duas pessoas para quem lê
// (o narrador contou oito mortos onde houve seis). Na lista, só o nome.
function listar(nomesCompletos: string[]): string {
  const nomes = nomesCompletos.map((n) => n.split(',')[0].trim());
  return nomes.length <= 1 ? nomes.join('') : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

/**
 * Fecha a briga depois que a luta acabou: mata ou nocauteia quem caiu, conta
 * para a guarda e para a vila, assusta quem viu, e devolve o fato da cena.
 */
export function concluirBriga(content: ContentBundle, camp: Campaign): { fato: string; mortos: string[] } | undefined {
  const s = camp.combate;
  if (!s?.briga) return undefined;
  const letal = s.briga.letal;
  const local = content.locais.find((l) => l.id === camp.localAtual)?.nome ?? 'aqui';
  const lutaram = s.atores.filter((a) => !a.ehJogador && !a.ehAliado && a.criaturaId?.startsWith(PREFIXO_BRIGA));
  const mortos: string[] = [];
  const caidos: string[] = [];
  const fugiram: string[] = [];
  const idsDaLuta = new Set<string>();
  const cacadas: { nome: string; valor: number; cidade: string; vivo: boolean }[] = [];
  const queriamVivo: string[] = [];

  for (const a of lutaram) {
    const npcId = a.criaturaId!.slice(PREFIXO_BRIGA.length);
    idsDaLuta.add(npcId);
    const npc = npcPorId(content, camp, npcId);
    const nome = npc?.nome ?? a.nome;
    const caiu = a.vida <= 0 && !a.capturado;
    // Fugitivo com cartaz (engine/crimeUrbano.ts): caçar a recompensa é
    // trabalho, não crime — vivo sempre paga; morto, só se "vivo ou morto".
    const caso = camp.procuradosNpc?.[npcId];
    if (caso && !letal && (caiu || a.capturado)) {
      const pessoa = camp.vivo?.pessoas[npcId];
      if (pessoa) {
        const crime = pessoa.presoPor ?? 'furto';
        pessoa.objetivo = 'preso'; pessoa.presoAte = camp.calendario.dia + PENA_FUGITIVO[crime]; pessoa.local = caso.cidade; pessoa.deslocado = false;
      }
      delete camp.procuradosNpc![npcId];
      cacadas.push({ nome, valor: caso.recompensa, cidade: caso.cidade, vivo: true });
      continue;
    }
    if (caiu && letal) {
      const din = camp.npcState[npcId];
      if (din) { din.vivo = false; din.vida = 0; }
      if (npc?.parentesco) registrarMorteFamiliar(camp, npcId);
      if (caso?.vivoOuMorto) {
        delete camp.procuradosNpc![npcId];
        cacadas.push({ nome, valor: caso.recompensa, cidade: caso.cidade, vivo: false });
        continue;
      }
      if (caso) { delete camp.procuradosNpc![npcId]; queriamVivo.push(nome); }
      mortos.push(nome);
    } else if (caiu || a.capturado) {
      ajustar(camp, npcId, 'medo', 12);
      ajustar(camp, npcId, 'disposicao', -15);
      ajustar(camp, npcId, 'confianca', -10);
      caidos.push(nome);
    } else {
      // Fugiu ou ainda estava de pé quando você caiu/correu.
      ajustar(camp, npcId, letal ? 'medo' : 'disposicao', letal ? 20 : -10);
      fugiram.push(nome);
    }
  }

  // Quem estava no salão e não entrou na briga viu tudo.
  const testemunhas = calcularContexto(content, camp).presentes.filter((n) => !idsDaLuta.has(n.id));
  for (const t of testemunhas) {
    ajustar(camp, t.id, 'medo', mortos.length ? 25 : 8);
    ajustar(camp, t.id, 'disposicao', mortos.length ? -25 : -6);
  }

  // Quem caiu na briga de soco hoje não vem te prender agora (engine/guarda.ts).
  if (!letal) for (const a of lutaram) if (a.vida <= 0) camp.flags[`nocaute.${a.criaturaId!.slice(PREFIXO_BRIGA.length)}`] = camp.calendario.dia;

  const r = camp.reputacao as unknown as Record<string, number>;
  const noMeuAssentamento = ehAssentamentoDoJogador(camp, camp.localAtual);
  if (noMeuAssentamento && camp.feudo) {
    // No seu assentamento a guarda é sua: ninguém te prende, mas a colônia viu.
    const f = camp.feudo;
    f.estabilidade = Math.max(0, f.estabilidade - 10 * mortos.length - 3 * caidos.length);
    for (const co of f.colonos ?? []) co.humor = Math.max(0, co.humor - (mortos.length ? 15 : 4));
    f.historicoEventos.push({ dia: camp.calendario.dia, texto: mortos.length ? `O senhor matou ${listar(mortos)} dentro da colônia. Ninguém ousa falar alto.` : `O senhor brigou dentro da colônia.` });
  } else if (mortos.length) {
    r.guarda = (r.guarda ?? 0) - 15 * mortos.length;
    r.vila = (r.vila ?? 0) - 10 * mortos.length;
    // A guarda da região passa a procurar (engine/guarda.ts).
    registrarCrime(content, camp, 'sangue', 40 * mortos.length, `matou ${listar(mortos)} em ${local}`);
  } else if (caidos.length) {
    r.guarda = (r.guarda ?? 0) - 3 * caidos.length;
    // Briga vista por alguém (testemunha ou guarda) vira arruaça.
    if (testemunhas.length || lutaram.some((a) => OFICIO_GUARDA.test(npcPorId(content, camp, a.criaturaId!.slice(PREFIXO_BRIGA.length))?.ocupacao ?? ''))) {
      registrarCrime(content, camp, 'arruaca', 10 * caidos.length, `briga em ${local}`);
    }
  }
  // Sangue na rua deixa a cidade com medo: a desordem dela sobe.
  const cidadeId = cidadeIdDoLocal(content, camp, camp.localAtual);
  const cidade = cidadeId ? camp.vivo?.cidades[cidadeId] : undefined;
  if (cidade) cidade.inseguranca = Math.min(100, cidade.inseguranca + 5 * mortos.length + caidos.length);

  const p = camp.personagem;
  // Recompensa paga pela cidade do cartaz; a guarda fica grata.
  let textoCacada = '';
  if (cacadas.length) {
    for (const c of cacadas) {
      const cidade = camp.vivo?.cidades[c.cidade];
      const pago = c.valor;
      if (cidade) cidade.tesouro = Math.max(0, cidade.tesouro - pago);
      p.dinheiro += pago;
      r.guarda = (r.guarda ?? 0) + 5;
      if (camp.vivo) registrarFato(camp, { tipo: 'recompensa', local: c.cidade, texto: `${p.nome} ${c.vivo ? 'entregou' : 'levou o corpo de'} ${c.nome.split(',')[0]} à guarda e recebeu ${pago} moedas de recompensa.`, atores: ['jogador'], publico: true });
    }
    textoCacada = cacadas.map((c) => c.vivo
      ? `Você amarra ${c.nome.split(',')[0]} e entrega na guarda: ${c.valor} moedas de recompensa.`
      : `Você leva o corpo de ${c.nome.split(',')[0]} à guarda. O cartaz dizia vivo ou morto: ${c.valor} moedas.`).join(' ');
  }
  if (queriamVivo.length) textoCacada += ` O cartaz de ${listar(queriamVivo)} pedia vivo: a guarda não paga por corpo e trata a morte como crime.`;
  let fato: string;
  if (mortos.length) {
    const texto = `${p.nome} matou ${listar(mortos)} em ${local}.`;
    registrarMarco(camp, `você matou ${listar(mortos)} em ${local}`);
    if (camp.vivo) registrarFato(camp, { tipo: 'assassinato', local: camp.localAtual, texto, atores: ['jogador'], publico: true });
    fato = `Você matou ${listar(mortos)} em ${local}. Os corpos ficam no chão.` +
      (fugiram.length ? ` ${listar(fugiram)} ${fugiram.length > 1 ? 'escaparam' : 'escapou'} e vai contar para todo mundo.` : '') +
      (testemunhas.length ? ` Quem viu (${listar(testemunhas.map((t) => t.nome))}) está paralisado de medo.` : '') +
      ' A guarda vai saber disso.';
  } else if (s.resultado === 'derrota') {
    fato = `Você puxou briga em ${local} e apanhou.` + (caidos.length ? ` Mesmo assim, ${listar(caidos)} ${caidos.length > 1 ? 'ficaram' : 'ficou'} no chão antes.` : '') +
      (letal ? ' Você queria matar e não conseguiu: agora todo mundo aqui sabe disso.' : '');
  } else if (s.resultado === 'fuga') {
    fato = `Você começou uma briga em ${local} e saiu correndo antes do fim.`;
  } else if (!caidos.length && cacadas.length) {
    fato = '';
  } else {
    fato = `Você derrubou ${listar(caidos)} na briga em ${local}. Ninguém morreu, mas ninguém vai esquecer.`;
    if (camp.vivo && caidos.length) registrarFato(camp, { tipo: 'briga', local: camp.localAtual, texto: `${p.nome} derrubou ${listar(caidos)} numa briga em ${local}.`, atores: ['jogador'], publico: true });
  }
  fato = [fato, textoCacada.trim()].filter(Boolean).join(' ');
  return { fato, mortos };
}
