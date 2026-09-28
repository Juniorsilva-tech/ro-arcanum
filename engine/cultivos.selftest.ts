// ARCANUM · Cultivos por sítio (engine/cultivos.ts).
// O que estes testes seguram:
// - cada sítio só aceita as plantas da região; arroz pede muita água;
// - trocar de planta para a colheita por DIAS_REPLANTIO dias;
// - cada planta faz o que a ficha diz: centeio aguenta o inverno, painço a terra
//   ruim, linho e vinha dão ouro, ervas dão remédio, cevada dá estabilidade e o
//   nabo poupa o celeiro no inverno;
// - colônia sem planta escolhida colhe como antes (primeira planta do sítio).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { fundarColonia, processarDiaColonia } from './colonia';
import { plantar, podePlantar, colheitaDoDia, cultivoAtual, CULTIVOS_POR_SITIO, DIAS_REPLANTIO } from './cultivos';
import { processarRebanhos } from './rebanhos';
import { sitioDe } from './colonia';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const fundada = (sitio: string, seed = sitio): Campaign => {
  const c = criarCampanha(C, { nome: 'T', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  c.localAtual = sitio;
  if (!fundarColonia(C, c, '').ok) throw new Error('fundar');
  c.feudo!.edificios.lavoura_silos = 2;
  return c;
};
const base = { rocaTrigo: 20, niveis: 2, fatorSolo: 1, inverno: false, fatorInverno: 0.8 };

ok(Object.keys(CULTIVOS_POR_SITIO).every((id) => C.sitiosColonia?.some((s) => s.id === id)), 'todo sítio com cultivos existe no conteúdo');
ok((C.sitiosColonia ?? []).every((s) => CULTIVOS_POR_SITIO[s.id]?.length), 'todo sítio tem pelo menos uma planta');

{
  const c = fundada('campo_ceifa');
  const f = c.feudo!;
  ok(cultivoAtual(f).id === 'trigo', 'Campos da Ceifa começam no trigo');
  ok(!podePlantar(C, c, 'arroz').pode && !podePlantar(C, c, 'painco').pode, 'planta de outra região não dá aqui');
  const r = plantar(C, c, 'cevada');
  ok(r.ok && cultivoAtual(f).id === 'cevada', 'troca para cevada');
  const dia = c.calendario.dia;
  ok(colheitaDoDia(f, dia, base).comida === 0 && colheitaDoDia(f, dia + DIAS_REPLANTIO, base).comida > 0, `roça parada por ${DIAS_REPLANTIO} dias depois de trocar`);
  f.replantioAte = 0;
  ok(colheitaDoDia(f, 5, base).estabilidade === 1 && Math.abs(colheitaDoDia(f, 6, base).comida - 16) < 1e-9, 'cevada rende 80% e dá estabilidade a cada 5 dias');
  f.cultivo = 'linho';
  ok(colheitaDoDia(f, 6, base).ouro === 6, 'linho vende: 3 de ouro por nível');
}
{
  const c = fundada('colina_forcados');
  const f = c.feudo!;
  f.cultivo = 'centeio';
  const trigoInverno = colheitaDoDia({ ...f, cultivo: 'trigo' } as typeof f, 1, { ...base, inverno: true, fatorInverno: 0.35, rocaTrigo: 7 }).comida;
  const centeioInverno = colheitaDoDia(f, 1, { ...base, inverno: true, fatorInverno: 0.35, rocaTrigo: 7 }).comida;
  ok(centeioInverno > trigoInverno * 1.5, `centeio aguenta o inverno (${centeioInverno.toFixed(1)} contra ${trigoInverno.toFixed(1)})`);
  f.cultivo = 'nabo';
  ok(colheitaDoDia(f, 1, { ...base, inverno: true }).forragem > 0 && colheitaDoDia(f, 1, base).forragem === 0, 'nabo vira forragem só no inverno');
  const s = sitioDe(C, f.sitio)!;
  c.feudo!.rebanhos = { vaca: 4 };
  f.comida = 500;
  const semNabo = processarRebanhos(c, s, true, 0).feno;
  f.comida = 500;
  const comNabo = processarRebanhos(c, s, true, 0.6).feno;
  ok(comNabo < semNabo, `com nabo o rebanho tira menos feno do celeiro (${comNabo.toFixed(1)} contra ${semNabo.toFixed(1)})`);
}
{
  const c = fundada('ruina_areia');
  const f = c.feudo!;
  ok(cultivoAtual(f).id === 'painco', 'Ruína de Areia começa no painço');
  const ruim = { ...base, fatorSolo: 0.4, rocaTrigo: 8 };
  ok(colheitaDoDia(f, 1, ruim).comida > ruim.rocaTrigo * 1.5, 'painço rende em terra ruim quase como trigo em terra boa');
  f.cultivo = 'ervas';
  ok(colheitaDoDia(f, 1, base).remedios === 4, 'ervas dão remédio');
}
{
  const c = fundada('vau_pedra');
  const agua = sitioDe(C, 'vau_pedra')!.terreno.agua;
  ok(podePlantar(C, c, 'arroz').pode === agua >= 3, `arroz só com muita água (água do vau: ${agua})`);
  const antes = c.feudo!.tesouro;
  c.feudo!.cultivo = 'vinha';
  c.feudo!.replantioAte = 0;
  const rel = processarDiaColonia(C, c);
  ok(c.feudo!.tesouro - antes >= 10, 'vinha rende ouro no dia da colônia');
  ok(rel?.cultivo === 'Vinha', 'relatório diz a planta');
}
console.log('\nCultivos: OK.');
