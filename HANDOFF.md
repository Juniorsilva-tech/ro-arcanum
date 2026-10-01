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

- **`HANDOFF.md` (este arquivo)** — estado atual, sessões recentes (88 em
  diante), problemas abertos e próximo passo. É o que se lê antes de trabalhar.
- **`HANDOFF-ARQUIVO.md`** — sessões 1 a 87, na íntegra e sem edição. Consultar
  quando for preciso saber *por que* alguma decisão antiga foi tomada. As
  sessões 13 a 23 foram movidas na sessão 40, 24 a 27 na sessão 42, 28 a 31 na sessão 43, 32 a 38 na sessão 44, 39 a 42 na sessão 48, 43 a 45 na sessão 51, 46 a 50 na sessão 56, 51 a 53 na sessão 58, 54 a 55 na sessão 62, 56 a 57 na sessão 69, 58 a 59 na sessão 78, 60 a 62 na sessão 79, 63 a 68 na sessão 83, 69 a 77c na sessão 88, e 78 a 87 na sessão 92.

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
| 51–53 | Claude — diretor de campanha, lembranças de feitos, ganchos dinâmicos |
| 54–55 | Claude — correções de ligações e história de bestiário/lugares/casas |
| 56–60 | Claude — elenco autoral, nomes femininos e ganchos |
| 61–62 | Gemini — intimidade e humor dos NPCs, cosmologia, Deuses, 7 Bruxas e crônicas do mapa |
| 63–68 | Gemini — Longcat, Space Bunny, testes de conteúdo, prosa gore/adulta, lore feudal realista |
| 69 | Claude — revisão de lore e termos das Sete Pecadoras |
| 70–77c | Gemini — Hermes no .bat, combate animado, auditoria de Vaelhorn, críticos, armas lendárias, Nichirin |
| 80–83 | Gemini — purificação da prosa, relevância do mestre, 10 eventos de infância e dinâmica familiar viva |
| 84 | Claude — revisão, rodízio de conteúdo, cultivos da colônia, mapa dos cartógrafos e partida |
| 85–86 | Gemini — sincronização definitiva Nous (Hermes), fim do pulo de IA e Longcat 2.5 Preview |
| 87–88b | Claude — segurança de chave, rito do mestre, técnica própria, vida/XP e linhagem |
| 89 | Codex — régua de conversa cotidiana e validação |
| 90 | Gemini — liberdade de sucessão pelo jogador/corte, vocações variadas e regência |

---

## Sessão 88 — Claude — vida que cresce, rito do mestre, linhagem e criação

Pedido do dono: "faça todos os itens" (herdeiros e sucessão, fama do sobrenome,
arma com fama, estilo do mestre, técnica própria), mais o rito do mestre para
quem já nasce bom, e a vida que parecia presa em 44.

**Vida parada em 44.** A vida só cresce com o nível (+2/+3 por nível), e só
luta e quatro verbos davam XP: quem vivia de conversa, ofício e investigação
ficava no nível 1. Agora todo teste de verdade dá XP (`engine/turn.ts`:
falha 1, sucesso 3+, crítico 6+, mais pela dificuldade; não soma se o verbo
já paga XP), e o ganho por nível subiu para 3 + resiliência. Banco de provas
depois disso: 8 de 20 faixas fora (as que ficaram fora estão a 1–2 pontos da
meta; as lutas "equilibradas" seguem 49–54%, o mestre 64%).

**Rito do mestre** (`engine/rito.ts`, `content/vaelhorn/ritoMestres.ts`).
Cada mestre tem nível de luta próprio (Torana 6 … Musashi 26) e vira um
adversário de prova que nunca aparece na estrada. "Pedir a prova do mestre"
(no Livro, junto do mestre) abre um duelo que para quando alguém chega a um
quarto da vida — ninguém morre, perder não tira dinheiro nem deixa cativo. A
luta é marcada como prova na criação (o mestre pode agir primeiro). Resultado:
- aprovado (venceu): aprende a primeira arte na hora, aprender com ele não
  gasta tempo, ganha a alcunha "Aprovado por X", o vale fica sabendo;
- promissor (tirou 40%+ das forças do mestre): aprender custa metade;
- cru: treino normal.
Em todos, o mestre diz o que falta pelos números da luta (precisão, guarda,
peso do golpe, fôlego) e forma opinião do talento (`treinar` com observador).
Prova de novo só depois de 30 dias. Medido: gênio de 18 anos bom de espada
contra Kesta (nível 10): 11 aprovado, 28 promissor, 21 cru em 60; contra
Musashi: cai sempre; novato contra Kesta: cai quase sempre.

**Linhagem** (`engine/linhagem.ts`). Casamento, gestação e filhos já existiam
no feudo (`engine/reino.ts`), mas o filho era ficha e o jogador nunca morria
(a velhice o deixava agonizante). Agora:
- todo herdeiro tem traço (nascido para o combate, mão firme, calmo demais,
  curioso, olhos de falcão, encantador), +2 no atributo dele;
- morreu de velhice com filho de 16+, o filho assume sozinho
  (`engine/mundo.ts`); em vida, "Passar o nome ao herdeiro" na aba Trono &
  Dinastia. O filho herda dinheiro (−10%), mochila, equipamento, feudo e a
  fama do nome; o mundo lembra da família pela metade (confiança dos NPCs /2,
  lembranças do pai apagadas); o pai entra em `camp.linhagem`. Só filho homem
  assume, pela regra do protagonista masculino (sessão 76) — ponto para o dono
  decidir.
- Fama do nome: todo fato público do jogador soma no lugar
  (`registrarFato`); na região, 5 pontos = conhecido, 15 = falado (−5% nas
  compras), 40 = lendário (−10%). O narrador recebe `personagem.linhagem`.

**Fama da arma** (`engine/famaArma.ts`): cada abate conta para a arma na mão
(a prova do mestre não conta). 10 abates = conhecida (+5% de dano), 30 =
lendária (+10%), com marco e boato. A fama é da arma, vai junto se ela mudar
de dono. Narrador recebe `armaEquipada.fama`.

**Estilo do mestre** (`engine/estiloMestre.ts`): quem ensina (ou aprova na
prova) marca o jeito de lutar — agressivo, defensivo, preciso, bruto — com
efeito no acerto, defesa, crítico e dano. Mestre com confiança −20 ou menos
recusa lição e prova. Ficha mostra estilo, arma famosa e o nome da família.

**Técnica própria** (`engine/criacao.ts`, no Livro): a fusão criava arte sem
efeito em combate. Agora, com maestria 40 e duas técnicas conhecidas, o
jogador escolhe princípio (corte, precisão, área, guarda, esquiva) e forma
(rápida, equilibrada, pesada); a engine calcula a potência pelas técnicas que
ele conhece e a maestria, com teto (melhor técnica +3, nunca acima de 26).
Custa 12 períodos e divide o limite de 3 criações por vida com a fusão.

Teste novo: `engine/rito.selftest.ts`, `engine/linhagem.selftest.ts` (no
`test:engine`).

**Prova do mestre verificada no navegador** (sessão 88): o botão aparece no
Livro quando o mestre está no lugar; um novato contra a Sarine perde em 4
rodadas, termina com 1 de vida, não perde dinheiro, e o resultado "cru" fica
em `camp.ritos`. O feed abre com "Prova do mestre · ainda cru".

## Sessão 88b — lema na boca do NPC e qual modelo narrou

O jogador recebeu uma cena em que a Greta dizia "A pedra permanece, rapaz".
É o lema da Casa de Halvet (`content/vaelhorn/casas.ts`), que ia no pacote da
cena duas vezes (campo `lema` e dentro de `descreverCasa`). O modelo usou o
lema como bordão numa fala de taverna.

- `engine/llm.ts`: `casasPresentes` não manda mais o lema; `descreverCasa`
  ganhou o parâmetro `comLema` (a tela continua mostrando o lema). Regra 4
  nova em "vícios de IA": ninguém fala por bordão, lema ou provérbio
  inventado; reação é frase comum do dia a dia.
- Qual modelo narrou: o rodízio de reservas e o `narrarComFallback` trocam de
  modelo sem avisar quando o escolhido falha. `EntradaFeed.modelo` agora
  guarda "provedor · modelo" de cada narração, e `ui/screens/Jogo.tsx` mostra
  em letra pequena acima do texto, ao lado do "▶ ouvir". Narração local (sem
  chave) não tem rótulo.

## Sessão 89 — Codex — régua de conversa comum e validação parcial

O dono relatou que conversas normais ainda estavam superficiais, pouco
imersivas e com português estranho. A causa encontrada foi de orientação: o
prompt exigia muitas falas e estrutura para toda cena, mas não dava ao modelo
um protocolo específico para responder a uma intenção social cotidiana.

Alterações feitas:
- `engine/llm.ts`: conversa comum agora escolhe uma pessoa em foco, responde
  diretamente ao que o jogador disse, usa 2–4 falas alternadas, dá uma
  informação concreta ou muda pequena na relação e evita monólogo de lore,
  aberturas genéricas e fila de NPCs;
- `engine/llm.ts`: regra explícita para português brasileiro revisado,
  concordância, regência, contrações naturais e reescrita de frases com cheiro
  de tradução literal;
- `engine/llm.ts`: regra de subtexto e vozes distintas por ocupação, humor,
  gesto e o que o NPC evita dizer;
- `engine/narrador.selftest.ts`: cenário de conversa comum verifica que a
  diretriz nova, a exigência de português natural e o limite de falas chegam ao
  prompt.

Validação desta sessão:
- `npm run typecheck`: passou;
- `git diff --check`: passou (apenas avisos de conversão LF/CRLF);
- `engine/narrador.selftest.ts` e `engine/narracao.selftest.ts` não puderam
  iniciar: o host devolveu `uv_os_get_passwd ENOMEM`, causado por falta de
  memória do processo antes da execução dos testes. Rodar novamente com os
  processos Node órfãos encerrados ou após reiniciar o ambiente;
- o conjunto completo `npm run test:engine` ainda não foi repetido.

Próximo passo recomendado: repetir os selftests sequencialmente e fazer uma
partida real com uma conversa de taverna, uma negociação e uma conversa com
familiar, comparando as respostas antes de mexer novamente no prompt.

---

## Sessão 90 — Gemini — Sucessão Dinástica Flexível: Escolha pelo Jogador ou Corte, Vocações Ricas e Regência

### Diretriz do Dono
- A sucessão de linhagem e feudo não deve ser uma regra engessada e automática (ex: primogenitura cega ou apenas o primogênito masculino).
- Quem responde quem assume deve ser tanto o **jogador** quanto os **NPCs/corte**.
- O jogador pode escolher expressamente quem assumirá — por exemplo, escolher um herdeiro mais jovem brilhante estrategista e fraco em combate, ou um guerreiro forte de inteligência mediana, ou qualquer outra combinação rica.

### Implementações Realizadas
1. **Perfis Vocacionais e Atributos Diversificados nos Filhos (`engine/types.ts`, `engine/reino.ts`)**:
   - Tipo `VocacaoHerdeiro`: `'estrategista'`, `'combatente'`, `'diplomata'`, `'batedor'`, `'guardiao'`, `'erudito'`, `'equilibrado'`.
   - Adicionados campos opcionais `vocacao?` e `inclinacao?` em `FilhoHerdeiro`.
   - `darLuzHerdeiro`: Cada herdeiro nasce com modificadores de vocação aplicados sobre a herança dos pais e uma descrição orgânica:
     * *Estrategista*: raciocínio altíssimo, percepção aguçada, físico franzino para combate.
     * *Combatente*: físico e resiliência formidáveis, precisão marcial, raciocínio simples e impulsivo.
     * *Diplomata*: carisma e persuasão de corte, une vassalos e evita derramamento de sangue.
     * *Batedor / Guardião / Erudito / Equilibrado*: perfis específicos.
   - `aprimorarAtributosHerdeiro`: No envelhecimento anual (`processarVidaFeudo`), o herdeiro desenvolve os atributos coerentes com sua vocação em vez de uma soma genérica.
   - IDs de nascimento agora garantem unicidade sequencial mesmo em partos múltiplos no mesmo dia/turno (`herdeiro_dia_turno_indice`).

2. **Escolha da Sucessão: Jogador vs Corte de NPCs (`engine/linhagem.ts`, `engine/reino.ts`)**:
   - `designarHerdeiroAparente(camp, filhoId)`: O jogador pode escolher formalmente QUALQUER herdeiro vivo a qualquer momento (jovem, mais velho, estrategista, guerreiro, príncipe ou princesa).
   - `deliberarSucessaoCorte(camp)` e `escolherSucessorPelaCorte(camp)`:
     * Se o soberano morrer sem deixar herdeiro formalmente proclamado, a Corte Feudal delibera com base nas facções e circunstâncias do reino:
       - O Marechal apoia o melhor combatente marcial para proteger o feudo;
       - O Chanceler e Mestre dos Espiões apoiam o estrategista pela sabedoria nas leis e cofres;
       - O Cônjuge apoia a harmonia familiar e a primogenitura.
     * Em crise militar/fronteira conflagrada, prevalece o combatente; em crise econômica/diplomática, prevalece o estrategista; em paz, ratifica a tradição.
   - `assumirLegado(content, camp, motivo, herdeiroIdEscolhido?)`:
     * Aceita o ID do herdeiro escolhido pelo jogador diretamente.
     * Preserva as vocações e traços individuais do novo governante na ficha do personagem.
     * Permite que herdeiras femininas assumam a campanha (`novo.genero = h.genero ?? 'm'`).
     * Suporta sucessão jovem com idade inferior a 16 anos sob **Conselho de Regência** (`sobRegencia: true`), concedendo a alcunha `'soberano jovem (sob regência)'` até a maioridade.

3. **Interface e Loja/Feudo (`ui/screens/Assentamento.tsx`, `ui/store.ts`)**:
   - Cards de herdeiros mostram vocação, traço e perfil completo de atributos.
   - Botão direto em cada herdeiro: "Passar o legado para [Nome]" (com aviso de regência se menor de 16 anos).
   - Painel dinâmico do "Conselho de Sucessão da Corte", exibindo as opiniões e justificativas dos conselheiros/cônjuge e a aclamação prevista da corte.
   - `passarLegadoAcao(herdeiroId?: string)` no store para suportar a seleção direta.

### Validação Executada
- `npm run typecheck`: 0 erros (TypeScript modo estrito).
- `npx tsx engine/linhagem.selftest.ts`: Aprovado (testes de jovem estrategista vs combatente, escolha livre do jogador, deliberação da corte por NPCs, herdeira feminina e regência).
- `npm run test:reino`: 100% aprovado.
- `npm run test:vaelhorn`, `npm run test:tsukimichi`, `npm run test:jornadas`, `npm run test:casas`: 100% aprovados.
- `npm run test:engine`: 100% aprovado em 480.6s (45 selftests + simulação longa de 6 campanhas × 10 anos sem travas e com 0 violações de invariantes).

---

## Sessão 91 — Gemini — Espadachim Samurai: Katana Japonesa, Haori do Andarilho e Resolução de Gargalos via Zanshin

### Diretriz do Dono
- Resolver os gargalos mecânicos identificados na auditoria técnica da classe Espadachim.
- A arma básica do Espadachim deve ser uma **Katana japonesa de samurai**, acompanhada de vestimentas clássicas inspiradas na iconografia samurai/ronin (quimono, haori, faixas e protetores tradicionais, inspirados em Jin Sakai, Musashi e guerreiros clássicos das referências fornecidas).

### Implementações Realizadas
1. **Arsenal & Vestimentas Clássicas (`content/vaelhorn/items.ts`, `content/vaelhorn/classes.ts`)**:
   - `katana`: Adicionada ao catálogo de armas de Vaelhorn. Lâmina curva de aço dobrado com gume único, empunhadura longa para duas mãos.
     * Atributo principal: `atributoAtaque: 'precisao'` (conecta-se diretamente aos +3 de Precisão inatos da classe).
     * `tipoArma: 'espada'` (aproveita 100% dos bônus de maestria, ritos e artes de espada).
     * Dano base: 12 cortante com dispersão reduzida (0.25 vs 0.30 da espada longa).
     * Propriedades críticas refinadas: `bonusCritico: 0.08` e `multiplicadorCritico: 1.95` (decapitação e corte limpo).
   - `haori_do_andarilho`: Adicionado ao catálogo de armaduras. Vestimenta tradicional com tecido escuro resistente a cortes leves, hakama e protetores laqueados leves nos antebraços. Concede +2 de Defesa com peso baixo (3), garantindo esquiva ágil e saque veloz.
   - Classe `espadachim`: Ficha atualizada para nascer com `katana` e `haori_do_andarilho` equipados e no inventário inicial.

2. **Resolução dos Gargalos de Combate (`engine/types.ts`, `engine/classe.ts`, `engine/combat.ts`)**:
   - **Gargalo 1: Add-clearing e Perda de Foco em Grupos**:
     * Criado o **Zanshin do Abate** (`focoZanshin` em `CombatActor`).
     * Ao abater um adversário (`alvo.vida <= 0`), o espadachim não perde seu ritmo marcial; o foco acumulado é preservado intacto para o próximo adversário via Zanshin.
     * Quando ataca o novo alvo, `bonusDeFoco` e `registrarFoco` herdam o `focoZanshin`, permitindo fatiar bandos em sequência fluida.
     * Adicionada a tag marcial `[Zanshin: ímpeto marcial preservado para o próximo oponente!]` no log de combate.
   - **Gargalo 2: Desvantagem Numérica e Flanqueamento por Bandos**:
     * Criado o **Zanshin Defensivo**: quando o Espadachim enfrenta múltiplos inimigos simultâneos (2 ou mais oponentes ativos em combate), ele recebe passivamente **+2 de Defesa**.
     * Esse bônus anula exatamente a penalidade de flanqueamento (-2 sofrido contra múltiplos adversários), refletindo a postura kenjutsu e percepção periférica de samurai.

### Validação Executada
- `npm run typecheck`: 0 erros (TypeScript estrito).
- `npx tsx engine/classe.selftest.ts`: 100% aprovado, incluindo testes do Espadachim Samurai (equipamento inicial da Katana, Haori do Andarilho, herança de Zanshin marcial no abate).
- `npx tsx engine/selftest.ts`: 100% aprovado (equipamento inicial de catálogo e integridade das 9 classes).
- `npx tsx engine/sistemas.selftest.ts`: 100% aprovado (448 combates de catálogo, compra, fusão e ascensão).
- `npx tsx engine/kimetsu.selftest.ts`: 100% aprovado (23 testes de integração com onis e nichirin).
- `npx tsx engine/tsukimichi.selftest.ts`: 100% aprovado (70 testes de Asora e Wasteland).
- `npm run balanco`: 100% validado em 500 simulações por nível.



---

## Sessão 92 — Claude — prosa e falas estranhas: o prompt empurrava para isso

O dono continua achando a prosa e as falas estranhas e sem sentido (exemplo
dele: na taverna, cada presente reage em fila à guarda do jogador com frase
solene — "A pedra permanece", "Fazia anos que não via essa postura num homem
que não estivesse morto" —, "Pelos deuses" no começo de fala, e passado
inventado: "o mestre o chamou de discípulo formal").

Diagnóstico, lendo o prompt real (`INSTRUCAO_SISTEMA`, ~21 mil caracteres):
várias regras pediam exatamente isso.
- "Registro de fábula sombria: frases de fôlego" → prosa empolada;
- "REALISMO VÍVIDO" com lista de cheiros e "reações corporais" → comparação e
  sensação empilhadas;
- "LINGUAGEM RÚSTICA … imprecações medievais (pela peste, pelos deuses…)" →
  praga artificial em toda fala;
- 5a: "Discípulo Dedicado" → "mestres, ferreiros e guerreiros reconhecem sua
  disciplina" → coro de todos os presentes;
- 2f: família "olha com o peso do tempo", "lembra de sacrifícios" → passado
  inventado;
- "Plante uma coisa que ainda não se explica" → fala enigmática;
- linha de estilo de toda cena não-combate: "PROSA VIVA, CRUA E IMERSIVA …
  gore pesado … volúpia carnal" mesmo numa conversa calma;
- e a "DIRETRIZ DE CONVERSA COMUM" do Codex (sessão 89) nem entrava na aba
  Dizer: o fato é "Você diz: …" e a regex só pegava "dizer".

Alterações (`engine/llm.ts`), preservando as regras da sessão 89:
- VOZ: prosa clara e direta de romance brasileiro; no máximo uma comparação
  por cena e um detalhe de sentido por parágrafo; corte frase bonita vazia;
- "GENTE DE VERDADE" no lugar de "REALISMO VÍVIDO": reação proporcional,
  ninguém é oráculo;
- fala coloquial do interior; praga no máximo uma por cena e só com susto ou
  raiva de verdade;
- 2f: só cita passado em comum que está em `lembraDeVoce`, `jaAconteceu` ou
  `marcasDaInfancia`; 2g enxuta; 5a: o treino é notado num detalhe, em uma
  frase, nunca em coro; "plante" vira "de vez em quando, um detalhe concreto";
- exemplo curto de cena no tom certo (NPC fictício "Bento", para não vazar
  fala para um NPC real) e o contra-exemplo do caso do dono;
- `conversaComum` reconhece `tipoAcaoLivre === 'dizer'` e "diz";
- linha de estilo vira "PROSA CLARA E NATURAL": o tom acompanha a cena (cru
  só na violência, explícito só na intimidade).

Teste: `engine/narrador.selftest.ts` ganhou 4 checagens (Dizer recebe a
diretriz de conversa, cena comum não pede gore, sistema sem "fábula sombria"
e com o exemplo, sem a lista de pragas).

Pendente observado: pai, mãe e irmãos têm `vozNarrativa`, `personalidade` e
`corpo` genéricos (`engine/familia.ts`, `npcDeParente`) — "Fala com a
intimidade e a memória de quem acompanhou sua infância". O modelo inventa a
voz. Vale gerar voz pelo ofício e pelo talento de cada um.

## Sessão 92b — Claude — teste de ações na taverna: briga e morte de NPC

O dono pediu para testar falas, perguntas, ações, ataques e "matar todo
mundo na taverna". Teste no navegador (servidor de dev, save de teste), com o
narrador local e com a Nous do servidor de dev (o próprio app busca o token
em `/api/hermes/token`; não li credencial nenhuma).

Achados:
- Dizer funciona: pergunta e acusação viram fala [você], não verbo.
  ("Me vê uma cerveja…" executa Beber E manda a fala — aceitável.)
- Ação livre violenta não tinha regra. `ui/freeAction.ts` só casava o
  infinitivo: "agrido", "ataco", "soco", "esfaqueio", "chuto" iam crus
  para o narrador ("Você tenta o seguinte: …"), que inventava o resultado sem
  consequência nenhuma. "Mato todo mundo na taverna" virava `cacar` e
  sorteava um "Bandido armado" de fora da cena.
- O fallback do provedor troca de modelo sem avisar (a Nous respondeu com
  ling-3.0-flash e longcat-2.5, não com o hermes-405b configurado). O rótulo
  da sessão 88b mostra isso na tela.
- A guarda da praça tratou o assassino da taverna ao lado como "o forasteiro
  que apareceu ontem": nada no pacote dizia o que o NPC sabia.

Alterações:
- `engine/briga.ts` (novo): briga com quem está na cena. Cada NPC adulto
  presente vira adversário gerado na hora pelo ofício (luta = nível 5, velho
  = 1, comum = 2, mestre = nível do rito). Não letal: dano de punho do
  jogador, sem amputação, quem cai fica nocauteado (medo +12, disposição
  −15, confiança −10), derrota não rouba. Letal: quem cai morre
  (`npcState.vivo = false`, `registrarMorteFamiliar` se for parente), fato
  público `assassinato`, guarda −15 e vila −10 por morto, testemunhas com
  medo +25. Menor de 18 nunca entra.
- `engine/combat.ts`: `iniciarCombate` aceita `briga` (marcada antes de
  alguém agir); `CombatState.briga`; derrota não letal sem roubo; vitória não
  letal sem saque e sem fama de arma; `avaliarAmputacao` não age em rito nem
  em briga não letal.
- `ui/freeAction.ts`: `classificarBriga` com radicais conjugados
  (agrid/atac/soc/chut/esfaque/mat…), "todo mundo" = todos os presentes,
  alvo por qualquer palavra do nome ("a Bael" acha "Sargenta Bael"),
  conversa ("sobre o ataque") e "no mato" não viram briga; lâmina na frase =
  letal.
- `ui/store.ts`: `brigarAcao`; `acaoLivre` (aba Fazer) abre a briga;
  `fecharLuta` chama `concluirBriga` e usa o fato dela ("Mortos · …",
  "Briga vencida/perdida").
- `engine/llm.ts`: cada presente recebe `sabeDoQueVoceFez` (assassinato ou
  briga pública do jogador na mesma região, últimos 60 dias) e o sistema
  manda reagir a isso antes de tudo.
- Teste novo `engine/briga.selftest.ts` (no `test:engine`).

Verificado no navegador: soco na Elza → briga não letal de punho; "Parto pra
cima do Bastian" → o pai (batedor) ganhou, bolsa intacta; "Saco a espada e
mato todo mundo na taverna" → seis mortos de verdade, fora da cena, boato
público, guarda −93 e vila −60; na praça, com a Nous, a Sargenta Bael
bloqueia o caminho, cita as mortes e ameaça prender.

Pendente:
- a guarda só reage na narração; não há prisão nem perseguição mecânica
  por reputação muito negativa. Vale um sistema de captura/fuga;
- violência sem alvo nomeado com 2+ pessoas na cena ainda cai na narração
  livre (ambíguo de propósito);
- família com voz genérica (`engine/familia.ts`, `npcDeParente`).
- `nousresearch/hermes-3-llama-3.1-405b:free` saiu da lista de sugestões:
  a Nous devolve 404 ("Model not found"). Saves com ele escolhido caem no
  fallback (por isso as cenas vinham de ling-3.0-flash ou longcat-2.5). O
  Solar (padrão) também falhou no teste de hoje; o longcat-2.5 respondeu.

## Sessão 92c — Claude — a guarda: procurado, perseguição e cela

Pedido do dono: prisão e perseguição pela guarda. Antes a guarda só reagia
na narração (sessão 92b).

`engine/guarda.ts` (novo):
- **Procurado por região** (`camp.procura[regiao]`): `registrarCrime` soma
  pontos. Sangue: 40 por morto na briga letal, 30 por guarda morto, 20 por
  fuga da cela. Arruaça: 10 por nocauteado quando alguém viu ou quando o
  alvo é da guarda (`engine/briga.ts`). Esfria: arruaça 3/dia, sangue
  0,5/dia (fugitivo 0,25/dia).
- **Perseguição**: `checarPerseguicao` roda depois de toda cena (o
  `narrar` do store virou um invólucro de `narrarCena`). Chance: com guarda
  na cena 0,35 + pontos/100 (teto 0,95); sem guarda, pontos/100 × 0,5 (×0,15
  no ermo). Uma abordagem por dia, sorteio derivado (não gasta o RNG da
  campanha).
- **Abordagem** (`camp.abordagem`): render-se → cela; subornar (arruaça 10 +
  pontos/2, sempre cola; sangue 60 + pontos, chance pelo social, falha =
  cela e a moeda vai embora); fugir (físico e percepção; falha = luta);
  lutar → combate com a patrulha (`patrulha_guarda` nível 4, sargento nível
  7 no sangue, gerados na hora). Durante o cerco, verbos, viagem, briga e
  texto livre da aba Fazer ficam travados; Dizer continua.
- **Cela** (`camp.prisao`, condição `preso`): pena de arruaça = pontos/10
  dias (mín. 2) com fiança de 10 + pontos; sangue = 15 dias a cada 40 pontos
  (teto 120), sem fiança. Arma confiscada. `agirNaCela`: cumprir (passa os
  dias, devolve a arma, limpa a procura, cura, guarda +10), fiança, fugir
  (sucesso: livre, sem a arma, fugitivo; falha: +10 dias e −30% de vida).
  Preso não age, não viaja, não briga, e a cena não tem ninguém do lugar
  (`calcularContexto` devolve presentes vazios).
- `engine/combat.ts`: patrulha marcada em `iniciarCombate`; derrota contra a
  patrulha não rouba (`concluirConfrontoGuarda` leva à cela).
- `engine/llm.ts`: `personagem.procuradoAqui`, `cercadoPelaGuarda`,
  `naCela`, com a regra de que isso é decisão da engine.
- `ui/store.ts`: `responderGuardaAcao`, `celaAcao`; `fecharLuta` trata a
  patrulha. `ui/screens/Jogo.tsx`: cartões "A guarda te cercou" e "Na cela
  da guarda" no lugar das opções.
- Teste novo `engine/guarda.selftest.ts` (31 checagens, no `test:engine`).

Verificado no navegador: soco na Sargenta Bael → arruaça → a Bael te para →
cartão do cerco → "Render-se" pelo clique → cela de 2 dias, fiança 20,
espada confiscada → briga bloqueada na cela → cumprir → dia 345, espada de
volta, procura limpa.

Pendente: crimes de verbo (furtar pego, agredir com testemunhas) ainda só
mexem na reputação, sem `registrarCrime`; a guarda que você acabou de
nocautear pode ser a mesma que te aborda logo depois.

## Sessão 92d — Claude — a guarda no mundo: cidades, NPCs, assentamento e cartaz

Pedidos do dono: fazer os pendentes da 92c; combinar a guarda com as
cidades e com o assentamento dele, "não só comigo"; e trocar as falas da
guarda por coisa da vida real ("vivo ou morto", procurado…).

Pendentes da 92c resolvidos:
- Crime de verbo: em `engine/turn.ts`, todo efeito aplicado que derruba a
  reputação com a guarda (agredir com sucesso, furtar pego…) chama
  `registrarCrime('arruaca', |delta| × 1,5, "<verbo> em <lugar>")`.
- Quem foi nocauteado na briga de soco ganha `flags['nocaute.<id>'] = dia`;
  `guardaNaCena` ignora essa pessoa no mesmo dia.

Guarda e cidades (`engine/guarda.ts`):
- `forcaGuarda(local)`: cidade viva = 20 + pop/4 (teto 30) + 10 por muralha
  − desordem/2 − 20 com fome − 15 com epidemia (5 a 100); fora de cidade, 30;
  no assentamento do jogador, a segurança dele.
- A força pesa na chance de abordagem (×0,5 a ×1,5), no tamanho da patrulha
  (≥70: mais um guarda; <25: um a menos) e no suborno (cidade com fome: ×0,7
  e +15% de chance no sangue; cidade rica: ×1,3).
- `regiaoDe` também acha a região dos sítios de colônia.
- `OFICIO_GUARDA` exportado e mais estrito (com fronteira de palavra:
  "guardião itinerante" não é guarda; antes o Muichiro aparecia como patrulha).

Crime entre NPCs (`engine/crimeUrbano.ts`, novo, no tique diário de
`engine/mundoVivo.ts`):
- cada cidade com 5+ moradores sorteia furto, briga ou morte pela desordem e
  pela fome, menos pela força da guarda (sorteio derivado do dia);
- furto tira do tesouro; morte tira um morador e vira fato público;
- pego: desordem −2; não pego: +3 (morte +6);
- metade das vezes que pega, o culpado tem nome (o morador mais apertado,
  fora parentes, guarda, grupo e menores): `VidaCivil.objetivo = 'preso'`,
  `presoAte` = 5/3/40 dias; vira fato público; sai sozinho em
  `engine/autonomia.ts` ("cumpriu a pena").
- `'preso'` entra na união de `objetivo` e é tratado como `'cativo'` em
  availability, convívio, formação, grupo, localEfetivo e progressão.

Assentamento do jogador:
- No próprio assentamento a guarda é dele: `guardaNaCena` vazio, patrulha de
  fora com chance × max(0,03; 0,3 × (1 − segurança/100)).
- Briga/morte do jogador lá dentro (`engine/briga.ts`): sem procura, mas
  estabilidade −10 por morto (−3 por nocaute), humor dos colonos −15 (−4).
- Morte na cidade sobe a desordem dela (+5 por morto).
- Audiências novas (`engine/audiencias.ts`):
  - `guarda`: procurado por sangue (40+) na região da colônia → a guarda da
    região vem ao portão (no máximo a cada 15 dias). Entregar-se (só se o
    jogador estiver lá) → cela; pagar (50 + pontos de ouro) → procura pela
    metade; recusar → com segurança ≥ 40 ela vai embora, senão invade (25% do
    tesouro, ordem −10, humor −10).
  - `crime`: colono briguento ou de humor < 20, com ordem < 50, fere ou mata
    outro (mata se humor < 10, 25%). Sentença: cela, expulsar, enforcar (só
    morte) ou perdoar.

Cartaz e caçador de recompensa ("vida real"):
- `cartazDe(procura)`: sangue tem recompensa = pontos × 1,5; "vivo ou
  morto" com 120+ pontos ou fugitivo. Arruaça não tem cartaz (é queixa).
- `registrarCrime` prega cartaz novo (fato público `cartaz_procurado`)
  quando o caso vira sangue ou passa a "vivo ou morto"; fugir da cela também.
- Com "vivo ou morto", no ermo sem guarda, quem aparece é o caçador de
  recompensas (chance 0,3; `abordagem.cacador`): render-se = entregue na
  guarda; suborno = recompensa + 20, sempre aceita; lutar = `CACADOR` nível 8
  (besta); matar o caçador no mato não soma sangue (ninguém viu).
- Falas da engine reescritas: "Ei, você. Parado aí.", "É ele, o do cartaz.",
  "Vivo ou morto, tanto faz para o juiz.", "Mãos onde eu possa ver",
  "Você está preso em nome da lei de …", "Não vi ninguém por aqui".
- Narrador: `procuradoAqui` traz `cartaz`, `recompensa`, `vivoOuMorto`; a
  regra pede guarda falando seco e prático e gente comum reconhecendo o rosto
  do cartaz.
- Tela: o cartão do cerco mostra "PROCURADO — VIVO OU MORTO · crime ·
  recompensa" e vira "Um caçador de recompensas te achou" quando é ele.

Teste novo: `engine/guardaMundo.selftest.ts` (no `test:engine`): força por
cidade, guarda forte aborda mais, nocaute, crime de verbo, prisão de NPC e
soltura, assentamento (patrulha quase não entra, a guarda vem ao portão,
pagar, entregar-se, invasão), crime de colono, sangue dentro da colônia,
cartaz, "vivo ou morto", caçador.

Pendente: o caçador de recompensas não tem nome nem memória (cada um é
novo); a guarda da cidade ainda não persegue NPC fugitivo; o jogador não
pode caçar recompensa de outros.

Ajuste de teste (92d): `engine/kimetsu.selftest.ts`, "Calendário anual e
simulação em lote equivalem a dias consecutivos", passou a comparar o estado
sem `livro`. O Livro sobe de camada quando um mestre está onde o jogador está
no momento da atualização; dia a dia há 740 momentos, no lote só um. Com o
crime urbano mexendo na fome, a Sarine foi para casa (a taverna) no dia 143
e o Livro do caminho dia a dia ficou "acessível". O resto do mundo segue
idêntico nos dois caminhos. Também: NPC preso (`objetivo 'preso'`) não está
em lugar nenhum visitável (`localEfetivo` devolve vazio).

## Sessão 92e — Claude — caçador com nome, fugitivos e caçada de recompensa

Pedido do dono: fazer os três pendentes da 92d.

**Caçador de recompensas com nome e memória** (`engine/guarda.ts`):
- `camp.cacadores[regiao]`: nome (lista fixa, sem repetir), nível (começa 8,
  teto 14), encontros, último desfecho, pagamentos. `cacadorDaRegiao` cria
  um quando não há; morto, a região fica 30 dias sem caçador e depois vem
  outro, com outro nome.
- Ele só aparece no ermo, sem guarda, com cartaz "vivo ou morto".
- Fala muda com a memória: primeiro encontro; "De novo você… da última vez
  você correu"; "Da última vez você pagou… o meu preço também"; "Você me
  deve um braço" (se escapou ferido).
- Correr ou escapar ferido: nível +1. Pagar: preço +25% por pagamento (e não
  esfria mais a procura). Te entregar: fica na memória.
- A criatura é uma por região (`patrulha_guarda_cacador_<região>`), refeita
  com o nível atual a cada luta.

**Fugitivos** (`engine/crimeUrbano.ts`):
- `VidaCivil.presoPor` guarda o crime.
- Preso foge com chance 0,5% + 3% × (1 − força/100) por dia. Vira
  `camp.procuradosNpc[id]` (crime, cidade, região, recompensa 25/15/80, "vivo
  ou morto" se foi morte), com cartaz como fato público, e se esconde num lugar
  de ermo da região (`deslocado`, então aparece lá).
- `engine/autonomia.ts`: fugitivo com cartaz não toma decisão nenhuma (não
  volta para casa).
- A guarda caça: chance força/100 × 4% por dia. Achou: cela com o dobro da
  pena. Depois de 120 dias o cartaz "desbota" e o caso some.

**O jogador caça a recompensa** (`engine/briga.ts`):
- Briga de soco contra fugitivo: quem cai é entregue à guarda (cela com pena
  dobrada), o jogador recebe a recompensa (sai do tesouro da cidade), a guarda
  sobe +5, e não há arruaça.
- Luta letal: com "vivo ou morto", o corpo paga e não é crime; sem, não paga
  e conta como assassinato ("o cartaz pedia vivo").
- `ui/freeAction.ts`: "prendo", "capturo", "amarro" e "imobilizo" abrem briga
  de soco.
- `engine/llm.ts`: `cartazesDaRegiao` (nome, crime, recompensa, onde foi
  visto) no pacote, e `procurado` em cada presente que tem cartaz, com regra
  de como a pessoa reage.
- `ui/screens/Jogo.tsx`: "cartazes na praça" no painel "o que está aberto".

Teste novo: `engine/recompensa.selftest.ts` (24 checagens, no
`test:engine`). `guardaMundo.selftest` ajustado ao id do caçador por região.

Verificado no navegador: o painel mostra "Vess — a morte no beco — 80
moedas, vivo ou morto — visto por último em A Cripta" (estado injetado).

Pendente: o caçador não caça os fugitivos NPC (só o jogador); o fugitivo não
se defende de outro jeito além de lutar (não tenta comprar o silêncio).
