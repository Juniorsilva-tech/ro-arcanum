# HANDOFF — RO ARCANUM

## Agente atual
Claude (seguindo docs/PLANO-FABLE-5.1.md)

## Estado
EM DESENVOLVIMENTO

## Ponto de partida
O projeto foi recebido após trabalho interrompido do GPT-6 Astra.

Antes de alterar qualquer coisa:
- analisar o código existente;
- identificar o que Astra já concluiu;
- não reimplementar sistemas funcionais;
- não assumir que código incompleto está errado sem investigar.


---

## Como este documento está organizado
O registro cresceu além do que um agente novo consegue ler antes de começar.
Na sessão 16 ele foi dividido:

- **`HANDOFF.md` (este arquivo)** — estado atual, sessões recentes (43 em
  diante), problemas abertos e próximo passo. É o que se lê antes de trabalhar.
- **`HANDOFF-ARQUIVO.md`** — sessões 1 a 42, na íntegra e sem edição. Consultar
  quando for preciso saber *por que* alguma decisão antiga foi tomada. As
  sessões 13 a 23 foram movidas na sessão 40, 24 a 27 na sessão 42, 28 a 31 na sessão 43, 32 a 38 na sessão 44, e 39 a 42 na sessão 48.

Nada foi apagado. Ao encerrar uma sessão, escreva aqui; quando este arquivo
passar de ~800 linhas, mova as sessões mais antigas para o arquivo do mesmo
jeito, mantendo o texto original.

### Mapa rápido do arquivo
| Sessão | Assunto |
| --- | --- |
| 1 | Auditoria adversarial do trabalho de Astra/Sol |
| 2 | Aptidão, maestria, exposição, reputação e fama |
| 3 | Progressão de poder híbrida (nível × maestria × equipamento) |
| 4 | Astra — expedições, legados e companheiros |
| 5 | Astra — integração causal |
| 6–8 | Astra — cobertura sistêmica e planos registrados |
| 9–10 | Astra — assentamentos e contexto narrativo |
| 11–12 | Astra — validação ampla e presença contextual de onis |
| 13–15 | Claude — continente, perigo dinâmico, povoamento, rotinas |
| 16 | Claude — backup e divisão do handoff |
| 17–18 | Catálogo e estado vivo das casas |
| 19–21 | Claude — teto humano, Despertar, pendências abertas |
| 19–20, 22 | Gemini — token Nous, melhorias, reflexão cognitiva dos NPCs |
| — | Codex — estado e prioridade seguinte (16/09) |
| 23 | Claude — dois defeitos vistos em jogo pelo dono |
| 24–27 | Gemini — Nêmesis Monolith, Marca, Tsukimichi e DLC isolada |
| 28–31 | Gemini — Bestiário, Contratos, Infância Isekai, Guilda de Tsige |
| 32–38 | Gemini — Classes Tsukimichi, Sakai, Heróis, Musashi, Povoamento, Quase-Morte, Overpower |
| 39–42 | Gemini e Claude — bestas lendárias e romance em Asora, DLC na interface e forja, desmanche/afiação/têmpera |

---

## Sessão 43 — Gemini — Gestão de Assentamento, Feudo & Reino com UI Própria (♜), Construções Modulares, Cooldown Real, Rotas e Mapa Continental

### Objetivo
1. **Atender aos pedidos do usuário**:
   - Gestão de clã e assentamento para o mundo base (Feudo/Castelo de Vaelhorn) e DLC (Asora/Metrópole Dimensional).
   - Aba/tela própria dedicada na barra de navegação com glifo `♜`.
   - Superação do limite fixo de 5 níveis: sistema modular de city-builder, permitindo erguer múltiplos blocos de casas (`moradias`), granjas e fortalezas até Tier 10+ (Acampamento -> Posto -> Aldeia -> Burgo -> Castelo -> Cidade-Fortaleza -> Cidadela Imperial).
   - Cooldown real de construção: obras com contagem regressiva em períodos/dias (`obrasEmAndamento`), com barras de progresso e supervisão diária.
   - Integração com o continente vivo: rotas comerciais ativas despachando caravanas com tempo de viagem e lucro em ouro; rotas de patrulha militar reduzindo perigo e insegurança em estradas; fluxo de refugiados e migrantes acolhidos de cidades em crise (fome, guerra, doença).
   - O lugar de fundação depende de onde o jogador escolhe se assentar (incluindo deserto/areia, montanha, floresta, costa e planície) com imagens artísticas específicas para cada bioma e um mapa cartográfico completo de Halvern e Vaelhorn.

### O que foi alterado e implementado
- `engine/types.ts`:
  - Adicionado campo `feudo?: FeudoState` em `Campaign`.
  - Definidos tipos `FeudoState`, `BiomaFeudo`, `TipoEdificioModular`, `ObraAtiva`, `RotaComercial`, `RotaPatrulha` e `CargaCaravana`.
- `engine/reino.ts` (Novo Módulo):
  - `PONTOS_DE_ASSENTAMENTO`: 6 posições estratégicas documentadas pelo continente (Colinas de Halvet, Oásis de Solgar, Penedos de Tessel, Bosque de Vintra, Enseada de Mareu, Planalto de Corveira).
  - `CATALOGO_EDIFICIOS`: 9 tipos de edifícios modulares (`moradias`, `castelo`, `quartel`, `mercado_feitoria`, `igreja_santuario`, `oficina_forja`, `lavoura_silos`, `muralha_baluarte`, `boticario_hospital`) com fórmulas de custo escalonadas e efeitos.
  - `obterFeudo(camp)`: inicialização transparente e segura.
  - `fundarFeudo(camp, nome, localId, bioma)`: fundação canônica com registro em crônica e memória.
  - `iniciarObraFeudo(camp, tipo)`: validação estrita de tesouro e materiais, enfileiramento de obra com cooldown em períodos.
  - `avancarObrasFeudo(camp, periodos)`: avança contadores, conclui obras e expande capacidade habitacional, segurança e estabilidade.
  - `despacharCaravanaFeudo(camp, destinoId, destinoNome, cargaTipo)`: despacho de caravanas continentais com tempo de viagem ida/volta e retorno de ouro.
  - `definirRotaPatrulhaFeudo(camp, regiaoAlvo, nomeRegiao, soldados)`: alocação militar de patrulhas para pacificar rotas.
  - `processarCicloReino(camp, periodos)`: economia diária, consumo de comida, produção de materiais, retorno de caravanas e acolhimento de refugiados.
- `engine/reino.selftest.ts` (Nova Suíte de Testes):
  - 8 testes cobrindo todas as 23 asserções do ciclo de reino, obras além do nível 5, cooldowns, caravanas, patrulhas e imigração.
- `engine/index.ts`: Exportação pública de `engine/reino`.
- `engine/mundo.ts`: Conexão de `processarCicloReino(camp, 4)` em `avancarMundo`.
- `ui/store.ts`:
  - Inclusão da tela `'assentamento'` em `Tela`.
  - Implementação de `fundarFeudoAcao`, `iniciarObraFeudoAcao`, `despacharCaravanaFeudoAcao`, `definirPatrulhaFeudoAcao` e `supervisionarObrasAcao`.
- `ui/screens/_layout.tsx`:
  - Adicionado ícone de navegação `♜` (Feudo / Asora) na barra superior.
- `App.tsx`:
  - Roteamento da tela `'assentamento'` para `<Assentamento />`.
- `ui/screens/Assentamento.tsx` (Nova Tela de UI):
  - Banner visual responsivo com renderização das ilustrações em alta definição.
  - Painel geral de soberania (População atual vs capacidade de casas, Tesouro, Materiais, Provisões, Remédios, Segurança e Estabilidade).
  - Canteiro de Obras com cooldown visível e barra de progresso.
  - Catálogo de Distritos para expansões modulares sem limite fixo de nível.
  - Painel de Rotas Comerciais e Patrulhas Militares.
  - Painel integrado de Asora para a expansão Tsukimichi.
  - Mapa Continental ilustrado de Halvern e Vaelhorn.
- `assets/feudo/`:
  - 10 imagens geradas: `acampamento.jpg`, `aldeia.jpg`, `castelo.jpg`, `cidadela.jpg`, `deserto.jpg`, `floresta.jpg`, `costa.jpg`, `montanha.jpg`, `asora.jpg`, `mapa_continente.jpg`.
- `package.json`: Inclusão de `test:reino` em `scripts` e no pipeline `test:engine`.

### Verificações e Testes Executados
- `npm run test:reino`: 100% verde (todas as 23 asserções passaram).
- `npm run test:tsukimichi`: 100% verde (70/70 testes aprovados).
- `npm run test:engine`: 21 suítes unitárias + 6 campanhas de 10 anos (107.250 ações) com **0 violações de invariante**.
- `npm run typecheck`: 0 erros (TypeScript Strict Mode 100% limpo).
- `npx expo export --platform web`: 366 módulos empacotados com sucesso em `dist` (Exit 0).

---

## Sessão 44 — Gemini — Soberania Feudal Completa (Estilo Crusader Kings 3 / Mount & Blade), Quartel de Oficiais, Conselho de Regência, Linhagem Real (270 Dias), Vassalagem e Tramas de Usurpação

### Objetivo
1. **Atender aos pedidos detalhados do usuário**:
   - "essa evolução aruitetural 4 apenas? acho muito pouco na evolução do castelo... como tem brasões e casas em outros lugares cidades familias, herois etc no meu castelo tbm deve ter isso... pegar um npc treinar ele no quartel, esse tipo de coisa ele vira um cabo seila algo assim e ele vai ficando forte e melhorando tanto para proteger o castelo, virar um espião e sabotar, enfrentar inimigos, proteger nossas ruas e rotas comerciais... se eu ficar fora conselheiros devem ficar no meu lugar para tomar conta do reino, e cada um tem capacidade ou não depende de quem eu for escolher... romance etc e filhos... faça um plano de implementação e revise sempre que possivel não quero meia implementação quero tudo completo sem placeholder e sem voce achar que fez. quero algo com qualidade".
2. **Escala Arquitetural de 10 Tiers**:
   - Substituição do modelo antigo de 4-5 patamares por 10 tiers granulares e progressivos adaptados aos 6 biomas (Planície, Deserto, Montanha, Floresta, Costa e Subespaço de Asora):
     1. Acampamento Pioneiro
     2. Posto Fortificado
     3. Aldeia Feudal
     4. Burgo Fortificado
     5. Fortaleza Senhorial
     6. Castelo Soberano
     7. Cidadela Murada
     8. Grande Bastião Ducal
     9. Capital Real
     10. Trono Imperial Monumental
3. **Casa Dinástica & Heráldica Feudal**:
   - Fundação da Casa Dinástica do soberano: Nome da dinastia, Lema senhorial, Figura do Brasão heráldico (Dragão, Leão, Falcão, Serpente, Lobo, Torre, Rosa, Espada) e tinturas/cores primárias e secundárias.
   - Pontuação acumulativa de Prestígio Dinástico influenciando a lealdade de vassalos e estabilidade da corte.
4. **Quartel de Oficiais & Progressão Militar**:
   - Sistema de patentes militares: `recruta` -> `cabo` -> `sargento` -> `capitao` -> `comandante` (ou `mestre_espioes`).
   - Recrutamento nominal com custos de soldo e materiais de armaria.
   - Treinamento militar ativo no pátio de armas (`treinarOficiais`) concedendo XP e perícia marcial.
   - Promoção formal de patentes com custos balanceados.
   - 4 designações táticas com impactos sistêmicos reais:
     - `guarda_muralha`: bônus direto na defesa do castelo e fortificação;
     - `patrulha_ruas`: repressão ao crime urbano e aumento contínuo de estabilidade;
     - `escolta_caravana`: mitigação de riscos de emboscada em rotas comerciais ativas;
     - `infiltracao_espionagem`: aceleração de redes de espionagem e tramas secretas em cidades rivais.
5. **Conselho de Regência & Governo na Ausência do Rei**:
   - 5 cargos senhoriais de alta corte:
     - `regente`: governa na ausência do monarca; estabiliza o reino com base no atributo `resiliencia`;
     - `chanceler`: relações exteriores, vassalagem e prestígio com base em `social`;
     - `marechal`: comando de tropas, guarnições e ordem militar com base em `fisico`;
     - `tesoureiro`: arrecadação fiscal e gestão do tesouro com base em `raciocinio` (tesoureiro desleal com baixa confiança desvia recursos);
     - `mestre_espioes`: contraespionagem, vigilância e tramas territoriais com base em `percepcao`.
   - Regência Ativa durante Viagens: quando `camp.localAtual !== feudo.localId`, o Conselho governa deterministicamente pelo ciclo diário, mantendo estabilidade, arrecadando impostos ou sofrendo desfalques se ministros forem corruptos.
6. **Cortejo, Casamento Real e Linhagem Biológica (Calendário de 270 Dias)**:
   - Celebração formal de matrimônio real com damas nobres de cidades do continente (+30 Prestígio, +15 Estabilidade).
   - Início de concepção e gestação real com contagem rigorosa de exatamente **270 dias** (9 meses de calendário civil).
   - Parto canônico gerando `FilhoHerdeiro` com nome, sexo e herança biológica determinística dos 6 atributos canônicos (`fisico`, `precisao`, `resiliencia`, `raciocinio`, `percepcao`, `social`).
   - Envelhecimento anual dinâmico (a cada 360 dias) com amadurecimento e florescimento de atributos.
   - Proclamação formal do `herdeiroAparente` garantindo a sucessão legítima do trono.
7. **Vassalagem Feudal (Estilo CK3)**:
   - Concessão de senhorios a nobres leais (`concederFeudoVassalo`), gerando barões/condes juramentados.
   - Recolhimento diário automático de tributos em ouro para os cofres do feudo.
   - Convocação de levas militares feudais (`convocarLevasVassalos`) reforçando guarnições e segurança.
   - Opinião suserana e lealdade dinâmica (decadência por negligência e necessidade de presentes/honrarias).
8. **Assembleia da Coroa & Guerra Formal**:
   - Convocação da assembleia militar para declaração de guerra formal contra cidades e fortalezas rivais, com registro do alvo e *Casus Belli*.
   - Celebração de tratados de paz restabelecendo o comércio e a estabilidade.
9. **Tramas Secretas de Usurpação & Espionagem**:
   - Orquestração de conspirações clandestinas além das fronteiras conduzidas pelo Mestre dos Espiões e oficiais infiltrados.
   - Progresso diário de infiltração (0 a 100%).
   - Ao atingir 100%, execução automática do golpe de estado, destronando o regente rival e anexando a cidade alvo como um feudo vassalo subordinado à dinastia.
10. **Interface Dedicada Completa (10 Abas)**:
    - `Assentamento.tsx` estruturado em 10 abas: `geral`, `trono`, `quartel`, `linhagem`, `vassalos`, `intrigas`, `distritos`, `rotas`, `asora`, `mapa`.

### Arquivos Modificados
- `engine/types.ts`:
  - Definidos tipos `CargoConselho`, `ConselheiroReino`, `PatenteMilitar`, `DesignacaoOficial`, `OficialReino`, `CasamentoReino`, `GestacaoReino`, `FilhoHerdeiro`, `LordeVassalo`, `TramaReino`, `CasaDinastica`.
  - Estendido `FeudoState` com todos os campos de dinastia, oficiais, conselho, família, vassalagem e conspirações.
- `engine/reino.ts`:
  - Implementada tabela de 10 Tiers arquiteturais para os 6 biomas (`obterTierReinoInfo`).
  - Implementadas funções: `fundarCasaDinastica`, `CARGOS_CONSELHO_INFO`, `nomearConselheiro`, `removerConselheiro`, `recrutarOficial`, `promoverOficial`, `designarMissaoOficial`, `treinarOficiais`, `celebrarCasamento`, `iniciarGestacao`, `darLuzHerdeiro`, `designarHerdeiroAparente`, `concederFeudoVassalo`, `convocarLevasVassalos`, `convocarAssembleiaGuerra`, `firmarTratadoPaz`, `iniciarTramaUsurpacao`.
  - `processarCicloReino`: integrado com regência na ausência do monarca, avanço de gestação de 270 dias, envelhecimento de herdeiros, recolhimento de impostos vassalos, XP de oficiais e avanço de tramas de usurpação.
- `engine/index.ts`:
  - Re-exportação de todos os novos símbolos, tipos e constantes de `engine/reino`.
- `engine/reino.selftest.ts`:
  - Expandido de 23 para 88 asserções organizadas em 15 suítes cobrindo exaustivamente todos os novos sistemas.
- `ui/store.ts`:
  - Adicionadas 16 assinaturas na interface `GameState` e implementadas todas as 16 ações chamando a engine e persistindo o estado.
- `ui/screens/Assentamento.tsx`:
  - Roteamento completo das 10 abas com controles interativos para o trono, quartel, linhagem, vassalos e intrigas.
  - Adicionadas definições de estilo `brasaoBox` e `inputTexto`.

### Verificações e Testes Executados
- `npm run test:reino`: **88/88 asserções aprovadas com 100% de sucesso**.
- `npm run typecheck`: **0 erros (TypeScript Strict Mode 100% limpo)**.
- `npm run test:engine`: **21 suítes unitárias + 6 campanhas de 10 anos (107.250 ações) com 0 violações de invariante em 136.7s**.
- `npx expo export --platform web`: **366 módulos empacotados com sucesso em `dist` sem nenhum erro ou aviso**.

### Próximo passo sugerido
- **Ação Livre 2.0**: expandir o reconhecedor de intenções narrativas em linguagem natural para ordens reais ("nomear fulano chanceler", "promover sargento", "pedir a mão de fulana em casamento", "convocar vassalos às armas").
- **Diretor de Arcos**: alimentar rumores nas tavernas do continente sobre golpes de estado da dinastia, casamentos reais e o nascimento de novos herdeiros ao trono.

---

## Sessão 45 — Gemini — Expansão de Vaelhorn: Relíquias Nobres, Caça a Monstros Witcher, Classe Lutador & Miyamoto Musashi

### Objetivo
Atender ao pedido de expansão massiva focado estritamente no continente e regras de **Vaelhorn**:
1. **Catálogo de Relíquias Hereditárias das Casas Nobres & Armas Divinas/Perdidas**:
   - Relíquias de família passadas de geração em geração pelas casas de Vaelhorn (Halvet, Mareu, Corveira, Tessel, Solgar, Valtorius).
   - Armas divinas/perdidas obtidas de formas lendárias (Lâmina da Origem Solar forjada do primeiro raio de sol estilo Nichirin demon slayer contra onis, Arco do Caçador de Astros, Lança de São Vandro, Adaga do Rei Ladrão).
2. **Classe Lutador (`lutador`)**:
   - Ajuste estrito conforme instrução direta do usuário ("o nome da classe não pode ser mestre marcial nem nada disso, vou começar a classe ela tem que ser um nome mais tranquilo eu ainda não me tornei um mestre para isso").
   - Nome canônico definido como **`Lutador`** (`lutador`), com alias de compatibilidade `CLASSE_MESTRE_MARCIAL`.
   - Combate desarmado com escalonamento de dano marcial baseado em Físico e Precisão (`danoMarcialDesarmado`).
   - Equipamentos marciais: faixas marciais e manoplas quebra-aço.
   - Mecânica de contra-ataque e quebra de lâmina inimiga (`tentativaQuebraDeEspada`): ao ser atacado por espada ou lâmina de ferro, aprisiona o gume com as palmas e estilhaça a arma do oponente, reduzindo o dano adversário para 3 e atordoando-o.
3. **Miyamoto Musashi & Esgrima dos Cinco Anéis (*Gorin no Sho*)**:
   - Mestre Miyamoto Musashi presente no *Passo do Lobo*.
   - Artes da lâmina: `corte_cruzado_niten` (Niten Ichi-ryu com duas lâminas), `postura_do_vazio` (anulação de hesitação) e `mundo_transparente` (*Sukitōru Sekai* / Visão Transparente absoluta estilo Demon Slayer e Musashi, ignorando 100% da armadura do inimigo).
   - Treinamentos: `treinarKatasCincoElementos` e `treinarEsgrimaNiten`.
4. **Quadro de Caça a Monstros (Estilo The Witcher) & Óleos Alquímicos**:
   - Quadro regional de contratos com bestas perigosas (Lobo Alpha de Val-Cinza, Gárgula Abissal de Mir, Oni Carniceiro da Fronteira, Quimera do Sulco).
   - Investigação de pistas preparatórias (rastros, tocas, carcaças).
   - Aplicação de óleos alquímicos nas lâminas (`oleo_anti_besta`, `oleo_anti_necromorfos`, `oleo_de_glicinia_solar`, `oleo_draconico_de_enxofre`).
   - Troféus de caça colhidos das carcaças abatidas que concedem recompensas, prestígio e moedas.
5. **Trabalhos Regionais Especializados & Treinos Imersivos**:
   - Mineração profunda na Fenda de Corveira, estiva portuária nas docas de Mareu, patrulha sentinela na muralha de Tessel e caçada de contratos.
   - Treinos de calejamento da palma de ferro e meditação sob a cascata gélida.

### Arquivos Modificados
- `engine/types.ts`:
  - Tipos `PistaMonstro`, `ContratoMonstro`, `TrofeuMonstro`, `ContratosMonstroCampanha`, `TipoTreinoImersivo`.
  - Campos estendidos em `Item`, `CombatActor` e `Campanha`.
- `content/vaelhorn/items.ts`:
  - 11 relíquias das casas nobres (`espada_ancestral_halvet`, `escudo_halvet`, `tridente_mareu`, `manto_mareu`, `machado_corveira`, `peitoral_corveira`, `espada_tessel`, `elmo_tessel`, `cimitarra_solgar`, `espada_imperial_vaelhorn`, `coroa_espinhos_valtorius`).
  - 4 armas divinas/perdidas (`lamina_da_origem_solar`, `arco_do_cacador_de_astros`, `lanca_de_sao_vandro`, `adaga_do_rei_ladrao`).
  - 3 itens de lutador / combate desarmado (`faixas_marciais`, `manoplas_do_quebra_aco`, `manoplas_vajra_celestial`).
  - 4 óleos alquímicos e 4 troféus de monstros.
- `content/vaelhorn/classes.ts`:
  - Classe `lutador` ("Lutador") registrada com foco inicial humilde e combate corpo a corpo.
- `content/vaelhorn/book.ts`:
  - Mestres `mestre_musashi` e `mestre_bai_long`.
  - Trabalhos `extracao_fenda_corveira`, `estiva_docas_mareu`, `patrulha_muralha_tessel`, `cacada_contrato_witcher`.
  - Artes `palma_de_ferro`, `partir_espada`, `corte_cruzado_niten`, `postura_do_vazio`, `mundo_transparente`.
- `content/vaelhorn/bestiary.ts`:
  - Feras e monstros de contrato: `lobo_alpha_val_cinza`, `gargula_abissal_mir`, `oni_carniceiro_fronteira`, `quimera_do_sulco`.
- `engine/classe.ts`:
  - `CLASSE_LUTADOR = 'lutador'` e alias `CLASSE_MESTRE_MARCIAL`.
  - `ehClasseLutador`, `danoMarcialDesarmado`, `tentativaQuebraDeEspada`, `bonificacaoNitenMusashi`.
- `engine/combat.ts`:
  - Escalonamento desarmado em `danoJogador`.
  - Guard de RNG para `tentativaQuebraDeEspada` (não consome rolagem aleatória se o defensor não puder quebrar armas, preservando o RNG determinístico de testes anteriores).
  - Bônus Niten Musashi e Visão Transparente (100% penetração de armadura).
  - Bônus de óleos alquímicos em combate e resolução de contratos na vitória.
- `engine/contratosMonstros.ts` (NOVO):
  - Sistema de contratos, pistas, óleos alquímicos e inicialização do quadro.
- `engine/treinamentoImersivo.ts` (NOVO):
  - Katas dos 5 elementos, calejamento de palma de ferro, meditação sob cascata e esgrima Niten.
- `engine/acoesMundo.ts`:
  - Ações de mundo para treinos imersivos, contratos de monstros e trabalhos especializados.
- `engine/index.ts`:
  - Exportação dos novos módulos e funções.
- `package.json`:
  - Adicionado script `test:vaelhorn`.
- `engine/vaelhorn_expansao.selftest.ts` (NOVO):
  - Suíte completa de testes da expansão validando relíquias, classe Lutador, quebra de lâmina, Musashi, Niten, contratos Witcher, óleos e treinos.

### Verificações e Testes Executados
- `npm run test:vaelhorn`: **Aprovado com 100% de sucesso**.
- `npm run test:tsukimichi`: **70/70 testes aprovados com 100% de sucesso**.
- `npm run test:reino`: **88/88 testes aprovados com 100% de sucesso**.
- `npm run typecheck`: **0 erros (TypeScript Strict Mode 100% limpo)**.



---

## Sessão 46 — Claude — fechar o trabalho do Gemini, e bandos com capitão Nemesis

### Estado encontrado
Trinta arquivos das sessões 41 a 45 (Gemini) sem commit: forja em Vaelhorn e
Tsukimichi, desmanche/afiação/têmpera, assentamento/feudo/reino com tela e
imagens, soberania feudal, contratos de caça, Lutador e Musashi. Conferido sem
mudar nada: tsc limpo, `test:engine` completo (simLongo sem violação),
`vaelhorn_expansao`, jornadas, casas e `expo export`. Commitado como `7a7e77b`.

Antes disso, o dono pediu opinião sobre uma auditoria externa (NPCs, mundo,
cidades, monstros, ladrões). O diagnóstico batia com o código (5 criaturas de
`ladroes`, segundo monstro em 20% das viagens, teto 5 nas cidades, `casas.ts`
com 23 linhas, Nemesis só de oni; o dia tem 6 períodos, não 4). A ordem
proposta e aceita: 1) bandos + Nemesis humano; 2) estação nos encontros com
bando escalado por nível; 3) especialização de cidades ligada à forja;
4) ecologia só se faltar. Esta sessão fez o item 1.

### O que foi feito — `engine/bandos.ts`
- **Estado** em `camp.bandos` (tipos `Bando`, `CapitaoBando`, `EstadoBandos`
  em `types.ts`), criado sob demanda. Três bandos em regiões diferentes, fora
  do Vale de Halvet, com esconderijo num lugar ermo da região. O sorteio usa
  um RNG próprio derivado da semente: não mexe no RNG principal (testado).
  Só existe em bundle que traga `capitao_bandoleiro` — Tsukimichi não ganha.
- **Dia do bando** (`processarBandos`, chamado em `avancarMundo` depois de
  `processarCasas`): recruta a cada 5 dias (3 se a cidade vizinha passa de 50
  de insegurança), pilha tesouro, com 6+ homens fecha a estrada com pedágio
  (fato público) e sobe a insegurança da cidade. Sem capitão, não recruta e se
  desfaz.
- **Na estrada** (`viajar`): depois da emboscada de rival oni e antes da tabela
  genérica. O tamanho do grupo tem teto pelo nível (`tamanhoDoGrupo`: nível 1
  enfrenta 1; máximo 4). O capitão só aparece em encontro comum contra nível 3+.
  Pedágio: botão "Pagar N moedas" na primeira rodada do combate; o dinheiro
  vai para o tesouro do bando.
- **Capitão Nemesis que perde**: nova criatura `capitao_bandoleiro` (nível 5,
  fora das tabelas). Derrubado, foge ferido com chance que cai a cada queda
  (75%, 45%, 15%; 20% encurralado no esconderijo), ganha cicatriz e alcunha
  pelo tipo de dano do jogador ("o Rosto Aberto", "o Caolho"...), +1 nível e
  vem preparado contra aquele tipo de dano (+2 defesa). Mas cada cicatriz tira
  5 de vida e 1 de acerto/defesa: três cicatrizes e dois níveis a mais ainda o
  deixam mais fraco que no começo (testado). Recuperado com rancor ≥ 3, passa a
  **caçar o jogador** em qualquer estrada (fato público "pergunta por você pelo
  nome"). Rendido, vai preso. Vencer o jogador lhe dá nível e gente.
- **Esconderijo**: vitórias deixam pistas; na segunda (ou ao derrubar o
  capitão) o esconderijo é revelado. Ação de mundo `atacar_esconderijo`
  (botão em Comunidade, quando você está lá): vitória devolve o tesouro e
  desfaz a base.
- **Gancho no combate**: `registrarDesfechoBando` em `encerrar()` (combat.ts),
  logo depois de `registrarConfronto`.
- **Narrador e tela**: `bandosConhecidos`/`descreverBando` vão para o pacote do
  LLM (`bandosConhecidos`) e para a seção "bandos na estrada" em
  `MundoVivo.tsx`. O narrador recebe; a engine decide.

### Arquivos
Novos: `engine/bandos.ts`, `engine/bandos.selftest.ts`.
Alterados: `engine/types.ts`, `engine/combat.ts`, `engine/viagem.ts`,
`engine/mundo.ts`, `engine/acoesMundo.ts`, `engine/llm.ts`, `engine/index.ts`,
`content/vaelhorn/bestiary.ts`, `package.json`, `ui/store.ts`,
`ui/screens/Combate.tsx`, `ui/screens/MundoVivo.tsx`.

### Verificações
- tsc limpo.
- `bandos.selftest.ts`: 40 checagens — nascimento determinístico e sem mexer
  no RNG, crescimento/pedágio/fato, teto de grupo por nível, fuga com cicatriz,
  retorno caçando, cicatriz enfraquece, 20/20 capitães morrem em até oito
  quedas, captura, derrota do jogador, pedágio com e sem dinheiro, esconderijo,
  viagem real (23 encontros de bando em 120 viagens, nunca mais de 1 inimigo
  em nível 1), gancho real em `encerrar()`, save.
- `test:engine` completo, jornadas, casas, vaelhorn_expansao, expo export: ok.

### Problema encontrado (não resolvido aqui)
`simLongo 10 6`: antes 1 morte em 6 campanhas; agora 3. Medido com bandos
desligados por variável temporária: volta exatamente ao 1/6 anterior. Mas
instrumentando as mortes, **nenhuma é de bando** — os três bandos já estavam
destruídos em todas, e a morte vem fora de combate aos 25–28 anos, com
sanidade e corrupção em 100 e condição "mutilado" (a maldição da Marca do
Caçador, sessão 24). Os encontros de bando consomem o RNG principal e mudam a
trajetória, e mais campanhas caem no caminho da Marca. A instrumentação foi
revertida. Vale olhar a Marca: 3 de 6 campanhas morrendo dela aos 25 é muito.

### Próximo passo sugerido
- Medir a Marca do Caçador (quantas campanhas a despertam, e em que idade morrem).
- Item 2 da lista: estação do ano nos encontros e bando de feras escalado por nível.
- Item 3: especialização de cidades (fundição em Corveira vendendo carvão e
  minério aproxima a forja do começo do jogo).

### Plano para a próxima sessão (nuvem)
Depois da sessão 46 o Claude auditou o projeto e escreveu
`docs/PLANO-FABLE-5.1.md`: 9 fases em ordem (Marca do Caçador; famílias entre
NPCs — hoje 0 dos 246 têm pai, mãe, irmão ou cônjuge; histórias e segredos —
130 NPCs sem segredo; casas nobres com membros — hoje nenhum; estações, feras
em bando e caravanas; cidades com identidade e forja ao alcance; Tsukimichi
com 6 NPCs e 0 missões; consequências visíveis e Diretor de Arcos; manutenção
de arquivos gigantes e teste de interface), com protocolo de validação,
critério de pronto e testes de cada fase. O próximo agente deve seguir esse
documento.

---

## Sessão 47 — Claude — Fase 1: a Marca do Caçador

Primeira fase do `docs/PLANO-FABLE-5.1.md`. Trabalho sozinho, na nuvem, na
branch `claude/build-app-apk-nzg5ap`. `npm ci` no começo. Sem
`EXPO_PUBLIC_NOUS_API_KEY` no ambiente: **nada desta fase foi verificado com
narração real**.

Observação de leitura: o plano manda ler `AGENTS.md`; no repositório o arquivo
se chama `agents.md` (minúsculo). É o mesmo documento.

### Estado encontrado (simulação longa antes, `simLongo 10 6`)
```
longa-0    10a  fim_do_prazo nível 33  pop 3892  fome   17d  travas     0  violações 0
longa-1    10a  morte        nível 29  pop 4076  fome   18d  travas     0  violações 0
longa-2    10a  fim_do_prazo nível 29  pop 4542  fome   54d  travas     0  violações 0
longa-3    10a  fim_do_prazo nível 30  pop 4235  fome   17d  travas     0  violações 0
longa-4     7a  morte        nível 34  pop 2794  fome   20d  travas     0  violações 0
longa-5     9a  morte        nível 34  pop 3820  fome    0d  travas     0  violações 0
```
Médias: nível final 31,5; população 3.893; pico de fome 21 dias; despertares
4,17; vitórias 632,8; derrotas 19,5.

### Medição (12 sementes, `longa-0` a `longa-11`, 10 anos)
Script temporário no scratchpad chamando `simularCampanhaLonga`; para isso o
simulador ganhou duas métricas permanentes (`marcaIdade`, `mortePelaMarca`).

- **12 de 12 campanhas despertavam a Marca**, entre 18 e 24 anos (seis delas
  aos 18–19).
- **4 de 12 morriam do tributo**, aos 25, 25, 27 e 28 anos. Nenhuma morte por
  outra causa.
- Na morte: sanidade 88–100, corrupção 100 em todas.

Causas, lidas no código:
1. **Despertar fácil demais.** Bastava vencer qualquer chefe oni com
   respiração — o Oni das Mãos (nível 5, a Seleção Final) contava.
2. **Nenhum aviso.** O despertar dizia só "a Marca se manifesta". O custo não
   aparecia em lugar nenhum da tela nem do pacote do narrador.
3. **Pressão sem teto e no lugar errado.** Cada luta com a Marca somava +2 em
   *todas* as pressões, inclusive corrupção (que no cenário é a mancha do
   pacto e do sangue). Com ~690 combates por campanha, tudo saturava em 100.
   A pressão não matava — mas era o "sanidade e corrupção em 100" que a
   sessão 46 viu.
4. **O dreno de vida era apagado.** `ascensao.ts` escrevia −8 direto em
   `recursosMax.vida`; o primeiro `recalcularRecursosMaximos` (qualquer
   subida de nível) recalculava do zero e o custo sumia.
5. **Nenhuma saída.** A única imunidade era o CHIM, que exige 60 anos.

### O que foi feito
Novo `engine/marca.ts` concentra a regra; os outros arquivos só chamam.

- **Despertar** (`combat.ts`): oni de nível 8+ (`NIVEL_MINIMO_ONI_MARCA`),
  Lua ou chefe, com respiração, e **o jogador com no máximo 35% da vida no
  fim da luta**. Nível 10+ foi testado primeiro e descartado com números: 0
  de 12 campanhas despertavam, porque o simulador nunca vence Lua Superior em
  dez anos (vence ~3 chefes por campanha, todos de nível ≤9). A Marca teria
  sumido do jogo.
- **Aviso** (`despertarMarca`): marco com a idade-limite, fato
  `marca_despertou`, linha `sistema` na crônica e no log do combate dizendo o
  custo, a idade e que a Casa Sem Nome na Névoa sabe conter a chama. O painel
  Progressão mostra o card "O preço da Marca" enquanto valer; o pacote do
  narrador ganhou `marca` com o mesmo texto (o narrador sente, não decide).
- **Prazo**: limite = 25, ou três anos depois do despertar, o que vier mais
  tarde. Quem desperta aos 24 tem até os 27. Saves de antes desta sessão
  (Marca sem estado) ganham o prazo contado do carregamento — a migração
  (`normalizarCampanha`) e o aniversário materializam o estado.
- **Tributo** (`cobrarTributoAnual`, chamado por `ascensao.ts`): a partir do
  limite, −8 de vida máxima por ano, **guardado em `camp.marca.vidaPerdida` e
  descontado em `vidaMaxima`** (subir de nível não apaga mais), e a chance de
  morte de antes (10% no primeiro ano, +5% ao ano, teto 40%). A chance não
  mudou de propósito: o preço canônico continua alto.
- **Pressão**: só sanidade, +2 por luta, e a Marca sozinha não passa de 60.
  Corrupção não é mais tocada.
- **Saída cara** (`conter_marca`, ação de mundo; botão em Progressão quando se
  está na Casa): exige estar na Casa Sem Nome na Névoa (lugar oculto, pede
  reputação 8 com os caçadores para ser descoberto), alguém vivo entre os 17
  moradores escritos da Casa, sanidade ≤40 e vida cheia. Custa 14 dias de
  reclusão, 12 de vida máxima para sempre, os bônus táticos (+3 acerto, +2
  defesa) e o legado cai de vida ×1,25 / dano ×1,4 para ×1,1 / ×1,15
  (`MARCA_CONTIDA` em `identidade.ts`). Em troca, o tributo para. É a porta
  "Yoriichi" que o dono decidiu na sessão 23.

### Decisões e motivos
- *Nível 8+ e não 10+*: medido (acima). Conservador em relação ao cânone e ao
  código: mantém a Marca rara e alcançável.
- *Beira da morte em 35%*: o simulador cura abaixo de 40% e foge abaixo de 25%;
  35% cai na janela de "luta que quase deu errado" sem precisar mudar o bot.
- *Chance de morte mantida*: o plano pede aviso e saída, não Marca barata. O
  que muda o número é o despertar ser raro e o prazo mínimo.
- *Prazo de três anos*: menor que isso o aviso não dá tempo de chegar à Casa
  (lugar oculto); maior esvazia o cânone dos 25.
- *Corrupção fora da Marca*: a descrição da pressão no cenário é "a mancha que
  o pacto e o sangue deixam". A Marca não é pacto.
- *Teste antigo*: `despertar.selftest.ts` §8 despertava aos 24 e esperava
  dreno aos 25; pela regra nova o limite seria 27. O teste agora desperta aos
  22 (limite 25) e prova também que antes do limite nada é drenado. Nada foi
  apagado.

### Arquivos
Novos: `engine/marca.ts`, `engine/marca.selftest.ts`.
Alterados: `engine/types.ts` (`EstadoMarca`, `camp.marca`), `engine/combat.ts`,
`engine/ascensao.ts`, `engine/identidade.ts`, `engine/progresso.ts`,
`engine/acoesMundo.ts`, `engine/migracao.ts`, `engine/llm.ts`,
`engine/index.ts`, `engine/campanhaLonga.ts` e `engine/simLongo.ts` (métricas
da Marca; a linha da tabela mostra "marca aos N" quando despertou),
`engine/despertar.selftest.ts`, `ui/screens/Progressao.tsx`, `package.json`.

### Verificações
- `marca.selftest.ts` (no `test:engine`): 47 checagens — aviso no marco, fato e
  feed; prazo mínimo; despertar exige nível 8+, respiração e beira da morte
  (Kaigaku com vida cheia não desperta; Oni das Mãos e Lua Inferior Cinco nunca;
  sem respiração nunca); 500 lutas deixam sanidade em 60 e corrupção em 0,
  também numa luta real; antes do limite nada é cobrado nem aos 25; o dreno
  sobrevive a subir de nível; primeiro ano além do limite mata 33 de 300
  (~10%); morte só depois do aviso; 60 de 60 personagens sem Marca chegam
  vivos aos 45; conter recusa fora da Casa, com sanidade alta e com a Casa sem
  vivos, custa 14 dias e 12 de vida, derruba o dano de ×1,4 para ×1,15, tira o
  bônus tático, não repete, e a contida chega aos 60 sem tributo; save antigo
  ganha o prazo; export/import devolve o estado idêntico.
- Medição depois, 12 sementes: **2 de 12 despertam (aos 18 e aos 24), 0 de 12
  morrem da Marca**, 0 violações. A que despertou aos 18 pagou o dreno dos 25
  aos 28 e chegou viva ao fim.
- `typecheck`, `test:engine` completo, `test:jornadas`, `test:casas`,
  `vaelhorn_expansao`, `expo export --platform web`: verdes.

Simulação longa depois (`simLongo 10 6`, dentro do `test:engine`):
```
longa-0    10a  fim_do_prazo nível 32  pop 3642  fome    0d  travas     0  violações 0
longa-1    10a  fim_do_prazo nível 29  pop 4432  fome    0d  travas     0  violações 0
longa-2    10a  fim_do_prazo nível 29  pop 4498  fome    0d  travas     0  violações 0  marca aos 18
longa-3    10a  fim_do_prazo nível 29  pop 3609  fome    0d  travas     0  violações 0
longa-4    10a  fim_do_prazo nível 29  pop 3410  fome   29d  travas     0  violações 0
longa-5    10a  fim_do_prazo nível 30  pop 4311  fome    6d  travas     0  violações 0
```
Comparação com o antes: mortes 3 → 0; anos médios 9,3 → 10; nível final
31,5 → 29,7 (esperado: cada Despertar vale +3 níveis e a Marca agora desperta
em 1 de 6, não em 6 de 6; despertares 4,17 → 3); população 3.893 → 3.984;
pico de fome 21 → 6 dias; dias-cidade em fome 2.070 → 2.501 (≈ +12% por ano
vivido, e as campanhas agora vivem os 10 anos inteiros); derrotas 19,5 →
16,2; vitórias 632,8 → 672,3 (mais tempo vivo). Nenhuma mudança fora do que
a Marca explica; não investiguei mais a fome porque o pico caiu e o total
acompanha a duração.

### Problemas encontrados e não resolvidos
- A pressão (sanidade/corrupção) ainda não tem nenhum decaimento natural no
  jogo; só `meditarSobCascata` baixa (−15 em todas). Fora do escopo desta
  fase; a Marca deixou de ser a fonte da saturação.
- `meditarSobCascata` dá +1 de resiliência por uso, sem teto nem custo além
  do tempo. Parece farmável; não mexi (não é desta fase).
- Não verificado com IA real (sem chave no ambiente).

### Próximo passo
Fase 2 do plano: famílias entre NPCs.

---

## Sessão 48 — Claude — Fase 2: famílias entre NPCs

### Estado encontrado
Nenhum NPC do elenco tinha mãe, filha, irmã ou cônjuge. O campo `parentesco`
do NPC existe, mas é da **família do jogador** (`familia.ts`; a tela Vínculos
filtra "Família" por ele), então não serve para gente do elenco com gente do
elenco. 186 dos 246 NPCs vêm do povoamento procedural, com índole e voz de
lista, e o elenco inteiro é feminino por regra de mundo (a Leva; `selftest.ts`
reprova ofício no masculino), exceto os caçadores importados de Kimetsu.

Simulação longa antes: a mesma tabela do "depois" da sessão 47.

### Decisões
- **Parentesco como arquivo de famílias, não como campo no NPC.**
  `content/vaelhorn/familias.ts` declara cada família (nome, sede, tensão,
  membros com papel, laços, ausentes) e a engine deduz o resto. Motivo: 186 NPCs
  são gerados por `povoamento.ts`; pôr um campo neles exigiria mexer no
  gerador. O id deles é estável pelo lugar (`morador_<local>_<n>`), então a
  família referencia o id como se fosse escrita à mão. Também evita tipo novo
  em `LacoTipo`, que o convívio lê com `ENCONTROS[laco.tipo]`.
- **Laços escritos**: `mae`, `pai`, `avo`, `tia` (dirigidos) e `irmas`,
  `conjuges`, `primas`. **Deduzidos**: irmã por mãe em comum, avó pela mãe da
  mãe, tia pela irmã da mãe, prima pela filha da tia. O gênero é feminino por
  padrão; os homens (Tanjiro, Sanemi, Genya, Shinjuro, Kyojuro, Kagaya, Ivo
  Quelha) são marcados.
- **Nenhum NPC novo.** Os membros que faltavam são homens, e a premissa diz
  que eles não estão no vale: foram à ponte, morreram no desabamento, vieram de
  fora e não ficaram. Eles entram em `ausentes` (texto para o narrador), não no
  elenco. Isso respeita a trava do selftest e a premissa.
- **Luto por passe diário** (`processarFamiliasNpc`, chamado em `avancarMundo`
  depois de `processarMundoVivo`), não por gancho em cada morte. Há oito
  caminhos de morte de NPC e nenhum recebe `content`; o duelo de fundo nem
  chamava `registrarMorteFamiliar`. O passe pega todos. Save antigo: quem já
  estava morto quando o estado nasce conta como pranteado, sem fato novo.
- **Luto não vai para `memoria` do NPC**, porque o narrador lê essa memória
  como "o que ela lembra de você". Fica em `camp.familiasNpc.lutos` e vai para
  o narrador como campo próprio.
- **Segredo não entra no texto da família.** A tensão é o que a vizinhança
  conta. Revisei cada papel contra o segredo do NPC e reescrevi os que
  vazavam (ferro desviado de Vana, o laudo comprado da casa Verrão, a noite do
  farol das Quilm, a irmã de Sanemi — que no segredo deste jogo é a irmã, não
  a mãe do cânone). O selftest varre o texto procurando trecho de segredo.

### O que a engine faz com o parentesco (`engine/familiasNpc.ts`)
- **Luto**: parente próximo (mãe, filha, irmã, companheira) +20 de tensão e
  −2 de disposição; distante +8. Registro do luto por pessoa. Fato público
  `luto_familia` com o nome da família ("Luto entre as da Bigorna: Duna
  morreu, e Torana, Elna o Torto ficaram.").
- **Herança de ofício**: morta a mãe, a filha (ou neta) mais velha, adulta e
  do mesmo lugar, assume o ofício — `ocupacaoEfetiva` passa a valer no
  narrador, na ficha e na **forja** (a filha de uma armeira morta passa a
  emprestar a bigorna). O dinheiro e a casa do estado civil (`autonomia.ts`)
  vão junto. Aos 75 anos a pessoa passa o ofício em vida. Fato
  `heranca_oficio`.
- **O jogador**: todo efeito de relação de um verbo chega à família com 35%
  (próximos) ou 15% (distantes), arredondado; resgate concluído
  (`missao_concluida` com a pessoa como ator) dá +6 à família pelo mesmo peso.
  Matar NPC não tem caminho no jogo hoje (não há combate contra NPC do
  elenco), então não há gancho para isso.
- **Uniões**: `autonomia.ts` não junta parentes em casa comum.
- **Narrador**: cada presente ganha `familia` (nome, tensão, até três
  parentes — os presentes primeiro — e luto dos últimos 60 dias). A
  `ocupacao` do pacote passa a ser a efetiva.
- **Tela**: a ficha em Vínculos mostra "Família · <nome>", os parentes que o
  jogador já conhece, e o luto.

### Números
43 famílias, **112 NPCs com parentesco** (104 com parente próximo), nas 9
regiões. Maiores: as Bico-Fino e as Meia-Orelha (6 cada, três gerações,
espalhadas por três e quatro regiões), as Verrão e as Pé-de-Ferro (4).
Canônicas de Kimetsu: Kamado, Kocho, Shinazugawa, Rengoku, Ubuyashiki.

### Três famílias com tensão
- **As da Bigorna** (mercado do vale): Ilde Bigorna morreu sem dizer qual
  filha herdava a forja. Torana e Duna — que já eram `rival` no conteúdo,
  "duas bigornas na mesma praça" — dividiram a praça ao meio. A filha de
  Duna leva ferro escondido para a tia experimentar.
- **As Varn** (Tessel): Odile e Ketta são gêmeas. A marca foi para a que
  nasceu primeiro, e só o livro do registro diz qual — e quem cuida do livro
  é Ketta, a escrivã que já `desconfia` e guarda prova sobre a herança do
  posto. A filha de Odile, pregoeira aos 19, anuncia os editos da mãe como
  quem ensaia os seus.
- **As Meia-Orelha** (Mareu → Mercado do Peixe → Corveira): Sela perdeu meia
  orelha para a lei por roubo e a cidade deu o apelido às filhas. Uma virou
  pregoeira do registro que leu a sentença da mãe; outra foi à guerra para
  perder o nome e voltou com ele; a neta, em Corveira, carrega um apelido que
  lá virou xingamento de ladra. Sela, aos 64, continua batendo carteira.

### Arquivos
Novos: `content/vaelhorn/familias.ts`, `engine/familiasNpc.ts`,
`engine/familiasNpc.selftest.ts`.
Alterados: `engine/types.ts` (`FamiliaNpc`, `EstadoFamiliasNpc`,
`camp.familiasNpc`, `content.familias`), `content/vaelhorn/index.ts`,
`engine/mundo.ts`, `engine/turn.ts`, `engine/autonomia.ts`, `engine/llm.ts`,
`engine/forja.ts`, `engine/index.ts`, `ui/screens/Paineis.tsx`,
`package.json`.

### Verificações
- `familiasNpc.selftest.ts` (no `test:engine`): 655 checagens. Sobre o elenco
  inteiro: 43 famílias e 112 pessoas, todas as regiões, todo id existe, todo
  laço é entre membros, simetria dos 212 laços deduzidos, mãe/pai 15+ anos mais
  velhos e avó 30+, ninguém parente de si mesmo, nenhum ciclo de descendência,
  Nezuko (oni) com justificativa escrita e parentesco não-humano como exceção,
  nenhum papel ou tensão repetido, nenhum trecho de segredo no texto.
  Engine: luto (tensão, fato com nome da família, registro, sem duplicar, pelo
  caminho real de `avancarMundo`), save antigo sem luto retroativo, herança
  (Elza vira taverneira; a filha de Nevin herda a bigorna; Mora Quelha larga o
  posto aos 75 e a neta assume), propagação (direta, pelo verbo `conversar` real
  e pelo resgate, sem contar duas vezes), pacote do narrador com família e sem
  segredo, export/import idêntico.
- `typecheck`, `test:engine` completo, `test:jornadas`, `test:casas`,
  `vaelhorn_expansao`, `tsukimichi`, `expo export --platform web`: verdes.

Simulação longa depois: **idêntica** à de antes linha por linha (o sistema
não consome RNG). Única diferença no resumo: tipos de fato 19,3 → 20,8 — luto
e herança aparecem nas campanhas.

### O que ficou faltando
- Os 186 moradores procedurais continuam com índole e voz de lista; a família
  dá a eles papel e tensão, mas o texto-base é o mesmo. A Fase 3 (histórias)
  é onde isso melhora.
- Alguns moradores têm incoerência de origem que não mexi (a "anciã" de 22
  anos em Juncal, a de 39 na Aldeia do Ferro): os papéis explicam o apelido em
  vez de mudar o gerador, que renomearia o elenco inteiro.
- Não verificado com IA real (sem chave no ambiente).

### Próximo passo
Fase 3: histórias e segredos dos NPCs.

---

## Sessão 49 — Claude — Fase 3: histórias e segredos do elenco

### Estado encontrado
130 dos 246 NPCs sem segredo, nenhum com história escrita. A regra de
descoberta de segredo morava na interface (`talvezRevelarSegredo` em
`ui/store.ts`: confiança ≥ 12 ou ter vigiado) e descobrir não mudava nada
além de uma flag e um marco. Dez segredos do povoamento eram **o mesmo texto**
em pessoas de cidades diferentes ("Mentiu no depoimento da época. O
desabamento..."). O segredo de Shinobu dizia que ela *perdeu* a irmã mais
velha, e Kanae está viva no elenco.

Simulação longa antes: a tabela da sessão 48.

### O que foi feito
- **`engine/segredos.ts`** (novo): `revelarSegredo` (lista, flag, marco e
  consequência, uma vez só), `talvezRevelarSegredo` (a regra que saiu da
  interface, mesma condição) e `aplicarConsequenciaDeSegredo`. O
  `ui/store.ts` passa a chamar a engine. A simulação não revela segredos (não
  revelava antes), então a campanha simulada não muda.
- **Consequência declarada no conteúdo** (`ConsequenciaSegredo` em
  `types.ts`): texto para o jogador, efeitos da engine e, opcional, missão
  viva. Só `tratar`, `abastecer` e `reconstruir`: medi que `investigar` exige
  rival Kimetsu e `resgatar` exige cativo — sem isso a missão nunca fecha. A
  missão nasce no assentamento da pessoa. Efeito de relação também chega à
  família dela (Fase 2).
- **Duas flags ligadas a mecânica existente** em vez de decorativas: o
  caminho de Orla (Juncal) grava `descoberto.toca_juncal`, que é a flag do
  lugar oculto que já existia — a Toca do Juncal aparece no mapa; saber a
  hora do Passo do Lobo (Sela o Surdo, Vintra) baixa 2 do perigo das rotas
  do passo (`perigoEfetivoDaRota`).
- **Conteúdo**, em arquivos à parte e aplicado por cima do elenco em
  `content/vaelhorn/index.ts` (`enriquecerElenco`), sem mexer no gerador do
  povoamento:
  - `segredos.ts`: 130 segredos novos, 10 reescritos (os repetidos; um de cada
    grupo ficou com o texto original), 36 consequências (23 em segredos novos
    ou reescritos, 13 em segredos que já existiam — Bael e a ponte, o
    livro-caixa de Teoda, o relatório costurado de Sibel, a caixa de Quim, a
    lista de Brila...).
  - `historias-vale.ts`, `historias-continente.ts`, `historias-costa.ts`,
    `historias-kimetsu.ts`: **172 histórias** (origem, ferida, desejo, medo),
    todas as 79 pessoas que lutam, ensinam, duelam ou aparecem em missão, e o
    resto amarrado às famílias da Fase 2. Irmãs contam a mesma perda de lados
    diferentes de propósito (Torana e Duna sobre a forja da mãe; as filhas
    Verrão sobre o desabamento; Sanemi e Genya).
  - Segredo de Shinobu corrigido em `npcs.ts`: "quase perdeu" a irmã, e foi o
    veneno que a trouxe de volta (bate com o segredo novo de Kanae).
- **Narrador**: cada presente leva `historia`; regra nova 2b no sistema
  ("aluda, nunca recite; o jogador só sabe o segredo que está em
  segredoQueVoceSabe"). `INSTRUCAO_SISTEMA` passou a ser exportada para o
  teste conferir a regra.

### Decisões e cuidado com vazamento
Revisei cada história contra o segredo da própria pessoa e das outras, à
mão, porque o teste automático só pega cópia literal. Reescrevi uns 40
campos que entregavam segredo com outras palavras (Heska e o açude, Kesta e o
braço, Pia lendo recados, Hotaru e o aprendiz, Perin e o muro, a dívida de
Roan a Velha com o crime — que também vazava na tensão da família das do
Porto do Sal e foi corrigida lá). A varredura de nomes do teste pegou um erro
meu: escrevi "Aldeia do Ferro", e o lugar se chama Ferro Velho.

Linha do tempo de Corveira: o desabamento foi há 12 anos (Sibel assinou o
laudo aos 32 e tem 44). As idades nas histórias das Verrão, de Jarek e do
Sexto seguem isso.

### Arquivos
Novos: `engine/segredos.ts`, `engine/historiasNpc.selftest.ts`,
`content/vaelhorn/segredos.ts`, `content/vaelhorn/historias-vale.ts`,
`content/vaelhorn/historias-continente.ts`, `content/vaelhorn/historias-costa.ts`,
`content/vaelhorn/historias-kimetsu.ts`.
Alterados: `engine/types.ts` (`HistoriaNpc`, `ConsequenciaSegredo`,
`NPC.historia`), `engine/llm.ts`, `engine/viagem.ts`, `engine/index.ts`,
`content/vaelhorn/index.ts`, `content/vaelhorn/npcs.ts` (Shinobu),
`content/vaelhorn/familias.ts` (uma tensão), `ui/store.ts`, `package.json`.

### Verificações
- `historiasNpc.selftest.ts` (no `test:engine`): 0 NPCs sem segredo (246);
  segredos sem repetição; 36 consequências com gente, item e facção que
  existem; 172 histórias; os 73 prioritários que o bundle cita por id têm
  história; três campos de 40+ caracteres, sem texto genérico nem repetido;
  nenhuma história copia trecho de segredo de ninguém; nenhuma cita nome que
  não existe (varre nome próprio contra elenco, lugares, regiões, facções,
  criaturas e ausentes das famílias). Engine: o recibo de Ivo entra no
  inventário e Brila passa a ter medo, uma vez só, e o save lembra; a farinha
  de Pedravel abre missão de tratar; o Passo do Lobo fica menos perigoso
  (7,3 → 5,3); a Toca do Juncal aparece; saber da ponte faz Ruvela (e a mãe,
  Nadja) confiar em você; chantagem recusada antes e liberada depois; a regra
  de descoberta (confiança 12, vigiar); pacote do narrador com história, sem
  segredo antes e com segredo depois; regra 2b no sistema.
- `familiasNpc.selftest.ts` continua verde com os textos novos.
- `typecheck`, `test:engine` completo, `test:jornadas`, `test:casas`,
  `vaelhorn_expansao`, `tsukimichi`, `expo export --platform web`: verdes.

Simulação longa depois: **idêntica** à de antes, linha por linha (a
simulação não revela segredos; histórias só vão ao narrador).

### O que ficou faltando
- Os moradores procedurais continuam com índole e voz de lista (a Fase 3
  deu a 110 deles história e segredo próprios, não mexeu no gerador).
- O Vale de Halvet tem as 41 histórias; das 246 pessoas, 74 ainda sem
  história — quase todas moradores de cidade sem família nem papel em missão.
- As consequências são aplicadas na descoberta; a UI mostra o texto no feed
  pela crônica, mas não há painel próprio "o que mudou". Fica para a Fase 8
  (consequências visíveis).
- Não verificado com IA real (sem chave no ambiente).

### Próximo passo
Fase 4: casas nobres com gente dentro.

---

## Sessão 50 — Claude — Fase 4: casas nobres com gente dentro

### Estado encontrado
`content/vaelhorn/casas.ts`: 4 casas com lema, sede, sucessão e rivalidade,
nenhum membro. `engine/casas.ts` (23 linhas) escolhia como "líder" o primeiro
NPC listado na sede — em Mareu, a ferreira naval; em Tessel, a herdeira seria
a sargenta do portão. A sucessão declarada (primogenitura, eleição, duelo)
não era usada.

Simulação longa antes: a tabela da sessão 49.

### O que foi feito
- **Membros escritos** (`CasaNobre.membros`: chefe, herdeiras em ordem,
  colaterais, servidoras, campeã; `CasaNobre.familia` aponta para a família da
  Fase 2):
  - Halvet (primogenitura): Dama Valda, Ysolde, Ilse, Maelis, Teoda.
  - Tessel (eleição): as Varn — Odile, Dorn, Ketta; a capitã Roan e a campeã
    Bela.
  - Corveira (duelo): as Verrão — Halda, Pell, Wyn, Irmã Velun; a campeã Veski
    e a cocheira Eda o Torto.
  - Mareu (eleição): as Olho-Vivo — Ansel, Mirel, Vidar, Davet; Maud (guilda) e
    Calder (a senhora da cidade que assina). Decisão: a casa de Mareu é a guilda
    do sal, e a guilda nasceu no galpão das Olho-Vivo (história do Mercado do
    Peixe), então a família da casa são elas, e não a senhora da cidade.
- **3 NPCs novos** em `content/vaelhorn/casas-membros.ts`, com todos os campos,
  história, segredo e consequência: Maelis de Halvet (prima que vive de favor e
  guarda uma carta que muda a linha), Ilse de Halvet (a filha dela, segunda na
  linha, que quer sair dela), Mirel Olho-Vivo (a herdeira que quer quebrar a
  guilda perdoando as dívidas de Rede Rota). Entraram nas famílias.
- **Sucessão pela regra** (`escolherSucessora`): primogenitura segue a linha;
  eleição escolhe pela linha e pela tensão (quem está em guerra com o mundo
  perde); duelo põe as duas primeiras para lutar com RNG derivado (não mexe no
  RNG principal) e a campeã lutando pela primeira da linha. Fato público.
- **Casas agem** (`processarCasas`), sobre a comunidade da sede
  (`cidadeDaCasa`: a Casa de Pedra de Halvet cuida da Praça):
  - obra: reconstrução se a integridade está abaixo de 60; se há obra no
    canteiro, paga braços (+30% de progresso); senão ergue o que a própria
    cidade ergueria (lavoura primeiro);
  - celeiro: com fome na cidade, compra grão com o tesouro (+70 de comida);
  - patrulha: bando ativo na região perde 2 homens (fato com o nome do bando;
    `encerrarBando` agora exportado de `bandos.ts`);
  - missão: patrocina a missão de crise da cidade (a mesma, nunca uma segunda),
    paga +25 e põe a chefe como quem pede;
  - casamento político entre rivais fracas (+12 de legitimidade cada) e trama
    da colateral quando a legitimidade cai abaixo de 30.
- **Jogador**: cumprir missão em que um membro é o ator sobe a reputação com a
  casa, e a reputação chega à disposição de todos os membros (servidoras com
  peso menor). `descreverCasa` vai para a tela (seção "casas nobres" em
  Comunidade) e para o narrador (`casasPresentes[].hoje`).
- Simulador ganhou `obrasDeCasa` e `patrulhasDeCasa`.

### Problema encontrado e corrigido no caminho (medido)
A primeira versão piorou a simulação: pico de fome de 6 para 43 dias,
população −7%, derrotas 16 → 30. Desliguei as ações das casas por variável
temporária e comparei 8 sementes: sem as ações, fome e população voltavam ao
patamar anterior. Três causas, todas corrigidas:
1. A obra escolhia mercado antes de lavoura e ocupava o único canteiro da
   cidade, que priorizaria comida.
2. A missão patrocinada duplicava a missão de crise da cidade; cada missão
   que expira sobe a insegurança em 8.
3. A casa de Halvet nunca agia: a sede não é cidade. A Praça terminou uma
   campanha com integridade 0 e 261 dias de fome.
A instrumentação foi removida. Uma armadilha que **já existia** ficou visível:
comunidade com integridade muito baixa e todos os edifícios no nível 5 não tem
obra para fazer e produz 15% do normal. A reconstrução paga pela casa é o que
tira as sedes dela; fora das sedes, continua.

Comparação final, 8 sementes (`longa-0` a `longa-7`), com e sem as ações das
casas (mesmo conteúdo): derrotas 19,0 contra 22,0; fome no fim da campanha
4,2 contra 8,9; dias-cidade em fome 2.724 contra 2.510 (+8,6%); população
3.830 contra 3.973 (−3,6%); obras de casa 13,1 e patrulhas 9,6 por campanha.
A dispersão entre sementes é maior que as diferenças (dias de fome vão de
1.713 a 3.893 na mesma configuração), então não atribuo a diferença média às
casas; registro para a próxima sessão acompanhar.

### Arquivos
Novos: `content/vaelhorn/casas-membros.ts`.
Alterados: `content/vaelhorn/casas.ts` (membros, família), `engine/casas.ts`,
`engine/casas.selftest.ts`, `engine/bandos.ts` (`encerrarBando` exportada),
`engine/llm.ts`, `engine/campanhaLonga.ts`, `engine/index.ts`,
`content/vaelhorn/index.ts`, `content/vaelhorn/familias.ts`,
`content/vaelhorn/historias-continente.ts` e `historias-costa.ts` (Eda o Torto,
Calder e Maud, que viraram membros de casa), `ui/screens/MundoVivo.tsx`.

### Verificações
- `casas.selftest.ts` (`test:casas`): membros existem, 5+ por casa, chefe e
  herdeira, família certa; chefe escrita no lugar do "primeiro da sede";
  primogenitura (Valda → Ysolde → Ilse, não Maelis); eleição (filha em
  conflito perde para a gêmea; calma, vence); duelo (determinístico, a primeira
  com a campeã vence 28 de 40); obra (não no primeiro dia, não sem tesouro,
  sim com tesouro; canteiro ocupado acelera em vez de trocar; fome leva a
  lavoura); Halvet reconstrói a Praça e abre o celeiro; patrulha (−2 do bando,
  fato com nome, não sem tesouro); missão patrocinada sem duplicar, celeiro,
  reputação que chega à herdeira e à servidora; casamento político; trama
  (8 de 30); save.
- `typecheck`, `test:engine` completo, `test:jornadas`, `vaelhorn_expansao`,
  `tsukimichi`, `expo export --platform web`: verdes.

Simulação longa depois (`simLongo 10 6`):
```
longa-0    10a  fim_do_prazo nível 31  pop 3818  fome   21d  travas     0  violações 0
longa-1    10a  fim_do_prazo nível 33  pop 4167  fome    0d  travas     0  violações 0  marca aos 23
longa-2    10a  fim_do_prazo nível 32  pop 3615  fome    0d  travas     0  violações 0
longa-3    10a  fim_do_prazo nível 29  pop 3934  fome    0d  travas     0  violações 0
longa-4    10a  fim_do_prazo nível 29  pop 3451  fome    0d  travas     0  violações 0
longa-5    10a  fim_do_prazo nível 34  pop 4210  fome   13d  travas     0  violações 0  marca aos 18
```
Médias: nível 31,3; população 3.866; fome no fim 6; dias-cidade em fome
2.621; derrotas 19,8; obras de casa 13,2 e patrulhas 10,8 por campanha.

### Próximo passo
Fase 5 (estações, feras em bando, caravanas). O dono pediu nesta sessão para
focar só em Vaelhorn: a Fase 7 (NPCs de Tsukimichi) fica de fora por enquanto.
