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
  processarFugitivos(content, camp);
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
    p.presoPor = tipo;
    const crime = tipo === 'furto' ? 'furto' : tipo === 'briga' ? 'briga' : 'a morte no beco';
    registrarFato(camp, { tipo: 'prisao_npc', local: id, texto: `${suspeito.nome} foi preso pela guarda de ${nome} por ${crime}.`, atores: [suspeito.id], publico: true });
  }
}

// ── Fugitivos ──────────────────────────────────────────────────────────────
// Preso às vezes foge da cela (mais fácil onde a guarda é fraca). Vira
// procurado com cartaz e se esconde no ermo da região. A guarda caça; quando
// acha, volta para a cela com o dobro da pena. Depois de 120 dias o caso
// esfria. O jogador pode caçar a recompensa (engine/briga.ts): vivo, entrega
// e recebe; morto, só recebe se o cartaz diz "vivo ou morto".

const RECOMPENSA = { furto: 25, briga: 15, morte: 80 } as const;
const ERMO = new Set(['floresta', 'lago', 'mina', 'ruina', 'cripta', 'cemiterio', 'acampamento', 'estrada']);
export const DIAS_PARA_ESQUECER_FUGITIVO = 120;

function esconderijoNaRegiao(content: ContentBundle, regiao: string | undefined, rng: ReturnType<typeof createRng>): string | undefined {
  const ermos = content.locais.filter((l) => ERMO.has(l.tipo ?? '') && (!regiao || l.regiao === regiao));
  const lista = ermos.length ? ermos : content.locais.filter((l) => ERMO.has(l.tipo ?? ''));
  return lista.length ? lista[Math.floor(nextFloat(rng) * lista.length)].id : undefined;
}

function processarFugitivos(content: ContentBundle, camp: Campaign): void {
  const v = camp.vivo!;
  const dia = camp.calendario.dia;
  const todos = (camp.procuradosNpc ??= {});

  // Quem foge da cela.
  for (const [id, p] of Object.entries(v.pessoas)) {
    if (p.objetivo !== 'preso' || todos[id]) continue;
    const cidadeId = cidadeIdDoLocal(content, camp, p.local);
    const forca = cidadeId ? forcaGuarda(content, camp, p.local) : 30;
    const rng = createRng((camp.rng.seed ^ seedFromString(`fuga:${id}:${dia}`)) >>> 0);
    if (nextFloat(rng) >= 0.005 + 0.03 * (1 - forca / 100)) continue;
    const regiao = content.locais.find((l) => l.id === p.local)?.regiao;
    const esconderijo = esconderijoNaRegiao(content, regiao, rng);
    if (!esconderijo) continue;
    const npc = todosNpcs(content, camp).find((n) => n.id === id);
    const crime = p.presoPor ?? 'furto';
    p.objetivo = 'rotina'; p.presoAte = undefined; p.deslocado = true; p.local = esconderijo; p.viagem = undefined;
    const cidadeNome = content.locais.find((l) => l.id === (cidadeId ?? p.casa))?.nome ?? 'a cidade';
    todos[id] = {
      crime: crime === 'morte' ? 'a morte no beco' : crime,
      cidade: cidadeId ?? p.casa, regiao: regiao ?? '', recompensa: RECOMPENSA[crime],
      vivoOuMorto: crime === 'morte', desdeDia: dia, esconderijo,
    };
    registrarFato(camp, {
      tipo: 'cartaz_procurado', local: cidadeId ?? p.casa,
      texto: `Cartaz novo em ${cidadeNome}: PROCURADO${crime === 'morte' ? ' — VIVO OU MORTO' : ''}: ${npc?.nome ?? id}, fugido da cela. Crime: ${todos[id].crime}. Recompensa de ${RECOMPENSA[crime]} moedas.`,
      atores: [id], publico: true,
    });
  }

  // A guarda caça; o caso esfria.
  for (const [id, f] of Object.entries(todos)) {
    const p = v.pessoas[id];
    if (!p || camp.npcState[id]?.vivo === false) { delete todos[id]; continue; }
    if (dia - f.desdeDia > DIAS_PARA_ESQUECER_FUGITIVO) {
      delete todos[id];
      registrarFato(camp, { tipo: 'caso_esquecido', local: f.cidade, texto: `O cartaz de ${todosNpcs(content, camp).find((n) => n.id === id)?.nome ?? id} desbotou na parede. A guarda parou de procurar.`, atores: [id], publico: true });
      continue;
    }
    const forca = forcaGuarda(content, camp, f.cidade);
    const rng = createRng((camp.rng.seed ^ seedFromString(`caca:${id}:${dia}`)) >>> 0);
    if (nextFloat(rng) >= (forca / 100) * 0.04) continue;
    const crime = p.presoPor ?? 'furto';
    p.objetivo = 'preso'; p.presoAte = dia + PENA[crime] * 2; p.local = f.cidade; p.deslocado = false;
    delete todos[id];
    registrarFato(camp, { tipo: 'prisao_npc', local: f.cidade, texto: `A guarda achou ${todosNpcs(content, camp).find((n) => n.id === id)?.nome ?? id} escondido e devolveu à cela, com a pena dobrada.`, atores: [id], publico: true });
  }
}
