# RO ARCANUM — Plano de trabalho para o Fable 5.1

Documento escrito pelo Claude (sessão 46, 23/09/2026) depois de auditar o
repositório inteiro. É o seu roteiro. Leia até o fim antes de mexer em
qualquer arquivo.

---

## 0. Como usar este documento

1. Leia, nesta ordem: `AGENTS.md`, `HANDOFF.md` (principalmente as sessões 40
   a 46; as sessões 1 a 38 estão em `HANDOFF-ARQUIVO.md`), este documento, `GDD.md` (só as seções citadas em cada fase).
2. Trabalhe **fase por fase, na ordem**. Cada fase tem objetivo, o que existe
   hoje, o que fazer, critério de pronto e testes obrigatórios.
3. Ao fim de cada fase: validação completa (seção 2), registro no
   `HANDOFF.md`, commit, push. Só então passe para a próxima.
4. Você trabalha sozinho, na nuvem, sem o dono por perto. **Não pare para
   perguntar.** Quando houver dúvida de design, escolha a opção mais
   conservadora e coerente com o código existente, registre a decisão no
   `HANDOFF.md` com o motivo, e siga.
5. Se uma fase não puder ser concluída, registre no `HANDOFF.md` o que foi
   feito, o que falta e por quê, faça commit do que está verde e passe para a
   próxima fase. Nunca deixe o repositório com teste falhando.

---

## 1. O projeto em uma página

RO ARCANUM é um RPG narrativo para Android e web (Expo 57, React Native,
TypeScript, zustand). Uma IA narra, mas **a engine é a dona do mundo**: todo
estado canônico — inventário, vida, relações, NPCs, mortes, missões, tempo —
é decidido por código TypeScript puro em `engine/`. O narrador (`engine/llm.ts`,
provedores Nous/OpenRouter) recebe um pacote do estado e só descreve.

- `engine/` — ~20 mil linhas, módulos por sistema. Os maiores: `tsukimichi.ts`
  (2.568), `llm.ts` (1.580), `reino.ts` (1.576), `combat.ts` (1.493).
- `content/vaelhorn/` — o mundo principal: 53 locais, 246 NPCs, 87 criaturas,
  169 itens, 81 artes, 15 missões escritas, 4 casas nobres, 9 classes.
- `content/tsukimichi/` — DLC (isekai). 14 locais, **6 NPCs**, 18 criaturas,
  **0 missões**.
- `ui/` — telas em `ui/screens/`, estado em `ui/store.ts` (1.646 linhas).
- Testes: 24 arquivos `engine/*.selftest.ts`, rodados com `tsx`. Há uma
  simulação de campanhas de 10 anos (`engine/simLongo.ts`,
  `engine/campanhaLonga.ts`) que confere invariantes do mundo.

Princípios que você **não pode quebrar** (vêm do `AGENTS.md` e da história do
projeto):

- **A engine decide, a IA narra.** Nada que você fizer pode deixar o LLM criar
  estado canônico. Conteúdo novo (NPC, família, história) é dado estático em
  `content/`; o que muda com o tempo é estado em `Campaign`, mudado só por
  funções da engine.
- **Determinismo.** Toda aleatoriedade passa por `engine/rng.ts` (`nextFloat`,
  `pick`, `nextInt`) sobre `camp.rng`. Nunca `Math.random()`. Para sortear
  coisas na inicialização de um sistema novo sem mudar a sequência do jogo,
  derive um RNG próprio — veja `estadoBandos` em `engine/bandos.ts`:
  `createRng(camp.rng.seed ^ seedFromString('nome_do_sistema'))`.
- **Saves antigos não podem quebrar.** Campo novo em `Campaign` é opcional
  (`?`) e criado sob demanda, ou preenchido por `normalizarCampanha` em
  `engine/migracao.ts`. Teste export/import (`exportar`/`importar` de
  `engine/persistencia.ts`) em tudo que você adicionar.
- **Não reescreva o que funciona.** Estenda. Nada de refactor grande fora da
  fase que pede isso (a Fase 9 pede, e só ali).
- **Tsukimichi é separada.** Não misture conteúdo de Vaelhorn e da DLC. Um
  sistema que só faz sentido num mundo precisa checar o bundle (veja
  `temBandos` em `engine/bandos.ts`).
- **Português do Brasil** em todo texto de jogo, comentário, commit e HANDOFF.
  Prosa sóbria e concreta, no tom dos comentários já existentes. Nada de
  emoji, nada de linguagem de marketing.

---

## 2. Protocolo de validação (obrigatório em toda fase)

Primeira coisa da sessão:

```bash
npm ci
```

Depois de cada mudança relevante, e **sempre** antes de cada commit:

```bash
npm run typecheck
npm run test:engine
npm run test:jornadas
npm run test:casas
npx tsx engine/vaelhorn_expansao.selftest.ts
npx expo export --platform web
```

`test:engine` leva ~4 minutos e inclui a simulação longa. Ela imprime uma
tabela assim:

```
longa-0    10a  fim_do_prazo nível 33  pop 3892  fome   17d  travas     0  violações 0
```

Regras:

- **`violações` tem de ser 0 em todas as linhas.** Violação é bug de estado.
- **Antes de começar cada fase, guarde a tabela da simulação longa** (copie a
  saída para o HANDOFF). Ao terminar, compare. Se mortes, nível médio,
  população ou fome mudarem muito, investigue a causa antes do commit. Foi
  assim que a sessão 46 descobriu que as mortes vinham da Marca do Caçador,
  não dos bandos: desligou o sistema novo por uma variável temporária e
  instrumentou a morte. Remova toda instrumentação antes do commit.
- Todo sistema novo ganha um `engine/<sistema>.selftest.ts` e entra no script
  `test:engine` do `package.json`. Siga o padrão dos testes existentes:
  helper `ok(condicao, mensagem)` que lança erro, mensagens em português que
  dizem o que foi provado, números reais na mensagem quando houver.
- Todo conteúdo novo (NPCs, famílias, histórias) ganha checagens automáticas
  de coerência (ver Fase 3).
- Se houver `EXPO_PUBLIC_NOUS_API_KEY` no ambiente, rode também uma campanha
  curta com narração real e leia o resultado procurando contradição entre
  narração e estado. Se não houver, pule, e diga no HANDOFF que não foi
  verificado com IA real.
- **Nunca faça commit de `.env.local`** nem de nenhuma chave. Antes de cada
  commit, rode `git diff --cached | grep -iE "sk-|api[_-]?key"` e confira.
- Commit por fase, mensagem em português, primeira linha curta dizendo o que
  mudou para o jogador. Termine a mensagem com a linha de coautoria do agente.
  Faça push para a branch atual (`claude/build-app-apk-nzg5ap`), sem force.
- Não use `--no-verify`, não desligue teste, não apague teste que falha para
  ficar verde.

---

## 3. Fases

Ordem pensada para: primeiro corrigir o que está errado, depois dar
profundidade ao mundo que já existe, e só no fim expandir.

### Fase 1 — A Marca do Caçador está matando campanhas demais

**O que existe.** `engine/ascensao.ts` (linha ~56) aplica o custo biológico da
Marca do Caçador: o corpo "não ultrapassa 25 anos impune". A Marca desperta em
`combat.ts` (vitória sobre Lua ou chefe oni por quem usa respiração). A
sessão 24 (Gemini) criou o custo; a sessão 46 mediu: na simulação longa
`simLongo 10 6`, **3 de 6 campanhas morrem fora de combate aos 25–28 anos**,
com `sanidade` e `corrupcao` em 100 e condição `mutilado`.

**O que fazer.**
1. Meça antes de mexer: escreva um script temporário que roda
   `simularCampanhaLonga` para 12 sementes e conta quantas despertam a Marca,
   em que idade, e de que morrem. Registre no HANDOFF.
2. Leia o cânone que o projeto usa: a Marca encurta a vida (morte por volta
   dos 25), mas no cânone isso é uma escolha trágica com aviso, não uma
   armadilha silenciosa. Os comentários em `ascensao.ts` e a sessão 24 (hoje em
   `HANDOFF-ARQUIVO.md`) dizem a intenção.
3. Ajuste para que:
   - o jogador **saiba** (marco + fato + aviso claro no painel quando a Marca
     desperta, dizendo o custo e a idade-limite);
   - a pressão de sanidade/corrupção não chegue a 100 só por efeito colateral
     de outros sistemas empilhados (verifique quem soma nessas pressões:
     `grep -rn "pressoes\[" engine`);
   - exista pelo menos um caminho de jogo para adiar ou mitigar (no cânone há
     exceção histórica; a engine pode ter uma provação rara e cara, via
     `concederDespertar` ou flag de conteúdo). Não pode ser trivial.
4. Critério de pronto: na simulação longa, morte pela Marca só acontece em
   campanhas que a despertaram, sempre depois de aviso registrado, e a taxa
   de morte volta a no máximo 1–2 em 6. Documente os números antes/depois.

**Testes.** `engine/marca.selftest.ts`: despertar registra aviso; pressões
não saturam só pela Marca em N dias; o caminho de mitigação funciona e custa
o que promete; campanha sem Marca não morre por idade aos 25.

---

### Fase 2 — Famílias entre NPCs (a maior lacuna de profundidade)

**O que existe.** 246 NPCs em `content/vaelhorn/npcs.ts` (+ elenco do
continente em `elenco-continente.ts` e povoamento procedural em
`povoamento.ts`). Cada NPC tem `relacoes`, mas os tipos usados são
`devedora` (67), `protege` (95), `aliada` (76), `desconfia` (69), `rival`
(83), `sangue` (6), `amante` (2). **Nenhum NPC tem pai, mãe, filho, irmão ou
cônjuge declarado.** A família que existe é só a do jogador
(`engine/familia.ts`, gerada na infância). A vida de fundo
(`engine/vidanpc.ts`, `engine/autonomia.ts`) casa NPCs e faz casais adotarem
órfãos procedurais, mas o elenco escrito nasce sem parentesco nenhum.

**O que fazer.**
1. Leia `engine/types.ts` (tipo `NPC` e o tipo da relação), `vidanpc.ts`,
   `autonomia.ts`, `familia.ts` e como `relacoes` é lido pela engine e pelo
   narrador (`grep -rn "relacoes" engine`). Entenda quem consome o campo antes
   de adicionar tipos.
2. Adicione parentesco como **dado de conteúdo**, sem quebrar o que lê
   `relacoes` hoje. Duas formas aceitáveis — escolha a que menos mexe no
   código existente e registre o motivo:
   - novos tipos de relação (`pai`, `mae`, `filho`, `irmao`, `conjuge`,
     `avo`, `neto`, `tio`, `primo`), ou
   - um campo novo `familia?: { casaFamiliar: string; pais?: string[];
     conjuge?: string; filhos?: string[] }` no NPC.
3. Escreva famílias de verdade no elenco existente. Meta mínima:
   - **30 famílias** cobrindo pelo menos **110 dos 246 NPCs**, espalhadas
     pelas 9 regiões (hoje: Vale de Halvet 38 NPCs, Fora do Vale 31, Tessel
     38, Corveira 40, Mareu 49, Vintra 21, Solgar 20, Baixios 6).
   - Use quem já existe: leia `ocupacao`, `idade`, `localBase`, `personalidade`,
     `segredo` e as relações atuais, e encontre quem faz sentido ser parente.
     Um ferreiro de 52 anos e uma aprendiz de 20 na mesma aldeia, com a mesma
     facção, são candidatos naturais. Ajuste só o necessário (sobrenome no
     nome, se o projeto usar sobrenomes — confira o padrão antes).
   - Famílias precisam ter **tensão**: herança disputada, filho que foi para o
     outro lado, irmãs em facções rivais, viúva que não perdoou. Amarre às
     relações `rival`/`desconfia`/`devedora` que já existem.
   - Crie NPCs novos só quando uma família precisar de um membro que não
     existe (ex.: o filho que partiu). Meta: até 40 NPCs novos, cada um com
     todos os campos que os NPCs escritos têm (`rotina`, `vozNarrativa`,
     `personalidade`, `corpo`, `segredo`, `relacoes`, `expediente` quando
     aplicável).
4. Faça a engine **usar** o parentesco:
   - morte de um NPC gera luto nos parentes (tensão, disposição, memória), e
     fato público com o nome da família;
   - `vidanpc`/`autonomia`: filhos de NPCs escritos herdam a casa/ocupação
     quando os pais morrem ou envelhecem, em vez de só procedurais;
   - o jogador ferir, salvar ou matar alguém muda a disposição da família
     inteira (com peso menor que o do próprio NPC);
   - o pacote do narrador inclui os parentes presentes ou relevantes do NPC em
     cena (máximo 3, curto).
5. Tela: na ficha do NPC (procure onde a UI mostra NPC — `Paineis.tsx`),
   mostre "Família" com os parentes conhecidos pelo jogador.

**Critério de pronto.** 30+ famílias, 110+ NPCs com parentesco, todas as
checagens da seção de testes abaixo verdes, simulação longa sem violação, e
pelo menos 3 exemplos de família com tensão descritos no HANDOFF.

**Testes.** `engine/familiasNpc.selftest.ts` com checagens automáticas sobre
**todo** o elenco:
- todo id citado em parentesco existe;
- simetria: se A é pai de B, B é filho de A; cônjuge é recíproco;
- idade: pai/mãe pelo menos 15 anos mais velho que o filho; avô 30+;
- ninguém é parente de si mesmo; nenhum ciclo (A avô de B e B avô de A);
- NPC com `especie` oni/espírito não tem parentesco humano sem justificativa
  explícita no conteúdo;
- morte gera luto nos parentes (teste de engine);
- save round-trip preserva o que mudou.

---

### Fase 3 — NPCs com história escrita

**O que existe.** Os NPCs têm `personalidade` (média de **55 caracteres**),
`corpo`, `vozNarrativa` e `segredo`. **130 dos 246 NPCs não têm segredo.**
Nenhum NPC tem história de vida escrita: o narrador não sabe de onde a pessoa
veio, o que perdeu, o que quer.

**O que fazer.**
1. Adicione ao tipo `NPC` um campo opcional `historia?: { origem: string;
   ferida: string; desejo: string; medo?: string }` (nomes podem mudar se
   algo parecido já existir — confira `types.ts` antes). Cada campo: 1 a 3
   frases concretas, com nome de lugar, pessoa ou fato do mundo, nunca
   genérico ("teve uma infância difícil" é proibido).
2. Escreva `historia` para **todos os NPCs com `combatente`, `ensinaMestre`,
   `duelo` ou que apareçam em missão** (confira com `grep` em `quests.ts`,
   `desafios.ts`, `verbs.ts`), e depois para o máximo possível do resto.
   Meta mínima: 150 NPCs.
3. Escreva `segredo` para os 130 que não têm. Segredo tem de ser **revelável
   e ter consequência**: veja como `camp.segredosRevelados` é
   preenchido (efeito `revelar` em `engine/effects.ts`, `talvezRevelarSegredo` em
   `ui/store.ts`) e lido (`engine/availability.ts`: `condicaoNecessaria:
   'segredo:<npcId>'`), e amarre segredos novos a efeitos
   existentes (disposição, missão, verbo, fato) sempre que possível. Pelo
   menos 20 segredos novos precisam destravar algo concreto (um verbo, uma
   missão viva, uma relação que muda).
4. Coerência com a Fase 2: a história de um NPC não pode contradizer o
   parentesco, a idade ou o lugar. Irmãos contam a mesma tragédia de ângulos
   diferentes — isso é bom, faça de propósito em algumas famílias.
5. Narrador: inclua `historia` do NPC em cena no pacote de `llm.ts`, resumida,
   com a regra explícita de que o narrador pode aludir mas não revelar o que o
   jogador não descobriu. Segredo nunca vai no pacote antes de revelado
   (confira que isso já é verdade hoje e mantenha).
6. Tsukimichi: não mexa nos NPCs dela nesta fase (ver Fase 7).

**Critério de pronto.** 150+ NPCs com `historia`, 0 NPCs sem `segredo`,
20+ segredos com consequência mecânica, checagens verdes.

**Testes.** No `familiasNpc.selftest.ts` ou num `historiasNpc.selftest.ts`:
- todo NPC tem segredo não vazio;
- `historia`, quando existe, tem os 3 campos obrigatórios, cada um com pelo
  menos 40 caracteres, e não repete texto de outro NPC;
- nenhuma história cita id/nome de NPC ou local inexistente (varra os nomes
  do elenco e dos locais dentro do texto);
- segredos com consequência: revelar dispara o efeito declarado;
- o pacote do narrador não contém segredo não revelado.

---

### Fase 4 — Casas nobres com gente dentro

**O que existe.** `content/vaelhorn/casas.ts` tem 4 casas (Halvet, Mareu, As
Sete Casas de Corveira, Tessel) com lema, sede, território, forma de sucessão
e rivalidades — **mas nenhum membro com nome**. `engine/casas.ts` tem 23
linhas: só acumula tesouro e legitimidade. A sessão 44 (Gemini) fez um
sistema feudal para o **feudo do jogador** (`engine/reino.ts`), com conselho,
linhagem, herdeiros e tramas — mas as casas do mundo não usam nada disso.

**O que fazer.**
1. Dê a cada casa uma família nobre escrita: chefe, cônjuge, 2 a 4 herdeiros,
   um ou dois parentes colaterais (tio ambicioso, prima exilada), e um
   servidor de confiança. Use NPCs existentes quando fizer sentido (procure
   quem já mora na sede — `casa_senhorial`, `mareu`, `corveira`, `tessel`) e
   crie os que faltarem, com o nível de detalhe da Fase 3.
2. Ligue as casas à Fase 2 (parentesco) e à forma de sucessão declarada:
   `primogenitura`, `eleicao`, `duelo`. Quando o chefe morre, a engine aplica
   a regra — o teste `test:casas` já cobre sucessão; estenda sem quebrar.
3. Faça as casas **agirem** no mundo (ciclo diário, em `processarCasas`):
   - investir tesouro em obras da cidade-sede (o módulo `cidades.ts` tem
     `projeto` e `edificios`);
   - contratar patrulha contra bandos na sua região (`engine/bandos.ts`: pode
     reduzir `membros` do bando daquela região, com fato público);
   - casamentos políticos entre casas rivais para baixar tensão, e tramas
     quando a legitimidade cai (reaproveite a ideia de `reino.ts`, sem copiar
     código grande — extraia função comum se for o caso).
4. O jogador pode servir, casar, trair ou derrubar uma casa? Não precisa de
   tudo. Mínimo: missão viva oferecida pela casa (veja `missoesVivas.ts`) e
   reputação com a casa refletida na disposição dos membros.

**Critério de pronto.** 4 casas com 5+ membros nomeados cada, sucessão com
gente real, casas investindo e patrulhando na simulação longa (conte na
tabela: obras financiadas por casa, bandos reduzidos por patrulha).

**Testes.** Estender `engine/casas.selftest.ts`: membros existem, sucessão
escolhe o herdeiro certo por regra, investimento acontece com tesouro
suficiente e não com tesouro zero, patrulha reduz bando e gera fato.

---

### Fase 5 — Mundo que reage: estações, feras em bando, caravanas

**O que existe.** O calendário tem estações (`engine/time.ts`,
`engine/mundo.ts`), mas elas quase só mudam o clima e a lavoura
(`cidades.ts`: fertilidade 0,8 no inverno). O encontro de viagem
(`rolarEncontroDeViagem` em `engine/viagem.ts`) sorteia 1 criatura, e só em
20% das vezes uma segunda. Bandos de salteadores já escalam por nível
(`tamanhoDoGrupo` em `bandos.ts`) — use como modelo.

**O que fazer.**
1. Estação nos encontros: multiplicador de chance por estação e por tipo de
   criatura (feras mais famintas e ousadas no inverno, migração no outono).
   Use um campo opcional nas criaturas do bestiário (ex.:
   `estacaoAtiva?: Estacao[]` ou `agressividadePorEstacao`) e preencha para as
   feras (lobos, ursos, corvos, gárgulas etc. — leia o bestiário).
2. Bandos de feras: criaturas com campo opcional `bando?: { min: number;
   max: number }` saem em grupo, com o tamanho limitado pelo nível do jogador
   do mesmo jeito que `tamanhoDoGrupo`. **Nível 1 nunca enfrenta mais de 1
   inimigo em encontro aleatório** (a sessão 46 mediu que bando sem teto mata
   campanha).
3. Inverno rigoroso: evento que fecha rotas de montanha (`passo`, `colina`)
   por alguns dias ou as deixa mais perigosas (via `perigoEfetivoDaRota`),
   com fato público.
4. Caravanas entre cidades: estado simples (origem, destino, carga, dias) que
   move comida/materiais entre cidades de `camp.vivo.cidades` e pode ser
   atacada por bando da região (usa `engine/bandos.ts`). Caravana perdida sobe
   a fome/insegurança do destino. O jogador pode escoltar (missão viva).

**Critério de pronto.** Diferença mensurável por estação na simulação (conte
encontros por estação), feras em grupo aparecendo só a partir do nível
certo, caravanas circulando e sendo atacadas às vezes, sem subir as mortes
da simulação longa além do que a Fase 1 deixou.

**Testes.** `engine/estacoes.selftest.ts` e `engine/caravanas.selftest.ts`:
multiplicadores por estação, teto por nível, rota fechada no inverno, caravana
entrega, caravana atacada gera fome no destino, save round-trip.

---

### Fase 6 — Cidades com identidade e a forja ao alcance

**O que existe.** `engine/cidades.ts`: 5 edifícios genéricos (lavoura,
moradias, enfermaria, muralha, mercado), todos com teto 5, iguais em qualquer
cidade. A forja (`engine/forja.ts`) funciona, mas só em local do tipo `forja`
(Vila dos Ferreiros, escondida; Forja Afundada, em Corveira) ou com ferreira
presente — e quase ninguém tem ocupação de ferreira clara. Carvão e minério
são pouco vendidos.

**O que fazer.**
1. Um edifício especial por região, declarado no conteúdo (não no código):
   Corveira — fundição (vende carvão e minério, reduz custo da forja);
   Mareu — estaleiro/porto (caravanas marítimas, peixe contra fome);
   Tessel — baluarte (muralha acima de 5, patrulha contra bandos);
   Solgar — cisterna e bazar (fome menor na seca, itens raros);
   Vintra — serraria/carvoaria (carvão). Teto dos edifícios comuns pode subir
   de 5 só para capitais, declarado por cidade.
2. Ponha ferreiras e armeiros com ocupação clara (regex em
   `OFICIO_DE_FERREIRA` de `forja.ts`) nas cidades grandes — de preferência
   NPCs de famílias da Fase 2 (família de ferreiros em Corveira, por exemplo).
3. Garanta que o jogador consegue forjar a primeira peça nas primeiras horas
   de jogo sem saber de lugar escondido: teste de jornada que parte do começo,
   compra carvão e minério e forja numa cidade do vale ou vizinha.

**Critério de pronto.** Cada cidade grande tem pelo menos um edifício que
nenhuma outra tem, com efeito medido; jornada "primeira forja" verde.

**Testes.** Estender `cidades`/`jornadas`: edifício regional aparece só na
cidade certa, efeito aplicado, jornada da primeira forja.

---

### Fase 7 — Tsukimichi: dar gente à DLC

**O que existe.** Tsukimichi tem 14 locais, **6 NPCs** (todos sem segredo,
sem relações, sem história), **0 missões escritas**, 18 criaturas e muitos
sistemas (Asora, contratos, reinos humanos, heróis, companhia mercantil) em
`engine/tsukimichi.ts` (2.568 linhas). Nove locais não têm NPC fixo nenhum
(`tsige_portao_ermo`, `wasteland_fronteira`, `wasteland_desfiladeiro`,
`wasteland_pantano_bruma`, `wasteland_ninho_fenix`,
`rotsgard_distrito_central`, `rotsgard_biblioteca_arcanum`,
`asora_fontes_termais`, `asora_atelie_seda`).

**O que fazer.**
1. Leia `TSUKIMICHI_EXPANSAO.md` e `content/tsukimichi/index.ts` antes. Respeite
   o tom e os nomes já usados.
2. Escreva pelo menos 30 NPCs novos para a DLC, com todos os campos (inclusive
   `historia`, `segredo`, `relacoes` e parentesco da Fase 2), cobrindo todos os
   locais que hoje estão vazios. Inclua gente comum (comerciantes da guilda de
   Tsige, estudantes em Rotsgard, moradores de Asora), não só figuras de poder.
3. Escreva pelo menos 6 missões para a DLC no formato de `content/vaelhorn/quests.ts`
   (confira se o bundle da DLC lê `quests` e se a UI mostra — se não, ligue).
4. Não suavize nem amplie conteúdo sexual; se encontrar texto explícito ou que
   trate pessoas como propriedade de forma gratuita, registre no HANDOFF e não
   expanda nessa direção.

**Critério de pronto.** 36+ NPCs na DLC, 0 locais sem NPC fixo, 6+ missões
jogáveis do começo ao fim, `npm run test:tsukimichi` (e o selftest da DLC)
verde e estendido.

---

### Fase 8 — Consequências visíveis e Diretor de Arcos

**O que existe.** Muita coisa acontece no mundo (`registrarFato`,
`registrarMarco`, `camp.vivo.fatos`) e parte disso chega ao narrador como
boato (`ecosRecentes`). Mas o jogador raramente **vê** o efeito do que fez.
O backlog do dono pede isso desde a sessão 23.

**O que fazer.**
1. "O mundo lembra": quando o jogador volta a um lugar onde fez algo marcante
   (matou capitão de bando, forjou obra-prima, salvou família, deixou missão
   falhar), a cena inicial menciona — via fato no pacote do narrador e uma
   linha no feed gerada pela engine (não pela IA).
2. Diretor de Arcos: um módulo pequeno (`engine/diretor.ts`) que olha o estado
   (rivais vivos, bandos caçando o jogador, famílias em luto, casas em crise,
   missões abertas) e escolhe **no máximo um** gancho por dia de jogo para
   empurrar para perto do jogador (um boato, um mensageiro, um encontro),
   com cooldown, sem inventar estado — só apontando para o que já existe.
3. Painel "Crônica" (pode ser seção em `Paineis.tsx`): lista curta dos fatos
   em que o jogador foi ator, em ordem, legível.

**Critério de pronto.** Teste mostrando que voltar a um local após um fato
marcante produz a linha de feed e o fato no pacote; diretor respeita
cooldown e só aponta para estado existente.

---

### Fase 9 — Manutenção: arquivos gigantes e testes de interface

**O que existe.** `ui/store.ts` (1.646 linhas), `ui/screens/Paineis.tsx`
(1.566), `Assentamento.tsx` (1.353), `engine/tsukimichi.ts` (2.568). Não há
teste de interface.

**O que fazer.** Só depois das fases anteriores, e só se sobrar tempo:
1. Quebrar `Paineis.tsx` e `store.ts` em módulos por assunto **sem mudar
   comportamento** (mesmas funções exportadas, mesmos nomes de ação no
   store). Um commit por arquivo quebrado, com a suíte inteira verde em cada
   um.
2. Um teste de fluxo de interface (se o ambiente tiver navegador — Playwright
   contra `expo export --platform web` servido localmente): criar personagem,
   passar a infância, viajar, lutar, abrir inventário, forjar. Se não houver
   navegador na nuvem, registre no HANDOFF e pule.

---

## 4. O que NÃO fazer

- Não mudar a arquitetura engine → estado → persistência → contexto → LLM
  sem necessidade concreta.
- Não deixar o LLM decidir morte, item, dinheiro, relação ou missão.
- Não usar `Math.random()`, `Date.now()` em regra de jogo (só em
  persistência/UI, onde já é usado).
- Não apagar nem reescrever texto antigo do HANDOFF. Só acrescentar. Se o
  `HANDOFF.md` passar de ~800 linhas, mova as sessões mais antigas para
  `HANDOFF-ARQUIVO.md` sem editar o texto (regra do `AGENTS.md`).
- Não criar conteúdo em massa por repetição (NPCs com a mesma frase trocando
  o nome). Qualidade acima de quantidade: se não der para escrever 110
  parentescos bons, escreva 60 bons e registre que faltou.
- Não mexer em `.env.local`, chaves, `eas.json`/credenciais de build.
- Não fazer force-push, não reescrever histórico, não trocar de branch.

## 5. Registro no HANDOFF (por fase)

Abra uma seção `## Sessão 47 — Fable 5.1 — <fase>` (e 48, 49... por fase ou
por dia de trabalho) com:

- estado encontrado (com a tabela da simulação longa antes);
- o que foi feito, com números;
- arquivos novos e alterados;
- decisões tomadas e por quê;
- verificações executadas e resultado (tabela da simulação depois);
- problemas encontrados e não resolvidos;
- próximo passo.

## 6. Resumo para o fim da sessão

Ao terminar (ou quando o tempo acabar), a última coisa é um resumo no
HANDOFF: fases concluídas, fases parciais, o que o dono deve testar no
celular (lista curta e concreta: "crie personagem, vá a Corveira, compre
carvão, forje uma lâmina"), e riscos conhecidos.
