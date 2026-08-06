// ARCANUM · Aplicação de efeitos no estado da campanha (compartilhado por turno e itens).
import type { Campaign, Efeito } from './types';
import { calcularDano } from './resolution';

function clamp100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export function aplicarEfeito(camp: Campaign, ef: Efeito): void {
  const p = camp.personagem;
  switch (ef.tipo) {
    case 'recurso':
      p.recursos[ef.recurso] = (p.recursos[ef.recurso] ?? 0) + ef.delta;
      break;
    case 'pressao':
      p.pressoes[ef.pressao] = (p.pressoes[ef.pressao] ?? 0) + ef.delta;
      break;
    case 'impulso':
      camp.impulsos[ef.impulso] = clamp100((camp.impulsos[ef.impulso] ?? 0) + ef.delta);
      break;
    case 'relacao': {
      const din = camp.npcState[ef.npc];
      if (din) din.eixos[ef.eixo] = (din.eixos[ef.eixo] ?? 0) + ef.delta;
      break;
    }
    case 'reputacao':
      camp.reputacao[ef.faccao] = (camp.reputacao[ef.faccao] ?? 0) + ef.delta;
      break;
    case 'dinheiro':
      p.dinheiro = Math.max(0, p.dinheiro + ef.delta);
      break;
    case 'xp':
      p.xp += ef.delta;
      break;
    case 'flag':
      camp.flags[ef.chave] = ef.valor;
      break;
    case 'item':
      p.inventario[ef.item] = Math.max(0, (p.inventario[ef.item] ?? 0) + ef.delta);
      if (p.inventario[ef.item] === 0) delete p.inventario[ef.item];
      break;
    case 'revelarSegredo':
      if (!camp.segredosRevelados.includes(ef.npc)) camp.segredosRevelados.push(ef.npc);
      break;
    case 'condicao':
      if (ef.adicionar) {
        if (!p.condicoes.includes(ef.condicao)) p.condicoes.push(ef.condicao);
      } else {
        p.condicoes = p.condicoes.filter((c) => c !== ef.condicao);
      }
      break;
    case 'danoJogador': {
      const dano = calcularDano(camp.rng, ef.perfil);
      p.recursos.vida = (p.recursos.vida ?? 0) - dano.valor;
      break;
    }
  }
}

// Substitui o placeholder "$alvo" pelo NPC realmente alvejado.
export function substituirAlvo(efeitos: Efeito[], alvoId?: string): Efeito[] {
  return efeitos.map((ef) => {
    if ('npc' in ef && ef.npc === '$alvo') {
      return { ...ef, npc: alvoId ?? ef.npc } as Efeito;
    }
    if (ef.tipo === 'flag' && ef.chave.includes('$alvo')) {
      return { ...ef, chave: ef.chave.replace('$alvo', alvoId ?? 'alvo') } as Efeito;
    }
    return ef;
  });
}
