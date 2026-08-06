// ARCANUM · Painéis: Ficha, Vínculos, Crônica, Mapa e o Livro (GDD §13, §31, §32).
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Pagina, BarraVoltar } from './_layout';
import { TextoSerif, TextoMono, Card, Medidor, Divisor, Rotulo, Selo, Botao } from '../components';
import { cores, fontes, esp, corPressao, corImpulso } from '../theme';
import { useGame } from '../store';
import {
  derivados,
  modificador,
  IMPULSOS,
  ATTR_KEYS,
  bonusDefesaEquip,
  armaEquipada,
  itemPorId,
  mestresQueEnsinamAqui,
  type AttrKey,
  type EstadoEntrada,
} from '@/engine';

// ─────────────────────────────────────────────── FICHA
export function Ficha() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const p = camp.personagem;
  const nomes = content.cenario.nomesAtributos;
  const d = derivados(p, bonusDefesaEquip(content, p));
  const arma = armaEquipada(content, p);
  const classe = content.classes.find((c) => c.id === p.classeId);

  return (
    <Pagina>
      <BarraVoltar titulo="Ficha" />
      <TextoSerif style={{ fontSize: 30, color: cores.ouro }}>{p.nome}</TextoSerif>
      <TextoMono style={{ marginBottom: esp.md }}>
        {classe?.nome} · nível {p.nivel} · {p.xp} xp · {p.dinheiro} moedas
      </TextoMono>

      <Divisor label="atributos" />
      {ATTR_KEYS.map((k: AttrKey) => {
        const val = p.atributos[k];
        const mod = modificador(val);
        return (
          <View key={k} style={styles.attrRow}>
            <Text style={styles.attrNome}>{nomes[k]}</Text>
            <Text style={styles.attrVal}>
              {val} <Text style={styles.attrMod}>({mod >= 0 ? '+' : ''}{mod})</Text>
            </Text>
          </View>
        );
      })}

      <Divisor label="recursos" />
      {Object.keys(p.recursos).map((r) => (
        <Medidor
          key={r}
          rotulo={nomeRecurso(content, r)}
          valor={p.recursos[r]}
          max={p.recursosMax[r] ?? p.recursos[r]}
          cor={r === 'vida' ? cores.cinabrio : cores.verdigris}
        />
      ))}

      <Divisor label="pressões" />
      {content.cenario.pressoes.map((pr) => (
        <View key={pr.id} style={{ marginBottom: esp.sm }}>
          <Medidor rotulo={pr.nome} valor={p.pressoes[pr.id] ?? 0} max={100} cor={corPressao(p.pressoes[pr.id] ?? 0)} compacto />
          <TextoMono style={styles.pressaoDesc}>{pr.descricao}</TextoMono>
        </View>
      ))}

      <Divisor label="impulsos" />
      {IMPULSOS.map((imp) => (
        <Medidor key={imp.id} rotulo={imp.nome} valor={camp.impulsos[imp.id]} max={100} cor={corImpulso(camp.impulsos[imp.id])} compacto />
      ))}

      <Divisor label="derivados" />
      <View style={styles.derivGrid}>
        <Deriv nome="Defesa" v={d.defesa} />
        <Deriv nome="Iniciativa" v={d.iniciativa} />
        <Deriv nome="Acerto" v={d.acerto} />
        <Deriv nome="Poder" v={d.poder} />
        <Deriv nome="Carga máx" v={d.cargaMax} />
        <Deriv nome="Percepção" v={d.percepcaoPassiva} />
      </View>

      {p.condicoes.length > 0 && (
        <>
          <Divisor label="condições" />
          <View style={styles.chips}>
            {p.condicoes.map((c) => (
              <Selo key={c} texto={c} cor={cores.cinabrio} />
            ))}
          </View>
        </>
      )}

      <Divisor label="equipamento" />
      <View style={styles.attrRow}>
        <Text style={styles.invItem}>Arma</Text>
        <TextoMono style={{ color: cores.vellum }}>
          {arma ? `${arma.nome} (dano ${arma.dano?.base ?? '—'})` : 'desarmado'}
        </TextoMono>
      </View>
      <View style={styles.attrRow}>
        <Text style={styles.invItem}>Armadura</Text>
        <TextoMono style={{ color: cores.vellum }}>
          {p.equipado.armadura ? itemPorId(content, p.equipado.armadura)?.nome : '—'}
        </TextoMono>
      </View>

      {Object.keys(p.inventario).length > 0 && (
        <>
          <Divisor label="inventário" />
          {Object.entries(p.inventario).map(([id, qtd]) => (
            <View key={id} style={styles.attrRow}>
              <Text style={styles.invItem}>{itemPorId(content, id)?.nome ?? id.replace(/_/g, ' ')}</Text>
              <TextoMono>×{qtd}</TextoMono>
            </View>
          ))}
        </>
      )}
    </Pagina>
  );
}

function Deriv({ nome, v }: { nome: string; v: number }) {
  return (
    <View style={styles.derivItem}>
      <Text style={styles.derivVal}>{v}</Text>
      <Text style={styles.derivNome}>{nome}</Text>
    </View>
  );
}

function nomeRecurso(content: any, id: string): string {
  if (id === 'vida') return 'Vida';
  return content.cenario.recursos.find((r: any) => r.id === id)?.nome ?? id;
}

// ─────────────────────────────────────────────── VÍNCULOS
export function Vinculos() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const eixos = content.cenario.eixosRelacao;

  const conhecidos = content.npcs.filter((n) => {
    const din = camp.npcState[n.id];
    return din && din.memoria.length > 0;
  });
  const lista = conhecidos.length > 0 ? conhecidos : content.npcs.slice(0, 3);

  return (
    <Pagina>
      <BarraVoltar titulo="Vínculos" />
      <TextoSerif style={styles.intro}>
        Afeto não é confiança. Alguém pode te amar e não te confiar nada.
      </TextoSerif>
      {lista.map((n) => {
        const din = camp.npcState[n.id];
        const sabeSegredo = camp.segredosRevelados.includes(n.id);
        return (
          <Card key={n.id}>
            <View style={styles.linhaTitulo}>
              <TextoSerif style={{ fontSize: 22, color: cores.vellum }}>{n.nome}</TextoSerif>
              {din.tensao >= 60 && <Selo texto="afastando-se" cor={cores.cinabrio} />}
            </View>
            <TextoMono style={{ marginBottom: esp.sm }}>{n.ocupacao}</TextoMono>
            {eixos.map((e) => {
              const v = din.eixos[e.id] ?? 0;
              const cor = e.id === 'medo' ? cores.cinabrio : e.id === 'confianca' ? cores.verdigris : cores.ouro;
              return (
                <Medidor key={e.id} rotulo={e.nome} valor={Math.max(0, v + 20)} max={40} cor={cor} compacto />
              );
            })}
            {sabeSegredo && n.segredo && (
              <View style={styles.segredo}>
                <Rotulo cor={cores.violeta}>Segredo descoberto</Rotulo>
                <TextoSerif style={{ fontSize: 16, color: cores.vellum, marginTop: 2 }}>
                  {n.segredo.conteudo}
                </TextoSerif>
              </View>
            )}
          </Card>
        );
      })}
    </Pagina>
  );
}

// ─────────────────────────────────────────────── CRÔNICA
export function Cronica() {
  const feed = useGame((s) => s.feed);
  const narrativas = feed.filter((e) => e.tipo === 'narracao' || e.tipo === 'eco');
  return (
    <Pagina>
      <BarraVoltar titulo="Crônica" />
      {narrativas.length === 0 && <TextoMono>Sua história ainda não começou.</TextoMono>}
      {narrativas.map((e) => (
        <TextoSerif
          key={e.id}
          style={[
            { marginBottom: esp.md, fontSize: 18 },
            e.tipo === 'eco' ? { color: cores.ouro, fontStyle: 'italic' } : { color: cores.vellum },
          ]}
        >
          {e.texto}
        </TextoSerif>
      ))}
    </Pagina>
  );
}

// ─────────────────────────────────────────────── MAPA
export function Mapa() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const viajar = useGame((s) => s.viajar);
  const local = content.locais.find((l) => l.id === camp.localAtual)!;

  return (
    <Pagina>
      <BarraVoltar titulo="Mapa" />
      <Rotulo cor={cores.ouro}>{local.regiao}</Rotulo>
      <TextoSerif style={{ fontSize: 26, marginTop: 2 }}>{local.nome}</TextoSerif>
      <TextoMono style={{ marginBottom: esp.lg }}>você está aqui · perigo {local.perigo}/10</TextoMono>

      <Divisor label="para onde ir" />
      {local.rotas.map((r) => {
        const dest = content.locais.find((l) => l.id === r.destino);
        if (!dest) return null;
        const conhecido = camp.locaisVisitados.includes(r.destino);
        return (
          <Card key={r.destino} onPress={() => viajar(r.destino)} acento={r.perigo >= 4 ? cores.cinabrio : undefined}>
            <View style={styles.linhaTitulo}>
              <TextoSerif style={{ fontSize: 20 }}>{conhecido ? dest.nome : 'Rumo desconhecido'}</TextoSerif>
              {r.perigo >= 4 && <Selo texto="perigoso" cor={cores.cinabrio} />}
            </View>
            <TextoMono style={{ marginTop: 2 }}>
              {r.periodos === 0 ? 'ao lado' : `${r.periodos} período(s) de viagem`}
              {conhecido ? ` · ${dest.tipo}` : ''}
            </TextoMono>
          </Card>
        );
      })}

      <Divisor label="lugares que você conhece" />
      <View style={styles.chips}>
        {camp.locaisVisitados.map((id) => {
          const l = content.locais.find((x) => x.id === id);
          return <Selo key={id} texto={l?.nome ?? id} cor={id === camp.localAtual ? cores.ouro : undefined} />;
        })}
      </View>
    </Pagina>
  );
}

// ─────────────────────────────────────────────── MISSÕES
export function Missoes() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;

  const ativas = content.quests.filter((q) => camp.questEstado[q.id] === 'ativa');
  const feitas = content.quests.filter((q) => camp.questEstado[q.id] === 'concluida');
  const ocultas = content.quests.filter((q) => camp.questEstado[q.id] === 'desconhecida');

  return (
    <Pagina>
      <BarraVoltar titulo="Missões" />
      <TextoSerif style={styles.intro}>O que o mundo espera de você — e o que você prometeu.</TextoSerif>

      <Divisor label="em andamento" />
      {ativas.length === 0 && <TextoMono>Nada em aberto por ora.</TextoMono>}
      {ativas.map((q) => (
        <Card key={q.id} acento={cores.ouro}>
          <TextoSerif style={{ fontSize: 20 }}>{q.titulo}</TextoSerif>
          <TextoSerif style={{ fontSize: 16, color: cores.mudo, marginTop: 2 }}>{q.descricao}</TextoSerif>
          {q.objetivos.map((o) => {
            const feito = !!camp.flags[o.flag];
            return (
              <View key={o.id} style={styles.questObj}>
                <Text style={[styles.questCheck, { color: feito ? cores.verdigris : cores.linha }]}>
                  {feito ? '✔' : '○'}
                </Text>
                <TextoMono style={{ color: feito ? cores.verdigris : cores.mudo, flex: 1 }}>{o.texto}</TextoMono>
              </View>
            );
          })}
          <TextoMono style={{ color: cores.linha, marginTop: esp.sm }}>
            recompensa:
            {q.recompensa.dinheiro ? ` ${q.recompensa.dinheiro} moedas` : ''}
            {q.recompensa.xp ? ` · ${q.recompensa.xp} xp` : ''}
            {q.recompensa.item ? ` · ${itemPorId(content, q.recompensa.item)?.nome ?? q.recompensa.item}` : ''}
          </TextoMono>
        </Card>
      ))}

      {feitas.length > 0 && (
        <>
          <Divisor label="concluídas" />
          {feitas.map((q) => (
            <View key={q.id} style={styles.livroLinha}>
              <Text style={[styles.livroNome, { color: cores.verdigris }]}>✔ {q.titulo}</Text>
            </View>
          ))}
        </>
      )}

      {ocultas.length > 0 && (
        <>
          <Divisor label="ouvidas por aí" />
          <TextoMono>
            {ocultas.length} história(s) esperam alguém que valha a pena — fale com as pessoas certas.
          </TextoMono>
        </>
      )}
    </Pagina>
  );
}

// ─────────────────────────────────────────────── O LIVRO
export function Livro() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const aprender = useGame((s) => s.aprenderArteAcao);
  const conjurar = useGame((s) => s.conjurarArteLivre);
  const p = camp.personagem;

  const ensinamAqui = mestresQueEnsinamAqui(content, camp);
  const localNome = content.locais.find((l) => l.id === camp.localAtual)?.nome ?? '';

  return (
    <Pagina>
      <BarraVoltar titulo="O Livro" />
      <TextoSerif style={styles.intro}>Preencher o Livro é o jogo.</TextoSerif>

      {ensinamAqui.length > 0 && (
        <>
          <Divisor label={`aprender agora · ${localNome}`} />
          {ensinamAqui.map(({ mestre, artes }) => (
            <Card key={mestre.id} acento={cores.verdigris}>
              <TextoSerif style={{ fontSize: 19 }}>{mestre.nome}</TextoSerif>
              <TextoMono style={{ marginBottom: esp.sm }}>{mestre.custo}</TextoMono>
              <View style={styles.chips}>
                {artes.map((a) => (
                  <Pressable key={a.id} style={styles.chipAprender} onPress={() => aprender(a.id)}>
                    <Text style={styles.chipAprenderTxt}>aprender {a.nome}</Text>
                    <Text style={styles.chipAprenderSub}>2 períodos</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          ))}
        </>
      )}

      {p.artesConhecidas.length > 0 && (
        <>
          <Divisor label="conjurar" />
          <View style={styles.chips}>
            {p.artesConhecidas.map((id) => {
              const a = content.artes.find((x) => x.id === id);
              if (!a) return null;
              return (
                <Pressable key={id} style={styles.chipConjurar} onPress={() => conjurar(id)}>
                  <Text style={styles.chipAprenderTxt}>{a.nome}</Text>
                  <Text style={styles.chipAprenderSub}>
                    {a.custo.valor} {a.custo.recurso}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Divisor label="I · Mestres" />
      {content.mestres.map((m) => (
        <Card key={m.id}>
          <TextoSerif style={{ fontSize: 20 }}>{m.nome}</TextoSerif>
          <TextoMono>{m.dominio} · {m.localBase}</TextoMono>
          <Text style={styles.mestreMec}>{m.mecanicaUnica}</Text>
          <TextoMono style={{ color: cores.linha, marginTop: 4 }}>custo: {m.custo}</TextoMono>
        </Card>
      ))}

      <Divisor label="II · Trabalhos" />
      {content.trabalhos.map((t) => (
        <View key={t.id} style={styles.livroLinha}>
          <View style={{ flex: 1 }}>
            <Text style={styles.livroNome}>{t.nome}</Text>
            <TextoMono>{t.tipo} · {t.renda >= 0 ? `+${t.renda}` : t.renda} moedas / {t.periodosPorCiclo}p</TextoMono>
          </View>
        </View>
      ))}

      <Divisor label="III · Artes" />
      {content.artes.map((a) => {
        const conhecida = p.artesConhecidas.includes(a.id);
        return (
          <View key={a.id} style={styles.livroLinha}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.livroNome, conhecida ? { color: cores.verdigris } : null]}>
                {conhecida ? '✦ ' : ''}
                {a.nome}
              </Text>
              <TextoMono>{a.escola} · {a.efeito}</TextoMono>
            </View>
            <Selo texto={a.grau} cor={corGrauReliquia(a.grau)} />
          </View>
        );
      })}

      <Divisor label="IV · Relíquias" />
      {content.reliquias.map((r) => (
        <Card key={r.id} acento={corGrauReliquia(r.grau)}>
          <View style={styles.linhaTitulo}>
            <TextoSerif style={{ fontSize: 19 }}>{r.nome}</TextoSerif>
            <Selo texto={r.grau} cor={corGrauReliquia(r.grau)} />
          </View>
          <TextoSerif style={{ fontSize: 16, color: cores.mudo, marginTop: 4 }}>{r.descricao}</TextoSerif>
          {r.grau === 'unica' && r.donoAtual && (
            <View style={styles.unica}>
              <Rotulo cor={cores.cinabrio}>Tem dono</Rotulo>
              <Text style={styles.unicaUso}>{r.usoPeloDono}</Text>
              {r.viasDeTomada && (
                <TextoMono style={{ color: cores.linha, marginTop: 4 }}>
                  vias: {r.viasDeTomada.join(' · ')}
                </TextoMono>
              )}
            </View>
          )}
        </Card>
      ))}
    </Pagina>
  );
}

function corGrauReliquia(grau: string): string {
  switch (grau) {
    case 'unica':
    case 'mitica':
      return cores.ouro;
    case 'proibida':
      return cores.cinabrio;
    case 'perdida':
      return cores.violeta;
    case 'rara':
      return cores.verdigris;
    default:
      return cores.mudo;
  }
}

void ({} as EstadoEntrada);

const styles = StyleSheet.create({
  intro: { color: cores.mudo, fontStyle: 'italic', marginBottom: esp.lg },
  attrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: esp.sm },
  attrNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 19 },
  attrVal: { fontFamily: fontes.monoMedium, color: cores.vellum, fontSize: 16 },
  attrMod: { color: cores.mudo, fontSize: 13 },
  invItem: { fontFamily: fontes.serif, color: cores.vellum, fontSize: 17, textTransform: 'capitalize' },
  pressaoDesc: { color: cores.linha, fontSize: 10, marginTop: 1 },
  derivGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.md },
  derivItem: { width: '28%', alignItems: 'center', marginBottom: esp.md },
  derivVal: { fontFamily: fontes.monoMedium, color: cores.ouro, fontSize: 22 },
  derivNome: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: esp.sm },
  segredo: { marginTop: esp.md, paddingTop: esp.md, borderTopWidth: 1, borderTopColor: cores.linha },
  mestreMec: { fontFamily: fontes.serif, color: cores.ouro, fontSize: 16, marginTop: esp.sm, fontStyle: 'italic' },
  livroLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: esp.sm,
    borderBottomWidth: 1,
    borderBottomColor: cores.fundo3,
    gap: esp.sm,
  },
  livroNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 17 },
  unica: { marginTop: esp.md, paddingTop: esp.sm, borderTopWidth: 1, borderTopColor: cores.linha },
  unicaUso: { fontFamily: fontes.serif, color: cores.vellum, fontSize: 15, marginTop: 2, fontStyle: 'italic' },
  chipAprender: {
    borderWidth: 1,
    borderColor: cores.verdigris,
    borderRadius: 6,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
  },
  chipConjurar: {
    borderWidth: 1,
    borderColor: cores.violeta,
    borderRadius: 6,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
  },
  chipAprenderTxt: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 15 },
  chipAprenderSub: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10 },
  questObj: { flexDirection: 'row', gap: esp.sm, alignItems: 'flex-start', marginTop: 4 },
  questCheck: { fontFamily: fontes.mono, fontSize: 13 },
});
