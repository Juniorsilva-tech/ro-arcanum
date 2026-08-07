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
  type OpcaoResolvida,
  type NPC,
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
  const iaLigada = useGame((s) => s.config.usarModelo && !!s.config.apiKey);
  const irPara = useGame((s) => s.irPara);

  const ctx = cena?.contexto;

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
            <EntradaNarrativa key={e.id} entrada={e} primeira={i === 0} />
          ))}

          <Divisor label={iaStatus === 'pensando' ? 'a cena · a IA está escrevendo…' : 'a cena'} />
          {!iaLigada && (
            <Pressable onPress={() => irPara('config')}>
              <Text style={styles.iaAviso}>
                IA desligada — narração local. Toque para ligar em Configurações.
              </Text>
            </Pressable>
          )}
          {iaLigada && iaStatus === 'erro' && (
            <Pressable onPress={() => irPara('config')}>
              <Text style={styles.iaErro}>IA falhou — toque para revisar chave/modelo.</Text>
            </Pressable>
          )}
          <TextoSerif style={styles.situacao}>{cena.narracao}</TextoSerif>

          {/* Enquanto a cena nova não existe, nada de escolher: as opções somem
              e um painel grande deixa claro que a IA está trabalhando. */}
          {ocupado ? (
            <View style={styles.gerandoBox}>
              <ActivityIndicator color={cores.ouro} size="large" />
              <Text style={styles.gerandoTitulo}>O narrador está escrevendo…</Text>
              <Text style={styles.gerandoSub}>as novas opções aparecem em instantes</Text>
            </View>
          ) : (
            cena.opcoes.length > 0 && (
              <View style={{ marginTop: esp.md }}>
                {cena.opcoes.map((op) => (
                  <OpcaoCena key={op.id} op={op} onPress={() => agirOpcao(op, ctx.presentes[0]?.id)} />
                ))}
              </View>
            )
          )}

          {/* PORTA 2 — o catálogo de ações */}
          <Divisor label="ações" />
          {ocupado && <Text style={styles.travado}>ações bloqueadas enquanto a cena é escrita</Text>}
          {!ocupado && ORDEM_CATEGORIAS.map((cat) => {
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

          {/* PORTA 3 — ação livre */}
          <Divisor label="ação livre" />
          <View style={[styles.livreWrap, ocupado && { opacity: 0.35 }]}>
            <TextInput
              style={styles.livreInput}
              value={texto}
              onChangeText={setTexto}
              placeholder={ocupado ? 'aguarde a cena…' : 'descreva o que você faz…'}
              placeholderTextColor={cores.linha}
              editable={!ocupado}
              multiline
            />
            <Pressable
              style={styles.livreBtn}
              onPress={() => {
                if (texto.trim() && !ocupado) {
                  acaoLivre(texto);
                  setTexto('');
                }
              }}
            >
              <Text style={styles.livreBtnTxt}>Agir</Text>
            </Pressable>
          </View>
          <View style={{ height: esp.xxl }} />
        </ScrollView>
      </View>

      {/* Seletor de alvo para verbos que exigem pessoa */}
      {verboAlvo && (
        <SeletorAlvo
          verbo={verboAlvo}
          presentes={ctx.presentes}
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

function EntradaNarrativa({ entrada, primeira }: { entrada: EntradaFeed; primeira: boolean }) {
  if (entrada.tipo === 'sistema') {
    // Falhas de IA precisam saltar aos olhos — antes ficavam num cinza invisível.
    const alerta = entrada.texto.startsWith('IA ');
    return (
      <TextoMono style={[styles.sistema, alerta && styles.sistemaAlerta]}>{entrada.texto}</TextoMono>
    );
  }
  if (entrada.tipo === 'acao') {
    return <Text style={styles.acao}>{entrada.texto}</Text>;
  }
  if (entrada.tipo === 'eco') {
    return <Text style={styles.eco}>{entrada.texto}</Text>;
  }
  return <TextoSerif style={[styles.narracao, primeira ? styles.narracaoPrimeira : null]}>{entrada.texto}</TextoSerif>;
}

function OpcaoCena({ op, onPress }: { op: OpcaoResolvida; onPress: () => void }) {
  const daIA = op.origem === 'ia';
  return (
    <Pressable
      style={({ pressed }) => [styles.opcao, daIA && styles.opcaoIA, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <Text style={styles.opcaoRotulo}>
        {daIA && <Text style={styles.marcaIA}>✦ </Text>}
        {op.rotulo}
      </Text>
      {op.dica && <Text style={styles.opcaoDica}>{op.dica}</Text>}
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
  onEscolher,
  onCancelar,
}: {
  verbo: Verbo;
  presentes: NPC[];
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
  narracao: { color: cores.vellum, marginBottom: esp.md, fontSize: 20, lineHeight: 30 },
  narracaoPrimeira: { fontSize: 21 },
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
  acao: { fontFamily: fontes.monoMedium, color: cores.verdigris, fontSize: 13, marginBottom: esp.sm },
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
  opcaoDica: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11, marginTop: 2 },
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
  alvoCancelar: { marginTop: esp.md, alignItems: 'center' },
  alvoCancelarTxt: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 12 },
});
void corGrau;
