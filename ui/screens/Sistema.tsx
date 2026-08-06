// ARCANUM · Fim de capítulo (paywall diegético) e Configurações (GDD §26, §28, §33, §36).
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, Pressable } from 'react-native';
import { Pagina, BarraVoltar } from './_layout';
import { Titulo, TextoSerif, TextoMono, Botao, Card, Divisor, Rotulo, Carregando } from '../components';
import { cores, fontes, esp, raio } from '../theme';
import { useGame } from '../store';
import {
  SUGESTOES_OPENROUTER,
  MODELO_PADRAO_OPENROUTER,
  MODELO_PADRAO_ANTHROPIC,
} from '@/engine';

// ─────────────────────────────────────────────── FIM DE CAPÍTULO
export function FimCapitulo() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const proximo = useGame((s) => s.proximoCapitulo);
  const irPara = useGame((s) => s.irPara);
  const p = camp.personagem;

  const conhecidos = content.npcs.filter((n) => (camp.npcState[n.id]?.memoria.length ?? 0) > 0);

  return (
    <Pagina>
      <View style={{ marginTop: esp.xl }}>
        <TextoMono style={styles.cartelaSelo}>FIM DO {camp.capitulo.titulo.toUpperCase()}</TextoMono>
        <Titulo style={{ color: cores.ouro, marginBottom: esp.lg }}>O capítulo se fecha</Titulo>

        <TextoSerif style={styles.fecho}>
          A luz baixa sobre {content.locais.find((l) => l.id === camp.localAtual)?.nome}. Você respira,
          e por um instante o mundo para de cobrar. O que ficou, ficou.
        </TextoSerif>

        <Divisor label="o que mudou" />
        <Linha rotulo="Nível" valor={`${p.nivel} · ${p.xp} xp`} />
        <Linha rotulo="No bolso" valor={`${p.dinheiro} moedas`} />
        <Linha rotulo="Sanidade" valor={`${Math.round(p.pressoes.sanidade ?? 0)}/100`} />
        <Linha rotulo="Corrupção" valor={`${Math.round(p.pressoes.corrupcao ?? 0)}/100`} />

        <Divisor label="quem te conhece agora" />
        {conhecidos.length === 0 ? (
          <TextoMono>Ninguém ainda sabe quem você é.</TextoMono>
        ) : (
          <TextoSerif style={{ color: cores.vellum }}>
            {conhecidos.map((n) => n.nome).join(', ')}.
          </TextoSerif>
        )}

        <View style={{ height: esp.xl }} />
        {/* Paywall diegético: o botão de recusa tem o mesmo peso do de conversão (§28). */}
        <Botao titulo="Seguir para o próximo capítulo" variante="acento" onPress={proximo} />
        <Botao titulo="Encerrar por hoje" variante="fantasma" onPress={() => irPara('entrada')} />

        <View style={styles.planoNota}>
          <TextoMono style={{ color: cores.linha, textAlign: 'center' }}>
            No produto completo: Livre 1 capítulo/dia · Premium sem limite · combate nunca consome cota
          </TextoMono>
        </View>
      </View>
    </Pagina>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaRot}>{rotulo}</Text>
      <Text style={styles.linhaVal}>{valor}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────── CONFIGURAÇÕES
export function Config() {
  const config = useGame((s) => s.config);
  const setConfig = useGame((s) => s.setConfig);
  const testar = useGame((s) => s.testarChaveApi);
  const abandonar = useGame((s) => s.abandonar);
  const temSave = useGame((s) => s.temSave);
  const irPara = useGame((s) => s.irPara);

  const buscarModelos = useGame((s) => s.buscarModelosGratis);
  const [chave, setChave] = useState(config.apiKey ?? '');
  const [modelo, setModelo] = useState(config.modelo);
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [modelosVivos, setModelosVivos] = useState<string[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  const provider = config.provider;

  async function buscar() {
    setBuscando(true);
    setResultado(null);
    const lista = await buscarModelos();
    setBuscando(false);
    if (lista.length === 0) {
      setResultado('Não consegui buscar a lista (sem rede ou chave inválida). Use as sugestões.');
    } else {
      setModelosVivos(lista);
      setResultado(`${lista.length} modelos gratuitos encontrados.`);
    }
  }

  async function trocarProvider(p: 'openrouter' | 'anthropic') {
    const novoModelo = p === 'openrouter' ? MODELO_PADRAO_OPENROUTER : MODELO_PADRAO_ANTHROPIC;
    setModelo(novoModelo);
    setResultado(null);
    await setConfig({ provider: p, modelo: novoModelo });
  }

  async function salvarChave() {
    await setConfig({ apiKey: chave.trim() || undefined, modelo: modelo.trim() });
    setResultado(chave.trim() ? 'Chave salva.' : 'Chave removida.');
  }
  async function testarChave() {
    await salvarChave();
    setTestando(true);
    setResultado(null);
    const r = await testar();
    setTestando(false);
    setResultado(r.ok ? 'Chave válida — narração ao vivo pronta.' : `Falhou: ${r.erro}`);
  }

  const ehOR = provider === 'openrouter';

  return (
    <Pagina>
      <BarraVoltar titulo="Configurações" />

      <Divisor label="Narração por IA" />
      <TextoSerif style={styles.explica}>
        Por padrão, ARCANUM narra offline com a biblioteca canônica da engine. Ligue a narração ao
        vivo usando a sua própria chave. Recomendado: OpenRouter, que dá acesso a modelos gratuitos
        e sem filtro.
      </TextoSerif>

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchNome}>Usar o modelo para narrar</Text>
          <TextoMono>quando houver chave e internet</TextoMono>
        </View>
        <Switch
          value={config.usarModelo}
          onValueChange={(v) => setConfig({ usarModelo: v })}
          trackColor={{ true: cores.verdigris, false: cores.linha }}
          thumbColor={cores.vellum}
        />
      </View>

      <Rotulo>Provedor</Rotulo>
      <View style={styles.providerRow}>
        <Pressable
          style={[styles.provBtn, ehOR && styles.provBtnAtivo]}
          onPress={() => trocarProvider('openrouter')}
        >
          <Text style={[styles.provTxt, ehOR && styles.provTxtAtivo]}>OpenRouter</Text>
          <Text style={styles.provSub}>grátis · sem filtro</Text>
        </Pressable>
        <Pressable
          style={[styles.provBtn, !ehOR && styles.provBtnAtivo]}
          onPress={() => trocarProvider('anthropic')}
        >
          <Text style={[styles.provTxt, !ehOR && styles.provTxtAtivo]}>Anthropic</Text>
          <Text style={styles.provSub}>Claude</Text>
        </Pressable>
      </View>

      <Rotulo>{ehOR ? 'Chave da API (OpenRouter)' : 'Chave da API (x-api-key)'}</Rotulo>
      <TextInput
        style={styles.input}
        value={chave}
        onChangeText={(t) => {
          // Salva enquanto digita: não dá para o jogador esquecer de tocar "Salvar".
          setChave(t);
          setConfig({ apiKey: t.trim() || undefined });
        }}
        placeholder={ehOR ? 'sk-or-v1-…' : 'sk-ant-…'}
        placeholderTextColor={cores.linha}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!!chave.trim() && (
        <TextoMono style={{ color: cores.verdigris, marginBottom: esp.xs }}>
          chave salva neste aparelho ✓
        </TextoMono>
      )}
      {ehOR && (
        <TextoMono style={{ color: cores.linha, marginBottom: esp.sm }}>
          Crie a chave grátis em openrouter.ai/keys
        </TextoMono>
      )}

      <Rotulo>Modelo</Rotulo>
      <TextInput
        style={styles.input}
        value={modelo}
        onChangeText={(t) => {
          setModelo(t);
          setConfig({ modelo: t.trim() });
        }}
        placeholder={ehOR ? MODELO_PADRAO_OPENROUTER : MODELO_PADRAO_ANTHROPIC}
        placeholderTextColor={cores.linha}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {ehOR && (
        <View style={{ marginBottom: esp.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: esp.xs }}>
            <TextoMono style={{ color: cores.mudo, flex: 1 }}>
              {modelosVivos ? 'Modelos gratuitos da sua conta:' : 'Sugestões (toque para usar):'}
            </TextoMono>
            <Pressable style={styles.buscarBtn} onPress={buscar}>
              <Text style={styles.buscarTxt}>{buscando ? '…' : 'Buscar modelos'}</Text>
            </Pressable>
          </View>
          <View style={styles.chipsSug}>
            {(modelosVivos ?? SUGESTOES_OPENROUTER).slice(0, 40).map((m) => (
              <Pressable
                key={m}
                style={[styles.chipSug, modelo === m && styles.chipSugAtivo]}
                onPress={() => {
                  setModelo(m);
                  setConfig({ modelo: m });
                }}
              >
                <Text style={styles.chipSugTxt}>
                  {m.replace(':free', '')}
                  {m.endsWith(':free') ? ' ·free' : ''}
                </Text>
              </Pressable>
            ))}
          </View>
          {!modelosVivos && (
            <TextoMono style={{ color: cores.linha, marginTop: esp.xs }}>
              Se um modelo der 404, toque "Buscar modelos" para pegar a lista atual e grátis.
            </TextoMono>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: esp.sm }}>
        <View style={{ flex: 1 }}>
          <Botao titulo="Salvar" variante="primario" onPress={salvarChave} />
        </View>
        <View style={{ flex: 1 }}>
          <Botao titulo="Testar chave" variante="acento" onPress={testarChave} />
        </View>
      </View>
      {testando && <Carregando texto="testando…" />}
      {resultado && <TextoMono style={{ color: cores.ouro, marginTop: esp.sm }}>{resultado}</TextoMono>}

      <View style={styles.avisoSeg}>
        <TextoMono style={{ color: cores.mudo }}>
          A chave fica só neste aparelho e vai direto para {ehOR ? 'a OpenRouter' : 'a Anthropic'}.
          Nunca é embutida no app nem enviada a terceiros. O uso é cobrado (ou consome a cota grátis)
          na sua conta.
        </TextoMono>
      </View>

      {temSave && (
        <>
          <Divisor label="Campanha" />
          {!confirmarApagar ? (
            <Botao titulo="Abandonar campanha atual" variante="perigo" onPress={() => setConfirmarApagar(true)} />
          ) : (
            <Card acento={cores.cinabrio}>
              <TextoSerif style={{ color: cores.vellum, marginBottom: esp.md }}>
                Isso apaga a campanha salva. Não há como desfazer.
              </TextoSerif>
              <Botao
                titulo="Apagar de vez"
                variante="perigo"
                onPress={async () => {
                  await abandonar();
                  irPara('entrada');
                }}
              />
              <Botao titulo="Cancelar" variante="fantasma" onPress={() => setConfirmarApagar(false)} />
            </Card>
          )}
        </>
      )}
    </Pagina>
  );
}

const styles = StyleSheet.create({
  cartelaSelo: { letterSpacing: 3, color: cores.mudo, marginBottom: esp.sm },
  fecho: { color: cores.vellum, fontSize: 20, lineHeight: 30 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: esp.sm },
  linhaRot: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 12 },
  linhaVal: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 18 },
  planoNota: { marginTop: esp.xl, paddingTop: esp.md, borderTopWidth: 1, borderTopColor: cores.linha },
  explica: { color: cores.mudo, fontSize: 17, lineHeight: 25, marginBottom: esp.lg },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: esp.lg, gap: esp.md },
  switchNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 18 },
  input: {
    fontFamily: fontes.mono,
    color: cores.vellum,
    fontSize: 14,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: 8,
    padding: esp.md,
    marginTop: esp.xs,
    marginBottom: esp.md,
  },
  avisoSeg: {
    marginTop: esp.lg,
    padding: esp.md,
    borderWidth: 1,
    borderColor: cores.fundo3,
    borderRadius: 8,
    backgroundColor: cores.fundo2,
  },
  providerRow: { flexDirection: 'row', gap: esp.sm, marginTop: esp.xs, marginBottom: esp.md },
  provBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.md,
    padding: esp.md,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  provBtnAtivo: { borderColor: cores.ouro, backgroundColor: cores.couro },
  provTxt: { fontFamily: fontes.serifMedium, color: cores.mudo, fontSize: 18 },
  provTxtAtivo: { color: cores.vellum },
  provSub: { fontFamily: fontes.mono, color: cores.linha, fontSize: 10, marginTop: 2 },
  chipsSug: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.xs },
  chipSug: {
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.sm,
    paddingHorizontal: esp.sm,
    paddingVertical: 4,
  },
  chipSugAtivo: { borderColor: cores.ouro },
  chipSugTxt: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10 },
  buscarBtn: {
    borderWidth: 1,
    borderColor: cores.verdigris,
    borderRadius: raio.sm,
    paddingHorizontal: esp.sm,
    paddingVertical: 4,
  },
  buscarTxt: { fontFamily: fontes.mono, color: cores.verdigris, fontSize: 11 },
});
