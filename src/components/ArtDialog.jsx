import { forwardRef, useEffect } from "react";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "../screens/menuAssets.js";
import styles from "./ArtDialog.module.css";

/** Botón de madera de los diálogos (mismo btn.svg del menú). */
export const ArtButton = forwardRef(function ArtButton(
  { children, onClick, sound = "tap", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={styles.btn}
      onClick={(e) => {
        if (sound && sfx[sound]) sfx[sound]();
        onClick?.(e);
      }}
      {...props}
    >
      <img src="/scenary/common/btn.svg" alt="" aria-hidden="true" draggable="false" />
      <span>{children}</span>
    </button>
  );
});

/** Diálogo con el marco chico de common (littleframe.svg).
 *  `title` va en el arco, `children` en el cuerpo y `actions` abajo. Cierra con Escape o tocando fuera. */
export default function ArtDialog({ open, title, onClose, label, children, actions, tall = false }) {
  const scale = useStageScale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={`${styles.stage} ${tall ? styles.tall : ""}`}
        style={{ "--k": scale * 1.1 }}
        role="alertdialog"
        aria-modal="true"
        aria-label={label || title}
        onClick={(e) => e.stopPropagation()}
      >
        <img className={styles.frame} src={tall ? "/scenary/player register/framenostar.svg" : "/scenary/common/littleframe.svg"} alt="" aria-hidden="true" draggable="false" />
        <img className={styles.star} src="/scenary/player register/star.svg" alt="" aria-hidden="true" draggable="false" />
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>{actions}</div>
      </div>
    </div>
  );
}
