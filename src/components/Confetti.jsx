import styles from "./Confetti.module.css";

const COLORS = [
  "var(--coral)",
  "var(--orange)",
  "var(--yellow)",
  "var(--lime)",
  "var(--teal)",
  "var(--berry)",
];

const PIECES = Array.from({ length: 42 }, (_, i) => {
  const dur = 2.8 + ((i * 7) % 24) / 10;
  return {
    left: (i * 2.37) % 100,
    delay: -((i * 0.41) % dur), // negativo: la pantalla ya nace poblada
    dur,
    sway: ((i % 5) - 2) * 16,
    color: COLORS[i % COLORS.length],
    round: i % 3 === 0,
  };
});

/** Confeti decorativo. pointer-events:none; se congela con reduced-motion. */
export default function Confetti() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={`${styles.bit} ${p.round ? styles.round : ""}`}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            "--sway": `${p.sway}px`,
          }}
        />
      ))}
    </div>
  );
}
