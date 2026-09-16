"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaveDoInstantaneo = exports.chaveDoSlot = exports.MAX_INSTANTANEOS = exports.SLOTS = exports.VERSAO_SAVE = void 0;
exports.checksumDe = checksumDe;
exports.empacotar = empacotar;
exports.desempacotar = desempacotar;
exports.salvarNoSlot = salvarNoSlot;
exports.carregarDoSlot = carregarDoSlot;
exports.listarInstantaneos = listarInstantaneos;
exports.voltarPara = voltarPara;
exports.listarSlots = listarSlots;
exports.apagarSlot = apagarSlot;
exports.exportar = exportar;
exports.importar = importar;
const rng_1 = require("./rng");
/** Versão do formato do envelope. Muda quando a forma do arquivo mudar. */
exports.VERSAO_SAVE = 1;
/** Quantos slots de campanha o jogador tem. */
exports.SLOTS = 3;
/**
 * Instantâneos guardados por slot.
 *
 * Cinco é o número que cobre o caso real: o jogador percebe que algo deu
 * errado alguns autosaves depois, não no instante. Menos que isso e o
 * rollback chega tarde demais; muito mais e o armazenamento do aparelho
 * começa a pesar, porque cada instantâneo é a campanha inteira.
 */
exports.MAX_INSTANTANEOS = 5;
// ── Chaves ────────────────────────────────────────────────────────────────
const PREFIXO = 'arcanum.save';
const chaveDoSlot = (slot) => `${PREFIXO}.v${exports.VERSAO_SAVE}.slot${slot}`;
exports.chaveDoSlot = chaveDoSlot;
const chaveDoInstantaneo = (slot, carimbo) => `${PREFIXO}.v${exports.VERSAO_SAVE}.slot${slot}.snap.${carimbo}`;
exports.chaveDoInstantaneo = chaveDoInstantaneo;
const ehInstantaneoDoSlot = (chave, slot) => chave.startsWith(`${(0, exports.chaveDoSlot)(slot)}.snap.`);
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
function checksumDe(texto) {
    return `${texto.length.toString(36)}-${(0, rng_1.seedFromString)(texto).toString(16)}`;
}
function resumoDe(camp) {
    return {
        nome: camp.personagem?.nome ?? 'sem nome',
        nivel: camp.personagem?.nivel ?? 1,
        dia: camp.calendario?.dia ?? 0,
        local: camp.localAtual ?? '',
    };
}
/** Empacota a campanha com checksum. Exportado para o teste e para exportar. */
function empacotar(camp, agora = Date.now()) {
    const corpo = JSON.stringify(camp);
    return {
        versao: exports.VERSAO_SAVE,
        checksum: checksumDe(corpo),
        salvoEm: agora,
        resumo: resumoDe(camp),
        campanha: JSON.parse(corpo),
    };
}
/**
 * Desempacota e confere. Devolve erro descritivo em vez de `null` — quem
 * chama precisa saber a diferença entre "não existe save" e "o save está
 * quebrado", porque a segunda merece uma tentativa de recuperação.
 */
function desempacotar(bruto) {
    if (bruto === null)
        return { ok: false, erro: 'vazio' };
    let env;
    try {
        env = JSON.parse(bruto);
    }
    catch {
        return { ok: false, erro: 'json_invalido' };
    }
    if (!env || typeof env !== 'object')
        return { ok: false, erro: 'formato_desconhecido' };
    if (!env.campanha)
        return { ok: false, erro: 'sem_campanha' };
    if (env.versao !== exports.VERSAO_SAVE)
        return { ok: false, erro: `versao_incompativel:${env.versao}` };
    const esperado = checksumDe(JSON.stringify(env.campanha));
    if (env.checksum !== esperado)
        return { ok: false, erro: 'checksum_nao_confere' };
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
async function salvarNoSlot(deposito, slot, camp, agora = Date.now()) {
    const env = empacotar(camp, agora);
    const texto = JSON.stringify(env);
    try {
        await deposito.escrever((0, exports.chaveDoInstantaneo)(slot, agora), texto);
    }
    catch (e) {
        // Instantâneo é rede de segurança, não o save. Se ele falhar, ainda vale
        // tentar o principal — e o aviso sobe junto com o sucesso.
        const principal = await gravarPrincipal(deposito, slot, texto, env);
        if (!principal.ok)
            return principal;
        return { ok: true, valor: env, aviso: `instantâneo não foi gravado (${descreverErro(e)})` };
    }
    const principal = await gravarPrincipal(deposito, slot, texto, env);
    if (!principal.ok)
        return principal;
    const podado = await podar(deposito, slot);
    return podado ? { ok: true, valor: env, aviso: podado } : { ok: true, valor: env };
}
async function gravarPrincipal(deposito, slot, texto, env) {
    try {
        await deposito.escrever((0, exports.chaveDoSlot)(slot), texto);
        return { ok: true, valor: env };
    }
    catch (e) {
        return { ok: false, erro: `nao_gravou:${descreverErro(e)}` };
    }
}
function descreverErro(e) {
    return e instanceof Error ? e.message : String(e);
}
/** Apaga instantâneos além do teto. Devolve aviso se não conseguiu. */
async function podar(deposito, slot) {
    try {
        const todas = await deposito.chaves();
        const snaps = todas.filter(k => ehInstantaneoDoSlot(k, slot)).sort();
        const sobrando = snaps.slice(0, Math.max(0, snaps.length - exports.MAX_INSTANTANEOS));
        for (const k of sobrando)
            await deposito.remover(k);
    }
    catch (e) {
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
async function carregarDoSlot(deposito, slot) {
    let bruto = null;
    try {
        bruto = await deposito.ler((0, exports.chaveDoSlot)(slot));
    }
    catch (e) {
        return recuperar(deposito, slot, `leitura falhou (${descreverErro(e)})`);
    }
    const principal = desempacotar(bruto);
    if (principal.ok)
        return principal;
    if (principal.erro === 'vazio') {
        // Sem save principal, mas pode haver instantâneo de uma gravação que
        // morreu no meio. Vale procurar antes de dizer que não há nada.
        const resgate = await recuperar(deposito, slot, 'save principal ausente');
        return resgate.ok ? resgate : { ok: false, erro: 'vazio' };
    }
    return recuperar(deposito, slot, `save principal ilegível (${principal.erro})`);
}
async function recuperar(deposito, slot, motivo) {
    let snaps;
    try {
        const todas = await deposito.chaves();
        snaps = todas.filter(k => ehInstantaneoDoSlot(k, slot)).sort().reverse();
    }
    catch (e) {
        return { ok: false, erro: `${motivo}; e a lista de instantâneos falhou (${descreverErro(e)})` };
    }
    for (const chave of snaps) {
        let bruto;
        try {
            bruto = await deposito.ler(chave);
        }
        catch {
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
/** Instantâneos de um slot, do mais novo para o mais velho. */
async function listarInstantaneos(deposito, slot) {
    const todas = await deposito.chaves();
    const snaps = todas.filter(k => ehInstantaneoDoSlot(k, slot)).sort().reverse();
    const saida = [];
    for (const chave of snaps) {
        const env = desempacotar(await deposito.ler(chave));
        if (env.ok)
            saida.push({ carimbo: env.valor.salvoEm, resumo: env.valor.resumo });
    }
    return saida;
}
/**
 * Volta o slot para um instantâneo. O estado atual vira instantâneo também,
 * antes de ser substituído — desfazer um desfazer tem de ser possível, senão
 * o botão de rollback é tão perigoso quanto o problema que ele resolve.
 */
async function voltarPara(deposito, slot, carimbo, agora = Date.now()) {
    const alvo = desempacotar(await deposito.ler((0, exports.chaveDoInstantaneo)(slot, carimbo)));
    if (!alvo.ok)
        return { ok: false, erro: `instantâneo não serve (${alvo.erro})` };
    const atual = desempacotar(await deposito.ler((0, exports.chaveDoSlot)(slot)));
    if (atual.ok) {
        try {
            await deposito.escrever((0, exports.chaveDoInstantaneo)(slot, agora), JSON.stringify(atual.valor));
        }
        catch {
            // Não impede o rollback; só significa que o desfazer-do-desfazer não
            // estará disponível. O jogador pediu para voltar: voltamos.
        }
    }
    return salvarNoSlot(deposito, slot, alvo.valor.campanha, agora + 1);
}
/** Retrato de todos os slots, para a tela de escolha. */
async function listarSlots(deposito) {
    const saida = [];
    for (let slot = 0; slot < exports.SLOTS; slot++) {
        let bruto = null;
        try {
            bruto = await deposito.ler((0, exports.chaveDoSlot)(slot));
        }
        catch (e) {
            saida.push({ slot, ocupado: true, problema: descreverErro(e) });
            continue;
        }
        const env = desempacotar(bruto);
        if (env.ok) {
            saida.push({ slot, ocupado: true, resumo: env.valor.resumo, salvoEm: env.valor.salvoEm });
        }
        else if (env.erro === 'vazio') {
            saida.push({ slot, ocupado: false });
        }
        else {
            saida.push({ slot, ocupado: true, problema: env.erro });
        }
    }
    return saida;
}
/** Apaga um slot inteiro, instantâneos inclusive. */
async function apagarSlot(deposito, slot) {
    try {
        await deposito.remover((0, exports.chaveDoSlot)(slot));
        const todas = await deposito.chaves();
        for (const k of todas.filter(k => ehInstantaneoDoSlot(k, slot)))
            await deposito.remover(k);
        return { ok: true, valor: true };
    }
    catch (e) {
        return { ok: false, erro: descreverErro(e) };
    }
}
// ── Exportar e importar ───────────────────────────────────────────────────
/** JSON legível, com checksum, para o jogador guardar onde quiser. */
function exportar(camp, agora = Date.now()) {
    return JSON.stringify(empacotar(camp, agora), null, 2);
}
/**
 * Lê um arquivo exportado. Passa pelas mesmas conferências do save normal —
 * um arquivo que veio de fora merece MAIS desconfiança, não menos.
 */
function importar(texto) {
    const env = desempacotar(texto);
    if (!env.ok)
        return { ok: false, erro: env.erro };
    return { ok: true, valor: env.valor.campanha };
}
