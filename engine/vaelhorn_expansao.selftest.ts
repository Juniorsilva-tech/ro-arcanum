// ARCANUM · Teste de Validação da Expansão de Vaelhorn
// Relíquias Nobres, Armas Perdidas/Divinas, Mestre Marcial, Quebra de Lâmina,
// Presença de Musashi, Contratos Witcher, Óleos Alquímicos e Treinamentos Imersivos.
import { itensVaelhorn } from '../content/vaelhorn/items';
import { classesVaelhorn } from '../content/vaelhorn/classes';
import { mestresVaelhorn, trabalhosVaelhorn, artesVaelhorn } from '../content/vaelhorn/book';
import { criaturasVaelhorn } from '../content/vaelhorn/bestiary';
import { criarCampanha } from './campaign';
import { conteudoVaelhorn } from '../content/vaelhorn';
import {
  CLASSE_LUTADOR,
  CLASSE_MESTRE_MARCIAL,
  danoMarcialDesarmado,
  tentativaQuebraDeEspada,
  bonificacaoNitenMusashi,
} from './classe';
import { danoJogador, iniciarCombate } from './combat';
import {
  inicializarQuadroContratos,
  listarContratos,
  aceitarContrato,
  investigarPista,
  aplicarOleoAlquimico,
} from './contratosMonstros';
import {
  treinarKatasCincoElementos,
  treinarCalejamentoPalmaDeFerro,
  meditarSobCascata,
  treinarEsgrimaNiten,
} from './treinamentoImersivo';
import { executarAcaoMundo } from './acoesMundo';
import type { CombatActor } from './types';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    throw new Error(`FALHA NA ASSERÇÃO: ${msg}`);
  }
}

console.log('=== INICIANDO TESTES DA EXPANSÃO DE VAELHORN ===\n');

// 1. Catálogo de Relíquias Hereditárias Nobres & Armas Divinas/Perdidas
console.log('1. Testando Catálogo de Relíquias e Armas Lendárias...');
const idsEsperados = [
  'espada_ancestral_halvet',
  'escudo_halvet',
  'tridente_mareu',
  'manto_mareu',
  'machado_corveira',
  'peitoral_corveira',
  'espada_tessel',
  'elmo_tessel',
  'cimitarra_solgar',
  'espada_imperial_vaelhorn',
  'coroa_espinhos_valtorius',
  'lamina_da_origem_solar',
  'arco_do_cacador_de_astros',
  'lanca_de_sao_vandro',
  'adaga_do_rei_ladrao',
  'faixas_marciais',
  'manoplas_do_quebra_aco',
  'manoplas_vajra_celestial',
  'oleo_anti_besta',
  'oleo_anti_necromorfos',
  'oleo_de_glicinia_solar',
  'oleo_draconico_de_enxofre',
  'trofeu_lobo_cinzento',
  'trofeu_gargula_abissal',
  'trofeu_oni_do_pantano',
  'trofeu_quimera_da_cordilheira',
];

for (const id of idsEsperados) {
  const item = itensVaelhorn.find((i) => i.id === id);
  assert(!!item, `Item ${id} deve existir no catálogo de itens`);
}

const solar = itensVaelhorn.find((i) => i.id === 'lamina_da_origem_solar')!;
assert(solar.contraOni === true, 'Lâmina da Origem Solar deve possuir contraOni = true');
assert(solar.dano?.base === 24, 'Lâmina Solar deve ter dano base 24');

const manoplaQuebra = itensVaelhorn.find((i) => i.id === 'manoplas_do_quebra_aco')!;
assert(manoplaQuebra.quebraArmas === true, 'Manoplas do Quebrador de Aço devem ter quebraArmas = true');

console.log('✓ Catálogo de relíquias e itens validado com sucesso.');

// 2. Classe Lutador & Quebra de Lâmina
console.log('\n2. Testando Classe Lutador & Quebra de Lâmina...');
const classeLutador = classesVaelhorn.find((c) => c.id === CLASSE_LUTADOR);
assert(!!classeLutador, 'Classe lutador deve estar registrada em classesVaelhorn');
assert(classeLutador?.nome === 'Lutador', 'Nome da classe deve ser Lutador');
assert(classeLutador?.bonusAtributos.fisico === 2, 'Lutador deve ter bônus em Físico');
assert(classeLutador?.bonusAtributos.precisao === 2, 'Lutador deve ter bônus em Precisão');

const content = conteudoVaelhorn;
const camp = criarCampanha(content, {
  nome: 'Kenshiro de Vaelhorn',
  atributos: { fisico: 10, precisao: 10, raciocinio: 10, percepcao: 10, resiliencia: 10, social: 10 },
  classeId: CLASSE_LUTADOR,
  origemId: 'sem_nome',
});

// Forçar atributos para testar escalonamento
camp.personagem.atributos.fisico = 16; // bonus = 8
camp.personagem.atributos.precisao = 14; // bonus = 7
const danoMarcial = danoMarcialDesarmado(camp, {
  id: 'jogador',
  nome: camp.personagem.nome,
  ehJogador: true,
  vida: 30,
  vidaMax: 30,
  defesa: 10,
  acerto: 10,
  condicoes: [],
});
// 10 + floor(16/2) + floor(14/2) = 10 + 8 + 7 = 25
assert(danoMarcial.base === 25, `Dano marcial base deve ser 25 (obtido: ${danoMarcial.base})`);

// Testar danoJogador com o personagem Mestre Marcial desarmado
camp.personagem.equipado.arma = undefined;
const perfilJogador = danoJogador(content, camp);
assert(perfilJogador.base >= 25, `danoJogador desarmado para Mestre Marcial deve ser >= 25 (obtido: ${perfilJogador.base})`);

// Testar tentativa de quebra de espada
const atacanteInimigo: CombatActor = {
  id: 'inim_1',
  nome: 'Cavaleiro Renegado',
  ehJogador: false,
  vida: 40,
  vidaMax: 40,
  defesa: 12,
  acerto: 12,
  dano: { base: 12, dispersao: 0.3, tipo: 'cortante' },
  condicoes: [],
};
const defensorMarcial: CombatActor = {
  id: 'jogador',
  nome: 'Kenshiro',
  ehJogador: true,
  vida: 30,
  vidaMax: 30,
  defesa: 14,
  acerto: 14,
  condicoes: [],
};

const quebra = tentativaQuebraDeEspada(camp, defensorMarcial, atacanteInimigo, 18);
assert(quebra.quebrou === true, 'Rolagem 18 deve partir a lâmina com sucesso');
assert(atacanteInimigo.armaQuebrada === true, 'Atacante deve ficar com armaQuebrada = true');
assert(atacanteInimigo.condicoes.includes('atordoado'), 'Atacante deve receber condição atordoado');
assert(!!quebra.mensagem && quebra.mensagem.includes('CRACK!'), 'Mensagem de quebra deve ser dramática');

console.log('✓ Classe Mestre Marcial e quebra de espada validadas.');

// 3. Miyamoto Musashi, Niten Ichi-ryu & Sukitōru Sekai
console.log('\n3. Testando Mestre Musashi e Estilo de Espada Niten...');
const mestreMusashi = mestresVaelhorn.find((m) => m.id === 'mestre_musashi');
assert(!!mestreMusashi, 'Mestre Musashi deve estar registrado em mestresVaelhorn');

const arteNiten = artesVaelhorn.find((a) => a.id === 'corte_cruzado_niten');
assert(!!arteNiten, 'Arte corte_cruzado_niten deve existir em artesVaelhorn');
const arteSekai = artesVaelhorn.find((a) => a.id === 'mundo_transparente');
assert(!!arteSekai, 'Arte mundo_transparente deve existir em artesVaelhorn');

// Equipar espada sem escudo no jogador
camp.personagem.equipado.arma = 'espada_ancestral_halvet';
camp.personagem.equipado.escudo = undefined;
const atorMusashi: CombatActor = {
  id: 'jogador',
  nome: 'Musashi Jr',
  ehJogador: true,
  vida: 30,
  vidaMax: 30,
  defesa: 12,
  acerto: 12,
  condicoes: [],
  mundoTransparente: true,
};

const nitenBonus = bonificacaoNitenMusashi(camp, atorMusashi);
assert(nitenBonus.bonusAcerto >= 5, 'Com mundoTransparente deve conceder no mínimo +5 acerto');
assert(nitenBonus.penetracaoArmadura === 1.0, 'Com mundoTransparente deve ignorar 100% da armadura');
assert(nitenBonus.bonusCritico >= 0.35, 'Com mundoTransparente deve conceder +0.35 de janela crítica');

console.log('✓ Presença de Musashi e Visão Transparente validadas.');

// 4. Contratos de Monstros Witcher & Óleos Alquímicos
console.log('\n4. Testando Contratos de Caça a Monstros & Óleos Alquímicos...');
const quadro = inicializarQuadroContratos(camp);
const contratos = listarContratos(camp);
assert(contratos.length >= 4, 'Deve haver ao menos 4 contratos no quadro');

const contratoLobo = contratos.find((c) => c.id === 'contrato_lobo_val_cinza')!;
assert(contratoLobo.estado === 'disponivel', 'Contrato inicial deve estar disponivel');

const rAceitar = aceitarContrato(camp, contratoLobo.id);
assert(rAceitar.ok === true, 'Aceitar contrato deve suceder');
assert(contratoLobo.estado === 'investigando', 'Contrato aceito deve mudar para investigando');

// Investigar pistas
for (const p of contratoLobo.pistas) {
  p.encontrada = true; // marcar para simular investigação completa
}
contratoLobo.estado = 'pronto_para_confronto';

// Aplicar óleo na lâmina
camp.personagem.inventario['oleo_anti_besta'] = 2;
const rOleo = aplicarOleoAlquimico(camp, 'oleo_anti_besta', content);
assert(rOleo.ok === true, 'Aplicação de óleo deve suceder');
assert(camp.contratosMonstro?.oleoAtivo?.tipoAlvo === 'fera', 'Óleo ativo deve alvejar feras');
assert(camp.contratosMonstro?.oleoAtivo?.bonusDano === 5, 'Óleo anti-besta deve dar +5 de dano');
assert(camp.personagem.inventario['oleo_anti_besta'] === 1, 'Deve consumir 1 frasco de óleo');

console.log('✓ Contratos de Caça e Óleos de Lâmina validados.');

// 5. Treinamentos Imersivos (Katas 5 Elementos, Calejamento e Cascata)
console.log('\n5. Testando Treinamentos Imersivos...');
// Sessão 54: o treino acontece onde o mestre ensina, uma vez por semana, e
// não dá atributo solto (antes, katas + cascata eram atributo infinito).
camp.personagem.recursos.vigor = 20;
camp.personagem.atributos.fisico = 12;
camp.personagem.atributos.precisao = 12;
const localAntes = camp.localAtual;
assert(treinarKatasCincoElementos(camp, 'terra', content).ok === false, 'Longe do Passo do Lobo não há katas');
camp.localAtual = 'passo_lobo';
const rTerra = treinarKatasCincoElementos(camp, 'terra', content);
assert(rTerra.ok === true, 'Treino da Terra deve ter sucesso no Passo do Lobo');
assert(camp.personagem.atributos.fisico === 12, 'O treino não mexe em atributo');
assert(treinarKatasCincoElementos(camp, 'agua', content).ok === false, 'Uma vez por semana');

camp.localAtual = 'mosteiro_alto';
const rCalejamento = treinarCalejamentoPalmaDeFerro(camp, content);
assert(rCalejamento.ok === true, 'Calejamento deve ter sucesso no Mosteiro Alto');

camp.personagem.pressoes.corrupcao = 30;
camp.personagem.pressoes.sanidade = 25;
const resAntes = camp.personagem.atributos.resiliencia;
const rCascata = meditarSobCascata(camp);
assert(rCascata.ok === true, 'Meditação sob cascata deve suceder');
assert(camp.personagem.pressoes.corrupcao === 20, 'Cascata reduz corrupção em 10');
assert(camp.personagem.pressoes.sanidade === 15, 'Cascata reduz sanidade em 10');
assert(camp.personagem.atributos.resiliencia === resAntes, 'Cascata não dá atributo');
assert(meditarSobCascata(camp).ok === false, 'Cascata também é semanal');
camp.localAtual = localAntes;

console.log('✓ Treinamentos imersivos validados.');

// 6. Ações de Mundo (Trabalhos Especializados e Contratos)
console.log('\n6. Testando Ações de Mundo...');
if (camp.familia) camp.familia.prologoConcluido = true;
const longe = executarAcaoMundo(content, camp, { tipo: 'trabalho_especializado', trabalhoId: 'extracao_fenda_corveira' });
assert(longe.ok === false, 'Longe de Corveira não há turno na galeria');
camp.localAtual = 'corveira';
const rTrabalho = executarAcaoMundo(content, camp, {
  tipo: 'trabalho_especializado',
  trabalhoId: 'extracao_fenda_corveira',
});
assert(rTrabalho.ok === true, 'Trabalho na Fenda de Corveira deve suceder');
assert(camp.personagem.inventario['minerio_de_ferro'] === 2, 'Deve conceder minério de ferro');

console.log('✓ Ações de mundo validadas.');

console.log('\n=== TODOS OS TESTES DA EXPANSÃO DE VAELHORN PASSARAM COM SUCESSO! ===');
