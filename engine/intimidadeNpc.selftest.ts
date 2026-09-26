// ARCANUM · Testes do sistema de Intimidade, Desejos e Humor dos NPCs.
import { conteudoVaelhorn as content } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import {
  obterIntimidadeNpc,
  calcularHumorNpc,
  conversarASos,
  apoiarDesejoNpc,
  confortarLutoNpc,
  presentearNpc,
} from './intimidadeNpc';
import { estadoFamiliasNpc } from './familiasNpc';
import { montarGrade } from './grade';
import { resolverIntencao } from './turn';
import { calcularContexto } from './availability';
import type { Campaign } from './types';

function ok(cond: unknown, msg?: string): asserts cond {
  if (!cond) throw new Error(msg ?? 'Falha de asserção');
}

function strictEqual<T>(a: T, b: T, msg?: string) {
  if (a !== b) throw new Error(`${msg ?? 'Falha de igualdade'}: esperado ${String(b)}, obtido ${String(a)}`);
}

function novaCampanha(): Campaign {
  return criarCampanha(content, {
    nome: 'Herói Teste',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'divida',
    seedString: 'intimidade-teste',
    marcaInfancia: 'comum',
    reacaoInfancia: 'apoio',
  });
}

console.log('--- TESTES DE INTIMIDADE, DESEJOS & HUMOR DOS NPCS ---');

// 1. Camadas de Intimidade
{
  const camp = novaCampanha();
  const aldrica = content.npcs.find(n => n.id === 'aldrica')!;
  ok(aldrica, 'Aldrica deve existir');

  // Inicial sem convívio
  let int = obterIntimidadeNpc(camp, aldrica);
  strictEqual(int.desejo, false, 'Desejo não deve ser conhecido inicialmente');
  strictEqual(int.ferida, false, 'Ferida não deve ser conhecida inicialmente');
  strictEqual(int.medo, false, 'Medo não deve ser conhecido inicialmente');

  // Subir confiança para 10 -> destrava desejo
  camp.npcState.aldrica.eixos.confianca = 10;
  int = obterIntimidadeNpc(camp, aldrica);
  strictEqual(int.desejo, true, 'Desejo deve ser destravado com confiança >= 8');
  strictEqual(int.ferida, false, 'Ferida ainda não deve ser conhecida');

  // Subir confiança para 18 -> destrava ferida
  camp.npcState.aldrica.eixos.confianca = 18;
  int = obterIntimidadeNpc(camp, aldrica);
  strictEqual(int.ferida, true, 'Ferida deve ser destravada com confiança >= 16');

  // Subir confiança para 25 -> destrava medo
  camp.npcState.aldrica.eixos.confianca = 25;
  int = obterIntimidadeNpc(camp, aldrica);
  strictEqual(int.medo, true, 'Medo deve ser destravado com confiança >= 22');

  console.log('✓ 1. Revelação progressiva de intimidade (Origem, Desejo, Ferida, Medo) validada');
}

// 2. Humor / Estado de Espírito
{
  const camp = novaCampanha();
  const aldrica = content.npcs.find(n => n.id === 'aldrica')!;

  // Padrão basal
  let humor = calcularHumorNpc(camp, content, aldrica);
  strictEqual(humor.id, 'sereno');

  // Tensão alta
  camp.npcState.aldrica.tensao = 75;
  humor = calcularHumorNpc(camp, content, aldrica);
  strictEqual(humor.id, 'tenso');

  // Medo alto
  camp.npcState.aldrica.tensao = 10;
  camp.npcState.aldrica.eixos.medo = 16;
  humor = calcularHumorNpc(camp, content, aldrica);
  strictEqual(humor.id, 'aterrorizado');

  // Luto recente
  camp.npcState.aldrica.eixos.medo = 0;
  const fam = estadoFamiliasNpc(content, camp);
  fam.lutos.aldrica = [{ dia: camp.calendario.dia - 5, morto: 'parente_x', laco: 'irmão' }];
  camp.familiasNpc = fam;
  humor = calcularHumorNpc(camp, content, aldrica);
  strictEqual(humor.id, 'luto');

  console.log('✓ 2. Cálculo de humor dinâmico (Sereno, Tenso, Aterrorizado, Luto) validado');
}

// 3. Conversar a Sós
{
  const camp = novaCampanha();
  const neve = content.npcs.find(n => n.id === 'neve')!;
  ok(neve, 'Neve deve existir');

  camp.npcState.neve.tensao = 50;
  camp.npcState.neve.eixos.confianca = 4;

  const res1 = conversarASos(content, camp, 'neve');
  strictEqual(res1.ok, true);
  strictEqual(res1.revelou, 'desejo');
  strictEqual(camp.npcState.neve.tensao, 35, 'Tensão deve cair em 15');
  strictEqual(camp.npcState.neve.eixos.confianca, 6, 'Confiança deve subir em 2');
  ok(camp.intimidadeNpc?.neve?.desejo, 'Desejo de Neve deve estar marcado como revelado');

  // Nova conversa com confiança elevada
  camp.npcState.neve.eixos.confianca = 14;
  const res2 = conversarASos(content, camp, 'neve');
  strictEqual(res2.ok, true);
  strictEqual(res2.revelou, 'ferida');
  ok(camp.intimidadeNpc?.neve?.ferida, 'Ferida de Neve deve estar marcada como revelada');

  console.log('✓ 3. Ação "Conversar a Sós" e aprofundamento de intimidade validados');
}

// 4. Apoiar Desejo Pessoal
{
  const camp = novaCampanha();
  const neve = content.npcs.find(n => n.id === 'neve')!;
  camp.personagem.dinheiro = 50;
  camp.npcState.neve.tensao = 40;
  camp.npcState.neve.eixos.confianca = 10;
  camp.intimidadeNpc = { neve: { desejo: true, origem: true, ferida: false, medo: false, desejoApoiado: false } };

  const res = apoiarDesejoNpc(content, camp, 'neve');
  strictEqual(res.ok, true);
  strictEqual(camp.personagem.dinheiro, 30, 'Deve ter deduzido 20 moedas');
  strictEqual(camp.npcState.neve.tensao, 0, 'Tensão deve ser zerada');
  strictEqual(camp.npcState.neve.eixos.confianca, 18, 'Confiança deve ter subido +8');
  strictEqual(camp.intimidadeNpc.neve.desejoApoiado, true);

  const temConviccao = camp.npcState.neve.conviccoes?.some(c => c.valencia === 'afeto');
  ok(temConviccao, 'Deve ter sintetizado convicção permanente de afeto/lealdade');

  const humor = calcularHumorNpc(camp, content, neve);
  strictEqual(humor.id, 'grato', 'Humor deve refletir gratidão pelo anseio apoiado');

  console.log('✓ 4. Apoio a anseio pessoal e consolidação de lealdade inabalável validados');
}

// 5. Confortar Luto e Presentear
{
  const camp = novaCampanha();
  const fam = estadoFamiliasNpc(content, camp);
  fam.lutos.aldrica = [{ dia: camp.calendario.dia - 2, morto: 'parente_x', laco: 'irmão' }];
  camp.familiasNpc = fam;
  camp.npcState.aldrica.tensao = 60;
  camp.npcState.aldrica.eixos.confianca = 5;

  const resLuto = confortarLutoNpc(content, camp, 'aldrica');
  strictEqual(resLuto.ok, true);
  strictEqual(camp.npcState.aldrica.tensao, 35, 'Tensão deve cair 25 após consolo');
  strictEqual(camp.npcState.aldrica.eixos.confianca, 9, 'Confiança deve subir +4');

  // Presentear
  camp.personagem.dinheiro = 20;
  const resPres = presentearNpc(content, camp, 'aldrica');
  strictEqual(resPres.ok, true);
  strictEqual(camp.personagem.dinheiro, 10);
  strictEqual(camp.npcState.aldrica.tensao, 25);
  strictEqual(camp.npcState.aldrica.eixos.confianca, 12);

  console.log('✓ 5. Conforto de luto e presentear validados');
}

// 6. Integração com Grade de Opções e Resolução de Turno
{
  const camp = novaCampanha();
  const aldrica = content.npcs.find(n => n.id === 'aldrica')!;
  const ctx = calcularContexto(content, camp);
  ctx.presentes = [aldrica];

  // Caso A: Aldrica em estado basal -> preencher gera opção de conversar a sós
  const gradeBasal = montarGrade(content, camp, ctx, []);
  const opConversar = gradeBasal.find(o => o.id.startsWith('grade_aproximar_conversar_a_sos_aldrica'));
  ok(opConversar, 'Grade deve ofertar Conversar a Sós quando não há intimidade avançada');

  // Resolver a intenção do turno com essa opção
  const turno1 = resolverIntencao(content, camp, { tipo: 'opcao', opcao: opConversar });
  ok(turno1.fato.includes('Aldrica'), 'Turno deve narrar a conversa a sós');

  // Caso B: Aldrica em luto -> grade gera Prestar Condolências
  const fam = estadoFamiliasNpc(content, camp);
  fam.lutos.aldrica = [{ dia: camp.calendario.dia - 1, morto: 'parente_x', laco: 'irmão' }];
  camp.familiasNpc = fam;

  const gradeLuto = montarGrade(content, camp, ctx, []);
  const opLuto = gradeLuto.find(o => o.id.startsWith('grade_aproximar_confortar_luto_aldrica'));
  ok(opLuto, 'Grade deve ofertar Prestar Condolências & Confortar quando NPC estiver de luto');

  const turno2 = resolverIntencao(content, camp, { tipo: 'opcao', opcao: opLuto });
  ok(turno2.fato.includes('conforta') || turno2.fato.includes('luto') || turno2.fato.includes('Aldrica'), 'Turno deve resolver o consolo de luto');

  // Caso C: Anseio conhecido e jogador tem dinheiro -> grade oferta Apoiar Anseio
  camp.familiasNpc = undefined;
  camp.personagem.dinheiro = 50;
  camp.intimidadeNpc = { aldrica: { origem: true, desejo: true, ferida: false, medo: false, desejoApoiado: false } };

  const gradeDesejo = montarGrade(content, camp, ctx, []);
  const opDesejo = gradeDesejo.find(o => o.id.startsWith('grade_aproximar_apoiar_desejo_aldrica'));
  ok(opDesejo, 'Grade deve ofertar Apoiar anseio pessoal quando anseio for conhecido e houver ouro');

  const turno3 = resolverIntencao(content, camp, { tipo: 'opcao', opcao: opDesejo });
  strictEqual(camp.personagem.dinheiro, 30, 'Deve ter deduzido 20 moedas ao apoiar pelo turno');
  strictEqual(camp.intimidadeNpc.aldrica.desejoApoiado, true);

  console.log('✓ 6. Integração com Grade de Opções e Resolução de Turno validada');
}

console.log('--- TODOS OS 6 TESTES DE INTIMIDADE E HUMOR PASSARAM COM SUCESSO ---');
