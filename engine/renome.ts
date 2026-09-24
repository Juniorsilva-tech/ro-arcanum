// ARCANUM · Renome da colônia e a reação do mundo (sessão 58, etapa F).
//
// O nível ("tier") da colônia contava prédios: quem erguia muita coisa virava
// reino sem que ninguém de fora soubesse que ela existia. Agora ele vem do que
// o mundo vê — renome, gente e governo —, e o renome tem teto: colônia grande
// e desconhecida não passa de vila.
//
// E o mundo reage ao renome. Quando a colônia cruza um marco (15, 40, 80), a
// casa que manda na região manda um enviado: acordo, recusa ou proteção paga.
// Acordo com a casa que reivindica a terra acaba com a cobrança (o quinto do
// trigo de Tessel, a ameaça da casa); recusa deixa a casa hostil, e ela vem
// cobrar mais cedo (engine/ameacas.ts). Fundar e subir de nível viram fato
// público: as cidades e o narrador ficam sabendo.
import type { Campaign, ContentBundle, FeudoState } from './types';
import type { SitioColonia } from '../content/vaelhorn/sitios';
import type { Audiencia } from './audiencias';
import { registrarFato } from './historiaViva';
import { registrarMarco } from './memoria';
import { obterTierReinoInfo } from './reino';

export const MARCOS_DE_RENOME = [15, 40, 80];

/**
 * Nível da colônia pelo que o mundo vê. Gente e governo sobem; o renome põe o
 * teto (2 + 1 a cada 20 de renome).
 */
export function tierDaColonia(f: FeudoState): number {
  const renome = f.renome ?? 0;
  const conselho = Object.keys(f.conselho ?? {}).length;
  const base = 1 + Math.floor(f.populacao / 30) + Math.floor(renome / 30)
    + ((f.edificios.castelo ?? 0) > 0 ? 1 : 0) + (conselho >= 3 ? 1 : 0);
  const teto = 2 + Math.floor(renome / 20);
  return Math.max(1, Math.min(10, base, teto));
}

/** A casa que responde pela região do sítio: a que reivindica, ou a que tem sede na região. */
export function casaDaRegiao(content: ContentBundle, s: SitioColonia): string | undefined {
  if (s.reivindicadaPor) return s.reivindicadaPor;
  const regiaoDe = (id: string) => content.locais.find(l => l.id === id)?.regiao;
  return content.casas?.find(c => regiaoDe(c.sede) === s.regiao)?.id;
}

/** Roda no dia da colônia: nível, enviados. Devolve linhas para o relatório. */
export function processarRenome(content: ContentBundle, camp: Campaign, s: SitioColonia): string[] {
  const f = camp.feudo!;
  const linhas: string[] = [];
  const dia = camp.calendario.dia;

  // Nível: sobe quando o mundo reconhece; cai só quando o renome despenca
  // (dois níveis abaixo), para não oscilar a cada dia ruim.
  const calculado = tierDaColonia(f);
  if (calculado > f.tierReino || calculado <= f.tierReino - 2) {
    const subiu = calculado > f.tierReino;
    f.tierReino = subiu ? calculado : f.tierReino - 1;
    // O título sem o "Tier VIII:" da tela: na prosa, é só o nome.
    const titulo = obterTierReinoInfo(f.tierReino, f.bioma).titulo.replace(/^Tier [IVX]+:\s*/, '');
    const texto = subiu ? `${f.nome} passou a ser conhecida como ${titulo}.` : `${f.nome} perdeu o nome que tinha: agora é ${titulo}.`;
    linhas.push(texto);
    registrarMarco(camp, texto);
    if (camp.vivo) registrarFato(camp, { tipo: subiu ? 'colonia_cresce' : 'colonia_decai', local: s.id, publico: true, atores: ['jogador'], texto });
  }

  // Enviado da casa, a cada marco de renome cruzado.
  const casa = casaDaRegiao(content, s);
  const vistos = (f.marcosRenome ??= []);
  const marco = MARCOS_DE_RENOME.find(m => (f.renome ?? 0) >= m && !vistos.includes(m));
  if (casa && marco !== undefined && !f.audiencia && !(f.acordos ?? []).includes(casa)) {
    vistos.push(marco);
    const nomeCasa = content.casas?.find(c => c.id === casa)?.nome ?? casa;
    const reivindica = s.reivindicadaPor === casa;
    const preco = 30 + marco;
    const seq = (f.seqAudiencias = (f.seqAudiencias ?? 0) + 1);
    const a: Audiencia = {
      id: `audiencia_${seq}`, tipo: 'enviado', dia, ate: dia + 5, envolvidos: [],
      valores: { preco, protecao: preco * 2 },
      origem: casa,
      texto: reivindica
        ? `Um enviado de ${nomeCasa} chegou a cavalo. A casa diz que esta terra é dela e que a colônia cresceu demais para fingir que não sabe disso. Quer acordo.`
        : `Um enviado de ${nomeCasa} veio ver com os próprios olhos o que a estrada anda contando. A casa oferece amizade — por um preço.`,
      opcoes: [
        { id: 'acordo', rotulo: `Selar acordo (${preco} de ouro)`, efeito: reivindica ? 'A casa deixa de cobrar a terra e de ameaçar a colônia; sua reputação com ela sobe.' : 'Amizade com a casa: ela manda reforço se você pedir ajuda numa ameaça; sua reputação com ela sobe.' },
        { id: 'protecao', rotulo: `Pedir proteção (${preco * 2} de ouro)`, efeito: 'Acordo e patrulha da casa: a segurança da colônia sobe 10.' },
        { id: 'recusar', rotulo: 'Recusar', efeito: reivindica ? 'A casa fica hostil e vem cobrar a terra mais cedo; sua reputação com ela cai.' : 'A casa se ofende; sua reputação com ela cai.' },
      ],
    };
    f.audiencia = a;
    f.ultimaAudiencia = dia;
    linhas.push(`Pedem audiência: ${a.texto}`);
  }
  return linhas;
}

/** Fundar vira notícia: o vale e o narrador ficam sabendo. */
export function anunciarFundacao(camp: Campaign, s: SitioColonia): void {
  const f = camp.feudo!;
  if (camp.vivo) registrarFato(camp, {
    tipo: 'colonia_fundada', local: s.id, publico: true, atores: ['jogador'],
    texto: `Gente nova se instalou em ${s.nome} e chama o lugar de ${f.nome}.`,
  });
}
