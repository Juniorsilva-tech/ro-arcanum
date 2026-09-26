// ARCANUM · Tela de combate por turnos (GDD §16, §17).
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextoSerif, TextoMono, Medidor, Divisor, Botao } from '../components';
import { cores, fontes, esp, raio } from '../theme';
import { useGame } from '../store';
import { itemPorId, artesConhecidasResolvidas, temMarca } from '@/engine';
import type { Item } from '@/engine';

export function Combate() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const combAtacar = useGame((s) => s.combAtacar);
  const combDefender = useGame((s) => s.combDefender);
  const combTatica = useGame((s) => s.combTatica);
  const [alvoSelecionado, setAlvoSelecionado] = useState<string>();
  const [gavetaArmasAberta, setGavetaArmasAberta] = useState<boolean>(false);
  const combConjurar = useGame((s) => s.combConjurar);
  const combUsar = useGame((s) => s.combUsar);
  const combFugir = useGame((s) => s.combFugir);
  const combPagarPedagio = useGame((s) => s.combPagarPedagio);
  const fecharLuta = useGame((s) => s.fecharLuta);
  const alternarSakai = useGame((s) => s.alternarSakaiModoAcao);
  const desequiparSlot = useGame((s) => s.desequiparSlot);

  const s = camp?.combate;
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

  // Animações de dano sofrido / variação de vida
  const vidaAnteriorRef = useRef(jog.vida);
  const [deltaVida, setDeltaVida] = useState<{ valor: number; tipo: 'dano' | 'cura'; key: number } | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const flutuanteAnim = useRef(new Animated.Value(0)).current;

  // Animação da última linha do log e autoscroll
  const logScrollRef = useRef<ScrollView>(null);
  const logAnim = useRef(new Animated.Value(0)).current;
  const logTamanhoAnterior = useRef(s.log.length);

  useEffect(() => {
    const vidaAnterior = vidaAnteriorRef.current;
    if (jog.vida !== vidaAnterior) {
      const diff = jog.vida - vidaAnterior;
      vidaAnteriorRef.current = jog.vida;
      if (diff < 0) {
        // Dano tomado! Trepidação e flash vermelho
        setDeltaVida({ valor: Math.abs(diff), tipo: 'dano', key: Date.now() });
        flutuanteAnim.setValue(0);
        flashAnim.setValue(1);
        shakeAnim.setValue(0);

        Animated.parallel([
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: -8, duration: 45, useNativeDriver: false }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 45, useNativeDriver: false }),
            Animated.timing(shakeAnim, { toValue: -5, duration: 40, useNativeDriver: false }),
            Animated.timing(shakeAnim, { toValue: 5, duration: 40, useNativeDriver: false }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 35, useNativeDriver: false }),
          ]),
          Animated.timing(flashAnim, { toValue: 0, duration: 750, useNativeDriver: false }),
          Animated.timing(flutuanteAnim, { toValue: 1, duration: 1300, useNativeDriver: false }),
        ]).start();
      } else if (diff > 0) {
        // Cura / regeneração
        setDeltaVida({ valor: diff, tipo: 'cura', key: Date.now() });
        flutuanteAnim.setValue(0);
        Animated.timing(flutuanteAnim, { toValue: 1, duration: 1200, useNativeDriver: false }).start();
      }
    }
  }, [jog.vida, shakeAnim, flashAnim, flutuanteAnim]);

  useEffect(() => {
    if (s.log.length !== logTamanhoAnterior.current) {
      logTamanhoAnterior.current = s.log.length;
      logAnim.setValue(0);
      Animated.timing(logAnim, { toValue: 1, duration: 320, useNativeDriver: false }).start();
      const timer = setTimeout(() => {
        logScrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [s.log.length, logAnim]);

  // Equipamentos e desgastes
  const armaAtual = p.equipado.arma ? itemPorId(content, p.equipado.arma, p) : undefined;
  const armaduraAtual = p.equipado.armadura ? itemPorId(content, p.equipado.armadura, p) : undefined;
  const escudoAtual = p.equipado.escudo ? itemPorId(content, p.equipado.escudo, p) : undefined;
  const oleoAtivo = jog.oleoAtivo ?? camp.contratosMonstro?.oleoAtivo;
  const temperaAtiva = (armaduraAtual?.tempera && armaduraAtual.tempera.cargas > 0)
    ? armaduraAtual.tempera
    : (escudoAtual?.tempera && escudoAtual.tempera.cargas > 0)
      ? escudoAtual.tempera
      : undefined;

  // Armas reservas na mochila para troca tática
  const outrasArmas = Object.keys(p.inventario)
    .map((id) => itemPorId(content, id, p))
    .filter((i): i is Item => !!i && i.slot === 'arma' && i.id !== p.equipado.arma && (p.inventario[i.id] ?? 0) > 0);

  // Inclui artes fundidas pelo jogador (engine/fusao.ts)
  const artes = artesConhecidasResolvidas(content, camp);
  const consumiveis = Object.keys(p.inventario)
    .map((id) => itemPorId(content, id, p))
    .filter((i): i is Item => !!i && i.slot === 'consumivel' && (p.inventario[i.id] ?? 0) > 0);

  // Interpolação para o flash de dano no card do jogador
  const flashBorda = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [cores.linha, cores.cinabrio],
  });
  const flashFundo = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [cores.fundo2, 'rgba(191, 78, 49, 0.18)'],
  });

  const flutuanteY = flutuanteAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -22],
  });
  const flutuanteOpacidade = flutuanteAnim.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [1, 0.9, 0],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        {/* Cabeçalho */}
        <View style={styles.cab}>
          <Text style={styles.titulo}>COMBATE · RODADA {s.rodada}</Text>
          {s.fase > 1 && <Text style={styles.fase}>FASE {s.fase}</Text>}
        </View>

        {/* Inimigos */}
        <View style={styles.cabPad}>
          {inimigos.map((i) => {
            const ehAlvo = alvoVivo?.id === i.id;
            const caido = i.vida <= 0;
            return (
              <Pressable
                key={i.id}
                disabled={s.terminado || caido}
                onPress={() => setAlvoSelecionado(i.id)}
                style={({ pressed }) => [
                  styles.inimigo,
                  ehAlvo && styles.inimigoAlvo,
                  caido && styles.atorCaido,
                  pressed && !caido && { borderColor: cores.cinabrio },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.linhaInimigoNome}>
                    <Text style={[styles.inimigoNome, ehAlvo && { color: cores.ouro }]}>
                      {i.nome} {caido ? '† caído' : ''}
                    </Text>
                    {i.oni && <Text style={styles.badgeOni}>ONI</Text>}
                  </View>
                  <Medidor rotulo="" valor={i.vida} max={i.vidaMax} cor={cores.cinabrio} compacto />
                </View>
                {!caido && !s.terminado && (
                  <View style={[styles.btnAlvoTag, ehAlvo && styles.btnAlvoTagAtivo]}>
                    <Text style={[styles.atacar, ehAlvo && { color: cores.ouro }]}>
                      {ehAlvo ? '★ ALVO' : 'FOCAR'}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          {inimigos.length === 0 && <TextoMono>Nenhum oponente em campo.</TextoMono>}
        </View>

        {/* Companheiros Aliados */}
        {aliados.length > 0 && (
          <View style={styles.cabPad}>
            <TextoMono style={{ color: cores.verdigris, marginTop: esp.sm }}>COMPANHEIROS</TextoMono>
            {aliados.map((a) => (
              <View key={a.id} style={[styles.inimigo, styles.aliado, a.vida <= 0 && styles.atorCaido]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inimigoNome, { color: cores.verdigris }]}>
                    {a.nome} {a.vida <= 0 ? '† caído' : a.retirado ? '(retirado)' : ''}
                  </Text>
                  <Medidor rotulo="" valor={a.vida} max={a.vidaMax} cor={cores.verdigris} compacto />
                </View>
                <TextoMono style={{ color: cores.mudo }}>def {a.defesa}</TextoMono>
              </View>
            ))}
          </View>
        )}

        {/* Log de Combate Dramático e Semântico */}
        <ScrollView
          ref={logScrollRef}
          style={styles.log}
          contentContainerStyle={{ padding: esp.md, flexGrow: 1, justifyContent: s.log.length === 0 ? 'center' : 'flex-start' }}
          onContentSizeChange={() => {
            logScrollRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {s.log.length === 0 ? (
            <View style={styles.arenaVaziaCard}>
              <View style={styles.arenaVaziaIconeWrap}>
                <Text style={styles.arenaVaziaIcone}>⚔️</Text>
              </View>
              <Text style={styles.arenaVaziaTitulo}>CONFRONTO INICIADO</Text>
              <Text style={styles.arenaVaziaDesc}>
                Avalie o terreno e a formação dos inimigos. Escolha o alvo prioritário e trace sua ação entre ataque direto, manobra tática ou postura defensiva.
              </Text>
              {alvoVivo && (
                <View style={styles.arenaVaziaAlvoBox}>
                  <Text style={styles.arenaVaziaAlvoLabel}>ALVO PRIORITÁRIO</Text>
                  <Text style={styles.arenaVaziaAlvoNome}>
                    {alvoVivo.nome} · <Text style={{ color: cores.cinabrio }}>{alvoVivo.vida} PV</Text> · def {alvoVivo.defesa}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            s.log.slice(-14).map((linha, idx, arr) => {
              const ehUltima = idx === arr.length - 1;
              return (
                <LinhaLogDramatica
                  key={idx + linha.slice(0, 16)}
                  texto={linha}
                  ehUltima={ehUltima}
                  animOpacidade={ehUltima ? logAnim : undefined}
                />
              );
            })
          )}
        </ScrollView>

        {/* Painel do Jogador com Animação de Dano e Coisas Gastas */}
        <Animated.View
          style={[
            styles.painelJogador,
            {
              borderColor: flashBorda,
              backgroundColor: flashFundo,
              transform: [{ translateX: shakeAnim }],
            },
          ]}
        >
          {/* Badge Flutuante de Dano / Cura */}
          {deltaVida && (
            <Animated.View
              key={deltaVida.key}
              style={[
                styles.badgeFlutuante,
                {
                  opacity: flutuanteOpacidade,
                  transform: [{ translateY: flutuanteY }],
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeFlutuanteTxt,
                  { color: deltaVida.tipo === 'dano' ? cores.cinabrio : cores.verdigris },
                ]}
              >
                {deltaVida.tipo === 'dano' ? `-${deltaVida.valor} PV` : `+${deltaVida.valor} PV`}
              </Text>
            </Animated.View>
          )}

          <View style={styles.linhaVida}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: esp.sm }}>
              <Text style={styles.euNome}>{p.nome}</Text>
              {jog.posicao === 'flanco' && <Text style={styles.tagPosicao}>FLANCO (+3 acerto)</Text>}
              {jog.posicao === 'cobertura' && <Text style={styles.tagPosicao}>COBERTURA (+3 def)</Text>}
            </View>
            <TextoMono style={{ color: cores.mudo }}>
              def {jog.defesa} · acerto {jog.acerto}
            </TextoMono>
          </View>

          {/* Barras de Recursos */}
          <Medidor rotulo="Vida" valor={jog.vida} max={jog.vidaMax} cor={cores.cinabrio} compacto />
          {p.recursos.vigor !== undefined && (
            <Medidor rotulo="Vigor" valor={p.recursos.vigor} max={p.recursosMax.vigor} cor={cores.ouro} compacto />
          )}
          {p.recursos.mana !== undefined && (
            <Medidor rotulo="Mana" valor={p.recursos.mana} max={p.recursosMax.mana} cor={cores.violeta} compacto />
          )}

          {/* Painel de Coisas Gastas & Durabilidade (Gume, Têmpera, Óleos e Aflições) */}
          <View style={styles.coisasGastasWrap}>
            {/* Arma e Afiação */}
            <View style={styles.chipGasto}>
              <Text style={styles.chipGastoIcone}>🗡️</Text>
              <Text style={styles.chipGastoTitulo}>
                {armaAtual ? armaAtual.nome : 'Desarmado'}
              </Text>
              {armaAtual?.corNichirin ? (
                <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '600', marginBottom: 2 }}>
                  ✨ Nichirin {armaAtual.corNichirinNome ?? armaAtual.corNichirin}
                </Text>
              ) : null}
              {armaAtual?.afiacao && armaAtual.afiacao.cargas > 0 ? (
                <Text style={styles.chipGastoValorOuro}>
                  Afiação {armaAtual.afiacao.cargas}/5 (+{armaAtual.afiacao.bonusDano} dano)
                </Text>
              ) : (
                <Text style={styles.chipGastoValorMudo}>
                  {!armaAtual
                    ? 'Golpes desarmados'
                    : armaAtual.raridade === 'proibida' || armaAtual.raridade === 'mitica'
                    ? 'Gume primordial'
                    : armaAtual.raridade === 'rara' || armaAtual.raridade === 'notavel'
                    ? 'Gume afiado'
                    : 'Gume padrão'}
                </Text>
              )}
            </View>

            {/* Têmpera de Armadura / Escudo */}
            {temperaAtiva ? (
              <View style={styles.chipGasto}>
                <Text style={styles.chipGastoIcone}>🛡️</Text>
                <Text style={styles.chipGastoTitulo}>Têmpera</Text>
                <Text style={styles.chipGastoValorVerde}>
                  {temperaAtiva.cargas}/5 (+{temperaAtiva.bonusDefesa} def)
                </Text>
              </View>
            ) : null}

            {/* Óleo Alquímico */}
            {oleoAtivo && oleoAtivo.combatesRestantes > 0 ? (
              <View style={styles.chipGasto}>
                <Text style={styles.chipGastoIcone}>💧</Text>
                <Text style={styles.chipGastoTitulo}>Óleo vs {oleoAtivo.tipoAlvo.toUpperCase()}</Text>
                <Text style={styles.chipGastoValorVioleta}>
                  +{oleoAtivo.bonusDano} dano ({oleoAtivo.combatesRestantes} lutas)
                </Text>
              </View>
            ) : null}

            {/* Condições e Aflições */}
            {!!jog.tatico?.veneno && (
              <View style={[styles.chipGasto, styles.chipGastoAlerta]}>
                <Text style={styles.chipGastoIcone}>☠️</Text>
                <Text style={styles.chipGastoValorAlerta}>Peçonha: {jog.tatico.veneno}</Text>
              </View>
            )}
            {!!jog.tatico?.sono && (
              <View style={[styles.chipGasto, styles.chipGastoVioleta]}>
                <Text style={styles.chipGastoIcone}>💤</Text>
                <Text style={styles.chipGastoValorVioleta}>Indução de sono</Text>
              </View>
            )}
            {!!jog.tatico?.preso && (
              <View style={[styles.chipGasto, styles.chipGastoAlerta]}>
                <Text style={styles.chipGastoIcone}>⛓️</Text>
                <Text style={styles.chipGastoValorAlerta}>Imobilizado</Text>
              </View>
            )}
            {!!jog.tatico?.frio && (
              <View style={styles.chipGasto}>
                <Text style={styles.chipGastoIcone}>❄️</Text>
                <Text style={styles.chipGastoValorMudo}>Frio (+2 vigor)</Text>
              </View>
            )}
            {!!s.ambiente?.abrigoSolar && (
              <View style={styles.chipGasto}>
                <Text style={styles.chipGastoIcone}>🏚️</Text>
                <Text style={styles.chipGastoValorMudo}>Sob abrigo</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Ações de Batalha */}
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

            {/* Ações Primárias */}
            <View style={styles.botoesLinha}>
              <Acao nome="Atacar" onPress={() => alvoVivo && combAtacar(alvoVivo.id)} />
              <Acao nome="Defender" onPress={combDefender} />
              <Acao nome="Fugir" cor={cores.mudo} onPress={combFugir} />
            </View>

            {!!s.bando?.pedagio && s.rodada === 1 && (
              <View style={[styles.botoesLinha, { marginTop: esp.sm }]}>
                <Acao nome={`Pagar ${s.bando.pedagio} moedas`} cor={cores.ouro} onPress={combPagarPedagio} />
              </View>
            )}

            {/* Manobras Táticas e Troca de Armas */}
            <View style={[styles.chips, { marginTop: esp.sm }]}>
              {/* Botão de Troca Tática de Arma */}
              <Acao
                nome={gavetaArmasAberta ? 'Fechar Mochila de Armas' : outrasArmas.length > 0 ? '🔄 Trocar Arma (1 turno)' : '🔄 Trocar Arma (mochila vazia)'}
                cor={outrasArmas.length > 0 ? cores.ouro : cores.mudo}
                onPress={() => setGavetaArmasAberta(!gavetaArmasAberta)}
              />

              {!!jog.tatico?.sono && <Acao nome="Despertar" onPress={() => combTatica('despertar')} />}
              {!!jog.tatico?.preso && <Acao nome="Libertar-se" onPress={() => combTatica('libertar')} />}
              {!!jog.corNichirin && temMarca(camp) && (
                <Acao
                  nome={(jog.laminaCarmesimAte ?? 0) >= s.rodada ? `Lâmina Carmesim (até a rodada ${jog.laminaCarmesimAte})` : 'Lâmina Carmesim · 4 vigor'}
                  cor={cores.cinabrio}
                  onPress={() => combTatica('lamina_carmesim')}
                />
              )}
              <Acao nome="Observar" onPress={() => combTatica('observar', alvoVivo?.id)} />
              <Acao nome="Flanquear" onPress={() => combTatica('flanquear')} />
              <Acao nome="Cobertura" onPress={() => combTatica('cobertura')} />
              <Acao nome="Avançar" onPress={() => combTatica('avancar')} />

              {aliados.some(a => a.vida > 0 && !a.retirado) && (
                <>
                  <Acao nome="Grupo: proteger" onPress={() => combTatica('proteger_grupo')} />
                  <Acao nome="Grupo: focar" onPress={() => combTatica('focar_grupo')} />
                </>
              )}
              {aliados.filter(a => a.vida > 0 && a.vida <= a.vidaMax * 0.4 && !a.retirado).map(a => (
                <Acao key={a.id} nome={`Retirar ${a.nome}`} onPress={() => combTatica('retirar_aliado', a.id)} />
              ))}
              {alvoVivo && !alvoVivo.oni && alvoVivo.vida <= alvoVivo.vidaMax * 0.2 && (
                <Acao nome="Render adversário" onPress={() => combTatica('capturar', alvoVivo.id)} />
              )}
              {!!alvoVivo?.oni && <Acao nome="Decapitar" onPress={() => combTatica('decapitar', alvoVivo.id)} />}
              {!!s.ambiente?.abrigoSolar && <Acao nome="Abrir cobertura" onPress={() => combTatica('expor_sol')} />}
              {camp.localAtual === 'castelo_infinito' && !!camp.flags['matou.nakime'] && (
                <Acao nome="Romper o castelo" onPress={() => combTatica('romper_castelo')} />
              )}
            </View>

            {/* Gaveta de Troca de Armas Tática */}
            {gavetaArmasAberta && (
              <View style={styles.gavetaArmas}>
                <TextoMono style={{ color: cores.ouro, marginBottom: esp.xs }}>
                  ARMAS NA MOCHILA · SACAR CONSOME 1 TURNO
                </TextoMono>
                {outrasArmas.length === 0 ? (
                  <View style={{ paddingVertical: esp.xs }}>
                    <TextoMono style={{ color: cores.mudo, marginBottom: esp.xs }}>
                      Nenhuma arma sobressalente guardada na mochila.
                    </TextoMono>
                    {armaAtual && (
                      <Pressable
                        style={[styles.itemArmaTroca, { borderColor: cores.ouro }]}
                        onPress={() => {
                          setGavetaArmasAberta(false);
                          desequiparSlot('arma');
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.itemArmaNome, { color: cores.ouro }]}>Guardar {armaAtual.nome} (Lutar Desarmado)</Text>
                          <Text style={styles.itemArmaDetalhe}>Guarda a arma na bainha para golpear com socos e chutes.</Text>
                        </View>
                        <View style={styles.btnSacar}>
                          <Text style={styles.btnSacarTxt}>GUARDAR</Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  outrasArmas.map((arma) => {
                    const temAfiado = arma.afiacao && arma.afiacao.cargas > 0;
                    return (
                      <Pressable
                        key={arma.id}
                        style={styles.itemArmaTroca}
                        onPress={() => {
                          setGavetaArmasAberta(false);
                          combTatica('trocar_arma', arma.id);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemArmaNome}>{arma.nome}</Text>
                          <Text style={styles.itemArmaDetalhe}>
                            Dano base {arma.dano?.base ?? 0} ({arma.dano?.tipo ?? 'comum'}) · Peso {arma.peso}
                            {temAfiado ? ` · Afiação (+${arma.afiacao!.bonusDano})` : ''}
                            {arma.contraOni ? ' · Nichirin' : ''}
                            {arma.corNichirinNome ? ` · ${arma.corNichirinNome}` : ''}
                          </Text>
                        </View>
                        <View style={styles.btnSacar}>
                          <Text style={styles.btnSacarTxt}>SACAR</Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}

            {/* Sakai / Domínio do Kai (Tsukimichi) */}
            {p.sakai?.desbloqueado && (
              <>
                <Divisor label={`domínio do kai · ${p.sakai.modoAtivo ? `ativo: ${p.sakai.modoAtivo}` : 'inativo'}`} />
                <View style={styles.chips}>
                  {p.sakai.modosDisponiveis.map((m) => (
                    <Acao
                      key={m}
                      nome={`${p.sakai?.modoAtivo === m ? '✓ ' : ''}Kai: ${m}`}
                      cor={p.sakai?.modoAtivo === m ? cores.ouro : undefined}
                      onPress={() => alternarSakai(m)}
                    />
                  ))}
                </View>
              </>
            )}

            {/* Técnicas e Artes */}
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

            {/* Consumíveis na Mochila */}
            {consumiveis.length > 0 && (
              <>
                <Divisor label="bolsa de combate (itens)" />
                <View style={styles.chips}>
                  {consumiveis.map((i) => {
                    const qtd = p.inventario[i.id] ?? 0;
                    return (
                      <Pressable key={i.id} style={styles.chipConsumivel} onPress={() => combUsar(i.id)}>
                        <Text style={styles.chipArteTxt}>{i.nome}</Text>
                        <Text style={styles.chipConsumivelQtd}>x{qtd}</Text>
                      </Pressable>
                    );
                  })}
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

// Linha do Log com Formatação Dramática e Animação Suave
function LinhaLogDramatica({
  texto,
  ehUltima,
  animOpacidade,
}: {
  texto: string;
  ehUltima: boolean;
  animOpacidade?: Animated.Value;
}) {
  let corTexto: string = cores.vellum;
  let icone = '•';
  let ehAlerta = false;
  let ehDanoSofrido = false;
  let ehCritico = false;

  if (
    texto.startsWith('ALERTA:') ||
    texto.includes('arrancou') ||
    texto.includes('amputado') ||
    texto.includes('decapitou') ||
    texto.includes('PERFURAÇÃO CRÍTICA') ||
    texto.includes('quebrou') ||
    texto.includes('quebra de lâmina')
  ) {
    corTexto = cores.cinabrio;
    icone = '⚠️';
    ehAlerta = true;
  } else if (
    texto.includes('CRÍTICO') ||
    texto.includes('crítico') ||
    texto.includes('ruptura') ||
    texto.includes('ponto vital') ||
    texto.includes('Ruptura de Asora') ||
    texto.includes('💥')
  ) {
    corTexto = '#ffd700';
    icone = '💥';
    ehCritico = true;
  } else if (
    texto.includes('acerta Você') ||
    texto.includes('atinge Você') ||
    texto.includes('Você perde') ||
    texto.includes('colide contra Você') ||
    texto.includes('ataca Você e causa') ||
    texto.includes('Você sofre')
  ) {
    corTexto = cores.cinabrio;
    icone = '🔻';
    ehDanoSofrido = true;
  } else if (
    texto.includes('erra') ||
    texto.includes('esquiva') ||
    texto.includes('morre na guarda') ||
    texto.includes('se desfaz sem causar') ||
    texto.includes('Barreira do Kai')
  ) {
    corTexto = cores.verdigris;
    icone = '🛡️';
  } else if (
    texto.includes('Arte:') ||
    texto.includes('Forma:') ||
    texto.includes('Kai:') ||
    texto.includes('Postura') ||
    texto.includes('sakai') ||
    texto.includes('Respiração')
  ) {
    corTexto = cores.violeta;
    icone = '🌀';
  } else if (
    texto.includes('saca ') ||
    texto.includes('embainha ') ||
    texto.includes('flanqueia') ||
    texto.includes('cobertura')
  ) {
    corTexto = cores.ouro;
    icone = '🔄';
  } else if (
    texto.includes('cai.') ||
    texto.includes('caiu') ||
    texto.includes('sucumbiu') ||
    texto.includes('caído') ||
    texto.includes('subjugado')
  ) {
    corTexto = cores.ouro;
    icone = '†';
  }

  const itemEstilizado = (
    <View
      style={[
        styles.logLinhaContainer,
        ehAlerta && styles.logLinhaAlerta,
        ehDanoSofrido && styles.logLinhaDanoSofrido,
        ehCritico && styles.logLinhaCritico,
      ]}
    >
      <Text style={[styles.logLinhaIcone, { color: corTexto }]}>{icone}</Text>
      <TextoSerif style={[styles.logLinhaTxt, { color: corTexto }]}>{texto}</TextoSerif>
    </View>
  );

  if (ehUltima && animOpacidade) {
    return (
      <Animated.View style={{ opacity: animOpacidade }}>
        {itemEstilizado}
      </Animated.View>
    );
  }

  return itemEstilizado;
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
    backgroundColor: cores.fundo2,
    borderRadius: raio.md,
    padding: esp.md,
    marginTop: esp.sm,
    gap: esp.sm,
  },
  inimigoAlvo: {
    borderColor: cores.ouro,
    backgroundColor: cores.fundo3,
  },
  atorCaido: {
    opacity: 0.35,
  },
  linhaInimigoNome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: esp.xs,
  },
  inimigoNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 17 },
  badgeOni: {
    fontFamily: fontes.monoMedium,
    fontSize: 10,
    color: cores.cinabrio,
    backgroundColor: 'rgba(191, 78, 49, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: 'rgba(191, 78, 49, 0.3)',
  },
  btnAlvoTag: {
    paddingHorizontal: esp.sm,
    paddingVertical: 4,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  btnAlvoTagAtivo: {
    borderColor: cores.ouro,
    backgroundColor: 'rgba(207, 168, 45, 0.12)',
  },
  aliado: { borderColor: cores.verdigris, paddingVertical: esp.sm },
  atacar: { fontFamily: fontes.mono, color: cores.cinabrio, fontSize: 11, letterSpacing: 1 },
  log: {
    flex: 1,
    marginVertical: esp.sm,
    marginHorizontal: esp.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: cores.fundo3,
    backgroundColor: 'rgba(20, 17, 16, 0.5)',
  },
  logLinhaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
    gap: esp.xs,
  },
  logLinhaAlerta: {
    backgroundColor: 'rgba(191, 78, 49, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: cores.cinabrio,
    borderRadius: raio.sm,
  },
  logLinhaCritico: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderLeftWidth: 3,
    borderLeftColor: '#ffd700',
    borderRadius: raio.sm,
  },
  logLinhaDanoSofrido: {
    backgroundColor: 'rgba(191, 78, 49, 0.08)',
    borderLeftWidth: 2,
    borderLeftColor: cores.cinabrio,
  },
  logLinhaIcone: {
    fontFamily: fontes.mono,
    fontSize: 13,
    marginTop: 3,
  },
  logLinhaTxt: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  painelJogador: {
    marginHorizontal: esp.lg,
    padding: esp.md,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.fundo2,
    position: 'relative',
  },
  badgeFlutuante: {
    position: 'absolute',
    top: -12,
    right: esp.lg,
    backgroundColor: cores.fundo3,
    paddingHorizontal: esp.sm,
    paddingVertical: 2,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.linha,
    zIndex: 10,
  },
  badgeFlutuanteTxt: {
    fontFamily: fontes.monoMedium,
    fontSize: 14,
    letterSpacing: 1,
  },
  linhaVida: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  euNome: { fontFamily: fontes.serifSemi, color: cores.vellum, fontSize: 18 },
  tagPosicao: {
    fontFamily: fontes.mono,
    fontSize: 10,
    color: cores.ouro,
    backgroundColor: 'rgba(207, 168, 45, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: raio.sm,
  },
  coisasGastasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: esp.xs,
    marginTop: esp.sm,
    paddingTop: esp.xs,
    borderTopWidth: 1,
    borderTopColor: cores.fundo3,
  },
  chipGasto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.couro,
    paddingHorizontal: esp.sm,
    paddingVertical: 3,
    borderRadius: raio.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  chipGastoAlerta: {
    borderColor: cores.cinabrio,
    backgroundColor: 'rgba(191, 78, 49, 0.15)',
  },
  chipGastoVioleta: {
    borderColor: cores.violeta,
    backgroundColor: 'rgba(130, 114, 174, 0.15)',
  },
  chipGastoIcone: { fontSize: 11 },
  chipGastoTitulo: { fontFamily: fontes.mono, fontSize: 11, color: cores.vellum },
  chipGastoValorOuro: { fontFamily: fontes.monoMedium, fontSize: 11, color: cores.ouro },
  chipGastoValorVerde: { fontFamily: fontes.monoMedium, fontSize: 11, color: cores.verdigris },
  chipGastoValorVioleta: { fontFamily: fontes.monoMedium, fontSize: 11, color: cores.violeta },
  chipGastoValorMudo: { fontFamily: fontes.mono, fontSize: 11, color: cores.mudo },
  chipGastoValorAlerta: { fontFamily: fontes.monoMedium, fontSize: 11, color: cores.cinabrio },
  resultado: {
    fontFamily: fontes.serifSemi,
    color: cores.ouro,
    fontSize: 26,
    textAlign: 'center',
    marginVertical: esp.md,
    letterSpacing: 2,
  },
  acoesWrap: { maxHeight: 230 },
  botoesLinha: { flexDirection: 'row', gap: esp.sm },
  acaoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.ouro,
    borderRadius: raio.md,
    paddingVertical: esp.md,
    alignItems: 'center',
    backgroundColor: 'rgba(207, 168, 45, 0.05)',
  },
  acaoTxt: { fontFamily: fontes.serifMedium, color: cores.ouro, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm },
  gavetaArmas: {
    marginTop: esp.sm,
    padding: esp.md,
    backgroundColor: cores.fundo3,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.linha,
    gap: esp.xs,
  },
  itemArmaTroca: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: esp.sm,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.fundo2,
    marginBottom: 4,
  },
  itemArmaNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 15 },
  itemArmaDetalhe: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11 },
  btnSacar: {
    paddingHorizontal: esp.sm,
    paddingVertical: 4,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.ouro,
    backgroundColor: 'rgba(207, 168, 45, 0.1)',
  },
  btnSacarTxt: { fontFamily: fontes.monoMedium, color: cores.ouro, fontSize: 11 },
  chipArte: {
    borderWidth: 1,
    borderColor: cores.violeta,
    backgroundColor: 'rgba(130, 114, 174, 0.08)',
    borderRadius: raio.sm,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
  },
  chipArteTxt: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 15 },
  chipArteSub: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10 },
  chipConsumivel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: esp.xs,
    borderWidth: 1,
    borderColor: cores.verdigris,
    backgroundColor: 'rgba(95, 161, 135, 0.08)',
    borderRadius: raio.sm,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
  },
  chipConsumivelQtd: {
    fontFamily: fontes.monoMedium,
    color: cores.verdigris,
    fontSize: 12,
  },
  arenaVaziaCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: esp.lg,
    paddingHorizontal: esp.md,
  },
  arenaVaziaIconeWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(207, 168, 45, 0.1)',
    borderWidth: 1,
    borderColor: cores.ouro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: esp.sm,
  },
  arenaVaziaIcone: {
    fontSize: 22,
  },
  arenaVaziaTitulo: {
    fontFamily: fontes.serifSemi,
    fontSize: 16,
    color: cores.ouro,
    letterSpacing: 2,
    marginBottom: 4,
  },
  arenaVaziaDesc: {
    fontFamily: fontes.serif,
    fontSize: 14,
    color: cores.mudo,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 520,
    marginBottom: esp.md,
  },
  arenaVaziaAlvoBox: {
    backgroundColor: cores.fundo2,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.sm,
    paddingVertical: esp.xs,
    paddingHorizontal: esp.md,
    alignItems: 'center',
  },
  arenaVaziaAlvoLabel: {
    fontFamily: fontes.mono,
    fontSize: 9,
    color: cores.mudo,
    letterSpacing: 1,
  },
  arenaVaziaAlvoNome: {
    fontFamily: fontes.serifMedium,
    fontSize: 14,
    color: cores.vellum,
  },
});
