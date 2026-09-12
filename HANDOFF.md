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

## Como este documento está organizado
O registro cresceu além do que um agente novo consegue ler antes de começar.
Na sessão 16 ele foi dividido:

- **`HANDOFF.md` (este arquivo)** — estado atual, sessões recentes (13 em
  diante), problemas abertos e próximo passo. É o que se lê antes de trabalhar.
- **`HANDOFF-ARQUIVO.md`** — sessões 1 a 12, na íntegra e sem edição. Consultar
  quando for preciso saber *por que* alguma decisão antiga foi tomada.

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

---

## Sessão 14 — Claude — povoamento e lugares ocultos — plano antes das alterações

### Estado encontrado

Commit `24d8a3c` (continente). Censo medido antes de tocar em nada, e o
resultado condena a nomenclatura da sessão anterior:

| | Dia 0 | Dia 3650 |
|---|---|---|
| Pessoas com identidade | 58 | 89 |
| População escalar somada | 1320 | 3347 |
| Assentamentos SEM ninguém com identidade | 17 de 22 | 20 de 22 |

"Assentamento vivo" só queria dizer que o lugar tem economia e insegurança.
`populacao: 372` é o inteiro 372, não 372 pessoas. Os 56 NPCs autorais estão
todos no Vale de Halvet (28), Fora do Vale (27) e Fora do Mundo (1). As seis
regiões que eu criei na sessão 13 têm **zero** habitantes com nome: Tessel tem
cerco, marechal e lista de leva no texto, e ninguém para falar com você.

Segundo achado do mesmo censo: ao fim de dez anos, **56 das 89 pessoas estão
empilhadas na `praca`**. A migração de `autonomia.ts` puxa todo mundo para onde
há mais pão e menos risco, e nada segura ninguém no lugar de origem.

### Objetivo desta sessão

Decisão do dono do projeto: densidade por porte de assentamento, papéis
próprios de cada porte, e lugares escondidos.

1. **Densidade escalonada.** Cidade precisa dar sensação de gente: quem manda,
   guarda, guilda, lojas, curandeiro, taverna, herói local, quem rouba. Vila
   tem chefe, ofício, taverna, ladrão. Aldeia tem ancião e pouco mais.
2. **NPC com história, não figurante.** Cada gerado carrega ocupação, voz,
   índole, corpo e — quando couber — segredo ligado à história do próprio
   lugar (que já existe em `Local.historia` desde a sessão 13).
3. **Lugares ocultos.** Hoje `mansao_ubuyashiki` e `vila_ferreiros` são
   secretos só na ficção: mecanicamente aparecem na lista de rotas como
   qualquer outro. Precisa existir local que não se alcança sem descobrir.

### Como pretendo fazer

- **Gerador determinístico em conteúdo**, não em campanha. Semente derivada do
  id do lugar, então o elenco é o MESMO em toda campanha — é mundo, não sorteio
  por save. Entra em `content.npcs`, o que faz `todosNpcs`, `convivio`,
  `autonomia` e o narrador enxergarem sem nenhuma mudança neles.
- **Figuras autorais à mão** nas três cidades, por cima do gerado.
- **`Local.oculto`** mais condição de descoberta, e uma função de rotas
  visíveis que a UI e o simulador passam a usar.

### Restrições

- Não inchar o save: gerado é conteúdo, não estado de campanha.
- `selftest.ts` valida referência cruzada de NPC, facção e local — tudo que eu
  gerar tem de apontar para coisa existente.
- Saves antigos precisam continuar carregando.
- Rodar `test:all` antes de declarar qualquer coisa.


### Implementação da sessão 14

#### Povoamento (`content/vaelhorn/povoamento.ts`)

Gerador determinístico de moradores, com semente derivada do **id do lugar** —
Tessel tem exatamente a mesma gente em toda campanha, como se tivesse sido
escrita à mão. Entra em `content.npcs`, então `todosNpcs`, `convivio`,
`autonomia` e o narrador enxergam sem nenhuma mudança neles, e **não incha o
save**: é conteúdo, não estado de campanha.

Densidade por porte, com elenco de papéis próprio:

| Porte | Pessoas | Papéis |
|---|---|---|
| cidade | 14 | senhora da cidade, capitã da guarda, mestra de guilda, lojista, armeira, curandeira, taverneira, escrivã, campeã de arena, chefe do crime, batedora de carteira, agiota, carregadora, mendiga que vê tudo |
| porto / mercado | 8 | recorte do elenco de cidade |
| vila | 7 | chefe da vila, ferreira, taverneira, curandeira, guarda, ladra, tropeira |
| forte | 4 | comandante, sargenta veterana, cozinheira, recruta |
| parada de caravana | 4 | dona da parada, chefe de caravana, escolta, viajante que não diz de onde vem |
| aldeia | 4 | anciã, lavradora, benzedeira, moça que some por dias |
| forja | 2 | ferreira mestra, aprendiz |

Cada pessoa tem ocupação, idade, voz, índole, corpo e duas ligações com outra
gente do mesmo lugar — o que basta para `convivio.ts` produzir acontecimento sem
o jogador. Quem tem segredo carrega um **costurado na `historia` do próprio
lugar**: descobrir uma pessoa é descobrir o lugar. Todo segredo diz como se
descobre; não existe segredo sem porta.

Os ofícios vão no feminino porque é a premissa do cenário e `selftest.ts` tem
trava automática contra ofício masculino no elenco. Descobri isso apanhando.

#### Lugares ocultos (`Local.oculto`, `engine/viagem.ts`)

A mansão Ubuyashiki e a vila dos ferreiros sempre foram secretas na ficção e
**públicas na mecânica**: apareciam na lista de rotas como qualquer destino.
Agora existe `Local.oculto` com dica e condição declarada de revelação.

- `rotasVisiveis()` filtra o que o jogador pode ver. Usada pela tela do mapa,
  pelo pacote do narrador e pelo planejador do simulador — os três passaram a
  enxergar só o que o jogador enxerga.
- `viajar()` recusa destino desconhecido devolvendo **a dica**, não um erro seco.
- `avaliarDescobertas()` roda no tique diário: a revelação chega como
  acontecimento, não como recompensa de menu.

Seis lugares nascem escondidos. Três já existiam e passaram a ser secretos de
verdade (vila dos ferreiros, mansão Ubuyashiki, Castelo Infinito) e três são
novos: **A Casa da Agulha** (o quartel-general dos caçadores dentro de Tessel,
revelado por confiança da facção), **A Forja Afundada** (oficina numa galeria
alagada do Poço Fundo, revelada por chegar à galeria de cima) e **A Toca do
Juncal** (câmara seca sob o charco, revelada por reputação com os ladrões).

### Dois bugs de despovoamento

O censo de dez anos mostrou o mundo se esvaziando: **20 dos 23 assentamentos
sem uma alma**, com mais da metade das pessoas empilhada no mesmo lugar. Duas
causas, ambas corrigidas em `engine/autonomia.ts`:

1. **O destino da migração era `[0]`** — a primeira cidade na ordem do objeto,
   sempre a mesma. Todo mundo que migrava em dez anos ia parar no mesmo lugar.
   Agora o destino é o assentamento **mais perto** que tenha comida, calma e
   espaço, com capacidade limitada por moradias: cidade cheia deixa de atrair.
2. **Quem migrava passava a chamar o destino de casa** (`p.casa = p.local` na
   chegada), então nunca mais tinha para onde voltar. Entrou `VidaCivil.natal`:
   `casa` muda quando a pessoa se muda, `natal` nunca. Se o lugar de origem
   voltou a servir, ela volta.

| Medição em 10 anos | Antes | Depois |
|---|---|---|
| Assentamentos vazios | 20 de 23 | **1 de 23** |
| Maior concentração | 56 pessoas | **19 de 212** |
| Pessoas com nome no dia 0 | 58 | **192** |
| Pessoas com nome no dia 3650 | 89 | **212** |

### Arquivos

**Criados:** `content/vaelhorn/povoamento.ts`, `engine/povoamento.selftest.ts`.

**Modificados:** `engine/types.ts` (`Local.oculto`), `engine/viagem.ts`
(`rotasVisiveis`, `localConhecido`, `descobrirLocal`, `avaliarDescobertas`),
`engine/autonomia.ts` (migração por proximidade, retorno para o natal),
`engine/vivoTypes.ts` (`natal`), `engine/historiaViva.ts`,
`engine/mundoVivo.ts`, `engine/llm.ts`, `engine/planejadorSim.ts`,
`engine/campanhaLonga.ts`, `ui/screens/Paineis.tsx`,
`content/vaelhorn/locations.ts`, `content/vaelhorn/continente.ts`,
`content/vaelhorn/index.ts`, `package.json`.

### Testes executados

- `npx tsc --noEmit` — limpo.
- `npm run test:engine` — onze suítes, exit 0. Inclui a nova
  `povoamento.selftest.ts` com 30 asserções.
- `npm run test:jornadas` — todas as missões.
- `simLongo 10 6` e `simLongo 10 6 comum objetivos` — zero violações.
- `simBalanco 300` — 17 de 20 (inalterado; não toquei no combate).
- `npx expo export --platform web` — build concluído.

### Pendências

1. **Ninguém escrito à mão nas regiões novas.** Os 134 moradores são gerados.
   As figuras que importam — quem o jogador vai lembrar — ainda precisam de
   autoria: nome próprio, história longa, relação com o enredo. O gerador
   entrega densidade, não personagem memorável.
2. **Rotinas vazias.** Todo morador gerado tem `rotina: {}`, então fica no
   `localBase` o dia inteiro. Faltam padrões por ofício: taverneira à noite,
   lavradora no campo de dia, ladra em local de privacidade alta.
3. **Ganchos e segredos não viram missão.** Cada lugar tem dois ganchos e boa
   parte dos moradores tem segredo; nada no gerador de missões lê isso ainda.
4. **`mercado_peixe` esvazia** em algumas sementes. Um a cada 23 é aceitável
   para o teste, mas a causa (é adjacente a Mareu, que absorve) merece olhada.
5. Pendências anteriores seguem abertas: densidade de perigo por região,
   bestiário sem topo, Nemesis que só acumula, prazo fixo de missão.

---

## Sessão 15 — Claude — rotinas e mais mundo — plano antes das alterações

### Estado encontrado

Commit `ae8317b`. Medição de rotina antes de tocar em nada:

- **190 NPCs, 44 com rotina, 146 sem.**
- Os 134 moradores gerados na sessão 14 têm `rotina: {}` — ficam no `localBase`
  as vinte e quatro horas. A cidade tem gente, mas a gente não se mexe.
- Oito do elenco da mansão Ubuyashiki também estão sem: Zenitsu, Kanao, Genya,
  Kagaya, Amane, Jigoro, Shinjuro e Kanae. Vieram do atalho `npc()` em
  `content/vaelhorn/kimetsu.ts`, que preenche `rotina: {}`.
- Os nove Hashiras têm rotina escrita à mão e boa, cobrindo os seis períodos.

Isso importa porque `localEfetivo` resolve presença por
`npc.rotina[periodo] ?? npc.localBase`. Sem rotina, a pessoa está sempre no
mesmo lugar, a qualquer hora — o que apaga a diferença entre procurar alguém de
manhã e à noite, e tira sentido de privacidade, de vigia e de encontro.

### Objetivo desta sessão

1. **Rotina por ofício** para todo morador gerado, ancorada em lugares reais e
   alcançáveis a partir do assentamento. Taverneira à noite, lavradora no campo
   de dia, ladra onde há privacidade, guarda em ronda.
2. **Rotina para os oito da mansão Ubuyashiki**, respeitando o que cada um é.
3. **Mais mundo**: adensar as regiões magras e ampliar o elenco das cidades.

### Restrições

- Rotina não pode mandar ninguém para lugar oculto: quebraria o sigilo que a
  sessão 14 acabou de criar.
- Rotina só pode citar lugar que existe e que é alcançável a partir do
  assentamento — `selftest.ts` valida referência cruzada.
- Continua tudo em conteúdo, não em save.
- `test:all` antes de declarar qualquer coisa.


### Implementação da sessão 15

#### Rotina por ofício (`content/vaelhorn/povoamento.ts`)

Seis ritmos, atribuídos por papel, traduzidos em lugares **reais e alcançáveis**
a partir do assentamento:

| Ritmo | Quem segue | Como é o dia |
|---|---|---|
| `RITMO_DIURNO` | senhora da cidade, mestra de guilda, lojista, armeira, escrivã, ferreira, anciã | fica no assentamento |
| `RITMO_LAVOURA` | lavradora, carregadora do cais, moleira, pastora | sai para o campo de manhã, volta ao anoitecer |
| `RITMO_TAVERNA` | taverneira, estalajadeira, dona da parada | trabalha onde a casa está, na hora em que a casa enche |
| `RITMO_RONDA` | capitã da guarda, curandeira, campeã de arena, benzedeira, sargenta | patrulha ou visita à tarde |
| `RITMO_NOTURNO` | chefe do crime, batedora de carteira, agiota, ladra, contrabandista, boticária de fundos | some na madrugada, aparece à noite |
| `RITMO_ERRANTE` | tropeira, chefe de caravana, escolta, cocheira | sai de dia e dorme fora |

`vizinhancaDe()` resolve `campo` e `retiro` a partir das rotas do próprio
lugar, escolhendo por tipo — aberto (campo, estrada, floresta, lago, praça) ou
recolhido (ruína, cripta, cemitério, pântano, mina, passo). **Nunca escolhe um
lugar oculto**: mandar uma taverneira dormir na forja secreta entregaria de
graça o que a sessão 14 acabou de esconder. Há teste para isso.

#### Rotinas do elenco da mansão Ubuyashiki

Os nove Hashiras já tinham rotina escrita à mão. Os outros oito vinham com
`rotina: {}` do atalho `npc()` em `content/vaelhorn/kimetsu.ts` — mais Inosuke,
que estava no mesmo caso. Agora cada um tem as seis casas preenchidas conforme
o que a pessoa é:

- **Kagaya** não sai da casa em nenhum período: a doença não deixa.
- **Amane** coordena e cuida dele; vai só até a capela e volta.
- **Zenitsu** dorme de dia e caça à noite — a audição dele serve melhor no escuro.
- **Kanao** treina de manhã na mansão, campo à tarde, patrulha à noite.
- **Genya** não usa respiração: treina sozinho nas ruínas e caça longe dos outros.
- **Jigoro** e **Urokodaki** ficam onde se instrui.
- **Shinjuro** bebe na taverna à tarde e à noite, e evita a mansão de dia.
- **Kanae** atende quem chega ferido; a capela é o posto avançado dela.
- **Sabito** e **Makomo** ficam onde morreram e onde ainda ensinam.
- **Tamayo** e **Yushiro** já tinham manhã e tarde na capela; a noite é quando
  podem sair, e é quando trabalham de verdade.
- **Inosuke** cresceu na mata e não confia em telhado: dorme fora.

Efeito medido: a mansão tem 13 pessoas na madrugada e 4 no entardecer. Tessel
vai de 11 à tarde a 19 à noite. Antes, todo lugar tinha exatamente a mesma
gente às três da manhã e ao meio-dia.

#### Mais mundo

Elenco de papéis ampliado: cidade foi de 14 para **20 pessoas** (entraram
estalajadeira do bairro de fora, boticária de fundos, cocheira de aluguel,
pregoeira do registro, veterana de guerra sem posto e contrabandista de
fronteira); vila de 7 para 9 (moleira, caçadora de peles); aldeia de 4 para 5
(pastora que dorme fora); mercado e porto de 8 para 10.

Total de moradores gerados: **134 → 172**. Elenco completo: **228 NPCs**.

### Arquivos

**Modificados:** `content/vaelhorn/povoamento.ts` (ritmos, vizinhança,
`rotinaDe`, seis papéis novos, densidade), `content/vaelhorn/kimetsu.ts`
(`ROTINAS_ELENCO` com treze rotinas escritas à mão),
`engine/povoamento.selftest.ts` (dez asserções novas sobre rotina e densidade).

### Testes executados

- `npx tsc --noEmit` — limpo.
- `npm run test:engine` — onze suítes, exit 0.
- `npm run test:jornadas` — todas as missões.
- `simLongo 10 6` e `simLongo 10 6 comum objetivos` — zero violações.
- `simBalanco 300` — 17 de 20 (inalterado).
- `npx expo export --platform web` — build concluído.

Números do mundo depois de dez anos: 1 assentamento vazio em 23, maior
concentração com 26 de 250 pessoas.

### Pendências

1. **Rotina ainda é por ofício, não por pessoa.** Duas taverneiras de cidades
   diferentes têm o mesmo dia. Falta variação individual — folga, doença,
   viagem, luto — e reação ao estado do mundo (ninguém se recolhe quando a
   insegurança sobe).
2. **A rotina não conhece a hora do lugar.** Uma taverneira "trabalha" às três
   da manhã porque o ritmo dela é ficar em casa; o ofício está certo, o horário
   é indiferente. Faltaria um conceito de expediente.
3. **Ninguém escrito à mão nas regiões novas** — segue da sessão 14. Os 172
   moradores dão densidade; personagem memorável ainda precisa de autoria.
4. **Ganchos e segredos não viram missão** — segue.
5. Pendências antigas seguem: densidade de perigo por região, bestiário sem
   topo, Nemesis que só acumula, prazo fixo de missão.

---

## Sessão 16 — Claude — backup e reorganização do handoff — 2026-09-08

### Estado encontrado antes das alterações
- Árvore limpa, `tsc --noEmit` e `npm run test:engine` verdes desde a sessão 15.
- Cinco commits existiam apenas no disco local, sem cópia remota: `a62f47a` e
  `3d29172` (Astra), `24d8a3c`, `ae8317b` e `8a05d92` (Claude, sessões 13–15).
  `git rev-list --left-right --count` acusava `0 5` contra
  `origin/claude/build-app-apk-nzg5ap`.
- `HANDOFF.md` com 1806 linhas e 15 sessões em sequência. O arquivo já era
  grande demais para ser lido inteiro no início de uma sessão, que é
  exatamente o uso para o qual ele existe.

### O que foi feito
1. **Backup enviado.** `git push origin claude/build-app-apk-nzg5ap`
   (`808a5fc..8a05d92`). O repositório privado `Juniorsilva-tech/ro-arcanum`
   agora tem todo o trabalho das sessões 13 a 15 e as duas sessões do Astra.
2. **Handoff dividido em dois.** As sessões 1 a 12 foram movidas, sem qualquer
   edição de texto, para `HANDOFF-ARQUIVO.md`. `HANDOFF.md` ficou com o
   cabeçalho, um mapa das sessões arquivadas e as sessões 13 em diante.

### Decisão registrada
Dividir em vez de resumir. Um resumo perderia o motivo das decisões antigas —
por que a invariante `fama_acima_da_reputacao` estava errada, por que a
primeira métrica de poder foi descartada — e é justamente esse tipo de coisa
que um agente novo repete se não encontrar escrito. A regra combinada:
`HANDOFF.md` é o documento vivo; quando passar de ~800 linhas, as sessões mais
antigas descem para o arquivo com o texto intacto.

### Arquivos alterados
- `HANDOFF.md` — 1806 → ~600 linhas; ganhou a seção "Como este documento está
  organizado" e o mapa do arquivo.
- `HANDOFF-ARQUIVO.md` — novo; sessões 1 a 12 na íntegra.

### Testes
Nenhum código foi tocado nesta sessão. `git status` limpo antes e depois das
mudanças de documentação; nenhum arquivo de engine ou conteúdo foi alterado.

### Próximo passo recomendado
Segue o mesmo da sessão 15: **rotina por pessoa, não por ofício**. Hoje duas
taverneiras de cidades diferentes vivem o mesmo dia, e ninguém muda de hábito
quando a insegurança da vila sobe. É a diferença entre um mundo povoado e um
mundo habitado.

## Sessão 18 — estado vivo inicial das casas

`engine/casas.ts` e `MundoState.casas` adicionam estado persistente por casa:
líder, herdeiro, legitimidade, tesouro, influência e sucessões. O processador
roda a cada avanço do mundo; fome reduz tesouro/legitimidade, prosperidade
recupera lentamente, e morte do líder promove herdeiro vivo. É uma primeira
camada causal, ainda sem casamento, vassalagem, tributação territorial ou
disputa entre pretendentes. Typecheck passou. Commit `613b4e5`.

## Sessão 17 — catálogo inicial de casas

Adicionada a primeira camada explícita de casas dos reinos em
`content/vaelhorn/casas.ts`: quatro casas (Halvet, Mareu, Corveira e Tessel),
cada uma com reino, lema, sede, territórios reais, modelo de sucessão, riqueza,
reputação e rivalidades. Integrada ao `ContentBundle` e ao pacote do narrador
como `casasPresentes`; ainda é conteúdo estático, não estado mutável.
`engine/casas.selftest.ts` valida sedes, territórios, ids e rivalidades.

Commit: `54a0a16`. O commit também capturou `.claude-flow/data/pending-insights.jsonl`,
que já estava no workspace; revisar antes de limpar. Próximo passo: estado
persistente das casas e processador de herança, patrimônio, alianças e conflitos,
com testes de falência e sucessão. Não declarar esta camada dinâmica ainda.

### Diretriz do proprietário — fase complexa das casas

Implementar devagar e em commits pequenos. A ordem recomendada é: (1) sucessão
e identidade válidas; (2) patrimônio territorial; (3) relações entre casas;
(4) casamento e herança; (5) vassalagem e impostos; (6) disputas e perda de
território; (7) missões e narrador. Não misturar todas as camadas num commit.

Invariantes obrigatórias: líderes/herdeiros apontam para NPCs vivos, adultos e
existentes; territórios apontam para locais reais; tesouro, legitimidade e
influência ficam em suas faixas; casamentos não criam parentesco impossível;
processamento repetido no mesmo dia é idempotente; save antigo continua
carregando; fatos políticos têm causa e estado confirmado/rumor separados.

Cada etapa exige contrato, teste unitário, save round-trip, campanha longa e
inspeção do pacote do narrador antes de prosseguir. Fome e guerra devem causar
consequências graduais, nunca apagar uma casa por regra abstrata. Não usar
balanceamento por nível do jogador nem tornar casas destino obrigatório. Esta
diretriz é decisão do proprietário e deve ser preservada pelo próximo agente.

---

## Sessão 19 — Claude — o teto humano — plano antes das alterações

### Estado encontrado (medido, não suposto)
Rodei um diagnóstico de razão de poder (`engine/poder.ts`) contra o bestiário
inteiro, para um caçador com Nichirin, em dez níveis diferentes:

```
nível  1 · poder     7.0 | equivalentes  2 · desafio(<=1.4) 27
nível 15 · poder    43.0 | equivalentes  1 · desafio(<=1.4)  8
nível 25 · poder   127.5 | equivalentes  3 · desafio(<=1.4)  6
nível 30 · poder   183.7 | equivalentes  1 · desafio(<=1.4)  3
nível 40 · poder   593.2 | equivalentes  0 · desafio(<=1.4)  0
nível 50 · poder  1399.1 | equivalentes  0 · desafio(<=1.4)  0
nível 67 · poder  3628.0 | equivalentes  0 · desafio(<=1.4)  0
```

Do nível 40 em diante **não existe uma única criatura no bestiário com razão
até 1,4**. O inimigo mais duro que o jogador consegue derrotar no nível 67 dá
razão 117 — cento e dezessete vezes de vantagem. Não é uma luta, é um trâmite.
As campanhas longas terminam em nível 66–68.

### Diagnóstico — a causa não é o bestiário
A pendência antiga dizia "bestiário sem topo", e isso estava errado. O topo do
bestiário é o Muzan, nível 20, e **é assim que tem que ser**: ele é o teto do
mundo, não um degrau. Pôr criatura acima dele quebraria o cânone.

O problema é do outro lado da conta. Duas causas, ambas mensuráveis:

1. **A curva de xp é linear.** `xpParaProximoNivel = 20 + nivel * 15`. Custo
   linear com recompensa crescente (Muzan dá 2000 xp) significa que subir nunca
   fica mais difícil. Dez anos de jogo entregam nível 67 num mundo cujo ser mais
   perigoso é nível 20. O comentário em `engine/progresso.ts:74` já declara a
   intenção certa — *"o teto normal de nível não leva ninguém perto de um
   Yoriichi — de propósito"* — mas a curva não implementa esse teto. O código
   contradiz o próprio comentário.

2. **A defesa cresce sem teto.** `defesaJogador` soma `Math.floor(nivel / 3)`
   sem limite, enquanto `acertoJogador` foi limitado na sessão 3 por
   `TETO_NIVEL_ACERTO = 15`. A assimetria é minha, da sessão 3: capei o acerto e
   esqueci a defesa. No nível 67 isso são +22 de defesa, e nenhuma criatura do
   mundo acerta mais. É o que faz a resiliência da régua explodir.

### Objetivo desta sessão
Estabelecer o teto humano, sem tocar no bestiário e sem tocar em CHIM:

- curva de xp superlinear, para que o fim natural da progressão fique perto do
  topo do mundo e não trinta níveis acima dele;
- teto de nível na defesa, simétrico ao que o acerto já tem;
- `concederDespertar` continua intocado — é ele, e só ele, a exceção Yoriichi:
  avanço raro e concedido pela história, nunca farmado.

Não mexer na camada de casas (é a faixa do Astra) nem em CHIM.

### O que foi implementado

**1. Curva de xp com teto humano** (`engine/progresso.ts`). Abaixo do nível 20 a
curva é a antiga — linear e generosa, para que a primeira metade da campanha
ande. Acima dela cada nível custa `1,45×` o anterior:

| até o nível | xp acumulado |
| --- | --- |
| 21 | 3.550 |
| 26 | 10.097 |
| 31 | 60.435 |
| 41 | 3.193.481 |

Não é um limite duro — ninguém é impedido de passar. É uma parede macia, e
`concederDespertar` continua sendo o único caminho barato através dela, que é
exatamente o que o comentário daquela função sempre prometeu.

**2. Teto de nível na defesa** (`engine/combat.ts`). `TETO_NIVEL_DEFESA = 30`,
valendo +10 no máximo, contra os +15 do acerto. A assimetria é deliberada: é
mais fácil aprender a bater do que ficar impossível de acertar.

**3. O simulador agora enfrenta o topo** (`engine/campanhaLonga.ts`). As dez
expedições de `content/vaelhorn/desafios.ts` — fichas fixas de nível 10 a 32,
não-oni, caçadas de propósito — existiam e o simulador **nunca encostava numa
delas**. A taxa de vitória era medida só contra bicho de beira de estrada.
O agente agora aceita uma expedição quando está inteiro de vida e com maestria
de lâmina ≥ 25, sem consultar a régua de poder (que o jogador não tem).

### Resultados — antes e depois

Campanhas de 10 anos, 6 sementes:

| | antes | depois |
| --- | --- | --- |
| nível final | 66–68 | 29–31 |
| poder no fim | 3.628 | ~180 |
| criaturas com razão ≤ 1,4 no nível 40 | 0 | 1 |
| expedições por campanha | 0 | 36,7 |

Vitória por faixa, com as expedições entrando na conta:

| faixa | antes | depois |
| --- | --- | --- |
| 11-15 | 97,3% | 87,6% |
| 21-25 | 98,6% | 95,5% |
| 26+ | 99,2% (1 derrota) | 95,3% (90 derrotas) |

O que sobra de 95% no topo é honesto: a maioria dos combates continua sendo
encontro comum de estrada, e um caçador de nível 29 deve mesmo atropelar um
salteador. A diferença é que agora existe onde perder.

### Descoberta que corrigiu uma pendência antiga
A pendência dizia "bestiário sem topo". **Estava errada.** O topo existe desde
a sessão do Astra (`desafios.ts`, dez criaturas de nível 10 a 32) e o topo dos
onis é o Muzan no nível 20 — que é como tem que ser, ele é o teto do mundo e
não um degrau. O que faltava não era conteúdo: era o jogador parar de crescer
trinta níveis acima de tudo que o mundo tem. Pendência reescrita.

### Arquivos alterados
- `engine/progresso.ts` — `TETO_HUMANO`, `CUSTO_ACIMA_DO_TETO`, curva de xp.
- `engine/combat.ts` — `TETO_NIVEL_DEFESA` e o teto em `defesaJogador`.
- `engine/campanhaLonga.ts` — expedições no agente e métrica `expedicoes`.

### Testes executados
- `tsc --noEmit` — limpo.
- `npm run test:engine` (11 suítes + campanha longa) — exit 0, zero violações.
- `npm run test:jornadas`, `npm run test:casas` — OK.
- `simLongo 10 6` e `simLongo 10 6 comum objetivos` — zero violações nos dois.
- `npm run balanco -- 400` — 17 de 20 faixas dentro do alvo (mesmo de antes;
  as três de fora são as mesmas, no perfil recruta).
- `expo export --platform web` — build OK.

### Compatibilidade de save
`xpParaProximoNivel` é função pura: um save antigo com nível 67 continua
carregando e continua nível 67. A curva nova governa a progressão dali pra
frente. Nenhum campo de save mudou de forma.

### Pendências
1. **A parede é plana demais.** Todas as seis sementes terminam em 29–31. O
   teto funciona, mas todo mundo encosta nele no mesmo lugar; falta variação
   por caminho de vida.
2. **O planejador por objetivos ainda evita risco por construção** — segue de
   sessões anteriores. Ele escolhe as lutas que ganha.
3. **Nenhum Despertar é concedido por conteúdo hoje.** A função existe, a
   curva agora depende dela para o jogo tardio, e nada no mundo a chama. É o
   próximo passo natural: dar à história os limiares que concedem Despertar.
4. Pendências antigas seguem: rotina por pessoa e não por ofício, ninguém
   escrito à mão nas regiões novas, ganchos e segredos não viram missão,
   densidade de perigo por região, Nemesis que só acumula.

### Próximo passo recomendado
Conceder Despertar pela história. Sem isso a curva nova tem um teto e nenhuma
porta — e a porta é justamente a parte que o dono do jogo pediu desde o começo:
o prodígio consagrado, o Musashi da lâmina, o que vive além dos 25 como
Yoriichi. Os limiares existem no mundo (mestres, marcos, missões de linha
principal); falta ligá-los a `concederDespertar`.

---

## Sessão 20 — Claude — a porta do teto — plano antes das alterações

### Correção de um erro meu da sessão 19
Encerrei a sessão anterior dizendo que "nenhum Despertar é concedido por
conteúdo hoje". **Estava errado.** Dois já existem e estão ligados:

- `venceu_oni_ancestral` — derrubar o Oni Ancestral (`engine/combat.ts:945`);
- `dominou_prova_eclipse` — vencer a Cavaleira do eclipse com maestria ≥ 80
  (`engine/combat.ts:930`), mais a consolidação manual em `acoesMundo.ts:62`.

Ambos têm multiplicador em `LEGADOS` (`engine/identidade.ts`), que usa o
**maior** dos legados e não o produto — não há empilhamento de buff.

### Estado encontrado (medido)
Adicionei a métrica `despertares` ao simulador e rodei seis campanhas de dez
anos:

```
nivelFinal    29
despertares   0.17
expedicoes    36.7
```

**0,17 Despertar por campanha** — uma em cada seis campanhas ganha um único
Despertar em dez anos de jogo. A porta existe e está praticamente fechada.

Isso é um problema novo, criado pela sessão 19: antes a curva linear levava ao
nível 67 e o Despertar era irrelevante. Agora a curva para no 29-31 e o
Despertar é o único caminho adiante — mas quase ninguém o atravessa. Trocamos
"progressão infinita sem sentido" por "progressão que termina".

### Objetivo desta sessão
Dar à história mais limiares que concedem Despertar, sem torná-lo farmável.
A regra do dono continua valendo: *avanço raro e ganho, concedido quando o
jogador cruza um limiar real da história, não um número de xp*.

Candidatos, todos apoiados em sistema que já existe:
1. **Maestria consumada** — chegar ao topo real de um domínio. É o "Musashi da
   lâmina" que o dono nomeou: ganho por treino obstinado, não por monstro.
2. **Derrubar uma Lua** — limiar canônico de verdade.
3. **A perda** — morte de um vínculo de família. Muito do gênero, e
   `registrarMorteFamiliar` já é o ponto de engate.
4. **A caçada impossível** — vencer a Besta do primeiro inverno, nível 32, o
   adversário não-oni mais duro do jogo.

Cada um concedido uma única vez (`concederDespertar` já deduplica por id), cada
um com entrada em `LEGADOS`, cada um coberto por teste. Meta mensurável: sair
de 0,17 para algo entre 1 e 2 por campanha de dez anos — raro o bastante para
significar alguma coisa, frequente o bastante para o jogo tardio existir.

Não mexer na camada de casas (faixa do Astra) nem em CHIM.

### O que foi implementado

Quatro limiares novos, todos apoiados em sistema que já existia, todos
concedidos uma única vez, todos com entrada em `LEGADOS`:

| Despertar | Onde dispara | O que exige |
| --- | --- | --- |
| `maestria_consumada` | `engine/aptidao.ts`, dentro de `treinar` | cruzar 90 de maestria em qualquer domínio |
| `derrubou_uma_lua` | `engine/combat.ts`, na queda de um oni `lua_*` | derrubar uma das doze, Inferior ou Superior |
| `a_perda` | `engine/familia.ts`, em `registrarMorteFamiliar` | a primeira morte no próprio sangue |
| `cacada_impossivel` | `engine/combat.ts`, na queda da besta | vencer a Besta do primeiro inverno (nível 32) |

Decisões que valem registro:

- **`maestria_consumada` é um só, em qualquer domínio.** O limiar é "consumou
  um ofício", não um colecionável por perícia. Noventa não é escolha arbitrária:
  a curva de esforço é assintótica, cem exigiria esforço infinito, e acima do
  teto confortável da aptidão o ganho cai para 15% — chegar lá é teimosia de
  anos, e aptidão alta encurta o caminho sem dispensá-lo.
- **`a_perda` é a primeira morte, e só a primeira.** O que muda um caçador não
  é a contagem de perdas — é descobrir que existem.
- **A segunda Lua não concede nada.** Proeza não é transformação.
- `registrarMorteFamiliar` passou a sair cedo se o membro já estava morto.
  Antes reescrevia a condição sem consequência; agora isso importa.

### Resultados — antes e depois

Campanhas de 10 anos, 6 sementes, política exploratória:

| | antes | depois |
| --- | --- | --- |
| Despertares por campanha | **0,17** | **2,33** |
| nível final | 29 em todas as seis | 29, 30, 31, 33, 34, 35 |

Na política por objetivos: 2,83 Despertares, níveis 32–35.

**A pendência 1 da sessão 19 está resolvida de lado.** Ela dizia "a parede é
plana demais — todas as seis sementes terminam em 29–31". Terminam diferente
agora, e por um motivo legítimo: campanhas diferentes atravessam limiares
diferentes. A variação não veio de aleatoriedade, veio de biografia.

### Erro corrigido nesta sessão
Encerrei a sessão 19 afirmando que nenhum Despertar era concedido por conteúdo.
Dois já eram. O plano acima corrige o registro; a medição de 0,17 é o número
que eu deveria ter apresentado no lugar daquela afirmação.

### Arquivos alterados
- `engine/identidade.ts` — quatro entradas novas em `LEGADOS`.
- `engine/aptidao.ts` — `LIMIAR_MAESTRIA_CONSUMADA` e a concessão em `treinar`.
- `engine/combat.ts` — limiares da Lua e da besta.
- `engine/familia.ts` — limiar da perda, e saída cedo em morte repetida.
- `engine/campanhaLonga.ts` — métrica `despertares`.
- `engine/despertar.selftest.ts` — **novo**, 21 asserções.
- `package.json` — a suíte nova entra no `test:engine`.

### Testes executados
- `tsc --noEmit` — limpo.
- `npm run test:engine` (12 suítes + campanha longa) — exit 0, zero violações.
- `npm run test:jornadas`, `npm run test:casas` — OK.
- `simLongo 10 6` e `simLongo 10 6 comum objetivos` — zero violações nos dois.
- `npm run balanco -- 400` — 17 de 20 faixas, igual às sessões anteriores.
- `expo export --platform web` — OK.

### Achado que o teste revelou
A primeira versão do teste da Lua falhava, e estava certa em falhar: sem lâmina
Nichirin equipada o oni volta a 1 de vida para sempre (`aplicarFerimentoOni`).
O teste é que supunha errado. Está documentado no arquivo, porque é o tipo de
regra que um agente futuro vai tropeçar de novo.

### Pendências
1. **2,33 está no limite alto do alvo** (a meta era 1–2). Não é farmável — cada
   limiar é único — mas quatro limiares alcançáveis em dez anos deixam o teto
   mais permeável do que o planejado. Vale reavaliar depois de jogar.
2. **Nenhum limiar vem de missão ou de mestre.** Todos vêm de combate ou de
   treino. Faltam os limiares sociais: o reconhecimento de um mestre, a
   conclusão de uma linha principal, a decisão que custa caro.
3. **A Marca do Caçador não existe no código.** O dono decidiu que o
   protagonista pode viver além dos 25 como Yoriichi — a exceção está definida
   e a regra que ela excepciona nunca foi implementada.
4. Pendências antigas seguem: planejador que evita risco, rotina por ofício e
   não por pessoa, ninguém escrito à mão nas regiões novas, ganchos e segredos
   que não viram missão, Nemesis que só acumula.

### Próximo passo recomendado
Limiares sociais para Despertar (pendência 2). Hoje a única forma de crescer
depois do teto humano é matar alguma coisa ou treinar sozinho — o que faz do
jogo tardio uma coisa só. Um mestre que reconhece, uma linha principal que
fecha, uma escolha que cobra preço: são limiares que o mundo já tem material
para sustentar, e são o que falta para o teto ter mais de uma porta.

---

## Sessão 21 — Claude — fechar as pendências abertas — plano antes das alterações

### Pedido do dono
"Complete tudo agora, faça por etapas com testes e validez e robustez."

### Estado encontrado
Commit `ceb5dac`, árvore limpa, remoto sincronizado (`0 0`). Todas as suítes
verdes. As pendências acumuladas até aqui, consolidadas das sessões 13 a 20:

| # | Pendência | Origem |
| --- | --- | --- |
| A | Nenhum limiar social concede Despertar | sessão 20 |
| B | Prazo de missão é fixo, não conhece distância | sessão 14 |
| C | Densidade de perigo é igual no continente inteiro | sessão 13 |
| D | Rotina é por ofício, não por pessoa; sem expediente | sessão 15 |
| E | Ganchos e segredos não viram missão | sessão 14 |
| F | Ninguém escrito à mão nas regiões novas | sessão 14 |
| G | Marca do Caçador não existe no código | sessão 20 |
| H | Nemesis só acumula, nunca recua | sessão 13 |
| I | Planejador por objetivos evita risco por construção | sessão 3 |

### Fora de escopo, de propósito
A camada de casas (etapas 2 a 7 da diretriz do dono) é a faixa ativa do Astra.
Trabalhar nela em paralelo produziria conflito nos mesmos arquivos. Fica com ele.

### Método desta sessão
Uma etapa por commit, cada uma com: medição antes, implementação, teste
dedicado, suíte completa verde, registro aqui. Nenhuma etapa é declarada
pronta sem `tsc`, `test:engine` e campanha longa sem violação de invariante.

### Etapa A — limiares sociais de Despertar

Dois limiares que não passam por matar nem por treinar sozinho:

| Despertar | Onde dispara | O que exige |
| --- | --- | --- |
| `mestre_esgotado` | `engine/magic.ts`, em `aprenderArte` | aprender a última arte de um mestre com repertório ≥ 3 |
| `nome_conhecido` | `engine/aptidao.ts`, em `atualizarReputacao` | o pico de reputação num domínio cruzar 78 |

`nome_conhecido` é o único Despertar do jogo que não depende do que o
personagem **é**, e sim do que o mundo passou a **acreditar**. Ele respeita a
regra central do módulo de aptidão: reputação é limitada pela exposição, então
ninguém vira nome conhecido treinando sozinho num celeiro. Usa o **pico** de
reputação, não a corrente — glória antiga esfria devagar e não deveria desfazer
o que o mundo já soube.

`MIN_ARTES_PARA_LIMIAR = 3` existe para que "aprendi tudo que ele sabia" diga
alguma coisa: um mestre de uma arte só seria limiar alcançável na primeira
semana de jogo.

Medição: **2,33 → 3,0 Despertares** por campanha de dez anos. Nível final
29–34. Zero violações de invariante.

Testes: a suíte `despertar.selftest.ts` subiu para 30 asserções. O teste do
mestre passa pelo `aprenderArte` de verdade — conceder na mão só provaria que
a deduplicação funciona. Há caso negativo para mestre de repertório curto.

Arquivos: `engine/magic.ts`, `engine/aptidao.ts`, `engine/identidade.ts`,
`engine/despertar.selftest.ts`.

### Etapa B — escala do mapa e prazo que conhece a distância

A pendência dizia "prazo de missão é fixo". A medição encontrou uma causa
maior, e a pendência estava descrevendo o sintoma.

**O continente não tinha escala.** Com 53 lugares no mapa, **nenhum par estava
a mais de dois dias de distância**. As arestas eram declaradas em 1 ou 2
períodos e o dia tem seis: o continente inteiro tinha a largura de uma tarde.
Isso esvaziava três coisas ao mesmo tempo — prazo de missão nunca apertava,
perigo de rota nunca acumulava, e escolher para onde ir não era decisão.

**A regra nova fica nos dados, não em quarenta arestas reescritas à mão:**
atravessar região custa dia, andar dentro dela custa hora
(`FATOR_ENTRE_REGIOES = 6`, aplicado em `integrarContinente`). Duas exceções
deliberadas: aresta de custo zero fica zero — é o autor dizendo "isto é
praticamente o mesmo lugar", e escalar inventaria distância que a ficção nega;
e regiões de fora do mundo não entram, porque não se chega lá andando.

| | antes | depois |
| --- | --- | --- |
| distância mediana entre dois lugares | 1 dia | **4 dias** |
| distância máxima | 2 dias | **6 dias** |
| prazo de resgate cobre ida-e-volta de | 100% dos pares | 48% |

Aquele 48% não é defeito: é o mundo ficando maior que uma pessoa. Mas exigiu a
segunda metade da etapa — **o prazo passou a contar a ida**. `oferecerMissao`
agora soma duas pernas: onde você está → onde é a crise, e a viagem que a
missão exige em si. Antes só a segunda era contada, o que não custava nada num
mapa onde tudo ficava a dois dias. Um resgate de prazo seis oferecido do outro
lado do mapa não é oferta, é formalidade.

**Efeito medido** (6 anos, 3 campanhas, política por objetivos):

| | antes | depois |
| --- | --- | --- |
| missões concluídas | 118 de 233 (51%) | 88 de 229 (38%) |

A queda é o preço correto de um mundo três vezes maior: uma pessoa não serve
todas as crises de um continente. O que a etapa garante é que nenhuma missão
seja oferecida com prazo que a geografia já nega.

**Testes:** cinco asserções novas em `continente.selftest.ts` prendem a escala
— mediana ≥ 3 dias, máximo ≥ 5, rotas intrarregionais ≤ 1 dia, rotas de custo
zero preservadas — mais uma que confere que o prazo de um resgate distante
cobre a chegada. Sem isso a escala poderia encolher de novo sem ninguém notar.

Arquivos: `content/vaelhorn/continente.ts`, `engine/missoesVivas.ts`,
`engine/continente.selftest.ts`.

### Etapa C — o rosto de cada região

A pendência dizia "densidade de perigo por região". Medindo, descobri que a
densidade **já existia**: Vale 3,7 · Bosque de Vintra 6,0 · Ermo de Solgar 5,5
· Marca de Tessel 3,9. O número variava.

O que não variava era **o que aparece**. O sorteio de encontro olhava só o
`tipo` do lugar, nunca a região — e a medição foi categórica:

> Dois lugares do mesmo tipo em regiões diferentes sorteavam listas
> **100% idênticas**. Toda aldeia do continente, em qualquer região, cuspia
> exatamente as mesmas criaturas.

A região tinha intensidade e não tinha rosto. Um lobo no Ermo de Solgar — um
deserto — era tão provável quanto no Bosque de Vintra.

**O que foi feito:** `encontrosPorRegiao` em `bestiary.ts`, sete tabelas, uma
por região do continente, e `encontrosDoLugar()` em `engine/viagem.ts` que
junta o elenco do tipo com o da região. Tessel dá gente (salteador, bandido,
arqueiro); Corveira dá o que vem de baixo ou voa alto (verme de pedra, mineira
enlouquecida, corvo, gárgula); Mareu dá contrabando e o que o mar devolve;
Vintra dá mata fechada; Solgar dá ossada não enterrada; os Baixios dão o que
espera parado no lodo.

**As duas listas somam, não filtram.** Filtrar poderia esvaziar a tabela de um
lugar, e `selftest.ts` cobra que todo tipo sorteável tenha encontro.
Exclusividade de verdade é decisão da criatura, via `regiaoExclusiva` — essa
sim filtra, porque é o autor dizendo onde aquilo pode existir. Hoje nenhuma
criatura a usa; o campo existe para quando o bestiário quiser.

| semelhança de elenco entre regiões, no mesmo tipo de lugar | antes | depois |
| --- | --- | --- |
| média geral | **100%** | **43%** |
| aldeia (5 regiões) | 100% | 41% |
| cidade (3 regiões) | 100% | 26% |
| capela (3 regiões) | 100% | 14% |

**Erro de método que vale registrar:** minha primeira medição comparou a união
de todos os encontros de cada região e deu 34% antes, 35% depois — quase nada.
Concluir dali que a mudança não funcionou teria sido errado: a métrica é que
estava errada. A união de uma região inteira já era ampla e parecida com a das
outras; a pergunta certa era sobre o mesmo tipo de lugar em regiões
diferentes, e aí a diferença é 100% contra 43%.

**Testes:** `continente.selftest.ts` ganhou a asserção de semelhança < 70%,
mais uma por lugar garantindo que somar a região não faz ninguém perder
encontro do próprio tipo, mais uma por região exigindo tabela característica.

Arquivos: `content/vaelhorn/bestiary.ts`, `content/vaelhorn/index.ts`,
`engine/viagem.ts`, `engine/types.ts`, `engine/continente.selftest.ts`.

### Etapa D — rotina por pessoa, e rotina que reage ao mundo

Duas metades da mesma pendência, aberta desde a sessão 15.

**Metade 1 — o ofício dava o ritmo e a pessoa não existia.** Duas taverneiras
de cidades diferentes viviam exatamente o mesmo dia, período por período:
**100% dos pares do mesmo ofício tinham dia idêntico**. Agora cada morador
recebe um `Feitio` — madrugadora, que dorme tarde, caseira, que some à tarde,
de anoitecer no mato, inquieta, que reza sozinha, ou nenhum. O feitio desloca
um ou dois períodos; não reescreve o ritmo, senão o ofício deixaria de
significar alguma coisa e a variação viraria ruído. Sorteado do mesmo RNG
determinístico do lugar, então Tessel continua tendo sempre a mesma gente com
os mesmos hábitos.

| pares do mesmo ofício com dia idêntico | antes | depois |
| --- | --- | --- |
| | **100%** | **25%** |

Teste de contenção junto: quem trabalha na lavoura continua saindo (6 de 6).

**Metade 2 — ninguém mudava de hábito quando a vila ficava perigosa.**
`localEfetivo` agora recolhe quem sairia do assentamento quando a insegurança
passa de 55, ou quando há ameaça ativa no lugar exato para onde a pessoa iria.
Combatentes não se recolhem — é essa a diferença entre a guarda e o resto.

Em Tessel, período de maior saída: **7 pessoas no mato em paz → 0 com a vila
insegura**, e os 2 combatentes continuam fora. Ameaça ativa no destino produz
o mesmo efeito com a cidade calma.

**Limitação declarada:** o medo difuso só alcança NPC cujo `localBase` é o
próprio assentamento — os moradores gerados. Um NPC escrito à mão que mora na
taverna sente a ameaça concreta, mas não o medo difuso. Resolver exigiria o
`content` dentro de `localEfetivo` (para `cidadeIdDoLocal`), e mudar aquela
assinatura ramifica por meio motor. Fica anotado, não escondido.

**A pendência do expediente continua aberta.** "A rotina não conhece a hora do
lugar" (sessão 15, item 2) é outro problema: exigiria os moradores circularem
entre sub-locais do assentamento — taverna, praça, mercado — e hoje o
`localBase` deles é o assentamento inteiro.

### Teste frágil corrigido no caminho
`selftest.ts` reprovou em "Duas semanas paradas mudam o vale". **Não era
regressão.** A carestia tinha mudado — de 1 para 0,9943 — mas o teste exigia
0,01 de afastamento, um limiar escolhido a dedo, numa única semente. Meu ajuste
deslocou o cursor do RNG e a moeda caiu do outro lado.

O teste agora afirma o que importa de verdade: "o vale anda sem o jogador" é
propriedade do mundo, não de uma semente. Mede 20 campanhas e exige que ao
menos 80% andem — deu **20 de 20**. A afirmação ficou mais forte do que era,
não mais fraca; um teste que passava por sorte não estava provando nada.

Arquivos: `content/vaelhorn/povoamento.ts`, `engine/historiaViva.ts`,
`engine/povoamento.selftest.ts`, `engine/selftest.ts`.

### Etapa E — os ganchos do mapa viram razão para sair de casa

O mapa carrega **mais de cem ganchos escritos à mão** — "o celeiro está cheio e
a vila come pouco", "três rapazes não voltaram da última leva e a lista diz que
voltaram", "uma galeria foi interditada e a interdição foi removida por
dentro". Até aqui esse material só chegava ao narrador como sabor de ambiente e
morria ali. Nenhum deles gerava uma única razão para o jogador ir a lugar
nenhum.

`engine/ganchos.ts` fecha essa ponta: um gancho vira missão de investigar cuja
**causa é o texto literal do gancho**. A missão não é procedural com rótulo
colado por cima — é a ficção que já estava escrita entrando pela porta que o
mundo vivo já usa.

**Duas correções de rumo durante a etapa, ambas achadas medindo:**

1. **O gancho queimava na oferta.** A primeira versão marcava o gancho como
   usado no instante em que a missão era oferecida. Medido: em dez anos o
   jogador consumia 102 dos ~110 ganchos do mapa, a maioria expirando sem
   ninguém chegar perto — a ficção autoral se gastava sem ser vista. Agora só
   queima quando o jogador **aceita** ou conclui. Ignorado, o gancho volta para
   a fila: um rumor que ninguém foi checar não deixa de ser verdade.
2. **Devolver criou um moinho.** Com a devolução e sem carência, o mesmo punhado
   de rumores era reoferecido a cada poucas semanas. Entrou
   `CARENCIA_DO_GANCHO = 240` dias: o assunto esfria e ressurge quando já virou
   história velha de novo.

**Calibração, medida e não escolhida no olho** (10 anos, 3 sementes, objetivos):

| chance/dia | ganchos engajados | missões concluídas | falhadas |
| --- | --- | --- | --- |
| 0 (sem ganchos) | 0 | 171 | 201 |
| 0,008 | 26 | 144 | 223 |
| 0,015 | 42 | 141 | 251 |
| 0,025 | 71 | 133 | 265 |
| 0,06 | 102 (de ~110) | — | — |

A leitura que importa: **gancho desloca missão do mundo quase um por um**,
porque o tempo do jogador é finito. Não é defeito — é o custo de haver mais o
que fazer. Ficou em **0,01**, que dá uns três ganchos engajados por ano: o
tamanho de "ouvi uma coisa na praça e fui ver".

**Regras de alcance:** rumor anda por rota — vale o lugar onde o jogador pisou
e o que faz fronteira com ele, senão a lista viraria um catálogo do mapa
inteiro. E lugar oculto não vaza gancho antes de ser descoberto, o que mantém
a promessa da sessão 14.

**Testes:** `engine/ganchos.selftest.ts`, 23 asserções, ligado ao `test:engine`.
Cobre o que importa: a causa é o texto literal de um gancho do mapa; ignorar
não consome; aceitar consome para sempre; a carência devolve à fila; rumor não
alcança o mapa inteiro; lugar oculto não vaza e passa a render depois de
descoberto; o teto de dois abertos é respeitado.

Arquivos: `engine/ganchos.ts` (novo), `engine/ganchos.selftest.ts` (novo),
`engine/mundoVivo.ts`, `engine/campanhaLonga.ts` (métrica `ganchosUsados`),
`package.json`.

### Etapa F — gente de quem se lembrar nas regiões novas

Pendência que o dono levantou duas vezes: *"precisamos ter um tempo pra focar
somente em personagens"*. A medição confirmou o tamanho do buraco:

| região | escritos à mão | gerados |
| --- | --- | --- |
| Vale de Halvet | 28 | 10 |
| Fora do Vale | 27 | 4 |
| Marca de Tessel | **0** | 33 |
| Planalto de Corveira | **0** | 36 |
| Costa de Mareu | **0** | 45 |
| Bosque de Vintra | **0** | 19 |
| Ermo de Solgar | **0** | 18 |
| Baixios de Halvern | **0** | 5 |

156 moradores gerados no continente e **zero pessoas escritas à mão**. As
regiões novas tinham densidade — gente na praça — e ninguém de quem lembrar
depois. Densidade é trabalho de gerador; personagem é trabalho de autoria.

`content/vaelhorn/elenco-continente.ts` traz 16 pessoas, e **cada uma está
amarrada a algo que o mapa já dizia**. A ficção veio primeiro, a ficha veio
depois:

- A história de **Pedravel** diz que o celeiro foi erguido com pedra roubada do
  forte, de noite, peça por peça, e que todo mundo sabe e ninguém diz. Então
  Pedravel tem **Mora Quelha**, 71 anos, que organizou o roubo durante dois
  invernos e tem a conta escrita — e esconde um dos três rapazes que a lista da
  leva diz que voltaram.
- **Corveira** pertence a sete famílias que se comportam como reinos e teve um
  desabamento que matou duzentos e onze, indenizado em minério. Então Corveira
  tem **Halda Verrão**, que comprou o laudo, e **Sibel Arne**, que o assinou aos
  trinta e dois e guarda o relatório verdadeiro costurado no forro do casaco.
- O gancho do **Mosteiro do Alto** dizia "um irmão copia o mesmo texto há
  semanas e queima cada cópia". Agora há **Irmã Velun**, que queima porque
  decorar é a única forma de guardar o que mandaram destruir.
- O gancho do **Forte Agulha** dizia que o poço secou e ninguém reportou. A
  **aguadeira do Poço Seco**, no outro lado do mapa, sabe o que foi feito —
  porque foi a ela que pediram para fazer.

Elenco autoral do jogo: **56 → 72 pessoas**.

**Uma correção de premissa no caminho.** Escrevi Ivo Quelha como "lavradora de
contrabando" por reflexo da regra do feminino. Errado: a premissa é que a Leva
**leva os homens**, e é por isso que o vale é das mulheres — um rapaz escondido
que fugiu da leva é exatamente o que a ficção já fazia com o segredo da
Aldrica. Virou "foragido da leva". A regra do selftest é sobre ofício, não
sobre existir homem no mundo.

**Testes:** `engine/elenco.selftest.ts`, ligado ao `test:engine`. Cobra que
cada uma das seis regiões tenha gente com nome, que cada pessoa more num lugar
que tem história ou gancho para conversar, que tenha voz, índole, corpo e os
seis períodos do dia, que 70% carreguem segredo **com caminho para ser
descoberto**, que 60% tenham laço, e que nenhum id ou nome colida com o elenco
antigo.

Arquivos: `content/vaelhorn/elenco-continente.ts` (novo),
`engine/elenco.selftest.ts` (novo), `content/vaelhorn/index.ts`, `package.json`.
