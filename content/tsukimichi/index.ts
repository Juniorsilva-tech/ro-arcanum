// ARCANUM · Pacote de conteúdo do Mundo de Tsukimichi.
//
// DLC autônoma: o jogador escolhe "Jogar Novo Mundo" na tela inicial e
// recebe este ContentBundle em vez de conteudoVaelhorn. O cenário tem
// Tsige (cidade mercantil), a Grande Terra Desolada (Wasteland), Rotsgard
// (academia central) e o subespaço de Asora.
//
// Os contratos de alma (engine/tsukimichi.ts) são agnósticos de cenário
// — funcionam com qualquer Campaign.
import type { ContentBundle, Local, Criatura, Cenario, Classe, Origem, Verbo, Item, NPC, Quest, Mestre, Trabalho, Arte, Reliquia } from '../../engine/types';
import { locaisTsukimichi, ARESTAS_TSUKIMICHI } from '../vaelhorn/tsukimichiMundo';
import { verbosVaelhorn } from '../vaelhorn/verbs';
import { itensVaelhorn } from '../vaelhorn/items';
import { encontrosPorTipo } from '../vaelhorn/bestiary';

// ── Cenário ─────────────────────────────────────────────────────────────────
const tsukimichiCenario: Cenario = {
  id: 'tsukimichi',
  nome: 'Novo Mundo — Tsukimichi',
  genero: 'Isekai Fantasia',
  ancoraCalendario: 'desde a queda do Sem-Bênção em Tsige',
  nomesAtributos: {
    fisico: 'Physic',
    precisao: 'Destreza',
    resiliencia: 'Mana Corporal',
    raciocinio: 'Intelecto',
    percepcao: 'Percepção',
    social: 'Influência',
  },
  recursos: [
    { id: 'mana', nome: 'Mana' },
    { id: 'vigor', nome: 'Vigor' },
  ],
  pressoes: [
    { id: 'overload', nome: 'Sobrecarga de Mana', descricao: 'mana acumulado além do limite do corpo' },
    { id: 'presenca', nome: 'Presença do Mestre', descricao: 'emanação de poder que intimida aliados e inimigos' },
  ],
  eixosRelacao: [
    { id: 'lealdade', nome: 'Lealdade' },
    { id: 'afeto', nome: 'Afeto' },
    { id: 'ciume', nome: 'Ciúme' },
  ],
  acentoCor: '#5B9BD5', // azul névoa
  k: 4,
  tabuCentral: 'revelar o poder real antes da hora certa',
  premissa: [
    'O OUTRO ISEKAI — você não é Makoto Misumi; Makoto caminha por este mundo como líder da Companhia Kuzunoha. ' +
      'Você é outro convocado da Terra pelo Deus de seu mundo de origem, igualmente banido e descartado pela Deusa na Wasteland, ' +
      'e agraciado com o Domínio Inato do Kai (Sakai). Seu destino é seu: você pode ser igual, aliado ou superar Makoto em poder absoluto.',
    'TSIGE — a cidade da fronteira, onde aventureiros vivem da Wasteland e morrem por ela. A Guilda ' +
      'ri do Cartão E que você carrega. Eles vão parar de rir.',
    'A WASTELAND — a Grande Terra Desolada que separa os continentes dos hyumans. Bestas ancestrais ' +
      'de nível incomensurável vivem lá. Algumas delas vão querer um contrato com você.',
    'ASORA — um subespaço dimensional que abre depois do primeiro contrato de alma. Uma terra onde ' +
      'suas servas governam, e onde você constrói um mundo paralelo enquanto o mundo oficial te ignora.',
    'O HARÉM DO MESTRE — não é detalhe, é mecânica. Tomoe, Mio, Shiki e as que vierem depois ' +
      'são aliadas com personalidade própria, ciúme real e poder que esmaga continentes. Cuide bem delas.',
  ],
};

// ── Classes específicas do Novo Mundo ────────────────────────────────────────
const classesTsukimichi: Classe[] = [
  {
    id: 'espadachim_asora',
    nome: 'Espadachim',
    recursoPrincipal: 'vigor',
    mecanicaUnica:
      'Caminho da Espada: acertos consecutivos acumulam foco (+1 acerto e +2 dano por acúmulo). No foco máximo, o golpe perfeito atinge o Vazio, ignora a guarda adversária e desfere dano colossal.',
    descricao:
      'Fundamentado na disciplina marcial clássica e na filosofia de Miyamoto Musashi (O Livro dos Cinco Anéis e Niten Ichi-ryu). O espadachim rejeita adornos supérfluos e busca a essência pura do corte, o ritmo decisivo e a serenidade do Vazio (Kū). Canaliza o Kai para firmar cada golpe e postura, testando os limites supremos do guerreiro contra qualquer adversário.',
    bonusAtributos: { fisico: 2, precisao: 2, resiliencia: 1 },
    periciasIniciais: { briga: 2, atletismo: 1, perceber: 1 },
    itensIniciais: { katana_asora: 1, pocao_cura_menor: 2, racao: 5 },
    equipInicial: { arma: 'katana_asora', armadura: 'gibao_de_couro' },
    artesIniciais: ['corte_dimensional_asora', 'iaijutsu_nevoa_ilusoria'],
  },
  {
    id: 'arqueiro_azusa',
    nome: 'Arqueiro',
    recursoPrincipal: 'mana',
    mecanicaUnica:
      'Disciplina do Arco: postura inabalável. Disparos ignoram cobertura inimiga e ganham +3 de acerto cirúrgico.',
    descricao:
      'A disciplina clássica do tiro com arco, focada na postura corporal, na respiração e no alinhamento da mente com o alvo. Disparos precisos de mana condensado que voam em trajetória pura e perfuram barreiras.',
    bonusAtributos: { precisao: 3, raciocinio: 1, percepcao: 1 },
    periciasIniciais: { perceber: 2, rastrear: 2, atletismo: 1 },
    itensIniciais: { arco_azusa: 1, pocao_cura_menor: 2, racao: 5 },
    equipInicial: { arma: 'arco_azusa', armadura: 'roupa_acolchoada' },
    artesIniciais: ['disparo_cometa_kyudo', 'chuva_flechas_mana'],
  },
  {
    id: 'sem_bencao',
    nome: 'Mago',
    recursoPrincipal: 'mana',
    mecanicaUnica:
      'Poder Primordial: reserva de mana colossal que abala a moral dos inimigos no início do combate.',
    descricao:
      'Conjurador que manipula o fluxo primordial de mana e feitiços de destruição de área. Carrega uma reserva mágica que transborda além das escalas de medição convencionais.',
    bonusAtributos: { raciocinio: 2, percepcao: 2, resiliencia: 1 },
    periciasIniciais: { perceber: 2, rastrear: 1, atletismo: 1 },
    itensIniciais: { cajado_de_carvalho: 1, racao: 5, pocao_cura_menor: 2 },
    equipInicial: { arma: 'cajado_de_carvalho', armadura: 'roupa_acolchoada' },
    artesIniciais: ['barreira_sakai_supressao'],
  },
  {
    id: 'aventureiro_tsige',
    nome: 'Aventureiro',
    recursoPrincipal: 'vigor',
    mecanicaUnica:
      'Sobrevivência de Fronteira: adaptado a zonas hostis com mobilidade e instinto tático.',
    descricao:
      'Guerreiro pragmático e versátil, curtido pelas estradas e perigos da fronteira. Especialista em sobrevivência, combate adaptativo e reconhecimento.',
    bonusAtributos: { fisico: 2, percepcao: 2 },
    periciasIniciais: { atletismo: 2, rastrear: 1, intimidar: 1 },
    itensIniciais: { espada_curta: 1, gibao_de_couro: 1, racao: 5, pocao_cura_menor: 1 },
    equipInicial: { arma: 'espada_curta', armadura: 'gibao_de_couro' },
  },
];

// ── Origens específicas do Novo Mundo ────────────────────────────────────────
const origensTsukimichi: Origem[] = [
  {
    id: 'isekai_japonesa',
    nome: 'Transferido do Japão',
    arquetipo: 'poder sem contexto',
    descricao: 'Você não é deste mundo. Não no sentido filosófico — literalmente. ' +
      'Sua memória do outro mundo é vantagem em raciocínio e pesquisa, mas zero em sobrevivência local.',
    oQueFalta: 'pertencimento',
    bonusAtributos: { raciocinio: 2 },
    dinheiroInicial: 0,
    flagsIniciais: { 'origem.isekai': true },
  },
  {
    id: 'aventureiro_sem_sorte',
    nome: 'Aventureiro sem sorte',
    arquetipo: 'esforço sem resultado',
    descricao: 'Você tentou. Tentou muito. A Wasteland simplesmente ainda não te matou, ' +
      'mas sua conta na Guilda está negativa e sua reputação está no chão.',
    oQueFalta: 'reconhecimento',
    bonusAtributos: { fisico: 1, resiliencia: 1 },
    dinheiroInicial: 5,
    flagsIniciais: { 'reputacao.guilda': -10 },
  },
];

// ── Criaturas da Wasteland (exportadas do bestiary de Vaelhorn) ────────────────
// Reutiliza as criaturas da Wasteland definidas em content/vaelhorn/bestiary.ts
import { criaturasVaelhorn } from '../vaelhorn/bestiary';

// ── Campeões Ápice da Espada no Mundo (No Máximo 1 por Raça) ─────────────────
// Os maiores mestres vivos de kenjutsu e lâminas no mundo de Tsukimichi.
// Cada um representa o pináculo de sua respectiva raça:
// - Hyuman: Sofia Bulga (A Matadora de Dragões, NvG 920)
// - Dragão Superior: Mitsurugi / Lancer (O Dragão das Mil Lâminas, NvG 1150)
// - Demônio: General Io (O Colosso de Quatro Lâminas, NvG 850)
// - Homem-Fera (Beastkin): Lupus (A Presa Primal da Wasteland, NvG 780)
// (Nota: Elder Dwarf é representado por Mestre Beren em Asora, NvG 680)
export const campeoesEspadaTsukimichi: Criatura[] = [
  {
    id: 'sofia_bulga',
    nome: 'Sofia Bulga (A Matadora de Dragões)',
    descricao:
      'A maior espadachim hyuman viva e aventureira lendária (Nível 920). Empunha a colossal Matadora de Dragões com lâminas espirituais dracônicas que desafiam a própria Deusa.',
    nivel: 12,
    nivelGuilda: 920,
    vida: 280,
    defesa: 24,
    acerto: 26,
    ataqueNome: 'Corte Dracônico Esmeralda',
    dano: { base: 38, dispersao: 0.15, tipo: 'cortante' },
    moralBase: 95,
    xp: 400,
    faccaoId: 'guilda_aventureiros',
    chefe: true,
    regiaoExclusiva: 'Grande Terra Desolada',
    loot: [
      { item: 'espada_longa', chance: 0.5 },
      { item: 'pocao_cura', chance: 1.0 },
    ],
    fase2: {
      gatilhoPct: 0.4,
      descricao: 'Sofia desembainha as lâminas espirituais dos dragões abatidos e redobra a voracidade dos golpes.',
      mecanica: 'enfurecer',
    },
  },
  {
    id: 'dragao_mitsurugi',
    nome: 'Mitsurugi (O Dragão das Mil Lâminas)',
    descricao:
      'Dragão Superior primordial também conhecido como Lancer, o mestre supremo da espada entre os dragões (Nível 1.150). Conjura dezenas de espadas voadoras dimensionais.',
    nivel: 13,
    nivelGuilda: 1150,
    vida: 340,
    defesa: 26,
    acerto: 27,
    ataqueNome: 'Dança das Mil Lâminas Primordiais',
    dano: { base: 42, dispersao: 0.2, tipo: 'cortante' },
    moralBase: 100,
    xp: 480,
    faccaoId: 'fauna',
    chefe: true,
    regiaoExclusiva: 'Grande Terra Desolada',
    loot: [{ item: 'espada_longa', chance: 0.8 }],
    fase2: {
      gatilhoPct: 0.45,
      descricao: 'Mitsurugi manifesta uma chuva infinita de lâminas dracônicas em trajetória perpendicular.',
      mecanica: 'chamar_reforco',
    },
  },
  {
    id: 'general_io',
    nome: 'General Io (O Colosso de Quatro Lâminas)',
    descricao:
      'General supremo do exército demoníaco (Nível 850). Um gigante de quatro braços empunhando quatro espadas imensas reforçadas por anulação de mana e impacto sísmico.',
    nivel: 11,
    nivelGuilda: 850,
    vida: 310,
    defesa: 25,
    acerto: 23,
    ataqueNome: 'Tempestade de Quatro Lâminas Demoníacas',
    dano: { base: 36, dispersao: 0.25, tipo: 'contundente' },
    moralBase: 95,
    xp: 380,
    faccaoId: 'fauna',
    chefe: true,
    regiaoExclusiva: 'Grande Terra Desolada',
    loot: [{ item: 'machado_de_guerra', chance: 0.6 }],
    fase2: {
      gatilhoPct: 0.5,
      descricao: 'O General Io flexiona seus quatro braços e quebra as proteções ao redor com mana demoníaco bruto.',
      mecanica: 'enfurecer',
    },
  },
  {
    id: 'lupus_rei_feras',
    nome: 'Lupus (A Presa Primal da Wasteland)',
    descricao:
      'O maior espadachim entre todas as tribos de homens-fera (Nível 780). Empunha cimitarras gêmeas forjadas de presas ancestrais, movendo-se com velocidade supersônica.',
    nivel: 10,
    nivelGuilda: 780,
    vida: 250,
    defesa: 22,
    acerto: 28,
    ataqueNome: 'Presas Cruzadas do Vento Feroz',
    dano: { base: 34, dispersao: 0.15, tipo: 'cortante' },
    moralBase: 90,
    xp: 350,
    faccaoId: 'fauna',
    chefe: true,
    regiaoExclusiva: 'Grande Terra Desolada',
    loot: [{ item: 'espada_curta', chance: 0.6 }],
    fase2: {
      gatilhoPct: 0.4,
      descricao: 'Lupus entra em transe de caça primal, antecipando cada golpe com audição e olfato aguçados.',
      mecanica: 'enfurecer',
    },
  },
];

// ── Heróis Oficiais Invocados pela Deusa (Reinos dos Humanos) ────────────────
// Os dois heróis oficiais trazidos da Terra pela Deusa, abençoados com
// carisma divino, armas sagradas e idolatrados pelas cortes reais humanas:
// - Império de Gritonia: Tomoki Iwahashi (NvG 650, Olho do Encanto / Hipnose)
// - Reino Santo de Limia: Hibiki Otonashi (NvG 720, Estrategista e Espadachim Sagrada)
export const heroisInvocadosTsukimichi: Criatura[] = [
  {
    id: 'heroi_tomoki',
    nome: 'Tomoki Iwahashi (O Herói de Gritonia)',
    descricao:
      'Herói oficial invocado pela Deusa para o Império militar de Gritonia (Nível 650). Empunha lança sagrada de energia e usa o Olho do Encanto para subordinar mentes.',
    nivel: 9,
    nivelGuilda: 650,
    vida: 210,
    defesa: 20,
    acerto: 22,
    ataqueNome: 'Disparo de Luz Sagrada de Gritonia',
    dano: { base: 28, dispersao: 0.2, tipo: 'perfurante' },
    moralBase: 85,
    xp: 300,
    faccaoId: 'guilda_aventureiros',
    chefe: true,
    regiaoExclusiva: 'Grande Terra Desolada',
    loot: [{ item: 'pocao_cura', chance: 1.0 }],
    fase2: {
      gatilhoPct: 0.4,
      descricao: 'Tomoki ativa o Olho do Encanto da Deusa, emitindo uma onda mental perturbadora.',
      mecanica: 'enfurecer',
    },
  },
  {
    id: 'heroina_hibiki',
    nome: 'Hibiki Otonashi (A Heroína de Limia)',
    descricao:
      'Heroína oficial invocada pela Deusa para o Reino de Limia (Nível 720). Espadachim talentosa e líder carismática idolatrada pelos Humanos.',
    nivel: 10,
    nivelGuilda: 720,
    vida: 240,
    defesa: 23,
    acerto: 25,
    ataqueNome: 'Golpe Solar da Chama Prateada',
    dano: { base: 32, dispersao: 0.15, tipo: 'cortante' },
    moralBase: 95,
    xp: 340,
    faccaoId: 'guilda_aventureiros',
    chefe: true,
    regiaoExclusiva: 'Grande Terra Desolada',
    loot: [
      { item: 'espada_longa', chance: 0.8 },
      { item: 'pocao_cura', chance: 1.0 },
    ],
    fase2: {
      gatilhoPct: 0.35,
      descricao: 'Hibiki firma a postura de comando heroico, inspirando determinação santa e redobrando o foco.',
      mecanica: 'enfurecer',
    },
  },
];

const criaturasWasteland: Criatura[] = [
  ...criaturasVaelhorn.filter(
    (c) =>
      c.regiaoExclusiva === 'Grande Terra Desolada' ||
      ['lobo_chifre', 'javali_carapaca', 'inseto_wasteland', 'ave_tempestuosa'].includes(c.id),
  ),
  ...campeoesEspadaTsukimichi,
  ...heroisInvocadosTsukimichi,
];

// ── NPCs Centrais do Novo Mundo & Asora ─────────────────────────────────────
const npcsTsukimichi: NPC[] = [
  {
    id: 'ema_highland',
    nome: 'Ema de Highland',
    idade: 19,
    ocupacao: 'Líder dos Orcs de Highland & Gestora Agrícola',
    faccaoId: 'asora',
    localBase: 'asora_vila_central',
    rotina: { manha: 'asora_vila_central', tarde: 'asora_vila_central', noite: 'asora_fontes_termais' },
    vozNarrativa: 'Voz doce, zelosa e extremamente organizada, tratando assuntos do Mestre com veneração e rigor prático',
    personalidade: 'Dedicada, paciente e diplomática; cuida dos suprimentos de Asora e da harmonia entre as diferentes raças demi-humanas.',
    corpo: 'Jovem orc nobre de traços delicados e postura graciosa, usando vestes práticas de tecido fino de Asora.',
  },
  {
    id: 'mestre_beren',
    nome: 'Mestre Beren',
    idade: 210,
    ocupacao: 'Líder dos Elder Dwarves & Grão-Ferreiro Rúnico',
    faccaoId: 'asora',
    localBase: 'asora_forja_anoes',
    rotina: { manha: 'asora_forja_anoes', tarde: 'asora_forja_anoes', noite: 'asora_fontes_termais' },
    vozNarrativa: 'Voz rouca, orgulhosa e apaixonada pelo ofício, pontuada pelo martelar rítmico da bigorna',
    personalidade: 'Perfeccionista implacável; forja armamentos divinos e anéis Draupnir para conter o mana infinito do Mestre.',
    corpo: 'Anão ancião atarracado e musculoso, barba espessa trançada com anéis de prata rúnica.',
  },
  {
    id: 'comandante_zalax',
    nome: 'Comandante Zalax',
    idade: 28,
    ocupacao: 'Comandante dos Mist Lizards & Sentinela de Fronteira',
    faccaoId: 'asora',
    localBase: 'asora_vila_central',
    rotina: { manha: 'asora_vila_central', tarde: 'asora_vila_central', noite: 'asora_vila_central' },
    vozNarrativa: 'Voz sibilante, firme e marcial, repleta de disciplina militar e respeito incondicional ao Mestre',
    personalidade: 'Guerreiro estoico e honrado, devoto ao treinamento físico diário de seus guerreiros para honrar o Mestre.',
    corpo: 'Homem-lagarto imponente de escamas anil brilhantes, portando alabarda pesada com equilíbrio impecável.',
  },
  {
    id: 'renox_guilda',
    nome: 'Renox',
    idade: 42,
    ocupacao: 'Avaliador Chefe da Guilda de Aventureiros de Tsige',
    faccaoId: 'guilda_aventureiros',
    localBase: 'tsige_guilda_aventureiros',
    rotina: { manha: 'tsige_guilda_aventureiros', tarde: 'tsige_guilda_aventureiros', noite: 'tsige_portao_ermo' },
    vozNarrativa: 'Voz cínica e pragmática de comerciante de fronteira acostumado a ver novatos morrerem toda semana',
    personalidade: 'Frio, ganancioso e calculista; desdenha de cartões Nível 1 até ver pilhas de materiais intactos da Wasteland.',
    corpo: 'Hyuman magro de olhos perspicazes e casaco de lã de montanha gasto nas mangas.',
  },
  {
    id: 'makoto_misumi',
    nome: 'Makoto Misumi (Raidou Kuzunoha)',
    idade: 18,
    ocupacao: 'Líder da Companhia Kuzunoha & Arqueiro de Azusa',
    faccaoId: 'companhia_kuzunoha',
    localBase: 'tsige_companhia_kuzunoha',
    rotina: {
      manha: 'tsige_companhia_kuzunoha',
      tarde: 'tsige_distrito_comercial',
      noite: 'tsige_companhia_kuzunoha',
    },
    vozNarrativa:
      'Voz calma, ponderada e educada em japonês formal, que carrega a autoridade quieta de quem não busca conflito mas pode obliterar uma cidade com uma flecha de mana',
    personalidade:
      'Pragmático, protetor com os seus e focado no comércio e bem-estar de seus aliados; reconhece imediatamente outro isekai anômalo que também carrega o poder do Criador e foi rejeitado pela Deusa.',
    corpo:
      'Jovem de traços comuns da Terra, vestindo sobretudo de seda nobre de Asora com o brasão da Companhia Kuzunoha e portando anéis Draupnir para conter o mana infinito.',
  },
];

// ── Encontros por região do Novo Mundo ──────────────────────────────────────
const encontrosTsukimichi: Record<string, string[]> = {
  Tsige: ['salteador', 'bandido', 'foragido_veterano', 'lobo_chifre', 'salteador_arqueiro'],
  'Grande Terra Desolada': [
    'lobo_chifre',
    'javali_carapaca',
    'inseto_wasteland',
    'ave_tempestuosa',
    'mamute_geada_wasteland',
    'alke_rainha_prole',
    'serpente_ouroboros_vermelha',
    'dragao_ryusen',
    'dragao_shen',
    'aranha_calamidade',
    'mizuchi_ancestral',
    'fenix_suzaku',
    'sofia_bulga',
    'dragao_mitsurugi',
    'general_io',
    'lupus_rei_feras',
    'heroi_tomoki',
    'heroina_hibiki',
  ],
  'Academia de Rotsgard': ['capanga_do_senhorio', 'salteador', 'bandido'],
  'Subespaço de Asora': [],
};

// ── Mapa: integração de locais e arestas ─────────────────────────────────────
function integrarMapaTsukimichi(): Local[] {
  const todos = [...locaisTsukimichi.map((l) => ({ ...l, rotas: [] as typeof l.rotas }))];
  const porId = new Map(todos.map((l) => [l.id, l]));

  const ligar = (de: string, para: string, periodos: number, perigo: number) => {
    const local = porId.get(de);
    if (!local || !porId.has(para)) return;
    if (local.rotas.some((r) => r.destino === para)) return;
    local.rotas = [...local.rotas, { destino: para, periodos, perigo }];
  };

  for (const [a, b, periodos, perigo] of ARESTAS_TSUKIMICHI) {
    // Ignora a aresta que conecta com Vaelhorn (solgar está fora deste bundle)
    if (a === 'solgar' || b === 'solgar') continue;
    ligar(a, b, periodos, perigo);
    ligar(b, a, periodos, perigo);
  }

  // Garante bidirecionais nas rotas manuais já existentes
  for (const l of todos) {
    for (const r of l.rotas) {
      const destino = porId.get(r.destino);
      if (destino && !destino.rotas.some((v) => v.destino === l.id)) {
        destino.rotas = [...destino.rotas, { destino: l.id, periodos: r.periodos, perigo: r.perigo }];
      }
    }
  }

  return todos;
}

const mapaTsukimichi = integrarMapaTsukimichi();

// ── Itens Específicos de Tsukimichi & Asora ─────────────────────────────────
const itensTsukimichi: Item[] = [
  ...itensVaelhorn,
  {
    id: 'katana_asora',
    nome: 'Katana de Asora',
    descricao:
      'Forjada pelos Elder Dwarves em Asora com prata estelar e têmpera de névoa primordial. Responde ao fluxo de mana do espadachim, cortando matéria física e feitiços.',
    slot: 'arma',
    alcance: 'corpo',
    peso: 2,
    valor: 160,
    raridade: 'rara',
    empilhavel: false,
    atributoAtaque: 'precisao',
    dano: { base: 16, dispersao: 0.25, tipo: 'cortante' },
    lojas: ['asora_forja_anoes', 'tsige_distrito_comercial'],
  },
  {
    id: 'arco_azusa',
    nome: 'Grande Arco de Azusa',
    descricao:
      'Arco nobre esculpido para a disciplina de Kyudo do outro mundo. Canaliza disparos de mana condensado que perfuram qualquer barreira física sem perder o alinhamento.',
    slot: 'arma',
    alcance: 'distancia',
    peso: 3,
    valor: 150,
    raridade: 'rara',
    empilhavel: false,
    atributoAtaque: 'precisao',
    dano: { base: 15, dispersao: 0.2, tipo: 'perfurante' },
    lojas: ['asora_vila_central', 'tsige_distrito_comercial'],
  },
  {
    id: 'traje_supressao_asora',
    nome: 'Traje de Seda Noturna de Asora',
    descricao:
      'Tecido com fios de névoa primordial e seda estelar de Asora. Sela completamente o vazamento de mana do portador, permitindo caminhar entre Humanos sem provocar calafrios, pavor ou histeria.',
    slot: 'armadura',
    peso: 3,
    valor: 200,
    defesa: 14,
    raridade: 'rara',
    empilhavel: false,
    suprimeMana: true,
    lojas: ['asora_vila_central', 'tsige_companhia_kuzunoha'],
  },
  {
    id: 'armadura_placas_asora',
    nome: 'Armadura de Placas Rúnicas de Asora',
    descricao:
      'Forjada com ligas nobres pelos Elder Dwarves de Mestre Beren. Placas pesadas com têmpera dimensional capazes de resistir a sopros dracônicos e feitiços imperiais.',
    slot: 'armadura',
    peso: 12,
    valor: 260,
    defesa: 20,
    raridade: 'rara',
    empilhavel: false,
    lojas: ['asora_forja_anoes'],
  },
  {
    id: 'manto_nevoas_supressao',
    nome: 'Manto das Névoas de Asora',
    descricao:
      'Manto com capuz infundido na bruma ilusória de Tomoe. Oculta a presença e apaga a assinatura mágica do portador de inquisidores e sensores arcanos humanos.',
    slot: 'acessorio',
    peso: 1,
    valor: 120,
    defesa: 3,
    raridade: 'notavel',
    empilhavel: false,
    suprimeMana: true,
    lojas: ['asora_vila_central'],
  },
  {
    id: 'anel_draupnir',
    nome: 'Anel Draupnir de Asora',
    descricao:
      'Anel rúnico esculpido pelos Elder Dwarves para conter e condensar o fluxo infinito de mana. Suprime a emanação excessiva e acumula carga mágica pura para detonação emergencial.',
    slot: 'acessorio',
    peso: 0,
    valor: 80,
    raridade: 'notavel',
    empilhavel: true,
    suprimeMana: true,
    lojas: ['asora_forja_anoes'],
  },
];

// ── Artes de Combate e Lâmina de Tsukimichi ──────────────────────────────────
const artesTsukimichi: Arte[] = [
  {
    id: 'corte_dimensional_asora',
    nome: 'Corte Duplo: Niten',
    escola: 'Técnica',
    grau: 'rara',
    custo: { recurso: 'vigor', valor: 5 },
    efeito:
      'Princípio de corte contínuo de Miyamoto Musashi (Niten Ichi-ryu): desfere 2 golpes devastadores em rápida sucessão, canalizando a firmeza do Kai no gume para quebrar as defesas do adversário.',
    tecnica: {
      estilo: 'Kenjutsu Niten',
      modo: 'corte',
      potencia: 18,
      golpes: 2,
      nivelMinimo: 1,
      recarga: 2,
      descricaoRegra: 'Desfere 2 ataques em rápida sucessão com lâmina cortante (potência 18 cada).',
    },
  },
  {
    id: 'iaijutsu_nevoa_ilusoria',
    nome: 'Iaijutsu: Postura do Vazio',
    escola: 'Técnica',
    grau: 'notavel',
    custo: { recurso: 'vigor', valor: 4 },
    efeito:
      'Saque relâmpago fundamentado no ritmo e na serenidade do Vazio (Gorin no Sho). Antecipa o movimento do oponente com precisão marcial enquanto ergue 2 cargas de esquiva tática.',
    tecnica: {
      estilo: 'Kenjutsu Clássico',
      modo: 'esquiva',
      potencia: 15,
      golpes: 1,
      nivelMinimo: 1,
      recarga: 2,
      descricaoRegra: 'Ataca o alvo (potência 15) e ergue 2 cargas de esquiva tática.',
    },
  },
  {
    id: 'disparo_cometa_kyudo',
    nome: 'Disparo Cometa de Kyudo',
    escola: 'Técnica',
    grau: 'rara',
    custo: { recurso: 'mana', valor: 5 },
    efeito:
      'Postura meditativa de Kyudo. Canaliza flecha de mana maciço que atinge o ponto vital com precisão cirúrgica.',
    tecnica: {
      estilo: 'Kyudo de Azusa',
      modo: 'precisao',
      potencia: 22,
      golpes: 1,
      nivelMinimo: 1,
      recarga: 2,
      descricaoRegra: 'Disparo único de alta precisão (+5 de acerto de precisão, potência 22).',
    },
  },
  {
    id: 'chuva_flechas_mana',
    nome: 'Chuva de Flechas de Asora',
    escola: 'Evocação',
    grau: 'notavel',
    custo: { recurso: 'mana', valor: 7 },
    efeito:
      'Dispara uma salva de mana para o céu que desaba em flechas translúcidas atingindo todos os inimigos.',
    tecnica: {
      estilo: 'Kyudo de Azusa',
      modo: 'area',
      potencia: 14,
      golpes: 1,
      nivelMinimo: 1,
      recarga: 3,
      descricaoRegra: 'Atinge todos os inimigos vivos em combate com saraivada de mana (potência 14).',
    },
  },
  {
    id: 'barreira_sakai_supressao',
    nome: 'Barreira de Sakai: Supressão',
    escola: 'Abjuração',
    grau: 'notavel',
    custo: { recurso: 'mana', valor: 6 },
    efeito:
      'Expande o Domínio Perceptivo do Sakai em torno do corpo, manifestando 2 cargas de guarda impenetrável.',
    tecnica: {
      estilo: 'Domínio Sakai',
      modo: 'guarda',
      potencia: 0,
      nivelMinimo: 1,
      recarga: 3,
      descricaoRegra: 'Ergue 2 cargas de guarda tática que reduzem o dano recebido em 65%.',
    },
  },
];

// ── ContentBundle exportado ──────────────────────────────────────────────────
export const conteudoTsukimichi: ContentBundle = {
  cenario: tsukimichiCenario,
  classes: classesTsukimichi,
  origens: origensTsukimichi,
  verbos: verbosVaelhorn, // reusa o catálogo universal de verbos
  locais: mapaTsukimichi,
  npcs: npcsTsukimichi,
  mestres: [] as Mestre[],
  trabalhos: [] as Trabalho[],
  artes: artesTsukimichi,
  reliquias: [] as Reliquia[],
  itens: itensTsukimichi,
  criaturas: criaturasWasteland,
  quests: [] as Quest[],
  faccoes: [
    { id: 'guilda_aventureiros', nome: 'Guilda de Aventureiros de Tsige' },
    { id: 'companhia_kuzunoha', nome: 'Companhia Kuzunoha' },
    { id: 'fauna', nome: 'Fauna Selvagem da Wasteland' },
    { id: 'asora', nome: 'Habitantes de Asora' },
  ],
  encontrosPorTipo,
  encontrosPorRegiao: encontrosTsukimichi,
  localInicial: 'wasteland_fronteira',
};
