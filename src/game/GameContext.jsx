import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  FINAL_NODE,
  START_NODE,
  MIN_PLAYERS,
  CHEFS,
  POWER_CARD_INFO,
  DEMAND_STEPS,
  EXTRA_MEMORY_MS,
  retreatGraph,
  stepForward,
} from "./board.js";
import { normalizeStats } from "./achievements.js";
import {
  intervalMs,
  spawnBatch,
  DEFAULT_INTERVAL,
  COIN_START,
  COIN_REWARD,
  COIN_PENALTY,
} from "./orders.js";
import { awardBadges } from "./badges.js";
import { CHEF, makeChefRecipe, mutateRecipe, chefCoinsFor } from "./chef.js";
import { sfx, setSfxEnabled, setHapticsEnabled } from "../lib/sfx.js";
import { setMusicEnabled, setMusicVolume, armMusic } from "../lib/music.js";

const GameContext = createContext(null);

const LS_KEY = "slammed.v2";

const DEFAULTS = {
  profile: { name: "Chef invitado", characterId: "chef-oso", description: "" },
  settings: {
    sound: true,
    music: true,
    musicVolume: 0.6,
    haptics: true,
    orderInterval: DEFAULT_INTERVAL,
  },
  stats: normalizeStats(),
};

function loadPersisted() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw);
    return {
      profile: { ...DEFAULTS.profile, ...(p.profile || {}) },
      // `theme` era del modo oscuro (ya no existe): se descarta si venía guardado
      settings: (({ theme, ...rest }) => ({ ...DEFAULTS.settings, ...rest }))(p.settings || {}),
      stats: normalizeStats(p.stats),
    };
  } catch {
    return DEFAULTS;
  }
}

function persist(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        profile: state.profile,
        settings: state.settings,
        stats: state.stats,
      })
    );
  } catch {
    /* almacenamiento no disponible: seguimos en memoria */
  }
}

/* Partida en curso: se guarda aparte (GAME_KEY) mientras se juega, para poder seguirla después de recargar o
   cerrar la app. Al volver, los relojes se corren lo que duró la ausencia (nadie pierde pedidos por irse). */
const GAME_KEY = "chefsway.partida";
const GAME_FIELDS = [
  "players", "order", "posOf", "finishedOf", "finishOrder", "turnIdx", "turnNo", "statsAwarded",
  "orders", "orderSeq", "nextOrderAt", "perPlayer", "coins", "chef", "chefResult", "chefStartedAt",
  "trailOf", "skipOf", "happyUntil", "collab", "movedTurn", "pausedAt", "route",
];
function loadSavedGame() {
  if (typeof window === "undefined") return null;
  try {
    const g = JSON.parse(localStorage.getItem(GAME_KEY) || "null");
    return g && Array.isArray(g.order) && g.order.length ? g : null;
  } catch {
    return null;
  }
}
function saveGame(state) {
  try {
    const g = Object.fromEntries(GAME_FIELDS.map((k) => [k, state[k]]));
    localStorage.setItem(GAME_KEY, JSON.stringify({ ...g, savedAt: Date.now() }));
  } catch {
    /* sin almacenamiento */
  }
}
function clearSavedGame() {
  try {
    localStorage.removeItem(GAME_KEY);
  } catch {
    /* sin almacenamiento */
  }
}

/** Corre todos los relojes de la partida `ms` hacia adelante (pausa, o tiempo fuera de la app). */
function shiftClocks(state, ms) {
  if (!ms) return state;
  return {
    ...state,
    orders: state.orders.map((o) =>
      o.status === "pending"
        ? {
            ...o,
            prepUntil: o.prepUntil ? o.prepUntil + ms : o.prepUntil,
            dueAt: o.dueAt ? o.dueAt + ms : o.dueAt,
            bonusAt: o.bonusAt ? o.bonusAt + ms : o.bonusAt,
          }
        : o
    ),
    nextOrderAt: state.nextOrderAt ? state.nextOrderAt + ms : state.nextOrderAt,
    chefStartedAt: state.chefStartedAt ? state.chefStartedAt + ms : state.chefStartedAt,
  };
}

function makeInitial() {
  const p = loadPersisted();
  return {
    route: "login",
    // la animación de entrada del menú solo va la primera vez y al volver del final de partida
    menuIntro: true,
    players: [],
    order: [],
    posOf: {},
    finishedOf: {},
    finishOrder: [],
    turnIdx: 0,
    turnNo: 0,
    statsAwarded: false,
    orders: [],
    orderSeq: 0,
    nextOrderAt: null,
    perPlayer: {},
    badges: null,
    coins: COIN_START,
    bankrupt: false,
    chef: null, // pedido del Chef Maestro: { attempt, title, recipe, changed, failures }
    chefResult: null, // { stars, attempt, left } cuando el Chef ya terminó (estrellas o "se fue")
    chefStartedAt: 0,
    trailOf: {}, // casillas por las que pasó cada jugador (para retroceder por el mismo camino)
    skipOf: {}, // turnos que cada jugador debe saltarse (demanda)
    happyUntil: -1, // Hora feliz: activa mientras turnNo < happyUntil
    collab: null, // Colaboración del día: { until, doers: [], done }
    toasts: [], // avisos cortos: { id, text, kind }
    movedTurn: -1, // último turno en el que el jugador en turno ya movió su ficha
    pausedAt: null, // relojes en pausa (p. ej. mientras se elige a quién demandar)
    savedGame: !!loadSavedGame(), // hay una partida guardada para "Continuar"
    ...p,
  };
}

/** Suma `n` al contador `key` de cada jugador de `names` (estadísticas de la partida, para las insignias). */
function bump(state, names, key, n = 1) {
  if (!names?.length) return state;
  const perPlayer = { ...state.perPlayer };
  names.forEach((name) => {
    const pp = perPlayer[name] || {};
    perPlayer[name] = { ...pp, [key]: (pp[key] || 0) + n };
  });
  return { ...state, perPlayer };
}

let toastSeq = 0;
/** Agrega un aviso corto (lo pinta <Toasts/> y se borra solo). */
function toast(state, text, kind = "info") {
  return { ...state, toasts: [...state.toasts, { id: ++toastSeq, text, kind }].slice(-4) };
}
const happyOn = (state) => state.turnNo < state.happyUntil;
// jugadores que siguen en el tablero (los que llegaron a la meta son ayudantes)
const playingNames = (state) => state.order.filter((n) => !state.finishedOf[n]);

/** Hace retroceder a `name` `steps` casillas por el camino que recorrió. */
function retreat(state, name, steps) {
  const from = state.posOf[name] ?? START_NODE;
  const to = retreatGraph(from, steps, state.trailOf[name]);
  return { ...state, posOf: { ...state.posOf, [name]: to } };
}

/** Quita una carta de la mano de un jugador (por índice o por id de carta). */
function dropCard(state, name, { index, card }) {
  return {
    ...state,
    players: state.players.map((p) => {
      if (p.name !== name) return p;
      const hand = [...(p.powerCards || [])];
      const i = index ?? hand.indexOf(card);
      if (i >= 0) hand.splice(i, 1);
      return { ...p, powerCards: hand };
    }),
  };
}

/** Demanda: el demandado retrocede y pierde su próximo turno. */
function sue(state, name) {
  const next = retreat(state, name, DEMAND_STEPS);
  return { ...next, skipOf: { ...next.skipOf, [name]: (next.skipOf[name] || 0) + 1 } };
}

/** Quién es "yo" en la mesa: el jugador con el mismo nombre que el perfil; si nadie se llama así,
 *  el primero que se registró (normalmente quien tiene el dispositivo). */
export function meIn(state) {
  const mine = state.profile.name.trim().toLowerCase();
  return state.order.find((n) => n.trim().toLowerCase() === mine) || state.order[0] || null;
}

/** Cierra la partida: reparte insignias y suma a las estadísticas guardadas del perfil (una sola vez por partida). */
function recordGame(state, { bankrupt }) {
  const badges = awardBadges(state.order, state.posOf, state.finishOrder, state.perPlayer);
  let stats = state.stats;
  if (!state.statsAwarded) {
    const me = meIn(state);
    const pp = state.perPlayer[me] || {};
    const myBadge = badges.find((b) => b.name === me)?.badge;
    stats = normalizeStats(stats);
    stats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      wins: stats.wins + (!bankrupt && me && state.finishOrder[0] === me ? 1 : 0),
      ordersDelivered: stats.ordersDelivered + (pp.orders || 0),
      eventsHit: stats.eventsHit + (pp.events || 0),
      shortcuts: stats.shortcuts + (pp.shortcuts || 0),
      sixes: stats.sixes + (pp.sixes || 0),
      cardsUsed: stats.cardsUsed + (pp.cards || 0),
      bankruptcies: stats.bankruptcies + (bankrupt ? 1 : 0),
      bestCoins: stats.bestCoins == null ? state.coins : Math.max(stats.bestCoins, state.coins),
      bestChefStars: Math.max(stats.bestChefStars, state.chefResult?.stars || 0),
      badges: myBadge ? { ...stats.badges, [myBadge.id]: (stats.badges[myBadge.id] || 0) + 1 } : stats.badges,
      lastBadge: myBadge ? { id: myBadge.id, player: me } : null,
    };
  }
  clearSavedGame();
  return {
    ...state,
    savedGame: false,
    stats,
    badges,
    statsAwarded: true,
    nextOrderAt: null,
    bankrupt,
    route: "results",
  };
}

const finishGame = (state) => recordGame(state, { bankrupt: false });
// Las monedas llegaron a 0: se acaba la partida por quiebra, no por llegar a la meta.
const bankruptGame = (state) => recordGame(state, { bankrupt: true });

// pasa al siguiente jugador que sigue jugando (los ayudantes se saltan)
function advanceTurn(state) {
  if (state.order.every((n) => state.finishedOf[n])) {
    return finishGame(state);
  }
  let turnIdx = state.turnIdx;
  let skipOf = state.skipOf;
  let next = state;
  // un jugador demandado se salta su turno (una vez por demanda); si todos deben saltar, alguien juega igual
  for (let guard = 0; guard < state.order.length * 3; guard++) {
    turnIdx = (turnIdx + 1) % state.order.length;
    const name = state.order[turnIdx];
    if (state.finishedOf[name]) continue;
    if (skipOf[name] > 0 && guard < state.order.length * 2) {
      skipOf = { ...skipOf, [name]: skipOf[name] - 1 };
      next = toast(next, `${name} pierde este turno por la demanda.`, "bad");
      continue;
    }
    break;
  }
  return { ...next, skipOf, turnIdx, turnNo: state.turnNo + 1 };
}

function reducer(state, action) {
  switch (action.type) {
    case "navigate":
      return { ...state, route: action.route };

    case "addPlayer": {
      if (state.players.length >= 4) return state;
      return { ...state, players: [...state.players, action.player] };
    }

    case "removePlayer":
      return {
        ...state,
        players: state.players.filter((_, i) => i !== action.index),
      };

    case "startGame": {
      if (state.players.length < MIN_PLAYERS) return state;
      const order = state.players.map((p) => p.name);
      const posOf = {};
      const finishedOf = {};
      const perPlayer = {};
      order.forEach((n) => {
        posOf[n] = START_NODE;
        finishedOf[n] = false;
        perPlayer[n] = { orders: 0, assigned: 0, expired: 0, events: 0, shortcuts: 0, sixes: 0, rolls: 0, cards: 0 };
      });
      return {
        ...state,
        order,
        posOf,
        finishedOf,
        finishOrder: [],
        turnIdx: 0,
        turnNo: 0,
        statsAwarded: false,
        orders: [],
        orderSeq: 0,
        perPlayer,
        badges: null,
        coins: COIN_START,
        bankrupt: false,
        chef: null,
        chefResult: null,
        chefStartedAt: 0,
        skipOf: {},
        happyUntil: -1,
        collab: null,
        toasts: [],
        movedTurn: -1,
        pausedAt: null,
        trailOf: Object.fromEntries(order.map((n) => [n, [START_NODE]])),
        nextOrderAt: Date.now() + intervalMs(state.settings.orderInterval),
        stats: { ...normalizeStats(state.stats), gamesHosted: (state.stats.gamesHosted || 0) + 1 },
        route: "turn",
      };
    }

    case "noteRoll": {
      const pp = state.perPlayer[action.name] || {};
      return {
        ...state,
        perPlayer: {
          ...state.perPlayer,
          [action.name]: {
            ...pp,
            rolls: (pp.rolls || 0) + 1,
            sixes: (pp.sixes || 0) + (action.value === 6 ? 1 : 0),
          },
        },
      };
    }
    case "noteShortcut": {
      const pp = state.perPlayer[action.name] || {};
      return {
        ...state,
        perPlayer: {
          ...state.perPlayer,
          [action.name]: { ...pp, shortcuts: (pp.shortcuts || 0) + 1 },
        },
      };
    }
    case "noteEvent": {
      const pp = state.perPlayer[action.name] || {};
      return {
        ...state,
        perPlayer: {
          ...state.perPlayer,
          [action.name]: { ...pp, events: (pp.events || 0) + 1 },
        },
      };
    }

    case "applyMove": {
      const { name, square, path = [square] } = action;
      const posOf = { ...state.posOf, [name]: square };
      const trailOf = { ...state.trailOf, [name]: [...(state.trailOf[name] || [START_NODE]), ...path] };
      let finishedOf = state.finishedOf;
      let finishOrder = state.finishOrder;
      let extra = {};
      if (square === FINAL_NODE && !state.finishedOf[name]) {
        finishedOf = { ...state.finishedOf, [name]: true };
        finishOrder = [...state.finishOrder, name];
        // el que llega pasa a ser ayudante (ya no tira el dado) y el Chef Maestro visita la mesa.
        // Hay un intento por cada jugador que llega, mientras el pedido no se haya completado.
        if (!state.chefResult) {
          const attempt = finishOrder.length;
          let chef;
          if (!state.chef) {
            const r = makeChefRecipe();
            chef = { attempt, title: r.title, recipe: r.recipe, changed: null, failures: 0 };
          } else {
            const m = mutateRecipe(state.chef.recipe);
            chef = { ...state.chef, attempt, recipe: m.recipe, changed: m.changed };
          }
          extra = { chef, route: "finale", chefStartedAt: Date.now() };
        }
      }
      return { ...state, posOf, trailOf, finishedOf, finishOrder, movedTurn: state.turnNo, ...extra };
    }

    case "nextTurn":
      return advanceTurn(state);

    // veredicto del Chef Maestro (0 a 5 estrellas)
    case "chefVerdict": {
      const chef = state.chef;
      if (!chef) return state;
      const { stars } = action;
      if (stars >= 1) {
        // completado: suma monedas y se cierra la partida (igual que antes con el super pedido)
        return finishGame({
          ...state,
          coins: state.coins + chefCoinsFor(stars),
          chef: { ...chef, done: true },
          chefResult: { stars, attempt: chef.attempt, left: false },
        });
      }
      // 0 estrellas: fallo, cuesta monedas
      let coins = state.coins - CHEF.failCost;
      const failures = (chef.failures || 0) + 1;
      // un intento por jugador que llega: si el último llegó y falla, el Chef se va
      if (chef.attempt >= state.order.length) {
        coins -= CHEF.leavePenalty;
        const done = {
          ...state,
          coins,
          chef: { ...chef, failures, done: true },
          chefResult: { stars: 0, attempt: chef.attempt, left: true },
        };
        return coins <= 0 ? bankruptGame(done) : finishGame(done);
      }
      // sigue la partida: los relojes de pedidos esperaron mientras el Chef estaba en la mesa
      const elapsed = Date.now() - (state.chefStartedAt || Date.now());
      const orders = state.orders.map((o) =>
        o.status === "pending"
          ? {
              ...o,
              dueAt: o.dueAt ? o.dueAt + elapsed : o.dueAt,
              prepUntil: o.prepUntil ? o.prepUntil + elapsed : o.prepUntil,
            }
          : o
      );
      const next = {
        ...state,
        coins,
        orders,
        chef: { ...chef, failures },
        nextOrderAt: state.nextOrderAt ? state.nextOrderAt + elapsed : state.nextOrderAt,
        route: "turn",
      };
      return coins <= 0 ? bankruptGame(next) : advanceTurn(next);
    }

    // una casilla de carta de poder: el jugador guarda la carta en su mano
    case "givePowerCard":
      return {
        ...state,
        players: state.players.map((p) =>
          p.name === action.name
            ? { ...p, powerCards: [...(p.powerCards || []), action.card] }
            : p
        ),
      };

    // efecto de un evento de casilla (ver EVENTS / NEGATIVE_EVENTS en board.js)
    case "applyEvent": {
      const { name, fx = {} } = action;
      let next = state;
      if (fx.back) next = retreat(next, name, fx.back);
      if (fx.coins) next = { ...next, coins: next.coins + fx.coins };
      if (fx.coinsPerPlayer) next = { ...next, coins: next.coins + fx.coinsPerPlayer * next.order.length };
      // "una ronda" = hasta que vuelva a tocarle a cada jugador que sigue en el tablero
      const round = next.turnNo + Math.max(1, playingNames(next).length);
      if (fx.happyHour) next = { ...next, happyUntil: round };
      if (fx.collab) next = { ...next, collab: { until: round, doers: [], done: false } };
      return next.coins <= 0 ? bankruptGame(next) : next;
    }

    // el jugador usa una carta (la arrastra al centro): sale de su mano y hace su efecto
    case "usePowerCard": {
      const { name, index, card, orderId, target } = action;
      let next = bump(dropCard(state, name, { index }), [name], "cards");
      const info = POWER_CARD_INFO[card] || {};
      if (card === "15 segundos en memory") {
        const now = Date.now();
        next = {
          ...next,
          orders: next.orders.map((o) => {
            if (o.id !== orderId || o.status !== "pending") return o;
            // si el memory sigue armándose, el tiempo extra va ahí; el pedido se vence 15 s después
            const inPrep = o.prepUntil && now < o.prepUntil;
            return {
              ...o,
              prepUntil: inPrep ? o.prepUntil + EXTRA_MEMORY_MS : o.prepUntil,
              dueAt: o.dueAt ? o.dueAt + EXTRA_MEMORY_MS : o.dueAt,
              bonusAt: now,
            };
          }),
        };
        return toast(next, `${name} sumó 15 segundos al pedido.`, "good");
      }
      if (card === "dolb turno memoria") {
        next = {
          ...next,
          orders: next.orders.map((o) =>
            o.id === orderId ? { ...o, doubleTurn: [...(o.doubleTurn || []), name] } : o
          ),
        };
        return toast(next, `${name} juega dos turnos seguidos en el memory.`, "good");
      }
      if (card === "demandar jugador" && target) {
        // el demandado puede devolver la demanda con su carta: le rebota a quien demandó
        if (action.bounce) {
          next = bump(dropCard(next, target, { card: "devolver demanda" }), [target], "cards");
          next = sue(next, name);
          return toast(next, `${target} devolvió la demanda: ${name} retrocede ${DEMAND_STEPS} casillas y pierde su próximo turno.`, "bad");
        }
        next = sue(next, target);
        return toast(next, `${name} demandó a ${target}: retrocede ${DEMAND_STEPS} casillas y pierde su próximo turno.`, "bad");
      }
      if (card === "robar dee ingrediente a otro jugador" && target) {
        return toast(next, `${name} le roba una carta de ingrediente a ${target}. ¡Tómala de su lado del memory!`, "good");
      }
      return toast(next, `${name} usó ${info.name || "una carta"}.`, "good");
    }

    case "toast":
      return toast(state, action.text, action.kind);

    case "dismissToast":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case "menuIntroDone":
      return state.menuIntro ? { ...state, menuIntro: false } : state;

    // la mesa terminó de armar el memory antes de tiempo: empieza ya el paso 2 (jugar).
    // El vencimiento no se mueve: lo que sobró del armado queda como tiempo extra para jugar.
    case "memoryReady": {
      const now = Date.now();
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id && o.status === "pending" && o.prepUntil > now ? { ...o, prepUntil: now } : o
        ),
      };
    }

    // pausa y reanuda los relojes de los pedidos (el tiempo en pausa no cuenta)
    case "pauseClocks":
      return state.pausedAt ? state : { ...state, pausedAt: Date.now() };
    case "resumeClocks": {
      if (!state.pausedAt) return state;
      return { ...shiftClocks(state, Date.now() - state.pausedAt), pausedAt: null };
    }

    // seguir la partida guardada: los relojes esperaron mientras la app estuvo cerrada
    case "resumeSavedGame": {
      const g = loadSavedGame();
      if (!g) return { ...state, savedGame: false };
      const away = Date.now() - (g.pausedAt || g.savedAt || Date.now());
      let next = shiftClocks({ ...state, ...g, pausedAt: null, toasts: [], badges: null, bankrupt: false }, Math.max(0, away));
      next = { ...next, route: g.route === "finale" && next.chef && !next.chefResult ? "finale" : "turn" };
      // si el jugador en turno ya había movido su ficha, sigue el siguiente
      if (next.route === "turn" && next.movedTurn === next.turnNo) next = advanceTurn(next);
      return toast(next, "Partida recuperada. ¡A seguir cocinando!", "good");
    }

    case "resetGame":
      clearSavedGame();
      return {
        ...state,
        menuIntro: action.intro ?? state.menuIntro,
        players: [],
        order: [],
        posOf: {},
        finishedOf: {},
        finishOrder: [],
        turnIdx: 0,
        turnNo: 0,
        statsAwarded: false,
        orders: [],
        orderSeq: 0,
        nextOrderAt: null,
        perPlayer: {},
        badges: null,
        coins: COIN_START,
        bankrupt: false,
        chef: null,
        chefResult: null,
        chefStartedAt: 0,
        trailOf: {},
        skipOf: {},
        happyUntil: -1,
        collab: null,
        toasts: [],
        movedTurn: -1,
        pausedAt: null,
        savedGame: false,
        route: "menu",
      };

    case "spawnOrders": {
      if (!state.nextOrderAt) return state;
      // quien ya llegó a la meta es ayudante: los pedidos se asignan solo a quienes siguen jugando
      const playing = state.order.filter((n) => !state.finishedOf[n]);
      const batch = spawnBatch(
        state.orderSeq,
        playing.length ? playing : state.order,
        state.orders.filter((o) => o.status === "pending").map((o) => o.cat)
      );
      const next = batch.orders.reduce((st, o) => bump(st, o.assignees, "assigned"), state);
      return {
        ...next,
        orders: [...state.orders, ...batch.orders],
        orderSeq: batch.seq,
        nextOrderAt: Date.now() + intervalMs(state.settings.orderInterval),
      };
    }

    // el prep de otro pedido esta corriendo: el reloj del proximo pedido
    // no avanza (se empuja hacia adelante lo mismo que paso el tiempo real).
    case "postponeNextOrder":
      if (!state.nextOrderAt) return state;
      return { ...state, nextOrderAt: state.nextOrderAt + action.ms };

    // un pedido se vencio sin entregarse: le pega al restaurante.
    case "expireOrder": {
      const target = state.orders.find(
        (o) => o.id === action.id && o.status === "pending"
      );
      if (!target) return state;
      const orders = state.orders.map((o) =>
        o.id === action.id ? { ...o, status: "expired" } : o
      );
      // sin clamp: el ultimo pedido que las hace quebrar puede dejarlas en
      // negativo (p.ej. 10 monedas - 18 = -8), se muestra tal cual en el cierre.
      const coins = state.coins - COIN_PENALTY;
      const next = bump({ ...state, orders, coins }, target.assignees, "expired");
      return coins <= 0 ? bankruptGame(next) : next;
    }

    case "setOrderCheck": {
      const cycle = { null: "yes", yes: "no", no: null };
      return {
        ...state,
        orders: state.orders.map((o) => {
          if (o.id !== action.id) return o;
          const cur = o.check?.[action.idx] ?? null;
          return {
            ...o,
            check: { ...o.check, [action.idx]: cycle[String(cur)] },
          };
        }),
      };
    }

    case "deliverOrder": {
      const target = state.orders.find((o) => o.id === action.id);
      const orders = state.orders.map((o) =>
        o.id === action.id
          ? { ...o, status: "done", deliveredAt: Date.now() }
          : o
      );
      // ¿qué tan bien salió? ✓ suma, ✕ resta: todo ✓ = +recompensa, todo ✕ = -recompensa
      const items = target?.items || [];
      const yes = items.filter((_, i) => target.check?.[i] === "yes").length;
      const no = items.filter((_, i) => target.check?.[i] === "no").length;
      const score = items.length ? (yes - no) / items.length : 1;
      // crédito de "manos rápidas" a quien(es) hicieron el pedido (solo si salió mejor que mal)
      let perPlayer = state.perPlayer;
      if (target?.assignees?.length && score > 0) {
        perPlayer = { ...perPlayer };
        target.assignees.forEach((n) => {
          const pp = perPlayer[n] || {};
          perPlayer[n] = { ...pp, orders: (pp.orders || 0) + 1 };
        });
      }
      // el super pedido del final cerró: a resultados
      if (target?.finale) {
        return finishGame({ ...state, orders, perPlayer });
      }
      // entregado: el restaurante gana o pierde moneditas según cómo quedó (Hora feliz: lo ganado vale doble)
      const mult = score > 0 && happyOn(state) ? 2 : 1;
      const coins = state.coins + Math.round(COIN_REWARD * score) * mult;
      let next = { ...state, orders, perPlayer, coins };
      // Colaboración del día: cuando 2+ jugadores distintos entregan pedidos en la ronda, todos avanzan 1 casilla
      const c = state.collab;
      if (c && !c.done && state.turnNo < c.until && score > 0 && target?.assignees?.length) {
        const doers = [...new Set([...c.doers, ...target.assignees])];
        next = { ...next, collab: { ...c, doers } };
        if (doers.length >= 2) {
          const posOf = { ...next.posOf };
          const trailOf = { ...next.trailOf };
          playingNames(next).forEach((n) => {
            const to = stepForward(posOf[n] ?? START_NODE);
            if (to !== posOf[n]) {
              posOf[n] = to;
              trailOf[n] = [...(trailOf[n] || []), to];
            }
          });
          next = toast(
            { ...next, posOf, trailOf, collab: { ...next.collab, done: true } },
            "¡Colaboración del día! Todos avanzan 1 casilla.",
            "good"
          );
        }
      }
      return coins <= 0 ? bankruptGame(next) : next;
    }

    case "setSetting":
      return {
        ...state,
        settings: { ...state.settings, [action.key]: action.value },
      };

    case "setProfile":
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case "logout":
      return {
        ...makeInitial(),
        // conserva lo persistido pero vuelve al login
        route: "login",
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitial);

  // persistencia (autoguardado, sin boton)
  useEffect(() => {
    persist(state);
  }, [state.profile, state.settings, state.stats]);

  // partida en curso: se guarda en cada cambio mientras se juega (turno o Chef Maestro)
  useEffect(() => {
    if ((state.route === "turn" || state.route === "finale") && state.order.length) saveGame(state);
  }, [state]);

  // sonido y vibracion
  useEffect(() => {
    setSfxEnabled(state.settings.sound);
  }, [state.settings.sound]);
  useEffect(() => {
    setHapticsEnabled(state.settings.haptics);
  }, [state.settings.haptics]);

  // musica de fondo (volumen bajito). Arranca con el primer gesto.
  useEffect(() => {
    setMusicEnabled(state.settings.music);
  }, [state.settings.music]);
  useEffect(() => {
    setMusicVolume(state.settings.musicVolume);
  }, [state.settings.musicVolume]);
  useEffect(() => {
    const arm = () => armMusic();
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, []);

  // solo cuenta como "en partida" si estas en una pantalla de juego
  const inGame = state.route === "turn" || state.route === "orders";

  // aviso de pedido nuevo: suena y vibra siempre que llega uno durante la
  // partida, desde cualquier pantalla de juego. Ignora los toggles.
  const prevOrderCount = useRef(state.orders.length);
  useEffect(() => {
    if (state.orders.length > prevOrderCount.current && inGame) sfx.orderAlert();
    prevOrderCount.current = state.orders.length;
  }, [state.orders.length, inGame]);

  // un pedido se vencio (bajaron las monedas sin que fuera por entrega):
  // aviso sonoro/haptico, respeta los toggles de sonido.
  const prevCoins = useRef(state.coins);
  useEffect(() => {
    if (state.coins < prevCoins.current && inGame) sfx.expire();
    prevCoins.current = state.coins;
  }, [state.coins, inGame]);

  // timer de pedidos: solo corre en pantallas de partida. Cada segundo:
  // 1) vence los pedidos cuyo `dueAt` ya paso (le pega al restaurante),
  // 2) si algun pedido pendiente sigue en su ventana de prep, PAUSA el
  //    reloj del proximo pedido (lo empuja lo que avanzo el tiempo real),
  // 3) si no, y ya toca, suelta el proximo lote.
  // Usa un ref para leer el estado mas fresco sin reiniciar el intervalo
  // en cada cambio de `orders` (el checklist los muta todo el tiempo).
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (!inGame) return;
    let last = Date.now();
    const id = setInterval(() => {
      const s = stateRef.current;
      const now = Date.now();
      const delta = now - last;
      last = now;
      if (s.pausedAt) return; // relojes en pausa: nada se vence ni llega

      s.orders.forEach((o) => {
        if (o.status === "pending" && !o.finale && o.dueAt && now >= o.dueAt) {
          dispatch({ type: "expireOrder", id: o.id });
        }
      });

      const anyPrep = s.orders.some(
        (o) =>
          o.status === "pending" &&
          !o.finale &&
          o.prepUntil &&
          now < o.prepUntil
      );
      if (anyPrep) {
        if (s.nextOrderAt) dispatch({ type: "postponeNextOrder", ms: delta });
        return;
      }
      if (s.nextOrderAt && now >= s.nextOrderAt) {
        dispatch({ type: "spawnOrders" });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [inGame]);

  const value = useMemo(() => {
    const currentName = state.order[state.turnIdx];
    return {
      ...state,
      dispatch,
      currentName,
      currentPlayer: state.players.find((p) => p.name === currentName) || null,
      navigate: (route) => dispatch({ type: "navigate", route }),
      characters: CHEFS,
      pendingOrders: state.orders.filter((o) => o.status === "pending"),
      happyHour: happyOn(state),
      collabOn: !!state.collab && !state.collab.done && state.turnNo < state.collab.until,
      // hora de los relojes: congelada mientras están en pausa
      clockNow: () => state.pausedAt || Date.now(),
    };
  }, [state]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
