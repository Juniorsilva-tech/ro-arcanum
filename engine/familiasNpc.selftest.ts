// ARCANUM · Famílias entre NPCs (engine/familiasNpc.ts, content/vaelhorn/familias.ts).
//
// Metade destes testes é sobre o CONTEÚDO inteiro, não sobre um exemplo:
// todo id existe, todo laço é recíproco, mãe é mais velha que filha, ninguém
// é parente de si mesmo nem avó da própria avó, e quem não é humano só entra
// com justificativa escrita. A outra metade é a engine usando o parentesco:
// luto, herança, gratidão, uniões, narrador e save.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo, registrarFato } from './historiaViva';
import {
  parentesDe, familiasDe, saoParentes, lacoEntre, membrosComFamilia, processarFamiliasNpc, prantear,
  propagarParaFamilia, ocupacaoEfetiva, familiaParaNarrador, estadoFamiliasNpc, lacoProximo, type LacoParente,
} from './familiasNpc';
import { resolverIntencao } from './turn';
import { montarPacote } from './llm';
import { calcularContexto } from './availability';
import { exportar, importar } from './persistencia';
import { avancarMundo } from './mundo';
import type { Campaign, NPC } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const nova = (seed = 'familias-npc'): Campaign => {
  const c = criarCampanha(C, {
    nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};

const familias = C.familias ?? [];
const porId = new Map<string, NPC>(C.npcs.map(n => [n.id, n]));
const regiao = (id: string) => C.locais.find(l => l.id === porId.get(id)?.localBase)?.regiao ?? '?';

// ── 1. Tamanho e alcance ──────────────────────────────────────────────────
const membros = membrosComFamilia(C);
ok(familias.length >= 30, `${familias.length} famílias escritas (mínimo 30)`);
ok(membros.length >= 110, `${membros.length} NPCs com parentesco (mínimo 110 de ${C.npcs.length})`);
{
  const regioes = new Set(membros.map(regiao));
  const todas = new Set(C.npcs.map(n => regiao(n.id)));
  const faltando = [...todas].filter(r => !regioes.has(r) && C.npcs.filter(n => regiao(n.id) === r).length >= 3);
  ok(faltando.length === 0, `Toda região com gente tem família (${regioes.size} regiões; faltando: ${faltando.join(', ') || 'nenhuma'})`);
}

// ── 2. Integridade do conteúdo ────────────────────────────────────────────
for (const f of familias) {
  const ids = new Set(f.membros.map(m => m.npc));
  for (const m of f.membros) ok(porId.has(m.npc), `${f.id}: ${m.npc} existe no elenco`);
  for (const l of f.lacos) {
    ok(ids.has(l.a) && ids.has(l.b), `${f.id}: laço ${l.tipo} entre membros da família (${l.a}, ${l.b})`);
    ok(l.a !== l.b, `${f.id}: ninguém é ${l.tipo} de si mesmo`);
  }
  // Todo membro tem pelo menos um laço — família não é lista de conhecidos.
  const ligados = new Set(f.lacos.flatMap(l => [l.a, l.b]));
  ok(f.membros.every(m => ligados.has(m.npc)), `${f.id}: todo membro tem laço com alguém da família`);
  ok(f.tensao.length >= 120, `${f.id}: a tensão da família é escrita de verdade (${f.tensao.length} caracteres)`);
  ok(C.locais.some(l => l.id === f.sede), `${f.id}: a sede ${f.sede} existe`);
  for (const m of f.membros) ok(m.papel.length >= 40, `${f.id}/${m.npc}: papel com pelo menos 40 caracteres`);
}
{
  const ids = familias.map(f => f.id);
  ok(new Set(ids).size === ids.length, 'Ids de família não se repetem');
  const papeis = familias.flatMap(f => f.membros.map(m => m.papel));
  ok(new Set(papeis).size === papeis.length, `Nenhum papel repete texto de outro (${papeis.length} papéis)`);
  const tensoes = familias.map(f => f.tensao);
  ok(new Set(tensoes).size === tensoes.length, 'Nenhuma tensão repete texto de outra');
}

// ── 3. Coerência do parentesco (em todo o elenco) ────────────────────────
const INVERSO: Record<LacoParente, (fem: boolean) => LacoParente[]> = {
  mae: () => ['filha', 'filho'], pai: () => ['filha', 'filho'],
  filha: () => ['mae', 'pai'], filho: () => ['mae', 'pai'],
  irma: () => ['irma', 'irmao'], irmao: () => ['irma', 'irmao'],
  conjuge: () => ['conjuge'],
  avo: () => ['neta', 'neto'], avoM: () => ['neta', 'neto'],
  neta: () => ['avo', 'avoM'], neto: () => ['avo', 'avoM'],
  tia: () => ['sobrinha', 'sobrinho'], tio: () => ['sobrinha', 'sobrinho'],
  sobrinha: () => ['tia', 'tio'], sobrinho: () => ['tia', 'tio'],
  prima: () => ['prima', 'primo'], primo: () => ['prima', 'primo'],
};
let pares = 0;
const assimetricos: string[] = [];
const idadeRuim: string[] = [];
for (const id of membros) {
  for (const p of parentesDe(C, id)) {
    pares++;
    const volta = lacoEntre(C, p.npc, id);
    if (!volta || !INVERSO[p.laco](true).includes(volta)) assimetricos.push(`${id} → ${p.npc} (${p.laco}/${volta})`);
    // p.laco é o que p.npc é para id.
    const eu = porId.get(id)!.idade, ele = porId.get(p.npc)!.idade;
    if ((p.laco === 'mae' || p.laco === 'pai') && ele - eu < 15) idadeRuim.push(`${p.npc} é ${p.laco} de ${id} com ${ele - eu} anos de diferença`);
    if ((p.laco === 'avo' || p.laco === 'avoM') && ele - eu < 30) idadeRuim.push(`${p.npc} é avó de ${id} com ${ele - eu} anos de diferença`);
  }
  ok(!parentesDe(C, id).some(p => p.npc === id), `${id} não é parente de si mesmo`);
}
ok(assimetricos.length === 0, `Simetria: ${pares} laços, todos com o inverso certo (${assimetricos.slice(0, 3).join('; ')})`);
ok(idadeRuim.length === 0, `Idade: mãe/pai 15+ anos mais velhos, avó 30+ (${idadeRuim.join('; ') || 'nenhuma exceção'})`);
{
  // Nenhum ciclo na linha de descendência (mãe, pai, avó dirigidos).
  const filhos = new Map<string, string[]>();
  for (const f of familias) for (const l of f.lacos) if (['mae', 'pai', 'avo'].includes(l.tipo)) filhos.set(l.a, [...(filhos.get(l.a) ?? []), l.b]);
  const visitando = new Set<string>(), feito = new Set<string>();
  let ciclo = '';
  const dfs = (x: string) => {
    if (feito.has(x) || ciclo) return;
    if (visitando.has(x)) { ciclo = x; return; }
    visitando.add(x);
    for (const y of filhos.get(x) ?? []) dfs(y);
    visitando.delete(x); feito.add(x);
  };
  for (const x of filhos.keys()) dfs(x);
  ok(!ciclo, `Nenhum ciclo de descendência${ciclo ? ` (em ${ciclo})` : ''}`);
}
{
  const naoHumanos = membros.filter(id => ['oni', 'espirito'].includes(porId.get(id)?.especie ?? 'humano'));
  for (const id of naoHumanos) {
    const just = familiasDe(C, id).map(f => f.naoHumanos?.[id]).find(Boolean);
    ok(!!just && just.length >= 40, `${id} (${porId.get(id)!.especie}) tem parentesco humano com justificativa escrita`);
  }
  ok(naoHumanos.length <= 1, `Parentesco não-humano é exceção (${naoHumanos.length})`);
}
{
  // Texto de família não entrega segredo: nenhum trecho de segredo aparece.
  const vaza: string[] = [];
  for (const f of familias) {
    const texto = [f.tensao, ...f.membros.map(m => m.papel), ...(f.ausentes ?? []).map(a => a.destino)].join(' ').toLowerCase();
    for (const m of f.membros) {
      const seg = porId.get(m.npc)?.segredo?.conteudo.toLowerCase();
      if (!seg) continue;
      for (let i = 0; i + 35 <= seg.length; i += 12) if (texto.includes(seg.slice(i, i + 35))) { vaza.push(`${f.id}/${m.npc}`); break; }
    }
  }
  ok(vaza.length === 0, `Nenhum texto de família copia trecho de segredo (${vaza.join(', ') || 'limpo'})`);
}
ok(lacoEntre(C, 'ysolde', 'dama_valda') === 'mae' && lacoEntre(C, 'dama_valda', 'ysolde') === 'filha', 'Laço direto: Valda é mãe de Ysolde, Ysolde é filha de Valda');
ok(lacoEntre(C, 'morador_corveira_4', 'morador_acampamento_0') === 'avo', 'Dedução: a mãe da mãe é avó (Wyn Bico-Fino e Yara Bico-Fino)');
ok(lacoEntre(C, 'morador_corveira_4', 'morador_vila_terraco_3') === 'tia', 'Dedução: a irmã da mãe é tia');
ok(lacoEntre(C, 'morador_vila_terraco_3', 'morador_vila_terraco_6') === 'irma', 'Dedução: filhas da mesma mãe são irmãs');
ok(lacoEntre(C, 'morador_corveira_17', 'morador_mareu_17') === 'tia' && lacoEntre(C, 'morador_mareu_17', 'morador_corveira_17') === 'sobrinha', 'Dedução em três gerações: tia e sobrinha Meia-Orelha');
ok(lacoEntre(C, 'rengoku', 'shinjuro') === 'pai' && lacoEntre(C, 'shinjuro', 'rengoku') === 'filho', 'Gênero conta: Shinjuro é pai, Kyojuro é filho');
ok(saoParentes(C, 'torana', 'duna') && !saoParentes(C, 'torana', 'aldrica'), 'saoParentes distingue irmã de vizinha');

// ── 4. Luto ───────────────────────────────────────────────────────────────
{
  const c = nova('luto');
  processarFamiliasNpc(C, c); // cria o estado
  const tensaoIrma = c.npcState.torana.tensao;
  const tensaoSobrinha = c.npcState.morador_mercado_4.tensao;
  const fatosAntes = c.vivo!.fatos.length;
  c.npcState.duna.vivo = false;
  processarFamiliasNpc(C, c);
  ok(c.npcState.torana.tensao === Math.min(100, tensaoIrma + 20), `A irmã sente a morte (tensão ${tensaoIrma} → ${c.npcState.torana.tensao})`);
  ok(c.npcState.morador_mercado_4.tensao === Math.min(100, tensaoSobrinha + 20), 'A filha sente a morte da mãe (+20)');
  const luto = c.vivo!.fatos.slice(fatosAntes).find(f => f.tipo === 'luto_familia');
  ok(!!luto && luto.texto.includes('as da Bigorna') && luto.publico, `Fato público com o nome da família: "${luto?.texto}"`);
  ok(c.familiasNpc!.lutos.torana?.at(-1)?.morto === 'duna' && c.familiasNpc!.lutos.torana.at(-1)!.laco === 'irma', 'O luto fica registrado: Torana perdeu a irmã');
  const n = c.vivo!.fatos.length;
  processarFamiliasNpc(C, c);
  ok(c.vivo!.fatos.length === n, 'O mesmo morto não é pranteado duas vezes');
  const pacote = familiaParaNarrador(C, c, 'torana');
  ok(!!pacote?.luto && pacote.luto.includes('Duna') && pacote.parentes.some(p => p.includes('(morta)')), `O narrador sabe do luto: "${pacote?.luto}"`);

  // Morte pelo caminho real (velhice, via avançar mundo) também gera luto.
  const d = nova('luto-real');
  processarFamiliasNpc(C, d);
  d.npcState.morda.vivo = false; // como vidanpc faria
  d.calendario.dia += 1;
  avancarMundo(C, d);
  ok(d.familiasNpc!.pranteados.includes('morda') && (d.familiasNpc!.lutos.oda?.length ?? 0) > 0, 'Avançar o mundo prantea quem morreu no dia (Oda chora a tia)');
}

// ── 5. Save antigo não despeja luto velho ────────────────────────────────
{
  const c = nova('save-velho');
  c.npcState.duna.vivo = false;
  c.npcState.oda.vivo = false;
  const n = c.vivo!.fatos.length;
  processarFamiliasNpc(C, c);
  ok(c.vivo!.fatos.length === n && c.familiasNpc!.pranteados.includes('duna'), 'Quem já estava morto quando o sistema nasceu conta como pranteado, sem fato novo');
}

// ── 6. Herança de ofício ─────────────────────────────────────────────────
{
  const c = nova('heranca');
  processarFamiliasNpc(C, c);
  const aldrica = porId.get('aldrica')!, elza = porId.get('elza')!;
  ok(ocupacaoEfetiva(c, elza) === elza.ocupacao, `Antes: Elza é ${elza.ocupacao}`);
  c.npcState.aldrica.vivo = false;
  processarFamiliasNpc(C, c);
  ok(ocupacaoEfetiva(c, elza) === aldrica.ocupacao, `Morta Aldrica, Elza vira ${ocupacaoEfetiva(c, elza)}`);
  ok(c.vivo!.fatos.some(f => f.tipo === 'heranca_oficio' && f.atores.includes('elza')), 'A herança vira fato público');

  // Herdeira de armeira passa a contar como ferreira para a forja.
  const t = nova('heranca-forja');
  processarFamiliasNpc(C, t);
  t.npcState.morador_tessel_4.vivo = false;
  processarFamiliasNpc(C, t);
  const greta = porId.get('morador_tessel_3')!;
  ok(/armeir|ferreir/.test(ocupacaoEfetiva(t, greta)), `A filha mais velha de Nevin herda a bigorna: ${ocupacaoEfetiva(t, greta)}`);

  // Aposentadoria: a avó passa o posto em vida.
  const a = nova('aposentadoria');
  processarFamiliasNpc(C, a);
  a.npcState.ancia_pedravel.idade = 75;
  processarFamiliasNpc(C, a);
  const quilda = porId.get('morador_vila_pedravel_0')!;
  ok(a.familiasNpc!.aposentadas.ancia_pedravel !== undefined && ocupacaoEfetiva(a, porId.get('ancia_pedravel')!).includes('sem o posto'), 'Aos 75, Mora Quelha larga o posto');
  ok(ocupacaoEfetiva(a, quilda) === porId.get('ancia_pedravel')!.ocupacao, `A neta assume: ${ocupacaoEfetiva(a, quilda)}`);
}

// ── 7. O jogador e a família ─────────────────────────────────────────────
{
  const c = nova('propagar');
  const antes = c.npcState.elza.eixos.disposicao ?? 0;
  const primaAntes = c.npcState.morador_mercado_6.eixos.disposicao ?? 0;
  propagarParaFamilia(C, c, 'aldrica', 'disposicao', 10);
  ok((c.npcState.elza.eixos.disposicao ?? 0) - antes === 4, `Ajudar Aldrica sobe a disposição de Elza em 4 (35% de 10)`);
  ok((c.npcState.morador_mercado_6.eixos.disposicao ?? 0) === primaAntes, 'Quem não é da família não muda');
  propagarParaFamilia(C, c, 'morador_mercado_2', 'disposicao', -10);
  ok((c.npcState.morador_mercado_1.eixos.disposicao ?? 0) <= -3, 'Ofender a mãe azeda a filha');

  // Pelo turno real: conversar com Aldrica na taverna.
  let provado = false;
  for (let i = 0; i < 30 && !provado; i++) {
    const t = nova(`propagar-turno-${i}`);
    t.localAtual = 'taverna';
    const a0 = t.npcState.aldrica.eixos.disposicao ?? 0, e0 = t.npcState.elza.eixos.disposicao ?? 0;
    resolverIntencao(C, t, { tipo: 'verbo', verboId: 'conversar', alvoId: 'aldrica' });
    const da = (t.npcState.aldrica.eixos.disposicao ?? 0) - a0, de = (t.npcState.elza.eixos.disposicao ?? 0) - e0;
    if (da === 0) continue;
    ok(de === Math.round(da * 0.35), `Conversar com Aldrica (disposição ${da > 0 ? '+' : ''}${da}) chega a Elza (${de > 0 ? '+' : ''}${de})`);
    provado = true;
  }
  ok(provado, 'O efeito de relação de um verbo real chega à família');

  // Resgate concluído pelo jogador: a família agradece.
  const r = nova('resgate');
  processarFamiliasNpc(C, r);
  const d0 = r.npcState.torana.eixos.disposicao ?? 0;
  registrarFato(r, { tipo: 'missao_concluida', local: 'mercado', texto: 'Você trouxe Duna de volta.', atores: ['duna'], publico: true });
  processarFamiliasNpc(C, r);
  ok((r.npcState.torana.eixos.disposicao ?? 0) - d0 === 2, 'Resgatar Duna sobe a disposição da irmã em 2');
  const d1 = r.npcState.torana.eixos.disposicao ?? 0;
  processarFamiliasNpc(C, r);
  ok((r.npcState.torana.eixos.disposicao ?? 0) === d1, 'O mesmo resgate não conta duas vezes');
}

// ── 8. Narrador ───────────────────────────────────────────────────────────
{
  const c = nova('narrador');
  c.localAtual = 'mercado';
  const ctx = calcularContexto(C, c);
  const alguem = ctx.presentes.find(n => familiasDe(C, n.id).length);
  ok(!!alguem, `Há alguém com família presente no mercado (${alguem?.nome})`);
  const pacote = montarPacote(C, c, ctx, 'fato') as unknown as { presentes: { nome: string; familia?: { familia: string; parentes: string[]; tensao: string } }[] };
  const dela = pacote.presentes.find(p => p.nome === alguem!.nome)!;
  ok(!!dela.familia && dela.familia.parentes.length >= 1 && dela.familia.parentes.length <= 3, `O pacote traz a família de ${alguem!.nome}: ${dela.familia?.familia} — ${dela.familia?.parentes.join('; ')}`);
  const texto = JSON.stringify(pacote.presentes.map(p => p.familia));
  const segredos = ctx.presentes.map(n => n.segredo?.conteudo).filter((s): s is string => !!s);
  ok(segredos.every(s => !texto.includes(s.slice(0, 40))), 'Nenhum segredo entra pela família no pacote');
}

// ── 9. Uniões não juntam parentes ────────────────────────────────────────
ok(saoParentes(C, 'heska', 'serla') === false, 'Heska e Serla (amantes) não são parentes — podem se unir');
{
  const proximos = familias.flatMap(f => f.membros.map(m => m.npc)).filter(id => parentesDe(C, id).some(p => lacoProximo(p.laco)));
  ok(proximos.length >= 100, `${proximos.length} pessoas têm parente próximo (mãe, filha, irmã ou companheira)`);
}

// ── 10. Save round-trip ──────────────────────────────────────────────────
{
  const c = nova('familias-save');
  processarFamiliasNpc(C, c);
  c.npcState.duna.vivo = false;
  processarFamiliasNpc(C, c);
  const r = importar(exportar(c));
  ok(r.ok, 'Exportar e importar funciona com o estado das famílias');
  if (r.ok) ok(JSON.stringify(r.valor.familiasNpc) === JSON.stringify(c.familiasNpc), 'Luto, herança e pranteados voltam idênticos do save');
  ok(estadoFamiliasNpc(C, c) === c.familiasNpc, 'O estado é o mesmo objeto depois de criado');
}

console.log(`\nFamílias do elenco: OK (${familias.length} famílias, ${membros.length} pessoas).`);
