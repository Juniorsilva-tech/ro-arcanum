// ARCANUM · Raiz do app. Carrega fontes, inicializa o store e roteia por tela.
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { cores } from './ui/theme';
import { useGame } from './ui/store';
import { Entrada, Aviso17 } from './ui/screens/Onboarding';
import { EscolhaCenario, EscolhaClasse, EscolhaOrigem, EscolhaInfancia, Criacao } from './ui/screens/Criacao';
import { Jogo } from './ui/screens/Jogo';
import { Ficha, Vinculos, Cronica, Mapa, Livro, Missoes } from './ui/screens/Paineis';
import { FimCapitulo, Config } from './ui/screens/Sistema';
import { Inventario } from './ui/screens/Inventario';
import { Loja } from './ui/screens/Loja';
import { Combate } from './ui/screens/Combate';
import { PrologoInfancia } from './ui/screens/Prologo';
import { Assentamento } from './ui/screens/Assentamento';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  // Importa só os 5 pesos usados (via require do .ttf), evitando o barrel
  // do @expo-google-fonts que empacotaria 24 fontes.
  const [fontesCarregadas] = useFonts({
    CormorantGaramond_400Regular: require('@expo-google-fonts/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf'),
    CormorantGaramond_500Medium: require('@expo-google-fonts/cormorant-garamond/500Medium/CormorantGaramond_500Medium.ttf'),
    CormorantGaramond_600SemiBold: require('@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf'),
    IBMPlexMono_400Regular: require('@expo-google-fonts/ibm-plex-mono/400Regular/IBMPlexMono_400Regular.ttf'),
    IBMPlexMono_500Medium: require('@expo-google-fonts/ibm-plex-mono/500Medium/IBMPlexMono_500Medium.ttf'),
  });

  const pronto = useGame((s) => s.pronto);
  const init = useGame((s) => s.init);
  const tela = useGame((s) => s.tela);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (fontesCarregadas && pronto) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontesCarregadas, pronto]);

  if (!fontesCarregadas || !pronto) {
    return <View style={styles.fundo} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.fundo}>{roteia(tela)}</View>
    </SafeAreaProvider>
  );
}

function roteia(tela: string) {
  switch (tela) {
    case 'entrada':
      return <Entrada />;
    case 'aviso17':
      return <Aviso17 />;
    case 'cenario':
      return <EscolhaCenario />;
    case 'classe':
      return <EscolhaClasse />;
    case 'origem':
      return <EscolhaOrigem />;
    case 'infancia':
      return <EscolhaInfancia />;
    case 'criacao':
      return <Criacao />;
    case 'prologo':
      return <PrologoInfancia />;
    case 'jogo':
      return <Jogo />;
    case 'mapa':
      return <Mapa />;
    case 'livro':
      return <Livro />;
    case 'ficha':
      return <Ficha />;
    case 'vinculos':
      return <Vinculos />;
    case 'cronica':
      return <Cronica />;
    case 'config':
      return <Config />;
    case 'inventario':
      return <Inventario />;
    case 'loja':
      return <Loja />;
    case 'combate':
      return <Combate />;
    case 'missoes':
      return <Missoes />;
    case 'assentamento':
      return <Assentamento />;
    case 'fimcapitulo':
      return <FimCapitulo />;
    default:
      return <Entrada />;
  }
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cores.bistre },
});
