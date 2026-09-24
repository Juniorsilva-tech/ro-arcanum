import React from 'react';
import { View } from 'react-native';
import { useGame } from '../store';
import { TextoMono, TextoSerif, Card, Botao, Divisor } from '../components';
import { EDIFICIOS, fatosConhecidos, biografiaCivil, bandosConhecidos, descreverBando, descreverCasa, caravanasPartindoAqui, invernoRigorosoAtivo, edificioRegionalDe, descreverEdificioRegional, tetoDoEdificio, trabalhosAqui, podeTrabalhoEspecializado, TRABALHOS_ESPECIALIZADOS, treinosAqui, podeTreinarImersivo, NOME_TREINO, listarContratos, LOCAIS_DO_QUADRO, itemPorId, type TipoEdificio, type ElementoMusashi } from '@/engine';

export function ComunidadeViva() {
  const camp = useGame(s => s.camp)!;
  const content = useGame(s => s.content)!;
  const agir = useGame(s => s.acaoMundo);
  const ultima = useGame(s => s.feed.at(-1));
  const c = camp.vivo?.cidades[camp.localAtual];
  const governo = c?.governo && camp.vivo?.governos[c.governo];
  const nome = (id: string) => [...content.npcs, ...(camp.npcsProcedurais ?? [])].find(n => n.id === id)?.nome ?? id;
  return <>
    <Divisor label="vida na comunidade" />
    {(content.desafios ?? []).filter(d => d.local === camp.localAtual).map(d => <Card key={d.id}>
      <TextoSerif>{d.titulo}</TextoSerif>
      <TextoMono>{d.descricao}</TextoMono>
      <TextoMono>{d.aviso}</TextoMono>
      {camp.flags[`desafio.concluido.${d.id}`] ? <TextoMono>Expedição superada. O desfecho permanece nesta campanha.</TextoMono> : <Botao titulo="Aceitar o risco e iniciar expedição" onPress={() => agir({ tipo: 'desafio', id: d.id })} />}
    </Card>)}
    <OficiosDoLugar />
    {ultima?.tipo === 'sistema' && <TextoMono>{ultima.texto}</TextoMono>}
    <View style={{ gap: 8, marginVertical: 10 }}>
      {camp.personagem.condicoes.includes('cativo') ? <Botao titulo="Buscar liberdade · resgate de 20 moedas ou tentativa de fuga" onPress={() => agir({ tipo: 'libertar_se' })} /> : <>
        <Botao titulo="Trabalhar · receber 6 moedas" onPress={() => agir({ tipo: 'trabalhar' })} />
        <Botao titulo="Descansar · hospedagem de 3 moedas na comunidade" onPress={() => agir({ tipo: 'descansar' })} />
        <Botao titulo="Ouvir notícias" onPress={() => agir({ tipo: 'noticias' })} />
      </>}
    </View>
    {bandosConhecidos(camp).length > 0 && <>
      <Divisor label="bandos na estrada" />
      {bandosConhecidos(camp).map(b => <Card key={b.id}>
        <TextoMono>{descreverBando(content, b)}</TextoMono>
        {b.esconderijoConhecido && b.esconderijo === camp.localAtual && b.estado !== 'destruido' && <Botao titulo="Atacar o esconderijo · risco de combate" onPress={() => agir({ tipo: 'atacar_esconderijo' })} />}
      </Card>)}
    </>}
    {invernoRigorosoAtivo(camp) && <TextoMono>Nevasca nos passos e colinas: as rotas de montanha estão traiçoeiras até o degelo.</TextoMono>}
    {caravanasPartindoAqui(content, camp).length > 0 && <>
      <Divisor label="caravanas partindo" />
      {caravanasPartindoAqui(content, camp).map(cv => <Card key={cv.id}>
        <TextoMono>{cv.carga} medidas de grão para {content.locais.find(l => l.id === cv.destino)?.nome ?? cv.destino}, que passa fome. Sai amanhã.</TextoMono>
        <Botao titulo="Escoltar a caravana · se houver bando na rota, a luta é sua" onPress={() => agir({ tipo: 'escoltar_caravana', id: cv.id })} />
      </Card>)}
    </>}
    {(content.casas ?? []).filter(h => h.sede === camp.localAtual || h.territorio.includes(camp.localAtual)).length > 0 && <>
      <Divisor label="casas nobres" />
      {(content.casas ?? []).filter(h => h.sede === camp.localAtual || h.territorio.includes(camp.localAtual)).map(h => <Card key={h.id}>
        <TextoMono>{descreverCasa(content, camp, h)}</TextoMono>
        {h.historia?.map((par, i) => <TextoMono key={i} style={{ marginTop: 6, fontStyle: 'italic' }}>{par}</TextoMono>)}
      </Card>)}
    </>}
    {c && <Card>
      <TextoSerif>Abastecimento e serviços</TextoSerif>
      <TextoMono>Alimentos: {Math.floor(c.comida)} · materiais: {Math.floor(c.materiais)} · remédios: {Math.floor(c.remedios)}</TextoMono>
      <TextoMono>{c.fomeDias ? `Fome há ${c.fomeDias} dias.` : 'A comunidade está alimentada.'} {c.doenca > 0 ? `Doença: ${Math.ceil(c.doenca)}%.` : ''} Insegurança: {Math.ceil(c.inseguranca)}%.</TextoMono>
      <TextoMono>{c.governo ? `Governo: ${content.faccoes.find(f => f.id === c.governo)?.nome}.` : 'Comunidade autônoma.'} {governo && governo.lider ? `Liderança: ${nome(governo.lider)} · legitimidade ${Math.round(governo.legitimidade)}%.` : ''}</TextoMono>
      {edificioRegionalDe(content, camp.localAtual) && <View style={{ marginTop: 10 }}>
        <TextoSerif>{edificioRegionalDe(content, camp.localAtual)!.nome} · só aqui</TextoSerif>
        <TextoMono>{edificioRegionalDe(content, camp.localAtual)!.descricao}</TextoMono>
        <TextoMono>{descreverEdificioRegional(content, camp, camp.localAtual)}</TextoMono>
      </View>}
      {c.projeto && <TextoMono>Em construção: {EDIFICIOS[c.projeto.tipo].nome} · {Math.floor(c.projeto.progresso)}/{Math.ceil(c.projeto.necessario)}. Fome, guerra e ameaças interrompem a obra.</TextoMono>}
      {(Object.keys(EDIFICIOS) as TipoEdificio[]).map(tipo => <View key={tipo} style={{ marginTop: 10 }}>
        <TextoSerif>{EDIFICIOS[tipo].nome} · nível {c.edificios[tipo]} de {tetoDoEdificio(content, camp.localAtual, tipo)}</TextoSerif>
        <TextoMono>{EDIFICIOS[tipo].efeito}</TextoMono>
        {!c.projeto && c.edificios[tipo] < tetoDoEdificio(content, camp.localAtual, tipo) && <Botao titulo={`Propor expansão · 15 moedas + ${EDIFICIOS[tipo].materiais} materiais públicos`} onPress={() => agir({ tipo: 'obra', edificio: tipo })} />}
      </View>)}
    </Card>}
    {c?.governo && <>
      <Divisor label="relações políticas" />
      {Object.entries(camp.vivo?.governos[c.governo]?.relacoes ?? {}).map(([outra, relacao]) => <Card key={outra}>
        <TextoSerif>{content.faccoes.find(f => f.id === outra)?.nome} · {relacao < -50 ? 'à beira de guerra' : relacao < 0 ? 'hostilidade' : 'cooperação'}</TextoSerif>
        <TextoMono>Mediação pode encerrar uma frente e abrir trégua. Cada intervenção custa 10 moedas; nova tentativa após uma semana.</TextoMono>
        <Botao titulo="Mediar trégua" onPress={() => agir({ tipo: 'diplomacia', a: c.governo!, b: outra, escolha: 'mediar' })} />
        <Botao titulo="Buscar informações nos bastidores" onPress={() => agir({ tipo: 'diplomacia', a: c.governo!, b: outra, escolha: 'espionar' })} />
      </Card>)}
    </>}
  </>;
}

export function CompromissosVivos() {
  const camp = useGame(s => s.camp)!;
  const content = useGame(s => s.content)!;
  const agir = useGame(s => s.acaoMundo);
  const ultima = useGame(s => s.feed.at(-1));
  const lista = camp.vivo?.missoes.filter(q => q.conhecida) ?? [];
  const abertas = lista.filter(q => ['oferecida', 'aceita'].includes(q.estado));
  return <>
    <Divisor label="histórias nascidas do mundo" />
    {ultima?.tipo === 'sistema' && <TextoMono>{ultima.texto}</TextoMono>}
    {abertas.length === 0 && <TextoMono>Nenhum pedido novo conhecido. Viaje ou ouça as notícias na comunidade.</TextoMono>}
    {abertas.map(q => <Card key={q.id}>
      <TextoSerif>{q.titulo} · {q.estado === 'aceita' ? 'compromisso assumido' : 'pedido de ajuda'}</TextoSerif>
      <TextoMono>{q.causa.texto}</TextoMono>
      {!!q.motivoPrazo && <TextoMono>{q.motivoPrazo}</TextoMono>}
      <TextoMono>{content.locais.find(l => l.id === q.local)?.nome} · restam {Math.max(0, q.prazo - camp.calendario.dia)} dias · recompensa: {q.recompensa} moedas e 15 XP.</TextoMono>
      {q.destino && <TextoMono>Destino: {content.locais.find(l => l.id === q.destino)?.nome}.</TextoMono>}
      {q.estado === 'oferecida' ? <Botao titulo="Aceitar compromisso" onPress={() => agir({ tipo: 'missao', id: q.id, escolha: 'aceitar' })} /> : <View style={{ gap: 8, marginTop: 8 }}>
        {q.tipo === 'investigar' ? <Botao titulo={q.etapa ? 'Confrontar o alvo · risco de combate' : 'Investigar os rastros'} onPress={() => agir({ tipo: 'missao', id: q.id, escolha: q.etapa ? 'confrontar' : 'investigar' })} /> : <>
          <Botao titulo={q.tipo === 'escoltar' ? q.etapa ? 'Entregar a escolta no destino' : 'Preparar a escolta' : 'Fornecer ajuda · 30 moedas'} onPress={() => agir({ tipo: 'missao', id: q.id, escolha: 'ajudar' })} />
          {q.tipo !== 'escoltar' && q.tentativas < 2 && <Botao titulo="Mobilizar contatos · pode falhar" onPress={() => agir({ tipo: 'missao', id: q.id, escolha: 'negociar' })} />}
        </>}
      </View>}
    </Card>)}
    {lista.filter(q => !['oferecida', 'aceita'].includes(q.estado)).slice(-6).map(q => <Card key={q.id}>
      <TextoSerif>{q.titulo} · {q.estado.replaceAll('_', ' ')}</TextoSerif>
      <TextoMono>{q.desfecho}</TextoMono>
    </Card>)}
  </>;
}

export function HistoriaViva() {
  const camp = useGame(s => s.camp)!;
  return <>
    <Divisor label="acontecimentos e consequências" />
    {fatosConhecidos(camp, 25).reverse().map(f => <Card key={f.id}>
      <TextoMono>Dia {f.dia} · {f.conhecimento}</TextoMono>
      <TextoSerif>{f.texto}</TextoSerif>
      {f.causa && <TextoMono>Origem: {f.causa.texto}</TextoMono>}
    </Card>)}
  </>;
}

export function BiografiaViva({ id }: { id: string }) {
  const camp = useGame(s => s.camp)!;
  const content = useGame(s => s.content)!;
  const p = camp.vivo?.pessoas[id];
  if (!p) return null;
  const nomes = (ids: string[]) => ids.map(id => [...content.npcs, ...(camp.npcsProcedurais ?? [])].find(n => n.id === id)?.nome ?? id).join(', ');
  return <>
    <TextoMono>Atividade: {p.objetivo} · prestígio: {p.prestigio}. {p.viagem ? 'Está viajando.' : ''}</TextoMono>
    {!!p.formacao && <TextoMono>{p.formacao.caminho === 'civil' ? 'Prefere a vida civil.' : p.formacao.concluida ? 'Formação básica de defesa concluída.' : `Aprendizado de defesa: ${p.formacao.sessoes}/20 sessões. Exige mentor presente, saúde e sustento.`}</TextoMono>}
    {!!p.conjuge && <TextoMono>Casa compartilhada com {nomes([p.conjuge])}.</TextoMono>}
    {!!p.filhos.length && <TextoMono>Crianças sob seus cuidados: {nomes(p.filhos)}.</TextoMono>}
    {!!p.tutores?.length && <TextoMono>Família de acolhimento: {nomes(p.tutores)}.</TextoMono>}
    {biografiaCivil(camp, id).map((texto, i) => <TextoMono key={i}>{texto}</TextoMono>)}
  </>;
}

// Trabalhos do lugar, treino com mestre e o quadro de contratos de monstro
// (sessão 54). Os três sistemas existiam na engine desde a sessão 45 e nenhuma
// tela os chamava.
const ELEMENTOS: { id: ElementoMusashi; nome: string }[] = [
  { id: 'terra', nome: 'Terra' }, { id: 'agua', nome: 'Água' }, { id: 'fogo', nome: 'Fogo' }, { id: 'vento', nome: 'Vento' }, { id: 'vazio', nome: 'Vazio' },
];
const NOME_PERICIA: Record<string, string> = { rastrear: 'rastrear', perceber: 'perceber', atletismo: 'atletismo', arcana: 'arcana', oficio: 'ofício' };

function OficiosDoLugar() {
  const camp = useGame(s => s.camp)!;
  const content = useGame(s => s.content)!;
  const agir = useGame(s => s.acaoMundo);
  if (camp.personagem.condicoes.includes('cativo')) return null;
  const trabalhos = trabalhosAqui(camp);
  const treinos = treinosAqui(camp);
  const contratos = listarContratos(camp);
  const noQuadro = LOCAIS_DO_QUADRO.includes(camp.localAtual);
  const disponiveis = noQuadro ? contratos.filter(k => k.estado === 'disponivel') : [];
  const ativos = contratos.filter(k => k.estado === 'investigando' || k.estado === 'pronto_para_confronto');
  const lugar = (id: string) => content.locais.find(l => l.id === id)?.nome ?? id;
  if (!trabalhos.length && !treinos.length && !disponiveis.length && !ativos.length) return null;
  return <>
    {trabalhos.length > 0 && <>
      <Divisor label="trabalho do lugar" />
      {trabalhos.map(id => {
        const t = TRABALHOS_ESPECIALIZADOS[id], pode = podeTrabalhoEspecializado(content, camp, id);
        return <Botao key={id} titulo={`${t.nome} · ${t.renda} moedas`} disabled={!pode.pode} motivo={pode.motivo}
          onPress={() => agir({ tipo: 'trabalho_especializado', trabalhoId: id })} />;
      })}
    </>}
    {treinos.length > 0 && <>
      <Divisor label="treino com mestre" />
      {treinos.map(m => {
        const pode = podeTreinarImersivo(camp, m);
        if (m === 'katas') return <Card key={m}>
          <TextoSerif>{NOME_TREINO[m]}</TextoSerif>
          <TextoMono>{pode.pode ? 'Um livro por vez. Uma vez por semana.' : pode.motivo}</TextoMono>
          {pode.pode && ELEMENTOS.map(e => <Botao key={e.id} variante="fantasma" titulo={`Livro da ${e.nome}`} onPress={() => agir({ tipo: 'treino_imersivo', modalidade: 'katas', elemento: e.id })} />)}
        </Card>;
        return <Botao key={m} titulo={NOME_TREINO[m]} disabled={!pode.pode} motivo={pode.motivo} onPress={() => agir({ tipo: 'treino_imersivo', modalidade: m })} />;
      })}
    </>}
    {(disponiveis.length > 0 || ativos.length > 0) && <Divisor label="contratos de monstro" />}
    {disponiveis.map(k => <Card key={k.id}>
      <TextoSerif>{k.titulo}</TextoSerif>
      <TextoMono>{k.descricao}</TextoMono>
      <TextoMono>Quem paga: {k.contratante}. {k.recompensaMoedas} moedas. O rastro começa: {lugar(k.localId)}.</TextoMono>
      <Botao titulo="Aceitar o contrato" onPress={() => agir({ tipo: 'contrato_monstro', contratoId: k.id, subacao: 'aceitar' })} />
    </Card>)}
    {ativos.map(k => {
      const aqui = k.localId === camp.localAtual;
      const oleo = itemPorId(content, k.fraquezaOleo);
      const temOleo = (camp.personagem.inventario[k.fraquezaOleo] ?? 0) > 0;
      return <Card key={k.id}>
        <TextoSerif>{k.titulo}</TextoSerif>
        {k.pistas.filter(pi => pi.encontrada).map(pi => <TextoMono key={pi.id}>• {pi.descricao}</TextoMono>)}
        {!aqui && <TextoMono>{k.estado === 'pronto_para_confronto' ? 'Você sabe onde ele dorme' : 'Onde está o rastro'}: {lugar(k.localId)}.</TextoMono>}
        {aqui && k.estado === 'investigando' && k.pistas.filter(pi => !pi.encontrada).map(pi =>
          <Botao key={pi.id} variante="fantasma" titulo={`Procurar pista · ${NOME_PERICIA[pi.periciaNecessaria ?? 'perceber'] ?? pi.periciaNecessaria}`} onPress={() => agir({ tipo: 'contrato_monstro', contratoId: k.id, subacao: 'investigar', pistaId: pi.id })} />)}
        {temOleo && !camp.contratosMonstro?.oleoAtivo && <Botao variante="acento" titulo={`Passar ${oleo?.nome.toLowerCase() ?? 'o óleo'} na lâmina`} onPress={() => agir({ tipo: 'contrato_monstro', contratoId: k.id, subacao: 'preparar_oleo', oleoId: k.fraquezaOleo })} />}
        {aqui && k.estado === 'pronto_para_confronto' && <Botao variante="perigo" titulo={`Ir atrás de ${k.monstroNome}`} onPress={() => agir({ tipo: 'contrato_monstro', contratoId: k.id, subacao: 'confrontar' })} />}
      </Card>;
    })}
  </>;
}
