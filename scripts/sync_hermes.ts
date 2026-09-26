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
  const hermesBin = getHermesCommand();
  try {
    console.log('Tentando renovar token via hermes auth refresh nous...');
    execSync(`${hermesBin} auth refresh nous`, { stdio: 'pipe' });
    console.log('✓ Token renovado com sucesso via Hermes CLI.');
  } catch (err) {
    console.log('Hermes CLI refresh pulado ou indisponível:', String(err).slice(0, 100));
  }

  const authPath = path.join(
    process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local',
    'hermes',
    'auth.json',
  );

  if (!fs.existsSync(authPath)) {
    console.log('Arquivo auth.json não encontrado em:', authPath);
    return;
  }

  try {
    const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    const token =
      authData?.providers?.nous?.access_token ||
      authData?.credential_pool?.nous?.[0]?.access_token;
    const expiresAt =
      authData?.providers?.nous?.expires_at ||
      authData?.credential_pool?.nous?.[0]?.expires_at;

    if (!token) {
      console.log('Nenhum access_token da Nous encontrado em auth.json.');
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
  } catch (e) {
    console.error('Erro ao ler auth.json:', e);
  }
}

syncHermes();
