import { useEffect, useState } from "react";
import { DIE_PIPS } from "../game/board.js";
import { sfx } from "../lib/sfx.js";
import styles from "./Die.module.css";

/* Dado 3D solo con CSS: cubo de seis caras (preserve-3d), los puntos son CSS.
   Caras opuestas suman 7: 1 frente · 6 atrás · 2 derecha · 5 izquierda · 3 arriba · 4 abajo. */

// posición de los puntos en una cuadrícula 3x3: [fila, columna]
const PIPS = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [2, 1], [3, 1], [1, 3], [2, 3], [3, 3]],
};

// giro del cubo para dejar a la vista cada cara: [rotateX, rotateY]
const SHOW = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };

const KEY = "chefsway.die";
const readMode = () => {
  try {
    return localStorage.getItem(KEY) === "2d" ? "2d" : "3d";
  } catch {
    return "3d";
  }
};

/** `value` 1..6 (o null antes de tirar). `roll` cuenta las tiradas: en 3D cada una suma varias vueltas completas
 *  antes de asentarse en la cara que salió; en 2D la cara gira y rebota. Al tocar el dado se alterna 2D / 3D
 *  (se recuerda en este dispositivo). */
export default function Die({ value = null, roll = 0 }) {
  const [mode, setMode] = useState(readMode);
  // 2D (el dado plano de siempre): mientras rueda cambia de cara rápido y luego se asienta en la que salió
  const [shown, setShown] = useState(value);
  const [spinning, setSpinning] = useState(false);
  useEffect(() => {
    if (mode !== "2d" || !roll) {
      setShown(value);
      setSpinning(false);
      return;
    }
    setSpinning(true);
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      if (n >= 22) {
        clearInterval(id);
        setShown(value);
        setSpinning(false);
      } else {
        setShown(1 + Math.floor(Math.random() * 6));
      }
    }, 70);
    return () => clearInterval(id);
  }, [roll, mode]);
  const [fx, fy] = SHOW[value] || [0, 0];
  // vueltas completas extra (múltiplos de 360°) por tirada: no cambian la cara final
  const x = fx + roll * 1080;
  const y = fy + roll * 1440;

  const toggle = () => {
    const next = mode === "3d" ? "2d" : "3d";
    sfx.tap();
    setMode(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* sin almacenamiento: solo esta sesión */
    }
  };

  return (
    <button
      type="button"
      className={`${styles.wrap} ${mode === "2d" ? styles.wrap2d : ""}`}
      onClick={toggle}
      title={mode === "3d" ? "Cambiar a dado 2D" : "Cambiar a dado 3D"}
      aria-label={`${value ? `Dado: ${value}` : "Dado sin tirar"}. Tocar para cambiar a ${mode === "3d" ? "2D" : "3D"}`}
    >
      {mode === "3d" ? <div className={styles.shadow} aria-hidden="true" /> : null}
      {mode === "3d" ? (
        <div className={styles.scene}>
          <div className={styles.cube} style={{ transform: `rotateX(${x}deg) rotateY(${y}deg)` }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className={`${styles.face} ${styles["f" + n]}`}>
                {PIPS[n].map(([r, c], i) => (
                  <i key={i} className={styles.pip} style={{ gridRow: r, gridColumn: c }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div key={roll} className={`${styles.die2d} ${spinning ? styles.rolling : shown ? styles.settled : ""}`} aria-hidden="true">
          {shown ? (
            <svg viewBox="0 0 100 100" key={shown}>
              {(DIE_PIPS[shown] || []).map(([cx, cy], i) => (
                <circle key={i} className={styles.svgPip} cx={cx} cy={cy} r="9.5" />
              ))}
            </svg>
          ) : (
            <span className={styles.empty} aria-hidden="true">
              ?
            </span>
          )}
        </div>
      )}
    </button>
  );
}
