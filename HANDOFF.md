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
