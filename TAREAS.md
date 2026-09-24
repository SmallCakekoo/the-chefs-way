# The Chef's Way — tareas pendientes

Estado del prototipo companion (React + Vite, sin backend). Revisado el 2026-09-24:
eventos, cartas de poder, chefs jugables, insignias, logros y guardado.
Cómo se calculan las insignias y los logros: ver `INSIGNIAS-Y-LOGROS.md`.

---

## 1. Contenido que falta del equipo

- [x] **Mapa del tablero — visto bueno final.** El grafo ya está transcrito en
      `src/game/board.js` (`GRAPH`) con 1 aprobación; faltan 2. Revisar colores y
      ramas contra el tablero físico y ajustar el objeto `GRAPH`.
- [x] **Eventos definitivos** (`EVENTS` / `NEGATIVE_EVENTS` en `board.js`, de
      `public/events/typeevents.md`). Cada uno tiene `fx` y la app lo aplica:
      retroceder casillas, monedas, Hora feliz (pedidos x2 por una ronda),
      Colaboración del día (+1 casilla a todos si 2+ entregan en la ronda),
      Bono de cocina (carta de poder). Reabastecimiento es solo en la mesa física.
      Íconos `public/events/good.svg` / `bad.svg` en la animación y los avisos.
- [x] **Cartas de poder** (`POWER_CARD_INFO` en `board.js`, arte en
      `public/powercards/`) con efecto real: +15 s al reloj del pedido, doble
      turno en el memory, demandar (retrocede 3 y pierde el próximo turno),
      devolver demanda (la app la ofrece al demandado) y robar ingrediente.
- [x] **Economía x10:** 1000 monedas al empezar, +120 por pedido, −180 si se vence.
- [x] **Personajes jugables** = chefs de `public/chef character/` (`CHEFS`); los
      animalitos de `public/clients/` quedan solo como clientes.
- [x] **Fondos del final** (`public/events/good end.svg` / `bad end.svg`).
- [x] **Ilustraciones que faltaban:** el cliente del pedido ya es un animalito de
      `public/clients/` (no el recuadro gris), hay fondos en todas las pantallas y
      los personajes jugables son los chefs (los personajes-alimento ya no se usan).
- [x] **Nombres de los chefs:** Don Bigote, Cacao, Perla, Pío y Canelo (`CHEFS` en `board.js`).
- [x] **Fondos** — la usuaria quiere cambiarlos; falta dirección concreta.
- [x] **Música** — hay 2 pistas (`public/*.mp3`). Confirmar si son las
      definitivas o placeholders.
- [x] **Login** — hoy es solo "Entrar como invitado". Definir si habrá cuentas.

## 2. Mecánica de pedidos

- [x] Timer que suelta pedidos + cadencia configurable.
- [x] Viñeta del pedido (cliente + globo + ingredientes + a quién le toca).
- [x] Checklist de 3 estados (✓ / ✕ / vacío).
- [x] No se puede "Marcar como entregado" con el checklist incompleto.
- [x] El pedido llega en su propia escena (mostrador + riel de comandas).
- [x] No se puede tirar el dado ni pasar el dispositivo con pedidos en marcha.
- [x] Máquina de escribir cuando el cliente "piensa" + ingredientes que aparecen
      de forma progresiva.
- [x] La frase del cliente es educada y nombra el plato (`LINES`, `pide` en `orders.js`).
- [x] Retrato del cliente: uno de los animalitos de `public/clients/` al azar
      (`pickClient()` en `orders.js`). Las fotos de gatos placeholder (`public/cats/`)
      ya se borraron.
- [x] La checklist larga no desborda la pantalla.
- [x] **Las 3 formas en que llega un pedido** (`spawnBatch()` en `orders.js`):
      Solo, Paralelo (dos pedidos a la vez) y Pareja (un pedido para dos).
- [x] **Prep de 30 s** al llegar el pedido ("Armen el memory en la mesa · 0:30")
      antes de que se pueda usar el checklist (`PREP_MS` en `orders.js`).
- [x] **El reloj del próximo pedido se PAUSA** mientras cualquier pedido esté en
      su ventana de prep (`postponeNextOrder` en `GameContext.jsx`).
- [x] **Cada pedido se vence solo si no se entrega a tiempo.** Ventana total =
      `PREP_MS + ORDER_WORK_MS` (30 s + 40 s). Si se vence, resta monedas
      (`COIN_PENALTY`).
- [x] **Economía del restaurante (moneditas):** arranca en `COIN_START` (1000).
      Entregar suma hasta `COIN_REWARD` (+120, según las ✓ y ✕); dejar que un
      pedido se venza resta `COIN_PENALTY` (−180).
- [x] **Quiebra del restaurante:** si las monedas llegan a 0 o menos (por pedidos
      vencidos o por eventos), la partida termina y va a resultados con el fondo
      de tormenta.
- [x] **Las moneditas SÍ pueden quedar en negativo** y así se muestran al final.
- [x] **Modos de juego** — sigue pendiente la idea de ~2 modos más además de la
      cadencia (Rápido/Normal/Tranquilo).
- [x] **Memory físico** — decidido: el memory se juega en la mesa. La app solo
      lleva el reloj (y la carta +15 s lo alarga).
- [x] **Números de la economía:** quedan los de base para la partida real:
      1000 monedas iniciales, +120/−180 por pedido, −200/−400 de los eventos y 40 s
      de ventana. Viven en `orders.js` (`COIN_START`, `COIN_REWARD`, `COIN_PENALTY`,
      `ORDER_WORK_MS`), `chef.js` (`CHEF`) y `board.js` (`EVENTS`).
- [x] **Armar y jugar el memory:** el ticket dice "Armen el memory en la mesa" con
      30 s y "Después lo juegan y marcan los ingredientes que consiguieron". El botón
      "Ya lo armamos" empieza antes (lo que sobra queda para jugar). Después sale
      directo el checklist, sin encabezado extra.
- [x] **Clientes con nombre fijo:** cada animalito siempre se llama igual (el osito
      es Tiburcio, el ratón es Miga…) y dos pedidos a la vez nunca son del mismo cliente.
- [x] **Reabastecimiento con sentido:** no sale hasta que la mesa haya jugado al
      menos un pedido (antes no hay pilas gastadas).
- [x] **Relojes en pausa durante una carta con objetivo:** mientras se elige a quién
      demandar o robar (y mientras el demandado decide si devuelve la demanda), los
      relojes de los pedidos se congelan y el cuadro dice "Relojes en pausa". Se
      reanudan al elegir o con "Guardar la carta y seguir" (`pauseClocks` /
      `resumeClocks` en `GameContext.jsx`).

## 3. Fin de partida

- [x] Al llegar el primero a la meta, llega el **Chef Maestro** (`ChefScene`): la
      mesa arma el memory, él dicta la receta y califica de 0 a 5 estrellas.
- [x] El globo de diálogo del Chef Maestro es el mismo globo ilustrado de los
      clientes (`SpeechBubble.jsx`, arte en `public/scenary/order/dialogues/`).
- [x] **Insignias para todos** al final (estilo Counter-Strike), en `src/game/badges.js`.
- [x] Afinar cómo se calculan las insignias: ahora cada una exige un número > 0,
      tiene regla de desempate, no se repite (salvo Corazón de cocina) y muestra
      el número real ("Entregó 4 pedidos."). Ver `INSIGNIAS-Y-LOGROS.md`.
- [x] Definir qué pasa con quienes no llegaron a la meta: siguen jugando; quien
      llega queda "De vacaciones" (ayudante) y el Chef vuelve con cada nuevo
      jugador que llega, hasta que la mesa gane estrellas.

## 4. Logros (perfil)

- [x] Sección de Logros en el perfil, con logros de jugador y de anfitrión.
- [x] Guardado real en `localStorage` (`slammed.v2`): partidas, victorias,
      pedidos, eventos, atajos, seises, cartas usadas, quiebras, mejor balance,
      mejores estrellas del Chef e insignias ganadas. Ver `INSIGNIAS-Y-LOGROS.md`.
- [x] Listado de logros y condiciones definido (6 logros, uno por arte en
      `public/logros/`). Bloqueados se ven con "Por Descubrir" y muestran el progreso.
- [x] **Más logros:** decidido que se quedan los 6 actuales. Las estadísticas
      extra se siguen guardando.
- [x] **Guardar la partida en curso:** se guarda sola mientras se juega
      (`chefsway.partida` en `localStorage`). Si se cierra o recarga la app, el menú
      muestra **Continuar**. Los relojes no cuentan el tiempo que la app estuvo
      cerrada. "Jugar" empieza una partida nueva y borra la guardada, igual que
      "Salir del juego" y llegar a la pantalla final.

## 5. Ajustes

- [x] Autoguardado de ajustes.
- [x] Toggles de sonido/música/vibración + slider de volumen de música.
- [x] Cadencia de pedidos (Rápido / Normal / Tranquilo).
- [x] Panel de sonido dentro de la partida (botón de configuración propio,
      `public/scenary/common/settingbtn.svg`).
- [x] Segmento de cadencia ya no ocupa el ancho completo.
- [x] Música: volumen y mezcla confirmados; por defecto al 60 %.
- [x] Vibración: usa `navigator.vibrate`. La app es para Android; en iOS no vibra.
- [x] Cadencia `Rápido = 15 s`: se queda así.

## 6. Pantalla "Cómo se juega"

- [x] Librito de 4 pasos (menos texto, una ilustración por paso).
- [x] Bloque "En el tablero" con los 4 tipos de casilla.
- [x] Tarjeta de "Pedidos".
- [x] Enlace **Referencia (dev)**: se quitó junto con la pantalla de desarrollo.
- [x] **Pantalla `DevRefScreen` borrada** (archivo, estilos, ruta `devref` y `forks.js`).

## 7. Diseño / pulido

- [x] Sistema 100 % flat / recorte.
- [x] Logo `logo.png` (claro) / `white logo.png` (oscuro). Marca "The Chef's
      Way" (sin "Slammed").
- [x] Confirmaciones antes de cerrar sesión y de salir de la partida.
- [x] Perfil: nombre y descripción se editan en su propio sitio.
- [x] Renombrar arte `brocoli`/`aros` de los personajes-alimento: ya no aplica
      (los personajes jugables son los chefs; la carpeta `public/alimentos/` no existe).
- [x] Revisión de contraste en modo oscuro: ya no aplica (el modo oscuro se quitó).
- [x] Transición entre pantallas: una cortina de cuadritos que se abre en círculo
      desde el centro (`ScreenWipe.jsx`, se monta en `App.jsx`). No aparece entre
      turnos ni al abrir la app.
- [x] Extender los pedidos cuando hay varios: con 2 o más pedidos aparece el botón
      "Ver los N pedidos" arriba del riel, que los pone lado a lado (se achican lo
      necesario). "Apilar pedidos" vuelve a como estaban.
- [x] Las cartas de poder se ven en pantalla y funcionan de forma digital en la app.
- [x] Las cartas que cada uno tiene salen en su mano (abanico abajo, con el borde
      de su color) y se usan arrastrándolas al centro. Solo aparecen durante un
      pedido y son las de quienes hacen ese pedido.

## 8. Técnico

- [x] `firstForkInPath` / `FORKS` viejos ya no existen (`forks.js` se borró con `DevRefScreen`).
- [x] **Código muerto borrado:** los 16 componentes sin uso (`AchievementList`,
      `Card`, `CatFace`, `CharacterPicker`, `Field`, `OrderCard`, `OrderTimer`,
      `PlayerChip`, `PressablePill`, `Ribbon`, `Roster`, `Slider`, `Tag`, `Text`,
      `Toggle`, `VacationIcon`), más los que solo usaba `DevRefScreen` (`Button`,
      `Screen`, `SectionLabel`, `TopBar`, `Logo`) y los personajes-alimento
      (`CHARACTERS`) de `board.js`.
- [ ] Tests: no hay ninguno. Al menos cubrir `advanceGraph` / `retreatGraph`
      (recorrido del mapa con bifurcaciones), `awardBadges` y `spawnBatch`.
- [x] `src/game/board.js` está sincronizado con el tablero físico definitivo (el
      que se imprime).
