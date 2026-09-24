// ARCANUM · Bandos de salteadores com território, capitão e memória.
//
// Sessão 46. Até aqui a facção `ladroes` era só uma etiqueta no bestiário:
// cinco criaturas soltas que caíam de uma tabela de encontro e sumiam. Nenhum
// bando tinha nome, chão, esconderijo ou chefe, e ninguém voltava.
//
// Agora cada bando é estado da campanha:
// - vive numa região, com um esconderijo num lugar ermo dela;
// - recruta com o tempo e pilha (tesouro), e com gente suficiente fecha a
//   estrada com pedágio — e isso pesa na insegurança da cidade vizinha;
// - tem um capitão com nome que não morre na primeira queda: foge, volta com
//   cicatriz, vem preparado contra a arma que o derrubou e caça o jogador.
//
// O capitão é um Nemesis que PERDE: cada cicatriz o enfraquece mais do que a
// adaptação o fortalece, cada fuga é menos provável que a anterior, e bando
// que apanha perde gente, pedágio e, no fim, o esconderijo com o que pilhou.
//
// Tudo aqui é regra da engine. O narrador recebe o resultado (fatos públicos,
// linhas de log); não decide quem vive.
import type { Bando, Campaign, CapitaoBando, ContentBundle, Criatura, EstadoBandos } from './types';
import { createRng, nextFloat, pick, seedFromString, type RngState } from './rng';
import { cidadeIdDoLocal, registrarFato } from './historiaViva';
import { registrarMarco } from './memoria';

export const CRIATURA_CAPITAO = 'capitao_bandoleiro';
const NIVEL_BASE_CAPITAO = 5;
const MAX_MEMBROS = 12;
const MEMBROS_PARA_PEDAGIO = 6;
const DIAS_ENTRE_RECRUTAMENTOS = 5;
const DIAS_DE_RECUPERACAO = 12;

// Regiões onde bando nenhum se instala: o vale de partida (o jogador ainda é
// fraco demais ali) e os lugares fora do mapa comum.
const REGIOES_FORA = new Set(['Vale de Halvet', 'Fora do Mundo', 'Halvern']);
const TIPOS_DE_ESCONDERIJO = ['colina', 'ruina', 'passo', 'pantano', 'mina', 'acampamento', 'cripta', 'floresta', 'torre'];

const NOMES_DE_BANDO = ['os Corvos do Passo', 'a Mão Cinzenta', 'os Filhos da Lama', 'a Corda Vermelha', 'os Sem-Estandarte', 'a Matilha de Sal'];
const NOMES_DE_CAPITAO = ['Oderic Três-Dedos', 'Mara Cutelo', 'Bastião Ferrolho', 'Ilsa da Corda', 'Garm Sete-Léguas', 'Tova Sal-na-Boca'];

// Onde a arma do jogador deixa marca, e o que o vale passa a chamar o capitão.
const CICATRIZ_POR_DANO: Record<string, { marca: string; alcunha: string }> = {
  cortante: { marca: 'um talho que atravessa o rosto', alcunha: 'o Rosto Aberto' },
  perfurante: { marca: 'um olho que não enxerga mais', alcunha: 'o Caolho' },
  'contusão': { marca: 'a mandíbula que fechou torta', alcunha: 'Queixo-Torto' },
};
const CICATRIZ_GENERICA = { marca: 'uma queimadura que puxa o pescoço', alcunha: 'o Chamuscado' };

// ── Estado ────────────────────────────────────────────────────────────────

/** O bundle tem bandos? Só se trouxer o capitão e gente da laia dele. */
export function temBandos(content: ContentBundle): boolean {
  return content.criaturas.some(c => c.id === CRIATURA_CAPITAO)
    && content.criaturas.some(c => c.faccaoId === 'ladroes' && !c.chefe && c.id !== CRIATURA_CAPITAO);
}

/**
 * Estado dos bandos, criado na primeira vez que alguém pergunta. Usa um
 * sorteio próprio, derivado da semente da campanha, para não mexer na
 * sequência do RNG principal: a mesma campanha ganha sempre os mesmos bandos,
 * e as campanhas antigas continuam sorteando o resto igual.
 */
export function estadoBandos(content: ContentBundle, camp: Campaign): EstadoBandos {
  if (camp.bandos) return camp.bandos;
  const estado: EstadoBandos = { bandos: {} };
  camp.bandos = estado;
  if (!temBandos(content)) return estado;

  const rng: RngState = createRng(camp.rng.seed ^ seedFromString('bandos'));
  const porRegiao = new Map<string, string[]>();
  for (const l of content.locais) {
    if (!l.regiao || REGIOES_FORA.has(l.regiao) || !TIPOS_DE_ESCONDERIJO.includes(l.tipo)) continue;
    (porRegiao.get(l.regiao) ?? porRegiao.set(l.regiao, []).get(l.regiao)!).push(l.id);
  }
  const regioes = [...porRegiao.keys()].sort();
  const quantos = Math.min(3, regioes.length);
  const nomes = [...NOMES_DE_BANDO];
  const capitaes = [...NOMES_DE_CAPITAO];
  for (let i = 0; i < quantos; i++) {
    const regiao = regioes.splice(Math.floor(nextFloat(rng) * regioes.length), 1)[0];
    const nome = nomes.splice(Math.floor(nextFloat(rng) * nomes.length), 1)[0];
    const capitao = capitaes.splice(Math.floor(nextFloat(rng) * capitaes.length), 1)[0];
    const id = `bando_${i + 1}`;
    estado.bandos[id] = {
      id, nome, regiao,
      esconderijo: pick(rng, porRegiao.get(regiao)!),
      esconderijoConhecido: false,
      pistas: 0,
      membros: 3 + Math.floor(nextFloat(rng) * 3),
      tesouro: 20 + Math.floor(nextFloat(rng) * 40),
      pedagio: false,
      estado: 'ativo',
      capitao: { nome: capitao, nivel: NIVEL_BASE_CAPITAO, vivo: true, cicatrizes: [], rancor: 0, derrotas: 0, vitorias: 0 },
      ultimoRecrutamento: camp.calendario.dia,
    };
  }
  return estado;
}

export function nomeDoCapitao(c: CapitaoBando): string {
  return c.alcunha ? `${c.nome}, ${c.alcunha}` : c.nome;
}

function regiaoDe(content: ContentBundle, localId: string): string | undefined {
  return content.locais.find(l => l.id === localId)?.regiao;
}

export function capitaoDisponivel(camp: Campaign, b: Bando): boolean {
  const c = b.capitao;
  return c.vivo && !c.preso && (c.recuperarAte === undefined || camp.calendario.dia >= c.recuperarAte);
}

// ── O dia do bando ────────────────────────────────────────────────────────

/** Roda uma vez por dia virado, dentro de `avancarMundo`. */
export function processarBandos(content: ContentBundle, camp: Campaign): void {
  if (!temBandos(content)) return;
  const dia = camp.calendario.dia;
  for (const b of Object.values(estadoBandos(content, camp).bandos)) {
    if (b.estado === 'destruido') continue;
    const cap = b.capitao;

    // O capitão ferido volta — e, se o rancor pesa, volta atrás do jogador.
    if (cap.recuperarAte !== undefined && dia >= cap.recuperarAte) {
      cap.recuperarAte = undefined;
      if (cap.vivo && !cap.preso && cap.rancor >= 3) {
        cap.caca = true;
        if (camp.vivo) registrarFato(camp, {
          tipo: 'capitao_retorna', local: b.esconderijo, publico: true, atores: [],
          texto: `${nomeDoCapitao(cap)} voltou a ser visto com ${b.nome}. Dizem que pergunta por você pelo nome.`,
        });
      }
    }

    // Sem capitão, o bando não recruta: só se desfaz devagar.
    const comando = cap.vivo && !cap.preso;
    if (!comando) {
      if (b.membros > 0 && dia - b.ultimoRecrutamento >= DIAS_ENTRE_RECRUTAMENTOS) {
        b.membros -= 1;
        b.ultimoRecrutamento = dia;
      }
      if (b.membros <= 0) encerrarBando(camp, b, `${b.nome} deixou de existir: sem capitão, o último comparsa foi embora.`);
      b.pedagio = false;
      continue;
    }

    // Estrada insegura é terreno fértil: recruta mais rápido onde a cidade
    // vizinha já não protege ninguém.
    const cidadeId = cidadeIdDoLocal(content, camp, b.esconderijo);
    const cidade = cidadeId ? camp.vivo?.cidades[cidadeId] : undefined;
    const intervalo = cidade && cidade.inseguranca > 50 ? DIAS_ENTRE_RECRUTAMENTOS - 2 : DIAS_ENTRE_RECRUTAMENTOS;
    if (b.membros < MAX_MEMBROS && dia - b.ultimoRecrutamento >= intervalo) {
      b.membros += 1;
      b.ultimoRecrutamento = dia;
      if (b.estado === 'disperso' && b.membros >= 3) b.estado = 'ativo';
    }
    if (b.estado !== 'ativo') continue;

    // Pilhagem: o tesouro cresce com o tamanho do bando, e a cidade sente.
    b.tesouro += Math.ceil(b.membros / 3);
    if (cidade && b.membros >= MEMBROS_PARA_PEDAGIO) {
      cidade.inseguranca = Math.min(100, cidade.inseguranca + 0.3);
    }

    // Pedágio: com gente para fechar a estrada, ele aparece; sem, some.
    if (!b.pedagio && b.membros >= MEMBROS_PARA_PEDAGIO) {
      b.pedagio = true;
      if (camp.vivo) registrarFato(camp, {
        tipo: 'pedagio_bandido', local: b.esconderijo, publico: true, atores: [],
        texto: `${b.nome} fechou as estradas de ${b.regiao} e cobra pedágio de quem passa.`,
      });
    } else if (b.pedagio && b.membros < MEMBROS_PARA_PEDAGIO - 2) {
      b.pedagio = false;
    }
  }
}

export function encerrarBando(camp: Campaign, b: Bando, texto: string): void {
  b.estado = 'destruido';
  b.membros = 0;
  b.pedagio = false;
  if (camp.vivo) registrarFato(camp, { tipo: 'bando_desfeito', local: b.esconderijo, publico: true, atores: [], texto });
}

// ── Na estrada ────────────────────────────────────────────────────────────

export type EncontroDeBando = { bandoId: string; criaturas: string[]; pedagio?: number; vinganca?: boolean; esconderijo?: boolean };

/** Comparsas que cabem nesta luta: da laia do bando e perto do nível do jogador. */
function comparsas(content: ContentBundle, camp: Campaign, quantos: number, rng: RngState): string[] {
  const nivel = camp.personagem.nivel;
  const laia = content.criaturas.filter(c => c.faccaoId === 'ladroes' && !c.chefe && c.id !== CRIATURA_CAPITAO);
  const cabem = laia.filter(c => c.nivel <= nivel + 2);
  const pool: Criatura[] = cabem.length ? cabem : [[...laia].sort((a, b) => a.nivel - b.nivel)[0]];
  return Array.from({ length: quantos }, () => pick(rng, pool).id);
}

/**
 * Quantos comparsas vêm. O bando manda mais gente quando é grande, mas o
 * nível do jogador põe o teto: um personagem de nível 1 não enfrenta uma
 * matilha de seis — a sessão 40 mediu que bando sem teto mata campanha.
 */
export function tamanhoDoGrupo(membros: number, nivelJogador: number): number {
  const querem = 1 + Math.floor(membros / 4);
  const teto = 1 + Math.floor(nivelJogador / 3);
  return Math.max(1, Math.min(querem, teto, 4));
}

/**
 * Sorteia se um bando cruza a viagem de `origem` a `destino`. Devolve o
 * encontro pronto (quem luta, se é pedágio, se é vingança), ou null.
 */
export function encontroDeBandoNaViagem(
  content: ContentBundle,
  camp: Campaign,
  origem: string,
  destino: string,
  noturno: boolean,
): EncontroDeBando | null {
  if (!temBandos(content)) return null;
  const regioes = new Set([regiaoDe(content, origem), regiaoDe(content, destino)].filter(Boolean));
  const bandos = Object.values(estadoBandos(content, camp).bandos).filter(b => b.estado === 'ativo');

  // Vingança primeiro: o capitão que caça o jogador procura por ele em
  // qualquer estrada, e com mais certeza no próprio território.
  for (const b of bandos) {
    if (!b.capitao.caca || !capitaoDisponivel(camp, b)) continue;
    const chance = regioes.has(b.regiao) ? 0.7 : 0.3;
    if (nextFloat(camp.rng) >= chance) continue;
    const n = tamanhoDoGrupo(b.membros, camp.personagem.nivel);
    return { bandoId: b.id, criaturas: [CRIATURA_CAPITAO, ...comparsas(content, camp, Math.max(0, n - 1), camp.rng)], vinganca: true };
  }

  for (const b of bandos) {
    if (!regioes.has(b.regiao)) continue;
    const chance = Math.min(0.25, 0.06 + b.membros * 0.012 + (noturno ? 0.05 : 0));
    if (nextFloat(camp.rng) >= chance) continue;
    const n = tamanhoDoGrupo(b.membros, camp.personagem.nivel);
    // O capitão só sai para a estrada contra quem já passou do nível 3: ele é
    // nível 5, e contra um novato a luta seria execução, não risco.
    const comCapitao = capitaoDisponivel(camp, b) && b.membros >= 8 && camp.personagem.nivel >= 3 && nextFloat(camp.rng) < 0.25;
    const criaturas = comCapitao
      ? [CRIATURA_CAPITAO, ...comparsas(content, camp, Math.max(0, n - 1), camp.rng)]
      : comparsas(content, camp, n, camp.rng);
    // Barreira na estrada: preferem a moeda ao risco, quando o capitão não está.
    const pedagio = b.pedagio && !comCapitao && nextFloat(camp.rng) < 0.6
      ? valorDoPedagio(b, camp.personagem.nivel)
      : undefined;
    return { bandoId: b.id, criaturas, pedagio };
  }
  return null;
}

export function valorDoPedagio(b: Bando, nivelJogador: number): number {
  return 8 + b.membros * 2 + nivelJogador * 2;
}

/** O ataque ao esconderijo: o capitão (se estiver lá) e quem sobrou. */
export function encontroNoEsconderijo(content: ContentBundle, camp: Campaign): EncontroDeBando | { erro: string } {
  if (!temBandos(content)) return { erro: 'Não há bando aqui.' };
  const b = Object.values(estadoBandos(content, camp).bandos)
    .find(x => x.esconderijo === camp.localAtual && x.estado !== 'destruido');
  if (!b) return { erro: 'Não há bando escondido aqui.' };
  if (!b.esconderijoConhecido) return { erro: 'Você não sabe onde eles se escondem.' };
  const n = Math.min(4, Math.max(1, Math.ceil(b.membros / 3)));
  const lista = comparsas(content, camp, n, camp.rng);
  const criaturas = capitaoDisponivel(camp, b) ? [CRIATURA_CAPITAO, ...lista] : lista;
  return { bandoId: b.id, criaturas, esconderijo: true };
}

/**
 * Chamar logo depois de `iniciarCombate` com as criaturas do encontro: dá ao
 * capitão genérico o nome, o nível e as marcas do capitão deste bando.
 */
export function prepararCombateDeBando(content: ContentBundle, camp: Campaign, e: EncontroDeBando): void {
  const s = camp.combate;
  const b = camp.bandos?.bandos[e.bandoId];
  if (!s || !b) return;
  s.bando = { id: b.id, pedagio: e.pedagio, esconderijo: e.esconderijo, vinganca: e.vinganca };
  const cap = b.capitao;
  const ator = s.atores.find(a => a.criaturaId === CRIATURA_CAPITAO && !a.capitaoBandoId);
  if (ator) {
    const jogador = s.atores.find(a => a.ehJogador);
    const acima = cap.nivel - NIVEL_BASE_CAPITAO;
    // Cicatriz pesa mais que o que ele aprende: é o Nemesis que perde.
    const marcas = Math.min(4, cap.cicatrizes.length);
    const preparado = cap.adaptacao && jogador?.dano?.tipo === cap.adaptacao ? 2 : 0;
    ator.capitaoBandoId = b.id;
    ator.nome = nomeDoCapitao(cap);
    ator.vidaMax = Math.max(20, ator.vidaMax + acima * 6 - marcas * 5);
    ator.vida = ator.vidaMax;
    ator.acerto = Math.max(1, ator.acerto + acima - marcas);
    ator.defesa = Math.max(1, ator.defesa + acima - marcas + preparado);
    if (cap.cicatrizes.length) s.log.push(`${ator.nome} traz ${cap.cicatrizes[cap.cicatrizes.length - 1]}. Foi você quem deixou.`);
    if (preparado) s.log.push(`Ele veio preparado contra o seu golpe: aprendeu com a última vez.`);
    if (e.vinganca) s.log.push(`"Eu disse que voltava." ${b.nome} fecha o caminho à sua volta.`);
  }
  if (e.pedagio) {
    s.log.push(`${b.nome} barra a estrada: ${e.pedagio} moedas e ninguém se machuca.`);
  }
  if (e.esconderijo) s.log.push(`Você entra no esconderijo de ${b.nome}.`);
}

/**
 * Pagar o pedágio encerra a luta sem sangue. O dinheiro vai para o tesouro
 * do bando — que um dia pode voltar para as suas mãos, no esconderijo.
 */
export function pagarPedagio(camp: Campaign): { ok: boolean; texto: string } {
  const s = camp.combate;
  const b = s?.bando && camp.bandos?.bandos[s.bando.id];
  if (!s || s.terminado || !b || !s.bando?.pedagio) return { ok: false, texto: 'Ninguém está cobrando nada.' };
  if (s.rodada > 1) return { ok: false, texto: 'Depois do primeiro golpe, moeda nenhuma resolve.' };
  const valor = s.bando.pedagio;
  if (camp.personagem.dinheiro < valor) return { ok: false, texto: `Você não tem ${valor} moedas.` };
  camp.personagem.dinheiro -= valor;
  b.tesouro += valor;
  s.terminado = true;
  s.resultado = 'fuga';
  s.log.push(`Você paga ${valor} moedas. Eles abrem caminho, rindo.`);
  return { ok: true, texto: `Você pagou ${valor} moedas de pedágio a ${b.nome}.` };
}

// ── Depois da luta ────────────────────────────────────────────────────────

function cicatrizPara(tipo?: string) {
  return (tipo && CICATRIZ_POR_DANO[tipo]) || CICATRIZ_GENERICA;
}

/**
 * Chamado por `encerrar` em combat.ts. Aplica ao bando o que aconteceu na
 * luta: comparsas mortos saem do bando, o capitão foge ferido, é preso, morre
 * ou sai mais famoso; o esconderijo tomado entrega o tesouro.
 */
export function registrarDesfechoBando(camp: Campaign, resultado: 'vitoria' | 'derrota' | 'fuga'): void {
  const s = camp.combate;
  const b = s?.bando && camp.bandos?.bandos[s.bando.id];
  if (!s || !b) return;
  const dia = camp.calendario.dia;
  const cap = b.capitao;
  const jogador = s.atores.find(a => a.ehJogador);
  const inimigos = s.atores.filter(a => !a.ehJogador && !a.ehAliado);
  const capAtor = inimigos.find(a => a.capitaoBandoId === b.id);
  const caidos = inimigos.filter(a => a !== capAtor && (a.vida <= 0 || a.capturado)).length;
  b.membros = Math.max(0, b.membros - caidos);

  if (resultado === 'vitoria') {
    // Quem apanha deserta; quem vence descobre o caminho de casa deles.
    b.membros = Math.max(0, b.membros - 1);
    b.pistas += 1;
    if (!b.esconderijoConhecido && (b.pistas >= 2 || (capAtor && (capAtor.vida <= 0 || capAtor.capturado)))) {
      b.esconderijoConhecido = true;
      if (camp.vivo) registrarFato(camp, {
        tipo: 'esconderijo_descoberto', local: b.esconderijo, publico: false, atores: ['jogador'], conhecimento: 'testemunhado',
        texto: `Você descobriu onde ${b.nome} se esconde.`,
      });
      s.log.push(`Pelo que carregavam, você descobre onde ${b.nome} se esconde.`);
    }
  }

  if (capAtor) {
    if (resultado === 'vitoria' && (capAtor.vida <= 0 || capAtor.capturado)) {
      cap.derrotas += 1;
      if (capAtor.capturado) {
        cap.preso = true;
        cap.caca = false;
        registrarMarco(camp, `você entregou ${nomeDoCapitao(cap)} à justiça`);
        if (camp.vivo) registrarFato(camp, { tipo: 'capitao_preso', local: camp.localAtual, publico: true, atores: ['jogador'], texto: `${nomeDoCapitao(cap)}, de ${b.nome}, foi entregue preso.` });
      } else {
        // Cada queda torna a próxima fuga menos provável; encurralado no
        // próprio esconderijo, quase não há por onde fugir.
        const chanceFuga = (s.bando?.esconderijo ? 0.2 : cap.derrotas <= 1 ? 0.75 : cap.derrotas === 2 ? 0.45 : 0.15);
        if (nextFloat(camp.rng) < chanceFuga) {
          const c = cicatrizPara(jogador?.dano?.tipo);
          if (!cap.cicatrizes.includes(c.marca)) cap.cicatrizes.push(c.marca);
          cap.alcunha = c.alcunha;
          cap.adaptacao = jogador?.dano?.tipo;
          cap.nivel += 1;
          cap.rancor = Math.min(10, cap.rancor + 3);
          cap.recuperarAte = dia + DIAS_DE_RECUPERACAO;
          cap.caca = false;
          b.membros = Math.max(0, b.membros - 1);
          s.log.push(`${cap.nome} rola barranco abaixo, sangrando, e some. Ele vai lembrar do seu rosto.`);
          if (camp.vivo) registrarFato(camp, { tipo: 'capitao_fugiu', local: camp.localAtual, publico: true, atores: ['jogador'], texto: `${cap.nome}, de ${b.nome}, escapou ferido de você e agora atende por ${c.alcunha}.` });
        } else {
          cap.vivo = false;
          cap.caca = false;
          registrarMarco(camp, `você derrubou ${nomeDoCapitao(cap)}, capitão de ${b.nome}`);
          if (camp.vivo) registrarFato(camp, { tipo: 'capitao_morto', local: camp.localAtual, publico: true, atores: ['jogador'], texto: `${nomeDoCapitao(cap)} caiu. ${b.nome} ficou sem cabeça.` });
          s.log.push(`${nomeDoCapitao(cap)} não levanta mais.`);
        }
      }
      if (!cap.vivo || cap.preso) {
        b.estado = b.membros > 0 ? 'disperso' : 'destruido';
        b.pedagio = false;
      }
    } else if (resultado === 'vitoria') {
      // Venceu a luta, mas o capitão escapou de pé: humilhado, não ferido.
      cap.rancor = Math.min(10, cap.rancor + 2);
      cap.recuperarAte = dia + 5;
      cap.caca = false;
    } else if (resultado === 'derrota') {
      cap.vitorias += 1;
      cap.nivel += 1;
      cap.rancor = Math.max(0, cap.rancor - 3);
      cap.caca = false;
      b.membros = Math.min(MAX_MEMBROS, b.membros + 2);
      if (camp.vivo) registrarFato(camp, { tipo: 'capitao_venceu', local: camp.localAtual, publico: true, atores: ['jogador'], texto: `${nomeDoCapitao(cap)} derrubou você na estrada, e ${b.nome} ganhou gente com a história.` });
    } else {
      cap.rancor = Math.min(10, cap.rancor + 1);
    }
  }

  // Esconderijo tomado: o que foi pilhado volta ao mundo pelas suas mãos.
  if (s.bando?.esconderijo && resultado === 'vitoria') {
    const saque = b.tesouro;
    camp.personagem.dinheiro += saque;
    b.tesouro = 0;
    b.membros = 0;
    s.log.push(`No fundo do esconderijo, o que ${b.nome} pilhou: ${saque} moedas.`);
    registrarMarco(camp, `você tomou o esconderijo de ${b.nome}`);
    if (!cap.vivo || cap.preso) {
      encerrarBando(camp, b, `O esconderijo de ${b.nome} foi tomado, e o bando acabou ali.`);
    } else {
      b.estado = 'disperso';
      b.pedagio = false;
      if (camp.vivo) registrarFato(camp, { tipo: 'esconderijo_tomado', local: b.esconderijo, publico: true, atores: ['jogador'], texto: `O esconderijo de ${b.nome} foi tomado; ${nomeDoCapitao(cap)} sobreviveu e sumiu.` });
    }
  } else if (b.membros <= 0 && b.estado !== 'destruido' && (!cap.vivo || cap.preso)) {
    encerrarBando(camp, b, `${b.nome} deixou de existir.`);
  }
  if (b.membros < MEMBROS_PARA_PEDAGIO - 2) b.pedagio = false;
}

// ── Para o narrador e para a tela ─────────────────────────────────────────

/** O que se sabe dos bandos: só os que o jogador já encontrou ou ouviu falar. */
export function bandosConhecidos(camp: Campaign): Bando[] {
  const fatos = camp.vivo?.fatos ?? [];
  return Object.values(camp.bandos?.bandos ?? {}).filter(b =>
    b.pistas > 0 || b.capitao.derrotas > 0 || b.capitao.vitorias > 0 || b.esconderijoConhecido
    || fatos.some(f => f.local === b.esconderijo && ['pedagio_bandido', 'capitao_retorna'].includes(f.tipo)));
}

export function descreverBando(content: ContentBundle, b: Bando): string {
  const cap = b.capitao;
  const quem = !cap.vivo ? `sem capitão (${nomeDoCapitao(cap)} morreu)`
    : cap.preso ? `sem capitão (${nomeDoCapitao(cap)} está preso)`
      : `capitão ${nomeDoCapitao(cap)}${cap.cicatrizes.length ? `, com ${cap.cicatrizes.join(' e ')}` : ''}${cap.caca ? ', caçando você' : ''}`;
  const onde = b.esconderijoConhecido ? ` · esconderijo: ${content.locais.find(l => l.id === b.esconderijo)?.nome ?? b.esconderijo}` : '';
  const estado = b.estado === 'destruido' ? 'desfeito' : b.estado === 'disperso' ? 'disperso' : `${b.membros} homens${b.pedagio ? ', cobrando pedágio' : ''}`;
  return `${b.nome} (${b.regiao}) — ${estado}; ${quem}${onde}`;
}
