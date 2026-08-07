// ARCANUM · Autoteste rápido da engine. Uso: npm run test:engine
import { createRng } from './rng';
import { probabilidade, resolverTeste } from './resolution';
import { conteudoVaelhorn } from '../content/vaelhorn';
import { encontrosPorTipo } from '../content/vaelhorn/bestiary';
import { criarCampanha } from './campaign';
import {
  validarOpcoesIA,
  interpretarResposta,
  serveParaNarrar,
  montarPacote,
  perfilDoModelo,
  detectarRecusa,
} from './llm';
import { emBlocos } from './prosa';
import {
  registrarLembranca,
  memoriaParaNarrador,
  registrarMarco,
  marcosRecentes,
  estadoDoNpc,
} from './memoria';
import { calcularRitmo } from './ritmo';
import { avaliarOpcao, chanceDe } from './risco';
import { montarGrade } from './grade';
import { avancarMundo, multiplicadorDePreco, comoEstaOVale } from './mundo';
import { recolherDespojos, despojosDe } from './despojos';
import { ecosRecentes } from './convivio';
import { resolverIntencao } from './turn';
import { montarCena } from './narration';
import * as narracaoMod from './narration';
import { atributosBase, derivados } from './character';
import {
  comprar,
  equipar,
  usarConsumivel,
  vender,
  bonusDefesaEquip,
  armaEquipada,
} from './items';
import { iniciarCombate, jogadorAtaca, fecharCombate } from './combat';
import { mestresQueEnsinamAqui, aprenderArte, conjurarLivre } from './magic';
import { verificarQuests } from './quests';

let falhas = 0;
function ok(cond: boolean, msg: string) {
  if (!cond) {
    console.error('✗', msg);
    falhas++;
  } else {
    console.log('✓', msg);
  }
}

// Determinismo: mesma semente e mesmo cursor => mesma sequência.
{
  const a = createRng(12345);
  const b = createRng(12345);
  const ra = resolverTeste(a, { atributo: 14, dificuldade: 14 });
  const rb = resolverTeste(b, { atributo: 14, dificuldade: 14 });
  ok(ra.r === rb.r && ra.grau === rb.grau, 'RNG é determinístico com a mesma semente');
}

// Probabilidade: C=D => 50%.
ok(Math.abs(probabilidade(14, 14) - 0.5) < 1e-9, 'p(C=D) = 50%');
ok(probabilidade(22, 14) > 0.85, 'C bem acima de D => alta chance');
ok(probabilidade(6, 14) < 0.15, 'C bem abaixo de D => baixa chance');

// Criação de campanha.
const camp = criarCampanha(conteudoVaelhorn, {
  nome: 'Teste',
  atributos: atributosBase(),
  classeId: 'arcanista',
  origemId: 'divida',
  seedString: 'teste-1',
});
ok(camp.personagem.recursos.vida > 0, 'Personagem nasce com vida');
ok(camp.personagem.recursos.mana > 0, 'Arcanista nasce com mana');
ok(camp.localAtual === 'taverna', 'Começa na taverna');
ok(Object.keys(camp.npcState).length === conteudoVaelhorn.npcs.length, 'Estado de todos os NPCs inicializado');

// Montar cena não quebra.
const cena = montarCena(conteudoVaelhorn, camp);
ok(cena.narracao.length > 0, 'Cena inicial monta material para o narrador');
ok(cena.opcoes.length > 0, 'Cena inicial produz opções');

// Resolver um verbo simples avança o tempo.
const diaAntes = camp.calendario.dia;
const idxAntes = camp.calendario.periodoIndex;
const r = resolverIntencao(conteudoVaelhorn, camp, { tipo: 'verbo', verboId: 'esperar' });
ok(camp.calendario.dia > diaAntes || camp.calendario.periodoIndex !== idxAntes, 'Esperar avança o tempo');
ok(r.fato.length > 0, 'Resolução produz um fato');

// Trava de build: nenhum conteúdo pode conter notação de dado (GDD §2.4).
{
  const json = JSON.stringify(conteudoVaelhorn);
  const temDado = /\bd\d+\b|\b\d+d\d+\b|CD\s?\d+/.test(json);
  ok(!temDado, 'Nenhuma notação de dado no conteúdo (trava §2.4)');
}

// Aviso: todos os NPCs são adultos (GDD §25).
{
  const menores = conteudoVaelhorn.npcs.filter((n) => n.idade < 18);
  ok(menores.length === 0, 'Todos os personagens são adultos (§25)');
}

// Validador das opções vindas da IA (§19).
{
  const validas = validarOpcoesIA([
    { rotulo: 'Encarar Vess sem desviar o olhar', dica: 'ele mede você', custoPeriodos: 0, teste: { atributo: 'social', pericia: 'intimidar', dificuldade: 15 } },
    { rotulo: 'Rolar 1d20 contra CD 15', custoPeriodos: 0 }, // deve cair: notação de dado
    { rotulo: 'x'.repeat(120), custoPeriodos: 0 }, // deve cair: longa demais
    { rotulo: 'Sair pela porta dos fundos', custoPeriodos: 9, teste: { atributo: 'inventado', dificuldade: 99 } },
  ]);
  ok(validas.length === 2, 'Validador rejeita opções com dado e rótulo longo demais');
  ok(validas[0].teste?.dificuldade === 15, 'Opção válida preserva a dificuldade');
  ok(validas[1].custoPeriodos === 3, 'Custo fora da faixa é limitado a 3');
  ok(validas[1].teste === undefined, 'Atributo inválido descarta o teste');
}

// Opções canônicas não repetem gancho já investigado.
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Curiosa',
    atributos: atributosBase(),
    classeId: 'batedor',
    origemId: 'sem_nome',
    seedString: 'ganchos-1',
  });
  const antes = montarCena(conteudoVaelhorn, c).opcoes.filter((o) => o.id.startsWith('gancho_')).length;
  c.flags['investigado.taverna.0'] = true;
  const depois = montarCena(conteudoVaelhorn, c).opcoes.filter((o) => o.id.startsWith('gancho_')).length;
  ok(depois === antes - 1, 'Gancho investigado some das opções de cena');
}

// Sistema de itens (GDD §13.6, §34).
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Mercador',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'foragido',
    seedString: 'itens-1',
  });
  ok(!!armaEquipada(conteudoVaelhorn, c.personagem), 'Guardião nasce com arma equipada');
  ok(bonusDefesaEquip(conteudoVaelhorn, c.personagem) > 0, 'Armadura+escudo dão bônus de defesa');

  // Compra encolhe a bolsa e enche a mochila.
  const antesDinheiro = c.personagem.dinheiro;
  const compra = comprar(conteudoVaelhorn, c, 'pocao_cura_menor');
  ok(compra.ok && c.personagem.dinheiro < antesDinheiro, 'Comprar debita moedas');
  ok((c.personagem.inventario['pocao_cura_menor'] ?? 0) >= 1, 'Comprar adiciona o item');

  // Usar poção cura e consome.
  c.personagem.recursos.vida = 5;
  usarConsumivel(conteudoVaelhorn, c, 'pocao_cura_menor');
  ok(c.personagem.recursos.vida > 5, 'Usar poção recupera vida');

  // Equipar troca a defesa derivada.
  c.personagem.dinheiro = 500; // bolsa cheia para o teste de compra cara
  comprar(conteudoVaelhorn, c, 'cota_de_malha');
  const defAntes = derivados(c.personagem, bonusDefesaEquip(conteudoVaelhorn, c.personagem)).defesa;
  equipar(conteudoVaelhorn, c, 'cota_de_malha');
  const defDepois = derivados(c.personagem, bonusDefesaEquip(conteudoVaelhorn, c.personagem)).defesa;
  ok(defDepois > defAntes, 'Equipar armadura melhor aumenta a defesa');

  // Vender devolve moeda.
  const d2 = c.personagem.dinheiro;
  vender(conteudoVaelhorn, c, 'cota_de_malha');
  ok(c.personagem.dinheiro > d2, 'Vender devolve moedas');

  // Item concede verbo (gazua → arrombar existe no catálogo).
  const gazua = conteudoVaelhorn.itens.find((i) => i.id === 'gazua');
  ok(gazua?.concedeVerbo === 'arrombar', 'Gazua concede o verbo arrombar (§13.6)');
}

// Combate (GDD §16, §17).
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Bruto',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'sem_nome',
    seedString: 'combate-1',
  });
  const s = iniciarCombate(conteudoVaelhorn, c, ['rato_gigante']);
  ok(s.atores.length === 2, 'Combate inicia com jogador e inimigo');
  ok(s.ordem.length === 2, 'Ordem de iniciativa montada');

  // Luta até acabar (guarda contra laço infinito).
  let guarda = 0;
  while (!c.combate!.terminado && guarda < 200) {
    guarda++;
    const alvo = c.combate!.atores.find((a) => !a.ehJogador && a.vida > 0);
    if (!alvo) break;
    jogadorAtaca(conteudoVaelhorn, c, alvo.id);
  }
  ok(c.combate!.terminado, 'Combate termina');
  ok(!!c.combate!.resultado, `Combate tem resultado (${c.combate!.resultado})`);
  ok(c.combate!.log.length > 1, 'Combate produz log narrável');

  // Chefe tem fase 2 declarada.
  const vess = conteudoVaelhorn.criaturas.find((x) => x.id === 'vess_fiador');
  ok(!!vess?.chefe && !!vess.fase2, 'Chefe Vess tem fase 2 (§17)');

  fecharCombate(c);
  ok(c.combate === null, 'Combate pode ser fechado');
}

// Magia: aprender e conjurar (GDD §13.1, §13.3).
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Aprendiz',
    atributos: atributosBase(),
    classeId: 'arcanista',
    origemId: 'divida',
    seedString: 'magia-1',
  });
  // Sarn ensina na taverna, onde a campanha começa.
  const disp = mestresQueEnsinamAqui(conteudoVaelhorn, c);
  ok(disp.length > 0, 'Há mestre ensinando no local inicial');
  const arte = disp[0].artes[0];
  const ap = aprenderArte(conteudoVaelhorn, c, arte.id);
  ok(ap.ok && c.personagem.artesConhecidas.includes(arte.id), `Aprendeu ${arte.nome}`);

  const manaAntes = c.personagem.recursos.mana;
  const conj = conjurarLivre(conteudoVaelhorn, c, arte.id);
  ok(conj.ok, 'Conjurar fora de combate funciona');
  ok(c.personagem.recursos.mana < manaAntes, 'Conjurar consome recurso');
}

// Missões (GDD quests).
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Andarilha',
    atributos: atributosBase(),
    classeId: 'batedor',
    origemId: 'foragido',
    seedString: 'quest-1',
  });
  ok(Object.keys(c.questEstado).length === conteudoVaelhorn.quests.length, 'Estado de todas as missões inicializado');
  // Cumpre o objetivo do edital via flag e confere a recompensa.
  const dinAntes = c.personagem.dinheiro;
  c.flags['investigado.taverna.0'] = true;
  const concl = verificarQuests(conteudoVaelhorn, c);
  ok(concl.includes('O edital novo'), 'Missão conclui quando o objetivo é cumprido');
  ok(c.personagem.dinheiro > dinAntes, 'Missão paga a recompensa');
}

// Integridade do conteúdo: nenhuma referência pode apontar para o vazio.
{
  const C = conteudoVaelhorn;
  const idsLocais = new Set(C.locais.map((l) => l.id));
  const idsItens = new Set(C.itens.map((i) => i.id));
  const idsNpcs = new Set(C.npcs.map((n) => n.id));
  const idsArtes = new Set(C.artes.map((a) => a.id));
  const idsMestres = new Set(C.mestres.map((m) => m.id));
  const idsCriaturas = new Set(C.criaturas.map((c) => c.id));
  const idsFaccoes = new Set(C.faccoes.map((f) => f.id));
  const idsVerbos = new Set(C.verbos.map((v) => v.id));

  const quebras: string[] = [];
  const exige = (cond: boolean, msg: string) => { if (!cond) quebras.push(msg); };

  for (const l of C.locais) {
    for (const r of l.rotas) exige(idsLocais.has(r.destino), `rota ${l.id} → ${r.destino}`);
  }
  for (const n of C.npcs) {
    exige(idsLocais.has(n.localBase), `npc ${n.id} mora em ${n.localBase}`);
    exige(idsFaccoes.has(n.faccaoId), `npc ${n.id} na facção ${n.faccaoId}`);
    exige(n.idade >= 18, `npc ${n.id} tem idade ${n.idade}`);
    for (const [per, loc] of Object.entries(n.rotina)) {
      exige(idsLocais.has(loc as string), `rotina ${n.id}.${per} → ${loc}`);
    }
    if (n.ensinaMestre) exige(idsMestres.has(n.ensinaMestre), `npc ${n.id} ensina ${n.ensinaMestre}`);
  }
  for (const m of C.mestres) {
    exige(idsLocais.has(m.localBase), `mestre ${m.id} em ${m.localBase}`);
    for (const a of m.ensina) exige(idsArtes.has(a), `mestre ${m.id} ensina arte ${a}`);
  }
  for (const i of C.itens) {
    for (const lj of i.lojas ?? []) exige(idsLocais.has(lj), `item ${i.id} vendido em ${lj}`);
    if (i.concedeVerbo) exige(idsVerbos.has(i.concedeVerbo), `item ${i.id} concede ${i.concedeVerbo}`);
  }
  for (const c of C.criaturas) {
    for (const l of c.loot ?? []) exige(idsItens.has(l.item), `criatura ${c.id} solta ${l.item}`);
  }
  for (const [tipo, lista] of Object.entries(encontrosPorTipo)) {
    for (const cid of lista) exige(idsCriaturas.has(cid), `encontro ${tipo} → ${cid}`);
  }
  for (const q of C.quests) {
    if (q.dador) exige(idsNpcs.has(q.dador), `missão ${q.id} dada por ${q.dador}`);
    if (q.recompensa.item) exige(idsItens.has(q.recompensa.item), `missão ${q.id} paga ${q.recompensa.item}`);
    for (const r of q.recompensa.reputacao ?? []) exige(idsFaccoes.has(r.faccaoId), `missão ${q.id} → facção ${r.faccaoId}`);
  }
  for (const r of C.reliquias) {
    if (r.localAtual) exige(idsLocais.has(r.localAtual), `relíquia ${r.id} em ${r.localAtual}`);
    if (r.donoAtual && r.donoAtual !== 'jogador') exige(idsNpcs.has(r.donoAtual), `relíquia ${r.id} de ${r.donoAtual}`);
  }
  for (const t of C.trabalhos) {
    for (const r of t.reputacao ?? []) exige(idsFaccoes.has(r.faccaoId), `trabalho ${t.id} → facção ${r.faccaoId}`);
  }
  // Todo tipo de local sorteável precisa de uma tabela de encontros.
  for (const l of C.locais) {
    exige(!!encontrosPorTipo[l.tipo], `local ${l.id} (tipo ${l.tipo}) sem tabela de encontros`);
  }
  // Ids duplicados dentro de uma mesma lista quebram buscas por id.
  const semDuplicata = (nome: string, ids: string[]) => {
    const vistos = new Set<string>();
    for (const id of ids) {
      if (vistos.has(id)) quebras.push(`${nome}: id repetido ${id}`);
      vistos.add(id);
    }
  };
  semDuplicata('locais', C.locais.map((x) => x.id));
  semDuplicata('npcs', C.npcs.map((x) => x.id));
  semDuplicata('itens', C.itens.map((x) => x.id));
  semDuplicata('criaturas', C.criaturas.map((x) => x.id));
  semDuplicata('artes', C.artes.map((x) => x.id));
  semDuplicata('verbos', C.verbos.map((x) => x.id));
  semDuplicata('quests', C.quests.map((x) => x.id));
  semDuplicata('mestres', C.mestres.map((x) => x.id));
  semDuplicata('trabalhos', C.trabalhos.map((x) => x.id));
  semDuplicata('reliquias', C.reliquias.map((x) => x.id));
  semDuplicata('faccoes', C.faccoes.map((x) => x.id));

  if (quebras.length) console.log('  referências quebradas:', quebras.slice(0, 12).join(' · '));
  ok(quebras.length === 0, `Integridade do conteúdo (${quebras.length} referência(s) quebrada(s))`);

  // A LEVA: o vale é das mulheres. Ninguém do elenco pode ter ofício no
  // masculino, e todo mundo precisa de corpo — o narrador usa os dois.
  const MASCULINO = /\b(taverneiro|ferreiro|coveiro|moleiro|pescador|carreteiro|escriba errante|mercador|padre|sargento|senhor|capataz do|vigia noturno|armeiro|eremita solitário)\b/;
  const comOficioMasculino = C.npcs.filter((n) => MASCULINO.test(n.ocupacao));
  ok(comOficioMasculino.length === 0, `Nenhum ofício masculino no elenco (${comOficioMasculino.map((n) => n.ocupacao).join(', ')})`);
  const semCorpo = C.npcs.filter((n) => !n.corpo || n.corpo.length < 40);
  ok(semCorpo.length === 0, `Todo mundo tem corpo descrito (${semCorpo.map((n) => n.id).join(', ')})`);
  ok((C.cenario.premissa ?? []).length >= 4, 'O cenário carrega a premissa do mundo');

  // Volume: o cenário precisa continuar grande.
  ok(C.locais.length >= 16, `Mapa com ${C.locais.length} locais`);
  ok(C.npcs.length >= 28, `Elenco com ${C.npcs.length} NPCs`);
  ok(C.itens.length >= 110, `Catálogo com ${C.itens.length} itens`);
  ok(C.criaturas.length >= 30, `Bestiário com ${C.criaturas.length} criaturas`);
  ok(C.artes.length >= 55, `Livro com ${C.artes.length} artes`);
  ok(C.quests.length >= 14, `${C.quests.length} missões`);
}

// Resposta da IA: JSON cortado nunca pode virar texto na tela (bug do jogador).
{
  const inteiro = JSON.stringify({
    narracao: 'A moeda bate no tampo gasto.\n\n— Guarde seu ouro, freguesa.',
    opcoes: [{ rotulo: 'Insistir com Elza', dica: 'pode selar a antipatia', custoPeriodos: 1 }],
    achado: 'moeda_antiga',
  });
  const a = interpretarResposta(inteiro, conteudoVaelhorn);
  ok(!!a.texto && !a.texto.includes('"narracao"'), 'JSON inteiro vira prosa limpa');
  ok(a.opcoes?.length === 1, 'JSON inteiro entrega as opções');
  ok(a.achado === 'moeda_antiga', 'Achado válido é aceito');

  // Exatamente o caso do print: corte no meio do array de opções.
  const cortado =
    '{"narracao":"A moeda de prata bate no tampo gasto com um som surdo. ' +
    '\\"Peço desculpas, Elza.\\" A palavra fica pendurada no ar gorduroso.",' +
    '"opcoes":[{"rotulo":"Insistir com Elza","dica":"pode ganhar confiança","custoPeriodos":1},' +
    '{"rotulo":"C';
  const b = interpretarResposta(cortado, conteudoVaelhorn);
  ok(!!b.texto, 'JSON truncado ainda entrega narração');
  ok(!b.texto!.includes('"narracao"') && !b.texto!.includes('rotulo'), 'Narração resgatada sem resíduo de JSON');
  ok(b.texto!.includes('"Peço desculpas, Elza."'), 'Escapes viram aspas de verdade');
  ok(b.opcoes?.length === 1, 'Opção completa aproveitada; a cortada, descartada');

  // Lixo puro: melhor falhar e deixar o fallback local assumir.
  const c = interpretarResposta('{"opcoes":[{"rotulo":"a', conteudoVaelhorn);
  ok(!c.texto && !!c.erro, 'Resposta sem narração vira erro, não texto cru');

  // Prosa sem JSON continua servindo.
  const d = interpretarResposta('A neblina desce sobre a ponte quebrada.', conteudoVaelhorn);
  ok(d.texto === 'A neblina desce sobre a ponte quebrada.', 'Prosa pura é aceita');

  // Id de item inventado não entra no jogo.
  const e = interpretarResposta(
    JSON.stringify({ narracao: 'Você acha algo no lodo.', achado: 'espada_de_mentira' }),
    conteudoVaelhorn,
  );
  ok(e.achado === undefined, 'Item inventado pela IA é recusado');

  // Repetição de opção nunca passa.
  const rep = validarOpcoesIA(
    [{ rotulo: 'Falar com a Elza!', custoPeriodos: 0 }, { rotulo: 'Erguer o edital', custoPeriodos: 0 }],
    ['falar com Elza'],
  );
  ok(rep.length === 1 && rep[0].rotulo === 'Erguer o edital', 'Opção repetida é filtrada');
}

// Grade: posições fixas. A engine completa o que a IA não entregou.
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Grade',
    atributos: atributosBase(),
    classeId: 'batedor',
    origemId: 'sem_nome',
    seedString: 'grade-1',
  });
  const cn = montarCena(conteudoVaelhorn, c);

  // A IA mandou só uma casa. A grade não pode entregar uma opção só.
  const soUma = montarGrade(
    conteudoVaelhorn,
    c,
    cn.contexto,
    [{ id: 'ia_0', rotulo: 'Perguntar a Elza sobre a laje', natureza: 'aproximar', custoPeriodos: 0, origem: 'ia' }],
    cn.opcoes,
  );
  ok(soUma.length >= 4, `A engine completa a grade (${soUma.length} casas)`);
  ok(soUma[0].rotulo === 'Perguntar a Elza sobre a laje', 'A opção da IA fica na casa dela');
  const eixos = soUma.map((o) => o.natureza);
  ok(new Set(eixos).size >= 3, 'A grade cobre eixos diferentes');
  ok(soUma.some((o) => o.origem === 'verbo' && !!o.verboId), 'As casas vazias viram verbos reais do jogo');

  // Duas do mesmo eixo: a segunda não ocupa casa nenhuma.
  const duplicadas = montarGrade(
    conteudoVaelhorn,
    c,
    cn.contexto,
    [
      { id: 'a', rotulo: 'Falar com Elza', natureza: 'aproximar', custoPeriodos: 0, origem: 'ia' },
      { id: 'b', rotulo: 'Falar com Aldrica', natureza: 'aproximar', custoPeriodos: 0, origem: 'ia' },
    ],
    cn.opcoes,
  );
  ok(!duplicadas.some((o) => o.rotulo === 'Falar com Aldrica'), 'Segunda opção do mesmo eixo não entra');
  ok(duplicadas.some((o) => o.id === 'deixar_correr'), 'Deixar o tempo correr fecha a grade');
}

// As rotinas se cruzam: o vale produz história sem o jogador.
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Ausente',
    atributos: atributosBase(),
    classeId: 'batedor',
    origemId: 'sem_nome',
    seedString: 'convivio-1',
  });

  // Um mês fora. Alguma coisa tem que ter acontecido entre elas.
  for (let d = 0; d < 30; d += 1) {
    c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
    avancarMundo(conteudoVaelhorn, c);
  }
  const ecos = c.ecos ?? [];
  ok(ecos.length > 0, `O vale gerou acontecimento sozinho (${ecos.length} ecos)`);
  ok(ecos.length <= 12, 'O boato envelhece e sai da boca do povo');

  // Todo eco cita duas pessoas que existem e um lugar que existe.
  const idsNpc = new Set(conteudoVaelhorn.npcs.map((n) => n.id));
  const idsLocal = new Set(conteudoVaelhorn.locais.map((l) => l.id));
  ok(
    ecos.every((e) => e.npcs.length === 2 && e.npcs.every((n) => idsNpc.has(n)) && idsLocal.has(e.local)),
    'Todo eco aponta para gente e lugar reais',
  );
  ok(ecos.every((e) => !e.texto.includes('{')), 'Nenhum molde de texto escapa cru');
  ok(ecosRecentes(c, 3).length > 0, 'Os boatos chegam ao narrador');

  // Os laços do conteúdo apontam para gente que existe, nos dois sentidos.
  const quebrados: string[] = [];
  for (const n of conteudoVaelhorn.npcs) {
    for (const l of n.relacoes ?? []) {
      if (!idsNpc.has(l.npc)) quebrados.push(`${n.id} → ${l.npc}`);
      if (l.npc === n.id) quebrados.push(`${n.id} tem laço consigo`);
    }
  }
  ok(quebrados.length === 0, `Laços apontam para gente real (${quebrados.join(', ')})`);
  const comLaco = conteudoVaelhorn.npcs.filter((n) => (n.relacoes ?? []).length > 0).length;
  ok(comLaco >= 20, `O elenco está entrelaçado (${comLaco} com laço)`);
}

// O vale anda sem o jogador.
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Parado',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'sem_nome',
    seedString: 'mundo-1',
  });
  ok(!!c.mundo, 'A campanha nasce com o vale montado');
  const climaInicial = c.mundo!.clima;

  // Duas semanas paradas: o mundo tem que ter mudado alguma coisa.
  c.calendario = { ...c.calendario, dia: c.calendario.dia + 14 };
  avancarMundo(conteudoVaelhorn, c);
  const mudou =
    c.mundo!.clima !== climaInicial || !!c.mundo!.evento || Math.abs(c.mundo!.carestia - 1) > 0.01;
  ok(mudou, 'Duas semanas paradas mudam o vale');
  ok(c.mundo!.diaProcessado === c.calendario.dia, 'O mundo não reprocessa o mesmo dia');

  // Quem foi deixado de lado esfria.
  ok(Object.values(c.npcState).some((d) => d.tensao > 0), 'A ausência pesa nas pessoas');

  // O preço da praça responde ao vale.
  const mult = multiplicadorDePreco(c);
  ok(mult > 0.5 && mult < 2.5, `O multiplicador de preço fica em faixa sã (${mult.toFixed(2)})`);
  const vale = comoEstaOVale(c);
  ok(!!vale.clima && !!vale.estacao, 'O vale se descreve em palavras');
}

// Despojos: o inimigo deixa o que carregava.
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Saqueador',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'sem_nome',
    seedString: 'despojos-1',
  });
  const bandido = conteudoVaelhorn.criaturas.find((x) => x.id === 'bandido')!;
  const antes = c.personagem.dinheiro;
  let achouAlgo = false;
  for (let i = 0; i < 12; i += 1) {
    const r = recolherDespojos(conteudoVaelhorn, c, bandido);
    if (r.itens.length > 0 || r.moedas > 0) achouAlgo = true;
  }
  ok(achouAlgo, 'Gente armada deixa bolso e embornal');
  ok(c.personagem.dinheiro > antes, 'As moedas do morto entram na bolsa');

  // Bicho não carrega bolsa.
  const rato = conteudoVaelhorn.criaturas.find((x) => x.id === 'rato_gigante')!;
  const semBolso = recolherDespojos(conteudoVaelhorn, c, rato);
  ok(semBolso.moedas === 0, 'Bicho não carrega moeda');

  // Tudo que cai existe mesmo no catálogo.
  const ids = new Set(conteudoVaelhorn.itens.map((i) => i.id));
  const foragida = conteudoVaelhorn.criaturas.find((x) => x.id === 'foragido_veterano')!;
  let todosValidos = true;
  for (let i = 0; i < 20; i += 1) {
    for (const a of despojosDe(conteudoVaelhorn, c, foragida)) {
      if (a.itemId && !ids.has(a.itemId)) todosValidos = false;
    }
  }
  ok(todosValidos, 'Nada que cai no chão é item inventado');
}

// Aposta: o que a tela mostra é a MESMA conta que resolve o turno.
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Apostador',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'sem_nome',
    seedString: 'risco-1',
  });

  const facil = avaliarOpcao(conteudoVaelhorn, c, {
    teste: { atributo: 'fisico', dificuldade: 6 },
    custoPeriodos: 0,
  });
  const dificil = avaliarOpcao(conteudoVaelhorn, c, {
    teste: { atributo: 'fisico', dificuldade: 26 },
    custoPeriodos: 3,
  });
  ok(facil.chance === 'quase certo', `Dificuldade baixa lê como quase certo (${facil.chance})`);
  ok(dificil.chance === 'quase impossível', `Dificuldade alta lê como quase impossível (${dificil.chance})`);
  ok(!!dificil.perigo, 'Tentativa difícil avisa que pode desandar');
  ok(dificil.custo === 'toma o dia', 'O custo de tempo aparece em palavra');
  ok(!facil.perigo, 'Tentativa fácil não inventa perigo');

  // Sem teste não há chance a mostrar — a ação simplesmente acontece.
  const semTeste = avaliarOpcao(conteudoVaelhorn, c, { custoPeriodos: 0 });
  ok(!semTeste.chance, 'Opção sem teste não mostra chance');

  // A leitura tem que acompanhar o estado: ferido e exausto piora a mesma ação.
  const antes = chanceDe(conteudoVaelhorn, c, { atributo: 'fisico', dificuldade: 14 });
  c.personagem.condicoes.push('ferido', 'exausto');
  const depois = chanceDe(conteudoVaelhorn, c, { atributo: 'fisico', dificuldade: 14 });
  ok(depois < antes, 'Condição ruim derruba a chance mostrada');

  // Nenhum número escapa para a tela (GDD §2.4).
  const selos = [facil.chance, dificil.chance, dificil.custo, dificil.perigo].filter(Boolean);
  ok(selos.every((t) => !/\d/.test(t as string)), 'Nenhuma aposta mostra número');
}

// Variedade: o conjunto de opções não pode ser cinco vezes o mesmo eixo.
{
  const mesmas = validarOpcoesIA([
    { rotulo: 'Perguntar a Elza sobre a laje', natureza: 'aproximar', custoPeriodos: 0 },
    { rotulo: 'Puxar conversa com Aldrica', natureza: 'aproximar', custoPeriodos: 0 },
    { rotulo: 'Cortejar Mira no balcão', natureza: 'aproximar', custoPeriodos: 0 },
  ]);
  ok(mesmas.length === 1, 'Três opções do mesmo eixo viram uma');

  const variadas = validarOpcoesIA([
    { rotulo: 'Perguntar a Elza sobre a laje', natureza: 'aproximar', custoPeriodos: 0 },
    { rotulo: 'Forçar a porta do porão', natureza: 'arriscar', custoPeriodos: 1 },
    { rotulo: 'Ficar de olho em quem entra', natureza: 'observar', custoPeriodos: 1 },
  ]);
  ok(variadas.length === 3, 'Eixos diferentes convivem');
  ok(variadas.every((o) => !!o.natureza), 'Toda opção sai com eixo definido');

  // Sem declarar, a engine deduz pelo teste que o próprio modelo propôs.
  const deduzida = validarOpcoesIA([
    { rotulo: 'Ler a laje com calma', custoPeriodos: 1, teste: { atributo: 'percepcao', dificuldade: 12 } },
  ]);
  ok(deduzida[0].natureza === 'observar', 'Eixo é deduzido do teste quando falta');
}

// O pacote precisa dizer ao modelo o que é possível — sem isso ele chuta.
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Curioso',
    atributos: atributosBase(),
    classeId: 'arcanista',
    origemId: 'divida',
    seedString: 'espaco-1',
  });
  const cn = montarCena(conteudoVaelhorn, c);
  const pk = montarPacote(conteudoVaelhorn, c, cn.contexto, 'fato') as Record<string, unknown>;
  ok(Array.isArray(pk.podeFazerAgora) && (pk.podeFazerAgora as string[]).length > 3, 'O pacote lista o que dá para fazer agora');
  ok(Array.isArray(pk.trancadoAgora), 'O pacote lista o que está trancado e por quê');
  ok(Array.isArray(pk.coisasAqui), 'O pacote lista as coisas concretas do lugar');
  ok(Array.isArray(pk.ondeDaParaIr) && (pk.ondeDaParaIr as string[]).length > 0, 'O pacote lista para onde dá para ir');
  ok(Array.isArray(pk.artesQueVoceSabe), 'O pacote lista as artes conhecidas');
}

// Memória: o que importa sobrevive, e chega ao narrador.
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Andarilho',
    atributos: atributosBase(),
    classeId: 'batedor',
    origemId: 'sem_nome',
    seedString: 'memoria-1',
  });

  // Uma noite juntos, e depois vinte conversas de balcão.
  registrarLembranca(c, 'elza', { tipo: 'intimidade', resumo: 'você a cortejou, e ela deixou', peso: 5 });
  for (let i = 0; i < 20; i += 1) {
    c.turno += 1;
    registrarLembranca(c, 'elza', { tipo: 'conversa', resumo: `conversa fiada ${i}`, peso: 1 });
  }
  const lembra = memoriaParaNarrador(c, 'elza', 5);
  ok(
    lembra.some((l) => l.includes('cortejou')),
    'A lembrança pesada sobrevive a vinte conversas rasas',
  );
  ok(c.npcState['elza'].memoria.length <= 14, 'A memória tem teto');

  // O turno escreve a lembrança do ponto de vista dela, não o log da engine.
  const c2 = criarCampanha(conteudoVaelhorn, {
    nome: 'Ladrão',
    atributos: atributosBase(),
    classeId: 'batedor',
    origemId: 'sem_nome',
    seedString: 'memoria-2',
  });
  resolverIntencao(conteudoVaelhorn, c2, { tipo: 'verbo', verboId: 'flertar', alvoId: 'elza' });
  const m = c2.npcState['elza'].memoria;
  ok(m.length === 1 && m[0].tipo === 'intimidade', 'Flertar deixa lembrança de intimidade');
  ok(!m[0].resumo.includes('Você tentou'), 'A lembrança não é o log seco da engine');

  // Quem não foi procurado acumula tensão.
  ok(c2.npcState['aldrica'].tensao > 0, 'Quem foi ignorado acumula tensão');

  // Marcos: a história longa, sem repetir o mesmo marco.
  registrarMarco(c2, 'você derrubou Vess, a Fiadora');
  registrarMarco(c2, 'você derrubou Vess, a Fiadora');
  ok((c2.marcos ?? []).length === 1, 'Um marco não entra duas vezes');
  ok(marcosRecentes(c2, 5)[0].includes('Vess'), 'Marcos voltam para o narrador');

  // O pacote precisa carregar tudo isso — era exatamente o que faltava.
  const cena2 = montarCena(conteudoVaelhorn, c2);
  const pacote = montarPacote(conteudoVaelhorn, c2, cena2.contexto, 'fato qualquer') as Record<string, unknown>;
  const presentes = pacote.presentes as { nome: string; lembraDeVoce: string[] }[];
  ok('jaAconteceu' in pacote && 'arcosAtivos' in pacote, 'O pacote leva história e fios abertos');
  ok('ritmo' in pacote, 'O pacote leva o ritmo da campanha');
  ok(
    presentes.every((x) => Array.isArray(x.lembraDeVoce)),
    'Cada presente leva o que lembra de você',
  );

  // Estado da NPC em uma frase, sem número na tela.
  const elza = conteudoVaelhorn.npcs.find((n) => n.id === 'elza')!;
  const frase = estadoDoNpc(c2, elza);
  ok(frase.length > 0 && !/\d/.test(frase), 'O estado da NPC é frase, não número');
}

// Ritmo: o diretor é cálculo, não uma segunda chamada de IA.
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Calmo',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'sem_nome',
    seedString: 'ritmo-1',
  });
  const calmo = calcularRitmo(conteudoVaelhorn, c);
  ok(calmo.tensao >= 0 && calmo.tensao <= 100, 'Tensão fica na faixa');
  ok(calmo.fase === 'calmaria', 'Campanha nova começa em calmaria');

  // Machucado, corrompido, com facção atrás e um fio aberto.
  c.personagem.recursos.vida = 3;
  c.personagem.pressoes['corrupcao'] = 60;
  c.personagem.pressoes['sanidade'] = 60;
  c.reputacao['guarda'] = -20;
  c.questEstado['q_edital'] = 'ativa';
  const aperto = calcularRitmo(conteudoVaelhorn, c);
  ok(aperto.tensao > calmo.tensao, 'Estado ruim empurra a tensão para cima');
  ok(aperto.motivos.length > 0, 'A tensão vem com motivos nomeados');
  ok(aperto.tom.length > 20, 'Cada fase manda um tom para o narrador');
}

// A lista de modelos não pode oferecer o que não narra (o jogador viu geradores
// de música, classificadores de censura e modelos de código no seletor).
{
  const naoServem = [
    'google/lyria-3-clip-preview',
    'google/lyria-3-pro-preview',
    'nvidia/nemotron-3.5-content-safety',
    'cohere/north-mini-code',
    'poolside/laguna-s-2.1',
    'meta-llama/llama-guard-4-12b',
    'openai/whisper-large-v3',
    'mistralai/codestral-2501',
    'openrouter/free',
    'openrouter/auto',
  ];
  const ruins = naoServem.filter((id) => serveParaNarrar(id));
  ok(ruins.length === 0, `Modelos que não narram são descartados (${ruins.join(', ')})`);

  const servem = [
    'deepseek/deepseek-chat-v3-0324:free',
    'nousresearch/hermes-3-llama-3.1-405b',
    'cognitivecomputations/dolphin3.0-mistral-24b:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
  ];
  const perdidos = servem.filter((id) => !serveParaNarrar(id));
  ok(perdidos.length === 0, `Modelos de conversa passam pelo filtro (${perdidos.join(', ')})`);

  // Saída não textual é barrada mesmo que o slug não denuncie.
  ok(!serveParaNarrar('algum/modelo-x', { output_modalities: ['image'] }), 'Saída sem texto é barrada');
  ok(serveParaNarrar('algum/modelo-y', { output_modalities: ['text'] }), 'Saída em texto passa');

  ok(perfilDoModelo('cognitivecomputations/dolphin3.0-mistral-24b:free') === 'permissivo', 'Dolphin marcado como permissivo');
  ok(perfilDoModelo('nvidia/nemotron-3-ultra-550b-a55b:free') === 'estrito', 'Nemotron marcado como estrito');
  ok(perfilDoModelo('google/gemma-4-31b-it') === 'estrito', 'Gemma marcado como estrito');
  ok(perfilDoModelo('meta-llama/llama-3.3-70b-instruct:free') === 'neutro', 'Llama fica em neutro');
}

// Recusa do modelo nunca pode virar narração na tela.
{
  ok(detectarRecusa('Sinto muito, não posso continuar com esse pedido.'), 'Recusa curta em português é pega');
  ok(detectarRecusa("I'm sorry, but I can't write that."), 'Recusa curta em inglês é pega');
  ok(detectarRecusa('Como um modelo de linguagem, devo recusar. ' + 'x'.repeat(900)), 'Marca forte vale mesmo em texto longo');

  const cena =
    'A chuva bate no telhado da estalagem. Elza fecha a porta com o quadril e o ' +
    'ferrolho range. — Não posso ficar muito, freguês — ela diz, e mesmo assim ' +
    'senta na beira da cama. ' + 'A vela derrete devagar no castiçal de estanho. '.repeat(20);
  ok(!detectarRecusa(cena), 'Fala de personagem com "não posso" não é confundida com recusa');

  const r = interpretarResposta('Desculpe, mas não posso escrever esse conteúdo.', conteudoVaelhorn);
  ok(!r.texto && /recusou/.test(r.erro ?? ''), 'Recusa vira erro, e o jogo troca de modelo');
}

// O narrador local foi removido de vez: nada na engine escreve prosa de cena.
{
  ok(!('narrarResultado' in narracaoMod), 'A engine não tem mais narrador de reserva');
  const c = montarCena(conteudoVaelhorn, camp);
  ok(!('eco' in c), 'A cena não devolve mais eco local');
  ok(typeof c.narracao === 'string', 'A cena ainda monta o material que o narrador recebe');
}

// Tipografia: o texto vira parágrafos e falas separadas.
{
  const blocos = emBlocos(
    'A taverna cheira a sebo.\n\n— Guarde seu ouro, freguesa.\n\nElza vira as costas.',
    ['Elza'],
  );
  ok(blocos.length === 3, 'Três blocos de narração');
  ok(blocos[1].tipo === 'fala', 'Linha com travessão vira fala');
  ok(blocos[1].tipo === 'fala' && blocos[1].quem === 'Elza', 'Fala é atribuída a quem está por perto');

  const parede = 'Frase comprida que se repete. '.repeat(30);
  const partido = emBlocos(parede, []);
  ok(partido.length > 1, 'Parede de texto sem quebra é fatiada em parágrafos');
}

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM.\n' : `\n${falhas} FALHA(S).\n`);
process.exit(falhas === 0 ? 0 : 1);
