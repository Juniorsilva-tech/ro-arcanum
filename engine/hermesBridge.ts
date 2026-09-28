// ARCANUM · Ponte de autenticação dinâmica para Nous Research (Hermes)
// Permite que o jogo atualize o token OAuth em segundo plano de forma 100% imperceptível,
// sem travar a partida ou exigir que o jogador copie e cole novas chaves.

export interface InfoTokenHermes {
  ok: boolean;
  apiKey?: string;
  expiresAt?: string | null;
  expiresIn?: number;
  erro?: string;
}

let tokenAtual: string | null = null;
let expiresAtAtual: string | null = null;
let refreshEmAndamento: Promise<string | null> | null = null;
let monitorIniciado = false;

// Inicialização síncrona se a variável de ambiente estiver definida
if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_NOUS_API_KEY) {
  tokenAtual = process.env.EXPO_PUBLIC_NOUS_API_KEY.trim();
}

function decodificarBase64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  if (typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function') {
    return globalThis.atob(b64);
  }
  const buf = (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => { toString: (enc: string) => string } } }).Buffer;
  if (buf) {
    return buf.from(b64, 'base64').toString('utf-8');
  }
  return '';
}

/**
 * Verifica se um JWT OAuth da Nous está expirado ou prestes a expirar.
 * margemSegundos padrão é 300 (5 minutos de antecedência).
 */
export function jwtExpirado(jwt: string, margemSegundos = 300): boolean {
  if (!jwt || typeof jwt !== 'string') return true;
  try {
    const partes = jwt.trim().split('.');
    if (partes.length !== 3) return false;
    const jsonStr = decodificarBase64Url(partes[1]);
    if (!jsonStr) return false;
    const payload = JSON.parse(jsonStr) as { exp?: number };
    if (!payload.exp || typeof payload.exp !== 'number') return false;
    const agoraSec = Math.floor(Date.now() / 1000);
    return agoraSec >= (payload.exp - margemSegundos);
  } catch {
    return false;
  }
}

/**
 * Retorna o token da Nous Research ativo em memória ou nas variáveis de ambiente.
 */
export function obterTokenNousAtual(): string {
  if (tokenAtual && tokenAtual.trim()) {
    if (!jwtExpirado(tokenAtual, 60)) {
      return tokenAtual.trim();
    }
    // Token em memória expirou
    tokenAtual = null;
    expiresAtAtual = null;
  }

  // No Node.js, lê direto de shared/nous_auth.json, auth.json ou .env.local
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local';

      // 1. Prioridade: shared/nous_auth.json (onde o Hermes mantém a sessão OAuth)
      const sharedPath = path.join(localAppData, 'hermes', 'shared', 'nous_auth.json');
      if (fs.existsSync(sharedPath)) {
        const sharedJson = JSON.parse(fs.readFileSync(sharedPath, 'utf-8'));
        if (sharedJson?.access_token && !jwtExpirado(sharedJson.access_token, 60)) {
          definirTokenNous(sharedJson.access_token, sharedJson.expires_at || null);
          return sharedJson.access_token;
        }
      }

      // 2. auth.json do perfil
      const authPath = path.join(localAppData, 'hermes', 'auth.json');
      if (fs.existsSync(authPath)) {
        const authJson = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
        const nous = authJson?.providers?.nous || authJson?.credential_pool?.nous?.[0];
        if (nous?.access_token && !jwtExpirado(nous.access_token, 60)) {
          definirTokenNous(nous.access_token, nous.expires_at || null);
          return nous.access_token;
        }
      }

      // 3. .env.local do projeto
      const envLocal = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envLocal)) {
        const m = fs.readFileSync(envLocal, 'utf-8').match(/EXPO_PUBLIC_NOUS_API_KEY=(.+)/);
        const val = m?.[1]?.trim();
        if (val && !jwtExpirado(val, 60)) {
          definirTokenNous(val);
          return val;
        }
      }
    } catch {
      // Silencioso
    }
  }

  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_NOUS_API_KEY) {
    const envKey = process.env.EXPO_PUBLIC_NOUS_API_KEY.trim();
    if (envKey && !jwtExpirado(envKey, 60)) {
      tokenAtual = envKey;
      return envKey;
    }
  }

  return '';
}

/**
 * Atualiza o token em memória e sua data de expiração.
 */
export function definirTokenNous(token: string | null, expiresAt?: string | null): void {
  tokenAtual = token ? token.trim() : null;
  if (expiresAt !== undefined) {
    expiresAtAtual = expiresAt;
  }
}

/**
 * Retorna se o token atual está expirado ou próximo da expiração (< 5 minutos).
 */
export function tokenEstaPrestesAExpirar(): boolean {
  if (!tokenAtual) return true;
  if (jwtExpirado(tokenAtual, 300)) return true;
  if (!expiresAtAtual) return false;
  try {
    const expMs = new Date(expiresAtAtual).getTime();
    if (isNaN(expMs)) return false;
    const agoraMs = Date.now();
    // Menos de 5 minutos restantes
    return expMs - agoraMs < 5 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Renova o token de forma imperceptível.
 * Deduplica chamadas concorrentes para garantir que apenas uma requisição
 * de renovação aconteça por vez (evita corrida de refresh).
 */
export async function renovarTokenNous(forcar = true): Promise<string | null> {
  if (refreshEmAndamento) {
    return refreshEmAndamento;
  }

  refreshEmAndamento = (async () => {
    try {
      const endpoint = forcar ? '/api/hermes/refresh' : '/api/hermes/token';

      // 1. No navegador (React Native Web / DOM)
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const origin = window.location?.origin || 'http://localhost:8081';
        const urlsParaTentar = [
          `${origin}${endpoint}`,
          `http://localhost:8081${endpoint}`,
          `http://127.0.0.1:8081${endpoint}`,
        ];

        for (const url of urlsParaTentar) {
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 8000);
            try {
              const resp = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: ctrl.signal,
              });
              if (resp.ok) {
                const data = (await resp.json()) as InfoTokenHermes;
                if (data.ok && data.apiKey) {
                  definirTokenNous(data.apiKey, data.expiresAt);
                  return data.apiKey;
                }
              }
            } finally {
              clearTimeout(timer);
            }
          } catch {
            // Tenta próxima URL se houver falha de rede/porta
          }
        }
      }

      // 2. Fallback no Node.js (execução de scripts, testes de console)
      if (typeof process !== 'undefined' && process.versions?.node) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const childProcess = require('child_process');
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const fs = require('fs');
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const path = require('path');

          const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local';
          const sharedPath = path.join(localAppData, 'hermes', 'shared', 'nous_auth.json');
          const authPath = path.join(localAppData, 'hermes', 'auth.json');

          // Sincroniza nous_auth.json no auth.json para o CLI funcionar
          if (fs.existsSync(sharedPath) && fs.existsSync(authPath)) {
            try {
              const sharedJson = JSON.parse(fs.readFileSync(sharedPath, 'utf-8'));
              const authJson = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
              if (!authJson.providers) authJson.providers = {};
              if (!authJson.providers.nous || !authJson.providers.nous.access_token) {
                authJson.providers.nous = sharedJson;
                fs.writeFileSync(authPath, JSON.stringify(authJson, null, 2), 'utf-8');
              }
            } catch {}
          }

          if (forcar) {
            try {
              const hermesCmd = path.join(localAppData, 'hermes', 'bin', 'hermes.cmd');
              const hermesExe = path.join(localAppData, 'hermes', 'bin', 'hermes.exe');
              const cmd = fs.existsSync(hermesCmd) ? `"${hermesCmd}"` : fs.existsSync(hermesExe) ? `"${hermesExe}"` : 'hermes';
              childProcess.execSync(`${cmd} auth refresh nous`, {
                stdio: 'pipe',
                encoding: 'utf-8',
                timeout: 15000,
              });
            } catch {
              // CLI pode não estar no PATH de alguns ambientes
            }
          }

          let tokenEncontrado: string | null = null;
          let expEncontrado: string | null = null;

          if (fs.existsSync(sharedPath)) {
            try {
              const sharedJson = JSON.parse(fs.readFileSync(sharedPath, 'utf-8'));
              if (sharedJson?.access_token && !jwtExpirado(sharedJson.access_token, 60)) {
                tokenEncontrado = sharedJson.access_token;
                expEncontrado = sharedJson.expires_at || null;
              }
            } catch {}
          }

          if (!tokenEncontrado && fs.existsSync(authPath)) {
            try {
              const authJson = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
              const nous = authJson?.providers?.nous || authJson?.credential_pool?.nous?.[0];
              if (nous?.access_token && !jwtExpirado(nous.access_token, 60)) {
                tokenEncontrado = nous.access_token;
                expEncontrado = nous.expires_at || null;
              }
            } catch {}
          }

          if (tokenEncontrado) {
            definirTokenNous(tokenEncontrado, expEncontrado);
            try {
              const envLocal = path.join(process.cwd(), '.env.local');
              fs.writeFileSync(envLocal, `EXPO_PUBLIC_NOUS_API_KEY=${tokenEncontrado}\n`, 'utf-8');
            } catch {}
            return tokenEncontrado;
          }
        } catch {
          // Silencioso em fallback
        }
      }

      return obterTokenNousAtual() || null;
    } finally {
      refreshEmAndamento = null;
    }
  })();

  return refreshEmAndamento;
}

/**
 * Inicia o monitor de segundo plano imperceptível.
 * A cada 15 minutos, verifica se o token precisa ser renovado preventivamente.
 */
export function iniciarMonitoramentoNous(): void {
  if (monitorIniciado) return;
  monitorIniciado = true;

  // Primeira verificação rápida após 3 segundos
  if (typeof setTimeout !== 'undefined') {
    setTimeout(() => {
      void renovarTokenNous(false);
    }, 3000);
  }

  // Monitoramento a cada 15 minutos (900.000 ms)
  if (typeof setInterval !== 'undefined') {
    setInterval(() => {
      void renovarTokenNous(false);
    }, 15 * 60 * 1000);
  }
}
