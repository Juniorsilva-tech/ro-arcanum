// Coordenadas de apresentação do mapa. Não representam distância nem alteram
// rotas: a engine continua sendo a fonte de verdade para viagens.
export type PosicaoMapa = { x: number; y: number };

export const COORDENADAS_LOCAIS: Record<string, PosicaoMapa> = {
  // ── Vale de Halvet (Coração do Continente) ──────────────────────
  taverna: { x: 58, y: 56 },
  praca: { x: 62.5, y: 55 },
  mercado: { x: 53.5, y: 56.5 },
  capela: { x: 61, y: 51 },
  cripta: { x: 65, y: 52 },
  floresta: { x: 43, y: 44 },
  ponte: { x: 46.5, y: 54 },
  moinho: { x: 50.5, y: 60 },
  cemiterio: { x: 64, y: 58 },
  lago: { x: 39, y: 51 },
  casa_senhorial: { x: 68.5, y: 60 },
  acampamento: { x: 44, y: 58 },
  ruinas: { x: 77, y: 63 },
  estrada: { x: 52, y: 40 },
  torre: { x: 72, y: 52 },
  mina: { x: 47.5, y: 65 },
  mansao_ubuyashiki: { x: 36, y: 30 },
  castelo_infinito: { x: 50, y: 10 },
  vila_ferreiros: { x: 56.5, y: 67 },

  // ── Marca de Tessel (Fronteira Militar Norte) ────────────────────
  tessel: { x: 46.5, y: 17 },
  forte_agulha: { x: 64, y: 15 },
  casa_da_agulha: { x: 69, y: 19 },
  passo_lobo: { x: 55, y: 23 },
  vila_pedravel: { x: 42, y: 25 },
  campo_ceifa: { x: 60, y: 27 },
  capela_campo: { x: 66, y: 28 },

  // ── Bosque de Vintra (Mata Antiga a Oeste) ───────────────────────
  vintra: { x: 28.5, y: 39 },
  aldeia_carvoeira: { x: 23, y: 47 },
  clareira_pedras: { x: 33.5, y: 58 },
  pantano_lodo: { x: 18.5, y: 60 },
  aldeia_lenha: { x: 35, y: 44 },

  // ── Planalto de Corveira (Forjas de Adamante ao Sul/Centro) ───────
  corveira: { x: 43, y: 75 },
  aldeia_ferro: { x: 48, y: 69 },
  mina_corveira: { x: 56.5, y: 65 },
  colina_forcados: { x: 36, y: 70 },
  mosteiro_alto: { x: 53, y: 60 },
  vila_terraco: { x: 40, y: 72 },
  forja_afundada: { x: 45, y: 78 },

  // ── Ermo de Solgar (Deserto Amarelo a Sudoeste) ─────────────────
  solgar: { x: 25.5, y: 83 },
  poco_seco: { x: 25.5, y: 88 },
  caravancerai: { x: 32, y: 84 },
  ruina_areia: { x: 36, y: 92 },

  // ── Costa de Mareu (Portos e Marés a Sudeste) ─────────────────────
  mareu: { x: 69.5, y: 75 },
  porto_sal: { x: 63.5, y: 85 },
  farol_quebrado: { x: 83, y: 64 },
  aldeia_rede: { x: 81, y: 76 },
  estrada_costeira: { x: 65, y: 79 },
  mercado_peixe: { x: 71, y: 78 },

  // ── Bacia de Halvern e Baixios ───────────────────────────────────
  halvern: { x: 68.5, y: 50 },
  estrada_real: { x: 58, y: 35 },
  vau_pedra: { x: 46.5, y: 44.5 },
  charco_juncal: { x: 64, y: 56 },
  vila_juncal: { x: 65, y: 61 },
  toca_juncal: { x: 63, y: 65 },

  // ── Legado / Aliases de compatibilidade ──────────────────────────
  porto: { x: 69.5, y: 75 },
  pantano: { x: 18.5, y: 60 },
  mansao: { x: 68.5, y: 50 },
  ferreiro: { x: 54, y: 62 },
  vila: { x: 65, y: 61 },
  bosque: { x: 44, y: 38 },
  mosteiro: { x: 53, y: 60 },
  quartel: { x: 64, y: 15 },
  templo: { x: 64, y: 43 },
  caverna: { x: 47.5, y: 63 },

  // ── Tsukimichi: Tsige (Sudoeste - Civilização Mercantil) ────────
  tsige_distrito_comercial: { x: 18, y: 72 },
  tsige_guilda_aventureiros: { x: 12, y: 84 },
  tsige_companhia_kuzunoha: { x: 26, y: 84 },
  tsige_portao_ermo: { x: 22, y: 56 },

  // ── Tsukimichi: Wasteland (Hostil) ──────────────────────────────
  wasteland_fronteira: { x: 42, y: 52 },
  wasteland_desfiladeiro: { x: 56, y: 34 },
  wasteland_pantano_bruma: { x: 58, y: 70 },
  wasteland_ninho_fenix: { x: 76, y: 46 },

  // ── Tsukimichi: Academia de Rotsgard (Noroeste) ─────────────────
  rotsgard_distrito_central: { x: 22, y: 22 },
  rotsgard_biblioteca_arcanum: { x: 34, y: 16 },

  // ── Tsukimichi: Subespaço de Asora (Nordeste) ───────────────────
  asora_vila_central: { x: 80, y: 18 },
  asora_forja_anoes: { x: 74, y: 30 },
  asora_fontes_termais: { x: 88, y: 30 },
  asora_atelie_seda: { x: 82, y: 40 },
};

export const CAPITAIS_CONTINENTE = [
  { id: 'tessel', nome: 'Tesselgarde', regiao: 'Marca de Tessel', x: 46.5, y: 17, tipo: 'Fortaleza do Norte' },
  { id: 'corveira', nome: 'Corveiraborg', regiao: 'Planalto de Corveira', x: 43, y: 75, tipo: 'Cidadela das Forjas' },
  { id: 'mareu', nome: 'Mareuborg', regiao: 'Costa de Mareu', x: 69.5, y: 75, tipo: 'Porto Imperial' },
  { id: 'vintra', nome: 'Vintraborg', regiao: 'Bosque de Vintra', x: 28.5, y: 39, tipo: 'Baluarte dos Bosques' },
  { id: 'solgar', nome: 'Solgar Capital', regiao: 'Ermo de Solgar', x: 25.5, y: 83, tipo: 'Entreposto do Deserto' },
  { id: 'halvern', nome: 'Halvetia Capital', regiao: 'Vale de Halvet', x: 68.5, y: 60, tipo: 'Antiga Capital da Coroa' },
  { id: 'taverna', nome: 'Vale de Halvet', regiao: 'Vale de Halvet', x: 58, y: 56, tipo: 'Coração do Vale' },
];

const REGIOES = [
  'Vale de Halvet',
  'Marca de Tessel',
  'Planalto de Corveira',
  'Costa de Mareu',
  'Bosque de Vintra',
  'Ermo de Solgar',
  'Halvern',
  'Baixios de Halvern',
  'Grande Terra Desolada',
  'Tsige',
  'Academia de Rotsgard',
  'Subespaço de Asora',
];

export function posicaoMapa(localId: string, regiao?: string): PosicaoMapa {
  if (COORDENADAS_LOCAIS[localId]) {
    return COORDENADAS_LOCAIS[localId];
  }
  let hash = 0;
  for (let i = 0; i < localId.length; i++) hash = (hash * 31 + localId.charCodeAt(i)) >>> 0;
  const ri = Math.max(0, REGIOES.indexOf(regiao ?? ''));
  const coluna = hash % 5;
  const linha = (hash >>> 3) % 3;
  return {
    x: Math.min(94, 15 + ((ri % 4) * 20) + coluna * 2.5),
    y: Math.min(88, 15 + (Math.floor(ri / 4) * 32) + linha * 8),
  };
}
