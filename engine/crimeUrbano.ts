// ARCANUM · Crime nas cidades, sem o jogador.
//
// A guarda não existe só para o protagonista. Toda cidade viva tem furto,
// briga e, de vez em quando, morte — mais com fome e desordem, menos com
// guarda forte (engine/guarda.ts, forcaGuarda). A guarda pega ou não:
// - pegou: a desordem cai, e às vezes o culpado tem nome — uma pessoa da
//   cidade, a mais apertada (fome, sem moeda), vai para a cela por dias
//   (VidaCivil.objetivo = 'preso') e sai sozinha quando a pena acaba;
// - não pegou: a desordem sobe, e o tesouro ou a população pagam.
// Só morte e prisão com nome viram fato público (o resto mexe nos números),
// para o boato do vale não virar uma lista de furtos.
// Sorteio derivado do dia e da cidade: não gasta o RNG da campanha.
import type { Campaign, ContentBundle } from './types';
import { createRng, nextFloat, seedFromString } from './rng';
import { registrarFato, cidadeIdDoLocal } from './historiaViva';
import { forcaGuarda, OFICIO_GUARDA } from './guarda';
import { todosNpcs } from './elenco';

const PENA = { furto: 5, briga: 3, morte: 40 } as const;

export function processarCrimeUrbano(content: ContentBundle, camp: Campaign): void {
  const v = camp.vivo;
  if (!v) return;
  const dia = camp.calendario.dia;
  for (const [id, c] of Object.entries(v.cidades)) {
    const povo = camp.continuidade?.locais[id];
    if (!povo || povo.populacao < 5) continue;
    const forca = forcaGuarda(content, camp, id);
    const rng = createRng((camp.rng.seed ^ seedFromString(`crime:${id}:${dia}`)) >>> 0);
    const chance = Math.max(0.01, Math.min(0.25, 0.02 + (c.inseguranca / 100) * 0.12 + (c.fomeDias > 0 ? 0.08 : 0) - (forca / 100) * 0.05));
    if (nextFloat(rng) >= chance) continue;

    const r = nextFloat(rng);
    const tipo: keyof typeof PENA = r < 0.65 ? 'furto' : r < 0.93 ? 'briga' : 'morte';
    const pego = nextFloat(rng) < (forca / 100) * 0.8;
    const nome = content.locais.find((l) => l.id === id)?.nome ?? id;

    if (tipo === 'furto') c.tesouro = Math.max(0, c.tesouro - (5 + Math.floor(nextFloat(rng) * 10)));
    if (tipo === 'morte') {
      povo.populacao = Math.max(0, povo.populacao - 1);
      registrarFato(camp, { tipo: 'morte_crime', local: id, texto: `Acharam um morto num beco de ${nome}. ${pego ? 'A guarda já tem um culpado.' : 'Ninguém viu nada.'}`, atores: [], publico: true });
    }
    c.inseguranca = Math.max(0, Math.min(100, c.inseguranca + (pego ? -2 : tipo === 'morte' ? 6 : 3)));
    if (!pego || nextFloat(rng) >= 0.5) continue;

    // O culpado tem nome: a pessoa mais apertada da cidade.
    const suspeito = todosNpcs(content, camp)
      .filter((n) => {
        const p = v.pessoas[n.id];
        const din = camp.npcState[n.id];
        return p && din?.vivo && !n.parentesco && n.especie !== 'oni' && !OFICIO_GUARDA.test(n.ocupacao ?? '') &&
          (din.idade ?? n.idade) >= 18 && !(camp.grupo ?? []).includes(n.id) &&
          p.objetivo !== 'cativo' && p.objetivo !== 'preso' && !p.viagem &&
          cidadeIdDoLocal(content, camp, p.local) === id && (p.fome > 50 || p.moedas < 10);
      })
      .sort((a, b) => (v.pessoas[a.id].moedas - v.pessoas[b.id].moedas) || a.id.localeCompare(b.id))[0];
    if (!suspeito) continue;
    const p = v.pessoas[suspeito.id];
    p.objetivo = 'preso';
    p.presoAte = dia + PENA[tipo];
    const crime = tipo === 'furto' ? 'furto' : tipo === 'briga' ? 'briga' : 'a morte no beco';
    registrarFato(camp, { tipo: 'prisao_npc', local: id, texto: `${suspeito.nome} foi preso pela guarda de ${nome} por ${crime}.`, atores: [suspeito.id], publico: true });
  }
}
