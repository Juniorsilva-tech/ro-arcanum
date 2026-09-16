"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALIVIO_DE_ROTA_BATEDOR = exports.CLASSE_BATEDOR = exports.MANA_POR_ESTUDO = exports.CLASSE_ARCANISTA = exports.TETO_PENITENTE = exports.CLASSE_PENITENTE = exports.VANTAGEM_CONTRABANDISTA = exports.CLASSE_CONTRABANDISTA = exports.CLASSE_CURANDEIRA = exports.BONUS_DESCANSO_CACADORA = exports.CLASSE_CACADORA = exports.TETO_FOCO_ESPADACHIM = exports.CLASSE_ESPADACHIM = exports.CLASSE_GUARDIAO = void 0;
exports.classeDe = classeDe;
exports.absorveuOPrimeiroGolpe = absorveuOPrimeiroGolpe;
exports.bonusDeFoco = bonusDeFoco;
exports.registrarFoco = registrarFoco;
exports.multiplicadorDeDescanso = multiplicadorDeDescanso;
exports.condicoesTratadasAoDescansar = condicoesTratadasAoDescansar;
exports.descontoDeCompra = descontoDeCompra;
exports.multiplicadorDeVenda = multiplicadorDeVenda;
exports.multiplicadorDeArte = multiplicadorDeArte;
exports.manaDeEstudo = manaDeEstudo;
exports.alivioDeRota = alivioDeRota;
exports.efeitoDaClasse = efeitoDaClasse;
/** Chave da classe do personagem, ou string vazia. */
function classeDe(camp) {
    return camp.personagem.classeId ?? '';
}
// ── Guardião ──────────────────────────────────────────────────────────────
/**
 * O primeiro golpe de cada combate não passa.
 *
 * Absorve o dano uma vez por luta. A marca vive no ATOR do combate, não no
 * personagem: é por combate, e um save no meio da luta preserva se já foi
 * usada ou não.
 *
 * Por que absorver e não reduzir: a promessa escrita era "como se não fosse
 * nada". Meia redução seria outra frase.
 */
exports.CLASSE_GUARDIAO = 'guardiao';
function absorveuOPrimeiroGolpe(camp, alvo) {
    if (!alvo.ehJogador)
        return false;
    if (classeDe(camp) !== exports.CLASSE_GUARDIAO)
        return false;
    if (alvo.primeiroGolpeAbsorvido)
        return false;
    alvo.primeiroGolpeAbsorvido = true;
    return true;
}
// ── Espadachim ────────────────────────────────────────────────────────────
/**
 * Um alvo por vez. Cada golpe que acerta o MESMO inimigo facilita o seguinte.
 *
 * Acumula +1 de acerto por acerto consecutivo, até o teto. Trocar de alvo
 * zera — é isso que faz a classe ser sobre foco, e não sobre um bônus grátis
 * que cresce sozinho. O teto existe para a classe não virar acerto garantido
 * numa luta longa.
 */
exports.CLASSE_ESPADACHIM = 'espadachim';
exports.TETO_FOCO_ESPADACHIM = 4;
function bonusDeFoco(camp, atacante, alvoId) {
    if (!atacante.ehJogador || classeDe(camp) !== exports.CLASSE_ESPADACHIM)
        return 0;
    return atacante.focoAlvo === alvoId ? Math.min(exports.TETO_FOCO_ESPADACHIM, atacante.focoAcertos ?? 0) : 0;
}
function registrarFoco(camp, atacante, alvoId, acertou) {
    if (!atacante.ehJogador || classeDe(camp) !== exports.CLASSE_ESPADACHIM)
        return;
    if (atacante.focoAlvo !== alvoId) {
        atacante.focoAlvo = alvoId;
        atacante.focoAcertos = 0;
    }
    // Errar não zera o acúmulo: quem insiste no mesmo alvo continua insistindo.
    // Trocar de alvo zera, e é só isso que zera.
    if (acertou)
        atacante.focoAcertos = (atacante.focoAcertos ?? 0) + 1;
}
// ── Caçadora ──────────────────────────────────────────────────────────────
/**
 * O corpo obedece ao fôlego: descansar rende mais.
 *
 * A caçadora recupera metade a mais em cada descanso. Não é vida infinita —
 * é poder sair de novo na mesma noite.
 */
exports.CLASSE_CACADORA = 'cacadora';
exports.BONUS_DESCANSO_CACADORA = 1.5;
/** Multiplicador da recuperação de recursos ao descansar. */
function multiplicadorDeDescanso(camp) {
    return classeDe(camp) === exports.CLASSE_CACADORA ? exports.BONUS_DESCANSO_CACADORA : 1;
}
// ── Curandeira ────────────────────────────────────────────────────────────
/**
 * Cuidar rende: o descanso dela também limpa condições que o descanso comum
 * não limpa, e ela trata envenenamento em si mesma.
 */
exports.CLASSE_CURANDEIRA = 'curandeira';
const CONDICOES_QUE_A_CURANDEIRA_TRATA = ['envenenado', 'doente', 'infeccionado'];
function condicoesTratadasAoDescansar(camp) {
    const comuns = ['agonizante', 'ferido'];
    return classeDe(camp) === exports.CLASSE_CURANDEIRA
        ? [...comuns, ...CONDICOES_QUE_A_CURANDEIRA_TRATA]
        : comuns;
}
// ── Contrabandista ────────────────────────────────────────────────────────
/**
 * Conhece quem compra. Paga menos e recebe mais.
 *
 * Vinte por cento nos dois lados. É o mesmo desconto que a barganha já dava,
 * e por isso não empilha com ela: quem barganha bem não barganha duas vezes.
 */
exports.CLASSE_CONTRABANDISTA = 'contrabandista';
exports.VANTAGEM_CONTRABANDISTA = 0.2;
function descontoDeCompra(camp, jaTemDesconto) {
    return jaTemDesconto || classeDe(camp) === exports.CLASSE_CONTRABANDISTA;
}
function multiplicadorDeVenda(camp) {
    return classeDe(camp) === exports.CLASSE_CONTRABANDISTA ? 1 + exports.VANTAGEM_CONTRABANDISTA : 1;
}
// ── Penitente ─────────────────────────────────────────────────────────────
/**
 * Carrega o peso de propósito: quanto mais ferida, mais forte o que invoca.
 *
 * O bônus cresce com a vida PERDIDA. Cheia de vida ela não ganha nada; à
 * beira da morte, bate bem mais. É a única classe do jogo que premia estar
 * machucada, e por isso o teto importa: até 50% a mais, e só nas artes.
 */
exports.CLASSE_PENITENTE = 'penitente';
exports.TETO_PENITENTE = 0.5;
function multiplicadorDeArte(camp) {
    if (classeDe(camp) !== exports.CLASSE_PENITENTE)
        return 1;
    const p = camp.personagem;
    const max = p.recursosMax.vida || 1;
    const perdida = Math.max(0, Math.min(1, 1 - (p.recursos.vida ?? max) / max));
    return 1 + perdida * exports.TETO_PENITENTE;
}
// ── Arcanista ─────────────────────────────────────────────────────────────
/**
 * Mana gasta volta estudando. O verbo `estudar` devolve mana a ela, e só a
 * ela — para o resto do elenco estudar continua sendo só tempo passado.
 */
exports.CLASSE_ARCANISTA = 'arcanista';
exports.MANA_POR_ESTUDO = 3;
function manaDeEstudo(camp) {
    return classeDe(camp) === exports.CLASSE_ARCANISTA ? exports.MANA_POR_ESTUDO : 0;
}
// ── Batedor ───────────────────────────────────────────────────────────────
/**
 * Conhece as rotas e os atalhos: viaja mais seguro.
 *
 * Reduz o perigo efetivo de qualquer rota. Note que a ficha da classe dizia
 * outra coisa — "vê a oportunidade um período antes" — e essa frase foi
 * trocada de propósito na sessão 22: ela descrevia um sistema de oportunidades
 * que a engine não expõe, e manter a frase seria repetir o defeito que esta
 * sessão veio consertar. A regra implementada é a que a DESCRIÇÃO da classe
 * sempre prometeu: "conhece as rotas, os atalhos e quem anda por eles".
 */
exports.CLASSE_BATEDOR = 'batedor';
exports.ALIVIO_DE_ROTA_BATEDOR = 1.5;
function alivioDeRota(camp) {
    return classeDe(camp) === exports.CLASSE_BATEDOR ? exports.ALIVIO_DE_ROTA_BATEDOR : 0;
}
// ── Para a tela e para o narrador ─────────────────────────────────────────
/**
 * Descrição curta do efeito ATIVO, gerada da regra e não de um texto solto.
 * Se um dia a regra mudar e esta linha não mudar junto, o teste reclama.
 */
function efeitoDaClasse(camp) {
    switch (classeDe(camp)) {
        case exports.CLASSE_GUARDIAO: return 'O primeiro golpe de cada combate não passa.';
        case exports.CLASSE_ESPADACHIM: return `Cada acerto no mesmo alvo soma +1 de acerto, até +${exports.TETO_FOCO_ESPADACHIM}. Trocar de alvo zera.`;
        case exports.CLASSE_CACADORA: return 'Descansar recupera metade a mais.';
        case exports.CLASSE_CURANDEIRA: return 'Descansar também trata veneno, doença e infecção.';
        case exports.CLASSE_CONTRABANDISTA: return 'Compra 20% mais barato e vende 20% mais caro.';
        case exports.CLASSE_PENITENTE: return `Quanto mais ferida, mais forte a arte — até +${Math.round(exports.TETO_PENITENTE * 100)}%.`;
        case exports.CLASSE_ARCANISTA: return `Estudar devolve ${exports.MANA_POR_ESTUDO} de mana.`;
        case exports.CLASSE_BATEDOR: return `Conhece os atalhos: toda rota fica ${exports.ALIVIO_DE_ROTA_BATEDOR} menos perigosa.`;
        default: return undefined;
    }
}
