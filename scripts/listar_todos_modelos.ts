declare const require: any;
const fs = require('fs');
const path = require('path');

async function main() {
  const authPath = path.join(process.env.LOCALAPPDATA || 'C:\\Users\\Junior\\AppData\\Local', 'hermes', 'auth.json');
  const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  const token = authData?.providers?.nous?.access_token || authData?.credential_pool?.nous?.[0]?.access_token;

  const resp = await fetch('https://inference-api.nousresearch.com/v1/models', {
    headers: { authorization: 'Bearer ' + token },
  });
  const data = (await resp.json()) as any;
  const list = (data.data || []).map((m: any) => m.id);
  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'nous_all_models.json'), JSON.stringify(list, null, 2));
  console.log('Salvos', list.length, 'modelos em scripts/nous_all_models.json');
}

main().catch(console.error);
