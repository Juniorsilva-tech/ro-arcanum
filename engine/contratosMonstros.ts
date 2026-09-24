// ARCANUM · Contratos de Caça a Monstros (Estilo The Witcher)
// Quadro de contratos regionais, investigação de pistas táticas, fraquezas de óleos alquímicos,
// confronto com bestas e troféus de caça com bônus permanentes.
import type {
  Campaign,
  ContentBundle,
  ContratoMonstro,
  ContratosMonstroCampanha,
  PistaMonstro,
  TrofeuMonstro,
} from './types';
import { iniciarCombate } from './combat';
import { itemPorId } from './items';
import { nextFloat } from './rng';
import { modificador } from './character';
import { emLocal } from './memoriaMundo';

export const CONTRATOS_INICIAIS_VAELHORN: ContratoMonstro[] = [
  {
    id: 'contrato_lobo_val_cinza',
    titulo: 'O Terror das Caravanas de Val-Cinza',
    contratante: 'As mercadoras da Feira Coberta',
    localId: 'floresta',
    monstroNome: 'Lobo Alpha de Val-Cinza',
    criaturaId: 'lobo_alpha_val_cinza',
    categoriaAlvo: 'fera',
    fraquezaOleo: 'oleo_anti_besta',
    recompensaMoedas: 80,
    recompensaXp: 50,
    descricao:
      'Uma alcateia agressiva liderada por um lobo cinzento colossal está interceptando viajantes e carregamentos de grãos. O contratante exige a cabeça do macho alfa como prova.',
    pistas: [
      {
        id: 'pista_carcassas_mulas',
        descricao: 'Carcaças de animais de carga estraçalhadas com mandíbula larga e dentes quebrados contra osso.',
        encontrada: false,
        periciaNecessaria: 'rastrear',
        dificuldade: 10,
      },
      {
        id: 'pista_pelos_cinzentos',
        descricao: 'Tufos de pelagem espessa e cinzenta presos em arbustos espinhosos com forte odor almiscarado.',
        encontrada: false,
        periciaNecessaria: 'perceber',
        dificuldade: 10,
      },
      {
        id: 'pista_tocas_alcateia',
        descricao: 'Rastros de patas gigantes contornando os desfiladeiros rochosos onde o covil foi estabelecido.',
        encontrada: false,
        periciaNecessaria: 'atletismo',
        dificuldade: 11,
      },
    ],
    estado: 'disponivel',
    trofeuId: 'trofeu_lobo_cinzento',
  },
  {
    id: 'contrato_gargula_mir',
    titulo: 'A Sombra Pétrea das Ruínas de Mir',
    contratante: 'A Capela de São Vandro',
    localId: 'ruinas',
    monstroNome: 'Gárgula Abissal de Mir',
    criaturaId: 'gargula_abissal_mir',
    categoriaAlvo: 'monstro',
    fraquezaOleo: 'oleo_draconico_de_enxofre',
    recompensaMoedas: 130,
    recompensaXp: 75,
    descricao:
      'Uma gárgula de granito desperta das catedrais em ruínas de Mir e ataca peregrinos durante o crepúsculo. O clero paga em ouro limpo pelo coração de pedra da abominação.',
    pistas: [
      {
        id: 'pista_marcas_garras_granito',
        descricao: 'Sulcos profundos de garras pétreas cravados nos capitéis e vigas de sustentação das ruínas.',
        encontrada: false,
        periciaNecessaria: 'perceber',
        dificuldade: 11,
      },
      {
        id: 'pista_fuligem_enxofre',
        descricao: 'Resíduos de enxofre e pedra vitrificada onde os corpos das vítimas foram esmagados.',
        encontrada: false,
        periciaNecessaria: 'arcana',
        dificuldade: 11,
      },
      {
        id: 'pista_ninho_torre_alta',
        descricao: 'Observação do topo da torre quebrada onde a criatura repousa durante a luz solar direta.',
        encontrada: false,
        periciaNecessaria: 'atletismo',
        dificuldade: 12,
      },
    ],
    estado: 'disponivel',
    trofeuId: 'trofeu_gargula_abissal',
  },
  {
    id: 'contrato_oni_pantano',
    titulo: 'O Devorador dos Pântanos da Fronteira',
    contratante: 'As pescadoras de Juncal de Baixo',
    localId: 'charco_juncal',
    monstroNome: 'Oni Carniceiro da Fronteira',
    criaturaId: 'oni_carniceiro_fronteira',
    categoriaAlvo: 'oni',
    fraquezaOleo: 'oleo_de_glicinia_solar',
    recompensaMoedas: 190,
    recompensaXp: 110,
    descricao:
      'Um demônio antigo com chifre quebrado assombra as névoas dos baixios pantanosos, sequestrando guardas e devorando carne humana. Exige preparação cuidadosa com óleos de glicínia.',
    pistas: [
      {
        id: 'pista_palicadas_partidas',
        descricao: 'Vigas defensivas de carvalho partidas ao meio com força descomunal e pegadas descalças de quatro dedos.',
        encontrada: false,
        periciaNecessaria: 'rastrear',
        dificuldade: 12,
      },
      {
        id: 'pista_ossos_mastigados',
        descricao: 'Ossos de soldados quebrados para extração de tutano, cobertos por baba escura e ácida.',
        encontrada: false,
        periciaNecessaria: 'perceber',
        dificuldade: 12,
      },
      {
        id: 'pista_carne_regenerada',
        descricao: 'Fragmentos de tecido biológico que se contraem sozinhos mesmo após serem decepados da criatura.',
        encontrada: false,
        periciaNecessaria: 'arcana',
        dificuldade: 13,
      },
    ],
    estado: 'disponivel',
    trofeuId: 'trofeu_oni_do_pantano',
  },
  {
    id: 'contrato_quimera_sulco',
    titulo: 'As Asas da Tempestade no Passo do Lobo',
    contratante: 'Casa Tessel',
    localId: 'passo_lobo',
    monstroNome: 'Quimera Alada do Sulco',
    criaturaId: 'quimera_do_sulco',
    categoriaAlvo: 'monstro',
    fraquezaOleo: 'oleo_draconico_de_enxofre',
    recompensaMoedas: 240,
    recompensaXp: 145,
    descricao:
      'Uma monstruosidade tricéfala nidificou nos picos ventosos acima das minas de ferro negro. As rotas de minério estão bloqueadas e os mineradores recusam-se a descer.',
    pistas: [
      {
        id: 'pista_penas_escamas',
        descricao: 'Escamas pesadas de réptil fundidas com penas escuras de ave de rapina encontradas nas ravinas.',
        encontrada: false,
        periciaNecessaria: 'perceber',
        dificuldade: 12,
      },
      {
        id: 'pista_veneno_pedra',
        descricao: 'Rocha calcária corroída por gotas de veneno cáustico gotejadas da cauda ferrada da besta.',
        encontrada: false,
        periciaNecessaria: 'oficio',
        dificuldade: 13,
      },
      {
        id: 'pista_correntes_ar',
        descricao: 'Estudo das correntes térmicas ascendentes que a quimera utiliza para planar sem ser detectada.',
        encontrada: false,
        periciaNecessaria: 'rastrear',
        dificuldade: 13,
      },
    ],
    estado: 'disponivel',
    trofeuId: 'trofeu_quimera_da_cordilheira',
  },
];

/** Onde fica o quadro de contratos. */
export const LOCAIS_DO_QUADRO = ['taverna', 'mercado'];

/** "na Mata de Corvos", "em Tessel": o lugar pronto para o meio da frase. */
function nomeDoLugar(content: ContentBundle | undefined, id: string): string {
  const nome = content?.locais.find(l => l.id === id)?.nome ?? id;
  const em = emLocal(nome);
  return em.charAt(0).toLowerCase() + em.slice(1);
}

/**
 * Garante que a campanha possui a estrutura de contratos inicializada.
 */
export function inicializarQuadroContratos(camp: Campaign): ContratosMonstroCampanha {
  // Saves de antes da sessão 54 guardaram cópias com lugares que não existem
  // ('pantano', 'montanhas') e contratantes antigos: os campos fixos do
  // contrato voltam a ser os do conteúdo; o estado (aceito, pistas achadas)
  // continua o do save.
  if (camp.contratosMonstro) {
    for (const base of CONTRATOS_INICIAIS_VAELHORN) {
      const c = camp.contratosMonstro.contratos[base.id];
      if (!c) continue;
      c.titulo = base.titulo; c.contratante = base.contratante; c.localId = base.localId; c.descricao = base.descricao;
    }
  }
  if (!camp.contratosMonstro) {
    const mapa: Record<string, ContratoMonstro> = {};
    for (const c of CONTRATOS_INICIAIS_VAELHORN) {
      mapa[c.id] = {
        ...c,
        pistas: c.pistas.map((p) => ({ ...p })),
      };
    }
    camp.contratosMonstro = {
      contratos: mapa,
      trofeus: [],
    };
  }
  return camp.contratosMonstro;
}

/**
 * Retorna todos os contratos cadastrados e seus estados.
 */
export function listarContratos(camp: Campaign): ContratoMonstro[] {
  const quadro = inicializarQuadroContratos(camp);
  return Object.values(quadro.contratos);
}

/**
 * Aceita um contrato do quadro de avisos, mudando seu estado para 'investigando'.
 */
export function aceitarContrato(
  camp: Campaign,
  contratoId: string,
  content?: ContentBundle,
): { ok: boolean; mensagem: string } {
  const quadro = inicializarQuadroContratos(camp);
  const contrato = quadro.contratos[contratoId];
  if (!contrato) {
    return { ok: false, mensagem: 'Contrato não encontrado no quadro.' };
  }
  if (contrato.estado !== 'disponivel') {
    return { ok: false, mensagem: `O contrato já se encontra no estado: ${contrato.estado}.` };
  }

  if (!LOCAIS_DO_QUADRO.includes(camp.localAtual)) {
    return { ok: false, mensagem: 'O quadro de contratos fica na taverna e na Feira Coberta.' };
  }
  contrato.estado = 'investigando';
  const onde = nomeDoLugar(content, contrato.localId);
  const msg = `Você aceitou o contrato "${contrato.titulo}". Quem paga: ${contrato.contratante}. O rastro começa ${onde}: procure as pistas lá antes de ir atrás do bicho.`;
  camp.cronica.push({ turno: camp.turno, texto: msg, tipo: 'sistema' });
  return { ok: true, mensagem: msg };
}

/**
 * Investiga uma pista específica de um contrato ativo.
 * Rola teste da perícia requerida somado aos modificadores do personagem.
 */
export function investigarPista(
  camp: Campaign,
  contratoId: string,
  pistaId: string,
  content?: ContentBundle,
): { ok: boolean; sucesso: boolean; mensagem: string; todasReveladas: boolean } {
  const quadro = inicializarQuadroContratos(camp);
  const contrato = quadro.contratos[contratoId];
  if (!contrato) {
    return { ok: false, sucesso: false, mensagem: 'Contrato não encontrado.', todasReveladas: false };
  }
  if (contrato.estado !== 'investigando') {
    return { ok: false, sucesso: false, mensagem: 'O contrato não está na fase de investigação.', todasReveladas: false };
  }

  if (camp.localAtual !== contrato.localId) {
    return { ok: false, sucesso: false, mensagem: `As pistas deste contrato estão ${nomeDoLugar(content, contrato.localId)}.`, todasReveladas: false };
  }
  const pista = contrato.pistas.find((p) => p.id === pistaId);
  if (!pista) {
    return { ok: false, sucesso: false, mensagem: 'Pista não encontrada no contrato.', todasReveladas: false };
  }
  if (pista.encontrada) {
    return { ok: true, sucesso: true, mensagem: 'Esta pista já foi completamente examinada e catalogada.', todasReveladas: contrato.pistas.every((p) => p.encontrada) };
  }

  const periciaNome = pista.periciaNecessaria ?? 'perceber';
  const bonusPericia = camp.personagem.pericias[periciaNome] ?? 0;
  const modAtributo = modificador(camp.personagem.atributos.percepcao);
  const dadoD20 = Math.floor(nextFloat(camp.rng) * 20) + 1;
  const total = dadoD20 + bonusPericia + modAtributo;
  const dif = pista.dificuldade ?? 10;

  if (total >= dif) {
    pista.encontrada = true;
    const todas = contrato.pistas.every((p) => p.encontrada);
    if (todas) {
      contrato.estado = 'pronto_para_confronto';
    }

    const oleo = (content && itemPorId(content, contrato.fraquezaOleo)?.nome) ?? contrato.fraquezaOleo;
    const msg = `Você encontra o que procurava: ${pista.descricao.charAt(0).toLowerCase()}${pista.descricao.slice(1)} Isso confirma a fraqueza — ${oleo} na lâmina faz diferença contra ele.${todas ? ' Com todas as pistas juntas, você sabe onde o bicho dorme: dá para ir atrás dele.' : ''}`;
    camp.cronica.push({ turno: camp.turno, texto: msg, tipo: 'sistema' });
    return { ok: true, sucesso: true, mensagem: msg, todasReveladas: todas };
  }

  const falhaMsg = 'O terreno e a neblina esconderam o rastro. Hoje não deu; dá para tentar de novo.';
  return { ok: true, sucesso: false, mensagem: falhaMsg, todasReveladas: false };
}

/**
 * Aplica um óleo alquímico do inventário na lâmina, ativando bônus para os próximos combates.
 */
export function aplicarOleoAlquimico(
  camp: Campaign,
  itemId: string,
  content: ContentBundle,
): { ok: boolean; mensagem: string } {
  const p = camp.personagem;
  if ((p.inventario[itemId] ?? 0) <= 0) {
    return { ok: false, mensagem: 'Você não possui este óleo alquímico no inventário.' };
  }

  const item = itemPorId(content, itemId, p);
  if (!item || !item.oleoAlvo) {
    return { ok: false, mensagem: 'O item selecionado não é um óleo de lâmina válido.' };
  }

  // Consumir 1 frasco
  p.inventario[itemId] -= 1;
  if (p.inventario[itemId] <= 0) delete p.inventario[itemId];

  let bonusDano = 5;
  if (itemId === 'oleo_anti_necromorfos') bonusDano = 6;
  if (itemId === 'oleo_de_glicinia_solar') bonusDano = 7;
  if (itemId === 'oleo_draconico_de_enxofre') bonusDano = 6;

  const quadro = inicializarQuadroContratos(camp);
  quadro.oleoAtivo = {
    tipoAlvo: item.oleoAlvo,
    bonusDano,
    combatesRestantes: 3,
    nomeOleo: item.nome,
  };

  const alvo = { fera: 'feras', morto_vivo: 'mortos que andam', oni: 'onis', monstro: 'monstros' }[item.oleoAlvo as string] ?? item.oleoAlvo;
  const msg = `Você passa ${item.nome.toLowerCase()} no gume, devagar, do talão à ponta. Contra ${alvo}, a lâmina morde mais pelas próximas três lutas.`;
  camp.cronica.push({ turno: camp.turno, texto: msg, tipo: 'sistema' });
  return { ok: true, mensagem: msg };
}

/**
 * Inicia o confronto decisivo contra o monstro de um contrato que esteja pronto.
 */
export function iniciarConfrontoContrato(
  camp: Campaign,
  contratoId: string,
  content: ContentBundle,
): { ok: boolean; mensagem: string; combateIniciado?: boolean } {
  const quadro = inicializarQuadroContratos(camp);
  const contrato = quadro.contratos[contratoId];
  if (!contrato) {
    return { ok: false, mensagem: 'Contrato não encontrado.' };
  }
  if (contrato.estado !== 'pronto_para_confronto') {
    return {
      ok: false,
      mensagem:
        contrato.estado === 'concluido'
          ? 'Este contrato já foi concluído e a besta abatida.'
          : 'Você precisa concluir a investigação de todas as pistas antes de encurralar a besta.',
    };
  }

  if (camp.localAtual !== contrato.localId) {
    return { ok: false, mensagem: `O covil fica ${nomeDoLugar(content, contrato.localId)}.` };
  }
  // Inicia o combate contra o monstro chefe
  iniciarCombate(content, camp, [contrato.criaturaId]);

  const msg = `Você segue as pistas até o covil de ${contrato.monstroNome}, ${nomeDoLugar(content, contrato.localId)}. Ele já sabe que você veio.`;
  camp.cronica.push({ turno: camp.turno, texto: msg, tipo: 'narracao' });
  return { ok: true, mensagem: msg, combateIniciado: true };
}
