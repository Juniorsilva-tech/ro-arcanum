// ARCANUM · Inventário e equipamento (GDD §32 P1, §13.6).
import React, { useState } from 'react';
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
  ondeForjar,
  forjaDaCidade,
  receitasDisponiveis,
  COMBUSTIVEL,
  CATALISADORES,
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
  const acaoMundo = useGame((s) => s.acaoMundo);
  const p = camp.personagem;
  const [ultimaForja, setUltimaForja] = useState<string | null>(null);
  const [catalisadorSel, setCatalisadorSel] = useState<string | undefined>(undefined);
  const [aba, setAba] = useState<'mochila' | 'forja'>('mochila');

  // A forja só aparece onde se pode forjar (engine/forja.ts decide o lugar).
  const onde = ondeForjar(content, camp);
  const carvao = p.inventario[COMBUSTIVEL] ?? 0;
  // Na fundição de Corveira o fogo é da cidade: a peça não gasta carvão.
  const fundicao = forjaDaCidade(content, camp);
  const semCarvao = !!fundicao?.efeitos.forjaSemCarvao;
  const temFogo = semCarvao || carvao >= 1;
  const receitas = onde.pode ? receitasDisponiveis(camp).filter((r) => r.temMaterial) : [];
  const forjarPeca = async (molde: string, material: string, catalisador?: string) => {
    const antes = p.itensForjados?.length ?? 0;
    await acaoMundo({ tipo: 'forjar', molde, material, catalisador });
    const depois = useGame.getState().camp?.personagem.itensForjados ?? [];
    setUltimaForja(depois.length > antes ? `Saiu da bigorna: ${depois[depois.length - 1].nome}.` : 'A forja não pegou. Veja o registro.');
  };

  const carga = cargaAtual(content, p);
  const cargaMax = derivados(p).cargaMax;
  const defBonus = bonusDefesaEquip(content, p);
  const d = derivados(p, defBonus);

  const entradas = Object.entries(p.inventario)
    .map(([id, qtd]) => ({ item: itemPorId(content, id, camp.personagem), qtd, id }))
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

      {onde.pode && (
        <View style={styles.seletorAbas}>
          <Pressable
            style={[styles.abaBtn, aba === 'mochila' && styles.abaBtnAtiva]}
            onPress={() => setAba('mochila')}
          >
            <Text style={[styles.abaBtnTxt, aba === 'mochila' && styles.abaBtnTxtAtiva]}>
              🎒 Mochila & Equipamento
            </Text>
          </Pressable>
          <Pressable
            style={[styles.abaBtn, aba === 'forja' && styles.abaBtnAtiva]}
            onPress={() => setAba('forja')}
          >
            <Text style={[styles.abaBtnTxt, aba === 'forja' && styles.abaBtnTxtAtiva]}>
              ⚒️ Bigorna & Forja ({receitas.length})
            </Text>
          </Pressable>
        </View>
      )}

      {(!onde.pode || aba === 'mochila') && (
        <>
          <Divisor label="Equipado" />
      {slots.map((s) => {
        const id = p.equipado[s];
        const item = id ? itemPorId(content, id, camp.personagem) : undefined;
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
              {item?.afiacao && item.afiacao.cargas > 0 ? (
                <TextoMono style={{ color: cores.ouro }}>
                  afiada (+{item.afiacao.bonusDano} dano, {item.afiacao.cargas} combates)
                </TextoMono>
              ) : null}
              {item?.tempera && item.tempera.cargas > 0 ? (
                <TextoMono style={{ color: cores.ouro }}>
                  temperada (+{item.tempera.bonusDefesa} def, {item.tempera.cargas} combates)
                </TextoMono>
              ) : null}
              {item?.propriedadesEspeciais && item.propriedadesEspeciais.length > 0 ? (
                <TextoMono style={{ color: cores.violeta }}>
                  [{item.propriedadesEspeciais.join(', ')}]
                </TextoMono>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {onde.pode && carvao >= 1 && item && (s === 'arma' || s === 'armadura' || s === 'escudo') && (
                <Pressable
                  style={[styles.miniBtn, { borderColor: cores.ouro, marginRight: esp.xs }]}
                  onPress={() => acaoMundo({ tipo: 'temperar', itemId: id! })}
                >
                  <Text style={[styles.miniBtnTxt, { color: cores.ouro }]}>
                    {s === 'arma' ? 'afiar' : 'temperar'}
                  </Text>
                </Pressable>
              )}
              {item && (
                <Pressable style={styles.miniBtn} onPress={() => desequiparSlot(s)}>
                  <Text style={styles.miniBtnTxt}>tirar</Text>
                </Pressable>
              )}
            </View>
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
              {item.afiacao && item.afiacao.cargas > 0 && (
                <TextoMono style={{ color: cores.ouro }}>· afiada (+{item.afiacao.bonusDano})</TextoMono>
              )}
              {item.tempera && item.tempera.cargas > 0 && (
                <TextoMono style={{ color: cores.ouro }}>· temperada (+{item.tempera.bonusDefesa})</TextoMono>
              )}
              {item.propriedadesEspeciais && item.propriedadesEspeciais.length > 0 && (
                <TextoMono style={{ color: cores.violeta }}>· [{item.propriedadesEspeciais.join(', ')}]</TextoMono>
              )}
              {item.corNichirin && (
                <TextoMono style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                  · Nichirin [{item.corNichirinNome ?? item.corNichirin}]
                </TextoMono>
              )}
              {item.raridade !== 'comum' && <Selo texto={item.raridade} cor={corRaridade(item.raridade)} />}
            </View>
            <TextoMono style={{ color: cores.mudo }}>{item.descricao}</TextoMono>
            {item.historia?.map((par, i) => <TextoMono key={i} style={{ color: cores.mudo, fontStyle: 'italic', marginTop: 4 }}>{par}</TextoMono>)}
            <TextoMono style={{ color: cores.linha }}>
              {rotuloSlot(item.slot)} · peso {item.peso} · vale {item.valor}
              {item.dano ? ` · dano ${item.dano.base}` : ''}
              {item.defesa ? ` · +${item.defesa} def` : ''}
              {item.corNichirinAfinidade ? ` · ${item.corNichirinAfinidade}` : ''}
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
            {onde.pode && (item.slot === 'arma' || item.slot === 'armadura' || item.slot === 'escudo') && item.raridade !== 'unica' && item.raridade !== 'mitica' && !item.contraOni && !item.id.includes('nichirin') && p.equipado[item.slot as 'arma'] !== id && (
              <Pressable style={[styles.miniBtn, { borderColor: cores.cinabrio }]} onPress={() => acaoMundo({ tipo: 'desmanchar', itemId: id })}>
                <Text style={[styles.miniBtnTxt, { color: cores.cinabrio }]}>desmanchar</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
        </>
      )}

      {onde.pode && aba === 'forja' && (
        <>
          <Divisor label="Bigorna & Forja" />
          <TextoMono style={{ color: cores.mudo }}>
            {onde.ferreira ? `${onde.ferreira.nome} empresta a bigorna e olha o seu trabalho.` : fundicao ? `${fundicao.nome}: a bigorna do pátio usa o fogo da cidade.` : 'Há uma forja acesa aqui.'}
            {semCarvao ? ' Aqui a peça não gasta carvão; leva quatro períodos do dia.' : ` Carvão: ${carvao}. Cada peça gasta um carvão e quatro períodos do dia.`}
          </TextoMono>
          {ultimaForja && <TextoMono style={{ color: cores.verdigris }}>{ultimaForja}</TextoMono>}
          {!temFogo && <TextoMono>Sem carvão a forja é só uma pedra vazia.</TextoMono>}
          {temFogo && (
            (() => {
              const catsDisponiveis = CATALISADORES.filter(c => (p.inventario[c.item] ?? 0) > 0);
              if (catsDisponiveis.length === 0) return null;
              return (
                <View style={{ marginVertical: esp.sm }}>
                  <TextoMono style={{ color: cores.ouro }}>Catalisador (opcional):</TextoMono>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: esp.xs, marginTop: esp.xs }}>
                    <Pressable
                      style={[styles.miniBtn, !catalisadorSel ? { borderColor: cores.verdigris } : { opacity: 0.6 }]}
                      onPress={() => setCatalisadorSel(undefined)}
                    >
                      <Text style={[styles.miniBtnTxt, !catalisadorSel ? { color: cores.verdigris } : undefined]}>nenhum</Text>
                    </Pressable>
                    {catsDisponiveis.map(c => (
                      <Pressable
                        key={c.item}
                        style={[styles.miniBtn, catalisadorSel === c.item ? { borderColor: cores.ouro } : { opacity: 0.6 }]}
                        onPress={() => setCatalisadorSel(c.item === catalisadorSel ? undefined : c.item)}
                      >
                        <Text style={[styles.miniBtnTxt, catalisadorSel === c.item ? { color: cores.ouro } : undefined]}>{c.rotulo}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })()
          )}
          {temFogo && receitas.length === 0 && (
            <TextoMono>Falta material: minério, prata, lascas de gárgula, ossos, dentes, garras, couro ou peles.</TextoMono>
          )}
          {temFogo &&
            receitas.map(({ molde, material }) => (
              <View key={`${molde.id}-${material.item}`} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.slotItem}>
                    {molde.nome} de {material.rotulo}
                  </Text>
                  <TextoMono style={{ color: cores.linha }}>
                    {molde.quantidade}× {material.rotulo} · {rotuloSlot(molde.slot)}
                    {molde.dano ? ` · dano base ${molde.dano.base}` : ''}
                    {molde.defesa !== undefined ? ` · defesa base ${molde.defesa}` : ''}
                  </TextoMono>
                </View>
                <Pressable style={styles.miniBtn} onPress={() => forjarPeca(molde.id, material.item, catalisadorSel)}>
                  <Text style={styles.miniBtnTxt}>forjar</Text>
                </Pressable>
              </View>
            ))}
        </>
      )}

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
  seletorAbas: {
    flexDirection: 'row',
    gap: esp.sm,
    marginVertical: esp.md,
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
    paddingBottom: esp.xs,
  },
  abaBtn: {
    paddingVertical: esp.xs,
    paddingHorizontal: esp.sm,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  abaBtnAtiva: {
    borderColor: cores.ouro,
    backgroundColor: 'rgba(207, 168, 45, 0.08)',
  },
  abaBtnTxt: {
    fontFamily: fontes.serifMedium,
    fontSize: 14,
    color: cores.mudo,
  },
  abaBtnTxtAtiva: {
    color: cores.ouro,
    fontWeight: '600',
  },
});
