"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFERENCIA = void 0;
exports.fatorCritico = fatorCritico;
exports.danoPorRodada = danoPorRodada;
exports.rodadasParaDerrubar = rodadasParaDerrubar;
exports.ofensiva = ofensiva;
exports.resiliencia = resiliencia;
exports.vantagemNoDuelo = vantagemNoDuelo;
exports.poderEfetivo = poderEfetivo;
exports.fichaDoJogador = fichaDoJogador;
exports.fichaDaCriatura = fichaDaCriatura;
exports.podeDerrotar = podeDerrotar;
exports.razaoDePoder = razaoDePoder;
exports.adversarioNaRazao = adversarioNaRazao;
exports.mensuravelPorDuelo = mensuravelPorDuelo;
exports.detalharPoder = detalharPoder;
exports.pesoDoEquipamento = pesoDoEquipamento;
const character_1 = require("./character");
const resolution_1 = require("./resolution");
const items_1 = require("./items");
const combat_1 = require("./combat");
/** O boneco. Fixo de propósito: mudar isso muda toda a escala histórica. */
exports.REFERENCIA = { defesa: 14, acerto: 14, dano: 8, dispersao: 0.3 };
/** Multiplicador médio de dano dada a janela de crítico (crítico vale 1,75×). */
function fatorCritico(janela) {
    const j = Math.max(0, Math.min(1, janela));
    return (1 - j) + j * 1.75;
}
/** Dano por rodada de um atacante contra uma defesa concreta. */
function danoPorRodada(atacante, alvo) {
    const p = (0, resolution_1.probabilidade)(atacante.acerto, alvo.defesa, 4);
    return p * atacante.dano.base * fatorCritico(atacante.janelaCritica ?? 0.25);
}
/**
 * Rodadas até o atacante derrubar o alvo. A regeneração do oni entra como
 * dano negativo — é assim que ela funciona no combate real (um turno dele
 * devolve `vidaMax × regeneracao`). Quem não supera a regeneração nunca
 * derruba, por mais tempo que passe: o resultado é infinito, e é honesto.
 */
function rodadasParaDerrubar(atacante, alvo) {
    const liquido = danoPorRodada(atacante, alvo) - (alvo.regeneracao ?? 0) * alvo.vida;
    return liquido <= 0 ? Infinity : alvo.vida / liquido;
}
/** Dano por rodada que esta ficha entrega no boneco de referência. */
function ofensiva(f) {
    return danoPorRodada(f, { ...f, defesa: exports.REFERENCIA.defesa });
}
/** Rodadas que esta ficha sobrevive ao boneco de referência. */
function resiliencia(f) {
    const boneco = {
        vida: 100, defesa: exports.REFERENCIA.defesa, acerto: exports.REFERENCIA.acerto,
        dano: { base: exports.REFERENCIA.dano, dispersao: exports.REFERENCIA.dispersao, tipo: 'referência' },
    };
    const r = rodadasParaDerrubar(boneco, f);
    return Number.isFinite(r) ? r : 9999;
}
/**
 * Vantagem de A sobre B num duelo: quantas vezes A derruba B mais rápido do
 * que B derruba A. 1,0 é equivalência real, 1,2 é vinte por cento de vantagem.
 *
 * Esta é a régua que a tabela de referência de vitória usa. Ela substituiu uma
 * primeira versão que media os dois lados contra um boneco fixo — método que
 * inflava absurdamente qualquer criatura com regeneração, porque contra o
 * boneco fraco ela era imortal, mesmo sendo fácil para um caçador de verdade.
 */
function vantagemNoDuelo(a, b) {
    const aDerruba = rodadasParaDerrubar(a, b);
    const bDerruba = rodadasParaDerrubar(b, a);
    if (!Number.isFinite(aDerruba))
        return 0;
    if (!Number.isFinite(bDerruba))
        return Infinity;
    return bDerruba / aDerruba;
}
/**
 * Poder efetivo. Escala livre — só a RAZÃO entre dois poderes tem significado.
 * A raiz mantém a régua num intervalo legível e faz "o dobro de poder" querer
 * dizer "o dobro de vantagem", não quatro vezes.
 */
function poderEfetivo(f) {
    return Math.sqrt(Math.max(0.0001, ofensiva(f) * resiliencia(f)));
}
/** Ficha do jogador como ele entra em combate hoje. */
function fichaDoJogador(content, camp) {
    const p = camp.personagem;
    return {
        vida: p.recursosMax.vida,
        defesa: (0, combat_1.defesaJogador)(content, camp),
        acerto: (0, combat_1.acertoJogador)(content, camp),
        dano: (0, combat_1.danoJogador)(content, camp),
        janelaCritica: (0, combat_1.janelaCriticaJogador)(camp),
    };
}
/** Ficha de uma criatura a partir do que o bestiário declara — nunca do nível. */
function fichaDaCriatura(c) {
    return {
        vida: c.vida,
        defesa: c.defesa,
        acerto: c.acerto,
        dano: c.dano,
        regeneracao: c.perfilOni?.regeneracao,
    };
}
/**
 * O jogador consegue, em princípio, encerrar esta criatura?
 *
 * Um oni comum só morre por decapitação com Nichirin (ver
 * `aplicarFerimentoOni`, em engine/kimetsu.ts): sem a lâmina certa ele volta a
 * 1 de vida indefinidamente, por mais dano que leve. Isso não é desequilíbrio,
 * é a regra do mundo — e é o exemplo mais claro de por que poder não se mede
 * por nível. Quem ignorar isto compara números que nunca vão se encontrar.
 */
function podeDerrotar(content, camp, c) {
    if (!c.oni)
        return true;
    if (c.perfilOni?.morte === 'sol')
        return false; // exige luz do dia, não lâmina
    return !!(0, items_1.armaEquipada)(content, camp.personagem)?.contraOni;
}
/**
 * Razão de poder entre jogador e criatura. 1,0 é equivalência; 1,2 é o jogador
 * 20% superior. É este número, e não a diferença de nível, que a tabela de
 * referência de vitória usa. Contra um alvo que o jogador não tem como
 * encerrar, a razão é 0: nenhuma quantidade de dano resolve.
 */
function razaoDePoder(content, camp, c) {
    if (!podeDerrotar(content, camp, c))
        return 0;
    return vantagemNoDuelo(fichaDoJogador(content, camp), fichaDaCriatura(c));
}
/**
 * Constrói um adversário artificial que fica exatamente na razão pedida contra
 * esta ficha. Existe porque a tabela de referência fala de RAZÃO DE PODER, e
 * validar a matemática do combate contra o bestiário confunde duas perguntas
 * diferentes: "a fórmula está certa?" e "o bestiário tem inimigo para este
 * nível?". Esta função responde a primeira; o relatório responde a segunda.
 */
function adversarioNaRazao(jogador, razao) {
    const defesa = jogador.defesa;
    const acerto = jogador.acerto;
    const r = Math.max(0.01, razao);
    // A diferença é dividida entre as duas metades do poder, não jogada toda no
    // dano. Um inimigo superior é mais duro E bate mais forte; concentrar tudo
    // numa metade produzia lutas decididas antes de começarem e afastava o
    // resultado da tabela de referência nas pontas.
    const fator = 1 / Math.sqrt(r);
    const vida = jogador.vida * fator;
    const alvoProvisorio = { vida, defesa, acerto, dano: { base: 1, dispersao: 0.3, tipo: 'aferição' } };
    const dprJogador = danoPorRodada(jogador, alvoProvisorio);
    const chance = (0, resolution_1.probabilidade)(acerto, jogador.defesa, 4);
    const base = (dprJogador * fator) / Math.max(0.001, chance * fatorCritico(0.25));
    return { vida, defesa, acerto, dano: { base, dispersao: 0.3, tipo: 'aferição' } };
}
/**
 * A régua de duelo pressupõe um contra um até alguém cair. Alvos que morrem
 * por regra própria — decapitação simultânea dos gêmeos, luz do sol — não são
 * mensuráveis assim, e incluí-los na aferição mediria a regra, não o balanço.
 */
function mensuravelPorDuelo(c) {
    const morte = c.perfilOni?.morte;
    return morte === undefined || morte === 'nichirin';
}
/** Explicação legível da conta, para depuração de balanceamento. */
function detalharPoder(f) {
    const o = ofensiva(f);
    const r = resiliencia(f);
    return `poder ${poderEfetivo(f).toFixed(1)} (dano/rodada ${o.toFixed(1)} × rodadas ${r.toFixed(1)})`;
}
/** Só para ferramentas: contribuição bruta do equipamento na ofensiva. */
function pesoDoEquipamento(content, camp) {
    const arma = (0, items_1.armaEquipada)(content, camp.personagem);
    const p = camp.personagem;
    const semArma = 3 + Math.max(0, (0, character_1.modificador)(p.atributos.fisico));
    return (arma?.dano?.base ?? semArma) + (0, items_1.bonusDefesaEquip)(content, p);
}
