// Selftest automatizado para engine/reino.ts
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import type { Campaign } from './types';
import {
  obterFeudo,
  fundarFeudo,
  identificarBiomaLocal,
  PONTOS_DE_ASSENTAMENTO,
  iniciarObraFeudo,
  avancarObrasFeudo,
  despacharCaravanaFeudo,
  definirRotaPatrulhaFeudo,
  processarCicloReino,
  obterTierReinoInfo,
  fundarCasaDinastica,
  nomearConselheiro,
  removerConselheiro,
  recrutarOficial,
  promoverOficial,
  designarMissaoOficial,
  treinarOficiais,
  celebrarCasamento,
  iniciarGestacao,
  darLuzHerdeiro,
  designarHerdeiroAparente,
  concederFeudoVassalo,
  convocarLevasVassalos,
  convocarAssembleiaGuerra,
  firmarTratadoPaz,
  iniciarTramaUsurpacao,
} from './reino';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const novaCampanha = (local = 'taverna'): Campaign => {
  const camp = criarCampanha(C, {
    nome: 'Senhor do Feudo',
    atributos: atributosBase(),
    classeId: C.classes[0].id,
    origemId: 'divida',
    seedString: 'reino_test',
    marcaInfancia: 'comum',
    reacaoInfancia: 'apoio',
  });
  if (camp.familia) camp.familia.prologoConcluido = true;
  camp.localAtual = local;
  camp.personagem.dinheiro = 500;
  return camp;
};

console.log('Iniciando testes de assentamento e reino (engine/reino.ts)...');

// 1. Identificação correta de biomas e catálogo de pontos de assentamento
ok(identificarBiomaLocal('solgar_oasis', 'Ermo de Solgar') === 'deserto', 'Solgar identifica deserto');
ok(identificarBiomaLocal('tessel_posto', 'Marca de Tessel') === 'montanha', 'Tessel identifica montanha');
ok(identificarBiomaLocal('vintra_bosque', 'Bosque de Vintra') === 'floresta', 'Vintra identifica floresta');
ok(identificarBiomaLocal('mareu_porto', 'Costa de Mareu') === 'costa', 'Mareu identifica costa');
ok(identificarBiomaLocal('taverna', 'Vale de Halvet') === 'planicie', 'Halvet identifica planície');
ok(identificarBiomaLocal('asora_vila', 'Subespaço de Asora') === 'asora', 'Asora identifica asora');

ok(PONTOS_DE_ASSENTAMENTO.length >= 6, 'Pelo menos 6 pontos de assentamento catalogados');
const pontoDeserto = PONTOS_DE_ASSENTAMENTO.find(p => p.bioma === 'deserto');
ok(pontoDeserto !== undefined, 'Ponto de deserto/areia existe no catálogo');

// 2. Inicialização lazy e fundação formal do feudo no deserto
const campDeserto = novaCampanha('solgar_oasis');
ok(campDeserto.feudo === undefined, 'Feudo inicia undefined antes de obterFeudo');

const feudoD = obterFeudo(campDeserto);
ok(feudoD !== undefined && feudoD.fundado === false, 'obterFeudo inicializa estado seguro não fundado');

const resFundar = fundarFeudo(campDeserto, 'Bastião das Dunas', 'solgar_oasis', 'deserto');
ok(resFundar.ok, 'Fundação formal do feudo bem-sucedida');
ok(feudoD.fundado, 'Feudo marcado como fundado');
ok(feudoD.nome === 'Bastião das Dunas', 'Nome atribuído corretamente');
ok(feudoD.bioma === 'deserto', 'Bioma de deserto preservado');
ok(feudoD.tesouro >= 100, 'Tesouro inicial concedido');
ok(campDeserto.cronica.some(c => c.texto.includes('Bastião das Dunas')), 'Registro em crônica criado');

// 3. Construção modular sem limite fixo de 5 níveis e cooldown real de obras
const campObras = novaCampanha('halvet_colinas');
const feudoO = obterFeudo(campObras);
feudoO.fundado = true;
feudoO.tesouro = 300;
feudoO.materiais = 300;
feudoO.edificios.moradias = 5; // Já no nível 5
feudoO.capacidadeHabitacional = 125;

const resObra = iniciarObraFeudo(campObras, 'moradias');
ok(resObra.ok, 'Permite construir moradias além do nível 5');
ok(feudoO.obrasEmAndamento.length === 1, 'Obra inserida na fila de obras em andamento');

const obra = feudoO.obrasEmAndamento[0];
ok(obra.tipo === 'moradias', 'Tipo da obra é moradias');
ok(obra.nivelAlvo === 6, 'Nível alvo é 6');
ok(obra.periodosRestantes > 0, 'Obra possui cooldown em períodos');

const duracao = obra.periodosRestantes;

// Avança 2 períodos (não termina ainda)
const r1 = avancarObrasFeudo(campObras, 2);
ok(r1.concluidas.length === 0, 'Obra não conclui antes do tempo estipulado');
ok(obra.periodosRestantes === duracao - 2, 'Tempo restante reduzido precisamente');
ok(feudoO.edificios.moradias === 5, 'Nível ainda permanece 5');

// Avança o restante do cooldown
const r2 = avancarObrasFeudo(campObras, duracao);
ok(r2.concluidas.length === 1, 'Obra concluída após zerar períodos');
ok(feudoO.edificios.moradias === 6, 'Nível de moradias subiu para 6');
ok(feudoO.capacidadeHabitacional === 150, '+25 de capacidade populacional concedida');
ok(feudoO.obrasEmAndamento.length === 0, 'Fila de obras desocupada');

// 4. Validação estrita de recursos ao propor obras
const campPobre = novaCampanha();
const feudoP = obterFeudo(campPobre);
feudoP.fundado = true;
feudoP.tesouro = 0;
campPobre.personagem.dinheiro = 0;
feudoP.materiais = 0;

const falha = iniciarObraFeudo(campPobre, 'castelo');
ok(!falha.ok && falha.mensagem.includes('insuficiente'), 'Obra bloqueada por falta de recursos');
ok(feudoP.obrasEmAndamento.length === 0, 'Nenhuma obra criada sem recursos');

// 5. Despacho de caravana comercial, tempo de viagem e lucro auferido
const campCaravana = novaCampanha();
const feudoC = obterFeudo(campCaravana);
feudoC.fundado = true;
feudoC.comida = 100;
feudoC.materiais = 50;
feudoC.tesouro = 50;

const resCaravana = despacharCaravanaFeudo(campCaravana, 'tessel', 'Marca de Tessel', 'mantimentos');
ok(resCaravana.ok, 'Caravana despachada com sucesso');
ok(feudoC.rotasComerciais.length === 1, 'Rota comercial registrada');

const caravana = feudoC.rotasComerciais[0];
ok(caravana.ativa && caravana.diasRestantes > 0, 'Caravana ativa em trânsito');

const ouroAntes = feudoC.tesouro;
processarCicloReino(campCaravana, 28); // 7 dias

ok(feudoC.tesouro > ouroAntes, 'Retorno da caravana gerou lucro em ouro para o feudo');
ok(feudoC.rotasComerciais.length === 0, 'Rota concluída desocupada');

// 6. Destacamentos de patrulha militar e pacificação de estradas
const campMilitar = novaCampanha();
const feudoM = obterFeudo(campMilitar);
feudoM.fundado = true;
feudoM.edificios.quartel = 2; // Capacidade: 12 soldados

const resPatrulha = definirRotaPatrulhaFeudo(campMilitar, 'estrada_tessel', 'Estrada de Tessel', 4);
ok(resPatrulha.ok, 'Patrulha alocada com sucesso');
ok(feudoM.rotasPatrulha.length === 1, 'Rota de patrulha registrada');
ok(feudoM.rotasPatrulha[0].soldadosAlocados === 4, '4 soldados em guarda');
ok(feudoM.rotasPatrulha[0].eficaciaPacificacao === 28, 'Eficácia calculada corretamente');

const falhaGarrison = definirRotaPatrulhaFeudo(campMilitar, 'estrada_mareu', 'Estrada de Mareu', 20);
ok(!falhaGarrison.ok, 'Tentativa de exceder soldados do quartel bloqueada');

// 7. Ciclo do reino: consumo de comida, oficinas e imigração de cidades em crise
const campImigra = novaCampanha();
const feudoI = obterFeudo(campImigra);
feudoI.fundado = true;
feudoI.populacao = 30;
feudoI.capacidadeHabitacional = 100;
feudoI.comida = 200;
feudoI.materiais = 50;

// Configura cidade de Tessel em crise de fome
if (campImigra.vivo?.cidades.tessel) {
  campImigra.vivo.cidades.tessel.fomeDias = 5;
}

const popAntes = feudoI.populacao;
processarCicloReino(campImigra, 8); // 2 dias
ok(feudoI.populacao > popAntes, 'Refugiados de Tessel foram acolhidos no feudo');
ok(feudoI.materiais > 50, 'Oficinas produziram novos materiais');

// 8. Evolução de Patamares (Tier de Reino)
const campTier = novaCampanha();
const feudoT = obterFeudo(campTier);
feudoT.fundado = true;
feudoT.tierReino = 1;
feudoT.populacao = 200;
feudoT.edificios = {
  moradias: 8,
  castelo: 3,
  quartel: 3,
  mercado_feitoria: 3,
  igreja_santuario: 2,
  oficina_forja: 3,
  lavoura_silos: 4,
  muralha_baluarte: 3,
  boticario_hospital: 2,
  cisterna_poco: 0,
};

processarCicloReino(campTier, 4);
ok(feudoT.tierReino >= 5, 'Feudo ascendeu para Tier superior com o crescimento de edifícios');
const infoTier = obterTierReinoInfo(feudoT.tierReino, feudoT.bioma);
ok(infoTier.titulo.includes('Tier'), 'Título do Tier formatado corretamente');

// 9. Fundação da Casa Dinástica, Brasão e Prestígio
const campDinastia = novaCampanha();
const feudoDin = obterFeudo(campDinastia);
feudoDin.fundado = true;

const resCasa = fundarCasaDinastica(campDinastia, 'Casa Valerius', 'Fogo & Soberania', '#c59b27', '#1a1816', 'dragao');
ok(resCasa.ok, 'Casa dinástica fundada com sucesso');
ok(feudoDin.casaDinastica?.fundada === true, 'Flag fundada ativa');
ok(feudoDin.casaDinastica?.nome === 'Casa Valerius', 'Nome da dinastia gravado');
ok(feudoDin.casaDinastica?.lema === 'Fogo & Soberania', 'Lema dinástico gravado');
ok(feudoDin.casaDinastica?.brasaoFigura === 'dragao', 'Figura do brasão gravada');
ok((feudoDin.casaDinastica?.prestigio ?? 0) >= 30, 'Prestígio dinástico inicial concedido');
ok(campDinastia.cronica.some(c => c.texto.includes('Casa Valerius')), 'Proclamação registrada na crônica');

// 10. Conselho de Regência e Governança Passiva na Ausência do Rei
const campConselho = novaCampanha('halvet_colinas');
const feudoCons = obterFeudo(campConselho);
feudoCons.fundado = true;
feudoCons.estabilidade = 70;
feudoCons.tesouro = 200;

// Nomeia Regente e Chanceler
const rRegente = nomearConselheiro(campConselho, 'regente', 'npc_elric', 'Lorde Elric');
ok(rRegente.ok, 'Lorde Regente nomeado');
ok(feudoCons.conselho?.regente?.nome === 'Lorde Elric', 'Regente registrado no conselho');
ok((feudoCons.conselho?.regente?.competencia ?? 0) > 0, 'Competência atribuída');

const rTesoureiro = nomearConselheiro(campConselho, 'tesoureiro', 'npc_varn', 'Varn o Contador');
ok(rTesoureiro.ok, 'Tesoureiro nomeado');

// O Rei viaja para outra cidade (fica ausente do feudo)
campConselho.localAtual = 'tessel';
processarCicloReino(campConselho, 8); // 2 dias ausente
ok(feudoCons.estabilidade >= 70, 'Regente manteve a estabilidade durante a ausência do rei');

// Demite conselheiro
const rDemite = removerConselheiro(campConselho, 'tesoureiro');
ok(rDemite.ok, 'Tesoureiro dispensado com sucesso');
ok(feudoCons.conselho?.tesoureiro === undefined, 'Cargo de tesoureiro vago');

// 11. Quartel-General, Recrutamento e Progressão de Oficiais
const campQuartel = novaCampanha();
const feudoQ = obterFeudo(campQuartel);
feudoQ.fundado = true;
feudoQ.edificios.quartel = 2; // Permite até 4 oficiais
feudoQ.tesouro = 300;
feudoQ.materiais = 100;

const rRecruta = recrutarOficial(campQuartel, 'npc_gareth', 'Gareth de Halvet');
ok(rRecruta.ok, 'Oficial Gareth recrutado no quartel');
ok(feudoQ.oficiais?.length === 1, 'Oficial registrado no efetivo');
const oficialG = feudoQ.oficiais![0];
ok(oficialG.patente === 'recruta', 'Inicia com a patente de recruta');
ok(oficialG.designacao === 'guarda_castelo', 'Designação padrão guarda do castelo');

// Treinamento militar intensivo
const rTreino = treinarOficiais(campQuartel, oficialG.id);
ok(rTreino.ok, 'Exercício de armas realizado no pátio');
ok(oficialG.experiencia >= 30, 'Oficial ganhou XP de treinamento');

// Altera designação de missão
const rMissao = designarMissaoOficial(campQuartel, oficialG.id, 'patrulha_ruas');
ok(rMissao.ok, 'Missão alterada para patrulha de ruas');
ok(oficialG.designacao === 'patrulha_ruas', 'Nova designação salva');

// Concede XP suficiente e promove para Cabo
oficialG.experiencia = 60;
const rPromoCabo = promoverOficial(campQuartel, oficialG.id);
ok(rPromoCabo.ok, 'Oficial promovido para Cabo');
ok(oficialG.patente === 'cabo', 'Patente atualizada para cabo');

// Concede XP e promove para Sargento
oficialG.experiencia = 160;
const rPromoSargento = promoverOficial(campQuartel, oficialG.id);
ok(rPromoSargento.ok, 'Oficial promovido para Sargento');
ok(oficialG.patente === 'sargento', 'Patente atualizada para sargento');

// 12. Corte, Matrimônio Real, Gestação de 270 Dias e Linhagem
const campFamilia = novaCampanha();
const feudoFam = obterFeudo(campFamilia);
feudoFam.fundado = true;

const rCasamento = celebrarCasamento(campFamilia, 'npc_isolda', 'Lady Isolda de Mareu');
ok(rCasamento.ok, 'Casamento real celebrado com festa');
ok(feudoFam.casamento?.nomeConjuge === 'Lady Isolda de Mareu', 'Cônjuge registrado');
ok(feudoFam.casamento?.afeto === 85, 'Afeto conjugal inicial positivo');

// Inicia gestação
const rGestacao = iniciarGestacao(campFamilia);
ok(rGestacao.ok, 'Gestação de herdeiro iniciada');
ok(feudoFam.gestacao?.ativa === true, 'Gestação ativa');
ok(feudoFam.gestacao?.diaPrevisaoParto === campFamilia.calendario.dia + 270, 'Previsão de parto exatamente 270 dias (9 meses)');

// Avança o tempo até o termo da gestação (270 dias)
campFamilia.calendario.dia += 270;
processarCicloReino(campFamilia, 4);

ok(feudoFam.filhosHerdeiros && feudoFam.filhosHerdeiros.length >= 1, 'Herdeiro dinástico nasceu ao término dos 270 dias');
const herdeiro = feudoFam.filhosHerdeiros![0];
ok(herdeiro.vivo === true, 'Herdeiro nascido vivo');
ok(herdeiro.legitimidade === 'legitimo', 'Herdeiro legítimo');
ok(herdeiro.atributos.fisico > 0 && herdeiro.atributos.raciocinio > 0, 'Herança genética de atributos transmitida');
ok(feudoFam.herdeiroAparenteId === herdeiro.id, 'Designado automaticamente como herdeiro aparente');

// 13. Vassalagem Feudal (CK3 style) & Levas
const campVassalo = novaCampanha();
const feudoVas = obterFeudo(campVassalo);
feudoVas.fundado = true;
feudoVas.tesouro = 100;

const rVassalo = concederFeudoVassalo(campVassalo, 'npc_cedric', 'Barão Cedric', 'torre_vigia', 'Baronia da Vigia');
ok(rVassalo.ok, 'Feudo cedido e juramento de vassalagem firmado');
ok(feudoVas.vassalos?.length === 1, 'Vassalo registrado na corte');
ok(feudoVas.vassalos![0].tributoDiario === 12, 'Tributo diário fixado');

// Arrecadação de tributo pelo ciclo
const tesouroAntesVassalo = feudoVas.tesouro;
processarCicloReino(campVassalo, 4); // 1 dia
ok(feudoVas.tesouro > tesouroAntesVassalo, 'Tributo do senhor vassalo recolhido aos cofres');

// Convocação de levas militares
const rLevas = convocarLevasVassalos(campVassalo);
ok(rLevas.ok, 'Levas dos vassalos convocadas');
ok(rLevas.soldadosConvocados > 0, 'Soldados marcharam sob a bandeira suserana');

// 14. Assembleia de Guerra & Tratados de Paz
const campGuerra = novaCampanha();
const feudoGuerra = obterFeudo(campGuerra);
feudoGuerra.fundado = true;

const rGuerra = convocarAssembleiaGuerra(campGuerra, 'cidade_rival', 'Disputa de Fronteira e Honra');
ok(rGuerra.ok, 'Guerra formalmente declarada pela assembleia');
ok(feudoGuerra.guerraDeclaradaAlvoId === 'cidade_rival', 'Alvo de guerra registrado');

const rPaz = firmarTratadoPaz(campGuerra);
ok(rPaz.ok, 'Tratado de paz selado com sucesso');
ok(feudoGuerra.guerraDeclaradaAlvoId === undefined, 'Estado de guerra encerrado');

// 15. Tramas de Usurpação e Golpe Infiltrado
const campTrama = novaCampanha();
const feudoTrama = obterFeudo(campTrama);
feudoTrama.fundado = true;
feudoTrama.tesouro = 200;

// Exige Mestre dos Espiões para orquestrar
nomearConselheiro(campTrama, 'mestre_espioes', 'npc_malakor', 'Malakor Sombra');

const rTrama = iniciarTramaUsurpacao(campTrama, 'solgar_cidade', 'Solgar das Areias', 'npc_malakor', 'Malakor Sombra');
ok(rTrama.ok, 'Trama secreta de usurpação iniciada');
ok(feudoTrama.tramasAtivas?.length === 1, 'Trama ativa registrada');
ok(feudoTrama.tramasAtivas![0].progresso === 10, 'Progresso inicial da trama');

// Acelera avanço até 100% para testar golpe de estado
feudoTrama.tramasAtivas![0].progresso = 98;
processarCicloReino(campTrama, 8); // 2 dias de avanço

ok(feudoTrama.tramasAtivas?.length === 0, 'Trama concluída e consumada');
ok(feudoTrama.vassalos?.some(v => v.feudoCedidoId === 'solgar_cidade'), 'Cidade usurpada tornou-se feudo vassalo da dinastia');
ok(campTrama.cronica.some(c => c.texto.includes('Vitória de Intriga')), 'Golpe histórico registrado na crônica');

console.log('Todos os testes de assentamento, reino e dinastia passaram com 100% de sucesso!');

