// ARCANUM · Tela Dedicada de Assentamento, Feudo & Reino (GDD §32, §34).
// Suporte ao mundo base (Vaelhorn / Feudo / Castelo) e à DLC (Asora / Tsukimichi).
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, TextInput } from 'react-native';
import { Pagina, BarraVoltar } from './_layout';
import { TextoMono, TextoSerif, Card, Botao, Divisor, Medidor, Selo } from '../components';
import { cores, fontes, esp, raio } from '../theme';
import { useGame } from '../store';
import {
  obterFeudo,
  CATALOGO_EDIFICIOS,
  PONTOS_DE_ASSENTAMENTO,
  obterTierReinoInfo,
  CARGOS_CONSELHO_INFO,
  CUSTOS_PROMOCAO_OFICIAL,
  FIGURAS_BRASAO,
  type TipoEdificioModular,
  type CargaCaravana,
  type BiomaFeudo,
  type CargoConselho,
  type DesignacaoOficial,
  type PatenteMilitar,
} from '@/engine';

// Imagens estáticas geradas para cada bioma, patamar e mapa
const IMAGENS_FEUDO: Record<string, any> = {
  acampamento: require('../../assets/feudo/acampamento.jpg'),
  aldeia: require('../../assets/feudo/aldeia.jpg'),
  castelo: require('../../assets/feudo/castelo.jpg'),
  cidadela: require('../../assets/feudo/cidadela.jpg'),
  deserto: require('../../assets/feudo/deserto.jpg'),
  floresta: require('../../assets/feudo/floresta.jpg'),
  costa: require('../../assets/feudo/costa.jpg'),
  montanha: require('../../assets/feudo/montanha.jpg'),
  asora: require('../../assets/feudo/asora.jpg'),
  mapa_continente: require('../../assets/feudo/mapa_continente.jpg'),
};

export type AbaAssentamento = 'geral' | 'trono' | 'quartel' | 'linhagem' | 'vassalos' | 'intrigas' | 'distritos' | 'rotas' | 'asora' | 'mapa';

export function Assentamento() {
  const camp = useGame((s) => s.camp);
  const content = useGame((s) => s.content);
  const fundar = useGame((s) => s.fundarFeudoAcao);
  const iniciarObra = useGame((s) => s.iniciarObraFeudoAcao);
  const despacharCaravana = useGame((s) => s.despacharCaravanaFeudoAcao);
  const definirPatrulha = useGame((s) => s.definirPatrulhaFeudoAcao);
  const supervisionar = useGame((s) => s.supervisionarObrasAcao);
  const fundarCasaDinastica = useGame((s) => s.fundarCasaDinasticaAcao);
  const nomearConselheiro = useGame((s) => s.nomearConselheiroAcao);
  const removerConselheiro = useGame((s) => s.removerConselheiroAcao);
  const recrutarOficial = useGame((s) => s.recrutarOficialAcao);
  const promoverOficial = useGame((s) => s.promoverOficialAcao);
  const designarMissao = useGame((s) => s.designarMissaoOficialAcao);
  const treinarOficiais = useGame((s) => s.treinarOficiaisAcao);
  const celebrarCasamento = useGame((s) => s.celebrarCasamentoAcao);
  const iniciarGestacao = useGame((s) => s.iniciarGestacaoAcao);
  const darLuzHerdeiro = useGame((s) => s.darLuzHerdeiroAcao);
  const designarHerdeiroAparente = useGame((s) => s.designarHerdeiroAparenteAcao);
  const concederFeudo = useGame((s) => s.concederFeudoVassaloAcao);
  const convocarLevas = useGame((s) => s.convocarLevasVassalosAcao);
  const convocarGuerra = useGame((s) => s.convocarAssembleiaGuerraAcao);
  const firmarPaz = useGame((s) => s.firmarTratadoPazAcao);
  const iniciarTrama = useGame((s) => s.iniciarTramaUsurpacaoAcao);

  // Estados locais da tela
  const [abaAtiva, setAbaAtiva] = useState<AbaAssentamento>('geral');
  const [nomeNovoFeudo, setNomeNovoFeudo] = useState('');
  const [localSelecionado, setLocalSelecionado] = useState(camp?.localAtual ?? 'halvet_colinas');
  const [biomaEscolhido, setBiomaEscolhido] = useState<BiomaFeudo>('planicie');
  const [filtroDistrito, setFiltroDistrito] = useState<string>('todos');

  // Formulários interativos
  const [nomeCasa, setNomeCasa] = useState('');
  const [lemaCasa, setLemaCasa] = useState('');
  const [figuraBrasao, setFiguraBrasao] = useState('dragao');
  const [nomeNovoOficial, setNomeNovoOficial] = useState('');
  const [nomeNovoBebe, setNomeNovoBebe] = useState('');
  const [generoBebe, setGeneroBebe] = useState<'m' | 'f'>('m');
  const [nomeNovoVassalo, setNomeNovoVassalo] = useState('');
  const [nomeFeudoCedido, setNomeFeudoCedido] = useState('');
  const [alvoGuerraCidade, setAlvoGuerraCidade] = useState('tessel');
  const [casusBelli, setCasusBelli] = useState('Disputa de Fronteira e Honra Feudal');
  const [alvoTramaCidade, setAlvoTramaCidade] = useState('solgar');
  const [alvoTramaNome, setAlvoTramaNome] = useState('Solgar das Areias');

  if (!camp || !content) return null;

  const isTsukimichi = camp.cenarioId === 'tsukimichi' || !!camp.asora?.desbloqueado;
  const feudo = obterFeudo(camp);
  const tierInfo = obterTierReinoInfo(feudo.tierReino, feudo.bioma);

  // Seleciona a imagem visual de cabeçalho
  let imagemCabecalho = IMAGENS_FEUDO.acampamento;
  if (isTsukimichi && feudo.bioma === 'asora') {
    imagemCabecalho = IMAGENS_FEUDO.asora;
  } else if (feudo.bioma === 'deserto') {
    imagemCabecalho = IMAGENS_FEUDO.deserto;
  } else if (feudo.bioma === 'floresta') {
    imagemCabecalho = IMAGENS_FEUDO.floresta;
  } else if (feudo.bioma === 'costa') {
    imagemCabecalho = IMAGENS_FEUDO.costa;
  } else if (feudo.bioma === 'montanha') {
    imagemCabecalho = IMAGENS_FEUDO.montanha;
  } else {
    // Planície / Vale: segue a evolução arquitetural por Tier
    if (feudo.tierReino <= 2) imagemCabecalho = IMAGENS_FEUDO.acampamento;
    else if (feudo.tierReino <= 4) imagemCabecalho = IMAGENS_FEUDO.aldeia;
    else if (feudo.tierReino <= 6) imagemCabecalho = IMAGENS_FEUDO.castelo;
    else imagemCabecalho = IMAGENS_FEUDO.cidadela;
  }

  return (
    <Pagina>
      <BarraVoltar titulo={isTsukimichi ? 'Soberania de Asora' : 'Feudo & Castelo'} />

      {/* Banner Visual Ilustrativo da Cidade / Bioma */}
      <View style={styles.bannerContainer}>
        <Image source={imagemCabecalho} style={styles.bannerImagem} resizeMode="cover" />
        <View style={styles.bannerGradiente}>
          <View style={styles.bannerInfo}>
            <Selo texto={feudo.bioma.toUpperCase()} cor={cores.ouro} />
            <Text style={styles.bannerTitulo}>{feudo.nome}</Text>
            <Text style={styles.bannerSub}>{tierInfo.titulo}</Text>
          </View>
        </View>
      </View>

      {/* Caso o feudo ainda não tenha sido fundado formalmente */}
      {!feudo.fundado ? (
        <Card style={{ marginVertical: esp.md }}>
          <TextoSerif style={{ fontSize: 22, color: cores.ouro }}>Reivindicar Terras & Fundar Assentamento</TextoSerif>
          <TextoMono style={{ marginVertical: esp.sm }}>
            O soberano pode estabelecer sua sede de clã e construir um reino a partir de qualquer bioma do continente.
            Escolha uma posição estratégica para fundar sua fortaleza:
          </TextoMono>

          <Divisor label="pontos estratégicos do continente" />
          {PONTOS_DE_ASSENTAMENTO.map((p) => {
            const selecionado = localSelecionado === p.id;
            return (
              <Card
                key={p.id}
                onPress={() => {
                  setLocalSelecionado(p.id);
                  setBiomaEscolhido(p.bioma);
                  if (!nomeNovoFeudo) setNomeNovoFeudo(p.nome);
                }}
                acento={selecionado ? cores.ouro : undefined}
                style={[selecionado && { borderColor: cores.ouro, borderWidth: 1 }]}
              >
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 18 }}>{p.nome}</TextoSerif>
                  <Selo texto={p.bioma.toUpperCase()} cor={cores.verdigris} />
                </View>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>{p.descricao}</TextoMono>
                <TextoMono style={{ color: cores.verdigris }}>{p.vantagem}</TextoMono>
                <TextoMono style={{ fontSize: 11, marginTop: 4 }}>
                  Recursos Iniciais: {p.recursosIniciais.comida} comida · {p.recursosIniciais.materiais} materiais · {p.recursosIniciais.ouro} ouro
                </TextoMono>
              </Card>
            );
          })}

          <View style={{ marginTop: esp.md, gap: 8 }}>
            <Botao
              titulo="Fincar Estandarte & Iniciar Domínio"
              sub={`Estabelecer feudo no ponto selecionado`}
              variante="acento"
              onPress={() => fundar(nomeNovoFeudo || 'Novo Domínio', localSelecionado, biomaEscolhido)}
            />
          </View>
        </Card>
      ) : (
        <>
          {/* Navegação de Abas do Assentamento */}
          <View style={styles.abasContainer}>
            <Pressable
              onPress={() => setAbaAtiva('geral')}
              style={[styles.abaItem, abaAtiva === 'geral' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'geral' && styles.abaTxtAtiva]}>Soberania</Text>
            </Pressable>
            <Pressable
              onPress={() => setAbaAtiva('trono')}
              style={[styles.abaItem, abaAtiva === 'trono' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'trono' && styles.abaTxtAtiva]}>Trono & Dinastia</Text>
            </Pressable>
            <Pressable
              onPress={() => setAbaAtiva('quartel')}
              style={[styles.abaItem, abaAtiva === 'quartel' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'quartel' && styles.abaTxtAtiva]}>Oficiais & Tropa</Text>
            </Pressable>
            <Pressable
              onPress={() => setAbaAtiva('linhagem')}
              style={[styles.abaItem, abaAtiva === 'linhagem' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'linhagem' && styles.abaTxtAtiva]}>Corte & Linhagem</Text>
            </Pressable>
            <Pressable
              onPress={() => setAbaAtiva('vassalos')}
              style={[styles.abaItem, abaAtiva === 'vassalos' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'vassalos' && styles.abaTxtAtiva]}>Vassalos & Guerra</Text>
            </Pressable>
            <Pressable
              onPress={() => setAbaAtiva('intrigas')}
              style={[styles.abaItem, abaAtiva === 'intrigas' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'intrigas' && styles.abaTxtAtiva]}>Intriga & Tramas</Text>
            </Pressable>
            <Pressable
              onPress={() => setAbaAtiva('distritos')}
              style={[styles.abaItem, abaAtiva === 'distritos' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'distritos' && styles.abaTxtAtiva]}>Obras & Distritos</Text>
            </Pressable>
            <Pressable
              onPress={() => setAbaAtiva('rotas')}
              style={[styles.abaItem, abaAtiva === 'rotas' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'rotas' && styles.abaTxtAtiva]}>Rotas & Patrulhas</Text>
            </Pressable>
            {isTsukimichi && (
              <Pressable
                onPress={() => setAbaAtiva('asora')}
                style={[styles.abaItem, abaAtiva === 'asora' && styles.abaItemAtiva]}
              >
                <Text style={[styles.abaTxt, abaAtiva === 'asora' && styles.abaTxtAtiva]}>Asora</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setAbaAtiva('mapa')}
              style={[styles.abaItem, abaAtiva === 'mapa' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'mapa' && styles.abaTxtAtiva]}>Mapa Continental</Text>
            </Pressable>
          </View>

          {/* ABA GERAL: Visão Geral de Recursos, Soberania e Canteiro Ativo */}
          {abaAtiva === 'geral' && (
            <View style={{ gap: esp.md }}>
              <Card>
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 20 }}>Recursos & Estoques do Feudo</TextoSerif>
                  <Selo texto={`Tier ${feudo.tierReino}`} cor={cores.ouro} />
                </View>
                <TextoMono style={{ color: cores.mudo, marginBottom: esp.sm }}>{tierInfo.descricao}</TextoMono>

                <View style={styles.gradeRecursos}>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>População</Text>
                    <Text style={styles.valorRecurso}>
                      {feudo.populacao} <Text style={styles.subRecurso}>/ {feudo.capacidadeHabitacional}</Text>
                    </Text>
                  </View>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>Tesouro</Text>
                    <Text style={[styles.valorRecurso, { color: cores.ouro }]}>{feudo.tesouro} o</Text>
                  </View>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>Materiais</Text>
                    <Text style={styles.valorRecurso}>{feudo.materiais} m</Text>
                  </View>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>Provisões</Text>
                    <Text style={[styles.valorRecurso, { color: feudo.comida < 20 ? cores.cinabrio : cores.vellum }]}>
                      {feudo.comida} c
                    </Text>
                  </View>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>Remédios</Text>
                    <Text style={styles.valorRecurso}>{feudo.remedios} r</Text>
                  </View>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>Ouro Pessoal</Text>
                    <Text style={[styles.valorRecurso, { color: cores.verdigris }]}>{camp.personagem.dinheiro} o</Text>
                  </View>
                </View>

                <View style={{ marginTop: esp.md }}>
                  <Medidor rotulo="Segurança Territorial" valor={feudo.seguranca} max={100} cor={cores.verdigris} />
                  <Medidor rotulo="Estabilidade & Ordem Civil" valor={feudo.estabilidade} max={100} cor={cores.ouro} />
                </View>

                <View style={{ marginTop: esp.md }}>
                  <Botao
                    titulo="Supervisionar Obras & Administrar Feudo (Avançar 1 Dia)"
                    sub="Avança construções, processa colheitas, oficinas e rotas"
                    onPress={() => supervisionar()}
                    variante="primario"
                  />
                </View>
              </Card>

              {/* Fila de Construção com Cooldown Real */}
              <Divisor label="canteiro de obras em andamento" />
              {feudo.obrasEmAndamento.length === 0 ? (
                <Card>
                  <TextoMono style={{ color: cores.mudo, textAlign: 'center' }}>
                    Nenhuma obra ativa no momento. Abra a aba "Obras & Distritos" para encomendar novas construções.
                  </TextoMono>
                </Card>
              ) : (
                feudo.obrasEmAndamento.map((obra) => {
                  const diasRestantes = Math.ceil(obra.periodosRestantes / 4);
                  const progressoPct = Math.max(0, Math.min(100, Math.round(((obra.periodosTotais - obra.periodosRestantes) / obra.periodosTotais) * 100)));
                  return (
                    <Card key={obra.id} acento={cores.ouro}>
                      <View style={styles.linhaEntre}>
                        <TextoSerif style={{ fontSize: 18 }}>{obra.nome}</TextoSerif>
                        <Selo texto={`${progressoPct}%`} cor={cores.ouro} />
                      </View>
                      <TextoMono style={{ marginVertical: 4 }}>
                        Tempo Restante: {diasRestantes} dia(s) ({obra.periodosRestantes} períodos).
                      </TextoMono>
                      <Medidor rotulo="Progresso da Construção" valor={obra.periodosTotais - obra.periodosRestantes} max={obra.periodosTotais} cor={cores.ouro} compacto />
                      <TextoMono style={{ fontSize: 11, color: cores.mudo }}>
                        Operários e artífices trabalham na estrutura. O tempo avança conforme você viaja, descansa ou supervisiona.
                      </TextoMono>
                    </Card>
                  );
                })
              )}

              {/* Histórico recente do assentamento */}
              <Divisor label="crônicas do reino" />
              {feudo.historicoEventos.slice(-4).reverse().map((ev, idx) => (
                <Card key={idx}>
                  <TextoMono style={{ color: cores.ouro, fontSize: 11 }}>Dia {ev.dia} do Calendário</TextoMono>
                  <TextoSerif style={{ fontSize: 16 }}>{ev.texto}</TextoSerif>
                </Card>
              ))}
            </View>
          )}

          {/* ABA TRONO: Casa Dinástica & Conselho de Regência */}
          {abaAtiva === 'trono' && (
            <View style={{ gap: esp.md }}>
              <Card acento={cores.ouro}>
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 22, color: cores.ouro }}>Casa Dinástica Soberana</TextoSerif>
                  <Selo texto={`${feudo.casaDinastica?.prestigio ?? 10} PRESTÍGIO`} cor={cores.ouro} />
                </View>

                {feudo.casaDinastica?.fundada ? (
                  <View style={{ marginVertical: esp.sm }}>
                    <View style={[styles.brasaoBox, { borderColor: feudo.casaDinastica.brasaoCorPrimaria || cores.ouro }]}>
                      <TextoSerif style={{ fontSize: 24, color: cores.vellum, textAlign: 'center' }}>
                        {feudo.casaDinastica.nome}
                      </TextoSerif>
                      <TextoMono style={{ color: cores.ouro, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
                        "{feudo.casaDinastica.lema}"
                      </TextoMono>
                      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 8 }}>
                        <Selo texto={`ESTANDARTE: ${feudo.casaDinastica.brasaoFigura.toUpperCase()}`} cor={cores.verdigris} />
                        <Selo texto="LINHAGEM LEGÍTIMA" cor={cores.ouro} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ marginVertical: esp.sm, gap: 8 }}>
                    <TextoMono style={{ color: cores.mudo }}>
                      Proclame formalmente a Casa Dinástica que governará este feudo e deixará sua marca na história.
                    </TextoMono>
                    <View>
                      <TextoMono style={{ fontSize: 11, color: cores.mudo, marginBottom: 2 }}>Nome da Casa Dinástica:</TextoMono>
                      <TextInput
                        style={styles.inputTexto}
                        value={nomeCasa}
                        onChangeText={setNomeCasa}
                        placeholder="Ex: Casa Valtorius, Casa Draconis..."
                        placeholderTextColor={cores.mudo}
                      />
                    </View>
                    <View>
                      <TextoMono style={{ fontSize: 11, color: cores.mudo, marginBottom: 2 }}>Lema Senhorial:</TextoMono>
                      <TextInput
                        style={styles.inputTexto}
                        value={lemaCasa}
                        onChangeText={setLemaCasa}
                        placeholder="Ex: Com Sangue e Soberania, Inabaláveis..."
                        placeholderTextColor={cores.mudo}
                      />
                    </View>
                    <TextoMono style={{ fontSize: 11, color: cores.mudo, marginTop: 4 }}>Figura Heráldica do Brasão:</TextoMono>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {FIGURAS_BRASAO.map((f) => (
                        <Pressable
                          key={f.id}
                          onPress={() => setFiguraBrasao(f.id)}
                          style={[styles.filtroPill, figuraBrasao === f.id && styles.filtroPillAtivo]}
                        >
                          <Text style={[styles.filtroPillTxt, figuraBrasao === f.id && styles.filtroPillTxtAtivo]}>
                            {f.nome.toUpperCase()}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Botao
                      titulo="Proclamar Casa Dinástica"
                      sub="Hastear estandartes e registrar heraldica no reino (+20 Prestígio)"
                      onPress={() => fundarCasaDinastica(nomeCasa || 'Casa Soberana', lemaCasa || 'Soberania e Honra', '#c59b27', '#1a1816', figuraBrasao)}
                      variante="acento"
                    />
                  </View>
                )}
              </Card>

              {/* Conselho de Regência */}
              <Card>
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 20 }}>Conselho de Regência da Coroa</TextoSerif>
                  <Selo texto="GOVERNANÇA PASSIVA" cor={cores.verdigris} />
                </View>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Quando o soberano viaja pelo continente, o conselho assume a governança determinística do feudo. Competência garante estabilidade; conselheiros desleais podem gerar desfalques ou intrigas.
                </TextoMono>

                <Divisor label="assentos do conselho" />
                {(['regente', 'chanceler', 'marechal', 'tesoureiro', 'mestre_espioes'] as CargoConselho[]).map((cargo) => {
                  const info = CARGOS_CONSELHO_INFO[cargo];
                  const ocupante = feudo.conselho?.[cargo];

                  return (
                    <Card key={cargo} style={{ marginVertical: 4 }} acento={ocupante ? cores.ouro : undefined}>
                      <View style={styles.linhaEntre}>
                        <View>
                          <TextoSerif style={{ fontSize: 16 }}>{info.nome}</TextoSerif>
                          <TextoMono style={{ fontSize: 11, color: cores.mudo }}>Atributo Chave: {info.atributo.toUpperCase()}</TextoMono>
                        </View>
                        <Selo texto={ocupante ? 'EMPOSSADO' : 'CARGO VAGO'} cor={ocupante ? cores.verdigris : cores.mudo} />
                      </View>
                      <TextoMono style={{ color: cores.mudo, fontSize: 11, marginVertical: 2 }}>{info.descricao}</TextoMono>

                      {ocupante ? (
                        <View style={{ marginTop: esp.xs, gap: 4 }}>
                          <View style={styles.linhaEntre}>
                            <TextoMono style={{ color: cores.vellum }}>{ocupante.nome}</TextoMono>
                            <TextoMono style={{ color: cores.ouro }}>Competência: {ocupante.competencia}/20</TextoMono>
                          </View>
                          <Medidor rotulo="Lealdade à Coroa" valor={ocupante.lealdade} max={100} cor={cores.verdigris} compacto />
                          {ocupante.corrupcao > 30 && (
                            <Medidor rotulo="Risco de Corrupção" valor={ocupante.corrupcao} max={100} cor={cores.cinabrio} compacto />
                          )}
                          <View style={{ marginTop: 4 }}>
                            <Botao
                              titulo={`Dispensar ${ocupante.nome}`}
                              sub="Revogar o selo do cargo e abrir vacância"
                              onPress={() => removerConselheiro(cargo)}
                            />
                          </View>
                        </View>
                      ) : (
                        <View style={{ marginTop: esp.xs }}>
                          <Botao
                            titulo={`Nomear ${info.nome}`}
                            sub="Empossar um nobre aliado de confiança da corte"
                            onPress={() => nomearConselheiro(cargo, `npc_${cargo}`, `Lorde ${info.nome.split(' ')[0]}`)}
                            variante="acento"
                          />
                        </View>
                      )}
                    </Card>
                  );
                })}
              </Card>
            </View>
          )}

          {/* ABA QUARTEL: Oficiais Militares, Patentes & Treino */}
          {abaAtiva === 'quartel' && (
            <View style={{ gap: esp.md }}>
              <Card>
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 20 }}>Quartel-General & Forças da Fortaleza</TextoSerif>
                  <Selo texto={`Quartel Nível ${feudo.edificios.quartel ?? 1}`} cor={cores.ouro} />
                </View>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Comande seus oficiais nomeados, treine recrutas até virarem capitães e comande missões de patrulha urbana, defesa da fortaleza, escolta de caravanas e infiltração externa.
                </TextoMono>

                <View style={{ marginTop: esp.sm, gap: 8 }}>
                  <Botao
                    titulo="Exercício Geral de Treino Militar"
                    sub="Realizar exercícios com armas nos pátios (+15 XP a todo o efetivo) · Custo: 15 ouro, 10 materiais"
                    disabled={feudo.tesouro < 15 || feudo.materiais < 10 || (feudo.oficiais?.length ?? 0) === 0}
                    motivo="Recursos ou oficiais insuficientes"
                    onPress={() => treinarOficiais()}
                    variante="primario"
                  />
                </View>
              </Card>

              <Divisor label={`oficiais comissionados (${feudo.oficiais?.filter(o => o.vivo).length ?? 0} / ${Math.max(2, (feudo.edificios.quartel ?? 1) * 2)})`} />
              {(!feudo.oficiais || feudo.oficiais.length === 0) ? (
                <Card>
                  <TextoMono style={{ color: cores.mudo, textAlign: 'center' }}>
                    Nenhum oficial comissionado na caserna. Comissione novos guerreiros abaixo para comandar suas tropas.
                  </TextoMono>
                </Card>
              ) : (
                feudo.oficiais.map((oficial) => {
                  const infoPatente = CUSTOS_PROMOCAO_OFICIAL[oficial.patente];
                  const podePromover = !!infoPatente.proximaPatente && oficial.experiencia >= infoPatente.xpNecessario && feudo.tesouro + camp.personagem.dinheiro >= infoPatente.custoOuro;

                  return (
                    <Card key={oficial.id} acento={cores.ouro}>
                      <View style={styles.linhaEntre}>
                        <View>
                          <TextoSerif style={{ fontSize: 18 }}>{oficial.nome}</TextoSerif>
                          <TextoMono style={{ fontSize: 11, color: cores.ouro }}>{infoPatente.titulo}</TextoMono>
                        </View>
                        <Selo texto={`LEALDADE ${oficial.lealdade}%`} cor={cores.verdigris} />
                      </View>

                      <View style={{ marginVertical: esp.xs }}>
                        <Medidor
                          rotulo={`Experiência Militar: ${oficial.experiencia} / ${infoPatente.proximaPatente ? infoPatente.xpNecessario : 'MÁX'} XP`}
                          valor={oficial.experiencia}
                          max={infoPatente.proximaPatente ? infoPatente.xpNecessario : oficial.experiencia}
                          cor={cores.ouro}
                          compacto
                        />
                      </View>

                      <TextoMono style={{ fontSize: 11, color: cores.mudo, marginBottom: 4 }}>Designação de Missão Atual:</TextoMono>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: esp.sm }}>
                        {[
                          { id: 'guarda_castelo', rotulo: 'Defesa das Muralhas' },
                          { id: 'patrulha_ruas', rotulo: 'Patrulha de Ruas' },
                          { id: 'escolta_caravanas', rotulo: 'Escolta Mercante' },
                          { id: 'infiltracao_externa', rotulo: 'Infiltração Secreta' },
                        ].map((m) => (
                          <Pressable
                            key={m.id}
                            onPress={() => designarMissao(oficial.id, m.id as DesignacaoOficial)}
                            style={[styles.filtroPill, oficial.designacao === m.id && styles.filtroPillAtivo]}
                          >
                            <Text style={[styles.filtroPillTxt, oficial.designacao === m.id && styles.filtroPillTxtAtivo]}>
                              {m.rotulo}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {infoPatente.proximaPatente && (
                          <View style={{ flex: 1 }}>
                            <Botao
                              titulo={`Promover para ${CUSTOS_PROMOCAO_OFICIAL[infoPatente.proximaPatente].titulo}`}
                              sub={`Custo: ${infoPatente.custoOuro} ouro (${oficial.experiencia}/${infoPatente.xpNecessario} XP)`}
                              disabled={!podePromover}
                              motivo={oficial.experiencia < infoPatente.xpNecessario ? 'XP insuficiente' : 'Ouro insuficiente'}
                              onPress={() => promoverOficial(oficial.id)}
                              variante="acento"
                            />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Botao
                            titulo="Treinar (+30 XP)"
                            sub="Custo: 15 ouro, 10 materiais"
                            disabled={feudo.tesouro < 15 || feudo.materiais < 10}
                            motivo="Recursos insuficientes"
                            onPress={() => treinarOficiais(oficial.id)}
                          />
                        </View>
                      </View>
                    </Card>
                  );
                })
              )}

              {/* Comissionar Novo Oficial */}
              <Card>
                <TextoSerif style={{ fontSize: 18 }}>Comissionar Novo Oficial Militar</TextoSerif>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Recrute um espadachim ou soldado veterano para o corpo de oficiais da fortaleza.
                </TextoMono>
                <TextInput
                  style={styles.inputTexto}
                  value={nomeNovoOficial}
                  onChangeText={setNomeNovoOficial}
                  placeholder="Nome do novo oficial (Ex: Roland de Halvet, Sor Kaelen...)"
                  placeholderTextColor={cores.mudo}
                />
                <View style={{ marginTop: esp.sm }}>
                  <Botao
                    titulo="Comissionar Oficial da Guarda (-25 Ouro)"
                    sub="Entrega de armas, cota de malha e registro no quartel"
                    disabled={feudo.tesouro + camp.personagem.dinheiro < 25}
                    motivo="Ouro insuficiente para equipamento"
                    onPress={() => {
                      recrutarOficial(`oficial_${Date.now()}`, nomeNovoOficial || 'Sor Gareth da Guarda');
                      setNomeNovoOficial('');
                    }}
                    variante="acento"
                  />
                </View>
              </Card>
            </View>
          )}

          {/* ABA LINHAGEM: Matrimônio Real, Gestação 270 Dias & Herdeiros */}
          {abaAtiva === 'linhagem' && (
            <View style={{ gap: esp.md }}>
              <Card acento={cores.ouro}>
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 20 }}>Corte Real & Matrimônio Soberano</TextoSerif>
                  <Selo texto={feudo.casamento ? 'CASADO' : 'SOLTEIRO'} cor={feudo.casamento ? cores.verdigris : cores.mudo} />
                </View>

                {feudo.casamento ? (
                  <View style={{ marginVertical: esp.sm, gap: 6 }}>
                    <TextoMono style={{ fontSize: 16, color: cores.vellum }}>
                      Cônjuge Real: <TextoSerif style={{ color: cores.ouro }}>{feudo.casamento.nomeConjuge}</TextoSerif>
                    </TextoMono>
                    <TextoMono style={{ fontSize: 11, color: cores.mudo }}>
                      Matrimônio celebrado no Dia {feudo.casamento.dataCasamento} do Calendário Continental.
                    </TextoMono>
                    <Medidor rotulo="Afeto & Harmonia Conjugal" valor={feudo.casamento.afeto} max={100} cor={cores.cinabrio} />

                    {/* Gestação do Herdeiro */}
                    <Divisor label="linhagem & gestação" />
                    {feudo.gestacao?.ativa ? (
                      <Card acento={cores.ouro} style={{ backgroundColor: cores.fundo2 }}>
                        <View style={styles.linhaEntre}>
                          <TextoSerif style={{ fontSize: 18 }}>Gestação Real do Herdeiro da Coroa</TextoSerif>
                          <Selo texto="EM CURSO" cor={cores.ouro} />
                        </View>
                        {(() => {
                          const diasRestantes = Math.max(0, feudo.gestacao.diaPrevisaoParto - camp.calendario.dia);
                          const diasDecorridos = 270 - diasRestantes;
                          const pct = Math.min(100, Math.round((diasDecorridos / 270) * 100));

                          return (
                            <View style={{ marginVertical: esp.xs, gap: 4 }}>
                              <TextoMono style={{ color: cores.vellum }}>
                                Mãe: {feudo.gestacao.nomeMae} · Saúde: {feudo.gestacao.saudeFeto}%
                              </TextoMono>
                              <TextoMono style={{ color: cores.ouro, fontSize: 12 }}>
                                Previsão do Parto: {diasRestantes === 0 ? 'HORA DO PARTO!' : `Restam ${diasRestantes} dias (${pct}% dos 9 meses)`}
                              </TextoMono>
                              <Medidor rotulo="Desenvolvimento Gestacional (270 dias)" valor={diasDecorridos} max={270} cor={cores.ouro} compacto />

                              {diasRestantes === 0 && (
                                <View style={{ marginTop: esp.sm }}>
                                  <Botao
                                    titulo="Celebrar Nascimento & Proclamar Herdeiro!"
                                    sub="Sinos da fortaleza soarão em festa pela dinastia"
                                    onPress={() => darLuzHerdeiro(nomeNovoBebe || 'Aemon', generoBebe)}
                                    variante="primario"
                                  />
                                </View>
                              )}
                            </View>
                          );
                        })()}
                      </Card>
                    ) : (
                      <View style={{ marginTop: esp.sm }}>
                        <Botao
                          titulo="Conceber Herdeiro Real com o Cônjuge"
                          sub="Inicia o ciclo gestacional de 270 dias (9 meses de calendário)"
                          onPress={() => iniciarGestacao()}
                          variante="acento"
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ marginVertical: esp.sm, gap: 8 }}>
                    <TextoMono style={{ color: cores.mudo }}>
                      O soberano ainda não celebrou núpcias. Uma união matrimonial consolida a corte, traz estabilidade e permite conceber herdeiros legítimos da coroa.
                    </TextoMono>
                    <Botao
                      titulo="Celebrar Casamento com Dama da Nobreza de Mareu"
                      sub="Lady Isolda da Casa Mareu (+30 Prestígio, +15 Estabilidade)"
                      onPress={() => celebrarCasamento('npc_isolda', 'Lady Isolda de Mareu')}
                      variante="acento"
                    />
                    <Botao
                      titulo="Celebrar Casamento com Herdeira de Tessel"
                      sub="Lady Kaelen das Montanhas (+30 Prestígio, +15 Estabilidade)"
                      onPress={() => celebrarCasamento('npc_kaelen', 'Lady Kaelen de Tessel')}
                    />
                  </View>
                )}
              </Card>

              {/* Filhos e Herdeiros Dinásticos */}
              <Divisor label={`filhos herdeiros (${feudo.filhosHerdeiros?.filter(f => f.vivo).length ?? 0})`} />
              {(!feudo.filhosHerdeiros || feudo.filhosHerdeiros.length === 0) ? (
                <Card>
                  <TextoMono style={{ color: cores.mudo, textAlign: 'center' }}>
                    Nenhum herdeiro nascido ainda na dinastia. Conceba herdeiros com o cônjuge real para garantir a continuidade da coroa.
                  </TextoMono>
                </Card>
              ) : (
                feudo.filhosHerdeiros.map((filho) => {
                  const ehAparente = feudo.herdeiroAparenteId === filho.id;
                  return (
                    <Card key={filho.id} acento={ehAparente ? cores.ouro : undefined}>
                      <View style={styles.linhaEntre}>
                        <View>
                          <TextoSerif style={{ fontSize: 18 }}>{filho.nome}</TextoSerif>
                          <TextoMono style={{ fontSize: 11, color: cores.mudo }}>
                            Idade: {filho.idadeAnos} ano(s) · {filho.genero === 'm' ? 'Príncipe' : 'Princesa'} · Nascido no Dia {filho.diaNascimento}
                          </TextoMono>
                        </View>
                        <Selo texto={ehAparente ? 'HERDEIRO DA COROA' : 'LINHAGEM REAL'} cor={ehAparente ? cores.ouro : cores.verdigris} />
                      </View>

                      <TextoMono style={{ fontSize: 11, color: cores.mudo, marginTop: 4 }}>Atributos Herdados da Dinastia:</TextoMono>
                      <View style={styles.gradeRecursos}>
                        <View style={styles.caixaRecurso}><Text style={styles.rotuloRecurso}>Físico</Text><Text style={styles.valorRecurso}>{filho.atributos.fisico}</Text></View>
                        <View style={styles.caixaRecurso}><Text style={styles.rotuloRecurso}>Precisão</Text><Text style={styles.valorRecurso}>{filho.atributos.precisao}</Text></View>
                        <View style={styles.caixaRecurso}><Text style={styles.rotuloRecurso}>Resiliência</Text><Text style={styles.valorRecurso}>{filho.atributos.resiliencia}</Text></View>
                        <View style={styles.caixaRecurso}><Text style={styles.rotuloRecurso}>Raciocínio</Text><Text style={styles.valorRecurso}>{filho.atributos.raciocinio}</Text></View>
                        <View style={styles.caixaRecurso}><Text style={styles.rotuloRecurso}>Percepção</Text><Text style={styles.valorRecurso}>{filho.atributos.percepcao}</Text></View>
                        <View style={styles.caixaRecurso}><Text style={styles.rotuloRecurso}>Social</Text><Text style={styles.valorRecurso}>{filho.atributos.social}</Text></View>
                      </View>

                      {!ehAparente && (
                        <View style={{ marginTop: esp.xs }}>
                          <Botao
                            titulo="Designar como Herdeiro Aparente"
                            sub="Proclamar formalmente a sucessão do trono para este filho"
                            onPress={() => designarHerdeiroAparente(filho.id)}
                          />
                        </View>
                      )}
                    </Card>
                  );
                })
              )}
            </View>
          )}

          {/* ABA VASSALOS: Vassalagem Feudal & Assembleia de Guerra */}
          {abaAtiva === 'vassalos' && (
            <View style={{ gap: esp.md }}>
              <Card>
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 20 }}>Lordes Vassalos Juramentados (Estilo CK3)</TextoSerif>
                  <Selo texto={`${feudo.vassalos?.length ?? 0} VASSALOS`} cor={cores.ouro} />
                </View>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Conceda senhorios a nobres leais. Eles recolhem impostos diários para o seu tesouro e fornecem levas de cavaleiros e homens-de-armas em tempos de guerra.
                </TextoMono>

                <View style={{ marginTop: esp.sm }}>
                  <Botao
                    titulo="Convocar Levas Feudais às Armas"
                    sub="Reunir regimentos de todos os vassalos leais para reforçar a segurança e exércitos"
                    disabled={!feudo.vassalos || feudo.vassalos.length === 0}
                    motivo="Sem vassalos juramentados"
                    onPress={() => convocarLevas()}
                    variante="acento"
                  />
                </View>
              </Card>

              <Divisor label="feudos e nobres vassalos" />
              {(!feudo.vassalos || feudo.vassalos.length === 0) ? (
                <Card>
                  <TextoMono style={{ color: cores.mudo, textAlign: 'center' }}>
                    Nenhum domínio concedido como vassalagem no momento. Conceda terras abaixo para jurar lordes ao seu estandarte.
                  </TextoMono>
                </Card>
              ) : (
                feudo.vassalos.map((v) => (
                  <Card key={v.id} acento={v.lealdade >= 50 ? cores.verdigris : cores.cinabrio}>
                    <View style={styles.linhaEntre}>
                      <View>
                        <TextoSerif style={{ fontSize: 18 }}>{v.nomeLorde}</TextoSerif>
                        <TextoMono style={{ fontSize: 11, color: cores.ouro }}>Senhorio de {v.nomeFeudo}</TextoMono>
                      </View>
                      <Selo texto={`LEALDADE ${v.lealdade}%`} cor={v.lealdade >= 50 ? cores.verdigris : cores.cinabrio} />
                    </View>

                    <View style={styles.gradeRecursos}>
                      <View style={styles.caixaRecurso}>
                        <Text style={styles.rotuloRecurso}>Tributo Diário</Text>
                        <Text style={[styles.valorRecurso, { color: cores.ouro }]}>+{v.tributoDiario} ouro/dia</Text>
                      </View>
                      <View style={styles.caixaRecurso}>
                        <Text style={styles.rotuloRecurso}>Levas Juradas</Text>
                        <Text style={[styles.valorRecurso, { color: cores.verdigris }]}>{v.levasMilitares} soldados</Text>
                      </View>
                      <View style={styles.caixaRecurso}>
                        <Text style={styles.rotuloRecurso}>Opinião Suserano</Text>
                        <Text style={styles.valorRecurso}>{v.opiniaoSuserano > 0 ? `+${v.opiniaoSuserano}` : v.opiniaoSuserano}</Text>
                      </View>
                    </View>
                  </Card>
                ))
              )}

              {/* Conceder Novo Feudo Vassalo */}
              <Card>
                <TextoSerif style={{ fontSize: 18 }}>Conceder Senhorio & Firmar Pacto Feudal</TextoSerif>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Eleve um cavaleiro ou nobre à condição de lorde vassalo, concedendo terras em troca de tributo diário (+15 Prestígio).
                </TextoMono>
                <TextInput
                  style={styles.inputTexto}
                  value={nomeNovoVassalo}
                  onChangeText={setNomeNovoVassalo}
                  placeholder="Nome do Nobre (Ex: Barão Cedric, Conde Vance...)"
                  placeholderTextColor={cores.mudo}
                />
                <View style={{ height: 6 }} />
                <TextInput
                  style={styles.inputTexto}
                  value={nomeFeudoCedido}
                  onChangeText={setNomeFeudoCedido}
                  placeholder="Nome do Feudo Cedido (Ex: Baronia da Vigia, Marca das Colinas...)"
                  placeholderTextColor={cores.mudo}
                />
                <View style={{ marginTop: esp.sm }}>
                  <Botao
                    titulo="Selar Juramento Feudal de Vassalagem"
                    sub="O nobre jura homenagem, tributos e levas militares"
                    onPress={() => {
                      concederFeudo(`npc_vassalo_${Date.now()}`, nomeNovoVassalo || 'Barão Cedric', `feudo_${Date.now()}`, nomeFeudoCedido || 'Terras Altas');
                      setNomeNovoVassalo('');
                      setNomeFeudoCedido('');
                    }}
                    variante="acento"
                  />
                </View>
              </Card>

              {/* Assembleia de Guerra */}
              <Divisor label="assembleia da coroa & guerra" />
              <Card acento={feudo.guerraDeclaradaAlvoId ? cores.cinabrio : undefined}>
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 18 }}>Assembleia Militar da Coroa</TextoSerif>
                  <Selo texto={feudo.guerraDeclaradaAlvoId ? 'EM GUERRA' : 'PAZ FORMAL'} cor={feudo.guerraDeclaradaAlvoId ? cores.cinabrio : cores.verdigris} />
                </View>

                {feudo.guerraDeclaradaAlvoId ? (
                  <View style={{ marginVertical: esp.sm, gap: 6 }}>
                    <TextoMono style={{ color: cores.cinabrio, fontSize: 14 }}>
                      O reino está em marcha de guerra total contra {feudo.guerraDeclaradaAlvoId}! Estandartes e guarnições mobilizados nas fronteiras.
                    </TextoMono>
                    <Botao
                      titulo="Firmar Tratado de Paz"
                      sub="Encerrar as hostilidades armadas e restaurar o comércio (+10 Estabilidade)"
                      onPress={() => firmarPaz()}
                      variante="primario"
                    />
                  </View>
                ) : (
                  <View style={{ marginVertical: esp.sm, gap: 6 }}>
                    <TextoMono style={{ color: cores.mudo }}>
                      Convoque a Assembleia dos Lordes para aprovar uma campanha militar formal contra uma cidade ou facção rival do continente.
                    </TextoMono>
                    <TextInput
                      style={styles.inputTexto}
                      value={alvoGuerraCidade}
                      onChangeText={setAlvoGuerraCidade}
                      placeholder="Cidade ou Fortaleza Alvo (Ex: Tessel, Solgar, Corveira...)"
                      placeholderTextColor={cores.mudo}
                    />
                    <View style={{ height: 4 }} />
                    <TextInput
                      style={styles.inputTexto}
                      value={casusBelli}
                      onChangeText={setCasusBelli}
                      placeholder="Casus Belli (Ex: Quebra de Tratado Comercial, Disputa de Fronteira...)"
                      placeholderTextColor={cores.mudo}
                    />
                    <Botao
                      titulo="Declarar Guerra pela Assembleia da Coroa"
                      sub="Mobiliza o exército e proclama a soberania do reino (+10 Prestígio)"
                      onPress={() => convocarGuerra(alvoGuerraCidade || 'tessel', casusBelli || 'Disputa de Fronteira')}
                      variante="acento"
                    />
                  </View>
                )}
              </Card>
            </View>
          )}

          {/* ABA INTRIGAS: Tramas de Usurpação & Espionagem */}
          {abaAtiva === 'intrigas' && (
            <View style={{ gap: esp.md }}>
              <Card>
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 20 }}>Rede de Intriga & Tramas de Usurpação</TextoSerif>
                  <Selo texto="ESPIONAGEM" cor={cores.violeta} />
                </View>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Sob a liderança do Mestre dos Espiões, orquestre operações secretas além das fronteiras. Ao atingir 100% de progresso, um golpe de estado é executado e a cidade é anexada como feudo vassalo (+50 Prestígio)!
                </TextoMono>
                <TextoMono style={{ color: cores.ouro, fontSize: 12 }}>
                  Mestre dos Espiões: {feudo.conselho?.mestre_espioes ? `${feudo.conselho.mestre_espioes.nome} (Competência ${feudo.conselho.mestre_espioes.competencia})` : 'Nenhum nomeado (exigido para tramas)'}
                </TextoMono>
              </Card>

              <Divisor label={`tramas ativas (${feudo.tramasAtivas?.length ?? 0})`} />
              {(!feudo.tramasAtivas || feudo.tramasAtivas.length === 0) ? (
                <Card>
                  <TextoMono style={{ color: cores.mudo, textAlign: 'center' }}>
                    Nenhuma trama de usurpação em andamento. Inicie operações de infiltração abaixo.
                  </TextoMono>
                </Card>
              ) : (
                feudo.tramasAtivas.map((trama) => (
                  <Card key={trama.id} acento={cores.violeta}>
                    <View style={styles.linhaEntre}>
                      <View>
                        <TextoSerif style={{ fontSize: 18 }}>Golpe em {trama.alvoNome}</TextoSerif>
                        <TextoMono style={{ fontSize: 11, color: cores.mudo }}>Líder da Trama: {trama.liderNome}</TextoMono>
                      </View>
                      <Selo texto={`${Math.round(trama.progresso)}% CONCLUÍDO`} cor={cores.ouro} />
                    </View>
                    <View style={{ marginVertical: esp.xs }}>
                      <Medidor rotulo="Infiltração & Preparação do Golpe" valor={Math.round(trama.progresso)} max={100} cor={cores.violeta} compacto />
                    </View>
                    <TextoMono style={{ fontSize: 11, color: cores.mudo }}>
                      Infiltrados sabotam guarnições e subornam nobres da cidade rival. A cada dia o golpe se aproxima do clímax.
                    </TextoMono>
                  </Card>
                ))
              )}

              {/* Iniciar Nova Trama */}
              <Card>
                <TextoSerif style={{ fontSize: 18 }}>Orquestrar Infiltração & Trama de Usurpação</TextoSerif>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Envie espiões para tecer conspirações e subornar comandantes de uma cidade rival. Custo inicial: 50 ouro.
                </TextoMono>
                <TextInput
                  style={styles.inputTexto}
                  value={alvoTramaCidade}
                  onChangeText={setAlvoTramaCidade}
                  placeholder="Identificador da Cidade (Ex: solgar, corveira, tessel...)"
                  placeholderTextColor={cores.mudo}
                />
                <View style={{ height: 4 }} />
                <TextInput
                  style={styles.inputTexto}
                  value={alvoTramaNome}
                  onChangeText={setAlvoTramaNome}
                  placeholder="Nome da Cidade (Ex: Solgar das Areias, Fortaleza de Corveira...)"
                  placeholderTextColor={cores.mudo}
                />
                <View style={{ marginTop: esp.sm }}>
                  <Botao
                    titulo="Despachar Rede de Espiões (-50 Ouro)"
                    sub="Iniciar trama secreta de usurpação de trono"
                    disabled={!feudo.conselho?.mestre_espioes || feudo.tesouro + camp.personagem.dinheiro < 50}
                    motivo={!feudo.conselho?.mestre_espioes ? 'Exige Mestre dos Espiões no Conselho' : 'Ouro insuficiente'}
                    onPress={() => {
                      iniciarTrama(alvoTramaCidade || 'solgar', alvoTramaNome || 'Solgar das Areias', feudo.conselho?.mestre_espioes?.npcId || 'mestre', feudo.conselho?.mestre_espioes?.nome || 'Mestre dos Espiões');
                    }}
                    variante="acento"
                  />
                </View>
              </Card>
            </View>
          )}

          {/* ABA DISTRITOS: Catálogo Modular sem Limite Fixo de 5 Níveis */}
          {abaAtiva === 'distritos' && (
            <View style={{ gap: esp.md }}>
              <View style={styles.filtroDistritos}>
                {['todos', 'habitacao', 'governanca', 'militar', 'comercio', 'producao', 'defesa'].map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setFiltroDistrito(cat)}
                    style={[styles.filtroPill, filtroDistrito === cat && styles.filtroPillAtivo]}
                  >
                    <Text style={[styles.filtroPillTxt, filtroDistrito === cat && styles.filtroPillTxtAtivo]}>
                      {cat.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {(Object.keys(CATALOGO_EDIFICIOS) as TipoEdificioModular[])
                .filter((tipo) => filtroDistrito === 'todos' || CATALOGO_EDIFICIOS[tipo].categoria === filtroDistrito)
                .map((tipo) => {
                  const def = CATALOGO_EDIFICIOS[tipo];
                  const nivelAtual = feudo.edificios[tipo] ?? 0;
                  const fatorNivel = 1 + nivelAtual * 0.25;
                  const custoOuro = Math.floor(def.custoBaseOuro * fatorNivel);
                  const custoMateriais = Math.floor(def.custoBaseMateriais * fatorNivel);
                  const diasObra = Math.ceil(def.tempoBasePeriodos / 4);

                  const temOuro = feudo.tesouro + camp.personagem.dinheiro >= custoOuro;
                  const temMateriais = feudo.materiais >= custoMateriais;
                  const podeConstruir = temOuro && temMateriais;
                  const jaEmConstrucao = feudo.obrasEmAndamento.some((o) => o.tipo === tipo);

                  return (
                    <Card key={tipo} acento={nivelAtual > 0 ? cores.verdigris : undefined}>
                      <View style={styles.linhaEntre}>
                        <TextoSerif style={{ fontSize: 20 }}>{def.nome}</TextoSerif>
                        <Selo texto={`NÍVEL ${nivelAtual}`} cor={nivelAtual > 0 ? cores.verdigris : cores.mudo} />
                      </View>
                      <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>{def.descricao}</TextoMono>
                      <TextoMono style={{ color: cores.ouro, marginBottom: 8 }}>{def.efeitoPorNivel}</TextoMono>

                      <View style={styles.linhaEntre}>
                        <TextoMono style={{ fontSize: 11 }}>
                          Custo: {custoOuro} ouro · {custoMateriais} materiais · {diasObra} dias
                        </TextoMono>
                      </View>

                      <View style={{ marginTop: esp.sm }}>
                        {jaEmConstrucao && !def.acumulativo ? (
                          <Botao titulo="Obra Já em Execução" disabled motivo="Aguarde os operários concluírem o nível atual." />
                        ) : (
                          <Botao
                            titulo={nivelAtual === 0 ? `Construir ${def.nome}` : `Expandir para Nível ${nivelAtual + 1}`}
                            sub={`Exige ${custoOuro} ouro e ${custoMateriais} materiais`}
                            disabled={!podeConstruir}
                            motivo={!temOuro ? 'Ouro insuficiente' : 'Materiais de construção insuficientes'}
                            variante="acento"
                            onPress={() => iniciarObra(tipo)}
                          />
                        )}
                      </View>
                    </Card>
                  );
                })}
            </View>
          )}

          {/* ABA ROTAS & PATRULHAS: Caravanas Comerciais e Defesa Militar */}
          {abaAtiva === 'rotas' && (
            <View style={{ gap: esp.md }}>
              <Card>
                <TextoSerif style={{ fontSize: 20 }}>Companhia de Caravanas & Rotas Comerciais</TextoSerif>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Despache caravanas de mantimentos, minérios ou armas para cidades do continente. Ao retornarem, elas
                  injetam ouro no feudo e fortalecem o comércio mútuo.
                </TextoMono>

                <Divisor label="caravanas em trânsito" />
                {feudo.rotasComerciais.length === 0 ? (
                  <TextoMono style={{ color: cores.mudo, textAlign: 'center', marginVertical: esp.sm }}>
                    Nenhuma caravana comercial enviada no momento.
                  </TextoMono>
                ) : (
                  feudo.rotasComerciais.map((r) => (
                    <Card key={r.id} acento={cores.ouro}>
                      <View style={styles.linhaEntre}>
                        <TextoSerif style={{ fontSize: 18 }}>Caravana para {r.destinoNome}</TextoSerif>
                        <Selo texto={r.cargaTipo.toUpperCase()} cor={cores.ouro} />
                      </View>
                      <TextoMono>
                        Dias Restantes: {Math.ceil(r.diasRestantes)} · Lucro Estimado: +{r.lucroEstimado} ouro
                      </TextoMono>
                      <TextoMono style={{ color: r.riscoEstrada > 20 ? cores.cinabrio : cores.verdigris }}>
                        Risco de Emboscada na Estrada: {r.riscoEstrada}%
                      </TextoMono>
                    </Card>
                  ))
                )}

                <Divisor label="despachar nova caravana" />
                <View style={{ gap: 8 }}>
                  <Botao
                    titulo="Despachar Caravana de Mantimentos para Tessel"
                    sub="Consome 15 comida e 5 materiais · Viagem: 6 dias"
                    onPress={() => despacharCaravana('tessel', 'Marca de Tessel', 'mantimentos')}
                  />
                  <Botao
                    titulo="Despachar Caravana de Minérios para Corveira"
                    sub="Consome 15 comida e 10 materiais · Viagem: 5 dias"
                    onPress={() => despacharCaravana('corveira', 'Planalto de Corveira', 'minerio')}
                  />
                  <Botao
                    titulo="Despachar Caravana de Especiarias para Solgar"
                    sub="Consome 15 comida e 10 materiais · Viagem: 7 dias"
                    onPress={() => despacharCaravana('solgar', 'Ermo de Solgar', 'artesanato')}
                  />
                  <Botao
                    titulo="Despachar Caravana Marítima para Mareu"
                    sub="Consome 15 comida e 10 materiais · Viagem: 4 dias"
                    onPress={() => despacharCaravana('mareu', 'Costa de Mareu', 'armas')}
                  />
                </View>
              </Card>

              {/* Patrulhas Militares */}
              <Card>
                <TextoSerif style={{ fontSize: 20 }}>Destacamentos de Patrulha Militar</TextoSerif>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Aloque guardas do quartel para patrulhar as estradas, suprimindo o banditismo e protegendo caravanas.
                  Capacidade total: {(feudo.edificios.quartel ?? 1) * 6} soldados.
                </TextoMono>

                {feudo.rotasPatrulha.map((p) => (
                  <View key={p.id} style={{ marginVertical: 6 }}>
                    <View style={styles.linhaEntre}>
                      <TextoMono>{p.nomeRegiao}</TextoMono>
                      <TextoMono style={{ color: cores.verdigris }}>{p.soldadosAlocados} soldados ({p.eficaciaPacificacao}% pacificação)</TextoMono>
                    </View>
                  </View>
                ))}

                <View style={{ gap: 8, marginTop: esp.sm }}>
                  <Botao
                    titulo="Designar Patrulha para a Estrada de Tessel (3 soldados)"
                    sub="Custo: 6 moedas/dia de manutenção"
                    onPress={() => definirPatrulha('estrada_tessel', 'Estrada de Tessel', 3)}
                  />
                  <Botao
                    titulo="Designar Patrulha para a Rota das Dunas de Solgar (4 soldados)"
                    sub="Custo: 8 moedas/dia de manutenção"
                    onPress={() => definirPatrulha('estrada_solgar', 'Dunas de Solgar', 4)}
                  />
                </View>
              </Card>
            </View>
          )}

          {/* ABA ASORA: Módulo Integrado do Subespaço Tsukimichi */}
          {abaAtiva === 'asora' && camp.asora && (
            <View style={{ gap: esp.md }}>
              <Card>
                <View style={styles.linhaEntre}>
                  <TextoSerif style={{ fontSize: 22 }}>Metrópole Dimensional de Asora</TextoSerif>
                  <Selo texto="SUBESPAÇO" cor={cores.violeta} />
                </View>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  Reino dimensional habitado por demi-humanos acolhidos (Highland Orcs, Mist Lizards, Elder Dwarves, Alkeys).
                </TextoMono>

                <View style={styles.gradeRecursos}>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>Cidadãos</Text>
                    <Text style={styles.valorRecurso}>{camp.asora.populacao}</Text>
                  </View>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>Seda Celestial</Text>
                    <Text style={styles.valorRecurso}>{camp.asora.estoques?.seda ?? 0}</Text>
                  </View>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>Minério Estelar</Text>
                    <Text style={styles.valorRecurso}>{camp.asora.estoques?.minerio ?? 0}</Text>
                  </View>
                  <View style={styles.caixaRecurso}>
                    <Text style={styles.rotuloRecurso}>Ferramentas Rúnicas</Text>
                    <Text style={[styles.valorRecurso, { color: cores.ouro }]}>
                      {camp.asora.recursosEspeciais?.ferramentasDisponiveis ?? 0}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: esp.md }}>
                  <Medidor rotulo="Harmonia Social" valor={camp.asora.harmonia ?? 80} max={100} cor={cores.violeta} />
                  <Medidor rotulo="Segurança Mágica" valor={camp.asora.seguranca ?? 70} max={100} cor={cores.verdigris} />
                </View>
              </Card>
            </View>
          )}

          {/* ABA MAPA: Mapa Cartográfico de Halvern & Vaelhorn */}
          {abaAtiva === 'mapa' && (
            <View style={{ gap: esp.md }}>
              <Card>
                <TextoSerif style={{ fontSize: 22, color: cores.ouro }}>Cartografia de Halvern & Vaelhorn</TextoSerif>
                <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>
                  O continente completo com suas cinco províncias históricas, cadeias de montanhas, desertos e oceanos.
                </TextoMono>
                <View style={styles.mapaContainer}>
                  <Image source={IMAGENS_FEUDO.mapa_continente} style={styles.mapaImagem} resizeMode="contain" />
                </View>
              </Card>

              <Divisor label="regiões e biomas continentais" />
              {PONTOS_DE_ASSENTAMENTO.map((p) => (
                <Card key={p.id}>
                  <View style={styles.linhaEntre}>
                    <TextoSerif style={{ fontSize: 18 }}>{p.nome}</TextoSerif>
                    <Selo texto={p.regiao} cor={cores.ouro} />
                  </View>
                  <TextoMono style={{ color: cores.mudo, marginVertical: 4 }}>{p.descricao}</TextoMono>
                  <TextoMono style={{ color: cores.verdigris }}>{p.vantagem}</TextoMono>
                </Card>
              ))}
            </View>
          )}
        </>
      )}
    </Pagina>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    height: 190,
    borderRadius: raio.lg,
    overflow: 'hidden',
    marginBottom: esp.md,
    position: 'relative',
    borderWidth: 1,
    borderColor: cores.linha,
  },
  bannerImagem: {
    width: '100%',
    height: '100%',
  },
  bannerGradiente: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 17, 16, 0.55)',
    justifyContent: 'flex-end',
    padding: esp.md,
  },
  bannerInfo: {
    gap: 2,
  },
  bannerTitulo: {
    fontFamily: fontes.serifSemi,
    fontSize: 24,
    color: cores.vellum,
    lineHeight: 28,
  },
  bannerSub: {
    fontFamily: fontes.mono,
    fontSize: 12,
    color: cores.mudo,
  },
  abasContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
    marginBottom: esp.md,
    gap: 4,
    flexWrap: 'wrap',
  },
  abaItem: {
    paddingVertical: esp.sm,
    paddingHorizontal: esp.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  abaItemAtiva: {
    borderBottomColor: cores.ouro,
  },
  abaTxt: {
    fontFamily: fontes.mono,
    fontSize: 12,
    color: cores.mudo,
  },
  abaTxtAtiva: {
    color: cores.ouro,
  },
  gradeRecursos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: esp.sm,
    marginVertical: esp.sm,
  },
  caixaRecurso: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: cores.fundo2,
    padding: esp.sm,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  rotuloRecurso: {
    fontFamily: fontes.mono,
    fontSize: 10,
    color: cores.mudo,
    textTransform: 'uppercase',
  },
  valorRecurso: {
    fontFamily: fontes.monoMedium,
    fontSize: 15,
    color: cores.vellum,
    marginTop: 2,
  },
  subRecurso: {
    fontSize: 11,
    color: cores.mudo,
  },
  linhaEntre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtroDistritos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: esp.xs,
    marginBottom: esp.sm,
  },
  filtroPill: {
    paddingHorizontal: esp.sm,
    paddingVertical: 4,
    borderRadius: raio.sm,
    backgroundColor: cores.fundo2,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  filtroPillAtivo: {
    borderColor: cores.ouro,
    backgroundColor: cores.couro,
  },
  filtroPillTxt: {
    fontFamily: fontes.mono,
    fontSize: 10,
    color: cores.mudo,
  },
  filtroPillTxtAtivo: {
    color: cores.ouro,
  },
  mapaContainer: {
    width: '100%',
    height: 240,
    borderRadius: raio.md,
    overflow: 'hidden',
    marginVertical: esp.sm,
    backgroundColor: cores.fundo2,
  },
  mapaImagem: {
    width: '100%',
    height: '100%',
  },
  brasaoBox: {
    padding: esp.md,
    borderRadius: raio.md,
    backgroundColor: cores.fundo2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputTexto: {
    backgroundColor: cores.fundo2,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.sm,
    paddingHorizontal: esp.sm,
    paddingVertical: esp.xs,
    color: cores.vellum,
    fontFamily: fontes.mono,
    fontSize: 13,
  },
});

