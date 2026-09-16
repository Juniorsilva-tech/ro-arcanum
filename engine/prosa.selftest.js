"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ARCANUM · Quem falou é quem a tela diz que falou.
//
// Esta suíte nasceu de um bug visto em jogo, num print do dono: numa conversa
// de taverna, o rótulo ELZA apareceu em cima de uma fala do JOGADOR e o rótulo
// do jogador em cima da fala da taverneira. Duas réplicas de pessoas
// diferentes vieram ainda por cima grudadas num bloco só.
//
// Errar aqui não é um defeito de tipografia. É a tela mentindo sobre o que
// aconteceu na ficção — e num jogo onde a engine é dona da verdade, é o pior
// defeito possível.
//
// A cena do print está reproduzida literalmente abaixo e é o teste principal.
const prosa_1 = require("./prosa");
const ok = (v, mensagem) => {
    if (!v)
        throw new Error(mensagem);
    console.log(`✓ ${mensagem}`);
};
const falasDe = (bruto, nomes, jogador) => (0, prosa_1.emBlocos)(bruto, nomes, jogador).filter((b) => b.tipo === 'fala');
// A cena do print, palavra por palavra.
const CENA_DA_TAVERNA = [
    'sai. Elza te olha da beirada do balcão, os olhos inquietos de quem busca um rosto conhecido e só encontra o seu.',
    '',
    '— Está aberto, então? você pergunta.',
    '',
    'Ela demora um instante olhando para você, avaliando se a pergunta é só de fome ou se é de algum outro jeito mais fundo. Então aponta com o queixo a mesa mais próxima à lareira.',
    '',
    '— Tá. Senta aí que eu trago.',
    '',
    'Você se senta de frente para o salão, vê a mulher encapuzada sozinha no canto — e, quando Elza volta com o pão e a caneca, você tenta um elogio. Agradece o pão, a mão boa dela, o pãozinho branco que ela guarda no cabelo. Ela segura um sorriso.',
    '',
    '— Freguês novo é sempre bom de língua. Isso passa.',
    '',
    'Ela não levanta os olhos do pano que limpa a mesa.',
    '',
    '— Você não é daqui.\n— Não. Passei a ponte ontem.',
    '',
    'Ela olha para cima, então. Franze a testa.',
].join('\n');
// ── Camada zero: o marcador explícito decide sozinho ──────────────────────
//
// É a única camada que não adivinha. O narrador é obrigado a marcar cada fala
// (ver o prompt em engine/llm.ts); quando o marcador vem, nada mais opina.
{
    const cena = CENA_DA_TAVERNA
        .replace('— Está aberto, então? você pergunta.', '— [você] Está aberto, então?')
        .replace('— Tá. Senta aí que eu trago.', '— [Elza] Tá. Senta aí que eu trago.')
        .replace('— Freguês novo é sempre bom de língua. Isso passa.', '— [Elza] Freguês novo é sempre bom de língua. Isso passa.')
        .replace('— Você não é daqui.\n— Não. Passei a ponte ontem.', '— [Elza] Você não é daqui.\n— [você] Não. Passei a ponte ontem.');
    const falas = falasDe(cena, ['Elza', 'Vess'], 'Andarilho');
    const esperado = ['Andarilho', 'Elza', 'Elza', 'Elza', 'Andarilho'];
    ok(falas.length === esperado.length, `A cena rende ${esperado.length} falas separadas (${falas.length})`);
    falas.forEach((f, i) => {
        ok(f.quem === esperado[i], `Fala ${i + 1} é de ${esperado[i]} ("${f.texto.slice(0, 32)}…")`);
    });
    ok(!falas.some(f => f.texto.includes('[')), 'O marcador some do texto que aparece na tela');
}
// ── O marcador vence qualquer pista contrária ─────────────────────────────
{
    // Prosa ao redor cheia de "Elza", tag de terceira pessoa dizendo Elza, e o
    // marcador dizendo que é o jogador. O marcador ganha.
    const cena = 'Elza limpa o balcão.\n\n— [você] Isso é meu — diz Elza.\n\nElza suspira.';
    const [f] = falasDe(cena, ['Elza'], 'Andarilho');
    ok(f.quem === 'Andarilho', 'Marcador explícito vence tag e proximidade');
}
// ── Marcador inventado não cria gente do nada ─────────────────────────────
{
    const cena = '— [a mulher encapuzada] Não me siga.';
    const [f] = falasDe(cena, ['Elza'], 'Andarilho');
    ok(f.quem !== 'a mulher encapuzada', 'Nome fora do elenco não vira dono da fala');
    ok(f.texto === 'Não me siga.', 'Mas o marcador é removido do texto mesmo assim');
}
// ── Sem marcador: a rede de segurança ─────────────────────────────────────
//
// Modelo pequeno ignora formato. As heurísticas não precisam ser perfeitas —
// precisam acertar o que dá para saber com certeza. As duas certezas aqui são
// a assinatura em segunda pessoa e a separação das réplicas.
{
    const falas = falasDe(CENA_DA_TAVERNA, ['Elza', 'Vess'], 'Andarilho');
    ok(falas.length === 5, `Duas réplicas grudadas viram dois blocos (${falas.length} falas)`);
    // A que mais importa: o texto DIZ que foi o jogador ("você pergunta").
    // Perder esta assinatura era o que invertia a conversa inteira.
    ok(falas[0].quem === 'Andarilho', '"você pergunta" atribui a fala ao jogador, não à NPC citada ao lado');
    ok(falas[0].texto === 'Está aberto, então?', `A marcação do narrador sai do balão ("${falas[0].texto}")`);
    ok(falas[1].quem === 'Elza', 'A resposta seguinte é da taverneira');
    // Fala do jogador narrada em prosa ("você tenta um elogio") gasta o turno
    // dele: a fala citada logo depois é resposta dela.
    ok(falas[2].quem === 'Elza', 'Elogio narrado em prosa não faz a resposta dela virar fala do jogador');
}
// ── Assinatura em segunda pessoa, nas formas que o narrador usa ───────────
{
    for (const linha of [
        '— Então é isso? você pergunta.',
        '— Então é isso — você diz.',
        '— Então é isso, pergunta você.',
        '— Então é isso — murmura você.',
    ]) {
        const [f] = falasDe(`Elza espera.\n\n${linha}`, ['Elza'], 'Andarilho');
        ok(f.quem === 'Andarilho', `"${linha.slice(-22)}" é fala do jogador`);
    }
}
// ── Tag de terceira pessoa continua valendo ───────────────────────────────
{
    const [f] = falasDe('— Não temos pão — disse Aldrica.', ['Aldrica'], 'Andarilho');
    ok(f.quem === 'Aldrica', 'Tag de terceira pessoa segue funcionando');
    ok(!f.texto.includes('disse Aldrica'), `A tag sai do balão ("${f.texto}")`);
}
// ── Vocativo não rouba a fala ─────────────────────────────────────────────
//
// O jogador chamando a NPC pelo nome não faz a NPC ser quem fala.
{
    const [f] = falasDe('— O que você quer, Vess?', ['Vess'], 'Andarilho');
    ok(f.quem !== 'Vess', 'Chamar alguém pelo nome não transfere a fala para essa pessoa');
}
// ── Réplicas grudadas, em todas as formas ─────────────────────────────────
{
    const casos = [
        ['— Uma.\n— Duas.', 2],
        ['— Uma.\n— Duas.\n— Três.', 3],
        ['— Uma.\nfrase solta de narração.\n— Duas.', 2],
    ];
    for (const [bruto, esperado] of casos) {
        const falas = falasDe(`Prosa antes.\n\n${bruto}\n\nProsa depois.`, ['Elza'], 'Andarilho');
        ok(falas.length === esperado, `"${bruto.replace(/\n/g, ' | ')}" vira ${esperado} falas (${falas.length})`);
    }
}
// ── Nada de fala não vira fala ────────────────────────────────────────────
{
    const blocos = (0, prosa_1.emBlocos)('Só narração aqui. Sem ninguém falando.', ['Elza'], 'Andarilho');
    ok(blocos.every(b => b.tipo === 'prosa'), 'Texto sem fala continua sendo prosa');
    ok((0, prosa_1.emBlocos)('', [], 'X').length === 0, 'Texto vazio não produz bloco');
}
console.log('\nProsa: a tela não mente sobre quem falou.');
