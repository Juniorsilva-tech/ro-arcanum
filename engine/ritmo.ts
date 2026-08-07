// ARCANUM · O ritmo da campanha.
//
// A ideia de um "diretor" que olha a história inteira é boa. A implementação
// que se costuma propor — um segundo agente de IA rodando de vez em quando —
// é cara e frágil aqui: este jogo roda em modelos gratuitos com limite diário
// de requisições, e o jogador já esbarrou nesse teto. Uma chamada a mais por
// turno é uma chamada a menos de história.
//
// Então o diretor é DADO, não agente: a tensão sai do estado que a engine já
// mantém, e vira o tom que o narrador recebe. Custa zero e nunca falha.
import type { Campaign, ContentBundle } from './types';

export type FaseNarrativa =
  | 'calmaria'
  | 'inquietacao'
  | 'complicacao'
  | 'revelacao'
  | 'climax';

export type Ritmo = {
  tensao: number; // 0..100
  fase: FaseNarrativa;
  tom: string; // instrução curta de registro para o narrador
  motivos: string[]; // o que está puxando a tensão para cima
};

const TOM: Record<FaseNarrativa, string> = {
  calmaria:
    'Respiro. Deixe a cena ser pequena e concreta: ofício, comida, fofoca, corpo. ' +
    'Nada de ameaça nova — o mundo está juntando fôlego.',
  inquietacao:
    'Alguma coisa não está certa e ninguém diz o quê. Plante um detalhe fora do lugar ' +
    'e não explique.',
  complicacao:
    'O que estava adiado cobra agora. Uma dívida, uma suspeita ou um corpo aparece ' +
    'no meio do caminho.',
  revelacao:
    'É hora de entregar uma peça de verdade — algo que reorganize o que o jogador ' +
    'achava que sabia. Amarre com o que já aconteceu.',
  climax:
    'Tudo converge. Escreva curto, seco e alto. Não proteja ninguém: nesta altura, ' +
    'perder é possível.',
};

// Onde cada fase começa.
function faseDe(t: number): FaseNarrativa {
  if (t >= 82) return 'climax';
  if (t >= 62) return 'revelacao';
  if (t >= 42) return 'complicacao';
  if (t >= 22) return 'inquietacao';
  return 'calmaria';
}

// A tensão é lida do estado, não guardada: nada para dessincronizar com o save.
export function calcularRitmo(content: ContentBundle, camp: Campaign): Ritmo {
  const p = camp.personagem;
  const motivos: string[] = [];
  let t = 0;

  // Pressão interna: mente e mancha (GDD §5).
  const sanidade = p.pressoes['sanidade'] ?? 0;
  const corrupcao = p.pressoes['corrupcao'] ?? 0;
  if (sanidade > 25) {
    t += Math.min(20, sanidade / 5);
    motivos.push('a cabeça dele está cedendo');
  }
  if (corrupcao > 20) {
    t += Math.min(20, corrupcao / 5);
    motivos.push('a mancha já aparece nele');
  }

  // Corpo em risco.
  const vidaPct = p.recursos.vida / Math.max(1, p.recursosMax.vida);
  if (vidaPct < 0.5) {
    t += (1 - vidaPct) * 24;
    motivos.push('ele está machucado');
  }
  if (p.condicoes.includes('agonizante')) {
    t += 20;
    motivos.push('ele está por um fio');
  }

  // Gente que não vai esquecer.
  const inimigas = Object.entries(camp.npcState).filter(([, d]) => d.vivo && d.tensao >= 60);
  if (inimigas.length > 0) {
    t += Math.min(18, inimigas.length * 6);
    motivos.push(`${inimigas.length === 1 ? 'alguém tem' : `${inimigas.length} pessoas têm`} contas a acertar com ele`);
  }

  // Fios abertos. Uma campanha nova já nasce com alguns — eles sozinhos não
  // podem tirar a história da calmaria.
  const ativas = Object.values(camp.questEstado).filter((e) => e === 'ativa').length;
  if (ativas > 0) {
    t += Math.min(10, ativas * 2);
    motivos.push(`${ativas} ${ativas === 1 ? 'fio aberto' : 'fios abertos'}`);
  }

  // Onde ele está pisando. Só conta o que é perigoso ACIMA do normal do vale:
  // a taverna é 3 e é o ponto de partida — lugar de partida não é aperto.
  const local = content.locais.find((l) => l.id === camp.localAtual);
  if (local && local.perigo > 3) {
    t += (local.perigo - 3) * 5;
    motivos.push(`${local.nome} não é lugar seguro`);
  }

  // Reputação no vermelho com alguma facção.
  const odiado = Object.entries(camp.reputacao).filter(([, v]) => v <= -10);
  if (odiado.length > 0) {
    t += Math.min(12, odiado.length * 6);
    motivos.push('há facção querendo a cabeça dele');
  }

  // Alívio: se faz muito tempo que nada grande acontece, a história esfria de
  // propósito — é o que impede a campanha de viver em clímax permanente.
  const ultimoMarco = camp.marcos?.[camp.marcos.length - 1];
  const desde = ultimoMarco ? camp.turno - ultimoMarco.turno : camp.turno;
  if (desde > 12) t -= Math.min(18, (desde - 12) * 1.5);

  const tensao = Math.max(0, Math.min(100, Math.round(t)));
  const fase = faseDe(tensao);
  return { tensao, fase, tom: TOM[fase], motivos: motivos.slice(0, 4) };
}
