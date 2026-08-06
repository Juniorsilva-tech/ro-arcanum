// ARCANUM · Tela de combate por turnos (GDD §16, §17).
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextoSerif, TextoMono, Medidor, Divisor, Botao } from '../components';
import { cores, fontes, esp, raio } from '../theme';
import { useGame } from '../store';
import { itemPorId } from '@/engine';

export function Combate() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const combAtacar = useGame((s) => s.combAtacar);
  const combDefender = useGame((s) => s.combDefender);
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
  const inimigos = s.atores.filter((a) => !a.ehJogador);
  const jog = s.atores.find((a) => a.ehJogador)!;
  const alvoVivo = inimigos.find((i) => i.vida > 0);

  const artes = content.artes.filter((a) => p.artesConhecidas.includes(a.id));
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
              onPress={() => combAtacar(i.id)}
              style={({ pressed }) => [
                styles.inimigo,
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
              {i.vida > 0 && !s.terminado && <Text style={styles.atacar}>atacar ›</Text>}
            </Pressable>
          ))}
          {inimigos.length === 0 && <TextoMono>Ninguém à frente.</TextoMono>}
        </View>

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
              toque num inimigo para atacar · ou:
            </TextoMono>
            <View style={styles.botoesLinha}>
              <Acao nome="Defender" onPress={combDefender} />
              <Acao nome="Fugir" cor={cores.mudo} onPress={combFugir} />
            </View>

            {artes.length > 0 && (
              <>
                <Divisor label="conjurar" />
                <View style={styles.chips}>
                  {artes.map((a) => (
                    <Pressable
                      key={a.id}
                      style={styles.chipArte}
                      onPress={() => combConjurar(a.id, alvoVivo?.id)}
                    >
                      <Text style={styles.chipArteTxt}>{a.nome}</Text>
                      <Text style={styles.chipArteSub}>
                        {a.custo.valor} {a.custo.recurso}
                      </Text>
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
