// Configurações do narrador: extensão, ritmo e menção à decisão (preferência
// do aparelho), e os lembretes da campanha ("lembre o narrador de…").
// Nada aqui muda o que a engine decide; só a voz de quem narra.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { TextoMono, Divisor } from '../components';
import { cores, fontes, esp } from '../theme';
import { useGame } from '../store';
import { ESTILO_PADRAO, type EstiloNarrador } from '@/engine/llm';

type Opcao<T extends string> = { id: T; rotulo: string };

const EXTENSOES: Opcao<EstiloNarrador['extensao']>[] = [
  { id: 'curta', rotulo: 'Curta · 3–5' },
  { id: 'media', rotulo: 'Média · 4–7' },
  { id: 'longa', rotulo: 'Longa · 8–12' },
];
const RITMOS: Opcao<EstiloNarrador['ritmo']>[] = [
  { id: 'atmosfera', rotulo: 'Atmosfera' },
  { id: 'equilibrado', rotulo: 'Equilibrado' },
  { id: 'trama', rotulo: 'Trama rápida' },
];
const MENCOES: Opcao<EstiloNarrador['mencao']>[] = [
  { id: 'incorporar', rotulo: 'Mostrar minha ação' },
  { id: 'direto', rotulo: 'Direto à consequência' },
];

function Linha<T extends string>({
  titulo, dica, opcoes, valor, onEscolher,
}: { titulo: string; dica: string; opcoes: Opcao<T>[]; valor: T; onEscolher: (v: T) => void }) {
  return (
    <View style={{ marginBottom: esp.md }}>
      <Text style={styles.titulo}>{titulo}</Text>
      <TextoMono style={{ color: cores.mudo, marginBottom: esp.sm }}>{dica}</TextoMono>
      <View style={styles.chips}>
        {opcoes.map((o) => (
          <Pressable key={o.id} onPress={() => onEscolher(o.id)} style={[styles.chip, valor === o.id && styles.chipAtivo]}>
            <Text style={[styles.chipTxt, valor === o.id && styles.chipTxtAtivo]}>{o.rotulo}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function EstiloNarradorPainel() {
  const config = useGame((s) => s.config);
  const setConfig = useGame((s) => s.setConfig);
  const camp = useGame((s) => s.camp);
  const lembrar = useGame((s) => s.lembrarNarrador);
  const esquecer = useGame((s) => s.esquecerLembrete);
  const [novo, setNovo] = useState('');
  const estilo = { ...ESTILO_PADRAO, ...(config.estilo ?? {}) };
  const mudar = (patch: Partial<EstiloNarrador>) => void setConfig({ estilo: { ...estilo, ...patch } });

  return (
    <>
      <Divisor label="Estilo do narrador" />
      <Linha
        titulo="Extensão da cena"
        dica="parágrafos por cena; abertura, chegada e luta ganham mais fôlego"
        opcoes={EXTENSOES}
        valor={estilo.extensao}
        onEscolher={(v) => mudar({ extensao: v })}
      />
      <Linha
        titulo="Ritmo"
        dica="atmosfera demora nos sentidos; trama rápida anda a história"
        opcoes={RITMOS}
        valor={estilo.ritmo}
        onEscolher={(v) => mudar({ ritmo: v })}
      />
      <Linha
        titulo="Menção à decisão"
        dica="recontar o que você fez, ou começar já pelo que aconteceu"
        opcoes={MENCOES}
        valor={estilo.mencao}
        onEscolher={(v) => mudar({ mencao: v })}
      />

      {camp && (
        <>
          <Divisor label="Lembre o narrador" />
          <TextoMono style={{ color: cores.mudo, marginBottom: esp.sm }}>
            Detalhes da história que o narrador esqueceu ou deve manter (até 8). São memória, não regra: não mudam
            dinheiro, itens nem relações — o estado do jogo sempre vence.
          </TextoMono>
          {(camp.lembretesNarrador ?? []).map((l, k) => (
            <View key={`${k}-${l}`} style={styles.lembrete}>
              <Text style={styles.lembreteTxt}>{l}</Text>
              <Pressable hitSlop={8} onPress={() => void esquecer(k)}>
                <Text style={styles.remover}>✕</Text>
              </Pressable>
            </View>
          ))}
          <View style={styles.novoWrap}>
            <TextInput
              style={styles.input}
              value={novo}
              onChangeText={setNovo}
              maxLength={200}
              placeholder="ex.: a cicatriz de Elza é na mão esquerda"
              placeholderTextColor={cores.mudo}
              onSubmitEditing={() => { void lembrar(novo); setNovo(''); }}
            />
            <Pressable
              style={[styles.chip, !novo.trim() && { opacity: 0.4 }]}
              disabled={!novo.trim()}
              onPress={() => { void lembrar(novo); setNovo(''); }}
            >
              <Text style={styles.chipTxt}>Lembrar</Text>
            </Pressable>
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fontes.mono, color: cores.vellum, fontSize: 12, letterSpacing: 1, marginBottom: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm },
  chip: { paddingVertical: 6, paddingHorizontal: esp.md, borderWidth: 1, borderColor: cores.linha, borderRadius: 3 },
  chipAtivo: { borderColor: cores.ouro, backgroundColor: 'rgba(212,175,55,0.12)' },
  chipTxt: { fontFamily: fontes.mono, fontSize: 11, color: cores.mudo },
  chipTxtAtivo: { color: cores.ouro },
  lembrete: { flexDirection: 'row', alignItems: 'center', gap: esp.sm, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: cores.linha },
  lembreteTxt: { flex: 1, color: cores.vellum, fontSize: 14 },
  remover: { color: cores.cinabrio, fontSize: 14, paddingHorizontal: 4 },
  novoWrap: { flexDirection: 'row', alignItems: 'center', gap: esp.sm, marginTop: esp.sm },
  input: { flex: 1, borderWidth: 1, borderColor: cores.linha, color: cores.vellum, paddingHorizontal: esp.sm, paddingVertical: 6, fontSize: 14 },
});
