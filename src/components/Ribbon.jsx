import styles from "./Ribbon.module.css";

/** Cinta de menu tipo "Today's Menu" del moodboard: banda con puntas
 *  de banderin y contorno de tinta. tone: primary | secondary | yellow | forest */
export default function Ribbon({ children, tone = "primary", className = "" }) {
  return (
    <div className={`${styles.wrap} ${className}`}>
      <span className={`${styles.ribbon} ${styles[tone]}`}>{children}</span>
    </div>
  );
}
