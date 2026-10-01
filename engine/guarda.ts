// ARCANUM · A guarda: procurado, perseguição e cela.
//
// Até aqui a guarda só reagia na narração: depois de seis mortes na taverna,
// a sargenta ameaçava, mas nada acontecia. Agora a engine decide:
// - PROCURADO por região. Briga em público é "arruaça"; morte é "sangue".
//   Cada crime soma pontos, que esfriam com o tempo (arruaça em dias, sangue
//   em meses; quem fugiu da cela esfria mais devagar).
// - PERSEGUIÇÃO. Ao chegar num lugar ou agir nele, a patrulha pode achar o
//   jogador. A chance sobe com os pontos e com guarda presente na cena, e cai
//   no ermo (floresta, ruína, mina…). No máximo uma abordagem por dia.
// - ABORDAGEM. A patrulha cerca e espera resposta: render-se, subornar (a
//   guarda do vale é venal; sangue custa caro e pode não colar), fugir (teste
//   de corpo e olho) ou lutar contra a patrulha (matar guarda é mais sangue).
// - CELA. A pena sai da gravidade. A arma fica confiscada até a soltura. Dá
//   para cumprir (os dias passam e o mundo anda), pagar fiança (só arruaça) ou
//   fugir da cela (sucesso: livre, sem a arma e mais procurado; falha: mais
//   dez dias e o corpo machucado).
// O jogador preso tem a condição 'preso': não age no mundo nem viaja.
import type { CacadorRecompensa, Campaign, ContentBundle, Criatura, ProcuraGuarda } from './types';
import { iniciarCombate } from './combat';
import { calcularContexto } from './availability';
import { registrarFato, cidadeIdDoLocal } from './historiaViva';
import { registrarMarco } from './memoria';
import { avancarPeriodos } from './time';
import { avancarMundo } from './mundo';
import { crescerImpulsos } from './impulsos';
import { createRng, nextFloat, seedFromString } from './rng';

export const PATRULHA = 'patrulha_guarda';
export const SARGENTO = 'patrulha_guarda_sargento';
export const CACADOR = 'patrulha_guarda_cacador';
// Guarda da lei, não "guardião itinerante" (um Hashira não é patrulha).
export const OFICIO_GUARDA = /(?<!\p{L})(guarda|sentinela|soldad[oa]|patrulh\p{L}*|sargent[oa]|capit[ãa]o?|miliciano|carcereir[oa])(?!\p{L})/iu;
const ERMO = new Set(['floresta', 'lago', 'mina', 'ruina', 'cripta', 'cemiterio', 'acampamento', 'estrada']);

export function regiaoDe(content: ContentBundle, localId: string): string {
  return content.locais.find((l) => l.id === localId)?.regiao
    ?? content.sitiosColonia?.find((s) => s.id === localId)?.regiao
    ?? localId;
}

/** O lugar é o assentamento do próprio jogador? Lá a guarda é dele. */
export function ehAssentamentoDoJogador(camp: Campaign, localId: string): boolean {
  const f = camp.feudo;
  return !!f && (f.localId === localId || f.sitio === localId);
}

/**
 * Força da guarda de um lugar, 0 a 100. Cidade viva: gente, muralha, ordem,
 * fome e doença. Sem cidade viva: guarda de vila (30). No assentamento do
 * jogador: a segurança dele.
 */
export function forcaGuarda(content: ContentBundle, camp: Campaign, localId: string): number {
  if (ehAssentamentoDoJogador(camp, localId)) return Math.round(camp.feudo!.seguranca);
  const cidadeId = cidadeIdDoLocal(content, camp, localId);
  const c = cidadeId ? camp.vivo?.cidades[cidadeId] : undefined;
  if (!c || !cidadeId) return 30;
  const pop = camp.continuidade?.locais[cidadeId]?.populacao ?? 0;
  const f = 20 + Math.min(30, pop / 4) + c.edificios.muralha * 10 - c.inseguranca / 2 - (c.fomeDias > 0 ? 20 : 0) - (c.doenca > 60 ? 15 : 0);
  return Math.round(Math.max(5, Math.min(100, f)));
}

export function estaPreso(camp: Campaign): boolean {
  return !!camp.prisao;
}

/** Os pontos esfriam com o tempo. Chamado antes de qualquer leitura. */
function esfriar(camp: Campaign): void {
  const hoje = camp.calendario.dia;
  for (const [reg, pr] of Object.entries(camp.procura ?? {})) {
    const dias = Math.max(0, hoje - pr.atualizadoDia);
    const taxa = pr.gravidade === 'sangue' ? (pr.fugitivo ? 0.25 : 0.5) : 3;
    pr.pontos -= dias * taxa;
    pr.atualizadoDia = hoje;
    if (pr.pontos <= 0) delete camp.procura![reg];
  }
}

/** A procura da região onde o jogador está, se houver. */
export function procuraAqui(content: ContentBundle, camp: Campaign): ProcuraGuarda | undefined {
  esfriar(camp);
  return camp.procura?.[regiaoDe(content, camp.localAtual)];
}

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** A procura de uma região qualquer (o assentamento usa a da região dele). */
export function procuraDaRegiao(content: ContentBundle, camp: Campaign, regiao: string): ProcuraGuarda | undefined {
  esfriar(camp);
  return camp.procura?.[regiao];
}

/** O jogador se entrega (pela audiência do assentamento): vai para a cela da região. */
export function entregarSe(content: ContentBundle, camp: Campaign, regiao: string): string {
  return prender(content, camp, regiao, 'Você abre o portão e se entrega. ');
}

/** Um crime visto pela guarda (ou contado a ela). */
export function registrarCrime(
  content: ContentBundle,
  camp: Campaign,
  gravidade: ProcuraGuarda['gravidade'],
  pontos: number,
  motivo: string,
): void {
  esfriar(camp);
  const reg = regiaoDe(content, camp.localAtual);
  const pr = ((camp.procura ??= {})[reg] ??= { gravidade, pontos: 0, motivo, atualizadoDia: camp.calendario.dia });
  const antes = cartazDe(pr);
  pr.pontos += pontos;
  if (gravidade === 'sangue') pr.gravidade = 'sangue';
  if (!pr.motivo.includes(motivo)) pr.motivo = `${motivo}; ${pr.motivo}`;
  pr.atualizadoDia = camp.calendario.dia;
  // Cartaz novo na praça quando o caso vira sangue ou passa a "vivo ou morto".
  const agora = cartazDe(pr);
  if (agora.recompensa && (!antes.recompensa || agora.vivoOuMorto !== antes.vivoOuMorto) && camp.vivo) {
    registrarFato(camp, { tipo: 'cartaz_procurado', local: camp.localAtual, texto: textoDoCartaz(camp, pr), atores: ['jogador'], publico: true });
  }
}

/**
 * O cartaz da guarda: recompensa só por sangue (arruaça é intimação); "vivo
 * ou morto" quando o sangue é muito ou quando a pessoa fugiu da cela.
 */
export function cartazDe(pr: ProcuraGuarda): { recompensa?: number; vivoOuMorto: boolean } {
  if (pr.gravidade !== 'sangue') return { vivoOuMorto: false };
  return { recompensa: Math.round(pr.pontos * 1.5), vivoOuMorto: pr.pontos >= 120 || !!pr.fugitivo };
}

export function textoDoCartaz(camp: Campaign, pr: ProcuraGuarda): string {
  const c = cartazDe(pr);
  return `Cartaz pregado na praça: PROCURADO${c.vivoOuMorto ? ' — VIVO OU MORTO' : ''}: ${camp.personagem.nome}. Crime: ${pr.motivo}. Recompensa de ${c.recompensa} moedas a quem entregar à guarda.`;
}

/** Guarda presente e de pé. Quem você nocauteou hoje não vem te prender agora. */
function guardaNaCena(content: ContentBundle, camp: Campaign) {
  if (ehAssentamentoDoJogador(camp, camp.localAtual)) return undefined; // lá a guarda é sua
  const hoje = camp.calendario.dia;
  return calcularContexto(content, camp).presentes.find((n) =>
    OFICIO_GUARDA.test(n.ocupacao ?? '') && camp.flags[`nocaute.${n.id}`] !== hoje);
}

/**
 * Depois de chegar num lugar ou agir nele: a patrulha acha o jogador? Se sim,
 * grava a abordagem (a tela mostra as escolhas) e devolve o texto.
 */
export function checarPerseguicao(content: ContentBundle, camp: Campaign): string | undefined {
  if (camp.prisao || camp.abordagem || (camp.combate && !camp.combate.terminado)) return undefined;
  const pr = procuraAqui(content, camp);
  if (!pr || pr.pontos <= 0) return undefined;
  const hoje = camp.calendario.dia;
  if (pr.ultimaAbordagemDia === hoje) return undefined;
  const guarda = guardaNaCena(content, camp);
  const tipo = content.locais.find((l) => l.id === camp.localAtual)?.tipo ?? '';
  // A força da guarda do lugar pesa: cidade murada e cheia acha rápido;
  // vila com fome mal procura. No seu assentamento, a patrulha de fora só
  // entra se a sua segurança for fraca.
  const forca = forcaGuarda(content, camp, camp.localAtual);
  const fatorLocal = ehAssentamentoDoJogador(camp, camp.localAtual)
    ? Math.max(0.03, 0.3 * (1 - forca / 100))
    : (ERMO.has(tipo) ? 0.15 : 0.5) * (0.5 + forca / 100);
  // "Vivo ou morto" põe caçador de recompensa na estrada: no ermo, onde a
  // guarda quase não vai, quem aparece é ele.
  const regiaoAqui = regiaoDe(content, camp.localAtual);
  const cacador = !guarda && ERMO.has(tipo) && cartazDe(pr).vivoOuMorto && !ehAssentamentoDoJogador(camp, camp.localAtual) && !!cacadorDaRegiao(camp, regiaoAqui);
  const chance = guarda
    ? Math.min(0.95, 0.35 + pr.pontos / 100)
    : cacador
      ? 0.3
      : Math.min(0.85, pr.pontos / 100) * fatorLocal;
  const rng = createRng((camp.rng.seed ^ seedFromString(`guarda:${hoje}:${camp.calendario.periodoIndex}:${camp.turno}`)) >>> 0);
  if (nextFloat(rng) >= chance) return undefined;
  pr.ultimaAbordagemDia = hoje;
  const ca = cacador ? cacadorDaRegiao(camp, regiaoAqui)! : undefined;
  const quem = ca ? ca.nome : guarda?.nome ?? 'a patrulha da guarda';
  camp.abordagem = { dia: hoje, local: camp.localAtual, regiao: regiaoAqui, guarda: quem, cacador: cacador || undefined };
  if (ca) return falaDoCacador(ca, cartazDe(pr).recompensa ?? 0);
  const c = cartazDe(pr);
  return pr.gravidade === 'sangue'
    ? `${guarda ? `${guarda.nome} e mais dois guardas` : 'Três guardas'} te fecham o caminho, lanças baixas. Um deles desdobra o cartaz e compara o desenho com a sua cara. "É ele, o do cartaz. ${maiuscula(pr.motivo)}. ${c.vivoOuMorto ? 'Vivo ou morto, tanto faz para o juiz. ' : ''}Mãos onde eu possa ver, devagar."`
    : `"Ei, você. Parado aí." ${guarda ? guarda.nome : 'Um guarda'} vem com a mão no cabo da arma. "Tem queixa contra você: ${pr.motivo}. Ou resolve comigo agora, ou vai explicar para o juiz."`;
}

// ── Patrulha ───────────────────────────────────────────────────────────────

function criaturaDePatrulha(id: string, nivel: number, nome: string): Criatura {
  return {
    id, nome,
    descricao: `${nome} da guarda do vale, de lança e gibão.`,
    historia: 'A guarda do vale é pouca, mal paga e sabe brigar em grupo.',
    sinais: 'Lutam em grupo e tentam derrubar, não matar.',
    nivel,
    vida: Math.round(16 + nivel * 7),
    defesa: Math.round(9 + nivel * 0.8),
    acerto: Math.round(9 + nivel * 0.9),
    ataqueNome: 'golpe de lança',
    dano: { base: Math.round(3 + nivel), dispersao: 0.3, tipo: 'perfurante' },
    moralBase: 90,
    xp: nivel * 3,
    humano: true,
    regiaoExclusiva: 'Guarda',
  } as Criatura;
}

function garantirPatrulha(content: ContentBundle): void {
  if (!content.criaturas.some((c) => c.id === PATRULHA)) content.criaturas.push(criaturaDePatrulha(PATRULHA, 4, 'Guarda'));
  if (!content.criaturas.some((c) => c.id === SARGENTO)) content.criaturas.push(criaturaDePatrulha(SARGENTO, 7, 'Sargento da guarda'));
}

// ── O caçador de recompensas ───────────────────────────────────────────────
// Um por região, com nome. Lembra de você: quem correu, quem pagou, quem o
// feriu. A cada encontro em que sai vivo, aprende (nível +1, teto 14) e cobra
// mais caro. Morto, outro aparece depois de 30 dias, com outro nome.

const NOMES_CACADOR = ['Bram Olho-Torto', 'Ottar Cicatriz', 'Wenna Corda-Curta', 'Dagr, o Quieto', 'Hilde Mão-de-Ferro', 'Rurik Sem-Dedo', 'Mabbe, a Paciente', 'Tovald Besta-Velha'];
const DIAS_PARA_OUTRO_CACADOR = 30;

/** O caçador da região hoje (cria um, se não há ou se o último morreu há tempo). */
export function cacadorDaRegiao(camp: Campaign, regiao: string): CacadorRecompensa | undefined {
  const todos = (camp.cacadores ??= {});
  const atual = todos[regiao];
  if (atual?.vivo) return atual;
  if (atual && camp.calendario.dia - (atual.mortoDia ?? 0) < DIAS_PARA_OUTRO_CACADOR) return undefined;
  const usados = new Set(Object.values(todos).map((c) => c.nome));
  const rng = createRng((camp.rng.seed ^ seedFromString(`cacador:${regiao}:${camp.calendario.dia}`)) >>> 0);
  const livres = NOMES_CACADOR.filter((n) => !usados.has(n));
  const nome = (livres.length ? livres : NOMES_CACADOR)[Math.floor(nextFloat(rng) * (livres.length || NOMES_CACADOR.length))];
  todos[regiao] = { nome, nivel: 8, encontros: 0, vivo: true, pagamentos: 0 };
  return todos[regiao];
}

function idDoCacador(regiao: string): string {
  return `${CACADOR}_${regiao.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

function garantirCacador(content: ContentBundle, ca: CacadorRecompensa, regiao: string): string {
  const id = idDoCacador(regiao);
  const i = content.criaturas.findIndex((c) => c.id === id);
  const criatura = { ...criaturaDePatrulha(id, ca.nivel, ca.nome), ataqueNome: 'virote de besta', sinais: 'Trabalha sozinho e por dinheiro; vivo vale o mesmo que morto.', moralBase: 70 };
  if (i >= 0) content.criaturas[i] = criatura; else content.criaturas.push(criatura);
  return id;
}

function falaDoCacador(ca: CacadorRecompensa, recompensa: number): string {
  if (ca.encontros === 0) {
    return `${ca.nome} sai de trás das árvores com uma besta armada e o seu cartaz dobrado no cinto. "${recompensa} moedas, vivo ou morto. Eu prefiro vivo, dá menos trabalho para carregar."`;
  }
  if (ca.ultimo === 'pagou') return `"Olha quem é." ${ca.nome} já está com a besta no ombro. "Da última vez você pagou. A recompensa subiu, e o meu preço também."`;
  if (ca.ultimo === 'escapou') return `${ca.nome} aparece com o braço ainda enfaixado, e desta vez não chega sozinho de surpresa: chega mirando. "Você me deve um braço."`;
  return `"De novo você." ${ca.nome} cospe no chão. "Da última vez você correu. Hoje eu vim de cavalo, e com a besta carregada."`;
}

/** O caçador lembra do encontro: sai vivo, aprende e cobra mais. */
function lembrarEncontro(camp: Campaign, regiao: string, ultimo: CacadorRecompensa['ultimo']): void {
  const ca = camp.cacadores?.[regiao];
  if (!ca?.vivo) return;
  ca.encontros += 1;
  ca.ultimo = ultimo;
  if (ultimo === 'pagou') ca.pagamentos += 1;
  else ca.nivel = Math.min(14, ca.nivel + 1);
}

// ── Cela ───────────────────────────────────────────────────────────────────

function penaEmDias(pr: ProcuraGuarda): number {
  return pr.gravidade === 'sangue' ? Math.min(120, 15 * Math.ceil(pr.pontos / 40)) : Math.max(2, Math.ceil(pr.pontos / 10));
}

function prender(content: ContentBundle, camp: Campaign, regiao: string, motivoExtra = ''): string {
  esfriar(camp);
  const pr = camp.procura?.[regiao] ?? { gravidade: 'arruaca' as const, pontos: 10, motivo: 'desacato', atualizadoDia: camp.calendario.dia };
  const p = camp.personagem;
  const dias = penaEmDias(pr);
  const arma = p.equipado.arma;
  if (arma) {
    p.equipado.arma = undefined;
    if ((p.inventario[arma] ?? 0) > 0) p.inventario[arma] -= 1;
  }
  camp.prisao = {
    local: camp.localAtual,
    regiao,
    desdeDia: camp.calendario.dia,
    ateDia: camp.calendario.dia + dias,
    motivo: pr.motivo,
    fianca: pr.gravidade === 'arruaca' ? Math.round(10 + pr.pontos) : undefined,
    armaConfiscada: arma,
  };
  if (!p.condicoes.includes('preso')) p.condicoes.push('preso');
  camp.abordagem = undefined;
  registrarMarco(camp, `você foi preso: ${pr.motivo}`);
  if (camp.vivo) registrarFato(camp, { tipo: 'prisao', local: camp.localAtual, texto: `${p.nome} foi levado preso pela guarda (${pr.motivo}).`, atores: ['jogador'], publico: true });
  return `${motivoExtra}"Você está preso em nome da lei de ${regiao}." Tiram a sua arma, amarram as suas mãos e te jogam na cela. Pena: ${dias} dias` +
    (camp.prisao.fianca ? `, ou fiança de ${camp.prisao.fianca} moedas.` : '. Crime de sangue não tem fiança.');
}

function soltar(camp: Campaign, devolverArma: boolean): void {
  const p = camp.personagem;
  const preso = camp.prisao;
  if (!preso) return;
  if (devolverArma && preso.armaConfiscada) {
    p.inventario[preso.armaConfiscada] = (p.inventario[preso.armaConfiscada] ?? 0) + 1;
    p.equipado.arma = preso.armaConfiscada;
  }
  p.condicoes = p.condicoes.filter((c) => c !== 'preso');
  camp.prisao = undefined;
}

function passarDias(content: ContentBundle, camp: Campaign, dias: number): void {
  const periodos = Math.max(1, dias) * 6;
  camp.turno++;
  camp.capitulo.periodosDecorridos += periodos;
  camp.calendario = avancarPeriodos(camp.calendario, periodos);
  crescerImpulsos(camp, periodos);
  avancarMundo(content, camp);
}

export type EscolhaAbordagem = 'render' | 'subornar' | 'fugir' | 'lutar';

/** O custo do suborno, para a tela mostrar antes. */
export function custoDoSuborno(content: ContentBundle, camp: Campaign): number | undefined {
  const pr = camp.abordagem ? camp.procura?.[camp.abordagem.regiao] : undefined;
  if (!pr) return undefined;
  // O caçador quer pelo menos o que a recompensa paga.
  if (camp.abordagem?.cacador) {
    const ca = camp.cacadores?.[camp.abordagem.regiao];
    return Math.round(((cartazDe(pr).recompensa ?? 50) + 20) * (1 + 0.25 * (ca?.pagamentos ?? 0)));
  }
  const base = pr.gravidade === 'arruaca' ? 10 + Math.round(pr.pontos / 2) : 60 + Math.round(pr.pontos);
  return Math.round(base * fatorDeSuborno(content, camp));
}

/** Guarda de cidade com fome se vende barato; a de cidade rica, caro. */
function fatorDeSuborno(content: ContentBundle, camp: Campaign): number {
  const cidadeId = cidadeIdDoLocal(content, camp, camp.localAtual);
  const c = cidadeId ? camp.vivo?.cidades[cidadeId] : undefined;
  if (!c) return 1;
  return c.fomeDias > 0 ? 0.7 : c.tesouro > 400 ? 1.3 : 1;
}

export function responderAbordagem(
  content: ContentBundle,
  camp: Campaign,
  escolha: EscolhaAbordagem,
): { ok: boolean; texto: string; combate?: boolean } {
  const ab = camp.abordagem;
  if (!ab) return { ok: false, texto: 'ninguém está te parando' };
  esfriar(camp);
  const pr = camp.procura?.[ab.regiao];
  if (!pr) { camp.abordagem = undefined; return { ok: true, texto: 'A patrulha olha de novo, resmunga que te confundiu e segue.' }; }
  const p = camp.personagem;
  const rng = createRng((camp.rng.seed ^ seedFromString(`abordagem:${ab.dia}:${escolha}:${camp.turno}`)) >>> 0);

  if (escolha === 'render') {
    if (ab.cacador) lembrarEncontro(camp, ab.regiao, 'entregou');
    return { ok: true, texto: prender(content, camp, ab.regiao, ab.cacador ? `Você abaixa as mãos. ${ab.guarda} te amarra no cavalo, te entrega na guarda e sai de lá contando as moedas da recompensa. ` : 'Você abaixa as mãos. ') };
  }

  if (escolha === 'subornar') {
    const custo = custoDoSuborno(content, camp)!;
    if (p.dinheiro < custo) return { ok: false, texto: `o suborno custa ${custo} moedas e você tem ${p.dinheiro}` };
    p.dinheiro -= custo;
    const fome = fatorDeSuborno(content, camp) < 1 ? 0.15 : 0;
    const colou = ab.cacador || pr.gravidade === 'arruaca' || nextFloat(rng) < Math.max(0.15, Math.min(0.85, 0.35 + fome + (p.atributos.social - 10) * 0.04));
    if (!colou) return { ok: true, texto: prender(content, camp, ab.regiao, `${ab.guarda} pesa as ${custo} moedas, enfia no gibão e diz: "Isso aqui é a sua multa. A cela é outra conta." `) };
    if (ab.cacador) {
      lembrarEncontro(camp, ab.regiao, 'pagou');
    } else {
      pr.pontos = Math.floor(pr.pontos / 2);
    }
    camp.abordagem = undefined;
    return { ok: true, texto: ab.cacador
      ? `${custo} moedas, mais do que a recompensa paga. ${ab.guarda} conta duas vezes, guarda a besta e diz: "Nunca te vi." Mas o cartaz continua na praça, e ele sabe que você paga.`
      : `${custo} moedas mudam de mão. "Não vi ninguém por aqui", diz ${ab.guarda}, e a patrulha segue. Por enquanto.` };
  }

  if (escolha === 'fugir') {
    const chance = Math.max(0.1, Math.min(0.8, 0.4 + (p.atributos.fisico - 10) * 0.03 + (p.atributos.percepcao - 10) * 0.02 - (pr.gravidade === 'sangue' ? 0.1 : 0)));
    if (nextFloat(rng) < chance) {
      pr.pontos += 5;
      pr.atualizadoDia = camp.calendario.dia;
      if (ab.cacador) lembrarEncontro(camp, ab.regiao, 'fugiu');
      camp.abordagem = undefined;
      return { ok: true, texto: ab.cacador
        ? `Você se joga no barranco, o virote de ${ab.guarda} passa zunindo, e você some no mato. Ele vai voltar, e vai lembrar.`
        : 'Você corre antes de a lança baixar de vez, some entre as casas e despista a patrulha. Eles vão voltar a procurar.' };
    }
    const r = iniciarPatrulha(content, camp, pr);
    return { ok: true, texto: `Você tenta correr e não dá: a patrulha te alcança. ${r}`, combate: true };
  }

  return { ok: true, texto: iniciarPatrulha(content, camp, pr), combate: true };
}

function iniciarPatrulha(content: ContentBundle, camp: Campaign, pr: ProcuraGuarda): string {
  garantirPatrulha(content);
  if (camp.abordagem?.cacador) {
    const ca = cacadorDaRegiao(camp, camp.abordagem.regiao)!;
    const s = iniciarCombate(content, camp, [garantirCacador(content, ca, camp.abordagem.regiao)]);
    s.guarda = { regiao: camp.abordagem.regiao };
    s.log.push(`${ca.nome} não grita "em nome da lei". Só mira.`);
    return `${ca.nome} levanta a besta.`;
  }
  const ids = pr.gravidade === 'sangue' ? [SARGENTO, PATRULHA, PATRULHA] : [PATRULHA, PATRULHA];
  // Guarda forte manda mais gente; guarda fraca, menos.
  const forca = forcaGuarda(content, camp, camp.localAtual);
  if (forca >= 70) ids.push(PATRULHA);
  else if (forca < 25 && ids.length > 1) ids.pop();
  const s = iniciarCombate(content, camp, ids);
  s.guarda = { regiao: camp.abordagem?.regiao ?? regiaoDe(content, camp.localAtual) };
  s.log.push('A patrulha fecha o cerco. Se você cair, acorda na cela.');
  return 'A patrulha parte para cima.';
}

/** Fecha a luta com a patrulha: cela se perdeu, mais sangue se matou guarda. */
export function concluirConfrontoGuarda(content: ContentBundle, camp: Campaign): { fato: string; preso: boolean } | undefined {
  const s = camp.combate;
  if (!s?.guarda) return undefined;
  const regiao = s.guarda.regiao;
  const hoje = camp.calendario.dia;
  const atorCacador = s.atores.find((a) => a.criaturaId?.startsWith(CACADOR));
  if (s.resultado === 'derrota') {
    if (atorCacador) {
      const nome = camp.cacadores?.[regiao]?.nome ?? 'O caçador';
      lembrarEncontro(camp, regiao, 'entregou');
      return { fato: prender(content, camp, regiao, `Você cai com um virote na perna. ${nome} te amarra no cavalo e te entrega na guarda. `), preso: true };
    }
    return { fato: prender(content, camp, regiao, 'Você cai sob as lanças. Acorda amarrado. '), preso: true };
  }
  camp.abordagem = undefined;
  const mortos = s.atores.filter((a) => !a.ehJogador && !a.ehAliado && a.vida <= 0 && !a.capturado).length;
  if (atorCacador) {
    const ca = camp.cacadores?.[regiao];
    const nome = ca?.nome ?? 'O caçador';
    const pr = camp.procura?.[regiao];
    if (pr) pr.ultimaAbordagemDia = hoje;
    if (s.resultado === 'vitoria' && atorCacador.vida <= 0 && !atorCacador.capturado) {
      if (ca) { ca.vivo = false; ca.mortoDia = hoje; }
      registrarMarco(camp, `você matou ${nome}, caçador de recompensas`);
      return { fato: `${nome} fica no mato, com a besta ainda na mão. Ninguém viu. Mas o cartaz continua na praça, e outro caçador vai aparecer.`, preso: false };
    }
    if (s.resultado === 'vitoria') {
      lembrarEncontro(camp, regiao, 'escapou');
      return { fato: `${nome} larga a besta e foge ferido pelo mato. Vai sarar, e vai voltar.`, preso: false };
    }
    lembrarEncontro(camp, regiao, 'fugiu');
    return { fato: `Você escapa de ${nome} correndo. Ele viu o seu rosto de perto.`, preso: false };
  }
  if (s.resultado === 'vitoria' && mortos) {
    registrarCrime(content, camp, 'sangue', 30 * mortos, `matou ${mortos} guarda${mortos > 1 ? 's' : ''}`);
    (camp.reputacao as unknown as Record<string, number>).guarda = ((camp.reputacao as unknown as Record<string, number>).guarda ?? 0) - 20 * mortos;
    const local = content.locais.find((l) => l.id === camp.localAtual)?.nome ?? 'aqui';
    if (camp.vivo) registrarFato(camp, { tipo: 'assassinato', local: camp.localAtual, texto: `${camp.personagem.nome} matou ${mortos} guarda${mortos > 1 ? 's' : ''} em ${local}.`, atores: ['jogador'], publico: true });
    const pr = camp.procura?.[regiao];
    if (pr) pr.ultimaAbordagemDia = hoje;
    return { fato: `Você derrubou a patrulha. ${mortos} guarda${mortos > 1 ? 's' : ''} no chão, e agora o vale inteiro vai querer sua cabeça.`, preso: false };
  }
  const pr = camp.procura?.[regiao];
  if (pr) { pr.pontos += 5; pr.ultimaAbordagemDia = hoje; }
  return { fato: s.resultado === 'fuga' ? 'Você escapa da patrulha correndo. Eles viram seu rosto de perto.' : 'A patrulha recua.', preso: false };
}

export type EscolhaCela = 'cumprir' | 'fianca' | 'fugir';

export function agirNaCela(content: ContentBundle, camp: Campaign, escolha: EscolhaCela): { ok: boolean; texto: string } {
  const preso = camp.prisao;
  if (!preso) return { ok: false, texto: 'você não está preso' };
  const p = camp.personagem;
  if (escolha === 'fianca') {
    if (!preso.fianca) return { ok: false, texto: 'para sangue não há fiança' };
    if (p.dinheiro < preso.fianca) return { ok: false, texto: `a fiança é ${preso.fianca} moedas e você tem ${p.dinheiro}` };
    p.dinheiro -= preso.fianca;
    const regiao = preso.regiao;
    soltar(camp, true);
    delete camp.procura?.[regiao];
    return { ok: true, texto: `Você paga ${preso.fianca} moedas. O carcereiro devolve a arma e abre a porta sem olhar na sua cara.` };
  }
  if (escolha === 'cumprir') {
    const dias = Math.max(1, preso.ateDia - camp.calendario.dia);
    const regiao = preso.regiao;
    passarDias(content, camp, dias);
    soltar(camp, true);
    delete camp.procura?.[regiao];
    const r = camp.reputacao as unknown as Record<string, number>;
    r.guarda = Math.min(0, (r.guarda ?? 0) + 10);
    p.recursos.vida = p.recursosMax.vida;
    p.condicoes = p.condicoes.filter((c) => c !== 'ferido');
    registrarMarco(camp, `você cumpriu ${dias} dias de cela`);
    return { ok: true, texto: `${dias} dias de cela, pão duro e palha. Quando a porta abre, o vale andou sem você. A arma volta para a sua mão; a dívida com a guarda está paga.` };
  }
  // Fugir da cela.
  const rng = createRng((camp.rng.seed ^ seedFromString(`cela:${camp.calendario.dia}:${camp.turno}`)) >>> 0);
  const chance = Math.max(0.08, Math.min(0.7, 0.25 + (p.atributos.fisico - 10) * 0.03 + (p.atributos.percepcao - 10) * 0.02));
  camp.turno++;
  if (nextFloat(rng) < chance) {
    const regiao = preso.regiao;
    soltar(camp, false);
    registrarCrime(content, camp, 'sangue', 20, 'fugiu da cela');
    const pr = camp.procura?.[regiao];
    if (pr) {
      const eraVivoOuMorto = cartazDe(pr).vivoOuMorto;
      pr.fugitivo = true;
      pr.ultimaAbordagemDia = camp.calendario.dia;
      // Fugitivo: o cartaz novo sai "vivo ou morto".
      if (!eraVivoOuMorto && camp.vivo) registrarFato(camp, { tipo: 'cartaz_procurado', local: camp.localAtual, texto: textoDoCartaz(camp, pr), atores: ['jogador'], publico: true });
    }
    if (camp.vivo) registrarFato(camp, { tipo: 'fuga_cela', local: camp.localAtual, texto: `${p.nome} fugiu da cela da guarda.`, atores: ['jogador'], publico: true });
    return { ok: true, texto: 'A tranca cede de madrugada. Você sai pelo pátio dos fundos, sem a arma, que ficou no depósito da guarda. Agora você é fugitivo.' };
  }
  preso.ateDia += 10;
  p.recursos.vida = Math.max(1, Math.round(p.recursos.vida * 0.7));
  return { ok: true, texto: 'O carcereiro te pega no corredor. Apanha, volta para a cela, e a pena cresce dez dias.' };
}
