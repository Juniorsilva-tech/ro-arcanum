import type { Campaign, ContentBundle } from './types';
import { periodosDeViagem } from './missoesVivas';
import { PERIODOS } from './time';
import type { AcaoMundo } from './acoesMundo';
import { armaEquipada } from './items';
import { rotasVisiveis } from './viagem';

export type PlanoSim = { tipo: 'viajar'; destino: string } | { tipo: 'agir'; acao: AcaoMundo };
// Only public mission information; no access to hidden aptitude or rival positions.
export function planejarMissao(content: ContentBundle, camp: Campaign): PlanoSim | undefined {
  const dia = camp.calendario.dia;
  const abertas = (camp.vivo?.missoes ?? []).filter(q => q.conhecida && q.prazo >= dia && ['aceita', 'oferecida'].includes(q.estado));
  const aceitas = abertas.filter(q => q.estado === 'aceita');
  const candidatas = (aceitas.length ? aceitas : abertas).sort((a, b) => a.prazo - b.prazo);
  for (const q of candidatas) {
    if (q.tipo === 'investigar' && q.etapa > 0 && q.rival) {
      const rival = camp.kimetsu?.rivais[q.rival];
      const ultimo = rival?.memoria.at(-1);
      // Only witnessed defeat/retreat informs the cooldown, not hidden enemy stats.
      if (ultimo && ultimo.resultado !== 'vitoria' && dia < ultimo.dia + 7) continue;
      if (!armaEquipada(content, camp.personagem)?.contraOni) continue;
    }
    const destino = q.tipo === 'escoltar' && q.etapa > 0 ? q.destino : q.local;
    if (!destino) continue;
    const ida = periodosDeViagem(content, camp.localAtual, destino);
    const escolta = q.tipo === 'escoltar' && !q.etapa && q.destino ? periodosDeViagem(content, destino, q.destino) : 0;
    const necessario = ida + escolta + (q.tipo === 'investigar' ? 12 : 3);
    if (!Number.isFinite(necessario) || necessario > (q.prazo - dia + 1) * PERIODOS.length) continue;
    if (q.estado === 'oferecida') return { tipo: 'agir', acao: { tipo: 'missao', id: q.id, escolha: 'aceitar' } };
    if (camp.localAtual !== destino) {
      const rotas = rotasVisiveis(content, camp);
      const rota = rotas.map(r => ({ ...r, total: Math.max(1, r.periodos) + periodosDeViagem(content, r.destino, destino) }))
        .filter(r => Number.isFinite(r.total)).sort((a, b) => a.total - b.total || a.perigo - b.perigo)[0];
      if (rota) return { tipo: 'viajar', destino: rota.destino };
      continue;
    }
    if (!['investigar', 'escoltar'].includes(q.tipo) && camp.personagem.dinheiro < 30 && q.tentativas >= 2) return { tipo: 'agir', acao: { tipo: 'trabalhar' } };
    return { tipo: 'agir', acao: { tipo: 'missao', id: q.id, escolha: q.tipo === 'investigar' ? q.etapa ? 'confrontar' : 'investigar' : q.tipo === 'escoltar' || camp.personagem.dinheiro >= 30 ? 'ajudar' : 'negociar' } };
  }
}
