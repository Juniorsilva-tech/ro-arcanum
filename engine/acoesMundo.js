"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executarAcaoMundo = executarAcaoMundo;
const historiaViva_1 = require("./historiaViva");
const cidades_1 = require("./cidades");
const missoesVivas_1 = require("./missoesVivas");
const time_1 = require("./time");
const mundo_1 = require("./mundo");
const impulsos_1 = require("./impulsos");
const rng_1 = require("./rng");
const combat_1 = require("./combat");
const kimetsu_1 = require("./kimetsu");
const progresso_1 = require("./progresso");
const aptidao_1 = require("./aptidao");
const aptidao_2 = require("./aptidao");
const elenco_1 = require("./elenco");
const historiaViva_2 = require("./historiaViva");
const progressaoNpc_1 = require("./progressaoNpc");
const progresso_2 = require("./progresso");
const classe_1 = require("./classe");
function executarAcaoMundo(content, camp, acao) {
    if (camp.combate && !camp.combate.terminado)
        return { ok: false, texto: 'Termine o combate primeiro.' };
    if (camp.familia && !camp.familia.prologoConcluido)
        return { ok: false, texto: 'Conclua a infância primeiro.' };
    iniciarMundoVivoSePreciso(content, camp);
    const v = camp.vivo, p = camp.personagem, dia = camp.calendario.dia;
    if (p.condicoes.includes('cativo') && acao.tipo !== 'libertar_se')
        return { ok: false, texto: 'Você precisa recuperar a liberdade.' };
    const local = (0, historiaViva_1.cidadeIdDoLocal)(content, camp, camp.localAtual), c = local && v.cidades[local];
    const terminar = (texto, periodos = 1) => {
        camp.turno++;
        camp.capitulo.periodosDecorridos += periodos;
        camp.calendario = (0, time_1.avancarPeriodos)(camp.calendario, periodos);
        (0, impulsos_1.crescerImpulsos)(camp, periodos);
        (0, mundo_1.avancarMundo)(content, camp);
        (0, historiaViva_1.descobrirNoticias)(content, camp);
        (0, progresso_1.processarSubidaDeNivel)(camp);
        return { ok: true, texto };
    };
    if (acao.tipo === 'desafio') {
        const desafio = content.desafios?.find(d => d.id === acao.id && d.local === camp.localAtual);
        if (!desafio || camp.flags[`desafio.concluido.${desafio.id}`])
            return { ok: false, texto: 'Esta expedição não está disponível aqui.' };
        const r = terminar(`Você se prepara para enfrentar ${desafio.titulo}.`, 1);
        (0, combat_1.iniciarCombate)(content, camp, [desafio.criaturaId]);
        return { ...r, combate: true };
    }
    if (acao.tipo === 'treinar_companheiro') {
        const npc = (0, elenco_1.npcPorId)(content, camp, acao.npcId);
        if (!npc?.combatente || !camp.grupo?.includes(npc.id) || !camp.npcState[npc.id]?.vivo || (0, historiaViva_2.localEfetivo)(camp, npc, undefined, content) !== camp.localAtual)
            return { ok: false, texto: 'Convide um combatente presente para o grupo primeiro.' };
        if (p.dinheiro < 5)
            return { ok: false, texto: 'O treino exige 5 moedas em alimentação e material.' };
        if (!(0, progressaoNpc_1.treinarNpc)(camp, npc, 3))
            return { ok: false, texto: 'Esse companheiro não pode treinar agora.' };
        p.dinheiro -= 5;
        (0, aptidao_2.treinar)(content, camp, 'espada', { mestre: .5, esforco: .8, recursos: .7, observadorId: npc.id });
        return terminar(`Você e ${npc.nome} treinaram juntos. A prática melhora a capacidade de ambos.`, 2);
    }
    if (acao.tipo === 'consolidar_legado') {
        if (!camp.flags['desafio.concluido.expedicao_cavaleira_do_eclipse'] || (0, aptidao_2.maestriaDe)(camp, 'espada') < 80)
            return { ok: false, texto: 'Supere a prova do eclipse e alcance maestria 80 na lâmina.' };
        if (!(0, progresso_2.concederDespertar)(camp, 'dominou_prova_eclipse', 'você consolidou o legado da prova do eclipse'))
            return { ok: false, texto: 'Esse legado já faz parte de você.' };
        return terminar('O legado do eclipse se consolidou no seu corpo e na sua técnica.', 2);
    }
    if (acao.tipo === 'libertar_se') {
        if (!p.condicoes.includes('cativo'))
            return { ok: false, texto: 'Você já está livre.' };
        const pagar = p.dinheiro >= 20;
        if (pagar)
            p.dinheiro -= 20;
        const escapou = pagar || (0, rng_1.nextFloat)(camp.rng) < .65;
        if (escapou)
            p.condicoes = p.condicoes.filter(x => x !== 'cativo');
        (0, historiaViva_1.registrarFato)(camp, { tipo: escapou ? 'liberdade_jogador' : 'fuga_frustrada', local: camp.localAtual, texto: escapou ? 'Você recuperou a liberdade após o cativeiro.' : 'A tentativa de fuga falhou; os captores redobraram a atenção.', atores: ['jogador'], publico: false, conhecimento: 'testemunhado' });
        return terminar(escapou ? 'Você recuperou a liberdade.' : 'A tentativa falhou. Você aguarda outra oportunidade.', 3);
    }
    if (acao.tipo === 'conter_se') {
        // Mostrar menos do que se sabe é jogada, não passividade: atrasa fama e
        // reputação, e cobra o preço de aprender mais devagar (ver aptidao.ts).
        const agora = (0, aptidao_1.alternarOcultacao)(camp);
        return terminar(agora
            ? 'Você decide medir o que mostra. Quem olhar vai ver menos do que existe.'
            : 'Você para de se conter. Daqui para a frente, o que você sabe aparece.', 0);
    }
    if (acao.tipo === 'noticias') {
        const noticia = v.fatos.find(f => f.publico && f.conhecimento === 'oculto' && dia - f.dia >= 2);
        if (noticia)
            noticia.conhecimento = 'rumor';
        (0, historiaViva_1.descobrirNoticias)(content, camp);
        return terminar(noticia ? `Você ouviu: ${noticia.texto}` : 'Você ouviu as notícias locais. Não surgiu informação nova.');
    }
    if (acao.tipo === 'descansar') {
        const custo = c ? 3 : 0;
        if (p.dinheiro < custo)
            return { ok: false, texto: 'A hospedagem custa 3 moedas. Trabalhe para pagar a estadia.' };
        p.dinheiro -= custo;
        // Cacadora recupera mais; curandeira trata mais coisa (engine/classe.ts).
        const mult = (0, classe_1.multiplicadorDeDescanso)(camp);
        for (const recurso of Object.keys(p.recursosMax))
            p.recursos[recurso] = Math.min(p.recursosMax[recurso], (p.recursos[recurso] ?? 0) + Math.max(5, Math.ceil(p.recursosMax[recurso] * .35 * mult)));
        const tratadas = (0, classe_1.condicoesTratadasAoDescansar)(camp);
        p.condicoes = p.condicoes.filter(x => !tratadas.includes(x));
        camp.impulsos.sono = 0;
        return terminar('Você descansou, recuperou parte das forças e deixou o mundo seguir por algumas horas.', 3);
    }
    if (acao.tipo === 'trabalhar') {
        if (!c || !local || c.tesouro < 6 || camp.continuidade.locais[local].populacao === 0)
            return { ok: false, texto: 'Não há trabalho pago disponível nesta comunidade.' };
        c.tesouro -= 6;
        p.dinheiro += 6;
        c.materiais = Math.min(250, c.materiais + 3);
        return terminar('Você trabalhou na comunidade e recebeu 6 moedas.', 2);
    }
    if (acao.tipo === 'obra') {
        if (!local || local !== camp.localAtual || !c)
            return { ok: false, texto: 'Visite o centro da comunidade para propor uma obra.' };
        if (p.dinheiro < 15)
            return { ok: false, texto: 'A contribuição inicial custa 15 moedas.' };
        if (!(0, cidades_1.iniciarObra)(camp, local, acao.edificio))
            return { ok: false, texto: 'Já existe uma obra, faltam materiais ou esse edifício atingiu o limite.' };
        p.dinheiro -= 15;
        return terminar(`${cidades_1.EDIFICIOS[acao.edificio].nome}: a construção começou. Os trabalhadores precisam de paz e alimento para concluí-la.`);
    }
    if (acao.tipo === 'diplomacia') {
        const a = v.governos[acao.a], b = v.governos[acao.b];
        if (!a || !b || acao.a === acao.b || !c || ![acao.a, acao.b].includes(c.governo ?? ''))
            return { ok: false, texto: 'Procure uma comunidade administrada por uma das facções envolvidas.' };
        const chave = `diplomacia.${[acao.a, acao.b].sort().join('.')}`;
        if (Number(camp.flags[chave] ?? -100) + 7 > dia)
            return { ok: false, texto: 'Aguarde uma semana para uma nova intervenção diplomática.' };
        if (p.dinheiro < 10)
            return { ok: false, texto: 'A negociação exige 10 moedas em deslocamentos e contatos.' };
        p.dinheiro -= 10;
        camp.flags[chave] = dia;
        if (acao.escolha === 'espionar') {
            const r = b.relacoes[acao.a] ?? 0;
            const texto = `Os contatos confirmaram que a relação entre as facções está ${r < -50 ? 'à beira de guerra' : r < 0 ? 'hostil' : 'cooperativa'}.`;
            (0, historiaViva_1.registrarFato)(camp, { tipo: 'espionagem', local: camp.localAtual, texto, atores: ['jogador'], publico: false, conhecimento: 'confirmado' });
            return terminar(texto, 2);
        }
        const sucesso = (0, rng_1.nextFloat)(camp.rng) < Math.min(.9, .3 + p.atributos.social / 40);
        const delta = sucesso ? 20 : -5;
        a.relacoes[acao.b] = Math.max(-100, Math.min(100, (a.relacoes[acao.b] ?? 0) + delta));
        b.relacoes[acao.a] = a.relacoes[acao.b];
        if (sucesso) {
            a.treguaAte[acao.b] = dia + 20;
            b.treguaAte[acao.a] = dia + 20;
            const guerra = camp.mundo?.guerraAtiva;
            if (guerra && [guerra.a, guerra.b].every(id => [acao.a, acao.b].includes(id))) {
                camp.mundo.guerraAtiva = undefined;
                camp.mundo.proximaGuerra = dia + 20;
            }
        }
        const texto = sucesso ? 'Sua mediação estabeleceu uma trégua de vinte dias.' : 'A negociação fracassou e agravou a desconfiança.';
        (0, historiaViva_1.registrarFato)(camp, { tipo: 'mediacao', local: camp.localAtual, texto, atores: ['jogador'], publico: true });
        return terminar(texto, 2);
    }
    if (acao.tipo !== 'missao')
        return { ok: false, texto: 'Ação desconhecida.' };
    const q = v.missoes.find(q => q.id === acao.id);
    if (!q || !q.conhecida || !['oferecida', 'aceita'].includes(q.estado) || dia > q.prazo)
        return { ok: false, texto: 'Essa missão não está disponível.' };
    if (acao.escolha === 'aceitar') {
        if (q.estado !== 'oferecida')
            return { ok: false, texto: 'Você já aceitou esse compromisso.' };
        q.estado = 'aceita';
        q.aceitaEm = dia;
        return terminar(`Você aceitou: ${q.titulo}.`);
    }
    if (q.estado !== 'aceita')
        return { ok: false, texto: 'Aceite o compromisso primeiro.' };
    const alvo = q.tipo === 'escoltar' && q.etapa > 0 ? q.destino : q.local;
    if (camp.localAtual !== alvo)
        return { ok: false, texto: `Você precisa chegar a ${content.locais.find(l => l.id === alvo)?.nome ?? alvo}.` };
    if (q.ator && !camp.npcState[q.ator]?.vivo)
        return { ok: false, texto: 'A pessoa envolvida morreu.' };
    const cidade = v.cidades[q.local];
    if (q.tipo === 'investigar') {
        const rival = q.rival && camp.kimetsu?.rivais[q.rival];
        if (!rival || !rival.vivo)
            return { ok: false, texto: 'O alvo já não está vivo.' };
        if (acao.escolha === 'investigar' && q.etapa === 0) {
            q.etapa = 1;
            (0, historiaViva_1.registrarFato)(camp, { tipo: 'pista_confirmada', local: q.local, texto: `Você encontrou rastros de ${rival.nome}. O alvo se oculta de dia e sai à noite.`, atores: [rival.id, 'jogador'], causa: q.causa, publico: false, conhecimento: 'confirmado' });
            return terminar(`Os rastros levam a ${rival.nome}. Retorne à noite para confrontá-lo.`);
        }
        if (acao.escolha !== 'confrontar' || q.etapa < 1)
            return { ok: false, texto: 'Investigue os rastros primeiro.' };
        if (rival.local !== camp.localAtual) {
            q.local = rival.local;
            q.etapa = 0;
            return terminar('O esconderijo está vazio. Novos rastros indicam outra região; será preciso investigar novamente.');
        }
        if (!(0, kimetsu_1.encontrosElegiveis)(content, camp, [rival.criaturaId]).length)
            return { ok: false, texto: 'O alvo se esconde do sol; aguarde a noite.' };
        // Perseguir custa tempo como toda ação deste painel. Sem isso o confronto
        // era a única saída que não movia o calendário: dava para repeti-lo
        // infinitas vezes no mesmo instante, e o rival — que só recupera os
        // ferimentos quando o dia vira (ver engine/kimetsu.ts) — era moído numa
        // sequência de tentativas gratuitas.
        const alcance = terminar(`Você alcançou ${rival.nome}.`);
        if (!rival.vivo || rival.local !== camp.localAtual || !['oferecida', 'aceita'].includes(q.estado))
            return { ok: true, texto: 'Durante a aproximação, a situação mudou. Consulte o compromisso e os novos rastros.' };
        // O período que passou pode ter trazido a luz do dia.
        if (!(0, kimetsu_1.encontrosElegiveis)(content, camp, [rival.criaturaId]).length) {
            return { ok: true, texto: 'Quando você chegou ao esconderijo, a luz já o protegia. Volte à noite.' };
        }
        (0, combat_1.iniciarCombate)(content, camp, [rival.criaturaId], rival.id);
        return { ...alcance, combate: true };
    }
    if (q.tipo === 'escoltar') {
        if (q.etapa === 0) {
            q.etapa = 1;
            return terminar('As famílias se prepararam. Conduza-as até a comunidade de destino.');
        }
        const origem = camp.continuidade?.locais[q.local], destino = q.destino && camp.continuidade?.locais[q.destino];
        if (!origem || !destino)
            return { ok: false, texto: 'O destino não é mais acessível.' };
        const quantidade = Math.min(4, origem.populacao);
        origem.populacao -= quantidade;
        destino.populacao += quantidade;
        (0, missoesVivas_1.encerrarMissao)(camp, q, 'concluida', `${quantidade} moradores chegaram em segurança à nova comunidade.`);
        return terminar(q.desfecho);
    }
    if (!cidade)
        return { ok: false, texto: 'A comunidade não está disponível.' };
    if (acao.escolha === 'negociar') {
        if (q.tentativas >= 2)
            return { ok: false, texto: 'Os contatos se esgotaram. A ajuda direta continua possível.' };
        q.tentativas++;
        if ((0, rng_1.nextFloat)(camp.rng) >= Math.min(.85, .25 + p.atributos.social / 45)) {
            cidade.inseguranca = Math.min(100, cidade.inseguranca + 3);
            return terminar('A negociação falhou. O prazo continua correndo.', 2);
        }
    }
    else {
        if (p.dinheiro < 30)
            return { ok: false, texto: 'A ajuda direta custa 30 moedas.' };
        p.dinheiro -= 30;
    }
    if (q.tipo === 'abastecer') {
        cidade.comida = Math.min(600, cidade.comida + 120);
        cidade.fomeDias = 0;
    }
    if (q.tipo === 'tratar') {
        cidade.doenca = Math.max(0, cidade.doenca - 60);
        cidade.remedios = Math.min(80, cidade.remedios + 10);
    }
    if (q.tipo === 'reconstruir') {
        camp.continuidade.locais[q.local].integridade = Math.min(100, camp.continuidade.locais[q.local].integridade + 30);
    }
    if (q.tipo === 'resgatar' && q.ator && v.pessoas[q.ator]) {
        v.pessoas[q.ator].objetivo = 'trabalhar';
        v.pessoas[q.ator].cativoAte = undefined;
        const familiar = camp.familia?.membros.find(m => m.id === q.ator);
        if (familiar)
            familiar.condicao = 'livre';
    }
    (0, missoesVivas_1.encerrarMissao)(camp, q, 'concluida', `${q.titulo}: você organizou a ajuda e mudou a situação da comunidade.`);
    return terminar(q.desfecho, 2);
}
function iniciarMundoVivoSePreciso(content, camp) {
    if (!camp.vivo)
        (0, historiaViva_1.iniciarMundoVivo)(content, camp);
}
