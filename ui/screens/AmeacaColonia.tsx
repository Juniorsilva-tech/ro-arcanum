// ARCANUM · Ameaça e assembleia da colônia (sessão 58, etapa E): quem vem,
// quando chega, o que o conselho acha, o que a assembleia decide — em texto
// livre ou nos botões — e o relatório da última batalha.
import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { TextoMono, TextoSerif, Card, Botao, Divisor } from '../components';
import { cores, esp } from '../theme';
import { useGame } from '../store';
import { PREPARACOES, LISTA_PREPARACOES, podePreparar } from '@/engine';

export function AmeacaDaColonia() {
  const camp = useGame(s => s.camp)!;
  const decidir = useGame(s => s.decidirAssembleiaAcao);
  const [texto, setTexto] = useState('');
  const [resposta, setResposta] = useState<string | undefined>();
  const f = camp.feudo;
  if (!f?.fundado) return null;
  const a = f.ameaca;
  const b = f.ultimaBatalha;
  const dia = camp.calendario.dia;

  return (
    <View style={{ gap: esp.md }}>
      {a && (
        <>
          <Divisor label="ameaça" />
          <Card acento={cores.cinabrio}>
            <TextoSerif style={{ fontSize: 18 }}>{a.nome} · chega em {Math.max(0, a.chegaEm - dia)} dias</TextoSerif>
            <TextoMono>{a.texto}</TextoMono>
            {a.conselho.length > 0 && (
              <View style={{ marginTop: 6 }}>
                <TextoMono style={{ color: cores.mudo, fontSize: 12 }}>O conselho:</TextoMono>
                {a.conselho.map(l => <TextoMono key={l} style={{ fontSize: 12, fontStyle: 'italic' }}>{l}</TextoMono>)}
              </View>
            )}
            {Object.keys(a.preparacoes).length > 0 && (
              <TextoMono style={{ marginTop: 6 }}>
                Decidido: {Object.keys(a.preparacoes).map(p => PREPARACOES[p as keyof typeof PREPARACOES].nome).join(', ')}.
              </TextoMono>
            )}
          </Card>

          <Card>
            <TextoSerif>Assembleia</TextoSerif>
            <TextoMono style={{ color: cores.mudo, fontSize: 12 }}>
              Diga o que fazer, com as suas palavras ("cava um fosso e põe vigia no alto"), ou escolha abaixo.
            </TextoMono>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="O que a colônia faz?"
              placeholderTextColor={cores.mudo}
              style={styles.entrada}
              multiline
            />
            <Botao titulo="Levar à assembleia" variante="acento" onPress={async () => { setResposta(await decidir(texto)); setTexto(''); }} />
            {resposta && <TextoMono style={{ marginTop: 6 }}>{resposta}</TextoMono>}
            <View style={{ gap: 6, marginTop: 10 }}>
              {LISTA_PREPARACOES.filter(p => a.preparacoes[p] === undefined).map(p => {
                const ficha = PREPARACOES[p];
                const pode = podePreparar(camp, p);
                const custo = p === 'tributo' ? `${a.tributo} de ouro` : [
                  ficha.custo.materiais ? `${ficha.custo.materiais} de material` : '',
                  ficha.custo.ouro ? `${ficha.custo.ouro} de ouro` : '',
                  ficha.custo.comida ? `${ficha.custo.comida} de comida` : '',
                ].filter(Boolean).join(', ') || 'sem custo';
                const atrasa = dia + ficha.dias > a.chegaEm;
                return (
                  <View key={p}>
                    <Botao titulo={`${ficha.nome} · ${custo} · ${ficha.dias} ${ficha.dias === 1 ? 'dia' : 'dias'}`} variante="fantasma" onPress={async () => setResposta(await decidir([p]))} />
                    <TextoMono style={{ fontSize: 12, color: pode.pode && !atrasa ? cores.mudo : cores.cinabrio }}>
                      {ficha.descricao}{ficha.defesa ? ` (+${ficha.defesa} de defesa)` : ''}.
                      {!pode.pode ? ` ${pode.motivo}` : atrasa ? ' Não fica pronta a tempo.' : ''}
                    </TextoMono>
                  </View>
                );
              })}
            </View>
          </Card>
        </>
      )}

      {b && (
        <>
          <Divisor label={`última batalha · dia ${b.dia}`} />
          <Card acento={b.desfecho === 'repelida' || b.desfecho === 'evitada' ? cores.verdigris : cores.cinabrio}>
            {b.linhas.map((l, i) => <TextoMono key={i}>{l}</TextoMono>)}
          </Card>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  entrada: {
    borderWidth: 1, borderColor: cores.linha, color: cores.vellum, padding: 8, minHeight: 60,
    marginVertical: 8, borderRadius: 4, textAlignVertical: 'top',
  },
});
