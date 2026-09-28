import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { normalizarCampanha } from './migracao';
import { concederDespertar, recalcularRecursosMaximos, vidaMaxima } from './progresso';
import { multiplicadoresDeIdentidade } from './identidade';
import { fichaCombatente, migrarProgressaoNpcs, retratoProgressaoNpc, treinarNpc } from './progressaoNpc';
import { iniciarCombate, jogadorAcaoTatica, jogadorAtaca } from './combat';
import { executarAcaoMundo } from './acoesMundo';

const ok = (v: unknown, mensagem: string) => { if (!v) throw new Error(mensagem); console.log(`✓ ${mensagem}`); };
const nova = () => criarCampanha(C, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: 'expansao-regressao', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });

{
  const c = nova();
  ok(c.personagem.recursosMax.vida === vidaMaxima(c), 'Campanha nova usa a mesma vida do banco de balanço');
  c.personagem.recursos.vida = Math.round(c.personagem.recursosMax.vida / 2);
  const proporcao = c.personagem.recursos.vida / c.personagem.recursosMax.vida;
  ok(concederDespertar(c, 'venceu_oni_ancestral', 'teste'), 'Despertar é concedido');
  ok(Math.abs(c.personagem.recursos.vida / c.personagem.recursosMax.vida - proporcao) < .02, 'Despertar preserva ferimentos proporcionais');
  const nivel = c.personagem.nivel;
  ok(!concederDespertar(c, 'venceu_oni_ancestral', 'teste') && c.personagem.nivel === nivel, 'Mesmo despertar não acumula níveis');
  concederDespertar(c, 'dominou_prova_eclipse', 'teste');
  ok(multiplicadoresDeIdentidade(c).dano === 1.25, 'Legados usam o maior bônus, sem produto acumulativo');
  c.personagem.recursos.vida = 0;
  recalcularRecursosMaximos(c);
  ok(c.personagem.recursos.vida === 0, 'Recalcular recursos não ressuscita');
}

{
  const c = nova();
  const npc = C.npcs.find(n => n.combatente && c.npcState[n.id]?.vivo && (c.npcState[n.id].idade ?? n.idade) >= 18)!;
  ok(npc, 'Existe combatente adulto para progressão');
  const antes = fichaCombatente(c, npc)!;
  const rng = JSON.stringify(c.rng);
  for (let i = 0; i < 100; i++) if (!treinarNpc(c, npc, 3, 20)) throw new Error(`Treino falhou: ${i}`);
  const depois = fichaCombatente(c, npc)!;
  ok(depois.vida > antes.vida && depois.dano.base > antes.dano.base, 'Prática melhora corpo e dano reais do NPC');
  ok(JSON.stringify(c.rng) === rng, 'Progressão não consome o acaso da campanha');
  ok(!JSON.stringify(retratoProgressaoNpc(c, npc)).includes('aptidao'), 'Potencial oculto não aparece no retrato público');
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  ok(JSON.stringify(salvo.npcState[npc.id].progressao) === JSON.stringify(c.npcState[npc.id].progressao), 'Save mantém integralmente a progressão');
  const estado = JSON.stringify(salvo.npcState[npc.id]);
  migrarProgressaoNpcs(C, salvo);
  ok(JSON.stringify(salvo.npcState[npc.id]) === estado, 'Migração de NPC é idempotente');
  c.npcState[npc.id].vivo = false;
  ok(!treinarNpc(c, npc), 'NPC morto não treina');
}

{
  ok(C.desafios?.length === 10, 'Dez expedições fixas registradas');
  for (const d of C.desafios!) {
    ok(C.locais.some(l => l.id === d.local) && C.criaturas.some(c => c.id === d.criaturaId), `Referências válidas: ${d.id}`);
  }
  const c = nova();
  c.familia!.prologoConcluido = true;
  const d = C.desafios![0];
  c.localAtual = d.local;
  ok(executarAcaoMundo(C, c, { tipo: 'desafio', id: d.id }).combate, 'Expedição abre combate pela ação real');
  const inimigo = c.combate!.atores.find(a => a.criaturaId === d.criaturaId)!;
  ok(inimigo, 'Combate contém o adversário fixo da expedição');
  inimigo.vida = 1;
  jogadorAcaoTatica(C, c, 'capturar', inimigo.id);
  ok(!inimigo.capturado, 'Constructo não se rende como humano');
  // Controlled fixture; resolution, victory, reward and flag use the real engine.
  const jogador = c.combate!.atores.find(a => a.ehJogador)!;
  jogador.acerto = 100;
  jogador.vida = jogador.vidaMax = 10000;
  for (let i = 0; i < 100 && !c.combate!.terminado; i++) jogadorAtaca(C, c, inimigo.id);
  ok(c.combate!.resultado === 'vitoria' && c.flags[`desafio.concluido.${d.id}`], 'Vitória real registra conclusão e impede novo saque');
  c.combate = undefined;
  ok(!executarAcaoMundo(C, c, { tipo: 'desafio', id: d.id }).ok, 'Expedição concluída não pode ser repetida');
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  ok(salvo.flags[`desafio.concluido.${d.id}`], 'Conclusão da expedição persiste no save');
  // A calibragem do bestiário (CALIBRAGEM_INIMIGO) mexe na criatura, não no
  // jogador: o mesmo adversário tem a mesma vida para um novato e um veterano.
  const novato = nova();
  const veterano = nova();
  veterano.personagem.nivel = 20;
  const vidaNovato = iniciarCombate(C, novato, [d.criaturaId]).atores.find(a => a.criaturaId === d.criaturaId)?.vidaMax;
  const vidaVeterano = iniciarCombate(C, veterano, [d.criaturaId]).atores.find(a => a.criaturaId === d.criaturaId)?.vidaMax;
  ok(vidaNovato !== undefined && vidaNovato === vidaVeterano, 'Adversário não escala com o jogador');
}

console.log('Expansão: regressões concluídas.');
