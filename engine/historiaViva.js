"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSEGURANCA_QUE_RECOLHE = void 0;
exports.iniciarMundoVivo = iniciarMundoVivo;
exports.proximoPasso = proximoPasso;
exports.cidadeIdDoLocal = cidadeIdDoLocal;
exports.cidadeDoLocal = cidadeDoLocal;
exports.localEfetivo = localEfetivo;
exports.registrarFato = registrarFato;
exports.descobrirNoticias = descobrirNoticias;
exports.fatosConhecidos = fatosConhecidos;
exports.biografiaCivil = biografiaCivil;
const time_1 = require("./time");
function iniciarMundoVivo(content, camp) {
    const v = camp.vivo ??= {
        versao: 1, ultimoDia: camp.mundo?.diaProcessado ?? camp.calendario.dia, sequencia: 0,
        cidades: {}, pessoas: {}, governos: {}, fatos: [], missoes: [], arquivo: [],
        diretor: { proximoIncidente: camp.calendario.dia + 10, intensidade: 0 }, contadores: {},
    };
    for (const [id] of Object.entries(camp.continuidade?.locais ?? {})) {
        v.cidades[id] ??= {
            comida: 160, materiais: 90, remedios: 30, tesouro: 150,
            edificios: { lavoura: 1, moradias: 1, enfermaria: 1, muralha: 1, mercado: 1 },
            fomeDias: 0, doenca: 0, inseguranca: 5, secaAte: 0, ultimoIncidente: -100,
            estoque: {},
        };
    }
    // Shops can be outside a population centre; they share the nearest reachable market.
    for (const item of content.itens)
        for (const local of item.lojas ?? []) {
            const cidade = cidadeDoLocal(content, camp, local);
            if (cidade)
                cidade.estoque[item.id] ??= item.raridade === 'comum' ? 12 : 2;
        }
    for (const npc of [...content.npcs, ...(camp.npcsProcedurais ?? [])]) {
        if (!camp.npcState[npc.id])
            continue;
        const cativo = camp.familia?.membros.find(m => m.id === npc.id)?.condicao === 'cativo';
        v.pessoas[npc.id] ??= {
            natal: npc.localBase,
            casa: npc.localBase, local: npc.localBase, deslocado: false,
            objetivo: cativo ? 'cativo' : 'rotina', moedas: 20, fome: 0, saude: 100,
            habilidade: npc.combatente ? 5 : 1, prestigio: 0, proximaDecisao: camp.calendario.dia + 3,
            parceiros: {}, filhos: [],
        };
    }
    for (const f of content.faccoes.filter(f => !['onis', 'cacadores'].includes(f.id))) {
        v.governos[f.id] ??= { legitimidade: 65, sucessoes: 0, relacoes: {}, treguaAte: {} };
    }
    return v;
}
function proximoPasso(content, origem, destino) {
    if (origem === destino)
        return origem;
    const fila = [{ id: origem, primeiro: '' }];
    const vistos = new Set([origem]);
    for (let i = 0; i < fila.length; i++) {
        const atual = fila[i];
        for (const r of content.locais.find(l => l.id === atual.id)?.rotas ?? []) {
            if (vistos.has(r.destino))
                continue;
            const primeiro = atual.primeiro || r.destino;
            if (r.destino === destino)
                return primeiro;
            vistos.add(r.destino);
            fila.push({ id: r.destino, primeiro });
        }
    }
}
function cidadeIdDoLocal(content, camp, local) {
    const cidades = camp.vivo?.cidades ?? {};
    if (cidades[local])
        return local;
    const fila = [local], vistos = new Set(fila);
    for (let i = 0; i < fila.length; i++) {
        for (const r of content.locais.find(l => l.id === fila[i])?.rotas ?? []) {
            if (cidades[r.destino])
                return r.destino;
            if (!vistos.has(r.destino)) {
                vistos.add(r.destino);
                fila.push(r.destino);
            }
        }
    }
}
function cidadeDoLocal(content, camp, local) {
    const id = cidadeIdDoLocal(content, camp, local);
    return id ? camp.vivo?.cidades[id] : undefined;
}
function localEfetivo(camp, npc, periodo = (0, time_1.periodoAtual)(camp.calendario), content) {
    if (camp.npcState[npc.id]?.vivo === false)
        return;
    if ((camp.grupo ?? []).includes(npc.id))
        return camp.localAtual;
    const pessoa = camp.vivo?.pessoas[npc.id];
    if (pessoa?.viagem)
        return; // In transit, not simultaneously at both ends.
    if (pessoa?.deslocado || pessoa?.objetivo === 'cativo')
        return pessoa.local;
    const expediente = npc.expediente;
    if (expediente && pessoa) {
        // Dia zero da campanha começa numa segunda-feira para o calendário do
        // mundo; o deslocamento +1 mantém saves antigos determinísticos.
        const diaDaSemana = (camp.calendario.dia + 1) % 7;
        const doenteOuFaminto = (pessoa.saude ?? 100) < 45 || (pessoa.fome ?? 0) > 80;
        const emExpediente = expediente.diasTrabalho.includes(diaDaSemana) && expediente.periodos.includes(periodo);
        if (doenteOuFaminto || !emExpediente)
            return pessoa.casa ?? npc.localBase;
    }
    const previsto = npc.rotina[periodo] ?? npc.localBase;
    return recolhidoPeloMedo(camp, npc, previsto, content) ? npc.localBase : previsto;
}
/**
 * Quando a casa fica perigosa, a rotina muda.
 *
 * Pendência aberta desde a sessão 15: os moradores mantinham o mesmo dia
 * mesmo com a vila sitiada. A capela às três da manhã continuava cheia com
 * bandido acampado na estrada, porque a rotina era tabela fixa e o mundo não
 * chegava nela.
 *
 * A regra é a que qualquer um seguiria: **com medo, ninguém dorme no mato**.
 * Quem sairia do assentamento fica dentro dele. Não se aplica a quem está
 * dentro do próprio lugar (já está seguro), nem a quem é pago para enfrentar —
 * guarda e caçador continuam saindo, e é essa a diferença entre eles e o resto.
 *
 * O medo vem do estado vivo da própria cidade, não de um parâmetro solto: a
 * insegurança que a autonomia e as ameaças já calculam.
 */
exports.INSEGURANCA_QUE_RECOLHE = 55;
function recolhidoPeloMedo(camp, npc, previsto, content) {
    if (previsto === npc.localBase)
        return false;
    if (npc.combatente)
        return false;
    // Ameaça ativa no lugar para onde a pessoa iria: ninguém vai capinar o campo
    // onde tem oni. Vale mesmo sem cidade, porque é sobre o destino, não a casa.
    if (camp.continuidade?.ameacas.some(a => a.local === previsto && a.estado === 'ativa'))
        return true;
    // Medo difuso, vindo do estado vivo da própria cidade. A busca completa por
    // cidade mais próxima (`cidadeIdDoLocal`) exige o `content`, que esta função
    // não recebe e cuja assinatura eu não quero mudar só por isto — então aqui
    // só se resolve o caso direto. Na prática cobre os moradores gerados, cujo
    // `localBase` É o assentamento; um NPC escrito à mão que mora na taverna não
    // sente o medo difuso, só a ameaça concreta acima.
    const cidadeId = content ? cidadeIdDoLocal(content, camp, npc.localBase) : npc.localBase;
    const cidade = cidadeId ? camp.vivo?.cidades[cidadeId] : undefined;
    return !!cidade && cidade.inseguranca >= exports.INSEGURANCA_QUE_RECOLHE;
}
function registrarFato(camp, entrada) {
    const v = camp.vivo;
    const fato = {
        ...entrada, id: `fato_${++v.sequencia}`, dia: camp.calendario.dia,
        conhecimento: entrada.conhecimento ?? (entrada.local === camp.localAtual && entrada.publico ? 'testemunhado' : 'oculto'),
    };
    v.fatos.push(fato);
    v.contadores[fato.tipo] = (v.contadores[fato.tipo] ?? 0) + 1;
    // Causal links carry their own immutable summary when old entries are compacted.
    while (v.fatos.length > 300) {
        const velho = v.fatos.shift();
        const ano = Math.floor(velho.dia / 365);
        let arquivo = v.arquivo.find(a => a.ano === ano);
        if (!arquivo) {
            arquivo = { ano, acontecimentos: 0, tipos: {} };
            v.arquivo.push(arquivo);
        }
        arquivo.acontecimentos++;
        arquivo.tipos[velho.tipo] = (arquivo.tipos[velho.tipo] ?? 0) + 1;
    }
    return fato;
}
function descobrirNoticias(content, camp) {
    const v = camp.vivo;
    if (!v)
        return;
    for (const f of v.fatos) {
        if (!f.publico || f.conhecimento !== 'oculto')
            continue;
        if (f.local === camp.localAtual)
            f.conhecimento = 'confirmado';
        else if (camp.calendario.dia - f.dia >= 3 && camp.locaisVisitados.includes(f.local) && proximoPasso(content, f.local, camp.localAtual))
            f.conhecimento = 'rumor';
    }
    for (const q of v.missoes)
        if (q.local === camp.localAtual || v.fatos.some(f => f.id === q.causa.id && f.conhecimento !== 'oculto'))
            q.conhecida = true;
}
function fatosConhecidos(camp, quantos = 12) {
    return (camp.vivo?.fatos ?? []).filter(f => f.conhecimento !== 'oculto').slice(-quantos);
}
function biografiaCivil(camp, npcId) {
    return fatosConhecidos(camp, 300).filter(f => f.atores.includes(npcId)).slice(-8).map(f => `Dia ${f.dia}: ${f.texto}`);
}
