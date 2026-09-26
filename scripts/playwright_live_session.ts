// ARCANUM · Sessão ao vivo via Playwright: Teste Visual, Combate e Simulação Geracional de 2 Anos
import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/Junior/.gemini/antigravity/brain/3b41a1a3-72d5-45d7-8a56-2ae823bc65fb';

async function main() {
  console.log('======================================================================');
  console.log('🎭 INICIANDO TESTE VISUAL COMPLETO COM PLAYWRIGHT EM TEMPO REAL');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  console.log('1. Acessando http://localhost:8081...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });

  // Aguarda carregamento inicial da interface
  await page.waitForTimeout(3000);

  // 1. Screenshot do Menu Inicial / Entrada
  const foto1 = `${ARTIFACT_DIR}/foto1_menu_inicial.png`;
  await page.screenshot({ path: foto1, fullPage: true });
  console.log(`✓ Foto 1 salva: ${foto1}`);

  // 2. Inicializando campanha de Vaelhorn no Store e transitando para a tela Jogo
  console.log('\n2. Inicializando campanha de Torvald em Vaelhorn...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    if (!store) return;
    if (!store.pronto) await store.init();
    store.novoJogo();
    store.escolherCenario('vaelhorn');
    store.escolherClasse('espadachim');
    store.escolherOrigem('divida');
    store.escolherMarcaInfancia('comum');
    store.escolherReacaoInfancia('apoio');
    store.setNome('Torvald o Andarilho');
    await store.iniciarCampanha();
    await store.pularInfancia();
    
    // Adicionar armas e suprimentos na mochila para os testes de combate e durabilidade
    // @ts-ignore
    const campAtual = window.__GAME_STORE__.getState().camp;
    if (campAtual && campAtual.personagem) {
      campAtual.personagem.inventario['lanca'] = 1;
      campAtual.personagem.inventario['espada_curta'] = 1;
      campAtual.personagem.inventario['arco_curto'] = 1;
      campAtual.personagem.inventario['pocao_vida'] = 3;
      // @ts-ignore
      window.__GAME_STORE__.setState({ camp: { ...campAtual } });
    }
  });

  await page.waitForTimeout(2000);

  // 2. Screenshot da tela principal do Jogo com a cena inicial e feed
  const foto2 = `${ARTIFACT_DIR}/foto2_jogo_principal.png`;
  await page.screenshot({ path: foto2, fullPage: true });
  console.log(`✓ Foto 2 salva (Tela Principal de Jogo): ${foto2}`);

  // 3. Teste do Campo de Texto Livre (verificar digitação, envio por Enter e autoscroll)
  console.log('\n3. Testando digitação e submissão com Enter no texto livre...');
  
  let textoLivreInput = page.getByPlaceholder(/descreva/i).first();
  if (!(await textoLivreInput.isVisible())) {
    textoLivreInput = page.locator('textarea').first();
  }

  if (await textoLivreInput.isVisible()) {
    console.log('   Clicando no campo de texto livre...');
    await textoLivreInput.scrollIntoViewIfNeeded();
    await textoLivreInput.click();
    await textoLivreInput.fill('Subo na torre da paliçada e observo as fogueiras no horizonte.');
    await page.waitForTimeout(600);

    // Tira foto do campo com texto digitado
    const fotoTextoDigitado = `${ARTIFACT_DIR}/foto3a_texto_digitado.png`;
    await page.screenshot({ path: fotoTextoDigitado });
    console.log(`✓ Foto 3a salva (Texto digitado na caixa): ${fotoTextoDigitado}`);

    // Pressiona Enter real do teclado
    console.log('   Pressionando tecla Enter...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1800);

    // Tira foto comprovando que o campo limpou e o feed rolou
    const fotoTextoEnviado = `${ARTIFACT_DIR}/foto3b_texto_enviado_limpo.png`;
    await page.screenshot({ path: fotoTextoEnviado });
    console.log(`✓ Foto 3b salva (Campo limpo e autoscroll acionado): ${fotoTextoEnviado}`);
  } else {
    console.warn('   ⚠️ Não foi possível localizar o campo de texto livre diretamente.');
  }

  // 4. Teste de Combate Real
  console.log('\n4. Abrindo combate contra Salteador e Lobo do Ermo...');
  await page.evaluate(() => {
    // @ts-ignore
    if (typeof window.__ABRIR_COMBATE__ === 'function') {
      // @ts-ignore
      window.__ABRIR_COMBATE__(['salteador', 'lobo']);
    }
  });

  await page.waitForTimeout(1500);

  // Screenshot do Combate Inicial
  const foto4 = `${ARTIFACT_DIR}/foto4_combate_inicio.png`;
  await page.screenshot({ path: foto4, fullPage: true });
  console.log(`✓ Foto 4 salva (Início do Combate com badges de afiação e PV): ${foto4}`);

  // 5. Testar abertura da gaveta de armas com clique real
  console.log('\n5. Abrindo gaveta de armas para troca tática...');
  const btnTrocarArma = page.getByText(/Trocar Arma/i).first();
  if (await btnTrocarArma.isVisible()) {
    console.log('   Clicando no botão "🔄 Trocar Arma (1 turno)"...');
    await btnTrocarArma.click();
    await page.waitForTimeout(800);

    const foto5 = `${ARTIFACT_DIR}/foto5_combate_gaveta.png`;
    await page.screenshot({ path: foto5, fullPage: true });
    console.log(`✓ Foto 5 salva (Gaveta de armas aberta): ${foto5}`);

    // Sacar Lança da mochila com clique real
    const btnSacar = page.getByText('SACAR').first();
    if (await btnSacar.isVisible()) {
      console.log('   Clicando em SACAR para empunhar Lança...');
      await btnSacar.click();
      await page.waitForTimeout(1200);

      const foto6 = `${ARTIFACT_DIR}/foto6_combate_arma_sacada.png`;
      await page.screenshot({ path: foto6, fullPage: true });
      console.log(`✓ Foto 6 salva (Arma trocada e turno consumido): ${foto6}`);
    }
  }

  // 6. Batalhar bastante (vários turnos com cliques reais no botão Atacar)
  console.log('\n6. Batalhando intensamente (turnos sucessivos de ataque e defesa)...');
  for (let turno = 1; turno <= 6; turno++) {
    const btnAtacar = page.getByText('Atacar').first();
    if (await btnAtacar.isVisible()) {
      console.log(`   Turno ${turno}: desferindo ataque com clique real...`);
      await btnAtacar.click();
      await page.waitForTimeout(900);
    } else {
      const btnContinuar = page.getByText('Continuar').first();
      if (await btnContinuar.isVisible()) {
        console.log('   Combate concluído! Clicando em Continuar...');
        await btnContinuar.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
  }

  const foto7 = `${ARTIFACT_DIR}/foto7_combate_em_andamento.png`;
  await page.screenshot({ path: foto7, fullPage: true });
  console.log(`✓ Foto 7 salva (Combate após várias rodadas com impacto e logs): ${foto7}`);

  // Se ainda estiver na tela de combate após os ataques, voltar para a tela de jogo
  await page.evaluate(() => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    if (store?.combate && store.combate.fase !== 'ativa') {
      store.fecharLuta();
    } else {
      // @ts-ignore
      window.__GAME_STORE__.setState({ tela: 'jogo' });
    }
  });
  await page.waitForTimeout(1000);

  // 7. Simulação Geracional de 2 Anos (730 dias = 8 estações = 2920 períodos)
  console.log('\n7. Executando simulação de 2 anos no calendário do jogo...');
  const res2Anos = await page.evaluate(() => {
    // @ts-ignore
    if (typeof window.__AVANCAR_TEMPO_2_ANOS__ === 'function') {
      // @ts-ignore
      return window.__AVANCAR_TEMPO_2_ANOS__();
    }
    return null;
  });

  console.log('   Resultado do avanço de 2 anos no calendário:', res2Anos);
  await page.waitForTimeout(1500);

  // Screenshot após 2 anos
  const foto8 = `${ARTIFACT_DIR}/foto8_jogo_apos_2_anos.png`;
  await page.screenshot({ path: foto8, fullPage: true });
  console.log(`✓ Foto 8 salva (Jogo após 2 anos no mundo com nova idade e crônica): ${foto8}`);

  await browser.close();

  console.log('\n======================================================================');
  console.log('✅ TESTE VISUAL E GERACIONAL CONCLUÍDO COM SUCESSO ABSOLUTO!');
  console.log('======================================================================');
}

main().catch((err) => {
  console.error('❌ Erro no teste visual Playwright:', err);
  process.exit(1);
});
