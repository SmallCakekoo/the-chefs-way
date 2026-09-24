/* Insignias de fin de partida (reconocimientos), estilo Counter-Strike: TODOS reciben una, no solo el ganador.
   Cómo se reparten (detalle en INSIGNIAS-Y-LOGROS.md, en la raíz):
   1. "Empleado del mes" es para quien llegó primero a la meta (si nadie llegó, nadie la recibe).
   2. Después, en este orden, cada insignia va al MEJOR jugador que todavía no tiene insignia, solo si su número es > 0:
      Manos rápidas → El atajero → Imán de eventos → Con suerte → El fiel → La tortuga.
      Empate: gana quien va más adelante en el tablero; si siguen empatados, quien juega antes en la ronda.
   3. Quien quede sin insignia recibe "Corazón de cocina" (la única que se puede repetir).
   Los números salen de `perPlayer` (GameContext): orders, assigned, expired, events, shortcuts, sixes, rolls, cards. */
import { PROGRESS, FINAL_NODE } from "./board.js";

// arte en public/insignias/ (un archivo por insignia; "¿Con suerte?" está guardado como "¿Con suerte_.svg")
const B = (file) => encodeURI(`/insignias/${file}.svg`);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const BADGES = [
  { id: "empleado-del-mes", img: B("Empleado del mes"), name: "Empleado del mes", desc: "Primero en llegar a la meta." },
  { id: "manos-rapidas", img: B("Manos rápidas"), name: "Manos rápidas", desc: "Más pedidos entregados." },
  { id: "el-atajero", img: B("El atajero"), name: "El atajero", desc: "Tomó más atajos en las bifurcaciones." },
  { id: "imán-de-eventos", img: B("Imán de eventos"), name: "Imán de eventos", desc: "Cayó en más casillas de evento." },
  { id: "con-suerte", img: B("¿Con suerte_"), name: "Con suerte", desc: "Sacó más seises." },
  { id: "el-fiel", img: B("El fiel"), name: "El fiel", desc: "Atendió pedidos sin dejar vencer ninguno." },
  { id: "la-tortuga", img: B("La tortuga"), name: "La tortuga", desc: "Se quedó más atrás en el tablero." },
  { id: "corazón-de-cocina", img: B("Corazón de cocina"), name: "Corazón de cocina", desc: "Aguantó hasta el final." },
];
export const badgeById = (id) => BADGES.find((b) => b.id === id);

/* Reglas en orden de prioridad. `value(n)` = el número que se compara (mayor es mejor);
   `detail(v)` = la frase que se muestra en la pantalla final con el número real. */
const RULES = (pp, posOf, finished) => [
  {
    id: "manos-rapidas",
    value: (n) => pp(n).orders || 0,
    detail: (v) => `Entregó ${plural(v, "pedido", "pedidos")}.`,
  },
  {
    id: "el-atajero",
    value: (n) => pp(n).shortcuts || 0,
    detail: (v) => `Tomó ${plural(v, "atajo", "atajos")}.`,
  },
  {
    id: "imán-de-eventos",
    value: (n) => pp(n).events || 0,
    detail: (v) => `Cayó en ${plural(v, "casilla de evento", "casillas de evento")}.`,
  },
  {
    id: "con-suerte",
    value: (n) => pp(n).sixes || 0,
    detail: (v) => `Sacó ${plural(v, "seis", "seises")} con el dado.`,
  },
  {
    id: "el-fiel",
    // solo cuenta si no se le venció ningún pedido
    value: (n) => ((pp(n).expired || 0) === 0 ? pp(n).assigned || 0 : 0),
    detail: (v) => `Atendió ${plural(v, "pedido", "pedidos")} y no se le venció ninguno.`,
  },
  {
    id: "la-tortuga",
    // cuánto le falta respecto al que va más adelante (0 = va primero: no califica). Quien llegó a la meta no es tortuga.
    value: (n) => {
      if (finished(n)) return 0;
      const lead = Math.max(...Object.values(posOf).map((p) => PROGRESS[p] ?? 0));
      return lead - (PROGRESS[posOf[n]] ?? 0);
    },
    detail: (v, n) => `Terminó en la casilla ${posOf[n]}, ${plural(v, "casilla", "casillas")} detrás del primero.`,
  },
];

/**
 * @param {string[]} order  nombres en orden de turno
 * @param {object}   posOf  { name: casilla }
 * @param {string[]} finishOrder  quién llegó a la meta y en qué orden
 * @param {object}   perPlayer  { name: { orders, assigned, expired, events, shortcuts, sixes, rolls, cards } }
 * @returns {{name:string, badge:object, value:number}[]}  badge.desc ya trae el detalle con los números de la partida
 */
export function awardBadges(order, posOf = {}, finishOrder = [], perPlayer = {}) {
  const pp = (n) => perPlayer?.[n] || {};
  const finished = (n) => finishOrder.includes(n) || posOf[n] === FINAL_NODE;
  const progress = (n) => PROGRESS[posOf[n]] ?? 0;
  const result = {};

  // 1) Empleado del mes
  const first = finishOrder[0];
  if (first && order.includes(first)) {
    result[first] = { ...badgeById("empleado-del-mes"), value: 1 };
  }

  // 2) cada insignia al mejor jugador sin insignia (valor > 0)
  for (const rule of RULES(pp, posOf, finished)) {
    const free = order.filter((n) => !result[n]);
    if (!free.length) break;
    let best = null;
    for (const n of free) {
      const v = rule.value(n);
      if (v <= 0) continue;
      if (
        !best ||
        v > best.v ||
        (v === best.v && progress(n) > progress(best.n)) // empate: el que va más adelante
      ) {
        best = { n, v };
      }
    }
    if (best) {
      result[best.n] = { ...badgeById(rule.id), desc: rule.detail(best.v, best.n), value: best.v };
    }
  }

  // 3) el resto: Corazón de cocina
  for (const n of order) {
    if (!result[n]) result[n] = { ...badgeById("corazón-de-cocina"), value: 0 };
  }

  return order.map((n) => ({ name: n, badge: result[n] }));
}
