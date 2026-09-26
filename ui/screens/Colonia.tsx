// ARCANUM · Telas da colônia num lugar real (sessão 57).
// A fundação lista os sítios do mapa com vantagens e desvantagens escritas a
// partir dos números do terreno (engine/colonia.ts); o card do sítio mostra o
// que o lugar fez hoje.
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Image } from 'react-native';
import { TextoMono, TextoSerif, Card, Botao, Divisor, Selo, BannerIlustrado } from '../components';
import { cores, esp } from '../theme';
import { useGame } from '../store';
import { efeitosDoSitio, podeFundarAqui, sitioDe, capacidadeReal, modificadoresDoSitio, CUSTO_FAROL, periodoAtual } from '@/engine';
import { IMAGENS_FEUDO } from './Assentamento';

const ROTULOS: Record<string, string> = {
  agua: 'água', solo: 'solo', madeira: 'madeira', pedra: 'pedra', caca: 'caça', pesca: 'pesca',
  pasto: 'pasto', defesa: 'defesa', passagem: 'passagem', perigo: 'perigo', inverno: 'inverno',
};
const barras = (n: number) => '●'.repeat(n) + '○'.repeat(3 - n);

export function FundacaoColonia() {
  const camp = useGame(s => s.camp)!;
  const content = useGame(s => s.content)!;
  const fundar = useGame(s => s.fundarColoniaAcao);
  const [nome, setNome] = useState('');
  const pode = podeFundarAqui(content, camp);
  const aqui = pode.sitio;
  return (
    <Card style={{ marginVertical: esp.md }}>
      <TextoSerif style={{ fontSize: 22, color: cores.ouro }}>Fundar uma colônia</TextoSerif>
      <TextoMono style={{ marginVertical: esp.sm }}>
        Uma colônia começa com seis pessoas, abrigos de lona e uma roça. Funda-se num lugar sem dona, estando nele. O lugar decide
        quase tudo: água, solo, o que se caça e se pesca, quem passa, quem cobra e o que ronda.
      </TextoMono>
      {aqui ? (
        <View style={{ gap: 8 }}>
          <TextoMono style={{ color: cores.verdigris }}>Você está em {aqui.nome}. Dá para fundar aqui.</TextoMono>
          <TextInput value={nome} onChangeText={setNome} placeholder={`Colônia de ${aqui.nome}`} placeholderTextColor={cores.mudo} style={styles.campo} />
          <Botao titulo={`Fincar o estandarte em ${aqui.nome}`} variante="acento" onPress={() => fundar(nome)} />
        </View>
      ) : (
        <TextoMono style={{ color: cores.mudo }}>{pode.motivo}</TextoMono>
      )}
      <Divisor label="lugares sem dona" />
      {(content.sitiosColonia ?? []).map(s => {
        const imagemSitio = IMAGENS_FEUDO[s.bioma] ?? IMAGENS_FEUDO.acampamento;
        return (
          <Card key={s.id} acento={s.id === camp.localAtual ? cores.ouro : undefined} style={styles.cardSitio}>
            <View style={styles.bannerSitioContainer}>
              <Image source={imagemSitio} style={styles.bannerSitioImagem} resizeMode="cover" />
              <View style={styles.bannerSitioGradiente}>
                <TextoSerif style={{ fontSize: 18, color: cores.ouro }}>{s.nome}</TextoSerif>
                <Selo texto={s.regiao} cor={cores.verdigris} />
              </View>
            </View>
            <View style={{ padding: esp.md }}>
              <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>{s.descricao}</TextoMono>
              <TextoMono style={{ fontSize: 12 }}>
                {Object.entries(s.terreno).map(([k, v]) => `${ROTULOS[k]} ${barras(v as number)}`).join('   ')}
              </TextoMono>
              {efeitosDoSitio(s).map((e, i) => (
                <TextoMono key={i} style={{ color: e.tipo === 'vantagem' ? cores.verdigris : cores.cinabrio, marginTop: 2 }}>
                  {e.tipo === 'vantagem' ? '+ ' : '− '}{e.texto}
                </TextoMono>
              ))}
              <TextoMono style={{ color: cores.ouro, marginTop: 4 }}>{s.tracoTexto}</TextoMono>
              <TextoMono style={{ fontSize: 12, marginTop: 4 }}>
                Animais na região: {Object.entries(s.animais).map(([a, n]) => `${a} (${n})`).join(', ')}
              </TextoMono>
            </View>
          </Card>
        );
      })}
    </Card>
  );
}

export function SitioDaColonia() {
  const camp = useGame(s => s.camp)!;
  const content = useGame(s => s.content)!;
  const farol = useGame(s => s.reacenderFarolAcao);
  const f = camp.feudo;
  const s = sitioDe(content, f?.sitio);
  if (!f || !s) return null;
  const imagemSitio = IMAGENS_FEUDO[s.bioma] ?? IMAGENS_FEUDO.acampamento;
  const m = modificadoresDoSitio(s, f.edificios.cisterna_poco ?? 0);
  const cap = capacidadeReal(content, f);
  const r = f.ultimoRelatorio;
  const n = (x: number) => Math.round(x * 10) / 10;
  return (
    <Card style={styles.cardSitio}>
      <BannerIlustrado
        source={imagemSitio}
        periodo={periodoAtual(camp.calendario)}
        titulo={s.nome}
        subtitulo={s.tracoTexto}
        seloTexto={s.regiao.toUpperCase()}
        seloCor={cores.ouro}
        altura={170}
      />
      <View style={{ padding: esp.md }}>
        <TextoMono style={{ color: cores.mudo }}>{s.tracoTexto}</TextoMono>
        <TextoMono style={{ marginTop: 6 }}>
          Gente: {f.populacao} · abrigo para {f.capacidadeHabitacional} · água para {m.capacidadeAgua}
          {cap < f.capacidadeHabitacional ? ' — a água é o limite: cave poço ou cisterna.' : ''}
        </TextoMono>
        {r && (
          <TextoMono style={{ marginTop: 6 }}>
            Ontem: roça {n(r.lavoura)}{r.tributo ? ` (−${n(r.tributo)} para Tessel)` : ''} · caça e pesca {n(r.selvagem)} · consumo {n(r.consumo)} ·
            material +{n(r.materiais)} · ouro +{n(r.renda)}
          </TextoMono>
        )}
        {r?.eventos.map((e, i) => <TextoMono key={i} style={{ color: cores.ouro }}>{e}</TextoMono>)}
        {s.traco === 'farol_apagado' && !f.farolAceso && (
          <View style={{ marginTop: 10 }}>
            <Botao titulo={`Reacender o farol · ${CUSTO_FAROL.materiais} material, ${CUSTO_FAROL.ouro} ouro`} onPress={() => farol()} />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  campo: { borderWidth: 1, borderColor: cores.linha, color: cores.vellum, padding: 8, borderRadius: 4 },
  cardSitio: { padding: 0, overflow: 'hidden', marginVertical: 6 },
  bannerSitioContainer: { height: 110, width: '100%', position: 'relative' },
  bannerSitioImagem: { width: '100%', height: '100%' },
  bannerSitioGradiente: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 17, 16, 0.45)',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: esp.md,
  },
});
