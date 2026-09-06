// ARCANUM · Aptidão, maestria e o que o mundo acha de você.
//
// Cinco coisas diferentes que o jogo tratava como uma só. Antes, "prodígio"
// era `genese.marca === 'genio'`, valia +1 em cada atributo e todo mundo já
// nascia sabendo. Aqui elas se separam:
//
//   APTIDÃO   — potencial de aprendizado num domínio. OCULTA. Nunca sai da
//               engine para o narrador nem para NPC nenhum.
//   MAESTRIA  — habilidade que a pessoa de fato tem hoje. Ganha com treino.
//   EXPOSIÇÃO — quanto daquilo já foi demonstrado na frente de alguém.
//   REPUTAÇÃO — o que as pessoas ACREDITAM sobre você naquele domínio. Pode
//               estar errada, para mais ou para menos.
//   FAMA      — até onde essa crença viajou.
//
// Um espadachim excepcional que nunca sacou a lâmina em público tem aptidão
// 96, maestria 80, exposição 0, reputação 0 e fama 0. O mundo não tem como
// saber, e o sistema não deixa ele saber.

/** Domínios de aptidão. Mapeiam o vocabulário de perícias que já existe. */
export const DOMINIOS = [
  'espada',
  'arcano',
  'estrategia',
  'alquimia',
  'diplomacia',
  'percepcao',
  'medicina',
  'furtividade',
  'oficio',
] as const;
export type Dominio = (typeof DOMINIOS)[number];

export const NOME_DOMINIO: Record<Dominio, string> = {
  espada: 'lâmina',
  arcano: 'arcano',
  estrategia: 'estratégia',
  alquimia: 'alquimia',
  diplomacia: 'diplomacia',
  percepcao: 'percepção',
  medicina: 'medicina',
  furtividade: 'furtividade',
  oficio: 'ofício',
};

/**
 * Faixas internas de aptidão. Nomes existem para a engine raciocinar e para o
 * texto de um observador competente — o NÚMERO nunca é mostrado.
 */
export type FaixaAptidao =
  | 'comum'
  | 'competente'
  | 'talentoso'
  | 'excepcional'
  | 'prodigio'
  | 'prodigio_extraordinario'
  | 'fenomeno_historico';

/** O que um observador específico acredita sobre um domínio do jogador. */
export type Crenca = {
  /** Maestria estimada, 0-100. Pode estar errada nos dois sentidos. */
  valor: number;
  /** Quanto essa pessoa confia na própria estimativa, 0-100. */
  confianca: number;
  /**
   * Suspeita de talento anormal: sobe quando o observador vê alguém aprender
   * ou executar rápido demais para a experiência aparente. É isso, e não a
   * aptidão real, que faz um mestre dizer "esse aí é diferente".
   */
  suspeita: number;
  ultimoDia: number;
  /** Quantas demonstrações essa pessoa realmente presenciou. */
  observacoes: number;
};

/** Um degrau de reação do mundo que já foi disparado, para não repetir. */
export type ReacaoDisparada = {
  dominio: Dominio;
  degrau: number;
  dia: number;
};

export type AptidaoState = {
  versao: 1;
  /** OCULTO. 0-100 por domínio. Não exponha em contexto de narrador. */
  aptidao: Record<Dominio, number>;
  /** Esforço acumulado. Maestria é derivada dele por curva de saturação. */
  esforco: Record<Dominio, number>;
  /** 0-100. Quanto já foi demonstrado na frente de testemunhas. */
  exposicao: Record<Dominio, number>;
  /** 0-100. O que o público em geral acredita. */
  reputacao: Record<Dominio, number>;
  /**
   * Maior reputação já alcançada em cada domínio. A fama persegue a reputação
   * quando ela sobe, mas quando ela cai a fama desce devagar — quem já foi
   * grande continua sendo lembrado. Este é o teto real da fama.
   */
  picoReputacao: Record<Dominio, number>;
  /** 0-100. Alcance dessa crença pelo mundo. */
  fama: Record<Dominio, number>;
  /** Crença por observador: `crencas[npcId][dominio]`. */
  crencas: Record<string, Partial<Record<Dominio, Crenca>>>;
  /** O jogador está se contendo de propósito. */
  ocultando: boolean;
  /** Sessões de treino por domínio, para medir ritmo de aprendizado. */
  sessoes: Record<Dominio, number>;
  /** Degraus de reação do mundo já disparados. */
  reacoes: ReacaoDisparada[];
};
