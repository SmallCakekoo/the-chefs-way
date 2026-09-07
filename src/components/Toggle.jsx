import { sfx } from "../lib/sfx.js";
import styles from "./Toggle.module.css";

/** Interruptor plano. */
export default function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.on : ""}`}
      onClick={() => {
        sfx.select();
        onChange(!checked);
      }}
    >
      <span className={styles.knob} />
      {label && <span className={styles.srOnly}>{label}</span>}
    </button>
  );
}
