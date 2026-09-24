// ARCANUM · A colônia: o lugar, o terreno e o que ele faz (sessão 57, etapa A).
//
// O assentamento das sessões 43-45 (engine/reino.ts) tinha uma economia de
// planilha: fundava-se num ponto que não existia no mapa, de qualquer lugar, e
// a colônia nascia com castelo, quartel, mercado, forja e muralha prontos. As
// vantagens de cada ponto eram texto; desvantagem não havia.
//
// Aqui a colônia fica num lugar real (content/vaelhorn/sitios.ts), funda-se
// estando nele, começa com abrigos e uma roça, e o terreno manda:
// - solo e água decidem a lavoura; sem água a colônia não passa de um punhado
//   de gente até cavar a cisterna;
// - madeira e pedra decidem quanto material entra; caça e pesca, quanta
//   comida vem de fora da roça;
// - defesa natural e perigo decidem a segurança de base; passagem traz ouro,
//   gente e cobiça; o inverno pesa na comida.
// Cada sítio tem ainda um traço (o trigo do marechal, a vista do planalto…).
//
// `efeitosDoSitio` escreve vantagens e desvantagens a partir dos MESMOS números
// que `modificadoresDoSitio` usa: o texto da tela não pode prometer o que o
// jogo não faz.
//
// Nada aqui consome o RNG da campanha: sorteios usam RNG derivado (semente +
// dia), como o resto do mundo.
import type { Campaign, ContentBundle, FeudoState } from './types';
import type { SitioColonia, TerrenoSitio } from '../content/vaelhorn/sitios';
import { SITIO_POR_PONTO_ANTIGO } from '../content/vaelhorn/sitios';
import { createRng, nextFloat, nextInt, seedFromString } from './rng';
import { registrarMarco } from './memoria';
import { obterFeudo } from './reino';
import { processarRebanhos, segurancaDosCavalos, type RelatorioRebanho } from './rebanhos';
import { colonosFundadores, eficiencia, processarGente, type RelatorioGente } from './colonos';

// ── O terreno em números ──────────────────────────────────────────────────

/** Quanto a lavoura rende conforme o solo (0 a 3). */
export const RENDE_LAVOURA = [0.4, 0.75, 1.0, 1.3];
/** Quanta gente a água do lugar sustenta, sem cisterna. */
export const GENTE_POR_AGUA = [12, 40, 120, 400];
/** Quanta gente cada nível de poço e cisterna acrescenta. */
export const GENTE_POR_CISTERNA = 40;

export type ModificadoresSitio = {
  fatorLavoura: number;
  capacidadeAgua: number;
  materiaisDia: number;
  comidaSelvagemDia: number;
  segurancaBase: number;
  rendaPassagemDia: number;
  consumoInverno: number;
  lavouraInverno: number;
  avisoExtraDias: number;
};

export function sitioDe(content: ContentBundle, id: string | undefined): SitioColonia | undefined {
  return id ? content.sitiosColonia?.find(s => s.id === id) : undefined;
}

/** Os efeitos do terreno, em número. Cisternas contam para a água. */
export function modificadoresDoSitio(s: SitioColonia, cisternas = 0): ModificadoresSitio {
  const t = s.terreno;
  return {
    fatorLavoura: RENDE_LAVOURA[t.solo],
    capacidadeAgua: GENTE_POR_AGUA[t.agua] + cisternas * GENTE_POR_CISTERNA,
    materiaisDia: t.madeira * 1.5 + t.pedra,
    comidaSelvagemDia: t.caca * 1.5 + t.pesca * 2.5,
    segurancaBase: Math.max(5, 30 + t.defesa * 15 - t.perigo * 5),
    rendaPassagemDia: t.passagem * 2,
    consumoInverno: 1 + t.inverno * 0.1,
    lavouraInverno: Math.max(0.2, 0.8 - t.inverno * 0.15),
    avisoExtraDias: s.traco === 'vista_do_planalto' ? 2 : 0,
  };
}

export type EfeitoSitio = { tipo: 'vantagem' | 'desvantagem'; texto: string };

const NOME_NIVEL = ['nenhum', 'pouco', 'bom', 'muito'];

/** Vantagens e desvantagens do sítio, escritas a partir dos números. */
export function efeitosDoSitio(s: SitioColonia): EfeitoSitio[] {
  const t: TerrenoSitio = s.terreno, m = modificadoresDoSitio(s);
  const e: EfeitoSitio[] = [];
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  // Água
  if (t.agua === 0) e.push({ tipo: 'desvantagem', texto: `Sem água doce: até cavar poço ou cisterna, a colônia sustenta no máximo ${GENTE_POR_AGUA[0]} pessoas, e quem passar disso vai embora.` });
  else if (t.agua === 1) e.push({ tipo: 'desvantagem', texto: `Água pouca: sem cisterna, no máximo ${GENTE_POR_AGUA[1]} pessoas.` });
  else if (t.agua === 3) e.push({ tipo: 'vantagem', texto: 'Água farta: nenhuma cisterna é necessária para crescer.' });
  // Solo
  if (t.solo >= 3) e.push({ tipo: 'vantagem', texto: `Solo muito bom: a lavoura rende ${pct(m.fatorLavoura)}.` });
  else if (t.solo <= 1) e.push({ tipo: 'desvantagem', texto: `Solo ${t.solo === 0 ? 'estéril' : 'fraco'}: a lavoura rende ${pct(m.fatorLavoura)}.` });
  // Materiais
  if (m.materiaisDia >= 4) e.push({ tipo: 'vantagem', texto: `Madeira e pedra à mão: ${m.materiaisDia} de material por dia sem oficina.` });
  else if (m.materiaisDia <= 1) e.push({ tipo: 'desvantagem', texto: `Quase nada para construir por perto: só ${m.materiaisDia} de material por dia sem oficina.` });
  // Caça e pesca
  if (m.comidaSelvagemDia >= 5) e.push({ tipo: 'vantagem', texto: `${t.pesca >= t.caca ? 'Pesca' : 'Caça'} farta: ${m.comidaSelvagemDia} de comida por dia além da roça.` });
  // Pasto
  if (t.pasto >= 3) e.push({ tipo: 'vantagem', texto: 'Pasto largo: rebanho grande sem comprar feno.' });
  else if (t.pasto === 0) e.push({ tipo: 'desvantagem', texto: 'Sem pasto: todo animal come do celeiro.' });
  // Defesa e perigo
  if (t.defesa >= 3) e.push({ tipo: 'vantagem', texto: `Defesa natural forte: a segurança começa em ${m.segurancaBase}.` });
  else if (t.defesa === 0) e.push({ tipo: 'desvantagem', texto: `Campo aberto, sem defesa natural: a segurança começa em ${m.segurancaBase}.` });
  if (t.perigo >= 3) e.push({ tipo: 'desvantagem', texto: 'Entorno perigoso: feras e o que mora perto rondam a colônia mais do que em outros lugares.' });
  // Passagem
  if (t.passagem >= 2) e.push({ tipo: 'vantagem', texto: `Passa gente por aqui: ${m.rendaPassagemDia} de ouro por dia em comércio miúdo, e mais gente ouve falar da colônia.` });
  if (t.passagem >= 3) e.push({ tipo: 'desvantagem', texto: 'Quem passa também cobiça: bandos e cobradores conhecem o caminho.' });
  if (t.passagem === 0) e.push({ tipo: 'desvantagem', texto: 'Isolado: quase ninguém passa, e a notícia da colônia demora a correr.' });
  // Inverno
  if (t.inverno >= 3) e.push({ tipo: 'desvantagem', texto: `Inverno duro: no inverno a colônia come ${pct(m.consumoInverno)} do normal e a lavoura rende ${pct(m.lavouraInverno)}.` });
  else if (t.inverno === 0) e.push({ tipo: 'vantagem', texto: 'Sem inverno de verdade: a lavoura não para.' });
  if (s.reivindicadaPor) e.push({ tipo: 'desvantagem', texto: `A terra é reivindicada pela casa ${s.reivindicadaPor}: ela vai querer acordo.` });
  return e;
}

// ── Fundar ────────────────────────────────────────────────────────────────

export function podeFundarAqui(content: ContentBundle, camp: Campaign): { pode: boolean; motivo?: string; sitio?: SitioColonia } {
  if (camp.feudo?.fundado) return { pode: false, motivo: 'Você já tem uma colônia.' };
  const s = sitioDe(content, camp.localAtual);
  if (!s) {
    const lista = (content.sitiosColonia ?? []).map(x => x.nome).join(', ');
    return { pode: false, motivo: `Não dá para fundar aqui. Lugares sem dona onde se pode fundar: ${lista}.` };
  }
  return { pode: true, sitio: s };
}

/** Funda a colônia no lugar onde o jogador está. Começa pequena: abrigos e uma roça. */
export function fundarColonia(content: ContentBundle, camp: Campaign, nome: string): { ok: boolean; mensagem: string } {
  const pode = podeFundarAqui(content, camp);
  if (!pode.pode) return { ok: false, mensagem: pode.motivo! };
  const s = pode.sitio!;
  const f = obterFeudo(camp);
  const m = modificadoresDoSitio(s);
  f.fundado = true;
  f.nome = nome.trim() || `Colônia de ${s.nome}`;
  f.localId = s.id;
  f.sitio = s.id;
  f.bioma = s.bioma;
  f.tierReino = 1;
  f.populacao = 6;
  f.capacidadeHabitacional = 20;
  f.comida = s.recursosIniciais.comida;
  f.materiais = s.recursosIniciais.materiais;
  f.tesouro = s.recursosIniciais.ouro;
  f.remedios = 5;
  f.seguranca = m.segurancaBase;
  f.estabilidade = 60;
  f.edificios = {
    moradias: 0, castelo: 0, quartel: 0, mercado_feitoria: 0, igreja_santuario: 0,
    oficina_forja: 0, lavoura_silos: 1, muralha_baluarte: 0, boticario_hospital: 0, cisterna_poco: 0,
  };
  f.obrasEmAndamento = [];
  f.rotasComerciais = [];
  f.rotasPatrulha = [];
  colonosFundadores(content, camp, s.regiao);
  const nomes = (f.colonos ?? []).map(c => c.nome).join(' e ');
  const texto = `Você fincou o estandarte em ${s.nome}. "${f.nome}" são seis pessoas, três abrigos de lona e uma roça cavada à mão.${nomes ? ` Vieram com você ${nomes}, e mais quatro que ainda não disseram o nome.` : ''}`;
  f.historicoEventos.push({ dia: camp.calendario.dia, texto });
  camp.cronica.push({ turno: camp.turno, tipo: 'sistema', texto });
  registrarMarco(camp, texto);
  return { ok: true, mensagem: texto };
}

/**
 * Saves com colônia fundada num ponto que não era lugar do mapa passam para o
 * sítio real correspondente. Chamado na migração do save.
 */
export function migrarColonia(content: ContentBundle, camp: Campaign): void {
  const f = camp.feudo;
  if (!f?.fundado || f.sitio) return;
  if (sitioDe(content, f.localId)) { f.sitio = f.localId; return; }
  const porBioma: Record<string, string> = { planicie: 'campo_ceifa', deserto: 'ruina_areia', montanha: 'colina_forcados', floresta: 'clareira_pedras', costa: 'farol_quebrado' };
  const novo = SITIO_POR_PONTO_ANTIGO[f.localId] ?? porBioma[f.bioma];
  if (!novo || !sitioDe(content, novo)) return;
  f.sitio = novo;
  f.localId = novo;
}

// ── O dia da colônia ──────────────────────────────────────────────────────

export type RelatorioDia = {
  lavoura: number; selvagem: number; consumo: number; materiais: number; renda: number;
  tributo: number; eventos: string[];
  gente?: RelatorioGente;
  rebanho?: RelatorioRebanho;
};

function rngDoDia(camp: Campaign, chave: string) {
  return createRng((camp.rng.seed ^ seedFromString(`colonia:${chave}:${camp.calendario.dia}`)) >>> 0);
}

/**
 * Capacidade real: o menor entre abrigos e água. Moradias dão 25 cada; os
 * abrigos do começo, 20.
 */
export function capacidadeReal(content: ContentBundle, f: FeudoState): number {
  const s = sitioDe(content, f.sitio);
  if (!s) return f.capacidadeHabitacional;
  return Math.min(f.capacidadeHabitacional, modificadoresDoSitio(s, f.edificios.cisterna_poco ?? 0).capacidadeAgua);
}

/**
 * O passe diário de uma colônia com sítio: substitui produção, consumo e renda
 * da regra antiga (que continua valendo para colônias sem sítio). Devolve o
 * relatório, que a tela mostra.
 */
export function processarDiaColonia(content: ContentBundle, camp: Campaign): RelatorioDia | undefined {
  const f = camp.feudo;
  const s = f?.fundado ? sitioDe(content, f.sitio) : undefined;
  if (!f || !s) return undefined;
  const m = modificadoresDoSitio(s, f.edificios.cisterna_poco ?? 0);
  const inverno = camp.calendario.estacao === 'inverno';
  const r: RelatorioDia = { lavoura: 0, selvagem: 0, consumo: 0, materiais: 0, renda: 0, tributo: 0, eventos: [] };

  // Comida: roça (lavoura) + caça e pesca − consumo.
  // Cada ofício anda conforme quem cuida dele (engine/colonos.ts): sem
  // responsável, 60%.
  const ef = (o: Parameters<typeof eficiencia>[1]) => eficiencia(f, o);
  const roca = (f.edificios.lavoura_silos ?? 0) * 8 * m.fatorLavoura * (inverno ? m.lavouraInverno : 1) * ef('lavoura');
  r.lavoura = roca;
  if (s.traco === 'trigo_do_marechal' && !f.acordos?.includes('tessel')) {
    r.tributo = roca * 0.2;
    const tessel = camp.vivo?.cidades.tessel;
    if (tessel) tessel.comida = Math.min(600, tessel.comida + r.tributo);
  }
  r.selvagem = m.comidaSelvagemDia * ef('caca');
  r.consumo = f.populacao * 0.12 * (inverno ? m.consumoInverno : 1);
  f.comida = Math.max(0, f.comida + r.lavoura - r.tributo + r.selvagem - r.consumo);
  // O rebanho come depois da gente (o celeiro alimenta pessoas primeiro) e
  // devolve ovo, leite, lã e tração (engine/rebanhos.ts).
  r.rebanho = processarRebanhos(camp, s, inverno);
  r.eventos.push(...r.rebanho.morreram);
  if (r.rebanho.nasceram.length) r.eventos.push(`Nasceram crias: ${r.rebanho.nasceram.join(', ')}.`);
  if (f.comida === 0) {
    f.estabilidade = Math.max(0, f.estabilidade - 4);
    r.eventos.push('A comida acabou: a colônia passa fome.');
  }

  // Materiais e ouro.
  r.materiais = m.materiaisDia * ef('obras') + (f.edificios.oficina_forja ?? 0) * 4 * ef('oficina');
  // Obras andam conforme quem constrói: o ciclo antigo já descontou 4 períodos.
  for (const o of f.obrasEmAndamento) o.periodosRestantes -= 4 * (ef('obras') - 1);
  f.materiais = Math.min(9999, f.materiais + r.materiais);
  r.renda = (m.rendaPassagemDia + (f.edificios.moradias ?? 0) * 2 + (f.edificios.mercado_feitoria ?? 0) * 5) * ef('comercio');
  if (s.traco === 'a_travessia') r.renda += 3 + (f.edificios.mercado_feitoria ?? 0) * 2;
  f.tesouro += r.renda;
  f.remedios = Math.min(500, f.remedios + (f.edificios.boticario_hospital ?? 0) * 3 * ef('cura'));

  // Segurança tende à base do terreno + o que se construiu.
  const alvoSeg = Math.min(100, m.segurancaBase + (f.edificios.muralha_baluarte ?? 0) * 15 + (f.edificios.quartel ?? 0) * 10 + (ef('guarda') - 0.6) * 25 + segurancaDosCavalos(f)
    + (s.traco === 'trigo_do_marechal' && !f.acordos?.includes('tessel') ? 10 : 0));
  f.seguranca += Math.sign(alvoSeg - f.seguranca) * Math.min(2, Math.abs(alvoSeg - f.seguranca));

  // Água: acima do que a água sustenta, gente vai embora e a ordem cai.
  const cap = capacidadeReal(content, f);
  if (f.populacao > cap) {
    f.populacao -= 1;
    f.estabilidade = Math.max(0, f.estabilidade - 1);
    r.eventos.push(cap < f.capacidadeHabitacional ? 'Não há água para todo mundo: uma família foi embora.' : 'Não há abrigo para todo mundo: uma família foi embora.');
  }

  // Traços do sítio.
  const rng = rngDoDia(camp, 'traco');
  if (s.traco === 'circulo_de_pedras' && camp.calendario.dia % 7 === 0 && !(f.edificios.igreja_santuario ?? 0)) {
    f.estabilidade = Math.max(0, f.estabilidade - 1);
    r.eventos.push('Os sonhos do círculo pesam: sem santuário, a colônia dorme mal.');
  }
  if (s.traco === 'farol_apagado' && !f.farolAceso && nextFloat(rng) < 0.1) {
    f.materiais += 15; f.tesouro += 10;
    r.eventos.push('Um navio quebrou nas pedras do promontório. A colônia recolheu o que o mar trouxe.');
  }
  if (s.traco === 'areia_que_devolve' && nextFloat(rng) < 1 / 15) {
    const achado = nextInt(rng, 10, 40);
    f.tesouro += achado;
    for (const o of f.obrasEmAndamento) o.periodosRestantes += 4;
    r.eventos.push(`Tempestade de areia. Soterrou um dia de obra e devolveu ${achado} moedas antigas.`);
  }
  if (s.traco === 'a_travessia' && camp.calendario.estacao === 'primavera' && nextFloat(rng) < 1 / 30) {
    const dique = (f.edificios.muralha_baluarte ?? 0) >= 2;
    if (!dique) {
      const perda = Math.round(f.comida * 0.3);
      f.comida -= perda; f.materiais = Math.max(0, f.materiais - 20);
      r.eventos.push(`O rio subiu fora de época e levou ${perda} de comida e parte do material da margem.`);
    } else r.eventos.push('O rio subiu, e a muralha segurou a água como dique.');
  }

  r.gente = processarGente(content, camp, s.regiao, s.terreno.passagem);
  for (const texto of r.eventos) f.historicoEventos.push({ dia: camp.calendario.dia, texto });
  f.ultimoRelatorio = { dia: camp.calendario.dia, ...r };
  return r;
}

/** Reacender o farol do Farol Quebrado: acaba com os destroços, agrada a guilda. */
export const CUSTO_FAROL = { materiais: 60, ouro: 40 };
export function reacenderFarol(content: ContentBundle, camp: Campaign): { ok: boolean; mensagem: string } {
  const f = camp.feudo;
  const s = sitioDe(content, f?.sitio);
  if (!f || s?.traco !== 'farol_apagado') return { ok: false, mensagem: 'Não há farol para reacender aqui.' };
  if (f.farolAceso) return { ok: false, mensagem: 'O farol já está aceso.' };
  if (f.materiais < CUSTO_FAROL.materiais || f.tesouro < CUSTO_FAROL.ouro) return { ok: false, mensagem: `O farol pede ${CUSTO_FAROL.materiais} de material e ${CUSTO_FAROL.ouro} de ouro.` };
  f.materiais -= CUSTO_FAROL.materiais; f.tesouro -= CUSTO_FAROL.ouro;
  f.farolAceso = true;
  (f.acordos ??= []).push('mareu');
  const texto = 'O farol voltou a acender. Os navios passam longe das pedras, e a guilda de Mareu mandou dizer que não esquece favor.';
  f.historicoEventos.push({ dia: camp.calendario.dia, texto });
  registrarMarco(camp, texto);
  return { ok: true, mensagem: texto };
}

export { NOME_NIVEL };
