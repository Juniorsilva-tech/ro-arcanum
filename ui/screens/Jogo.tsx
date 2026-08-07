// ARCANUM · A tela de jogo. As três portas: a cena, as ações, a ação livre (GDD §4, §31).
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CabecalhoJogo } from './_layout';
import { TextoSerif, TextoMono, Divisor, Rotulo } from '../components';
import { cores, fontes, esp, raio, corGrau } from '../theme';
import { useGame, type EntradaFeed } from '../store';
import {
  disponibilidadeVerbo,
  custoComoChegada,
  dataPorExtenso,
  NOME_PERIODO,
  rotuloPrivacidade,
  impulsoDestacado,
  NOME_CATEGORIA,
  type CategoriaVerbo,
  type Verbo,
  emBlocos,
  estadoDoNpc,
  avaliarOpcao,
  NOME_NATUREZA,
  type Aposta,
  type OpcaoResolvida,
  type NPC,
  type Campaign,
} from '@/engine';

const ORDEM_CATEGORIAS: CategoriaVerbo[] = [
  'corpo',
  'social',
  'ganho',
  'transgressao',
  'pratica',
  'observacao',
  'deslocamento',
  'cenario',
];

export function Jogo() {
  const camp = useGame((s) => s.camp);
  const content = useGame((s) => s.content);
  const cena = useGame((s) => s.cena);
  const feed = useGame((s) => s.feed);
  const ocupado = useGame((s) => s.ocupado);
  const agirVerbo = useGame((s) => s.agirVerbo);
  const agirOpcao = useGame((s) => s.agirOpcao);
  const acaoLivre = useGame((s) => s.acaoLivre);

  const [texto, setTexto] = useState('');
  const [catAberta, setCatAberta] = useState<CategoriaVerbo | null>(null);
  const [verboAlvo, setVerboAlvo] = useState<Verbo | null>(null);
  const iaStatus = useGame((s) => s.iaStatus);
  const iaErro = useGame((s) => s.iaErro);
  // O narrador é obrigatório: ter chave é ter jogo.
  const iaLigada = useGame((s) => !!s.config.apiKey);
  const tentarNarrarDeNovo = useGame((s) => s.tentarNarrarDeNovo);
  // Turno resolvido esperando prosa: enquanto existir, ninguém age.
  const pendente = useGame((s) => s.pendente);
  const irPara = useGame((s) => s.irPara);

  const ctx = cena?.contexto;

  // Nomes que o narrador pode citar — servem para saber de quem é cada fala.
  const nomesConhecidos = useMemo(() => {
    if (!content) return [] as string[];
    const set = new Set<string>();
    for (const n of content.npcs) {
      set.add(n.nome);
      const primeiro = n.nome.split(/[,\s]/)[0];
      if (primeiro.length > 2) set.add(primeiro);
    }
    return [...set].sort((a, b) => b.length - a.length);
  }, [content]);

  const porCategoria = useMemo(() => {
    const m = new Map<CategoriaVerbo, Verbo[]>();
    if (!content) return m;
    for (const v of content.verbos) {
      const arr = m.get(v.categoria) ?? [];
      arr.push(v);
      m.set(v.categoria, arr);
    }
    return m;
  }, [content]);

  if (!camp || !content || !cena || !ctx) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.vazio}>…</Text>
      </SafeAreaView>
    );
  }

  const p = camp.personagem;
  const local = ctx.local;
  const periodo = ctx.periodo;
  // Sem narrador não se age: a engine resolveria, mas ninguém escreveria.
  const podeAgir = iaLigada && !pendente;

  function executarVerbo(v: Verbo) {
    if (v.alvo === 'pessoa') {
      if (ctx!.presentes.length === 1) {
        agirVerbo(v.id, ctx!.presentes[0].id);
      } else {
        setVerboAlvo(v);
      }
    } else {
      agirVerbo(v.id);
    }
    setCatAberta(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        <View style={styles.cabPad}>
          <CabecalhoJogo />
          <FaixaContexto
            capitulo={camp.capitulo}
            data={dataPorExtenso(camp.calendario, content.cenario.ancoraCalendario)}
            periodo={NOME_PERIODO[periodo]}
            localNome={local.nome}
            privacidade={rotuloPrivacidade(ctx.privacidade)}
            testemunhas={ctx.testemunhas}
            vida={p.recursos.vida}
            vidaMax={p.recursosMax.vida}
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.rolagem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {feed.map((e, i) => (
            <EntradaNarrativa key={e.id} entrada={e} primeira={i === 0} nomes={nomesConhecidos} />
          ))}

          {/* O narrador é obrigatório: sem ele não há prosa nem escolha. */}
          {!iaLigada ? (
            <View style={styles.semNarradorBox}>
              <Text style={styles.semNarradorTitulo}>A história está parada</Text>
              <Text style={styles.semNarradorTexto}>
                Quem escreve ARCANUM é o narrador. Sem uma chave de API salva, não existe
                texto de reserva — o jogo espera.
              </Text>
              <Pressable style={styles.botaoOuro} onPress={() => irPara('config')}>
                <Text style={styles.botaoOuroTxt}>Abrir Configurações</Text>
              </Pressable>
            </View>
          ) : ocupado ? (
            <View style={styles.gerandoBox}>
              <ActivityIndicator color={cores.ouro} size="large" />
              <Text style={styles.gerandoTitulo}>O narrador está escrevendo…</Text>
              <Text style={styles.gerandoSub}>as novas opções aparecem em instantes</Text>
            </View>
          ) : pendente ? (
            <View style={styles.falhaBox}>
              <Text style={styles.falhaTitulo}>O narrador não respondeu</Text>
              <Text style={styles.falhaMotivo}>{iaErro ?? 'sem resposta'}</Text>
              <Text style={styles.falhaTexto}>
                Seu turno está guardado — nada se perdeu. Tente de novo, ou troque de modelo
                em Configurações.
              </Text>
              <View style={styles.falhaBotoes}>
                <Pressable style={styles.botaoOuro} onPress={() => tentarNarrarDeNovo()}>
                  <Text style={styles.botaoOuroTxt}>Tentar de novo</Text>
                </Pressable>
                <Pressable style={styles.botaoVazio} onPress={() => irPara('config')}>
                  <Text style={styles.botaoVazioTxt}>Configurações</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            cena.opcoes.length > 0 && (
              <>
                <Divisor label="o que você faz" />
                <View style={{ marginTop: esp.md }}>
                  {cena.opcoes.map((op) => (
                    <OpcaoCena
                      key={op.id}
                      op={op}
                      aposta={avaliarOpcao(content, camp, op, { testemunhas: ctx.testemunhas })}
                      onPress={() => agirOpcao(op, ctx.presentes[0]?.id)}
                    />
                  ))}
                  {/* A ação livre é a última porta, e mora na mesma vitrine:
                      para o jogador é tudo um sistema só. */}
                  <View style={styles.livreCartao}>
                    <Text style={styles.opcaoEixo}>escrever a sua</Text>
                    <View style={styles.livreWrap}>
                      <TextInput
                        style={styles.livreInput}
                        value={texto}
                        onChangeText={setTexto}
                        placeholder="descreva o que você faz…"
                        placeholderTextColor={cores.linha}
                        multiline
                      />
                      <Pressable
                        style={styles.livreBtn}
                        onPress={() => {
                          if (texto.trim()) {
                            acaoLivre(texto);
                            setTexto('');
                          }
                        }}
                      >
                        <Text style={styles.livreBtnTxt}>Agir</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </>
            )
          )}

          {/* PORTA 2 — o catálogo de ações. Também trancado sem narrador: a
              engine até resolveria, mas ninguém escreveria o que aconteceu. */}
          <Divisor label="ações" />
          {ocupado && <Text style={styles.travado}>ações bloqueadas enquanto a cena é escrita</Text>}
          {!ocupado && !podeAgir && (
            <Text style={styles.travado}>ações bloqueadas até o narrador voltar</Text>
          )}
          {!ocupado && podeAgir && ORDEM_CATEGORIAS.map((cat) => {
            const verbos = porCategoria.get(cat);
            if (!verbos || verbos.length === 0) return null;
            const aberta = catAberta === cat;
            return (
              <View key={cat}>
                <Pressable
                  style={styles.catCabecalho}
                  onPress={() => setCatAberta(aberta ? null : cat)}
                >
                  <Text style={styles.catNome}>{NOME_CATEGORIA[cat]}</Text>
                  <Text style={styles.catGlifo}>{aberta ? '−' : '+'}</Text>
                </Pressable>
                {aberta &&
                  verbos.map((v) => {
                    const alvoRep = v.alvo === 'pessoa' ? ctx.presentes[0] : undefined;
                    const disp = disponibilidadeVerbo(v, ctx, camp, alvoRep);
                    const destaque = impulsoDestacado(camp, v.impulsoQueSacia);
                    return (
                      <LinhaVerbo
                        key={v.id}
                        verbo={v}
                        disponivel={disp.disponivel}
                        motivo={disp.motivo}
                        destaque={destaque}
                        chegada={custoComoChegada(camp.calendario, v.custo.periodos)}
                        onPress={() => executarVerbo(v)}
                      />
                    );
                  })}
              </View>
            );
          })}

          <View style={{ height: esp.xxl }} />
        </ScrollView>
      </View>

      {/* Seletor de alvo para verbos que exigem pessoa */}
      {verboAlvo && (
        <SeletorAlvo
          verbo={verboAlvo}
          presentes={ctx.presentes}
          camp={camp}
          onEscolher={(id) => {
            agirVerbo(verboAlvo.id, id);
            setVerboAlvo(null);
          }}
          onCancelar={() => setVerboAlvo(null)}
        />
      )}
    </SafeAreaView>
  );
}

function FaixaContexto(props: {
  capitulo: { numero: number; titulo: string; periodosDecorridos: number };
  data: string;
  periodo: string;
  localNome: string;
  privacidade: string;
  testemunhas: number;
  vida: number;
  vidaMax: number;
}) {
  return (
    <View style={styles.faixa}>
      <View style={styles.faixaLinha}>
        <Text style={styles.faixaLocal}>{props.localNome}</Text>
        <Text style={styles.faixaVida}>
          ♥ {props.vida}/{props.vidaMax}
        </Text>
      </View>
      <Text style={styles.faixaData}>
        {props.data} · {props.periodo}
      </Text>
      <Text style={styles.faixaMeta}>
        privacidade {props.privacidade} · {props.testemunhas === 0 ? 'ninguém te vê' : `${props.testemunhas} olhos`}
      </Text>
    </View>
  );
}

function EntradaNarrativa({
  entrada,
  primeira,
  nomes,
}: {
  entrada: EntradaFeed;
  primeira: boolean;
  nomes: string[];
}) {
  // Cada ação abre um bloco visível: o jogador precisa ver onde um turno
  // terminou e o outro começou.
  const marca = entrada.abreTurno ? (
    <View style={styles.marcaTurno}>
      <View style={styles.marcaRegua} />
      {!!entrada.cabecalho && <Text style={styles.marcaTexto}>{entrada.cabecalho}</Text>}
      <View style={styles.marcaRegua} />
    </View>
  ) : null;

  if (entrada.tipo === 'sistema') {
    // Falhas de IA precisam saltar aos olhos — antes ficavam num cinza invisível.
    const alerta = entrada.texto.startsWith('IA ');
    return (
      <>
        {marca}
        <TextoMono style={[styles.sistema, alerta && styles.sistemaAlerta]}>{entrada.texto}</TextoMono>
      </>
    );
  }
  if (entrada.tipo === 'acao') {
    return (
      <>
        {marca}
        <View style={styles.acaoCartao}>
          <Text style={styles.acaoRotulo}>você</Text>
          <TextoSerif style={styles.acaoTexto}>{entrada.texto}</TextoSerif>
        </View>
      </>
    );
  }
  if (entrada.tipo === 'eco') {
    return (
      <>
        {marca}
        <Text style={styles.eco}>{entrada.texto}</Text>
      </>
    );
  }

  // Narração: vira parágrafos e falas separadas. Nada de parede de texto.
  const blocos = emBlocos(entrada.texto, nomes);
  return (
    <>
      {marca}
      <View style={styles.narrBloco}>
        {blocos.map((b, i) =>
          b.tipo === 'fala' ? (
            <View key={i} style={styles.falaWrap}>
              {!!b.quem && <Text style={styles.falaQuem}>{b.quem}</Text>}
              <TextoSerif style={styles.falaTexto}>{b.texto}</TextoSerif>
            </View>
          ) : (
            <TextoSerif
              key={i}
              style={[styles.narracao, primeira && i === 0 ? styles.narracaoPrimeira : null]}
            >
              {b.texto}
            </TextoSerif>
          ),
        )}
      </View>
    </>
  );
}

function OpcaoCena({
  op,
  aposta,
  onPress,
}: {
  op: OpcaoResolvida;
  aposta: Aposta;
  onPress: () => void;
}) {
  const daIA = op.origem === 'ia';
  // A aposta é a MESMA conta que resolve o turno, dita em palavra. Sem número
  // na tela e sem mentira: se diz "no fio", a curva diz isso.
  const selos = [aposta.chance, aposta.custo, aposta.perigo].filter(Boolean) as string[];
  return (
    <Pressable
      style={({ pressed }) => [styles.opcao, daIA && styles.opcaoIA, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      {!!op.natureza && <Text style={styles.opcaoEixo}>{NOME_NATUREZA[op.natureza]}</Text>}
      <Text style={styles.opcaoRotulo}>
        {daIA && <Text style={styles.marcaIA}>✦ </Text>}
        {op.rotulo}
      </Text>
      {op.dica && <Text style={styles.opcaoDica}>{op.dica}</Text>}
      {selos.length > 0 && (
        <View style={styles.selos}>
          {selos.map((t, i) => (
            <Text
              key={i}
              style={[
                styles.selo,
                t === aposta.chance && styles.seloChance,
                t === aposta.perigo && styles.seloPerigo,
              ]}
            >
              {t}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}

function LinhaVerbo({
  verbo,
  disponivel,
  motivo,
  destaque,
  chegada,
  onPress,
}: {
  verbo: Verbo;
  disponivel: boolean;
  motivo?: string;
  destaque: boolean;
  chegada: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={!disponivel}
      onPress={onPress}
      style={({ pressed }) => [styles.verbo, pressed && disponivel ? { opacity: 0.7 } : null]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.verboNome,
            !disponivel && styles.verboIndisp,
            destaque && disponivel && { color: cores.ouro },
          ]}
        >
          {verbo.nome}
          {destaque && disponivel ? '  ·' : ''}
        </Text>
        <Text style={styles.verboMeta}>{disponivel ? `${verbo.descricao} · ${chegada}` : motivo}</Text>
      </View>
    </Pressable>
  );
}

function SeletorAlvo({
  verbo,
  presentes,
  camp,
  onEscolher,
  onCancelar,
}: {
  verbo: Verbo;
  presentes: NPC[];
  camp: Campaign;
  onEscolher: (id: string) => void;
  onCancelar: () => void;
}) {
  return (
    <Pressable style={styles.modalFundo} onPress={onCancelar}>
      <View style={styles.modal}>
        <Rotulo cor={cores.ouro}>{verbo.nome} — em quem?</Rotulo>
        <View style={{ height: esp.md }} />
        {presentes.map((n) => (
          <Pressable key={n.id} style={styles.alvoLinha} onPress={() => onEscolher(n.id)}>
            <Text style={styles.alvoNome}>{n.nome}</Text>
            <Text style={styles.alvoOcup}>{n.ocupacao}</Text>
            {/* Escolher pelo nome é escolher no escuro: aqui vai o estado dela. */}
            <TextoSerif style={styles.alvoEstado}>{estadoDoNpc(camp, n)}</TextoSerif>
          </Pressable>
        ))}
        <Pressable style={styles.alvoCancelar} onPress={onCancelar}>
          <Text style={styles.alvoCancelarTxt}>cancelar</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: cores.bistre },
  wrap: { flex: 1 },
  cabPad: { paddingHorizontal: esp.lg, paddingTop: esp.sm },
  rolagem: { paddingHorizontal: esp.lg, paddingTop: esp.sm },
  vazio: { color: cores.mudo, textAlign: 'center', marginTop: 80, fontSize: 32 },
  faixa: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: cores.linha,
    paddingVertical: esp.sm,
    marginBottom: esp.sm,
  },
  faixaLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  faixaLocal: { fontFamily: fontes.serifSemi, color: cores.vellum, fontSize: 18 },
  faixaVida: { fontFamily: fontes.mono, color: cores.cinabrio, fontSize: 12 },
  faixaData: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11, marginTop: 2 },
  faixaMeta: { fontFamily: fontes.mono, color: cores.linha, fontSize: 10, marginTop: 1 },
  narrBloco: { marginBottom: esp.lg },
  narracao: { color: cores.vellum, marginBottom: esp.md, fontSize: 20, lineHeight: 31 },
  narracaoPrimeira: { fontSize: 21 },
  // Fala: recuada, com o nome de quem falou acima. É o que separa boca de prosa.
  falaWrap: {
    marginLeft: esp.md,
    marginBottom: esp.md,
    paddingLeft: esp.md,
    borderLeftWidth: 2,
    borderLeftColor: cores.couro,
  },
  falaQuem: {
    fontFamily: fontes.mono,
    color: cores.ouro,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  falaTexto: { color: cores.vellum, fontSize: 20, lineHeight: 30, fontStyle: 'italic' },
  // Régua que abre cada turno.
  marcaTurno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: esp.sm,
    marginTop: esp.lg,
    marginBottom: esp.md,
  },
  marcaRegua: { flex: 1, height: 1, backgroundColor: cores.fundo3 },
  marcaTexto: {
    fontFamily: fontes.mono,
    color: cores.mudo,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
  // A escolha do jogador, como cartão da interface — nunca como texto narrado.
  acaoCartao: {
    borderLeftWidth: 2,
    borderLeftColor: cores.verdigris,
    paddingLeft: esp.md,
    paddingVertical: esp.xs,
    marginBottom: esp.md,
  },
  acaoRotulo: {
    fontFamily: fontes.mono,
    color: cores.verdigris,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  acaoTexto: { color: cores.vellum, fontSize: 17, lineHeight: 24 },
  situacao: { color: cores.vellum, fontStyle: 'italic', fontSize: 19, lineHeight: 28 },
  iaAviso: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11, marginBottom: esp.sm },
  iaErro: { fontFamily: fontes.mono, color: cores.cinabrio, fontSize: 11, marginBottom: esp.sm },
  eco: { fontFamily: fontes.serif, color: cores.ouro, fontStyle: 'italic', fontSize: 17, marginBottom: esp.md },
  sistema: { color: cores.mudo, marginBottom: esp.sm, fontSize: 11, letterSpacing: 0.5 },
  sistemaAlerta: {
    color: cores.cinabrio,
    fontSize: 12,
    borderLeftWidth: 2,
    borderLeftColor: cores.cinabrio,
    paddingLeft: esp.sm,
    textTransform: 'none',
  },
  opcao: {
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.md,
    padding: esp.md,
    marginBottom: esp.sm,
    backgroundColor: cores.fundo2,
  },
  opcaoIA: { borderColor: cores.ouro, backgroundColor: cores.fundo3 },
  marcaIA: { color: cores.ouro },
  opcaoRotulo: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 18 },
  gerandoBox: {
    marginTop: esp.lg,
    paddingVertical: esp.xl,
    paddingHorizontal: esp.lg,
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: raio.md,
    backgroundColor: cores.fundo2,
    alignItems: 'center',
    gap: esp.sm,
  },
  gerandoTitulo: { fontFamily: fontes.serifSemi, color: cores.ouro, fontSize: 22, marginTop: esp.sm },
  gerandoSub: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 12 },
  travado: { fontFamily: fontes.mono, color: cores.linha, fontSize: 11, paddingVertical: esp.md },
  semNarradorBox: {
    marginTop: esp.lg,
    padding: esp.lg,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.md,
    backgroundColor: cores.fundo2,
    gap: esp.sm,
  },
  semNarradorTitulo: { fontFamily: fontes.serifSemi, color: cores.vellum, fontSize: 21 },
  semNarradorTexto: { fontFamily: fontes.serif, color: cores.mudo, fontSize: 16, lineHeight: 23 },
  falhaBox: {
    marginTop: esp.lg,
    padding: esp.lg,
    borderWidth: 1,
    borderColor: cores.cinabrio,
    borderRadius: raio.md,
    backgroundColor: cores.fundo2,
    gap: esp.sm,
  },
  falhaTitulo: { fontFamily: fontes.serifSemi, color: cores.cinabrio, fontSize: 21 },
  falhaMotivo: { fontFamily: fontes.mono, color: cores.cinabrio, fontSize: 12, lineHeight: 17 },
  falhaTexto: { fontFamily: fontes.serif, color: cores.mudo, fontSize: 16, lineHeight: 23 },
  falhaBotoes: { flexDirection: 'row', gap: esp.sm, marginTop: esp.xs, flexWrap: 'wrap' },
  botaoOuro: {
    backgroundColor: cores.couro,
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: raio.md,
    paddingHorizontal: esp.lg,
    paddingVertical: esp.md,
    alignSelf: 'flex-start',
  },
  botaoOuroTxt: { fontFamily: fontes.serifMedium, color: cores.ouro, fontSize: 17 },
  botaoVazio: {
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.md,
    paddingHorizontal: esp.lg,
    paddingVertical: esp.md,
    alignSelf: 'flex-start',
  },
  botaoVazioTxt: { fontFamily: fontes.serifMedium, color: cores.mudo, fontSize: 17 },
  opcaoDica: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11, marginTop: 2 },
  opcaoEixo: {
    fontFamily: fontes.mono,
    color: cores.linha,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.xs, marginTop: esp.sm },
  selo: {
    fontFamily: fontes.mono,
    fontSize: 10,
    color: cores.mudo,
    borderWidth: 1,
    borderColor: cores.fundo3,
    borderRadius: raio.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  seloChance: { color: cores.vellum, borderColor: cores.linha },
  seloPerigo: { color: cores.cinabrio, borderColor: cores.cinabrio },
  catCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: esp.md,
    borderBottomWidth: 1,
    borderBottomColor: cores.fundo3,
  },
  catNome: {
    fontFamily: fontes.monoMedium,
    color: cores.mudo,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  catGlifo: { fontFamily: fontes.mono, color: cores.ouro, fontSize: 18 },
  verbo: { paddingVertical: esp.sm, paddingLeft: esp.md, borderBottomWidth: 1, borderBottomColor: cores.fundo3 },
  verboNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 17 },
  verboIndisp: { color: cores.linha, textDecorationLine: 'line-through' },
  verboMeta: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10, marginTop: 1, fontStyle: 'italic' },
  livreCartao: {
    borderWidth: 1,
    borderColor: cores.linha,
    borderStyle: 'dashed',
    borderRadius: raio.md,
    padding: esp.md,
    marginBottom: esp.sm,
    backgroundColor: cores.fundo2,
  },
  livreWrap: { flexDirection: 'row', gap: esp.sm, alignItems: 'flex-end' },
  livreInput: {
    flex: 1,
    fontFamily: fontes.serif,
    color: cores.vellum,
    fontSize: 18,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.md,
    padding: esp.md,
    minHeight: 48,
    maxHeight: 120,
  },
  livreBtn: {
    backgroundColor: cores.couro,
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: raio.md,
    paddingHorizontal: esp.lg,
    paddingVertical: esp.md,
    height: 48,
    justifyContent: 'center',
  },
  livreBtnTxt: { fontFamily: fontes.serifMedium, color: cores.ouro, fontSize: 18 },
  modalFundo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: esp.xl,
  },
  modal: {
    backgroundColor: cores.fundo3,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.lg,
    padding: esp.lg,
  },
  alvoLinha: {
    paddingVertical: esp.md,
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  alvoNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 20 },
  alvoOcup: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11 },
  alvoEstado: { color: cores.ouro, fontSize: 15, fontStyle: 'italic', marginTop: 2 },
  alvoCancelar: { marginTop: esp.md, alignItems: 'center' },
  alvoCancelarTxt: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 12 },
});
void corGrau;
