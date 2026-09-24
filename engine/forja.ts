// ARCANUM · A forja: o jogador faz o próprio equipamento.
//
// Até a sessão 29, item era catálogo fechado. O jogador podia comprar, achar,
// vender e equipar — nunca fazer. E a base para fazer estava toda ali, parada:
// minério de ferro, couro cru, pele de urso, lasca de gárgula, osso, dente de
// lobo; o carvão descrito como "sem ele a forja é só uma pedra vazia"; artes de
// ofício como Temperar e Marca do Ferreiro; ferreiras no elenco de mais de uma
// cidade. Nada disso se ligava a nada.
//
// A regra deste módulo é a do projeto inteiro: **a engine calcula, a IA não
// inventa**. O jogador escolhe um molde e um material; o que sai é determinado
// por tabela, pela maestria dele no ofício e por uma variação do RNG da
// campanha. O narrador pode descrever a lâmina — não pode decidir quanto ela
// corta.
//
// Três limites deliberados:
//  1. **Teto por molde.** Nem a obra-prima de lasca de gárgula passa de 145%
//     do molde. Forjar tem de ser alternativa à loja, não atalho para quebrar
//     a curva de poder que custou três sessões para acertar.
//  2. **Aprendiz faz peça tosca.** A qualidade vem da maestria de `oficio`.
//     Quem nunca bateu ferro faz uma lâmina pior que a da loja — e fica melhor
//     batendo mais, porque forjar treina o ofício.
//  3. **Nichirin não se forja.** A lâmina dos caçadores exige o minério
//     escarlate e as mãos da vila dos ferreiros; é ponto de história, não de
//     receita.
import { ocupacaoEfetiva } from './familiasNpc';
import type { Campaign, ContentBundle, Item, PerfilDano, AttrKey, NPC } from './types';
import { itemPorId } from './items';
import { nextFloat } from './rng';
import { calcularContexto } from './availability';
import { maestriaDe, treinar, registrarDemonstracao } from './aptidao';
import { avancarPeriodos } from './time';
import { crescerImpulsos } from './impulsos';
import { avancarMundo } from './mundo';
import { registrarMarco } from './memoria';
import { registrarFato } from './historiaViva';
import { forjaDaCidade } from './edificiosRegionais';

// ── Moldes: a forma da peça ───────────────────────────────────────────────

type Familia = 'metal' | 'pedra' | 'osso' | 'couro';

export type Molde = {
  id: string;
  nome: string;
  /** Artigo e gênero do nome, para "Lâmina curta de ferro, boa". */
  genero: 'f' | 'm';
  slot: 'arma' | 'armadura' | 'escudo';
  /** Dano-base da arma equivalente da loja, com material comum e mão honesta. */
  dano?: { base: number; tipo: PerfilDano['tipo']; dispersao: number };
  atributoAtaque?: AttrKey;
  /** Defesa da peça equivalente da loja. */
  defesa?: number;
  peso: number;
  /** Preço-base de referência, para a venda. */
  valorBase: number;
  /** Quanto material a peça consome. */
  quantidade: number;
  aceita: Familia[];
};

// As bases batem com o catálogo: lâmina curta = espada curta (9), lâmina
// longa = espada longa (12), e assim por diante. Uma peça "boa" de ferro sai
// igual à da loja; o que muda é quem fez, de quê, e o que a mão acrescenta.
export const MOLDES: Molde[] = [
  { id: 'lamina_curta', nome: 'Lâmina curta', genero: 'f', slot: 'arma', dano: { base: 9, tipo: 'cortante', dispersao: 0.35 }, peso: 2, valorBase: 22, quantidade: 2, aceita: ['metal', 'pedra', 'osso'] },
  { id: 'lamina_longa', nome: 'Lâmina longa', genero: 'f', slot: 'arma', dano: { base: 12, tipo: 'cortante', dispersao: 0.35 }, peso: 3, valorBase: 45, quantidade: 3, aceita: ['metal', 'pedra'] },
  { id: 'estoque', nome: 'Estoque', genero: 'm', slot: 'arma', dano: { base: 10, tipo: 'perfurante', dispersao: 0.3 }, atributoAtaque: 'precisao', peso: 2, valorBase: 30, quantidade: 2, aceita: ['metal'] },
  { id: 'machado', nome: 'Machado', genero: 'm', slot: 'arma', dano: { base: 14, tipo: 'cortante', dispersao: 0.45 }, peso: 4, valorBase: 40, quantidade: 3, aceita: ['metal', 'pedra'] },
  { id: 'lanca', nome: 'Lança', genero: 'f', slot: 'arma', dano: { base: 11, tipo: 'perfurante', dispersao: 0.35 }, peso: 3, valorBase: 24, quantidade: 2, aceita: ['metal', 'osso', 'pedra'] },
  { id: 'martelo', nome: 'Martelo', genero: 'm', slot: 'arma', dano: { base: 16, tipo: 'contundente', dispersao: 0.4 }, peso: 5, valorBase: 55, quantidade: 4, aceita: ['metal', 'pedra'] },
  { id: 'gibao', nome: 'Gibão', genero: 'm', slot: 'armadura', defesa: 2, peso: 4, valorBase: 28, quantidade: 2, aceita: ['couro'] },
  { id: 'cota', nome: 'Cota', genero: 'f', slot: 'armadura', defesa: 5, peso: 10, valorBase: 110, quantidade: 4, aceita: ['metal'] },
  { id: 'escudo', nome: 'Escudo', genero: 'm', slot: 'escudo', defesa: 2, peso: 5, valorBase: 30, quantidade: 3, aceita: ['metal', 'couro'] },
];

// ── Materiais: do que a peça é feita ──────────────────────────────────────

export type Material = {
  /** Id do item do catálogo que serve de matéria-prima. */
  item: string;
  /** Como aparece no nome da peça: "de ferro", "de gárgula". */
  rotulo: string;
  familia: Familia;
  /** Multiplica o molde. Ferro é a régua: 1,0. */
  fator: number;
};

// Todos já existiam no catálogo, sem uso. A régua é o ferro; o resto se mede
// contra ele pelo preço e pela raridade que o conteúdo já tinha dado.
export const MATERIAIS: Material[] = [
  { item: 'minerio_de_ferro', rotulo: 'ferro', familia: 'metal', fator: 1.0 },
  { item: 'fio_de_prata', rotulo: 'prata', familia: 'metal', fator: 1.05 },
  { item: 'estilhaco_de_pedra', rotulo: 'pedra funda', familia: 'pedra', fator: 1.15 },
  { item: 'lasca_de_gargula', rotulo: 'gárgula', familia: 'pedra', fator: 1.3 },
  { item: 'osso_limpo', rotulo: 'osso', familia: 'osso', fator: 0.85 },
  { item: 'dente_lobo', rotulo: 'dente de lobo', familia: 'osso', fator: 0.95 },
  { item: 'garra_curva', rotulo: 'garra', familia: 'osso', fator: 1.0 },
  { item: 'couro_cru', rotulo: 'couro', familia: 'couro', fator: 1.0 },
  { item: 'escama_de_junco', rotulo: 'escama de junco', familia: 'couro', fator: 1.1 },
  { item: 'pele_de_urso', rotulo: 'pele de urso', familia: 'couro', fator: 1.25 },
];

// ── Catalisadores: infusão mística na têmpera ──────────────────────────────

export type Catalisador = {
  item: string;
  rotulo: string;
  propriedade: string;
  bonusDano?: number;
  bonusDefesa?: number;
  suprimeMana?: boolean;
  contraOni?: boolean;
};

/** Catalisadores raros retirados de bestas e relíquias que concedem propriedades especiais. */
export const CATALISADORES: Catalisador[] = [
  { item: 'anel_draupnir', rotulo: 'Draupnir', propriedade: 'suprimeMana', suprimeMana: true },
  { item: 'glandula_de_veneno', rotulo: 'glândula peçonhenta', propriedade: 'venenosa' },
  { item: 'cinza_de_mir', rotulo: 'cinza de Mir', propriedade: 'contraOni', contraOni: true },
  { item: 'unha_de_carnical', rotulo: 'unha de carniçal', propriedade: 'critica', bonusDano: 3 },
  { item: 'agua_do_espelho', rotulo: 'água do espelho', propriedade: 'espelhada', bonusDefesa: 2 },
];

/** O combustível. Uma medida por peça, sempre. */
export const COMBUSTIVEL = 'carvao';

/** Quanto tempo a peça leva: um dia e meio de bigorna. */
export const PERIODOS_PARA_FORJAR = 4;

/**
 * Teto da qualidade sobre o molde. Obra-prima de material raro chega a 145%;
 * nada passa disso. Existe para a forja não virar atalho na curva de poder.
 */
export const TETO_SOBRE_O_MOLDE = 1.45;

// ── Qualidade ─────────────────────────────────────────────────────────────

export type Qualidade = 'tosca' | 'honesta' | 'boa' | 'fina' | 'obra-prima';

export function rotuloDaQualidade(q: number): Qualidade {
  if (q < 0.8) return 'tosca';
  if (q < 0.95) return 'honesta';
  if (q < 1.08) return 'boa';
  if (q < 1.2) return 'fina';
  return 'obra-prima';
}

/**
 * Multiplicador de qualidade. Maestria 0 dá 0,7 (peça pior que a da loja);
 * maestria 100 dá 1,2. A variação do RNG é pequena de propósito — um aprendiz
 * com sorte faz peça honesta, não obra-prima.
 */
export function qualidadeDaMao(maestria: number, sorte: number): number {
  const base = 0.7 + Math.max(0, Math.min(100, maestria)) / 200;
  const variacao = (sorte - 0.5) * 0.16;
  return Math.max(0.6, Math.min(1.3, base + variacao));
}

// ── Onde se forja ─────────────────────────────────────────────────────────

const OFICIO_DE_FERREIRA = /ferreir|forj|armeir|bigorna/i;

/**
 * Forja-se num lugar de forja, ou onde houver uma ferreira presente que empreste
 * a bigorna. Devolve a ferreira, se houver: ela ensina enquanto você bate, e
 * é testemunha do que sai.
 */
export function ondeForjar(content: ContentBundle, camp: Campaign): { pode: boolean; ferreira?: NPC; motivo?: string } {
  const ctx = calcularContexto(content, camp);
  const ferreira = ctx.presentes.find(n => OFICIO_DE_FERREIRA.test(ocupacaoEfetiva(camp, n) ?? ''));
  // A fundição de Corveira (edifício regional) empresta o fogo da cidade.
  const instalacaoForja = ctx.local.tipo === 'forja' || ctx.local.pontos?.some(p => /ferraria|forja|bigorna/i.test(p)) || !!forjaDaCidade(content, camp);
  if (instalacaoForja || ferreira) return { pode: true, ferreira };
  return { pode: false, motivo: 'Não há forja aqui, nem ferreira que empreste a bigorna.' };
}

// ── Receitas possíveis agora ──────────────────────────────────────────────

export type Receita = { molde: Molde; material: Material; temMaterial: boolean };

/** Combinações válidas de molde e material, marcando o que já está na mochila. */
export function receitasDisponiveis(camp: Campaign): Receita[] {
  const inv = camp.personagem.inventario;
  const saida: Receita[] = [];
  for (const molde of MOLDES) {
    for (const material of MATERIAIS) {
      if (!molde.aceita.includes(material.familia)) continue;
      saida.push({ molde, material, temMaterial: (inv[material.item] ?? 0) >= molde.quantidade });
    }
  }
  return saida;
}

// ── A peça ────────────────────────────────────────────────────────────────

/**
 * Calcula o item. Função pura sobre (molde, material, qualidade): é a que o
 * teste usa para provar o teto, e a que garante que a mesma entrada dá sempre
 * a mesma peça.
 */
export function calcularPeca(
  molde: Molde,
  material: Material,
  q: number,
  id: string,
  ferreiroNome: string,
  catalisador?: Catalisador,
): Item {
  const fator = material.fator * q;
  const teto = TETO_SOBRE_O_MOLDE;
  const qualidade = rotuloDaQualidade(q);
  const adj = qualidade === 'obra-prima' ? 'obra-prima'
    : molde.genero === 'f'
      ? { tosca: 'tosca', honesta: 'honesta', boa: 'boa', fina: 'fina' }[qualidade]
      : { tosca: 'tosco', honesta: 'honesto', boa: 'bom', fina: 'fino' }[qualidade];

  const raridade: Item['raridade'] =
    qualidade === 'obra-prima' && material.fator >= 1.15 ? 'rara'
      : qualidade === 'obra-prima' || qualidade === 'fina' ? 'notavel'
        : 'comum';

  const sufixoCat = catalisador ? ` com ${catalisador.rotulo}` : '';
  const item: Item = {
    id,
    nome: `${molde.nome} de ${material.rotulo}${sufixoCat}, ${adj}`,
    descricao: `Forjad${molde.genero === 'f' ? 'a' : 'o'} por ${ferreiroNome}. Peça ${qualidade}${catalisador ? ` infundida com ${catalisador.rotulo}` : ''}.`,
    slot: molde.slot,
    peso: molde.peso,
    valor: Math.max(1, Math.round(molde.valorBase * fator * q * (catalisador ? 1.3 : 1))),
    raridade,
  };
  if (catalisador) {
    item.catalisador = catalisador.item;
    item.propriedadesEspeciais = [catalisador.propriedade];
    if (catalisador.suprimeMana) item.suprimeMana = true;
    if (catalisador.contraOni) item.contraOni = true;
  }
  if (molde.dano) {
    const danoBruto = Math.round(molde.dano.base * fator) + (catalisador?.bonusDano ?? 0);
    item.dano = {
      base: Math.max(1, Math.min(Math.round(molde.dano.base * teto), danoBruto)),
      dispersao: molde.dano.dispersao,
      tipo: molde.dano.tipo,
    };
    item.alcance = 'corpo';
    if (molde.atributoAtaque) item.atributoAtaque = molde.atributoAtaque;
  }
  if (molde.defesa !== undefined) {
    const defBruta = Math.round(molde.defesa * fator) + (catalisador?.bonusDefesa ?? 0);
    item.defesa = Math.max(1, Math.min(Math.round(molde.defesa * teto), defBruta));
  }
  return item;
}

// ── Forjar ────────────────────────────────────────────────────────────────

export type ResultadoForja = { ok: boolean; texto: string; item?: Item };

export function forjar(
  content: ContentBundle,
  camp: Campaign,
  moldeId: string,
  materialItem: string,
  catalisadorItem?: string,
): ResultadoForja {
  const p = camp.personagem;
  if (camp.combate && !camp.combate.terminado) return { ok: false, texto: 'Termine o combate primeiro.' };
  const molde = MOLDES.find(m => m.id === moldeId);
  const material = MATERIAIS.find(m => m.item === materialItem);
  if (!molde || !material) return { ok: false, texto: 'Essa peça não se faz assim.' };
  if (!molde.aceita.includes(material.familia)) {
    return { ok: false, texto: `${molde.nome} não se faz de ${material.rotulo}.` };
  }

  let catalisador: Catalisador | undefined;
  if (catalisadorItem) {
    catalisador = CATALISADORES.find(c => c.item === catalisadorItem);
    if (!catalisador) return { ok: false, texto: 'Catalisador desconhecido pela forja.' };
    if ((p.inventario[catalisador.item] ?? 0) < 1) {
      return { ok: false, texto: `Falta catalisador: você não tem ${catalisador.rotulo}.` };
    }
  }

  const onde = ondeForjar(content, camp);
  if (!onde.pode) return { ok: false, texto: onde.motivo! };
  const semCarvao = !!forjaDaCidade(content, camp)?.efeitos.forjaSemCarvao;
  if (!semCarvao && (p.inventario[COMBUSTIVEL] ?? 0) < 1) {
    return { ok: false, texto: 'Sem carvão a forja é só uma pedra vazia.' };
  }
  if ((p.inventario[material.item] ?? 0) < molde.quantidade) {
    return { ok: false, texto: `Faltam ${material.rotulo}: a peça pede ${molde.quantidade}.` };
  }

  // O que entra na forja não volta.
  if (!semCarvao) p.inventario[COMBUSTIVEL] -= 1;
  p.inventario[material.item] -= molde.quantidade;
  if (catalisador) {
    p.inventario[catalisador.item] -= 1;
    if (p.inventario[catalisador.item] <= 0) {
      delete p.inventario[catalisador.item];
    }
  }

  // A qualidade é da mão, medida ANTES de a peça treinar a mão: a lição desta
  // bigorna vale para a próxima peça, não para esta.
  const q = qualidadeDaMao(maestriaDe(camp, 'oficio'), nextFloat(camp.rng));
  const lista = (p.itensForjados ??= []);
  const id = `forjado_${lista.length + 1}`;
  const item = calcularPeca(molde, material, q, id, p.nome, catalisador);
  lista.push(item);
  p.inventario[id] = (p.inventario[id] ?? 0) + 1;

  // Forjar treina o ofício. Com ferreira do lado, aprende-se muito mais.
  treinar(content, camp, 'oficio', {
    mestre: onde.ferreira ? 0.75 : 0.3,
    esforco: 0.85,
    recursos: Math.min(1, material.fator - 0.2),
    observadorId: onde.ferreira?.id,
  });

  // Quem viu a peça sair sabe o que você faz com as mãos.
  const qualidade = rotuloDaQualidade(q);
  const testemunhas = calcularContexto(content, camp).presentes;
  if (testemunhas.length) {
    registrarDemonstracao(content, camp, {
      dominio: 'oficio',
      dificuldade: Math.round(40 + material.fator * 30 + (q - 1) * 100),
      sucesso: qualidade !== 'tosca',
      testemunhas,
    });
  }
  if (qualidade === 'obra-prima') {
    registrarMarco(camp, `você forjou uma obra-prima: ${item.nome}`);
    if (camp.vivo) {
      registrarFato(camp, {
        tipo: 'obra_prima',
        local: camp.localAtual,
        texto: `Saiu da bigorna uma peça que as ferreiras vão comentar: ${item.nome}.`,
        atores: ['jogador'],
        publico: true,
      });
    }
  }

  camp.calendario = avancarPeriodos(camp.calendario, PERIODOS_PARA_FORJAR);
  crescerImpulsos(camp, PERIODOS_PARA_FORJAR);
  camp.capitulo.periodosDecorridos += PERIODOS_PARA_FORJAR;
  avancarMundo(content, camp);

  const detalhe = item.dano ? `dano ${item.dano.base}` : `defesa ${item.defesa}`;
  return {
    ok: true,
    item,
    texto: `Você forja ${item.nome.toLowerCase()} (${detalhe}).`,
  };
}

// ── Desmanche de Espólios ─────────────────────────────────────────────────

export type ResultadoDesmanche = { ok: boolean; texto: string; materialDevolvido?: { item: string; qtd: number } };

export function desmanchar(
  content: ContentBundle,
  camp: Campaign,
  itemId: string,
): ResultadoDesmanche {
  const p = camp.personagem;
  if (camp.combate && !camp.combate.terminado) return { ok: false, texto: 'Termine o combate primeiro.' };

  const onde = ondeForjar(content, camp);
  if (!onde.pode) return { ok: false, texto: onde.motivo! };

  if ((p.inventario[itemId] ?? 0) < 1) {
    return { ok: false, texto: 'Você não tem essa peça no inventário.' };
  }

  if (p.equipado.arma === itemId || p.equipado.armadura === itemId || p.equipado.escudo === itemId || p.equipado.acessorio === itemId) {
    return { ok: false, texto: 'Desequipe a peça antes de desmanchá-la.' };
  }

  const it = itemPorId(content, itemId, p);
  if (!it) return { ok: false, texto: 'Peça não encontrada.' };

  if (it.raridade === 'unica' || it.raridade === 'mitica' || it.contraOni || it.id.includes('nichirin')) {
    return { ok: false, texto: 'Esta peça tem natureza sagrada ou imutável e não pode ser desmanchada.' };
  }

  if (it.slot !== 'arma' && it.slot !== 'armadura' && it.slot !== 'escudo') {
    return { ok: false, texto: 'Apenas armas, armaduras e escudos podem ser desmanchados na bigorna.' };
  }

  // Identificar material devolvido
  let materialId = 'minerio_de_ferro';
  let qtd = 1;

  const nomeMinusculo = it.nome.toLowerCase();
  if (nomeMinusculo.includes('de prata') || it.id.includes('prata')) {
    materialId = 'fio_de_prata';
  } else if (nomeMinusculo.includes('de gárgula') || it.id.includes('gargula')) {
    materialId = 'lasca_de_gargula';
  } else if (nomeMinusculo.includes('de pedra funda') || it.id.includes('pedra')) {
    materialId = 'estilhaco_de_pedra';
  } else if (nomeMinusculo.includes('de osso') || it.id.includes('osso')) {
    materialId = 'osso_limpo';
  } else if (nomeMinusculo.includes('de dente de lobo') || it.id.includes('dente')) {
    materialId = 'dente_lobo';
  } else if (nomeMinusculo.includes('de garra') || it.id.includes('garra')) {
    materialId = 'garra_curva';
  } else if (nomeMinusculo.includes('de pele de urso') || it.id.includes('urso')) {
    materialId = 'pele_de_urso';
  } else if (nomeMinusculo.includes('de escama de junco') || it.id.includes('junco')) {
    materialId = 'escama_de_junco';
  } else if (nomeMinusculo.includes('couro') || it.id.includes('gibao') || (it.slot === 'armadura' && it.peso <= 5)) {
    materialId = 'couro_cru';
  } else {
    materialId = 'minerio_de_ferro';
    if (it.peso >= 6) {
      qtd = 2;
    }
  }

  // Consumir peça
  p.inventario[itemId] = (p.inventario[itemId] ?? 1) - 1;
  if (p.inventario[itemId] <= 0) {
    delete p.inventario[itemId];
  }
  if (p.itensForjados) {
    p.itensForjados = p.itensForjados.filter(f => f.id !== itemId);
  }

  // Entregar sucata/material
  p.inventario[materialId] = (p.inventario[materialId] ?? 0) + qtd;

  // Treino e tempo
  treinar(content, camp, 'oficio', {
    mestre: onde.ferreira ? 0.35 : 0.15,
    esforco: 0.4,
    recursos: 0.3,
    observadorId: onde.ferreira?.id,
  });

  camp.calendario = avancarPeriodos(camp.calendario, 1);
  crescerImpulsos(camp, 1);
  camp.capitulo.periodosDecorridos += 1;
  avancarMundo(content, camp);

  const matItem = itemPorId(content, materialId, p);
  const matNome = matItem?.nome ?? materialId;
  return {
    ok: true,
    texto: `Você desmancha ${it.nome} na bigorna e recupera ${qtd}× ${matNome}.`,
    materialDevolvido: { item: materialId, qtd },
  };
}

// ── Afiação & Têmpera ─────────────────────────────────────────────────────

export type ResultadoTempera = { ok: boolean; texto: string; item?: Item };

export function temperar(
  content: ContentBundle,
  camp: Campaign,
  itemId: string,
): ResultadoTempera {
  const p = camp.personagem;
  if (camp.combate && !camp.combate.terminado) return { ok: false, texto: 'Termine o combate primeiro.' };

  const onde = ondeForjar(content, camp);
  if (!onde.pode) return { ok: false, texto: onde.motivo! };

  if ((p.inventario[COMBUSTIVEL] ?? 0) < 1) {
    return { ok: false, texto: 'Sem carvão a forja é só uma pedra vazia.' };
  }

  // O item precisa estar no inventário OU equipado pelo jogador
  const estaEquipado = p.equipado.arma === itemId || p.equipado.armadura === itemId || p.equipado.escudo === itemId;
  const temNoInventario = (p.inventario[itemId] ?? 0) >= 1;
  if (!estaEquipado && !temNoInventario) {
    return { ok: false, texto: 'Você não tem essa peça à mão.' };
  }

  const it = itemPorId(content, itemId, p);
  if (!it) return { ok: false, texto: 'Peça não encontrada.' };

  if (it.slot !== 'arma' && it.slot !== 'armadura' && it.slot !== 'escudo') {
    return { ok: false, texto: 'Apenas armas (afiação) ou armaduras e escudos (têmpera) podem ser preparados na bigorna.' };
  }

  // Consome 1 carvão
  p.inventario[COMBUSTIVEL] -= 1;

  // Se o item já está em itensForjados, muta a instância do jogador
  let itemAlvo = p.itensForjados?.find(i => i.id === itemId);
  if (!itemAlvo) {
    // É um item do catálogo: clona para itensForjados para isolar a instância
    const lista = (p.itensForjados ??= []);
    const novoId = `${itemId}_custom_${lista.length + 1}`;
    itemAlvo = { ...it, id: novoId };
    lista.push(itemAlvo);

    // Ajusta referências
    if (temNoInventario) {
      p.inventario[itemId] = (p.inventario[itemId] ?? 1) - 1;
      if (p.inventario[itemId] <= 0) delete p.inventario[itemId];
      p.inventario[novoId] = 1;
    }
    for (const slot of ['arma', 'armadura', 'escudo'] as const) {
      if (p.equipado[slot] === itemId) {
        p.equipado[slot] = novoId;
      }
    }
  }

  let mensagem = '';
  if (itemAlvo.slot === 'arma') {
    itemAlvo.afiacao = { cargas: 5, bonusDano: 2 };
    mensagem = `Você afia ${itemAlvo.nome} no rebolo (+2 de dano pelos próximos 5 combates).`;
  } else {
    itemAlvo.tempera = { cargas: 5, bonusDefesa: 2 };
    mensagem = `Você tempera ${itemAlvo.nome} no banho de salmoura (+2 de defesa pelos próximos 5 combates).`;
  }

  treinar(content, camp, 'oficio', {
    mestre: onde.ferreira ? 0.45 : 0.2,
    esforco: 0.5,
    recursos: 0.4,
    observadorId: onde.ferreira?.id,
  });

  camp.calendario = avancarPeriodos(camp.calendario, 1);
  crescerImpulsos(camp, 1);
  camp.capitulo.periodosDecorridos += 1;
  avancarMundo(content, camp);

  return { ok: true, texto: mensagem, item: itemAlvo };
}
