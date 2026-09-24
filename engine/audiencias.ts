// ARCANUM · Audiências da colônia (sessão 58, etapa D).
//
// No estilo de *Yes, Your Grace*: de tempos em tempos alguém pede para ser
// ouvido. O pedido nasce do ESTADO da colônia — duas colonas briguentas de
// mau humor, celeiro baixo, furto quando a guarda é fraca, mercador quando
// passa gente, casamento quando duas pessoas estão bem —, nunca de uma tabela
// solta. Cada pedido tem escolhas com custo e consequência em recursos, humor,
// ordem e renome. Ignorar também é escolha: o pedido vence e cobra o preço.
//
// Uma audiência por vez. O sorteio usa RNG derivado do dia, como o resto da
// colônia: não consome o RNG da campanha.
import type { Campaign, ContentBundle, FeudoState } from './types';
import type { Colono } from './colonos';
import { createRng, nextFloat, seedFromString, type RngState } from './rng';
import { ANIMAIS, totalDeAnimais, type AnimalColonia } from './rebanhos';
import { sitioDe } from './colonia';
import { registrarMarco } from './memoria';

export type TipoAudiencia = 'briga' | 'fome' | 'mercador' | 'furto' | 'casamento' | 'ferramentas';

export type OpcaoAudiencia = {
  id: string;
  rotulo: string;
  /** O que acontece, dito antes da escolha — a tela mostra; a regra cumpre. */
  efeito: string;
};

export type Audiencia = {
  id: string;
  tipo: TipoAudiencia;
  dia: number;
  /** Até quando espera resposta. */
  ate: number;
  texto: string;
  opcoes: OpcaoAudiencia[];
  /** Colonos envolvidos (ids). */
  envolvidos: string[];
  /** Números fixados na hora do pedido, para a escolha cobrar o que prometeu. */
  valores: Record<string, number>;
};

/** A cada quantos dias, no mínimo, alguém pede audiência. */
export const INTERVALO_AUDIENCIA = 3;
export const DIAS_PARA_RESPONDER = 3;

function rngDe(camp: Campaign, chave: string): RngState {
  return createRng((camp.rng.seed ^ seedFromString(`audiencia:${chave}:${camp.calendario.dia}`)) >>> 0);
}

const primeiro = (nome: string) => nome.split(' ')[0];
const colonos = (f: FeudoState) => f.colonos ?? [];
const porId = (f: FeudoState, id: string) => colonos(f).find(c => c.id === id);
const mexerHumor = (c: Colono | undefined, d: number) => { if (c) c.humor = Math.max(0, Math.min(100, c.humor + d)); };
const mexerTodos = (f: FeudoState, d: number) => { for (const c of colonos(f)) mexerHumor(c, d); };
const renome = (f: FeudoState, d: number) => { f.renome = Math.max(0, Math.min(200, (f.renome ?? 0) + d)); };
const unir = (x?: Colono, y?: Colono) => { if (x && y) { x.conjuge = y.id; y.conjuge = x.id; } };
const ordem = (f: FeudoState, d: number) => { f.estabilidade = Math.max(0, Math.min(100, f.estabilidade + d)); };

// ── Quem pede ─────────────────────────────────────────────────────────────

type Contexto = { passagem: number };
type Gerador = (f: FeudoState, camp: Campaign, rng: RngState, ctx: Contexto) => Omit<Audiencia, 'id' | 'dia' | 'ate'> | undefined;

const GERADORES: Record<TipoAudiencia, Gerador> = {
  briga: (f) => {
    const briguentas = colonos(f).filter(c => c.temperamento === 'briguenta' || c.humor < 35);
    if (briguentas.length < 2) return undefined;
    const [a, b] = [...briguentas].sort((x, y) => x.humor - y.humor);
    return {
      tipo: 'briga', envolvidos: [a.id, b.id], valores: {},
      texto: `${a.nome} e ${b.nome} brigaram na frente do poço, e a colônia inteira viu. Cada uma quer que você diga quem tinha razão.`,
      opcoes: [
        { id: 'a', rotulo: `Dar razão a ${primeiro(a.nome)}`, efeito: `${primeiro(a.nome)} fica mais contente e leal; ${primeiro(b.nome)} fica ressentida.` },
        { id: 'b', rotulo: `Dar razão a ${primeiro(b.nome)}`, efeito: `${primeiro(b.nome)} fica mais contente e leal; ${primeiro(a.nome)} fica ressentida.` },
        { id: 'mediar', rotulo: 'Sentar as duas à mesma mesa', efeito: 'As duas melhoram um pouco; a ordem sobe. Custa 5 de ouro em vinho.' },
        { id: 'punir', rotulo: 'Castigar as duas', efeito: 'A ordem sobe bem; as duas ficam de mau humor.' },
      ],
    };
  },
  fome: (f) => {
    if (f.comida >= f.populacao * 4) return undefined;
    const preco = Math.max(10, Math.round(f.populacao * 2));
    return {
      tipo: 'fome', envolvidos: [], valores: { preco, grao: f.populacao * 3 },
      texto: `O celeiro está no fundo: ${Math.floor(f.comida)} de comida para ${f.populacao} bocas. As mais velhas pedem que você decida antes que a fome decida por você.`,
      opcoes: [
        { id: 'comprar', rotulo: `Comprar grão (${preco} de ouro)`, efeito: `Entram ${f.populacao * 3} de comida no celeiro.` },
        { id: 'racionar', rotulo: 'Racionar', efeito: 'Por dez dias a colônia come 60% do normal, e todo mundo fica de pior humor.' },
        ...(totalDeAnimais(f) > 0 ? [{ id: 'abater', rotulo: 'Abater parte do rebanho', efeito: 'Carne no celeiro agora; menos animal amanhã.' }] : []),
      ],
    };
  },
  mercador: (f, camp, rng, ctx) => {
    // Mercador só para onde passa gente: sítio isolado quase não vê carroça.
    if (!ctx.passagem || nextFloat(rng) > ctx.passagem / 3) return undefined;
    const material = 30, ouro = 20 + Math.floor(nextFloat(rng) * 15);
    return {
      tipo: 'mercador', envolvidos: [], valores: { material, ouro, comida: 25, precoComida: 18 },
      texto: 'Um mercador de passagem parou a carroça no portão. Compra material de construção, vende grão, e não gosta de esperar.',
      opcoes: [
        { id: 'vender', rotulo: `Vender ${material} de material por ${ouro} de ouro`, efeito: `Sai ${material} de material, entra ${ouro} de ouro.` },
        { id: 'comprar', rotulo: 'Comprar 25 de grão por 18 de ouro', efeito: 'Entra comida, sai ouro.' },
        { id: 'recusar', rotulo: 'Mandar seguir viagem', efeito: 'Nada muda.' },
      ],
    };
  },
  furto: (f) => {
    if (f.seguranca >= 45 || colonos(f).length === 0) return undefined;
    const suspeita = [...colonos(f)].sort((x, y) => x.lealdade - y.lealdade)[0];
    const sumiu = Math.min(Math.floor(f.comida * 0.1), 20);
    if (sumiu < 3) return undefined;
    return {
      tipo: 'furto', envolvidos: [suspeita.id], valores: { sumiu },
      texto: `Sumiram ${sumiu} de comida do celeiro durante a noite. Todo mundo olha para ${suspeita.nome}, que jura que não foi.`,
      opcoes: [
        { id: 'expulsar', rotulo: `Expulsar ${primeiro(suspeita.nome)}`, efeito: 'Ela vai embora; a ordem sobe; a estrada fica sabendo que aqui se expulsa gente.' },
        { id: 'perdoar', rotulo: 'Perdoar sem provas', efeito: `${primeiro(suspeita.nome)} fica grata e leal; a ordem cai um pouco.` },
        { id: 'vigia', rotulo: 'Pôr vigia no celeiro (10 de ouro)', efeito: 'A segurança sobe; ninguém é acusado.' },
      ],
    };
  },
  casamento: (f) => {
    const felizes = colonos(f).filter(c => c.humor >= 70 && c.idade >= 18 && !c.conjuge);
    if (felizes.length < 2) return undefined;
    const [a, b] = felizes;
    return {
      tipo: 'casamento', envolvidos: [a.id, b.id], valores: { festa: 15 },
      texto: `${a.nome} e ${b.nome} querem se unir diante da colônia e pedem a sua bênção.`,
      opcoes: [
        { id: 'festa', rotulo: 'Abençoar com festa (15 de comida)', efeito: 'Todo mundo fica de melhor humor e a estrada comenta. Custa comida.' },
        { id: 'simples', rotulo: 'Abençoar sem festa', efeito: 'As duas ficam felizes; o resto nem percebe.' },
        { id: 'negar', rotulo: 'Negar', efeito: 'As duas ficam de mau humor e menos leais.' },
      ],
    };
  },
  ferramentas: (f) => {
    const oficineira = colonos(f).find(c => c.funcao === 'obras' || c.funcao === 'oficina');
    if (!oficineira || f.materiais < 30) return undefined;
    return {
      tipo: 'ferramentas', envolvidos: [oficineira.id], valores: { custo: 25 },
      texto: `${oficineira.nome} pede material para fazer ferramentas novas: diz que com as de agora a obra anda pela metade.`,
      opcoes: [
        { id: 'dar', rotulo: 'Dar o material (25)', efeito: 'As obras em andamento adiantam um dia; ela fica contente.' },
        { id: 'negar', rotulo: 'Negar', efeito: 'Ela fica de mau humor.' },
      ],
    };
  },
};

const ORDEM_DOS_PEDIDOS: TipoAudiencia[] = ['fome', 'briga', 'furto', 'casamento', 'ferramentas', 'mercador'];

/**
 * Talvez chegue um pedido hoje. Chamado no dia da colônia. Urgência primeiro
 * (fome, briga, furto); o resto conforme o sorteio do dia.
 */
export function talvezAudiencia(content: ContentBundle, camp: Campaign): Audiencia | undefined {
  const f = camp.feudo!;
  const dia = camp.calendario.dia;
  const pendente = f.audiencia;
  if (pendente && pendente.ate <= dia) {
    // Ignorado: quem pediu e não foi ouvido espalha que o senhor não ouve.
    ordem(f, -3);
    renome(f, -1);
    for (const id of pendente.envolvidos) mexerHumor(porId(f, id), -10);
    f.historicoEventos.push({ dia, texto: `Ninguém respondeu ao pedido (${pendente.tipo}). A colônia notou.` });
    f.audiencia = undefined;
  }
  if (f.audiencia || dia - (f.ultimaAudiencia ?? -99) < INTERVALO_AUDIENCIA) return undefined;
  const rng = rngDe(camp, 'qual');
  if (nextFloat(rng) > 0.6) return undefined;
  const inicio = Math.floor(nextFloat(rng) * 3);
  const ordemTentativa = [...ORDEM_DOS_PEDIDOS.slice(0, 3), ...rotacionar(ORDEM_DOS_PEDIDOS.slice(3), inicio)];
  for (const tipo of ordemTentativa) {
    const p = GERADORES[tipo](f, camp, rng, { passagem: sitioDe(content, f.sitio)?.terreno.passagem ?? 0 });
    if (!p) continue;
    const seq = (f.seqAudiencias = (f.seqAudiencias ?? 0) + 1);
    const a: Audiencia = { ...p, id: `audiencia_${seq}`, dia, ate: dia + DIAS_PARA_RESPONDER };
    f.audiencia = a;
    f.ultimaAudiencia = dia;
    // O furto já aconteceu quando alguém vem contar.
    if (a.tipo === 'furto') f.comida = Math.max(0, f.comida - (a.valores.sumiu ?? 0));
    return a;
  }
  return undefined;
}

function rotacionar<T>(xs: T[], n: number): T[] {
  return xs.map((_, i) => xs[(i + n) % xs.length]);
}

// ── A decisão ─────────────────────────────────────────────────────────────

export function resolverAudiencia(camp: Campaign, opcaoId: string): { ok: boolean; mensagem: string } {
  const f = camp.feudo;
  const a = f?.audiencia;
  if (!f || !a) return { ok: false, mensagem: 'Ninguém está pedindo audiência.' };
  const opcao = a.opcoes.find(o => o.id === opcaoId);
  if (!opcao) return { ok: false, mensagem: 'Essa resposta não cabe a esse pedido.' };
  const [x, y] = a.envolvidos.map(id => porId(f, id));
  const v = a.valores;
  let texto = '';
  const falta = (o: string) => ({ ok: false, mensagem: `Não há ${o} para isso.` });

  switch (`${a.tipo}:${opcaoId}`) {
    case 'briga:a': mexerHumor(x, 15); if (x) x.lealdade = Math.min(100, x.lealdade + 8); mexerHumor(y, -20); texto = `Você deu razão a ${x?.nome}.`; break;
    case 'briga:b': mexerHumor(y, 15); if (y) y.lealdade = Math.min(100, y.lealdade + 8); mexerHumor(x, -20); texto = `Você deu razão a ${y?.nome}.`; break;
    case 'briga:mediar':
      if (f.tesouro < 5) return falta('ouro');
      f.tesouro -= 5; mexerHumor(x, 8); mexerHumor(y, 8); ordem(f, 3); texto = 'As duas saíram da mesa sem se abraçar, mas saíram juntas.'; break;
    case 'briga:punir': mexerHumor(x, -15); mexerHumor(y, -15); ordem(f, 6); texto = 'O castigo foi público. Ninguém mais briga perto do poço — por enquanto.'; break;

    case 'fome:comprar':
      if (f.tesouro < v.preco) return falta('ouro');
      f.tesouro -= v.preco; f.comida += v.grao; texto = `Chegou grão: ${v.grao} de comida no celeiro.`; break;
    case 'fome:racionar': f.racionamentoAte = camp.calendario.dia + 10; mexerTodos(f, -8); texto = 'Meia ração por dez dias. Ninguém gostou, e ninguém morreu.'; break;
    case 'fome:abater': {
      const reb = f.rebanhos ?? {};
      // Abate o que dá mais carne por cabeça primeiro, pela ficha do animal.
      const especie = (Object.keys(reb) as AnimalColonia[])
        .filter(e => (reb[e] ?? 0) > 0 && ANIMAIS[e]?.carne > 0)
        .sort((m, n) => ANIMAIS[n].carne - ANIMAIS[m].carne)[0];
      if (!especie) return falta('animal para abater');
      const carne = ANIMAIS[especie].carne;
      const n = Math.min(reb[especie], Math.max(1, Math.ceil((f.populacao * 3) / carne)));
      reb[especie] -= n; if (!reb[especie]) delete reb[especie];
      f.comida += n * carne;
      texto = `Abatidos ${n} ${n === 1 ? ANIMAIS[especie].nome : ANIMAIS[especie].plural}: ${n * carne} de comida.`; break;
    }

    case 'mercador:vender':
      if (f.materiais < v.material) return falta('material');
      f.materiais -= v.material; f.tesouro += v.ouro; texto = `Vendido: ${v.material} de material por ${v.ouro} de ouro.`; break;
    case 'mercador:comprar':
      if (f.tesouro < v.precoComida) return falta('ouro');
      f.tesouro -= v.precoComida; f.comida += v.comida; texto = `Comprado: ${v.comida} de comida.`; break;
    case 'mercador:recusar': texto = 'O mercador seguiu viagem.'; break;

    case 'furto:expulsar':
      if (x) { f.colonos = colonos(f).filter(c => c.id !== x.id); f.populacao = Math.max(0, f.populacao - 1); }
      ordem(f, 5); renome(f, -2); texto = `${x?.nome ?? 'A suspeita'} foi posta para fora do portão.`; break;
    case 'furto:perdoar': mexerHumor(x, 15); if (x) x.lealdade = Math.min(100, x.lealdade + 15); ordem(f, -3); texto = 'Você perdoou sem provas. Uns acharam justo; outros, fraco.'; break;
    case 'furto:vigia':
      if (f.tesouro < 10) return falta('ouro');
      f.tesouro -= 10; f.seguranca = Math.min(100, f.seguranca + 8); texto = 'Há vigia no celeiro agora.'; break;

    case 'casamento:festa':
      if (f.comida < v.festa) return falta('comida');
      f.comida -= v.festa; unir(x, y); mexerTodos(f, 10); mexerHumor(x, 10); mexerHumor(y, 10); renome(f, 3);
      texto = `Festa de união: ${x?.nome} e ${y?.nome}. A colônia dançou até tarde.`; registrarMarco(camp, texto); break;
    case 'casamento:simples': unir(x, y); mexerHumor(x, 10); mexerHumor(y, 10); texto = `${x?.nome} e ${y?.nome} se uniram, sem festa.`; break;
    case 'casamento:negar':
      mexerHumor(x, -20); mexerHumor(y, -20); if (x) x.lealdade -= 10; if (y) y.lealdade -= 10; texto = 'Você negou a união.'; break;

    case 'ferramentas:dar':
      if (f.materiais < v.custo) return falta('material');
      f.materiais -= v.custo; for (const o of f.obrasEmAndamento) o.periodosRestantes = Math.max(0, o.periodosRestantes - 4);
      mexerHumor(x, 10); texto = 'Ferramentas novas. As obras adiantaram um dia.'; break;
    case 'ferramentas:negar': mexerHumor(x, -10); texto = 'Sem ferramentas novas.'; break;
    default: return { ok: false, mensagem: 'Essa resposta não cabe a esse pedido.' };
  }
  f.audiencia = undefined;
  f.historicoEventos.push({ dia: camp.calendario.dia, texto });
  return { ok: true, mensagem: texto };
}
