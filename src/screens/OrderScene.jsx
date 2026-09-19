import { useEffect, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { characterById } from "../game/board.js";
import CharacterAvatar from "../components/CharacterAvatar.jsx";
import PlayerRing from "../components/PlayerRing.jsx";
import useTypewriter from "../lib/useTypewriter.js";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "./menuAssets.js";
import styles from "./OrderScene.module.css";

const ART = "/scenary/tablero/";
const SEATS = ["tl", "tr", "bl", "br"];

function mmss(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function useNow(active) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** Casilla del checklist: vacía / ✓ (lo tiene) / ✕ (le falta). */
function Box({ state, onClick }) {
  const label = state === "yes" ? "Sí lo tiene" : state === "no" ? "Le falta" : "Sin revisar";
  return (
    <button
      type="button"
      className={`${styles.box} ${state ? styles["box_" + state] : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {state === "yes" ? "✓" : state === "no" ? "✕" : ""}
    </button>
  );
}

/** Un pedido colgado del riel: quién lo hace, checklist y "Terminado". */
function Ticket({ order: o, selected, onSelect, style }) {
  const { players, dispatch } = useGame();
  const now = useNow(true);
  const prepLeft = (o.prepUntil || 0) - now;
  const inPrep = prepLeft > 0;
  const dueLeft = o.dueAt ? o.dueAt - now : null;
  const urgent = dueLeft != null && dueLeft < 15_000;
  const marked = o.items.filter((_, i) => o.check?.[i] != null).length;
  const complete = marked === o.items.length;
  const charFor = (name) => players.find((p) => p.name === name)?.characterId || "queso";
  const who = o.finale ? [] : o.assignees?.length ? o.assignees : [];

  return (
    <article
      className={`${styles.ticket} ${selected ? styles.ticketOn : ""}`}
      style={style}
      onClick={onSelect}
    >
      <span className={styles.hook} aria-hidden="true" />
      <div className={styles.ticketIn}>
        <h3 className={styles.tTitle}>
          {o.cat} <span>#{o.num}</span>
        </h3>

        <div className={styles.tWho}>
          <span>Le toca a:</span>
          {o.finale ? (
            <b>toda la mesa</b>
          ) : who.length ? (
            who.map((name) => (
              <span key={name} className={styles.whoChip}>
                <CharacterAvatar id={charFor(name)} size="sm" />
                {name}
              </span>
            ))
          ) : (
            <b>quien le toque</b>
          )}
        </div>

        {inPrep ? (
          <div className={styles.prep}>
            <span>Armen el memory en la mesa</span>
            <b>{mmss(prepLeft)}</b>
          </div>
        ) : (
          <>
            <ul className={styles.rows}>
              {o.items.map((id, i) => (
                <li key={i} className={styles.row}>
                  <CharacterAvatar id={id} size="sm" />
                  <span className={styles.rName}>{characterById(id).name}</span>
                  <Box
                    state={o.check?.[i] ?? null}
                    onClick={(e) => {
                      e.stopPropagation();
                      sfx.select();
                      dispatch({ type: "setOrderCheck", id: o.id, idx: i });
                    }}
                  />
                </li>
              ))}
            </ul>
            {dueLeft != null && (
              <p className={`${styles.due} ${urgent ? styles.dueUrgent : ""}`}>
                vence en {mmss(Math.max(0, dueLeft))}
              </p>
            )}
            <button
              type="button"
              className={styles.done}
              disabled={!complete}
              onClick={(e) => {
                e.stopPropagation();
                sfx.press();
                dispatch({ type: "deliverOrder", id: o.id });
              }}
            >
              {complete ? "Terminado" : `Faltan ${o.items.length - marked}`}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

/** Pantalla del pedido: el cliente pide en el mostrador y los pedidos cuelgan del riel a la derecha. */
export default function OrderScene({ orders }) {
  const { players, coins, currentName } = useGame();
  const scale = useStageScale();
  const [sel, setSel] = useState(0);
  const cur = orders[Math.min(sel, orders.length - 1)];
  const line = cur.line || `Un ${cur.dish} con:`;
  const { shown, done } = useTypewriter(line);
  const n = orders.length;
  // con varios pedidos se solapan para que quepan en el riel
  const overlap = n <= 1 ? 0 : Math.max(70, Math.ceil((340 * n - 700) / (n - 1)));

  return (
    <div className={styles.root} style={{ "--s": scale }}>
      {/* izquierda: la cocina a pantalla completa y el cliente en el mostrador */}
      <section className={styles.left}>
        <img className={styles.kitchen} src="/scenary/player register/background.svg" alt="" aria-hidden="true" draggable="false" />
        <div className={styles.leftStage}>
          <div className={styles.client} key={cur.id}>
            <div className={styles.bubble}>
              <p className={styles.bubbleText}>
                {shown}
                {!done && <span className={styles.caret} aria-hidden="true" />}
              </p>
              <div className={styles.chips} style={{ "--typed-ms": `${line.length * 32 + 120}ms` }}>
                {cur.items.map((id, i) => (
                  <span key={i} className={styles.chip} style={{ "--i": i }}>
                    <CharacterAvatar id={id} size="sm" />
                    {characterById(id).name}
                  </span>
                ))}
              </div>
            </div>
            {cur.catImg ? (
              <img className={styles.photo} src={cur.catImg} alt={cur.cat} draggable="false" />
            ) : (
              <span className={styles.photo} />
            )}
            <span className={styles.who}>{cur.cat}</span>
          </div>
        </div>
      </section>

      {/* derecha: pared con el riel de pedidos */}
      <aside className={styles.side}>
        <div className={styles.sideStage}>
          <div className={styles.rail} />
          <div className={styles.tickets}>
            {orders.map((o, i) => (
              <Ticket
                key={o.id}
                order={o}
                selected={i === Math.min(sel, n - 1)}
                onSelect={() => setSel(i)}
                style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: i === Math.min(sel, n - 1) ? 5 : n - i }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* borde inferior: mesa (aquí irán las cartas) */}
      <div className={styles.table} />

      {/* asientos, iguales que en el tablero */}
      {SEATS.map((corner, i) => {
        const p = players[i];
        return (
          p && (
            <div key={corner} className={`${styles.corner} ${styles[corner]}`}>
              <div className={`${styles.seat} ${styles["seat_" + corner]} ${p.name === currentName ? styles.seatOn : ""}`}>
                <PlayerRing index={i} characterId={p.characterId} />
                <span className={styles.seatName}>{p.name}</span>
              </div>
            </div>
          )
        );
      })}

      <div className={styles.coins}>
        <img src={ART + "coins.svg"} alt="" draggable="false" />
        <span>{coins}</span>
      </div>
    </div>
  );
}
