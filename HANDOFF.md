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
---

# SESSÃO 2 — Aptidão, maestria, exposição, reputação e fama

## Estado encontrado antes destas alterações

Ponto de partida: commit `268dc79` (simulador de campanhas longas), com typecheck
limpo, quatro suítes passando e 6 campanhas × 10 anos sem violação de invariante.

O que existia sobre "talento" era uma coisa só e crua:

- `genese.marca === 'genio'` dava **+1 em cada atributo** (`engine/genese.ts`,
  `aplicarHeranca`) e nada mais. Num intervalo de 25 níveis, isso é ruído.
- Não havia noção de domínio, de aprendizado por área, de exposição pública nem
  de crença de terceiros. O mundo não tinha o que descobrir.
- `personagem.pericias` (grau inteiro por perícia) e `camp.reputacao` (por
  facção) eram os únicos vizinhos conceituais.

Medição feita nesta sessão, antes de mexer em qualquer coisa, com o simulador:

| Nível | Combates | Vitória |
|---|---|---|
| 1-5 | 196 | 14,8% |
| 6-10 | 738 | 10,0% |
| 11-15 | 1618 | 5,7% |
| 16-20 | 2231 | 5,5% |
| 21-25 | 768 | 10,3% |

A curva **desce**. Causa localizada e confirmada por leitura de código:
`processarSubidaDeNivel` só incrementa `p.nivel`; `derivados()` liga nível a
`acerto`, `poder` e `dificuldadeImposta`, mas **não** a `defesa`; `danoJogador()`
devolve só o dano da arma; e `recursoMaximo('vida')` cai no `default: return 10`,
fixado na criação. Um personagem nível 25 tem a mesma vida e o mesmo dano de um
nível 1 com o mesmo equipamento. Enquanto isso o bestiário vai até nível 20 e o
Nemesis evolui. **O mundo sobe, o jogador não.** Isso está registrado como
pendência: não foi corrigido nesta sessão porque o formato da escada é decisão de
design do dono do projeto.

---

## O que foi implementado

Sistema de aptidão em cinco conceitos separados, conforme especificado.

### Conceitos
- **APTIDÃO** — potencial de aprendizado por domínio, 0-100, **oculta**. Sorteada
  no nascimento por RNG próprio derivado da semente da campanha.
- **MAESTRIA** — habilidade real, derivada do esforço acumulado.
- **EXPOSIÇÃO** — quanto já foi demonstrado na frente de testemunhas.
- **REPUTAÇÃO** — o que as pessoas acreditam. Pode estar errada nos dois sentidos.
- **FAMA** — alcance dessa crença pelo mundo.

Nove domínios: espada, arcano, estratégia, alquimia, diplomacia, percepção,
medicina, furtividade, ofício.

### Curva de maestria (retorno decrescente)
Maestria não é somada; é derivada do esforço por saturação exponencial,
`100 * (1 - e^(-esforço/220))`. Isso produz a curva pedida sem tabela de faixas
espalhada pelo código:

| esforço | maestria |  | esforço | maestria |
|---|---|---|---|---|
| 70 | 27 | | 500 | 90 |
| 170 | 54 | | 660 | 95 |
| 350 | 80 | | 1010 | 99 |

### Aprendizado
`treinar()` combina qualidade do mestre, empenho, recursos, estado físico e
mental (vida e sanidade entram de verdade) e aptidão. Aptidão é multiplicador
**forte mas finito**: 0,5× a 2,5×. Acima do "teto confortável"
(`55 + aptidão*0.45`) o ganho cai para 15% — freio, não muro: um teste confirma
que aptidão 20 ainda passa de 85 com esforço suficiente.

### Descoberta de talento
Não existe `if (jogador.prodigio) npc.reagir()` em lugar nenhum. Existe
`crencas[npcId][dominio]`, com `valor`, `confianca`, `suspeita` e `observacoes`,
atualizada por:
- **competência do observador** no domínio (mestre da área 0,9; combatente com
  Nichirin 0,8; civil 0,15). Observador incompetente comprime tudo para o meio —
  para ele todo espadachim bom parece igualmente bom;
- **viés pessoal estável** derivado do id (`seedFromString`), mais a disposição
  do NPC. A mesma façanha vale mais para quem gosta e menos para quem não gosta;
- **suspeita por ritmo**: um especialista compara maestria alcançada com sessões
  gastas e desconfia de quem aprendeu rápido demais. Um civil não mede ritmo.

`leituraDoObservador()` transforma a crença em frase para cena e narrador.

### Esconder-se
`alternarOcultacao()`, exposto ao jogador como ação de painel `conter_se`.
Reduz exposição a 20% e cobra o preço: treino rende 75%. Decisão estratégica com
custo real, não botão grátis.

### Reação do mundo
Quatro degraus, cada um dispara **uma vez só** por domínio, com limiares
combinados de reputação e fama: comentário nos treinos → casa de instrução
convida → patrocínio e atrito com quem prefere o talento parado → tratamento de
lenda. Cada degrau registra um `FatoHistorico` e um marco; os dois últimos mexem
na reputação de facção.

### Fama e glória antiga
A fama persegue a reputação subindo rápido (2%/dia) e descendo devagar
(0,6%/dia), limitada pelo alcance do mundo que o personagem percorreu. Foi
preciso um campo novo, `picoReputacao`: a fama **pode** estar acima da reputação
atual — quem já foi grande continua sendo lembrado — mas nunca acima do pico
histórico. Esse invariante substituiu um mais ingênuo que o simulador reprovou
1200 vezes; o código estava certo, o invariante é que estava errado.

### Sigilo garantido por teste
`contextoDeAptidao()` é o único caminho para fora e não inclui `aptidao`. Dois
testes verificam que o número oculto não aparece nem no pacote público nem no
contexto que vai para o narrador.

---

## Arquivos alterados

### Criados
- `engine/aptidaoTypes.ts` — tipos e domínios.
- `engine/aptidao.ts` — núcleo: sorteio, curva, treino, observação, crença,
  reputação, fama, reação do mundo, migração.
- `engine/aptidao.selftest.ts` — 40 asserções.

### Modificados
- `engine/types.ts` — `Campaign.aptidao`.
- `engine/campaign.ts` — aptidão nasce com o personagem.
- `engine/migracao.ts` — chama `migrarAptidao`.
- `engine/turn.ts` — toda ação testada treina o domínio e, com plateia, demonstra.
- `engine/combat.ts` — vitória é demonstração; testemunhas são aliados mais
  presentes no local.
- `engine/magic.ts` — aprender arte é treino com o mestre observando o ritmo.
- `engine/mundoVivo.ts` — `processarAptidao` no tique diário.
- `engine/llm.ts` — narrador recebe talento **percebido** e a leitura de cada
  NPC presente; nunca a aptidão.
- `engine/acoesMundo.ts` — ação `conter_se`.
- `engine/index.ts` — exporta o módulo.
- `engine/campanhaLonga.ts` / `engine/simLongo.ts` — invariantes de aptidão e
  relatório de vitória por faixa de nível.
- `package.json` — `test:engine` inclui a suíte nova.

---

## Decisões tomadas

1. **RNG próprio para a aptidão**, derivado de `camp.rng.seed` em vez do cursor
   vivo. Duas razões: a mesma semente dá sempre a mesma aptidão, e migrar um save
   antigo não empurra o cursor — o que mudaria todos os sorteios seguintes de uma
   campanha em andamento.
2. **Não substituir `pericias`.** Os verbos dependem delas. `sincronizarPericias`
   faz a ponte: maestria alta eleva o grau da perícia correspondente, então
   treinar um domínio abre os verbos que já existiam.
3. **Migração reconstrói, não zera.** Um save antigo com perícia 3 e nível 12
   volta com maestria compatível. Um veterano de dez anos não acorda sem saber
   nada.
4. **`picoReputacao` em vez de relaxar o invariante.** Ver acima.
5. **Não mexi em `ascensao.ts` (CHIM) nem na escada de poder.** Ambos são decisão
   de design pendente e nenhum dos dois foi pedido nesta tarefa.

---

## Testes executados

- `npx tsc --noEmit` — limpo.
- `engine/selftest.ts` — TODOS OS TESTES PASSARAM.
- `engine/kimetsu.selftest.ts` — 18 testes de integração.
- `engine/familia.selftest.ts` — família, infância e guerra.
- `engine/aptidao.selftest.ts` — **40 asserções**, todas passando.
- `engine/simLongo.ts 10 6` — 6 campanhas × 10 anos com os invariantes novos
  (aptidão na faixa, reputação nunca acima da exposição, fama nunca acima do
  pico, crença nunca sem observação, nenhum degrau repetido):
  **zero violações**, 26,9 s.
- `npx expo export --platform web` — **build concluído**, bundle 922 KB,
  `Exported: dist`.

Nenhuma regressão nas suítes anteriores.

---

## Problemas encontrados

1. **O invariante de fama estava errado, não o código.** O simulador acusou 1200
   violações de `fama_acima_da_reputacao`. Investigando, o comportamento estava
   certo: glória antiga esfria devagar. Corrigido com `picoReputacao`.
2. **A escada de poder está invertida** (medição acima). Não corrigido — é
   decisão de design. Enquanto isso não for resolvido, o eixo de identidade que
   este sistema cria não se traduz em desfecho de combate: a maestria melhora
   `acerto` via perícia, mas vida e dano continuam parados.
3. Heredocs com aspas triplas geraram arquivos de zero byte no diretório raiz
   durante a sessão. Todos removidos; árvore verificada limpa antes do commit.

---

## Pendências

1. **Escada de poder** (bloqueia o valor prático deste sistema): decidir se nível
   dá vida e dano de forma linear, se os saltos vêm da identidade (marca,
   despertares, mestre, linhagem), ou os dois. Sem isso, maestria 90 continua
   perdendo para um oni nível 15.
2. **UI**: nada foi criado. Maestria, reputação e fama existem no estado e no
   pacote do narrador, mas o jogador não vê nada disso em tela, e a ação
   `conter_se` não tem botão. `ui/screens/Paineis.tsx` é o lugar.
3. **Aptidão de NPC**: só o jogador tem aptidão. Um irmão prodígio continua sendo
   uma flag booleana em `familia.ts`. Estender `AptidaoState` a NPCs permitiria
   rivais que crescem por talento próprio.
4. **Reações de degrau são texto e reputação de facção.** Ainda não geram missão,
   recrutamento, espionagem nem sequestro — os ganchos existem
   (`oferecerMissao`), mas o conteúdo dessas missões não foi escrito.
5. Os quatro achados de balanceamento da sessão anterior continuam abertos:
   Nemesis que só acumula, fome estrutural das cidades, prazo fixo de missão e
   taxa de vitória.
---

# SESSÃO 3 — Progressão de poder híbrida

## Estado encontrado antes destas alterações

Ponto de partida: commit `59d1692` (sistema de aptidão), typecheck limpo, cinco
suítes passando, 6 campanhas × 10 anos sem violação.

O defeito estava diagnosticado desde a sessão 1 e continuava intacto:

- `processarSubidaDeNivel` só incrementava `p.nivel`.
- `derivados()` ligava nível a `acerto`, `poder` e `dificuldadeImposta`, mas
  **não** a `defesa`.
- `danoJogador()` devolvia o dano da arma e nada mais — dois personagens com a
  mesma espada batiam igual, viesse um do nível 1 e o outro do 25.
- A vida máxima era carimbada em `criarPersonagem` (`20 + mod(resiliência)*4`) e
  nunca mais mexia.

Medição inicial com o banco de provas recém-construído, **antes de qualquer
alteração de fórmula**:

| perfil | vida | defesa | dano | poder efetivo |
|---|---|---|---|---|
| recruta (nível 1) | 20 | 13 | 9,0 | 4,2 |
| veterano (nível 12) | 24 | 15 | 9,0 | 7,6 |
| mestre (nível 25, maestria 80) | 28 | 17 | 9,0 | 9,9 |

Vinte e cinco níveis e maestria 80 valiam **2,4× o recruta**. E na campanha
longa a taxa de vitória por faixa de nível **descia**: 14,8% no nível 1-5 contra
5,5% no 16-20.

---

## O que foi implementado

### Régua de poder efetivo (`engine/poder.ts`)
Ferramenta interna de balanceamento. Não é atributo, não aparece em tela, não
entra no pacote do narrador.

- `danoPorRodada(a, b)` e `rodadasParaDerrubar(a, b)` — a regeneração do oni
  entra como dano negativo, que é como ela funciona no combate real; quem não
  supera a regeneração nunca derruba, e o resultado é `Infinity`, honestamente.
- `vantagemNoDuelo(a, b)` — quantas vezes A derruba B mais rápido do que B
  derruba A. **É esta a razão que a tabela de referência usa.**
- `podeDerrotar()` — um oni comum só morre por Nichirin. Sem a lâmina certa a
  razão é 0: nenhuma quantidade de dano resolve. Não é desequilíbrio, é a regra
  do mundo, e é o exemplo mais claro de por que poder não se mede por nível.
- `adversarioNaRazao()` — adversário artificial na razão exata pedida.
- `mensuravelPorDuelo()` — exclui alvos com regra de morte própria (gêmeos,
  luz do sol); medi-los mediria a regra, não o balanço.

Uma primeira versão media os dois lados contra um boneco fixo. Foi descartada:
inflava absurdamente qualquer criatura com regeneração, porque contra o boneco
fraco ela era imortal — mesmo sendo fácil para um caçador de verdade.

### Nível → base (moderado)
- **Vida** (`progresso.ts`): `VIDA_BASE + mod(resiliência)*4 + (nível-1) × (2 + mod(resiliência))`.
  `VIDA_BASE` subiu de 20 para 44 **por medição**: com 20, um nível 1 morria em
  dois golpes e todas as faixas colapsavam perto de 50% — não havia rodadas
  suficientes para a diferença de poder aparecer.
- **Defesa**: `+ floor(nível/3)`.
- **Dano**: `+ floor(nível/3)`.
- **Vigor e mana**: `+ floor(nível/2)`.
- `recalcularRecursosMaximos()` roda a cada subida e preserva a proporção de
  ferimento: ganhar nível não cura.

### Maestria → técnica
- **Eficiência com a arma**: o gume é multiplicado por `1 + maestria/200` (até +50%).
- **Crítico**: janela de `0,25` para até `0,45` (`0,25 + maestria/500`).
- **Aparadura**: defesa `+ floor(maestria/18)`.
- **Precisão**: acerto `+ floor(maestria/25)`.

### Equipamento continua importando, mas quem segura também
`danoJogador()` passou a somar três frentes sobre a arma: eficiência técnica
multiplica o gume, atributo de ataque e nível somam por cima.

### Precisão satura
`acerto` crescia +1 por nível sem contrapartida: por volta do nível 20 o jogador
acertava 97,8% dos golpes e o combate deixava de ter erro — sem erro não há
luta, só aritmética. O termo de nível ganhou teto em 15. Passado o teto, quem
continua crescendo é dano, vida e defesa.

### Banco de provas (`engine/balanco.ts`, `engine/simBalanco.ts`)
`npm run balanco -- [combates]`. Roda combates reais contra adversários
sintéticos na razão exata de cada faixa, e reporta à parte a **cobertura do
bestiário**: quantas criaturas reais existem em cada faixa para aquele perfil.

---

## Resultados — antes e depois

### Poder efetivo por perfil

| perfil | antes | depois |
|---|---|---|
| recruta (nível 1) | vida 20 · dano 9,0 · **poder 4,2** | vida 44 · dano 9,2 · **poder 6,3** |
| veterano (nível 12) | vida 24 · dano 9,0 · **poder 7,6** | vida 81 · dano 16,0 · **poder 33,2** |
| mestre (nível 25) | vida 28 · dano 9,0 · **poder 9,9** | vida 148 · dano 22,6 · **poder 140,8** |

O mestre saiu de 2,4× o recruta para **22× o recruta**.

### Tabela de referência (400 combates por faixa)

| perfil | faixas dentro do alvo |
|---|---|
| recruta | 3 de 5 |
| veterano | 4 de 5 |
| mestre | **5 de 5** |
| caçador com Nichirin | **5 de 5** |

**17 de 20.** Os três desvios são todos do lado "jogador superior" em níveis
baixos, entre 2 e 5 pontos percentuais fora, e têm a mesma causa: luta curta
tem variância demais para a razão se expressar.

### Curva de vitória em campanha longa (10 anos, 6 sementes)

| Nível | Antes | Depois |
|---|---|---|
| 1-5 | 14,8% | 27,9% |
| 6-10 | 10,0% | 36,1% |
| 11-15 | 5,7% | 34,4% |
| 16-20 | 5,5% | 37,1% |
| 21-25 | 10,3% | 42,2% |
| 26+ | — | 61,9% |

A curva deixou de descer. O platô entre 6 e 20 é o jogador acompanhando um mundo
que também endurece (nemesis evolui, viagem leva a lugares piores); o salto em
26+ é onde ele finalmente ultrapassa.

---

## Bugs encontrados pelo caminho

1. **O mundo congelava durante lutas longas.** `avancaTurno` avança o calendário
   a cada doze rodadas, mas nada tiquetaqueava o mundo: dias passavam sem cidade
   produzir, sem NPC decidir e sem missão vencer. Ficava invisível enquanto o
   jogador morria em duas rodadas; com a progressão corrigida as lutas ficaram
   longas e o atraso apareceu como 1200 violações de `missao_vencida_ainda_aberta`.
   `encerrar()` passou a chamar `avancarMundo` e recuperar os dias de uma vez.
2. **Combates sem fim.** A medição registrou uma luta de **4498 rodadas** —
   dois meses de calendário num confronto só — tipicamente contra um oni cuja
   regeneração empata com o dano recebido. Criado `RODADAS_ATE_ROMPER = 150`:
   passado o teto, os dois lados recuam.
3. **Reputação sobrevivia à exposição.** A exposição esfria todo dia; a
   reputação não acompanhava e ficava acima dela. Corrigido em
   `processarAptidao`: sem novidade, a reputação esfria junto. A fama é que fica
   para trás, e de propósito — é o que `picoReputacao` guarda.

Além disso, um invariante meu estava mal escopado: cobrava prazo de missão com
combate aberto, quando o atraso do mundo ali é legítimo. Passou a só valer fora
de combate.

---

## Arquivos alterados

### Criados
- `engine/poder.ts` — régua de poder efetivo e duelo.
- `engine/balanco.ts` — banco de provas contra a tabela de referência.
- `engine/simBalanco.ts` — relatório de linha de comando.

### Modificados
- `engine/combat.ts` — `defesaJogador` e `janelaCriticaJogador` extraídas;
  dano com contribuição do usuário; teto de precisão; `RODADAS_ATE_ROMPER`;
  tique do mundo ao encerrar.
- `engine/progresso.ts` — `recalcularRecursosMaximos`, `vidaMaxima`, `VIDA_BASE`,
  `ganhoDeVidaPorNivel`.
- `engine/character.ts` — `recursoMaximo` exportada.
- `engine/types.ts` — `CombatActor.janelaCritica`.
- `engine/aptidao.ts` — reputação esfria com a exposição.
- `engine/campanhaLonga.ts` — invariante de missão escopado; métrica
  `rodadaMaisLonga`.
- `package.json` — script `balanco`.

---

## Testes executados

- `npx tsc --noEmit` — limpo.
- `engine/selftest.ts` — TODOS OS TESTES PASSARAM.
- `engine/kimetsu.selftest.ts` — 18 testes de integração.
- `engine/familia.selftest.ts` — família, infância e guerra.
- `engine/aptidao.selftest.ts` — 40 asserções.
- `engine/simLongo.ts 10 6` — **zero violações**, 48,5 s.
- `engine/simBalanco.ts 400` — 17 de 20 faixas dentro do alvo.
- `npx expo export --platform web` — build concluído.

Nenhuma regressão.

---

## Pendências

1. **O bestiário não cobre jogador de nível alto.** A criatura não-oni mais
   forte é "O Selado" (nível 9). Para um veterano a razão contra ela já é 1,34;
   para o mestre, 20,49. Fora dos onis, não existe adversário do tamanho de um
   personagem maduro. É conteúdo, não fórmula, e o relatório de cobertura do
   `balanco` mostra a lacuna faixa a faixa.
2. **Faixas baixas ainda comprimidas** (3 de 20 fora, 2 a 5 pontos). Luta curta
   é cara ou coroa. Só sai com mais vida inicial ou armas menos letais no começo
   — as duas com efeito colateral no ritmo dos primeiros capítulos.
3. **Aliados e NPCs não recebem a nova progressão.** `combatente` continua sendo
   ficha fixa: um companheiro não fica mais forte com o tempo, e o Nemesis só
   evolui pelo bônus antigo de `evolucao.nivel`.
4. **A identidade rara ainda não gera salto.** Este commit estabilizou
   `nível → atributos → combate → maestria → equipamento`, como combinado.
   Marca, linhagem, pacto, despertar e técnica secreta continuam sem multiplicar
   nada. `concederDespertar` (+3 níveis) é o único gancho existente.
5. **CHIM intocado**, conforme pedido.
6. Os achados de balanceamento das sessões anteriores continuam abertos: Nemesis
   que só acumula, fome estrutural das cidades e prazo fixo de missão.

---

## Sessão 4 — Astra — 2026-09-06 — expedições, legados e companheiros

### Estado recebido e preservado

HEAD recebido: `808a5fc`. Árvore inicialmente limpa. Leitura das três sessões
acima e de AGENTS.md antes de editar; trabalho de um único agente.
Baseline: `npm run test:engine` passou, seis campanhas sem violações;
`npm run balanco -- 400` mostrou 17/20 faixas dentro dos alvos. A cobertura
já era calculada pelo módulo, mas o comando não a imprimia. Nenhum alvo de
vitória, prazo de missão, produção das cidades ou acúmulo de Nemesis foi alterado.

### Implementado

- Dez criaturas originais não-oni, níveis 10–32, com expedições locais opcionais
  em `content/vaelhorn/desafios.ts`. Fichas fixas: não escalam com o jogador,
  não entram no sorteio normal de viagens. Conclusão e recompensa únicas por
  campanha; derrota/fuga permitem nova tentativa. Interface no painel da comunidade.
- Dois legados conquistados, em `engine/identidade.ts`: ancestral (vida ×1,20,
  dano ×1,25) e eclipse (vida ×1,10, dano ×1,15). Vale o maior multiplicador,
  sem produto acumulativo. Eclipse exige vencer a expedição e maestria 80;
  pode ser consolidado depois se a maestria ainda não bastava na vitória.
  São adaptações RPG, não a Marca canônica. Potencial de nascimento não concede bônus.
- Despertar recalcula recursos imediatamente, conservando ferimentos proporcionais.
  Recalcular não ressuscita. Campanhas novas agora usam a vida da fórmula aprovada
  (a fábrica ainda deixava a vida antiga); saves recebem migração única fora de combate.
- `engine/progressaoNpc.ts`: esforço, experiência, potencial privado e ficha
  derivada persistentes. Treino autônomo, prática em combate e treino pago com
  companheiro afetam atributos reais usados nas lutas. Cura diária usa o novo máximo.
  Migração preserva habilidade anterior; treino não consome RNG da campanha.
- Ficha mostra maestria/reputação adquiridas, ocultação e legados; Vínculos mostra
  progressão e treino dos aliados. Acerto/defesa passam a usar os cálculos de combate.
- Novos constructos/feras não podem se render como humanos nem escravizar o jogador.
  Campo opcional `Criatura.humano` preserva compatibilidade do conteúdo antigo.
- Simulador distingue `limite_acoes` de um travamento real; orçamento não aumentou.

### Arquivos de integração

Além dos novos módulos: `engine/{acoesMundo,autonomia,campaign,campanhaLonga,
combat,index,llm,migracao,mundo,progresso,simBalanco,types}.ts`,
`content/vaelhorn/index.ts`, `ui/screens/{MundoVivo,Paineis,Progressao}.tsx`,
`package.json`. Nova suíte `engine/expansao.selftest.ts` incluída em test:engine.

### Verificação executada

- `npm run typecheck`: passou.
- `npm run test:engine`: cinco suítes e seis campanhas, zero violações, 53,1 s.
  Três campanhas atingiram dez anos; as outras pararam em 8/9/9 anos pelo limite
  de ações. Média 9,3 anos, 36.413 ações e 1.023,5 combates por campanha.
  Não confundir teste automático da engine com sessão manual pela interface.
- Suíte de expansão executada novamente após acrescentar vitória real em fixture
  controlada: conclusão, impossibilidade de repetir, save, progressão, sigilo,
  idempotência, ferimentos e não-ressurreição passaram.
- `npm run balanco -- 400`: mesmos 17/20 alvos sintéticos do baseline.
  Cobertura estimada agora preenche cinco faixas para veterano e mestre;
  caçador com Nichirin ainda tem três faixas vazias. Cobertura não é taxa empírica.
- `npx expo export --platform web`: passou, 334 módulos, bundle de 936 KB.
- Não houve teste visual interativo, build Android/APK nem teste de narrador remoto.

### Pendências / limites desta entrega

1. Não é implementação integral de marca, linhagens, pactos e técnicas canônicas.
   Foram conectados dois legados verificáveis. CHIM continua intocado.
2. Nemesis ainda usa a progressão própria anterior. NPCs sem ficha combatente
   não se tornam combatentes por esta mudança; prodígios familiares precisam de
   uma trajetória de aquisição de profissão/ficha, não apenas números.
3. As quatro decisões do usuário continuam abertas: acúmulo de Nemesis, fome,
   prazo de missão e taxa de vitória desejada. Três faixas sintéticas seguem fora.
4. Simulação longa usa a política automática existente; não explora sistematicamente
   cada nova expedição nem recrutamento. Próximo passo: testes longos específicos
   de grupo/expedições e validação visual dos botões/estados pela interface.
5. Migração dos recursos de save com combate em andamento fica adiada até
   normalização posterior fora do combate; não reescrever atores no meio da luta.
6. Alterações desta sessão estão locais, sem commit/push efetuado pelo Astra.

---

## Sessão 5 — em andamento — integração causal — 2026-09-06

Pedido: implementar a proposta de qualidade e deixar continuidade explícita ao Claude.
Estado recebido: alterações locais da sessão 4 ainda presentes; preservar todas.
Plano, registrado antes da implementação:

1. Missões: prazo contextual, origem/data persistentes, pessoas envolvidas,
   resolução independente e atribuição correta de participação.
2. Nemesis: perseguir pistas conhecidas, não coordenadas oniscientes; recuperação,
   desistência, feitos limitados e ameaça pessoal somente com encontro testemunhado.
3. Sociedade: economia de subsistência proporcional à população com perdas reais
   por crises; formação profissional de familiares sem transformar talento em destino.
4. Identidades: preservar cânone e separar adaptação RPG. Não inventar pacto/Marca
   só para preencher uma lista; registrar implementado versus ainda proposto.
5. Visibilidade: motivos dos prazos, biografias e impactos acessíveis na interface.
6. Testar antes/depois, atualizar este registro com resultados e ponto exato de parada.

Critérios: consequências persistentes, determinismo, ausência de recompensas
duplicadas, nenhum morto ressuscitado, nenhuma perseguição sem pista e nenhuma
alteração em ficha canônica compartilhada. Metas de vitória continuam iguais;
coeficientes novos são regras provisórias de RPG, sujeitos a medição posterior.

### PARADA SOLICITADA PELO USUÁRIO — limite de uso (2026-09-06)

**Claude: continuar daqui, não da sessão 4. Sessão 5 está PARCIAL e ainda não
validada integralmente.** Usuário pediu parar e documentar por restarem 2% de uso.
Nenhum commit/push foi feito. As alterações das sessões 4 e 5 coexistem na árvore.
Não há outro agente modificando arquivos.

#### O que já foi escrito nesta sessão

- `engine/missoesVivas.ts`: novos `periodosDeViagem` (menor custo de rota) e
  `janelaMissao`. Urgência por crise/tipo, escolta acrescenta deslocamento usando
  os seis períodos reais do dia; destinos desconectados são rejeitados quando
  o conteúdo é fornecido. Novos campos opcionais `criadaEm`, `aceitaEm`,
  `motivoPrazo` em `vivoTypes.ts`. Missões antigas preservam seus prazos.
  Deduplicação considera rival. Atribuição de vitória usa data de aceitação,
  com fallback para saves antigos, em vez de assumir sempre prazo de dez dias.
- `engine/acoesMundo.ts`: registra aceitação; confronto verifica se rival mudou
  de local e exige nova investigação. Revalida vida, localização e estado da
  missão após avançar o tempo. Passa rival específico ao combate.
- `engine/kimetsu.ts`, `kimetsuTypes.ts`: memória registra local e companheiros
  vivos presentes no confronto. `comportamento` guarda pista com validade de
  14 dias, recuperação de sete dias quando gravemente ferido, último feito e
  intervalo de ameaça pessoal. `obterRival` aceita alvo opcional validado.
- `engine/combat.ts`: `iniciarCombate` aceita quarto argumento opcional
  `rivalAlvo`, repassado a `obterRival`, para não selecionar outro oni do mesmo
  arquétipo numa missão dirigida.
- `engine/nemesis.ts`: perseguição usa pista testemunhada, não posição atual
  onisciente do jogador; recuperação impede emboscadas; pista expira e rancor
  diminui. Rede de servos só registra expansão real, pode perder servos em
  segurança alta e aprendizado por vitórias tem teto quatro. Ameaça pessoal
  referencia companheiro realmente visto, SEM sequestrá-lo por texto. Missões
  podem reaparecer com intervalo de 30 dias, não a cada semana. Caçador autônomo
  usa ficha derivada e recebe experiência após caçada concluída.
- `engine/cidades.ts`: subsistência proporcional à população, bônus de lavouras
  e perdas por doença/guerra/integridade/estação. Fórmula provisória:
  população × 0,20 × (1 + lavouras × 0,04) × fertilidade × condição
  × (1 - doença/150) × (guerra ? 0,6 : 1). Consumo anterior mantido.
- Novo `engine/formacao.ts`: somente NPCs pertencentes à campanha, adultos,
  livres e sem ficha combatente podem se formar. Vocação independente do RNG
  principal: ofício marcial ou chance determinística de 25%; demais preferem
  vida civil. Exige mentor combatente humano presente, saúde e sustento;
  20 sessões pagas de prática geram ficha básica, sem técnicas canônicas nem
  Nichirin gratuitas. Não modifica o catálogo compartilhado. Registra começo
  e conclusão, depois conecta à progressão existente.
- `engine/autonomia.ts`: chama formação na decisão civil; remove mortos do
  grupo; companheiro perde vínculo com grupo quando confiança < -5, apenas
  fora de combate ativo, com fato persistente.
- `ui/screens/MundoVivo.tsx`: mostra motivo de prazo e formação.
  `Paineis.tsx`: conecta `BiografiaViva` a Vínculos.

#### Validação REAL desta sessão

- ANTES das alterações: `npm run test:engine` passou (40,5 s, seis campanhas,
  zero violações, média 9,3 anos); `npm run balanco -- 400`: 17/20 faixas.
- Typecheck passou após a primeira integração de missões/Nemesis e novamente
  após formação/cidades/UI. A segunda chamada terminou com código global 1
  porque uma busca posterior usou pasta inexistente `content/kimetsu`, NÃO por
  erro TypeScript. Conteúdo correto: `content/vaelhorn/kimetsu.ts`.
- **Última alteração de rivalAlvo/revalidação pós-tempo ainda NÃO passou por
  typecheck. Nenhuma suíte completa nem build foi rodada após as mudanças da
  sessão 5. Não declarar estas mudanças prontas.**

#### Próximos passos exatos (prioridade)

1. Rodar `npm run typecheck`; revisar diff preservando sessões anteriores.
2. Criar suíte causal para prazos urgentes versus obras, rotas/desconexão,
   save antigo/novo, atribuição correta e recompensa única. Cobrir confronto
   cujo alvo morre/muda durante o avanço do relógio e seleção do rival exato.
3. Testar Nemesis sem pista, pista expirada, recuperação, teto por feitos,
   perda de rede, morte definitiva e ameaça pessoal somente a testemunhas.
   Rever `r.memoria` antiga sem local: migração não inventa pista, intencional.
4. Testar formação: menor/morto/cativo/sem mentor não progride, 20 sessões
   reais geram ficha persistente, conteúdo compartilhado intacto, vocação não
   consome RNG. Testar saída de grupo sem remover ator no meio de combate.
5. Simular cidade saudável por estações e crises; medir fome antes/depois.
   A nova produção AINDA NÃO foi avaliada em campanhas longas. Conferir se
   estoques/limites continuam coerentes para cidades muito populosas.
6. Rodar `npm run test:engine`, `npm run balanco -- 400` e
   `npx expo export --platform web`. Registrar resultados reais; metas de vitória
   não foram alteradas. Validar novas telas manualmente quando possível.

#### Cuidado / revisão pendente

- `janelaMissao` inclui distância de escolta, NÃO distância do jogador até
  toda missão. Isso evita que a localização do protagonista determine a
  duração de uma crise, mas ainda é uma versão limitada dos prazos contextuais.
- Ao localizar esconderijo vazio, `acoesMundo.ts` atualmente muda `q.local`
  diretamente para `rival.local`, narrando rastros. Rever se deve indicar só o
  próximo trecho da rota para evitar rastreamento perfeito do alvo pelo jogador.
- A morte de rival por NPC pode manter a última memória de vitória do jogador;
  revisar atribuição por autor explícito da morte para excluir crédito indevido
  em casos antigos/excepcionais (data sozinha não é prova absoluta).
- `formacao.ts` usa saúde civil para vida inicial da ficha e inicializa progressão;
  conferir proporção quando habilidade civil prévia já altera máximo derivado.
- Rival ainda se recupera conforme regra antiga de `obterRival`; a janela nova
  restringe perseguição/emboscada, não proíbe ser encontrado num esconderijo.
- Ameaça pessoal gera investigação contextual, não sistema completo de
  sequestro por onis. Não narrar consequências que a engine não aplicou.

#### Ainda NÃO implementado (não confundir com concluído)

- Último ponto planejado antes da interrupção: ações ativas dos DOIS legados
  existentes em combate, com custo/limite. **Nenhum código dessas ações foi
  escrito.** Apenas inspecionados `jogadorAcaoTatica`, `recargas`, recursos e UI.
  Ideia ainda não aprovada como regra final: ancestral voltado a sobrevivência,
  eclipse à precisão, ambos com custo e sem multiplicação infinita.
- Marca canônica, linhagem e pacto completos ainda ausentes. Exigem revisar os
  documentos do usuário e registrar requisitos/custos/incompatibilidades, não
  simplesmente adicionar multiplicadores. CHIM continua intocado.
- NPCs têm formação básica/ruptura por confiança, não desejos e decisões
  completos. Formação arcana/medicina e trajetórias de familiares ilustres
  continuam pendentes; não afirmar que um pai “mestre da espada” recebeu uma
  ficha equivalente ao passado narrado.
- Reação social específica a identidades raras, proteção familiar aprofundada,
  todas as alternativas narrativas e sinais de perigo completos faltam.
- Simulação longa ainda não percorre sistematicamente grupo, formação e
  expedições; precisa desses cenários antes de encerrar a versão jogável.
- Não houve commit, backup remoto, APK ou validação manual da sessão 5.

### Validação posterior da sessão 5 — pedido “testar então tudo”

Executada sobre os arquivos locais atuais, sem modificar regras de jogo:

- `npm run typecheck`: passou, inclusive alteração de rivalAlvo.
- `npm run test:engine`: cinco suítes passaram; seis campanhas simuladas,
  zero violações dos invariantes existentes, 27,4 segundos.
- Desfechos: longa-0/2/4 atingiram dez anos; longa-1/5 pararam aos sete anos
  pelo limite de ações; longa-3 terminou por morte aos dois anos.
  Média de 7,7 anos. NÃO foram seis campanhas completas de dez anos.
- Média por campanha: 807,5 combates, 450,5 vitórias, 101,5 derrotas,
  255,5 fugas; 266,8 missões geradas, 53,8 concluídas, 202 falhadas e dez
  resolvidas por outros. Emboscadas: 40,7; rivais vivos por dia: 13,7.
- Vitória por faixa: 1–5 = 15,6%; 6–10 = 24,1%; 11–15 = 30,3%;
  16–20 = 41,4%; 21–25 = 56,9%; 26+ = 76,4%.
  São resultados da política automática, não taxas garantidas para jogador humano.
- `npm run balanco -- 400`: 17/20 faixas sintéticas dentro dos alvos.
  Fora: recruta +20% (63%), recruta +40% (75,3%), veterano +40% (78,8%).
  Sem mudança perante o baseline. Caçador Nichirin ainda tem três lacunas de
  cobertura estimada; veterano e mestre têm cobertura nas cinco faixas.
- `npm run sim`: passou; 10.000 amostras por faixa e teste curto de agência.
- `npx expo export --platform web`: passou, 335 módulos, bundle 942 KB.

Limites: rodadas TODAS as suítes automatizadas já cadastradas, não todos os
fluxos possíveis. Suíte causal específica listada acima ainda não foi criada;
formação, expiração de pista, atribuição de morte e grupo precisam desses
casos dirigidos. Não houve sessão manual pela interface, teste Android/APK ou
validação do narrador remoto. Não há script de lint no package.json.
Não declarar “tudo pronto”: curva de dificuldade, falhas de missão e duração
dos cenários merecem investigação. Comparar fome absoluta entre execuções de
durações diferentes não prova melhoria. Nenhum commit/push efetuado.

## Sessão 6 — 2026-09-07 — plano registrado antes das alterações

Pedido: melhorar os problemas encontrados, preservando o trabalho anterior.
Escopo exclusivamente PC/web, sem Android/APK.

Ordem de execução:
1. Impedir mentor incapacitado/sem condições de ensinar; proteger aprendiz
   incapacitado e preservar proporção de saúde ao adquirir ficha derivada.
2. Adicionar regressões permanentes de formação, pistas, prazos, recompensa
   única e persistência completa dos novos sistemas.
3. Instrumentar missões: separar falha de compromisso aceito de oportunidade
   ignorada. Não aumentar prazos baseado em uma taxa agregada enganosa.
4. Validar integridade de save além do pequeno resumo atual; identificar
   diferenças de normalização explicitamente em vez de ocultá-las.
5. Executar typecheck, suítes, campanhas, balanço e build web; registrar
   resultados e pendências. Se faltar validação visual/narrador, dizer claramente.

Revisão posterior, condicionada à evidência: encontros iniciais e lacunas de
conteúdo avançado. Não alterar metas de vitória ou enfraquecer todos os inimigos
para compensar decisões da política automática. Não declarar a visão inteira
concluída por entregar essas correções. Sem commit/push automático.

### Entrega e evidências da sessão 6

- Bug reproduzido primeiro em `engine/causal.selftest.ts` (falha real do
  mentor incapacitado). Corrigido em `formacao.ts`: mentor exige vida positiva,
  saúde/sustento e ausência de cativeiro/viagem; aprendiz com vida zero não treina.
- Vida ao concluir formação agora usa máximo DERIVADO, conservando proporção
  da saúde civil mesmo quando havia habilidade prévia.
- Nova suíte causal cadastrada em `test:engine`: formação, menores, incapacitados,
  persistência civil/dinâmica, normalização idempotente de campanha inteira,
  save completo em combate (incluindo RNG/atores), urgência, desconexão de rota,
  recompensa única, pistas/recuperação/morte de rival.
- Contadores `compromissosFalhados` e `oportunidadesExpiradas` registrados na
  conclusão da missão e exibidos no relatório longo. São prospectivos em saves
  antigos; não reconstroem histórico já compactado.
- Mapa PC agora informa risco numérico da rota, agravamento noturno e ausência
  de garantia de adversário do nível do jogador. Sem mudar chance de encontro.

Validação: typecheck e seis suítes passaram; seis campanhas sem violações,
31,5 s. Quatro chegaram a dez anos; duas pararam aos sete pelo orçamento de
ações. Média nove anos. Balanço permanece 17/20. Build web passou antes e
depois do último aviso textual do mapa; `git diff --check` também passou.
Teste causal e typecheck repetidos depois do teste completo de save em combate,
também passaram. Nenhuma mudança em metas de vitória, prazos ou dano nesta sessão.

Achado: média 238,3 missões falhadas, sendo 235,3 aceitas e três não aceitas.
Em `campanhaLonga.ts`, a política aceita pedidos conhecidos com probabilidade
0,7, mas só age se já estiver no destino; NÃO planeja viagem para cumprir o
compromisso. Portanto a alta taxa não justifica sozinha aumentar prazos.

Pendências explícitas:
1. Criar política adicional de simulação orientada a objetivos/rotas, preservando
   a atual como teste exploratório. Comparar mesmas sementes antes de balancear.
2. O loop longo ainda usa retrato resumido do save; comparação completa foi
   adicionada à suíte causal em cenários controlados, não em todos os saves da
   simulação. Criação crua normaliza campos opcionais ausentes (opcoesUsadas,
   marcos, ecos, almasSeladas); diferenciar preenchimento legítimo de perda real.
3. Continuam três faixas sintéticas fora e lacunas de cobertura Nichirin.
   Não foram adicionados inimigos nem alterado balanço neste lote.
4. Validação visual interativa e narrador externo não executados. Escopo PC,
   sem Android. Identidades raras completas e demais pendências da sessão 5
   NÃO estão concluídas por estas correções.
5. Arquivos locais, sem commit/push. Preservar mudanças das sessões anteriores.

## Sessão 7 — plano antes da implementação — 2026-09-07

Pedido: cobertura avançada, corrigir viés do simulador e commit para Claude.
1. Preservar política exploratória original; criar política adicional por objetivos.
2. Política nova avalia rota/prazo, limita compromissos simultâneos, prioriza
   viagem/execução pela engine real e não concede dinheiro, teleporte ou vitórias.
3. Adicionar testes de planejamento e comparação por mesmas sementes. Cobertura
   avançada aqui é de simulação/testes; lacunas de criaturas Nichirin continuam
   separadas para não misturar conteúdo e correção da ferramenta de medição.
4. Executar ambas as políticas, testes, typecheck, balanço e build PC; registrar
   resultados sem confundir melhoria do agente simulado com melhoria do jogo.
5. Fazer commit das sessões locais acumuladas e deste lote, conforme autorização.
   Push não solicitado: commit local não implica backup remoto atualizado.

### Entrega da sessão 7

- `engine/planejadorSim.ts`: planejamento puro por informações de missão
  conhecidas; menor custo de rota, verificação de prazo/alcance, prioridade ao
  compromisso aceito e ação ao chegar. Sem teleporte, dinheiro ou XP artificiais.
- Após derrota/fuga testemunhada, pausa sete dias antes de insistir na caçada.
  Não confronta oni identificado sem arma contra oni. Essas são decisões do
  agente de TESTE; regras e dificuldade do jogo não foram alteradas.
- `campanhaLonga.ts`: política opcional `objetivos`, política original
  `exploratoria` preservada. Viagens planejadas entram nas métricas de viagem.
- `simLongo.ts`: quinto argumento seleciona política, valida argumentos básicos.
  Comparação reproduzível: `node node_modules/tsx/dist/cli.mjs engine/simLongo.ts
  10 6 comum objetivos` e o mesmo com `exploratoria` (uma única linha por comando).
- `causal.selftest.ts`: cobertura de aceitação alcançável, caminho de menor
  tempo, execução ao chegar, prazo vencido, destino desconectado e RNG estável.
  Mantém testes anteriores de formação, persistência completa em combate e Nemesis.

### Resultados e interpretação

Typecheck, seis suítes, `test:engine`, balanço (17/20), build web e diff-check
passaram. Após a última cautela do planejador, typecheck/suíte causal repetidos
e lote objetivos executado novamente: zero violações, 37,4 s.

Mesmas sementes longa-0..5, marca comum, horizonte dez anos:

| Métrica média | Exploratória | Objetivos final |
|---|---:|---:|
| Anos efetivamente simulados | 9 | 10 |
| Missões concluídas | 56,7 | 173,5 |
| Compromissos falhados | 235,3 | 167,3 |
| Oportunidades expiradas | 3 | 44,3 |
| Combates por painel | 235,7 | 0 |

Objetivos: seis campanhas completas de dez anos; exploratória: quatro completas,
duas limitadas a sete anos. Não comparar totais como durações iguais. Primeira
versão do planejador insistia em caçadas perdidas e atingia limites cedo; a
versão final evita isso, mas os ZERO confrontos por painel revelam uma lacuna:
o agente ainda não planeja aquisição de Nichirin para a trajetória de caçador.
A alta vitória desta política NÃO prova balanço resolvido, pois selecionou
encontros diferentes. Não usar estes números para enfraquecer/fortalecer tudo.

### Próximo passo para Claude

1. Política especializada de caçador: obtenção legítima de equipamento,
   recrutamento e preparo, seguida de caçadas/expedições. Cobrir grupos durante
   anos, não apenas fixtures. Preservar as duas políticas existentes.
2. Três lacunas do bestiário Nichirin e três faixas fora do alvo continuam abertas;
   não foi criado conteúdo adicional nesta sessão. Cobertura ampliada foi de testes.
3. Save completo em simulação contínua, atribuição explícita de morte, pista
   parcial do alvo e identidade rara completa continuam nos registros anteriores.
4. UI/narrador externo não validados. PC apenas. Commit deste lote inclui as
   sessões 4–7 antes locais, sobre os três commits preservados do Claude.
5. Commit solicitado; sem push automático. Claude no mesmo checkout vê o commit;
   cópia remota só recebe depois de envio autorizado.

## Sessão 8 — plano de cobertura sistêmica — 2026-09-07

Pedido: testes em todos os sistemas e simulação ampla, com registro no HANDOFF.
Plano anterior à edição: inventariar os módulos; adicionar suíte de integração
para comércio/equipamento, grupo, caçadas e expedições, cidades/construção,
política e ascensão. Usar cenários controlados declarados como fixtures, não
apresentá-los como campanhas naturais. Executar as suítes e as duas políticas
longas, registrar lacunas por sistema em matriz de cobertura. Não alegar 100%
de cobertura sem medição de branches/linhas; UI e narrador externo são camadas
distintas. Nenhuma regra de balanceamento será alterada para fazer teste passar.

### Sessão 8 — resultado

Criados `engine/sistemas.selftest.ts` e `TESTES.md` (matriz de cenários e lacunas).
Suíte sistêmica incluída em `test:engine`; novo `npm run test:all` executa
typecheck, sete suítes, ambas as políticas longas, sim curto, balanço e build PC.

Cobertura nova executada:
- 280 combates: todas as 70 criaturas × quatro sementes. Compra real de Nichirin,
  débito de estoque/moedas, equipamento, dois aliados, rejeição do terceiro,
  bloqueio de troca durante luta, save completo com RNG/atores, término de combate.
  Nível/dinheiro/confiança/posições são fixtures explícitas, não conquistas naturais.
- Um ano de cidade saudável nas quatro estações sem fome, obra e limite de obra
  simultânea, conclusão de serviço e seca gerando fome. Cenário civil isolado.
- Sucessão após morte de líder e ausência de governos públicos oni/caçadores.
- Ascensão: requisitos, almas únicas, não repetição e proteção por cem avanços
  anuais. Testa regras existentes; não altera CHIM.
- Fusão: escolas distintas, três criações, custo de dias, resolução e save da arte.
- 10.000 resoluções de duelo (5.000 sem/com reforço), três desfechos e benefício
  do reforço. Ainda falta matriz dos efeitos de cada duelo sobre o mundo.

`npm run test:all` terminou com exit 0. Exploratória: quatro campanhas completas
de dez anos e duas de sete limitadas por ações, zero violações. Objetivos: seis
campanhas completas de dez anos, zero violações. Balanço permanece 17/20 (o
diagnóstico não retorna erro pelas três faixas fora do alvo). Build web passou.
Fusão/duelos foram acrescentados enquanto rodava o lote longo; a suíte sistêmica
completa e typecheck foram repetidos depois e passaram.

Não afirmar cobertura total: `TESTES.md` discrimina cenários versus lacunas,
sem inventar porcentagem de linhas/branches. Faltam E2E no navegador e storage
real, narrador externo, campanha natural adquirindo Nichirin e formando grupo,
comparação integral em TODO save da simulação e variações de todas as técnicas.
Este lote modifica apenas testes/comandos/documentação, não regras do jogo.
Mudanças da sessão 8 ainda locais; último commit anterior: a62f47a.

## Sessão 9 — assentamentos e contexto narrativo — plano

Pedido: ampliar cobertura de assentamentos/melhoria contínua e explicar como
o narrador personaliza a experiência. Escopo: testes e diagnóstico, não criação
de sistema de fundação sem especificação. Estado verificado: iniciarContinuidade
instancia assentamentos em locais fixos do catálogo; não existe ação de fundar
cidade do zero. Testar todos os edifícios, custos, bloqueio, interrupção/retomada,
persistência e espelhamento no pacote do narrador. Verificar rumor versus fato
oculto e ausência de mutação do estado ao montar contexto.

Narrador atual: pacote já contém comunidade, obra, crise, compromissos, memória,
relação, personalidade e crenças sobre talento. Limite: últimos seis fatos
conhecidos globais podem deslocar história pessoal/local importante. Um prompt
não garante fidelidade factual de toda a prosa; não declarar validação de modelo
externo sem realmente executá-lo. Registrar recomendações separadas do implementado.

### Resultado da sessão 9

Nova suíte `engine/assentamentos.selftest.ts`, incluída em test:engine:
59 asserções passaram, assim como typecheck. Para cada um dos cinco edifícios:
ausência de material, débito exato, projeto único, envio da obra ao narrador,
parada sem trabalhadores/por guerra, retomada em paz, save integral da cidade,
conclusão/registro histórico e teto sem cobrança. Quatro verificações de contexto:
fato histórico oculto excluído, rumor rotulado, campanha não mutada e protagonista
correto. Não executado modelo externo; não alteradas regras ou prompt do narrador.

Recomendações narrativas, NÃO implementadas nesta sessão:
1. Seleção por relevância pessoal/local: obra que o jogador financiou, família,
   pessoa presente e rival conhecido devem competir por contexto com a recência.
2. Estado visual do local deve sobrepor atmosfera estática do catálogo: ruína,
   escassez ou obra não podem ser contraditas por descrição fixa de prosperidade.
3. Separar estado confirmado, rumor e espaço descritivo livre no contrato do
   narrador. Cor/som/gesto não devem conceder pessoas, inventário ou construções.
4. Memória de cena e comparação entre visitas: lembrar o que mudou desde a
   última passagem, com causa e atores reais, sem repetir relatório numérico.
5. Teste de saída do modelo com casos de obra interrompida, retorno anos depois,
   morte familiar e rumor falso; comparar contradições, repetição e relevância.

Fundar assentamento do zero continua ausente: mapa, população inicial,
terreno, custos e rotas exigem sistema próprio. Não anunciar cobertura de uma
ação que não existe. Documentos/testes desta e da sessão 8 permanecem locais.

Validação final da sessão 9: `npm run test:engine` terminou com exit 0,
incluindo as oito suítes e seis campanhas exploratórias. Quatro chegaram aos
dez anos; duas pararam aos sete pelo limite de ações. Zero violações de
invariantes. `git diff --check` passou (apenas avisos de conversão LF/CRLF).
Isso não mede qualidade literária nem fidelidade da saída de um narrador externo.

## Sessão 10 — contexto narrativo orgânico — plano

Implementar os quatro pontos aprovados: fatos por relevância pessoal/local,
comparação com a última saída do local persistida no save, atmosfera derivada
de ruína/fome/obra e contrato explícito de voz/conhecimento. Preservar estado
canônico e os testes locais anteriores. Montar pacote continuará puro; registrar
observações na viagem, não na chamada ao modelo. Saves antigos sem observação
não terão passado inventado. Corrigir instrução conflitante que mandava realizar
literalmente a intenção livre mesmo quando a engine resolve falha. Validar
contexto, viagem, save e prompt sem cobrar chamadas externas ao usuário.

### Implementação da sessão 10

- `engine/contextoNarrativo.ts`: seleção determinística de até seis fatos
  conhecidos por vínculo familiar/grupo, compromisso, local e pessoa presente;
  desempate por recência. Separa confirmados/rumores e omite resumo causal quando
  a causa não consta dos fatos conhecidos (inclusive quando já compactada).
- `Campaign.observacoesLocais` opcional: snapshot independente por local na saída,
  em `viagem.ts` antes do avanço temporal e na saída do castelo em `combat.ts`.
  Campo serializado normalmente, preservado pela migração; saves antigos sem
  campo não inventam comparação. Não altera RNG ou custos. Não mede ausência
  exata: informa dias desde a saída registrada, mesmo permanecendo no retorno.
- `llm.ts`: atmosfera dinâmica, diferenças desde a saída, contrato de voz e
  conhecimento. Intenção livre deixa de ordenar sucesso automático; resultado
  da engine prevalece. Ganchos deixam de ser obrigatórios em toda cena.
- `assentamentos.selftest.ts`: 17 asserções novas, 76 totais; typecheck passou.
  HTTP simulado verifica o pedido real sem rede/crédito. `TESTES.md` atualizado.

Limites: histórico de fatos continua limitado aos 300 registros da engine;
seleção não recupera textos já compactados. Autoria de financiamento ausente
não é inferida. Voz/rumor são contrato de geração, não verificador semântico
da prosa retornada. Sem chamada externa nem E2E visual. Fundação continua fora
do escopo. Preservadas alterações locais das sessões 8 e 9; sem commit novo.

Validação final: typecheck, oito suítes de test:engine e exportação web passaram.
Seis campanhas exploratórias sem violações; quatro completaram dez anos e duas
pararam aos sete pelo limite de ações. Métricas iguais às da sessão 9: a camada
narrativa não mudou os resultados sistêmicos dessas sementes. Build web 946 KB.

## Sessão 11 — validação ampla e presença opcional de onis — plano

Usuário esclarece que Corporação/transformação oni não devem dominar toda vida;
encontros podem ser raros ou concentrados, e caminhos excepcionais são desejados.
Rodar test:all e acrescentar matriz reproduzível de encontros por local/horário
e ciclo de vida dos seis tipos de missão. Medir presença oni sem mudar números
ou implementar carreiras neste pedido de testes. Não confundir filtro solar com
diretor de frequência nem declarar caminho Hashira/Yoriichi sem sistema real.

### Resultado da sessão 11

test:all anterior à inclusão da nova suíte passou: oito suítes, 12 campanhas
(dez completas de dez anos, duas de sete por limite de ações), zero violações,
sim curto, balanço e build web. Balanço continua com 3/20 faixas fora do alvo.
Nova `jornadas.selftest.ts` via `npm run test:jornadas`, adicionada ao test:all:
114 locais/horários × 400 sorteios = 45.600, 12.562 encontros, 3.165 com oni.
Sol direto exclui onis vulneráveis. Na estrada/noite 111/400 sorteios com oni
(111/139 encontros). Não é taxa observada em viagens naturais: perigo do local
como fixture, sem custo da rota e sem emboscada Nemesis. Não mudar balanceamento
com base apenas nessa amostra; não há modulador de frequência pessoal no filtro.

Seis tipos de missão × oferecida/aceita passaram em prazo, duplicação, save,
expiração, contadores e pagamento único. Abastecer/tratar/reconstruir/resgatar
também passaram via executarAcaoMundo aceitar/ajudar, custo e consequência real.
Asserções de encerrarMissao são contrato de recompensa, não prova de conclusão
jogada da escolta/investigação. Esses fluxos têm cobertura parcial nas suítes
anteriores, não declarar todas as variações testadas.

Inspeção: não encontrado caminho explícito de ingresso/patentes até Hashira ou
transformação do protagonista em oni. Há NPCs/técnicas/combate/despertares; não
equivalem a carreira completa nem comprovam superar Yoriichi. Próxima prioridade:
diretor contextual de presença oni e jornadas opcionais, depois testes naturais
de aquisição Nichirin e caça. Nenhuma regra alterada nesta sessão. Sem LLM pago,
E2E de navegador, commit ou push. Limites registrados em TESTES.md.

## Sessão 12 — presença contextual oni e entrega ao Claude — plano

Implementar controlador apenas dos encontros aleatórios de viagem: presença
discreta em paz, maior em ameaça local real ou investigação aceita, intervalo
de respiro após encontro casual. Não bloquear confrontos deliberados/Nemesis,
nem apagar ameaças e consequências existentes. Sem ingresso obrigatório ou
escalonamento por nível. Medir cenários com sementes e repetir test:all.
Commit incluirá também os testes/contexto narrativo das sessões 8–11 ainda
locais. Carreiras completas e ajuste de combate seguem pendentes explicitamente.

### Implementação da sessão 12

`viagem.ts`: rolarEncontroContextual usa o filtro solar/canônicos mortos e
autoriza o pool oni com probabilidade .08 em paz, .45 com ameaça ativa no local,
.65 com investigação aceita ali. Essas são chances de disponibilizar o pool,
NÃO chances finais de encontro. Sem pool oni não consome sorteio extra; monstros
comuns continuam elegíveis. Em paz há três dias de intervalo após oni casual,
guardado em flag persistente. Crise/caçada sobrepõem esse intervalo.
Emboscada Nemesis e confronto deliberado não passam por este redutor. O sistema
não remove ameaças existentes, não impõe carreira e não muda poder por nível.

Medição controlada: oito sementes × mil sorteios por modo, estrada/noturno,
perigo 5, um sorteio por dia: paz 167/8.000 (2,1%), crise 910 (11,4%), investigação
1.321 (16,5%). Fixtures mantêm crise/quest artificialmente; não são viagens reais.
Teste verifica aumento, filtro solar, intervalo e persistência. Mudança de RNG
na viagem altera as histórias das sementes antigas; determinismo é preservado
para a mesma versão, não identidade dos resultados entre versões.

Próximo Claude: carreira de caçador/Hashira e transformação oni NÃO foram
implementadas. Tampouco patamar acima de Yoriichi, correção das três faixas de
combate ou validação de prosa externa/UI. Controle atual é por local exato e
contexto simples, não uma simulação regional de densidade oni. Sessões 8–12
incluídas no commit solicitado; não interpretar cobertura como 100% do jogo.

Validação sessão 12: typecheck, nove suítes (incluindo jornadas), sim curto e
12 campanhas sem violações. Exploratórias: duas completaram dez anos, quatro
atingiram limite de ações aos 7–8 anos. Objetivos: seis completaram dez anos.
Rivais criados médios: 15,5 exploratória e 17,5 objetivos (antes 46,8 e 62,5).
Não atribuir toda diferença a frequência: o RNG e as histórias também mudaram.
Achado de qualidade: objetivos nível 26+ vence 99,5% dos encontros; menor presença
oni expõe falta de desafio comum NAS ROTAS usadas. Priorizar distribuição de
adversários não-oni fortes em locais perigosos, sem nivelamento automático.
Balanço sintético permanece 17/20. Não declarar equilíbrio concluído.
`npm run test:all` terminou com exit 0; exportação PC/web passou (947 KB).

---

## Sessão 13 — Claude — continente e perigo dinâmico — plano antes das alterações

### Estado encontrado

Commit `3d29172` (Astra). Auditoria independente feita antes de tocar em nada:
typecheck limpo, nove suítes passando, `simLongo 10 6` sem violações, balanço
sintético 17/20, `test:all` exit 0. Todas as afirmações do HANDOFF do Astra
conferem. Ele resolveu duas pendências que eu havia deixado (identidade rara
com `engine/identidade.ts`, progressão de NPC com `engine/progressaoNpc.ts`) e
corrigiu um bug meu: `recalcularRecursosMaximos` ressuscitava personagem morto,
porque o `Math.max(1, ...)` dava 1 de vida a quem estava em 0.

Medição comparativa que eu fiz e que motiva esta sessão — mesma build, mesmo
personagem, dois agentes diferentes dirigindo o simulador:

| Nível | Explorador (anda ao acaso) | Objetivos (planejador do Astra) |
|---|---|---|
| 1-5 | 35,8% | 76,6% |
| 6-10 | 34,2% | 94,4% |
| 26+ | 70,8% | 99,5% |

O Astra atribuiu o 99,5% a "falta de desafio comum nas rotas". A comparação
mostra causa maior: o planejador desvia do perigo. Em `planejadorSim.ts` ele
ordena rotas por `a.total - b.total || a.perigo - b.perigo`, pula missão de oni
sem Nichirin e espera sete dias após uma derrota. É um jogador competente — e
contra ele, povoar a rota perigosa não muda nada, porque ele não passa por lá.

### O defeito de fundo

`engine/viagem.ts` calcula o encontro assim:

```
chance = min(0.5, 0.05 + perigoRota * 0.04 + (noturno ? 0.12 : 0))
```

`perigoRota` é `rota.perigo`: **constante escrita à mão no conteúdo**, igual no
dia 1 e no dia 3000, com o vale em paz ou em guerra. Enquanto isso a engine já
mantém `cidade.inseguranca` (0-100), que sobe +1/dia com ameaça ativa, +2/dia
com guerra, +8 quando uma missão vence, +10 numa revolta, e desce com muralha.
Nove módulos leem essa insegurança; **a viagem não é um deles**. O mapa de risco
está congelado sobre um mundo que muda.

### Tamanho do mundo hoje

19 locais, e só 5 são assentamentos vivos (`praca`, `mercado`, `moinho`,
`vila_ferreiros`, `acampamento` — o filtro está em `continuidade.ts`). Os outros
14 são cenário: têm rota e encontro, mas não têm economia, população nem
insegurança. Três regiões: Vale de Halvet (11), Fora do Vale (6), Fora do Mundo (2).

### Objetivo desta sessão

Decisão do dono do projeto: ampliar o mundo para um continente e ligar o perigo
ao estado real dos lugares.

1. **Continente.** Novas regiões com cidades, vilas, aldeias e lugares pequenos,
   cada um com história própria — não só descrição de cena.
2. **Mais assentamentos vivos.** Ampliar o filtro de `continuidade.ts` para que
   cidade e vila tenham economia, população e insegurança de verdade.
3. **Perigo dinâmico.** Perigo efetivo da rota = base do conteúdo + insegurança
   das duas pontas + ameaça ativa + presença de rival acampado por perto.
4. **Segurança que responde.** Muralha e caçador com objetivo `cacar` no local
   reduzem o perigo efetivo, fechando o laço que hoje só existe pela metade.

### Restrições que vou respeitar

- Não reverter nada do Astra. As oito sessões dele continuam válidas.
- Não mexer no CHIM.
- Todo tipo de local novo precisa de entrada em `encontrosPorTipo` — o
  `selftest.ts` já exige isso e vai falhar se eu esquecer.
- Saves antigos: `migracao.ts` tem de continuar carregando campanha que não
  conhece os locais novos.
- Rodar `test:all` antes de declarar qualquer coisa.


### Implementação da sessão 13

#### Continente de Halvern (`content/vaelhorn/continente.ts`)

O Vale de Halvet virou uma província. **De 19 para 50 lugares**, de 3 para 10
regiões, de 5 para **22 assentamentos vivos**. Trinta e um lugares carregam
`historia`: o que aconteceu ali antes de o jogador chegar.

| Região | Lugares | O que a sustenta |
|---|---|---|
| Marca de Tessel | Tessel, Forte Agulha, Pedravel, Campos da Ceifa, Passo do Lobo, Capela dos Ceifeiros | fronteira militar, leva, trigo |
| Planalto de Corveira | Corveira, Poço Fundo, Ferro Velho, Terraço Sexto, Colina dos Forcados, Mosteiro do Alto | minério e sete casas que se comportam como reinos |
| Costa de Mareu | Mareu, Porto do Sal, Mercado do Peixe, Rede Rota, Farol Quebrado | porto, sal, guilda |
| Bosque de Vintra | Vintra, Carvoeira, Lenha Alta, Clareira das Pedras, Lodaçal | madeira e carvão; gente que dorme com a escada recolhida |
| Ermo de Solgar | Solgar, Poço Seco, Parada de Idrin, Ruína de Areia | uma cisterna, e a rota que só fecha por causa dela |
| Baixios de Halvern | Vau de Pedra, Juncal, Juncal de Baixo | a travessia do sul quando a ponte fecha |
| Estradas | Estrada Real, Trilha Costeira | costuram tudo |

Tipos novos de local (`cidade`, `vila`, `aldeia`, `porto`, `forte`, `campo`,
`colina`, `passo`, `pantano`) receberam tabela de encontros em `bestiary.ts` —
o `selftest` exige isso e falharia sem.

`Local.historia` é campo novo e vai para o pacote do narrador como
`historiaDesteLugar`. O narrador passa a poder citar o passado do lugar em vez
de inventar um; o que não estiver ali, ele não sabe.

#### Perigo dinâmico de rota (`engine/viagem.ts`, `perigoEfetivoDaRota`)

O sorteio de encontro usava `rota.perigo`, constante escrita à mão. Agora esse
número é o piso, e o estado real das duas pontas move o resto:

- insegurança da cidade → até +3 por ponta;
- ameaça ativa e não resolvida → +2 por ponta;
- caçador com objetivo `cacar` presente → −1,5 por ponta;
- rival acampado numa das pontas → +1, mais 0,4 por servo.

Uma estrada entre duas vilas em paz continua tranquila; a mesma estrada com a
vila do outro lado tomada fica perigosa sozinha, sem ninguém reescrever conteúdo.

### Três bugs encontrados e corrigidos

1. **Rotas de mão única no mapa original.** `casa_senhorial → cemiterio` existia
   sem a volta, entre outras. `proximoPasso` — a busca que a autonomia dos NPCs
   e o planejador usam — enxerga o grafo como dirigido, então um NPC podia
   entrar num lugar e não ter caminho de saída. `integrarContinente` agora
   simetriza o mapa inteiro, e há teste para isso.

2. **Deadlock de epidemia.** A enfermaria produzia `0,2` de remédio por dia e
   consumia até `1,0`. O estoque zerava, o tratamento virava zero e a doença
   ficava em 100 **para sempre**. Doença acima de 60 mata um morador por semana;
   em dez anos isso esvazia a comunidade. E cidade com população zero não
   constrói (a obra exige população), então não havia volta. Medido num mundo
   sem jogador: Tessel e Forte Agulha terminaram os dez anos com população 0 e
   doença 100. Corrigido com remissão natural de 0,35/dia — uma epidemia cede
   sozinha, as pessoas se curam ou morrem — mais reocupação lenta de
   assentamento vazio que ainda tenha estrutura de pé.

3. **`devastou` era estado terminal.** Uma ameaça que devastou o lugar ficava
   pendurada nele para sempre se o rival nunca fosse morto. E ameaça pendurada
   trava reconstrução (`continuidade.ts`) e obra da cidade (`cidades.ts`) — a
   comunidade atingida nunca mais levantava. Passados 30 dias do estrago, o
   predador segue adiante: continua vivo no Nemesis, só deixa de prender aquele
   lugar.

Depois dos três, o mesmo mundo sem jogador termina dez anos com todas as
comunidades povoadas, integridade 90-100 e sem doença. O pico de fome caiu de
1161 dias-cidade para 194 na pior semente, com a maioria em zero.

### Arquivos

**Criados:** `content/vaelhorn/continente.ts`, `engine/continente.selftest.ts`.

**Modificados:** `engine/types.ts` (`Local.historia`), `engine/viagem.ts`
(`perigoEfetivoDaRota`), `engine/continuidade.ts` (assentamentos novos, fim do
estado terminal), `engine/cidades.ts` (remissão natural, reocupação),
`engine/llm.ts` (`historiaDesteLugar`), `content/vaelhorn/bestiary.ts` (nove
tabelas de encontro), `content/vaelhorn/index.ts`, `package.json`.

### Testes executados

- `npx tsc --noEmit` — limpo.
- `npm run test:engine` — dez suítes, exit 0. Inclui a nova
  `continente.selftest.ts` com 21 asserções.
- `npm run test:jornadas` — todas as missões.
- `simLongo 10 6` — zero violações, 36,1 s.
- `simLongo 10 6 comum objetivos` — zero violações.
- `simBalanco 300` — 17 de 20 faixas no alvo (inalterado; não mexi na
  matemática do combate).
- `npx expo export --platform web` — build concluído.

### Achado que eu não esperava, e que precisa ficar registrado

**O continente deixou o mundo mais fácil, não mais difícil.** Taxa de vitória do
agente explorador, antes e depois desta sessão:

| Nível | Antes | Depois |
|---|---|---|
| 1-5 | 35,8% | 60,0% |
| 11-15 | 46,4% | 95,8% |
| 26+ | 70,8% | 99,4% |

Duas causas, ambas minhas:

1. Os lugares novos são majoritariamente civilizados. Cidade, vila e aldeia têm
   tabela de encontro fraca de propósito — cidade grande tem guarda, o que
   ataca ali é humano e oportunista. Só que agora eles **dominam o mapa**: são
   22 dos 50 lugares. O andarilho passa muito mais tempo em lugar seguro do que
   passava quando o mundo era floresta, estrada e ruína.
2. As correções de cidade deixaram o mundo mais saudável — menos epidemia,
   menos comunidade destruída — e insegurança baixa significa perigo dinâmico
   baixo. O sistema novo funciona; ele só está lendo um mundo que agora vai bem.

O perigo dinâmico está certo e testado. Ele não compensou a diluição porque não
foi feito para isso: ele reage à crise, e o mundo saiu desta sessão com menos
crise. No modo por objetivos nada mudou — continua 99,9% no nível 26+, pela
razão de sempre: o planejador desvia do risco e o bestiário não tem adversário
não-oni do tamanho de um personagem maduro.

### Pendências

1. **Densidade de perigo por região.** O mapa precisa de proporção: hoje o
   caminho seguro é o padrão e o perigoso é exceção. Sugestão a decidir —
   Passo do Lobo, Lodaçal, Clareira das Pedras e Ruína de Areia deveriam ser
   travessia obrigatória para algo que valha a pena, não desvio opcional.
2. **Bestiário sem topo continua aberto** (sessão 3). Com 50 lugares, a lacuna
   ficou mais visível: há região inteira sem um adversário à altura.
3. **Aldeias novas não têm NPC próprio.** Elas têm economia, insegurança e
   história, mas ninguém mora nelas por nome — o elenco continua concentrado no
   Vale. `autonomia.ts` cria residentes procedurais, mas nenhum NPC autoral.
4. **Ganchos e pontos não viram missão.** Cada lugar novo tem dois ganchos
   escritos; nada no gerador de missões os lê ainda.
5. As pendências das sessões anteriores seguem abertas: Nemesis que só acumula,
   prazo fixo de missão, faixas baixas do combate comprimidas, e a identidade
   rara que o Astra começou a ligar em `identidade.ts`.
