// ARCANUM · A guarda no mundo: cidades, NPCs, verbos e o assentamento.
// O que estes testes seguram:
// - a força da guarda sai da cidade: muralha e gente sobem, fome e desordem
//   derrubam; no assentamento do jogador, vale a segurança dele;
// - guarda forte acha o procurado mais rápido; no próprio assentamento a
//   patrulha de fora quase não entra, e a guarda de lá não te prende;
// - quem você nocauteou hoje não vem te prender agora;
// - crime de verbo visto pela guarda (agredir, furtar pego) deixa procurado;
// - as cidades têm crime sem o jogador: a guarda prende gente com nome, e a
//   pessoa sai sozinha quando a pena acaba;
// - no assentamento: crime de colono vira julgamento, a guarda da região
//   vem cobrar o senhor procurado por sangue, e entregar-se leva à cela;
// - matar dentro do próprio assentamento não te deixa procurado, mas derruba
//   a ordem.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { calcularContexto } from './availability';
import { iniciarMundoVivo, cidadeIdDoLocal } from './historiaViva';
import { fundarColonia } from './colonia';
import { talvezAudiencia, resolverAudiencia } from './audiencias';
import { iniciarBriga, concluirBriga } from './briga';
import { jogadorAtaca } from './combat';
import { resolverIntencao } from './turn';
import { processarCrimeUrbano } from './crimeUrbano';
import { processarMundoVivo } from './mundoVivo';
import { forcaGuarda, registrarCrime, procuraAqui, checarPerseguicao, regiaoDe, procuraDaRegiao, cartazDe, custoDoSuborno, responderAbordagem, concluirConfrontoGuarda, CACADOR } from './guarda';
import { montarPacote } from './llm';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string, local = 'taverna'): Campaign => {
  const c = criarCampanha(C, { nome: 'Torvald', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  c.personagem.idade = 20;
  if (!c.vivo) iniciarMundoVivo(C, c);
  c.localAtual = local;
  return c;
};
const vencer = (c: Campaign) => {
  const s = c.combate!;
  const eu = s.atores.find((a) => a.ehJogador)!;
  eu.vida = eu.vidaMax = 999; eu.acerto = 40;
  for (let i = 0; i < 80 && !s.terminado; i++) {
    const alvo = s.atores.find((a) => !a.ehJogador && !a.ehAliado && a.vida > 0 && !a.capturado);
    if (!alvo) break;
    jogadorAtaca(C, c, alvo.id);
  }
};
/** Quantas abordagens em N dias, sempre com a mesma procura. */
const abordagens = (c: Campaign, dias: number): number => {
  let n = 0;
  for (let i = 0; i < dias; i++) {
    c.abordagem = undefined;
    c.turno++;
    c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
    const pr = procuraAqui(C, c);
    if (pr) pr.pontos = 40;
    if (checarPerseguicao(C, c)) n++;
  }
  return n;
};

{
  // Força da guarda pela cidade.
  const c = nova('forca');
  const cidadeId = cidadeIdDoLocal(C, c, c.localAtual)!;
  const cidade = c.vivo!.cidades[cidadeId];
  ok(cidade, `a taverna pertence a uma cidade viva (${cidadeId})`);
  cidade.edificios.muralha = 3; cidade.inseguranca = 0; cidade.fomeDias = 0;
  const forte = forcaGuarda(C, c, c.localAtual);
  cidade.edificios.muralha = 0; cidade.inseguranca = 80; cidade.fomeDias = 5;
  const fraca = forcaGuarda(C, c, c.localAtual);
  ok(forte > fraca + 30, `muralha e ordem fazem guarda forte (${forte}); fome e desordem, fraca (${fraca})`);

  // Guarda forte acha mais rápido (sem guarda na cena, para medir só a cidade).
  const medir = (seed: string, muralha: number, inseg: number, fome: number) => {
    const d = nova(seed, 'mercado');
    const id = cidadeIdDoLocal(C, d, d.localAtual)!;
    Object.assign(d.vivo!.cidades[id], { inseguranca: inseg, fomeDias: fome });
    d.vivo!.cidades[id].edificios.muralha = muralha;
    for (const n of calcularContexto(C, d).presentes) if (/guard|sentinel|soldad|patrulh|sargent/i.test(n.ocupacao ?? '')) d.npcState[n.id].vivo = false;
    registrarCrime(C, d, 'arruaca', 40, 'teste');
    return abordagens(d, 300);
  };
  const nForte = medir('rapida', 3, 0, 0), nFraca = medir('lenta', 0, 90, 9);
  ok(nForte > nFraca, `cidade de guarda forte aborda mais (${nForte} contra ${nFraca} em 300 dias)`);
}

{
  // Quem você nocauteou hoje não vem te prender agora.
  const c = nova('nocaute', 'praca');
  const guarda = calcularContexto(C, c).presentes.find((n) => /guard|sargent/i.test(n.ocupacao ?? ''));
  ok(guarda, `há guarda na praça (${guarda?.nome})`);
  iniciarBriga(C, c, [guarda!.id], false);
  vencer(c);
  concluirBriga(C, c);
  c.combate = undefined;
  ok(procuraAqui(C, c)?.gravidade === 'arruaca', 'nocautear a guarda deixa procurado por arruaça');
  const t = checarPerseguicao(C, c);
  ok(!t || !t.startsWith(guarda!.nome), 'a guarda que você nocauteou hoje não é quem te aborda');
}

{
  // Crime de verbo visto pela guarda.
  const c = nova('verbo');
  const alvo = calcularContexto(C, c).presentes[0];
  for (let i = 0; i < 30 && !procuraAqui(C, c); i++) {
    resolverIntencao(C, c, { tipo: 'verbo', verboId: 'agredir', alvoId: alvo.id } as Parameters<typeof resolverIntencao>[2]);
  }
  ok(procuraAqui(C, c)?.gravidade === 'arruaca', `agredir em público deixa procurado (${procuraAqui(C, c)?.motivo})`);
}

{
  // Crime nas cidades sem o jogador.
  const c = nova('crime-urbano');
  const cidadeId = cidadeIdDoLocal(C, c, c.localAtual)!;
  const cidade = c.vivo!.cidades[cidadeId];
  let presos = 0;
  let preso: string | undefined;
  for (let d = 0; d < 400 && !preso; d++) {
    cidade.inseguranca = 90; cidade.fomeDias = 5; cidade.edificios.muralha = 3;
    for (const p of Object.values(c.vivo!.pessoas)) { p.fome = 80; p.moedas = 2; }
    c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
    processarCrimeUrbano(C, c);
    const agora = Object.entries(c.vivo!.pessoas).find(([, p]) => p.objetivo === 'preso');
    if (agora) { presos++; preso = agora[0]; }
  }
  ok(presos > 0 && preso, `a guarda prende gente com nome na cidade (${preso})`);
  ok(c.vivo!.fatos.some((f) => f.tipo === 'prisao_npc'), 'a prisão vira fato público');
  ok(!calcularContexto(C, c).presentes.some((n) => n.id === preso), 'quem está preso some da cena');
  const ate = c.vivo!.pessoas[preso!].presoAte!;
  for (let d = c.calendario.dia; d <= ate + 1; d++) {
    c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
    processarMundoVivo(C, c);
  }
  ok(c.vivo!.pessoas[preso!].objetivo !== 'preso', 'cumprida a pena, a pessoa sai sozinha');
}

{
  // O assentamento do jogador.
  const c = nova('colonia', 'campo_ceifa');
  ok(fundarColonia(C, c, '').ok, 'fundou a colônia');
  const f = c.feudo!;
  ok(forcaGuarda(C, c, c.localAtual) === Math.round(f.seguranca), 'no assentamento, a força da guarda é a segurança do senhor');

  // Patrulha de fora quase não entra.
  const regiao = regiaoDe(C, f.localId);
  (c.procura ??= {})[regiao] = { gravidade: 'sangue', pontos: 40, motivo: 'teste', atualizadoDia: c.calendario.dia };
  f.seguranca = 80;
  const dentro = abordagens(c, 200);
  ok(dentro <= 10, `na colônia bem guardada a patrulha de fora quase não entra (${dentro} em 200 dias)`);

  // A guarda da região vem cobrar.
  (c.procura ??= {})[regiao] = { gravidade: 'sangue', pontos: 80, motivo: 'matou gente na taverna', atualizadoDia: c.calendario.dia };
  f.audiencia = undefined; f.ultimaAudiencia = -99; f.ultimaExigenciaGuarda = undefined;
  const a = talvezAudiencia(C, c);
  ok(a?.tipo === 'guarda' && a.opcoes.some((o) => o.id === 'entregar'), 'a guarda da região vem ao portão cobrar o senhor');
  f.tesouro = 1000;
  const pagou = resolverAudiencia(c, 'pagar', C);
  ok(pagou.ok && (procuraDaRegiao(C, c, regiao)?.pontos ?? 0) <= 40, 'pagar faz a guarda ir embora e esfria a procura');

  c.calendario = { ...c.calendario, dia: c.calendario.dia + 20 };
  (c.procura ??= {})[regiao] = { gravidade: 'sangue', pontos: 80, motivo: 'matou gente na taverna', atualizadoDia: c.calendario.dia };
  f.audiencia = undefined; f.ultimaAudiencia = -99;
  ok(talvezAudiencia(C, c)?.tipo === 'guarda', 'eles voltam depois');
  const entregou = resolverAudiencia(c, 'entregar', C);
  ok(entregou.ok && c.prisao && c.personagem.condicoes.includes('preso'), 'entregar-se leva à cela');
  c.prisao = undefined; c.personagem.condicoes = [];

  // Recusar com segurança fraca vira invasão.
  c.calendario = { ...c.calendario, dia: c.calendario.dia + 20 };
  f.audiencia = undefined; f.ultimaAudiencia = -99; f.seguranca = 10; f.tesouro = 200;
  const ordemAntes = f.estabilidade;
  ok(talvezAudiencia(C, c)?.tipo === 'guarda', 'a guarda volta mais uma vez');
  resolverAudiencia(c, 'recusar', C);
  ok(f.tesouro < 200 && f.estabilidade < ordemAntes, 'recusar com a segurança fraca: invadem, levam ouro e derrubam a ordem');

  // Crime de colono vai a julgamento.
  delete c.procura![regiao];
  for (const co of f.colonos ?? []) co.humor = 5;
  f.estabilidade = 20;
  let crime;
  for (let i = 0; i < 120 && crime?.tipo !== 'crime'; i++) {
    c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
    f.audiencia = undefined; f.ultimaAudiencia = -99;
    crime = talvezAudiencia(C, c);
  }
  ok(crime?.tipo === 'crime', `colono fere outro e a colônia pede sentença ("${crime?.texto.slice(0, 50)}…")`);
  const pop = f.populacao;
  ok(resolverAudiencia(c, 'expulsar', C).ok && f.populacao === pop - 1, 'expulsar tira o culpado da colônia');

  // Matar no próprio assentamento: ninguém te prende, mas a ordem cai.
  const d = nova('colonia-sangue', 'campo_ceifa');
  fundarColonia(C, d, '');
  const alguem = calcularContexto(C, d).presentes.find((n) => (d.npcState[n.id]?.idade ?? n.idade) >= 18);
  if (alguem) {
    const ordem = d.feudo!.estabilidade;
    iniciarBriga(C, d, [alguem.id], true);
    const eu = d.combate!.atores.find((x) => x.ehJogador)!; eu.dano = { base: 80, dispersao: 0.1, tipo: 'cortante' };
    vencer(d);
    concluirBriga(C, d);
    ok(!procuraAqui(C, d), 'matar no seu assentamento não te deixa procurado (a guarda é sua)');
    ok(d.feudo!.estabilidade < ordem, 'mas a ordem da colônia cai');
  } else {
    console.log('· (ninguém adulto na colônia para testar o sangue dentro dela)');
  }
}

{
  // Cartaz, recompensa, "vivo ou morto" e o caçador de recompensas.
  const c = nova('cartaz');
  registrarCrime(C, c, 'sangue', 40, 'matou Elza na taverna');
  const cartaz = c.vivo!.fatos.filter((f) => f.tipo === 'cartaz_procurado');
  ok(cartaz.length === 1 && /PROCURADO/.test(cartaz[0].texto) && /Recompensa de 60 moedas/.test(cartaz[0].texto) && !/VIVO OU MORTO/.test(cartaz[0].texto),
    `sangue prega cartaz com recompensa ("${cartaz[0]?.texto.slice(0, 60)}…")`);
  registrarCrime(C, c, 'sangue', 90, 'matou mais dois');
  const vom = c.vivo!.fatos.filter((f) => f.tipo === 'cartaz_procurado');
  ok(vom.length === 2 && /VIVO OU MORTO/.test(vom[1].texto), 'muito sangue troca o cartaz para "vivo ou morto"');
  const pacote = montarPacote(C, c, calcularContexto(C, c), 'x') as { personagem: { procuradoAqui?: { cartaz?: string; vivoOuMorto?: boolean; recompensa?: number } } };
  ok(pacote.personagem.procuradoAqui?.vivoOuMorto && pacote.personagem.procuradoAqui.cartaz && pacote.personagem.procuradoAqui.recompensa, 'o narrador recebe o cartaz, a recompensa e o "vivo ou morto"');

  // No ermo, quem aparece é o caçador.
  c.localAtual = 'floresta';
  let texto: string | undefined;
  for (let i = 0; i < 60 && !texto; i++) {
    c.turno++; c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
    const pr = procuraAqui(C, c); if (pr) pr.pontos = 150;
    texto = checarPerseguicao(C, c);
  }
  ok(texto && c.abordagem?.cacador && /vivo ou morto/.test(texto), `no ermo, um caçador de recompensas aparece ("${texto?.slice(0, 50)}…")`);
  const custo = custoDoSuborno(C, c)!;
  ok(custo > (cartazDe(procuraAqui(C, c)!).recompensa ?? 0), `o caçador quer mais que a recompensa (${custo})`);
  c.personagem.dinheiro = custo;
  const pago = responderAbordagem(C, c, 'subornar');
  ok(pago.ok && !c.abordagem && !c.prisao, 'pagar o caçador compra o silêncio dele');

  // Lutar com o caçador e vencer: ninguém viu, não vira sangue novo.
  c.calendario = { ...c.calendario, dia: c.calendario.dia + 1 };
  c.abordagem = { dia: c.calendario.dia, local: c.localAtual, regiao: regiaoDe(C, c.localAtual), guarda: 'o caçador de recompensas', cacador: true };
  const antes = procuraAqui(C, c)!.pontos;
  const r = responderAbordagem(C, c, 'lutar');
  ok(r.combate && c.combate?.atores.some((a) => a.criaturaId === CACADOR), 'lutar é contra o caçador');
  const eu = c.combate!.atores.find((a) => a.ehJogador)!; eu.dano = { base: 200, dispersao: 0.1, tipo: 'cortante' };
  vencer(c);
  const fim = concluirConfrontoGuarda(C, c)!;
  ok(!fim.preso && procuraAqui(C, c)!.pontos <= antes, 'matar o caçador no mato não soma sangue (ninguém viu)');
}

console.log('\nGuarda no mundo: OK.');
