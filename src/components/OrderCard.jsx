import { useEffect, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import Button from "./Button.jsx";
import CharacterAvatar from "./CharacterAvatar.jsx";
import { characterById } from "../game/board.js";
import { sfx } from "../lib/sfx.js";
import useTypewriter from "../lib/useTypewriter.js";
import styles from "./OrderCard.module.css";

function CheckTri({ state, onClick }) {
  const label =
    state === "yes" ? "Sí lo tiene" : state === "no" ? "Le falta" : "Sin revisar";
  return (
    <button
      type="button"
      className={`${styles.tri} ${styles["tri_" + (state || "none")]}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {state === "yes" ? "✓" : state === "no" ? "✕" : "?"}
    </button>
  );
}

function mmss(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Viñeta de UN pedido + prep + checklist. `defaultOpen` abre el checklist. */
export default function OrderCard({ order: o, defaultOpen = false }) {
  const { players, dispatch } = useGame();
  const [now, setNow] = useState(Date.now());
  const prepLeft = (o.prepUntil || 0) - now;
  const inPrep = prepLeft > 0;
  const dueLeft = o.dueAt ? o.dueAt - now : null;
  const urgent = dueLeft != null && dueLeft < 15_000;
  const [open, setOpen] = useState(defaultOpen);

  // sigue el reloj mientras haya algo que contar: el prep, o el vencimiento
  // del pedido (se apaga solo cuando el pedido se entrega/vence y desaparece).
  useEffect(() => {
    if (!inPrep && !o.dueAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [inPrep, o.dueAt]);

  const charFor = (name) =>
    players.find((p) => p.name === name)?.characterId || "queso";
  const marked = o.items.filter((_, i) => o.check?.[i] != null).length;
  const complete = marked === o.items.length;

  const line = o.line || `Un ${o.dish} con:`;
  const { shown: typed, done: typedDone } = useTypewriter(line);

  const compact = open && !inPrep;

  return (
    <article className={`${styles.card} ${compact ? styles.compact : ""}`}>
      <div className={styles.top}>
        {o.catImg ? (
          <img
            className={styles.catImg}
            src={o.catImg}
            alt=""
            aria-hidden="true"
            draggable="false"
          />
        ) : (
          <span className={styles.catSlot} aria-hidden="true">
            gato
          </span>
        )}

        <div className={styles.bubble}>
          <span className={styles.from}>
            {o.cat} pide
            <span className={styles.num}>#{o.num}</span>
          </span>
          <span className={styles.dish}>
            {typed}
            {!typedDone && <span className={styles.caret} aria-hidden="true" />}
          </span>
          <div
            className={styles.chips}
            style={{ "--typed-ms": `${line.length * 32 + 120}ms` }}
          >
            {o.items.map((id, i) => (
              <span key={i} className={styles.chip} style={{ "--i": i }}>
                <CharacterAvatar id={id} size="sm" />
                <span className={styles.chipName}>{characterById(id).name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.whoRow}>
        <span className={styles.whoLabel}>Lo hace</span>
        {o.finale ? (
          <span className={styles.whoChip}>
            <span className={styles.whoName}>toda la mesa</span>
          </span>
        ) : (
          (o.assignees?.length ? o.assignees : ["quien le toque"]).map((name, i) => (
            <span key={i} className={styles.whoChip}>
              <CharacterAvatar id={charFor(name)} size="sm" />
              <span className={styles.whoName}>{name}</span>
            </span>
          ))
        )}
      </div>

      {inPrep ? (
        <div className={styles.prep}>
          <span className={styles.prepLabel}>Armen el memory en la mesa</span>
          <span className={styles.prepTime}>{mmss(prepLeft)}</span>
        </div>
      ) : (
        <>
          {open && (
            <div className={styles.checklist}>
              <span className={styles.checkHead}>
                <span>Checklist · lo marcan los demás</span>
                <span className={styles.checkMeta}>
                  {dueLeft != null && (
                    <span
                      className={`${styles.dueLeft} ${urgent ? styles.dueUrgent : ""}`}
                      title="Si se vence sin entregar, el restaurante pierde moneditas"
                    >
                      vence en {mmss(Math.max(0, dueLeft))}
                    </span>
                  )}
                  <span className={styles.checkCount}>
                    {marked}/{o.items.length}
                  </span>
                </span>
              </span>
              <ul className={styles.checkList}>
                {o.items.map((id, i) => (
                  <li key={i} className={styles.checkRow}>
                    <CharacterAvatar id={id} size="sm" />
                    <span className={styles.checkName}>
                      {characterById(id).name}
                    </span>
                    <CheckTri
                      state={o.check?.[i] ?? null}
                      onClick={() => {
                        sfx.select();
                        dispatch({ type: "setOrderCheck", id: o.id, idx: i });
                      }}
                    />
                  </li>
                ))}
              </ul>
              <Button
                variant="secondary"
                wide
                sound="press"
                disabled={!complete}
                onClick={() => {
                  sfx.press();
                  dispatch({ type: "deliverOrder", id: o.id });
                }}
              >
                {complete
                  ? "Marcar como entregado"
                  : `Faltan ${o.items.length - marked} por revisar`}
              </Button>
            </div>
          )}

          <button
            className={styles.toggle}
            onClick={() => {
              sfx.tap();
              setOpen((v) => !v);
            }}
            aria-expanded={open}
          >
            <span>{open ? "Ocultar checklist" : "Ver checklist"}</span>
            <svg
              className={`${styles.chev} ${open ? styles.chevUp : ""}`}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M5 9l7 7 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}
    </article>
  );
}
