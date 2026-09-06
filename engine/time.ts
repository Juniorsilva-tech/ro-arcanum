// ARCANUM · Tempo. O turno é o PERÍODO do dia (GDD §1).

export const PERIODOS = [
  'madrugada',
  'manha',
  'tarde',
  'entardecer',
  'anoitecer',
  'noite',
] as const;

export type Periodo = (typeof PERIODOS)[number];

export const NOME_PERIODO: Record<Periodo, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  entardecer: 'Entardecer',
  anoitecer: 'Anoitecer',
  noite: 'Noite',
};

export type Estacao = 'primavera' | 'verao' | 'outono' | 'inverno';

export const NOME_ESTACAO: Record<Estacao, string> = {
  primavera: 'primavera',
  verao: 'verão',
  outono: 'outono',
  inverno: 'inverno',
};

export type CalendarioState = {
  dia: number; // dias corridos desde o início da campanha
  periodoIndex: number; // 0..5
  estacao: Estacao;
};

export function periodoAtual(cal: CalendarioState): Periodo {
  return PERIODOS[cal.periodoIndex % PERIODOS.length];
}

// Avança N períodos, rolando dias e estações.
export function avancarPeriodos(cal: CalendarioState, n: number): CalendarioState {
  let dia = cal.dia;
  let idx = cal.periodoIndex;
  for (let i = 0; i < n; i++) {
    idx += 1;
    if (idx >= PERIODOS.length) {
      idx = 0;
      dia += 1;
    }
  }
  return { ...cal, dia, periodoIndex: idx, estacao: estacaoNoDia(cal, dia) };
}

export function estacaoNoDia(cal: CalendarioState, dia: number): Estacao {
  const estacoes: Estacao[] = ['primavera', 'verao', 'outono', 'inverno'];
  const avancos = Math.floor(dia * 4 / 365) - Math.floor(cal.dia * 4 / 365);
  return estacoes[((estacoes.indexOf(cal.estacao) + avancos) % 4 + 4) % 4];
}

// Custo de tempo NUNCA é exibido como número — sempre como horário de chegada (GDD §1.2).
export function custoComoChegada(cal: CalendarioState, custoPeriodos: number): string {
  if (custoPeriodos <= 0) return 'um instante';
  const destino = avancarPeriodos(cal, custoPeriodos);
  if (custoPeriodos >= 3) return 'toma o dia inteiro';
  return `leva até ${chegadaTexto(periodoAtual(destino))}`;
}

function chegadaTexto(p: Periodo): string {
  switch (p) {
    case 'madrugada':
      return 'a madrugada';
    case 'manha':
      return 'a manhã';
    case 'tarde':
      return 'a tarde';
    case 'entardecer':
      return 'o entardecer';
    case 'anoitecer':
      return 'o anoitecer';
    case 'noite':
      return 'a noite';
  }
}

// Calendário datado pelo evento mais recente e pela estação (GDD §1.3). Nunca "Dia 14".
export function dataPorExtenso(cal: CalendarioState, ancora: string): string {
  const ordinal = ordinalPt(cal.dia + 1);
  const est = NOME_ESTACAO[cal.estacao];
  const fase = cal.dia < 10 ? `${est} adiantado` : cal.dia < 25 ? `pleno ${est}` : `${est} tardio`;
  return `${ordinal} dia ${ancora} · ${fase}`;
}

function ordinalPt(n: number): string {
  const nomes = [
    'primeiro',
    'segundo',
    'terceiro',
    'quarto',
    'quinto',
    'sexto',
    'sétimo',
    'oitavo',
    'nono',
    'décimo',
  ];
  return nomes[n - 1] ?? `${n}º`;
}
