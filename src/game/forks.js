/* Bifurcaciones del mapa "The Chef's Way".
 *
 * PENDIENTE con el equipo: transcribir el grafo real del tablero (qué rama
 * conecta con qué y cuántas casillas ahorra cada una). Por ahora esto es un
 * borrador jugable: `omite` = casillas EXTRA que avanzas si tomas esa rama
 * (0 = rama larga / normal, +N = atajo que te adelanta N).
 *
 * La app pregunta la rama cuando la tirada PASA por una casilla-bifurcación,
 * no solo cuando cae justo encima.
 */
export const FORKS = {
  3: [
    { label: "Rama 3a (larga)", omite: 0 },
    { label: "Rama 3b (atajo, omite 1)", omite: 1 },
  ],
  4: [
    { label: "Rama 4a (larga)", omite: 0 },
    { label: "Rama 4b (atajo, omite 1)", omite: 1 },
  ],
  5: [
    { label: "Rama 5a (larga)", omite: 0 },
    { label: "Rama 5b (atajo, omite 1)", omite: 1 },
  ],
  13: [
    { label: "Rama 13a", omite: 0 },
    { label: "Rama 13b", omite: 0 },
  ],
  14: [
    { label: "Rama 14a (larga)", omite: 0 },
    { label: "Rama 14b (atajo, omite 1)", omite: 1 },
  ],
  15: [
    { label: "Rama 15a (larga)", omite: 0 },
    { label: "Rama 15c (atajo, omite 1)", omite: 1 },
    { label: "Rama 15b (atajo, omite 2)", omite: 2 },
  ],
  20: [
    { label: "Rama 20a", omite: 0 },
    { label: "Rama 20b", omite: 0 },
  ],
  25: [
    { label: "Rama 25b (larga)", omite: 0 },
    { label: "Rama 25a (atajo, omite 1)", omite: 1 },
  ],
  26: [
    { label: "Rama 26a", omite: 0 },
    { label: "Rama 26b", omite: 0 },
  ],
  27: [
    { label: "Rama 27b", omite: 0 },
    { label: "Rama 27c", omite: 0 },
  ],
  28: [
    { label: "Rama 28a", omite: 0 },
    { label: "Rama 28b", omite: 0 },
  ],
  34: [
    { label: "Rama 34a", omite: 0 },
    { label: "Rama 34b", omite: 0 },
  ],
  35: [
    { label: "Rama 35a (larga)", omite: 0 },
    { label: "Rama 35b (atajo, omite 8)", omite: 8 },
  ],
};

export const FORK_SQUARES = Object.keys(FORKS)
  .map(Number)
  .sort((a, b) => a - b);

/** Primera casilla-bifurcación por la que pasa una tirada de `from` a `to`. */
export function firstForkInPath(from, to) {
  for (const f of FORK_SQUARES) {
    if (f > from && f <= to) return f;
  }
  return null;
}
