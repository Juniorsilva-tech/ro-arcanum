// ARCANUM · Componente de Banner Ilustrado de Local / Reino / Feudo.
// Aplica renderização de iluminação atmosférica em tempo real reagindo ao
// ciclo de períodos do dia (madrugada, manhã, tarde, entardecer, anoitecer, noite).
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  type StyleProp,
  type ViewStyle,
  type ImageSourcePropType,
} from 'react-native';
import { cores, fontes, esp, raio } from './theme';
import type { Periodo } from '@/engine';

export interface InfoIluminacao {
  filtroCor: string;
  tintCor: string;
  icone: string;
  rotulo: string;
  badgeCor: string;
  descricaoTempo: string;
  periodoGeral: 'dia' | 'tarde' | 'noite';
}

export const ILUMINACAO_POR_PERIODO: Record<Periodo, InfoIluminacao> = {
  madrugada: {
    filtroCor: 'rgba(5, 8, 24, 0.72)',
    tintCor: 'rgba(65, 100, 190, 0.14)',
    icone: '🌌',
    rotulo: 'Madrugada',
    badgeCor: '#7f9ad4',
    descricaoTempo: 'Luar gélido e vigília silenciosa sob o manto estrelado',
    periodoGeral: 'noite',
  },
  manha: {
    filtroCor: 'rgba(255, 235, 175, 0.10)',
    tintCor: 'rgba(255, 255, 255, 0.05)',
    icone: '🌅',
    rotulo: 'Manhã',
    badgeCor: '#f3c761',
    descricaoTempo: 'Primeiros raios de sol e brisa límpida da alvorada',
    periodoGeral: 'dia',
  },
  tarde: {
    filtroCor: 'rgba(255, 250, 220, 0.03)',
    tintCor: 'transparent',
    icone: '☀️',
    rotulo: 'Tarde',
    badgeCor: '#e5b83b',
    descricaoTempo: 'Sol a pino iluminando os baluartes e praças',
    periodoGeral: 'dia',
  },
  entardecer: {
    filtroCor: 'rgba(215, 80, 15, 0.32)',
    tintCor: 'rgba(180, 45, 10, 0.16)',
    icone: '🌇',
    rotulo: 'Entardecer',
    badgeCor: '#e27534',
    descricaoTempo: 'Ocaso dourado e sombras longas sobre a terra',
    periodoGeral: 'tarde',
  },
  anoitecer: {
    filtroCor: 'rgba(75, 25, 70, 0.46)',
    tintCor: 'rgba(25, 10, 40, 0.25)',
    icone: '🌆',
    rotulo: 'Anoitecer',
    badgeCor: '#ba6bb0',
    descricaoTempo: 'Crepúsculo carmesim e primeiras tochas acesas nos muros',
    periodoGeral: 'tarde',
  },
  noite: {
    filtroCor: 'rgba(8, 14, 38, 0.65)',
    tintCor: 'rgba(15, 30, 75, 0.18)',
    icone: '🌙',
    rotulo: 'Noite',
    badgeCor: '#6585c0',
    descricaoTempo: 'Escuridão profunda pontilhada por tochas de sentinelas',
    periodoGeral: 'noite',
  },
};

const CICLO_PERIODOS: Periodo[] = ['manha', 'tarde', 'entardecer', 'anoitecer', 'noite', 'madrugada'];

export interface BannerIlustradoProps {
  source: ImageSourcePropType;
  periodo?: Periodo;
  titulo?: string;
  subtitulo?: string;
  seloTexto?: string;
  seloCor?: string;
  altura?: number;
  descricaoAtmosfera?: string;
  extraAcao?: React.ReactNode;
  permitirPreviewCiclo?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function BannerIlustrado({
  source,
  periodo = 'tarde',
  titulo,
  subtitulo,
  seloTexto,
  seloCor = cores.ouro,
  altura = 195,
  descricaoAtmosfera,
  extraAcao,
  permitirPreviewCiclo = true,
  style,
  onPress,
}: BannerIlustradoProps) {
  const [overridePeriodo, setOverridePeriodo] = useState<Periodo | null>(null);

  const periodoEfetivo: Periodo = overridePeriodo ?? periodo;
  const info = ILUMINACAO_POR_PERIODO[periodoEfetivo] ?? ILUMINACAO_POR_PERIODO.tarde;
  const isPreview = overridePeriodo !== null && overridePeriodo !== periodo;

  function proximoPeriodoPreview() {
    if (!permitirPreviewCiclo) return;
    const atualIdx = CICLO_PERIODOS.indexOf(periodoEfetivo);
    const prox = CICLO_PERIODOS[(atualIdx + 1) % CICLO_PERIODOS.length];
    if (prox === periodo) {
      setOverridePeriodo(null); // Volta ao período do jogo
    } else {
      setOverridePeriodo(prox);
    }
  }

  const containerContent = (
    <View style={[styles.bannerContainer, { height: altura }, style]}>
      {/* Imagem de Fundo do Local / Cidade */}
      <Image source={source} style={styles.bannerImagem} resizeMode="cover" />

      {/* Camada 1: Filtro Atmosférico do Ciclo (Dia / Tarde / Noite) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: info.filtroCor }]} pointerEvents="none" />

      {/* Camada 2: Tonalidade de Cor do Céu / Temperatura */}
      {info.tintCor !== 'transparent' && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: info.tintCor }]} pointerEvents="none" />
      )}

      {/* Camada 3: Sombra Inferior para Legibilidade de Textos */}
      <View style={[StyleSheet.absoluteFill, styles.sombraContraste]} pointerEvents="none" />

      {/* Camada 4: Conteúdo e Controles */}
      <View style={styles.conteudoWrap}>
        {/* Barra Superior */}
        <View style={styles.barraTopo}>
          {seloTexto ? (
            <View style={[styles.seloInterno, { borderColor: seloCor }]}>
              <Text style={[styles.seloInternoTxt, { color: seloCor }]}>{seloTexto}</Text>
            </View>
          ) : (
            <View />
          )}

          <View style={styles.controlesDireita}>
            {extraAcao}

            {/* Badge de Horário / Iluminação (interativo para pré-visualização) */}
            <Pressable
              onPress={proximoPeriodoPreview}
              hitSlop={6}
              style={[
                styles.badgeTempo,
                { borderColor: info.badgeCor },
                isPreview && styles.badgeTempoPreview,
              ]}
              accessibilityLabel={`Período: ${info.rotulo}. Toque para alternar ciclo visual.`}
            >
              <Text style={[styles.badgeTempoTxt, { color: info.badgeCor }]}>
                {info.icone} {info.rotulo}
                {permitirPreviewCiclo ? (isPreview ? ' ↺' : ' ▾') : ''}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Informações do Local no Rodapé do Banner */}
        <View style={styles.barraRodape}>
          {titulo && <Text style={styles.tituloTexto}>{titulo}</Text>}
          {subtitulo && <Text style={styles.subtituloTexto}>{subtitulo}</Text>}
          <Text style={styles.atmosferaTexto} numberOfLines={2}>
            {descricaoAtmosfera || info.descricaoTempo}
          </Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ width: '100%' }}>
        {containerContent}
      </Pressable>
    );
  }

  return containerContent;
}

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    borderRadius: raio.lg,
    overflow: 'hidden',
    marginBottom: esp.md,
    position: 'relative',
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.fundo2,
  },
  bannerImagem: {
    width: '100%',
    height: '100%',
  },
  sombraContraste: {
    backgroundColor: 'rgba(14, 12, 10, 0.48)',
  },
  conteudoWrap: {
    ...StyleSheet.absoluteFill,
    padding: esp.md,
    justifyContent: 'space-between',
  },
  barraTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: esp.sm,
  },
  controlesDireita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: esp.xs,
  },
  badgeTempo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 12, 10, 0.82)',
    borderWidth: 1,
    borderRadius: raio.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTempoPreview: {
    backgroundColor: 'rgba(30, 20, 10, 0.92)',
  },
  badgeTempoTxt: {
    fontFamily: fontes.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  barraRodape: {
    gap: 2,
    backgroundColor: 'rgba(10, 8, 7, 0.55)',
    paddingHorizontal: esp.sm,
    paddingVertical: 6,
    borderRadius: raio.md,
    alignSelf: 'stretch',
  },
  tituloTexto: {
    fontFamily: fontes.serifSemi,
    fontSize: 22,
    color: cores.vellum,
    lineHeight: 26,
  },
  subtituloTexto: {
    fontFamily: fontes.mono,
    fontSize: 12,
    color: cores.ouro,
  },
  atmosferaTexto: {
    fontFamily: fontes.mono,
    fontSize: 10,
    color: cores.mudo,
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 14,
  },
  seloInterno: {
    borderWidth: 1,
    borderRadius: raio.sm,
    paddingHorizontal: esp.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(14, 12, 10, 0.75)',
    alignSelf: 'flex-start',
  },
  seloInternoTxt: {
    fontFamily: fontes.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
});
