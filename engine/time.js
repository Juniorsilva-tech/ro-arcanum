"use strict";
// ARCANUM · Tempo. O turno é o PERÍODO do dia (GDD §1).
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOME_ESTACAO = exports.NOME_PERIODO = exports.PERIODOS = void 0;
exports.periodoAtual = periodoAtual;
exports.avancarPeriodos = avancarPeriodos;
exports.estacaoNoDia = estacaoNoDia;
exports.custoComoChegada = custoComoChegada;
exports.dataPorExtenso = dataPorExtenso;
exports.PERIODOS = [
    'madrugada',
    'manha',
    'tarde',
    'entardecer',
    'anoitecer',
    'noite',
];
exports.NOME_PERIODO = {
    madrugada: 'Madrugada',
    manha: 'Manhã',
    tarde: 'Tarde',
    entardecer: 'Entardecer',
    anoitecer: 'Anoitecer',
    noite: 'Noite',
};
exports.NOME_ESTACAO = {
    primavera: 'primavera',
    verao: 'verão',
    outono: 'outono',
    inverno: 'inverno',
};
function periodoAtual(cal) {
    return exports.PERIODOS[cal.periodoIndex % exports.PERIODOS.length];
}
// Avança N períodos, rolando dias e estações.
function avancarPeriodos(cal, n) {
    let dia = cal.dia;
    let idx = cal.periodoIndex;
    for (let i = 0; i < n; i++) {
        idx += 1;
        if (idx >= exports.PERIODOS.length) {
            idx = 0;
            dia += 1;
        }
    }
    return { ...cal, dia, periodoIndex: idx, estacao: estacaoNoDia(cal, dia) };
}
function estacaoNoDia(cal, dia) {
    const estacoes = ['primavera', 'verao', 'outono', 'inverno'];
    const avancos = Math.floor(dia * 4 / 365) - Math.floor(cal.dia * 4 / 365);
    return estacoes[((estacoes.indexOf(cal.estacao) + avancos) % 4 + 4) % 4];
}
// Custo de tempo NUNCA é exibido como número — sempre como horário de chegada (GDD §1.2).
function custoComoChegada(cal, custoPeriodos) {
    if (custoPeriodos <= 0)
        return 'um instante';
    const destino = avancarPeriodos(cal, custoPeriodos);
    if (custoPeriodos >= 3)
        return 'toma o dia inteiro';
    return `leva até ${chegadaTexto(periodoAtual(destino))}`;
}
function chegadaTexto(p) {
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
function dataPorExtenso(cal, ancora) {
    const ordinal = ordinalPt(cal.dia + 1);
    const est = exports.NOME_ESTACAO[cal.estacao];
    const fase = cal.dia < 10 ? `${est} adiantado` : cal.dia < 25 ? `pleno ${est}` : `${est} tardio`;
    return `${ordinal} dia ${ancora} · ${fase}`;
}
function ordinalPt(n) {
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
