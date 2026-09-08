const assert = (v: unknown) => { if (!v) throw new Error('Invariante de casas falhou'); };
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
