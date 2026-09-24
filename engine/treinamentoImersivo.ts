// ARCANUM · Treinamentos Imersivos de Vaelhorn
// Katas dos Cinco Elementos de Miyamoto Musashi (Gorin no Sho),
// Calejamento Marcial de Palma de Ferro e Meditação sob Cascatas Glaciais.
import type { Campaign, TipoTreinoImersivo } from './types';
import { clampRecursos, modificador } from './character';
import { nextFloat } from './rng';

export type ElementoMusashi = 'terra' | 'agua' | 'fogo' | 'vento' | 'vazio';

export type ResultadoTreinoImersivo = {
  ok: boolean;
  tipo: TipoTreinoImersivo | string;
  mensagem: string;
  atributosGanhos?: Record<string, number>;
  artesDesbloqueadas?: string[];
};

/**
 * Treinamento dos Cinco Elementos do Livro dos Cinco Anéis (Gorin no Sho) de Miyamoto Musashi.
 * Cada elemento desenvolve um aspecto holístico do guerreiro:
 * - Terra: Estabilidade física e base firme.
 * - Água: Fluidez e adaptação maleável ao corte inimigo.
 * - Fogo: Calor ofensivo e domínio do ritmo de combate.
 * - Vento: Compreensão das falhas e posturas das escolas rivais.
 * - Vazio: Transcendência mental que alcança o Sukitōru Sekai (Mundo Transparente).
 */
export function treinarKatasCincoElementos(
  camp: Campaign,
  elemento: ElementoMusashi,
): ResultadoTreinoImersivo {
  const p = camp.personagem;
  const custoVigor = 4;
  if ((p.recursos.vigor ?? 0) < custoVigor) {
    return { ok: false, tipo: 'katas_cinco_elementos', mensagem: 'Vigor insuficiente para suportar a disciplina estrita dos katas.' };
  }

  p.recursos.vigor -= custoVigor;

  let mensagem = '';
  const artesDesbloqueadas: string[] = [];

  switch (elemento) {
    case 'terra': {
      p.atributos.fisico = (p.atributos.fisico ?? 10) + 1;
      p.pericias.atletismo = (p.pericias.atletismo ?? 0) + 1;
      mensagem =
        'Você pratica os passos fundamentais do Livro da Terra. Seus pés criam raízes no solo rochoso de Vaelhorn; sua guarda torna-se sólida como uma montanha (+1 Físico, +1 Atletismo).';
      break;
    }
    case 'agua': {
      p.atributos.precisao = (p.atributos.precisao ?? 10) + 1;
      p.pericias.perceber = (p.pericias.perceber ?? 0) + 1;
      mensagem =
        'Seguindo o Livro da Água, sua lâmina move-se límpida e informe. Você aprende a desviar a fúria adversária com o menor toque de aço (+1 Precisão, +1 Perceber).';
      break;
    }
    case 'fogo': {
      p.atributos.fisico = (p.atributos.fisico ?? 10) + 1;
      p.pericias.intimidar = (p.pericias.intimidar ?? 0) + 1;
      mensagem =
        'Sob o Livro do Fogo, você treina a transição explosiva da calmaria para o golpe mortal, ditando o ritmo do combate antes do rival respirar (+1 Físico, +1 Intimidar).';
      break;
    }
    case 'vento': {
      p.atributos.percepcao = (p.atributos.percepcao ?? 10) + 1;
      p.pericias.rastrear = (p.pericias.rastrear ?? 0) + 1;
      if (!p.artesConhecidas.includes('corte_cruzado_niten')) {
        p.artesConhecidas.push('corte_cruzado_niten');
        artesDesbloqueadas.push('corte_cruzado_niten');
      }
      mensagem =
        'O Livro do Vento revela as fraquezas de todas as escolas convencionais de esgrima. Você domina os ângulos cruzados de Musashi (+1 Percepção, técnica Niten Ichi-ryu dominada!).';
      break;
    }
    case 'vazio': {
      const prec = p.atributos.precisao ?? 10;
      const perc = p.atributos.percepcao ?? 10;
      if (prec >= 14 && perc >= 14) {
        if (!p.artesConhecidas.includes('mundo_transparente')) {
          p.artesConhecidas.push('mundo_transparente');
          artesDesbloqueadas.push('mundo_transparente');
        }
        if (!p.artesConhecidas.includes('postura_do_vazio')) {
          p.artesConhecidas.push('postura_do_vazio');
          artesDesbloqueadas.push('postura_do_vazio');
        }
        mensagem =
          'O Livro do Vazio (Ku no Maki): você dissipa a intenção egoica e o ruído dos pensamentos. Seus olhos alcançam a Visão do Mundo Transparente (Sukitōru Sekai)! As fraquezas internas de qualquer carne tornam-se visíveis.';
      } else {
        p.atributos.percepcao = (p.atributos.percepcao ?? 10) + 1;
        mensagem =
          'Você medita diante do abismo do Vazio. Sua percepção se expande, embora a Visão do Mundo Transparente ainda exija Precisão e Percepção superiores (+1 Percepção).';
      }
      break;
    }
  }

  clampRecursos(p);
  camp.cronica.push({ turno: camp.turno, texto: mensagem, tipo: 'sistema' });
  return { ok: true, tipo: 'katas_cinco_elementos', mensagem, artesDesbloqueadas };
}

/**
 * Calejamento de Palma de Ferro e Condicionamento Marcial Desarmado.
 * O guerreiro golpeia tonéis com cascalho de ferro e fardos de casca de carvalho,
 * densificando os ossos das mãos e os nós dos dedos.
 */
export function treinarCalejamentoPalmaDeFerro(camp: Campaign): ResultadoTreinoImersivo {
  const p = camp.personagem;
  const custoVigor = 3;
  if ((p.recursos.vigor ?? 0) < custoVigor) {
    return { ok: false, tipo: 'calejamento_palma_ferro', mensagem: 'Vigor insuficiente para o impacto brutal do calejamento.' };
  }

  p.recursos.vigor -= custoVigor;
  p.pericias.atletismo = (p.pericias.atletismo ?? 0) + 1;

  const artesDesbloqueadas: string[] = [];
  if (!p.artesConhecidas.includes('palma_de_ferro')) {
    p.artesConhecidas.push('palma_de_ferro');
    artesDesbloqueadas.push('palma_de_ferro');
  }

  const fis = p.atributos.fisico ?? 10;
  if (fis >= 14 && !p.artesConhecidas.includes('partir_espada')) {
    p.artesConhecidas.push('partir_espada');
    artesDesbloqueadas.push('partir_espada');
  }

  const bonusFis = nextFloat(camp.rng) < 0.4;
  if (bonusFis) {
    p.atributos.fisico = (p.atributos.fisico ?? 10) + 1;
  }

  clampRecursos(p);
  const msg = `Você submete as mãos e punhos ao impacto implacável da areia de ferro e granito. A pele torna-se áspera e os ossos hiperdensos. Suas palmas adquirem o peso de martelos de guerra (+1 Atletismo${bonusFis ? ', +1 Físico' : ''}${artesDesbloqueadas.length ? `, técnicas desbloqueadas: ${artesDesbloqueadas.join(', ')}` : ''}).`;
  camp.cronica.push({ turno: camp.turno, texto: msg, tipo: 'sistema' });

  return { ok: true, tipo: 'calejamento_palma_ferro', mensagem: msg, artesDesbloqueadas };
}

/**
 * Meditação sob as Cascatas Glaciais de Vaelhorn.
 * A água gélida caindo de dezenas de metros fustiga os ombros e a mente,
 * lavando tensões, restaurando a sanidade e purificando qualquer corrupção.
 */
export function meditarSobCascata(camp: Campaign): ResultadoTreinoImersivo {
  const p = camp.personagem;

  // Reduz tensões e corrupção acumuladas
  for (const k of Object.keys(p.pressoes)) {
    p.pressoes[k] = Math.max(0, (p.pressoes[k] ?? 0) - 15);
  }

  // Restaura vigor e revigora a respiração
  p.recursos.vigor = p.recursosMax.vigor ?? 15;
  p.atributos.resiliencia = (p.atributos.resiliencia ?? 10) + 1;

  clampRecursos(p);
  const msg =
    'Sentado em lótus sobre a rocha submersa na torrente gélida, você suporta o peso ensurdecedor da cascata. A mente esvazia-se de dúvidas e cansaço; o corpo purifica as toxinas e o vigor retorna em sua totalidade (+1 Resiliência, -15 em todas as Pressões e Vigor restaurado).';
  camp.cronica.push({ turno: camp.turno, texto: msg, tipo: 'sistema' });

  return { ok: true, tipo: 'meditacao_sob_cascata', mensagem: msg };
}

/**
 * Treinamento de Esgrima Niten Ichi-ryu (Duas Espadas de Musashi).
 * Prática intensa empunhando uma espada longa em conjunto com lâmina curta,
 * quebrando o ritmo previsível de qualquer duelista de estilo clássico.
 */
export function treinarEsgrimaNiten(camp: Campaign): ResultadoTreinoImersivo {
  const p = camp.personagem;
  const custoVigor = 4;
  if ((p.recursos.vigor ?? 0) < custoVigor) {
    return { ok: false, tipo: 'esgrima_duas_espadas_niten', mensagem: 'Vigor insuficiente para o treino de duas espadas.' };
  }

  p.recursos.vigor -= custoVigor;
  p.pericias.atletismo = (p.pericias.atletismo ?? 0) + 1;
  p.pericias.perceber = (p.pericias.perceber ?? 0) + 1;

  const artesDesbloqueadas: string[] = [];
  if (!p.artesConhecidas.includes('corte_cruzado_niten')) {
    p.artesConhecidas.push('corte_cruzado_niten');
    artesDesbloqueadas.push('corte_cruzado_niten');
  }

  clampRecursos(p);
  const msg =
    'Você maneja a lâmina pesada e a lâmina curta em sincronia assimétrica: uma apara enquanto a outra ceifa. O ritmo quebrado de Musashi torna-se natural aos seus pulsos (+1 Atletismo, +1 Perceber, Estilo Duplo Niten afiado).';
  camp.cronica.push({ turno: camp.turno, texto: msg, tipo: 'sistema' });

  return { ok: true, tipo: 'esgrima_duas_espadas_niten', mensagem: msg, artesDesbloqueadas };
}
