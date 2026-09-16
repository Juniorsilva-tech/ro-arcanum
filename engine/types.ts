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

// Que tipo de laço existe entre duas pessoas do vale.
export type LacoTipo =
  | 'aliada'
  | 'rival'
  | 'amante'
  | 'devedora'
  | 'protege'
  | 'desconfia'
  | 'sangue';

// Turno de trabalho individual. O expediente decide se a rotina pode ocorrer
// naquele dia/período; o destino concreto continua vindo de `rotina`.
export type ExpedienteNPC = {
  diasTrabalho: number[]; // 0 = domingo ... 6 = sábado
  periodos: Periodo[];
};

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
  // Arma capaz de suprimir a regeneração de um oni (engine/combat.ts).
  contraOni?: boolean;
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
  // Fusões de estilo já criadas nesta vida — limite de 3 (ver engine/fusao.ts).
  fusoesFeitas?: number;
  alcunhas: string[];
  cicatrizes: string[];
  condicoes: string[];
  // Amputações permanentes (engine/combat.ts) — nascem de um golpe severo
  // contra quem já está quase caindo, não de um tipo de inimigo específico.
  membrosPerdidos?: MembroId[];
  // Idade real do jogador — envelhece de verdade, do mesmo jeito que as NPCs
  // (ver engine/vidanpc.ts e engine/ascensao.ts). Ausente em saves antigos:
  // cai no padrão de 20 (ver engine/migracao.ts).
  idade?: number;
};

export type MembroId = 'braco_esquerdo' | 'braco_direito' | 'perna_esquerda' | 'perna_direita';

// ── Gênese (documento original, seção 2: pais procedurais e herança
// genética antes da primeira cena — ver engine/genese.ts). Pais e irmãos
// continuam sorteados; a MARCA e a REAÇÃO da infância deixaram de ser dado
// (era RNG puro antes) e viraram escolha do jogador na criação de
// personagem (ver engine/character.ts, ui/screens/Criacao.tsx) — mais
// agência sem abrir um segundo modo de jogo pra infância.
export type MarcaInfancia = 'tragedia' | 'genio' | 'indigno' | 'comum';
export type ReacaoInfancia = 'sozinho' | 'apoio' | 'entendimento';

export type GeneseResultado = {
  paiNome: string;
  maeNome: string;
  paiAtributos: Atributos;
  maeAtributos: Atributos;
  marca: MarcaInfancia;
  reacao: ReacaoInfancia;
  motivoTragedia?: string;
  irmaos: number;
};

// ── Carta de memória de infância (documento de dinastia, seção 5, recortado:
// sem baralho tático de combate — só um bônus de circunstância que o jogador
// escolhe jogar antes de um teste, gasto de um punhado de usos por campanha).
export type CartaMemoria = {
  id: string;
  titulo: string;
  tipo: 'vitoria' | 'trauma';
  descricao: string;
  bonusCircunstancia: number;
  usosRestantes: number;
};

// ── NPC estático.
export type NPC = {
  especie?: 'humano' | 'oni' | 'espirito';
  parentesco?: 'pai' | 'mae' | 'irmao' | 'irma';
  combatente?: {
    vida: number;
    defesa: number;
    acerto: number;
    dano: PerfilDano;
    tecnicas: string[];
    nichirin?: boolean;
    suporte?: boolean;
  };
  id: string;
  nome: string;
  idade: number;
  ocupacao: string;
  faccaoId: string;
  localBase: string;
  rotina: Partial<Record<Periodo, string>>; // eles se movem (GDD §10.3)
  expediente?: ExpedienteNPC;
  vozNarrativa: string;
  personalidade: string;
  // Como ela é de corpo. O narrador descreve gente, não fichas — e num jogo
  // adulto isso é parte do retrato, na mesma linha da voz e da índole.
  corpo?: string;
  segredo?: { conteudo: string; comoDescobrir: string };
  // Com quem ela tem história. É o que faz o vale ter vida própria: quando duas
  // se encontram numa rotina, a relação entre elas produz acontecimento sem o
  // jogador mexer um dedo (ver engine/convivio.ts).
  relacoes?: { npc: string; tipo: LacoTipo; nota: string }[];
  ensinaMestre?: string; // id de mestre no Livro
  atributos?: Partial<Atributos>;
  // Participa de um embate de fundo contra uma ameaça rival, resolvido sem
  // o jogador estar presente (ver engine/duelo.ts). `grupo` agrupa aliados
  // que contam como reforço um do outro; `forca` é o poder dela nesse
  // embate; `rivalNome`/`rivalForca` descrevem o que ela enfrenta.
  duelo?: { grupo: string; forca: number; rivalNome: string; rivalForca: number; faccaoGanho?: string };
};

// ── Convicção / Reflexão Cognitiva sintetizada pelo NPC (GDD §10.4 / Stanford Reflexão).
export type Conviccao = {
  id: string;
  texto: string;
  valencia: 'afeto' | 'desconfianca' | 'cautela' | 'temor';
  intensidade: number; // 1 a 5
  turno: number;
  dia: number;
  baseadaEmTipos: string[];
};

// ── Estado dinâmico de NPC por campanha (GDD §10.1).
export type NpcDinamico = {
  progressao?: import('./progressaoNpc').ProgressaoNpc;
  eixos: Record<string, number>; // disposicao/confianca/medo, ou desejo/confianca/conforto
  vivo: boolean;
  tensao: number; // sobe com negligência (GDD §10.4)
  // Idade efetiva NESTA campanha — diverge da idade estática do conteúdo
  // conforme o calendário anda (ver engine/vidanpc.ts). Ausente = ainda não
  // envelheceu nenhum ano; usa a idade do conteúdo estático.
  idade?: number;
  vida?: number;
  // Lembranças tipadas, retidas por peso (ver engine/memoria.ts). Os campos
  // novos são opcionais para não invalidar save antigo.
  memoria: {
    turno: number;
    resumo: string;
    peso: number;
    tipo?: string;
    dia?: number;
  }[];
  // Reflexões cognitivas sintetizadas e acumulador de pontos emocionais
  conviccoes?: Conviccao[];
  pontosReflexao?: number;
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
  // O que aconteceu aqui antes de o jogador chegar. Vai para o pacote do
  // narrador, que passa a poder citar o passado do lugar em vez de inventar um.
  historia?: string[];
  // Lugar que nao aparece no mapa ate ser descoberto. `dica` e' o que se ouve
  // antes de saber onde fica; `flag` e' o que a campanha precisa ter marcado.
  // A mansao Ubuyashiki e a vila dos ferreiros sempre foram secretas na
  // ficcao e publicas na mecanica — apareciam na lista de rotas como qualquer
  // outro destino.
  oculto?: {
    flag: string;
    dica: string;
    /** Confiança de uma facção abre a porta: eles contam a você. */
    exigeReputacao?: { faccaoId: string; minimo: number };
    /** Ou você chega perto o bastante de um lugar que dá acesso. */
    exigeVisita?: string;
  };
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
  tecnica?: import('./kimetsuTypes').TecnicaCombate;
  id: string;
  nome: string;
  escola: string;
  grau: 'comum' | 'notavel' | 'rara' | 'unica' | 'mitica' | 'proibida' | 'perdida';
  custo: { recurso: string; valor: number };
  efeito: string;
  pressaoGerada?: { medidor: string; valor: number };
  tabu?: string;
  // 'fusao': arte original, criada pelo jogador fundindo duas escolas
  // dominadas (ver engine/fusao.ts). Ausente = veio do conteúdo estático.
  origem?: 'fusao';
  escolasOrigem?: [string, string];
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
  /** Regiao fora da qual esta criatura nunca e sorteada. */
  regiaoExclusiva?: string;
  humano?: boolean;
  perfilOni?: import('./kimetsuTypes').PerfilOni;
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
  // Endurance and regeneration are separate from definitive oni death.
  oni?: boolean;
  // Explicit acquired exception; strength alone never grants solar immunity.
  imuneLuz?: boolean;
};

export type CombatActor = {
  /** Guardiao: o primeiro golpe do combate ja foi absorvido? (engine/classe.ts) */
  primeiroGolpeAbsorvido?: boolean;
  /** Espadachim: alvo em que ele esta focado, e quantos acertos seguidos. */
  focoAlvo?: string;
  focoAcertos?: number;
  // Fracao dos acertos que sai como critico. Ausente = 0,25 (regra base).
  janelaCritica?: number;
  posicao?: 'frente' | 'flanco' | 'cobertura';
  retirado?: boolean;
  capturado?: boolean;
  rivalId?: string;
  perfilOni?: import('./kimetsuTypes').PerfilOni;
  mortoDefinitivo?: boolean;
  decapitadoAte?: number;
  faseAtivada?: boolean;
  tatico?: import('./kimetsuTypes').EstadoTatico;
  recargas?: Record<string, number>;
  id: string;
  nome: string;
  ehJogador: boolean;
  ehAliado?: boolean;
  npcId?: string;
  vida: number;
  vidaMax: number;
  defesa: number;
  acerto: number;
  dano?: PerfilDano;
  criaturaId?: string;
  condicoes: string[];
  // Turnos restantes em que a regeneração de oni fica suprimida, contados a
  // partir de um golpe com arma `contraOni`.
  imuneRegenTurnos?: number;
  oni?: boolean;
  imuneLuz?: boolean;
  defendendo?: boolean;
  membrosPerdidos?: MembroId[];
};

export type CombatState = {
  ordemGrupo?: 'livre' | 'proteger' | 'focar';
  versaoRegras?: number;
  ambiente?: { abrigoSolar: boolean };
  ultimaTecnica?: string;
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
  desafios?: Desafio[];
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
  casas?: import('../content/vaelhorn/casas').CasaNobre[];
  // Pares de facções com rivalidade de fundo real o bastante pra às vezes
  // virar guerra aberta, longe do jogador (ver engine/guerra.ts). Ausente =
  // cenário sem esse tipo de tensão política.
  rivalidadesFaccoes?: [string, string][];
  // Criaturas sorteáveis por tipo de local, usadas no encontro de estrada
  // (ver engine/viagem.ts). Vivia só no bundle de conteúdo, o que obrigava a
  // regra de viagem inteira a morar na UI — a engine não alcançava a tabela.
  // Ausente = cenário sem encontro de viagem.
  encontrosPorTipo?: Record<string, string[]>;
  /** Encontros caracteristicos de cada regiao, somados aos do tipo de lugar. */
  encontrosPorRegiao?: Record<string, string[]>;
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

export type Desafio = { id: string; criaturaId: string; local: string; titulo: string; descricao: string; aviso: string };

export type QuestEstado = 'desconhecida' | 'ativa' | 'concluida' | 'falhada';

// ── Estado serializável de uma campanha (GDD §34).
export type Campaign = {
  observacoesLocais?: Record<string, import('./contextoNarrativo').ObservacaoLocal>;
  vivo?: import('./vivoTypes').MundoVivo;
  familia?: import('./familia').FamiliaState;
  npcsProcedurais?: NPC[];
  grupo?: string[];
  continuidade?: import('./continuidade').ContinuidadeState;
  kimetsu?: import('./kimetsuTypes').KimetsuState;
  // Aptidao oculta, maestria, exposicao, reputacao e fama por dominio
  // (ver engine/aptidao.ts). Ausente em saves antigos: migracao.ts cria.
  aptidao?: import('./aptidaoTypes').AptidaoState;
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
  // Artes originais criadas por fusão nesta campanha — não vivem no
  // ContentBundle estático porque são específicas de cada personagem.
  artesCriadas?: Arte[];
  // Gênese: pais gerados proceduralmente e o que aconteceu com eles antes
  // da primeira cena (ver engine/genese.ts). Ausente em saves anteriores a
  // essa funcionalidade — tratado como opcional por isso.
  genese?: GeneseResultado;
  // Cartas de memória de infância e qual está "jogada" para o próximo teste
  // (consumida no teste seguinte que de fato rolar — ver engine/turn.ts).
  memoriasInfancia?: CartaMemoria[];
  cartaAtiva?: string;
  // Luas Superiores (ou Muzan) vencidas em combate — um dos três pilares
  // reais da Ascensão (ver engine/ascensao.ts, engine/combat.ts).
  almasSeladas?: string[];
  // O CHIM foi alcançado — imortalidade biológica real e anulação real da
  // penalidade de membro amputado (ver engine/ascensao.ts).
  ascensao?: { chim: true; dia: number };
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
  // O que aconteceu entre elas enquanto você não estava olhando.
  ecos?: { turno: number; dia: number; local: string; texto: string; npcs: string[] }[];
  // Avanços de poder raros e ganhos, acima da curva normal de nível — ver
  // engine/progresso.ts. Ids dos que já foram concedidos, pra não repetir.
  despertares?: string[];
};

export type { Periodo, Estacao, CalendarioState, RngState, Grau, PerfilDano };
