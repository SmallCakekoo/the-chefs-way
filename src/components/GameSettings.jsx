import { useGame } from "../game/GameContext.jsx";
import { sfx } from "../lib/sfx.js";
import ArtDialog, { ArtButton } from "./ArtDialog.jsx";
import styles from "./GameSettings.module.css";

/** Interruptor grande de madera/monedas (rol switch). */
function Switch({ label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.switch} ${checked ? styles.on : ""}`}
      onClick={() => {
        sfx.select();
        onChange(!checked);
      }}
    >
      <span className={styles.knob} />
    </button>
  );
}

/** Panel rápido de sonido durante la partida. */
export default function GameSettings({ open, onClose }) {
  const { settings, dispatch } = useGame();
  const set = (key, value) => dispatch({ type: "setSetting", key, value });
  const vol = Math.round(settings.musicVolume * 100);

  return (
    <ArtDialog
      open={open}
      title="Sonido"
      tall
      onClose={onClose}
      actions={<ArtButton onClick={onClose}>Listo</ArtButton>}
    >
      <div className={styles.list}>
        <div className={styles.row}>
          <span className={styles.label}>Efectos</span>
          <Switch label="Efectos de sonido" checked={settings.sound} onChange={(v) => set("sound", v)} />
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Música</span>
          <Switch label="Música" checked={settings.music} onChange={(v) => set("music", v)} />
        </div>

        <div className={`${styles.row} ${styles.volume} ${settings.music ? "" : styles.off}`}>
          <span className={styles.label}>Volumen</span>
          <span className={styles.pct}>{vol}%</span>
          <input
            className={styles.range}
            type="range"
            min="0"
            max="100"
            step="5"
            value={vol}
            disabled={!settings.music}
            aria-label="Volumen de la música"
            style={{ "--v": `${vol}%` }}
            onChange={(e) => set("musicVolume", Number(e.target.value) / 100)}
          />
        </div>

        <p className={styles.note}>El aviso de pedido nuevo siempre suena y vibra.</p>
      </div>
    </ArtDialog>
  );
}
