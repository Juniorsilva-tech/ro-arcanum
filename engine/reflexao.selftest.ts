// ARCANUM · Testes do Ciclo de Reflexão Cognitiva de NPCs (Stanford / Generative Agents).
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
assert.equal = (a: unknown, b: unknown, msg: string) => {
  if (a !== b) throw new Error(`${msg} (esperado: ${b}, recebido: ${a})`);
};
assert.ok = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(msg);
};
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { registrarLembranca } from './memoria';
import {
  acumularReflexao,
  sintetizarConviccao,
  conviccoesDoNpc,
  retratoConviccoes,
  LIMIAR_REFLEXAO,
  MAX_CONVICCOES,
} from './reflexao';

const nova = () =>
  criarCampanha(C, {
    nome: 'Forasteiro',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'divida',
    seedString: 'teste-reflexao',
  });

console.log('--- TESTES DE REFLEXÃO COGNITIVA DOS NPCS ---');

// Teste 1: Acúmulo de pontos sem ultrapassar o limiar
{
  const camp = nova();
  const npcId = C.npcs[0].id;

  assert.equal(camp.npcState[npcId].pontosReflexao ?? 0, 0, 'Inicia com 0 pontos de reflexão');

  const conv = acumularReflexao(camp, npcId, 4);
  assert.equal(conv, undefined, 'Não deve sintetizar convicção antes do limiar');
  assert.equal(camp.npcState[npcId].pontosReflexao, 4, 'Pontos acumulados corretamente');
  console.log('✓ 1. Acúmulo gradual de pontos emocionais validado');
}

// Teste 2: Disparo de reflexão de AFETO por ajuda e intimidade
{
  const camp = nova();
  const npcId = C.npcs[0].id;

  // Insere lembranças positivas diretamente via registrarLembranca
  registrarLembranca(camp, npcId, { tipo: 'ajuda', resumo: 'ficou do lado dela', peso: 4 });
  registrarLembranca(camp, npcId, { tipo: 'presente', resumo: 'deu um xale quente', peso: 4 });
  
  // Próxima lembrança soma peso 4 (total 12 >= LIMIAR_REFLEXAO 10)
  registrarLembranca(camp, npcId, { tipo: 'intimidade', resumo: 'passaram a noite conversando', peso: 4 });

  const convs = conviccoesDoNpc(camp, npcId);
  assert.equal(convs.length, 1, 'Deve ter gerado exatamente 1 convicção');
  assert.equal(convs[0].valencia, 'afeto', 'Valência deve ser de afeto');
  assert.ok(convs[0].texto.includes('lealdade') || convs[0].texto.includes('confiável'), 'Texto reflete lealdade/afeto');
  assert.ok((camp.npcState[npcId].eixos.confianca ?? 0) > 0, 'Confiança deve ter subido');
  console.log('✓ 2. Síntese de AFETO e aumento de confiança validados');
}

// Teste 3: Disparo de reflexão de TEMOR e DESCONFIANÇA por agressão
{
  const camp = nova();
  const npcId = C.npcs[0].id;

  registrarLembranca(camp, npcId, { tipo: 'ofensa', resumo: 'você a ameaçou na frente dos vizinhos', peso: 4 });
  registrarLembranca(camp, npcId, { tipo: 'violencia', resumo: 'você puxou ela pelo braço com força', peso: 5 });
  registrarLembranca(camp, npcId, { tipo: 'roubo', resumo: 'sumiram moedas dela', peso: 4 });

  const convs = conviccoesDoNpc(camp, npcId);
  assert.equal(convs.length, 1, 'Deve ter gerado 1 convicção');
  assert.equal(convs[0].valencia, 'temor', 'Valência deve ser de temor devido à violência');
  assert.ok((camp.npcState[npcId].eixos.medo ?? 0) > 0, 'Medo deve ter subido');
  assert.ok((camp.npcState[npcId].eixos.confianca ?? 0) < 0, 'Confiança deve ter caído');
  assert.ok(camp.npcState[npcId].tensao > 0, 'Tensão deve ter subido');
  console.log('✓ 3. Síntese de TEMOR, subida de medo e queda de confiança validadas');
}

// Teste 4: Disparo de reflexão de CAUTELA por sinais mistos
{
  const camp = nova();
  const npcId = C.npcs[0].id;

  // Positivo: 5
  registrarLembranca(camp, npcId, { tipo: 'ajuda', resumo: 'você pagou a dívida dela', peso: 5 });
  // Negativo: 5
  registrarLembranca(camp, npcId, { tipo: 'mentira', resumo: 'você mentiu e ela descobriu', peso: 5 });

  const convs = conviccoesDoNpc(camp, npcId);
  assert.equal(convs.length, 1, 'Deve ter gerado 1 convicção');
  assert.equal(convs[0].valencia, 'cautela', 'Valência de experiências ambivalentes deve ser cautela');
  assert.ok(convs[0].texto.includes('mantém guarda'), 'Texto de cautela coerente');
  console.log('✓ 4. Síntese de CAUTELA diante de sinais contraditórios validada');
}

// Teste 5: Respeito ao teto de MAX_CONVICCOES (3)
{
  const camp = nova();
  const npcId = C.npcs[0].id;

  // Injeta diretamente convicções para testar capacidade e ordenação
  camp.npcState[npcId].conviccoes = [
    { id: 'c1', texto: 'Convicção 1', valencia: 'afeto', intensidade: 2, turno: 1, dia: 1, baseadaEmTipos: ['ajuda'] },
    { id: 'c2', texto: 'Convicção 2', valencia: 'cautela', intensidade: 3, turno: 2, dia: 2, baseadaEmTipos: ['mentira'] },
    { id: 'c3', texto: 'Convicção 3', valencia: 'desconfianca', intensidade: 4, turno: 3, dia: 3, baseadaEmTipos: ['roubo'] },
  ];

  // Adiciona mais lembrança violenta e força síntese
  camp.npcState[npcId].memoria.push({ turno: 4, dia: 4, resumo: 'tentativa de morte', peso: 5, tipo: 'violencia' });
  sintetizarConviccao(camp, npcId);

  const final = conviccoesDoNpc(camp, npcId);
  assert.ok(final.length <= MAX_CONVICCOES, `Não pode exceder ${MAX_CONVICCOES} convicções ativas`);
  console.log(`✓ 5. Teto de no máximo ${MAX_CONVICCOES} convicções ativas respeitado`);
}

// Teste 6: Formatação para contexto do narrador
{
  const camp = nova();
  const npcId = C.npcs[0].id;

  camp.npcState[npcId].conviccoes = [
    { id: 'c1', texto: 'Vê você como aliado fiel.', valencia: 'afeto', intensidade: 5, turno: 1, dia: 1, baseadaEmTipos: ['ajuda'] },
  ];

  const retrato = retratoConviccoes(camp, npcId);
  assert.ok(retrato?.includes('[AFETO] Vê você como aliado fiel.'), 'Retrato psicológico devidamente formatado');
  console.log('✓ 6. Retrato psicológico para injeção narrativa validado');
}

console.log('--- TODOS OS 6 TESTES DE REFLEXÃO COGNITIVA PASSARAM COM SUCESSO ---');
