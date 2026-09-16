"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iniciarFamilia = iniciarFamilia;
exports.resolverEtapaInfancia = resolverEtapaInfancia;
exports.resumoFamilia = resumoFamilia;
exports.registrarMorteFamiliar = registrarMorteFamiliar;
exports.sincronizarIdadeFamilia = sincronizarIdadeFamilia;
exports.resgatarParente = resgatarParente;
const rng_1 = require("./rng");
const progresso_1 = require("./progresso");
const OFICIOS_COMUNS = ['lavrador', 'criadora de animais', 'ferreiro', 'curandeira', 'mercador itinerante', 'caçadora', 'escriba', 'soldado'];
const OFICIOS_RAROS = ['herói aposentado', 'mestre da espada', 'maga de corte', 'nobre fugitivo', 'rei exilado'];
const NOMES_IRMAOS = ['Iria', 'Cael', 'Mara', 'Oren', 'Sena', 'Tomas', 'Lia', 'Daren'];
const ATRIBUTOS = ['fisico', 'precisao', 'resiliencia', 'raciocinio', 'percepcao', 'social'];
function maiorTalento(atributos) {
    return [...ATRIBUTOS].sort((a, b) => atributos[b] - atributos[a])[0];
}
function oficio(camp, talento) {
    if ((0, rng_1.nextFloat)(camp.rng) < .08)
        return (0, rng_1.pick)(camp.rng, OFICIOS_RAROS);
    const porTalento = {
        fisico: ['lavrador', 'soldado', 'ferreiro'], precisao: ['caçadora', 'artesã'],
        resiliencia: ['mineiro', 'criadora de animais'], raciocinio: ['escriba', 'mago itinerante'],
        percepcao: ['curandeira', 'batedor'], social: ['mercador itinerante', 'administradora'],
    };
    return (0, rng_1.pick)(camp.rng, porTalento[talento] ?? OFICIOS_COMUNS);
}
function estadoNpc(content, idade) {
    return { vivo: true, idade, tensao: 0, memoria: [],
        eixos: Object.fromEntries(content.cenario.eixosRelacao.map(e => [e.id, e.id === 'confianca' ? 8 : 0])) };
}
function npcDeParente(p) {
    const localBase = p.condicao === 'cativo' ? 'acampamento' : 'taverna';
    return {
        id: p.id, nome: p.nome, idade: Math.max(0, p.idadeNoNascimento), parentesco: p.parentesco,
        ocupacao: p.ocupacao, faccaoId: 'vila', localBase, rotina: {},
        vozNarrativa: p.parentesco === 'pai' || p.parentesco === 'mae'
            ? 'Fala com a intimidade e a memória de quem acompanhou sua infância.'
            : 'Fala como alguém que dividiu teto, medo e pequenas vitórias com você.',
        personalidade: p.prodigio ? 'Talentoso e consciente das expectativas que a família colocou sobre ele.' : 'Moldado pelos mesmos acontecimentos da família, mas com respostas próprias.',
        corpo: 'Carrega no rosto e nas mãos as marcas do ofício e dos anos vividos pela família.',
        relacoes: [],
    };
}
function nascimento(camp, familia) {
    const pai = familia.membros.find(m => m.parentesco === 'pai');
    const mae = familia.membros.find(m => m.parentesco === 'mae');
    return {
        id: 'nascimento', idade: 0, titulo: 'O dia em que você nasceu',
        descricao: `${pai.nome}, ${pai.ocupacao}, e ${mae.nome}, ${mae.ocupacao}, recebem você numa família de prestígio ${familia.prestigio >= 7 ? 'alto' : familia.prestigio >= 3 ? 'modesto' : 'quase nenhum'}.`,
        opcoes: [{ id: 'crescer', rotulo: 'Deixar os primeiros anos passarem', descricao: 'As circunstâncias da família formarão o primeiro acontecimento que você consegue lembrar.' }],
    };
}
function eventoAosSeis(camp, familia) {
    if (camp.genese?.marca === 'tragedia')
        return {
            id: 'perda', idade: 6, titulo: 'A casa ficou vazia',
            descricao: camp.genese.motivoTragedia ?? 'Uma tragédia levou seus pais.',
            opcoes: [
                { id: 'guardar_luto', rotulo: 'Guardar o luto em silêncio', descricao: 'Resiliência cresce, mas a confiança nos outros diminui.' },
                { id: 'buscar_responsavel', rotulo: 'Jurar encontrar o responsável', descricao: 'Percepção cresce e a perda vira uma dívida pessoal.' },
                { id: 'proteger_irmaos', rotulo: 'Cuidar de quem restou', descricao: 'Carisma e vínculo familiar crescem; você assume peso cedo.' },
            ],
        };
    const tipo = (0, rng_1.pick)(camp.rng, ['peste', 'cobradores', 'fome', 'talento']);
    if (tipo === 'peste')
        return { id: 'peste', idade: 6, titulo: 'A febre entrou em casa', descricao: 'Um dos seus pais adoeceu e os remédios custam mais do que a família possui.', opcoes: [
                { id: 'buscar_cura', rotulo: 'Procurar a curandeira', descricao: 'Consome patrimônio, com a melhor chance de salvar quem adoeceu.' },
                { id: 'cuidar', rotulo: 'Cuidar com as próprias mãos', descricao: 'Aprende resistência e cura; o risco continua real.' },
                { id: 'pedir_ajuda', rotulo: 'Pedir ajuda à comunidade', descricao: 'A reputação familiar decide quantas portas se abrem.' },
            ] };
    if (tipo === 'cobradores')
        return eventoCativeiro(6);
    if (tipo === 'fome')
        return { id: 'fome', idade: 6, titulo: 'O celeiro esvaziou', descricao: 'Uma colheita perdida põe a família entre a fome, o crime e a estrada.', opcoes: [
                { id: 'trabalhar', rotulo: 'Trabalhar junto dos adultos', descricao: 'Fortalece o corpo e preserva parte do patrimônio.' },
                { id: 'furtar', rotulo: 'Roubar comida no mercado', descricao: 'Pode alimentar a casa, mas cria uma dívida com a lei.' },
                { id: 'migrar', rotulo: 'Convencer a família a partir', descricao: 'A família perde o que construiu e evita a fome imediata.' },
            ] };
    return eventoTalento(6);
}
function eventoCativeiro(idade) {
    return { id: 'cativeiro', idade, titulo: 'Homens vieram cobrar em gente', descricao: 'A dívida virou uma tentativa de levar sua família como servos cativos.', opcoes: [
            { id: 'resistir', rotulo: 'Resistir ao lado da família', descricao: 'Arrisca ferimentos e morte, mas pode impedir o sequestro.' },
            { id: 'esconder', rotulo: 'Esconder os mais novos', descricao: 'Protege irmãos, mas um adulto pode ser levado.' },
            { id: 'negociar', rotulo: 'Entregar o patrimônio', descricao: 'Compra liberdade agora e deixa a família sem recursos.' },
        ] };
}
function eventoTalento(idade) {
    return { id: 'talento', idade, titulo: 'Algo despertou cedo', descricao: 'Um mestre percebe talento incomum em você e em alguém da família.', opcoes: [
            { id: 'treinar', rotulo: 'Aceitar o treinamento', descricao: 'Aumenta seu maior talento e o prestígio familiar.' },
            { id: 'dividir', rotulo: 'Dividir a oportunidade com seu irmão', descricao: 'Fortalece o vínculo e pode fazer dele um prodígio.' },
            { id: 'recusar', rotulo: 'Permanecer com a família', descricao: 'Preserva a união e deixa a oportunidade passar.' },
        ] };
}
function proximoEvento(camp, familia, idade) {
    if (idade === 6)
        return eventoAosSeis(camp, familia);
    if (idade === 10)
        return (0, rng_1.nextFloat)(camp.rng) < .45 ? eventoCativeiro(10) : eventoTalento(10);
    return { id: 'partida', idade: 14, titulo: 'A vida adulta se aproxima', descricao: 'O mundo oferece um caminho, enquanto sua família ainda cobra presença.', opcoes: [
            { id: 'aprendizado', rotulo: 'Partir para aprender um ofício', descricao: 'Ganha técnica e deixa a família conduzir a própria vida.' },
            { id: 'defender', rotulo: 'Ficar para defender a casa', descricao: 'Fortalece corpo e vínculos; inimigos passam a conhecer seu nome.' },
            { id: 'fugir', rotulo: 'Ir embora sem promessa de volta', descricao: 'Ganha liberdade, perde confiança e começa com recursos próprios.' },
        ] };
}
function iniciarFamilia(content, camp) {
    if (camp.familia)
        return;
    const g = camp.genese;
    const paiTalento = maiorTalento(g.paiAtributos);
    const maeTalento = maiorTalento(g.maeAtributos);
    const membros = [
        { id: 'familia_pai', nome: g.paiNome, parentesco: 'pai', idadeNoNascimento: (0, rng_1.nextInt)(camp.rng, 19, 41), ocupacao: oficio(camp, paiTalento), talento: paiTalento, prestigio: (0, rng_1.nextInt)(camp.rng, 0, 8), condicao: 'livre', prodigio: (0, rng_1.nextFloat)(camp.rng) < .08 },
        { id: 'familia_mae', nome: g.maeNome, parentesco: 'mae', idadeNoNascimento: (0, rng_1.nextInt)(camp.rng, 18, 39), ocupacao: oficio(camp, maeTalento), talento: maeTalento, prestigio: (0, rng_1.nextInt)(camp.rng, 0, 8), condicao: 'livre', prodigio: (0, rng_1.nextFloat)(camp.rng) < .08 },
    ];
    for (let i = 0; i < g.irmaos; i++) {
        const irma = (0, rng_1.nextFloat)(camp.rng) < .5;
        membros.push({ id: `familia_irmao_${i + 1}`, nome: (0, rng_1.pick)(camp.rng, NOMES_IRMAOS), parentesco: irma ? 'irma' : 'irmao',
            idadeNoNascimento: (0, rng_1.nextInt)(camp.rng, -4, 5), ocupacao: 'criança da família', talento: (0, rng_1.pick)(camp.rng, ATRIBUTOS),
            prestigio: 0, condicao: 'livre', prodigio: (0, rng_1.nextFloat)(camp.rng) < .12 });
    }
    const familia = { versao: 1, prologoConcluido: false, idadeJogador: 0,
        patrimonio: camp.personagem.dinheiro + (0, rng_1.nextInt)(camp.rng, 0, 40), prestigio: Math.round((membros[0].prestigio + membros[1].prestigio) / 2), membros, historia: [] };
    familia.eventoAtual = nascimento(camp, familia);
    camp.familia = familia;
    camp.personagem.idade = 0;
    camp.npcsProcedurais = membros.map(npcDeParente);
    for (const m of membros)
        camp.npcState[m.id] = estadoNpc(content, m.idadeNoNascimento);
}
function alterarAtributo(camp, atributo, delta = 1) {
    camp.personagem.atributos[atributo] += delta;
}
function membroVivo(f, papel) {
    return f.membros.find(m => m.condicao !== 'morto' && (!papel || m.parentesco === papel));
}
function matar(camp, p) {
    p.condicao = 'morto';
    if (camp.npcState[p.id])
        camp.npcState[p.id].vivo = false;
}
function capturar(camp, p) {
    p.condicao = 'cativo';
    const npc = camp.npcsProcedurais?.find(n => n.id === p.id);
    if (npc)
        npc.localBase = 'acampamento';
}
function resolverEtapaInfancia(content, camp, opcaoId) {
    const f = camp.familia;
    const evento = f?.eventoAtual;
    if (!f || !evento || f.prologoConcluido)
        return { ok: false };
    if (!evento.opcoes.some(o => o.id === opcaoId))
        return { ok: false };
    let texto = evento.opcoes.find(o => o.id === opcaoId).rotulo + '.';
    const alvo = membroVivo(f, (0, rng_1.nextFloat)(camp.rng) < .5 ? 'pai' : 'mae') ?? membroVivo(f);
    if (evento.id === 'perda') {
        for (const p of f.membros.filter(m => m.parentesco === 'pai' || m.parentesco === 'mae'))
            matar(camp, p);
        if (opcaoId === 'guardar_luto')
            alterarAtributo(camp, 'resiliencia', 2);
        if (opcaoId === 'buscar_responsavel') {
            alterarAtributo(camp, 'percepcao', 2);
            camp.flags['jurou_vingar_familia'] = true;
        }
        if (opcaoId === 'proteger_irmaos')
            alterarAtributo(camp, 'social', 2);
        texto += ' Seus pais morreram; a forma como você respondeu ficou em você.';
    }
    else if (evento.id === 'peste' && alvo) {
        const chance = opcaoId === 'buscar_cura' ? .88 : opcaoId === 'pedir_ajuda' ? .45 + f.prestigio * .04 : .55;
        if (opcaoId === 'buscar_cura')
            f.patrimonio = Math.max(0, f.patrimonio - 25);
        if (opcaoId === 'cuidar')
            alterarAtributo(camp, 'raciocinio');
        if ((0, rng_1.nextFloat)(camp.rng) > chance) {
            matar(camp, alvo);
            texto += ` ${alvo.nome} não resistiu à febre.`;
        }
        else
            texto += ` ${alvo.nome} sobreviveu.`;
    }
    else if (evento.id === 'cativeiro') {
        if (opcaoId === 'negociar' && f.patrimonio >= 20) {
            f.patrimonio = 0;
            texto += ' A casa foi esvaziada, mas ninguém foi levado.';
        }
        else if (opcaoId === 'resistir') {
            alterarAtributo(camp, 'fisico');
            if ((0, rng_1.nextFloat)(camp.rng) < .45 && alvo) {
                matar(camp, alvo);
                texto += ` A resistência custou a vida de ${alvo.nome}.`;
            }
            else {
                camp.personagem.cicatrizes.push('ferida recebida ao resistir aos captores');
                texto += ' Os captores recuaram, e você guardou a cicatriz.';
            }
        }
        else if (alvo) {
            capturar(camp, alvo);
            texto += ` ${alvo.nome} foi levado para o acampamento dos captores.`;
        }
    }
    else if (evento.id === 'fome') {
        if (opcaoId === 'trabalhar') {
            alterarAtributo(camp, 'resiliencia');
            f.patrimonio += 8;
        }
        if (opcaoId === 'furtar') {
            camp.flags['procurado.por_furto'] = true;
            f.patrimonio += 15;
            alterarAtributo(camp, 'precisao');
        }
        if (opcaoId === 'migrar') {
            f.patrimonio = Math.floor(f.patrimonio / 2);
            camp.flags['familia_migrou'] = true;
        }
    }
    else if (evento.id === 'talento') {
        if (opcaoId === 'treinar') {
            alterarAtributo(camp, maiorTalento(camp.personagem.atributos), 2);
            f.prestigio += 2;
        }
        if (opcaoId === 'dividir') {
            const irmao = f.membros.find(m => m.parentesco === 'irma' || m.parentesco === 'irmao');
            if (irmao) {
                irmao.prodigio = true;
                irmao.prestigio += 3;
                camp.npcState[irmao.id].eixos.confianca = 15;
                texto += ` ${irmao.nome} floresceu como prodígio.`;
            }
            else
                alterarAtributo(camp, 'social');
        }
        if (opcaoId === 'recusar')
            for (const m of f.membros)
                camp.npcState[m.id].eixos.confianca = 12;
    }
    else if (evento.id === 'partida') {
        if (opcaoId === 'aprendizado') {
            camp.personagem.pericias.oficio = 1;
            alterarAtributo(camp, 'raciocinio');
        }
        if (opcaoId === 'defender') {
            alterarAtributo(camp, 'fisico');
            alterarAtributo(camp, 'resiliencia');
            camp.flags['defendeu_familia'] = true;
        }
        if (opcaoId === 'fugir') {
            f.patrimonio = Math.max(0, f.patrimonio - 10);
            camp.personagem.dinheiro += 20;
            for (const m of f.membros)
                camp.npcState[m.id].eixos.confianca -= 8;
        }
    }
    f.historia.push({ idade: evento.idade, texto });
    const proximaIdade = evento.idade === 0 ? 6 : evento.idade === 6 ? 10 : evento.idade === 10 ? 14 : 18;
    f.idadeJogador = proximaIdade;
    camp.personagem.idade = proximaIdade;
    for (const m of f.membros) {
        const idade = m.idadeNoNascimento + proximaIdade;
        camp.npcState[m.id].idade = idade;
        const npc = camp.npcsProcedurais?.find(n => n.id === m.id);
        if (npc && idade >= 18 && (m.parentesco === 'irma' || m.parentesco === 'irmao'))
            npc.ocupacao = m.prodigio ? 'jovem prodígio' : 'trabalhador da família';
    }
    if (proximaIdade >= 18) {
        f.prologoConcluido = true;
        f.eventoAtual = undefined;
        camp.personagem.dinheiro += Math.floor(f.patrimonio / 4);
        return { ok: true, texto, concluida: true };
    }
    f.eventoAtual = proximoEvento(camp, f, proximaIdade);
    return { ok: true, texto };
}
function resumoFamilia(camp) {
    return (camp.familia?.membros ?? []).map(m => `${m.nome}, ${m.parentesco}: ${m.ocupacao}; ${m.condicao}${m.prodigio ? '; prodígio' : ''}.`);
}
function registrarMorteFamiliar(camp, npcId) {
    const membro = camp.familia?.membros.find(m => m.id === npcId);
    if (!membro || membro.condicao === 'morto')
        return;
    membro.condicao = 'morto';
    // A primeira morte no próprio sangue é limiar, e só a primeira. O que muda
    // um caçador não é a contagem de perdas — é descobrir que existem. Concedido
    // uma vez, pela chave, mesmo que a família inteira caia depois.
    (0, progresso_1.concederDespertar)(camp, 'a_perda', `${membro.nome} não voltou, e você continuou`);
}
function sincronizarIdadeFamilia(camp) {
    if (camp.familia)
        camp.familia.idadeJogador = camp.personagem.idade ?? camp.familia.idadeJogador;
}
function resgatarParente(camp, parenteId, modo) {
    const f = camp.familia;
    const p = f?.membros.find(m => m.id === parenteId && m.condicao === 'cativo');
    if (!f || !p)
        return { ok: false, texto: 'Esse familiar não está em cativeiro.' };
    if (camp.localAtual !== 'acampamento')
        return { ok: false, texto: 'O rastro dos captores leva ao acampamento.' };
    if (modo === 'resgate') {
        if (camp.personagem.dinheiro < 50)
            return { ok: false, texto: 'O resgate custa 50 moedas.' };
        camp.personagem.dinheiro -= 50;
    }
    else {
        const chance = Math.min(.85, .35 + (camp.personagem.atributos.precisao - 10) * .04 + (camp.personagem.pericias.furtividade ?? 0) * .08);
        if ((0, rng_1.nextFloat)(camp.rng) > chance) {
            camp.personagem.recursos.vida = Math.max(1, camp.personagem.recursos.vida - 8);
            camp.personagem.condicoes.push('ferido_em_resgate');
            f.historia.push({ idade: f.idadeJogador, texto: `Você tentou tirar ${p.nome} do cativeiro e voltou ferido.` });
            return { ok: false, texto: `${p.nome} continua cativo; sua tentativa alertou os guardas.` };
        }
    }
    p.condicao = 'livre';
    const civil = camp.vivo?.pessoas[p.id];
    if (civil) {
        civil.objetivo = 'rotina';
        civil.local = 'taverna';
        civil.casa = 'taverna';
        civil.deslocado = false;
        civil.cativoAte = undefined;
    }
    const npc = camp.npcsProcedurais?.find(n => n.id === p.id);
    if (npc)
        npc.localBase = 'taverna';
    camp.npcState[p.id].eixos.confianca = Math.min(20, (camp.npcState[p.id].eixos.confianca ?? 0) + 10);
    f.historia.push({ idade: f.idadeJogador, texto: `Você libertou ${p.nome} do cativeiro.` });
    return { ok: true, texto: `${p.nome} está livre e voltou para a família.` };
}
