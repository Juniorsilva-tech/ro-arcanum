// ARCANUM · Testes de Vivedez e Dinâmica do Mundo.
// Validações determinísticas:
// 1. Resgate de Ruínas Fantasma: vilas com 0 moradores e < 40 integridade recebem expedição pioneira de cidade vizinha.
// 2. Expansão Territorial: metrópoles saturadas e fartas fundam povoados pioneiros em sítios livres.
// 3. Mitigação de Cerco: muralha urbana reduz danos a infraestrutura e vidas durante invasões.
// 4. Extorsão de Bandos: bandos com 10+ membros extorquem vilarejos desprotegidos, e muralhas bloqueiam a cobrança.

import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { processarCidades } from './cidades';
import { processarContinuidade, criarAmeacaLocal } from './continuidade';
import { estadoBandos, processarBandos } from './bandos';
import type { Campaign } from './types';

const ok = (v: unknown, msg: string) => {
  if (!v) throw new Error(`FALHA: ${msg}`);
  console.log(`✓ ${msg}`);
};

const nova = (seed = 'vivedez'): Campaign => {
  const camp = criarCampanha(C, {
    nome: 'Observador', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });
  if (camp.familia) camp.familia.prologoConcluido = true;
  return camp;
};

// ── Teste 1: Resgate de Ruínas Fantasma ──────────────────────────────────────
{
  const camp = nova();
  const cidadesIds = Object.keys(camp.vivo!.cidades);
  const ruinaId = cidadesIds[0];
  const patronaId = cidadesIds[1];

  const povoRuina = camp.continuidade!.locais[ruinaId];
  const cidRuina = camp.vivo!.cidades[ruinaId];
  povoRuina.populacao = 0;
  povoRuina.integridade = 15;
  cidRuina.fomeDias = 0;
  cidRuina.doenca = 0;

  const povoPatrona = camp.continuidade!.locais[patronaId];
  const cidPatrona = camp.vivo!.cidades[patronaId];
  povoPatrona.populacao = 35;
  cidPatrona.comida = 250;
  cidPatrona.materiais = 100;

  camp.calendario.dia = 45;
  processarCidades(C, camp);

  ok(povoRuina.populacao === 4, 'Ruína fantasma recebeu 4 colonos pioneiros');
  ok(povoRuina.integridade === 40, 'Integridade da ruína subiu de 15 para 40 com materiais da patrona');
  ok(cidPatrona.comida < 235, 'Cidade patrona forneceu 30 de comida para a expedição');
  ok(cidPatrona.materiais <= 75, 'Cidade patrona forneceu 30 de materiais para a reconstrução');
  ok(povoPatrona.populacao === 32, 'Cidade patrona transferiu 3 moradores pioneiros');
  ok(camp.vivo!.fatos.some(f => f.tipo === 'expedicao_reconstrucao' && f.local === ruinaId), 'Fato histórico de expedição registrado publicamente');
}

// ── Teste 2: Fundação Autônoma de Povoados Pioneiros ─────────────────────────
{
  const camp = nova();
  const cidadesIds = Object.keys(camp.vivo!.cidades);
  const metropoleId = cidadesIds[0];
  const povoMetro = camp.continuidade!.locais[metropoleId];
  const cidMetro = camp.vivo!.cidades[metropoleId];

  // Superlotação e abundância de materiais e grãos
  cidMetro.edificios.moradias = 1;
  povoMetro.populacao = 60; // 60 >= 1 * 50
  cidMetro.comida = 400;
  cidMetro.materiais = 200;
  camp.calendario.dia = 120;

  processarCidades(C, camp);

  const fatoFundacao = camp.vivo!.fatos.find(f => f.tipo === 'fundacao_pioneira');
  ok(!!fatoFundacao, 'Metrópole rica e superpovoada fundou povoado pioneiro');
  const novoLocalId = fatoFundacao!.local;
  ok(camp.continuidade!.locais[novoLocalId]?.populacao === 6, 'Novo povoado nasceu com 6 colonos pioneiros');
  ok(camp.vivo!.cidades[novoLocalId]?.edificios.lavoura === 1, 'Novo povoado possui infraestrutura inicial');
  ok(cidMetro.comida < 335, 'Metrópole supriu 80 de comida inicial para os pioneiros');
  ok(cidMetro.materiais <= 145, 'Metrópole supriu 60 de materiais de construção');
  ok(povoMetro.populacao === 54, 'População excedente migrou para a nova fronteira');
}

// ── Teste 3: Mitigação de Cerco pela Muralha ─────────────────────────────────
{
  const camp = nova();
  const locais = Object.keys(camp.continuidade!.locais);
  const vilaSemMuralha = locais[0];
  const vilaComMuralha = locais[1];

  camp.vivo!.cidades[vilaSemMuralha].edificios.muralha = 1;
  camp.continuidade!.locais[vilaSemMuralha].integridade = 100;
  camp.continuidade!.locais[vilaSemMuralha].populacao = 50;

  camp.vivo!.cidades[vilaComMuralha].edificios.muralha = 4;
  camp.continuidade!.locais[vilaComMuralha].integridade = 100;
  camp.continuidade!.locais[vilaComMuralha].populacao = 50;

  // Cria ameaças artificiais vencidas
  camp.calendario.dia = 20;
  camp.continuidade!.ameacas = [
    { id: 'am_1', rivalId: 'r1', criaturaId: 'oni_1', local: vilaSemMuralha, inicio: 10, prazo: 20, estado: 'ativa', descoberta: true },
    { id: 'am_2', rivalId: 'r2', criaturaId: 'oni_2', local: vilaComMuralha, inicio: 10, prazo: 20, estado: 'ativa', descoberta: true },
  ];

  processarContinuidade(C, camp);

  const danoSemMuralha = 100 - camp.continuidade!.locais[vilaSemMuralha].integridade;
  const danoComMuralha = 100 - camp.continuidade!.locais[vilaComMuralha].integridade;
  const mortosSemMuralha = 50 - camp.continuidade!.locais[vilaSemMuralha].populacao;
  const mortosComMuralha = 50 - camp.continuidade!.locais[vilaComMuralha].populacao;

  ok(danoSemMuralha === 35, 'Vila com muralha padrão sofreu 35 de dano estrutural');
  ok(danoComMuralha === 17, 'Vila com muralha nível 4 sofreu apenas 17 de dano estrutural');
  ok(mortosSemMuralha === 8, 'Vila com muralha padrão perdeu 8 moradores');
  ok(mortosComMuralha === 2, 'Vila com muralha nível 4 perdeu apenas 2 moradores');
}

// ── Teste 4: Extorsão Territorial de Bandos e Bloqueio por Muralha ───────────
{
  const camp = nova();
  const estadoB = estadoBandos(C, camp);
  const bando = Object.values(estadoB.bandos).find(b =>
    C.locais.some(l => l.regiao === b.regiao && ['aldeia', 'vila', 'acampamento', 'porto', 'cidade', 'forte'].includes(l.tipo) && camp.vivo?.cidades[l.id])
  ) ?? Object.values(estadoB.bandos)[0];
  ok(!!bando, 'Bando de salteadores existe no cenário');

  // Encontra um assentamento na mesma região
  const aldeiaAlvo = C.locais.find(l => l.regiao === bando.regiao && ['aldeia', 'vila', 'acampamento', 'porto', 'cidade', 'forte'].includes(l.tipo) && camp.vivo?.cidades[l.id])!;
  ok(!!aldeiaAlvo, 'Povoamento na região do bando localizado');
  if (aldeiaAlvo && camp.vivo?.cidades[aldeiaAlvo.id]) {
    const cidAlvo = camp.vivo.cidades[aldeiaAlvo.id];
    const povoAlvo = camp.continuidade!.locais[aldeiaAlvo.id];

    // Configura condições de vulnerabilidade (sem muralha fortificada e integridade < 70)
    cidAlvo.edificios.muralha = 1;
    povoAlvo.integridade = 50;
    cidAlvo.tesouro = 30;
    bando.membros = 10;
    bando.capitao.vivo = true;
    bando.capitao.preso = false;
    const tesouroInicialBando = bando.tesouro;

    camp.calendario.dia = 14;
    processarBandos(C, camp);

    ok(cidAlvo.tesouro === 18, 'Bando extorquiu 12 moedas de tributo forçado da aldeia indefesa');
    ok(bando.tesouro === tesouroInicialBando + 12 + Math.ceil(bando.membros / 3), 'Tesouro do bando recolheu a extorsão');
    ok(camp.vivo.fatos.some(f => f.tipo === 'extorsao_bando' && f.local === aldeiaAlvo.id), 'Fato de extorsão registrado');

    // Ao erguer muralha fortificada (nível 2), a aldeia repele a extorsão
    cidAlvo.edificios.muralha = 2;
    camp.calendario.dia = 28;
    const fatosAntes = camp.vivo.fatos.filter(f => f.tipo === 'extorsao_bando').length;
    processarBandos(C, camp);
    const fatosDepois = camp.vivo.fatos.filter(f => f.tipo === 'extorsao_bando').length;
    ok(fatosAntes === fatosDepois, 'Muralha fortificada protegeu a aldeia e impediu nova extorsão');
  }
}

console.log('\nTodos os testes de vivedez e dinâmica do mundo passaram com sucesso!');
