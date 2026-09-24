export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
// Casillas de salida y de meta del tablero (50 casillas).
export const START_NODE = "1";
export const FINAL_NODE = "50";

// Probabilidad de que un evento positivo también pida una carta de ayuda física de la pila (fácil de ajustar).
export const HELP_CARD_CHANCE = 0.2;

// Clientes-animalito: los que piden en el mostrador (arte en public/clients/).
const C = (n) => `/clients/${encodeURI("Animalito " + n)}.svg`;
export const CLIENTS = [
  { id: "raton", name: "Miga", src: C(1), tint: "var(--coral)", face: [0.397, 0.186, 1.238] },
  { id: "panda", name: "Bambu", src: C(2), tint: "var(--lime)", face: [0.517, 0.183, 1.384] },
  { id: "pinguino", name: "Pipo", src: C(5), tint: "var(--forest)", face: [0.485, 0.181, 1.439] },
  { id: "gato", name: "Canela", src: C(6), tint: "var(--orange)", face: [0.44, 0.17, 1.05] },
  { id: "gatoBN", name: "Oreo", src: C(7), tint: "var(--yellow)", face: [0.446, 0.184, 1.081] },
  { id: "osito", name: "Tiburcio", src: C(8), tint: "var(--berry)", face: [0.503, 0.18, 1.27] },
  { id: "hamster", name: "Bombon", src: C(9), tint: "var(--yellow)", face: [0.521, 0.27, 1.258] },
];
// Chefs-animalito: son los personajes JUGABLES (arte en public/chef character/). Los clientes de arriba solo
// aparecen pidiendo en el mostrador. face = [x, y de la cara (fracción del ancho/alto), alto/ancho, zoom].
const K = (n) => `/${encodeURI("chef character/Animalito " + n)}.svg`;
export const CHEFS = [
  { id: "chef-oso", name: "Don Bigote", src: K(8), tint: "var(--orange)", face: [0.5, 0.33, 1.785, 2.3] },
  { id: "chef-gato", name: "Cacao", src: K(9), tint: "var(--coral)", face: [0.5, 0.33, 1.839, 2.3] },
  { id: "chef-foca", name: "Perla", src: K(10), tint: "var(--forest)", face: [0.5, 0.33, 1.771, 2.3] },
  { id: "chef-pollito", name: "Pío", src: K(11), tint: "var(--berry)", face: [0.5, 0.33, 1.83, 2.3] },
  { id: "chef-perro", name: "Canelo", src: K(12), tint: "var(--lime)", face: [0.5, 0.33, 1.741, 2.3] },
];

/** Estilo para encuadrar la cara de un personaje dentro de un círculo (variables CSS). */
export const faceStyle = (c) =>
  c.face
    ? { "--fx": c.face[0], "--fy": c.face[1], "--fz": (c.face[3] || 1.75) / c.face[2], "--far": c.face[2] }
    : undefined;
// Ingredientes (arte en public/ingredients/, SVG; en disco la carpeta va en minúscula: en Netlify importa). Tres bases + ocho ingredientes.
// Nota: el archivo de la tortilla se llama "toritillataco.svg" (así está en la carpeta).
const I = (file) => `/ingredients/${file}.svg`;
export const INGREDIENTS = [
  // fondo por grupo: bases #81695F · pollo, carne, cebolla, tomate #FCD73D · queso, huevo #50EBC9 · lechuga, aguacate #78D6F6
  { id: "pan-sandwich", name: "Pan", src: I("breadsandwich"), tint: "#81695f", base: true },
  { id: "pan-hamburguesa", name: "Pan", src: I("breadburger"), tint: "#81695f", base: true },
  { id: "tortilla", name: "Tortilla", src: I("toritillataco"), tint: "#81695f", base: true },
  { id: "pollo", name: "Pollo", src: I("chicken"), tint: "#fcd73d" },
  { id: "carne", name: "Carne", src: I("meat"), tint: "#fcd73d" },
  { id: "queso", name: "Queso", src: I("cheese"), tint: "#50ebc9" },
  { id: "lechuga", name: "Lechuga", src: I("lettuce"), tint: "#78d6f6" },
  { id: "tomate", name: "Tomate", src: I("tomato"), tint: "#fcd73d" },
  { id: "aguacate", name: "Aguacate", src: I("avocado"), tint: "#78d6f6" },
  { id: "huevo", name: "Huevo", src: I("egg"), tint: "#50ebc9" },
  { id: "cebolla", name: "Cebolla", src: I("onion"), tint: "#fcd73d" },
];
export const ingredientById = (id) => INGREDIENTS.find((i) => i.id === id) || INGREDIENTS[0];

// busca un chef (jugador) o un cliente; si el id es viejo (p. ej. un personaje-alimento guardado), cae en el primer chef
export const characterById = (id) =>
  CHEFS.find((c) => c.id === id) || CLIENTS.find((c) => c.id === id) || CHEFS[0];

/* ============================================================
   Grafo del tablero "The Chef's Way": 50 casillas y dos bifurcaciones.
   c: tipo de casilla · O normal (no pasa nada) · Y evento positivo
                      · B evento negativo · A carta de poder
   next: casillas alcanzables. Con >1, la app pregunta la rama.
   - Bifurcación en la 12: 13 (camino largo) o 21 (atajo directo).
   - Bifurcación en la 33: 34A (más corta) o 34B (más larga); las dos se unen en la 44.
   La 50 es la meta (cuenta como evento positivo, pero llegar dispara al Chef Maestro).
   ============================================================ */
const TYPE = {};
const setTypes = (c, ids) => ids.forEach((id) => (TYPE[id] = c));
setTypes("O", ["1", "2", "3", "4", "6", "7", "8", "9", "11", "12", "13", "22", "24", "25", "27", "29", "31", "32", "34A", "35A", "39A", "41A", "34B", "36B", "37B", "39B", "40B", "42B", "43B", "45", "46", "48", "49"]);
setTypes("Y", ["5", "17", "21", "26", "30", "37A", "35B", "41B", "50"]);
setTypes("B", ["14", "16", "18", "20", "23", "36A", "40A", "38B"]);
setTypes("A", ["10", "15", "19", "28", "33", "38A", "44", "47"]);

// conexiones: por defecto cada casilla lleva a la siguiente de su tramo
const NEXT = {};
const chain = (ids) => ids.forEach((id, i) => (NEXT[id] = i < ids.length - 1 ? [ids[i + 1]] : []));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
chain(range(1, 12));
chain([...range(13, 20), "21"]);
chain(range(21, 33));
chain(["34A", "35A", "36A", "37A", "38A", "39A", "40A", "41A", "44"]);
chain(["34B", "35B", "36B", "37B", "38B", "39B", "40B", "41B", "42B", "43B", "44"]);
chain(range(44, 50));
NEXT["12"] = ["13", "21"]; // atajo directo a la 21
NEXT["33"] = ["34A", "34B"];
NEXT["20"] = ["21"];
NEXT["41A"] = ["44"];
NEXT["43B"] = ["44"];
NEXT["50"] = [];

export const GRAPH = Object.fromEntries(
  Object.keys(TYPE).map((id) => [id, { c: TYPE[id], next: NEXT[id] || [] }])
);

// ramas que son atajo (para la insignia "El atajero")
export const SHORTCUT_NODES = new Set(["21", "34A"]);

// nombre de cada rama en el cuadro de bifurcación
export const BRANCH_LABEL = {
  "13": "Camino largo",
  "21": "Atajo",
  "34A": "Rama A",
  "34B": "Rama B",
};

// progreso (distancia mínima desde la salida) para ordenar / "La tortuga"
export const PROGRESS = (() => {
  const dist = { [START_NODE]: 0 };
  const q = [START_NODE];
  while (q.length) {
    const n = q.shift();
    for (const m of GRAPH[n].next) {
      if (dist[m] === undefined) {
        dist[m] = dist[n] + 1;
        q.push(m);
      }
    }
  }
  return dist;
})();

/** Avanza `steps` casillas desde `from`.
 *  - {at}: cayó en `at`.
 *  - {branch, options, steps}: PASA por una casilla que se divide (12 o 33) y le quedan `steps`: hay que elegir rama.
 *    Si el movimiento termina justo en la 12 o la 33, no hay decisión.
 *  - {overshoot, left}: se pasaría de la meta por `left` pasos: no avanza hasta sacar el número exacto. */
export function advanceGraph(from, steps) {
  let node = from;
  let left = steps;
  const path = []; // casillas recorridas (sin la de partida)
  while (left > 0) {
    const nx = GRAPH[node]?.next || [];
    if (nx.length === 0) return { at: from, overshoot: true, left, path: [] };
    if (nx.length > 1) return { branch: node, options: nx, steps: left, path };
    node = nx[0];
    path.push(node);
    left -= 1;
  }
  return { at: node, path };
}

export const CASILLA_INFO = {
  O: {
    tag: "o",
    label: "Casilla normal",
    text: "No pasa nada. Pasa el dispositivo al siguiente jugador.",
  },
  A: {
    tag: "a",
    label: "Carta de poder",
    text: "Ganas una carta de poder. Queda en tu mano para usarla cuando quieras.",
  },
  Y: {
    tag: "y",
    label: "Evento positivo",
    text: "La app lanza un evento positivo:",
  },
  B: {
    tag: "b",
    label: "Evento negativo",
    text: "La app lanza un evento negativo:",
  },
};

/* ============================================================
   Eventos (public/events/typeevents.md). `fx` = lo que hace la app:
   - back: n      → el jugador en turno retrocede n casillas
   - coins: n     → monedas del restaurante (+/-)
   - coinsPerPlayer: n → +n monedas por cada jugador de la mesa
   - happyHour    → durante una ronda, los pedidos entregados pagan el doble
   - collab       → durante una ronda, si 2+ jugadores entregan pedidos, todos avanzan 1 casilla
   - powerCard    → el jugador gana una carta de poder al azar
   - restock      → solo en la mesa física (la app lo anuncia)
   En los textos, {X} se cambia por el nombre del jugador en turno.
   `needsOrdersPlayed`: el evento no sale hasta que la mesa haya jugado al menos un pedido.
   ============================================================ */
export const EVENTS = [
  { title: "Propina para todos", text: "¡Los clientes dejaron propina! El restaurante gana 100 monedas por cada jugador de la mesa.", fx: { coinsPerPlayer: 100 } },
  { title: "Hora feliz", text: "Durante una ronda completa, cada pedido que entreguen paga el doble de monedas.", fx: { happyHour: true } },
  // solo sale cuando ya se jugó algún pedido (antes no hay pilas gastadas que reabastecer)
  { title: "Reabastecimiento", text: "Agreguen 2 cartas extra a la pila de ingrediente que se estaba agotando en el memory.", fx: { restock: true }, needsOrdersPlayed: true },
  { title: "Colaboración del día", text: "Durante una ronda, si dos o más jugadores entregan pedidos, todos avanzan 1 casilla extra.", fx: { collab: true } },
  { title: "Bono de cocina", text: "{X} recibe una carta de poder al azar.", fx: { powerCard: true } },
];

export const NEGATIVE_EVENTS = [
  { title: "Te cortas una mano", text: "{X} se cortó picando y retrocede 4 casillas.", fx: { back: 4 } },
  { title: "Mala reseña", text: "Un cliente dejó una mala reseña por culpa de {X}. El restaurante pierde 200 monedas.", fx: { coins: -200 } },
  { title: "Se quemó la cocina", text: "{X} quemó la cocina. El restaurante pierde 400 monedas.", fx: { coins: -400 } },
  { title: "Inspección sanitaria", text: "El plato de {X} falló la inspección sanitaria y se devuelve. Retrocede 4 casillas.", fx: { back: 4 } },
  { title: "Un pelo en el plato", text: "Encontraron un pelo en el plato de {X}. Retrocede 2 casillas.", fx: { back: 2 } },
  { title: "Glotón descubierto", text: "{X} se comió en secreto todos los ingredientes y lo vieron. Retrocede 2 casillas.", fx: { back: 2 } },
];

// Cartas de poder (solo positivas). Arte en public/powercards/<id>.svg.
// `target`: la carta pide elegir a otro jugador. `reactive`: no se juega sola, se usa cuando te demandan.
export const POWER_CARD_INFO = {
  "15 segundos en memory": {
    name: "+15 segundos",
    text: "Suma 15 segundos al reloj del pedido para jugar el memory.",
  },
  "dolb turno memoria": {
    name: "Doble turno",
    text: "En el memory de este pedido juegas dos turnos seguidos.",
  },
  "demandar jugador": {
    name: "Demandar jugador",
    text: "Elige a otro jugador: retrocede 3 casillas y pierde su próximo turno.",
    target: true,
  },
  "devolver demanda": {
    name: "Devolver demanda",
    text: "Si alguien te demanda, la demanda le rebota: él retrocede 3 casillas y pierde su turno.",
    reactive: true,
  },
  "robar dee ingrediente a otro jugador": {
    name: "Robar ingrediente",
    text: "Elige a otro jugador y quédate con una de sus cartas de ingrediente del memory.",
    target: true,
  },
};
export const POWER_CARDS = Object.keys(POWER_CARD_INFO);
export const DEMAND_STEPS = 3;
export const EXTRA_MEMORY_MS = 15_000;

/** Casillas por las que se vuelve (inverso del grafo). */
const PREV = {};
Object.entries(NEXT).forEach(([id, nx]) => nx.forEach((m) => (PREV[m] = [...(PREV[m] || []), id])));

/** Retrocede `steps` casillas desde `from`. Donde dos caminos se juntan (21 y 44), vuelve por el que el
 *  jugador realmente recorrió (`trail` = casillas por las que pasó). Nunca va más atrás de la salida. */
export function retreatGraph(from, steps, trail = []) {
  const seen = new Set(trail);
  let node = from;
  for (let i = 0; i < steps; i++) {
    const prev = PREV[node] || [];
    if (!prev.length) break;
    node = prev.find((p) => seen.has(p)) || prev[0];
  }
  return node;
}

/** Avanza 1 casilla fuera del turno (Colaboración del día). En una bifurcación sigue por el camino largo;
 *  no entra a la meta (a la meta solo se llega con el número exacto del dado). */
export function stepForward(from) {
  const nx = GRAPH[from]?.next || [];
  if (!nx.length || nx[0] === FINAL_NODE) return from;
  return nx[0];
}

// Pips del dado (coordenadas en viewBox 0..100)
export const DIE_PIPS = {
  1: [[50, 50]],
  2: [[27, 27], [73, 73]],
  3: [[27, 27], [50, 50], [73, 73]],
  4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[27, 25], [73, 25], [27, 50], [73, 50], [27, 75], [73, 75]],
};
