import shutil
R = '/home/user/ro-arcanum/'
FB = '/home/user/ro-arcanum/docs/colonia-etapa-B/'  # arquivos guardados com .txt no fim
for f in ['content/vaelhorn/colonos.ts', 'engine/colonos.ts', 'ui/screens/GenteColonia.tsx', 'engine/colonos.selftest.ts']:
    shutil.copy(FB + f + '.txt', R + f)

def edit(p, pares):
    s = open(R + p).read()
    for a, b in pares:
        assert a in s, (p, a[:70])
        s = s.replace(a, b, 1)
    open(R + p, 'w').write(s)

edit('engine/types.ts', [
    ("  farolAceso?: boolean;\n",
     "  farolAceso?: boolean;\n  // Gente com nome, quem espera à porta e o renome (engine/colonos.ts).\n  colonos?: import('./colonos').Colono[];\n  chegadas?: import('./colonos').ChegadaPendente[];\n  renome?: number;\n  seqColonos?: number;\n  /** Animais da colônia por espécie (etapa C). */\n  rebanhos?: Record<string, number>;\n"),
    ("  sitiosColonia?: import('../content/vaelhorn/sitios').SitioColonia[];\n",
     "  sitiosColonia?: import('../content/vaelhorn/sitios').SitioColonia[];\n  arquetiposColono?: import('../content/vaelhorn/colonos').ArquetipoColono[];\n  gruposChegada?: import('../content/vaelhorn/colonos').GrupoChegada[];\n  nomesColonas?: string[];\n  nomesColonos?: string[];\n"),
])

edit('content/vaelhorn/index.ts', [
    ("import { SITIOS_COLONIA } from './sitios';", "import { SITIOS_COLONIA } from './sitios';\nimport { ARQUETIPOS_COLONO, GRUPOS_CHEGADA, NOMES_COLONAS, NOMES_COLONOS } from './colonos';"),
    ("  sitiosColonia: SITIOS_COLONIA,\n", "  sitiosColonia: SITIOS_COLONIA,\n  arquetiposColono: ARQUETIPOS_COLONO,\n  gruposChegada: GRUPOS_CHEGADA,\n  nomesColonas: NOMES_COLONAS,\n  nomesColonos: NOMES_COLONOS,\n"),
])

edit('engine/colonia.ts', [
    ("import { obterFeudo } from './reino';", "import { obterFeudo } from './reino';\nimport { colonosFundadores, eficiencia, processarGente, type RelatorioGente } from './colonos';"),
    ("  const texto = `Você fincou o estandarte em ${s.nome}. \"${f.nome}\" são seis pessoas, três abrigos de lona e uma roça cavada à mão.`;",
     "  colonosFundadores(content, camp, s.regiao);\n  const nomes = (f.colonos ?? []).map(c => c.nome).join(' e ');\n  const texto = `Você fincou o estandarte em ${s.nome}. \"${f.nome}\" são seis pessoas, três abrigos de lona e uma roça cavada à mão.${nomes ? ` Vieram com você ${nomes}, e mais quatro que ainda não disseram o nome.` : ''}`;"),
    ("export type RelatorioDia = {\n  lavoura: number; selvagem: number; consumo: number; materiais: number; renda: number;\n  tributo: number; eventos: string[];\n};",
     "export type RelatorioDia = {\n  lavoura: number; selvagem: number; consumo: number; materiais: number; renda: number;\n  tributo: number; eventos: string[];\n  gente?: RelatorioGente;\n};"),
    ("  const roca = (f.edificios.lavoura_silos ?? 0) * 8 * m.fatorLavoura * (inverno ? m.lavouraInverno : 1);",
     "  // Cada ofício anda conforme quem cuida dele (engine/colonos.ts): sem\n  // responsável, 60%.\n  const ef = (o: Parameters<typeof eficiencia>[1]) => eficiencia(f, o);\n  const roca = (f.edificios.lavoura_silos ?? 0) * 8 * m.fatorLavoura * (inverno ? m.lavouraInverno : 1) * ef('lavoura');"),
    ("  r.selvagem = m.comidaSelvagemDia;", "  r.selvagem = m.comidaSelvagemDia * ef('caca');"),
    ("  r.materiais = m.materiaisDia + (f.edificios.oficina_forja ?? 0) * 4;",
     "  r.materiais = m.materiaisDia * ef('obras') + (f.edificios.oficina_forja ?? 0) * 4 * ef('oficina');\n  // Obras andam conforme quem constrói: o ciclo antigo já descontou 4 períodos.\n  for (const o of f.obrasEmAndamento) o.periodosRestantes -= 4 * (ef('obras') - 1);"),
    ("  r.renda = m.rendaPassagemDia + (f.edificios.moradias ?? 0) * 2 + (f.edificios.mercado_feitoria ?? 0) * 5;",
     "  r.renda = (m.rendaPassagemDia + (f.edificios.moradias ?? 0) * 2 + (f.edificios.mercado_feitoria ?? 0) * 5) * ef('comercio');"),
    ("  f.remedios = Math.min(500, f.remedios + (f.edificios.boticario_hospital ?? 0) * 3);",
     "  f.remedios = Math.min(500, f.remedios + (f.edificios.boticario_hospital ?? 0) * 3 * ef('cura'));"),
    ("  const alvoSeg = Math.min(100, m.segurancaBase + (f.edificios.muralha_baluarte ?? 0) * 15 + (f.edificios.quartel ?? 0) * 10",
     "  const alvoSeg = Math.min(100, m.segurancaBase + (f.edificios.muralha_baluarte ?? 0) * 15 + (f.edificios.quartel ?? 0) * 10 + (ef('guarda') - 0.6) * 25"),
    ("  for (const texto of r.eventos) f.historicoEventos.push({ dia: camp.calendario.dia, texto });",
     "  r.gente = processarGente(content, camp, s.regiao, s.terreno.passagem);\n  for (const texto of r.eventos) f.historicoEventos.push({ dia: camp.calendario.dia, texto });"),
])

edit('engine/index.ts', [("export * from './colonia';", "export * from './colonia';\nexport * from './colonos';")])

edit('ui/store.ts', [
    ("  reacenderFarolAcao: () => Promise<string>;",
     "  reacenderFarolAcao: () => Promise<string>;\n  aceitarChegadaAcao: (id: string) => Promise<string>;\n  recusarChegadaAcao: (id: string) => Promise<string>;\n  designarFuncaoAcao: (colonoId: string, oficio?: import('@/engine').OficioColonia) => Promise<string>;"),
    ("  async reacenderFarolAcao() {",
     """  async aceitarChegadaAcao(id) {
    const { camp, content } = get();
    if (!camp || !content) return '';
    const r = aceitarChegada(content, camp, id);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async recusarChegadaAcao(id) {
    const { camp } = get();
    if (!camp) return '';
    const r = recusarChegada(camp, id);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async designarFuncaoAcao(colonoId, oficio) {
    const { camp } = get();
    if (!camp) return '';
    const r = designarFuncao(camp, colonoId, oficio);
    set({ camp: { ...camp }, feed: [...get().feed, nf(r.mensagem, 'sistema')] });
    await persistir(camp, set);
    return r.mensagem;
  },

  async reacenderFarolAcao() {"""),
    ("  fundarColonia,\n  reacenderFarol,\n", "  fundarColonia,\n  reacenderFarol,\n  aceitarChegada,\n  recusarChegada,\n  designarFuncao,\n"),
])

s = open(R + 'engine/types.ts').read()
edit('ui/screens/Assentamento.tsx', [
    ("export type AbaAssentamento = 'geral' |", "export type AbaAssentamento = 'geral' | 'gente' |"),
    ("import { FundacaoColonia, SitioDaColonia } from './Colonia';", "import { FundacaoColonia, SitioDaColonia } from './Colonia';\nimport { GenteDaColonia } from './GenteColonia';"),
    ("          {abaAtiva === 'geral' && (\n", "          {abaAtiva === 'gente' && <GenteDaColonia />}\n\n          {abaAtiva === 'geral' && (\n"),
])
print('ok')
edit('ui/screens/Assentamento.tsx', [
    ("""              <Text style={[styles.abaTxt, abaAtiva === 'geral' && styles.abaTxtAtiva]}>Soberania</Text>
            </Pressable>""",
     """              <Text style={[styles.abaTxt, abaAtiva === 'geral' && styles.abaTxtAtiva]}>Soberania</Text>
            </Pressable>
            <Pressable
              onPress={() => setAbaAtiva('gente')}
              style={[styles.abaItem, abaAtiva === 'gente' && styles.abaItemAtiva]}
            >
              <Text style={[styles.abaTxt, abaAtiva === 'gente' && styles.abaTxtAtiva]}>Gente</Text>
            </Pressable>"""),
])
print('aba ok')
