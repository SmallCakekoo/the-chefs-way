/* Pedidos. Llegan solos cada cierto tiempo (timer en GameContext) y se
   atienden UNO A LA VEZ (los demas quedan en cola). Un pedido =
   frase del gato + plato + ingredientes + checklist (por ingrediente:
   null -> "yes" (chulito) -> "no" (equis) -> null). Lo marcan los demas.
   Cada pedido da PREP_MS para armar el memory analogo antes de empezar. */

export const ORDER_INTERVALS = {
  fast: { label: "Rápido", ms: 15_000 },
  normal: { label: "Normal", ms: 30_000 },
  slow: { label: "Tranquilo", ms: 45_000 },
};
export const DEFAULT_INTERVAL = "normal";

// Segundos para que la mesa arme el tablero de memoria al llegar el pedido.
export const PREP_MS = 20_000;

export function intervalMs(key) {
  const base = (ORDER_INTERVALS[key] || ORDER_INTERVALS[DEFAULT_INTERVAL]).ms;
  const jitter = 0.7 + Math.random() * 0.6; // 0.7x .. 1.3x
  return Math.round(base * jitter);
}

/** "15 s" o "2 min" segun el valor. */
export function humanInterval(key) {
  const ms = (ORDER_INTERVALS[key] || ORDER_INTERVALS[DEFAULT_INTERVAL]).ms;
  return ms < 60_000 ? `${Math.round(ms / 1000)} s` : `${Math.round(ms / 60_000)} min`;
}

// Platos: base obligatoria + extras posibles + peso (mas peso = sale mas).
// `pide`: como lo nombra el gato (diminutivo, tierno).
const DISHES = [
  { id: "taco", name: "Taco", pide: "un taquito", base: ["taco", "carne"], extras: ["queso", "tomate", "lechuga", "cebolla"], weight: 4 },
  { id: "hamburguesa", name: "Hamburguesa", pide: "una hamburguesita", base: ["pan", "carne"], extras: ["queso", "tomate", "lechuga", "cebolla", "huevo"], weight: 4 },
  { id: "sandwich", name: "Sándwich", pide: "un sanduchito", base: ["pan"], extras: ["huevo", "queso", "tomate", "lechuga", "pollo"], weight: 3 },
  { id: "ensalada", name: "Ensalada", pide: "una ensaladita", base: ["lechuga"], extras: ["tomate", "huevo", "queso", "aguacate", "pollo", "cebolla"], weight: 1 },
];

const CATS = ["Michi", "Pelusa", "Manchas", "Nube", "Tomás", "Croqueta"];

// Retratos del gato en public/cats/ (cat (1).jpg .. cat (32).jpg). Placeholders.
const CAT_COUNT = 32;
function catPortrait() {
  const n = 1 + Math.floor(Math.random() * CAT_COUNT);
  return `/cats/cat%20(${n}).jpg`;
}

// Frases del gato (máquina de escribir). Tiernas y educadas; nombran el plato.
const LINES = [
  (p) => `Holi… me gustaría ${p}, porfa. Con:`,
  (p) => `Uy, hoy se me antoja ${p}. Lo quiero con:`,
  (p) => `¿Me armas ${p}? Lo pido con:`,
  (p) => `Buenas, quisiera ${p} si son tan amables. Con:`,
  (p) => `Vengo con hambre… ${p}, por favor. Con:`,
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickWeighted(arr) {
  const total = arr.reduce((s, d) => s + (d.weight || 1), 0);
  let r = Math.random() * total;
  for (const d of arr) {
    r -= d.weight || 1;
    if (r <= 0) return d;
  }
  return arr[arr.length - 1];
}
function sample(arr, n) {
  const c = [...arr];
  const out = [];
  while (out.length < n && c.length)
    out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]);
  return out;
}

/** Crea un pedido. `players` = nombres para asignar quien(es) lo hacen. */
export function makeOrder(seq, players) {
  const dish = pickWeighted(DISHES);
  const nExtras = 1 + Math.floor(Math.random() * 3); // 1..3
  const items = [...dish.base, ...sample(dish.extras, nExtras)];
  const check = {};
  items.forEach((_, i) => (check[i] = null));

  let assignees = [];
  if (players && players.length) {
    const bag = [1, 1, 1, 2, 2, 3, 4]; // sesgado a 1-2
    const n = Math.min(players.length, pick(bag));
    assignees = sample(players, n);
  }

  const now = Date.now();
  return {
    id: `p${seq}`,
    num: seq,
    dish: dish.name,
    line: pick(LINES)(dish.pide),
    cat: pick(CATS),
    catImg: catPortrait(),
    assignees,
    items,
    check,
    status: "pending", // pending | done
    createdAt: now,
    prepUntil: now + PREP_MS,
  };
}

/* El super pedido grupal del final: lo cocina TODA la mesa al llegar a FIN. */
export function makeFinaleOrder() {
  const items = ["pan", "carne", "queso", "tomate", "lechuga", "huevo"];
  const check = {};
  items.forEach((_, i) => (check[i] = null));
  const now = Date.now();
  return {
    id: "finale",
    num: "★",
    dish: "Súper combo de la casa",
    line: "Para cerrar el servicio: el súper combo de la casa. Con:",
    cat: pick(CATS),
    catImg: catPortrait(),
    assignees: [],
    items,
    check,
    status: "pending",
    createdAt: now,
    prepUntil: now, // sin prep: la mesa ya está lista
    finale: true,
  };
}
