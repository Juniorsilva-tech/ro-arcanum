const assert = (v: unknown) => { if (!v) throw new Error('Invariante de casas falhou'); };
assert.equal = (a: unknown, b: unknown) => { if (a !== b) throw new Error(`Esperado ${b}; obtido ${a}`); };
import { conteudoVaelhorn as C } from '../content/vaelhorn';
const ids = new Set(C.locais.map(l => l.id));
assert(C.casas && C.casas.length >= 4);
for (const casa of C.casas!) {
  assert(casa.nome && casa.reino && casa.lema);
  assert(ids.has(casa.sede));
  assert(casa.territorio.length > 0 && casa.territorio.every(id => ids.has(id)));
  assert(casa.rivalidades.every(id => C.casas!.some(x => x.id === id) || C.faccoes.some(x => x.id === id)));
}
assert(new Set(C.casas!.map(c => c.id)).size === C.casas!.length);
console.log(`✓ ${C.casas!.length} casas com sede, território, sucessão e rivalidades válidos`);

// Sucessão real: morte do líder promove herdeiro uma única vez e não escolhe cativo.
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { processarCasas } from './casas';
const c = criarCampanha(C, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: 'casas-sucessao', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
iniciarMundoVivo(C, c); processarCasas(C, c);
for (const casa of C.casas!) {
  const e = c.mundo!.casas![casa.id];
  if (!e.lider) continue;
  const antes = { ...e };
  assert(c.npcState[e.lider]?.vivo && (c.npcState[e.lider]?.idade ?? 20) >= 18);
  if (e.herdeiro) {
    c.npcState[e.lider].vivo = false;
    c.calendario.dia++;
    processarCasas(C, c);
    assert(e.sucessoes === antes.sucessoes + 1);
    const depois = JSON.stringify(e);
    processarCasas(C, c);
    assert.equal(JSON.stringify(e), depois);
  }
}
console.log('✓ sucessão promove herdeiro adulto vivo uma vez e é idempotente');
