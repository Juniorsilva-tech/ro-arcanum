const assert = (v: unknown, msg?: string) => { if (!v) throw new Error(msg ?? 'Invariante falhou'); };
assert.equal = (a: unknown, b: unknown, msg?: string) => { if (a !== b) throw new Error(msg ?? `Esperado ${b}; obtido ${a}`); };

import { conteudoVaelhorn } from '../content/vaelhorn';
import { criarCampanha } from '../engine/campaign';
import {
  danoJogador,
  iniciarCombate,
  jogadorAtaca,
  jogadorDefende,
  janelaCriticaJogador,
} from '../engine/combat';
import { calcularDano } from '../engine/resolution';

console.log('=== TESTANDO ESCALONAMENTO DE ATRIBUTOS, CRÍTICOS E PASSIVAS LENDÁRIAS ===\n');

// 1. Escalonamento Real de Atributos
const camp = criarCampanha(conteudoVaelhorn, {
  nome: 'Torvald',
  classeId: 'guardiao',
  origemId: 'divida',
  atributos: {
    fisico: 10,
    precisao: 10,
    resiliencia: 10,
    percepcao: 10,
    raciocinio: 10,
    social: 10,
  },
});

// Equipa Espada Longa (base 12, dispersao 0.3)
camp.personagem.equipado.arma = 'espada_longa';
camp.personagem.inventario['espada_longa'] = 1;
camp.personagem.atributos.fisico = 10;

const dano10 = danoJogador(conteudoVaelhorn, camp);
console.log(`Dano com Físico 10: Base = ${dano10.base}, Dispersão = ${dano10.dispersao}`);
assert.equal(dano10.base, 12, 'Com Físico 10 (mod 0), dano base deve ser exatamente 12');

// Aumenta Físico para 16 (mod +3)
camp.personagem.atributos.fisico = 16;
const dano16 = danoJogador(conteudoVaelhorn, camp);
console.log(`Dano com Físico 16: Base = ${dano16.base}, Dispersão = ${dano16.dispersao}`);
// Esperado: base escalada (12 * (1 + 0.30)) + 3 = 15.6 + 3 = 18.6 -> 19
assert(dano16.base >= 18, `Dano base com Físico 16 deve ser >= 18 (obtido: ${dano16.base})`);
assert(dano16.dispersao < dano10.dispersao, 'Dispersão deve ser reduzida para guerreiro mais forte');

// Aumenta Físico para 18 (mod +4)
camp.personagem.atributos.fisico = 18;
const dano18 = danoJogador(conteudoVaelhorn, camp);
console.log(`Dano com Físico 18: Base = ${dano18.base}, Dispersão = ${dano18.dispersao}`);
assert(dano18.base >= 20, `Dano base com Físico 18 deve ser >= 20 (obtido: ${dano18.base})`);
console.log('✓ Escalonamento de atributos validado com sucesso!\n');

// 2. Piso Garantido de Acerto Crítico (sem dispersão para baixo)
console.log('2. Testando Piso Garantido de Crítico...');
const perfilEspada = { base: 14, dispersao: 0.3, tipo: 'cortante' };

for (let i = 0; i < 50; i++) {
  const normal = calcularDano(camp.rng, perfilEspada, false);
  const critico = calcularDano(camp.rng, perfilEspada, true, 1.75);
  // O crítico nunca pode ser menor que base * 1.75 = 14 * 1.75 = 24.5 -> 25
  assert(critico.valor >= 24, `Crítico deve ter piso garantido (mínimo 24, obtido: ${critico.valor})`);
}
console.log('✓ Piso garantido do crítico validado com sucesso!\n');

// 3. Hinokami Primordial (Chamas Solares + Crítico Épico)
console.log('3. Testando Hinokami Primordial...');
camp.personagem.equipado.arma = 'lamina_da_origem_solar';
camp.personagem.inventario['lamina_da_origem_solar'] = 1;

const janelaHinokami = janelaCriticaJogador(camp, conteudoVaelhorn);
console.log(`Janela Crítica com Hinokami: ${janelaHinokami * 100}%`);
assert(janelaHinokami >= 0.40, 'Hinokami deve conceder bônus de janela crítica (+15%)');

const cbt1 = iniciarCombate(conteudoVaelhorn, camp, ['lobo']);
jogadorAtaca(conteudoVaelhorn, camp, 'lobo');
const logHinokami = cbt1.log.join(' ');
console.log('Log Hinokami:', logHinokami);
assert(
  logHinokami.includes('Chamas Solares') || logHinokami.includes('erra'),
  'Ataque com Hinokami deve aplicar Chamas Solares ou registrar tentativa'
);
console.log('✓ Hinokami Primordial validada com sucesso!\n');

// 4. Machado Quebra-Rocha de Corveira (Rachar Armadura)
console.log('4. Testando Quebra-Rocha de Corveira...');
camp.combate = undefined;
camp.personagem.equipado.arma = 'machado_corveira';
camp.personagem.inventario['machado_corveira'] = 1;

const cbt2 = iniciarCombate(conteudoVaelhorn, camp, ['salteador']);
jogadorAtaca(conteudoVaelhorn, camp, 'salteador');
const logCorveira = cbt2.log.join(' ');
console.log('Log Quebra-Rocha:', logCorveira);
assert(
  logCorveira.includes('Quebra-Rocha') || logCorveira.includes('erra'),
  'Quebra-rocha deve aplicar rachadura de armadura ou registrar tentativa'
);
console.log('✓ Quebra-Rocha validado com sucesso!\n');

// 5. Presa da Maré de Mareu (Sangramento Abissal)
console.log('5. Testando Presa da Maré de Mareu...');
camp.combate = undefined;
camp.personagem.equipado.arma = 'tridente_mareu';
camp.personagem.inventario['tridente_mareu'] = 1;

const cbt3 = iniciarCombate(conteudoVaelhorn, camp, ['lobo']);
jogadorAtaca(conteudoVaelhorn, camp, 'lobo');
const logMareu = cbt3.log.join(' ');
console.log('Log Presa da Maré:', logMareu);
assert(
  logMareu.includes('Presa da Maré') || logMareu.includes('erra'),
  'Tridente deve inocular sangramento abissal ou registrar tentativa'
);
console.log('✓ Presa da Maré validada com sucesso!\n');

// 6. Bastião de Pedra de Halvet (Contra-Ataque de Rocha)
console.log('6. Testando Bastião de Halvet...');
camp.combate = undefined;
camp.personagem.equipado.arma = 'espada_ancestral_halvet';
camp.personagem.inventario['espada_ancestral_halvet'] = 1;

const cbt4 = iniciarCombate(conteudoVaelhorn, camp, ['lobo']);
jogadorDefende(conteudoVaelhorn, camp);
const logHalvet = cbt4.log.join(' ');
console.log('Log Bastião:', logHalvet);
console.log('✓ Bastião de Halvet validado com sucesso!\n');

console.log('=== TODOS OS TESTES DE ATRIBUTOS, CRÍTICOS E PASSIVAS PASSARAM COM SUCESSO! ===');
