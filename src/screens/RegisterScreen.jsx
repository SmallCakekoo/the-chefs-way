import { useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { MAX_PLAYERS, MIN_PLAYERS, CHEFS, characterById, faceStyle } from "../game/board.js";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "./menuAssets.js";
import styles from "./RegisterScreen.module.css";

const BASE = "/scenary/player register/";
const MENU = "/scenary/menu/";

// Posiciones sobre el lienzo 1920x1080 (finalidea.svg).
const ROW_X = 105;
const ROW_Y = 420;
const ROW_STEP = 140;

/** Siguiente chef libre (no elegido) en la dirección dada. */
function nextFree(taken, from, dir) {
  const n = CHEFS.length;
  for (let k = 1; k <= n; k++) {
    const c = CHEFS[(((from + dir * k) % n) + n) % n];
    if (!taken.includes(c.id)) return CHEFS.indexOf(c);
  }
  return from;
}

export default function RegisterScreen() {
  const { players, dispatch, navigate } = useGame();
  const scale = useStageScale();
  const taken = players.map((p) => p.characterId);
  const [name, setName] = useState("");
  const [idx, setIdx] = useState(() =>
    Math.max(0, CHEFS.findIndex((c) => !taken.includes(c.id)))
  );

  const client = CHEFS[idx];
  const full = players.length >= MAX_PLAYERS;
  const canStart = players.length >= MIN_PLAYERS;
  const missing = Math.max(0, MIN_PLAYERS - players.length);

  const step = (dir) => {
    sfx.select();
    setIdx(nextFree(taken, idx, dir));
  };

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed || full || taken.includes(client.id)) return;
    sfx.tap();
    dispatch({ type: "addPlayer", player: { name: trimmed, characterId: client.id } });
    setName("");
    setIdx(nextFree([...taken, client.id], idx, 1));
  };

  const rows = Array.from({ length: MAX_PLAYERS }, (_, i) => players[i] || null);

  return (
    <main className={styles.root} style={{ "--s": scale }}>
      {/* izquierda: cocina a pantalla completa + selector de chef */}
      <section className={styles.scene}>
        <img
          className={styles.kitchen}
          src={BASE + "background.svg"}
          alt=""
          aria-hidden="true"
          draggable="false"
        />

        <button className={styles.back} aria-label="Volver al menú" onClick={() => navigate("menu")}>
          <img src="/scenary/common/backbtn.svg" alt="" draggable="false" />
        </button>

        <div className={styles.sceneStage}>
          <button
            className={`${styles.arrow} ${styles.arrowL}`}
            aria-label="Chef anterior"
            onClick={() => step(-1)}
          >
            <img src={BASE + "arrow.svg"} alt="" draggable="false" />
          </button>
          <button
            className={`${styles.arrow} ${styles.arrowR}`}
            aria-label="Chef siguiente"
            onClick={() => step(1)}
          >
            <img src={BASE + "arrow.svg"} alt="" draggable="false" />
          </button>
          <div className={styles.stageCat} aria-live="polite">
            <img key={client.id} src={client.src} alt={client.name} draggable="false" style={faceStyle(client)} />
            <span className={styles.catName}>{client.name}</span>
          </div>

          <button
            className={styles.go}
            disabled={!canStart}
            onClick={() => {
              sfx.press();
              dispatch({ type: "startGame" });
            }}
          >
            <img src={MENU + "btn.svg"} alt="" aria-hidden="true" draggable="false" />
            <span className={styles.goLabel}>
              {canStart ? "Continuar" : `Faltan ${missing}`}
            </span>
          </button>
        </div>
      </section>

      {/* derecha: panel de jugadores */}
      <aside className={styles.side}>
        <div className={styles.sideStage}>
          <div className={styles.panel}>
          <img
            className={styles.prop}
            src={BASE + "framenostar.svg"}
            alt=""
            aria-hidden="true"
            draggable="false"
            style={{ left: 52.9, top: 226, width: 679, height: 821 }}
          />
          <img className={`${styles.star} ${styles.starBig}`} src={BASE + "star.svg"} alt="" aria-hidden="true" draggable="false" />
          <img className={`${styles.star} ${styles.starL}`} src={BASE + "starnoshadow.svg"} alt="" aria-hidden="true" draggable="false" />
          <img className={`${styles.star} ${styles.starR}`} src={BASE + "starnoshadow.svg"} alt="" aria-hidden="true" draggable="false" />
          <h1 className={styles.title}>Jugadores</h1>
          </div>

          <div className={styles.nameRow}>
            <div className={styles.nameBox}>
              <img src={BASE + "namebox.svg"} alt="" aria-hidden="true" draggable="false" />
              <input
                className={styles.input}
                placeholder="Tu nombre"
                maxLength={14}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                aria-label="Nombre del jugador"
              />
            </div>
            <button
              className={styles.add}
              onClick={add}
              disabled={full || !name.trim()}
              aria-label="Agregar jugador"
            >
              <img src={BASE + "add.svg"} alt="" draggable="false" />
            </button>
          </div>

          <div className={styles.panel}>
          {rows.map((p, i) => {
            const c = p && characterById(p.characterId);
            return (
              <div
                key={i}
                className={`${styles.row} ${p ? "" : styles.empty}`}
                style={{ left: ROW_X, top: ROW_Y + i * ROW_STEP }}
              >
                <img
                  className={styles.rowBg}
                  src={BASE + "playerbox.svg"}
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                />
                {p ? (
                  <>
                    <span className={styles.avatar}>
                      <img src={c.src} alt="" draggable="false" style={faceStyle(c)} />
                    </span>
                    <span className={styles.pname}>{p.name}</span>
                    <button
                      className={styles.rm}
                      aria-label={`Quitar a ${p.name}`}
                      onClick={() => {
                        sfx.back();
                        dispatch({ type: "removePlayer", index: i });
                      }}
                    >
                      <svg width="26" height="26" viewBox="0 0 16 16" aria-hidden="true">
                        <path
                          d="M3 3l10 10M13 3L3 13"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </>
                ) : (
                  <span className={styles.slot}>
                    {i < MIN_PLAYERS ? `Jugador ${i + 1}` : `Jugador ${i + 1} (opcional)`}
                  </span>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </aside>
    </main>
  );
}
