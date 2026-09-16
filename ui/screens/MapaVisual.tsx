import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Campaign, ContentBundle } from '@/engine/types';
import { posicaoMapa } from '@/content/vaelhorn/mapa';
import { cores, fontes, esp } from '../theme';
import { rotasVisiveis } from '@/engine';

export function MapaVisual({ content, camp }: { content: ContentBundle; camp: Campaign }) {
  const visitados = new Set(camp.locaisVisitados);
  const rotas = rotasVisiveis(content, camp);
  const pontos = new Set([...camp.locaisVisitados, ...rotas.map((r) => r.destino)]);
  return (
    <View style={styles.mapa} accessibilityLabel="Mapa do mundo conhecido">
      <View style={styles.grade} />
      {[...pontos].map((id) => {
        const local = content.locais.find((l) => l.id === id);
        if (!local) return null;
        const conhecido = visitados.has(id);
        const atual = id === camp.localAtual;
        const pos = posicaoMapa(id, local.regiao);
        return (
          <View key={id} style={[styles.ponto, { left: `${pos.x}%`, top: `${pos.y}%` }, atual && styles.pontoAtual, !conhecido && styles.pontoOculto]}>
            <View style={[styles.pino, atual && styles.pontoAtualPino]} />
            {conhecido && <Text numberOfLines={1} style={[styles.nome, atual && styles.nomeAtual]}>{local.nome}</Text>}
            {!conhecido && <Text style={styles.interrogacao}>?</Text>}
          </View>
        );
      })}
      <View style={styles.legenda}>
        <Text style={styles.legendaTxt}>● conhecido</Text>
        <Text style={styles.legendaTxt}>? rumor ou rota não visitada</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapa: { height: 300, marginVertical: esp.md, borderWidth: 1, borderColor: cores.linha, borderRadius: 10, backgroundColor: cores.fundo2, overflow: 'hidden', position: 'relative' },
  grade: { ...StyleSheet.absoluteFill, opacity: 0.12, backgroundColor: cores.verdigris },
  ponto: { position: 'absolute', width: 100, alignItems: 'center', transform: [{ translateX: -50 }, { translateY: -8 }] },
  pontoAtual: { zIndex: 3 },
  pontoOculto: { opacity: 0.55 },
  pino: { width: 13, height: 13, borderRadius: 7, backgroundColor: cores.verdigris, borderWidth: 2, borderColor: cores.bistre },
  pontoAtualPino: { backgroundColor: cores.ouro },
  nome: { maxWidth: 98, color: cores.mudo, fontFamily: fontes.mono, fontSize: 9, textAlign: 'center', marginTop: 3 },
  nomeAtual: { color: cores.ouro },
  interrogacao: { color: cores.linha, fontFamily: fontes.monoMedium, fontSize: 13, marginTop: -1 },
  legenda: { position: 'absolute', bottom: 8, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between' },
  legendaTxt: { color: cores.mudo, fontFamily: fontes.mono, fontSize: 9 },
});
