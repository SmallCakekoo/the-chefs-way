import { sfx } from "../lib/sfx.js";
import Logo from "./Logo.jsx";
import styles from "./TopBar.module.css";

/** Cabecera minima: volver (opcional) + marca + ajustes (opcional). */
export default function TopBar({ onBack, onSettings }) {
  return (
    <header className={styles.bar}>
      {onBack && (
        <button
          className={styles.icon}
          onClick={() => {
            sfx.back();
            onBack();
          }}
          aria-label="Volver"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M15 5 8 12l7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <Logo className={styles.mark} />
      <span className={styles.spacer} />
      {onSettings && (
        <button
          className={styles.icon}
          onClick={() => {
            sfx.tap();
            onSettings();
          }}
          aria-label="Sonido"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="3.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20M6 6l1.8 1.8M16.2 16.2 18 18M18 6l-1.8 1.8M7.8 16.2 6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </header>
  );
}
