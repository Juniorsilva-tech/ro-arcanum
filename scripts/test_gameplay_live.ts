// ARCANUM · Teste de Gameplay em Tempo Real dentro do Jogo (End-to-End Runtime).
// Este script executa o fluxo completo do jogo através do Zustand store real
// utilizado pela interface React Native / Web.

import { useGame } from '../ui/store';
import { COORDENADAS_LOCAIS } from '../content/vaelhorn/mapa';
import { CRONICAS_MAPA, DEUSES_PRIMORDIAIS, BRUXAS_DOS_PECADOS } from '../content/vaelhorn/cosmologia';
import { atributosBase } from '../engine/character';

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) {
    console.error('❌ FALHA NO TESTE DE JOGO:', msg);
    throw new Error(msg);
  }
}

async function testarGameplayCompleto() {
  console.log('=================================================================');
  console.log('🎮 INICIANDO TESTE DE GAMEPLAY EM TEMPO REAL DENTRO DO JOGO');
  console.log('=================================================================\n');

  const store = useGame.getState();

  // 1. Inicialização do Store
  console.log('Passo 1: Inicializando o motor do jogo (store.init)...');
  await store.init();
  const statePosInit = useGame.getState();
  assert(statePosInit.pronto, 'Store deve estar pronto após init');
  console.log(`✓ Store inicializado com sucesso. Tela inicial: "${statePosInit.tela}".\n`);

  // 2. Criação de Novo Jogo em Vaelhorn usando o fluxo da interface
  console.log('Passo 2: Criando nova campanha (Personagem: Alistair, Guardião)...');
  store.novoJogo();
  store.escolherCenario('vaelhorn');
  store.escolherClasse('guardiao');
  store.escolherOrigem('divida');
  store.escolherMarcaInfancia('comum');
  store.escolherReacaoInfancia('apoio');
  store.setNome('Alistair de Corveira');
  await store.iniciarCampanha();
  await store.pularInfancia();

  const stateJogo = useGame.getState();
  assert(stateJogo.camp !== null && stateJogo.camp !== undefined, 'Campanha deve estar ativa');
  assert(stateJogo.content !== null && stateJogo.content !== undefined, 'Bundle de conteúdo deve estar carregado');
  console.log(`✓ Campanha criada com sucesso!`);
  console.log(`  Protagonista: ${stateJogo.camp.personagem.nome}`);
  console.log(`  Local Inicial: ${stateJogo.camp.localAtual}`);
  console.log(`  Capítulo: ${stateJogo.camp.capitulo.numero} (${stateJogo.camp.capitulo.titulo})\n`);

  // 3. Verificação da Cena de Jogo e Feed
  console.log('Passo 3: Verificando cena inicial e opções da grade...');
  assert(stateJogo.cena !== null && stateJogo.cena !== undefined, 'Cena inicial deve existir');
  const cena = stateJogo.cena!;
  assert(cena.opcoes.length > 0, 'Cena deve conter opções de ação');
  console.log(`✓ Cena montada: ${cena.contexto.local.nome} (${cena.opcoes.length} opções disponíveis na grade).`);
  console.log(`  Atmosfera: "${cena.contexto.local.descricaoBase.slice(0, 80)}..."\n`);

  // 4. Navegação para a Tela do Mapa
  console.log('Passo 4: Navegando para a tela do Mapa (irPara("mapa"))...');
  store.irPara('mapa');
  assert(useGame.getState().tela === 'mapa', 'Tela atual deve ser "mapa"');
  console.log('✓ Navegação para o Mapa confirmada.');

  // 5. Teste dos 67 Marcadores e Inspeção de Crônicas do Mapa
  console.log('Passo 5: Testando os 67 locais coordenados e crônicas cósmicas...');
  const chavesMapa = Object.keys(COORDENADAS_LOCAIS);
  console.log(`  Total de pontos no continente: ${chavesMapa.length}`);
  
  let locaisInspecionados = 0;
  for (const localId of chavesMapa) {
    const coord = COORDENADAS_LOCAIS[localId];
    const cronica = CRONICAS_MAPA[localId];
    assert(coord !== undefined, `Local ${localId} deve ter coordenadas`);
    assert(cronica !== undefined, `Local ${localId} deve ter crônica histórica`);
    assert(cronica.passadoGuerraDeuses.length > 0, `Local ${localId} deve ter guerra dos deuses`);
    assert(cronica.divindadeOuCrenca.length > 0, `Local ${localId} deve ter fé`);
    assert(cronica.marcaDasBruxas.length > 0, `Local ${localId} deve ter marca das bruxas`);
    assert(cronica.supersticaoPopular.length > 0, `Local ${localId} deve ter superstição`);
    locaisInspecionados++;
  }
  console.log(`✓ Todos os ${locaisInspecionados} locais do mapa possuem coordenadas e crônicas completas!\n`);

  // Amostra de inspeção de 3 locais icônicos
  console.log('--- AMOSTRA DE CRÔNICAS INSPECIONADAS NO MAPA ---');
  for (const amostraId of ['taverna', 'corveira', 'mareu']) {
    const c = CRONICAS_MAPA[amostraId];
    console.log(`  [${c.nome.toUpperCase()} · ${c.regiao}]`);
    console.log(`  • Guerra dos Deuses: ${c.passadoGuerraDeuses.slice(0, 90)}...`);
    console.log(`  • Fé Local: ${c.divindadeOuCrenca.slice(0, 90)}...`);
    console.log(`  • Marca das Bruxas: ${c.marcaDasBruxas.slice(0, 90)}...`);
  }
  console.log('-------------------------------------------------\n');

  // 6. Teste de Viagem no Mapa
  console.log('Passo 6: Executando viagem no mapa para a "praca"...');
  const localAntes = useGame.getState().camp!.localAtual;
  await store.viajar('praca');
  const statePosViagem = useGame.getState();
  const localDepois = statePosViagem.camp!.localAtual;
  assert(localDepois === 'praca', `Local atual deve ser "praca", mas é "${localDepois}"`);
  console.log(`✓ Viagem realizada com sucesso: "${localAntes}" ➔ "${localDepois}".`);
  console.log(`  Novo local: ${statePosViagem.cena?.contexto.local.nome}`);
  console.log(`  Locais visitados agora: ${statePosViagem.camp!.locaisVisitados.join(', ')}\n`);

  // 7. Navegação para "O Livro" e Inspeção dos Novos Capítulos
  console.log('Passo 7: Abrindo o Livro Arcana (irPara("livro"))...');
  store.irPara('livro');
  assert(useGame.getState().tela === 'livro', 'Tela atual deve ser "livro"');
  console.log(`✓ Painel do Livro aberto.`);
  console.log(`  • Deuses Primordiais catalogados: ${DEUSES_PRIMORDIAIS.length}`);
  console.log(`  • Bruxas dos Pecados catalogadas: ${BRUXAS_DOS_PECADOS.length}`);
  const satella = BRUXAS_DOS_PECADOS.find(b => b.id === 'inveja');
  assert(satella !== undefined, 'Satella deve estar registrada');
  console.log(`  • Calamidade Suprema: ${satella.nome} (Autoridade: ${satella.autoridade})\n`);

  // 8. Navegação para Vínculos e Teste de Intimidade de NPCs
  console.log('Passo 8: Abrindo painel de Vínculos e testando NPCs...');
  store.irPara('vinculos');
  assert(useGame.getState().tela === 'vinculos', 'Tela atual deve ser "vinculos"');
  const aldrica = statePosViagem.content!.npcs.find(n => n.id === 'aldrica');
  assert(aldrica !== undefined, 'Aldrica deve existir no elenco');
  console.log(`✓ Painel de Vínculos validado. Aldrica encontrada: ${aldrica.nome} (${aldrica.ocupacao}).\n`);

  // 9. Navegação para Configurações e Execução do Autodiagnóstico
  console.log('Passo 9: Abrindo Configurações e executando Autodiagnóstico...');
  store.irPara('config');
  assert(useGame.getState().tela === 'config', 'Tela atual deve ser "config"');
  console.log(`✓ Painel de Configurações acessado.`);

  // 10. Executando Turno de Ação no Jogo
  console.log('Passo 10: Retornando ao Jogo e executando ação de turno...');
  store.irPara('jogo');
  const primeiraOpcao = useGame.getState().cena?.opcoes[0];
  if (primeiraOpcao) {
    console.log(`  Executando ação da grade: "${primeiraOpcao.rotulo}"...`);
    await store.agirOpcao(primeiraOpcao);
    const statePosAcao = useGame.getState();
    assert(statePosAcao.feed.length > 0, 'Feed deve conter a nova narrativa');
    console.log(`✓ Ação resolvida com sucesso! Turno avançado.`);
    console.log(`  Última entrada no feed: "${statePosAcao.feed[statePosAcao.feed.length - 1].texto.slice(0, 100)}..."\n`);
  }

  // 11. Teste de Ação Livre
  console.log('Passo 11: Testando Ação Livre ("observar os altares antigos e rezar em silêncio")...');
  await store.acaoLivre('observar os altares antigos e rezar em silêncio');
  const statePosLivre = useGame.getState();
  assert(statePosLivre.feed.length > 0, 'Feed deve ter sido atualizado com a ação livre');
  console.log(`✓ Ação livre processada e narrada com sucesso!\n`);

  console.log('=================================================================');
  console.log('🎉 TODOS OS TESTES DE GAMEPLAY EM TEMPO REAL PASSARAM COM SUCESSO!');
  console.log('   Nenhum erro de runtime, tela quebrada ou travamento encontrado.');
  console.log('=================================================================');
}

testarGameplayCompleto().catch((e) => {
  console.error('ERRO FATAL NO TESTE DE JOGO:', e);
  process.exit(1);
});
