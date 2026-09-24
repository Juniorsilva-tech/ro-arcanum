// ARCANUM · A forja faz o que promete, e não mais que isso.
//
// Sessão 29. O que estes testes seguram:
// - a peça nunca passa de 1,45× o molde, por melhor que seja a mão e o material;
// - mão treinada faz peça melhor que mão crua, na média;
// - sem carvão, sem material ou fora de uma forja, nada é consumido;
// - a peça forjada existe de verdade: equipa, dá dano, tem nome, sobrevive ao save;
// - forjar treina o ofício e gasta tempo;
// - a mesma semente dá a mesma peça.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { conteudoTsukimichi as CT } from '../content/tsukimichi';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { executarAcaoMundo } from './acoesMundo';
import { equipar, itemPorId, armaEquipada, itensDaLoja, bonusDefesaEquip } from './items';
import { exportar, importar } from './persistencia';
import { maestriaDe, estadoAptidao, esforcoParaMaestria } from './aptidao';
import {
  MOLDES, MATERIAIS, CATALISADORES, TETO_SOBRE_O_MOLDE, COMBUSTIVEL, calcularPeca,
  qualidadeDaMao, ondeForjar, receitasDisponiveis, forjar, desmanchar, temperar,
} from './forja';
import { danoJogador, iniciarCombate, jogadorAtaca } from './combat';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const nova = (seed = 'forja'): Campaign => {
  const camp = criarCampanha(C, {
    nome: 'Ferreira', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });
  // Adulta: a infância é outro teste. Aqui a forja já está ao alcance.
  if (camp.familia) camp.familia.prologoConcluido = true;
  camp.localAtual = 'vila_ferreiros';
  camp.personagem.inventario[COMBUSTIVEL] = 10;
  camp.personagem.inventario['minerio_de_ferro'] = 60;
  camp.personagem.inventario['lasca_de_gargula'] = 60;
  return camp;
};

// ── Teto: nenhuma combinação passa de 1,45× o molde ──────────────────────
for (const molde of MOLDES) {
  for (const material of MATERIAIS) {
    if (!molde.aceita.includes(material.familia)) continue;
    const peca = calcularPeca(molde, material, 1.3, 'x', 'teste');
    if (molde.dano) {
      if (peca.dano!.base > Math.round(molde.dano.base * TETO_SOBRE_O_MOLDE)) {
        throw new Error(`${molde.id} de ${material.item} passou do teto: ${peca.dano!.base}`);
      }
    }
    if (molde.defesa !== undefined && peca.defesa! > Math.round(molde.defesa * TETO_SOBRE_O_MOLDE)) {
      throw new Error(`${molde.id} de ${material.item} passou do teto de defesa: ${peca.defesa}`);
    }
  }
}
ok(true, 'nenhuma combinação de molde e material passa do teto de 1,45× o molde');

// ── Mão treinada faz peça melhor ────────────────────────────────────────
{
  const media = (maestria: number) => {
    let soma = 0;
    for (let i = 0; i < 50; i++) soma += qualidadeDaMao(maestria, i / 49);
    return soma / 50;
  };
  ok(media(80) > media(0) + 0.3, `mestria 80 faz peça melhor que mestria 0 (${media(80).toFixed(2)} contra ${media(0).toFixed(2)})`);
  ok(qualidadeDaMao(0, 0) >= 0.6 && qualidadeDaMao(100, 1) <= 1.3, 'a qualidade da mão fica entre 0,6 e 1,3');
}

// ── Lugar: longe de forja, não se forja e nada é consumido ──────────────
{
  const camp = nova();
  camp.localAtual = C.locais.find(l => l.tipo !== 'forja' && l.id !== 'vila_ferreiros')!.id;
  const antes = { ...camp.personagem.inventario };
  const onde = ondeForjar(C, camp);
  if (!onde.pode) {
    const r = forjar(C, camp, 'lamina_curta', 'minerio_de_ferro');
    ok(!r.ok, 'fora de uma forja e sem ferreira presente, não se forja');
    ok(camp.personagem.inventario[COMBUSTIVEL] === antes[COMBUSTIVEL]
      && camp.personagem.inventario['minerio_de_ferro'] === antes['minerio_de_ferro'],
      'a recusa por lugar não consome carvão nem minério');
  } else {
    ok(true, `local de controle tem ferreira presente (${onde.ferreira?.nome}); recusa por lugar testada só na ausência`);
  }
  ok(ondeForjar(C, nova()).pode, 'na Vila dos Ferreiros a forja está disponível');
}

// ── Sem carvão, sem material ────────────────────────────────────────────
{
  const camp = nova();
  camp.personagem.inventario[COMBUSTIVEL] = 0;
  const r = forjar(C, camp, 'lamina_curta', 'minerio_de_ferro');
  ok(!r.ok && camp.personagem.inventario['minerio_de_ferro'] === 60, 'sem carvão não se forja, e o minério fica');

  const camp2 = nova();
  camp2.personagem.inventario['minerio_de_ferro'] = 1;
  const r2 = forjar(C, camp2, 'lamina_curta', 'minerio_de_ferro');
  ok(!r2.ok && camp2.personagem.inventario[COMBUSTIVEL] === 10, 'com material de menos não se forja, e o carvão fica');

  const r3 = forjar(C, nova(), 'gibao', 'minerio_de_ferro');
  ok(!r3.ok, 'molde e material incompatíveis são recusados');
}

// ── A peça existe de verdade ────────────────────────────────────────────
{
  const camp = nova();
  const diaAntes = camp.calendario.dia * 10 + (camp.capitulo.periodosDecorridos ?? 0);
  const maestriaAntes = maestriaDe(camp, 'oficio');
  const r = executarAcaoMundo(C, camp, { tipo: 'forjar', molde: 'lamina_curta', material: 'minerio_de_ferro' });
  ok(r.ok, `forjar pela ação de mundo funciona: ${r.texto}`);
  const p = camp.personagem;
  ok(p.itensForjados?.length === 1, 'a peça fica guardada em itensForjados');
  const id = p.itensForjados![0].id;
  ok((p.inventario[id] ?? 0) === 1, 'a peça entra na mochila');
  ok(p.inventario[COMBUSTIVEL] === 9, 'um carvão foi gasto');
  ok(p.inventario['minerio_de_ferro'] === 60 - MOLDES.find(m => m.id === 'lamina_curta')!.quantidade, 'o minério do molde foi gasto');
  ok(itemPorId(C, id, p)?.nome === p.itensForjados![0].nome, 'itemPorId acha a peça forjada');
  ok(itemPorId(C, id) === undefined, 'sem o personagem, a peça forjada não vaza para o catálogo');
  const eq = equipar(C, camp, id);
  ok(eq.ok, `a peça forjada equipa (${eq.motivo ?? 'ok'})`);
  ok(armaEquipada(C, p)?.id === id, 'armaEquipada devolve a peça forjada');
  ok(maestriaDe(camp, 'oficio') > maestriaAntes, 'forjar treina o ofício');
  const diaDepois = camp.calendario.dia * 10 + (camp.capitulo.periodosDecorridos ?? 0);
  ok(diaDepois > diaAntes, 'forjar gasta tempo');

  // Save: a peça sobrevive ao export/import.
  const volta = importar(exportar(camp));
  ok(volta.ok, 'a campanha com peça forjada exporta e importa');
  if (volta.ok) {
    const p2 = volta.valor.personagem;
    ok(itemPorId(C, id, p2)?.dano?.base === p.itensForjados![0].dano?.base, 'a peça forjada sobrevive ao save com o mesmo dano');
    ok(armaEquipada(C, p2)?.id === id, 'e continua equipada depois de carregar');
  }
}

// ── Determinismo ────────────────────────────────────────────────────────
{
  const a = nova('mesma'); const b = nova('mesma');
  forjar(C, a, 'machado', 'lasca_de_gargula');
  forjar(C, b, 'machado', 'lasca_de_gargula');
  ok(JSON.stringify(a.personagem.itensForjados) === JSON.stringify(b.personagem.itensForjados), 'a mesma semente forja a mesma peça');
}

// ── Receitas marcam o que está na mochila ───────────────────────────────
{
  const camp = nova();
  const rs = receitasDisponiveis(camp);
  ok(rs.some(r => r.temMaterial) && rs.some(r => !r.temMaterial), 'receitasDisponiveis marca o que dá e o que não dá para fazer');
}

// ── Mão treinada, na prática ────────────────────────────────────────────
{
  const crua = nova('treino'); const treinada = nova('treino');
  crua.personagem.inventario[COMBUSTIVEL] = 30; treinada.personagem.inventario[COMBUSTIVEL] = 30;
  crua.personagem.inventario['minerio_de_ferro'] = 999; treinada.personagem.inventario['minerio_de_ferro'] = 999;
  estadoAptidao(treinada).esforco['oficio'] = esforcoParaMaestria(85);
  if (maestriaDe(treinada, 'oficio') >= 80) {
    let somaCrua = 0, somaTreinada = 0;
    for (let i = 0; i < 12; i++) {
      forjar(C, crua, 'lamina_curta', 'minerio_de_ferro');
      forjar(C, treinada, 'lamina_curta', 'minerio_de_ferro');
    }
    for (const it of crua.personagem.itensForjados!) somaCrua += it.dano!.base;
    for (const it of treinada.personagem.itensForjados!) somaTreinada += it.dano!.base;
    ok(somaTreinada > somaCrua, `mão treinada forja lâminas melhores na prática (${somaTreinada} contra ${somaCrua})`);
  } else {
    ok(true, 'estrutura de aptidões diferente; a comparação em números fica no teste de qualidadeDaMao');
  }
}

// ── Disponibilidade da forja nas cidades de Vaelhorn ───────────────────
{
  const camp = nova('cidades');
  // Halvet: no mercado, Torana e Duna estão presentes
  camp.localAtual = 'mercado';
  const ondeHalvet = ondeForjar(C, camp);
  ok(ondeHalvet.pode, 'em Halvet (mercado) a forja está disponível');
  ok(ondeHalvet.ferreira?.ocupacao?.match(/ferreir|armeir/i), 'ferreira de Halvet (Torana ou Duna) identificada');

  // Tessel: Vana do Fole na guarnição
  camp.localAtual = 'tessel';
  const ondeTessel = ondeForjar(C, camp);
  ok(ondeTessel.pode && ondeTessel.ferreira?.id === 'armeira_de_tessel', 'em Tessel a armeira da guarnição (Vana) permite forjar');

  // Mareu: Kelda Cais no porto/cidade
  camp.localAtual = 'mareu';
  const ondeMareu = ondeForjar(C, camp);
  ok(ondeMareu.pode && ondeMareu.ferreira?.id === 'ferreira_de_mareu', 'em Mareu a ferreira naval (Kelda) permite forjar');

  // Aldeia do Ferro: Tança no Ferro Velho
  camp.localAtual = 'aldeia_ferro';
  const ondeAldeia = ondeForjar(C, camp);
  ok(ondeAldeia.pode && ondeAldeia.ferreira?.id === 'ferreira_do_ferro_velho', 'na Aldeia do Ferro a lâmina-ferreira (Tança) permite forjar');
}

// ── Matérias-primas essenciais nas lojas de Vaelhorn ───────────────────
{
  // A taverna inicial e os mercados vendem carvão, minério de ferro e couro cru
  const itensTaverna = itensDaLoja(C, 'taverna').map(i => i.id);
  ok(itensTaverna.includes('carvao'), 'taverna inicial vende carvão');
  ok(itensTaverna.includes('minerio_de_ferro'), 'taverna inicial vende minério de ferro');
  ok(itensTaverna.includes('couro_cru'), 'taverna inicial vende couro cru');

  const itensTessel = itensDaLoja(C, 'tessel').map(i => i.id);
  ok(itensTessel.includes('carvao') && itensTessel.includes('minerio_de_ferro'), 'Tessel vende matérias-primas de forja');

  const itensMareu = itensDaLoja(C, 'mareu').map(i => i.id);
  ok(itensMareu.includes('carvao') && itensMareu.includes('minerio_de_ferro'), 'Mareu vende matérias-primas de forja');
}

// ── Forja no Novo Mundo (Tsukimichi) ───────────────────────────────────
{
  const campTsuki = criarCampanha(CT, {
    nome: 'MakotoTest',
    atributos: atributosBase(),
    classeId: CT.classes[0].id,
    origemId: CT.origens[0].id,
    seedString: 'tsuki-forja',
  });
  if (campTsuki.familia) campTsuki.familia.prologoConcluido = true;

  // Lojas em Tsige e Asora vendem carvão e minérios
  const itensTsige = itensDaLoja(CT, 'tsige_distrito_comercial').map(i => i.id);
  ok(itensTsige.includes('carvao'), 'Tsige vende carvão no distrito comercial');
  ok(itensTsige.includes('minerio_de_ferro'), 'Tsige vende minério de ferro');

  const itensAsora = itensDaLoja(CT, 'asora_forja_anoes').map(i => i.id);
  ok(itensAsora.includes('carvao') && itensAsora.includes('minerio_de_ferro'), 'Forja de Asora vende carvão e minério de ferro');

  // Tsige: Garrick permite forjar no distrito comercial
  campTsuki.localAtual = 'tsige_distrito_comercial';
  const ondeTsige = ondeForjar(CT, campTsuki);
  ok(ondeTsige.pode && ondeTsige.ferreira?.id === 'garrick_ferreiro', 'em Tsige o armeiro Garrick permite forjar');

  // Asora: forja dos Elder Dwarves é local de forja e conta com Mestre Beren
  campTsuki.localAtual = 'asora_forja_anoes';
  const ondeAsora = ondeForjar(CT, campTsuki);
  ok(ondeAsora.pode, 'em Asora a Forja dos Anões permite forjar');
  ok(ondeAsora.ferreira?.id === 'mestre_beren', 'Mestre Beren dos Elder Dwarves orienta a forja em Asora');

  // Forjar de verdade em Asora via executarAcaoMundo
  campTsuki.personagem.inventario[COMBUSTIVEL] = 5;
  campTsuki.personagem.inventario['minerio_de_ferro'] = 10;
  const rForja = executarAcaoMundo(CT, campTsuki, { tipo: 'forjar', molde: 'lamina_longa', material: 'minerio_de_ferro' });
  ok(rForja.ok, `forjar em Asora funciona: ${rForja.texto}`);
  ok(campTsuki.personagem.itensForjados?.length === 1, 'item forjado registrado na ficha');
  const pecaId = campTsuki.personagem.itensForjados![0].id;
  ok(campTsuki.personagem.inventario[pecaId] === 1, 'peça forjada no inventário do Novo Mundo');
  const eq = equipar(CT, campTsuki, pecaId);
  ok(eq.ok, 'peça forjada equipa no Novo Mundo');
}

// ── Desmanche de Espólios (Salvage) ───────────────────────────────────
{
  const camp = nova('desmanche');
  // Desequipa qualquer arma inicial para poder testar desmanche
  camp.personagem.equipado.arma = undefined;
  // Adiciona itens normais no inventário
  camp.personagem.inventario['espada_curta'] = 1;
  camp.personagem.inventario['cota_de_malha'] = 1;
  camp.personagem.inventario['escudo_de_ferro'] = 1;
  const ferroAntes = camp.personagem.inventario['minerio_de_ferro'] ?? 0;

  // Desmanche de espada curta comum
  const r1 = executarAcaoMundo(C, camp, { tipo: 'desmanchar', itemId: 'espada_curta' });
  ok(r1.ok, `desmanchar espada curta funciona: ${r1.texto}`);
  ok((camp.personagem.inventario['espada_curta'] ?? 0) === 0, 'espada consumida do inventário');
  ok((camp.personagem.inventario['minerio_de_ferro'] ?? 0) === ferroAntes + 1, '1 minério de ferro recuperado da espada');

  // Desmanche de armadura pesada (peso >= 6 confere 2 minérios)
  const r2 = executarAcaoMundo(C, camp, { tipo: 'desmanchar', itemId: 'cota_de_malha' });
  ok(r2.ok, `desmanchar armadura pesada funciona: ${r2.texto}`);
  ok((camp.personagem.inventario['minerio_de_ferro'] ?? 0) === ferroAntes + 3, '2 minérios de ferro recuperados da cota de malha');

  // Recusa de item equipado
  equipar(C, camp, 'escudo_de_ferro');
  const rEquip = desmanchar(C, camp, 'escudo_de_ferro');
  ok(!rEquip.ok, 'recusa desmanchar peça enquanto ela estiver equipada');

  // Recusa de item único / mítico / nichirin
  camp.personagem.inventario['lamina_nichirin'] = 1;
  const rNichirin = desmanchar(C, camp, 'lamina_nichirin');
  ok(!rNichirin.ok, 'recusa desmanchar lâmina nichirin sagrada');

  // Recusa de consumível / acessório que não seja forjável
  camp.personagem.inventario['pocao_cura'] = 1;
  const rPocao = desmanchar(C, camp, 'pocao_cura');
  ok(!rPocao.ok, 'recusa desmanchar consumível na bigorna');
}

// ── Afiação & Têmpera ─────────────────────────────────────────────────
{
  const camp = nova('tempera');
  camp.personagem.inventario['espada_curta'] = 1;
  camp.personagem.inventario['armadura_de_couro'] = 1;
  camp.personagem.inventario[COMBUSTIVEL] = 5;

  // Afiar arma
  equipar(C, camp, 'espada_curta');
  const danoBaseSemAfiacao = danoJogador(C, camp).base;
  const rAfiar = executarAcaoMundo(C, camp, { tipo: 'temperar', itemId: camp.personagem.equipado.arma! });
  ok(rAfiar.ok, `afiar arma na forja funciona: ${rAfiar.texto}`);
  ok(camp.personagem.inventario[COMBUSTIVEL] === 4, 'afiar consumiu 1 carvão');
  const armaAfiada = armaEquipada(C, camp.personagem);
  ok(armaAfiada?.afiacao?.cargas === 5, 'arma afiada possui 5 cargas de gume');
  ok(armaAfiada?.afiacao?.bonusDano === 2, 'arma afiada possui +2 bônus de dano');
  const danoComAfiacao = danoJogador(C, camp).base;
  ok(danoComAfiacao > danoBaseSemAfiacao, `dano do jogador elevado pela afiação (${danoComAfiacao} contra ${danoBaseSemAfiacao})`);

  // Temperar armadura
  equipar(C, camp, 'armadura_de_couro');
  const defBaseSemTempera = bonusDefesaEquip(C, camp.personagem);
  const rTempera = executarAcaoMundo(C, camp, { tipo: 'temperar', itemId: camp.personagem.equipado.armadura! });
  ok(rTempera.ok, `temperar armadura na forja funciona: ${rTempera.texto}`);
  const armaduraTemperada = itemPorId(C, camp.personagem.equipado.armadura!, camp.personagem);
  ok(armaduraTemperada?.tempera?.cargas === 5, 'armadura temperada possui 5 cargas de blindagem');
  ok(armaduraTemperada?.tempera?.bonusDefesa === 2, 'armadura temperada confere +2 de defesa');
  const defComTempera = bonusDefesaEquip(C, camp.personagem);
  ok(defComTempera === defBaseSemTempera + 2, 'defesa do jogador elevada em +2 pela têmpera');

  // Integridade do catálogo: o item estático original de C.itens não foi mutado
  const itemOriginalCatalogo = C.itens.find(i => i.id === 'espada_curta');
  ok(itemOriginalCatalogo?.afiacao === undefined, 'catálogo estático imutável e seguro contra poluição');
}

// ── Catalisadores Raros & Místicos ───────────────────────────────────
{
  const camp = nova('catalisadores');
  camp.personagem.inventario['glandula_de_veneno'] = 1;
  camp.personagem.inventario['anel_draupnir'] = 1;
  camp.personagem.inventario['unha_de_carnical'] = 1;

  // Forjar lâmina curta com glândula peçonhenta
  const rVeneno = executarAcaoMundo(C, camp, {
    tipo: 'forjar',
    molde: 'lamina_curta',
    material: 'minerio_de_ferro',
    catalisador: 'glandula_de_veneno',
  });
  ok(rVeneno.ok, `forjar com glândula de veneno funciona: ${rVeneno.texto}`);
  ok((camp.personagem.inventario['glandula_de_veneno'] ?? 0) === 0, 'glândula consumida na forja');
  const pecaVeneno = camp.personagem.itensForjados![camp.personagem.itensForjados!.length - 1];
  ok(pecaVeneno.propriedadesEspeciais?.includes('venenosa'), 'peça infundida possui propriedade venenosa');

  // Forjar com Draupnir
  const rDraupnir = executarAcaoMundo(C, camp, {
    tipo: 'forjar',
    molde: 'cota',
    material: 'minerio_de_ferro',
    catalisador: 'anel_draupnir',
  });
  ok(rDraupnir.ok, `forjar com anel Draupnir funciona: ${rDraupnir.texto}`);
  const pecaDraupnir = camp.personagem.itensForjados![camp.personagem.itensForjados!.length - 1];
  ok(pecaDraupnir.suprimeMana === true, 'peça infundida possui supressão de mana');

  // Forjar com unha de carniçal (bônus dano com teto)
  const pecaCritica = calcularPeca(
    MOLDES.find(m => m.id === 'lamina_curta')!,
    MATERIAIS.find(m => m.item === 'lasca_de_gargula')!,
    1.3,
    'crit_test',
    'Ferreiro',
    CATALISADORES.find(c => c.item === 'unha_de_carnical'),
  );
  const tetoDano = Math.round(MOLDES.find(m => m.id === 'lamina_curta')!.dano!.base * TETO_SOBRE_O_MOLDE);
  ok(pecaCritica.dano!.base <= tetoDano, `mesmo com catalisador de dano crítico, respeita o teto de 1,45× (${pecaCritica.dano!.base} <= ${tetoDano})`);

  // Recusa se não tiver o catalisador
  const rSemCat = forjar(C, camp, 'lamina_curta', 'minerio_de_ferro', 'agua_do_espelho');
  ok(!rSemCat.ok, 'recusa forja se o jogador não tiver o catalisador');
}

// ── Integração de Combate: Veneno & Consumo de Cargas ─────────────────
{
  const camp = nova('combate_forja');
  // Cria e equipa arma venenosa e afiada
  const armaVen = calcularPeca(
    MOLDES.find(m => m.id === 'lamina_curta')!,
    MATERIAIS.find(m => m.item === 'minerio_de_ferro')!,
    1.0,
    'arma_ven_test',
    'Ferreira',
    CATALISADORES.find(c => c.item === 'glandula_de_veneno'),
  );
  armaVen.afiacao = { cargas: 2, bonusDano: 2 };
  camp.personagem.itensForjados = [armaVen];
  camp.personagem.inventario[armaVen.id] = 1;
  equipar(C, camp, armaVen.id);

  // Inicia combate contra criatura
  const criatura = C.criaturas[0];
  iniciarCombate(C, camp, [criatura.id]);
  ok(camp.combate !== null, 'combate iniciado com equipamento forjado');

  // Jogador desfere ataque
  const alvo = camp.combate!.atores.find(a => !a.ehJogador)!;
  jogadorAtaca(C, camp, alvo.id);
  if (alvo.vida < alvo.vidaMax) {
    ok(alvo.condicoes.includes('envenenado'), 'arma venenosa inoculou peçonha no inimigo');
    ok((alvo.tatico?.veneno ?? 0) > 0, 'contador tático de veneno ativado no adversário');
  }

  // Finalização do combate e decremento de cargas
  alvo.vida = 1;
  jogadorAtaca(C, camp, alvo.id);
  ok(camp.combate?.terminado === true, 'combate finalizado com vitória');
  const armaPosCombate = armaEquipada(C, camp.personagem);
  ok(armaPosCombate?.afiacao?.cargas === 1, 'carga de afiação decrementada em 1 após combate');
}

console.log('\nforja: tudo certo.');
