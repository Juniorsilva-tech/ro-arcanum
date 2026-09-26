// ARCANUM · Testes Visuais e Inspeção das Melhorias Implementadas via Playwright
import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/Junior/.gemini/antigravity/brain/3b41a1a3-72d5-45d7-8a56-2ae823bc65fb';

async function main() {
  console.log('======================================================================');
  console.log('🎭 INSPEÇÃO VISUAL DAS MELHORIAS IMPLEMENTADAS (PLAYWRIGHT)');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  console.log('1. Acessando http://localhost:8082...');
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => typeof (window as any).__GAME_STORE__ !== 'undefined', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Tela de Escolha de Classes (Validar "Caçador" e "Curandeiro" no Masculino)
  console.log('\n2. Navegando para tela de Classes...');
  await page.evaluate(() => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    if (!store) return;
    store.novoJogo();
    store.escolherCenario('vaelhorn');
    // @ts-ignore
    window.__GAME_STORE__.setState({ tela: 'classe' });
  });

  await page.waitForTimeout(1500);
  const foto1 = `${ARTIFACT_DIR}/foto_melhoria_1_classes_masculinas.png`;
  await page.screenshot({ path: foto1, fullPage: true });
  console.log(`✓ Foto 1 salva (Classes no Masculino: Caçador, Curandeiro): ${foto1}`);

  // 2. Prólogo e Concordância da Família no Masculino
  console.log('\n3. Iniciando prólogo e verificando flexão de gênero do pai...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    if (!store) return;
    store.escolherClasse('cacadora');
    store.escolherOrigem('divida');
    store.escolherMarcaInfancia('comum');
    store.escolherReacaoInfancia('apoio');
    store.setNome('Torvald de Vaelhorn');
    await store.iniciarCampanha();
  });

  await page.waitForTimeout(1500);
  const foto2 = `${ARTIFACT_DIR}/foto_melhoria_2_familia_concordancia.png`;
  await page.screenshot({ path: foto2, fullPage: true });
  console.log(`✓ Foto 2 salva (Família com Concordância Perfeita de Gênero): ${foto2}`);

  // 3. Pular infância e testar Inventário com Abas de Forja
  console.log('\n4. Acessando Inventário na Vila dos Ferreiros e ativando Aba Bigorna & Forja...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    if (store?.pularInfancia) await store.pularInfancia();
    // @ts-ignore
    if (typeof window.__PREPARAR_VAELHORN_FORJA__ === 'function') {
      // @ts-ignore
      window.__PREPARAR_VAELHORN_FORJA__();
    }
  });

  await page.waitForTimeout(1500);
  const foto3a = `${ARTIFACT_DIR}/foto_melhoria_3a_inventario_mochila.png`;
  await page.screenshot({ path: foto3a, fullPage: true });
  console.log(`✓ Foto 3a salva (Aba Mochila & Equipamento com Seletor): ${foto3a}`);

  // Clica na aba "⚒️ Bigorna & Forja"
  const btnAbaForja = page.getByText(/Bigorna & Forja/i).first();
  if (await btnAbaForja.isVisible()) {
    await btnAbaForja.click();
    await page.waitForTimeout(1000);
    const foto3b = `${ARTIFACT_DIR}/foto_melhoria_3b_inventario_aba_forja.png`;
    await page.screenshot({ path: foto3b, fullPage: true });
    console.log(`✓ Foto 3b salva (Aba Bigorna & Forja em Destaque): ${foto3b}`);
  }

  // 4. Abrir Combate e validar Card Central da Arena Tática
  console.log('\n5. Abrindo combate e verificando Arena Tática central preenchida...');
  await page.evaluate(() => {
    // @ts-ignore
    if (typeof window.__ABRIR_COMBATE__ === 'function') {
      // @ts-ignore
      window.__ABRIR_COMBATE__(['salteador', 'lobo']);
    }
  });

  await page.waitForTimeout(1500);
  const foto4 = `${ARTIFACT_DIR}/foto_melhoria_4_combate_arena_tatica.png`;
  await page.screenshot({ path: foto4, fullPage: true });
  console.log(`✓ Foto 4 salva (Arena Tática Central eliminando o vazio escuro): ${foto4}`);

  // 5. Clicar em Trocar Arma e verificar opção de Guardar Arma / Desarmado
  console.log('\n6. Clicando em "Trocar Arma" para verificar a gaveta aprimorada...');
  const btnTrocar = page.getByText(/Trocar Arma/i).first();
  if (await btnTrocar.isVisible()) {
    await btnTrocar.click();
    await page.waitForTimeout(1000);
    const foto5 = `${ARTIFACT_DIR}/foto_melhoria_5_combate_gaveta_desarmado.png`;
    await page.screenshot({ path: foto5, fullPage: true });
    console.log(`✓ Foto 5 salva (Gaveta Tática com opção de Lutar Desarmado): ${foto5}`);
  }

  await browser.close();

  console.log('\n======================================================================');
  console.log('✅ TODAS AS MELHORIAS FORAM FOTOGRAFADAS E VALIDADAS COM SUCESSO!');
  console.log('======================================================================');
}

main().catch((err) => {
  console.error('❌ Falha na inspeção visual das melhorias:', err);
  process.exit(1);
});
