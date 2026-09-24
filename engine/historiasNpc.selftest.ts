// ARCANUM · Histórias e segredos do elenco (engine/segredos.ts,
// content/vaelhorn/historias-*.ts, content/vaelhorn/segredos.ts).
//
// Sobre o elenco inteiro: todo NPC tem segredo; as histórias existem para
// quem luta, ensina, duela ou aparece em missão, e para mais de 150 no total;
// cada campo é texto de verdade, não repete o de outra pessoa, não cita
// nome que não existe e não entrega segredo de ninguém. Na engine: descobrir
// um segredo com consequência dispara o efeito declarado, uma vez só; o
// pacote do narrador leva a história e não leva segredo não descoberto.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { revelarSegredo, talvezRevelarSegredo, CONFIANCA_PARA_SEGREDO } from './segredos';
import { montarPacote, INSTRUCAO_SISTEMA } from './llm';
import { calcularContexto } from './availability';
import { disponibilidadeVerbo } from './availability';
import { exportar, importar } from './persistencia';
import { perigoEfetivoDaRota, localConhecido } from './viagem';
import type { Campaign, NPC } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const nova = (seed = 'historias'): Campaign => {
  const c = criarCampanha(C, {
    nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};

const elenco = C.npcs;
const porId = new Map<string, NPC>(elenco.map(n => [n.id, n]));

// ── 1. Segredos ───────────────────────────────────────────────────────────
{
  const sem = elenco.filter(n => !n.segredo?.conteudo?.trim());
  ok(sem.length === 0, `Todo NPC tem segredo (${elenco.length} de ${elenco.length}; faltando: ${sem.map(n => n.id).join(', ') || 'nenhum'})`);
  const curtos = elenco.filter(n => (n.segredo!.conteudo.length < 40) || n.segredo!.comoDescobrir.length < 15);
  ok(curtos.length === 0, `Todo segredo é escrito de verdade: 40+ caracteres e um caminho para descobrir (${curtos.map(n => n.id).join(', ') || 'ok'})`);
  const conteudos = elenco.map(n => n.segredo!.conteudo);
  ok(new Set(conteudos).size === conteudos.length, 'Nenhum segredo repete texto de outro');
  const comConsequencia = elenco.filter(n => n.segredo?.consequencia && ((n.segredo.consequencia.efeitos?.length ?? 0) > 0 || n.segredo.consequencia.missao));
  ok(comConsequencia.length >= 20, `${comConsequencia.length} segredos destravam algo concreto (mínimo 20)`);
  // Toda consequência aponta para gente e item que existem.
  const itens = new Set(C.itens.map(i => i.id));
  const faccoes = new Set(C.faccoes.map(f => f.id));
  for (const n of comConsequencia) {
    for (const ef of n.segredo!.consequencia!.efeitos ?? []) {
      if (ef.tipo === 'relacao') ok(porId.has(ef.npc), `${n.id}: a consequência mexe com alguém que existe (${ef.npc})`);
      if (ef.tipo === 'item') ok(itens.has(ef.item), `${n.id}: a consequência entrega um item do catálogo (${ef.item})`);
      if (ef.tipo === 'reputacao') ok(faccoes.has(ef.faccao), `${n.id}: a consequência mexe com uma facção que existe (${ef.faccao})`);
    }
    ok(n.segredo!.consequencia!.texto.length >= 40, `${n.id}: a consequência diz ao jogador o que mudou`);
  }
}

// ── 2. Histórias ──────────────────────────────────────────────────────────
const historias = elenco.filter(n => n.historia);
ok(historias.length >= 150, `${historias.length} NPCs com história escrita (mínimo 150)`);
{
  // Missões, desafios, verbos, mestres e o resto do bundle que não é o
  // próprio elenco: quem é citado ali por id aparece em alguma história do jogo.
  const fontes = JSON.stringify({ ...C, npcs: [], familias: [] });
  const prioritarios = elenco.filter(n => n.combatente || n.ensinaMestre || n.duelo || new RegExp(`['"]${n.id}['"]`).test(fontes));
  const faltando = prioritarios.filter(n => !n.historia);
  ok(faltando.length === 0, `Quem luta, ensina, duela ou aparece em missão tem história (${prioritarios.length}; faltando: ${faltando.map(n => n.id).join(', ') || 'nenhum'})`);
}
{
  const GENERICO = /inf[aâ]ncia dif[ií]cil|passado sombrio|vida dif[ií]cil|passado misterioso|muito sofrimento/i;
  const vistos = new Map<string, string>();
  const problemas: string[] = [];
  for (const n of historias) {
    const h = n.historia!;
    for (const campo of ['origem', 'ferida', 'desejo'] as const) {
      const t = h[campo];
      if (!t || t.length < 40) problemas.push(`${n.id}.${campo} curto (${t?.length ?? 0})`);
    }
    if (h.medo !== undefined && h.medo.length < 15) problemas.push(`${n.id}.medo curto (${h.medo.length})`);
    for (const t of [h.origem, h.ferida, h.desejo, h.medo].filter((x): x is string => !!x)) {
      if (GENERICO.test(t)) problemas.push(`${n.id}: texto genérico — "${t}"`);
      const dono = vistos.get(t);
      if (dono) problemas.push(`${n.id} repete texto de ${dono}`);
      vistos.set(t, n.id);
    }
  }
  ok(problemas.length === 0, `Histórias: 3 campos de 40+ caracteres, sem genérico e sem repetição (${problemas.slice(0, 6).join('; ') || 'ok'})`);
}
{
  // Nenhuma história (nem texto de família) copia trecho de segredo de NINGUÉM.
  const segredos = elenco.map(n => ({ id: n.id, s: n.segredo!.conteudo.toLowerCase() }));
  const vaza: string[] = [];
  for (const n of historias) {
    const texto = Object.values(n.historia!).join(' ').toLowerCase();
    for (const { id, s } of segredos) {
      for (let i = 0; i + 35 <= s.length; i += 10) if (texto.includes(s.slice(i, i + 35))) { vaza.push(`${n.id}→${id}`); break; }
    }
  }
  ok(vaza.length === 0, `Nenhuma história copia trecho de segredo (${vaza.join(', ') || 'limpo'})`);
}
{
  // Nome próprio no meio da frase tem de existir: gente do elenco, ausente de
  // família, lugar, região, facção, criatura ou termo do mundo.
  const conhecidos = new Set<string>();
  // Hífen fica: "Meia-Orelha" é um nome só.
  const junta = (t?: string) => { for (const w of (t ?? '').split(/[\s,.'"()—]+/)) if (w) conhecidos.add(w); };
  elenco.forEach(n => junta(n.nome));
  C.locais.forEach(l => { junta(l.nome); junta(l.regiao); });
  C.faccoes.forEach(f => junta(f.nome));
  C.criaturas.forEach(c => junta(c.nome));
  (C.familias ?? []).forEach(f => { junta(f.nome); (f.ausentes ?? []).forEach(a => junta(a.nome)); });
  junta('Corrente Leva Mir Halvet Vaelhorn Hashira Lua Luas Superior Superiores Inferior Chamas Água Trovão Flor Pedra Sol Fera Kamado Kocho Rengoku Ubuyashiki Shinazugawa Idrin Além-Sal Sexto Verrão Varn Ost Quelha Bico-Fino Meia-Orelha Olho-Vivo Pé-de-Ferro Boca-Seca Mão-Curta Sete-Dedos Calada Braza Junco Quilm Arne Bigorna Cava-Fundo Gordo Torto Velha Magra Norte Ponte Surdo Manco');
  const estranhos = new Map<string, string>();
  for (const n of historias) {
    for (const t of Object.values(n.historia!)) {
      // Palavras com maiúscula que não abrem frase.
      const re = /(?<![.!?:]\s)(?<!^)(?<=\s)([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wáéíóúâêôãõçà-]+)/g;
      for (const m of t.matchAll(re)) if (!conhecidos.has(m[1])) estranhos.set(m[1], n.id);
    }
  }
  ok(estranhos.size === 0, `Nenhuma história cita nome que não existe (${[...estranhos].map(([w, id]) => `${w} em ${id}`).join('; ') || 'todos conhecidos'})`);
}

// ── 3. Engine: descobrir muda alguma coisa ───────────────────────────────
{
  // Efeitos: item + medo de outra pessoa (Ivo Quelha e o recibo de Brila).
  const c = nova('segredo-ivo');
  const medo0 = c.npcState.sargenta_brila.eixos.medo ?? 0;
  ok(!c.personagem.inventario.carta_lacrada, 'Antes: sem o recibo');
  ok(revelarSegredo(C, c, 'rapaz_da_leva'), 'Revelar o segredo de Ivo Quelha é novidade');
  ok(c.segredosRevelados.includes('rapaz_da_leva') && c.flags['segredo.rapaz_da_leva'] === true, 'O segredo entra na lista e na flag');
  ok(c.personagem.inventario.carta_lacrada === 1, 'A consequência entrega o recibo (carta lacrada)');
  ok((c.npcState.sargenta_brila.eixos.medo ?? 0) === medo0 + 4, `Brila Ost passa a ter medo de você (${medo0} → ${c.npcState.sargenta_brila.eixos.medo})`);
  ok(c.cronica.at(-1)?.texto.includes('Brila'), 'O jogador lê o que mudou no feed');
  ok(!revelarSegredo(C, c, 'rapaz_da_leva') && c.personagem.inventario.carta_lacrada === 1, 'Revelar de novo não entrega outro recibo');
  const importado = importar(exportar(c));
  ok(importado.ok && importado.valor.flags['segredo.consequencia.rapaz_da_leva'] === true, 'O save lembra que a consequência já aconteceu');

  // Missão viva: a farinha de Pedravel.
  const m = nova('segredo-rhea');
  const antes = m.vivo!.missoes.length;
  revelarSegredo(C, m, 'morador_vila_pedravel_7');
  const nova_ = m.vivo!.missoes.slice(antes).find(q => q.tipo === 'tratar');
  ok(!!nova_ && nova_.ator === 'morador_vila_pedravel_7' && nova_.conhecida, `Descobrir a farinha de pedra abre uma missão de tratar em ${nova_?.local}`);

  // Rota menos perigosa: a hora do Passo do Lobo.
  const f = nova('segredo-sela');
  const rota = C.locais.find(l => l.id === 'passo_lobo')!.rotas[0];
  const perigoAntes = perigoEfetivoDaRota(C, f, 'passo_lobo', rota.destino, rota.perigo);
  revelarSegredo(C, f, 'morador_vintra_8');
  const perigoDepois = perigoEfetivoDaRota(C, f, 'passo_lobo', rota.destino, rota.perigo);
  ok(perigoDepois < perigoAntes, `Saber a hora do Passo do Lobo baixa o perigo da rota (${perigoAntes.toFixed(1)} → ${perigoDepois.toFixed(1)})`);

  // Lugar oculto que aparece: a Toca do Juncal.
  const t = nova('segredo-orla');
  const toca = C.locais.find(l => l.id === 'toca_juncal')!;
  ok(!localConhecido(t, toca), 'A Toca do Juncal começa escondida');
  revelarSegredo(C, t, 'morador_vila_juncal_0');
  ok(localConhecido(t, toca), 'O caminho de Orla descobre a Toca do Juncal no mapa');

  // Segredo antigo que ganhou consequência: a ponte de Bael.
  const b = nova('segredo-bael');
  const conf0 = b.npcState.ruvela.eixos.confianca ?? 0;
  revelarSegredo(C, b, 'sargenta_bael');
  ok((b.npcState.ruvela.eixos.confianca ?? 0) === conf0 + 4, 'Saber da ponte faz Ruvela confiar em você (+4)');
  // A família de quem muda de ideia sobre você também sente, mais fraco.
  ok((b.npcState.nadja.eixos.confianca ?? 0) >= 1, 'E a mãe de Ruvela, Nadja, também (propagação da Fase 2)');

  // Chantagem passa a valer para quem tinha segredo novo.
  const ch = nova('segredo-chantagem');
  const dorn = porId.get('morador_mercado_8')!;
  ch.localAtual = dorn.localBase;
  const verbo = C.verbos.find(v => v.id === 'chantagear')!;
  // Sozinho com ela: a chantagem não aceita testemunha (availability.ts).
  const aSos = { ...calcularContexto(C, ch), presentes: [dorn], testemunhas: 1 };
  const antesDe = disponibilidadeVerbo(verbo, aSos, ch, dorn);
  ok(!antesDe.disponivel && antesDe.motivo === 'você não sabe nada que sirva', `Sem o segredo, chantagear Dorn é recusado ("${antesDe.motivo}")`);
  revelarSegredo(C, ch, 'morador_mercado_8');
  ok(disponibilidadeVerbo(verbo, aSos, ch, dorn).disponivel, 'Com o segredo de Dorn, chantagear fica disponível contra ela');
}
{
  // A regra de descoberta que saiu da interface.
  const c = nova('descoberta');
  const torana = porId.get('torana')!;
  ok(!talvezRevelarSegredo(C, c, torana), 'Sem confiança nem vigia, o segredo não sai');
  c.npcState.torana.eixos.confianca = CONFIANCA_PARA_SEGREDO;
  ok(talvezRevelarSegredo(C, c, torana), `Com confiança ${CONFIANCA_PARA_SEGREDO}, Torana conta`);
  const d = nova('descoberta-vigia');
  d.flags['vigiou.duna'] = true;
  ok(talvezRevelarSegredo(C, d, porId.get('duna')), 'Vigiar Duna também revela');
}

// ── 4. Narrador ───────────────────────────────────────────────────────────
{
  const c = nova('narrador-historia');
  c.localAtual = 'mercado';
  const ctx = calcularContexto(C, c);
  const alguem = ctx.presentes.find(n => n.historia && n.segredo);
  ok(!!alguem, `Há alguém com história presente no mercado (${alguem?.nome})`);
  type P = { presentes: { nome: string; historia?: { origem: string }; segredoQueVoceSabe?: string }[] };
  const antes = montarPacote(C, c, ctx, 'fato') as unknown as P;
  const dela = antes.presentes.find(p => p.nome === alguem!.nome)!;
  ok(dela.historia?.origem === alguem!.historia!.origem, 'O pacote leva a história de quem está em cena');
  ok(!JSON.stringify(antes).includes(alguem!.segredo!.conteudo), 'O segredo não entra no pacote antes de descoberto');
  revelarSegredo(C, c, alguem!.id);
  const depois = montarPacote(C, c, calcularContexto(C, c), 'fato') as unknown as P;
  ok(depois.presentes.find(p => p.nome === alguem!.nome)!.segredoQueVoceSabe === alguem!.segredo!.conteudo, 'Depois de descoberto, o narrador pode usar');
  ok(INSTRUCAO_SISTEMA.includes('2b) Um presente pode trazer "historia"') && INSTRUCAO_SISTEMA.includes('aluda, nunca recite'), 'A regra do sistema manda aludir e não revelar');
}

console.log(`\nHistórias e segredos: OK (${historias.length} histórias, ${elenco.length} segredos).`);
