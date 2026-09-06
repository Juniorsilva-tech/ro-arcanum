import React from 'react';
import { View } from 'react-native';
import { Pagina } from './_layout';
import { Botao, Card, Divisor, Rotulo, TextoMono, TextoSerif, Titulo } from '../components';
import { cores, esp } from '../theme';
import { useGame } from '../store';

export function PrologoInfancia() {
  const camp = useGame(s => s.camp)!;
  const avancar = useGame(s => s.avancarInfancia);
  const f = camp.familia!;
  const evento = f.eventoAtual;
  return (
    <Pagina>
      <Rotulo cor={cores.ouro}>PRÓLOGO · {f.idadeJogador === 0 ? 'NASCIMENTO' : `${f.idadeJogador} ANOS`}</Rotulo>
      <Titulo style={{ marginTop: esp.sm }}>{evento?.titulo ?? 'Sua infância'}</Titulo>
      <TextoSerif style={{ fontSize: 19, color: cores.vellum, marginBottom: esp.lg }}>{evento?.descricao}</TextoSerif>

      <Divisor label="sua família agora" />
      {f.membros.filter(m => m.idadeNoNascimento + f.idadeJogador >= 0).map(m => (
        <Card key={m.id} acento={m.condicao === 'morto' ? cores.cinabrio : m.prodigio ? cores.ouro : undefined}>
          <TextoSerif style={{ fontSize: 20 }}>{m.nome} · {m.parentesco}</TextoSerif>
          <TextoMono>{m.ocupacao} · {m.idadeNoNascimento + f.idadeJogador} anos · {m.condicao}{m.prodigio ? ' · prodígio' : ''}</TextoMono>
        </Card>
      ))}
      <TextoMono style={{ marginVertical: esp.md }}>Patrimônio familiar: {f.patrimonio} · prestígio: {f.prestigio}</TextoMono>

      {f.historia.length > 0 && (
        <>
          <Divisor label="o que já aconteceu" />
          {f.historia.slice(-3).map((h, i) => <TextoSerif key={`${h.idade}_${i}`} style={{ marginBottom: esp.sm }}>Aos {h.idade}: {h.texto}</TextoSerif>)}
        </>
      )}

      <Divisor label="o que você faz" />
      <View style={{ gap: esp.sm }}>
        {evento?.opcoes.map(o => (
          <Botao key={o.id} titulo={o.rotulo} sub={o.descricao} variante="acento" onPress={() => avancar(o.id)} />
        ))}
      </View>
    </Pagina>
  );
}
