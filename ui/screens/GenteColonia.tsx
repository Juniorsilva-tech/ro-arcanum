// ARCANUM · A gente da colônia (sessão 57, etapa B): quem espera à porta,
// quem cuida de quê e como está cada uma.
import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { TextoMono, TextoSerif, Card, Botao, Divisor, Selo } from '../components';
import { cores, esp } from '../theme';
import { useGame } from '../store';
import { OFICIOS, NOME_OFICIO, NOME_TEMPERAMENTO, eficiencia, responsavel, melhorOficio, capacidadeReal, type OficioColonia } from '@/engine';

const barras = (n: number) => '●'.repeat(n) + '○'.repeat(Math.max(0, 5 - n));

export function GenteDaColonia() {
  const camp = useGame(s => s.camp)!;
  const content = useGame(s => s.content)!;
  const aceitar = useGame(s => s.aceitarChegadaAcao);
  const recusar = useGame(s => s.recusarChegadaAcao);
  const designar = useGame(s => s.designarFuncaoAcao);
  const responder = useGame(s => s.resolverAudienciaAcao);
  const [aberto, setAberto] = useState<string | undefined>();
  const f = camp.feudo;
  if (!f?.fundado) return null;
  const colonos = f.colonos ?? [];
  const comuns = Math.max(0, f.populacao - colonos.length);
  return (
    <View style={{ gap: esp.md }}>
      <Card>
        <TextoSerif style={{ fontSize: 20 }}>Renome: {Math.floor(f.renome ?? 0)}</TextoSerif>
        <TextoMono style={{ color: cores.mudo }}>
          O que a estrada fala da colônia. Cresce com gente alimentada e em ordem, com problemas bem resolvidos; cai com fome, desordem
          e gente mandada embora. Quanto maior, mais gente aparece à porta.
        </TextoMono>
        <TextoMono style={{ marginTop: 6 }}>
          {colonos.length} com nome · {comuns} gente comum · lugar para {capacidadeReal(content, f)}
        </TextoMono>
      </Card>

      {f.audiencia && (
        <>
          <Divisor label="pedem audiência" />
          <Card acento={cores.cinabrio}>
            <TextoMono>{f.audiencia.texto}</TextoMono>
            <TextoMono style={{ fontSize: 12, color: cores.mudo }}>Espera resposta até o dia {f.audiencia.ate}. Sem resposta, a colônia nota.</TextoMono>
            {f.audiencia.opcoes.map(o => (
              <View key={o.id} style={{ marginTop: 6 }}>
                <Botao titulo={o.rotulo} variante="fantasma" onPress={() => responder(o.id)} />
                <TextoMono style={{ fontSize: 12, color: cores.mudo }}>{o.efeito}</TextoMono>
              </View>
            ))}
          </Card>
        </>
      )}

      {(f.chegadas ?? []).length > 0 && <Divisor label="à porta" />}
      {(f.chegadas ?? []).map(ch => (
        <Card key={ch.id} acento={cores.ouro}>
          <TextoMono>{ch.texto}</TextoMono>
          {ch.colonos.map(c => (
            <TextoMono key={c.id} style={{ fontSize: 12, marginTop: 4 }}>
              {c.nome} · {NOME_TEMPERAMENTO[c.temperamento]} · sabe {NOME_OFICIO[melhorOficio(c)]} ({barras(c.aptidoes[melhorOficio(c)] ?? 0)})
            </TextoMono>
          ))}
          {ch.comuns > 0 && <TextoMono style={{ fontSize: 12 }}>Mais {ch.comuns} com ela.</TextoMono>}
          {ch.traz && <TextoMono style={{ fontSize: 12 }}>Traz: {Object.entries(ch.traz).map(([a, n]) => `${n} ${a}`).join(', ')}.</TextoMono>}
          <TextoMono style={{ fontSize: 12, color: cores.mudo }}>Espera até o dia {ch.ate}.</TextoMono>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <View style={{ flex: 1 }}><Botao titulo="Deixar entrar" variante="acento" onPress={() => aceitar(ch.id)} /></View>
            <View style={{ flex: 1 }}><Botao titulo="Mandar embora" variante="fantasma" onPress={() => recusar(ch.id)} /></View>
          </View>
        </Card>
      ))}

      <Divisor label="ofícios" />
      <Card>
        {OFICIOS.map(o => {
          const r = responsavel(f, o);
          return (
            <TextoMono key={o}>
              {NOME_OFICIO[o]}: {r ? r.nome : 'ninguém responsável'} · rende {Math.round(eficiencia(f, o) * 100)}%
            </TextoMono>
          );
        })}
      </Card>

      <Divisor label="gente com nome" />
      {colonos.length === 0 && <TextoMono>Ninguém com nome ainda.</TextoMono>}
      {colonos.map(c => (
        <Card key={c.id}>
          <Pressable onPress={() => setAberto(aberto === c.id ? undefined : c.id)}>
            <View style={styles.linha}>
              <TextoSerif style={{ fontSize: 17 }}>{c.nome}</TextoSerif>
              <Selo texto={c.funcao ? NOME_OFICIO[c.funcao] : 'sem cargo'} cor={c.funcao ? cores.verdigris : cores.mudo} />
            </View>
            <TextoMono style={{ fontSize: 12 }}>
              {c.idade} anos · {NOME_TEMPERAMENTO[c.temperamento]} · humor {Math.round(c.humor)} · lealdade {Math.round(c.lealdade)}
            </TextoMono>
          </Pressable>
          {aberto === c.id && (
            <View style={{ marginTop: 6 }}>
              <TextoMono style={{ fontStyle: 'italic' }}>{c.historia}</TextoMono>
              {OFICIOS.filter(o => (c.aptidoes[o] ?? 0) > 0).map(o => (
                <TextoMono key={o} style={{ fontSize: 12 }}>{NOME_OFICIO[o]} {barras(c.aptidoes[o] ?? 0)}</TextoMono>
              ))}
              <View style={styles.escolhas}>
                {OFICIOS.map((o: OficioColonia) => (
                  <Pressable key={o} onPress={() => designar(c.id, o)} style={[styles.chip, c.funcao === o && styles.chipAtivo]}>
                    <Text style={[styles.chipTxt, c.funcao === o && { color: cores.ouro }]}>{NOME_OFICIO[o]}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => designar(c.id, undefined)} style={styles.chip}>
                  <Text style={styles.chipTxt}>sem cargo</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  escolhas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: cores.linha, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipAtivo: { borderColor: cores.ouro },
  chipTxt: { color: cores.vellum, fontSize: 12 },
});
