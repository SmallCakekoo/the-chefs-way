export const FINAL_SQUARE = 43;

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

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
export const characterById = (id) =>
  CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];

// Compat: algunos sitios aun piden un color; lo derivamos del personaje.
export const PALETTE = CHARACTERS.map((c) => c.tint);

// Tipo de casilla por número (1-43). Semilla fija = tablero consistente
// mientras el equipo confirma el mapa final.
function seededBoard() {
  let seed = 88;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const counts = { O: 15, A: 11, Y: 11, B: 6 };
  const pool = [];
  for (const k in counts) for (let i = 0; i < counts[k]; i++) pool.push(k);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export const BOARD = seededBoard();

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

// Eventos concretos para las casillas tipo Y (evento). Borrador para pruebas:
// el equipo confirma el listado final contra las cartas fisicas.
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
