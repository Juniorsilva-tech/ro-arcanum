"use strict";
// ARCANUM · Aptidão, maestria e o que o mundo acha de você.
//
// Cinco coisas diferentes que o jogo tratava como uma só. Antes, "prodígio"
// era `genese.marca === 'genio'`, valia +1 em cada atributo e todo mundo já
// nascia sabendo. Aqui elas se separam:
//
//   APTIDÃO   — potencial de aprendizado num domínio. OCULTA. Nunca sai da
//               engine para o narrador nem para NPC nenhum.
//   MAESTRIA  — habilidade que a pessoa de fato tem hoje. Ganha com treino.
//   EXPOSIÇÃO — quanto daquilo já foi demonstrado na frente de alguém.
//   REPUTAÇÃO — o que as pessoas ACREDITAM sobre você naquele domínio. Pode
//               estar errada, para mais ou para menos.
//   FAMA      — até onde essa crença viajou.
//
// Um espadachim excepcional que nunca sacou a lâmina em público tem aptidão
// 96, maestria 80, exposição 0, reputação 0 e fama 0. O mundo não tem como
// saber, e o sistema não deixa ele saber.
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOME_DOMINIO = exports.DOMINIOS = void 0;
/** Domínios de aptidão. Mapeiam o vocabulário de perícias que já existe. */
exports.DOMINIOS = [
    'espada',
    'arcano',
    'estrategia',
    'alquimia',
    'diplomacia',
    'percepcao',
    'medicina',
    'furtividade',
    'oficio',
];
exports.NOME_DOMINIO = {
    espada: 'lâmina',
    arcano: 'arcano',
    estrategia: 'estratégia',
    alquimia: 'alquimia',
    diplomacia: 'diplomacia',
    percepcao: 'percepção',
    medicina: 'medicina',
    furtividade: 'furtividade',
    oficio: 'ofício',
};
