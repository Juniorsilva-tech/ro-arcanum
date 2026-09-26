// ARCANUM · Sistema Canônico de Lâminas Nichirin (Kimetsu no Yaiba)
// O Aço Escarlate (areia de ferro escarlate e minério escarlate) absorve a luz solar
// dos picos mais altos do mundo. Ao ser empunhada com firmeza e respiração verdadeira
// pela primeira vez, a lâmina reage à alma, aos atributos e ao estilo do caçador,
// mudando de cor de forma definitiva e revelando sua afinidade espiritual.

import type { Campaign, ContentBundle, Item, Personagem } from './types';
import { registrarMarco } from './memoria';
import { registrarFato } from './historiaViva';
import { temMarca } from './marca';

export type CorNichirinId =
  | 'preta'
  | 'azul'
  | 'vermelha'
  | 'amarela'
  | 'verde'
  | 'cinza'
  | 'branca'
  | 'lavanda'
  | 'rosa'
  | 'indigo';

export type InfoCorNichirin = {
  id: CorNichirinId;
  nome: string;
  estiloAfinidade: string;
  corHex: string;
  descricaoLore: string;
  efeitoResumo: string;
  bonusCombate: {
    danoOniExtra?: number; // percentual extra contra onis
    danoBaseExtra?: number; // dano plano
    defesaExtra?: number; // defesa adicional ao guardar
    regeneraVigor?: number; // vigor por acerto
    criticoExtra?: number; // chance crítica extra
    penetracaoGuarda?: boolean; // quebra guarda/ignora armadura
    reducaoDano?: number; // redução de dano sofrido
    evasaoExtra?: number; // bônus de esquiva
  };
};

export const CATALAGO_CORES_NICHIRIN: Record<CorNichirinId, InfoCorNichirin> = {
  preta: {
    id: 'preta',
    nome: 'Negra Obsidiana',
    estiloAfinidade: 'Respiração do Sol (Hinokami)',
    corHex: '#18181b',
    descricaoLore:
      'A cor mais rara de todas. Por muito tempo os caçadores a tiveram por sinal de má sorte, de espadachim sem destino claro: poucos portadores viviam o bastante para que alguém entendesse o padrão. A verdade é que a lâmina negra tem afinidade com a Respiração do Sol, a matriz de que todas as outras derivam.',
    efeitoResumo: '+15% de dano contra Onis e chamas solares perpétuas no corte.',
    bonusCombate: {
      danoOniExtra: 0.15,
      danoBaseExtra: 2,
    },
  },
  azul: {
    id: 'azul',
    nome: 'Azul Oceânico',
    estiloAfinidade: 'Respiração da Água',
    corHex: '#0284c7',
    descricaoLore:
      'A cor da serenidade imperturbável e da maleabilidade que contorna qualquer obstáculo. A água não colide de frente; ela flui, desvia o golpe violento e desgasta a rocha mais sólida.',
    efeitoResumo: '+2 de Defesa ao erguer guarda e restaura 1 de Vigor a cada golpe certeiro.',
    bonusCombate: {
      defesaExtra: 2,
      regeneraVigor: 1,
    },
  },
  vermelha: {
    id: 'vermelha',
    nome: 'Vermelha Carmesim',
    estiloAfinidade: 'Respiração das Chamas',
    corHex: '#dc2626',
    descricaoLore:
      'A cor da paixão fervorosa e da determinação incandescente. O aço queima na mão do espadachim como forja viva, purgando as trevas e consumindo a regeneração das feras.',
    efeitoResumo: '+3 de dano base direto e queima constante da carne do inimigo.',
    bonusCombate: {
      danoBaseExtra: 3,
    },
  },
  amarela: {
    id: 'amarela',
    nome: 'Amarela Dourada',
    estiloAfinidade: 'Respiração do Trovão',
    corHex: '#eab308',
    descricaoLore:
      'A cor do relâmpago que rasga o horizonte e da velocidade pura. O aço reluz com eletricidade estática sutil, desferindo golpes que acertam antes mesmo do eco do estrondo.',
    efeitoResumo: '+10% de chance de acerto crítico e reflexos relâmpago de reação.',
    bonusCombate: {
      criticoExtra: 0.10,
    },
  },
  verde: {
    id: 'verde',
    nome: 'Verde Esmeralda',
    estiloAfinidade: 'Respiração do Vento',
    corHex: '#16a34a',
    descricaoLore:
      'A cor do vendaval implacável e dos cortes tempestuosos. Como lufadas cortantes de ar comprimido, a lâmina não dá espaço para a recuperação do adversário.',
    efeitoResumo: 'Penetração de blindagem que ignora 25% da guarda e armadura.',
    bonusCombate: {
      penetracaoGuarda: true,
      danoBaseExtra: 1,
    },
  },
  cinza: {
    id: 'cinza',
    nome: 'Cinza Ardósia',
    estiloAfinidade: 'Respiração da Pedra',
    corHex: '#64748b',
    descricaoLore:
      'A cor da rocha milenar inamovível e da estabilidade absoluta do espírito. Nenhum golpe adversário é capaz de desequilibrar quem tem a solidez da montanha sob os pés.',
    efeitoResumo: 'Reduz todo dano recebido em 2 pontos adicionais.',
    bonusCombate: {
      reducaoDano: 2,
    },
  },
  branca: {
    id: 'branca',
    nome: 'Branco Enevoado',
    estiloAfinidade: 'Respiração da Névoa',
    corHex: '#e2e8f0',
    descricaoLore:
      'A cor dos passos velados e da calmaria ilusória. A lâmina parece desaparecer no ar entre um movimento e outro, tornando as defesas do oponente desorientadas.',
    efeitoResumo: '+3 em Evasão e anulação de ataques em flanco.',
    bonusCombate: {
      evasaoExtra: 3,
    },
  },
  lavanda: {
    id: 'lavanda',
    nome: 'Lavanda Púrpura',
    estiloAfinidade: 'Respiração do Inseto',
    corHex: '#a855f7',
    descricaoLore:
      'A cor da astúcia cirúrgica e da precisão letal. Forjada para perfurar os pontos mais vulneráveis do corpo com a velocidade de ferrões e a letalidade de extratos de glicínia.',
    efeitoResumo: 'Estocadas ignoram 3 pontos de armadura natural e prolongam venenos.',
    bonusCombate: {
      penetracaoGuarda: true,
      criticoExtra: 0.05,
    },
  },
  rosa: {
    id: 'rosa',
    nome: 'Rosa Carmim',
    estiloAfinidade: 'Respiração do Amor',
    corHex: '#ec4899',
    descricaoLore:
      'A cor da intensidade passional e da extrema maleabilidade marcial. A lâmina chicoteia em arcos rápidos que desorientam qualquer formação defensiva.',
    efeitoResumo: '+1 de dano, +5% crítico e fluidez corporal de combate.',
    bonusCombate: {
      danoBaseExtra: 1,
      criticoExtra: 0.05,
    },
  },
  indigo: {
    id: 'indigo',
    nome: 'Índigo Selvagem',
    estiloAfinidade: 'Respiração da Fera',
    corHex: '#4f46e5',
    descricaoLore:
      'A cor dos instintos selvagens primordiais e dos caninos que dilaceram presas. Corta com a agressividade indomável das montanhas.',
    efeitoResumo: '+2 de dano contra criaturas e chance de sangramento abrasivo.',
    bonusCombate: {
      danoBaseExtra: 2,
    },
  },
};

/**
 * A lâmina só muda de cor na mão de quem domina a Respiração de Concentração
 * Total: qualquer forma de respiração aprendida, ou o treino de quase-morte.
 */
export function dominaConcentracaoTotal(camp: Campaign): boolean {
  const p = camp.personagem;
  if ((p.artesConhecidas ?? []).some((a) => a.startsWith('respiracao_') || a.startsWith('hinokami'))) return true;
  return ((p as { treinoQuaseMorte?: { ciclosConcluidos?: number } }).treinoQuaseMorte?.ciclosConcluidos ?? 0) > 0;
}

/**
 * Determina qual cor de Nichirin sintoniza naturalmente com o personagem,
 * baseado em suas artes de combate aprendidas, linhagem e distribuição de atributos.
 */
export function determinarCorNichirin(camp: Campaign): CorNichirinId {
  const p = camp.personagem;
  const artes = p.artesConhecidas ?? [];

  // 1. Prioridade por Estilo de Respiração já dominado
  if (artes.includes('hinokami_kagura_danca')) return 'preta';
  if (artes.some((a) => a.includes('agua'))) return 'azul';
  if (artes.some((a) => a.includes('chama'))) return 'vermelha';
  if (artes.some((a) => a.includes('trovao'))) return 'amarela';
  if (artes.some((a) => a.includes('vento'))) return 'verde';
  if (artes.some((a) => a.includes('pedra'))) return 'cinza';
  if (artes.some((a) => a.includes('nevoa'))) return 'branca';
  if (artes.some((a) => a.includes('inseto'))) return 'lavanda';
  if (artes.some((a) => a.includes('amor'))) return 'rosa';
  if (artes.some((a) => a.includes('fera'))) return 'indigo';

  // 2. Destino Solar Inato: marca mística de caçador ou atributos de pico excepcionais
  if (temMarca(camp) && p.atributos.fisico >= 16 && (p.atributos.social ?? 10) >= 14) {
    return 'preta';
  }

  // 3. Predisposição inata por atributos mais desenvolvidos
  const { fisico, precisao, resiliencia, raciocinio, percepcao, social } = p.atributos;
  const maxVal = Math.max(fisico, precisao, resiliencia, raciocinio, percepcao, social);

  if (fisico === maxVal) {
    return fisico >= 16 ? 'vermelha' : 'cinza';
  }
  if (precisao === maxVal) {
    return 'amarela';
  }
  if (percepcao === maxVal) {
    return 'verde';
  }
  if (resiliencia === maxVal) {
    return 'cinza';
  }
  if (raciocinio === maxVal) {
    return raciocinio >= 16 ? 'branca' : 'lavanda';
  }
  if (social === maxVal) {
    return 'azul';
  }

  // Fallback canônico: a Respiração da Água é a mais comum entre caçadores iniciantes
  return 'azul';
}

/**
 * Verifica se um item é uma lâmina Nichirin e, se ainda não tiver cor desperta,
 * realiza a sintonização cromática permanente na posse do jogador.
 */
export function verificarDespertarNichirin(
  content: ContentBundle,
  camp: Campaign,
  item: Item
): { despertou: boolean; info?: InfoCorNichirin; mensagem?: string } {
  // Apenas armas de aço Nichirin (contra onis) passam pela sintonização
  const ehNichirin = item.contraOni || item.id === 'lamina_nichirin' || item.id.includes('nichirin') || item.id === 'lamina_da_origem_solar';
  if (!ehNichirin) {
    return { despertou: false };
  }

  // Se já possui cor de Nichirin definida, nada a fazer
  if (item.corNichirin) {
    return {
      despertou: false,
      info: CATALAGO_CORES_NICHIRIN[item.corNichirin],
    };
  }

  // O aço só reage a quem domina a Concentração Total; até lá, fica neutro.
  if (!dominaConcentracaoTotal(camp)) {
    return { despertou: false };
  }

  // Determina a cor sintonizada com a alma do caçador
  const corId = camp.personagem.corNichirinInata ?? determinarCorNichirin(camp);
  camp.personagem.corNichirinInata = corId;
  const info = CATALAGO_CORES_NICHIRIN[corId];

  // Cria uma instância única no inventário do personagem para preservar a cor desperta
  const forjados = camp.personagem.itensForjados ?? [];
  let n = forjados.length + 1;
  while (forjados.some((f) => f.id === `${item.id}_${corId}_${n}`)) n++;
  const instanciaId = `${item.id}_${corId}_${n}`;
  const itemDesperto: Item = {
    ...item,
    id: instanciaId,
    nome: `${item.nome} (${info.nome.split(' ')[0]} · ${info.estiloAfinidade.replace('Respiração d', '').replace('Respiração ', '').trim()})`,
    descricao: `${item.descricao} O aço escarlate sintonizou com seu espírito e adquiriu a tonalidade ${info.nome}. ${info.descricaoLore}`,
    corNichirin: corId,
    corNichirinNome: info.nome,
    corNichirinAfinidade: info.estiloAfinidade,
    // Aplica bônus de dano base se houver na afinidade
    dano: item.dano
      ? {
          ...item.dano,
          base: item.dano.base + (info.bonusCombate.danoBaseExtra ?? 0),
        }
      : undefined,
    bonusCritico: (item.bonusCritico ?? 0) + (info.bonusCombate.criticoExtra ?? 0),
  };

  // Registra no acervo de itens únicos do personagem
  camp.personagem.itensForjados = [...(camp.personagem.itensForjados ?? []), itemDesperto];

  // Transfere a posse no inventário
  const qtdAtual = camp.personagem.inventario[item.id] ?? 1;
  if (qtdAtual <= 1) {
    delete camp.personagem.inventario[item.id];
  } else {
    camp.personagem.inventario[item.id] = qtdAtual - 1;
  }
  camp.personagem.inventario[instanciaId] = (camp.personagem.inventario[instanciaId] ?? 0) + 1;

  // Atualiza se estiver equipada
  if (camp.personagem.equipado.arma === item.id) {
    camp.personagem.equipado.arma = instanciaId;
  }

  const mensagemNarrativa =
    `Ao empunhar a Nichirin pela primeira vez, o calor do minério escarlate aquece sua palma. ` +
    `Uma onda incandescente sobe da empunhadura até a ponta: o aço reconhece seu espírito e tinge-se de ${info.nome} (${info.estiloAfinidade})! ` +
    `[${info.efeitoResumo}]`;

  // Registra o marco lendário na história da campanha
  registrarMarco(camp, `Despertou a Lâmina Nichirin: ${info.nome} (${info.estiloAfinidade})`);
  if (camp.vivo) {
    registrarFato(camp, {
      tipo: 'despertar_nichirin',
      local: camp.localAtual,
      texto: `${camp.personagem.nome} empunhou uma Nichirin e a lâmina tingiu-se de ${info.nome}.`,
      atores: ['jogador'],
      publico: true,
    });
  }
  camp.flags['aviso.despertar_nichirin'] = mensagemNarrativa;

  return {
    despertou: true,
    info,
    mensagem: mensagemNarrativa,
  };
}
