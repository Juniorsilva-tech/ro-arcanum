// All numbers below are game rules, not claims about Demon Slayer canon.
export type TipoEdificio = 'lavoura' | 'moradias' | 'enfermaria' | 'muralha' | 'mercado';
export type CidadeViva = {
  comida: number; materiais: number; remedios: number; tesouro: number;
  edificios: Record<TipoEdificio, number>;
  projeto?: { tipo: TipoEdificio; progresso: number; necessario: number };
  fomeDias: number; doenca: number; inseguranca: number; secaAte: number;
  crise?: string; ultimoIncidente: number; governo?: string;
  estoque: Record<string, number>;
};
export type FatoHistorico = {
  id: string; dia: number; tipo: string; local: string; texto: string; atores: string[];
  causa?: { id: string; texto: string };
  conhecimento: 'oculto' | 'rumor' | 'testemunhado' | 'confirmado';
  publico: boolean;
};
export type MissaoViva = {
  id: string; tipo: 'abastecer' | 'tratar' | 'escoltar' | 'reconstruir' | 'resgatar' | 'investigar';
  titulo: string; local: string; destino?: string; ator?: string; rival?: string;
  causa: { id: string; texto: string }; prazo: number;
  criadaEm?: number; aceitaEm?: number; motivoPrazo?: string;
  estado: 'oferecida' | 'aceita' | 'concluida' | 'falhada' | 'resolvida_por_outros';
  etapa: number; conhecida: boolean; tentativas: number;
  recompensa: number; desfecho?: string;
};
export type VidaCivil = {
  casa: string; local: string; deslocado: boolean;
  viagem?: { destino: string; chegada: number };
  objetivo: 'rotina' | 'trabalhar' | 'tratar' | 'migrar' | 'treinar' | 'cacar' | 'cativo';
  moedas: number; fome: number; saude: number; habilidade: number; prestigio: number;
  proximaDecisao: number; parceiros: Record<string, number>;
  conjuge?: string; filhos: string[]; tutores?: string[]; cativoAte?: number;
  formacao?: { caminho: 'civil' | 'guarda'; sessoes: number; mentor?: string; concluida: boolean };
};
export type GovernoVivo = {
  lider?: string; legitimidade: number; sucessoes: number;
  relacoes: Record<string, number>; treguaAte: Record<string, number>;
};
export type MundoVivo = {
  versao: 1; ultimoDia: number; sequencia: number;
  cidades: Record<string, CidadeViva>; pessoas: Record<string, VidaCivil>;
  governos: Record<string, GovernoVivo>; fatos: FatoHistorico[]; missoes: MissaoViva[];
  arquivo: { ano: number; acontecimentos: number; tipos: Record<string, number> }[];
  diretor: { proximoIncidente: number; intensidade: number };
  contadores: Record<string, number>;
};
