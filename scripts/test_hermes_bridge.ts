import { obterTokenNousAtual, renovarTokenNous, tokenEstaPrestesAExpirar } from '../engine/hermesBridge';
import { resolverApiKey, testarChave } from '../engine/llm';

async function main() {
  console.log('--- TESTE DE RENOVAÇÃO IMPERCEPTÍVEL DO TOKEN NOUS ---');

  // 1. Obter token inicial
  const tokenInicial = obterTokenNousAtual();
  console.log('1. Token Nous inicial carregado:', tokenInicial ? `${tokenInicial.slice(0, 16)}...` : '(vazio)');
  if (!tokenInicial) {
    throw new Error('Token inicial da Nous não foi encontrado.');
  }

  // 2. Testar resolverApiKey
  const chaveResolvida = resolverApiKey({
    provider: 'nous',
    apiKey: '',
    modelo: 'upstage/solar-pro4:free',
  });
  console.log('2. resolverApiKey com provider "nous" e chave vazia retornou token:', !!chaveResolvida);
  if (chaveResolvida !== tokenInicial) {
    throw new Error('resolverApiKey não retornou o token obtido pelo bridge.');
  }

  // 3. Testar status do token
  console.log('3. Token está prestes a expirar (< 5 min)?:', tokenEstaPrestesAExpirar());

  // 4. Testar chamada real de validação
  console.log('4. Testando chamada real com testarChave()...');
  const teste = await testarChave({
    provider: 'nous',
    apiKey: '',
    modelo: 'upstage/solar-pro4:free',
  });
  console.log('   Resultado de testarChave():', teste);
  if (!teste.ok) {
    throw new Error(`testarChave falhou: ${teste.erro}`);
  }

  // 5. Testar renovação forçada via hermes
  console.log('5. Testando renovação forçada com renovarTokenNous(true)...');
  const novoToken = await renovarTokenNous(true);
  console.log('   Novo token retornado:', novoToken ? `${novoToken.slice(0, 16)}...` : '(nulo)');
  if (!novoToken) {
    throw new Error('renovarTokenNous(true) não retornou um token válido.');
  }

  // 6. Testar novamente após renovação
  console.log('6. Testando chamada após renovação forçada...');
  const testePosRenovacao = await testarChave({
    provider: 'nous',
    apiKey: '',
    modelo: 'upstage/solar-pro4:free',
  });
  console.log('   Resultado pós-renovação:', testePosRenovacao);
  if (!testePosRenovacao.ok) {
    throw new Error(`testarChave pós renovação falhou: ${testePosRenovacao.erro}`);
  }

  console.log('\n✓ TODOS OS TESTES DE RENOVAÇÃO DO TOKEN NOUS PASSARAM COM SUCESSO!');
}

main().catch((err) => {
  console.error('ERRO NO TESTE:', err);
  process.exit(1);
});
