/* Pedidos. Llegan por un timer en GameContext:
   una tanda a la vez, cada cierto intervalo (medio aleatorio) que corre cuando
   no hay pedidos en la mesa y se congela mientras haya uno: un pedido para dos o
   mas personas, o dos con los mismos ingredientes.
   Cada pedido = frase del gato + plato + ingredientes + checklist (por
   ingrediente: null (vacio = mal) <-> "yes" (chulito)). Lo marcan los demas.
   Armar el memory analogo NO tiene limite de tiempo: el pedido queda en
   `building` hasta que alguien de la mesa toca "Ya armamos el memory". Ahi
   empieza a correr el reloj de jugar: PLAY_BASE_MS + ORDER_MS_PER_ITEM por cada
   ingrediente marcado (si se vence sin entregar, resta monedas: eso es lo que
   puede quebrar el restaurante). Mientras algun pedido se esta armando, el reloj
   del PROXIMO pedido se pausa (ver timer en GameContext). */
import { CLIENTS, ingredientById } from "./board.js";

export const ORDER_INTERVALS = {
  fast: { label: "Rápido", ms: 30_000 },
  normal: { label: "Normal", ms: 60_000 },
  slow: { label: "Tranquilo", ms: 160_000 },
};
export const DEFAULT_INTERVAL = "normal";

// Tiempo para jugar el memory: una base desde que la mesa marca "Ya armamos el memory",
// y +15 s cada vez que se marca un ingrediente como conseguido (tambien el pan/base).
export const PLAY_BASE_MS = 180_000;
export const ORDER_MS_PER_ITEM = 15_000;

// Pedidos: 3 ingredientes SIN contar la base (proteina + 2 extras) y, de vez en cuando, 4. Nunca mas.
// Con la base de cada plato (pan/tortilla) el pedido trae 4 o 5 casillas.
const FOUR_ITEM_CHANCE = 0.2;

// Probabilidad de que lleguen DOS pedidos a la vez (en vez de uno solo para 2 o mas personas).
const PAIR_CHANCE = 0.75;
const PAIR_CHANCE_FOUR = 0.85; // con 4 jugadores: dos equipos de 2

// Economia del restaurante: monedas iniciales, premio por entregar a tiempo,
// castigo por dejar que un pedido se venza. Si las monedas llegan a 0, el
// restaurante quiebra y se acaba la partida.
export const COIN_START = 1000;
export const COIN_PENALTY = 180;

/** Lo que paga un pedido segun el checklist. Cada ingrediente vale su precio; `max` = lo maximo que
 *  se puede ganar (todo marcado). Casilla vacia = ingrediente que falta: resta su precio, asi que con
 *  todo vacio el pedido cobra -max. `mult` (Hora feliz, doble ganancia) solo agranda lo ganado. */
export function orderPayout(order, mult = 1) {
  const prices = order.items.map((id) => ingredientById(id).price || 0);
  const max = prices.reduce((s, p) => s + p, 0);
  const got = prices.reduce(
    (s, p, i) => s + (order.check?.[i] === "yes" ? p : 0),
    0,
  );
  const base = 2 * got - max;
  return { max, delta: base > 0 ? base * mult : base };
}

export function intervalMs(key) {
  const base = (ORDER_INTERVALS[key] || ORDER_INTERVALS[DEFAULT_INTERVAL]).ms;
  const jitter = 0.7 + Math.random() * 0.6; // 0.7x .. 1.3x
  return Math.round(base * jitter);
}

/** "15 s" o "2 min" segun el valor. */
export function humanInterval(key) {
  const ms = (ORDER_INTERVALS[key] || ORDER_INTERVALS[DEFAULT_INTERVAL]).ms;
  return ms < 60_000
    ? `${Math.round(ms / 1000)} s`
    : `${Math.round(ms / 60_000)} min`;
}

// Platos: base obligatoria + extras posibles + peso (mas peso = sale mas).
// `pide`: como lo nombra el gato (diminutivo, tierno).
// Platos (ingredientes desde public/Ingredients). base = pan o tortilla · protein = se elige una · extras = se sortean.
// Taco (tortilla): pollo o carne + queso, lechuga, tomate, aguacate, huevo, cebolla.
// Sándwich (pan de sándwich): pollo + queso, lechuga, tomate, aguacate, huevo.
// Hamburguesa (pan de hamburguesa): carne + queso, lechuga, tomate, huevo, cebolla.
export const DISHES = [
  {
    id: "taco",
    name: "Taco",
    pide: "un taquito",
    base: ["tortilla"],
    protein: ["pollo", "carne"],
    extras: ["queso", "lechuga", "tomate", "aguacate", "huevo", "cebolla"],
    weight: 4,
  },
  {
    id: "sandwich",
    name: "Sándwich",
    pide: "un sanduchito",
    base: ["pan-sandwich"],
    protein: ["pollo"],
    extras: ["queso", "lechuga", "tomate", "aguacate", "huevo"],
    weight: 3,
  },
  {
    id: "hamburguesa",
    name: "Hamburguesa",
    pide: "una hamburguesita",
    base: ["pan-hamburguesa"],
    protein: ["carne"],
    extras: ["queso", "lechuga", "tomate", "huevo", "cebolla"],
    weight: 4,
  },
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
function buildOrder(
  seq,
  now,
  assignees,
  used,
  nExtras = Math.random() < FOUR_ITEM_CHANCE ? 3 : 2,
) {
  const dish = pickWeighted(DISHES);
  // proteina + 2 extras = 3 ingredientes (a veces 3 extras = 4), sin contar la base
  const items = [
    ...dish.base,
    pick(dish.protein),
    ...sample(dish.extras, nExtras),
  ];
  // todas vacias = mal; la mesa marca cada ingrediente (tambien el pan/base) cuando lo consigue
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
    building: true, // la mesa arma el memory sin reloj; dueAt se fija en "memoryReady"
    prepUntil: 0,
    dueAt: null,
  };
}

// Rotación estable de a quién le toca: bolsa barajada con todos los jugadores; nadie repite
// hasta que a todos les haya tocado. Al rellenar la bolsa, los que acaban de cocinar van al
// final, así nunca le toca al mismo dos veces seguidas.
let turnBag = [];
let turnKey = "";
let lastTurn = [];
function drawPlayers(players, count) {
  const key = players.join("|");
  if (key !== turnKey) {
    turnKey = key;
    turnBag = [];
    lastTurn = [];
  }
  const out = [];
  while (out.length < count && out.length < players.length) {
    if (!turnBag.length) {
      const recent = new Set([...lastTurn, ...out]);
      const fresh = sample(players, players.length);
      turnBag = [
        ...fresh.filter((p) => !recent.has(p)),
        ...fresh.filter((p) => recent.has(p)),
      ];
    }
    // primero alguien que no haya cocinado en el lote anterior; si no hay, el siguiente de la bolsa
    let i = turnBag.findIndex((p) => !out.includes(p) && !lastTurn.includes(p));
    if (i < 0) i = turnBag.findIndex((p) => !out.includes(p));
    if (i < 0) {
      turnBag = [];
      continue;
    }
    out.push(turnBag.splice(i, 1)[0]);
  }
  lastTurn = out;
  return out;
}

/** Genera lo que llega a la mesa: o UN pedido para dos o mas personas (pareja, trio o grupo), o DOS
 *  pedidos a la vez: individuales (2-3 jugadores) o uno por equipo de 2 (4 jugadores). Los dos individuales siempre
 *  tienen la misma cantidad de ingredientes (3 y 3, o 4 y 4, sin contar la base) para que el tiempo sea igual; comparten
 *  `batch` y un solo "Ya armamos el memory" los arranca juntos (las dos personas juegan por turnos).
 *  `seq` = ultimo numero de pedido usado. `players` = nombres de la mesa. Devuelve { orders, seq }. */
export function spawnBatch(seq, players, taken = []) {
  const now = Date.now();
  const used = new Set(taken);
  // dos pedidos a la vez: con 4 jugadores son dos EQUIPOS de 2 (así pueden robarse al otro equipo)
  // y sale mucho más seguido; con menos jugadores, dos individuales
  const teams = players.length >= 4;
  if (
    players.length >= 2 &&
    Math.random() < (teams ? PAIR_CHANCE_FOUR : PAIR_CHANCE)
  ) {
    const nExtras = Math.random() < FOUR_ITEM_CHANCE ? 3 : 2;
    const batch = `b${seq + 1}`;
    const who = teams
      ? sample(drawPlayers(players, 4), 4)
      : drawPlayers(players, 2);
    const groups = teams
      ? [who.slice(0, 2), who.slice(2, 4)]
      : [[who[0]], [who[1]]];
    const o1 = { ...buildOrder(seq + 1, now, groups[0], used, nExtras), batch };
    const o2 = { ...buildOrder(seq + 2, now, groups[1], used, nExtras), batch };
    return { orders: [o1, o2], seq: seq + 2 };
  }
  const size =
    players.length >= 2
      ? 2 + Math.floor(Math.random() * (Math.min(players.length, 4) - 1))
      : 1;
  const group = drawPlayers(players, size);
  const o = buildOrder(seq + 1, now, group, used);
  return { orders: [o], seq: seq + 1 };
}
