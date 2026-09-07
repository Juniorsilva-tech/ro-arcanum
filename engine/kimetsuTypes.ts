// Canon supplies identities and constraints; all numeric rules are RPG adaptations.
export type TecnicaCombate = {
  estilo: string;
  modo: 'corte' | 'guarda' | 'esquiva' | 'veneno' | 'area' | 'precisao';
  potencia: number;
  golpes?: number;
  nivelMinimo: number;
  exige?: string;
  recarga: number;
  descricaoRegra: string;
};

export type PerfilOni = {
  identidade?: string;
  arte: 'garras' | 'fios' | 'sono' | 'veneno' | 'faixas' | 'vasos' | 'emocoes' | 'bussola' | 'gelo' | 'lua' | 'biwa' | 'tambores' | 'sangue' | 'relampago' | 'ilusao' | 'armas' | 'bracos' | 'temari' | 'setas' | 'pantano';
  regeneracao: number; // fraction of maximum HP per own turn
  morte: 'nichirin' | 'gemeos' | 'sol';
  parceiro?: string;
  origem: 'canon_adaptado' | 'original';
};

export type RivalPersistente = {
  evolucao?: { nivel: number; servos: number; papel: 'errante' | 'predador' | 'agente'; plano: 'alimentar' | 'ocultar' | 'perseguir'; proximaAcao: number; ultimaEmboscada?: number; refugio: string; adaptacoes: Record<string, number> };
  id: string;
  criaturaId: string;
  nome: string;
  vivo: boolean;
  vida: number;
  local: string;
  ultimoDia: number;
  reencontros: number;
  vitorias: number;
  fugas: number;
  rancor: number;
  memoria: { dia: number; resultado: 'vitoria' | 'derrota' | 'fuga'; tecnica?: string; local?: string; testemunhas?: string[] }[];
  comportamento?: { recuperarAte: number; pista?: string; pistaAte: number; ultimoFeito: number; ultimaAmeacaPessoal: number };
};

export type KimetsuState = {
  versao: 1;
  sequencia: number;
  rivais: Record<string, RivalPersistente>;
};

export type EstadoTatico = {
  guarda?: number;
  esquiva?: number;
  veneno?: number;
  sono?: number;
  preso?: number;
  frio?: number;
  revelado?: boolean;
};
