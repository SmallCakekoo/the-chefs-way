import { useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import Button from "./Button.jsx";
import CharacterAvatar from "./CharacterAvatar.jsx";
import { characterById } from "../game/board.js";
import { sfx } from "../lib/sfx.js";
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

/** Viñeta de un pedido + checklist. `defaultOpen` abre el checklist de entrada. */
export default function OrderCard({ order: o, defaultOpen = false }) {
  const { players, dispatch } = useGame();
  const [open, setOpen] = useState(defaultOpen);

  const charFor = (name) =>
    players.find((p) => p.name === name)?.characterId || "queso";
  const marked = o.items.filter((_, i) => o.check?.[i] != null).length;
  const complete = marked === o.items.length;

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.catSlot} aria-hidden="true">
          gato
        </span>

        <div className={styles.bubble}>
          <span className={styles.from}>
            {o.cat} te pide
            <span className={styles.num}>#{o.num}</span>
          </span>
          <span className={styles.dish}>Un {o.dish} con:</span>
          <div className={styles.chips}>
            {o.items.map((id, i) => (
              <span key={i} className={styles.chip}>
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

      {open && (
        <div className={styles.checklist}>
          <span className={styles.checkHead}>
            Checklist · lo marcan los demás
            <span className={styles.checkCount}>
              {marked}/{o.items.length}
            </span>
          </span>
          <ul className={styles.checkList}>
            {o.items.map((id, i) => (
              <li key={i} className={styles.checkRow}>
                <CharacterAvatar id={id} size="sm" />
                <span className={styles.checkName}>{characterById(id).name}</span>
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
    </article>
  );
}
