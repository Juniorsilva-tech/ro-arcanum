// ARCANUM · Tipos centrais do domínio. A engine é dona da verdade (GDD §0.1).
import type { PerfilDano, Grau } from './resolution';
import type { Periodo, Estacao, CalendarioState } from './time';
import type { RngState } from './rng';

// ── As seis posições de atributo. Mecânica fixa; o NOME vem do cenário (GDD §3.1).
export type AttrKey =
  | 'fisico'
  | 'precisao'
  | 'resiliencia'
  | 'raciocinio'
  | 'percepcao'
  | 'social';

export const ATTR_KEYS: AttrKey[] = [
  'fisico',
  'precisao',
  'resiliencia',
  'raciocinio',
  'percepcao',
  'social',
];

export type Atributos = Record<AttrKey, number>;

// ── Impulsos (GDD §5).
export type ImpulsoId =
  | 'fome'
  | 'sono'
  | 'tesao'
  | 'abstinencia'
  | 'tedio'
  | 'solidao'
  | 'ganancia';

// ── Categorias de verbo (GDD §4.1).
export type CategoriaVerbo =
  | 'corpo'
  | 'social'
  | 'ganho'
  | 'transgressao'
  | 'pratica'
  | 'observacao'
  | 'deslocamento'
  | 'cenario';

export const NOME_CATEGORIA: Record<CategoriaVerbo, string> = {
  corpo: 'Corpo',
  social: 'Social',
  ganho: 'Ganho',
  transgressao: 'Transgressão',
  pratica: 'Prática',
  observacao: 'Observação',
  deslocamento: 'Deslocamento',
  cenario: 'Arcano',
};

export type AlvoTipo = 'nenhum' | 'pessoa' | 'objeto' | 'lugar' | 'si';

// ── Efeitos: patches que a engine aplica ao estado.
export type Efeito =
  | { tipo: 'recurso'; recurso: string; delta: number }
  | { tipo: 'pressao'; pressao: string; delta: number }
  | { tipo: 'impulso'; impulso: ImpulsoId; delta: number }
  | { tipo: 'relacao'; npc: string; eixo: string; delta: number }
  | { tipo: 'reputacao'; faccao: string; delta: number }
  | { tipo: 'dinheiro'; delta: number }
  | { tipo: 'xp'; delta: number }
  | { tipo: 'flag'; chave: string; valor: boolean | number | string }
  | { tipo: 'item'; item: string; delta: number }
  | { tipo: 'revelarSegredo'; npc: string }
  | { tipo: 'condicao'; condicao: string; adicionar: boolean }
  | { tipo: 'danoJogador'; perfil: PerfilDano };

// ── Verbo: dado, não texto (GDD §4.1).
export type Verbo = {
  id: string;
  nome: string;
  categoria: CategoriaVerbo;
  descricao: string;
  alvo: AlvoTipo;
  requisitos?: {
    privacidadeMin?: 0 | 1 | 2 | 3;
    testemunhasMax?: number;
    item?: string;
    pericia?: string;
    periodo?: Periodo[];
    localTipo?: string[];
    condicaoNecessaria?: string;
    condicaoProibida?: string;
  };
  custo: { periodos: number; energia?: number; dinheiro?: number };
  teste?: { atributo: AttrKey; pericia?: string; dificuldadeBase: number };
  impulsoQueSacia?: ImpulsoId;
  retornoDecrescente?: boolean;
  tabu?: { faccoes: string[]; consequencia: string };
  // Efeitos aplicados sempre (ex.: custo). E por grau de resultado.
  efeitosSempre?: Efeito[];
  efeitosPorGrau?: Partial<Record<Grau, Efeito[]>>;
};

// ── Personagem.
export type Personagem = {
  nome: string;
  classeId: string;
  origemId: string;
  nivel: number;
  xp: number;
  atributos: Atributos;
  recursos: Record<string, number>; // inclui 'vida' + recursos do cenário
  recursosMax: Record<string, number>;
  pressoes: Record<string, number>; // 0..100
  dinheiro: number;
  pericias: Record<string, number>;
  inventario: Record<string, number>;
  artesConhecidas: string[];
  alcunhas: string[];
  cicatrizes: string[];
  condicoes: string[];
};

// ── NPC estático.
export type NPC = {
  id: string;
  nome: string;
  idade: number;
  ocupacao: string;
  faccaoId: string;
  localBase: string;
  rotina: Partial<Record<Periodo, string>>; // eles se movem (GDD §10.3)
  vozNarrativa: string;
  personalidade: string;
  segredo?: { conteudo: string; comoDescobrir: string };
  ensinaMestre?: string; // id de mestre no Livro
  atributos?: Partial<Atributos>;
};

// ── Estado dinâmico de NPC por campanha (GDD §10.1).
export type NpcDinamico = {
  eixos: Record<string, number>; // disposicao/confianca/medo, ou desejo/confianca/conforto
  vivo: boolean;
  tensao: number; // sobe com negligência (GDD §10.4)
  memoria: { turno: number; resumo: string; peso: number }[];
};

// ── Local (GDD §7).
export type Local = {
  id: string;
  nome: string;
  regiao: string;
  tipo: string;
  descricaoBase: string;
  atmosferaPorPeriodo: Partial<Record<Periodo, string>>;
  privacidadeBase: Record<Periodo, 0 | 1 | 2 | 3>;
  perigo: number;
  verbosExtras?: string[];
  verbosBloqueados?: string[];
  ganchos: string[];
  pontos?: string[];
  rotas: { destino: string; periodos: number; perigo: number }[];
};

// ── Cenário: só toca na "coluna direita" (GDD §6.1).
export type Cenario = {
  id: string;
  nome: string;
  genero: string;
  ancoraCalendario: string; // "desde que a ponte caiu"
  nomesAtributos: Record<AttrKey, string>;
  recursos: { id: string; nome: string }[]; // além de vida
  pressoes: { id: string; nome: string; descricao: string }[];
  acentoCor: string;
  k: number; // botão de caos (GDD §2.1)
  tabuCentral: string;
  eixosRelacao: { id: string; nome: string }[]; // disposicao/confianca/medo (GDD §10.1)
};

// ── Classe e origem (GDD §6.3).
export type Classe = {
  id: string;
  nome: string;
  recursoPrincipal: string;
  mecanicaUnica: string;
  descricao: string;
  bonusAtributos: Partial<Atributos>;
  periciasIniciais: Record<string, number>;
  itensIniciais?: Record<string, number>;
  artesIniciais?: string[];
};

export type Origem = {
  id: string;
  nome: string;
  arquetipo: string; // "poder com dívida", etc.
  descricao: string;
  oQueFalta: string;
  bonusAtributos: Partial<Atributos>;
  dinheiroInicial: number;
  flagsIniciais?: Record<string, boolean | number | string>;
};

// ── O Livro (GDD §13).
export type EstadoEntrada =
  | 'desconhecida'
  | 'ouvida'
  | 'localizada'
  | 'acessivel'
  | 'obtida'
  | 'perdida';

export type Mestre = {
  id: string;
  nome: string;
  localBase: string;
  dominio: string;
  custo: string;
  ensina: string[]; // ids de artes/trabalhos
  mecanicaUnica: string;
  exclusivo?: string[];
  podeMorrer: boolean;
};

export type Trabalho = {
  id: string;
  nome: string;
  tipo: 'fixo' | 'contrato' | 'oficio' | 'obrigacao';
  requisitos: string;
  periodosPorCiclo: number;
  renda: number;
  reputacao?: { faccaoId: string; delta: number }[];
  riscos: string;
};

export type Arte = {
  id: string;
  nome: string;
  escola: string;
  grau: 'comum' | 'notavel' | 'rara' | 'unica' | 'mitica' | 'proibida' | 'perdida';
  custo: { recurso: string; valor: number };
  efeito: string;
  pressaoGerada?: { medidor: string; valor: number };
  tabu?: string;
};

export type Reliquia = {
  id: string;
  nome: string;
  descricao: string;
  grau: 'comum' | 'notavel' | 'rara' | 'unica' | 'mitica' | 'proibida' | 'perdida';
  donoAtual?: string; // NpcId | 'jogador'
  usoPeloDono?: string; // o que ela faz CONTRA você (GDD §13.5)
  viasDeTomada?: string[];
  localAtual?: string;
};

export type LivroState = {
  mestres: Record<string, EstadoEntrada>;
  trabalhos: Record<string, EstadoEntrada>;
  artes: Record<string, EstadoEntrada>;
  reliquias: Record<string, EstadoEntrada>;
};

// ── Pacote completo de conteúdo de um cenário.
export type ContentBundle = {
  cenario: Cenario;
  classes: Classe[];
  origens: Origem[];
  verbos: Verbo[];
  locais: Local[];
  npcs: NPC[];
  mestres: Mestre[];
  trabalhos: Trabalho[];
  artes: Arte[];
  reliquias: Reliquia[];
  faccoes: { id: string; nome: string }[];
  localInicial: string;
};

// ── Estado serializável de uma campanha (GDD §34).
export type Campaign = {
  id: string;
  cenarioId: string;
  criadaEm: number;
  rng: RngState;
  calendario: CalendarioState;
  capitulo: { numero: number; titulo: string; periodosDecorridos: number };
  personagem: Personagem;
  localAtual: string;
  npcState: Record<string, NpcDinamico>;
  impulsos: Record<ImpulsoId, number>;
  flags: Record<string, boolean | number | string>;
  reputacao: Record<string, number>;
  livro: LivroState;
  cronica: { turno: number; texto: string; tipo: 'narracao' | 'eco' | 'resumo' | 'sistema' }[];
  locaisVisitados: string[];
  segredosRevelados: string[];
  ultimoResultado?: {
    grau: Grau;
    verboNome?: string;
    alvoNome?: string;
  };
  turno: number;
};

export type { Periodo, Estacao, CalendarioState, RngState, Grau, PerfilDano };
