/* Logros / medallas. Ademas del "empleado del mes" hay medallas de jugador
   y medallas de host. Se calculan desde `stats` (persistido en GameContext).
   `icon` usa un personaje-alimento (id de CHARACTERS) para mantener el estilo. */

export const ACHIEVEMENTS = [
  {
    id: "primer-servicio",
    scope: "player",
    icon: "huevo",
    name: "Primer servicio",
    desc: "Termina tu primera partida.",
    test: (s) => s.gamesPlayed >= 1,
  },
  {
    id: "empleado-del-mes",
    scope: "player",
    icon: "queso",
    name: "Empleado del mes",
    desc: "Llega primero a FIN en una partida.",
    test: (s) => s.wins >= 1,
  },
  {
    id: "doble-turno",
    scope: "player",
    icon: "pollo",
    name: "Doble turno",
    desc: "Gana 2 partidas.",
    test: (s) => s.wins >= 2,
  },
  {
    id: "cocina-curtida",
    scope: "player",
    icon: "carne",
    name: "Cocina curtida",
    desc: "Juega 5 partidas.",
    test: (s) => s.gamesPlayed >= 5,
  },
  {
    id: "dueno-del-local",
    scope: "host",
    icon: "taco",
    name: "Dueño del local",
    desc: "Organiza una partida con la mesa.",
    test: (s) => s.gamesHosted >= 1,
  },
  {
    id: "servicio-completo",
    scope: "host",
    icon: "pan",
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
