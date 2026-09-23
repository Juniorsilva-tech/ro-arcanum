# RO ARCANUM — ESPECIFICAÇÃO DE EXPANSÃO: TSUKIMICHI & TRANSCENDÊNCIA

> Este documento é a **fonte de verdade permanente** para a integração ontológica, mecânica e geográfica do universo de *Tsukimichi (Moonlit Fantasy)* e da escala ascendente de *Demon Slayer* na engine de RO ARCANUM.

---

## 1. O FRAMEWORK COSMOLÓGICO & O MAPA-MUNDO

O cosmos de RO ARCANUM é estruturado em dois hemisférios/continentes geográficos e uma dimensão subespacial autônoma, conectados por fendas místicas e portais de névoa:

```
                      ┌─────────────────────────────────────────┐
                      │          SUBESPAÇO DE ASORA             │
                      │  (Assentamento Soberano & Círculo)      │
                      └────────────────────┬────────────────────┘
                                           │ ▲ [Mist Gate / Portal de Névoa]
                                           ▼ │
┌──────────────────────────────────────────┴──┐     ┌────────────────────────────────────────┐
│      CONTINENTE A: HALVERN / VAELHORN       │     │     CONTINENTE B: O NOVO MUNDO         │
│      (Território Feudal / Caçadores / Onis) │     │     (A Deusa / Tsige / Wasteland)      │
├─────────────────────────────────────────────┤     ├────────────────────────────────────────┤
│ • Vale de Halvet (Taverna, Praça da Forca)  │     │ • Fronteira de Tsige (Cidade Mercantil)│
│ • Província de Tessel (Fortaleza Marcial)   │     │ • Grande Terra Desolada (Wasteland)    │
│ • Planalto de Corveira & Costa de Mareu     │     │ • Academia de Rotsgard (Centro Arcano) │
│ • Mansão Ubuyashiki & Castelo Infinito      │     │ • Desfiladeiro do Dragão Adormecido    │
│ • Ermo de Solgar (Fim do Mapa) ──[Fenda/Caravana dos Ermos]──► Vale de Entrada de Tsige    │
└─────────────────────────────────────────────┘     └────────────────────────────────────────┘
```

### 1.1 Conexões de Trânsito:
1. **Rota Terrestre dos Ermos (Ermo de Solgar -> Tsige):**
   * Travessia transcontinental longa e árdua (4-6 períodos). Exige suprimentos e teste de sobrevivência contra bandidos da fronteira e bestas.
2. **Portais de Névoa (Mist Gates):**
   * Concedidos por Tomoe/Komoe após estabelecer pacto ou aliança. Trânsito instantâneo entre entrepostos marcados e o Subespaço de Asora.

---

## 2. MECÂNICA DE ASSENTAMENTO NO SUBESPAÇO: ASORA

A mecânica de assentamento da engine (`camp.continuidade.locais`) é expandida para suportar a **soberania de Asora**, funcionando como um santuário multirracial vivo que cresce em infraestrutura, população e território.

### 2.1 Especializações de Setores por Raças
* **Terras Agrícolas dos Orcs de Highland (Lideradas por Ema):**
  * Produção de alimentos de altíssimo rendimento (cereais, frutas de Asora).
  * Zera o risco de fome na dimensão e abastece as caravanas comerciais da Companhia Kuzunoha.
* **Complexo de Forjas dos Anões Anciãos (Liderado por Beren):**
  * Engenharia metalúrgica lendária.
  * Forja os anéis Draupnir (capacitores de compressão), katanas de grau mítico e armaduras resistentes a dano elemental.
* **Campos de Treino dos Mist Lizards:**
  * Infantaria marcial disciplinada.
  * Protegem as fronteiras de Asora e atuam como escoltas armadas para missões no mundo exterior.
* **Ateliê Arcano das Alkes (Aranhas de Mio):**
  * Produção de Seda de Aranha Arcana. Confecção de mantos e tecidos imunes a cortes e chamas.
* **Santuário Shinto & Fontes Termais (Onsen):**
  * Gerenciado por Tamaki. Local de descanso, purificação de pressões corporais e rituais sagrados.

### 2.2 Crescimento e Obras em Asora
* A integridade, nível de expansão territorial e população de Asora escalam com:
  1. A mana/vitalidade máxima do jogador.
  2. Recursos investidos (madeira de Vintra, minérios de Corveira, pedras da Wasteland).
  3. Resgate e acolhimento de novas raças marginalizadas pela Deusa.

---

## 3. O SISTEMA DE CONTRATOS DE ALMA (SOUL BINDING)

O jogador pode subjugar, persuadir ou pactuar com entidades colossais milenares, integrando-as ao seu Círculo Central.

### 3.1 As Duas Portas de Pacto
* **Porta da Força Bruta (Caminho Overpower):**
  * Reduzir os pontos de vida da criatura a zero em combate e sobrepujar sua aura pelo peso da presença/mana do jogador.
* **Porta da Astúcia / Intelecto (Caminho da Esperteza):**
  * Saciar fraquezas insaciáveis (ex: pratos arcanos lendários para saciar a Aranha da Calamidade).
  * Vencer jogos intelectuais (desafios de Shogi/enigmas para o Dragão das Névoas).
  * Destruir correntes ou quebrar maldições impostas por outros deuses.

### 3.2 Proporções de Contrato
* **Contrato Mestre-Servo (2:8):**
  * Submissão voluntária ou imposta. O jogador absorve 20% dos atributos intrínsecos e resistências da entidade. Lealdade absoluta.
* **Contrato Estabilizado (1:9):**
  * Para entidades de base inferior que seriam incineradas pela densidade do jogador. Exige catalisadores de contenção (Draupnir).
* **Pacto Paritário (5:5):**
  * Aliança de sangue entre iguais.

### 3.3 Transmutação Humanoide
* Ao firmar o contrato, a entidade assume uma forma humanoide refinada de acordo com as preferências do Mestre.
* O jogador concede um nome oficial que consolida a forma e os poderes do servo.

---

## 4. O CÍRCULO CENTRAL & DINÂMICA DE HARÉM FUNCIONAL

As servas de contrato não são enfeites passivos; são potências militares e conselheiras com personalidades ricas e eixos de relacionamento dinâmicos:

* **Eixos Ativos:** `afeto`, `confiança`, `devoção`, `ciúme`, `tensão`.
* **Competição de Atenção:**
  * Disputa pelo cargo de guarda-costas noturna.
  * Preparação de pratos gastronômicos que concedem buffs ao mestre.
  * Criação de presentes lendários (armas, quimonos encantados).
* **Intervenção Tática:**
  * Em combates mortais, servas no grupo podem se jogar à frente de golpes fatais (Escudo de Mio) ou distorcer o espaço para retirar o mestre de emboscadas (Névoa de Tomoe).

---

## 5. A CURVA DE PODER: DO ESTRATEGISTA AO DEUS ONIPOTENTE

O sistema suporta organicamente os dois estilos de jogo:

### 5.1 O Estrategista Sagaz (Early / Mid Game)
* Uso cirúrgico de venenos de glicínia, fraquezas de terreno e emboscadas com materiais anões.
* Comércio tático via Companhia Kuzunoha: desestabilização de monopólios vendendo a preço de cobre para forçar nobres e mercadores hyumans à submissão econômica.
* Vitórias sobre oponentes de patamar superior mediante preparação minuciosa.

### 5.2 O Ápice Overpower (Late Game / Transcendente)
* **Domínio Perceptivo / Sakai:** Visão transparente de órgãos, músculos e pontos vitais. Imunidade à evasão inimiga.
* **Lâmina Carmesim:** Anulação permanente de regeneração demoníaca por superaquecimento.
* **Aura de Presença:** Inimigos fracos e tropas comuns sofrem colapso de moral imediato ao entrar no combate, desmaiando ou fugindo sem necessidade de golpear.
* **13ª Forma Solar Contínua:** Dança ininterrupta que escala o dano a cada golpe, fatiando montanhas e destruindo exércitos.

---

## 6. ENTIDADES CANÔNICAS CONTRATÁVEIS PREVISTAS

1. **Tomoe (Shin / Dragão Superior das Névoas):**
   * Especialista em ilusões absolutas, controle espacial, criação de Asora e rede de espionagem.
2. **Mio (Aranha Negra da Calamidade):**
   * Regeneração invulnerável, absorção de magias elementais, teias de contenção e culinária japonesa.
3. **Shiki (Larva / O Lich):**
   * Domínio dos 13 Passos, magia arcana analítica, gestão burocrática e docência.
4. **Tamaki (Touda / General das Chamas):**
   * Chamas infernais, combate marcial com múltiplas armas e sentinela espiritual anti-deusa.
## 7. DEMOGRAFIA, REINOS HYUMANS E CIDADES MULTIRRACIAIS (O MUNDO ISEKAI)

O continente de Tsukimichi (Novo Mundo) opera sob a estrutura clássica e viva de Alta Fantasia Isekai, com segregação territorial estrita entre os reinos protegidos da Deusa e os assentamentos das raças marginalizadas:

### 7.1 Os Grandes Reinos e Cidades Hyumans
Os Hyumans habitam as terras férteis do centro e sul do continente, protegidos por barreiras divinas contra os miasmas da Wasteland:
1. **As Quatro Grandes Nações:**
   * **Império de Gritonia (Norte Militarista):** Estado expansionista e aristocrático, dependente de força mágica e magitec antiga.
   * **Reino de Limia (Oeste Feudal / Nobreza Tradicional):** O mais populoso reino hyuman, governado por linhagens reais e cavalaria sagrada.
   * **Reino de Aion (Sul Comercial):** Nação mercantil instável, da qual a cidade fronteiriça de Tsige é formalmente vassala (lutando pela independência sob a influência da Companhia Kuzunoha).
   * **Academia Central de Rotsgard:** Cidade-estado neutra voltada para formação de magos, guildas e festivais de combate.
2. **Infraestrutura Hyuman:**
   * Guildas de Aventureiros oficiais (sistema de ranks e cartões de aventureiro de Root).
   * Muralhas mágicas repelentes de monstros e templos dedicados ao culto estético da Deusa.

### 7.2 Assentamentos e Cidades das Raças Demi-Humanas
Fora do manto da Deusa (nas franjas do deserto, montanhas e florestas densas), florescem sociedades autônomas:
1. **Cidades e Enclaves de Orcs de Highland:**
   * Vilarejos fortificados de madeira e terraço agrícola, focados em pecuária e colheita massiva.
2. **Colônias Subterrâneas dos Anões Anciãos (Elder Dwarves):**
   * Cidades encravadas no interior de vulcões e minas profundas, ricas em forjas rúnicas e fundição de mithril e oricalco.
3. **Pântanos e Assentamentos Fluviais dos Mist Lizards:**
   * Cidades sobre palafitas e cavernas alagadas, com guerreiros reptilianos treinados em lanças e xamanismo aquático.
4. **Enclaves dos Forest Ogres e Elfos Silvestres:**
   * Comunidades ocultas na copa das árvores, especializadas em alquimia botânica, venenos e arquearia mágica.
5. **O Território dos Demônios:**
   * Nações organizadas com castelos de pedra negra e gelo no extremo norte, impulsionadas pelo imperativo militar de sobrevivência contra o preconceito hyuman.

### 7.3 Dinâmica de Conflito e Economia
* **Tensões Raciais Reais:** Hyumans não aceitam demi-humanos em suas cidades a menos que estejam sob disfarce ou contratos mercantis pesados.
* **A Companhia Kuzunoha como Ponte:** A empresa do jogador/Makoto atua como o único polo neutro capaz de transitar mercadorias lendárias forjadas pelos anões e plantadas pelos orcs diretamente para os mercados hyumans, quebrando o isolamento econômico.
## 8. ECOLOGIA DE BESTAS, MONSTROS DA WASTELAND & ENTIDADES CALAMITOSAS (BESTIÁRIO DO NOVO MUNDO)

A ecologia do Novo Mundo é estratificada entre a fauna comum dos reinos e as anomalias imensuráveis da Terra Desolada:

### 8.1 Monstros Menores & Fauna de Progressão (XP & Manufatura)
Criaturas que habitam as bordas das cidades e as rotas dos ermos, servindo para acumulação de experiência, suprimentos de forja e carnes para Asora:
* **Lobos de Chifre (*Horned Wolves*):** Predadores rápidos em matilha. Fornecem peles reforçadas e presas para entalhes básicos.
* **Javalis de Carapaça de Rocha (*Ironhide Boars*):** Bestas brutas de carga. Sua carne sustenta banquetes e seu couro serve para armaduras de batedores.
* **Insetos Blindados da Wasteland (*Sand Crawlers*):** Fonte primária de quitina ultrarresistente para os Anões Anciãos e glândulas de ácido para alquimia.
* **Aves Tempestuosas (*Thunder Raptors*):** Habitam desfiladeiros e penhascos. Concedem penas condutoras de eletricidade e núcleos de mana de vento.
* **Golens de Pedra e Miasma:** Guardiões abandonados de civilizações destruídas pela Deusa, ideais para treino de impacto e mineração de gemas brutas.

### 8.2 As Bestas Calamitosas Imensuráveis (Entidades Primordiais Contratáveis)
Assim como *Tomoe* (Dragão das Névoas) e *Mio* (Aranha da Calamidade), existem outras entidades de poder avassalador que vagam pelos confins do mundo. Todas as entidades elegíveis para o **Pacto de Alma e Círculo Central são fêmeas**, assumindo formas humanoides femininas refinadas, leais e distintas após a vinculação:

1. **A Serpente Abissal dos Mares de Névoa (Leviatã / Mizuchi Ancestral):**
   * **Forma Monstruosa:** Uma serpente dragão aquática colossal que controla correntes oceânicas e tsunamis arcanos.
   * **Transmutação Humanoide:** Uma nobre guerreira de vestes azul-índigo, portando uma lança de gelo vivo. Personalidade altiva, reservada e protetora das águas de Asora.
2. **O Pássaro do Fogo Primordial (Suzaku / Fênix Carmesim):**
   * **Forma Monstruosa:** Pássaro de chamas douradas que incinera o solo por onde sobrevoa e renasce das cinzas.
   * **Transmutação Humanoide:** Uma dama radiante de quimono carmesim com temperamento apaixonado, ciumento e impetuoso.
3. **A Rainha das Geleiras do Norte (Espírito Titânico do Gelo):**
   * **Forma Monstruosa:** Uma nevasca viva em forma de leoa glacial gigante que congela exércitos inteiros com um rugido.
   * **Transmutação Humanoide:** Uma espadachim de cabelos prateados, elegante, fria com estranhos e devota apenas ao calor do Mestre.
4. **A Kitsune das Nove Chamas (General Touda / Tamaki):**
   * Raposa divina com domínio sobre ilusões espirituais, maldições e o submundo.

### 8.3 Diretriz Demográfica dos Personagens Centrais
* **Círculo de Companheiras e Contratos:** Exclusivamente personagens femininas nas posições de servas contratuais, generais de Asora, conselheiras íntimas e harém do protagonista.
* **Papel dos Homens no Mundo:** Restritos a papéis funcionais e de suporte pragmático sem dinâmica de intimidade (ex: mestre artesão Beren, batedor de campo Lime Latte, comerciantes rivais, generais hyumans e líderes inimigos a serem derrotados).

### 8.4 Integração Sistêmica com a Engine de RO ARCANUM
A "DLC" de Tsukimichi não substitui nem reseta a engine existente; ela atua como uma **expansão vertical e horizontal dos sistemas consolidados**:
* **Combate da Engine:** Herdado integralmente. Bestas de Tsukimichi usam o mesmo sistema determinístico sem dados, incorporando as resistências e o ciclo tático de fases.
* **Calendário & Tempo:** Os 6 períodos do dia e as 4 estações regem as colheitas de Asora e o comportamento das bestas da Wasteland.
* **Economia & Itens:** As moedas e materiais integram-se com os arsenais forjados pelos Elder Dwarves e poções da Companhia Kuzunoha.
* **O Livro (Grimório):** Novas escolas de artes elementais (magias de criação de Asora, técnicas de névoa e feitiços de linhagem).
