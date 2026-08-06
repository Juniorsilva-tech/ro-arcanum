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

// Os nove cenários do GDD §6. Só Vaelhorn está jogável no MVP.
export const cenariosDisponiveis: CenarioDisponivel[] = [
  { id: 'vaelhorn', nome: 'Vaelhorn', genero: 'Medieval sombrio', pressoes: 'Sanidade · Corrupção', premium: false, disponivel: true, bundle: conteudoVaelhorn, acentoCor: '#CFA82D' },
  { id: 'casa_dos_fados', nome: 'A Casa dos Fados', genero: 'Mitologia egeia', pressoes: 'Húbris · Miasma', premium: false, disponivel: false, acentoCor: '#5FA187' },
  { id: 'nove_raizes', nome: 'As Nove Raízes', genero: 'Mitologia nórdica', pressoes: 'Honra · Presságio', premium: true, disponivel: false, acentoCor: '#A0917A' },
  { id: 'coroa_de_junco', nome: 'A Coroa de Junco', genero: 'Egito antigo', pressoes: 'Maat · Putrefação', premium: true, disponivel: false, acentoCor: '#CFA82D' },
  { id: 'purpura', nome: 'Púrpura', genero: 'Roma tardia', pressoes: 'Dignitas · Suspeita', premium: true, disponivel: false, acentoCor: '#8272AE' },
  { id: 'linha_vermelha', nome: 'Linha Vermelha', genero: 'Atualidade urbana', pressoes: 'Exposição · Consciência', premium: true, disponivel: false, acentoCor: '#BF4E31' },
  { id: 'pele', nome: 'Pele', genero: 'Intimidade contemporânea', pressoes: 'Vulnerabilidade · Reputação', premium: true, disponivel: false, acentoCor: '#C77E8A' },
  { id: 'nove_selos', nome: 'Nove Selos', genero: 'Alta fantasia', pressoes: 'Ressonância · Desgaste', premium: true, disponivel: false, acentoCor: '#5FA187' },
  { id: 'ceu_partido', nome: 'Céu Partido', genero: 'Cultivo chinês', pressoes: 'Carma · Demônio Interior', premium: true, disponivel: false, acentoCor: '#5FA187' },
];

export function bundlePorId(id: string): ContentBundle | undefined {
  return cenariosDisponiveis.find((c) => c.id === id)?.bundle;
}

export { conteudoVaelhorn };
export { encontrosPorTipo } from './vaelhorn/bestiary';
