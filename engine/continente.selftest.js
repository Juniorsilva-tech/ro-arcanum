"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Testes do continente de Halvern e do perigo dinâmico de rota.
//
// Duas promessas em teste aqui. A primeira: o mapa é navegável — toda rota vale
// nos dois sentidos e todo lugar é alcançável, porque a autonomia dos NPCs e o
// planejador do simulador dependem de busca de caminho. A segunda: o perigo de
// uma estrada é função do que está acontecendo nas pontas, não de um número
// escrito à mão no conteúdo.
const vaelhorn_1 = require("../content/vaelhorn");
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const migracao_1 = require("./migracao");
const historiaViva_1 = require("./historiaViva");
const viagem_1 = require("./viagem");
const missoesVivas_1 = require("./missoesVivas");
const time_1 = require("./time");
const ok = (v, msg) => { if (!v)
    throw new Error(msg); console.log(`✓ ${msg}`); };
const nova = (seed = 'continente') => (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, {
    nome: 'Andarilho', atributos: (0, character_1.atributosBase)(), classeId: 'guardiao', origemId: 'divida', seedString: seed,
});
// ── O mapa ────────────────────────────────────────────────────────────────
{
    const porId = new Map(vaelhorn_1.conteudoVaelhorn.locais.map(l => [l.id, l]));
    const orfas = [];
    const assimetricas = [];
    for (const l of vaelhorn_1.conteudoVaelhorn.locais) {
        for (const r of l.rotas) {
            if (!porId.has(r.destino))
                orfas.push(`${l.id} → ${r.destino}`);
            else if (!porId.get(r.destino).rotas.some(v => v.destino === l.id)) {
                assimetricas.push(`${l.id} → ${r.destino}`);
            }
        }
    }
    ok(orfas.length === 0, `Nenhuma rota aponta para lugar inexistente${orfas.length ? `: ${orfas[0]}` : ''}`);
    ok(assimetricas.length === 0, `Toda rota vale nos dois sentidos${assimetricas.length ? ` (falha: ${assimetricas[0]})` : ''}`);
    // Alcançabilidade real, pela mesma busca que a engine usa.
    const inalcancaveis = vaelhorn_1.conteudoVaelhorn.locais
        .filter(l => l.id !== vaelhorn_1.conteudoVaelhorn.localInicial && !(0, historiaViva_1.proximoPasso)(vaelhorn_1.conteudoVaelhorn, vaelhorn_1.conteudoVaelhorn.localInicial, l.id))
        .map(l => l.id);
    ok(inalcancaveis.length === 0, `Todo lugar é alcançável a partir do início${inalcancaveis.length ? ` (ilhado: ${inalcancaveis.join(', ')})` : ''}`);
    const semEncontro = vaelhorn_1.conteudoVaelhorn.locais.filter(l => !vaelhorn_1.conteudoVaelhorn.encontrosPorTipo?.[l.tipo]).map(l => `${l.id}(${l.tipo})`);
    ok(semEncontro.length === 0, `Todo tipo de local tem tabela de encontros${semEncontro.length ? ` (falta: ${semEncontro[0]})` : ''}`);
    const ids = vaelhorn_1.conteudoVaelhorn.locais.map(l => l.id);
    ok(new Set(ids).size === ids.length, 'Nenhum id de local repetido');
}
// ── Tamanho e história ────────────────────────────────────────────────────
{
    const regioes = new Set(vaelhorn_1.conteudoVaelhorn.locais.map(l => l.regiao));
    ok(vaelhorn_1.conteudoVaelhorn.locais.length >= 45, `O continente tem ${vaelhorn_1.conteudoVaelhorn.locais.length} lugares (mínimo 45)`);
    ok(regioes.size >= 7, `O mundo tem ${regioes.size} regiões distintas`);
    const comHistoria = vaelhorn_1.conteudoVaelhorn.locais.filter(l => (l.historia?.length ?? 0) > 0);
    ok(comHistoria.length >= 25, `${comHistoria.length} lugares carregam história própria`);
    ok(comHistoria.every(l => l.historia.every(h => h.length > 40)), 'Nenhuma entrada de história é uma linha vazia de enfeite');
}
// ── Assentamentos vivos ───────────────────────────────────────────────────
{
    const c = nova();
    const assentamentos = Object.keys(c.continuidade.locais);
    ok(assentamentos.length >= 12, `${assentamentos.length} assentamentos com economia e insegurança próprias (antes eram 5)`);
    ok(assentamentos.includes('tessel') && assentamentos.includes('mareu') && assentamentos.includes('vintra'), 'As cidades e vilas novas são assentamentos de verdade, não cenário');
    ok(Object.keys(c.vivo.cidades).length === assentamentos.length, 'Todo assentamento tem estado vivo correspondente');
}
// ── Perigo dinâmico ───────────────────────────────────────────────────────
function rotaDe(c, origem) {
    const l = vaelhorn_1.conteudoVaelhorn.locais.find(x => x.id === origem);
    return l.rotas[0];
}
{
    const c = nova('perigo');
    const origem = 'praca';
    const r = rotaDe(c, origem);
    const base = (0, viagem_1.perigoEfetivoDaRota)(vaelhorn_1.conteudoVaelhorn, c, origem, r.destino, r.perigo);
    // Insegurança sobe → a estrada fica perigosa sem ninguém reescrever conteúdo.
    const cidadeId = (0, historiaViva_1.cidadeIdDoLocal)(vaelhorn_1.conteudoVaelhorn, c, r.destino);
    c.vivo.cidades[cidadeId].inseguranca = 100;
    const comCrise = (0, viagem_1.perigoEfetivoDaRota)(vaelhorn_1.conteudoVaelhorn, c, origem, r.destino, r.perigo);
    ok(comCrise > base, `Vila em crise torna a rota mais perigosa (${base.toFixed(1)} → ${comCrise.toFixed(1)})`);
    c.vivo.cidades[cidadeId].inseguranca = 0;
    const emPaz = (0, viagem_1.perigoEfetivoDaRota)(vaelhorn_1.conteudoVaelhorn, c, origem, r.destino, r.perigo);
    ok(emPaz < comCrise, 'Voltando a paz, a mesma rota volta a ser tranquila');
    // Ameaça anunciada pesa por si.
    c.continuidade.ameacas.push({
        id: 'a1', rivalId: 'r1', criaturaId: 'oni_faminto', local: r.destino,
        inicio: 0, prazo: 10, estado: 'ativa', descoberta: true,
    });
    const comAmeaca = (0, viagem_1.perigoEfetivoDaRota)(vaelhorn_1.conteudoVaelhorn, c, origem, r.destino, r.perigo);
    ok(comAmeaca > emPaz, 'Ameaça ativa no destino aumenta o perigo da viagem');
    // Um caçador no lugar devolve segurança.
    const cacador = vaelhorn_1.conteudoVaelhorn.npcs.find(n => n.combatente);
    c.vivo.pessoas[cacador.id] = {
        ...c.vivo.pessoas[cacador.id], objetivo: 'cacar', local: r.destino, deslocado: true,
    };
    const comGuarda = (0, viagem_1.perigoEfetivoDaRota)(vaelhorn_1.conteudoVaelhorn, c, origem, r.destino, r.perigo);
    ok(comGuarda < comAmeaca, 'Um caçador presente no local reduz o perigo — a segurança responde');
    ok((0, viagem_1.perigoEfetivoDaRota)(vaelhorn_1.conteudoVaelhorn, c, origem, r.destino, 0) >= 0, 'O perigo efetivo nunca fica negativo');
}
// ── Rival acampado ────────────────────────────────────────────────────────
{
    const c = nova('rival');
    const l = vaelhorn_1.conteudoVaelhorn.locais.find(x => x.id === 'estrada');
    const r = l.rotas[0];
    const antes = (0, viagem_1.perigoEfetivoDaRota)(vaelhorn_1.conteudoVaelhorn, c, 'estrada', r.destino, r.perigo);
    c.kimetsu.rivais['x'] = {
        id: 'x', criaturaId: 'oni_da_estrada', nome: 'Errante', vivo: true, vida: 40,
        local: r.destino, ultimoDia: 0, reencontros: 1, vitorias: 0, fugas: 0, rancor: 3, memoria: [],
        evolucao: { nivel: 2, servos: 4, papel: 'predador', plano: 'alimentar', proximaAcao: 0, refugio: r.destino, adaptacoes: {} },
    };
    const depois = (0, viagem_1.perigoEfetivoDaRota)(vaelhorn_1.conteudoVaelhorn, c, 'estrada', r.destino, r.perigo);
    ok(depois > antes, `Rival acampado com servos torna a rota mais perigosa (${antes.toFixed(1)} → ${depois.toFixed(1)})`);
}
// ── Saves antigos ─────────────────────────────────────────────────────────
{
    const velho = nova('save-antigo');
    velho.localAtual = 'taverna';
    // Um save de antes do continente não conhece os assentamentos novos.
    for (const id of ['tessel', 'mareu', 'vintra', 'corveira', 'solgar']) {
        delete velho.continuidade.locais[id];
        delete velho.vivo.cidades[id];
    }
    const migrado = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(velho)));
    ok(migrado.localAtual === 'taverna', 'Save antigo continua onde estava');
    ok(!!migrado.continuidade.locais.tessel || Object.keys(migrado.continuidade.locais).length >= 5, 'Carregar um save antigo não quebra por causa de lugares que não existiam');
    ok(!!migrado.vivo, 'O mundo vivo sobrevive à migração com o mapa ampliado');
}
// ── Escala geográfica ─────────────────────────────────────────────────────
//
// Medido na sessão 21: com 53 lugares, nenhum par do mapa ficava a mais de
// DOIS dias de distância. O continente inteiro tinha a largura de uma tarde, e
// isso esvaziava prazo de missão, perigo acumulado de rota e a própria decisão
// de para onde ir. Estes testes prendem a escala para que ela não volte a
// encolher sem alguém perceber.
{
    const dias = [];
    const ids = vaelhorn_1.conteudoVaelhorn.locais.filter(l => l.regiao !== 'Fora do Mundo').map(l => l.id);
    for (const a of ids) {
        for (const b of ids) {
            if (a === b)
                continue;
            const p = (0, missoesVivas_1.periodosDeViagem)(vaelhorn_1.conteudoVaelhorn, a, b);
            if (Number.isFinite(p))
                dias.push(Math.ceil(p / time_1.PERIODOS.length));
        }
    }
    dias.sort((x, y) => x - y);
    const mediana = dias[Math.floor(dias.length / 2)];
    const maximo = dias[dias.length - 1];
    ok(dias.length > 1000, `O mapa é conexo de verdade (${dias.length} pares alcançáveis)`);
    ok(mediana >= 3, `Atravessar o continente custa dias, não horas (mediana ${mediana}d)`);
    ok(maximo >= 5, `As pontas do mapa são longe uma da outra (máximo ${maximo}d)`);
    // A outra metade da regra: dentro da região continua sendo questão de horas.
    // Sem isso, ir da praça ao mercado custaria um dia e a cidade deixaria de
    // funcionar como cidade.
    const porId = new Map(vaelhorn_1.conteudoVaelhorn.locais.map(l => [l.id, l]));
    const curtas = vaelhorn_1.conteudoVaelhorn.locais.flatMap(l => l.rotas.filter(r => porId.get(r.destino)?.regiao === l.regiao).map(r => r.periodos));
    ok(curtas.length > 0, 'Existem rotas dentro da mesma região');
    ok(Math.max(...curtas) <= time_1.PERIODOS.length, `Andar dentro da região não passa de um dia (máx ${Math.max(...curtas)} períodos)`);
    // Zero é o autor dizendo "praticamente o mesmo lugar". A escala não pode
    // inventar distância que a ficção nega.
    const colados = vaelhorn_1.conteudoVaelhorn.locais.flatMap(l => l.rotas.filter(r => r.periodos === 0));
    ok(colados.length > 0, `Lugares colados continuam colados (${colados.length} rotas de custo zero)`);
}
// Uma missão oferecida do outro lado do mapa precisa caber no próprio prazo,
// senão é formalidade e não oferta.
{
    const c = nova('prazo-distante');
    const longe = vaelhorn_1.conteudoVaelhorn.locais.find(l => {
        const p = (0, missoesVivas_1.periodosDeViagem)(vaelhorn_1.conteudoVaelhorn, c.localAtual, l.id);
        return Number.isFinite(p) && p / time_1.PERIODOS.length >= 4;
    });
    ok(!!longe, `Existe lugar a quatro dias ou mais de ${c.localAtual}`);
    const ida = (0, missoesVivas_1.periodosDeViagem)(vaelhorn_1.conteudoVaelhorn, c.localAtual, longe.id);
    const janela = (0, missoesVivas_1.janelaMissao)(c, 'resgatar', longe.id, ida);
    const diasIda = Math.ceil(ida / time_1.PERIODOS.length);
    ok(janela.dias > diasIda, `O prazo do resgate distante cobre a chegada (${janela.dias}d para ${diasIda}d de ida)`);
}
// ── Rosto de cada região ──────────────────────────────────────────────────
//
// Medido na sessão 21: o perigo de cada região já variava como NÚMERO (Vale
// 3,7 · Bosque de Vintra 6,0 · Ermo de Solgar 5,5), mas o sorteio ignorava
// região por completo — duas aldeias em regiões diferentes cuspiam listas
// **100% idênticas**. A região tinha intensidade e não tinha rosto.
{
    const fora = ['Fora do Mundo', 'Fora do Vale'];
    const porTipo = {};
    for (const l of vaelhorn_1.conteudoVaelhorn.locais) {
        if (!l.regiao || fora.includes(l.regiao))
            continue;
        const lista = (porTipo[l.tipo] ??= []);
        if (lista.some(x => x.regiao === l.regiao))
            continue;
        lista.push({ regiao: l.regiao, ids: new Set((0, viagem_1.encontrosDoLugar)(vaelhorn_1.conteudoVaelhorn, l)) });
    }
    let soma = 0, n = 0;
    for (const lista of Object.values(porTipo)) {
        if (lista.length < 2)
            continue;
        let s = 0, c = 0;
        for (let i = 0; i < lista.length; i++) {
            for (let j = i + 1; j < lista.length; j++) {
                const a = lista[i].ids, b = lista[j].ids;
                s += [...a].filter(x => b.has(x)).length / new Set([...a, ...b]).size;
                c++;
            }
        }
        soma += s / c;
        n++;
    }
    const semelhanca = soma / n;
    ok(n >= 5, `Há tipos de lugar repetidos entre regiões para comparar (${n})`);
    ok(semelhanca < 0.7, `O mesmo tipo de lugar muda de elenco conforme a região (${(semelhanca * 100).toFixed(0)}% igual)`);
    // A soma não pode esvaziar nem inflar: todo lugar continua sorteável, e a
    // região só acrescenta ao que o tipo já dava.
    for (const l of vaelhorn_1.conteudoVaelhorn.locais) {
        if (l.regiao === 'Fora do Mundo')
            continue;
        const doTipo = vaelhorn_1.conteudoVaelhorn.encontrosPorTipo?.[l.tipo] ?? [];
        const juntos = (0, viagem_1.encontrosDoLugar)(vaelhorn_1.conteudoVaelhorn, l);
        if (doTipo.length === 0)
            continue;
        const perdeu = doTipo.filter(id => !juntos.includes(id) && !vaelhorn_1.conteudoVaelhorn.criaturas.find(c => c.id === id)?.regiaoExclusiva);
        ok(perdeu.length === 0, `${l.id} não perde encontro do próprio tipo ao somar a região`);
        ok(juntos.length >= doTipo.length - perdeu.length, `${l.id} continua com elenco sorteável`);
    }
    // Toda região do continente precisa ter tabela própria, senão ela herda o
    // mundo inteiro e volta a não ter rosto.
    const regioesDoMapa = new Set(vaelhorn_1.conteudoVaelhorn.locais.map(l => l.regiao).filter(r => r && !fora.includes(r) && r !== 'Vale de Halvet'));
    for (const r of regioesDoMapa) {
        ok(!!vaelhorn_1.conteudoVaelhorn.encontrosPorRegiao?.[r], `A região ${r} tem elenco característico`);
    }
}
console.log('Testes do continente e do perigo dinâmico passaram.');
