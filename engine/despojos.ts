// ARCANUM · O que fica no chão.
//
// Antes, matar um bandido devolvia a tabela de loot da criatura: sempre os
// mesmos dois itens, com a mesma chance. Um corpo, porém, não é uma tabela —
// é uma mochila. Ele tinha moeda no bolso, comida no embornal, a arma que
// estava usando, e às vezes um papel que não devia estar ali.
//
// A tabela da criatura continua valendo (é conteúdo escrito à mão). Isto aqui
// é o que se acha ALÉM dela, montado a partir do que a criatura é.
import type { Campaign, ContentBundle, Criatura } from './types';
import { nextFloat, nextInt, pick } from './rng';

export type Achado = { itemId?: string; moedas?: number };

// Bicho não carrega bolsa. Gente sim.
const FACCOES_COM_BOLSO = ['ladroes', 'foragidos', 'guarda', 'senhorio', 'mineiros', 'vila'];

// O que cada tipo de gente costuma trazer no embornal.
const EMBORNAL: Record<string, string[]> = {
  ladroes: ['pao_preto', 'gazua', 'faca_de_arremesso', 'carta_lacrada', 'chave_enferrujada'],
  foragidos: ['racao', 'compressa_de_ervas', 'corda', 'cota_do_regimento', 'carta_lacrada'],
  guarda: ['racao', 'insignia_da_guarda', 'tocha', 'corda'],
  senhorio: ['colher_de_prata', 'anel_de_sinete', 'carta_lacrada', 'vinho'],
  mineiros: ['sebo_bruto', 'minerio_de_ferro', 'lanterna_surda', 'pao_preto'],
  vila: ['pao_preto', 'racao', 'ervas_secas'],
  morto: ['osso_limpo', 'po_de_tumba', 'moeda_antiga'],
  arcano: ['grimorio_gasto', 'osso_talhado'],
};

// A arma que ela estava usando, deduzida do golpe que ela dava.
function armaProvavel(content: ContentBundle, c: Criatura): string | undefined {
  const tipo = c.dano.tipo;
  const alvo = content.itens.filter(
    (i) => i.slot === 'arma' && i.dano?.tipo === tipo && i.valor <= 20 + c.nivel * 12,
  );
  if (alvo.length === 0) return undefined;
  // A mais cara que ela poderia bancar — gente pobre não anda com montante.
  return alvo.sort((a, b) => b.valor - a.valor)[0].id;
}

// Quanto uma criatura desse tipo teria no bolso.
function moedasNoBolso(camp: Campaign, c: Criatura): number {
  if (!c.faccaoId || !FACCOES_COM_BOLSO.includes(c.faccaoId)) return 0;
  const base = 2 + c.nivel * 3;
  const variacao = nextInt(camp.rng, 0, base);
  return c.chefe ? (base + variacao) * 4 : base + variacao;
}

// Monta a mochila que ficou no chão. Não substitui o loot escrito à mão da
// criatura: soma a ele.
export function despojosDe(
  content: ContentBundle,
  camp: Campaign,
  c: Criatura,
): Achado[] {
  const out: Achado[] = [];

  const moedas = moedasNoBolso(camp, c);
  if (moedas > 0) out.push({ moedas });

  const bolsa = EMBORNAL[c.faccaoId ?? ''] ?? [];
  if (bolsa.length > 0 && nextFloat(camp.rng) < 0.7) {
    const id = pick(camp.rng, bolsa);
    if (content.itens.some((i) => i.id === id)) out.push({ itemId: id });
  }

  // A arma dela cai com ela — nem sempre inteira, mas cai.
  if (c.faccaoId && FACCOES_COM_BOLSO.includes(c.faccaoId) && nextFloat(camp.rng) < 0.45) {
    const arma = armaProvavel(content, c);
    if (arma) out.push({ itemId: arma });
  }

  // Chefe sempre deixa algo que vale a história, não só a moeda.
  if (c.chefe && nextFloat(camp.rng) < 0.8) {
    const tesouros = content.itens.filter((i) => i.slot === 'misc' && i.raridade !== 'comum');
    if (tesouros.length > 0) out.push({ itemId: pick(camp.rng, tesouros).id });
  }

  return out;
}

// Aplica os despojos e devolve o que apareceu, para a narração citar pelo nome.
export function recolherDespojos(
  content: ContentBundle,
  camp: Campaign,
  c: Criatura,
): { itens: string[]; moedas: number } {
  const p = camp.personagem;
  const itens: string[] = [];
  let moedas = 0;
  for (const a of despojosDe(content, camp, c)) {
    if (a.moedas) {
      p.dinheiro += a.moedas;
      moedas += a.moedas;
    }
    if (a.itemId) {
      p.inventario[a.itemId] = (p.inventario[a.itemId] ?? 0) + 1;
      itens.push(a.itemId);
    }
  }
  void content;
  return { itens, moedas };
}
