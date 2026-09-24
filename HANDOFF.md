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

- **`HANDOFF.md` (este arquivo)** — estado atual, sessões recentes (51 em
  diante), problemas abertos e próximo passo. É o que se lê antes de trabalhar.
- **`HANDOFF-ARQUIVO.md`** — sessões 1 a 50, na íntegra e sem edição. Consultar
  quando for preciso saber *por que* alguma decisão antiga foi tomada. As
  sessões 13 a 23 foram movidas na sessão 40, 24 a 27 na sessão 42, 28 a 31 na sessão 43, 32 a 38 na sessão 44, 39 a 42 na sessão 48, 43 a 45 na sessão 51, e 46 a 50 na sessão 56.

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

## Sessão 51 — Claude — Fase 5: estações, feras em bando, caravanas

### Estado encontrado
A estação mudava o clima e a lavoura (`cidades.ts`: fertilidade 0,8 no
inverno) e mais nada. O encontro de viagem sorteava uma criatura do lugar e,
em 20% das vezes, uma segunda — inclusive contra personagem de nível 1. Cidade
com celeiro cheio e cidade com fome não se tocavam: cada uma resolvia sozinha.

Simulação longa antes: a tabela da sessão 50.

### O que foi feito
- **Peso por estação no bestiário** (`Criatura.estacoes`, opcional): 13 feras
  marcadas (lobo e lobo branco com fome no inverno, urso hibernando e voltando
  com fome na primavera, serpente, aranha, morcegos e sanguessuga de verão,
  corvo migrando e javali no outono, cão selvagem e gárgula no inverno). O peso escolhe **quem** aparece (sorteio ponderado) e mexe
  na **chance** de haver encontro (média dos pesos do pool, limitada a
  0,6–1,5): estrada de bicho de verão fica mais calma no inverno. Criatura sem
  declaração pesa 1 — onis, fantasmas e o resto do bestiário não mudam.
- **Feras em bando** (`Criatura.bando: {min, max}`): lobo, lobo branco, cão
  selvagem, corvo e rato gigante vêm em grupo, com o mesmo teto por nível
  dos bandos (`tetoDeGrupo` = 1 + nível/3, de 1 a 4). **Nível 1 e 2 nunca
  enfrentam mais de um inimigo em encontro aleatório**: a segunda criatura
  "de 20%" também passou a respeitar o teto.
- **Inverno rigoroso** (`engine/estacoes.ts`): no inverno, chance de 1/40 por
  dia de nevasca de 4 a 8 dias, com fato público no começo e no fim (degelo).
  Durante ela, rota que toca `passo` ou `colina` fica +3 mais perigosa em
  `perigoEfetivoDaRota`. Decisão: **perigo maior em vez de rota fechada** —
  fechar podia prender o jogador do lado errado do Passo do Lobo por uma
  semana sem aviso; o perigo maior deixa a escolha com ele. RNG derivado
  (semente + dia): não consome o RNG da campanha. Estado em
  `camp.mundo.invernoRigoroso` (opcional).
- **Caravanas** (`engine/caravanas.ts`, `camp.caravanas` opcional): a cada 5
  dias, a cidade com mais comida (≥ 280) manda até 90 medidas para a cidade
  com fome mais perto (até 18 períodos de estrada), no máximo 3 na estrada.
  Na chegada, bando ativo com 3+ homens na região da origem ou do destino
  ataca com chance 35% + 3% por homem (teto 70%). Perdida: o grão vira tesouro
  do bando, o destino fica 10 mais inseguro, fato público. Entregue: fato
  público. **Escolta** (ação `escoltar_caravana`, botão "caravanas partindo"
  em Comunidade): com bando na rota vira luta contra salteadores do bando (com
  o teto por nível); vencida ou sem bando, a caravana chega de certeza e a
  cidade paga 12 moedas e +1 de reputação na vila. Sem bandos no conteúdo
  (Tsukimichi), não há caravanas.
- Tela: aviso de nevasca e caravanas partindo em `MundoVivo.tsx`. Simulador:
  encontros por estação, caravanas entregues e perdidas.

### Arquivos
Novos: `engine/estacoes.ts`, `engine/caravanas.ts`,
`engine/estacoes.selftest.ts`, `engine/caravanas.selftest.ts`.
Alterados: `engine/types.ts` (`Criatura.estacoes`, `Criatura.bando`,
`Caravana`, `EstadoCaravanas`, `CombatState.caravana`),
`content/vaelhorn/bestiary.ts`, `engine/viagem.ts`, `engine/mundo.ts`,
`engine/bandos.ts` (`encontroContraCaravana`), `engine/combat.ts` (desfecho da
escolta), `engine/acoesMundo.ts`, `engine/index.ts`, `engine/campanhaLonga.ts`,
`ui/screens/MundoVivo.tsx`, `package.json` (os dois testes em `test:engine`).
`HANDOFF.md`: sessões 43 a 45 movidas para `HANDOFF-ARQUIVO.md` (o arquivo
passava de 880 linhas), texto intacto.

### Verificações
- `estacoes.selftest.ts`: pesos declarados; mais lobo no inverno que no verão
  (544 contra 258 em 3.000 sorteios), quase nenhum urso nem serpente no
  inverno; pool de bicho de verão com menos encontro no inverno; teto por
  nível (nível 1: 0 grupos de 2+ em mais de 2.000 encontros e em 200 viagens
  reais; nível 9 encontra matilha dentro do teto); nevasca chega, vira fato,
  +3 no passo e 0 na planície, sobrevive ao save, degelo com fato; fora do
  inverno não neva; o inverno não consome o RNG principal.
- `caravanas.selftest.ts`: caravana sai da sobra para a fome, a carga sai do
  celeiro, entrega soma no destino; sem fome, ninguém manda; com bando de 8
  na rota, 19 de 30 atacadas, com tesouro do bando e insegurança do destino
  subindo; escolta sem bando (entrega certa, 12 moedas), escolta com bando
  (nível 1 luta contra 1 salteador; vencida, a caravana chega mesmo com bando
  de 20); save idêntico; Tsukimichi sem caravanas.
- `typecheck`, `test:engine` completo, `test:jornadas`, `test:casas`,
  `vaelhorn_expansao`, `expo export --platform web`: verdes.

Simulação longa depois (`simLongo 10 6`):
```
longa-0    10a  fim_do_prazo nível 32  pop 4054  fome    0d  travas     0  violações 0
longa-1    10a  fim_do_prazo nível 29  pop 3635  fome    0d  travas     0  violações 0
longa-2    10a  fim_do_prazo nível 35  pop 4158  fome    0d  travas     0  violações 0  marca aos 24
longa-3    10a  fim_do_prazo nível 28  pop 3679  fome    0d  travas     0  violações 0
longa-4    10a  fim_do_prazo nível 31  pop 3859  fome    0d  travas     0  violações 0
longa-5    10a  fim_do_prazo nível 31  pop 4278  fome    0d  travas     0  violações 0
```
| | Sessão 50 | Sessão 51 |
| --- | --- | --- |
| nível final | 31,3 | 31,0 |
| população | 3.866 | 3.944 |
| derrotas | 19,8 | 18,7 |
| fome no fim | 6 | 0 |
| dias-cidade em fome | 2.621 | 617 |
| mortes | 0 | 0 |

Encontros por estação (média por campanha): primavera 164, verão 184,5,
outono 177,7, inverno 171,2. Caravanas: 270,7 entregues e 20,8 perdidas por
campanha (7%). Nível 1–5: 49,1% de vitória em 57 combates.

### Problemas e decisões em aberto
- **As caravanas quase acabaram com a fome** (dias-cidade em fome −76%). É o
  efeito esperado de ligar sobra a falta, mas tira pressão das missões de
  abastecer. Se o dono quiser mais fome no mundo, os botões são
  `COMIDA_PARA_MANDAR` (280) e `CARGA_MAXIMA` (90) em `engine/caravanas.ts`.
  Não mexi: nenhuma métrica de risco piorou.
- A diferença entre estações existe mas é pequena na média (verão +12% sobre
  a primavera), porque a maioria dos pools mistura feras de várias estações e
  onis (peso 1). Aparece forte por fera (lobo, urso, serpente), que é o que o
  jogador percebe.
- `combat.ts` importa `caravanas.ts`, que importa `combat.ts`: import circular
  só de funções, resolvido em tempo de chamada. Funciona; se um dia der
  problema de ordem de carga, mova `registrarDesfechoCaravana` para um módulo
  sem dependência de combate.

### Próximo passo
Fase 6 (cidades com identidade e a forja ao alcance).

---

## Sessão 52 — Claude — Fase 6: cidades com identidade e a forja ao alcance

### Estado encontrado
As 23 comunidades vivas tinham os mesmos cinco edifícios (lavoura, moradias,
enfermaria, muralha, mercado), todos com teto 5. Corveira, construída em cima
da mina, não se distinguia de Mareu, que vive do cais.

A forja estava mais perto do que o plano supunha. Levantei cidade por cidade:
a Feira Coberta, vizinha da taverna onde o jogo começa, tem ponto "ferraria",
duas ferreiras escritas (Torana e Duna) e vende carvão e minério. As cinco
cidades grandes já tinham ferreira ou armeira com ocupação clara e família da
Fase 2: Wyn Bico-Fino (Corveira), Ysolt Boca-Seca (Solgar), Elna a Velha
(Vintra), Vana do Fole (Tessel), Kelda Cais (Mareu). Por isso o item 2 do
plano não pediu NPC novo. O que faltava era **provar** o caminho com teste, e
ele tem um degrau: o dinheiro inicial (12) não paga carvão e dois minérios
(16). Um turno de trabalho na comunidade (+6) resolve.

Simulação longa antes: a tabela da sessão 51.

### O que foi feito
- **Um edifício por região**, declarado no conteúdo
  (`content/vaelhorn/edificiosRegionais.ts`, tipo `EdificioRegional`); a
  engine só aplica o efeito (`engine/edificiosRegionais.ts`). Cada um veio do
  ponto que a descrição da cidade já tinha:
  - **Fundição Alta** (Corveira, Wyn): vende carvão, minério e estilhaço de
    pedra; Corveira passa a ter onde forjar mesmo sem ferreira presente, e a
    peça forjada ali **não gasta carvão**.
  - **Cais Grande** (Mareu): +5 de comida por dia; caravana que parte de
    Mareu vai pela costa e corre metade do risco de emboscada.
  - **Praça de Armas** (Tessel, Vana): muralha até o nível 8; a cada 15 dias
    a ronda da guarnição tira um homem do maior bando da Marca de Tessel,
    com fato público.
  - **Cisterna Funda e Bazar** (Solgar, Ysolt): na seca a lavoura rende 0,55
    em vez de 0,15; o bazar vende prata, poção de cura e tônico, e repõe
    peça rara até 4 (o comum é 2).
  - **Pátio da Madeira** (Vintra, Elna): vende carvão e couro; +0,6 de
    materiais por dia para as obras.
- Edifício regional funciona enquanto a cidade tem gente e integridade acima
  de 20 (a régua da reposição do mercado): cidade arrasada apaga a fundição e
  para a ronda.
- **Capitais com teto 7** (Tessel, Corveira, Mareu), declarado por cidade
  (`tetoEdificios`); o resto continua em 5. `iniciarObra` ganhou o `content`
  como parâmetro opcional para saber o teto (sem ele, 5 — quem chamava antes
  continua igual).
- O que um edifício vende entra na lista de lojas do item quando o pacote de
  conteúdo é montado (`lojasRegionais` em `content/vaelhorn/index.ts`): a loja
  continua sendo lida do item, sem regra nova de comércio.
- Tela: seção do edifício "só aqui" em Comunidade, nível "de N" em cada
  edifício comum; a forja no Inventário mostra a fundição e libera a receita
  sem carvão em Corveira. Narrador: `mundoPersistente.cidade.edificioProprio`.
- Nenhum efeito consome RNG. Nenhum campo novo no save.

### Arquivos
Novos: `content/vaelhorn/edificiosRegionais.ts`, `engine/edificiosRegionais.ts`,
`engine/edificiosRegionais.selftest.ts`.
Alterados: `engine/types.ts` (`EfeitosRegionais`, `EdificioRegional`,
`ContentBundle.edificiosRegionais`, `ContentBundle.tetoEdificios`),
`content/vaelhorn/index.ts`, `engine/cidades.ts`, `engine/casas.ts`,
`engine/acoesMundo.ts`, `engine/forja.ts`, `engine/caravanas.ts`,
`engine/llm.ts`, `engine/index.ts`, `engine/campanhaLonga.ts`,
`engine/jornadas.selftest.ts`, `ui/screens/MundoVivo.tsx`,
`ui/screens/Inventario.tsx`, `package.json`.

### Verificações
- `edificiosRegionais.selftest.ts`: cinco edifícios, um por cidade, nenhuma
  outra cidade com edifício; responsáveis existem no elenco; Vintra vende
  carvão (antes não vendia), Corveira minério e pedra, Solgar prata e poção,
  e o estoque vivo já nasce com isso; teto 7 nas capitais, 8 na muralha de
  Tessel, 5 em Pedravel e em Tsukimichi; muralha 5 sobe em Tessel e não em
  Pedravel. Efeito medido contra o mesmo mundo sem edifícios: Mareu com 295
  de comida contra 195 em 20 dias; Solgar com 129 contra 79 em 10 dias de
  seca; Vintra com 48 de materiais contra 30 em 30 dias; bazar repõe poção
  até 4; ronda no dia 15 tira um homem do bando, fora do dia nada, Tessel
  arrasada não patrulha; com bando de 8 na costa, 12 de 40 caravanas de Mareu
  perdidas contra 21 sem o cais; em Corveira, na madrugada (sem ferreira
  presente), sem a fundição não se forja e com ela sim, e a peça sai sem
  carvão; na Feira Coberta sem carvão, não; Corveira arrasada apaga a
  fundição.
- `jornadas.selftest.ts`, **jornada da primeira forja**: campanha nova, da
  taverna para a Feira Coberta pela viagem real, um turno de trabalho, compra
  de carvão e dois minérios (16 moedas), lâmina curta de ferro forjada no dia
  1 de jogo.
- `typecheck`, `test:engine` completo, `test:jornadas`, `test:casas`,
  `vaelhorn_expansao`, `expo export --platform web`: verdes.

Simulação longa depois (`simLongo 10 6`):
```
longa-0    10a  fim_do_prazo nível 33  pop 4402  fome    0d  travas     0  violações 0  marca aos 26
longa-1     8a  morte        nível 31  pop 4085  fome    0d  travas     0  violações 0  marca aos 19 (morreu dela)
longa-2    10a  fim_do_prazo nível 30  pop 4428  fome    0d  travas     0  violações 0
longa-3    10a  fim_do_prazo nível 29  pop 4390  fome    2d  travas     0  violações 0
longa-4    10a  fim_do_prazo nível 34  pop 3804  fome    0d  travas     0  violações 0  marca aos 24
longa-5    10a  fim_do_prazo nível 31  pop 4353  fome    0d  travas     0  violações 0
```
| | Sessão 51 | Sessão 52 |
| --- | --- | --- |
| nível final | 31,0 | 31,3 |
| população | 3.944 | 4.244 |
| derrotas | 18,7 | 15,5 |
| dias-cidade em fome | 617 | 572 |
| obras de casa | 14,2 | 20,8 |
| patrulhas de casa | 11,2 | 7,2 |
| caravanas entregues / perdidas | 270,7 / 20,8 | 271,5 / 17,3 |
| mortes | 0 | 1 (Marca) |

Rondas da Praça de Armas: 19,7 por campanha. Peixe do Cais Grande: 17.642
medidas por campanha (5 por dia, quase todo dia).

**A morte de longa-1, investigada antes do commit.** É a regra da Fase 1
funcionando, não efeito desta fase: a Marca despertou aos 19, o limite ficou
em 25, e dali o tributo anual mata com 10%, 15%, 20%... — 25% a 39% de chance
de morrer entre 26 e 27 anos. O simulador nunca procura a contenção na
Mansão, então toda Marca cedo é um risco real nele. Esta fase não toca na
Marca, no combate nem no consumo de RNG; ela muda o estado do mundo (comida,
bandos), e isso embaralha o caminho de cada campanha — os despertares foram 2,
1 e 3 nas sessões 50, 51 e 52. Registro para o dono: se quiser a simulação
sem esse ruído, a política dela precisa aprender a ir conter a Marca; não
mexi, porque mudaria a régua de comparação no meio do trabalho.
As patrulhas de casa caíram porque a ronda de Tessel já tira homem do bando
da Marca; as obras de casa subiram porque as capitais agora têm onde crescer.

### Problemas e decisões em aberto
- O Cais Grande ajuda Mareu todo dia; somado às caravanas, a fome ficou rara
  no mundo (dias-cidade em fome 572 em 10 anos, contra 2.621 antes da
  Fase 5). Os botões estão no conteúdo: `comidaPorDia` do cais e as
  constantes de `engine/caravanas.ts`.
- A bigorna da fundição fica em Corveira mesmo. Na boca da mina ou no Terraço
  Sexto não conta.
- Os três bandos caem em regiões sorteadas: em campanha sem bando na Marca de
  Tessel, a ronda não tem em quem bater (a muralha 8 continua valendo).

### Próximo passo
Fase 8 (o mundo lembra e Diretor de Arcos). A Fase 7 (NPCs de Tsukimichi)
ficou fora a pedido do dono.

---

## Sessão 53 — Claude — Fase 8: o mundo lembra e o Diretor de Arcos

### Estado encontrado
Mais do que o plano supunha já existia. O pacote do narrador dá peso 100 a
fato com vínculo pessoal e 40 a fato do local, e tem `retornoAoLocal`
(`engine/contextoNarrativo.ts`). A tela Crônica junta o feed da sessão e
`camp.cronica`. Faltavam três coisas:
1. uma linha escrita pela **engine** (não pela IA) quando o jogador volta a um
   lugar onde fez algo;
2. missão cumprida pelo jogador não tinha o jogador como ator
   (`encerrarMissao` punha só `q.ator`), então não contava como feito dele;
3. nada empurrava para perto do jogador o que já estava acontecendo longe
   dele — o `processarDiretor` de `cidades.ts` só sorteia incidentes das
   cidades.

### O que foi feito
- **O mundo lembra** (`engine/memoriaMundo.ts`):
  - ao chegar a um lugar sem emboscada, se houver feito público do jogador ali
    (ou na comunidade daquele lugar), de dia anterior e ainda não lembrado, a
    engine escreve a linha. Um feito por chegada, cada feito uma vez;
  - feitos que contam: capitão morto, capitão preso, esconderijo tomado,
    derrota para capitão, obra-prima, missão cumprida, compromisso falhado,
    caravana escoltada, trégua mediada. A linha abre com a reação da cidade e
    segue com o texto do próprio fato ("Na Feira Coberta, gente que você não
    conhece te cumprimenta pelo nome. Ainda contam: ...");
  - o que não foi público (espionagem) a cidade não comenta.
- `encerrarMissao`: missão aceita e cumprida, ou aceita e falhada, põe
  `jogador` entre os atores. Oferta que expirou sem aceite e missão resolvida
  por outros, não.
- **Diretor de Arcos** (`engine/diretor.ts`, passe diário em `avancarMundo`).
  Ordem fixa de prioridade:
  1. compromisso a 2 dias ou menos do prazo (mensageiro);
  2. capitão de bando vivo que caça o jogador ou guarda rancor;
  3. pedido de ajuda na comunidade onde ele está (vira conhecido);
  4. casa nobre com legitimidade abaixo de 30;
  5. gente com quem ele tem relação, de luto há até 20 dias.

  Regras do diretor:
  - no máximo um gancho a cada 3 dias;
  - o mesmo alvo não volta antes de 20 dias;
  - não cria estado, não consome RNG, não age com o jogador cativo.
- **Fila de avisos**: lembrança e gancho vão para `camp.memoriaMundo.avisos`
  (no máximo 3) e para a crônica persistente como eco. O store consome a fila
  antes de narrar e põe as linhas no feed. O narrador recebe as do dia em
  `mundoLembra`, com a regra 2c: deixar aparecer num gesto ou fala, sem
  repetir a frase nem inventar consequência.
- **Crônica**: card "O que o mundo lembra de você", com os últimos 15 fatos em
  que o jogador foi ator, em ordem, com dia e lugar.
- Nomes de lugar com artigo viram contração ("Na Feira Coberta", "No Moinho
  Parado"); região idem ("na Marca de Tessel", "no Vale de Halvet").
- Simulador: ganchos do diretor e lembranças por campanha.

### Arquivos
Novos: `engine/memoriaMundo.ts`, `engine/diretor.ts`,
`engine/diretor.selftest.ts`.
Alterados: `engine/types.ts` (`Campaign.memoriaMundo`, opcional),
`engine/missoesVivas.ts`, `engine/viagem.ts` (`ResultadoViagem.lembranca`),
`engine/mundo.ts`, `engine/llm.ts`, `engine/index.ts`,
`engine/campanhaLonga.ts`, `ui/store.ts`, `ui/screens/Paineis.tsx`,
`package.json`.

### Verificações
- `diretor.selftest.ts`:
  - memória:
    - no mesmo dia do feito, nada; em outra cidade, nada;
    - ao voltar, a linha com o texto do fato, uma vez só;
    - a linha está no pacote do narrador e na crônica; a tela a consome uma vez;
    - fato não público não é comentado;
    - pelo caminho real (`viajar` ida e volta), a obra-prima é lembrada.
  - missões:
    - cumprida e compromisso falhado têm o jogador como ator; resolvida por
      outros, não;
    - a crônica do jogador sai em ordem.
  - diretor:
    - mensageiro a um dia do prazo; nenhum segundo gancho no mesmo dia nem
      dentro do intervalo;
    - não consome o RNG da campanha;
    - capitão caçador e casa por um fio aparecem em 30 dias; cada gancho aponta
      para estado que existe; nunca dois no intervalo; alvo sem repetir antes
      de 20 dias; fila limitada;
    - save idêntico; cativo sem mensageiro; pedido de ajuda vira conhecido.
- `typecheck`, `test:engine` completo, `test:jornadas`, `test:casas`,
  `vaelhorn_expansao`, `expo export --platform web`: verdes.

Simulação longa depois (`simLongo 10 6`):
```
longa-0    10a  fim_do_prazo nível 31  pop 3846  fome    0d  travas     0  violações 0
longa-1    10a  fim_do_prazo nível 29  pop 4123  fome    0d  travas     0  violações 0
longa-2    10a  fim_do_prazo nível 31  pop 4283  fome    0d  travas     0  violações 0
longa-3    10a  fim_do_prazo nível 28  pop 4171  fome    0d  travas     0  violações 0
longa-4    10a  fim_do_prazo nível 29  pop 3656  fome    0d  travas     0  violações 0
longa-5    10a  fim_do_prazo nível 34  pop 4134  fome    0d  travas     0  violações 0
```
Médias: nível 30,3; população 4.036; derrotas 18,3; dias-cidade em fome 517;
0 mortes. Diretor: 246,7 ganchos por campanha de 10 anos (um a cada ~15
dias); 146 lembranças por campanha. Esta fase não mexe em combate nem em
economia; a variação de nível, população e derrotas contra a sessão 52 está
dentro da dispersão entre sementes (nas sessões 50 a 52 as derrotas foram
19,8, 18,7 e 15,5).

### Problemas e decisões em aberto
- A lembrança só sai na chegada sem emboscada, e um feito por chegada: quem
  fez muito num lugar recebe as lembranças aos poucos, uma por volta.
- Os ganchos de casa e de capitão reaparecem a cada 20 dias enquanto o
  estado durar. Se no celular parecer repetitivo, suba
  `DIAS_PARA_REPETIR_ALVO` em `engine/diretor.ts`.
- O texto da lembrança reaproveita o texto do fato. Os fatos antigos do jogo
  foram escritos para o log e alguns soam secos depois do prefixo.

### Próximo passo
O dono pediu nesta sessão: procurar erros e coisas não ligadas no jogo, e
depois aprofundar história (casas, cidades, armas lendárias, bestiário,
personagens). Fase 9 (quebrar arquivos gigantes) fica para depois disso.

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
