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
  // Equipamento capaz de isolar e suprimir o vazamento de mana colossal entre humanos
  suprimeMana?: boolean;
  // Bônus temporário de gume/afiação obtido na forja
  afiacao?: { cargas: number; bonusDano: number };
  // Bônus temporário de têmpera defensiva obtido na forja
  tempera?: { cargas: number; bonusDefesa: number };
  // Id do catalisador infundido durante a forja
  catalisador?: string;
  // Propriedades intrínsecas concedidas por catalisadores (ex: 'venenosa', 'suprimeMana', 'contraOni', 'critica', 'espelhada')
  propriedadesEspeciais?: string[];
  // Categoria de criatura vulnerável a este óleo de caça alquímico
  oleoAlvo?: 'fera' | 'morto_vivo' | 'oni' | 'monstro';
  // Relíquia ancestral hereditária de casa nobre de Vaelhorn
  ehReliquiaCasa?: string;
  /** Origem, quem empunhou, como chegou aqui (content/vaelhorn/lendas.ts). */
  historia?: string[];
  // Especialização de lâmina / estilo marcial (para Musashi e Niten Ichi-ryu)
  tipoArma?: 'espada' | 'espada_dupla' | 'machado' | 'lanca' | 'adaga' | 'arco' | 'desarmado' | 'outro';
  // Concede chance de partir e inutilizar lâminas adversárias (manoplas de Mestre Marcial)
  quebraArmas?: boolean;
  // Bônus adicional na janela de acerto crítico (ex: +0.08 a +0.20)
  bonusCritico?: number;
  // Multiplicador de dano no golpe crítico (padrão 1.75; adagas/armas lendárias 1.95 a 2.4)
  multiplicadorCritico?: number;
  // Efeito passivo de combate de armas lendárias ou relíquias nobres
  efeitoPassivo?:
    | 'chamas_solares'
    | 'contra_ataque_rocha'
    | 'rachar_armadura'
    | 'sangramento_abissal'
    | 'disparo_perfurante'
    | 'execucao_sombria'
    | 'peso_imperial';
  // Sistema de Cor de Lâmina Nichirin (Kimetsu no Yaiba: transmutação cromática ao empunhar)
  corNichirin?: 'preta' | 'azul' | 'vermelha' | 'amarela' | 'verde' | 'cinza' | 'branca' | 'lavanda' | 'rosa' | 'indigo';
  corNichirinNome?: string;
  corNichirinAfinidade?: string;
};

export type Equipado = {
  arma?: string;
  armadura?: string;
  escudo?: string;
  acessorio?: string;
};

// ── Modo do Domínio Inato Kai (Sakai)
export type ModoKai =
  | 'percepcao'
  | 'fortalecimento'
  | 'magia'
  | 'audicao'
  | 'barreira_magica'
  | 'barreira_fisica'
  | 'cura'
  | 'supressao'
  | 'destruicao'
  | 'sentidos';

// ── Personagem.
export type Personagem = {
  nome: string;
  genero: 'm' | 'f';
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
  /**
   * Peças que o próprio personagem forjou (engine/forja.ts). Mesmo padrão de
   * `artesCriadas`: o catálogo do conteúdo é fixo, e o que o jogador cria mora
   * na campanha. `itemPorId` procura aqui quando recebe o personagem.
   */
  itensForjados?: Item[];
  // Cor inata da Lâmina Nichirin despertada pela alma do espadachim (Kimetsu)
  corNichirinInata?: 'preta' | 'azul' | 'vermelha' | 'amarela' | 'verde' | 'cinza' | 'branca' | 'lavanda' | 'rosa' | 'indigo';
  // Fusões de estilo já criadas nesta vida — limite de 3 (ver engine/fusao.ts).
  fusoesFeitas?: number;
  // O jeito de lutar que o último mestre deixou (engine/estiloMestre.ts).
  estiloMarcial?: 'agressivo' | 'defensivo' | 'preciso' | 'bruto';
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
  // Expansão Tsukimichi: Cartão de Aventureiro da Guilda e Domínio de Sakai
  cartaoAventureiro?: {
    registrado: boolean;
    nivelAparente: number; // Sempre 1 (Quebrador de Parâmetros / Erro de Medição da Deusa)
    rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
    manaStatus: 'incomensuravel' | 'erro_overflow' | 'comum';
    parametroQuebrado: boolean;
    dataRegistro?: number;
  };
  sakai?: {
    desbloqueado: boolean;
    nivel: number;
    experienciaTreino?: number;
    treinosRealizados?: number;
    modosDisponiveis: ModoKai[];
    modoAtivo?: ModoKai;
  };
  treinoQuaseMorte?: {
    ciclosConcluidos: number;
    manaExpandidoTotal: number;
    ultimoTreinoTurno?: number;
  };
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
export type HistoriaNpc = { origem: string; ferida: string; desejo: string; medo?: string };

// O que muda no mundo quando o jogador descobre o segredo (engine/segredos.ts):
// efeitos da engine (relação com outra pessoa, reputação, flag que destrava
// verbo, item) e, se houver, uma missão viva que o segredo abre.
export type ConsequenciaSegredo = {
  texto: string;
  efeitos?: Efeito[];
  /** Só os tipos que o jogador fecha sem rival nem cativo (ver acoesMundo.ts). */
  missao?: 'tratar' | 'abastecer' | 'reconstruir';
};

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
  segredo?: { conteudo: string; comoDescobrir: string; consequencia?: ConsequenciaSegredo };
  // De onde ela veio, o que perdeu, o que quer (engine/segredos.ts). Vai ao
  // narrador para ele aludir, nunca para revelar o que o jogador não sabe.
  historia?: HistoriaNpc;
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
  /** Onde se faz: o Livro revela o trabalho quando você conhece o lugar (engine/livro.ts). */
  onde?: string;
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
  /** Itens e lugares do Livro (engine/livro.ts); ausentes em saves antigos. */
  itens?: Record<string, EstadoEntrada>;
  lugares?: Record<string, EstadoEntrada>;
};

// ── Combate (GDD §16, §17). Resolvido 100% pela engine.
export type Criatura = {
  /** O que o vale sabe dela e o que serve na estrada (content/vaelhorn/bestiario-historias.ts). */
  historia?: string;
  sinais?: string;
  /**
   * Peso do encontro por estação (engine/estacoes.ts). 1 é o normal; 0 some
   * na estação (urso hibernando); 2 é o dobro (lobo com fome no inverno).
   */
  estacoes?: Partial<Record<import('./time').Estacao, number>>;
  /** Sai em grupo: quantos, antes do teto por nível do jogador. */
  bando?: { min: number; max: number };
  /** Regiao fora da qual esta criatura nunca e sorteada. */
  regiaoExclusiva?: string;
  humano?: boolean;
  perfilOni?: import('./kimetsuTypes').PerfilOni;
  id: string;
  nome: string;
  descricao: string;
  nivel: number;
  /** Nível público registrado na Guilda de Aventureiros (Escala Tsukimichi: 100-2000) */
  nivelGuilda?: number;
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
  /** Capitão de bando em pessoa (engine/bandos.ts): o desfecho da luta muda o bando. */
  capitaoBandoId?: string;
  /** Guardiao: o primeiro golpe do combate ja foi absorvido? (engine/classe.ts) */
  primeiroGolpeAbsorvido?: boolean;
  /** Espadachim: alvo em que ele esta focado, e quantos acertos seguidos. */
  focoAlvo?: string;
  focoAcertos?: number;
  /** Preservação de foco marcial ao derrotar um inimigo (Zanshin do Espadachim). */
  focoZanshin?: number;
  // Fracao dos acertos que sai como critico. Ausente = 0,25 (regra base).
  janelaCritica?: number;
  // Multiplicador de dano em caso de acerto crítico (ausente = 1.75)
  multiplicadorCritico?: number;
  // Efeito passivo da arma empunhada em combate
  efeitoPassivoArma?: string;
  // Cor da lâmina Nichirin desperta em combate
  corNichirin?: 'preta' | 'azul' | 'vermelha' | 'amarela' | 'verde' | 'cinza' | 'branca' | 'lavanda' | 'rosa' | 'indigo';
  nomeCorNichirin?: string;
  // Lâmina Carmesim (akatō): até esta rodada, o corte queima o sangue de oni.
  laminaCarmesimAte?: number;
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
  nivelGuilda?: number;
  // Turnos restantes em que a regeneração de oni fica suprimida, contados a
  // partir de um golpe com arma `contraOni`.
  imuneRegenTurnos?: number;
  oni?: boolean;
  imuneLuz?: boolean;
  defendendo?: boolean;
  membrosPerdidos?: MembroId[];
  // Arma quebrada em combate (por desarmamento / quebra de lâmina por Mestre Marcial)
  armaQuebrada?: boolean;
  // Postura marcial ativa do combatente (Musashi / 5 Elementos / Palma de Ferro)
  posturaMarcial?: 'terra' | 'agua' | 'fogo' | 'vento' | 'vazio' | 'duas_espadas' | 'palma_ferro';
  // Óleo alquímico ativo banhado na lâmina para este combate
  oleoAtivo?: { tipoAlvo: 'fera' | 'morto_vivo' | 'oni' | 'monstro'; bonusDano: number; combatesRestantes: number };
  // Estado de percepção absoluta (Sukitōru Sekai / Vazio de Musashi) que ignora defesas e maximiza críticos
  mundoTransparente?: boolean;
};

// ── Famílias entre NPCs (engine/familiasNpc.ts) ─────────────────────────
// Parentesco escrito no conteúdo. `parentesco` no NPC continua sendo só da
// família do JOGADOR (engine/familia.ts); isto aqui é gente do elenco com
// gente do elenco.
//
// Laços dirigidos ('mae', 'pai', 'avo', 'tia'): `a` é <tipo> de `b`.
// Laços simétricos ('irmas', 'conjuges', 'primas'): a ordem não importa.
// Irmã, avó, tia e prima também são deduzidas dos laços de mãe e pai.
export type LacoFamiliarTipo = 'mae' | 'pai' | 'avo' | 'tia' | 'irmas' | 'conjuges' | 'primas';
// Edifício que só uma cidade tem (engine/edificiosRegionais.ts). Dado de
// conteúdo: o cenário declara, a engine aplica.
export type EfeitosRegionais = {
  /** Itens que passam a ser vendidos na cidade (somados às lojas do item). */
  vende?: string[];
  /** A cidade tem onde forjar, mesmo sem ferreira presente. */
  forja?: boolean;
  /** Forjar na cidade não consome carvão. */
  forjaSemCarvao?: boolean;
  /** Comida que entra no celeiro todo dia (peixe, caça). */
  comidaPorDia?: number;
  /** Materiais públicos extras por dia (madeira, pedra). */
  materiaisPorDia?: number;
  /** Multiplica a chance de emboscada das caravanas que partem daqui. */
  fatorAtaqueCaravana?: number;
  /** Teto da muralha acima do teto comum da cidade. */
  tetoMuralha?: number;
  /** A cada N dias, a guarnição derruba um salteador de bando da região. */
  patrulhaCadaDias?: number;
  /** Fertilidade durante a seca (a regra comum é 0,15). */
  fertilidadeNaSeca?: number;
  /** Estoque máximo de itens não comuns na loja (a regra comum é 2). */
  tetoRaros?: number;
};
export type EdificioRegional = {
  id: string;
  nome: string;
  /** Id da cidade viva (camp.vivo.cidades) que tem o edifício. */
  cidade: string;
  /** NPC que trabalha nele, se houver. */
  responsavel?: string;
  descricao: string;
  /** Uma frase para a tela: o que o edifício muda. */
  efeito: string;
  efeitos: EfeitosRegionais;
};
export type LacoFamiliar = { tipo: LacoFamiliarTipo; a: string; b: string };
export type MembroFamilia = {
  npc: string;
  /** O lugar dela dentro da família, em uma ou duas frases concretas. */
  papel: string;
  /** O vale é das mulheres: sem marca, conta como feminino. */
  genero?: 'm';
};
export type FamiliaNpc = {
  id: string;
  /** Como o lugar chama a família: "as Meia-Orelha". */
  nome: string;
  sede: string;
  /** O nó da família, do jeito que a vizinhança conta. Nada de segredo aqui. */
  tensao: string;
  membros: MembroFamilia[];
  lacos: LacoFamiliar[];
  /** Quem é da família e não está no elenco: o filho levado pelo Tributo de Sangue, a mãe afogada. */
  ausentes?: { nome: string; laco: string; destino: string }[];
  /** Membro que não é humano precisa de justificativa escrita (oni, espírito). */
  naoHumanos?: Record<string, string>;
};

export type EstadoFamiliasNpc = {
  /** Mortes já pranteadas — cada uma gera luto uma vez só. */
  pranteados: string[];
  /** Quem herdou ofício de quem (ocupação efetiva sobrepõe a do conteúdo). */
  herancas: Record<string, { ocupacao: string; de: string; dia: number }>;
  /** Quem passou o ofício em vida, por idade. */
  aposentadas: Record<string, number>;
  /** O luto de cada pessoa viva: quem perdeu, qual laço, quando. */
  lutos: Record<string, { morto: string; laco: string; dia: number }[]>;
  /** Último fato já lido (sequência de camp.vivo) para gratidão por resgate. */
  fatoVisto: number;
};

// Caravanas de comida entre cidades (engine/caravanas.ts).
export type Caravana = {
  id: string;
  origem: string;
  destino: string;
  carga: number;
  parte: number;
  chega: number;
  estado: 'partindo' | 'viajando' | 'entregue' | 'perdida';
  escoltada?: boolean;
};
export type EstadoCaravanas = { seq: number; lista: Caravana[]; entregues: number; perdidas: number };

export type EstadoMarca = {
  dia: number;
  idadeDespertar: number;
  idadeLimite: number;
  /** Vida máxima tirada de vez (dreno anual e custo da contenção). */
  vidaPerdida: number;
  contida?: { dia: number; idade: number };
};

export type CombatState = {
  /** Prova do mestre (engine/rito.ts): para a um quarto da vida, ninguém morre. */
  rito?: { mestreId: string };
  ritoFim?: 'vitoria' | 'derrota';
  // Briga com quem está na cena (engine/briga.ts). Letal: quem cai morre.
  briga?: { letal: boolean };
  // Confronto com a patrulha da guarda (engine/guarda.ts).
  guarda?: { regiao: string };
  /** Luta contra um bando (engine/bandos.ts). `pedagio` > 0: eles aceitam moeda em vez de sangue. */
  bando?: { id: string; pedagio?: number; esconderijo?: boolean; vinganca?: boolean };
  /** Emboscada contra caravana que o jogador escolta (engine/caravanas.ts). */
  caravana?: string;
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
  // Famílias entre NPCs do elenco (engine/familiasNpc.ts). Dado de conteúdo.
  familias?: FamiliaNpc[];
  // Um edifício por região e o teto dos edifícios comuns por cidade
  // (engine/edificiosRegionais.ts). Ausente = todas iguais, teto 5.
  edificiosRegionais?: EdificioRegional[];
  tetoEdificios?: Record<string, number>;
  /** Lugares sem dona onde se pode fundar colônia (engine/colonia.ts). */
  sitiosColonia?: import('../content/vaelhorn/sitios').SitioColonia[];
  /** Ato I da trama (engine/atoI.ts). Cenário sem ele não tem o ato. */
  atoI?: import('./atoI').ConteudoAtoI;
  arquetiposColono?: import('../content/vaelhorn/colonos').ArquetipoColono[];
  gruposChegada?: import('../content/vaelhorn/colonos').GrupoChegada[];
  nomesColonas?: string[];
  nomesColonos?: string[];
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
  /** Bandos de salteadores com território, capitão e memória (engine/bandos.ts). */
  bandos?: EstadoBandos;
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
  /** Revelação de intimidade (origem, desejo, ferida, medo) e anseios apoiados (engine/intimidadeNpc.ts) */
  intimidadeNpc?: Record<string, { origem?: boolean; desejo?: boolean; ferida?: boolean; medo?: boolean; desejoApoiado?: boolean }>;
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
  // A Marca do Caçador: quando despertou, a idade em que o corpo começa a
  // cobrar, a vida máxima já perdida e se a chama foi contida (engine/marca.ts).
  marca?: EstadoMarca;
  // Caravanas de comida entre cidades (engine/caravanas.ts).
  caravanas?: EstadoCaravanas;
  // Luto, heranças e aposentadorias das famílias do elenco (engine/familiasNpc.ts).
  familiasNpc?: EstadoFamiliasNpc;
  // O que a cidade lembra do jogador e os ganchos do Diretor de Arcos
  // (engine/memoriaMundo.ts, engine/diretor.ts).
  memoriaMundo?: import('./memoriaMundo').MemoriaMundo;
  cronica: { turno: number; texto: string; tipo: 'narracao' | 'eco' | 'resumo' | 'sistema' }[];
  locaisVisitados: string[];
  segredosRevelados: string[];
  // Expansão Tsukimichi: soberania de Asora e contratos de alma
  asora?: AsoraState;
  // Sistema de Assentamento, Feudo & Reino (Vaelhorn / Mundo Base)
  feudo?: FeudoState;
  /** Trama principal (engine/atoI.ts). Ausente em saves antigos e antes do Ato I. */
  trama?: import('./atoI').TramaState;
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
  // "Lembre o narrador": detalhes da história que o jogador pediu para o
  // narrador não esquecer. Só memória de voz; não mudam o estado do mundo.
  lembretesNarrador?: string[];
  // Quem sabe o nome do jogador (engine/nomeDoJogador.ts), além da família e
  // de quem convive com ele há dias.
  sabemSeuNome?: string[];
  // Provas feitas com cada mestre (engine/rito.ts).
  ritos?: Record<string, { dia: number; resultado: 'aprovado' | 'promissor' | 'cru' }>;
  // A linhagem (engine/linhagem.ts): quem veio antes, e a fama do nome por lugar.
  linhagem?: { nome: string; idade: number; nivel: number; alcunhas: string[]; fim: 'morte' | 'legado'; dia: number }[];
  renomeDoNome?: Record<string, number>;
  // Fama de cada arma pelo que ela derrubou (engine/famaArma.ts).
  famaArmas?: Record<string, { abates: number; nivel: 'comum' | 'conhecida' | 'lendaria' }>;
  // A guarda (engine/guarda.ts): procurado por região, a patrulha que te
  // achou e espera resposta, e a cela.
  procura?: Record<string, ProcuraGuarda>;
  abordagem?: { dia: number; local: string; regiao: string; guarda: string; cacador?: boolean };
  prisao?: { local: string; regiao: string; desdeDia: number; ateDia: number; motivo: string; fianca?: number; armaConfiscada?: string };
  // Gente do mundo que fugiu da cela e está com cartaz (engine/crimeUrbano.ts),
  // e o caçador de recompensas de cada região, com nome e memória (engine/guarda.ts).
  procuradosNpc?: Record<string, ProcuradoNpc>;
  cacadores?: Record<string, CacadorRecompensa>;
  // O vale continua sem você: clima, evento corrente e carestia (ver mundo.ts).
  mundo?: MundoState;
  // O que aconteceu entre elas enquanto você não estava olhando.
  ecos?: { turno: number; dia: number; local: string; texto: string; npcs: string[] }[];
  // Avanços de poder raros e ganhos, acima da curva normal de nível — ver
  // engine/progresso.ts. Ids dos que já foram concedidos, pra não repetir.
  despertares?: string[];
  // Contratos de caça a monstros e troféus conquistados (estilo Witcher)
  contratosMonstro?: ContratosMonstroCampanha;
};

export type { Periodo, Estacao, CalendarioState, RngState, Grau, PerfilDano };
export type CampaignState = Campaign;

// ── Expansão Tsukimichi (Contratos de Alma & Soberania de Asora)
export type ProporcaoContrato = '2:8' | '1:9' | '5:5';

export type ContratoAlma = {
  id: string;
  criaturaOriginalId: string;
  nomeConcedido: string;
  titulo: string;
  /** Nível público registrado na Guilda de Aventureiros (Tomoe: 1320, Mio: 1500, etc.) */
  nivelGuilda?: number;
  proporcao: ProporcaoContrato;
  formaOriginal: string;
  formaHumanoide: {
    aparencia: string;
    vestes: string;
    personalidade: string;
    voz: string;
  };
  bonusConcedidos: Partial<Atributos>;
  lealdade: number;
  afeto: number;
  ciume: number;
  ativaNoGrupo: boolean;
  papelAsora?: 'governante' | 'guardia' | 'artesa' | 'diplomata';
};

export type ObraAsora = {
  id: 'lavoura_highland' | 'forja_anoes' | 'onsen_termas' | 'atelie_alkes' | 'quartel_lizards';
  nome: string;
  nivel: number;
  maxNivel: number;
  responsavel: string;
  descricao: string;
};

export type OcupanteSubespaco = {
  id: string;
  nome: string;
  papel: string;
  localSetor: string;
  tipo: 'jogador' | 'serva' | 'residente' | 'populacao';
};

export type SetorTrabalhoSubespaco =
  | 'agricultura'
  | 'mineracao'
  | 'forja_ferramentas'
  | 'tecelagem'
  | 'seguranca_patrulha'
  | 'construcao_obras';

export type TriboAcolhida = {
  id: 'orcs_highland' | 'elder_dwarves' | 'mist_lizards' | 'alkes' | 'homens_fera';
  nome: string;
  populacao: number;
  especialidade: string;
  dataAcolhimento: number;
};

export type EstrategiaCompanhia =
  | 'remedios_e_pocao'
  | 'tecidos_e_vestes'
  | 'armas_e_ferramentas'
  | 'graos_e_mantimentos';

export type AsoraState = {
  /** Nome personalizável do subespaço determinado pelo jogador (ex: 'Santuário do Vácuo', 'Reino de Jade', etc.) */
  nome?: string;
  desbloqueado: boolean;
  populacao: number;
  seguranca: number;
  harmonia: number;
  obras: Record<string, ObraAsora>;
  estoques: { comida: number; seda: number; minerio: number; draupnir: number };
  contratos: Record<string, ContratoAlma>;
  tribosAcolhidas?: Record<string, TriboAcolhida>;
  alocacaoTrabalho?: Record<SetorTrabalhoSubespaco, number>;
  recursosEspeciais?: {
    ferramentasDisponiveis: number;
    madeiraNobre: number;
  };
  projetosConcluidos?: string[];
  projetoEmAndamento?: {
    id: string;
    nome: string;
    turnosRestantes: number;
    operariosAlocados: number;
  };
  companhiaMercantil?: {
    fundada: boolean;
    nome: string;
    nivelComercial: number;
    ouroAcumulado: number;
    rendaPorCiclo: number;
    caravanasEnviadas: number;
    estrategiaAtual?: EstrategiaCompanhia;
    gerenteDesignada?: string;
    escoltaDesignada?: 'sem_escolta' | 'guerreiros_orcs' | 'mist_lizards' | 'serva_de_elite';
    lojasAbertas?: string[];
  };
  investigacaoHerois?: {
    nivelAlerta: number;
    batedoresEnviados: boolean;
    decretosEmitidos: boolean;
    ocorrencias: string[];
  };
  forjaAtiva?: {
    itemEmForja?: string;
    turnosRestantes?: number;
    encomendadoPor?: string;
  };
  construcaoOrcs?: {
    projeto?: string;
    turnosRestantes?: number;
  };
};

export type TipoEdificioModular =
  | 'moradias'
  | 'castelo'
  | 'quartel'
  | 'mercado_feitoria'
  | 'igreja_santuario'
  | 'oficina_forja'
  | 'lavoura_silos'
  | 'muralha_baluarte'
  | 'boticario_hospital'
  | 'cisterna_poco';

export type ObraAtiva = {
  id: string;
  tipo: TipoEdificioModular;
  nome: string;
  nivelAlvo: number;
  periodosRestantes: number;
  periodosTotais: number;
  custoOuro: number;
  custoMateriais: number;
};

export type CargaCaravana = 'mantimentos' | 'minerio' | 'artesanato' | 'tecidos' | 'armas';

export type RotaComercial = {
  id: string;
  destinoId: string;
  destinoNome: string;
  diasViagemTotal: number;
  diasRestantes: number;
  cargaTipo: CargaCaravana;
  lucroEstimado: number;
  riscoEstrada: number;
  ativa: boolean;
};

export type RotaPatrulha = {
  id: string;
  regiaoAlvo: string;
  nomeRegiao: string;
  soldadosAlocados: number;
  eficaciaPacificacao: number;
  custoManutencaoDiaria: number;
  ativa: boolean;
};

export type BiomaFeudo = 'planicie' | 'deserto' | 'montanha' | 'floresta' | 'costa' | 'asora';

export type CargoConselho = 'regente' | 'chanceler' | 'marechal' | 'tesoureiro' | 'mestre_espioes';

export type ConselheiroReino = {
  cargo: CargoConselho;
  npcId: string;
  nome: string;
  lealdade: number; // 0 a 100
  competencia: number; // Baseado no atributo principal do cargo
  corrupcao: number; // 0 a 100
  dataNomeacao: number;
};

export type PatenteMilitar = 'recruta' | 'cabo' | 'sargento' | 'capitao' | 'mestre_espioes';
export type DesignacaoOficial = 'guarda_castelo' | 'patrulha_ruas' | 'escolta_caravanas' | 'infiltracao_externa';

export type OficialReino = {
  id: string;
  npcId: string;
  nome: string;
  patente: PatenteMilitar;
  designacao: DesignacaoOficial;
  experiencia: number;
  vitorias: number;
  lealdade: number;
  vivo: boolean;
};

export type CasamentoReino = {
  conjugeNpcId: string;
  nomeConjuge: string;
  dataCasamento: number;
  afeto: number; // 0 a 100
  diasUltimoEncontro: number;
};

export type GestacaoReino = {
  ativa: boolean;
  diaInicio: number;
  diaPrevisaoParto: number; // Ex: diaInicio + 270 (9 meses)
  progenitorId: string;
  nomeMae: string;
  saudeFeto: number; // 0 a 100
};

export type VocacaoHerdeiro =
  | 'estrategista'
  | 'combatente'
  | 'diplomata'
  | 'batedor'
  | 'guardiao'
  | 'erudito'
  | 'equilibrado';

export type FilhoHerdeiro = {
  id: string;
  nome: string;
  idadeAnos: number;
  diaNascimento: number;
  genero: 'm' | 'f';
  vivo: boolean;
  atributos: Atributos;
  legitimidade: 'legitimo' | 'bastardo';
  vocacao?: VocacaoHerdeiro;
  inclinacao?: string;
};

export type LordeVassalo = {
  id: string;
  npcId: string;
  nomeLorde: string;
  feudoCedidoId: string;
  nomeFeudo: string;
  lealdade: number; // 0 a 100
  tributoDiario: number;
  levasMilitares: number;
  opiniaoSuserano: number; // -100 a +100
};

export type TramaReino = {
  id: string;
  tipo: 'usurpacao_cidade' | 'golpe_interno' | 'sabotagem_muralhas';
  alvoLocalId: string;
  alvoNome: string;
  liderNpcId: string;
  liderNome: string;
  progresso: number; // 0 a 100%
  segredo: boolean;
  descoberta: boolean;
};

export type CasaDinastica = {
  fundada: boolean;
  nome: string;
  lema: string;
  brasaoCorPrimaria: string;
  brasaoCorSecundaria: string;
  brasaoFigura: string; // 'lobo' | 'leao' | 'dragao' | 'aguia' | 'torre' | 'espada' | 'serpente'
  prestigio: number;
};

export type FeudoState = {
  fundado: boolean;
  // Planta da roça (engine/cultivos.ts) e até que dia ela ainda está brotando.
  cultivo?: string;
  replantioAte?: number;
  nome: string;
  localId: string;
  bioma: BiomaFeudo;
  tierReino: number; // 1 a 10+
  populacao: number;
  capacidadeHabitacional: number;
  tesouro: number;
  materiais: number;
  comida: number;
  remedios: number;
  seguranca: number;
  estabilidade: number;
  edificios: Record<TipoEdificioModular, number>;
  obrasEmAndamento: ObraAtiva[];
  rotasComerciais: RotaComercial[];
  rotasPatrulha: RotaPatrulha[];
  historicoEventos: { dia: number; texto: string }[];
  decretosAtivos?: string[];

  // Expansão Dinástica, Política & Militar (Estilo Crusader Kings 3)
  casaDinastica?: CasaDinastica;
  conselho?: Record<CargoConselho, ConselheiroReino | undefined>;
  oficiais?: OficialReino[];
  casamento?: CasamentoReino;
  gestacao?: GestacaoReino;
  filhosHerdeiros?: FilhoHerdeiro[];
  herdeiroAparenteId?: string;
  vassalos?: LordeVassalo[];
  tramasAtivas?: TramaReino[];
  guerraDeclaradaAlvoId?: string;

  // Colônia num lugar real do mapa (engine/colonia.ts, sessão 57).
  /** Id do sítio (content/vaelhorn/sitios.ts); ausente = regra antiga. */
  sitio?: string;
  /** Casas com quem há acordo (ex.: 'tessel' deixa de levar o quinto do trigo). */
  acordos?: string[];
  farolAceso?: boolean;
  // Gente com nome, quem espera à porta e o renome (engine/colonos.ts).
  colonos?: import('./colonos').Colono[];
  chegadas?: import('./colonos').ChegadaPendente[];
  renome?: number;
  seqColonos?: number;
  /** Animais da colônia por espécie (etapa C). */
  rebanhos?: Record<string, number>;
  /** Frações de cria acumuladas na primavera, por espécie (engine/rebanhos.ts). */
  criasAcumuladas?: Record<string, number>;
  /** Animais comprados na estação corrente: a região só vende tantos por estação. */
  comprasAnimais?: { estacao: string; qtd: Record<string, number> };
  /** Pedido de audiência esperando resposta (engine/audiencias.ts). */
  audiencia?: import('./audiencias').Audiencia;
  ultimaAudiencia?: number;
  /** Última vez que a guarda da região veio cobrar o senhor (engine/audiencias.ts). */
  ultimaExigenciaGuarda?: number;
  seqAudiencias?: number;
  /** Até que dia a colônia está em meia ração (60% do consumo). */
  racionamentoAte?: number;
  /** Ameaça anunciada e o que a assembleia decidiu (engine/ameacas.ts). */
  ameaca?: import('./ameacas').AmeacaColonia;
  ultimaAmeaca?: number;
  /** Marcos de renome que já trouxeram enviado (engine/renome.ts). */
  marcosRenome?: number[];
  /** Casas cujo enviado foi recusado: vêm cobrar mais cedo. */
  casasHostis?: string[];
  seqAmeacas?: number;
  /** Relatório da última batalha, para a tela. */
  ultimaBatalha?: { dia: number; nome: string } & import('./ameacas').ResultadoBatalha;
  ultimoRelatorio?: { dia: number } & import('./colonia').RelatorioDia;
};

// ── Contratos de Caça a Monstros (Estilo The Witcher) & Treinos Imersivos
export type PistaMonstro = {
  id: string;
  descricao: string;
  encontrada: boolean;
  periciaNecessaria?: string;
  dificuldade?: number;
};

export type ContratoMonstro = {
  id: string;
  titulo: string;
  contratante: string;
  localId: string;
  monstroNome: string;
  criaturaId: string;
  categoriaAlvo: 'fera' | 'morto_vivo' | 'oni' | 'monstro';
  fraquezaOleo: string; // id do item de óleo recomendado (ex: 'oleo_anti_besta')
  recompensaMoedas: number;
  recompensaXp: number;
  descricao: string;
  pistas: PistaMonstro[];
  estado: 'disponivel' | 'investigando' | 'pronto_para_confronto' | 'concluido';
  trofeuId: string;
};

export type TrofeuMonstro = {
  id: string;
  contratoId: string;
  nome: string;
  descricao: string;
  bonusPermanente: {
    pericia?: string;
    valor?: number;
    respeitoFaccoes?: string[];
  };
};

export type ContratosMonstroCampanha = {
  contratos: Record<string, ContratoMonstro>;
  trofeus: TrofeuMonstro[];
  oleoAtivo?: {
    tipoAlvo: 'fera' | 'morto_vivo' | 'oni' | 'monstro';
    bonusDano: number;
    combatesRestantes: number;
    nomeOleo: string;
  };
};

export type TipoTreinoImersivo =
  | 'katas_cinco_elementos'
  | 'calejamento_palma_ferro'
  | 'meditacao_sob_cascata'
  | 'esgrima_duas_espadas_niten';

// ── Bandos de salteadores (engine/bandos.ts) ──────────────────────────────
export type CapitaoBando = {
  nome: string;
  /** Alcunha que o vale dá depois do que aconteceu com ele. */
  alcunha?: string;
  nivel: number;
  vivo: boolean;
  preso?: boolean;
  /** Marcas de combates com o jogador. Cada uma o deixa mais fraco. */
  cicatrizes: string[];
  /** Tipo de dano que o derrubou: da próxima vez ele vem preparado contra ele. */
  adaptacao?: string;
  rancor: number;
  derrotas: number;
  vitorias: number;
  /** Dia até o qual está se recuperando; depois disso, volta. */
  recuperarAte?: number;
  /** Quer o jogador em pessoa: a próxima emboscada é dele. */
  caca?: boolean;
};

export type Bando = {
  id: string;
  nome: string;
  regiao: string;
  esconderijo: string;
  esconderijoConhecido: boolean;
  pistas: number;
  membros: number;
  tesouro: number;
  pedagio: boolean;
  estado: 'ativo' | 'disperso' | 'destruido';
  capitao: CapitaoBando;
  ultimoRecrutamento: number;
};

export type EstadoBandos = { bandos: Record<string, Bando> };

/** O que a guarda de uma região quer com o jogador (engine/guarda.ts). */
export type ProcuraGuarda = {
  gravidade: 'arruaca' | 'sangue';
  pontos: number;
  motivo: string;
  atualizadoDia: number;
  ultimaAbordagemDia?: number;
  fugitivo?: boolean;
};

/** NPC fugido da cela, com cartaz na cidade (engine/crimeUrbano.ts). */
export type ProcuradoNpc = {
  crime: string;
  cidade: string;
  regiao: string;
  recompensa: number;
  vivoOuMorto: boolean;
  desdeDia: number;
  /** Onde se escondeu (lugar de ermo da região). */
  esconderijo: string;
};

/** O caçador de recompensas da região: nome, força e o que lembra do jogador. */
export type CacadorRecompensa = {
  nome: string;
  nivel: number;
  encontros: number;
  vivo: boolean;
  mortoDia?: number;
  ultimo?: 'fugiu' | 'pagou' | 'escapou' | 'entregou';
  pagamentos: number;
};
