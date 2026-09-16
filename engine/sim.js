"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Simulador headless (GDD §39, §41).
// Uso: npm run sim -- 10000
// Se a distribuição de graus for plausível antes de existir um botão na tela,
// o projeto tem chão.
const rng_1 = require("./rng");
const resolution_1 = require("./resolution");
const vaelhorn_1 = require("../content/vaelhorn");
const campaign_1 = require("./campaign");
const availability_1 = require("./availability");
const turn_1 = require("./turn");
const character_1 = require("./character");
const rng_2 = require("./rng");
const N = Number(process.argv[2] ?? 10000);
function distribuicaoTeste(C, D, k, n) {
    const rng = (0, rng_1.createRng)((0, rng_1.seedFromString)(`C${C}D${D}`));
    const cont = {
        critico: 0,
        sucesso: 0,
        sucesso_com_custo: 0,
        falha: 0,
        falha_grave: 0,
    };
    for (let i = 0; i < n; i++) {
        const res = (0, resolution_1.resolverTeste)(rng, { atributo: C, dificuldade: D, k });
        cont[res.grau]++;
    }
    const p = (0, resolution_1.probabilidade)(C, D, k);
    const sucessoTotal = (cont.critico + cont.sucesso + cont.sucesso_com_custo) / n;
    return { p, sucessoTotal, cont };
}
console.log(`\n=== ARCANUM · simulador headless · ${N} amostras por faixa ===\n`);
for (const [nome, D] of Object.entries(resolution_1.DIFICULDADE)) {
    const { p, sucessoTotal, cont } = distribuicaoTeste(14, D, 4, N);
    const pct = (x) => ((x / N) * 100).toFixed(1).padStart(5);
    console.log(`C=14 vs ${nome.padEnd(17)} (D=${String(D).padStart(2)})  p=${(p * 100).toFixed(0).padStart(3)}%  ` +
        `sucesso≈${(sucessoTotal * 100).toFixed(0).padStart(3)}%  ` +
        `| crit ${pct(cont.critico)}  suc ${pct(cont.sucesso)}  custo ${pct(cont.sucesso_com_custo)}  ` +
        `falha ${pct(cont.falha)}  grave ${pct(cont.falha_grave)}`);
}
// ── Teste de agência (GDD §40): jogar N períodos usando SÓ o menu de Ações.
console.log(`\n=== Teste de agência: 20 períodos só com o menu de verbos ===\n`);
{
    const camp = (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
        nome: 'Simulado',
        atributos: (0, character_1.atributosBase)(),
        classeId: 'batedor',
        origemId: 'foragido',
        seedString: 'agencia-1',
    });
    let periodos = 0;
    let acoes = 0;
    while (periodos < 20 && acoes < 200) {
        const ctx = (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, camp);
        const disponiveis = vaelhorn_1.conteudoVaelhorn.verbos.filter((v) => {
            const alvo = ctx.presentes[0];
            return (0, availability_1.disponibilidadeVerbo)(v, ctx, camp, alvo).disponivel;
        });
        if (disponiveis.length === 0)
            break;
        const verbo = (0, rng_2.pick)(camp.rng, disponiveis);
        const alvoId = verbo.alvo === 'pessoa' ? ctx.presentes[0]?.id : undefined;
        const r = (0, turn_1.resolverIntencao)(vaelhorn_1.conteudoVaelhorn, camp, { tipo: 'verbo', verboId: verbo.id, alvoId });
        periodos += r.custoPeriodos;
        acoes++;
    }
    const p = camp.personagem;
    console.log(`Sobreviveu ${acoes} ações / ${periodos} períodos. ` +
        `Vida ${p.recursos.vida}/${p.recursosMax.vida}  ` +
        `Dinheiro ${p.dinheiro}  XP ${p.xp}  ` +
        `Sanidade ${p.pressoes.sanidade}  Corrupção ${p.pressoes.corrupcao}`);
    const verbosDisponiveisAgora = vaelhorn_1.conteudoVaelhorn.verbos.filter((v) => {
        const ctx = (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, camp);
        return (0, availability_1.disponibilidadeVerbo)(v, ctx, camp, ctx.presentes[0]).disponivel;
    }).length;
    console.log(`Verbos ainda disponíveis no local atual: ${verbosDisponiveisAgora}/${vaelhorn_1.conteudoVaelhorn.verbos.length}`);
}
console.log('\nOK.\n');
void resolution_1.grauDeResultado;
