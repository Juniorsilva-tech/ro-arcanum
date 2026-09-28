import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { resolverEtapaInfancia, resgatarParente } from './familia';
import { todosNpcs } from './elenco';
import { calcularContexto, disponibilidadeVerbo } from './availability';
import { normalizarCampanha } from './migracao';
import { intervirNaGuerra, processarGuerrasDeFundo } from './guerra';
import { montarPacote } from './llm';

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

{
  const c = nova('treinamento-mestre');
  resolverEtapaInfancia(C, c, 'crescer');
  c.familia!.eventoAtual = {
    id: 'talento',
    idade: 10,
    titulo: 'Algo despertou cedo',
    descricao: 'Um mestre percebe talento incomum em você.',
    opcoes: [
      { id: 'treinar', rotulo: 'Aceitar o treinamento do mestre', descricao: 'Treina com o mestre.' },
      { id: 'dividir', rotulo: 'Dividir a oportunidade', descricao: 'Divide com o irmão.' },
      { id: 'recusar', rotulo: 'Recusar', descricao: 'Recusa.' },
    ],
  };
  const prestigioAntes = c.familia!.prestigio;
  const res = resolverEtapaInfancia(C, c, 'treinar');
  ok(res.ok, 'Treinar com o mestre resolve com sucesso');
  ok(c.flags['discipulo_de_mestre'] === true, 'Concede a flag discipulo_de_mestre');
  ok(c.personagem.alcunhas.includes('Discípulo Dedicado'), 'Concede a alcunha Discípulo Dedicado');
  ok(c.personagem.artesConhecidas.length > 0, 'Concede uma Arte de Mestre ao discípulo');
  ok(
    (c.personagem.inventario['pedra_de_amolar'] ?? 0) > 0 ||
    (c.personagem.inventario['luvas_de_couro'] ?? 0) > 0,
    'Herda item de treino no inventário'
  );
  ok(c.familia!.prestigio === prestigioAntes + 3, 'Ganha +3 de prestígio familiar pelo treino com mestre');
  ok(
    c.npcState['familia_pai']?.memoria.some(m => m.resumo.includes('discípulo')),
    'Pais registram memória viva do treino com o mestre'
  );
}

{
  // Teste de infância com marca indigno (6 anos)
  const c = nova('indigno-infancia', 'indigno');
  resolverEtapaInfancia(C, c, 'crescer');
  ok(c.familia?.eventoAtual?.id === 'indigno_provacao', 'Marca indigno dispara provação aos 6 anos');
  const r = resolverEtapaInfancia(C, c, 'provar_no_trabalho');
  ok(r.ok, 'Resolução de provar no trabalho é bem-sucedida');
}

{
  // Teste de variedade de eventos aos 10 anos
  const c = nova('eventos-dez-anos');
  resolverEtapaInfancia(C, c, 'crescer');
  
  // Incêndio na forja
  c.familia!.eventoAtual = {
    id: 'incendio_forja', idade: 10, titulo: 'O Fogo na Rua da Ferraria', descricao: 'Chamas na forja',
    opcoes: [
      { id: 'salvar_ferreiro', rotulo: 'Salvar o ferreiro', descricao: 'Resgata o ferreiro' },
      { id: 'linha_de_baldes', rotulo: 'Linha de baldes', descricao: 'Joga água' },
      { id: 'arrombar_deposito', rotulo: 'Arrombar depósito', descricao: 'Salva peças' },
    ],
  };
  ok(resolverEtapaInfancia(C, c, 'salvar_ferreiro').ok, 'Incêndio na forja resolve e concede pedra de amolar');
  ok((c.personagem.inventario['pedra_de_amolar'] ?? 0) > 0, 'Recebeu pedra de amolar');

  // Sombra na mata (Passo Leve)
  c.familia!.eventoAtual = {
    id: 'sombra_na_mata', idade: 10, titulo: 'A Coisa Que Não Tinha Sombra', descricao: 'Besta na orla',
    opcoes: [
      { id: 'sustentar_respiracao', rotulo: 'Sustentar respiração', descricao: 'Fica quieto' },
      { id: 'proteger_amigo', rotulo: 'Proteger amigo', descricao: 'Fica na frente' },
      { id: 'estudar_padroes', rotulo: 'Estudar padrões', descricao: 'Grava movimentos' },
    ],
  };
  ok(resolverEtapaInfancia(C, c, 'sustentar_respiracao').ok, 'Sombra na mata resolve');
  ok(c.personagem.artesConhecidas.includes('passo_leve'), 'Aprendeu passo_leve');

  // Batismo de sangue na estrada (14 anos)
  c.familia!.eventoAtual = {
    id: 'emboscada_estrada', idade: 14, titulo: 'O Batismo de Sangue', descricao: 'Salteadores',
    opcoes: [
      { id: 'lutar_com_furia', rotulo: 'Lutar com fúria', descricao: 'Defende a lâmina' },
      { id: 'manobrar_fuga', rotulo: 'Manobrar fuga', descricao: 'Arranca a carroça' },
      { id: 'emboscar_salteadores', rotulo: 'Emboscar', descricao: 'Cerca bandidos' },
    ],
  };
  ok(resolverEtapaInfancia(C, c, 'lutar_com_furia').ok, 'Emboscada na estrada resolve');
  ok(c.personagem.alcunhas.includes('Batizado em Sangue'), 'Ganha alcunha Batizado em Sangue');
  ok((c.personagem.inventario['espada_curta'] ?? 0) > 0, 'Recebeu espada curta');
}

{
  const c = nova('origem-contexto');
  while (!c.familia!.prologoConcluido) resolverEtapaInfancia(C, c, c.familia!.eventoAtual!.opcoes[0].id);
  const pacote = montarPacote(C, c, calcularContexto(C, c), 'fato');
  ok(pacote.origemEFamilia !== undefined, 'origemEFamilia é injetado no pacote do narrador');
  ok(pacote.origemEFamilia!.membros.length >= 2, 'origemEFamilia lista os membros familiares');
  ok(pacote.origemEFamilia!.marcasDaInfancia.length > 0, 'origemEFamilia passa as marcas da infância ao narrador');
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
