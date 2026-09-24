// ARCANUM · O que estava solto e foi ligado (sessão 54): trabalhos do lugar,
// treino com mestre, contratos de monstro, verbo concedido por item, prosa
// dos onis e as peças lendárias com história e dono.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { itensVaelhorn } from '../content/vaelhorn/items';
import { LENDAS_ITENS, GUARDIOES_LENDARIOS, RELIQUIAS_DAS_CASAS } from '../content/vaelhorn/lendas';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { executarAcaoMundo } from './acoesMundo';
import { trabalhosAqui, TRABALHOS_ESPECIALIZADOS, TETO_PERICIA_TRABALHO } from './trabalhosEspecializados';
import { treinosAqui, podeTreinarImersivo, DIAS_ENTRE_TREINOS, TETO_PERICIA_TREINO } from './treinamentoImersivo';
import { listarContratos, inicializarQuadroContratos, CONTRATOS_INICIAIS_VAELHORN } from './contratosMonstros';
import { disponibilidadeVerbo, calcularContexto } from './availability';
import { processarCasas, mudarReputacaoCasa } from './casas';
import { exportar, importar } from './persistencia';
import { montarPacote } from './llm';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string): Campaign => {
  const c = criarCampanha(C, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(C, c);
  return c;
};
const locais = new Set(C.locais.map(l => l.id));

// ── 1. Trabalhos do lugar ─────────────────────────────────────────────────
{
  for (const [id, t] of Object.entries(TRABALHOS_ESPECIALIZADOS)) ok(t.locais.every(l => locais.has(l)), `${t.nome}: lugares existem (${t.locais.join(', ')})`);
  const c = nova('trabalho');
  c.localAtual = 'taverna';
  ok(!trabalhosAqui(c).includes('extracao_fenda_corveira'), 'Na taverna não há turno de galeria');
  ok(!executarAcaoMundo(C, c, { tipo: 'trabalho_especializado', trabalhoId: 'extracao_fenda_corveira' }).ok, 'E a ação recusa');
  c.localAtual = 'corveira';
  const din = c.personagem.dinheiro, tes = c.vivo!.cidades.corveira.tesouro;
  const r = executarAcaoMundo(C, c, { tipo: 'trabalho_especializado', trabalhoId: 'extracao_fenda_corveira' });
  ok(r.ok && c.personagem.dinheiro === din + 24 && c.vivo!.cidades.corveira.tesouro === tes - 24 && c.personagem.inventario.minerio_de_ferro === 2, 'Em Corveira paga 24 do tesouro da cidade e dá 2 minérios');
  ok(!executarAcaoMundo(C, c, { tipo: 'trabalho_especializado', trabalhoId: 'extracao_fenda_corveira' }).ok, 'Uma vez por dia');
  for (let d = 0; d < 8; d++) { c.calendario.dia += 1; executarAcaoMundo(C, c, { tipo: 'trabalho_especializado', trabalhoId: 'extracao_fenda_corveira' }); }
  ok((c.personagem.pericias.atletismo ?? 0) <= Math.max(TETO_PERICIA_TRABALHO, 0) + 0, `A perícia para em ${TETO_PERICIA_TRABALHO} (atletismo ${c.personagem.pericias.atletismo})`);
  c.localAtual = 'taverna';
  ok(!executarAcaoMundo(C, c, { tipo: 'trabalho_especializado', trabalhoId: 'cacada_contrato_witcher' }).ok, 'Caçada por contrato exige um troféu');
}

// ── 2. Treino com mestre ──────────────────────────────────────────────────
{
  const c = nova('treino');
  c.localAtual = 'taverna';
  ok(treinosAqui(c).length === 0, 'Na taverna não há treino');
  c.localAtual = 'passo_lobo';
  ok(treinosAqui(c).includes('katas') && treinosAqui(c).includes('niten'), 'No Passo do Lobo, com Musashi: katas e duas espadas');
  c.personagem.recursos.vigor = c.personagem.recursosMax.vigor = 30;
  const attrs = JSON.stringify(c.personagem.atributos), artes = c.personagem.artesConhecidas.length;
  const dia0 = c.calendario.dia;
  const r = executarAcaoMundo(C, c, { tipo: 'treino_imersivo', modalidade: 'katas', elemento: 'vento' });
  ok(r.ok && JSON.stringify(c.personagem.atributos) === attrs && c.personagem.artesConhecidas.length === artes, 'Treino não dá atributo nem técnica');
  ok(c.aptidao && Object.values(c.aptidao.esforco).some(v => v > 0), 'O ganho vai para a maestria');
  ok(!executarAcaoMundo(C, c, { tipo: 'treino_imersivo', modalidade: 'katas', elemento: 'terra' }).ok, 'A mesma modalidade só na semana seguinte');
  c.calendario.dia = dia0 + DIAS_ENTRE_TREINOS;
  ok(podeTreinarImersivo(c, 'katas').pode, `Depois de ${DIAS_ENTRE_TREINOS} dias, pode de novo`);
  for (let i = 0; i < 10; i++) { c.calendario.dia += DIAS_ENTRE_TREINOS; c.personagem.recursos.vigor = 30; executarAcaoMundo(C, c, { tipo: 'treino_imersivo', modalidade: 'katas', elemento: 'vento' }); c.localAtual = 'passo_lobo'; }
  ok((c.personagem.pericias.rastrear ?? 0) <= TETO_PERICIA_TREINO, `Dez semanas de treino levam a perícia a ${c.personagem.pericias.rastrear}, não além de ${TETO_PERICIA_TREINO}`);
  // O circuito antigo (cascata devolvendo vigor, katas dando atributo) acabou.
  const m = nova('cascata');
  m.localAtual = 'mosteiro_alto';
  m.personagem.pressoes.sanidade = 40;
  const res = m.personagem.atributos.resiliencia;
  ok(executarAcaoMundo(C, m, { tipo: 'treino_imersivo', modalidade: 'cascata' }).ok && m.personagem.pressoes.sanidade === 30 && m.personagem.atributos.resiliencia === res, 'Cascata alivia 10 de sanidade e não dá atributo');
  ok(!executarAcaoMundo(C, m, { tipo: 'treino_imersivo', modalidade: 'cascata' }).ok, 'E não se repete no mesmo dia');
}

// ── 3. Contratos de monstro ───────────────────────────────────────────────
{
  ok(CONTRATOS_INICIAIS_VAELHORN.every(k => locais.has(k.localId)), `Contratos apontam para lugares que existem: ${CONTRATOS_INICIAIS_VAELHORN.map(k => k.localId).join(', ')}`);
  ok(CONTRATOS_INICIAIS_VAELHORN.every(k => C.criaturas.some(x => x.id === k.criaturaId) && C.itens.some(i => i.id === k.fraquezaOleo) && C.itens.some(i => i.id === k.trofeuId)), 'Criatura, óleo e troféu de cada contrato existem');
  const c = nova('contrato');
  c.localAtual = 'praca';
  ok(!executarAcaoMundo(C, c, { tipo: 'contrato_monstro', contratoId: 'contrato_lobo_val_cinza', subacao: 'aceitar' }).ok, 'Longe do quadro não se aceita contrato');
  c.localAtual = 'taverna';
  const a = executarAcaoMundo(C, c, { tipo: 'contrato_monstro', contratoId: 'contrato_lobo_val_cinza', subacao: 'aceitar' });
  ok(a.ok && !/floresta\b|\[|Rolagem/.test(a.texto), `Aceito no quadro, sem id cru nem número: "${a.texto}"`);
  const k = listarContratos(c).find(x => x.id === 'contrato_lobo_val_cinza')!;
  const dia = c.calendario.dia;
  const longe = executarAcaoMundo(C, c, { tipo: 'contrato_monstro', contratoId: k.id, subacao: 'investigar', pistaId: k.pistas[0].id });
  ok(!longe.ok && c.calendario.dia === dia, 'Pista procurada longe do lugar: recusa e não gasta tempo');
  c.localAtual = k.localId;
  c.personagem.pericias.rastrear = 20; c.personagem.pericias.perceber = 20; c.personagem.pericias.atletismo = 20;
  let textos: string[] = [];
  for (let i = 0; i < 12 && k.estado === 'investigando'; i++) for (const p of k.pistas.filter(x => !x.encontrada)) textos.push(executarAcaoMundo(C, c, { tipo: 'contrato_monstro', contratoId: k.id, subacao: 'investigar', pistaId: p.id }).texto);
  ok(k.estado === 'pronto_para_confronto' && textos.every(t => !/Rolagem|\[oleo|vs \d/.test(t)), 'Investigação no lugar certo, com texto sem rolagem nem id');
  // Save antigo com lugar inexistente é corrigido ao abrir o quadro.
  const s = nova('contrato-antigo');
  inicializarQuadroContratos(s);
  s.contratosMonstro!.contratos.contrato_oni_pantano.localId = 'pantano';
  s.contratosMonstro!.contratos.contrato_oni_pantano.estado = 'investigando';
  const r = importar(exportar(s));
  if (!r.ok) throw new Error('Save antigo não abriu');
  ok(r.ok, 'Save antigo abre');
  inicializarQuadroContratos(r.valor);
  ok(r.valor.contratosMonstro!.contratos.contrato_oni_pantano.localId === 'charco_juncal' && r.valor.contratosMonstro!.contratos.contrato_oni_pantano.estado === 'investigando', 'O lugar volta a ser o do conteúdo e o estado do save fica');
}

// ── 4. Item que concede verbo ─────────────────────────────────────────────
{
  const c = nova('giz');
  c.localAtual = 'cripta';
  c.personagem.pericias.arcana = 0;
  const ritual = C.verbos.find(v => v.id === 'realizar_ritual')!;
  const ctx = { ...calcularContexto(C, c), privacidade: 3 as const, testemunhas: 0 };
  ok(!disponibilidadeVerbo(ritual, ctx, c, undefined, C).disponivel, 'Sem arcana e sem giz, sem ritual');
  c.personagem.inventario.circulo_de_giz = 1;
  ok(disponibilidadeVerbo(ritual, ctx, c, undefined, C).disponivel, 'Com o giz de ritual, o verbo que ele promete fica disponível');
  ok(!disponibilidadeVerbo(ritual, ctx, c).disponivel, 'Sem content, a regra antiga (compatibilidade)');
}

// ── 5. Prosa dos onis ─────────────────────────────────────────────────────
{
  const placeholder = C.criaturas.filter(x => /identidade canônica|Mecânica de combate adaptada/.test(x.descricao));
  ok(placeholder.length === 0, `Nenhuma criatura com texto técnico no lugar da descrição (${placeholder.map(x => x.id).join(', ') || 'nenhuma'})`);
  const akaza = C.criaturas.find(x => x.id === 'lua_superior_tres')!;
  ok(akaza.nome === 'Akaza' && /bússola/.test(akaza.descricao), `Akaza: "${akaza.descricao.slice(0, 70)}..."`);
}

// ── 6. Peças lendárias: história e caminho até a mão ─────────────────────
{
  const semFonteAntes = itensVaelhorn.filter(i => LENDAS_ITENS[i.id] && !i.lojas?.length);
  ok(semFonteAntes.length === 16, `As 16 peças lendárias não tinham fonte nenhuma (${semFonteAntes.length})`);
  const dadasPorCasa = Object.values(RELIQUIAS_DAS_CASAS).flat().map(r => r.item);
  const guardadas = Object.values(GUARDIOES_LENDARIOS);
  const semCaminho = Object.keys(LENDAS_ITENS).filter(id => !dadasPorCasa.includes(id) && !guardadas.includes(id));
  ok(semCaminho.length === 0, `Toda peça lendária tem caminho: ${guardadas.length} guardadas por adversário de expedição, ${dadasPorCasa.length} confiadas por casa`);
  ok(Object.keys(GUARDIOES_LENDARIOS).every(id => C.criaturas.find(x => x.id === id)?.loot?.some(l => l.chance === 1 && l.item === GUARDIOES_LENDARIOS[id])), 'Cada guardião deixa a peça quando vencido');
  ok(Object.keys(GUARDIOES_LENDARIOS).every(id => (C.desafios ?? []).some(d => d.criaturaId === id)), 'E cada guardião é adversário de uma expedição');
  const texto = C.itens.filter(i => LENDAS_ITENS[i.id]).map(i => `${i.nome} ${i.descricao} ${(i.historia ?? []).join(' ')}`).join(' ');
  ok(!/\bbar[aã]o\b|barões|almirantes|patriarcas/i.test(texto), 'Sem barões, almirantes e patriarcas num vale onde a Leva leva os homens');
  ok(C.itens.filter(i => LENDAS_ITENS[i.id]).every(i => (i.historia?.length ?? 0) >= 2), 'Cada peça tem ao menos dois parágrafos de história');

  // A casa confia a relíquia a quem ela chama de sua.
  const c = nova('reliquia');
  processarCasas(C, c);
  const casa = C.casas!.find(h => h.id === 'tessel')!;
  const estado = c.mundo!.casas!.tessel;
  mudarReputacaoCasa(C, c, casa, 20);
  c.calendario.dia++; processarCasas(C, c);
  ok(!c.personagem.inventario.elmo_tessel, 'Com reputação 20, a casa ainda não confia nada');
  mudarReputacaoCasa(C, c, casa, 25);
  c.calendario.dia++; processarCasas(C, c);
  ok(c.personagem.inventario.elmo_tessel === 1 && !c.personagem.inventario.espada_tessel, 'Com 45, o elmo primeiro (uma peça por dia)');
  c.calendario.dia++; processarCasas(C, c);
  ok(c.personagem.inventario.espada_tessel === 1 && c.vivo!.fatos.some(f => f.tipo === 'reliquia_confiada'), 'No dia seguinte, a Gélida da Marca, com fato público');
  c.calendario.dia++; processarCasas(C, c);
  ok(c.personagem.inventario.espada_tessel === 1 && (estado.reliquiasDadas ?? []).length === 2, 'Uma vez cada');
  c.personagem.equipado.arma = 'espada_tessel';
  const pacote = JSON.stringify(montarPacote(C, c, calcularContexto(C, c), 'fato'));
  ok(pacote.includes('pecasComHistoria') && pacote.includes('Idrun'), 'Equipada, a história vai para o narrador');
}

console.log('\nLigações: OK.');
