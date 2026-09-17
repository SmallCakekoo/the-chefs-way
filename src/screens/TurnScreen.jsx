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
  const { currentPlayer, currentName, posOf, orders, dispatch } = useGame();
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

  const twoCol = pendingOrders.length > 0;

  return (
    <Screen
      onBack={() => setConfirmExit(true)}
      onSettings={() => setShowSettings(true)}
      layout="flow"
    >
      <OrderTimer />

      <div className={`${styles.board} ${twoCol ? styles.split : ""}`}>
        <div className={styles.stage}>
          <span className={styles.step}>Le toca a</span>
          <PlayerChip
            characterId={currentPlayer.characterId}
            name={currentPlayer.name}
            size="lg"
          />
          <p className={styles.pos}>En {casillaLabel(pos)}</p>

          <Die value={dieValue} rolling={phase === "rolling"} />

          {phase === "idle" && (
            <Button
              variant="primary"
              wide
              onClick={roll}
              sound="roll"
              disabled={blocked}
            >
              Tirar dado
            </Button>
          )}
          {blocked && phase === "idle" && (
            <p className={styles.hint}>
              Terminen los pedidos en marcha para poder tirar.
            </p>
          )}
          {phase === "rolling" && <p className={styles.hint}>Rodando…</p>}

          {phase === "fork" && fork && (
            <div className={styles.card}>
              <Tag tone="y">Bifurcación en {casillaLabel(fork.from)}</Tag>
              <p className={styles.cardText}>
                Sacaste un {fork.roll} y el camino se divide. ¿Por cuál rama se
                fueron en la mesa?
              </p>
              <div className={styles.opts}>
                {fork.options.map((id) => (
                  <PressablePill key={id} onClick={() => chooseFork(id)}>
                    Rama {id}
                    {SHORTCUT_NODES.has(id) ? " · atajo" : ""}
                  </PressablePill>
                ))}
              </div>
            </div>
          )}

          {phase === "result" && result && (
            <div className={styles.card}>
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
            </div>
          )}
        </div>

        {twoCol && (
          <div className={styles.orders}>
            <span className={styles.ordersHead}>
              {pendingOrders.length > 1 ? "Pedidos en marcha" : "Pedido en marcha"}
            </span>
            <div className={styles.ordersList}>
              {pendingOrders.map((o) => (
                <OrderCard key={o.id} order={o} defaultOpen />
              ))}
            </div>
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
