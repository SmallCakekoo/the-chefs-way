import TopBar from "./TopBar.jsx";
import styles from "./Screen.module.css";

/**
 * Estructura comun de pantalla: TopBar (opcional) + area de contenido.
 * `layout`: "single" (centrada) | "panes" (2 col) | "flow" (scroll)
 *           | "turn" (1 col -> 2 col con [data-outcome]) | "bleed" (a sangre).
 */
export default function Screen({
  onBack,
  onSettings,
  layout = "single",
  bare = false,
  children,
}) {
  return (
    <div className={styles.screen}>
      {!bare && <TopBar onBack={onBack} onSettings={onSettings} />}
      <div className={`${styles.body} ${styles[layout]}`}>{children}</div>
    </div>
  );
}

export function Pane({ vcenter = false, center = false, divider = false, children }) {
  return (
    <div
      className={[
        styles.pane,
        vcenter && styles.vcenter,
        center && styles.center,
        divider && styles.divider,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
