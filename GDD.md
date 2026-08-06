# ARCANUM — Game Design Document
### Documento mestre · versão 1.0

RPG narrativo por navegação estruturada, com estado canônico em banco de dados e narração gerada por modelo de linguagem sob contrato estrito.

> Este arquivo é o documento de design que orienta o repositório. A implementação
> atual é uma **fatia vertical** dele (cenário Vaelhorn, offline). Veja o
> [README](README.md) para o que está pronto e o que é roadmap.

---

## PARTE 0 · VISÃO

**O que é.** Um RPG de texto onde a engine é dona da verdade e o modelo é dono da voz. O jogador navega por um mundo persistente através de menus e mapa; o modelo escreve o que acontece. Nove cenários rodam sobre a mesma engine.

**Os quatro pilares:** consequência composta · nada é bloqueado, tudo é caro · agência é do jogador · o jogo narra, não descreve.

**Non-goals:** multiplayer em tempo real · arte 3D · combate tático em grade · simulação econômica global · mais de dois cenários no MVP.

---

## PARTE I · SISTEMAS CENTRAIS

**Tempo** — o turno é o período do dia (madrugada → manhã → tarde → entardecer → anoitecer → noite). Custo de ação em períodos, exibido como horário de chegada, nunca como número. Calendário datado por evento + estação.

**Resolução sem dados** — `p = 1 / (1 + e^(−(C − D)/k))`, com `C = atributo + 2×perícia + equipamento + circunstância − penalidade`. Cinco graus: crítico, sucesso, sucesso com custo, falha, falha grave. Dano por `base × (1 + (r−0.5)·2·dispersão)`. Nenhuma notação de dado — trava de build. RNG determinístico (semente + cursor).

**Personagem** — seis posições de atributo (nome pelo cenário), vida + 2 recursos + 2 medidores de pressão. Os medidores de pressão definem o gênero.

**Agência — as três portas** — a cena (opções do modelo), as ações (catálogo fixo da engine), a ação livre (texto classificado em verbo). Verbo é dado, não texto. Verbo indisponível nunca some: fica apagado, com o motivo.

**Impulsos** — fome, sono, tesão, abstinência, tédio, solidão, ganância. Crescem, penalizam e destacam o verbo que os sacia.

---

## PARTE II · MUNDO

Cenários (9) sobre a mesma engine, cada um tocando só na "coluna direita" (nomes, geografia, facções, criaturas, catálogo, quais verbos existem). Tabu central por cenário. Geografia `Reino → Região → Local → Ponto`, mapa fixo e autoral. Privacidade × testemunhas governam o íntimo e o ilegal. Oportunidades marcadas pela engine. NPCs com rotina, memória, segredos e eixos de relação (afeto ≠ confiança). Facções com reputação de soma não-zero e boato que deforma no caminho. Cronograma de mundo independente do jogador.

---

## PARTE III · PROGRESSÃO

**O Livro** (grimório): Mestres · Trabalhos · Artes · Relíquias. Preencher o Livro é o jogo. Cada mestre muda uma regra enquanto você é aluno. Raridade de artes: comum, notável, rara, única, mítica, proibida, perdida. **Únicas têm dono** — você não acha, tira de alguém, e o item é usado contra você antes de ser seu. Itens podem gerar verbos.

Progressão por XP (combate vencido, ameaça evitada sem combate, objetivo, descoberta, marco). Cicatrizes permanentes, morte com modo Legado.

---

## PARTE IV · COMBATE

Resolvido 100% pela engine, sem chamar o modelo. Condições persistentes, moral inimiga. Chefes como máquina de estados por fases, cobrando em estado persistente. Quatro desfechos, incluindo perder algo seu.

---

## PARTE V · A CAMADA DE IA

Pacote de contexto de tamanho constante → resposta obrigatória em JSON (narração + canonNovo + opções). Validador com 10 travas (schema, whitelist de entidades, notação de dado, economia, faixas, alvo, flag, dificuldade, portas de consentimento, tabu). Fallback canônico (P0) quando falta rede ou a resposta é inválida. Canon acumulado, compactação da crônica, anti-repetição, streaming. Registro de conteúdo adulto: todos os personagens são adultos; sistemas com consequência; a cena corta.

---

## PARTE VI–VII · SESSÃO, MONETIZAÇÃO, INTERFACE

Capítulo = 12–18 períodos, fecha com cartela. Três planos (Livre / Premium / Ultra). Paywall diegético que nunca corta no meio de cena; combate nunca consome cota. Identidade visual única (paleta de manuscrito; serifa para a voz, mono para os dados).

---

## PARTE VIII · ARQUITETURA (alvo do produto completo)

Next.js + TypeScript · engine em pacote TS puro · Supabase (Postgres + RLS) · conteúdo em JSON validado por Zod · rota de servidor para a IA (chave só no servidor) · SSE para streaming · Stripe + Mercado Pago (Pix) · Vercel. **A engine roda no servidor.**

---

## PARTE IX · ESCOPO DO MVP

Um cenário completo (Vaelhorn): 3 classes, 3 origens, 1 região com 6 locais e 12 NPCs, 35 verbos universais + 6 de Vaelhorn, privacidade/testemunhas/oportunidades, 5 impulsos, o Livro (4 mestres, 6 trabalhos, 20 artes, 8 relíquias com 2 Únicas e 1 Perdida), contrato + validador + fallback + canon, capítulos, paywall, três planos, auth, campanhas, combate simples.

**Os dois testes que dizem se deu certo:** o teste de agência (jogar 10 períodos só pelo menu) e o teste de arquitetura (construir Pele em menos de três semanas depois de Vaelhorn).

**O que construir primeiro:** `engine/` + os verbos + o simulador headless.
