import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  PanResponder,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import type { Campaign, ContentBundle } from '@/engine/types';
import { posicaoMapa, CAPITAIS_CONTINENTE, COORDENADAS_LOCAIS } from '@/content/vaelhorn/mapa';
import { CRONICAS_MAPA } from '@/content/vaelhorn/cosmologia';
import { MARCOS_PINTADOS, nomesAntigosDe, type MarcoPintado } from '@/content/vaelhorn/marcosMapa';
import { cores, fontes, esp } from '../theme';
import { rotasVisiveis, estadosDaSecao } from '@/engine';

const IMAGEM_MAPA_VAELHORN = require('../../assets/feudo/mapa_continente.jpg');
const IMAGEM_MAPA_TSUKIMICHI = require('../../assets/feudo/asora.jpg');

const CANVAS_WIDTH = 1376;
const CANVAS_HEIGHT = 768;

export type MarcadorMapa = {
  id: string;
  nome: string;
  regiao?: string;
  sub?: string;
  x: number;
  y: number;
  pintado: boolean;
  atual: boolean;
  conhecido: boolean;
  podeViajar: boolean;
  periodos?: number;
  feudo?: boolean;
  /** Camada no Livro (engine/livro.ts): boato, sabe o caminho, esteve lá. */
  camada?: string;
};

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
  const [lugarInspecionado, setLugarInspecionado] = useState<MarcadorMapa | null>(null);
  const [lendaAberta, setLendaAberta] = useState<MarcoPintado | null>(null);
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

  // Prende o mapa dentro da janela. O canvas escala em volta do próprio
  // centro, então a borda esquerda visível da imagem fica em
  // pan.x + W/2 - W*zoom/2. Se a imagem é maior que a janela, a borda fica
  // entre (janela - imagem) e 0; se é menor, fica centralizada. Sem isto, o
  // mapa podia ser arrastado para fora e a janela ficava vazia.
  const limitarPan = useCallback(
    (x: number, y: number, zoomLevel: number, vw = viewportSize.w, vh = viewportSize.h) => {
      if (vw <= 0 || vh <= 0) return { x, y };
      const eixo = (valor: number, tamanho: number, janela: number) => {
        const escalado = tamanho * zoomLevel;
        const ajuste = tamanho / 2 - escalado / 2; // borda visível = pan + ajuste
        if (escalado <= janela) return Math.round((janela - escalado) / 2 - ajuste);
        return Math.round(Math.min(-ajuste, Math.max(janela - escalado - ajuste, valor)));
      };
      return { x: eixo(x, CANVAS_WIDTH, vw), y: eixo(y, CANVAS_HEIGHT, vh) };
    },
    [viewportSize.w, viewportSize.h]
  );

  // Centraliza o canvas em um ponto (percentual X, Y), dentro dos limites.
  const centralizarNoPonto = useCallback(
    (xPercent: number, yPercent: number, zoomLevel: number, vw = viewportSize.w, vh = viewportSize.h) => {
      if (vw <= 0 || vh <= 0) return;
      const targetPx = (xPercent / 100) * CANVAS_WIDTH;
      const targetPy = (yPercent / 100) * CANVAS_HEIGHT;
      const cx = CANVAS_WIDTH / 2;
      const cy = CANVAS_HEIGHT / 2;
      const alvo = limitarPan(
        vw / 2 - cx - (targetPx - cx) * zoomLevel,
        vh / 2 - cy - (targetPy - cy) * zoomLevel,
        zoomLevel, vw, vh,
      );
      setPan(alvo);
      panRef.current = alvo;
    },
    [viewportSize.w, viewportSize.h, limitarPan]
  );

  // Menor zoom: a imagem cobrindo a janela inteira, sem faixa vazia em volta
  // (o maior dos dois encaixes). "Ver o continente" usa este zoom.
  const zoomMinimo = useCallback(
    (vw = viewportSize.w, vh = viewportSize.h) =>
      vw > 0 && vh > 0 ? Math.max(0.3, vw / CANVAS_WIDTH, vh / CANVAS_HEIGHT) : 0.45,
    [viewportSize.w, viewportSize.h]
  );

  const focarJogador = useCallback(() => {
    const local = content.locais.find((l) => l.id === camp.localAtual);
    const pos = posicaoMapa(camp.localAtual, local?.regiao);
    centralizarNoPonto(pos.x, pos.y, zoomRef.current);
  }, [camp.localAtual, content.locais, centralizarNoPonto]);

  const verTodoContinente = useCallback(() => {
    if (viewportSize.w <= 0 || viewportSize.h <= 0) return;
    const alvo = zoomMinimo();
    setZoom(alvo);
    zoomRef.current = alvo;
    centralizarNoPonto(50, 50, alvo);
  }, [viewportSize.w, viewportSize.h, centralizarNoPonto, zoomMinimo]);

  const aplicarTamanho = useCallback(
    (width: number, height: number) => {
      setViewportSize((v) => (v.w === width && v.h === height ? v : { w: width, h: height }));
      if (!inicializado.current && width > 0 && height > 0) {
        inicializado.current = true;
        const local = content.locais.find((l) => l.id === camp.localAtual);
        const pos = posicaoMapa(camp.localAtual, local?.regiao);
        const initialZoom = Math.max(1, zoomMinimo(width, height));
        setZoom(initialZoom);
        zoomRef.current = initialZoom;
        centralizarNoPonto(pos.x, pos.y, initialZoom, width, height);
      }
    },
    [camp.localAtual, content.locais, centralizarNoPonto, zoomMinimo]
  );
  const onLayoutViewport = useCallback(
    (e: LayoutChangeEvent) => aplicarTamanho(e.nativeEvent.layout.width, e.nativeEvent.layout.height),
    [aplicarTamanho]
  );
  // No navegador o onLayout desta janela não dispara (medido: o mapa ficava
  // parado no zoom e na posição de partida, e por isso sem limite nenhum).
  // Mede direto no elemento e acompanha o redimensionamento.
  const viewportRef = useRef<View>(null);
  const aplicarRef = useRef(aplicarTamanho);
  useEffect(() => { aplicarRef.current = aplicarTamanho; }, [aplicarTamanho]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = viewportRef.current as unknown as HTMLElement | null;
    if (!el?.getBoundingClientRect) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) aplicarRef.current(Math.round(r.width), Math.round(r.height));
    };
    medir();
    const Observador = (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    if (!Observador) return;
    const ro = new Observador(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Zoom em volta do centro da janela: o que está no meio continua no meio.
  const mudarZoom = useCallback(
    (delta: number) => {
      const atual = zoomRef.current;
      const proximo = Math.min(2.0, Math.max(zoomMinimo(), Number((atual + delta).toFixed(2))));
      if (proximo === atual || viewportSize.w <= 0) return;
      const cx = CANVAS_WIDTH / 2, cy = CANVAS_HEIGHT / 2;
      // Ponto do canvas que está no centro da janela agora.
      const px = cx + (viewportSize.w / 2 - panRef.current.x - cx) / atual;
      const py = cy + (viewportSize.h / 2 - panRef.current.y - cy) / atual;
      setZoom(proximo);
      zoomRef.current = proximo;
      centralizarNoPonto((px / CANVAS_WIDTH) * 100, (py / CANVAS_HEIGHT) * 100, proximo);
    },
    [viewportSize.w, viewportSize.h, centralizarNoPonto, zoomMinimo]
  );
  const aumentarZoom = useCallback(() => mudarZoom(0.15), [mudarZoom]);
  const diminuirZoom = useCallback(() => mudarZoom(-0.15), [mudarZoom]);

  // Arrasto do mapa com o mouse / toque. O deslocamento do gesto (dx, dy) é
  // somado à posição de QUANDO O ARRASTO COMEÇOU. Antes somava à posição
  // atual, que já tinha o gesto: cada movimento contava o arrasto de novo, e
  // um puxão pequeno jogava o mapa para fora da janela.
  const inicioArrasto = useRef({ x: 0, y: 0 });
  const limitarRef = useRef(limitarPan);
  useEffect(() => { limitarRef.current = limitarPan; }, [limitarPan]);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, gestureState) => {
          return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
        },
        onPanResponderGrant: () => {
          arrastou.current = false;
          inicioArrasto.current = { ...panRef.current };
          setArrastando(true);
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3) {
            arrastou.current = true;
          }
          const alvo = limitarRef.current(
            inicioArrasto.current.x + gestureState.dx,
            inicioArrasto.current.y + gestureState.dy,
            zoomRef.current,
          );
          panRef.current = alvo;
          setPan(alvo);
        },
        onPanResponderRelease: () => {
          setArrastando(false);
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

  const ehWeb = Platform.OS === 'web';
  const [foco, setFoco] = useState<string | null>(null);

  // Tudo o que o mapa marca, numa lista só: cidades pintadas, lugares que
  // você conhece ou tem rota, e a sua colônia. Uma cidade pintada que também
  // é destino de rota vira um marcador só.
  type Marcador = {
    id: string; nome: string; sub?: string; x: number; y: number; pintado: boolean;
    atual: boolean; conhecido: boolean; podeViajar: boolean; periodos?: number; feudo?: boolean;
  };
  // O mapa mostra o que o Livro conhece: lugar desconhecido não aparece, e o
  // escondido só depois de descoberto. As cidades pintadas são, no mínimo, boato.
  const camadasLugar = estadosDaSecao(content, camp, 'lugares', content.locais.map((l) => l.id));
  // Símbolos pintados (dragão, serpentes, estandartes…): a lenda aparece
  // quando o jogador já ouviu falar do lugar a que ela se prende.
  const lendasVisiveis = ehTsukimichi
    ? []
    : MARCOS_PINTADOS.filter((m) => m.tipo === 'lenda' && m.localId && (camadasLugar[m.localId] ?? 'desconhecida') !== 'desconhecida');
  const marcadores: MarcadorMapa[] = (() => {
    const lista = new Map<string, MarcadorMapa>();
    const montar = (id: string, extra: Partial<MarcadorMapa> = {}): MarcadorMapa | undefined => {
      const local = content.locais.find((l) => l.id === id);
      const cronica = CRONICAS_MAPA[id];
      if (!local && !cronica) return undefined;
      const rota = rotas.find((r) => r.destino === id);
      const regiao = local?.regiao ?? cronica?.regiao;
      const pos = COORDENADAS_LOCAIS[id] ?? posicaoMapa(id, regiao);
      const nome = local?.nome ?? cronica?.nome ?? id;
      return {
        id,
        nome,
        regiao,
        x: pos.x,
        y: pos.y,
        pintado: false,
        atual: id === camp.localAtual,
        conhecido: visitados.has(id),
        podeViajar: Boolean(rota && onViajar),
        periodos: rota?.periodos,
        camada: id === camp.localAtual ? 'obtida' : camadasLugar[id] ?? 'desconhecida',
        ...extra,
      };
    };
    if (!ehTsukimichi && modoVisao === 'geral') {
      for (const cap of CAPITAIS_CONTINENTE) {
        const m = montar(cap.id, { pintado: true, sub: cap.tipo, x: cap.x, y: cap.y });
        if (m) lista.set(cap.id, { ...m, camada: m.camada === 'desconhecida' ? 'ouvida' : m.camada });
      }
      for (const id of Object.keys(COORDENADAS_LOCAIS)) {
        if (id.match(/^(tsige_|wasteland_|asora_|rotsgard_)/)) continue;
        if (lista.has(id)) continue;
        const m = montar(id);
        if (m && m.camada !== 'desconhecida') lista.set(id, m);
      }
    } else if (ehTsukimichi && modoVisao === 'geral') {
      for (const id of Object.keys(COORDENADAS_LOCAIS)) {
        if (!id.match(/^(tsige_|wasteland_|asora_|rotsgard_)/)) continue;
        if (lista.has(id)) continue;
        const m = montar(id);
        if (m && m.camada !== 'desconhecida') lista.set(id, m);
      }
    }
    for (const id of pontosConectados) {
      if (lista.has(id)) continue;
      const m = montar(id);
      if (!m) continue;
      if (modoVisao === 'local' && !m.atual && !m.podeViajar) continue;
      lista.set(id, m);
    }
    if (feudoLocalId) {
      const f = lista.get(feudoLocalId) ?? montar(feudoLocalId);
      if (f) lista.set(feudoLocalId, { ...f, feudo: true, sub: camp.feudo?.nome ? `sua colônia: ${camp.feudo.nome}` : 'sua colônia' });
    }
    // O lugar atual por último: fica por cima dos vizinhos.
    return [...lista.values()].sort((a, b) => Number(a.atual) - Number(b.atual));
  })();

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
        ref={viewportRef}
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

          {/* Lugares do mapa. As cidades pintadas no desenho (capitais) não
              ganham ícone: são uma área clicável invisível sobre o próprio
              desenho. Os outros lugares são um ponto pequeno. O nome aparece
              ao passar o mouse (web) ou no primeiro toque (celular); clicar
              num lugar inspeciona sua crônica ancestral e permite viajar se houver rota. */}
          {marcadores.map((m) => {
            const focado = foco === m.id;
            const inspecionado = lugarInspecionado?.id === m.id;
            const rotulo = focado || (m.atual && modoVisao === 'local') || inspecionado;
            return (
              <Pressable
                key={m.id}
                onHoverIn={() => setFoco(m.id)}
                onHoverOut={() => setFoco((f) => (f === m.id ? null : f))}
                onPress={() => {
                  if (arrastou.current) return;
                  setLendaAberta(null);
                  setLugarInspecionado(m);
                  setFoco(m.id);
                }}
                style={[
                  m.pintado ? styles.areaPintada : styles.areaPonto,
                  { left: `${m.x}%`, top: `${m.y}%` },
                ]}
                accessibilityRole="button"
                accessibilityLabel={m.atual ? `${m.nome} - você está aqui` : m.podeViajar ? `Viajar para ${m.nome}` : m.nome}
              >
                {/* Contorno quando o mouse está em cima ou inspecionado */}
                {m.pintado && (focado || inspecionado) && <View style={styles.contornoPintado} />}
                {!m.pintado && (
                  <View
                    style={[
                      styles.pontinho,
                      m.podeViajar && styles.pontinhoRota,
                      !m.conhecido && styles.pontinhoDesconhecido,
                      m.feudo && styles.pontinhoFeudo,
                      (focado || inspecionado) && styles.pontinhoFocado,
                    ]}
                  />
                )}
                {m.atual && <View style={styles.anelAtual} />}
                {rotulo && (
                  <View style={styles.rotulo} pointerEvents="box-none">
                    <Text numberOfLines={1} style={styles.rotuloNome}>{m.nome}</Text>
                    {m.sub ? <Text numberOfLines={1} style={styles.rotuloSub}>{m.sub}</Text> : null}
                    {m.atual ? (
                      <Text style={styles.rotuloAtual}>você está aqui</Text>
                    ) : m.podeViajar ? (
                      <Text style={styles.rotuloViajar}>
                        {m.periodos === 0 ? 'ao lado' : `${m.periodos} ${m.periodos === 1 ? 'período' : 'períodos'}`} · toque para crônica
                      </Text>
                    ) : (
                      <Text style={styles.rotuloInspecionar}>toque para ler crônica</Text>
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
          {lendasVisiveis.map((l) => {
            const focado = foco === l.id;
            return (
              <Pressable
                key={l.id}
                onHoverIn={() => setFoco(l.id)}
                onHoverOut={() => setFoco((f) => (f === l.id ? null : f))}
                onPress={() => {
                  if (arrastou.current) return;
                  setLugarInspecionado(null);
                  setLendaAberta(l);
                  setFoco(l.id);
                }}
                style={[styles.areaPintada, { left: `${l.x}%`, top: `${l.y}%` }]}
                accessibilityRole="button"
                accessibilityLabel={`Lenda: ${l.nome}`}
              >
                {(focado || lendaAberta?.id === l.id) && <View style={styles.contornoPintado} />}
                {focado && (
                  <View style={styles.rotulo} pointerEvents="box-none">
                    <Text numberOfLines={1} style={styles.rotuloNome}>{l.nome}</Text>
                    <Text style={styles.rotuloInspecionar}>lenda · toque para ler</Text>
                  </View>
                )}
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
            Arraste para mover · passe o mouse nos lugares
          </Text>
        </View>
      </View>

      {/* Lenda de um símbolo pintado no mapa */}
      {lendaAberta && (
        <View style={styles.cardCronica}>
          <View style={styles.cronicaCabecalho}>
            <View style={styles.cronicaTituloBox}>
              <Text style={styles.cronicaIcone}>🐉</Text>
              <View style={styles.cronicaTitulos}>
                <Text style={styles.cronicaNome}>{lendaAberta.nome}</Text>
                <Text style={styles.cronicaRegiao}>{lendaAberta.regiao} · pintado no mapa dos cartógrafos</Text>
              </View>
            </View>
            <Pressable onPress={() => setLendaAberta(null)} style={styles.cronicaFecharBtn} accessibilityLabel="Fechar lenda" hitSlop={10}>
              <Text style={styles.cronicaFecharTxt}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.cronicaCorpo}>
            <View style={styles.cronicaBloco}>
              <Text style={styles.cronicaBlocoTexto}>{lendaAberta.lenda}</Text>
            </View>
            <View style={styles.cronicaBloco}>
              <View style={styles.cronicaBlocoHeader}>
                <Text style={styles.cronicaBlocoIcone}>🕯️</Text>
                <Text style={styles.cronicaBlocoTitulo}>O que o povo diz</Text>
              </View>
              <Text style={styles.cronicaBlocoTexto}>“{lendaAberta.boato}”</Text>
            </View>
          </View>
        </View>
      )}

      {/* Crônica Cósmica e Histórica do Lugar Inspecionado */}
      {lugarInspecionado && (
        <View style={styles.cardCronica}>
          <View style={styles.cronicaCabecalho}>
            <View style={styles.cronicaTituloBox}>
              <Text style={styles.cronicaIcone}>📜</Text>
              <View style={styles.cronicaTitulos}>
                <Text style={styles.cronicaNome}>{lugarInspecionado.nome}</Text>
                <Text style={styles.cronicaRegiao}>
                  {lugarInspecionado.regiao ?? 'Continente de Vaelhorn'}
                  {lugarInspecionado.sub ? ` · ${lugarInspecionado.sub}` : ''}
                </Text>
                {nomesAntigosDe(lugarInspecionado.id).map((n) => (
                  <Text key={n.id} style={styles.cronicaRegiao}>no mapa velho: {n.nome} — {n.lenda}</Text>
                ))}
              </View>
            </View>
            <Pressable
              onPress={() => setLugarInspecionado(null)}
              style={styles.cronicaFecharBtn}
              accessibilityLabel="Fechar crônica"
              hitSlop={10}
            >
              <Text style={styles.cronicaFecharTxt}>✕</Text>
            </Pressable>
          </View>

          {(() => {
            const cronica = CRONICAS_MAPA[lugarInspecionado.id];
            const camada = lugarInspecionado.camada ?? 'obtida';
            if (cronica && camada === 'ouvida') {
              // De um boato, só o que o povo diz.
              return (
                <View style={styles.cronicaCorpo}>
                  <Text style={styles.cronicaTextoVazio}>Você só ouviu falar deste lugar. O povo diz:</Text>
                  <View style={styles.cronicaBloco}>
                    <View style={styles.cronicaBlocoHeader}>
                      <Text style={styles.cronicaBlocoIcone}>🕯️</Text>
                      <Text style={styles.cronicaBlocoTitulo}>Superstição & Provérbio do Povo</Text>
                    </View>
                    <Text style={styles.cronicaBlocoTexto}>{cronica.supersticaoPopular}</Text>
                  </View>
                </View>
              );
            }
            if (cronica && camada === 'localizada') {
              // Sabe o caminho: a fé do lugar e o que se diz; o resto, só indo lá.
              return (
                <View style={styles.cronicaCorpo}>
                  <View style={styles.cronicaBloco}>
                    <View style={styles.cronicaBlocoHeader}>
                      <Text style={styles.cronicaBlocoIcone}>🏛️</Text>
                      <Text style={styles.cronicaBlocoTitulo}>Fé & Divindades Adoradas</Text>
                    </View>
                    <Text style={styles.cronicaBlocoTexto}>{cronica.divindadeOuCrenca}</Text>
                  </View>
                  <View style={styles.cronicaBloco}>
                    <View style={styles.cronicaBlocoHeader}>
                      <Text style={styles.cronicaBlocoIcone}>🕯️</Text>
                      <Text style={styles.cronicaBlocoTitulo}>Superstição & Provérbio do Povo</Text>
                    </View>
                    <Text style={styles.cronicaBlocoTexto}>{cronica.supersticaoPopular}</Text>
                  </View>
                  <Text style={styles.cronicaTextoVazio}>O resto da história deste lugar, só estando lá.</Text>
                </View>
              );
            }
            if (!cronica) {
              return (
                <Text style={styles.cronicaTextoVazio}>
                  Este território preserva segredos ancestrais ainda não registrados pelos monges e cronistas.
                </Text>
              );
            }
            return (
              <View style={styles.cronicaCorpo}>
                {/* 1. Deuses e Passado na Guerra Primordial */}
                <View style={styles.cronicaBloco}>
                  <View style={styles.cronicaBlocoHeader}>
                    <Text style={styles.cronicaBlocoIcone}>⚔️</Text>
                    <Text style={styles.cronicaBlocoTitulo}>Guerra dos Deuses & Sangue do Mana</Text>
                  </View>
                  <Text style={styles.cronicaBlocoTexto}>{cronica.passadoGuerraDeuses}</Text>
                </View>

                {/* 2. Religião e Culto Local */}
                <View style={styles.cronicaBloco}>
                  <View style={styles.cronicaBlocoHeader}>
                    <Text style={styles.cronicaBlocoIcone}>🏛️</Text>
                    <Text style={styles.cronicaBlocoTitulo}>Fé & Divindades Adoradas</Text>
                  </View>
                  <Text style={styles.cronicaBlocoTexto}>{cronica.divindadeOuCrenca}</Text>
                </View>

                {/* 3. Cicatriz das Bruxas dos Pecados */}
                <View style={styles.cronicaBloco}>
                  <View style={styles.cronicaBlocoHeader}>
                    <Text style={styles.cronicaBlocoIcone}>👁️</Text>
                    <Text style={styles.cronicaBlocoTitulo}>Cicatriz das Bruxas dos Pecados</Text>
                  </View>
                  <Text style={styles.cronicaBlocoTexto}>{cronica.marcaDasBruxas}</Text>
                </View>

                {/* 4. Superstição Popular */}
                <View style={styles.cronicaBloco}>
                  <View style={styles.cronicaBlocoHeader}>
                    <Text style={styles.cronicaBlocoIcone}>🕯️</Text>
                    <Text style={styles.cronicaBlocoTitulo}>Superstição & Provérbio do Povo</Text>
                  </View>
                  <Text style={styles.cronicaBlocoTexto}>{cronica.supersticaoPopular}</Text>
                </View>
              </View>
            );
          })()}

          {/* Rodapé do Card: Ação de Viagem ou Estado */}
          <View style={styles.cronicaRodape}>
            {lugarInspecionado.atual ? (
              <View style={styles.badgeAtual}>
                <Text style={styles.badgeAtualTexto}>📍 Você está acampado neste local</Text>
              </View>
            ) : lugarInspecionado.podeViajar ? (
              <Pressable
                style={styles.btnViajarCronica}
                onPress={() => {
                  onViajar?.(lugarInspecionado.id);
                  setLugarInspecionado(null);
                }}
              >
                <Text style={styles.btnViajarCronicaTexto}>
                  🚶 Iniciar Viagem para {lugarInspecionado.nome} ({lugarInspecionado.periodos ?? 1}{' '}
                  {lugarInspecionado.periodos === 1 ? 'período' : 'períodos'})
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.cronicaSemRota}>
                🧭 Sem rota direta a partir do local atual. Viaje passo a passo pelas estradas conectadas.
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Legenda curta, fora do mapa para não cobrir a arte. */}
      <View style={styles.legendaAbaixo}>
        <View style={styles.itemLegenda}>
          <View style={[styles.legendaBolinha, { borderWidth: 2, borderColor: cores.ouro, backgroundColor: 'transparent' }]} />
          <Text style={[styles.legendaTxt, { color: cores.ouro }]}>Você está aqui</Text>
        </View>
        <View style={styles.itemLegenda}>
          <View style={[styles.legendaBolinha, { backgroundColor: cores.ouro }]} />
          <Text style={styles.legendaTxt}>Dá para ir daqui</Text>
        </View>
        <View style={styles.itemLegenda}>
          <View style={[styles.legendaBolinha, { backgroundColor: cores.verdigris }]} />
          <Text style={styles.legendaTxt}>Já esteve</Text>
        </View>
        <View style={styles.itemLegenda}>
          <Text style={styles.legendaTxt}>{ehWeb ? 'Passe o mouse para ver o nome · clique em qualquer ponto para ler sua história' : 'Toque em qualquer ponto para ler a história do lugar'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardCronica: {
    marginTop: 10,
    backgroundColor: 'rgba(15, 18, 17, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
  cronicaCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    paddingBottom: 8,
    marginBottom: 10,
  },
  cronicaTituloBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cronicaIcone: {
    fontSize: 20,
  },
  cronicaTitulos: {
    flex: 1,
  },
  cronicaNome: {
    fontFamily: fontes.monoMedium,
    fontSize: 14,
    color: cores.ouro,
    letterSpacing: 0.5,
  },
  cronicaRegiao: {
    fontFamily: fontes.mono,
    fontSize: 10.5,
    color: cores.mudo,
    marginTop: 2,
  },
  cronicaFecharBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cronicaFecharTxt: {
    fontFamily: fontes.monoMedium,
    fontSize: 13,
    color: cores.mudo,
  },
  cronicaCorpo: {
    gap: 10,
  },
  cronicaBloco: {
    backgroundColor: 'rgba(25, 30, 28, 0.5)',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: cores.ouro,
  },
  cronicaBlocoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cronicaBlocoIcone: {
    fontSize: 12,
  },
  cronicaBlocoTitulo: {
    fontFamily: fontes.monoMedium,
    fontSize: 10.5,
    color: '#f0e6d2',
    letterSpacing: 0.4,
  },
  cronicaBlocoTexto: {
    fontFamily: fontes.mono,
    fontSize: 10.5,
    color: '#cbd5d1',
    lineHeight: 15,
  },
  cronicaTextoVazio: {
    fontFamily: fontes.mono,
    fontSize: 11,
    color: cores.mudo,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  cronicaRodape: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeAtual: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  badgeAtualTexto: {
    fontFamily: fontes.monoMedium,
    fontSize: 11,
    color: cores.ouro,
  },
  btnViajarCronica: {
    backgroundColor: 'rgba(212, 175, 55, 0.22)',
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  btnViajarCronicaTexto: {
    fontFamily: fontes.monoMedium,
    fontSize: 11.5,
    color: cores.ouro,
  },
  cronicaSemRota: {
    fontFamily: fontes.mono,
    fontSize: 10,
    color: cores.mudo,
    textAlign: 'center',
  },
  // Área clicável sobre uma cidade pintada: invisível, do tamanho do desenho.
  areaPintada: {
    position: 'absolute', width: 64, height: 56, marginLeft: -32, marginTop: -30,
    alignItems: 'center', justifyContent: 'center',
  },
  contornoPintado: {
    position: 'absolute', left: 4, top: 4, right: 4, bottom: 4, borderRadius: 30,
    borderWidth: 2, borderColor: 'rgba(212, 175, 55, 0.85)', backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  // Área clicável de um lugar sem desenho: maior que o ponto, para acertar.
  areaPonto: {
    position: 'absolute', width: 26, height: 26, marginLeft: -13, marginTop: -13,
    alignItems: 'center', justifyContent: 'center',
  },
  pontinho: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: cores.verdigris,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.6)',
  },
  pontinhoRota: { backgroundColor: cores.ouro, width: 10, height: 10, borderRadius: 5 },
  pontinhoDesconhecido: { opacity: 0.75 },
  pontinhoFeudo: { backgroundColor: '#b04a2f', width: 10, height: 10, borderRadius: 2, transform: [{ rotate: '45deg' }] },
  pontinhoFocado: { transform: [{ scale: 1.5 }] },
  anelAtual: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: cores.ouro,
  },
  rotulo: {
    position: 'absolute', top: 30, minWidth: 90, maxWidth: 200, alignItems: 'center',
    backgroundColor: 'rgba(20, 16, 10, 0.92)', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  rotuloNome: { fontFamily: fontes.monoMedium, fontSize: 11, color: '#f3e3ba' },
  rotuloSub: { fontFamily: fontes.mono, fontSize: 9, color: cores.mudo },
  rotuloAtual: { fontFamily: fontes.mono, fontSize: 9, color: cores.ouro, marginTop: 2 },
  rotuloViajar: { fontFamily: fontes.mono, fontSize: 9, color: cores.ouro, marginTop: 2 },
  rotuloInspecionar: { fontFamily: fontes.mono, fontSize: 9, color: '#a2c4c9', marginTop: 2 },
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
  legendaTxt: {
    color: cores.mudo,
    fontFamily: fontes.mono,
    fontSize: 9,
  },
});
