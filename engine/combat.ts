// ARCANUM · Combate por turnos, resolvido 100% pela engine (GDD §16, §17).
import { registrarDesfechoBando } from './bandos';
import { registrarDesfechoCaravana } from './caravanas';
import { registrarSaidaNarrativa } from './contextoNarrativo';
import type {
  Campaign,
  ContentBundle,
  CombatState,
  CombatActor,
  Criatura,
  PerfilDano,
  AttrKey,
  MembroId,
  NPC,
} from './types';
import { probabilidade, calcularDano } from './resolution';
import { nextFloat, nextInt, pick } from './rng';
import { modificador, clampRecursos } from './character';
import { bonusDefesaEquip, armaEquipada, itemPorId } from './items';
import { periodoAtual, avancarPeriodos } from './time';
import { avancarMundo } from './mundo';
import { aplicarFerimentoOni, haAbrigoSolar, obterRival, registrarConfronto, VERSAO_COMBATE } from './kimetsu';
import { verificarDespertarNichirin } from './nichirin';
import type { RivalPersistente } from './kimetsuTypes';
import { atualizarAmeacas } from './continuidade';
import { npcPorId } from './elenco';
import { registrarMorteFamiliar } from './familia';
import { registrarMarco } from './memoria';
import { recolherDespojos } from './despojos';
import { artePorId } from './fusao';
import { processarSubidaDeNivel, concederDespertar } from './progresso';
import {
  absorveuOPrimeiroGolpe,
  bonusDeFoco,
  registrarFoco,
  multiplicadorDeArte,
  efeitoEspadachimAsora,
  bonusArqueiroAzusa,
  CLASSE_MESTRE_MARCIAL,
  CLASSE_LUTADOR,
  ehClasseLutador,
  danoMarcialDesarmado,
  tentativaQuebraDeEspada,
  bonificacaoNitenMusashi,
} from './classe';
import { multiplicadoresDeIdentidade } from './identidade';
import { fichaCombatente, inicializarProgressaoNpc, treinarNpc } from './progressaoNpc';
import { selarAlma, chimAlcancado } from './ascensao';
import { aplicarPressaoPosCombateMarca, bonusCombateMarca, despertarMarca, NIVEL_MINIMO_ONI_MARCA, temMarca } from './marca';
import { registrarFato } from './historiaViva';
import { processarMissoesVivas } from './missoesVivas';
import { calcularContexto } from './availability';
import { dominioDaArte, maestriaDe, registrarDemonstracao, treinar } from './aptidao';
import { ENTIDADES_CONTRATAVEIS, realizarContratoAlma } from './tsukimichi';

export function criaturaPorId(content: ContentBundle, id: string): Criatura | undefined {
  return content.criaturas.find((c) => c.id === id);
}

// Intensidade base por grau de arte (para dano/cura em combate, e para o
// cálculo de fusão de estilos em fusao.ts).
export function grauBase(grau: string): number {
  switch (grau) {
    case 'comum':
      return 2;
    case 'notavel':
      return 5;
    case 'rara':
      return 9;
    case 'proibida':
      return 10;
    case 'unica':
    case 'perdida':
      return 12;
    case 'mitica':
      return 16;
    default:
      return 4;
  }
}

// ── Lesões emergentes (amputação): não é um tipo de inimigo específico que
// causa isso — é o risco de qualquer combate feio. Um golpe severo contra
// quem já está quase caindo tem chance de arrancar um membro de vez.
// Permanente: sem cura mágica de volta, é cicatriz de verdade (GDD Sanidade
// · Corrupção). Tudo em cima do RNG determinístico da campanha — nada de
// Math.random() solto.
const MEMBROS: Record<MembroId, { nome: string; artigo: string; participio: string }> = {
  braco_esquerdo: { nome: 'braço esquerdo', artigo: 'o', participio: 'decepado' },
  braco_direito: { nome: 'braço direito', artigo: 'o', participio: 'decepado' },
  perna_esquerda: { nome: 'perna esquerda', artigo: 'a', participio: 'decepada' },
  perna_direita: { nome: 'perna direita', artigo: 'a', participio: 'decepada' },
};

function membrosDisponiveis(perdidos: MembroId[] | undefined): MembroId[] {
  const todos = Object.keys(MEMBROS) as MembroId[];
  const fora = new Set(perdidos ?? []);
  return todos.filter((m) => !fora.has(m));
}

// Penalidade mecânica de um membro perdido: braço custa precisão de golpe,
// perna custa a guarda/mobilidade.
export function penalidadePorMembro(membro: MembroId): { acerto: number; defesa: number } {
  return membro.startsWith('braco') ? { acerto: -4, defesa: 0 } : { acerto: 0, defesa: -3 };
}

// `anulada` vem do CHIM (ver engine/ascensao.ts): quando true, a penalidade
// não se aplica — não é o membro voltando, é a Ascensão anulando o que a
// mutilação custaria.
export function penalidadePorMembros(perdidos: MembroId[] | undefined, anulada = false): { acerto: number; defesa: number } {
  if (anulada) return { acerto: 0, defesa: 0 };
  return (perdidos ?? []).reduce(
    (acc, m) => {
      const d = penalidadePorMembro(m);
      return { acerto: acc.acerto + d.acerto, defesa: acc.defesa + d.defesa };
    },
    { acerto: 0, defesa: 0 },
  );
}

// Avalia, depois de um golpe que NÃO derrubou o alvo, se ele foi severo o
// bastante contra quem já está à beira de cair para arrancar um membro.
// Retorna a linha de log da lesão, ou undefined se nada aconteceu.
export function avaliarAmputacao(camp: Campaign, ator: CombatActor, danoRecebido: number): string | undefined {
  if (ator.ehAliado) return undefined;
  if (danoRecebido < 12) return undefined;
  if (ator.vida > ator.vidaMax * 0.3) return undefined; // só quando a guarda já quase quebrou
  if (ator.ehJogador && chimAlcancado(camp)) return undefined; // CHIM: nem a amputação acontece
  const disponiveis = membrosDisponiveis(ator.membrosPerdidos);
  if (disponiveis.length === 0) return undefined;
  const chance = Math.min(0.45, 0.12 + (danoRecebido - 12) * 0.01);
  if (nextFloat(camp.rng) >= chance) return undefined;

  const membro = pick(camp.rng, disponiveis);
  ator.membrosPerdidos = [...(ator.membrosPerdidos ?? []), membro];
  const pen = penalidadePorMembro(membro);
  ator.acerto += pen.acerto;
  ator.defesa += pen.defesa;

  if (ator.ehJogador) {
    const p = camp.personagem;
    p.membrosPerdidos = [...(p.membrosPerdidos ?? []), membro];
    if (!p.condicoes.includes('mutilado')) p.condicoes.push('mutilado');
    p.cicatrizes.push(`perdeu ${MEMBROS[membro].nome} em combate`);
  }

  const info = MEMBROS[membro];
  return `ALERTA: ${ator.nome} teve ${info.artigo} ${info.nome} ${info.participio} pelo golpe!`;
}

// Acerto de combate do jogador (escala comparável à defesa das criaturas).
// Defesa do jogador. Estava embutida em iniciarCombate, o que impedia
// qualquer ferramenta de medir o personagem fora de um combate aberto.
//
// Teto do nivel na defesa. Vale +10 no maximo (30/3), contra os +15 que o
// acerto ganha — de proposito: e' mais facil aprender a bater do que ficar
// impossivel de acertar.
export const TETO_NIVEL_DEFESA = 30;
export function defesaJogador(content: ContentBundle, camp: Campaign): number {
  const p = camp.personagem;
  // Tres fontes distintas, de proposito: corpo (atributos + nivel), tecnica
  // (maestria, que e' onde mora a aparadura) e equipamento.
  // O nivel entra com teto, igual ao acerto. Sem teto, um personagem muito
  // avancado simplesmente para de ser acertado por qualquer coisa do mundo —
  // e um mundo que nao acerta nao ameaca. Corpo treinado tem limite; quem
  // passa dele passa por tecnica (maestria) e equipamento, que nao tem teto.
  const base = 10 + modificador(p.atributos.precisao) + modificador(p.atributos.resiliencia)
    + bonusDefesaEquip(content, p)
    + Math.floor(Math.min(TETO_NIVEL_DEFESA, p.nivel) / 3)
    + Math.floor(maestriaDe(camp, 'espada') / 18);
  // Bônus de Sakai: modos supressao, fortalecimento, sentidos, barreira_fisica, barreira_magica, magia ou cura elevam a defesa
  const sakai = p.sakai;
  let sakaiBonus = 0;
  if (sakai?.modoAtivo === 'barreira_fisica') {
    sakaiBonus = 14 + (sakai.nivel ?? 1) * 3;
  } else if (sakai?.modoAtivo === 'barreira_magica') {
    sakaiBonus = 12 + (sakai.nivel ?? 1) * 3;
  } else if (sakai?.modoAtivo === 'supressao') {
    sakaiBonus = 8 + (sakai.nivel ?? 1) * 2;
  } else if (sakai?.modoAtivo === 'fortalecimento') {
    sakaiBonus = 6 + (sakai.nivel ?? 1) * 2;
  } else if (sakai?.modoAtivo === 'sentidos' || sakai?.modoAtivo === 'audicao') {
    sakaiBonus = 4 + (sakai.nivel ?? 1) * 2;
  } else if (sakai?.modoAtivo === 'magia') {
    sakaiBonus = 4;
  } else if (sakai?.modoAtivo === 'cura') {
    sakaiBonus = 2;
  }
  const bonusCenarioDef = camp.cenarioId === 'tsukimichi' ? 14 : 0;
  return base + sakaiBonus + bonusCenarioDef;
}

// Janela de critico: a fatia dos acertos que sai limpa. Aproveitar a abertura
// e' tecnica, entao quem cresce aqui e' a maestria, nao o nivel.
// Janela de critico: a fatia dos acertos que sai limpa. Aproveitar a abertura
// e' tecnica, somando maestria e propriedades criticas da arma empunhada.
export function janelaCriticaJogador(camp: Campaign, content?: ContentBundle): number {
  const p = camp.personagem;
  let bonusArma = 0;
  if (content) {
    const arma = armaEquipada(content, p);
    bonusArma = arma?.bonusCritico ?? 0;
  }
  return Math.min(0.60, 0.25 + bonusArma + maestriaDe(camp, 'espada') / 500);
}

export function acertoJogador(content: ContentBundle, camp: Campaign): number {
  const p = camp.personagem;
  const arma = armaEquipada(content, p);
  const attr: AttrKey = arma?.atributoAtaque ?? 'fisico';
  // A precisao satura. Antes ela crescia +1 por nivel sem contrapartida, e a
  // partir de uns 20 niveis o jogador acertava 98% dos golpes: o combate
  // deixava de ter erro, e sem erro nao ha luta, so aritmetica. Passado o
  // teto, quem continua crescendo e' dano, vida e defesa.
  const TETO_NIVEL_ACERTO = 15;
  const base = 10 + Math.min(TETO_NIVEL_ACERTO, p.nivel) + modificador(p.atributos[attr]) + (arma ? 2 : 0)
    + Math.floor(maestriaDe(camp, 'espada') / 25);
  // Bônus de Sakai: modos sentidos, audicao, percepcao, magia, destruicao ou fortalecimento elevam o acerto
  const sakai = p.sakai;
  let sakaiBonus = 0;
  if (sakai?.modoAtivo === 'sentidos') {
    sakaiBonus = 14 + (sakai.nivel ?? 1) * 2;
  } else if (sakai?.modoAtivo === 'audicao') {
    sakaiBonus = 12 + (sakai.nivel ?? 1) * 2;
  } else if (sakai?.modoAtivo === 'percepcao') {
    sakaiBonus = 10 + (sakai.nivel ?? 1) * 2;
  } else if (sakai?.modoAtivo === 'magia') {
    sakaiBonus = 8 + (sakai.nivel ?? 1) * 2;
  } else if (sakai?.modoAtivo === 'destruicao') {
    sakaiBonus = 5;
  } else if (sakai?.modoAtivo === 'fortalecimento') {
    sakaiBonus = 3 + (sakai.nivel ?? 1);
  }
  const bonusCenarioAcerto = camp.cenarioId === 'tsukimichi' ? 10 : 0;
  return base + sakaiBonus + bonusCenarioAcerto;
}

// Dano do jogador. A arma define o molde básico, mas o guerreiro a potencializa:
// cada ponto de modificador do atributo amplia o rendimento da arma em +10% e
// estabiliza a dispersão para evitar golpes acidentalmente fracos.
export function danoJogador(content: ContentBundle, camp: Campaign): PerfilDano {
  const p = camp.personagem;
  const arma = armaEquipada(content, p);
  const ehDesarmadoOuMarcial =
    !arma ||
    arma.tipoArma === 'desarmado' ||
    arma.id === 'punho_de_ferro' ||
    arma.id === 'faixas_marciais' ||
    arma.id.startsWith('manoplas');

  let perfil: PerfilDano;
  const ehLutador = ehClasseLutador(camp);
  if (ehLutador && ehDesarmadoOuMarcial) {
    const marcial = danoMarcialDesarmado(camp, {
      id: 'jogador',
      nome: p.nome,
      ehJogador: true,
      vida: p.recursos.vida,
      vidaMax: p.recursosMax.vida,
      defesa: 10,
      acerto: 10,
      condicoes: [],
    });
    const armaBase = arma?.dano?.base ?? 0;
    perfil = {
      base: marcial.base + (armaBase > 8 ? armaBase - 8 : 0),
      dispersao: marcial.dispersao,
      tipo: 'contusão',
    };
  } else {
    perfil = arma?.dano ?? { base: 3, dispersao: 0.4, tipo: 'desarmado' };
  }

  const attr: AttrKey = arma?.atributoAtaque ?? (ehLutador ? 'precisao' : 'fisico');
  const bonusAfiacao = (arma?.afiacao && arma.afiacao.cargas > 0) ? arma.afiacao.bonusDano : 0;
  const modAttr = modificador(p.atributos[attr]);
  // Cada ponto de modificador do atributo escala o rendimento da lâmina em +10%
  const escalaAttr = Math.max(0, modAttr) * 0.10;
  const eficiencia = 1 + maestriaDe(camp, 'espada') / 200 + escalaAttr;
  const base = (perfil.base + bonusAfiacao) * eficiencia
    + Math.max(0, modAttr)
    + Math.floor(p.nivel / 3);

  // Atributo elevado estabiliza a pegada e reduz a dispersão negativa (piso mais firme)
  const dispersaoEstabilizada = Math.max(0.12, perfil.dispersao - Math.max(0, modAttr) * 0.025);

  // Bônus de impacto muscular / compressão do Kai (Sakai)
  const sakai = p.sakai;
  let bonusDanoSakai = 0;
  if (sakai?.modoAtivo === 'destruicao') {
    bonusDanoSakai = 15 + (sakai.nivel ?? 1) * 3;
  } else if (sakai?.modoAtivo === 'magia') {
    bonusDanoSakai = 14 + (sakai.nivel ?? 1) * 3;
  } else if (sakai?.modoAtivo === 'fortalecimento') {
    bonusDanoSakai = 12 + (sakai.nivel ?? 1) * 4;
  } else if (sakai?.modoAtivo === 'sentidos' || sakai?.modoAtivo === 'audicao') {
    bonusDanoSakai = 3 + (sakai.nivel ?? 1);
  }

  const bonusCenarioDano = camp.cenarioId === 'tsukimichi' ? 28 : 0;
  return {
    ...perfil,
    dispersao: dispersaoEstabilizada,
    base: (base + bonusDanoSakai + bonusCenarioDano) * multiplicadoresDeIdentidade(camp).dano,
  };
}

function gerarBarkReencontro(r: RivalPersistente): string {
  if (r.cheatDeath?.vezes && r.cheatDeath.vezes > 0) {
    return '— Você achou que tinha me matado?! O sangue corre mais fundo que sua lâmina!';
  }
  if (r.tracos?.odios?.includes('furia_vinganca_sangue')) {
    return '— Você matou quem lutava ao meu lado! Vou arrancar suas entranhas por isso!';
  }
  if (r.traumaJogador) {
    return '— Você... de novo não... mas desta vez eu não vou quebrar!';
  }
  if (r.memoria.at(-1)?.resultado === 'fuga') {
    return '— Fugiu como um cão da última vez, e agora volta achando que algo mudou?!';
  }
  if (r.vitorias > 0 && r.memoria.at(-1)?.resultado === 'derrota') {
    return '— Já derrubei você uma vez. Vou saborear sua queda novamente!';
  }
  if (r.cicatrizes?.some(c => c.includes('fogo') || c.includes('sol') || c.includes('hinokami'))) {
    return '— Minha carne ainda queima onde seu golpe passou... Vou apagar essa vergonha com seu sangue!';
  }
  return '— Finalmente nos encontramos de novo. Nossas contas ainda não foram pagas!';
}

export function iniciarCombate(
  content: ContentBundle,
  camp: Campaign,
  criaturaIds: string[],
  rivalAlvo?: string,
): CombatState {
  if (camp.combate && !camp.combate.terminado) return camp.combate;
  const p = camp.personagem;
  // Amputações de combates anteriores são permanentes: o jogador entra na
  // luta seguinte já com a penalidade, não só nesta.
  const penMembros = penalidadePorMembros(p.membrosPerdidos, chimAlcancado(camp));
  const arma = armaEquipada(content, p);
  if (arma) {
    verificarDespertarNichirin(content, camp, arma);
  }
  const armaFinal = armaEquipada(content, p) ?? arma;
  const jogador: CombatActor = {
    id: 'jogador',
    nome: p.nome,
    ehJogador: true,
    vida: p.recursos.vida,
    vidaMax: p.recursosMax.vida,
    defesa: defesaJogador(content, camp) + penMembros.defesa + bonusCombateMarca(camp).defesa,
    janelaCritica: janelaCriticaJogador(camp, content),
    multiplicadorCritico: armaFinal?.multiplicadorCritico ?? 1.75,
    efeitoPassivoArma: armaFinal?.efeitoPassivo,
    corNichirin: armaFinal?.corNichirin,
    nomeCorNichirin: armaFinal?.corNichirinNome,
    acerto: acertoJogador(content, camp) + penMembros.acerto + bonusCombateMarca(camp).acerto,
    dano: danoJogador(content, camp),
    condicoes: [],
    membrosPerdidos: [...(p.membrosPerdidos ?? [])],
  };

  const aliados: CombatActor[] = (camp.grupo ?? []).map(npcId => npcPorId(content, camp, npcId))
    .filter((n): n is NonNullable<typeof n> => !!n?.combatente && camp.npcState[n.id]?.vivo)
    .map(n => {
      inicializarProgressaoNpc(camp, n);
      const ficha = fichaCombatente(camp, n)!;
      return {
        id: `aliado_${n.id}`, nome: n.nome, ehJogador: false, ehAliado: true, npcId: n.id,
        vida: Math.min(ficha.vida, camp.npcState[n.id].vida ?? ficha.vida), vidaMax: ficha.vida,
        defesa: ficha.defesa, acerto: ficha.acerto, dano: ficha.dano, condicoes: [], tatico: {},
      };
    });

  const ids = [...criaturaIds];
  for (const cid of criaturaIds) {
    const parceiro = criaturaPorId(content, cid)?.perfilOni?.parceiro;
    if (parceiro && !ids.includes(parceiro)) ids.push(parceiro);
  }
  const ocupados: string[] = [];
  const vistos = new Set<string>();
  const inimigos: CombatActor[] = ids.filter(cid => {
    const c = criaturaPorId(content, cid);
    if (!c) return false;
    if (content.desafios?.some(d => d.criaturaId === cid && camp.flags[`desafio.concluido.${d.id}`])) return false;
    const unico = c.perfilOni?.identidade;
    if (unico && (vistos.has(unico) || camp.flags[`matou.${cid}`] || camp.kimetsu?.rivais[unico]?.vivo === false)) return false;
    if (unico) vistos.add(unico);
    return true;
  }).map((cid, i) => {
    const c = criaturaPorId(content, cid)!;
    const rival = obterRival(camp, c, ocupados, camp.localAtual, rivalAlvo);
    if (rival) ocupados.push(rival.id);
    const penalidadeCicatriz = Math.min(4, (rival?.cicatrizes?.length ?? 0));
    const penalidadeTrauma = rival?.traumaJogador ? 2 : 0;
    const bonusVinganca = rival?.tracos?.odios?.includes('furia_vinganca_sangue') ? 3 : 0;
    const nomeFinal = rival?.titulo ? `${rival.nome}, ${rival.titulo}` : (rival?.nome ?? c.nome);
    return {
      id: `inim_${i}_${cid}`,
      nome: nomeFinal,
      ehJogador: false,
      vida: rival?.vida ?? c.vida,
      vidaMax: c.vida,
      defesa: Math.max(1, c.defesa + (rival?.evolucao?.nivel ?? 0) - penalidadeCicatriz - penalidadeTrauma),
      acerto: Math.max(1, c.acerto + (rival?.evolucao?.nivel ?? 0) - Math.floor(penalidadeCicatriz / 2) - penalidadeTrauma + bonusVinganca),
      dano: c.dano,
      criaturaId: cid,
      nivelGuilda: c.nivelGuilda ?? (c.nivel >= 12 ? 1000 : c.nivel * 70),
      condicoes: [],
      oni: c.oni,
      imuneLuz: c.imuneLuz,
      rivalId: rival?.id,
      perfilOni: c.perfilOni,
      tatico: {},
    };
  });

  const atores = [jogador, ...aliados, ...inimigos];
  // Iniciativa: um sorteio por ator, maior age primeiro.
  const ini = new Map<string, number>();
  for (const a of atores) ini.set(a.id, nextFloat(camp.rng) + (a.ehJogador ? modificador(p.atributos.precisao) * 0.05 : 0));
  const ordem = [...atores].sort((a, b) => (ini.get(b.id) ?? 0) - (ini.get(a.id) ?? 0)).map((a) => a.id);

  const moral = Math.round(inimigos.reduce((s, a) => s + (criaturaPorId(content, a.criaturaId!)?.moralBase ?? 60), 0) / Math.max(1, inimigos.length));

  const state: CombatState = {
    versaoRegras: VERSAO_COMBATE,
    ambiente: { abrigoSolar: haAbrigoSolar(content, camp.localAtual) },
    rodada: 1,
    atores,
    ordem,
    turno: 0,
    moralInimiga: moral,
    terminado: false,
    log: [`O combate começa. ${inimigos.map((i) => i.nome).join(', ')} contra você.`],
    fase: 1,
  };


  // ── Aura Esmagadora de Presença ──────────────────────────────────────────
  // Quando o protagonista tem servas do Círculo Central ativas (Tomoe, Mio,
  // Shiki etc.), o Sakai desbloqueado, ou está no cenário Tsukimichi, inimigos de baixo escalão (nivelGuilda
  // ≤ 600 em Tsukimichi ou ≤ 400 sem chefe) sentem o peso do mana transcendental
  // e entram em colapso moral imediato, fugindo sem lutar.
  const temCirculoCentral = !!(camp.asora?.desbloqueado &&
    Object.values(camp.asora.contratos ?? {}).some((c) => c.ativaNoGrupo));
  const temSakai = !!(camp.personagem.sakai?.desbloqueado);

  if (temCirculoCentral || temSakai) {
    const tetoAura = camp.cenarioId === 'tsukimichi' ? 600 : 400;
    const todosFracos = inimigos.every((ator) => {
      const criatura = criaturaPorId(content, ator.criaturaId ?? '');
      if (!criatura) return true;
      if (criatura.chefe) return false; // Chefes resistem à aura
      const ng = criatura.nivelGuilda ?? (criatura.nivel ? criatura.nivel * 70 : 0);
      // Sem nivelGuilda: criatura comum de Vaelhorn, sempre considerada fraca perante a aura
      return ng === 0 || ng <= tetoAura;
    });

    if (todosFracos && inimigos.length > 0) {
      const auraDesc = temCirculoCentral
        ? `A presença esmagadora do Mestre e de suas servas do Círculo Central faz o ar tremer. ${inimigos.map((i) => i.nome).join(', ')} sente o peso de um mana que não deveria existir e entra em colapso total de moral.`
        : `O mana incomensurável do Sem-Bênção transpira pela pele e distorce a luz ao redor. ${inimigos.map((i) => i.nome).join(', ')} paralisa de terror diante de um poder avassalador que desafia a compreensão.`;
      state.log.push(auraDesc);
      state.moralInimiga = 0;
    }
  }

  camp.combate = state;
  for (const a of inimigos) {
    const r = a.rivalId && camp.kimetsu?.rivais[a.rivalId];
    if (r && r.reencontros > 0) {
      const msgCicatriz = r.cicatrizes && r.cicatrizes.length > 0 ? ` Ele traz cicatrizes do embate anterior: ${r.cicatrizes.map(c => c.replace(/_/g, ' ')).join(', ')}.` : '';
      const bark = gerarBarkReencontro(r);
      r.ultimoBark = bark;
      state.log.push(`${a.nome} reconhece você: ${r.reencontros} confronto(s) anterior(es).${msgCicatriz}`);
      state.log.push(`${a.nome}: "${bark}"`);
      if (r.tracos?.odios?.includes('furia_vinganca_sangue')) {
        state.log.push(`${a.nome} arde em fúria vingativa pela morte do parceiro!`);
      }
      if (r.traumaJogador) {
        state.log.push(`${a.nome} hesita ao cruzar olhares com você, tremendo sob o trauma da humilhação.`);
      }
    }
  }
  if (inimigos.length === 0) { encerrar(camp, 'vitoria', content); return state; }
  // Se algum inimigo age antes do jogador, processa até chegar a vez do jogador.
  avancarAteJogador(content, camp);
  return camp.combate!;
}

function vivo(a: CombatActor): boolean {
  return a.vida > 0 && !a.retirado && !a.capturado;
}

function inimigosVivos(s: CombatState): CombatActor[] {
  return s.atores.filter((a) => !a.ehJogador && !a.ehAliado && vivo(a));
}

export function jogadorAtor(s: CombatState): CombatActor {
  return s.atores.find((a) => a.ehJogador)!;
}

// Contra-golpe do Bastião: atinge o agressor de verdade — o ataque inimigo às
// vezes chega numa cópia do ator com acerto ajustado — e pancada não mata oni.
function contraGolpe(camp: Campaign, atacante: CombatActor, dano: number): void {
  const real = camp.combate?.atores.find((a) => a.id === atacante.id) ?? atacante;
  real.vida = Math.max(real.oni ? 1 : 0, real.vida - dano);
  atacante.vida = real.vida;
}

function resolverAtaque(
  camp: Campaign,
  atacante: CombatActor,
  alvo: CombatActor,
  perfil: PerfilDano,
  contraOni = false,
): string {
  if (atacante.armaQuebrada) {
    perfil = { base: 3, dispersao: 0.4, tipo: 'desarmado' };
  }

  let notaQuebra = '';
  const podeQuebrarArma =
    alvo.ehJogador &&
    !atacante.ehJogador &&
    !atacante.armaQuebrada &&
    !atacante.oni &&
    !atacante.criaturaId?.startsWith('besta_') &&
    (ehClasseLutador(camp) ||
      camp.personagem.equipado.arma?.startsWith('manoplas') ||
      (camp.personagem.itensForjados?.some((i) => i.id === camp.personagem.equipado.arma && i.quebraArmas) ?? false));

  if (podeQuebrarArma) {
    const rollQuebra = Math.floor(nextFloat(camp.rng) * 20) + 1;
    const tentativa = tentativaQuebraDeEspada(camp, alvo, atacante, rollQuebra);
    if (tentativa.quebrou && tentativa.mensagem) {
      camp.combate?.log.push(tentativa.mensagem);
      atacante.dano = { base: 3, dispersao: 0.4, tipo: 'desarmado' };
      perfil = { base: 3, dispersao: 0.4, tipo: 'desarmado' };
      notaQuebra = ' [Lâmina Quebrada: a espada do adversário foi partida ao meio!]';
    }
  }

  const evasao = (alvo.tatico?.esquiva ?? 0) > 0;
  const kyudo = bonusArqueiroAzusa(camp, atacante, alvo);
  const niten = bonificacaoNitenMusashi(camp, atacante);
  const anulaCobertura = kyudo.anulaCobertura || atacante.efeitoPassivoArma === 'disparo_perfurante';
  const defCobertura = anulaCobertura ? 0 : alvo.posicao === 'cobertura' ? 3 : 0;
  const defEfetiva =
    alvo.defesa +
    (alvo.defendendo ? 4 : 0) +
    (evasao ? 5 : 0) +
    defCobertura +
    (alvo.posicao === 'flanco' ? -2 : 0);
  if (evasao) alvo.tatico!.esquiva!--;
  const posicao =
    atacante.posicao === 'flanco'
      ? 3
      : anulaCobertura
        ? 0
        : atacante.posicao === 'cobertura'
          ? -2
          : 0;
  const foco = bonusDeFoco(camp, atacante, alvo.id);
  let defPenetracao = niten.penetracaoArmadura;
  if (atacante.efeitoPassivoArma === 'rachar_armadura') {
    defPenetracao = Math.max(defPenetracao, 0.5);
  }
  const defAposPenetracao = Math.max(0, Math.round(defEfetiva * (1 - defPenetracao)));
  const p = probabilidade(atacante.acerto + posicao + foco + kyudo.bonusAcerto + niten.bonusAcerto, defAposPenetracao, 4);
  const r = nextFloat(camp.rng);
  if (r >= p) {
    registrarFoco(camp, atacante, alvo.id, false);
    let notaContraAtaque = '';
    if (alvo.efeitoPassivoArma === 'contra_ataque_rocha' && atacante.vida > 0) {
      contraGolpe(camp, atacante, 7);
      notaContraAtaque = ` O Bastião de Halvet devolve o golpe: 7 de dano contundente em ${atacante.nome}.`;
    }
    return `${atacante.nome} ataca ${alvo.nome} e erra.${notaQuebra}${notaContraAtaque}`;
  }
  registrarFoco(camp, atacante, alvo.id, true);
  const efeitoAsora = efeitoEspadachimAsora(camp, atacante, alvo.id);
  const crit = r < p * ((atacante.janelaCritica ?? 0.25) + niten.bonusCritico) || efeitoAsora.ruptura;
  const multCrit = atacante.multiplicadorCritico ?? 1.75;
  const dano = calcularDano(camp.rng, perfil, crit, multCrit);
  dano.valor += efeitoAsora.bonusDano;

  let notaOleo = '';
  const oleo = atacante.oleoAtivo ?? camp.contratosMonstro?.oleoAtivo;
  if (atacante.ehJogador && oleo && oleo.combatesRestantes > 0) {
    const ehOni = alvo.oni || alvo.criaturaId?.includes('oni');
    const ehFera = alvo.criaturaId?.includes('lobo') || alvo.criaturaId?.includes('urso') || alvo.criaturaId?.includes('besta');
    const ehMortoVivo = alvo.criaturaId?.includes('carnical') || alvo.criaturaId?.includes('esqueleto') || alvo.criaturaId?.includes('zumbi');
    const ehMonstro = alvo.criaturaId?.includes('gargula') || alvo.criaturaId?.includes('quimera') || alvo.criaturaId?.includes('abissal');

    let combina = false;
    if (oleo.tipoAlvo === 'oni' && ehOni) combina = true;
    if (oleo.tipoAlvo === 'fera' && ehFera) combina = true;
    if (oleo.tipoAlvo === 'morto_vivo' && ehMortoVivo) combina = true;
    if (oleo.tipoAlvo === 'monstro' && ehMonstro) combina = true;

    if (combina) {
      dano.valor += oleo.bonusDano;
      notaOleo = ` [Óleo Especializado: +${oleo.bonusDano} de dano contra ${oleo.tipoAlvo}!]`;
    }
  }
  if ((alvo.tatico?.guarda ?? 0) > 0) {
    if (efeitoAsora.ignoraGuarda) {
      alvo.tatico!.guarda = 0;
    } else {
      dano.valor = Math.max(1, Math.round(dano.valor * 0.35));
      alvo.tatico!.guarda!--;
    }
  }
  // Guardiao: o primeiro golpe de cada combate nao passa (engine/classe.ts).
  if (dano.valor > 0 && absorveuOPrimeiroGolpe(camp, alvo)) {
    return `${atacante.nome} acerta ${alvo.nome} — e o golpe morre na guarda. O primeiro sempre morre.`;
  }

  // ── Manto Passivo de Mana & Vulnerabilidade Canônica de Tsukimichi ────────
  let notaMantoTsukimichi = '';
  if (alvo.ehJogador && camp.cenarioId === 'tsukimichi') {
    const nivelGuildaAtacante = atacante.nivelGuilda ?? 0;
    const ehNivel1000 = nivelGuildaAtacante >= 900;
    const sakai = camp.personagem.sakai;
    const temBarreiraKai = sakai?.modoAtivo === 'barreira_fisica' || sakai?.modoAtivo === 'barreira_magica';
    const temProtecaoKai = temBarreiraKai || sakai?.modoAtivo === 'fortalecimento' || sakai?.modoAtivo === 'supressao';
    const emGuarda = alvo.defendendo || (alvo.tatico?.guarda ?? 0) > 0 || evasao || temProtecaoKai;

    if (!ehNivel1000) {
      // Inimigos comuns ou sub-ápice da Wasteland / Tsige (< NvG 900)
      if (temBarreiraKai) {
        return `${atacante.nome} ataca ${alvo.nome} — o golpe colide contra a Barreira do Kai e se desfaz sem causar um único arranhão!`;
      }
      // O manto passivo e a musculatura hiperdensa da Terra absorvem quase todo o impacto
      const danoAbsorvido = Math.floor(dano.valor * 0.85);
      dano.valor = Math.max(1, Math.min(6, dano.valor - danoAbsorvido));
      notaMantoTsukimichi = ` [Manto Passivo de Mana: ${danoAbsorvido} de dano absorvido pelo corpo hiperdenso da Terra]`;
    } else {
      // Entidade Ápice Nível 1.000+ (Sofia Bulga, Mitsurugi, Shen, Mio, Suzaku, General Io)
      if (!emGuarda && (crit || r < p * 0.5)) {
        // Exatamente a situação canônica descrita: sem nada, sem desvio, sem barreira: o golpe perfura ponto vital (garganta/olho)
        dano.valor = Math.round(dano.valor * 2.2 + 25);
        notaMantoTsukimichi = ` [⚠️ PERFURAÇÃO CRÍTICA EM PONTO VITAL! Desprotegido e sem desvio, o golpe de Nível 1.000+ perfura rente à garganta/olho antes que o mana responda!]`;
      } else if (emGuarda) {
        // Com guarda, esquiva ou barreira ativa: o choque colossal é contido
        dano.valor = Math.max(8, Math.round(dano.valor * 0.45));
        notaMantoTsukimichi = ` [Impacto Contido: sua guarda e reflexos de mana contêm a violência do golpe divino]`;
      }
    }
  }

  // Efeitos passivos das armas aplicados ao causar dano
  let notaPassiva = '';
  if (atacante.efeitoPassivoArma === 'chamas_solares' && dano.valor > 0) {
    (alvo.tatico ??= {}).queimadura = Math.max(alvo.tatico?.queimadura ?? 0, 3);
    notaPassiva += ' [Chamas Solares: fogo primordial queima a carne oponente!]';
  } else if (atacante.efeitoPassivoArma === 'sangramento_abissal' && dano.valor > 0) {
    (alvo.tatico ??= {}).sangramento = Math.max(alvo.tatico?.sangramento ?? 0, 3);
    notaPassiva += ' [Presa da Maré: barbelas dilaceram a carne profunda!]';
  } else if (atacante.efeitoPassivoArma === 'rachar_armadura' && dano.valor > 0) {
    if ((alvo.tatico?.guarda ?? 0) > 0) alvo.tatico!.guarda = 0;
    notaPassiva += ' [Quebra-Rocha: lâmina maciça racha a blindagem do inimigo!]';
  } else if (atacante.efeitoPassivoArma === 'peso_imperial' && dano.valor > 0) {
    if ((alvo.tatico?.guarda ?? 0) > 0) alvo.tatico!.guarda = 0;
    if (!alvo.tatico?.abalado) {
      (alvo.tatico ??= {}).abalado = true;
      alvo.acerto = Math.max(2, alvo.acerto - 2);
      notaPassiva += ' [Presença Imperial: o peso da lâmina abala o inimigo (-2 acerto)]';
    }
  } else if (atacante.efeitoPassivoArma === 'execucao_sombria' && dano.valor > 0) {
    if (alvo.vidaMax > 0 && alvo.vida / alvo.vidaMax <= 0.35) {
      dano.valor = Math.round(dano.valor * 1.5);
      notaPassiva += ' [Execução Sombria: golpe fulminante em ponto vital vulnerável (+50% dano)!]';
    }
  } else if (atacante.efeitoPassivoArma === 'disparo_perfurante' && crit && dano.valor > 0) {
    (alvo.tatico ??= {}).frio = Math.max(alvo.tatico?.frio ?? 0, 1);
    notaPassiva += ' [Trovão Celestial: disparo abala a postura do alvo!]';
  }

  // Efeitos e Afinidades Cromáticas das Lâminas Nichirin (Kimetsu no Yaiba)
  if (atacante.corNichirin && dano.valor > 0) {
    if (atacante.corNichirin === 'preta') {
      if (alvo.oni) {
        dano.valor = Math.round(dano.valor * 1.15);
        (alvo.tatico ??= {}).queimadura = Math.max(alvo.tatico?.queimadura ?? 0, 3);
        notaPassiva += ' [Nichirin Negra: brasa solar pura incinera a regeneração das trevas (+15% dano)!]';
      }
    } else if (atacante.corNichirin === 'azul') {
      if (atacante.ehJogador && camp.personagem.recursos.vigor !== undefined) {
        const vMax = camp.personagem.recursosMax.vigor ?? 20;
        camp.personagem.recursos.vigor = Math.min(vMax, camp.personagem.recursos.vigor + 1);
        notaPassiva += ' [Nichirin Azul: fluidez da maré restaura 1 de vigor!]';
      }
    } else if (atacante.corNichirin === 'vermelha') {
      (alvo.tatico ??= {}).queimadura = Math.max(alvo.tatico?.queimadura ?? 0, 2);
      notaPassiva += ' [Nichirin Carmesim: calor da forja abrasa o oponente!]';
    } else if (atacante.corNichirin === 'verde') {
      const guardaAtual = alvo.tatico?.guarda ?? 0;
      if (guardaAtual > 0) {
        (alvo.tatico ??= {}).guarda = Math.max(0, guardaAtual - 6);
        notaPassiva += ' [Nichirin Verde: vendaval tempestuoso fatia a guarda!]';
      }
    } else if (atacante.corNichirin === 'amarela' && crit) {
      notaPassiva += ' [Nichirin Dourada: centelha do trovão estala com violência no ponto vital!]';
    } else if (atacante.corNichirin === 'lavanda') {
      notaPassiva += ' [Nichirin Lavanda: estocada precisa transpassa a blindagem!]';
    }
  }

  // Lâmina Carmesim: o calor queima o sangue de oni e segura a regeneração.
  if (alvo.oni && dano.valor > 0 && (atacante.laminaCarmesimAte ?? 0) >= (camp.combate?.rodada ?? 0)) {
    alvo.imuneRegenTurnos = Math.max(alvo.imuneRegenTurnos ?? 0, 2);
    notaPassiva += ' A lâmina rubra queima o sangue de oni: a carne não se refaz.';
  }

  if (alvo.corNichirin === 'cinza' && dano.valor > 0) {
    dano.valor = Math.max(1, dano.valor - 2);
    notaPassiva += ' [Nichirin de Pedra: solidez da rocha dissipa o impacto (-2 dano)!]';
  }

  if (alvo.efeitoPassivoArma === 'contra_ataque_rocha' && (alvo.defendendo || (alvo.tatico?.guarda ?? 0) > 0) && atacante.vida > 0) {
    contraGolpe(camp, atacante, 7);
    notaPassiva += ` O Bastião de Halvet devolve o golpe: 7 de dano contundente em ${atacante.nome}.`;
  }

  alvo.vida = Math.max(0, alvo.vida - dano.valor);
  aplicarFerimentoOni(camp, alvo, contraOni);
  const submissaoTsukimichi = camp.cenarioId === 'tsukimichi' && alvo.criaturaId && alvo.criaturaId in ENTIDADES_CONTRATAVEIS;
  if (submissaoTsukimichi && alvo.vida <= 0) {
    // Ilusões e reforços invocados pela besta primordial dissipam-se de imediato
    for (const outro of (camp.combate?.atores ?? [])) {
      if (outro.id !== alvo.id && !outro.ehJogador && !outro.ehAliado && outro.id.startsWith('reforco_')) {
        outro.vida = 0;
      }
    }
  }
  const morte = alvo.vida <= 0
    ? submissaoTsukimichi
      ? ` ${alvo.nome} cai de joelhos, exausto e subjugado pelo seu oceano imensurável de mana!`
      : ` ${alvo.nome} cai.`
    : '';
  let notaVeneno = '';
  const armaId = camp.personagem.equipado.arma;
  const armaEquip = camp.personagem.itensForjados?.find(i => i.id === armaId);
  const ehVenenosa = atacante.ehJogador && (armaEquip?.propriedadesEspeciais?.includes('venenosa') || false);
  if (ehVenenosa && dano.valor > 0) {
    (alvo.tatico ??= {}).veneno = Math.max(alvo.tatico?.veneno ?? 0, 3);
    if (!alvo.condicoes.includes('envenenado')) {
      alvo.condicoes.push('envenenado');
    }
    notaVeneno = ' [Peçonha: lâmina inocula veneno!]';
  }
  const lesao = alvo.vida > 0 ? avaliarAmputacao(camp, alvo, dano.valor) : undefined;
  const notaRuptura = efeitoAsora.ruptura ? ' [Ruptura de Asora: o corte fatiou a guarda!]' : '';
  // Ordinary Nichirin enables finishing; suppression requires a separate effect.
  let notaOni = '';
  if (alvo.vida > 0 && alvo.oni && contraOni) {
    notaOni = ` Nichirin pode finalizar esse oni quando sua postura ceder.`;
  }
  const tagCrit = crit ? ' [crítico]' : '';
  const verboAcerto = `${atacante.nome} acerta ${alvo.nome}${crit ? ' em cheio' : ''}`;

  return `${verboAcerto} — ${dano.valor} de dano ${dano.tipo}.${tagCrit}${notaQuebra}${notaOleo}${notaRuptura}${notaVeneno}${notaPassiva}${notaMantoTsukimichi}${morte}${lesao ? ` ${lesao}` : ''}${notaOni}`;
}

// ── Ações do jogador ────────────────────────────────────────────────
export function jogadorAtaca(content: ContentBundle, camp: Campaign, alvoId: string): void {
  const s = camp.combate;
  if (!s || s.terminado) return;
  const jog = jogadorAtor(s);
  const alvo = s.atores.find((a) => a.id === alvoId) ?? s.atores.find((a) => a.criaturaId === alvoId);
  if (!alvo || alvo.ehJogador || alvo.ehAliado || !vivo(alvo)) return;
  if (!podeAgir(camp)) return;
  jog.defendendo = false;
  const contraOni = !!armaEquipada(content, camp.personagem)?.contraOni;
  s.log.push(resolverAtaque(camp, jog, alvo, jog.dano ?? danoJogador(content, camp), contraOni));
  depoisDaAcaoDoJogador(content, camp);
}

export function jogadorDefende(content: ContentBundle, camp: Campaign): void {
  const s = camp.combate;
  if (!s || s.terminado) return;
  if (!podeAgir(camp)) return;
  jogadorAtor(s).defendendo = true;
  s.log.push(`Você firma a guarda.`);
  depoisDaAcaoDoJogador(content, camp);
}

export function jogadorConjura(
  content: ContentBundle,
  camp: Campaign,
  arteId: string,
  alvoId?: string,
): { ok: boolean; motivo?: string } {
  const s = camp.combate;
  if (!s || s.terminado) return { ok: false, motivo: 'sem combate' };
  const p = camp.personagem;
  if (!p.artesConhecidas.includes(arteId)) return { ok: false, motivo: 'você não conhece essa arte' };
  // artePorId olha tanto o catálogo estático quanto as artes fundidas pelo
  // jogador nesta campanha (engine/fusao.ts) — sem isso, uma arte que você
  // acabou de criar simplesmente não conjura em combate.
  const arte = artePorId(content, camp, arteId);
  if (!arte) return { ok: false, motivo: 'arte desconhecida' };
  const jog = jogadorAtor(s);
  if (!podeAgir(camp)) return { ok: false, motivo: 'desperte primeiro' };
  const tecnica = arte.tecnica;
  if (tecnica) {
    if ((jog.tatico?.preso ?? 0) > 0) return { ok: false, motivo: 'liberte-se antes de usar respirações' };
    if ((jog.recargas?.[arteId] ?? 0) > s.rodada) return { ok: false, motivo: 'técnica em recuperação' };
    if (!armaEquipada(content, p)?.dano) return { ok: false, motivo: 'equipe uma arma para executar a forma' };
    if (tecnica.modo === 'veneno' && !(p.inventario.dose_glicinia > 0)) return { ok: false, motivo: 'precisa de uma dose de glicínia' };
    if (alvoId && !s.atores.some(a => a.id === alvoId && !a.ehJogador && !a.ehAliado && vivo(a))) return { ok: false, motivo: 'alvo inválido' };
  }
  const custoReal = arte.custo.valor + (tecnica && (jog.tatico?.frio ?? 0) > 0 ? 2 : 0);
  if ((p.recursos[arte.custo.recurso] ?? 0) < custoReal) return { ok: false, motivo: `sem ${arte.custo.recurso}` };

  p.recursos[arte.custo.recurso] -= custoReal;
  if (arte.pressaoGerada) {
    p.pressoes[arte.pressaoGerada.medidor] = (p.pressoes[arte.pressaoGerada.medidor] ?? 0) + arte.pressaoGerada.valor;
  }
  jog.defendendo = false;
  if (tecnica) {
    jog.recargas ??= {};
    jog.recargas[arteId] = s.rodada + tecnica.recarga + 1;
    jog.tatico ??= {};
    s.ultimaTecnica = arteId;
    s.log.push(`Você executa ${arte.nome}.`);
    if (tecnica.modo === 'guarda') jog.tatico.guarda = 2;
    if (tecnica.modo === 'esquiva') jog.tatico.esquiva = 2;
    const alvo = s.atores.find(a => a.id === alvoId && !a.ehJogador && !a.ehAliado && vivo(a)) ?? inimigosVivos(s)[0];
    const alvos = tecnica.modo === 'area' ? inimigosVivos(s) : alvo ? [alvo] : [];
    if (tecnica.modo === 'veneno') {
      p.inventario.dose_glicinia--;
      if (!p.inventario.dose_glicinia) delete p.inventario.dose_glicinia;
    }
    if (tecnica.potencia > 0) for (const a of alvos) {
      for (let i = 0; i < (tecnica.golpes ?? 1) && vivo(a); i++) {
        const antes = a.vida;
        const ataque = { ...jog, acerto: jog.acerto + (tecnica.modo === 'precisao' ? 5 : 0) };
        const r = a.rivalId ? camp.kimetsu?.rivais[a.rivalId] : undefined;
        if (r?.memoria.slice(-2).some(m => m.tecnica === arteId)) ataque.acerto -= r.evolucao?.adaptacoes[arteId] ?? 2;
        if (r?.cicatrizes?.some(c => c.includes(arteId.replace(/^respiracao_/, '')))) {
          ataque.acerto += 2;
          s.log.push(`O golpe explora a cicatriz deixada anteriormente em ${a.nome}!`);
        }
        if (r?.tracos?.imunidades?.includes('imune_corte') && tecnica.modo === 'corte') {
          ataque.acerto -= 2;
        }
        s.log.push(resolverAtaque(camp, ataque, a, { base: (tecnica.potencia + modificador(p.atributos.precisao)) * multiplicadoresDeIdentidade(camp).dano, dispersao: .2, tipo: 'corte' }, !!armaEquipada(content, p)?.contraOni));
        if (tecnica.modo === 'veneno' && a.vida < antes && a.oni && vivo(a)) {
          if (r?.tracos?.imunidades?.includes('imune_veneno')) {
            s.log.push(`${a.nome} desenvolveu tolerância à glicínia: a regeneração não foi contida!`);
          } else {
            const turnosVeneno = r?.tracos?.fraquezas?.includes('fobia_glicinia') ? 5 : 3;
            a.imuneRegenTurnos = turnosVeneno;
            (a.tatico ??= {}).veneno = turnosVeneno;
            s.log.push(turnosVeneno === 3 ? 'A glicínia entrou na ferida: regeneração suprimida por três turnos.' : `A glicínia entrou na ferida: fobia explorada, regeneração suprimida por ${turnosVeneno} turnos.`);
          }
        }
        if ((r?.tracos?.fraquezas?.includes('fobia_fogo') || r?.tracos?.fraquezas?.includes('fobia_sol')) && (arteId.includes('fogo') || arteId.includes('hinokami') || arteId.includes('sol'))) {
          s.moralInimiga = Math.max(0, s.moralInimiga - 20);
          (a.tatico ??= {}).guarda = 0;
          s.log.push(`${a.nome} recua apavorado pelo calor abrasador: fobia ativada!`);
        }
      }
    }
    clampRecursos(p);
    depoisDaAcaoDoJogador(content, camp);
    return { ok: true };
  }

  const ofensiva = ['Evocação', 'Necromancia', 'Técnica'].includes(arte.escola);
  const cura = /cura|curativo/.test(arte.id);

  if (cura) {
    // Penitente: quanto mais ferida, mais forte a arte (engine/classe.ts).
    const v = Math.round((8 + grauBase(arte.grau)) * multiplicadorDeArte(camp));
    jog.vida = Math.min(jog.vidaMax, jog.vida + v);
    p.recursos.vida = jog.vida;
    s.log.push(`Você conjura ${arte.nome}: ${v} de vida restaurada.`);
  } else if (ofensiva) {
    const alvo = s.atores.find((a) => a.id === alvoId && !a.ehJogador && vivo(a)) ?? inimigosVivos(s)[0];
    if (alvo) {
      const perfil: PerfilDano = { base: (6 + grauBase(arte.grau) + modificador(p.atributos.raciocinio)) * multiplicadoresDeIdentidade(camp).dano * multiplicadorDeArte(camp), dispersao: 0.3, tipo: 'arcano' };
      const jogMag = { ...jog, acerto: 10 + p.nivel + modificador(p.atributos.raciocinio) };
      s.log.push(`Você conjura ${arte.nome}. ` + resolverAtaque(camp, jogMag, alvo, perfil));
    }
  } else {
    s.log.push(`Você conjura ${arte.nome}.`);
  }
  clampRecursos(p);
  depoisDaAcaoDoJogador(content, camp);
  return { ok: true };
}

export function jogadorUsaItemCombate(
  content: ContentBundle,
  camp: Campaign,
  itemId: string,
): { ok: boolean; motivo?: string } {
  const s = camp.combate;
  if (!s || s.terminado) return { ok: false, motivo: 'sem combate' };
  if (!podeAgir(camp)) return { ok: false, motivo: 'desperte primeiro' };
  const p = camp.personagem;
  const item = content.itens.find((i) => i.id === itemId);
  if (!item || item.slot !== 'consumivel' || !item.efeitosUso) return { ok: false, motivo: 'não dá para usar' };
  if ((p.inventario[itemId] ?? 0) <= 0) return { ok: false, motivo: 'você não tem' };
  // aplica efeitos de recurso diretamente (foco em cura/vigor em combate)
  for (const ef of item.efeitosUso) {
    if (ef.tipo === 'recurso') p.recursos[ef.recurso] = (p.recursos[ef.recurso] ?? 0) + ef.delta;
    if (ef.tipo === 'condicao' && !ef.adicionar) p.condicoes = p.condicoes.filter((c) => c !== ef.condicao);
  }
  p.inventario[itemId] -= 1;
  if (p.inventario[itemId] <= 0) delete p.inventario[itemId];
  clampRecursos(p);
  jogadorAtor(s).vida = p.recursos.vida;
  s.log.push(`Você usa ${item.nome}.`);
  depoisDaAcaoDoJogador(content, camp);
  return { ok: true };
}

export function jogadorFoge(content: ContentBundle, camp: Campaign): void {
  const s = camp.combate;
  if (!s || s.terminado) return;
  if (!podeAgir(camp)) return;
  if ((jogadorAtor(s).tatico?.preso ?? 0) > 0) { s.log.push('Você precisa se libertar antes de fugir.'); return; }
  const p = camp.personagem;
  const chance = probabilidade(10 + modificador(p.atributos.precisao), 12, 4);
  if (nextFloat(camp.rng) < chance) {
    s.log.push('Você rompe o cerco e foge.');
    encerrar(camp, 'fuga', content);
  } else {
    s.log.push('Você tenta fugir, mas não encontra a brecha.');
    depoisDaAcaoDoJogador(content, camp);
  }
}

function podeAgir(camp: Campaign): boolean {
  const s = camp.combate!;
  if (s.ordem[s.turno] !== 'jogador') return false;
  if ((jogadorAtor(s).tatico?.sono ?? 0) > 0) {
    s.log.push('O sonho prende sua atenção. Use Despertar para retomar o controle.');
    return false;
  }
  return true;
}

function processarEfeitosContinuos(camp: Campaign, a: CombatActor): void {
  if ((a.tatico?.veneno ?? 0) > 0) {
    a.tatico!.veneno!--;
    a.vida = Math.max(a.oni ? 1 : 0, a.vida - Math.max(2, Math.ceil(a.vidaMax * .04)));
    camp.combate!.log.push(`${a.nome} sofre com o veneno.`);
  }
  if ((a.tatico?.queimadura ?? 0) > 0) {
    a.tatico!.queimadura!--;
    const danoChama = 4;
    a.vida = Math.max(a.oni ? 1 : 0, a.vida - danoChama);
    camp.combate!.log.push(`🔥 [Chamas Solares]: ${a.nome} queima no fogo purificador (-${danoChama} PV)!`);
  }
  if ((a.tatico?.sangramento ?? 0) > 0) {
    a.tatico!.sangramento!--;
    const danoSangue = 3;
    a.vida = Math.max(a.oni ? 1 : 0, a.vida - danoSangue);
    camp.combate!.log.push(`🩸 [Sangramento]: ${a.nome} perde sangue das feridas abertas (-${danoSangue} PV)!`);
  }
}

function executarTurnoAliado(content: ContentBundle, camp: Campaign, aliado: CombatActor): void {
  const s = camp.combate!;
  const npc = aliado.npcId ? npcPorId(content, camp, aliado.npcId) : undefined;
  const ficha = npc && fichaCombatente(camp, npc);
  if (!ficha) return;
  const jogador = jogadorAtor(s);
  if (s.ordemGrupo === 'proteger') {
    (jogador.tatico ??= {}).guarda = Math.max(jogador.tatico?.guarda ?? 0, 1);
    aliado.defendendo = true;
  }
  const alvo = s.ordemGrupo === 'focar' ? [...inimigosVivos(s)].sort((a, b) => a.vida - b.vida)[0] : pick(camp.rng, inimigosVivos(s));
  const tecnicaId = ficha.tecnicas[(s.rodada - 1) % Math.max(1, ficha.tecnicas.length)];
  if (ficha.suporte && jogador.vida < jogador.vidaMax * .7) {
    const cura = tecnicaId === 'medicina_tamayo' ? 14 : 8;
    jogador.vida = Math.min(jogador.vidaMax, jogador.vida + cura);
    camp.personagem.recursos.vida = jogador.vida;
    if (tecnicaId === 'talismas_yushiro') (jogador.tatico ??= {}).esquiva = 2;
    s.log.push(`${aliado.nome} usa ${tecnicaId === 'medicina_tamayo' ? 'medicina antidemônio' : 'talismãs de ocultação'}: você recupera ${cura} de vida.`);
    return;
  }
  const arte = content.artes.find(a => a.id === tecnicaId);
  const tecnica = arte?.tecnica;
  const nome = arte?.nome ?? (tecnicaId === 'sangue_explosivo_nezuko' ? 'Sangue Explosivo' : tecnicaId === 'tiro_nichirin_genya' ? 'disparo Nichirin' : 'técnica de suporte');
  s.log.push(`${aliado.nome} executa ${nome}.`);
  if (tecnica?.modo === 'guarda') {
    (aliado.tatico ??= {}).guarda = 2;
    return;
  }
  if (tecnica?.modo === 'esquiva') (aliado.tatico ??= {}).esquiva = 2;
  const alvos = tecnica?.modo === 'area' ? inimigosVivos(s) : [alvo];
  for (const inimigo of alvos) {
    const proporcao = ficha.dano.base / Math.max(1, npc!.combatente!.dano.base);
    const potencia = tecnica?.potencia ? tecnica.potencia * proporcao : ficha.dano.base;
    const atacante = tecnica?.modo === 'precisao' ? { ...aliado, acerto: aliado.acerto + 5 } : aliado;
    for (let golpe = 0; golpe < (tecnica?.golpes ?? 1) && vivo(inimigo); golpe++) {
      s.log.push(resolverAtaque(camp, atacante, inimigo, { ...ficha.dano, base: potencia }, !!ficha.nichirin));
    }
    if (vivo(inimigo) && (tecnica?.modo === 'veneno' || tecnicaId === 'sangue_explosivo_nezuko')) {
      inimigo.imuneRegenTurnos = Math.max(inimigo.imuneRegenTurnos ?? 0, 2);
    }
  }
}

// Telegraph + fixed cadence let the player learn and counter each blood art.
function executarArteOni(camp: Campaign, a: CombatActor, jog: CombatActor): boolean {
  const s = camp.combate!;
  const arte = a.perfilOni?.arte;
  if (!arte || arte === 'garras') return false;
  a.tatico ??= {};
  jog.tatico ??= {};
  if (s.rodada % 3 === 1) {
    const avisos: Record<string, string> = {
      fios: 'fios convergem: preparar guarda ou escapar da prisão', sono: 'a boca na mão prepara um sussurro: despertar custa uma ação',
      veneno: 'foices de sangue se erguem: uma guarda firme bloqueia a dose', faixas: 'as faixas se abrem para envolver',
      vasos: 'água se acumula nos vasos: a prisão impede respirações', emocoes: 'os corpos emocionais ocultam o corpo verdadeiro: observar revela a abertura',
      bussola: 'a bússola acompanha a postura agressiva: defender reduz sua leitura', gelo: 'névoa congelante se acumula: aumentará o custo do fôlego',
      lua: 'a espada se estende: virá uma sequência de cortes', biwa: 'a biwa anuncia o deslocamento dos aposentos',
      tambores: 'um tambor anuncia a rotação do aposento', sangue: 'apêndices se abrem para espalhar sangue tóxico',
      relampago: 'eletricidade negra percorre a lâmina: virá uma investida veloz',
      ilusao: 'o cenário perde consistência: observar ajuda a separar o real',
      armas: 'sombras tomam forma de armas de longo alcance', bracos: 'braços numerosos se abrem para agarrar',
      temari: 'duas temaris começam a girar em trajetórias cruzadas', setas: 'setas invisíveis alteram a direção do chão e do corpo',
      pantano: 'o solo escurece e tenta arrastar você para uma bolsa subterrânea',
    };
    s.log.push(`${a.nome}: ${avisos[arte]}.`);
    if (arte === 'emocoes') a.tatico.guarda = a.tatico.revelado ? 0 : 2;
    return false;
  }
  if (s.rodada % 3 !== 2) return false;
  const protegido = jog.defendendo || (jog.tatico.guarda ?? 0) > 0;
  const perfil = a.dano ?? { base: 8, dispersao: .3, tipo: 'corte' };
  switch (arte) {
    case 'sono':
      jog.tatico.sono = 1; s.log.push(`${a.nome} induz um sonho. Despertar rompe a indução.`); return true;
    case 'fios': case 'faixas': case 'vasos': case 'bracos': case 'setas': case 'pantano':
      if (!protegido) jog.tatico.preso = 2;
      s.log.push(protegido ? 'Sua guarda impede a prisão.' : 'Você foi imobilizado. Liberte-se para respirar e fugir.');
      break;
    case 'veneno': case 'sangue':
      if (!protegido) jog.tatico.veneno = 4;
      s.log.push(protegido ? 'A guarda impede que o sangue venenoso alcance a ferida.' : 'O sangue demoníaco contaminou sua ferida.');
      break;
    case 'gelo':
      jog.tatico.frio = 4; s.log.push('O frio agride os pulmões: respirações custam mais 2 de vigor por três ações.'); break;
    case 'bussola':
      s.log.push('A bússola acompanha seu ímpeto.');
      s.log.push(resolverAtaque(camp, { ...a, acerto: a.acerto + (protegido ? -3 : 3) }, jog, perfil)); return true;
    case 'lua':
      s.log.push('Lâminas crescentes reais acompanham dois cortes.');
      for (let i = 0; i < 2 && vivo(jog); i++) s.log.push(resolverAtaque(camp, a, jog, { ...perfil, base: Math.round(perfil.base * .7) }));
      return true;
    case 'relampago': case 'armas':
      s.log.push(arte === 'relampago' ? 'A descarga acompanha o corte.' : 'Projéteis saem das sombras em sequência.');
      s.log.push(resolverAtaque(camp, { ...a, acerto: a.acerto + 2 }, jog, perfil));
      if (vivo(jog)) s.log.push(resolverAtaque(camp, a, jog, { ...perfil, base: Math.max(2, Math.round(perfil.base * .55)) }));
      return true;
    case 'temari':
      s.log.push('As temaris ricocheteiam em dois ângulos.');
      for (let i = 0; i < 2 && vivo(jog); i++) s.log.push(resolverAtaque(camp, a, jog, { ...perfil, base: Math.max(2, Math.round(perfil.base * .6)) }));
      return true;
    case 'ilusao':
      if (!a.tatico.revelado) jog.tatico.esquiva = 0;
      s.log.push(a.tatico.revelado ? 'Você encontra o movimento real dentro da ilusão.' : 'A ilusão apaga sua leitura de distância.');
      break;
    case 'biwa': case 'tambores':
      if (!protegido) jog.tatico.preso = 1;
      s.log.push('O aposento muda de posição. Recuperar a orientação exige libertar-se.'); break;
    case 'emocoes':
      s.log.push(a.tatico.revelado ? 'Você mantém o corpo verdadeiro sob observação.' : 'Os corpos emocionais interceptam os cortes destinados ao corpo verdadeiro.'); break;
  }
  return false;
}

export type AcaoTatica = 'despertar' | 'libertar' | 'observar' | 'decapitar' | 'expor_sol' | 'romper_castelo' | 'flanquear' | 'cobertura' | 'avancar' | 'proteger_grupo' | 'focar_grupo' | 'retirar_aliado' | 'capturar' | 'humilhar' | 'trocar_arma' | 'lamina_carmesim';
export function jogadorAcaoTatica(content: ContentBundle, camp: Campaign, acao: AcaoTatica, alvoId?: string): void {
  const s = camp.combate;
  if (!s || s.terminado || s.ordem[s.turno] !== 'jogador') return;
  const jog = jogadorAtor(s);
  jog.tatico ??= {};
  if (acao === 'despertar') {
    if (!jog.tatico.sono) { s.log.push('Você já está desperto.'); return; }
    jog.tatico.sono = 0;
    s.log.push('Você reconhece a indução e desperta, retomando a atenção.');
  } else if (acao === 'lamina_carmesim') {
    // Akatō: quem tem a Marca aperta a empunhadura com força sobre-humana e o
    // aço superaquece. Por três rodadas, o corte queima o sangue de oni e a
    // regeneração não fecha a ferida.
    if (!podeAgir(camp)) return;
    if (!jog.corNichirin) { s.log.push('Só o aço de uma Nichirin desperta responde a esse aperto.'); return; }
    if (!temMarca(camp)) { s.log.push('Você aperta a empunhadura, mas o aço não esquenta: falta a Marca.'); return; }
    if ((jog.laminaCarmesimAte ?? 0) >= s.rodada) { s.log.push('A lâmina já está rubra.'); return; }
    const p = camp.personagem;
    if ((p.recursos.vigor ?? 0) < 4) { s.log.push('Sem fôlego para apertar o aço até ele arder (4 de vigor).'); return; }
    p.recursos.vigor -= 4;
    jog.laminaCarmesimAte = s.rodada + 3;
    s.log.push('Você aperta a empunhadura até os dedos doerem. O aço esquenta e fica vermelho-vivo.');
  } else if (acao === 'trocar_arma') {
    if (!podeAgir(camp)) return;
    if ((jog.tatico.preso ?? 0) > 0) {
      s.log.push('Liberte-se antes de trocar de arma.');
      return;
    }
    const novaArmaId = alvoId;
    const temNaMochila = novaArmaId ? (camp.personagem.inventario[novaArmaId] ?? 0) > 0 : false;
    const itemNovo = novaArmaId ? itemPorId(content, novaArmaId, camp.personagem) : undefined;
    if (!novaArmaId || !temNaMochila || !itemNovo || itemNovo.slot !== 'arma') {
      s.log.push('Arma não encontrada na mochila para empunhar.');
      return;
    }
    if (camp.personagem.equipado.arma === novaArmaId) {
      s.log.push(`Você já está empunhando ${itemNovo.nome}.`);
      return;
    }
    const armaAnteriorId = camp.personagem.equipado.arma;
    const itemAnterior = armaAnteriorId ? itemPorId(content, armaAnteriorId, camp.personagem) : undefined;
    camp.personagem.equipado.arma = novaArmaId;
    verificarDespertarNichirin(content, camp, itemNovo);
    const armaEfetiva = itemPorId(content, camp.personagem.equipado.arma, camp.personagem) ?? itemNovo;
    jog.dano = danoJogador(content, camp);
    jog.acerto = acertoJogador(content, camp);
    jog.janelaCritica = janelaCriticaJogador(camp, content);
    jog.multiplicadorCritico = armaEfetiva.multiplicadorCritico ?? 1.75;
    jog.efeitoPassivoArma = armaEfetiva.efeitoPassivo;
    jog.corNichirin = armaEfetiva.corNichirin;
    jog.nomeCorNichirin = armaEfetiva.corNichirinNome;
    const transicao = itemAnterior
      ? `Você embainha ${itemAnterior.nome} e saca ${armaEfetiva.nome} em postura de combate!`
      : `Você saca ${armaEfetiva.nome} em postura de combate!`;
    s.log.push(transicao);
  } else {
    if (!podeAgir(camp)) return;
    const alvo = s.atores.find(a => a.id === alvoId && !a.ehJogador && !a.ehAliado && vivo(a));
    if (['flanquear', 'cobertura', 'avancar'].includes(acao)) {
      if (jog.tatico.preso) { s.log.push('Liberte-se antes de mudar de posição.'); return; }
      jog.posicao = acao === 'flanquear' ? 'flanco' : acao === 'cobertura' ? 'cobertura' : 'frente';
      s.log.push(acao === 'flanquear' ? 'Você flanqueia: +3 acerto, -2 defesa.' : acao === 'cobertura' ? 'Você usa o terreno: +3 defesa, -2 acerto.' : 'Você retorna à linha de frente.');
    } else if (acao === 'proteger_grupo' || acao === 'focar_grupo') {
      if (!s.atores.some(a => a.ehAliado && vivo(a))) return;
      s.ordemGrupo = acao === 'proteger_grupo' ? 'proteger' : 'focar';
      s.log.push(s.ordemGrupo === 'proteger' ? 'O grupo passa a proteger sua retirada e interceptar os golpes.' : 'O grupo concentra os ataques no inimigo mais ferido.');
    } else if (acao === 'retirar_aliado') {
      const aliado = s.atores.find(a => a.id === alvoId && a.ehAliado && vivo(a));
      if (!aliado || aliado.vida > aliado.vidaMax * .4) { s.log.push('A retirada assistida é para companheiros gravemente feridos.'); return; }
      aliado.retirado = true;
      s.log.push(`Você retira ${aliado.nome} da linha de combate. Os ferimentos permanecem.`);
    } else if (acao === 'capturar') {
      const criatura = alvo?.criaturaId && criaturaPorId(content, alvo.criaturaId);
      if (!alvo || !criatura || alvo.oni || criatura.humano === false || !criatura.faccaoId || alvo.vida > alvo.vidaMax * .2) { s.log.push('Só é possível render um adversário humano enfraquecido.'); return; }
      alvo.capturado = true;
      s.log.push(`${alvo.nome} se rendeu e foi desarmado.`);
    } else if (acao === 'libertar') {
      if (!jog.tatico.preso) { s.log.push('Você não está imobilizado.'); return; }
      jog.tatico.preso = 0;
      s.log.push('Você rompe a prisão e recupera a mobilidade.');
    } else if (acao === 'observar') {
      if (!alvo) return;
      (alvo.tatico ??= {}).revelado = true;
      alvo.tatico.guarda = 0;
      s.log.push(`Você identifica as aberturas de ${alvo.nome}. Arte: ${alvo.perfilOni?.arte ?? 'combate comum'}. ${alvo.perfilOni?.morte === 'sol' ? 'A lâmina sozinha não o matará; é preciso exposição solar.' : alvo.perfilOni?.morte === 'gemeos' ? 'Os dois irmãos precisam cair na mesma janela.' : 'Ferir e encerrar a luta são coisas diferentes.'}`);
    } else if (acao === 'romper_castelo') {
      if (camp.localAtual !== 'castelo_infinito' || !camp.flags['matou.nakime']) {
        s.log.push('O controle de Nakime mantém o castelo fechado.'); return;
      }
      if (inimigosVivos(s).some(a => a.vida > a.vidaMax * .3)) {
        s.log.push('Enfraqueça os adversários antes de forçar o confronto para fora.'); return;
      }
      registrarSaidaNarrativa(camp);
      camp.localAtual = 'ruinas';
      if (!camp.locaisVisitados.includes('ruinas')) camp.locaisVisitados.push('ruinas');
      camp.flags['visitou.ruinas'] = true;
      s.ambiente = { abrigoSolar: false };
      s.log.push('Sem Nakime para sustentar a geometria, você força o confronto pela passagem até as ruínas. O amanhecer agora poderá alcançá-los.');
    } else if (acao === 'expor_sol') {
      const tipo = content.locais.find(l => l.id === camp.localAtual)?.tipo;
      if (!s.ambiente?.abrigoSolar || !['taverna', 'oficina', 'mansao', 'capela', 'forja'].includes(tipo ?? '')) {
        s.log.push('Não há uma cobertura que você consiga abrir aqui.'); return;
      }
      s.ambiente.abrigoSolar = false;
      s.log.push('Você abre a cobertura do campo de batalha. A luz direta alcançará quem estiver exposto durante o dia.');
    } else if (acao === 'decapitar') {
      if (!alvo?.oni) return;
      if (!armaEquipada(content, camp.personagem)?.contraOni) { s.log.push('Decapitar um oni exige Nichirin.'); return; }
      if (alvo.vida > alvo.vidaMax * .3) { s.log.push('A postura ainda está firme: enfraqueça o alvo primeiro.'); return; }
      if ((jog.tatico.preso ?? 0) > 0) { s.log.push('Liberte-se primeiro.'); return; }
      alvo.vida = 0;
      aplicarFerimentoOni(camp, alvo, true);
      s.log.push(`Você executa o corte no pescoço de ${alvo.nome}.`);
    } else if (acao === 'humilhar') {
      if (!alvo?.oni) { s.log.push('Apenas oni ou adversários persistentes podem ser humilhados.'); return; }
      if (alvo.vida > alvo.vidaMax * .3) { s.log.push('A postura ainda está firme: enfraqueça o adversário antes de quebrar seu espírito.'); return; }
      const r = alvo.rivalId && camp.kimetsu?.rivais[alvo.rivalId];
      if (r) {
        r.traumaJogador = true;
        if (r.evolucao) {
          r.evolucao.nivel = Math.max(0, r.evolucao.nivel - 2);
          r.evolucao.servos = 0;
          r.evolucao.plano = 'ocultar';
        }
        r.titulo = r.titulo ? `${r.titulo}, o Humilhado` : 'o Humilhado';
        r.rancor = Math.max(0, r.rancor - 2);
        if (camp.vivo) {
          registrarFato(camp, {
            tipo: 'oni_humilhado',
            local: camp.localAtual,
            texto: `Você quebrou o orgulho de ${alvo.nome} e o poupou com desprezo. Sua autoridade entre os outros foi destruída.`,
            atores: ['jogador', r.id],
            publico: true,
          });
        }
      }
      alvo.vida = 0;
      alvo.retirado = true;
      s.log.push(`Você desarma ${alvo.nome} e o atira ao chão com desprezo. Arruinado psicologicamente, ele foge em desespero.`);
      if (inimigosVivos(s).length === 0) {
        encerrar(camp, 'vitoria', content);
        return;
      }
    }
  }
  jog.defendendo = false;
  depoisDaAcaoDoJogador(content, camp);
}

// ── Fluxo de turnos ─────────────────────────────────────────────────
function depoisDaAcaoDoJogador(content: ContentBundle, camp: Campaign): void {
  const s = camp.combate!;
  if (inimigosVivos(s).length === 0) {
    encerrar(camp, 'vitoria', content);
    return;
  }
  if (s.rodada >= RODADAS_ATE_ROMPER) {
    s.log.push('O confronto se arrasta sem desfecho. Os dois lados recuam, exaustos.');
    encerrar(camp, 'fuga', content);
    return;
  }
  avancaTurno(s, camp);
  avancarAteJogador(content, camp);
}

// Teto de duracao de um combate. Sem ele, dois lados que nao conseguem se
// finalizar — tipicamente um oni cuja regeneracao empata com o dano recebido —
// ficavam trocando golpes indefinidamente: a medicao registrou uma luta de
// 4498 rodadas, o equivalente a dois meses de calendario num confronto so.
// Passado o teto, os dois recuam. Ninguem morre de cansaco em pe.
export const RODADAS_ATE_ROMPER = 150;

function avancaTurno(s: CombatState, camp: Campaign): void {
  s.turno += 1;
  if (s.turno >= s.ordem.length) {
    s.turno = 0;
    s.rodada += 1;
    // Abstract combat clock: twelve rounds consume one world period.
    if ((s.rodada - 1) % 12 === 0) {
      camp.calendario = avancarPeriodos(camp.calendario, 1);
      camp.capitulo.periodosDecorridos++;
      s.log.push(`O confronto se prolonga: ${periodoAtual(camp.calendario)}.`);
    }
  }
}

// Manhã ou tarde plena: luz do dia de verdade, não o entardecer nem a
// madrugada. Usa o mesmo relógio de período que já rege todo o resto do
// jogo — sem hora de parede, sem sorteio.
function diaClaro(camp: Campaign): boolean {
  const p = periodoAtual(camp.calendario);
  return p === 'manha' || p === 'tarde';
}

// Processa turnos de inimigos até voltar ao jogador (ou o combate acabar).
function avancarAteJogador(content: ContentBundle, camp: Campaign): void {
  const s = camp.combate!;
  let guarda = 0;
  while (!s.terminado && guarda < 50) {
    guarda++;
    const atorId = s.ordem[s.turno];
    const ator = s.atores.find((a) => a.id === atorId);
    if (!ator || !vivo(ator)) {
      avancaTurno(s, camp);
      continue;
    }
    if (ator.ehJogador) {
      processarEfeitosContinuos(camp, ator);
      if ((ator.tatico?.frio ?? 0) > 0) ator.tatico!.frio!--;
      camp.personagem.recursos.vida = ator.vida;
      if (ator.vida <= 0) encerrar(camp, 'derrota', content);
      return;
    }

    if (ator.ehAliado) {
      executarTurnoAliado(content, camp, ator);
      if (inimigosVivos(s).length === 0) { encerrar(camp, 'vitoria', content); return; }
      avancaTurno(s, camp);
      continue;
    }

    // Oni: queima até a morte se o combate ainda estiver rolando à luz do
    // dia (independente de quem começou a briga de noite).
    if (ator.oni && !ator.imuneLuz && diaClaro(camp) && !s.ambiente?.abrigoSolar) {
      ator.vida = 0;
      ator.mortoDefinitivo = true;
      s.log.push(`A luz alcança ${ator.nome} — a carne fumega e desmancha em cinzas.`);
      if (inimigosVivos(s).length === 0) {
        encerrar(camp, 'vitoria', content);
        return;
      }
      avancaTurno(s, camp);
      continue;
    }

    // Regeneration has a finite rate; poison can temporarily suppress it.
    if (ator.decapitadoAte && ator.decapitadoAte >= s.rodada) { avancaTurno(s, camp); continue; }
    ator.decapitadoAte = undefined;
    processarEfeitosContinuos(camp, ator);
    if (ator.vida <= 0) {
      s.log.push(`${ator.nome} sucumbe às feridas.`);
      if (inimigosVivos(s).length === 0) {
        encerrar(camp, 'vitoria', content);
        return;
      }
      avancaTurno(s, camp);
      continue;
    }
    if (ator.oni) {
      if ((ator.imuneRegenTurnos ?? 0) > 0) {
        ator.imuneRegenTurnos! -= 1;
        s.log.push(`${ator.nome} tenta se recompor, mas a ferida de aço marcado não fecha.`);
      } else if (ator.vida < ator.vidaMax) {
        const cura = Math.max(1, Math.ceil(ator.vidaMax * (ator.perfilOni?.regeneracao ?? .08)));
        ator.vida = Math.min(ator.vidaMax, ator.vida + cura);
        s.log.push(`${ator.nome} regenera até ${cura} de vida.`);
      }
    }

    // Turno do inimigo.
    checarFaseChefe(content, camp, ator);
    const rivalAtor = ator.rivalId ? camp.kimetsu?.rivais[ator.rivalId] : undefined;
    if (rivalAtor?.tracos?.odios?.some(o => o === 'furia_sangue' || o === 'furia_ao_sangrar')) {
      if (ator.vida <= ator.vidaMax * 0.4 && !(ator.tatico?.emFuria ?? 0)) {
        (ator.tatico ??= {}).emFuria = 3;
        ator.acerto += 2;
        s.log.push(`${ator.nome} sangra copiosamente e entra em frenesi assassino! (+2 acerto)`);
      }
    }
    if (moralQuebrada(camp, s)) return;
    const jog = jogadorAtor(s);
    const alvos = s.atores.filter(a => (a.ehJogador || a.ehAliado) && vivo(a));
    const protetor = s.ordemGrupo === 'proteger' ? alvos.find(a => a.ehAliado) : undefined;
    const alvoDoInimigo = protetor && nextFloat(camp.rng) < .6 ? protetor : alvos.length ? pick(camp.rng, alvos) : jog;
    if (vivo(alvoDoInimigo)) {
      const gastou = executarArteOni(camp, ator, alvoDoInimigo);
      if (!gastou) s.log.push(resolverAtaque(camp, ator, alvoDoInimigo, ator.dano ?? { base: 5, dispersao: 0.4, tipo: 'golpe' }));
      camp.personagem.recursos.vida = jog.vida;
      if (alvoDoInimigo.ehAliado && alvoDoInimigo.vida <= 0 && alvoDoInimigo.npcId) {
        camp.npcState[alvoDoInimigo.npcId].vivo = false;
        registrarMorteFamiliar(camp, alvoDoInimigo.npcId);
        camp.grupo = (camp.grupo ?? []).filter(id => id !== alvoDoInimigo.npcId);
        registrarMarco(camp, `${alvoDoInimigo.nome} morreu lutando ao seu lado.`);
        s.log.push(`${alvoDoInimigo.nome} não volta a se levantar.`);
      }
    }
    if (jog.vida <= 0) {
      encerrar(camp, 'derrota', content);
      return;
    }
    if (!vivo(ator)) {
      s.log.push(`${ator.nome} cai com o contra-golpe.`);
      if (inimigosVivos(s).length === 0) { encerrar(camp, 'vitoria', content); return; }
    }
    avancaTurno(s, camp);
  }
}

// Moral baixa: inimigos podem debandar (GDD §16).
function moralQuebrada(camp: Campaign, s: CombatState): boolean {
  if (s.moralInimiga >= 25) return false;
  if (nextFloat(camp.rng) < 0.5) {
    s.log.push('Sem estômago para continuar, os que restam recuam para as sombras.');
    encerrar(camp, 'vitoria');
    return true;
  }
  return false;
}

// Fase de chefe (GDD §17).
// Quem um chefe consegue chamar: gente da mesma laia, mais fraca que ele.
function reforcosPara(content: ContentBundle, chefe: Criatura): Criatura[] {
  const pares = content.criaturas.filter(
    (x) => !x.chefe && x.faccaoId === chefe.faccaoId && x.nivel < chefe.nivel,
  );
  if (pares.length === 0) return [];
  // Os dois mais fortes que ainda ficam abaixo dele: ajuda de verdade, sem
  // transformar a fase 2 em uma parede intransponível.
  return [...pares].sort((a, b) => b.nivel - a.nivel).slice(0, 2);
}

function checarFaseChefe(content: ContentBundle, camp: Campaign, ator: CombatActor): void {
  const s = camp.combate!;
  const c = ator.criaturaId ? criaturaPorId(content, ator.criaturaId) : undefined;
  if (!c?.chefe || !c.fase2 || ator.faseAtivada) return;
  if (ator.vida <= ator.vidaMax * c.fase2.gatilhoPct) {
    s.fase = 2;
    ator.faseAtivada = true;
    s.log.push(`— ${c.nome} muda. ${c.fase2.descricao}`);
    if (c.fase2.mecanica === 'apagar_vinculo') {
      const conhecidos = content.npcs.filter((n) => (camp.npcState[n.id]?.memoria.length ?? 0) > 0);
      const alvo = conhecidos.length ? pick(camp.rng, conhecidos) : undefined;
      if (alvo) {
        const din = camp.npcState[alvo.id];
        din.memoria = [];
        for (const k of Object.keys(din.eixos)) din.eixos[k] = 0;
        s.log.push(`${alvo.nome} deixa de lembrar de você.`);
      }
    } else if (c.fase2.mecanica === 'enfurecer') {
      ator.acerto += 3;
      s.log.push(`${c.nome} ataca com fúria renovada.`);
    } else if (c.fase2.mecanica === 'chamar_reforco') {
      // Chamar reforço tem que TRAZER alguém. Sem isto a mecânica declarada no
      // conteúdo era só uma linha de log — o combate não mudava em nada.
      const chamados = reforcosPara(content, c);
      if (chamados.length === 0) {
        s.log.push(`${c.nome} chama, e o que responde não chega a tempo.`);
      }
      for (const reforco of chamados) {
        const novo: CombatActor = {
          id: `reforco_${s.atores.length}_${reforco.id}`,
          nome: reforco.nome,
          ehJogador: false,
          vida: reforco.vida,
          vidaMax: reforco.vida,
          defesa: reforco.defesa,
          acerto: reforco.acerto,
          dano: reforco.dano,
          criaturaId: reforco.id,
          nivelGuilda: reforco.nivelGuilda ?? (reforco.nivel >= 12 ? 1000 : reforco.nivel * 70),
          condicoes: [],
          oni: reforco.oni,
        };
        s.atores.push(novo);
        // Entra na roda logo depois de quem chamou, não no fim da fila.
        const pos = s.ordem.indexOf(ator.id);
        s.ordem.splice(pos >= 0 ? pos + 1 : s.ordem.length, 0, novo.id);
        s.log.push(`${reforco.nome} atende ao chamado.`);
      }
      // Quem acabou de receber ajuda não debanda tão fácil.
      s.moralInimiga = Math.min(100, s.moralInimiga + 20);
    }
  }
}

function encerrar(camp: Campaign, resultado: 'vitoria' | 'derrota' | 'fuga', content?: ContentBundle): void {
  const s = camp.combate!;
  if (s.terminado) return;
  s.terminado = true;
  s.resultado = resultado;
  registrarConfronto(camp, resultado);
  registrarDesfechoBando(camp, resultado);
  registrarDesfechoCaravana(camp, resultado);
  // O relogio do combate avanca o calendario a cada doze rodadas (ver
  // avancaTurno), mas o mundo nao tiquetaqueava junto: uma luta longa fazia
  // dias passarem sem cidade produzir, sem NPC decidir nada e sem missao
  // vencer. Ficava invisivel enquanto o jogador morria em duas rodadas; com a
  // progressao corrigida, as lutas ficaram longas e o mundo comecou a
  // atrasar. Aqui ele recupera de uma vez os dias que passaram.
  if (content) avancarMundo(content, camp);
  if (content) atualizarAmeacas(content, camp);
  if (content && camp.vivo) processarMissoesVivas(content, camp);
  const p = camp.personagem;

  if (resultado === 'vitoria' && content) {
    let xp = 0;
    let moedasAchadas = 0;
    const loot: string[] = [];
    for (const a of s.atores) {
      if (a.ehJogador || a.ehAliado || vivo(a)) continue;
      const c = a.criaturaId ? criaturaPorId(content, a.criaturaId) : undefined;
      if (!c) continue;
      const desafio = content.desafios?.find(d => d.criaturaId === c.id);
      if (desafio) {
        camp.flags[`desafio.concluido.${desafio.id}`] = true;
        registrarMarco(camp, `você superou a expedição ${desafio.titulo}`);
        if (c.id === 'cavaleira_do_eclipse' && maestriaDe(camp, 'espada') >= 80) concederDespertar(camp, 'dominou_prova_eclipse', 'a prova do eclipse consolidou sua maestria');
        // A besta e' o adversario nao-oni mais duro do jogo (nivel 32) e
        // fecha a entrada da mata profunda desde antes dos reinos. Derrubar
        // ela e' limiar de historia, nao numero de xp.
        if (c.id === 'besta_do_primeiro_inverno') {
          if (concederDespertar(camp, 'cacada_impossivel', `a besta do primeiro inverno caiu — e a mata profunda ficou aberta atrás dela`)) {
            s.log.push('A mata profunda fica em silêncio. Faz muito tempo que ela não ficava.');
          }
        }
      }
      if (a.capturado) {
        xp += Math.floor(c.xp / 2);
        if (camp.vivo) registrarFato(camp, { tipo: 'rendicao', local: camp.localAtual, texto: `${a.nome} se rendeu a você e foi entregue à custódia local.`, atores: ['jogador'], publico: true });
        continue;
      }

      // ── Subjugação de Bestas Lendárias & Contrato de Alma (Tsukimichi) ──────
      if (camp.cenarioId === 'tsukimichi' && c.id in ENTIDADES_CONTRATAVEIS) {
        xp += c.xp;
        camp.flags[`subjugou.${c.id}`] = true;
        camp.flags[`contrato.${c.id}`] = true;
        registrarMarco(camp, `você subjugou a entidade primordial ${c.nome}`);

        const jaContratada = camp.asora?.contratos?.[c.id];
        if (!jaContratada) {
          const resContrato = realizarContratoAlma(camp, c.id, '2:8');
          if (resContrato.sucesso && resContrato.contrato) {
            const servaNome = resContrato.contrato.nomeConcedido;
            let msgLog = '';
            if (c.id === 'dragao_shen') {
              msgLog = `As ilusões espaciais de Muteki Shen se desfazem perante o seu oceano imensurável de mana. O Dragão Superior cai de joelhos fascinado, assume a forma da nobre espadachim ${servaNome} e sela o Contrato de Alma (2:8)! O subespaço de Asora despertou.`;
            } else if (c.id === 'aranha_calamidade') {
              msgLog = `Seu fluxo infinito de mana inunda a escuridão da Calamidade Voraz, saciando sua fome milenar pela primeira vez. A monstruosa aranha é tomada por êxtase e devoção absoluta, assumindo a forma da bela ${servaNome} e selando o Contrato de Alma (2:8)!`;
            } else if (c.id === 'fenix_suzaku') {
              msgLog = `As chamas solares de Suzaku se curvam perante a sua presença dominante. A soberana do fogo assume forma humanoide, curvando a cabeça como sua serva leal sob o Contrato de Alma (2:8)!`;
            } else {
              msgLog = `${c.nome} reconhece sua supremacia absoluta e sela o Contrato de Alma (2:8), assumindo forma humanoide como ${servaNome} a serviço do Mestre!`;
            }
            s.log.push(msgLog);
          }
        }
        continue;
      }

      xp += c.xp;
      // Marca a presa: missões podem exigir a queda de uma criatura específica.
      camp.flags[`matou.${c.id}`] = true;
      // Chefe caído é história, não estatística.
      if (c.chefe) registrarMarco(camp, `você derrubou ${c.nome}`);
      // Alguns chefes marcam um limiar real de poder, não só um número de xp
      // — ver engine/progresso.ts sobre por que Despertar é separado do nível normal.
      if (c.id === 'oni_ancestral') {
        const ganhou = concederDespertar(camp, 'venceu_oni_ancestral', `você derrubou ${c.nome} — algo em você mudou de patamar de vez.`);
        if (ganhou) s.log.push(`Alguma coisa em você não volta mais ao que era.`);
      }
      // As doze Luas sao o limiar canonico: quem derruba uma volta diferente,
      // seja Inferior ou Superior. Concedido uma vez so' — a segunda Lua e'
      // proeza, nao transformacao.
      if (c.oni && c.id.startsWith('lua_')) {
        if (concederDespertar(camp, 'derrubou_uma_lua', `você enfrentou ${c.nome}, um dos doze, e voltou`)) {
          s.log.push('Você enfrentou um dos doze e está de pé. Quase ninguém no mundo pode dizer isso.');
        }
      }
      // A Marca do Caçador (engine/marca.ts). No cânone ela aparece em luta
      // de vida ou morte contra os mais fortes; até a sessão 46 bastava
      // derrubar qualquer chefe oni (o Oni das Mãos, nível 5, contava) e a
      // Marca despertava em 12 de 12 campanhas longas antes dos 25 anos.
      // Agora pede oni de nível 8+ (das Luas Inferiores mais altas em diante)
      // e o jogador com no máximo 35% da vida no fim da luta. Nível 10+ foi
      // medido e descartado: o simulador nunca venceu um em dez anos, e a
      // Marca sumiria do jogo.
      const usaRespiracao = p.artesConhecidas.some(a => a.startsWith('respiracao_') || a.startsWith('hinokami_'));
      const eu = s.atores.find(x => x.ehJogador);
      const beiraDaMorte = !!eu && eu.vida > 0 && eu.vida <= eu.vidaMax * 0.35;
      if (c.oni && c.nivel >= NIVEL_MINIMO_ONI_MARCA && (c.id.startsWith('lua_') || c.chefe) && usaRespiracao && beiraDaMorte) {
        if (despertarMarca(camp, 'veias ardentes e chamas gravadas na carne — a Marca do Caçador despertou')) {
          p.cicatrizes ??= [];
          if (!p.cicatrizes.includes('marca_do_cacador')) p.cicatrizes.push('marca_do_cacador');
          s.log.push('Uma queimação insuportável rompe sob sua pele: a Marca do Caçador se manifesta. Quem a conhece sabe o preço: o corpo marcado começa a falhar aos ' + camp.marca!.idadeLimite + ' anos.');
        }
      }
      // Pilar de almas da Ascensão (ver engine/ascensao.ts): só chefes oni de
      // verdade alto nível — nivel >= 10 deixa de fora oni_ancestral (9) e as
      // Luas Inferiores (6-9), reservado pra Luas Superiores/Muzan.
      if (c.chefe && c.oni && c.nivel >= 10) {
        selarAlma(camp, c.nome);
        s.log.push(`A alma de ${c.nome} está selada.`);
      }
      for (const l of c.loot ?? []) {
        if (nextFloat(camp.rng) < l.chance) {
          loot.push(l.item);
          p.inventario[l.item] = (p.inventario[l.item] ?? 0) + 1;
        }
      }
      // E o que ela carregava: bolso, embornal e a arma que estava usando.
      const mochila = recolherDespojos(content, camp, c);
      loot.push(...mochila.itens);
      moedasAchadas += mochila.moedas;
    }
    p.xp += xp;
    const nivelAntes = p.nivel;
    processarSubidaDeNivel(camp);
    if (p.nivel > nivelAntes) s.log.push(`Você subiu para o nível ${p.nivel}.`);
    // Vencer e' a demonstracao mais legivel que existe. Quem viu forma a
    // propria opiniao (ver engine/aptidao.ts); ninguem consulta a aptidao.
    const inimigos = s.atores.filter(a => !a.ehJogador && !a.ehAliado);
    const nivelMaior = Math.max(0, ...inimigos.map(a => (a.criaturaId ? criaturaPorId(content, a.criaturaId)?.nivel ?? 0 : 0)));
    const tecnica = s.ultimaTecnica ? artePorId(content, camp, s.ultimaTecnica) : undefined;
    const dominio = dominioDaArte(tecnica?.tecnica?.estilo);
    const aliados = s.atores
      .filter(a => a.ehAliado && a.npcId)
      .map(a => npcPorId(content, camp, a.npcId!))
      .filter((n): n is NPC => !!n);
    const plateia = [...aliados, ...calcularContexto(content, camp).presentes];
    treinar(content, camp, dominio, { mestre: 0.1, esforco: 0.9, recursos: 0.6 });
    registrarDemonstracao(content, camp, {
      dominio,
      dificuldade: Math.min(100, nivelMaior * 5 + inimigos.length * 3),
      sucesso: true,
      testemunhas: [...new Map(plateia.map(n => [n.id, n])).values()],
    });
    s.recompensa = { xp, loot };
    const nomes = loot.map((id) => content.itens.find((i) => i.id === id)?.nome ?? id);
    const bolso = moedasAchadas > 0 ? ` · ${moedasAchadas} moedas` : '';
    s.log.push(`Vitória. ${xp} de experiência${bolso}${nomes.length ? ` · saque: ${nomes.join(', ')}` : ''}.`);

    // ── Consumo de Óleo Alquímico (Witcher) ──────────────────────────
    if (camp.contratosMonstro?.oleoAtivo) {
      camp.contratosMonstro.oleoAtivo.combatesRestantes--;
      if (camp.contratosMonstro.oleoAtivo.combatesRestantes <= 0) {
        s.log.push(`O efeito do óleo alquímico (${camp.contratosMonstro.oleoAtivo.nomeOleo}) se esgotou da sua lâmina.`);
        delete camp.contratosMonstro.oleoAtivo;
      }
    }

    // ── Resolução de Contratos de Caça a Monstros ───────────────────
    if (camp.contratosMonstro?.contratos) {
      for (const a of s.atores.filter(x => !x.ehJogador && !x.ehAliado)) {
        if (a.criaturaId) {
          for (const contrato of Object.values(camp.contratosMonstro.contratos)) {
            if (contrato.criaturaId === a.criaturaId && contrato.estado === 'pronto_para_confronto') {
              contrato.estado = 'concluido';
              p.dinheiro += contrato.recompensaMoedas;
              p.xp += contrato.recompensaXp;
              p.inventario[contrato.trofeuId] = (p.inventario[contrato.trofeuId] ?? 0) + 1;
              s.log.push(`[Contrato Concluído: ${contrato.titulo}] Você abateu ${contrato.monstroNome}! Recompensa: +${contrato.recompensaMoedas} moedas, +${contrato.recompensaXp} XP e o troféu foi recolhido.`);
              registrarMarco(camp, `completou o contrato de caça de ${contrato.monstroNome}`);
            }
          }
        }
      }
    }
  } else if (resultado === 'derrota') {
    // GDD §15: sobrevive com sequela; o inimigo leva algo seu.
    p.recursos.vida = 1;
    if (!p.condicoes.includes('ferido')) p.condicoes.push('ferido');
    const perda = Math.min(p.dinheiro, Math.round(p.dinheiro * 0.3));
    p.dinheiro -= perda;
    if (camp.vivo && s.atores.some(a => {
      const criatura = criaturaPorId(content!, a.criaturaId ?? '');
      return !a.ehJogador && !a.ehAliado && !a.oni && criatura?.humano !== false && !!criatura?.faccaoId;
    }) && nextFloat(camp.rng) < .2) {
      if (!p.condicoes.includes('cativo')) p.condicoes.push('cativo');
      registrarFato(camp, { tipo: 'cativeiro_jogador', local: camp.localAtual, texto: 'Seus adversários pouparam sua vida e o mantiveram cativo.', atores: ['jogador'], publico: false, conhecimento: 'testemunhado' });
      s.log.push('Você foi mantido em cativeiro. Procure uma oportunidade de recuperar a liberdade.');
    }
    s.log.push(`Você desaba. Acorda depois, ferido, com ${perda} moedas a menos.`);
  }
  for (const a of s.atores.filter(a => a.ehAliado && a.npcId)) {
    const din = camp.npcState[a.npcId!];
    if (din) din.vida = Math.max(0, a.vida);
    if (content && din?.vivo && a.vida > 0) {
      const npc = npcPorId(content, camp, a.npcId!);
      const nivelMaior = Math.max(1, ...s.atores.filter(i => !i.ehJogador && !i.ehAliado).map(i => criaturaPorId(content, i.criaturaId ?? '')?.nivel ?? 1));
      if (npc) treinarNpc(camp, npc, a.retirado ? .25 : 1, resultado === 'vitoria' ? nivelMaior * 2 : nivelMaior * .5);
    }
  }
  aplicarPressaoPosCombateMarca(camp);
  clampRecursos(p);

  // Consumo de cargas de afiação e têmpera após o combate
  if (content) {
    const arma = armaEquipada(content, p);
    if (arma?.afiacao && arma.afiacao.cargas > 0) {
      arma.afiacao.cargas -= 1;
      if (arma.afiacao.cargas <= 0) {
        delete arma.afiacao;
      }
    }
    for (const slot of ['armadura', 'escudo'] as const) {
      const id = p.equipado[slot];
      if (!id) continue;
      const equip = itemPorId(content, id, p);
      if (equip?.tempera && equip.tempera.cargas > 0) {
        equip.tempera.cargas -= 1;
        if (equip.tempera.cargas <= 0) {
          delete equip.tempera;
        }
      }
    }
  }
}

export function fecharCombate(camp: Campaign): void {
  camp.combate = null;
}
