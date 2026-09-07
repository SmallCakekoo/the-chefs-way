import styles from "./Tag.module.css";

/** Etiqueta de casilla. tone: o | a | y | b */
export default function Tag({ tone = "o", children }) {
  return <span className={`${styles.tag} ${styles[tone]}`}>{children}</span>;
}
