# ARCANUM

RPG narrativo por navegação estruturada. **A engine é dona da verdade; o modelo é dono da voz.**

Este repositório é uma **fatia vertical jogável** do [Game Design Document](GDD.md) — o cenário **Vaelhorn**, rodando 100% offline, empacotado como app Android (APK).

---

## Baixar e instalar no celular (APK)

O APK é compilado automaticamente pelo GitHub Actions a cada push, **sem exigir nenhuma conta externa**.

1. Vá em **Releases** (ou na aba **Actions → build mais recente → Artifacts**).
2. Baixe o arquivo `arcanum-*.apk` no celular.
3. Abra e permita **"instalar de fontes desconhecidas"**.
4. Abra o ARCANUM. Ele roda offline.

Para narração ao vivo por IA, cole **sua própria** chave da API da Anthropic em **Configurações** (a chave nunca é embutida no app).

---

## O que está implementado

Seguindo o §41 do GDD ("não comece pela UI; comece pela engine + verbos + simulador"):

### A engine (`engine/`, TypeScript puro, zero dependência de UI)
- **Tempo** em períodos, custo exibido como horário de chegada, calendário por evento+estação (§1).
- **Resolução sem dados**: curva logística, cinco graus, dano por dispersão (§2). Valida contra a tabela do GDD.
- **RNG determinístico** com semente + cursor — save/load honesto e replay (§2.5).
- **Personagem**: 6 posições de atributo, recursos, pressões, derivados (§3).
- **Verbos**: catálogo como dado + motor de disponibilidade (privacidade, testemunhas, requisitos) e a regra "nunca esconder, sempre explicar" (§4, §8).
- **Impulsos** que crescem, penalizam e destacam verbos (§5).
- **Narração canônica de fallback** (P0, §20) + camada de IA opcional sob contrato (Parte V).

### Conteúdo de Vaelhorn (`content/vaelhorn/`)
- 3 classes · 3 origens · 1 região com 6 locais e rotas · 12 NPCs com rotina, memória e segredos.
- ~41 verbos universais + 6 arcanos + verbos concedidos por item (arrombar, envenenar, tocar).
- **Catálogo de ~55 itens**: armas (corpo e distância, com dano), armaduras e escudos (com defesa), acessórios, poções e comida (consumíveis com efeito), ferramentas e materiais.
- **Equipamento** (arma/armadura/escudo/acessório afetam os derivados), **loja** (comprar/vender com barganha), itens que geram verbos (§13.6).
- O Livro: 4 mestres · 6 trabalhos · **~38 artes** · 8 relíquias (incl. 2 Únicas com dono e 1 Perdida).

### App (`App.tsx`, `ui/`) — Expo / React Native
Identidade visual única do §30 (paleta de manuscrito, Cormorant + IBM Plex Mono).
Telas: entrada, aviso 17+, escolha de cenário/classe/origem, criação, cena com as **três portas**
(cena · menu de ações · ação livre), Livro, mapa e viagem, ficha, **inventário/equipamento**, **loja**,
vínculos, crônica, fim de capítulo (paywall diegético), configurações (IA por OpenRouter/Anthropic).

### Narração por IA (opcional)
Padrão **OpenRouter** (compatível com OpenAI), com modelos gratuitos e sem filtro para ficção adulta
entre personagens adultos. Anthropic também é suportado. A chave fica só no aparelho; sem chave, o
jogo usa a narração canônica de fallback (§20). A única regra travada no prompt é que todos os
personagens são 18+.

---

## Rodar em desenvolvimento

```bash
npm install
npm start            # Expo dev server (Expo Go ou build nativo)

npm run typecheck    # tsc --noEmit
npm run test:engine  # autoteste da engine
npm run sim -- 20000 # simulador headless (§41): distribuições + teste de agência
```

O simulador confirma que a resolução bate com a tabela do GDD e que dá para jogar
20 períodos **só pelo menu de ações** (o teste de agência do §40).

---

## Arquitetura vs. GDD

| GDD | Aqui |
|---|---|
| Engine dona da verdade (§33) | `engine/` puro, testável em Node |
| Cliente envia intenção, servidor resolve (§35) | No MVP a engine roda no dispositivo (offline-first); a fronteira `{verbo, alvo}` → estado novo está preservada em `engine/turn.ts` |
| Chave de IA só no servidor (§36) | A chave fica no aparelho e vai direto à Anthropic; nunca embutida no APK |
| Fallback canônico é P0 (§20) | Narração funciona 100% sem rede |

## Fora do escopo desta fatia (roadmap do GDD)

Os outros 8 cenários · as 64 telas completas · combate com chefes por fases · Supabase/auth/pagamento
(Stripe/Pix) · modo Legado · boato completo · cronograma do mundo. A engine já foi desenhada para
que um cenário novo toque **apenas** na "coluna direita" (§6.1).
