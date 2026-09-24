# Insignias, logros y guardado — cómo se calcula todo

Este documento explica tres sistemas de The Chef's Way:

1. **Insignias de fin de partida** (reconocimientos): todos los jugadores de la mesa reciben una al terminar.
2. **Logros del perfil**: se desbloquean con el tiempo, partida tras partida.
3. **Guardado en `localStorage`**: qué se guarda en el dispositivo y cuándo.

Código relacionado:

| Qué | Archivo |
| --- | --- |
| Reglas de las insignias | `src/game/badges.js` (`awardBadges`) |
| Lista de logros y contadores | `src/game/achievements.js` (`ACHIEVEMENTS`, `EMPTY_STATS`) |
| Contadores de la partida y guardado | `src/game/GameContext.jsx` (`bump`, `recordGame`, `meIn`, `persist`) |
| Pantalla final (insignias) | `src/screens/ResultsScreen.jsx` |
| Perfil (logros) | `src/screens/ProfileScreen.jsx` |

---

## 1. Contadores de cada partida

Mientras se juega, la app lleva por cada jugador (`perPlayer[nombre]`):

| Contador | Suma 1 cuando… |
| --- | --- |
| `orders` | entrega un pedido que le tocaba y le fue bien (más ✓ que ✕ en el checklist). En un pedido de pareja cuenta para los dos. |
| `assigned` | le llega un pedido (sale "Le toca a: …" con su nombre). |
| `expired` | se vence sin entregar un pedido que le tocaba. |
| `events` | cae en una casilla de evento (positivo o negativo). |
| `shortcuts` | toma un atajo en una bifurcación (rama hacia la 21 o hacia la 34A). |
| `sixes` | saca un 6 con el dado. |
| `rolls` | tira el dado. |
| `cards` | usa una carta de poder (incluye "Devolver demanda" cuando la usa para rebotar una demanda). |

Además se usa la **posición final** de cada uno en el tablero (`posOf`) y el **orden de llegada a la meta** (`finishOrder`).

---

## 2. Insignias de fin de partida

Salen en la pantalla final, a la derecha, con el número real de la partida (por ejemplo, "Entregó 4 pedidos.").
Se reparten tanto si el restaurante sigue abierto como si quebró.

### Paso 1: Empleado del mes

Es para **quien llegó primero a la meta** (casilla 50). Si nadie llegó, porque el restaurante quebró antes, nadie la recibe.

### Paso 2: una insignia para cada uno

Las insignias se reparten **en este orden**. Cada una va al **mejor jugador que todavía no tiene insignia**, y solo
si su número es **mayor que 0** (no se premia a nadie por no hacer nada):

| # | Insignia | Número que se compara (gana el mayor) |
| --- | --- | --- |
| 1 | **Manos rápidas** | `orders`: pedidos entregados. |
| 2 | **El atajero** | `shortcuts`: atajos tomados. |
| 3 | **Imán de eventos** | `events`: casillas de evento en las que cayó. |
| 4 | **Con suerte** | `sixes`: seises sacados. |
| 5 | **El fiel** | `assigned`, pero **solo si `expired` = 0**: pedidos atendidos sin dejar vencer ninguno. |
| 6 | **La tortuga** | Cuántas casillas le faltan para alcanzar al que va más adelante. Quien llegó a la meta no puede ser tortuga, y quien va primero tampoco (le faltan 0). |

**Empates:** gana quien va más adelante en el tablero. Si siguen empatados, gana quien juega antes en la ronda.

Como las insignias se reparten en orden, quien destaca en varias cosas se lleva la primera de la lista. Por ejemplo,
si Ana entregó más pedidos y también tomó más atajos, se lleva **Manos rápidas**, y **El atajero** pasa al siguiente
con más atajos (si tiene al menos 1).

### Paso 3: Corazón de cocina

Quien se quede sin insignia recibe **Corazón de cocina** ("Aguantó hasta el final"). Es la única insignia que
pueden recibir varios jugadores en la misma partida.

### Ejemplo

| Jugador | Llegó a la meta | orders | shortcuts | events | sixes | assigned / expired |
| --- | --- | --- | --- | --- | --- | --- |
| Ana | 1.ª | 3 | 1 | 2 | 0 | 3 / 0 |
| Beto | — | 2 | 0 | 1 | 1 | 2 / 1 |
| Caro | — | 0 | 2 | 3 | 0 | 0 / 0 |
| Dani | — | 0 | 0 | 0 | 0 | 1 / 1 |

- Ana → **Empleado del mes** (llegó primero).
- Manos rápidas → **Beto** (2; Ana ya tiene insignia).
- El atajero → **Caro** (2).
- Imán de eventos → nadie libre con más de 0 (Dani tiene 0).
- Con suerte → nadie (Dani tiene 0).
- El fiel → nadie (a Dani se le venció su único pedido).
- La tortuga → **Dani**, si va detrás del que va más adelante.

---

## 3. ¿Quién soy "yo"? (el dueño del perfil)

Los logros y las estadísticas guardadas son del **perfil del dispositivo**, no de toda la mesa. Al terminar la
partida, la app decide cuál de los jugadores es el dueño del perfil (`meIn` en `GameContext.jsx`):

1. El jugador que se llame **igual que el nombre del perfil** (sin importar mayúsculas ni espacios al inicio o al final).
2. Si nadie se llama así, el **primer jugador que se registró** (normalmente quien tiene el dispositivo).

---

## 4. Estadísticas guardadas (`stats`)

Al terminar cada partida (en `recordGame`, **una sola vez por partida**) se suma al perfil:

| Estadística | Cómo cambia |
| --- | --- |
| `gamesPlayed` | +1 por cada partida terminada (llegando a la meta o en quiebra). Salir a mitad de partida no cuenta. |
| `gamesHosted` | +1 cada vez que se pulsa "Continuar" en el registro de jugadores y arranca una partida en este dispositivo. |
| `wins` | +1 si "yo" llegué primero a la meta (fui Empleado del mes). En quiebra no suma. |
| `ordersDelivered` | + mis `orders` de la partida. |
| `eventsHit` | + mis `events`. |
| `shortcuts` | + mis `shortcuts`. |
| `sixes` | + mis `sixes`. |
| `cardsUsed` | + mis `cards`. |
| `bankruptcies` | +1 si la partida terminó en quiebra. |
| `bestCoins` | El mejor balance final del restaurante (se queda con el mayor). |
| `bestChefStars` | La mejor calificación del Chef Maestro (0 a 5). |
| `badges` | Cuántas veces gané cada insignia, por ejemplo `{ "manos-rapidas": 2, "el-atajero": 1 }`. |
| `lastBadge` | La última insignia que gané: `{ id, player }`. |

---

## 5. Logros del perfil

Están en el perfil, en la pestaña de la medalla. Cada logro mira **una** estadística y se desbloquea cuando llega a la meta (`goal`):

| Logro | Tipo | Estadística | Meta |
| --- | --- | --- | --- |
| Primer servicio | jugador | `gamesPlayed` | 1 |
| Empleado del mes | jugador | `wins` | 1 |
| Doble turno | jugador | `wins` | 2 |
| Cocina curtida | jugador | `gamesPlayed` | 5 |
| Dueño del local | anfitrión | `gamesHosted` | 1 |
| Servicio completo | anfitrión | `gamesHosted` | 3 |

- Bloqueado: se ve el arte `public/logros/Por Descubrir.svg` y el detalle dice "Progreso: X de Y".
- Desbloqueado: se ve su propio arte (`public/logros/<nombre>.svg`) y el detalle dice "¡Desbloqueado!".
- Los logros **no se guardan aparte**: se recalculan siempre desde `stats`. Así nunca quedan desincronizados.

**Agregar un logro nuevo:** se añade un objeto a `ACHIEVEMENTS` con `stat` (cualquier estadística numérica de la
tabla del punto 4) y `goal`, y se pone su arte en `public/logros/`. Todas las estadísticas ya se están guardando,
aunque hoy no tengan logro (por ejemplo `ordersDelivered`, `cardsUsed` o `bestChefStars`).

---

## 6. Guardado en `localStorage`

- **Clave:** `slammed.v2`.
- **Qué se guarda:** `{ profile, settings, stats }`, es decir, el nombre, el personaje y la descripción del perfil,
  los ajustes (sonido, música, volumen, vibración, cadencia de pedidos) y las estadísticas del punto 4.
- **Cuándo:** automáticamente, cada vez que cambia cualquiera de esas tres cosas (`persist` en `GameContext.jsx`). No hay botón de guardar.
- **Al abrir la app:** se lee y se mezcla con los valores por defecto (`normalizeStats`). Un guardado viejo o
  incompleto no rompe nada: lo que falte empieza en 0.
- **Partida en curso:** se guarda aparte, en la clave `chefsway.partida`, cada vez que cambia algo mientras se
  juega (tablero o Chef Maestro): posiciones, turno, pedidos, monedas, cartas, eventos activos y contadores de
  insignias. Si la app se cierra o se recarga, el menú muestra **Continuar**. Al continuar, los relojes de los
  pedidos se corren lo que duró la ausencia, así que nadie pierde un pedido por haber cerrado la app. Si el
  jugador en turno ya había movido su ficha, sigue el siguiente. La partida guardada se borra al llegar a la
  pantalla final, al salir con "Salir del juego" y al empezar una nueva con "Jugar".
- **Cerrar sesión** no borra nada: el perfil, los ajustes y los logros siguen en el dispositivo. Para empezar de
  cero hay que borrar los datos del sitio en el navegador.
