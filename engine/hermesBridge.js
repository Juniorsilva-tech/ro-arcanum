"use strict";
// ARCANUM · Ponte de autenticação dinâmica para Nous Research (Hermes)
// Permite que o jogo atualize o token OAuth em segundo plano de forma 100% imperceptível,
// sem travar a partida ou exigir que o jogador copie e cole novas chaves.
Object.defineProperty(exports, "__esModule", { value: true });
exports.obterTokenNousAtual = obterTokenNousAtual;
exports.definirTokenNous = definirTokenNous;
exports.tokenEstaPrestesAExpirar = tokenEstaPrestesAExpirar;
exports.renovarTokenNous = renovarTokenNous;
exports.iniciarMonitoramentoNous = iniciarMonitoramentoNous;
let tokenAtual = null;
let expiresAtAtual = null;
let refreshEmAndamento = null;
let monitorIniciado = false;
// Inicialização síncrona se a variável de ambiente estiver definida
if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_NOUS_API_KEY) {
    tokenAtual = process.env.EXPO_PUBLIC_NOUS_API_KEY.trim();
}
/**
 * Retorna o token da Nous Research ativo em memória ou nas variáveis de ambiente.
 */
function obterTokenNousAtual() {
    if (tokenAtual && tokenAtual.trim()) {
        return tokenAtual.trim();
    }
    if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_NOUS_API_KEY) {
        const envKey = process.env.EXPO_PUBLIC_NOUS_API_KEY.trim();
        if (envKey) {
            tokenAtual = envKey;
            return envKey;
        }
    }
    // No Node.js, lê direto de auth.json ou .env.local se ainda não estiver em memória
    if (typeof process !== 'undefined' && process.versions?.node) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const fs = require('fs');
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const path = require('path');
            const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local';
            const authPath = path.join(localAppData, 'hermes', 'auth.json');
            if (fs.existsSync(authPath)) {
                const authJson = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
                const nous = authJson?.providers?.nous || authJson?.credential_pool?.nous?.[0];
                if (nous?.access_token) {
                    definirTokenNous(nous.access_token, nous.expires_at || null);
                    return nous.access_token;
                }
            }
            const envLocal = path.join(process.cwd(), '.env.local');
            if (fs.existsSync(envLocal)) {
                const m = fs.readFileSync(envLocal, 'utf-8').match(/EXPO_PUBLIC_NOUS_API_KEY=(.+)/);
                if (m?.[1]?.trim()) {
                    definirTokenNous(m[1].trim());
                    return m[1].trim();
                }
            }
        }
        catch {
            // Silencioso
        }
    }
    return '';
}
/**
 * Atualiza o token em memória e sua data de expiração.
 */
function definirTokenNous(token, expiresAt) {
    tokenAtual = token ? token.trim() : null;
    if (expiresAt !== undefined) {
        expiresAtAtual = expiresAt;
    }
}
/**
 * Retorna se o token atual está expirado ou próximo da expiração (< 5 minutos).
 */
function tokenEstaPrestesAExpirar() {
    if (!tokenAtual)
        return true;
    if (!expiresAtAtual)
        return false;
    try {
        const expMs = new Date(expiresAtAtual).getTime();
        if (isNaN(expMs))
            return false;
        const agoraMs = Date.now();
        // Menos de 5 minutos restantes
        return expMs - agoraMs < 5 * 60 * 1000;
    }
    catch {
        return false;
    }
}
/**
 * Renova o token de forma imperceptível.
 * Deduplica chamadas concorrentes para garantir que apenas uma requisição
 * de renovação aconteça por vez (evita corrida de refresh).
 */
async function renovarTokenNous(forcar = true) {
    if (refreshEmAndamento) {
        return refreshEmAndamento;
    }
    refreshEmAndamento = (async () => {
        try {
            const endpoint = forcar ? '/api/hermes/refresh' : '/api/hermes/token';
            const method = forcar ? 'POST' : 'GET';
            // 1. Tenta no navegador / ambiente com fetch
            if (typeof fetch !== 'undefined') {
                const urlsParaTentar = [
                    endpoint,
                    `http://localhost:8081${endpoint}`,
                    `http://127.0.0.1:8081${endpoint}`,
                ];
                for (const url of urlsParaTentar) {
                    try {
                        const resp = await fetch(url, {
                            method,
                            headers: { 'Accept': 'application/json' },
                        });
                        if (resp.ok) {
                            const data = (await resp.json());
                            if (data.ok && data.apiKey) {
                                definirTokenNous(data.apiKey, data.expiresAt);
                                return data.apiKey;
                            }
                        }
                    }
                    catch {
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
                    if (forcar) {
                        try {
                            childProcess.execSync('hermes auth refresh nous', {
                                stdio: 'pipe',
                                encoding: 'utf-8',
                                timeout: 15000,
                            });
                        }
                        catch {
                            // CLI pode não estar no PATH de alguns ambientes
                        }
                    }
                    const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local';
                    const authPath = path.join(localAppData, 'hermes', 'auth.json');
                    if (fs.existsSync(authPath)) {
                        const authJson = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
                        const nous = authJson?.providers?.nous || authJson?.credential_pool?.nous?.[0];
                        if (nous?.access_token) {
                            definirTokenNous(nous.access_token, nous.expires_at || null);
                            return nous.access_token;
                        }
                    }
                }
                catch {
                    // Silencioso em fallback
                }
            }
            return obterTokenNousAtual() || null;
        }
        finally {
            refreshEmAndamento = null;
        }
    })();
    return refreshEmAndamento;
}
/**
 * Inicia o monitor de segundo plano imperceptível.
 * A cada 15 minutos, verifica se o token precisa ser renovado preventivamente.
 */
function iniciarMonitoramentoNous() {
    if (monitorIniciado)
        return;
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
