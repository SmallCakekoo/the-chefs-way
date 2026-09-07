import { GRAPH } from "./board.js";

/** Bifurcaciones del tablero, derivadas del grafo (nodos con >1 salida). */
export const BRANCHES = Object.entries(GRAPH)
  .filter(([, n]) => (n.next || []).length > 1)
  .map(([id, n]) => ({ from: id, options: n.next }));
