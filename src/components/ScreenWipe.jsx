import styles from "./ScreenWipe.module.css";

/** Transición entre pantallas: una cortina de cuadritos (como el mantel del tablero) que se abre en círculo
 *  desde el centro y deja ver la pantalla nueva. Se monta con un `key` distinto en cada cambio de pantalla. */
export default function ScreenWipe() {
  return <div className={styles.wipe} aria-hidden="true" />;
}
