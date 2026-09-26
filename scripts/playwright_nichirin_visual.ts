import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/Junior/.gemini/antigravity/brain/3b41a1a3-72d5-45d7-8a56-2ae823bc65fb';

async function main() {
  console.log('======================================================================');
  console.log('🎭 AUDITORIA VISUAL: SISTEMA DE DESPERTAR DE LÂMINAS NICHIRIN');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  console.log('1. Acessando http://localhost:8082...');
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => typeof (window as any).__GAME_STORE__ !== 'undefined', { timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('\n2. Inicializando campanha de Caçador com Respiração da Água...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    if (!store) return;
    store.novoJogo();
    store.escolherCenario('vaelhorn');
    store.escolherClasse('cacadora');
    store.escolherOrigem('divida');
    store.escolherMarcaInfancia('comum');
    store.escolherReacaoInfancia('apoio');
    store.setNome('Tanjiro Kamado');
    await store.iniciarCampanha();
    if (store?.pularInfancia) await store.pularInfancia();
  });

  await page.waitForTimeout(1500);

  console.log('3. Concedendo Respiração da Água e equipando Lâmina Nichirin para despertar...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    const camp = store.camp;
    camp.personagem.artesConhecidas = ['respiracao_agua_primeira_forma'];
    camp.personagem.inventario['lamina_nichirin'] = 1;
    // @ts-ignore
    await store.equiparItem('lamina_nichirin');
    // Abre tela de inventário para exibir a lâmina sintonizada
    // @ts-ignore
    window.__GAME_STORE__.setState({ tela: 'inventario' });
  });

  await page.waitForTimeout(1500);

  console.log('4. Capturando foto do Inventário com a Nichirin Azul Oceânica sintonizada...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}/foto_nichirin_inventario.png`,
    fullPage: true,
  });
  console.log(`✓ Foto salva: ${ARTIFACT_DIR}/foto_nichirin_inventario.png`);

  console.log('\n5. Abrindo combate contra Oni para verificar HUD e ativação da Nichirin...');
  await page.evaluate(async () => {
    // @ts-ignore
    window.__GAME_STORE__.setState({ tela: 'jogo' });
    // @ts-ignore
    window.__ABRIR_COMBATE__(['oni_faminto']);
  });

  await page.waitForTimeout(1500);

  console.log('6. Desferindo ataque com a Nichirin...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    store.combAtacar('oni_faminto');
  });

  await page.waitForTimeout(1500);

  console.log('7. Capturando foto do Combate com a Nichirin...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}/foto_nichirin_combate.png`,
    fullPage: true,
  });
  console.log(`✓ Foto salva: ${ARTIFACT_DIR}/foto_nichirin_combate.png`);

  await browser.close();
  console.log('\n=== AUDITORIA VISUAL DE NICHIRIN CONCLUÍDA COM SUCESSO! ===');
}

main().catch(err => {
  console.error('Erro na auditoria visual:', err);
  process.exit(1);
});
