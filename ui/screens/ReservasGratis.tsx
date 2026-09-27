// Reservas grátis em rodízio: chaves de provedores com camada gratuita
// (Groq, Mistral, Gemini, Cerebras). Quando o narrador principal falha — limite
// de uso, rede, recusa —, a cena tenta estas, na ordem da lista. Sem narrador
// principal, elas viram o narrador. Cada chave fica só neste aparelho.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Linking } from 'react-native';
import { TextoMono, Divisor } from '../components';
import { cores, fontes, esp } from '../theme';
import { useGame } from '../store';
import { PROVEDORES_GRATIS, testarChave, testarCenaAdulta, listarModelos, type ProvedorCompat } from '@/engine/llm';

// Ordem do rodízio: quem costuma aceitar ficção adulta primeiro; o Gemini,
// com filtro mais duro, por último.
const ORDEM: ProvedorCompat[] = ['mistral', 'groq', 'cerebras', 'gemini'];

function CartaoReserva({ p }: { p: ProvedorCompat }) {
  const config = useGame((s) => s.config);
  const setConfig = useGame((s) => s.setConfig);
  const info = PROVEDORES_GRATIS[p];
  const atual = (config.reservas ?? []).find((r) => r.provider === p);
  const [chave, setChave] = useState(atual?.apiKey ?? '');
  const [modelo, setModelo] = useState(atual?.modelo ?? '');
  const [estado, setEstado] = useState<string | null>(null);
  // Com a chave, a lista vem da própria conta: são os modelos que ela pode usar hoje.
  const [modelosConta, setModelosConta] = useState<string[] | null>(null);

  async function buscarModelos(k = chave) {
    if (!k.trim()) return;
    const lista = await listarModelos(p, k.trim(), true);
    // Os recomendados, se a conta tiver, vêm primeiro.
    const ids = [...new Set(lista.map((m) => m.id))];
    const peso = (id: string) => (info.sugestoes.includes(id) ? info.sugestoes.indexOf(id) : 100);
    setModelosConta(ids.length ? ids.sort((a, b) => peso(a) - peso(b)) : null);
  }

  useEffect(() => {
    if (atual?.apiKey) void buscarModelos(atual.apiKey);
    // Só ao abrir o cartão; depois, a busca acompanha Salvar e Testar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvar(novaChave = chave, novoModelo = modelo) {
    const outras = (config.reservas ?? []).filter((r) => r.provider !== p);
    const k = novaChave.trim();
    const reservas = k
      ? [...outras, { provider: p, apiKey: k, modelo: novoModelo.trim() || undefined }]
          .sort((a, b) => ORDEM.indexOf(a.provider) - ORDEM.indexOf(b.provider))
      : outras;
    await setConfig({ reservas });
    setEstado(k ? 'salva' : 'removida');
    if (k) void buscarModelos(k);
    else setModelosConta(null);
  }

  async function testar() {
    if (!chave.trim()) return;
    setEstado('testando…');
    await salvar();
    const r = await testarChave({ provider: p, apiKey: chave.trim(), modelo: modelo.trim() || info.modeloPadrao });
    setEstado(r.ok ? 'funciona ✓' : `falhou: ${r.erro ?? 'sem resposta'}`);
  }

  // Sexo é parte do jogo: o jogador precisa saber, antes da história, se este
  // modelo narra cena adulta ou recusa. Uma chamada curta responde.
  async function testarAdulto() {
    if (!chave.trim()) return;
    setEstado('testando cena adulta…');
    await salvar();
    const r = await testarCenaAdulta({ provider: p, apiKey: chave.trim(), modelo: modelo.trim() || info.modeloPadrao });
    setEstado(
      r.erro
        ? `falhou: ${r.erro}`
        : r.narra
          ? `narra cena adulta ✓ — "${(r.amostra ?? '').slice(0, 110)}…"`
          : 'falhou: recusou a cena adulta (filtro). Tente outro modelo desta lista.',
    );
  }

  return (
    <View style={styles.cartao}>
      <View style={styles.cab}>
        <Text style={styles.nome}>{info.nome}</Text>
        {!!atual && <Text style={styles.ativa}>ativa</Text>}
      </View>
      <TextoMono style={{ color: cores.mudo }}>{info.limite}</TextoMono>
      {!!info.aviso && <TextoMono style={{ color: cores.ouro }}>{info.aviso}</TextoMono>}
      <Pressable onPress={() => void Linking.openURL(info.linkChave)} style={styles.link}>
        <Text style={styles.linkTxt}>↗ pegar a chave grátis: {info.linkChave.replace('https://', '')}</Text>
      </Pressable>
      <TextoMono style={{ color: cores.mudo, marginBottom: esp.sm }}>{info.passos}</TextoMono>
      <TextInput
        style={styles.input}
        value={chave}
        onChangeText={setChave}
        placeholder={`chave da ${info.nome}`}
        placeholderTextColor={cores.mudo}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={[styles.input, { marginTop: esp.sm }]}
        value={modelo}
        onChangeText={setModelo}
        placeholder={`modelo (padrão: ${info.modeloPadrao})`}
        placeholderTextColor={cores.mudo}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextoMono style={{ color: cores.mudo, marginTop: esp.sm }}>
        {modelosConta ? `${modelosConta.length} modelos da sua conta (toque para usar):` : 'sugestões (com a chave salva, aparecem os modelos da sua conta):'}
      </TextoMono>
      <View style={styles.chips}>
        {(modelosConta ?? info.sugestoes).slice(0, 40).map((m) => (
          <Pressable key={m} onPress={() => setModelo(m)} style={[styles.chip, modelo === m && styles.chipAtivo]}>
            <Text style={[styles.chipTxt, modelo === m && styles.chipTxtAtivo]}>{m}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.acoes}>
        <Pressable style={styles.botao} onPress={() => void salvar()}>
          <Text style={styles.botaoTxt}>Salvar</Text>
        </Pressable>
        <Pressable style={[styles.botao, !chave.trim() && { opacity: 0.4 }]} disabled={!chave.trim()} onPress={() => void testar()}>
          <Text style={styles.botaoTxt}>Testar</Text>
        </Pressable>
        <Pressable style={[styles.botao, !chave.trim() && { opacity: 0.4 }]} disabled={!chave.trim()} onPress={() => void testarAdulto()}>
          <Text style={styles.botaoTxt}>Testar cena adulta</Text>
        </Pressable>
        {!!atual && (
          <Pressable style={styles.botao} onPress={() => { setChave(''); void salvar('', ''); }}>
            <Text style={[styles.botaoTxt, { color: cores.cinabrio }]}>Remover</Text>
          </Pressable>
        )}
      </View>
      {!!estado && <TextoMono style={{ color: estado.startsWith('falhou') ? cores.cinabrio : cores.verdigris }}>{estado}</TextoMono>}
    </View>
  );
}

export function ReservasGratisPainel() {
  // Seleciona o array cru: `?? []` dentro do seletor criava um array novo a
  // cada render e o zustand entrava em laço.
  const reservas = useGame((s) => s.config.reservas) ?? [];
  return (
    <>
      <Divisor label="Reservas grátis (rodízio)" />
      <TextoMono style={{ color: cores.mudo, marginBottom: esp.sm }}>
        Crie contas grátis e cole as chaves aqui. Quando o narrador principal bater no limite ou falhar, a cena tenta
        estas na ordem. Sem narrador principal, elas narram. {reservas.length} ativa(s).
      </TextoMono>
      {ORDEM.map((p) => <CartaoReserva key={p} p={p} />)}
    </>
  );
}

const styles = StyleSheet.create({
  cartao: { borderWidth: 1, borderColor: cores.linha, padding: esp.md, marginBottom: esp.md, gap: 2 },
  cab: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nome: { fontFamily: fontes.mono, color: cores.vellum, fontSize: 13, letterSpacing: 1 },
  ativa: { fontFamily: fontes.mono, color: cores.verdigris, fontSize: 10 },
  link: { paddingVertical: 4 },
  linkTxt: { fontFamily: fontes.mono, fontSize: 12, color: cores.ouro, textDecorationLine: 'underline' },
  input: { borderWidth: 1, borderColor: cores.linha, color: cores.vellum, paddingHorizontal: esp.sm, paddingVertical: 6, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm, marginTop: esp.sm },
  chip: { paddingVertical: 4, paddingHorizontal: esp.sm, borderWidth: 1, borderColor: cores.linha, borderRadius: 3 },
  chipAtivo: { borderColor: cores.ouro },
  chipTxt: { fontFamily: fontes.mono, fontSize: 10, color: cores.mudo },
  chipTxtAtivo: { color: cores.ouro },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm, marginTop: esp.sm },
  botao: { paddingVertical: 6, paddingHorizontal: esp.md, borderWidth: 1, borderColor: cores.linha },
  botaoTxt: { fontFamily: fontes.mono, fontSize: 11, color: cores.vellum },
});
