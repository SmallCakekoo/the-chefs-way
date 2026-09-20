/* Insignias de fin de partida, estilo Counter-Strike: TODOS reciben una,
   no solo el ganador. Se reparten sin repetir. Borrador para desarrollo. */
import { PROGRESS } from "./board.js";

// arte en public/insignias/ (un archivo por insignia; "¿Con suerte?" está guardado como "¿Con suerte_.svg")
const B = (file) => encodeURI(`/insignias/${file}.svg`);

export const BADGES = [
  { id: "empleado-del-mes", img: B("Empleado del mes"), name: "Empleado del mes", desc: "Primero en llegar a FIN." },
  { id: "manos-rapidas", img: B("Manos rápidas"), name: "Manos rápidas", desc: "Más pedidos entregados." },
  { id: "el-atajero", img: B("El atajero"), name: "El atajero", desc: "Tomó más atajos en las bifurcaciones." },
  { id: "imán-de-eventos", img: B("Imán de eventos"), name: "Imán de eventos", desc: "Cayó en más casillas de evento." },
  { id: "con-suerte", img: B("¿Con suerte_"), name: "Con suerte", desc: "Sacó más seises." },
  { id: "la-tortuga", img: B("La tortuga"), name: "La tortuga", desc: "Se quedó más atrás en el tablero." },
  { id: "el-fiel", img: B("El fiel"), name: "El fiel", desc: "Nunca faltó al servicio." },
  { id: "corazón-de-cocina", img: B("Corazón de cocina"), name: "Corazón de cocina", desc: "Aguantó hasta el final." },
];

/**
 * @param {string[]} order  nombres en orden de turno
 * @param {object}   posOf  { name: casilla }
 * @param {string[]} finishOrder  quién llegó a FIN y en qué orden
 * @param {object}   perPlayer  { name: { orders, events, shortcuts, sixes, rolls } }
 * @returns {{name:string, badge:object}[]}
 */
export function awardBadges(order, posOf, finishOrder, perPlayer) {
  const pp = (n) => perPlayer?.[n] || {};
  const used = new Set();
  const take = (id) => {
    used.add(id);
    return BADGES.find((b) => b.id === id);
  };
  const best = (metric, dir = "max") => {
    let winner = null;
    let val = dir === "max" ? -Infinity : Infinity;
    for (const n of order) {
      const v = metric(n);
      if ((dir === "max" && v > val) || (dir === "min" && v < val)) {
        val = v;
        winner = n;
      }
    }
    return winner;
  };

  const result = {};
  // 1) empleado del mes: quien llegó primero
  if (finishOrder[0]) result[finishOrder[0]] = take("empleado-del-mes");

  const pending = order.filter((n) => !result[n]);
  const rules = [
    ["manos-rapidas", () => best((n) => pp(n).orders || 0)],
    ["el-atajero", () => best((n) => pp(n).shortcuts || 0)],
    ["imán-de-eventos", () => best((n) => pp(n).events || 0)],
    ["con-suerte", () => best((n) => pp(n).sixes || 0)],
    ["la-tortuga", () => best((n) => PROGRESS[posOf?.[n]] ?? 0, "min")],
  ];
  for (const [id, pick] of rules) {
    if (used.has(id)) continue;
    const cand = pick();
    if (cand && !result[cand]) result[cand] = take(id);
  }
  // relleno para quien quede sin insignia
  const spare = ["el-fiel", "corazón-de-cocina", "la-tortuga", "manos-rapidas"];
  for (const n of order) {
    if (result[n]) continue;
    const id = spare.find((s) => !used.has(s)) || "el-fiel";
    result[n] = take(id);
  }

  return order.map((n) => ({ name: n, badge: result[n] || BADGES[BADGES.length - 1] }));
}
