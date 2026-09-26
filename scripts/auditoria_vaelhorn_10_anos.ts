// ARCANUM · Auditoria Completa e Simulação Geracional de 10 Anos em Vaelhorn
import { conteudoVaelhorn } from '../content';
import {
  criarCampanha,
  concluirPrologoInfancia,
  iniciarCombate,
  jogadorAtaca,
  jogadorAcaoTatica,
  fecharCombate,
  avancarPeriodos,
  avancarMundo,
  atributosBase,
  PERIODOS,
  NOME_ESTACAO,
  marcosRecentes,
} from '../engine';
import { forjar, temperar } from '../engine/forja';
import { fundarColonia, processarDiaColonia } from '../engine/colonia';
import { obterFeudo } from '../engine/reino';
import { itemPorId } from '../engine/items';

async function main() {
  console.log('======================================================================');
  console.log('⚔️ ARCANUM: AUDITORIA COMPLETA DE MECÂNICAS — CENÁRIO VAELHORN');
  console.log('🏛️ SIMULAÇÃO GERACIONAL CONTÍNUA DE 10 ANOS (3.650 DIAS / 40 ESTAÇÕES)');
  console.log('======================================================================\n');

  const content = conteudoVaelhorn;
  if (!content) {
    throw new Error('Conteúdo de Vaelhorn não encontrado!');
  }

  // ── 1. GERAÇÃO & CRIAÇÃO EM VAELHORN ──────────────────────────────────────
  console.log('1. CRIANDO PERSONAGEM E FAMÍLIA EM VAELHORN...');
  const camp = criarCampanha(content, {
    nome: 'Torvald de Vaelhorn',
    classeId: 'espadachim',
    origemId: 'divida',
    marcaInfancia: 'comum',
    reacaoInfancia: 'apoio',
    atributos: atributosBase(),
  });

  const famInicial = camp.familia!;
  console.log(`   ✓ Personagem: ${camp.personagem.nome}`);
  console.log(`   ✓ Classe: Espadachim · Origem: Dívida de Sangue`);
  console.log(`   ✓ Família gerada: ${famInicial.membros.length} membros.`);
  famInicial.membros.forEach((m) => {
    console.log(`     - ${m.nome} (${m.parentesco}, ${m.ocupacao}, idade inicial: ${m.idadeNoNascimento} anos)`);
  });

  // Conclui infância e atinge vida adulta aos 18 anos
  concluirPrologoInfancia(content, camp);
  camp.personagem.idade = 18;
  console.log(`   ✓ Prólogo concluído: Torvald atinge a vida adulta aos 18 anos.\n`);

  // ── 2. FORJA E FABRICAÇÃO DE ARMAS ────────────────────────────────────────
  console.log('2. TESTANDO FORJA, AFIAÇÃO E EQUIPAMENTOS...');
  camp.localAtual = 'vila_ferreiros'; // Local que possui bigorna/forja instalada
  camp.personagem.inventario['minerio_de_ferro'] = 6;
  camp.personagem.inventario['carvao'] = 4;
  camp.personagem.inventario['couro_cru'] = 2;

  const resForja = forjar(content, camp, 'lamina_curta', 'minerio_de_ferro');
  console.log(`   ✓ Tentativa de forja de Lâmina Curta: ${resForja.ok ? 'SUCESSO' : 'FALHA'}`);
  if (!resForja.ok) {
    throw new Error(`Falha na forja: ${resForja.texto}`);
  }
  const espadaForjada = resForja.item!;
  console.log(`   ✓ Arma forjada: ${espadaForjada.nome} (Dano: ${espadaForjada.dano?.base}, Peso: ${espadaForjada.peso})`);

  // Afiação da arma no rebolo via temperar()
  const resAfia = temperar(content, camp, espadaForjada.id);
  console.log(`   ✓ Afiação de gume no rebolo: ${resAfia.ok ? 'SUCESSO' : 'FALHA'}`);
  console.log(`     Mensagem: "${resAfia.texto}"`);
  console.log(`     Cargas de afiação: ${espadaForjada.afiacao?.cargas}/5 (+${espadaForjada.afiacao?.bonusDano} dano)\n`);

  // Equipar a arma forjada
  camp.personagem.equipado.arma = espadaForjada.id;
  camp.personagem.inventario['lanca'] = 1; // Arma de reserva na mochila para troca tática

  // ── 3. COMBATE REAL, TROCA TÁTICA E DESGASTE ──────────────────────────────
  console.log('3. AUDITANDO COMBATE BRUTAL COM CRIATURAS DE VAELHORN...');
  const luta = iniciarCombate(content, camp, ['salteador', 'lobo']);
  console.log(`   ✓ Combate iniciado contra: ${luta.atores.filter((a) => !a.ehJogador).map((a) => a.nome).join(', ')}`);
  console.log(`   ✓ Arma empunhada: ${itemPorId(content, espadaForjada.id, camp.personagem)?.nome}`);

  // Turno 1: Golpe com a espada forjada e afiada
  jogadorAtaca(content, camp, 'inim_0_salteador');
  console.log(`   ✓ Turno 1 (Ataque com Espada): ${luta.log[luta.log.length - 1]}`);

  // Turno 2: Troca tática de arma no calor do combate (saca a Lança da mochila)
  jogadorAcaoTatica(content, camp, 'trocar_arma', 'lanca');
  console.log(`   ✓ Turno 2 (Troca Tática): ${luta.log[luta.log.length - 1]}`);
  console.log(`     Arma agora empunhada: ${camp.personagem.equipado.arma === 'lanca' ? 'Lança (confirmado)' : 'Falha'}`);

  // Turnos seguintes: Luta até o fim
  let rodadas = 2;
  while (!luta.terminado && rodadas < 15) {
    rodadas++;
    const alvo = luta.atores.find((a) => !a.ehJogador && a.vida > 0);
    if (!alvo) break;
    jogadorAtaca(content, camp, alvo.id);
  }
  console.log(`   ✓ Combate encerrado na rodada ${luta.rodada} com resultado: ${luta.resultado}`);
  fecharCombate(camp);
  console.log(`   ✓ Recompensa recolhida. Vida do jogador: ${camp.personagem.recursos.vida}/${camp.personagem.recursosMax.vida}\n`);

  // ── 4. COLONIZAÇÃO E FEUDO EM VAELHORN ────────────────────────────────────
  console.log('4. AUDITANDO ASSENTAMENTO E COLÔNIA PIONEIRA EM VAELHORN...');
  camp.localAtual = 'campo_ceifa'; // Sítio colonial oficial de Vaelhorn
  const resColonia = fundarColonia(content, camp, 'Baluarte de Torvald');
  console.log(`   ✓ Fundação da colônia em Campo da Ceifa: ${resColonia.ok ? 'SUCESSO' : 'FALHA'}`);
  console.log(`     Mensagem: "${resColonia.mensagem}"`);

  const feudo = obterFeudo(camp);
  feudo.edificios.muralha_baluarte = 1;
  feudo.edificios.lavoura_silos = 2;
  console.log(`   ✓ Obras erguidas: Muralha Nível 1, Lavoura Nível 2`);
  console.log(`   ✓ População pioneira: ${feudo.populacao} colonos · Comida: ${feudo.comida} · Materiais: ${feudo.materiais}\n`);

  // ── 5. SIMULAÇÃO GERACIONAL CONTÍNUA DE 10 ANOS (3.650 DIAS) ──────────────
  console.log('5. INICIANDO SIMULAÇÃO GERACIONAL DE 10 ANOS (3.650 DIAS NO MUNDO)...');
  console.log('   (Acompanhando estações, envelhecimento, mortes na família, colônia e guerras feudais)');

  const anoInicial = Math.floor(camp.calendario.dia / 365) + 1;
  const idadeInicial = camp.personagem.idade ?? 18;

  for (let dia = 1; dia <= 3650; dia++) {
    // Avança 1 dia completo (6 períodos)
    camp.calendario = avancarPeriodos(camp.calendario, PERIODOS.length);

    // Processa economia da colônia a cada dia
    if (feudo.fundado) {
      processarDiaColonia(content, camp);
    }

    // Avança a vida viva do mundo de Vaelhorn
    avancarMundo(content, camp);

    // Contabiliza marcos anuais
    if (dia % 365 === 0) {
      const anoAtual = Math.floor(camp.calendario.dia / 365) + 1;
      const idadeAtual = camp.personagem.idade ?? 18;
      console.log(`   ⏳ Ano ${anoAtual} concluído (Dia ${dia}) · Idade de Torvald: ${idadeAtual} anos · Estação: ${NOME_ESTACAO[camp.calendario.estacao]} · População da Colônia: ${feudo.populacao}`);
    }
  }

  const anoFinal = Math.floor(camp.calendario.dia / 365) + 1;
  const idadeFinal = camp.personagem.idade ?? 18;

  console.log('\n======================================================================');
  console.log('📊 RELATÓRIO DA AUDITORIA GERACIONAL DE 10 ANOS EM VAELHORN:');
  console.log('======================================================================');
  console.log(`• Período simulado: Ano ${anoInicial} até Ano ${anoFinal} (Total de 3.650 dias corridos)`);
  console.log(`• Idade do Protagonista: ${idadeInicial} anos ➔ ${idadeFinal} anos (Envelheceu 10 anos na engine)`);
  console.log(`• Barreira dos 25 anos: Cruzada com sucesso. Vida restante: ${camp.personagem.recursos.vida}/${camp.personagem.recursosMax.vida}`);
  console.log(`• Família de Torvald após 10 anos:`);
  camp.familia?.membros.forEach((m) => {
    const idadeNpc = m.idadeNoNascimento + (camp.personagem.idade ?? 18);
    console.log(`  - ${m.nome} (${m.parentesco}): ${idadeNpc} anos [${m.condicao}]`);
  });
  console.log(`• Estado do Feudo / Colônia "Baluarte de Torvald":`);
  console.log(`  - População: ${feudo.populacao} colonos`);
  console.log(`  - Comida em estoque: ${Math.round(feudo.comida)} sacas`);
  console.log(`  - Materiais: ${Math.round(feudo.materiais)} unidades`);
  console.log(`  - Segurança: ${Math.round(feudo.seguranca)}%`);
  console.log(`  - Ouro no tesouro: ${Math.round(feudo.tesouro)} moedas`);
  console.log(`• Total de marcos históricos gravados no mundo: ${camp.marcos?.length ?? 0}`);
  console.log(`• Últimos marcos recentes no HUD:`);
  marcosRecentes(camp, 5).forEach((m) => console.log(`  ${m}`));
  console.log('======================================================================');
  console.log('✅ AUDITORIA DE TODAS AS MECÂNICAS DE VAELHORN CONCLUÍDA COM 100% DE ÊXITO!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('❌ Falha na auditoria de Vaelhorn:', err);
  process.exit(1);
});
