// ARCANUM · Sistema de Assentamento, Feudo & Soberania de Reino (GDD §32, §34).
// A engine calcula, a IA não inventa: toda a economia, população, obras com cooldown,
// caravanas comerciais, patrulhas militares e migração são calculadas deterministicamente.

import type { Campaign, ContentBundle, Local, Atributos } from './types';
import type {
  FeudoState,
  TipoEdificioModular,
  ObraAtiva,
  RotaComercial,
  RotaPatrulha,
  CargaCaravana,
  BiomaFeudo,
  CargoConselho,
  ConselheiroReino,
  PatenteMilitar,
  DesignacaoOficial,
  OficialReino,
  CasamentoReino,
  GestacaoReino,
  FilhoHerdeiro,
  LordeVassalo,
  TramaReino,
  CasaDinastica,
} from './types';
import { registrarMarco } from './memoria';

export type PontoAssentamentoDef = {
  id: string;
  nome: string;
  regiao: string;
  bioma: BiomaFeudo;
  descricao: string;
  vantagem: string;
  recursosIniciais: { comida: number; materiais: number; ouro: number };
};

/** Pontos geográficos estratégicos do continente documentados para fundar assentamentos */
export const PONTOS_DE_ASSENTAMENTO: PontoAssentamentoDef[] = [
  {
    id: 'halvet_colinas',
    nome: 'Colinas Férteis de Halvet',
    regiao: 'Vale de Halvet',
    bioma: 'planicie',
    descricao: 'Campos verdejantes cortados pelo Rio Verde, solo fértil e proximidade com as velhas rotas agrícolas.',
    vantagem: '+30% na produção de grãos e colheitas; custo de moradias reduzido em 15%.',
    recursosIniciais: { comida: 120, materiais: 60, ouro: 50 },
  },
  {
    id: 'solgar_oasis',
    nome: 'Oásis Escondido de Solgar',
    regiao: 'Ermo de Solgar',
    bioma: 'deserto',
    descricao: 'Um oásis cercado por tamareiras e dunas de areia dourada. Ponto de passagem obrigatório para caravanas do deserto.',
    vantagem: '+40% de ouro em todas as caravanas comerciais; requer poços e cisternas para sustentar água.',
    recursosIniciais: { comida: 70, materiais: 50, ouro: 120 },
  },
  {
    id: 'tessel_penhasco',
    nome: 'Penedos Fortificados de Tessel',
    regiao: 'Marca de Tessel',
    bioma: 'montanha',
    descricao: 'Escarpa rochosa nas montanhas do norte, ideal para uma fortaleza inexpugnável com veios de ferro e pedreiras.',
    vantagem: '+35% na extração de pedras e minérios; segurança basal do assentamento inicia com +20%.',
    recursosIniciais: { comida: 60, materiais: 110, ouro: 40 },
  },
  {
    id: 'vintra_bosque',
    nome: 'Clareira das Brumas de Vintra',
    regiao: 'Bosque de Vintra',
    bioma: 'floresta',
    descricao: 'Clareira abrigada por pinheiros gigantescos e carvalhos milenares. Caça abundante e madeira nobre de lei.',
    vantagem: '+40% em madeira e ervas medicinais; patrulhas florestais recebem +25% de eficácia contra emboscadas.',
    recursosIniciais: { comida: 90, materiais: 90, ouro: 40 },
  },
  {
    id: 'mareu_enseada',
    nome: 'Enseada da Vigia de Mareu',
    regiao: 'Costa de Mareu',
    bioma: 'costa',
    descricao: 'Baía de águas profundas protegida por falésias de calcário. Acesso direto a portos e pesca marítima farta.',
    vantagem: 'Rotas de caravana e comércio com o dobro de alcance; pesca contínua imune a secas continentais.',
    recursosIniciais: { comida: 110, materiais: 70, ouro: 70 },
  },
  {
    id: 'corveira_minas',
    nome: 'Planalto de Corveira Alta',
    regiao: 'Planalto de Corveira',
    bioma: 'montanha',
    descricao: 'Planalto rochoso antigo repleto de poços de ferro e prata abandonados por antigos clãs nobres.',
    vantagem: '+50% na produção das fundições e forjas; armas e ferramentas produzidas com mais rapidez.',
    recursosIniciais: { comida: 50, materiais: 120, ouro: 80 },
  },
];

export type EdificioModularDef = {
  tipo: TipoEdificioModular;
  nome: string;
  categoria: 'habitacao' | 'governanca' | 'militar' | 'comercio' | 'religioso' | 'producao' | 'defesa';
  descricao: string;
  custoBaseOuro: number;
  custoBaseMateriais: number;
  tempoBasePeriodos: number; // 4 períodos = 1 dia
  efeitoPorNivel: string;
  acumulativo: boolean; // Permite construir múltiplos blocos (ex: moradias)
};

export const CATALOGO_EDIFICIOS: Record<TipoEdificioModular, EdificioModularDef> = {
  moradias: {
    tipo: 'moradias',
    nome: 'Casas & Bairros Populares',
    categoria: 'habitacao',
    descricao: 'Habitações de alvenaria e madeira reforçada, abrigando cidadãos, artesãos e famílias que sustentam a economia.',
    custoBaseOuro: 20,
    custoBaseMateriais: 30,
    tempoBasePeriodos: 12, // 3 dias
    efeitoPorNivel: '+25 de capacidade populacional máxima e +5 de receita tributária diária por bloco construído.',
    acumulativo: true,
  },
  castelo: {
    tipo: 'castelo',
    nome: 'Fortaleza & Castelo do Soberano',
    categoria: 'governanca',
    descricao: 'Sede da soberania e do comando regional. Do torreão inicial até a cidadela imperial de muralhas concêntricas.',
    custoBaseOuro: 80,
    custoBaseMateriais: 90,
    tempoBasePeriodos: 28, // 7 dias
    efeitoPorNivel: '+10 de Estabilidade, +10 de Prestígio e desbloqueia novos decretos do trono.',
    acumulativo: false,
  },
  quartel: {
    tipo: 'quartel',
    nome: 'Quartel-General & Campo de Armas',
    categoria: 'militar',
    descricao: 'Pátio de treinamento, arsenal e alojamento de guardas e cavaleiros que patrulham o domínio e protegem as estradas.',
    custoBaseOuro: 45,
    custoBaseMateriais: 55,
    tempoBasePeriodos: 16, // 4 dias
    efeitoPorNivel: '+15 de Segurança permanente e permite alocar +3 soldados em destacamentos de patrulha.',
    acumulativo: false,
  },
  mercado_feitoria: {
    tipo: 'mercado_feitoria',
    nome: 'Companhia Mercante & Feitoria',
    categoria: 'comercio',
    descricao: 'Entreposto comercial com alfândega, armazéns de estocagem e docas para despacho de caravanas continentais.',
    custoBaseOuro: 40,
    custoBaseMateriais: 45,
    tempoBasePeriodos: 16, // 4 dias
    efeitoPorNivel: '+20% no retorno de ouro de caravanas e permite despachar +1 caravana simultânea.',
    acumulativo: false,
  },
  igreja_santuario: {
    tipo: 'igreja_santuario',
    nome: 'Templo Sagrado & Abadia',
    categoria: 'religioso',
    descricao: 'Santuário de fé e meditação que conforta o povo nas crises, eleva o ânimo cívico e atrai peregrinos devotos.',
    custoBaseOuro: 35,
    custoBaseMateriais: 40,
    tempoBasePeriodos: 16, // 4 dias
    efeitoPorNivel: '+12 de Estabilidade, reduz descontentamento e concede bênçãos contra pragas e desastres.',
    acumulativo: false,
  },
  oficina_forja: {
    tipo: 'oficina_forja',
    nome: 'Oficinas & Fundição Real',
    categoria: 'producao',
    descricao: 'Ferrarias, pedreiras e forjas dedicadas a manufaturar ferramentas resistentes e materiais de construção.',
    custoBaseOuro: 35,
    custoBaseMateriais: 50,
    tempoBasePeriodos: 14, // 3.5 dias
    efeitoPorNivel: 'Gera +10 materiais de construção por ciclo e acelera a velocidade de novas obras em 10%.',
    acumulativo: false,
  },
  lavoura_silos: {
    tipo: 'lavoura_silos',
    nome: 'Granjas, Silos & Moinhos',
    categoria: 'producao',
    descricao: 'Campos de trigo, pomares irrigados e silos selados contra roedores para garantir alimento mesmo nos invernos mais duros.',
    custoBaseOuro: 25,
    custoBaseMateriais: 35,
    tempoBasePeriodos: 12, // 3 dias
    efeitoPorNivel: 'Gera +25 unidades de comida por ciclo e previne a fome na comunidade.',
    acumulativo: true,
  },
  muralha_baluarte: {
    tipo: 'muralha_baluarte',
    nome: 'Muralhas & Torres de Baluarte',
    categoria: 'defesa',
    descricao: 'Paliçadas altas reforçadas com pedra talhada, fossos pontiagudos e barbacãs para repelir ataques e monstros.',
    custoBaseOuro: 50,
    custoBaseMateriais: 70,
    tempoBasePeriodos: 20, // 5 dias
    efeitoPorNivel: '+20 de Segurança do feudo e reduz as perdas em incursões e conflitos continentais a zero.',
    acumulativo: false,
  },
  boticario_hospital: {
    tipo: 'boticario_hospital',
    nome: 'Enfermaria Real & Boticário',
    categoria: 'producao',
    descricao: 'Laboratório de alquimia e ervas com leitos limpos para conter febres, curar feridos e preparar unguentos.',
    custoBaseOuro: 30,
    custoBaseMateriais: 35,
    tempoBasePeriodos: 12, // 3 dias
    efeitoPorNivel: 'Gera +8 remédios por ciclo e erradica surtos de doença na população.',
    acumulativo: false,
  },
};

/** Identifica o bioma natural com base na região ou identificador do local */
export function identificarBiomaLocal(localId: string, regiao?: string): BiomaFeudo {
  const r = (regiao ?? '').toLowerCase();
  const id = localId.toLowerCase();
  if (r.includes('solgar') || id.includes('deserto') || id.includes('oasis') || id.includes('areia') || id.includes('wasteland')) {
    return 'deserto';
  }
  if (r.includes('tessel') || r.includes('corveira') || id.includes('montanha') || id.includes('penhasco')) {
    return 'montanha';
  }
  if (r.includes('vintra') || id.includes('bosque') || id.includes('floresta') || id.includes('mata')) {
    return 'floresta';
  }
  if (r.includes('mareu') || id.includes('costa') || id.includes('porto') || id.includes('enseada') || id.includes('baia')) {
    return 'costa';
  }
  if (r.includes('asora') || id.includes('asora')) {
    return 'asora';
  }
  return 'planicie';
}

/** Título e descrição do patamar arquitetural da cidade (Tier 1 a 10) */
export function obterTierReinoInfo(tier: number, bioma: BiomaFeudo): { titulo: string; descricao: string } {
  const t = Math.max(1, Math.min(10, tier));

  if (bioma === 'asora') {
    const titulosAsora: Record<number, { titulo: string; descricao: string }> = {
      1: { titulo: 'Tier I: Santuário Oculto da Névoa', descricao: 'Primeiros pavilhões de madeira sob cerejeiras místicas.' },
      2: { titulo: 'Tier II: Clareira dos Refugiados', descricao: 'Alojamentos comunais para orcs, homens-lagarto e anões.' },
      3: { titulo: 'Tier III: Aldeia Demi-Humana Unificada', descricao: 'Ruas pavimentadas em pedra mística, hortas e estufas.' },
      4: { titulo: 'Tier IV: Burgo das Forjas da Névoa', descricao: 'Oficinas subterrâneas dos anões e campos de treinamento dos guerreiros orcs.' },
      5: { titulo: 'Tier V: Fortaleza da Água Espelhada', descricao: 'Muralhas de obsidiana e lagos encantados com barbacãs arcanos.' },
      6: { titulo: 'Tier VI: Cidadela de Jade & Termas Celestiais', descricao: 'Canais de cristal límpido, muralhas etéreas e comércio vibrante.' },
      7: { titulo: 'Tier VII: Bastião Soberano Dimensional', descricao: 'Torres resplandecentes que manipulam a própria essência espacial do subespaço.' },
      8: { titulo: 'Tier VIII: Metrópole Harmônica dos Clãs', descricao: 'Centros acadêmicos, santuários de dragão e avenidas monumentais.' },
      9: { titulo: 'Tier IX: Palácio Celeste da Névoa Imperecível', descricao: 'Cidadela flutuante no horizonte com muralhas mágicas intransponíveis.' },
      10: { titulo: 'Tier X: Trono Soberano Multidimensional', descricao: 'O maior império demi-humano da história, inexpugnável, eterno e lendário.' },
    };
    return titulosAsora[t] ?? titulosAsora[10];
  }

  if (bioma === 'deserto') {
    const titulosDeserto: Record<number, { titulo: string; descricao: string }> = {
      1: { titulo: 'Tier I: Acampamento de Nômades do Deserto', descricao: 'Tendas de lona e paliçadas rústicas ao redor do poço de água.' },
      2: { titulo: 'Tier II: Posto de Vigia das Areias', descricao: 'Torres de vigia de barro batido e valas contra predadores das dunas.' },
      3: { titulo: 'Tier III: Oásis Cercado de Arenito', descricao: 'Muralhas baixas de adobe, tamareiras florescentes e poços profundos.' },
      4: { titulo: 'Tier IV: Feitoria Mercante das Caravanas', descricao: 'Bazar coberto, entrepostos de especiarias e caravançarais movimentados.' },
      5: { titulo: 'Tier V: Forte Solar das Dunas Douradas', descricao: 'Torres quadradas de arenito trabalhado e aquedutos subterrâneos (qanats).' },
      6: { titulo: 'Tier VI: Fortaleza Murada de Solgar', descricao: 'Paredões maciços de pedra calcária do deserto com portas de bronze fundido.' },
      7: { titulo: 'Tier VII: Palácio Senhorial do Deserto', descricao: 'Salões abobadados, fontes resfriadas e guarnições de cavalaria dos camelos.' },
      8: { titulo: 'Tier VIII: Cidadela Imperial das Areias', descricao: 'Uma joia colossal no deserto com minaretes de vigia e rotas transcontinentais.' },
      9: { titulo: 'Tier IX: Metrópole Esplendorosa do Sol', descricao: 'Palácios dourados e defesas capazes de sepultar exércitos invasores nas dunas.' },
      10: { titulo: 'Tier X: Trono Soberano do Sol Eterno', descricao: 'A lenda viva do deserto: uma capital monumental que domina todos os mares de areia.' },
    };
    return titulosDeserto[t] ?? titulosDeserto[10];
  }

  if (bioma === 'montanha') {
    const titulosMontanha: Record<number, { titulo: string; descricao: string }> = {
      1: { titulo: 'Tier I: Abrigo de Pedra nos Penhascos', descricao: 'Cabanas de pedra rústica encravadas na rocha fria sob o vento uivante.' },
      2: { titulo: 'Tier II: Posto de Vigia da Escarpa', descricao: 'Parapeitos de pedra e paliçadas vigiando os passos montanhosos estreitos.' },
      3: { titulo: 'Tier III: Reduto de Mineração da Crista', descricao: 'Alojamentos de mineiros, fornos de cal e pontes suspensas sobre gargantas.' },
      4: { titulo: 'Tier IV: Bastilha das Minas Altas', descricao: 'Entradas de minas fortificadas, pátio de fundição e muralhas de granito talhado.' },
      5: { titulo: 'Tier V: Fortaleza dos Penedos de Ferro', descricao: 'Baluartes com seteiras para besteiros e arsenais de ferro forjado.' },
      6: { titulo: 'Tier VI: Castelo dos Penedos Inexpugnáveis', descricao: 'Muralhas ciclópicas que desafiam as neves, pátios de armas e calabouços profundos.' },
      7: { titulo: 'Tier VII: Fortaleza Ducal da Cordilheira', descricao: 'Paredões de rocha viva esculpida interligados por pontes de arcos colossais.' },
      8: { titulo: 'Tier VIII: Cidadela Soberana das Alturas', descricao: 'Sede régia inexpugnável no cume do mundo, visível por todas as marcas do reino.' },
      9: { titulo: 'Tier IX: Fortaleza Baluarte Titânica', descricao: 'Complexo bélico monumental com catapultas e fundições capazes de armar milhares.' },
      10: { titulo: 'Tier X: Trono Soberano dos Picos Eternos', descricao: 'A fortaleza definitiva da montanha, esculpida na própria montanha viva.' },
    };
    return titulosMontanha[t] ?? titulosMontanha[10];
  }

  if (bioma === 'floresta') {
    const titulosFloresta: Record<number, { titulo: string; descricao: string }> = {
      1: { titulo: 'Tier I: Acampamento de Lenhadores da Mata', descricao: 'Cabanas de toras e fogueiras cercadas por densa vegetação primordial.' },
      2: { titulo: 'Tier II: Posto Silvestre de Fronteira', descricao: 'Paliçadas de carvalho afiado e esconderijos de arqueiros nas copas das árvores.' },
      3: { titulo: 'Tier III: Aldeia Florestal dos Caçadores', descricao: 'Passarelas elevadas, defesas de espinhos e armazéns de madeira de lei.' },
      4: { titulo: 'Tier IV: Burgo Silvestre & Serraria Nobre', descricao: 'Oficinas de arco, cabanas senhoriais com telhados de telha e canis de caça.' },
      5: { titulo: 'Tier V: Fortaleza do Bosque das Brumas', descricao: 'Torreões de pedra e vigas de teca sagrada com fossos alimentados por riachos.' },
      6: { titulo: 'Tier VI: Castelo Senhorial da Selva Feudal', descricao: 'Fortaleza com muralhas de pedra musgosa, guarnições florestais e santuários verdes.' },
      7: { titulo: 'Tier VII: Bastião Ducal das Faias Ancestrais', descricao: 'Complexo murado concêntrico protegido por labirintos de trilhas e vigias.' },
      8: { titulo: 'Tier VIII: Cidadela Arbórea Soberana', descricao: 'Uma esplêndida fusão de arquitetura senhorial de pedra e veneráveis copas milenares.' },
      9: { titulo: 'Tier IX: Império Verde dos Bosques Antigos', descricao: 'Metrópole protegida pela própria fúria e mistério da floresta impenetrável.' },
      10: { titulo: 'Tier X: Trono Soberano da Floresta Eterna', descricao: 'Monumento lendário onde o trono da coroa governa em harmonia imorredoura.' },
    };
    return titulosFloresta[t] ?? titulosFloresta[10];
  }

  if (bioma === 'costa') {
    const titulosCosta: Record<number, { titulo: string; descricao: string }> = {
      1: { titulo: 'Tier I: Enseada de Pescadores', descricao: 'Pontões de madeira rústica, botes encalhados na areia e cabanas de palafita.' },
      2: { titulo: 'Tier II: Píer Fortificado da Praia', descricao: 'Paliçadas costeiras protegendo os armazéns de peixe seco e calafeto.' },
      3: { titulo: 'Tier III: Vila Portuária do Farol', descricao: 'Primeiro farol de pedra, quebra-mar rústico e taberna dos marinheiros.' },
      4: { titulo: 'Tier IV: Porto Mercante & Alfândega', descricao: 'Doca de atracação para navios mercantes, feitorias de salga e armazéns aduaneiros.' },
      5: { titulo: 'Tier V: Fortaleza da Enseada Marítima', descricao: 'Bateria de artilharia naval, baluartes sobre as falésias e estaleiro de reparos.' },
      6: { titulo: 'Tier VI: Castelo Senhorial das Falésias', descricao: 'Fortaleza altiva no penhasco dominando o horizonte azul e a entrada da baía.' },
      7: { titulo: 'Tier VII: Almirantado Ducal das Ondas', descricao: 'Doca militar fortificada, cadeias de porto fechando a enseada e casernas de fuzileiros.' },
      8: { titulo: 'Tier VIII: Cidadela Portuária Soberana', descricao: 'Uma das maiores cidades portuárias do continente com frotas de caravanas oceânicas.' },
      9: { titulo: 'Tier IX: Metrópole Talassocrática dos Mares', descricao: 'Palácios de mármore e arenito litorâneo, berço do comércio de além-mar.' },
      10: { titulo: 'Tier X: Trono Soberano dos Mares do Norte', descricao: 'A rainha dos oceanos: uma capital naval monumental cujos navios dominam o mundo.' },
    };
    return titulosCosta[t] ?? titulosCosta[10];
  }

  // Planície clássica (Vale de Halvet / Terras Centrais)
  const titulosPlanicie: Record<number, { titulo: string; descricao: string }> = {
    1: { titulo: 'Tier I: Acampamento de Pioneiros do Vale', descricao: 'Tendas de couro, fogueiras e primeiros piquetes de demarcação de terras.' },
    2: { titulo: 'Tier II: Posto de Vigia & Paliçada de Toras', descricao: 'Paliçada de troncos pontiagudos, fosso seco e torre de observação de madeira.' },
    3: { titulo: 'Tier III: Forte de Madeira & Fosso Fortificado', descricao: 'Muralhas de vigas duplas com passadiço de ronda, pátio interno e celeiro.' },
    4: { titulo: 'Tier IV: Manoir & Casarão Feudal de Pedra', descricao: 'Torre de menagem de alvenaria, estábulos, oficinas e primeiras ruas pavimentadas.' },
    5: { titulo: 'Tier V: Fortaleza Baronal Inexpugnável', descricao: 'Muralhas de pedra aparelhada, barbacã, ponte levadiça e guarnição regular.' },
    6: { titulo: 'Tier VI: Castelo Senhorial de Muralhas Altas', descricao: 'Castelo imponente com fosso de água, pátio de armas, capela e burgo murado.' },
    7: { titulo: 'Tier VII: Fortaleza Ducal Concêntrica', descricao: 'Muralhas duplas concêntricas, torreões de flanqueamento e salão de audiências senhoriais.' },
    8: { titulo: 'Tier VIII: Cidadela Real Murada', descricao: 'Capital fortificada de ruas largas, praça do mercado central, tribunal e colégios.' },
    9: { titulo: 'Tier IX: Cidadela Imperial Resplandecente', descricao: 'Palácio colossal de torres góticas, estandartes dourados e muralhas impenetráveis.' },
    10: { titulo: 'Tier X: Trono Soberano Monumental', descricao: 'O pináculo da civilização feudal: uma capital imperial monumental digna de lendas.' },
  };
  return titulosPlanicie[t] ?? titulosPlanicie[10];
}

/** Obtém o feudo da campanha de forma segura, garantindo integridade de estado e inicialização preguiçosa */
export function obterFeudo(camp: Campaign): FeudoState {
  if (!camp.feudo) {
    const bioma = identificarBiomaLocal(camp.localAtual);
    camp.feudo = {
      fundado: false,
      nome: 'Assentamento de Vaelhorn',
      localId: camp.localAtual,
      bioma,
      tierReino: 1,
      populacao: 25,
      capacidadeHabitacional: 50,
      tesouro: 100,
      materiais: 80,
      comida: 150,
      remedios: 30,
      seguranca: 50,
      estabilidade: 70,
      edificios: {
        moradias: 2,
        castelo: 1,
        quartel: 1,
        mercado_feitoria: 1,
        igreja_santuario: 0,
        oficina_forja: 1,
        lavoura_silos: 2,
        muralha_baluarte: 1,
        boticario_hospital: 0,
      },
      obrasEmAndamento: [],
      rotasComerciais: [],
      rotasPatrulha: [],
      historicoEventos: [
        {
          dia: camp.calendario.dia,
          texto: 'As terras foram demarcadas pelo soberano. O estandarte foi fincado no solo.',
        },
      ],
      decretosAtivos: [],
      casaDinastica: {
        fundada: false,
        nome: '',
        lema: '',
        brasaoCorPrimaria: '#c59b27',
        brasaoCorSecundaria: '#1a1816',
        brasaoFigura: 'dragao',
        prestigio: 10,
      },
      conselho: {
        regente: undefined,
        chanceler: undefined,
        marechal: undefined,
        tesoureiro: undefined,
        mestre_espioes: undefined,
      },
      oficiais: [],
      filhosHerdeiros: [],
      vassalos: [],
      tramasAtivas: [],
    };
  }

  // Sanitização defensiva para saves e campanhas em andamento
  const f = camp.feudo;
  if (!f.casaDinastica) {
    f.casaDinastica = {
      fundada: false,
      nome: '',
      lema: '',
      brasaoCorPrimaria: '#c59b27',
      brasaoCorSecundaria: '#1a1816',
      brasaoFigura: 'dragao',
      prestigio: 10,
    };
  }
  if (!f.conselho) {
    f.conselho = {
      regente: undefined,
      chanceler: undefined,
      marechal: undefined,
      tesoureiro: undefined,
      mestre_espioes: undefined,
    };
  }
  if (!f.oficiais) f.oficiais = [];
  if (!f.filhosHerdeiros) f.filhosHerdeiros = [];
  if (!f.vassalos) f.vassalos = [];
  if (!f.tramasAtivas) f.tramasAtivas = [];

  return f;
}

/** Funda formalmente o feudo ou reivindica um novo local de assentamento */
export function fundarFeudo(
  camp: Campaign,
  nome: string,
  localId: string,
  biomaEscolhido?: BiomaFeudo,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const bioma = biomaEscolhido ?? identificarBiomaLocal(localId);

  // Aplica vantagens do ponto se coincidir com catálogo
  const pontoCatalogo = PONTOS_DE_ASSENTAMENTO.find(p => p.id === localId);
  const recursos = pontoCatalogo?.recursosIniciais ?? { comida: 120, materiais: 80, ouro: 80 };

  feudo.fundado = true;
  feudo.nome = nome.trim() || pontoCatalogo?.nome || 'Novo Domínio';
  feudo.localId = localId;
  feudo.bioma = bioma;
  feudo.comida = Math.max(feudo.comida, recursos.comida);
  feudo.materiais = Math.max(feudo.materiais, recursos.materiais);
  feudo.tesouro = Math.max(feudo.tesouro, recursos.ouro);

  const texto = `O Soberano fundou formalmente "${feudo.nome}" em terras de ${bioma.toUpperCase()}. A pedra fundamental foi cravada e o clã tem uma casa canônica.`;

  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
  registrarMarco(camp, texto);

  return { ok: true, mensagem: texto };
}

/**
 * Inicia a construção de um edifício com cooldown real em períodos.
 * Sem limite artificial de 5 níveis: moradias e granjas podem ser expandidas dezenas de vezes.
 */
export function iniciarObraFeudo(
  camp: Campaign,
  tipo: TipoEdificioModular,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const def = CATALOGO_EDIFICIOS[tipo];
  if (!def) return { ok: false, mensagem: 'Tipo de edificação desconhecido.' };

  const nivelAtual = feudo.edificios[tipo] ?? 0;
  if (!def.acumulativo && nivelAtual >= 10) {
    return { ok: false, mensagem: `${def.nome} já alcançou o ápice monumental (Nível 10).` };
  }

  // Obra já em andamento do mesmo tipo (exceto moradias que podem construir frentes paralelas)
  const jaEmConstrucao = feudo.obrasEmAndamento.some(o => o.tipo === tipo);
  if (!def.acumulativo && jaEmConstrucao) {
    return { ok: false, mensagem: `Já há mestres de obras e operários construindo a expansão de ${def.nome}.` };
  }

  // Escala de custos: níveis mais altos exigem mais recursos
  const fatorNivel = 1 + nivelAtual * 0.25;
  const custoOuro = Math.floor(def.custoBaseOuro * fatorNivel);
  const custoMateriais = Math.floor(def.custoBaseMateriais * fatorNivel);

  // Desconto de materiais se tiver oficinas de forja de alto nível
  const bonusOficina = Math.min(0.3, (feudo.edificios.oficina_forja ?? 0) * 0.05);
  const materiaisFinais = Math.max(10, Math.floor(custoMateriais * (1 - bonusOficina)));

  // Validação de recursos (ouro do feudo ou ouro do personagem)
  const ouroTotalDisponivel = feudo.tesouro + (camp.personagem.dinheiro ?? 0);
  if (ouroTotalDisponivel < custoOuro) {
    return {
      ok: false,
      mensagem: `Tesouro insuficiente! Exige ${custoOuro} moedas de ouro (Disponível no Feudo: ${feudo.tesouro}, Pessoal: ${camp.personagem.dinheiro ?? 0}).`,
    };
  }

  if (feudo.materiais < materiaisFinais) {
    return {
      ok: false,
      mensagem: `Materiais de construção insuficientes! Exige ${materiaisFinais} materiais (Armazém: ${feudo.materiais}).`,
    };
  }

  // Deduz recursos
  if (feudo.tesouro >= custoOuro) {
    feudo.tesouro -= custoOuro;
  } else {
    const restante = custoOuro - feudo.tesouro;
    feudo.tesouro = 0;
    camp.personagem.dinheiro = Math.max(0, (camp.personagem.dinheiro ?? 0) - restante);
  }
  feudo.materiais -= materiaisFinais;

  // Calcula tempo com aceleração de oficinas
  const reducaoTempo = Math.min(0.4, (feudo.edificios.oficina_forja ?? 0) * 0.08);
  const periodosCalculados = Math.max(4, Math.floor(def.tempoBasePeriodos * (1 - reducaoTempo)));

  const novaObra: ObraAtiva = {
    id: `obra_${tipo}_${Date.now()}_${camp.calendario.dia}`,
    tipo,
    nome: `${def.nome} (Nível ${nivelAtual + 1})`,
    nivelAlvo: nivelAtual + 1,
    periodosRestantes: periodosCalculados,
    periodosTotais: periodosCalculados,
    custoOuro,
    custoMateriais: materiaisFinais,
  };

  feudo.obrasEmAndamento.push(novaObra);

  const dias = Math.ceil(periodosCalculados / 4);
  const texto = `Canteiro de obras aberto: "${novaObra.nome}" entrou em construção! Previsão: ${dias} dia(s) (${periodosCalculados} períodos).`;

  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

/**
 * Avança as obras em andamento com cooldown real de tempo.
 * Disparado sempre que o calendário avança períodos no mundo.
 */
export function avancarObrasFeudo(
  camp: Campaign,
  periodosAvancados: number,
): { concluidas: string[] } {
  const feudo = camp.feudo;
  if (!feudo || feudo.obrasEmAndamento.length === 0) return { concluidas: [] };

  const concluidas: string[] = [];
  const restantes: ObraAtiva[] = [];

  for (const obra of feudo.obrasEmAndamento) {
    obra.periodosRestantes -= periodosAvancados;

    if (obra.periodosRestantes <= 0) {
      // Obra concluída!
      feudo.edificios[obra.tipo] = (feudo.edificios[obra.tipo] ?? 0) + 1;
      concluidas.push(obra.nome);

      // Aplica efeitos imediatos
      if (obra.tipo === 'moradias') {
        feudo.capacidadeHabitacional += 25;
      } else if (obra.tipo === 'castelo') {
        feudo.estabilidade = Math.min(100, feudo.estabilidade + 10);
        feudo.tierReino = Math.min(10, Math.max(feudo.tierReino, feudo.edificios.castelo));
      } else if (obra.tipo === 'quartel') {
        feudo.seguranca = Math.min(100, feudo.seguranca + 15);
      } else if (obra.tipo === 'muralha_baluarte') {
        feudo.seguranca = Math.min(100, feudo.seguranca + 20);
      } else if (obra.tipo === 'igreja_santuario') {
        feudo.estabilidade = Math.min(100, feudo.estabilidade + 12);
      }

      const texto = `Construção finalizada: "${obra.nome}" foi comissionada e entregue ao povo de ${feudo.nome}!`;
      feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
      camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
      registrarMarco(camp, texto);
    } else {
      restantes.push(obra);
    }
  }

  feudo.obrasEmAndamento = restantes;
  return { concluidas };
}

/** Despacha uma caravana comercial para uma cidade documentada do continente */
export function despacharCaravanaFeudo(
  camp: Campaign,
  destinoId: string,
  destinoNome: string,
  cargaTipo: CargaCaravana,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const maxRotas = 1 + (feudo.edificios.mercado_feitoria ?? 1);

  if (feudo.rotasComerciais.filter(r => r.ativa).length >= maxRotas) {
    return { ok: false, mensagem: `Todas as ${maxRotas} feitorias de despacho comercial estão ocupadas por caravanas em trânsito.` };
  }

  // Custos de abastecimento da caravana
  const custoComida = 15;
  const custoMateriais = cargaTipo === 'armas' || cargaTipo === 'artesanato' ? 10 : 5;

  if (feudo.comida < custoComida) {
    return { ok: false, mensagem: `Provisões insuficientes para abastecer a caravana (requer ${custoComida} mantimentos).` };
  }
  if (feudo.materiais < custoMateriais) {
    return { ok: false, mensagem: `Materiais insuficientes para compor a carga (requer ${custoMateriais} materiais).` };
  }

  feudo.comida -= custoComida;
  feudo.materiais -= custoMateriais;

  // Dias de viagem com base no bioma e destino
  const diasBase = feudo.bioma === 'costa' ? 4 : 6;
  const diasViagemTotal = diasBase;

  // Lucro baseado na especialidade do bioma e carga
  let lucroBase = 60 + (feudo.edificios.mercado_feitoria ?? 1) * 20;
  if (feudo.bioma === 'deserto') lucroBase = Math.floor(lucroBase * 1.4);
  if (cargaTipo === 'armas' && feudo.edificios.oficina_forja > 2) lucroBase += 30;

  // Risco na estrada (reduzido por patrulhas)
  const patrulhaAtiva = feudo.rotasPatrulha.find(p => p.ativa && p.regiaoAlvo === destinoId);
  const riscoEstrada = Math.max(5, 35 - (patrulhaAtiva ? patrulhaAtiva.eficaciaPacificacao : 0) - (feudo.seguranca / 5));

  const novaRota: RotaComercial = {
    id: `caravana_${destinoId}_${Date.now()}`,
    destinoId,
    destinoNome,
    diasViagemTotal,
    diasRestantes: diasViagemTotal,
    cargaTipo,
    lucroEstimado: lucroBase,
    riscoEstrada,
    ativa: true,
  };

  feudo.rotasComerciais.push(novaRota);

  const texto = `Caravana comercial de ${cargaTipo} despachada com destino a ${destinoNome}! Viagem estimada: ${diasViagemTotal} dias. Lucro esperado: +${lucroBase} moedas.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

/** Configura ou atualiza um destacamento militar para patrulhar uma região ou estrada */
export function definirRotaPatrulhaFeudo(
  camp: Campaign,
  regiaoAlvo: string,
  nomeRegiao: string,
  soldados: number,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const soldadosDisponiveis = (feudo.edificios.quartel ?? 1) * 6;

  const soldadosJaAlocados = feudo.rotasPatrulha
    .filter(p => p.regiaoAlvo !== regiaoAlvo && p.ativa)
    .reduce((acc, p) => acc + p.soldadosAlocados, 0);

  if (soldadosJaAlocados + soldados > soldadosDisponiveis) {
    return {
      ok: false,
      mensagem: `Garrison insuficiente! Disponível no quartel: ${soldadosDisponiveis} soldados (Já alocados: ${soldadosJaAlocados}, Solicitados: ${soldados}). Expanda o Quartel-General.`,
    };
  }

  let rota = feudo.rotasPatrulha.find(p => p.regiaoAlvo === regiaoAlvo);
  if (!rota) {
    rota = {
      id: `patrulha_${regiaoAlvo}`,
      regiaoAlvo,
      nomeRegiao,
      soldadosAlocados: soldados,
      eficaciaPacificacao: soldados * 7,
      custoManutencaoDiaria: soldados * 2,
      ativa: soldados > 0,
    };
    feudo.rotasPatrulha.push(rota);
  } else {
    rota.soldadosAlocados = soldados;
    rota.eficaciaPacificacao = soldados * 7;
    rota.custoManutencaoDiaria = soldados * 2;
    rota.ativa = soldados > 0;
  }

  const texto = soldados > 0
    ? `Destacamento de ${soldados} soldados enviado para patrulhar a rota de ${nomeRegiao}. Eficácia de pacificação: +${rota.eficaciaPacificacao}%.`
    : `Patrulhas militares na rota de ${nomeRegiao} suspensas; soldados retornaram à guarnição.`;

  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

/**
 * Processamento cíclico do feudo/reino:
 * Produção de grãos e oficinas, consumo diário, retorno de caravanas comerciais,
 * manutenção de patrulhas e atração de migrantes vindos de cidades em crise no continente.
 */
export function processarCicloReino(camp: Campaign, periodos: number): void {
  const feudo = camp.feudo;
  if (!feudo || !feudo.fundado) return;

  // 1. Avança cooldown das obras em andamento
  avancarObrasFeudo(camp, periodos);

  // Roda cálculos econômicos a cada ciclo de dia completo (a cada 4 períodos)
  const diasFracao = periodos / 4;

  // 2. Consumo de alimentos
  const consumoComida = Math.floor(feudo.populacao * 0.12 * diasFracao);
  feudo.comida = Math.max(0, feudo.comida - consumoComida);

  // 3. Produção agrícola (granjas/lavouras)
  let producaoComida = (feudo.edificios.lavoura_silos ?? 1) * 8 * diasFracao;
  if (feudo.bioma === 'planicie') producaoComida *= 1.3;
  if (feudo.bioma === 'costa') producaoComida += 6 * diasFracao; // Pesca contínua
  feudo.comida += Math.floor(producaoComida);

  // Se acabar a comida, a estabilidade e saúde caem
  if (feudo.comida === 0) {
    feudo.estabilidade = Math.max(10, feudo.estabilidade - 4 * diasFracao);
    feudo.seguranca = Math.max(20, feudo.seguranca - 3 * diasFracao);
  }

  // 4. Produção de materiais (oficinas e pedreiras)
  let producaoMateriais = (feudo.edificios.oficina_forja ?? 1) * 4 * diasFracao;
  if (feudo.bioma === 'montanha') producaoMateriais *= 1.4;
  if (feudo.bioma === 'floresta') producaoMateriais *= 1.35;
  feudo.materiais = Math.min(9999, feudo.materiais + Math.floor(producaoMateriais));

  // 5. Produção de remédios
  const producaoRemedios = (feudo.edificios.boticario_hospital ?? 0) * 3 * diasFracao;
  feudo.remedios = Math.min(500, feudo.remedios + Math.floor(producaoRemedios));

  // 6. Arrecadação de tributos comerciais e de moradias
  const rendaDiaria = ((feudo.edificios.moradias ?? 1) * 3 + (feudo.edificios.mercado_feitoria ?? 1) * 5) * diasFracao;
  feudo.tesouro += Math.floor(rendaDiaria);

  // 7. Custo de manutenção das patrulhas
  const custoPatrulhas = feudo.rotasPatrulha
    .filter(p => p.ativa)
    .reduce((acc, p) => acc + p.custoManutencaoDiaria * diasFracao, 0);
  feudo.tesouro = Math.max(0, feudo.tesouro - Math.floor(custoPatrulhas));

  // 8. Avanço das caravanas comerciais
  const rotasRestantes: RotaComercial[] = [];
  for (const rota of feudo.rotasComerciais) {
    if (!rota.ativa) continue;
    rota.diasRestantes -= diasFracao;

    if (rota.diasRestantes <= 0) {
      // Caravana retornou com riqueza!
      feudo.tesouro += rota.lucroEstimado;
      feudo.materiais += 15;

      // Estimula também a cidade de destino em camp.vivo.cidades se existir
      if (camp.vivo?.cidades[rota.destinoId]) {
        camp.vivo.cidades[rota.destinoId].comida += 20;
        camp.vivo.cidades[rota.destinoId].tesouro += 15;
      }

      const texto = `A caravana comercial retornou vitoriosa de ${rota.destinoNome}! Injetou +${rota.lucroEstimado} moedas e suprimentos no tesouro de ${feudo.nome}.`;
      feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
      camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
      registrarMarco(camp, texto);
    } else {
      rotasRestantes.push(rota);
    }
  }
  feudo.rotasComerciais = rotasRestantes;

  // 9. Dinâmica de imigração e refugiados vindos de cidades continentais em crise
  if (camp.vivo?.cidades && feudo.comida > 50 && feudo.populacao < feudo.capacidadeHabitacional) {
    for (const [cidadeId, c] of Object.entries(camp.vivo.cidades)) {
      if (c.fomeDias > 3 || c.doenca > 40 || c.inseguranca > 60) {
        // Cidades em crise mandam refugiados em busca de segurança no feudo
        const espacoDisponivel = feudo.capacidadeHabitacional - feudo.populacao;
        if (espacoDisponivel > 0) {
          const migrantes = Math.min(4, espacoDisponivel);
          feudo.populacao += migrantes;
          const texto = `${migrantes} colonos e artesãos migraram das dificuldades de ${cidadeId} para buscar abrigo e trabalho em ${feudo.nome}.`;
          feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
          break;
        }
      }
    }
  }

  // 10. Atualiza Tier de Reino de acordo com o porte do feudo
  const totalEdificios = Object.values(feudo.edificios).reduce((a, b) => a + b, 0);
  const tierCalculado = Math.min(10, Math.max(1, Math.floor(totalEdificios / 3) + Math.floor(feudo.populacao / 50)));
  if (tierCalculado > feudo.tierReino) {
    feudo.tierReino = tierCalculado;
    const infoTier = obterTierReinoInfo(tierCalculado, feudo.bioma);
    const texto = `Evolução Histórica! ${feudo.nome} ascendeu para o ${infoTier.titulo}!`;
    feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
    camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
    registrarMarco(camp, texto);
  }

  // 11. Conselho de Regência e Governança Passiva (especialmente quando o Soberano está fora)
  const conselho: Partial<Record<CargoConselho, ConselheiroReino>> = feudo.conselho ?? {};
  const reiAusente = camp.localAtual !== feudo.localId;

  if (reiAusente) {
    // Regente governa no lugar do rei
    if (conselho.regente) {
      if (conselho.regente.competencia >= 14 && conselho.regente.lealdade >= 60) {
        feudo.estabilidade = Math.min(100, feudo.estabilidade + 1);
      } else if (conselho.regente.competencia < 8 || conselho.regente.lealdade < 40) {
        feudo.estabilidade = Math.max(10, feudo.estabilidade - 1);
      }
    } else {
      // Sem regente nomeado durante ausência do soberano, ordem enfraquece
      feudo.estabilidade = Math.max(15, feudo.estabilidade - 1);
    }

    // Tesoureiro: desvios ou cobrança eficiente
    if (conselho.tesoureiro) {
      if (conselho.tesoureiro.corrupcao > 50 && conselho.tesoureiro.lealdade < 50) {
        const desvio = Math.min(feudo.tesouro, Math.floor(conselho.tesoureiro.corrupcao * 0.05 * diasFracao) + 1);
        feudo.tesouro -= desvio;
      } else if (conselho.tesoureiro.competencia >= 14) {
        feudo.tesouro += Math.floor(5 * diasFracao);
      }
    }

    // Marechal: guarnece o castelo e inibe salteadores
    if (conselho.marechal && conselho.marechal.competencia >= 12) {
      feudo.seguranca = Math.min(100, feudo.seguranca + 1);
    }
  }

  // 12. Oficiais militares em serviço ativo: ganho de XP e efeitos no reino
  if (feudo.oficiais && feudo.oficiais.length > 0) {
    for (const oficial of feudo.oficiais) {
      if (!oficial.vivo) continue;

      // Ganho passivo de experiência por dia de serviço
      oficial.experiencia += Math.max(1, Math.floor(2 * diasFracao));

      if (oficial.designacao === 'guarda_castelo') {
        feudo.seguranca = Math.min(100, feudo.seguranca + (oficial.patente === 'capitao' ? 2 : 1));
      } else if (oficial.designacao === 'patrulha_ruas') {
        feudo.estabilidade = Math.min(100, feudo.estabilidade + 1);
      }
    }
  }

  // 13. Arrecadação de tributos de Lordes Vassalos
  if (feudo.vassalos && feudo.vassalos.length > 0) {
    for (const vassalo of feudo.vassalos) {
      if (vassalo.lealdade >= 30) {
        const tributo = Math.floor(vassalo.tributoDiario * diasFracao);
        feudo.tesouro += tributo;
      } else {
        // Vassalo desleal recusa pagamento e conspira
        vassalo.opiniaoSuserano = Math.max(-100, vassalo.opiniaoSuserano - 1);
      }
    }
  }

  // 14. Gestação e Calendário de Linhagem Real (270 dias / 9 meses)
  if (feudo.gestacao?.ativa) {
    if (camp.calendario.dia >= feudo.gestacao.diaPrevisaoParto) {
      // Nascimento do herdeiro dinástico!
      const ehMenino = (camp.turno % 2) === 0;
      const nomeBebe = ehMenino ? 'Aemon' : 'Lyanna';
      darLuzHerdeiro(camp, `${nomeBebe} da Casa ${feudo.casaDinastica?.nome || feudo.nome}`, ehMenino ? 'm' : 'f');
    }
  }

  // Envelhecimento dos herdeiros vivos (360 dias por ano)
  if (feudo.filhosHerdeiros && feudo.filhosHerdeiros.length > 0) {
    for (const filho of feudo.filhosHerdeiros) {
      if (!filho.vivo) continue;
      const idadeCalculada = Math.floor((camp.calendario.dia - filho.diaNascimento) / 360);
      if (idadeCalculada > filho.idadeAnos) {
        filho.idadeAnos = idadeCalculada;
        // Ao crescer, aprimora atributos herdados
        filho.atributos.fisico += 1;
        filho.atributos.raciocinio += 1;
      }
    }
  }

  // 15. Tramas de Usurpação e Infiltração em cidades rivais
  if (feudo.tramasAtivas && feudo.tramasAtivas.length > 0) {
    const tramasRestantes: TramaReino[] = [];
    const compMestre = conselho.mestre_espioes?.competencia ?? 10;

    for (const trama of feudo.tramasAtivas) {
      // Infiltração de oficiais designados
      const oficiaisInfiltrados = (feudo.oficiais ?? []).filter(o => o.vivo && o.designacao === 'infiltracao_externa').length;
      const avanco = (compMestre * 0.4 + oficiaisInfiltrados * 3) * diasFracao;
      trama.progresso = Math.min(100, trama.progresso + avanco);

      if (trama.progresso >= 100) {
        // Golpe bem sucedido! A cidade alvo capitula e torna-se um feudo vassalo da dinastia
        const novoVassalo: LordeVassalo = {
          id: `vassalo_${trama.alvoLocalId}_${Date.now()}`,
          npcId: trama.liderNpcId || 'lorde_local',
          nomeLorde: `Lorde Regente de ${trama.alvoNome}`,
          feudoCedidoId: trama.alvoLocalId,
          nomeFeudo: trama.alvoNome,
          lealdade: 75,
          tributoDiario: 15,
          levasMilitares: 20,
          opiniaoSuserano: 65,
        };

        if (!feudo.vassalos) feudo.vassalos = [];
        feudo.vassalos.push(novoVassalo);

        if (feudo.casaDinastica) {
          feudo.casaDinastica.prestigio += 50;
        }

        const texto = `Vitória de Intriga! O golpe em ${trama.alvoNome} foi coroado de êxito! A cidade jurou vassalagem à Casa ${feudo.casaDinastica?.nome || feudo.nome}!`;
        feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
        camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
        registrarMarco(camp, texto);
      } else {
        tramasRestantes.push(trama);
      }
    }
    feudo.tramasAtivas = tramasRestantes;
  }
}

// ---------------------------------------------------------------------------
// SISTEMA DINÁSTICO, BRASÃO & PRESTÍGIO DA CASA
// ---------------------------------------------------------------------------

export const FIGURAS_BRASAO = [
  { id: 'dragao', nome: 'Dragão Vermelho', descricao: 'Símbolo de soberania e poder arcano indomável.' },
  { id: 'lobo', nome: 'Lobo Cinzento', descricao: 'Símbolo de lealdade de matilha e tenacidade nas neves.' },
  { id: 'leao', nome: 'Leão Dourado', descricao: 'Símbolo de autoridade régia, coragem e honra senhorial.' },
  { id: 'aguia', nome: 'Águia Imperial', descricao: 'Símbolo de visão estratégica, altivez e justiça.' },
  { id: 'torre', nome: 'Torre de Granito', descricao: 'Símbolo de solidez, proteção aos súditos e inexpugnabilidade.' },
  { id: 'espada', nome: 'Espada de Aço', descricao: 'Símbolo de conquista militar, vigilância e disciplina.' },
  { id: 'serpente', nome: 'Serpente Esmeralda', descricao: 'Símbolo de astúcia, mistério e domínio dos segredos.' },
];

/** Funda ou reforma formalmente a Casa Dinástica do soberano com brasão e lema */
export function fundarCasaDinastica(
  camp: Campaign,
  nome: string,
  lema: string,
  corPrimaria = '#c59b27',
  corSecundaria = '#1a1816',
  figura = 'dragao',
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const nomeLimpo = nome.trim() || 'Valtorius';
  const lemaLimpo = lema.trim() || 'Com Sangue e Soberania';

  feudo.casaDinastica = {
    fundada: true,
    nome: nomeLimpo,
    lema: lemaLimpo,
    brasaoCorPrimaria: corPrimaria,
    brasaoCorSecundaria: corSecundaria,
    brasaoFigura: figura,
    prestigio: (feudo.casaDinastica?.prestigio ?? 10) + 20,
  };

  const texto = `A nobre Casa Dinástica "${nomeLimpo}" foi proclamada pelo Soberano! Lema: "${lemaLimpo}". Estandartes foram hasteados em todas as torres de ${feudo.nome}.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
  registrarMarco(camp, texto);

  return { ok: true, mensagem: texto };
}

// ---------------------------------------------------------------------------
// CONSELHO DE REGÊNCIA & GOVERNANÇA SENHORIAL
// ---------------------------------------------------------------------------

export const CARGOS_CONSELHO_INFO: Record<CargoConselho, { nome: string; atributo: keyof Atributos; descricao: string; missao: string }> = {
  regente: {
    nome: 'Lorde Regente da Coroa',
    atributo: 'resiliencia',
    descricao: 'Governa o reino durante a ausência do rei, mantendo a estabilidade e a corte coesa.',
    missao: 'Estabilidade civil, preservação das leis e contenção de revoltas.',
  },
  chanceler: {
    nome: 'Grão-Chanceler Diplomático',
    atributo: 'social',
    descricao: 'Conduz embaixadas com outros clãs, negocia tratados e melhora a opinião dos vassalos.',
    missao: 'Relações exteriores, diplomacia feudal e celebração de tratados.',
  },
  marechal: {
    nome: 'Marechal de Campo',
    atributo: 'fisico',
    descricao: 'Comanda as forças militares, comanda exercícios do quartel e organiza as defesas.',
    missao: 'Segurança das muralhas, patrulhas armadas e liderança na guerra.',
  },
  tesoureiro: {
    nome: 'Mestre da Moeda & Tesoureiro',
    atributo: 'raciocinio',
    descricao: 'Administra a arrecadação de tributos, a alfândega e os estoques dos armazéns.',
    missao: 'Eficiência fiscal, expansão de receitas e auditoria de estoques.',
  },
  mestre_espioes: {
    nome: 'Mestre dos Segredos & Espiões',
    atributo: 'percepcao',
    descricao: 'Comanda a rede invisível de informantes, previne traições e conduz infiltrações.',
    missao: 'Contra-espionagem, detecção de tramas e sabotagens além das fronteiras.',
  },
};

/** Nomeia um NPC de confiança para ocupar um cargo no Conselho de Regência */
export function nomearConselheiro(
  camp: Campaign,
  cargo: CargoConselho,
  npcId: string,
  nomeNpc: string,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  if (!feudo.conselho) {
    feudo.conselho = {
      regente: undefined,
      chanceler: undefined,
      marechal: undefined,
      tesoureiro: undefined,
      mestre_espioes: undefined,
    };
  }

  // Busca dados de confiança e disposição do NPC se estiver em npcState
  const npcDyn = camp.npcState?.[npcId];
  const confianca = npcDyn?.eixos?.confianca ?? 65;
  const lealdade = Math.min(100, Math.max(20, confianca + 10));
  const competencia = Math.min(20, Math.max(8, Math.floor(10 + ((npcDyn?.eixos?.disposicao ?? 50) / 10))));
  const corrupcao = Math.max(0, 100 - lealdade);

  const conselheiro: ConselheiroReino = {
    cargo,
    npcId,
    nome: nomeNpc,
    lealdade,
    competencia,
    corrupcao,
    dataNomeacao: camp.calendario.dia,
  };

  feudo.conselho[cargo] = conselheiro;

  const info = CARGOS_CONSELHO_INFO[cargo];
  const texto = `${nomeNpc} foi empossado perante a corte como ${info.nome}. O selo do cargo foi entregue.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

/** Remove um membro do Conselho de Regência */
export function removerConselheiro(
  camp: Campaign,
  cargo: CargoConselho,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const atual = feudo.conselho?.[cargo];
  if (!atual) return { ok: false, mensagem: 'Este cargo já está vago.' };

  feudo.conselho![cargo] = undefined;
  const texto = `${atual.nome} foi dispensado de suas funções no Conselho de Regência. O cargo de ${CARGOS_CONSELHO_INFO[cargo].nome} está vago.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

// ---------------------------------------------------------------------------
// QUARTEL & PROGRESSÃO DE OFICIAIS MILITARES
// ---------------------------------------------------------------------------

export const CUSTOS_PROMOCAO_OFICIAL: Record<PatenteMilitar, { xpNecessario: number; custoOuro: number; proximaPatente?: PatenteMilitar; titulo: string }> = {
  recruta: { xpNecessario: 50, custoOuro: 20, proximaPatente: 'cabo', titulo: 'Recruta da Guarda' },
  cabo: { xpNecessario: 150, custoOuro: 45, proximaPatente: 'sargento', titulo: 'Cabo de Esquadra' },
  sargento: { xpNecessario: 350, custoOuro: 90, proximaPatente: 'capitao', titulo: 'Sargento Comandante' },
  capitao: { xpNecessario: 650, custoOuro: 180, proximaPatente: 'mestre_espioes', titulo: 'Capitão da Fortaleza' },
  mestre_espioes: { xpNecessario: 99999, custoOuro: 0, titulo: 'Comandante Supremo & Mestre de Guerra' },
};

/** Recruta um novo oficial comissionado no Quartel-General */
export function recrutarOficial(
  camp: Campaign,
  npcId: string,
  nomeNpc: string,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const quartelNivel = feudo.edificios.quartel ?? 0;

  if (quartelNivel < 1) {
    return { ok: false, mensagem: 'É necessário possuir pelo menos um Quartel-General de Nível 1 construído para comissionar oficiais.' };
  }

  const maxOficiais = Math.max(2, quartelNivel * 2);
  if (!feudo.oficiais) feudo.oficiais = [];

  if (feudo.oficiais.filter(o => o.vivo).length >= maxOficiais) {
    return { ok: false, mensagem: `Capacidade de oficiais atingida (${maxOficiais}). Expanda o Quartel-General para comissionar novos oficiais.` };
  }

  const jaExiste = feudo.oficiais.some(o => o.npcId === npcId && o.vivo);
  if (jaExiste) {
    return { ok: false, mensagem: `${nomeNpc} já é um oficial ativo nas forças armadas do reino.` };
  }

  const custoRecrutamento = 25;
  if (feudo.tesouro < custoRecrutamento && (camp.personagem.dinheiro ?? 0) < custoRecrutamento) {
    return { ok: false, mensagem: `Ouro insuficiente para o equipamento e soldo inicial do oficial (${custoRecrutamento} moedas).` };
  }

  if (feudo.tesouro >= custoRecrutamento) {
    feudo.tesouro -= custoRecrutamento;
  } else {
    camp.personagem.dinheiro = Math.max(0, (camp.personagem.dinheiro ?? 0) - custoRecrutamento);
  }

  const novoOficial: OficialReino = {
    id: `oficial_${npcId}_${Date.now()}`,
    npcId,
    nome: nomeNpc,
    patente: 'recruta',
    designacao: 'guarda_castelo',
    experiencia: 0,
    vitorias: 0,
    lealdade: 75,
    vivo: true,
  };

  feudo.oficiais.push(novoOficial);

  const texto = `${nomeNpc} ingressou no Quartel como ${CUSTOS_PROMOCAO_OFICIAL.recruta.titulo}. Estandarte e armadura foram entregues.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

/** Promove a patente de um oficial militar comprovado em batalha ou treinamento */
export function promoverOficial(
  camp: Campaign,
  oficialId: string,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const oficial = (feudo.oficiais ?? []).find(o => o.id === oficialId && o.vivo);
  if (!oficial) return { ok: false, mensagem: 'Oficial não encontrado no efetivo militar.' };

  const infoAtual = CUSTOS_PROMOCAO_OFICIAL[oficial.patente];
  if (!infoAtual.proximaPatente) {
    return { ok: false, mensagem: `${oficial.nome} já alcançou a patente militar máxima de ${infoAtual.titulo}.` };
  }

  if (oficial.experiencia < infoAtual.xpNecessario) {
    return {
      ok: false,
      mensagem: `${oficial.nome} precisa de mais experiência de combate e serviço (${oficial.experiencia}/${infoAtual.xpNecessario} XP). Envie-o em patrulhas ou treinos.`,
    };
  }

  const custo = infoAtual.custoOuro;
  const ouroTotal = feudo.tesouro + (camp.personagem.dinheiro ?? 0);
  if (ouroTotal < custo) {
    return { ok: false, mensagem: `Tesouro insuficiente para armamentos e cerimônia de promoção (${custo} moedas).` };
  }

  if (feudo.tesouro >= custo) {
    feudo.tesouro -= custo;
  } else {
    const resto = custo - feudo.tesouro;
    feudo.tesouro = 0;
    camp.personagem.dinheiro = Math.max(0, (camp.personagem.dinheiro ?? 0) - resto);
  }

  const novaPatente = infoAtual.proximaPatente;
  oficial.patente = novaPatente;
  oficial.lealdade = Math.min(100, oficial.lealdade + 10);

  if (feudo.casaDinastica) {
    feudo.casaDinastica.prestigio += 5;
  }

  const novoTitulo = CUSTOS_PROMOCAO_OFICIAL[novaPatente].titulo;
  const texto = `Promoção Militar! ${oficial.nome} foi solenemente promovido para a patente de ${novoTitulo}!`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

/** Designa a missão operacional de um oficial */
export function designarMissaoOficial(
  camp: Campaign,
  oficialId: string,
  designacao: DesignacaoOficial,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const oficial = (feudo.oficiais ?? []).find(o => o.id === oficialId && o.vivo);
  if (!oficial) return { ok: false, mensagem: 'Oficial não encontrado no efetivo militar.' };

  oficial.designacao = designacao;

  const nomesMissao: Record<DesignacaoOficial, string> = {
    guarda_castelo: 'Guarda da Fortaleza & Torreão',
    patrulha_ruas: 'Patrulha das Ruas & Pacificação Urbana',
    escolta_caravanas: 'Escolta Militar de Caravanas Comerciais',
    infiltracao_externa: 'Infiltração Secreta & Espionagem Além-Fronteiras',
  };

  const texto = `${oficial.nome} assumiu o comando da missão: "${nomesMissao[designacao]}".`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

/** Realiza uma sessão de treinamento militar intensivo no pátio de armas do quartel */
export function treinarOficiais(
  camp: Campaign,
  oficialId?: string,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const oficiais = (feudo.oficiais ?? []).filter(o => o.vivo);
  if (oficiais.length === 0) {
    return { ok: false, mensagem: 'Nenhum oficial comissionado no quartel para treinar.' };
  }

  const custoOuro = 15;
  const custoMateriais = 10;
  if (feudo.tesouro < custoOuro || feudo.materiais < custoMateriais) {
    return { ok: false, mensagem: `Recursos insuficientes para o exercício com armas (exige ${custoOuro} ouro e ${custoMateriais} materiais).` };
  }

  feudo.tesouro -= custoOuro;
  feudo.materiais -= custoMateriais;

  if (oficialId) {
    const alvo = oficiais.find(o => o.id === oficialId);
    if (alvo) {
      alvo.experiencia += 30;
      alvo.vitorias += 1;
    }
  } else {
    for (const o of oficiais) {
      o.experiencia += 15;
    }
  }

  const texto = 'Exercício de armas e disciplina realizado nos pátios do Quartel-General. Os oficiais ganharam experiência tática!';
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

// ---------------------------------------------------------------------------
// CORTE, CASAMENTO, GESTAÇÃO E HERDEIROS DINÁSTICOS
// ---------------------------------------------------------------------------

/** Celebra um casamento real do soberano, fortalecendo a aliança e a linhagem */
export function celebrarCasamento(
  camp: Campaign,
  npcId: string,
  nomeNpc: string,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);

  if (feudo.casamento && feudo.casamento.conjugeNpcId) {
    return { ok: false, mensagem: `O soberano já é casado legitimamente com ${feudo.casamento.nomeConjuge}.` };
  }

  feudo.casamento = {
    conjugeNpcId: npcId,
    nomeConjuge: nomeNpc,
    dataCasamento: camp.calendario.dia,
    afeto: 85,
    diasUltimoEncontro: 0,
  };

  if (feudo.casaDinastica) {
    feudo.casaDinastica.prestigio += 30;
  }
  feudo.estabilidade = Math.min(100, feudo.estabilidade + 15);

  const texto = `Banquete Nupcial Real! O soberano celebrou matrimônio com ${nomeNpc}! Taças foram erguidas por todo o reino.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
  registrarMarco(camp, texto);

  return { ok: true, mensagem: texto };
}

/** Inicia a gestação de um herdeiro legítimo com calendário preciso de 270 dias (9 meses) */
export function iniciarGestacao(camp: Campaign): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  if (!feudo.casamento || !feudo.casamento.conjugeNpcId) {
    return { ok: false, mensagem: 'É necessário possuir matrimônio formalmente celebrado na corte real para conceber herdeiros legítimos.' };
  }

  if (feudo.gestacao?.ativa) {
    const diasRestantes = Math.max(0, feudo.gestacao.diaPrevisaoParto - camp.calendario.dia);
    return { ok: false, mensagem: `${feudo.casamento.nomeConjuge} já está esperando um herdeiro real! Previsão de parto em ${diasRestantes} dias.` };
  }

  // 270 dias de calendário = 9 meses de gestação real
  const duracaoGestacao = 270;
  feudo.gestacao = {
    ativa: true,
    diaInicio: camp.calendario.dia,
    diaPrevisaoParto: camp.calendario.dia + duracaoGestacao,
    progenitorId: feudo.casamento.conjugeNpcId,
    nomeMae: feudo.casamento.nomeConjuge,
    saudeFeto: 100,
  };

  const texto = `A corte real anuncia com júbilo: ${feudo.casamento.nomeConjuge} está grávida do herdeiro da coroa! Previsão de parto no Dia ${feudo.gestacao.diaPrevisaoParto} (em 9 meses / 270 dias).`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

/** Realiza o parto e registra um novo filho herdeiro na dinastia */
export function darLuzHerdeiro(
  camp: Campaign,
  nomeBebe: string,
  genero: 'm' | 'f',
): { ok: boolean; mensagem: string; filho?: FilhoHerdeiro } {
  const feudo = obterFeudo(camp);
  const p = camp.personagem;

  // Herança genética determinística dos atributos dos pais com bônus de linhagem
  const atributosHerdados: Atributos = {
    fisico: Math.max(8, Math.round((p.atributos.fisico ?? 10) * 0.75 + 3)),
    precisao: Math.max(8, Math.round((p.atributos.precisao ?? 10) * 0.75 + 3)),
    resiliencia: Math.max(8, Math.round((p.atributos.resiliencia ?? 10) * 0.75 + 3)),
    raciocinio: Math.max(8, Math.round((p.atributos.raciocinio ?? 10) * 0.75 + 3)),
    percepcao: Math.max(8, Math.round((p.atributos.percepcao ?? 10) * 0.75 + 3)),
    social: Math.max(8, Math.round((p.atributos.social ?? 10) * 0.75 + 3)),
  };

  const novoHerdeiro: FilhoHerdeiro = {
    id: `herdeiro_${Date.now()}_${camp.calendario.dia}`,
    nome: nomeBebe.trim() || (genero === 'm' ? 'Aemon' : 'Lyanna'),
    idadeAnos: 0,
    diaNascimento: camp.calendario.dia,
    genero,
    vivo: true,
    atributos: atributosHerdados,
    legitimidade: 'legitimo',
  };

  if (!feudo.filhosHerdeiros) feudo.filhosHerdeiros = [];
  feudo.filhosHerdeiros.push(novoHerdeiro);

  // Se não houver herdeiro aparente designado, este se torna o primeiro da linha
  if (!feudo.herdeiroAparenteId) {
    feudo.herdeiroAparenteId = novoHerdeiro.id;
  }

  // Encerra gestação ativa
  if (feudo.gestacao) {
    feudo.gestacao.ativa = false;
  }

  if (feudo.casaDinastica) {
    feudo.casaDinastica.prestigio += 35;
  }
  feudo.estabilidade = Math.min(100, feudo.estabilidade + 20);

  const texto = `Ouviram-se os sinos da cidadela! Nasceu ${novoHerdeiro.nome}, herdeiro da Casa Dinástica! Que seu reinado seja longo e próspero.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
  registrarMarco(camp, texto);

  return { ok: true, mensagem: texto, filho: novoHerdeiro };
}

/** Designa formalmente qual filho é o herdeiro aparente da coroa */
export function designarHerdeiroAparente(
  camp: Campaign,
  filhoId: string,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const filho = (feudo.filhosHerdeiros ?? []).find(f => f.id === filhoId && f.vivo);
  if (!filho) return { ok: false, mensagem: 'Herdeiro não encontrado na linhagem real.' };

  feudo.herdeiroAparenteId = filhoId;

  const texto = `Decreto de Sucessão: ${filho.nome} foi proclamado solenemente como Herdeiro Aparente do Trono!`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

// ---------------------------------------------------------------------------
// VASSALAGEM FEUDAL & LEVAS DE SENHORES (ESTILO CK3)
// ---------------------------------------------------------------------------

/** Concede um domínio ou fortaleza conquistada a um lorde juramentado como vassalo */
export function concederFeudoVassalo(
  camp: Campaign,
  lordeNpcId: string,
  nomeLorde: string,
  feudoCedidoId: string,
  nomeFeudo: string,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  if (!feudo.vassalos) feudo.vassalos = [];

  const jaExiste = feudo.vassalos.some(v => v.feudoCedidoId === feudoCedidoId);
  if (jaExiste) {
    return { ok: false, mensagem: `O domínio de ${nomeFeudo} já foi concedido a outro nobre vassalo.` };
  }

  const novoVassalo: LordeVassalo = {
    id: `vassalo_${lordeNpcId}_${Date.now()}`,
    npcId: lordeNpcId,
    nomeLorde,
    feudoCedidoId,
    nomeFeudo,
    lealdade: 80,
    tributoDiario: 12,
    levasMilitares: 15,
    opiniaoSuserano: 70,
  };

  feudo.vassalos.push(novoVassalo);

  if (feudo.casaDinastica) {
    feudo.casaDinastica.prestigio += 15;
  }

  const texto = `Pacto Feudal Selado! O soberano concedeu o senhorio de ${nomeFeudo} a ${nomeLorde}, que jurou homenagem, tributos e levas militares.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

/** Convoca levas militares dos nobres vassalos para defender ou guerrear pela coroa */
export function convocarLevasVassalos(camp: Campaign): { ok: boolean; mensagem: string; soldadosConvocados: number } {
  const feudo = obterFeudo(camp);
  const vassalos = (feudo.vassalos ?? []).filter(v => v.lealdade >= 35);

  if (vassalos.length === 0) {
    return { ok: false, mensagem: 'Nenhum vassalo possui lealdade suficiente para atender ao chamado às armas.', soldadosConvocados: 0 };
  }

  let totalSoldados = 0;
  for (const v of vassalos) {
    totalSoldados += v.levasMilitares;
    // O chamado às armas cansa os vassalos ligeiramente (-5 lealdade)
    v.lealdade = Math.max(10, v.lealdade - 5);
  }

  feudo.seguranca = Math.min(100, feudo.seguranca + Math.floor(totalSoldados / 2));

  const texto = `Convocação de Levas Feudais! Os nobres vassalos responderam com ${totalSoldados} soldados sob seus estandartes para marchar pela coroa!`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto, soldadosConvocados: totalSoldados };
}

// ---------------------------------------------------------------------------
// ASSEMBLEIA DE GUERRA & CONSELHO MILITAR
// ---------------------------------------------------------------------------

/** Convoca a assembleia dos lordes e declara guerra formal a um feudo ou cidade rival */
export function convocarAssembleiaGuerra(
  camp: Campaign,
  alvoCidadeId: string,
  casusBelli: string,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  feudo.guerraDeclaradaAlvoId = alvoCidadeId;

  if (feudo.casaDinastica) {
    feudo.casaDinastica.prestigio += 10;
  }

  const texto = `Guerra Declarada! A Assembleia da Coroa aprovou a marcha contra ${alvoCidadeId}! Casus Belli: "${casusBelli}". Os tambores de batalha ressoam nas muralhas.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
  registrarMarco(camp, texto);

  return { ok: true, mensagem: texto };
}

/** Firma um tratado de paz e encerra o estado de guerra com a cidade rival */
export function firmarTratadoPaz(camp: Campaign): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  if (!feudo.guerraDeclaradaAlvoId) {
    return { ok: false, mensagem: 'O reino não está em guerra ativa no momento.' };
  }

  const alvoAnterior = feudo.guerraDeclaradaAlvoId;
  feudo.guerraDeclaradaAlvoId = undefined;
  feudo.estabilidade = Math.min(100, feudo.estabilidade + 10);

  const texto = `Tratado de Paz Selado! As hostilidades com ${alvoAnterior} foram encerradas sob juramento sagrado.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}

// ---------------------------------------------------------------------------
// TRAMAS DE USURPAÇÃO, INTRIGA & ESPIONAGEM
// ---------------------------------------------------------------------------

/** Inicia uma trama de infiltração e usurpação contra uma fortaleza ou cidade rival */
export function iniciarTramaUsurpacao(
  camp: Campaign,
  alvoCidadeId: string,
  alvoNome: string,
  liderNpcId: string,
  liderNome: string,
): { ok: boolean; mensagem: string } {
  const feudo = obterFeudo(camp);
  const conselho = feudo.conselho;

  if (!conselho?.mestre_espioes) {
    return { ok: false, mensagem: 'É obrigatório nomear um Mestre dos Espiões no Conselho de Regência para orquestrar tramas de usurpação.' };
  }

  if (!feudo.tramasAtivas) feudo.tramasAtivas = [];

  const jaExiste = feudo.tramasAtivas.some(t => t.alvoLocalId === alvoCidadeId);
  if (jaExiste) {
    return { ok: false, mensagem: `Já existe uma trama de usurpação em andamento contra ${alvoNome}.` };
  }

  const custoOuro = 50;
  if (feudo.tesouro < custoOuro && (camp.personagem.dinheiro ?? 0) < custoOuro) {
    return { ok: false, mensagem: `Ouro insuficiente para subornar guardas e criar a rede de espiões (${custoOuro} moedas).` };
  }

  if (feudo.tesouro >= custoOuro) {
    feudo.tesouro -= custoOuro;
  } else {
    camp.personagem.dinheiro = Math.max(0, (camp.personagem.dinheiro ?? 0) - custoOuro);
  }

  const novaTrama: TramaReino = {
    id: `trama_${alvoCidadeId}_${Date.now()}`,
    tipo: 'usurpacao_cidade',
    alvoLocalId: alvoCidadeId,
    alvoNome,
    liderNpcId,
    liderNome,
    progresso: 10,
    segredo: true,
    descoberta: false,
  };

  feudo.tramasAtivas.push(novaTrama);

  const texto = `Rede de sombras ativada: ${liderNome} iniciou uma trama secreta de usurpação em ${alvoNome}. Informantes e infiltrados estão em posição.`;
  feudo.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });

  return { ok: true, mensagem: texto };
}
