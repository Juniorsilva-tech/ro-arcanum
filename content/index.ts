// ARCANUM · Registro de cenários. Um cenário completo no MVP: Vaelhorn (GDD §37).
import type { ContentBundle } from '../engine/types';
import { conteudoVaelhorn } from './vaelhorn';

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

// Um mundo só: Vaelhorn. O registro chegou a listar oito outros cenários
// como placeholder de roadmap ("EM BREVE") — removidos por decisão de
// produto: nada de vitrine multi-mitologia antes de o primeiro mundo estar
// pronto. Reintroduzir cenários novos aqui é trabalho para quando Vaelhorn
// estiver maduro, não antes.
export const cenariosDisponiveis: CenarioDisponivel[] = [
  { id: 'vaelhorn', nome: 'Vaelhorn', genero: 'Medieval sombrio', pressoes: 'Sanidade · Corrupção', premium: false, disponivel: true, bundle: conteudoVaelhorn, acentoCor: '#CFA82D' },
];

export function bundlePorId(id: string): ContentBundle | undefined {
  return cenariosDisponiveis.find((c) => c.id === id)?.bundle;
}

export { conteudoVaelhorn };
export { encontrosPorTipo } from './vaelhorn/bestiary';
