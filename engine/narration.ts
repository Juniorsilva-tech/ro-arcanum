// ARCANUM · Montagem da cena.
// Não existe mais narrador local: quem escreve é o modelo, sempre. Aqui só se
// junta o material que ele recebe e as opções que servem de reserva quando ele
// não devolve nenhuma.
import type { Campaign, ContentBundle, NPC } from './types';
import type { OpcaoResolvida } from './turn';
import { calcularContexto, type Contexto } from './availability';
import { NOME_PERIODO } from './time';

// A cena não é texto de tela: é o MATERIAL que o narrador recebe (atmosfera do
// lugar naquele período e quem está presente) mais as opções de reserva. Quem
// escreve prosa é sempre o modelo — este arquivo não narra mais nada.
export function montarCena(content: ContentBundle, camp: Campaign): {
  narracao: string;
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

  // Registro na Guilda de Aventureiros de Tsige: disponível em Tsige enquanto não registrado
  if (
    content.cenario.id === 'tsukimichi' &&
    !camp.personagem.cartaoAventureiro?.registrado &&
    ctx.local.regiao === 'Tsige'
  ) {
    out.push({
      id: 'registrar_guilda_tsige',
      rotulo:
        ctx.local.id === 'tsige_guilda_aventureiros'
          ? 'Tocar na Orbe de Cristal e registrar-se na Guilda'
          : 'Ir à Guilda de Aventureiros · Apresentar-se à Orbe de Medição',
      dica: 'Apresentar sua assinatura de mana para avaliação da orbe e emissão do Cartão de Aventureiro',
      custoPeriodos: 1,
      origem: 'cena',
      efeitos: [{ tipo: 'flag', chave: 'acao.registrar_guilda', valor: true }],
    });
  }

  // Encontros e Pactos de Alma com Bestas Lendárias na Wasteland (Despertar de Asora)
  if (content.cenario.id === 'tsukimichi') {
    // Opções de autonomia e exploração na Borda da Wasteland (pós-queda da estratosfera)
    if (ctx.local.id === 'wasteland_fronteira') {
      out.push({
        id: 'sondar_wasteland_kai',
        rotulo: 'Expandir a percepção do Kai sobre as correntes do ermo',
        dica: 'Estender a membrana de mana para mapear fendas, fluxos mágicos e ninhos distantes da Wasteland',
        custoPeriodos: 0,
        origem: 'cena',
        efeitos: [{ tipo: 'flag', chave: 'acao.sondar_wasteland_kai', valor: true }],
      });

      out.push({
        id: 'cacar_feras_wasteland',
        rotulo: 'Rastrear e confrontar feras selvagens no miasma',
        dica: 'Caçar leviatãs ou bestas atrozes da Wasteland para testar o fio da lâmina e a força bruta',
        custoPeriodos: 1,
        origem: 'cena',
        efeitos: [{ tipo: 'flag', chave: 'acao.cacar_feras_wasteland', valor: true }],
      });

      out.push({
        id: 'meditar_cratera_wasteland',
        rotulo: 'Concentrar a circulação de mana na cratera de impacto',
        dica: 'Acalmar o impacto da queda celestial e condensar o mana violento que borbulha internamente',
        custoPeriodos: 1,
        origem: 'cena',
        efeitos: [{ tipo: 'flag', chave: 'acao.meditar_cratera', valor: true }],
      });
    }

    // Treino de Concentração Total (Quase-Morte Consciente): disponível na Wasteland e em Asora
    if (ctx.local.id.startsWith('wasteland_') || ctx.local.id.startsWith('asora_')) {
      out.push({
        id: 'treino_concentracao_quase_morte',
        rotulo: 'Concentração Total · Atingir o Vácuo da Quase-Morte Consciente',
        dica: 'Cessar respiração e batimentos; experimentar a morte temporária e retornar com mana expandido',
        custoPeriodos: 1,
        origem: 'cena',
        efeitos: [{ tipo: 'flag', chave: 'acao.treino_quase_morte', valor: true }],
      });
    }

    if (ctx.local.id === 'wasteland_desfiladeiro' && !camp.asora?.contratos?.['dragao_shen']) {
      out.push({
        id: 'pacto_shen',
        rotulo: 'Adentrar a névoa perpétua e desafiar o Dragão Superior Shen',
        dica: 'Confrontar a besta colossal em combate de arena, quebrar suas ilusões com seu mana e subjugá-lo para selar o Pacto de Alma (Tomoe)',
        custoPeriodos: 1,
        origem: 'cena',
        efeitos: [{ tipo: 'flag', chave: 'acao.pacto_shen', valor: true }],
      });
    }

    if (ctx.local.id === 'wasteland_pantano_bruma' && !camp.asora?.contratos?.['aranha_calamidade']) {
      out.push({
        id: 'pacto_aranha',
        rotulo: 'Adentrar a teia de escuridão e enfrentar a Aranha da Calamidade',
        dica: 'Combater a monstruosidade voraz, inundar sua fome milenar com mana infinito e subjugá-la para selar o Pacto de Alma (Mio)',
        custoPeriodos: 1,
        origem: 'cena',
        efeitos: [{ tipo: 'flag', chave: 'acao.pacto_aranha', valor: true }],
      });
    }

    if (ctx.local.id === 'wasteland_ninho_fenix' && !camp.asora?.contratos?.['fenix_suzaku']) {
      out.push({
        id: 'pacto_suzaku',
        rotulo: 'Escalar as rochas ardentes e desafiar a Fênix Suzaku',
        dica: 'Enfrentar as chamas celestes em combate e domar a soberana do fogo para selar o Pacto de Alma (Suzaku)',
        custoPeriodos: 1,
        origem: 'cena',
        efeitos: [{ tipo: 'flag', chave: 'acao.pacto_suzaku', valor: true }],
      });
    }

    // Romance, Intimidade & Convivência com as Servas no Subespaço de Asora
    if (ctx.local.id.startsWith('asora_') && camp.asora?.desbloqueado) {
      if (camp.asora.contratos?.['aranha_calamidade']) {
        out.push({
          id: 'romance_mio_termas',
          rotulo: 'Fontes Termais de Asora · Banho Privativo & Banquete com Mio',
          dica: 'Relaxar nas águas termais enquanto Mio o alimenta com dengos devotos e ciúmes possessivos (+15% Afeto, restaura recursos)',
          custoPeriodos: 1,
          origem: 'cena',
          efeitos: [{ tipo: 'flag', chave: 'acao.romance_mio', valor: true }],
        });
      }

      if (camp.asora.contratos?.['dragao_shen']) {
        out.push({
          id: 'romance_tomoe_sake',
          rotulo: 'Sob o Luar de Asora · Degustar Sake Raro & Noite de Bushido com Tomoe',
          dica: 'Desfrutar de uma noite íntima ouvindo clássicos de época e poemas ao lado de uma Tomoe desarmada de afeto (+15% Afeto, restaura recursos)',
          custoPeriodos: 1,
          origem: 'cena',
          efeitos: [{ tipo: 'flag', chave: 'acao.romance_tomoe', valor: true }],
        });
      }

      if (camp.asora.contratos?.['fenix_suzaku']) {
        out.push({
          id: 'romance_suzaku_chamas',
          rotulo: 'Terraços Celestes · Voo sob as Estrelas & Carícias com Suzaku',
          dica: 'Aquecer o corpo sob as asas douradas e a submissão ardente de Suzaku (+15% Afeto, restaura recursos)',
          custoPeriodos: 1,
          origem: 'cena',
          efeitos: [{ tipo: 'flag', chave: 'acao.romance_suzaku', valor: true }],
        });
      }

      if (Object.keys(camp.asora.contratos ?? {}).length > 0) {
        out.push({
          id: 'romance_passeio_vila',
          rotulo: 'Alamedas da Vila Central · Passeio Romântico com o Círculo Central',
          dica: 'Caminhar de mãos dadas pelas ruas de Asora, aproveitando o carinho e mediando o ciúme adorável das servas',
          custoPeriodos: 1,
          origem: 'cena',
          efeitos: [{ tipo: 'flag', chave: 'acao.romance_vila', valor: true }],
        });
      }
    }
  }

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
