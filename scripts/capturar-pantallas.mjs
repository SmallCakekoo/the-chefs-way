/* Captura automática de todas las pantallas de The Chef's Way.
 *
 *   npm run capturas
 *
 * Levanta Vite en un puerto libre (5199), abre Chromium con Playwright a 1920x1080 y guarda un PNG por pantalla
 * en capturas/ (01-carga.png, 02-menu.png, …). Antes de cada captura espera a que carguen las fuentes y todas
 * las imágenes, y deja pasar las animaciones de entrada.
 *
 * Cómo llega a cada estado: no hace clic por todo el juego; cambia el estado del juego con el mismo `dispatch`
 * que usa la app (lo obtiene del árbol de React) y, para las tiradas, fija el resultado del dado con una cola de
 * valores para Math.random. Así, por ejemplo, "evento positivo" siempre cae en la casilla 5 y la bifurcación
 * siempre sale al tirar un 3 desde la casilla 11.
 *
 * Variables opcionales:
 *   BASE_URL=http://127.0.0.1:5183   usa un servidor ya levantado en vez de arrancar uno propio
 *   SOLO=perfil,logros                captura solo las pantallas cuyo nombre contenga alguno de esos textos
 */
import { chromium } from "playwright";
import { createServer } from "vite";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INGREDIENTS } from "../src/game/board.js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "capturas");
const VIEWPORT = { width: 1920, height: 1080 };
const SOLO = (process.env.SOLO || "").split(",").map((s) => s.trim()).filter(Boolean);
const quiere = (nombre) => !SOLO.length || SOLO.some((s) => nombre.includes(s));

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
// Valor de Math.random que hace que el dado saque `n` (1 + floor(r * 6))
const dado = (n) => (n - 0.5) / 6;

const JUGADORES = [
  { name: "Isa", characterId: "raton" },
  { name: "Natt", characterId: "panda" },
  { name: "Lau", characterId: "pinguino" },
  { name: "Cata", characterId: "gato" },
];

const hechas = [];
const fallidas = [];

/* ---------- servidor y navegador ---------- */
let server = null;
let baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  server = await createServer({
    root: RAIZ,
    logLevel: "error",
    server: { port: 5199, host: "127.0.0.1", strictPort: false },
  });
  await server.listen();
  baseUrl = server.resolvedUrls.local[0];
}
console.log(`App en ${baseUrl}`);

const browser = await chromium.launch();

// Antes de que cargue la app: cola de valores para Math.random, acceso al estado del juego y datos guardados.
function initScript({ die, stats, profile }) {
  window.__rq = [];
  const orig = Math.random.bind(Math);
  Math.random = () => (window.__rq.length ? window.__rq.shift() : orig());

  // El contexto del juego (dispatch, navigate, estado) está en el árbol de React
  window.__game = () => {
    const root = document.getElementById("root");
    const key = Object.keys(root).find((k) => k.startsWith("__reactContainer"));
    const start = root[key].stateNode?.current || root[key];
    const stack = [start];
    while (stack.length) {
      const f = stack.pop();
      if (!f) continue;
      const v = f.memoizedProps && f.memoizedProps.value;
      if (v && typeof v.dispatch === "function" && typeof v.navigate === "function" && "route" in v) return v;
      stack.push(f.sibling, f.child);
    }
    throw new Error("No encontré el contexto del juego");
  };

  try {
    localStorage.setItem("chefsway.die", die);
    if (!localStorage.getItem("slammed.v2")) {
      localStorage.setItem(
        "slammed.v2",
        JSON.stringify({ profile, stats, settings: { orderInterval: "slow" } })
      );
    }
  } catch {
    /* sin almacenamiento */
  }
}

/** Página nueva y limpia (contexto aparte: sin datos de otras capturas). */
async function nuevaPagina({ die = "3d", stats = { gamesPlayed: 0, gamesHosted: 0, wins: 0 }, profile = { name: "Chef invitado", characterId: "huevo", description: "" } } = {}) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  page.on("pageerror", (e) => console.warn(`  [error en la página] ${e.message}`));
  await page.addInitScript(initScript, { die, stats, profile });
  await page.goto(baseUrl, { waitUntil: "load" });
  await page.waitForFunction(() => !!document.getElementById("root")?.firstChild);
  page.cerrar = () => context.close();
  return page;
}

const dispatch = (page, action) => page.evaluate((a) => window.__game().dispatch(a), action);
const navegar = (page, ruta) => page.evaluate((r) => window.__game().navigate(r), ruta);
const estado = (page) =>
  page.evaluate(() => {
    const g = window.__game();
    return { route: g.route, coins: g.coins, orders: g.orders.map((o) => ({ id: o.id, status: o.status })) };
  });
const colaRandom = (page, valores) => page.evaluate((v) => (window.__rq = [...v]), valores);

/** Registra a los jugadores y empieza la partida (queda en la pantalla de turno, casilla de salida). */
async function empezarPartida(page, n = 4) {
  for (const p of JUGADORES.slice(0, n)) await dispatch(page, { type: "addPlayer", player: p });
  await dispatch(page, { type: "startGame" });
  await page.getByRole("button", { name: "Tirar dado" }).waitFor();
}

/** Espera fuentes, imágenes y animaciones, y guarda el PNG. */
async function capturar(page, nombre, { espera = 900 } = {}) {
  if (!quiere(nombre)) return;
  try {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    await pausa(espera);
    await page.screenshot({ path: join(SALIDA, `${nombre}.png`) });
    hechas.push(nombre);
    console.log(`  ✓ ${nombre}.png`);
  } catch (e) {
    fallidas.push(nombre);
    console.warn(`  ✗ ${nombre}: ${e.message.split("\n")[0]}`);
  }
}

/** Corre un grupo de capturas en su propia página; si falla, sigue con el siguiente. */
async function grupo(titulo, nombres, opciones, fn) {
  if (!nombres.some(quiere)) return;
  console.log(titulo);
  let page;
  try {
    page = await nuevaPagina(opciones);
    await fn(page);
  } catch (e) {
    for (const n of nombres) if (!hechas.includes(n) && !fallidas.includes(n) && quiere(n)) fallidas.push(n);
    console.warn(`  ✗ ${titulo}: ${e.message.split("\n")[0]}`);
  } finally {
    await page?.cerrar();
  }
}

/** Tira el dado con un resultado fijo. `extra` = valores para lo que se sortea después (evento, carta…). */
async function tirar(page, valorDado, extra = []) {
  await colaRandom(page, [dado(valorDado), ...extra]);
  await page.getByRole("button", { name: "Tirar dado" }).click();
}

/* ---------- capturas ---------- */
// con SOLO se conservan las demás capturas; sin SOLO se empieza de cero
if (!SOLO.length) rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

await grupo("Carga, menú y selección de personaje", ["01-carga", "02-menu", "03-seleccion-personaje"], {}, async (page) => {
  await page.getByText("Press any key to continue").waitFor();
  await capturar(page, "01-carga");

  await dispatch(page, { type: "menuIntroDone" }); // sin la animación de entrada: menú ya armado
  await navegar(page, "menu");
  await capturar(page, "02-menu", { espera: 1500 });

  for (const p of JUGADORES) await dispatch(page, { type: "addPlayer", player: p });
  await navegar(page, "register");
  await capturar(page, "03-seleccion-personaje", { espera: 1200 });
});

await grupo("Juego con dado 2D", ["04-juego-dado-2d"], { die: "2d" }, async (page) => {
  await empezarPartida(page);
  await tirar(page, 4);
  await pausa(1900); // el dado ya se asentó y todavía no se mueve la ficha
  await capturar(page, "04-juego-dado-2d", { espera: 100 });
});

await grupo("Juego con dado 3D", ["05-juego-dado-3d"], { die: "3d" }, async (page) => {
  await empezarPartida(page);
  await tirar(page, 4);
  await pausa(1900);
  await capturar(page, "05-juego-dado-3d", { espera: 100 });
});

await grupo("Evento positivo (casilla 5, con carta de poder extra)", ["06-evento-positivo-momento", "07-evento-positivo-tarjeta"], {}, async (page) => {
  await empezarPartida(page);
  await tirar(page, 4, [0.1, 0.05, 0]); // 1 + 4 = casilla 5 · primer evento · sale carta de poder extra · primera carta
  await page.getByRole("button", { name: "Pasar el dispositivo" }).waitFor();
  await pausa(1700); // el momento épico a mitad de animación
  await capturar(page, "06-evento-positivo-momento", { espera: 0 });
  await pausa(2300); // termina el momento y queda la tarjeta
  await capturar(page, "07-evento-positivo-tarjeta", { espera: 300 });
});

await grupo("Evento negativo (casilla 14)", ["08-evento-negativo-momento", "09-evento-negativo-tarjeta"], {}, async (page) => {
  await empezarPartida(page);
  await dispatch(page, { type: "applyMove", name: "Isa", square: "13" });
  await tirar(page, 1, [0.1]); // 13 + 1 = casilla 14 · primer evento negativo
  await page.getByRole("button", { name: "Pasar el dispositivo" }).waitFor();
  await pausa(1700);
  await capturar(page, "08-evento-negativo-momento", { espera: 0 });
  await pausa(2300);
  await capturar(page, "09-evento-negativo-tarjeta", { espera: 300 });
});

await grupo("Carta de poder ganada (casilla 10)", ["10-carta-ganada"], {}, async (page) => {
  await empezarPartida(page);
  await dispatch(page, { type: "applyMove", name: "Isa", square: "6" });
  await tirar(page, 4, [0]); // 6 + 4 = casilla 10 · primera carta
  await page.getByRole("button", { name: "Pasar el dispositivo" }).waitFor();
  await capturar(page, "10-carta-ganada", { espera: 1500 });
});

await grupo("Bifurcación (casilla 12)", ["11-bifurcacion"], {}, async (page) => {
  await empezarPartida(page);
  await dispatch(page, { type: "applyMove", name: "Isa", square: "11" });
  await tirar(page, 3); // pasa por la 12: el camino se divide
  await page.getByText("El camino se divide").waitFor();
  await capturar(page, "11-bifurcacion", { espera: 800 });
});

await grupo("Pedido y uso de carta", ["12-pedido", "13-uso-de-carta-arrastrando", "14-uso-de-carta-usada"], {}, async (page) => {
  await empezarPartida(page);
  // una carta para cada jugador: la mano solo muestra las de quienes hacen el pedido
  for (const [i, p] of JUGADORES.entries()) {
    await dispatch(page, { type: "givePowerCard", name: p.name, card: `power card ${(i % 3) + 1}` });
  }
  await dispatch(page, { type: "spawnOrders" });
  await page.locator('[aria-label^="Carta de poder de"]').first().waitFor();
  await pausa(4200); // el cliente termina de "escribir" el pedido
  await capturar(page, "12-pedido", { espera: 300 });

  // arrastra la primera carta hasta el centro de la pantalla
  const carta = page.locator('[aria-label^="Carta de poder de"]').first();
  const caja = await carta.boundingBox();
  const cx = caja.x + caja.width / 2;
  const cy = caja.y + caja.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  const destino = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 }; // el centro de la carta llega al centro de la pantalla
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(cx + ((destino.x - cx) * i) / 12, cy + ((destino.y - cy) * i) / 12);
    await pausa(30);
  }
  await pausa(600); // la carta se "arma" y aparece la zona para soltar
  await capturar(page, "13-uso-de-carta-arrastrando", { espera: 100 });
  await page.mouse.up();
  await pausa(600);
  await capturar(page, "14-uso-de-carta-usada", { espera: 100 });
});

await grupo("Chef Maestro, veredicto y restaurante triunfador", ["15-chef-maestro", "16-chef-veredicto", "18-restaurante-triunfo"], {}, async (page) => {
  await empezarPartida(page);
  await dispatch(page, { type: "applyMove", name: "Isa", square: "50" }); // llega a la meta: visita el Chef
  await page.waitForFunction(() => window.__game().route === "finale");
  await capturar(page, "15-chef-maestro", { espera: 3000 });

  // recorre la escena de verdad: la mesa arma el memory, el Chef dicta y la mesa entrega la comanda
  await page.getByRole("button", { name: "Listos, dicte ya" }).click({ timeout: 90_000 });
  const entregar = page.getByRole("button", { name: /Entregar al Chef/ });
  await entregar.waitFor({ timeout: 60_000 });
  const receta = await page.evaluate(() => window.__game().chef.recipe);
  const comida = page.locator('button[class*="_food_"]');
  for (const id of receta) await comida.nth(INGREDIENTS.findIndex((i) => i.id === id)).click();
  await entregar.click();
  await page.getByText("Veredicto del Chef").waitFor();
  await capturar(page, "16-chef-veredicto", { espera: 3200 }); // estrellas ya encendidas

  await page.getByRole("button", { name: "Continuar" }).click(); // el Chef paga y se cierra la partida
  await page.waitForFunction(() => window.__game().route === "results");
  await capturar(page, "18-restaurante-triunfo", { espera: 3200 });
});

await grupo("Restaurante en quiebra", ["17-restaurante-quebro"], {}, async (page) => {
  await empezarPartida(page);
  // deja vencer pedidos hasta que las monedas se acaben
  for (let vuelta = 0; vuelta < 12; vuelta++) {
    await dispatch(page, { type: "spawnOrders" });
    await pausa(80);
    const { route, orders } = await estado(page);
    if (route === "results") break;
    for (const o of orders.filter((x) => x.status === "pending")) {
      await dispatch(page, { type: "expireOrder", id: o.id });
      await pausa(40);
    }
    if ((await estado(page)).route === "results") break;
  }
  await page.waitForFunction(() => window.__game().route === "results");
  await capturar(page, "17-restaurante-quebro", { espera: 3200 });
});

const MI_PROGRESO = { gamesPlayed: 5, gamesHosted: 2, wins: 1 }; // algunos logros ganados y otros por descubrir
await grupo("Perfil y logros", ["19-perfil", "20-logros"], { stats: MI_PROGRESO }, async (page) => {
  await navegar(page, "profile");
  await page.getByRole("button", { name: "Ficha del chef" }).waitFor();
  await capturar(page, "19-perfil", { espera: 1500 });
  await page.getByRole("button", { name: "Logros" }).click();
  await capturar(page, "20-logros", { espera: 1500 });
});

await grupo("Ajustes", ["21-ajustes"], {}, async (page) => {
  await navegar(page, "settings");
  await capturar(page, "21-ajustes", { espera: 1200 });
});

/* ---------- cierre ---------- */
await browser.close();
if (server) await server.close();

const archivos = readdirSync(SALIDA).filter((f) => f.endsWith(".png"));
console.log(`\n${archivos.length} capturas en ${SALIDA}`);
if (fallidas.length) {
  console.log(`Fallaron: ${fallidas.join(", ")}`);
  process.exit(1);
}
process.exit(0);
