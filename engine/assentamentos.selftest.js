"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vaelhorn_1 = require("../content/vaelhorn");
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const cidades_1 = require("./cidades");
const migracao_1 = require("./migracao");
const llm_1 = require("./llm");
const availability_1 = require("./availability");
const historiaViva_1 = require("./historiaViva");
const contextoNarrativo_1 = require("./contextoNarrativo");
const viagem_1 = require("./viagem");
const llm_2 = require("./llm");
const ok = (v, texto) => { if (!v)
    throw new Error(texto); console.log(`✓ ${texto}`); };
const nova = () => (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, { nome: 'Morador', atributos: (0, character_1.atributosBase)(), classeId: 'guardiao', origemId: 'divida', seedString: 'assentamentos', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
{
    const c = nova(), id = Object.keys(c.vivo.cidades)[0];
    c.localAtual = id;
    c.vivo.fatos = [];
    const parente = c.familia.membros[0].id;
    (0, historiaViva_1.registrarFato)(c, { tipo: 'teste', local: 'outro', texto: 'Notícia da família', atores: [parente], publico: true, conhecimento: 'confirmado' });
    for (let i = 0; i < 10; i++)
        (0, historiaViva_1.registrarFato)(c, { tipo: 'teste', local: 'outro', texto: `Notícia distante ${i}`, atores: [], publico: true, conhecimento: 'rumor' });
    const oculto = (0, historiaViva_1.registrarFato)(c, { tipo: 'teste', local: id, texto: 'CAUSA_SECRETA_456', atores: [], publico: false });
    (0, historiaViva_1.registrarFato)(c, { tipo: 'teste', local: id, texto: 'Consequência visível', atores: [], publico: true, causa: { id: oculto.id, texto: oculto.texto } });
    let pacote = (0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c, (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, c), 'Você observa.');
    ok(pacote.mundoPersistente.fatos[0].texto === 'Notícia da família', 'Relevância familiar vence dez notícias recentes');
    ok(pacote.mundoPersistente.fatos.length === 6, 'Seleção narrativa mantém limite de contexto');
    ok(!JSON.stringify(pacote).includes('CAUSA_SECRETA_456'), 'Causa oculta não vaza por fato conhecido');
    ok(pacote.mundoPersistente.rumores.every(f => f.fonte === 'rumor') && pacote.mundoPersistente.confirmados.every(f => f.fonte !== 'rumor'), 'Fatos e rumores em canais separados');
    ok(!pacote.retornoAoLocal, 'Save sem observação não inventa visita anterior');
    (0, contextoNarrativo_1.registrarSaidaNarrativa)(c);
    const nivel = c.vivo.cidades[id].edificios.enfermaria;
    c.calendario.dia += 90;
    c.vivo.cidades[id].edificios.enfermaria++;
    c.vivo.cidades[id].fomeDias = 4;
    c.vivo.cidades[id].projeto = { tipo: 'muralha', progresso: 2, necessario: 40 };
    c.continuidade.locais[id].integridade = 15;
    const antes = JSON.stringify(c);
    pacote = (0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c, (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, c), 'Você retorna.');
    ok(pacote.retornoAoLocal?.mudancas.some(m => m.aspecto === 'enfermaria' && m.antes === nivel && m.agora === nivel + 1), 'Retorno compara edifício atual com observação copiada');
    ok(pacote.retornoAoLocal?.diasDesdeUltimaSaida === 90, 'Retorno usa calendário do jogo');
    ok(pacote.local.atmosfera.includes('ruínas') && pacote.local.atmosfera.includes('fome') && pacote.local.atmosfera.includes('muralha'), 'Ruína, fome e obra substituem atmosfera estática');
    ok(JSON.stringify(c) === antes, 'Novo contexto continua puro');
    const salvo = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(c)));
    ok(JSON.stringify(salvo.observacoesLocais) === JSON.stringify(c.observacoesLocais), 'Save preserva observações sem aliás com edifícios atuais');
    (0, contextoNarrativo_1.registrarSaidaNarrativa)(c);
    ok((0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c, (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, c), '').retornoAoLocal?.mudancas.length === 0, 'Nova saída atualiza a referência e evita mudanças antigas');
    const ctx = (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, c);
    ctx.presentes = vaelhorn_1.conteudoVaelhorn.npcs.slice(0, 2);
    const vozes = (0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c, ctx, '').presentes;
    ok(vozes.every((n, i) => n.voz === ctx.presentes[i].vozNarrativa && n.indole === ctx.presentes[i].personalidade), 'Voz e personalidade permanecem individualizadas por NPC');
}
{
    const c = nova(), origem = c.localAtual;
    ok(!(0, viagem_1.viajar)(vaelhorn_1.conteudoVaelhorn, c, 'destino_inexistente').ok && !c.observacoesLocais, 'Viagem negada não registra observação');
    const destino = vaelhorn_1.conteudoVaelhorn.locais.find(l => l.id === origem).rotas[0].destino;
    const dia = c.calendario.dia;
    ok((0, viagem_1.viajar)(vaelhorn_1.conteudoVaelhorn, c, destino).ok && c.observacoesLocais?.[origem].dia === dia, 'Viagem real registra origem antes do avanço temporal');
}
// Captura o pedido real sem rede/chave: valida contrato enviado, não qualidade literária.
async function testarPedido() {
    const fetchOriginal = globalThis.fetch;
    let pedido = '';
    globalThis.fetch = async (_url, init) => {
        pedido = String(init?.body);
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ narracao: 'Você tenta abrir o portão, mas ele permanece fechado. A tentativa falhou.' }) } }] }));
    };
    try {
        const c = nova();
        await (0, llm_2.narrarComModelo)({ provider: 'openrouter', apiKey: 'fixture', modelo: 'fixture' }, vaelhorn_1.conteudoVaelhorn, c, (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, c), {
            fato: 'Você tentou abrir o portão — falhou.', acaoLivre: 'Abro o portão', custoPeriodos: 0, efeitosAplicados: [],
        });
        ok(pedido.includes('Resultado canônico') && pedido.includes('Falha continua falha'), 'Pedido enviado subordina intenção ao resultado da engine');
        ok(pedido.includes('não transfira memórias entre NPCs') && pedido.includes('versões incertas'), 'Pedido enviado exige vozes próprias e incerteza dos rumores');
        ok(!pedido.includes('faça acontecer exatamente'), 'Pedido enviado não contém ordem conflitante de sucesso automático');
    }
    finally {
        globalThis.fetch = fetchOriginal;
    }
}
testarPedido().catch(e => { console.error(e); process.exitCode = 1; });
for (const tipo of Object.keys(cidades_1.EDIFICIOS)) {
    const c = nova(), id = Object.keys(c.vivo.cidades)[0], cidade = c.vivo.cidades[id], povo = c.continuidade.locais[id];
    c.localAtual = id;
    c.continuidade.ameacas = [];
    c.calendario.dia = 1;
    cidade.materiais = 0;
    ok(!(0, cidades_1.iniciarObra)(c, id, tipo) && !cidade.projeto, `${tipo}: sem material não cria obra`);
    cidade.materiais = 200;
    ok((0, cidades_1.iniciarObra)(c, id, tipo) && cidade.materiais === 200 - cidades_1.EDIFICIOS[tipo].materiais, `${tipo}: custo exato`);
    const nivel = cidade.edificios[tipo];
    ok(!(0, cidades_1.iniciarObra)(c, id, tipo), `${tipo}: não duplica projeto`);
    const pacote = (0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c, (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, c), 'A obra começou.');
    ok(pacote.mundoPersistente.cidade?.obra?.tipo === tipo, `${tipo}: narrador recebe obra em andamento`);
    povo.populacao = 0;
    (0, cidades_1.processarCidades)(vaelhorn_1.conteudoVaelhorn, c);
    ok(cidade.projeto.progresso === 0, `${tipo}: sem trabalhadores não progride`);
    povo.populacao = 60;
    cidade.comida = 600;
    povo.integridade = 100;
    c.mundo.guerraAtiva = { a: 'vila', b: 'foragidos', local: id, diasRestantes: 10, impulsoA: 0, impulsoB: 0 };
    (0, cidades_1.processarCidades)(vaelhorn_1.conteudoVaelhorn, c);
    ok(cidade.projeto.progresso === 0, `${tipo}: guerra interrompe`);
    c.mundo.guerraAtiva = undefined;
    (0, cidades_1.processarCidades)(vaelhorn_1.conteudoVaelhorn, c);
    ok(cidade.projeto.progresso > 0, `${tipo}: paz permite retomada`);
    const salvo = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(c)));
    ok(JSON.stringify(salvo.vivo.cidades[id]) === JSON.stringify(cidade), `${tipo}: save preserva projeto e estoques`);
    for (let dia = 2; dia < 110 && cidade.edificios[tipo] === nivel; dia++) {
        c.calendario.dia = dia;
        (0, cidades_1.processarCidades)(vaelhorn_1.conteudoVaelhorn, c);
    }
    ok(cidade.edificios[tipo] === nivel + 1, `${tipo}: obra incrementa apenas um nível`);
    ok(c.vivo.fatos.filter(f => f.tipo === 'obra_concluida' && f.local === id).length >= 1, `${tipo}: conclusão vira acontecimento`);
    cidade.projeto = undefined;
    cidade.edificios[tipo] = 5;
    cidade.materiais = 200;
    ok(!(0, cidades_1.iniciarObra)(c, id, tipo) && cidade.materiais === 200, `${tipo}: teto não consome materiais`);
}
{
    const c = nova(), id = Object.keys(c.vivo.cidades)[0];
    c.localAtual = id;
    (0, historiaViva_1.registrarFato)(c, { tipo: 'teste', local: id, texto: 'SEGREDO_NAO_REVELADO_819', atores: [], publico: false });
    (0, historiaViva_1.registrarFato)(c, { tipo: 'teste', local: id, texto: 'Uma caravana talvez esteja chegando.', atores: [], publico: true, conhecimento: 'rumor' });
    const antes = JSON.stringify(c);
    const pacote = (0, llm_1.montarPacote)(vaelhorn_1.conteudoVaelhorn, c, (0, availability_1.calcularContexto)(vaelhorn_1.conteudoVaelhorn, c), 'Você observa a comunidade.');
    ok(!JSON.stringify(pacote).includes('SEGREDO_NAO_REVELADO_819'), 'Fato histórico oculto não chega ao narrador');
    ok(pacote.mundoPersistente.fatos?.some(f => f.fonte === 'rumor'), 'Rumor chega identificado, não como confirmação');
    ok(JSON.stringify(c) === antes, 'Montar contexto não altera a campanha');
    ok(pacote.personagem.nome === 'Morador', 'Contexto identifica o protagonista desta campanha');
}
