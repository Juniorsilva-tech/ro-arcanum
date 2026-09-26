import type { AttrKey, Campaign, ContentBundle, NPC, NpcDinamico } from './types';
import { nextFloat, nextInt, pick } from './rng';
import { concederDespertar, recalcularRecursosMaximos } from './progresso';

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
const NOMES_IRMAOS = ['Iria', 'Cael', 'Mara', 'Oren', 'Sena', 'Tomas', 'Lia', 'Daren'];
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

export function flexionarOficio(of: string, genero: 'm' | 'f'): string {
  if (genero === 'm') {
    return of
      .replace(/\bcriadora de animais\b/g, 'criador de animais')
      .replace(/\bcurandeira\b/g, 'curandeiro')
      .replace(/\bcaçadora\b/g, 'caçador')
      .replace(/\bartesã\b/g, 'artesão')
      .replace(/\bmaga de corte\b/g, 'mago de corte')
      .replace(/\badministradora\b/g, 'administrador');
  } else {
    return of
      .replace(/\bcriador de animais\b/g, 'criadora de animais')
      .replace(/\bferreiro\b/g, 'ferreira')
      .replace(/\blavrador\b/g, 'lavradora')
      .replace(/\bmineiro\b/g, 'mineira')
      .replace(/\bmago itinerante\b/g, 'maga itinerante')
      .replace(/\bbatedor\b/g, 'batedora')
      .replace(/\bherói aposentado\b/g, 'heroína aposentada')
      .replace(/\bmestre da espada\b/g, 'mestra da espada')
      .replace(/\bnobre fugitivo\b/g, 'nobre fugitiva')
      .replace(/\brei exilado\b/g, 'rainha exilada');
  }
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
  const tipo = pick(camp.rng, ['peste', 'cobradores', 'fome', 'talento'] as const);
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
  return eventoTalento(6);
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
    { id: 'treinar', rotulo: 'Aceitar o treinamento', descricao: 'Aumenta seu maior talento e o prestígio familiar.' },
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

function proximoEvento(camp: Campaign, familia: FamiliaState, idade: number): EventoInfancia {
  if (camp.cenarioId === 'tsukimichi') {
    if (idade === 6) return eventoAosSeisTsukimichi(camp, familia);
    if (idade === 10) return eventoAosDezTsukimichi(camp, familia);
    return eventoAosQuatorzeTsukimichi(camp, familia);
  }
  if (idade === 6) return eventoAosSeis(camp, familia);
  if (idade === 10) return camp.genese?.marca === 'genio' ? eventoTalento(10) : nextFloat(camp.rng) < .45 ? eventoCativeiro(10) : eventoTalento(10);
  return { id: 'partida', idade: 14, titulo: 'A vida adulta se aproxima', descricao: 'O mundo oferece um caminho, enquanto sua família ainda cobra presença.', opcoes: [
    { id: 'aprendizado', rotulo: 'Partir para aprender um ofício', descricao: 'Ganha técnica e deixa a família conduzir a própria vida.' },
    { id: 'defender', rotulo: 'Ficar para defender a casa', descricao: 'Fortalece corpo e vínculos; inimigos passam a conhecer seu nome.' },
    { id: 'fugir', rotulo: 'Ir embora sem promessa de volta', descricao: 'Ganha liberdade, perde confiança e começa com recursos próprios.' },
  ] };
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
    membros.push({ id: `familia_irmao_${i + 1}`, nome: pick(camp.rng, NOMES_IRMAOS), parentesco: irma ? 'irma' : 'irmao',
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
    if (opcaoId === 'proteger_irmaos') alterarAtributo(camp, 'social', 2);
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
    if (opcaoId === 'treinar') { alterarAtributo(camp, maiorTalento(camp.personagem.atributos), 2); f.prestigio += 2; }
    if (opcaoId === 'dividir') {
      const irmao = f.membros.find(m => m.parentesco === 'irma' || m.parentesco === 'irmao');
      if (irmao) { irmao.prodigio = true; irmao.prestigio += 3; camp.npcState[irmao.id].eixos.confianca = 15; texto += ` ${irmao.nome} floresceu como prodígio.`; }
      else alterarAtributo(camp, 'social');
    }
    if (opcaoId === 'recusar') for (const m of f.membros) camp.npcState[m.id].eixos.confianca = 12;
  } else if (evento.id === 'partida') {
    if (opcaoId === 'aprendizado') { camp.personagem.pericias.oficio = 1; alterarAtributo(camp, 'raciocinio'); }
    if (opcaoId === 'defender') { alterarAtributo(camp, 'fisico'); alterarAtributo(camp, 'resiliencia'); camp.flags['defendeu_familia'] = true; }
    if (opcaoId === 'fugir') { f.patrimonio = Math.max(0, f.patrimonio - 10); camp.personagem.dinheiro += 20; for (const m of f.membros) camp.npcState[m.id].eixos.confianca -= 8; }
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
    if (npc && idade >= 18 && (m.parentesco === 'irma' || m.parentesco === 'irmao')) npc.ocupacao = m.prodigio ? 'jovem prodígio' : 'trabalhador da família';
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
      npc.ocupacao = m.prodigio ? 'jovem prodígio' : 'trabalhador da família';
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
