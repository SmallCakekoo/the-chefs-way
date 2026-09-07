# Slammed — Chef's Way (prototipo)

Companion del juego de mesa cooperativo de cocina. React + Vite, sin backend.
Pensado para tablet en horizontal (1024×768); baja a columna móvil < 900 px.

## Correr

```bash
npm install
npm run dev      # http://127.0.0.1:5183
npm run build    # dist/
```

## Estructura

```
src/
  main.jsx / App.jsx        arranque + router por estado (sin react-router)
  styles/                   tokens.css (sistema FLAT) + base.css (@font-face, reset)
  lib/sfx.js                sonidos WebAudio + vibración (navigator.vibrate)
  game/
    GameContext.jsx         estado global + persistencia en localStorage (autoguardado)
    board.js                tablero, tipos de casilla, EVENTS, CHARACTERS (alimentos)
    forks.js                bifurcaciones según el mapa
    achievements.js         logros de jugador y de host
  components/               Button, Card, Screen/Pane, TopBar, Die, PlayerChip,
                            PressablePill, Roster, Toggle, Field, Tag, Text, Ribbon,
                            Confetti, CharacterAvatar, CharacterPicker, AchievementList,
                            ConfirmDialog
  screens/                  login, menu, onboarding, register, turn, results, rules,
                            profile, settings

public/logo.png             marca "The Chef's Way" (pantalla de inicio)
public/alimentos/           personajes-alimento (PNG, carita, escala variable)
public/fonts/               TuneoMuch.woff2 (display, sin tildes) + SatoshiVariable.woff2
```

## Diseño — FLAT / recorte

Sistema 100% plano: sin sombras de elevación, sin labios 3D. La profundidad
viene de bloques de color sólidos, contornos finos de tinta (`box-shadow: inset`),
capas que se solapan y cintas con forma de banderín. Paleta anclada al logo
(rojo-naranja, naranja, negro sartén, crema). Dos tipografías: Tuneo Much
(wordmark) + Satoshi (todo lo demás). Tema claro/oscuro real, se autoguarda.

Nota: las transiciones que animan `transform` usan curvas literales (no
`var(--ease-*)`) por un bug del navegador embebido de preview.

## Flujo

- **Login**: solo "Entrar como invitado".
- **Primera vez**: invitado → onboarding (3 pantallas) → menú. Después va directo al menú.
- **Jugar**: menú → registro (2 a 4 jugadores, personaje obligatorio) → turnos → resultado.
- **Turnos**: tiras el dado, avanzas; casilla A/B = robar carta, Y = evento concreto,
  bifurcación = eliges rama. Todo en una columna centrada.

## Pedidos (timer)

Durante la partida sale un pedido solo cada cierto tiempo (`src/game/orders.js`,
timer en `GameContext`). La pantalla de turno muestra la cuenta atrás; cuando hay
pedidos pendientes aparece "N pendientes · Ver" y se abre la pantalla **Pedidos**
(un gatito pide un plato, con la lista de ingredientes y a quién le toca).
Cadencia en Ajustes: Rápido ~1 min / Normal ~2 min / Tranquilo ~3 min (±30%).

## Pendiente

- **Memory + checklist** (siguiente tanda): "Marcar como entregado" es un stub.
  Falta el memory físico y el **checklist de ingredientes** (clic: ✓ → ✗ → vacío)
  que hacen los demás jugadores, y que el tiempo cuente para la quiebra del
  restaurante y el empleado del mes.
- Assets: la carpeta `public/alimentos` sigue creciendo y las imágenes vienen en
  vertical / sin escala 1:1 (se encuadran con `object-fit: contain`).
- Toggle de "Música" guarda preferencia pero aún no hay música.
- Reglas: texto definitivo del equipo.
