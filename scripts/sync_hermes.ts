declare const require: any;
declare const process: any;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getHermesCommand(): string {
  const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local';
  const hermesCmd = path.join(localAppData, 'hermes', 'bin', 'hermes.cmd');
  const hermesExe = path.join(localAppData, 'hermes', 'bin', 'hermes.exe');
  if (fs.existsSync(hermesCmd)) return `"${hermesCmd}"`;
  if (fs.existsSync(hermesExe)) return `"${hermesExe}"`;
  return 'hermes';
}

function syncHermes() {
  console.log('--- Sincronizando credenciais do Hermes (Nous Research) ---');
  const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local';
  const sharedPath = path.join(localAppData, 'hermes', 'shared', 'nous_auth.json');
  const authPath = path.join(localAppData, 'hermes', 'auth.json');

  // 1. Espelha shared/nous_auth.json em auth.json se necessário (necessário para o CLI hermes auth refresh nous)
  if (fs.existsSync(sharedPath)) {
    try {
      const sharedData = JSON.parse(fs.readFileSync(sharedPath, 'utf8'));
      if (fs.existsSync(authPath)) {
        const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
        if (!authData.providers) authData.providers = {};
        if (!authData.providers.nous || !authData.providers.nous.access_token) {
          authData.providers.nous = sharedData;
          fs.writeFileSync(authPath, JSON.stringify(authData, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.warn('Aviso ao sincronizar shared/nous_auth.json com auth.json:', e);
    }
  }

  // 2. Tenta renovar via CLI
  const hermesBin = getHermesCommand();
  try {
    console.log('Tentando renovar token via hermes auth refresh nous...');
    execSync(`${hermesBin} auth refresh nous`, { stdio: 'pipe' });
    console.log('✓ Token renovado com sucesso via Hermes CLI.');
  } catch (err) {
    console.log('Hermes CLI refresh pulado ou indisponível:', String(err).slice(0, 100));
  }

  // 3. Lê token do shared store ou do auth.json
  let token: string | null = null;
  let expiresAt: string | null = null;

  if (fs.existsSync(sharedPath)) {
    try {
      const sharedData = JSON.parse(fs.readFileSync(sharedPath, 'utf8'));
      if (sharedData?.access_token) {
        token = sharedData.access_token;
        expiresAt = sharedData.expires_at || null;
      }
    } catch {}
  }

  if (!token && fs.existsSync(authPath)) {
    try {
      const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      const nous =
        authData?.providers?.nous ||
        authData?.credential_pool?.nous?.[0];
      if (nous?.access_token) {
        token = nous.access_token;
        expiresAt = nous.expires_at || null;
      }
    } catch {}
  }

  if (!token) {
    console.log('Nenhum access_token da Nous encontrado em shared/nous_auth.json ou auth.json.');
    console.log('Dica: execute "hermes auth add nous" no terminal para reconectar sua conta da Nous.');
    process.exitCode = 1;
    return;
  }

  const envContent = `# Gerado automaticamente por scripts/sync_hermes.ts\nEXPO_PUBLIC_NOUS_API_KEY=${token}\n`;
  const envPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log(`✓ Token da Nous Research sincronizado em .env.local`);
  if (expiresAt) {
    console.log(`  Válido até: ${expiresAt}`);
  }
}

syncHermes();
