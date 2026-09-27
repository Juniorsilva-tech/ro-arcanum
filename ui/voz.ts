// Narração em voz alta com a voz do próprio aparelho (expo-speech). Local e
// sem custo: nada sai do dispositivo além do que o sistema operacional já faz.

import * as Speech from 'expo-speech';

/** Texto da cena pronto para ler: sem colchete de falante nem travessão. */
export function textoParaVoz(texto: string): string {
  return texto
    .replace(/\[(você|voce)\]\s*/gi, '')
    .replace(/\[([^\]]+)\]\s*/g, '$1: ')
    .replace(/^\s*[—–-]\s*/gm, '')
    .replace(/\s+\n/g, '\n')
    .trim();
}

export function lerEmVoz(texto: string, aoTerminar?: () => void): void {
  Speech.stop();
  Speech.speak(textoParaVoz(texto), {
    language: 'pt-BR',
    rate: 0.95,
    onDone: aoTerminar,
    onStopped: aoTerminar,
    onError: aoTerminar,
  });
}

export function pararVoz(): void {
  Speech.stop();
}
