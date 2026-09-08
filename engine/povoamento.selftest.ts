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
import { localEfetivo } from './historiaViva';
import type { Campaign } from './types';

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
  ok(moradoresDe('tessel').length === 14, 'Tessel tem sempre o mesmo elenco');
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

console.log('Testes de povoamento e lugares ocultos passaram.');
