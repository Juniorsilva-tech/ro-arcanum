# AGENTS.md — RO ARCANUM

## Objetivo

Este projeto é desenvolvido de forma compartilhada entre Claude Code/Opus
e OpenAI Codex.

Os agentes devem colaborar sobre a mesma base de código sem sobrescrever,
reverter ou reconstruir desnecessariamente o trabalho realizado pelo outro.

## Fonte de verdade

O estado atual dos arquivos do projeto é a fonte de verdade.

Antes de modificar qualquer sistema:

1. Leia os arquivos relacionados.
2. Verifique implementações já existentes.
3. Verifique alterações recentes.
4. Não assuma que algo está incompleto apenas porque foi implementado
   por outro agente.
5. Não substitua uma implementação funcional sem uma razão concreta.

## Claude ↔ Codex

Claude e Codex podem trabalhar no mesmo projeto, mas somente UM agente
deve modificar arquivos por vez.

Antes de continuar trabalho iniciado pelo outro agente:

- inspecione o estado atual;
- identifique exatamente o que foi concluído;
- identifique o que ficou incompleto;
- preserve decisões arquiteturais válidas;
- continue do ponto existente em vez de recomeçar.

Nunca reverta silenciosamente trabalho do outro agente.

## Escopo

Não faça refactors grandes fora da tarefa atual.

Não reestruture módulos funcionais apenas por preferência estética.

Mudanças arquiteturais amplas precisam ter benefício concreto para:

- estabilidade;
- performance;
- manutenção;
- consistência do estado;
- qualidade narrativa;
- experiência do jogador.

## RPG e narrativa

RO ARCANUM é um RPG narrativo dirigido por sistemas e IA.

A IA narradora não deve se tornar a fonte de verdade do mundo.

O estado canônico pertence à engine.

Preserve rigorosamente:

- estado do mundo;
- consequências;
- inventário;
- relações;
- NPCs;
- eventos;
- progressão;
- combate;
- memória;
- persistência;
- decisões anteriores do jogador.

A narrativa deve refletir o estado da engine, não inventar alterações
canônicas sem validação.

## Alterações críticas

Tenha cuidado especial ao modificar fluxos que atravessam:

engine → estado → persistência → contexto → LLM → resposta → validação → engine

Antes de alterar esses sistemas, investigue dependências e efeitos colaterais.

## Skills

Use skills instaladas apenas quando forem relevantes para a tarefa.

Não carregue ou aplique uma skill apenas porque ela está disponível.

Se duas skills fornecerem instruções conflitantes, priorize:

1. este AGENTS.md;
2. arquitetura existente do projeto;
3. requisitos da tarefa;
4. skill mais específica para o problema.

## Validação

Antes de declarar uma tarefa concluída, execute as verificações relevantes:

- typecheck;
- testes;
- lint;
- build;
- validações específicas do sistema alterado.

Não continue fazendo alterações depois que a tarefa estiver correta e validada
sem uma razão concreta.

## HANDOFF

Se uma tarefa não puder ser concluída, registre em `HANDOFF.md`:

- objetivo original;
- o que foi concluído;
- arquivos modificados;
- decisões tomadas;
- problemas encontrados;
- testes executados;
- o que falta;
- próximo passo recomendado.

O próximo agente deve ler `HANDOFF.md` antes de continuar trabalho incompleto.

## Finalização

Ao terminar uma tarefa, informe:

- o que foi alterado;
- principais arquivos modificados;
- testes/verificações executados;
- problemas encontrados;
- pendências, se existirem.

Não declare sucesso se testes relevantes estiverem falhando.