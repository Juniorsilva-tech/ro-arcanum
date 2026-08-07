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

function novoNpcDinamico(content: ContentBundle): NpcDinamico {
  const eixos: Record<string, number> = {};
  for (const e of content.cenario.eixosRelacao) eixos[e.id] = 0;
  return { eixos, vivo: true, tensao: 0, memoria: [] };
}

export function normalizarCampanha(content: ContentBundle, bruto: Campaign): Campaign {
  const camp = bruto;

  // ── Campos que nasceram depois ──────────────────────────────────────────
  camp.flags ??= {};
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
  camp.npcState ??= {};
  for (const id of Object.keys(camp.npcState)) {
    if (!content.npcs.some((n) => n.id === id)) delete camp.npcState[id];
  }
  for (const n of content.npcs) {
    camp.npcState[n.id] ??= novoNpcDinamico(content);
    const din = camp.npcState[n.id];
    din.memoria ??= [];
    din.eixos ??= {};
    for (const e of content.cenario.eixosRelacao) din.eixos[e.id] ??= 0;
  }
  camp.segredosRevelados = camp.segredosRevelados.filter((id) =>
    content.npcs.some((n) => n.id === id),
  );

  // ── Onde ele está ────────────────────────────────────────────────────────
  if (!content.locais.some((l) => l.id === camp.localAtual)) {
    camp.localAtual = content.localInicial;
  }
  camp.locaisVisitados = camp.locaisVisitados.filter((id) =>
    content.locais.some((l) => l.id === id),
  );

  // ── O vale ───────────────────────────────────────────────────────────────
  camp.mundo ??= mundoInicial(camp);

  // Combate a meio caminho de uma versão antiga não sobrevive a mudança de
  // regra: melhor fechar do que resolver com metade dos campos.
  if (camp.combate && !Array.isArray(camp.combate.atores)) camp.combate = null;

  return camp;
}
