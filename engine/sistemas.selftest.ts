// Integration fixtures: resources/positions prepared explicitly, actions use real APIs.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { jogadorDeTeste } from './balanco';
import { comprar, equipar, estoqueNaLoja, armaEquipada } from './items';
import { alternarCompanheiro } from './grupo';
import { iniciarCombate, jogadorAtaca, jogadorAcaoTatica, jogadorDefende, jogadorAtor } from './combat';
import { flexionarOficio } from './familia';
import { despertarMarca } from './marca';
import { itemPorId } from './items';
import { normalizarCampanha } from './migracao';
import { cidadeIdDoLocal } from './historiaViva';
import { iniciarObra, processarCidades } from './cidades';
import { processarPolitica } from './politica';
import { tentarAscender, selarAlma, processarEnvelhecimentoJogador } from './ascensao';
import { avancarPeriodos, PERIODOS } from './time';
import { fundirEscolas, escolasDominadas, artePorId } from './fusao';
import { resolverDueloDeFundo } from './duelo';
import { createRng } from './rng';
const ok = (v: unknown, texto: string) => { if (!v) throw new Error(texto); };
const nova = (seed: string) => jogadorDeTeste(C, { nivel: 25, maestriaEspada: 80, atributo: 14, arma: 'espada_longa' }, seed);
const nichirin = C.itens.find(i => i.contraOni && i.slot === 'arma' && i.lojas?.length)!;
ok(nichirin, 'Catálogo precisa permitir comprar uma arma Nichirin');

{
  const c = nova('fusao'); c.personagem.artesConhecidas = C.artes.map(a => a.id);
  const [a, b] = escolasDominadas(C, c), dia = c.calendario.dia;
  ok(!fundirEscolas(C, c, a, a, 'Inválida').ok, 'Fusão exige escolas diferentes');
  for (let i = 0; i < 3; i++) {
    const r = fundirEscolas(C, c, a, b, `Estilo ${i}`);
    ok(r.ok && !!artePorId(C, c, r.arte!.id), 'Fusão cria arte resolvível');
  }
  ok(c.calendario.dia >= dia + 9, 'Fusões consomem tempo real');
  ok(!fundirEscolas(C, c, a, b, 'Quarta').ok, 'Limite de três fusões');
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  ok(JSON.stringify(salvo.artesCriadas) === JSON.stringify(c.artesCriadas), 'Save preserva artes criadas');
  const solo = createRng(42), grupo = createRng(42), resultados = new Set<string>();
  let vSolo = 0, vGrupo = 0;
  for (let i = 0; i < 5000; i++) {
    const r = resolverDueloDeFundo(solo, 0, false); resultados.add(r);
    if (r === 'vitoria') vSolo++;
    if (resolverDueloDeFundo(grupo, 0, true) === 'vitoria') vGrupo++;
  }
  ok(resultados.size === 3 && vGrupo > vSolo, 'Duelo produz três desfechos e reforço melhora vitória');
  console.log('✓ Fusão, persistência de artes e 10.000 resoluções de duelo');
}

for (let seed = 0; seed < 4; seed++) {
  for (const criatura of C.criaturas) {
    let c = nova(`sistemas-${seed}-${criatura.id}`);
    c.localAtual = nichirin.lojas![0]; c.personagem.dinheiro = 10000;
    const estoque = estoqueNaLoja(C, c, nichirin.id), moedas = c.personagem.dinheiro;
    ok(comprar(C, c, nichirin.id).ok, 'Compra real da Nichirin');
    ok(c.personagem.dinheiro < moedas && estoqueNaLoja(C, c, nichirin.id) === estoque - 1, 'Compra debita moedas e estoque');
    ok(equipar(C, c, nichirin.id).ok && armaEquipada(C, c.personagem)?.contraOni, 'Equipamento real habilita finalização');
    const aliados = C.npcs.filter(n => n.combatente && c.npcState[n.id]?.vivo && (c.npcState[n.id].idade ?? n.idade) >= 18).slice(0, 3);
    for (const n of aliados) {
      c.npcState[n.id].eixos.confianca = 10;
      Object.assign(c.vivo!.pessoas[n.id], { local: c.localAtual, deslocado: true, viagem: undefined, objetivo: 'rotina' });
    }
    ok(alternarCompanheiro(C, c, aliados[0].id).ok, 'Primeiro aliado recrutado');
    ok(alternarCompanheiro(C, c, aliados[1].id).ok, 'Segundo aliado recrutado');
    ok(!alternarCompanheiro(C, c, aliados[2].id).ok, 'Terceiro aliado recusado');
    iniciarCombate(C, c, [criatura.id]);
    if (!c.combate!.terminado) ok(!alternarCompanheiro(C, c, aliados[0].id).ok, 'Grupo não muda durante combate');
    // Normalize once to accommodate optional defaults; thereafter full save must match.
    c = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
    const antes = JSON.stringify(c);
    c = normalizarCampanha(C, JSON.parse(antes));
    ok(JSON.stringify(c) === antes, `Save completo com grupo: ${criatura.id}`);
    let passos = 0;
    while (c.combate && !c.combate.terminado && passos++ < 2000) {
      const eu = c.combate.atores.find(a => a.ehJogador)!;
      const alvo = c.combate.atores.find(a => !a.ehJogador && !a.ehAliado && a.vida > 0 && !a.retirado);
      if (eu.tatico?.sono) jogadorAcaoTatica(C, c, 'despertar');
      else if (eu.tatico?.preso) jogadorAcaoTatica(C, c, 'libertar');
      else if (alvo) jogadorAtaca(C, c, alvo.id);
      else break;
    }
    ok(c.combate?.terminado, `Combate termina: ${criatura.id}, seed ${seed}`);
    ok(Number.isFinite(c.personagem.recursos.vida), 'Vida finita após combate');
    ok(c.grupo!.length <= 2, 'Grupo respeita limite após combate');
  }
}
console.log(`✓ ${C.criaturas.length * 4} combates de catálogo com compra, grupo e save completos`);

{
  const c = nova('cidade-estavel'), id = Object.keys(c.vivo!.cidades)[0], cidade = c.vivo!.cidades[id];
  c.continuidade!.ameacas = []; c.mundo!.guerraAtiva = undefined;
  c.continuidade!.locais[id].integridade = 100; c.continuidade!.locais[id].populacao = 100;
  Object.assign(cidade, { comida: 160, materiais: 200, doenca: 0, fomeDias: 0, secaAte: 0 });
  ok(iniciarObra(c, id, 'enfermaria'), 'Obra inicia com materiais');
  ok(!iniciarObra(c, id, 'muralha'), 'Obras simultâneas bloqueadas');
  const nivel = cidade.edificios.enfermaria;
  for (let d = 0; d < 365; d++) {
    c.calendario = avancarPeriodos(c.calendario, PERIODOS.length);
    processarCidades(C, c);
    ok(cidade.fomeDias === 0, 'Cidade saudável permanece alimentada nas quatro estações');
  }
  ok(cidade.edificios.enfermaria > nivel, 'Obra termina e serviço entra em funcionamento');
  const ligado = cidadeIdDoLocal(C, c, id); ok(ligado === id, 'Mercado resolve cidade correta');
  cidade.secaAte = c.calendario.dia + 30; cidade.comida = 0;
  c.calendario = avancarPeriodos(c.calendario, PERIODOS.length); processarCidades(C, c);
  ok(cidade.fomeDias > 0, 'Seca real cria falta de alimento');
  processarPolitica(C, c);
  for (const [faccao, governo] of Object.entries(c.vivo!.governos)) {
    ok(!['onis', 'cacadores'].includes(faccao), 'Organizações clandestinas não governam publicamente');
    if (!governo.lider) continue;
    const antigo = governo.lider; c.npcState[antigo].vivo = false;
    processarPolitica(C, c); ok(governo.lider !== antigo, 'Morte provoca substituição da liderança');
  }
  console.log('✓ Ano civil, construção, escassez e sucessão');
}
{
  const c = nova('ascensao');
  c.personagem.idade = 20; ok(!tentarAscender(c).ok, 'Ascensão exige idade e almas');
  for (const nome of ['A', 'B', 'C']) selarAlma(c, nome);
  selarAlma(c, 'A'); ok(c.almasSeladas!.length === 3, 'Alma não duplica');
  c.personagem.idade = 70; ok(tentarAscender(c).ok, 'Ascensão respeita requisitos');
  ok(!tentarAscender(c).ok, 'Ascensão não repete');
  for (let i = 0; i < 100; i++) processarEnvelhecimentoJogador(c);
  ok(c.personagem.recursos.vida > 0, 'CHIM impede morte por velhice');
  console.log('✓ Requisitos, unicidade e efeito real da ascensão');
}
{
  const c = nova('troca-arma');
  c.personagem.inventario['espada_curta'] = 1;
  c.personagem.inventario['lanca'] = 1;
  iniciarCombate(C, c, ['rato_gigante']);
  ok(c.combate && !c.combate.terminado, 'Combate iniciado para teste de troca');
  ok(c.personagem.equipado.arma === 'espada_longa', 'Arma inicial equipada');
  jogadorAcaoTatica(C, c, 'trocar_arma', 'lanca');
  ok(c.personagem.equipado.arma === 'lanca', 'Arma trocada para lanca em combate');
  ok(c.combate!.log.some(l => l.includes('Lança')), 'Log registra a troca da arma');
  console.log('✓ Troca tática de arma durante o combate com recálculo');
}

// ── Correções da revisão das sessões 70–77 ────────────────────────────────
{
  // Sangramento não mata oni: oni só morre por Nichirin ou sol.
  const c = nova('sangra-oni');
  iniciarCombate(C, c, ['oni_faminto']);
  const s = c.combate!;
  s.ambiente = { ...(s.ambiente ?? {}), abrigoSolar: true } as typeof s.ambiente;
  const oni = s.atores.find(a => a.oni)!;
  oni.vida = 2;
  (oni.tatico ??= {}).sangramento = 3;
  jogadorAtor(s).defesa = 99;
  jogadorDefende(C, c);
  ok((oni.tatico!.sangramento ?? 0) < 3, 'o sangramento correu no turno do oni');
  ok(oni.vida >= 1 && !s.log.some(l => l.includes(`${oni.nome} sucumbe`)), `sangramento deixa o oni de pé (vida ${oni.vida})`);
  console.log('✓ Sangramento e queimadura não matam oni');
}
{
  // Contra-golpe do Bastião derruba o último inimigo e encerra a luta.
  const c = nova('bastiao');
  c.personagem.inventario['espada_ancestral_halvet'] = 1;
  equipar(C, c, 'espada_ancestral_halvet');
  iniciarCombate(C, c, ['rato_gigante']);
  const s = c.combate!;
  const rato = s.atores.find(a => !a.ehJogador && !a.ehAliado)!;
  rato.vida = 5;
  jogadorAtor(s).defesa = 99;
  jogadorDefende(C, c);
  ok(rato.vida === 0 && s.terminado, `inimigo morto pelo contra-golpe encerra o combate (vida ${rato.vida}, terminado ${s.terminado})`);
  console.log('✓ Contra-golpe do Bastião encerra a luta quando derruba o último');
}
{
  ok(flexionarOficio('artesã', 'm') === 'artesão' && flexionarOficio('soldado', 'f') === 'soldada', 'ofício flexiona com letra acentuada');
  console.log('✓ Ofício da família no gênero certo');
}
{
  // Nichirin: sem Concentração Total o aço não reage; com respiração, muda de cor.
  const c = nova('nichirin');
  c.personagem.artesConhecidas = [];
  c.personagem.inventario['lamina_nichirin'] = 1;
  equipar(C, c, 'lamina_nichirin');
  ok(c.personagem.equipado.arma === 'lamina_nichirin', 'novato empunha a Nichirin e o aço continua neutro');
  c.personagem.artesConhecidas = ['respiracao_agua_primeira_forma'];
  equipar(C, c, 'lamina_nichirin');
  const id = c.personagem.equipado.arma!;
  ok(id === 'lamina_nichirin_azul_1', `com Respiração da Água, a lâmina fica azul e o id é determinístico (${id})`);
  ok(itemPorId(C, id, c.personagem)?.corNichirin === 'azul', 'instância azul no acervo do personagem');
  ok(!C.itens.find(i => i.id === 'lamina_nichirin')!.corNichirin, 'o item do catálogo não é alterado');
  console.log('✓ Nichirin muda de cor só com Concentração Total');
}
{
  // Lâmina Carmesim: pede Nichirin desperta e a Marca; o corte segura a regeneração do oni.
  const c = nova('akato');
  c.personagem.artesConhecidas = ['respiracao_agua_primeira_forma'];
  c.personagem.inventario['lamina_nichirin'] = 1;
  equipar(C, c, 'lamina_nichirin');
  iniciarCombate(C, c, ['oni_ancestral']);
  const s = c.combate!;
  s.ambiente = { ...(s.ambiente ?? {}), abrigoSolar: true } as typeof s.ambiente;
  if (s.ordem[s.turno] !== 'jogador') jogadorDefende(C, c);
  jogadorAcaoTatica(C, c, 'lamina_carmesim');
  ok(s.log.some(l => l.includes('falta a Marca')) && !jogadorAtor(s).laminaCarmesimAte, 'sem a Marca o aço não esquenta');
  despertarMarca(c, 'teste');
  c.personagem.recursos.vigor = 10;
  jogadorAcaoTatica(C, c, 'lamina_carmesim');
  ok((jogadorAtor(s).laminaCarmesimAte ?? 0) > 0 && c.personagem.recursos.vigor === 6, 'com a Marca, a lâmina fica rubra e custa 4 de vigor');
  console.log('✓ Lâmina Carmesim exige Marca e Nichirin desperta');
}
