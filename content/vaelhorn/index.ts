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
import { itensVaelhorn } from './items';
import { criaturasVaelhorn, encontrosPorTipo } from './bestiary';
import { questsVaelhorn } from './quests';
import { integrarKimetsu } from './kimetsu';
import { criaturasDeDesafio, desafiosVaelhorn } from './desafios';
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

export const conteudoVaelhorn: ContentBundle = integrarKimetsu({
  cenario: vaelhorn,
  classes: classesVaelhorn,
  origens: origensVaelhorn,
  verbos: verbosVaelhorn,
  locais: mapaVaelhorn,
  npcs: [...npcsVaelhorn, ...moradores],
  mestres: mestresVaelhorn,
  trabalhos: trabalhosVaelhorn,
  artes: artesVaelhorn,
  reliquias: reliquiasVaelhorn,
  itens: itensVaelhorn,
  criaturas: [...criaturasVaelhorn, ...criaturasDeDesafio],
  desafios: desafiosVaelhorn,
  quests: questsVaelhorn,
  faccoes: faccoesVaelhorn,
  rivalidadesFaccoes: rivalidadesVaelhorn,
  encontrosPorTipo,
  localInicial: 'taverna',
});
