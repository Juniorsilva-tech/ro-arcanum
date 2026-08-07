// ARCANUM · O vale vive entre elas.
//
// As rotinas já colocavam cada uma num lugar a cada período. Mas elas se
// cruzavam e nada acontecia: duas rivais podiam passar a noite inteira na mesma
// taverna sem que o mundo registrasse. O jogador era a única fonte de história.
//
// Aqui os encontros produzem consequência. Quando duas que têm laço estão no
// mesmo lugar no mesmo período, a engine resolve o que houve entre elas, mexe
// no estado das duas e guarda um ECO — a versão que corre de boca em boca. É
// isso que o narrador depois pode contar, e é assim que a história nasce sem
// ninguém pedir.
import type { Campaign, ContentBundle, LacoTipo, NPC } from './types';
import { nextFloat, pick } from './rng';
import { PERIODOS, type Periodo } from './time';

// Onde cada uma está num período (mesma regra da disponibilidade — GDD §10.3).
function ondeEsta(npc: NPC, periodo: Periodo): string {
  return npc.rotina[periodo] ?? npc.localBase;
}

// O que costuma acontecer quando essas duas se esbarram.
const ENCONTROS: Record<LacoTipo, { texto: string[]; tensaoA: number; tensaoB: number; disposicao: number }> = {
  rival: {
    texto: [
      '{A} e {B} trocaram desaforo em {L}, e o resto calou para ouvir',
      '{A} virou as costas para {B} em {L} sem disfarçar',
      '{B} derrubou a caneca de {A} em {L} e não pediu desculpa',
    ],
    tensaoA: 8,
    tensaoB: 8,
    disposicao: -2,
  },
  aliada: {
    texto: [
      '{A} e {B} passaram a tarde juntas em {L}, rindo do que ninguém entendeu',
      '{A} cobriu o turno de {B} em {L}',
      '{B} dividiu o pão com {A} em {L}',
    ],
    tensaoA: -10,
    tensaoB: -10,
    disposicao: 2,
  },
  amante: {
    texto: [
      '{A} e {B} sumiram juntas de {L} por um bom tempo',
      'alguém viu {A} sair de {L} pela porta dos fundos, e {B} logo atrás',
      '{A} e {B} não se falaram em {L}, o que é pior do que se tivessem falado',
    ],
    tensaoA: -14,
    tensaoB: -14,
    disposicao: 3,
  },
  devedora: {
    texto: [
      '{B} cobrou {A} na frente de todo mundo em {L}',
      '{A} evitou {B} a manhã inteira em {L}',
      '{B} deixou um recado com quem estava em {L}, para {A} entender',
    ],
    tensaoA: 12,
    tensaoB: 2,
    disposicao: -3,
  },
  protege: {
    texto: [
      '{A} tirou {B} de uma confusão em {L}',
      '{A} não deixou ninguém encostar em {B} em {L}',
      '{A} levou {B} para casa de {L} quando a coisa esquentou',
    ],
    tensaoA: -6,
    tensaoB: -12,
    disposicao: 3,
  },
  desconfia: {
    texto: [
      '{A} ficou de olho em {B} o tempo todo em {L}',
      '{A} perguntou por {B} em {L} a quem não devia',
      '{B} percebeu que {A} a estava medindo em {L}',
    ],
    tensaoA: 4,
    tensaoB: 6,
    disposicao: -1,
  },
  sangue: {
    texto: [
      '{A} e {B} discutiram coisa de família em {L}, e nenhuma cedeu',
      '{A} e {B} ficaram caladas lado a lado em {L}, do jeito que só parente fica',
      '{B} lembrou {A} de uma dívida velha em {L} que não é de dinheiro',
    ],
    tensaoA: 3,
    tensaoB: 3,
    disposicao: 0,
  },
};

function registrarEco(camp: Campaign, local: string, texto: string, npcs: string[]): void {
  const lista = camp.ecos ?? (camp.ecos = []);
  lista.push({ turno: camp.turno, dia: camp.calendario.dia, local, texto, npcs });
  // O boato envelhece: o vale não guarda mais que isso na boca do povo.
  if (lista.length > 12) lista.shift();
}

// Roda um período de convívio. Chamada uma vez por dia (ver mundo.ts): o vale
// não precisa simular as vinte e quatro horas para parecer vivo.
export function cruzarRotinas(content: ContentBundle, camp: Campaign, periodo: Periodo): void {
  const porLocal = new Map<string, NPC[]>();
  for (const npc of content.npcs) {
    if (!camp.npcState[npc.id]?.vivo) continue;
    const onde = ondeEsta(npc, periodo);
    const arr = porLocal.get(onde) ?? [];
    arr.push(npc);
    porLocal.set(onde, arr);
  }

  for (const [localId, gente] of porLocal) {
    if (gente.length < 2) continue;
    const nomeLocal = content.locais.find((l) => l.id === localId)?.nome ?? localId;

    for (const a of gente) {
      for (const laco of a.relacoes ?? []) {
        const b = gente.find((x) => x.id === laco.npc);
        if (!b) continue; // ela não está aqui agora
        // Nem todo encontro vira acontecimento — senão o vale vira novela.
        if (nextFloat(camp.rng) > 0.3) continue;

        const regra = ENCONTROS[laco.tipo];
        const dinA = camp.npcState[a.id];
        const dinB = camp.npcState[b.id];
        if (!dinA || !dinB) continue;

        dinA.tensao = Math.max(0, Math.min(100, dinA.tensao + regra.tensaoA));
        dinB.tensao = Math.max(0, Math.min(100, dinB.tensao + regra.tensaoB));
        // O humor delas com o jogador também balança: gente contente é mais
        // fácil de abordar do que gente que acabou de brigar.
        for (const d of [dinA, dinB]) {
          if (d.eixos.disposicao !== undefined) {
            d.eixos.disposicao = Math.max(-20, Math.min(20, d.eixos.disposicao + regra.disposicao));
          }
        }

        const molde = pick(camp.rng, regra.texto);
        registrarEco(
          camp,
          localId,
          molde.replace('{A}', a.nome).replace('{B}', b.nome).replace('{L}', nomeLocal),
          [a.id, b.id],
        );
      }
    }
  }
}

// Sorteia o período do dia em que o vale foi observado.
export function periodoQualquer(camp: Campaign): Periodo {
  return pick(camp.rng, [...PERIODOS]);
}

// O que a boca do povo anda repetindo. Vai para o narrador e para quem
// perguntar por aí.
export function ecosRecentes(camp: Campaign, quantos = 4, localId?: string): string[] {
  const todos = camp.ecos ?? [];
  const filtrados = localId ? todos.filter((e) => e.local === localId) : todos;
  const base = filtrados.length > 0 ? filtrados : todos;
  return base.slice(-quantos).map((e) => `dia ${e.dia}: ${e.texto}`);
}
