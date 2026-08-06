// ARCANUM · Entrada e Aviso 17+ (GDD §32 P0, §25).
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Pagina } from './_layout';
import { Titulo, TextoSerif, TextoMono, Botao, Divisor } from '../components';
import { cores, fontes, esp } from '../theme';
import { useGame } from '../store';

export function Entrada() {
  const novoJogo = useGame((s) => s.novoJogo);
  const continuar = useGame((s) => s.continuar);
  const temSave = useGame((s) => s.temSave);
  const irPara = useGame((s) => s.irPara);

  return (
    <Pagina>
      <View style={styles.hero}>
        <TextoMono style={styles.selo}>UM RPG NARRATIVO</TextoMono>
        <Titulo style={styles.marca}>ARCANUM</Titulo>
        <TextoSerif style={styles.tagline}>
          A engine é dona da verdade. O modelo é dono da voz.
        </TextoSerif>
      </View>

      <Divisor />

      {temSave && (
        <Botao titulo="Continuar" sub="retomar a última campanha" variante="acento" onPress={continuar} />
      )}
      <Botao
        titulo="Nova campanha"
        sub="começar uma nova história em Vaelhorn"
        variante={temSave ? 'primario' : 'acento'}
        onPress={novoJogo}
      />
      <Botao titulo="Configurações" sub="narração por IA, chave de API" variante="fantasma" onPress={() => irPara('config')} />

      <Divisor />
      <TextoMono style={styles.rodape}>
        Fatia vertical do GDD · cenário Vaelhorn · offline-first
      </TextoMono>
    </Pagina>
  );
}

export function Aviso17() {
  const aceitar = useGame((s) => s.aceitarAviso);
  const irPara = useGame((s) => s.irPara);
  return (
    <Pagina>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <TextoMono style={styles.avisoSelo}>17+</TextoMono>
        <Titulo style={{ marginBottom: esp.lg }}>Um aviso antes de entrar</Titulo>
        <TextoSerif style={styles.avisoTexto}>
          ARCANUM é uma ficção sombria para adultos. Todos os personagens são adultos, sem exceção.
        </TextoSerif>
        <TextoSerif style={styles.avisoTexto}>
          Sexualidade, substâncias, violência e transgressão existem aqui como sistemas com
          consequência — nunca como espetáculo nem como instrução. A ação está no menu, o efeito está
          no estado, e a cena corta.
        </TextoSerif>
        <View style={{ height: esp.xl }} />
        <Botao titulo="Tenho 17 anos ou mais — entrar" variante="acento" onPress={aceitar} />
        <Botao titulo="Voltar" variante="fantasma" onPress={() => irPara('entrada')} />
      </View>
    </Pagina>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: esp.xxl, marginBottom: esp.xl },
  selo: { letterSpacing: 4, marginBottom: esp.md, color: cores.mudo },
  marca: { fontSize: 52, letterSpacing: 8, color: cores.ouro },
  tagline: { textAlign: 'center', color: cores.mudo, fontStyle: 'italic', marginTop: esp.md },
  rodape: { textAlign: 'center', color: cores.linha, marginTop: esp.md },
  avisoSelo: {
    fontFamily: fontes.monoMedium,
    color: cores.cinabrio,
    fontSize: 40,
    letterSpacing: 2,
    marginBottom: esp.md,
  },
  avisoTexto: { color: cores.vellum, marginBottom: esp.md },
});
