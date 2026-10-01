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

- **`HANDOFF.md` (este arquivo)** — estado atual, sessões recentes (78 em
  diante), problemas abertos e próximo passo. É o que se lê antes de trabalhar.
- **`HANDOFF-ARQUIVO.md`** — sessões 1 a 77c, na íntegra e sem edição. Consultar
  quando for preciso saber *por que* alguma decisão antiga foi tomada. As
  sessões 13 a 23 foram movidas na sessão 40, 24 a 27 na sessão 42, 28 a 31 na sessão 43, 32 a 38 na sessão 44, 39 a 42 na sessão 48, 43 a 45 na sessão 51, 46 a 50 na sessão 56, 51 a 53 na sessão 58, 54 a 55 na sessão 62, 56 a 57 na sessão 69, 58 a 59 na sessão 78, 60 a 62 na sessão 79, 63 a 68 na sessão 83, e 69 a 77c na sessão 88.

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

## Sessão 78 — Claude — revisão das sessões 70 a 77c do Gemini

Títulos: as duas últimas sessões do Gemini vinham como "72" e "73", números
já usados; viraram 77b e 77c (texto intacto). Sessões 58 e 59 foram para o
arquivo. Commit `9101ff9` guarda o trabalho do Gemini como entregue; as
correções abaixo vêm num commit separado.

Confirmado e mantido: correção do .bat (o `(S/N)` fechava o bloco `if`),
caminho do Hermes em LOCALAPPDATA (nenhum token impresso nem gravado),
troca de arma em combate, `marcosRecentes` sem "dia X:" repetido, UI do
combate, abas de Mochila e Forja, protagonista sempre masculino, passivas
das armas lendárias, cores da Nichirin.

Defeitos encontrados e corrigidos:
- Queimadura e sangramento matavam oni (o veneno já deixava o oni com 1 de
  vida). Agora têm o mesmo piso: oni só morre por Nichirin ou sol.
- Contra-golpe do Bastião de Halvet: o ataque inimigo às vezes chega numa
  cópia do ator, então os 7 de dano iam para a cópia e o log mentia; e quando
  acertava o original, o inimigo morria sem a luta acabar. `contraGolpe`
  acha o ator real, não mata oni, e o turno inimigo verifica a queda.
- `peso_imperial` tirava 2 de acerto a cada golpe, até o piso. Agora uma vez
  por alvo (`EstadoTatico.abalado`).
- `flexionarOficio` usava ``, que não reconhece letra acentuada: "artesã"
  nunca virava "artesão". Tabela de pares com fronteira `\p{L}`; entraram
  mercador/mercadora e soldado/soldada.
- O log de crítico gritava ("desfere um GOLPE CRÍTICO devastador", emoji). O
  log vai para o narrador; voltou a "acerta X em cheio … [crítico]". A UI
  continua destacando (procura "crítico").
- `scripts/test_nichirin_cores.ts` importava `jogadorAtor`, não exportado
  (typecheck falhava). Exportado.

Nichirin conforme o cânone que o dono mandou:
- A lâmina só muda de cor na mão de quem domina a Concentração Total
  (`dominaConcentracaoTotal`: qualquer arte `respiracao_*`/`hinokami*`, ou
  o treino de quase-morte). Novato empunha e o aço fica neutro; o despertar é
  checado de novo ao equipar e ao começar combate.
- A "marca" que puxava a cor preta era `classeId === 'cacadora'` (a classe
  Caçador). Agora é a Marca de verdade (`temMarca`).
- A Lâmina de Yoriichi tinha a cor gravada no item do catálogo em tempo de
  jogo (mutava o conteúdo compartilhado). A cor preta agora vem no próprio
  item em `content/vaelhorn/items.ts`.
- A instância desperta usava `Date.now()` no id, o que quebra a
  reprodutibilidade da engine. Agora `lamina_nichirin_azul_1`, `_2`…
- Lore da preta: por muito tempo tida como sinal de má sorte.
- Nova ação tática `lamina_carmesim` (akatō): exige Nichirin desperta e a
  Marca, custa 4 de vigor, dura 3 rodadas; golpe em oni nesse tempo segura a
  regeneração (`imuneRegenTurnos` 2). Botão em Combate quando disponível.

Testes novos em `engine/sistemas.selftest.ts`: oni não morre de sangramento,
contra-golpe encerra a luta, ofício flexionado, Nichirin só com Concentração
Total (id determinístico, catálogo intacto), Lâmina Carmesim pede a Marca.

Pontos de design deixados para o dono decidir: protagonista obrigatoriamente
masculino (`genero: 'm'` no tipo); críticos bem mais fortes (janela até 60%,
multiplicador até 2,4, +10% de dano por ponto de modificador, sem dispersão
para baixo no crítico). O .bat já não oferece login quando o token expira.

---

## Sessão 79 — Claude — o narrador aprende com o StoryZone e o AI Dungeon

O dono mostrou capturas e um capítulo do StoryZone, e um resumo técnico dele e
do AI Dungeon. O que veio daí, sempre com a engine como fonte da verdade:

1. **Luta narrada por batidas.** `fecharLuta` guarda o log do combate antes de
   `fecharCombate` e manda como `batidasCombate`. O narrador recebe as linhas
   numeradas (sem emoji, sem "subiu de nível", sem "Vitória") e escreve um
   parágrafo curto por batida, na ordem, sem inventar golpe, ferida ou morte;
   fecha com o que ficou e um gancho. Antes o modelo só recebia "A luta
   terminou e você ficou de pé".
2. **Fazer / Dizer** no campo de ação livre (`ui/screens/Jogo.tsx`). Dizer
   manda as palavras exatas como fala `[você]`; passa pela engine do mesmo
   jeito (o verbo é classificado), mas fala nunca abre combate. O texto vai
   por `falaJogador` no store e é consumido pela próxima narração.
3. **Ritmo e gancho** no prompt de sistema: um parágrafo, uma ideia; frase curta
   depois de trecho longo; abrir pelo corpo; lista de clichês a evitar; a cena
   termina numa situação que pede decisão.
4. **Estilo do narrador** em Configurações (`ui/screens/EstiloNarrador.tsx`,
   `config.estilo`): extensão Curta 3–5 / Média 4–7 (padrão, igual antes) /
   Longa 8–12; ritmo Atmosfera / Equilibrado / Trama rápida; menção à decisão
   "Mostrar minha ação" ou "Direto à consequência".
5. **Modo capítulo** (abertura da campanha, chegada de viagem, capítulo novo):
   8–12 parágrafos com estrutura corpo → lugar → presentes → tensão do pacote →
   gancho, e proibição de fato novo sobre o mundo.
6. **Lembre o narrador** (`camp.lembretesNarrador`, até 8, 200 caracteres):
   entram na mensagem como memória, com o aviso de que o pacote vence e de que
   não mudam dinheiro, itens, feridas nem relações.
7. **Ouvir a cena**: botão "▶ ouvir" em cada narração, com `expo-speech` (voz do
   aparelho, local, sem custo). `ui/voz.ts` tira colchetes e travessões.
8. **Trava de menores na engine** (`engine/protecao.ts`): com jogador ou
   presente abaixo de 18 anos, o pacote perde o `corpo` dessas pessoas, a
   diretriz de estilo perde a parte adulta e a mensagem ganha uma restrição
   inviolável. O dono tinha recusado isso antes (item 2 da sessão 69) e pediu
   "todos os itens" desta rodada, que incluía a trava.

Extra: o feed restaurado do save mantinha ids f0, f1… e as entradas novas
repetiam esses ids (aviso de chave duplicada do React). `renumerarFeed`
renumera ao carregar.

`montarMensagemNarracao` agora é exportada e recebe o estilo; `ResultadoTurno`
ganhou `tipoAcaoLivre`, `batidasCombate` e `modoCena`, todos opcionais.
Teste novo `engine/narrador.selftest.ts` (no `test:engine`).

Do AI Dungeon, ficou de fora de propósito: modo "Story/Trama" (o jogador ditar
fatos do enredo contradiz a engine), memória por embeddings (a engine já tem
marcos, Livro e memória dos NPCs), cartões de mundo por palavra-chave (o pacote
já escolhe por relevância). O "Author's Note" do AI Dungeon é o que fizemos com
o estilo: instrução curta logo antes do pedido.

Não testado com narração real (não uso a chave da Nous do dono). Verificado no
navegador em modo local: painel de estilo grava, aba Dizer põe a fala no feed,
"ouvir" alterna para "parar", lembretes entram e saem, ids do feed únicos.

### Sessão 79 (continuação) — narradores grátis em rodízio

O dono não tem dinheiro para modelo pago e pediu provedores grátis com limite
alto. Pesquisa (setembro de 2026): a OpenRouter sem créditos dá ~50 pedidos
por dia nos modelos `:free`, e a lista antiga de sugestões já não existia.
Groq, Mistral, Google Gemini e Cerebras têm camada grátis com API no formato
da OpenAI e aceitam CORS (testado com preflight; a NVIDIA NIM não aceita, por
isso ficou de fora da versão web).

- `engine/llm.ts`: `LlmProvider` ganhou `groq | mistral | gemini | cerebras`
  (`ProvedorCompat`) e a tabela `PROVEDORES_GRATIS` (URL, modelo padrão,
  sugestões, onde pegar a chave, limite e aviso). `chamarOpenRouter`,
  `chamarStreamCompat` e `testarChave` passaram a usar `urlChat`,
  `cabecalhos` e `modeloPadraoDe`, então os quatro narram com o mesmo código.
  `listarModelos` lê `/models` dos compatíveis. `narrarComFallback` troca de
  modelo em qualquer provedor que não seja a Anthropic.
- Sugestões da OpenRouter trocadas pelos `:free` que existem hoje (Gemma 4,
  Nemotron 3, Qwen 3.8, Inkling); modelo padrão da OpenRouter virou
  `google/gemma-4-31b-it:free` (o anterior, rocinante-12b, é pago).
- `config.reservas` + `ui/screens/ReservasGratis.tsx`: chaves grátis salvas no
  aparelho. `narrar` tenta o narrador principal e, se falhar (limite, rede,
  recusa), cada reserva na ordem; sem principal, as reservas narram. Somar as
  camadas grátis é o que dá fôlego sem pagar.
- Avisos na tela: Mistral grátis exige aceitar treino com os dados; Gemini
  grátis também usa o conteúdo e o filtro dele bloqueia cena adulta; Groq pode
  recusar cena adulta; Cerebras pode ter passado a pedir cartão.

Verificado no navegador: o painel abre, "Testar" com chave falsa faz a
chamada real à Groq e mostra "chave da Groq inválida ou sem permissão (401)".
Bug achado e corrigido na hora: seletor do zustand com `?? []` dentro criava
array novo a cada render (laço infinito).

Cena adulta: cada reserva tem "Testar cena adulta" (usa `testarCenaAdulta`, a
mesma chamada curta do narrador principal). Recusa já conta como falha na
narração (`interpretarResposta` devolve erro), então uma cena recusada passa
sozinha para a próxima reserva. Ordem do rodízio: Mistral, Groq, Cerebras,
Gemini (o de filtro mais duro por último). Não sei, sem chave, quais modelos
grátis narram sexo hoje; o botão existe para o dono descobrir no aparelho.

Cada cartão de reserva tem o link para criar a chave (abre no navegador com
`Linking.openURL`) e o caminho até o botão, em `PROVEDORES_GRATIS[*].linkChave`
e `.passos`. As quatro páginas responderam (a da Mistral redireciona para o
login).

Com a chave salva, o cartão da reserva busca os modelos da própria conta
(`listarModelos` → `/models` do provedor) e mostra até 40 como botões, com os
recomendados primeiro; sem chave, mostra as sugestões fixas. A busca roda ao
abrir o cartão (se já há chave) e a cada Salvar/Testar. Não testado com chave
real; com chave falsa a lista fica nas sugestões, como esperado.

Lista de modelos com avaliação: `PROVEDORES_GRATIS[*].notas` diz o que se sabe
de cada modelo conhecido (★ = recomendado; "costuma recusar sexo"; "prosa
fraca"), e `notaDoModelo` dá uma leitura pelo nome para os desconhecidos
(grande, leve, experimental, feito para código). Recomendados sobem para o
topo. "Testar cena adulta" grava o veredito em `config.testesAdulto`
("provedor:modelo"), e o botão do modelo passa a mostrar "✓ narra adulto" ou
"✗ recusa adulto". As notas são expectativa, não teste: o veredito que vale é o
do botão.

O dono colou as chaves da Groq e da Mistral e "não roda"; a Mistral dizia
"travado". CORS e endpoints conferidos (preflight de `/models` e de chat OK nos
três). O erro resumido escondia o motivo: `explicarErro` agora mostra a frase
do próprio provedor (lê `{error}`, `{detail}` e o `[{error}]` do Gemini) e, na
Mistral, lembra que a chave só funciona depois de escolher o plano grátis
Experiment (e que chave nova leva minutos para ativar). Se a lista de modelos
da conta não vier, o cartão diz para tocar em Testar e ver o motivo. Falta a
mensagem real do aparelho do dono para fechar o diagnóstico.

Print do dono (admin.mistral.ai): em 2026 o plano "Gratuito" da Mistral dá
US$ 10/mês em créditos de API; o "Experiment" de 1 bilhão de tokens não existe
mais. Textos do cartão da Mistral atualizados (limite, passos e dica de erro:
a chave vem de console.mistral.ai → API Keys, não do Le Chat/Vibe). Ainda sem a
mensagem de erro real do aparelho.

Confirmado pelo console da Mistral (26/09/2026): "Sua organização está no plano
Free. Atualize para Pro para ativar suas chaves de API." A API da Mistral não é
mais grátis. O cartão diz isso, a nota do Large perdeu a ★ e a Mistral foi para
o fim do rodízio (ordem agora: Groq, Cerebras, Gemini, Mistral). O dono colou a
chave da Mistral no chat; não a usei, e recomendei apagar.

A Groq funcionou no aparelho do dono, e o print mostrou dois defeitos:
- "Testar cena adulta" marcou ✓ com a amostra "I’m sorry, but I can’t help with
  that." O apóstrofo curvo não casava com a lista de recusa. `detectarRecusa`
  normaliza apóstrofos e ganhou "can't help with that" e afins; o teste de
  conteúdo agora só dá ✓ se não for recusa, estiver em português
  (`foraDeContexto`) e tiver corpo de parágrafo (≥160 caracteres). Os vereditos
  antigos (`config.testesAdulto`) são ignorados; os novos vivem em
  `config.vereditos` por "provedor:modelo", com `adulto` e `gore`.
- Novo "Testar gore" (`testarConteudo(cfg, 'gore')`, cena de machado no ventre);
  a linha do modelo mostra ✓/✗ para adulto e para gore.
- A conta Groq do dono lista só gpt-oss-120b/20b, qwen3.8-27b e modelos de voz
  (orpheus) e árabe (allam): o Llama 70B saiu do catálogo. Padrão da Groq virou
  `qwen/qwen3.8-27b`; voz/árabe/compound saem da lista.
- `semPensamento` tira `<think>…</think>` (Qwen 3.x e R1 mandam o raciocínio
  junto) antes de interpretar a cena e antes do teste de conteúdo.

### Sessão 80 (Gemini) — Diagnóstico de Modelos Gratuitos, Injeção de Atributos/Arma e Purificação da Prosa
- **Diagnóstico da Nous / Modelos**:
  * Testados 417 modelos na API da Nous Research. Modelos comerciais (Claude, GPT, Qwen pagos) exigem créditos (`status: 404`).
  * `stealth/space-bunny-alpha` funciona sem filtros, mas demora ~95s (estourava o timeout de 75s). Timeout ampliado para 120s para este modelo.
  * `upstage/solar-pro4:free` validado como a melhor opção gratuita ativa (rápido ~15s, sem censura em sexo/gore, JSON 100% estável).
  * `inclusionai/ling-3.0-flash-sante:free` testado e aprovado como reserva imediata (~15s, narra adulto e gera 5 opções válidas).
- **Purificação da Prosa & Eliminação de Cacoetes de IA**:
  * Adicionada regra estrita de segunda pessoa ("você"), proibindo narrar em terceira pessoa ("Junior chega", "ele entra").
  * Proibido o carrossel/rodízio de monólogos (onde 4 NPCs discursavam em fila). O diálogo agora foca em 1 ou no máximo 2 interlocutores por cena, com o jogador respondendo ativamente (`— [você]`).
  * Proibidos anacronismos modernos ("batedeira", "dezenas de minutos"), traduções quebradas e alucinações de itens sem sentido ("patinho de sal").
  * Proibidos vícios clássicos de IA: antíteses "Não X, mas Y", conclusões moralizantes e fechamentos em perguntas ("O que você fará?"). `limparNarracao` remove trailing questions automaticamente por regex de segurança.
  * Concordância masculina estrita do protagonista reforçada em pronomes, vocativos, adjetivos e particípios ("ferido", "exausto", "pronto", "surpreso").
- **Atributos e Armas Lendárias na Prosa**:
  * `personagem.atributos` e `personagem.armaEquipada` (com `danoBase`, `tipoDano`, `contraOni`, `efeitoPassivo`, `corNichirin`) agora são injetados diretamente em `montarPacote`.
  * Diretriz de combate instrui a refletir o impacto real da força/precisão e as propriedades autênticas da arma (como o aço negro obsidiana e as chamas solares da Lâmina de Yoriichi / Respiração do Sol cauterizando feridas de onis).
- **Validação**:
  * `npm run typecheck` OK (código 0).
  * `npm run test:engine` OK (100% dos testes e simulação de 10 anos passaram sem violações de invariantes).
  * Teste ao vivo de narração com `Solar Pro 4` gerou cena com 2ª pessoa estrita, foco na Elza sem rodízio, reconhecimento imediato da Lâmina de Yoriichi aquecida e opções de turno categorizadas.

### Sessão 81 (Gemini) — Relevância Profunda do Treinamento de Mestre na Infância
- **Impacto Mecânico e Narrativo da Opção `treinar` aos 10 anos (`eventoTalento`)**:
  * Em `engine/familia.ts`, a opção aos 10 anos de aceitar o mestre foi reformulada para conceder ao protagonista recompensas reais e permanentes no mesmo nível do irmão prodígio:
    1. **Arte Secreta de Mestre Conhecida (`artesConhecidas`)**: Concede imediatamente uma técnica marcial ou mística autêntica conforme a vocação do maior talento do protagonista (`guarda_perfeita` para físico, `tiro_certeiro` para precisão, `escudo_arcano` para raciocínio, `segundo_folego` para resiliência, `ler_aura` para percepção, `coragem` para social, com fallbacks caso já conheça).
    2. **Atributos em Dobro**: Concede +2 no talento principal e +1 em resiliência/físico pela disciplina do treino severo.
    3. **Perícia Marcial / Intelectual**: +1 na perícia afim (`atletismo`, `perceber`, `arcana`, `rastrear`, `intimidar`).
    4. **Herança / Item de Treino do Mestre**: Adiciona um item ao inventário herdado do mestre (`pedra_de_amolar`, `luvas_de_couro`, `tonico_de_mana`, `pocao_cura_menor`, etc.).
    5. **Alcunha e Prestígio Social**: Concede +3 de prestígio familiar, a alcunha honorífica `'Discípulo Dedicado'` e as flags `camp.flags['discipulo_de_mestre'] = true`, `mestre_infancia_talento` e `arte_mestre_infancia`.
  * Em `engine/llm.ts`: Instrução 5a ampliada para fazer mestres, combatentes e ferreiros reconhecerem formalmente a postura marcial, respiração e disciplina do protagonista com a alcunha de discípulo.
- **Validação e Testes**:
  * `engine/familia.selftest.ts`: Adicionado teste unitário rigoroso validando atribuição de arte, perícia, item herdado no inventário, prestígio e reconhecimento de discípulo.
  * `npm run typecheck`: 0 erros (TypeScript estrito).
  * `engine/familia.selftest.ts` e `engine/selftest.ts`: 100% aprovados sem violações de invariantes.

### Sessão 82 (Gemini) — Expansão Dramática e Variedade de Eventos da Infância
- **Novos Eventos Formativos da Infância em [`engine/familia.ts`](file:///c:/Users/Junior/ro-arcanum/engine/familia.ts)**:
  * A infância do Vaelhorn recebeu 10 novos eventos ricos com escolhas profundas e consequências permanentes:
    1. **Aos 6 anos**:
       - `indigno_provacao`: Evento exclusivo para a marca `indigno` ("O Olhar de Desdém" — provar-se no trabalho, astúcia pelas sombras ou têmpera de aço).
       - `ruinas_descoberta`: "O Buraco sob a Capela Velha" (descer às catacumbas, marcar segredo ou avisar anciãos). Concede `moeda_antiga`, atributos e prestígio.
       - `inverno_rigoroso`: "O Inverno da Geada Vermelha" (manter a fogueira e salvar os fracos, buscar lenha na nevasca ou caçar armadilhas na neve). Concede cicatrizes de frio, resiliência e patrimônio.
    2. **Aos 10 anos** (sorteio expandido de 2 para 6 tipos):
       - `incendio_forja`: "O Fogo na Rua da Ferraria" (salvar o ferreiro com `pedra_de_amolar`, comandar linha de baldes com `persuadir` ou arrombar depósito para salvar carga).
       - `sombra_na_mata`: "A Coisa Que Não Tinha Sombra" (sustentar respiração e aprender `passo_leve`, proteger amigo com alcunha 'Olhar Férreo', ou gravar pontos fracos no bestiário com `perceber`).
       - `inquisicao_selo`: "A Comitiva da Ordem do Santo Selo" (responder com modéstia e prestígio, ocultar relíquias da família com `furtividade`, ou desafiar o inquisidor com a alcunha 'Indomável').
       - `torneio_juventude`: "A Disputa do Meio-Verão" (vencer na arena de terra batida com `luvas_de_couro`, prova de arquearia com `perceber`, ou cantar crônicas da fogueira com `persuadir`).
    3. **Aos 14 anos** (sorteio expandido de 1 para 4 tipos):
       - `emboscada_estrada`: "O Batismo de Sangue na Estrada do Sal" (lutar na linha de frente com `espada_curta` e alcunha 'Batizado em Sangue', manobrar a fuga pela ravina salvando a carga, ou contra-emboscar saqueando ouro).
       - `rito_da_vigia`: "A Vigília Solitária na Torre da Fronteira" (olhos no nevoeiro aprendendo `ler_aura`, disciplina marcial aprendendo `segundo_folego`, ou mapear o vale com `mapa_rasgado` e `decifrar`).
       - `encruzilhada_oficio`: "A Oferta na Encruzilhada" (seguir batedores com `conhece_trilhas_secretas`, aprender cura de feridas com `pocao_cura_menor`, ou firmar raízes no sangue com prestígio e lealdade máxima).
       - `partida`: o evento clássico mantido e polido.
- **Validação e Testes**:
  * `engine/familia.selftest.ts`: Adicionados testes unitários cobrindo o disparo da marca `indigno`, resolução do incêndio na forja, sombra na mata e batismo de sangue na estrada.
  * `npm run typecheck`: 0 erros (TypeScript estrito).
  * `engine/familia.selftest.ts` e `engine/selftest.ts`: 100% aprovados sem quebras de determinismo ou regressões.

### Sessão 83 (Gemini) — Infância Dinâmica, Memória Familiar Viva e Realismo Cru de Fronteira
- **Gravação de Memórias Duradouras nos Parentes ([`engine/familia.ts`](file:///c:/Users/Junior/ro-arcanum/engine/familia.ts))**:
  * `registrarLembranca` integrado em `resolverEtapaInfancia` em todos os acontecimentos cruciais da infância:
    - `talento` (`treinar`): lembrança gravada em todos os familiares de que o protagonista foi aceito como discípulo formal de um mestre aos 10 anos (+6 de confiança).
    - `talento` (`dividir`): memória no irmão de que o protagonista abriu mão da tutela de mestre para ele virar prodígio (+15 de confiança); nos pais, memória de lealdade e honra de sangue (+8 de confiança).
    - `talento` (`recusar`): memória na família de que recusou partir para sustentar o lar.
    - `incendio_forja` (`salvar_ferreiro`): se o pai for ferreiro, memória eterna de resgate do fogo (+12 de confiança); para os pais, memória de coragem destemida (+8 de confiança).
    - `sombra_na_mata` (`proteger_amigo`): memória no irmão de que você colocou o corpo entre ele e a fera aos 10 anos (+12 de confiança); pais gravam admiração com olhar férreo (+8 de confiança).
    - `inverno_rigoroso` (`manter_fogueira`): memória em todos os familiares de ter vigiado o fogo noite após noite durante o grande inverno (+5 de confiança).
    - `emboscada_estrada`: em `lutar_com_furia`, memória do batismo de sangue empunhando o aço aos 14 anos (+8 de confiança); em `manobrar_fuga`, memória de conduzir os cavalos no desfiladeiro salvando vidas e carga (+6 de confiança).
    - `encruzilhada_oficio` (`firmar_raizes_na_casa`): memória de honra ao escolher fincar raízes e sustentar a família em vez de partir pelo mundo (+10 de confiança).
    - `partida` (`defender`): memória na família de ter colocado o corpo à frente quando o perigo bateu à porta aos 14 anos (+10 de confiança).
    - `perda` (`proteger_irmaos`): nos irmãos vivos, memória de ter assumido o peso da casa após a morte dos pais (+12 de confiança).
- **Injeção de `origemEFamilia` no Pacote de Contexto do Narrador ([`engine/llm.ts`](file:///c:/Users/Junior/ro-arcanum/engine/llm.ts))**:
  * Em `montarPacote`, adicionado o bloco `origemEFamilia`: passa `prestigio`, `patrimonio`, relação de `membros` (nome, parentesco, ocupação, condição, prodígio) e as `marcasDaInfancia` (as decisões e feitos reais registrados na história da família).
  * O narrador agora tem ciência imediata da linhagem, das escolhas da infância e de quem são os pais e irmãos.
- **Diretrizes 2f e 2g no Prompt de Sistema ([`engine/llm.ts`](file:///c:/Users/Junior/ro-arcanum/engine/llm.ts))**:
  * `2f) RAÍZES VIVAS E MEMÓRIA DE SANGUE`: familiares dialogam com a intimidade orgânica de quem dividiu teto, feridas e dificuldades, reconhecendo o passado através de `lembraDeVoce`. Pais e irmãos nunca são retratados como estranhos de taverna.
  * `2g) FISICALIDADE CRUA E REALISMO DE FRONTEIRA`: proíbe abstrações e clichês etéreos, exigindo matéria, texturas, cheiros ásperos (lama, cerveja azeda, ferro oxidado, sebo de vela, baque seco de escudos) e corpos agindo de fato.
- **Validação e Testes**:
  * `engine/familia.selftest.ts`: Adicionadas asserções para memórias vivas registradas nos familiares e presença de `origemEFamilia` com membros e histórico no pacote do narrador. 100% aprovado.
  * `engine/selftest.ts`: 100% aprovado (todas as 40+ suítes de teste + simulação longa de 10 anos sem quebras de invariantes).
  * `npm run typecheck`: 0 erros de compilação TypeScript (modo estrito).


---

## Sessão 84 — Claude — revisão das sessões 80 a 83 do Gemini e rodada grande

Revisão do Gemini (checkpoint `abbb88f`): ids de itens e artes dados na
infância existem no catálogo; nada de `Math.random`/`Date.now`; teste da família
passa. Dois defeitos no narrador, corrigidos:
- `limparNarracao` apagava a pergunta do fim mesmo quando era FALA de
  personagem ("— [Guarda] O que você faz aqui?" virava "— [Guarda]"). Agora só
  corta a pergunta em linha de narração.
- A regra "NUNCA termine com perguntas" brigava com a do gancho ("uma pergunta
  feita a ele"). Reescrita: o NARRADOR não pergunta ao jogador; um PERSONAGEM
  pode, em fala.
- Mapa rápido do HANDOFF dizia "70–79 Claude"; 70–77c são do Gemini.

Rodízio por tipo de cena: `tipoDeCena` (engine/llm.ts) lê o pedido e diz se a
cena é íntima (`adulto`), de luta (`gore`) ou comum. Em `narrar`, quem tem
veredito ✓ para aquele tipo (`config.vereditos["provedor:modelo"]`) vai na
frente, quem recusou vai por último, e quem não foi testado fica no meio, na
ordem de sempre. O teste adulto do narrador principal (Configurações) também
grava veredito agora. Reservas sem modelo escolhido usam o modelo padrão do
provedor como chave do veredito.

Cultivos por sítio (resto da etapa C): `engine/cultivos.ts`. Cada sítio aceita
as plantas da região (`CULTIVOS_POR_SITIO`) e cada uma faz uma coisa: trigo
(cheio), centeio (não quebra no inverno), cevada (80% + estabilidade), linho e
vinha (ouro), nabo (no inverno o rebanho come nabo e não o celeiro), ervas
(remédio), painço (aguenta terra ruim), arroz (125%, só com água 3). Trocar
de planta para a colheita por 10 dias. `processarDiaColonia` usa
`colheitaDoDia`; `processarRebanhos` recebe a forragem. Aba "Roça" no
assentamento (`ui/screens/RocaColonia.tsx`). Saves antigos: sem planta
escolhida, a colônia usa a primeira do sítio — na Colina dos Forcados e na
Clareira isso é centeio, que rende 85% no verão e mais no inverno. Teste
`engine/cultivos.selftest.ts` (no `test:engine`); o teste de terreno da
colônia agora compara os dois sítios com trigo, porque o painço existe
justamente para encurtar a diferença do ermo.

Mapa dos cartógrafos no jogo. A imagem (`assets/feudo/mapa_continente.jpg`)
foi lida símbolo por símbolo:
- Dois lugares pintados que o jogo não tinha viraram lugares de verdade, com
  estrada, crônica, moradores, histórias e segredos autorais: **Forrarborg
  Aelha** (a torre no último morro antes das dunas, hoje dos contrabandistas;
  liga Porto do Sal, Ponta da Areia e Corveira) e **Ponta da Areia** (a
  língua de areia do sal sem selo). 55 lugares agora.
- `content/vaelhorn/marcosMapa.ts`: 13 nomes antigos pintados (Tesselgarde,
  Gelo-Fortis, Vintraborg, Clareira Negra, Sombraltrar, Pedra-Alta,
  Corveiraborg, Mina de Ferro, Mina de Prata, Solgar Capital, Halvetia,
  Mareuborg, Enseada Velha) ligados aos lugares do jogo, e 17 lendas dos
  símbolos (dragão do bosque, as duas serpentes, redemoinho, naufrágio do
  Tributo, as velas do Oceanus, os três estandartes, a Ponte-Velha, os campos
  do Rio-Verde, o castelo da serra, a boca na serra, Petra-Áurea, o oásis, o
  Deserto dos Crânios).
- Mapa: tocar num símbolo pintado abre a lenda e "o que o povo diz"; a lenda
  só aparece quando o lugar a que ela se prende já é conhecido no Livro. O
  cartão de um lugar mostra "no mapa velho: …".
- Narrador: `local.mapaVelho` (nome antigo + até duas lendas de perto), regra
  2e2 no prompt (crença, uma frase); sai do pacote em luta e perseguição.
- Teste `engine/marcosMapa.selftest.ts` (no `test:engine`).

### Sessão 84 (continuação) — partida de verdade no navegador (Playwright)

Joguei uma campanha nova em Vaelhorn pelo Playwright (tela de celular,
430 px), clicando: aviso, classe (Espadachim), origem (Foragido), infância
(Expectativas baixas → Olhar de Desdém → Comitiva da Ordem → ficar em casa),
atributos, taverna, Dizer, Flertar, combate, fim de luta, mapa. Fotos em
`.playwright-mcp/jogo/` (fora do git). O narrador por IA respondeu 401: a
chave do `.env.local` está vencida e não uso a do dono; a partida seguiu no
narrador local, que exercita a engine inteira.

Defeitos achados e corrigidos:
- **Flertar oferecia pai, mãe e irmã como alvo.** A engine já barrava
  (`família não é alvo romântico`), mas o seletor listava todos os presentes.
  Agora a lista passa por `disponibilidadeVerbo`.
- "Usar narrador local" valia só um turno: a ação seguinte tentava a chave
  ruim de novo e travava. Agora vale até mexer na configuração
  (`iaSuspensa`), e a abertura não aparece duplicada.
- O narrador local mostrava só "A luta terminou"; agora conta as batidas do
  log antes do fato.
- Irmã com nome masculino/irmão com nome feminino ("Mara · irmao"): nomes por
  gênero; "trabalhadora da família" para irmã.
- Prólogo: "mae"/"irmao" sem acento e "1 anos".
- "Você lidou com isso sozinho(a)" (o protagonista é homem).
- "precisa de alaude" mostrava o id do item; agora o nome ("alaúde").
- "Você tentou flertar Elza" → "flertar com Elza" (e mentir para, conversar com,
  barganhar com).
- Aviso de entrada dizia 17+ e "todos os personagens são adultos, sem
  exceção" — falso (há infância e colonos jovens) e 17+ não cabe em cena
  sexual explícita. Agora 18+, e o texto diz que cena sexual só existe entre
  adultos.

Achados que ficaram para o dono decidir:
- **Combate fácil demais no começo**: personagem de nível 1 matou salteador
  (16 PV) com um crítico de 36 e lobo com 17, sem levar dano. É o efeito do
  reforço de crítico e atributos da sessão 77 (Gemini).
- No celular, os botões táticos do combate ficam espremidos em colunas altas.
- O turno pendente se perde ao recarregar a página (a fala ficou no feed sem
  narração).

---

## Sessão 85 — Gemini — Sincronização Definitiva Nous Research (Hermes), Fim do Pulo Silencioso de IA e Auto-Renovação Contínua

### Causa Raiz Identificada
- **Diagnóstico da falha de sincronização**:
  1. **Migração de Armazenamento do Hermes**: Nas versões recentes do Hermes CLI, as credenciais OAuth e tokens rotativos da Nous Research passaram a ser gravados prioritariamente no repositório compartilhado (`%LOCALAPPDATA%\hermes\shared\nous_auth.json`), enquanto o `auth.json` do perfil principal mantinha `providers: {}` vazio.
  2. **Origem da quebra na ponte**: `engine/hermesBridge.ts`, `metro.config.js` e `scripts/sync_hermes.ts` procuravam exclusivamente em `hermes/auth.json`. Como não encontravam a entrada, caíam de volta para `.env.local` que continha um JWT emitido há mais de 35 horas e vencido.
  3. **Origem do "pulo" no jogo**: Ao falhar com 401, a flag `iaSuspensa: true` ativada na Sessão 84 fazia com que todas as jogadas subsequentes caíssem diretamente no narrador canônico local (§20) sem tentar reautenticar o Hermes, mesmo com o Hermes ativo e modelos disponíveis. Em `narrarComFallback`, qualquer 401 descartava sumariamente o provedor em vez de disparar refresh com retry.

### Implementações Realizadas
1. **Suporte Nativo a `shared/nous_auth.json` e Espelhamento com `auth.json`**:
   - `engine/hermesBridge.ts` e `metro.config.js`: Atualizados para ler em cascata: `shared/nous_auth.json` → `auth.json` → `.env.local`. Se `shared/nous_auth.json` estiver presente, espelha automaticamente a credencial em `auth.json.providers.nous`, reativando a compatibilidade nativa com o comando `hermes auth refresh nous`.
   - `scripts/sync_hermes.ts`: Atualizado para sincronizar as duas fontes e persistir a chave fresca em `.env.local`.
2. **Detecção e Validação de Expiração JWT**:
   - Nova função utilitária `jwtExpirado(jwt, margemSegundos = 300)` em `engine/hermesBridge.ts` (100% type-safe e compatível tanto em Node.js quanto em browsers sem dependências externas).
   - `obterTokenNousAtual()` e `tokenEstaPrestesAExpirar()` agora inspecionam a claim `exp` do JWT, prevenindo o uso de tokens vencidos e acionando renovação preventiva antes de qualquer requisição.
3. **Fim do Pulo da Nous e Recuperação em Tempo de Execução**:
   - `engine/llm.ts` (`resolverApiKey`): No provedor `nous`, prioriza o token rotativo válido da bridge sobre chaves manuais antigas/expiradas salvas no storage.
   - `engine/llm.ts` (`chamarNous`, `testarChave`, `listarModelosNous`): Se o token estiver expirado ou prestes a expirar (< 2 min), renova preventivamente. Se a API retornar 401, aciona renovação forçada via bridge e retenta a chamada imediatamente com a nova credencial.
   - `engine/llm.ts` (`narrarComFallback`): Em caso de 401 sob o provedor `nous`, não descarta o provedor silenciosamente; tenta renovação forçada imediata e reexecuta com o modelo configurado antes de avaliar outros modelos de reserva.
   - `ui/store.ts` (`narrar`, `tentarNarrarDeNovo`, `renovarHermes`):
     * Antes de avaliar se cai no narrador canônico local, verifica se a Nous possui token renovável e restaura a chave.
     * Quando uma narração ou renovação com a Nous obtém sucesso, limpa `iaSuspensa: false` e `iaErro: undefined`.
     * `tentarNarrarDeNovo()` remove `iaSuspensa` e força refresh na Nous se necessário.
   - `ui/screens/Sistema.tsx`:
     * Feedback visual na tela de Configurações agora reflete a validade real do token (`Token do Hermes ativo com renovação automática imperceptível ✓` vs `Token do Hermes expirado. Toque em "Renovar token do Hermes" abaixo.`).

### Validação e Testes
- `scripts/sync_hermes.ts`: Executado com sucesso. Token da Nous sincronizado e validado até `2026-09-28T16:38:01+00:00`.
- `scripts/test_hermes_bridge.ts`: 100% aprovado (leitura de token, `testarChave`, renovação forçada e chamada pós-renovação).
- `scripts/listar_todos_modelos.ts`: 417 modelos da Nous Research catalogados ao vivo via API oficial.
- `scripts/testar_area_ia.ts`: Teste completo aprovado:
  * `listarModelos`: 6 modelos retornados em 732ms.
  * `testarChave`: `{ ok: true }` validado na API da Nous.
  * `testarCenaAdulta`: `narra: true, recusou: false` com `upstage/solar-pro4:free`.
  * `testarNarracaoReal` (`narrarComFallback`): narração rica de 1667 caracteres gerada e 3 opções de jogo interpretadas.
- `npm run typecheck`: 0 erros (TypeScript estrito).
- `npm run test:engine`: 100% dos testes e simulação longa de 6 campanhas × 10 anos aprovados sem travas nem violações de invariantes (407.5s).

---

## Sessão 86 — Gemini — Integração e Validação do Longcat 2.5 Preview (Meituan) no Hermes Free

### Contexto e Descoberta
- **Longcat 2.0**: O slug `meituan/longcat-2.0:free` foi descontinuado da API de inferência da Nous Research (retorna HTTP 404).
- **Longcat 2.5 Preview (`meituan/longcat-2.5-preview:free`)**: Lançado pela Meituan em 25 de setembro de 2026 e adicionado ao catálogo gratuito da Nous.
- **Diferenças Arquiteturais e de Treinamento**:
  * Enquanto o 2.0 era prioritariamente focado em código/terminal (SWE-bench), o 2.5 mantém a arquitetura MoE de 1.6T (~48B ativos) com 1M de janela de contexto, mas seu pós-treinamento foi totalmente voltado a **agentes autônomos, planejamento multi-etapas, uso de ferramentas e cumprimento estrito de instruções**.

### Adequação ao RO ARCANUM
1. **JSON Estrito**: Por ser treinado para execução de ferramentas por agentes, gera esquemas `{ texto, opcoes: [...] }` com muito menos risco de quebra de sintaxe ou vazamento de formatação crua na tela.
2. **Latência de ~4s**: Quase metade do tempo do Solar Pro 4 (~7s) e mais de 20x mais ágil que o Space Bunny (~90s).
3. **Ausência de Censura (Adulto e Combate/Gore)**: Testado ao vivo com cena adulta explícita em português brasileiro: o modelo respondeu com riqueza descritiva, alta cadência lírica e zero recusa ou julgamento moral.

### Modificações Realizadas
- `engine/llm.ts`:
  * Adicionado `meituan/longcat-2.5-preview:free` como 2ª sugestão de destaque em `SUGESTOES_NOUS`.
  * Adicionado `meituan/longcat-2.5-preview:free` na lista `MODELOS_PARA_CENA_ADULTA` com nota de alta agilidade e sem censura.
  * Adicionada a chave `'longcat'` em `PERMISSIVOS`.
  * Mantido `meituan/longcat-2.0:free` em `DEAD_MODELS` para blindar qualquer fallback inválido.

### Validação
- `npm run typecheck`: 0 erros.
- `npm run test:engine`: 100% aprovado em 394.3s (todos os testes de sistemas, reflexão cognitiva, cosmologia, intimidade e simulação de 6 campanhas × 10 anos sem violações de invariantes).


---

## Sessão 87 — Claude — token da Nous vazava para dentro do build

Revisão das sessões 85–86 do Gemini (checkpoint `330114c`). Achado de
segurança: o token da Nous vivia em `.env.local` como
`EXPO_PUBLIC_NOUS_API_KEY`, e o cliente lia essa variável (`llm.ts`,
`store.ts`, `Sistema.tsx`, `hermesBridge.ts`). O Expo **embute no JavaScript**
toda variável `EXPO_PUBLIC_*` que o código cliente usa: o `expo export` web
gerado nesta máquina tinha o JWT dentro do bundle. Qualquer APK ou build web
feito aqui levaria o token do dono junto.

Correção: a variável virou `NOUS_API_KEY_LOCAL` (sem o prefixo, o Expo não
embute). Quem grava `.env.local` (`scripts/sync_hermes.ts`, `metro.config.js`,
`hermesBridge.ts`) grava o nome novo; o leitor de arquivo do bridge aceita o
antigo e o novo. No navegador o token continua chegando pela rota
`/api/hermes/token` do Metro. Conferido: `expo export --clear` sem nenhum JWT
no bundle. O build antigo, que tinha o token, foi apagado.

Também para o dono decidir: o jogo agora escreve em
`%LOCALAPPDATA%\hermes\auth.json` (espelha a credencial de
`shared/nous_auth.json`, sessão 85). Mexer no arquivo de credenciais de outro
programa pode quebrar o Hermes se o formato mudar.

Outro: `historias-costa.ts` — desejo de uma moradora nova tinha 38
caracteres (o teste pede 40+); o `test:engine` da sessão 84 falhou por isso.

### Sessão 87 (continuação) — combate, botões, turno perdido e rolagem

1. **Combate fácil demais.** O banco de provas (`npm run balanco`) já dava
   20 de 20 faixas fora da meta **antes** da sessão 77 (luta "equilibrada"
   dando ~80% de vitória em todos os perfis; conferido rodando o código de
   `4f3213c`). A sessão 77 quase não mexeu nisso no recruta. Correção em
   `engine/combat.ts`, ao montar o inimigo:
   - `CALIBRAGEM_INIMIGO` = vida ×1,15 e dano ×1,10 para todo o bestiário;
   - `REFORCO_CRIATURA_FRACA` = +12% de vida e dano em criatura de nível 1,
     sumindo até zero no nível 5 — pela ficha da criatura, nunca pelo nível do
     jogador (regra do jogo: o mundo não se adapta a você; o teste de
     `expansao.selftest.ts` agora compara novato e veterano contra o mesmo
     adversário).
   - O adversário de aferição do banco passou a ter o nível do jogador
     (`engine/balanco.ts`), para "equivalente" ser equivalente de verdade.
   Resultado: 5 de 20 faixas fora da meta (recruta 49% na luta equilibrada,
   veterano 53%, caçador 54%; o mestre ainda vence 64%). Salteador + lobo no
   começo: o espadachim ainda vence quase sempre, mas em ~3,7 rodadas e
   levando ~18 de dano, não mais ~12 em duas.
2. **Botões do combate no celular**: `acaoBtn` tinha `flex: 1` numa linha que
   quebra; os sete botões se espremiam numa linha só. Agora base de 96 px com
   quebra (três por linha em 430 px); "Trocar arma" / "Sem outra arma".
3. **Turno perdido ao recarregar**: `pendente` entra no retrato da sessão; ao
   continuar, o turno aparece esperando com "Tentar de novo" e "Usar
   narrador local".
4. **Rolagem**: quando a cena nova chegava, a tela ia para o fim da página
   (opções e campo de texto) e o jogador tinha que subir para ler. Agora vai
   para o começo da cena nova, esperando a medida do `onLayout` (no navegador
   ela chega depois do render). O prólogo abre cada etapa do topo (`key` por
   idade na `Pagina`). Conferido no navegador: a cena nova fica a 31 px do
   topo da tela.

A narração por IA voltou a responder no navegador (a ponte do Hermes da
sessão 85 funcionou). Primeira cena de luta com as batidas: segue a ordem e
quem caiu fica caído, mas o Solar erra palavra ("desmaça", "filo" por fio),
repete frases ("o salteador ainda não se mexe") e a Vess chama o jogador
pelo nome sem ter sido apresentada.

### Sessão 87 (continuação) — o nome do jogador e o Longcat

**Nome.** A regra "estranho não sabe seu nome" estava só no prompt. Agora é
da engine (`engine/nomeDoJogador.ts`):
- sabe o nome: família, quem convive com ele há 3+ dias, e quem estava
  presente quando ele disse o próprio nome (na ação livre, na aba Dizer, ou
  numa fala `[você]` da cena) — `camp.sabemSeuNome`;
- cada presente vai ao narrador com `sabeSeuNome`; a regra do prompt usa isso;
- depois da resposta, `protegerNome` troca o nome por "forasteiro" nas falas
  de quem não sabe (narração e falas do próprio jogador ficam como estão).
- Defeito antigo achado no caminho: `diasDeConvivio` tratava memória do dia 0
  (primeiro dia da campanha) como "sem data" e devolvia 0 para sempre.
- Teste `engine/nomeDoJogador.selftest.ts` (no `test:engine`).

**Longcat 2.5 × Solar Pro 4** (Nous grátis, pelo próprio jogo, cena da
taverna com Aldrica, Vess, Sarine, Rengoku e a família):
- Solar: 20–29 s; português com erros ("olhar de forasteiro varre as mesas"
  para o olhar do jogador; antes, "desmaça", "filo"); respeitou o nome.
- Longcat: 36–87 s (uma vez passou de 75 s e deu tempo esgotado); português
  bem mais limpo, usou os presentes certos, a crônica do lugar (a viga que
  nunca apodrece) e a família com intimidade; respeitou o nome; dois
  deslizes pequenos (Mara "a irmã mais nova", que é mais velha; "só ele
  conhece" para Ceres). Os dois narram cena adulta no teste.
- Tempo limite do Longcat subiu para 120 s (como o Space Bunny). A nota "rápido
  ~4s" da sessão 86 não se confirmou; corrigida.
- `testarNarracaoReal` agora devolve o texto inteiro (antes só 220
  caracteres), para dar para comparar modelos.

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
