// Casas políticas do continente. Conteúdo estático: o estado mutável pertence à engine.
export type CasaNobre = {
  id: string; reino: string; nome: string; lema: string; sede: string;
  territorio: string[]; sucessao: 'primogenitura' | 'eleicao' | 'duelo';
  riqueza: 'baixa' | 'media' | 'alta'; reputacao: string; rivalidades: string[];
};

export const casasVaelhorn: CasaNobre[] = [
  { id: 'halvet', reino: 'halvern', nome: 'Casa de Halvet', lema: 'A pedra permanece', sede: 'casa_senhorial', territorio: ['praca', 'taverna', 'campo_ceifa'], sucessao: 'primogenitura', riqueza: 'media', reputacao: 'Antiga autoridade local, endividada e orgulhosa.', rivalidades: ['mareu'] },
  { id: 'mareu', reino: 'halvern', nome: 'Casa Mareu', lema: 'O sal encontra caminho', sede: 'mareu', territorio: ['mareu', 'porto_sal', 'mercado_peixe'], sucessao: 'eleicao', riqueza: 'alta', reputacao: 'Mercadores que compram silêncio antes de comprar terras.', rivalidades: ['halvet', 'corveira'] },
  { id: 'corveira', reino: 'halvern', nome: 'As Sete Casas de Corveira', lema: 'Nenhuma governa sozinha', sede: 'corveira', territorio: ['corveira', 'mina_corveira', 'aldeia_ferro'], sucessao: 'duelo', riqueza: 'alta', reputacao: 'Famílias mineradoras que tratam contratos como fronteiras.', rivalidades: ['mareu'] },
  { id: 'tessel', reino: 'halvern', nome: 'Casa Tessel', lema: 'A fronteira não dorme', sede: 'tessel', territorio: ['tessel', 'forte_agulha', 'passo_lobo'], sucessao: 'eleicao', riqueza: 'media', reputacao: 'Militares que trocam proteção por lealdade.', rivalidades: ['halvet'] },
];
