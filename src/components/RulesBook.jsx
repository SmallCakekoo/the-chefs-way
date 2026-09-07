import { useState } from "react";
import CharacterAvatar from "./CharacterAvatar.jsx";
import { sfx } from "../lib/sfx.js";
import styles from "./RulesBook.module.css";

const PAGES = [
  {
    n: 1,
    char: "pan",
    tint: "var(--coral-tint)",
    title: "Objetivo",
    body: "Cooperen para sacar los pedidos a tiempo. Si el restaurante quiebra, pierden todos.",
  },
  {
    n: 2,
    char: "huevo",
    tint: "var(--orange-tint)",
    title: "Turnos y dado",
    body: "Un dispositivo se pasa entre jugadores. Tiras el dado y avanzas esa cantidad en el tablero.",
  },
  {
    n: 3,
    char: "cebolla",
    tint: "var(--berry-tint)",
    title: "Bifurcaciones",
    body: "Algunas casillas dividen el camino. La app pregunta por dónde fuiste; ciertas ramas son atajos.",
  },
  {
    n: 4,
    char: "queso",
    tint: "var(--yellow-tint)",
    title: "Empleado del mes",
    body: "Llegar primero ayuda, pero también cuentan los pedidos que completaste y tu velocidad.",
  },
];

export default function RulesBook() {
  const [page, setPage] = useState(0);
  const p = PAGES[page];
  const go = (i) => {
    sfx.tap();
    setPage(Math.max(0, Math.min(PAGES.length - 1, i)));
  };

  return (
    <div className={styles.book}>
      <span className={styles.spine} aria-hidden="true" />
      <div className={styles.page} key={page}>
        <span className={styles.leaf}>Paso {p.n} de {PAGES.length}</span>
        <span className={styles.art} style={{ background: p.tint }}>
          <CharacterAvatar id={p.char} size="lg" />
        </span>
        <p className={styles.title}>{p.title}</p>
        <p className={styles.body}>{p.body}</p>
      </div>

      <div className={styles.nav}>
        <button
          className={styles.arrow}
          onClick={() => go(page - 1)}
          disabled={page === 0}
          aria-label="Paso anterior"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={styles.dots}>
          {PAGES.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === page ? styles.dotOn : ""}`}
              onClick={() => go(i)}
              aria-label={`Ir al paso ${i + 1}`}
            />
          ))}
        </div>
        <button
          className={styles.arrow}
          onClick={() => go(page + 1)}
          disabled={page === PAGES.length - 1}
          aria-label="Paso siguiente"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
