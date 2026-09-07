// ARCANUM · Save antigo não pode virar tela branca.
//
// A campanha é serializada inteira em JSON e relida com um cast. Isso funciona
// enquanto o formato não muda — e ele mudou várias vezes: questEstado, equipado,
// marcos, mundo, ecos e opcoesUsadas nasceram depois dos primeiros saves. Pior:
// o elenco foi reescrito e os ids dos NPCs mudaram, então um save velho aponta
// para gente que não existe mais.
//
// Aqui o save é normalizado ao ser carregado. O que dá para completar, completa;
// o que aponta para o vazio, sai. O jogador não perde a campanha por causa de
// um campo que ainda não existia quando ele começou.
import type { Campaign, ContentBundle, NpcDinamico } from './types';
import { mundoInicial } from './mundo';
import { inicializarKimetsu, VERSAO_COMBATE } from './kimetsu';
import { iniciarContinuidade } from './continuidade';
import { iniciarFamilia } from './familia';
import { migrarProgressaoNpcs } from './progressaoNpc';
import { recalcularRecursosMaximos } from './progresso';
import { iniciarMundoVivo } from './historiaViva';
import { migrarAptidao } from './aptidao';

function novoNpcDinamico(content: ContentBundle): NpcDinamico {
  const eixos: Record<string, number> = {};
  for (const e of content.cenario.eixosRelacao) eixos[e.id] = 0;
  return { eixos, vivo: true, tensao: 0, memoria: [] };
}

export function normalizarCampanha(content: ContentBundle, bruto: Campaign): Campaign {
  const camp = bruto;

  // ── Campos que nasceram depois ──────────────────────────────────────────
  camp.flags ??= {};
  inicializarKimetsu(camp);
  camp.npcsProcedurais ??= [];
  camp.npcState ??= {};
  camp.grupo = (camp.grupo ?? []).filter(id => {
    const n = [...content.npcs, ...(camp.npcsProcedurais ?? [])].find(n => n.id === id);
    return !!n?.combatente && camp.npcState?.[id]?.vivo !== false;
  }).slice(0, 2);
  camp.reputacao ??= {};
  camp.segredosRevelados ??= [];
  camp.locaisVisitados ??= [];
  camp.cronica ??= [];
  camp.turno ??= 0;
  camp.opcoesUsadas ??= [];
  camp.marcos ??= [];
  camp.ecos ??= [];

  // Toda missão do conteúdo precisa de estado, inclusive as que não existiam.
  camp.questEstado ??= {};
  for (const q of content.quests) camp.questEstado[q.id] ??= 'desconhecida';

  // Toda facção precisa de uma linha de reputação.
  for (const f of content.faccoes) camp.reputacao[f.id] ??= 0;

  // ── Personagem ───────────────────────────────────────────────────────────
  const p = camp.personagem;
  p.equipado ??= {};
  p.inventario ??= {};
  p.pericias ??= {};
  p.artesConhecidas ??= [];
  p.alcunhas ??= [];
  p.cicatrizes ??= [];
  p.condicoes ??= [];
  p.pressoes ??= {};
  for (const pr of content.cenario.pressoes) p.pressoes[pr.id] ??= 0;
  p.idade ??= 20;
  camp.almasSeladas ??= [];

  // Save de antes da infância virar escolha do jogador guardava
  // genio/indigno/tragedia como booleans soltos em vez de marca+reacao (ver
  // engine/genese.ts). Traduz o que já tinha em vez de perder a gênese.
  if (camp.genese && !(camp.genese as unknown as Record<string, unknown>).marca) {
    const g = camp.genese as unknown as { genio?: boolean; indigno?: boolean; tragedia?: boolean };
    camp.genese.marca = g.tragedia ? 'tragedia' : g.genio ? 'genio' : g.indigno ? 'indigno' : 'comum';
    camp.genese.reacao ??= 'entendimento';
  }
  // Equipamento que aponta para item apagado do catálogo sai do slot.
  for (const slot of ['arma', 'armadura', 'escudo', 'acessorio'] as const) {
    const id = p.equipado[slot];
    if (id && !content.itens.some((i) => i.id === id)) delete p.equipado[slot];
  }
  // Item do inventário que não existe mais também.
  for (const id of Object.keys(p.inventario)) {
    if (!content.itens.some((i) => i.id === id)) delete p.inventario[id];
  }

  // ── Elenco ───────────────────────────────────────────────────────────────
  // O nome dos NPCs mudou quando o vale foi reescrito. Quem sumiu, sai; quem
  // chegou, entra zerado. Sem isso, um save velho procura gente que não existe.
  for (const id of Object.keys(camp.npcState)) {
    if (![...content.npcs, ...(camp.npcsProcedurais ?? [])].some((n) => n.id === id)) delete camp.npcState[id];
  }
  for (const n of content.npcs) {
    camp.npcState[n.id] ??= novoNpcDinamico(content);
    const din = camp.npcState[n.id];
    din.memoria ??= [];
    din.eixos ??= {};
    for (const e of content.cenario.eixosRelacao) din.eixos[e.id] ??= 0;
  }
  if (camp.familia) {
    iniciarFamilia(content, camp);
    for (const n of camp.npcsProcedurais ?? []) camp.npcState[n.id] ??= novoNpcDinamico(content);
  }
  if (camp.cenarioId === 'vaelhorn' && !camp.flags['versao.idades_kimetsu']) {
    const basesAntigas: Record<string, number> = { tanjiro: 26, nezuko: 23, giyu: 21, shinobu: 24, rengoku: 24, muichiro: 22, mitsuri: 21, obanai: 25, sanemi: 26, tengen: 27 };
    for (const [id, base] of Object.entries(basesAntigas)) {
      const din = camp.npcState[id];
      const npc = content.npcs.find(n => n.id === id);
      if (din?.idade !== undefined && npc) din.idade = npc.idade + Math.max(0, din.idade - base);
    }
    camp.flags['versao.idades_kimetsu'] = 1;
  }
  camp.segredosRevelados = camp.segredosRevelados.filter((id) =>
    [...content.npcs, ...(camp.npcsProcedurais ?? [])].some((n) => n.id === id),
  );

  // ── Onde ele está ────────────────────────────────────────────────────────
  if (!content.locais.some((l) => l.id === camp.localAtual)) {
    camp.localAtual = content.localInicial;
  }
  camp.locaisVisitados = camp.locaisVisitados.filter((id) =>
    content.locais.some((l) => l.id === id),
  );

  // ── O vale ───────────────────────────────────────────────────────────────
  // Aptidao/maestria nasceram depois: reconstroi do que o save ja tinha.
  migrarAptidao(camp);
  camp.mundo ??= mundoInicial(camp);
  iniciarContinuidade(content, camp);
  iniciarMundoVivo(content, camp);
  migrarProgressaoNpcs(content, camp);
  // One-time migration, deferred during a saved combat so actors stay coherent.
  if (!camp.flags['versao.legados'] && (!camp.combate || camp.combate.terminado)) {
    recalcularRecursosMaximos(camp);
    camp.flags['versao.legados'] = 1;
  }
  // Older builds could start a public war involving a clandestine group.
  if (camp.mundo.guerraAtiva && [camp.mundo.guerraAtiva.a, camp.mundo.guerraAtiva.b].some(f => ['onis', 'cacadores'].includes(f))) {
    camp.mundo.guerraAtiva = undefined;
  }
  // Populate newly added catalogue entries without losing discovery status.
  for (const chave of ['mestres', 'artes', 'trabalhos', 'reliquias'] as const) {
    camp.livro[chave] ??= {};
    for (const item of content[chave]) camp.livro[chave][item.id] ??= 'desconhecida';
  }

  // Combate a meio caminho de uma versão antiga não sobrevive a mudança de
  // regra: melhor fechar do que resolver com metade dos campos.
  if (camp.combate && (!Array.isArray(camp.combate.atores) || camp.combate.versaoRegras !== VERSAO_COMBATE)) camp.combate = null;

  return camp;
}
