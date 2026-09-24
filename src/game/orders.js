/* Pedidos. Llegan en lotes (timer en GameContext), de 3 formas posibles:
   - "solo": un pedido para una sola persona.
   - "paralelo": dos pedidos A LA VEZ, cada uno para una persona distinta
     (los dos se ven en pantalla al mismo tiempo, no hay cola oculta).
   - "pareja": un pedido para dos personas que lo hacen juntas.
   Cada pedido = frase del gato + plato + ingredientes + checklist (por
   ingrediente: null -> "yes" (chulito) -> "no" (equis) -> null). Lo marcan
   los demas. Da PREP_MS para armar el memory analogo antes de que se pueda
   usar el checklist, y un total de PREP_MS + ORDER_WORK_MS antes de vencerse
   (si se vence sin entregar, resta monedas: eso es lo que puede quebrar el
   restaurante). Mientras algun pedido esta en su ventana de prep, el reloj
   del PROXIMO pedido se pausa (ver timer en GameContext). */
import { CLIENTS } from "./board.js";

export const ORDER_INTERVALS = {
  fast: { label: "Rápido", ms: 15_000 },
  normal: { label: "Normal", ms: 30_000 },
  slow: { label: "Tranquilo", ms: 45_000 },
};
export const DEFAULT_INTERVAL = "normal";

// Segundos para que la mesa arme el tablero de memoria al llegar el pedido (30 s).
export const PREP_MS = 30_000;

// Tiempo extra (despues del prep) para completar el checklist antes de que
// el pedido se venza solo. Total desde que llega = PREP_MS + ORDER_WORK_MS.
export const ORDER_WORK_MS = 40_000;

// Economia del restaurante: monedas iniciales, premio por entregar a tiempo,
// castigo por dejar que un pedido se venza. Si las monedas llegan a 0, el
// restaurante quiebra y se acaba la partida.
export const COIN_START = 1000;
export const COIN_REWARD = 120;
export const COIN_PENALTY = 180;

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
// Platos (ingredientes desde public/Ingredients). base = pan o tortilla · protein = se elige una · extras = se sortean.
// Taco (tortilla): pollo o carne + queso, lechuga, tomate, aguacate, huevo, cebolla.
// Sándwich (pan de sándwich): pollo + queso, lechuga, tomate, aguacate, huevo.
// Hamburguesa (pan de hamburguesa): carne + queso, lechuga, tomate, huevo, cebolla.
export const DISHES = [
  { id: "taco", name: "Taco", pide: "un taquito", base: ["tortilla"], protein: ["pollo", "carne"], extras: ["queso", "lechuga", "tomate", "aguacate", "huevo", "cebolla"], weight: 4 },
  { id: "sandwich", name: "Sándwich", pide: "un sanduchito", base: ["pan-sandwich"], protein: ["pollo"], extras: ["queso", "lechuga", "tomate", "aguacate", "huevo"], weight: 3 },
  { id: "hamburguesa", name: "Hamburguesa", pide: "una hamburguesita", base: ["pan-hamburguesa"], protein: ["carne"], extras: ["queso", "lechuga", "tomate", "huevo", "cebolla"], weight: 4 },
];

// El cliente es uno de los animalitos de public/clients/ (CLIENTS en board.js) y SIEMPRE con su nombre
// (el osito siempre es Tiburcio, el ratón siempre es Miga…).
// `used` = clientes que ya están en la mesa: dos pedidos a la vez nunca son del mismo cliente.
function pickClient(used = new Set()) {
  const free = CLIENTS.filter((c) => !used.has(c.name));
  const c = pick(free.length ? free : CLIENTS);
  used.add(c.name);
  return { cat: c.name, catId: c.id, catImg: c.src };
}

// Frases del gato (máquina de escribir). Tiernas y educadas; nombran el plato.
const LINES = [
  (p) => `Holi… me gustaría ${p}, porfa. Con:`,
  (p) => `Uy, hoy se me antoja ${p}. Lo quiero con:`,
  (p) => `¿Me armas ${p}? Lo pido con:`,
  (p) => `Buenas, quisiera ${p} si son tan amables. Con:`,
  (p) => `Vengo con hambre… ${p}, por favor. Con:`,
  (p) => `Hoy me porté bien, así que me merezco ${p}. Con:`,
  (p) => `Psst… ¿me preparan ${p}? Que sea con:`,
  (p) => `Llevo todo el día pensando en ${p}. Lo quiero con:`,
  (p) => `Buen día, chefs. Hoy quiero ${p}, con:`,
  (p) => `Mi barriguita pide ${p}. Y que lleve:`,
  (p) => `Vine corriendo por ${p}. ¿Se puede con:`,
  (p) => `Un antojito: ${p}, por favor. Con:`,
  (p) => `Me dijeron que aquí hacen el mejor. Quiero ${p}, con:`,
  (p) => `Hoy no cocino yo. ¡Tráiganme ${p}! Con:`,
  (p) => `Si no es mucha molestia, ${p}. Que lleve:`,
  (p) => `¡Qué rico huele! Quiero ${p} con:`,
  (p) => `Mi mamá dice que coma bien. ${p}, por favor, con:`,
  (p) => `Estoy de cumpleaños… ¡quiero ${p}! Con:`,
  (p) => `Hoy es viernes y los viernes son de ${p}. Con:`,
  (p) => `Vengo de muy lejos por ${p}. Que lleve:`,
  (p) => `Soy cliente fiel y hoy pido ${p}. Con:`,
  (p) => `Shhh… es un secreto, pero quiero ${p}. Con:`,
  (p) => `Mi tía dice que aquí cocinan con amor. ${p}, con:`,
  (p) => `Después de tanto caminar, me caería bien ${p}. Con:`,
  (p) => `¿Cómo estás? Yo con hambre. Quiero ${p}, con:`,
  (p) => `Ya lo pensé bien: ${p}. Que lleve:`,
  (p) => `Tengo una cita y quiero ir contento. ${p}, con:`,
  (p) => `Un día sin ${p} es un día perdido. Con:`,
];

// Bolsa barajada: no se repite ninguna frase hasta haber salido todas.
let lineBag = [];
function nextLine() {
  if (!lineBag.length) {
    lineBag = LINES.map((_, i) => i);
    for (let i = lineBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lineBag[i], lineBag[j]] = [lineBag[j], lineBag[i]];
    }
  }
  return LINES[lineBag.pop()];
}

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

/** Construye UN pedido ya con sus asignados (`assignees`) decididos. */
function buildOrder(seq, now, assignees, used) {
  const dish = pickWeighted(DISHES);
  const nExtras = 1 + Math.floor(Math.random() * 3); // 1..3
  const items = [...dish.base, pick(dish.protein), ...sample(dish.extras, nExtras)];
  const check = {};
  items.forEach((_, i) => (check[i] = null));

  return {
    id: `p${seq}`,
    num: seq,
    dish: dish.name,
    line: nextLine()(dish.pide),
    ...pickClient(used),
    assignees,
    items,
    check,
    status: "pending", // pending | done | expired
    createdAt: now,
    prepUntil: now + PREP_MS,
    dueAt: now + PREP_MS + ORDER_WORK_MS,
  };
}

// Las 3 formas en que puede llegar un lote de pedidos.
const SPAWN_MODES = ["solo", "paralelo", "pareja"];

/** Genera el siguiente lote de pedidos (1 o 2, segun la forma sorteada).
 *  `seq` = ultimo numero de pedido usado. `players` = nombres de la mesa.
 *  Devuelve { orders, seq } con el nuevo contador. */
export function spawnBatch(seq, players, taken = []) {
  const now = Date.now();
  const used = new Set(taken);
  const mode = players.length >= 2 ? pick(SPAWN_MODES) : "solo";
  let n = seq;

  if (mode === "paralelo") {
    const [a, b] = sample(players, 2);
    const o1 = buildOrder(++n, now, [a], used);
    const o2 = buildOrder(++n, now, [b], used);
    return { orders: [o1, o2], seq: n, mode };
  }
  if (mode === "pareja") {
    const pair = sample(players, Math.min(2, players.length));
    const o = buildOrder(++n, now, pair, used);
    return { orders: [o], seq: n, mode };
  }
  // solo
  const [a] = sample(players, 1);
  const o = buildOrder(++n, now, a ? [a] : [], used);
  return { orders: [o], seq: n, mode };
}
