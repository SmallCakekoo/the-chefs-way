/* Logros del perfil. Son de quien usa el dispositivo (el perfil), no de toda la mesa, y quedan guardados en
   localStorage (`slammed.v2` → stats). Cada logro mira UN contador de `stats` y se desbloquea al llegar a `goal`.
   Cómo se llena cada contador: ver `recordGame` en GameContext.jsx e INSIGNIAS-Y-LOGROS.md (raíz).
   `img` es la ilustración; bloqueado se ve "Por Descubrir". */

// arte en public/logros/ (un archivo por logro, con el título del logro como nombre)
const L = (name) => encodeURI(`/logros/${name}.svg`);
export const LOCKED_IMG = L("Por Descubrir");

export const ACHIEVEMENTS = [
  {
    id: "primer-servicio",
    scope: "player",
    img: L("Primer servicio"),
    name: "Primer servicio",
    desc: "Termina tu primera partida (llegando a la meta o en quiebra).",
    stat: "gamesPlayed",
    goal: 1,
  },
  {
    id: "empleado-del-mes",
    scope: "player",
    img: L("Empleado del mes"),
    name: "Empleado del mes",
    desc: "Llega primero a la meta en una partida.",
    stat: "wins",
    goal: 1,
  },
  {
    id: "doble-turno",
    scope: "player",
    img: L("Doble turno"),
    name: "Doble turno",
    desc: "Llega primero a la meta en 2 partidas.",
    stat: "wins",
    goal: 2,
  },
  {
    id: "cocina-curtida",
    scope: "player",
    img: L("Cocina curtida"),
    name: "Cocina curtida",
    desc: "Juega 5 partidas completas.",
    stat: "gamesPlayed",
    goal: 5,
  },
  {
    id: "dueno-del-local",
    scope: "host",
    img: L("Dueño del local"),
    name: "Dueño del local",
    desc: "Organiza una partida desde este dispositivo.",
    stat: "gamesHosted",
    goal: 1,
  },
  {
    id: "servicio-completo",
    scope: "host",
    img: L("Servicio completo"),
    name: "Servicio completo",
    desc: "Organiza 3 partidas desde este dispositivo.",
    stat: "gamesHosted",
    goal: 3,
  },
];

// Contadores guardados. Los de abajo de `wins` no desbloquean logros todavía, pero quedan registrados
// (sirven para logros futuros y para la ficha del perfil).
export const EMPTY_STATS = {
  gamesPlayed: 0, // partidas terminadas (meta o quiebra) en las que jugaste
  gamesHosted: 0, // partidas empezadas desde este dispositivo
  wins: 0, // veces que llegaste primero a la meta (Empleado del mes)
  ordersDelivered: 0, // pedidos que entregaste (con más ✓ que ✕)
  eventsHit: 0, // casillas de evento en las que caíste
  shortcuts: 0, // atajos que tomaste
  sixes: 0, // seises que sacaste
  cardsUsed: 0, // cartas de poder que usaste
  bankruptcies: 0, // partidas que terminaron en quiebra
  bestCoins: null, // mejor balance final del restaurante
  bestChefStars: 0, // mejor calificación del Chef Maestro
  badges: {}, // insignias de fin de partida que ganaste: { id: veces }
};

/** Mezcla lo guardado con los valores por defecto (así un guardado viejo no rompe nada). */
export function normalizeStats(stats) {
  const s = { ...EMPTY_STATS, ...(stats || {}) };
  s.badges = { ...(stats?.badges || {}) };
  return s;
}

export function evaluate(stats) {
  const s = normalizeStats(stats);
  return ACHIEVEMENTS.map((a) => {
    const have = Math.min(s[a.stat] || 0, a.goal);
    return { ...a, have, unlocked: have >= a.goal };
  });
}
