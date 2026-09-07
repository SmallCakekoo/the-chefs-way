import { useEffect } from "react";
import { useGame } from "../game/GameContext.jsx";
import Toggle from "./Toggle.jsx";
import Slider from "./Slider.jsx";
import Button from "./Button.jsx";
import styles from "./GameSettings.module.css";

/** Panel rápido de sonido durante la partida. */
export default function GameSettings({ open, onClose }) {
  const { settings, dispatch } = useGame();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const set = (key, value) => dispatch({ type: "setSetting", key, value });

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Sonido"
        onClick={(e) => e.stopPropagation()}
      >
        <p className={styles.title}>Sonido</p>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Efectos</span>
          <Toggle
            label="Efectos de sonido"
            checked={settings.sound}
            onChange={(v) => set("sound", v)}
          />
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Música</span>
          <Toggle
            label="Música"
            checked={settings.music}
            onChange={(v) => set("music", v)}
          />
        </div>

        <div className={`${styles.sliderRow} ${!settings.music ? styles.off : ""}`}>
          <Slider
            label="Volumen"
            ariaLabel="Volumen de la música"
            value={settings.musicVolume}
            onChange={(v) => set("musicVolume", v)}
          />
        </div>

        <p className={styles.note}>
          El aviso de pedido nuevo siempre suena y vibra.
        </p>

        <Button variant="primary" wide onClick={onClose}>
          Listo
        </Button>
      </div>
    </div>
  );
}
