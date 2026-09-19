export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
export const FINAL_NODE = "FIN";

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
export const characterById = (id) =>
  CHARACTERS.find((c) => c.id === id) ||
  CLIENTS.find((c) => c.id === id) ||
  CHARACTERS[0];
export const PALETTE = CHARACTERS.map((c) => c.tint);

/* ============================================================
   Grafo del tablero "The Chef's Way" — transcrito del mapa.
   c: color/tipo · O naranja (libre) · A aguamarina (objeto +)
                   · Y amarillo (evento) · B negro (objeto -)
   next: nodos alcanzables. Con >1 nodo, la app pregunta la rama.
   (Un visto bueno del equipo; faltan dos, pero se juega con este.)
   ============================================================ */
export const GRAPH = {
  INICIO: { c: null, next: ["1"] },
  "1": { c: "O", next: ["2"] },
  "2": { c: "A", next: ["3a", "3b"] },
  "3a": { c: "O", next: ["4a"] },
  "3b": { c: "O", next: ["4b", "4a"] },
  "4a": { c: "Y", next: ["5a"] },
  "4b": { c: "B", next: ["5b"] },
  "5a": { c: "O", next: ["6a"] },
  "5b": { c: "A", next: ["7"] },
  "6a": { c: "A", next: ["7"] },
  "7": { c: "O", next: ["8"] },
  "8": { c: "O", next: ["9"] },
  "9": { c: "Y", next: ["10"] },
  "10": { c: "Y", next: ["11"] },
  "11": { c: "A", next: ["12"] },
  "12": { c: "Y", next: ["13a", "13b"] },
  "13a": { c: "B", next: ["14a"] },
  "13b": { c: "B", next: ["14b"] },
  "14a": { c: "Y", next: ["15a", "15c"] },
  "14b": { c: "O", next: ["15b"] },
  "15a": { c: "A", next: ["16a"] },
  "15b": { c: "O", next: ["18"] },
  "15c": { c: "A", next: ["17"] },
  "16a": { c: "Y", next: ["17"] },
  "17": { c: "O", next: ["18"] },
  "18": { c: "A", next: ["19"] },
  "19": { c: "Y", next: ["20a", "20b"] },
  "20a": { c: "O", next: ["21"] },
  "20b": { c: "B", next: ["22"] },
  "21": { c: "O", next: ["22"] },
  "22": { c: "A", next: ["23"] },
  "23": { c: "A", next: ["24"] },
  "24": { c: "O", next: ["25a", "25b"] },
  "25a": { c: "Y", next: ["26a"] },
  "25b": { c: "A", next: ["26b"] },
  "26a": { c: "B", next: ["28a"] },
  "26b": { c: "Y", next: ["27b", "27c"] },
  "27b": { c: "A", next: ["28a"] },
  "27c": { c: "B", next: ["28b"] },
  "28a": { c: "B", next: ["29"] },
  "28b": { c: "Y", next: ["29"] },
  "29": { c: "O", next: ["30"] },
  "30": { c: "A", next: ["31"] },
  "31": { c: "O", next: ["32"] },
  "32": { c: "O", next: ["33"] },
  "33": { c: "B", next: ["34a", "34b"] },
  "34a": { c: "O", next: ["35a"] },
  "34b": { c: "B", next: ["35b"] },
  "35a": { c: "A", next: ["36"] },
  "35b": { c: "Y", next: ["FIN"] },
  "36": { c: "O", next: ["37"] },
  "37": { c: "Y", next: ["38"] },
  "38": { c: "O", next: ["39"] },
  "39": { c: "A", next: ["40"] },
  "40": { c: "B", next: ["41"] },
  "41": { c: "O", next: ["42"] },
  "42": { c: "Y", next: ["43"] },
  "43": { c: "A", next: ["FIN"] },
  FIN: { c: null, next: [] },
};

// ramas que son atajo (para la insignia "El atajero")
export const SHORTCUT_NODES = new Set(["4b", "5b", "15b", "15c", "20b", "27b", "34b"]);

// progreso (distancia mínima desde INICIO) para ordenar / "La tortuga"
export const PROGRESS = (() => {
  const dist = { INICIO: 0 };
  const q = ["INICIO"];
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

/** Avanza `steps` aristas desde `from`. Devuelve {at} o {branch,options,steps}. */
export function advanceGraph(from, steps) {
  let node = from;
  let left = steps;
  while (left > 0) {
    const nx = GRAPH[node]?.next || [];
    if (nx.length === 0) return { at: node };
    if (nx.length > 1) return { branch: node, options: nx, steps: left };
    node = nx[0];
    left -= 1;
  }
  return { at: node };
}

export const CASILLA_INFO = {
  O: {
    tag: "o",
    label: "Casilla libre",
    text: "Nada que hacer aquí. Pasa el dispositivo al siguiente jugador.",
  },
  A: {
    tag: "a",
    label: "Objeto positivo",
    text: "Roba una carta de la pila de AYUDA y tira el dado de color en la mesa.",
  },
  Y: {
    tag: "y",
    label: "Evento",
    text: "La app lanza un evento para toda la mesa:",
  },
  B: {
    tag: "b",
    label: "Objeto negativo",
    text: "Roba una carta de la pila de SABOTAJE y tira el dado de color en la mesa.",
  },
};

// Eventos concretos para las casillas tipo Y. Borrador: el equipo confirma.
export const EVENTS = [
  { title: "Hora pico", text: "Llegan dos pedidos seguidos. El siguiente jugador tira dos veces." },
  { title: "Se cayó un plato", text: "El jugador con más casillas recorridas retrocede 2." },
  { title: "Propina generosa", text: "Todos los jugadores avanzan 1 casilla." },
  { title: "Inspección sorpresa", text: "Nadie roba cartas de sabotaje hasta tu próximo turno." },
  { title: "Cambio de menú", text: "El siguiente pedido que salga vale doble para el empleado del mes." },
  { title: "Turno doble", text: "Vuelve a tirar el dado en este mismo turno." },
];

// Pips del dado (coordenadas en viewBox 0..100)
export const DIE_PIPS = {
  1: [[50, 50]],
  2: [[27, 27], [73, 73]],
  3: [[27, 27], [50, 50], [73, 73]],
  4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[27, 25], [73, 25], [27, 50], [73, 50], [27, 75], [73, 75]],
};
