// ARCANUM · Tipos centrais do domínio. A engine é dona da verdade (GDD §0.1).
import type { PerfilDano, Grau } from './resolution';
import type { Periodo, Estacao, CalendarioState } from './time';
import type { RngState } from './rng';
import type { MundoState } from './mundo';

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

// ── Itens (catálogo estático — GDD §34 "itens_base").
export type ItemSlot =
  | 'arma'
  | 'armadura'
  | 'escudo'
  | 'acessorio'
  | 'consumivel'
  | 'ferramenta'
  | 'material'
  | 'misc';

export type Item = {
  id: string;
  nome: string;
  descricao: string;
  slot: ItemSlot;
  peso: number;
  valor: number; // preço-base de compra em moedas
  raridade: 'comum' | 'notavel' | 'rara' | 'unica' | 'mitica' | 'proibida' | 'perdida';
  empilhavel?: boolean;
  // arma
  dano?: PerfilDano;
  alcance?: 'corpo' | 'distancia';
  atributoAtaque?: AttrKey;
  // armadura / escudo
  defesa?: number;
  // consumível
  efeitosUso?: Efeito[];
  // concede um verbo enquanto estiver no inventário (GDD §13.6)
  concedeVerbo?: string;
  // onde é vendido (ids de local). Ausente = não vendido em loja.
  lojas?: string[];
};

export type Equipado = {
  arma?: string;
  armadura?: string;
  escudo?: string;
  acessorio?: string;
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
  equipado: Equipado;
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
  // Como ela é de corpo. O narrador descreve gente, não fichas — e num jogo
  // adulto isso é parte do retrato, na mesma linha da voz e da índole.
  corpo?: string;
  segredo?: { conteudo: string; comoDescobrir: string };
  ensinaMestre?: string; // id de mestre no Livro
  atributos?: Partial<Atributos>;
};

// ── Estado dinâmico de NPC por campanha (GDD §10.1).
export type NpcDinamico = {
  eixos: Record<string, number>; // disposicao/confianca/medo, ou desejo/confianca/conforto
  vivo: boolean;
  tensao: number; // sobe com negligência (GDD §10.4)
  // Lembranças tipadas, retidas por peso (ver engine/memoria.ts). Os campos
  // novos são opcionais para não invalidar save antigo.
  memoria: {
    turno: number;
    resumo: string;
    peso: number;
    tipo?: string;
    dia?: number;
  }[];
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
  // A verdade do mundo, em poucas linhas. Vai inteira no pacote do narrador:
  // é isso que faz a voz dele ser deste lugar e não de qualquer fantasia.
  premissa?: string[];
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
  equipInicial?: Equipado;
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

// ── Combate (GDD §16, §17). Resolvido 100% pela engine.
export type Criatura = {
  id: string;
  nome: string;
  descricao: string;
  nivel: number;
  vida: number;
  defesa: number;
  acerto: number;
  ataqueNome: string;
  dano: PerfilDano;
  moralBase: number; // 0..100
  xp: number;
  faccaoId?: string;
  loot?: { item: string; chance: number }[];
  chefe?: boolean;
  // Fase de chefe: dispara quando a vida cai abaixo do gatilho (0..1).
  fase2?: { gatilhoPct: number; descricao: string; mecanica: 'apagar_vinculo' | 'chamar_reforco' | 'enfurecer' };
};

export type CombatActor = {
  id: string;
  nome: string;
  ehJogador: boolean;
  vida: number;
  vidaMax: number;
  defesa: number;
  acerto: number;
  dano?: PerfilDano;
  criaturaId?: string;
  condicoes: string[];
  defendendo?: boolean;
};

export type CombatState = {
  rodada: number;
  atores: CombatActor[];
  ordem: string[]; // ids na ordem de iniciativa
  turno: number; // índice em ordem
  moralInimiga: number;
  terminado: boolean;
  resultado?: 'vitoria' | 'derrota' | 'fuga';
  log: string[];
  fase: number;
  recompensa?: { xp: number; loot: string[] };
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
  itens: Item[];
  criaturas: Criatura[];
  quests: Quest[];
  faccoes: { id: string; nome: string }[];
  localInicial: string;
};

// ── Missões (GDD §13.2/quests_estado). Objetivos simples ligados a flags.
export type Quest = {
  id: string;
  titulo: string;
  descricao: string;
  dador?: string; // NpcId que dá a missão
  objetivos: { id: string; texto: string; flag: string }[];
  recompensa: { dinheiro?: number; xp?: number; item?: string; reputacao?: { faccaoId: string; delta: number }[] };
  prazoDias?: number;
};

export type QuestEstado = 'desconhecida' | 'ativa' | 'concluida' | 'falhada';

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
  combate?: CombatState | null;
  questEstado: Record<string, QuestEstado>;
  // Rótulos de opção já oferecidos. A IA recebe a lista e fica proibida de
  // repetir — opção repetida é o cheiro mais forte de jogo sem memória.
  opcoesUsadas?: string[];
  // Os grandes acontecimentos da campanha, para o narrador poder citar o que
  // ficou para trás em vez de tratar cada turno como um episódio solto.
  marcos?: { turno: number; dia: number; texto: string }[];
  // O vale continua sem você: clima, evento corrente e carestia (ver mundo.ts).
  mundo?: MundoState;
};

export type { Periodo, Estacao, CalendarioState, RngState, Grau, PerfilDano };
