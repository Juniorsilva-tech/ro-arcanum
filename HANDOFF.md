# HANDOFF — RO ARCANUM

## Agente atual
Claude Opus

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

## Objetivo da tarefa atual
Auditoria adversarial completa do trabalho entregue pelas sessões GPT-6 Astra
e GPT-5.6 Sol, consolidado no commit `6a587f9`.

Esta sessão NÃO implementa novos blocos do roadmap. O papel acordado é o de
revisor: procurar contradições, sistemas superficiais, regressões e problemas
de design no diff de +6104/-189 linhas, sem editar os mesmos arquivos em
paralelo com o agente implementador.

---

## Estado encontrado antes das alterações

Branch `claude/build-app-apk-nzg5ap`, 2 commits à frente de `origin/main`
(`dc6dfee`), árvore limpa exceto pelo template deste `HANDOFF.md`.

Arqueologia do histórico:

- `9017747`, `51bc671`, `fb19580` (07/ago, autor Claude) — correções de revisão
  de PR e trabalho sobre `engine/llm.ts`. Anteriores ao Astra.
- `6a587f9` "checkpoint inicial antes Claude Codex" (05/set, autor Junior) —
  **70 arquivos, +6104/-189**. É o snapshot único de todo o trabalho das
  sessões GPT-6 Astra e GPT-5.6 Sol. Não há commits individuais desse trabalho.
- `7f2a6be` "checkpoint Claude" — cria `HANDOFF.md` vazio. Zero código.

A sessão Astra foi interrompida por limite de quota no meio do bloco de
combate. Verificado que o último bloco sobreviveu no checkpoint: `posicao`
(frente/flanco/cobertura), `ordemGrupo` (proteger/focar), retirada assistida e
rendição de humano estão presentes em `engine/combat.ts`.

### Funcionalidades funcionando
- Typecheck `tsc --noEmit` limpo.
- `engine/selftest.ts` — todos os testes passam.
- `engine/kimetsu.selftest.ts` — 18 testes de integração Kimetsu/continuidade.
- `engine/familia.selftest.ts` — família, infância e guerra.
- `engine/sim.ts` — 10.000 amostras por faixa de dificuldade; curva de sucesso
  monotônica (92% trivial a 38% quase impossível); teste de agência sobrevive
  24 ações em 21 períodos com 31/53 verbos ainda disponíveis.
- Sistemas presentes na engine: prólogo de vida 0-18 anos, família procedural,
  mundo contínuo com passagem de anos, guerras com frente física, Nemesis de
  onis, regras Kimetsu (sol, glicínia, Nichirin, regeneração), companheiros
  persistentes limitados a dois, cidades, política, missões vivas.
- Arquitetura registrada em três ADRs (`docs/architecture/`).

### Funcionalidades incompletas
- Roadmap declarado pelo próprio agente implementador: nenhuma campanha longa
  (décadas) foi simulada; o teste de agência cobre apenas 21 períodos.
- Sem teste de salvar/carregar repetido ao longo de uma campanha.
- Sem execução de milhares de sementes distintas.
- Sem teste de todos os sistemas rodando simultaneamente.
- Nenhum teste percorre a interface.

### Bugs encontrados antes das alterações
- Nenhum detectado pelas suítes existentes. Achados desta auditoria ficam
  registrados na seção "Problemas conhecidos" abaixo.

---

## Alterações realizadas nesta sessão

### Funcionalidades implementadas
- **Simulador de campanhas longas** (`engine/campanhaLonga.ts` + `engine/simLongo.ts`).
  Um agente headless joga a campanha inteira sem tela e sem narrador: atravessa o
  prólogo de infância, escolhe verbos reais, viaja pelo mapa real, usa o painel do
  mundo (missões, descanso, trabalho, libertar-se do cativeiro), aprende artes com
  mestres, conjura técnicas, usa consumíveis e combate com as mesmas funções que a
  tela usa. A cada 90 dias faz um ciclo salvar → `normalizarCampanha` → carregar e
  compara o estado antes e depois.
- **Verificador de invariantes** dentro do simulador. Regras que a engine promete e
  que nenhuma semente pode quebrar: recurso acima do teto, número não finito, idade
  regredindo, morto na cena ou no grupo, grupo acima de dois, estoque de cidade
  negativo, doença/insegurança/integridade fora da faixa, população negativa,
  histórico sem teto, missão vencida ainda aberta, rival morto ressuscitando, ator
  com morte definitiva e vida acima de zero, mundo processado à frente do
  calendário. Cada violação sai com dia e detalhe.
- **Métricas de campanha longa**: anos vividos, causa do fim, combates por origem
  (viagem, painel, verbo), vitórias/derrotas/fugas, missões por desfecho lidas dos
  contadores (a lista `v.missoes` é podada em 60 encerradas e subestimava tudo),
  dias-cidade de fome, rivais vivos por dia, emboscadas, guerras, população,
  nascimentos, mortes, e uma assinatura de campanha para medir repetição entre
  sementes.
- Script `npm run sim:longo -- <anos> <campanhas>`; `test:engine` passou a incluir
  `simLongo 10 6`.

### Bugs corrigidos
1. **Confronto de missão sem custo de tempo** (`engine/acoesMundo.ts`).
   `executarAcaoMundo` com `escolha: 'confrontar'` abria combate e retornava sem
   chamar `terminar()` — a única ação do painel que não movia o calendário.
   Consequência: dava para confrontar o mesmo rival infinitas vezes no mesmo
   instante, e como o rival só recupera ferimentos quando o dia vira
   (`obterRival`, em `engine/kimetsu.ts`), ele era moído numa sequência de
   tentativas gratuitas. Na medição, 1801 de 2139 combates de uma campanha de 5
   anos vinham desse laço. Agora a perseguição cobra um período e a eligibilidade
   solar é reavaliada depois que o tempo passa.

### Refatorações
2. **Regra de viagem movida da UI para a engine** (`engine/viagem.ts`, novo
   `viajar()`). Custo de tempo, tique do mundo, primeiro pisar, descoberta de
   notícias, sorteio de encontro e emboscada Nemesis viviam em `ui/store.ts`.
   Nenhum consumidor headless conseguia andar pelo mapa, e um segundo cliente
   teria de reimplementar cinco regras — cinco chances de divergir do jogo. Para
   isso a tabela de encontros precisou entrar no contrato de conteúdo:
   `ContentBundle.encontrosPorTipo`.
3. **Custo de tempo de aprender arte movido da UI para a engine**
   (`engine/magic.ts`, `PERIODOS_PARA_APRENDER`). Mesma classe de defeito: a
   engine concedia a arte de graça e sem o mundo andar; só a tela cobrava os dois
   períodos.
4. **Contexto calculado uma vez em `mestresQueEnsinamAqui`** (`engine/magic.ts`).
   `mestreDisponivel` chamava `calcularContexto` por mestre, e o contexto percorre
   o elenco inteiro — que cresce até 160 moradores procedurais
   (`engine/autonomia.ts`). Com cerca de 20 mestres, eram vinte varreduras do
   elenco por consulta, em cada render da tela de mestres. Agora o contexto entra
   por parâmetro e é calculado uma vez.

### Arquivos modificados
- `engine/acoesMundo.ts` — confronto passa a cobrar tempo.
- `engine/viagem.ts` — recebe `viajar()`.
- `engine/magic.ts` — custo de tempo do aprendizado; contexto reaproveitado.
- `engine/types.ts` — `ContentBundle.encontrosPorTipo`.
- `content/vaelhorn/index.ts` — publica a tabela de encontros no bundle.
- `ui/store.ts` — `viajar` e `aprenderArteAcao` passam a delegar para a engine;
  imports mortos removidos.
- `package.json` — scripts `sim:longo` e `test:engine`.
- `HANDOFF.md` — este registro.

### Arquivos criados
- `engine/campanhaLonga.ts`
- `engine/simLongo.ts`

### Arquivos removidos
- Nenhum.

---

## Motivo das alterações

**Por que um simulador antes de mais conteúdo.** O relatório da sessão anterior
declarava validação aprovada, mas toda ela era curta: `selftest` testa regras
isoladas e `sim.ts` roda 20 períodos. Praticamente todo sistema entregue pelo
Astra — cidades, autonomia, política, nemesis, missões vivas, diretor — só começa
a se comportar depois de centenas de dias. Fome, migração, sucessão, obra
concluída e rival que evolui não cabem em vinte períodos. Sem uma execução longa,
qualquer bloco novo seria construído sobre fundação não medida.

**Por que mover viagem e aprendizado para a engine.** Não foi preferência
estética: sem isso o simulador não conseguia andar pelo mapa nem aprender uma
técnica, e a medição seria de um jogo que ninguém joga. O efeito colateral é o
benefício real: a regra deixou de existir em duas versões possíveis.

**O que mudou de comportamento para o jogador.** Só uma coisa: confrontar o alvo
de uma missão de investigação agora consome um período, e se esse período trouxer
a luz do dia o oni se protege e o confronto não acontece. Antes era instantâneo e
repetível sem limite. Viagem e aprendizado se comportam exatamente como antes
pela tela.

---

## Validação

### Typecheck
- `npx tsc --noEmit` — limpo.

### Testes
- `engine/selftest.ts` — TODOS OS TESTES PASSARAM.
- `engine/kimetsu.selftest.ts` — 18 testes de integração passaram.
- `engine/familia.selftest.ts` — família, infância e guerra passaram.
- `engine/sim.ts` — curva de dificuldade e teste de agência, OK.
- `engine/simLongo.ts 10 6` — 6 campanhas × 10 anos (3650 dias cada),
  **zero violações de invariante**, 32,7 s.

Nenhuma suíte anterior regrediu com a mudança de viagem e aprendizado.

### Build
- Não executado nesta sessão. A exportação web do Expo foi relatada pela sessão
  anterior; não reverifiquei.

### Testes manuais
- Nenhum. Não abri o app. Toda a verificação foi headless.

---

## Problemas conhecidos

Nenhum destes é crash ou inconsistência de estado — a máquina de estado do Astra
aguentou 3650 dias sem uma única violação. São achados de **balanceamento e
alcance**, medidos, não impressões. Números por campanha de 10 anos, média de 6
sementes.

1. **Combate: 7% de vitória.** 66 vitórias, 681 derrotas, 177 fugas, com o
   personagem em nível 20-25 e 43 artes aprendidas. O agente cura, conjura e foge
   abaixo de 25% de vida. A dificuldade não parece calibrada para campanha longa.
2. **Nemesis só cresce.** 27,7 rivais criados, 1,5 mortos. Média de 20 rivais
   vivos por dia. `obterRival` cria um rival novo para cada oni sem identidade
   canônica em cada local, e quase nada os remove. Consequência direta: 682
   emboscadas por campanha, uma a cada 5 dias, porque `emboscadaNemesis` tem
   cooldown de 3 dias por rival mas nenhum cooldown global.
3. **Fome estrutural.** 2513 dias-cidade de fome; uma semente ficou 213 dias
   seguidos. Em `engine/cidades.ts` a produção satura em
   `(8 + lavoura*4) * fertilidade * condicao`, cerca de 30,8 por dia com lavoura
   no teto 5, enquanto o consumo é `populacao * 0.15`. Acima de aproximadamente
   205 habitantes a cidade não se alimenta mais, e a população final média é 568
   distribuída entre as comunidades. É um teto matemático, não um evento.
4. **Missões: 193 falhadas contra 55 concluídas.** O prazo padrão é de 10 dias
   (16 para escoltar) e o gerador produz mais do que o jogador alcança.
5. **Lacunas canônicas contra os documentos entregues** (verificado por busca,
   zero ocorrências no código): Marca do Caçador, Lâmina Nichirin Carmesim, Mundo
   Transparente, Estado Altruísta, patentes Mizunoto→Kinoe, critério de promoção a
   Hashira, resistência à decapitação das Luas Superiores 1 e 3, os 7 corações e 5
   cérebros de Muzan, assimilação demoníaca de Genya.
6. **Terceiro IP na progressão.** `engine/ascensao.ts` implementa o CHIM de
   The Elder Scrolls (nível 15 + 60 anos + 3 almas seladas, resultando em imunidade
   à morte por velhice). O dono do projeto decidiu nesta sessão que o protagonista
   pode ultrapassar os 25 anos como Yoriichi — o que é canônico e resolve o conflito
   com a Marca do Caçador. Fica pendente trocar a roupa do mecanismo: `chim` vira
   Marca inata, e a Marca adquirida entra como o caminho arriscado que mata antes
   dos 25. Nenhuma linha de sistema muda; muda a justificativa e o nome.
7. **`catalogo-completo-hashiras.md`** foi salvo como script Python: começa com
   `import os` e o conteúdo inteiro dentro de uma string tripla. Legível, mas não é
   Markdown.

## Trabalho incompleto
- Nenhum dos dez blocos do roadmap foi implementado. Esta sessão construiu o
  instrumento de medição e corrigiu o que ele encontrou.
- O simulador não exercita: fusão de estilos, ascensão, duelos de fundo iniciados
  pelo jogador, recrutamento de companheiros, loja e inventário, diplomacia e obras
  do painel. Cobrir isso amplia o alcance dos invariantes.
- O narrador (LLM) está fora do laço por construção. Nenhuma sessão longa com IA
  foi validada.
- Nenhum teste percorre a interface.

## Próximo passo recomendado
1. Decidir os números dos achados 1 a 4 — são decisões de design, não bugs, e não
   devem ser escolhidas pelo agente sozinho. Sugestões concretas: teto de rivais
   vivos e cooldown global de emboscada; produção de cidade proporcional à
   população ou consumo com retorno decrescente; prazo de missão proporcional à
   distância.
2. Com os números decididos, usar o simulador como régua: rodar `sim:longo` antes
   e depois de cada ajuste e comparar as métricas. É para isso que ele existe.
3. Só então avançar para o bloco 2 do roadmap (diretor causal). O bloco 1 —
   simulador de campanhas longas — está entregue.

---

## Instruções para o próximo agente

Antes de modificar o projeto:

1. Leia `AGENTS.md`.
2. Leia este `HANDOFF.md`.
3. Execute `git status`.
4. Analise `git diff`.
5. Verifique o último checkpoint Git.
6. Não reverta alterações anteriores sem entender sua finalidade.
7. Confirme que sistemas anteriormente funcionais continuam funcionando.
8. Continue somente o que estiver incompleto.

Se encontrar regressão causada pela sessão anterior, compare com o checkpoint Git
antes de tentar reconstruir a funcionalidade.
