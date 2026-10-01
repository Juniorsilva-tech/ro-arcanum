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
import type { Campaign, ContentBundle, Criatura, ProcuraGuarda } from './types';
import { iniciarCombate } from './combat';
import { calcularContexto } from './availability';
import { registrarFato } from './historiaViva';
import { registrarMarco } from './memoria';
import { avancarPeriodos } from './time';
import { avancarMundo } from './mundo';
import { crescerImpulsos } from './impulsos';
import { createRng, nextFloat, seedFromString } from './rng';

export const PATRULHA = 'patrulha_guarda';
export const SARGENTO = 'patrulha_guarda_sargento';
const OFICIO_GUARDA = /guard|sentinel|soldad|patrulh|sargent|capit|miliciano/i;
const ERMO = new Set(['floresta', 'lago', 'mina', 'ruina', 'cripta', 'cemiterio', 'acampamento', 'estrada']);

export function regiaoDe(content: ContentBundle, localId: string): string {
  return content.locais.find((l) => l.id === localId)?.regiao ?? localId;
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
  pr.pontos += pontos;
  if (gravidade === 'sangue') pr.gravidade = 'sangue';
  if (!pr.motivo.includes(motivo)) pr.motivo = `${motivo}; ${pr.motivo}`;
  pr.atualizadoDia = camp.calendario.dia;
}

function guardaNaCena(content: ContentBundle, camp: Campaign) {
  return calcularContexto(content, camp).presentes.find((n) => OFICIO_GUARDA.test(n.ocupacao ?? ''));
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
  const chance = guarda
    ? Math.min(0.95, 0.35 + pr.pontos / 100)
    : Math.min(0.85, pr.pontos / 100) * (ERMO.has(tipo) ? 0.15 : 0.5);
  const rng = createRng((camp.rng.seed ^ seedFromString(`guarda:${hoje}:${camp.calendario.periodoIndex}:${camp.turno}`)) >>> 0);
  if (nextFloat(rng) >= chance) return undefined;
  pr.ultimaAbordagemDia = hoje;
  const quem = guarda?.nome ?? 'uma patrulha da guarda';
  camp.abordagem = { dia: hoje, local: camp.localAtual, regiao: regiaoDe(content, camp.localAtual), guarda: quem };
  return pr.gravidade === 'sangue'
    ? `${guarda ? `${guarda.nome} e mais dois guardas te cercam` : 'Uma patrulha da guarda te cerca'}, lanças baixas. Você é procurado: ${pr.motivo}.`
    : `${guarda ? guarda.nome : 'Uma patrulha da guarda'} te para no meio do caminho. Você é procurado por arruaça: ${pr.motivo}.`;
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
  return `${motivoExtra}A guarda te leva para a cela. A arma fica com eles. Pena: ${dias} dias` +
    (camp.prisao.fianca ? `, ou fiança de ${camp.prisao.fianca} moedas.` : '. Para sangue não há fiança.');
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
  return pr.gravidade === 'arruaca' ? 10 + Math.round(pr.pontos / 2) : 60 + Math.round(pr.pontos);
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

  if (escolha === 'render') return { ok: true, texto: prender(content, camp, ab.regiao, 'Você abaixa as mãos. ') };

  if (escolha === 'subornar') {
    const custo = custoDoSuborno(content, camp)!;
    if (p.dinheiro < custo) return { ok: false, texto: `o suborno custa ${custo} moedas e você tem ${p.dinheiro}` };
    p.dinheiro -= custo;
    const colou = pr.gravidade === 'arruaca' || nextFloat(rng) < Math.max(0.15, Math.min(0.75, 0.35 + (p.atributos.social - 10) * 0.04));
    if (!colou) return { ok: true, texto: prender(content, camp, ab.regiao, `${ab.guarda} pesa as ${custo} moedas, guarda no gibão e manda te amarrar assim mesmo. `) };
    pr.pontos = Math.floor(pr.pontos / 2);
    camp.abordagem = undefined;
    return { ok: true, texto: `${custo} moedas mudam de mão. ${ab.guarda} olha para o outro lado e a patrulha segue. Por enquanto.` };
  }

  if (escolha === 'fugir') {
    const chance = Math.max(0.1, Math.min(0.8, 0.4 + (p.atributos.fisico - 10) * 0.03 + (p.atributos.percepcao - 10) * 0.02 - (pr.gravidade === 'sangue' ? 0.1 : 0)));
    if (nextFloat(rng) < chance) {
      pr.pontos += 5;
      pr.atualizadoDia = camp.calendario.dia;
      camp.abordagem = undefined;
      return { ok: true, texto: 'Você corre antes de a lança baixar de vez, some entre as casas e despista a patrulha. Eles vão voltar a procurar.' };
    }
    const r = iniciarPatrulha(content, camp, pr);
    return { ok: true, texto: `Você tenta correr e não dá: a patrulha te alcança. ${r}`, combate: true };
  }

  return { ok: true, texto: iniciarPatrulha(content, camp, pr), combate: true };
}

function iniciarPatrulha(content: ContentBundle, camp: Campaign, pr: ProcuraGuarda): string {
  garantirPatrulha(content);
  const ids = pr.gravidade === 'sangue' ? [SARGENTO, PATRULHA, PATRULHA] : [PATRULHA, PATRULHA];
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
  if (s.resultado === 'derrota') {
    return { fato: prender(content, camp, regiao, 'Você cai sob as lanças. Acorda amarrado. '), preso: true };
  }
  camp.abordagem = undefined;
  const mortos = s.atores.filter((a) => !a.ehJogador && !a.ehAliado && a.vida <= 0 && !a.capturado).length;
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
    if (pr) { pr.fugitivo = true; pr.ultimaAbordagemDia = camp.calendario.dia; }
    if (camp.vivo) registrarFato(camp, { tipo: 'fuga_cela', local: camp.localAtual, texto: `${p.nome} fugiu da cela da guarda.`, atores: ['jogador'], publico: true });
    return { ok: true, texto: 'A tranca cede de madrugada. Você sai pelo pátio dos fundos, sem a arma, que ficou no depósito da guarda. Agora você é fugitivo.' };
  }
  preso.ateDia += 10;
  p.recursos.vida = Math.max(1, Math.round(p.recursos.vida * 0.7));
  return { ok: true, texto: 'O carcereiro te pega no corredor. Apanha, volta para a cela, e a pena cresce dez dias.' };
}
