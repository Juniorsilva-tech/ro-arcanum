// ARCANUM · Persistência local (offline-first). A verdade da campanha mora no
// dispositivo; num produto completo, moraria no Supabase (GDD §33).
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Campaign } from '@/engine/types';

const K_CAMP = 'arcanum.campanha.v1';
const K_CONFIG = 'arcanum.config.v1';
// A campanha guarda ESTADO (flags, npcState, calendário...), mas nunca guardou
// o que estava na TELA — o texto exato que o jogador leu e as opções que
// tinha na frente. Sem isso, recarregar o jogo perdia a conversa: a tela
// mostrava só "Você retoma de onde parou." e pedia pro narrador inventar uma
// cena nova do zero — o que, sendo IA generativa sem o texto anterior, saía
// diferente (às vezes até com fala inventada na boca do jogador). Esta chave
// guarda o retrato exato da tela — feed e cena correntes — pra retomar EXATAMENTE
// de onde parou, sem gerar nada novo.
const K_SESSAO = 'arcanum.sessao.v1';

export type ConfigApp = {
  provider: 'openrouter' | 'anthropic';
  apiKey?: string;
  modelo: string;
  /** @deprecated o narrador é obrigatório; mantido só para saves antigos. */
  usarModelo: boolean;
  avisoAceito: boolean;
};

export const configPadrao: ConfigApp = {
  provider: 'openrouter',
  modelo: 'thedrummer/rocinante-12b',
  usarModelo: true,
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

// Retrato da tela (feed + cena correntes) — ver K_SESSAO acima. Tipo solto de
// propósito: o formato é definido por quem chama (ui/store.ts), pra esta
// camada de storage não precisar conhecer EntradaFeed/OpcaoResolvida.
export async function salvarSessao(sessao: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(K_SESSAO, JSON.stringify(sessao));
  } catch {
    // Silencioso, mesma política do autosave da campanha.
  }
}

export async function carregarSessao<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(K_SESSAO);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function apagarSessao(): Promise<void> {
  try {
    await AsyncStorage.removeItem(K_SESSAO);
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
