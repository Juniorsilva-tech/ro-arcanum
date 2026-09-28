import React from 'react';
import { View } from 'react-native';
import { Pagina } from './_layout';
import { Botao, Card, Divisor, Rotulo, TextoMono, TextoSerif, Titulo } from '../components';
import { cores, esp } from '../theme';
import { useGame } from '../store';


const NOME_PARENTESCO: Record<string, string> = { pai: 'pai', mae: 'mãe', irmao: 'irmão', irma: 'irmã' };
export function PrologoInfancia() {
  const camp = useGame(s => s.camp)!;
  const avancar = useGame(s => s.avancarInfancia);
  const pular = useGame(s => s.pularInfancia);
  const f = camp.familia!;
  const evento = f.eventoAtual;

  const etapaNum = f.idadeJogador === 0 ? 1 : f.idadeJogador === 6 ? 2 : f.idadeJogador === 10 ? 3 : 4;
  const etapaRotulo = f.idadeJogador === 0
    ? 'NASCIMENTO (0 ANOS)'
    : f.idadeJogador === 6
    ? 'INFÂNCIA (6 ANOS)'
    : f.idadeJogador === 10
    ? 'PRIMEIROS TESTES (10 ANOS)'
    : 'RUMO À VIDA ADULTA (14 ANOS)';

  return (
    <Pagina>
      <Rotulo cor={cores.ouro}>PRÓLOGO · ETAPA {etapaNum} DE 4 · {etapaRotulo}</Rotulo>
      <Titulo style={{ marginTop: esp.sm }}>{evento?.titulo ?? 'Sua infância'}</Titulo>
      <TextoSerif style={{ fontSize: 19, color: cores.vellum, marginBottom: esp.lg }}>{evento?.descricao}</TextoSerif>

      <Divisor label="sua família agora" />
      {f.membros.filter(m => m.idadeNoNascimento + f.idadeJogador >= 0).map(m => (
        <Card key={m.id} acento={m.condicao === 'morto' ? cores.cinabrio : m.prodigio ? cores.ouro : undefined}>
          <TextoSerif style={{ fontSize: 20 }}>{m.nome} · {NOME_PARENTESCO[m.parentesco] ?? m.parentesco}</TextoSerif>
          <TextoMono>{m.ocupacao} · {m.idadeNoNascimento + f.idadeJogador} {m.idadeNoNascimento + f.idadeJogador === 1 ? 'ano' : 'anos'} · {m.condicao}{m.prodigio ? ' · prodígio' : ''}</TextoMono>
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
        <View style={{ marginTop: esp.md }}>
          <Botao
            titulo="Pular infância"
            sub="concluir o prólogo e começar a vida adulta aos 18 anos"
            variante="fantasma"
            onPress={pular}
          />
        </View>
      </View>
    </Pagina>
  );
}
