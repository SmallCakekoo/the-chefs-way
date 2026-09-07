import { DIE_PIPS } from "../game/board.js";
import styles from "./Die.module.css";

/** Dado plano. `value` 1..6 o null. `rolling` anima el volteo. */
export default function Die({ value = null, rolling = false }) {
  const pips = value ? DIE_PIPS[value] || [] : [];
  const state = rolling ? styles.rolling : value ? styles.settled : "";
  return (
    <div className={`${styles.die} ${state}`}>
      {value ? (
        <svg viewBox="0 0 100 100" aria-label={`Dado: ${value}`} key={value}>
          {pips.map(([cx, cy], i) => (
            <circle key={i} className={styles.pip} cx={cx} cy={cy} r="9.5" />
          ))}
        </svg>
      ) : (
        <span className={styles.empty} aria-hidden="true">
          ?
        </span>
      )}
    </div>
  );
}
