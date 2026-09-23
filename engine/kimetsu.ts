import type { Campaign, CombatActor, ContentBundle, Criatura } from './types';
import type { RivalPersistente } from './kimetsuTypes';
import { periodoAtual } from './time';

export const VERSAO_COMBATE = 2;
export function inicializarKimetsu(camp: Campaign): void {
  camp.kimetsu ??= { versao: 1, sequencia: 0, rivais: {} };
}

export function haAbrigoSolar(content: ContentBundle, localId: string): boolean {
  const tipo = content.locais.find(l => l.id === localId)?.tipo;
  // A covered battlefield is explicit. Clouds and forest canopy are not shelter.
  return ['castelo', 'cripta', 'mina', 'mansao', 'taverna', 'capela', 'oficina', 'forja'].includes(tipo ?? '');
}

export function solDireto(content: ContentBundle, camp: Campaign): boolean {
  const periodo = periodoAtual(camp.calendario);
  return ['manha', 'tarde'].includes(periodo) && !haAbrigoSolar(content, camp.localAtual);
}

export function encontrosElegiveis(content: ContentBundle, camp: Campaign, pool: string[]): string[] {
  return [...new Set(pool)].filter(id => {
    const c = content.criaturas.find(c => c.id === id);
    if (!c) return false;
    const unico = c.perfilOni?.identidade;
    if (unico && (camp.flags[`matou.${id}`] || camp.kimetsu?.rivais[unico]?.vivo === false)) return false;
    return !c.oni || c.imuneLuz || !solDireto(content, camp);
  });
}

export function obterRival(camp: Campaign, c: Criatura, ocupados: string[], local = camp.localAtual, alvoId?: string): RivalPersistente | undefined {
  if (!c.oni) return undefined;
  inicializarKimetsu(camp);
  const estado = camp.kimetsu!;
  const unico = c.perfilOni?.identidade;
  const ameaca = camp.continuidade?.ameacas.find(a => a.local === local && a.criaturaId === c.id && a.estado !== 'resolvida');
  const alvo = alvoId && estado.rivais[alvoId];
  const preferido = alvo && alvo.vivo && alvo.local === local && alvo.criaturaId === c.id ? alvo : ameaca && estado.rivais[ameaca.rivalId];
  let rival = unico ? estado.rivais[unico] : preferido && preferido.vivo && !ocupados.includes(preferido.id) ? preferido : Object.values(estado.rivais).find(r =>
    r.vivo && r.criaturaId === c.id && r.local === local && !ocupados.includes(r.id));
  if (!rival) {
    const id = unico ?? `oni_${++estado.sequencia}`;
    rival = estado.rivais[id] = {
      id, criaturaId: c.id, nome: unico ? c.nome : `${c.nome} · ${estado.sequencia}`,
      vivo: !camp.flags[`matou.${c.id}`] || !unico,
      vida: c.vida, local, ultimoDia: camp.calendario.dia,
      reencontros: 0, vitorias: 0, fugas: 0, rancor: 0, memoria: [],
    };
  }
  // Rest regenerates wounds, never death. Same-day re-encounters retain damage.
  if (rival.vivo && camp.calendario.dia > rival.ultimoDia) rival.vida = c.vida;
  return rival;
}

export function registrarConfronto(camp: Campaign, resultado: 'vitoria' | 'derrota' | 'fuga'): void {
  const s = camp.combate;
  if (!s) return;
  for (const a of s.atores) {
    const r = a.rivalId && camp.kimetsu?.rivais[a.rivalId];
    if (!r) continue;
    const escapouDaMorte = (a.mortoDefinitivo || a.vida <= 0) && !a.perfilOni?.identidade && r.rancor >= 2 && (r.cheatDeath?.vezes ?? 0) < 2;

    if (escapouDaMorte) {
      // Pipeline Cheat Death: intercepta a morte e desvia para recuperação oculta
      const cicatrizMorte = `cicatriz_quase_morte_${s.ultimaTecnica ? s.ultimaTecnica.replace(/^respiracao_/, '') : 'lamina'}`;
      r.cheatDeath = {
        vezes: (r.cheatDeath?.vezes ?? 0) + 1,
        diaRetorno: camp.calendario.dia + 14,
        tecnicaSobrevivida: s.ultimaTecnica,
        cicatrizOrigem: cicatrizMorte,
      };
      r.cicatrizes ??= [];
      if (!r.cicatrizes.includes(cicatrizMorte)) r.cicatrizes.push(cicatrizMorte);
      r.vivo = true;
      r.vida = 1;
      if (r.evolucao) {
        r.evolucao.nivel = Math.max(0, r.evolucao.nivel - 1);
        r.evolucao.servos = Math.max(0, Math.floor(r.evolucao.servos / 2));
        r.evolucao.plano = 'ocultar';
      }
      r.comportamento ??= { recuperarAte: 0, pistaAte: 0, ultimoFeito: 0, ultimaAmeacaPessoal: -100 };
      r.comportamento.recuperarAte = Math.max(r.comportamento.recuperarAte, camp.calendario.dia + 14);
    } else {
      r.vida = a.vida;
      r.vivo = !a.mortoDefinitivo && a.vida > 0;
    }

    r.local = camp.localAtual;
    r.ultimoDia = camp.calendario.dia;
    r.reencontros++;
    if (r.vivo) r.rancor = Math.min(10, r.rancor + 1);
    if (resultado === 'derrota' && r.vivo) r.vitorias++;
    if (resultado === 'fuga') r.fugas++;

    // Títulos procedurais baseados na história
    if (r.vivo) {
      if (r.vitorias >= 2) r.titulo = 'o Carrasco';
      else if (r.fugas >= 2) r.titulo = 'o Evasivo';
      else if ((r.cicatrizes?.length ?? 0) >= 3) r.titulo = 'o Retalhado';
      else if ((r.evolucao?.servos ?? 0) >= 4) r.titulo = 'o Senhor da Matilha';
    }

    if (resultado === 'vitoria' && r.vivo && !escapouDaMorte) {
      // Regressão real ao ser superado em combate mas sobreviver
      if (r.evolucao) {
        r.evolucao.nivel = Math.max(0, r.evolucao.nivel - 1);
        r.evolucao.servos = Math.max(0, Math.floor(r.evolucao.servos / 2));
        r.evolucao.plano = 'ocultar';
        if (s.ultimaTecnica && r.evolucao.adaptacoes[s.ultimaTecnica]) {
          r.evolucao.adaptacoes[s.ultimaTecnica] = Math.max(0, r.evolucao.adaptacoes[s.ultimaTecnica] - 1);
        }
      }
      const cicatriz = s.ultimaTecnica
        ? `cicatriz_${s.ultimaTecnica.replace(/^respiracao_/, '')}`
        : 'marca_de_lamina_profunda';
      r.cicatrizes ??= [];
      if (!r.cicatrizes.includes(cicatriz)) r.cicatrizes.push(cicatriz);
      if (r.evolucao) {
        r.evolucao.cicatrizes ??= [];
        if (!r.evolucao.cicatrizes.includes(cicatriz)) r.evolucao.cicatrizes.push(cicatriz);
      }
    }
    r.memoria.push({ dia: camp.calendario.dia, resultado, tecnica: s.ultimaTecnica, local: camp.localAtual,
      testemunhas: s.atores.filter(x => x.ehAliado && x.npcId && x.vida > 0).map(x => x.npcId!) });
    r.comportamento ??= { recuperarAte: 0, pistaAte: 0, ultimoFeito: 0, ultimaAmeacaPessoal: -100 };
    r.comportamento.pista = camp.localAtual;
    r.comportamento.pistaAte = camp.calendario.dia + 14;
    if (r.vivo && (a.vida < a.vidaMax * .4 || resultado === 'vitoria')) {
      r.comportamento.recuperarAte = Math.max(r.comportamento.recuperarAte, camp.calendario.dia + (resultado === 'vitoria' ? 14 : 7));
    }
    r.memoria = r.memoria.slice(-12);
    if (!r.vivo && a.perfilOni?.identidade) camp.flags[`matou.${a.criaturaId}`] = true;
  }
}

// An oni at zero endurance is exposed, not necessarily dead.
export function aplicarFerimentoOni(camp: Campaign, alvo: CombatActor, nichirin: boolean): void {
  if (!alvo.oni || alvo.vida > 0) return;
  if (!nichirin || alvo.perfilOni?.morte === 'sol' || (alvo.perfilOni?.arte === 'emocoes' && !alvo.tatico?.revelado)) {
    alvo.vida = 1;
    camp.combate?.log.push(`${alvo.nome} perdeu a postura, mas a ferida não encerra sua existência.`);
    return;
  }
  if (alvo.perfilOni?.morte === 'gemeos') {
    alvo.vida = 1;
    alvo.decapitadoAte = (camp.combate?.rodada ?? 1) + 2;
    const outro = camp.combate?.atores.find(a => a.criaturaId === alvo.perfilOni?.parceiro);
    if (outro?.decapitadoAte && outro.decapitadoAte >= camp.combate!.rodada) {
      for (const a of [alvo, outro]) { a.vida = 0; a.mortoDefinitivo = true; }
      camp.combate!.log.push('Os dois pescoços foram cortados na mesma janela. O vínculo se desfaz.');
    } else camp.combate?.log.push('O outro irmão precisa ser decapitado antes que este se recomponha.');
    return;
  }
  alvo.mortoDefinitivo = true;
}
