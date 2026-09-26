// ARCANUM · Fim de capítulo (paywall diegético) e Configurações (GDD §26, §28, §33, §36).
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { Pagina, BarraVoltar } from './_layout';
import { Titulo, TextoSerif, TextoMono, Botao, Card, Divisor, Rotulo, Carregando } from '../components';
import { cores, fontes, esp, raio } from '../theme';
import { useGame } from '../store';
import type { ModeloOR } from '@/engine';
import {
  SUGESTOES_OPENROUTER,
  SUGESTOES_NOUS,
  MODELO_PADRAO_OPENROUTER,
  MODELO_PADRAO_ANTHROPIC,
  MODELO_PADRAO_NOUS,
  perfilDoModelo,
  MODELOS_PARA_CENA_ADULTA,
  agruparPorFabricante,
  todosNpcs,
  obterTokenNousAtual,
} from '@/engine';
import { COORDENADAS_LOCAIS } from '@/content/vaelhorn/mapa';
import {
  CRONICAS_MAPA,
  DEUSES_PRIMORDIAIS,
  BRUXAS_DOS_PECADOS,
  FACCOES_ANTIGAS,
} from '@/content/vaelhorn/cosmologia';

// As sugestões estáticas entram na mesma vitrine dos modelos vivos.
function comoModelo(id: string): ModeloOR {
  return {
    id,
    nome: id,
    free: id.endsWith(':free'),
    moderado: false,
    perfil: perfilDoModelo(id),
    contexto: 0,
  };
}

// ─────────────────────────────────────────────── FIM DE CAPÍTULO
export function FimCapitulo() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const proximo = useGame((s) => s.proximoCapitulo);
  const irPara = useGame((s) => s.irPara);
  const p = camp.personagem;

  const conhecidos = todosNpcs(content, camp).filter((n) => (camp.npcState[n.id]?.memoria.length ?? 0) > 0);

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
        {content.cenario.pressoes.map((pr) => (
          <Linha key={pr.id} rotulo={pr.nome} valor={`${Math.round(p.pressoes[pr.id] ?? 0)}/100`} />
        ))}

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
  const exportarSave = useGame((s) => s.exportarSave);
  const importarSave = useGame((s) => s.importarSave);

  const buscarModelos = useGame((s) => s.buscarModelosGratis);
  const testarAdultoStore = useGame((s) => s.testarSeNarraAdulto);
  const testarNarr = useGame((s) => s.testarNarracaoReal);

  const [chave, setChave] = useState(config.apiKey ?? '');
  const [modelo, setModelo] = useState(config.modelo);
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [modelosVivos, setModelosVivos] = useState<ModeloOR[] | null>(null);
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
      const semFiltro = lista.filter((m) => m.perfil === 'permissivo' && !m.moderado).length;
      setResultado(
        `${lista.length} modelos que servem para narrar (música, código e classificadores ` +
          `foram descartados). ${semFiltro} costumam escrever cena adulta — são os de cima.`,
      );
    }
  }

  async function trocarProvider(p: 'openrouter' | 'anthropic' | 'nous') {
    const novoModelo =
      p === 'openrouter'
        ? MODELO_PADRAO_OPENROUTER
        : p === 'nous'
          ? MODELO_PADRAO_NOUS
          : MODELO_PADRAO_ANTHROPIC;
    setModelo(novoModelo);
    setModelosVivos(null);
    setResultado(null);
    let novaChave = chave;
    if (p === 'nous' && (chave.startsWith('sk-or-') || chave.startsWith('sk-ant-'))) {
      novaChave = '';
      setChave('');
    } else if (p === 'openrouter' && (chave.startsWith('sk-ant-') || chave.length > 200)) {
      novaChave = '';
      setChave('');
    }
    await setConfig({ provider: p, modelo: novoModelo, apiKey: novaChave.trim() || undefined });
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

  async function renovarHermes() {
    setTestando(true);
    setResultado(null);
    const { renovarTokenNous } = await import('@/engine');
    const novo = await renovarTokenNous(true);
    setTestando(false);
    if (novo) {
      setResultado('✓ Conexão com Hermes renovada com sucesso! Agora você pode testar ou jogar.');
    } else {
      setResultado('Não foi possível renovar via Hermes local. Execute "hermes auth login nous" no terminal ou use uma chave permanente.');
    }
  }

  // A pergunta que nenhum slug responde. Aqui a gente pergunta ao modelo.
  async function testarAdulto() {
    const mod = modelo.trim();
    if (chave.trim()) {
      await salvarChave();
    }
    setTestando(true);
    setResultado(null);
    const r = await testarAdultoStore(mod);
    setTestando(false);
    if (r.erro) {
      setResultado(`NÃO DEU PARA TESTAR (${mod}): ${r.erro}`);
      return;
    }
    if (r.recusou) {
      setResultado(
        `ESTE MODELO RECUSA (${mod}).\n\nEle respondeu com um pedido de desculpas em vez da cena:\n\n` +
          `"${r.amostra}…"\n\n` +
          'Escolha outro modelo nas sugestões e teste de novo.',
      );
      return;
    }
    setResultado(
      `ESTE MODELO NARRA (${mod}). Ele escreveu a cena pedida:\n\n"${r.amostra}…"\n\n` +
        'Pode voltar ao jogo.',
    );
  }

  async function testarNarracao() {
    const mod = modelo.trim();
    if (chave.trim()) {
      await salvarChave();
    }
    setTestando(true);
    setResultado(null);
    const r = await testarNarr(mod);
    setTestando(false);
    if (r.ok) {
      setResultado(
        `FUNCIONOU (${r.modelo}). A IA escreveu:\n\n"${r.amostra}…"\n\n` +
          'Agora ligue o botão acima e volte ao jogo.',
      );
    } else {
      setResultado(`NÃO FUNCIONOU (${mod}): ${r.erro}`);
    }
  }

  const ehOR = provider === 'openrouter';
  const ehNous = provider === 'nous';

  const tokenHermes = (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_NOUS_API_KEY : undefined) || (ehNous ? obterTokenNousAtual() : undefined);
  const temChaveEfetiva = !!(config.apiKey || (ehNous && tokenHermes));

  const [resultadoDiagnostico, setResultadoDiagnostico] = useState<string | null>(null);

  function executarDiagnosticoNoJogo() {
    try {
      const pontos = Object.keys(COORDENADAS_LOCAIS).length;
      const cronicas = Object.keys(CRONICAS_MAPA).length;
      const deuses = DEUSES_PRIMORDIAIS.length;
      const bruxas = BRUXAS_DOS_PECADOS.length;
      const faccoes = FACCOES_ANTIGAS.length;
      const invejosa = BRUXAS_DOS_PECADOS.find((b) => b.id === 'inveja');

      if (pontos !== cronicas) {
        setResultadoDiagnostico(`⚠️ Alerta: Coordenadas (${pontos}) difere de Crônicas (${cronicas}).`);
        return;
      }
      if (!invejosa) {
        setResultadoDiagnostico('⚠️ Erro: a Invejosa não está entre as Pecadoras.');
        return;
      }

      setResultadoDiagnostico(
        `✓ DIAGNÓSTICO DO JOGO EXECUTADO COM SUCESSO!\n\n` +
        `• ${pontos} pontos do mapa com crônicas vivas, deuses e marcas de bruxas mapeadas.\n` +
        `• ${deuses} Deuses Primordiais (Sol-Voraz, Vandul, Yrmara, Vintrath).\n` +
        `• ${bruxas} Pecadoras queimadas pela Ordem, com a Invejosa (Ysmera).\n` +
        `• ${faccoes} Facções e Ordens Antigas integradas.\n` +
        `• Sistema cognitivo de NPCs e Intimidade em conformidade.\n` +
        `• Todos os sistemas ativos e sem falhas!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResultadoDiagnostico(`⚠️ Erro no diagnóstico: ${msg}`);
    }
  }

  return (
    <Pagina>
      <BarraVoltar titulo="Configurações" />

      <Divisor label="O narrador" />
      <TextoSerif style={styles.explica}>
        Quem escreve ARCANUM é o modelo — não existe narração de reserva. Sem uma chave
        salva aqui, a história não anda. Recomendado: OpenRouter ou Nous Research (Hermes),
        que dão acesso a modelos gratuitos e sem filtro. A chave fica só neste aparelho e nunca vai no APK.
      </TextoSerif>

      <View style={[styles.estadoBox, temChaveEfetiva ? styles.estadoOk : styles.estadoFalta]}>
        <Text style={[styles.estadoTxt, temChaveEfetiva ? styles.estadoTxtOk : styles.estadoTxtFalta]}>
          {temChaveEfetiva ? 'Narrador ativo — a história pode andar.' : 'Sem chave: a história está parada.'}
        </Text>
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
          style={[styles.provBtn, ehNous && styles.provBtnAtivo]}
          onPress={() => trocarProvider('nous')}
        >
          <Text style={[styles.provTxt, ehNous && styles.provTxtAtivo]}>Nous (Hermes)</Text>
          <Text style={styles.provSub}>Solar · StepFun · Hermes</Text>
        </Pressable>
        <Pressable
          style={[styles.provBtn, provider === 'anthropic' && styles.provBtnAtivo]}
          onPress={() => trocarProvider('anthropic')}
        >
          <Text style={[styles.provTxt, provider === 'anthropic' && styles.provTxtAtivo]}>Anthropic</Text>
          <Text style={styles.provSub}>Claude</Text>
        </Pressable>
      </View>

      <Rotulo>
        {ehOR
          ? 'Chave da API (OpenRouter)'
          : ehNous
            ? 'Token / Chave da API (Nous Research / Hermes)'
            : 'Chave da API (x-api-key)'}
      </Rotulo>
      <TextInput
        style={styles.input}
        value={chave}
        onChangeText={(t) => {
          setChave(t);
          setConfig({ apiKey: t.trim() || undefined });
        }}
        placeholder={ehOR ? 'sk-or-v1-…' : ehNous ? (tokenHermes ? 'Token do Hermes ativo (renovação automática)…' : 'Token JWT ou API key da Nous…') : 'sk-ant-…'}
        placeholderTextColor={cores.linha}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!!chave.trim() ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: esp.xs }}>
          <TextoMono style={{ color: cores.verdigris }}>chave salva neste aparelho ✓</TextoMono>
          {ehNous && tokenHermes && (
            <Pressable
              onPress={async () => {
                setChave('');
                await setConfig({ apiKey: undefined });
                setResultado('Usando token automático do Hermes (renovação contínua) ✓');
              }}
            >
              <TextoMono style={{ color: cores.ouro, fontSize: 11 }}>[Usar token do Hermes]</TextoMono>
            </Pressable>
          )}
        </View>
      ) : ehNous && tokenHermes ? (
        <TextoMono style={{ color: cores.verdigris, marginBottom: esp.xs }}>
          Token do Hermes ativo com renovação automática imperceptível ✓
        </TextoMono>
      ) : null}
      {ehOR && (
        <TextoMono style={{ color: cores.linha, marginBottom: esp.sm }}>
          Crie a chave grátis em openrouter.ai/keys
        </TextoMono>
      )}
      {ehNous && (
        <TextoMono style={{ color: cores.linha, marginBottom: esp.sm }}>
          Nous Research / Hermes: token sincronizado de ~/.hermes/auth.json ou insira sua chave
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
        placeholder={ehOR ? MODELO_PADRAO_OPENROUTER : ehNous ? MODELO_PADRAO_NOUS : MODELO_PADRAO_ANTHROPIC}
        placeholderTextColor={cores.linha}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {(ehOR || ehNous) && (
        <View style={{ marginBottom: esp.md }}>
          <TextoMono style={{ color: cores.mudo, marginBottom: esp.xs }}>
            Para cena adulta (toque para usar):
          </TextoMono>
          {/* Agrupado por fabricante: a lista crua misturava marcas e o mesmo
              nome aparecia em pontos distantes. A ordem dos grupos segue a
              primeira aparicao na lista, entao a Nous continua no topo. */}
          {agruparPorFabricante(MODELOS_PARA_CENA_ADULTA).map((grupo) => (
            <View key={grupo.fabricante} style={{ marginBottom: esp.sm }}>
              <TextoMono style={styles.fabricante}>{grupo.fabricante.toUpperCase()}</TextoMono>
              {grupo.modelos.map((m) => (
                <Pressable
                  key={m.id}
                  style={[styles.linhaRec, modelo === m.id && styles.linhaRecAtiva]}
                  onPress={() => {
                    setModelo(m.id);
                    setConfig({ modelo: m.id });
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recId}>{m.id.split('/')[1]?.replace(':free', '') ?? m.id}</Text>
                    <Text style={styles.recNota}>{m.nota}</Text>
                  </View>
                  <Text style={[styles.recSelo, m.pago ? styles.recPago : styles.recGratis]}>
                    {m.pago ? 'crédito' : 'grátis'}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
          <TextoMono style={{ color: cores.linha, marginTop: esp.xs }}>
            Os ":free" vivem caindo e, quando existem, costumam vir de provedor que modera —
            por isso travam. Os de cima custam frações de centavo por cena: dez dólares de
            crédito duram muito e resolvem de vez.
          </TextoMono>
        </View>
      )}

      {(ehOR || ehNous) && (
        <View style={{ marginBottom: esp.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: esp.xs }}>
            <TextoMono style={{ color: cores.mudo, flex: 1 }}>
              {modelosVivos
                ? (ehNous ? 'Modelos disponíveis na Nous Research:' : 'Modelos gratuitos da sua conta:')
                : (ehNous ? 'Sugestões Nous / Hermes (toque para usar):' : 'Sugestões (toque para usar):')}
            </TextoMono>
            <Pressable style={styles.buscarBtn} onPress={buscar}>
              <Text style={styles.buscarTxt}>{buscando ? '…' : 'Buscar modelos'}</Text>
            </Pressable>
          </View>
          <View style={styles.chipsSug}>
            {(modelosVivos ?? (ehNous ? SUGESTOES_NOUS : SUGESTOES_OPENROUTER).map(comoModelo)).slice(0, 40).map((m) => {
              const filtrado = m.perfil === 'estrito' || m.moderado;
              return (
                <Pressable
                  key={m.id}
                  style={[
                    styles.chipSug,
                    m.perfil === 'permissivo' && !m.moderado && styles.chipLivre,
                    filtrado && styles.chipFiltrado,
                    modelo === m.id && styles.chipSugAtivo,
                  ]}
                  onPress={() => {
                    setModelo(m.id);
                    setConfig({ modelo: m.id });
                  }}
                >
                  <Text style={styles.chipSugTxt}>{m.id.replace(':free', '')}</Text>
                  <Text
                    style={[
                      styles.chipEtiqueta,
                      m.perfil === 'permissivo' && !m.moderado
                        ? styles.etiquetaLivre
                        : filtrado
                          ? styles.etiquetaFiltrado
                          : styles.etiquetaNeutro,
                    ]}
                  >
                    {m.perfil === 'permissivo' && !m.moderado
                      ? 'costuma narrar sexo'
                      : filtrado
                        ? m.moderado
                          ? 'provedor modera'
                          : 'costuma recusar'
                        : 'não se sabe · teste'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextoMono style={{ color: cores.linha, marginTop: esp.xs }}>
            As etiquetas são um palpite pela linhagem do modelo. Quem responde de verdade é o
            botão "Este modelo narra sexo?" — ele pergunta ao próprio modelo.
          </TextoMono>
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
      <Botao
        titulo={`Testar narração (${(modelo || '').split('/')[1]?.replace(':free', '') || modelo || 'ativo'})`}
        sub="testa este modelo específico com o prompt real do jogo (sem fallback)"
        variante="acento"
        onPress={testarNarracao}
      />
      <Botao
        titulo={`Este modelo narra romance/adulto? (${(modelo || '').split('/')[1]?.replace(':free', '') || modelo || 'ativo'})`}
        sub="pede uma cena íntima e diz se ele escreveu ou recusou"
        variante="acento"
        onPress={testarAdulto}
      />
      {ehNous && (
        <Botao
          titulo="Renovar conexão com Hermes (Nous)"
          sub="sincroniza e renova a sessão OAuth local automaticamente"
          variante="acento"
          onPress={renovarHermes}
        />
      )}
      {testando && <Carregando texto="testando…" />}
      {resultado && <TextoMono style={{ color: cores.ouro, marginTop: esp.sm }}>{resultado}</TextoMono>}

      <View style={styles.avisoSeg}>
        <TextoMono style={{ color: cores.mudo }}>
          A chave fica só neste aparelho e vai direto para {ehOR ? 'a OpenRouter' : ehNous ? 'a Nous Research' : 'a Anthropic'}.
          Nunca é embutida no app nem enviada a terceiros. O uso é cobrado (ou consome a cota grátis)
          na sua conta.
        </TextoMono>
      </View>

      <Divisor label="Testes do Sistema & Diagnóstico" />
      <Botao
        titulo="Executar Autodiagnóstico no Jogo"
        sub="testa os 67 pontos do mapa, cosmologia, deuses, bruxas e integridade"
        variante="acento"
        onPress={executarDiagnosticoNoJogo}
      />
      {resultadoDiagnostico && (
        <View style={styles.cardDiagnostico}>
          <TextoMono style={{ color: cores.verdigris, fontSize: 11, lineHeight: 18 }}>
            {resultadoDiagnostico}
          </TextoMono>
        </View>
      )}

      {temSave && (
        <>
          <Divisor label="Campanha" />
          <Botao
            titulo="Exportar save (.json)"
            sub="baixa um arquivo com sua campanha completa"
            variante="acento"
            onPress={exportarSave}
          />
          {/* input nativo de arquivo — invisível, ativado pelo botão abaixo */}
          <Pressable
            style={styles.botaoImportar}
            onPress={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json,application/json';
              input.onchange = (ev: Event) => {
                const file = (ev.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                  const texto = e.target?.result;
                  if (typeof texto === 'string') void importarSave(texto);
                };
                reader.readAsText(file, 'utf-8');
              };
              input.click();
            }}
          >
            <Text style={styles.botaoImportarTxt}>Importar save (.json)</Text>
            <Text style={styles.botaoImportarSub}>carrega uma campanha exportada anteriormente</Text>
          </Pressable>
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
  fabricante: {
    color: cores.ouro,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: esp.sm,
    marginBottom: esp.xs,
  },
  botaoImportar: {
    borderWidth: 1,
    borderColor: cores.verdigris,
    borderRadius: raio.md,
    padding: esp.md,
    marginBottom: esp.sm,
    alignItems: 'center',
  },
  botaoImportarTxt: {
    fontFamily: fontes.serifMedium,
    color: cores.verdigris,
    fontSize: 16,
  },
  botaoImportarSub: {
    fontFamily: fontes.mono,
    color: cores.mudo,
    fontSize: 11,
    marginTop: 2,
  },

  cartelaSelo: { letterSpacing: 3, color: cores.mudo, marginBottom: esp.sm },
  fecho: { color: cores.vellum, fontSize: 20, lineHeight: 30 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: esp.sm },
  linhaRot: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 12 },
  linhaVal: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 18 },
  planoNota: { marginTop: esp.xl, paddingTop: esp.md, borderTopWidth: 1, borderTopColor: cores.linha },
  explica: { color: cores.mudo, fontSize: 17, lineHeight: 25, marginBottom: esp.lg },
  estadoBox: {
    borderWidth: 1,
    borderRadius: raio.md,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
    marginBottom: esp.md,
  },
  estadoOk: { borderColor: cores.verdigris, backgroundColor: cores.fundo2 },
  estadoFalta: { borderColor: cores.cinabrio, backgroundColor: cores.fundo2 },
  estadoTxt: { fontFamily: fontes.monoMedium, fontSize: 12 },
  estadoTxtOk: { color: cores.verdigris },
  estadoTxtFalta: { color: cores.cinabrio },
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
  linhaRec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: esp.sm,
    borderWidth: 1,
    borderColor: cores.fundo3,
    borderRadius: raio.sm,
    paddingHorizontal: esp.sm,
    paddingVertical: 6,
    marginBottom: 4,
  },
  linhaRecAtiva: { borderColor: cores.ouro, backgroundColor: cores.fundo2 },
  recId: { fontFamily: fontes.mono, color: cores.vellum, fontSize: 10 },
  recNota: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 9, marginTop: 1 },
  recSelo: { fontFamily: fontes.mono, fontSize: 9 },
  recGratis: { color: cores.verdigris },
  recPago: { color: cores.ouro },
  chipSug: {
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.sm,
    paddingHorizontal: esp.sm,
    paddingVertical: 4,
  },
  chipSugAtivo: { borderColor: cores.ouro, backgroundColor: cores.fundo3 },
  chipLivre: { borderColor: cores.verdigris },
  chipFiltrado: { borderColor: cores.linha, opacity: 0.65 },
  chipSugTxt: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10 },
  chipEtiqueta: { fontFamily: fontes.mono, fontSize: 8, letterSpacing: 0.5, marginTop: 1 },
  etiquetaLivre: { color: cores.verdigris },
  etiquetaFiltrado: { color: cores.cinabrio },
  etiquetaNeutro: { color: cores.linha },
  buscarBtn: {
    borderWidth: 1,
    borderColor: cores.verdigris,
    borderRadius: raio.sm,
    paddingHorizontal: esp.sm,
    paddingVertical: 4,
  },
  buscarTxt: { fontFamily: fontes.mono, color: cores.verdigris, fontSize: 11 },
  cardDiagnostico: {
    marginTop: esp.sm,
    backgroundColor: 'rgba(12, 22, 18, 0.95)',
    borderWidth: 1,
    borderColor: cores.verdigris,
    borderRadius: raio.sm,
    padding: esp.md,
  },
});
