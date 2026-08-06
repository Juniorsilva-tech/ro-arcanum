// ARCANUM · Persistência local (offline-first). A verdade da campanha mora no
// dispositivo; num produto completo, moraria no Supabase (GDD §33).
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Campaign } from '@/engine/types';

const K_CAMP = 'arcanum.campanha.v1';
const K_CONFIG = 'arcanum.config.v1';

export type ConfigApp = {
  provider: 'openrouter' | 'anthropic';
  apiKey?: string;
  modelo: string;
  usarModelo: boolean;
  avisoAceito: boolean;
};

export const configPadrao: ConfigApp = {
  provider: 'openrouter',
  modelo: 'deepseek/deepseek-chat-v3-0324:free',
  usarModelo: false,
  avisoAceito: false,
};

export async function salvarCampanha(camp: Campaign): Promise<void> {
  try {
    await AsyncStorage.setItem(K_CAMP, JSON.stringify(camp));
  } catch {
    // Silencioso: perder um autosave não deve travar o jogo.
  }
}

export async function carregarCampanha(): Promise<Campaign | null> {
  try {
    const raw = await AsyncStorage.getItem(K_CAMP);
    return raw ? (JSON.parse(raw) as Campaign) : null;
  } catch {
    return null;
  }
}

export async function apagarCampanha(): Promise<void> {
  try {
    await AsyncStorage.removeItem(K_CAMP);
  } catch {
    /* noop */
  }
}

export async function salvarConfig(cfg: ConfigApp): Promise<void> {
  try {
    await AsyncStorage.setItem(K_CONFIG, JSON.stringify(cfg));
  } catch {
    /* noop */
  }
}

export async function carregarConfig(): Promise<ConfigApp> {
  try {
    const raw = await AsyncStorage.getItem(K_CONFIG);
    return raw ? { ...configPadrao, ...(JSON.parse(raw) as ConfigApp) } : configPadrao;
  } catch {
    return configPadrao;
  }
}
