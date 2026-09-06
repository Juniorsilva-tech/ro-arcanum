# ADR-001: Estado causal persistente para mundo e inimigos

## Status

Aceito.

## Contexto

ARCANUM é um jogo local de campanha longa. Encontros, rumores, missões, guerras e destruição precisam descrever o mesmo acontecimento. O save atual já serializa a campanha inteira e a engine usa RNG determinístico.

## Decisão

Manter um livro-razão compacto dentro da campanha:

- `kimetsu.rivais` guarda identidade, vida, local e memória de cada oni encontrado;
- `continuidade.ameacas` liga um rival a uma comunidade, prazo e consequência;
- `continuidade.locais` guarda integridade, população e progresso de obra;
- `mundo.faccoes` e `mundo.guerraAtiva` guardam recursos, moral, baixas e uma frente física.

A narração recebe cópias desse estado, mas somente a engine pode alterá-lo.

## Consequências

Uma morte única não pode reaparecer, fugir preserva o rival, uma ameaça ignorada danifica a comunidade e uma guerra distante não recompensa o protagonista. O custo aceito é uma migração explícita sempre que o formato desses estados mudar.
