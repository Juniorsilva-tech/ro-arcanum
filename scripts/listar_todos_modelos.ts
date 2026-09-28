declare const require: any;
const fs = require('fs');
const path = require('path');
import { obterTokenNousAtual } from '../engine';

async function main() {
  const token = obterTokenNousAtual();
  if (!token) {
    console.error('Nenhum token da Nous encontrado.');
    return;
  }

  const resp = await fetch('https://inference-api.nousresearch.com/v1/models', {
    headers: { authorization: 'Bearer ' + token },
  });
  const data = (await resp.json()) as any;
  const list = (data.data || []).map((m: any) => m.id);
  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'nous_all_models.json'), JSON.stringify(list, null, 2));
  console.log('Salvos', list.length, 'modelos em scripts/nous_all_models.json');
}

main().catch(console.error);
