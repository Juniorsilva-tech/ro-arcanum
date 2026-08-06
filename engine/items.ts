// ARCANUM · Motor de itens: equipar, usar, comprar/vender, verbos concedidos (GDD §13.6, §34).
import type { Campaign, ContentBundle, Item, ItemSlot, Personagem } from './types';
import { aplicarEfeito } from './effects';
import { clampRecursos } from './character';

export function itemPorId(content: ContentBundle, id: string): Item | undefined {
  return content.itens.find((i) => i.id === id);
}

const SLOTS_EQUIPAVEIS: ItemSlot[] = ['arma', 'armadura', 'escudo', 'acessorio'];

export function ehEquipavel(item: Item): boolean {
  return SLOTS_EQUIPAVEIS.includes(item.slot);
}

export function armaEquipada(content: ContentBundle, p: Personagem): Item | undefined {
  return p.equipado.arma ? itemPorId(content, p.equipado.arma) : undefined;
}

// Bônus de defesa vindo de armadura + escudo equipados.
export function bonusDefesaEquip(content: ContentBundle, p: Personagem): number {
  let b = 0;
  for (const id of [p.equipado.armadura, p.equipado.escudo]) {
    if (!id) continue;
    b += itemPorId(content, id)?.defesa ?? 0;
  }
  return b;
}

// Peso carregado total.
export function cargaAtual(content: ContentBundle, p: Personagem): number {
  let total = 0;
  for (const [id, qtd] of Object.entries(p.inventario)) {
    total += (itemPorId(content, id)?.peso ?? 0) * qtd;
  }
  return Math.round(total * 10) / 10;
}

export function equipar(content: ContentBundle, camp: Campaign, itemId: string): { ok: boolean; motivo?: string } {
  const p = camp.personagem;
  if ((p.inventario[itemId] ?? 0) <= 0) return { ok: false, motivo: 'você não tem esse item' };
  const item = itemPorId(content, itemId);
  if (!item) return { ok: false, motivo: 'item desconhecido' };
  if (!ehEquipavel(item)) return { ok: false, motivo: 'não é equipável' };
  p.equipado[item.slot as 'arma' | 'armadura' | 'escudo' | 'acessorio'] = itemId;
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
  const item = itemPorId(content, itemId);
  if (!item) return { ok: false, motivo: 'item desconhecido' };
  if (item.slot !== 'consumivel' || !item.efeitosUso) return { ok: false, motivo: 'não dá para usar isso' };
  for (const ef of item.efeitosUso) aplicarEfeito(camp, ef);
  // consome uma unidade
  p.inventario[itemId] = (p.inventario[itemId] ?? 0) - 1;
  if (p.inventario[itemId] <= 0) delete p.inventario[itemId];
  clampRecursos(p);
  return { ok: true };
}

export function precoCompra(item: Item, desconto = false): number {
  return Math.max(1, Math.round(item.valor * (desconto ? 0.8 : 1)));
}

export function precoVenda(item: Item): number {
  return Math.max(1, Math.floor(item.valor * 0.4));
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
  const preco = precoCompra(item, desconto);
  if (p.dinheiro < preco) return { ok: false, motivo: 'sem moedas suficientes' };
  p.dinheiro -= preco;
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
  const item = itemPorId(content, itemId);
  if (!item) return { ok: false, motivo: 'item desconhecido' };
  // desequipa se estiver vendendo o último equipado
  (['arma', 'armadura', 'escudo', 'acessorio'] as const).forEach((s) => {
    if (p.equipado[s] === itemId && (p.inventario[itemId] ?? 0) <= 1) delete p.equipado[s];
  });
  p.dinheiro += precoVenda(item);
  p.inventario[itemId] = (p.inventario[itemId] ?? 0) - 1;
  if (p.inventario[itemId] <= 0) delete p.inventario[itemId];
  return { ok: true };
}

// Verbos concedidos pelos itens no inventário (GDD §13.6).
export function verbosConcedidos(content: ContentBundle, p: Personagem): Set<string> {
  const out = new Set<string>();
  for (const id of Object.keys(p.inventario)) {
    const v = itemPorId(content, id)?.concedeVerbo;
    if (v) out.add(v);
  }
  return out;
}
