import type { Campaign, ContentBundle } from './types';
import type { FatoHistorico, MissaoViva } from './vivoTypes';
import { registrarFato } from './historiaViva';

const TITULOS: Record<MissaoViva['tipo'], string> = {
  abastecer: 'Pão antes do êxodo', tratar: 'Conter a febre', escoltar: 'Uma casa em outro lugar',
  reconstruir: 'Erguer de novo', resgatar: 'Uma pessoa levada', investigar: 'Rastros sob a noite',
};
export function oferecerMissao(camp: Campaign, tipo: MissaoViva['tipo'], fato: FatoHistorico, extra: Partial<Pick<MissaoViva, 'ator' | 'destino' | 'rival'>> = {}): MissaoViva | undefined {
  const v = camp.vivo!;
  const abertas = v.missoes.filter(q => ['oferecida', 'aceita'].includes(q.estado));
  if (abertas.some(q => q.tipo === tipo && q.local === fato.local && q.ator === extra.ator) || abertas.length >= 12) return;
  const q: MissaoViva = {
    id: `missao_${++v.sequencia}`, tipo, titulo: TITULOS[tipo], local: fato.local,
    causa: { id: fato.id, texto: fato.texto }, prazo: camp.calendario.dia + (tipo === 'escoltar' ? 16 : 10),
    estado: 'oferecida', etapa: 0, conhecida: fato.conhecimento !== 'oculto', tentativas: 0,
    recompensa: tipo === 'investigar' || tipo === 'resgatar' ? 35 : 20, ...extra,
  };
  v.missoes.push(q);
  v.contadores.missoesGeradas = (v.contadores.missoesGeradas ?? 0) + 1;
  return q;
}

export function encerrarMissao(camp: Campaign, q: MissaoViva, estado: MissaoViva['estado'], texto: string): void {
  if (!['oferecida', 'aceita'].includes(q.estado)) return;
  const participou = q.estado === 'aceita' && estado === 'concluida';
  q.estado = estado; q.desfecho = texto;
  if (participou) {
    camp.personagem.dinheiro += q.recompensa;
    camp.personagem.xp += 15;
    camp.reputacao.vila = (camp.reputacao.vila ?? 0) + 2;
  }
  registrarFato(camp, { tipo: `missao_${estado}`, local: q.local, texto, atores: q.ator ? [q.ator] : [], causa: q.causa, publico: true });
}

export function processarMissoesVivas(content: ContentBundle, camp: Campaign): void {
  const v = camp.vivo!;
  for (const q of v.missoes.filter(q => ['oferecida', 'aceita'].includes(q.estado))) {
    const cidade = v.cidades[q.local];
    if (q.ator && !camp.npcState[q.ator]?.vivo) {
      encerrarMissao(camp, q, 'falhada', 'A pessoa envolvida morreu. O compromisso ficou sem resolução.'); continue;
    }
    const rival = q.rival ? camp.kimetsu?.rivais[q.rival] : undefined;
    if (q.tipo === 'investigar' && rival && !rival.vivo) {
      // Participation is checked against the real confrontation record.
      const matou = q.estado === 'aceita' && rival.memoria.at(-1)?.resultado === 'vitoria' && rival.ultimoDia >= q.prazo - 10;
      encerrarMissao(camp, q, matou ? 'concluida' : 'resolvida_por_outros', `${rival.nome} foi eliminado; a origem dos desaparecimentos acabou.`); continue;
    }
    const civil = q.ator && v.pessoas[q.ator];
    if (q.tipo === 'resgatar' && civil && civil.objetivo !== 'cativo') {
      encerrarMissao(camp, q, 'resolvida_por_outros', 'A pessoa recuperou a liberdade por outro caminho.'); continue;
    }
    if ((q.tipo === 'abastecer' && cidade?.fomeDias === 0 && cidade.comida >= 80) ||
        (q.tipo === 'tratar' && cidade?.doenca === 0) ||
        (q.tipo === 'reconstruir' && (camp.continuidade?.locais[q.local]?.integridade ?? 0) >= 95)) {
      encerrarMissao(camp, q, 'resolvida_por_outros', 'A comunidade resolveu a necessidade com os próprios recursos.'); continue;
    }
    if (camp.calendario.dia > q.prazo) {
      encerrarMissao(camp, q, 'falhada', `${q.titulo}: o prazo passou. As pessoas seguiram vivendo com as consequências.`);
      if (cidade) cidade.inseguranca = Math.min(100, cidade.inseguranca + 8);
      if (q.tipo === 'abastecer' && cidade && cidade.fomeDias > 0) {
        const fato = registrarFato(camp, { tipo: 'exodo', local: q.local, texto: 'Sem abastecimento, famílias passaram a procurar uma saída da vila.', atores: [], causa: q.causa, publico: true });
        const destino = Object.keys(v.cidades).find(id => id !== q.local && v.cidades[id].comida > 100);
        if (destino) oferecerMissao(camp, 'escoltar', fato, { destino });
      }
    }
  }
  v.missoes = [...v.missoes.filter(q => !['oferecida', 'aceita'].includes(q.estado)).slice(-60), ...v.missoes.filter(q => ['oferecida', 'aceita'].includes(q.estado))];
  void content;
}
