// ARCANUM · Testes do sistema de Cosmologia, Guerra dos Deuses, Bruxas dos Pecados e Crônicas do Mapa.
import {
  MITO_ORIGEM_MAGIA,
  DEUSES_PRIMORDIAIS,
  BRUXAS_DOS_PECADOS,
  FACCOES_ANTIGAS,
  CRONICAS_MAPA,
} from '../content/vaelhorn/cosmologia';
import { COORDENADAS_LOCAIS } from '../content/vaelhorn/mapa';
import { conteudoVaelhorn as content } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { calcularContexto } from './availability';
import { montarPacote } from './llm';
import type { Campaign } from './types';

function ok(cond: unknown, msg?: string): asserts cond {
  if (!cond) throw new Error(msg ?? 'Falha de asserção');
}

function strictEqual<T>(a: T, b: T, msg?: string) {
  if (a !== b) throw new Error(`${msg ?? 'Falha de igualdade'}: esperado ${String(b)}, obtido ${String(a)}`);
}

function novaCampanha(): Campaign {
  return criarCampanha(content, {
    nome: 'Cronista Teste',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'divida',
    seedString: 'cosmo-teste',
    marcaInfancia: 'comum',
    reacaoInfancia: 'apoio',
  });
}

console.log('--- TESTES DE COSMOLOGIA, DEUSES, BRUXAS E CRÔNICAS DO MAPA ---');

// 1. Mito da Criação & Sangue do Mana
{
  ok(MITO_ORIGEM_MAGIA.titulo.length > 5, 'Título do mito de origem deve existir');
  ok(MITO_ORIGEM_MAGIA.texto.includes('Mana'), 'Mito deve explicar o Mana');
  ok(MITO_ORIGEM_MAGIA.texto.includes('sangue') || MITO_ORIGEM_MAGIA.texto.includes('Deuses'), 'Mana deve ser sangue de deuses tombados');
  console.log('✓ 1. Mito da Origem da Magia e Guerra dos Deuses validado');
}

// 2. Os Quatro Deuses Primordiais
{
  strictEqual(DEUSES_PRIMORDIAIS.length, 4, 'Devem existir 4 deuses primordiais principais');
  const idsEsperados = ['sol_voraz', 'abismo_ferro', 'mar_afogados', 'floresta_cega'];
  for (const id of idsEsperados) {
    const deus = DEUSES_PRIMORDIAIS.find((d) => d.id === id);
    ok(deus, `Deus primordial ${id} deve existir`);
    ok(deus.nome.length > 0, `Nome do deus ${id} não pode estar vazio`);
    ok(deus.dominio.length > 0, `Domínio do deus ${id} deve estar preenchido`);
    ok(deus.culto.length > 0, `Culto do deus ${id} deve estar preenchido`);
    ok(deus.simbolo.length > 0, `Símbolo do deus ${id} deve estar preenchido`);
    ok(deus.mito.length > 0, `Mito do deus ${id} deve estar preenchido`);
  }
  console.log('✓ 2. Panteão dos Deuses Primordiais validado (Sol-Voraz, Vandul, Yrmara, Vintrath)');
}

// 3. As 7 Bruxas dos Pecados Capitais + Tristeza + Vã-Glória + Satella (Inveja)
{
  ok(BRUXAS_DOS_PECADOS.length >= 9, 'Devem existir pelo menos as 7 bruxas capitais + 2 bruxos/bruxas adicionais');

  // Verifica a presença de cada pecado capital
  const pecadosObrigatorios = [
    'soberba',
    'ira',
    'preguica',
    'gula',
    'luxuria',
    'ganancia',
    'inveja',
  ];
  for (const pecado of pecadosObrigatorios) {
    const b = BRUXAS_DOS_PECADOS.find((x) => x.id === pecado);
    ok(b, `Bruxa do pecado ${pecado} deve existir`);
    ok(b.nome.length > 0, `Nome da bruxa de ${pecado} deve existir`);
    ok(b.autoridade.length > 0, `Autoridade da bruxa de ${pecado} deve estar descrita`);
    ok(b.naturezaPoder.length > 0, `Natureza do poder de ${pecado} deve estar descrita`);
    ok(b.desfecho.length > 0, `Desfecho de ${pecado} deve estar descrito`);
  }

  // Verifica os pecados adicionais inspirados no universo arcaico (Tristeza e Vã-Glória)
  const hector = BRUXAS_DOS_PECADOS.find((x) => x.id === 'tristeza');
  ok(hector, 'Bruxo da Tristeza/Melancolia (Hector) deve existir');
  ok(hector.pecado.toLowerCase().includes('tristeza') || hector.pecado.toLowerCase().includes('melancolia'), 'Pecado da tristeza');

  const pandora = BRUXAS_DOS_PECADOS.find((x) => x.id === 'va_gloria');
  ok(pandora, 'Bruxa da Vã-Glória (Pandora) deve existir');

  // Verifica Satella (Bruxa da Inveja) e a devoração das outras bruxas (estilo Re:Zero)
  const satella = BRUXAS_DOS_PECADOS.find((x) => x.id === 'inveja');
  ok(satella, 'Satella deve estar registrada');
  ok(
    satella.desfecho.includes('devorou') || satella.desfecho.includes('consumiu') || satella.desfecho.includes('selada'),
    'Desfecho de Satella deve registrar a devoração das outras bruxas e o selamento além do véu'
  );

  console.log('✓ 3. As 7 Bruxas dos Pecados Capitais, Hector, Pandora e Satella validadas');
}

// 4. Facções Antigas e Religiosas
{
  ok(FACCOES_ANTIGAS.length >= 4, 'Devem existir pelo menos 4 facções antigas');
  const faccaoSelo = FACCOES_ANTIGAS.find((f) => f.id === 'igreja_santos_selo');
  ok(faccaoSelo, 'Ordem dos Santos do Selo deve existir');

  const cultoBruxa = FACCOES_ANTIGAS.find((f) => f.id === 'culto_da_bruxa');
  ok(cultoBruxa, 'Culto da Bruxa deve existir');

  const conclaveMir = FACCOES_ANTIGAS.find((f) => f.id === 'conclave_magos_mir');
  ok(conclaveMir, 'Conclave Arruinado de Mir deve existir');

  const laminaEscura = FACCOES_ANTIGAS.find((f) => f.id === 'casa_sem_nome');
  ok(laminaEscura, 'Fraternidade da Lâmina Escura deve existir');

  console.log('✓ 4. Facções antigas e ordens religiosas validadas');
}

// 5. Cobertura de Crônicas para Todos os Pontos do Mapa
{
  const chavesMapa = Object.keys(COORDENADAS_LOCAIS);
  ok(chavesMapa.length > 50, 'Mapa deve possuir mais de 50 pontos coordenados');

  for (const id of chavesMapa) {
    const cronica = CRONICAS_MAPA[id];
    ok(cronica, `Ponto do mapa "${id}" deve possuir uma crônica em CRONICAS_MAPA`);
    ok(cronica.nome.length > 0, `Crônica de "${id}" deve ter nome preenchido`);
    ok(cronica.regiao.length > 0, `Crônica de "${id}" deve ter região preenchida`);
    ok(cronica.divindadeOuCrenca.length > 0, `Crônica de "${id}" deve ter fé/divindade preenchida`);
    ok(cronica.passadoGuerraDeuses.length > 0, `Crônica de "${id}" deve ter passado na guerra dos deuses`);
    ok(cronica.marcaDasBruxas.length > 0, `Crônica de "${id}" deve ter cicatriz das bruxas`);
    ok(cronica.supersticaoPopular.length > 0, `Crônica de "${id}" deve ter superstição popular`);
  }
  console.log(`✓ 5. Todos os ${chavesMapa.length} pontos do mapa possuem crônicas vivas e completas`);
}

// 6. Integração com o Pacote da Engine LLM
{
  const camp = novaCampanha();
  const ctx = calcularContexto(content, camp);
  const pacote = montarPacote(content, camp, ctx, 'O jogador examina o solo sagrado.');

  ok(pacote.local, 'Pacote deve conter o objeto local');
  ok(pacote.local.cronica, 'Pacote deve conter a crônica cósmica do local atual');
  ok(pacote.local.cronica.crenca.length > 0, 'Crônica no pacote deve carregar a fé/crença');
  ok(pacote.local.cronica.passadoGuerra.length > 0, 'Crônica no pacote deve carregar o passado na guerra dos deuses');
  ok(pacote.local.cronica.cicatrizBruxas.length > 0, 'Crônica no pacote deve carregar a cicatriz das bruxas');
  ok(pacote.local.cronica.supersticao.length > 0, 'Crônica no pacote deve carregar a superstição popular');

  console.log('✓ 6. Injeção de crônica cósmica no pacote de contexto da LLM validada');
}

console.log('--- TODOS OS TESTES DE COSMOLOGIA PASSARAM COM SUCESSO! ---');
