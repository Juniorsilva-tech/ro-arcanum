import React from 'react';
import { Card, TextoMono, TextoSerif, Divisor, Botao } from '../components';
import { useGame } from '../store';
import { contextoDeAptidao, legadosConquistados, avisoMarca, requisitosConterMarca, LOCAL_CONTER_MARCA, DIAS_RECLUSAO_MARCA, VIDA_PERDIDA_AO_CONTER } from '@/engine';

export function Progressao() {
  const camp = useGame(s => s.camp)!;
  const agir = useGame(s => s.acaoMundo);
  const content = useGame(s => s.content);
  const aviso = avisoMarca(camp);
  const conter = aviso && !camp.marca?.contida && camp.localAtual === LOCAL_CONTER_MARCA && content ? requisitosConterMarca(content, camp) : null;
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
    {aviso && <Card>
      <TextoSerif>O preço da Marca</TextoSerif>
      <TextoMono>{aviso}</TextoMono>
    </Card>}
    {conter && <>
      <TextoMono>{conter.pode
        ? `A reclusão leva ${DIAS_RECLUSAO_MARCA} dias e tira ${VIDA_PERDIDA_AO_CONTER} de vida máxima para sempre. A Marca para de cobrar, e perde a maior parte do que dava.`
        : `Para conter a chama ainda falta: ${conter.faltando.join('; ')}.`}</TextoMono>
      {conter.pode && <Botao titulo={`Conter a Marca · ${DIAS_RECLUSAO_MARCA} dias de reclusão`} onPress={() => agir({ tipo: 'conter_marca' })} />}
    </>}
    {camp.flags['desafio.concluido.expedicao_cavaleira_do_eclipse'] && !camp.despertares?.includes('dominou_prova_eclipse') && <Botao titulo="Consolidar legado do eclipse · exige maestria 80" onPress={() => agir({ tipo: 'consolidar_legado' })} />}
  </>;
}
