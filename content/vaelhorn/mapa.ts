// Coordenadas de apresentação do mapa. Não representam distância nem alteram
// rotas: a engine continua sendo a fonte de verdade para viagens.
export type PosicaoMapa = { x: number; y: number };

const REGIOES = ['Marca de Tessel', 'Planalto de Corveira', 'Costa de Mareu', 'Bosque de Vintra', 'Ermo de Solgar', 'Halvern', 'Baixios de Halvern'];

export function posicaoMapa(localId: string, regiao?: string): PosicaoMapa {
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
