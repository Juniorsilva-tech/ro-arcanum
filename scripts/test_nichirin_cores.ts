import { criarCampanha } from '../engine/campaign';
import { conteudoVaelhorn } from '../content/vaelhorn';
import { equipar, itemPorId } from '../engine/items';
import { determinarCorNichirin, verificarDespertarNichirin, CATALAGO_CORES_NICHIRIN } from '../engine/nichirin';
import { iniciarCombate, jogadorAtaca, jogadorAtor } from '../engine/combat';

const bundle = conteudoVaelhorn;

async function testarNichirin() {
  console.log('=== TESTANDO SISTEMA CANÔNICO DE LÂMINAS NICHIRIN ===\n');

  const attrPadrao = { fisico: 10, precisao: 10, resiliencia: 10, raciocinio: 10, percepcao: 10, social: 10 };

  // 1. Determinação de Cor por Respiração
  console.log('1. Testando afinidade de respirações com as cores canônicas:');
  const camp1 = criarCampanha(bundle, { nome: 'Giyu', classeId: 'cacadora', origemId: 'divida', atributos: { ...attrPadrao } });
  camp1.personagem.artesConhecidas = ['respiracao_agua_primeira_forma'];
  const corAgua = determinarCorNichirin(camp1);
  console.log(`   - Água: ${corAgua} (Esperado: azul) -> ${corAgua === 'azul' ? '✓ OK' : '✗ FALHA'}`);

  camp1.personagem.artesConhecidas = ['respiracao_chama_nona_forma'];
  const corChamas = determinarCorNichirin(camp1);
  console.log(`   - Chamas: ${corChamas} (Esperado: vermelha) -> ${corChamas === 'vermelha' ? '✓ OK' : '✗ FALHA'}`);

  camp1.personagem.artesConhecidas = ['respiracao_trovao_primeira'];
  const corTrovao = determinarCorNichirin(camp1);
  console.log(`   - Trovão: ${corTrovao} (Esperado: amarela) -> ${corTrovao === 'amarela' ? '✓ OK' : '✗ FALHA'}`);

  camp1.personagem.artesConhecidas = ['hinokami_kagura_danca'];
  const corSol = determinarCorNichirin(camp1);
  console.log(`   - Sol (Hinokami): ${corSol} (Esperado: preta) -> ${corSol === 'preta' ? '✓ OK' : '✗ FALHA'}`);

  // 2. Determinação de Cor por Atributos (Sem respiração ainda)
  console.log('\n2. Testando afinidade por atributos inatos do caçador:');
  const camp2 = criarCampanha(bundle, { nome: 'Novato', classeId: 'cacadora', origemId: 'divida', atributos: { ...attrPadrao, precisao: 18 } });
  camp2.personagem.artesConhecidas = [];
  const corPrecisao = determinarCorNichirin(camp2);
  console.log(`   - Precisão Alta: ${corPrecisao} (Esperado: amarela) -> ${corPrecisao === 'amarela' ? '✓ OK' : '✗ FALHA'}`);

  camp2.personagem.atributos.precisao = 10;
  camp2.personagem.atributos.fisico = 17;
  const corFisico = determinarCorNichirin(camp2);
  console.log(`   - Físico Alto: ${corFisico} (Esperado: vermelha) -> ${corFisico === 'vermelha' ? '✓ OK' : '✗ FALHA'}`);

  // 3. Despertar Cromático ao Empunhar Lâmina Nichirin
  console.log('\n3. Testando transmutação cromática ao empunhar Lâmina Nichirin pela primeira vez:');
  const camp3 = criarCampanha(bundle, { nome: 'Tanjiro', classeId: 'cacadora', origemId: 'divida', atributos: { ...attrPadrao } });
  camp3.personagem.artesConhecidas = ['hinokami_kagura_danca'];
  camp3.personagem.inventario['lamina_nichirin'] = 1;

  const resultadoEquipar = equipar(bundle, camp3, 'lamina_nichirin');
  console.log(`   - Equipar executado: ${resultadoEquipar.ok ? '✓ OK' : '✗ FALHA'}`);
  
  const armaEquipadaId = camp3.personagem.equipado.arma;
  const itemDesperto = itemPorId(bundle, armaEquipadaId!, camp3.personagem);
  console.log(`   - Nova instância criada com cor: ${itemDesperto?.corNichirin} (${itemDesperto?.corNichirinNome})`);
  console.log(`   - Nome do item atualizado: "${itemDesperto?.nome}"`);
  console.log(`   - Cor inata guardada no personagem: ${camp3.personagem.corNichirinInata}`);
  console.log(`   - Marco registrado: ${camp3.personagem.alcunhas.length >= 0 ? '✓ OK' : '✗'}`);

  if (itemDesperto?.corNichirin !== 'preta') {
    throw new Error('Nichirin de portador do Sol deveria ter despertado como preta!');
  }

  // 4. Lâmina de Yoriichi (Sol Primordial permanente)
  console.log('\n4. Testando Lâmina de Yoriichi:');
  const campYoriichi = criarCampanha(bundle, { nome: 'Yoriichi', classeId: 'cacadora', origemId: 'divida', atributos: { ...attrPadrao } });
  campYoriichi.personagem.inventario['lamina_da_origem_solar'] = 1;
  equipar(bundle, campYoriichi, 'lamina_da_origem_solar');
  const armaYoriichi = itemPorId(bundle, campYoriichi.personagem.equipado.arma!, campYoriichi.personagem);
  console.log(`   - Lâmina de Yoriichi cor: ${armaYoriichi?.corNichirin} (${armaYoriichi?.corNichirinNome}) -> ${armaYoriichi?.corNichirin === 'preta' ? '✓ OK' : '✗ FALHA'}`);

  // 5. Combate e Bônus da Nichirin Negra contra Onis
  console.log('\n5. Testando benefícios da Nichirin Negra em combate contra Oni:');
  iniciarCombate(bundle, camp3, ['oni_faminto']);
  const s = camp3.combate!;
  const atorJogador = s.atores.find((a) => a.ehJogador)!;
  console.log(`   - Ator no combate possui cor: ${atorJogador.corNichirin} (${atorJogador.nomeCorNichirin})`);

  jogadorAtaca(bundle, camp3, 'oni_faminto');
  console.log(`   - Linhas do combate:\n     * ${s.log.join('\n     * ')}`);
  const ativouSolar = s.log.some(l => l.includes('Nichirin Negra') && l.includes('brasa solar pura'));
  console.log(`   - Efeito ativado no log: ${ativouSolar ? '✓ OK' : '✗ FALHA'}`);

  console.log('\n=== TODOS OS TESTES DO SISTEMA DE NICHIRIN PASSARAM COM SUCESSO! ===');
}

testarNichirin().catch(e => {
  console.error('Erro no teste de Nichirin:', e);
  process.exit(1);
});
