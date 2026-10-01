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
import { alternarOcultacao } from './aptidao';
import { maestriaDe, treinar } from './aptidao';
import { npcPorId } from './elenco';
import { localEfetivo } from './historiaViva';
import { treinarNpc } from './progressaoNpc';
import { concederDespertar } from './progresso';
import { multiplicadorDeDescanso, condicoesTratadasAoDescansar } from './classe';
import { encontroNoEsconderijo, prepararCombateDeBando } from './bandos';
import { forjar, desmanchar, temperar } from './forja';
import { conterMarca, DIAS_RECLUSAO_MARCA } from './marca';
import { escoltarCaravana } from './caravanas';
import {
  aceitarContrato,
  investigarPista,
  aplicarOleoAlquimico,
  iniciarConfrontoContrato,
} from './contratosMonstros';
import {
  treinarKatasCincoElementos,
  treinarCalejamentoPalmaDeFerro,
  meditarSobCascata,
  treinarEsgrimaNiten,
  PERIODOS_DE_TREINO,
} from './treinamentoImersivo';
import { fazerTrabalhoEspecializado, type TrabalhoEspecializadoId } from './trabalhosEspecializados';
import { conversarASos, apoiarDesejoNpc, confortarLutoNpc, presentearNpc } from './intimidadeNpc';

export type AcaoMundo =
  | { tipo: 'desafio'; id: string }
  | { tipo: 'atacar_esconderijo' }
  | { tipo: 'forjar'; molde: string; material: string; catalisador?: string }
  | { tipo: 'desmanchar'; itemId: string }
  | { tipo: 'temperar'; itemId: string }
  | { tipo: 'treinar_companheiro'; npcId: string }
  | { tipo: 'consolidar_legado' }
  | { tipo: 'conter_marca' }
  | { tipo: 'escoltar_caravana'; id: string }
  | { tipo: 'missao'; id: string; escolha: 'aceitar' | 'ajudar' | 'negociar' | 'investigar' | 'confrontar' }
  | { tipo: 'obra'; edificio: TipoEdificio }
  | { tipo: 'trabalhar' | 'descansar' | 'noticias' | 'libertar_se' | 'conter_se' }
  | { tipo: 'diplomacia'; a: string; b: string; escolha: 'mediar' | 'espionar' }
  | {
      tipo: 'treino_imersivo';
      modalidade: 'katas' | 'palma_ferro' | 'cascata' | 'niten';
      elemento?: 'terra' | 'agua' | 'fogo' | 'vento' | 'vazio';
    }
  | {
      tipo: 'contrato_monstro';
      contratoId: string;
      subacao: 'aceitar' | 'investigar' | 'preparar_oleo' | 'confrontar';
      pistaId?: string;
      oleoId?: string;
    }
  | {
      tipo: 'trabalho_especializado';
      trabalhoId: TrabalhoEspecializadoId;
    }
  | { tipo: 'conversar_a_sos'; npcId: string }
  | { tipo: 'apoiar_desejo_npc'; npcId: string }
  | { tipo: 'confortar_luto_npc'; npcId: string }
  | { tipo: 'presentear_npc'; npcId: string; itemId?: string };
export type ResultadoAcaoMundo = { ok: boolean; texto: string; combate?: boolean };

export function executarAcaoMundo(content: ContentBundle, camp: Campaign, acao: AcaoMundo): ResultadoAcaoMundo {
  if (camp.combate && !camp.combate.terminado) return { ok: false, texto: 'Termine o combate primeiro.' };
  if (camp.familia && !camp.familia.prologoConcluido) return { ok: false, texto: 'Conclua a infância primeiro.' };
  iniciarMundoVivoSePreciso(content, camp);
  const v = camp.vivo!, p = camp.personagem, dia = camp.calendario.dia;
  if (p.condicoes.includes('cativo') && acao.tipo !== 'libertar_se') return { ok: false, texto: 'Você precisa recuperar a liberdade.' };
  if (p.condicoes.includes('preso')) return { ok: false, texto: 'Você está na cela da guarda.' };
  const local = cidadeIdDoLocal(content, camp, camp.localAtual), c = local && v.cidades[local];
  const terminar = (texto: string, periodos = 1): ResultadoAcaoMundo => {
    camp.turno++; camp.capitulo.periodosDecorridos += periodos;
    camp.calendario = avancarPeriodos(camp.calendario, periodos);
    crescerImpulsos(camp, periodos); avancarMundo(content, camp); descobrirNoticias(content, camp);
    processarSubidaDeNivel(camp);
    return { ok: true, texto };
  };
  if (acao.tipo === 'atacar_esconderijo') {
    const e = encontroNoEsconderijo(content, camp);
    if ('erro' in e) return { ok: false, texto: e.erro };
    const r = terminar('Você avança sobre o esconderijo.', 1);
    iniciarCombate(content, camp, e.criaturas);
    prepararCombateDeBando(content, camp, e);
    return { ...r, combate: true };
  }
  if (acao.tipo === 'desafio') {
    const desafio = content.desafios?.find(d => d.id === acao.id && d.local === camp.localAtual);
    if (!desafio || camp.flags[`desafio.concluido.${desafio.id}`]) return { ok: false, texto: 'Esta expedição não está disponível aqui.' };
    const r = terminar(`Você se prepara para enfrentar ${desafio.titulo}.`, 1);
    iniciarCombate(content, camp, [desafio.criaturaId]);
    return { ...r, combate: true };
  }
  if (acao.tipo === 'treinar_companheiro') {
    const npc = npcPorId(content, camp, acao.npcId);
    if (!npc?.combatente || !camp.grupo?.includes(npc.id) || !camp.npcState[npc.id]?.vivo || localEfetivo(camp, npc, undefined, content) !== camp.localAtual) return { ok: false, texto: 'Convide um combatente presente para o grupo primeiro.' };
    if (p.dinheiro < 5) return { ok: false, texto: 'O treino exige 5 moedas em alimentação e material.' };
    if (!treinarNpc(camp, npc, 3)) return { ok: false, texto: 'Esse companheiro não pode treinar agora.' };
    p.dinheiro -= 5;
    treinar(content, camp, 'espada', { mestre: .5, esforco: .8, recursos: .7, observadorId: npc.id });
    return terminar(`Você e ${npc.nome} treinaram juntos. A prática melhora a capacidade de ambos.`, 2);
  }
  if (acao.tipo === 'conversar_a_sos') {
    const r = conversarASos(content, camp, acao.npcId);
    return r.ok ? terminar(r.texto, 1) : { ok: false, texto: r.texto };
  }
  if (acao.tipo === 'apoiar_desejo_npc') {
    const r = apoiarDesejoNpc(content, camp, acao.npcId);
    return r.ok ? terminar(r.texto, 1) : { ok: false, texto: r.texto };
  }
  if (acao.tipo === 'confortar_luto_npc') {
    const r = confortarLutoNpc(content, camp, acao.npcId);
    return r.ok ? terminar(r.texto, 1) : { ok: false, texto: r.texto };
  }
  if (acao.tipo === 'presentear_npc') {
    const r = presentearNpc(content, camp, acao.npcId);
    return r.ok ? terminar(r.texto, 1) : { ok: false, texto: r.texto };
  }
  if (acao.tipo === 'consolidar_legado') {
    if (!camp.flags['desafio.concluido.expedicao_cavaleira_do_eclipse'] || maestriaDe(camp, 'espada') < 80) return { ok: false, texto: 'Supere a prova do eclipse e alcance maestria 80 na lâmina.' };
    if (!concederDespertar(camp, 'dominou_prova_eclipse', 'você consolidou o legado da prova do eclipse')) return { ok: false, texto: 'Esse legado já faz parte de você.' };
    return terminar('O legado do eclipse se consolidou no seu corpo e na sua técnica.', 2);
  }
  if (acao.tipo === 'escoltar_caravana') {
    const r = escoltarCaravana(content, camp, acao.id);
    if (!r.ok) return r;
    // A escolta leva meio dia; a luta, se houver, começa depois disso.
    if (r.combate) return { ok: true, texto: r.texto, combate: true };
    return terminar(r.texto, 3);
  }
  if (acao.tipo === 'conter_marca') {
    const r = conterMarca(content, camp);
    if (!r.ok) return r;
    return terminar(r.texto, DIAS_RECLUSAO_MARCA * 6);
  }
  if (acao.tipo === 'libertar_se') {
    if (!p.condicoes.includes('cativo')) return { ok: false, texto: 'Você já está livre.' };
    const pagar = p.dinheiro >= 20;
    if (pagar) p.dinheiro -= 20;
    const escapou = pagar || nextFloat(camp.rng) < .65;
    if (escapou) p.condicoes = p.condicoes.filter(x => x !== 'cativo');
    registrarFato(camp, { tipo: escapou ? 'liberdade_jogador' : 'fuga_frustrada', local: camp.localAtual, texto: escapou ? 'Você recuperou a liberdade após o cativeiro.' : 'A tentativa de fuga falhou; os captores redobraram a atenção.', atores: ['jogador'], publico: false, conhecimento: 'testemunhado' });
    return terminar(escapou ? 'Você recuperou a liberdade.' : 'A tentativa falhou. Você aguarda outra oportunidade.', 3);
  }
  if (acao.tipo === 'conter_se') {
    // Mostrar menos do que se sabe é jogada, não passividade: atrasa fama e
    // reputação, e cobra o preço de aprender mais devagar (ver aptidao.ts).
    const agora = alternarOcultacao(camp);
    return terminar(
      agora
        ? 'Você decide medir o que mostra. Quem olhar vai ver menos do que existe.'
        : 'Você para de se conter. Daqui para a frente, o que você sabe aparece.',
      0,
    );
  }
  if (acao.tipo === 'noticias') {
    const noticia = v.fatos.find(f => f.publico && f.conhecimento === 'oculto' && dia - f.dia >= 2);
    if (noticia) noticia.conhecimento = 'rumor';
    descobrirNoticias(content, camp);
    return terminar(noticia ? `Você ouviu: ${noticia.texto}` : 'Você ouviu as notícias locais. Não surgiu informação nova.');
  }
  // A forja cuida do próprio tempo (engine/forja.ts): avança os períodos e o
  // mundo ela mesma, porque o tempo gasto depende de a peça ter saído ou não.
  if (acao.tipo === 'forjar') {
    const r = forjar(content, camp, acao.molde, acao.material, acao.catalisador);
    return { ok: r.ok, texto: r.texto };
  }
  if (acao.tipo === 'desmanchar') {
    const r = desmanchar(content, camp, acao.itemId);
    return { ok: r.ok, texto: r.texto };
  }
  if (acao.tipo === 'temperar') {
    const r = temperar(content, camp, acao.itemId);
    return { ok: r.ok, texto: r.texto };
  }
  if (acao.tipo === 'descansar') {
    const custo = c ? 3 : 0;
    if (p.dinheiro < custo) return { ok: false, texto: 'A hospedagem custa 3 moedas. Trabalhe para pagar a estadia.' };
    p.dinheiro -= custo;
    // Cacadora recupera mais; curandeira trata mais coisa (engine/classe.ts).
    const mult = multiplicadorDeDescanso(camp);
    for (const recurso of Object.keys(p.recursosMax)) p.recursos[recurso] = Math.min(p.recursosMax[recurso], (p.recursos[recurso] ?? 0) + Math.max(5, Math.ceil(p.recursosMax[recurso] * .35 * mult)));
    const tratadas = condicoesTratadasAoDescansar(camp);
    p.condicoes = p.condicoes.filter(x => !tratadas.includes(x));
    camp.impulsos.sono = 0;
    return terminar('Você descansou, recuperou parte das forças e deixou o mundo seguir por algumas horas.', 3);
  }
  if (acao.tipo === 'trabalhar') {
    if (!c || !local || c.tesouro < 6 || camp.continuidade!.locais[local].populacao === 0) return { ok: false, texto: 'Não há trabalho pago disponível nesta comunidade.' };
    c.tesouro -= 6; p.dinheiro += 6; c.materiais = Math.min(250, c.materiais + 3);
    return terminar('Você trabalhou na comunidade e recebeu 6 moedas.', 2);
  }
  if (acao.tipo === 'trabalho_especializado') {
    const r = fazerTrabalhoEspecializado(content, camp, acao.trabalhoId);
    if (!r.ok) return { ok: false, texto: r.texto };
    return terminar(r.texto, r.periodos);
  }
  if (acao.tipo === 'treino_imersivo') {
    switch (acao.modalidade) {
      case 'katas': {
        const res = treinarKatasCincoElementos(camp, acao.elemento ?? 'terra', content);
        if (!res.ok) return { ok: false, texto: res.mensagem };
        return terminar(res.mensagem, PERIODOS_DE_TREINO);
      }
      case 'palma_ferro': {
        const res = treinarCalejamentoPalmaDeFerro(camp, content);
        if (!res.ok) return { ok: false, texto: res.mensagem };
        return terminar(res.mensagem, PERIODOS_DE_TREINO);
      }
      case 'cascata': {
        const res = meditarSobCascata(camp);
        if (!res.ok) return { ok: false, texto: res.mensagem };
        return terminar(res.mensagem, PERIODOS_DE_TREINO);
      }
      case 'niten': {
        const res = treinarEsgrimaNiten(camp, content);
        if (!res.ok) return { ok: false, texto: res.mensagem };
        return terminar(res.mensagem, PERIODOS_DE_TREINO);
      }
    }
  }
  if (acao.tipo === 'contrato_monstro') {
    switch (acao.subacao) {
      case 'aceitar': {
        const res = aceitarContrato(camp, acao.contratoId, content);
        return { ok: res.ok, texto: res.mensagem };
      }
      case 'investigar': {
        const res = investigarPista(camp, acao.contratoId, acao.pistaId ?? '', content);
        // Recusa (lugar errado, contrato em outra fase) não gasta tempo.
        if (!res.ok) return { ok: false, texto: res.mensagem };
        return terminar(res.mensagem, 1);
      }
      case 'preparar_oleo': {
        const res = aplicarOleoAlquimico(camp, acao.oleoId ?? '', content);
        return { ok: res.ok, texto: res.mensagem };
      }
      case 'confrontar': {
        const res = iniciarConfrontoContrato(camp, acao.contratoId, content);
        if (!res.ok) return { ok: false, texto: res.mensagem };
        return { ok: true, texto: res.mensagem, combate: true };
      }
    }
  }
  if (acao.tipo === 'obra') {
    if (!local || local !== camp.localAtual || !c) return { ok: false, texto: 'Visite o centro da comunidade para propor uma obra.' };
    if (p.dinheiro < 15) return { ok: false, texto: 'A contribuição inicial custa 15 moedas.' };
    if (!iniciarObra(camp, local, acao.edificio, content)) return { ok: false, texto: 'Já existe uma obra, faltam materiais ou esse edifício atingiu o limite.' };
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
    q.estado = 'aceita'; q.aceitaEm = dia;
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
    if (rival.local !== camp.localAtual) {
      q.local = rival.local; q.etapa = 0;
      return terminar('O esconderijo está vazio. Novos rastros indicam outra região; será preciso investigar novamente.');
    }
    if (!encontrosElegiveis(content, camp, [rival.criaturaId]).length) return { ok: false, texto: 'O alvo se esconde do sol; aguarde a noite.' };
    // Perseguir custa tempo como toda ação deste painel. Sem isso o confronto
    // era a única saída que não movia o calendário: dava para repeti-lo
    // infinitas vezes no mesmo instante, e o rival — que só recupera os
    // ferimentos quando o dia vira (ver engine/kimetsu.ts) — era moído numa
    // sequência de tentativas gratuitas.
    const alcance = terminar(`Você alcançou ${rival.nome}.`);
    if (!rival.vivo || rival.local !== camp.localAtual || !['oferecida', 'aceita'].includes(q.estado)) return { ok: true, texto: 'Durante a aproximação, a situação mudou. Consulte o compromisso e os novos rastros.' };
    // O período que passou pode ter trazido a luz do dia.
    if (!encontrosElegiveis(content, camp, [rival.criaturaId]).length) {
      return { ok: true, texto: 'Quando você chegou ao esconderijo, a luz já o protegia. Volte à noite.' };
    }
    iniciarCombate(content, camp, [rival.criaturaId], rival.id);
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
