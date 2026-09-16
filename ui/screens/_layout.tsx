// ARCANUM · Casca de página e cabeçalho de navegação (GDD §31).
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cores, fontes, esp } from '../theme';
import { useGame, type Tela } from '../store';

export function Pagina({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.conteudo, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

// Ícones sem rótulo, com significado (GDD §31). Aqui, glifos monoespaçados.
const ICONES: { tela: Tela; glifo: string; nome: string }[] = [
  { tela: 'mapa', glifo: '⌖', nome: 'Mapa' },
  { tela: 'livro', glifo: '❧', nome: 'Livro' },
  { tela: 'inventario', glifo: '⚔', nome: 'Inventário' },
  { tela: 'missoes', glifo: '✦', nome: 'Missões' },
  { tela: 'vinculos', glifo: '⚭', nome: 'Vínculos' },
  { tela: 'ficha', glifo: '✎', nome: 'Ficha' },
  { tela: 'cronica', glifo: '≡', nome: 'Crônica' },
  { tela: 'config', glifo: '⚙', nome: 'Config' },
];

export function CabecalhoJogo() {
  const irPara = useGame((s) => s.irPara);
  const camp = useGame((s) => s.camp);
  const content = useGame((s) => s.content);
  if (!camp || !content) return null;
  const acento = content.cenario.acentoCor;
  return (
    <View style={styles.cabecalho}>
      <Pressable onPress={() => irPara('entrada')} accessibilityRole="button">
        <Text style={[styles.marca, { color: acento }]}>ARCANUM</Text>
      </Pressable>
      <View style={styles.icones}>
        {ICONES.map((i) => (
          <Pressable 
            key={i.tela} 
            onPress={() => irPara(i.tela)} 
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={i.nome}
            style={({ pressed }) => (pressed ? { opacity: 0.7, transform: [{ scale: 0.95 }] } : null)}
          >
            <Text style={styles.icone}>
              {i.glifo}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function BarraVoltar({ titulo }: { titulo: string }) {
  const voltar = useGame((s) => s.voltar);
  return (
    <View style={styles.barraVoltar}>
      <Pressable 
        onPress={voltar} 
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={({ pressed }) => [styles.voltarBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
      >
        <Text style={styles.voltarGlifo}>‹</Text>
        <Text style={styles.voltarTxt}>voltar</Text>
      </Pressable>
      <Text style={styles.barraTitulo}>{titulo}</Text>
      <View style={{ width: 60 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: cores.bistre },
  conteudo: { padding: esp.lg, paddingBottom: esp.xxl },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: esp.md,
  },
  marca: { fontFamily: fontes.serifSemi, fontSize: 20, letterSpacing: 3 },
  icones: { flexDirection: 'row', gap: esp.lg },
  icone: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 18 },
  barraVoltar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: esp.lg,
  },
  voltarBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 60 },
  voltarGlifo: { fontFamily: fontes.serif, color: cores.ouro, fontSize: 24, marginTop: -4 },
  voltarTxt: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 12 },
  barraTitulo: {
    fontFamily: fontes.mono,
    color: cores.mudo,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
