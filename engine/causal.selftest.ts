import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { processarFormacao } from './formacao';
import { normalizarCampanha } from './migracao';
import { fichaCombatente } from './progressaoNpc';
import { janelaMissao, periodosDeViagem, oferecerMissao, encerrarMissao } from './missoesVivas';
import { registrarFato } from './historiaViva';
import { obterRival } from './kimetsu';
import { processarNemesis, emboscadaNemesis } from './nemesis';
import type { NPC } from './types';
import { iniciarCombate } from './combat';
import { planejarMissao } from './planejadorSim';
const ok = (v: unknown, texto: string) => { if (!v) throw new Error(texto); console.log(`✓ ${texto}`); };
const nova = () => criarCampanha(C, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: 'causal', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
{
  const c = nova();
  const base = C.locais[0];
  const content = { ...C, locais: [
    { ...base, id: 'a', rotas: [{ destino: 'b', periodos: 1, perigo: 1 }, { destino: 'c', periodos: 12, perigo: 1 }] },
    { ...base, id: 'b', rotas: [{ destino: 'c', periodos: 1, perigo: 1 }] },
    { ...base, id: 'c', rotas: [] },
  ] };
  c.localAtual = 'a'; c.vivo!.missoes = [];
  const f = registrarFato(c, { tipo: 'teste', local: 'c', texto: 'Pedido distante', atores: [], publico: true });
  const q = oferecerMissao(c, 'reconstruir', f)!; q.conhecida = true;
  const rng = JSON.stringify(c.rng);
  ok(planejarMissao(content, c)?.tipo === 'agir', 'Planejador aceita pedido alcançável');
  q.estado = 'aceita';
  const viagem = planejarMissao(content, c);
  ok(viagem?.tipo === 'viajar' && viagem.destino === 'b', 'Planejador usa rota de menor tempo, não atalho caro');
  c.localAtual = 'c'; c.personagem.dinheiro = 40;
  const acao = planejarMissao(content, c);
  ok(acao?.tipo === 'agir' && acao.acao.tipo === 'missao' && acao.acao.escolha === 'ajudar', 'Chegada prioriza executar o compromisso');
  q.prazo = c.calendario.dia - 1; ok(!planejarMissao(content, c), 'Planejador ignora pedido expirado');
  q.prazo = c.calendario.dia + 10; q.local = 'inexistente'; ok(!planejarMissao(content, c), 'Planejador rejeita destino desconectado');
  ok(JSON.stringify(c.rng) === rng, 'Planejamento não consome sorte da campanha');
}
{
  const c = normalizarCampanha(C, nova());
  iniciarCombate(C, c, ['sentinela_de_basalto']);
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  ok(JSON.stringify(salvo) === JSON.stringify(c), 'Save em combate preserva campanha completa, RNG e atores');
}
{
  const c = nova(), n = c.npcsProcedurais!.find(n => c.npcState[n.id]?.vivo)!;
  const p = c.vivo!.pessoas[n.id], din = c.npcState[n.id];
  din.idade = 18; din.vida = 32;
  Object.assign(p, { local: 'taverna', deslocado: true, objetivo: 'rotina', viagem: undefined, saude: 80, fome: 0, moedas: 100, habilidade: 10, formacao: { caminho: 'guarda', sessoes: 0, concluida: false } });
  const mentor: NPC = { ...n, id: 'mentor_teste', especie: 'humano', idade: 30, localBase: 'taverna', rotina: {}, combatente: { vida: 32, defesa: 12, acerto: 12, dano: { base: 5, dispersao: .2, tipo: 'corte' }, tecnicas: [] } };
  const content = { ...C, npcs: [mentor] };
  c.npcState[mentor.id] = { vivo: true, idade: 30, vida: 0, eixos: {}, memoria: [], tensao: 0 };
  ok(!processarFormacao(content, c, n), 'Mentor incapacitado não ensina');
  c.npcState[mentor.id].vida = 32;
  din.idade = 17; ok(!processarFormacao(content, c, n), 'Menor não recebe ficha'); din.idade = 18;
  din.vida = 0; ok(!processarFormacao(content, c, n), 'Aprendiz incapacitado não treina'); din.vida = 32;
  const rng = JSON.stringify(c.rng);
  for (let i = 0; i < 20; i++) ok(processarFormacao(content, c, n), `Sessão de formação ${i + 1}`);
  ok(!!n.combatente && p.formacao!.concluida, 'Formação entrega ficha após prática');
  ok(Math.abs(din.vida! / fichaCombatente(c, n)!.vida - .8) < .03, 'Formação preserva saúde na ficha derivada');
  ok(JSON.stringify(c.rng) === rng, 'Formação não desloca RNG');
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  ok(JSON.stringify(salvo.vivo!.pessoas[n.id]) === JSON.stringify(p), 'Save preserva estado civil completo');
  ok(JSON.stringify(salvo.npcState[n.id]) === JSON.stringify(din), 'Save preserva estado dinâmico completo');
  const novamente = normalizarCampanha(C, JSON.parse(JSON.stringify(salvo)));
  ok(JSON.stringify(novamente) === JSON.stringify(salvo), 'Normalização completa é idempotente');
}
{
  const c = nova(), local = Object.keys(c.vivo!.cidades)[0];
  c.vivo!.cidades[local].fomeDias = 4;
  ok(janelaMissao(c, 'abastecer', local).dias < janelaMissao(c, 'reconstruir', local).dias, 'Urgência distingue prazos');
  ok(periodosDeViagem(C, local, 'inexistente') === Infinity, 'Rota impossível não inventa viagem');
  const f = registrarFato(c, { tipo: 'teste', local, texto: 'Teste', atores: [], publico: true });
  const q = oferecerMissao(c, 'reconstruir', f)!;
  q.estado = 'aceita'; encerrarMissao(c, q, 'falhada', 'Teste');
  const outra = oferecerMissao(c, 'reconstruir', f)!;
  encerrarMissao(c, outra, 'falhada', 'Teste');
  ok(c.vivo!.contadores.compromissosFalhados === 1 && c.vivo!.contadores.oportunidadesExpiradas === 1, 'Métricas separam compromisso e oportunidade');
  const paga = oferecerMissao(c, 'reconstruir', f)!; paga.estado = 'aceita';
  encerrarMissao(c, paga, 'concluida', 'Teste'); const dinheiro = c.personagem.dinheiro;
  encerrarMissao(c, paga, 'concluida', 'Teste'); ok(dinheiro === c.personagem.dinheiro, 'Recompensa não duplica');
}
{
  const c = nova(), criatura = C.criaturas.find(x => x.oni && !x.perfilOni?.identidade)!;
  const r = obterRival(c, criatura, [])!; processarNemesis(C, c);
  r.rancor = 5; r.reencontros = 2; r.evolucao!.proximaAcao = c.calendario.dia;
  processarNemesis(C, c); ok(r.evolucao!.plano !== 'perseguir', 'Sem pista não persegue');
  r.comportamento!.pista = c.localAtual; r.comportamento!.pistaAte = c.calendario.dia - 1; r.evolucao!.proximaAcao = c.calendario.dia;
  processarNemesis(C, c); ok(!r.comportamento!.pista, 'Pista expirada é descartada');
  r.comportamento!.pista = c.localAtual; r.comportamento!.pistaAte = c.calendario.dia + 14; r.comportamento!.recuperarAte = c.calendario.dia + 7;
  ok(!emboscadaNemesis(C, c), 'Recuperação impede emboscada');
  r.vivo = false; const antes = JSON.stringify(r); processarNemesis(C, c);
  ok(JSON.stringify(r) === antes, 'Morto não evolui');
}
