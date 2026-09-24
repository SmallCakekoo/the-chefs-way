import { useEffect, useRef, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import {
  GRAPH,
  CASILLA_INFO,
  EVENTS,
  NEGATIVE_EVENTS,
  POWER_CARDS,
  FINAL_NODE,
  START_NODE,
  SHORTCUT_NODES,
  BRANCH_LABEL,
  HELP_CARD_CHANCE,
  advanceGraph,
} from "../game/board.js";
import Die from "../components/Die.jsx";
import PlayerRing from "../components/PlayerRing.jsx";
import EpicMoment from "../components/EpicMoment.jsx";
import Toasts from "../components/Toasts.jsx";
import OrderScene from "./OrderScene.jsx";
import GameSettings from "../components/GameSettings.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "./menuAssets.js";
import styles from "./TurnScreen.module.css";

const ART = "/scenary/tablero/";
const COMMON = "/scenary/common/";

const SEATS = ["tl", "tr", "bl", "br"];
// Color de cada jugador (el de su aro), para el borde de sus cartas.
const PJ = ["#fb471f", "#45b2f9", "#32d8a4", "#ffd42a"];

/** `ordersPlayed` = cuántos pedidos ya se jugaron (entregados o vencidos): algunos eventos esperan a que haya alguno. */
function outcomeFor(nodeId, name, ordersPlayed = 0) {
  if (nodeId === FINAL_NODE) {
    return { tag: "a", title: `${name} llegó al final`, text: "", node: nodeId };
  }
  const info = CASILLA_INFO[GRAPH[nodeId]?.c] || CASILLA_INFO.O;
  const out = { ...info, node: nodeId, title: info.label };
  const list = info.tag === "y" ? EVENTS : info.tag === "b" ? NEGATIVE_EVENTS : null;
  if (list) {
    const pool = list.filter((e) => !e.needsOrdersPlayed || ordersPlayed > 0);
    const ev = pool[Math.floor(Math.random() * pool.length)];
    // {X} = el jugador que cayó en la casilla
    out.event = { ...ev, title: ev.title.replaceAll("{X}", name), text: ev.text.replaceAll("{X}", name) };
  }
  return out;
}
const casillaLabel = (id) => (id === START_NODE ? "la salida" : `la casilla ${id}`);

export default function TurnScreen() {
  const { players, currentPlayer, currentName, posOf, orders, coins, turnNo, finishedOf, happyHour, collabOn, dispatch } =
    useGame();
  const scale = useStageScale();
  const [phase, setPhase] = useState("idle"); // idle | rolling | fork | result
  const [dieValue, setDieValue] = useState(null);
  const [rollNo, setRollNo] = useState(0); // cuenta las tiradas: el dado 3D gira en cada una
  const [fork, setFork] = useState(null); // { from, options, steps, roll, tookShortcut }
  const [result, setResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [moment, setMoment] = useState(null); // animación épica: evento o carta ganada
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  if (!currentPlayer) return null;
  const pos = posOf[currentName] ?? START_NODE;
  const pendingOrders = orders.filter((o) => o.status === "pending" && !o.finale);
  const blocked = pendingOrders.length > 0;

  const settle = (nodeId, tookShortcut, path) => {
    if (tookShortcut) dispatch({ type: "noteShortcut", name: currentName });
    dispatch({ type: "applyMove", name: currentName, square: nodeId, path });
    const out = outcomeFor(nodeId, currentName, orders.filter((o) => o.status !== "pending").length);
    if (out.event) {
      dispatch({ type: "noteEvent", name: currentName });
      // lo que hace el evento: retroceder, monedas, hora feliz, colaboración…
      dispatch({ type: "applyEvent", name: currentName, fx: out.event.fx });
    }
    // Bono de cocina: la carta es el evento. Los demás eventos positivos dan carta con cierta probabilidad.
    const eventCard = !!out.event?.fx?.powerCard;
    const bonusCard =
      out.tag === "y" && nodeId !== FINAL_NODE && (eventCard || Math.random() < HELP_CARD_CHANCE);
    if ((out.tag === "a" && nodeId !== FINAL_NODE) || bonusCard) {
      const card = POWER_CARDS[Math.floor(Math.random() * POWER_CARDS.length)];
      out.card = card;
      out.bonus = bonusCard && !eventCard;
      dispatch({ type: "givePowerCard", name: currentName, card });
    }
    if (out.tag === "a" && nodeId !== FINAL_NODE) {
      sfx.win();
    } else if (out.event) {
      const bad = out.tag === "b";
      if (bad) sfx.expire();
      else sfx.win();
      setMoment({
        kind: bad ? "bad" : "good",
        title: out.event.title,
        sub: bad ? "Evento negativo" : "Evento positivo",
        text: out.event.text,
      });
    }
    setResult(out);
    setPhase("result");
  };

  // camina el grafo; si topa una bifurcación, pausa y pregunta
  // `path` = casillas ya recorridas en esta tirada (para poder retroceder luego por el mismo camino)
  const walk = (from, steps, roll, tookShortcut, path = []) => {
    const r = advanceGraph(from, steps);
    if (r.overshoot) {
      // se pasaría de la meta: se queda donde estaba hasta sacar el número exacto
      setFork(null);
      setResult({
        tag: "o",
        title: "Necesitas el número exacto",
        text: `Sacaste un ${roll} y te pasas de la meta por ${r.left}. No avanzas: tienes que sacar justo lo que te falta para llegar a la casilla ${FINAL_NODE}.`,
        node: pos,
      });
      setPhase("result");
      return;
    }
    if (r.branch) {
      setFork({ from: r.branch, options: r.options, steps: r.steps, roll, tookShortcut, path: [...path, ...r.path] });
      setPhase("fork");
    } else {
      setFork(null);
      settle(r.at, tookShortcut, [...path, ...r.path]);
    }
  };

  const roll = () => {
    if (blocked) return;
    sfx.roll();
    setPhase("rolling");
    const final = 1 + Math.floor(Math.random() * 6);
    // el cubo gira varias vueltas y frena en la cara que salió; después se mueve la ficha
    setDieValue(final);
    setRollNo((n) => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      dispatch({ type: "noteRoll", name: currentName, value: final });
      walk(pos, final, final, false);
    }, 2300);
  };

  const chooseFork = (nextId) => {
    const took = fork.tookShortcut || SHORTCUT_NODES.has(nextId);
    walk(nextId, fork.steps - 1, fork.roll, took, [...fork.path, nextId]);
  };

  const idx = Math.max(0, players.findIndex((p) => p.name === currentName));
  const label = pos === START_NODE ? "Salida" : `Casilla ${pos}`;
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
                } ${finishedOf[p.name] ? styles.seatHelper : ""}`}
              >
                <PlayerRing index={i} characterId={p.characterId} />
                <span className={styles.seatName}>{p.name}</span>
                {finishedOf[p.name] && (
                  <span className={styles.helperTag}>De vacaciones</span>
                )}
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
          aria-label="Configuración"
          onClick={() => {
            sfx.tap();
            setShowSettings(true);
          }}
        >
          <img src={COMMON + "settingbtn.svg"} alt="" draggable="false" />
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
          <img src={COMMON + "coins.svg"} alt="" draggable="false" />
          <span className={styles.coinNum} title="Moneditas del restaurante">
            {coins}
          </span>
        </div>
        {/* eventos que duran una ronda */}
        {(happyHour || collabOn) && (
          <div className={styles.buffs}>
            {happyHour && <span className={styles.buff}>Hora feliz · pedidos x2</span>}
            {collabOn && <span className={styles.buff}>Colaboración del día</span>}
          </div>
        )}
        {/* dado + botón */}
        {phase !== "fork" && (
          <div
            className={`${styles.die} ${phase === "result" ? (result?.card ? styles.dieAsideCard : styles.dieAside) : ""}`}
          >
            <Die value={dieValue} roll={rollNo} />
          </div>
        )}
        {!cardOpen && (
          <>
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

        {phase === "result" && result?.card && (
          <img
            key={result.card}
            className={styles.won}
            src={"/powercards/" + encodeURI(result.card) + ".svg"}
            alt="Carta de poder ganada"
            draggable="false"
            style={{ "--pj": PJ[idx % 4] }}
          />
        )}
        {/* evento positivo que además dio carta: la etiqueta va sobre la carta (en el cuadro no cabe) */}
        {phase === "result" && result?.card && result.bonus && (
          <span className={styles.wonTag}>¡Carta extra!</span>
        )}

        {cardOpen && (
          <div className={styles.cardLayer} key={phase}>
            {/* bifurcación: un cuadro chico por rama */}
            {phase === "fork" && fork && (
              <>
                <div className={styles.forkHead}>
                  <span className={styles.forkTitle}>El camino se divide en {casillaLabel(fork.from)}</span>
                  <span className={styles.forkText}>
                    Sacaste un {fork.roll} y te quedan {fork.steps} pasos. ¿Por cuál rama sigues?
                  </span>
                </div>
                <div className={styles.duo}>
                  {fork.options.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`${styles.opt} ${styles.optBtn}`}
                      onClick={() => {
                        sfx.tap();
                        chooseFork(id);
                      }}
                    >
                      <img className={styles.frameArt} src={COMMON + "smallrectangleframe.svg"} alt="" aria-hidden="true" draggable="false" />
                      <span className={styles.optIn}>
                        <span className={styles.branch}>{BRANCH_LABEL[id] || `Rama ${id}`}</span>
                        <span className={styles.branchSub}>
                          Casilla {id}
                          {SHORTCUT_NODES.has(id) && !/atajo/i.test(BRANCH_LABEL[id] || "") ? " · atajo" : ""}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* resultado: el dado queda a la izquierda y el cuadro dice qué pasó (la casilla ya se ve arriba) */}
            {phase === "result" && result && (
              <>
                <div className={`${styles.rect} ${result.card ? styles.rectCard : ""}`}>
                  <img className={styles.frameArt} src={COMMON + "rectangleframe.svg"} alt="" aria-hidden="true" draggable="false" />
                  <div className={styles.rectIn}>
                    {result.event && <span className={styles.eyebrow}>{result.title}</span>}
                    <p className={styles.title}>{result.event ? result.event.title : result.title}</p>
                    <p className={styles.text}>{result.event ? result.event.text : result.text}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.next}
                  disabled={blocked}
                  onClick={() => {
                    sfx.tap();
                    dispatch({ type: "nextTurn" });
                  }}
                >
                  <img src={COMMON + "btn.svg"} alt="" aria-hidden="true" draggable="false" />
                  <span>{blocked ? "Terminen los pedidos" : "Pasar el dispositivo"}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>


      {/* llega un pedido: cambia de escena, el cliente pide en el mostrador */}
      {pendingOrders.length > 0 && <OrderScene orders={pendingOrders} />}

      {moment && (
        <EpicMoment
          key={moment.card || moment.title}
          kind={moment.kind}
          card={moment.card}
          title={moment.title}
          sub={moment.sub}
          text={moment.text}
          color={PJ[idx % 4]}
          onDone={() => setMoment(null)}
        />
      )}
      {pendingOrders.length === 0 && <div className={styles.rim} />}
      <Toasts />
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
