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
import { SEGREDOS_NOVOS, SEGREDOS_REESCRITOS, CONSEQUENCIAS } from './segredos';
import { HISTORIAS_VALE } from './historias-vale';
import { HISTORIAS_CONTINENTE } from './historias-continente';
import { HISTORIAS_COSTA } from './historias-costa';
import { HISTORIAS_KIMETSU } from './historias-kimetsu';
import type { NPC } from '../../engine/types';
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

const HISTORIAS = { ...HISTORIAS_VALE, ...HISTORIAS_CONTINENTE, ...HISTORIAS_COSTA, ...HISTORIAS_KIMETSU };

// História e segredo escritos à parte (sessão 47) entram por cima do elenco
// depois de o povoamento e o Kimetsu terem montado a lista. Segredo que já
// existia continua o mesmo e só ganha consequência, se houver — exceto os
// segredos-modelo repetidos do povoamento, reescritos um a um.
function enriquecerElenco(npcs: NPC[]): NPC[] {
  return npcs.map(n => {
    const segredo = SEGREDOS_REESCRITOS[n.id] ?? n.segredo ?? SEGREDOS_NOVOS[n.id];
    const consequencia = CONSEQUENCIAS[n.id];
    return {
      ...n,
      historia: n.historia ?? HISTORIAS[n.id],
      segredo: segredo && consequencia && !segredo.consequencia ? { ...segredo, consequencia } : segredo,
    };
  });
}

const baseVaelhorn: ContentBundle = integrarKimetsu({
  cenario: vaelhorn,
  classes: classesVaelhorn,
  origens: origensVaelhorn,
  verbos: verbosVaelhorn,
  locais: mapaVaelhorn,
  npcs: [...npcsVaelhorn, ...elencoDoContinente, ...moradores],
  mestres: mestresVaelhorn,
  trabalhos: trabalhosVaelhorn,
  artes: artesVaelhorn,
  reliquias: reliquiasVaelhorn,
  itens: itensVaelhorn,
  criaturas: [...criaturasVaelhorn, ...criaturasDeDesafio],
  desafios: desafiosVaelhorn,
  quests: questsVaelhorn,
  faccoes: faccoesVaelhorn,
  casas: casasVaelhorn,
  familias: familiasVaelhorn,
  rivalidadesFaccoes: rivalidadesVaelhorn,
  encontrosPorTipo,
  encontrosPorRegiao,
  localInicial: 'taverna',
});

export const conteudoVaelhorn: ContentBundle = { ...baseVaelhorn, npcs: enriquecerElenco(baseVaelhorn.npcs) };
