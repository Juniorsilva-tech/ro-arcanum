import React from 'react';
import { Card, TextoMono, TextoSerif, Divisor, Botao } from '../components';
import { useGame } from '../store';
import { contextoDeAptidao, legadosConquistados } from '@/engine';

export function Progressao() {
  const camp = useGame(s => s.camp)!;
  const agir = useGame(s => s.acaoMundo);
  const publico = contextoDeAptidao(camp);
  return <>
    <Divisor label="prática e reconhecimento" />
    <TextoMono>Maestria é o que você aprendeu. Reputação é o que acreditam; fama é até onde isso chegou.</TextoMono>
    {publico?.dominios.map(d => <Card key={d.dominio}>
      <TextoSerif>{d.dominio} · maestria {d.maestria}</TextoSerif>
      <TextoMono>Reputação {d.reputacao} · fama {d.fama}</TextoMono>
    </Card>)}
    {!publico?.dominios.length && <TextoMono>A prática ainda está começando.</TextoMono>}
    <Botao titulo={publico?.ocultando ? 'Parar de se conter' : 'Conter o que demonstra · aprendizado mais lento'} onPress={() => agir({ tipo: 'conter_se' })} />
    <Divisor label="legados conquistados" />
    {legadosConquistados(camp).map(l => <Card key={l.id}>
      <TextoSerif>{l.nome}</TextoSerif>
      <TextoMono>{l.descricao} Vida ×{l.vida}; dano ×{l.dano}. O maior benefício prevalece.</TextoMono>
    </Card>)}
    {camp.flags['desafio.concluido.expedicao_cavaleira_do_eclipse'] && !camp.despertares?.includes('dominou_prova_eclipse') && <Botao titulo="Consolidar legado do eclipse · exige maestria 80" onPress={() => agir({ tipo: 'consolidar_legado' })} />}
  </>;
}
