// ARCANUM · Bestiário, história dos lugares e das casas (sessão 55).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { locaisVaelhorn } from '../content/vaelhorn/locations';
import { integrarContinente } from '../content/vaelhorn/continente';
import { povoarContinente } from '../content/vaelhorn/povoamento';
import { faccoesVaelhorn } from '../content/vaelhorn/book';
import { HISTORIAS_CRIATURAS } from '../content/vaelhorn/bestiario-historias';
import { HISTORIAS_LOCAIS } from '../content/vaelhorn/historias-locais';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { montarPacote } from './llm';
import { calcularContexto } from './availability';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
// Feras de Tsukimichi que moram no mapa de Vaelhorn: fora desta passada.
const REGIOES_TSUKIMICHI = new Set(['Grande Terra Desolada', 'Tsige']);
const deTsukimichi = new Set(Object.entries(C.encontrosPorRegiao ?? {}).filter(([r]) => REGIOES_TSUKIMICHI.has(r)).flatMap(([, p]) => p));

// ── 1. Bestiário ──────────────────────────────────────────────────────────
{
  const doVale = C.criaturas.filter(c => !deTsukimichi.has(c.id));
  const sem = doVale.filter(c => !c.historia || !c.sinais);
  ok(sem.length === 0, `Todas as ${doVale.length} criaturas do vale têm história e sinais (${sem.map(c => c.id).join(', ') || 'nenhuma faltando'})`);
  ok(Object.keys(HISTORIAS_CRIATURAS).every(id => C.criaturas.some(c => c.id === id)), 'Nenhuma história de criatura que não existe');
  const textos = doVale.map(c => `${c.historia} ${c.sinais}`).join(' ');
  ok(!EMOJI.test(textos) && !/Wasteland|identidade canônica/.test(textos), 'Sem emoji, sem "Wasteland", sem texto técnico');
  ok(doVale.every(c => (c.historia?.length ?? 0) >= 60), 'Cada história tem pelo menos uma frase de verdade');
}

// ── 2. Lugares ────────────────────────────────────────────────────────────
{
  const sem = C.locais.filter(l => !l.historia?.length);
  ok(sem.length === 0, `Todos os ${C.locais.length} lugares têm história (${sem.map(l => l.id).join(', ') || 'nenhum faltando'})`);
  const descricoes = C.locais.map(l => l.descricaoBase).join(' ');
  ok(!/senhor de Halvet|Os pescadores|os mineiros|Cristo/.test(descricoes), 'Descrições sem "senhor de Halvet", "pescadores", "mineiros" nem "Cristo"');
  // O povoamento sorteia o segredo dos moradores a partir de Local.historia:
  // a história nova entra depois, e ninguém muda de nome nem de ofício.
  const antes = povoarContinente(integrarContinente(locaisVaelhorn), faccoesVaelhorn);
  const agora = C.npcs.filter(n => n.id.startsWith('morador_'));
  const igual = antes.every(a => { const b = agora.find(n => n.id === a.id); return b && b.nome === a.nome && b.ocupacao === a.ocupacao && b.idade === a.idade && b.localBase === a.localBase; });
  ok(antes.length === agora.length && igual, `Os ${antes.length} moradores são os mesmos de antes (nome, ofício, idade, lugar)`);
  const linhasNovas = Object.values(HISTORIAS_LOCAIS).flat();
  ok(!agora.some(n => linhasNovas.some(l => n.segredo?.conteudo.includes(l.slice(0, 40)))), 'Nenhum segredo de morador foi sorteado a partir das linhas novas');
  const c = criarCampanha(C, { nome: 'T', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: 'lore', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  c.localAtual = 'taverna';
  const pacote = JSON.stringify(montarPacote(C, c, calcularContexto(C, c), 'fato'));
  ok(pacote.includes('Rês Enforcada tem o nome de uma vaca'), 'Na taverna, onde o jogo começa, o narrador recebe a história do lugar');
}

// ── 3. Casas ──────────────────────────────────────────────────────────────
{
  ok((C.casas ?? []).every(h => (h.historia?.length ?? 0) >= 3), 'As quatro casas têm história (três parágrafos ou mais)');
  const c = criarCampanha(C, { nome: 'T', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: 'casas', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  c.localAtual = 'tessel';
  const pacote = JSON.stringify(montarPacote(C, c, calcularContexto(C, c), 'fato'));
  ok(pacote.includes('Idrun Varn segurou a brecha'), 'Em Tessel, o narrador recebe a história da casa');
}

console.log('\nBestiário, lugares e casas: OK.');
