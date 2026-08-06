// ARCANUM · Autoteste rápido da engine. Uso: npm run test:engine
import { createRng } from './rng';
import { probabilidade, resolverTeste } from './resolution';
import { conteudoVaelhorn } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { resolverIntencao } from './turn';
import { montarCena } from './narration';
import { atributosBase, derivados } from './character';
import {
  comprar,
  equipar,
  usarConsumivel,
  vender,
  bonusDefesaEquip,
  armaEquipada,
} from './items';
import { iniciarCombate, jogadorAtaca, fecharCombate } from './combat';
import { mestresQueEnsinamAqui, aprenderArte, conjurarLivre } from './magic';
import { verificarQuests } from './quests';

let falhas = 0;
function ok(cond: boolean, msg: string) {
  if (!cond) {
    console.error('✗', msg);
    falhas++;
  } else {
    console.log('✓', msg);
  }
}

// Determinismo: mesma semente e mesmo cursor => mesma sequência.
{
  const a = createRng(12345);
  const b = createRng(12345);
  const ra = resolverTeste(a, { atributo: 14, dificuldade: 14 });
  const rb = resolverTeste(b, { atributo: 14, dificuldade: 14 });
  ok(ra.r === rb.r && ra.grau === rb.grau, 'RNG é determinístico com a mesma semente');
}

// Probabilidade: C=D => 50%.
ok(Math.abs(probabilidade(14, 14) - 0.5) < 1e-9, 'p(C=D) = 50%');
ok(probabilidade(22, 14) > 0.85, 'C bem acima de D => alta chance');
ok(probabilidade(6, 14) < 0.15, 'C bem abaixo de D => baixa chance');

// Criação de campanha.
const camp = criarCampanha(conteudoVaelhorn, {
  nome: 'Teste',
  atributos: atributosBase(),
  classeId: 'arcanista',
  origemId: 'divida',
  seedString: 'teste-1',
});
ok(camp.personagem.recursos.vida > 0, 'Personagem nasce com vida');
ok(camp.personagem.recursos.mana > 0, 'Arcanista nasce com mana');
ok(camp.localAtual === 'taverna', 'Começa na taverna');
ok(Object.keys(camp.npcState).length === conteudoVaelhorn.npcs.length, 'Estado de todos os NPCs inicializado');

// Montar cena não quebra.
const cena = montarCena(conteudoVaelhorn, camp);
ok(cena.narracao.length > 0, 'Cena inicial produz narração');
ok(cena.opcoes.length > 0, 'Cena inicial produz opções');

// Resolver um verbo simples avança o tempo.
const diaAntes = camp.calendario.dia;
const idxAntes = camp.calendario.periodoIndex;
const r = resolverIntencao(conteudoVaelhorn, camp, { tipo: 'verbo', verboId: 'esperar' });
ok(camp.calendario.dia > diaAntes || camp.calendario.periodoIndex !== idxAntes, 'Esperar avança o tempo');
ok(r.fato.length > 0, 'Resolução produz um fato');

// Trava de build: nenhum conteúdo pode conter notação de dado (GDD §2.4).
{
  const json = JSON.stringify(conteudoVaelhorn);
  const temDado = /\bd\d+\b|\b\d+d\d+\b|CD\s?\d+/.test(json);
  ok(!temDado, 'Nenhuma notação de dado no conteúdo (trava §2.4)');
}

// Aviso: todos os NPCs são adultos (GDD §25).
{
  const menores = conteudoVaelhorn.npcs.filter((n) => n.idade < 18);
  ok(menores.length === 0, 'Todos os personagens são adultos (§25)');
}

// Sistema de itens (GDD §13.6, §34).
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Mercador',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'foragido',
    seedString: 'itens-1',
  });
  ok(!!armaEquipada(conteudoVaelhorn, c.personagem), 'Guardião nasce com arma equipada');
  ok(bonusDefesaEquip(conteudoVaelhorn, c.personagem) > 0, 'Armadura+escudo dão bônus de defesa');

  // Compra encolhe a bolsa e enche a mochila.
  const antesDinheiro = c.personagem.dinheiro;
  const compra = comprar(conteudoVaelhorn, c, 'pocao_cura_menor');
  ok(compra.ok && c.personagem.dinheiro < antesDinheiro, 'Comprar debita moedas');
  ok((c.personagem.inventario['pocao_cura_menor'] ?? 0) >= 1, 'Comprar adiciona o item');

  // Usar poção cura e consome.
  c.personagem.recursos.vida = 5;
  usarConsumivel(conteudoVaelhorn, c, 'pocao_cura_menor');
  ok(c.personagem.recursos.vida > 5, 'Usar poção recupera vida');

  // Equipar troca a defesa derivada.
  c.personagem.dinheiro = 500; // bolsa cheia para o teste de compra cara
  comprar(conteudoVaelhorn, c, 'cota_de_malha');
  const defAntes = derivados(c.personagem, bonusDefesaEquip(conteudoVaelhorn, c.personagem)).defesa;
  equipar(conteudoVaelhorn, c, 'cota_de_malha');
  const defDepois = derivados(c.personagem, bonusDefesaEquip(conteudoVaelhorn, c.personagem)).defesa;
  ok(defDepois > defAntes, 'Equipar armadura melhor aumenta a defesa');

  // Vender devolve moeda.
  const d2 = c.personagem.dinheiro;
  vender(conteudoVaelhorn, c, 'cota_de_malha');
  ok(c.personagem.dinheiro > d2, 'Vender devolve moedas');

  // Item concede verbo (gazua → arrombar existe no catálogo).
  const gazua = conteudoVaelhorn.itens.find((i) => i.id === 'gazua');
  ok(gazua?.concedeVerbo === 'arrombar', 'Gazua concede o verbo arrombar (§13.6)');
}

// Combate (GDD §16, §17).
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Bruto',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'sem_nome',
    seedString: 'combate-1',
  });
  const s = iniciarCombate(conteudoVaelhorn, c, ['rato_gigante']);
  ok(s.atores.length === 2, 'Combate inicia com jogador e inimigo');
  ok(s.ordem.length === 2, 'Ordem de iniciativa montada');

  // Luta até acabar (guarda contra laço infinito).
  let guarda = 0;
  while (!c.combate!.terminado && guarda < 200) {
    guarda++;
    const alvo = c.combate!.atores.find((a) => !a.ehJogador && a.vida > 0);
    if (!alvo) break;
    jogadorAtaca(conteudoVaelhorn, c, alvo.id);
  }
  ok(c.combate!.terminado, 'Combate termina');
  ok(!!c.combate!.resultado, `Combate tem resultado (${c.combate!.resultado})`);
  ok(c.combate!.log.length > 1, 'Combate produz log narrável');

  // Chefe tem fase 2 declarada.
  const vess = conteudoVaelhorn.criaturas.find((x) => x.id === 'vess_fiador');
  ok(!!vess?.chefe && !!vess.fase2, 'Chefe Vess tem fase 2 (§17)');

  fecharCombate(c);
  ok(c.combate === null, 'Combate pode ser fechado');
}

// Magia: aprender e conjurar (GDD §13.1, §13.3).
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Aprendiz',
    atributos: atributosBase(),
    classeId: 'arcanista',
    origemId: 'divida',
    seedString: 'magia-1',
  });
  // Sarn ensina na taverna, onde a campanha começa.
  const disp = mestresQueEnsinamAqui(conteudoVaelhorn, c);
  ok(disp.length > 0, 'Há mestre ensinando no local inicial');
  const arte = disp[0].artes[0];
  const ap = aprenderArte(conteudoVaelhorn, c, arte.id);
  ok(ap.ok && c.personagem.artesConhecidas.includes(arte.id), `Aprendeu ${arte.nome}`);

  const manaAntes = c.personagem.recursos.mana;
  const conj = conjurarLivre(conteudoVaelhorn, c, arte.id);
  ok(conj.ok, 'Conjurar fora de combate funciona');
  ok(c.personagem.recursos.mana < manaAntes, 'Conjurar consome recurso');
}

// Missões (GDD quests).
{
  const c = criarCampanha(conteudoVaelhorn, {
    nome: 'Andarilha',
    atributos: atributosBase(),
    classeId: 'batedor',
    origemId: 'foragido',
    seedString: 'quest-1',
  });
  ok(Object.keys(c.questEstado).length === conteudoVaelhorn.quests.length, 'Estado de todas as missões inicializado');
  // Cumpre o objetivo do edital via flag e confere a recompensa.
  const dinAntes = c.personagem.dinheiro;
  c.flags['investigado.taverna.0'] = true;
  const concl = verificarQuests(conteudoVaelhorn, c);
  ok(concl.includes('O edital novo'), 'Missão conclui quando o objetivo é cumprido');
  ok(c.personagem.dinheiro > dinAntes, 'Missão paga a recompensa');
}

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM.\n' : `\n${falhas} FALHA(S).\n`);
process.exit(falhas === 0 ? 0 : 1);
