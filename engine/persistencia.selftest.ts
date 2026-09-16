// ARCANUM · O save tem que aguentar o pior dia do aparelho.
//
// O que existia antes desta etapa: uma chave no AsyncStorage e um `catch {}`
// vazio. Falha de escrita não avisava; save corrompido virava `null` e a tela
// abria oferecendo "Nova campanha" — o jogador não tinha como saber que havia
// dez anos de mundo do outro lado de um byte errado.
//
// Estes testes não são sobre o caminho feliz. São sobre disco cheio no meio
// da gravação, arquivo truncado, JSON destruído, e o jogador querendo voltar
// atrás. Um save só é robusto se falhar bem.
import { conteudoVaelhorn as C } from '../content/vaelhorn';
import { criarCampanha } from './campaign';
import { atributosBase } from './character';
import {
  type Deposito, salvarNoSlot, carregarDoSlot, listarSlots, apagarSlot,
  listarInstantaneos, voltarPara, exportar, importar, empacotar, desempacotar,
  checksumDe, chaveDoSlot, chaveDoInstantaneo, MAX_INSTANTANEOS, SLOTS,
} from './persistencia';
import type { Campaign } from './types';

const ok = (v: unknown, mensagem: string) => {
  if (!v) throw new Error(mensagem);
  console.log(`✓ ${mensagem}`);
};

const nova = (seed = 'save'): Campaign =>
  criarCampanha(C, {
    nome: 'Provadora', atributos: atributosBase(), classeId: 'guardiao', origemId: 'divida',
    seedString: seed, marcaInfancia: 'comum', reacaoInfancia: 'apoio',
  });

/**
 * Depósito de mentira, com maldade programável. É por isto que a lógica saiu
 * do `ui/storage.ts`: não dá para simular disco cheio no AsyncStorage real.
 */
function depositoFalso() {
  const dados = new Map<string, string>();
  const estado = {
    falharEscritaEm: null as RegExp | null,
    falharLeituraEm: null as RegExp | null,
    falharChaves: false,
  };
  const dep: Deposito = {
    async ler(k) {
      if (estado.falharLeituraEm?.test(k)) throw new Error('leitura negada');
      return dados.has(k) ? dados.get(k)! : null;
    },
    async escrever(k, v) {
      if (estado.falharEscritaEm?.test(k)) throw new Error('disco cheio');
      dados.set(k, v);
    },
    async remover(k) { dados.delete(k); },
    async chaves() {
      if (estado.falharChaves) throw new Error('listagem negada');
      return [...dados.keys()];
    },
  };
  return { dep, dados, estado };
}

// tsx compila para CJS, que nao aceita await no topo do modulo. Os testes
// sao assincronos por natureza (o Deposito e' assincrono), entao o arquivo
// inteiro roda dentro de um main().
async function main() {
  // ── Ida e volta ───────────────────────────────────────────────────────────
  {
    const { dep } = depositoFalso();
    const c = nova();
    c.personagem.nivel = 12;
    c.calendario = { ...c.calendario, dia: 400 };

    const gravou = await salvarNoSlot(dep, 0, c, 1000);
    ok(gravou.ok, 'Gravar devolve sucesso');

    const leu = await carregarDoSlot(dep, 0);
    ok(leu.ok, 'Carregar devolve sucesso');
    if (leu.ok) {
      ok(leu.valor.campanha.personagem.nivel === 12, 'A campanha volta igual (nível)');
      ok(leu.valor.campanha.calendario.dia === 400, 'A campanha volta igual (dia)');
      ok(leu.valor.resumo.dia === 400, 'O resumo do slot mostra o dia sem abrir a campanha');
      ok(!leu.aviso, 'Caminho feliz não inventa aviso');
    }
  }

  // ── Slot vazio é vazio, não é erro ────────────────────────────────────────
  {
    const { dep } = depositoFalso();
    const leu = await carregarDoSlot(dep, 1);
    ok(!leu.ok && leu.erro === 'vazio', 'Slot nunca usado responde "vazio", não "quebrado"');
    const slots = await listarSlots(dep);
    ok(slots.length === SLOTS, `A tela recebe ${SLOTS} slots`);
    ok(slots.every(s => !s.ocupado), 'Todos começam livres');
  }

  // ── Falha de escrita NÃO é silenciosa ─────────────────────────────────────
  //
  // Esta é a razão de a etapa existir. O código antigo engolia a exceção e
  // seguia como se tivesse salvado.
  {
    const { dep, estado } = depositoFalso();
    estado.falharEscritaEm = /slot0$/;
    const r = await salvarNoSlot(dep, 0, nova(), 1000);
    ok(!r.ok, 'Disco cheio no save principal devolve erro');
    ok(!r.ok && r.erro.includes('nao_gravou'), `O erro diz o que houve (${!r.ok ? r.erro : ''})`);
  }

  // ── Instantâneo é gravado ANTES do principal ──────────────────────────────
  //
  // A ordem é a rede de segurança: se o principal falhar, o instantâneo já está
  // em disco e a campanha sobrevive.
  {
    const { dep, dados, estado } = depositoFalso();
    estado.falharEscritaEm = /slot0$/;
    await salvarNoSlot(dep, 0, nova(), 1000);
    const snaps = [...dados.keys()].filter(k => k.includes('.snap.'));
    ok(snaps.length === 1, 'O instantâneo sobrevive mesmo quando o save principal falha');

    // E é dele que a recuperação vive: agora o principal está ausente.
    estado.falharEscritaEm = null;
    const leu = await carregarDoSlot(dep, 0);
    ok(leu.ok, 'Com o principal ausente, o instantâneo salva a campanha');
    ok(leu.ok && !!leu.aviso, `E o jogador é avisado (${leu.ok ? leu.aviso : ''})`);
  }

  // ── Save corrompido: recupera e conta o que perdeu ────────────────────────
  {
    const { dep, dados } = depositoFalso();
    const c = nova();

    c.calendario = { ...c.calendario, dia: 100 };
    await salvarNoSlot(dep, 0, c, 1000);
    c.calendario = { ...c.calendario, dia: 200 };
    await salvarNoSlot(dep, 0, c, 2000);

    // O arquivo é cortado no meio — o caso real de gravação interrompida.
    const inteiro = dados.get(chaveDoSlot(0))!;
    dados.set(chaveDoSlot(0), inteiro.slice(0, Math.floor(inteiro.length * 0.6)));

    const leu = await carregarDoSlot(dep, 0);
    ok(leu.ok, 'Save truncado não perde a campanha');
    ok(leu.ok && leu.valor.campanha.calendario.dia === 200,
      'Recupera o instantâneo MAIS RECENTE, não qualquer um');
    ok(leu.ok && leu.aviso?.includes('200'), `O aviso diz de quando é (${leu.ok ? leu.aviso : ''})`);
  }

  // ── Checksum pega alteração que o JSON.parse não pega ─────────────────────
  {
    const { dep, dados } = depositoFalso();
    const c = nova();
    c.personagem.dinheiro = 10;
    await salvarNoSlot(dep, 0, c, 1000);
    c.personagem.dinheiro = 20;
    await salvarNoSlot(dep, 0, c, 2000);

    // JSON continua válido; o conteúdo é que foi mexido por fora.
    const env = JSON.parse(dados.get(chaveDoSlot(0))!);
    env.campanha.personagem.dinheiro = 999999;
    dados.set(chaveDoSlot(0), JSON.stringify(env));

    const conferido = desempacotar(dados.get(chaveDoSlot(0))!);
    ok(!conferido.ok && conferido.erro === 'checksum_nao_confere',
      'Save editado por fora não passa no checksum');

    const leu = await carregarDoSlot(dep, 0);
    ok(leu.ok && leu.valor.campanha.personagem.dinheiro === 20,
      'E o jogo volta ao último estado legítimo, não ao adulterado');
  }

  // ── Instantâneos não crescem para sempre ──────────────────────────────────
  {
    const { dep, dados } = depositoFalso();
    const c = nova();
    for (let i = 1; i <= MAX_INSTANTANEOS + 4; i++) {
      c.calendario = { ...c.calendario, dia: i };
      await salvarNoSlot(dep, 0, c, 1000 + i);
    }
    const snaps = [...dados.keys()].filter(k => k.includes('.snap.'));
    ok(snaps.length === MAX_INSTANTANEOS, `O histórico para em ${MAX_INSTANTANEOS} (${snaps.length})`);

    const lista = await listarInstantaneos(dep, 0);
    ok(lista.length === MAX_INSTANTANEOS, 'A lista mostra os que sobraram');
    ok(lista[0].resumo.dia > lista[lista.length - 1].resumo.dia,
      `Do mais novo para o mais velho (dia ${lista[0].resumo.dia} … ${lista[lista.length - 1].resumo.dia})`);
  }

  // ── Voltar atrás, e poder voltar do voltar ────────────────────────────────
  {
    const { dep } = depositoFalso();
    const c = nova();
    c.calendario = { ...c.calendario, dia: 50 };
    await salvarNoSlot(dep, 0, c, 1000);
    c.calendario = { ...c.calendario, dia: 60 };
    await salvarNoSlot(dep, 0, c, 2000);
    c.calendario = { ...c.calendario, dia: 70 };
    await salvarNoSlot(dep, 0, c, 3000);

    const r = await voltarPara(dep, 0, 1000, 4000);
    ok(r.ok, 'Voltar para um instantâneo funciona');
    const agora = await carregarDoSlot(dep, 0);
    ok(agora.ok && agora.valor.campanha.calendario.dia === 50, 'O slot voltou ao dia 50');

    // O estado que foi substituído virou instantâneo: desfazer o desfazer.
    const lista = await listarInstantaneos(dep, 0);
    ok(lista.some(x => x.resumo.dia === 70),
      'O estado abandonado virou instantâneo — dá para desfazer o desfazer');
  }

  // ── Rollback recusa instantâneo que não existe ou não presta ──────────────
  {
    const { dep, dados } = depositoFalso();
    const c = nova();
    await salvarNoSlot(dep, 0, c, 1000);
    const r = await voltarPara(dep, 0, 999999, 2000);
    ok(!r.ok, 'Voltar para instantâneo inexistente falha em vez de apagar o save');
    const ainda = await carregarDoSlot(dep, 0);
    ok(ainda.ok, 'E o save continua lá');

    dados.set(chaveDoInstantaneo(0, 1000), '{lixo');
    const r2 = await voltarPara(dep, 0, 1000, 3000);
    ok(!r2.ok, 'Voltar para instantâneo corrompido também falha com segurança');
  }

  // ── Slots são independentes ───────────────────────────────────────────────
  {
    const { dep } = depositoFalso();
    const a = nova('slot-a'); a.personagem.nome = 'Uma'; a.calendario = { ...a.calendario, dia: 11 };
    const b = nova('slot-b'); b.personagem.nome = 'Outra'; b.calendario = { ...b.calendario, dia: 22 };
    await salvarNoSlot(dep, 0, a, 1000);
    await salvarNoSlot(dep, 1, b, 1000);

    const slots = await listarSlots(dep);
    ok(slots[0].resumo?.nome === 'Uma' && slots[1].resumo?.nome === 'Outra',
      'Cada slot guarda a sua campanha');
    ok(!slots[2].ocupado, 'O terceiro continua livre');

    await apagarSlot(dep, 0);
    const depois = await listarSlots(dep);
    ok(!depois[0].ocupado, 'Apagar limpa o slot');
    ok(depois[1].resumo?.nome === 'Outra', 'E não encosta no vizinho');
    const sobrou = await listarInstantaneos(dep, 0);
    ok(sobrou.length === 0, 'Apagar leva os instantâneos junto');
  }

  // ── A listagem de slots não mente sobre save quebrado ─────────────────────
  {
    const { dep, dados } = depositoFalso();
    await salvarNoSlot(dep, 0, nova(), 1000);
    dados.set(chaveDoSlot(0), 'isto não é json');
    const slots = await listarSlots(dep);
    ok(slots[0].ocupado && !!slots[0].problema,
      `Slot quebrado aparece como ocupado COM problema (${slots[0].problema})`);
    ok(!slots[0].resumo, 'E não inventa um resumo que não pode ler');
  }

  // ── Exportar e importar ───────────────────────────────────────────────────
  {
    const c = nova();
    c.personagem.nivel = 7;
    const texto = exportar(c, 1000);
    ok(texto.includes('\n'), 'O arquivo exportado é legível (indentado)');

    const volta = importar(texto);
    ok(volta.ok, 'Importar o próprio arquivo funciona');
    ok(volta.ok && volta.valor.personagem.nivel === 7, 'E a campanha chega inteira');

    // Arquivo de fora merece MAIS desconfiança, não menos.
    ok(!importar('não sou json').ok, 'Texto qualquer é recusado');
    ok(!importar('{"versao":1}').ok, 'JSON sem campanha é recusado');
    ok(!importar(JSON.stringify({ versao: 99, campanha: {}, checksum: 'x' })).ok,
      'Versão futura é recusada em vez de carregada torta');

    const adulterado = JSON.parse(texto);
    adulterado.campanha.personagem.nivel = 99;
    ok(!importar(JSON.stringify(adulterado)).ok, 'Arquivo editado à mão não passa');
  }

  // ── O checksum é o que promete ────────────────────────────────────────────
  {
    ok(checksumDe('a') !== checksumDe('b'), 'Conteúdos diferentes, checksums diferentes');
    ok(checksumDe('abc') === checksumDe('abc'), 'É determinístico');
    ok(checksumDe('abc') !== checksumDe('abcd'),
      'Tamanho diferente nunca colide — é o caso do arquivo truncado');
    const env = empacotar(nova(), 1000);
    ok(env.checksum === checksumDe(JSON.stringify(env.campanha)),
      'O envelope carrega o checksum do que ele de fato guarda');
  }

  // ── Falhas de infraestrutura não derrubam o jogo ──────────────────────────
  {
    const { dep, estado } = depositoFalso();
    await salvarNoSlot(dep, 0, nova(), 1000);

    // Não dá para listar chaves: a poda falha, mas o save não.
    estado.falharChaves = true;
    const r = await salvarNoSlot(dep, 0, nova(), 2000);
    ok(r.ok, 'Não conseguir limpar instantâneos velhos não reprova a gravação');
    ok(r.ok && !!r.aviso, `Mas o aviso sobe (${r.ok ? r.aviso : ''})`);
    estado.falharChaves = false;

    // Não dá para ler: cai na recuperação, e ela também não consegue.
    estado.falharLeituraEm = /slot0/;
    const leu = await carregarDoSlot(dep, 0);
    ok(!leu.ok, 'Leitura impossível devolve erro em vez de fingir slot vazio');
    ok(!leu.ok && leu.erro.length > 10, `E o erro explica (${!leu.ok ? leu.erro : ''})`);
  }

  // ── Uma campanha de verdade sobrevive à ida e volta ───────────────────────
  //
  // Campanha nova tem mundo vivo, família, aptidão, elenco e RNG. Se algum
  // desses não sobreviver ao JSON, o resto do jogo quebra depois — longe daqui,
  // e difícil de rastrear.
  {
    const { dep } = depositoFalso();
    const c = nova('integridade');
    await salvarNoSlot(dep, 0, c, 1000);
    const leu = await carregarDoSlot(dep, 0);
    ok(leu.ok, 'Campanha completa grava e carrega');
    if (leu.ok) {
      const v = leu.valor.campanha;
      ok(JSON.stringify(v.rng) === JSON.stringify(c.rng), 'O RNG volta na mesma posição');
      ok(!!v.vivo && Object.keys(v.vivo.cidades).length === Object.keys(c.vivo!.cidades).length,
        'O mundo vivo volta inteiro');
      ok(!!v.familia && v.familia.membros.length === c.familia!.membros.length, 'A família volta inteira');
      ok(!!v.aptidao, 'A aptidão volta');
      ok(JSON.stringify(v) === JSON.stringify(c), 'A campanha é idêntica, campo por campo');
    }
  }

  console.log('\nPersistência: o save falha bem, avisa, e sabe voltar atrás.');

}

main().catch(e => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
