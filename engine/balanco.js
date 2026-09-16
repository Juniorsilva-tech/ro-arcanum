"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAIXAS = void 0;
exports.jogadorDeTeste = jogadorDeTeste;
exports.combateUnico = combateUnico;
exports.medirFaixas = medirFaixas;
exports.cobertura = cobertura;
exports.descreverJogador = descreverJogador;
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const rng_1 = require("./rng");
const combat_1 = require("./combat");
const poder_1 = require("./poder");
const aptidao_1 = require("./aptidao");
const progresso_1 = require("./progresso");
exports.FAIXAS = [
    { nome: 'jogador -40%', razao: 0.6, alvo: [10, 20] },
    { nome: 'jogador -20%', razao: 0.8, alvo: [25, 35] },
    { nome: 'equivalentes', razao: 1.0, alvo: [45, 55] },
    { nome: 'jogador +20%', razao: 1.2, alvo: [65, 75] },
    { nome: 'jogador +40%', razao: 1.4, alvo: [80, 90] },
];
/** Monta um jogador sob medida, sem passar pela criação normal de campanha. */
function jogadorDeTeste(content, opts, seed) {
    const camp = (0, campaign_1.criarCampanha)(content, {
        // Contrabandista de proposito: o banco mede a MATEMATICA do combate, e a
        // classe nao pode entrar na conta. Guardiao absorve o primeiro golpe de
        // cada luta (engine/classe.ts) e isso sozinho tirou 17 das 20 faixas do
        // alvo quando as mecanicas de classe foram implementadas — media a classe,
        // nao a formula. A mecanica da contrabandista e' comercial: zero efeito em
        // combate. Atributos, arma, armadura, nivel e maestria ja vem sobrescritos
        // logo abaixo, entao a escolha da classe nao muda mais nada.
        nome: 'Provador', atributos: (0, character_1.atributosBase)(), classeId: 'contrabandista', origemId: 'divida',
        seedString: seed,
    });
    const p = camp.personagem;
    if (opts.atributo) {
        for (const k of Object.keys(p.atributos))
            p.atributos[k] = opts.atributo;
    }
    p.nivel = opts.nivel;
    if (opts.arma) {
        p.inventario[opts.arma] = 1;
        p.equipado.arma = opts.arma;
    }
    if (opts.armadura) {
        p.inventario[opts.armadura] = 1;
        p.equipado.armadura = opts.armadura;
    }
    const a = (0, aptidao_1.estadoAptidao)(camp);
    a.esforco.espada = (0, aptidao_1.esforcoParaMaestria)(opts.maestriaEspada);
    // O prólogo de infância não interessa aqui: o alvo é a matemática do combate.
    if (camp.familia)
        camp.familia.prologoConcluido = true;
    (0, progresso_1.recalcularRecursosMaximos)(camp);
    p.recursos.vida = p.recursosMax.vida;
    return camp;
}
/** Roda um combate até o fim e devolve o desfecho. */
function combateUnico(content, camp, criaturaId) {
    (0, combat_1.iniciarCombate)(content, camp, [criaturaId]);
    let guarda = 0;
    while (camp.combate && !camp.combate.terminado && guarda++ < 400) {
        const s = camp.combate;
        const eu = s.atores.find(a => a.ehJogador);
        const inimigos = s.atores.filter(a => !a.ehJogador && !a.ehAliado && a.vida > 0);
        if (!eu || !inimigos.length)
            break;
        if (eu.tatico?.sono)
            (0, combat_1.jogadorAcaoTatica)(content, camp, 'despertar');
        else if (eu.tatico?.preso)
            (0, combat_1.jogadorAcaoTatica)(content, camp, 'libertar');
        else if (eu.vida <= 0)
            break;
        else
            (0, combat_1.jogadorAtaca)(content, camp, [...inimigos].sort((a, b) => a.vida - b.vida)[0].id);
    }
    const r = camp.combate?.resultado ?? 'derrota';
    (0, combat_1.fecharCombate)(camp);
    return r;
}
/**
 * Para cada faixa, monta um adversário artificial na razão exata e roda N
 * combates de verdade contra ele. Mede a matemática do combate, não a sorte de
 * o bestiário ter alguém do tamanho certo (isso é medido em `cobertura`).
 */
function medirFaixas(content, opts, porFaixa = 400) {
    const modelo = jogadorDeTeste(content, opts, 'balanco-modelo');
    const fichaJogador = (0, poder_1.fichaDoJogador)(content, modelo);
    return exports.FAIXAS.map(faixa => {
        const ficha = (0, poder_1.adversarioNaRazao)(fichaJogador, faixa.razao);
        const sintetica = {
            id: '__afericao__', nome: 'Adversário de aferição',
            descricao: 'Existe apenas no banco de provas.',
            nivel: 0, vida: Math.round(ficha.vida), defesa: ficha.defesa, acerto: ficha.acerto,
            ataqueNome: 'golpe', dano: ficha.dano, moralBase: 100, xp: 0,
        };
        const bancada = { ...content, criaturas: [...content.criaturas, sintetica] };
        let vitorias = 0;
        let razao = 0;
        for (let i = 0; i < porFaixa; i++) {
            const camp = jogadorDeTeste(bancada, opts, `balanco-${faixa.nome}-${i}`);
            camp.rng = (0, rng_1.createRng)((0, rng_1.seedFromString)(`combate:${faixa.nome}:${i}`));
            razao = (0, poder_1.razaoDePoder)(bancada, camp, sintetica);
            if (combateUnico(bancada, camp, sintetica.id) === 'vitoria')
                vitorias++;
        }
        const taxa = (100 * vitorias) / porFaixa;
        return {
            faixa, combates: porFaixa, vitorias, taxa,
            dentro: taxa >= faixa.alvo[0] && taxa <= faixa.alvo[1],
            razaoMedia: razao,
            exemplo: `vida ${sintetica.vida} · dano ${ficha.dano.base.toFixed(1)}`,
        };
    });
}
/**
 * Cobertura do bestiário: quantas criaturas reais este jogador encontraria em
 * cada faixa. Responde a pergunta que a aferição sintética não responde — se
 * existe adversário do tamanho certo no mundo.
 */
function cobertura(content, opts) {
    const camp = jogadorDeTeste(content, opts, 'cobertura');
    const ficha = (0, poder_1.fichaDoJogador)(content, camp);
    const uteis = content.criaturas.filter(c => (0, poder_1.mensuravelPorDuelo)(c) && (0, poder_1.podeDerrotar)(content, camp, c) && (0, poder_1.poderEfetivo)((0, poder_1.fichaDaCriatura)(c)) > 0);
    return exports.FAIXAS.map(f => {
        const dentro = uteis.filter(c => {
            const v = (0, poder_1.vantagemNoDuelo)(ficha, (0, poder_1.fichaDaCriatura)(c));
            return v >= f.razao * 0.85 && v <= f.razao * 1.15;
        });
        const nomes = dentro.slice(0, 3).map(c => c.nome).join(', ');
        return `${f.nome.padEnd(13)} ${String(dentro.length).padStart(3)} criaturas${nomes ? `  (${nomes})` : ''}`;
    });
}
/** Retrato do personagem para o cabeçalho do relatório. */
function descreverJogador(content, opts) {
    const camp = jogadorDeTeste(content, opts, 'balanco-retrato');
    const f = (0, poder_1.fichaDoJogador)(content, camp);
    return `nível ${opts.nivel} · maestria ${opts.maestriaEspada} · vida ${f.vida} · ` +
        `defesa ${f.defesa} · acerto ${f.acerto} · dano ${f.dano.base.toFixed(1)} · ${(0, poder_1.detalharPoder)(f)}`;
}
