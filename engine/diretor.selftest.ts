// ARCANUM · O mundo lembra (engine/memoriaMundo.ts) e o Diretor de Arcos
// (engine/diretor.ts).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo, registrarFato, cidadeIdDoLocal } from './historiaViva';
import { oferecerMissao, encerrarMissao } from './missoesVivas';
import { viajar } from './viagem';
import { estadoBandos } from './bandos';
import { processarCasas } from './casas';
import { exportar, importar } from './persistencia';
import { montarPacote } from './llm';
import { calcularContexto } from './availability';
import { lembrarAoChegar, consumirAvisos, avisosDoDia, feitosDoJogador, estadoMemoria } from './memoriaMundo';
import { processarDiretorDeArcos, ganchosPossiveis, DIAS_ENTRE_GANCHOS, DIAS_PARA_REPETIR_ALVO } from './diretor';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string): Campaign => {
  const c = criarCampanha(C, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};

// ── 1. O mundo lembra ─────────────────────────────────────────────────────
{
  const c = nova('lembra');
  c.calendario.dia = 10;
  const f = registrarFato(c, { tipo: 'capitao_morto', local: 'mercado', publico: true, atores: ['jogador'], texto: 'Rasga-Couro caiu. Os Filhos da Lama ficaram sem cabeça.' });
  ok(!lembrarAoChegar(C, c, 'mercado'), 'No mesmo dia do feito, nada: ainda não é volta');
  c.calendario.dia = 14;
  ok(!lembrarAoChegar(C, c, 'tessel'), 'Em outra cidade, nada');
  const linha = lembrarAoChegar(C, c, 'mercado');
  ok(!!linha && linha.includes(f.texto) && linha.startsWith('Na Feira Coberta,'), `Ao voltar, a engine escreve: "${linha}"`);
  ok(!lembrarAoChegar(C, c, 'mercado'), 'Cada feito é lembrado uma vez só');
  ok(avisosDoDia(c).includes(linha!), 'A linha está entre os avisos do dia, para o narrador');
  c.localAtual = 'mercado';
  const pacote = JSON.stringify(montarPacote(C, c, calcularContexto(C, c), 'Você chega.'));
  ok(pacote.includes('Rasga-Couro caiu'), 'O pacote do narrador leva a lembrança');
  const avisos = consumirAvisos(c);
  ok(avisos.length === 1 && avisos[0].texto === linha && consumirAvisos(c).length === 0, 'A tela consome a linha uma vez');
  ok(c.cronica.some(e => e.tipo === 'eco' && e.texto === linha), 'E ela fica na crônica');
  registrarFato(c, { tipo: 'espionagem', local: 'mercado', publico: false, atores: ['jogador'], texto: 'Você ouviu atrás da porta.' });
  c.calendario.dia = 20;
  ok(!lembrarAoChegar(C, c, 'mercado'), 'O que ninguém viu, a cidade não comenta');
  // Pelo caminho real: sair e voltar.
  registrarFato(c, { tipo: 'obra_prima', local: 'mercado', publico: true, atores: ['jogador'], texto: 'Saiu da bigorna uma peça que as ferreiras vão comentar: Lâmina longa de ferro, obra-prima.' });
  c.calendario.dia = 22;
  c.localAtual = 'mercado';
  let lembrou: string | undefined;
  for (let i = 0; i < 20 && !lembrou; i++) {
    c.combate = null;
    const ida = viajar(C, c, 'taverna');
    c.combate = null;
    if (!ida.ok) break;
    const volta = viajar(C, c, 'mercado');
    lembrou = volta.lembranca;
    if (volta.encontro) { c.combate = null; }
  }
  ok(!!lembrou && lembrou.includes('bigorna'), `Viajando de verdade: "${lembrou}"`);
}

// ── 2. Missão cumprida é feito do jogador ────────────────────────────────
{
  const c = nova('missao-feito');
  const base = registrarFato(c, { tipo: 'epidemia', local: 'tessel', publico: true, atores: [], texto: 'Febre em Tessel.' });
  const q = oferecerMissao(c, 'tratar', base, {}, C)!;
  q.estado = 'aceita';
  encerrarMissao(c, q, 'concluida', 'Tratar a febre: você organizou a ajuda.');
  ok(c.vivo!.fatos.at(-1)!.atores.includes('jogador'), 'Missão cumprida pelo jogador tem o jogador como ator');
  const q2 = oferecerMissao(c, 'abastecer', registrarFato(c, { tipo: 'fome', local: 'tessel', publico: true, atores: [], texto: 'Fome.' }), {}, C)!;
  encerrarMissao(c, q2, 'resolvida_por_outros', 'A comunidade resolveu.');
  ok(!c.vivo!.fatos.at(-1)!.atores.includes('jogador'), 'Resolvida por outros, não');
  const q3 = oferecerMissao(c, 'reconstruir', registrarFato(c, { tipo: 'incendio', local: 'tessel', publico: true, atores: [], texto: 'Fogo.' }), {}, C)!;
  q3.estado = 'aceita';
  encerrarMissao(c, q3, 'falhada', 'O prazo passou.');
  ok(c.vivo!.fatos.at(-1)!.atores.includes('jogador'), 'Compromisso aceito e falhado também é do jogador (a cidade lembra)');
  const feitos = feitosDoJogador(C, c);
  ok(feitos.length === 2 && feitos[0].dia <= feitos[1].dia && feitos[0].local === 'Tessel', `Crônica do jogador em ordem: ${feitos.map(x => x.texto).join(' | ')}`);
}

// ── 3. Diretor de Arcos ───────────────────────────────────────────────────
function existe(c: Campaign, alvo: string): boolean {
  const [tipo, id, extra] = alvo.split(':');
  if (tipo === 'missao' || tipo === 'oferta') return !!c.vivo!.missoes.find(q => q.id === id && q.estado === (tipo === 'missao' ? 'aceita' : 'oferecida'));
  if (tipo === 'capitao') return !!c.bandos?.bandos[id]?.capitao.vivo;
  if (tipo === 'casa') return !!C.casas?.some(h => h.id === id) && !!c.mundo?.casas?.[id];
  if (tipo === 'luto') return !!c.familiasNpc?.lutos[id]?.some(l => l.morto === extra);
  return false;
}
{
  const c = nova('diretor');
  c.calendario.dia = 30;
  c.localAtual = 'tessel';
  const base = registrarFato(c, { tipo: 'epidemia', local: 'tessel', publico: true, atores: [], texto: 'Febre.' });
  const q = oferecerMissao(c, 'tratar', base, {}, C)!;
  q.estado = 'aceita'; q.prazo = 31;
  const antesRng = JSON.stringify(c.rng);
  processarDiretorDeArcos(C, c);
  const m = estadoMemoria(c);
  ok(m.diretor.ganchos === 1 && m.avisos[0].texto.includes('mensageiro') && m.avisos[0].texto.includes('falta um dia'), `Compromisso perto do prazo: "${m.avisos[0].texto}"`);
  processarDiretorDeArcos(C, c);
  ok(m.diretor.ganchos === 1, 'No mesmo dia, nenhum segundo gancho');
  c.calendario.dia = 31; processarDiretorDeArcos(C, c);
  ok(m.diretor.ganchos === 1, `Intervalo de ${DIAS_ENTRE_GANCHOS} dias entre ganchos`);
  ok(JSON.stringify(c.rng) === antesRng, 'O diretor não consome o RNG da campanha');

  // Capitão que caça o jogador.
  const b = Object.values(estadoBandos(C, c).bandos)[0];
  b.capitao.caca = true;
  c.calendario.dia = 30 + DIAS_ENTRE_GANCHOS; processarDiretorDeArcos(C, c);
  ok(m.diretor.ganchos === 2 && m.avisos.at(-1)!.texto.includes(b.capitao.nome), `A missão já avisada cede a vez: "${m.avisos.at(-1)!.texto}"`);

  // Trinta dias com vários alvos: no máximo um gancho a cada intervalo, todos
  // apontando para estado que existe, sem repetir alvo dentro da janela.
  const casa = C.casas![0];
  processarCasas(C, c);
  c.mundo!.casas![casa.id].legitimidade = 10;
  const vistos: { dia: number; alvo: string }[] = [];
  for (let d = 34; d < 64; d++) {
    c.calendario.dia = d;
    const antes = m.diretor.ganchos;
    const possiveis = ganchosPossiveis(C, c);
    processarDiretorDeArcos(C, c);
    if (m.diretor.ganchos > antes) {
      const alvo = Object.entries(m.diretor.alvos).find(([, dia]) => dia === d)![0];
      ok(possiveis.some(g => g.alvo === alvo) && existe(c, alvo), `Dia ${d}: gancho aponta para ${alvo}, que existe`);
      vistos.push({ dia: d, alvo });
    }
  }
  ok(vistos.some(v => v.alvo.startsWith('casa:')) && vistos.some(v => v.alvo.startsWith('capitao:')), `Em 30 dias, ganchos de capitão e de casa: ${vistos.map(v => v.alvo).join(', ')}`);
  ok(vistos.every((v, i) => i === 0 || v.dia - vistos[i - 1].dia >= DIAS_ENTRE_GANCHOS), 'Nunca dois ganchos dentro do intervalo');
  ok(vistos.every((v, i) => vistos.slice(0, i).every(o => o.alvo !== v.alvo || v.dia - o.dia >= DIAS_PARA_REPETIR_ALVO)), `O mesmo alvo não volta antes de ${DIAS_PARA_REPETIR_ALVO} dias`);
  ok(m.avisos.length <= 3, 'A fila da tela não cresce sem limite');

  const r = importar(exportar(c));
  ok(r.ok && JSON.stringify(r.valor.memoriaMundo) === JSON.stringify(c.memoriaMundo), 'Memória e diretor voltam idênticos do save');

  const presa = nova('diretor-cativo');
  presa.personagem.condicoes.push('cativo');
  const q4 = oferecerMissao(presa, 'tratar', registrarFato(presa, { tipo: 'epidemia', local: 'tessel', publico: true, atores: [], texto: 'Febre.' }), {}, C)!;
  q4.estado = 'aceita'; q4.prazo = presa.calendario.dia + 1;
  processarDiretorDeArcos(C, presa);
  ok(!presa.memoriaMundo?.diretor.ganchos, 'Cativo não recebe mensageiro');
}

// ── 4. Pedido de ajuda aqui vira conhecido ───────────────────────────────
{
  const c = nova('oferta');
  c.localAtual = 'tessel';
  c.calendario.dia = 40;
  const q = oferecerMissao(c, 'reconstruir', registrarFato(c, { tipo: 'incendio', local: 'tessel', publico: true, atores: [], texto: 'Fogo.' }), {}, C)!;
  q.conhecida = false;
  processarDiretorDeArcos(C, c);
  ok(cidadeIdDoLocal(C, c, q.local) === 'tessel' && q.conhecida && estadoMemoria(c).avisos.at(-1)!.texto.includes(q.titulo), `Pedido na cidade vira boato: "${estadoMemoria(c).avisos.at(-1)!.texto}"`);
}

console.log('\nMemória do mundo e Diretor de Arcos: OK.');
