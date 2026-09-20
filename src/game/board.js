export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
// Casillas de salida y de meta del tablero (50 casillas).
export const START_NODE = "1";
export const FINAL_NODE = "50";

// Probabilidad de que un evento positivo también pida una carta de ayuda física de la pila (fácil de ajustar).
export const HELP_CARD_CHANCE = 0.2;

// Personajes-alimento (arte en public/alimentos/, PNG con carita, plano).
// La escala de los PNG varia: encuadrar siempre con object-fit: contain.
const A = (n) => `/alimentos/${encodeURI("Untitled_Artwork " + n)}.png`;
export const CHARACTERS = [
  { id: "queso", name: "Queso", src: A(6), tint: "var(--yellow)" },
  { id: "huevo", name: "Huevo", src: A(4), tint: "var(--orange)" },
  { id: "pollo", name: "Pollo", src: A(7), tint: "var(--orange)" },
  { id: "tomate", name: "Tomate", src: A(8), tint: "var(--coral)" },
  { id: "lechuga", name: "Lechuga", src: A(9), tint: "var(--lime)" },
  { id: "aguacate", name: "Aguacate", src: A(5), tint: "var(--lime)" },
  { id: "cebolla", name: "Cebolla", src: A(2), tint: "var(--berry)" },
  { id: "carne", name: "Carne", src: A(10), tint: "var(--forest)" },
  { id: "pan", name: "Pan", src: A(11), tint: "var(--yellow)" },
  { id: "taco", name: "Taco", src: A(12), tint: "var(--yellow)" },
];

// Clientes-animalito: son los que eligen los jugadores (arte en public/clients/).
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
/** Estilo para encuadrar la cara de un cliente dentro de un círculo (variables CSS). */
export const faceStyle = (c) =>
  c.face
    ? { "--fx": c.face[0], "--fy": c.face[1], "--fz": 1.75 / c.face[2], "--far": c.face[2] }
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

export const characterById = (id) =>
  CHARACTERS.find((c) => c.id === id) ||
  CLIENTS.find((c) => c.id === id) ||
  CHARACTERS[0];
export const PALETTE = CHARACTERS.map((c) => c.tint);

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
  while (left > 0) {
    const nx = GRAPH[node]?.next || [];
    if (nx.length === 0) return { at: from, overshoot: true, left };
    if (nx.length > 1) return { branch: node, options: nx, steps: left };
    node = nx[0];
    left -= 1;
  }
  return { at: node };
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

// Eventos positivos (casillas tipo Y). Borrador: el equipo confirma.
export const EVENTS = [
  { title: "Propina generosa", text: "Todos los jugadores avanzan 1 casilla." },
  { title: "Cambio de menú", text: "El siguiente pedido que salga vale doble para el empleado del mes." },
  { title: "Turno doble", text: "Vuelve a tirar el dado en este mismo turno." },
  { title: "Día de suerte", text: "El restaurante gana 10 monedas." },
];

// Eventos negativos (casillas tipo B). Borrador: el equipo confirma.
export const NEGATIVE_EVENTS = [
  { title: "Se cayó un plato", text: "Retrocedes 2 casillas." },
  { title: "Hora pico", text: "Llegan dos pedidos seguidos. El siguiente jugador tira dos veces." },
  { title: "Inspección sorpresa", text: "Nadie puede usar cartas de poder hasta tu próximo turno." },
  { title: "Fila en la caja", text: "Pierdes tu próximo turno." },
  { title: "Ingrediente equivocado", text: "El restaurante pierde 10 monedas." },
];

// Cartas de poder (solo positivas). Arte en public/powercards/.
export const POWER_CARDS = ["power card 1", "power card 2", "power card 3"];
// Qué hace cada carta. PROVISIONAL: texto de relleno hasta que el equipo confirme los efectos.
export const POWER_CARD_INFO = {
  "power card 1": { name: "Lorem ipsum", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  "power card 2": { name: "Dolor sit amet", text: "Sed do eiusmod tempor incididunt ut labore et dolore." },
  "power card 3": { name: "Consectetur", text: "Ut enim ad minim veniam, quis nostrud exercitation." },
};

// Pips del dado (coordenadas en viewBox 0..100)
export const DIE_PIPS = {
  1: [[50, 50]],
  2: [[27, 27], [73, 73]],
  3: [[27, 27], [50, 50], [73, 73]],
  4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[27, 25], [73, 25], [27, 50], [73, 50], [27, 75], [73, 75]],
};
