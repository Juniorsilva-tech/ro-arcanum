declare const require: any;
const fs = require('fs');
const path = require('path');

import { testarCenaAdulta, narrarComModelo, criarCampanha, atributosBase, montarCena, obterTokenNousAtual } from '../engine';
import { bundlePorId } from '../content';

async function testarModelos() {
  const token = obterTokenNousAtual();

  console.log('Buscando modelos da Nous Research...');
  const resp = await fetch('https://inference-api.nousresearch.com/v1/models', {
    headers: { authorization: 'Bearer ' + token },
  });
  const data = (await resp.json()) as any;
  const todos = data.data || [];
  console.log(`Total de modelos retornados pela Nous: ${todos.length}`);

  const gratis = todos.filter((m: any) => m.id.endsWith(':free') || m.id.includes('free'));
  console.log(`Modelos com :free no id (${gratis.length}):`, gratis.map((m: any) => m.id));

  const hermes = todos.filter((m: any) => m.id.toLowerCase().includes('hermes'));
  console.log(`Modelos Hermes (${hermes.length}):`, hermes.map((m: any) => m.id));

  // Candidatos para testar na Nous
  const candidatos = [
    'meituan/longcat-2.0:free',
    'inclusionai/ling-3.0-flash-fin:free',
    'inclusionai/ling-3.0-flash-sante:free',
    'sao10k/l3.1-euryale-70b',
  ];

  console.log('\n--- TESTANDO CENA ADULTA E QUALIDADE EM PORTUGUÊS NOS MODELOS DA NOUS ---');
  for (const modId of candidatos) {
    console.log(`\n========================================`);
    console.log(`Testando: ${modId}`);
    try {
      const resAdulto = await testarCenaAdulta({
        provider: 'nous',
        apiKey: token,
        modelo: modId,
      });
      console.log(`> Narra adulto? ${resAdulto.narra ? 'SIM' : 'NÃO'} (recusou: ${resAdulto.recusou})`);
      if (resAdulto.amostra) {
        console.log(`> Amostra adulto: "${resAdulto.amostra.slice(0, 180)}..."`);
      }
      if (resAdulto.erro) {
        console.log(`> Erro adulto: ${resAdulto.erro}`);
      }

      // Se passou no teste ou para ver a qualidade da prosa:
      if (resAdulto.narra || !resAdulto.recusou) {
        console.log('> Testando prosa e português...');
        const content = bundlePorId('vaelhorn')!;
        const camp = criarCampanha(content, {
          nome: 'Kaelen',
          atributos: atributosBase(),
          classeId: content.classes[0].id,
          origemId: content.origens[0].id,
          seedString: 'prosa_teste',
        });
        const cena = montarCena(content, camp);
        const r = {
          fato: 'Você confrontou a taverneira sobre o desaparecimento dos viajantes.',
          custoPeriodos: 0,
          efeitosAplicados: [],
        } as any;

        const resProsa = await narrarComModelo(
          { provider: 'nous', apiKey: token, modelo: modId },
          content,
          camp,
          cena.contexto,
          r,
        );
        if (resProsa.texto) {
          console.log('> Qualidade da prosa:');
          console.log(resProsa.texto.slice(0, 300) + '...\n');
        } else {
          console.log(`> Erro de prosa: ${resProsa.erro}`);
        }
      }
    } catch (e) {
      console.log(`> Falha na execução: ${e}`);
    }
  }
}

testarModelos().catch(console.error);
