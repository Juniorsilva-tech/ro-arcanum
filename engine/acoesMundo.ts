import type { Campaign, ContentBundle } from './types';
import type { TipoEdificio } from './vivoTypes';
import { iniciarMundoVivo, cidadeIdDoLocal, descobrirNoticias, registrarFato } from './historiaViva';
import { iniciarObra, EDIFICIOS } from './cidades';
import { encerrarMissao } from './missoesVivas';
import { avancarPeriodos } from './time';
import { avancarMundo } from './mundo';
import { crescerImpulsos } from './impulsos';
import { nextFloat } from './rng';
import { iniciarCombate } from './combat';
import { encontrosElegiveis } from './kimetsu';
import { processarSubidaDeNivel } from './progresso';

export type AcaoMundo =
  | { tipo: 'missao'; id: string; escolha: 'aceitar' | 'ajudar' | 'negociar' | 'investigar' | 'confrontar' }
  | { tipo: 'obra'; edificio: TipoEdificio }
  | { tipo: 'trabalhar' | 'descansar' | 'noticias' | 'libertar_se' }
  | { tipo: 'diplomacia'; a: string; b: string; escolha: 'mediar' | 'espionar' };
export type ResultadoAcaoMundo = { ok: boolean; texto: string; combate?: boolean };

export function executarAcaoMundo(content: ContentBundle, camp: Campaign, acao: AcaoMundo): ResultadoAcaoMundo {
  if (camp.combate && !camp.combate.terminado) return { ok: false, texto: 'Termine o combate primeiro.' };
  if (camp.familia && !camp.familia.prologoConcluido) return { ok: false, texto: 'Conclua a infância primeiro.' };
  iniciarMundoVivoSePreciso(content, camp);
  const v = camp.vivo!, p = camp.personagem, dia = camp.calendario.dia;
  if (p.condicoes.includes('cativo') && acao.tipo !== 'libertar_se') return { ok: false, texto: 'Você precisa recuperar a liberdade.' };
  const local = cidadeIdDoLocal(content, camp, camp.localAtual), c = local && v.cidades[local];
  const terminar = (texto: string, periodos = 1): ResultadoAcaoMundo => {
    camp.turno++; camp.capitulo.periodosDecorridos += periodos;
    camp.calendario = avancarPeriodos(camp.calendario, periodos);
    crescerImpulsos(camp, periodos); avancarMundo(content, camp); descobrirNoticias(content, camp);
    processarSubidaDeNivel(camp);
    return { ok: true, texto };
  };
  if (acao.tipo === 'libertar_se') {
    if (!p.condicoes.includes('cativo')) return { ok: false, texto: 'Você já está livre.' };
    const pagar = p.dinheiro >= 20;
    if (pagar) p.dinheiro -= 20;
    const escapou = pagar || nextFloat(camp.rng) < .65;
    if (escapou) p.condicoes = p.condicoes.filter(x => x !== 'cativo');
    registrarFato(camp, { tipo: escapou ? 'liberdade_jogador' : 'fuga_frustrada', local: camp.localAtual, texto: escapou ? 'Você recuperou a liberdade após o cativeiro.' : 'A tentativa de fuga falhou; os captores redobraram a atenção.', atores: ['jogador'], publico: false, conhecimento: 'testemunhado' });
    return terminar(escapou ? 'Você recuperou a liberdade.' : 'A tentativa falhou. Você aguarda outra oportunidade.', 3);
  }
  if (acao.tipo === 'noticias') {
    const noticia = v.fatos.find(f => f.publico && f.conhecimento === 'oculto' && dia - f.dia >= 2);
    if (noticia) noticia.conhecimento = 'rumor';
    descobrirNoticias(content, camp);
    return terminar(noticia ? `Você ouviu: ${noticia.texto}` : 'Você ouviu as notícias locais. Não surgiu informação nova.');
  }
  if (acao.tipo === 'descansar') {
    const custo = c ? 3 : 0;
    if (p.dinheiro < custo) return { ok: false, texto: 'A hospedagem custa 3 moedas. Trabalhe para pagar a estadia.' };
    p.dinheiro -= custo;
    for (const recurso of Object.keys(p.recursosMax)) p.recursos[recurso] = Math.min(p.recursosMax[recurso], (p.recursos[recurso] ?? 0) + Math.max(5, Math.ceil(p.recursosMax[recurso] * .35)));
    p.condicoes = p.condicoes.filter(x => !['agonizante', 'ferido'].includes(x));
    camp.impulsos.sono = 0;
    return terminar('Você descansou, recuperou parte das forças e deixou o mundo seguir por algumas horas.', 3);
  }
  if (acao.tipo === 'trabalhar') {
    if (!c || !local || c.tesouro < 6 || camp.continuidade!.locais[local].populacao === 0) return { ok: false, texto: 'Não há trabalho pago disponível nesta comunidade.' };
    c.tesouro -= 6; p.dinheiro += 6; c.materiais = Math.min(250, c.materiais + 3);
    return terminar('Você trabalhou na comunidade e recebeu 6 moedas.', 2);
  }
  if (acao.tipo === 'obra') {
    if (!local || local !== camp.localAtual || !c) return { ok: false, texto: 'Visite o centro da comunidade para propor uma obra.' };
    if (p.dinheiro < 15) return { ok: false, texto: 'A contribuição inicial custa 15 moedas.' };
    if (!iniciarObra(camp, local, acao.edificio)) return { ok: false, texto: 'Já existe uma obra, faltam materiais ou esse edifício atingiu o limite.' };
    p.dinheiro -= 15;
    return terminar(`${EDIFICIOS[acao.edificio].nome}: a construção começou. Os trabalhadores precisam de paz e alimento para concluí-la.`);
  }
  if (acao.tipo === 'diplomacia') {
    const a = v.governos[acao.a], b = v.governos[acao.b];
    if (!a || !b || acao.a === acao.b || !c || ![acao.a, acao.b].includes(c.governo ?? '')) return { ok: false, texto: 'Procure uma comunidade administrada por uma das facções envolvidas.' };
    const chave = `diplomacia.${[acao.a, acao.b].sort().join('.')}`;
    if (Number(camp.flags[chave] ?? -100) + 7 > dia) return { ok: false, texto: 'Aguarde uma semana para uma nova intervenção diplomática.' };
    if (p.dinheiro < 10) return { ok: false, texto: 'A negociação exige 10 moedas em deslocamentos e contatos.' };
    p.dinheiro -= 10; camp.flags[chave] = dia;
    if (acao.escolha === 'espionar') {
      const r = b.relacoes[acao.a] ?? 0;
      const texto = `Os contatos confirmaram que a relação entre as facções está ${r < -50 ? 'à beira de guerra' : r < 0 ? 'hostil' : 'cooperativa'}.`;
      registrarFato(camp, { tipo: 'espionagem', local: camp.localAtual, texto, atores: ['jogador'], publico: false, conhecimento: 'confirmado' });
      return terminar(texto, 2);
    }
    const sucesso = nextFloat(camp.rng) < Math.min(.9, .3 + p.atributos.social / 40);
    const delta = sucesso ? 20 : -5;
    a.relacoes[acao.b] = Math.max(-100, Math.min(100, (a.relacoes[acao.b] ?? 0) + delta)); b.relacoes[acao.a] = a.relacoes[acao.b];
    if (sucesso) {
      a.treguaAte[acao.b] = dia + 20; b.treguaAte[acao.a] = dia + 20;
      const guerra = camp.mundo?.guerraAtiva;
      if (guerra && [guerra.a, guerra.b].every(id => [acao.a, acao.b].includes(id))) { camp.mundo!.guerraAtiva = undefined; camp.mundo!.proximaGuerra = dia + 20; }
    }
    const texto = sucesso ? 'Sua mediação estabeleceu uma trégua de vinte dias.' : 'A negociação fracassou e agravou a desconfiança.';
    registrarFato(camp, { tipo: 'mediacao', local: camp.localAtual, texto, atores: ['jogador'], publico: true });
    return terminar(texto, 2);
  }
  if (acao.tipo !== 'missao') return { ok: false, texto: 'Ação desconhecida.' };
  const q = v.missoes.find(q => q.id === acao.id);
  if (!q || !q.conhecida || !['oferecida', 'aceita'].includes(q.estado) || dia > q.prazo) return { ok: false, texto: 'Essa missão não está disponível.' };
  if (acao.escolha === 'aceitar') {
    if (q.estado !== 'oferecida') return { ok: false, texto: 'Você já aceitou esse compromisso.' };
    q.estado = 'aceita';
    return terminar(`Você aceitou: ${q.titulo}.`);
  }
  if (q.estado !== 'aceita') return { ok: false, texto: 'Aceite o compromisso primeiro.' };
  const alvo = q.tipo === 'escoltar' && q.etapa > 0 ? q.destino : q.local;
  if (camp.localAtual !== alvo) return { ok: false, texto: `Você precisa chegar a ${content.locais.find(l => l.id === alvo)?.nome ?? alvo}.` };
  if (q.ator && !camp.npcState[q.ator]?.vivo) return { ok: false, texto: 'A pessoa envolvida morreu.' };
  const cidade = v.cidades[q.local];
  if (q.tipo === 'investigar') {
    const rival = q.rival && camp.kimetsu?.rivais[q.rival];
    if (!rival || !rival.vivo) return { ok: false, texto: 'O alvo já não está vivo.' };
    if (acao.escolha === 'investigar' && q.etapa === 0) {
      q.etapa = 1;
      registrarFato(camp, { tipo: 'pista_confirmada', local: q.local, texto: `Você encontrou rastros de ${rival.nome}. O alvo se oculta de dia e sai à noite.`, atores: [rival.id, 'jogador'], causa: q.causa, publico: false, conhecimento: 'confirmado' });
      return terminar(`Os rastros levam a ${rival.nome}. Retorne à noite para confrontá-lo.`);
    }
    if (acao.escolha !== 'confrontar' || q.etapa < 1) return { ok: false, texto: 'Investigue os rastros primeiro.' };
    if (!encontrosElegiveis(content, camp, [rival.criaturaId]).length) return { ok: false, texto: 'O alvo se esconde do sol; aguarde a noite.' };
    // Perseguir custa tempo como toda ação deste painel. Sem isso o confronto
    // era a única saída que não movia o calendário: dava para repeti-lo
    // infinitas vezes no mesmo instante, e o rival — que só recupera os
    // ferimentos quando o dia vira (ver engine/kimetsu.ts) — era moído numa
    // sequência de tentativas gratuitas.
    const alcance = terminar(`Você alcançou ${rival.nome}.`);
    // O período que passou pode ter trazido a luz do dia.
    if (!encontrosElegiveis(content, camp, [rival.criaturaId]).length) {
      return { ok: true, texto: 'Quando você chegou ao esconderijo, a luz já o protegia. Volte à noite.' };
    }
    iniciarCombate(content, camp, [rival.criaturaId]);
    return { ...alcance, combate: true };
  }
  if (q.tipo === 'escoltar') {
    if (q.etapa === 0) { q.etapa = 1; return terminar('As famílias se prepararam. Conduza-as até a comunidade de destino.'); }
    const origem = camp.continuidade?.locais[q.local], destino = q.destino && camp.continuidade?.locais[q.destino];
    if (!origem || !destino) return { ok: false, texto: 'O destino não é mais acessível.' };
    const quantidade = Math.min(4, origem.populacao);
    origem.populacao -= quantidade; destino.populacao += quantidade;
    encerrarMissao(camp, q, 'concluida', `${quantidade} moradores chegaram em segurança à nova comunidade.`);
    return terminar(q.desfecho!);
  }
  if (!cidade) return { ok: false, texto: 'A comunidade não está disponível.' };
  if (acao.escolha === 'negociar') {
    if (q.tentativas >= 2) return { ok: false, texto: 'Os contatos se esgotaram. A ajuda direta continua possível.' };
    q.tentativas++;
    if (nextFloat(camp.rng) >= Math.min(.85, .25 + p.atributos.social / 45)) {
      cidade.inseguranca = Math.min(100, cidade.inseguranca + 3);
      return terminar('A negociação falhou. O prazo continua correndo.', 2);
    }
  } else {
    if (p.dinheiro < 30) return { ok: false, texto: 'A ajuda direta custa 30 moedas.' };
    p.dinheiro -= 30;
  }
  if (q.tipo === 'abastecer') { cidade.comida = Math.min(600, cidade.comida + 120); cidade.fomeDias = 0; }
  if (q.tipo === 'tratar') { cidade.doenca = Math.max(0, cidade.doenca - 60); cidade.remedios = Math.min(80, cidade.remedios + 10); }
  if (q.tipo === 'reconstruir') { camp.continuidade!.locais[q.local].integridade = Math.min(100, camp.continuidade!.locais[q.local].integridade + 30); }
  if (q.tipo === 'resgatar' && q.ator && v.pessoas[q.ator]) {
    v.pessoas[q.ator].objetivo = 'trabalhar'; v.pessoas[q.ator].cativoAte = undefined;
    const familiar = camp.familia?.membros.find(m => m.id === q.ator);
    if (familiar) familiar.condicao = 'livre';
  }
  encerrarMissao(camp, q, 'concluida', `${q.titulo}: você organizou a ajuda e mudou a situação da comunidade.`);
  return terminar(q.desfecho!, 2);
}

function iniciarMundoVivoSePreciso(content: ContentBundle, camp: Campaign) {
  if (!camp.vivo) iniciarMundoVivo(content, camp);
}
