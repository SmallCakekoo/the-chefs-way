/* Pedidos. Llegan solos cada cierto tiempo (timer en GameContext).
   Un pedido = plato + lista de ingredientes + checklist (por ingrediente:
   null -> "yes" (chulito) -> "no" (equis) -> null). Lo marcan los demas. */

// Cada cuanto sale un pedido. El valor real lleva +-30% de azar.
export const ORDER_INTERVALS = {
  fast: { label: "Rápido", ms: 15_000 },
  normal: { label: "Normal", ms: 30_000 },
  slow: { label: "Tranquilo", ms: 45_000 },
};
export const DEFAULT_INTERVAL = "normal";

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
// La mayoria son taco / hamburguesa / sandwich; pocas ensaladas.
const DISHES = [
  { id: "taco", name: "Taco", base: ["taco", "carne"], extras: ["queso", "tomate", "lechuga", "cebolla"], weight: 4 },
  { id: "hamburguesa", name: "Hamburguesa", base: ["pan", "carne"], extras: ["queso", "tomate", "lechuga", "cebolla", "huevo"], weight: 4 },
  { id: "sandwich", name: "Sándwich", base: ["pan"], extras: ["huevo", "queso", "tomate", "lechuga", "pollo"], weight: 3 },
  { id: "ensalada", name: "Ensalada", base: ["lechuga"], extras: ["tomate", "huevo", "queso", "aguacate", "pollo", "cebolla"], weight: 1 },
];

const CATS = ["Michi", "Pelusa", "Manchas", "Nube", "Tomás", "Croqueta"];

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
    const n = players.length > 2 && Math.random() < 0.4 ? 2 : 1;
    assignees = sample(players, n);
  }

  return {
    id: `p${seq}`,
    num: seq,
    dish: dish.name,
    cat: pick(CATS),
    assignees,
    items,
    check,
    status: "pending", // pending | done
    createdAt: Date.now(),
  };
}

/* El super pedido grupal del final: lo cocina TODA la mesa al llegar a FIN. */
export function makeFinaleOrder() {
  const items = ["pan", "carne", "queso", "tomate", "lechuga", "huevo"];
  const check = {};
  items.forEach((_, i) => (check[i] = null));
  return {
    id: "finale",
    num: "★",
    dish: "Súper combo de la casa",
    cat: pick(CATS),
    assignees: [],
    items,
    check,
    status: "pending",
    createdAt: Date.now(),
    finale: true,
  };
}
