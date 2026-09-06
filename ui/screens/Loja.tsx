// ARCANUM · Loja: comprar e vender (GDD §13.2 serviços, §32 P1).
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Pagina, BarraVoltar } from './_layout';
import { TextoSerif, TextoMono, Divisor, Rotulo, Selo } from '../components';
import { cores, fontes, esp, raio } from '../theme';
import { useGame } from '../store';
import {
  itemPorId,
  itensDaLoja,
  precoCompra,
  multiplicadorDePreco,
  precoVenda,
  type Item,
  estoqueNaLoja,
} from '@/engine';

export function Loja() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const comprarItem = useGame((s) => s.comprarItem);
  const venderItem = useGame((s) => s.venderItem);
  const p = camp.personagem;

  const local = content.locais.find((l) => l.id === camp.localAtual)!;
  const desconto = camp.flags['desconto'] === true;
  // Feira derruba o preço, escassez levanta: a praça responde ao vale.
  const multMundo = multiplicadorDePreco(camp);
  const aVenda = itensDaLoja(content, local.id);

  const meus = Object.entries(p.inventario)
    .map(([id, qtd]) => ({ item: itemPorId(content, id), qtd, id }))
    .filter((e) => e.item) as { item: Item; qtd: number; id: string }[];

  const temLoja = aVenda.length > 0;

  return (
    <Pagina>
      <BarraVoltar titulo="Loja" />
      <View style={styles.topo}>
        <TextoSerif style={{ fontSize: 22 }}>{local.nome}</TextoSerif>
        <Text style={styles.moedas}>{p.dinheiro} moedas</Text>
      </View>
      {desconto && <Selo texto="preço com desconto" cor={cores.verdigris} />}

      {!temLoja && (
        <TextoMono style={{ marginTop: esp.md }}>
          Aqui não se vende nada de balcão. Tente o mercado.
        </TextoMono>
      )}

      {temLoja && (
        <>
          <Divisor label="À venda" />
          {aVenda.map((item) => {
            const preco = precoCompra(item, desconto, multMundo);
            const estoque = estoqueNaLoja(content, camp, item.id);
            const podePagar = p.dinheiro >= preco && estoque > 0;
            return (
              <View key={item.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <TextoSerif style={{ fontSize: 17, color: cores.vellum }}>{item.nome}</TextoSerif>
                  <TextoMono style={{ color: cores.mudo }}>{item.descricao}</TextoMono>
                  <TextoMono style={{ color: cores.linha }}>
                    {item.dano ? `dano ${item.dano.base} · ` : ''}
                    {item.defesa ? `+${item.defesa} def · ` : ''}
                    peso {item.peso}
                    {` · estoque ${estoque}`}
                  </TextoMono>
                </View>
                <Pressable
                  style={[styles.precoBtn, !podePagar && { opacity: 0.4 }]}
                  onPress={() => podePagar && comprarItem(item.id)}
                >
                  <Text style={styles.precoTxt}>{preco}</Text>
                  <Text style={styles.precoSub}>comprar</Text>
                </Pressable>
              </View>
            );
          })}
        </>
      )}

      <Divisor label="Vender da mochila" />
      {meus.length === 0 && <TextoMono>Nada para vender.</TextoMono>}
      {meus.map(({ item, qtd, id }) => (
        <View key={id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextoSerif style={{ fontSize: 17, color: cores.vellum }}>
              {item.nome}
              {qtd > 1 ? ` ×${qtd}` : ''}
            </TextoSerif>
            <TextoMono style={{ color: cores.linha }}>vale {item.valor}</TextoMono>
          </View>
          <Pressable style={[styles.precoBtn, { borderColor: cores.mudo }]} onPress={() => venderItem(id)}>
            <Text style={[styles.precoTxt, { color: cores.mudo }]}>{precoVenda(item, multMundo)}</Text>
            <Text style={styles.precoSub}>vender</Text>
          </Pressable>
        </View>
      ))}
      <View style={{ height: esp.lg }} />
      <Rotulo>Barganhe (verbo "Barganhar") para abrir desconto antes de comprar.</Rotulo>
    </Pagina>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: esp.xs },
  moedas: { fontFamily: fontes.serifSemi, color: cores.ouro, fontSize: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: esp.md,
    borderBottomWidth: 1,
    borderBottomColor: cores.fundo3,
    gap: esp.sm,
  },
  precoBtn: {
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: raio.md,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
    alignItems: 'center',
    minWidth: 64,
  },
  precoTxt: { fontFamily: fontes.monoMedium, color: cores.ouro, fontSize: 16 },
  precoSub: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10 },
});
