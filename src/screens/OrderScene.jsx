import { useEffect, useRef, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { characterById, ingredientById, faceStyle, POWER_CARD_INFO } from "../game/board.js";
import PlayerRing from "../components/PlayerRing.jsx";
import VacationIcon from "../components/VacationIcon.jsx";
import CharacterAvatar from "../components/CharacterAvatar.jsx";
import useTypewriter from "../lib/useTypewriter.js";
import { COIN_REWARD } from "../game/orders.js";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "./menuAssets.js";
import styles from "./OrderScene.module.css";

const ORDER = "/scenary/order/";
const CARDS = "/powercards/";
const SEATS = ["tl", "tr", "bl", "br"];
// Abanico de cartas de poder: las que tienen los jugadores. El borde de cada carta es el color de su dueño.
const RING_COLORS = ["#fb471f", "#45b2f9", "#32d8a4", "#ffd42a"];
const FAN_R = 760; // radio del abanico
const FAN_MAX_STEP = 13; // grados máximos entre cartas
const CARD_W = 202;
const CARD_H = 319;

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
  // recompensa según las marcas: ✓ suma, ✕ resta
  const yes = o.items.filter((_, i) => o.check?.[i] === "yes").length;
  const no = o.items.filter((_, i) => o.check?.[i] === "no").length;
  const delta = Math.round((COIN_REWARD * (yes - no)) / o.items.length);
  // paciencia del cliente: lo que queda del tiempo para entregar
  const window = o.dueAt && o.prepUntil ? o.dueAt - o.prepUntil : 0;
  const patience = window ? Math.max(0, Math.min(1, dueLeft / window)) : null;
  const charFor = (name) => players.find((p) => p.name === name)?.characterId || "queso";
  const who = o.finale ? [] : o.assignees?.length ? o.assignees : [];

  return (
    <article
      className={`${styles.ticket} ${selected ? styles.ticketOn : ""}`}
      style={style}
      onClick={onSelect}
    >
      <img className={styles.ticketArt} src={ORDER + "ticket.svg"} alt="" aria-hidden="true" draggable="false" />
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
              <span
                key={name}
                className={styles.whoChip}
                style={{ "--pj": RING_COLORS[Math.max(0, players.findIndex((p) => p.name === name)) % 4] }}
              >
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
                  <CharacterAvatar id={id} size="sm" ingredient />
                  <span className={styles.rName}>{ingredientById(id).name}</span>
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
              <div className={styles.patienceBox}>
                <p className={`${styles.due} ${urgent ? styles.dueUrgent : ""}`}>
                  vence en {mmss(Math.max(0, dueLeft))}
                </p>
                {patience != null && (
                  <div className={styles.patience} role="progressbar" aria-label="Paciencia del cliente" aria-valuenow={Math.round(patience * 100)}>
                    <i
                      style={{
                        width: `${patience * 100}%`,
                        background: patience > 0.5 ? "#2fc98a" : patience > 0.25 ? "#ffb02e" : "#e2381a",
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              className={`${styles.done} ${complete && delta < 0 ? styles.doneBad : ""}`}
              disabled={!complete}
              onClick={(e) => {
                e.stopPropagation();
                sfx.press();
                dispatch({ type: "deliverOrder", id: o.id });
              }}
            >
              {complete ? `Terminado ${delta > 0 ? "+" : ""}${delta}` : `Faltan ${o.items.length - marked}`}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

/** Pantalla del pedido (order/finalidea.svg): el cliente pide en el mostrador, los pedidos cuelgan del riel
 *  a la derecha y abajo va la mano de cartas de poder. */
export default function OrderScene({ orders }) {
  const { players, coins, finishedOf, dispatch } = useGame();
  const scale = useStageScale();
  const [sel, setSel] = useState(0);
  const [pickedKey, setPickedKey] = useState(null);
  const cur = orders[Math.min(sel, orders.length - 1)];
  const line = cur.line || `Un ${cur.dish} con:`;
  const { shown, done } = useTypewriter(line);
  const n = orders.length;
  // los asientos de quienes hacen el pedido seleccionado laten; los demás se apagan
  const active = (name) => {
    if (cur.finale || !cur.assignees?.length) return true;
    return cur.assignees.includes(name);
  };
  // la mano solo muestra las cartas de quienes hacen el pedido, con el borde de su color
  const hand = players.flatMap((p, pi) =>
    active(p.name)
      ? (p.powerCards || []).map((card, ci) => ({ key: `${pi}-${ci}`, card, owner: pi, ci }))
      : []
  );
  const mid = (hand.length - 1) / 2;
  const fanStep = hand.length > 1 ? Math.min(FAN_MAX_STEP, 70 / (hand.length - 1)) : 0;
  const [drag, setDrag] = useState(null); // { key, dx, dy, over, armed }
  const dragRef = useRef(null);
  const [epic, setEpic] = useState(null); // animación al usar una carta
  const latest = useRef({});
  latest.current = { scale, players, dispatch, hand };
  const handKeys = hand.map((h) => h.key).join(",");

  // Arrastre con listeners en window: así termina siempre (aunque la carta desaparezca a mitad de camino)
  useEffect(() => {
    if (!drag?.key) return;
    const stop = () => {
      clearTimeout(dragRef.current?.timer);
      dragRef.current = null;
      setDrag(null);
    };
    const move = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) d.moved = true;
      if (dist > 45) d.armed = true; // un arrastre decidido también "arma" la carta
      const r = d.el.getBoundingClientRect();
      const over =
        d.armed &&
        Math.hypot(r.left + r.width / 2 - window.innerWidth / 2, r.top + r.height / 2 - window.innerHeight / 2) <
          230 * latest.current.scale;
      d.over = over;
      setDrag({ key: d.key, dx, dy, over, armed: d.armed });
    };
    const up = () => {
      const d = dragRef.current;
      if (!d) return stop();
      const { players: ps, dispatch: dp } = latest.current;
      const h = d.h;
      const over = d.over;
      const moved = d.moved;
      stop();
      if (!moved) {
        sfx.select();
        setPickedKey(h.key);
      } else if (over) {
        sfx.win();
        dp({ type: "usePowerCard", name: ps[h.owner].name, index: h.ci });
        setEpic({ id: Date.now(), card: h.card, who: ps[h.owner].name, color: RING_COLORS[h.owner % 4] });
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
    };
  }, [drag?.key]);

  // si la carta que se arrastraba ya no está en la mano (se entregó/venció el pedido), se suelta
  useEffect(() => {
    if (drag && !latest.current.hand.some((h) => h.key === drag.key)) {
      clearTimeout(dragRef.current?.timer);
      dragRef.current = null;
      setDrag(null);
    }
  }, [handKeys, drag?.key]);

  // el aviso de uso dura ~2s
  useEffect(() => {
    if (!epic) return;
    const t = setTimeout(() => setEpic(null), 2000);
    return () => clearTimeout(t);
  }, [epic?.id]);
  useEffect(() => () => clearTimeout(dragRef.current?.timer), []);
  const pickedIdx = hand.findIndex((h) => h.key === pickedKey);
  const activeIdx = pickedIdx >= 0 ? pickedIdx : Math.round(mid);
  // los tickets caben en el riel (653px): con varios se solapan
  const step = n <= 1 ? 0 : Math.min(417, Math.floor((653 - 417) / (n - 1)));
  const startX = n <= 1 ? (653 - 417) / 2 : 0;

  return (
    <div className={styles.root} style={{ "--s": scale }}>
      <div className={styles.wall} />

      {/* izquierda: pared, mostrador y cliente. Se ancla al pilar de madera (a 870px del borde derecho) */}
      <section className={styles.left}>
        <div className={`${styles.ext} ${styles.extTop}`} />
        <div className={`${styles.ext} ${styles.extEdge}`} />
        <div className={`${styles.ext} ${styles.extFront}`} />
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
                    <CharacterAvatar id={id} size="sm" ingredient />
                    {ingredientById(id).name}
                  </span>
                ))}
              </div>
            </div>
            <img
              className={styles.animal}
              src={cur.catImg}
              alt={cur.cat}
              draggable="false"
              style={faceStyle(characterById(cur.catId))}
            />
          </div>
          <img
            className={styles.counter}
            src={ORDER + encodeURI("estanteríafrontal.svg")}
            alt=""
            aria-hidden="true"
            draggable="false"
          />
          <span className={styles.who} key={"w" + cur.id}>{cur.cat}</span>
          <div className={styles.coins}>
            <img src="/scenary/common/coins.svg" alt="" draggable="false" />
            <span>{coins}</span>
          </div>
        </div>
      </section>

      {/* derecha: pilar + pared con el riel de pedidos, anclada al borde derecho */}
      <aside className={styles.side}>
        <div className={styles.sideStage}>
          <img className={styles.sideArt} src={ORDER + "sidetable.svg"} alt="" aria-hidden="true" draggable="false" />
          <div className={styles.tickets}>
            {orders.map((o, i) => (
              <Ticket
                key={o.id}
                order={o}
                selected={i === Math.min(sel, n - 1)}
                onSelect={() => setSel(i)}
                style={{ left: startX + i * step, zIndex: n - Math.abs(i - Math.min(sel, n - 1)) }}
              />
            ))}
          </div>
          <img className={styles.rail} src={ORDER + "tickettrail.svg"} alt="" aria-hidden="true" draggable="false" />
        </div>
      </aside>

      {/* mesa de abajo */}
      <div className={styles.table} />

      {/* mano de cartas de poder: solo las que ya tienen los jugadores */}
      <div className={styles.fan}>
        {hand.map((h, i) => {
          const theta = (i - mid) * fanStep;
          const rad = (theta * Math.PI) / 180;
          const x = FAN_R * Math.sin(rad);
          const up = FAN_R * Math.cos(rad) - 627;
          const on = i === activeIdx;
          const dragging = drag?.key === h.key;
          return (
            <button
              key={h.key}
              type="button"
              className={`${styles.card} ${on ? styles.cardOn : ""} ${dragging ? styles.dragging : ""}`}
              aria-label={`Carta de poder de ${players[h.owner]?.name}. Arrástrala al centro para usarla`}
              style={{
                left: x - CARD_W / 2,
                bottom: up - CARD_H / 2,
                rotate: dragging ? "0deg" : `${theta}deg`,
                zIndex: dragging ? 60 : on ? 20 : 10 - Math.min(9, Math.round(Math.abs(i - mid))),
                "--pj": RING_COLORS[h.owner % 4],
                ...(dragging ? { translate: `${drag.dx / scale}px ${drag.dy / scale}px`, scale: 1.12 } : null),
              }}
              onPointerDown={(e) => {
                if (e.button > 0) return;
                const d = { key: h.key, h, el: e.currentTarget, sx: e.clientX, sy: e.clientY, moved: false, armed: false, over: false };
                // "armada" tras mantenerla ~0,4s: recién ahí aparece la zona para soltar
                d.timer = setTimeout(() => {
                  if (dragRef.current === d) {
                    d.armed = true;
                    setDrag((cur) => (cur && cur.key === d.key ? { ...cur, armed: true } : cur));
                  }
                }, 400);
                dragRef.current = d;
                setDrag({ key: h.key, dx: 0, dy: 0, over: false, armed: false });
              }}
            >
              <img src={CARDS + encodeURI(h.card) + ".svg"} alt="" draggable="false" />
            </button>
          );
        })}
      </div>

      {drag?.armed && (
        <div className={`${styles.dropZone} ${drag.over ? styles.dropOver : ""}`} aria-hidden="true">
          <span>Suelta aquí para usarla</span>
        </div>
      )}

      {/* qué hace la carta elegida */}
      {hand[activeIdx] && !drag?.armed && !epic && (
        <div className={styles.cardInfo} key={hand[activeIdx].key}>
          <b>{(POWER_CARD_INFO[hand[activeIdx].card] || {}).name}</b>
          <span>{(POWER_CARD_INFO[hand[activeIdx].card] || {}).text}</span>
        </div>
      )}

      {/* al usar una carta durante un pedido: aviso pequeño y suave (la animación épica es del tablero) */}
      {epic && (
        <div className={styles.soft} key={epic.id} style={{ "--pj": epic.color }} aria-live="polite">
          <img src={CARDS + encodeURI(epic.card) + ".svg"} alt="" draggable="false" />
          <span>
            {epic.who} usó <b>{(POWER_CARD_INFO[epic.card] || {}).name}</b>
          </span>
        </div>
      )}

      {/* asientos: las fotos de los jugadores, como en el tablero */}
      {SEATS.map((corner, i) => {
        const p = players[i];
        return (
          p && (
            <div key={corner} className={`${styles.corner} ${styles[corner]}`}>
              <div
                className={`${styles.seat} ${styles["seat_" + corner]} ${
                  active(p.name) ? styles.seatOn : styles.seatOff
                } ${finishedOf[p.name] ? styles.seatHelper : ""}`}
              >
                <PlayerRing index={i} characterId={p.characterId} />
                <span className={styles.seatName}>{p.name}</span>
                {finishedOf[p.name] && (
                  <span className={styles.helperTag}>
                    <VacationIcon className={styles.helperHat} />
                    De vacaciones
                  </span>
                )}
              </div>
            </div>
          )
        );
      })}

    </div>
  );
}
