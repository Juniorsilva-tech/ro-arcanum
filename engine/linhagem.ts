// ARCANUM · A linhagem do jogador: herdeiros com traço, sucessão e a fama do
// nome da família.
//
// O casamento, a gestação e o nascimento já existiam no feudo
// (engine/reino.ts), mas o filho era só uma ficha, e o jogador nunca morria de
// verdade: a velhice o deixava "agonizante" para sempre. Aqui:
// - todo herdeiro nasce com um TRAÇO (nascido para o combate, curioso,
//   calmo, encantador, olhos de falcão, mão firme), que pesa nos atributos;
// - quando o jogador morre de velhice, ou passa o legado em vida, o herdeiro
//   aparente assume: a campanha continua com ele, com a herança (dinheiro,
//   mochila, feudo) e com as contas da geração anterior (quem gostava ou
//   odiava o pai lembra do nome, pela metade);
// - o NOME da família ganha fama pelo que se fez em público em cada lugar, e
//   essa fama atravessa gerações: abre um desconto no comércio onde o nome é
//   falado, e o narrador sabe dela.
//
// Regra do jogo: o protagonista é homem; só um filho assume a campanha.
import type { Atributos, Campaign, ContentBundle, FilhoHerdeiro } from './types';
import { createRng, nextInt, seedFromString } from './rng';
import { criarPersonagem, atributosBase } from './character';
import { registrarMarco } from './memoria';
import { registrarFato } from './historiaViva';
import { recalcularRecursosMaximos } from './progresso';
import { escolherSucessorPelaCorte, VOCACOES_HERDEIRO } from './reino';

export type TracoHerdeiro = { id: string; nome: string; atributo: keyof Atributos };

export const TRACOS_HERDEIRO: TracoHerdeiro[] = [
  { id: 'nascido_para_o_combate', nome: 'nascido para o combate', atributo: 'fisico' },
  { id: 'mao_firme', nome: 'mão firme', atributo: 'precisao' },
  { id: 'calmo_demais', nome: 'calmo demais', atributo: 'resiliencia' },
  { id: 'curioso', nome: 'curioso de tudo', atributo: 'raciocinio' },
  { id: 'olhos_de_falcao', nome: 'olhos de falcão', atributo: 'percepcao' },
  { id: 'encantador', nome: 'encantador', atributo: 'social' },
];

/** O traço do filho, decidido pelo nascimento (sorteio derivado, sem gastar o RNG da campanha). */
export function tracoDoHerdeiro(camp: Campaign, filho: Pick<FilhoHerdeiro, 'id'>): TracoHerdeiro {
  const rng = createRng((camp.rng.seed ^ seedFromString(`traco:${filho.id}`)) >>> 0);
  return TRACOS_HERDEIRO[nextInt(rng, 0, TRACOS_HERDEIRO.length - 1)];
}

export const IDADE_PARA_SUCEDER = 16;

/**
 * Retorna o herdeiro aparente:
 * 1. O filho ou filha expressamente proclamado pelo jogador como herdeiro aparente;
 * 2. Se o jogador não designou, a escolha deliberada pela corte e conselho de oficiais;
 * 3. Fallback natural: primogênito vivo.
 */
export function herdeiroAparente(camp: Campaign): FilhoHerdeiro | undefined {
  const f = camp.feudo;
  if (!f?.filhosHerdeiros?.length) return undefined;
  const vivos = f.filhosHerdeiros.filter((x) => x.vivo);
  if (vivos.length === 0) return undefined;

  // 1. Escolha expressa do jogador
  if (f.herdeiroAparenteId) {
    const designado = vivos.find((x) => x.id === f.herdeiroAparenteId);
    if (designado) return designado;
  }

  // 2. Deliberação da corte e conselho
  const daCorte = escolherSucessorPelaCorte(camp).herdeiro;
  if (daCorte) return daCorte;

  // 3. Primogênito vivo
  return [...vivos].sort((a, b) => a.diaNascimento - b.diaNascimento)[0];
}

export function podeSuceder(
  camp: Campaign,
  herdeiroId?: string,
): { pode: boolean; motivo?: string; herdeiro?: FilhoHerdeiro; sobRegencia?: boolean } {
  const f = camp.feudo;
  const vivos = f?.filhosHerdeiros?.filter((x) => x.vivo) ?? [];
  const h = herdeiroId
    ? vivos.find((x) => x.id === herdeiroId)
    : herdeiroAparente(camp);

  if (!h) return { pode: false, motivo: 'não há filho vivo para herdar' };
  if (h.idadeAnos === 0) return { pode: false, motivo: `${h.nome} é recém-nascido no berço; não pode assumir o feudo` };

  // Se o herdeiro tiver menos de 16 anos, ele pode assumir sob regência do conselho
  if (h.idadeAnos < IDADE_PARA_SUCEDER) {
    return {
      pode: true,
      herdeiro: h,
      sobRegencia: true,
      motivo: `${h.nome} tem ${h.idadeAnos} anos; assume sob regência da corte até os ${IDADE_PARA_SUCEDER}`,
    };
  }
  return { pode: true, herdeiro: h, sobRegencia: false };
}

/**
 * O herdeiro assume a campanha. Motivo 'morte' (velhice) ou 'legado' (o pai
 * passa o nome em vida e sai de cena). O herdeiro pode ser escolhido expressamente
 * pelo jogador (inclusive o mais jovem ou filha com perfil único) ou pela corte.
 */
export function assumirLegado(
  content: ContentBundle,
  camp: Campaign,
  motivo: 'morte' | 'legado',
  herdeiroIdEscolhido?: string,
): { ok: boolean; texto: string } {
  const suc = podeSuceder(camp, herdeiroIdEscolhido);
  if (!suc.pode) return { ok: false, texto: suc.motivo! };
  const h = suc.herdeiro!;
  const pai = camp.personagem;
  const classe = content.classes.find((c) => c.id === pai.classeId) ?? content.classes[0];
  const origem = content.origens.find((o) => o.id === pai.origemId) ?? content.origens[0];

  // O pai entra para a história da família.
  (camp.linhagem ??= []).push({
    nome: pai.nome,
    idade: pai.idade ?? 0,
    nivel: pai.nivel,
    alcunhas: [...pai.alcunhas],
    fim: motivo,
    dia: camp.calendario.dia,
  });

  // O filho, com o traço de nascimento e seus atributos orgânicos (estrategista, combatente, etc.)
  const traco = tracoDoHerdeiro(camp, h);
  const atributos: Atributos = { ...atributosBase(), ...h.atributos };
  atributos[traco.atributo] += 2;
  const primeiroNome = h.nome.split(' ')[0];
  const novo = criarPersonagem(primeiroNome, atributos, classe, origem, content.cenario);
  novo.idade = h.idadeAnos;
  novo.genero = h.genero ?? 'm';

  // A herança: o que era do pai fica na família (um décimo vai no enterro e no selo do escrivão).
  novo.dinheiro = Math.floor(pai.dinheiro * 0.9);
  novo.inventario = { ...pai.inventario };
  novo.equipado = { ...pai.equipado };
  novo.itensForjados = pai.itensForjados ? [...pai.itensForjados] : undefined;

  const parentesco = h.genero === 'f' ? `filha de ${pai.nome}` : `filho de ${pai.nome}`;
  novo.alcunhas = [parentesco, traco.nome];
  if (h.vocacao) {
    const infoVoc = VOCACOES_HERDEIRO.find((v) => v.id === h.vocacao);
    if (infoVoc) novo.alcunhas.push(infoVoc.nome);
  }
  if (suc.sobRegencia) {
    novo.alcunhas.push('soberano jovem (sob regência)');
  }

  camp.personagem = novo;
  recalcularRecursosMaximos(camp);
  novo.recursos.vida = novo.recursosMax.vida;

  // O mundo lembra do nome, não da pessoa: a opinião de cada um sobre a
  // família fica pela metade, e as lembranças eram do pai.
  for (const id of Object.keys(camp.npcState)) {
    const din = camp.npcState[id];
    for (const eixo of Object.keys(din.eixos ?? {})) din.eixos[eixo] = Math.round(din.eixos[eixo] / 2);
    din.memoria = [];
  }
  camp.sabemSeuNome = [];
  h.vivo = true;
  if (camp.feudo) camp.feudo.filhosHerdeiros = camp.feudo.filhosHerdeiros?.filter((x) => x.id !== h.id);

  // Registro histórico distinguindo se foi escolha direta do jogador ou aclamação da corte
  const foiEscolhaJogador = !!herdeiroIdEscolhido || camp.feudo?.herdeiroAparenteId === h.id;
  const perfilDesc = h.inclinacao ? ` (${h.inclinacao})` : '';
  const notaRegencia = suc.sobRegencia ? ' Assume como jovem soberano sob regência da corte até a maioridade.' : '';

  let texto = '';
  if (foiEscolhaJogador) {
    texto = motivo === 'morte'
      ? `${pai.nome} morreu aos ${pai.idade} anos. Por seu decreto formal em vida, escolheu ${primeiroNome}, ${traco.nome}${perfilDesc}, para herdar o feudo e a linhagem.${notaRegencia}`
      : `${pai.nome} escolheu passar o nome e a coroa a ${primeiroNome}, ${traco.nome}${perfilDesc}.${notaRegencia}`;
  } else {
    const decisaoCorte = escolherSucessorPelaCorte(camp);
    texto = `${pai.nome} faleceu sem herdeiro expressamente proclamado. A Corte e o Conselho deliberaram e ${decisaoCorte.motivo}: ${primeiroNome}, ${traco.nome}${perfilDesc}, assumiu a linhagem da Casa Dinástica.${notaRegencia}`;
  }

  registrarMarco(camp, texto);
  if (camp.vivo) registrarFato(camp, { tipo: 'sucessao', local: camp.localAtual, texto, atores: ['jogador'], publico: true });
  return { ok: true, texto };
}

// ── A fama do nome ─────────────────────────────────────────────────────────

/** Soma um ponto de fama ao nome da família no lugar (feito público do jogador). */
export function afamarNome(camp: Campaign, localId: string, pontos = 1): void {
  const r = (camp.renomeDoNome ??= {});
  r[localId] = (r[localId] ?? 0) + pontos;
}

export type FamaDoNome = 'desconhecido' | 'conhecido' | 'falado' | 'lendario';

/** Fama do nome na região do lugar (soma dos lugares da região). */
export function famaDoNome(content: ContentBundle, camp: Campaign, localId = camp.localAtual): { nivel: FamaDoNome; pontos: number } {
  const regiao = content.locais.find((l) => l.id === localId)?.regiao;
  const pontos = Object.entries(camp.renomeDoNome ?? {})
    .filter(([id]) => content.locais.find((l) => l.id === id)?.regiao === regiao)
    .reduce((s, [, v]) => s + v, 0);
  const nivel: FamaDoNome = pontos >= 40 ? 'lendario' : pontos >= 15 ? 'falado' : pontos >= 5 ? 'conhecido' : 'desconhecido';
  return { nivel, pontos };
}

/** Onde o nome é falado, o comércio faz preço de família conhecida. */
export function descontoDoNome(content: ContentBundle, camp: Campaign): number {
  const n = famaDoNome(content, camp).nivel;
  return n === 'lendario' ? 0.9 : n === 'falado' ? 0.95 : 1;
}

/** O sobrenome que o vale usa: a casa dinástica, se houver, senão "os de <nome do fundador>". */
export function sobrenome(camp: Campaign): string {
  const casa = camp.feudo?.casaDinastica?.nome;
  if (casa) return `Casa ${casa}`;
  const fundador = camp.linhagem?.[0]?.nome ?? camp.personagem.nome;
  return `os de ${fundador}`;
}
