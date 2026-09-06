import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { resolverEtapaInfancia, resgatarParente } from './familia';
import { todosNpcs } from './elenco';
import { calcularContexto, disponibilidadeVerbo } from './availability';
import { normalizarCampanha } from './migracao';
import { intervirNaGuerra, processarGuerrasDeFundo } from './guerra';

const eq = (a: unknown, b: unknown, msg: string) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg); };
const ok = (v: unknown, msg: string) => { if (!v) throw new Error(msg); console.log(`✓ ${msg}`); };
const nova = (seed: string, marca: 'tragedia' | 'genio' | 'indigno' | 'comum' = 'comum') => criarCampanha(C, {
  nome: 'Linhagem', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed,
  marcaInfancia: marca, reacaoInfancia: 'apoio',
});

{
  const a = nova('familia-determinista'), b = nova('familia-determinista');
  eq(a.familia, b.familia, 'mesma semente deveria montar a mesma família');
  ok(a.personagem.idade === 0 && a.familia?.eventoAtual?.id === 'nascimento', 'A campanha começa no nascimento');
  ok((a.npcsProcedurais?.length ?? 0) === a.familia?.membros.length, 'Cada familiar tem identidade persistente');
}

{
  const c = nova('vida-completa');
  let passos = 0;
  while (!c.familia!.prologoConcluido && passos++ < 5) {
    const id = c.familia!.eventoAtual!.opcoes[0].id;
    ok(resolverEtapaInfancia(C, c, id).ok, `Etapa da infância ${passos} produz consequência`);
  }
  ok(c.familia!.prologoConcluido && c.personagem.idade === 18, 'O prólogo chega à vida adulta aos 18 anos');
  ok(c.familia!.historia.length === 4, 'A história conserva todas as decisões da infância');
  const elenco = todosNpcs(C, c);
  ok(elenco.some(n => n.parentesco === 'pai'), 'Parentes adultos entram no mundo como NPCs');
  ok(elenco.filter(n => n.parentesco).every(n => (c.npcState[n.id].idade ?? n.idade) >= 18), 'Parentes menores ficam fora das interações adultas');
}

{
  const c = nova('tragedia-real', 'tragedia');
  resolverEtapaInfancia(C, c, 'crescer');
  ok(c.familia?.eventoAtual?.id === 'perda', 'A marca de tragédia vira acontecimento real');
  resolverEtapaInfancia(C, c, 'proteger_irmaos');
  ok(c.familia!.membros.filter(m => ['pai', 'mae'].includes(m.parentesco)).every(m => m.condicao === 'morto'), 'A perda altera o estado vital dos pais');
}

{
  const c = nova('cativeiro-resgate');
  const pai = c.familia!.membros[0];
  pai.condicao = 'cativo';
  c.npcsProcedurais!.find(n => n.id === pai.id)!.localBase = 'acampamento';
  c.localAtual = 'acampamento'; c.personagem.dinheiro = 50;
  const r = resgatarParente(c, pai.id, 'resgate');
  ok(r.ok && String(pai.condicao) === 'livre' && c.personagem.dinheiro === 0, 'Resgate pago liberta a pessoa e consome recursos');
  ok(!resgatarParente(c, pai.id, 'resgate').ok, 'O mesmo resgate não é cobrado duas vezes');
}

{
  const c = nova('limite-familiar');
  while (!c.familia!.prologoConcluido) resolverEtapaInfancia(C, c, c.familia!.eventoAtual!.opcoes[0].id);
  c.localAtual = 'taverna'; c.calendario.periodoIndex = 1;
  const pai = todosNpcs(C, c).find(n => n.parentesco === 'pai')!;
  const flertar = C.verbos.find(v => v.id === 'flertar')!;
  ok(!disponibilidadeVerbo(flertar, calcularContexto(C, c), c, pai).disponivel, 'Parentesco bloqueia ações românticas na própria engine');
}

{
  const antigo = nova('save-prologo');
  resolverEtapaInfancia(C, antigo, 'crescer');
  const etapa = antigo.familia!.eventoAtual!.id;
  const normalizado = normalizarCampanha(C, JSON.parse(JSON.stringify(antigo)));
  ok(normalizado.familia!.eventoAtual!.id === etapa, 'Save no meio da infância retoma a mesma etapa');
  eq(normalizarCampanha(C, normalizado).familia, normalizado.familia, 'migração familiar deve ser idempotente');
  console.log('✓ Migração familiar é idempotente');
}

console.log('Testes de família e infância passaram.');

{
  const c = nova('guerra-persistente');
  c.localAtual = 'praca';
  c.mundo!.guerraAtiva = { a: 'guarda', b: 'ladroes', local: 'praca', diasRestantes: 1, impulsoA: 0, impulsoB: 0 };
  ok(intervirNaGuerra(C, c, 'guarda').ok, 'O protagonista pode participar somente na frente real');
  const vida = c.personagem.recursos.vida;
  ok(vida < c.personagem.recursosMax.vida, 'Intervir na guerra tem custo físico imediato');
  processarGuerrasDeFundo(C, c);
  ok(!c.mundo!.guerraAtiva, 'A guerra termina e sai do estado ativo');
  ok(c.reputacao.guarda === 6, 'Reputação é concedida pela participação registrada');
  ok((c.mundo!.faccoes?.guarda.baixas ?? 0) > 0, 'A guerra consome recursos e acumula baixas da facção');
}
