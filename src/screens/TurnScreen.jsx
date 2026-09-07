import { useEffect, useRef, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { FINAL_SQUARE, BOARD, CASILLA_INFO, EVENTS } from "../game/board.js";
import { FORKS, firstForkInPath } from "../game/forks.js";
import Screen from "../components/Screen.jsx";
import Button from "../components/Button.jsx";
import Die from "../components/Die.jsx";
import PlayerChip from "../components/PlayerChip.jsx";
import PressablePill from "../components/PressablePill.jsx";
import Tag from "../components/Tag.jsx";
import OrderTimer from "../components/OrderTimer.jsx";
import OrderCard from "../components/OrderCard.jsx";
import GameSettings from "../components/GameSettings.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { sfx } from "../lib/sfx.js";
import styles from "./TurnScreen.module.css";

function outcomeFor(square, name) {
  if (square >= FINAL_SQUARE) {
    return { tag: "a", label: "FIN", title: `${name} llegó al final`, text: "", square };
  }
  const info = CASILLA_INFO[BOARD[square - 1]];
  const out = { ...info, square, title: info.label };
  if (info.tag === "y") out.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  return out;
}

export default function TurnScreen() {
  const { currentPlayer, currentName, posOf, pendingOrders, dispatch } = useGame();
  const [phase, setPhase] = useState("idle"); // idle | rolling | fork | result
  const [dieValue, setDieValue] = useState(null);
  const [fork, setFork] = useState(null); // { square, options, roll }
  const [result, setResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  if (!currentPlayer) return null;
  const pos = posOf[currentName] ?? 0;

  const settle = (square, { shortcut = false } = {}) => {
    if (shortcut) dispatch({ type: "noteShortcut", name: currentName });
    dispatch({ type: "applyMove", name: currentName, square });
    const out = outcomeFor(square, currentName);
    if (out.event) dispatch({ type: "noteEvent", name: currentName });
    setResult(out);
    setPhase("result");
  };

  const resolveRoll = (roll) => {
    dispatch({ type: "noteRoll", name: currentName, value: roll });
    const raw = Math.min(pos + roll, FINAL_SQUARE);
    const forkSq = firstForkInPath(pos, raw);
    if (forkSq && raw < FINAL_SQUARE) {
      setFork({ square: forkSq, options: FORKS[forkSq], roll });
      setPhase("fork");
    } else {
      settle(raw);
    }
  };

  const roll = () => {
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
        resolveRoll(final);
      }
    }, 70);
  };

  const chooseFork = (opt) => {
    const landing = Math.min(pos + fork.roll + (opt.omite || 0), FINAL_SQUARE);
    settle(landing, { shortcut: (opt.omite || 0) > 0 });
    setFork(null);
  };

  return (
    <Screen
      onBack={() => setConfirmExit(true)}
      onSettings={() => setShowSettings(true)}
      layout="flow"
    >
      <OrderTimer />

      {pendingOrders.length > 0 && (
        <div className={styles.orders}>
          <span className={styles.ordersHead}>
            {pendingOrders.length === 1
              ? "Hay un pedido en marcha"
              : `Hay ${pendingOrders.length} pedidos en marcha`}
          </span>
          {pendingOrders.map((o, i) => (
            <OrderCard key={o.id} order={o} defaultOpen={i === 0} />
          ))}
        </div>
      )}

      <div className={styles.stage}>
        <span className={styles.step}>Le toca a</span>
        <PlayerChip
          characterId={currentPlayer.characterId}
          name={currentPlayer.name}
          size="lg"
        />
        <p className={styles.pos}>
          {pos === 0 ? "En la salida" : `En la casilla ${pos}`}
        </p>

        <Die value={dieValue} rolling={phase === "rolling"} />

        {phase === "idle" && (
          <Button variant="primary" wide onClick={roll} sound="roll">
            Tirar dado
          </Button>
        )}
        {phase === "rolling" && <p className={styles.hint}>Rodando…</p>}

        {phase === "fork" && fork && (
          <div className={styles.card}>
            <Tag tone="y">Bifurcación en la casilla {fork.square}</Tag>
            <p className={styles.cardText}>
              Sacaste un {fork.roll} y tu camino pasa por una bifurcación. ¿Por
              cuál rama se fueron en la mesa?
            </p>
            <div className={styles.opts}>
              {fork.options.map((o) => (
                <PressablePill key={o.label} onClick={() => chooseFork(o)}>
                  {o.label}
                </PressablePill>
              ))}
            </div>
          </div>
        )}

        {phase === "result" && result && (
          <div className={styles.card}>
            <div className={styles.resultHead}>
              <Tag tone={result.tag}>
                {result.square >= FINAL_SQUARE ? "FIN" : `Casilla ${result.square}`}
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
              onClick={() => {
                sfx.tap();
                dispatch({ type: "nextTurn" });
              }}
            >
              Pasar el dispositivo
            </Button>
          </div>
        )}
      </div>

      <GameSettings open={showSettings} onClose={() => setShowSettings(false)} />
      <ConfirmDialog
        open={confirmExit}
        title="¿Salir de la partida?"
        body="Perderás el progreso de esta partida: posiciones, pedidos y turno. La mesa vuelve al menú."
        confirmLabel="Salir al menú"
        cancelLabel="Seguir jugando"
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false);
          dispatch({ type: "resetGame" });
        }}
      />
    </Screen>
  );
}
