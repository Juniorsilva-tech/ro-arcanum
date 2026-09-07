import type { Criatura, Desafio } from '../../engine/types';

// Original creatures of Vaelhorn. Fixed sheets, never scaled to the player.
// These hunts are deliberate expeditions, not additions to ordinary road encounters.
export const criaturasDeDesafio: Criatura[] = [
  { id: 'sentinela_de_basalto', nome: 'Sentinela de basalto', descricao: 'Guarda uma galeria selada. Pedra móvel, sem sangue demoníaco.', nivel: 10,
    vida: 70, defesa: 20, acerto: 26, ataqueNome: 'braço de pedra', dano: { base: 15, dispersao: .3, tipo: 'contusão' }, moralBase: 100, xp: 85, faccaoId: 'ruinas',
    loot: [{ item: 'minerio_de_ferro', chance: 1 }] },
  { id: 'espadachim_sem_bandeira', nome: 'Espadachim sem bandeira', descricao: 'Uma veterana que vende a lâmina e exige duelo de quem atravessa seu posto.', nivel: 12,
    vida: 80, defesa: 22, acerto: 25, ataqueNome: 'estocada de campanha', dano: { base: 16, dispersao: .25, tipo: 'corte' }, moralBase: 90, xp: 110, faccaoId: 'foragidos',
    loot: [{ item: 'espada_longa', chance: .6 }] },
  { id: 'quimera_do_desfiladeiro', nome: 'Quimera do desfiladeiro', descricao: 'Predador arcano que caça nas pedras altas e abandona os restos nas árvores.', nivel: 14,
    vida: 100, defesa: 20, acerto: 27, ataqueNome: 'garras cruzadas', dano: { base: 18, dispersao: .4, tipo: 'cortante' }, moralBase: 100, xp: 140, faccaoId: 'fauna',
    loot: [{ item: 'garra_curva', chance: 1 }] },
  { id: 'arauto_da_cripta', nome: 'Arauto da cripta', descricao: 'Um morto armado cuja marcha faz o ossuário inteiro estremecer.', nivel: 16,
    vida: 115, defesa: 22, acerto: 26, ataqueNome: 'foice funerária', dano: { base: 18, dispersao: .3, tipo: 'corte' }, moralBase: 100, xp: 180, faccaoId: 'morto',
    loot: [{ item: 'po_de_tumba', chance: 1 }] },
  { id: 'colosso_da_mina', nome: 'Colosso da mina', descricao: 'A máquina de uma civilização soterrada. O impacto de seus punhos fecha túneis.', nivel: 18,
    vida: 150, defesa: 18, acerto: 27, ataqueNome: 'martelo de escavação', dano: { base: 25, dispersao: .4, tipo: 'contusão' }, moralBase: 100, xp: 230, faccaoId: 'ruinas',
    loot: [{ item: 'minerio_de_ferro', chance: 1 }] },
  { id: 'guardia_do_horizonte', nome: 'Guardiã do horizonte', descricao: 'Uma campeã protege a passagem superior da torre. Sua lâmina descreve círculos curtos.', nivel: 22,
    vida: 125, defesa: 29, acerto: 32, ataqueNome: 'corte circular', dano: { base: 21, dispersao: .3, tipo: 'corte' }, moralBase: 100, xp: 300, faccaoId: 'foragidos',
    loot: [{ item: 'espada_longa', chance: 1 }] },
  { id: 'draco_das_cinzas', nome: 'Draco das cinzas', descricao: 'Uma fera que guarda calor sob as escamas. Não é oni e pode caçar sob o sol.', nivel: 24,
    vida: 155, defesa: 27, acerto: 33, ataqueNome: 'mandíbula em brasa', dano: { base: 22, dispersao: .35, tipo: 'queimadura' }, moralBase: 100, xp: 380, faccaoId: 'fauna',
    loot: [{ item: 'garra_curva', chance: 1 }] },
  { id: 'cavaleira_do_eclipse', nome: 'Cavaleira do eclipse', descricao: 'Uma duelista arcana percorre as ruínas em busca de quem possa vencê-la.', nivel: 26,
    vida: 148, defesa: 29, acerto: 32, ataqueNome: 'estocada eclipsante', dano: { base: 25, dispersao: .25, tipo: 'corte' }, moralBase: 100, xp: 450, faccaoId: 'foragidos',
    loot: [{ item: 'cota_de_malha', chance: 1 }] },
  { id: 'arconte_de_vidro', nome: 'Arconte de vidro', descricao: 'Um constructo que vigia o salão profundo. Rachaduras acumuladas alteram o ritmo dos golpes.', nivel: 28,
    vida: 185, defesa: 28, acerto: 32, ataqueNome: 'chuva de estilhaços', dano: { base: 27, dispersao: .3, tipo: 'perfurante' }, moralBase: 100, xp: 550, faccaoId: 'ruinas',
    loot: [{ item: 'moeda_antiga', chance: 1 }] },
  { id: 'besta_do_primeiro_inverno', nome: 'Besta do primeiro inverno', descricao: 'Antiga demais para fugir do homem. Seu corpo bloqueia a entrada da mata profunda.', nivel: 32,
    vida: 220, defesa: 27, acerto: 33, ataqueNome: 'ruptura glacial', dano: { base: 31, dispersao: .35, tipo: 'contusão' }, moralBase: 100, xp: 700, faccaoId: 'fauna',
    loot: [{ item: 'pele_de_urso', chance: 1 }] },
];

for (const criatura of criaturasDeDesafio) criatura.humano = criatura.faccaoId === 'foragidos';

const locais = ['mina', 'acampamento', 'floresta', 'cripta', 'mina', 'torre', 'ruinas', 'ruinas', 'torre', 'floresta'];
export const desafiosVaelhorn: Desafio[] = criaturasDeDesafio.map((c, i) => ({
  id: `expedicao_${c.id}`, criaturaId: c.id, local: locais[i],
  titulo: c.nome, descricao: c.descricao,
  aviso: `Expedição perigosa, adversário fixo de nível ${c.nivel}. Você pode recusar e voltar quando estiver preparado.`,
}));
