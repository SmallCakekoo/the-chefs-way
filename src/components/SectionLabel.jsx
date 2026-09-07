import styles from "./SectionLabel.module.css";

/** Chip de seccion tipo pestana de menu.
 *  tone: primary | ink | solidPrimary | solidSecondary | solidYellow | solidForest */
export default function SectionLabel({ children, tone = "primary", className = "" }) {
  return (
    <span className={`${styles.label} ${styles[tone] || styles.primary} ${className}`}>
      {children}
    </span>
  );
}
