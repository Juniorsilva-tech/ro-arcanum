// ARCANUM · Raiz do app. Carrega fontes, inicializa o store e roteia por tela.
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';

import { cores } from './ui/theme';
import { useGame } from './ui/store';
import { Entrada, Aviso17 } from './ui/screens/Onboarding';
import { EscolhaCenario, EscolhaClasse, EscolhaOrigem, Criacao } from './ui/screens/Criacao';
import { Jogo } from './ui/screens/Jogo';
import { Ficha, Vinculos, Cronica, Mapa, Livro } from './ui/screens/Paineis';
import { FimCapitulo, Config } from './ui/screens/Sistema';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontesCarregadas] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
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
    case 'criacao':
      return <Criacao />;
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
    case 'fimcapitulo':
      return <FimCapitulo />;
    default:
      return <Entrada />;
  }
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cores.bistre },
});
