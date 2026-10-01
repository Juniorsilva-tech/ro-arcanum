// ARCANUM · Linhagem, fama do nome, fama da arma, estilo do mestre, técnica
// própria e XP de aprender fazendo (sessão 87).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { jogadorDeTeste } from './balanco';
import { iniciarMundoVivo, registrarFato } from './historiaViva';
import {
  celebrarCasamento,
  darLuzHerdeiro,
  designarHerdeiroAparente,
  deliberarSucessaoCorte,
  escolherSucessorPelaCorte,
  VOCACOES_HERDEIRO,
} from './reino';
import { tracoDoHerdeiro, podeSuceder, assumirLegado, famaDoNome, descontoDoNome, IDADE_PARA_SUCEDER, herdeiroAparente } from './linhagem';
import { registrarAbates, bonusDeFamaDaArma, ABATES_CONHECIDA, ABATES_LENDARIA } from './famaArma';
import { adotarEstilo, mestreRecusa, efeitoDoEstilo } from './estiloMestre';
import { acertoJogador, defesaJogador, danoJogador } from './combat';
import { podeCriarTecnica, criarTecnica, preverTecnica, TETO_POTENCIA } from './criacao';
import { resolverIntencao } from './turn';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string, extra: Partial<Parameters<typeof jogadorDeTeste>[1]> = {}): Campaign => {
  const c = jogadorDeTeste(C, { nivel: 5, maestriaEspada: 50, atributo: 13, arma: 'espada_longa', ...extra }, seed);
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};

// ── Herdeiro e sucessão
{
  const c = nova('sucessao');
  c.personagem.idade = 58;
  const dinheiroPai = (c.personagem.dinheiro = 500);
  c.personagem.inventario.pedra_de_amolar = 2;
  celebrarCasamento(c, 'npc_x', 'Aldra');
  darLuzHerdeiro(c, 'Bram', 'm');
  const filho = c.feudo!.filhosHerdeiros![0];
  ok(tracoDoHerdeiro(c, filho).nome === tracoDoHerdeiro(c, filho).nome, `o filho nasce com traço fixo (${tracoDoHerdeiro(c, filho).nome})`);
  ok(!podeSuceder(c).pode, 'bebê não herda');
  filho.idadeAnos = IDADE_PARA_SUCEDER;
  const alguem = Object.keys(c.npcState)[0];
  c.npcState[alguem].eixos.confianca = 40;
  c.npcState[alguem].memoria = [{ turno: 1, resumo: 'o pai ajudou', peso: 3 }];
  const r = assumirLegado(C, c, 'legado');
  const p = c.personagem;
  ok(r.ok && p.nome === 'Bram' && p.genero === 'm' && p.idade === IDADE_PARA_SUCEDER, `o filho assume: ${r.texto}`);
  ok(p.dinheiro === Math.floor(dinheiroPai * 0.9) && p.inventario.pedra_de_amolar === 2, 'herda o dinheiro (menos um décimo) e a mochila');
  ok(c.npcState[alguem].eixos.confianca === 20 && c.npcState[alguem].memoria.length === 0, 'o mundo lembra da família pela metade; as lembranças eram do pai');
  ok(c.linhagem?.[0].nome !== 'Bram' && p.alcunhas.some((a) => a.startsWith('filho de')), 'o pai entra para a linhagem');
}

// ── Escolha livre do herdeiro (jovem estrategista vs guerreiro, decisão da corte e regência)
{
  const c = nova('escolha-herdeiro');
  c.personagem.idade = 62;
  celebrarCasamento(c, 'npc_esposa', 'Vera');

  // Filho 1: mais velho (20 anos), combatente feroz
  darLuzHerdeiro(c, 'Gareth', 'm', 'combatente');
  const primogenito = c.feudo!.filhosHerdeiros![0];
  primogenito.idadeAnos = 20;

  // Filho 2: mais jovem (16 anos), estrategista brilhante (fraco em combate, raciocínio altíssimo)
  darLuzHerdeiro(c, 'Lucan', 'm', 'estrategista');
  const maisJovem = c.feudo!.filhosHerdeiros![1];
  maisJovem.idadeAnos = 16;

  // Filho 3: jovem menor (14 anos), filha diplomata
  darLuzHerdeiro(c, 'Soraia', 'f', 'diplomata');
  const filhaJovem = c.feudo!.filhosHerdeiros![2];
  filhaJovem.idadeAnos = 14;

  ok(maisJovem.atributos.raciocinio > maisJovem.atributos.fisico, `jovem estrategista tem raciocínio superior (${maisJovem.atributos.raciocinio}) e físico modesto (${maisJovem.atributos.fisico})`);
  ok(primogenito.atributos.fisico > primogenito.atributos.raciocinio, `combatente tem físico superior (${primogenito.atributos.fisico})`);

  // 1. Deliberação da corte de NPCs
  const delib = deliberarSucessaoCorte(c);
  ok(delib && delib.opinioes.length >= 2, 'a corte de NPCs tem opiniões fundamentadas sobre os herdeiros');
  const opMarechal = delib?.opinioes.find((o) => o.cargo === 'Marechal');
  const opChanceler = delib?.opinioes.find((o) => o.cargo === 'Chanceler');
  ok(opMarechal?.candidatoNome === 'Gareth', 'o Marechal defende o herdeiro combatente');
  ok(opChanceler?.candidatoNome === 'Lucan', 'o Chanceler defende o herdeiro estrategista');

  // Em crise financeira/estabilidade, a corte prefere o estrategista
  c.feudo!.tesouro = 50;
  c.feudo!.estabilidade = 30;
  ok(escolherSucessorPelaCorte(c).herdeiro?.nome === 'Lucan', 'corte em crise econômica/política aclama o estrategista');

  // Em perigo militar, a corte prefere o guerreiro
  c.feudo!.seguranca = 20;
  ok(escolherSucessorPelaCorte(c).herdeiro?.nome === 'Gareth', 'corte sob ameaça militar aclama o combatente');

  // 2. O JOGADOR pode escolher quem quiser, ignorando a primogenitura: escolhe o filho mais jovem estrategista
  designarHerdeiroAparente(c, maisJovem.id);
  ok(herdeiroAparente(c)?.id === maisJovem.id, 'decreto do jogador define o herdeiro aparente independentemente da idade');

  const rSucessao = assumirLegado(C, c, 'legado', maisJovem.id);
  ok(rSucessao.ok, 'sucessão pelo herdeiro jovem estrategista bem-sucedida');
  ok(c.personagem.nome === 'Lucan', 'o filho mais jovem assumiu a coroa');
  ok(c.personagem.atributos.raciocinio > c.personagem.atributos.fisico, 'o novo governante reflete os atributos de estrategista (mente brilhante, fraco no corpo a corpo)');
  ok(c.personagem.alcunhas.some((a) => a.includes('Estrategista')), 'alcunha de vocação registrada');

  // 3. Sucessão sob regência para herdeiro jovem com menos de 16 anos
  const cRegencia = nova('regencia');
  celebrarCasamento(cRegencia, 'npc_mae', 'Helena');
  darLuzHerdeiro(cRegencia, 'Alys', 'f', 'diplomata');
  const herdeiraMenor = cRegencia.feudo!.filhosHerdeiros![0];
  herdeiraMenor.idadeAnos = 14;

  const sucReg = podeSuceder(cRegencia, herdeiraMenor.id);
  ok(sucReg.pode && sucReg.sobRegencia, 'herdeira de 14 anos pode suceder sob regência');
  const rReg = assumirLegado(C, cRegencia, 'legado', herdeiraMenor.id);
  ok(rReg.ok && cRegencia.personagem.nome === 'Alys' && cRegencia.personagem.genero === 'f', 'herdeira mulher assume a dinastia com sucesso');
  ok(cRegencia.personagem.alcunhas.includes('soberano jovem (sob regência)'), 'recebe a marca de jovem sob regência');
}

// ── Fama do nome
{
  const c = nova('fama-nome');
  c.localAtual = 'mercado';
  ok(famaDoNome(C, c).nivel === 'desconhecido' && descontoDoNome(C, c) === 1, 'nome desconhecido no começo');
  for (let i = 0; i < 16; i++) registrarFato(c, { tipo: 'feito', local: 'mercado', texto: 'feito', atores: ['jogador'], publico: true });
  ok(famaDoNome(C, c).nivel === 'falado' && descontoDoNome(C, c) === 0.95, `feitos públicos fazem o nome ser falado na região (${famaDoNome(C, c).pontos} pontos) e dão desconto`);
}

// ── Fama da arma
{
  const c = nova('fama-arma');
  const antes = danoJogador(C, c).base;
  registrarAbates(C, c, ABATES_CONHECIDA);
  ok(bonusDeFamaDaArma(c, c.personagem.equipado.arma) === 1.05 && danoJogador(C, c).base > antes, `aos ${ABATES_CONHECIDA} abates a arma é conhecida e pesa mais`);
  registrarAbates(C, c, ABATES_LENDARIA);
  ok(c.famaArmas![c.personagem.equipado.arma!].nivel === 'lendaria', `aos ${ABATES_LENDARIA}, lendária`);
}

// ── Estilo do mestre e recusa
{
  const c = nova('estilo');
  const a0 = acertoJogador(C, c), d0 = defesaJogador(C, c);
  adotarEstilo(c, 'mestre_giyu');
  ok(c.personagem.estiloMarcial === 'defensivo' && defesaJogador(C, c) === d0 + 2 && acertoJogador(C, c) === a0 - 1, 'aprender com Giyu deixa a luta defensiva');
  ok(efeitoDoEstilo('bruto').dano > 1, 'estilo bruto pesa mais');
  const kesta = C.npcs.find((n) => n.ensinaMestre === 'mestre_kesta')!;
  c.npcState[kesta.id].eixos.confianca = -30;
  ok(!!mestreRecusa(C, c, 'mestre_kesta'), 'o mestre recusa quem despreza');
}

// ── Técnica própria
{
  const c = nova('tecnica');
  c.personagem.artesConhecidas = [];
  ok(!podeCriarTecnica(C, c).pode, 'sem técnicas conhecidas, não se inventa');
  c.personagem.artesConhecidas = ['respiracao_agua_primeira_forma', 'respiracao_chama_nona_forma'];
  const prev = preverTecnica(C, c, 'corte', 'pesada');
  ok(prev.tecnica.potencia <= Math.min(TETO_POTENCIA, 24 + 3), `potência com teto (${prev.tecnica.potencia})`);
  const r = criarTecnica(C, c, 'Corte do Vau', 'corte', 'pesada');
  ok(r.ok && c.personagem.artesConhecidas.includes(r.arte!.id) && r.arte!.tecnica?.modo === 'corte', 'a técnica criada entra no combate como técnica de verdade');
}

// ── Aprender fazendo
{
  const c = nova('xp', { nivel: 1 });
  const antes = c.personagem.xp;
  const conversar = C.verbos.find((v) => v.id === 'conversar')!;
  let ganhou = 0;
  for (let i = 0; i < 10; i++) { resolverIntencao(C, c, { tipo: 'verbo', verboId: conversar.id, alvoId: undefined } as never); }
  ganhou = c.personagem.xp - antes + (c.personagem.nivel - 1) * 35;
  ok(ganhou > 0, `conversar dá experiência (${ganhou})`);
}
console.log('\nLinhagem e o resto: OK.');
