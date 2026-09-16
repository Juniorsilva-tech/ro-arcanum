"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGADOS = void 0;
exports.legadosConquistados = legadosConquistados;
exports.multiplicadoresDeIdentidade = multiplicadoresDeIdentidade;
// RPG adaptation for already-earned awakenings, not a Demon Slayer Mark.
// Birth potential alone never grants these multipliers. Known story milestones do.
exports.LEGADOS = {
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
};
function legadosConquistados(camp) {
    return Object.entries(exports.LEGADOS).filter(([id]) => camp.despertares?.includes(id)).map(([id, regra]) => ({ id, ...regra }));
}
function multiplicadoresDeIdentidade(camp) {
    // Strongest benefit, not an unbounded product of collectible buffs.
    const lista = legadosConquistados(camp);
    return { vida: Math.max(1, ...lista.map(l => l.vida)), dano: Math.max(1, ...lista.map(l => l.dano)) };
}
