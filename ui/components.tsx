// ARCANUM · Componentes visuais compartilhados (GDD §30, §31).
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { cores, fontes, esp, raio } from './theme';

export function TextoSerif({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.serif, style]}>{children}</Text>;
}

export function TextoMono({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.mono, style]}>{children}</Text>;
}

export function Titulo({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.titulo, style]}>{children}</Text>;
}

export function Rotulo({ children, cor }: { children: React.ReactNode; cor?: string }) {
  return <Text style={[styles.rotulo, cor ? { color: cor } : null]}>{children}</Text>;
}

export function Card({
  children,
  style,
  onPress,
  acento,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  acento?: string;
}) {
  const conteudo = (
    <View
      style={[
        styles.card,
        acento ? { borderLeftColor: acento, borderLeftWidth: 3 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}>
        {conteudo}
      </Pressable>
    );
  }
  return conteudo;
}

export function Botao({
  titulo,
  sub,
  onPress,
  variante = 'primario',
  disabled,
  motivo,
}: {
  titulo: string;
  sub?: string;
  onPress?: () => void;
  variante?: 'primario' | 'fantasma' | 'perigo' | 'acento';
  disabled?: boolean;
  motivo?: string; // GDD §4.3: verbo indisponível mostra o porquê
}) {
  const cor =
    variante === 'perigo'
      ? cores.cinabrio
      : variante === 'acento'
        ? cores.ouro
        : cores.linha;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.botao,
        {
          borderColor: cor,
          backgroundColor: variante === 'primario' ? cores.couro : 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.botaoTexto,
          disabled ? { textDecorationLine: 'line-through' } : null,
          variante === 'perigo' ? { color: cores.cinabrio } : null,
        ]}
      >
        {titulo}
      </Text>
      {(sub || motivo) && (
        <Text style={styles.botaoSub}>{disabled && motivo ? motivo : sub}</Text>
      )}
    </Pressable>
  );
}

export function Medidor({
  rotulo,
  valor,
  max,
  cor,
  compacto,
}: {
  rotulo: string;
  valor: number;
  max: number;
  cor: string;
  compacto?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, max > 0 ? valor / max : 0));
  return (
    <View style={{ marginBottom: compacto ? esp.xs : esp.sm }}>
      <View style={styles.medidorTopo}>
        <Text style={styles.medidorRotulo}>{rotulo}</Text>
        <Text style={[styles.medidorValor, { color: cor }]}>
          {Math.round(valor)}
          {!compacto && `/${max}`}
        </Text>
      </View>
      <View style={styles.medidorTrilho}>
        <View style={[styles.medidorPreenche, { width: `${pct * 100}%`, backgroundColor: cor }]} />
      </View>
    </View>
  );
}

export function Divisor({ label }: { label?: string }) {
  if (!label) return <View style={styles.divisor} />;
  return (
    <View style={styles.divisorLabelWrap}>
      <View style={styles.divisorLinha} />
      <Text style={styles.divisorLabel}>{label}</Text>
      <View style={styles.divisorLinha} />
    </View>
  );
}

export function Carregando({ texto }: { texto?: string }) {
  return (
    <View style={styles.carregando}>
      <ActivityIndicator color={cores.ouro} />
      {texto && <Text style={styles.carregandoTxt}>{texto}</Text>}
    </View>
  );
}

export function Selo({ texto, cor }: { texto: string; cor?: string }) {
  return (
    <View style={[styles.selo, cor ? { borderColor: cor } : null]}>
      <Text style={[styles.seloTexto, cor ? { color: cor } : null]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  serif: { fontFamily: fontes.serif, color: cores.vellum, fontSize: 20, lineHeight: 30 },
  mono: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 12 },
  titulo: { fontFamily: fontes.serifSemi, color: cores.vellum, fontSize: 28, lineHeight: 34 },
  rotulo: {
    fontFamily: fontes.monoMedium,
    color: cores.mudo,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: cores.fundo2,
    borderColor: cores.linha,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: esp.lg,
    marginBottom: esp.md,
  },
  botao: {
    borderWidth: 1,
    borderRadius: raio.md,
    paddingVertical: esp.md,
    paddingHorizontal: esp.lg,
    marginBottom: esp.sm,
  },
  botaoTexto: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 18 },
  botaoSub: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11, marginTop: 2 },
  medidorTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  medidorRotulo: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11 },
  medidorValor: { fontFamily: fontes.monoMedium, fontSize: 11 },
  medidorTrilho: {
    height: 4,
    backgroundColor: cores.couro,
    borderRadius: 2,
    overflow: 'hidden',
  },
  medidorPreenche: { height: 4, borderRadius: 2 },
  divisor: { height: 1, backgroundColor: cores.linha, marginVertical: esp.lg },
  divisorLabelWrap: { flexDirection: 'row', alignItems: 'center', marginVertical: esp.lg, gap: esp.sm },
  divisorLinha: { flex: 1, height: 1, backgroundColor: cores.linha },
  divisorLabel: {
    fontFamily: fontes.mono,
    color: cores.mudo,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  carregando: { flexDirection: 'row', alignItems: 'center', gap: esp.sm, paddingVertical: esp.md },
  carregandoTxt: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 12 },
  selo: {
    borderWidth: 1,
    borderColor: cores.mudo,
    borderRadius: raio.sm,
    paddingHorizontal: esp.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  seloTexto: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10, letterSpacing: 1 },
});
