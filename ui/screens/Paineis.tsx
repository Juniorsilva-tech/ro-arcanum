// ARCANUM · Painéis: Ficha, Vínculos, Crônica, Mapa e o Livro (GDD §13, §31, §32).
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Pagina, BarraVoltar } from './_layout';
import { TextoSerif, TextoMono, Card, Medidor, Divisor, Rotulo, Selo, Botao } from '../components';
import { cores, fontes, esp, corPressao, corImpulso } from '../theme';
import { useGame } from '../store';
import { ComunidadeViva, CompromissosVivos, HistoriaViva, BiografiaViva } from './MundoVivo';
import { Progressao } from './Progressao';
import {
  derivados,
  defesaJogador,
  acertoJogador,
  modificador,
  IMPULSOS,
  ATTR_KEYS,
  bonusDefesaEquip,
  armaEquipada,
  itemPorId,
  mestresQueEnsinamAqui,
  escolasDominadas,
  podeFundir,
  artesConhecidasResolvidas,
  LIMITE_FUSOES,
  type AttrKey,
  type EstadoEntrada,
  todosNpcs,
  calcularContexto,
  retratoProgressaoNpc,
} from '@/engine';

// ─────────────────────────────────────────────── FICHA
export function Ficha() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const jogarCarta = useGame((s) => s.jogarCartaMemoria);
  const p = camp.personagem;
  const nomes = content.cenario.nomesAtributos;
  const d = derivados(p, bonusDefesaEquip(content, p));
  const arma = armaEquipada(content, p);
  const classe = content.classes.find((c) => c.id === p.classeId);

  return (
    <Pagina>
      <BarraVoltar titulo="Ficha" />
      <TextoSerif style={{ fontSize: 30, color: cores.ouro }}>{p.nome}</TextoSerif>
      <TextoMono style={{ marginBottom: esp.md }}>
        {classe?.nome} · {p.idade ?? 18} anos · nível {p.nivel} · {p.xp} xp · {p.dinheiro} moedas
      </TextoMono>
      {camp.genese && (
        <TextoMono style={{ color: cores.linha, marginBottom: esp.md, fontStyle: 'italic' }}>
          {camp.genese.marca === 'tragedia'
            ? `órfão de ${camp.genese.paiNome} e ${camp.genese.maeNome}`
            : `filho de ${camp.genese.paiNome} e ${camp.genese.maeNome}`}
          {camp.genese.marca === 'genio'
            ? ' · gênio precoce'
            : camp.genese.marca === 'indigno'
              ? ' · aprendeu tudo devagar'
              : ''}
        </TextoMono>
      )}

      {camp.memoriasInfancia && camp.memoriasInfancia.length > 0 && (
        <>
          <Divisor label="memórias de infância" />
          {camp.memoriasInfancia.map((c) => (
            <Card key={c.id}>
              <View style={styles.linhaTitulo}>
                <TextoSerif style={{ fontSize: 18 }}>{c.titulo}</TextoSerif>
                <Selo texto={c.tipo === 'trauma' ? 'TRAUMA' : 'VITÓRIA'} cor={c.tipo === 'trauma' ? cores.cinabrio : cores.ouro} />
              </View>
              <TextoMono style={{ color: cores.linha, marginTop: 2 }}>{c.descricao}</TextoMono>
              <TextoMono style={{ marginTop: 4 }}>
                +{c.bonusCircunstancia} no próximo teste · {c.usosRestantes} uso{c.usosRestantes === 1 ? '' : 's'} restante{c.usosRestantes === 1 ? '' : 's'}
                {camp.cartaAtiva === c.id ? ' · ativa agora' : ''}
              </TextoMono>
              <Botao
                titulo={camp.cartaAtiva === c.id ? 'Ativa' : 'Jogar'}
                variante="fantasma"
                disabled={camp.cartaAtiva === c.id || c.usosRestantes <= 0}
                onPress={() => jogarCarta(c.id)}
              />
            </Card>
          ))}
        </>
      )}

      <Divisor label="atributos" />
      {ATTR_KEYS.map((k: AttrKey) => {
        const val = p.atributos[k];
        const mod = modificador(val);
        return (
          <View key={k} style={styles.attrRow}>
            <Text style={styles.attrNome}>{nomes[k]}</Text>
            <Text style={styles.attrVal}>
              {val} <Text style={styles.attrMod}>({mod >= 0 ? '+' : ''}{mod})</Text>
            </Text>
          </View>
        );
      })}

      <Divisor label="recursos" />
      {Object.keys(p.recursos).map((r) => (
        <Medidor
          key={r}
          rotulo={nomeRecurso(content, r)}
          valor={p.recursos[r]}
          max={p.recursosMax[r] ?? p.recursos[r]}
          cor={r === 'vida' ? cores.cinabrio : cores.verdigris}
        />
      ))}

      <Divisor label="pressões" />
      {content.cenario.pressoes.map((pr) => (
        <View key={pr.id} style={{ marginBottom: esp.sm }}>
          <Medidor rotulo={pr.nome} valor={p.pressoes[pr.id] ?? 0} max={100} cor={corPressao(p.pressoes[pr.id] ?? 0)} compacto />
          <TextoMono style={styles.pressaoDesc}>{pr.descricao}</TextoMono>
        </View>
      ))}

      <Divisor label="impulsos" />
      {IMPULSOS.map((imp) => (
        <Medidor key={imp.id} rotulo={imp.nome} valor={camp.impulsos[imp.id]} max={100} cor={corImpulso(camp.impulsos[imp.id])} compacto />
      ))}

      <Progressao />
      <Divisor label="derivados" />
      <View style={styles.derivGrid}>
        <Deriv nome="Defesa" v={defesaJogador(content, camp)} />
        <Deriv nome="Iniciativa" v={d.iniciativa} />
        <Deriv nome="Acerto" v={acertoJogador(content, camp)} />
        <Deriv nome="Poder" v={d.poder} />
        <Deriv nome="Carga máx" v={d.cargaMax} />
        <Deriv nome="Percepção" v={d.percepcaoPassiva} />
      </View>

      {p.condicoes.length > 0 && (
        <>
          <Divisor label="condições" />
          <View style={styles.chips}>
            {p.condicoes.map((c) => (
              <Selo key={c} texto={c} cor={cores.cinabrio} />
            ))}
          </View>
        </>
      )}

      <Divisor label="equipamento" />
      <View style={styles.attrRow}>
        <Text style={styles.invItem}>Arma</Text>
        <TextoMono style={{ color: cores.vellum }}>
          {arma ? `${arma.nome} (dano ${arma.dano?.base ?? '—'})` : 'desarmado'}
        </TextoMono>
      </View>
      <View style={styles.attrRow}>
        <Text style={styles.invItem}>Armadura</Text>
        <TextoMono style={{ color: cores.vellum }}>
          {p.equipado.armadura ? itemPorId(content, p.equipado.armadura)?.nome : '—'}
        </TextoMono>
      </View>

      {Object.keys(p.inventario).length > 0 && (
        <>
          <Divisor label="inventário" />
          {Object.entries(p.inventario).map(([id, qtd]) => (
            <View key={id} style={styles.attrRow}>
              <Text style={styles.invItem}>{itemPorId(content, id)?.nome ?? id.replace(/_/g, ' ')}</Text>
              <TextoMono>×{qtd}</TextoMono>
            </View>
          ))}
        </>
      )}
    </Pagina>
  );
}

function Deriv({ nome, v }: { nome: string; v: number }) {
  return (
    <View style={styles.derivItem}>
      <Text style={styles.derivVal}>{v}</Text>
      <Text style={styles.derivNome}>{nome}</Text>
    </View>
  );
}

function nomeRecurso(content: any, id: string): string {
  if (id === 'vida') return 'Vida';
  return content.cenario.recursos.find((r: any) => r.id === id)?.nome ?? id;
}

// ─────────────────────────────────────────────── VÍNCULOS
export function Vinculos() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const eixos = content.cenario.eixosRelacao;
  const resgatar = useGame(s => s.resgatarFamiliar);
  const alternarCompanheiro = useGame(s => s.alternarCompanheiroAcao);
  const agirMundo = useGame(s => s.acaoMundo);
  const [avisoGrupo, setAvisoGrupo] = useState('');

  const elenco = todosNpcs(content, camp);
  const familiares = elenco.filter(n => !!n.parentesco);
  const conhecidos = elenco.filter((n) => {
    const din = camp.npcState[n.id];
    return din && din.memoria.length > 0;
  });
  const combatentesPresentes = calcularContexto(content, camp).presentes.filter(n => !!n.combatente);
  const idsVisiveis = new Set<string>();
  const lista = [...familiares, ...combatentesPresentes, ...conhecidos].filter(n => {
    if (idsVisiveis.has(n.id)) return false;
    idsVisiveis.add(n.id);
    return true;
  });
  if (lista.length === 0) lista.push(...elenco.slice(0, 3));

  return (
    <Pagina>
      <BarraVoltar titulo="Vínculos" />
      <TextoSerif style={styles.intro}>
        Afeto não é confiança. Alguém pode te amar e não te confiar nada.
      </TextoSerif>
      {!!avisoGrupo && <TextoMono style={{ color: cores.ouro, marginBottom: esp.md }}>{avisoGrupo}</TextoMono>}
      {lista.map((n) => {
        const din = camp.npcState[n.id];
        const sabeSegredo = camp.segredosRevelados.includes(n.id);
        const parente = camp.familia?.membros.find(m => m.id === n.id);
        const noGrupo = (camp.grupo ?? []).includes(n.id);
        const presente = combatentesPresentes.some(p => p.id === n.id);
        return (
          <Card key={n.id}>
            <View style={styles.linhaTitulo}>
              <TextoSerif style={{ fontSize: 22, color: cores.vellum }}>{n.nome}</TextoSerif>
              {din.tensao >= 60 && <Selo texto="afastando-se" cor={cores.cinabrio} />}
            </View>
            <TextoMono style={{ marginBottom: esp.sm }}>{n.ocupacao}</TextoMono>
            {n.combatente && <TextoMono>Prática adquirida: {retratoProgressaoNpc(camp, n)?.maestria} · vida máxima {retratoProgressaoNpc(camp, n)?.vidaMax} · dano {retratoProgressaoNpc(camp, n)?.dano}</TextoMono>}
            {noGrupo && din.vivo && <Botao titulo="Treinar juntos · 5 moedas" onPress={() => agirMundo({ tipo: 'treinar_companheiro', npcId: n.id })} />}
            {n.parentesco && <Selo texto={n.parentesco.toUpperCase()} cor={cores.ouro} />}
            <BiografiaViva id={n.id} />
            {parente && parente.condicao !== 'livre' && <Selo texto={parente.condicao.toUpperCase()} cor={cores.cinabrio} />}
            {n.combatente && <Selo texto={noGrupo ? 'NO GRUPO' : 'COMBATENTE'} cor={noGrupo ? cores.verdigris : cores.mudo} />}
            {eixos.map((e) => {
              const v = din.eixos[e.id] ?? 0;
              const cor = e.id === 'medo' ? cores.cinabrio : e.id === 'confianca' ? cores.verdigris : cores.ouro;
              return (
                <Medidor key={e.id} rotulo={e.nome} valor={Math.max(0, v + 20)} max={40} cor={cor} compacto />
              );
            })}
            {sabeSegredo && n.segredo && (
              <View style={styles.segredo}>
                <Rotulo cor={cores.violeta}>Segredo descoberto</Rotulo>
                <TextoSerif style={{ fontSize: 16, color: cores.vellum, marginTop: 2 }}>
                  {n.segredo.conteudo}
                </TextoSerif>
              </View>
            )}
            {parente?.condicao === 'cativo' && camp.localAtual === 'acampamento' && (
              <View style={{ gap: esp.sm, marginTop: esp.md }}>
                <Botao titulo="Pagar resgate · 50 moedas" onPress={() => resgatar(n.id, 'resgate')} />
                <Botao titulo="Tentar infiltração" variante="perigo" onPress={() => resgatar(n.id, 'infiltracao')} />
              </View>
            )}
            {n.combatente && din.vivo && (presente || noGrupo) && (
              <View style={{ marginTop: esp.md }}>
                <Botao
                  titulo={noGrupo ? 'Dispensar do grupo' : `Convidar para o grupo · ${(camp.grupo ?? []).length}/2`}
                  variante="fantasma"
                  onPress={async () => setAvisoGrupo(await alternarCompanheiro(n.id))}
                />
              </View>
            )}
          </Card>
        );
      })}
    </Pagina>
  );
}

// ─────────────────────────────────────────────── CRÔNICA
export function Cronica() {
  const camp = useGame((s) => s.camp);
  const feed = useGame((s) => s.feed);
  const narrativas = feed.filter((e) => e.tipo === 'narracao' || e.tipo === 'eco');
  return (
    <Pagina>
      <BarraVoltar titulo="Crônica" />
      {camp && <HistoriaViva />}
      {Object.values(camp?.kimetsu?.rivais ?? {}).filter(r => r.reencontros > 0).map(r => (
        <Card key={r.id}>
          <TextoSerif>{r.nome} · {r.vivo ? 'sobreviveu' : 'morto'}</TextoSerif>
          <TextoMono>{r.reencontros} confronto(s) · venceu você {r.vitorias} vez(es) · suas fugas: {r.fugas}</TextoMono>
          <TextoMono>Último confronto: dia {r.ultimoDia}. {r.vivo && r.memoria.at(-1)?.tecnica ? 'Pode reconhecer uma técnica que já enfrentou.' : ''}</TextoMono>
          {r.evolucao && <TextoMono>Comportamento observado: {r.evolucao.plano} · evolução {r.evolucao.nivel}.</TextoMono>}
        </Card>
      ))}
      {narrativas.length === 0 && <TextoMono>Sua história ainda não começou.</TextoMono>}
      {narrativas.map((e) => (
        <TextoSerif
          key={e.id}
          style={[
            { marginBottom: esp.md, fontSize: 18 },
            e.tipo === 'eco' ? { color: cores.ouro, fontStyle: 'italic' } : { color: cores.vellum },
          ]}
        >
          {e.texto}
        </TextoSerif>
      ))}
    </Pagina>
  );
}

// ─────────────────────────────────────────────── MAPA
export function Mapa() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const reconstruir = useGame((s) => s.reconstruirLocal);
  const viajar = useGame((s) => s.viajar);
  const local = content.locais.find((l) => l.id === camp.localAtual)!;

  return (
    <Pagina>
      <BarraVoltar titulo="Mapa" />
      <Rotulo cor={cores.ouro}>{local.regiao}</Rotulo>
      <TextoSerif style={{ fontSize: 26, marginTop: 2 }}>{local.nome}</TextoSerif>
      <TextoMono style={{ marginBottom: esp.lg }}>você está aqui · perigo {local.perigo}/10</TextoMono>
      <ComunidadeViva />

      <Divisor label="para onde ir" />
      {local.rotas.map((r) => {
        const dest = content.locais.find((l) => l.id === r.destino);
        if (!dest) return null;
        const conhecido = camp.locaisVisitados.includes(r.destino);
        return (
          <Card key={r.destino} onPress={() => viajar(r.destino)} acento={r.perigo >= 4 ? cores.cinabrio : undefined}>
            <View style={styles.linhaTitulo}>
              <TextoSerif style={{ fontSize: 20 }}>{conhecido ? dest.nome : 'Rumo desconhecido'}</TextoSerif>
              {r.perigo >= 4 && <Selo texto="perigoso" cor={cores.cinabrio} />}
            </View>
            <TextoMono style={{ marginTop: 2 }}>
              {r.periodos === 0 ? 'ao lado' : `${r.periodos} período(s) de viagem`}
              {conhecido ? ` · ${dest.tipo}` : ''}
            </TextoMono>
            <TextoMono>Risco da rota: {r.perigo}/10. Viagens à noite aumentam a chance de encontro. Esse risco não garante adversários do seu nível.</TextoMono>
          </Card>
        );
      })}

      <Divisor label="lugares que você conhece" />
      {Object.entries(camp.continuidade?.locais ?? {}).filter(([id]) => camp.locaisVisitados.includes(id)).map(([id, estado]) => (
        <Card key={`estado_${id}`}>
          <TextoSerif>{content.locais.find(l => l.id === id)?.nome}</TextoSerif>
          <TextoMono>Estruturas: {estado.integridade}% · moradores: {estado.populacao} · expansão: {estado.nivel} · obra: {estado.obra}/90 dias</TextoMono>
          {id === camp.localAtual && estado.integridade < 100 && <Botao titulo="Ajudar a reconstruir · 20 moedas" onPress={reconstruir} />}
        </Card>
      ))}
      <View style={styles.chips}>
        {camp.locaisVisitados.map((id) => {
          const l = content.locais.find((x) => x.id === id);
          return <Selo key={id} texto={l?.nome ?? id} cor={id === camp.localAtual ? cores.ouro : undefined} />;
        })}
      </View>
    </Pagina>
  );
}

// ─────────────────────────────────────────────── MISSÕES
export function Missoes() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const cacarAmeaca = useGame((s) => s.cacarAmeaca);
  const apoiar = useGame(s => s.apoiarFaccao);
  const guerra = camp.mundo?.guerraAtiva;

  const ativas = content.quests.filter((q) => camp.questEstado[q.id] === 'ativa');
  const feitas = content.quests.filter((q) => camp.questEstado[q.id] === 'concluida');
  const ocultas = content.quests.filter((q) => camp.questEstado[q.id] === 'desconhecida');

  return (
    <Pagina>
      <BarraVoltar titulo="Missões" />
      <TextoSerif style={styles.intro}>O que o mundo espera de você — e o que você prometeu.</TextoSerif>
      <CompromissosVivos />

      <Divisor label="em andamento" />
      {guerra && (
        <Card acento={cores.cinabrio}>
          <TextoSerif>Frente de guerra · {content.locais.find(l => l.id === guerra.local)?.nome ?? 'local incerto'}</TextoSerif>
          <TextoMono>{content.faccoes.find(f => f.id === guerra.a)?.nome} contra {content.faccoes.find(f => f.id === guerra.b)?.nome} · cerca de {guerra.diasRestantes} dia(s) restantes.</TextoMono>
          {guerra.local === camp.localAtual && !guerra.apoiou && (
            <View style={{ gap: esp.sm, marginTop: esp.sm }}>
              <Botao titulo={`Apoiar ${content.faccoes.find(f => f.id === guerra.a)?.nome}`} onPress={() => apoiar(guerra.a)} />
              <Botao titulo={`Apoiar ${content.faccoes.find(f => f.id === guerra.b)?.nome}`} onPress={() => apoiar(guerra.b)} />
            </View>
          )}
          {guerra.apoiou && <Selo texto={`APOIANDO ${content.faccoes.find(f => f.id === guerra.apoiou)?.nome ?? guerra.apoiou}`} cor={cores.ouro} />}
        </Card>
      )}
      {(camp.continuidade?.ameacas ?? []).filter(a => a.descoberta).map(a => (
        <Card key={a.id} acento={a.estado === 'ativa' ? cores.cinabrio : cores.mudo}>
          <TextoSerif>Desaparecimentos · {content.locais.find(l => l.id === a.local)?.nome}</TextoSerif>
          <TextoMono>{a.estado === 'ativa' ? `A ameaça continua. ${Math.max(0, a.prazo - camp.calendario.dia)} dia(s) antes do ataque previsto.` : a.estado === 'resolvida' ? 'A criatura foi eliminada. A comunidade está livre desta ameaça.' : 'O ataque aconteceu e deixou danos na comunidade.'}</TextoMono>
          {a.estado !== 'resolvida' && a.local === camp.localAtual && <Botao titulo="Rastrear a ameaça" onPress={() => cacarAmeaca(a.id)} />}
        </Card>
      ))}
      {ativas.length === 0 && <TextoMono>Nada em aberto por ora.</TextoMono>}
      {ativas.map((q) => (
        <Card key={q.id} acento={cores.ouro}>
          <TextoSerif style={{ fontSize: 20 }}>{q.titulo}</TextoSerif>
          <TextoSerif style={{ fontSize: 16, color: cores.mudo, marginTop: 2 }}>{q.descricao}</TextoSerif>
          {q.objetivos.map((o) => {
            const feito = !!camp.flags[o.flag];
            return (
              <View key={o.id} style={styles.questObj}>
                <Text style={[styles.questCheck, { color: feito ? cores.verdigris : cores.linha }]}>
                  {feito ? '✔' : '○'}
                </Text>
                <TextoMono style={{ color: feito ? cores.verdigris : cores.mudo, flex: 1 }}>{o.texto}</TextoMono>
              </View>
            );
          })}
          <TextoMono style={{ color: cores.linha, marginTop: esp.sm }}>
            recompensa:
            {q.recompensa.dinheiro ? ` ${q.recompensa.dinheiro} moedas` : ''}
            {q.recompensa.xp ? ` · ${q.recompensa.xp} xp` : ''}
            {q.recompensa.item ? ` · ${itemPorId(content, q.recompensa.item)?.nome ?? q.recompensa.item}` : ''}
          </TextoMono>
        </Card>
      ))}

      {feitas.length > 0 && (
        <>
          <Divisor label="concluídas" />
          {feitas.map((q) => (
            <View key={q.id} style={styles.livroLinha}>
              <Text style={[styles.livroNome, { color: cores.verdigris }]}>✔ {q.titulo}</Text>
            </View>
          ))}
        </>
      )}

      {ocultas.length > 0 && (
        <>
          <Divisor label="ouvidas por aí" />
          <TextoMono>
            {ocultas.length} história(s) esperam alguém que valha a pena — fale com as pessoas certas.
          </TextoMono>
        </>
      )}
    </Pagina>
  );
}

// ─────────────────────────────────────────────── O LIVRO
export function Livro() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const aprender = useGame((s) => s.aprenderArteAcao);
  const conjurar = useGame((s) => s.conjurarArteLivre);
  const fundir = useGame((s) => s.fundirEstilos);
  const p = camp.personagem;

  const [escolhidas, setEscolhidas] = useState<string[]>([]);
  const [nomeFusao, setNomeFusao] = useState('');
  const elegiveis = escolasDominadas(content, camp);
  const fusoesFeitas = p.fusoesFeitas ?? 0;
  function alternarEscola(e: string) {
    setEscolhidas((atual) =>
      atual.includes(e) ? atual.filter((x) => x !== e) : atual.length < 2 ? [...atual, e] : [atual[1], e],
    );
  }
  const podeMandar =
    escolhidas.length === 2 && nomeFusao.trim().length > 0 &&
    podeFundir(content, camp, escolhidas[0], escolhidas[1]).ok;

  const ensinamAqui = mestresQueEnsinamAqui(content, camp);
  const localNome = content.locais.find((l) => l.id === camp.localAtual)?.nome ?? '';

  return (
    <Pagina>
      <BarraVoltar titulo="O Livro" />
      <TextoSerif style={styles.intro}>Preencher o Livro é o jogo.</TextoSerif>

      {ensinamAqui.length > 0 && (
        <>
          <Divisor label={`aprender agora · ${localNome}`} />
          {ensinamAqui.map(({ mestre, artes }) => (
            <Card key={mestre.id} acento={cores.verdigris}>
              <TextoSerif style={{ fontSize: 19 }}>{mestre.nome}</TextoSerif>
              <TextoMono style={{ marginBottom: esp.sm }}>{mestre.custo}</TextoMono>
              <View style={styles.chips}>
                {artes.map((a) => (
                  <Pressable key={a.id} style={styles.chipAprender} onPress={() => aprender(a.id)}>
                    <Text style={styles.chipAprenderTxt}>aprender {a.nome}</Text>
                    <Text style={styles.chipAprenderSub}>2 períodos</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          ))}
        </>
      )}

      {p.artesConhecidas.length > 0 && (
        <>
          <Divisor label="conjurar" />
          <View style={styles.chips}>
            {/* artesConhecidasResolvidas ja inclui as artes fundidas — o
                content.artes.find(...) antigo nao as achava, e a arte
                recem-fundida nunca aparecia aqui pra ser conjurada. */}
            {artesConhecidasResolvidas(content, camp).map((a) => (
              <Pressable key={a.id} style={styles.chipConjurar} onPress={() => conjurar(a.id)}>
                <Text style={styles.chipAprenderTxt}>
                  {a.origem === 'fusao' ? '⟡ ' : ''}
                  {a.nome}
                </Text>
                <Text style={styles.chipAprenderSub}>
                  {a.custo.valor} {a.custo.recurso}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Fundir estilos: combina duas escolas dominadas (2+ artes conhecidas
          em cada) num estilo original — limite de 3 por vida (documento
          original de design, adaptado às escolas do Vaelhorn). */}
      {elegiveis.length >= 2 && fusoesFeitas < LIMITE_FUSOES && (
        <>
          <Divisor label={`fundir estilos · ${LIMITE_FUSOES - fusoesFeitas} restantes`} />
          <TextoMono style={{ color: cores.mudo, marginBottom: esp.sm }}>
            escolha duas escolas que você domina e dê um nome ao estilo novo.
          </TextoMono>
          <View style={styles.chips}>
            {elegiveis.map((e) => (
              <Pressable
                key={e}
                style={[styles.chipAprender, escolhidas.includes(e) && styles.chipEscolaAtiva]}
                onPress={() => alternarEscola(e)}
              >
                <Text style={styles.chipAprenderTxt}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.inputFusao}
            value={nomeFusao}
            onChangeText={setNomeFusao}
            placeholder="nome do estilo novo…"
            placeholderTextColor={cores.linha}
          />
          <Pressable
            style={[styles.chipConjurar, !podeMandar && styles.chipDesabilitado]}
            disabled={!podeMandar}
            onPress={() => {
              fundir(escolhidas[0], escolhidas[1], nomeFusao);
              setEscolhidas([]);
              setNomeFusao('');
            }}
          >
            <Text style={styles.chipAprenderTxt}>Fundir</Text>
          </Pressable>
        </>
      )}

      <Divisor label="I · Mestres" />
      {content.mestres.map((m) => (
        <Card key={m.id}>
          <TextoSerif style={{ fontSize: 20 }}>{m.nome}</TextoSerif>
          <TextoMono>{m.dominio} · {m.localBase}</TextoMono>
          <Text style={styles.mestreMec}>{m.mecanicaUnica}</Text>
          <TextoMono style={{ color: cores.linha, marginTop: 4 }}>custo: {m.custo}</TextoMono>
        </Card>
      ))}

      <Divisor label="II · Trabalhos" />
      {content.trabalhos.map((t) => (
        <View key={t.id} style={styles.livroLinha}>
          <View style={{ flex: 1 }}>
            <Text style={styles.livroNome}>{t.nome}</Text>
            <TextoMono>{t.tipo} · {t.renda >= 0 ? `+${t.renda}` : t.renda} moedas / {t.periodosPorCiclo}p</TextoMono>
          </View>
        </View>
      ))}

      <Divisor label="III · Artes" />
      {[...content.artes, ...(camp.artesCriadas ?? [])].map((a) => {
        const conhecida = p.artesConhecidas.includes(a.id);
        return (
          <View key={a.id} style={styles.livroLinha}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.livroNome, conhecida ? { color: cores.verdigris } : null]}>
                {conhecida ? '✦ ' : ''}
                {a.origem === 'fusao' ? '⟡ ' : ''}
                {a.nome}
              </Text>
              <TextoMono>{a.escola} · {a.efeito}</TextoMono>
            </View>
            <Selo texto={a.grau} cor={corGrauReliquia(a.grau)} />
          </View>
        );
      })}

      <Divisor label="IV · Relíquias" />
      {content.reliquias.map((r) => (
        <Card key={r.id} acento={corGrauReliquia(r.grau)}>
          <View style={styles.linhaTitulo}>
            <TextoSerif style={{ fontSize: 19 }}>{r.nome}</TextoSerif>
            <Selo texto={r.grau} cor={corGrauReliquia(r.grau)} />
          </View>
          <TextoSerif style={{ fontSize: 16, color: cores.mudo, marginTop: 4 }}>{r.descricao}</TextoSerif>
          {r.grau === 'unica' && r.donoAtual && (
            <View style={styles.unica}>
              <Rotulo cor={cores.cinabrio}>Tem dono</Rotulo>
              <Text style={styles.unicaUso}>{r.usoPeloDono}</Text>
              {r.viasDeTomada && (
                <TextoMono style={{ color: cores.linha, marginTop: 4 }}>
                  vias: {r.viasDeTomada.join(' · ')}
                </TextoMono>
              )}
            </View>
          )}
        </Card>
      ))}
    </Pagina>
  );
}

function corGrauReliquia(grau: string): string {
  switch (grau) {
    case 'unica':
    case 'mitica':
      return cores.ouro;
    case 'proibida':
      return cores.cinabrio;
    case 'perdida':
      return cores.violeta;
    case 'rara':
      return cores.verdigris;
    default:
      return cores.mudo;
  }
}

void ({} as EstadoEntrada);

const styles = StyleSheet.create({
  intro: { color: cores.mudo, fontStyle: 'italic', marginBottom: esp.lg },
  attrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: esp.sm },
  attrNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 19 },
  attrVal: { fontFamily: fontes.monoMedium, color: cores.vellum, fontSize: 16 },
  attrMod: { color: cores.mudo, fontSize: 13 },
  invItem: { fontFamily: fontes.serif, color: cores.vellum, fontSize: 17, textTransform: 'capitalize' },
  pressaoDesc: { color: cores.linha, fontSize: 10, marginTop: 1 },
  derivGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.md },
  derivItem: { width: '28%', alignItems: 'center', marginBottom: esp.md },
  derivVal: { fontFamily: fontes.monoMedium, color: cores.ouro, fontSize: 22 },
  derivNome: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm },
  chipEscolaAtiva: { backgroundColor: cores.verdigris + '33', borderColor: cores.ouro },
  chipDesabilitado: { opacity: 0.35 },
  inputFusao: {
    fontFamily: fontes.serif,
    color: cores.vellum,
    fontSize: 16,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: 6,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
    marginTop: esp.sm,
    marginBottom: esp.sm,
  },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: esp.sm },
  segredo: { marginTop: esp.md, paddingTop: esp.md, borderTopWidth: 1, borderTopColor: cores.linha },
  mestreMec: { fontFamily: fontes.serif, color: cores.ouro, fontSize: 16, marginTop: esp.sm, fontStyle: 'italic' },
  livroLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: esp.sm,
    borderBottomWidth: 1,
    borderBottomColor: cores.fundo3,
    gap: esp.sm,
  },
  livroNome: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 17 },
  unica: { marginTop: esp.md, paddingTop: esp.sm, borderTopWidth: 1, borderTopColor: cores.linha },
  unicaUso: { fontFamily: fontes.serif, color: cores.vellum, fontSize: 15, marginTop: 2, fontStyle: 'italic' },
  chipAprender: {
    borderWidth: 1,
    borderColor: cores.verdigris,
    borderRadius: 6,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
  },
  chipConjurar: {
    borderWidth: 1,
    borderColor: cores.violeta,
    borderRadius: 6,
    paddingHorizontal: esp.md,
    paddingVertical: esp.sm,
  },
  chipAprenderTxt: { fontFamily: fontes.serifMedium, color: cores.vellum, fontSize: 15 },
  chipAprenderSub: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 10 },
  questObj: { flexDirection: 'row', gap: esp.sm, alignItems: 'flex-start', marginTop: 4 },
  questCheck: { fontFamily: fontes.mono, fontSize: 13 },
});
