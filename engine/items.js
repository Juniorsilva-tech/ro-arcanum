"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estoqueNaLoja = estoqueNaLoja;
exports.itemPorId = itemPorId;
exports.ehEquipavel = ehEquipavel;
exports.armaEquipada = armaEquipada;
exports.bonusDefesaEquip = bonusDefesaEquip;
exports.cargaAtual = cargaAtual;
exports.equipar = equipar;
exports.desequipar = desequipar;
exports.usarConsumivel = usarConsumivel;
exports.precoCompra = precoCompra;
exports.precoVenda = precoVenda;
exports.itensDaLoja = itensDaLoja;
exports.comprar = comprar;
exports.vender = vender;
exports.verbosConcedidos = verbosConcedidos;
const effects_1 = require("./effects");
const character_1 = require("./character");
const mundo_1 = require("./mundo");
const historiaViva_1 = require("./historiaViva");
const classe_1 = require("./classe");
function estoqueNaLoja(content, camp, itemId) {
    const item = itemPorId(content, itemId);
    if (!item?.lojas?.includes(camp.localAtual))
        return 0;
    const id = (0, historiaViva_1.cidadeIdDoLocal)(content, camp, camp.localAtual);
    if (id && ((camp.continuidade?.locais[id]?.integridade ?? 100) <= 20 || camp.continuidade?.locais[id]?.populacao === 0))
        return 0;
    return (0, historiaViva_1.cidadeDoLocal)(content, camp, camp.localAtual)?.estoque[itemId] ?? (camp.vivo ? 0 : 12);
}
function itemPorId(content, id) {
    return content.itens.find((i) => i.id === id);
}
const SLOTS_EQUIPAVEIS = ['arma', 'armadura', 'escudo', 'acessorio'];
function ehEquipavel(item) {
    return SLOTS_EQUIPAVEIS.includes(item.slot);
}
function armaEquipada(content, p) {
    return p.equipado.arma ? itemPorId(content, p.equipado.arma) : undefined;
}
// Bônus de defesa vindo de armadura + escudo equipados.
function bonusDefesaEquip(content, p) {
    let b = 0;
    for (const id of [p.equipado.armadura, p.equipado.escudo]) {
        if (!id)
            continue;
        b += itemPorId(content, id)?.defesa ?? 0;
    }
    return b;
}
// Peso carregado total.
function cargaAtual(content, p) {
    let total = 0;
    for (const [id, qtd] of Object.entries(p.inventario)) {
        total += (itemPorId(content, id)?.peso ?? 0) * qtd;
    }
    return Math.round(total * 10) / 10;
}
function equipar(content, camp, itemId) {
    const p = camp.personagem;
    if ((p.inventario[itemId] ?? 0) <= 0)
        return { ok: false, motivo: 'você não tem esse item' };
    const item = itemPorId(content, itemId);
    if (!item)
        return { ok: false, motivo: 'item desconhecido' };
    if (!ehEquipavel(item))
        return { ok: false, motivo: 'não é equipável' };
    p.equipado[item.slot] = itemId;
    return { ok: true };
}
function desequipar(camp, slot) {
    delete camp.personagem.equipado[slot];
}
function usarConsumivel(content, camp, itemId) {
    const p = camp.personagem;
    if ((p.inventario[itemId] ?? 0) <= 0)
        return { ok: false, motivo: 'você não tem esse item' };
    const item = itemPorId(content, itemId);
    if (!item)
        return { ok: false, motivo: 'item desconhecido' };
    if (item.slot !== 'consumivel' || !item.efeitosUso)
        return { ok: false, motivo: 'não dá para usar isso' };
    for (const ef of item.efeitosUso)
        (0, effects_1.aplicarEfeito)(camp, ef);
    // consome uma unidade
    p.inventario[itemId] = (p.inventario[itemId] ?? 0) - 1;
    if (p.inventario[itemId] <= 0)
        delete p.inventario[itemId];
    (0, character_1.clampRecursos)(p);
    return { ok: true };
}
// O preço do dia: base do catálogo, desconto de barganha e o que o vale está
// vivendo (feira derruba, escassez levanta — ver mundo.ts).
function precoCompra(item, desconto = false, multiplicadorMundo = 1) {
    return Math.max(1, Math.round(item.valor * (desconto ? 0.8 : 1) * multiplicadorMundo));
}
function precoVenda(item, multiplicadorMundo = 1) {
    return Math.max(1, Math.floor(item.valor * 0.4 * multiplicadorMundo));
}
// Itens à venda num local (GDD §7 serviços).
function itensDaLoja(content, localId) {
    return content.itens.filter((i) => i.lojas?.includes(localId));
}
function comprar(content, camp, itemId, desconto = false) {
    const p = camp.personagem;
    const item = itemPorId(content, itemId);
    if (!item)
        return { ok: false, motivo: 'item desconhecido' };
    const preco = precoCompra(item, (0, classe_1.descontoDeCompra)(camp, desconto), (0, mundo_1.multiplicadorDePreco)(camp));
    if (camp.combate && !camp.combate.terminado)
        return { ok: false, motivo: 'termine o combate primeiro' };
    if (estoqueNaLoja(content, camp, itemId) <= 0)
        return { ok: false, motivo: 'item indisponível nesta loja ou serviço interrompido' };
    if (p.dinheiro < preco)
        return { ok: false, motivo: 'sem moedas suficientes' };
    p.dinheiro -= preco;
    const cidade = (0, historiaViva_1.cidadeDoLocal)(content, camp, camp.localAtual);
    if (cidade) {
        cidade.estoque[itemId]--;
        cidade.tesouro = Math.min(800, cidade.tesouro + preco);
    }
    p.inventario[itemId] = (p.inventario[itemId] ?? 0) + 1;
    return { ok: true };
}
function vender(content, camp, itemId) {
    const p = camp.personagem;
    if ((p.inventario[itemId] ?? 0) <= 0)
        return { ok: false, motivo: 'você não tem esse item' };
    const item = itemPorId(content, itemId);
    if (!item)
        return { ok: false, motivo: 'item desconhecido' };
    // desequipa se estiver vendendo o último equipado
    if (camp.combate && !camp.combate.terminado)
        return { ok: false, motivo: 'termine o combate primeiro' };
    if (!itensDaLoja(content, camp.localAtual).length)
        return { ok: false, motivo: 'não há comerciante aqui' };
    const cidade = (0, historiaViva_1.cidadeDoLocal)(content, camp, camp.localAtual);
    const preco = precoVenda(item, (0, mundo_1.multiplicadorDePreco)(camp) * (0, classe_1.multiplicadorDeVenda)(camp));
    if (cidade && cidade.tesouro < preco)
        return { ok: false, motivo: 'o mercado não tem moedas para essa compra' };
    if (cidade) {
        cidade.tesouro -= preco;
        if (item.lojas?.includes(camp.localAtual))
            cidade.estoque[itemId] = Math.min(20, (cidade.estoque[itemId] ?? 0) + 1);
    }
    ['arma', 'armadura', 'escudo', 'acessorio'].forEach((s) => {
        if (p.equipado[s] === itemId && (p.inventario[itemId] ?? 0) <= 1)
            delete p.equipado[s];
    });
    p.dinheiro += precoVenda(item, (0, mundo_1.multiplicadorDePreco)(camp) * (0, classe_1.multiplicadorDeVenda)(camp));
    p.inventario[itemId] = (p.inventario[itemId] ?? 0) - 1;
    if (p.inventario[itemId] <= 0)
        delete p.inventario[itemId];
    return { ok: true };
}
// Verbos concedidos pelos itens no inventário (GDD §13.6).
function verbosConcedidos(content, p) {
    const out = new Set();
    for (const id of Object.keys(p.inventario)) {
        const v = itemPorId(content, id)?.concedeVerbo;
        if (v)
            out.add(v);
    }
    return out;
}
