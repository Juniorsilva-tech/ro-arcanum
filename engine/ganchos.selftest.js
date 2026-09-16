"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Os ganchos escritos à mão virando missão.
//
// O mapa carrega mais de cem ganchos autorais — "o celeiro está cheio e a vila
// come pouco", "três rapazes não voltaram da última leva e a lista diz que
// voltaram". Até a sessão 21 eles só chegavam ao narrador como sabor de
// ambiente e morriam ali: nenhum gerava uma razão para o jogador ir a lugar
// nenhum.
//
// O que estes testes precisam garantir, em ordem de importância:
//  1. a missão herda a FICÇÃO do gancho, e não um rótulo procedural;
//  2. o gancho só queima quando o jogador se envolve — ignorá-lo não destrói
//     conteúdo escrito à mão;
//  3. rumor anda por rota, não por telepatia;
//  4. lugar oculto não vaza segredo antes de ser descoberto.
const vaelhorn_1 = require("../content/vaelhorn");
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const ganchos_1 = require("./ganchos");
const historiaViva_1 = require("./historiaViva");
const ok = (v, mensagem) => {
    if (!v)
        throw new Error(mensagem);
    console.log(`✓ ${mensagem}`);
};
const nova = (seed = 'ganchos') => {
    const c = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Teste', atributos: (0, character_1.atributosBase)(), classeId: 'guardiao', origemId: 'divida',
        seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
    });
    c.vivo ??= (0, historiaViva_1.iniciarMundoVivo)(vaelhorn_1.conteudoVaelhorn, c);
    return c;
};
/** Força o sorteio a acontecer, sem depender de 1% de chance por dia. */
function forcarGancho(c) {
    for (let i = 0; i < 4000; i++) {
        const q = (0, ganchos_1.processarGanchos)(vaelhorn_1.conteudoVaelhorn, c);
        if (q)
            return q;
    }
}
// ── O material existe ─────────────────────────────────────────────────────
{
    const total = vaelhorn_1.conteudoVaelhorn.locais.reduce((n, l) => n + (l.ganchos?.length ?? 0), 0);
    ok(total >= 80, `O mapa tem ganchos escritos à mão para usar (${total})`);
}
// ── A missão herda a ficção, não um rótulo ────────────────────────────────
{
    const c = nova('gancho-ficcao');
    const q = forcarGancho(c);
    ok(!!q, 'Um gancho conhecido vira missão');
    ok(q.tipo === 'investigar', 'Gancho vira missão de investigar');
    // O texto do gancho tem de estar na causa. É isso que separa esta missão de
    // uma procedural com nome bonito.
    const origem = vaelhorn_1.conteudoVaelhorn.locais
        .flatMap(l => (l.ganchos ?? []).map(g => ({ local: l.id, texto: g })))
        .find(g => g.texto === q.causa.texto);
    ok(!!origem, `A causa da missão é o texto literal de um gancho do mapa ("${q.causa.texto.slice(0, 40)}…")`);
    ok(q.local === origem.local, 'A missão acontece no lugar de onde veio o gancho');
    ok(q.titulo.length > 0 && q.titulo.length <= 43, `O título cabe numa linha ("${q.titulo}")`);
}
// ── Ignorar um gancho não destrói conteúdo autoral ────────────────────────
{
    const c = nova('gancho-ignorado');
    const q = forcarGancho(c);
    ok(!!q, 'Há missão de gancho para ignorar');
    const usadasAntes = Object.keys(c.flags).filter(k => k.startsWith('gancho.usado.')).length;
    ok(usadasAntes === 0, 'Oferecer não queima o gancho');
    // Vence sem ninguém aceitar.
    q.estado = 'falhada';
    c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
    (0, ganchos_1.conciliarGanchos)(c);
    const usadasDepois = Object.keys(c.flags).filter(k => k.startsWith('gancho.usado.')).length;
    ok(usadasDepois === 0, 'Gancho vencido sem ninguém aceitar NÃO é consumido');
    const frias = Object.keys(c.flags).filter(k => k.startsWith('gancho.frio.'));
    ok(frias.length === 1, 'Ele entra em carência em vez de sumir');
    ok(c.flags[frias[0]] > c.calendario.dia, `A carência olha para a frente (${ganchos_1.CARENCIA_DO_GANCHO} dias)`);
    // Durante a carência ele não volta à fila; depois dela, volta.
    const disponivelAgora = (0, ganchos_1.ganchosDisponiveis)(vaelhorn_1.conteudoVaelhorn, c).length;
    c.calendario = { ...c.calendario, dia: c.calendario.dia + ganchos_1.CARENCIA_DO_GANCHO + 1 };
    const disponivelDepois = (0, ganchos_1.ganchosDisponiveis)(vaelhorn_1.conteudoVaelhorn, c).length;
    ok(disponivelDepois > disponivelAgora, `O rumor esfria e volta a circular (${disponivelAgora} → ${disponivelDepois})`);
}
// ── Envolver-se queima o gancho, e para sempre ────────────────────────────
{
    const c = nova('gancho-aceito');
    const q = forcarGancho(c);
    q.estado = 'aceita';
    (0, ganchos_1.conciliarGanchos)(c);
    const usadas = Object.keys(c.flags).filter(k => k.startsWith('gancho.usado.'));
    ok(usadas.length === 1, 'Aceitar a missão consome o gancho');
    // E ele não volta nem depois de muito tempo: segredo revelado não volta a
    // ser segredo.
    const antes = (0, ganchos_1.ganchosDisponiveis)(vaelhorn_1.conteudoVaelhorn, c).map(g => `${g.local}#${g.indice}`);
    c.calendario = { ...c.calendario, dia: c.calendario.dia + ganchos_1.CARENCIA_DO_GANCHO * 5 };
    const depois = (0, ganchos_1.ganchosDisponiveis)(vaelhorn_1.conteudoVaelhorn, c).map(g => `${g.local}#${g.indice}`);
    const chave = usadas[0].replace('gancho.usado.', '');
    ok(!depois.some(x => x.replace('#', '.') === chave), 'Gancho consumido não ressurge nunca');
    ok(depois.length >= antes.length, 'O resto da fila continua lá');
}
// ── Rumor anda por rota ───────────────────────────────────────────────────
{
    const c = nova('gancho-alcance');
    const perto = new Set((0, ganchos_1.ganchosDisponiveis)(vaelhorn_1.conteudoVaelhorn, c).map(g => g.local));
    ok(perto.size > 0, `Há ganchos ao alcance de quem acabou de começar (${perto.size} lugares)`);
    const comGancho = vaelhorn_1.conteudoVaelhorn.locais.filter(l => l.ganchos?.length).length;
    ok(perto.size < comGancho, `Mas não o mapa inteiro (${perto.size} de ${comGancho} lugares com gancho)`);
    // Viajar amplia o alcance: é o que "ouvir na praça" significa.
    const novo = vaelhorn_1.conteudoVaelhorn.locais.find(l => l.ganchos?.length && !perto.has(l.id) && !l.oculto);
    if (novo) {
        c.locaisVisitados.push(novo.id);
        ok((0, ganchos_1.ganchosDisponiveis)(vaelhorn_1.conteudoVaelhorn, c).some(g => g.local === novo.id), `Pisar num lugar novo traz os ganchos dele (${novo.id})`);
    }
}
// ── Lugar oculto não vaza segredo ─────────────────────────────────────────
{
    const c = nova('gancho-oculto');
    const ocultos = vaelhorn_1.conteudoVaelhorn.locais.filter(l => l.oculto && l.ganchos?.length);
    ok(ocultos.length > 0, `Existem lugares ocultos com gancho (${ocultos.length})`);
    // Alcance máximo possível: o jogador já pisou em tudo que não é oculto.
    for (const l of vaelhorn_1.conteudoVaelhorn.locais)
        if (!l.oculto)
            c.locaisVisitados.push(l.id);
    const vazou = (0, ganchos_1.ganchosDisponiveis)(vaelhorn_1.conteudoVaelhorn, c).filter(g => ocultos.some(o => o.id === g.local));
    ok(vazou.length === 0, 'Nenhum gancho de lugar oculto entra na fila antes da descoberta');
    // Descoberto, o segredo passa a circular.
    const alvo = ocultos[0];
    c.flags[alvo.oculto.flag] = true;
    ok((0, ganchos_1.ganchosDisponiveis)(vaelhorn_1.conteudoVaelhorn, c).some(g => g.local === alvo.id), `Descoberto, ${alvo.id} passa a render gancho`);
}
// ── O teto de ganchos abertos é respeitado ────────────────────────────────
{
    const c = nova('gancho-teto');
    for (let i = 0; i < 2000; i++)
        (0, ganchos_1.processarGanchos)(vaelhorn_1.conteudoVaelhorn, c);
    const abertos = c.vivo.missoes.filter(q => (q.estado === 'oferecida' || q.estado === 'aceita') && q.causa.id.startsWith('gancho_')).length;
    ok(abertos <= ganchos_1.MAX_GANCHOS_ABERTOS, `Nunca mais de ${ganchos_1.MAX_GANCHOS_ABERTOS} ganchos abertos de uma vez (${abertos})`);
}
// ── Título ────────────────────────────────────────────────────────────────
{
    ok((0, ganchos_1.tituloDoGancho)('o celeiro está cheio e a vila come pouco') === 'O celeiro está cheio', 'O título corta na primeira ideia e sobe a inicial');
    const longo = (0, ganchos_1.tituloDoGancho)('uma coisa muito comprida sem nenhuma vírgula nem conjunção alguma para cortar aqui');
    ok(longo.length <= 43 && longo.endsWith('…'), `Frase sem corte natural é truncada (${longo.length} chars)`);
}
console.log('\nGanchos: as frases do mapa viram razão para sair de casa.');
