# ADR-003 — Companheiros persistentes, não invocações descartáveis

Status: aceito

## Contexto

Personagens canônicos precisam agir segundo suas técnicas, viajar com o protagonista e sofrer consequências reais. Criar uma cópia temporária no combate quebraria a continuidade: o aliado poderia cair numa luta e reaparecer saudável na cena seguinte, ou participar ao mesmo tempo de um duelo distante.

## Decisão

- A campanha guarda no máximo dois IDs em `grupo`.
- Só um combatente vivo, presente e com confiança ou reputação suficiente pode entrar.
- Enquanto está no grupo, o NPC é considerado presente no local do protagonista e deixa de ser elegível para duelos e baixas de guerra em segundo plano.
- O ator de combate referencia o NPC por `npcId`; vida, morte e saída do grupo voltam ao `npcState`.
- Cada perfil canônico informa atributos, técnicas, uso de Nichirin e papel de suporte. O turno automático usa as mesmas definições de técnicas do jogador.
- Ferimentos persistem depois da batalha e recuperam lentamente quando os dias passam.

## Consequências

O aliado deixa de ser apenas texto ou bônus numérico: pode decidir um combate, carregar feridas e morrer definitivamente. A simulação também precisa respeitar a localização derivada do grupo em todos os sistemas futuros que possam deslocar ou matar NPCs.

