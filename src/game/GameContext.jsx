import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { FINAL_NODE, MIN_PLAYERS, CHARACTERS } from "./board.js";
import { EMPTY_STATS } from "./achievements.js";
import {
  intervalMs,
  spawnBatch,
  makeFinaleOrder,
  DEFAULT_INTERVAL,
  COIN_START,
  COIN_REWARD,
  COIN_PENALTY,
} from "./orders.js";
import { awardBadges } from "./badges.js";
import { sfx, setSfxEnabled, setHapticsEnabled } from "../lib/sfx.js";
import { setMusicEnabled, setMusicVolume, armMusic } from "../lib/music.js";

const GameContext = createContext(null);

const LS_KEY = "slammed.v2";

const DEFAULTS = {
  profile: { name: "Chef invitado", characterId: "queso", description: "" },
  settings: {
    sound: true,
    music: true,
    musicVolume: 0.6,
    haptics: true,
    theme: "light",
    orderInterval: DEFAULT_INTERVAL,
  },
  stats: { ...EMPTY_STATS },
};

function loadPersisted() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw);
    return {
      profile: { ...DEFAULTS.profile, ...(p.profile || {}) },
      settings: { ...DEFAULTS.settings, ...(p.settings || {}) },
      stats: { ...DEFAULTS.stats, ...(p.stats || {}) },
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
    ...p,
  };
}

function finishGame(state) {
  const badges = awardBadges(
    state.order,
    state.posOf,
    state.finishOrder,
    state.perPlayer
  );
  let stats = state.stats;
  if (!state.statsAwarded) {
    const iWon =
      state.finishOrder[0] &&
      state.finishOrder[0].toLowerCase() ===
        state.profile.name.trim().toLowerCase();
    stats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      wins: stats.wins + (iWon ? 1 : 0),
    };
  }
  return {
    ...state,
    stats,
    badges,
    statsAwarded: true,
    nextOrderAt: null,
    route: "results",
  };
}

// Las monedas llegaron a 0: se acaba la partida por quiebra, no por llegar
// a FIN. Reusa la pantalla de resultados con `bankrupt: true`.
function bankruptGame(state) {
  const badges = awardBadges(
    state.order,
    state.posOf,
    state.finishOrder,
    state.perPlayer
  );
  let stats = state.stats;
  if (!state.statsAwarded) {
    stats = { ...stats, gamesPlayed: stats.gamesPlayed + 1 };
  }
  return {
    ...state,
    stats,
    badges,
    statsAwarded: true,
    nextOrderAt: null,
    bankrupt: true,
    route: "results",
  };
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
        posOf[n] = "INICIO";
        finishedOf[n] = false;
        perPlayer[n] = { orders: 0, events: 0, shortcuts: 0, sixes: 0, rolls: 0 };
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
        nextOrderAt: Date.now() + intervalMs(state.settings.orderInterval),
        stats: { ...state.stats, gamesHosted: state.stats.gamesHosted + 1 },
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
      const { name, square } = action;
      const posOf = { ...state.posOf, [name]: square };
      let finishedOf = state.finishedOf;
      let finishOrder = state.finishOrder;
      let extra = {};
      if (square === FINAL_NODE && !state.finishedOf[name]) {
        finishedOf = { ...state.finishedOf, [name]: true };
        finishOrder = [...state.finishOrder, name];
        // primero en llegar a FIN: la mesa entera cocina el super pedido
        if (state.finishOrder.length === 0) {
          extra = {
            orders: [...state.orders, makeFinaleOrder()],
            nextOrderAt: null,
            route: "finale",
          };
        }
      }
      return { ...state, posOf, finishedOf, finishOrder, ...extra };
    }

    case "nextTurn": {
      if (state.order.every((n) => state.finishedOf[n])) {
        return finishGame(state);
      }
      let turnIdx = state.turnIdx;
      do {
        turnIdx = (turnIdx + 1) % state.order.length;
      } while (state.finishedOf[state.order[turnIdx]]);
      return { ...state, turnIdx, turnNo: state.turnNo + 1 };
    }

    case "menuIntroDone":
      return state.menuIntro ? { ...state, menuIntro: false } : state;

    case "resetGame":
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
        route: "menu",
      };

    case "spawnOrders": {
      if (!state.nextOrderAt) return state;
      const batch = spawnBatch(state.orderSeq, state.order);
      return {
        ...state,
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
      const next = { ...state, orders, coins };
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
      // crédito de "manos rápidas" a quien(es) hicieron el pedido
      let perPlayer = state.perPlayer;
      if (target?.assignees?.length) {
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
      // entregado a tiempo: unas moneditas para el restaurante
      const coins = state.coins + COIN_REWARD;
      return { ...state, orders, perPlayer, coins };
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

  // tema
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;
  }, [state.settings.theme]);

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
      characters: CHARACTERS,
      pendingOrders: state.orders.filter((o) => o.status === "pending"),
    };
  }, [state]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
