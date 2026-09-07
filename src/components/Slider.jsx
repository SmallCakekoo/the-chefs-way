import styles from "./Slider.module.css";

/** Control de rango plano. value 0..1. */
export default function Slider({ value, onChange, label, ariaLabel }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <label className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.track}>
        <input
          type="range"
          min="0"
          max="100"
          value={pct}
          aria-label={ariaLabel || label}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          style={{ "--pct": `${pct}%` }}
          className={styles.input}
        />
      </span>
      <span className={styles.value}>{pct}%</span>
    </label>
  );
}
