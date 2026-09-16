// ARCANUM · Save que aguenta uma campanha de anos.
//
// O que existia: uma chave no AsyncStorage, um `JSON.stringify`, e um
// `catch {}` vazio. Falha de escrita não avisava ninguém; save corrompido
// virava `null` e o jogo abria como se nunca tivesse existido campanha
// nenhuma. Para uma sessão de meia hora tudo bem. Para dez anos de calendário
// acumulados ao longo de meses, é a diferença entre um contratempo e perder
// tudo sem nem saber o que aconteceu.
//
// Quatro garantias, nesta ordem de importância:
//
//  1. **Erro nunca é silencioso.** Toda operação devolve resultado; quem
//     chama decide o que mostrar. Perder um autosave em silêncio é pior do
//     que travar, porque o jogador continua jogando confiante.
//  2. **Corrompeu, recupera.** Cada gravação deixa um rastro de instantâneos.
//     Se o save principal não passa no checksum, carrega o instantâneo bom
//     mais recente e diz ao jogador quanto se perdeu.
//  3. **Slots.** Três campanhas paralelas, cada uma com histórico próprio.
//  4. **É seu.** Exportar e importar JSON, para o jogador ter o arquivo na mão.
//
// Este módulo NÃO conhece AsyncStorage. Ele fala com um `Deposito` — o que
// permite testar corrupção, disco cheio e rollback sem abrir o aplicativo.
// O adaptador real mora em `ui/storage.ts`.
import type { Campaign } from './types';
import { seedFromString } from './rng';

/** Versão do formato do envelope. Muda quando a forma do arquivo mudar. */
export const VERSAO_SAVE = 1;

/** Quantos slots de campanha o jogador tem. */
export const SLOTS = 3;

/**
 * Instantâneos guardados por slot.
 *
 * Cinco é o número que cobre o caso real: o jogador percebe que algo deu
 * errado alguns autosaves depois, não no instante. Menos que isso e o
 * rollback chega tarde demais; muito mais e o armazenamento do aparelho
 * começa a pesar, porque cada instantâneo é a campanha inteira.
 */
export const MAX_INSTANTANEOS = 5;

/** Onde os bytes moram. Implementado por `ui/storage.ts` sobre AsyncStorage. */
export type Deposito = {
  ler(chave: string): Promise<string | null>;
  escrever(chave: string, valor: string): Promise<void>;
  remover(chave: string): Promise<void>;
  chaves(): Promise<string[]>;
};

/**
 * O que fica gravado: a campanha mais o suficiente para a tela de slots
 * mostrar o que há ali sem precisar carregar (e validar) o save inteiro.
 */
export type Envelope = {
  versao: number;
  checksum: string;
  /** Relógio do aparelho, para ordenar instantâneos. */
  salvoEm: number;
  /** Retrato para a tela de slots. */
  resumo: { nome: string; nivel: number; dia: number; local: string };
  campanha: Campaign;
};

export type Resultado<T> =
  | { ok: true; valor: T; aviso?: string }
  | { ok: false; erro: string };

// ── Chaves ────────────────────────────────────────────────────────────────

const PREFIXO = 'arcanum.save';
export const chaveDoSlot = (slot: number) => `${PREFIXO}.v${VERSAO_SAVE}.slot${slot}`;
export const chaveDoInstantaneo = (slot: number, carimbo: number) =>
  `${PREFIXO}.v${VERSAO_SAVE}.slot${slot}.snap.${carimbo}`;
const ehInstantaneoDoSlot = (chave: string, slot: number) =>
  chave.startsWith(`${chaveDoSlot(slot)}.snap.`);

// ── Checksum ──────────────────────────────────────────────────────────────

/**
 * Impressão digital do conteúdo. Não é criptografia e não pretende ser: o
 * inimigo aqui é gravação interrompida, disco cheio e arquivo truncado, não
 * um adversário querendo forjar um save. FNV-1a é a mesma função que o RNG já
 * usa para semente — barata, determinística e suficiente para detectar que
 * os bytes mudaram.
 *
 * Em hexadecimal, e prefixado pelo tamanho: dois conteúdos de tamanhos
 * diferentes nunca colidem, o que fecha justamente o caso mais comum, que é
 * o arquivo cortado no meio.
 */
export function checksumDe(texto: string): string {
  return `${texto.length.toString(36)}-${seedFromString(texto).toString(16)}`;
}

function resumoDe(camp: Campaign): Envelope['resumo'] {
  return {
    nome: camp.personagem?.nome ?? 'sem nome',
    nivel: camp.personagem?.nivel ?? 1,
    dia: camp.calendario?.dia ?? 0,
    local: camp.localAtual ?? '',
  };
}

/** Empacota a campanha com checksum. Exportado para o teste e para exportar. */
export function empacotar(camp: Campaign, agora = Date.now()): Envelope {
  const corpo = JSON.stringify(camp);
  return {
    versao: VERSAO_SAVE,
    checksum: checksumDe(corpo),
    salvoEm: agora,
    resumo: resumoDe(camp),
    campanha: JSON.parse(corpo) as Campaign,
  };
}

/**
 * Desempacota e confere. Devolve erro descritivo em vez de `null` — quem
 * chama precisa saber a diferença entre "não existe save" e "o save está
 * quebrado", porque a segunda merece uma tentativa de recuperação.
 */
export function desempacotar(bruto: string | null): Resultado<Envelope> {
  if (bruto === null) return { ok: false, erro: 'vazio' };
  let env: Envelope;
  try {
    env = JSON.parse(bruto) as Envelope;
  } catch {
    return { ok: false, erro: 'json_invalido' };
  }
  if (!env || typeof env !== 'object') return { ok: false, erro: 'formato_desconhecido' };
  if (!env.campanha) return { ok: false, erro: 'sem_campanha' };
  if (env.versao !== VERSAO_SAVE) return { ok: false, erro: `versao_incompativel:${env.versao}` };
  const esperado = checksumDe(JSON.stringify(env.campanha));
  if (env.checksum !== esperado) return { ok: false, erro: 'checksum_nao_confere' };
  return { ok: true, valor: env };
}

// ── Gravar ────────────────────────────────────────────────────────────────

/**
 * Grava no slot e deixa um instantâneo.
 *
 * A ordem importa e é deliberada: **o instantâneo é gravado primeiro**. Se a
 * escrita do save principal falhar no meio, o instantâneo anterior e o novo
 * já estão em disco, e o jogador perde no máximo o último lance em vez da
 * campanha. Fazer o contrário economizaria uma escrita e arriscaria tudo.
 *
 * A poda dos instantâneos velhos acontece por último e não pode derrubar a
 * gravação: falhar ao apagar lixo antigo não é motivo para dizer ao jogador
 * que o save falhou.
 */
export async function salvarNoSlot(
  deposito: Deposito,
  slot: number,
  camp: Campaign,
  agora = Date.now(),
): Promise<Resultado<Envelope>> {
  const env = empacotar(camp, agora);
  const texto = JSON.stringify(env);

  try {
    await deposito.escrever(chaveDoInstantaneo(slot, agora), texto);
  } catch (e) {
    // Instantâneo é rede de segurança, não o save. Se ele falhar, ainda vale
    // tentar o principal — e o aviso sobe junto com o sucesso.
    const principal = await gravarPrincipal(deposito, slot, texto, env);
    if (!principal.ok) return principal;
    return { ok: true, valor: env, aviso: `instantâneo não foi gravado (${descreverErro(e)})` };
  }

  const principal = await gravarPrincipal(deposito, slot, texto, env);
  if (!principal.ok) return principal;

  const podado = await podar(deposito, slot);
  return podado ? { ok: true, valor: env, aviso: podado } : { ok: true, valor: env };
}

async function gravarPrincipal(
  deposito: Deposito,
  slot: number,
  texto: string,
  env: Envelope,
): Promise<Resultado<Envelope>> {
  try {
    await deposito.escrever(chaveDoSlot(slot), texto);
    return { ok: true, valor: env };
  } catch (e) {
    return { ok: false, erro: `nao_gravou:${descreverErro(e)}` };
  }
}

function descreverErro(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Apaga instantâneos além do teto. Devolve aviso se não conseguiu. */
async function podar(deposito: Deposito, slot: number): Promise<string | undefined> {
  try {
    const todas = await deposito.chaves();
    const snaps = todas.filter(k => ehInstantaneoDoSlot(k, slot)).sort();
    const sobrando = snaps.slice(0, Math.max(0, snaps.length - MAX_INSTANTANEOS));
    for (const k of sobrando) await deposito.remover(k);
  } catch (e) {
    return `instantâneos antigos não foram limpos (${descreverErro(e)})`;
  }
}

// ── Carregar, com recuperação ─────────────────────────────────────────────

/**
 * Carrega o slot. Se o save principal estiver quebrado, **não desiste**:
 * procura o instantâneo bom mais recente e o devolve com um aviso dizendo o
 * que aconteceu e de quando é.
 *
 * Isto é o coração da etapa. Antes, `JSON.parse` falhando devolvia `null` e a
 * tela abria oferecendo "Nova campanha" — o jogador não tinha como saber que
 * havia dez anos de mundo do outro lado de um byte errado.
 */
export async function carregarDoSlot(
  deposito: Deposito,
  slot: number,
): Promise<Resultado<Envelope>> {
  let bruto: string | null = null;
  try {
    bruto = await deposito.ler(chaveDoSlot(slot));
  } catch (e) {
    return recuperar(deposito, slot, `leitura falhou (${descreverErro(e)})`);
  }

  const principal = desempacotar(bruto);
  if (principal.ok) return principal;
  if (principal.erro === 'vazio') {
    // Sem save principal, mas pode haver instantâneo de uma gravação que
    // morreu no meio. Vale procurar antes de dizer que não há nada.
    const resgate = await recuperar(deposito, slot, 'save principal ausente');
    return resgate.ok ? resgate : { ok: false, erro: 'vazio' };
  }
  return recuperar(deposito, slot, `save principal ilegível (${principal.erro})`);
}

async function recuperar(
  deposito: Deposito,
  slot: number,
  motivo: string,
): Promise<Resultado<Envelope>> {
  let snaps: string[];
  try {
    const todas = await deposito.chaves();
    snaps = todas.filter(k => ehInstantaneoDoSlot(k, slot)).sort().reverse();
  } catch (e) {
    return { ok: false, erro: `${motivo}; e a lista de instantâneos falhou (${descreverErro(e)})` };
  }

  for (const chave of snaps) {
    let bruto: string | null;
    try {
      bruto = await deposito.ler(chave);
    } catch {
      continue;
    }
    const env = desempacotar(bruto);
    if (env.ok) {
      return {
        ok: true,
        valor: env.valor,
        aviso: `${motivo}. Recuperado do instantâneo do dia ${env.valor.resumo.dia}.`,
      };
    }
  }
  return { ok: false, erro: `${motivo}; nenhum instantâneo utilizável` };
}

// ── Rollback explícito ────────────────────────────────────────────────────

export type Instantaneo = { carimbo: number; resumo: Envelope['resumo'] };

/** Instantâneos de um slot, do mais novo para o mais velho. */
export async function listarInstantaneos(
  deposito: Deposito,
  slot: number,
): Promise<Instantaneo[]> {
  const todas = await deposito.chaves();
  const snaps = todas.filter(k => ehInstantaneoDoSlot(k, slot)).sort().reverse();
  const saida: Instantaneo[] = [];
  for (const chave of snaps) {
    const env = desempacotar(await deposito.ler(chave));
    if (env.ok) saida.push({ carimbo: env.valor.salvoEm, resumo: env.valor.resumo });
  }
  return saida;
}

/**
 * Volta o slot para um instantâneo. O estado atual vira instantâneo também,
 * antes de ser substituído — desfazer um desfazer tem de ser possível, senão
 * o botão de rollback é tão perigoso quanto o problema que ele resolve.
 */
export async function voltarPara(
  deposito: Deposito,
  slot: number,
  carimbo: number,
  agora = Date.now(),
): Promise<Resultado<Envelope>> {
  const alvo = desempacotar(await deposito.ler(chaveDoInstantaneo(slot, carimbo)));
  if (!alvo.ok) return { ok: false, erro: `instantâneo não serve (${alvo.erro})` };

  const atual = desempacotar(await deposito.ler(chaveDoSlot(slot)));
  if (atual.ok) {
    try {
      await deposito.escrever(chaveDoInstantaneo(slot, agora), JSON.stringify(atual.valor));
    } catch {
      // Não impede o rollback; só significa que o desfazer-do-desfazer não
      // estará disponível. O jogador pediu para voltar: voltamos.
    }
  }
  return salvarNoSlot(deposito, slot, alvo.valor.campanha, agora + 1);
}

// ── Slots ─────────────────────────────────────────────────────────────────

export type ResumoDeSlot = {
  slot: number;
  ocupado: boolean;
  resumo?: Envelope['resumo'];
  salvoEm?: number;
  /** Preenchido quando o save existe mas não abre. */
  problema?: string;
};

/** Retrato de todos os slots, para a tela de escolha. */
export async function listarSlots(deposito: Deposito): Promise<ResumoDeSlot[]> {
  const saida: ResumoDeSlot[] = [];
  for (let slot = 0; slot < SLOTS; slot++) {
    let bruto: string | null = null;
    try {
      bruto = await deposito.ler(chaveDoSlot(slot));
    } catch (e) {
      saida.push({ slot, ocupado: true, problema: descreverErro(e) });
      continue;
    }
    const env = desempacotar(bruto);
    if (env.ok) {
      saida.push({ slot, ocupado: true, resumo: env.valor.resumo, salvoEm: env.valor.salvoEm });
    } else if (env.erro === 'vazio') {
      saida.push({ slot, ocupado: false });
    } else {
      saida.push({ slot, ocupado: true, problema: env.erro });
    }
  }
  return saida;
}

/** Apaga um slot inteiro, instantâneos inclusive. */
export async function apagarSlot(deposito: Deposito, slot: number): Promise<Resultado<true>> {
  try {
    await deposito.remover(chaveDoSlot(slot));
    const todas = await deposito.chaves();
    for (const k of todas.filter(k => ehInstantaneoDoSlot(k, slot))) await deposito.remover(k);
    return { ok: true, valor: true };
  } catch (e) {
    return { ok: false, erro: descreverErro(e) };
  }
}

// ── Exportar e importar ───────────────────────────────────────────────────

/** JSON legível, com checksum, para o jogador guardar onde quiser. */
export function exportar(camp: Campaign, agora = Date.now()): string {
  return JSON.stringify(empacotar(camp, agora), null, 2);
}

/**
 * Lê um arquivo exportado. Passa pelas mesmas conferências do save normal —
 * um arquivo que veio de fora merece MAIS desconfiança, não menos.
 */
export function importar(texto: string): Resultado<Campaign> {
  const env = desempacotar(texto);
  if (!env.ok) return { ok: false, erro: env.erro };
  return { ok: true, valor: env.valor.campanha };
}
