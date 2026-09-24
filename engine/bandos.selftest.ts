// ARCANUM · Bandos: o que estes testes seguram (sessão 46).
// - bandos nascem da semente, em regiões diferentes, sem mexer no RNG principal;
// - crescem, pilham e fecham a estrada com pedágio com o tempo;
// - o tamanho do grupo respeita o nível do jogador;
// - o capitão foge ferido, volta marcado, caça o jogador — e perde: cada
//   cicatriz o enfraquece e cada fuga é menos provável;
// - pedágio pago encerra a luta sem sangue; esconderijo tomado devolve o saque;
// - tudo sobrevive ao save; a DLC sem bandos não ganha bandos.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { conteudoTsukimichi as CT } from '../content/tsukimichi';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarCombate, jogadorAtaca } from './combat';
import { executarAcaoMundo } from './acoesMundo';
import { viajar } from './viagem';
import { avancarMundo } from './mundo';
import { exportar, importar } from './persistencia';
import {
  CRIATURA_CAPITAO, estadoBandos, processarBandos, tamanhoDoGrupo, prepararCombateDeBando,
  registrarDesfechoBando, pagarPedagio, encontroNoEsconderijo, capitaoDisponivel, bandosConhecidos,
  descreverBando,
} from './bandos';
import type { Campaign, ContentBundle } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const nova = (seed = 'bandos', content: ContentBundle = C): Campaign => {
  const camp = criarCampanha(content, {
    nome: 'Viajante', atributos: atributosBase(), classeId: content.classes[0].id, origemId: content.origens?.[0]?.id ?? 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });
  if (camp.familia) camp.familia.prologoConcluido = true;
  return camp;
};

const passarDias = (camp: Campaign, dias: number) => {
  for (let i = 0; i < dias; i++) {
    camp.calendario = { ...camp.calendario, dia: camp.calendario.dia + 1 };
    processarBandos(C, camp);
  }
};

/** Abre uma luta contra o bando e devolve o ator do capitão, se houver. */
const lutaDeBando = (camp: Campaign, bandoId: string, comCapitao = true, extra: Partial<{ pedagio: number; esconderijo: boolean }> = {}) => {
  camp.combate = undefined;
  const criaturas = comCapitao ? [CRIATURA_CAPITAO, 'bandido'] : ['bandido'];
  iniciarCombate(C, camp, criaturas);
  prepararCombateDeBando(C, camp, { bandoId, criaturas, ...extra });
  return camp.combate!.atores.find(a => a.capitaoBandoId === bandoId);
};

/** Derruba todos os inimigos e fecha a luta como vitória. */
const vencer = (camp: Campaign) => {
  for (const a of camp.combate!.atores) if (!a.ehJogador && !a.ehAliado) a.vida = 0;
  camp.combate!.terminado = true;
  camp.combate!.resultado = 'vitoria';
  registrarDesfechoBando(camp, 'vitoria');
};

// ── Nascimento ────────────────────────────────────────────────────────────
{
  const camp = nova();
  const cursor = camp.rng.cursor;
  const bandos = Object.values(estadoBandos(C, camp).bandos);
  ok(bandos.length === 3, `três bandos nascem em Vaelhorn (${bandos.map(b => b.nome).join(', ')})`);
  ok(new Set(bandos.map(b => b.regiao)).size === 3, 'cada bando tem sua região');
  ok(!bandos.some(b => b.regiao === 'Vale de Halvet'), 'nenhum bando se instala no vale de partida');
  ok(bandos.every(b => C.locais.some(l => l.id === b.esconderijo && l.regiao === b.regiao)), 'o esconderijo fica na região do bando');
  ok(camp.rng.cursor === cursor, 'criar os bandos não mexe no RNG principal');
  const outra = nova();
  ok(JSON.stringify(estadoBandos(C, outra)) === JSON.stringify(camp.bandos), 'a mesma semente dá os mesmos bandos');
  const tsu = nova('tsu', CT);
  ok(Object.keys(estadoBandos(CT, tsu).bandos).length === 0, 'a DLC sem capitão bandoleiro não ganha bandos');
}

// ── O tempo do bando ──────────────────────────────────────────────────────
{
  const camp = nova();
  const b = Object.values(estadoBandos(C, camp).bandos)[0];
  const antes = { membros: b.membros, tesouro: b.tesouro };
  passarDias(camp, 40);
  ok(b.membros > antes.membros, `o bando recruta com o tempo (${antes.membros} → ${b.membros})`);
  ok(b.tesouro > antes.tesouro, `e pilha (${antes.tesouro} → ${b.tesouro} moedas)`);
  ok(b.pedagio, 'com gente bastante, fecha a estrada com pedágio');
  ok(camp.vivo!.fatos.some(f => f.tipo === 'pedagio_bandido'), 'o pedágio vira fato público — o vale fica sabendo');
  ok(bandosConhecidos(camp).includes(b), 'bando com pedágio conhecido aparece para o jogador');
}

// ── Tamanho do grupo ──────────────────────────────────────────────────────
ok(tamanhoDoGrupo(12, 1) === 1, 'nível 1 enfrenta um salteador por vez, mesmo contra bando cheio');
ok(tamanhoDoGrupo(12, 9) === 4, 'nível 9 enfrenta o bando cheio (4)');
ok(tamanhoDoGrupo(3, 12) === 1, 'bando pequeno manda pouca gente, por mais forte que seja o jogador');

// ── Capitão: Nemesis que perde ────────────────────────────────────────────
{
  const camp = nova('capitao');
  const b = Object.values(estadoBandos(C, camp).bandos)[0];
  b.membros = 9;
  const fresco = lutaDeBando(camp, b.id)!;
  ok(fresco.nome === b.capitao.nome, `o capitão luta com o próprio nome (${fresco.nome})`);
  const vidaFresca = fresco.vidaMax;

  // Achar uma semente de rng em que ele foge na primeira queda (75%).
  let fugiu = false;
  for (let t = 0; t < 10 && !fugiu; t++) {
    const c = nova(`capitao_${t}`);
    const bb = Object.values(estadoBandos(C, c).bandos)[0];
    bb.membros = 9;
    lutaDeBando(c, bb.id);
    vencer(c);
    if (bb.capitao.vivo) {
      fugiu = true;
      ok(bb.capitao.cicatrizes.length === 1 && !!bb.capitao.alcunha, `fugiu com cicatriz e alcunha: ${bb.capitao.alcunha}`);
      ok(bb.capitao.recuperarAte! > c.calendario.dia, 'e some para se recuperar');
      ok(!capitaoDisponivel(c, bb), 'ferido, não aparece na estrada');
      ok(bb.esconderijoConhecido, 'derrubar o capitão revela o esconderijo');
      c.calendario = { ...c.calendario, dia: bb.capitao.recuperarAte! - 1 };
      passarDias(c, 1);
      ok(bb.capitao.caca, 'recuperado e com rancor, ele passa a caçar o jogador');
      ok(c.vivo!.fatos.some(f => f.tipo === 'capitao_retorna'), 'o retorno dele vira fato público');
    }
  }
  ok(fugiu, 'em dez tentativas o capitão fugiu ferido ao menos uma vez');

  // Com três cicatrizes ele é mais fraco que no começo, mesmo dois níveis acima.
  b.capitao.cicatrizes = ['a', 'b', 'c'];
  b.capitao.nivel += 2;
  const marcado = lutaDeBando(camp, b.id)!;
  ok(marcado.vidaMax < vidaFresca, `três cicatrizes pesam mais que dois níveis (${marcado.vidaMax} contra ${vidaFresca} de vida)`);

  // Cada fuga é menos provável: ao longo de quedas repetidas, todo capitão cai.
  let mortos = 0;
  for (let t = 0; t < 20; t++) {
    const c = nova(`queda_${t}`);
    const bb = Object.values(estadoBandos(C, c).bandos)[0];
    bb.membros = 12;
    for (let q = 0; q < 8 && bb.capitao.vivo; q++) {
      lutaDeBando(c, bb.id);
      vencer(c);
    }
    if (!bb.capitao.vivo) mortos++;
  }
  ok(mortos === 20, `em oito quedas, todos os 20 capitães morrem (${mortos}/20)`);
}

// ── Captura ───────────────────────────────────────────────────────────────
{
  const camp = nova('captura');
  const b = Object.values(estadoBandos(C, camp).bandos)[0];
  b.membros = 1;
  const cap = lutaDeBando(camp, b.id)!;
  cap.capturado = true;
  camp.combate!.resultado = 'vitoria';
  registrarDesfechoBando(camp, 'vitoria');
  ok(b.capitao.preso && b.capitao.vivo, 'capitão rendido fica preso, vivo');
  ok(b.estado !== 'ativo' && !b.pedagio, 'bando sem capitão deixa de agir e de cobrar pedágio');
}

// ── Derrota do jogador ────────────────────────────────────────────────────
{
  const camp = nova('derrota');
  const b = Object.values(estadoBandos(C, camp).bandos)[0];
  const nivel = b.capitao.nivel, membros = b.membros;
  lutaDeBando(camp, b.id);
  registrarDesfechoBando(camp, 'derrota');
  ok(b.capitao.vitorias === 1 && b.capitao.nivel === nivel + 1 && b.membros > membros, 'vencer o jogador dá fama, nível e gente ao capitão');
}

// ── Pedágio ───────────────────────────────────────────────────────────────
{
  const camp = nova('pedagio');
  const b = Object.values(estadoBandos(C, camp).bandos)[0];
  camp.personagem.dinheiro = 5;
  lutaDeBando(camp, b.id, false, { pedagio: 30 });
  const semDinheiro = pagarPedagio(camp);
  ok(!semDinheiro.ok && !camp.combate!.terminado, 'sem as moedas, o pedágio não resolve');
  camp.personagem.dinheiro = 100;
  const tesouro = b.tesouro;
  const pago = pagarPedagio(camp);
  ok(pago.ok && camp.personagem.dinheiro === 70 && b.tesouro === tesouro + 30, 'pedágio pago sai da bolsa e entra no tesouro do bando');
  ok(camp.combate!.terminado && camp.combate!.resultado === 'fuga', 'e encerra a luta sem sangue');
}

// ── Esconderijo ───────────────────────────────────────────────────────────
{
  const camp = nova('esconderijo');
  const b = Object.values(estadoBandos(C, camp).bandos)[0];
  camp.localAtual = b.esconderijo;
  const escondido = encontroNoEsconderijo(C, camp);
  ok('erro' in escondido, 'sem saber o caminho, não há esconderijo para atacar');
  b.esconderijoConhecido = true;
  b.tesouro = 140;
  const dinheiro = camp.personagem.dinheiro;
  const r = executarAcaoMundo(C, camp, { tipo: 'atacar_esconderijo' });
  ok(r.ok && camp.combate?.bando?.esconderijo, `atacar o esconderijo abre a luta (${r.texto})`);
  vencer(camp);
  ok(camp.personagem.dinheiro === dinheiro + 140 && b.tesouro === 0, 'tomar o esconderijo devolve o que o bando pilhou');
  ok(b.estado !== 'ativo', 'o bando perde a base');
}

// ── Na estrada, pela viagem de verdade ────────────────────────────────────
{
  const camp = nova('estrada');
  const b = Object.values(estadoBandos(C, camp).bandos)[0];
  b.membros = 12;
  const esconderijo = C.locais.find(l => l.id === b.esconderijo)!;
  const vizinho = esconderijo.rotas[0].destino;
  let deBando = 0, maior = 0;
  for (let i = 0; i < 120; i++) {
    camp.combate = undefined;
    camp.personagem.recursos.vida = camp.personagem.recursosMax.vida;
    camp.localAtual = i % 2 ? vizinho : esconderijo.id;
    const destino = i % 2 ? esconderijo.id : vizinho;
    const r = viajar(C, camp, destino);
    const luta = camp.combate as Campaign['combate'];
    if (r.encontro && luta?.bando) {
      deBando++;
      maior = Math.max(maior, luta.atores.filter(a => !a.ehJogador && !a.ehAliado).length);
    }
  }
  ok(deBando > 0, `viajar no território cruza o bando de verdade (${deBando} vezes em 120 viagens)`);
  ok(maior <= 1, `nível 1 nunca enfrenta mais de um salteador do bando (${maior})`);
}

// ── Integração com o combate de verdade ───────────────────────────────────
{
  const camp = nova('luta_real');
  const b = Object.values(estadoBandos(C, camp).bandos)[0];
  const membros = b.membros;
  camp.combate = undefined;
  iniciarCombate(C, camp, ['salteador']);
  prepararCombateDeBando(C, camp, { bandoId: b.id, criaturas: ['salteador'] });
  const alvo = camp.combate!.atores.find(a => !a.ehJogador)!;
  alvo.vida = 1; alvo.defesa = 1;
  camp.personagem.recursos.vida = camp.personagem.recursosMax.vida;
  for (let i = 0; i < 30 && !camp.combate!.terminado; i++) jogadorAtaca(C, camp, alvo.id);
  ok(camp.combate!.resultado === 'vitoria', 'a luta de verdade termina em vitória');
  ok(b.membros < membros && b.pistas === 1, 'e o gancho em encerrar() tira gente do bando e deixa pista');
}

// ── Save ──────────────────────────────────────────────────────────────────
{
  const camp = nova('save');
  const b = Object.values(estadoBandos(C, camp).bandos)[0];
  b.capitao.cicatrizes.push('um talho que atravessa o rosto');
  b.capitao.alcunha = 'o Rosto Aberto';
  avancarMundo(C, camp);
  const volta = importar(exportar(camp));
  ok(volta.ok && JSON.stringify(volta.valor.bandos) === JSON.stringify(camp.bandos), 'os bandos sobrevivem ao save, com cicatriz e alcunha');
  ok(descreverBando(C, b).includes('o Rosto Aberto'), `a descrição para a tela e o narrador traz a alcunha: ${descreverBando(C, b)}`);
}

console.log('\nbandos: tudo certo.');
