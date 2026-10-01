import type { Campaign, ContentBundle } from './types';
import { iniciarMundoVivo, descobrirNoticias } from './historiaViva';
import { processarCidades, processarDiretor } from './cidades';
import { processarAutonomia } from './autonomia';
import { processarCrimeUrbano } from './crimeUrbano';
import { processarPolitica } from './politica';
import { processarNemesis } from './nemesis';
import { processarMissoesVivas } from './missoesVivas';
import { atualizarAmeacas } from './continuidade';
import { processarAptidao } from './aptidao';
import { avaliarDescobertas } from './viagem';
import { processarGanchos, conciliarGanchos } from './ganchos';

// Called once for each elapsed calendar day, using the same campaign RNG as gameplay.
export function processarMundoVivo(content: ContentBundle, camp: Campaign): void {
  const v = camp.vivo ?? iniciarMundoVivo(content, camp);
  if (v.ultimoDia >= camp.calendario.dia) return;
  processarCidades(content, camp);
  processarAutonomia(content, camp);
  // Furto, briga e morte nas cidades, e a guarda que pega ou não (engine/crimeUrbano.ts).
  processarCrimeUrbano(content, camp);
  processarPolitica(content, camp);
  processarNemesis(content, camp);
  atualizarAmeacas(content, camp);
  processarMissoesVivas(content, camp);
  processarDiretor(content, camp);
  // Os ganchos escritos a mao nos lugares viram missao. Depois do diretor, de
  // proposito: as crises do mundo tem prioridade na lista, e o gancho entra no
  // espaco que sobra.
  processarGanchos(content, camp);
  // Gancho so' queima quando o jogador se envolveu; ignorado, volta a circular.
  conciliarGanchos(camp);
  descobrirNoticias(content, camp);
  // Fama persegue a reputacao com atraso, e esfria sem novidade.
  processarAptidao(content, camp);
  // Lugar secreto se revela quando a condicao dele e' cumprida, nao por menu.
  avaliarDescobertas(content, camp);
  v.ultimoDia = camp.calendario.dia;
}
