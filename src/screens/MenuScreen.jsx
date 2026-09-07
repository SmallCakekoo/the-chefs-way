import { useGame } from "../game/GameContext.jsx";
import Screen from "../components/Screen.jsx";
import CharacterAvatar from "../components/CharacterAvatar.jsx";
import { characterById } from "../game/board.js";
import { evaluate } from "../game/achievements.js";
import { sfx } from "../lib/sfx.js";
import styles from "./MenuScreen.module.css";

const ENTRIES = [
  { key: "rules", label: "Cómo se juega", hint: "Reglas, casillas y pedidos", tint: "yellow", char: "taco" },
  { key: "profile", label: "Perfil", hint: "Tu chef y tus logros", tint: "teal", char: "huevo" },
  { key: "settings", label: "Ajustes", hint: "Sonido, tema y cadencia", tint: "paper", char: "aguacate" },
];

export default function MenuScreen() {
  const { navigate, dispatch, finishOrder, profile, stats } = useGame();
  const achievements = evaluate(stats);
  const unlocked = achievements.filter((a) => a.unlocked).length;

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
    <Screen layout="flow">
      <div className={styles.grid}>
        {/* --- panel principal --- */}
        <section className={styles.hero}>
          <span className={styles.kicker}>Un dispositivo · por turnos</span>
          <h1 className={styles.title}>La cocina te espera, chef</h1>
          <p className={styles.sub}>
            Arma la partida, pásense el dispositivo y cooperen para que el
            restaurante no quiebre. Solo uno se lleva el puesto de empleado del
            mes.
          </p>

          <div className={styles.ctaWrap}>
            <button className={styles.cta} onClick={() => go("play")}>
              Jugar · nueva partida
            </button>
            <span className={styles.ctaNote}>2 a 4 chefs</span>
          </div>

          <img
            className={`${styles.deco} ${styles.deco1}`}
            src={characterById("pollo").src}
            alt=""
            aria-hidden="true"
          />
          <img
            className={`${styles.deco} ${styles.deco2}`}
            src={characterById("cebolla").src}
            alt=""
            aria-hidden="true"
          />
        </section>

        {/* --- barra lateral --- */}
        <aside className={styles.rail}>
          {ENTRIES.map((e) => (
            <button
              key={e.key}
              className={`${styles.entry} ${styles["t_" + e.tint]}`}
              onClick={() => go(e.key)}
            >
              <span className={styles.entryText}>
                <span className={styles.entryLabel}>{e.label}</span>
                <span className={styles.entryHint}>{e.hint}</span>
              </span>
              <img
                className={styles.entryChar}
                src={characterById(e.char).src}
                alt=""
                aria-hidden="true"
              />
              <span className={styles.chev} aria-hidden="true">
                ›
              </span>
            </button>
          ))}

          <div className={styles.summary}>
            <CharacterAvatar id={profile.characterId} size="sm" />
            <span className={styles.summaryText}>
              <strong>{profile.name}</strong>
              <span>
                Logros {unlocked}/{achievements.length}
                {finishOrder.length > 0 && ` · última: ${finishOrder[0]}`}
              </span>
            </span>
          </div>
        </aside>
      </div>
    </Screen>
  );
}
