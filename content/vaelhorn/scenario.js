"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vaelhorn = void 0;
exports.vaelhorn = {
    id: 'vaelhorn',
    nome: 'Vaelhorn',
    genero: 'Medieval sombrio',
    ancoraCalendario: 'desde que a ponte caiu',
    nomesAtributos: {
        fisico: 'Força',
        precisao: 'Destreza',
        resiliencia: 'Constituição',
        raciocinio: 'Inteligência',
        percepcao: 'Sabedoria',
        social: 'Carisma',
    },
    recursos: [
        { id: 'mana', nome: 'Mana' },
        { id: 'vigor', nome: 'Vigor' },
    ],
    pressoes: [
        { id: 'sanidade', nome: 'Sanidade', descricao: 'quanto mais alta, mais perto da ruptura da mente' },
        { id: 'corrupcao', nome: 'Corrupção', descricao: 'a mancha que o pacto e o sangue deixam' },
    ],
    eixosRelacao: [
        { id: 'disposicao', nome: 'Disposição' },
        { id: 'confianca', nome: 'Confiança' },
        { id: 'medo', nome: 'Medo' },
    ],
    acentoCor: '#CFA82D', // ouro
    k: 4,
    tabuCentral: 'necromancia e pactos são crime capital',
    premissa: [
        'A LEVA — a verdade que explica tudo neste vale. Quando Mir queimou, o que saiu ' +
            'do fogo não pediu ouro nem sangue: pediu os filhos. Desde então, todo homem ' +
            'nascido em Halvet caminha até a ponte no inverno em que faz dezoito anos, e não ' +
            'volta. Ninguém o obriga. Ele simplesmente vai, como quem lembra de um combinado ' +
            'que nunca fez.',
        'Por isso o vale é das mulheres. Não por decreto e não por virtude: porque foram ' +
            'elas que ficaram. Elas enterraram, herdaram a forja, aprenderam a bater o ferro, ' +
            'a puxar a rede, a cobrar a dívida e a segurar a lança. Toda profissão de Halvet ' +
            'tem nome de mulher porque toda profissão de Halvet passou de mão em mão entre ' +
            'mulheres por três gerações.',
        'Sarine selou sob a capela o que puxa os filhos, e a Leva ficou mais lenta — não ' +
            'parou. A ponte caiu na noite em que o selo rachou pela primeira vez. É por isso ' +
            'que o calendário do vale conta os dias a partir dali.',
        'O JOGADOR é de fora, veio pela estrada do sal, e é homem. Isso não é detalhe: é o ' +
            'acontecimento. Faz anos que nenhum homem adulto dorme duas noites em Halvet. ' +
            'Olham para você com fome, com superstição e com desconfiança, às vezes as três ' +
            'na mesma cara. Metade do vale acha que você quebra o ciclo. A outra metade acha ' +
            'que você o alimenta.',
        'Os inimigos vêm de fora ou vêm de volta: salteadores da estrada, desertores sem ' +
            'nome, e o que a Leva levou e devolveu errado. Esses podem ser homens. A gente do ' +
            'vale, não.',
        'Desejo aqui é assunto de adulto e de escolha. Nenhuma mulher de Halvet deve nada ' +
            'a você, e nenhuma finge o contrário. O que acontece, acontece porque as duas ' +
            'partes quiseram — e o vale comenta no dia seguinte.',
    ],
};
