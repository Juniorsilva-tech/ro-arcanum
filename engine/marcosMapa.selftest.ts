// ARCANUM · O mapa dos cartógrafos no jogo (content/vaelhorn/marcosMapa.ts).
// O que estes testes seguram:
// - todo símbolo e nome pintado aponta para um lugar que existe, na região dele;
// - todo lugar do continente tem posição no desenho, inclusive os dois novos;
// - o narrador recebe o nome antigo e as lendas de perto, e não no meio da luta.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { MARCOS_PINTADOS, nomesAntigosDe, lendasPerto } from '../content/vaelhorn/marcosMapa';
import { COORDENADAS_LOCAIS } from '../content/vaelhorn/mapa';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { calcularContexto } from './availability';
import { montarPacote, montarMensagemNarracao } from './llm';
import type { ResultadoTurno } from './turn';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const ruins = MARCOS_PINTADOS.filter((m) => {
  const l = C.locais.find((x) => x.id === m.localId);
  return !l || l.regiao !== m.regiao || m.x < 0 || m.x > 100 || m.y < 0 || m.y > 100;
});
ok(ruins.length === 0, `${MARCOS_PINTADOS.length} marcos pintados apontam para lugares reais (${ruins.map((m) => m.id).join(', ') || 'todos ok'})`);
ok(new Set(MARCOS_PINTADOS.map((m) => m.id)).size === MARCOS_PINTADOS.length, 'ids dos marcos não se repetem');
const semPosicao = C.locais.filter((l) => !COORDENADAS_LOCAIS[l.id]);
ok(semPosicao.length === 0, `todo lugar tem posição no desenho (${semPosicao.map((l) => l.id).join(', ') || 'todos'})`);
ok(['forrarborg', 'ponta_areia'].every((id) => C.locais.find((l) => l.id === id)?.rotas.length), 'Forrarborg Aelha e Ponta da Areia existem e têm estrada');
ok(nomesAntigosDe('tessel')[0]?.nome === 'Tesselgarde', 'Tessel é Tesselgarde no mapa velho');
ok(lendasPerto('vintra', 'Bosque de Vintra').some((m) => m.id === 'l_dragao_vintra'), 'em Vintra se conta do dragão do bosque');

const c = criarCampanha(C, { nome: 'T', atributos: atributosBase(), classeId: C.classes[0].id, origemId: 'divida', seedString: 'mapa', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
if (c.familia) c.familia.prologoConcluido = true;
c.localAtual = 'tessel';
const ctx = calcularContexto(C, c);
const pacote = montarPacote(C, c, ctx, 'Você olha a muralha.') as { local: { mapaVelho?: { nomesAntigos?: string[] } } };
ok(pacote.local.mapaVelho?.nomesAntigos?.includes('Tesselgarde'), 'o narrador recebe o nome antigo do lugar');
const luta = montarMensagemNarracao(C, c, ctx, { fato: 'A luta terminou.', batidasCombate: ['x acerta y'], custoPeriodos: 0, efeitosAplicados: [] } as ResultadoTurno);
ok(!luta.includes('mapaVelho'), 'no meio da luta, nada de lenda do mapa');
console.log('\nMapa dos cartógrafos: OK.');
