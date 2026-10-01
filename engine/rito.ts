// ARCANUM · O rito do mestre (prova antes do ensino).
//
// Quem já chega bom — o gênio que aos 18 anos maneja a espada como poucos —
// não precisa começar pela primeira lição. Em vez de pedir para aprender, ele
// pede a PROVA: um duelo de verdade com o mestre, que para quando um dos dois
// cai a um quarto da vida (ninguém morre). A engine mede a luta e o mestre
// diz o que viu:
// - venceu: "aprovado" — a primeira arte do mestre sai na hora, sem as
//   lições, e o vale fica sabendo;
// - resistiu (tirou 40%+ da vida do mestre): "promissor" — aprender com este
//   mestre custa metade do tempo;
// - caiu cedo: "cru" — treino normal.
// Em todos os casos o mestre aponta o que falta, pelos números da luta
// (golpe que não entra, guarda que abre, golpe sem peso, fôlego curto), e
// forma uma opinião sobre o talento (engine/aptidao.ts, pela observação).
//
// Pode-se repetir a prova com o mesmo mestre a cada 30 dias.
import type { Campaign, ContentBundle } from './types';
import { iniciarCombate } from './combat';
import { mestreDisponivel } from './magic';
import { calcularContexto } from './availability';
import { treinar, dominioDaArte } from './aptidao';
import { registrarMarco } from './memoria';
import { registrarFato } from './historiaViva';
import { idDoRito } from '../content/vaelhorn/ritoMestres';
import { adotarEstilo, mestreRecusa } from './estiloMestre';

export const DIAS_ENTRE_RITOS = 30;

export type ResultadoRito = 'aprovado' | 'promissor' | 'cru';

export function podePedirRito(content: ContentBundle, camp: Campaign, mestreId: string): { pode: boolean; motivo?: string } {
  const m = content.mestres.find((x) => x.id === mestreId);
  if (!m) return { pode: false, motivo: 'mestre desconhecido' };
  if (camp.combate && !camp.combate.terminado) return { pode: false, motivo: 'já há uma luta em curso' };
  if (!content.criaturas.some((c) => c.id === idDoRito(mestreId))) return { pode: false, motivo: 'este mestre não faz prova' };
  if (!mestreDisponivel(content, camp, m, calcularContexto(content, camp))) return { pode: false, motivo: 'o mestre não está aqui' };
  const recusa = mestreRecusa(content, camp, mestreId);
  if (recusa) return { pode: false, motivo: recusa };
  const ultimo = camp.ritos?.[mestreId]?.dia;
  if (ultimo !== undefined && camp.calendario.dia - ultimo < DIAS_ENTRE_RITOS) {
    return { pode: false, motivo: `o mestre só aceita outra prova daqui a ${DIAS_ENTRE_RITOS - (camp.calendario.dia - ultimo)} dias` };
  }
  return { pode: true };
}

/** Começa o duelo de prova. Devolve false se não pode. */
export function iniciarRito(content: ContentBundle, camp: Campaign, mestreId: string): { ok: boolean; motivo?: string } {
  const pode = podePedirRito(content, camp, mestreId);
  if (!pode.pode) return { ok: false, motivo: pode.motivo };
  const s = iniciarCombate(content, camp, [idDoRito(mestreId)]);
  s.rito = { mestreId };
  s.log.push('Prova do mestre: a luta para quando um dos dois cair a um quarto das forças. Ninguém morre aqui.');
  return { ok: true };
}

type Lacuna = { chave: string; texto: string; peso: number };

/** O que o mestre viu faltar, pelos números da luta. */
function lacunas(s: NonNullable<Campaign['combate']>): string[] {
  const jog = s.atores.find((a) => a.ehJogador)!;
  const mestre = s.atores.find((a) => !a.ehJogador && !a.ehAliado)!;
  const l: Lacuna[] = [
    { chave: 'acerto', texto: 'seu golpe não encontra a guarda — falta precisão e leitura do adversário', peso: mestre.defesa - jog.acerto },
    { chave: 'defesa', texto: 'sua guarda abre cedo — falta defesa, postura e armadura', peso: mestre.acerto - jog.defesa },
    { chave: 'dano', texto: 'seu golpe não pesa — falta força no corpo ou gume na arma', peso: ((mestre.vidaMax / 6) - (jog.dano?.base ?? 5)) / 2 },
    { chave: 'folego', texto: 'o fôlego acaba antes da luta — falta corpo, resistência', peso: (mestre.vidaMax - jog.vidaMax) / 20 },
  ];
  return l.filter((x) => x.peso > 0).sort((a, b) => b.peso - a.peso).slice(0, 2).map((x) => x.texto);
}

/**
 * Fecha o rito depois que a luta acabou: grava o resultado, dá o que o
 * resultado dá, e devolve o fato para o narrador.
 */
export function concluirRito(content: ContentBundle, camp: Campaign): { resultado: ResultadoRito; fato: string } | undefined {
  const s = camp.combate;
  if (!s?.rito) return undefined;
  const m = content.mestres.find((x) => x.id === s.rito!.mestreId)!;
  const mestreAtor = s.atores.find((a) => !a.ehJogador && !a.ehAliado)!;
  const pessoa = content.npcs.find((n) => n.ensinaMestre === m.id);
  const nome = pessoa?.nome ?? m.nome;
  const tirou = 1 - mestreAtor.vida / Math.max(1, mestreAtor.vidaMax);
  const resultado: ResultadoRito = s.resultado === 'vitoria' ? 'aprovado' : tirou >= 0.4 ? 'promissor' : 'cru';
  (camp.ritos ??= {})[m.id] = { dia: camp.calendario.dia, resultado };
  if (resultado !== 'cru') adotarEstilo(camp, m.id);

  // O mestre olhou de perto: a opinião dele sobre o seu talento se forma aqui.
  const primeira = content.artes.find((a) => a.id === m.ensina[0]);
  const dominio = dominioDaArte(primeira?.tecnica?.estilo);
  treinar(content, camp, dominio, {
    mestre: 0.9,
    esforco: resultado === 'aprovado' ? 1 : resultado === 'promissor' ? 0.8 : 0.5,
    recursos: 0.6,
    observadorId: pessoa?.id,
  });

  const falta = lacunas(s);
  let fato: string;
  if (resultado === 'aprovado') {
    let ganhou = '';
    if (primeira && !camp.personagem.artesConhecidas.includes(primeira.id)) {
      camp.personagem.artesConhecidas.push(primeira.id);
      ganhou = ` ${nome} te mostra ${primeira.nome} ali mesmo: quem passou na prova não precisa das primeiras lições.`;
    }
    if (!camp.personagem.alcunhas.includes(`Aprovado por ${nome}`)) camp.personagem.alcunhas.push(`Aprovado por ${nome}`);
    registrarMarco(camp, `você venceu a prova de ${nome}`);
    if (camp.vivo) registrarFato(camp, { tipo: 'rito_mestre', local: camp.localAtual, texto: `${camp.personagem.nome} venceu a prova de ${nome}.`, atores: ['jogador'], publico: true });
    fato = `Você venceu a prova de ${nome}.${ganhou}${falta.length ? ` Mesmo assim, ${nome} aponta: ${falta[0]}.` : ''}`;
  } else if (resultado === 'promissor') {
    fato = `Você perdeu a prova de ${nome}, mas tirou ${Math.round(tirou * 100)}% das forças do mestre. ${nome} aceita te ensinar pela metade do tempo. O que falta: ${falta.join('; ') || 'só rodagem'}.`;
  } else {
    fato = `Você caiu cedo na prova de ${nome}. O treino vai ser do começo. O que falta: ${falta.join('; ') || 'quase tudo'}.`;
  }
  return { resultado, fato };
}
