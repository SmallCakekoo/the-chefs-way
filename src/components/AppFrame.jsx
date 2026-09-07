import styles from "./AppFrame.module.css";

/** Marco fijo de tablet horizontal (iPad 4:3). Baja a columna móvil < 900px. */
export default function AppFrame({ children }) {
  return <div className={styles.frame}>{children}</div>;
}
