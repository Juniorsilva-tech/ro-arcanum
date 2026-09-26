// ARCANUM · Painéis: Ficha, Vínculos, Crônica, Mapa e o Livro (GDD §13, §31, §32).
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Pagina, BarraVoltar } from './_layout';
import { TextoSerif, TextoMono, Card, Medidor, Divisor, Rotulo, Selo, Botao, BannerIlustrado } from '../components';
import { cores, fontes, esp, corPressao, corImpulso } from '../theme';
import { useGame } from '../store';
import { ComunidadeViva, CompromissosVivos, HistoriaViva, BiografiaViva } from './MundoVivo';
import { Progressao } from './Progressao';
import { MapaVisual } from './MapaVisual';
import { imagemDoLocal } from './Assentamento';
import {
  MITO_ORIGEM_MAGIA,
  DEUSES_PRIMORDIAIS,
  BRUXAS_DOS_PECADOS,
  FACCOES_ANTIGAS,
} from '@/content/vaelhorn/cosmologia';
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
  rotasVisiveis,
  escolasDominadas,
  podeFundir,
  artesConhecidasResolvidas,
  LIMITE_FUSOES,
  type AttrKey,
  type EstadoEntrada,
  type ContentBundle,
  todosNpcs,
  calcularContexto,
  retratoProgressaoNpc,
  obterOcupantesSubespaco,
  TRIBOS_CATALOGO,
  PROJETOS_CATALOGO,
  verificarSupressaoMana,
  avaliarReacaoHumanosPresenca,
  type SetorTrabalhoSubespaco,
  type TriboAcolhida,
  type EstrategiaCompanhia,
  type ModoKai,
  ocupacaoEfetiva,
  parentesConhecidos,
  familiasDe,
  feitosDoJogador,
  periodoAtual,
  calcularHumorNpc,
  obterIntimidadeNpc,
} from '@/engine';

// ─────────────────────────────────────────────── FICHA
export function Ficha() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const jogarCarta = useGame((s) => s.jogarCartaMemoria);
  const executarTreinoQuaseMorte = useGame((s) => s.executarTreinoQuaseMorteAcao);
  const alternarSakai = useGame((s) => s.alternarSakaiModoAcao);
  const [msgTreino, setMsgTreino] = useState<string | null>(null);
  const p = camp.personagem;
  const nomes = content.cenario.nomesAtributos;
  const d = derivados(p, bonusDefesaEquip(content, p));
  const arma = armaEquipada(content, p);
  const classe = content.classes.find((c) => c.id === p.classeId);

  return (
    <Pagina>
      <BarraVoltar titulo="Ficha" />
      <TextoSerif style={{ fontSize: 30, color: cores.ouro }}>{p.nome}</TextoSerif>
      {content.cenario.id === 'tsukimichi' ? (
        <TextoMono style={{ marginBottom: esp.md }}>
          {classe?.nome} · {p.idade ?? 18} anos · {p.cartaoAventureiro?.registrado ? `Guilda: Rank ${p.cartaoAventureiro.rank} (Oficial: Nv. 1 · Poder Incomensurável)` : 'Sem registro na Guilda (Poder Não Mensurado)'} · {p.dinheiro} moedas
        </TextoMono>
      ) : (
        <TextoMono style={{ marginBottom: esp.md }}>
          {classe?.nome} · {p.idade ?? 18} anos · nível {p.nivel} · {p.xp} xp · {p.dinheiro} moedas
        </TextoMono>
      )}
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

      {p.cartaoAventureiro?.registrado ? (
        <Card acento={cores.ouro}>
          <View style={styles.linhaTitulo}>
            <TextoSerif style={{ fontSize: 20, color: cores.ouro }}>
              Cartão da Guilda de Tsige · Rank {p.cartaoAventureiro.rank}
            </TextoSerif>
            <Selo texto="PARÂMETROS QUEBRADOS" cor={cores.ouro} />
          </View>
          <TextoMono style={{ color: cores.vellum, marginTop: 6, fontSize: 13 }}>
            Nível Oficial da Orbe: 1 (Erro de Medição / Overflow de Mana)
          </TextoMono>
          <TextoMono style={{ color: cores.verdigris, marginTop: 4 }}>
            Poder Real da Alma: Incomensurável (Fora do sistema de bênçãos da Deusa)
          </TextoMono>
          <TextoMono style={{ color: cores.mudo, marginTop: 4 }}>
            Referência de Níveis do Mundo: Campeões da Guilda ~Nv. 350–400 · Bestas Primordiais Nv. 1200–2000
          </TextoMono>
          <TextoMono style={{ color: cores.linha, marginTop: 4, fontStyle: 'italic' }}>
            A orbe de cristal de Tsige não foi concebida para mensurar sua assinatura de mana. Para a recepcionista você é um mero Rank E descartável; para a Wasteland, uma calamidade andando.
          </TextoMono>
        </Card>
      ) : content.cenario.id === 'tsukimichi' ? (
        <Card acento={cores.linha}>
          <View style={styles.linhaTitulo}>
            <TextoSerif style={{ fontSize: 18, color: cores.mudo }}>
              Guilda de Aventureiros · Sem Registro
            </TextoSerif>
            <Selo texto="NÃO AVALIADO" cor={cores.linha} />
          </View>
          <TextoMono style={{ color: cores.mudo, marginTop: 4 }}>
            Você ainda não possui Cartão de Aventureiro nem Rank oficial na Guilda.
          </TextoMono>
          <TextoMono style={{ color: cores.linha, marginTop: 2 }}>
            Visite a Guilda de Aventureiros em Tsige para tocar na Orbe de Medição e avaliar sua assinatura de mana.
          </TextoMono>
        </Card>
      ) : null}

      {p.sakai?.desbloqueado && (
        <Card acento={cores.violeta}>
          <View style={styles.linhaTitulo}>
            <TextoSerif style={{ fontSize: 18, color: cores.violeta }}>
              Kai (Sakai) · Domínio Divino Inato (Nível {p.sakai.nivel})
            </TextoSerif>
            {p.sakai.modoAtivo ? (
              <Selo texto={`ATIVO: ${p.sakai.modoAtivo.toUpperCase()}`} cor={cores.ouro} />
            ) : (
              <Selo texto="INATIVO" cor={cores.linha} />
            )}
          </View>
          <TextoMono style={{ color: cores.linha, marginTop: 2, fontStyle: 'italic' }}>
            Dádiva primordial concedida por Tsukuyomi — controle do vácuo de mana que governa sentidos, barreiras, fortalecimento e magia.
          </TextoMono>

          {/* Descrição do modo ativo */}
          {p.sakai.modoAtivo === 'percepcao' && (
            <TextoMono style={{ color: cores.verdigris, marginTop: 4 }}>
              ◆ Percepção Ativa: visão 360° que mapeia seres vivos e antecipa movimentos (+acerto e revelação de rotas).
            </TextoMono>
          )}
          {p.sakai.modoAtivo === 'fortalecimento' && (
            <TextoMono style={{ color: cores.ouro, marginTop: 4 }}>
              ◆ Fortalecimento Ativo: mana infundido nas fibras musculares e esqueleto (+dano físico massivo e defesa sólida).
            </TextoMono>
          )}
          {p.sakai.modoAtivo === 'magia' && (
            <TextoMono style={{ color: cores.ouro, marginTop: 4 }}>
              ◆ Magia Ativa: correntes arcanas condensadas e aceleradas (+dano mágico massivo e amplificação arcana).
            </TextoMono>
          )}
          {p.sakai.modoAtivo === 'audicao' && (
            <TextoMono style={{ color: cores.verdigris, marginTop: 4 }}>
              ◆ Audição Ativa: captação sônica e acústica a quilômetros, anulando qualquer chance de emboscada (+acerto e iniciativa).
            </TextoMono>
          )}
          {p.sakai.modoAtivo === 'barreira_magica' && (
            <TextoMono style={{ color: cores.verdigris, marginTop: 4 }}>
              ◆ Barreira Mágica Ativa: película impenetrável de mana puro que dispersa feitiços e maldições (+defesa mágica).
            </TextoMono>
          )}
          {p.sakai.modoAtivo === 'barreira_fisica' && (
            <TextoMono style={{ color: cores.ouro, marginTop: 4 }}>
              ◆ Barreira Física Ativa: compressão espacial que bloqueia lâminas, projéteis e impacto cinético (+defesa física).
            </TextoMono>
          )}
          {p.sakai.modoAtivo === 'cura' && (
            <TextoMono style={{ color: cores.verdigris, marginTop: 4 }}>
              ◆ Cura Ativa: manto regenerativo nutrindo tecidos corporais (+cura contínua).
            </TextoMono>
          )}
          {p.sakai.modoAtivo === 'supressao' && (
            <TextoMono style={{ color: cores.ouro, marginTop: 4 }}>
              ◆ Supressão Ativa: aura oculta para impedir que hyumans e feras entrem em pânico (+defesa equilibrada).
            </TextoMono>
          )}
          {p.sakai.modoAtivo === 'destruicao' && (
            <TextoMono style={{ color: cores.cinabrio, marginTop: 4 }}>
              ◆ Destruição Ativa: fio de corte espacial singular que ignora qualquer armadura ou defesa (+dano puro).
            </TextoMono>
          )}
          {p.sakai.modoAtivo === 'sentidos' && (
            <TextoMono style={{ color: cores.verdigris, marginTop: 4 }}>
              ◆ Sentidos Cósmicos Ativos: visão espectral e percepção temporal acelerada (+acerto e evasão).
            </TextoMono>
          )}

          {/* Botões de alternância rápida dos modos dominados */}
          <View style={{ marginTop: esp.sm, paddingTop: esp.sm, borderTopWidth: 1, borderTopColor: cores.linha }}>
            <TextoMono style={{ color: cores.mudo, fontSize: 11, marginBottom: 4 }}>
              Modos Dominados (toque para ativar/desativar):
            </TextoMono>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: esp.xs }}>
              {p.sakai.modosDisponiveis.map((m) => {
                const ativo = p.sakai?.modoAtivo === m;
                const rotulos: Record<string, string> = {
                  percepcao: 'Percepção',
                  fortalecimento: 'Fortalecimento',
                  magia: 'Magia',
                  audicao: 'Audição',
                  barreira_magica: 'Barreira Mágica',
                  barreira_fisica: 'Barreira Física',
                  cura: 'Cura',
                  supressao: 'Supressão',
                  destruicao: 'Destruição',
                  sentidos: 'Sentidos',
                };
                return (
                  <Botao
                    key={m}
                    titulo={`${ativo ? '✓ ' : ''}${rotulos[m] ?? m}`}
                    variante={ativo ? 'primario' : 'fantasma'}
                    onPress={async () => {
                      await alternarSakai(m);
                    }}
                  />
                );
              })}
            </View>
          </View>

          <TextoMono style={{ color: cores.mudo, marginTop: esp.sm, fontSize: 11 }}>
            Treinos Realizados: {p.sakai.treinosRealizados ?? 0} · Domínio Acumulado: {p.sakai.experienciaTreino ?? 0} XP
          </TextoMono>
        </Card>
      )}

      {content.cenario.id === 'tsukimichi' && (
        <Card acento={cores.cinabrio}>
          <View style={styles.linhaTitulo}>
            <TextoSerif style={{ fontSize: 18, color: cores.ouro }}>
              Concentração Total · Quase-Morte Consciente
            </TextoSerif>
            <Selo texto={`CICLOS: ${p.treinoQuaseMorte?.ciclosConcluidos ?? 0}`} cor={cores.cinabrio} />
          </View>
          <TextoMono style={{ color: cores.linha, marginTop: 4, fontStyle: 'italic' }}>
            Disciplina extrema de foco no Vazio para qualquer caminho (espada, arco, magia primordial ou combate marcial): a respiração cessa, o coração silencia e o corpo experimenta a morte clínica temporária. Ao despertar do vácuo, o recipiente de mana estilhaça limites e expande permanentemente.
          </TextoMono>
          <TextoMono style={{ color: cores.verdigris, marginTop: 6 }}>
            ◆ Mana Máximo Expandido: +{p.treinoQuaseMorte?.manaExpandidoTotal ?? 0} (Capacidade Total: {p.recursosMax.mana ?? 10})
          </TextoMono>
          <TextoMono style={{ color: cores.mudo, marginTop: 2, fontSize: 12 }}>
            A cada ciclo de renascimento consciente, atributos (Precisão, Resiliência, Raciocínio, Físico) transcendem a escala dos mortais e o Domínio do Kai evolui (+40 XP).
          </TextoMono>
          {msgTreino && (
            <TextoMono style={{ color: cores.ouro, marginTop: 6, fontStyle: 'italic' }}>
              {msgTreino}
            </TextoMono>
          )}
          <View style={{ marginTop: 8 }}>
            <Botao
              titulo="Executar Ciclo de Quase-Morte Consciente"
              variante="primario"
              onPress={async () => {
                const msg = await executarTreinoQuaseMorte();
                setMsgTreino(msg);
              }}
            />
          </View>
        </Card>
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
          {p.equipado.armadura ? itemPorId(content, p.equipado.armadura, p)?.nome : '—'}
        </TextoMono>
      </View>

      {Object.keys(p.inventario).length > 0 && (
        <>
          <Divisor label="inventário" />
          {Object.entries(p.inventario).map(([id, qtd]) => (
            <View key={id} style={styles.attrRow}>
              <Text style={styles.invItem}>{itemPorId(content, id, p)?.nome ?? id.replace(/_/g, ' ')}</Text>
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

function nomeRecurso(content: ContentBundle, id: string): string {
  if (id === 'vida') return 'Vida';
  return content.cenario.recursos.find((r) => r.id === id)?.nome ?? id;
}

function pontuacaoVinculo(din: { eixos: Record<string, number>; vivo: boolean } | undefined): number {
  if (!din) return -999;
  return Object.values(din.eixos).reduce((s, v) => s + Math.abs(v), 0) + (din.vivo ? 0 : 1000);
}

function filtroVinculo(
  npc: { id: string; parentesco?: string; relacoes?: { tipo: string }[] },
  camp: { npcState: Record<string, { eixos: Record<string, number>; vivo: boolean; tensao?: number }> },
  filtro: 'todos' | 'aliados' | 'rivais' | 'familia' | 'mortos',
): boolean {
  const din = camp.npcState[npc.id];
  if (filtro === 'todos') return true;
  if (filtro === 'mortos') return din ? !din.vivo : false;
  if (filtro === 'familia') return !!npc.parentesco;
  const tipos = new Set((npc.relacoes ?? []).map((r) => r.tipo));
  const confianca = din?.eixos.confianca ?? 0;
  const medo = din?.eixos.medo ?? 0;
  if (filtro === 'aliados') return tipos.has('aliada') || tipos.has('amante') || tipos.has('protege') || confianca >= 20;
  return tipos.has('rival') || tipos.has('desconfia') || medo >= 20 || (din?.tensao ?? 0) >= 60;
}

// Família do elenco (engine/familiasNpc.ts): o nome da família e os
// parentes que o jogador já conhece. Quem ele nunca encontrou não aparece —
// a ficha mostra o que ele sabe, não a árvore inteira.
function FamiliaDoNpc({ id }: { id: string }) {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const familia = familiasDe(content, id)[0];
  if (!familia) return null;
  const conhecidos = parentesConhecidos(content, camp, id);
  const luto = camp.familiasNpc?.lutos[id]?.at(-1);
  return (
    <View style={{ marginBottom: esp.sm }}>
      <Rotulo cor={cores.ouro}>Família · {familia.nome}</Rotulo>
      {conhecidos.length > 0
        ? conhecidos.map((p) => <TextoMono key={p.nome}>{p.nome}, {p.laco}{p.vivo ? '' : ' (não vive mais)'}</TextoMono>)
        : <TextoMono>Você ainda não conhece ninguém da família dela.</TextoMono>}
      {luto && camp.calendario.dia - luto.dia <= 60 && <TextoMono style={{ color: cores.cinabrio }}>De luto há {camp.calendario.dia - luto.dia} dia(s).</TextoMono>}
    </View>
  );
}

// ─────────────────────────────────────────────── VÍNCULOS
export function Vinculos() {
  const camp = useGame((s) => s.camp)!;
  const content = useGame((s) => s.content)!;
  const eixos = content.cenario.eixosRelacao;
  const resgatar = useGame(s => s.resgatarFamiliar);
  const alternarCompanheiro = useGame(s => s.alternarCompanheiroAcao);
  const agirMundo = useGame(s => s.acaoMundo);
  const acolherTribo = useGame(s => s.acolherTriboAcao);
  const definirAlocacao = useGame(s => s.definirAlocacaoTrabalhoAcao);
  const iniciarConstrucao = useGame(s => s.iniciarConstrucaoAcao);
  const avancarCiclo = useGame(s => s.avancarCicloSubespacoAcao);
  const definirEstrategia = useGame(s => s.definirEstrategiaCompanhiaAcao);
  const despacharCaravana = useGame(s => s.despacharCaravanaAcao);
  const alternarSakai = useGame(s => s.alternarSakaiModoAcao);
  const [avisoGrupo, setAvisoGrupo] = useState('');
  const [avisoAsora, setAvisoAsora] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'aliados' | 'rivais' | 'familia' | 'mortos'>('todos');

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
  const visiveis = lista
    .filter((n) => filtroVinculo(n, camp, filtro))
    .sort((a, b) => pontuacaoVinculo(camp.npcState[b.id]) - pontuacaoVinculo(camp.npcState[a.id]));
  const filtros = [
    ['todos', 'Todos'], ['aliados', 'Aliados'], ['rivais', 'Rivais'],
    ['familia', 'Família'], ['mortos', 'Mortos'],
  ] as const;

  return (
    <Pagina>
      <BarraVoltar titulo="Vínculos" />
      <TextoSerif style={styles.intro}>
        Afeto não é confiança. Alguém pode te amar e não te confiar nada.
      </TextoSerif>
      <View style={styles.vinculoFiltros}>
        <TextoMono style={styles.vinculoContagem}>{visiveis.length} vínculo(s) visível(is)</TextoMono>
        <View style={styles.vinculoChips}>
          {filtros.map(([id, label]) => (
            <Pressable key={id} onPress={() => setFiltro(id)} style={[styles.vinculoChip, filtro === id && styles.vinculoChipAtivo]}>
              <Text style={[styles.vinculoChipTxt, filtro === id && styles.vinculoChipTxtAtivo]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {!!avisoGrupo && <TextoMono style={{ color: cores.ouro, marginBottom: esp.md }}>{avisoGrupo}</TextoMono>}
      {visiveis.map((n) => {
        const din = camp.npcState[n.id];
        const sabeSegredo = camp.segredosRevelados.includes(n.id);
        const parente = camp.familia?.membros.find(m => m.id === n.id);
        const noGrupo = (camp.grupo ?? []).includes(n.id);
        const presente = combatentesPresentes.some(p => p.id === n.id);
        const humor = calcularHumorNpc(camp, content, n);
        const intimidade = obterIntimidadeNpc(camp, n);
        const origemTxt = intimidade.origem ? n.historia?.origem : undefined;
        const desejoTxt = intimidade.desejo ? n.historia?.desejo : undefined;
        const feridaTxt = intimidade.ferida ? n.historia?.ferida : undefined;
        const medoTxt = intimidade.medo ? n.historia?.medo : undefined;
        return (
          <Card key={n.id}>
            <View style={styles.linhaTitulo}>
              <TextoSerif style={{ fontSize: 22, color: cores.vellum }}>{n.nome}</TextoSerif>
              <View style={{ flexDirection: 'row', gap: esp.xs, alignItems: 'center' }}>
                <Selo texto={`${humor.icone} ${humor.rotulo.toUpperCase()}`} cor={humor.cor} />
                {din.tensao >= 60 && <Selo texto="afastando-se" cor={cores.cinabrio} />}
              </View>
            </View>
            <TextoMono style={{ fontSize: 13, color: humor.cor, marginBottom: esp.xs }}>
              {humor.descricao}
            </TextoMono>
            <TextoMono style={{ marginBottom: esp.sm }}>{ocupacaoEfetiva(camp, n)}</TextoMono>
            <FamiliaDoNpc id={n.id} />
            {n.combatente && <TextoMono>Prática adquirida: {retratoProgressaoNpc(camp, n)?.maestria} · vida máxima {retratoProgressaoNpc(camp, n)?.vidaMax} · dano {retratoProgressaoNpc(camp, n)?.dano}</TextoMono>}
            {noGrupo && din.vivo && <Botao titulo="Treinar juntos · 5 moedas" onPress={() => agirMundo({ tipo: 'treinar_companheiro', npcId: n.id })} />}
            {n.parentesco && <Selo texto={n.parentesco.toUpperCase()} cor={cores.ouro} />}
            <BiografiaViva id={n.id} />
            {parente && parente.condicao !== 'livre' && <Selo texto={parente.condicao.toUpperCase()} cor={cores.cinabrio} />}
            {n.combatente && <Selo texto={noGrupo ? 'NO GRUPO' : 'COMBATENTE'} cor={noGrupo ? cores.verdigris : cores.mudo} />}
            {!!din.conviccoes?.length && (
              <View style={styles.conviccoes}>
                <Rotulo cor={cores.violeta}>Convicções de {n.nome.split(/[ ,]/)[0]}</Rotulo>
                {din.conviccoes.map((c) => <TextoMono key={c.id} style={styles.conviccao}>{c.texto}</TextoMono>)}
              </View>
            )}
            {eixos.map((e) => {
              const v = din.eixos[e.id] ?? 0;
              const cor = e.id === 'medo' ? cores.cinabrio : e.id === 'confianca' ? cores.verdigris : cores.ouro;
              return (
                <Medidor key={e.id} rotulo={e.nome} valor={Math.max(0, v + 20)} max={40} cor={cor} compacto />
              );
            })}
            <View style={styles.intimidadeBox}>
              <Rotulo cor={cores.ouro}>Camadas de Intimidade & História</Rotulo>
              <View style={styles.camadaItem}>
                <TextoMono style={styles.camadaTitulo}>📖 Origem:</TextoMono>
                <TextoSerif style={origemTxt ? styles.camadaTexto : styles.camadaOculta}>
                  {origemTxt ?? 'Origem ainda desconhecida.'}
                </TextoSerif>
              </View>
              <View style={styles.camadaItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: esp.xs }}>
                  <TextoMono style={styles.camadaTitulo}>💭 Anseio de Vida:</TextoMono>
                  {intimidade.desejoApoiado && <Selo texto="APOIADO & LEAL" cor={cores.verdigris} />}
                </View>
                <TextoSerif style={desejoTxt ? styles.camadaTexto : styles.camadaOculta}>
                  {desejoTxt ?? '🔒 Conquiste mais confiança ou converse a sós para desvendar este anseio.'}
                </TextoSerif>
              </View>
              <View style={styles.camadaItem}>
                <TextoMono style={styles.camadaTitulo}>💔 Ferida Íntima:</TextoMono>
                <TextoSerif style={feridaTxt ? styles.camadaTexto : styles.camadaOculta}>
                  {feridaTxt ?? '🔒 Aprofunde os laços para que ela se sinta segura em abrir suas cicatrizes.'}
                </TextoSerif>
              </View>
              <View style={styles.camadaItem}>
                <TextoMono style={styles.camadaTitulo}>👁️ Maior Medo:</TextoMono>
                <TextoSerif style={medoTxt ? styles.camadaTexto : styles.camadaOculta}>
                  {medoTxt ?? '🔒 Uma alma só revela seus terrores mais profundos a quem é íntimo de verdade.'}
                </TextoSerif>
              </View>
            </View>

            {din.vivo && (
              <View style={styles.acoesIntimidade}>
                <Rotulo cor={cores.mudo}>Ações de Vínculo</Rotulo>
                <View style={{ gap: esp.xs, marginTop: 4 }}>
                  <Botao
                    titulo="Conversar a sós"
                    variante="fantasma"
                    onPress={() => agirMundo({ tipo: 'conversar_a_sos', npcId: n.id })}
                  />
                  {camp.personagem.dinheiro >= 10 && (
                    <Botao
                      titulo="Oferecer presente · 10 moedas"
                      variante="fantasma"
                      onPress={() => agirMundo({ tipo: 'presentear_npc', npcId: n.id })}
                    />
                  )}
                  {humor.id === 'luto' && (
                    <Botao
                      titulo="Prestar condolências & confortar luto"
                      variante="acento"
                      onPress={() => agirMundo({ tipo: 'confortar_luto_npc', npcId: n.id })}
                    />
                  )}
                  {intimidade.desejo && !intimidade.desejoApoiado && camp.personagem.dinheiro >= 20 && (
                    <Botao
                      titulo="Apoiar anseio de vida · 20 moedas"
                      variante="acento"
                      onPress={() => agirMundo({ tipo: 'apoiar_desejo_npc', npcId: n.id })}
                    />
                  )}
                </View>
              </View>
            )}

            {!!din.memoria.length && (
              <View style={styles.memoriaRecente}>
                <Rotulo cor={cores.mudo}>Memórias recentes</Rotulo>
                {din.memoria.slice(-2).reverse().map((m, i) => <TextoSerif key={`${m.turno}-${i}`} style={styles.memoriaTexto}>{m.resumo}</TextoSerif>)}
              </View>
            )}
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

      {camp.asora && Object.keys(camp.asora.contratos).length > 0 && (
        <>
          <Divisor label="contratos de alma · servas de asora" />
          <TextoSerif style={styles.intro}>
            Entidades ancestrais unidas por pacto de alma. A lealdade e o afeto moldam a harmonia de Asora.
          </TextoSerif>
          {Object.values(camp.asora.contratos).map((c) => (
            <Card key={c.id} acento={c.ativaNoGrupo ? cores.ouro : '#5B9BD5'}>
              <View style={styles.linhaTitulo}>
                <TextoSerif style={{ fontSize: 20 }}>{c.nomeConcedido} · {c.titulo}</TextoSerif>
                {c.nivelGuilda && <Selo texto={`NV. ${c.nivelGuilda}`} cor={cores.ouro} />}
              </View>
              {c.ativaNoGrupo && (
                <View style={{ marginVertical: 4 }}>
                  <Selo texto="COMPANHEIRA ATIVA NO GRUPO" cor={cores.verdigris} />
                </View>
              )}
              <TextoSerif style={{ marginTop: esp.sm, color: cores.vellum, fontSize: 16, lineHeight: 24 }}>
                {c.formaHumanoide.personalidade}
              </TextoSerif>
              <TextoMono style={{ color: cores.linha, marginTop: 4 }}>
                Vestes: {c.formaHumanoide.vestes}
              </TextoMono>
              <TextoMono style={{ marginTop: 6, color: cores.vellum }}>
                Pacto: {c.proporcao} · Lealdade: {c.lealdade}% · Afeto: {c.afeto}% · Ciúme: {c.ciume}%
              </TextoMono>
              <TextoMono style={{ color: cores.mudo, marginTop: 2 }}>
                Papel em Asora: {c.papelAsora ?? 'companheira'} · Forma original: {c.formaOriginal}
              </TextoMono>
            </Card>
          ))}
        </>
      )}

      {camp.asora && (() => {
        const asora = camp.asora;
        const temContrato = Object.keys(asora.contratos).length > 0;
        if (!asora.desbloqueado || !temContrato) {
          return (
            <>
              <Divisor label="subespaço dimensional · selado" />
              <Card acento={cores.mudo}>
                <View style={styles.linhaTitulo}>
                  <TextoSerif style={{ fontSize: 18, color: cores.mudo }}>
                    Subespaço Dimensional Selado
                  </TextoSerif>
                  <Selo texto="AGUARDANDO PACTO" cor={cores.mudo} />
                </View>
                <TextoSerif style={{ marginTop: esp.sm, color: cores.vellum, fontSize: 15, lineHeight: 22 }}>
                  O domínio dimensional autônomo permanece selado. Nas lendas da Wasteland, o subespaço só desperta quando o convocado firma um Contrato de Alma (Pacto Mestre-Servo) com uma Besta Primordial do Ermo (como Shen no Desfiladeiro ou a Calamidade Voraz no Pântano).
                </TextoSerif>
                <TextoMono style={{ marginTop: esp.sm, color: cores.ouro, fontSize: 12 }}>
                  Explore a Grande Terra Desolada para avistar, subjugar e pactuar com as feras ancestrais.
                </TextoMono>
              </Card>
            </>
          );
        }

        return (
          <>
            <Divisor label={`subespaço dimensional · ${asora.nome || 'soberania pessoal'}`} />
            {avisoAsora ? (
              <Card acento={cores.ouro}>
                <TextoSerif style={{ color: cores.ouro, fontSize: 15 }}>{avisoAsora}</TextoSerif>
              </Card>
            ) : null}

            {/* 1. SOBERANIA & DADOS GERAIS */}
            <Card acento="#5B9BD5">
              <View style={styles.linhaTitulo}>
                <TextoSerif style={{ fontSize: 20, color: '#5B9BD5' }}>
                  {asora.nome || 'Subespaço Pessoal'}
                </TextoSerif>
                <Selo texto="SOBERANIA DIMENSIONAL" cor="#5B9BD5" />
              </View>
              <TextoMono style={{ marginTop: 6, color: cores.vellum }}>
                População Total: {asora.populacao} cidadãos acolhidos · Segurança: {asora.seguranca}% · Harmonia: {asora.harmonia}%
              </TextoMono>
              <TextoMono style={{ color: cores.linha, marginTop: 4 }}>
                Estoques: {asora.estoques.comida} alimentos · {asora.estoques.seda} seda celestial · {asora.estoques.minerio} minério estelar · {asora.estoques.draupnir} anéis Draupnir
              </TextoMono>
              <TextoMono style={{ color: cores.ouro, marginTop: 4 }}>
                Ferramentas Rúnicas Disponíveis: {asora.recursosEspeciais?.ferramentasDisponiveis ?? 0} (Elder Dwarves) · Madeira Nobre: {asora.recursosEspeciais?.madeiraNobre ?? 0}
              </TextoMono>

              {/* Presença de quem está no subespaço agora */}
              {(() => {
                const dadosPresenca = obterOcupantesSubespaco(camp);
                return (
                  <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: cores.linha }}>
                    <TextoSerif style={{ fontSize: 15, color: '#5B9BD5' }}>
                      Ocupação do Subespaço no Momento:
                    </TextoSerif>
                    <TextoMono style={{ color: dadosPresenca.jogadorPresente ? cores.verdigris : cores.mudo, marginTop: 2, fontSize: 12 }}>
                      Status do Soberano: {dadosPresenca.jogadorPresente ? 'Presente no subespaço' : 'Fora (no mundo exterior)'}
                    </TextoMono>
                    <TextoMono style={{ color: cores.vellum, marginTop: 2, fontSize: 11 }}>
                      Presentes agora: {dadosPresenca.ocupantes.length > 0 ? dadosPresenca.ocupantes.map((o) => `${o.nome} [${o.papel}]`).join(' · ') : 'Nenhum ocupante registrado'}
                    </TextoMono>
                  </View>
                );
              })()}
            </Card>

            {/* 2. CONTENÇÃO DE MANA & SUPRESSÃO COM O KAI */}
            <Card acento={verificarSupressaoMana(camp).suprimido ? cores.verdigris : cores.cinabrio}>
              <View style={styles.linhaTitulo}>
                <TextoSerif style={{ fontSize: 18, color: verificarSupressaoMana(camp).suprimido ? cores.verdigris : cores.cinabrio }}>
                  Contenção de Mana & Domínio do Kai (Sakai)
                </TextoSerif>
                <Selo
                  texto={verificarSupressaoMana(camp).suprimido ? 'MANA SUPRIMIDO' : 'AURA TRANSBORDANDO'}
                  cor={verificarSupressaoMana(camp).suprimido ? cores.verdigris : cores.cinabrio}
                />
              </View>
              <TextoSerif style={{ marginTop: 4, color: cores.vellum, fontSize: 14 }}>
                {verificarSupressaoMana(camp).motivo}
              </TextoSerif>
              <TextoMono style={{ marginTop: 4, color: cores.linha, fontSize: 12 }}>
                Reação nos Mercados Humanos: {avaliarReacaoHumanosPresenca(camp).descricaoNarrativa}
              </TextoMono>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm, marginTop: esp.sm }}>
                <Botao
                  titulo="Ativar Sakai: Supressão"
                  variante={camp.personagem.sakai?.modoAtivo === 'supressao' ? 'primario' : 'fantasma'}
                  onPress={async () => setAvisoAsora(await alternarSakai('supressao'))}
                />
                <Botao
                  titulo="Ativar Sakai: Fortalecimento"
                  variante={camp.personagem.sakai?.modoAtivo === 'fortalecimento' ? 'primario' : 'fantasma'}
                  onPress={async () => setAvisoAsora(await alternarSakai('fortalecimento'))}
                />
                {camp.personagem.sakai?.modoAtivo ? (
                  <Botao
                    titulo="Desativar Sakai (Modo Normal)"
                    variante="fantasma"
                    onPress={async () => setAvisoAsora(await alternarSakai(camp.personagem.sakai!.modoAtivo!))}
                  />
                ) : null}
              </View>
            </Card>

            {/* 3. AFAZERES DO SUBESPAÇO & ALOCAÇÃO DE TRABALHO */}
            <Card acento={cores.ouro}>
              <View style={styles.linhaTitulo}>
                <TextoSerif style={{ fontSize: 18, color: cores.ouro }}>
                  Frentes de Trabalho & Afazeres de Asora
                </TextoSerif>
                <Selo texto="ORGANIZAÇÃO LABORAL" cor={cores.ouro} />
              </View>
              <TextoSerif style={{ color: cores.vellum, marginTop: 4, fontSize: 14 }}>
                Distribua a população acolhida pelos afazeres práticos. O canteiro de obras requer operários ativos para erguer monumentos.
              </TextoSerif>

              {(() => {
                const aloc = asora.alocacaoTrabalho ?? {
                  agricultura: 0,
                  mineracao: 0,
                  forja_ferramentas: 0,
                  tecelagem: 0,
                  seguranca_patrulha: 0,
                  construcao_obras: 0,
                };
                const totalAlocado = Object.values(aloc).reduce((a, b) => a + b, 0);
                const livres = Math.max(0, asora.populacao - totalAlocado);

                const setores: { id: SetorTrabalhoSubespaco; nome: string; desc: string }[] = [
                  { id: 'agricultura', nome: 'Agricultura & Plantações', desc: 'Produz alimentos em grande escala' },
                  { id: 'mineracao', nome: 'Mineração & Pedreiras', desc: 'Extrai minério estelar das montanhas' },
                  { id: 'forja_ferramentas', nome: 'Forjas de Ferramentas (Anões)', desc: 'Gera ferramentas rúnicas para construções' },
                  { id: 'tecelagem', nome: 'Ateliê & Fiação de Seda', desc: 'Produz seda mágica e vestes' },
                  { id: 'seguranca_patrulha', nome: 'Patrulhas de Fronteira', desc: 'Eleva a segurança territorial' },
                  { id: 'construcao_obras', nome: 'Canteiro de Obras Ativo', desc: 'Trabalha nas grandes construções' },
                ];

                const alterar = async (setor: SetorTrabalhoSubespaco, delta: number) => {
                  const atual = aloc[setor] ?? 0;
                  const novo = Math.max(0, atual + delta);
                  if (delta > 0 && livres < delta) {
                    setAvisoAsora('Não há trabalhadores livres suficientes em repouso.');
                    return;
                  }
                  const res = await definirAlocacao({ [setor]: novo });
                  setAvisoAsora(res);
                };

                return (
                  <View style={{ marginTop: esp.sm }}>
                    <TextoMono style={{ color: livres > 0 ? cores.verdigris : cores.mudo, marginBottom: esp.xs }}>
                      Trabalhadores em Repouso/Reserva: {livres} de {asora.populacao}
                    </TextoMono>
                    {setores.map((s) => (
                      <View
                        key={s.id}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 4,
                          borderBottomWidth: 1,
                          borderBottomColor: cores.fundo3,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <TextoMono style={{ color: cores.vellum, fontSize: 13 }}>
                            {s.nome}: <Text style={{ color: cores.ouro, fontWeight: 'bold' }}>{aloc[s.id] ?? 0}</Text>
                          </TextoMono>
                          <TextoMono style={{ color: cores.mudo, fontSize: 10 }}>{s.desc}</TextoMono>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <Pressable
                            onPress={() => alterar(s.id, -5)}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              backgroundColor: cores.fundo3,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ color: cores.vellum, fontSize: 12 }}>-5</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => alterar(s.id, 5)}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              backgroundColor: cores.linha,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ color: cores.ouro, fontSize: 12 }}>+5</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}

                    <View style={{ marginTop: esp.md }}>
                      <Botao
                        titulo="Avançar Ciclo de Trabalho (Colheita & Produção)"
                        variante="primario"
                        onPress={async () => setAvisoAsora(await avancarCiclo())}
                      />
                    </View>
                  </View>
                );
              })()}
            </Card>

            {/* 4. POVOAMENTO ORGÂNICO & TRIBOS ACOLHIDAS */}
            <Card acento="#5B9BD5">
              <View style={styles.linhaTitulo}>
                <TextoSerif style={{ fontSize: 18, color: '#5B9BD5' }}>
                  Tribos da Wasteland & Povoamento Orgânico
                </TextoSerif>
                <Selo texto="DEMI-HUMANOS" cor="#5B9BD5" />
              </View>
              <TextoSerif style={{ color: cores.vellum, marginTop: 4, fontSize: 14 }}>
                A população do subespaço não surge por decreto: cada tribo resgatada na Wasteland traz conhecimentos, trabalhadores e matérias-primas únicas.
              </TextoSerif>

              {/* Tribos já acolhidas */}
              <View style={{ marginTop: esp.sm }}>
                <TextoMono style={{ color: cores.ouro, fontSize: 13, marginBottom: 4 }}>Tribos Integradas:</TextoMono>
                {asora.tribosAcolhidas && Object.keys(asora.tribosAcolhidas).length > 0 ? (
                  Object.values(asora.tribosAcolhidas).map((t) => (
                    <View key={t.id} style={{ marginBottom: 4, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: cores.verdigris }}>
                      <TextoMono style={{ color: cores.vellum, fontSize: 12 }}>
                        {t.nome} ({t.populacao} membros): {t.especialidade}
                      </TextoMono>
                    </View>
                  ))
                ) : (
                  <TextoMono style={{ color: cores.mudo, fontSize: 12 }}>Nenhuma tribo acolhida formalmente ainda.</TextoMono>
                )}
              </View>

              {/* Tribos disponíveis para acolher */}
              {(() => {
                const naoAcolhidas = (Object.keys(TRIBOS_CATALOGO) as (keyof typeof TRIBOS_CATALOGO)[]).filter(
                  (tid) => !asora.tribosAcolhidas?.[tid],
                );
                if (naoAcolhidas.length === 0) return null;
                return (
                  <View style={{ marginTop: esp.md, paddingTop: esp.sm, borderTopWidth: 1, borderTopColor: cores.linha }}>
                    <TextoMono style={{ color: '#5B9BD5', fontSize: 13, marginBottom: 6 }}>
                      Tribos Resgatáveis na Wasteland:
                    </TextoMono>
                    {naoAcolhidas.map((tid) => {
                      const def = TRIBOS_CATALOGO[tid];
                      return (
                        <View key={tid} style={{ marginBottom: esp.sm, backgroundColor: cores.fundo3, padding: esp.sm, borderRadius: 6 }}>
                          <TextoSerif style={{ fontSize: 16, color: cores.vellum }}>{def.nome}</TextoSerif>
                          <TextoMono style={{ color: cores.mudo, fontSize: 11, marginTop: 2 }}>{def.descricao}</TextoMono>
                          <TextoMono style={{ color: cores.ouro, fontSize: 11, marginTop: 2 }}>
                            Especialidade: {def.especialidade} (+{def.populacaoInicial} indivíduos)
                          </TextoMono>
                          <View style={{ marginTop: esp.xs }}>
                            <Botao
                              titulo={`Acolher ${def.nome} em Asora`}
                              variante="fantasma"
                              onPress={async () => setAvisoAsora(await acolherTribo(tid))}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
            </Card>

            {/* 5. CANTEIRO DE OBRAS & GRANDES PROJETOS */}
            <Card acento={cores.ouro}>
              <View style={styles.linhaTitulo}>
                <TextoSerif style={{ fontSize: 18, color: cores.ouro }}>
                  Canteiro de Obras & Grandes Monumentos
                </TextoSerif>
                <Selo texto="INFRAESTRUTURA" cor={cores.ouro} />
              </View>
              <TextoSerif style={{ color: cores.vellum, marginTop: 4, fontSize: 14 }}>
                Obras que eram impossíveis por falta de materiais ou de ferramentas rúnicas dos anões tornam-se viáveis conforme Asora progride.
              </TextoSerif>

              {/* Obra em andamento */}
              {asora.projetoEmAndamento ? (
                <View style={{ marginTop: esp.sm, padding: esp.sm, backgroundColor: cores.fundo3, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: cores.ouro }}>
                  <TextoSerif style={{ fontSize: 16, color: cores.ouro }}>
                    Obra em Execução: {asora.projetoEmAndamento.nome}
                  </TextoSerif>
                  <TextoMono style={{ color: cores.vellum, fontSize: 12, marginTop: 2 }}>
                    Ciclos Restantes: {asora.projetoEmAndamento.turnosRestantes} · Operários Dedicados: {asora.projetoEmAndamento.operariosAlocados}
                  </TextoMono>
                </View>
              ) : null}

              {/* Catálogo de Projetos */}
              <View style={{ marginTop: esp.md }}>
                <TextoMono style={{ color: cores.ouro, fontSize: 13, marginBottom: 6 }}>Projetos Catalogados:</TextoMono>
                {Object.values(PROJETOS_CATALOGO).map((proj) => {
                  const concluido = asora.projetosConcluidos?.includes(proj.id);
                  const emAndamento = asora.projetoEmAndamento?.id === proj.id;
                  const ferrDisp = asora.recursosEspeciais?.ferramentasDisponiveis ?? 0;
                  const semFerramentas = ferrDisp < proj.custo.ferramentas;
                  const operariosAlocados = asora.alocacaoTrabalho?.construcao_obras ?? 0;
                  const semOperarios = operariosAlocados < proj.operariosNecessarios;
                  const semTribo = proj.triboObrigatoria && !asora.tribosAcolhidas?.[proj.triboObrigatoria];

                  return (
                    <View
                      key={proj.id}
                      style={{
                        marginBottom: esp.sm,
                        padding: esp.sm,
                        backgroundColor: concluido ? cores.fundo3 + '88' : cores.fundo3,
                        borderRadius: 6,
                        borderLeftWidth: 2,
                        borderLeftColor: concluido ? cores.verdigris : emAndamento ? cores.ouro : cores.linha,
                      }}
                    >
                      <View style={styles.linhaTitulo}>
                        <TextoSerif style={{ fontSize: 16, color: concluido ? cores.verdigris : cores.vellum }}>
                          {proj.nome}
                        </TextoSerif>
                        {concluido ? (
                          <Selo texto="CONCLUÍDO" cor={cores.verdigris} />
                        ) : emAndamento ? (
                          <Selo texto="EM EXECUÇÃO" cor={cores.ouro} />
                        ) : null}
                      </View>
                      <TextoMono style={{ color: cores.mudo, fontSize: 11, marginTop: 2 }}>{proj.descricao}</TextoMono>
                      <TextoMono style={{ color: cores.linha, fontSize: 11, marginTop: 2 }}>
                        Custos: {proj.custo.comida} comida · {proj.custo.minerio} minério · {proj.custo.seda} seda · {proj.custo.ferramentas} ferramentas rúnicas · Operários: {proj.operariosNecessarios}
                      </TextoMono>
                      <TextoMono style={{ color: cores.ouro, fontSize: 11, marginTop: 2 }}>
                        Efeito Permanente: {proj.beneficioDescricao}
                      </TextoMono>

                      {!concluido && !emAndamento && !asora.projetoEmAndamento && (
                        <View style={{ marginTop: esp.xs }}>
                          {semTribo ? (
                            <TextoMono style={{ color: cores.cinabrio, fontSize: 11 }}>
                              Requer acolhimento da tribo necessária ({proj.triboObrigatoria}).
                            </TextoMono>
                          ) : semFerramentas ? (
                            <TextoMono style={{ color: cores.cinabrio, fontSize: 11 }}>
                              Ferramentas insuficientes ({ferrDisp}/{proj.custo.ferramentas}). Encomende às forjas dos Elder Dwarves.
                            </TextoMono>
                          ) : semOperarios ? (
                            <TextoMono style={{ color: cores.cinabrio, fontSize: 11 }}>
                              Aloque pelo menos {proj.operariosNecessarios} operários no Canteiro de Obras.
                            </TextoMono>
                          ) : (
                            <Botao
                              titulo="Iniciar Construção"
                              variante="primario"
                              onPress={async () => setAvisoAsora(await iniciarConstrucao(proj.id))}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* 6. COMPANHIA MERCANTIL & ESTRATÉGIAS COMERCIAIS */}
            {asora.companhiaMercantil?.fundada ? (
              <Card acento={cores.ouro}>
                <View style={styles.linhaTitulo}>
                  <TextoSerif style={{ fontSize: 18, color: cores.ouro }}>
                    Companhia Mercantil: {asora.companhiaMercantil.nome}
                  </TextoSerif>
                  <Selo texto={`NÍVEL COMERCIAL ${asora.companhiaMercantil.nivelComercial}`} cor={cores.ouro} />
                </View>
                <TextoMono style={{ color: cores.vellum, marginTop: 4 }}>
                  Riqueza Acumulada: {asora.companhiaMercantil.ouroAcumulado} moedas de ouro · Caravanas Despachadas: {asora.companhiaMercantil.caravanasEnviadas}
                </TextoMono>
                <TextoMono style={{ color: cores.linha, marginTop: 2 }}>
                  Renda Periódica por Ciclo: +{asora.companhiaMercantil.rendaPorCiclo} moedas de ouro
                </TextoMono>
                {asora.companhiaMercantil.gerenteDesignada && (
                  <TextoMono style={{ color: cores.verdigris, marginTop: 2 }}>
                    Gerente Geral em Tsige: {asora.companhiaMercantil.gerenteDesignada} (+20 bônus mercantil)
                  </TextoMono>
                )}

                {/* Seletor de Estratégia Comercial */}
                <View style={{ marginTop: esp.sm, paddingTop: esp.sm, borderTopWidth: 1, borderTopColor: cores.linha }}>
                  <TextoMono style={{ color: cores.ouro, fontSize: 12, marginBottom: 4 }}>
                    Estratégia de Lojas & Produtos em Tsige:
                  </TextoMono>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: esp.xs }}>
                    {(
                      [
                        ['remedios_e_pocao', 'Remédios & Poções'],
                        ['tecidos_e_vestes', 'Tecidos & Vestes'],
                        ['armas_e_ferramentas', 'Armas & Ferramentas'],
                        ['graos_e_mantimentos', 'Grãos & Mantimentos'],
                      ] as const
                    ).map(([estId, estLabel]) => {
                      const ativo = (asora.companhiaMercantil?.estrategiaAtual ?? 'graos_e_mantimentos') === estId;
                      return (
                        <Botao
                          key={estId}
                          titulo={estLabel}
                          variante={ativo ? 'primario' : 'fantasma'}
                          onPress={async () => setAvisoAsora(await definirEstrategia(estId))}
                        />
                      );
                    })}
                  </View>
                </View>

                <View style={{ marginTop: esp.md }}>
                  <Botao
                    titulo="Despachar Caravana Comercial para Tsige"
                    variante="primario"
                    onPress={async () => setAvisoAsora(await despacharCaravana())}
                  />
                </View>
              </Card>
            ) : null}

            {/* 7. INVESTIGAÇÃO DOS HERÓIS HUMANOS */}
            {asora.investigacaoHerois && asora.investigacaoHerois.nivelAlerta > 0 && (
              <Card acento={cores.cinabrio}>
                <View style={styles.linhaTitulo}>
                  <TextoSerif style={{ fontSize: 16, color: cores.cinabrio }}>
                    Heróis dos Reinos Humanos em Alerta: {asora.investigacaoHerois.nivelAlerta}%
                  </TextoSerif>
                  <Selo texto="INVESTIGAÇÃO ATIVA" cor={cores.cinabrio} />
                </View>
                <TextoMono style={{ color: cores.mudo, marginTop: 4, fontSize: 11 }}>
                  {asora.investigacaoHerois.batedoresEnviados
                    ? 'Batedores arcanos de Limia (Hibiki) e espiões imperiais de Gritonia (Tomoki) investigam ondas de choque e vazamentos de mana na Wasteland.'
                    : 'Repercussão das batalhas e lendas da Calamidade ambulante.'}
                </TextoMono>
              </Card>
            )}
          </>
        );
      })()}
    </Pagina>
  );
}

// ─────────────────────────────────────────────── CRÔNICA
export function Cronica() {
  const camp = useGame((s) => s.camp);
  const content = useGame((s) => s.content);
  const feed = useGame((s) => s.feed);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'narracao' | 'eco' | 'sistema'>('todos');

  // Unifica crônica persistente (camp.cronica) + feed atual da sessão
  type EntradaCronica = { id: string; turno?: number; dia?: number; texto: string; tipo: string };
  const todasEntradas: EntradaCronica[] = [];
  // Feed da sessão corrente (mais recente)
  for (const e of (feed ?? [])) {
    if (e.tipo !== 'acao') todasEntradas.push({ id: `feed-${e.id}`, texto: e.texto, tipo: e.tipo });
  }
  // Crônica persistida (mais antigas), em ordem reversa para as mais recentes ficarem no topo
  const cronica = [...(camp?.cronica ?? [])].reverse();
  for (const e of cronica) {
    todasEntradas.push({ id: `cr-${e.turno}-${e.tipo}`, turno: e.turno, texto: e.texto, tipo: e.tipo });
  }

  const buscaMin = busca.trim().toLowerCase();
  const filtradas = todasEntradas.filter((e) => {
    if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false;
    if (buscaMin && !e.texto.toLowerCase().includes(buscaMin)) return false;
    return true;
  });

  const TIPOS = [
    { id: 'todos', label: 'Tudo' },
    { id: 'narracao', label: 'Narração' },
    { id: 'eco', label: 'Ecos' },
    { id: 'sistema', label: 'Sistema' },
  ] as const;

  return (
    <Pagina>
      <BarraVoltar titulo="Crônica" />
      {camp && <HistoriaViva />}

      {camp && content && (() => {
        // Bestiário: quem você já venceu, com o que o vale conta e o que
        // serve na estrada (content/vaelhorn/bestiario-historias.ts).
        const vencidas = content.criaturas.filter(c => camp.flags[`matou.${c.id}`] && (c.historia || c.sinais));
        if (!vencidas.length) return null;
        return (
          <Card>
            <TextoSerif>Bestiário</TextoSerif>
            <TextoMono style={{ color: cores.mudo }}>O que você já venceu, e o que aprendeu com isso.</TextoMono>
            {vencidas.map(c => (
              <View key={c.id} style={{ marginTop: 10 }}>
                <TextoSerif>{c.nome}</TextoSerif>
                <TextoMono>{c.descricao}</TextoMono>
                {c.historia && <TextoMono style={{ fontStyle: 'italic', marginTop: 4 }}>{c.historia}</TextoMono>}
                {c.sinais && <TextoMono style={{ color: cores.ouro, marginTop: 4 }}>{c.sinais}</TextoMono>}
              </View>
            ))}
          </Card>
        );
      })()}

      {camp && content && feitosDoJogador(content, camp).length > 0 && (
        <Card>
          <TextoSerif>O que o mundo lembra de você</TextoSerif>
          {feitosDoJogador(content, camp).map((f, i) => (
            <TextoMono key={`${f.dia}-${i}`}>Dia {f.dia} · {f.local}: {f.texto}</TextoMono>
          ))}
        </Card>
      )}

      {/* Rivais kimetsu */}
      {Object.values(camp?.kimetsu?.rivais ?? {}).filter(r => r.reencontros > 0).map(r => (
        <Card key={r.id}>
          <TextoSerif>{r.nome} · {r.vivo ? 'sobreviveu' : 'morto'}</TextoSerif>
          <TextoMono>{r.reencontros} confronto(s) · venceu você {r.vitorias} vez(es) · suas fugas: {r.fugas}</TextoMono>
          <TextoMono>Último confronto: dia {r.ultimoDia}. {r.vivo && r.memoria.at(-1)?.tecnica ? 'Pode reconhecer uma técnica que já enfrentou.' : ''}</TextoMono>
          {r.evolucao && <TextoMono>Comportamento observado: {r.evolucao.plano} · evolução {r.evolucao.nivel}.</TextoMono>}
        </Card>
      ))}

      {/* Busca e filtros */}
      <View style={styles.cronicaFiltros}>
        <TextInput
          style={styles.cronicaBusca}
          value={busca}
          onChangeText={setBusca}
          placeholder="buscar na crônica…"
          placeholderTextColor={cores.linha}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.cronicaChips}>
          {TIPOS.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.cronicaChip, filtroTipo === t.id && styles.cronicaChipAtivo]}
              onPress={() => setFiltroTipo(t.id)}
            >
              <Text style={[styles.cronicaChipTxt, filtroTipo === t.id && styles.cronicaChipTxtAtivo]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextoMono style={{ color: cores.mudo, fontSize: 10, marginTop: 2 }}>
          {filtradas.length} {filtradas.length === 1 ? 'entrada' : 'entradas'}
        </TextoMono>
      </View>

      {filtradas.length === 0 && (
        <TextoMono style={{ color: cores.mudo }}>{busca ? 'Nenhum resultado para essa busca.' : 'Sua história ainda não começou.'}</TextoMono>
      )}
      {filtradas.map((e) => (
        <View key={e.id} style={styles.cronicaEntrada}>
          {e.turno !== undefined && (
            <TextoMono style={styles.cronicaTurno}>
              turno {e.turno}{e.dia !== undefined ? ` · dia ${e.dia}` : ''}
            </TextoMono>
          )}
          <TextoSerif
            style={[
              styles.cronicaTexto,
              e.tipo === 'eco' ? { color: cores.ouro, fontStyle: 'italic' } :
              e.tipo === 'sistema' ? { color: cores.mudo, fontSize: 14 } :
              { color: cores.vellum },
            ]}
          >
            {e.texto}
          </TextoSerif>
        </View>
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
  const periodo = periodoAtual(camp.calendario);
  const imagemLocal = imagemDoLocal(local?.id, local?.regiao);
  const atmosferaAtual = local?.atmosferaPorPeriodo?.[periodo] || local?.descricaoBase;

  return (
    <Pagina>
      <BarraVoltar titulo="Mapa" />
      {local && (
        <BannerIlustrado
          source={imagemLocal}
          periodo={periodo}
          titulo={local.nome}
          subtitulo={`Você está aqui · ${local.regiao} · Perigo ${local.perigo}/10`}
          seloTexto={local.tipo.toUpperCase()}
          seloCor={local.perigo >= 4 ? cores.cinabrio : cores.ouro}
          altura={210}
          descricaoAtmosfera={atmosferaAtual}
        />
      )}
      <ComunidadeViva />

      <Divisor label="mapa do mundo conhecido" />
      <MapaVisual content={content} camp={camp} onViajar={viajar} />

      <Divisor label="para onde ir" />
      {/* Lugar oculto nao entra na lista ate ser descoberto (engine/viagem.ts). */}
      {rotasVisiveis(content, camp).map((r) => {
        const dest = content.locais.find((l) => l.id === r.destino);
        if (!dest) return null;
        const conhecido = camp.locaisVisitados.includes(r.destino);
        return (
          <Card key={r.destino} onPress={() => viajar(r.destino)} acento={r.perigo >= 4 ? cores.cinabrio : undefined}>
            <View style={styles.linhaTitulo}>
              <TextoSerif style={{ fontSize: 20 }}>{dest.nome}</TextoSerif>
              {!conhecido && <Selo texto="não explorado" cor={cores.ouro} />}
              {r.perigo >= 4 && <Selo texto="perigoso" cor={cores.cinabrio} />}
            </View>
            <TextoMono style={{ marginTop: 2 }}>
              {r.periodos === 0 ? 'ao lado' : `${r.periodos} período(s) de viagem`}
              {` · ${dest.regiao} · ${dest.tipo}`}
            </TextoMono>
            {camp.personagem.sakai?.desbloqueado && (
              <TextoMono style={{ color: cores.ouro, marginTop: 2 }}>
                ✦ Sakai: presença de {dest.regiao} captada na direção deste rumo.
              </TextoMono>
            )}
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
                  <Pressable 
                    key={a.id} 
                    style={({ pressed }) => [styles.chipAprender, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} 
                    accessibilityRole="button"
                    onPress={() => aprender(a.id)}
                  >
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
              <Pressable 
                key={a.id} 
                style={({ pressed }) => [styles.chipConjurar, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} 
                accessibilityRole="button"
                onPress={() => conjurar(a.id)}
              >
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

      <Divisor label="V · Cosmologia & Os Deuses Primordiais" />
      <Card acento={cores.ouro}>
        <TextoSerif style={{ fontSize: 19, color: cores.ouro }}>{MITO_ORIGEM_MAGIA.titulo}</TextoSerif>
        <TextoSerif style={{ fontSize: 14.5, color: '#dcd1b8', marginTop: esp.xs, lineHeight: 22 }}>
          {MITO_ORIGEM_MAGIA.texto}
        </TextoSerif>
      </Card>
      {DEUSES_PRIMORDIAIS.map((d) => (
        <Card key={d.id} acento={cores.ouro}>
          <View style={styles.linhaTitulo}>
            <TextoSerif style={{ fontSize: 18, color: '#f3e3ba' }}>{d.nome}</TextoSerif>
            <Selo texto={d.simbolo} cor={cores.ouro} />
          </View>
          <TextoMono style={{ color: cores.ouro, marginTop: 2 }}>{d.titulo}</TextoMono>
          <TextoMono style={{ marginTop: 2 }}>Domínio: {d.dominio}</TextoMono>
          <TextoMono style={{ color: cores.mudo, marginTop: 2 }}>Culto: {d.culto}</TextoMono>
          <TextoSerif style={{ fontSize: 14, color: '#cbd5d1', marginTop: 4, lineHeight: 20 }}>
            {d.mito}
          </TextoSerif>
        </Card>
      ))}

      <Divisor label="VI · As Bruxas dos Pecados & O Tabu da Inveja" />
      <TextoMono style={{ color: cores.mudo, marginBottom: esp.sm }}>
        As 7 Bruxas dos Pecados Capitais e os antigos hereges devorados há 400 anos por Satella.
      </TextoMono>
      {BRUXAS_DOS_PECADOS.map((b) => {
        const ehSatella = b.id === 'inveja';
        return (
          <Card key={b.id} acento={ehSatella ? cores.cinabrio : cores.verdigris}>
            <View style={styles.linhaTitulo}>
              <TextoSerif style={{ fontSize: 18, color: ehSatella ? cores.cinabrio : cores.ouro }}>
                {b.nome}
              </TextoSerif>
              <Selo
                texto={b.pecado.toUpperCase()}
                cor={ehSatella ? cores.cinabrio : cores.verdigris}
              />
            </View>
            <TextoMono style={{ color: ehSatella ? cores.cinabrio : cores.ouro, marginTop: 2 }}>
              Autoridade: {b.autoridade}
            </TextoMono>
            <TextoSerif style={{ fontSize: 14, color: '#cbd5d1', marginTop: 4, lineHeight: 20 }}>
              {b.naturezaPoder}
            </TextoSerif>
            <TextoMono style={{ color: cores.linha, marginTop: 4 }}>
              Desfecho: {b.desfecho}
            </TextoMono>
            <TextoMono style={{ color: cores.mudo, marginTop: 2 }}>
              Marca/Relíquia: {b.reliquiaOuMarca}
            </TextoMono>
          </Card>
        );
      })}

      <Divisor label="VII · Facções e Ordens Antigas" />
      {FACCOES_ANTIGAS.map((f) => (
        <Card key={f.id} acento={cores.linha}>
          <TextoSerif style={{ fontSize: 18, color: cores.ouro }}>{f.nome}</TextoSerif>
          <TextoMono style={{ color: cores.vellum, marginTop: 2 }}>Sede: {f.sede}</TextoMono>
          <TextoMono style={{ marginTop: 2 }}>Crença: {f.crenca}</TextoMono>
          <TextoMono style={{ color: cores.linha, marginTop: 2 }}>Dogma: {f.dogma}</TextoMono>
          <TextoMono style={{ color: cores.cinabrio, marginTop: 2 }}>Relação com as Bruxas: {f.relacaoComBruxas}</TextoMono>
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
  cronicaFiltros: { marginBottom: esp.md, gap: esp.sm },
  cronicaBusca: { fontFamily: fontes.mono, color: cores.vellum, fontSize: 13, borderWidth: 1, borderColor: cores.linha, borderRadius: 8, padding: esp.sm, marginBottom: esp.sm },
  cronicaChips: { flexDirection: 'row', gap: esp.sm, flexWrap: 'wrap' },
  cronicaChip: { borderWidth: 1, borderColor: cores.linha, borderRadius: 6, paddingHorizontal: esp.sm, paddingVertical: 3 },
  cronicaChipAtivo: { borderColor: cores.ouro, backgroundColor: cores.fundo3 },
  cronicaChipTxt: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11 },
  cronicaChipTxtAtivo: { color: cores.ouro },
  cronicaEntrada: { marginBottom: esp.md, paddingBottom: esp.md, borderBottomWidth: 1, borderBottomColor: cores.fundo3 },
  cronicaTurno: { color: cores.mudo, fontSize: 10, marginBottom: 2 },
  cronicaTexto: { fontSize: 17, lineHeight: 26 },
  intro: { color: cores.mudo, fontStyle: 'italic', marginBottom: esp.lg },
  vinculoFiltros: { marginBottom: esp.md, gap: esp.sm },
  vinculoContagem: { color: cores.mudo, fontSize: 11 },
  vinculoChips: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm },
  vinculoChip: { borderWidth: 1, borderColor: cores.linha, borderRadius: 6, paddingHorizontal: esp.sm, paddingVertical: 4 },
  vinculoChipAtivo: { borderColor: cores.ouro, backgroundColor: cores.fundo3 },
  vinculoChipTxt: { fontFamily: fontes.mono, color: cores.mudo, fontSize: 11 },
  vinculoChipTxtAtivo: { color: cores.ouro },
  conviccoes: { marginTop: esp.md, padding: esp.sm, borderLeftWidth: 2, borderLeftColor: cores.violeta, gap: 3 },
  conviccao: { color: cores.vellum, fontSize: 12 },
  memoriaRecente: { marginTop: esp.md, paddingTop: esp.sm, borderTopWidth: 1, borderTopColor: cores.fundo3, gap: 3 },
  memoriaTexto: { color: cores.mudo, fontSize: 14, fontStyle: 'italic' },
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
  intimidadeBox: {
    marginTop: esp.md,
    paddingTop: esp.md,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
    gap: esp.xs,
  },
  camadaItem: {
    marginBottom: 4,
  },
  camadaTitulo: {
    fontSize: 11,
    color: cores.ouro,
  },
  camadaTexto: {
    fontSize: 14,
    color: cores.vellum,
    marginTop: 1,
  },
  camadaOculta: {
    fontSize: 13,
    color: cores.mudo,
    fontStyle: 'italic',
    marginTop: 1,
  },
  acoesIntimidade: {
    marginTop: esp.md,
    paddingTop: esp.sm,
    borderTopWidth: 1,
    borderTopColor: cores.fundo3,
  },
});
