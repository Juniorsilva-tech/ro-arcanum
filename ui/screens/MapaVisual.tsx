import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  PanResponder,
  type LayoutChangeEvent,
} from 'react-native';
import type { Campaign, ContentBundle } from '@/engine/types';
import { posicaoMapa, CAPITAIS_CONTINENTE } from '@/content/vaelhorn/mapa';
import { cores, fontes, esp } from '../theme';
import { rotasVisiveis } from '@/engine';

const IMAGEM_MAPA_VAELHORN = require('../../assets/feudo/mapa_continente.jpg');
const IMAGEM_MAPA_TSUKIMICHI = require('../../assets/feudo/asora.jpg');

const CANVAS_WIDTH = 1376;
const CANVAS_HEIGHT = 768;

export function MapaVisual({
  content,
  camp,
  onViajar,
}: {
  content: ContentBundle;
  camp: Campaign;
  onViajar?: (destino: string) => void;
}) {
  const [modoVisao, setModoVisao] = useState<'geral' | 'local'>('geral');
  const [feedbackViagem, setFeedbackViagem] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const [arrastando, setArrastando] = useState(false);

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(0.85);
  const inicializado = useRef(false);
  const arrastou = useRef(false);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const ehTsukimichi = camp.cenarioId === 'tsukimichi';
  const mapaImagem = ehTsukimichi ? IMAGEM_MAPA_TSUKIMICHI : IMAGEM_MAPA_VAELHORN;

  const visitados = new Set(camp.locaisVisitados);
  const rotas = rotasVisiveis(content, camp);
  const pontosConectados = new Set([...camp.locaisVisitados, ...rotas.map((r) => r.destino)]);

  // Posição do feudo fundado pelo jogador
  const feudoLocalId = camp.feudo?.fundado ? camp.feudo.localId : undefined;
  const feudoPos = feudoLocalId ? posicaoMapa(feudoLocalId) : undefined;

  // Centraliza o canvas em um ponto (percentual X, Y)
  const centralizarNoPonto = useCallback(
    (xPercent: number, yPercent: number, zoomLevel: number, vw = viewportSize.w, vh = viewportSize.h) => {
      if (vw <= 0 || vh <= 0) return;
      const targetPx = (xPercent / 100) * CANVAS_WIDTH;
      const targetPy = (yPercent / 100) * CANVAS_HEIGHT;
      const cx = CANVAS_WIDTH / 2;
      const cy = CANVAS_HEIGHT / 2;
      const newPanX = Math.round(vw / 2 - cx - (targetPx - cx) * zoomLevel);
      const newPanY = Math.round(vh / 2 - cy - (targetPy - cy) * zoomLevel);
      setPan({ x: newPanX, y: newPanY });
      panRef.current = { x: newPanX, y: newPanY };
    },
    [viewportSize.w, viewportSize.h]
  );

  const focarJogador = useCallback(() => {
    const local = content.locais.find((l) => l.id === camp.localAtual);
    const pos = posicaoMapa(camp.localAtual, local?.regiao);
    centralizarNoPonto(pos.x, pos.y, zoomRef.current);
  }, [camp.localAtual, content.locais, centralizarNoPonto]);

  const verTodoContinente = useCallback(() => {
    if (viewportSize.w <= 0 || viewportSize.h <= 0) return;
    const fitScale = Math.min(
      (viewportSize.w - 16) / CANVAS_WIDTH,
      (viewportSize.h - 16) / CANVAS_HEIGHT
    );
    const targetZoom = Math.max(0.4, Number(fitScale.toFixed(2)));
    setZoom(targetZoom);
    centralizarNoPonto(50, 50, targetZoom);
  }, [viewportSize.w, viewportSize.h, centralizarNoPonto]);

  const onLayoutViewport = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setViewportSize({ w: width, h: height });
      if (!inicializado.current && width > 0 && height > 0) {
        inicializado.current = true;
        const local = content.locais.find((l) => l.id === camp.localAtual);
        const pos = posicaoMapa(camp.localAtual, local?.regiao);
        const initialZoom = 0.85;
        setZoom(initialZoom);
        centralizarNoPonto(pos.x, pos.y, initialZoom, width, height);
      }
    },
    [camp.localAtual, content.locais, centralizarNoPonto]
  );

  const aumentarZoom = useCallback(() => {
    setZoom((z) => {
      const proximo = Math.min(2.0, Number((z + 0.15).toFixed(2)));
      const local = content.locais.find((l) => l.id === camp.localAtual);
      const pos = posicaoMapa(camp.localAtual, local?.regiao);
      centralizarNoPonto(pos.x, pos.y, proximo);
      return proximo;
    });
  }, [camp.localAtual, content.locais, centralizarNoPonto]);

  const diminuirZoom = useCallback(() => {
    setZoom((z) => {
      const proximo = Math.max(0.45, Number((z - 0.15).toFixed(2)));
      const local = content.locais.find((l) => l.id === camp.localAtual);
      const pos = posicaoMapa(camp.localAtual, local?.regiao);
      centralizarNoPonto(pos.x, pos.y, proximo);
      return proximo;
    });
  }, [camp.localAtual, content.locais, centralizarNoPonto]);

  // Gestor de arrasto do mapa com o mouse / toque
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, gestureState) => {
          return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
        },
        onPanResponderGrant: () => {
          arrastou.current = false;
          setArrastando(true);
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3) {
            arrastou.current = true;
          }
          setPan({
            x: panRef.current.x + gestureState.dx,
            y: panRef.current.y + gestureState.dy,
          });
        },
        onPanResponderRelease: (_evt, gestureState) => {
          setArrastando(false);
          panRef.current = {
            x: panRef.current.x + gestureState.dx,
            y: panRef.current.y + gestureState.dy,
          };
          setPan(panRef.current);
          setTimeout(() => {
            arrastou.current = false;
          }, 80);
        },
        onPanResponderTerminate: () => {
          setArrastando(false);
          setTimeout(() => {
            arrastou.current = false;
          }, 80);
        },
      }),
    []
  );

  return (
    <View style={styles.container}>
      {/* Barra de título do mapa com seletor de visão */}
      <View style={styles.topoMapa}>
        <View style={styles.tituloBox}>
          <Text style={styles.iconeBussola}>🧭</Text>
          <Text style={styles.tituloTexto}>
            {ehTsukimichi ? 'DIMENSÃO DE ASORA & WASTELAND' : 'CONTINENTE DE VAELHORN'}
          </Text>
        </View>

        <View style={styles.botoesModo}>
          <Pressable
            onPress={() => setModoVisao('geral')}
            style={[styles.botaoModo, modoVisao === 'geral' && styles.botaoModoAtivo]}
          >
            <Text style={[styles.botaoModoTexto, modoVisao === 'geral' && styles.botaoModoTextoAtivo]}>
              Continente
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setModoVisao('local')}
            style={[styles.botaoModo, modoVisao === 'local' && styles.botaoModoAtivo]}
          >
            <Text style={[styles.botaoModoTexto, modoVisao === 'local' && styles.botaoModoTextoAtivo]}>
              Local
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Aviso de feedback interativo se houver */}
      {feedbackViagem && (
        <View style={styles.bannerFeedback}>
          <Text style={styles.feedbackTexto}>{feedbackViagem}</Text>
          <Pressable onPress={() => setFeedbackViagem(null)} hitSlop={8}>
            <Text style={styles.feedbackFechar}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Janela de visualização do mapa com navegação por arrasto */}
      <View
        style={[styles.viewport, arrastando && styles.viewportArrastando]}
        onLayout={onLayoutViewport}
        {...panResponder.panHandlers}
      >
        {/* Canvas interno posicionado e escalado por pan e zoom */}
        <View
          style={[
            styles.canvasContainer,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale: zoom },
              ],
            },
          ]}
        >
          {/* Imagem de fundo cartográfica com vinheta */}
          <Image source={mapaImagem} style={styles.mapaImagem} resizeMode="cover" />
          <View style={styles.vinhetaEscura} />

          {/* Linhas de grade cartográfica sutis */}
          <View style={styles.gradeCartografica} />

          {/* Capitais e Marcos Territoriais do Continente (Visão Geral em Vaelhorn) */}
          {!ehTsukimichi && modoVisao === 'geral' && (
            <>
              {CAPITAIS_CONTINENTE.map((cap) => {
                const ehLocalAtual = cap.id === camp.localAtual || (cap.id === 'taverna' && camp.localAtual === 'taverna');
                if (ehLocalAtual) return null;

                const rotaCap = rotas.find((r) => r.destino === cap.id);
                const podeViajarCap = Boolean(rotaCap && onViajar);

                return (
                  <Pressable
                    key={`capital_${cap.id}`}
                    onPress={() => {
                      if (arrastou.current) return;
                      if (podeViajarCap) {
                        onViajar?.(cap.id);
                      } else {
                        setFeedbackViagem(`${cap.nome} (${cap.tipo}): destino distante. Siga pelas rotas de estrada.`);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.capitalBadge,
                      { left: `${cap.x}%`, top: `${cap.y}%` },
                      podeViajarCap && styles.capitalClicavel,
                      pressed && styles.capitalPressionada,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      podeViajarCap ? `Viajar para ${cap.nome}` : `${cap.nome} - ${cap.tipo}`
                    }
                  >
                    <View style={[styles.capitalIconeFundo, podeViajarCap && styles.capitalIconeFundoRota]}>
                      <Text style={styles.capitalIcone}>🏰</Text>
                    </View>
                    <Text style={[styles.capitalNome, podeViajarCap && styles.capitalNomeRota]}>{cap.nome}</Text>
                    <Text style={styles.capitalTipo}>{cap.tipo}</Text>
                    {podeViajarCap && (
                      <View style={styles.tagViajarCapital}>
                        <Text style={styles.tagViajarCapitalTexto}>✦ Viajar</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </>
          )}

          {/* Marcador do Feudo Soberano do Jogador (se fundado) */}
          {feudoPos && (
            <View style={[styles.feudoBadge, { left: `${feudoPos.x}%`, top: `${feudoPos.y - 8}%` }]}>
              <View style={styles.feudoPino}>
                <Text style={styles.feudoIcone}>👑</Text>
              </View>
              <Text style={styles.feudoNome}>
                {camp.feudo?.casaDinastica?.nome ? `Casa ${camp.feudo.casaDinastica.nome}` : camp.feudo?.nome || 'Seu Feudo'}
              </Text>
            </View>
          )}

          {/* Pinos de locais visitados e rotas disponíveis */}
          {[...pontosConectados].map((id) => {
            const local = content.locais.find((l) => l.id === id);
            if (!local) return null;
            const conhecido = visitados.has(id);
            const atual = id === camp.localAtual;
            const rotaDisponivel = rotas.find((r) => r.destino === id);
            const podeViajar = Boolean(rotaDisponivel && onViajar);
            const pos = posicaoMapa(id, local.regiao);

            if (modoVisao === 'local' && !atual && !rotaDisponivel) {
              return null;
            }

            return (
              <Pressable
                key={id}
                disabled={atual}
                onPress={() => {
                  if (arrastou.current) return;
                  if (podeViajar) {
                    onViajar?.(id);
                  } else if (!atual) {
                    setFeedbackViagem(`Para alcançar ${local.nome}, siga pelas rotas intermediárias.`);
                  }
                }}
                style={({ pressed }) => [
                  styles.ponto,
                  { left: `${pos.x}%`, top: `${pos.y}%` },
                  atual && styles.pontoAtual,
                  !conhecido && styles.pontoOculto,
                  podeViajar && styles.pontoClicavel,
                  pressed && styles.pontoPressionado,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  atual
                    ? `${local.nome} - Você está aqui`
                    : podeViajar
                    ? `Viajar para ${local.nome}`
                    : local.nome
                }
              >
                {/* Anel de pulso no local atual */}
                {atual && <View style={styles.pulsoAtual} />}

                <View
                  style={[
                    styles.pino,
                    atual && styles.pontoAtualPino,
                    podeViajar && styles.pinoRotaAberta,
                    !conhecido && styles.pinoNaoVisitado,
                  ]}
                >
                  {atual ? (
                    <View style={styles.centroPinoAtual} />
                  ) : !conhecido ? (
                    <Text style={styles.interrogacaoNoPino}>?</Text>
                  ) : podeViajar ? (
                    <Text style={styles.setaNoPino}>✦</Text>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.nomeContainer,
                    atual && styles.nomeContainerAtual,
                    podeViajar && styles.nomeContainerRota,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.nome,
                      atual && styles.nomeAtual,
                      podeViajar && styles.nomeRota,
                      !conhecido && styles.nomeNaoVisitado,
                    ]}
                  >
                    {local.nome}
                  </Text>
                  {atual ? (
                    <Text style={styles.etiquetaVoce}>● Você está aqui</Text>
                  ) : rotaDisponivel ? (
                    <Text style={styles.etiquetaViajar}>
                      ✦ Viajar {rotaDisponivel.periodos === 0 ? '(ao lado)' : `(${rotaDisponivel.periodos}p)`}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Bússola Decorativa fixa no canto superior esquerdo do viewport */}
        <View style={styles.rosaDosVentos}>
          <Text style={styles.rosaTexto}>N</Text>
          <Text style={styles.rosaSubtexto}>▲</Text>
        </View>

        {/* Barra de controles flutuantes de Pan & Zoom no canto superior direito */}
        <View style={styles.controlesFlutuantes}>
          <Pressable style={styles.btnControle} onPress={aumentarZoom} accessibilityLabel="Aproximar zoom">
            <Text style={styles.btnControleTexto}>＋</Text>
          </Pressable>
          <Pressable style={styles.btnControle} onPress={diminuirZoom} accessibilityLabel="Afastar zoom">
            <Text style={styles.btnControleTexto}>－</Text>
          </Pressable>
          <Pressable style={styles.btnControle} onPress={focarJogador} accessibilityLabel="Centralizar no jogador">
            <Text style={styles.btnControleIcone}>🎯</Text>
          </Pressable>
          <Pressable style={styles.btnControle} onPress={verTodoContinente} accessibilityLabel="Ver continente inteiro">
            <Text style={styles.btnControleIcone}>🗺️</Text>
          </Pressable>
        </View>

        {/* Dica de arrasto discreta no rodapé interno do mapa */}
        <View style={styles.dicaArrasto}>
          <Text style={styles.dicaArrastoTexto}>
            ✋ Arraste com o mouse para navegar · ✦ Clique no pino para viajar
          </Text>
        </View>
      </View>

      {/* Barra de legenda no rodapé, fora do mapa para não cobrir a arte */}
      <View style={styles.legendaAbaixo}>
        <View style={styles.itemLegenda}>
          <View style={[styles.legendaBolinha, { backgroundColor: cores.ouro }]} />
          <Text style={[styles.legendaTxt, { color: cores.ouro }]}>Você está aqui</Text>
        </View>
        <View style={styles.itemLegenda}>
          <View style={[styles.legendaBolinha, { backgroundColor: cores.verdigris }]} />
          <Text style={styles.legendaTxt}>Explorado</Text>
        </View>
        <View style={styles.itemLegenda}>
          <Text style={styles.legendaIconeDuvida}>✦</Text>
          <Text style={[styles.legendaTxt, { color: '#f3e3ba' }]}>Clique para viajar</Text>
        </View>
        <View style={styles.itemLegenda}>
          <Text style={styles.legendaIconeDuvida}>?</Text>
          <Text style={styles.legendaTxt}>Rota a explorar</Text>
        </View>
        {!ehTsukimichi && (
          <View style={styles.itemLegenda}>
            <Text style={styles.legendaCastelo}>🏰</Text>
            <Text style={styles.legendaTxt}>Grandes Cidades</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: esp.md,
  },
  topoMapa: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  tituloBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconeBussola: {
    fontSize: 14,
  },
  tituloTexto: {
    fontFamily: fontes.monoMedium,
    fontSize: 11,
    color: cores.ouro,
    letterSpacing: 1.2,
  },
  botoesModo: {
    flexDirection: 'row',
    backgroundColor: cores.fundo2,
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  botaoModo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  botaoModoAtivo: {
    backgroundColor: cores.linha,
  },
  botaoModoTexto: {
    fontFamily: fontes.mono,
    fontSize: 10,
    color: cores.mudo,
  },
  botaoModoTextoAtivo: {
    color: cores.vellum,
    fontFamily: fontes.monoMedium,
  },
  bannerFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(28, 22, 14, 0.95)',
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  feedbackTexto: {
    fontFamily: fontes.mono,
    fontSize: 10,
    color: cores.ouro,
    flex: 1,
  },
  feedbackFechar: {
    fontFamily: fontes.monoMedium,
    fontSize: 12,
    color: cores.ouro,
    paddingLeft: 8,
  },
  viewport: {
    width: '100%',
    height: 520,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: 12,
    backgroundColor: '#0c100f',
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    cursor: 'grab' as unknown as undefined,
  },
  viewportArrastando: {
    cursor: 'grabbing' as unknown as undefined,
  },
  canvasContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  mapaImagem: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  controlesFlutuantes: {
    position: 'absolute',
    top: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 20,
  },
  btnControle: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(15, 20, 18, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  btnControleTexto: {
    fontFamily: fontes.monoMedium,
    fontSize: 14,
    color: cores.ouro,
    lineHeight: 16,
  },
  btnControleIcone: {
    fontSize: 12,
  },
  dicaArrasto: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(10, 14, 13, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 15,
  },
  dicaArrastoTexto: {
    fontFamily: fontes.mono,
    fontSize: 8.5,
    color: '#cfd8d4',
  },
  vinhetaEscura: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 13, 12, 0.35)',
  },
  gradeCartografica: {
    ...StyleSheet.absoluteFill,
    opacity: 0.08,
    borderWidth: 1,
    borderColor: cores.verdigris,
  },
  capitalBadge: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -40 }, { translateY: -12 }],
    width: 80,
    zIndex: 2,
  },
  capitalClicavel: {
    zIndex: 5,
  },
  capitalPressionada: {
    opacity: 0.7,
  },
  capitalIconeFundo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(20, 26, 24, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capitalIconeFundoRota: {
    borderColor: cores.ouro,
    backgroundColor: 'rgba(32, 26, 16, 0.95)',
    borderWidth: 1.5,
  },
  capitalIcone: {
    fontSize: 11,
  },
  capitalNome: {
    fontFamily: fontes.monoMedium,
    fontSize: 9,
    color: '#e4d3b2',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  capitalNomeRota: {
    color: cores.ouro,
    fontFamily: fontes.monoMedium,
  },
  capitalTipo: {
    fontFamily: fontes.mono,
    fontSize: 7.5,
    color: 'rgba(215, 200, 170, 0.65)',
    textAlign: 'center',
  },
  tagViajarCapital: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: cores.ouro,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  tagViajarCapitalTexto: {
    fontFamily: fontes.monoMedium,
    fontSize: 7.5,
    color: cores.ouro,
  },
  feudoBadge: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -45 }, { translateY: -15 }],
    width: 90,
    zIndex: 4,
  },
  feudoPino: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: cores.bistre,
    borderWidth: 2,
    borderColor: cores.ouro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feudoIcone: {
    fontSize: 12,
  },
  feudoNome: {
    fontFamily: fontes.monoMedium,
    fontSize: 9,
    color: cores.ouro,
    backgroundColor: 'rgba(15, 12, 8, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  ponto: {
    position: 'absolute',
    width: 120,
    alignItems: 'center',
    transform: [{ translateX: -60 }, { translateY: -10 }],
    zIndex: 3,
  },
  pontoClicavel: {
    zIndex: 8,
  },
  pontoPressionado: {
    opacity: 0.7,
    transform: [{ translateX: -60 }, { translateY: -10 }, { scale: 0.95 }],
  },
  pontoAtual: {
    zIndex: 10,
  },
  pontoOculto: {
    opacity: 0.88,
  },
  pulsoAtual: {
    position: 'absolute',
    top: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: cores.ouro,
    opacity: 0.65,
  },
  pino: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: cores.verdigris,
    borderWidth: 2,
    borderColor: '#0a0d0c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  pontoAtualPino: {
    backgroundColor: cores.ouro,
    borderColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pinoRotaAberta: {
    backgroundColor: 'rgba(24, 32, 28, 0.95)',
    borderColor: cores.ouro,
    borderWidth: 2,
    shadowColor: cores.ouro,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  setaNoPino: {
    color: cores.ouro,
    fontFamily: fontes.monoMedium,
    fontSize: 9,
    lineHeight: 11,
  },
  centroPinoAtual: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#111',
  },
  pinoNaoVisitado: {
    backgroundColor: 'rgba(20, 28, 25, 0.9)',
    borderColor: cores.ouro,
    borderStyle: 'dashed',
  },
  interrogacaoNoPino: {
    color: cores.ouro,
    fontFamily: fontes.monoMedium,
    fontSize: 10,
    lineHeight: 12,
  },
  nomeContainer: {
    backgroundColor: 'rgba(12, 16, 15, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  nomeContainerAtual: {
    backgroundColor: 'rgba(24, 20, 10, 0.92)',
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  nomeContainerRota: {
    backgroundColor: 'rgba(20, 26, 22, 0.94)',
    borderColor: 'rgba(212, 175, 55, 0.55)',
    borderWidth: 1.2,
  },
  nome: {
    maxWidth: 110,
    color: '#d6dedb',
    fontFamily: fontes.mono,
    fontSize: 9.5,
    textAlign: 'center',
  },
  nomeAtual: {
    color: cores.ouro,
    fontFamily: fontes.monoMedium,
    fontSize: 10,
  },
  nomeRota: {
    color: '#f0e6cf',
    fontFamily: fontes.monoMedium,
  },
  etiquetaVoce: {
    fontFamily: fontes.mono,
    fontSize: 8,
    color: '#f3e3ba',
    marginTop: 1,
  },
  etiquetaViajar: {
    fontFamily: fontes.monoMedium,
    fontSize: 8,
    color: cores.ouro,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  nomeNaoVisitado: {
    color: '#a3b0ac',
    fontSize: 9,
  },
  rosaDosVentos: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(12, 16, 15, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  rosaTexto: {
    fontFamily: fontes.monoMedium,
    fontSize: 9,
    color: cores.ouro,
    lineHeight: 11,
  },
  rosaSubtexto: {
    fontSize: 7,
    color: cores.ouro,
    lineHeight: 8,
  },
  legendaAbaixo: {
    marginTop: 8,
    backgroundColor: 'rgba(10, 14, 13, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendaBolinha: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendaIconeDuvida: {
    fontFamily: fontes.monoMedium,
    fontSize: 9,
    color: cores.ouro,
  },
  legendaCastelo: {
    fontSize: 9,
  },
  legendaTxt: {
    color: cores.mudo,
    fontFamily: fontes.mono,
    fontSize: 9,
  },
});
