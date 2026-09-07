import styles from "./CatFace.module.css";

/** Carita de gato line-art (el gato que hace el pedido). */
export default function CatFace({ className = "" }) {
  return (
    <svg
      className={`${styles.cat} ${className}`}
      viewBox="0 0 110 96"
      aria-hidden="true"
    >
      <g className={styles.stroke}>
        {/* orejas + cabeza */}
        <path d="M30 34c-4-14-6-22-3-24s10 4 17 11M80 34c4-14 6-22 3-24s-10 4-17 11" />
        <path d="M23 52c0-19 14-30 32-30s32 11 32 30c0 15-10 26-22 30-6 2-14 2-20 0-12-4-22-15-22-30Z" />
        {/* ojos */}
        <ellipse className={styles.fill} cx="42" cy="50" rx="8.5" ry="11" />
        <ellipse className={styles.fill} cx="68" cy="50" rx="8.5" ry="11" />
        <circle className={styles.glint} cx="45" cy="45" r="2.6" />
        <circle className={styles.glint} cx="71" cy="45" r="2.6" />
        {/* nariz + boca */}
        <path d="M52 62l3 3 3-3M55 65v3M50 70c2 2 8 2 10 0" />
        {/* bigotes */}
        <path d="M14 54l16 3M14 62l16-1M96 54l-16 3M96 62l-16-1" />
        {/* lineas de movimiento */}
        <path d="M6 30l7 4M8 44H1M100 44h7M104 30l-7 4" />
      </g>
      {/* rubor */}
      <ellipse className={styles.blush} cx="34" cy="64" rx="6" ry="3.4" />
      <ellipse className={styles.blush} cx="76" cy="64" rx="6" ry="3.4" />
    </svg>
  );
}
