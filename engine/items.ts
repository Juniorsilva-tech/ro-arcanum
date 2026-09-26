// ARCANUM · Motor de itens: equipar, usar, comprar/vender, verbos concedidos (GDD §13.6, §34).
import type { Campaign, ContentBundle, Item, ItemSlot, Personagem } from './types';
import { aplicarEfeito } from './effects';
import { clampRecursos } from './character';
import { multiplicadorDePreco } from './mundo';
import { cidadeDoLocal, cidadeIdDoLocal } from './historiaViva';
import { descontoDeCompra, multiplicadorDeVenda } from './classe';
import { verificarDespertarNichirin } from './nichirin';

export function estoqueNaLoja(content: ContentBundle, camp: Campaign, itemId: string): number {
  const item = itemPorId(content, itemId);
  if (!item?.lojas?.includes(camp.localAtual)) return 0;
  const id = cidadeIdDoLocal(content, camp, camp.localAtual);
  if (id && ((camp.continuidade?.locais[id]?.integridade ?? 100) <= 20 || camp.continuidade?.locais[id]?.populacao === 0)) return 0;
  return cidadeDoLocal(content, camp, camp.localAtual)?.estoque[itemId] ?? (camp.vivo ? 0 : 12);
}

/**
 * Resolve um item pelo id. Passe o personagem sempre que ele estiver à mão:
 * sem ele, peças forjadas (engine/forja.ts) não são encontradas — ficam na
 * mochila como id solto, sem nome, sem dano e impossíveis de equipar.
 */
export function itemPorId(content: ContentBundle, id: string, p?: Personagem): Item | undefined {
  return content.itens.find((i) => i.id === id) ?? p?.itensForjados?.find((i) => i.id === id);
}

const SLOTS_EQUIPAVEIS: ItemSlot[] = ['arma', 'armadura', 'escudo', 'acessorio'];

export function ehEquipavel(item: Item): boolean {
  return SLOTS_EQUIPAVEIS.includes(item.slot);
}

export function armaEquipada(content: ContentBundle, p: Personagem): Item | undefined {
  return p.equipado.arma ? itemPorId(content, p.equipado.arma, p) : undefined;
}

// Bônus de defesa vindo de armadura + escudo equipados.
export function bonusDefesaEquip(content: ContentBundle, p: Personagem): number {
  let b = 0;
  for (const id of [p.equipado.armadura, p.equipado.escudo]) {
    if (!id) continue;
    const it = itemPorId(content, id, p);
    if (!it) continue;
    b += it.defesa ?? 0;
    if (it.tempera && it.tempera.cargas > 0) {
      b += it.tempera.bonusDefesa;
    }
  }
  return b;
}

// Peso carregado total.
export function cargaAtual(content: ContentBundle, p: Personagem): number {
  let total = 0;
  for (const [id, qtd] of Object.entries(p.inventario)) {
    total += (itemPorId(content, id, p)?.peso ?? 0) * qtd;
  }
  return Math.round(total * 10) / 10;
}

export function equipar(content: ContentBundle, camp: Campaign, itemId: string): { ok: boolean; motivo?: string } {
  const p = camp.personagem;
  if ((p.inventario[itemId] ?? 0) <= 0) return { ok: false, motivo: 'você não tem esse item' };
  const item = itemPorId(content, itemId, p);
  if (!item) return { ok: false, motivo: 'item desconhecido' };
  if (!ehEquipavel(item)) return { ok: false, motivo: 'não é equipável' };
  p.equipado[item.slot as 'arma' | 'armadura' | 'escudo' | 'acessorio'] = itemId;
  if (item.slot === 'arma') {
    verificarDespertarNichirin(content, camp, item);
  }
  return { ok: true };
}

export function desequipar(camp: Campaign, slot: 'arma' | 'armadura' | 'escudo' | 'acessorio'): void {
  delete camp.personagem.equipado[slot];
}

export function usarConsumivel(
  content: ContentBundle,
  camp: Campaign,
  itemId: string,
): { ok: boolean; motivo?: string } {
  const p = camp.personagem;
  if ((p.inventario[itemId] ?? 0) <= 0) return { ok: false, motivo: 'você não tem esse item' };
  const item = itemPorId(content, itemId, p);
  if (!item) return { ok: false, motivo: 'item desconhecido' };
  if (item.slot !== 'consumivel' || !item.efeitosUso) return { ok: false, motivo: 'não dá para usar isso' };
  for (const ef of item.efeitosUso) aplicarEfeito(camp, ef);
  // consome uma unidade
  p.inventario[itemId] = (p.inventario[itemId] ?? 0) - 1;
  if (p.inventario[itemId] <= 0) delete p.inventario[itemId];
  clampRecursos(p);
  return { ok: true };
}

// O preço do dia: base do catálogo, desconto de barganha e o que o vale está
// vivendo (feira derruba, escassez levanta — ver mundo.ts).
export function precoCompra(item: Item, desconto = false, multiplicadorMundo = 1): number {
  return Math.max(1, Math.round(item.valor * (desconto ? 0.8 : 1) * multiplicadorMundo));
}

export function precoVenda(item: Item, multiplicadorMundo = 1): number {
  return Math.max(1, Math.floor(item.valor * 0.4 * multiplicadorMundo));
}

// Itens à venda num local (GDD §7 serviços).
export function itensDaLoja(content: ContentBundle, localId: string): Item[] {
  return content.itens.filter((i) => i.lojas?.includes(localId));
}

export function comprar(
  content: ContentBundle,
  camp: Campaign,
  itemId: string,
  desconto = false,
): { ok: boolean; motivo?: string } {
  const p = camp.personagem;
  const item = itemPorId(content, itemId);
  if (!item) return { ok: false, motivo: 'item desconhecido' };
  const preco = precoCompra(item, descontoDeCompra(camp, desconto), multiplicadorDePreco(camp));
  if (camp.combate && !camp.combate.terminado) return { ok: false, motivo: 'termine o combate primeiro' };
  if (estoqueNaLoja(content, camp, itemId) <= 0) return { ok: false, motivo: 'item indisponível nesta loja ou serviço interrompido' };
  if (p.dinheiro < preco) return { ok: false, motivo: 'sem moedas suficientes' };
  p.dinheiro -= preco;
  const cidade = cidadeDoLocal(content, camp, camp.localAtual);
  if (cidade) { cidade.estoque[itemId]--; cidade.tesouro = Math.min(800, cidade.tesouro + preco); }
  p.inventario[itemId] = (p.inventario[itemId] ?? 0) + 1;
  return { ok: true };
}

export function vender(
  content: ContentBundle,
  camp: Campaign,
  itemId: string,
): { ok: boolean; motivo?: string } {
  const p = camp.personagem;
  if ((p.inventario[itemId] ?? 0) <= 0) return { ok: false, motivo: 'você não tem esse item' };
  const item = itemPorId(content, itemId, p);
  if (!item) return { ok: false, motivo: 'item desconhecido' };
  // desequipa se estiver vendendo o último equipado
  if (camp.combate && !camp.combate.terminado) return { ok: false, motivo: 'termine o combate primeiro' };
  if (!itensDaLoja(content, camp.localAtual).length) return { ok: false, motivo: 'não há comerciante aqui' };
  const cidade = cidadeDoLocal(content, camp, camp.localAtual);
  const preco = precoVenda(item, multiplicadorDePreco(camp) * multiplicadorDeVenda(camp));
  if (cidade && cidade.tesouro < preco) return { ok: false, motivo: 'o mercado não tem moedas para essa compra' };
  if (cidade) { cidade.tesouro -= preco; if (item.lojas?.includes(camp.localAtual)) cidade.estoque[itemId] = Math.min(20, (cidade.estoque[itemId] ?? 0) + 1); }
  (['arma', 'armadura', 'escudo', 'acessorio'] as const).forEach((s) => {
    if (p.equipado[s] === itemId && (p.inventario[itemId] ?? 0) <= 1) delete p.equipado[s];
  });
  p.dinheiro += precoVenda(item, multiplicadorDePreco(camp) * multiplicadorDeVenda(camp));
  p.inventario[itemId] = (p.inventario[itemId] ?? 0) - 1;
  if (p.inventario[itemId] <= 0) delete p.inventario[itemId];
  return { ok: true };
}

// Verbos concedidos pelos itens no inventário (GDD §13.6).
export function verbosConcedidos(content: ContentBundle, p: Personagem): Set<string> {
  const out = new Set<string>();
  for (const id of Object.keys(p.inventario)) {
    const v = itemPorId(content, id, p)?.concedeVerbo;
    if (v) out.add(v);
  }
  return out;
}
