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

- **`HANDOFF.md` (este arquivo)** — estado atual, sessões recentes (54 em
  diante), problemas abertos e próximo passo. É o que se lê antes de trabalhar.
- **`HANDOFF-ARQUIVO.md`** — sessões 1 a 53, na íntegra e sem edição. Consultar
  quando for preciso saber *por que* alguma decisão antiga foi tomada. As
  sessões 13 a 23 foram movidas na sessão 40, 24 a 27 na sessão 42, 28 a 31 na sessão 43, 32 a 38 na sessão 44, 39 a 42 na sessão 48, 43 a 45 na sessão 51, 46 a 50 na sessão 56, e 51 a 53 na sessão 58.

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
| 43–45 | Gemini — assentamento e feudo, soberania feudal, relíquias nobres e classe Lutador |
| 46 | Claude — bandos com capitão Nemesis |
| 47–50 | Claude — Marca do Caçador, famílias entre NPCs, histórias e segredos, casas nobres com gente |

---

## Sessão 54 — Claude — o que estava solto no jogo

Pedido do dono nesta sessão: "procura erros no jogo, coisas que não estão
linkadas", e depois aprofundar a história. Esta sessão é a primeira parte.

### Como procurei
Três varreduras, todas em scripts de leitura (fora do repositório):
1. **Referências do conteúdo**: rotas, rotinas, relações, lojas, loot,
   encontros, mestres, casas, famílias. Nenhum id quebrado nessas listas.
2. **Ações de mundo sem tela**: cada `tipo` de `AcaoMundo` contra as chamadas
   da interface.
3. **Funções exportadas que ninguém chama** (fora do próprio arquivo e dos
   testes).

### O que estava solto, e o que foi feito
- **Três sistemas da sessão 45 sem tela nenhuma**, só nos testes:
  - **Trabalhos especializados** (galeria de Corveira, cais de Mareu, muralha
    de Tessel, caçada por contrato). Não checavam lugar: "turno na Fenda de
    Corveira" pagava 24 moedas, 2 minérios e +1 de Atletismo na taverna de
    Halvet, sem limite — dinheiro do nada e perícia infinita. Agora
    (`engine/trabalhosEspecializados.ts`):
    - só na cidade do ofício, uma vez por dia;
    - pagam do tesouro da comunidade, como o trabalho comum;
    - a perícia sobe até 3 e para;
    - a caçada exige um troféu de contrato.
  - **Treinos imersivos** (katas, palma de ferro, cascata, duas espadas). Cada
    kata dava +1 permanente num atributo por 4 de vigor, e a cascata dava +1
    de Resiliência e devolvia o vigor inteiro: katas e cascata em sequência
    eram atributo infinito, por cima da aptidão e do teto humano. Agora
    (`engine/treinamentoImersivo.ts`, mesmos nomes exportados):
    - só onde o mestre ensina (Musashi no Passo do Lobo, Bai Long no Mosteiro
      Alto), uma vez por semana por modalidade, 3 períodos;
    - o ganho vai pela maestria (`treinar`), sem atributo solto;
    - a perícia sobe até 3; técnica só com o mestre (`aprenderArte`);
    - a cascata alivia 10 de cada pressão e devolve o vigor.
    Decisão: o jeito conservador de ligar um sistema que quebrava a curva de
    poder era ligá-lo às regras que a curva já usa, e não do jeito que estava.
  - **Contratos de monstro**. O combate já funcionava: óleo dá dano, e vencer
    o alvo conclui o contrato e dá o troféu. Faltavam a tela e três coisas:
    - dois contratos apontavam para lugares que não existem (`pantano`,
      `montanhas`). Agora são o Juncal e o Passo do Lobo;
    - as mensagens mostravam rolagem e id cru ("Rolagem: 15 vs 11",
      "[oleo_anti_besta]");
    - nada checava lugar.
    Feito: aceitar no quadro (taverna ou Feira Coberta), procurar pista e
    enfrentar só no lugar do contrato. A recusa não gasta tempo. Contratantes
    sem barões nem companhias. Saves antigos: ao abrir o quadro, os campos
    fixos (título, contratante, lugar) voltam aos do conteúdo; o estado fica.
  - Tela: seções "trabalho do lugar", "treino com mestre" e "contratos de
    monstro" em Comunidade (`MundoVivo.tsx`).
- **Item que "permite" um verbo sem permitir**: o giz de ritual e o incensário
  diziam no inventário "permite realizar_ritual"/"benzer", mas o verbo
  continuava exigindo Arcana. `verbosConcedidos` existia e ninguém chamava.
  Agora `disponibilidadeVerbo(…, content)` aceita o item no lugar da perícia
  (sem `content`, a regra antiga).
- **Texto técnico no lugar da descrição de 23 onis**: as Luas, Muzan, Nakime e
  os outros com identidade apareciam no jogo como "Kamanue — identidade
  canônica em uma cronologia alternativa de Vaelhorn. Mecânica de combate
  adaptada: garras.". Prosa escrita para cada um em
  `content/vaelhorn/descricoes-onis.ts`.
- **16 peças lendárias sem fonte nenhuma**: as relíquias das casas, a espada e
  a coroa do último rei, quatro armas perdidas e as manoplas de Bai Long. Não
  vinham de loja, loot nem missão. O texto falava de barões, almirantes e
  patriarcas. Agora (`content/vaelhorn/lendas.ts`):
  - cada peça tem história (`Item.historia`) casada com o elenco (Valda e
    Aldren; Idrun e Odile no cerco; Oren no desabamento de Corveira);
  - **9 ficam com os adversários fixos das expedições**, que as deixam cair
    quando vencidos. Exemplos: a Cavaleira do Eclipse com a Soberana do
    Eclipse, o Colosso da mina com o Quebra-Rocha soterrado no desabamento, o
    Arauto da cripta com a lança de São Vandro;
  - **7 são confiadas pelas casas** a quem elas passaram a chamar de sua
    (reputação 25/30 e 40, uma peça por dia, fato público; `confiarReliquias`
    em `engine/casas.ts`);
  - a história aparece no inventário e vai para o narrador quando a peça está
    equipada (`pecasComHistoria`).
- **Lugares que contradiziam o mundo**: Tessel dizia "O marechal atual herdou
  o posto do pai… ninguém lembra de eleição", contra as três gerações de
  marechalas e a sucessão por eleição da Fase 4. O Mosteiro tinha "os irmãos".
  Corrigidos. Troquei uma linha por outra, então o sorteio do povoamento não
  muda; só o texto do segredo-modelo que cita a linha.

### Encontrado e não corrigido (para o dono decidir)
- **Linha do tempo de Mir**: o cenário diz que o vale é das mulheres "por três
  gerações", desde que Mir queimou; As Ruínas de Mir dizem "faz vinte anos",
  e Vell (34) era menino quando aconteceu. Não escolhi: os textos novos desta
  sessão não datam o incêndio.
- **49 segredos-modelo** de moradores procedurais são história pública do
  lugar vestida de segredo ("Mentiu no depoimento da época. O cerco de dezoito
  anos atrás durou quarenta dias."). Ficam para a próxima sessão, junto das 71
  pessoas sem história.
- As feras da Grande Terra Desolada e de Tsige falam de "Wasteland" (termo de
  Tsukimichi). Ficaram fora, a pedido do dono.
- Funções exportadas sem uso restantes: 13 em `tsukimichi.ts` (fora do
  escopo) e utilidades de tela sem tela (`resumoFamilia`,
  `retratoConviccoes`, `efeitoDaClasse`, `faixaDeAptidao`,
  `pesoDoEquipamento`, `deveFecharCapitulo`). Não removi.

### Arquivos
Novos: `engine/trabalhosEspecializados.ts`, `engine/ligacoes.selftest.ts`,
`content/vaelhorn/descricoes-onis.ts`, `content/vaelhorn/lendas.ts`.
Alterados: `engine/treinamentoImersivo.ts` (reescrito, mesmos nomes),
`engine/contratosMonstros.ts`, `engine/acoesMundo.ts`, `engine/availability.ts`
(e quem chama: `grade.ts`, `llm.ts`, `campanhaLonga.ts`, `ui/screens/Jogo.tsx`),
`engine/casas.ts`, `engine/memoriaMundo.ts`, `engine/llm.ts`, `engine/types.ts`
(`Item.historia`), `engine/index.ts`, `content/vaelhorn/casas.ts`
(`CasaNobre.reliquias`), `content/vaelhorn/index.ts`,
`content/vaelhorn/kimetsu.ts`, `content/vaelhorn/continente.ts`,
`engine/vaelhorn_expansao.selftest.ts` (as regras novas),
`ui/screens/MundoVivo.tsx`, `ui/screens/Inventario.tsx`, `package.json`.

### Verificações
- `ligacoes.selftest.ts` (novo). Cobre:
  - trabalhos: lugar, tesouro, uma vez por dia, teto 3, troféu;
  - treino: lugar, sem atributo nem técnica, maestria, semanal, teto 3,
    cascata sem atributo;
  - contratos: lugares existem, quadro, recusa sem gastar tempo, texto sem
    rolagem nem id, save antigo corrigido;
  - verbos: o giz vale pela Arcana;
  - onis: nenhum texto técnico;
  - peças lendárias: as 16 têm caminho, cada guardião é de expedição e deixa a
    peça, sem barão/almirante/patriarca, 2+ parágrafos, a casa confia na ordem
    e uma vez, a história vai ao narrador.
- `typecheck`, `test:engine` completo, `test:jornadas`, `test:casas`,
  `vaelhorn_expansao`, `expo export`: verdes. Depois disso só troquei texto
  das lendas (datas de Mir); reexecutei `typecheck`, `ligacoes`, `casas` e
  `vaelhorn_expansao`, verdes.

Simulação longa depois (`simLongo 10 6`): 6 de 6 até o fim do prazo, 0
mortes, 0 violações; níveis 29 a 33; população 3.530 a 4.185; fome 0 no fim.
O simulador não usa trabalhos, treinos nem contratos, então nada disso muda a
curva dele.

### Próximo passo
História: bestiário (rascunho pronto), as 19 localidades do coração do vale
sem história, as quatro casas, e as 71 pessoas sem história com os 49
segredos-modelo. A história nova de lugar entra no pacote DEPOIS do
povoamento: o povoamento sorteia o segredo dos moradores a partir de
`Local.historia`, e mexer nela antes mudaria quem mora em cada lugar.

---

## Sessão 55 — Claude — história: bestiário, lugares, casas

### O que foi feito
- **Bestiário** (`content/vaelhorn/bestiario-historias.ts`, `Criatura.historia`
  e `Criatura.sinais`), para as **71 criaturas do vale**:
  - fauna, gente da estrada, os mortos, os seres de Mir, os chefes com nome,
    os guardiões das expedições, as presas dos contratos e os onis (as Luas,
    no que a Casa Sem Nome sabe delas);
  - `historia` é o que o vale conta; `sinais` é o que serve na estrada;
  - aparece na Crônica, seção "Bestiário", só para o que o jogador já venceu
    (flag `matou.<id>`, que o combate já gravava);
  - ficaram de fora as feras da Grande Terra Desolada e de Tsige.
- **Lugares** (`content/vaelhorn/historias-locais.ts`): os 19 lugares do
  coração do vale não tinham história, e o narrador recebia
  `historiaDesteLugar: []` justamente na taverna onde o jogo começa. Agora os
  53 têm. Quatro descrições que contradiziam o mundo foram corrigidas: "o
  senhor de Halvet", "os pescadores", "os mineiros" e o "Cristo de madeira"
  da Capela de São Vandro.
- **Casas** (`content/vaelhorn/historias-casas.ts`, `CasaNobre.historia`): a
  origem, o que cada uma perdeu e o que a move. Aparece no card da casa, em
  Comunidade, e vai ao narrador em `casasPresentes[].historia`.
- As datas seguem o que o conteúdo já dizia: o cerco de Tessel há 18 anos, o
  desabamento de Corveira há 12, a peste de Mareu há 40. As histórias foram
  conferidas contra o elenco antes de entrar: Borka, Oda, Heska, Torana e
  Duna, Lunn e a noite em que o sino não tocou, Ruvela.

### Decisão importante
O povoamento sorteia o segredo de cada moradora a partir de `Local.historia`.
Dar história a um lugar que não tinha **mudaria quem mora nele**: nomes,
ofícios e as famílias da Fase 2 que apontam para esses ids. A história nova
entra no pacote depois do povoamento (`comHistoriaDosLugares` em
`content/vaelhorn/index.ts`), e o teste prova que as 172 moradoras são as
mesmas. A tabela da simulação longa saiu idêntica à da sessão 54, linha por
linha.

### Arquivos
Novos: `content/vaelhorn/bestiario-historias.ts`,
`content/vaelhorn/historias-locais.ts`, `content/vaelhorn/historias-casas.ts`,
`engine/lore.selftest.ts`.
Alterados: `engine/types.ts`, `content/vaelhorn/casas.ts`,
`content/vaelhorn/index.ts`, `engine/llm.ts`, `ui/screens/Paineis.tsx`,
`ui/screens/MundoVivo.tsx`, `package.json`.

### Verificações
- `lore.selftest.ts`:
  - as 71 criaturas do vale com história e sinais, sem emoji, "Wasteland" ou
    texto técnico;
  - os 53 lugares com história e as descrições corrigidas;
  - as 172 moradoras idênticas (nome, ofício, idade, lugar), e nenhum segredo
    sorteado das linhas novas;
  - o narrador recebe a história da taverna e a da Casa Tessel.
- `typecheck`, `test:engine` completo, `test:jornadas`, `test:casas`,
  `vaelhorn_expansao`, `expo export`: verdes. Simulação longa idêntica à
  anterior.

---

## Sessão 56 — Claude — as moradoras: história, segredo e nome

### Estado encontrado
- 71 das 249 pessoas do elenco não tinham história.
- 49 moradoras procedurais tinham um "segredo" que era só a história pública
  do lugar com uma frase na frente. O povoamento sorteava uma linha de
  `Local.historia` e escrevia "Mentiu no depoimento da época. O cerco de
  dezoito anos atrás durou quarenta dias.". Qualquer pessoa na praça sabe
  isso.
- Nomes: a lista de alcunhas tinha formas masculinas, e saíam "Elna o Manco",
  "Lira o Surdo", "Sela o Gordo", "Eda o Torto" — num vale onde toda
  moradora é mulher.
- A ocupação "moça que some por dias" saía para mulheres de 41 a 59 anos.

### O que foi feito
- **71 histórias** (origem, ferida, desejo, medo) e **49 segredos** no lugar
  dos segredos-modelo, em `content/vaelhorn/historias-moradores.ts`. Cada um
  foi casado com o que o elenco já tinha:
  - **Tessel:** o cerco; a gêmea do registro.
  - **Corveira:** o desabamento; os trinta e quatro nomes que Wyn apaga e
    guarda no forro do casaco.
  - **Mareu:** a peste; o galpão da quarentena.
  - **Porto do Sal:** as salinas.
  - **Juncal:** a Toca.
  - **Lenha Alta:** o inverno em que algo entrou na aldeia.
  - **Ferro Velho:** o metal recuperado.

  Cada segredo diz em `comoDescobrir` o caminho em jogo.
- **Alcunhas no feminino**: 'o Torto' → 'a Torta', 'o Manco' → 'a Manca',
  'o Novo' → 'a Nova', 'o Gordo' → 'a Gorda', 'o Surdo' → 'a Surda'.
  - Mesma posição na lista, então o sorteio não muda e ninguém troca de
    nome-próprio, ofício ou idade.
  - 28 menções em textos já escritos foram trocadas junto (segredos,
    famílias, histórias), e as famílias "as do Gordo" e "as do Torto" viraram
    "as da Gorda" e "as da Torta".
  - "moça que some por dias" virou "mulher que some por dias".
- Seis histórias recitavam o próprio segredo. O teste da sessão 49 pegou, e
  elas foram reescritas para aludir.

### Arquivos
Novo: `content/vaelhorn/historias-moradores.ts`.
Alterados:
- `content/vaelhorn/index.ts` (prioridade: segredo reescrito > segredo da
  moradora > segredo do conteúdo);
- `content/vaelhorn/povoamento.ts` (alcunhas, ocupação);
- `content/vaelhorn/segredos.ts`, `familias.ts`, `historias-continente.ts`
  (nomes);
- `engine/lore.selftest.ts`.

### Verificações
- `historiasNpc.selftest.ts`: 249 histórias e 249 segredos; campos com 40+
  caracteres, sem genérico e sem repetição; nenhuma história copia trecho de
  segredo.
- `lore.selftest.ts`:
  - nenhum segredo-modelo;
  - as 249 pessoas com história e segredo;
  - nenhuma moradora com alcunha no masculino;
  - as 172 moradoras com o mesmo nome-próprio, ofício, idade e lugar.
    Compara o povoamento com o pacote, os dois já com as alcunhas novas.
- `familiasNpc`, `elenco`, `povoamento`, `continente`, `typecheck`,
  `test:engine` completo, `test:jornadas`, `test:casas`, `vaelhorn_expansao`,
  `expo export`: verdes.

---

## Resumo do trabalho das sessões 47 a 56 (plano docs/PLANO-FABLE-5.1.md)

### Fases concluídas
| Fase | Sessão | O que mudou para quem joga |
| --- | --- | --- |
| 1. Marca do Caçador | 47 | A Marca desperta só em luta de verdade (oni de nível 8+, à beira da morte), avisa o preço e pode ser contida na Casa Sem Nome na Névoa. |
| 2. Famílias entre NPCs | 48 | 43 famílias; luto, herança de ofício e gratidão se espalham pela família. |
| 3. NPCs com história | 49 | Histórias e segredos com consequência. |
| 4. Casas nobres | 50 | As quatro casas têm gente, sucessão pela regra, e agem no mundo (obra, celeiro, patrulha, missão, casamento, trama). |
| 5. Estações, feras, caravanas | 51 | Feras por estação, matilha com teto por nível (nível 1 nunca enfrenta dois), nevasca nos passos, caravanas de grão que podem ser atacadas e escoltadas. |
| 6. Cidades e forja | 52 | Um edifício por região (Fundição Alta, Cais Grande, Praça de Armas, Cisterna e Bazar, Pátio da Madeira); capitais até nível 7; a primeira forja no dia 1. |
| 8. O mundo lembra, Diretor de Arcos | 53 | Voltar a um lugar onde você fez algo marcante gera uma linha; no máximo um gancho a cada 3 dias apontando para o que existe; "O que o mundo lembra de você" na Crônica. |
| (pedido do dono) Ligar o que estava solto | 54 | Trabalhos do lugar, treino com Musashi e Bai Long, contratos de monstro com tela; 16 armas lendárias com história e dono; 23 onis com prosa. |
| (pedido do dono) História | 55–56 | Bestiário de 71 criaturas; os 53 lugares e as 4 casas com história; as 249 pessoas com história e segredo próprios. |

### Fases não feitas
- **Fase 7 (NPCs de Tsukimichi)**: fora, a pedido do dono ("foca só em
  vaelhorn").
- **Fase 9 (quebrar `store.ts`/`Paineis.tsx`, teste de interface)**: não
  feita. O plano a põe por último e "só se sobrar tempo"; o dono pediu
  história antes.

### O que testar no celular (lista curta)
1. **Primeira forja**: crie personagem, vá da taverna à Feira Coberta,
   trabalhe um turno, compre carvão e dois minérios, forje uma lâmina curta
   no Inventário.
2. **Corveira**: na tela Comunidade, veja a Fundição Alta; forje lá sem
   carvão; faça um turno na galeria funda.
3. **Contrato de monstro**: na taverna, aceite "O Terror das Caravanas de
   Val-Cinza"; na Mata de Corvos, procure as pistas; passe óleo contra feras
   (se tiver) e enfrente o lobo.
4. **Treino**: vá ao Passo do Lobo e faça um livro dos katas; tente de novo
   no mesmo dia (tem de recusar).
5. **Crônica**: depois de vencer umas criaturas, abra a Crônica e veja o
   Bestiário e "O que o mundo lembra de você".
6. **Casa**: cumpra missões para gente de uma casa (Tessel é a mais fácil) e
   veja a casa confiar o elmo e depois a espada.
7. **Inverno**: jogue até o inverno e veja se aparece a nevasca e mais lobo
   na estrada.

### Riscos conhecidos
- **Narração real não foi testada**: não havia `EXPO_PUBLIC_NOUS_API_KEY`
  neste ambiente. O narrador local (sem chave) foi o único exercitado.
- **Fome rara**: com caravanas e o peixe do Cais Grande, dias-cidade em fome
  caíram de 2.621 para ~550 por campanha. Botões: `COMIDA_PARA_MANDAR` e
  `CARGA_MAXIMA` em `engine/caravanas.ts`, `comidaPorDia` do cais.
- **Morte pela Marca na simulação**: o simulador nunca vai conter a Marca;
  em uma das rodadas (sessão 52) uma campanha morreu dela. É a regra
  funcionando; se incomodar, a política da simulação precisa aprender a
  conter.
- **Linha do tempo de Mir** (decisão do dono): o cenário diz "três gerações"
  de Leva; As Ruínas de Mir e Vell dizem "vinte anos". Os textos novos não
  datam o incêndio.
- **Ganchos repetidos**: o diretor pode voltar ao mesmo capitão ou casa a
  cada 20 dias; se cansar no celular, suba `DIAS_PARA_REPETIR_ALVO`.
- **Import circular** `combat.ts` ↔ `caravanas.ts` (só funções). Funciona.
Simulação longa: idêntica às sessões 54 e 55, linha por linha.

---

## Sessão 57 — Claude — colônia num lugar real (etapa A de F)

Pedido do dono: aprofundar o assentamento/reino do Gemini. O dono pediu para
terminar só a etapa A nesta sessão e fazer o resto em outra.

### Auditoria do que existia (`engine/reino.ts`, `ui/screens/Assentamento.tsx`)
- A fundação acontecia num "ponto" que não era lugar do mapa
  (`halvet_colinas`) e podia ser feita de qualquer lugar. O jogo achava o
  soberano sempre ausente, e nenhuma cidade sabia da colônia.
- As vantagens dos pontos eram texto (quase nenhuma estava no código), e
  desvantagem não havia.
- A colônia nascia com castelo, quartel, mercado, forja e muralha prontos.
- A população era um número, que crescia só por refugiados (4 por vez,
  sempre que alguma cidade estivesse em crise).
- Estabilidade e segurança não tinham efeito nenhum.
- "Declarar guerra" só gravava um id. Ninguém atacava a colônia.
- Tier por contagem de prédios.
- Bugs:
  - "supervisionar obras" processava o dia duas vezes;
  - `Date.now()` em ids de regra;
  - herdeiro nascia menino ou menina pela paridade do turno, com nomes de
    outra saga.

### Etapa A (feita)
- `content/vaelhorn/sitios.ts`: seis sítios reais, os lugares sem dona de
  cada região (Campos da Ceifa, Colina dos Forcados, Clareira das Pedras,
  Farol Quebrado, Ruína de Areia, Vau de Pedra). Cada um tem:
  - terreno de 0 a 3 (água, solo, madeira, pedra, caça, pesca, pasto, defesa,
    passagem, perigo, inverno);
  - casa que reivindica a terra;
  - animais da região;
  - um traço próprio: o trigo do marechal (Tessel leva 1/5 da roça), a vista
    do planalto, o círculo de pedras, o farol apagado (destroços; reacender),
    a areia que devolve (achados e obra soterrada), a travessia (pedágio e
    cheias).
- `engine/colonia.ts`:
  - funda-se estando no sítio;
  - começa com 6 pessoas, abrigos e uma roça;
  - a água limita a população (poço e cisterna, edifício novo
    `cisterna_poco`);
  - o passe diário da colônia usa o terreno (substitui a economia antiga
    quando há sítio);
  - `efeitosDoSitio` escreve vantagens e desvantagens a partir dos mesmos
    números da regra;
  - saves antigos migram para o sítio real.
- Bugs acima corrigidos (dia duplo, `Date.now`, herdeiro por sorteio
  derivado com nomes do mundo).
- Tela: fundação lista os sítios com vantagens e desvantagens exatas
  (`ui/screens/Colonia.tsx`); card do sítio com o relatório do dia na aba
  Soberania.
- Teste: `engine/colonia.selftest.ts` (terreno, água, traços, fundação no
  lugar, migração, sem consumo de RNG).

### Próximas etapas (não feitas; plano para a próxima sessão)
- **B. Gente** — rascunho pronto e testado só no papel em
  `docs/colonia-etapa-B/`:
  - 24 arquétipos de quem chega, com histórias;
  - colonos com nome, aptidões por ofício, temperamento, humor e lealdade;
  - chegada por renome, com aceitar ou recusar à porta;
  - responsáveis por ofício mudam a produção;
  - aba "Gente".
  - `aplicar_B.py` copia os arquivos e liga tudo (tipos, colonia.ts, store,
    aba). Rodar, depois `typecheck` e `tsx engine/colonos.selftest.ts`.
    Ainda não foi executado contra o repositório.
- **C. Comida e animais**: cultivos por sítio; rebanhos (galinha, porco,
  cabra, ovelha, vaca, cavalo, mula) com função real (ovos, carne, leite, lã,
  tração, patrulha, carga); reprodução; feno no inverno; doença; cuidadora
  responsável. `SitioColonia.animais` já diz quantos há por região.
- **D. Audiências** (estilo *Yes, Your Grace*): pedidos diários gerados do
  estado (briga entre colonas briguentas, falta de comida, proposta de
  comércio, crime, casamento), com escolhas e consequências em
  recursos, humor e renome.
- **E. Ameaça e assembleia**:
  - aviso com dias de antecedência (+2 na Colina dos Forcados);
  - assembleia em que o texto livre do jogador é mapeado para um CATÁLOGO de
    preparações reais (armadilhas, paliçada, fosso, vigias, evacuar, estocar,
    milícia, pedir ajuda a uma casa, pagar tributo), cada uma com custo,
    gente e tempo;
  - o conselho opina conforme o temperamento;
  - batalha resolvida mostrando o que cada preparação fez;
  - ameaças vêm do que existe: bandos, casas rivais, onis (o círculo de
    pedras impede onis).
- **F. Renome e mundo**:
  - o tier passa a vir de renome, gente e governo;
  - casas mandam enviados, cobram tributo e oferecem acordo (o acordo com
    Tessel tira o quinto do trigo);
  - bandos miram colônia rica.

Verificações: `typecheck`, `test:engine` completo (com `colonia.selftest.ts`), `test:jornadas`, `test:casas`, `vaelhorn_expansao`, `expo export`: verdes. Simulação longa idêntica às sessões 54-56 (o simulador não funda colônia).

---

## Sessão 58 — Claude (PC) — testes quebrados no PC e etapa B da colônia

### Estado encontrado
Puxados os 12 commits da nuvem (sessões 47 a 57, até `9dfee20`). Rodando a
suíte no PC depois de `npm ci`: typecheck, jornadas, vaelhorn e expo export
verdes, mas `test:engine` falhava em `edificiosRegionais.selftest.ts` ("Cinco
edifícios, um por cidade") e `test:casas` em "todo membro existe no elenco".

Causa: 105 arquivos `.js` compilados em 16/09 ao lado dos `.ts` em
`engine/`, `content/` e `ui/` (ignorados pelo git, por isso ausentes na
nuvem). O `tsx` resolvia `./npcs` para o `.js` velho e carregava o elenco de
antes das sessões 47-57. Apagados só os `.js` que têm `.ts`/`.tsx` irmão; os
dois testes passaram na hora. Nada de código mudou para isso.

Pendente da sessão 57: etapa B da colônia (rascunho em
`docs/colonia-etapa-B/`, com `aplicar_B.py` nunca executado), e etapas C a F.

### Etapa B da colônia (gente) — aplicada
- Rodado `aplicar_B.py` numa cópia ajustada para o PC (caminhos da nuvem
  trocados, leitura em UTF-8 com quebra de linha normalizada — no Windows os
  arquivos estão em CRLF e as trocas exatas do script procuram `\n`). Todas as
  trocas bateram. O rascunho em `docs/colonia-etapa-B/` foi removido: o código
  agora vive em `engine/colonos.ts`, `content/vaelhorn/colonos.ts`,
  `ui/screens/GenteColonia.tsx` e `engine/colonos.selftest.ts`.
- Corrigido o que o rascunho trazia quebrado:
  - `OficioColonia`/`Temperamento` não eram exportados pela engine (três erros
    de tipo na UI e no store): reexportados em `engine/colonos.ts`.
  - Duas histórias abaixo do mínimo de 80 caracteres que o próprio teste
    exige (`mae_da_leva`, `cozinheira`): reescritas, mesmo tom.
  - Regra da fome no humor: `comida > 0` contava como alimentada a colônia com
    5,6 de comida para seis bocas (a caça do dia entra antes do humor).
    Agora fome é não ter o do dia para todos (`comida >= populacao`).
  - `colonia.selftest.ts` (etapa A) esperava o material cru do sítio; desde a
    etapa B ele passa pela eficiência de quem cuida das obras (60% sem
    responsável). O teste agora confere com `eficiencia`.
- `colonos.selftest.ts` entrou no `test:engine`.
- Não abri a aba "Gente" no navegador: exige fundar uma colônia num sítio, o
  que pede viagem. Typecheck e `expo export` cobrem a compilação da tela.

### Verificações
typecheck, `test:engine` completo, jornadas, casas, vaelhorn_expansao, expo
export: verdes. Simulação longa: 6/6 campanhas até o fim do prazo, 0 mortes,
0 violações.

### Nota: dois arquivos de terceiros entraram no commit `fd304af`
O `git add -A` do commit da etapa B levou junto `scripts/RO ARCANUM.bat`
(novo: inicializador do jogo no Windows, sobe o Expo e a ponte Hermes) e duas
linhas alteradas em `scripts/sync_hermes.ts` (dica e `process.exitCode = 1`
quando não há token). Não fui eu que escrevi. Conferido: nenhum dos dois tem
chave ou token, só código que lê o `auth.json` do Hermes na máquina. Ficaram
no commit. Se não deviam estar no repositório, é só remover.

### Etapa C da colônia (animais) — feita
- `engine/rebanhos.ts`: sete espécies com função real — galinha (ovo), cabra
  e vaca (leite), ovelha (lã → ouro), porco (carne guardada, abate), mula
  (material por dia), cavalo (segurança, teto de +15).
- Todo animal come: o pasto do sítio (`terreno.pasto` × 6) sustenta um tanto,
  o resto sai do celeiro como feno, depois da comida das pessoas. No inverno o
  pasto cai a 20%. Sem feno, morre um animal por dia (o que mais come).
- Crias só na primavera, só com casal, acumuladas em fração por espécie
  (`criasAcumuladas`), e mais crias com responsável pelo ofício `rebanho`.
  Rebanho apertado adoece mais; quem cuida segura.
- Compra: só as espécies da região do sítio, no máximo `sitio.animais[x]`
  por estação (`comprasAnimais`), pelo preço da ficha. Abate dá a carne da
  ficha; mula e cavalo não se abatem.
- Ligado em `processarDiaColonia` (relatório `rebanho`, eventos de cria e
  morte) e na segurança (patrulha montada).
- Tela: aba "Rebanho" no assentamento (`ui/screens/RebanhoColonia.tsx`).
- Teste: `engine/rebanhos.selftest.ts` (25 checagens), no `test:engine`.
- **Não feito da etapa C**: "cultivos por sítio" (plantas diferentes por
  região). A lavoura continua pelo `solo` do terreno. Fica para quando houver
  motivo de jogo além do nome da planta.

### Etapa D da colônia (audiências) — feita
- `engine/audiencias.ts`: um pedido por vez, no mínimo a cada 3 dias, nascido
  do estado — fome (celeiro abaixo de 4 dias de comida), briga (duas colonas
  briguentas ou de humor abaixo de 35), furto (segurança abaixo de 45; a
  comida sumida já sai do celeiro quando alguém vem contar), casamento (duas
  pessoas de humor 70+, sem união anterior), ferramentas (quem cuida de obras
  ou oficina, com material em estoque) e mercador (chance pela passagem do
  sítio).
- Cada opção diz o efeito antes da escolha, e a regra cumpre exatamente isso:
  comprar grão, racionar (60% do consumo por 10 dias, ligado em
  `processarDiaColonia`), abater (pela carne da ficha de `rebanhos.ts`), dar
  razão, mediar, castigar, expulsar, perdoar, pôr vigia, abençoar com ou sem
  festa (a união fica em `Colono.conjuge`), negar. Falta de recurso recusa a
  opção sem gastar o pedido.
- Sem resposta até o prazo: a ordem cai 3, o renome cai 1 e os envolvidos
  ficam de pior humor.
- Tela: bloco "pedem audiência" no topo da aba Gente.
- Teste: `engine/audiencias.selftest.ts` (16 checagens), no `test:engine`.

Verificações: typecheck, `test:engine` completo (simulação longa 6/6 até o
fim, 0 mortes, 0 violações), jornadas, casas, vaelhorn_expansao, expo export.

### Etapa E da colônia (ameaça e assembleia) — feita
- `engine/ameacas.ts`. A ameaça vem do mundo, nunca de tabela solta:
  - o bando ativo da região do sítio (4+ homens), com chance maior quanto
    mais rica a colônia e quanto mais gente passa por ela;
  - feras, pelo perigo do sítio, com chance e força maiores no inverno;
  - a casa que reivindica a terra, sem acordo e com 15+ pessoas;
  - oni, se houver rival oni vivo — nunca na Clareira das Pedras (o círculo).
- Aviso de 3 dias; 5 na Colina dos Forcados (o traço "vista do planalto" da
  etapa A agora vale). No máximo uma ameaça a cada 20 dias.
- Assembleia: texto livre traduzido para um catálogo fechado de nove
  preparações (armadilhas, paliçada, fosso, vigias, evacuar, estocar, milícia,
  pedir ajuda, pagar tributo), cada uma com custo, gente mínima e dias. O que
  não se traduz volta como "não entendi" com a lista. Também dá para escolher
  nos botões. O conselho (as três colonas mais leais) opina pelo temperamento.
- Batalha no dia marcado: defesa = segurança, muralha, quartel, cavalos, guarda
  + preparações PRONTAS A TEMPO (a atrasada aparece no relatório como não
  pronta). Desfecho: repelida, resistida ou saqueada; evacuar zera mortes e
  deixa levar mais; estocar guarda metade; saque mata no máximo um quarto;
  pedir ajuda só funciona com acordo ou casa com reputação 10+ (e ninguém
  ajuda contra a própria casa que reivindica). Tributo evita a batalha: vai
  para o tesouro do bando; pago a uma casa, vira acordo (o que também tira o
  quinto do trigo de Tessel nos Campos da Ceifa).
- De volta ao mundo: bando repelido perde 3 homens e deixa pista; bando que
  saqueia soma ao tesouro; fato público com o desfecho; marco.
- Força ajustada pelo teste: bando 8 + 4 por homem; matilha 10 + 6 por
  perigo (+8 no inverno). Com a força antiga, preparar tudo não salvava.
- `deBando()` em `bandos.ts`: "dos Corvos do Passo", "da Mão Cinzenta" (antes
  saía "de os Corvos").
- Tela: `ui/screens/AmeacaColonia.tsx`, na aba Soberania, abaixo do sítio.
- Teste: `engine/ameacas.selftest.ts` (26 checagens), no `test:engine`.

Verificações: typecheck, `test:engine` (simulação longa 6/6, 0 mortes, 0
violações), jornadas, casas, vaelhorn_expansao, expo export.

Outro agente está editando `content/vaelhorn/mapa.ts` e
`ui/screens/MapaVisual.tsx` ao mesmo tempo (desde 11:14 de 24/09). Não toquei
nesses dois arquivos e eles ficaram fora dos meus commits.

### Etapa F da colônia (renome e mundo) — feita
- `engine/renome.ts`:
  - **Nível** da colônia com sítio vem de renome, gente e governo
    (`tierDaColonia`), com teto 2 + 1 a cada 20 de renome — colônia grande e
    desconhecida não passa de vila. Cai só quando o renome despenca (dois
    níveis abaixo), um degrau por vez. Em `reino.ts`, a contagem de prédios
    ficou só para colônia sem sítio.
  - **Enviado da casa** a cada marco de renome (15, 40, 80): a casa que
    reivindica a terra, ou a que tem sede na região (Clareira e Ruína de Areia
    não têm casa: ninguém vem). Entra como audiência do tipo `enviado`:
    acordo (acaba a cobrança — inclusive o quinto do trigo de Tessel — e a
    ameaça da casa; reputação +5), proteção (acordo + segurança +10) ou
    recusa (a casa fica hostil em `casasHostis` e vem cobrar mais cedo: com
    8+ pessoas em vez de 15, e três vezes mais provável).
  - **Fato público** ao fundar e a cada mudança de nível.
- `casas.ts`: `estadoDaCasa()` cria o estado padrão da casa quando falta. Antes
  só `processarCasas` criava, e um acordo no mesmo dia da fundação mexia na
  reputação de nada (o teste pegou).
- Teste: `engine/renome.selftest.ts` (20 checagens).

### Jornada da colônia (tudo ligado) — `engine/coloniaJornada.selftest.ts`
Funda nos seis sítios e deixa o relógio do mundo andar 400 dias em cada
(`avancarPeriodos` + `avancarMundo`), com um jogador simples que aceita quem
chega, dá cargo, responde audiências (no furto: vigia, perdão, só então
expulsão) e decide a assembleia. Confere todo dia: nenhum recurso negativo
ou NaN, gente com nome nunca maior que a população, humor 0-100, rebanho
inteiro, nível 1-10; e no fim o save round-trip de cada colônia. Resultado:
42 chegadas, 416 audiências, 3 enviados, 39 ameaças e 39 batalhas, crias em
20 dias, as seis subiram de nível.

A jornada achou três problemas de jogo, corrigidos:
- furto era quase todo pedido (colônia pequena, guarda fraca): agora pede 8+
  pessoas e tem sorteio próprio de 35%; intervalo entre audiências de 3 para
  5 dias;
- concordância: "Casimir do Litoral foi posta para fora", "ela vai embora"
  para homem, "cada uma" para dois homens. Agora pelo gênero do colono;
- (no teste, não no jogo) somar o dia à mão não vira a estação; a jornada
  usa o relógio do jogo.
- `colonia.selftest.ts` (etapa A) comparava o celeiro depois de 10 dias; com
  10 pessoas e guarda fraca, o furto (etapa D) passou a mexer nele. O teste
  agora soma o que o terreno deu pelo relatório do dia (roça + caça −
  consumo − tributo): 47 no Campo da Ceifa contra 16 na Ruína de Areia.

### Verificações (sessão 58, final)
typecheck dos meus arquivos limpo; `test:engine` completo com as seis suítes
novas (colonos, rebanhos, audiencias, ameacas, renome, coloniaJornada) e a
simulação longa (6/6 até o fim, 0 mortes, 0 violações); jornadas, casas,
vaelhorn_expansao, expo export.

**Atenção:** `npm run typecheck` na árvore de trabalho acusa erros em
`ui/screens/MapaVisual.tsx` (estilos `bannerFeedback`, `capitalClicavel`...
que não existem). É o trabalho em andamento do OUTRO agente, que está
editando `MapaVisual.tsx` e `content/vaelhorn/mapa.ts` sem commit. Os
arquivos commitados compilam. Quem terminar o mapa precisa fechar esses
erros antes do commit dele.

### Próximo passo
- Cultivos por sítio (sobrou da etapa C), se houver efeito de jogo além do
  nome.
- Ver a colônia na tela (web ou APK): fundar num dos seis sítios e passar
  pelas abas Soberania (ameaça e assembleia), Gente (audiências e chegadas)
  e Rebanho.

---

## Sessão 59 (24/09/2026) — Correção, Pan/Drag com Mouse e Interatividade do Mapa de Vaelhorn

### O que foi feito
1. **Calibração e Alinhamento Preciso das Coordenadas (`content/vaelhorn/mapa.ts`)**:
   - Mapeados com exatidão todos os 19 locais de `locations.ts` (Vale de Halvet e arredores) e 34 locais de `continente.ts` (Marca de Tessel, Bosque de Vintra, Planalto de Corveira, Ermo de Solgar, Costa de Mareu, Baixios de Halvern) sobre a arte original `mapa_continente.jpg` (1376 × 768).
   - Ajustado o Vale de Halvet (`y: 56%`) para posicionar perfeitamente sobre a vila desenhada abaixo do rio, eliminando sobreposição com o escudo vermelho superior.
   - Corrigidas inversões geográficas: Solgar no deserto ao sudoeste (`x: 25.5%, y: 83%`), Vintra na floresta a oeste (`x: 28.5%, y: 39%`), Corveira no planalto central/sul (`x: 43%, y: 75%`), Mareu na costa a sudeste (`x: 69.5%, y: 75%`), Tessel nas montanhas nevadas ao norte (`x: 46.5%, y: 17%`).

2. **Navegação por Arrasto com Mouse (Pan & Drag) e Zoom (`ui/screens/MapaVisual.tsx`)**:
   - Implementado canvas virtual de proporção 1:1 nativa (**1376 × 768**) dentro de um viewport com `overflow: 'hidden'`.
   - Adicionado `PanResponder`: o jogador pode clicar, segurar e arrastar o mapa livremente com o mouse em qualquer direção (`cursor: 'grab' / 'grabbing'`).
   - Diferenciação inteligente de clique vs arrasto (threshold > 3px): arrastar move o mapa suavemente sem ativar pinos por engano; clicar em um pino sem arrastar ativa a viagem imediatamente.
   - Barra de controles flutuantes no topo:
     - `＋`: Aproximar zoom (até 2.0x).
     - `－`: Afastar zoom (até 0.45x).
     - `🎯`: Foco automático na posição atual do jogador (`camp.localAtual`).
     - `🗺️`: Ver o continente inteiro ajustado à tela.
   - Centralização automática na posição do jogador ao abrir o mapa.
   - Legenda mantida externamente abaixo do mapa.

3. **Interatividade e Viagem por Clique no Mapa (`MapaVisual.tsx` e `Paineis.tsx`)**:
   - `MapaVisual` recebe `onViajar={viajar}` de `Paineis.tsx`.
   - Pinos de rotas conectadas são `<Pressable>` com tag `✦ Viajar`, indicando períodos de viagem e efetuando a transição de local ao clique.
   - Pinos distantes exibem aviso informativo no topo do mapa.

### Validações
- `npm run typecheck`: 0 erros.
- `npm run test:vaelhorn`: todos os testes passaram.
- `npx expo export --platform web`: build web concluído com sucesso em 2601ms.

### Teste da colônia na tela (web) — sessão 58
Save real gerado pela engine (colônia "Pedra Alta" na Colina dos Forcados, dia
339, matilha anunciada, rebanho), gravado no armazenamento do navegador e
carregado pelo "Continuar". Testado clicando: Feudo → Soberania (sítio, ameaça,
conselho, assembleia por texto livre "finquem uma paliçada, ponham sentinela
no alto e armem uma milícia" → paliçada, vigias, milícia; avançar dias; batalha
repelida com relatório por preparação), Gente (ofícios, fichas com história,
dar cargo: obras 60% → 85%) e Rebanho (pasto/feno, comprar +1, abater 1).

Achado e corrigido no teste:
- **"Avançar 1 Dia" andava 4 períodos, e o dia tem 6** (`supervisionarObrasAcao`
  em `ui/store.ts`): cada clique era dois terços de dia. Agora usa
  `PERIODOS.length`.
- Celeiro sem teto: 2.445 de comida para 11 pessoas (ovo e leite acumulando
  para sempre). Agora `capacidadeDoCeleiro` = 300 + 250 por lavoura/silos; o
  resto estraga, com aviso a cada 10 dias.
- "pagar tributo · 0 de ouro" para quem não aceita moeda → "não aceitam moeda";
  "chega em 1 dias" → "1 dia"; preparação sem prazo mostra "na hora"; frases
  da batalha começam com maiúscula ("Uma matilha chegou").

O servidor da porta 8081 (do outro lado) está quebrado desde o `npm ci` desta
sessão (`expo/virtual/env` não resolve): precisa ser reiniciado. O da 8082
funciona.

### Mapa — revisão (sessão 58, depois da sessão 59 do outro agente)
O trabalho do mapa do outro agente (sessão 59) estava parado desde 12:00 e com
typecheck limpo; commitado como estava (`54bfbd5`) antes das correções, para
ficar separado. Conferido desenhando os pontos do jogo sobre
`assets/feudo/mapa_continente.jpg` (o canvas tem o tamanho da imagem, 1376×768):
- **Capital inexistente**: `halvern` ("Halvetia Capital") não é local do jogo;
  clicar para viajar pedia viagem a lugar nenhum. Virou `casa_senhorial` (A
  Casa de Pedra, sede da Casa de Halvet), posta no castelo desenhado.
- **Nomes inventados**: "Tesselgarde", "Corveiraborg", "Mareuborg",
  "Vintraborg", "Solgar Capital" vinham do texto pintado na imagem. A legenda
  agora usa os nomes do jogo (Tessel, Corveira, Mareu, Vintra, Solgar), e os
  subtítulos inventados ("Porto Imperial") viraram descrições simples. **A
  imagem continua com os nomes antigos pintados** — só uma imagem nova tira.
- **Baixios no lugar errado**: Juncal, Juncal de Baixo e a Toca estavam a
  leste, em cima da praça e do cemitério; pelas rotas só se ligam ao Vau de
  Pedra e ao lago. Foram para oeste, no Rio-Verde.
- A Vila dos Ferreiros (escondida) estava em cima da Mina de Corveira; o
  Mosteiro do Alto, colado no moinho. Afastados.
- 11 ids mortas na tabela (`templo`, `quartel`, `ferreiro`, `vila`, `bosque`,
  `mosteiro`, `caverna`, `mansao`, `porto`, `pantano`, `halvern`) removidas;
  nenhum código as usava como local.
- O marcador do feudo mostra o nome da colônia (era "Seu Feudo").
Resultado: 53 locais com coordenada, nenhuma capital inválida, nenhum par a
menos de 3% um do outro.

### Mapa — arrasto e marcadores (pedido do dono, com print)
- **"Arrasto um pouquinho e ele quase some"**: o arrasto somava o gesto à
  posição que ele mesmo atualizava a cada movimento, então o deslocamento era
  contado de novo a cada quadro. Agora soma à posição de quando o arrasto
  começou. E o mapa fica preso: nunca sai da janela nem mostra faixa vazia
  (`limitarPan`, zoom mínimo = a imagem cobrindo a janela). O zoom mantém o
  centro da janela.
- **O `onLayout` da janela do mapa não dispara no navegador**: o mapa ficava
  no zoom 0,85 e posição 0 de partida, e nenhum botão (＋, －, centralizar,
  ver tudo) fazia nada. No web a janela é medida direto no elemento com
  `ResizeObserver`; no celular continua o `onLayout`.
- **Ícones em cima da pintura**: as cidades desenhadas (Tessel, Corveira,
  Mareu, Vintra, Solgar, Casa de Pedra, Rês Enforcada) viraram áreas
  clicáveis invisíveis sobre o desenho, com contorno dourado só ao passar o
  mouse. Os outros lugares são um ponto pequeno (dourado = dá para ir,
  verde = já esteve, losango = sua colônia); o seu lugar é um anel. O nome
  aparece só no hover (web) ou no primeiro toque (celular, e o segundo toque
  viaja). Sem caixas de nome fixas por cima do mapa.
- Testado no navegador: arrastos fortes nas quatro direções param na borda
  com a imagem cobrindo a janela; hover mostra e esconde o nome; clique viaja.
