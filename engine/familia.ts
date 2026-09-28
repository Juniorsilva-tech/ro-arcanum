import type { AttrKey, Campaign, ContentBundle, NPC, NpcDinamico } from './types';
import { nextFloat, nextInt, pick } from './rng';
import { concederDespertar, recalcularRecursosMaximos } from './progresso';
import { registrarLembranca } from './memoria';

export type CondicaoParente = 'livre' | 'cativo' | 'desaparecido' | 'morto';
export type ParenteCampanha = {
  id: string;
  nome: string;
  parentesco: 'pai' | 'mae' | 'irmao' | 'irma';
  idadeNoNascimento: number;
  ocupacao: string;
  talento: AttrKey;
  prestigio: number;
  condicao: CondicaoParente;
  prodigio: boolean;
};
export type OpcaoInfancia = { id: string; rotulo: string; descricao: string };
export type EventoInfancia = {
  id: string;
  idade: number;
  titulo: string;
  descricao: string;
  opcoes: OpcaoInfancia[];
};
export type FamiliaState = {
  versao: 1;
  prologoConcluido: boolean;
  idadeJogador: number;
  patrimonio: number;
  prestigio: number;
  membros: ParenteCampanha[];
  eventoAtual?: EventoInfancia;
  historia: { idade: number; texto: string }[];
};

const OFICIOS_COMUNS = ['lavrador', 'criadora de animais', 'ferreiro', 'curandeira', 'mercador itinerante', 'caçadora', 'escriba', 'soldado'];
const OFICIOS_RAROS = ['herói aposentado', 'mestre da espada', 'maga de corte', 'nobre fugitivo', 'rei exilado'];
// Nome no gênero do parentesco: "Mara · irmão" saía porque o sorteio ignorava isso.
const NOMES_IRMAS = ['Iria', 'Mara', 'Sena', 'Lia'];
const NOMES_IRMAOS = ['Cael', 'Oren', 'Tomas', 'Daren'];
const ATRIBUTOS: AttrKey[] = ['fisico', 'precisao', 'resiliencia', 'raciocinio', 'percepcao', 'social'];

function maiorTalento(atributos: Record<AttrKey, number>): AttrKey {
  return [...ATRIBUTOS].sort((a, b) => atributos[b] - atributos[a])[0];
}

function oficio(camp: Campaign, talento: AttrKey): string {
  if (nextFloat(camp.rng) < .08) return pick(camp.rng, OFICIOS_RAROS);
  const porTalento: Partial<Record<AttrKey, string[]>> = {
    fisico: ['lavrador', 'soldado', 'ferreiro'], precisao: ['caçadora', 'artesã'],
    resiliencia: ['mineiro', 'criadora de animais'], raciocinio: ['escriba', 'mago itinerante'],
    percepcao: ['curandeira', 'batedor'], social: ['mercador itinerante', 'administradora'],
  };
  return pick(camp.rng, porTalento[talento] ?? OFICIOS_COMUNS);
}

// Ofício no gênero de quem o exerce. `\b` do JS não reconhece letra acentuada
// ("artesã" nunca casava), por isso a fronteira é por \p{L}.
const OFICIO_M_F: [string, string][] = [
  ['criador de animais', 'criadora de animais'], ['curandeiro', 'curandeira'], ['caçador', 'caçadora'],
  ['artesão', 'artesã'], ['mago de corte', 'maga de corte'], ['administrador', 'administradora'],
  ['ferreiro', 'ferreira'], ['lavrador', 'lavradora'], ['mineiro', 'mineira'], ['mago itinerante', 'maga itinerante'],
  ['batedor', 'batedora'], ['herói aposentado', 'heroína aposentada'], ['mestre da espada', 'mestra da espada'],
  ['nobre fugitivo', 'nobre fugitiva'], ['rei exilado', 'rainha exilada'], ['mercador itinerante', 'mercadora itinerante'],
  ['soldado', 'soldada'],
];

export function flexionarOficio(of: string, genero: 'm' | 'f'): string {
  let r = of;
  for (const [m, f] of OFICIO_M_F) {
    const [de, para] = genero === 'm' ? [f, m] : [m, f];
    r = r.replace(new RegExp(`(?<!\\p{L})${de}(?!\\p{L})`, 'gu'), para);
  }
  return r;
}

function estadoNpc(content: ContentBundle, idade: number): NpcDinamico {
  return { vivo: true, idade, tensao: 0, memoria: [],
    eixos: Object.fromEntries(content.cenario.eixosRelacao.map(e => [e.id, e.id === 'confianca' ? 8 : 0])) };
}

function npcDeParente(p: ParenteCampanha): NPC {
  const localBase = p.condicao === 'cativo' ? 'acampamento' : 'taverna';
  return {
    id: p.id, nome: p.nome, idade: Math.max(0, p.idadeNoNascimento), parentesco: p.parentesco,
    ocupacao: p.ocupacao, faccaoId: 'vila', localBase, rotina: {},
    vozNarrativa: p.parentesco === 'pai' || p.parentesco === 'mae'
      ? 'Fala com a intimidade e a memória de quem acompanhou sua infância.'
      : 'Fala como alguém que dividiu teto, medo e pequenas vitórias com você.',
    personalidade: p.prodigio ? 'Talentoso e consciente das expectativas que a família colocou sobre ele.' : 'Moldado pelos mesmos acontecimentos da família, mas com respostas próprias.',
    corpo: 'Carrega no rosto e nas mãos as marcas do ofício e dos anos vividos pela família.',
    relacoes: [],
  };
}

function nascimento(camp: Campaign, familia: FamiliaState): EventoInfancia {
  const pai = familia.membros.find(m => m.parentesco === 'pai')!;
  const mae = familia.membros.find(m => m.parentesco === 'mae')!;
  return {
    id: 'nascimento', idade: 0, titulo: 'O dia em que você nasceu',
    descricao: `${pai.nome}, ${pai.ocupacao}, e ${mae.nome}, ${mae.ocupacao}, recebem você numa família de prestígio ${familia.prestigio >= 7 ? 'alto' : familia.prestigio >= 3 ? 'modesto' : 'quase nenhum'}.`,
    opcoes: [{ id: 'crescer', rotulo: 'Deixar os primeiros anos passarem', descricao: 'As circunstâncias da família formarão o primeiro acontecimento que você consegue lembrar.' }],
  };
}

function eventoAosSeis(camp: Campaign, familia: FamiliaState): EventoInfancia {
  if (camp.genese?.marca === 'tragedia') return {
    id: 'perda', idade: 6, titulo: 'A casa ficou vazia',
    descricao: camp.genese.motivoTragedia ?? 'Uma tragédia levou seus pais.',
    opcoes: [
      { id: 'guardar_luto', rotulo: 'Guardar o luto em silêncio', descricao: 'Resiliência cresce, mas a confiança nos outros diminui.' },
      { id: 'buscar_responsavel', rotulo: 'Jurar encontrar o responsável', descricao: 'Percepção cresce e a perda vira uma dívida pessoal.' },
      { id: 'proteger_irmaos', rotulo: 'Cuidar de quem restou', descricao: 'Carisma e vínculo familiar crescem; você assume peso cedo.' },
    ],
  };
  if (camp.genese?.marca === 'genio') return {
    id: 'prodigio_revelado', idade: 6, titulo: 'O Despertar do Prodígio',
    descricao: 'Aos seis anos, você já entendia conceitos e técnicas antes que os adultos terminassem de falar. Sua genialidade precoce assombra quem te observa.',
    opcoes: [
      { id: 'estudo_profundo', rotulo: 'Devorar tratados arcanos e pergaminhos', descricao: 'Aumenta raciocínio e percepção; sua mente opera anos à frente dos outros.' },
      { id: 'perfeicao_marcial', rotulo: 'Treinar reflexos corporais e marcialidade', descricao: 'Aumenta físico e precisão; seus movimentos reproduzem técnicas de mestre.' },
      { id: 'ajudar_familia', rotulo: 'Aplicar intelecto nas finanças e na casa', descricao: 'Aumenta social e o patrimônio da família; todos reconhecem seu valor.' },
    ],
  };
  if (camp.genese?.marca === 'indigno') return eventoIndigno(6);
  const tipo = pick(camp.rng, ['peste', 'cobradores', 'fome', 'talento', 'ruinas_descoberta', 'inverno_rigoroso'] as const);
  if (tipo === 'peste') return { id: 'peste', idade: 6, titulo: 'A febre entrou em casa', descricao: 'Um dos seus pais adoeceu e os remédios custam mais do que a família possui.', opcoes: [
    { id: 'buscar_cura', rotulo: 'Procurar a curandeira', descricao: 'Consome patrimônio, com a melhor chance de salvar quem adoeceu.' },
    { id: 'cuidar', rotulo: 'Cuidar com as próprias mãos', descricao: 'Aprende resistência e cura; o risco continua real.' },
    { id: 'pedir_ajuda', rotulo: 'Pedir ajuda à comunidade', descricao: 'A reputação familiar decide quantas portas se abrem.' },
  ] };
  if (tipo === 'cobradores') return eventoCativeiro(6);
  if (tipo === 'fome') return { id: 'fome', idade: 6, titulo: 'O celeiro esvaziou', descricao: 'Uma colheita perdida põe a família entre a fome, o crime e a estrada.', opcoes: [
    { id: 'trabalhar', rotulo: 'Trabalhar junto dos adultos', descricao: 'Fortalece o corpo e preserva parte do patrimônio.' },
    { id: 'furtar', rotulo: 'Roubar comida no mercado', descricao: 'Pode alimentar a casa, mas cria uma dívida com a lei.' },
    { id: 'migrar', rotulo: 'Convencer a família a partir', descricao: 'A família perde o que construiu e evita a fome imediata.' },
  ] };
  if (tipo === 'ruinas_descoberta') return eventoRuinasDescoberta(6);
  if (tipo === 'inverno_rigoroso') return eventoInvernoRigoroso(6);
  return eventoTalento(6);
}

function eventoIndigno(idade: number, familia?: FamiliaState): EventoInfancia {
  const pai = familia?.membros.find(m => m.parentesco === 'pai');
  const irmao = familia?.membros.find(m => m.parentesco === 'irma' || m.parentesco === 'irmao');
  return {
    id: 'indigno_provacao',
    idade,
    titulo: 'O Olhar de Desdém',
    descricao:
      `Ninguém na casa de ${pai ? pai.nome : 'sua família'} esperava grande coisa de você. Os elogios sempre iam para ${irmao ? irmao.nome : 'outros garotos'}, e suas tentativas eram julgadas antes mesmo de você terminar.`,
    opcoes: [
      { id: 'provar_no_trabalho', rotulo: 'Trabalhar em silêncio até calar os mais velhos', descricao: 'Aumenta físico e resiliência, gerando sustento para a casa.' },
      { id: 'astucia_silenciosa', rotulo: 'Observar tudo pelas sombras sem ser notado', descricao: 'Aumenta precisão e percepção; ganha perícia em furtividade.' },
      { id: 'desprezar_opinioes', rotulo: 'Focar na própria força e ignorar o desdém alheio', descricao: 'Aumenta resiliência e forja um espírito indomável.' },
    ],
  };
}

function eventoRuinasDescoberta(idade: number, familia?: FamiliaState): EventoInfancia {
  const irmao = familia?.membros.find(m => m.parentesco === 'irma' || m.parentesco === 'irmao');
  return {
    id: 'ruinas_descoberta',
    idade,
    titulo: 'O Buraco sob a Capela Velha',
    descricao:
      `Brincando com ${irmao ? irmao.nome : 'outras crianças'} entre as lajes desabadas da capela antiga, você encontrou uma abertura estreita que descia para as catacumbas do vilarejo, onde o ar cheirava a poeira e metal esquecido.`,
    opcoes: [
      { id: 'descer_catacumbas', rotulo: 'Descer pela fresta e explorar o passado sob a pedra', descricao: 'Aumenta raciocínio e percepção; resgata uma moeda antiga do império.' },
      { id: 'marcar_segredo', rotulo: 'Guardar o segredo do buraco e voltar para casa', descricao: 'Aumenta percepção e resiliência; mantém o segredo inviolado.' },
      { id: 'avisar_adultos', rotulo: 'Chamar os adultos da vila para inspecionar a abertura', descricao: 'Aumenta social e prestígio com a comunidade do vale.' },
    ],
  };
}

function eventoInvernoRigoroso(idade: number, familia?: FamiliaState): EventoInfancia {
  const mae = familia?.membros.find(m => m.parentesco === 'mae');
  return {
    id: 'inverno_rigoroso',
    idade,
    titulo: 'O Inverno da Geada Vermelha',
    descricao:
      `A nevasca daquele ano cobriu os telhados e trancou as portas da casa de ${mae ? mae.nome : 'sua família'}. O vento uivava como bicho faminto e a lenha acabou antes da primeira lua nova.`,
    opcoes: [
      { id: 'manter_fogueira', rotulo: 'Racionar a madeira e cuidar dos mais fracos dia e noite', descricao: 'Aumenta resiliência e social, conquistando a união da família.' },
      { id: 'buscar_lenha_gelo', rotulo: 'Arrastar troncos secos da floresta sob vento cortante', descricao: 'Aumenta físico ao limite; ganha resistência às intempéries.' },
      { id: 'armadilhas_na_neve', rotulo: 'Montar laços e arapucas para caçar na neve', descricao: 'Aumenta precisão e percepção, garantindo alimento e patrimônio.' },
    ],
  };
}

function eventoIncendioForja(idade: number, familia?: FamiliaState): EventoInfancia {
  const pai = familia?.membros.find(m => m.parentesco === 'pai');
  const forjaPai = pai?.ocupacao.toLowerCase().includes('ferreiro');
  return {
    id: 'incendio_forja',
    idade,
    titulo: forjaPai ? `O Fogo na Oficina de ${pai?.nome}` : 'O Fogo na Rua da Ferraria',
    descricao: forjaPai
      ? `Um estalo na calha de carvão transformou a oficina de seu pai, ${pai?.nome}, num inferno de fumaça preta e labaredas. As faíscas ameaçavam devorar as casas de madeira vizinhas.`
      : 'Um estalo na calha de carvão transformou a oficina do ferreiro num inferno de fumaça preta e labaredas. As faíscas ameaçavam devorar as casas de madeira vizinhas.',
    opcoes: [
      { id: 'salvar_ferreiro', rotulo: forjaPai ? `Arrancar ${pai?.nome} e as ferramentas do fogo` : 'Invadir a oficina em chamas para puxar o mestre ferreiro', descricao: 'Aumenta físico e resiliência, ganha prestígio e a gratidão da forja com uma pedra de amolar.' },
      { id: 'linha_de_baldes', rotulo: 'Comandar a linha de baldes com vizinhos para barrar o fogo', descricao: 'Aumenta raciocínio e social; eleva a perícia persuadir e o prestígio familiar.' },
      { id: 'arrombar_deposito', rotulo: 'Resgatar ferramentas e peças antes do desabamento', descricao: 'Aumenta precisão e salva patrimônio valioso da destruição.' },
    ],
  };
}

function eventoSombraNaMata(idade: number, familia?: FamiliaState): EventoInfancia {
  const irmao = familia?.membros.find(m => m.parentesco === 'irma' || m.parentesco === 'irmao');
  return {
    id: 'sombra_na_mata',
    idade,
    titulo: 'A Coisa Que Não Tinha Sombra',
    descricao:
      `Ao entardecer na orla da Mata dos Sussurros, voltando com ${irmao ? irmao.nome : 'um amigo de infância'}, o ar esfriou de repente. Entre as samambaias, uma criatura esguia de olhos em brasa rasgava uma corça sem fazer som algum.`,
    opcoes: [
      { id: 'sustentar_respiracao', rotulo: 'Controlar o pânico, prender o fôlego e recuar passo a passo', descricao: 'Aumenta percepção e precisão; aprende a técnica de Passo Leve para não ser ouvido.' },
      { id: 'proteger_amigo', rotulo: 'Ficar entre a criatura e seu companheiro empunhando uma estaca', descricao: 'Aumenta físico e resiliência; ganha a alcunha "Olhar Férreo" e lealdade do companheiro.' },
      { id: 'estudar_padroes', rotulo: 'Gravar os movimentos inumanos e pontos cegos da fera', descricao: 'Aumenta raciocínio e percepção; ganha perícia em perceber e notas do bestiário.' },
    ],
  };
}

function eventoInquisicaoSelo(idade: number, familia?: FamiliaState): EventoInfancia {
  const pai = familia?.membros.find(m => m.parentesco === 'pai');
  return {
    id: 'inquisicao_selo',
    idade,
    titulo: 'A Comitiva da Ordem do Santo Selo',
    descricao:
      `Cavaleiros de armadura prateada e inquisidores da Ordem entraram na vila exigindo o dízimo da casa de ${pai ? pai.nome : 'sua família'} e interrogando moradores sobre feitiçaria e manuscritos proibidos. O olhar do inquisidor pousou em você.`,
    opcoes: [
      { id: 'responder_com_firmeza', rotulo: 'Recitar as preces e manter respeito impecável diante dos clérigos', descricao: 'Aumenta social e raciocínio; livra a família de suspeitas e eleva prestígio.' },
      { id: 'ocultar_reliquias', rotulo: 'Esconder no forro da casa relíquias e manuscritos antes da revista', descricao: 'Aumenta precisão e percepção; ganha perícia em furtividade.' },
      { id: 'desafiar_inquisidor', rotulo: 'Sustentar o olhar frio sem abaixar a cabeça nem tremer', descricao: 'Aumenta resiliência e físico; ganha a alcunha "Indomável" e respeito dos foragidos.' },
    ],
  };
}

function eventoTorneioJuventude(idade: number, familia?: FamiliaState): EventoInfancia {
  const pai = familia?.membros.find(m => m.parentesco === 'pai');
  return {
    id: 'torneio_juventude',
    idade,
    titulo: 'A Disputa do Meio-Verão',
    descricao:
      `A festa da colheita reuniu os povoados do vale numa arena de terra batida. Entre a torcida da família de ${pai ? pai.nome : 'sua casa'}, disputas tradicionais de força, pontaria e cantoria de lendas desafiavam os jovens.`,
    opcoes: [
      { id: 'vencer_na_arena', rotulo: 'Derrubar os rivais no círculo de terra batida', descricao: 'Aumenta físico e precisão; ganha luvas de couro e prestígio na vila.' },
      { id: 'prova_de_arquearia', rotulo: 'Acertar o centro do alvo com arco de junco', descricao: 'Aumenta precisão e percepção; ganha perícia perceber e fama de arqueiro.' },
      { id: 'cantar_as_cronicas', rotulo: 'Recitar as antigas lendas do vale ao redor da fogueira', descricao: 'Aumenta social e raciocínio; eleva a perícia persuadir e o prestígio familiar.' },
    ],
  };
}

function eventoEmboscadaEstrada(idade: number, familia?: FamiliaState): EventoInfancia {
  const pai = familia?.membros.find(m => m.parentesco === 'pai');
  return {
    id: 'emboscada_estrada',
    idade,
    titulo: 'O Batismo de Sangue na Estrada do Sal',
    descricao:
      `Aos 14 anos, na primeira viagem como condutor da carroça de carga de ${pai ? pai.nome : 'sua família'} pela Estrada do Sal, salteadores armados saltaram das ravinas de armas em punho exigindo o sangue e o ouro.`,
    opcoes: [
      { id: 'lutar_com_furia', rotulo: 'Puxar a lâmina curta e liderar a defesa da carga a sangue', descricao: 'Aumenta físico e precisão, ganha perícia atletismo, a alcunha "Batizado em Sangue" e uma espada curta.' },
      { id: 'manobrar_fuga', rotulo: 'Arrancar a carroça pela ravina perigosa salvando carga e vidas', descricao: 'Aumenta precisão e raciocínio; ganha perícia perceber e salva patrimônio valioso.' },
      { id: 'emboscar_salteadores', rotulo: 'Cercar os bandidos na curva estreita e forçá-los a fugir', descricao: 'Aumenta raciocínio e percepção; ganha perícia furtividade e saqueia moedas.' },
    ],
  };
}

function eventoRitoDaVigia(idade: number, _familia?: FamiliaState): EventoInfancia {
  return {
    id: 'rito_da_vigia',
    idade,
    titulo: 'A Vigília Solitária na Torre da Fronteira',
    descricao:
      'A tradição do vale exige que todo jovem que atinge os quatorze anos passe uma noite inteira sozinho no parapeito alto da Torre de Vigia, vigiando a linha de névoa onde o vale termina.',
    opcoes: [
      { id: 'olhos_na_escuridao', rotulo: 'Vigiar o nevoeiro na torre alta a noite inteira sob chuva', descricao: 'Aumenta percepção e resiliência; ganha perícia perceber e aprende a arte Ler Aura.' },
      { id: 'disciplina_de_ferro', rotulo: 'Praticar posturas e equilíbrio marcial na balaustrada de pedra', descricao: 'Aumenta físico e precisão; aprende a técnica Segundo Fôlego.' },
      { id: 'mapear_o_vale', rotulo: 'Registrar as trilhas secretas, fogueiras e rotas do vale', descricao: 'Aumenta raciocínio e social; ganha um mapa do vale e perícia decifrar.' },
    ],
  };
}

function eventoEncruzilhadaOficio(idade: number, familia?: FamiliaState): EventoInfancia {
  const mae = familia?.membros.find(m => m.parentesco === 'mae');
  return {
    id: 'encruzilhada_oficio',
    idade,
    titulo: 'A Oferta na Encruzilhada',
    descricao:
      `Antes de completar catorze anos, enquanto ${mae ? mae.nome : 'sua família'} arrumava as provisões de inverno, uma figura misteriosa te abordou em segredo na taverna oferecendo um rumo sem volta.`,
    opcoes: [
      { id: 'seguir_batedores', rotulo: 'Aprender as rotas contrabandistas e trilhas não mapeadas', descricao: 'Aumenta precisão e raciocínio; ganha perícia furtividade e desvenda trilhas secretas.' },
      { id: 'aprender_cura_e_ervas', rotulo: 'Dedicar-se aos saberes de torniquetes, ervas e poções', descricao: 'Aumenta raciocínio e resiliência; ganha perícia ofício e poções de cura.' },
      { id: 'firmar_raizes_na_casa', rotulo: 'Permanecer como pilar de sustento e honra da própria família', descricao: 'Aumenta resiliência e social; eleva o prestígio familiar e lealdade da casa.' },
    ],
  };
}

function eventoPartida(idade: number): EventoInfancia {
  return {
    id: 'partida',
    idade,
    titulo: 'A vida adulta se aproxima',
    descricao: 'O mundo oferece um caminho, enquanto sua família ainda cobra presença.',
    opcoes: [
      { id: 'aprendizado', rotulo: 'Partir para aprender um ofício', descricao: 'Ganha técnica e deixa a família conduzir a própria vida.' },
      { id: 'defender', rotulo: 'Ficar para defender a casa', descricao: 'Fortalece corpo e vínculos; inimigos passam a conhecer seu nome.' },
      { id: 'fugir', rotulo: 'Ir embora sem promessa de volta', descricao: 'Ganha liberdade, perde confiança e começa com recursos próprios.' },
    ],
  };
}

function eventoCativeiro(idade: number): EventoInfancia {
  return { id: 'cativeiro', idade, titulo: 'Homens vieram cobrar em gente', descricao: 'A dívida virou uma tentativa de levar sua família como servos cativos.', opcoes: [
    { id: 'resistir', rotulo: 'Resistir ao lado da família', descricao: 'Arrisca ferimentos e morte, mas pode impedir o sequestro.' },
    { id: 'esconder', rotulo: 'Esconder os mais novos', descricao: 'Protege irmãos, mas um adulto pode ser levado.' },
    { id: 'negociar', rotulo: 'Entregar o patrimônio', descricao: 'Compra liberdade agora e deixa a família sem recursos.' },
  ] };
}

function eventoTalento(idade: number): EventoInfancia {
  return { id: 'talento', idade, titulo: 'Algo despertou cedo', descricao: 'Um mestre percebe talento incomum em você e em alguém da família.', opcoes: [
    { id: 'treinar', rotulo: 'Aceitar o treinamento do mestre', descricao: 'Dedica-se à disciplina de um discípulo formal: eleva seus atributos, aprende uma Arte de Mestre, ganha perícia e herda um item de treino.' },
    { id: 'dividir', rotulo: 'Dividir a oportunidade com seu irmão', descricao: 'Fortalece o vínculo e pode fazer dele um prodígio.' },
    { id: 'recusar', rotulo: 'Permanecer com a família', descricao: 'Preserva a união e deixa a oportunidade passar.' },
  ] };
}

function eventoAosSeisTsukimichi(_camp: Campaign, _familia: FamiliaState): EventoInfancia {
  return {
    id: 'tsukimichi_mana_oculto',
    idade: 6,
    titulo: 'O Transbordar do Mana Interior',
    descricao:
      'Seu corpo acumula uma reserva colossal de mana que a atmosfera da Terra não consegue dispersar. Lâmpadas piscavam quando suas emoções oscilavam e o ar ao seu redor ondulava em calor invisível.',
    opcoes: [
      {
        id: 'conter_mana',
        rotulo: 'Treinar a contenção e o controle fino de energia',
        descricao: 'Aumenta resiliência e foco mental para não queimar o ambiente.',
      },
      {
        id: 'fortalecer_fisico',
        rotulo: 'Fortalecer a musculatura e a respiração',
        descricao: 'Aumenta físico e resiliência corporal para suportar a carga de mana que transborda.',
      },
    ],
  };
}

function eventoAosDezTsukimichi(_camp: Campaign, _familia: FamiliaState): EventoInfancia {
  return {
    id: 'tsukimichi_invocacao_deusa',
    idade: 10,
    titulo: 'A Invocação e a Rejeição da Deusa',
    descricao:
      'Um pilar de luz sagrado te arrancou da Terra para cumprir o pacto antigo de seus pais! Mas ao ver seu rosto diante do trono celestial, a Deusa torceu o nariz: "Que criatura feiosa e repugnante! Meu mundo é apenas para pessoas bonitas!". Ela te negou qualquer bênção celestial, roubou sua capacidade de falar com hyumans e te baniu em queda livre da estratosfera para a Wasteland!',
    opcoes: [
      {
        id: 'encarar_deusa',
        rotulo: 'Sustentar o olhar da Deusa com frieza inabalável',
        descricao: 'Desperta a Presença Soberana e eleva sua autoridade mental.',
      },
      {
        id: 'preparar_impacto',
        rotulo: 'Comprimir todo o mana corporal para absorver o impacto da queda',
        descricao: 'Eleva resiliência e precisão corporal ao extremo durante a descida colossal.',
      },
    ],
  };
}

function eventoAosQuatorzeTsukimichi(_camp: Campaign, _familia: FamiliaState): EventoInfancia {
  return {
    id: 'tsukimichi_queda_wasteland',
    idade: 14,
    titulo: 'A Cratera da Wasteland e o Despertar no Ermo',
    descricao:
      'O impacto da queda abriu uma cratera colossal na Grande Terra Desolada (Wasteland). Ao abrir os olhos com as memórias do banimento da Deusa gravadas na alma, você se ergue no miasma da terra calcinada. Ao redor, ossadas de leviatãs e bestas vorazes espreitam no nevoeiro vermelho. O jogo de sobrevivência, pactos de alma e soberania começa aqui — a civilização de Tsige jaz além do horizonte e você só entrará lá se escolher cruzar o Portão do Ermo.',
    opcoes: [
      {
        id: 'erguer_wasteland',
        rotulo: 'Erguer-se na cratera da Wasteland e dominar o ermo aos 18 anos',
        descricao: 'Inicia sua jornada autônoma diretamente na Borda Desolada da Wasteland, onde bestas ancestrais aguardam um pacto de alma.',
      },
      {
        id: 'marchar_tsige',
        rotulo: 'Sobreviver ao ermo e firmar seus passos na Borda da Wasteland',
        descricao: 'Conclui a transição para a vida adulta na cratera da Wasteland, onde sua lenda começa.',
      },
    ],
  };
}

function eventoAosDez(camp: Campaign, _familia: FamiliaState): EventoInfancia {
  if (camp.genese?.marca === 'genio') return eventoTalento(10);
  const tipo = pick(camp.rng, [
    'talento',
    'cativeiro',
    'incendio_forja',
    'sombra_na_mata',
    'inquisicao_selo',
    'torneio_juventude',
  ] as const);
  if (tipo === 'cativeiro') return eventoCativeiro(10);
  if (tipo === 'incendio_forja') return eventoIncendioForja(10);
  if (tipo === 'sombra_na_mata') return eventoSombraNaMata(10);
  if (tipo === 'inquisicao_selo') return eventoInquisicaoSelo(10);
  if (tipo === 'torneio_juventude') return eventoTorneioJuventude(10);
  return eventoTalento(10);
}

function eventoAosQuatorze(camp: Campaign, _familia: FamiliaState): EventoInfancia {
  const tipo = pick(camp.rng, [
    'partida',
    'emboscada_estrada',
    'rito_da_vigia',
    'encruzilhada_oficio',
  ] as const);
  if (tipo === 'emboscada_estrada') return eventoEmboscadaEstrada(14);
  if (tipo === 'rito_da_vigia') return eventoRitoDaVigia(14);
  if (tipo === 'encruzilhada_oficio') return eventoEncruzilhadaOficio(14);
  return eventoPartida(14);
}

function proximoEvento(camp: Campaign, familia: FamiliaState, idade: number): EventoInfancia {
  if (camp.cenarioId === 'tsukimichi') {
    if (idade === 6) return eventoAosSeisTsukimichi(camp, familia);
    if (idade === 10) return eventoAosDezTsukimichi(camp, familia);
    return eventoAosQuatorzeTsukimichi(camp, familia);
  }
  if (idade === 6) return eventoAosSeis(camp, familia);
  if (idade === 10) return eventoAosDez(camp, familia);
  return eventoAosQuatorze(camp, familia);
}

function iniciarFamiliaTsukimichi(content: ContentBundle, camp: Campaign): void {
  const membros: ParenteCampanha[] = [
    {
      id: 'tsukimichi_pai',
      nome: 'Kazuhiko',
      parentesco: 'pai',
      idadeNoNascimento: 26,
      ocupacao: 'mestre de kyudo e exilado do outro mundo',
      talento: 'precisao',
      prestigio: 8,
      condicao: 'livre',
      prodigio: true,
    },
    {
      id: 'tsukimichi_mae',
      nome: 'Yuko',
      parentesco: 'mae',
      idadeNoNascimento: 24,
      ocupacao: 'antiga nobre hyuman exilada na Terra',
      talento: 'raciocinio',
      prestigio: 7,
      condicao: 'livre',
      prodigio: false,
    },
    {
      id: 'tsukimichi_irma_1',
      nome: 'Arisa',
      parentesco: 'irma',
      idadeNoNascimento: 2,
      ocupacao: 'estudante universitária no Japão',
      talento: 'social',
      prestigio: 4,
      condicao: 'livre',
      prodigio: false,
    },
    {
      id: 'tsukimichi_irma_2',
      nome: 'Mari',
      parentesco: 'irma',
      idadeNoNascimento: -2,
      ocupacao: 'estudante colegial no Japão',
      talento: 'precisao',
      prestigio: 3,
      condicao: 'livre',
      prodigio: false,
    },
  ];

  const familia: FamiliaState = {
    versao: 1,
    prologoConcluido: false,
    idadeJogador: 0,
    patrimonio: 35,
    prestigio: 8,
    membros,
    historia: [],
  };

  familia.eventoAtual = {
    id: 'origem_japao',
    idade: 0,
    titulo: 'A Linhagem Oculta no Japão Moderno',
    descricao:
      'Você nasceu e cresceu no Japão contemporâneo como filho de Kazuhiko e Yuko. Uma infância com suas irmãs, cercada por um mistério que seus pais nunca revelaram: ambos eram nativos de um mundo mágico governado por uma Deusa e fugiram para a Terra através de um pacto secreto.',
    opcoes: [
      {
        id: 'crescer_kyudo',
        rotulo: 'Dedicar a juventude ao clube de Kyudo e tiro com arco tradicional',
        descricao: 'Treina precisão extrema, postura e calma absoluta da mente.',
      },
      {
        id: 'estudar_segredo',
        rotulo: 'Investigar os manuscritos e anotações arcanas esquecidas no sótão',
        descricao: 'Aumenta raciocínio e percepção dos mistérios mágicos da família.',
      },
    ],
  };

  camp.familia = familia;
  camp.personagem.idade = 0;
  camp.npcsProcedurais = membros.map(npcDeParente);
  for (const m of membros) camp.npcState[m.id] = estadoNpc(content, m.idadeNoNascimento);
}

export function iniciarFamilia(content: ContentBundle, camp: Campaign): void {
  if (camp.familia) return;
  if (content.cenario.id === 'tsukimichi') {
    iniciarFamiliaTsukimichi(content, camp);
    return;
  }
  const g = camp.genese!;
  const paiTalento = maiorTalento(g.paiAtributos);
  const maeTalento = maiorTalento(g.maeAtributos);
  const membros: ParenteCampanha[] = [
    { id: 'familia_pai', nome: g.paiNome, parentesco: 'pai', idadeNoNascimento: nextInt(camp.rng, 19, 41), ocupacao: flexionarOficio(oficio(camp, paiTalento), 'm'), talento: paiTalento, prestigio: nextInt(camp.rng, 0, 8), condicao: 'livre', prodigio: nextFloat(camp.rng) < .08 },
    { id: 'familia_mae', nome: g.maeNome, parentesco: 'mae', idadeNoNascimento: nextInt(camp.rng, 18, 39), ocupacao: flexionarOficio(oficio(camp, maeTalento), 'f'), talento: maeTalento, prestigio: nextInt(camp.rng, 0, 8), condicao: 'livre', prodigio: nextFloat(camp.rng) < .08 },
  ];
  for (let i = 0; i < g.irmaos; i++) {
    const irma = nextFloat(camp.rng) < .5;
    membros.push({ id: `familia_irmao_${i + 1}`, nome: pick(camp.rng, irma ? NOMES_IRMAS : NOMES_IRMAOS), parentesco: irma ? 'irma' : 'irmao',
      idadeNoNascimento: nextInt(camp.rng, -4, 5), ocupacao: 'criança da família', talento: pick(camp.rng, ATRIBUTOS),
      prestigio: 0, condicao: 'livre', prodigio: nextFloat(camp.rng) < .12 });
  }
  const familia: FamiliaState = { versao: 1, prologoConcluido: false, idadeJogador: 0,
    patrimonio: camp.personagem.dinheiro + nextInt(camp.rng, 0, 40), prestigio: Math.round((membros[0].prestigio + membros[1].prestigio) / 2), membros, historia: [] };
  familia.eventoAtual = nascimento(camp, familia);
  camp.familia = familia;
  camp.personagem.idade = 0;
  if (g.marca === 'genio') camp.flags['infancia_genio'] = true;
  camp.npcsProcedurais = membros.map(npcDeParente);
  for (const m of membros) camp.npcState[m.id] = estadoNpc(content, m.idadeNoNascimento);
}

function alterarAtributo(camp: Campaign, atributo: AttrKey, delta = 1): void {
  camp.personagem.atributos[atributo] += delta;
}
function membroVivo(f: FamiliaState, papel?: ParenteCampanha['parentesco']): ParenteCampanha | undefined {
  return f.membros.find(m => m.condicao !== 'morto' && (!papel || m.parentesco === papel));
}
function matar(camp: Campaign, p: ParenteCampanha): void {
  p.condicao = 'morto';
  if (camp.npcState[p.id]) camp.npcState[p.id].vivo = false;
}
function capturar(camp: Campaign, p: ParenteCampanha): void {
  p.condicao = 'cativo';
  const npc = camp.npcsProcedurais?.find(n => n.id === p.id);
  if (npc) npc.localBase = 'acampamento';
}

export function resolverEtapaInfancia(content: ContentBundle, camp: Campaign, opcaoId: string): { ok: boolean; texto?: string; concluida?: boolean } {
  const f = camp.familia;
  const evento = f?.eventoAtual;
  if (!f || !evento || f.prologoConcluido) return { ok: false };
  if (!evento.opcoes.some(o => o.id === opcaoId)) return { ok: false };
  let texto = evento.opcoes.find(o => o.id === opcaoId)!.rotulo + '.';
  const alvo = membroVivo(f, nextFloat(camp.rng) < .5 ? 'pai' : 'mae') ?? membroVivo(f);
  if (evento.id === 'perda') {
    for (const p of f.membros.filter(m => m.parentesco === 'pai' || m.parentesco === 'mae')) matar(camp, p);
    if (opcaoId === 'guardar_luto') alterarAtributo(camp, 'resiliencia', 2);
    if (opcaoId === 'buscar_responsavel') { alterarAtributo(camp, 'percepcao', 2); camp.flags['jurou_vingar_familia'] = true; }
    if (opcaoId === 'proteger_irmaos') {
      alterarAtributo(camp, 'social', 2);
      for (const m of f.membros.filter(m => (m.parentesco === 'irma' || m.parentesco === 'irmao') && m.condicao !== 'morto')) {
        registrarLembranca(camp, m.id, {
          tipo: 'ajuda',
          resumo: 'você assumiu o peso da família e jurou proteger os irmãos após a morte dos pais',
          peso: 5,
        });
        camp.npcState[m.id].eixos.confianca = Math.min(20, (camp.npcState[m.id].eixos.confianca ?? 0) + 12);
      }
    }
    texto += ' Seus pais morreram; a forma como você respondeu ficou em você.';
  } else if (evento.id === 'prodigio_revelado') {
    camp.flags['infancia_genio'] = true;
    if (opcaoId === 'estudo_profundo') {
      alterarAtributo(camp, 'raciocinio', 2);
      alterarAtributo(camp, 'percepcao', 1);
      f.prestigio += 2;
    } else if (opcaoId === 'perfeicao_marcial') {
      alterarAtributo(camp, 'fisico', 2);
      alterarAtributo(camp, 'precisao', 1);
      f.prestigio += 2;
    } else {
      alterarAtributo(camp, 'social', 2);
      f.patrimonio += 20;
      f.prestigio += 1;
    }
    texto += ' Sua mente extraordinária e precoce impressionou a todos.';
  } else if (evento.id === 'peste' && alvo) {
    const chance = opcaoId === 'buscar_cura' ? .88 : opcaoId === 'pedir_ajuda' ? .45 + f.prestigio * .04 : .55;
    if (opcaoId === 'buscar_cura') f.patrimonio = Math.max(0, f.patrimonio - 25);
    if (opcaoId === 'cuidar') alterarAtributo(camp, 'raciocinio');
    if (nextFloat(camp.rng) > chance) { matar(camp, alvo); texto += ` ${alvo.nome} não resistiu à febre.`; }
    else texto += ` ${alvo.nome} sobreviveu.`;
  } else if (evento.id === 'cativeiro') {
    if (opcaoId === 'negociar' && f.patrimonio >= 20) { f.patrimonio = 0; texto += ' A casa foi esvaziada, mas ninguém foi levado.'; }
    else if (opcaoId === 'resistir') {
      alterarAtributo(camp, 'fisico');
      if (nextFloat(camp.rng) < .45 && alvo) { matar(camp, alvo); texto += ` A resistência custou a vida de ${alvo.nome}.`; }
      else { camp.personagem.cicatrizes.push('ferida recebida ao resistir aos captores'); texto += ' Os captores recuaram, e você guardou a cicatriz.'; }
    } else if (alvo) { capturar(camp, alvo); texto += ` ${alvo.nome} foi levado para o acampamento dos captores.`; }
  } else if (evento.id === 'fome') {
    if (opcaoId === 'trabalhar') { alterarAtributo(camp, 'resiliencia'); f.patrimonio += 8; }
    if (opcaoId === 'furtar') { camp.flags['procurado.por_furto'] = true; f.patrimonio += 15; alterarAtributo(camp, 'precisao'); }
    if (opcaoId === 'migrar') { f.patrimonio = Math.floor(f.patrimonio / 2); camp.flags['familia_migrou'] = true; }
  } else if (evento.id === 'talento') {
    if (opcaoId === 'treinar') {
      const talento = maiorTalento(camp.personagem.atributos);
      alterarAtributo(camp, talento, 2);
      alterarAtributo(camp, talento === 'resiliencia' ? 'fisico' : 'resiliencia', 1);
      f.prestigio += 3;

      // Perícia de disciplina marcial ou intelectual
      const periciasPorTalento: Record<AttrKey, string> = {
        fisico: 'atletismo',
        precisao: 'perceber',
        resiliencia: 'atletismo',
        raciocinio: 'arcana',
        percepcao: 'rastrear',
        social: 'intimidar',
      };
      const per = periciasPorTalento[talento];
      camp.personagem.pericias[per] = (camp.personagem.pericias[per] ?? 0) + 1;

      // Arte de Mestre ensinada diretamente ao discípulo
      const artesPorTalento: Record<AttrKey, string[]> = {
        fisico: ['guarda_perfeita', 'golpe_atordoante'],
        precisao: ['tiro_certeiro', 'flecha_dupla', 'passo_leve'],
        resiliencia: ['segundo_folego', 'ancora_de_ferro'],
        raciocinio: ['escudo_arcano', 'lanca_arcana', 'ler_aura'],
        percepcao: ['ler_aura', 'olho_torto'],
        social: ['coragem', 'palavra_de_calma'],
      };
      const opcoesArtes = artesPorTalento[talento] ?? ['guarda_perfeita'];
      const arteId = opcoesArtes.find(a => !camp.personagem.artesConhecidas.includes(a)) ?? opcoesArtes[0];
      if (!camp.personagem.artesConhecidas.includes(arteId)) {
        camp.personagem.artesConhecidas.push(arteId);
      }
      const arteDef = content.artes.find(a => a.id === arteId);
      const nomeArte = arteDef?.nome ?? 'Técnica Secreta';

      // Item / Herança de treino do mestre
      const itensPorTalento: Record<AttrKey, string> = {
        fisico: 'pedra_de_amolar',
        precisao: 'luvas_de_couro',
        resiliencia: 'pocao_cura_menor',
        raciocinio: 'tonico_de_mana',
        percepcao: 'tocha',
        social: 'moeda_antiga',
      };
      const itemMestre = itensPorTalento[talento];
      if (itemMestre) {
        camp.personagem.inventario[itemMestre] = (camp.personagem.inventario[itemMestre] ?? 0) + 1;
      }

      // Reconhecimento, Alcunha e Flags
      camp.flags['discipulo_de_mestre'] = true;
      camp.flags['mestre_infancia_talento'] = talento;
      camp.flags['arte_mestre_infancia'] = arteId;
      if (!camp.personagem.alcunhas.includes('Discípulo Dedicado')) {
        camp.personagem.alcunhas.push('Discípulo Dedicado');
      }

      // Memória de orgulho na família pelo discípulo
      for (const m of f.membros.filter(m => m.condicao !== 'morto')) {
        registrarLembranca(camp, m.id, {
          tipo: 'marco',
          resumo: 'você foi aceito como discípulo formal de um mestre aos 10 anos, enchendo a família de orgulho e respeito',
          peso: 4,
        });
        camp.npcState[m.id].eixos.confianca = Math.min(20, (camp.npcState[m.id].eixos.confianca ?? 0) + 6);
      }

      texto += ` Sob a tutela do mestre, você foi moldado com disciplina férrea: aprendeu a arte "${nomeArte}", aprimorou seus reflexos, herdou recursos de treino e ganhou o renome de um discípulo formal.`;
    }
    if (opcaoId === 'dividir') {
      const irmao = f.membros.find(m => m.parentesco === 'irma' || m.parentesco === 'irmao');
      if (irmao) {
        irmao.prodigio = true;
        irmao.prestigio += 3;
        camp.npcState[irmao.id].eixos.confianca = 15;
        registrarLembranca(camp, irmao.id, {
          tipo: 'ajuda',
          resumo: 'você abriu mão da tutela de um mestre de renome para que ele pudesse treinar e florescer como prodígio',
          peso: 5,
        });
        for (const p of f.membros.filter(m => (m.parentesco === 'pai' || m.parentesco === 'mae') && m.condicao !== 'morto')) {
          registrarLembranca(camp, p.id, {
            tipo: 'ajuda',
            resumo: 'você abriu mão da própria glória pelo irmão mais novo, provando honra e lealdade de sangue',
            peso: 4,
          });
          camp.npcState[p.id].eixos.confianca = Math.min(20, (camp.npcState[p.id].eixos.confianca ?? 0) + 8);
        }
        texto += ` ${irmao.nome} floresceu como prodígio.`;
      } else {
        alterarAtributo(camp, 'social');
      }
    }
    if (opcaoId === 'recusar') {
      for (const m of f.membros.filter(m => m.condicao !== 'morto')) {
        camp.npcState[m.id].eixos.confianca = 12;
        registrarLembranca(camp, m.id, {
          tipo: 'ajuda',
          resumo: 'você recusou partir com o mestre para continuar ao lado da família no sustento do lar',
          peso: 4,
        });
      }
    }
  } else if (evento.id === 'partida') {
    if (opcaoId === 'aprendizado') { camp.personagem.pericias.oficio = 1; alterarAtributo(camp, 'raciocinio'); }
    if (opcaoId === 'defender') {
      alterarAtributo(camp, 'fisico');
      alterarAtributo(camp, 'resiliencia');
      camp.flags['defendeu_familia'] = true;
      for (const m of f.membros.filter(m => m.condicao !== 'morto')) {
        registrarLembranca(camp, m.id, {
          tipo: 'ajuda',
          resumo: 'você colocou o corpo à frente da família quando o perigo bateu à porta aos 14 anos',
          peso: 5,
        });
        camp.npcState[m.id].eixos.confianca = Math.min(20, (camp.npcState[m.id].eixos.confianca ?? 0) + 10);
      }
    }
    if (opcaoId === 'fugir') { f.patrimonio = Math.max(0, f.patrimonio - 10); camp.personagem.dinheiro += 20; for (const m of f.membros) camp.npcState[m.id].eixos.confianca -= 8; }
  } else if (evento.id === 'indigno_provacao') {
    if (opcaoId === 'provar_no_trabalho') {
      alterarAtributo(camp, 'fisico', 1);
      alterarAtributo(camp, 'resiliencia', 1);
      f.patrimonio += 5;
      texto += ' O suor e a disciplina calaram os que zombavam de você.';
    } else if (opcaoId === 'astucia_silenciosa') {
      alterarAtributo(camp, 'precisao', 1);
      alterarAtributo(camp, 'percepcao', 1);
      camp.personagem.pericias.furtividade = (camp.personagem.pericias.furtividade ?? 0) + 1;
      texto += ' Você aprendeu a se mover sem ser notado e a ler os passos dos outros.';
    } else {
      alterarAtributo(camp, 'resiliencia', 2);
      camp.flags['indomavel_infancia'] = true;
      if (!camp.personagem.alcunhas.includes('Obstinado')) camp.personagem.alcunhas.push('Obstinado');
      texto += ' O desdém alheio apenas forjou uma têmpera de ferro em sua determinação.';
    }
  } else if (evento.id === 'ruinas_descoberta') {
    if (opcaoId === 'descer_catacumbas') {
      alterarAtributo(camp, 'raciocinio', 1);
      alterarAtributo(camp, 'percepcao', 1);
      camp.personagem.inventario.moeda_antiga = (camp.personagem.inventario.moeda_antiga ?? 0) + 1;
      texto += ' Você rastejou pelas lajes frias e emergiu com uma moeda esquecida pelo tempo.';
    } else if (opcaoId === 'marcar_segredo') {
      alterarAtributo(camp, 'percepcao', 1);
      alterarAtributo(camp, 'resiliencia', 1);
      texto += ' Você guardou a memória da pedra oculta para o dia em que estivesse pronto.';
    } else {
      alterarAtributo(camp, 'social', 1);
      f.prestigio += 1;
      texto += ' Os anciãos lacraram o fosso e elogiaram seu bom senso e cautela.';
    }
  } else if (evento.id === 'inverno_rigoroso') {
    if (opcaoId === 'manter_fogueira') {
      alterarAtributo(camp, 'resiliencia', 2);
      alterarAtributo(camp, 'social', 1);
      for (const m of f.membros.filter(m => m.condicao !== 'morto')) {
        camp.npcState[m.id].eixos.confianca = Math.min(20, (camp.npcState[m.id].eixos.confianca ?? 0) + 5);
        registrarLembranca(camp, m.id, {
          tipo: 'ajuda',
          resumo: 'você vigiou o fogo noite após noite durante o inverno mais cruel para que a casa não congelasse',
          peso: 4,
        });
      }
      texto += ' Suas noites em claro aquecendo os mais fracos selaram a união inabalável da casa.';
    } else if (opcaoId === 'buscar_lenha_gelo') {
      alterarAtributo(camp, 'fisico', 2);
      camp.personagem.cicatrizes.push('marcas de geada nos dedos');
      texto += ' Você enfrentou a nevasca e garantiu a lenha, gravando a resistência do gelo na pele.';
    } else {
      alterarAtributo(camp, 'precisao', 1);
      alterarAtributo(camp, 'percepcao', 1);
      f.patrimonio += 6;
      texto += ' Suas armadilhas no mato nevado trouxeram caça quando todos passavam necessidade.';
    }
  } else if (evento.id === 'incendio_forja') {
    if (opcaoId === 'salvar_ferreiro') {
      alterarAtributo(camp, 'fisico', 2);
      alterarAtributo(camp, 'resiliencia', 1);
      camp.personagem.inventario.pedra_de_amolar = (camp.personagem.inventario.pedra_de_amolar ?? 0) + 1;
      f.prestigio += 2;
      const paiFerreiro = f.membros.find(m => m.parentesco === 'pai' && /ferreir/i.test(m.ocupacao));
      if (paiFerreiro && paiFerreiro.condicao !== 'morto') {
        registrarLembranca(camp, paiFerreiro.id, {
          tipo: 'ajuda',
          resumo: 'você entrou na forja em chamas aos 10 anos e arrancou seu pai do fogo, salvando sua vida',
          peso: 5,
        });
        camp.npcState[paiFerreiro.id].eixos.confianca = Math.min(20, (camp.npcState[paiFerreiro.id].eixos.confianca ?? 0) + 12);
      } else {
        for (const p of f.membros.filter(m => (m.parentesco === 'pai' || m.parentesco === 'mae') && m.condicao !== 'morto')) {
          registrarLembranca(camp, p.id, {
            tipo: 'ajuda',
            resumo: 'você enfrentou o fogo da forja para salvar o mestre ferreiro com bravura incomum',
            peso: 4,
          });
          camp.npcState[p.id].eixos.confianca = Math.min(20, (camp.npcState[p.id].eixos.confianca ?? 0) + 8);
        }
      }
      texto += ' Você arrancou o ferreiro das labaredas e recebeu a gratidão eterna da forja.';
    } else if (opcaoId === 'linha_de_baldes') {
      alterarAtributo(camp, 'raciocinio', 2);
      alterarAtributo(camp, 'social', 1);
      camp.personagem.pericias.persuadir = (camp.personagem.pericias.persuadir ?? 0) + 1;
      f.prestigio += 2;
      texto += ' Sua liderança calma guiou a corrente de baldes e impediu que a vila queimasse.';
    } else {
      alterarAtributo(camp, 'precisao', 2);
      f.patrimonio += 15;
      texto += ' Com agilidade impressionante, você salvou fardos e ferramentas da ruína.';
    }
  } else if (evento.id === 'sombra_na_mata') {
    if (opcaoId === 'sustentar_respiracao') {
      alterarAtributo(camp, 'percepcao', 2);
      alterarAtributo(camp, 'precisao', 1);
      if (!camp.personagem.artesConhecidas.includes('passo_leve')) {
        camp.personagem.artesConhecidas.push('passo_leve');
      }
      camp.flags['vislumbrou_criatura_noturna'] = true;
      texto += ' Você dominou o próprio pavor e a respiração, aprendendo a arte do Passo Leve no silêncio da mata.';
    } else if (opcaoId === 'proteger_amigo') {
      alterarAtributo(camp, 'fisico', 2);
      alterarAtributo(camp, 'resiliencia', 1);
      if (!camp.personagem.alcunhas.includes('Olhar Férreo')) {
        camp.personagem.alcunhas.push('Olhar Férreo');
      }
      const irmaoMata = f.membros.find(m => (m.parentesco === 'irma' || m.parentesco === 'irmao') && m.condicao !== 'morto');
      if (irmaoMata) {
        registrarLembranca(camp, irmaoMata.id, {
          tipo: 'ajuda',
          resumo: 'você colocou o próprio corpo entre a besta da mata e seu irmão aos 10 anos, olhando o monstro de frente',
          peso: 5,
        });
        camp.npcState[irmaoMata.id].eixos.confianca = Math.min(20, (camp.npcState[irmaoMata.id].eixos.confianca ?? 0) + 12);
      }
      for (const p of f.membros.filter(m => (m.parentesco === 'pai' || m.parentesco === 'mae') && m.condicao !== 'morto')) {
        registrarLembranca(camp, p.id, {
          tipo: 'ajuda',
          resumo: 'você enfrentou o pavor da fera da mata aos 10 anos com olhar férreo para proteger quem estava com você',
          peso: 4,
        });
        camp.npcState[p.id].eixos.confianca = Math.min(20, (camp.npcState[p.id].eixos.confianca ?? 0) + 8);
      }
      texto += ' Você sustentou a postura diante do monstro e conquistou uma lealdade que nada pode quebrar.';
    } else {
      alterarAtributo(camp, 'raciocinio', 2);
      alterarAtributo(camp, 'percepcao', 1);
      camp.personagem.pericias.perceber = (camp.personagem.pericias.perceber ?? 0) + 1;
      texto += ' Os padrões daquela criatura ficaram gravados na sua mente como lição de sobrevivência.';
    }
  } else if (evento.id === 'inquisicao_selo') {
    if (opcaoId === 'responder_com_firmeza') {
      alterarAtributo(camp, 'social', 1);
      alterarAtributo(camp, 'raciocinio', 1);
      f.prestigio += 2;
      texto += ' Sua clareza e respeito desarmaram as suspeitas do clérigo e protegeram a casa.';
    } else if (opcaoId === 'ocultar_reliquias') {
      alterarAtributo(camp, 'precisao', 2);
      alterarAtributo(camp, 'percepcao', 1);
      camp.personagem.pericias.furtividade = (camp.personagem.pericias.furtividade ?? 0) + 1;
      texto += ' As mãos rápidas esconderam cada pergaminho antes que as botas de aço entrassem.';
    } else {
      alterarAtributo(camp, 'resiliencia', 2);
      alterarAtributo(camp, 'fisico', 1);
      camp.flags['desafiou_inquisicao'] = true;
      if (!camp.personagem.alcunhas.includes('Indomável')) {
        camp.personagem.alcunhas.push('Indomável');
      }
      texto += ' Seu olhar inflexível não baixou diante do inquisidor, inspirando quem assistia em silêncio.';
    }
  } else if (evento.id === 'torneio_juventude') {
    if (opcaoId === 'vencer_na_arena') {
      alterarAtributo(camp, 'fisico', 2);
      alterarAtributo(camp, 'precisao', 1);
      camp.personagem.inventario.luvas_de_couro = (camp.personagem.inventario.luvas_de_couro ?? 0) + 1;
      f.prestigio += 2;
      texto += ' A poeira da arena baixou com você de pé, vitorioso sob os aplausos do vale.';
    } else if (opcaoId === 'prova_de_arquearia') {
      alterarAtributo(camp, 'precisao', 2);
      alterarAtributo(camp, 'percepcao', 1);
      camp.personagem.pericias.perceber = (camp.personagem.pericias.perceber ?? 0) + 1;
      f.prestigio += 1;
      texto += ' Sua flecha cravou o centro exato da marcação, provando uma precisão assombrosa.';
    } else {
      alterarAtributo(camp, 'social', 2);
      alterarAtributo(camp, 'raciocinio', 1);
      camp.personagem.pericias.persuadir = (camp.personagem.pericias.persuadir ?? 0) + 1;
      f.prestigio += 3;
      texto += ' As crônicas e cantos que você entoou comoveram a assembleia e elevaram o nome da sua família.';
    }
  } else if (evento.id === 'emboscada_estrada') {
    if (opcaoId === 'lutar_com_furia') {
      alterarAtributo(camp, 'fisico', 2);
      alterarAtributo(camp, 'precisao', 1);
      camp.personagem.pericias.atletismo = (camp.personagem.pericias.atletismo ?? 0) + 1;
      camp.personagem.inventario.espada_curta = (camp.personagem.inventario.espada_curta ?? 0) + 1;
      if (!camp.personagem.alcunhas.includes('Batizado em Sangue')) {
        camp.personagem.alcunhas.push('Batizado em Sangue');
      }
      for (const m of f.membros.filter(m => m.condicao !== 'morto')) {
        registrarLembranca(camp, m.id, {
          tipo: 'marco',
          resumo: 'aos 14 anos você empunhou o aço e sangrou os salteadores para defender a carroça da família',
          peso: 5,
        });
        camp.npcState[m.id].eixos.confianca = Math.min(20, (camp.npcState[m.id].eixos.confianca ?? 0) + 8);
      }
      texto += ' O corte de aço foi rápido e decisivo; a infância terminou na poeira da estrada com a lâmina manchada.';
    } else if (opcaoId === 'manobrar_fuga') {
      alterarAtributo(camp, 'precisao', 2);
      alterarAtributo(camp, 'raciocinio', 1);
      camp.personagem.pericias.perceber = (camp.personagem.pericias.perceber ?? 0) + 1;
      f.patrimonio += 20;
      for (const m of f.membros.filter(m => m.condicao !== 'morto')) {
        registrarLembranca(camp, m.id, {
          tipo: 'ajuda',
          resumo: 'aos 14 anos você conduziu os cavalos no desfiladeiro durante a emboscada, salvando as vidas e a carga da família',
          peso: 4,
        });
        camp.npcState[m.id].eixos.confianca = Math.min(20, (camp.npcState[m.id].eixos.confianca ?? 0) + 6);
      }
      texto += ' Você conduziu os cavalos no fio da ravina com perícia cirúrgica, salvando as vidas e a carga.';
    } else {
      alterarAtributo(camp, 'raciocinio', 2);
      alterarAtributo(camp, 'percepcao', 1);
      camp.personagem.pericias.furtividade = (camp.personagem.pericias.furtividade ?? 0) + 1;
      camp.personagem.dinheiro += 25;
      texto += ' A armadilha virou contra os caçadores: os salteadores recuaram em desespero deixando o saque.';
    }
  } else if (evento.id === 'rito_da_vigia') {
    if (opcaoId === 'olhos_na_escuridao') {
      alterarAtributo(camp, 'percepcao', 2);
      alterarAtributo(camp, 'resiliencia', 1);
      camp.personagem.pericias.perceber = (camp.personagem.pericias.perceber ?? 0) + 1;
      if (!camp.personagem.artesConhecidas.includes('ler_aura')) {
        camp.personagem.artesConhecidas.push('ler_aura');
      }
      texto += ' Na solidão da torre sob o vendaval noturno, seus olhos aprenderam a ler as auras no escuro.';
    } else if (opcaoId === 'disciplina_de_ferro') {
      alterarAtributo(camp, 'fisico', 2);
      alterarAtributo(camp, 'precisao', 1);
      if (!camp.personagem.artesConhecidas.includes('segundo_folego')) {
        camp.personagem.artesConhecidas.push('segundo_folego');
      }
      texto += ' O treino exaustivo na chuva forjou uma resistência pulmonar profunda: a técnica de Segundo Fôlego.';
    } else {
      alterarAtributo(camp, 'raciocinio', 2);
      alterarAtributo(camp, 'social', 1);
      camp.personagem.inventario.mapa_rasgado = (camp.personagem.inventario.mapa_rasgado ?? 0) + 1;
      camp.personagem.pericias.decifrar = (camp.personagem.pericias.decifrar ?? 0) + 1;
      texto += ' Você desenhou as rotas e passagens do vale à luz de vela, desvendando segredos de fronteira.';
    }
  } else if (evento.id === 'encruzilhada_oficio') {
    if (opcaoId === 'seguir_batedores') {
      alterarAtributo(camp, 'precisao', 2);
      alterarAtributo(camp, 'raciocinio', 1);
      camp.personagem.pericias.furtividade = (camp.personagem.pericias.furtividade ?? 0) + 1;
      camp.flags['conhece_trilhas_secretas'] = true;
      texto += ' O batedor ensinou os passos silenciosos e as passagens não vigiadas através dos desfiladeiros.';
    } else if (opcaoId === 'aprender_cura_e_ervas') {
      alterarAtributo(camp, 'raciocinio', 2);
      alterarAtributo(camp, 'resiliencia', 1);
      camp.personagem.pericias.oficio = (camp.personagem.pericias.oficio ?? 0) + 1;
      camp.personagem.inventario.pocao_cura_menor = (camp.personagem.inventario.pocao_cura_menor ?? 0) + 2;
      texto += ' Você aprendeu a estancar hemorragias e destilar bálsamos curativos na fumaça da cabana.';
    } else {
      alterarAtributo(camp, 'resiliencia', 2);
      alterarAtributo(camp, 'social', 1);
      f.prestigio += 3;
      for (const m of f.membros.filter(m => m.condicao !== 'morto')) {
        camp.npcState[m.id].eixos.confianca = Math.min(20, (camp.npcState[m.id].eixos.confianca ?? 0) + 10);
        registrarLembranca(camp, m.id, {
          tipo: 'marco',
          resumo: 'aos 14 anos você escolheu fincar raízes e sustentar o lar ao lado da família em vez de partir pelo mundo',
          peso: 5,
        });
      }
      texto += ' Sua escolha de permanecer firme ao lado da família consolidou o respeito e a força do seu sangue.';
    }
  } else if (evento.id === 'origem_japao') {
    if (opcaoId === 'crescer_kyudo') {
      alterarAtributo(camp, 'precisao', 2);
      alterarAtributo(camp, 'raciocinio', 1);
      texto += ' A dedicação ao Kyudo treinou sua precisão e serenidade sob pressão.';
    } else {
      alterarAtributo(camp, 'raciocinio', 2);
      alterarAtributo(camp, 'percepcao', 1);
      texto += ' O estudo dos manuscritos arcanos despertou seu intelecto e percepção mágica.';
    }
  } else if (evento.id === 'tsukimichi_mana_oculto') {
    if (opcaoId === 'conter_mana') {
      alterarAtributo(camp, 'resiliencia', 2);
      alterarAtributo(camp, 'percepcao', 1);
      texto += ' Você aprendeu a restringir o fluxo de mana para não incinerar o ambiente.';
    } else {
      alterarAtributo(camp, 'fisico', 2);
      alterarAtributo(camp, 'resiliencia', 1);
      texto += ' Seu corpo físico se fortaleceu para conter a pressão colossal de mana.';
    }
  } else if (evento.id === 'tsukimichi_invocacao_deusa') {
    if (opcaoId === 'encarar_deusa') {
      alterarAtributo(camp, 'raciocinio', 2);
      camp.personagem.pressoes.presenca = (camp.personagem.pressoes.presenca ?? 0) + 10;
      texto += ' Você sustentou o olhar da Deusa com desdém; sua presença interior se tornou inabalável.';
    } else {
      alterarAtributo(camp, 'resiliencia', 2);
      alterarAtributo(camp, 'precisao', 1);
      texto += ' Você comprimiu o mana corporal e manteve a mente lúcida durante a queda da estratosfera.';
    }
  } else if (evento.id === 'tsukimichi_queda_wasteland') {
    alterarAtributo(camp, 'fisico', 3);
    alterarAtributo(camp, 'resiliencia', 3);
    alterarAtributo(camp, 'percepcao', 2);
    alterarAtributo(camp, 'raciocinio', 2);
    if (!camp.personagem.sakai) {
      camp.personagem.sakai = {
        desbloqueado: true,
        nivel: 1,
        experienciaTreino: 0,
        treinosRealizados: 0,
        modosDisponiveis: ['percepcao'],
        modoAtivo: undefined,
      };
    }
    recalcularRecursosMaximos(camp);
    camp.personagem.recursos.vida = camp.personagem.recursosMax.vida;
    camp.personagem.recursos.mana = camp.personagem.recursosMax.mana;
    texto += ' Você se ergue da cratera nas terras calcinadas da Wasteland aos 18 anos. Seu corpo sobre-humano adaptado à gravidade da Terra e seu oceano de mana incomensurável são sua única lei. A jornada começa aqui no ermo.';
  }
  f.historia.push({ idade: evento.idade, texto });
  const proximaIdade = evento.idade === 0 ? 6 : evento.idade === 6 ? 10 : evento.idade === 10 ? 14 : 18;
  f.idadeJogador = proximaIdade;
  camp.personagem.idade = proximaIdade;
  for (const m of f.membros) {
    const idade = m.idadeNoNascimento + proximaIdade;
    camp.npcState[m.id].idade = idade;
    const npc = camp.npcsProcedurais?.find(n => n.id === m.id);
    if (npc && idade >= 18 && (m.parentesco === 'irma' || m.parentesco === 'irmao')) npc.ocupacao = m.prodigio ? 'jovem prodígio' : m.parentesco === 'irma' ? 'trabalhadora da família' : 'trabalhador da família';
  }
  if (proximaIdade >= 18) {
    f.prologoConcluido = true;
    f.eventoAtual = undefined;
    camp.personagem.dinheiro += Math.floor(f.patrimonio / 4);
    return { ok: true, texto, concluida: true };
  }
  f.eventoAtual = proximoEvento(camp, f, proximaIdade);
  return { ok: true, texto };
}

/**
 * Conclui o prólogo da infância imediatamente, estabelecendo o personagem aos 18 anos
 * com a família atualizada e recursos calculados. Permite ao jogador pular o prólogo
 * e entrar diretamente no jogo sem passar pelas etapas intermediárias.
 */
export function concluirPrologoInfancia(content: ContentBundle, camp: Campaign): void {
  const f = camp.familia;
  if (!f) return;
  f.idadeJogador = 18;
  camp.personagem.idade = 18;
  for (const m of f.membros) {
    const idade = m.idadeNoNascimento + 18;
    if (camp.npcState[m.id]) camp.npcState[m.id].idade = idade;
    const npc = camp.npcsProcedurais?.find(n => n.id === m.id);
    if (npc && idade >= 18 && (m.parentesco === 'irma' || m.parentesco === 'irmao')) {
      npc.ocupacao = m.prodigio ? 'jovem prodígio' : m.parentesco === 'irma' ? 'trabalhadora da família' : 'trabalhador da família';
    }
  }
  f.prologoConcluido = true;
  f.eventoAtual = undefined;
  camp.personagem.dinheiro += Math.floor(f.patrimonio / 4);
}


export function resumoFamilia(camp: Campaign): string[] {
  return (camp.familia?.membros ?? []).map(m => `${m.nome}, ${m.parentesco}: ${m.ocupacao}; ${m.condicao}${m.prodigio ? '; prodígio' : ''}.`);
}

export function registrarMorteFamiliar(camp: Campaign, npcId: string): void {
  const membro = camp.familia?.membros.find(m => m.id === npcId);
  if (!membro || membro.condicao === 'morto') return;
  membro.condicao = 'morto';
  // A primeira morte no próprio sangue é limiar, e só a primeira. O que muda
  // um caçador não é a contagem de perdas — é descobrir que existem. Concedido
  // uma vez, pela chave, mesmo que a família inteira caia depois.
  concederDespertar(camp, 'a_perda', `${membro.nome} não voltou, e você continuou`);
}

export function sincronizarIdadeFamilia(camp: Campaign): void {
  if (camp.familia) camp.familia.idadeJogador = camp.personagem.idade ?? camp.familia.idadeJogador;
}

export function resgatarParente(camp: Campaign, parenteId: string, modo: 'resgate' | 'infiltracao'): { ok: boolean; texto: string } {
  const f = camp.familia;
  const p = f?.membros.find(m => m.id === parenteId && m.condicao === 'cativo');
  if (!f || !p) return { ok: false, texto: 'Esse familiar não está em cativeiro.' };
  if (camp.localAtual !== 'acampamento') return { ok: false, texto: 'O rastro dos captores leva ao acampamento.' };
  if (modo === 'resgate') {
    if (camp.personagem.dinheiro < 50) return { ok: false, texto: 'O resgate custa 50 moedas.' };
    camp.personagem.dinheiro -= 50;
  } else {
    const chance = Math.min(.85, .35 + (camp.personagem.atributos.precisao - 10) * .04 + (camp.personagem.pericias.furtividade ?? 0) * .08);
    if (nextFloat(camp.rng) > chance) {
      camp.personagem.recursos.vida = Math.max(1, camp.personagem.recursos.vida - 8);
      camp.personagem.condicoes.push('ferido_em_resgate');
      f.historia.push({ idade: f.idadeJogador, texto: `Você tentou tirar ${p.nome} do cativeiro e voltou ferido.` });
      return { ok: false, texto: `${p.nome} continua cativo; sua tentativa alertou os guardas.` };
    }
  }
  p.condicao = 'livre';
  const civil = camp.vivo?.pessoas[p.id];
  if (civil) { civil.objetivo = 'rotina'; civil.local = 'taverna'; civil.casa = 'taverna'; civil.deslocado = false; civil.cativoAte = undefined; }
  const npc = camp.npcsProcedurais?.find(n => n.id === p.id);
  if (npc) npc.localBase = 'taverna';
  camp.npcState[p.id].eixos.confianca = Math.min(20, (camp.npcState[p.id].eixos.confianca ?? 0) + 10);
  f.historia.push({ idade: f.idadeJogador, texto: `Você libertou ${p.nome} do cativeiro.` });
  return { ok: true, texto: `${p.nome} está livre e voltou para a família.` };
}
