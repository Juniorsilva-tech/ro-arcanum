// Teste automatizado de todas as funcionalidades da área de testes de IA
declare const require: any;
const fs = require('fs');
const path = require('path');
import {
  testarChave,
  testarCenaAdulta,
  listarModelos,
  narrarComFallback,
  criarCampanha,
  atributosBase,
  montarCena,
  obterTokenNousAtual,
} from '../engine';
import { bundlePorId } from '../content';

async function main() {
  console.log('=== TESTE DA ÁREA DE IA (NOUS RESEARCH / HERMES) ===\n');

  // 1. Ler token do Hermes / bridge local
  const token = obterTokenNousAtual();
  if (!token) {
    console.error('Token da Nous não encontrado no Hermes');
    process.exit(1);
  }
  console.log('✓ Token encontrado e carregado do Hermes / bridge');

  // Testar 1: buscarModelos (listarModelos)
  console.log('\n--- 1. Testando "Buscar Modelos" (listarModelos) ---');
  const t0 = Date.now();
  const modelos = await listarModelos('nous', token, true);
  console.log(`✓ Retornou ${modelos.length} modelos em ${Date.now() - t0}ms`);
  const modelosGratis = modelos.filter((m) => m.free);
  console.log(`  Modelos com marcação free / sugestões: ${modelosGratis.length}`);
  console.log('  Primeiros 6 modelos retornados:');
  for (const m of modelos.slice(0, 6)) {
    console.log(`   - [${m.free ? 'FREE' : 'PAID'}] ${m.id} (perfil: ${m.perfil})`);
  }

  // Testar 2: testarChave
  console.log('\n--- 2. Testando "Testar Chave" (testarChave) ---');
  const modeloPadrao = 'upstage/solar-pro4:free';
  const resChave = await testarChave({
    provider: 'nous',
    apiKey: token,
    modelo: modeloPadrao,
  });
  console.log('Resultado de testarChave:', resChave);
  if (!resChave.ok) {
    console.error('❌ Falha ao testar chave!');
  } else {
    console.log('✓ Chave validada com sucesso na API da Nous Research!');
  }

  // Testar 3: testarCenaAdulta
  console.log('\n--- 3. Testando "Este modelo narra sexo?" (testarCenaAdulta) ---');
  const tAdulto = Date.now();
  const resAdulto = await testarCenaAdulta({
    provider: 'nous',
    apiKey: token,
    modelo: modeloPadrao,
  });
  console.log(`Resultado em ${Date.now() - tAdulto}ms:`);
  console.log(`  narra: ${resAdulto.narra}`);
  console.log(`  recusou: ${resAdulto.recusou}`);
  if (resAdulto.amostra) {
    console.log(`  amostra (primeiros 150 chars): "${resAdulto.amostra.slice(0, 150)}..."`);
  }
  if (resAdulto.erro) {
    console.log(`  erro: ${resAdulto.erro}`);
  }

  // Testar 4: testarNarracaoReal (narrarComFallback)
  console.log('\n--- 4. Testando "Testar narração de verdade" (testarNarracaoReal) ---');
  const content = bundlePorId('vaelhorn')!;
  const camp = criarCampanha(content, {
    nome: 'Thorne',
    atributos: atributosBase(),
    classeId: content.classes[0].id,
    origemId: content.origens[0].id,
    seedString: 'teste_nous_hermes',
  });
  const cena = montarCena(content, camp);
  const pedido = {
    fato: 'Você empurrou a porta de carvalho da estalagem e entrou com a espada embainhada.',
    custoPeriodos: 0,
    efeitosAplicados: [],
  } as any;

  const tNarr = Date.now();
  const resNarr = await narrarComFallback(
    { provider: 'nous', apiKey: token, modelo: modeloPadrao },
    content,
    camp,
    cena.contexto,
    pedido,
  );
  console.log(`Resultado em ${Date.now() - tNarr}ms:`);
  if (resNarr.texto) {
    console.log(`✓ Narração gerada com sucesso (${resNarr.texto.length} caracteres)!`);
    console.log(`Modelo usado: ${resNarr.modeloUsado ?? modeloPadrao}`);
    console.log('\n[Trecho da narração]:');
    console.log(resNarr.texto.slice(0, 300) + '...');
    if (resNarr.opcoes && resNarr.opcoes.length > 0) {
      console.log(`\nOpções geradas (${resNarr.opcoes.length}):`);
      for (const op of resNarr.opcoes) {
        console.log(`  - ${op.rotulo} (${op.natureza})`);
      }
    }
  } else {
    console.error(`❌ Falha na narração: ${resNarr.erro}`);
  }

  console.log('\n=== FIM DOS TESTES DA ÁREA DE IA ===');
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
