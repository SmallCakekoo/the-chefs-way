# The Chef's Way — tareas pendientes

Estado del prototipo companion (React + Vite, sin backend). Actualizado tras la
sesión de mapeo del tablero.

---

## 1. Contenido que falta del equipo

- [ ] **Mapa del tablero — visto bueno final.** El grafo ya está transcrito en
      `src/game/board.js` (`GRAPH`) con 1 aprobación; faltan 2. Revisar colores y
      ramas contra el tablero físico y ajustar el objeto `GRAPH`.
- [ ] **Textos definitivos de eventos** (`EVENTS` en `board.js`). Ahora son 6
      borradores. Confirmar contra las cartas físicas.
- [ ] **Cartas de AYUDA y SABOTAJE** — la app solo dice "roba una carta"; no hay
      listado. Definir si van en la app o solo físicas.
- [ ] **Ilustraciones que faltan:** mascota/gato del pedido (hoy es un recuadro
      gris "GATO"), fondos de pantalla, íconos de casilla, y confirmar el set de
      personajes-alimento.
- [ ] **Fondos** — la usuaria quiere cambiarlos; falta dirección concreta.
- [ ] **Música** — hay 2 pistas (`public/*.mp3`). Confirmar si son las
      definitivas o placeholders.
- [ ] **Login** — hoy es solo "Entrar como invitado". Definir si habrá cuentas.

## 2. Mecánica de pedidos (siguiente iteración fuerte)

- [x] Timer que suelta pedidos + cadencia configurable.
- [x] Viñeta del pedido (gato + bocadillo + ingredientes + a quién le toca).
- [x] Checklist de 3 estados (✓ / ✕ / vacío).
- [x] No se puede "Marcar como entregado" con el checklist incompleto.
- [x] El pedido llega en la misma pantalla del dado, en columna aparte (no
      empuja el dado hacia abajo).
- [x] No se puede tirar el dado ni pasar el dispositivo con pedidos en marcha.
- [x] Máquina de escribir cuando el gato "piensa" + ingredientes que escalan de
      0 a 100 % de forma progresiva.
- [x] La frase del gato es educada y nombra el plato ("Holi… me gustaría un
      taquito, porfa. Con:"). 5 plantillas + diminutivos en `orders.js` (`LINES`,
      `pide`).
- [x] Retrato del gato: se elige al azar una de `public/cats/cat (1..32).jpg` por
      pedido (`catPortrait()` en `orders.js`, campo `order.catImg`). **Son
      placeholders** de la usuaria, no el arte final — reemplazar cuando llegue.
- [x] La checklist larga ya no desborda la pantalla: solo scrollea la lista de
      ingredientes (`max-height: min(40vh,320px)` en `.checkList`); cabecera y
      botón "Marcar como entregado" quedan fijos. Con el checklist abierto se
      ocultan los chips del bocadillo (duplicaban la lista).
- [x] Un pedido puede ser para 1, 2, 3 o 4 jugadores.
- [x] **Se muestra un pedido a la vez**; los demás quedan en cola ("+N en cola").
- [x] **Prep de 20 s** al llegar el pedido ("Armen el memory en la mesa · 0:20")
      antes de que se pueda usar el checklist (`PREP_MS` en `orders.js`).
- [ ] **Prep + cola:** hoy el prep se cuenta desde que se *crea* el pedido. Si
      hay cola, cuando por fin se muestra el pedido #N su prep ya venció y pasa
      directo al checklist. Decidir si el prep debe arrancar cuando el pedido
      pasa a ser el *activo* (el que se ve) — cambio pequeño en el reducer
      (`shownAt`). Va ligado a los modos de juego.
- [ ] **Prep vs. reloj del próximo pedido — decisión pendiente.** Hoy el reloj
      de "próximo pedido" corre igual mientras la mesa está en el prep de 20 s.
      Definir cuál de las dos:
      - **(a) Sumarle el prep:** los 20 s de armar el memory se añaden al
        tiempo del próximo pedido (se corre `nextOrderAt += PREP_MS`), o
      - **(b) Pausar el reloj:** el contador de próximo pedido se congela
        mientras dure el prep y se reanuda al terminar.
      Ambas evitan que llegue un pedido nuevo encima mientras todavía están
      colocando el tablero. Implementación en el efecto del timer de
      `GameContext.jsx` + `nextOrderAt`.
- [ ] **Modos de juego** — la usuaria quiere ~2 modos más además de la cadencia.
      Idea: que Rápido/Normal/Tranquilo también ajusten el prep y la dificultad
      (más jugadores por pedido, más ingredientes). Hoy el prep es fijo (20 s).
- [ ] **Memory físico** — la app no lo modela (es de mesa). Falta decidir si
      necesita algún apoyo en pantalla (temporizador, recordatorio).
- [ ] **Puntaje por tiempo** — medir cuánto tardó cada pedido y que alimente la
      quiebra del restaurante y el "empleado del mes". Hoy no se mide.
- [ ] **Quiebra del restaurante** — no existe todavía ninguna barra/estado de
      salud del local.
- [ ] Definir qué pasa si un pedido no se entrega nunca (¿penalización?, ¿se
      queda bloqueando el turno para siempre?).

## 3. Fin de partida

- [x] Al llegar el primero a FIN, la mesa entera cocina un **súper pedido
      grupal** (`FinaleScreen`).
- [x] **Insignias para todos** al final (estilo Counter-Strike): "Empleado del
      mes", "Manos rápidas", "El atajero", "Imán de eventos", "Con suerte", "La
      tortuga", etc. En `src/game/badges.js`.
- [ ] Afinar cómo se calculan las insignias (hoy usan contadores simples:
      pedidos entregados, eventos, atajos, seises, posición).
- [ ] Definir si los jugadores que no llegaron a FIN "terminan" o quedan a medio
      tablero cuando arranca el súper pedido.

## 4. Logros (perfil)

- [x] Sección de Logros en el perfil, con logros de jugador y de host.
- [ ] Guardado real: hoy los logros se derivan de `stats` en `localStorage`; el
      contador de "casilla favorita" y similares aún no se registran.
- [ ] Revisar el listado definitivo de logros y sus condiciones.

## 5. Ajustes

- [x] Tema claro/oscuro real, autoguardado.
- [x] Toggles de sonido/música/vibración + slider de volumen de música.
- [x] Cadencia de pedidos (Rápido / Normal / Tranquilo).
- [x] Panel de sonido dentro de la partida (rueda dentada en la cabecera).
- [x] Segmento de cadencia/tema ya no ocupa el ancho completo.
- [ ] Toggle de "Música": las pistas suenan, pero confirmar volumen y mezcla.
- [ ] Vibración: usa `navigator.vibrate` (solo Android/Chrome). En iOS no hace
      nada — decidir si se avisa o se oculta.
- [ ] `Rápido = 15 s` es valor de desarrollo; subir a algo realista para
      partida (¿1 min?) antes de publicar.

## 6. Pantalla "Cómo se juega"

- [x] Librito de 4 pasos (menos texto, una ilustración por paso).
- [x] Bloque "En el tablero" con los 4 tipos de casilla.
- [x] Tarjeta de "Pedidos".
- [x] Enlace **Referencia (dev)** que vuelca todo (eventos, bifurcaciones, mapa,
      logros, insignias, personajes).
- [ ] **Borrar la pantalla `DevRefScreen`** (`src/screens/DevRefScreen.jsx`, ruta
      `devref`, enlace en `RulesScreen`) antes de publicar.

## 7. Diseño / pulido

- [x] Sistema 100 % flat / recorte.
- [x] Logo `logo.png` (claro) / `white logo.png` (oscuro). Marca "The Chef's
      Way" (sin "Slammed").
- [x] Confirmaciones antes de cerrar sesión y de salir de la partida.
- [x] Perfil: nombre y descripción se editan en su propio sitio.
- [ ] Renombrar arte pendiente ya hecho en código: `brocoli`→`aguacate`,
      `aros`→`cebolla`. Falta que el nombre de archivo del PNG también lo
      refleje si el equipo quiere (hoy siguen como `Untitled_Artwork N.png`).
- [ ] Revisión de contraste y foco en modo oscuro en las pantallas nuevas
      (`FinaleScreen`, `DevRefScreen`, panel de sonido).
- [ ] Animaciones de transición entre pantallas (nunca se hizo el "Pass 4").

## 8. Técnico

- [ ] `firstForkInPath` / `FORKS` viejos quedaron reemplazados por el grafo;
      revisar que no quede código muerto.
- [ ] Tests: no hay ninguno. Al menos cubrir `advanceGraph` (recorrido del mapa
      con bifurcaciones) y `awardBadges`.
- [ ] `src/game/board.js` es la fuente de verdad del tablero; mantenerlo
      sincronizado con el mapa físico.
