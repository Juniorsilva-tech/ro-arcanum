// Coordenadas de apresentação do mapa. Não representam distância nem alteram
// rotas: a engine continua sendo a fonte de verdade para viagens.
export type PosicaoMapa = { x: number; y: number };

const COORDENADAS_TSUKIMICHI: Record<string, PosicaoMapa> = {
  // Tsige (Sudoeste - Civilização Mercantil)
  tsige_distrito_comercial: { x: 18, y: 72 },
  tsige_guilda_aventureiros: { x: 12, y: 84 },
  tsige_companhia_kuzunoha: { x: 26, y: 84 },
  tsige_portao_ermo: { x: 22, y: 56 },

  // Grande Terra Desolada / Wasteland (Centro e Sudeste - Hostil)
  wasteland_fronteira: { x: 42, y: 52 },
  wasteland_desfiladeiro: { x: 56, y: 34 },
  wasteland_pantano_bruma: { x: 58, y: 70 },
  wasteland_ninho_fenix: { x: 76, y: 46 },

  // Academia de Rotsgard (Noroeste - Polo Intelectual)
  rotsgard_distrito_central: { x: 22, y: 22 },
  rotsgard_biblioteca_arcanum: { x: 34, y: 16 },

  // Subespaço de Asora (Nordeste - Dimensão Autônoma)
  asora_vila_central: { x: 80, y: 18 },
  asora_forja_anoes: { x: 74, y: 30 },
  asora_fontes_termais: { x: 88, y: 30 },
  asora_atelie_seda: { x: 82, y: 40 },
};

const REGIOES = [
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
  if (COORDENADAS_TSUKIMICHI[localId]) {
    return COORDENADAS_TSUKIMICHI[localId];
  }
  let hash = 0;
  for (let i = 0; i < localId.length; i++) hash = (hash * 31 + localId.charCodeAt(i)) >>> 0;
  const ri = Math.max(0, REGIOES.indexOf(regiao ?? ''));
  const coluna = hash % 5;
  const linha = (hash >>> 3) % 3;
  return {
    x: Math.min(94, 7 + ((ri % 4) * 23) + coluna * 3),
    y: Math.min(88, 10 + (Math.floor(ri / 4) * 38) + linha * 11),
  };
}
