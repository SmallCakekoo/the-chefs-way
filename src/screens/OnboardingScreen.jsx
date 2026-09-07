import { useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import Screen from "../components/Screen.jsx";
import Button from "../components/Button.jsx";
import { characterById } from "../game/board.js";
import styles from "./OnboardingScreen.module.css";

const SLIDES = [
  {
    tint: "var(--coral-tint)",
    char: "huevo",
    kicker: "Cooperativo",
    title: "La cocina está saturada",
    body: "Cooperen entre todos para sacar los pedidos a tiempo. Si el restaurante no rinde, quiebra, y eso les pasa a todos por igual.",
  },
  {
    tint: "var(--orange-tint)",
    char: "pollo",
    kicker: "Pero competitivo",
    title: "Solo uno es empleado del mes",
    body: "Ayudar o sabotear queda en tus manos. Cada carta y cada decisión te acercan o alejan del puesto individual.",
  },
  {
    tint: "var(--yellow-tint)",
    char: "taco",
    kicker: "Un dispositivo",
    title: "Se juega por turnos",
    body: "El tablero y las cartas están en la mesa. Este dispositivo se pasa de jugador en jugador: tira tu dado y sigue jugando.",
  },
];

export default function OnboardingScreen() {
  const { dispatch, onboardingReplay } = useGame();
  const [idx, setIdx] = useState(0);
  const last = idx >= SLIDES.length - 1;
  const done = () =>
    dispatch({
      type: "finishOnboarding",
      next: onboardingReplay ? "settings" : "menu",
    });

  const next = () => (last ? done() : setIdx(idx + 1));
  const prev = () => setIdx(Math.max(0, idx - 1));

  return (
    <Screen bare layout="bleed">
      <button className={styles.skip} onClick={done}>
        {onboardingReplay ? "Cerrar" : "Saltar"}
      </button>

      <div className={styles.viewport}>
        <div className={styles.track} style={{ translate: `-${idx * 100}% 0` }}>
          {SLIDES.map((s, i) => (
            <div className={styles.slide} key={i} aria-hidden={i !== idx}>
              <div className={styles.art} style={{ background: s.tint }}>
                <img src={characterById(s.char).src} alt="" />
              </div>
              <div className={styles.text}>
                <span className={styles.kicker}>{s.kicker}</span>
                <p className={styles.title}>{s.title}</p>
                <p className={styles.body}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === idx ? styles.on : ""}`}
              onClick={() => setIdx(i)}
              aria-label={`Ir al paso ${i + 1}`}
            />
          ))}
        </div>
        {idx > 0 && <Button onClick={prev}>Atrás</Button>}
        <Button variant="primary" onClick={next} sound="press">
          {last ? "Comenzar" : "Siguiente"}
        </Button>
      </div>
    </Screen>
  );
}
