// ARCANUM · Treinamentos Imersivos de Vaelhorn
// Katas dos Cinco Elementos de Miyamoto Musashi (Gorin no Sho),
// Calejamento Marcial de Palma de Ferro e Meditação sob Cascatas Glaciais.
//
// Sessão 54: este módulo existia desde a sessão 45 e nenhuma tela o chamava —
// só o teste. E ainda bem: do jeito que estava, cada kata dava +1 permanente
// num atributo por 4 de vigor, sem limite, e a cascata dava +1 de Resiliência
// E devolvia todo o vigor. Katas e cascata em sequência eram atributo infinito,
// e passavam por cima da aptidão, da maestria e do teto humano que a curva de
// poder levou três sessões para acertar.
//
// Ligado agora, com as regras de treino do resto do jogo:
// - cada treino acontece onde o mestre está: Musashi no Passo do Lobo (katas e
//   duas espadas), Bai Long no Mosteiro Alto (palma de ferro e cascata);
// - uma vez por semana por modalidade, custa vigor e três períodos;
// - o ganho vai pela maestria (treinar em aptidao.ts, com o mestre presente
//   como fator), não por atributo solto;
// - a perícia sobe só até o nível de quem aprendeu com mestre (3); depois
//   disso, só o uso ensina;
// - técnica nova não sai do treino: quem ensina é o mestre, no mesmo lugar
//   (aprenderArte), com o nível exigido.
import type { Campaign, ContentBundle, TipoTreinoImersivo } from './types';
import { clampRecursos } from './character';
import { treinar } from './aptidao';

export type ElementoMusashi = 'terra' | 'agua' | 'fogo' | 'vento' | 'vazio';
export type ModalidadeTreino = 'katas' | 'palma_ferro' | 'cascata' | 'niten';

export type ResultadoTreinoImersivo = {
  ok: boolean;
  tipo: TipoTreinoImersivo | string;
  mensagem: string;
  atributosGanhos?: Record<string, number>;
  artesDesbloqueadas?: string[];
};

/** Onde cada treino acontece: onde o mestre ensina (content/vaelhorn/book.ts). */
export const LOCAL_TREINO: Record<ModalidadeTreino, string> = {
  katas: 'passo_lobo',
  niten: 'passo_lobo',
  palma_ferro: 'mosteiro_alto',
  cascata: 'mosteiro_alto',
};
export const NOME_TREINO: Record<ModalidadeTreino, string> = {
  katas: 'Katas dos Cinco Elementos',
  niten: 'Duas espadas (Niten)',
  palma_ferro: 'Calejamento da palma de ferro',
  cascata: 'Meditação sob a cascata',
};
export const DIAS_ENTRE_TREINOS = 7;
export const PERIODOS_DE_TREINO = 3;
/** Até onde o treino com mestre leva uma perícia. Depois, só o uso ensina. */
export const TETO_PERICIA_TREINO = 3;
const VIGOR: Record<ModalidadeTreino, number> = { katas: 4, niten: 4, palma_ferro: 3, cascata: 0 };

const chave = (m: ModalidadeTreino) => `treino.${m}`;

/** O treino pode acontecer aqui e agora? */
export function podeTreinarImersivo(camp: Campaign, modalidade: ModalidadeTreino): { pode: boolean; motivo?: string } {
  if (camp.localAtual !== LOCAL_TREINO[modalidade]) return { pode: false, motivo: 'Este treino só acontece onde o mestre ensina.' };
  const ultimo = camp.flags[chave(modalidade)];
  if (typeof ultimo === 'number' && camp.calendario.dia - ultimo < DIAS_ENTRE_TREINOS) {
    const faltam = DIAS_ENTRE_TREINOS - (camp.calendario.dia - ultimo);
    return { pode: false, motivo: `O corpo ainda não absorveu o último treino. Volte em ${faltam} ${faltam === 1 ? 'dia' : 'dias'}.` };
  }
  if ((camp.personagem.recursos.vigor ?? 0) < VIGOR[modalidade]) return { pode: false, motivo: 'Vigor insuficiente para a disciplina do treino.' };
  return { pode: true };
}

function subirPericia(camp: Campaign, pericia: string): boolean {
  const p = camp.personagem;
  if ((p.pericias[pericia] ?? 0) >= TETO_PERICIA_TREINO) return false;
  p.pericias[pericia] = (p.pericias[pericia] ?? 0) + 1;
  return true;
}

function registrar(camp: Campaign, modalidade: ModalidadeTreino, mensagem: string): void {
  camp.flags[chave(modalidade)] = camp.calendario.dia;
  clampRecursos(camp.personagem);
  camp.cronica.push({ turno: camp.turno, texto: mensagem, tipo: 'sistema' });
}

const PERICIA_DO_ELEMENTO: Record<ElementoMusashi, string | undefined> = {
  terra: 'atletismo', agua: 'perceber', fogo: 'intimidar', vento: 'rastrear', vazio: undefined,
};
const TEXTO_DO_ELEMENTO: Record<ElementoMusashi, string> = {
  terra: 'Você repete os passos do Livro da Terra até os pés pararem de pensar. A guarda fica baixa e firme como pedra de muro.',
  agua: 'No Livro da Água a lâmina não tem forma própria: toma a do golpe que vem. Você erra muito, e no fim da tarde erra menos.',
  fogo: 'O Livro do Fogo é o ritmo: a calma antes, a explosão depois, e o outro sem tempo de respirar entre as duas.',
  vento: 'O Livro do Vento ensina as outras escolas para mostrar onde elas quebram. Musashi imita três estilos e desmonta os três.',
  vazio: 'Diante do Livro do Vazio, Musashi manda sentar e não fazer nada. É o treino mais difícil do dia.',
};

/**
 * Katas dos Cinco Elementos (Gorin no Sho), com Musashi no Passo do Lobo.
 * `content` é opcional só para compatibilidade com chamadas antigas; sem ele
 * o treino não passa pela maestria.
 */
export function treinarKatasCincoElementos(camp: Campaign, elemento: ElementoMusashi, content?: ContentBundle): ResultadoTreinoImersivo {
  const pode = podeTreinarImersivo(camp, 'katas');
  if (!pode.pode) return { ok: false, tipo: 'katas_cinco_elementos', mensagem: pode.motivo! };
  const p = camp.personagem;
  p.recursos.vigor -= VIGOR.katas;
  if (content) treinar(content, camp, 'espada', { mestre: 0.85, esforco: 0.9, recursos: 0.6 });
  const pericia = PERICIA_DO_ELEMENTO[elemento];
  const subiu = pericia ? subirPericia(camp, pericia) : false;
  if (elemento === 'vazio') p.pressoes.sanidade = Math.max(0, (p.pressoes.sanidade ?? 0) - 5);
  const mensagem = `${TEXTO_DO_ELEMENTO[elemento]}${subiu ? ' Você sai dali mais seguro do que entrou.' : ''}${elemento === 'vazio' ? ' A cabeça sai mais quieta.' : ''}`;
  registrar(camp, 'katas', mensagem);
  return { ok: true, tipo: 'katas_cinco_elementos', mensagem, artesDesbloqueadas: [] };
}

/** Calejamento das mãos com Bai Long, no Mosteiro Alto. */
export function treinarCalejamentoPalmaDeFerro(camp: Campaign, content?: ContentBundle): ResultadoTreinoImersivo {
  const pode = podeTreinarImersivo(camp, 'palma_ferro');
  if (!pode.pode) return { ok: false, tipo: 'calejamento_palma_ferro', mensagem: pode.motivo! };
  camp.personagem.recursos.vigor -= VIGOR.palma_ferro;
  if (content) treinar(content, camp, 'espada', { mestre: 0.8, esforco: 0.95, recursos: 0.5 });
  const subiu = subirPericia(camp, 'atletismo');
  const mensagem = `Bai Long põe você para bater em tonéis de cascalho até a pele abrir, e depois de novo, com a pele aberta. Na volta, as mãos doem de um jeito que parece progresso.${subiu ? ' O corpo aguenta mais do que aguentava de manhã.' : ''}`;
  registrar(camp, 'palma_ferro', mensagem);
  return { ok: true, tipo: 'calejamento_palma_ferro', mensagem, artesDesbloqueadas: [] };
}

/** Pressões que a cascata alivia (não zera: a água lava, não apaga). */
export const ALIVIO_DA_CASCATA = 10;

/** Meditação sob a cascata do Mosteiro Alto: descanso da cabeça, não do nível. */
export function meditarSobCascata(camp: Campaign): ResultadoTreinoImersivo {
  const pode = podeTreinarImersivo(camp, 'cascata');
  if (!pode.pode) return { ok: false, tipo: 'meditacao_sob_cascata', mensagem: pode.motivo! };
  const p = camp.personagem;
  for (const k of Object.keys(p.pressoes)) p.pressoes[k] = Math.max(0, (p.pressoes[k] ?? 0) - ALIVIO_DA_CASCATA);
  p.recursos.vigor = p.recursosMax.vigor ?? p.recursos.vigor;
  const mensagem = 'Você senta na pedra debaixo da água gelada até não sentir mais os ombros. Quando sai, o barulho que carregava na cabeça ficou lá embaixo, e o fôlego voltou inteiro.';
  registrar(camp, 'cascata', mensagem);
  return { ok: true, tipo: 'meditacao_sob_cascata', mensagem };
}

/** Duas espadas (Niten Ichi-ryu) com Musashi, no Passo do Lobo. */
export function treinarEsgrimaNiten(camp: Campaign, content?: ContentBundle): ResultadoTreinoImersivo {
  const pode = podeTreinarImersivo(camp, 'niten');
  if (!pode.pode) return { ok: false, tipo: 'esgrima_duas_espadas_niten', mensagem: pode.motivo! };
  camp.personagem.recursos.vigor -= VIGOR.niten;
  if (content) treinar(content, camp, 'espada', { mestre: 0.9, esforco: 0.9, recursos: 0.6 });
  const subiu = [subirPericia(camp, 'atletismo'), subirPericia(camp, 'perceber')].some(Boolean);
  const mensagem = `Uma lâmina longa numa mão, uma curta na outra, e Musashi batendo nas duas com um galho seco. Uma apara, a outra corta — quando você lembra de não pensar nisso.${subiu ? ' Os pulsos aprendem alguma coisa que a cabeça ainda não sabe dizer.' : ''}`;
  registrar(camp, 'niten', mensagem);
  return { ok: true, tipo: 'esgrima_duas_espadas_niten', mensagem, artesDesbloqueadas: [] };
}

/** Os treinos que fazem sentido no lugar onde o jogador está. */
export function treinosAqui(camp: Campaign): ModalidadeTreino[] {
  return (Object.keys(LOCAL_TREINO) as ModalidadeTreino[]).filter(m => LOCAL_TREINO[m] === camp.localAtual);
}
