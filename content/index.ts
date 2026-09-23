import type { ContentBundle } from '../engine/types';
import { conteudoVaelhorn } from './vaelhorn';
import { conteudoTsukimichi } from './tsukimichi';

export type CenarioDisponivel = {
  id: string;
  nome: string;
  genero: string;
  pressoes: string;
  premium: boolean;
  disponivel: boolean;
  bundle?: ContentBundle;
  acentoCor: string;
};

// Dois mundos independentes: Vaelhorn (campanha clássica medieval sombria)
// e Tsukimichi (expansão isekai com Tsige, Wasteland e Subespaço de Asora).
export const cenariosDisponiveis: CenarioDisponivel[] = [
  { id: 'vaelhorn', nome: 'Vaelhorn', genero: 'Medieval sombrio', pressoes: 'Sanidade · Corrupção', premium: false, disponivel: true, bundle: conteudoVaelhorn, acentoCor: '#CFA82D' },
  { id: 'tsukimichi', nome: 'Tsukimichi: O Novo Mundo', genero: 'Isekai Fantasia', pressoes: 'Sobrecarga de Mana · Presença', premium: false, disponivel: true, bundle: conteudoTsukimichi, acentoCor: '#5B9BD5' },
];

export function bundlePorId(id: string): ContentBundle | undefined {
  return cenariosDisponiveis.find((c) => c.id === id)?.bundle;
}

export { conteudoVaelhorn, conteudoTsukimichi };
export { encontrosPorTipo } from './vaelhorn/bestiary';

