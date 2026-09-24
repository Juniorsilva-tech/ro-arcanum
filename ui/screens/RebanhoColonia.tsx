// ARCANUM · Os animais da colônia (sessão 58, etapa C): o que há, o que cada
// um dá, quanto o pasto aguenta, o que se compra na região e o que se abate.
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { TextoMono, TextoSerif, Card, Divisor } from '../components';
import { cores, esp } from '../theme';
import { useGame } from '../store';
import {
  ANIMAIS, ESPECIES, fomeDoRebanho, pastoDoDia, aVendaNaEstacao, segurancaDosCavalos, sitioDe, eficiencia,
  type AnimalColonia,
} from '@/engine';

export function RebanhoDaColonia() {
  const camp = useGame(s => s.camp)!;
  const content = useGame(s => s.content)!;
  const comprar = useGame(s => s.comprarAnimaisAcao);
  const abater = useGame(s => s.abaterAnimaisAcao);
  const f = camp.feudo;
  const s = f?.fundado ? sitioDe(content, f.sitio) : undefined;
  if (!f || !s) return null;
  const inverno = camp.calendario.estacao === 'inverno';
  const fome = fomeDoRebanho(f);
  const pasto = pastoDoDia(s, inverno);
  const rel = f.ultimoRelatorio?.rebanho;
  const temAlgum = ESPECIES.some(e => (f.rebanhos?.[e] ?? 0) > 0);
  const aVenda = (Object.keys(s.animais) as AnimalColonia[]).filter(e => (s.animais[e] ?? 0) > 0);

  return (
    <View style={{ gap: esp.md }}>
      <Card>
        <TextoSerif style={{ fontSize: 20 }}>Pasto e feno</TextoSerif>
        <TextoMono>
          O rebanho come {fome.toFixed(1)} por dia; o pasto de {s.nome} dá {pasto.toFixed(1)}
          {inverno ? ' (inverno: quase nada)' : ''}.{' '}
          {fome > pasto ? `Faltam ${(fome - pasto).toFixed(1)}, que saem do celeiro como feno.` : 'Não precisa de feno.'}
        </TextoMono>
        <TextoMono style={{ color: cores.mudo, marginTop: 4 }}>
          Quem cuida do rebanho: rende {Math.round(eficiencia(f, 'rebanho') * 100)}%. Rebanho apertado adoece mais; sem feno, animal morre.
        </TextoMono>
        {rel && (rel.comida > 0 || rel.ouro > 0 || rel.material > 0) && (
          <TextoMono style={{ marginTop: 4 }}>
            Ontem: {rel.comida.toFixed(1)} de comida, {rel.ouro.toFixed(1)} de ouro, {rel.material.toFixed(1)} de material
            {rel.feno > 0 ? `, ${rel.feno.toFixed(1)} de feno gasto` : ''}.
          </TextoMono>
        )}
        {segurancaDosCavalos(f) > 0 && <TextoMono>Patrulha montada: +{segurancaDosCavalos(f).toFixed(1)} de segurança.</TextoMono>}
      </Card>

      <Divisor label="os animais" />
      {!temAlgum && <TextoMono>Nenhum animal ainda.</TextoMono>}
      {ESPECIES.filter(e => (f.rebanhos?.[e] ?? 0) > 0).map(e => {
        const n = f.rebanhos![e]!;
        const a = ANIMAIS[e];
        return (
          <Card key={e}>
            <View style={styles.linha}>
              <TextoSerif style={{ fontSize: 17 }}>{n} {n === 1 ? a.nome : a.plural}</TextoSerif>
              {a.carne > 0 && (
                <Pressable onPress={() => abater(e, 1)} style={styles.chip}>
                  <Text style={styles.chipTxt}>abater 1 · +{a.carne} comida</Text>
                </Pressable>
              )}
            </View>
            <TextoMono style={{ fontSize: 12, color: cores.mudo }}>{a.funcao} · come {a.come} por dia cada</TextoMono>
          </Card>
        );
      })}

      <Divisor label="à venda na região nesta estação" />
      {aVenda.map(e => {
        const a = ANIMAIS[e];
        const resta = aVendaNaEstacao(camp, s, e);
        return (
          <Card key={e}>
            <View style={styles.linha}>
              <TextoMono>{a.plural} · {a.preco} de ouro cada · restam {resta}</TextoMono>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable disabled={resta < 1} onPress={() => comprar(e, 1)} style={[styles.chip, resta < 1 && { opacity: 0.4 }]}>
                  <Text style={styles.chipTxt}>+1</Text>
                </Pressable>
                <Pressable disabled={resta < 1} onPress={() => comprar(e, 5)} style={[styles.chip, resta < 1 && { opacity: 0.4 }]}>
                  <Text style={styles.chipTxt}>+5</Text>
                </Pressable>
              </View>
            </View>
            <TextoMono style={{ fontSize: 12, color: cores.mudo }}>{a.funcao}</TextoMono>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: cores.linha, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipTxt: { color: cores.vellum, fontSize: 12 },
});
