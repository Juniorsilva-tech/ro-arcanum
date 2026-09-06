// ARCANUM · Pacote de conteúdo de Vaelhorn.
import type { ContentBundle } from '../../engine/types';
import { vaelhorn } from './scenario';
import { classesVaelhorn } from './classes';
import { origensVaelhorn } from './origins';
import { verbosVaelhorn } from './verbs';
import { locaisVaelhorn } from './locations';
import { npcsVaelhorn } from './npcs';
import { itensVaelhorn } from './items';
import { criaturasVaelhorn, encontrosPorTipo } from './bestiary';
import { questsVaelhorn } from './quests';
import { integrarKimetsu } from './kimetsu';
import {
  mestresVaelhorn,
  trabalhosVaelhorn,
  artesVaelhorn,
  reliquiasVaelhorn,
  faccoesVaelhorn,
  rivalidadesVaelhorn,
} from './book';

export const conteudoVaelhorn: ContentBundle = integrarKimetsu({
  cenario: vaelhorn,
  classes: classesVaelhorn,
  origens: origensVaelhorn,
  verbos: verbosVaelhorn,
  locais: locaisVaelhorn,
  npcs: npcsVaelhorn,
  mestres: mestresVaelhorn,
  trabalhos: trabalhosVaelhorn,
  artes: artesVaelhorn,
  reliquias: reliquiasVaelhorn,
  itens: itensVaelhorn,
  criaturas: criaturasVaelhorn,
  quests: questsVaelhorn,
  faccoes: faccoesVaelhorn,
  rivalidadesFaccoes: rivalidadesVaelhorn,
  encontrosPorTipo,
  localInicial: 'taverna',
});
