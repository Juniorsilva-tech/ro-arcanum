// ARCANUM · Trabalhos do lugar (sessão 54).
//
// Os quatro trabalhos especializados existiam desde a sessão 45 como ação de
// mundo sem tela, e sem lugar: "turno na Fenda de Corveira" pagava 24 moedas,
// dois minérios e um ponto de Atletismo a quem estivesse na taverna de Halvet,
// quantas vezes quisesse — dinheiro do nada e perícia infinita.
//
// Agora cada um acontece na cidade do ofício, paga do tesouro da comunidade
// (como o trabalho comum), uma vez por dia, e a perícia só sobe até o nível
// de quem aprendeu fazendo (3). A caçada por contrato exige ter completado ao
// menos um contrato de monstro: é o que faz a guilda confiar o serviço.
import type { Campaign, ContentBundle } from './types';
import { cidadeIdDoLocal } from './historiaViva';

export type TrabalhoEspecializadoId =
  | 'extracao_fenda_corveira'
  | 'estiva_docas_mareu'
  | 'patrulha_muralha_tessel'
  | 'cacada_contrato_witcher';

export type TrabalhoEspecializado = {
  nome: string;
  /** Lugares onde o trabalho existe. */
  locais: string[];
  renda: number;
  periodos: number;
  pericia: string;
  texto: string;
  minerio?: number;
  exigeTrofeu?: boolean;
};

export const TETO_PERICIA_TRABALHO = 3;

export const TRABALHOS_ESPECIALIZADOS: Record<TrabalhoEspecializadoId, TrabalhoEspecializado> = {
  extracao_fenda_corveira: {
    nome: 'Turno na galeria funda',
    locais: ['corveira', 'mina_corveira'],
    renda: 24, periodos: 3, pericia: 'atletismo', minerio: 2,
    texto: 'Você desce com a turma das Verrão e passa o turno quebrando veio no escuro, com o chão tremendo de leve a cada martelada lá de cima. Sobe coberto de pó preto, com dois blocos de minério e o pagamento contado na casa das balanças.',
  },
  estiva_docas_mareu: {
    nome: 'Estiva no cais',
    locais: ['mareu', 'porto_sal', 'mercado_peixe'],
    renda: 18, periodos: 2, pericia: 'atletismo',
    texto: 'Sacos de sal, caixas de peixe, cordame molhado. A contramestra grita os números e você carrega até os ombros pararem de reclamar. Pagam na saída, em moeda da guilda.',
  },
  patrulha_muralha_tessel: {
    nome: 'Guarda na muralha',
    locais: ['tessel', 'forte_agulha'],
    renda: 22, periodos: 3, pericia: 'perceber',
    texto: 'Um turno inteiro na muralha, olhando a estrada do sul até os olhos arderem de vento. Nada acontece, e na fronteira isso é o serviço bem feito. A guarnição paga no fim da ronda.',
  },
  cacada_contrato_witcher: {
    nome: 'Caçada pelo quadro de contratos',
    locais: ['taverna', 'mercado'],
    renda: 45, periodos: 3, pericia: 'rastrear', exigeTrofeu: true,
    texto: 'Pelo quadro da taverna, alguém paga para limpar um ninho menor na beira da estrada. Com um troféu de contrato no cinto, ninguém discute o preço. Você volta antes do anoitecer, com a prova e sem arranhão que valha contar.',
  },
};

const chave = (id: string) => `trabalho.${id}`;

/** Os trabalhos que existem no lugar onde o jogador está. */
export function trabalhosAqui(camp: Campaign): TrabalhoEspecializadoId[] {
  return (Object.keys(TRABALHOS_ESPECIALIZADOS) as TrabalhoEspecializadoId[])
    .filter(id => TRABALHOS_ESPECIALIZADOS[id].locais.includes(camp.localAtual));
}

export function podeTrabalhoEspecializado(content: ContentBundle, camp: Campaign, id: TrabalhoEspecializadoId): { pode: boolean; motivo?: string } {
  const t = TRABALHOS_ESPECIALIZADOS[id];
  if (!t) return { pode: false, motivo: 'Trabalho desconhecido.' };
  if (!t.locais.includes(camp.localAtual)) return { pode: false, motivo: 'Esse trabalho não existe aqui.' };
  if (camp.flags[chave(id)] === camp.calendario.dia) return { pode: false, motivo: 'Você já fez esse turno hoje.' };
  if (t.exigeTrofeu && !(camp.contratosMonstro?.trofeus.length)) return { pode: false, motivo: 'A guilda só confia caçada a quem já cumpriu um contrato de monstro.' };
  const cidade = cidadeIdDoLocal(content, camp, camp.localAtual);
  const c = cidade ? camp.vivo?.cidades[cidade] : undefined;
  if (!c || c.tesouro < t.renda || (camp.continuidade?.locais[cidade!]?.populacao ?? 0) === 0) return { pode: false, motivo: 'Hoje não há quem pague por esse serviço.' };
  return { pode: true };
}

/** Faz o turno: paga, dá o minério da galeria, talvez ensina. Não avança o tempo (quem chama avança). */
export function fazerTrabalhoEspecializado(content: ContentBundle, camp: Campaign, id: TrabalhoEspecializadoId): { ok: boolean; texto: string; periodos: number } {
  const pode = podeTrabalhoEspecializado(content, camp, id);
  const t = TRABALHOS_ESPECIALIZADOS[id];
  if (!pode.pode) return { ok: false, texto: pode.motivo!, periodos: 0 };
  const p = camp.personagem;
  const cidade = cidadeIdDoLocal(content, camp, camp.localAtual)!;
  camp.vivo!.cidades[cidade].tesouro -= t.renda;
  p.dinheiro += t.renda;
  if (t.minerio) p.inventario.minerio_de_ferro = (p.inventario.minerio_de_ferro ?? 0) + t.minerio;
  let aprendeu = false;
  if ((p.pericias[t.pericia] ?? 0) < TETO_PERICIA_TRABALHO) { p.pericias[t.pericia] = (p.pericias[t.pericia] ?? 0) + 1; aprendeu = true; }
  camp.flags[chave(id)] = camp.calendario.dia;
  return { ok: true, periodos: t.periodos, texto: `${t.texto} (+${t.renda} moedas${t.minerio ? `, +${t.minerio} minérios` : ''}${aprendeu ? ', e o corpo aprende o ofício' : ''}.)` };
}
