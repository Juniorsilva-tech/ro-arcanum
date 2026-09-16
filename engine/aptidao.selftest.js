"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Testes do sistema de aptidão, maestria, exposição e crença.
//
// O que estes testes protegem, em uma frase: talento acelera, mas não decide;
// e o mundo só sabe o que viu.
const vaelhorn_1 = require("../content/vaelhorn");
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const migracao_1 = require("./migracao");
const aptidao_1 = require("./aptidao");
const llm_1 = require("./llm");
const availability_1 = require("./availability");
const ok = (v, msg) => { if (!v)
    throw new Error(msg); console.log(`✓ ${msg}`); };
const nova = (seed, marca = 'comum') => (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
    nome: 'Aprendiz', atributos: (0, character_1.atributosBase)(), classeId: 'guardiao', origemId: 'divida',
    seedString: seed, marcaInfancia: marca, reacaoInfancia: 'apoio',
});
/** Força uma aptidão exata, para testar a mecânica e não o sorteio. */
function comAptidao(camp, dominio, valor) {
    (0, aptidao_1.estadoAptidao)(camp).aptidao[dominio] = valor;
    return camp;
}
const civil = (id) => ({
    id, nome: `Civil ${id}`, idade: 30, ocupacao: 'lavrador', personalidade: 'simples',
    localBase: 'praca', faccaoId: 'vila', rotina: {}, vozNarrativa: 'seca', corpo: 'comum', relacoes: [],
});
// ── Determinismo e sigilo ─────────────────────────────────────────────────
{
    const a = nova('apt-determinista'), b = nova('apt-determinista');
    ok(JSON.stringify(a.aptidao.aptidao) === JSON.stringify(b.aptidao.aptidao), 'A mesma semente sorteia a mesma aptidão');
    const c = nova('apt-sigilo');
    comAptidao(c, 'espada', 98);
    const ctx = (0, aptidao_1.contextoDeAptidao)(c);
    ok(!JSON.stringify(ctx).includes('98'), 'O pacote público não carrega o número da aptidão');
    const pacote = JSON.stringify((0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c, (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, c), 'fato'));
    ok(!pacote.includes('"aptidao"'), 'O contexto do narrador não contém o campo aptidao');
}
// ── Curva de maestria: retorno decrescente ────────────────────────────────
{
    const ate30 = (0, aptidao_1.esforcoParaMaestria)(30);
    const de80a90 = (0, aptidao_1.esforcoParaMaestria)(90) - (0, aptidao_1.esforcoParaMaestria)(80);
    const de90a95 = (0, aptidao_1.esforcoParaMaestria)(95) - (0, aptidao_1.esforcoParaMaestria)(90);
    ok(de80a90 > ate30, 'Subir de 80 para 90 custa mais que sair do zero até 30');
    ok(de90a95 > de80a90 * 0.9, 'Cada faixa alta custa pelo menos tanto quanto a anterior');
    ok((0, aptidao_1.maestriaPorEsforco)(1e9) < 100.0001, 'A maestria satura em 100 e nunca estoura');
}
// ── Talento acelera, mas não decide ───────────────────────────────────────
{
    const prod = comAptidao(nova('apt-prod'), 'espada', 97);
    const comum = comAptidao(nova('apt-comum'), 'espada', 35);
    for (let i = 0; i < 40; i++) {
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, prod, 'espada', { mestre: 0.6, esforco: 0.7, recursos: 0.6 });
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, comum, 'espada', { mestre: 0.6, esforco: 0.7, recursos: 0.6 });
    }
    ok((0, aptidao_1.maestriaDe)(prod, 'espada') > (0, aptidao_1.maestriaDe)(comum, 'espada') * 1.3, 'Com o mesmo treino, o prodígio chega mais longe');
    // O ponto central do pedido: prodígio iniciante perde para veterano comum.
    const iniciante = comAptidao(nova('apt-iniciante'), 'espada', 99);
    (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, iniciante, 'espada', {});
    const veterano = comAptidao(nova('apt-veterano'), 'espada', 30);
    for (let i = 0; i < 120; i++)
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, veterano, 'espada', { mestre: 0.5, esforco: 0.6 });
    ok((0, aptidao_1.maestriaDe)(veterano, 'espada') > (0, aptidao_1.maestriaDe)(iniciante, 'espada') * 3, 'Prodígio iniciante é muito pior que veterano comum — talento não é poder pronto');
    // E o inverso do estereótipo: disciplina vence talento desperdiçado.
    const dedicado = comAptidao(nova('apt-dedicado'), 'espada', 40);
    const relaxado = comAptidao(nova('apt-relaxado'), 'espada', 95);
    for (let i = 0; i < 60; i++) {
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, dedicado, 'espada', { mestre: 0.95, esforco: 1, recursos: 0.9 });
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, relaxado, 'espada', { mestre: 0, esforco: 0.15, recursos: 0.1 });
    }
    ok((0, aptidao_1.maestriaDe)(dedicado, 'espada') > (0, aptidao_1.maestriaDe)(relaxado, 'espada'), 'Comum disciplinado com bom mestre supera prodígio sem disciplina');
    // Teto confortável freia, mas não fecha a porta.
    const teimoso = comAptidao(nova('apt-teimoso'), 'espada', 20);
    for (let i = 0; i < 4000; i++)
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, teimoso, 'espada', { mestre: 0.9, esforco: 1, recursos: 0.9 });
    ok((0, aptidao_1.maestriaDe)(teimoso, 'espada') > 85, 'Aptidão baixa ainda alcança nível alto com muitos anos de esforço');
}
// ── O mundo só sabe o que viu ─────────────────────────────────────────────
{
    const c = comAptidao(nova('apt-oculto'), 'espada', 98);
    for (let i = 0; i < 50; i++)
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, c, 'espada', { mestre: 0.8, esforco: 0.9 });
    (0, aptidao_1.registrarDemonstracao)(vaelhorn_1.conteudoVaelhorn, c, { dominio: 'espada', dificuldade: 90, sucesso: true, testemunhas: [] });
    const a = (0, aptidao_1.estadoAptidao)(c);
    ok(a.exposicao.espada === 0 && a.reputacao.espada === 0, 'Sem testemunha não há exposição nem reputação, por mais capaz que seja');
    const olheiro = civil('olheiro');
    c.npcState[olheiro.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
    (0, aptidao_1.registrarDemonstracao)(vaelhorn_1.conteudoVaelhorn, c, { dominio: 'espada', dificuldade: 90, sucesso: true, testemunhas: [olheiro] });
    ok((0, aptidao_1.estadoAptidao)(c).exposicao.espada > 0, 'Com plateia, a exposição começa a subir');
    ok(((0, aptidao_1.crencaDe)(c, olheiro.id, 'espada')?.observacoes ?? 0) === 1, 'A testemunha registra o que viu');
    ok((0, aptidao_1.crencaDe)(c, 'ninguem', 'espada') === undefined, 'Quem não estava lá não forma crença nenhuma');
}
// ── Observador competente lê melhor que civil ─────────────────────────────
{
    const c = comAptidao(nova('apt-observadores'), 'espada', 90);
    const perito = vaelhorn_1.conteudoVaelhorn.npcs.find(n => n.combatente?.nichirin);
    const leigo = civil('leigo');
    c.npcState[leigo.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
    for (let i = 0; i < 6; i++) {
        (0, aptidao_1.registrarDemonstracao)(vaelhorn_1.conteudoVaelhorn, c, {
            dominio: 'espada', dificuldade: 95, sucesso: true, testemunhas: [perito, leigo],
        });
    }
    const cp = (0, aptidao_1.crencaDe)(c, perito.id, 'espada');
    const cl = (0, aptidao_1.crencaDe)(c, leigo.id, 'espada');
    ok(cp.valor > cl.valor, 'O perito enxerga a diferença; o civil comprime tudo para o meio');
    ok(cp.confianca > cl.confianca, 'O perito tem mais confiança na própria leitura');
    ok(!!(0, aptidao_1.leituraDoObservador)(c, perito.id, 'espada'), 'A leitura do observador vira texto para a cena');
}
// ── Viés: quem não gosta de você desconta ─────────────────────────────────
{
    const c = comAptidao(nova('apt-vies'), 'espada', 90);
    const amigo = civil('amigo'), rival = civil('rival');
    c.npcState[amigo.id] = { eixos: { disposicao: 18 }, vivo: true, tensao: 0, memoria: [] };
    c.npcState[rival.id] = { eixos: { disposicao: -18 }, vivo: true, tensao: 0, memoria: [] };
    for (let i = 0; i < 5; i++) {
        (0, aptidao_1.registrarDemonstracao)(vaelhorn_1.conteudoVaelhorn, c, {
            dominio: 'espada', dificuldade: 85, sucesso: true, testemunhas: [amigo, rival],
        });
    }
    ok((0, aptidao_1.crencaDe)(c, amigo.id, 'espada').valor > (0, aptidao_1.crencaDe)(c, rival.id, 'espada').valor, 'A mesma façanha vale mais para quem gosta e menos para quem não gosta');
}
// ── Suspeita de talento nasce do ritmo, e só para quem entende ────────────
{
    const c = comAptidao(nova('apt-ritmo'), 'espada', 99);
    const mestre = vaelhorn_1.conteudoVaelhorn.npcs.find(n => n.combatente?.nichirin);
    const leigo = civil('leigo2');
    c.npcState[leigo.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
    for (let i = 0; i < 12; i++) {
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, c, 'espada', { mestre: 0.9, esforco: 1, recursos: 0.9, observadorId: mestre.id });
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, c, 'espada', { mestre: 0.9, esforco: 1, recursos: 0.9, observadorId: leigo.id });
    }
    ok(((0, aptidao_1.crencaDe)(c, mestre.id, 'espada')?.suspeita ?? 0) > 0, 'Quem entende do assunto percebe que o aprendizado foi rápido demais');
    ok(((0, aptidao_1.crencaDe)(c, leigo.id, 'espada')?.suspeita ?? 0) === 0, 'O civil não mede ritmo de aprendizado — para ele é só treino');
}
// ── Esconder é jogada válida ──────────────────────────────────────────────
{
    const aberto = comAptidao(nova('apt-aberto'), 'espada', 95);
    const oculto = comAptidao(nova('apt-oculto2'), 'espada', 95);
    ok((0, aptidao_1.alternarOcultacao)(oculto) === true, 'Ocultar-se é uma decisão explícita do jogador');
    const t = civil('plateia');
    for (const c of [aberto, oculto])
        c.npcState[t.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
    for (let i = 0; i < 8; i++) {
        for (const c of [aberto, oculto]) {
            (0, aptidao_1.registrarDemonstracao)(vaelhorn_1.conteudoVaelhorn, c, { dominio: 'espada', dificuldade: 88, sucesso: true, testemunhas: [t] });
        }
    }
    ok((0, aptidao_1.estadoAptidao)(oculto).exposicao.espada < (0, aptidao_1.estadoAptidao)(aberto).exposicao.espada * 0.5, 'Conter-se derruba a exposição pela metade ou mais');
    ok((0, aptidao_1.estadoAptidao)(oculto).reputacao.espada < (0, aptidao_1.estadoAptidao)(aberto).reputacao.espada, 'Quem se contém demora muito mais a virar assunto');
    // E cobra o preço: esconder atrasa o próprio aprendizado.
    const a1 = comAptidao(nova('apt-treino-aberto'), 'espada', 60);
    const a2 = comAptidao(nova('apt-treino-oculto'), 'espada', 60);
    (0, aptidao_1.alternarOcultacao)(a2);
    for (let i = 0; i < 30; i++) {
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, a1, 'espada', { mestre: 0.7, esforco: 0.8 });
        (0, aptidao_1.treinar)(vaelhorn_1.conteudoVaelhorn, a2, 'espada', { mestre: 0.7, esforco: 0.8 });
    }
    ok((0, aptidao_1.maestriaDe)(a2, 'espada') < (0, aptidao_1.maestriaDe)(a1, 'espada'), 'Esconder tem custo: treina-se menos');
}
// ── Reputação limitada pela exposição; fama atrás da reputação ────────────
{
    const c = comAptidao(nova('apt-fama'), 'espada', 92);
    const t = civil('t1');
    c.npcState[t.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
    for (let i = 0; i < 3; i++) {
        (0, aptidao_1.registrarDemonstracao)(vaelhorn_1.conteudoVaelhorn, c, { dominio: 'espada', dificuldade: 95, sucesso: true, testemunhas: [t] });
    }
    const a = (0, aptidao_1.estadoAptidao)(c);
    ok(a.reputacao.espada <= a.exposicao.espada + 0.001, 'Ninguém fica com fama de algo que mostrou pouco: reputação não passa da exposição');
    const famaAntes = a.fama.espada;
    for (let i = 0; i < 30; i++) {
        c.calendario.dia += 1;
        (0, aptidao_1.processarAptidao)(vaelhorn_1.conteudoVaelhorn, c);
    }
    ok(a.fama.espada > famaAntes, 'A fama sobe com o tempo, correndo atrás da reputação');
    ok(a.fama.espada <= a.picoReputacao.espada + 0.001, 'A fama nunca ultrapassa o pico de reputação que a alimentou');
    // Glória antiga esfria devagar: a fama fica para trás quando a reputação cai.
    a.reputacao.espada = 0;
    const famaNoAuge = a.fama.espada;
    for (let i = 0; i < 5; i++) {
        c.calendario.dia += 1;
        (0, aptidao_1.processarAptidao)(vaelhorn_1.conteudoVaelhorn, c);
    }
    ok(a.fama.espada > 0 && a.fama.espada < famaNoAuge, 'Quando a reputação cai, a fama desce devagar — quem já foi grande continua sendo lembrado');
    ok(a.fama.espada > a.reputacao.espada, 'É legítimo a fama estar acima da reputação atual');
}
// ── Degraus do mundo disparam uma vez cada ────────────────────────────────
{
    const c = comAptidao(nova('apt-degraus'), 'espada', 95);
    const a = (0, aptidao_1.estadoAptidao)(c);
    a.exposicao.espada = 100;
    a.reputacao.espada = 90;
    a.fama.espada = 70;
    for (let i = 0; i < 5; i++) {
        c.calendario.dia += 1;
        (0, aptidao_1.processarAptidao)(vaelhorn_1.conteudoVaelhorn, c);
    }
    const degraus = a.reacoes.filter(r => r.dominio === 'espada');
    ok(degraus.length === 4, 'Os quatro degraus de reação do mundo dispararam');
    ok(new Set(degraus.map(r => r.degrau)).size === 4, 'Nenhum degrau dispara duas vezes');
    ok((c.vivo?.fatos ?? []).some(f => f.tipo === 'talento_reconhecido'), 'O reconhecimento vira fato registrado, não invenção do narrador');
}
// ── Migração: veterano não acorda zerado, e o RNG não se mexe ─────────────
{
    const velho = nova('apt-migracao');
    velho.personagem.pericias = { arcana: 3, perceber: 2 };
    velho.personagem.nivel = 12;
    velho.personagem.artesConhecidas = ['centelha', 'ler_aura'];
    delete velho.aptidao;
    const cursorAntes = velho.rng.cursor;
    const migrado = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(velho)));
    ok(!!migrado.aptidao, 'Save antigo ganha estado de aptidão ao carregar');
    ok((0, aptidao_1.maestriaDe)(migrado, 'arcano') > 40, 'Perícia treinada vira maestria: o veterano continua veterano');
    ok((0, aptidao_1.maestriaDe)(migrado, 'espada') > 10, 'Nível e artes contam como bagagem de combate');
    ok(migrado.rng.cursor === cursorAntes, 'Migrar não move o cursor do RNG da campanha');
    const b = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(velho)));
    ok(JSON.stringify(b.aptidao.aptidao) === JSON.stringify(migrado.aptidao.aptidao), 'A migração é idempotente: mesma campanha, mesma aptidão');
}
// ── Vocabulário e faixas ──────────────────────────────────────────────────
{
    ok((0, aptidao_1.faixaDeAptidao)(96) === 'prodigio' && (0, aptidao_1.faixaDeAptidao)(49) === 'comum' && (0, aptidao_1.faixaDeAptidao)(100) === 'fenomeno_historico', 'As faixas de aptidão respeitam os limiares combinados');
    ok((0, aptidao_1.dominioDaAcao)('arcana') === 'arcano' && (0, aptidao_1.dominioDaAcao)(undefined, 'social') === 'diplomacia', 'Perícia e categoria de verbo mapeiam para o domínio certo');
    ok((0, aptidao_1.dominioDaAcao)('inexistente', 'inexistente') === undefined, 'Ação sem domínio conhecido não treina nada');
}
// ── Aptidão alta sem treino não vale nada, e é isso mesmo ─────────────────
{
    const c = comAptidao(nova('apt-desperdicio'), 'espada', 100);
    ok((0, aptidao_1.aptidaoRealParaTestes)(c, 'espada') === 100, 'A engine conhece a aptidão real');
    ok((0, aptidao_1.maestriaDe)(c, 'espada') === 0, 'Nascer fenômeno histórico não dá um ponto de habilidade de graça');
    ok(((0, aptidao_1.contextoDeAptidao)(c)?.dominios ?? []).every(d => d.maestria < 5), 'E o mundo não tem nada para ver');
}
console.log('Testes de aptidão, maestria, exposição e crença passaram.');
