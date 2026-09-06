// ARCANUM · Entrada de linha de comando do simulador de campanhas longas
// (ver engine/campanhaLonga.ts).
//
// Uso: npm run sim:longo -- <anos> <campanhas>
import { conteudoVaelhorn } from '../content/vaelhorn';
import { simularLote, resumir } from './campanhaLonga';

const anos = Number(process.argv[2] ?? 10);
const campanhas = Number(process.argv[3] ?? 8);

console.log(`\n=== ARCANUM · campanhas longas · ${campanhas} campanhas × ${anos} anos ===\n`);
const inicio = Date.now();
const { resultados, violacoes } = simularLote(conteudoVaelhorn, anos, campanhas);
const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

for (const [k, v] of Object.entries(resumir(resultados))) {
  console.log(`  ${k.padEnd(22)} ${String(v).padStart(10)}`);
}

console.log('\n--- desfecho por campanha ---');
for (const r of resultados) {
  const m = r.metricas;
  console.log(
    `  ${m.seed.padEnd(10)} ${String(m.anos).padStart(2)}a  ${m.causaFim.padEnd(12)}` +
      ` nível ${String(m.nivelFinal).padStart(2)}  pop ${String(m.populacaoFinal).padStart(4)}` +
      `  fome ${String(m.picoDeFome).padStart(4)}d  travas ${String(m.passosSemEfeito).padStart(5)}  violações ${r.violacoes.length}`,
  );
}

if (violacoes.length) {
  const porRegra = new Map<string, { n: number; exemplo: string; dia: number }>();
  for (const v of violacoes) {
    const atual = porRegra.get(v.regra);
    if (atual) atual.n++;
    else porRegra.set(v.regra, { n: 1, exemplo: v.detalhe, dia: v.dia });
  }
  console.log(`\n!!! ${violacoes.length} violações de invariante, em ${porRegra.size} regras:\n`);
  for (const [regra, { n, exemplo, dia }] of [...porRegra].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`  ${String(n).padStart(6)}×  ${regra}`);
    console.log(`          primeiro no dia ${dia}: ${exemplo}`);
  }
  console.log(`\nFALHOU em ${segundos}s.\n`);
  process.exit(1);
}

console.log(`\nNenhuma violação de invariante. OK em ${segundos}s.\n`);
