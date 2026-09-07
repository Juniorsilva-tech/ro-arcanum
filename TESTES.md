# Cobertura de testes — PC

`npm run test:jornadas` (incluído em test:all): 114 combinações de local/horário,
45.600 sorteios de encontro com filtro solar, seis tipos de missão oferecida/aceita
com prazo, duplicata, save e pagamento idempotente. Quatro tipos também executam
aceitar/ajudar pelo painel real da engine, verificando custo e efeito. Fixtures
de recursos/estado, não jornadas naturais completas; sorteios excluem Nemesis.

Sessão 12: mais 24.000 sorteios contextuais, oito sementes por cenário, estrada
noturna/perigo 5, um sorteio por dia. Paz: 167/8.000 com oni; ameaça: 910/8.000;
investigação aceita: 1.321/8.000. Verifica ordenação das frequências, intervalo
de respiro, filtro solar e save. Cenários de ameaça/investigação mantidos como
fixtures: não significam uma missão ativa por mil dias no jogo real.

Execute `npm run test:all` para verificação estática, oito suítes, campanhas
exploratórias e por objetivos, simulador curto, balanço e exportação web.
Falhas de asserção interrompem o comando. O balanço é diagnóstico: faixa fora
do alvo é impressa, mas não falha o processo. Não interpretar exit 0 como
equilíbrio perfeito ou cobertura de 100%.

## Matriz por sistema

| Sistema | Evidência automatizada | Limite restante |
|---|---|---|
| RNG, resolução, atributos, tempo | selftest, sim, campanhas | Não mede todas as combinações |
| Criação, nascimento, família, resgate | familia.selftest, campanhas | Infâncias e famílias não são exaustivas |
| Aptidão, maestria, fama, sigilo | aptidao.selftest | Comportamento narrativo remoto não testado |
| Itens, compra, estoque, equipamento | selftest, sistemas.selftest | Aquisição natural de Nichirin em campanha ainda falta |
| Combate e bestiário inteiro | sistemas.selftest: 70 criaturas × 4 sementes | Perfil único nível 25; não mede taxa de vitória de todos os perfis |
| Onis, sol, técnicas e regras de morte | kimetsu.selftest, catálogo inteiro | Catálogo inteiro usa ataques simples, não todas as formas do jogador |
| Grupo e combate aliado | kimetsu.selftest, sistemas.selftest | Falta política longitudinal com recrutamento natural |
| Formação e progressão de NPC | causal.selftest, expansao.selftest | Nem toda profissão possui trajetória |
| Cidades, estoques, construção, seca | sistemas.selftest, assentamentos.selftest, campanhas | Fundação de cidade nova ainda não existe; ano civil controlado isola produção |
| Política, liderança, guerra | sistemas.selftest, familia.selftest, campanhas | Nem todos os desfechos diplomáticos são testados isoladamente |
| Missões, prazos, pagamento, planejamento | causal.selftest, duas políticas longas | Atribuição de morte por autor e algumas mudanças de alvo ainda requerem regressões |
| Nemesis, pistas, recuperação, morte | causal.selftest, kimetsu.selftest, campanhas | Falta testar toda combinação de rede/objetivo pessoal |
| Ascensão/CHIM | sistemas.selftest | Fixtures de requisitos; não é trajetória natural até ascensão |
| Despertar/legados | expansao.selftest | Marca/pacto/linhagem completos não implementados |
| Persistência | causal e sistemas: JSON completo em combate, idempotência | Loop longo compara resumo; navegador/armazenamento real não exercitado |
| Disponibilidade, verbos, magia, quests | selftest, familia, kimetsu, campanhas | Não garante cada verbo/arte em todos os estados |
| Memória, convivência, despojos, ritmo, risco, grade | selftest e integração de campanhas | Cobertura parcial; não há medição de branches |
| Narrativa, prosa, contexto e validação | selftest, aptidao.selftest, assentamentos.selftest | Sem chamada de modelo externo; filtragem de fatos não prova fidelidade da prosa |
| Fusão e duelos de fundo | sistemas.selftest: criação, limite, save e 10.000 resoluções de duelo | Falta matriz completa dos efeitos de duelos no mundo |
| Interface PC, botões, áudio, erros e acessibilidade | Build web | Build NÃO é teste visual/E2E |

## Natureza dos novos cenários

`sistemas.selftest.ts` prepara dinheiro, nível, confiança e posições como fixtures.
Compra, estoque, equipamento, recrutamento, combate e save usam funções reais.
Não alegar que o bot conquistou esses recursos jogando desde o nascimento.
As condições de vitória NÃO são impostas: exige desfecho válido dentro do limite,
vida finita e grupo com limite respeitado, não vitória obrigatória.

## Próximas lacunas importantes

1. Campanha especializada com obtenção real de Nichirin e recrutamento/preparo.
2. Save completo ao longo de anos, com diferenças de migração classificadas.
3. E2E no navegador com armazenamento real e retorno após fechar/reabrir.
4. Cobertura de linhas/branches e regressões dedicadas em fusão/duelos/narração.

Esta matriz descreve cobertura de cenários, não porcentagens de cobertura do código.

## Contexto orgânico — sessão 10

`assentamentos.selftest.ts` agora inclui 17 verificações adicionais (76 no total):
prioridade familiar sobre recência, teto de fatos, causa oculta, separação de rumor,
primeira visita sem passado inventado, diferenças de edifícios/tempo, atmosfera
dinâmica, pureza, persistência, atualização da referência, vozes por NPC, viagem
negada e viagem real. Pedido HTTP capturado com fetch simulado comprova envio do
contrato e ausência da ordem de sucesso automático. Não chama modelo externo
nem comprova qualidade da prosa produzida por ele.
