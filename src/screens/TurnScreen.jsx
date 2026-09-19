import { useEffect, useRef, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import {
  GRAPH,
  CASILLA_INFO,
  EVENTS,
  FINAL_NODE,
  SHORTCUT_NODES,
  advanceGraph,
} from "../game/board.js";
import Button from "../components/Button.jsx";
import Die from "../components/Die.jsx";
import PressablePill from "../components/PressablePill.jsx";
import Tag from "../components/Tag.jsx";
import PlayerRing from "../components/PlayerRing.jsx";
import OrderScene from "./OrderScene.jsx";
import GameSettings from "../components/GameSettings.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "./menuAssets.js";
import styles from "./TurnScreen.module.css";

const ART = "/scenary/tablero/";
const COMMON = "/scenary/common/";

const SEATS = ["tl", "tr", "bl", "br"];

function outcomeFor(nodeId, name) {
  if (nodeId === FINAL_NODE) {
    return { tag: "a", title: `${name} llegó al final`, text: "", node: nodeId };
  }
  const info = CASILLA_INFO[GRAPH[nodeId]?.c] || CASILLA_INFO.O;
  const out = { ...info, node: nodeId, title: info.label };
  if (info.tag === "y") out.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  return out;
}
const casillaLabel = (id) => (id === "INICIO" ? "la salida" : `la casilla ${id}`);

export default function TurnScreen() {
  const { players, currentPlayer, currentName, posOf, orders, coins, turnNo, dispatch } = useGame();
  const scale = useStageScale();
  const [phase, setPhase] = useState("idle"); // idle | rolling | fork | result
  const [dieValue, setDieValue] = useState(null);
  const [fork, setFork] = useState(null); // { from, options, steps, roll, tookShortcut }
  const [result, setResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  if (!currentPlayer) return null;
  const pos = posOf[currentName] ?? "INICIO";
  const pendingOrders = orders.filter((o) => o.status === "pending" && !o.finale);
  const blocked = pendingOrders.length > 0;

  const settle = (nodeId, tookShortcut) => {
    if (tookShortcut) dispatch({ type: "noteShortcut", name: currentName });
    dispatch({ type: "applyMove", name: currentName, square: nodeId });
    const out = outcomeFor(nodeId, currentName);
    if (out.event) dispatch({ type: "noteEvent", name: currentName });
    setResult(out);
    setPhase("result");
  };

  // camina el grafo; si topa una bifurcación, pausa y pregunta
  const walk = (from, steps, roll, tookShortcut) => {
    const r = advanceGraph(from, steps);
    if (r.branch) {
      setFork({ from: r.branch, options: r.options, steps: r.steps, roll, tookShortcut });
      setPhase("fork");
    } else {
      setFork(null);
      settle(r.at, tookShortcut);
    }
  };

  const roll = () => {
    if (blocked) return;
    sfx.roll();
    setPhase("rolling");
    let ticks = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setDieValue(1 + Math.floor(Math.random() * 6));
      ticks += 1;
      if (ticks > 7) {
        clearInterval(timer.current);
        const final = 1 + Math.floor(Math.random() * 6);
        setDieValue(final);
        dispatch({ type: "noteRoll", name: currentName, value: final });
        walk(pos, final, final, false);
      }
    }, 70);
  };

  const chooseFork = (nextId) => {
    const took = fork.tookShortcut || SHORTCUT_NODES.has(nextId);
    walk(nextId, fork.steps - 1, fork.roll, took);
  };

  const idx = Math.max(0, players.findIndex((p) => p.name === currentName));
  const label = pos === "INICIO" ? "Salida" : `Casilla ${pos}`;
  const cardOpen = phase === "fork" || phase === "result";

  return (
    <main
      className={`${styles.root} ${turnNo === 0 ? styles.intro : ""}`}
      style={{ "--s": scale }}
    >
      <div className={styles.wall} />
      <div className={styles.mesa}>
        <div className={styles.mesaTop} />
      </div>

      {/* esquinas: óvalos + asientos de cada jugador, pegados a las esquinas de la ventana */}
      {SEATS.map((corner, i) => {
        const p = players[i];
        return (
          <div key={corner} className={`${styles.corner} ${styles[corner]}`}>
            <img
              className={`${styles.site} ${styles["site_" + corner]}`}
              src={ART + "site.svg"}
              alt=""
              aria-hidden="true"
              draggable="false"
            />
            {p && (
              <div
                className={`${styles.seat} ${styles["seat_" + corner]} ${
                  p.name === currentName ? styles.seatOn : ""
                }`}
              >
                <PlayerRing index={i} characterId={p.characterId} />
                <span className={styles.seatName}>{p.name}</span>
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.stage}>
        <button
          className={`${styles.iconBtn} ${styles.backBtn}`}
          aria-label="Salir de la partida"
          onClick={() => {
            sfx.back();
            setConfirmExit(true);
          }}
        >
          <img src={COMMON + "backbtn.svg"} alt="" draggable="false" />
        </button>
        <button
          className={`${styles.iconBtn} ${styles.gearBtn}`}
          aria-label="Sonido"
          onClick={() => {
            sfx.tap();
            setShowSettings(true);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path
              d="M12 3.6v2.6M12 17.8v2.6M3.6 12h2.6M17.8 12h2.6M6 6l1.9 1.9M16.1 16.1 18 18M18 6l-1.9 1.9M7.9 16.1 6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* jugador en turno */}
        <PlayerRing index={idx} characterId={currentPlayer.characterId} className={styles.center} />
        <div className={styles.plaque}>
          <img src={ART + "woodrectange.svg"} alt="" draggable="false" />
          <span className={styles.plaqueText}>{label}</span>
        </div>

        <div className={styles.ribbon}>
          <img src={ART + "liston.svg"} alt="" draggable="false" />
          <span className={styles.ribbonText}>Turno de {currentName}</span>
        </div>
        <div className={styles.coins}>
          <img src={ART + "coins.svg"} alt="" draggable="false" />
          <span className={styles.coinNum} title="Moneditas del restaurante">
            {coins}
          </span>
        </div>
        {/* dado + botón */}
        {!cardOpen && (
          <>
            <div className={styles.die}>
              <Die value={dieValue} rolling={phase === "rolling"} />
            </div>
            {phase === "idle" && (
              <button className={styles.roll} onClick={roll} disabled={blocked}>
                <img src={COMMON + "btn.svg"} alt="" aria-hidden="true" draggable="false" />
                <span className={styles.rollLabel}>Tirar dado</span>
              </button>
            )}
            {phase === "rolling" && <p className={styles.say}>Rodando</p>}
            {blocked && phase === "idle" && (
              <p className={styles.sayLow}>Terminen los pedidos en marcha para poder tirar.</p>
            )}
          </>
        )}

        {cardOpen && (
          <div className={styles.card}>
            <div className={styles.cardIn}>
              {phase === "fork" && fork && (
                <>
                  <Tag tone="y">Bifurcación en {casillaLabel(fork.from)}</Tag>
                  <p className={styles.cardText}>
                    Sacaste un {fork.roll} y el camino se divide. ¿Por cuál rama se fueron en la
                    mesa?
                  </p>
                  <div className={styles.opts}>
                    {fork.options.map((id) => (
                      <PressablePill key={id} onClick={() => chooseFork(id)}>
                        Rama {id}
                        {SHORTCUT_NODES.has(id) ? " · atajo" : ""}
                      </PressablePill>
                    ))}
                  </div>
                </>
              )}
              {phase === "result" && result && (
                <>
                  <div className={styles.resultHead}>
                    <Tag tone={result.tag}>
                      {result.node === FINAL_NODE ? "FIN" : `Casilla ${result.node}`}
                    </Tag>
                    <span className={styles.rolled}>Sacaste un {dieValue}</span>
                  </div>
                  <p className={styles.cardTitle}>{result.title}</p>
                  {result.text && <p className={styles.cardText}>{result.text}</p>}
                  {result.event && (
                    <div className={styles.event}>
                      <span className={styles.eventTitle}>{result.event.title}</span>
                      <span className={styles.eventText}>{result.event.text}</span>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    wide
                    disabled={blocked}
                    onClick={() => {
                      sfx.tap();
                      dispatch({ type: "nextTurn" });
                    }}
                  >
                    {blocked ? "Terminen los pedidos" : "Pasar el dispositivo"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>


      {/* llega un pedido: cambia de escena, el cliente pide en el mostrador */}
      {pendingOrders.length > 0 && <OrderScene orders={pendingOrders} />}

      <div className={styles.rim} />
      <GameSettings open={showSettings} onClose={() => setShowSettings(false)} />
      <ConfirmDialog
        open={confirmExit}
        title="Salir del juego"
        body="Perderás el progreso de esta partida: posiciones, pedidos y turno. La mesa vuelve al menú."
        confirmLabel="Ir al inicio"
        cancelLabel="Seguir jugando"
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false);
          dispatch({ type: "resetGame" });
        }}
      />
    </main>
  );
}
