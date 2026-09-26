// @ts-check
const { getDefaultConfig } = require('expo/metro-config');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

function getHermesCommand() {
  const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local';
  const hermesCmd = path.join(localAppData, 'hermes', 'bin', 'hermes.cmd');
  const hermesExe = path.join(localAppData, 'hermes', 'bin', 'hermes.exe');
  if (fs.existsSync(hermesCmd)) return `"${hermesCmd}"`;
  if (fs.existsSync(hermesExe)) return `"${hermesExe}"`;
  return 'hermes';
}

function getHermesTokenInfo(forceRefresh = false) {
  const authPath = path.join(
    process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local',
    'hermes',
    'auth.json'
  );

  if (forceRefresh) {
    try {
      const hermesBin = getHermesCommand();
      execSync(`${hermesBin} auth refresh nous`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 15000,
      });
    } catch (err) {
      console.warn('[Metro Hermes] Falha ao renovar via hermes cli:', err?.message || err);
    }
  }

  if (fs.existsSync(authPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
      const nous =
        data?.providers?.nous ||
        data?.credential_pool?.nous?.[0];
      const token = nous?.access_token;
      const expiresAt = nous?.expires_at || null;
      const expiresIn = nous?.expires_in || 3600;

      if (token) {
        const envLocalPath = path.join(__dirname, '.env.local');
        try {
          fs.writeFileSync(envLocalPath, `EXPO_PUBLIC_NOUS_API_KEY=${token}\n`, 'utf-8');
        } catch {}

        return {
          ok: true,
          apiKey: token,
          expiresAt,
          expiresIn,
        };
      }
    } catch (err) {
      console.warn('[Metro Hermes] Erro ao ler auth.json:', err?.message || err);
    }
  }

  return { ok: false, error: 'Token não encontrado no auth.json' };
}

const originalEnhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (metroMiddleware, server) => {
  const customMiddleware = (req, res, next) => {
    const rawUrl = req.url || '';
    const cleanUrl = rawUrl.split('?')[0];

    if (cleanUrl.startsWith('/api/hermes/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (cleanUrl === '/api/hermes/token') {
        const info = getHermesTokenInfo(false);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info));
        return;
      }

      if (cleanUrl === '/api/hermes/refresh') {
        const info = getHermesTokenInfo(true);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info));
        return;
      }
    }

    return metroMiddleware(req, res, next);
  };

  return originalEnhanceMiddleware
    ? originalEnhanceMiddleware(customMiddleware, server)
    : customMiddleware;
};

module.exports = config;
