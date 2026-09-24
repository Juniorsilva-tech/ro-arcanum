// Casas políticas do continente. Conteúdo estático: o estado mutável pertence à engine.
//
// Sessão 50 (Fase 4): cada casa passa a ter gente. `membros` diz quem é quem:
// a chefe, as herdeiras em ordem de linha, as colaterais (que entram na
// eleição e tramam quando a casa enfraquece), quem serve e, onde a sucessão é
// por duelo, a campeã. A engine (engine/casas.ts) aplica a regra de sucessão
// sobre essa lista.
export type PapelNaCasa = 'chefe' | 'herdeira' | 'colateral' | 'servidora' | 'campea';
export type MembroCasa = { npc: string; papel: PapelNaCasa; ordem?: number; nota: string };
export type CasaNobre = {
  id: string; reino: string; nome: string; lema: string; sede: string;
  territorio: string[]; sucessao: 'primogenitura' | 'eleicao' | 'duelo';
  riqueza: 'baixa' | 'media' | 'alta'; reputacao: string; rivalidades: string[];
  /** Família nobre e quem a serve. Opcional para casas de outros bundles. */
  membros?: MembroCasa[];
  /** Família do elenco (content/vaelhorn/familias.ts) que é o sangue da casa. */
  familia?: string;
};

export const casasVaelhorn: CasaNobre[] = [
  { id: 'halvet', reino: 'halvern', nome: 'Casa de Halvet', lema: 'A pedra permanece', sede: 'casa_senhorial', territorio: ['praca', 'taverna', 'campo_ceifa'], sucessao: 'primogenitura', riqueza: 'media', reputacao: 'Antiga autoridade local, endividada e orgulhosa.', rivalidades: ['mareu'],
    familia: 'casa_de_halvet',
    membros: [
      { npc: 'dama_valda', papel: 'chefe', nota: 'Governa a casa desde que o marido morreu, e a vende aos pedaços para não perdê-la inteira.' },
      { npc: 'ysolde', papel: 'herdeira', ordem: 1, nota: 'Herdeira por falta do irmão que a Leva levou.' },
      { npc: 'ilse', papel: 'herdeira', ordem: 2, nota: 'Segunda na linha, filha da prima; quer sair dela.' },
      { npc: 'maelis', papel: 'colateral', nota: 'A prima que vive de favor e guarda uma carta que muda a linha.' },
      { npc: 'teoda', papel: 'servidora', nota: 'A escriba que sabe quanto a casa deve, porque escreve os dois livros.' },
    ] },
  { id: 'mareu', reino: 'halvern', nome: 'Casa Mareu', lema: 'O sal encontra caminho', sede: 'mareu', territorio: ['mareu', 'porto_sal', 'mercado_peixe'], sucessao: 'eleicao', riqueza: 'alta', reputacao: 'Mercadores que compram silêncio antes de comprar terras.', rivalidades: ['halvet', 'corveira'],
    // A casa de Mareu é a guilda do sal, e a guilda é das Olho-Vivo: nasceu
    // de uma bancada no galpão delas (Local.historia do Mercado do Peixe).
    familia: 'as_olho_vivo',
    membros: [
      { npc: 'morador_mercado_peixe_0', papel: 'chefe', nota: 'Senhora do Mercado do Peixe e cabeça das Olho-Vivo; o conselho de Mareu vota o que a casa dela escreve.' },
      { npc: 'mirel', papel: 'herdeira', ordem: 1, nota: 'A filha que estudou em Corveira e quer a casa sem a guilda.' },
      { npc: 'morador_mercado_peixe_2', papel: 'colateral', nota: 'A irmã, mestra da guilda do sal, candidata na eleição que não houve ainda.' },
      { npc: 'morador_mareu_14', papel: 'colateral', nota: 'A prima de fora da muralha, que lembra a quem a casa deve a primeira banca.' },
      { npc: 'morador_mareu_2', papel: 'servidora', nota: 'Mestra da guilda em Mareu; escreve na véspera o que o conselho aprova.' },
      { npc: 'morador_mareu_0', papel: 'servidora', nota: 'A senhora da cidade de Mareu, que assina o que a casa decide.' },
    ] },
  { id: 'corveira', reino: 'halvern', nome: 'As Sete Casas de Corveira', lema: 'Nenhuma governa sozinha', sede: 'corveira', territorio: ['corveira', 'mina_corveira', 'aldeia_ferro'], sucessao: 'duelo', riqueza: 'alta', reputacao: 'Famílias mineradoras que tratam contratos como fronteiras.', rivalidades: ['mareu'],
    // Das sete, a que responde pela cidade hoje é a casa Verrão.
    familia: 'as_verrao',
    membros: [
      { npc: 'senhora_corveira', papel: 'chefe', nota: 'Cabeça da casa Verrão, a que tem voz pelas sete no conselho da cidade.' },
      { npc: 'morador_corveira_0', papel: 'herdeira', ordem: 1, nota: 'A filha mais velha, senhora da cidade no papel.' },
      { npc: 'morador_corveira_7', papel: 'herdeira', ordem: 2, nota: 'A caçula, escrivã do registro que a mãe manda apagar.' },
      { npc: 'irma_copista', papel: 'herdeira', ordem: 3, nota: 'A filha do mosteiro; em duelo de sucessão, luta por procuração ou renuncia.' },
      { npc: 'morador_corveira_8', papel: 'campea', nota: 'Veste as cores Verrão na arena; em duelo de sucessão, luta pela herdeira que a casa apontar.' },
      { npc: 'morador_corveira_16', papel: 'servidora', nota: 'A cocheira da família, que leva as Verrão aonde elas mandam e vê o que elas fazem.' },
    ] },
  { id: 'tessel', reino: 'halvern', nome: 'Casa Tessel', lema: 'A fronteira não dorme', sede: 'tessel', territorio: ['tessel', 'forte_agulha', 'passo_lobo'], sucessao: 'eleicao', riqueza: 'media', reputacao: 'Militares que trocam proteção por lealdade.', rivalidades: ['halvet'],
    // A casa da marca é a dos Varn: três gerações de marechalas.
    familia: 'as_varn',
    membros: [
      { npc: 'marechala_odile', papel: 'chefe', nota: 'Marechala da marca, a gêmea que nasceu primeiro — segundo o livro.' },
      { npc: 'morador_tessel_17', papel: 'herdeira', ordem: 1, nota: 'Filha da marechala, pregoeira, candidata que ninguém duvida que vai concorrer.' },
      { npc: 'morador_tessel_7', papel: 'colateral', nota: 'A gêmea do registro; na eleição, a candidata que a guarda velha prefere.' },
      { npc: 'morador_tessel_1', papel: 'servidora', nota: 'Capitã da guarda de Tessel, leal ao posto mais do que à pessoa que o ocupa.' },
      { npc: 'morador_tessel_8', papel: 'campea', nota: 'Campeã da arena, que leva recado de Ketta e luta em nome da marca nas festas.' },
    ] },
];
