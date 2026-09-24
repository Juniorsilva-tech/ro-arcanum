import type { Campaign } from './types';

// RPG adaptation for already-earned awakenings, not a Demon Slayer Mark.
// Birth potential alone never grants these multipliers. Known story milestones do.
export const LEGADOS = {
  venceu_oni_ancestral: { nome: 'Despertar ancestral', vida: 1.2, dano: 1.25, descricao: 'A sobrevivência à caçada ancestral fortaleceu seu corpo e sua execução.' },
  dominou_prova_eclipse: { nome: 'Legado do eclipse', vida: 1.1, dano: 1.15, descricao: 'Maestria elevada e a vitória na prova do eclipse consolidaram uma técnica própria.' },
  // Limiares acrescentados na sessão 20. Não são coletáveis: cada um é
  // concedido uma única vez, por atravessar algo que a história cobra caro.
  maestria_consumada: { nome: 'Maestria consumada', vida: 1.1, dano: 1.3, descricao: 'Anos de repetição obstinada num único ofício. O corpo entendeu o que a cabeça já sabia.' },
  derrubou_uma_lua: { nome: 'Quem derrubou uma Lua', vida: 1.25, dano: 1.3, descricao: 'Enfrentou um dos doze e voltou. Pouquíssima gente no mundo pode dizer o mesmo.' },
  a_perda: { nome: 'O que ficou da perda', vida: 1.15, dano: 1.2, descricao: 'Alguém do seu sangue não voltou. O que sobrou disso não é força — é a ausência de hesitação.' },
  cacada_impossivel: { nome: 'A caçada impossível', vida: 1.3, dano: 1.25, descricao: 'A besta que fechava a mata profunda desde antes dos reinos. Ninguém esperava que caísse.' },
  // Limiares sociais (sessão 21). Os únicos que não passam por matar nem por
  // treinar sozinho: dependem de outra pessoa — quem ensinou, ou quem contou.
  mestre_esgotado: { nome: 'O aluno que passou', vida: 1.15, dano: 1.25, descricao: 'Aprendeu tudo que um mestre tinha. A partir daqui o caminho não tem mais quem o mostre.' },
  nome_conhecido: { nome: 'O nome que corre sozinho', vida: 1.2, dano: 1.2, descricao: 'Dizem seu nome em lugares onde você nunca pôs os pés. Isso abre portas e atrai coisas.' },
  // A Marca do Caçador: combustão da vitalidade em troca de poder fulminante.
  marca_do_cacador: { nome: 'Marca do Caçador', vida: 1.25, dano: 1.4, descricao: 'A queimação vital gravada na pele. Cortes fulminantes e percepção transparente, cobrados na expectativa do corpo.' },
} as const;

// Contida na Casa Sem Nome (engine/marca.ts), a Marca troca a chama pelo
// tempo: o corpo para de pagar o tributo, e ela deixa de ser o maior legado.
export const MARCA_CONTIDA = { nome: 'Marca contida', vida: 1.1, dano: 1.15, descricao: 'A Marca desbotou até virar uma cicatriz morna. O corpo parou de pagar o tributo; a chama que cortava não volta mais do mesmo jeito.' } as const;

export function legadosConquistados(camp: Campaign) {
  return Object.entries(LEGADOS).filter(([id]) => camp.despertares?.includes(id)).map(([id, regra]) =>
    id === 'marca_do_cacador' && camp.marca?.contida ? { id, ...MARCA_CONTIDA } : { id, ...regra });
}

export function multiplicadoresDeIdentidade(camp: Campaign): { vida: number; dano: number } {
  // Strongest benefit, not an unbounded product of collectible buffs.
  const lista = legadosConquistados(camp);
  return { vida: Math.max(1, ...lista.map(l => l.vida)), dano: Math.max(1, ...lista.map(l => l.dano)) };
}
