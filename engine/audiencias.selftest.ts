// ARCANUM · Audiências da colônia (engine/audiencias.ts), sessão 58.
// O que estes testes seguram:
// - cada pedido nasce do estado (fome só com celeiro baixo, furto só com
//   guarda fraca, briga só com gente briguenta ou de mau humor...);
// - cada escolha cobra o que a tela promete, e recusa quando falta recurso;
// - pedido ignorado vence e cobra; uma audiência por vez, com intervalo;
// - nada consome o RNG da campanha; tudo volta igual do save.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { fundarColonia, processarDiaColonia } from './colonia';
import { talvezAudiencia, resolverAudiencia, INTERVALO_AUDIENCIA, type Audiencia } from './audiencias';
import { exportar, importar } from './persistencia';
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

/** Avança dias até sair um pedido do tipo pedido (ou desiste). */
const esperarPedido = (c: Campaign, tipo: Audiencia['tipo'], preparar: () => void, maxDias = 80): Audiencia | undefined => {
  for (let i = 0; i < maxDias; i++) {
    preparar();
    c.calendario.dia++;
    const f = c.feudo!;
    if (f.audiencia && f.audiencia.tipo !== tipo) f.audiencia = undefined;
    const a = f.audiencia ?? talvezAudiencia(C, c);
    if (a?.tipo === tipo) return a;
    f.audiencia = undefined;
  }
  return undefined;
};

// ── Nascem do estado ──────────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'farto');
  const f = c.feudo!;
  let fome = 0;
  for (let i = 0; i < 60; i++) { f.comida = 999; f.seguranca = 90; c.calendario.dia++; const a = talvezAudiencia(C, c); if (a?.tipo === 'fome' || a?.tipo === 'furto') fome++; f.audiencia = undefined; }
  ok(fome === 0, 'celeiro cheio e guarda forte: ninguém pede por fome nem conta furto');

  const faminta = fundada('campo_ceifa', 'fome');
  const a = esperarPedido(faminta, 'fome', () => { faminta.feudo!.comida = 5; });
  ok(!!a, `celeiro baixo gera pedido de fome: "${a?.texto.slice(0, 70)}..."`);
}

// ── Fome: cada escolha cumpre ─────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'fome-escolha');
  const f = c.feudo!;
  const a = esperarPedido(c, 'fome', () => { f.comida = 5; })!;
  f.tesouro = 0;
  ok(!resolverAudiencia(c, 'comprar').ok && !!f.audiencia, 'sem ouro, comprar grão é recusado e o pedido continua');
  f.tesouro = 500;
  const comida = f.comida;
  const r = resolverAudiencia(c, 'comprar');
  ok(r.ok && f.comida === comida + a.valores.grao && f.tesouro === 500 - a.valores.preco, `comprar grão entra ${a.valores.grao} de comida por ${a.valores.preco} de ouro`);
  ok(!f.audiencia, 'respondido, o pedido sai');

  const d = fundada('campo_ceifa', 'racao');
  esperarPedido(d, 'fome', () => { d.feudo!.comida = 5; });
  resolverAudiencia(d, 'racionar');
  d.feudo!.comida = 100;
  const antes = d.feudo!.comida;
  d.calendario.dia++;
  const rel = processarDiaColonia(C, d)!;
  ok(rel.consumo < d.feudo!.populacao * 0.12 && antes > 0, `racionar: a colônia come 60% (${rel.consumo.toFixed(2)} contra ${(d.feudo!.populacao * 0.12).toFixed(2)})`);
}

// ── Furto ─────────────────────────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'furto');
  const f = c.feudo!;
  let antes = 0;
  const a = esperarPedido(c, 'furto', () => { f.comida = 100; f.seguranca = 10; antes = f.comida; })!;
  ok(!!a && f.comida === antes - a.valores.sumiu, `o furto já tirou ${a?.valores.sumiu} de comida do celeiro`);
  const suspeita = a.envolvidos[0];
  const pop = f.populacao;
  resolverAudiencia(c, 'expulsar');
  ok(!f.colonos!.some(x => x.id === suspeita) && f.populacao === pop - 1, 'expulsar tira a suspeita da colônia');
}

// ── Casamento não se repete ───────────────────────────────────────────────
{
  const c = fundada('campo_ceifa', 'casamento');
  const f = c.feudo!;
  const felizes = () => { for (const x of f.colonos!) x.humor = 90; f.comida = 500; f.seguranca = 90; };
  const a = esperarPedido(c, 'casamento', felizes)!;
  ok(!!a, 'duas pessoas felizes pedem para se unir');
  resolverAudiencia(c, 'simples');
  const [x, y] = a.envolvidos.map(id => f.colonos!.find(k => k.id === id)!);
  ok(x.conjuge === y.id && y.conjuge === x.id, 'a união fica registrada nas duas');
  const outra = esperarPedido(c, 'casamento', felizes, 40);
  ok(!outra || !outra.envolvidos.some(id => id === x.id || id === y.id), 'o mesmo casal não pede de novo');
}

// ── Ignorar cobra; intervalo entre pedidos ────────────────────────────────
{
  const c = fundada('campo_ceifa', 'ignora');
  const f = c.feudo!;
  const a = esperarPedido(c, 'fome', () => { f.comida = 5; })!;
  const ordem = f.estabilidade;
  c.calendario.dia = a.ate;
  talvezAudiencia(C, c);
  ok(!f.audiencia || f.audiencia.id !== a.id, 'pedido sem resposta vence');
  ok(f.estabilidade < ordem && f.historicoEventos.some(e => e.texto.includes('Ninguém respondeu')), 'e a ordem cai: a colônia notou');

  const d = fundada('campo_ceifa', 'intervalo');
  const g = d.feudo!;
  const b = esperarPedido(d, 'fome', () => { g.comida = 5; })!;
  resolverAudiencia(d, 'racionar');
  let cedo = false;
  for (let i = 1; i < INTERVALO_AUDIENCIA; i++) { d.calendario.dia = b.dia + i; if (talvezAudiencia(C, d)) cedo = true; }
  ok(!cedo, `nenhum pedido novo antes de ${INTERVALO_AUDIENCIA} dias`);
}

// ── Determinismo e save ───────────────────────────────────────────────────
{
  const c = fundada('vau_pedra', 'rng');
  const f = c.feudo!;
  const cursor = c.rng.cursor;
  for (let i = 0; i < 40; i++) { f.comida = 5; f.seguranca = 10; c.calendario.dia++; talvezAudiencia(C, c); }
  ok(c.rng.cursor === cursor, 'as audiências não consomem o RNG da campanha');
  const volta = importar(exportar(c));
  ok(volta.ok && JSON.stringify(volta.valor.feudo!.audiencia) === JSON.stringify(f.audiencia), 'o pedido pendente volta igual do save');
}

console.log('\nAudiências: OK.');
