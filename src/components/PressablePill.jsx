import { sfx } from "../lib/sfx.js";
import styles from "./PressablePill.module.css";

/** Opcion seleccionable plana (bifurcaciones, listas). */
export default function PressablePill({ className = "", onClick, ...props }) {
  return (
    <button
      type="button"
      className={`${styles.pill} ${className}`}
      onClick={(e) => {
        sfx.tap();
        onClick?.(e);
      }}
      {...props}
    />
  );
}
