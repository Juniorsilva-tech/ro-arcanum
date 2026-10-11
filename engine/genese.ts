// ARCANUM · Gênese: pais gerados proceduralmente e herança genética antes da
// primeira cena — vem do documento de design original (seção "Gênese
// Dinâmica e Linhagem"), adaptado aos atributos do Vaelhorn em vez de
// classes específicas de anime. Não substitui o point-buy que o jogador já
// faz na criação: empurra os atributos escolhidos um pouco na direção da
// herança dos pais.
//
// A MARCA (o que definiu a infância) e a REAÇÃO (como isso formou o
// personagem) eram sorteadas por RNG. Viraram duas escolhas reais na
// criação de personagem (ver ui/screens/Criacao.tsx, "escolherInfancia" em
// ui/store.ts) — o jogador tem mais o que dizer sobre quem ele foi, sem
// abrir um segundo modo de jogo turno-a-turno pra infância (isso ficou de
// fora por ser um escopo muito maior — ver o documento de dinastia v2).
import {
  ATTR_KEYS,
  type AttrKey,
  type Atributos,
  type CartaMemoria,
  type GeneseResultado,
  type MarcaInfancia,
  type ReacaoInfancia,
} from './types';
import { type RngState, nextFloat, nextInt, pick } from './rng';

const NOMES_PAI = ['Aldrico', 'Bastian', 'Corvin', 'Deodato', 'Elric', 'Fadrique', 'Gervas', 'Henrick', 'Ivo', 'Jorund', 'Osvard', 'Teodoro'];
const NOMES_MAE = ['Alda', 'Branca', 'Ceres', 'Dorotéia', 'Elsa', 'Fausta', 'Greta', 'Hilda', 'Ivana', 'Jandira', 'Solveig', 'Ynez'];

const MOTIVOS_TRAGEDIA = [
  'a fome do inverno levou o que a peste ainda não tinha levado',
  'a ponte caiu e a estrada de volta para casa nunca mais existiu',
  'algo veio das ruínas antes do amanhecer, e não sobrou tempo para gritar',
  'a dívida com o senhorio virou penhora, e a penhora virou desaparecimento',
  'a febre chegou junto com os mercadores, e não escolheu quem levar',
];

// Opções que a UI de criação de personagem oferece (ui/screens/Criacao.tsx).
// Texto genérico o bastante para qualquer cenário — nada específico do
// Vaelhorn aqui, é por isso que mora na engine e não em content/.
export const MARCAS_INFANCIA: { id: MarcaInfancia; titulo: string; descricao: string }[] = [
  {
    id: 'genio',
    titulo: 'Gênio (Talento Precoce)',
    descricao: 'Desde criança, você entendia tudo antes de precisarem explicar. Concede +1 em todos os atributos base e reconhecimento familiar.',
  },
  {
    id: 'tragedia',
    titulo: 'Uma perda',
    descricao: 'Algo levou os seus pais cedo demais. Você cresceu sem o teto que devia ter.',
  },
  {
    id: 'indigno',
    titulo: 'Expectativas baixas',
    descricao: 'Ninguém esperava muito de você. Cada vitória custou o dobro do normal.',
  },
  {
    id: 'comum',
    titulo: 'Uma infância qualquer',
    descricao: 'Nada de extraordinário — só o que qualquer infância no vale cobra.',
  },
];

export const REACOES_INFANCIA: { id: ReacaoInfancia; titulo: string; descricao: string }[] = [
  {
    id: 'sozinho',
    titulo: 'Você lidou com isso sozinho',
    descricao: 'Aprendeu a aguentar. O corpo endureceu antes da cabeça.',
  },
  {
    id: 'apoio',
    titulo: 'Você buscou apoio nos outros',
    descricao: 'Aprendeu a ler as pessoas — quem ajuda, quem finge, quem cobra depois.',
  },
  {
    id: 'entendimento',
    titulo: 'Você tentou entender o porquê',
    descricao: 'Aprendeu a perguntar demais. Nunca aceitou uma resposta só porque foi dada.',
  },
];

// Qual atributo a reação empurra — pequeno e real, não decorativo: soma
// direto no puxão de herança em aplicarHeranca, abaixo.
const ATRIBUTO_DA_REACAO: Record<ReacaoInfancia, AttrKey> = {
  sozinho: 'resiliencia',
  apoio: 'social',
  entendimento: 'raciocinio',
};

function atributosDosPais(rng: RngState, base = 10, desvio = 3): Atributos {
  const out = {} as Atributos;
  for (const k of ATTR_KEYS) out[k] = base + nextInt(rng, -desvio, desvio);
  return out;
}

// Pais e irmãos continuam sorteados — não há escolha significativa a
// oferecer aí, e forçar o jogador a "escolher o nome do pai" seria
// cerimônia sem substância.
export function montarGenese(rng: RngState, marca: MarcaInfancia, reacao: ReacaoInfancia): GeneseResultado {
  const paiAtributos = atributosDosPais(rng);
  const maeAtributos = atributosDosPais(rng);
  return {
    paiNome: pick(rng, NOMES_PAI),
    maeNome: pick(rng, NOMES_MAE),
    paiAtributos,
    maeAtributos,
    marca,
    reacao,
    motivoTragedia: marca === 'tragedia' ? pick(rng, MOTIVOS_TRAGEDIA) : undefined,
    irmaos: nextFloat(rng) < 0.3 ? 1 : 0,
  };
}

// Puxa os atributos que o jogador escolheu no point-buy um pouco na direção
// da herança genética dos pais, aplica o bônus/penalidade da marca e a
// ênfase da reação — sem apagar a escolha original, só dando peso à
// linhagem e a como a infância formou o personagem. Formato de herança vem
// do documento de dinastia (seção 2): peso de cada pai flutua entre 40% e
// 60% por atributo (em vez de uma média fixa 50/50), com uma mutação de ±5%
// por cima — dá mais variação de família pra família do que uma média
// simples faria.
export function aplicarHeranca(rng: RngState, atributos: Atributos, genese: GeneseResultado): Atributos {
  const out = { ...atributos };
  const atributoReacao = ATRIBUTO_DA_REACAO[genese.reacao];
  for (const k of ATTR_KEYS) {
    const pesoPai = 0.4 + nextFloat(rng) * 0.2; // 40%–60%
    const basePais = genese.paiAtributos[k] * pesoPai + genese.maeAtributos[k] * (1 - pesoPai);
    const mutacao = 1 + (nextFloat(rng) - 0.5) * 0.1; // ±5%
    const heranca = basePais * mutacao;
    const puxao = (heranca - 10) * 0.2;
    const bonusMarca = genese.marca === 'genio' ? 1 : genese.marca === 'indigno' ? -1 : 0;
    const bonusReacao = k === atributoReacao ? 1 : 0;
    out[k] = Math.round(out[k] + puxao + bonusMarca + bonusReacao);
  }
  return out;
}

const SUFIXO_REACAO: Record<ReacaoInfancia, string> = {
  sozinho: ' Não teve com quem dividir, então aprendeu a não precisar.',
  apoio: ' Encontrou quem ficasse por perto, e nunca esqueceu quem foi.',
  entendimento: ' Passou a infância perguntando por quê, mais do que aceitando o que davam.',
};

// O fato que abre a campanha, antes de qualquer cena de local — o narrador
// (IA ou canônico local) recebe isso como o primeiro parágrafo da história.
export function fatoDeAbertura(genese: GeneseResultado, nomeJogador: string): string {
  const sufixo = SUFIXO_REACAO[genese.reacao];
  if (genese.marca === 'tragedia') {
    const irmao = genese.irmaos > 0 ? ' Um irmão mais novo sobrou para criar.' : ' Ninguém mais sobrou.';
    return `${nomeJogador} cresceu sem ${genese.paiNome} e sem ${genese.maeNome} — ${genese.motivoTragedia}.${irmao}${sufixo}`;
  }
  if (genese.marca === 'genio') {
    return `${nomeJogador} cresceu sob o teto de ${genese.paiNome} e ${genese.maeNome} — e desde cedo ficou claro que aprendia rápido demais para a idade.${sufixo}`;
  }
  if (genese.marca === 'indigno') {
    return `${nomeJogador} cresceu sob o teto de ${genese.paiNome} e ${genese.maeNome}, que nunca esperaram muito: o corpo sempre foi devagar para aprender o que se pedia dele.${sufixo}`;
  }
  return `${nomeJogador} cresceu sob o teto de ${genese.paiNome} e ${genese.maeNome}, sem nada de extraordinário, só o que qualquer infância nas salinas cobra.${sufixo}`;
}

// Carta de memória de infância (documento de dinastia, seção 5 — recortado:
// sem calendário de treino turno a turno, só o resultado emocional que a
// escolha do jogador já decidiu). Uma carta por campanha, com um punhado de
// usos: o jogador escolhe jogá-la antes de um teste (engine/turn.ts) para
// um bônus de circunstância pontual, não permanente.
export function cartaDeInfancia(genese: GeneseResultado): CartaMemoria {
  const reacaoTxt = REACOES_INFANCIA.find((r) => r.id === genese.reacao)!.descricao;
  if (genese.marca === 'tragedia') {
    return {
      id: `trauma_perda_${genese.reacao}`,
      titulo: 'O que sobrou depois',
      tipo: 'trauma',
      descricao: `Você já perdeu tudo uma vez e continuou de pé — isso ainda pesa, mas também endurece. ${reacaoTxt}`,
      bonusCircunstancia: 2,
      usosRestantes: 3,
    };
  }
  if (genese.marca === 'genio') {
    return {
      id: `vitoria_precocidade_${genese.reacao}`,
      titulo: 'Sempre um passo à frente',
      tipo: 'vitoria',
      descricao: `Desde criança, você entendia as coisas antes de precisarem ser explicadas. ${reacaoTxt}`,
      bonusCircunstancia: 2,
      usosRestantes: 3,
    };
  }
  if (genese.marca === 'indigno') {
    return {
      id: `vitoria_teimosia_${genese.reacao}`,
      titulo: 'Aprendeu na marra',
      tipo: 'vitoria',
      descricao: `Ninguém esperava muito de você — então cada vitória custou o dobro, e valeu o dobro. ${reacaoTxt}`,
      bonusCircunstancia: 2,
      usosRestantes: 3,
    };
  }
  return {
    id: `vitoria_infancia_comum_${genese.reacao}`,
    titulo: 'Uma infância qualquer',
    tipo: 'vitoria',
    descricao: `Nada de extraordinário — só a firmeza de quem cresceu sabendo o que esperar do dia seguinte. ${reacaoTxt}`,
    bonusCircunstancia: 1,
    usosRestantes: 3,
  };
}
