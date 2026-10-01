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
import { mudarReputacaoCasa } from './casas';
import { regiaoDe, procuraDaRegiao, entregarSe } from './guarda';

const nomeDaCasa = (content: ContentBundle | undefined, id?: string) => content?.casas?.find(c => c.id === id)?.nome ?? id ?? 'a casa';
function reputacaoCasa(content: ContentBundle | undefined, camp: Campaign, id: string | undefined, delta: number) {
  const casa = content?.casas?.find(c => c.id === id);
  if (content && casa) mudarReputacaoCasa(content, camp, casa, delta);
}

export type TipoAudiencia = 'briga' | 'fome' | 'mercador' | 'furto' | 'casamento' | 'ferramentas' | 'enviado' | 'crime' | 'guarda';

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
  /** Casa que mandou o enviado (engine/renome.ts). */
  origem?: string;
};

/** A cada quantos dias, no mínimo, alguém pede audiência. */
export const INTERVALO_AUDIENCIA = 5;
export const DIAS_PARA_RESPONDER = 3;

function rngDe(camp: Campaign, chave: string): RngState {
  return createRng((camp.rng.seed ^ seedFromString(`audiencia:${chave}:${camp.calendario.dia}`)) >>> 0);
}

const primeiro = (nome: string) => nome.split(' ')[0];
/** Concordância pelo gênero do colono: g(c, 'posta', 'posto'). */
const g = (c: Colono, fem: string, masc: string) => (c.genero === 'm' ? masc : fem);
/** Para duas pessoas: feminino só se as duas forem mulheres. */
const g2 = (a: Colono, b: Colono, fem: string, masc: string) => (a.genero === 'f' && b.genero === 'f' ? fem : masc);
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

// O enviado não se sorteia aqui: vem do renome (engine/renome.ts).
const GERADORES: Record<Exclude<TipoAudiencia, 'enviado' | 'guarda'>, Gerador> = {
  // Um colono feriu ou matou outro (engine/guarda.ts): a justiça da colônia é sua.
  crime: (f, _camp, rng) => {
    if (f.estabilidade >= 50 || colonos(f).length < 2 || nextFloat(rng) > 0.3) return undefined;
    const autor = [...colonos(f)].filter(c => c.temperamento === 'briguenta' || c.humor < 20).sort((x, y) => x.humor - y.humor)[0];
    const vitima = autor && [...colonos(f)].filter(c => c.id !== autor.id).sort((x, y) => x.humor - y.humor)[0];
    if (!autor || !vitima) return undefined;
    const matou = autor.humor < 10 && nextFloat(rng) < 0.25;
    return {
      tipo: 'crime', envolvidos: [autor.id, vitima.id], valores: { matou: matou ? 1 : 0 },
      texto: matou
        ? `${autor.nome} matou ${vitima.nome} atrás do celeiro, numa briga que ninguém separou. A colônia espera a sua sentença.`
        : `${autor.nome} abriu a cabeça de ${vitima.nome} com um pau de cerca. ${g(vitima, 'Ela', 'Ele')} vai viver; a colônia quer saber o que você faz.`,
      opcoes: [
        { id: 'cela', rotulo: `Trancar ${primeiro(autor.nome)} por uns dias`, efeito: `A ordem sobe um pouco; ${primeiro(autor.nome)} sai ${g(autor, 'ressentida', 'ressentido')}.` },
        { id: 'expulsar', rotulo: `Expulsar ${primeiro(autor.nome)}`, efeito: 'Sai da colônia; a ordem sobe; a estrada fica sabendo.' },
        ...(matou ? [{ id: 'enforcar', rotulo: `Enforcar ${primeiro(autor.nome)}`, efeito: 'A ordem sobe muito; todo mundo fica com medo e de pior humor.' }] : []),
        { id: 'perdoar', rotulo: 'Perdoar', efeito: `${primeiro(autor.nome)} fica ${g(autor, 'grata', 'grato')}; a ordem cai${matou ? ' muito' : ''}.` },
      ],
    };
  },
  briga: (f) => {
    const briguentas = colonos(f).filter(c => c.temperamento === 'briguenta' || c.humor < 35);
    if (briguentas.length < 2) return undefined;
    const [a, b] = [...briguentas].sort((x, y) => x.humor - y.humor);
    return {
      tipo: 'briga', envolvidos: [a.id, b.id], valores: {},
      texto: `${a.nome} e ${b.nome} brigaram na frente do poço, e a colônia inteira viu. ${g2(a, b, 'Cada uma', 'Cada um')} quer que você diga quem tinha razão.`,
      opcoes: [
        { id: 'a', rotulo: `Dar razão a ${primeiro(a.nome)}`, efeito: `${primeiro(a.nome)} fica mais ${g(a, 'contente e leal', 'contente e leal')}; ${primeiro(b.nome)} fica ${g(b, 'ressentida', 'ressentido')}.` },
        { id: 'b', rotulo: `Dar razão a ${primeiro(b.nome)}`, efeito: `${primeiro(b.nome)} fica mais contente e leal; ${primeiro(a.nome)} fica ${g(a, 'ressentida', 'ressentido')}.` },
        { id: 'mediar', rotulo: `Sentar ${g2(a, b, 'as duas', 'os dois')} à mesma mesa`, efeito: `${g2(a, b, 'As duas', 'Os dois')} melhoram um pouco; a ordem sobe. Custa 5 de ouro em vinho.` },
        { id: 'punir', rotulo: `Castigar ${g2(a, b, 'as duas', 'os dois')}`, efeito: `A ordem sobe bem; ${g2(a, b, 'as duas', 'os dois')} ficam de mau humor.` },
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
  furto: (f, _camp, rng) => {
    // Furto é de colônia com gente que não se conhece e guarda fraca — e nem
    // toda noite: sem este sorteio próprio, era quase todo pedido.
    if (f.seguranca >= 45 || f.populacao < 8 || colonos(f).length === 0 || nextFloat(rng) > 0.35) return undefined;
    const suspeita = [...colonos(f)].sort((x, y) => x.lealdade - y.lealdade)[0];
    const sumiu = Math.min(Math.floor(f.comida * 0.1), 20);
    if (sumiu < 3) return undefined;
    return {
      tipo: 'furto', envolvidos: [suspeita.id], valores: { sumiu },
      texto: `Sumiram ${sumiu} de comida do celeiro durante a noite. Todo mundo olha para ${suspeita.nome}, que jura que não foi.`,
      opcoes: [
        { id: 'expulsar', rotulo: `Expulsar ${primeiro(suspeita.nome)}`, efeito: `${g(suspeita, 'Ela', 'Ele')} vai embora; a ordem sobe; a estrada fica sabendo que aqui se expulsa gente.` },
        { id: 'perdoar', rotulo: 'Perdoar sem provas', efeito: `${primeiro(suspeita.nome)} fica ${g(suspeita, 'grata e leal', 'grato e leal')}; a ordem cai um pouco.` },
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
        { id: 'simples', rotulo: 'Abençoar sem festa', efeito: `${g2(a, b, 'As duas', 'Os dois')} ficam felizes; o resto nem percebe.` },
        { id: 'negar', rotulo: 'Negar', efeito: `${g2(a, b, 'As duas', 'Os dois')} ficam de mau humor e menos leais.` },
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
        { id: 'dar', rotulo: 'Dar o material (25)', efeito: `As obras em andamento adiantam um dia; ${g(oficineira, 'ela', 'ele')} fica contente.` },
        { id: 'negar', rotulo: 'Negar', efeito: `${g(oficineira, 'Ela', 'Ele')} fica de mau humor.` },
      ],
    };
  },
};

const ORDEM_DOS_PEDIDOS: Exclude<TipoAudiencia, 'enviado' | 'guarda'>[] = ['fome', 'crime', 'briga', 'furto', 'casamento', 'ferramentas', 'mercador'];

/** A guarda da região vem cobrar o senhor procurado por sangue (engine/guarda.ts). */
const INTERVALO_EXIGENCIA = 15;
function exigenciaDaGuarda(content: ContentBundle, camp: Campaign, f: FeudoState): Omit<Audiencia, 'id' | 'dia' | 'ate'> | undefined {
  const regiao = regiaoDe(content, f.localId);
  const pr = procuraDaRegiao(content, camp, regiao);
  if (!pr || pr.gravidade !== 'sangue' || pr.pontos < 40) return undefined;
  if (camp.calendario.dia - (f.ultimaExigenciaGuarda ?? -99) < INTERVALO_EXIGENCIA) return undefined;
  f.ultimaExigenciaGuarda = camp.calendario.dia;
  const preco = Math.round(50 + pr.pontos);
  const aqui = camp.localAtual === f.localId || camp.localAtual === f.sitio;
  return {
    tipo: 'guarda', envolvidos: [], valores: { preco },
    texto: `Homens da guarda de ${regiao} pararam no portão. Querem o senhor da colônia: ${pr.motivo}. Dizem que voltam com mais gente se não forem atendidos.`,
    opcoes: [
      ...(aqui ? [{ id: 'entregar', rotulo: 'Entregar-se', efeito: 'Você vai para a cela da guarda; a colônia fica sem o senhor até a pena acabar.' }] : []),
      { id: 'pagar', rotulo: `Pagar para irem embora (${preco} de ouro)`, efeito: 'Sai ouro do tesouro; a procura esfria pela metade.' },
      { id: 'recusar', rotulo: 'Mandar embora', efeito: f.seguranca >= 40 ? 'Sua guarda segura o portão; a procura continua.' : 'Com a segurança fraca, eles voltam e invadem: ouro, ordem e humor.' },
    ],
  };
}

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
  const exigencia = exigenciaDaGuarda(content, camp, f);
  if (exigencia) {
    const seq = (f.seqAudiencias = (f.seqAudiencias ?? 0) + 1);
    const a: Audiencia = { ...exigencia, id: `audiencia_${seq}`, dia, ate: dia + DIAS_PARA_RESPONDER };
    f.audiencia = a;
    f.ultimaAudiencia = dia;
    return a;
  }
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
    // O crime também: quem morreu já não está na colônia.
    if (a.tipo === 'crime') {
      const vitima = porId(f, a.envolvidos[1]);
      if (a.valores.matou) { f.colonos = colonos(f).filter(c => c.id !== vitima?.id); f.populacao = Math.max(0, f.populacao - 1); }
      else mexerHumor(vitima, -20);
    }
    return a;
  }
  return undefined;
}

function rotacionar<T>(xs: T[], n: number): T[] {
  return xs.map((_, i) => xs[(i + n) % xs.length]);
}

// ── A decisão ─────────────────────────────────────────────────────────────

export function resolverAudiencia(camp: Campaign, opcaoId: string, content?: ContentBundle): { ok: boolean; mensagem: string } {
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
      ordem(f, 5); renome(f, -2); texto = x ? `${x.nome} foi ${g(x, 'posta', 'posto')} para fora do portão.` : 'A suspeita foi posta para fora do portão.'; break;
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
    case 'enviado:acordo':
    case 'enviado:protecao': {
      const preco = opcaoId === 'acordo' ? v.preco : v.protecao;
      if (f.tesouro < preco) return falta('ouro');
      f.tesouro -= preco;
      if (a.origem && !(f.acordos ??= []).includes(a.origem)) f.acordos.push(a.origem);
      f.casasHostis = (f.casasHostis ?? []).filter(c => c !== a.origem);
      if (opcaoId === 'protecao') f.seguranca = Math.min(100, f.seguranca + 10);
      reputacaoCasa(content, camp, a.origem, 5);
      texto = opcaoId === 'acordo' ? `Acordo selado com ${nomeDaCasa(content, a.origem)}.` : `Acordo e patrulha de ${nomeDaCasa(content, a.origem)}: a estrada da colônia ficou mais segura.`;
      registrarMarco(camp, texto);
      break;
    }
    case 'enviado:recusar':
      if (a.origem && !(f.casasHostis ??= []).includes(a.origem)) f.casasHostis.push(a.origem);
      reputacaoCasa(content, camp, a.origem, -5);
      texto = `O enviado de ${nomeDaCasa(content, a.origem)} foi embora sem acordo.`; break;
    case 'ferramentas:negar': mexerHumor(x, -10); texto = 'Sem ferramentas novas.'; break;

    case 'crime:cela': mexerHumor(x, -20); if (x) x.lealdade = Math.max(0, x.lealdade - 10); ordem(f, v.matou ? 4 : 5); texto = `${x?.nome} passou dias trancado no paiol.`; break;
    case 'crime:expulsar':
      if (x) { f.colonos = colonos(f).filter(c => c.id !== x.id); f.populacao = Math.max(0, f.populacao - 1); }
      ordem(f, 6); renome(f, -1); texto = `${x?.nome} foi ${x ? g(x, 'posta', 'posto') : 'posto'} para fora do portão.`; break;
    case 'crime:enforcar':
      if (!v.matou) return { ok: false, mensagem: 'Não houve morte para isso.' };
      if (x) { f.colonos = colonos(f).filter(c => c.id !== x.id); f.populacao = Math.max(0, f.populacao - 1); }
      ordem(f, 12); mexerTodos(f, -8); renome(f, -2);
      texto = `${x?.nome} foi ${x ? g(x, 'enforcada', 'enforcado') : 'enforcado'} na frente da colônia. Ninguém falou durante o jantar.`; registrarMarco(camp, texto); break;
    case 'crime:perdoar': mexerHumor(x, 10); if (x) x.lealdade = Math.min(100, x.lealdade + 10); ordem(f, v.matou ? -15 : -8); texto = `Você perdoou ${x?.nome}.`; break;

    case 'guarda:entregar': {
      if (!content) return { ok: false, mensagem: 'Não dá para se entregar daqui.' };
      f.audiencia = undefined;
      const msg = entregarSe(content, camp, regiaoDe(content, f.localId));
      f.historicoEventos.push({ dia: camp.calendario.dia, texto: 'O senhor se entregou à guarda.' });
      return { ok: true, mensagem: msg };
    }
    case 'guarda:pagar': {
      if (f.tesouro < v.preco) return falta('ouro');
      f.tesouro -= v.preco;
      if (content) { const pr = procuraDaRegiao(content, camp, regiaoDe(content, f.localId)); if (pr) pr.pontos = Math.floor(pr.pontos / 2); }
      texto = `${v.preco} de ouro saíram do tesouro, e a guarda foi embora. Por enquanto.`; break;
    }
    case 'guarda:recusar':
      if (f.seguranca >= 40) { renome(f, 2); texto = 'Sua guarda fechou o portão e a da região foi embora sem você. Vão voltar.'; }
      else {
        const levado = Math.round(f.tesouro * 0.25);
        f.tesouro -= levado; ordem(f, -10); mexerTodos(f, -10);
        texto = `A guarda da região voltou com mais gente e invadiu a colônia: levou ${levado} de ouro e quebrou o que pôde.`;
        registrarMarco(camp, texto);
      }
      break;
    default: return { ok: false, mensagem: 'Essa resposta não cabe a esse pedido.' };
  }
  f.audiencia = undefined;
  f.historicoEventos.push({ dia: camp.calendario.dia, texto });
  return { ok: true, mensagem: texto };
}
