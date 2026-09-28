// ARCANUM · A roça da colônia (engine/cultivos.ts): o que se planta neste
// sítio, o que cada planta faz, e a troca — que deixa a roça parada uns dias.
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { TextoMono, TextoSerif, Card, Divisor } from '../components';
import { cores, esp, fontes } from '../theme';
import { useGame } from '../store';
import { CULTIVOS, cultivosDoSitio, cultivoAtual, replantando, podePlantar, DIAS_REPLANTIO, sitioDe } from '@/engine';

export function RocaDaColonia() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const plantar = useGame((s) => s.plantarCultivoAcao);
  const f = camp.feudo;
  const sitio = f?.fundado ? sitioDe(content, f.sitio) : undefined;
  if (!f || !sitio) return null;
  const atual = cultivoAtual(f);
  const dia = camp.calendario.dia;
  const brotando = replantando(f, dia);
  const rel = f.ultimoRelatorio;

  return (
    <View style={{ gap: esp.md }}>
      <Card>
        <TextoSerif style={{ fontSize: 18 }}>Roça de {atual.nome.toLowerCase()}</TextoSerif>
        <TextoMono style={{ color: cores.mudo }}>{atual.efeito}</TextoMono>
        {brotando ? (
          <TextoMono style={{ color: cores.ouro }}>Brotando: primeira colheita em {(f.replantioAte ?? dia) - dia} dia(s).</TextoMono>
        ) : (
          rel && <TextoMono>Ontem a roça deu {Math.round(rel.lavoura)} de comida.</TextoMono>
        )}
        {(f.edificios.lavoura_silos ?? 0) === 0 && (
          <TextoMono style={{ color: cores.cinabrio }}>Sem lavoura e silos construídos, nada se colhe.</TextoMono>
        )}
      </Card>

      <Divisor label={`O que dá em ${sitio.nome}`} />
      <TextoMono style={{ color: cores.mudo }}>
        Trocar de planta deixa a roça parada por {DIAS_REPLANTIO} dias enquanto a nova brota.
      </TextoMono>
      {cultivosDoSitio(sitio.id).map((id) => {
        const c = CULTIVOS[id];
        const pode = podePlantar(content, camp, id);
        const eAtual = atual.id === id;
        return (
          <View key={id} style={[styles.linha, eAtual && styles.linhaAtual]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nome, eAtual && { color: cores.ouro }]}>{c.nome}</Text>
              <TextoMono style={{ color: cores.mudo }}>{c.efeito}</TextoMono>
              {!eAtual && !pode.pode && <TextoMono style={{ color: cores.cinabrio }}>{pode.motivo}</TextoMono>}
            </View>
            {eAtual ? (
              <Text style={styles.selo}>plantado</Text>
            ) : (
              <Pressable
                disabled={!pode.pode}
                style={[styles.botao, !pode.pode && { opacity: 0.4 }]}
                onPress={() => void plantar(id)}
              >
                <Text style={styles.botaoTxt}>Plantar</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: esp.sm, padding: esp.sm, borderWidth: 1, borderColor: cores.linha },
  linhaAtual: { borderColor: cores.ouro },
  nome: { fontFamily: fontes.mono, color: cores.vellum, fontSize: 13 },
  selo: { fontFamily: fontes.mono, color: cores.verdigris, fontSize: 11 },
  botao: { paddingVertical: 6, paddingHorizontal: esp.md, borderWidth: 1, borderColor: cores.linha },
  botaoTxt: { fontFamily: fontes.mono, fontSize: 11, color: cores.vellum },
});
