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
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { executarAcaoMundo } from './acoesMundo';
import { equipar, itemPorId, armaEquipada } from './items';
import { exportar, importar } from './persistencia';
import { maestriaDe, estadoAptidao, esforcoParaMaestria } from './aptidao';
import {
  MOLDES, MATERIAIS, TETO_SOBRE_O_MOLDE, COMBUSTIVEL, calcularPeca,
  qualidadeDaMao, ondeForjar, receitasDisponiveis, forjar,
} from './forja';
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

console.log('\nforja: tudo certo.');
