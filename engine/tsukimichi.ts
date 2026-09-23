// ARCANUM · Expansão Tsukimichi: Contratos de Alma, Harém de Soberanas e Assentamento de Asora.
//
// Governa a mecânica de pactos de alma (Mestre-Servo 2:8, 1:9, 5:5), a transmutação
// para formas humanoides femininas canônicas, e a soberania dimensional de Asora.
import type {
  CampaignState,
  AsoraState,
  ContratoAlma,
  ObraAsora,
  ProporcaoContrato,
  Atributos,
  ModoKai,
  OcupanteSubespaco,
  SetorTrabalhoSubespaco,
  TriboAcolhida,
  EstrategiaCompanhia,
} from './types';

export type EntidadeContratavelDef = {
  id: string;
  nomeDefault: string;
  titulo: string;
  formaOriginal: string;
  formaHumanoide: {
    aparencia: string;
    vestes: string;
    personalidade: string;
    voz: string;
  };
  bonusBase: Partial<Atributos>;
  papelAsora: ContratoAlma['papelAsora'];
};

export const ENTIDADES_CONTRATAVEIS: Record<string, EntidadeContratavelDef> = {
  dragao_shen: {
    id: 'dragao_shen',
    nomeDefault: 'Tomoe',
    titulo: 'O Dragão Superior das Névoas',
    formaOriginal: 'Dragão serpentino colossal de escamas brancas e azuis etéreas envolto em bruma perpétua',
    formaHumanoide: {
      aparencia: 'Mulher esbelta e alta, de longos cabelos azul-celeste e olhar altivo e perspicaz',
      vestes: 'Quimono nobre de samurai com hakama azul-marinho, portando uma katana elegante na cintura',
      personalidade: 'Apaixonada pela cultura clássica, dramas históricos e bushido; conselheira sábia, brincalhona e refinada',
      voz: 'Tom nobre, teatral e autoritário, que se suaviza com afeição ao se dirigir ao Mestre',
    },
    bonusBase: {
      fisico: 3,
      percepcao: 4,
      raciocinio: 3,
      resiliencia: 2,
    },
    papelAsora: 'governante',
  },
  aranha_calamidade: {
    id: 'aranha_calamidade',
    nomeDefault: 'Mio',
    titulo: 'A Calamidade Voraz',
    formaOriginal: 'Monstruosa aranha de ébano gigante com mandíbulas que distorcem o espaço e devoram mana',
    formaHumanoide: {
      aparencia: 'Jovem voluptuosa de pele alva como porcelana e profundos cabelos negros brilhantes',
      vestes: 'Quimono negro decorado com motivos florais de cerejeira e fios dourados de seda mágica',
      personalidade: 'Devoção ardente e ciumenta pelo Mestre; fissurada em culinária requintada e banhos relaxantes',
      voz: 'Voz doce e dengosa para o Mestre, mas impiedosa, gélida e assustadora para quaisquer inimigos',
    },
    bonusBase: {
      fisico: 4,
      resiliencia: 5,
      precisao: 2,
    },
    papelAsora: 'guardia',
  },
  mizuchi_ancestral: {
    id: 'mizuchi_ancestral',
    nomeDefault: 'Mizuchi',
    titulo: 'A Soberana dos Mares Ocultos',
    formaOriginal: 'Leviatã marinho serpenteante que comanda tufões e tsunamis abissais',
    formaHumanoide: {
      aparencia: 'Dama imponente de olhos índigo penetrantes e cabelos longos como ondas marinhas',
      vestes: 'Túnica de escamas azuis translúcidas e manto de névoa aquática, empunhando uma lança de gelo vivo',
      personalidade: 'Serena, estóica e reservada; age como sentinela implacável das águas sagradas de Asora',
      voz: 'Grave, cristalina e melodiosa, lembrando o som suave das marés calmas',
    },
    bonusBase: {
      precisao: 3,
      raciocinio: 4,
      percepcao: 3,
    },
    papelAsora: 'diplomata',
  },
  fenix_suzaku: {
    id: 'fenix_suzaku',
    nomeDefault: 'Suzaku',
    titulo: 'A Chama Radiante Primordial',
    formaOriginal: 'Grande pássaro de fogo dourado cujas plumas incandescentes purificam todo miasma terreno',
    formaHumanoide: {
      aparencia: 'Mulher deslumbrante de cabelos cor de brasa viva e porte imperial majestoso',
      vestes: 'Vestes carmesim com detalhes dourados flamejantes que ondulam suavemente como labaredas',
      personalidade: 'Impetuosa, passional e extremamente ciumenta; orgulhosa de sua força solar mas submissa ao Mestre',
      voz: 'Radiante e apaixonada, emanando calor reconfortante e firmeza inabalável',
    },
    bonusBase: {
      fisico: 3,
      precisao: 4,
      resiliencia: 3,
      social: 2,
    },
    papelAsora: 'guardia',
  },
  lich_shiki: {
    id: 'lich_shiki',
    nomeDefault: 'Shiki',
    titulo: 'O Mestre dos Treze Passos / O Lich Sábio',
    formaOriginal: 'Lich etéreo de energia arcana fria e olhos que brilham como estrelas de gelo; presença que gela o ar',
    formaHumanoide: {
      aparencia: 'Jovem pálido de aparência refinada, cabelos negros lisos e olhos de íris âmbar gelados e perspicazes',
      vestes: 'Robe acadêmico escuro com detalhes de runas douradas; carrega sempre um caderno de pesquisa encadernado em couro',
      personalidade: 'Metódico, analítico e extremamente curioso. Trata tudo como objeto de estudo, inclusive o próprio Mestre. Formalmente cortês, raramente demonstra emoção mas age com lealdade inquestionável.',
      voz: 'Tom neutro e preciso, como um professor que nunca eleva a voz, mas cada palavra carrega peso absoluto',
    },
    bonusBase: {
      raciocinio: 5,
      percepcao: 4,
      social: 2,
    },
    papelAsora: 'artesa',
  },
  dragao_ryusen: {
    id: 'dragao_ryusen',
    nomeDefault: 'Ryuuka',
    titulo: 'A Soberana das Cataratas de Jade',
    formaOriginal: 'Dragão serpentino colossal de escamas cor de esmeralda viva que comanda correntes torrenciais',
    formaHumanoide: {
      aparencia: 'Mulher altiva de longos cabelos esmeralda trançados com pérolas fluviais e olhos verde-mar cintilantes',
      vestes: 'Quimono translúcido de seda azul-turquesa e jade, portando leques com lâminas de vácuo líquido',
      personalidade: 'Nobre e competitiva perante Tomoe; orgulha-se de sua linhagem de dragão de águas bravias, mas amolece com mimos e carinhos do Mestre',
      voz: 'Cristalina e melodiosa como o eco de cascatas profundas, suavemente dengosa em momentos a sós',
    },
    bonusBase: {
      precisao: 4,
      fisico: 3,
      raciocinio: 3,
    },
    papelAsora: 'guardia',
  },
  mamute_geada_wasteland: {
    id: 'mamute_geada_wasteland',
    nomeDefault: 'Ymiria',
    titulo: 'A Matriarca dos Picos Glaciais',
    formaOriginal: 'Mamute colossal com presas de puro âmbar milenar e pelagem densa de neve e gelo perpétuo',
    formaHumanoide: {
      aparencia: 'Mulher alta e imponente de formas voluptuosas e acolhedoras, pele alva e fartos cabelos prateados como nevasca',
      vestes: 'Túnica pesada forrada de peles nobres e veludo invernal, decorada com joias esculpidas em âmbar bruto',
      personalidade: 'Maternal, extremamente carinhosa e protetora; envolve o Mestre em abraços apertados para aquecê-lo e cozinha pratos fartos',
      voz: 'Quente, calorosa e maternalmente reconfortante, mas capaz de trovejar como avalanche contra inimigos do Mestre',
    },
    bonusBase: {
      resiliencia: 5,
      fisico: 4,
      raciocinio: 1,
    },
    papelAsora: 'governante',
  },
  serpente_ouroboros_vermelha: {
    id: 'serpente_ouroboros_vermelha',
    nomeDefault: 'Scarlet',
    titulo: 'A Dançarina das Areias Carmesim',
    formaOriginal: 'Serpente titânica de escamas de basalto avermelhado incandescente que rasga dunas inteiras',
    formaHumanoide: {
      aparencia: 'Jovem sedutora de pele morena dourada e olhos felinos de rubi com fendas hipnóticas; cabelos carmesim ondulantes',
      vestes: 'Véus esvoaçantes de seda carmesim e dourada presos por correntes finas de ouro no ventre e tornozelos',
      personalidade: 'Misteriosa, provocadora e apaixonada; adora enlaçar o braço do Mestre e sussurrar segredos arcanos para atiçar o ciúme das outras servas',
      voz: 'Suave, rouca e sussurrada, carregada de sensualidade e magnetismo hipnótico',
    },
    bonusBase: {
      precisao: 4,
      social: 4,
      resiliencia: 3,
    },
    papelAsora: 'diplomata',
  },
  alke_rainha_prole: {
    id: 'alke_rainha_prole',
    nomeDefault: 'Lilith',
    titulo: 'A Rainha Tecelã dos Abismos',
    formaOriginal: 'Aranha de guerra gigante de carapaça obsidiana polida e mandíbulas que cizalgam aço',
    formaHumanoide: {
      aparencia: 'Mulher esbelta e elegante de estética aristocrática sombria, olhos púrpura brilhantes e cabelos negros com mechas violeta',
      vestes: 'Vestido vitoriano deslumbrante de renda e seda mágica viva preta que ondula suavemente como sombras',
      personalidade: 'Cultíssima, perfeccionista e obcecada por moda e tecelagem; venera Mio como predecessora sagrada e serve ao Mestre com requinte e devoção',
      voz: 'Elegante, polida e aveludada, modulada com respeito cerimonial impecável',
    },
    bonusBase: {
      percepcao: 5,
      precisao: 4,
      resiliencia: 2,
    },
    papelAsora: 'artesa',
  },
};

/**
 * Cria o estado inicial de Asora com as obras fundamentais.
 */
export function inicializarAsora(nomePersonalizado?: string): AsoraState {
  const obras: Record<string, ObraAsora> = {
    lavoura_highland: {
      id: 'lavoura_highland',
      nome: 'Terras Agrícolas dos Orcs de Highland',
      nivel: 1,
      maxNivel: 5,
      responsavel: 'Ema de Highland',
      descricao: 'Cultivo massivo de cereais e frutas de Asora, garantindo fartura alimentar contínua.',
    },
    forja_anoes: {
      id: 'forja_anoes',
      nome: 'Complexo Metalúrgico dos Elder Dwarves',
      nivel: 1,
      maxNivel: 5,
      responsavel: 'Mestre Beren',
      descricao: 'Engenharia rúnica que forja anéis Draupnir de contenção e armas míticas.',
    },
    onsen_termas: {
      id: 'onsen_termas',
      nome: 'Fontes Termais Shinto & Santuário',
      nivel: 1,
      maxNivel: 5,
      responsavel: 'Tamaki',
      descricao: 'Pavilhões de banho purificador que restauram fadiga, estresse e pressões físicas.',
    },
    atelie_alkes: {
      id: 'atelie_alkes',
      nome: 'Ateliê de Seda Arcana das Alkes',
      nivel: 1,
      maxNivel: 5,
      responsavel: 'Alke Matriarca',
      descricao: 'Fiação da seda especial de Mio em trajes de luxo imunes a lâminas e fogo.',
    },
    quartel_lizards: {
      id: 'quartel_lizards',
      nome: 'Campo Marcial dos Mist Lizards',
      nivel: 1,
      maxNivel: 5,
      responsavel: 'Comandante Zalax',
      descricao: 'Treinamento de infantaria reptiliana disciplinada para guarda de fronteiras.',
    },
  };

  return {
    nome: nomePersonalizado?.trim() || 'Subespaço Pessoal',
    desbloqueado: false,
    populacao: 0,
    seguranca: 80,
    harmonia: 90,
    obras,
    estoques: {
      comida: 50,
      seda: 10,
      minerio: 20,
      draupnir: 1,
    },
    contratos: {},
    tribosAcolhidas: {},
    alocacaoTrabalho: {
      agricultura: 0,
      mineracao: 0,
      forja_ferramentas: 0,
      tecelagem: 0,
      seguranca_patrulha: 0,
      construcao_obras: 0,
    },
    recursosEspeciais: {
      ferramentasDisponiveis: 0,
      madeiraNobre: 20,
    },
    projetosConcluidos: [],
  };
}

/**
 * Permite ao jogador determinar ou renomear seu subespaço soberano a qualquer momento.
 */
export function definirNomeSubespaco(
  camp: CampaignState,
  novoNome: string,
): { sucesso: boolean; mensagem: string } {
  const asora = obterAsora(camp);
  const nomeAntigo = asora.nome || 'Subespaço Pessoal';
  const nomeLimpo = novoNome.trim();

  if (!nomeLimpo) {
    return {
      sucesso: false,
      mensagem: 'O nome do subespaço não pode ser vazio.',
    };
  }

  asora.nome = nomeLimpo;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto: `Soberania Dimensional: O subespaço anteriormente chamado "${nomeAntigo}" agora é formalmente reconhecido como "${nomeLimpo}".`,
  });

  return {
    sucesso: true,
    mensagem: `O subespaço foi renomeado para "${nomeLimpo}" com sucesso.`,
  };
}

/**
 * Retorna os ocupantes atuais presentes fisicamente no subespaço dimensional.
 * Permite ao jogador e aos sistemas saberem a qualquer momento quem está dentro
 * do subespaço (Tomoe, Mio, servos, artesãos e o próprio protagonista).
 */
export function obterOcupantesSubespaco(camp: CampaignState): {
  nomeSubespaco: string;
  jogadorPresente: boolean;
  localJogador: string;
  ocupantes: OcupanteSubespaco[];
  resumoPresenca: string;
} {
  const asora = camp.asora;
  const nomeSub = asora?.nome || 'Subespaço Pessoal';
  const localAtual = camp.localAtual || '';

  if (!asora || !asora.desbloqueado) {
    return {
      nomeSubespaco: nomeSub,
      jogadorPresente: false,
      localJogador: localAtual,
      ocupantes: [],
      resumoPresenca: 'O subespaço ainda não foi desbloqueado por um Contrato de Alma.',
    };
  }

  const ocupantes: OcupanteSubespaco[] = [];
  const jogadorNoSubespaco = localAtual.startsWith('asora_');

  if (jogadorNoSubespaco) {
    ocupantes.push({
      id: 'jogador',
      nome: camp.personagem.nome,
      papel: 'Soberano Criador',
      localSetor: localAtual,
      tipo: 'jogador',
    });
  }

  if (asora.contratos) {
    for (const [id, c] of Object.entries(asora.contratos)) {
      if (c.ativaNoGrupo) {
        if (jogadorNoSubespaco) {
          ocupantes.push({
            id: c.id,
            nome: c.nomeConcedido,
            papel: `${c.titulo} (ao lado do Mestre)`,
            localSetor: localAtual,
            tipo: 'serva',
          });
        }
      } else {
        let setorResidencia = 'asora_vila_central';
        let papel = `${c.titulo} (Residência & Governança)`;
        if (c.papelAsora === 'guardia') {
          setorResidencia = 'asora_vila_central';
          papel = `${c.titulo} (Guarda Territorial & Patrulha)`;
        } else if (c.papelAsora === 'artesa') {
          setorResidencia = 'asora_forja_anoes';
          papel = `${c.titulo} (Supervisão de Oficinas e Forjas)`;
        } else if (c.papelAsora === 'governante') {
          setorResidencia = 'asora_vila_central';
          papel = `${c.titulo} (Governança e Plantações)`;
        }

        ocupantes.push({
          id: c.id,
          nome: c.nomeConcedido,
          papel,
          localSetor: setorResidencia,
          tipo: 'serva',
        });
      }
    }
  }

  // 3. Residentes demi-humanos de destaque (apenas de tribos resgatadas e acolhidas no subespaço)
  if (asora.tribosAcolhidas?.['orcs_highland']) {
    ocupantes.push({
      id: 'ema_highland',
      nome: 'Ema de Highland',
      papel: 'Líder dos Orcs de Highland & Gestão Agrícola',
      localSetor: 'asora_vila_central',
      tipo: 'residente',
    });
  }

  if (asora.tribosAcolhidas?.['elder_dwarves']) {
    ocupantes.push({
      id: 'mestre_beren',
      nome: 'Mestre Beren',
      papel: asora.forjaAtiva?.itemEmForja
        ? `Forjando ${asora.forjaAtiva.itemEmForja}`
        : 'Líder dos Elder Dwarves & Grão-Ferreiro',
      localSetor: 'asora_forja_anoes',
      tipo: 'residente',
    });
  }

  if (asora.tribosAcolhidas?.['mist_lizards']) {
    ocupantes.push({
      id: 'comandante_zalax',
      nome: 'Comandante Zalax',
      papel: 'Comandante dos Mist Lizards & Guarda Territorial',
      localSetor: 'asora_vila_central',
      tipo: 'residente',
    });
  }

  // 4. População trabalhadora coletiva
  if (asora.populacao > 0) {
    ocupantes.push({
      id: 'populacao_trabalhadora',
      nome: `${asora.populacao} Trabalhadores Demi-Humanos`,
      papel: asora.construcaoOrcs?.projeto
        ? `Obras ativas em: ${asora.construcaoOrcs.projeto}`
        : 'Colheitas, canais, tecelagem e forja',
      localSetor: 'Distritos Produtivos',
      tipo: 'populacao',
    });
  }

  const nomesPresentes = ocupantes.map((o) => `${o.nome} (${o.papel})`).join(', ');
  const statusJogador = jogadorNoSubespaco
    ? `Você está presente no subespaço (${localAtual}).`
    : `Você está fora no mundo exterior (${localAtual}).`;
  const resumoPresenca = `${statusJogador} Presentes no subespaço neste momento: ${nomesPresentes}.`;

  return {
    nomeSubespaco: nomeSub,
    jogadorPresente: jogadorNoSubespaco,
    localJogador: localAtual,
    ocupantes,
    resumoPresenca,
  };
}

/**
 * Recupera ou inicializa Asora no estado da campanha.
 */
export function obterAsora(camp: CampaignState): AsoraState {
  if (!camp.asora) {
    camp.asora = inicializarAsora();
  }
  // Garante propriedades estruturais adicionadas em versões posteriores
  camp.asora.tribosAcolhidas = camp.asora.tribosAcolhidas ?? {};
  camp.asora.alocacaoTrabalho = camp.asora.alocacaoTrabalho ?? {
    agricultura: 0,
    mineracao: 0,
    forja_ferramentas: 0,
    tecelagem: 0,
    seguranca_patrulha: 0,
    construcao_obras: 0,
  };
  camp.asora.recursosEspeciais = camp.asora.recursosEspeciais ?? {
    ferramentasDisponiveis: 0,
    madeiraNobre: 20,
  };
  camp.asora.projetosConcluidos = camp.asora.projetosConcluidos ?? [];
  return camp.asora;
}

/**
 * Fator de escala de bônus baseado na proporção do contrato.
 * No anime/novel:
 * - 2:8 (Mestre-Servo): Mestre absorve parcela dominante de poder.
 * - 1:9 (Estabilizado): Contenção de mana sem queima de alma.
 * - 5:5 (Paritário): Pacto de igualdade.
 */
function fatorProporcao(proporcao: ProporcaoContrato): number {
  switch (proporcao) {
    case '2:8':
      return 1.0;
    case '5:5':
      return 0.75;
    case '1:9':
      return 0.5;
  }
}

/**
 * Realiza um Contrato de Alma com uma entidade primordial da Wasteland.
 * Todas as entidades elegíveis para o Círculo Central são fêmeas, assumindo
 * formas humanas elegantes com devoção ao Mestre.
 */
export function realizarContratoAlma(
  camp: CampaignState,
  criaturaId: string,
  proporcao: ProporcaoContrato = '2:8',
  nomeConcedido?: string,
): { sucesso: boolean; mensagem: string; contrato?: ContratoAlma } {
  const def = ENTIDADES_CONTRATAVEIS[criaturaId];
  if (!def) {
    return {
      sucesso: false,
      mensagem: `A criatura '${criaturaId}' não é uma entidade primordial elegível para Contrato de Alma.`,
    };
  }

  const asora = obterAsora(camp);
  if (asora.contratos[criaturaId]) {
    return {
      sucesso: false,
      mensagem: `O contrato de alma com ${asora.contratos[criaturaId].nomeConcedido} já está ativo.`,
    };
  }

  const nomeFinal = nomeConcedido?.trim() || def.nomeDefault;
  const fator = fatorProporcao(proporcao);

  // Calcula os bônus efetivos transferidos para a alma do jogador
  const bonusConcedidos: Partial<Atributos> = {};
  for (const [k, v] of Object.entries(def.bonusBase)) {
    const chave = k as keyof Atributos;
    if (v) {
      const ganho = Math.max(1, Math.round(v * fator));
      bonusConcedidos[chave] = ganho;
      // Aplica imediatamente ao personagem
      camp.personagem.atributos[chave] = (camp.personagem.atributos[chave] || 0) + ganho;
    }
  }

  const contrato: ContratoAlma = {
    id: `contrato_${criaturaId}`,
    criaturaOriginalId: criaturaId,
    nomeConcedido: nomeFinal,
    titulo: def.titulo,
    proporcao,
    formaOriginal: def.formaOriginal,
    formaHumanoide: { ...def.formaHumanoide },
    bonusConcedidos,
    lealdade: proporcao === '2:8' ? 100 : proporcao === '5:5' ? 90 : 85,
    afeto: proporcao === '2:8' ? 80 : proporcao === '5:5' ? 70 : 60,
    ciume: 30,
    ativaNoGrupo: true,
    papelAsora: def.papelAsora,
  };

  asora.contratos[criaturaId] = contrato;

  // Se for o primeiro contrato, Asora é aberta
  if (!asora.desbloqueado) {
    asora.desbloqueado = true;
    asora.populacao = asora.populacao ?? 0;
  }

  // Registra crônica e marco permanente
  const textoMarco = `Contrato de Alma (${proporcao}) selado com ${nomeFinal}, ${def.titulo}. Forma humana estabilizada e poder vinculado ao Mestre.`;
  camp.cronica.push({
    turno: camp.turno,
    tipo: 'narracao',
    texto: textoMarco,
  });

  if (!camp.marcos) camp.marcos = [];
  camp.marcos.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    texto: `Pacto de Alma: ${nomeFinal} (${def.titulo}) uniu-se ao Círculo Central.`,
  });

  return {
    sucesso: true,
    mensagem: `Pacto de Alma firmado com sucesso! ${nomeFinal} assumiu sua forma humana e jurou lealdade ao Mestre na proporção ${proporcao}.`,
    contrato,
  };
}

/**
 * Evolui o nível de uma obra no Subespaço de Asora.
 */
export function evoluirObraAsora(
  camp: CampaignState,
  obraId: ObraAsora['id'],
): { sucesso: boolean; mensagem: string } {
  const asora = obterAsora(camp);
  if (!asora.desbloqueado) {
    return { sucesso: false, mensagem: 'O subespaço de Asora ainda não foi desbloqueado por um Contrato de Alma.' };
  }

  const obra = asora.obras[obraId];
  if (!obra) {
    return { sucesso: false, mensagem: `Obra desconhecida: '${obraId}'.` };
  }

  if (obra.nivel >= obra.maxNivel) {
    return { sucesso: false, mensagem: `${obra.nome} já atingiu o nível máximo (${obra.maxNivel}).` };
  }

  obra.nivel += 1;
  asora.populacao += 25;
  asora.seguranca = Math.min(100, asora.seguranca + 5);
  asora.harmonia = Math.min(100, asora.harmonia + 4);

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto: `Obra expandida em Asora: ${obra.nome} atingiu o Nível ${obra.nivel}. Responsável: ${obra.responsavel}.`,
  });

  return {
    sucesso: true,
    mensagem: `${obra.nome} foi aprimorada com sucesso para o Nível ${obra.nivel}! População de Asora aumentou para ${asora.populacao}.`,
  };
}

/**
 * Coleta a produção periódica das obras de Asora e adiciona aos estoques.
 */
export function processarProducaoAsora(camp: CampaignState): {
  comidaGanha: number;
  sedaGanha: number;
  minerioGanho: number;
  draupnirGanho: number;
} {
  const asora = obterAsora(camp);
  if (!asora.desbloqueado) {
    return { comidaGanha: 0, sedaGanha: 0, minerioGanho: 0, draupnirGanho: 0 };
  }

  const lvlLavoura = asora.obras.lavoura_highland?.nivel ?? 1;
  const lvlForja = asora.obras.forja_anoes?.nivel ?? 1;
  const lvlAtelie = asora.obras.atelie_alkes?.nivel ?? 1;

  const comidaGanha = lvlLavoura * 20;
  const sedaGanha = lvlAtelie * 5;
  const minerioGanho = lvlForja * 10;
  const draupnirGanho = lvlForja >= 3 ? 1 : 0;

  asora.estoques.comida += comidaGanha;
  asora.estoques.seda += sedaGanha;
  asora.estoques.minerio += minerioGanho;
  asora.estoques.draupnir += draupnirGanho;

  return { comidaGanha, sedaGanha, minerioGanho, draupnirGanho };
}

/**
 * Intervenção tática em combate de uma serva do Círculo Central ativa.
 */
export function intervencaoServaCombate(camp: CampaignState): {
  interveio: boolean;
  servaNome?: string;
  descricao?: string;
  absorcaoDano?: number;
  danoCausado?: number;
} {
  const asora = camp.asora;
  if (!asora || !asora.desbloqueado) return { interveio: false };

  const servasAtivas = Object.values(asora.contratos).filter((c) => c.ativaNoGrupo);
  if (servasAtivas.length === 0) return { interveio: false };

  // Escolhe a serva com maior afeto
  const serva = [...servasAtivas].sort((a, b) => b.afeto - a.afeto)[0];

  if (serva.criaturaOriginalId === 'aranha_calamidade') {
    return {
      interveio: true,
      servaNome: serva.nomeConcedido,
      descricao: `${serva.nomeConcedido} conjura teias de escuridão impenetráveis à frente do Mestre, absorvendo o impacto do ataque inimigo!`,
      absorcaoDano: 25,
      danoCausado: 15,
    };
  }

  if (serva.criaturaOriginalId === 'dragao_shen') {
    return {
      interveio: true,
      servaNome: serva.nomeConcedido,
      descricao: `${serva.nomeConcedido} desembainha sua lâmina e dissipa névoas ilusórias que confundem o oponente e desferem um corte de vácuo!`,
      absorcaoDano: 15,
      danoCausado: 30,
    };
  }

  if (serva.criaturaOriginalId === 'fenix_suzaku') {
    return {
      interveio: true,
      servaNome: serva.nomeConcedido,
      descricao: `${serva.nomeConcedido} expande asas de chamas celestes, incinerando as defesas do inimigo com calor solar!`,
      absorcaoDano: 10,
      danoCausado: 35,
    };
  }

  return {
    interveio: true,
    servaNome: serva.nomeConcedido,
    descricao: `${serva.nomeConcedido} avança com sua lança abissal para rechaçar o ataque contra seu Mestre!`,
    absorcaoDano: 20,
    danoCausado: 20,
  };
}

/**
 * Registra o protagonista na Guilda de Aventureiros de Tsige.
 *
 * A orbe de cristal tenta mensurar a assinatura de mana — e falha
 * catastroficamente. O resultado oficial gravado no Cartão de Aventureiro
 * é Nível 1 (Quebrador de Parâmetros): a escala de medição da Deusa entrou
 * em overflow ou simplesmente não reconhece a bênção ausente.
 *
 * O nível interno da engine (camp.personagem.nivel) não é tocado.
 */
export function registrarNaGuildaTsige(camp: CampaignState): {
  sucesso: boolean;
  mensagem: string;
  cartao?: CampaignState['personagem']['cartaoAventureiro'];
} {
  if (camp.personagem.cartaoAventureiro?.registrado) {
    return {
      sucesso: false,
      mensagem: `${camp.personagem.nome} já está registrado na Guilda de Tsige com Cartão de Aventureiro Nível ${camp.personagem.cartaoAventureiro.nivelAparente}.`,
    };
  }

  const cartao: NonNullable<CampaignState['personagem']['cartaoAventureiro']> = {
    registrado: true,
    nivelAparente: 1, // A orbe não consegue medir — registra o mínimo da escala
    rank: 'E',
    manaStatus: 'erro_overflow',
    parametroQuebrado: true,
    dataRegistro: camp.turno,
  };

  camp.personagem.cartaoAventureiro = cartao;

  // Inicializa Sakai (domínio perceptivo inato do protagonista)
  if (!camp.personagem.sakai) {
    camp.personagem.sakai = {
      desbloqueado: true,
      nivel: 1,
      experienciaTreino: 0,
      treinosRealizados: 0,
      modosDisponiveis: ['percepcao'],
      modoAtivo: undefined,
    };
  }

  const barks = [
    'A recepcionista da Guilda ri ao ver o Cartão: "Nível 1? Que desperdício de cristal..."',
    'Um veterano próximo murmura: "Mais um que vai morrer na Wasteland. Pelo menos é rápido."',
    'A orbe de cristal vibrou de um jeito que a recepcionista nunca viu antes. Ela não menciona isso.',
  ];

  const barkEscolhido = barks[camp.turno % barks.length];

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'narracao',
    texto: `Registro na Guilda de Tsige concluído. Cartão carimbado: Nível 1 (Erro de Escala de Mana / Parâmetros Quebrados). ${barkEscolhido}`,
  });

  if (!camp.marcos) camp.marcos = [];
  camp.marcos.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    texto: 'Cartão de Aventureiro de Tsige emitido: Nível 1 (Quebrador de Parâmetros). A orbe falhou em medir.',
  });

  return {
    sucesso: true,
    mensagem: `Cartão de Aventureiro emitido! Nível oficial: 1. A orbe da Guilda entrou em overflow ao tentar medir seu mana. Para a Guilda, você é Rank E. Para a Wasteland, você é uma calamidade andando.`,
    cartao,
  };
}

/**
 * Ativa ou desativa um modo do Sakai durante o combate ou exploração.
 *
 * O Sakai (界 / Domínio Inato / Olho da Alma) é a dádiva primordial
 * concedida por Tsukuyomi-no-Mikoto antes do banimento do protagonista.
 * Não é uma mera arte de espada, mas sim um controle absoluto do vácuo
 * de mana que atua em múltiplos aspectos: reforço corporal, sentidos
 * cósmicos, percepção onidirecional, barreira, regeneração e destruição.
 */
export function ativarSakai(
  camp: CampaignState,
  modo: ModoKai,
): { sucesso: boolean; mensagem: string } {
  if (!camp.personagem.sakai?.desbloqueado) {
    return {
      sucesso: false,
      mensagem: 'O Sakai ainda não foi desbloqueado. Registre-se na Guilda de Tsige primeiro.',
    };
  }

  const sakai = camp.personagem.sakai;

  if (!sakai.modosDisponiveis.includes(modo)) {
    return {
      sucesso: false,
      mensagem: `O modo de Sakai "${modo}" ainda não foi aprendido. Modos disponíveis: ${sakai.modosDisponiveis.join(', ')}.`,
    };
  }

  // Toggle: desativa se já estava ativo, ativa se estava inativo
  if (sakai.modoAtivo === modo) {
    sakai.modoAtivo = undefined;
    return { sucesso: true, mensagem: `Sakai modo "${modo}" desativado.` };
  }

  sakai.modoAtivo = modo;

  const descricoes: Record<ModoKai, string> = {
    percepcao:
      'O Sakai de Percepção se expande — cada detalhe do campo de batalha fica cristalino. Acerto aumentado neste turno; esquiva inimiga ignorada.',
    fortalecimento:
      'O Sakai de Fortalecimento satura mana bruto nas fibras musculares e esqueleto. A força de impacto torna-se esmagadora (+dano massivo) e o corpo resiste a danos violentos (+defesa sólida).',
    magia:
      'O Sakai de Magia canaliza correntes arcanas de densidade pura. O poder dos feitiços e ataques de mana explode (+dano mágico primordial e acerto) sem risco de refluxo.',
    audicao:
      'O Sakai de Audição capta vibrações acústicas, ecos e batimentos cardíacos a quilômetros. Você ouve o respirar e passadas ocultas, antecipando emboscadas (+acerto e iniciativa).',
    barreira_magica:
      'O Sakai de Barreira Mágica ergue uma película impenetrável de mana puro. Feitiços elementais, maldições e magias hostis são dispersadas no impacto (+alta defesa mágica).',
    barreira_fisica:
      'O Sakai de Barreira Física distorce e comprime o espaço imediato. Lâminas, flechas, garras e impactos cinéticos colidem contra uma muralha sólida invisível (+alta defesa física).',
    cura:
      'O Sakai de Cura envolve o corpo em mana regenerativo. Vigor e vida se recuperam a cada turno de combate.',
    supressao:
      'O Sakai de Supressão comprime a sua colossal presença de mana para o interior. Monstros e humanos ao redor deixam de sentir pavor esmagador da sua aura (+defesa equilibrada).',
    destruicao:
      'O Sakai de Destruição comprimiu todo o excesso de mana para um ponto singular. O próximo ataque ignora defesas convencionais e causa dano massivo.',
    sentidos:
      'O Sakai de Sentidos eleva visão e audição a um patamar cósmico. Você enxerga fluxos ocultos de mana e camuflagem, e ouve o pulso vital a léguas — extrema precisão cirúrgica e evasão antecipada.',
  };

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto: descricoes[modo],
  });

  return { sucesso: true, mensagem: descricoes[modo] };
}

/**
 * Retorna os bônus de combate ativos pelo modo atual de Sakai.
 * Usado por combat.ts ao calcular acerto, defesa e dano.
 */
export function bonusSakaiAtivo(camp: CampaignState): {
  acertoBonus: number;
  defesaBonus: number;
  danoBonus: number;
  curaBonus: number;
  ignoraDefesa: boolean;
} {
  const modo = camp.personagem.sakai?.modoAtivo;
  const nivelSakai = camp.personagem.sakai?.nivel ?? 1;

  switch (modo) {
    case 'percepcao':
      return { acertoBonus: 10 + nivelSakai * 2, defesaBonus: 0, danoBonus: 0, curaBonus: 0, ignoraDefesa: false };
    case 'sentidos':
      return { acertoBonus: 14 + nivelSakai * 2, defesaBonus: 4 + nivelSakai * 2, danoBonus: 3 + nivelSakai, curaBonus: 0, ignoraDefesa: false };
    case 'audicao':
      return { acertoBonus: 12 + nivelSakai * 2, defesaBonus: 4 + nivelSakai, danoBonus: 2, curaBonus: 0, ignoraDefesa: false };
    case 'fortalecimento':
      return { acertoBonus: 3 + nivelSakai, defesaBonus: 6 + nivelSakai * 2, danoBonus: 12 + nivelSakai * 4, curaBonus: 0, ignoraDefesa: false };
    case 'magia':
      return { acertoBonus: 8 + nivelSakai * 2, defesaBonus: 4, danoBonus: 14 + nivelSakai * 3, curaBonus: 0, ignoraDefesa: false };
    case 'barreira_magica':
      return { acertoBonus: 0, defesaBonus: 12 + nivelSakai * 3, danoBonus: 0, curaBonus: 0, ignoraDefesa: false };
    case 'barreira_fisica':
      return { acertoBonus: 0, defesaBonus: 14 + nivelSakai * 3, danoBonus: 0, curaBonus: 0, ignoraDefesa: false };
    case 'cura':
      return { acertoBonus: 0, defesaBonus: 2, danoBonus: 0, curaBonus: 5 + nivelSakai * 2, ignoraDefesa: false };
    case 'supressao':
      return { acertoBonus: 0, defesaBonus: 8 + nivelSakai * 2, danoBonus: 0, curaBonus: 0, ignoraDefesa: false };
    case 'destruicao':
      return { acertoBonus: 5, defesaBonus: 0, danoBonus: 15 + nivelSakai * 3, curaBonus: 0, ignoraDefesa: true };
    default:
      return { acertoBonus: 0, defesaBonus: 0, danoBonus: 0, curaBonus: 0, ignoraDefesa: false };
  }
}

/**
 * Treina e expande o domínio inato do Kai (Sakai).
 * Concedido pelo Deus Tsukuyomi antes do banimento pela Deusa, o Kai não é meramente
 * uma técnica de lâmina: é a emanação de poder do Criador, governando percepção total,
 * sentidos transcendentais (visão que lê mana invisível, audição a léguas),
 * fortalecimento físico das fibras musculares e esqueleto, cura e destruição.
 *
 * Cada sessão avança a maestria interna do protagonista, subindo de nível (1 a 5)
 * e despertando progressivamente novos aspectos do Domínio.
 */
export function treinarKai(camp: CampaignState): {
  sucesso: boolean;
  mensagem: string;
  subiuNivel?: boolean;
  novosModos?: ModoKai[];
  nivelAtual: number;
} {
  const p = camp.personagem;
  if (!p.sakai?.desbloqueado) {
    return {
      sucesso: false,
      mensagem: 'O Kai (Sakai) precisa ser despertado primeiro (registre-se na Guilda ou toque na orbe).',
      nivelAtual: 0,
    };
  }

  const sakai = p.sakai;
  sakai.experienciaTreino = (sakai.experienciaTreino ?? 0) + 25;
  sakai.treinosRealizados = (sakai.treinosRealizados ?? 0) + 1;

  // Limiares de nível:
  // Nv 1: inicial (percepcao)
  // Nv 2: 50 XP (desbloqueia fortalecimento, sentidos, barreira_fisica, audicao)
  // Nv 3: 125 XP (desbloqueia cura, supressao, magia, barreira_magica)
  // Nv 4: 225 XP (desbloqueia destruicao)
  // Nv 5: 350 XP (Domínio Absoluto do Vácuo - todos os modos com potência máxima)
  let subiuNivel = false;
  const novosModos: ModoKai[] = [];

  const limiares = [
    { nivel: 2, xp: 50, modos: ['fortalecimento', 'sentidos', 'barreira_fisica', 'audicao'] as ModoKai[] },
    { nivel: 3, xp: 125, modos: ['cura', 'supressao', 'magia', 'barreira_magica'] as ModoKai[] },
    { nivel: 4, xp: 225, modos: ['destruicao'] as ModoKai[] },
    { nivel: 5, xp: 350, modos: [] as ModoKai[] },
  ];

  for (const l of limiares) {
    if (sakai.nivel < l.nivel && (sakai.experienciaTreino ?? 0) >= l.xp) {
      sakai.nivel = l.nivel;
      subiuNivel = true;
      for (const m of l.modos) {
        if (!sakai.modosDisponiveis.includes(m)) {
          sakai.modosDisponiveis.push(m);
          novosModos.push(m);
        }
      }
    }
  }

  let detalheNivel = '';
  if (subiuNivel) {
    detalheNivel = ` Seu Domínio do Kai ascendeu ao Nível ${sakai.nivel}! Novos aspectos dominados: ${novosModos.join(', ')}.`;
  }

  const textoCronica = `Sessão de treinamento do Kai concluída. Você expande a emanação inata concedida por Tsukuyomi — o mana satura suas fibras e expande seus limites perceptivos.${detalheNivel}`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto: textoCronica,
  });

  return {
    sucesso: true,
    mensagem: textoCronica,
    subiuNivel,
    novosModos: novosModos.length > 0 ? novosModos : undefined,
    nivelAtual: sakai.nivel,
  };
}

/**
 * Processa comandos e intenções livres em texto direcionadas ao Kai (Sakai).
 * Permite ao jogador escrever livremente qualquer aplicação do Kai:
 * - Kai de Percepção (percepcao)
 * - Kai de Fortalecimento (fortalecimento)
 * - Kai de Magia (magia)
 * - Kai de Audição (audicao)
 * - Kai de Barreira Mágica (barreira_magica)
 * - Kai de Barreira Física (barreira_fisica)
 * - Kai de Cura (cura)
 * - Kai de Supressão (supressao)
 * - Kai de Destruição (destruicao)
 * - Kai de Sentidos (sentidos)
 * - Desativação / recolhimento do Kai
 * - Treino do Kai
 * - Treino de Quase-Morte / Concentração Total
 */
export function processarAcaoLivreKai(
  texto: string,
  camp: CampaignState,
): {
  sucesso: boolean;
  mensagem: string;
  modo?: ModoKai;
  acaoTipo: 'modo' | 'desativar' | 'treino' | 'quase_morte';
} | null {
  const t = texto.toLowerCase().trim();

  // 1. Quase-morte consciente / Concentração total
  if (
    t.includes('quase morte') ||
    t.includes('quase-morte') ||
    t.includes('concentracao total') ||
    t.includes('concentração total') ||
    t.includes('vacuo da morte') ||
    t.includes('vácuo da morte')
  ) {
    const res = executarTreinoConcentracaoQuaseMorte(camp);
    return {
      sucesso: res.sucesso,
      mensagem: res.mensagem,
      acaoTipo: 'quase_morte',
    };
  }

  // 2. Treino do Kai
  if (
    t.includes('treinar kai') ||
    t.includes('treinar o kai') ||
    t.includes('treinar sakai') ||
    t.includes('treinar o sakai') ||
    t.includes('meditar no kai') ||
    t.includes('meditar com o kai')
  ) {
    const res = treinarKai(camp);
    return {
      sucesso: res.sucesso,
      mensagem: res.mensagem,
      acaoTipo: 'treino',
    };
  }

  // 3. Desativação do Kai
  if (
    t.includes('desativar kai') ||
    t.includes('desativar o kai') ||
    t.includes('desligar kai') ||
    t.includes('desligar o kai') ||
    t.includes('cancelar kai') ||
    t.includes('recolher o kai') ||
    t.includes('fechar o kai') ||
    t.includes('desativar sakai')
  ) {
    if (!camp.personagem.sakai?.desbloqueado) {
      return {
        sucesso: false,
        mensagem: 'O Domínio do Kai ainda não foi despertado.',
        acaoTipo: 'desativar',
      };
    }
    const modoAnterior = camp.personagem.sakai.modoAtivo;
    camp.personagem.sakai.modoAtivo = undefined;
    const msg = modoAnterior
      ? `Você recolhe a emanação de mana. Modo de Kai "${modoAnterior}" desativado.`
      : 'Nenhum modo de Kai estava ativo no momento.';
    camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto: msg });
    return {
      sucesso: true,
      mensagem: msg,
      acaoTipo: 'desativar',
    };
  }

  // 4. Detecção de modos específicos do Kai
  let modoAlvo: ModoKai | null = null;

  if (
    t.includes('barreira magica') ||
    t.includes('barreira mágica') ||
    t.includes('barreira de mana') ||
    (t.includes('kai') && t.includes('magica')) ||
    (t.includes('kai') && t.includes('mágica'))
  ) {
    modoAlvo = 'barreira_magica';
  } else if (
    t.includes('barreira fisica') ||
    t.includes('barreira física') ||
    t.includes('barreira espacial') ||
    (t.includes('kai') && t.includes('fisica')) ||
    (t.includes('kai') && t.includes('física'))
  ) {
    modoAlvo = 'barreira_fisica';
  } else if (
    t.includes('audicao') ||
    t.includes('audição') ||
    (t.includes('kai') && (t.includes('ouvir') || t.includes('escutar')))
  ) {
    modoAlvo = 'audicao';
  } else if (
    (t.includes('kai') && t.includes('magia')) ||
    t.includes('kai de magia') ||
    t.includes('amplificar magia') ||
    t.includes('kai magico') ||
    t.includes('kai mágico')
  ) {
    modoAlvo = 'magia';
  } else if (
    t.includes('fortalecimento') ||
    t.includes('reforcar o corpo') ||
    t.includes('reforçar o corpo') ||
    (t.includes('kai') && t.includes('musculos')) ||
    (t.includes('kai') && t.includes('músculos')) ||
    (t.includes('kai') && t.includes('fortalecer'))
  ) {
    modoAlvo = 'fortalecimento';
  } else if (
    t.includes('percepcao') ||
    t.includes('percepção') ||
    t.includes('sondar') ||
    (t.includes('kai') && t.includes('enxergar')) ||
    (t.includes('kai') && t.includes('mapear'))
  ) {
    modoAlvo = 'percepcao';
  } else if (
    t.includes('supressao') ||
    t.includes('supressão') ||
    t.includes('suprimir') ||
    t.includes('ocultar mana') ||
    t.includes('esconder mana')
  ) {
    modoAlvo = 'supressao';
  } else if (
    t.includes('destruicao') ||
    t.includes('destruição') ||
    t.includes('romper espaco') ||
    t.includes('romper espaço') ||
    (t.includes('kai') && t.includes('destruir'))
  ) {
    modoAlvo = 'destruicao';
  } else if (
    t.includes('cura') ||
    t.includes('regenerar') ||
    (t.includes('kai') && t.includes('curar'))
  ) {
    modoAlvo = 'cura';
  } else if (
    t.includes('sentidos') ||
    (t.includes('kai') && t.includes('visão')) ||
    (t.includes('kai') && t.includes('visao'))
  ) {
    modoAlvo = 'sentidos';
  }

  if (!modoAlvo) return null;

  if (!camp.personagem.sakai) {
    camp.personagem.sakai = {
      desbloqueado: true,
      nivel: 1,
      experienciaTreino: 0,
      treinosRealizados: 0,
      modosDisponiveis: ['percepcao'],
      modoAtivo: undefined,
    };
  }

  const sakai = camp.personagem.sakai;
  sakai.desbloqueado = true;

  let recemDesperto = false;
  if (!sakai.modosDisponiveis.includes(modoAlvo)) {
    sakai.modosDisponiveis.push(modoAlvo);
    recemDesperto = true;
  }

  sakai.modoAtivo = modoAlvo;

  const descricoes: Record<ModoKai, string> = {
    percepcao:
      'O Kai de Percepção se expande em 360 graus — o miasma e as dunas da Wasteland se revelam com clareza cristalina (+10 acerto, esquiva inimiga ignorada).',
    fortalecimento:
      'O Kai de Fortalecimento satura mana bruto em cada fibra muscular e esqueleto — sua densidade física se multiplica (+dano maciço e resistência a impactos).',
    magia:
      'O Kai de Magia comprime fluxos arcanos em espirais de alta densidade — seus feitiços e ataques arcanos explodem com potência devastadora (+dano mágico primordial e acerto).',
    audicao:
      'O Kai de Audição sintoniza frequências sonoras e batimentos a quilômetros — você ouve a respiração de feras e sussurros no ermo, antecipando emboscadas (+acerto e iniciativa).',
    barreira_magica:
      'O Kai de Barreira Mágica projeta uma cúpula translúcida de mana condensado — magias elementais, feitiços hostis e maldições são anulados no impacto (+alta defesa mágica).',
    barreira_fisica:
      'O Kai de Barreira Física distorce o espaço imediato como uma muralha sólida invisível — flechas, lâminas, presas e impactos cinéticos são bloqueados (+alta defesa física).',
    cura:
      'O Kai de Cura tece névoa regenerativa ao redor de suas feridas — vitalidade celular acelerada e vigor restaurado a cada instante.',
    supressao:
      'O Kai de Supressão comprime seu reservatório abissal de mana para dentro — sua presença aterrorizante se apaga aos olhos humanos (+defesa equilibrada).',
    destruicao:
      'O Kai de Destruição concentra mana em uma lâmina espacial infinitamente afiada — o próximo impacto ignora armaduras e defesas convencionais.',
    sentidos:
      'O Kai de Sentidos agudiza visão e reflexos em um transe cósmico — fluxo temporal desacelera e você antecipa trajetórias de ataque.',
  };

  const avisoDespertar = recemDesperto
    ? `✦ Despertar Espontâneo: Em resposta à sua determinação, seu Domínio Inato manifestou o novo aspecto "${modoAlvo}"!\n`
    : '';

  const msgCompleta = `${avisoDespertar}${descricoes[modoAlvo]}`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto: msgCompleta,
  });

  return {
    sucesso: true,
    mensagem: msgCompleta,
    modo: modoAlvo,
    acaoTipo: 'modo',
  };
}

/**
 * Treina o Kenjutsu do Espadachim canalizando o poder do Kai na lâmina.
 * Aprimora a maestria de espada através da disciplina forjada em Asora,
 * unindo o peso descomunal de mana à precisão cirúrgica de corte.
 */
export function treinarKenjutsuEspadachim(camp: CampaignState): {
  sucesso: boolean;
  mensagem: string;
  ganhoMaestria: number;
} {
  const p = camp.personagem;
  p.pericias = p.pericias ?? {};
  p.pericias['atletismo'] = (p.pericias['atletismo'] ?? 0) + 1;
  p.pericias['perceber'] = (p.pericias['perceber'] ?? 0) + 1;

  if (camp.aptidao) {
    camp.aptidao.esforco.espada = (camp.aptidao.esforco.espada ?? 0) + 30;
    camp.aptidao.sessoes.espada = (camp.aptidao.sessoes.espada ?? 0) + 1;
  }

  const nivelKai = p.sakai?.nivel ?? 1;
  const texto = `Treino de Kenjutsu executado com excelência. A katana corta o vácuo com a sustentação do Kai (Nível ${nivelKai}) — postura, equilíbrio e fluxo de mana refinam cada movimento da lâmina.`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'narracao',
    texto,
  });

  return {
    sucesso: true,
    mensagem: texto,
    ganhoMaestria: 30,
  };
}

/**
 * Treino de Concentração Total com Quase-Morte Consciente (Mugen no Shūchū).
 * Inspirado na disciplina do arco (Kyudo) e concentração extrema de Makoto Misumi:
 * O protagonista estica a concentração ao limiar absoluto. A respiração cessa,
 * os batimentos cardíacos silenciam e o corpo experimenta a morte clínica temporária.
 * Ao disparar / cortar no Vazio, a mente desperta e ressuscita conscientemente:
 * o recipiente de mana estilhaça o teto anterior e se expande drasticamente,
 * enquanto a mente e o corpo transcendem limites humanos.
 */
export function executarTreinoConcentracaoQuaseMorte(camp: CampaignState): {
  sucesso: boolean;
  mensagem: string;
  ciclosConcluidos: number;
  manaExpandidoTotal: number;
  ganhoMana: number;
  atributosEvoluidos: string[];
} {
  const p = camp.personagem;
  if (!p.treinoQuaseMorte) {
    p.treinoQuaseMorte = {
      ciclosConcluidos: 0,
      manaExpandidoTotal: 0,
    };
  }

  const tm = p.treinoQuaseMorte;
  tm.ciclosConcluidos += 1;
  const ganhoMana = 25;
  tm.manaExpandidoTotal += ganhoMana;
  tm.ultimoTreinoTurno = camp.turno;

  // Atualiza teto de mana e preenche o novo recipiente
  p.recursosMax.mana = (p.recursosMax.mana ?? 10) + ganhoMana;
  p.recursos.mana = p.recursosMax.mana;

  // Evolução de atributos pela transcendência da quase-morte
  const atributosEvoluidos: string[] = [];
  if (tm.ciclosConcluidos % 2 === 1) {
    p.atributos.precisao = (p.atributos.precisao ?? 10) + 1;
    p.atributos.raciocinio = (p.atributos.raciocinio ?? 10) + 1;
    atributosEvoluidos.push('Precisão (+1)', 'Raciocínio (+1)');
  } else {
    p.atributos.resiliencia = (p.atributos.resiliencia ?? 10) + 1;
    p.atributos.fisico = (p.atributos.fisico ?? 10) + 1;
    atributosEvoluidos.push('Resiliência (+1)', 'Físico (+1)');
  }

  p.pericias = p.pericias ?? {};
  p.pericias['perceber'] = (p.pericias['perceber'] ?? 0) + 1;

  let focoClasse = 'o centro de gravidade e a postura marcial do Vazio';
  let momentoAcao = 'No ápice da serenidade quando a vida é puxada de volta';

  if (p.classeId === 'espadachim_asora' || p.classeId === 'espadachim') {
    focoClasse = 'a postura de Iaijutsu e corte do Vazio';
    momentoAcao = 'No milissegundo em que a lâmina fende o nada absoluto e retorna à bainha';
    p.pericias['atletismo'] = (p.pericias['atletismo'] ?? 0) + 1;
    if (camp.aptidao) {
      camp.aptidao.esforco.espada = (camp.aptidao.esforco.espada ?? 0) + 25;
      camp.aptidao.sessoes.espada = (camp.aptidao.sessoes.espada ?? 0) + 1;
    }
  } else if (p.classeId === 'sem_bencao' || p.classeId === 'arcanista') {
    focoClasse = 'a compressão extrema do núcleo mágico primordial';
    momentoAcao = 'No instante em que a esfera interior atinge o colapso e implode em mana puro';
    if (camp.aptidao) {
      camp.aptidao.esforco.arcano = (camp.aptidao.esforco.arcano ?? 0) + 25;
      camp.aptidao.sessoes.arcano = (camp.aptidao.sessoes.arcano ?? 0) + 1;
    }
  } else if (p.classeId === 'arqueiro_azusa' || p.classeId === 'batedor') {
    focoClasse = 'a postura de Kyudo e o alinhamento cósmico do arco';
    momentoAcao = 'No momento em que a corda é liberada e o disparo rasga o Vazio';
    p.pericias['rastrear'] = (p.pericias['rastrear'] ?? 0) + 1;
  } else {
    focoClasse = 'o controle respiratório e a disciplina marcial do Vazio';
    momentoAcao = 'No instante da ruptura física em que a vida é recuperada';
    p.pericias['atletismo'] = (p.pericias['atletismo'] ?? 0) + 1;
  }

  // Concede experiência ao Sakai se desbloqueado
  if (p.sakai?.desbloqueado) {
    p.sakai.experienciaTreino = (p.sakai.experienciaTreino ?? 0) + 40;
    p.sakai.treinosRealizados = (p.sakai.treinosRealizados ?? 0) + 1;
  }

  const detalheAtributos =
    atributosEvoluidos.length > 0 ? ` Atributos transcendidos: ${atributosEvoluidos.join(', ')}.` : '';

  const texto =
    `Treino de Concentração Total (Quase-Morte Consciente) concluído! Você firma ${focoClasse} até os limites biológicos. A respiração para, o pulso cardíaco silencia e seu ser mergulha no vácuo da morte temporária por segundos eternos. ${momentoAcao}, você retorna com uma lufada violenta de ar: o recipiente de sua alma arrebenta os limites anteriores e se expande (+${ganhoMana} de Mana Máximo!).${detalheAtributos} (Ciclos totais: ${tm.ciclosConcluidos}, Mana Máximo Total: ${p.recursosMax.mana})`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'narracao',
    texto,
  });

  return {
    sucesso: true,
    mensagem: texto,
    ciclosConcluidos: tm.ciclosConcluidos,
    manaExpandidoTotal: tm.manaExpandidoTotal,
    ganhoMana,
    atributosEvoluidos,
  };
}

/**
 * Detona a carga de mana acumulada num anel Draupnir durante o combate.
 * Consome 1 anel Draupnir de Asora ou do inventário do jogador e causa dano
 * massivo puro de vácuo que ignora defesas convencionais.
 */
export function detonarDraupnirCombate(camp: CampaignState): {
  sucesso: boolean;
  danoCausado: number;
  mensagem: string;
} {
  const asora = camp.asora;
  const qtdDraupnir = asora?.estoques?.draupnir ?? 0;
  const temNoInventario = (camp.personagem.inventario?.['anel_draupnir'] ?? 0) > 0;

  if (qtdDraupnir <= 0 && !temNoInventario) {
    return {
      sucesso: false,
      danoCausado: 0,
      mensagem: 'Nenhum anel Draupnir carregado disponível para detonação.',
    };
  }

  // Consome do inventário primeiro, depois dos estoques de Asora
  if (temNoInventario) {
    camp.personagem.inventario['anel_draupnir'] -= 1;
    if (camp.personagem.inventario['anel_draupnir'] <= 0) {
      delete camp.personagem.inventario['anel_draupnir'];
    }
  } else if (asora) {
    asora.estoques.draupnir -= 1;
  }

  const danoCausado = 45 + (camp.personagem.sakai?.nivel ?? 1) * 10;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto: `O anel Draupnir sobrecarrega e se fragmenta em luz ofuscante! A liberação catastrófica de mana causa ${danoCausado} de dano puro de vácuo, pulverizando as defesas inimigas.`,
  });

  return {
    sucesso: true,
    danoCausado,
    mensagem: `Anel Draupnir detonado com sucesso! ${danoCausado} de dano puro causado.`,
  };
}

/**
 * Verifica se o protagonista está usando vestes ou anéis rúnicos de contenção de mana.
 * Sem um traje de supressão de Asora ou anéis Draupnir, seu mana incomensurável
 * vaza no ambiente, provocando calafrios, terror e histeria entre Humanos comuns.
 */
export function verificarSupressaoMana(camp: CampaignState): {
  suprimido: boolean;
  motivo: string;
  itemUtilizado?: string;
} {
  const p = camp.personagem;

  // 1. Supressão ativa através do Domínio Mental do Kai (Sakai)
  if (p.sakai?.modoAtivo === 'supressao') {
    return {
      suprimido: true,
      motivo:
        'O mana descomunal está perfeitamente contido e comprimido pela força de vontade e controle do Sakai (modo Supressão ativo).',
      itemUtilizado: 'kai_supressao',
    };
  }

  // 2. Contenção passiva por equipamentos rúnicos de Asora
  const equipados = Object.values(p.equipado ?? {}).filter(Boolean) as string[];
  const itensSupressores = ['traje_supressao_asora', 'manto_nevoas_supressao', 'anel_draupnir'];
  const encontrou = equipados.find((id) => itensSupressores.includes(id));

  if (encontrou) {
    return {
      suprimido: true,
      motivo: 'O mana descomunal está perfeitamente contido e isolado pelas vestes/anéis rúnicos.',
      itemUtilizado: encontrou,
    };
  }

  return {
    suprimido: false,
    motivo:
      'Sem vestes de supressão, anéis Draupnir equipados ou Sakai de Supressão ativo. Seu mana incomensurável transborda pelas roupas, aterrorizando Humanos próximos.',
  };
}

/**
 * Avalia a reação imediata dos Humanos diante da presença física do protagonista.
 * Se o mana não estiver suprimido (por equipamentos ou pelo Kai), civis desmaiam,
 * guardas tremem e o pânico se alastra, chamando a atenção dos Heróis dos Reinos Humanos.
 */
export function avaliarReacaoHumanosPresenca(
  camp: CampaignState,
  localId?: string,
): {
  reacaoTipo: 'normalidade' | 'pavor_extremo';
  descricaoNarrativa: string;
  alertaGerado: boolean;
} {
  const local = localId ?? camp.localAtual ?? '';
  const locaisHumanos = [
    'tsige_distrito_comercial',
    'tsige_guilda_aventureiros',
    'tsige_portao_ermo',
    'tsige_companhia_kuzunoha',
    'rotsgard_distrito_central',
    'rotsgard_biblioteca_arcanum',
  ];

  const ehLocalHumano = locaisHumanos.includes(local);
  const statusSupressao = verificarSupressaoMana(camp);

  if (statusSupressao.suprimido || !ehLocalHumano) {
    return {
      reacaoTipo: 'normalidade',
      descricaoNarrativa: statusSupressao.suprimido
        ? 'Seu mana está perfeitamente contido. Os Humanos ao redor circulam com naturalidade, tratando você como um viajante discreto.'
        : 'Você está no ermo ou em terras não-humanas. A pressão do seu mana ressoa apenas com as pedras e a terra.',
      alertaGerado: false,
    };
  }

  // Não suprimido em meio a humanos:
  const descricaoNarrativa =
    'PAVOR INSTINTIVO DOS HUMANOS! O peso do seu mana incomensurável sufoca o ar. Comerciantes caem de joelhos tremendo com os olhos arregalados, clientes desmaiam pálidos de náusea e guardas apontam lanças com os dentes batendo em histeria, temendo o despertar de uma Calamidade viva!';

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'narracao',
    texto: descricaoNarrativa,
  });

  // Eleva o alerta de investigação dos reinos humanos
  registrarImpactoBatalhaHerois(camp, 40, local, 'vazamento de mana incomensurável em centro populacional');

  return {
    reacaoTipo: 'pavor_extremo',
    descricaoNarrativa,
    alertaGerado: true,
  };
}

/**
 * Registra o impacto ambiental e a reverberação de grandes batalhas na Wasteland ou em cidades.
 * Batalhas devastadoras que causam destruição massiva chamam a atenção da Deusa e
 * ativam o estado de alerta dos dois Heróis Oficiais (Tomoqui em Gritonia e Hibiki em Limia),
 * que despacham batedores e decretos imperiais para investigar a cratera de mana.
 */
export function registrarImpactoBatalhaHerois(
  camp: CampaignState,
  danoTotalOuImpacto: number,
  localId: string,
  contexto: string = 'combate',
): { nivelAlerta: number; batedoresEnviados: boolean; decretosEmitidos: boolean; mensagem?: string } {
  const asora = (camp.asora ??= inicializarAsora());
  const inv = (asora.investigacaoHerois ??= {
    nivelAlerta: 0,
    batedoresEnviados: false,
    decretosEmitidos: false,
    ocorrencias: [],
  });

  // Se o dano for expressivo, eleva o alerta
  const incremento = Math.floor(danoTotalOuImpacto / 4);
  inv.nivelAlerta = Math.min(100, inv.nivelAlerta + incremento);
  inv.ocorrencias.push(`Impacto em ${localId}: ${danoTotalOuImpacto} de dano/reverberação (${contexto})`);

  let mensagem = '';
  if (inv.nivelAlerta >= 50 && !inv.batedoresEnviados) {
    inv.batedoresEnviados = true;
    mensagem =
      'A onda de choque de mana reverberou pelos céus da Wasteland! O Reino Santo de Limia (Heroína Hibiki) e o Império de Gritonia (Herói Tomoqui) despacharam batedores arcanos para investigar a cratera de destruição.';
    camp.cronica.push({
      turno: camp.turno,
      tipo: 'sistema',
      texto: mensagem,
    });
    camp.marcos = camp.marcos ?? [];
    camp.marcos.push({
      turno: camp.turno,
      dia: camp.calendario.dia,
      texto: 'Heróis dos Reinos Humanos em alerta: esquadrões de Limia e Gritonia iniciam investigações na Wasteland.',
    });
  } else if (inv.nivelAlerta >= 100 && !inv.decretosEmitidos) {
    inv.decretosEmitidos = true;
    mensagem =
      'Alerta Máximo dos Reinos Humanos! A escala do poder detectado foi classificada como Calamidade Não Identificada. Tomoqui de Gritonia e Hibiki de Limia emitiram decretos imperiais de busca e contenção.';
    camp.cronica.push({
      turno: camp.turno,
      tipo: 'sistema',
      texto: mensagem,
    });
    camp.marcos = camp.marcos ?? [];
    camp.marcos.push({
      turno: camp.turno,
      dia: camp.calendario.dia,
      texto: 'Decretos Imperiais de Gritonia e Limia emitidos: os Heróis buscam ativamente a origem da anomalia.',
    });
  }

  return {
    nivelAlerta: inv.nivelAlerta,
    batedoresEnviados: inv.batedoresEnviados,
    decretosEmitidos: inv.decretosEmitidos,
    mensagem: mensagem || undefined,
  };
}

/**
 * Reação de lealdade protetora absoluta das servas contratadas perante ofensas ao Mestre.
 * As bestas lendárias que aceitaram o contrato não toleram qualquer insulto, desprezo ou
 * palavra desrespeitosa de Humanos contra o Mestre, intervindo com presença esmagadora.
 */
export function reacaoServaInsulto(
  camp: CampaignState,
  ofensorNome: string,
  _contexto: string = 'conversa',
): { interveio: boolean; servaNome?: string; respostaNarrativa?: string } {
  const asora = camp.asora;
  if (!asora || !asora.desbloqueado) return { interveio: false };

  const servaAtiva = Object.values(asora.contratos).find((c) => c.ativaNoGrupo);
  if (!servaAtiva) return { interveio: false };

  const servaNome = servaAtiva.nomeConcedido;
  let respostaNarrativa = '';

  if (servaAtiva.criaturaOriginalId === 'dragao_shen') {
    respostaNarrativa =
      `${servaNome} dá um passo à frente com os olhos faiscando em azul frio e o polegar desarmando a trava da katana: ` +
      `"— Meça cada sílaba que escapa da sua boca imunda, verme insignificante. Um único insulto a mais contra o meu Mestre e eu corto sua língua antes que seu cérebro perceba o sangue." ` +
      `${ofensorNome} congela pálido como cera e se prostra tremendo.`;
  } else if (servaAtiva.criaturaOriginalId === 'aranha_calamidade') {
    respostaNarrativa =
      `${servaNome} solta um estalo de língua voraz e fios invisíveis de mana negro serpenteiam ao redor do pescoço de ${ofensorNome}: ` +
      `"— Quem você pensa que é para falar assim com o Mestre?! Eu posso devorar você inteiro agora mesmo, osso por osso, e ninguém vai encontrar seus restos!" ` +
      `${ofensorNome} quase sufoca de pavor e implora por misericórdia.`;
  } else {
    respostaNarrativa =
      `${servaNome} se coloca imediatamente como um escudo inabalável diante do Mestre, liberando uma rajada de mana que faz o chão trincar sob os pés de ${ofensorNome}: ` +
      `"— Ajoelhe-se e peça perdão pelas suas palavras insolentes, ou este lugar será seu túmulo." ` +
      `${ofensorNome} engole em seco e recua aterrorizado.`;
  }

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'narracao',
    texto: respostaNarrativa,
  });

  return {
    interveio: true,
    servaNome,
    respostaNarrativa,
  };
}

/**
 * Funda a Companhia Mercantil própria do protagonista em Tsige.
 * Estabelece a sede comercial para negociar mercadorias raras forjadas pelos Elder Dwarves
 * e colhidas pelos Orcs de Asora, permitindo ao jogador enriquecer e expandir sua influência.
 */
export function fundarCompanhiaMercantil(
  camp: CampaignState,
  nomeCompanhia: string = 'Companhia Soberana de Asora',
): { sucesso: boolean; mensagem: string } {
  const asora = (camp.asora ??= inicializarAsora());
  if (asora.companhiaMercantil?.fundada) {
    return {
      sucesso: false,
      mensagem: `A Companhia "${asora.companhiaMercantil.nome}" já está fundada e operando em Tsige.`,
    };
  }

  asora.companhiaMercantil = {
    fundada: true,
    nome: nomeCompanhia,
    nivelComercial: 1,
    ouroAcumulado: 0,
    rendaPorCiclo: 50,
    caravanasEnviadas: 0,
  };

  const texto = `Companhia Mercantil "${nomeCompanhia}" fundada com sucesso em Tsige! As rotas de comércio entre o subespaço de Asora e os mercados dos Humanos foram abertas.`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto,
  });

  camp.marcos = camp.marcos ?? [];
  camp.marcos.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    texto: `Fundação da ${nomeCompanhia}: início do império comercial do protagonista em Tsige.`,
  });

  return {
    sucesso: true,
    mensagem: texto,
  };
}

/**
 * Despacha caravana de mercadorias produzidas em Asora (grãos dos orcs, tecidos de seda e minérios rúnicos dos anões)
 * para os mercados humanos em Tsige, gerando riqueza maciça em ouro para o protagonista.
 */
export function despacharCaravanaMercantil(camp: CampaignState): {
  sucesso: boolean;
  ouroGanho: number;
  mensagem: string;
} {
  const asora = camp.asora;
  if (!asora?.companhiaMercantil?.fundada) {
    return {
      sucesso: false,
      ouroGanho: 0,
      mensagem: 'Você precisa fundar sua Companhia Mercantil em Tsige primeiro.',
    };
  }

  const est = asora.estoques;
  // Verifica se há excedentes para despacho
  if (est.comida < 5 && est.seda < 3 && est.minerio < 3) {
    return {
      sucesso: false,
      ouroGanho: 0,
      mensagem: 'Estoques de Asora insuficientes para enviar uma caravana comercial rentável.',
    };
  }

  // Consome lotes de produtos de Asora
  const qtdComida = Math.min(est.comida, 10);
  const qtdSeda = Math.min(est.seda, 8);
  const qtdMinerio = Math.min(est.minerio, 8);

  est.comida -= qtdComida;
  est.seda -= qtdSeda;
  est.minerio -= qtdMinerio;

  const nivelComp = asora.companhiaMercantil.nivelComercial;
  let bonusEstrategia = 0;
  const estrat = asora.companhiaMercantil.estrategiaAtual ?? 'graos_e_mantimentos';
  if (estrat === 'remedios_e_pocao') {
    bonusEstrategia = qtdComida * 4 + 30;
  } else if (estrat === 'tecidos_e_vestes') {
    bonusEstrategia = qtdSeda * 6 + 40;
  } else if (estrat === 'armas_e_ferramentas') {
    bonusEstrategia = qtdMinerio * 5 + 50;
  } else {
    bonusEstrategia = 25;
  }

  if (asora.companhiaMercantil.gerenteDesignada) {
    bonusEstrategia += 20;
  }

  let ouroGanho = qtdComida * 2 + qtdSeda * 8 + qtdMinerio * 6 + nivelComp * 25 + bonusEstrategia;

  // Bônus de infraestrutura: Entreposto Comercial (+40% de lucro)
  if (asora.projetosConcluidos?.includes('entreposto_comercial')) {
    ouroGanho = Math.floor(ouroGanho * 1.4);
  }

  camp.personagem.dinheiro = (camp.personagem.dinheiro ?? 0) + ouroGanho;
  asora.companhiaMercantil.ouroAcumulado += ouroGanho;
  asora.companhiaMercantil.caravanasEnviadas += 1;

  // Evolui nível da companhia se acumular riqueza suficiente
  if (asora.companhiaMercantil.ouroAcumulado >= asora.companhiaMercantil.nivelComercial * 200) {
    asora.companhiaMercantil.nivelComercial = Math.min(5, asora.companhiaMercantil.nivelComercial + 1);
    asora.companhiaMercantil.rendaPorCiclo += 40;
  }

  const texto = `Caravana comercial despachada com sucesso! Venda sob estratégia "${estrat}" rendeu ${ouroGanho} moedas de ouro nos mercados de Tsige. (Nível Comercial: ${asora.companhiaMercantil.nivelComercial}${asora.companhiaMercantil.gerenteDesignada ? `, Gerente: ${asora.companhiaMercantil.gerenteDesignada}` : ''})`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'narracao',
    texto,
  });

  return {
    sucesso: true,
    ouroGanho,
    mensagem: texto,
  };
}

/**
 * Encomenda forja especial de armaduras e armas aos Elder Dwarves de Mestre Beren em Asora.
 */
export function encomendarForjaAnoes(
  camp: CampaignState,
  itemTipo: 'traje_supressao_asora' | 'armadura_placas_asora' | 'katana_asora' | 'anel_draupnir',
): { sucesso: boolean; mensagem: string } {
  const asora = (camp.asora ??= inicializarAsora());
  if (asora.estoques.minerio < 4) {
    return {
      sucesso: false,
      mensagem: 'Minério estelar de Asora insuficiente para que os anões realizem a forja (necessário 4).',
    };
  }

  asora.estoques.minerio -= 4;
  asora.forjaAtiva = {
    itemEmForja: itemTipo,
    turnosRestantes: 0,
    encomendadoPor: camp.personagem.nome,
  };

  camp.personagem.inventario = camp.personagem.inventario ?? {};
  camp.personagem.inventario[itemTipo] = (camp.personagem.inventario[itemTipo] ?? 0) + 1;

  const nomesItens: Record<typeof itemTipo, string> = {
    traje_supressao_asora: 'Traje de Seda Noturna de Asora (Supressão de Mana)',
    armadura_placas_asora: 'Armadura de Placas Rúnicas de Asora',
    katana_asora: 'Katana de Asora',
    anel_draupnir: 'Anel Draupnir de Asora',
  };

  const texto = `Mestre Beren e os ferreiros Elder Dwarves batem a bigorna com vigor: ${nomesItens[itemTipo]} forjado com perfeição e adicionado ao seu inventário!`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto,
  });

  return {
    sucesso: true,
    mensagem: texto,
  };
}

/**
 * Ordena aos Orcs de Highland (liderados por Ema) a expansão urbana de Asora:
 * novas residências, canais de irrigação e armazéns agrícolas.
 */
export function expandirCidadeOrcs(
  camp: CampaignState,
  nomeDistrito: string = 'Distrito das Colheitas de Highland',
): { sucesso: boolean; mensagem: string; novaPopulacao: number } {
  const asora = (camp.asora ??= inicializarAsora());
  if (asora.estoques.comida < 8) {
    return {
      sucesso: false,
      mensagem: 'Provisões insuficientes para sustentar a expansão dos canteiros de obras dos orcs (necessário 8 de comida).',
      novaPopulacao: asora.populacao,
    };
  }

  asora.estoques.comida -= 8;
  asora.populacao += 45;
  asora.seguranca += 5;
  asora.harmonia += 10;
  asora.construcaoOrcs = {
    projeto: nomeDistrito,
    turnosRestantes: 0,
  };

  const texto = `Ema de Highland e os trabalhadores orcs concluem a construção do ${nomeDistrito}! Casas de madeira nobre erguidas e armazéns abastecidos. População de Asora atingiu ${asora.populacao} habitantes.`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto,
  });

  return {
    sucesso: true,
    mensagem: texto,
    novaPopulacao: asora.populacao,
  };
}

export type TriboDef = {
  id: TriboAcolhida['id'];
  nome: string;
  populacaoInicial: number;
  especialidade: string;
  descricao: string;
  setorRecomendado: SetorTrabalhoSubespaco;
  bonusImediato?: {
    ferramentas?: number;
    comida?: number;
    minerio?: number;
    seda?: number;
    seguranca?: number;
  };
};

export const TRIBOS_CATALOGO: Record<TriboAcolhida['id'], TriboDef> = {
  orcs_highland: {
    id: 'orcs_highland',
    nome: 'Orcs de Highland',
    populacaoInicial: 40,
    especialidade: 'Agricultura intensiva, abertura de canais fluviais e engenharia de solo',
    descricao: 'Liderados por Ema, são orcs pacíficos e dedicados ao cultivo da terra e à construção civil.',
    setorRecomendado: 'agricultura',
    bonusImediato: { comida: 30 },
  },
  elder_dwarves: {
    id: 'elder_dwarves',
    nome: 'Elder Dwarves',
    populacaoInicial: 25,
    especialidade: 'Forja rúnica ancestral, fabricação de ferramentas de alta dureza e refino de ligas estelares',
    descricao: 'Liderados por Mestre Beren, guardam os segredos da metalurgia sagrada e criam as ferramentas necessárias para grandes construções.',
    setorRecomendado: 'forja_ferramentas',
    bonusImediato: { ferramentas: 15, minerio: 20 },
  },
  mist_lizards: {
    id: 'mist_lizards',
    nome: 'Mist Lizards',
    populacaoInicial: 30,
    especialidade: 'Patrulha de fronteiras enevoadas, combate marcial disciplinado e escolta de caravanas',
    descricao: 'Guerreiros reptilianos de honra inabalável, protegem os limites de Asora e garantem a segurança total das caravanas.',
    setorRecomendado: 'seguranca_patrulha',
    bonusImediato: { seguranca: 15 },
  },
  alkes: {
    id: 'alkes',
    nome: 'Alkes Aladas',
    populacaoInicial: 20,
    especialidade: 'Fiação e tecelagem de seda mágica, coleta de ervas raras e observação aérea',
    descricao: 'Povo alado das montanhas da Wasteland, produzem vestes de contenção e tecidos de extrema resistência.',
    setorRecomendado: 'tecelagem',
    bonusImediato: { seda: 15 },
  },
  homens_fera: {
    id: 'homens_fera',
    nome: 'Homens-Fera do Ermo',
    populacaoInicial: 35,
    especialidade: 'Mineração subterrânea profunda, pedreiras e rastreamento de veios minerais',
    descricao: 'Caçadores e mineiros incansáveis, extraem minérios raros do subsolo da Wasteland para alimentar as forjas.',
    setorRecomendado: 'mineracao',
    bonusImediato: { minerio: 25 },
  },
};

export type ProjetoConstrucaoDef = {
  id: string;
  nome: string;
  descricao: string;
  custo: {
    comida: number;
    seda: number;
    minerio: number;
    ferramentas: number;
    madeiraNobre?: number;
  };
  operariosNecessarios: number;
  ciclosNecessarios: number;
  triboObrigatoria?: TriboAcolhida['id'];
  beneficioDescricao: string;
};

export const PROJETOS_CATALOGO: Record<string, ProjetoConstrucaoDef> = {
  armazem_central: {
    id: 'armazem_central',
    nome: 'Grande Armazém Central de Alvenaria',
    descricao: 'Edificação ampla com silos subterrâneos e isolamento rúnico contra intempéries para proteger excedentes agrícolas e minerais.',
    custo: { comida: 15, seda: 0, minerio: 10, ferramentas: 5 },
    operariosNecessarios: 15,
    ciclosNecessarios: 2,
    beneficioDescricao: '+25% na conservação de recursos e bônus de capacidade nos estoques.',
  },
  canais_irrigacao: {
    id: 'canais_irrigacao',
    nome: 'Rede Hidráulica e Canais de Irrigação dos Orcs',
    descricao: 'Canais de pedra esculpidos pelos orcs que desviam água pura das montanhas de névoa para todas as plantações.',
    custo: { comida: 25, seda: 0, minerio: 15, ferramentas: 8 },
    operariosNecessarios: 20,
    ciclosNecessarios: 3,
    triboObrigatoria: 'orcs_highland',
    beneficioDescricao: '+50% na produção periódica de alimentos de Asora.',
  },
  fundicao_runica: {
    id: 'fundicao_runica',
    nome: 'Fundição Rúnica e Forjas Centrais dos Elder Dwarves',
    descricao: 'Fornos rúnicos alimentados por mana que fundem minério estelar em lingotes perfeitos e ferramentas resistentes.',
    custo: { comida: 10, seda: 10, minerio: 30, ferramentas: 10 },
    operariosNecessarios: 25,
    ciclosNecessarios: 3,
    triboObrigatoria: 'elder_dwarves',
    beneficioDescricao: 'Produz +5 ferramentas rúnicas automaticamente a cada ciclo e desbloqueia forja avançada.',
  },
  muralha_dimensional: {
    id: 'muralha_dimensional',
    nome: 'Muralha de Proteção e Postos de Vigia da Névoa',
    descricao: 'Torres de vigia e bastilhas de rocha ao longo da linha de fronteira onde a névoa se dissipa.',
    custo: { comida: 15, seda: 0, minerio: 20, ferramentas: 12 },
    operariosNecessarios: 20,
    ciclosNecessarios: 2,
    triboObrigatoria: 'mist_lizards',
    beneficioDescricao: '+20 de Segurança permanente para Asora, repelindo qualquer ameaça.',
  },
  termas_purificadoras: {
    id: 'termas_purificadoras',
    nome: 'Termas Termais Purificadoras do Subespaço',
    descricao: 'Piscinas de águas quentes ricas em minerais mágicos sob cerejeiras, restaurando corpo e mente das tensões do mundo.',
    custo: { comida: 20, seda: 15, minerio: 15, ferramentas: 8 },
    operariosNecessarios: 15,
    ciclosNecessarios: 2,
    beneficioDescricao: '+20 de Harmonia permanente e bem-estar total para residentes e aliados.',
  },
  entreposto_comercial: {
    id: 'entreposto_comercial',
    nome: 'Entreposto de Caravana e Alfândega Dimensional',
    descricao: 'Armazém de preparação de cargas com portão de trânsito rápido para Tsige e docas de carga.',
    custo: { comida: 25, seda: 15, minerio: 20, ferramentas: 10 },
    operariosNecessarios: 20,
    ciclosNecessarios: 3,
    beneficioDescricao: '+40% no lucro em ouro de todas as caravanas comerciais despachadas para Tsige.',
  },
};

/**
 * Acolhe formalmente uma tribo resgatada na Wasteland para habitar e trabalhar em Asora.
 * A população não surge magicamente; requer resgate e acolhimento deliberado pelo soberano.
 */
export function acolherTriboWasteland(
  camp: CampaignState,
  triboId: TriboAcolhida['id'],
): { sucesso: boolean; mensagem: string; tribo?: TriboAcolhida } {
  const asora = obterAsora(camp);
  if (!asora.desbloqueado) {
    return {
      sucesso: false,
      mensagem: 'O subespaço precisa ser desbloqueado por um Contrato de Alma antes de acolher comunidades.',
    };
  }

  const def = TRIBOS_CATALOGO[triboId];
  if (!def) {
    return {
      sucesso: false,
      mensagem: `Tribo '${triboId}' não reconhecida na Wasteland.`,
    };
  }

  asora.tribosAcolhidas = asora.tribosAcolhidas ?? {};
  if (asora.tribosAcolhidas[triboId]) {
    return {
      sucesso: false,
      mensagem: `A tribo dos ${def.nome} já foi acolhida e está plenamente integrada em Asora.`,
    };
  }

  const novaTribo: TriboAcolhida = {
    id: triboId,
    nome: def.nome,
    populacao: def.populacaoInicial,
    especialidade: def.especialidade,
    dataAcolhimento: camp.calendario.dia,
  };

  asora.tribosAcolhidas[triboId] = novaTribo;
  asora.populacao += def.populacaoInicial;

  // Aplica bônus imediatos
  asora.recursosEspeciais = asora.recursosEspeciais ?? { ferramentasDisponiveis: 0, madeiraNobre: 20 };
  if (def.bonusImediato?.ferramentas) {
    asora.recursosEspeciais.ferramentasDisponiveis =
      (asora.recursosEspeciais.ferramentasDisponiveis ?? 0) + def.bonusImediato.ferramentas;
  }
  if (def.bonusImediato?.comida) {
    asora.estoques.comida += def.bonusImediato.comida;
  }
  if (def.bonusImediato?.minerio) {
    asora.estoques.minerio += def.bonusImediato.minerio;
  }
  if (def.bonusImediato?.seda) {
    asora.estoques.seda += def.bonusImediato.seda;
  }
  if (def.bonusImediato?.seguranca) {
    asora.seguranca = Math.min(100, asora.seguranca + def.bonusImediato.seguranca);
  }

  // Aloca inicialmente os novos trabalhadores no setor recomendado
  asora.alocacaoTrabalho = asora.alocacaoTrabalho ?? {
    agricultura: 0,
    mineracao: 0,
    forja_ferramentas: 0,
    tecelagem: 0,
    seguranca_patrulha: 0,
    construcao_obras: 0,
  };
  asora.alocacaoTrabalho[def.setorRecomendado] =
    (asora.alocacaoTrabalho[def.setorRecomendado] ?? 0) + def.populacaoInicial;

  const texto = `Acolhimento Nobre: Os ${def.nome} (${def.populacaoInicial} indivíduos) juraram lealdade e entraram pelo portal de Asora! Especialidade: ${def.especialidade}. População total: ${asora.populacao}.`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'narracao',
    texto,
  });

  camp.marcos = camp.marcos ?? [];
  camp.marcos.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    texto: `Povoamento de Asora: Acolhimento dos ${def.nome}.`,
  });

  return {
    sucesso: true,
    mensagem: texto,
    tribo: novaTribo,
  };
}

/**
 * Define a distribuição de mão de obra trabalhadora entre os afazeres de Asora.
 * Garante que a soma de trabalhadores alocados respeite o limite da população acolhida.
 */
export function definirAlocacaoTrabalho(
  camp: CampaignState,
  novaAlocacao: Partial<Record<SetorTrabalhoSubespaco, number>>,
): {
  sucesso: boolean;
  mensagem: string;
  alocacaoEfetiva: Record<SetorTrabalhoSubespaco, number>;
} {
  const asora = obterAsora(camp);
  if (!asora.desbloqueado) {
    return {
      sucesso: false,
      mensagem: 'O subespaço precisa ser desbloqueado antes de organizar frentes de trabalho.',
      alocacaoEfetiva: asora.alocacaoTrabalho!,
    };
  }

  const alocAtual = asora.alocacaoTrabalho ?? {
    agricultura: 0,
    mineracao: 0,
    forja_ferramentas: 0,
    tecelagem: 0,
    seguranca_patrulha: 0,
    construcao_obras: 0,
  };

  const combinada: Record<SetorTrabalhoSubespaco, number> = {
    agricultura: novaAlocacao.agricultura ?? alocAtual.agricultura ?? 0,
    mineracao: novaAlocacao.mineracao ?? alocAtual.mineracao ?? 0,
    forja_ferramentas: novaAlocacao.forja_ferramentas ?? alocAtual.forja_ferramentas ?? 0,
    tecelagem: novaAlocacao.tecelagem ?? alocAtual.tecelagem ?? 0,
    seguranca_patrulha: novaAlocacao.seguranca_patrulha ?? alocAtual.seguranca_patrulha ?? 0,
    construcao_obras: novaAlocacao.construcao_obras ?? alocAtual.construcao_obras ?? 0,
  };

  const totalAlocado = Object.values(combinada).reduce((a, b) => a + b, 0);
  if (totalAlocado > asora.populacao) {
    return {
      sucesso: false,
      mensagem: `Total de trabalhadores alocados (${totalAlocado}) excede a população total disponível (${asora.populacao}).`,
      alocacaoEfetiva: alocAtual,
    };
  }

  asora.alocacaoTrabalho = combinada;

  return {
    sucesso: true,
    mensagem: `Alocação de trabalho atualizada: ${combinada.agricultura} na agricultura, ${combinada.mineracao} na mineração, ${combinada.forja_ferramentas} nas forjas, ${combinada.tecelagem} na tecelagem, ${combinada.seguranca_patrulha} em patrulhas e ${combinada.construcao_obras} no canteiro de obras. (${asora.populacao - totalAlocado} descansando/reserva).`,
    alocacaoEfetiva: combinada,
  };
}

/**
 * Inicia uma grande obra de infraestrutura no subespaço de Asora.
 * Projetos que antes eram impossíveis pela falta de material, ferramentas dos anões
 * ou gente, tornam-se viáveis conforme Asora cresce.
 */
export function iniciarProjetoConstrucao(
  camp: CampaignState,
  projetoId: string,
): { sucesso: boolean; mensagem: string } {
  const asora = obterAsora(camp);
  if (!asora.desbloqueado) {
    return { sucesso: false, mensagem: 'O subespaço precisa ser desbloqueado primeiro.' };
  }

  if (asora.projetoEmAndamento) {
    return {
      sucesso: false,
      mensagem: `Já existe uma obra em andamento: ${asora.projetoEmAndamento.nome} (${asora.projetoEmAndamento.turnosRestantes} ciclos restantes).`,
    };
  }

  asora.projetosConcluidos = asora.projetosConcluidos ?? [];
  if (asora.projetosConcluidos.includes(projetoId)) {
    return {
      sucesso: false,
      mensagem: `A obra '${projetoId}' já foi concluída com sucesso em Asora.`,
    };
  }

  const def = PROJETOS_CATALOGO[projetoId];
  if (!def) {
    return {
      sucesso: false,
      mensagem: `Projeto de construção '${projetoId}' não catalogado.`,
    };
  }

  // Verifica pré-requisito de tribo específica
  if (def.triboObrigatoria && !asora.tribosAcolhidas?.[def.triboObrigatoria]) {
    const triboNome = TRIBOS_CATALOGO[def.triboObrigatoria]?.nome ?? def.triboObrigatoria;
    return {
      sucesso: false,
      mensagem: `Construção inviável: Requer a maestria e cooperação dos ${triboNome} acolhidos em Asora.`,
    };
  }

  asora.recursosEspeciais = asora.recursosEspeciais ?? { ferramentasDisponiveis: 0, madeiraNobre: 20 };
  const ferramentasAtuais = asora.recursosEspeciais.ferramentasDisponiveis ?? 0;
  if (ferramentasAtuais < def.custo.ferramentas) {
    return {
      sucesso: false,
      mensagem: `Ferramentas rúnicas insuficientes! Necessário: ${def.custo.ferramentas}, Disponíveis: ${ferramentasAtuais}. Os Elder Dwarves precisam forjar mais ferramentas.`,
    };
  }

  if (asora.estoques.comida < def.custo.comida) {
    return {
      sucesso: false,
      mensagem: `Provisões de comida insuficientes (requer ${def.custo.comida}, possui ${asora.estoques.comida}).`,
    };
  }

  if (asora.estoques.minerio < def.custo.minerio) {
    return {
      sucesso: false,
      mensagem: `Minério estelar insuficiente (requer ${def.custo.minerio}, possui ${asora.estoques.minerio}).`,
    };
  }

  if (asora.estoques.seda < def.custo.seda) {
    return {
      sucesso: false,
      mensagem: `Seda celestial insuficiente (requer ${def.custo.seda}, possui ${asora.estoques.seda}).`,
    };
  }

  const operariosAlocados = asora.alocacaoTrabalho?.construcao_obras ?? 0;
  if (operariosAlocados < def.operariosNecessarios) {
    return {
      sucesso: false,
      mensagem: `Mão de obra insuficiente alocada no Canteiro de Obras (requer ${def.operariosNecessarios}, alocados atualmente: ${operariosAlocados}). Realoque trabalhadores em 'definirAlocacaoTrabalho'.`,
    };
  }

  // Consome os custos
  asora.estoques.comida -= def.custo.comida;
  asora.estoques.minerio -= def.custo.minerio;
  asora.estoques.seda -= def.custo.seda;
  asora.recursosEspeciais.ferramentasDisponiveis -= def.custo.ferramentas;

  asora.projetoEmAndamento = {
    id: def.id,
    nome: def.nome,
    turnosRestantes: def.ciclosNecessarios,
    operariosAlocados,
  };

  const texto = `Canteiro de Obras iniciado: "${def.nome}" começou a ser erguido por ${operariosAlocados} trabalhadores demi-humanos munidos de ferramentas rúnicas! Previsão: ${def.ciclosNecessarios} ciclos.`;

  camp.cronica.push({
    turno: camp.turno,
    tipo: 'sistema',
    texto,
  });

  return {
    sucesso: true,
    mensagem: texto,
  };
}

/**
 * Avança um ciclo de trabalho e produção no subespaço de Asora.
 * Colheitas são recolhidas, minérios extraídos, ferramentas forjadas e obras avançadas.
 */
export function avancarCicloSubespaco(camp: CampaignState): {
  eventos: string[];
  producao: {
    comida: number;
    seda: number;
    minerio: number;
    ferramentas: number;
    ouroCompanhia: number;
  };
  projetoConcluido?: string;
} {
  const asora = obterAsora(camp);
  const eventos: string[] = [];
  const producao = {
    comida: 0,
    seda: 0,
    minerio: 0,
    ferramentas: 0,
    ouroCompanhia: 0,
  };

  if (!asora.desbloqueado) {
    return { eventos, producao };
  }

  const aloc = asora.alocacaoTrabalho ?? {
    agricultura: 0,
    mineracao: 0,
    forja_ferramentas: 0,
    tecelagem: 0,
    seguranca_patrulha: 0,
    construcao_obras: 0,
  };

  asora.projetosConcluidos = asora.projetosConcluidos ?? [];
  asora.recursosEspeciais = asora.recursosEspeciais ?? { ferramentasDisponiveis: 0, madeiraNobre: 20 };

  // 1. Agricultura (Bônus de canais de irrigação se concluído)
  if (aloc.agricultura > 0) {
    let ganhoComida = Math.max(5, Math.floor(aloc.agricultura * 0.8));
    if (asora.projetosConcluidos.includes('canais_irrigacao')) {
      ganhoComida = Math.floor(ganhoComida * 1.5);
    }
    asora.estoques.comida += ganhoComida;
    producao.comida = ganhoComida;
    eventos.push(`Colheita abundante: +${ganhoComida} alimentos colhidos pelas lavouras.`);
  }

  // 2. Mineração
  if (aloc.mineracao > 0) {
    const ganhoMinerio = Math.max(3, Math.floor(aloc.mineracao * 0.6));
    asora.estoques.minerio += ganhoMinerio;
    producao.minerio = ganhoMinerio;
    eventos.push(`Pedreiras ativas: +${ganhoMinerio} minério estelar extraído.`);
  }

  // 3. Tecelagem
  if (aloc.tecelagem > 0) {
    const ganhoSeda = Math.max(2, Math.floor(aloc.tecelagem * 0.5));
    asora.estoques.seda += ganhoSeda;
    producao.seda = ganhoSeda;
    eventos.push(`Ateliê das Alkes: +${ganhoSeda} seda celestial fiada.`);
  }

  // 4. Forja de Ferramentas Rúnicas (requer Elder Dwarves)
  if (aloc.forja_ferramentas > 0 && asora.tribosAcolhidas?.elder_dwarves) {
    let ganhoFerramentas = Math.max(1, Math.floor(aloc.forja_ferramentas * 0.3));
    if (asora.projetosConcluidos.includes('fundicao_runica')) {
      ganhoFerramentas += 5;
    }
    asora.recursosEspeciais.ferramentasDisponiveis =
      (asora.recursosEspeciais.ferramentasDisponiveis ?? 0) + ganhoFerramentas;
    producao.ferramentas = ganhoFerramentas;
    eventos.push(`Forjas de Beren: +${ganhoFerramentas} ferramentas rúnicas de alta dureza forjadas.`);
  }

  // 5. Patrulha de Segurança
  if (aloc.seguranca_patrulha > 0) {
    const ganhoSeg = Math.min(10, Math.floor(aloc.seguranca_patrulha * 0.2));
    asora.seguranca = Math.min(100, asora.seguranca + ganhoSeg);
  }

  // 6. Canteiro de Obras
  let projetoConcluidoNome: string | undefined;
  if (asora.projetoEmAndamento) {
    if (aloc.construcao_obras > 0) {
      asora.projetoEmAndamento.turnosRestantes -= 1;
      if (asora.projetoEmAndamento.turnosRestantes <= 0) {
        const pId = asora.projetoEmAndamento.id;
        const pNome = asora.projetoEmAndamento.nome;
        projetoConcluidoNome = pNome;
        asora.projetosConcluidos.push(pId);

        // Aplica efeitos permanentes da obra
        if (pId === 'muralha_dimensional') {
          asora.seguranca = Math.min(100, asora.seguranca + 20);
        } else if (pId === 'termas_purificadoras') {
          asora.harmonia = 100;
        }

        const textoObra = `OBRA CONCLUÍDA: ${pNome} foi finalizado com maestria em Asora! Os benefícios estruturais foram ativados permanentemente.`;
        eventos.push(textoObra);
        camp.cronica.push({ turno: camp.turno, tipo: 'narracao', texto: textoObra });
        camp.marcos = camp.marcos ?? [];
        camp.marcos.push({
          turno: camp.turno,
          dia: camp.calendario.dia,
          texto: `Monumento de Asora: Conclusão de ${pNome}.`,
        });

        asora.projetoEmAndamento = undefined;
      } else {
        eventos.push(`Construção em progresso: ${asora.projetoEmAndamento.nome} (${asora.projetoEmAndamento.turnosRestantes} ciclos restantes).`);
      }
    } else {
      eventos.push(`Obra parada: ${asora.projetoEmAndamento.nome} aguarda operários alocados na construção.`);
    }
  }

  // 7. Renda automática da Companhia Mercantil
  if (asora.companhiaMercantil?.fundada) {
    const renda = asora.companhiaMercantil.rendaPorCiclo ?? 50;
    camp.personagem.dinheiro = (camp.personagem.dinheiro ?? 0) + renda;
    asora.companhiaMercantil.ouroAcumulado += renda;
    producao.ouroCompanhia = renda;
    eventos.push(`Companhia Mercantil: +${renda} ouro gerado pelo comércio regular em Tsige.`);
  }

  return {
    eventos,
    producao,
    projetoConcluido: projetoConcluidoNome,
  };
}

/**
 * Define a estratégia comercial prioritária da Companhia Mercantil em Tsige.
 */
export function definirEstrategiaCompanhia(
  camp: CampaignState,
  estrategia: EstrategiaCompanhia,
): { sucesso: boolean; mensagem: string } {
  const asora = obterAsora(camp);
  if (!asora.companhiaMercantil?.fundada) {
    return {
      sucesso: false,
      mensagem: 'Você precisa fundar sua Companhia Mercantil em Tsige primeiro.',
    };
  }

  asora.companhiaMercantil.estrategiaAtual = estrategia;

  const desc: Record<EstrategiaCompanhia, string> = {
    remedios_e_pocao: 'Remédios, Unguentos e Poções Místicas de Asora (Alta Margem de Lucro)',
    tecidos_e_vestes: 'Tecidos de Seda Celestial e Vestes de Alta Resistência (Mercado Nobre)',
    armas_e_ferramentas: 'Armas de Minério Estelar e Ferramentas Rúnicas dos Elder Dwarves (Aventureiros e Pioneiros)',
    graos_e_mantimentos: 'Grãos Nobres e Mantimentos Fartos dos Orcs (Abastecimento Geral de Tsige)',
  };

  const msg = `Estratégia comercial da Companhia "${asora.companhiaMercantil.nome}" definida como: ${desc[estrategia]}.`;
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto: msg });

  return { sucesso: true, mensagem: msg };
}

/**
 * Designa a gerente oficial responsável pelas operações de loja e balcão em Tsige.
 */
export function designarGerenteCompanhia(
  camp: CampaignState,
  gerenteNome: string,
): { sucesso: boolean; mensagem: string } {
  const asora = obterAsora(camp);
  if (!asora.companhiaMercantil?.fundada) {
    return { sucesso: false, mensagem: 'Fundar Companhia Mercantil antes de designar gerência.' };
  }

  asora.companhiaMercantil.gerenteDesignada = gerenteNome;
  const msg = `${gerenteNome} foi formalmente designada como Gerente Geral da Companhia "${asora.companhiaMercantil.nome}" em Tsige (+20 de bônus em negociações).`;
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto: msg });

  return { sucesso: true, mensagem: msg };
}

/**
 * Designa a força de escolta armada para proteger as caravanas dimensionais entre Asora e Tsige.
 */
export function designarEscoltaCaravana(
  camp: CampaignState,
  escolta: 'sem_escolta' | 'guerreiros_orcs' | 'mist_lizards' | 'serva_de_elite',
): { sucesso: boolean; mensagem: string } {
  const asora = obterAsora(camp);
  if (!asora.companhiaMercantil?.fundada) {
    return { sucesso: false, mensagem: 'Fundar Companhia Mercantil antes de organizar escoltas.' };
  }

  asora.companhiaMercantil.escoltaDesignada = escolta;

  const desc = {
    sem_escolta: 'Sem escolta regular (risco padrão)',
    guerreiros_orcs: 'Guarnição de Guerreiros Orcs de Highland (proteção física robusta)',
    mist_lizards: 'Regimento de Infantaria de Elite dos Mist Lizards (disciplina marcial total)',
    serva_de_elite: 'Proteção pessoal de Serva Contratada (dissuasão absoluta contra qualquer ameaça)',
  }[escolta];

  const msg = `Escolta da caravana comercial definida: ${desc}.`;
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto: msg });

  return { sucesso: true, mensagem: msg };
}

export type TipoAtividadeRomance =
  | 'termas_mio'
  | 'sake_tomoe'
  | 'chamas_suzaku'
  | 'passeio_vila';

/**
 * Executa um momento dedicado de intimidade, romance e descanso com uma serva do Círculo Central em Asora.
 * Eleva afeto da companheira, gera ciúme dinâmico entre as outras servas e recupera recursos vitais.
 */
export function executarMomentoRomanceServa(
  camp: CampaignState,
  servaId: string,
  tipoAtividade: TipoAtividadeRomance,
): { sucesso: boolean; mensagem: string; fato: string } {
  const asora = obterAsora(camp);
  if (!asora.desbloqueado) {
    return {
      sucesso: false,
      mensagem: 'O subespaço de Asora ainda está selado. É necessário firmar um Contrato de Alma primeiro.',
      fato: 'Você busca refúgio íntimo, mas as portas de Asora permanecem seladas.',
    };
  }

  // Se servaId for passado, valida que o contrato existe
  let servaPrincipal: ContratoAlma | undefined;
  if (servaId) {
    servaPrincipal = asora.contratos[servaId];
    if (!servaPrincipal) {
      return {
        sucesso: false,
        mensagem: `A serva com ID '${servaId}' não está vinculada por contrato de alma.`,
        fato: 'A companheira desejada não se encontra no subespaço.',
      };
    }
  } else {
    // Para passeio_vila, escolhe a serva com maior afeto
    const ativas = Object.values(asora.contratos);
    if (ativas.length === 0) {
      return {
        sucesso: false,
        mensagem: 'Não há servas contratadas em Asora no momento.',
        fato: 'Você caminha só pelos campos virgens de Asora.',
      };
    }
    servaPrincipal = [...ativas].sort((a, b) => b.afeto - a.afeto)[0];
  }

  // 1. Elevação de afeto e alívio de ciúme da serva acompanhada
  servaPrincipal.afeto = Math.min(100, (servaPrincipal.afeto || 80) + 15);
  servaPrincipal.ciume = Math.max(5, (servaPrincipal.ciume || 30) - 15);

  // 2. Disparo de ciúme adorável nas demais servas ativas (rivalidade do harém)
  for (const [id, c] of Object.entries(asora.contratos)) {
    if (id !== servaPrincipal.criaturaOriginalId) {
      c.ciume = Math.min(100, (c.ciume || 30) + 15);
    }
  }

  // 3. Recuperação de recursos físicos e mentais pelo descanso/intimidade
  const maxVida = camp.personagem.recursosMax?.['vida'] ?? 220;
  const maxVigor = camp.personagem.recursosMax?.['vigor'] ?? 30;
  const maxMana = camp.personagem.recursosMax?.['mana'] ?? 200;

  camp.personagem.recursos.vida = Math.min(maxVida, camp.personagem.recursos.vida + 50);
  camp.personagem.recursos.vigor = Math.min(maxVigor, camp.personagem.recursos.vigor + 40);
  camp.personagem.recursos.mana = Math.min(maxMana, camp.personagem.recursos.mana + 40);

  // 4. Narrativa evocativa e canônica conforme a atividade
  let textoFato = '';
  let tituloAtividade = '';

  if (tipoAtividade === 'termas_mio') {
    tituloAtividade = 'Fontes Termais de Asora & Banquete com Mio';
    textoFato =
      `Sob o vapor aromático das fontes termais de Asora, você relaxa nas águas mornas enquanto Mio desliza ao seu lado com olhar dengoso e bochechas coradas. ` +
      `Ela serve carinhosamente manjares divinos preparados com devoção ardente, alimentando você na boca e recostando a cabeça em seu peito úmido, murmurando com ciúmes possessivos de que "ninguém além de mim tem o direito de banhar e mimar o meu querido Mestre!". ` +
      `O descanso profundo restaura 50 de Vida, 40 de Vigor e 40 de Mana (+15% Afeto com Mio, ciúme das outras servas atiçado).`;
  } else if (tipoAtividade === 'sake_tomoe') {
    tituloAtividade = 'Degustação de Sake & Noite de Bushido com Tomoe';
    textoFato =
      `Sob o luar prateado que banha os beirais de Asora, você e Tomoe compartilham garrafas do mais puro sake fermentado no subespaço. ` +
      `A nobre samurai maneja a katana em passos graciosos de dança marcial, recitando versos clássicos e dramas de época. Entre risadas cúmplices e olhares intensos, Tomoe desfaz a postura austera e aninha-se ao seu lado com o quimono entreaberto, confessando em voz suave que todo o poder deste mundo nada vale se comparado a estar com o Mestre. ` +
      `O convívio íntimo e sereno restaura 50 de Vida, 40 de Vigor e 40 de Mana (+15% Afeto com Tomoe, ciúme das outras servas atiçado).`;
  } else if (tipoAtividade === 'chamas_suzaku') {
    tituloAtividade = 'Voo sob as Estrelas & Calor Celestial com Suzaku';
    textoFato =
      `Nas torres mais altas de Asora, Suzaku desdobra asas de fogo dourado e eleva você pelos céus estrelados da dimensão. ` +
      `O calor suave de suas plumas celestes envolve seu corpo, dissolvendo qualquer cansaço ou tensão. Pousando nos terraços privativos, a bela mulher de chamas beija suas mãos com submissão apaixonada e olhar devoto, jurando que cada centelha de seu ser queima apenas pelo Mestre. ` +
      `O calor purificador restaura 50 de Vida, 40 de Vigor e 40 de Mana (+15% Afeto com Suzaku, ciúme das outras servas atiçado).`;
  } else {
    tituloAtividade = 'Passeio Noturno & Confraternização com o Círculo Central';
    textoFato =
      `Você caminha pelas alamedas arborizadas de Asora ladeado por suas servas do Círculo Central. ` +
      `Mio tenta monopolizar seu braço direito com dengos possessivos, Tomoe finge serenidade enquanto caminha colada ao seu lado esquerdo censurando a ousadia da aranha, e trocas de olhares provocadores enchem a noite de calor, romance e cumplicidade. ` +
      `A harmonia vibrante do subespaço renova o ânimo: 50 de Vida, 40 de Vigor e 40 de Mana recuperados.`;
  }

  // Registra crônica e marco permanente
  camp.cronica.push({
    turno: camp.turno,
    tipo: 'narracao',
    texto: textoFato,
  });

  if (!camp.marcos) camp.marcos = [];
  camp.marcos.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    texto: `Intimidade em Asora: ${tituloAtividade} vivenciado com cumplicidade e romance.`,
  });

  return {
    sucesso: true,
    mensagem: `Momento de romance vivenciado com sucesso: ${tituloAtividade}.`,
    fato: textoFato,
  };
}
