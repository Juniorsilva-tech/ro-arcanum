// ARCANUM · Testes Visuais e Auditoria Completa de Vaelhorn via Playwright
import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/Junior/.gemini/antigravity/brain/3b41a1a3-72d5-45d7-8a56-2ae823bc65fb';

async function main() {
  console.log('======================================================================');
  console.log('🎭 AUDITORIA VISUAL COMPLETA VIA PLAYWRIGHT — CENÁRIO VAELHORN');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  console.log('1. Acessando http://localhost:8082...');
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => typeof (window as any).__GAME_STORE__ !== 'undefined', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Tela de Prólogo de Infância & Família
  console.log('\n2. Inicializando campanha em Vaelhorn e exibindo Prólogo Familiar...');
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
    store.setNome('Torvald de Vaelhorn');
    await store.iniciarCampanha();
  });

  await page.waitForTimeout(2000);
  const foto1 = `${ARTIFACT_DIR}/foto_vaelhorn_1_criacao_familia.png`;
  await page.screenshot({ path: foto1, fullPage: true });
  console.log(`✓ Foto 1 salva (Árvore Genealógica e Infância em Vaelhorn): ${foto1}`);

  // 2. Concluir infância e ir para Tela Principal de Jogo
  console.log('\n3. Concluindo prólogo e acessando a taverna A Rês Enforcada...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    if (store && typeof store.pularInfancia === 'function') {
      await store.pularInfancia();
    }
  });

  await page.waitForTimeout(2000);
  const foto2 = `${ARTIFACT_DIR}/foto_vaelhorn_2_jogo_abertura.png`;
  await page.screenshot({ path: foto2, fullPage: true });
  console.log(`✓ Foto 2 salva (Abertura de Jogo na Taverna de Vaelhorn): ${foto2}`);

  // 3. Forjar arma e inspecionar Inventário
  console.log('\n4. Adicionando itens e inspecionando tela de Inventário e Forja...');
  await page.evaluate(() => {
    // @ts-ignore
    if (typeof window.__PREPARAR_VAELHORN_FORJA__ === 'function') {
      // @ts-ignore
      window.__PREPARAR_VAELHORN_FORJA__();
    }
  });

  await page.waitForTimeout(1500);
  const foto3 = `${ARTIFACT_DIR}/foto_vaelhorn_3_inventario_forja.png`;
  await page.screenshot({ path: foto3, fullPage: true });
  console.log(`✓ Foto 3 salva (Inventário com Materiais de Forja): ${foto3}`);

  // 4. Abrir Combate contra Criaturas de Vaelhorn
  console.log('\n5. Abrindo combate contra Salteador e Lobo da Mata...');
  await page.evaluate(() => {
    // @ts-ignore
    if (typeof window.__ABRIR_COMBATE__ === 'function') {
      // @ts-ignore
      window.__ABRIR_COMBATE__(['salteador', 'lobo']);
    }
  });

  await page.waitForTimeout(1500);
  const foto4 = `${ARTIFACT_DIR}/foto_vaelhorn_4_combate_salteadores.png`;
  await page.screenshot({ path: foto4, fullPage: true });
  console.log(`✓ Foto 4 salva (Arena de Combate de Vaelhorn): ${foto4}`);

  // 5. Clicar em "Trocar Arma" para abrir gaveta tática
  console.log('\n6. Clicando em "🔄 Trocar Arma (1 turno)" com clique real...');
  const btnTrocarArma = page.getByText(/Trocar Arma/i).first();
  if (await btnTrocarArma.isVisible()) {
    await btnTrocarArma.click();
    await page.waitForTimeout(800);
    const foto5 = `${ARTIFACT_DIR}/foto_vaelhorn_5_gaveta_troca_armas.png`;
    await page.screenshot({ path: foto5, fullPage: true });
    console.log(`✓ Foto 5 salva (Gaveta Tática de Armas aberta no combate): ${foto5}`);

    // Sacar Lança
    const btnSacar = page.getByText('SACAR').first();
    if (await btnSacar.isVisible()) {
      await btnSacar.click();
      await page.waitForTimeout(1000);
    }
  }

  // 6. Fundar e Inspecionar Assentamento / Colônia em Vaelhorn
  console.log('\n7. Navegando para a Tela de Assentamento e Feudo ("Baluarte de Torvald")...');
  await page.evaluate(() => {
    // @ts-ignore
    if (typeof window.__FUNDAR_COLONIA__ === 'function') {
      // @ts-ignore
      window.__FUNDAR_COLONIA__('Baluarte de Torvald');
    }
  });

  await page.waitForTimeout(1800);
  const foto6 = `${ARTIFACT_DIR}/foto_vaelhorn_6_assentamento_feudo.png`;
  await page.screenshot({ path: foto6, fullPage: true });
  console.log(`✓ Foto 6 salva (Tela de Assentamento / Feudo em Vaelhorn): ${foto6}`);

  // 7. Simulação Geracional de 10 Anos no Calendário e retorno à Tela de Jogo
  console.log('\n8. Executando simulação de 10 anos (3.650 dias) em Vaelhorn...');
  const res10Anos = await page.evaluate(() => {
    // @ts-ignore
    if (typeof window.__AVANCAR_TEMPO_10_ANOS__ === 'function') {
      // @ts-ignore
      return window.__AVANCAR_TEMPO_10_ANOS__();
    }
    return null;
  });

  console.log('   Resultado dos 10 anos:', res10Anos);
  await page.waitForTimeout(2000);

  const foto7 = `${ARTIFACT_DIR}/foto_vaelhorn_7_jogo_apos_10_anos.png`;
  await page.screenshot({ path: foto7, fullPage: true });
  console.log(`✓ Foto 7 salva (Tela de Jogo de Vaelhorn após 10 Anos de Vida): ${foto7}`);

  await browser.close();

  console.log('\n======================================================================');
  console.log('✅ AUDITORIA VISUAL DE VAELHORN VIA PLAYWRIGHT FINALIZADA COM SUCESSO!');
  console.log('======================================================================');
}

main().catch((err) => {
  console.error('❌ Falha no teste Playwright de Vaelhorn:', err);
  process.exit(1);
});
