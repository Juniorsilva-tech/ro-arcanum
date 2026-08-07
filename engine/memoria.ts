// ARCANUM · O que elas lembram (GDD §10.4).
//
// A memória existia antes: uma lista dos dez últimos fatos, escrita com a frase
// seca da engine ("Você tentou conversar Elza — deu certo") e nunca lida por
// ninguém. Isso é o mesmo que não lembrar. Aqui ela vira três coisas:
//
//   1. TIPADA — beijo não é o mesmo que roubo, e o narrador precisa saber qual.
//   2. ESCRITA DO PONTO DE VISTA DELA — é o que ela contaria, não o que a
//      engine registrou.
//   3. RETIDA POR PESO — a lista não descarta o mais antigo, descarta o menos
//      importante. Uma noite juntos sobrevive a cinquenta conversas de balcão.
import type { Campaign, Grau, NPC, Verbo } from './types';

export type TipoLembranca =
  | 'conversa'
  | 'intimidade'
  | 'promessa'
  | 'presente'
  | 'ajuda'
  | 'ofensa'
  | 'violencia'
  | 'mentira'
  | 'roubo'
  | 'dinheiro'
  | 'segredo'
  | 'marco';

export type Lembranca = {
  turno: number;
  dia?: number;
  resumo: string;
  peso: number; // 1 a 5 — quanto maior, mais tempo sobrevive
  tipo?: TipoLembranca;
};

const TETO_MEMORIA = 14;

// Guarda uma lembrança e faz espaço descartando a MENOS importante, não a mais
// antiga. É essa regra que faz uma traição durar a campanha inteira.
export function registrarLembranca(
  camp: Campaign,
  npcId: string,
  entrada: { tipo: TipoLembranca; resumo: string; peso: number },
): void {
  const din = camp.npcState[npcId];
  if (!din || !din.vivo) return;
  din.memoria.push({
    turno: camp.turno,
    dia: camp.calendario.dia,
    resumo: entrada.resumo,
    peso: Math.max(1, Math.min(5, Math.round(entrada.peso))),
    tipo: entrada.tipo,
  });
  if (din.memoria.length <= TETO_MEMORIA) return;
  // Ordena por importância e, em empate, por quem é mais recente.
  din.memoria.sort((a, b) => (b.peso - a.peso) || (b.turno - a.turno));
  din.memoria.length = TETO_MEMORIA;
  din.memoria.sort((a, b) => a.turno - b.turno);
}

// Que tipo de lembrança cada verbo deixa, e quanto ela pesa.
const PORVERBO: Record<string, { tipo: TipoLembranca; peso: number }> = {
  flertar: { tipo: 'intimidade', peso: 4 },
  presentear: { tipo: 'presente', peso: 4 },
  consolar: { tipo: 'ajuda', peso: 4 },
  elogiar: { tipo: 'conversa', peso: 2 },
  conversar: { tipo: 'conversa', peso: 1 },
  provocar: { tipo: 'ofensa', peso: 3 },
  ameacar: { tipo: 'ofensa', peso: 4 },
  chantagear: { tipo: 'ofensa', peso: 5 },
  agredir: { tipo: 'violencia', peso: 5 },
  envenenar: { tipo: 'violencia', peso: 5 },
  mentir: { tipo: 'mentira', peso: 3 },
  furtar: { tipo: 'roubo', peso: 4 },
  bater_carteira: { tipo: 'roubo', peso: 4 },
  subornar: { tipo: 'dinheiro', peso: 3 },
  vigiar: { tipo: 'segredo', peso: 2 },
  escutar_escondido: { tipo: 'segredo', peso: 2 },
  tocar: { tipo: 'conversa', peso: 2 },
  pedir_licao: { tipo: 'ajuda', peso: 3 },
};

// A frase que ELA contaria depois. Não é o log da engine; é a versão dela.
function comoElaConta(verbo: Verbo, tipo: TipoLembranca, grau?: Grau): string {
  const deuCerto = !grau || grau === 'critico' || grau === 'sucesso' || grau === 'sucesso_com_custo';
  switch (tipo) {
    case 'intimidade':
      return deuCerto ? 'você a cortejou, e ela deixou' : 'você tentou cantá-la e levou um gelo';
    case 'presente':
      return deuCerto ? 'você lhe deu alguma coisa sem pedir nada' : 'você ofereceu algo e ela recusou';
    case 'ajuda':
      return deuCerto ? 'você ficou do lado dela quando precisou' : 'você tentou ajudar e só atrapalhou';
    case 'ofensa':
      return deuCerto ? 'você a acuou, e funcionou' : 'você tentou intimidá-la e ela não engoliu';
    case 'violencia':
      return deuCerto ? 'você encostou a mão nela' : 'você partiu para cima dela e falhou';
    case 'mentira':
      return deuCerto ? 'você mentiu, e ela acreditou' : 'você mentiu, e ela percebeu';
    case 'roubo':
      return deuCerto ? 'sumiu algo dela, e ela desconfia de você' : 'você foi pego tentando roubá-la';
    case 'dinheiro':
      return deuCerto ? 'você comprou o silêncio dela' : 'você ofereceu prata e ela cuspiu no chão';
    case 'segredo':
      return deuCerto ? 'você andou observando ela de longe' : 'ela te flagrou bisbilhotando';
    default:
      return deuCerto
        ? `você trocou palavra com ela sobre ${verbo.nome.toLowerCase()}`
        : `você tentou ${verbo.nome.toLowerCase()} e não saiu como queria`;
  }
}

// Chamada pelo turno: transforma o que aconteceu na lembrança dela.
export function lembrarDoTurno(
  camp: Campaign,
  alvo: NPC,
  verbo: Verbo | undefined,
  grau: Grau | undefined,
  rotuloLivre?: string,
): void {
  if (!verbo) {
    // Opção de cena ou ação livre: guarda o rótulo, que já é concreto.
    if (rotuloLivre) {
      registrarLembranca(camp, alvo.id, { tipo: 'conversa', resumo: rotuloLivre.toLowerCase(), peso: 2 });
    }
    return;
  }
  const regra = PORVERBO[verbo.id] ?? { tipo: 'conversa' as TipoLembranca, peso: 1 };
  // Fracasso feio marca mais do que sucesso morno.
  const peso = grau === 'falha_grave' ? Math.min(5, regra.peso + 1) : regra.peso;
  registrarLembranca(camp, alvo.id, {
    tipo: regra.tipo,
    resumo: comoElaConta(verbo, regra.tipo, grau),
    peso,
  });
}

// O que vai no pacote do narrador: o que ela guardou de mais forte, em ordem.
export function memoriaParaNarrador(camp: Campaign, npcId: string, quantas = 5): string[] {
  const din = camp.npcState[npcId];
  if (!din) return [];
  return [...din.memoria]
    .sort((a, b) => (b.peso - a.peso) || (b.turno - a.turno))
    .slice(0, quantas)
    .sort((a, b) => a.turno - b.turno)
    .map((m) => (m.dia ? `dia ${m.dia}: ${m.resumo}` : m.resumo));
}

// Há quantos dias vocês se conhecem — o narrador precisa disso para calibrar
// intimidade. Ninguém trata um estranho como trata alguém de duas semanas.
export function diasDeConvivio(camp: Campaign, npcId: string): number {
  const din = camp.npcState[npcId];
  const primeira = din?.memoria[0];
  if (!primeira?.dia) return 0;
  return Math.max(0, camp.calendario.dia - primeira.dia);
}

// ── Marcos da campanha ─────────────────────────────────────────────────────
// A memória de NPC é local. Isto aqui é a memória da HISTÓRIA: o punhado de
// acontecimentos que o narrador deve poder citar cem turnos depois.

export function registrarMarco(camp: Campaign, texto: string): void {
  const lista = camp.marcos ?? (camp.marcos = []);
  if (lista.some((m) => m.texto === texto)) return; // um marco, uma vez
  lista.push({ turno: camp.turno, dia: camp.calendario.dia, texto });
  if (lista.length > 40) lista.shift();
}

export function marcosRecentes(camp: Campaign, quantos = 8): string[] {
  return (camp.marcos ?? []).slice(-quantos).map((m) => `dia ${m.dia}: ${m.texto}`);
}

// ── Como ela está com você, em uma frase ───────────────────────────────────
// Escolher entre "Bael" e "Halda" pelo nome e pela ocupação é escolher no
// escuro. Uma frase derivada do estado muda a decisão sem mostrar número
// nenhum — a régua continua escondida (GDD §10.1).
export function estadoDoNpc(camp: Campaign, npc: NPC): string {
  const din = camp.npcState[npc.id];
  if (!din) return 'Você ainda não trocou palavra com ela.';
  if (!din.vivo) return 'Já não responde a ninguém.';

  const confianca = din.eixos.confianca ?? 0;
  const disposicao = din.eixos.disposicao ?? 0;
  const medo = din.eixos.medo ?? 0;
  const conhece = din.memoria.length > 0;

  if (medo >= 12) return 'Fica de olho na porta quando você chega.';
  if (din.tensao >= 70) return 'Anda magoada com o seu sumiço.';
  if (!conhece) return 'Nunca falou com você. Mede você de longe.';

  const ultima = [...din.memoria].sort((a, b) => b.peso - a.peso)[0];
  if (ultima?.tipo === 'violencia') return 'Não esqueceu o que você fez com ela.';
  if (ultima?.tipo === 'roubo') return 'Conta as moedas quando você está por perto.';
  if (ultima?.tipo === 'mentira') return 'Escuta você com meia orelha desde a última vez.';

  if (confianca >= 12) return 'Abre a guarda quando é você.';
  if (ultima?.tipo === 'intimidade' && disposicao >= 6) return 'Segura o olhar um instante a mais.';
  if (disposicao >= 8) return 'Fica à vontade com você.';
  if (disposicao <= -6) return 'Responde curto e olha para o lado.';
  return 'Trata você com a cortesia de quem ainda não decidiu.';
}
