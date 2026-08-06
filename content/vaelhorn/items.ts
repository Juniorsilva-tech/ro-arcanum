// ARCANUM · Catálogo de itens de Vaelhorn (GDD §34). Armas, armaduras, escudos,
// consumíveis, ferramentas e materiais. Item com slot/peso/valor; armas com dano,
// armaduras com defesa; alguns itens concedem verbos (§13.6).
import type { Item } from '../../engine/types';

function it(x: Partial<Item> & Pick<Item, 'id' | 'nome' | 'descricao' | 'slot'>): Item {
  const base: Item = {
    peso: 1,
    valor: 5,
    raridade: 'comum',
    empilhavel: x.slot === 'consumivel' || x.slot === 'material' || x.slot === 'misc',
    ...x,
  } as Item;
  if (base.slot === 'arma' && !base.atributoAtaque) {
    base.atributoAtaque = base.alcance === 'distancia' ? 'precisao' : 'fisico';
  }
  return base;
}

const MERC = ['mercado'];
const TAV = ['taverna'];
const MERC_TAV = ['mercado', 'taverna'];

export const itensVaelhorn: Item[] = [
  // ───────────────────────────── ARMAS corpo a corpo
  it({ id: 'punho_de_ferro', nome: 'Punho de ferro', descricao: 'Manoplas cravejadas para quem prefere o próprio braço.', slot: 'arma', alcance: 'corpo', peso: 1, valor: 8, dano: { base: 5, dispersao: 0.4, tipo: 'contusão' }, lojas: MERC }),
  it({ id: 'adaga', nome: 'Adaga', descricao: 'Curta, rápida, fácil de esconder.', slot: 'arma', alcance: 'corpo', peso: 1, valor: 10, dano: { base: 7, dispersao: 0.35, tipo: 'perfurante' }, lojas: MERC }),
  it({ id: 'faca_do_acougueiro', nome: 'Faca do açougueiro', descricao: 'Larga e cega o bastante para doer mais.', slot: 'arma', alcance: 'corpo', peso: 1, valor: 9, dano: { base: 8, dispersao: 0.45, tipo: 'cortante' }, lojas: MERC }),
  it({ id: 'espada_curta', nome: 'Espada curta', descricao: 'Confiável na mão de quem sabe medir a distância.', slot: 'arma', alcance: 'corpo', peso: 2, valor: 22, dano: { base: 9, dispersao: 0.3, tipo: 'cortante' }, lojas: MERC }),
  it({ id: 'rapieira', nome: 'Rapieira', descricao: 'Lâmina fina que busca as frestas da guarda.', slot: 'arma', alcance: 'corpo', peso: 2, valor: 30, atributoAtaque: 'precisao', dano: { base: 10, dispersao: 0.25, tipo: 'perfurante' }, lojas: MERC }),
  it({ id: 'espada_longa', nome: 'Espada longa', descricao: 'O peso certo entre alcance e controle.', slot: 'arma', alcance: 'corpo', peso: 3, valor: 45, dano: { base: 12, dispersao: 0.3, tipo: 'cortante' }, lojas: MERC }),
  it({ id: 'cimitarra', nome: 'Cimitarra', descricao: 'Curva, feita para o corte que continua.', slot: 'arma', alcance: 'corpo', peso: 2, valor: 34, dano: { base: 11, dispersao: 0.35, tipo: 'cortante' }, lojas: MERC }),
  it({ id: 'maca', nome: 'Maça', descricao: 'Quando a malha não deixa a lâmina entrar, o osso ainda quebra.', slot: 'arma', alcance: 'corpo', peso: 3, valor: 26, dano: { base: 13, dispersao: 0.4, tipo: 'contusão' }, lojas: MERC }),
  it({ id: 'machado_de_guerra', nome: 'Machado de guerra', descricao: 'Cai pesado; perdoa pouco de quem erra o tempo.', slot: 'arma', alcance: 'corpo', peso: 4, valor: 40, dano: { base: 14, dispersao: 0.5, tipo: 'cortante' }, lojas: MERC }),
  it({ id: 'lanca', nome: 'Lança', descricao: 'Alcança antes de ser alcançada.', slot: 'arma', alcance: 'corpo', peso: 3, valor: 24, dano: { base: 11, dispersao: 0.3, tipo: 'perfurante' }, lojas: MERC }),
  it({ id: 'martelo_de_guerra', nome: 'Martelo de guerra', descricao: 'Duas mãos, uma intenção só.', slot: 'arma', alcance: 'corpo', peso: 5, valor: 55, dano: { base: 16, dispersao: 0.5, tipo: 'contusão' }, lojas: MERC }),
  it({ id: 'montante', nome: 'Montante', descricao: 'Espada enorme; abre espaço onde havia gente.', slot: 'arma', alcance: 'corpo', peso: 6, valor: 70, dano: { base: 18, dispersao: 0.45, tipo: 'cortante' }, lojas: MERC }),
  it({ id: 'cajado_de_carvalho', nome: 'Cajado de carvalho', descricao: 'Apoio na estrada, arma no aperto — e foco para a arte.', slot: 'arma', alcance: 'corpo', peso: 2, valor: 14, dano: { base: 7, dispersao: 0.3, tipo: 'contusão' }, lojas: MERC }),
  it({ id: 'adaga_de_prata', nome: 'Adaga de prata', descricao: 'A prata morde o que a noite cospe.', slot: 'arma', alcance: 'corpo', peso: 1, valor: 60, raridade: 'notavel', dano: { base: 9, dispersao: 0.3, tipo: 'perfurante' }, lojas: MERC }),

  // ───────────────────────────── ARMAS à distância
  it({ id: 'funda', nome: 'Funda', descricao: 'Uma pedra, um giro, um estalo seco.', slot: 'arma', alcance: 'distancia', peso: 1, valor: 6, dano: { base: 6, dispersao: 0.5, tipo: 'contusão' }, lojas: MERC }),
  it({ id: 'arco_curto', nome: 'Arco curto', descricao: 'Leve e rápido entre as árvores.', slot: 'arma', alcance: 'distancia', peso: 2, valor: 25, dano: { base: 8, dispersao: 0.4, tipo: 'perfurante' }, lojas: MERC }),
  it({ id: 'arco_longo', nome: 'Arco longo', descricao: 'Pede braço, paga em alcance.', slot: 'arma', alcance: 'distancia', peso: 3, valor: 48, dano: { base: 12, dispersao: 0.4, tipo: 'perfurante' }, lojas: MERC }),
  it({ id: 'besta', nome: 'Besta', descricao: 'Lenta para recarregar, brutal ao soltar.', slot: 'arma', alcance: 'distancia', peso: 4, valor: 55, dano: { base: 14, dispersao: 0.3, tipo: 'perfurante' }, lojas: MERC }),

  // ───────────────────────────── ARMADURAS
  it({ id: 'roupa_acolchoada', nome: 'Roupa acolchoada', descricao: 'Pano grosso; melhor que a própria pele, pouco melhor.', slot: 'armadura', peso: 3, valor: 12, defesa: 1, lojas: MERC }),
  it({ id: 'gibao_de_couro', nome: 'Gibão de couro', descricao: 'Flexível, silencioso, honesto.', slot: 'armadura', peso: 4, valor: 28, defesa: 2, lojas: MERC }),
  it({ id: 'couro_batido', nome: 'Couro batido', descricao: 'Couro endurecido no fogo e no uso.', slot: 'armadura', peso: 6, valor: 45, defesa: 3, lojas: MERC }),
  it({ id: 'brunea', nome: 'Brunea de anéis', descricao: 'Anéis costurados no couro; peso que se sente na estrada.', slot: 'armadura', peso: 8, valor: 70, defesa: 4, lojas: MERC }),
  it({ id: 'cota_de_malha', nome: 'Cota de malha', descricao: 'Mil elos contra o corte. O gume que passar, passou.', slot: 'armadura', peso: 12, valor: 110, defesa: 5, lojas: MERC }),
  it({ id: 'meia_placa', nome: 'Meia-placa', descricao: 'Aço nos pontos que importam.', slot: 'armadura', peso: 18, valor: 200, raridade: 'notavel', defesa: 7, lojas: MERC }),
  it({ id: 'placa_completa', nome: 'Armadura de placas', descricao: 'Uma fortaleza que anda — e que cansa.', slot: 'armadura', peso: 26, valor: 400, raridade: 'rara', defesa: 9, lojas: MERC }),

  // ───────────────────────────── ESCUDOS
  it({ id: 'broquel', nome: 'Broquel', descricao: 'Pequeno, para desviar mais que aparar.', slot: 'escudo', peso: 2, valor: 10, defesa: 1, lojas: MERC }),
  it({ id: 'escudo_gasto', nome: 'Escudo gasto', descricao: 'Madeira rachada e ferro torto, mas ainda de pé.', slot: 'escudo', peso: 4, valor: 8, defesa: 1, lojas: MERC }),
  it({ id: 'escudo_de_madeira', nome: 'Escudo de madeira', descricao: 'Redondo, largo, confiável.', slot: 'escudo', peso: 5, valor: 24, defesa: 2, lojas: MERC }),
  it({ id: 'escudo_de_ferro', nome: 'Escudo de ferro', descricao: 'Pesado; um muro na mão esquerda.', slot: 'escudo', peso: 8, valor: 60, defesa: 3, lojas: MERC }),

  // ───────────────────────────── ACESSÓRIOS
  it({ id: 'manto_de_viagem', nome: 'Manto de viagem', descricao: 'Lã grossa contra o frio e os olhares.', slot: 'acessorio', peso: 2, valor: 15, defesa: 1, lojas: MERC_TAV }),
  it({ id: 'anel_de_sinete', nome: 'Anel de sinete', descricao: 'O brasão de uma casa que talvez ainda importe.', slot: 'acessorio', peso: 0, valor: 40, raridade: 'notavel' }),
  it({ id: 'amuleto_sao_vandro', nome: 'Amuleto de São Vandro', descricao: 'Estanho gasto; dizem que afasta o mau-olhado.', slot: 'acessorio', peso: 0, valor: 18, defesa: 1 }),

  // ───────────────────────────── CONSUMÍVEIS
  it({ id: 'racao', nome: 'Ração', descricao: 'Pão duro, queijo, carne-seca. Enche.', slot: 'consumivel', peso: 1, valor: 2, efeitosUso: [{ tipo: 'recurso', recurso: 'vigor', delta: 3 }, { tipo: 'impulso', impulso: 'fome', delta: -40 }], lojas: MERC_TAV }),
  it({ id: 'refeicao_quente', nome: 'Refeição quente', descricao: 'Um ensopado que devolve a alma ao corpo.', slot: 'consumivel', peso: 1, valor: 4, efeitosUso: [{ tipo: 'recurso', recurso: 'vigor', delta: 6 }, { tipo: 'impulso', impulso: 'fome', delta: -60 }], lojas: TAV }),
  it({ id: 'cerveja', nome: 'Caneca de cerveja', descricao: 'Rala, morna, e ainda assim bem-vinda.', slot: 'consumivel', peso: 1, valor: 2, efeitosUso: [{ tipo: 'impulso', impulso: 'solidao', delta: -12 }, { tipo: 'impulso', impulso: 'tedio', delta: -12 }, { tipo: 'pressao', pressao: 'sanidade', delta: 1 }], lojas: TAV }),
  it({ id: 'vinho', nome: 'Vinho tinto', descricao: 'O bom vinho mente com elegância.', slot: 'consumivel', peso: 1, valor: 6, efeitosUso: [{ tipo: 'impulso', impulso: 'solidao', delta: -20 }, { tipo: 'pressao', pressao: 'sanidade', delta: 2 }], lojas: TAV }),
  it({ id: 'pocao_cura_menor', nome: 'Poção de cura menor', descricao: 'Vermelha, amarga, salva-vidas.', slot: 'consumivel', peso: 1, valor: 25, raridade: 'notavel', efeitosUso: [{ tipo: 'recurso', recurso: 'vida', delta: 12 }], lojas: MERC }),
  it({ id: 'pocao_cura', nome: 'Poção de cura', descricao: 'Fecha o que não devia ter aberto.', slot: 'consumivel', peso: 1, valor: 55, raridade: 'rara', efeitosUso: [{ tipo: 'recurso', recurso: 'vida', delta: 25 }], lojas: MERC }),
  it({ id: 'tonico_de_mana', nome: 'Tônico de mana', descricao: 'Um gole azul que reacende o poço.', slot: 'consumivel', peso: 1, valor: 40, raridade: 'notavel', efeitosUso: [{ tipo: 'recurso', recurso: 'mana', delta: 8 }], lojas: MERC }),
  it({ id: 'elixir_de_vigor', nome: 'Elixir de vigor', descricao: 'Fôlego engarrafado.', slot: 'consumivel', peso: 1, valor: 30, efeitosUso: [{ tipo: 'recurso', recurso: 'vigor', delta: 15 }, { tipo: 'condicao', condicao: 'exausto', adicionar: false }], lojas: MERC }),
  it({ id: 'erva_calmante', nome: 'Erva calmante', descricao: 'Fumegada, acalma a mente que se despedaça.', slot: 'consumivel', peso: 0, valor: 12, efeitosUso: [{ tipo: 'pressao', pressao: 'sanidade', delta: -14 }], lojas: MERC }),
  it({ id: 'antidoto', nome: 'Antídoto', descricao: 'Contra o veneno que já está dentro.', slot: 'consumivel', peso: 0, valor: 20, efeitosUso: [{ tipo: 'condicao', condicao: 'envenenado', adicionar: false }], lojas: MERC }),
  it({ id: 'incenso_de_purga', nome: 'Incenso de purga', descricao: 'A fumaça branca alivia a mancha — um pouco.', slot: 'consumivel', peso: 0, valor: 35, raridade: 'notavel', efeitosUso: [{ tipo: 'pressao', pressao: 'corrupcao', delta: -10 }], lojas: MERC }),

  // ───────────────────────────── FERRAMENTAS (algumas concedem verbos — §13.6)
  it({ id: 'gazua', nome: 'Gazua', descricao: 'Um jeito de conversar com fechaduras.', slot: 'ferramenta', peso: 0, valor: 15, concedeVerbo: 'arrombar', lojas: MERC }),
  it({ id: 'alaude', nome: 'Alaúde', descricao: 'Madeira leve e cordas gastas; ainda cantam.', slot: 'ferramenta', peso: 2, valor: 30, concedeVerbo: 'tocar', lojas: MERC_TAV }),
  it({ id: 'tocha', nome: 'Tocha', descricao: 'Luz contra o escuro, e um aviso a quem espreita.', slot: 'ferramenta', peso: 1, valor: 2, empilhavel: true, lojas: MERC }),
  it({ id: 'corda', nome: 'Corda (15 passos)', descricao: 'Sobe, amarra, estrangula — conforme a necessidade.', slot: 'ferramenta', peso: 2, valor: 5, lojas: MERC }),
  it({ id: 'pe_de_cabra', nome: 'Pé de cabra', descricao: 'Persuade portas e tampas a ceder.', slot: 'ferramenta', peso: 3, valor: 10, lojas: MERC }),
  it({ id: 'kit_de_costura_de_carne', nome: 'Kit de sutura', descricao: 'Agulha, linha encerada e coragem.', slot: 'ferramenta', peso: 1, valor: 18, lojas: MERC }),

  // ───────────────────────────── MATERIAIS
  it({ id: 'veneno_de_frasco', nome: 'Veneno em frasco', descricao: 'Um fio verde que se passa na lâmina ou na taça.', slot: 'material', peso: 0, valor: 28, concedeVerbo: 'envenenar', lojas: MERC }),
  it({ id: 'po_de_tumba', nome: 'Pó de tumba', descricao: 'Cinza de nomes esquecidos. O padre paga bem por isto.', slot: 'material', peso: 0, valor: 20, raridade: 'notavel' }),
  it({ id: 'osso_talhado', nome: 'Osso talhado', descricao: 'Marcas que não deveriam significar nada — e significam.', slot: 'material', peso: 0, valor: 30, raridade: 'rara' }),
  it({ id: 'ervas_secas', nome: 'Ervas secas', descricao: 'Cura, tempero ou veneno, depende da mão.', slot: 'material', peso: 0, valor: 4, lojas: MERC }),
  it({ id: 'pena_de_corvo', nome: 'Pena de corvo', descricao: 'Preta, lustrosa, colhida da Mata.', slot: 'material', peso: 0, valor: 3 }),
  it({ id: 'minerio_de_ferro', nome: 'Minério de ferro', descricao: 'Bruto; espera a forja.', slot: 'material', peso: 3, valor: 6, lojas: MERC }),
  it({ id: 'couro_cru', nome: 'Couro cru', descricao: 'Da última caçada.', slot: 'material', peso: 2, valor: 5, lojas: MERC }),

  // ───────────────────────────── MISC
  it({ id: 'grimorio_gasto', nome: 'Grimório gasto', descricao: 'Páginas soltas e uma letra que não é sua.', slot: 'misc', peso: 2, valor: 50, raridade: 'notavel' }),
  it({ id: 'moeda_antiga', nome: 'Moeda antiga', descricao: 'De um reino que a ponte engoliu.', slot: 'misc', peso: 0, valor: 12 }),
  it({ id: 'mapa_rasgado', nome: 'Mapa rasgado', descricao: 'Falta o canto onde estava o X.', slot: 'misc', peso: 0, valor: 8 }),
];
