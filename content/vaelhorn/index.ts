// ARCANUM · Pacote de conteúdo de Vaelhorn.
import type { ContentBundle } from '../../engine/types';
import { vaelhorn } from './scenario';
import { classesVaelhorn } from './classes';
import { origensVaelhorn } from './origins';
import { verbosVaelhorn } from './verbs';
import { locaisVaelhorn } from './locations';
import { integrarContinente } from './continente';
import { povoarContinente } from './povoamento';
import { npcsVaelhorn } from './npcs';
import { elencoDoContinente } from './elenco-continente';
import { itensVaelhorn } from './items';
import { criaturasVaelhorn, encontrosPorTipo, encontrosPorRegiao } from './bestiary';
import { questsVaelhorn } from './quests';
import { integrarKimetsu } from './kimetsu';
import { criaturasDeDesafio, desafiosVaelhorn } from './desafios';
import { casasVaelhorn } from './casas';
import { familiasVaelhorn } from './familias';
import { membrosDasCasas } from './casas-membros';
import { edificiosRegionaisVaelhorn, tetoEdificiosVaelhorn } from './edificiosRegionais';
import { LENDAS_ITENS, GUARDIOES_LENDARIOS, RELIQUIAS_DAS_CASAS } from './lendas';
import { HISTORIAS_CRIATURAS } from './bestiario-historias';
import { HISTORIAS_LOCAIS, DESCRICOES_CORRIGIDAS } from './historias-locais';
import { CRONICAS_MAPA, DEUSES_PRIMORDIAIS, BRUXAS_DOS_PECADOS, FACCOES_ANTIGAS, MITO_ORIGEM_MAGIA } from './cosmologia';
import { HISTORIAS_CASAS } from './historias-casas';
import { SITIOS_COLONIA } from './sitios';
import { ARQUETIPOS_COLONO, GRUPOS_CHEGADA, NOMES_COLONAS, NOMES_COLONOS } from './colonos';
import { SEGREDOS_NOVOS, SEGREDOS_REESCRITOS, CONSEQUENCIAS } from './segredos';
import { HISTORIAS_VALE } from './historias-vale';
import { HISTORIAS_CONTINENTE } from './historias-continente';
import { HISTORIAS_COSTA } from './historias-costa';
import { HISTORIAS_KIMETSU } from './historias-kimetsu';
import { HISTORIAS_MORADORES, SEGREDOS_MORADORES } from './historias-moradores';
import type { Criatura, Item, NPC } from '../../engine/types';
import {
  mestresVaelhorn,
  trabalhosVaelhorn,
  artesVaelhorn,
  reliquiasVaelhorn,
  faccoesVaelhorn,
  rivalidadesVaelhorn,
} from './book';

// O mapa primeiro, porque o povoamento depende dele: cada morador nasce de um
// lugar, e o segredo dele se apoia na historia daquele lugar.
const mapaVaelhorn = integrarContinente(locaisVaelhorn);
const moradores = povoarContinente(mapaVaelhorn, faccoesVaelhorn);

const HISTORIAS = { ...HISTORIAS_VALE, ...HISTORIAS_CONTINENTE, ...HISTORIAS_COSTA, ...HISTORIAS_KIMETSU, ...HISTORIAS_MORADORES };

// História e segredo escritos à parte (sessão 47) entram por cima do elenco
// depois de o povoamento e o Kimetsu terem montado a lista. Segredo que já
// existia continua o mesmo e só ganha consequência, se houver — exceto os
// segredos-modelo repetidos do povoamento, reescritos um a um.
function enriquecerElenco(npcs: NPC[]): NPC[] {
  return npcs.map(n => {
    // SEGREDOS_MORADORES (sessão 55) substitui os segredos-modelo, que eram a
    // história pública do lugar com uma frase na frente.
    const segredo = SEGREDOS_REESCRITOS[n.id] ?? SEGREDOS_MORADORES[n.id] ?? n.segredo ?? SEGREDOS_NOVOS[n.id];
    const consequencia = CONSEQUENCIAS[n.id];
    return {
      ...n,
      historia: n.historia ?? HISTORIAS[n.id],
      segredo: segredo && consequencia && !segredo.consequencia ? { ...segredo, consequencia } : segredo,
    };
  });
}

// O que um edifício regional vende entra na lista de lojas do item: a loja
// continua sendo lida do item (engine/items.ts), sem regra nova de comércio.
function lojasRegionais(itens: Item[]): Item[] {
  return itens.map(i => {
    const extras = edificiosRegionaisVaelhorn.filter(e => e.efeitos.vende?.includes(i.id)).map(e => e.cidade);
    if (!extras.length) return i;
    return { ...i, lojas: [...new Set([...(i.lojas ?? []), ...extras])] };
  });
}

// As peças lendárias ganham história e, quando o nome antigo contradizia o
// mundo, nome novo (content/vaelhorn/lendas.ts).
function comLendas(itens: Item[]): Item[] {
  return itens.map(i => {
    const l = LENDAS_ITENS[i.id];
    return l ? { ...i, nome: l.nome ?? i.nome, descricao: l.descricao, historia: l.historia } : i;
  });
}

// Quem guarda uma peça lendária a deixa cair, sempre, quando é vencido.
function comGuardioes(criaturas: Criatura[]): Criatura[] {
  return criaturas.map(c => {
    const item = GUARDIOES_LENDARIOS[c.id];
    return item ? { ...c, loot: [...(c.loot ?? []), { item, chance: 1 }] } : c;
  });
}

const baseVaelhorn: ContentBundle = integrarKimetsu({
  cenario: vaelhorn,
  classes: classesVaelhorn,
  origens: origensVaelhorn,
  verbos: verbosVaelhorn,
  locais: mapaVaelhorn,
  npcs: [...npcsVaelhorn, ...elencoDoContinente, ...membrosDasCasas, ...moradores],
  mestres: mestresVaelhorn,
  trabalhos: trabalhosVaelhorn,
  artes: artesVaelhorn,
  reliquias: reliquiasVaelhorn,
  itens: comLendas(lojasRegionais(itensVaelhorn)),
  criaturas: comGuardioes([...criaturasVaelhorn, ...criaturasDeDesafio]),
  desafios: desafiosVaelhorn,
  quests: questsVaelhorn,
  faccoes: faccoesVaelhorn,
  casas: casasVaelhorn.map(h => ({ ...h, reliquias: RELIQUIAS_DAS_CASAS[h.id], historia: HISTORIAS_CASAS[h.id] })),
  familias: familiasVaelhorn,
  edificiosRegionais: edificiosRegionaisVaelhorn,
  tetoEdificios: tetoEdificiosVaelhorn,
  sitiosColonia: SITIOS_COLONIA,
  arquetiposColono: ARQUETIPOS_COLONO,
  gruposChegada: GRUPOS_CHEGADA,
  nomesColonas: NOMES_COLONAS,
  nomesColonos: NOMES_COLONOS,
  rivalidadesFaccoes: rivalidadesVaelhorn,
  encontrosPorTipo,
  encontrosPorRegiao,
  localInicial: 'taverna',
});

// A história nova dos lugares entra DEPOIS do povoamento: o povoamento sorteia
// o segredo de cada morador a partir de Local.historia, e dar história a um
// lugar que não tinha mudaria quem mora nele (nomes, ofícios, famílias que
// apontam para esses ids). O bestiário entra depois do Kimetsu, que é quem
// monta os onis com identidade.
function comHistoriaDosLugares(locais: ContentBundle['locais']): ContentBundle['locais'] {
  return locais.map(l => {
    const historia = HISTORIAS_LOCAIS[l.id], descricao = DESCRICOES_CORRIGIDAS[l.id];
    if (!historia && !descricao) return l;
    return { ...l, historia: historia && !l.historia?.length ? historia : l.historia, descricaoBase: descricao ?? l.descricaoBase };
  });
}
function comBestiario(criaturas: Criatura[]): Criatura[] {
  return criaturas.map(c => HISTORIAS_CRIATURAS[c.id] ? { ...c, ...HISTORIAS_CRIATURAS[c.id] } : c);
}

export const conteudoVaelhorn: ContentBundle = {
  ...baseVaelhorn,
  npcs: enriquecerElenco(baseVaelhorn.npcs),
  locais: comHistoriaDosLugares(baseVaelhorn.locais),
  criaturas: comBestiario(baseVaelhorn.criaturas),
};

export {
  CRONICAS_MAPA,
  DEUSES_PRIMORDIAIS,
  BRUXAS_DOS_PECADOS,
  FACCOES_ANTIGAS,
  MITO_ORIGEM_MAGIA,
};
