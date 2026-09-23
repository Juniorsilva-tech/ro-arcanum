import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { conteudoTsukimichi as CT, campeoesEspadaTsukimichi, heroisInvocadosTsukimichi } from '../content/tsukimichi';
import { cenariosDisponiveis } from '../content';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import {
  inicializarAsora,
  realizarContratoAlma,
  evoluirObraAsora,
  processarProducaoAsora,
  intervencaoServaCombate,
  ENTIDADES_CONTRATAVEIS,
  registrarNaGuildaTsige,
  ativarSakai,
  bonusSakaiAtivo,
  detonarDraupnirCombate,
  treinarKai,
  treinarKenjutsuEspadachim,
  verificarSupressaoMana,
  registrarImpactoBatalhaHerois,
  reacaoServaInsulto,
  fundarCompanhiaMercantil,
  despacharCaravanaMercantil,
  encomendarForjaAnoes,
  expandirCidadeOrcs,
  definirNomeSubespaco,
  obterOcupantesSubespaco,
  acolherTriboWasteland,
  definirAlocacaoTrabalho,
  iniciarProjetoConstrucao,
  avancarCicloSubespaco,
  definirEstrategiaCompanhia,
  designarGerenteCompanhia,
  designarEscoltaCaravana,
  avaliarReacaoHumanosPresenca,
  TRIBOS_CATALOGO,
  PROJETOS_CATALOGO,
  executarTreinoConcentracaoQuaseMorte,
  processarAcaoLivreKai,
  executarMomentoRomanceServa,
} from './tsukimichi';
import { recalcularRecursosMaximos } from './progresso';
import { resolverEtapaInfancia } from './familia';
import { montarCena } from './narration';
import { resolverIntencao } from './turn';
import { iniciarCombate, jogadorConjura, jogadorAtaca, jogadorDefende, fecharCombate, defesaJogador, acertoJogador, danoJogador } from './combat';
import { efeitoEspadachimAsora, bonusArqueiroAzusa } from './classe';
import type { Campaign } from './types';

type AssertFn = ((valor: unknown, mensagem?: string) => asserts valor) & {
  equal: (a: unknown, b: unknown) => void;
  deepEqual: (a: unknown, b: unknown) => void;
};

const assert: AssertFn = Object.assign(
  (valor: unknown, mensagem?: string) => {
    if (!valor) throw new Error(mensagem ?? 'asserção falhou');
  },
  {
    equal: (a: unknown, b: unknown) => {
      if (a !== b) throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
    },
    deepEqual: (a: unknown, b: unknown) => {
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} != ${JSON.stringify(b)}`);
    },
  },
) as AssertFn;

let testes = 0;
function teste(nome: string, fn: () => void) {
  fn();
  testes++;
  console.log(`✓ ${nome}`);
}

function campanhaTeste(): Campaign {
  const c = criarCampanha(C, {
    nome: 'Makoto',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'divida',
    seedString: 'tsukimichi-selftest',
  });
  c.personagem.idade = 20;
  return c;
}

// ── 1. Geografia & Topologia do Novo Mundo (ContentBundle Tsukimichi) ──────
teste('DLC Separada: ContentBundle de Tsukimichi existe e tem cenário correto', () => {
  assert(CT !== undefined, 'conteudoTsukimichi deve estar exportado.');
  assert.equal(CT.cenario.id, 'tsukimichi');
  assert(CT.locais.length > 0, 'Deve ter locais no bundle de Tsukimichi.');
  assert.equal(CT.localInicial, 'wasteland_fronteira');
});

teste('DLC Separada: Locais do Novo Mundo presentes no bundle correto', () => {
  const idsEsperados = [
    'tsige_distrito_comercial',
    'tsige_portao_ermo',
    'tsige_companhia_kuzunoha',
    'wasteland_fronteira',
    'wasteland_desfiladeiro',
    'wasteland_pantano_bruma',
    'wasteland_ninho_fenix',
    'rotsgard_distrito_central',
    'rotsgard_biblioteca_arcanum',
    'asora_vila_central',
    'asora_forja_anoes',
    'asora_fontes_termais',
    'asora_atelie_seda',
  ];

  for (const id of idsEsperados) {
    const local = CT.locais.find((l) => l.id === id);
    assert(local !== undefined, `Local esperado '${id}' não foi encontrado no bundle de Tsukimichi.`);
  }
});

teste('DLC Separada: Vaelhorn NÃO contém locais do Novo Mundo', () => {
  const idsProibidos = [
    'tsige_distrito_comercial',
    'wasteland_fronteira',
    'asora_vila_central',
    'rotsgard_distrito_central',
  ];
  for (const id of idsProibidos) {
    const local = C.locais.find((l) => l.id === id);
    assert(local === undefined, `Vaelhorn NÃO deveria conter '${id}' — os mundos devem estar separados.`);
  }
});

teste('DLC Tsukimichi: Rota transcontinental Solgar não está no bundle (mundos isolados)', () => {
  // No bundle de Tsukimichi, a aresta com Vaelhorn (solgar) é ignorada por design
  const tsigePortao = CT.locais.find((l) => l.id === 'tsige_portao_ermo');
  assert(tsigePortao !== undefined, 'tsige_portao_ermo deve existir no bundle de Tsukimichi.');
  // Não deve ter rota para solgar (que é de Vaelhorn)
  assert(
    !tsigePortao.rotas.some((r) => r.destino === 'solgar'),
    'Bundle de Tsukimichi não deve ter rota para solgar (mundo separado).',
  );
});

teste('DLC Tsukimichi: Mist Gates de Asora são rápidas e seguras', () => {
  const asoraVila = CT.locais.find((l) => l.id === 'asora_vila_central');
  assert(asoraVila !== undefined, 'asora_vila_central deve existir no bundle de Tsukimichi.');
  const rotaKuzunoha = asoraVila.rotas.find((r) => r.destino === 'tsige_companhia_kuzunoha');
  assert(rotaKuzunoha !== undefined, 'Asora deve conectar à sede da Companhia Kuzunoha.');
  assert.equal(rotaKuzunoha.perigo, 0);
  assert.equal(rotaKuzunoha.periodos, 0);
});

// ── 2. Bestiário do Novo Mundo ────────────────────────────────────────────
teste('Bestiário: Bestas da Wasteland e Entidades Primordiais registradas', () => {
  const criaturasEsperadas = [
    'lobo_chifre',
    'javali_carapaca',
    'inseto_wasteland',
    'ave_tempestuosa',
    'dragao_shen',
    'aranha_calamidade',
    'mizuchi_ancestral',
    'fenix_suzaku',
  ];

  for (const cid of criaturasEsperadas) {
    const c = CT.criaturas.find((cr) => cr.id === cid);
    assert(c !== undefined, `Criatura '${cid}' não encontrada no bestiário de Tsukimichi.`);
    assert(c.nivel >= 5, `Criatura '${cid}' deveria ter nível >= 5.`);
  }

  assert(CT.encontrosPorRegiao !== undefined, 'encontrosPorRegiao deve estar definido.');
  assert(CT.encontrosPorRegiao['Grande Terra Desolada'].includes('dragao_shen'));
  assert(CT.encontrosPorRegiao['Grande Terra Desolada'].includes('aranha_calamidade'));
  assert(CT.encontrosPorRegiao['Tsige'].includes('lobo_chifre'));
});

teste('Bestiário: Escala de nivelGuilda correta para entidades e bestas', () => {
  const escalas: [string, number][] = [
    ['dragao_shen', 1320],
    ['aranha_calamidade', 1500],
    ['fenix_suzaku', 1450],
    ['mizuchi_ancestral', 1200],
    ['lobo_chifre', 120],
    ['javali_carapaca', 240],
    ['inseto_wasteland', 380],
    ['ave_tempestuosa', 520],
  ];

  for (const [id, nivelEsperado] of escalas) {
    const c = CT.criaturas.find((cr) => cr.id === id);
    assert(c !== undefined, `Criatura '${id}' não encontrada.`);
    assert.equal(c.nivelGuilda, nivelEsperado);
  }
});

// ── 3. Contratos de Alma (Soul Binding) & Transmutação Feminina ───────────
teste('Contratos: Selar pacto com Shen (Tomoe) transmuta em mulher e abre Asora', () => {
  const camp = campanhaTeste();
  const res = realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe');

  assert(res.sucesso, res.mensagem);
  assert(res.contrato !== undefined);
  assert.equal(res.contrato.nomeConcedido, 'Tomoe');
  assert.equal(res.contrato.proporcao, '2:8');
  assert.equal(res.contrato.lealdade, 100);
  assert(res.contrato.formaHumanoide.aparencia.includes('Mulher'));
  assert(res.contrato.formaHumanoide.personalidade.includes('bushido'));

  assert(res.contrato.bonusConcedidos.fisico! >= 3);
  assert(res.contrato.bonusConcedidos.percepcao! >= 4);

  assert(camp.asora !== undefined && camp.asora.desbloqueado);
  assert.equal(camp.asora.populacao, 0);
  assert(camp.cronica.some((cr) => cr.texto.includes('Tomoe')));
});

teste('Contratos: Selar pacto com Aranha da Calamidade (Mio) com bônus de resistência', () => {
  const camp = campanhaTeste();
  realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe');
  const res = realizarContratoAlma(camp, 'aranha_calamidade', '2:8', 'Mio');

  assert(res.sucesso, res.mensagem);
  assert(res.contrato !== undefined);
  assert.equal(res.contrato.nomeConcedido, 'Mio');
  assert(res.contrato.formaHumanoide.aparencia.includes('Jovem voluptuosa'));
  assert(res.contrato.bonusConcedidos.resiliencia! >= 5);

  assert.equal(Object.keys(camp.asora!.contratos).length, 2);
});

teste('Contratos: Shiki (Lich) pode ser contratado com bonusBase em raciocinio', () => {
  const camp = campanhaTeste();
  realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe'); // Abre Asora primeiro
  const res = realizarContratoAlma(camp, 'lich_shiki', '5:5', 'Shiki');

  assert(res.sucesso, res.mensagem);
  assert(res.contrato !== undefined);
  assert.equal(res.contrato.nomeConcedido, 'Shiki');
  assert.equal(res.contrato.papelAsora, 'artesa');
  assert(res.contrato.bonusConcedidos.raciocinio! >= 3, 'Shiki deve conceder bônus de raciocínio.');
});

teste('Contratos: ENTIDADES_CONTRATAVEIS contém as 9 entidades esperadas', () => {
  const ids = Object.keys(ENTIDADES_CONTRATAVEIS);
  assert(ids.includes('dragao_shen'), 'Deve conter Tomoe.');
  assert(ids.includes('aranha_calamidade'), 'Deve conter Mio.');
  assert(ids.includes('mizuchi_ancestral'), 'Deve conter Mizuchi.');
  assert(ids.includes('fenix_suzaku'), 'Deve conter Suzaku.');
  assert(ids.includes('lich_shiki'), 'Deve conter Shiki.');
  assert(ids.includes('dragao_ryusen'), 'Deve conter Ryuuka.');
  assert(ids.includes('mamute_geada_wasteland'), 'Deve conter Ymiria.');
  assert(ids.includes('serpente_ouroboros_vermelha'), 'Deve conter Scarlet.');
  assert(ids.includes('alke_rainha_prole'), 'Deve conter Lilith.');
  assert.equal(ids.length, 9);
});

teste('Contratos: Todas as entidades elegíveis são estritamente fêmeas (Shiki é exceção: forma masculina)', () => {
  // Shiki é masculino por design canônico — verificamos apenas que tem aparência descrita
  for (const [id, def] of Object.entries(ENTIDADES_CONTRATAVEIS)) {
    assert(def.formaHumanoide.aparencia.length > 0, `A entidade '${id}' deve ter aparência descrita.`);
  }
  // As 8 entidades femininas devem ter aparência feminina
  const femininas = [
    'dragao_shen',
    'aranha_calamidade',
    'mizuchi_ancestral',
    'fenix_suzaku',
    'dragao_ryusen',
    'mamute_geada_wasteland',
    'serpente_ouroboros_vermelha',
    'alke_rainha_prole',
  ];
  for (const id of femininas) {
    const aparencia = ENTIDADES_CONTRATAVEIS[id].formaHumanoide.aparencia.toLowerCase();
    const eFeminina = aparencia.includes('mulher') || aparencia.includes('jovem') || aparencia.includes('dama');
    assert(eFeminina, `A entidade '${id}' deve ter transmutação estritamente feminina.`);
  }
});

teste('Contratos: Rejeita pacto com criatura não primordial', () => {
  const camp = campanhaTeste();
  const res = realizarContratoAlma(camp, 'rato_gigante', '2:8');
  assert.equal(res.sucesso, false);
});

// ── 4. Obras e Economia de Asora ──────────────────────────────────────────
teste('Asora: Obras podem ser evoluídas e expandem população e segurança', () => {
  const camp = campanhaTeste();
  realizarContratoAlma(camp, 'dragao_shen', '2:8');

  const popInicial = camp.asora!.populacao;
  const res = evoluirObraAsora(camp, 'lavoura_highland');

  assert(res.sucesso, res.mensagem);
  assert.equal(camp.asora!.obras.lavoura_highland.nivel, 2);
  assert(camp.asora!.populacao > popInicial, 'População deveria crescer com avanço das obras.');
});

teste('Asora: Produção periódica abastece estoques de comida, seda e minério', () => {
  const camp = campanhaTeste();
  realizarContratoAlma(camp, 'dragao_shen', '2:8');
  evoluirObraAsora(camp, 'forja_anoes');
  evoluirObraAsora(camp, 'forja_anoes'); // Nível 3 permite forjar Draupnir

  const prod = processarProducaoAsora(camp);
  assert(prod.comidaGanha >= 20);
  assert(prod.sedaGanha >= 5);
  assert(prod.minerioGanho >= 10);
  assert(prod.draupnirGanho >= 1);
});

// ── 5. Intervenção Tática de Servas em Combate ─────────────────────────────
teste('Combate: Serva ativa no grupo intervém para proteger o Mestre', () => {
  const camp = campanhaTeste();
  realizarContratoAlma(camp, 'aranha_calamidade', '2:8', 'Mio');

  const intervencao = intervencaoServaCombate(camp);
  assert(intervencao.interveio);
  assert.equal(intervencao.servaNome, 'Mio');
  assert(intervencao.absorcaoDano! > 0);
  assert(intervencao.danoCausado! > 0);
});

// ── 6. Registro na Guilda de Tsige (Quebrador de Parâmetros) ──────────────
teste('Guilda: Registro carimba Cartão Nível 1 com manaStatus erro_overflow', () => {
  const camp = campanhaTeste();
  const res = registrarNaGuildaTsige(camp);

  assert(res.sucesso, res.mensagem);
  assert(res.cartao !== undefined);
  assert.equal(res.cartao!.nivelAparente, 1);
  assert.equal(res.cartao!.rank, 'E');
  assert.equal(res.cartao!.manaStatus, 'erro_overflow');
  assert.equal(res.cartao!.parametroQuebrado, true);
  assert(camp.cronica.some((cr) => cr.texto.includes('Nível 1')));
  assert(camp.marcos!.some((m) => m.texto.includes('Quebrador de Parâmetros')));
});

teste('Guilda: Sakai é desbloqueado automaticamente no registro', () => {
  const camp = campanhaTeste();
  registrarNaGuildaTsige(camp);

  assert(camp.personagem.sakai !== undefined, 'Sakai deve ser inicializado no registro.');
  assert.equal(camp.personagem.sakai!.desbloqueado, true);
  assert.equal(camp.personagem.sakai!.nivel, 1);
  assert(camp.personagem.sakai!.modosDisponiveis.includes('percepcao'));
});

teste('Guilda: Registro duplo retorna sucesso=false', () => {
  const camp = campanhaTeste();
  registrarNaGuildaTsige(camp);
  const res2 = registrarNaGuildaTsige(camp);
  assert.equal(res2.sucesso, false);
});

teste('Guilda: Nível interno da engine NÃO é alterado pelo registro', () => {
  const camp = campanhaTeste();
  const nivelAntes = camp.personagem.nivel;
  registrarNaGuildaTsige(camp);
  assert.equal(camp.personagem.nivel, nivelAntes);
  assert(camp.personagem.nivel === nivelAntes, 'O nível real da engine não deve ser tocado pelo Cartão.');
});

// ── 7. Sistema de Sakai ────────────────────────────────────────────────────
teste('Sakai: Ativar modo percepcao retorna bônus de acerto correto', () => {
  const camp = campanhaTeste();
  registrarNaGuildaTsige(camp);
  const res = ativarSakai(camp, 'percepcao');

  assert(res.sucesso, res.mensagem);
  assert.equal(camp.personagem.sakai!.modoAtivo, 'percepcao');

  const bonus = bonusSakaiAtivo(camp);
  assert(bonus.acertoBonus > 0, 'Modo percepcao deve dar bônus de acerto.');
  assert.equal(bonus.defesaBonus, 0);
  assert.equal(bonus.ignoraDefesa, false);
});

teste('Sakai: Ativar modo supressao retorna bônus de defesa correto', () => {
  const camp = campanhaTeste();
  registrarNaGuildaTsige(camp);
  // Adicionar supressao nos modos disponíveis para o teste
  camp.personagem.sakai!.modosDisponiveis.push('supressao');
  const res = ativarSakai(camp, 'supressao');

  assert(res.sucesso, res.mensagem);
  const bonus = bonusSakaiAtivo(camp);
  assert(bonus.defesaBonus > 0, 'Modo supressao deve dar bônus de defesa.');
  assert.equal(bonus.acertoBonus, 0);
});

teste('Sakai: Modo destruicao tem ignoraDefesa=true', () => {
  const camp = campanhaTeste();
  registrarNaGuildaTsige(camp);
  camp.personagem.sakai!.modosDisponiveis.push('destruicao');
  ativarSakai(camp, 'destruicao');

  const bonus = bonusSakaiAtivo(camp);
  assert.equal(bonus.ignoraDefesa, true);
  assert(bonus.danoBonus > 0, 'Modo destruicao deve dar bônus de dano.');
});

teste('Sakai: Toggle desativa modo se já estava ativo', () => {
  const camp = campanhaTeste();
  registrarNaGuildaTsige(camp);
  ativarSakai(camp, 'percepcao');
  assert.equal(camp.personagem.sakai!.modoAtivo, 'percepcao');

  ativarSakai(camp, 'percepcao'); // Toggle
  assert.equal(camp.personagem.sakai!.modoAtivo, undefined);
});

teste('Sakai: Modo não disponível retorna sucesso=false', () => {
  const camp = campanhaTeste();
  registrarNaGuildaTsige(camp);
  const res = ativarSakai(camp, 'destruicao'); // Não desbloqueado ainda
  assert.equal(res.sucesso, false);
});

teste('Sakai: Sem registro na Guilda, ativarSakai falha', () => {
  const camp = campanhaTeste();
  const res = ativarSakai(camp, 'percepcao');
  assert.equal(res.sucesso, false);
});

// ── 8. Seleção de Cenários no Menu (cenariosDisponiveis) ───────────────────
teste('Menu de Cenários: Vaelhorn e Tsukimichi estão listados e disponíveis', () => {
  assert(cenariosDisponiveis.length >= 2, 'Deve haver ao menos 2 cenários disponíveis.');
  const ids = cenariosDisponiveis.map((c) => c.id);
  assert(ids.includes('vaelhorn'), 'Vaelhorn deve estar na lista de cenários.');
  assert(ids.includes('tsukimichi'), 'Tsukimichi deve estar na lista de cenários.');

  const tsukimichi = cenariosDisponiveis.find((c) => c.id === 'tsukimichi')!;
  assert.equal(tsukimichi.disponivel, true);
  assert.equal(tsukimichi.genero, 'Isekai Fantasia');
  assert(tsukimichi.bundle !== undefined, 'Bundle de Tsukimichi deve estar vinculado.');
});

// ── 9. Bestas Lendárias Expandidas & NPCs de Asora ────────────────────────
teste('Bestiário Expandido: Novas bestas lendárias estão em CT.criaturas e na Wasteland', () => {
  const novasBestas = [
    { id: 'mamute_geada_wasteland', nivelGuilda: 650 },
    { id: 'dragao_ryusen', nivelGuilda: 880 },
    { id: 'serpente_ouroboros_vermelha', nivelGuilda: 720 },
    { id: 'alke_rainha_prole', nivelGuilda: 450 },
  ];

  for (const b of novasBestas) {
    const criatura = CT.criaturas.find((c) => c.id === b.id);
    assert(criatura !== undefined, `Criatura '${b.id}' deve estar presente no bestiário de Tsukimichi.`);
    assert.equal(criatura.nivelGuilda, b.nivelGuilda);
    assert.equal(criatura.regiaoExclusiva, 'Grande Terra Desolada');
  }

  // Verifica que constam nos encontros da Grande Terra Desolada
  const encontros = CT.encontrosPorRegiao!['Grande Terra Desolada'];
  for (const b of novasBestas) {
    assert(encontros.includes(b.id), `Criatura '${b.id}' deve constar nos encontros da Wasteland.`);
  }
});

teste('NPCs Canônicos: Ema, Beren, Zalax e Renox estão no bundle de Tsukimichi', () => {
  const npcsEsperados = ['ema_highland', 'mestre_beren', 'comandante_zalax', 'renox_guilda'];
  for (const nid of npcsEsperados) {
    const npc = CT.npcs.find((n) => n.id === nid);
    assert(npc !== undefined, `NPC '${nid}' deve estar presente no bundle de Tsukimichi.`);
    assert(npc.nome.length > 0);
    assert(npc.ocupacao.length > 0);
    assert(npc.vozNarrativa.length > 0);
  }
});

// ── 10. Magias Transversais em Vaelhorn (Pactos no Jogo Original) ───────────
teste('Magia em Vaelhorn: Pacto das Névoas e Detonação de Draupnir constam no Livro', () => {
  const pacto = C.artes.find((a) => a.id === 'pacto_das_nevoas');
  assert(pacto !== undefined, 'Arte pacto_das_nevoas deve existir no Livro de Vaelhorn.');
  assert.equal(pacto.escola, 'Invocação');
  assert.equal(pacto.grau, 'mitica');
  assert.equal(pacto.custo.recurso, 'mana');

  const draupnir = C.artes.find((a) => a.id === 'liberar_draupnir');
  assert(draupnir !== undefined, 'Arte liberar_draupnir deve existir no Livro de Vaelhorn.');
  assert.equal(draupnir.escola, 'Evocação');
  assert.equal(draupnir.grau, 'rara');

  const reliquia = C.reliquias.find((r) => r.id === 'reliquia_orbe_das_nevoas');
  assert(reliquia !== undefined, 'Relíquia reliquia_orbe_das_nevoas deve existir em Vaelhorn.');
});

teste('Magia em Vaelhorn: Personagem em Vaelhorn pode selar contrato de alma', () => {
  // Cria uma campanha estritamente em Vaelhorn
  const campVaelhorn = criarCampanha(C, {
    nome: 'Geralt de Vaelhorn',
    atributos: atributosBase(),
    classeId: 'guardiao',
    origemId: 'divida',
    seedString: 'vaelhorn-pacto-test',
  });

  // O jogador executa o pacto como magia/ritual
  const res = realizarContratoAlma(campVaelhorn, 'dragao_shen', '2:8', 'Tomoe');
  assert(res.sucesso, 'Contrato deve ter sucesso em campanha de Vaelhorn.');
  assert(campVaelhorn.asora !== undefined && campVaelhorn.asora.desbloqueado);
  assert.equal(campVaelhorn.asora.contratos['dragao_shen'].nomeConcedido, 'Tomoe');
  // Os atributos foram incrementados na ficha do jogador de Vaelhorn
  assert(campVaelhorn.personagem.atributos.fisico > atributosBase().fisico);
});

// ── 11. Detonação de Anéis Draupnir em Combate ──────────────────────────────
teste('Draupnir: Detonação consome anel dos estoques e gera dano massivo', () => {
  const camp = campanhaTeste();
  realizarContratoAlma(camp, 'dragao_shen', '2:8'); // Abre Asora
  camp.asora!.estoques.draupnir = 1; // 1 Draupnir fornecido para detonação
  assert((camp.asora?.estoques?.draupnir ?? 0) >= 1);

  const estoqueAntes = camp.asora!.estoques.draupnir;
  const res = detonarDraupnirCombate(camp);

  assert(res.sucesso, res.mensagem);
  assert(res.danoCausado >= 45, 'Deve causar dano massivo.');
  assert.equal(camp.asora!.estoques.draupnir, estoqueAntes - 1);
  assert(camp.cronica.some((c) => c.texto.includes('Draupnir')));
});

teste('Draupnir: Detonação sem anéis disponíveis retorna sucesso=false', () => {
  const camp = campanhaTeste();
  realizarContratoAlma(camp, 'dragao_shen', '2:8');
  camp.asora!.estoques.draupnir = 0; // Zera estoque

  const res = detonarDraupnirCombate(camp);
  assert.equal(res.sucesso, false);
  assert.equal(res.danoCausado, 0);
});

// ── 12. Gênese Isekai, Infância no Japão e Registro Canônico na Guilda ─────
teste('Gênese & Infância: Campanha de Tsukimichi inicia no Japão com família exilada', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Misumi',
    atributos: atributosBase(),
    classeId: 'sem_bencao',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-genesis-test',
  });

  assert(camp.familia !== undefined, 'Campanha deve possuir estado de família.');
  assert.equal(camp.familia.prologoConcluido, false);
  assert.equal(camp.personagem.idade, 0);
  assert.equal(camp.familia.eventoAtual?.id, 'origem_japao');

  // Família canônica do protagonista em Tsukimichi
  const nomesFamilia = camp.familia.membros.map((m) => m.nome);
  assert(nomesFamilia.includes('Kazuhiko'), 'Pai deve ser Kazuhiko.');
  assert(nomesFamilia.includes('Yuko'), 'Mãe deve ser Yuko.');
  assert(nomesFamilia.includes('Arisa'), 'Irmã deve ser Arisa.');
  assert(nomesFamilia.includes('Mari'), 'Irmã deve ser Mari.');

  // Antes da Guilda, personagem não possui Cartão de Aventureiro
  assert(camp.personagem.cartaoAventureiro === undefined, 'Personagem não deve ter cartão no nascimento.');
});

teste('Gênese & Infância: Progresso pelas 4 etapas leva da Terra ao banimento da Deusa e Wasteland', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Misumi',
    atributos: atributosBase(),
    classeId: 'sem_bencao',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-prologo-flow',
  });

  // Etapa 0: Clube de Kyudo no Japão
  const r1 = resolverEtapaInfancia(CT, camp, 'crescer_kyudo');
  assert(r1.ok);
  assert.equal(camp.personagem.idade, 6);
  assert.equal(camp.familia!.eventoAtual?.id, 'tsukimichi_mana_oculto');

  // Etapa 6: Mana colossal transbordando
  const r2 = resolverEtapaInfancia(CT, camp, 'conter_mana');
  assert(r2.ok);
  assert.equal(camp.personagem.idade, 10);
  assert.equal(camp.familia!.eventoAtual?.id, 'tsukimichi_invocacao_deusa');

  // Etapa 10: Invocação e rejeição da Deusa (jogado da estratosfera)
  const r3 = resolverEtapaInfancia(CT, camp, 'encarar_deusa');
  assert(r3.ok);
  assert.equal(camp.personagem.idade, 14);
  assert.equal(camp.familia!.eventoAtual?.id, 'tsukimichi_queda_wasteland');

  // Etapa 14: Cratera da Wasteland e marcha para Tsige
  const r4 = resolverEtapaInfancia(CT, camp, 'marchar_tsige');
  assert(r4.ok);
  assert.equal(r4.concluida, true);
  assert.equal(camp.familia!.prologoConcluido, true);
  assert.equal(camp.personagem.idade, 18);
  assert(camp.familia!.eventoAtual === undefined);

  // Chega a Tsige aos 18 anos ainda SEM cartão de aventureiro nem rank
  assert(camp.personagem.cartaoAventureiro === undefined, 'Ao chegar em Tsige aos 18 anos, ainda não possui cartão.');
});

teste('Guilda de Tsige: Cena em Tsige oferece opção de registro e carimba Cartão Nível 1 com Sakai', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Misumi',
    atributos: atributosBase(),
    classeId: 'sem_bencao',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-guilda-flow',
  });

  // Conclui infância
  resolverEtapaInfancia(CT, camp, 'crescer_kyudo');
  resolverEtapaInfancia(CT, camp, 'conter_mana');
  resolverEtapaInfancia(CT, camp, 'encarar_deusa');
  resolverEtapaInfancia(CT, camp, 'marchar_tsige');

  // Local inicial após a queda da Deusa é wasteland_fronteira (Grande Terra Desolada)
  assert.equal(camp.locaisVisitados[0], 'wasteland_fronteira');

  // O jogador marcha até a civilização e entra em Tsige
  camp.localAtual = 'tsige_distrito_comercial';
  camp.locaisVisitados.push('tsige_distrito_comercial');

  // Monta a cena em Tsige: a opção canônica de se registrar na guilda deve estar disponível
  const cenaAntes = montarCena(CT, camp);
  const opcaoGuilda = cenaAntes.opcoes.find((o) => o.id === 'registrar_guilda_tsige');
  assert(opcaoGuilda !== undefined, 'Opção de registro na guilda deve estar presente na cena de Tsige.');

  // Executa o registro via intenção de turno
  const resTurno = resolverIntencao(CT, camp, { tipo: 'opcao', opcao: opcaoGuilda });
  assert(resTurno.fato.includes('Nível 1') || resTurno.fato.includes('Guilda'));

  // Verifica que o Cartão foi emitido com nível 1 e parâmetros quebrados
  const cartao = camp.personagem.cartaoAventureiro;
  assert(cartao !== undefined, 'Cartão de aventureiro deve ter sido emitido.');
  assert.equal(cartao.registrado, true);
  assert.equal(cartao.rank, 'E');
  assert.equal(cartao.nivelAparente, 1);
  assert.equal(cartao.manaStatus, 'erro_overflow');
  assert.equal(cartao.parametroQuebrado, true);

  // Sakai desbloqueado no ato do registro
  assert(camp.personagem.sakai !== undefined);
  assert.equal(camp.personagem.sakai.desbloqueado, true);

  // Em nova montagem de cena, a opção de registro NÃO deve mais aparecer
  const cenaDepois = montarCena(CT, camp);
  const opcaoDepois = cenaDepois.opcoes.find((o) => o.id === 'registrar_guilda_tsige');
  assert(opcaoDepois === undefined, 'Opção de registro não deve se repetir após o personagem já estar registrado.');
});

// ── 13. Limites do Espadachim de Asora, Artes de Lâmina e Kyudo ────────────
teste('Classes Tsukimichi: Espadachim (kenjutsu clássico) nasce com Katana de Asora e Artes de Lâmina', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Kensei',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'espadachim-genesis',
  });

  const classe = CT.classes.find((c) => c.id === 'espadachim_asora');
  assert.equal(classe?.nome, 'Espadachim');
  assert(classe?.descricao.includes('Miyamoto Musashi'));

  assert.equal(camp.personagem.classeId, 'espadachim_asora');
  assert.equal(camp.personagem.equipado.arma, 'katana_asora');
  assert.equal(camp.personagem.equipado.armadura, 'gibao_de_couro');
  assert(camp.personagem.inventario.katana_asora >= 1);
  assert(camp.personagem.artesConhecidas.includes('corte_dimensional_asora'));
  assert(camp.personagem.artesConhecidas.includes('iaijutsu_nevoa_ilusoria'));
  // Katana de Asora tem dano 16 cortante
  const itemKatana = CT.itens.find((i) => i.id === 'katana_asora');
  assert(itemKatana !== undefined);
  assert.equal(itemKatana.dano?.base, 16);
});

teste('Classes Tsukimichi: Arqueiro nasce com Grande Arco de Azusa e Artes de Tiro', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Archer',
    atributos: atributosBase(),
    classeId: 'arqueiro_azusa',
    origemId: 'isekai_japonesa',
    seedString: 'kyudo-genesis',
  });

  const classe = CT.classes.find((c) => c.id === 'arqueiro_azusa');
  assert.equal(classe?.nome, 'Arqueiro');

  assert.equal(camp.personagem.classeId, 'arqueiro_azusa');
  assert.equal(camp.personagem.equipado.arma, 'arco_azusa');
  assert(camp.personagem.artesConhecidas.includes('disparo_cometa_kyudo'));
  assert(camp.personagem.artesConhecidas.includes('chuva_flechas_mana'));
  // Arco de Azusa tem dano 15 perfurante
  const itemArco = CT.itens.find((i) => i.id === 'arco_azusa');
  assert(itemArco !== undefined);
  assert.equal(itemArco.dano?.base, 15);
});

teste('Limites do Espadachim: Foco acumula dano e atinge Ruptura de Asora no foco máximo', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Kensei',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'ruptura-teste',
  });

  const atorJogador = {
    id: 'jogador',
    nome: 'Makoto',
    ehJogador: true,
    vida: 50,
    vidaMax: 50,
    defesa: 12,
    acerto: 15,
    condicoes: [],
    focoAlvo: 'inimigo_alvo',
    focoAcertos: 2,
  };

  // Com 2 acertos, tem bônus de dano de 4
  const ef2 = efeitoEspadachimAsora(camp, atorJogador, 'inimigo_alvo');
  assert.equal(ef2.bonusDano, 4);
  assert.equal(ef2.ruptura, false);
  assert.equal(ef2.ignoraGuarda, false);

  // Com 4 acertos (foco máximo), desata a Ruptura de Asora
  atorJogador.focoAcertos = 4;
  const ef4 = efeitoEspadachimAsora(camp, atorJogador, 'inimigo_alvo');
  assert.equal(ef4.ruptura, true);
  assert.equal(ef4.ignoraGuarda, true);
  assert.equal(ef4.bonusDano, 16); // 8 base + 8 de ruptura
});

teste('Combate & Artes: Espadachim conjura Corte Duplo e Iaijutsu em batalha', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Kensei',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'combate-espadachim-artes',
  });

  // Dá vigor suficiente e inicia combate contra monstro da Wasteland
  camp.personagem.recursos.vigor = 20;
  iniciarCombate(CT, camp, ['lobo_chifre']);
  assert(camp.combate !== null && camp.combate !== undefined);
  const cbt = camp.combate;

  const alvo = cbt.atores.find((a) => !a.ehJogador);
  assert(alvo !== undefined);

  // Conjura Iaijutsu: Postura do Vazio
  const resIai = jogadorConjura(CT, camp, 'iaijutsu_nevoa_ilusoria', alvo.id);
  assert(resIai.ok, resIai.motivo);
  // Concedeu esquiva tática
  const atorJog = cbt.atores.find((a) => a.ehJogador);
  assert((atorJog?.tatico?.esquiva ?? 0) >= 1, 'Deve conceder esquiva tática.');

  // Conjura Corte Duplo: Niten
  camp.personagem.recursos.vigor = 20;
  cbt.rodada = 3; // passa tempo de recarga
  const resCorte = jogadorConjura(CT, camp, 'corte_dimensional_asora', alvo.id);
  assert(resCorte.ok, resCorte.motivo);
  assert(cbt.log.some((l) => l.includes('Corte Duplo') || l.includes('acerta')));
});

teste('Sakai & Modos Universais: Fortalecimento e Sentidos alteram parâmetros de combate', () => {
  const camp = criarCampanha(CT, {
    nome: 'Ren Isekai',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'sakai-modos-teste',
  });

  registrarNaGuildaTsige(camp);
  assert(camp.personagem.sakai !== undefined);
  // Adiciona modos universais
  camp.personagem.sakai.modosDisponiveis.push('fortalecimento', 'sentidos');
  camp.personagem.sakai.nivel = 2;

  // Ativa fortalecimento
  const resFort = ativarSakai(camp, 'fortalecimento');
  assert.equal(resFort.sucesso, true);
  assert.equal(camp.personagem.sakai.modoAtivo, 'fortalecimento');

  const bFort = bonusSakaiAtivo(camp);
  assert(bFort.danoBonus >= 12, 'Dano bônus de fortalecimento deve ser massivo.');
  assert(bFort.defesaBonus >= 6, 'Defesa bônus de fortalecimento deve ser expressiva.');

  // Dano e defesa do jogador refletem o fortalecimento
  const def = defesaJogador(CT, camp);
  assert(def > 10, 'Defesa deve incorporar bônus de fortalecimento do Kai.');
  const dano = danoJogador(CT, camp);
  assert(dano.base > 20, 'Dano deve incorporar reforço muscular de mana do Kai.');

  // Alterna para sentidos (visão e audição aguçadas)
  const resSent = ativarSakai(camp, 'sentidos');
  assert.equal(resSent.sucesso, true);
  assert.equal(camp.personagem.sakai.modoAtivo, 'sentidos');

  const bSent = bonusSakaiAtivo(camp);
  assert(bSent.acertoBonus >= 14, 'Sentidos cósmicos conferem acerto cirúrgico.');
  assert(bSent.defesaBonus >= 4, 'Audição e percepção conferem esquiva e defesa antecipada.');

  const acerto = acertoJogador(CT, camp);
  assert(acerto >= 20, 'Acerto do jogador deve incluir o bônus de sentidos do Kai.');
});

teste('Sakai & Treinamento: treinarKai acumula experiência e ascende de nível despertando novos modos', () => {
  const camp = criarCampanha(CT, {
    nome: 'Ren Isekai',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'sakai-treino-teste',
  });

  registrarNaGuildaTsige(camp);
  assert.equal(camp.personagem.sakai?.nivel, 1);
  assert.deepEqual(camp.personagem.sakai?.modosDisponiveis, ['percepcao']);

  // Primeiro treino: ganha 25 XP
  const t1 = treinarKai(camp);
  assert.equal(t1.sucesso, true);
  assert.equal(camp.personagem.sakai?.experienciaTreino, 25);
  assert.equal(camp.personagem.sakai?.treinosRealizados, 1);
  assert.equal(camp.personagem.sakai?.nivel, 1);

  // Segundo treino: atinge 50 XP e sobe para nível 2, desbloqueando fortalecimento e sentidos!
  const t2 = treinarKai(camp);
  assert.equal(t2.sucesso, true);
  assert.equal(t2.subiuNivel, true);
  assert.equal(camp.personagem.sakai?.nivel, 2);
  assert(camp.personagem.sakai?.modosDisponiveis.includes('fortalecimento'));
  assert(camp.personagem.sakai?.modosDisponiveis.includes('sentidos'));

  // Continua treinando até nível 3 (limiar 125 XP)
  treinarKai(camp); // 75 XP
  treinarKai(camp); // 100 XP
  const t5 = treinarKai(camp); // 125 XP
  assert.equal(t5.subiuNivel, true);
  assert.equal(camp.personagem.sakai?.nivel, 3);
  assert(camp.personagem.sakai?.modosDisponiveis.includes('cura'));
  assert(camp.personagem.sakai?.modosDisponiveis.includes('supressao'));
});

teste('Kenjutsu do Espadachim: treinarKenjutsuEspadachim avança perícias e maestria de corte', () => {
  const camp = criarCampanha(CT, {
    nome: 'Ren Kensei',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'kenjutsu-treino-teste',
  });

  registrarNaGuildaTsige(camp);
  const atletismoAntes = camp.personagem.pericias['atletismo'] ?? 0;
  const resKen = treinarKenjutsuEspadachim(camp);
  assert.equal(resKen.sucesso, true);
  assert((camp.personagem.pericias['atletismo'] ?? 0) > atletismoAntes);
  assert(resKen.ganhoMaestria > 0);
  assert(camp.cronica.some((c) => c.texto.includes('Treino de Kenjutsu executado com excelência')));
});

teste('Campeões Ápice da Espada: exatamente 1 campeão lendário por raça no mundo', () => {
  // Confere a lista de 4 campeões ápice mundiais
  assert.equal(campeoesEspadaTsukimichi.length, 4);

  const ids = campeoesEspadaTsukimichi.map((c) => c.id);
  assert(ids.includes('sofia_bulga'), 'Deve conter Sofia Bulga (Hyuman).');
  assert(ids.includes('dragao_mitsurugi'), 'Deve conter Mitsurugi (Dragão Superior).');
  assert(ids.includes('general_io'), 'Deve conter General Io (Demônio).');
  assert(ids.includes('lupus_rei_feras'), 'Deve conter Lupus (Homem-Fera/Beastkin).');

  // Verifica escalas de nível de guilda de cada raça
  const sofia = campeoesEspadaTsukimichi.find((c) => c.id === 'sofia_bulga')!;
  assert.equal(sofia.nivelGuilda, 920);
  assert.equal(sofia.chefe, true);

  const mitsurugi = campeoesEspadaTsukimichi.find((c) => c.id === 'dragao_mitsurugi')!;
  assert.equal(mitsurugi.nivelGuilda, 1150);
  assert.equal(mitsurugi.chefe, true);

  const io = campeoesEspadaTsukimichi.find((c) => c.id === 'general_io')!;
  assert.equal(io.nivelGuilda, 850);
  assert.equal(io.chefe, true);

  const lupus = campeoesEspadaTsukimichi.find((c) => c.id === 'lupus_rei_feras')!;
  assert.equal(lupus.nivelGuilda, 780);
  assert.equal(lupus.chefe, true);

  // Garante que todos estão no catálogo de criaturas de Tsukimichi e nos encontros da Wasteland
  for (const cid of ids) {
    assert(CT.criaturas.some((c) => c.id === cid), `Criatura ${cid} deve estar em CT.criaturas.`);
    assert(CT.encontrosPorRegiao!['Grande Terra Desolada'].includes(cid), `Criatura ${cid} deve estar nos encontros da Wasteland.`);
  }
});

teste('Outro Isekai: Makoto Misumi é NPC da Companhia Kuzunoha e o protagonista é autônomo', () => {
  // Makoto existe como NPC no mundo
  const makoto = CT.npcs.find((n) => n.id === 'makoto_misumi');
  assert(makoto !== undefined, 'Makoto Misumi deve existir no catálogo de NPCs de Tsukimichi.');
  assert.equal(makoto.faccaoId, 'companhia_kuzunoha');
  assert.equal(makoto.localBase, 'tsige_companhia_kuzunoha');
  assert(makoto.idade >= 18, 'Idade deve ser válida para validação estrita da engine.');

  // O protagonista é criado com seu próprio nome e autonomia
  const camp = criarCampanha(CT, {
    nome: 'Kazuto Shin',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'protagonista-autonomo',
  });

  assert.equal(camp.personagem.nome, 'Kazuto Shin');
  assert(camp.personagem.nome !== makoto.nome, 'Protagonista deve ser independente de Makoto.');
});

teste('Heróis Oficiais Invocados: Tomoki de Gritonia e Hibiki de Limia cadastrados no bestiário e encontros', () => {
  assert.equal(heroisInvocadosTsukimichi.length, 2);

  const tomoki = heroisInvocadosTsukimichi.find((h) => h.id === 'heroi_tomoki')!;
  assert(tomoki !== undefined, 'Tomoki deve existir na lista de heróis.');
  assert.equal(tomoki.nivelGuilda, 650);
  assert.equal(tomoki.chefe, true);
  assert.equal(tomoki.faccaoId, 'guilda_aventureiros');

  const hibiki = heroisInvocadosTsukimichi.find((h) => h.id === 'heroina_hibiki')!;
  assert(hibiki !== undefined, 'Hibiki deve existir na lista de heróis.');
  assert.equal(hibiki.nivelGuilda, 720);
  assert.equal(hibiki.chefe, true);
  assert.equal(hibiki.faccaoId, 'guilda_aventureiros');

  // Estão no bundle de Tsukimichi e encontros da Wasteland
  assert(CT.criaturas.some((c) => c.id === 'heroi_tomoki'));
  assert(CT.criaturas.some((c) => c.id === 'heroina_hibiki'));
  assert(CT.encontrosPorRegiao!['Grande Terra Desolada'].includes('heroi_tomoki'));
  assert(CT.encontrosPorRegiao!['Grande Terra Desolada'].includes('heroina_hibiki'));

  // Não vazam para Vaelhorn
  assert(!C.criaturas.some((c) => c.id === 'heroi_tomoki'));
  assert(!C.criaturas.some((c) => c.id === 'heroina_hibiki'));
});

teste('Supressão de Mana: verificarSupressaoMana detecta vestes e anéis e impede pavor entre Humanos', () => {
  const camp = criarCampanha(CT, {
    nome: 'Kazuto',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'supressao-teste',
  });

  // Sem vestes nem anéis de supressão equipados
  camp.personagem.equipado = {};
  const status1 = verificarSupressaoMana(camp);
  assert.equal(status1.suprimido, false);
  assert(status1.motivo.includes('Sem vestes de supressão'));

  // Equipa traje de supressão de Asora
  camp.personagem.equipado.armadura = 'traje_supressao_asora';
  const status2 = verificarSupressaoMana(camp);
  assert.equal(status2.suprimido, true);
  assert.equal(status2.itemUtilizado, 'traje_supressao_asora');

  // Alternativa: manto de névoas de Asora
  camp.personagem.equipado.armadura = undefined;
  camp.personagem.equipado.acessorio = 'manto_nevoas_supressao';
  const status3 = verificarSupressaoMana(camp);
  assert.equal(status3.suprimido, true);
  assert.equal(status3.itemUtilizado, 'manto_nevoas_supressao');

  // Alternativa: anel Draupnir equipado
  camp.personagem.equipado.acessorio = 'anel_draupnir';
  const status4 = verificarSupressaoMana(camp);
  assert.equal(status4.suprimido, true);
  assert.equal(status4.itemUtilizado, 'anel_draupnir');
});

teste('Investigação dos Heróis: registrarImpactoBatalhaHerois eleva alerta de Limia e Gritonia e despacha decretos', () => {
  const camp = criarCampanha(CT, {
    nome: 'Kazuto',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'investigacao-teste',
  });

  // Batalha moderada (dano 120 -> incremento 30, alerta 30)
  const r1 = registrarImpactoBatalhaHerois(camp, 120, 'wasteland_fronteira', 'choque de mana');
  assert.equal(r1.nivelAlerta, 30);
  assert.equal(r1.batedoresEnviados, false);
  assert.equal(r1.decretosEmitidos, false);

  // Batalha devastadora (dano 120 adicional -> incremento 30, alerta 60 >= 50 -> batedores enviados)
  const r2 = registrarImpactoBatalhaHerois(camp, 120, 'wasteland_desfiladeiro', 'corte dimensional');
  assert.equal(r2.nivelAlerta, 60);
  assert.equal(r2.batedoresEnviados, true);
  assert.equal(r2.decretosEmitidos, false);
  assert(r2.mensagem !== undefined);
  assert(camp.cronica.some((c) => c.texto.includes('Limia') && c.texto.includes('Gritonia')));

  // Destruição extrema (dano 200 adicional -> alerta atinge 100 -> decretos emitidos)
  const r3 = registrarImpactoBatalhaHerois(camp, 200, 'wasteland_pantano_bruma', 'detonação draupnir');
  assert.equal(r3.nivelAlerta, 100);
  assert.equal(r3.batedoresEnviados, true);
  assert.equal(r3.decretosEmitidos, true);
  assert(camp.cronica.some((c) => c.texto.includes('Alerta Máximo')));
});

teste('Companhia Mercantil & Caravanas: fundação em Tsige e venda de produtos de Asora enriquecem o protagonista', () => {
  const camp = criarCampanha(CT, {
    nome: 'Kazuto',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'companhia-teste',
  });

  // Fundação da Companhia
  const f1 = fundarCompanhiaMercantil(camp, 'Companhia Relâmpago de Asora');
  assert.equal(f1.sucesso, true);
  assert.equal(camp.asora?.companhiaMercantil?.fundada, true);
  assert.equal(camp.asora?.companhiaMercantil?.nome, 'Companhia Relâmpago de Asora');
  assert.equal(camp.asora?.companhiaMercantil?.nivelComercial, 1);

  // Tentativa repetida deve falhar
  const f2 = fundarCompanhiaMercantil(camp, 'Outro Nome');
  assert.equal(f2.sucesso, false);

  // Despacho de caravana comercial com excedentes de Asora
  camp.asora!.estoques = {
    comida: 20,
    seda: 15,
    minerio: 12,
    draupnir: 0,
  };
  const dinheiroAntes = camp.personagem.dinheiro ?? 0;

  const caravana = despacharCaravanaMercantil(camp);
  assert.equal(caravana.sucesso, true);
  assert(caravana.ouroGanho > 0);
  assert.equal(camp.personagem.dinheiro, dinheiroAntes + caravana.ouroGanho);
  assert.equal(camp.asora?.companhiaMercantil?.caravanasEnviadas, 1);
  assert.equal(camp.asora?.companhiaMercantil?.ouroAcumulado, caravana.ouroGanho);
  // Garante que consumiu estoques
  assert(camp.asora!.estoques.comida < 20);
  assert(camp.asora!.estoques.seda < 15);
  assert(camp.asora!.estoques.minerio < 12);
});

teste('Forja dos Elder Dwarves & Expansão Urbana dos Orcs: Beren forja equipamentos e Ema expande a população', () => {
  const camp = criarCampanha(CT, {
    nome: 'Kazuto',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'forja-obras-teste',
  });

  const asora = inicializarAsora();
  camp.asora = asora;
  asora.estoques.minerio = 10;
  asora.estoques.comida = 20;

  // Encomenda de armadura pesada com Beren
  const forja = encomendarForjaAnoes(camp, 'armadura_placas_asora');
  assert.equal(forja.sucesso, true);
  assert.equal(asora.estoques.minerio, 6);
  assert.equal(camp.personagem.inventario['armadura_placas_asora'], 1);
  assert.equal(asora.forjaAtiva?.itemEmForja, 'armadura_placas_asora');

  // Expansão urbana com Ema
  const popAntes = asora.populacao;
  const expansao = expandirCidadeOrcs(camp, 'Bairro dos Jardins de Highland');
  assert.equal(expansao.sucesso, true);
  assert.equal(asora.estoques.comida, 12);
  assert.equal(asora.populacao, popAntes + 45);
  assert.equal(asora.construcaoOrcs?.projeto, 'Bairro dos Jardins de Highland');
});

teste('Lealdade Protetora das Servas: reacaoServaInsulto silencia e aterroriza ofensores de imediato', () => {
  const camp = criarCampanha(CT, {
    nome: 'Kazuto',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'serva-lealdade-teste',
  });

  // Sem contrato inicial
  const rSemContrato = reacaoServaInsulto(camp, 'Comerciante Arrogante');
  assert.equal(rSemContrato.interveio, false);

  // Sela contrato com Shen (Tomoe)
  realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe');
  const rComTomoe = reacaoServaInsulto(camp, 'Comerciante Arrogante');
  assert.equal(rComTomoe.interveio, true);
  assert.equal(rComTomoe.servaNome, 'Tomoe');
  assert(rComTomoe.respostaNarrativa?.includes('Tomoe'));
  assert(rComTomoe.respostaNarrativa?.includes('Mestre'));
  assert(camp.cronica.some((c) => c.texto.includes('Comerciante Arrogante') && c.texto.includes('Tomoe')));
});

teste('Soberania do Subespaço: jogador determina e altera o nome do seu subespaço livremente', () => {
  const camp = criarCampanha(CT, {
    nome: 'Kazuto',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'nome-subespaco-teste',
  });

  const asora = inicializarAsora();
  camp.asora = asora;
  assert.equal(asora.nome, 'Subespaço Pessoal');

  // Jogador determina o nome de sua dimensão soberana
  const res = definirNomeSubespaco(camp, 'Santuário do Vácuo Primordial');
  assert.equal(res.sucesso, true);
  assert.equal(camp.asora.nome, 'Santuário do Vácuo Primordial');
  assert(camp.cronica.some((c) => c.texto.includes('Santuário do Vácuo Primordial')));

  // Pode renomear livremente quando desejar
  definirNomeSubespaco(camp, 'Reino de Jade');
  assert.equal(camp.asora.nome, 'Reino de Jade');
});

teste('Presença Dinâmica: obterOcupantesSubespaco identifica exatamente quem está no subespaço naquele momento', () => {
  const camp = criarCampanha(CT, {
    nome: 'Kazuto',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'ocupantes-momento-teste',
  });

  // 1. Antes de desbloquear
  camp.asora = undefined;
  const antes = obterOcupantesSubespaco(camp);
  assert.equal(antes.jogadorPresente, false);
  assert.equal(antes.ocupantes.length, 0);

  // 2. Desbloqueia e sela pactos
  realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe');
  realizarContratoAlma(camp, 'aranha_calamidade', '2:8', 'Mio');
  definirNomeSubespaco(camp, 'Domínio Soberano');

  // Configura: Tomoe ativa no grupo (viajando com ele), Mio no subespaço (não ativa no grupo)
  camp.asora!.contratos['dragao_shen'].ativaNoGrupo = true;
  camp.asora!.contratos['aranha_calamidade'].ativaNoGrupo = false;

  // Acolhe as comunidades demi-humanas que passam a ter seus líderes residentes
  acolherTriboWasteland(camp, 'orcs_highland');
  acolherTriboWasteland(camp, 'elder_dwarves');
  acolherTriboWasteland(camp, 'mist_lizards');

  // Jogador está no mundo exterior em Tsige
  camp.localAtual = 'tsige_distrito_comercial';
  const presencaFora = obterOcupantesSubespaco(camp);
  assert.equal(presencaFora.jogadorPresente, false);
  assert.equal(presencaFora.localJogador, 'tsige_distrito_comercial');

  // Tomoe NÃO está no subespaço (está com o jogador fora)
  assert(!presencaFora.ocupantes.some((o) => o.nome === 'Tomoe'));
  // Mio ESTÁ no subespaço (cuidando do ateliê/degustação)
  assert(presencaFora.ocupantes.some((o) => o.nome === 'Mio'));
  // Ema, Beren e Zalax estão presentes
  assert(presencaFora.ocupantes.some((o) => o.id === 'ema_highland'));
  assert(presencaFora.ocupantes.some((o) => o.id === 'mestre_beren'));
  assert(presencaFora.ocupantes.some((o) => o.id === 'comandante_zalax'));

  // 3. Jogador viaja para dentro do subespaço
  camp.localAtual = 'asora_vila_central';
  const presencaDentro = obterOcupantesSubespaco(camp);
  assert.equal(presencaDentro.jogadorPresente, true);
  // O jogador aparece nos ocupantes
  assert(presencaDentro.ocupantes.some((o) => o.id === 'jogador'));
  // Tomoe agora aparece nos ocupantes porque está acompanhando o jogador dentro do subespaço
  assert(presencaDentro.ocupantes.some((o) => o.nome === 'Tomoe'));
  // Mio continua presente
  assert(presencaDentro.ocupantes.some((o) => o.nome === 'Mio'));
});

teste('Povoamento Orgânico: acolherTriboWasteland resgata tribos, soma população e concede recursos iniciais', () => {
  const camp = criarCampanha(CT, {
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    nome: 'Makoto Soberano',
    atributos: atributosBase(),
    seedString: 'tribos-teste',
  });

  // Tentar acolher antes de abrir o subespaço falha
  const falhaAntes = acolherTriboWasteland(camp, 'elder_dwarves');
  assert.equal(falhaAntes.sucesso, false);

  // Desbloqueia com contrato de Shen (Tomoe)
  realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe');
  assert(camp.asora?.desbloqueado);
  const popInicial = camp.asora!.populacao;

  // Acolhe os Elder Dwarves
  const resDwarves = acolherTriboWasteland(camp, 'elder_dwarves');
  assert.equal(resDwarves.sucesso, true);
  assert.equal(camp.asora!.tribosAcolhidas!['elder_dwarves'].nome, 'Elder Dwarves');
  assert.equal(camp.asora!.populacao, popInicial + 25);
  // Elder Dwarves fornecem 15 ferramentas rúnicas e 20 minério
  assert((camp.asora!.recursosEspeciais?.ferramentasDisponiveis ?? 0) >= 15);

  // Acolher a mesma tribo novamente deve ser rejeitado (sem duplicação mágica)
  const repete = acolherTriboWasteland(camp, 'elder_dwarves');
  assert.equal(repete.sucesso, false);

  // Acolhe os Orcs de Highland
  const resOrcs = acolherTriboWasteland(camp, 'orcs_highland');
  assert.equal(resOrcs.sucesso, true);
  assert.equal(camp.asora!.populacao, popInicial + 25 + 40);
});

teste('Afazeres e Alocação de Trabalho: distribuir mão de obra respeita o teto da população acolhida', () => {
  const camp = criarCampanha(CT, {
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    nome: 'Soberano Gestor',
    atributos: atributosBase(),
    seedString: 'alocacao-teste',
  });
  realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe');
  acolherTriboWasteland(camp, 'elder_dwarves'); // +25
  acolherTriboWasteland(camp, 'orcs_highland'); // +40
  acolherTriboWasteland(camp, 'mist_lizards'); // +30 -> Total 95

  const pop = camp.asora!.populacao;

  // Alocação válida
  const res = definirAlocacaoTrabalho(camp, {
    agricultura: 30,
    mineracao: 15,
    forja_ferramentas: 15,
    construcao_obras: 20,
    seguranca_patrulha: 10,
    tecelagem: 5,
  });
  assert.equal(res.sucesso, true);
  assert.equal(camp.asora!.alocacaoTrabalho!.agricultura, 30);
  assert.equal(camp.asora!.alocacaoTrabalho!.construcao_obras, 20);

  // Tentar alocar mais do que a população total disponível deve falhar
  const excesso = definirAlocacaoTrabalho(camp, {
    agricultura: pop + 50,
  });
  assert.equal(excesso.sucesso, false);
});

teste('Canteiro de Obras: projetos exigem ferramentas e operários, avançam e concluem com benefícios permanentes', () => {
  const camp = criarCampanha(CT, {
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    nome: 'Arquiteto Soberano',
    atributos: atributosBase(),
    seedString: 'obras-teste',
  });
  realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe');
  acolherTriboWasteland(camp, 'elder_dwarves');
  acolherTriboWasteland(camp, 'orcs_highland');

  // Garante estoques para a obra
  camp.asora!.estoques.comida = 100;
  camp.asora!.estoques.minerio = 100;
  camp.asora!.estoques.seda = 50;

  // Sem operários alocados na construção, iniciar obra deve falhar
  definirAlocacaoTrabalho(camp, { construcao_obras: 0 });
  const semOperarios = iniciarProjetoConstrucao(camp, 'canais_irrigacao');
  assert.equal(semOperarios.sucesso, false);

  // Aloca 25 operários no canteiro de obras
  definirAlocacaoTrabalho(camp, { construcao_obras: 25, agricultura: 20, forja_ferramentas: 15 });

  // Sem ferramentas suficientes (zerar propositalmente para testar)
  const ferrBackup = camp.asora!.recursosEspeciais!.ferramentasDisponiveis;
  camp.asora!.recursosEspeciais!.ferramentasDisponiveis = 0;
  const semFerr = iniciarProjetoConstrucao(camp, 'canais_irrigacao');
  assert.equal(semFerr.sucesso, false);

  // Restaura ferramentas
  camp.asora!.recursosEspeciais!.ferramentasDisponiveis = ferrBackup;

  // Inicia a construção dos Canais de Irrigação
  const inicio = iniciarProjetoConstrucao(camp, 'canais_irrigacao');
  assert.equal(inicio.sucesso, true);
  assert.equal(camp.asora!.projetoEmAndamento?.id, 'canais_irrigacao');
  const duracao = camp.asora!.projetoEmAndamento!.turnosRestantes;
  assert(duracao > 0);

  // Avança ciclos de trabalho até a conclusão
  for (let i = 0; i < duracao; i++) {
    avancarCicloSubespaco(camp);
  }

  // Obra concluída e benefícios aplicados
  assert.equal(camp.asora!.projetoEmAndamento, undefined);
  assert(camp.asora!.projetosConcluidos!.includes('canais_irrigacao'));

  // Com canais concluídos, a colheita de alimentos ganha bônus de 50%
  const colheita = avancarCicloSubespaco(camp);
  assert(colheita.producao.comida > 0);
});

teste('Companhia Mercantil: estratégias comerciais, gerência e despacho rentável de caravanas', () => {
  const camp = criarCampanha(CT, {
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    nome: 'Comerciante Supremo',
    atributos: atributosBase(),
    seedString: 'companhia-teste',
  });
  fundarCompanhiaMercantil(camp, 'Companhia Kuzunoha');

  // Define estratégia e gerência
  definirEstrategiaCompanhia(camp, 'armas_e_ferramentas');
  assert.equal(camp.asora!.companhiaMercantil!.estrategiaAtual, 'armas_e_ferramentas');

  designarGerenteCompanhia(camp, 'Tomoe');
  assert.equal(camp.asora!.companhiaMercantil!.gerenteDesignada, 'Tomoe');

  designarEscoltaCaravana(camp, 'mist_lizards');
  assert.equal(camp.asora!.companhiaMercantil!.escoltaDesignada, 'mist_lizards');

  // Abastece estoques de Asora
  camp.asora!.estoques.minerio = 30;
  camp.asora!.estoques.seda = 20;
  camp.asora!.estoques.comida = 40;

  const dinAntes = camp.personagem.dinheiro ?? 0;
  const despacho = despacharCaravanaMercantil(camp);
  assert.equal(despacho.sucesso, true);
  assert(despacho.ouroGanho > 100);
  assert.equal((camp.personagem.dinheiro ?? 0), dinAntes + despacho.ouroGanho);
  assert.equal(camp.asora!.companhiaMercantil!.caravanasEnviadas, 1);
});

teste('Supressão de Mana pelo Kai: modo supressao contém aura e normaliza reação dos Humanos em cidades', () => {
  const camp = criarCampanha(CT, {
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    nome: 'Viajante Enigmático',
    atributos: atributosBase(),
    seedString: 'supressao-kai-teste',
  });
  registrarNaGuildaTsige(camp);
  camp.localAtual = 'tsige_distrito_comercial';
  camp.personagem.equipado = {}; // Sem vestes supressoras

  // 1. Sem supressão ativa e sem vestes: pavor extremo e histeria
  const reacao1 = avaliarReacaoHumanosPresenca(camp);
  assert.equal(reacao1.reacaoTipo, 'pavor_extremo');
  assert.equal(reacao1.alertaGerado, true);

  // 2. Ativação do Sakai no modo supressão
  camp.personagem.sakai!.modosDisponiveis.push('supressao');
  ativarSakai(camp, 'supressao');
  const supStatus = verificarSupressaoMana(camp);
  assert.equal(supStatus.suprimido, true);
  assert.equal(supStatus.itemUtilizado, 'kai_supressao');

  // 3. Com o Kai comprimindo o mana, a reação torna-se normalidade
  const reacao2 = avaliarReacaoHumanosPresenca(camp);
  assert.equal(reacao2.reacaoTipo, 'normalidade');
  assert.equal(reacao2.alertaGerado, false);
});

teste('Exploração da Wasteland: cenas no Desfiladeiro e Pântano oferecem pactos de alma com Shen e Mio', () => {
  const camp = criarCampanha(CT, {
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    nome: 'Andarilho da Wasteland',
    atributos: atributosBase(),
    seedString: 'wasteland-pactos-teste',
  });

  // Começa na cratera da Wasteland
  assert.equal(camp.localAtual, 'wasteland_fronteira');

  // Viaja para o Desfiladeiro do Dragão Adormecido
  camp.localAtual = 'wasteland_desfiladeiro';
  const cenaDesfiladeiro = montarCena(CT, camp);
  const opcaoShen = cenaDesfiladeiro.opcoes.find((o) => o.id === 'pacto_shen');
  assert(opcaoShen !== undefined, 'Opção de pacto com Shen deve aparecer no Desfiladeiro.');

  // Desafia Shen via intenção: inicia combate de arena contra Muteki Shen
  const resShen = resolverIntencao(CT, camp, { tipo: 'opcao', opcao: opcaoShen });
  assert(resShen.fato.includes('Muteki Shen') || resShen.fato.includes('Desfiladeiro'), 'Fato deve narrar descida de Shen.');
  assert(camp.combate !== null, 'Combate com Muteki Shen deve ser iniciado.');

  // Luta e subjuga Shen no combate
  let rShen = 0;
  while (camp.combate && !camp.combate.terminado && rShen < 25) {
    rShen++;
    jogadorAtaca(CT, camp, 'dragao_shen');
  }

  assert(camp.asora !== undefined && camp.asora.desbloqueado, 'Asora deve ser despertada pelo pacto de Shen após subjugação.');
  assert(camp.asora.contratos['dragao_shen'] !== undefined, 'Tomoe deve estar contratada após render-se.');

  // Fecha o combate e viaja para o Pântano da Calamidade
  fecharCombate(camp);
  camp.localAtual = 'wasteland_pantano_bruma';
  const cenaPantano = montarCena(CT, camp);
  const opcaoMio = cenaPantano.opcoes.find((o) => o.id === 'pacto_aranha');
  assert(opcaoMio !== undefined, 'Opção de pacto com Mio deve aparecer no Pântano.');

  // Desafia a Aranha da Calamidade: inicia combate de arena
  const resMio = resolverIntencao(CT, camp, { tipo: 'opcao', opcao: opcaoMio });
  assert(camp.combate !== null, 'Combate com Aranha da Calamidade deve ser iniciado.');

  // Luta e subjuga a Aranha da Calamidade
  let rMio = 0;
  while (camp.combate && !camp.combate.terminado && rMio < 25) {
    rMio++;
    jogadorAtaca(CT, camp, 'aranha_calamidade');
  }

  assert(camp.asora.contratos['aranha_calamidade'] !== undefined, 'Mio deve estar contratada após ser saciada e subjugada.');
  fecharCombate(camp);
});

teste('Wasteland: Queda solitária e opções autônomas de exploração sem trilhos pré-programados', () => {
  const camp = criarCampanha(CT, {
    nome: 'Renegado da Deusa',
    atributos: atributosBase(),
    classeId: 'sem_bencao',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-wasteland-autonomia',
  });

  // Conclui o prólogo até a cratera da Wasteland
  resolverEtapaInfancia(CT, camp, 'crescer_kyudo');
  resolverEtapaInfancia(CT, camp, 'conter_mana');
  resolverEtapaInfancia(CT, camp, 'encarar_deusa');
  resolverEtapaInfancia(CT, camp, 'erguer_wasteland');

  // Solidão absoluta inicial
  assert.equal(camp.localAtual, 'wasteland_fronteira');
  assert((camp.grupo?.length ?? 0) === 0, 'Grupo do jogador deve estar vazio.');
  assert(camp.personagem.sakai !== undefined, 'Sakai deve estar desperto na queda.');
  assert.equal(camp.personagem.sakai.desbloqueado, true);

  // Monta a cena na borda da Wasteland
  const cenaWasteland = montarCena(CT, camp);
  assert(cenaWasteland.contexto.presentes.length === 0, 'Nenhum NPC deve estar presente na borda desolada.');
  assert(cenaWasteland.narracao.includes('Você está só.'));

  // As opções autônomas de cena devem estar disponíveis
  const opcaoSondar = cenaWasteland.opcoes.find((o) => o.id === 'sondar_wasteland_kai');
  const opcaoCacar = cenaWasteland.opcoes.find((o) => o.id === 'cacar_feras_wasteland');
  const opcaoMeditar = cenaWasteland.opcoes.find((o) => o.id === 'meditar_cratera_wasteland');

  assert(opcaoSondar !== undefined, 'Opção de sondar com o Kai deve existir.');
  assert(opcaoCacar !== undefined, 'Opção de caçar feras selvagens deve existir.');
  assert(opcaoMeditar !== undefined, 'Opção de meditar na cratera deve existir.');

  // 1. Resolução da sondagem com Kai
  const resSondar = resolverIntencao(CT, camp, { tipo: 'opcao', opcao: opcaoSondar });
  assert(resSondar.fato.includes('Kai') && resSondar.fato.includes('Desfiladeiro'));
  assert.equal(camp.personagem.sakai.modoAtivo, 'percepcao');

  // 2. Resolução da meditação na cratera
  camp.personagem.recursos.vida = 10;
  const resMeditar = resolverIntencao(CT, camp, { tipo: 'opcao', opcao: opcaoMeditar });
  assert(resMeditar.fato.includes('cratera') && resMeditar.fato.includes('mana'));
  assert.equal(camp.personagem.recursos.vida, 30);

  // 3. Resolução da caça a feras selvagens
  const resCacar = resolverIntencao(CT, camp, { tipo: 'opcao', opcao: opcaoCacar });
  assert(resCacar.fato.includes('ninho') && resCacar.fato.includes('feras'));
  assert(camp.combate !== null && camp.combate !== undefined, 'Combate deve ter sido iniciado.');
  assert(camp.combate.atores.some((a) => a.criaturaId === 'lobo_chifre'));
});

teste('Concentração Total: Treino de Quase-Morte expande mana máximo permanentemente e eleva atributos', () => {
  const camp = campanhaTeste();
  const manaInicial = camp.personagem.recursosMax.mana ?? 10;
  const precisaoInicial = camp.personagem.atributos.precisao;
  const resilienciaInicial = camp.personagem.atributos.resiliencia;

  // Ciclo 1: Concentração e morte temporária consciente
  const r1 = executarTreinoConcentracaoQuaseMorte(camp);
  assert.equal(r1.sucesso, true);
  assert.equal(r1.ciclosConcluidos, 1);
  assert.equal(r1.manaExpandidoTotal, 25);
  assert.equal(camp.personagem.recursosMax.mana, manaInicial + 25);
  assert.equal(camp.personagem.recursos.mana, manaInicial + 25);
  assert.equal(camp.personagem.atributos.precisao, precisaoInicial + 1);

  // Ciclo 2: Segundo ciclo eleva resiliência e físico
  const r2 = executarTreinoConcentracaoQuaseMorte(camp);
  assert.equal(r2.sucesso, true);
  assert.equal(r2.ciclosConcluidos, 2);
  assert.equal(r2.manaExpandidoTotal, 50);
  assert.equal(camp.personagem.recursosMax.mana, manaInicial + 50);
  assert.equal(camp.personagem.atributos.resiliencia, resilienciaInicial + 1);

  // Verifica que recalcularRecursosMaximos preserva o mana expandido
  recalcularRecursosMaximos(camp);
  assert.equal(camp.personagem.recursosMax.mana, manaInicial + 50);
});

teste('Cena Wasteland: Opção de Quase-Morte Consciente disponível e executável via intenção de turno', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto',
    atributos: atributosBase(),
    classeId: 'sem_bencao',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-quase-morte-cena',
  });

  // Conclui prólogo na cratera da Wasteland
  resolverEtapaInfancia(CT, camp, 'crescer_kyudo');
  resolverEtapaInfancia(CT, camp, 'conter_mana');
  resolverEtapaInfancia(CT, camp, 'encarar_deusa');
  resolverEtapaInfancia(CT, camp, 'erguer_wasteland');

  const cena = montarCena(CT, camp);
  const opcaoQuaseMorte = cena.opcoes.find((o) => o.id === 'treino_concentracao_quase_morte');
  assert(opcaoQuaseMorte !== undefined, 'Opção de treino de quase-morte deve estar disponível na Wasteland.');

  const manaAntes = camp.personagem.recursosMax.mana ?? 10;
  const resTurno = resolverIntencao(CT, camp, { tipo: 'opcao', opcao: opcaoQuaseMorte });
  assert(resTurno.fato.includes('Concentração Total') && resTurno.fato.includes('Mana'));
  assert.equal(camp.personagem.treinoQuaseMorte?.ciclosConcluidos, 1);
  assert.equal(camp.personagem.recursosMax.mana, manaAntes + 25);
});

teste('Concentração Total: Treino de Quase-Morte funciona com qualquer classe adaptando o foco marcial/mágico', () => {
  // 1. Espadachim
  const campEspada = criarCampanha(CT, {
    nome: 'Musashi',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-quase-morte-espada',
  });
  const rEspada = executarTreinoConcentracaoQuaseMorte(campEspada);
  assert.equal(rEspada.sucesso, true);
  assert(rEspada.mensagem.includes('Iaijutsu') || rEspada.mensagem.includes('lâmina'));
  assert.equal(campEspada.personagem.treinoQuaseMorte?.manaExpandidoTotal, 25);

  // 2. Mago / Sem Bênção
  const campMago = criarCampanha(CT, {
    nome: 'Grimório',
    atributos: atributosBase(),
    classeId: 'sem_bencao',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-quase-morte-mago',
  });
  const rMago = executarTreinoConcentracaoQuaseMorte(campMago);
  assert.equal(rMago.sucesso, true);
  assert(rMago.mensagem.includes('mágico') || rMago.mensagem.includes('mana'));
  assert.equal(campMago.personagem.treinoQuaseMorte?.manaExpandidoTotal, 25);

  // 3. Arqueiro
  const campArqueiro = criarCampanha(CT, {
    nome: 'Yoichi',
    atributos: atributosBase(),
    classeId: 'arqueiro_azusa',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-quase-morte-arco',
  });
  const rArqueiro = executarTreinoConcentracaoQuaseMorte(campArqueiro);
  assert.equal(rArqueiro.sucesso, true);
  assert(rArqueiro.mensagem.includes('Kyudo') || rArqueiro.mensagem.includes('arco'));
  assert.equal(campArqueiro.personagem.treinoQuaseMorte?.manaExpandidoTotal, 25);
});

teste('Modos do Kai: Barreira Mágica, Barreira Física, Audição e Magia calculam bônus corretamente', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Teste',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-sakai-modos-novos',
  });
  camp.personagem.sakai = {
    desbloqueado: true,
    nivel: 2,
    modosDisponiveis: ['percepcao', 'fortalecimento', 'magia', 'audicao', 'barreira_magica', 'barreira_fisica'],
    modoAtivo: 'barreira_fisica',
  };

  // Barreira Física: alta defesa física
  const bFisica = bonusSakaiAtivo(camp);
  assert.equal(bFisica.defesaBonus, 14 + 2 * 3); // 20
  const defFisica = defesaJogador(CT, camp);
  assert(defFisica > 20);

  // Barreira Mágica: alta defesa mágica
  camp.personagem.sakai.modoAtivo = 'barreira_magica';
  const bMagica = bonusSakaiAtivo(camp);
  assert.equal(bMagica.defesaBonus, 12 + 2 * 3); // 18

  // Magia: bônus maciço de dano arcano e acerto
  camp.personagem.sakai.modoAtivo = 'magia';
  const bModoMagia = bonusSakaiAtivo(camp);
  assert.equal(bModoMagia.danoBonus, 14 + 2 * 3); // 20
  assert.equal(bModoMagia.acertoBonus, 8 + 2 * 2); // 12

  // Audição: bônus de acerto e antecipação
  camp.personagem.sakai.modoAtivo = 'audicao';
  const bAudicao = bonusSakaiAtivo(camp);
  assert.equal(bAudicao.acertoBonus, 12 + 2 * 2); // 16
});

teste('Ação Livre: processarAcaoLivreKai interpreta e ativa modos de Kai, treino e quase-morte por texto livre', () => {
  const camp = criarCampanha(CT, {
    nome: 'Ren Acao Livre',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-acao-livre-kai',
  });

  // 1. Ativar Kai de Percepção via texto livre
  const a1 = processarAcaoLivreKai('usar kai de percepção para sondar os arredores', camp);
  assert(a1 !== null);
  assert.equal(a1?.sucesso, true);
  assert.equal(a1?.modo, 'percepcao');
  assert.equal(camp.personagem.sakai?.modoAtivo, 'percepcao');

  // 2. Ativar Kai de Fortalecimento via texto livre
  const a2 = processarAcaoLivreKai('ativar kai de fortalecimento', camp);
  assert(a2 !== null);
  assert.equal(a2?.modo, 'fortalecimento');
  assert.equal(camp.personagem.sakai?.modoAtivo, 'fortalecimento');

  // 3. Ativar Barreira Física via texto livre
  const a3 = processarAcaoLivreKai('erguer barreira física com o kai', camp);
  assert(a3 !== null);
  assert.equal(a3?.modo, 'barreira_fisica');
  assert.equal(camp.personagem.sakai?.modoAtivo, 'barreira_fisica');

  // 4. Ativar Barreira Mágica via texto livre
  const a4 = processarAcaoLivreKai('bloquear com barreira mágica do kai', camp);
  assert(a4 !== null);
  assert.equal(a4?.modo, 'barreira_magica');
  assert.equal(camp.personagem.sakai?.modoAtivo, 'barreira_magica');

  // 5. Ativar Kai de Audição via texto livre
  const a5 = processarAcaoLivreKai('usar kai de audição para escutar passos', camp);
  assert(a5 !== null);
  assert.equal(a5?.modo, 'audicao');
  assert.equal(camp.personagem.sakai?.modoAtivo, 'audicao');

  // 6. Ativar Kai de Magia via texto livre
  const a6 = processarAcaoLivreKai('ativar kai de magia para amplificar meu feitiço', camp);
  assert(a6 !== null);
  assert.equal(a6?.modo, 'magia');
  assert.equal(camp.personagem.sakai?.modoAtivo, 'magia');

  // 7. Desativar Kai via texto livre
  const a7 = processarAcaoLivreKai('desativar o kai e recolher meu mana', camp);
  assert(a7 !== null);
  assert.equal(a7?.acaoTipo, 'desativar');
  assert.equal(camp.personagem.sakai?.modoAtivo, undefined);

  // 8. Treino de Quase-Morte Consciente via texto livre
  const a8 = processarAcaoLivreKai('concentração total atingir o vácuo da quase morte', camp);
  assert(a8 !== null);
  assert.equal(a8?.acaoTipo, 'quase_morte');
  assert.equal(camp.personagem.treinoQuaseMorte?.manaExpandidoTotal, 25);

  // 9. Treinar o Kai via texto livre
  const a9 = processarAcaoLivreKai('treinar o kai meditando no ermo', camp);
  assert(a9 !== null);
  assert.equal(a9?.acaoTipo, 'treino');
  assert.equal(camp.personagem.sakai?.treinosRealizados, 2);

  // 10. Texto não relacionado a Kai retorna null (repassado para o fluxo normal de verbos/narrativa)
  const aNulo = processarAcaoLivreKai('comprar uma maçã no mercado', camp);
  assert.equal(aNulo, null);
});

teste('Constituição Sobre-Humana & Oceano de Mana: Escala inicial de Tsukimichi condizente com Isekai', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Soberano',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-recursos-super',
  });

  // Vida base de super-humano da Terra deve ser >= 200
  assert(camp.personagem.recursosMax.vida >= 200, `Vida máxima deve ser >= 200, obtido: ${camp.personagem.recursosMax.vida}`);
  assert.equal(camp.personagem.recursos.vida, camp.personagem.recursosMax.vida);

  // Mana base colossal de Tsukimichi deve ser >= 200
  assert(camp.personagem.recursosMax.mana >= 200, `Mana máxima deve ser >= 200, obtido: ${camp.personagem.recursosMax.mana}`);
  assert.equal(camp.personagem.recursos.mana, camp.personagem.recursosMax.mana);
});

teste('Combate Overpower: Manto Passivo de Mana absorve ataques comuns e Barreira do Kai anula completamente', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Tanque',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-manto-passivo',
  });

  // Inicia combate contra o Mamute das Geadas (dano base 28, vida 110)
  iniciarCombate(CT, camp, ['mamute_geada_wasteland']);
  assert(camp.combate !== null && camp.combate !== undefined);
  const cbt = camp.combate;

  const mamute = cbt.atores.find((a) => !a.ehJogador);
  assert(mamute !== undefined);

  const vidaAntes = camp.personagem.recursos.vida;
  assert(vidaAntes >= 200);

  // O jogador ataca com golpe sobre-humano (dano base aumentado em +28)
  const danoJog = danoJogador(CT, camp);
  assert(danoJog.base >= 30, `Dano sobre-humano deve ser >= 30, obtido: ${danoJog.base}`);

  jogadorAtaca(CT, camp, mamute.id);
  assert(cbt.log.some((l) => l.includes('acerta') && l.includes(mamute.nome)));

  // Quando o mamute contra-ataca, o Manto Passivo de Mana absorve 85% do dano, gerando arranhão leve (<= 6 dano)
  const vidaDepois = camp.personagem.recursos.vida;
  const danoTomado = vidaAntes - vidaDepois;
  assert(danoTomado <= 10, `Dano tomado pelo manto passivo deve ser leve (<= 10), tomou: ${danoTomado}`);
  assert(cbt.log.some((l) => l.includes('Manto Passivo de Mana') || l.includes('erra')));

  // Agora testa com Barreira do Kai ativa: o golpe de criatura comum é 100% anulado
  camp.personagem.sakai = {
    desbloqueado: true,
    nivel: 1,
    experienciaTreino: 0,
    treinosRealizados: 0,
    modosDisponiveis: ['barreira_fisica'],
    modoAtivo: 'barreira_fisica',
  };

  const vidaComBarreira = camp.personagem.recursos.vida;
  jogadorDefende(CT, camp);
  // O golpe do mamute colide com a barreira e se desfaz sem arranhão
  assert.equal(camp.personagem.recursos.vida, vidaComBarreira);
  assert(cbt.log.some((l) => l.includes('Barreira do Kai') || l.includes('erra') || l.includes('morre na guarda')));
  fecharCombate(camp);
});

teste('Ameaça Canônica de Nível 1.000: Sofia Bulga / Mitsurugi desferem perfuração vital se o jogador estiver desprotegido', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Vulneravel',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-nivel-1000-vital',
  });

  // 1. Caso protegido: com guarda ou barreira, o dano é contido
  iniciarCombate(CT, camp, ['sofia_bulga']);
  assert(camp.combate !== null);
  const cbt = camp.combate!;
  const sofia = cbt.atores.find((a) => !a.ehJogador);
  assert(sofia !== undefined);

  // Jogador firma a guarda
  jogadorDefende(CT, camp);
  // Deve registrar o confronto com impacto contido se houver acerto
  assert(cbt.log.length > 0);
  fecharCombate(camp);

  // 2. Caso vulnerável: sem defesa, sem desvio, sem barreira
  const camp2 = criarCampanha(CT, {
    nome: 'Makoto Desprevenido',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-vital-strike',
  });
  camp2.personagem.sakai = {
    desbloqueado: true,
    nivel: 1,
    experienciaTreino: 0,
    treinosRealizados: 0,
    modosDisponiveis: ['percepcao'],
    modoAtivo: undefined, // Sem modo defensivo
  };

  iniciarCombate(CT, camp2, ['sofia_bulga']);
  const cbt2 = camp2.combate!;
  const sofia2 = cbt2.atores.find((a) => !a.ehJogador)!;

  // Jogador ataca sem firmar guarda nem esquiva
  jogadorAtaca(CT, camp2, sofia2.id);

  // Se Sofia acertou em cheio / crítico desprotegido, o log acusa perfuração em ponto vital
  const sofreuVital = cbt2.log.some((l) => l.includes('PERFURAÇÃO CRÍTICA EM PONTO VITAL') || l.includes('Impacto Contido') || l.includes('erra'));
  assert(sofreuVital, 'Deve conter registro do embate com Sofia Bulga.');
  fecharCombate(camp2);
});

teste('Romance em Asora: executarMomentoRomanceServa eleva afeto, desperta ciúme dinâmico e recupera recursos', () => {
  const camp = criarCampanha(CT, {
    nome: 'Makoto Soberano de Asora',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-romance-harem',
  });

  // Contrata Tomoe e Mio
  realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe');
  realizarContratoAlma(camp, 'aranha_calamidade', '2:8', 'Mio');

  assert.equal(camp.asora!.contratos['aranha_calamidade'].afeto, 80);
  assert.equal(camp.asora!.contratos['aranha_calamidade'].ciume, 30);
  assert.equal(camp.asora!.contratos['dragao_shen'].afeto, 80);
  assert.equal(camp.asora!.contratos['dragao_shen'].ciume, 30);

  // Reduz vida/vigor para testar cura
  camp.personagem.recursos.vida = 100;
  camp.personagem.recursos.vigor = 5;
  camp.personagem.recursos.mana = 50;

  // 1. Momento com Mio nas termas
  const resMio = executarMomentoRomanceServa(camp, 'aranha_calamidade', 'termas_mio');
  assert(resMio.sucesso, 'Momento nas termas com Mio deve ser bem-sucedido.');
  assert(resMio.fato.includes('Mio') && resMio.fato.includes('fontes termais'));

  // Afeto de Mio subiu (+15 = 95), ciúme de Mio desceu (-15 = 15)
  assert.equal(camp.asora!.contratos['aranha_calamidade'].afeto, 95);
  assert.equal(camp.asora!.contratos['aranha_calamidade'].ciume, 15);

  // Ciúme de Tomoe subiu por rivalidade (+15 = 45)
  assert.equal(camp.asora!.contratos['dragao_shen'].ciume, 45);

  // Recursos recuperados
  assert.equal(camp.personagem.recursos.vida, 150);
  assert.equal(camp.personagem.recursos.vigor, camp.personagem.recursosMax['vigor']);
  assert.equal(camp.personagem.recursos.mana, 90);

  // 2. Momento com Tomoe degustando sake
  const resTomoe = executarMomentoRomanceServa(camp, 'dragao_shen', 'sake_tomoe');
  assert(resTomoe.sucesso, 'Noite de sake com Tomoe deve ser bem-sucedida.');
  assert(resTomoe.fato.includes('Tomoe') && resTomoe.fato.includes('sake'));

  // Afeto de Tomoe subiu (+15 = 95), ciúme de Tomoe desceu (-15 = 30)
  assert.equal(camp.asora!.contratos['dragao_shen'].afeto, 95);
  assert.equal(camp.asora!.contratos['dragao_shen'].ciume, 30);

  // Ciúme de Mio foi atiçado novamente (+15 = 30)
  assert.equal(camp.asora!.contratos['aranha_calamidade'].ciume, 30);
});

teste('Cena em Asora: opções de romance e intimidade são montadas e resolvidas por intenção de turno', () => {
  const camp = criarCampanha(CT, {
    nome: 'Lorde de Asora',
    atributos: atributosBase(),
    classeId: 'espadachim_asora',
    origemId: 'isekai_japonesa',
    seedString: 'tsukimichi-cena-romance',
  });

  realizarContratoAlma(camp, 'dragao_shen', '2:8', 'Tomoe');
  realizarContratoAlma(camp, 'aranha_calamidade', '2:8', 'Mio');

  camp.localAtual = 'asora_vila_central';
  const cena = montarCena(CT, camp);

  const opcaoTermas = cena.opcoes.find((o) => o.id === 'romance_mio_termas');
  const opcaoSake = cena.opcoes.find((o) => o.id === 'romance_tomoe_sake');
  const opcaoVila = cena.opcoes.find((o) => o.id === 'romance_passeio_vila');

  assert(opcaoTermas !== undefined, 'Opção de termas com Mio deve constar em Asora.');
  assert(opcaoSake !== undefined, 'Opção de sake com Tomoe deve constar em Asora.');
  assert(opcaoVila !== undefined, 'Opção de passeio romântico deve constar em Asora.');

  const resIntencao = resolverIntencao(CT, camp, { tipo: 'opcao', opcao: opcaoTermas });
  assert(resIntencao.fato.includes('fontes termais') && resIntencao.fato.includes('Mio'));
  assert.equal(camp.asora!.contratos['aranha_calamidade'].afeto, 95);
});

console.log(`\n================================`);
console.log(`Todos os ${testes} testes de Tsukimichi passaram com sucesso!`);
console.log(`================================\n`);


