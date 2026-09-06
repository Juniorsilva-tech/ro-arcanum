// ARCANUM · Testes do sistema de aptidão, maestria, exposição e crença.
//
// O que estes testes protegem, em uma frase: talento acelera, mas não decide;
// e o mundo só sabe o que viu.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { normalizarCampanha } from './migracao';
import type { Campaign, NPC } from './types';
import {
  contextoDeAptidao, crencaDe, estadoAptidao, iniciarAptidao, maestriaDe,
  maestriaPorEsforco, esforcoParaMaestria, registrarDemonstracao, treinar,
  alternarOcultacao, faixaDeAptidao, processarAptidao, migrarAptidao,
  aptidaoRealParaTestes, leituraDoObservador, dominioDaAcao,
} from './aptidao';
import { montarPacote } from './llm';
import { calcularContexto } from './availability';

const ok = (v: unknown, msg: string) => { if (!v) throw new Error(msg); console.log(`✓ ${msg}`); };

const nova = (seed: string, marca: 'tragedia' | 'genio' | 'indigno' | 'comum' = 'comum') =>
  criarCampanha(C, {
    nome: 'Aprendiz', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida',
    seedString: seed, marcaInfancia: marca, reacaoInfancia: 'apoio',
  });

/** Força uma aptidão exata, para testar a mecânica e não o sorteio. */
function comAptidao(camp: Campaign, dominio: 'espada', valor: number): Campaign {
  estadoAptidao(camp).aptidao[dominio] = valor;
  return camp;
}

const civil = (id: string): NPC => ({
  id, nome: `Civil ${id}`, idade: 30, ocupacao: 'lavrador', personalidade: 'simples',
  localBase: 'praca', faccaoId: 'vila', rotina: {}, vozNarrativa: 'seca', corpo: 'comum', relacoes: [],
});

// ── Determinismo e sigilo ─────────────────────────────────────────────────
{
  const a = nova('apt-determinista'), b = nova('apt-determinista');
  ok(
    JSON.stringify(a.aptidao!.aptidao) === JSON.stringify(b.aptidao!.aptidao),
    'A mesma semente sorteia a mesma aptidão',
  );

  const c = nova('apt-sigilo');
  comAptidao(c, 'espada', 98);
  const ctx = contextoDeAptidao(c);
  ok(!JSON.stringify(ctx).includes('98'), 'O pacote público não carrega o número da aptidão');
  const pacote = JSON.stringify(montarPacote(C, c, calcularContexto(C, c), 'fato'));
  ok(!pacote.includes('"aptidao"'), 'O contexto do narrador não contém o campo aptidao');
}

// ── Curva de maestria: retorno decrescente ────────────────────────────────
{
  const ate30 = esforcoParaMaestria(30);
  const de80a90 = esforcoParaMaestria(90) - esforcoParaMaestria(80);
  const de90a95 = esforcoParaMaestria(95) - esforcoParaMaestria(90);
  ok(de80a90 > ate30, 'Subir de 80 para 90 custa mais que sair do zero até 30');
  ok(de90a95 > de80a90 * 0.9, 'Cada faixa alta custa pelo menos tanto quanto a anterior');
  ok(maestriaPorEsforco(1e9) < 100.0001, 'A maestria satura em 100 e nunca estoura');
}

// ── Talento acelera, mas não decide ───────────────────────────────────────
{
  const prod = comAptidao(nova('apt-prod'), 'espada', 97);
  const comum = comAptidao(nova('apt-comum'), 'espada', 35);
  for (let i = 0; i < 40; i++) {
    treinar(C, prod, 'espada', { mestre: 0.6, esforco: 0.7, recursos: 0.6 });
    treinar(C, comum, 'espada', { mestre: 0.6, esforco: 0.7, recursos: 0.6 });
  }
  ok(maestriaDe(prod, 'espada') > maestriaDe(comum, 'espada') * 1.3,
    'Com o mesmo treino, o prodígio chega mais longe');

  // O ponto central do pedido: prodígio iniciante perde para veterano comum.
  const iniciante = comAptidao(nova('apt-iniciante'), 'espada', 99);
  treinar(C, iniciante, 'espada', {});
  const veterano = comAptidao(nova('apt-veterano'), 'espada', 30);
  for (let i = 0; i < 120; i++) treinar(C, veterano, 'espada', { mestre: 0.5, esforco: 0.6 });
  ok(maestriaDe(veterano, 'espada') > maestriaDe(iniciante, 'espada') * 3,
    'Prodígio iniciante é muito pior que veterano comum — talento não é poder pronto');

  // E o inverso do estereótipo: disciplina vence talento desperdiçado.
  const dedicado = comAptidao(nova('apt-dedicado'), 'espada', 40);
  const relaxado = comAptidao(nova('apt-relaxado'), 'espada', 95);
  for (let i = 0; i < 60; i++) {
    treinar(C, dedicado, 'espada', { mestre: 0.95, esforco: 1, recursos: 0.9 });
    treinar(C, relaxado, 'espada', { mestre: 0, esforco: 0.15, recursos: 0.1 });
  }
  ok(maestriaDe(dedicado, 'espada') > maestriaDe(relaxado, 'espada'),
    'Comum disciplinado com bom mestre supera prodígio sem disciplina');

  // Teto confortável freia, mas não fecha a porta.
  const teimoso = comAptidao(nova('apt-teimoso'), 'espada', 20);
  for (let i = 0; i < 4000; i++) treinar(C, teimoso, 'espada', { mestre: 0.9, esforco: 1, recursos: 0.9 });
  ok(maestriaDe(teimoso, 'espada') > 85,
    'Aptidão baixa ainda alcança nível alto com muitos anos de esforço');
}

// ── O mundo só sabe o que viu ─────────────────────────────────────────────
{
  const c = comAptidao(nova('apt-oculto'), 'espada', 98);
  for (let i = 0; i < 50; i++) treinar(C, c, 'espada', { mestre: 0.8, esforco: 0.9 });
  registrarDemonstracao(C, c, { dominio: 'espada', dificuldade: 90, sucesso: true, testemunhas: [] });
  const a = estadoAptidao(c);
  ok(a.exposicao.espada === 0 && a.reputacao.espada === 0,
    'Sem testemunha não há exposição nem reputação, por mais capaz que seja');

  const olheiro = civil('olheiro');
  c.npcState[olheiro.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
  registrarDemonstracao(C, c, { dominio: 'espada', dificuldade: 90, sucesso: true, testemunhas: [olheiro] });
  ok(estadoAptidao(c).exposicao.espada > 0, 'Com plateia, a exposição começa a subir');
  ok((crencaDe(c, olheiro.id, 'espada')?.observacoes ?? 0) === 1, 'A testemunha registra o que viu');
  ok(crencaDe(c, 'ninguem', 'espada') === undefined, 'Quem não estava lá não forma crença nenhuma');
}

// ── Observador competente lê melhor que civil ─────────────────────────────
{
  const c = comAptidao(nova('apt-observadores'), 'espada', 90);
  const perito = C.npcs.find(n => n.combatente?.nichirin)!;
  const leigo = civil('leigo');
  c.npcState[leigo.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
  for (let i = 0; i < 6; i++) {
    registrarDemonstracao(C, c, {
      dominio: 'espada', dificuldade: 95, sucesso: true, testemunhas: [perito, leigo],
    });
  }
  const cp = crencaDe(c, perito.id, 'espada')!;
  const cl = crencaDe(c, leigo.id, 'espada')!;
  ok(cp.valor > cl.valor, 'O perito enxerga a diferença; o civil comprime tudo para o meio');
  ok(cp.confianca > cl.confianca, 'O perito tem mais confiança na própria leitura');
  ok(!!leituraDoObservador(c, perito.id, 'espada'), 'A leitura do observador vira texto para a cena');
}

// ── Viés: quem não gosta de você desconta ─────────────────────────────────
{
  const c = comAptidao(nova('apt-vies'), 'espada', 90);
  const amigo = civil('amigo'), rival = civil('rival');
  c.npcState[amigo.id] = { eixos: { disposicao: 18 }, vivo: true, tensao: 0, memoria: [] };
  c.npcState[rival.id] = { eixos: { disposicao: -18 }, vivo: true, tensao: 0, memoria: [] };
  for (let i = 0; i < 5; i++) {
    registrarDemonstracao(C, c, {
      dominio: 'espada', dificuldade: 85, sucesso: true, testemunhas: [amigo, rival],
    });
  }
  ok(crencaDe(c, amigo.id, 'espada')!.valor > crencaDe(c, rival.id, 'espada')!.valor,
    'A mesma façanha vale mais para quem gosta e menos para quem não gosta');
}

// ── Suspeita de talento nasce do ritmo, e só para quem entende ────────────
{
  const c = comAptidao(nova('apt-ritmo'), 'espada', 99);
  const mestre = C.npcs.find(n => n.combatente?.nichirin)!;
  const leigo = civil('leigo2');
  c.npcState[leigo.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
  for (let i = 0; i < 12; i++) {
    treinar(C, c, 'espada', { mestre: 0.9, esforco: 1, recursos: 0.9, observadorId: mestre.id });
    treinar(C, c, 'espada', { mestre: 0.9, esforco: 1, recursos: 0.9, observadorId: leigo.id });
  }
  ok((crencaDe(c, mestre.id, 'espada')?.suspeita ?? 0) > 0,
    'Quem entende do assunto percebe que o aprendizado foi rápido demais');
  ok((crencaDe(c, leigo.id, 'espada')?.suspeita ?? 0) === 0,
    'O civil não mede ritmo de aprendizado — para ele é só treino');
}

// ── Esconder é jogada válida ──────────────────────────────────────────────
{
  const aberto = comAptidao(nova('apt-aberto'), 'espada', 95);
  const oculto = comAptidao(nova('apt-oculto2'), 'espada', 95);
  ok(alternarOcultacao(oculto) === true, 'Ocultar-se é uma decisão explícita do jogador');
  const t = civil('plateia');
  for (const c of [aberto, oculto]) c.npcState[t.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
  for (let i = 0; i < 8; i++) {
    for (const c of [aberto, oculto]) {
      registrarDemonstracao(C, c, { dominio: 'espada', dificuldade: 88, sucesso: true, testemunhas: [t] });
    }
  }
  ok(estadoAptidao(oculto).exposicao.espada < estadoAptidao(aberto).exposicao.espada * 0.5,
    'Conter-se derruba a exposição pela metade ou mais');
  ok(estadoAptidao(oculto).reputacao.espada < estadoAptidao(aberto).reputacao.espada,
    'Quem se contém demora muito mais a virar assunto');
  // E cobra o preço: esconder atrasa o próprio aprendizado.
  const a1 = comAptidao(nova('apt-treino-aberto'), 'espada', 60);
  const a2 = comAptidao(nova('apt-treino-oculto'), 'espada', 60);
  alternarOcultacao(a2);
  for (let i = 0; i < 30; i++) {
    treinar(C, a1, 'espada', { mestre: 0.7, esforco: 0.8 });
    treinar(C, a2, 'espada', { mestre: 0.7, esforco: 0.8 });
  }
  ok(maestriaDe(a2, 'espada') < maestriaDe(a1, 'espada'), 'Esconder tem custo: treina-se menos');
}

// ── Reputação limitada pela exposição; fama atrás da reputação ────────────
{
  const c = comAptidao(nova('apt-fama'), 'espada', 92);
  const t = civil('t1');
  c.npcState[t.id] = { eixos: {}, vivo: true, tensao: 0, memoria: [] };
  for (let i = 0; i < 3; i++) {
    registrarDemonstracao(C, c, { dominio: 'espada', dificuldade: 95, sucesso: true, testemunhas: [t] });
  }
  const a = estadoAptidao(c);
  ok(a.reputacao.espada <= a.exposicao.espada + 0.001,
    'Ninguém fica com fama de algo que mostrou pouco: reputação não passa da exposição');
  const famaAntes = a.fama.espada;
  for (let i = 0; i < 30; i++) { c.calendario.dia += 1; processarAptidao(C, c); }
  ok(a.fama.espada > famaAntes, 'A fama sobe com o tempo, correndo atrás da reputação');
  ok(a.fama.espada <= a.picoReputacao.espada + 0.001, 'A fama nunca ultrapassa o pico de reputação que a alimentou');

  // Glória antiga esfria devagar: a fama fica para trás quando a reputação cai.
  a.reputacao.espada = 0;
  const famaNoAuge = a.fama.espada;
  for (let i = 0; i < 5; i++) { c.calendario.dia += 1; processarAptidao(C, c); }
  ok(a.fama.espada > 0 && a.fama.espada < famaNoAuge,
    'Quando a reputação cai, a fama desce devagar — quem já foi grande continua sendo lembrado');
  ok(a.fama.espada > a.reputacao.espada, 'É legítimo a fama estar acima da reputação atual');
}

// ── Degraus do mundo disparam uma vez cada ────────────────────────────────
{
  const c = comAptidao(nova('apt-degraus'), 'espada', 95);
  const a = estadoAptidao(c);
  a.exposicao.espada = 100; a.reputacao.espada = 90; a.fama.espada = 70;
  for (let i = 0; i < 5; i++) { c.calendario.dia += 1; processarAptidao(C, c); }
  const degraus = a.reacoes.filter(r => r.dominio === 'espada');
  ok(degraus.length === 4, 'Os quatro degraus de reação do mundo dispararam');
  ok(new Set(degraus.map(r => r.degrau)).size === 4, 'Nenhum degrau dispara duas vezes');
  ok((c.vivo?.fatos ?? []).some(f => f.tipo === 'talento_reconhecido'),
    'O reconhecimento vira fato registrado, não invenção do narrador');
}

// ── Migração: veterano não acorda zerado, e o RNG não se mexe ─────────────
{
  const velho = nova('apt-migracao');
  velho.personagem.pericias = { arcana: 3, perceber: 2 };
  velho.personagem.nivel = 12;
  velho.personagem.artesConhecidas = ['centelha', 'ler_aura'];
  delete velho.aptidao;
  const cursorAntes = velho.rng.cursor;
  const migrado = normalizarCampanha(C, JSON.parse(JSON.stringify(velho)) as Campaign);
  ok(!!migrado.aptidao, 'Save antigo ganha estado de aptidão ao carregar');
  ok(maestriaDe(migrado, 'arcano') > 40, 'Perícia treinada vira maestria: o veterano continua veterano');
  ok(maestriaDe(migrado, 'espada') > 10, 'Nível e artes contam como bagagem de combate');
  ok(migrado.rng.cursor === cursorAntes, 'Migrar não move o cursor do RNG da campanha');

  const b = normalizarCampanha(C, JSON.parse(JSON.stringify(velho)) as Campaign);
  ok(JSON.stringify(b.aptidao!.aptidao) === JSON.stringify(migrado.aptidao!.aptidao),
    'A migração é idempotente: mesma campanha, mesma aptidão');
}

// ── Vocabulário e faixas ──────────────────────────────────────────────────
{
  ok(faixaDeAptidao(96) === 'prodigio' && faixaDeAptidao(49) === 'comum' && faixaDeAptidao(100) === 'fenomeno_historico',
    'As faixas de aptidão respeitam os limiares combinados');
  ok(dominioDaAcao('arcana') === 'arcano' && dominioDaAcao(undefined, 'social') === 'diplomacia',
    'Perícia e categoria de verbo mapeiam para o domínio certo');
  ok(dominioDaAcao('inexistente', 'inexistente') === undefined, 'Ação sem domínio conhecido não treina nada');
}

// ── Aptidão alta sem treino não vale nada, e é isso mesmo ─────────────────
{
  const c = comAptidao(nova('apt-desperdicio'), 'espada', 100);
  ok(aptidaoRealParaTestes(c, 'espada') === 100, 'A engine conhece a aptidão real');
  ok(maestriaDe(c, 'espada') === 0, 'Nascer fenômeno histórico não dá um ponto de habilidade de graça');
  ok((contextoDeAptidao(c)?.dominios ?? []).every(d => d.maestria < 5),
    'E o mundo não tem nada para ver');
}

console.log('Testes de aptidão, maestria, exposição e crença passaram.');
