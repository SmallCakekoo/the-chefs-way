/* Logros / medallas. Ademas del "empleado del mes" hay medallas de jugador
   y medallas de host. Se calculan desde `stats` (persistido en GameContext).
   `img` es la ilustración del logro (si falta, la pantalla muestra un marcador). */

// arte en public/logros/ (un archivo por logro, con el título del logro como nombre)
const L = (name) => encodeURI(`/logros/${name}.svg`);

export const ACHIEVEMENTS = [
  {
    id: "primer-servicio",
    scope: "player",
    img: L("Primer servicio"),
    name: "Primer servicio",
    desc: "Termina tu primera partida.",
    test: (s) => s.gamesPlayed >= 1,
  },
  {
    id: "empleado-del-mes",
    scope: "player",
    img: L("Empleado del mes"),
    name: "Empleado del mes",
    desc: "Llega primero a FIN en una partida.",
    test: (s) => s.wins >= 1,
  },
  {
    id: "doble-turno",
    scope: "player",
    img: L("Doble turno"),
    name: "Doble turno",
    desc: "Gana 2 partidas.",
    test: (s) => s.wins >= 2,
  },
  {
    id: "cocina-curtida",
    scope: "player",
    img: L("Cocina curtida"),
    name: "Cocina curtida",
    desc: "Juega 5 partidas.",
    test: (s) => s.gamesPlayed >= 5,
  },
  {
    id: "dueno-del-local",
    scope: "host",
    img: L("Dueño del local"),
    name: "Dueño del local",
    desc: "Organiza una partida con la mesa.",
    test: (s) => s.gamesHosted >= 1,
  },
  {
    id: "servicio-completo",
    scope: "host",
    img: L("Servicio completo"),
    name: "Servicio completo",
    desc: "Organiza 3 partidas.",
    test: (s) => s.gamesHosted >= 3,
  },
];

export const EMPTY_STATS = {
  gamesPlayed: 0,
  gamesHosted: 0,
  wins: 0,
};

export function evaluate(stats) {
  const s = { ...EMPTY_STATS, ...(stats || {}) };
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: !!a.test(s) }));
}
