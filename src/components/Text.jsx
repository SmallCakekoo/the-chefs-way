import styles from "./Text.module.css";

export function DisplayTitle({ align = "center", className = "", ...p }) {
  return <h2 className={`${styles.display} ${styles[align]} ${className}`} {...p} />;
}

export function BodyText({ align = "center", muted = true, className = "", ...p }) {
  return (
    <p
      className={[styles.body, styles[align], muted && styles.muted, className]
        .filter(Boolean)
        .join(" ")}
      {...p}
    />
  );
}
