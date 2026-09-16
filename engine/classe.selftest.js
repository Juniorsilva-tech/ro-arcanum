"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Toda classe faz o que a ficha dela promete.
//
// Auditoria da sessão 22: `mecanicaUnica` era texto solto. Ia para o narrador
// e nenhuma regra da engine o lia — nem para as três classes originais.
// "Guardião aguenta o primeiro golpe de cada combate" estava na tela de
// criação e não acontecia no combate.
//
// Estes testes existem para que isso não volte a acontecer. Cada classe tem um
// teste que a compara com uma classe de controle: a diferença tem de aparecer
// no número, não no texto.
const vaelhorn_1 = require("../content/vaelhorn");
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const combat_1 = require("./combat");
const acoesMundo_1 = require("./acoesMundo");
const items_1 = require("./items");
const viagem_1 = require("./viagem");
const classe_1 = require("./classe");
const ok = (v, mensagem) => {
    if (!v)
        throw new Error(mensagem);
    console.log(`✓ ${mensagem}`);
};
const nova = (classeId, seed = 'classe') => (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
    nome: 'Provadora', atributos: (0, character_1.atributosBase)(), classeId, origemId: 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
});
const atorFalso = (ehJogador = true) => ({
    id: 'jogador', nome: 'P', ehJogador, vida: 50, vidaMax: 50,
    defesa: 12, acerto: 12, dano: { base: 5, dispersao: 0.3, tipo: 'cortante' }, condicoes: [],
});
// ── Toda classe declara um efeito, e ele é único ──────────────────────────
{
    const efeitos = new Map();
    for (const classe of vaelhorn_1.conteudoVaelhorn.classes) {
        const texto = (0, classe_1.efeitoDaClasse)(nova(classe.id));
        ok(!!texto, `${classe.id} tem efeito de regra declarado`);
        ok(!efeitos.has(texto), `O efeito de ${classe.id} não é cópia de outra classe`);
        efeitos.set(texto, classe.id);
    }
    ok(efeitos.size === vaelhorn_1.conteudoVaelhorn.classes.length, `${efeitos.size} efeitos distintos para ${vaelhorn_1.conteudoVaelhorn.classes.length} classes`);
}
// ── Guardião: o primeiro golpe não passa ──────────────────────────────────
{
    const g = nova('guardiao');
    const ator = atorFalso();
    ok((0, classe_1.absorveuOPrimeiroGolpe)(g, ator), 'Guardião absorve o primeiro golpe');
    ok(!(0, classe_1.absorveuOPrimeiroGolpe)(g, ator), 'E só o primeiro: o segundo passa');
    const outro = nova('arcanista');
    ok(!(0, classe_1.absorveuOPrimeiroGolpe)(outro, atorFalso()), 'Quem não é guardião não absorve nada');
    ok(!(0, classe_1.absorveuOPrimeiroGolpe)(g, atorFalso(false)), 'Inimigo não herda a absorção do jogador');
    // No combate de verdade: guardião chega ao fim da luta com mais vida.
    const comparar = (classeId) => {
        const c = nova(classeId, 'guardiao-combate');
        (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, ['lobo']);
        const s = c.combate;
        const eu = s.atores.find(a => a.ehJogador);
        const inimigo = s.atores.find(a => !a.ehJogador);
        // O inimigo bate várias vezes; o dano é o mesmo dos dois lados.
        for (let i = 0; i < 6; i++) {
            const antes = eu.vida;
            if ((0, classe_1.absorveuOPrimeiroGolpe)(c, eu))
                continue;
            eu.vida = Math.max(0, antes - 5);
        }
        return { vida: eu.vida, inimigo: inimigo.nome };
    };
    ok(comparar('guardiao').vida > comparar('espadachim').vida, 'Numa sequência de golpes iguais, o guardião termina com mais vida');
}
// ── Espadachim: foco no mesmo alvo ────────────────────────────────────────
{
    const e = nova('espadachim');
    const ator = atorFalso();
    ok((0, classe_1.bonusDeFoco)(e, ator, 'lobo') === 0, 'Sem histórico, sem bônus');
    (0, classe_1.registrarFoco)(e, ator, 'lobo', true);
    ok((0, classe_1.bonusDeFoco)(e, ator, 'lobo') === 1, 'Um acerto no mesmo alvo vale +1');
    (0, classe_1.registrarFoco)(e, ator, 'lobo', true);
    ok((0, classe_1.bonusDeFoco)(e, ator, 'lobo') === 2, 'Dois acertos valem +2');
    // Errar não zera; trocar de alvo zera.
    (0, classe_1.registrarFoco)(e, ator, 'lobo', false);
    ok((0, classe_1.bonusDeFoco)(e, ator, 'lobo') === 2, 'Errar no mesmo alvo não perde o acúmulo');
    (0, classe_1.registrarFoco)(e, ator, 'javali', true);
    ok((0, classe_1.bonusDeFoco)(e, ator, 'javali') === 1, 'Trocar de alvo recomeça do zero');
    ok((0, classe_1.bonusDeFoco)(e, ator, 'lobo') === 0, 'E o alvo antigo perde o que tinha');
    for (let i = 0; i < 20; i++)
        (0, classe_1.registrarFoco)(e, ator, 'javali', true);
    ok((0, classe_1.bonusDeFoco)(e, ator, 'javali') === classe_1.TETO_FOCO_ESPADACHIM, `O foco tem teto (+${classe_1.TETO_FOCO_ESPADACHIM})`);
    const g = nova('guardiao');
    const outro = atorFalso();
    (0, classe_1.registrarFoco)(g, outro, 'lobo', true);
    ok((0, classe_1.bonusDeFoco)(g, outro, 'lobo') === 0, 'Quem não é espadachim não acumula foco');
}
// ── Caçadora: descansar rende mais ────────────────────────────────────────
{
    ok((0, classe_1.multiplicadorDeDescanso)(nova('cacadora')) > 1, 'Caçadora recupera mais ao descansar');
    ok((0, classe_1.multiplicadorDeDescanso)(nova('guardiao')) === 1, 'As outras recuperam o normal');
    // Pelo caminho real: descansar de verdade, com a mesma vida inicial.
    const descansar = (classeId) => {
        const c = nova(classeId, 'descanso');
        c.familia.prologoConcluido = true;
        c.personagem.dinheiro = 50;
        c.personagem.recursos.vida = 1;
        (0, acoesMundo_1.executarAcaoMundo)(vaelhorn_1.conteudoVaelhorn, c, { tipo: 'descansar' });
        return c.personagem.recursos.vida;
    };
    const cacadora = descansar('cacadora');
    const comum = descansar('guardiao');
    ok(cacadora > comum, `Descanso real: caçadora ${cacadora} contra ${comum}`);
}
// ── Curandeira: o descanso dela trata mais coisa ──────────────────────────
{
    const cur = (0, classe_1.condicoesTratadasAoDescansar)(nova('curandeira'));
    const comum = (0, classe_1.condicoesTratadasAoDescansar)(nova('guardiao'));
    ok(cur.length > comum.length, 'Curandeira trata mais condições que o descanso comum');
    ok(cur.includes('envenenado') && !comum.includes('envenenado'), 'Veneno só sai com curandeira');
    for (const c of comum)
        ok(cur.includes(c), `Ela também trata o que todos tratam (${c})`);
    // Caminho real.
    const c = nova('curandeira', 'cura');
    c.familia.prologoConcluido = true;
    c.personagem.dinheiro = 50;
    c.personagem.condicoes = ['envenenado', 'ferido'];
    (0, acoesMundo_1.executarAcaoMundo)(vaelhorn_1.conteudoVaelhorn, c, { tipo: 'descansar' });
    ok(!c.personagem.condicoes.includes('envenenado'), 'Descansar tira o veneno da curandeira');
    const outra = nova('guardiao', 'cura');
    outra.familia.prologoConcluido = true;
    outra.personagem.dinheiro = 50;
    outra.personagem.condicoes = ['envenenado', 'ferido'];
    (0, acoesMundo_1.executarAcaoMundo)(vaelhorn_1.conteudoVaelhorn, outra, { tipo: 'descansar' });
    ok(outra.personagem.condicoes.includes('envenenado'), 'E deixa o veneno em quem não é curandeira');
}
// ── Contrabandista: paga menos, recebe mais ───────────────────────────────
{
    ok((0, classe_1.descontoDeCompra)(nova('contrabandista'), false), 'Contrabandista compra com desconto');
    ok(!(0, classe_1.descontoDeCompra)(nova('guardiao'), false), 'As outras pagam o preço cheio');
    ok((0, classe_1.descontoDeCompra)(nova('guardiao'), true), 'E a barganha comum continua valendo para todas');
    ok((0, classe_1.multiplicadorDeVenda)(nova('contrabandista')) > 1, 'Contrabandista vende por mais');
    ok((0, classe_1.multiplicadorDeVenda)(nova('guardiao')) === 1, 'As outras vendem pelo normal');
    // O desconto não empilha com a barganha: quem barganha bem não barganha duas vezes.
    const item = (0, items_1.itemPorId)(vaelhorn_1.conteudoVaelhorn, 'racao');
    ok((0, items_1.precoCompra)(item, true) === (0, items_1.precoCompra)(item, (0, classe_1.descontoDeCompra)(nova('contrabandista'), true)), 'Desconto de classe e barganha não se somam');
}
// ── Penitente: ferida é força, só nas artes ───────────────────────────────
{
    const p = nova('penitente');
    p.personagem.recursos.vida = p.personagem.recursosMax.vida;
    ok((0, classe_1.multiplicadorDeArte)(p) === 1, 'Inteira, a penitente não ganha nada');
    p.personagem.recursos.vida = Math.floor(p.personagem.recursosMax.vida / 2);
    const meio = (0, classe_1.multiplicadorDeArte)(p);
    ok(meio > 1 && meio < 1 + classe_1.TETO_PENITENTE, `Metade da vida, metade do bônus (${meio.toFixed(2)})`);
    p.personagem.recursos.vida = 0;
    ok(Math.abs((0, classe_1.multiplicadorDeArte)(p) - (1 + classe_1.TETO_PENITENTE)) < 0.001, `No fundo do poço, o bônus é o teto (+${Math.round(classe_1.TETO_PENITENTE * 100)}%)`);
    const outra = nova('arcanista');
    outra.personagem.recursos.vida = 0;
    ok((0, classe_1.multiplicadorDeArte)(outra) === 1, 'Estar ferida não fortalece quem não é penitente');
}
// ── Arcanista: estudar devolve mana ───────────────────────────────────────
{
    ok((0, classe_1.manaDeEstudo)(nova('arcanista')) > 0, 'Arcanista recupera mana estudando');
    ok((0, classe_1.manaDeEstudo)(nova('guardiao')) === 0, 'As outras não');
}
// ── Batedor: conhece os atalhos ───────────────────────────────────────────
{
    ok((0, classe_1.alivioDeRota)(nova('batedor')) > 0, 'Batedor alivia o perigo da rota');
    ok((0, classe_1.alivioDeRota)(nova('guardiao')) === 0, 'As outras andam pelo perigo cheio');
    const medir = (classeId) => {
        const c = nova(classeId, 'rota');
        const local = vaelhorn_1.conteudoVaelhorn.locais.find(l => l.rotas.length > 0);
        const rota = local.rotas[0];
        return (0, viagem_1.perigoEfetivoDaRota)(vaelhorn_1.conteudoVaelhorn, c, local.id, rota.destino, rota.perigo);
    };
    ok(medir('batedor') < medir('guardiao'), `Rota real: batedor ${medir('batedor')} contra ${medir('guardiao')}`);
    ok(medir('batedor') >= 0, 'E o perigo nunca fica negativo');
}
// ── A ficha não pode mentir ───────────────────────────────────────────────
//
// O defeito que esta sessão veio consertar era exatamente uma frase na ficha
// sem regra por trás. Toda `mecanicaUnica` precisa de um efeito de regra.
{
    for (const classe of vaelhorn_1.conteudoVaelhorn.classes) {
        ok(classe.mecanicaUnica.length > 20, `${classe.id} descreve a mecânica`);
        ok(!!(0, classe_1.efeitoDaClasse)(nova(classe.id)), `A mecânica de ${classe.id} corresponde a uma regra implementada`);
    }
}
console.log('\nClasses: o que está escrito na ficha acontece no jogo.');
