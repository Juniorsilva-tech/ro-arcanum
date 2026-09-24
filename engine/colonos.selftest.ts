// ARCANUM · A gente da colônia (engine/colonos.ts).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { fundarColonia, processarDiaColonia } from './colonia';
import { eficiencia, designarFuncao, aceitarChegada, recusarChegada, chanceDeChegada, gerarColono, melhorOficio, OFICIOS, MAX_COLONOS } from './colonos';
import { exportar, importar } from './persistencia';
import { createRng } from './rng';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const fundada = (sitio: string, seed = sitio): Campaign => {
  const c = criarCampanha(C, { nome: 'T', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  c.localAtual = sitio;
  if (!fundarColonia(C, c, '').ok) throw new Error('fundar');
  return c;
};
const dias = (c: Campaign, n: number) => { for (let i = 0; i < n; i++) { c.calendario.dia++; c.calendario.estacao = 'verao'; processarDiaColonia(C, c); } };

// ── 1. Os arquétipos ──────────────────────────────────────────────────────
{
  const a = C.arquetiposColono ?? [];
  ok(a.length >= 20, `${a.length} arquétipos de quem chega`);
  ok(a.every(x => x.historias.every(h => h.length >= 80)), 'Cada arquétipo tem duas histórias de verdade');
  ok(new Set(a.flatMap(x => x.historias)).size === a.length * 2, 'Nenhuma história repetida');
  ok(a.filter(x => x.genero === 'm').every(x => x.historias.every(h => /fora|longe|litoral/i.test(h))), 'Os homens que aparecem vêm de fora, e o texto diz');
  ok(OFICIOS.every(o => a.some(x => (x.aptidoes[o] ?? 0) >= 3)), 'Todo ofício tem quem saiba fazer bem');
}

// ── 2. Fundação e gente ───────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'fundadoras');
  const f = c.feudo!;
  ok(f.colonos!.length === 2 && f.populacao === 6, `Fundação: duas com nome (${f.colonos!.map(x => x.nome).join(', ')}) e quatro gente comum`);
  ok(f.colonos!.every(x => x.historia && x.nome.includes(' ')), 'Com história e sobrenome');
}

// ── 3. Ofícios ────────────────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'oficios');
  const f = c.feudo!;
  f.colonos = [];
  ok(eficiencia(f, 'lavoura') === 0.6, 'Sem responsável, a lavoura anda a 60%');
  const rng = createRng(1);
  const lavradora = gerarColono(C, c, rng, C.arquetiposColono!.find(a => a.id === 'lavradora')!, 'l');
  const curandeira = gerarColono(C, c, rng, C.arquetiposColono!.find(a => a.id === 'curandeira')!, 'k');
  f.colonos.push(lavradora, curandeira);
  designarFuncao(c, 'l', 'lavoura');
  const boa = eficiencia(f, 'lavoura');
  designarFuncao(c, 'l', undefined); designarFuncao(c, 'k', 'lavoura');
  const ruim = eficiencia(f, 'lavoura');
  ok(boa > 1 && ruim < boa, `A lavradora na roça rende ${Math.round(boa * 100)}%; a curandeira, ${Math.round(ruim * 100)}%`);
  // A roça sente a diferença.
  const a = fundada('campo_ceifa', 'roca-a'), b = fundada('campo_ceifa', 'roca-b');
  for (const x of [a, b]) { x.feudo!.colonos = [{ ...lavradora }]; x.feudo!.comida = 100; x.feudo!.populacao = 6; }
  designarFuncao(a, 'l', 'lavoura');
  dias(a, 1); dias(b, 1);
  ok(a.feudo!.ultimoRelatorio!.lavoura > b.feudo!.ultimoRelatorio!.lavoura, 'Com a lavradora responsável, a roça rende mais no mesmo dia');
}

// ── 4. Quem chega ─────────────────────────────────────────────────────────
{
  const c = fundada('vau_pedra', 'chegada');
  const f = c.feudo!;
  f.comida = 500; f.capacidadeHabitacional = 60; f.estabilidade = 70; f.renome = 40;
  ok(chanceDeChegada(C, f, 3) > chanceDeChegada(C, { ...f, renome: 0 }, 3), 'Mais renome, mais chance de chegar gente');
  ok(chanceDeChegada(C, { ...f, comida: 0 }, 3) === 0, 'Sem comida, ninguém vem');
  let dia = 0;
  while (!(f.chegadas ?? []).length && dia < 200) { dias(c, 1); dia++; f.comida = 500; }
  const ch = f.chegadas![0];
  ok(!!ch && ch.texto.length > 60, `Chegou gente à porta depois de ${dia} dias: "${ch?.texto.slice(0, 90)}..."`);
  const pop = f.populacao, total = ch.colonos.length + ch.comuns;
  ok(aceitarChegada(C, c, ch.id).ok && f.populacao === pop + total && f.colonos!.some(x => x.id === ch.colonos[0].id), `Aceita: entram ${total}, e ${ch.colonos[0].nome} passa a ter nome na colônia`);
  // Quem não é atendido desiste.
  f.chegadas = [{ ...ch, id: 'x', ate: c.calendario.dia + 1 }];
  const r0 = f.renome ?? 0;
  ok(recusarChegada(c, 'x').ok && (f.renome ?? 0) < r0, 'Mandar embora custa renome');
  f.chegadas = [{ ...ch, id: 'y', ate: c.calendario.dia + 1 }];
  dias(c, 2);
  ok(!f.chegadas.some(x => x.id === 'y'), 'Ninguém espera à porta para sempre');
  // Sem lugar, não entra.
  f.chegadas = [{ ...ch, id: 'z', ate: c.calendario.dia + 5 }];
  f.capacidadeHabitacional = f.populacao;
  ok(!aceitarChegada(C, c, 'z').ok, 'Sem abrigo, não cabe');
}

// ── 5. Humor ──────────────────────────────────────────────────────────────
{
  const c = fundada('clareira_pedras', 'humor');
  const f = c.feudo!;
  const alvo = f.colonos![0];
  alvo.temperamento = 'ambiciosa'; alvo.funcao = undefined;
  f.comida = 0; f.estabilidade = 10;
  for (let i = 0; i < 60 && f.colonos!.some(x => x.id === alvo.id); i++) { dias(c, 1); f.comida = 0; f.estabilidade = 10; }
  ok(!f.colonos!.some(x => x.id === alvo.id) && f.historicoEventos.some(e => e.texto.includes('foi embora')), 'Com fome, desordem e sem cargo, a ambiciosa vai embora');
  const d = fundada('campo_ceifa', 'feliz');
  const g = d.feudo!;
  g.comida = 500; g.estabilidade = 80;
  const cc = g.colonos![0];
  designarFuncao(d, cc.id, melhorOficio(cc));
  dias(d, 30);
  ok(cc.humor > 60, `Alimentada, em ordem e no ofício que sabe: humor ${Math.round(cc.humor)}`);
}

// ── 6. Save e RNG ─────────────────────────────────────────────────────────
{
  const c = fundada('vau_pedra', 'save');
  c.feudo!.comida = 500;
  dias(c, 30);
  const rng = JSON.stringify(c.rng);
  dias(c, 5);
  ok(JSON.stringify(c.rng) === rng, 'A gente da colônia não consome o RNG da campanha');
  const r = importar(exportar(c));
  ok(r.ok && JSON.stringify(r.valor.feudo!.colonos) === JSON.stringify(c.feudo!.colonos), 'Colonos voltam idênticos do save');
  ok(MAX_COLONOS === 40, 'Teto de 40 pessoas com nome');
}

console.log('\nGente da colônia: OK.');
