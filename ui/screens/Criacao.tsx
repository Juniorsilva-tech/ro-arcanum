// ARCANUM · Fluxo de criação: cenário → classe → origem → personagem (GDD §6.3, §32).
import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Pagina, BarraVoltar } from './_layout';
import { Titulo, TextoSerif, TextoMono, Botao, Card, Divisor, Selo, Rotulo } from '../components';
import { cores, fontes, esp } from '../theme';
import { useGame } from '../store';
import { cenariosDisponiveis, bundlePorId } from '@/content';
import { ATTR_KEYS, type AttrKey } from '@/engine/types';

export function EscolhaCenario() {
  const escolher = useGame((s) => s.escolherCenario);
  const irPara = useGame((s) => s.irPara);
  return (
    <Pagina>
      <BarraVoltar titulo="Escolha o mundo" />
      <TextoSerif style={styles.intro}>
        Nove mundos rodam sobre a mesma engine. Um está pronto para ser jogado.
      </TextoSerif>
      {cenariosDisponiveis.map((c) => (
        <Card key={c.id} acento={c.acentoCor} onPress={c.disponivel ? () => escolher(c.id) : undefined}>
          <View style={styles.linhaTitulo}>
            <Titulo style={{ fontSize: 24, color: c.disponivel ? cores.vellum : cores.mudo }}>
              {c.nome}
            </Titulo>
            {c.premium && <Selo texto="PREMIUM" cor={cores.ouro} />}
            {!c.disponivel && <Selo texto="EM BREVE" />}
          </View>
          <TextoMono style={{ marginTop: 4 }}>{c.genero}</TextoMono>
          <TextoMono style={{ color: cores.linha, marginTop: 2 }}>Pressões: {c.pressoes}</TextoMono>
        </Card>
      ))}
      <Botao titulo="Voltar ao início" variante="fantasma" onPress={() => irPara('entrada')} />
    </Pagina>
  );
}

export function EscolhaClasse() {
  const rascunho = useGame((s) => s.rascunho);
  const escolher = useGame((s) => s.escolherClasse);
  const content = bundlePorId(rascunho.cenarioId ?? 'vaelhorn')!;
  return (
    <Pagina>
      <BarraVoltar titulo="Quem você é" />
      <TextoSerif style={styles.intro}>
        A classe é o seu recurso principal e a sua mecânica única — não um punhado de números.
      </TextoSerif>
      {content.classes.map((c) => (
        <Card key={c.id} onPress={() => escolher(c.id)}>
          <Titulo style={{ fontSize: 24 }}>{c.nome}</Titulo>
          <TextoSerif style={styles.desc}>{c.descricao}</TextoSerif>
          <View style={styles.mecanica}>
            <Rotulo cor={cores.ouro}>Mecânica única</Rotulo>
            <TextoMono style={{ color: cores.vellum, marginTop: 2 }}>{c.mecanicaUnica}</TextoMono>
          </View>
        </Card>
      ))}
    </Pagina>
  );
}

export function EscolhaOrigem() {
  const rascunho = useGame((s) => s.rascunho);
  const escolher = useGame((s) => s.escolherOrigem);
  const content = bundlePorId(rascunho.cenarioId ?? 'vaelhorn')!;
  return (
    <Pagina>
      <BarraVoltar titulo="De onde você vem" />
      <TextoSerif style={styles.intro}>A origem se define pelo que falta.</TextoSerif>
      {content.origens.map((o) => (
        <Card key={o.id} onPress={() => escolher(o.id)}>
          <View style={styles.linhaTitulo}>
            <Titulo style={{ fontSize: 22 }}>{o.nome}</Titulo>
            <Selo texto={o.arquetipo} cor={cores.violeta} />
          </View>
          <TextoSerif style={styles.desc}>{o.descricao}</TextoSerif>
          <TextoMono style={{ marginTop: esp.sm }}>Falta a você: {o.oQueFalta}</TextoMono>
        </Card>
      ))}
    </Pagina>
  );
}

export function Criacao() {
  const rascunho = useGame((s) => s.rascunho);
  const ajustar = useGame((s) => s.ajustarAtributo);
  const setNome = useGame((s) => s.setNome);
  const iniciar = useGame((s) => s.iniciarCampanha);
  const restantes = useGame((s) => s.pontosRestantes());
  const content = bundlePorId(rascunho.cenarioId ?? 'vaelhorn')!;
  const nomes = content.cenario.nomesAtributos;

  return (
    <Pagina>
      <BarraVoltar titulo="Dar forma" />
      <Rotulo>Nome</Rotulo>
      <TextInput
        style={styles.input}
        value={rascunho.nome}
        onChangeText={setNome}
        placeholder="Como te chamam?"
        placeholderTextColor={cores.linha}
        maxLength={24}
      />

      <Divisor label={`Atributos · ${restantes} pontos restantes`} />
      {ATTR_KEYS.map((k: AttrKey) => (
        <View key={k} style={styles.attrLinha}>
          <View style={{ flex: 1 }}>
            <Text style={styles.attrNome}>{nomes[k]}</Text>
          </View>
          <Pressable style={styles.attrBtn} onPress={() => ajustar(k, -1)} hitSlop={6}>
            <Text style={styles.attrBtnTxt}>−</Text>
          </Pressable>
          <Text style={styles.attrValor}>{rascunho.atributos[k]}</Text>
          <Pressable style={styles.attrBtn} onPress={() => ajustar(k, +1)} hitSlop={6}>
            <Text style={styles.attrBtnTxt}>+</Text>
          </Pressable>
        </View>
      ))}

      <View style={{ height: esp.xl }} />
      <Botao
        titulo="Começar a história"
        sub={restantes > 0 ? `distribua os ${restantes} pontos, ou comece assim` : 'que os fados decidam'}
        variante="acento"
        onPress={iniciar}
      />
    </Pagina>
  );
}

const styles = StyleSheet.create({
  intro: { color: cores.mudo, fontStyle: 'italic', marginBottom: esp.lg },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: esp.sm },
  desc: { marginTop: esp.sm, color: cores.vellum, fontSize: 18, lineHeight: 26 },
  mecanica: { marginTop: esp.md, paddingTop: esp.md, borderTopWidth: 1, borderTopColor: cores.linha },
  input: {
    fontFamily: fontes.serif,
    color: cores.vellum,
    fontSize: 22,
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
    paddingVertical: esp.sm,
    marginTop: esp.xs,
  },
  attrLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: esp.md, gap: esp.md },
  attrNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 20 },
  attrBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: cores.linha,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attrBtnTxt: { fontFamily: fontes.mono, color: cores.ouro, fontSize: 20 },
  attrValor: {
    fontFamily: fontes.monoMedium,
    color: cores.vellum,
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
});
