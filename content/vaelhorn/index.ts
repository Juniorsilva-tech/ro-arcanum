// ARCANUM · Pacote de conteúdo de Vaelhorn.
import type { ContentBundle } from '../../engine/types';
import { vaelhorn } from './scenario';
import { classesVaelhorn } from './classes';
import { origensVaelhorn } from './origins';
import { verbosVaelhorn } from './verbs';
import { locaisVaelhorn } from './locations';
import { npcsVaelhorn } from './npcs';
import { itensVaelhorn } from './items';
import { criaturasVaelhorn } from './bestiary';
import { questsVaelhorn } from './quests';
import {
  mestresVaelhorn,
  trabalhosVaelhorn,
  artesVaelhorn,
  reliquiasVaelhorn,
  faccoesVaelhorn,
} from './book';

export const conteudoVaelhorn: ContentBundle = {
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
  localInicial: 'taverna',
};
