import { useEffect } from "react";
import { useGame } from "../game/GameContext.jsx";
import { useStageScale } from "../screens/menuAssets.js";
import styles from "./Toasts.module.css";

/** Avisos cortos de la partida (demandas, turnos perdidos, cartas usadas…). Cada uno se va solo a los ~4 s. */
export default function Toasts() {
  const { toasts, dispatch } = useGame();
  const scale = useStageScale();
  const last = toasts[toasts.length - 1];

  useEffect(() => {
    if (!toasts.length) return;
    const first = toasts[0];
    const t = setTimeout(() => dispatch({ type: "dismissToast", id: first.id }), 4200);
    return () => clearTimeout(t);
  }, [toasts, dispatch]);

  if (!last) return null;
  return (
    <div className={styles.root} style={{ "--s": scale }} aria-live="polite">
      {toasts.map((t) => (
        <p key={t.id} className={`${styles.toast} ${styles[t.kind] || ""}`}>
          {t.kind !== "info" && (
            <img src={`/events/${t.kind === "bad" ? "bad" : "good"}.svg`} alt="" aria-hidden="true" draggable="false" />
          )}
          <span>{t.text}</span>
        </p>
      ))}
    </div>
  );
}
