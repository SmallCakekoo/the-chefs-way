import styles from "./Lightning.module.css";

/** Relámpagos de la quiebra: la pantalla entera parpadea en blanco, como si cayera un rayo, y se repite cada
 *  pocos segundos (el contrapunto del confeti cuando el restaurante triunfa). pointer-events: none. */
export default function Lightning() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.flash} />
      <div className={`${styles.flash} ${styles.late}`} />
    </div>
  );
}
