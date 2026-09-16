"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.artesKimetsu = exports.IDADES_KIMETSU = void 0;
exports.integrarKimetsu = integrarKimetsu;
// Overlay preserves published IDs used by saves and quests. Names/identities
// derive from the supplied compendia; costs, durations and ages are adaptations.
exports.IDADES_KIMETSU = {
    tanjiro: 19, nezuko: 18, zenitsu: 19, inosuke: 19, kanao: 18, genya: 18,
    muichiro: 18, mitsuri: 19, shinobu: 20, rengoku: 20, giyu: 20,
    sanemi: 20, obanai: 20, tengen: 23, gyomei: 27,
};
const formas = [
    ['respiracao_agua_primeira_forma', 'Água · Primeira Forma', 'agua', 'corte', 10, 3, 1, 0],
    ['respiracao_agua_decima_forma', 'Água · Décima Forma — Fluxo Constante', 'agua', 'corte', 9, 5, 4, 2, 'respiracao_agua_primeira_forma'],
    ['respiracao_agua_decima_primeira_forma', 'Água · Décima Primeira Forma — Calmaria', 'agua', 'guarda', 0, 4, 6, 3, 'respiracao_agua_decima_forma'],
    ['respiracao_pedra_forma_serena', 'Pedra · Guarda da Corrente (adaptação)', 'pedra', 'guarda', 0, 4, 3, 2],
    ['respiracao_inseto_danca_da_borboleta', 'Inseto · Dança da Borboleta', 'inseto', 'veneno', 5, 3, 3, 2],
    ['respiracao_chama_nona_forma', 'Chamas · Nona Forma — Rengoku', 'chamas', 'corte', 24, 7, 6, 3],
    ['respiracao_nevoa_setima_forma', 'Névoa · Sétima Forma — Obscuridade', 'nevoa', 'esquiva', 9, 4, 5, 3],
    ['respiracao_amor_sexta_forma', 'Amor · Sexta Forma', 'amor', 'area', 10, 4, 4, 2],
    ['respiracao_serpente_quinta_dobra', 'Serpente · Quinta Forma', 'serpente', 'precisao', 13, 4, 4, 2],
    ['respiracao_vento_terceira_forma', 'Vento · Terceira Forma', 'vento', 'area', 12, 5, 4, 2],
    ['respiracao_som_quarta_nota', 'Som · Quarta Forma', 'som', 'area', 13, 5, 4, 2],
    ['respiracao_trovao_primeira', 'Trovão · Primeira Forma — Estrondo e Relâmpago', 'trovao', 'precisao', 16, 4, 2, 2],
    ['respiracao_fera_primeira', 'Fera · Primeira Presa', 'fera', 'corte', 14, 3, 2, 1],
    ['respiracao_flor_percepcao', 'Flor · Percepção de Combate (adaptação)', 'flor', 'esquiva', 8, 3, 3, 2],
    ['hinokami_kagura_danca', 'Hinokami Kagura · Dança', 'sol', 'corte', 20, 7, 6, 3, 'respiracao_agua_decima_forma'],
];
const regras = {
    corte: 'Corte físico. Nichirin finaliza onis vulneráveis; fôlego e recarga limitam a sequência.',
    guarda: 'Reduz os próximos dois impactos em 65%. Não é invulnerabilidade e não causa dano.',
    esquiva: 'Melhora a evasão contra os próximos dois ataques e executa um corte leve.',
    veneno: 'Gasta uma dose de glicínia. Suprime regeneração por três turnos; dano não substitui decapitação de uma Lua.',
    area: 'Ataca todos os adversários vivos; não cria elementos naturais a partir da respiração.',
    precisao: 'Um corte com bônus de precisão, útil contra alvos evasivos.',
};
exports.artesKimetsu = formas.map(([id, nome, estilo, modo, potencia, custo, nivelMinimo, recarga, exige]) => ({
    id, nome, escola: 'Técnica', grau: nivelMinimo >= 6 ? 'mitica' : nivelMinimo >= 3 ? 'rara' : 'notavel',
    custo: { recurso: 'vigor', valor: custo }, efeito: regras[modo],
    tecnica: { estilo, modo, potencia, nivelMinimo, recarga, exige,
        golpes: id === 'respiracao_agua_decima_forma' ? 2 : 1, descricaoRegra: regras[modo] },
}));
const perfis = {
    lua_inferior_seis: ['Kamanue', 'garras', .08],
    lua_inferior_cinco: ['Rui', 'fios', .1],
    lua_inferior_quatro: ['Mukago', 'garras', .08],
    lua_inferior_tres: ['Wakuraba', 'garras', .08],
    lua_inferior_dois: ['Rokuro', 'garras', .09],
    lua_inferior_um: ['Enmu', 'sono', .1],
    lua_superior_seis: ['Gyutaro', 'veneno', .12, 'gemeos'],
    daki: ['Daki', 'faixas', .1, 'gemeos'],
    lua_superior_cinco: ['Gyokko', 'vasos', .12],
    lua_superior_quatro: ['Hantengu', 'emocoes', .12],
    lua_superior_tres: ['Akaza', 'bussola', .14],
    lua_superior_dois: ['Doma', 'gelo', .14],
    lua_superior_um: ['Kokushibo', 'lua', .16],
    muzan: ['Muzan Kibutsuji', 'sangue', .2, 'sol'],
    nakime: ['Nakime', 'biwa', .1],
    kyogai: ['Kyogai', 'tambores', .08],
    kaigaku: ['Kaigaku', 'relampago', .11],
    ubume: ['Ubume', 'ilusao', .09],
    hairo: ['Hairo', 'armas', .1],
    oni_da_mao: ['Oni das Mãos', 'bracos', .08],
    oni_do_pantano: ['Oni do Pântano', 'pantano', .08],
    susamaru: ['Susamaru', 'temari', .08],
    yahaba: ['Yahaba', 'setas', .08],
};
const novosOnis = [
    { id: 'daki', nome: 'Daki', descricao: 'As faixas de Daki aprisionam as vítimas. Seu destino está ligado a Gyutaro.', nivel: 10, vida: 90, defesa: 15, acerto: 15, ataqueNome: 'Faixas Obi', dano: { base: 10, dispersao: .3, tipo: 'corte' }, moralBase: 90, xp: 180, oni: true, chefe: true, faccaoId: 'onis' },
    { id: 'nakime', nome: 'Nakime', descricao: 'A biwa desloca salas e separa os invasores do Castelo Infinito.', nivel: 12, vida: 130, defesa: 18, acerto: 14, ataqueNome: 'Salas em movimento', dano: { base: 12, dispersao: .3, tipo: 'impacto' }, moralBase: 90, xp: 250, oni: true, chefe: true, faccaoId: 'onis' },
    { id: 'kyogai', nome: 'Kyogai', descricao: 'Os tambores alteram a orientação dos aposentos e lançam cortes.', nivel: 6, vida: 65, defesa: 13, acerto: 13, ataqueNome: 'Tambor do ventre', dano: { base: 9, dispersao: .3, tipo: 'corte' }, moralBase: 70, xp: 100, oni: true, chefe: true, faccaoId: 'onis' },
    { id: 'kaigaku', nome: 'Kaigaku', descricao: 'Espadachim demonizado que combina Trovão com eletricidade demoníaca real.', nivel: 10, vida: 105, defesa: 16, acerto: 17, ataqueNome: 'Trovão negro', dano: { base: 13, dispersao: .25, tipo: 'eletricidade' }, moralBase: 90, xp: 260, oni: true, chefe: true, faccaoId: 'onis' },
    { id: 'ubume', nome: 'Ubume', descricao: 'Antiga Lua Inferior associada a ilusões e distorção de percepção.', nivel: 8, vida: 80, defesa: 15, acerto: 15, ataqueNome: 'Ilusão cortante', dano: { base: 10, dispersao: .35, tipo: 'mental' }, moralBase: 85, xp: 180, oni: true, chefe: true, faccaoId: 'onis' },
    { id: 'hairo', nome: 'Hairo', descricao: 'Antiga Lua Inferior que materializa armas a partir de sombras.', nivel: 8, vida: 85, defesa: 14, acerto: 16, ataqueNome: 'Arsenal sombrio', dano: { base: 12, dispersao: .3, tipo: 'perfuração' }, moralBase: 88, xp: 190, oni: true, chefe: true, faccaoId: 'onis' },
    { id: 'oni_da_mao', nome: 'Oni das Mãos', descricao: 'Décadas de vítimas alimentaram braços numerosos e alcance anormal.', nivel: 5, vida: 70, defesa: 12, acerto: 13, ataqueNome: 'Braços múltiplos', dano: { base: 10, dispersao: .35, tipo: 'impacto' }, moralBase: 80, xp: 90, oni: true, chefe: true, faccaoId: 'onis' },
    { id: 'susamaru', nome: 'Susamaru', descricao: 'Lança temaris com força destrutiva e trajetórias coordenadas.', nivel: 6, vida: 60, defesa: 13, acerto: 15, ataqueNome: 'Temari', dano: { base: 9, dispersao: .25, tipo: 'impacto' }, moralBase: 75, xp: 100, oni: true, chefe: true, faccaoId: 'onis' },
    { id: 'yahaba', nome: 'Yahaba', descricao: 'Setas vetoriais invisíveis alteram a direção de corpos e ataques.', nivel: 6, vida: 58, defesa: 14, acerto: 15, ataqueNome: 'Setas vetoriais', dano: { base: 8, dispersao: .25, tipo: 'impacto' }, moralBase: 75, xp: 100, oni: true, chefe: true, faccaoId: 'onis' },
];
const ROTINAS_ELENCO = {
    // Caça de noite, dorme de dia, e a audição dele serve melhor no escuro.
    zenitsu: { madrugada: 'estrada', manha: 'mansao_ubuyashiki', tarde: 'mansao_ubuyashiki', entardecer: 'floresta', anoitecer: 'floresta', noite: 'estrada' },
    // Tsuguko: treino de manhã na mansão, campo à tarde, patrulha à noite.
    kanao: { madrugada: 'mansao_ubuyashiki', manha: 'mansao_ubuyashiki', tarde: 'floresta', entardecer: 'floresta', anoitecer: 'praca', noite: 'estrada' },
    // Não usa respiração: compensa treinando sozinho e caçando longe dos outros.
    genya: { madrugada: 'floresta', manha: 'mansao_ubuyashiki', tarde: 'ruinas', entardecer: 'ruinas', anoitecer: 'floresta', noite: 'floresta' },
    // Dirige a corporação de dentro de casa; a doença não o deixa sair.
    kagaya: { madrugada: 'mansao_ubuyashiki', manha: 'mansao_ubuyashiki', tarde: 'mansao_ubuyashiki', entardecer: 'mansao_ubuyashiki', anoitecer: 'mansao_ubuyashiki', noite: 'mansao_ubuyashiki' },
    // Coordena e cuida dele. Sai só até a capela, e volta.
    amane: { madrugada: 'mansao_ubuyashiki', manha: 'mansao_ubuyashiki', tarde: 'capela', entardecer: 'mansao_ubuyashiki', anoitecer: 'mansao_ubuyashiki', noite: 'mansao_ubuyashiki' },
    // Instrutor aposentado: fica onde se ensina, e dorme cedo.
    jigoro: { madrugada: 'mansao_ubuyashiki', manha: 'floresta', tarde: 'floresta', entardecer: 'mansao_ubuyashiki', anoitecer: 'mansao_ubuyashiki', noite: 'mansao_ubuyashiki' },
    // Ex-Hashira amargurado: bebe na taverna e evita a mansão de dia.
    shinjuro: { madrugada: 'mansao_ubuyashiki', manha: 'mansao_ubuyashiki', tarde: 'taverna', entardecer: 'taverna', anoitecer: 'taverna', noite: 'mansao_ubuyashiki' },
    // Atende quem chega ferido; a capela é o posto avançado dela.
    kanae: { madrugada: 'mansao_ubuyashiki', manha: 'capela', tarde: 'capela', entardecer: 'praca', anoitecer: 'floresta', noite: 'mansao_ubuyashiki' },
    // Os dois espíritos ficam onde morreram e onde ainda ensinam.
    sabito: { madrugada: 'floresta', manha: 'floresta', tarde: 'floresta', entardecer: 'floresta', anoitecer: 'floresta', noite: 'floresta' },
    makomo: { madrugada: 'floresta', manha: 'floresta', tarde: 'floresta', entardecer: 'floresta', anoitecer: 'floresta', noite: 'floresta' },
    // Cresceu na mata e não confia em telhado: dorme fora, caça o dia inteiro.
    inosuke: { madrugada: 'floresta', manha: 'floresta', tarde: 'ruinas', entardecer: 'ruinas', anoitecer: 'floresta', noite: 'floresta' },
    // Instrutor da Água: monte, e só o monte.
    urokodaki: { madrugada: 'floresta', manha: 'floresta', tarde: 'floresta', entardecer: 'floresta', anoitecer: 'floresta', noite: 'floresta' },
    // Os dois onis dissidentes já tinham manhã e tarde na capela; a noite é
    // quando podem sair, e é quando trabalham de verdade.
    tamayo: { madrugada: 'capela', manha: 'capela', tarde: 'capela', entardecer: 'capela', anoitecer: 'cripta', noite: 'cripta' },
    yushiro: { madrugada: 'capela', manha: 'capela', tarde: 'capela', entardecer: 'cripta', anoitecer: 'cripta', noite: 'praca' },
};
function npc(id, nome, idade, ocupacao, personalidade, localBase = 'mansao_ubuyashiki') {
    return { id, nome, idade, ocupacao, personalidade, localBase, faccaoId: 'cacadores',
        rotina: ROTINAS_ELENCO[id] ?? {}, vozNarrativa: personalidade, corpo: 'Veste roupas de viagem e equipamento coerente com seu ofício.', relacoes: [] };
}
const novosNpcs = [
    npc('zenitsu', 'Zenitsu Agatsuma', 19, 'caçador do Trovão', 'Ansioso e de audição aguçada; seu medo convive com uma lealdade obstinada.'),
    npc('inosuke', 'Inosuke Hashibira', 19, 'caçador da Fera', 'Competitivo e impetuoso; aprende a confiar pelo convívio, não por discursos.', 'floresta'),
    npc('kanao', 'Kanao Tsuyuri', 18, 'tsuguko e caçadora da Flor', 'Reservada, observadora e marcada pelo passado; suas decisões podem ganhar autonomia.'),
    npc('genya', 'Genya Shinazugawa', 18, 'caçador com munição Nichirin', 'Ríspido, inseguro e determinado a se reaproximar de Sanemi. Não utiliza respirações.'),
    npc('kagaya', 'Kagaya Ubuyashiki', 23, 'dirigente do Esquadrão Oculto', 'Sereno, estrategista e atento aos nomes e perdas dos caçadores.'),
    npc('amane', 'Amane Ubuyashiki', 23, 'coordenadora do Esquadrão Oculto', 'Organizada, firme e cuidadosa com a segurança da família e da organização.'),
    npc('urokodaki', 'Sakonji Urokodaki', 60, 'instrutor aposentado da Água', 'Severo nos exercícios, protetor com os discípulos e avesso a perdas evitáveis.', 'floresta'),
    npc('jigoro', 'Jigoro Kuwajima', 60, 'instrutor aposentado do Trovão', 'Exigente, paciente e convicto de que uma técnica bem aprendida importa.', 'mansao_ubuyashiki'),
    npc('shinjuro', 'Shinjuro Rengoku', 40, 'ex-Hashira das Chamas', 'Amargo e retraído, ainda portador de conhecimento profundo sobre as Chamas.'),
    npc('kanae', 'Kanae Kocho', 20, 'Hashira da Flor em uma linha divergente', 'Gentil, perceptiva e determinada a compreender onis sem abandonar a defesa humana.'),
    { ...npc('sabito', 'Sabito', 18, 'espírito espadachim', 'Rigoroso e protetor com novos discípulos.', 'floresta'), especie: 'espirito' },
    { ...npc('makomo', 'Makomo', 18, 'espírito instrutor', 'Paciente e precisa ao corrigir respiração e postura.', 'floresta'), especie: 'espirito' },
    { ...npc('tamayo', 'Tamayo', 30, 'médica clandestina', 'Comedida e cuidadosa; busca desfazer a condição demoníaca.', 'capela'), faccaoId: 'foragidos' },
    { ...npc('yushiro', 'Yushiro', 20, 'assistente de Tamayo', 'Desconfiado de estranhos e extremamente dedicado à médica.', 'capela'), faccaoId: 'foragidos' },
];
function integrarKimetsu(base) {
    const npcs = [...base.npcs, ...novosNpcs].map(n => ({ ...n, idade: exports.IDADES_KIMETSU[n.id] ?? n.idade }));
    const perfisCombate = {
        tanjiro: { vida: 78, defesa: 16, acerto: 17, dano: { base: 11, dispersao: .2, tipo: 'corte' }, tecnicas: ['respiracao_agua_decima_forma', 'hinokami_kagura_danca'], nichirin: true },
        nezuko: { vida: 90, defesa: 15, acerto: 16, dano: { base: 12, dispersao: .25, tipo: 'sangue explosivo' }, tecnicas: ['sangue_explosivo_nezuko'] },
        zenitsu: { vida: 62, defesa: 15, acerto: 19, dano: { base: 12, dispersao: .2, tipo: 'corte' }, tecnicas: ['respiracao_trovao_primeira'], nichirin: true },
        inosuke: { vida: 76, defesa: 14, acerto: 17, dano: { base: 12, dispersao: .3, tipo: 'corte serrilhado' }, tecnicas: ['respiracao_fera_primeira'], nichirin: true },
        kanao: { vida: 68, defesa: 17, acerto: 18, dano: { base: 11, dispersao: .2, tipo: 'corte' }, tecnicas: ['respiracao_flor_percepcao'], nichirin: true },
        genya: { vida: 82, defesa: 14, acerto: 16, dano: { base: 13, dispersao: .35, tipo: 'munição Nichirin' }, tecnicas: ['tiro_nichirin_genya'], nichirin: true },
        giyu: { vida: 100, defesa: 20, acerto: 20, dano: { base: 15, dispersao: .18, tipo: 'corte' }, tecnicas: ['respiracao_agua_decima_primeira_forma'], nichirin: true },
        gyomei: { vida: 135, defesa: 21, acerto: 19, dano: { base: 20, dispersao: .2, tipo: 'impacto Nichirin' }, tecnicas: ['respiracao_pedra_forma_serena'], nichirin: true },
        shinobu: { vida: 72, defesa: 18, acerto: 21, dano: { base: 8, dispersao: .15, tipo: 'estocada' }, tecnicas: ['respiracao_inseto_danca_da_borboleta'], nichirin: true },
        rengoku: { vida: 112, defesa: 18, acerto: 20, dano: { base: 18, dispersao: .2, tipo: 'corte' }, tecnicas: ['respiracao_chama_nona_forma'], nichirin: true },
        muichiro: { vida: 82, defesa: 20, acerto: 21, dano: { base: 15, dispersao: .15, tipo: 'corte' }, tecnicas: ['respiracao_nevoa_setima_forma'], nichirin: true },
        mitsuri: { vida: 104, defesa: 18, acerto: 20, dano: { base: 17, dispersao: .2, tipo: 'lâmina flexível' }, tecnicas: ['respiracao_amor_sexta_forma'], nichirin: true },
        obanai: { vida: 88, defesa: 19, acerto: 21, dano: { base: 16, dispersao: .18, tipo: 'corte sinuoso' }, tecnicas: ['respiracao_serpente_quinta_dobra'], nichirin: true },
        sanemi: { vida: 108, defesa: 18, acerto: 21, dano: { base: 18, dispersao: .25, tipo: 'corte' }, tecnicas: ['respiracao_vento_terceira_forma'], nichirin: true },
        tengen: { vida: 110, defesa: 18, acerto: 20, dano: { base: 17, dispersao: .25, tipo: 'explosão e corte' }, tecnicas: ['respiracao_som_quarta_nota'], nichirin: true },
        kanae: { vida: 88, defesa: 18, acerto: 19, dano: { base: 14, dispersao: .2, tipo: 'corte' }, tecnicas: ['respiracao_flor_percepcao'], nichirin: true },
        shinjuro: { vida: 96, defesa: 17, acerto: 18, dano: { base: 16, dispersao: .25, tipo: 'corte' }, tecnicas: ['respiracao_chama_nona_forma'], nichirin: true },
        tamayo: { vida: 70, defesa: 16, acerto: 15, dano: { base: 5, dispersao: .2, tipo: 'sangue ilusório' }, tecnicas: ['medicina_tamayo'], suporte: true },
        yushiro: { vida: 76, defesa: 17, acerto: 16, dano: { base: 8, dispersao: .2, tipo: 'talismã' }, tecnicas: ['talismas_yushiro'], suporte: true },
    };
    for (const n of npcs)
        if (perfisCombate[n.id])
            n.combatente = perfisCombate[n.id];
    const vincular = (a, b, nota) => {
        const n = npcs.find(n => n.id === a);
        n.relacoes = [...(n.relacoes ?? []).filter(r => r.npc !== b), { npc: b, tipo: 'protege', nota }];
    };
    vincular('genya', 'sanemi', 'Irmão mais novo; deseja reparar a relação.');
    vincular('sanemi', 'genya', 'Irmão mais novo; tenta afastá-lo do perigo.');
    vincular('shinobu', 'kanao', 'Irmã adotiva e tsuguko.');
    vincular('kanao', 'shinobu', 'Irmã adotiva e mentora.');
    vincular('yushiro', 'tamayo', 'Companheira de pesquisa e pessoa em quem confia.');
    vincular('shinjuro', 'rengoku', 'Filho e sucessor no estilo das Chamas.');
    vincular('rengoku', 'shinjuro', 'Pai e antigo mestre das Chamas.');
    vincular('kanae', 'shinobu', 'Irmã mais nova e parceira no combate a onis.');
    vincular('shinobu', 'kanae', 'Irmã mais velha e referência moral.');
    vincular('sabito', 'giyu', 'Amigo e companheiro do treinamento de Urokodaki.');
    // No public appearance of unprotected dissident onis during daytime.
    for (const id of ['nezuko', 'tamayo', 'yushiro']) {
        const n = npcs.find(n => n.id === id);
        n.especie = 'oni';
        n.rotina = { ...n.rotina, manha: 'capela', tarde: 'capela' };
    }
    const extras = [
        ['zenitsu', 'respiracao_trovao_primeira'], ['inosuke', 'respiracao_fera_primeira'], ['kanao', 'respiracao_flor_percepcao'],
        ['kanae', 'respiracao_flor_percepcao'], ['shinjuro', 'respiracao_chama_nona_forma'],
    ];
    const mestres = base.mestres.map(m => ({ ...m, ensina: [...m.ensina] }));
    for (const [id, arte] of extras) {
        const n = npcs.find(n => n.id === id);
        n.ensinaMestre = `mestre_${id}`;
        mestres.push({ id: n.ensinaMestre, nome: n.nome, localBase: n.localBase, dominio: 'Técnica',
            custo: 'Presença, nível e pré-requisitos da técnica.', ensina: [arte], mecanicaUnica: 'Instrução de respiração', podeMorrer: true });
    }
    mestres.find(m => m.id === 'mestre_tanjiro').ensina.push('hinokami_kagura_danca');
    const criaturas = [...base.criaturas, ...novosOnis].map(c => {
        if (!c.oni)
            return c;
        const perfil = perfis[c.id];
        const perfilOni = {
            identidade: perfil ? c.id : c.chefe ? c.id : undefined,
            arte: perfil?.[1] ?? 'garras', regeneracao: perfil?.[2] ?? .08,
            morte: perfil?.[3] ?? 'nichirin', origem: perfil ? 'canon_adaptado' : 'original',
            parceiro: c.id === 'daki' ? 'lua_superior_seis' : c.id === 'lua_superior_seis' ? 'daki' : undefined,
        };
        return { ...c, nome: perfil?.[0] ?? c.nome, perfilOni, imuneLuz: false,
            // Old prose gave invented identities/arts to canonical rank slots.
            descricao: perfil ? `${perfil[0]} — identidade canônica em uma cronologia alternativa de Vaelhorn. Mecânica de combate adaptada: ${perfil[1]}.` : c.descricao,
            fase2: undefined };
    });
    return { ...base, npcs, mestres, criaturas,
        artes: [...base.artes.filter(a => !exports.artesKimetsu.some(k => k.id === a.id)), ...exports.artesKimetsu],
        itens: [...base.itens, { id: 'dose_glicinia', nome: 'Dose de glicínia', descricao: 'Preparação para técnicas venenosas contra onis.', slot: 'material', peso: .1, valor: 15, raridade: 'notavel', empilhavel: true, lojas: ['capela', 'mansao_ubuyashiki'] }],
        rivalidadesFaccoes: base.rivalidadesFaccoes?.filter(([a, b]) => ![a, b].some(f => ['onis', 'cacadores'].includes(f))),
    };
}
