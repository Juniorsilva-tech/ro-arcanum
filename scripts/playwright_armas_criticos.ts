import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/Junior/.gemini/antigravity/brain/3b41a1a3-72d5-45d7-8a56-2ae823bc65fb';

async function main() {
  console.log('======================================================================');
  console.log('🎭 AUDITORIA VISUAL: ATRIBUTOS ESCALADOS, CRÍTICOS E PASSIVAS LENDÁRIAS');
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

  // 1. Hinokami Primordial (Chamas Solares + Escalonamento de Físico 18 + Crítico com Destaque Dourado)
  console.log('\n2. Inicializando campanha com Torvald...');
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
    store.setNome('Torvald de Vaelhorn');
    await store.iniciarCampanha();
    if (store?.pularInfancia) await store.pularInfancia();
  });

  await page.waitForTimeout(1500);

  console.log('3. Equipando Hinokami Primordial (Físico 18) e abrindo combate contra Salteador...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    const camp = store.camp;
    camp.personagem.atributos.fisico = 18;
    camp.personagem.inventario['lamina_da_origem_solar'] = 1;
    camp.personagem.equipado.arma = 'lamina_da_origem_solar';
    // @ts-ignore
    window.__ABRIR_COMBATE__(['salteador']);
  });

  await page.waitForTimeout(1500);

  console.log('4. Desferindo ataque com Hinokami Primordial...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    const cbt = store.camp?.combate;
    const alvo = cbt?.atores?.find((a: any) => !a.ehJogador);
    if (alvo) {
      await store.combAtacar(alvo.id);
    }
  });

  await page.waitForTimeout(1500);

  const foto1 = `${ARTIFACT_DIR}/foto_combate_hinokami_chamas.png`;
  await page.screenshot({ path: foto1, fullPage: true });
  console.log(`✓ Foto 1 salva (Hinokami Primordial - Chamas Solares & Dano Elevado): ${foto1}`);

  // 2. Machado Quebra-Rocha de Corveira (Rachar Armadura & Impacto Maciço)
  console.log('\n5. Equipando Quebra-Rocha de Corveira e atacando com Rachar Armadura...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    const camp = store.camp;
    camp.personagem.inventario['machado_corveira'] = 1;
    camp.personagem.equipado.arma = 'machado_corveira';
    camp.combate = undefined;
    // @ts-ignore
    window.__ABRIR_COMBATE__(['salteador', 'lobo']);
    const cbt = store.camp?.combate;
    const alvo = cbt?.atores?.find((a: any) => !a.ehJogador);
    if (alvo) {
      await store.combAtacar(alvo.id);
    }
  });

  await page.waitForTimeout(1500);

  const foto2 = `${ARTIFACT_DIR}/foto_combate_quebra_rocha.png`;
  await page.screenshot({ path: foto2, fullPage: true });
  console.log(`✓ Foto 2 salva (Quebra-Rocha de Corveira - Rachar Armadura): ${foto2}`);

  // 3. Bastião de Pedra de Halvet (Contra-Ataque de Rocha ao Defender)
  console.log('\n6. Equipando Bastião de Halvet e acionando Defesa...');
  await page.evaluate(async () => {
    // @ts-ignore
    const store = window.__GAME_STORE__?.getState();
    const camp = store.camp;
    camp.personagem.inventario['espada_ancestral_halvet'] = 1;
    camp.personagem.equipado.arma = 'espada_ancestral_halvet';
    camp.combate = undefined;
    // @ts-ignore
    window.__ABRIR_COMBATE__(['lobo']);
    await store.combDefender();
  });

  await page.waitForTimeout(1500);

  const foto3 = `${ARTIFACT_DIR}/foto_combate_bastiao_halvet.png`;
  await page.screenshot({ path: foto3, fullPage: true });
  console.log(`✓ Foto 3 salva (Bastião de Halvet - Contra-Ataque de Rocha): ${foto3}`);

  await browser.close();
  console.log('\n=== TODAS AS FOTOS FORAM CAPTURADAS COM SUCESSO! ===');
}

main().catch((err) => {
  console.error('Erro na auditoria visual:', err);
  process.exit(1);
});
