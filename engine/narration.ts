// ARCANUM · Narração canônica de fallback (GDD §20, requisito P0).
// Sem rede / com o modelo fora do ar, o jogo continua mais seco e NÃO trava.
import type { Campaign, ContentBundle, NPC } from './types';
import type { ResultadoTurno, OpcaoResolvida } from './turn';
import { calcularContexto, type Contexto } from './availability';
import { pick, type RngState } from './rng';
import { NOME_PERIODO } from './time';

// O jogo NARRA, não descreve: registro seco, concreto (GDD §0.2).
export function montarCena(content: ContentBundle, camp: Campaign): {
  narracao: string;
  eco?: string;
  opcoes: OpcaoResolvida[];
  contexto: Contexto;
} {
  const ctx = calcularContexto(content, camp);
  const atmosfera =
    ctx.local.atmosferaPorPeriodo[ctx.periodo] ?? ctx.local.descricaoBase;

  const presencaTxt =
    ctx.presentes.length === 0
      ? 'Você está só.'
      : ctx.presentes.length === 1
        ? `${ctx.presentes[0].nome} está aqui.`
        : `${ctx.presentes.slice(0, -1).map((n) => n.nome).join(', ')} e ${
            ctx.presentes[ctx.presentes.length - 1].nome
          } estão aqui.`;

  const narracao = `${atmosfera} ${presencaTxt}`;
  const opcoes = opcoesCanonicas(content, camp, ctx);
  return { narracao, opcoes, contexto: ctx };
}

// Narra o fato consumado devolvido pela engine (GDD §4.4).
export function narrarResultado(camp: Campaign, r: ResultadoTurno): { narracao: string; eco?: string } {
  const rng = camp.rng;
  const base = r.fato;
  const cor = corDaConsequencia(rng, r);
  const eco = ecoDeConsequencia(rng, r);
  return { narracao: `${base} ${cor}`.trim(), eco };
}

// Variações por grau: sem IA o registro continua seco, mas não vira disco riscado.
const CORES_POR_GRAU: Record<string, string[]> = {
  critico: [
    'Por um momento, tudo se encaixa.',
    'Sai melhor do que você tinha o direito de esperar.',
    'A sorte, dessa vez, escolheu um lado.',
    'Fica a sensação de ter roubado algo do acaso.',
  ],
  sucesso: [
    '',
    'Simples assim, e ninguém aplaude.',
    'Feito. O mundo mal registra.',
    'Sai como devia sair.',
  ],
  sucesso_com_custo: [
    'Ficou uma conta em aberto.',
    'Deu certo — e cobrou o troco na hora.',
    'Você leva o que queria, e algo a mais que não pediu.',
    'O preço vem depois, mas vem.',
  ],
  falha: [
    'Nada acontece — e isso também é uma resposta.',
    'A coisa escapa por entre os dedos.',
    'Não pega. Fica o gesto no ar.',
    'Faltou pouco, e pouco basta para não ser.',
  ],
  falha_grave: [
    'O silêncio depois é pior que o erro.',
    'Piora. Piora de um jeito que vai lembrar.',
    'O estrago é maior que a tentativa.',
    'Você entende, tarde demais, o tamanho do engano.',
  ],
};

function corDaConsequencia(rng: RngState, r: ResultadoTurno): string {
  if (!r.grau) return '';
  return pick(rng, CORES_POR_GRAU[r.grau] ?? ['']);
}

function ecoDeConsequencia(rng: RngState, r: ResultadoTurno): string | undefined {
  const ecos: string[] = [];
  for (const ef of r.efeitosAplicados) {
    if (ef.tipo === 'pressao' && ef.delta > 0) ecos.push(`Algo em você cede um pouco.`);
    if (ef.tipo === 'dinheiro' && ef.delta > 0) ecos.push(`As moedas pesam no bolso agora.`);
    if (ef.tipo === 'dinheiro' && ef.delta < 0) ecos.push(`O bolso ficou mais leve.`);
    if (ef.tipo === 'relacao' && ef.delta < 0) ecos.push(`Ficou uma frieza no ar.`);
    if (ef.tipo === 'danoJogador') ecos.push(`A dor chega depois, sempre depois.`);
    if (ef.tipo === 'revelarSegredo') ecos.push(`Agora você sabe de algo que não devia.`);
  }
  if (ecos.length === 0) return undefined;
  return pick(rng, ecos);
}

// Uma ação genérica não é uma escolha. Cada aproximação de um gancho tem um
// jeito próprio, um risco próprio e um preço próprio (GDD §4.1).
const APROXIMACOES: { verbo: string; risco: string; dificuldade: number }[] = [
  { verbo: 'Chegar perto e olhar bem', risco: 'quem olha demais costuma ser notado', dificuldade: 11 },
  { verbo: 'Estudar de longe, sem se mostrar', risco: 'seguro, mas você vai ver menos', dificuldade: 14 },
  { verbo: 'Mexer no que não é seu', risco: 'se alguém vir, vira caso', dificuldade: 13 },
  { verbo: 'Perguntar por aí sobre', risco: 'a pergunta anda mais rápido que você', dificuldade: 12 },
];

// Hash estável e barato: varia a cada turno sem tocar no RNG da campanha
// (o cursor da semente é sagrado — mexer nele quebraria o determinismo).
function estavel(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function minuscula(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// Como abordar alguém depende de quanto ela já confia em você e de quanto
// você já sabe. É isso que faz a opção ter peso em vez de virar "conversar".
function abordagem(
  alvo: NPC,
  confianca: number,
  sabeSegredo: boolean,
  turno: number,
): { rotulo: string; dica: string; pericia: string; dificuldade: number; custo: number } {
  if (sabeSegredo) {
    return {
      rotulo: `Deixar ${alvo.nome} entender que você sabe`,
      dica: 'ou ela se abre de vez, ou vira inimiga hoje',
      pericia: 'intimidar',
      dificuldade: 16,
      custo: 1,
    };
  }
  if (confianca >= 12) {
    return {
      rotulo: `Perguntar a ${alvo.nome} o que ela não conta a ninguém`,
      dica: 'a confiança está paga; talvez ela gaste',
      pericia: 'persuadir',
      dificuldade: 13,
      custo: 1,
    };
  }
  if (confianca >= 5) {
    const variantes = [
      { rotulo: `Levar ${alvo.nome} para um canto mais quieto`, dica: 'longe de ouvidos, a conversa muda', pericia: 'persuadir', dificuldade: 13, custo: 1 },
      { rotulo: `Falar de ${alvo.ocupacao} com ${alvo.nome} até ela relaxar`, dica: 'ofício solta a língua', pericia: 'persuadir', dificuldade: 12, custo: 1 },
    ];
    return variantes[(estavel(alvo.id) + turno) % variantes.length];
  }
  const frias = [
    {
      rotulo: `Sondar ${alvo.nome} sem dizer o que você quer`,
      dica: `${alvo.ocupacao}; ainda não confia em você`,
      pericia: 'perceber',
      dificuldade: 12,
      custo: 0,
    },
    {
      rotulo: `Pagar uma rodada a ${alvo.nome} e ver o que vem`,
      dica: 'custa pouco; nem sempre compra alguma coisa',
      pericia: 'persuadir',
      dificuldade: 11,
      custo: 1,
    },
    {
      rotulo: `Observar ${alvo.nome} trabalhar antes de falar`,
      dica: 'quem olha primeiro pergunta melhor depois',
      pericia: 'perceber',
      dificuldade: 13,
      custo: 1,
    },
    {
      rotulo: `Ir direto ao ponto com ${alvo.nome}`,
      dica: 'sem rodeio: ela responde ou fecha a cara',
      pericia: 'intimidar',
      dificuldade: 15,
      custo: 0,
    },
  ];
  return frias[(estavel(alvo.id) + turno) % frias.length];
}

// Opções de cena canônicas por tipo de ponto (GDD §20). Situacionais, escritas à mão.
function opcoesCanonicas(content: ContentBundle, camp: Campaign, ctx: Contexto): OpcaoResolvida[] {
  const out: OpcaoResolvida[] = [];

  // Ganchos do local que AINDA não foram investigados (§0.2: efeito que some
  // não entra no jogo — investigar duas vezes o mesmo edital não é opção).
  ctx.local.ganchos.forEach((g, i) => {
    if (camp.flags[`investigado.${ctx.local.id}.${i}`]) return;
    const forma = APROXIMACOES[(estavel(ctx.local.id + i) + camp.turno) % APROXIMACOES.length];
    out.push({
      id: `gancho_${i}`,
      rotulo: `${forma.verbo}: ${minuscula(g)}`,
      dica: forma.risco,
      custoPeriodos: 0,
      origem: 'cena',
      teste: { atributo: 'percepcao', pericia: 'perceber', dificuldade: forma.dificuldade },
      efeitos: [{ tipo: 'flag', chave: `investigado.${ctx.local.id}.${i}`, valor: true }],
    });
  });

  // Cada pessoa presente é uma porta — não só a primeira. E a porta muda de
  // forma conforme o que já se sabe dela: sondar quem não confia em você não é
  // a mesma coisa que cobrar de quem já se abriu.
  ctx.presentes.slice(0, 3).forEach((alvo) => {
    const din = camp.npcState[alvo.id];
    const confianca = din?.eixos.confianca ?? 0;
    const sabeSegredo = camp.segredosRevelados.includes(alvo.id);
    const forma = abordagem(alvo, confianca, sabeSegredo, camp.turno);
    out.push({
      id: `abordar_${alvo.id}`,
      rotulo: forma.rotulo,
      dica: forma.dica,
      custoPeriodos: forma.custo,
      origem: 'cena',
      teste: { atributo: 'social', pericia: forma.pericia, dificuldade: forma.dificuldade },
      efeitos: [{ tipo: 'relacao', npc: alvo.id, eixo: content.cenario.eixosRelacao[0].id, delta: 3 }],
    });
  });

  // Se já vasculhou tudo aqui, o lugar oferece a saída como opção viva.
  if (out.length === 0) {
    const rota = ctx.local.rotas[0];
    if (rota) {
      out.push({
        id: 'sair_daqui',
        rotulo: 'Procurar o que fazer em outro lugar',
        dica: 'este canto já deu o que tinha',
        custoPeriodos: 0,
        origem: 'cena',
        efeitos: [{ tipo: 'flag', chave: 'quer.sair', valor: true }],
      });
    }
  }

  // Deixar o período correr é sempre uma escolha.
  out.push({
    id: 'deixar_correr',
    rotulo: 'Deixar o tempo correr',
    dica: `espera até ${NOME_PERIODO[proximoPeriodoNome(camp)].toLowerCase()}`,
    custoPeriodos: 1,
    origem: 'cena',
  });

  return out;
}

function proximoPeriodoNome(camp: Campaign) {
  const ordem = ['madrugada', 'manha', 'tarde', 'entardecer', 'anoitecer', 'noite'] as const;
  return ordem[(camp.calendario.periodoIndex + 1) % ordem.length];
}
