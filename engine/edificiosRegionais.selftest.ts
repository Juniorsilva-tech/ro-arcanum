// ARCANUM · Edifícios regionais e a forja ao alcance (engine/edificiosRegionais.ts).
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { conteudoTsukimichi as T } from '../content/tsukimichi';
import { itensVaelhorn } from '../content/vaelhorn/items';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { iniciarMundoVivo } from './historiaViva';
import { processarCidades, iniciarObra } from './cidades';
import { itensDaLoja } from './items';
import { ondeForjar, forjar } from './forja';
import { estadoBandos } from './bandos';
import { estadoCaravanas, processarCaravanas } from './caravanas';
import { calcularContexto } from './availability';
import {
  edificioRegionalDe, edificioRegionalAtivo, tetoDoEdificio, fatorAtaqueCaravana, aplicarEdificioRegional,
  FERTILIDADE_NA_SECA, TETO_EDIFICIO_PADRAO,
} from './edificiosRegionais';
import type { Campaign, ContentBundle } from './types';
import { PERIODOS as PERIODOS_DO_DIA, type Periodo } from './time';


const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};
const nova = (seed: string, content: ContentBundle = C): Campaign => {
  const c = criarCampanha(content, { nome: 'Teste', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida', seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio' });
  if (c.familia) c.familia.prologoConcluido = true;
  if (!c.vivo) iniciarMundoVivo(content, c);
  return c;
};
// O mesmo mundo sem nenhum edifício regional nem teto de capital: a régua.
const SEM: ContentBundle = { ...C, edificiosRegionais: undefined, tetoEdificios: undefined };
const PERIODOS = [...PERIODOS_DO_DIA] as Periodo[];

// ── 1. Declaração ─────────────────────────────────────────────────────────
{
  const lista = C.edificiosRegionais ?? [];
  const cidades = lista.map(e => e.cidade);
  ok(lista.length === 5 && new Set(cidades).size === 5, `Cinco edifícios, um por cidade: ${lista.map(e => `${e.nome} (${e.cidade})`).join(', ')}`);
  const c = nova('declaracao');
  ok(cidades.every(id => c.vivo!.cidades[id]), 'Todas as cidades declaradas são cidades vivas');
  ok(lista.every(e => !e.responsavel || C.npcs.some(n => n.id === e.responsavel)), 'Quem trabalha em cada edifício existe no elenco');
  const outras = Object.keys(c.vivo!.cidades).filter(id => !cidades.includes(id));
  ok(outras.every(id => !edificioRegionalDe(C, id)), `As outras ${outras.length} cidades não têm edifício regional`);
  ok(lista.every(e => e.descricao.length > 60 && !/[\u{1F300}-\u{1FAFF}]/u.test(e.descricao + e.efeito)), 'Descrição escrita, sem emoji');
}

// ── 2. O que cada cidade vende ────────────────────────────────────────────
{
  const vende = (local: string) => itensDaLoja(C, local).map(i => i.id);
  ok(vende('vintra').includes('carvao') && !itensVaelhorn.find(i => i.id === 'carvao')!.lojas?.includes('vintra'), 'Vintra passa a vender carvão (antes não vendia)');
  ok(vende('corveira').includes('estilhaco_de_pedra') && vende('corveira').includes('minerio_de_ferro'), 'A Fundição Alta vende minério e pedra da galeria funda');
  ok(vende('solgar').includes('pocao_cura') && vende('solgar').includes('fio_de_prata'), 'O bazar de Solgar vende prata e poção');
  const c = nova('estoque');
  ok((c.vivo!.cidades.vintra.estoque.carvao ?? 0) > 0 && (c.vivo!.cidades.solgar.estoque.fio_de_prata ?? 0) > 0, 'E o estoque da cidade viva já nasce com isso');
}

// ── 3. Teto dos edifícios ─────────────────────────────────────────────────
{
  ok(tetoDoEdificio(C, 'tessel', 'lavoura') === 7 && tetoDoEdificio(C, 'vila_pedravel', 'lavoura') === TETO_EDIFICIO_PADRAO, 'Capital vai a 7; vila fica em 5');
  ok(tetoDoEdificio(C, 'tessel', 'muralha') === 8 && tetoDoEdificio(C, 'corveira', 'muralha') === 7, 'A Praça de Armas leva a muralha de Tessel a 8');
  ok(tetoDoEdificio(T, 'tessel', 'muralha') === TETO_EDIFICIO_PADRAO && tetoDoEdificio(undefined, 'tessel', 'muralha') === TETO_EDIFICIO_PADRAO, 'Sem declaração (Tsukimichi, ou sem bundle), teto 5');
  const c = nova('teto');
  for (const id of ['tessel', 'vila_pedravel']) { c.vivo!.cidades[id].edificios.muralha = 5; c.vivo!.cidades[id].materiais = 200; }
  ok(iniciarObra(c, 'tessel', 'muralha', C) && !iniciarObra(c, 'vila_pedravel', 'muralha', C), 'Muralha 5 em Tessel ainda sobe; em Pedravel, não');
}

// ── 4. Efeitos por dia ────────────────────────────────────────────────────
function diasDeCidade(content: ContentBundle, seed: string, dias: number, preparar: (c: Campaign) => void) {
  const c = nova(seed, content);
  preparar(c);
  for (let i = 0; i < dias; i++) { c.calendario.dia++; processarCidades(content, c); }
  return c;
}
{
  const prep = (c: Campaign) => { c.vivo!.cidades.mareu.comida = 100; };
  const com = diasDeCidade(C, 'mareu', 20, prep), sem = diasDeCidade(SEM, 'mareu', 20, prep);
  const a = com.vivo!.cidades.mareu.comida, b = sem.vivo!.cidades.mareu.comida;
  ok(a - b >= 90, `Cais Grande: em 20 dias Mareu tem ${Math.round(a)} de comida contra ${Math.round(b)} sem o peixe`);
  ok(com.vivo!.cidades.porto_sal.comida === sem.vivo!.cidades.porto_sal.comida, 'O peixe é de Mareu: o Porto do Sal não muda');
}
{
  const prep = (c: Campaign) => { const s = c.vivo!.cidades.solgar; s.secaAte = 999; s.comida = 150; };
  const com = diasDeCidade(C, 'seca', 10, prep), sem = diasDeCidade(SEM, 'seca', 10, prep);
  const a = com.vivo!.cidades.solgar.comida, b = sem.vivo!.cidades.solgar.comida;
  ok(a > b, `Cisterna Funda: 10 dias de seca, Solgar com ${Math.round(a)} de comida contra ${Math.round(b)} (fertilidade ${C.edificiosRegionais!.find(e => e.cidade === 'solgar')!.efeitos.fertilidadeNaSeca} contra ${FERTILIDADE_NA_SECA})`);
}
{
  const prep = (c: Campaign) => { for (const id of ['vintra', 'aldeia_lenha']) c.vivo!.cidades[id].materiais = 0; };
  const com = diasDeCidade(C, 'madeira', 30, prep), sem = diasDeCidade(SEM, 'madeira', 30, prep);
  const a = com.vivo!.cidades.vintra.materiais, b = sem.vivo!.cidades.vintra.materiais;
  ok(a - b > 15, `Pátio da Madeira: em 30 dias Vintra junta ${a.toFixed(1)} de materiais contra ${b.toFixed(1)}`);
}
{
  const c = nova('bazar');
  const s = c.vivo!.cidades.solgar;
  s.estoque.pocao_cura = 0;
  for (let i = 0; i < 60; i++) { c.calendario.dia++; processarCidades(C, c); }
  ok(s.estoque.pocao_cura === 4, `O bazar de Solgar repõe peça rara até 4 (tem ${s.estoque.pocao_cura}); loja comum para em 2`);
}

// ── 5. A ronda de Tessel ──────────────────────────────────────────────────
{
  // Os três bandos caem em regiões sorteadas: procura uma campanha com bando na Marca.
  const regiao = C.locais.find(l => l.id === 'tessel')!.regiao;
  let c = nova('ronda-0');
  for (let i = 1; i < 60 && !Object.values(estadoBandos(C, c).bandos).some(b => b.regiao === regiao); i++) c = nova(`ronda-${i}`);
  const bando = Object.values(estadoBandos(C, c).bandos).find(b => b.regiao === regiao)!;
  ok(!!bando, `Há campanha com bando na ${regiao}: ${bando?.nome}`);
  bando.estado = 'ativo'; bando.membros = 6;
  c.calendario.dia = 14; aplicarEdificioRegional(C, c, 'tessel', c.vivo!.cidades.tessel, false);
  ok(bando.membros === 6, 'Fora do dia da ronda, nada');
  c.calendario.dia = 15; aplicarEdificioRegional(C, c, 'tessel', c.vivo!.cidades.tessel, false);
  ok(bando.membros === 5 && c.vivo!.fatos.some(f => f.tipo === 'ronda_guarnicao'), `No dia 15 a ronda tira um homem do bando (${bando.nome}), com fato público`);
  c.continuidade!.locais.tessel.integridade = 10;
  c.calendario.dia = 30; aplicarEdificioRegional(C, c, 'tessel', c.vivo!.cidades.tessel, false);
  ok(bando.membros === 5 && !edificioRegionalAtivo(C, c, 'tessel'), 'Tessel arrasada (integridade 10): sem guarnição, sem ronda');
}

// ── 6. Caravana pela costa ────────────────────────────────────────────────
{
  ok(fatorAtaqueCaravana(C, nova('fator'), 'mareu') === 0.5 && fatorAtaqueCaravana(C, nova('fator'), 'tessel') === 1, 'Caravana de Mareu corre metade do risco');
  const perdas = (content: ContentBundle) => {
    let perdidas = 0;
    for (let i = 0; i < 40; i++) {
      const c = nova(`costa-${i}`, content);
      const regiao = C.locais.find(l => l.id === 'mareu')!.regiao;
      const bandos = Object.values(estadoBandos(content, c).bandos);
      // Um bando de 8 na costa, os outros fora do mapa.
      bandos.forEach((b, j) => { b.regiao = j === 0 ? regiao : 'nenhuma'; b.estado = j === 0 ? 'ativo' : 'destruido'; b.membros = j === 0 ? 8 : 0; });
      const e = estadoCaravanas(c);
      e.lista.push({ id: `caravana_teste_${i}`, origem: 'mareu', destino: 'porto_sal', carga: 50, parte: 0, chega: 3, estado: 'viajando' });
      c.calendario.dia = 3; processarCaravanas(content, c);
      if (e.lista[0].estado === 'perdida') perdidas++;
    }
    return perdidas;
  };
  const com = perdas(C), sem = perdas(SEM);
  ok(com < sem && com > 0, `Com bando de 8 na costa, ${com} de 40 caravanas de Mareu se perdem (sem o cais, ${sem})`);
}

// ── 7. A forja ao alcance ─────────────────────────────────────────────────
{
  const c = nova('fundicao');
  c.localAtual = 'corveira';
  // Um período em que nenhuma ferreira está em Corveira: sobra só a fundição.
  let vazio: Periodo | undefined;
  for (const p of PERIODOS) {
    c.calendario.periodoIndex = PERIODOS.indexOf(p);
    if (!calcularContexto(SEM, c).presentes.some(n => /ferreir|forj|armeir|bigorna/i.test(n.ocupacao ?? ''))) { vazio = p; break; }
  }
  ok(!!vazio, `Em Corveira há período sem ferreira presente (${vazio})`);
  ok(!ondeForjar(SEM, c).pode && ondeForjar(C, c).pode, 'Sem a fundição não se forja ali nessa hora; com ela, sim');
  c.personagem.inventario = { minerio_de_ferro: 2 };
  const r = forjar(C, c, 'lamina_curta', 'minerio_de_ferro');
  ok(r.ok && !!r.item && !c.personagem.inventario.carvao, `Na Fundição Alta a peça sai sem carvão: ${r.item?.nome}`);
  const m = nova('fundicao-mercado');
  m.localAtual = 'mercado';
  m.personagem.inventario = { minerio_de_ferro: 2 };
  ok(!forjar(C, m, 'lamina_curta', 'minerio_de_ferro').ok, 'Na Feira Coberta, sem carvão, não');
  c.continuidade!.locais.corveira.integridade = 10;
  c.calendario.periodoIndex = PERIODOS.indexOf(vazio!);
  ok(!ondeForjar(C, c).pode, 'Corveira arrasada: a fundição apaga');
}

console.log('\nEdifícios regionais: OK.');
