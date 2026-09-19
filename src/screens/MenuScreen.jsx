import { useEffect, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { sfx } from "../lib/sfx.js";
import { BASE, fitScale } from "./menuAssets.js";
import styles from "./MenuScreen.module.css";

// Botones: mismas posiciones que en el montaje (finalidea.svg).
const BTN_X = 95;
const BTN_Y = 260;
const BTN_STEP = 165;
const ENTRIES = [
  { key: "play", label: "Jugar" },
  { key: "profile", label: "Perfil" },
  { key: "settings", label: "Config" },
];

// Objetos: [clase, archivo, x, y, ancho, alto, transformación]. Se pintan en este orden, sobre la olla.
const PROPS = [
  ["salt1", "salt1.svg", 251.56, 838, 116, 144],
  ["salt2", "salt2.svg", 396.42, 816, 169, 180],
  ["board", "cuttingtable.svg", 637.35, 815.4, 510, 181],
  ["knife", "knife.svg", 813, 801, 299, 154],
  ["plant", "plant1.svg", 1187, 854, 164, 148],
  ["plant plantB", "plant1.svg", 1606, 767, 164, 148, "scaleX(-1) rotate(-10deg) scale(1.08)"],
  ["spoon", "spoon.svg", 1392.5, 862.5, 396, 130],
];

function useStageScale() {
  const [scale, setScale] = useState(fitScale);
  useEffect(() => {
    const onResize = () => setScale(fitScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return scale;
}

export default function MenuScreen() {
  const { navigate, dispatch, menuIntro } = useGame();
  const [intro] = useState(menuIntro);
  const scale = useStageScale();
  const [active, setActive] = useState(null);
  const [playing, setPlaying] = useState({});

  useEffect(() => {
    dispatch({ type: "menuIntroDone" });
  }, [dispatch]);

  const poke = (name) => {
    sfx.tap();
    setPlaying((p) => ({ ...p, [name]: (p[name] || 0) + 1 }));
  };

  const go = (key) => {
    sfx.tap();
    if (key === "play") {
      dispatch({ type: "resetGame" });
      navigate("register");
    } else {
      navigate(key);
    }
  };

  return (
    <main
      className={`${styles.root} ${intro ? styles.intro : ""}`}
      style={{ "--s": scale, "--check": `${113.34 * scale}px` }}
    >
      <div className={styles.stage}>
        <img
          className={styles.prop}
          src={BASE + "table.svg"}
          alt=""
          aria-hidden="true"
          draggable="false"
          style={{ left: -9.07, top: 841, width: 2055, height: 607 }}
        />

        {/* logo + olla (por detrás de las plantas y la cuchara) */}
        <div className={styles.logo}>
          <div
            key={"l" + (playing.pot || 0) + "-" + (playing.flame || 0)}
            className={`${styles.logoInner} ${playing.pot ? styles.hop : ""} ${playing.flame ? styles.shake : ""}`}
          >
            <img src={BASE + "logo.svg"} alt="The Chef's Way" draggable="false" />
            <span className={`${styles.eye} ${styles.eyeL}`} aria-hidden="true" />
            <span className={`${styles.eye} ${styles.eyeR}`} aria-hidden="true" />
          </div>
          <button
            className={`${styles.hit} ${styles.hitFlame}`}
            aria-label="Llama"
            data-no-hover=""
            onClick={() => poke("flame")}
          />
          <button
            className={`${styles.hit} ${styles.hitPot}`}
            aria-label="Olla"
            data-no-hover=""
            onClick={() => poke("pot")}
          />
        </div>

        {PROPS.map(([cls, file, x, y, w, h, tf], i) => {
          const name = cls.split(" ")[0] + (cls.includes("plantB") ? "B" : "");
          const isKnife = name === "knife";
          const imgClass = playing[name] ? styles.play : "";
          return (
            <div
              key={name}
              className={`${styles.obj} ${cls.split(" ").map((c) => styles[c]).join(" ")}`}
              style={{ "--i": i, left: x, top: y, width: w, height: h, transform: tf }}
            >
              <img
                key={playing[name] || 0}
                className={imgClass}
                src={BASE + file}
                alt=""
                draggable="false"
                onClick={isKnife || name === "board" ? undefined : () => poke(name)}
              />
              {isKnife && (
                <span className={styles.knifeHit} onClick={() => poke("knife")} />
              )}
            </div>
          );
        })}

        {/* menú */}
        <nav
          className={styles.menu}
          aria-label="Menú principal"
          onPointerLeave={() => setActive(null)}
        >
          {ENTRIES.map((e, i) => (
            <button
              key={e.key}
              className={styles.btn}
              style={{ "--i": i, left: BTN_X, top: BTN_Y + i * BTN_STEP }}
              onClick={() => go(e.key)}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <img src={BASE + "btn.svg"} alt="" aria-hidden="true" draggable="false" />
              <span className={styles.label}>{e.label}</span>
              <img
                className={`${styles.pointer} ${active === i ? styles.pointerOn : ""}`}
                src={BASE + "pointer.svg"}
                alt=""
                aria-hidden="true"
                draggable="false"
              />
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
