// ARCANUM · Inventário e equipamento (GDD §32 P1, §13.6).
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Pagina, BarraVoltar } from './_layout';
import { TextoSerif, TextoMono, Divisor, Selo, Botao } from '../components';
import { cores, fontes, esp, raio } from '../theme';
import { useGame } from '../store';
import {
  itemPorId,
  ehEquipavel,
  cargaAtual,
  bonusDefesaEquip,
  derivados,
  type Item,
  type ItemSlot,
} from '@/engine';

const NOME_SLOT: Record<string, string> = {
  arma: 'Arma',
  armadura: 'Armadura',
  escudo: 'Escudo',
  acessorio: 'Acessório',
};

function corRaridade(r?: string): string {
  switch (r) {
    case 'unica':
    case 'mitica':
      return cores.ouro;
    case 'proibida':
      return cores.cinabrio;
    case 'perdida':
      return cores.violeta;
    case 'rara':
      return cores.verdigris;
    case 'notavel':
      return cores.mudo;
    default:
      return cores.linha;
  }
}

export function Inventario() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const equiparItem = useGame((s) => s.equiparItem);
  const desequiparSlot = useGame((s) => s.desequiparSlot);
  const usarItem = useGame((s) => s.usarItem);
  const venderItem = useGame((s) => s.venderItem);
  const irPara = useGame((s) => s.irPara);
  const p = camp.personagem;

  const carga = cargaAtual(content, p);
  const cargaMax = derivados(p).cargaMax;
  const defBonus = bonusDefesaEquip(content, p);
  const d = derivados(p, defBonus);

  const entradas = Object.entries(p.inventario)
    .map(([id, qtd]) => ({ item: itemPorId(content, id), qtd, id }))
    .filter((e) => e.item) as { item: Item; qtd: number; id: string }[];

  const slots: ('arma' | 'armadura' | 'escudo' | 'acessorio')[] = ['arma', 'armadura', 'escudo', 'acessorio'];

  return (
    <Pagina>
      <BarraVoltar titulo="Inventário" />

      <View style={styles.topo}>
        <Text style={styles.moedas}>{p.dinheiro} moedas</Text>
        <Text style={styles.carga}>
          carga {carga}/{cargaMax} · defesa {d.defesa}
        </Text>
      </View>

      <Divisor label="Equipado" />
      {slots.map((s) => {
        const id = p.equipado[s];
        const item = id ? itemPorId(content, id) : undefined;
        return (
          <View key={s} style={styles.equipRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.slotNome}>{NOME_SLOT[s]}</Text>
              <Text style={styles.slotItem}>{item ? item.nome : '—'}</Text>
              {item?.dano && (
                <TextoMono style={{ color: cores.cinabrio }}>
                  dano {item.dano.base} · {item.dano.tipo}
                </TextoMono>
              )}
              {item?.defesa ? <TextoMono style={{ color: cores.verdigris }}>+{item.defesa} defesa</TextoMono> : null}
            </View>
            {item && (
              <Pressable style={styles.miniBtn} onPress={() => desequiparSlot(s)}>
                <Text style={styles.miniBtnTxt}>tirar</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <Divisor label="Mochila" />
      {entradas.length === 0 && <TextoMono>Sua mochila está vazia.</TextoMono>}
      {entradas.map(({ item, qtd, id }) => (
        <View key={id} style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.itemTitulo}>
              <TextoSerif style={{ fontSize: 18, color: cores.vellum }}>{item.nome}</TextoSerif>
              {qtd > 1 && <TextoMono>×{qtd}</TextoMono>}
              {item.raridade !== 'comum' && <Selo texto={item.raridade} cor={corRaridade(item.raridade)} />}
            </View>
            <TextoMono style={{ color: cores.mudo }}>{item.descricao}</TextoMono>
            <TextoMono style={{ color: cores.linha }}>
              {rotuloSlot(item.slot)} · peso {item.peso} · vale {item.valor}
              {item.dano ? ` · dano ${item.dano.base}` : ''}
              {item.defesa ? ` · +${item.defesa} def` : ''}
              {item.concedeVerbo ? ` · permite "${item.concedeVerbo}"` : ''}
            </TextoMono>
          </View>
          <View style={styles.acoes}>
            {ehEquipavel(item) && p.equipado[item.slot as 'arma'] !== id && (
              <Pressable style={styles.miniBtn} onPress={() => equiparItem(id)}>
                <Text style={styles.miniBtnTxt}>equipar</Text>
              </Pressable>
            )}
            {item.slot === 'consumivel' && (
              <Pressable style={[styles.miniBtn, { borderColor: cores.verdigris }]} onPress={() => usarItem(id)}>
                <Text style={[styles.miniBtnTxt, { color: cores.verdigris }]}>usar</Text>
              </Pressable>
            )}
            <Pressable style={[styles.miniBtn, { borderColor: cores.linha }]} onPress={() => venderItem(id)}>
              <Text style={[styles.miniBtnTxt, { color: cores.mudo }]}>vender</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={{ height: esp.lg }} />
      <Botao titulo="Ir à loja" variante="acento" onPress={() => irPara('loja')} />
    </Pagina>
  );
}

function rotuloSlot(s: ItemSlot): string {
  return (
    {
      arma: 'arma',
      armadura: 'armadura',
      escudo: 'escudo',
      acessorio: 'acessório',
      consumivel: 'consumível',
      ferramenta: 'ferramenta',
      material: 'material',
      misc: 'diverso',
    } as Record<ItemSlot, string>
  )[s];
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  moedas: { fontFamily: fontes.serifSemi, color: cores.ouro, fontSize: 22 },
  carga: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 12 },
  equipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: esp.sm,
    borderBottomWidth: 1,
    borderBottomColor: cores.fundo3,
    gap: esp.sm,
  },
  slotNome: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  slotItem: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 18 },
  itemRow: {
    paddingVertical: esp.md,
    borderBottomWidth: 1,
    borderBottomColor: cores.fundo3,
  },
  itemTitulo: { flexDirection: 'row', alignItems: 'center', gap: esp.sm, flexWrap: 'wrap' },
  acoes: { flexDirection: 'row', gap: esp.sm, marginTop: esp.sm },
  miniBtn: {
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: raio.sm,
    paddingHorizontal: esp.md,
    paddingVertical: 6,
  },
  miniBtnTxt: { fontFamily: fontes.mono, color: cores.ouro, fontSize: 12 },
});
