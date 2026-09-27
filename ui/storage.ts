// ARCANUM · Persistência local (offline-first). A verdade da campanha mora no
// dispositivo.
//
// Este arquivo é só o ADAPTADOR: ele liga o AsyncStorage ao módulo de
// persistência da engine (`engine/persistencia.ts`), que é quem sabe de
// checksum, instantâneos, recuperação e slots. A separação existe por um
// motivo prático — não dá para simular disco cheio nem arquivo truncado no
// AsyncStorage real, e era justamente isso que nunca tinha sido testado.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Campaign } from '@/engine/types';
import {
  type Deposito, type Resultado, type ResumoDeSlot, type Instantaneo,
  salvarNoSlot, carregarDoSlot, listarSlots as listarSlotsEngine, apagarSlot as apagarSlotEngine,
  listarInstantaneos as listarInstantaneosEngine, voltarPara as voltarParaEngine,
  exportar as exportarEngine, importar as importarEngine,
} from '@/engine/persistencia';

const K_CONFIG = 'arcanum.config.v1';
/** Save de antes dos slots. Migrado para o slot 0 na primeira abertura. */
const K_CAMP_ANTIGO = 'arcanum.campanha.v1';
const K_SLOT_ATIVO = 'arcanum.slotAtivo.v1';
// A campanha guarda ESTADO (flags, npcState, calendário...), mas nunca guardou
// o que estava na TELA — o texto exato que o jogador leu e as opções que
// tinha na frente. Sem isso, recarregar o jogo perdia a conversa: a tela
// mostrava só "Você retoma de onde parou." e pedia pro narrador inventar uma
// cena nova do zero — o que, sendo IA generativa sem o texto anterior, saía
// diferente (às vezes até com fala inventada na boca do jogador). Esta chave
// guarda o retrato exato da tela — feed e cena correntes — pra retomar EXATAMENTE
// de onde parou, sem gerar nada novo.
const K_SESSAO = 'arcanum.sessao.v1';

/** AsyncStorage vestido com a interface que a engine espera. */
const deposito: Deposito = {
  ler: k => AsyncStorage.getItem(k),
  escrever: (k, v) => AsyncStorage.setItem(k, v),
  remover: k => AsyncStorage.removeItem(k),
  chaves: async () => [...(await AsyncStorage.getAllKeys())],
};

// ── Slot ativo ────────────────────────────────────────────────────────────

let slotAtivo = 0;

export async function carregarSlotAtivo(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(K_SLOT_ATIVO);
    const n = Number(raw);
    slotAtivo = Number.isInteger(n) && n >= 0 ? n : 0;
  } catch {
    slotAtivo = 0;
  }
  return slotAtivo;
}

export async function definirSlotAtivo(slot: number): Promise<void> {
  slotAtivo = slot;
  try {
    await AsyncStorage.setItem(K_SLOT_ATIVO, String(slot));
  } catch {
    // Não saber qual slot era o ativo é um aborrecimento, não uma perda: a
    // tela de slots mostra todos e o jogador escolhe.
  }
}

export const slotAtual = () => slotAtivo;

// ── Migração do save antigo ───────────────────────────────────────────────

/**
 * Traz a campanha de antes dos slots para o slot 0.
 *
 * O save velho é preservado, não apagado. Se algo der errado na leitura nova,
 * os bytes originais continuam lá — e perder a campanha de alguém para
 * economizar uma chave no armazenamento seria uma troca péssima.
 */
export async function migrarSaveAntigo(): Promise<boolean> {
  try {
    const antigo = await AsyncStorage.getItem(K_CAMP_ANTIGO);
    if (!antigo) return false;
    const jaTem = await carregarDoSlot(deposito, 0);
    if (jaTem.ok) return false;
    const camp = JSON.parse(antigo) as Campaign;
    const r = await salvarNoSlot(deposito, 0, camp);
    return r.ok;
  } catch {
    return false;
  }
}

// ── Campanha ──────────────────────────────────────────────────────────────

/**
 * Grava no slot ativo.
 *
 * Devolve o resultado em vez de engolir a exceção. A versão anterior tinha um
 * `catch {}` vazio com o comentário "perder um autosave não deve travar o
 * jogo" — verdade, mas perder em SILÊNCIO é pior: o jogador segue jogando
 * horas confiando num save que não existe.
 */
export async function salvarCampanha(camp: Campaign): Promise<Resultado<unknown>> {
  return salvarNoSlot(deposito, slotAtivo, camp);
}

/** Carrega o slot ativo, recuperando de instantâneo se precisar. */
export async function carregarCampanhaDetalhado(): Promise<
  { camp: Campaign | null; aviso?: string; erro?: string }
> {
  const r = await carregarDoSlot(deposito, slotAtivo);
  if (r.ok) return { camp: r.valor.campanha, aviso: r.aviso };
  return { camp: null, erro: r.erro === 'vazio' ? undefined : r.erro };
}

/** Forma antiga, para quem só quer a campanha. */
export async function carregarCampanha(): Promise<Campaign | null> {
  return (await carregarCampanhaDetalhado()).camp;
}

export async function apagarCampanha(): Promise<void> {
  await apagarSlotEngine(deposito, slotAtivo);
}

// ── Slots, histórico e arquivo ────────────────────────────────────────────

export const listarSlots = (): Promise<ResumoDeSlot[]> => listarSlotsEngine(deposito);
export const apagarSlot = (slot: number) => apagarSlotEngine(deposito, slot);
export const listarInstantaneos = (slot = slotAtivo): Promise<Instantaneo[]> =>
  listarInstantaneosEngine(deposito, slot);
export const voltarPara = (carimbo: number, slot = slotAtivo) =>
  voltarParaEngine(deposito, slot, carimbo);
export const exportarCampanha = exportarEngine;
export const importarCampanha = importarEngine;

// ── Sessão (retrato da tela) ──────────────────────────────────────────────

// Retrato da tela (feed + cena correntes) — ver K_SESSAO acima. Tipo solto de
// propósito: o formato é definido por quem chama (ui/store.ts), pra esta
// camada de storage não precisar conhecer EntradaFeed/OpcaoResolvida.
const chaveSessao = () => `${K_SESSAO}.slot${slotAtivo}`;

export async function salvarSessao(sessao: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(chaveSessao(), JSON.stringify(sessao));
  } catch {
    // O retrato da tela é conforto, não estado: perdê-lo custa a conversa da
    // última cena, nunca a campanha. Aqui o silêncio é aceitável.
  }
}

export async function carregarSessao<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(chaveSessao());
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function apagarSessao(): Promise<void> {
  try {
    await AsyncStorage.removeItem(chaveSessao());
  } catch {
    /* noop */
  }
}

// ── Configuração ──────────────────────────────────────────────────────────

import type { EstiloNarrador, ProvedorCompat } from '@/engine/llm';

export type ConfigApp = {
  provider: 'openrouter' | 'anthropic' | 'nous';
  apiKey?: string;
  modelo: string;
  /** @deprecated o narrador é obrigatório; mantido só para saves antigos. */
  usarModelo: boolean;
  avisoAceito: boolean;
  /** Estilo do narrador: extensão, ritmo e menção à decisão (engine/llm.ts). */
  estilo?: EstiloNarrador;
  /**
   * Reservas grátis em rodízio: quando o narrador principal falha (limite,
   * rede, recusa), a cena tenta estas, na ordem. Cada chave fica só aqui.
   */
  reservas?: { provider: ProvedorCompat; apiKey: string; modelo?: string }[];
  /** Resultado de "Testar cena adulta" por "provedor:modelo" (true = narra). */
  testesAdulto?: Record<string, boolean>;
};

export const configPadrao: ConfigApp = {
  provider: 'nous',
  modelo: 'upstage/solar-pro4:free',
  usarModelo: true,
  avisoAceito: false,
};

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
    if (!raw) return configPadrao;
    const cfg = { ...configPadrao, ...(JSON.parse(raw) as ConfigApp) };
    // Migração automática para modelos descontinuados pela Nous
    if (
      cfg.modelo?.includes('longcat') ||
      cfg.modelo?.includes('hy3:free') ||
      cfg.modelo?.includes('ling-3.0') ||
      cfg.modelo?.includes('laguna-xs')
    ) {
      cfg.modelo = configPadrao.modelo;
      await salvarConfig(cfg);
    }
    return cfg;
  } catch {
    return configPadrao;
  }
}
