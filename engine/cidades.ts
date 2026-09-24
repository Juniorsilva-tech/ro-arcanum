import type { Campaign, ContentBundle } from './types';
import type { TipoEdificio } from './vivoTypes';
import { nextFloat, pick } from './rng';
import { registrarFato } from './historiaViva';
import { oferecerMissao } from './missoesVivas';
import { aplicarEdificioRegional, fertilidadeNaSeca, tetoDeRaros, tetoDoEdificio } from './edificiosRegionais';

export const EDIFICIOS: Record<TipoEdificio, { nome: string; materiais: number; dias: number; efeito: string }> = {
  lavoura: { nome: 'Lavoura', materiais: 35, dias: 24, efeito: 'Aumenta a produção diária de alimento.' },
  moradias: { nome: 'Moradias', materiais: 45, dias: 30, efeito: 'Acomoda mais moradores e reduz a superlotação.' },
  enfermaria: { nome: 'Enfermaria', materiais: 40, dias: 28, efeito: 'Combate epidemias e repõe remédios.' },
  muralha: { nome: 'Muralha', materiais: 60, dias: 40, efeito: 'Reduz a insegurança e o dano de ataques.' },
  mercado: { nome: 'Mercado', materiais: 35, dias: 24, efeito: 'Melhora o comércio e o abastecimento.' },
};

/** `content` dá o teto por cidade (capitais e edifício regional); sem ele, 5. */
export function iniciarObra(camp: Campaign, local: string, tipo: TipoEdificio, content?: ContentBundle): boolean {
  const c = camp.vivo?.cidades[local], custo = EDIFICIOS[tipo];
  if (!c || !custo || c.projeto || c.materiais < custo.materiais || c.edificios[tipo] >= tetoDoEdificio(content, local, tipo)) return false;
  c.materiais -= custo.materiais;
  c.projeto = { tipo, progresso: 0, necessario: custo.dias * (1 + c.edificios[tipo] * .3) };
  registrarFato(camp, { tipo: 'obra_iniciada', local, texto: `Começou a construção de ${custo.nome.toLowerCase()}.`, atores: [], publico: true });
  return true;
}

export function processarCidades(content: ContentBundle, camp: Campaign): void {
  const v = camp.vivo!, dia = camp.calendario.dia;
  for (const [id, c] of Object.entries(v.cidades)) {
    const povo = camp.continuidade!.locais[id];
    const nome = content.locais.find(l => l.id === id)?.nome ?? id;
    if (!povo) continue;
    const ameaca = camp.continuidade!.ameacas.some(a => a.local === id && a.estado !== 'resolvida');
    const guerra = camp.mundo?.guerraAtiva?.local === id;
    const condicao = Math.max(.15, povo.integridade / 100);
    const fertilidade = c.secaAte > dia ? fertilidadeNaSeca(content, camp, id) : camp.calendario.estacao === 'inverno' ? .8 : 1.1;
    // Residents also farm for subsistence; public farms improve their surplus.
    // Disease, damaged infrastructure and war reduce actual labour/output.
    const producao = povo.populacao * .20 * (1 + c.edificios.lavoura * .04) * fertilidade * condicao * (1 - c.doenca / 150) * (guerra ? .6 : 1);
    const consumo = povo.populacao * .15;
    c.comida = Math.max(0, Math.min(600, c.comida + producao - consumo - (guerra ? 5 : 0)));
    aplicarEdificioRegional(content, camp, id, c, guerra);
    c.materiais = Math.min(250, c.materiais + (povo.populacao > 0 && !guerra ? condicao : 0));
    c.tesouro = Math.min(800, Math.max(0, c.tesouro + (povo.populacao > 0 ? c.edificios.mercado : 0) - (guerra ? 4 : 0)));
    c.remedios = Math.min(80, c.remedios + (povo.populacao > 0 ? c.edificios.enfermaria * .2 : 0));
    c.inseguranca = Math.max(0, Math.min(100, c.inseguranca + (ameaca ? 1 : guerra ? 2 : -c.edificios.muralha * .5)));
    const tinhaFome = c.fomeDias > 0;
    c.fomeDias = c.comida < consumo ? c.fomeDias + 1 : 0;
    if (c.fomeDias === 3) {
      const causa = v.fatos.find(f => f.id === c.crise);
      const fato = registrarFato(camp, { tipo: 'fome', local: id, texto: `Os estoques de ${nome} acabaram; alimento encareceu e famílias passam fome.`, atores: [], causa: causa && { id: causa.id, texto: causa.texto }, publico: true });
      c.crise = fato.id; oferecerMissao(camp, 'abastecer', fato);
    }
    if (tinhaFome && c.fomeDias === 0) registrarFato(camp, { tipo: 'abastecimento', local: id, texto: `A produção e as entregas voltaram a alimentar ${nome}.`, atores: [], publico: true });
    if (c.fomeDias > 8 && dia % 4 === 0 && povo.populacao > 5) {
      const destino = Object.entries(v.cidades).find(([outra, d]) => outra !== id && d.comida > 100 && camp.continuidade!.locais[outra].populacao < d.edificios.moradias * 60);
      if (destino) {
        povo.populacao -= 2; camp.continuidade!.locais[destino[0]].populacao += 2;
        v.contadores.migrantes = (v.contadores.migrantes ?? 0) + 2;
      }
    }
    if (c.doenca > 0) {
      const tratamento = Math.min(c.remedios, c.edificios.enfermaria);
      c.remedios -= tratamento;
      // Uma epidemia cede sozinha com o tempo, mesmo sem remédio: as pessoas se
      // curam ou morrem. Sem essa parcela o sistema travava — a enfermaria
      // produzia 0,2 de remédio por dia e consumia até 1,0, então o estoque
      // zerava, o tratamento virava zero e a doença ficava em 100 para sempre.
      // A cidade perdia um morador por semana até esvaziar, e cidade vazia não
      // constrói (a obra exige população), então não havia volta. Foi medido:
      // duas comunidades novas morreram assim em dez anos de calendário.
      const remissaoNatural = 0.35;
      c.doenca = Math.max(0, Math.min(100, c.doenca + (c.fomeDias ? 1 : 0) - tratamento * .8 - remissaoNatural));
      if (c.doenca > 60 && dia % 7 === 0) povo.populacao = Math.max(0, povo.populacao - 1);
    }
    // Assentamento esvaziado que ainda tem estrutura de pé volta a ser ocupado:
    // gente de fora chega devagar quando há o que ocupar e o lugar está calmo.
    if (povo.populacao === 0 && povo.integridade >= 40 && !ameaca && !guerra && c.doenca < 40 && dia % 30 === 0) {
      povo.populacao = 4;
      registrarFato(camp, {
        tipo: 'reocupacao', local: id,
        texto: `${nome} voltou a ter moradores: chegaram poucos, e ficaram.`,
        atores: [], publico: true,
      });
    }
    if (c.projeto && !ameaca && !guerra && c.fomeDias === 0 && povo.populacao > 0) {
      c.projeto.progresso += condicao;
      if (c.projeto.progresso >= c.projeto.necessario) {
        const tipo = c.projeto.tipo;
        c.edificios[tipo]++; c.projeto = undefined;
        povo.integridade = Math.min(100, povo.integridade + 8);
        registrarFato(camp, { tipo: 'obra_concluida', local: id, texto: `${EDIFICIOS[tipo].nome} entrou em funcionamento em ${nome}. ${EDIFICIOS[tipo].efeito}`, atores: [], publico: true });
      }
    }
    if (dia % 14 === 0 && !c.projeto && !ameaca && !guerra) {
      const prioridades: TipoEdificio[] = c.fomeDias ? ['lavoura'] : povo.populacao > c.edificios.moradias * 50 ? ['moradias'] : ['lavoura', 'moradias', 'enfermaria', 'muralha', 'mercado'];
      const tipo = prioridades.find(t => c.edificios[t] < tetoDoEdificio(content, id, t));
      if (tipo) iniciarObra(camp, id, tipo, content);
    }
    // Merchants restock only where services and residents still exist.
    if (dia % 7 === 0 && povo.integridade > 20 && povo.populacao > 0 && !guerra) {
      for (const item of Object.keys(c.estoque)) {
        const comum = content.itens.find(i => i.id === item)?.raridade === 'comum';
        c.estoque[item] = Math.min(comum ? 12 : tetoDeRaros(content, camp, id), c.estoque[item] + (comum ? c.edificios.mercado : 1));
      }
    }
  }
}

export function processarDiretor(content: ContentBundle, camp: Campaign): void {
  const v = camp.vivo!, dia = camp.calendario.dia;
  const abertas = v.missoes.filter(q => ['oferecida', 'aceita'].includes(q.estado)).length;
  v.diretor.intensidade = abertas + (camp.mundo?.guerraAtiva ? 3 : 0);
  if (dia < v.diretor.proximoIncidente || v.diretor.intensidade >= 6) return;
  v.diretor.proximoIncidente = dia + 12 + Math.floor(nextFloat(camp.rng) * 12);
  const candidatos = Object.keys(v.cidades).filter(id => dia - v.cidades[id].ultimoIncidente > 45 && camp.continuidade!.locais[id].populacao > 0);
  if (!candidatos.length) return;
  const local = pick(camp.rng, candidatos), c = v.cidades[local];
  c.ultimoIncidente = dia;
  const r = nextFloat(camp.rng);
  if (r < .35) {
    c.secaAte = dia + 24; c.comida = Math.min(c.comida, 45);
    const fato = registrarFato(camp, { tipo: 'seca', local, texto: 'A água baixou. A colheita foi perdida e os celeiros terão de sustentar a comunidade.', atores: [], publico: true });
    c.crise = fato.id;
  } else if (r < .65) {
    c.doenca = Math.min(100, c.doenca + 50);
    const fato = registrarFato(camp, { tipo: 'epidemia', local, texto: 'Novos casos de febre lotaram a enfermaria. Há uma janela para conter a doença.', atores: [], publico: true });
    oferecerMissao(camp, 'tratar', fato);
  } else if (r < .85) {
    camp.continuidade!.locais[local].integridade = Math.max(0, camp.continuidade!.locais[local].integridade - 25);
    const fato = registrarFato(camp, { tipo: 'incendio', local, texto: 'Um incêndio consumiu estruturas e interrompeu parte dos serviços.', atores: [], publico: true });
    oferecerMissao(camp, 'reconstruir', fato);
  } else {
    c.comida = Math.min(600, c.comida + 80); c.tesouro = Math.min(800, c.tesouro + 30);
    registrarFato(camp, { tipo: 'caravana', local, texto: 'Uma caravana entregou alimentos e movimentou o comércio.', atores: [], publico: true });
  }
  void content;
}
