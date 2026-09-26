// Persistent local history. A threat, its mission and its consequences share
// one identity, so a rumour cannot fabricate an unrelated battle result.
import type { Campaign, ContentBundle } from './types';
import { nextFloat, pick } from './rng';
import { obterRival } from './kimetsu';
import { registrarMarco } from './memoria';

export type Assentamento = {
  integridade: number;
  populacao: number;
  obra: number;
  nivel: number;
};
export type AmeacaLocal = {
  id: string;
  rivalId: string;
  criaturaId: string;
  local: string;
  inicio: number;
  prazo: number;
  estado: 'ativa' | 'resolvida' | 'devastou';
  descoberta: boolean;
};
export type ContinuidadeState = {
  versao: 1;
  locais: Record<string, Assentamento>;
  ameacas: AmeacaLocal[];
  proximaAmeaca: number;
  eventos: { dia: number; local: string; texto: string }[];
};

export function iniciarContinuidade(content: ContentBundle, camp: Campaign): void {
  if (camp.continuidade) return;
  camp.continuidade = {
    versao: 1, ameacas: [], eventos: [], proximaAmeaca: camp.calendario.dia + 7,
    // Cidade, vila e aldeia do continente tambem sao assentamentos de verdade:
    // tem economia, populacao e inseguranca proprias (ver cidades.ts).
    locais: Object.fromEntries(content.locais.filter(l => ['praca', 'mercado', 'oficina', 'forja', 'acampamento', 'cidade', 'vila', 'aldeia', 'porto', 'forte'].includes(l.tipo))
      .map(l => [l.id, { integridade: 100, populacao: 60, obra: 0, nivel: 1 }])),
  };
}

function acontecimento(camp: Campaign, local: string, texto: string): void {
  const estado = camp.continuidade!;
  estado.eventos.push({ dia: camp.calendario.dia, local, texto });
  estado.eventos = estado.eventos.slice(-120);
  registrarMarco(camp, texto);
}

export function criarAmeacaLocal(content: ContentBundle, camp: Campaign, local: string, criaturaId: string): AmeacaLocal | undefined {
  iniciarContinuidade(content, camp);
  const estado = camp.continuidade!;
  const criatura = content.criaturas.find(c => c.id === criaturaId && c.oni && !c.chefe);
  if (!criatura || !estado.locais[local] || estado.ameacas.some(a => a.local === local && a.estado !== 'resolvida')) return;
  const rival = obterRival(camp, criatura, [], local)!;
  const a: AmeacaLocal = {
    id: `ameaca_${rival.id}_${camp.calendario.dia}`, rivalId: rival.id, criaturaId,
    local, inicio: camp.calendario.dia, prazo: camp.calendario.dia + 7,
    estado: 'ativa', descoberta: camp.locaisVisitados.includes(local),
  };
  estado.ameacas.push(a);
  acontecimento(camp, local, `Desaparecimentos noturnos ameaçam ${content.locais.find(l => l.id === local)!.nome}.`);
  return a;
}

export function atualizarAmeacas(content: ContentBundle, camp: Campaign): void {
  const estado = camp.continuidade;
  if (!estado) return;
  for (const a of estado.ameacas.filter(a => a.estado !== 'resolvida')) {
    a.descoberta ||= camp.locaisVisitados.includes(a.local);
    const rival = camp.kimetsu?.rivais[a.rivalId];
    if (!rival || rival.vivo) continue;
    a.estado = 'resolvida';
    const lugar = estado.locais[a.local];
    lugar.integridade = Math.min(100, lugar.integridade + 5);
    acontecimento(camp, a.local, `A ameaça a ${content.locais.find(l => l.id === a.local)?.nome} terminou: ${rival.nome} morreu.`);
    // A reward belongs to the participant, never to the distant protagonist.
    if (rival.memoria.at(-1)?.resultado === 'vitoria') {
      camp.personagem.dinheiro += 30;
      camp.reputacao.cacadores = (camp.reputacao.cacadores ?? 0) + 3;
    }
  }
}

export function processarContinuidade(content: ContentBundle, camp: Campaign): void {
  iniciarContinuidade(content, camp);
  const estado = camp.continuidade!;
  atualizarAmeacas(content, camp);
  const dia = camp.calendario.dia;
  for (const [local, lugar] of Object.entries(estado.locais)) {
    const ameaca = estado.ameacas.find(a => a.local === local && a.estado !== 'resolvida');
    if (ameaca?.estado === 'ativa' && dia >= ameaca.prazo) {
      ameaca.estado = 'devastou';
      // Muralha fortificada além do padrão (nível > 1) protege contra dano estrutural e perdas humanas:
      const cid = camp.vivo?.cidades[local];
      const nivelMuralha = Math.max(0, (cid?.edificios.muralha ?? 1) - 1);
      const danoIntegridade = Math.max(10, 35 - nivelMuralha * 6);
      const perdasGente = Math.max(2, 8 - nivelMuralha * 2);
      lugar.integridade = Math.max(0, lugar.integridade - danoIntegridade);
      lugar.populacao = Math.max(0, lugar.populacao - perdasGente);
      lugar.obra = Math.max(0, lugar.obra - 20);
      acontecimento(camp, local, `O ataque anunciado atingiu ${content.locais.find(l => l.id === local)?.nome}: casas danificadas e moradores dispersos.`);
    }
    // `devastou` era estado terminal: a ameaça ficava pendurada no lugar para
    // sempre se o rival nunca fosse morto. E ameaça pendurada trava reconstrução
    // (aqui) e obra da cidade (cidades.ts), então a comunidade atingida nunca
    // mais levantava. Medido: comunidades novas terminando dez anos com
    // população zero e obra parada. Passado o estrago, o predador segue adiante
    // — continua vivo no Nemesis, só deixa de prender aquele lugar.
    if (ameaca?.estado === 'devastou' && dia >= ameaca.prazo + 30) {
      ameaca.estado = 'resolvida';
      acontecimento(camp, local, `O que atacou ${content.locais.find(l => l.id === local)?.nome} seguiu adiante. Ficaram as ruínas e o medo.`);
    }
    if (!ameaca && lugar.populacao > 0) {
      lugar.obra++;
      if (lugar.obra >= 90) {
        lugar.obra = 0;
        if (lugar.integridade < 100) lugar.integridade = Math.min(100, lugar.integridade + 25);
        else { lugar.nivel++; lugar.populacao += 5; }
        acontecimento(camp, local, `Uma etapa de reconstrução ou expansão foi concluída em ${content.locais.find(l => l.id === local)?.nome}.`);
      }
    }
  }
  const chanceBase = camp.calendario.estacao === 'inverno' ? .14 : .08;
  const chanceAmeaca = camp.mundo?.invernoRigoroso && dia < camp.mundo.invernoRigoroso.ate ? .22 : chanceBase;
  if (dia >= estado.proximaAmeaca && estado.ameacas.filter(a => a.estado !== 'resolvida').length < 2 && nextFloat(camp.rng) < chanceAmeaca) {
    const locais = Object.keys(estado.locais).filter(l => !estado.ameacas.some(a => a.local === l && a.estado !== 'resolvida'));
    const criaturas = content.criaturas.filter(c => c.oni && !c.chefe);
    if (locais.length && criaturas.length) criarAmeacaLocal(content, camp, pick(camp.rng, locais), pick(camp.rng, criaturas).id);
    estado.proximaAmeaca = dia + 14;
  }
  // Keep unfinished quests and bounded historical records.
  estado.ameacas = [...estado.ameacas.filter(a => a.estado === 'resolvida').slice(-40), ...estado.ameacas.filter(a => a.estado !== 'resolvida')];
}

export function ajudarReconstrucao(camp: Campaign): { ok: boolean; motivo?: string } {
  const lugar = camp.continuidade?.locais[camp.localAtual];
  if (!lugar) return { ok: false, motivo: 'não há obra comunitária neste local' };
  if (camp.combate && !camp.combate.terminado) return { ok: false, motivo: 'termine o combate primeiro' };
  if (camp.personagem.dinheiro < 20) return { ok: false, motivo: 'são necessárias 20 moedas em materiais' };
  if (lugar.integridade >= 100) return { ok: false, motivo: 'as estruturas estão conservadas' };
  camp.personagem.dinheiro -= 20;
  lugar.integridade = Math.min(100, lugar.integridade + 10);
  acontecimento(camp, camp.localAtual, 'Você forneceu materiais e recuperou estruturas da comunidade.');
  return { ok: true };
}
