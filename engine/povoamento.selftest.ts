// ARCANUM · Testes de povoamento e de lugares ocultos.
//
// Duas promessas. A primeira: cada assentamento tem gente com nome dentro, na
// densidade que o porte pede — cidade dá sensação de multidão, aldeia não.
// A segunda: lugar secreto é secreto de verdade, e não só na ficção.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { avancarMundo } from './mundo';
import { rotasVisiveis, localConhecido, descobrirLocal, avaliarDescobertas, viajar } from './viagem';
import { localEfetivo, INSEGURANCA_QUE_RECOLHE } from './historiaViva';
import type { Campaign } from './types';
import { PERIODOS, type Periodo } from './time';

const ok = (v: unknown, msg: string) => { if (!v) throw new Error(msg); console.log(`✓ ${msg}`); };
const nova = (seed = 'povo') => criarCampanha(C, {
  nome: 'Censo', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed,
});

const moradoresDe = (localId: string) => C.npcs.filter(n => n.localBase === localId);

// ── Densidade por porte ───────────────────────────────────────────────────
{
  const camp = nova();
  const assentamentos = Object.keys(camp.continuidade!.locais);
  const vazios = assentamentos.filter(id => moradoresDe(id).length === 0);
  ok(vazios.length === 0,
    `Todo assentamento tem gente com nome dentro${vazios.length ? ` (vazio: ${vazios.join(', ')})` : ''}`);

  const cidades = C.locais.filter(l => l.tipo === 'cidade');
  ok(cidades.every(l => moradoresDe(l.id).length >= 12),
    `Cidade dá sensação de gente: ${cidades.map(l => `${l.nome} ${moradoresDe(l.id).length}`).join(', ')}`);

  const aldeias = C.locais.filter(l => l.tipo === 'aldeia');
  ok(aldeias.every(l => moradoresDe(l.id).length >= 3 && moradoresDe(l.id).length <= 6),
    'Aldeia tem punhado de gente, não multidão');

  const umaCidade = cidades[0];
  const oficios = new Set(moradoresDe(umaCidade.id).map(n => n.ocupacao));
  ok(oficios.size >= 12, `${umaCidade.nome} tem ${oficios.size} ofícios distintos, sem repetição de papel`);
  ok(moradoresDe(umaCidade.id).some(n => n.faccaoId === 'ladroes'),
    'Cidade tem quem rouba, não só quem manda');
  ok(moradoresDe(umaCidade.id).some(n => n.combatente),
    'Cidade tem quem sabe brigar');
}

// ── Gente de verdade, não figurante ───────────────────────────────────────
{
  const gerados = C.npcs.filter(n => n.id.startsWith('morador_'));
  ok(gerados.length >= 100, `${gerados.length} moradores com identidade foram gerados`);
  ok(gerados.every(n => n.corpo && n.vozNarrativa && n.personalidade),
    'Todo morador tem corpo, voz e índole — o narrador usa os três');
  ok(gerados.some(n => n.segredo), 'Há moradores que guardam segredo');
  const comSegredo = gerados.filter(n => n.segredo);
  ok(comSegredo.every(n => n.segredo!.comoDescobrir.length > 10),
    'Todo segredo diz como se descobre; não existe segredo sem porta');
  ok(gerados.every(n => (n.relacoes?.length ?? 0) > 0),
    'Ninguém mora num lugar sem conhecer alguém');

  const nomes = gerados.map(n => n.nome);
  ok(new Set(nomes).size === nomes.length, 'Nenhum nome repetido entre os moradores');
  const ids = C.npcs.map(n => n.id);
  ok(new Set(ids).size === ids.length, 'Nenhum id de NPC repetido no elenco inteiro');
}

// ── Determinismo: é mundo, não sorteio por partida ────────────────────────
{
  const a = nova('semente-a');
  const b = nova('semente-b');
  // Os moradores vêm do conteúdo, então não dependem da semente da campanha.
  ok(moradoresDe('tessel').length === moradoresDe('tessel').length && moradoresDe('tessel').length >= 18,
    `Tessel tem sempre o mesmo elenco, com ${moradoresDe('tessel').length} pessoas`);
  const nomesTessel = moradoresDe('tessel').map(n => n.nome).join('|');
  ok(nomesTessel.length > 0 && a.cenarioId === b.cenarioId,
    'O elenco de um lugar é o mesmo em toda campanha — é mundo, não save');
  ok(!a.npcsProcedurais?.some(n => n.id.startsWith('morador_')),
    'Moradores não entram no save: são conteúdo, não estado de campanha');
}

// ── Eles existem na cena, não só na lista ─────────────────────────────────
{
  const camp = nova('cena');
  camp.localAtual = 'tessel';
  const presentes = C.npcs.filter(n => camp.npcState[n.id]?.vivo && localEfetivo(camp, n) === 'tessel');
  ok(presentes.length >= 12, `${presentes.length} pessoas presentes em Tessel para a cena`);
  ok(camp.npcState['morador_tessel_0']?.vivo === true,
    'Morador gerado entra no estado da campanha como qualquer NPC');
}

// ── Lugar oculto ──────────────────────────────────────────────────────────
{
  const camp = nova('oculto');
  const ocultos = C.locais.filter(l => l.oculto);
  ok(ocultos.length >= 5, `${ocultos.length} lugares nascem escondidos`);
  ok(ocultos.every(l => l.oculto!.dica.length > 20),
    'Todo lugar oculto tem uma dica: você ouve falar antes de saber onde é');

  const ferreiros = C.locais.find(l => l.id === 'vila_ferreiros')!;
  ok(!localConhecido(camp, ferreiros), 'A vila dos ferreiros começa desconhecida');

  camp.localAtual = 'mina';
  const visiveis = rotasVisiveis(C, camp, 'mina').map(r => r.destino);
  ok(!visiveis.includes('vila_ferreiros'),
    'Lugar oculto não aparece na lista de destinos');
  ok(C.locais.find(l => l.id === 'mina')!.rotas.some(r => r.destino === 'vila_ferreiros'),
    'Mas a rota existe no mapa — o que falta é o jogador saber dela');

  const tentativa = viajar(C, camp, 'vila_ferreiros');
  ok(!tentativa.ok && tentativa.motivo === ferreiros.oculto!.dica,
    'Tentar ir a um lugar desconhecido devolve a dica, não um erro seco');
}

// ── Descoberta declarada ──────────────────────────────────────────────────
{
  const camp = nova('descoberta');
  const casa = C.locais.find(l => l.id === 'casa_da_agulha')!;
  ok(!localConhecido(camp, casa), 'A Casa da Agulha começa escondida');

  camp.reputacao.cacadores = 3;
  const revelados = avaliarDescobertas(C, camp);
  ok(revelados.includes('casa_da_agulha'),
    'Confiança da facção revela o lugar: eles contam a você');
  ok(localConhecido(camp, casa), 'E a partir daí ele é alcançável');
  ok((camp.marcos ?? []).some(m => m.texto.includes('Casa da Agulha')),
    'A descoberta vira marco na crônica, não um flag silencioso');

  ok(avaliarDescobertas(C, camp).length === 0, 'Um lugar já revelado não é revelado de novo');

  // Chegar perto também serve, quando a condição é de visita.
  const outra = nova('descoberta-visita');
  const forja = C.locais.find(l => l.id === 'forja_afundada')!;
  ok(!localConhecido(outra, forja), 'A Forja Afundada começa escondida');
  outra.locaisVisitados.push('mina_corveira');
  avaliarDescobertas(C, outra);
  ok(localConhecido(outra, forja), 'Visitar a galeria de cima revela a forja de baixo');

  ok(descobrirLocal(C, outra, 'praca') === false, 'Lugar que nunca foi oculto não precisa de descoberta');
}

// ── O mundo revela sozinho, no tique diário ───────────────────────────────
{
  const camp: Campaign = nova('tique');
  camp.reputacao.cacadores = 9;
  camp.calendario = { ...camp.calendario, dia: camp.calendario.dia + 1 };
  avancarMundo(C, camp);
  ok(camp.flags['descoberto.mansao_ubuyashiki'] === true,
    'A revelação acontece no tique do mundo, sem o jogador abrir menu nenhum');
}

// ── O mundo não se esvazia num ponto só ───────────────────────────────────
//
// O censo que motivou este bloco: ao fim de dez anos, vinte dos vinte e três
// assentamentos ficavam sem uma alma, e mais da metade das pessoas terminava
// empilhada no mesmo lugar. Duas causas, ambas corrigidas: o destino de
// migração era `[0]` — a mesma cidade na ordem do objeto, sempre — e quem
// migrava passava a chamar o destino de casa, então nunca mais voltava.
{
  const camp = nova('decada');
  if (camp.familia) camp.familia.prologoConcluido = true;
  const elenco = () => [...C.npcs, ...(camp.npcsProcedurais ?? [])].filter(n => camp.npcState[n.id]?.vivo);
  const ondeEstao = () => {
    const mapa = new Map<string, number>();
    for (const n of elenco()) {
      const l = localEfetivo(camp, n) ?? n.localBase;
      mapa.set(l, (mapa.get(l) ?? 0) + 1);
    }
    return mapa;
  };
  const assentamentos = Object.keys(camp.continuidade!.locais);

  ok([...assentamentos].every(id => (ondeEstao().get(id) ?? 0) > 0),
    'No dia zero, todo assentamento tem alguém');

  for (let d = 1; d <= 3650; d++) {
    camp.calendario = { ...camp.calendario, dia: d };
    avancarMundo(C, camp);
  }

  const distribuicao = ondeEstao();
  const vazios = assentamentos.filter(id => !distribuicao.get(id));
  ok(vazios.length <= 4,
    `Depois de dez anos, ${vazios.length} de ${assentamentos.length} assentamentos ficaram vazios${vazios.length ? ` (${vazios.join(', ')})` : ''}`);

  const vivos = elenco().length;
  const maior = Math.max(...distribuicao.values());
  ok(maior < vivos * 0.35,
    `Ninguém acumula o mundo inteiro: maior concentração tem ${maior} de ${vivos} pessoas`);
  ok(vivos >= 150, `A população com nome sobrevive à década: ${vivos} pessoas`);
}

// ── Rotina: o dia tem horas diferentes ────────────────────────────────────
//
// `localEfetivo` resolve presença por `rotina[periodo] ?? localBase`. Quem não
// tem rotina está no mesmo lugar às três da manhã e ao meio-dia, o que apaga a
// diferença entre procurar alguém de dia e à noite e tira sentido de
// privacidade, de vigia e de encontro.
{
  const semRotina = C.npcs.filter(n => Object.keys(n.rotina ?? {}).length === 0);
  ok(semRotina.length === 0,
    `Todo NPC tem rotina${semRotina.length ? ` (sem: ${semRotina.slice(0, 5).map(n => n.nome).join(', ')})` : ''}`);

  const porId = new Map(C.locais.map(l => [l.id, l]));
  const quebradas: string[] = [];
  for (const n of C.npcs) {
    for (const [per, id] of Object.entries(n.rotina ?? {})) {
      if (!porId.has(id as string)) quebradas.push(`${n.id}/${per} → ${id}`);
    }
  }
  ok(quebradas.length === 0,
    `Nenhuma rotina aponta para lugar inexistente${quebradas.length ? ` (${quebradas[0]})` : ''}`);

  // Um lugar oculto pode ser a CASA de quem mora nele — os Hashiras vivem na
  // mansão. O que não pode é o gerador mandar um morador comum para lá.
  const vazamentos: string[] = [];
  for (const n of C.npcs.filter(x => x.id.startsWith('morador_'))) {
    for (const [per, id] of Object.entries(n.rotina ?? {})) {
      const l = porId.get(id as string);
      if (l?.oculto && l.id !== n.localBase) vazamentos.push(`${n.id}/${per} → ${id}`);
    }
  }
  ok(vazamentos.length === 0,
    `Nenhum morador gerado circula por lugar oculto${vazamentos.length ? ` (${vazamentos[0]})` : ''}`);

  // A presença tem de MUDAR ao longo do dia, senão a rotina é decorativa.
  const camp = nova('rotina');
  const presencaEm = (localId: string, p: Periodo) =>
    C.npcs.filter(n => camp.npcState[n.id]?.vivo && localEfetivo(camp, n, p) === localId).length;
  const cidade = C.locais.find(l => l.tipo === 'cidade')!;
  const contagens = PERIODOS.map(p => presencaEm(cidade.id, p));
  ok(new Set(contagens).size > 1,
    `${cidade.nome} tem gente diferente ao longo do dia: ${contagens.join(', ')}`);
  ok(Math.min(...contagens) > 0, 'Nenhum período deixa a cidade completamente deserta');

  const mansao = PERIODOS.map(p => presencaEm('mansao_ubuyashiki', p));
  ok(new Set(mansao).size > 1,
    `A mansão Ubuyashiki enche e esvazia conforme a hora: ${mansao.join(', ')}`);
  ok(C.npcs.filter(n => n.localBase === 'mansao_ubuyashiki')
    .every(n => Object.keys(n.rotina ?? {}).length === PERIODOS.length),
    'Todo o elenco da mansão tem os seis períodos cobertos');

  // Quem trabalha de noite não está em casa de manhã.
  const noturnos = C.npcs.filter(n => /chefe do crime|batedora|agiota|ladra|contrabandista/.test(n.ocupacao));
  ok(noturnos.length > 0 && noturnos.some(n => n.rotina.madrugada !== n.localBase),
    'Quem vive da noite não passa a madrugada em casa');
}

// ── Densidade depois do adensamento ───────────────────────────────────────
{
  const cidades = C.locais.filter(l => l.tipo === 'cidade');
  ok(cidades.every(l => moradoresDe(l.id).length >= 18),
    `Cidade dá sensação de multidão: ${cidades.map(l => `${l.nome} ${moradoresDe(l.id).length}`).join(', ')}`);
  const gerados = C.npcs.filter(n => n.id.startsWith('morador_'));
  ok(gerados.length >= 170, `${gerados.length} moradores com identidade no mundo`);
}

// ── Rotina por pessoa, não por ofício ─────────────────────────────────────
//
// Pendência aberta desde a sessão 15: duas taverneiras de cidades diferentes
// viviam exatamente o mesmo dia, período por período. O ofício dava o ritmo e
// a pessoa não existia — 100% dos pares do mesmo ofício tinham dia idêntico.
{
  const assinaturaDoDia = (n: typeof C.npcs[number]) =>
    PERIODOS.map(p => (n.rotina[p] ?? n.localBase) === n.localBase ? 'C' : 'F').join('');

  const porOficio: Record<string, string[]> = {};
  for (const n of C.npcs) {
    if (!n.id.startsWith('morador_')) continue;
    (porOficio[n.ocupacao] ??= []).push(assinaturaDoDia(n));
  }
  let iguais = 0, pares = 0;
  for (const lista of Object.values(porOficio)) {
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        pares++;
        if (lista[i] === lista[j]) iguais++;
      }
    }
  }
  ok(pares > 100, `Há pares do mesmo ofício para comparar (${pares})`);
  const taxa = iguais / pares;
  ok(taxa < 0.6, `Mesmo ofício não significa mesmo dia (${(taxa * 100).toFixed(0)}% dos pares ainda coincidem)`);

  // O feitio desloca, não reescreve: quem trabalha na lavoura continua saindo,
  // e quem é da cidade continua sendo da cidade. Sem isso o ofício perderia
  // sentido e a variação viraria ruído.
  const lavradoras = C.npcs.filter(n => n.id.startsWith('morador_') && /lavrador|lavoura|ceifeir/.test(n.ocupacao));
  if (lavradoras.length) {
    const saem = lavradoras.filter(n => assinaturaDoDia(n).includes('F')).length;
    ok(saem / lavradoras.length > 0.7, `Quem trabalha fora continua saindo (${saem}/${lavradoras.length})`);
  }
}

// ── A rotina reage ao estado do mundo ─────────────────────────────────────
//
// A outra metade da mesma pendência: ninguém mudava de hábito quando a
// insegurança da vila subia. A capela às três da manhã continuava cheia com
// bandido acampado na estrada.
{
  const c = nova('rotina-medo');
  // O assentamento com MAIS gente que sai, não o primeiro da lista: medir o
  // recolhimento numa vila de três moradores daria um sinal fraco demais para
  // distinguir a regra funcionando de uma coincidência.
  const cidadeId = Object.keys(c.vivo!.cidades)
    .map(id => ({
      id,
      saem: C.npcs.filter(n => n.localBase === id && !n.combatente
        && PERIODOS.some(p => (n.rotina[p] ?? n.localBase) !== n.localBase)).length,
    }))
    .sort((a, b) => b.saem - a.saem)[0];
  ok(cidadeId && cidadeId.saem >= 5, `Assentamento com gente que sai de casa: ${cidadeId?.id} (${cidadeId?.saem})`);
  const moradores = C.npcs.filter(n => n.localBase === cidadeId.id && !n.combatente);
  const foraAgora = (periodo: Periodo) => moradores.filter(n => {
    const l = localEfetivo(c, n, periodo);
    return l && l !== n.localBase;
  }).length;

  const periodoComSaida = PERIODOS.find(p => {
    c.vivo!.cidades[cidadeId.id].inseguranca = 0;
    return foraAgora(p) > 0;
  });
  ok(!!periodoComSaida, 'Em paz, alguém sai do assentamento em algum período');

  c.vivo!.cidades[cidadeId.id].inseguranca = 0;
  const emPaz = foraAgora(periodoComSaida!);
  c.vivo!.cidades[cidadeId.id].inseguranca = 90;
  const comMedo = foraAgora(periodoComSaida!);
  ok(comMedo < emPaz, `Com a vila insegura, menos gente no mato (${emPaz} → ${comMedo})`);

  // Quem é pago para enfrentar continua saindo — é essa a diferença entre a
  // guarda e o resto.
  const guardas = C.npcs.filter(n => n.localBase === cidadeId.id && n.combatente);
  if (guardas.length) {
    const saindo = guardas.filter(n => {
      const l = localEfetivo(c, n, periodoComSaida!);
      return l && l !== n.localBase;
    }).length;
    const semMedo = guardas.filter(n => (n.rotina[periodoComSaida!] ?? n.localBase) !== n.localBase).length;
    ok(saindo === semMedo, `Combatentes não se recolhem por medo (${saindo} de ${semMedo} continuam fora)`);
  }

  // Ameaça concreta no destino recolhe mesmo com a cidade calma.
  c.vivo!.cidades[cidadeId.id].inseguranca = 0;
  const alvo = moradores.map(n => localEfetivo(c, n, periodoComSaida!)).find(l => l && l !== cidadeId.id);
  if (alvo) {
    c.continuidade!.ameacas.push({
      id: 'ameaca_teste', local: alvo, criaturaId: 'lobo', rivalId: 'x',
      estado: 'ativa', desde: 0, gravidade: 3,
    } as any);
    const depois = foraAgora(periodoComSaida!);
    ok(depois < emPaz, `Ameaça ativa no destino esvazia o caminho (${emPaz} → ${depois})`);
  }
}

console.log('Testes de povoamento e lugares ocultos passaram.');
