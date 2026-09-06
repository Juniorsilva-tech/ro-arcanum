// ARCANUM · Banco de provas do combate.
//
// Roda combates de verdade — as mesmas funções que a tela usa — entre um
// jogador construído sob medida e uma criatura do bestiário, e agrupa o
// resultado pela RAZÃO DE PODER (ver engine/poder.ts), não pelo nível.
//
// A tabela de referência combinada é esta:
//   equivalente (razão ~1,0)   → 45-55% de vitória
//   jogador +20% (razão ~1,2)  → 65-75%
//   jogador +40% (razão ~1,4)  → 80-90%
//   jogador -20% (razão ~0,8)  → 25-35%
//   jogador -40% (razão ~0,6)  → 10-20%
//
// Uso: npm run balanco -- [combatesPorFaixa]
import type { Campaign, ContentBundle, Criatura } from './types';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import { createRng, seedFromString } from './rng';
import { iniciarCombate, jogadorAtaca, jogadorFoge, jogadorAcaoTatica, fecharCombate } from './combat';
import {
  razaoDePoder, poderEfetivo, fichaDoJogador, fichaDaCriatura, detalharPoder,
  podeDerrotar, vantagemNoDuelo, adversarioNaRazao, mensuravelPorDuelo,
} from './poder';
import { estadoAptidao, esforcoParaMaestria } from './aptidao';
import { recalcularRecursosMaximos } from './progresso';

export type Faixa = { nome: string; alvo: [number, number]; razao: number };

export const FAIXAS: Faixa[] = [
  { nome: 'jogador -40%', razao: 0.6, alvo: [10, 20] },
  { nome: 'jogador -20%', razao: 0.8, alvo: [25, 35] },
  { nome: 'equivalentes', razao: 1.0, alvo: [45, 55] },
  { nome: 'jogador +20%', razao: 1.2, alvo: [65, 75] },
  { nome: 'jogador +40%', razao: 1.4, alvo: [80, 90] },
];

export type OpcoesJogador = {
  nivel: number;
  maestriaEspada: number;
  /** Id da arma equipada; sem isso o personagem luta desarmado. */
  arma?: string;
  armadura?: string;
  atributo?: number;
};

/** Monta um jogador sob medida, sem passar pela criação normal de campanha. */
export function jogadorDeTeste(content: ContentBundle, opts: OpcoesJogador, seed: string): Campaign {
  const camp = criarCampanha(content, {
    nome: 'Provador', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida',
    seedString: seed,
  });
  const p = camp.personagem;
  if (opts.atributo) {
    for (const k of Object.keys(p.atributos) as (keyof typeof p.atributos)[]) p.atributos[k] = opts.atributo;
  }
  p.nivel = opts.nivel;
  if (opts.arma) { p.inventario[opts.arma] = 1; p.equipado.arma = opts.arma; }
  if (opts.armadura) { p.inventario[opts.armadura] = 1; p.equipado.armadura = opts.armadura; }
  const a = estadoAptidao(camp);
  a.esforco.espada = esforcoParaMaestria(opts.maestriaEspada);
  // O prólogo de infância não interessa aqui: o alvo é a matemática do combate.
  if (camp.familia) camp.familia.prologoConcluido = true;
  recalcularRecursosMaximos(camp);
  p.recursos.vida = p.recursosMax.vida;
  return camp;
}

/** Roda um combate até o fim e devolve o desfecho. */
export function combateUnico(
  content: ContentBundle,
  camp: Campaign,
  criaturaId: string,
): 'vitoria' | 'derrota' | 'fuga' {
  iniciarCombate(content, camp, [criaturaId]);
  let guarda = 0;
  while (camp.combate && !camp.combate.terminado && guarda++ < 400) {
    const s = camp.combate;
    const eu = s.atores.find(a => a.ehJogador);
    const inimigos = s.atores.filter(a => !a.ehJogador && !a.ehAliado && a.vida > 0);
    if (!eu || !inimigos.length) break;
    if (eu.tatico?.sono) jogadorAcaoTatica(content, camp, 'despertar');
    else if (eu.tatico?.preso) jogadorAcaoTatica(content, camp, 'libertar');
    else if (eu.vida <= 0) break;
    else jogadorAtaca(content, camp, [...inimigos].sort((a, b) => a.vida - b.vida)[0].id);
  }
  const r = camp.combate?.resultado ?? 'derrota';
  fecharCombate(camp);
  return r;
}

export type ResultadoFaixa = {
  faixa: Faixa;
  combates: number;
  vitorias: number;
  taxa: number;
  dentro: boolean;
  razaoMedia: number;
  exemplo: string;
};

/**
 * Para cada faixa, monta um adversário artificial na razão exata e roda N
 * combates de verdade contra ele. Mede a matemática do combate, não a sorte de
 * o bestiário ter alguém do tamanho certo (isso é medido em `cobertura`).
 */
export function medirFaixas(
  content: ContentBundle,
  opts: OpcoesJogador,
  porFaixa = 400,
): ResultadoFaixa[] {
  const modelo = jogadorDeTeste(content, opts, 'balanco-modelo');
  const fichaJogador = fichaDoJogador(content, modelo);

  return FAIXAS.map(faixa => {
    const ficha = adversarioNaRazao(fichaJogador, faixa.razao);
    const sintetica: Criatura = {
      id: '__afericao__', nome: 'Adversário de aferição',
      descricao: 'Existe apenas no banco de provas.',
      nivel: 0, vida: Math.round(ficha.vida), defesa: ficha.defesa, acerto: ficha.acerto,
      ataqueNome: 'golpe', dano: ficha.dano, moralBase: 100, xp: 0,
    };
    const bancada: ContentBundle = { ...content, criaturas: [...content.criaturas, sintetica] };
    let vitorias = 0;
    let razao = 0;
    for (let i = 0; i < porFaixa; i++) {
      const camp = jogadorDeTeste(bancada, opts, `balanco-${faixa.nome}-${i}`);
      camp.rng = createRng(seedFromString(`combate:${faixa.nome}:${i}`));
      razao = razaoDePoder(bancada, camp, sintetica);
      if (combateUnico(bancada, camp, sintetica.id) === 'vitoria') vitorias++;
    }
    const taxa = (100 * vitorias) / porFaixa;
    return {
      faixa, combates: porFaixa, vitorias, taxa,
      dentro: taxa >= faixa.alvo[0] && taxa <= faixa.alvo[1],
      razaoMedia: razao,
      exemplo: `vida ${sintetica.vida} · dano ${ficha.dano.base.toFixed(1)}`,
    };
  });
}

/**
 * Cobertura do bestiário: quantas criaturas reais este jogador encontraria em
 * cada faixa. Responde a pergunta que a aferição sintética não responde — se
 * existe adversário do tamanho certo no mundo.
 */
export function cobertura(content: ContentBundle, opts: OpcoesJogador): string[] {
  const camp = jogadorDeTeste(content, opts, 'cobertura');
  const ficha = fichaDoJogador(content, camp);
  const uteis = content.criaturas.filter(
    c => mensuravelPorDuelo(c) && podeDerrotar(content, camp, c) && poderEfetivo(fichaDaCriatura(c)) > 0,
  );
  return FAIXAS.map(f => {
    const dentro = uteis.filter(c => {
      const v = vantagemNoDuelo(ficha, fichaDaCriatura(c));
      return v >= f.razao * 0.85 && v <= f.razao * 1.15;
    });
    const nomes = dentro.slice(0, 3).map(c => c.nome).join(', ');
    return `${f.nome.padEnd(13)} ${String(dentro.length).padStart(3)} criaturas${nomes ? `  (${nomes})` : ''}`;
  });
}

/** Retrato do personagem para o cabeçalho do relatório. */
export function descreverJogador(content: ContentBundle, opts: OpcoesJogador): string {
  const camp = jogadorDeTeste(content, opts, 'balanco-retrato');
  const f = fichaDoJogador(content, camp);
  return `nível ${opts.nivel} · maestria ${opts.maestriaEspada} · vida ${f.vida} · ` +
    `defesa ${f.defesa} · acerto ${f.acerto} · dano ${f.dano.base.toFixed(1)} · ${detalharPoder(f)}`;
}
