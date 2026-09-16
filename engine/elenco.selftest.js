"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Gente de quem se lembra depois.
//
// Medido na sessão 21: o continente tinha 156 moradores gerados e **zero
// pessoas escritas à mão**. Os 56 personagens autorais estavam todos no Vale
// de Halvet e arredores. As seis regiões novas tinham densidade — muita gente
// na praça — e ninguém memorável dentro delas.
//
// Densidade é trabalho de gerador; personagem é trabalho de autoria. Estes
// testes cobram a segunda coisa, e cobram que ela continue amarrada à ficção
// que o mapa já tinha: uma pessoa escrita à mão que não conversa com a
// história do lugar é decoração cara.
const vaelhorn_1 = require("../content/vaelhorn");
const elenco_continente_1 = require("../content/vaelhorn/elenco-continente");
const time_1 = require("./time");
const ok = (v, mensagem) => {
    if (!v)
        throw new Error(mensagem);
    console.log(`✓ ${mensagem}`);
};
const porId = new Map(vaelhorn_1.conteudoVaelhorn.locais.map(l => [l.id, l]));
const regiaoDe = (npcLocal) => porId.get(npcLocal)?.regiao;
// As regiões do continente — as que a sessão 13 criou e que ficaram vazias de
// autoria até agora.
const REGIOES_DO_CONTINENTE = [
    'Marca de Tessel',
    'Planalto de Corveira',
    'Costa de Mareu',
    'Bosque de Vintra',
    'Ermo de Solgar',
    'Baixios de Halvern',
];
// ── Toda região nova tem gente com nome ───────────────────────────────────
{
    const escritos = vaelhorn_1.conteudoVaelhorn.npcs.filter(n => !n.id.startsWith('morador_'));
    ok(escritos.length >= 70, `O jogo tem elenco autoral (${escritos.length} pessoas escritas à mão)`);
    for (const regiao of REGIOES_DO_CONTINENTE) {
        const daRegiao = escritos.filter(n => regiaoDe(n.localBase) === regiao);
        ok(daRegiao.length >= 1, `${regiao} tem gente com nome (${daRegiao.length}: ${daRegiao.map(n => n.nome).join(', ')})`);
    }
}
// ── Amarrados à ficção do lugar, não flutuando ────────────────────────────
{
    for (const n of elenco_continente_1.elencoDoContinente) {
        const local = porId.get(n.localBase);
        ok(!!local, `${n.id} mora num lugar que existe (${n.localBase})`);
        // Um personagem só vale a autoria se o lugar dele tiver ficção para ele
        // conversar. Se um dia alguém puser gente num lugar sem história nem
        // gancho, este teste avisa antes de o vazio chegar ao jogo.
        const temFiccao = (local.historia?.length ?? 0) > 0 || (local.ganchos?.length ?? 0) > 0;
        ok(temFiccao, `${n.id} mora num lugar que tem história ou gancho (${local.nome})`);
    }
}
// ── Cada um é uma pessoa, não uma ficha ───────────────────────────────────
{
    for (const n of elenco_continente_1.elencoDoContinente) {
        ok(n.vozNarrativa.length >= 40, `${n.id} tem voz própria`);
        ok(n.personalidade.length >= 40, `${n.id} tem índole escrita`);
        ok((n.corpo ?? '').length >= 40, `${n.id} tem corpo descrito`);
        ok(time_1.PERIODOS.every(p => !!n.rotina[p]), `${n.id} tem os seis períodos do dia cobertos`);
    }
    const comSegredo = elenco_continente_1.elencoDoContinente.filter(n => n.segredo);
    ok(comSegredo.length >= elenco_continente_1.elencoDoContinente.length * 0.7, `A maioria carrega segredo (${comSegredo.length} de ${elenco_continente_1.elencoDoContinente.length})`);
    for (const n of comSegredo) {
        ok((n.segredo.comoDescobrir ?? '').length >= 20, `O segredo de ${n.id} tem caminho para ser descoberto`);
    }
}
// ── O elenco se conhece ───────────────────────────────────────────────────
//
// Gente sem laço é gente que existe sozinha, e o mundo não se comporta como
// mundo. Cada laço tem de apontar para alguém real — o `selftest.ts` já cobra
// isso no elenco inteiro; aqui a exigência é de densidade dentro do novo.
{
    const ids = new Set(vaelhorn_1.conteudoVaelhorn.npcs.map(n => n.id));
    const comLaco = elenco_continente_1.elencoDoContinente.filter(n => (n.relacoes ?? []).length > 0);
    ok(comLaco.length >= elenco_continente_1.elencoDoContinente.length * 0.6, `A maioria do elenco novo tem laço (${comLaco.length} de ${elenco_continente_1.elencoDoContinente.length})`);
    for (const n of elenco_continente_1.elencoDoContinente) {
        for (const l of n.relacoes ?? []) {
            ok(ids.has(l.npc), `O laço de ${n.id} aponta para alguém real (${l.npc})`);
            ok(l.npc !== n.id, `${n.id} não tem laço consigo`);
            ok(l.nota.length >= 15, `O laço ${n.id} → ${l.npc} diz o que é`);
        }
    }
}
// ── Nomes e ids únicos no mundo inteiro ───────────────────────────────────
{
    const vistos = new Map();
    for (const n of vaelhorn_1.conteudoVaelhorn.npcs)
        vistos.set(n.id, (vistos.get(n.id) ?? 0) + 1);
    const repetidos = [...vistos].filter(([, q]) => q > 1);
    ok(repetidos.length === 0, `Nenhum id repetido no elenco (${repetidos.map(([id]) => id).join(', ')})`);
    const nomes = new Map();
    for (const n of elenco_continente_1.elencoDoContinente) {
        const iguais = vaelhorn_1.conteudoVaelhorn.npcs.filter(x => x.nome === n.nome).map(x => x.id);
        if (iguais.length > 1)
            nomes.set(n.nome, iguais);
    }
    ok(nomes.size === 0, `Nenhum nome do elenco novo colide com o antigo (${[...nomes.keys()].join(', ')})`);
}
console.log('\nElenco do continente: as regiões novas têm gente de quem se lembrar.');
