// ARCANUM · A tela de jogo. As três portas: a cena, as ações, a ação livre (GDD §4, §31).
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CabecalhoJogo } from './_layout';
import { TextoSerif, TextoMono, Divisor, Rotulo } from '../components';
import { cores, fontes, esp, raio, corGrau } from '../theme';
import { useGame, type EntradaFeed } from '../store';
import { lerEmVoz, pararVoz } from '../voz';
import {
  acoesAtoI,
  avisosAtoI,
  objetivoAtoI,
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
  comoEstaOVale,
  marcosRecentes,
  avaliarOpcao,
  NOME_NATUREZA,
  type Aposta,
  type OpcaoResolvida,
  type NPC,
  todosNpcs,
  type Campaign,
  custoDoSuborno,
  cartazesDaRegiao,
  cartazDe,
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
  const [modoLivre, setModoLivre] = useState<'fazer' | 'dizer'>('fazer');
  const [inputFocado, setInputFocado] = useState(false);
  const [catAberta, setCatAberta] = useState<CategoriaVerbo | null>(null);
  const [verboAlvo, setVerboAlvo] = useState<Verbo | null>(null);
  const iaStatus = useGame((s) => s.iaStatus);
  const iaErro = useGame((s) => s.iaErro);
  const textoStreaming = useGame((s) => s.textoStreaming);
  // Ter chave liga a IA; sem chave, o narrador local (engine) assume — o
  // jogo nunca fica parado por falta de chave (GDD §20, P0).
  // Ligada: há chave (ou reserva grátis) e o jogador não pediu o narrador local.
  const iaLigada = useGame((s) => (!!s.config.apiKey || !!s.config.reservas?.length) && !s.iaSuspensa);
  const tentarNarrarDeNovo = useGame((s) => s.tentarNarrarDeNovo);
  const desistirIaEUsarLocal = useGame((s) => s.desistirIaEUsarLocal);
  // Turno resolvido esperando prosa: enquanto existir, ninguém age.
  const pendente = useGame((s) => s.pendente);
  const irPara = useGame((s) => s.irPara);

  // Referência do ScrollView para autoscroll suave
  const scrollRef = useRef<ScrollView>(null);
  const cursorAnim = useRef(new Animated.Value(1)).current;

  // Pulso contínuo do cursor durante a geração
  useEffect(() => {
    if (ocupado) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, { toValue: 0.2, duration: 400, useNativeDriver: false }),
          Animated.timing(cursorAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [ocupado, cursorAnim]);

  // Autoscroll suave ao iniciar ação, ao atualizar streaming ou ao terminar turno
  useEffect(() => {
    if (ocupado) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [ocupado]);

  useEffect(() => {
    if (textoStreaming) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [textoStreaming]);

  // Quando a cena nova chega, a tela vai para o COMEÇO dela — não para o fim
  // da página, onde ficam as opções e o campo de texto (o jogador tinha que
  // subir para ler). A posição de cada entrada vem do onLayout.
  const posicaoEntrada = useRef<Record<string, number>>({});
  const tamanhoFeedAnterior = useRef(feed.length);
  useEffect(() => {
    const antes = tamanhoFeedAnterior.current;
    tamanhoFeedAnterior.current = feed.length;
    if (feed.length <= antes) return;
    const novas = feed.slice(antes);
    const alvo = novas.find((e) => e.tipo === 'narracao') ?? novas[0];
    // Enquanto o narrador escreve, quem manda é o acompanhamento do texto.
    if (ocupado && alvo.tipo !== 'narracao') return;
    // No navegador a medida (onLayout) chega depois do render; espera por
    // ela até ~1,5 s antes de desistir e ir para o fim.
    let tentativas = 0;
    let t: ReturnType<typeof setTimeout>;
    const rolar = () => {
      const y = posicaoEntrada.current[alvo.id];
      if (y !== undefined) {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      } else if (tentativas++ < 15) {
        t = setTimeout(rolar, 100);
      } else {
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    };
    t = setTimeout(rolar, 80);
    return () => clearTimeout(t);
  }, [feed.length]);

  const ctx = cena?.contexto;

  // Nomes que o narrador pode citar — servem para saber de quem é cada fala.
  // O seu próprio nome entra aqui também: sem isso, uma fala sua narrada em
  // prosa (não digitada por você) nunca era atribuída a ninguém.
  const nomesConhecidos = useMemo(() => {
    if (!content) return [] as string[];
    const set = new Set<string>();
    for (const n of todosNpcs(content, camp!)) {
      set.add(n.nome);
      const primeiro = n.nome.split(/[,\s]/)[0];
      if (primeiro.length > 2) set.add(primeiro);
    }
    if (camp?.personagem.nome) {
      set.add(camp.personagem.nome);
      const primeiro = camp.personagem.nome.split(/[,\s]/)[0];
      if (primeiro.length > 2) set.add(primeiro);
    }
    return [...set].sort((a, b) => b.length - a.length);
  }, [content, camp]);

  // Nomes de locais e regiões para não serem confundidos com pessoas falando
  const nomesLocais = useMemo(() => {
    if (!content) return [] as string[];
    const set = new Set<string>();
    for (const l of content.locais) {
      set.add(l.nome);
      const primeiro = l.nome.split(/[,\s]/)[0];
      if (primeiro.length > 2) set.add(primeiro);
      if (l.regiao) set.add(l.regiao);
    }
    return [...set];
  }, [content]);

  // O que está aberto agora, sempre à vista: o jogador não devia precisar
  // rolar o histórico para lembrar o que estava fazendo.
  const objetivosAtivos = useMemo(() => {
    if (!content || !camp) return [] as string[];
    // A trama vem primeiro: tem prazo e não espera.
    const trama = objetivoAtoI(content, camp);
    return [
      ...(trama ? [trama] : []),
      ...content.quests
        .filter((q) => camp.questEstado[q.id] === 'ativa')
        .flatMap((q) => q.objetivos.filter((o) => !camp.flags[o.flag]).map((o) => o.texto)),
    ].slice(0, 3);
  }, [content, camp]);

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
  // Sem chave, o narrador local resolve na hora — nunca fica pendente.
  // 'pendente' só existe de verdade quando uma chamada de IA falhou e
  // espera nova tentativa (ver narrar() em store.ts).
  const podeAgir = !pendente;

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

  const submeterAcaoLivre = () => {
    const t = texto.trim();
    if (!t || ocupado || !podeAgir) return;
    setTexto('');
    acaoLivre(t, modoLivre);
  };

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
            vale={comoEstaOVale(camp, content)}
            objetivos={objetivosAtivos}
            aconteceu={marcosRecentes(camp, 2)}
            cartazes={cartazesDaRegiao(content, camp) ?? []}
          />
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.rolagem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (ocupado || !!textoStreaming) {
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          }}
        >
          {feed.map((e, i) => (
            <View key={e.id} onLayout={(ev) => { posicaoEntrada.current[e.id] = ev.nativeEvent.layout.y; }}>
              <EntradaNarrativaAnimada
                entrada={e}
                primeira={i === 0}
                nomes={nomesConhecidos}
                nomeJogador={camp?.personagem.nome}
                ehUltima={i === feed.length - 1}
              />
            </View>
          ))}

          {/* Sem chave: aviso pequeno, não bloqueia nada — o narrador local
              já escreveu o que aconteceu no feed acima. */}
          {!iaLigada && !ocupado && !pendente && (
            <Pressable style={styles.modoLocalAviso} onPress={() => irPara('config')}>
              <Text style={styles.modoLocalTexto}>
                modo local — narração determinística, sem IA · toque para ligar IA em Configurações
              </Text>
            </Pressable>
          )}
          {ocupado ? (
            <View style={styles.gerandoBox}>
              <View style={styles.gerandoCab}>
                <View style={styles.gerandoPontoPulso} />
                <Text style={styles.gerandoTitulo}>O narrador escreve a crônica…</Text>
              </View>
              {textoStreaming ? (
                <View style={styles.streamingArea}>
                  <Text style={styles.streamingTexto}>
                    {textoStreaming}
                    <Animated.Text style={[styles.streamingCursor, { opacity: cursorAnim }]}>▌</Animated.Text>
                  </Text>
                </View>
              ) : (
                <View style={styles.esperandoArea}>
                  <ActivityIndicator color={cores.ouro} size="small" />
                  <Text style={styles.esperandoTexto}>O mundo reage às suas decisões…</Text>
                </View>
              )}
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
                <Pressable style={styles.botaoVazio} onPress={() => desistirIaEUsarLocal()}>
                  <Text style={styles.botaoVazioTxt}>Usar narrador local</Text>
                </Pressable>
                <Pressable style={styles.botaoVazio} onPress={() => irPara('config')}>
                  <Text style={styles.botaoVazioTxt}>Configurações</Text>
                </Pressable>
              </View>
            </View>
          ) : camp.abordagem ? (
            <CercoDaGuarda />
          ) : camp.prisao ? (
            <NaCela />
          ) : avisosAtoI(content, camp).length > 0 ? (
            <AvisoDaTrama />
          ) : (
            cena.opcoes.length > 0 && (
              <>
                <InvernoDosDezoito />
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
                    <View style={styles.livreCabecalho}>
                      <Text style={styles.opcaoEixo}>sua própria ação (texto livre)</Text>
                      <Text style={styles.livreAtalhoDica}>Enter envia · Shift+Enter quebra</Text>
                    </View>
                    {/* Fazer: o que você faz. Dizer: suas palavras exatas, que
                        entram na cena como fala sua. */}
                    <View style={styles.livreAbas}>
                      {(['fazer', 'dizer'] as const).map((m) => (
                        <Pressable
                          key={m}
                          onPress={() => setModoLivre(m)}
                          style={[styles.livreAba, modoLivre === m && styles.livreAbaAtiva]}
                        >
                          <Text style={[styles.livreAbaTxt, modoLivre === m && styles.livreAbaTxtAtiva]}>
                            {m === 'fazer' ? 'Fazer' : 'Dizer'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.livreWrap}>
                      <TextInput
                        style={[styles.livreInput, inputFocado && styles.livreInputFocado]}
                        value={texto}
                        onChangeText={setTexto}
                        onFocus={() => setInputFocado(true)}
                        onBlur={() => setInputFocado(false)}
                        placeholder={modoLivre === 'dizer' ? 'o que você diz, com suas palavras…' : 'descreva o que você faz no mundo…'}
                        placeholderTextColor={cores.mudo}
                        multiline
                        blurOnSubmit={false}
                        onKeyPress={(e) => {
                          const ev = e.nativeEvent as unknown as { key?: string; shiftKey?: boolean };
                          if (ev?.key === 'Enter' && !ev?.shiftKey) {
                            if ('preventDefault' in e && typeof (e as { preventDefault: () => void }).preventDefault === 'function') {
                              (e as { preventDefault: () => void }).preventDefault();
                            }
                            submeterAcaoLivre();
                          }
                        }}
                        onSubmitEditing={submeterAcaoLivre}
                      />
                      {texto.length > 0 && (
                        <Pressable style={styles.btnLimpar} onPress={() => setTexto('')} hitSlop={6}>
                          <Text style={styles.btnLimparTxt}>✕</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={({ pressed }) => [
                          styles.livreBtn,
                          !texto.trim() || ocupado || !podeAgir ? styles.livreBtnDesativado : null,
                          pressed && texto.trim() && !ocupado && podeAgir ? { opacity: 0.8, transform: [{ scale: 0.97 }] } : null,
                        ]}
                        disabled={!texto.trim() || ocupado || !podeAgir}
                        onPress={submeterAcaoLivre}
                      >
                        <Text style={styles.livreBtnTxt}>{modoLivre === 'dizer' ? 'Dizer ✦' : 'Agir ✦'}</Text>
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
                    const disp = disponibilidadeVerbo(v, ctx, camp, alvoRep, content);
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
          // Só quem pode ser alvo desta ação: a engine barra, por exemplo,
          // flerte com pai, mãe ou irmão — e a lista não os oferece.
          presentes={ctx.presentes.filter((n) => disponibilidadeVerbo(verboAlvo, ctx, camp, n, content).disponivel)}
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
  vale: { clima: string; estacao: string; evento?: string; carestia?: string };
  objetivos: string[];
  aconteceu: string[];
  cartazes: string[];
}) {
  const [aberto, setAberto] = useState(true);
  return (
    <View style={styles.faixa}>
      <View style={styles.faixaLinha}>
        <Text style={styles.faixaLocal}>{props.localNome}</Text>
        <Text style={styles.faixaVida}>
          ♥ {props.vida}/{props.vidaMax}
        </Text>
      </View>
      <Text style={styles.faixaData}>
        {props.data} · {props.periodo} · {props.vale.clima}
      </Text>
      <Text style={styles.faixaMeta}>
        privacidade {props.privacidade} · {props.testemunhas === 0 ? 'ninguém te vê' : `${props.testemunhas} olhos`}
        {props.vale.carestia ? ` · ${props.vale.carestia}` : ''}
      </Text>

      {aberto && (
        <>
          {!!props.vale.evento && (
            <Text style={styles.hudEvento} numberOfLines={2}>
              {props.vale.evento}
            </Text>
          )}
          {props.objetivos.length > 0 && (
            <View style={styles.hudBloco}>
              <Text style={styles.hudTitulo}>o que está aberto</Text>
              {props.objetivos.map((o, i) => (
                <Text key={i} style={styles.hudItem} numberOfLines={1}>
                  · {o}
                </Text>
              ))}
            </View>
          )}
          {props.cartazes.length > 0 && (
            <View style={styles.hudBloco}>
              <Text style={styles.hudTitulo}>cartazes na praça</Text>
              {props.cartazes.map((o, i) => (
                <Text key={i} style={styles.hudItem} numberOfLines={2}>
                  · {o}
                </Text>
              ))}
            </View>
          )}
          {props.aconteceu.length > 0 && (
            <View style={styles.hudBloco}>
              <Text style={styles.hudTitulo}>ficou para trás</Text>
              {props.aconteceu.map((o, i) => (
                <Text key={i} style={styles.hudItem} numberOfLines={1}>
                  · {o}
                </Text>
              ))}
            </View>
          )}
        </>
      )}
      <Pressable onPress={() => setAberto(!aberto)} hitSlop={8}>
        <Text style={styles.hudPuxador}>{aberto ? '— recolher' : '+ o que está aberto'}</Text>
      </Pressable>
    </View>
  );
}

function EntradaNarrativaAnimada({
  entrada,
  primeira,
  nomes,
  nomeJogador,
  ehUltima,
}: {
  entrada: EntradaFeed;
  primeira: boolean;
  nomes: string[];
  nomeJogador?: string;
  ehUltima: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(ehUltima ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(ehUltima ? 8 : 0)).current;

  useEffect(() => {
    if (ehUltima) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: false }),
        Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: false }),
      ]).start();
    }
  }, [ehUltima, fadeAnim, slideAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <EntradaNarrativa
        entrada={entrada}
        primeira={primeira}
        nomes={nomes}
        nomeJogador={nomeJogador}
      />
    </Animated.View>
  );
}

function EntradaNarrativa({
  entrada,
  primeira,
  nomes,
  nomeJogador,
}: {
  entrada: EntradaFeed;
  primeira: boolean;
  nomes: string[];
  nomeJogador?: string;
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
          <Text style={styles.acaoRotulo}>{nomeJogador || 'você'}</Text>
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
  const blocos = emBlocos(entrada.texto, nomes, nomeJogador);
  return (
    <>
      {marca}
      <View style={styles.narrTopo}>
        {entrada.modelo ? <Text style={styles.modeloTxt} numberOfLines={1}>{entrada.modelo}</Text> : <View />}
        <BotaoOuvir texto={entrada.texto} />
      </View>
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

// A guarda (engine/guarda.ts): a patrulha cercou e espera resposta.
function CercoDaGuarda() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const responder = useGame((s) => s.responderGuardaAcao);
  const ab = camp.abordagem!;
  const pr = camp.procura?.[ab.regiao];
  const custo = custoDoSuborno(content, camp);
  return (
    <View style={styles.falhaBox}>
      <Text style={styles.falhaTitulo}>{ab.cacador ? 'Um caçador de recompensas te achou' : 'A guarda te cercou'}</Text>
      <Text style={styles.falhaMotivo}>
        {pr
          ? pr.gravidade === 'sangue'
            ? `PROCURADO${cartazDe(pr).vivoOuMorto ? ' — VIVO OU MORTO' : ''} · ${pr.motivo} · recompensa de ${cartazDe(pr).recompensa} moedas`
            : `queixa de arruaça: ${pr.motivo}`
          : ab.guarda}
      </Text>
      <Text style={styles.falhaTexto}>
        {ab.cacador
          ? 'Ele trabalha por dinheiro: render-se é ser entregue na guarda; pagar mais que a recompensa compra o silêncio dele; lutar é contra uma besta armada.'
          : `${ab.guarda} espera a sua resposta. Render-se leva à cela. Fugir é arriscado: se não der, a patrulha te pega na marra.`}
      </Text>
      <View style={styles.falhaBotoes}>
        <Pressable style={styles.botaoVazio} onPress={() => responder('render')}>
          <Text style={styles.botaoVazioTxt}>Render-se</Text>
        </Pressable>
        <Pressable style={[styles.botaoVazio, custo !== undefined && camp.personagem.dinheiro < custo && { opacity: 0.4 }]} onPress={() => responder('subornar')}>
          <Text style={styles.botaoVazioTxt}>Subornar{custo !== undefined ? ` (${custo} moedas)` : ''}</Text>
        </Pressable>
        <Pressable style={styles.botaoVazio} onPress={() => responder('fugir')}>
          <Text style={styles.botaoVazioTxt}>Fugir</Text>
        </Pressable>
        <Pressable style={styles.botaoOuro} onPress={() => responder('lutar')}>
          <Text style={styles.botaoOuroTxt}>Lutar</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Ato I da trama (engine/atoI.ts): o pedido da mãe e a noite dos dezoito
// passam por aqui antes das opções, com ou sem IA.
function AvisoDaTrama() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const ler = useGame((s) => s.lerAvisoAtoI);
  const aviso = avisosAtoI(content, camp)[0];
  if (!aviso) return null;
  return (
    <View style={styles.falhaBox}>
      <Text style={styles.falhaTitulo}>{aviso.titulo}</Text>
      <Text style={styles.falhaTexto}>{aviso.texto}</Text>
      <View style={styles.falhaBotoes}>
        <Pressable style={styles.botaoOuro} onPress={() => ler(aviso)}>
          <Text style={styles.botaoOuroTxt}>Seguir</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Ato I da trama (engine/atoI.ts): o que dá para fazer pelo menino aqui.
function InvernoDosDezoito() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const agir = useGame((s) => s.acaoAtoI);
  const ocupado = useGame((s) => s.ocupado);
  const acoes = acoesAtoI(content, camp);
  if (!content.atoI || acoes.length === 0) return null;
  return (
    <View style={styles.falhaBox}>
      <Text style={styles.falhaTitulo}>{content.atoI.titulo}</Text>
      <Text style={styles.falhaMotivo}>{objetivoAtoI(content, camp)}</Text>
      {acoes.map((a) => (
        <Text key={a.id} style={styles.falhaTexto}>· {a.descricao}</Text>
      ))}
      <View style={styles.falhaBotoes}>
        {acoes.map((a) => (
          <Pressable key={a.id} disabled={ocupado} style={a.id === 'levar' || a.id === 'toca' ? styles.botaoOuro : styles.botaoVazio} onPress={() => agir(a.id)}>
            <Text style={a.id === 'levar' || a.id === 'toca' ? styles.botaoOuroTxt : styles.botaoVazioTxt}>{a.rotulo}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function NaCela() {
  const camp = useGame((s) => s.camp)!;
  const cela = useGame((s) => s.celaAcao);
  const preso = camp.prisao!;
  const dias = Math.max(0, preso.ateDia - camp.calendario.dia);
  return (
    <View style={styles.falhaBox}>
      <Text style={styles.falhaTitulo}>Na cela da guarda</Text>
      <Text style={styles.falhaMotivo}>{preso.motivo}</Text>
      <Text style={styles.falhaTexto}>
        Faltam {dias} dias.{preso.armaConfiscada ? ' Sua arma está no depósito da guarda.' : ''}{' '}
        {preso.fianca ? `A fiança é ${preso.fianca} moedas.` : 'Para sangue não há fiança.'} Fugir dá certo às vezes; se der errado, a pena cresce.
      </Text>
      <View style={styles.falhaBotoes}>
        <Pressable style={styles.botaoOuro} onPress={() => cela('cumprir')}>
          <Text style={styles.botaoOuroTxt}>Cumprir a pena</Text>
        </Pressable>
        {preso.fianca ? (
          <Pressable style={[styles.botaoVazio, camp.personagem.dinheiro < preso.fianca && { opacity: 0.4 }]} onPress={() => cela('fianca')}>
            <Text style={styles.botaoVazioTxt}>Pagar fiança</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.botaoVazio} onPress={() => cela('fugir')}>
          <Text style={styles.botaoVazioTxt}>Tentar fugir</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BotaoOuvir({ texto }: { texto: string }) {
  const [tocando, setTocando] = useState(false);
  return (
    <Pressable
      hitSlop={8}
      style={styles.ouvir}
      onPress={() => {
        if (tocando) {
          pararVoz();
          setTocando(false);
        } else {
          setTocando(true);
          lerEmVoz(texto, () => setTocando(false));
        }
      }}
    >
      <Text style={styles.ouvirTxt}>{tocando ? '■ parar' : '▶ ouvir'}</Text>
    </Pressable>
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
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.opcao, 
        daIA && styles.opcaoIA, 
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
      ]}
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
      accessibilityRole="button"
      accessibilityState={{ disabled: !disponivel }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.verbo, 
        pressed && disponivel ? { opacity: 0.8, transform: [{ scale: 0.98 }] } : null
      ]}
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
  hudEvento: {
    fontFamily: fontes.mono,
    color: cores.ouro,
    fontSize: 10,
    marginTop: esp.xs,
    lineHeight: 14,
  },
  hudBloco: { marginTop: esp.xs },
  hudTitulo: {
    fontFamily: fontes.mono,
    color: cores.linha,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hudItem: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10, lineHeight: 14 },
  hudPuxador: {
    fontFamily: fontes.mono,
    color: cores.linha,
    fontSize: 9,
    marginTop: esp.xs,
    alignSelf: 'flex-end',
  },
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
    paddingVertical: esp.lg,
    paddingHorizontal: esp.lg,
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: raio.md,
    backgroundColor: 'rgba(28, 24, 21, 0.85)',
    gap: esp.sm,
  },
  gerandoCab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: esp.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(62, 51, 42, 0.5)',
    paddingBottom: esp.xs,
  },
  gerandoPontoPulso: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cores.ouro,
  },
  gerandoTitulo: { fontFamily: fontes.serifSemi, color: cores.ouro, fontSize: 18, letterSpacing: 0.5 },
  gerandoSub: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  streamingArea: { paddingVertical: esp.xs },
  streamingTexto: { fontFamily: fontes.serif, color: cores.vellum, fontSize: 19, lineHeight: 29 },
  streamingCursor: { color: cores.ouro, fontSize: 18 },
  esperandoArea: { flexDirection: 'row', alignItems: 'center', gap: esp.md, paddingVertical: esp.md },
  esperandoTexto: { fontFamily: fontes.serif, color: cores.mudo, fontSize: 16, fontStyle: 'italic' },
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
  modoLocalAviso: {
    marginTop: esp.sm,
    paddingVertical: esp.sm,
    paddingHorizontal: esp.md,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.sm,
    alignSelf: 'flex-start',
  },
  modoLocalTexto: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11 },
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
    borderRadius: raio.md,
    padding: esp.md,
    marginBottom: esp.sm,
    backgroundColor: cores.fundo2,
    borderLeftWidth: 3,
    borderLeftColor: cores.ouro,
  },
  livreCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: esp.xs,
  },
  livreAbas: { flexDirection: 'row', gap: esp.sm, marginBottom: esp.sm },
  livreAba: { paddingVertical: 4, paddingHorizontal: esp.md, borderWidth: 1, borderColor: cores.linha, borderRadius: 3 },
  livreAbaAtiva: { borderColor: cores.ouro, backgroundColor: 'rgba(212,175,55,0.12)' },
  livreAbaTxt: { fontFamily: fontes.mono, fontSize: 11, color: cores.mudo, letterSpacing: 1 },
  livreAbaTxtAtiva: { color: cores.ouro },
  narrTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: esp.sm },
  modeloTxt: { flexShrink: 1, fontFamily: fontes.mono, fontSize: 10, color: cores.mudo, letterSpacing: 0.5 },
  ouvir: { alignSelf: 'flex-end', paddingVertical: 2, paddingHorizontal: 6, marginBottom: 2 },
  ouvirTxt: { fontFamily: fontes.mono, fontSize: 10, color: cores.mudo, letterSpacing: 1 },
  livreAtalhoDica: {
    fontFamily: fontes.mono,
    color: cores.linha,
    fontSize: 9,
  },
  livreWrap: { flexDirection: 'row', gap: esp.sm, alignItems: 'center' },
  livreInput: {
    flex: 1,
    fontFamily: fontes.serif,
    color: cores.vellum,
    fontSize: 17,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.md,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: cores.fundo3,
  },
  livreInputFocado: {
    borderColor: cores.ouro,
    backgroundColor: 'rgba(28, 24, 21, 0.95)',
  },
  btnLimpar: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnLimparTxt: {
    fontFamily: fontes.mono,
    color: cores.mudo,
    fontSize: 12,
  },
  livreBtn: {
    backgroundColor: cores.couro,
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: raio.md,
    paddingHorizontal: esp.lg,
    paddingVertical: esp.sm,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  livreBtnDesativado: {
    opacity: 0.45,
    borderColor: cores.linha,
  },
  livreBtnTxt: { fontFamily: fontes.serifSemi, color: cores.ouro, fontSize: 16, letterSpacing: 0.5 },
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
