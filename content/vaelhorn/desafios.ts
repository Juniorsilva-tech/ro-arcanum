import type { Criatura, Desafio } from '../../engine/types';

// Original creatures of Vaelhorn. Fixed sheets, never scaled to the player.
// These hunts are deliberate expeditions, not additions to ordinary road encounters.
export const criaturasDeDesafio: Criatura[] = [
  { id: 'sentinela_de_basalto', nome: 'Sentinela de Basalto', descricao: 'Muralha de cantaria esculpida pelos pedreiros do cerco para esmagar intrusos nos túneis com maças de chumbo fundido.', nivel: 10,
    vida: 70, defesa: 20, acerto: 26, ataqueNome: 'maça de cantaria', dano: { base: 15, dispersao: .3, tipo: 'contusão' }, moralBase: 100, xp: 85, faccaoId: 'ruinas',
    loot: [{ item: 'minerio_de_ferro', chance: 1 }] },
  { id: 'espadachim_sem_bandeira', nome: 'Veterana Sem Bandeira', descricao: 'Mercenária empedernida que vende sua lâmina calejada e exige duelo de morte de quem tenta atravessar seu posto.', nivel: 12,
    vida: 80, defesa: 22, acerto: 25, ataqueNome: 'estocada de campanha', dano: { base: 16, dispersao: .25, tipo: 'corte' }, moralBase: 90, xp: 110, faccaoId: 'foragidos',
    loot: [{ item: 'espada_longa', chance: .6 }] },
  { id: 'quimera_do_desfiladeiro', nome: 'Predador das Escarpas', descricao: 'Monstruoso predador selvagem das fendas rochosas que estraçalha viajantes e deixa tripas e carcaças penduradas nos galhos.', nivel: 14,
    vida: 100, defesa: 20, acerto: 27, ataqueNome: 'patada dilacerante', dano: { base: 18, dispersao: .4, tipo: 'cortante' }, moralBase: 100, xp: 140, faccaoId: 'fauna',
    loot: [{ item: 'garra_curva', chance: 1 }] },
  { id: 'arauto_da_cripta', nome: 'Arauto do Ossuário', descricao: 'Carrasco em armadura de ferro oxidado que vigia o ossuário dos supliciados pela inquisição da Sé.', nivel: 16,
    vida: 115, defesa: 22, acerto: 26, ataqueNome: 'foice de carrasco', dano: { base: 18, dispersao: .3, tipo: 'corte' }, moralBase: 100, xp: 180, faccaoId: 'morto',
    loot: [{ item: 'po_de_tumba', chance: 1 }] },
  { id: 'colosso_da_mina', nome: 'O Quebra-Rocha da Mina', descricao: 'Gigantesca máquina de demolição com martelos de ferro maciço, operada por mineradores amotinados na galeria profunda.', nivel: 18,
    vida: 150, defesa: 18, acerto: 27, ataqueNome: 'martelada esmagadora', dano: { base: 25, dispersao: .4, tipo: 'contusão' }, moralBase: 100, xp: 230, faccaoId: 'ruinas',
    loot: [{ item: 'minerio_de_ferro', chance: 1 }] },
  { id: 'guardia_do_horizonte', nome: 'Campeã da Torre', descricao: 'Campeã calejada que protege a passagem superior da torre. Desarma e quebra ossos com manoplas de ferro batido.', nivel: 22,
    vida: 125, defesa: 29, acerto: 32, ataqueNome: 'corte de trincheira', dano: { base: 21, dispersao: .3, tipo: 'corte' }, moralBase: 100, xp: 300, faccaoId: 'foragidos',
    loot: [{ item: 'espada_longa', chance: 1 }] },
  { id: 'draco_das_cinzas', nome: 'Fera das Cinzas de Mir', descricao: 'Réptil colossal e carniceiro que habita as cinzas incandescentes da cidade queimada, rasgando carne com dentes em serra.', nivel: 24,
    vida: 155, defesa: 27, acerto: 33, ataqueNome: 'mandíbula em brasa', dano: { base: 22, dispersao: .35, tipo: 'queimadura' }, moralBase: 100, xp: 380, faccaoId: 'fauna',
    loot: [{ item: 'garra_curva', chance: 1 }] },
  { id: 'cavaleira_do_eclipse', nome: 'Cavaleira Renegada de Mir', descricao: 'Capitã renegada da guarda da cidade destruída. Sobrevivente do massacre, empunha espada imperial e só aceita duelo até a morte.', nivel: 26,
    vida: 148, defesa: 29, acerto: 32, ataqueNome: 'estocada de carrasco', dano: { base: 25, dispersao: .25, tipo: 'corte' }, moralBase: 100, xp: 450, faccaoId: 'foragidos',
    loot: [{ item: 'cota_de_malha', chance: 1 }] },
  { id: 'arconte_de_vidro', nome: 'Guardião de Vidro Vulcânico', descricao: 'Armadura pesada guarnecida com escórias de fundição e lâminas de vidro vulcânico negro, protegendo o arsenal da torre.', nivel: 28,
    vida: 185, defesa: 28, acerto: 32, ataqueNome: 'chuva de estilhaços', dano: { base: 27, dispersao: .3, tipo: 'perfurante' }, moralBase: 100, xp: 550, faccaoId: 'ruinas',
    loot: [{ item: 'moeda_antiga', chance: 1 }] },
  { id: 'besta_do_primeiro_inverno', nome: 'O Grande Urso Cicatrizado', descricao: 'Predador colossal e ancestral com o lombo crivado de pontas de lanças e flechas quebradas, que há décadas devora intrusos na mata profunda.', nivel: 32,
    vida: 220, defesa: 27, acerto: 33, ataqueNome: 'bote dilacerante', dano: { base: 31, dispersao: .35, tipo: 'contusão' }, moralBase: 100, xp: 700, faccaoId: 'fauna',
    loot: [{ item: 'pele_de_urso', chance: 1 }] },
];

for (const criatura of criaturasDeDesafio) criatura.humano = criatura.faccaoId === 'foragidos';

const locais = ['mina', 'acampamento', 'floresta', 'cripta', 'mina', 'torre', 'ruinas', 'ruinas', 'torre', 'floresta'];
export const desafiosVaelhorn: Desafio[] = criaturasDeDesafio.map((c, i) => ({
  id: `expedicao_${c.id}`, criaturaId: c.id, local: locais[i],
  titulo: c.nome, descricao: c.descricao,
  aviso: `Expedição perigosa, adversário fixo de nível ${c.nivel}. Você pode recusar e voltar quando estiver preparado.`,
}));
