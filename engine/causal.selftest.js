"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vaelhorn_1 = require("../content/vaelhorn");
const campaign_1 = require("./campaign");
const character_1 = require("./character");
const formacao_1 = require("./formacao");
const migracao_1 = require("./migracao");
const progressaoNpc_1 = require("./progressaoNpc");
const missoesVivas_1 = require("./missoesVivas");
const historiaViva_1 = require("./historiaViva");
const kimetsu_1 = require("./kimetsu");
const nemesis_1 = require("./nemesis");
const combat_1 = require("./combat");
const planejadorSim_1 = require("./planejadorSim");
const ok = (v, texto) => { if (!v)
    throw new Error(texto); console.log(`✓ ${texto}`); };
const nova = () => (0, campaign_1.criarCampanha)(vaelhorn_1.conteudoVaelhorn, { nome: 'Teste', atributos: (0, character_1.atributosBase)(), classeId: 'guardiao', origemId: 'divida', seedString: 'causal', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
{
    const c = nova();
    const base = vaelhorn_1.conteudoVaelhorn.locais[0];
    const content = { ...vaelhorn_1.conteudoVaelhorn, locais: [
            { ...base, id: 'a', rotas: [{ destino: 'b', periodos: 1, perigo: 1 }, { destino: 'c', periodos: 12, perigo: 1 }] },
            { ...base, id: 'b', rotas: [{ destino: 'c', periodos: 1, perigo: 1 }] },
            { ...base, id: 'c', rotas: [] },
        ] };
    c.localAtual = 'a';
    c.vivo.missoes = [];
    const f = (0, historiaViva_1.registrarFato)(c, { tipo: 'teste', local: 'c', texto: 'Pedido distante', atores: [], publico: true });
    const q = (0, missoesVivas_1.oferecerMissao)(c, 'reconstruir', f);
    q.conhecida = true;
    const rng = JSON.stringify(c.rng);
    ok((0, planejadorSim_1.planejarMissao)(content, c)?.tipo === 'agir', 'Planejador aceita pedido alcançável');
    q.estado = 'aceita';
    const viagem = (0, planejadorSim_1.planejarMissao)(content, c);
    ok(viagem?.tipo === 'viajar' && viagem.destino === 'b', 'Planejador usa rota de menor tempo, não atalho caro');
    c.localAtual = 'c';
    c.personagem.dinheiro = 40;
    const acao = (0, planejadorSim_1.planejarMissao)(content, c);
    ok(acao?.tipo === 'agir' && acao.acao.tipo === 'missao' && acao.acao.escolha === 'ajudar', 'Chegada prioriza executar o compromisso');
    q.prazo = c.calendario.dia - 1;
    ok(!(0, planejadorSim_1.planejarMissao)(content, c), 'Planejador ignora pedido expirado');
    q.prazo = c.calendario.dia + 10;
    q.local = 'inexistente';
    ok(!(0, planejadorSim_1.planejarMissao)(content, c), 'Planejador rejeita destino desconectado');
    ok(JSON.stringify(c.rng) === rng, 'Planejamento não consome sorte da campanha');
}
{
    const c = nova();
    const base = vaelhorn_1.conteudoVaelhorn.locais[0];
    const content = { ...vaelhorn_1.conteudoVaelhorn, locais: [
            { ...base, id: 'a', rotas: [{ destino: 'b', periodos: 1, perigo: 10 }, { destino: 'c', periodos: 4, perigo: 0 }] },
            { ...base, id: 'b', rotas: [{ destino: 'c', periodos: 1, perigo: 10 }] },
            { ...base, id: 'c', rotas: [] },
        ] };
    c.localAtual = 'a';
    c.personagem.recursos.vida = 10;
    c.personagem.recursosMax.vida = 100;
    const f = (0, historiaViva_1.registrarFato)(c, { tipo: 'teste', local: 'c', texto: 'Rota sob ameaça', atores: [], publico: true });
    const q = (0, missoesVivas_1.oferecerMissao)(c, 'reconstruir', f);
    q.conhecida = true;
    q.estado = 'aceita';
    q.prazo = c.calendario.dia + 10;
    const plano = (0, planejadorSim_1.planejarMissao)(content, c);
    ok(plano?.tipo === 'viajar' && plano.destino === 'c', 'Personagem ferido prefere rota segura à mais curta');
}
{
    const c = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, nova());
    (0, combat_1.iniciarCombate)(vaelhorn_1.conteudoVaelhorn, c, ['sentinela_de_basalto']);
    const salvo = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(c)));
    ok(JSON.stringify(salvo) === JSON.stringify(c), 'Save em combate preserva campanha completa, RNG e atores');
}
{
    const c = nova(), n = c.npcsProcedurais.find(n => c.npcState[n.id]?.vivo);
    const p = c.vivo.pessoas[n.id], din = c.npcState[n.id];
    din.idade = 18;
    din.vida = 32;
    Object.assign(p, { local: 'taverna', deslocado: true, objetivo: 'rotina', viagem: undefined, saude: 80, fome: 0, moedas: 100, habilidade: 10, formacao: { caminho: 'guarda', sessoes: 0, concluida: false } });
    const mentor = { ...n, id: 'mentor_teste', especie: 'humano', idade: 30, localBase: 'taverna', rotina: {}, combatente: { vida: 32, defesa: 12, acerto: 12, dano: { base: 5, dispersao: .2, tipo: 'corte' }, tecnicas: [] } };
    const content = { ...vaelhorn_1.conteudoVaelhorn, npcs: [mentor] };
    c.npcState[mentor.id] = { vivo: true, idade: 30, vida: 0, eixos: {}, memoria: [], tensao: 0 };
    ok(!(0, formacao_1.processarFormacao)(content, c, n), 'Mentor incapacitado não ensina');
    c.npcState[mentor.id].vida = 32;
    din.idade = 17;
    ok(!(0, formacao_1.processarFormacao)(content, c, n), 'Menor não recebe ficha');
    din.idade = 18;
    din.vida = 0;
    ok(!(0, formacao_1.processarFormacao)(content, c, n), 'Aprendiz incapacitado não treina');
    din.vida = 32;
    const rng = JSON.stringify(c.rng);
    for (let i = 0; i < 20; i++)
        ok((0, formacao_1.processarFormacao)(content, c, n), `Sessão de formação ${i + 1}`);
    ok(!!n.combatente && p.formacao.concluida, 'Formação entrega ficha após prática');
    ok(Math.abs(din.vida / (0, progressaoNpc_1.fichaCombatente)(c, n).vida - .8) < .03, 'Formação preserva saúde na ficha derivada');
    ok(JSON.stringify(c.rng) === rng, 'Formação não desloca RNG');
    const salvo = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(c)));
    ok(JSON.stringify(salvo.vivo.pessoas[n.id]) === JSON.stringify(p), 'Save preserva estado civil completo');
    ok(JSON.stringify(salvo.npcState[n.id]) === JSON.stringify(din), 'Save preserva estado dinâmico completo');
    const novamente = (0, migracao_1.normalizarCampanha)(vaelhorn_1.conteudoVaelhorn, JSON.parse(JSON.stringify(salvo)));
    ok(JSON.stringify(novamente) === JSON.stringify(salvo), 'Normalização completa é idempotente');
}
{
    const c = nova(), local = Object.keys(c.vivo.cidades)[0];
    c.vivo.cidades[local].fomeDias = 4;
    ok((0, missoesVivas_1.janelaMissao)(c, 'abastecer', local).dias < (0, missoesVivas_1.janelaMissao)(c, 'reconstruir', local).dias, 'Urgência distingue prazos');
    ok((0, missoesVivas_1.periodosDeViagem)(vaelhorn_1.conteudoVaelhorn, local, 'inexistente') === Infinity, 'Rota impossível não inventa viagem');
    const f = (0, historiaViva_1.registrarFato)(c, { tipo: 'teste', local, texto: 'Teste', atores: [], publico: true });
    const q = (0, missoesVivas_1.oferecerMissao)(c, 'reconstruir', f);
    q.estado = 'aceita';
    (0, missoesVivas_1.encerrarMissao)(c, q, 'falhada', 'Teste');
    const outra = (0, missoesVivas_1.oferecerMissao)(c, 'reconstruir', f);
    (0, missoesVivas_1.encerrarMissao)(c, outra, 'falhada', 'Teste');
    ok(c.vivo.contadores.compromissosFalhados === 1 && c.vivo.contadores.oportunidadesExpiradas === 1, 'Métricas separam compromisso e oportunidade');
    const paga = (0, missoesVivas_1.oferecerMissao)(c, 'reconstruir', f);
    paga.estado = 'aceita';
    (0, missoesVivas_1.encerrarMissao)(c, paga, 'concluida', 'Teste');
    const dinheiro = c.personagem.dinheiro;
    (0, missoesVivas_1.encerrarMissao)(c, paga, 'concluida', 'Teste');
    ok(dinheiro === c.personagem.dinheiro, 'Recompensa não duplica');
}
{
    const c = nova(), criatura = vaelhorn_1.conteudoVaelhorn.criaturas.find(x => x.oni && !x.perfilOni?.identidade);
    const r = (0, kimetsu_1.obterRival)(c, criatura, []);
    (0, nemesis_1.processarNemesis)(vaelhorn_1.conteudoVaelhorn, c);
    r.rancor = 5;
    r.reencontros = 2;
    r.evolucao.proximaAcao = c.calendario.dia;
    (0, nemesis_1.processarNemesis)(vaelhorn_1.conteudoVaelhorn, c);
    ok(r.evolucao.plano !== 'perseguir', 'Sem pista não persegue');
    r.comportamento.pista = c.localAtual;
    r.comportamento.pistaAte = c.calendario.dia - 1;
    r.evolucao.proximaAcao = c.calendario.dia;
    (0, nemesis_1.processarNemesis)(vaelhorn_1.conteudoVaelhorn, c);
    ok(!r.comportamento.pista, 'Pista expirada é descartada');
    r.comportamento.pista = c.localAtual;
    r.comportamento.pistaAte = c.calendario.dia + 14;
    r.comportamento.recuperarAte = c.calendario.dia + 7;
    ok(!(0, nemesis_1.emboscadaNemesis)(vaelhorn_1.conteudoVaelhorn, c), 'Recuperação impede emboscada');
    r.vivo = false;
    const antes = JSON.stringify(r);
    (0, nemesis_1.processarNemesis)(vaelhorn_1.conteudoVaelhorn, c);
    ok(JSON.stringify(r) === antes, 'Morto não evolui');
}
