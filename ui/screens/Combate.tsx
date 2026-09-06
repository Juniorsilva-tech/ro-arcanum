// ARCANUM · Tela de combate por turnos (GDD §16, §17).
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextoSerif, TextoMono, Medidor, Divisor, Botao } from '../components';
import { cores, fontes, esp, raio } from '../theme';
import { useGame } from '../store';
import { itemPorId, artesConhecidasResolvidas } from '@/engine';

export function Combate() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const combAtacar = useGame((s) => s.combAtacar);
  const combDefender = useGame((s) => s.combDefender);
  const combTatica = useGame((s) => s.combTatica);
  const [alvoSelecionado, setAlvoSelecionado] = useState<string>();
  const combConjurar = useGame((s) => s.combConjurar);
  const combUsar = useGame((s) => s.combUsar);
  const combFugir = useGame((s) => s.combFugir);
  const fecharLuta = useGame((s) => s.fecharLuta);

  const s = camp.combate;
  if (!s) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.vazio}>…</Text>
      </SafeAreaView>
    );
  }
  const p = camp.personagem;
  const inimigos = s.atores.filter((a) => !a.ehJogador && !a.ehAliado);
  const aliados = s.atores.filter((a) => a.ehAliado);
  const jog = s.atores.find((a) => a.ehJogador)!;
  const alvoVivo = inimigos.find(i => i.id === alvoSelecionado && i.vida > 0) ?? inimigos.find((i) => i.vida > 0);

  // Inclui artes fundidas pelo jogador (engine/fusao.ts), não só as do
  // catálogo estático — senão um estilo recém-criado nunca aparece aqui.
  const artes = artesConhecidasResolvidas(content, camp);
  const consumiveis = Object.keys(p.inventario)
    .map((id) => itemPorId(content, id))
    .filter((i) => i && i.slot === 'consumivel');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        <View style={styles.cab}>
          <Text style={styles.titulo}>COMBATE · rodada {s.rodada}</Text>
          {s.fase > 1 && <Text style={styles.fase}>FASE {s.fase}</Text>}
        </View>

        {/* Inimigos */}
        <View style={styles.cabPad}>
          {inimigos.map((i) => (
            <Pressable
              key={i.id}
              disabled={s.terminado || i.vida <= 0}
              onPress={() => setAlvoSelecionado(i.id)}
              style={({ pressed }) => [
                styles.inimigo,
                alvoVivo?.id === i.id && { borderColor: cores.ouro },
                i.vida <= 0 && { opacity: 0.35 },
                pressed && i.vida > 0 && { borderColor: cores.cinabrio },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.inimigoNome}>
                  {i.nome} {i.vida <= 0 ? '† caído' : ''}
                </Text>
                <Medidor rotulo="" valor={i.vida} max={i.vidaMax} cor={cores.cinabrio} compacto />
              </View>
              {i.vida > 0 && !s.terminado && <Text style={styles.atacar}>{alvoVivo?.id === i.id ? 'alvo' : 'selecionar'}</Text>}
            </Pressable>
          ))}
          {inimigos.length === 0 && <TextoMono>Ninguém à frente.</TextoMono>}
        </View>

        {aliados.length > 0 && (
          <View style={styles.cabPad}>
            <TextoMono style={{ color: cores.verdigris, marginTop: esp.sm }}>COMPANHEIROS</TextoMono>
            {aliados.map((a) => (
              <View key={a.id} style={[styles.inimigo, styles.aliado, a.vida <= 0 && { opacity: 0.35 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inimigoNome, { color: cores.verdigris }]}>
                    {a.nome} {a.vida <= 0 ? '† caído' : ''}
                  </Text>
                  <Medidor rotulo="" valor={a.vida} max={a.vidaMax} cor={cores.verdigris} compacto />
                </View>
                <TextoMono>def {a.defesa}</TextoMono>
              </View>
            ))}
          </View>
        )}

        {/* Log */}
        <ScrollView style={styles.log} contentContainerStyle={{ padding: esp.md }}>
          {s.log.slice(-14).map((l, idx) => (
            <TextoSerif key={idx} style={styles.logLinha}>
              {l}
            </TextoSerif>
          ))}
        </ScrollView>

        {/* Você */}
        <View style={styles.cabPad}>
          <View style={styles.linhaVida}>
            <Text style={styles.euNome}>{p.nome}</Text>
            <TextoMono style={{ color: cores.mudo }}>
              def {jog.defesa} · acerto {jog.acerto}
            </TextoMono>
          </View>
          <Medidor rotulo="Vida" valor={jog.vida} max={jog.vidaMax} cor={cores.cinabrio} compacto />
          {p.recursos.vigor !== undefined && <Medidor rotulo="Vigor" valor={p.recursos.vigor} max={p.recursosMax.vigor} cor={cores.ouro} compacto />}
          <TextoMono>{[jog.tatico?.sono ? 'sob indução de sono' : '', jog.tatico?.preso ? 'imobilizado' : '', jog.tatico?.veneno ? `veneno: ${jog.tatico.veneno}` : '', jog.tatico?.frio ? 'frio: +2 vigor por forma' : '', s.ambiente?.abrigoSolar ? 'abrigo solar' : 'exposto ao céu'].filter(Boolean).join(' · ')}</TextoMono>
          {p.recursos.mana !== undefined && (
            <Medidor rotulo="Mana" valor={p.recursos.mana} max={p.recursosMax.mana} cor={cores.violeta} compacto />
          )}
        </View>

        {/* Ações */}
        {s.terminado ? (
          <View style={styles.cabPad}>
            <Text style={styles.resultado}>
              {s.resultado === 'vitoria' ? 'VITÓRIA' : s.resultado === 'fuga' ? 'VOCÊ FUGIU' : 'DERROTA'}
            </Text>
            <Botao titulo="Continuar" variante="acento" onPress={fecharLuta} />
          </View>
        ) : (
          <ScrollView style={styles.acoesWrap} contentContainerStyle={{ padding: esp.lg, paddingTop: esp.sm }}>
            <TextoMono style={{ color: cores.mudo, marginBottom: esp.xs }}>
              selecione um alvo e escolha sua ação
            </TextoMono>
            <View style={styles.botoesLinha}>
              <Acao nome="Atacar" onPress={() => alvoVivo && combAtacar(alvoVivo.id)} />
              <Acao nome="Defender" onPress={combDefender} />
              <Acao nome="Fugir" cor={cores.mudo} onPress={combFugir} />
            </View>
            <View style={[styles.chips, { marginTop: esp.sm }]}>
              {!!jog.tatico?.sono && <Acao nome="Despertar" onPress={() => combTatica('despertar')} />}
              {!!jog.tatico?.preso && <Acao nome="Libertar-se" onPress={() => combTatica('libertar')} />}
              <Acao nome="Observar" onPress={() => combTatica('observar', alvoVivo?.id)} />
              <Acao nome="Flanquear" onPress={() => combTatica('flanquear')} />
              <Acao nome="Cobertura" onPress={() => combTatica('cobertura')} />
              <Acao nome="Avançar" onPress={() => combTatica('avancar')} />
              {aliados.some(a => a.vida > 0 && !a.retirado) && <>
                <Acao nome="Grupo: proteger" onPress={() => combTatica('proteger_grupo')} />
                <Acao nome="Grupo: focar" onPress={() => combTatica('focar_grupo')} />
              </>}
              {aliados.filter(a => a.vida > 0 && a.vida <= a.vidaMax * .4 && !a.retirado).map(a => <Acao key={a.id} nome={`Retirar ${a.nome}`} onPress={() => combTatica('retirar_aliado', a.id)} />)}
              {alvoVivo && !alvoVivo.oni && alvoVivo.vida <= alvoVivo.vidaMax * .2 && <Acao nome="Render adversário" onPress={() => combTatica('capturar', alvoVivo.id)} />}
              {!!alvoVivo?.oni && <Acao nome="Decapitar" onPress={() => combTatica('decapitar', alvoVivo.id)} />}
              {!!s.ambiente?.abrigoSolar && <Acao nome="Abrir cobertura" onPress={() => combTatica('expor_sol')} />}
              {camp.localAtual === 'castelo_infinito' && !!camp.flags['matou.nakime'] && <Acao nome="Romper o castelo" onPress={() => combTatica('romper_castelo')} />}
            </View>

            {artes.length > 0 && (
              <>
                <Divisor label="técnicas e artes" />
                <View style={styles.chips}>
                  {artes.map((a) => (
                    <Pressable
                      key={a.id}
                      style={styles.chipArte}
                      onPress={() => combConjurar(a.id, alvoVivo?.id)}
                    >
                      <Text style={styles.chipArteTxt}>{a.nome}</Text>
                      <Text style={styles.chipArteSub}>
                        {a.custo.valor + (a.tecnica && jog.tatico?.frio ? 2 : 0)} {a.custo.recurso}
                        {(jog.recargas?.[a.id] ?? 0) > s.rodada ? ` · recarga ${(jog.recargas?.[a.id] ?? 0) - s.rodada}` : ''}
                      </Text>
                      {!!a.tecnica && <Text style={styles.chipArteSub}>{a.tecnica.descricaoRegra}</Text>}
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {consumiveis.length > 0 && (
              <>
                <Divisor label="usar item" />
                <View style={styles.chips}>
                  {consumiveis.map((i) => (
                    <Pressable key={i!.id} style={styles.chipArte} onPress={() => combUsar(i!.id)}>
                      <Text style={styles.chipArteTxt}>{i!.nome}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            <View style={{ height: esp.xl }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function Acao({ nome, onPress, cor }: { nome: string; onPress: () => void; cor?: string }) {
  return (
    <Pressable style={[styles.acaoBtn, cor ? { borderColor: cor } : null]} onPress={onPress}>
      <Text style={[styles.acaoTxt, cor ? { color: cor } : null]}>{nome}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: cores.bistre },
  wrap: { flex: 1 },
  vazio: { color: cores.mudo, textAlign: 'center', marginTop: 80, fontSize: 32 },
  cab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: esp.lg, paddingTop: esp.sm },
  cabPad: { paddingHorizontal: esp.lg },
  titulo: { fontFamily: fontes.monoMedium, color: cores.cinabrio, fontSize: 13, letterSpacing: 2 },
  fase: { fontFamily: fontes.monoMedium, color: cores.ouro, fontSize: 12, letterSpacing: 1 },
  inimigo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.md,
    padding: esp.md,
    marginTop: esp.sm,
    gap: esp.sm,
  },
  inimigoNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 17 },
  aliado: { borderColor: cores.verdigris, paddingVertical: esp.sm },
  atacar: { fontFamily: fontes.mono, color: cores.cinabrio, fontSize: 12 },
  log: {
    flex: 1,
    marginVertical: esp.sm,
    marginHorizontal: esp.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: cores.fundo3,
  },
  logLinha: { color: cores.vellum, fontSize: 16, lineHeight: 22, marginBottom: 6 },
  linhaVida: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  euNome: { fontFamily: fontes.serifSemi, color: cores.vellum, fontSize: 18 },
  resultado: { fontFamily: fontes.serifSemi, color: cores.ouro, fontSize: 26, textAlign: 'center', marginVertical: esp.md, letterSpacing: 2 },
  acoesWrap: { maxHeight: 220 },
  botoesLinha: { flexDirection: 'row', gap: esp.sm },
  acaoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: raio.md,
    paddingVertical: esp.md,
    alignItems: 'center',
  },
  acaoTxt: { fontFamily: fontes.serifMedium, color: cores.ouro, fontSize: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm },
  chipArte: {
    borderWidth: 1,
    borderColor: cores.violeta,
    borderRadius: raio.sm,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
  },
  chipArteTxt: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 15 },
  chipArteSub: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10 },
});
