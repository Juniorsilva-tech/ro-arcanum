// ARCANUM · Identidade visual única para os nove mundos (GDD §30).
// Paleta de pigmento de manuscrito. Serifa para o que o modelo escreve,
// mono para o que a engine controla.

export const cores = {
  bistre: '#141110',
  fundo2: '#1C1815',
  fundo3: '#241F1A',
  couro: '#2E2620',
  linha: '#3E332A',
  vellum: '#EDE3CF',
  // §30 marca o #6E6252 como reprovado em AA; usamos o 'mudo' mais claro.
  mudo: '#A0917A',
  verdigris: '#5FA187', // seguro / positivo
  cinabrio: '#BF4E31', // dano / risco
  ouro: '#CFA82D', // raro / consequência / acento de Vaelhorn
  violeta: '#8272AE', // poder
} as const;

// Semântica de cor (GDD §30).
export const semantica = {
  positivo: cores.verdigris,
  risco: cores.cinabrio,
  raro: cores.ouro,
  poder: cores.violeta,
} as const;

export const fontes = {
  // Serifa — a VOZ (narração).
  serif: 'CormorantGaramond_400Regular',
  serifMedium: 'CormorantGaramond_500Medium',
  serifSemi: 'CormorantGaramond_600SemiBold',
  // Mono — os DADOS (o que a engine controla).
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

export const esp = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const raio = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

// Cor de um medidor de pressão conforme sobe.
export function corPressao(v: number): string {
  if (v >= 75) return cores.cinabrio;
  if (v >= 45) return cores.ouro;
  return cores.mudo;
}

export function corImpulso(v: number): string {
  if (v >= 75) return cores.cinabrio;
  if (v >= 55) return cores.ouro;
  return cores.mudo;
}

export function corGrau(grau: string): string {
  switch (grau) {
    case 'critico':
      return cores.ouro;
    case 'sucesso':
      return cores.verdigris;
    case 'sucesso_com_custo':
      return cores.ouro;
    case 'falha':
      return cores.mudo;
    case 'falha_grave':
      return cores.cinabrio;
    default:
      return cores.vellum;
  }
}
