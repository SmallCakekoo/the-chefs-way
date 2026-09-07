import styles from "./Field.module.css";

/** Input de texto chunky. */
export default function Field({ className = "", ...props }) {
  return <input className={`${styles.field} ${className}`} {...props} />;
}
