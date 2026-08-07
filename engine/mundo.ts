// ARCANUM · O vale continua sem você.
//
// Até aqui o mundo congelava entre as suas ações: mesma feira, mesmo preço,
// mesmo tempo, para sempre. Quem espera uma semana volta e não encontra nada
// diferente — e isso é o que faz um jogo parecer cenário em vez de lugar.
//
// Este módulo faz o tempo cobrar de todo mundo. Não é simulação econômica: é
// um punhado de estados que mudam sozinhos, chegam ao narrador e mexem no
// preço da loja. Barato de rodar, e o bastante para o vale parecer vivo.
import type { Campaign, ContentBundle, Estacao } from './types';
import { nextFloat, nextInt, pick } from './rng';
import { registrarMarco } from './memoria';
import { cruzarRotinas, periodoQualquer } from './convivio';

export type Clima = 'limpo' | 'nublado' | 'chuva' | 'temporal' | 'neblina' | 'geada';

export type EventoMundo = {
  id: string;
  nome: string;
  descricao: string;
  diasRestantes: number;
  // Multiplicador sobre o preço de compra enquanto durar.
  precos?: number;
};

export type MundoState = {
  clima: Clima;
  // Multiplicador de preço corrente na praça (1 = normal).
  carestia: number;
  evento?: EventoMundo;
  // Último dia processado, para o mundo avançar mesmo depois de dias parados.
  diaProcessado: number;
};

const CLIMA_POR_ESTACAO: Record<Estacao, Clima[]> = {
  primavera: ['limpo', 'nublado', 'chuva', 'chuva', 'neblina'],
  verao: ['limpo', 'limpo', 'limpo', 'nublado', 'temporal'],
  outono: ['nublado', 'chuva', 'neblina', 'chuva', 'temporal'],
  inverno: ['geada', 'nublado', 'neblina', 'geada', 'temporal'],
};

export const DESCRICAO_CLIMA: Record<Clima, string> = {
  limpo: 'céu aberto',
  nublado: 'céu fechado',
  chuva: 'chuva fina',
  temporal: 'temporal',
  neblina: 'neblina',
  geada: 'geada',
};

// O que pode acontecer no vale sem o jogador mexer um dedo.
const EVENTOS: Omit<EventoMundo, 'diasRestantes'>[] = [
  {
    id: 'feira',
    nome: 'Feira de fim de semana',
    descricao: 'Carroças de fora encheram a praça. Há mais gente, mais fofoca e mais barganha.',
    precos: 0.8,
  },
  {
    id: 'caravana',
    nome: 'Caravana do sal',
    descricao: 'A caravana atracou na estrada. Mercadoria nova, e olhos novos junto.',
    precos: 0.85,
  },
  {
    id: 'escassez',
    nome: 'Falta de pão',
    descricao: 'O moinho parado começou a doer. O que ainda tem farinha cobra caro.',
    precos: 1.5,
  },
  {
    id: 'febre',
    nome: 'Febre na vila',
    descricao: 'Uma febre correu as casas de baixo. Metade do vale tosse, e a capela vive cheia.',
    precos: 1.25,
  },
  {
    id: 'ronda',
    nome: 'A guarda dobrou a ronda',
    descricao: 'Bael pôs gente na rua a noite inteira. Quem tem o que esconder anda por dentro.',
  },
  {
    id: 'luto',
    nome: 'Luto no vale',
    descricao: 'Enterraram alguém que fazia falta. As portas ficam encostadas e as vozes baixas.',
  },
  {
    id: 'lua_cheia',
    nome: 'Lua cheia',
    descricao: 'A noite fica clara demais para quem precisa de escuro, e a mata fica barulhenta.',
  },
];

export function mundoInicial(camp: Campaign): MundoState {
  return {
    clima: pick(camp.rng, CLIMA_POR_ESTACAO[camp.calendario.estacao]),
    carestia: 1,
    diaProcessado: camp.calendario.dia,
  };
}

// Chamada sempre que o calendário anda. Roda uma vez por DIA virado — esperar
// uma semana faz o mundo mudar sete vezes, não uma.
export function avancarMundo(content: ContentBundle, camp: Campaign): void {
  const m = camp.mundo ?? (camp.mundo = mundoInicial(camp));
  const hoje = camp.calendario.dia;
  // Guarda contra saves antigos e contra o dia andar para trás.
  let dias = Math.max(0, Math.min(30, hoje - m.diaProcessado));
  m.diaProcessado = hoje;

  while (dias > 0) {
    dias -= 1;

    // O tempo vira, com peso da estação.
    if (nextFloat(camp.rng) < 0.55) {
      m.clima = pick(camp.rng, CLIMA_POR_ESTACAO[camp.calendario.estacao]);
    }

    // O evento corrente envelhece e sai.
    if (m.evento) {
      m.evento.diasRestantes -= 1;
      if (m.evento.diasRestantes <= 0) m.evento = undefined;
    }

    // E de vez em quando entra um novo.
    if (!m.evento && nextFloat(camp.rng) < 0.22) {
      const base = pick(camp.rng, EVENTOS);
      m.evento = { ...base, diasRestantes: nextInt(camp.rng, 2, 5) };
      registrarMarco(camp, `no vale: ${base.nome.toLowerCase()}`);
    }

    // Preço anda sozinho e volta devagar ao normal.
    const deriva = (nextFloat(camp.rng) - 0.5) * 0.08;
    m.carestia = Math.max(0.7, Math.min(1.8, m.carestia + deriva + (1 - m.carestia) * 0.15));

    // A vida das pessoas também anda. Quem foi deixado de lado esfria; quem
    // está muito magoado começa a esquecer o que houve de bom.
    for (const din of Object.values(camp.npcState)) {
      if (!din.vivo) continue;
      din.tensao = Math.min(100, din.tensao + 1);
      if (din.tensao > 80 && din.eixos.disposicao !== undefined) {
        din.eixos.disposicao = Math.max(-20, din.eixos.disposicao - 1);
      }
    }

    // E elas se esbarram. Um período por dia basta para o vale ter história
    // própria sem virar novela (ver convivio.ts).
    cruzarRotinas(content, camp, periodoQualquer(camp));
  }
}

// Preço que a loja deve cobrar hoje.
export function multiplicadorDePreco(camp: Campaign): number {
  const m = camp.mundo;
  if (!m) return 1;
  return m.carestia * (m.evento?.precos ?? 1);
}

// Como o vale está hoje, em palavras — vai para o narrador e para o HUD.
export function comoEstaOVale(camp: Campaign): {
  clima: string;
  estacao: string;
  evento?: string;
  carestia?: string;
} {
  const m = camp.mundo;
  const mult = multiplicadorDePreco(camp);
  return {
    clima: DESCRICAO_CLIMA[m?.clima ?? 'nublado'],
    estacao: camp.calendario.estacao,
    evento: m?.evento ? `${m.evento.nome}: ${m.evento.descricao}` : undefined,
    carestia: mult >= 1.25 ? 'tudo está caro' : mult <= 0.85 ? 'há pechincha na praça' : undefined,
  };
}
