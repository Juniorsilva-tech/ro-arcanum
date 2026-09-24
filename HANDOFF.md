# HANDOFF — RO ARCANUM

## Agente atual
Gemini

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

- **`HANDOFF.md` (este arquivo)** — estado atual, sessões recentes (39 em
  diante), problemas abertos e próximo passo. É o que se lê antes de trabalhar.
- **`HANDOFF-ARQUIVO.md`** — sessões 1 a 38, na íntegra e sem edição. Consultar
  quando for preciso saber *por que* alguma decisão antiga foi tomada. As
  sessões 13 a 23 foram movidas na sessão 40, 24 a 27 na sessão 42, 28 a 31 na sessão 43, e 32 a 38 na sessão 44.

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

---

## Sessão 39 — Gemini — Combate com Bestas Lendárias, Subjugação Canônica (Contrato de Alma 2:8) e Sistema de Romance em Asora

### Objetivo
1. **Combate de Arena com Bestas Primordiais**:
   - As opções na Wasteland (`pacto_shen` no Desfiladeiro, `pacto_aranha` no Pântano, `pacto_suzaku` no Ninho da Fênix) agora iniciam o combate tático de arena contra as feras colossais ao invés de selar o contrato passivamente.
2. **Submissão por Deslumbramento & Contrato de Alma 2:8**:
   - As criaturas de `ENTIDADES_CONTRATAVEIS` não morrem como monstros genéricos com carcaça e loot comum ao chegarem a 0 HP:
     - Elas caem de joelhos subjugadas perante o oceano infinito de mana do Mestre.
     - As ilusões espaciais e reforços invocados por Shen dissolvem-se de imediato.
     - O combate encerra em vitória especial e dispara automaticamente o **Contrato de Alma (2:8)** (`realizarContratoAlma`), transmutando a besta em forma humana feminina elegante (Tomoe, Mio, Suzaku), concedendo os bônus espirituais permanentes aos atributos e abrindo o subespaço de Asora no 1º contrato.
     - Marcado `subjugou` e `contrato` sem marcar `matou`.
3. **Sistema de Romance, Intimidade & Ciúmes Dinâmicos em Asora**:
   - Implementada a função `executarMomentoRomanceServa(camp, servaId, tipoAtividade)` em `engine/tsukimichi.ts`:
     - *Termas & Banquete com Mio* (`termas_mio`): Afeto +15%, ciúme de Mio -15%, ciúme das demais servas +15%.
     - *Sake & Noite de Bushido com Tomoe* (`sake_tomoe`): Afeto +15%, ciúme de Tomoe -15%, ciúme das demais servas +15%.
     - *Voo Celestial com Suzaku* (`chamas_suzaku`): Afeto +15%, ciúme de Suzaku -15%, ciúme das demais servas +15%.
     - *Passeio Romântico na Vila de Asora* (`passeio_vila`): afeto e confraternização com o harém.
     - Recupera 50 Vida, 40 Vigor e 40 Mana pelo descanso e intimidade.
   - Opções integradas em `engine/narration.ts` e resolvidas nativamente em `engine/turn.ts`.

### Arquivos Modificados
- `engine/combat.ts`:
  - `resolverAtaque`: texto de subjugação e dissolução de ilusões/reforços ao derrotar besta primordial.
  - `jogadorAtaca`: suporte a buscar alvo tanto por id de combatente quanto por `criaturaId`.
  - `encerrar`: chamada automática de `realizarContratoAlma(camp, c.id, '2:8')` e log canônico de transmutação e abertura de Asora para entidades contratáveis.
- `engine/tsukimichi.ts`:
  - Implementada `executarMomentoRomanceServa`.
- `engine/narration.ts`:
  - Opções de combate de arena com as feras primordiais no Desfiladeiro, Pântano e Ninho.
  - Opções dedicadas de romance e intimidade quando o jogador estiver em locais de Asora (`asora_`).
- `engine/turn.ts`:
  - Resolução nativa de `pacto_shen`, `pacto_aranha`, `pacto_suzaku` acionando `iniciarCombate`.
  - Resolução nativa das atividades de romance via `executarMomentoRomanceServa`.
- `engine/tsukimichi.selftest.ts`:
  - Atualizado teste de combate e subjugação de Shen e Mio na Wasteland.
  - Novos testes automatizados para evolução de afeto, ciúmes cruzados, recuperação de recursos e opções de cena em Asora (70/70 testes aprovados).

### Verificações e Testes Executados
- `npm run typecheck`: 0 erros (TypeScript estrito).
- `npm run test:tsukimichi`: 70/70 testes aprovados com sucesso.
- `npm run test:engine`: 20 suítes unitárias + 6 campanhas de 10 anos sem quebras de invariantes (210s).
- `npm run test:jornadas` & `npm run test:casas`: 100% aprovados.
- `npx expo export --platform web`: 351 módulos empacotados com sucesso em `dist`.



---

## Sessão 40 — Claude — DLC na interface, e a forja — plano antes das alterações

(Aberta como "29" por engano: o Gemini já tinha registrado as sessões 29 a 39
acima. Renumerada para 40 na mesma sessão.)

### Estado encontrado
40 arquivos das sessões 24–28 (Gemini) sem commit desde 20/09, com 11 erros de
typecheck em `engine/tsukimichi.selftest.ts` (acesso a `camp.asora` opcional).
Corrigido com `camp.asora!` e commitado à parte (`0f8aaef`) depois de tsc,
test:engine, tsukimichi, jornadas e casas verdes.

A DLC Tsukimichi estava registrada mas era inalcançável: `novoJogo()` fixava
`cenarioId: 'vaelhorn'` e pulava a tela de mundo. Corrigido em `67e845e`,
verificado no navegador.

Corrigindo registro meu: na resposta à auditoria externa eu apontei
`meditar_cratera_wasteland` (`vida += 20`) como bug de teto. Não é —
`clampRecursos(p)` roda no fim de `resolverIntencao`. Testado: 220/220.

### Objetivo: forja composicional
A auditoria externa (e a medição) confirmam: item é catálogo fechado e o jogador
não cria nada além de artes por fusão. Havia base parada: ~20 materiais sem
uso, carvão descrito como combustível de forja, artes de ofício, ferreiras no
elenco.

Regra: **molde + material + carvão → item com atributos calculados pela
engine**, nunca pela IA. A qualidade sai da maestria de `oficio` e de uma
variação do RNG da campanha, com teto por molde. Item forjado fica em
`personagem.itensForjados` (mesmo padrão de `artesCriadas`) e `itemPorId`
ganha o personagem como terceiro parâmetro opcional. Forjar treina `oficio`;
obra-prima vira marco e fato público. Nichirin não é forjável.

### Resultado da forja
Feito e verificado. A regra é a do plano: **molde + material + carvão → peça
com números calculados pela engine**.

- `engine/forja.ts` (novo): 9 moldes (lâmina curta e longa, estoque, machado,
  lança, martelo, gibão, cota, escudo) × 10 materiais já existentes no
  catálogo e sem uso (minério de ferro, fio de prata, estilhaço de pedra,
  lasca de gárgula, osso, dente de lobo, garra, couro, escama, pele de urso).
  Qualidade da mão = `0,7 + maestria/200 + variação do RNG da campanha`, entre
  0,6 e 1,3, medida *antes* do treino (a lição vale para a próxima peça).
  Teto: nenhuma peça passa de 1,45× o molde. Rótulos: tosca, honesta, boa,
  fina, obra-prima; raridade `notavel` para fina/obra-prima e `rara` só para
  obra-prima de material forte.
- Onde: local do tipo `forja` (Vila dos Ferreiros, Forja Afundada) ou onde
  houver NPC presente com ocupação de ferreira/armeira. Com ferreira do lado, o
  treino de `oficio` rende mais (mestre 0,75 contra 0,3) e ela vira observadora.
- Custo: 1 carvão + a quantidade do molde; 4 períodos do dia; avança o mundo.
  Quem estiver presente vê a demonstração de ofício; obra-prima vira marco e
  fato público.
- Peça forjada vive em `personagem.itensForjados` (mesmo padrão de
  `artesCriadas`) e entra no inventário como `forjado_N`. `itemPorId` ganhou o
  personagem como 3º parâmetro opcional; equipar, arma equipada, defesa,
  carga, verbos, usar, vender, narrador (`nomeItem` em llm.ts) e as telas
  Combate, Inventário, Loja e Painéis passam o personagem. Comprar e o estoque
  de loja continuam só no catálogo, de propósito.
- `AcaoMundo` ganhou `{ tipo: 'forjar', molde, material }`; herda o bloqueio
  de "conclua a infância" das outras ações de mundo.
- UI: seção **Forja** no Inventário, visível só onde `ondeForjar` permite.
  Lista só as receitas que a mochila já cobre, mostra o carvão e o resultado
  da última peça.
- Não mexi na forja dos anões de Asora (`encomendarForjaAnoes`, sessão 34 do
  Gemini): aquela é encomenda de item de catálogo em Tsukimichi; esta é o
  jogador fazendo a peça. Convivem.

### Arquivos
Novos: `engine/forja.ts`, `engine/forja.selftest.ts`.
Alterados: `engine/acoesMundo.ts`, `engine/index.ts`, `engine/items.ts`,
`engine/llm.ts`, `engine/types.ts`, `package.json` (forja no `test:engine`),
`ui/screens/Inventario.tsx`, `Combate.tsx`, `Loja.tsx`, `Paineis.tsx`.

### Handoff reorganizado
`HANDOFF.md` tinha 2.378 linhas. Sessões 13 a 23 e o bloco de estado do Codex
(16/09) foram movidos para `HANDOFF-ARQUIVO.md` sem edição; o mapa rápido e o
AGENTS.md foram atualizados para "sessões 1 a 23".

### Verificações
- `tsc --noEmit`: limpo.
- `engine/forja.selftest.ts`: 26 checagens verdes — teto em todas as
  combinações, mão treinada melhor (média 1,10 contra 0,70; na prática 122
  contra 85 de dano somado em 12 lâminas), recusa sem consumir nada (lugar,
  carvão, material, molde incompatível), peça equipa e resolve via
  `itemPorId`, não vaza para o catálogo, sobrevive a export/import equipada,
  treina ofício, gasta tempo, determinística pela semente.
- `test:engine` completo (inclui simLongo): exit 0, nenhuma violação de
  invariante, 223 s.
- `test:jornadas` e `test:casas`: exit 0.
- `expo export --platform web`: ok.
- Não cliquei a seção Forja no navegador: chegar à Vila dos Ferreiros numa
  campanha nova exige viagem longa. A lógica que a tela chama é a mesma do
  teste.

### Próximo passo sugerido
- Vender carvão e minério em mais lojas e pôr ferreiras com ocupação clara nas
  cidades, para a forja aparecer cedo no jogo, não só na vila escondida.
- Forja no Tsukimichi: hoje funciona se houver lugar `forja` ou ferreira
  presente; o bundle da DLC não tem nenhum dos dois além dos anões de Asora.
- Backlog maior continua: consequências visíveis, Diretor de Arcos, rotina
  urbana, Nemesis que perde, Marca + linhagem, ação livre 2.0, risco de
  combate, quebrar UI + E2E.

---

## Sessão 41 — Gemini — Forja Inicial em Vaelhorn & Forja Composicional no Novo Mundo (Tsukimichi)

### Objetivo
Atender e concluir as duas recomendações pendentes da Sessão 40:
1. **Disponibilidade da Forja Inicial (Vaelhorn)**:
   - Expandir a venda de matérias-primas essenciais (`carvao`, `minerio_de_ferro`, `couro_cru`, `fio_de_prata`) para lojas de Halvet (incluindo a taverna inicial) e principais entrepostos/cidades do continente (`tessel`, `corveira`, `porto_sal`, `mareu`, `aldeia_ferro`, `aldeia_carvoeira`, `caravancerai`).
   - Adicionar ferreiras/armeiras autorais com ocupação explícita (`OFICIO_DE_FERREIRA`) nas principais cidades que não possuíam ferreiras (`tessel` com Vana do Fole e `mareu` com Kelda Cais).
2. **Integração Plena da Forja com a DLC Tsukimichi**:
   - Ajustar o complexo metalúrgico dos Elder Dwarves (`asora_forja_anoes`) para ter `tipo: 'forja'`, permitindo forjar com a bigorna primordial mesmo em horários noturnos e aproveitando a presença de Mestre Beren para treino com mestre.
   - Adicionar o NPC Garrick (`garrick_ferreiro`), armeiro e ferreiro de fronteira da Guilda de Aventureiros de Tsige, presente no Distrito Comercial e Portão do Ermo.
   - Mapear o catálogo de itens de Tsukimichi (`itensTsukimichi`) para garantir que matérias-primas de forja e suprimentos básicos sejam vendidos no Distrito Comercial de Tsige, Portão do Ermo, Companhia Kuzunoha e Forja de Asora, preservando o isolamento estrito entre os ContentBundles.
   - Em `engine/forja.ts`: atualizar `ondeForjar` para detectar locais que possuem pontos de interesse dedicados à ferraria (`pontos` contendo ferraria/forja/bigorna).

### O que foi alterado e implementado
- `content/vaelhorn/items.ts`:
  - Criadas constantes `MAT_FORJA` e `MAT_METAIS_NOBRES` englobando as cidades e entrepostos comerciais de Vaelhorn.
  - Atualizadas as lojas de `carvao`, `minerio_de_ferro`, `couro_cru` e `fio_de_prata`. A taverna inicial (`taverna`) agora vende os suprimentos básicos para que o jogador possa forjar sem travas no início do jogo.
- `content/vaelhorn/elenco-continente.ts`:
  - Adicionadas 2 NPCs autorais com histórias, corpos, vozes, laços e segredos completos:
    - `armeira_de_tessel` ("Vana do Fole", armeira da guarnição militar de Tessel).
    - `ferreira_de_mareu` ("Kelda Cais", ferreira naval e calafate de Mareu).
- `content/vaelhorn/tsukimichiMundo.ts`:
  - `asora_forja_anoes` atualizada com `tipo: 'forja'`.
- `content/tsukimichi/index.ts`:
  - Adicionado o NPC autoral `garrick_ferreiro` ("Garrick", ferreiro de fronteira e armeiro de Tsige).
  - Mapeado `itensBaseTsukimichi` para distribuir itens e matérias-primas de forja em `tsige_distrito_comercial`, `tsige_portao_ermo`, `tsige_companhia_kuzunoha` e `asora_forja_anoes`.
- `engine/forja.ts`:
  - Atualizado `ondeForjar` para checar `instalacaoForja = ctx.local.tipo === 'forja' || ctx.local.pontos?.some(p => /ferraria|forja|bigorna/i.test(p))`.
- `engine/forja.selftest.ts`:
  - Expandido de 26 para 41 verificações automatizadas:
    - Forja disponível nas cidades de Vaelhorn (Halvet no mercado, Tessel, Mareu e Aldeia do Ferro).
    - Venda de carvão e minérios na taverna inicial e nas cidades de Halvet e Continente.
    - Venda de matérias-primas em Tsige e Asora.
    - Reconhecimento de Garrick em Tsige e Mestre Beren em Asora.
    - Execução real de forja composicional em Asora via `executarAcaoMundo` com registro na ficha, inventário e equipamento no Novo Mundo.

### Verificações e Testes Executados
- `npm run typecheck`: 0 erros (TypeScript strict mode 100% limpo).
- `npx tsx engine/forja.selftest.ts`: 41/41 asserções aprovadas com sucesso.
- `npx tsx engine/elenco.selftest.ts`: 100% aprovado (todas as exigências de voz, corpo, segredo e laços atendidas).
- `npx tsx engine/selftest.ts`: 100% aprovado (53 locais, 246 NPCs, 143 itens, 82 criaturas, 76 artes, 15 quests — 0 referências quebradas).
- `npm run test:tsukimichi`: 70/70 testes aprovados.
- `npm run test:jornadas` & `npm run test:casas`: 100% aprovados.
- `npm run test:engine`: 20 suítes unitárias + 6 campanhas de 10 anos (107.250 ações) com **0 violações de invariante** em 192.9s.
- `npx expo export --platform web`: 352 módulos empacotados com sucesso em `dist`.

### Próximo passo sugerido
- **Ação Livre 2.0**: expansão da interpretação de texto livre na tela de Ação Livre com reconhecimento de intenções para forja, treino e diálogos com NPCs presentes.
- **Diretor de Arcos & Consequências Visíveis**: alimentar o feed com reações sociais públicas quando itens notáveis ou obras-primas forem desfilados nas cidades.

---

## Sessão 42 — Gemini — Desmanche de Espólios, Afiação & Têmpera e Catalisadores Raros na Forja Avançada

### Objetivo
Atender ao pedido do usuário ("integrar e testar as coisas") implementando e validando as 3 mecânicas de forja avançada consolidadas no plano aprovado:
1. **Desmanche de Espólios (*Salvage / Smelting*)**:
   - Reciclagem de armas, armaduras e escudos obsoletos ou capturados na bigorna para restituição de matérias-primas essenciais (`minerio_de_ferro`, `couro_cru`, `fio_de_prata`, etc.).
   - Proteção inviolável: peças únicas, míticas, relíquias e lâminas Nichirin não podem ser desmanchadas. Peças equipadas exigem desequipar antes da reciclagem.
2. **Afiação & Têmpera (*Sharpening & Tempering*)**:
   - Manutenção de combate na forja gastando 1 carvão e 1 período do dia.
   - Armas: **Afiação** (+2 de dano pelos próximos 5 combates).
   - Armaduras e Escudos: **Têmpera** (+2 de defesa pelos próximos 5 combates).
   - Consumo decrescente de cargas a cada combate travado (via `encerrar`).
   - Imutabilidade do catálogo: peças de catálogo são clonadas como instâncias customizadas na ficha (`itensForjados`), blindando a definição estática do `ContentBundle`.
3. **Catalisadores Raros & Místicos (*Infusion*)**:
   - Infusão de despojos de criaturas e relíquias do catálogo durante a forja (`anel_draupnir`, `glandula_de_veneno`, `cinza_de_mir`, `unha_de_carnical`, `agua_do_espelho`).
   - Concessão de propriedades intrínsecas (`suprimeMana`, `venenosa`, `contraOni`, `critica`, `espelhada`).
   - Obediência incondicional ao teto de 1,45× do molde: nem o catalisador mais potente quebra a curva de poder.
   - Propriedade `venenosa`: ataques desferidos com a lâmina inoculam peçonha (`condicoes: ['envenenado']`) e ativam contador tático de veneno (`tatico.veneno`).

### O que foi alterado e implementado
- `engine/types.ts`:
  - Adicionados campos opcionais em `Item`: `afiacao`, `tempera`, `catalisador`, `propriedadesEspeciais`.
- `engine/forja.ts`:
  - Criado tipo `Catalisador` e array `CATALISADORES`.
  - Atualizada `calcularPeca` com parâmetro `catalisador?: Catalisador`, aplicando bônus e propriedades dentro do teto estrito de 1,45×.
  - Atualizada `forjar` aceitando `catalisadorItem?: string`, consumindo combustível, matéria-prima e catalisador.
  - Implementada `desmanchar(content, camp, itemId)`: recusa itens equipados, únicos, míticos ou sagrados; decompõe a peça e restitui matérias-primas na mochila, avançando 1 período e treinando ofício.
  - Implementada `temperar(content, camp, itemId)`: prepara armas (afiação) ou armaduras/escudos (têmpera) por 5 combates ao custo de 1 carvão, clonando com segurança peças de catálogo.
- `engine/items.ts`:
  - `bonusDefesaEquip`: contabiliza `it.tempera.bonusDefesa` enquanto houver cargas ativas.
- `engine/combat.ts`:
  - `danoJogador`: adiciona `bonusAfiacao` ao cálculo de dano base.
  - `resolverAtaque`: se o atacante for o jogador e a arma equipada possuir propriedade `'venenosa'`, aplica a condição `envenenado` e ativa o contador `tatico.veneno`.
  - `encerrar`: ao final do combate, consome 1 carga de afiação da arma e 1 carga de têmpera de armadura e escudo equipados, limpando o bônus ao zerar.
- `engine/acoesMundo.ts`:
  - Expandido tipo `AcaoMundo` com variantes `{ tipo: 'forjar'; catalisador?: string }`, `{ tipo: 'desmanchar'; itemId: string }` e `{ tipo: 'temperar'; itemId: string }`.
  - Handlers integrados em `executarAcaoMundo` despachando para as funções da engine.
- `ui/screens/Inventario.tsx`:
  - Exibição de afiação, têmpera e propriedades intrínsecas nos itens equipados e na mochila.
  - Botão contextual de "afiar" / "temperar" para equipamento equipado na presença de forja e carvão.
  - Botão de "desmanchar" na mochila para equipamentos recicladores sobressalentes.
  - Seletor de catalisadores opcionais na seção de Forja quando disponíveis na mochila.
- `engine/forja.selftest.ts`:
  - Baterias de testes unitários automatizados para desmanchar, temperar, catalisadores e combate com veneno e consumo de cargas.

### Verificações e Testes Executados
- `npm run typecheck`: 0 erros (TypeScript Strict Mode 100% limpo).
- `npx tsx engine/forja.selftest.ts`: 100% verde (todas as 55 verificações da forja aprovadas).
- `npm run test:tsukimichi`: 70/70 testes aprovados.
- `npm run test:engine`: 20 suítes unitárias + 6 campanhas de 10 anos (107.250 ações) com **0 violações de invariante** em 135.0s.
- `npx expo export --platform web`: 352 módulos empacotados com sucesso em `dist`.

### Próximo passo sugerido
- **Ação Livre 2.0**: expandir a interpretação de intenções em linguagem natural na tela de Ação Livre para suportar ordens de forja ("desmanchar espada", "afiar lâmina", "forjar lança com peçonha").
- **Diretor de Arcos**: alimentar o feed narrativo com fofocas e reconhecimento público quando o jogador forjar uma obra-prima ou empunhar armas lendárias nas capitais.

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
