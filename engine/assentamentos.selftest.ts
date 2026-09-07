import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarObra, processarCidades, EDIFICIOS } from './cidades';
import { normalizarCampanha } from './migracao';
import { montarPacote } from './llm';
import { calcularContexto } from './availability';
import { registrarFato } from './historiaViva';
import type { TipoEdificio } from './vivoTypes';
import { registrarSaidaNarrativa } from './contextoNarrativo';
import { viajar } from './viagem';
import { narrarComModelo } from './llm';
const ok = (v: unknown, texto: string) => { if (!v) throw new Error(texto); console.log(`✓ ${texto}`); };
const nova = () => criarCampanha(C, { nome: 'Morador', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: 'assentamentos', marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
{
  const c = nova(), id = Object.keys(c.vivo!.cidades)[0]; c.localAtual = id;
  c.vivo!.fatos = [];
  const parente = c.familia!.membros[0].id;
  registrarFato(c, { tipo: 'teste', local: 'outro', texto: 'Notícia da família', atores: [parente], publico: true, conhecimento: 'confirmado' });
  for (let i = 0; i < 10; i++) registrarFato(c, { tipo: 'teste', local: 'outro', texto: `Notícia distante ${i}`, atores: [], publico: true, conhecimento: 'rumor' });
  const oculto = registrarFato(c, { tipo: 'teste', local: id, texto: 'CAUSA_SECRETA_456', atores: [], publico: false });
  registrarFato(c, { tipo: 'teste', local: id, texto: 'Consequência visível', atores: [], publico: true, causa: { id: oculto.id, texto: oculto.texto } });
  let pacote = montarPacote(C, c, calcularContexto(C, c), 'Você observa.');
  ok(pacote.mundoPersistente.fatos[0].texto === 'Notícia da família', 'Relevância familiar vence dez notícias recentes');
  ok(pacote.mundoPersistente.fatos.length === 6, 'Seleção narrativa mantém limite de contexto');
  ok(!JSON.stringify(pacote).includes('CAUSA_SECRETA_456'), 'Causa oculta não vaza por fato conhecido');
  ok(pacote.mundoPersistente.rumores.every(f => f.fonte === 'rumor') && pacote.mundoPersistente.confirmados.every(f => f.fonte !== 'rumor'), 'Fatos e rumores em canais separados');
  ok(!pacote.retornoAoLocal, 'Save sem observação não inventa visita anterior');
  registrarSaidaNarrativa(c);
  const nivel = c.vivo!.cidades[id].edificios.enfermaria;
  c.calendario.dia += 90;
  c.vivo!.cidades[id].edificios.enfermaria++;
  c.vivo!.cidades[id].fomeDias = 4;
  c.vivo!.cidades[id].projeto = { tipo: 'muralha', progresso: 2, necessario: 40 };
  c.continuidade!.locais[id].integridade = 15;
  const antes = JSON.stringify(c);
  pacote = montarPacote(C, c, calcularContexto(C, c), 'Você retorna.');
  ok(pacote.retornoAoLocal?.mudancas.some(m => m.aspecto === 'enfermaria' && m.antes === nivel && m.agora === nivel + 1), 'Retorno compara edifício atual com observação copiada');
  ok(pacote.retornoAoLocal?.diasDesdeUltimaSaida === 90, 'Retorno usa calendário do jogo');
  ok(pacote.local.atmosfera.includes('ruínas') && pacote.local.atmosfera.includes('fome') && pacote.local.atmosfera.includes('muralha'), 'Ruína, fome e obra substituem atmosfera estática');
  ok(JSON.stringify(c) === antes, 'Novo contexto continua puro');
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  ok(JSON.stringify(salvo.observacoesLocais) === JSON.stringify(c.observacoesLocais), 'Save preserva observações sem aliás com edifícios atuais');
  registrarSaidaNarrativa(c);
  ok(montarPacote(C, c, calcularContexto(C, c), '').retornoAoLocal?.mudancas.length === 0, 'Nova saída atualiza a referência e evita mudanças antigas');
  const ctx = calcularContexto(C, c);
  ctx.presentes = C.npcs.slice(0, 2);
  const vozes = montarPacote(C, c, ctx, '').presentes;
  ok(vozes.every((n, i) => n.voz === ctx.presentes[i].vozNarrativa && n.indole === ctx.presentes[i].personalidade), 'Voz e personalidade permanecem individualizadas por NPC');
}
{
  const c = nova(), origem = c.localAtual;
  ok(!viajar(C, c, 'destino_inexistente').ok && !c.observacoesLocais, 'Viagem negada não registra observação');
  const destino = C.locais.find(l => l.id === origem)!.rotas[0].destino;
  const dia = c.calendario.dia;
  ok(viajar(C, c, destino).ok && c.observacoesLocais?.[origem].dia === dia, 'Viagem real registra origem antes do avanço temporal');
}

// Captura o pedido real sem rede/chave: valida contrato enviado, não qualidade literária.
async function testarPedido() {
  const fetchOriginal = globalThis.fetch;
  let pedido = '';
  globalThis.fetch = async (_url, init) => {
    pedido = String(init?.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ narracao: 'Você tenta abrir o portão, mas ele permanece fechado. A tentativa falhou.' }) } }] }));
  };
  try {
    const c = nova();
    await narrarComModelo({ provider: 'openrouter', apiKey: 'fixture', modelo: 'fixture' }, C, c, calcularContexto(C, c), {
      fato: 'Você tentou abrir o portão — falhou.', acaoLivre: 'Abro o portão', custoPeriodos: 0, efeitosAplicados: [],
    });
    ok(pedido.includes('Resultado canônico') && pedido.includes('Falha continua falha'), 'Pedido enviado subordina intenção ao resultado da engine');
    ok(pedido.includes('não transfira memórias entre NPCs') && pedido.includes('versões incertas'), 'Pedido enviado exige vozes próprias e incerteza dos rumores');
    ok(!pedido.includes('faça acontecer exatamente'), 'Pedido enviado não contém ordem conflitante de sucesso automático');
  } finally { globalThis.fetch = fetchOriginal; }
}
testarPedido().catch(e => { console.error(e); process.exitCode = 1; });
for (const tipo of Object.keys(EDIFICIOS) as TipoEdificio[]) {
  const c = nova(), id = Object.keys(c.vivo!.cidades)[0], cidade = c.vivo!.cidades[id], povo = c.continuidade!.locais[id];
  c.localAtual = id; c.continuidade!.ameacas = []; c.calendario.dia = 1;
  cidade.materiais = 0;
  ok(!iniciarObra(c, id, tipo) && !cidade.projeto, `${tipo}: sem material não cria obra`);
  cidade.materiais = 200;
  ok(iniciarObra(c, id, tipo) && cidade.materiais === 200 - EDIFICIOS[tipo].materiais, `${tipo}: custo exato`);
  const nivel = cidade.edificios[tipo];
  ok(!iniciarObra(c, id, tipo), `${tipo}: não duplica projeto`);
  const pacote = montarPacote(C, c, calcularContexto(C, c), 'A obra começou.');
  ok(pacote.mundoPersistente.cidade?.obra?.tipo === tipo, `${tipo}: narrador recebe obra em andamento`);
  povo.populacao = 0; processarCidades(C, c);
  ok(cidade.projeto!.progresso === 0, `${tipo}: sem trabalhadores não progride`);
  povo.populacao = 60; cidade.comida = 600; povo.integridade = 100;
  c.mundo!.guerraAtiva = { a: 'vila', b: 'foragidos', local: id, diasRestantes: 10, impulsoA: 0, impulsoB: 0 };
  processarCidades(C, c); ok(cidade.projeto!.progresso === 0, `${tipo}: guerra interrompe`);
  c.mundo!.guerraAtiva = undefined;
  processarCidades(C, c); ok(cidade.projeto!.progresso > 0, `${tipo}: paz permite retomada`);
  const salvo = normalizarCampanha(C, JSON.parse(JSON.stringify(c)));
  ok(JSON.stringify(salvo.vivo!.cidades[id]) === JSON.stringify(cidade), `${tipo}: save preserva projeto e estoques`);
  for (let dia = 2; dia < 110 && cidade.edificios[tipo] === nivel; dia++) {
    c.calendario.dia = dia; processarCidades(C, c);
  }
  ok(cidade.edificios[tipo] === nivel + 1, `${tipo}: obra incrementa apenas um nível`);
  ok(c.vivo!.fatos.filter(f => f.tipo === 'obra_concluida' && f.local === id).length >= 1, `${tipo}: conclusão vira acontecimento`);
  cidade.projeto = undefined; cidade.edificios[tipo] = 5; cidade.materiais = 200;
  ok(!iniciarObra(c, id, tipo) && cidade.materiais === 200, `${tipo}: teto não consome materiais`);
}
{
  const c = nova(), id = Object.keys(c.vivo!.cidades)[0]; c.localAtual = id;
  registrarFato(c, { tipo: 'teste', local: id, texto: 'SEGREDO_NAO_REVELADO_819', atores: [], publico: false });
  registrarFato(c, { tipo: 'teste', local: id, texto: 'Uma caravana talvez esteja chegando.', atores: [], publico: true, conhecimento: 'rumor' });
  const antes = JSON.stringify(c);
  const pacote = montarPacote(C, c, calcularContexto(C, c), 'Você observa a comunidade.');
  ok(!JSON.stringify(pacote).includes('SEGREDO_NAO_REVELADO_819'), 'Fato histórico oculto não chega ao narrador');
  ok(pacote.mundoPersistente.fatos?.some(f => f.fonte === 'rumor'), 'Rumor chega identificado, não como confirmação');
  ok(JSON.stringify(c) === antes, 'Montar contexto não altera a campanha');
  ok(pacote.personagem.nome === 'Morador', 'Contexto identifica o protagonista desta campanha');
}
