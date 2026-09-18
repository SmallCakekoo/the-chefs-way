import { useEffect, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { sfx } from "../lib/sfx.js";
import { BASE, fitScale, preloadMenu } from "./menuAssets.js";
import styles from "./LoginScreen.module.css";

/** Pantalla de carga: precarga el menú y espera "press any key". */
export default function LoginScreen() {
  const { navigate, seenOnboarding } = useGame();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(fitScale);

  useEffect(() => {
    const onResize = () => setScale(fitScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    // mínimo ~1.2s para que la barra se aprecie aunque todo esté en caché
    const wait = new Promise((r) => setTimeout(r, 1200));
    preloadMenu((done, total) => alive && setProgress(done / total))
      .then(() => wait)
      .then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let gone = false;
    const enter = (e) => {
      if (gone || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      gone = true;
      sfx.press();
      navigate(seenOnboarding ? "menu" : "onboarding");
    };
    window.addEventListener("keydown", enter);
    window.addEventListener("pointerdown", enter);
    return () => {
      window.removeEventListener("keydown", enter);
      window.removeEventListener("pointerdown", enter);
    };
  }, [ready, navigate, seenOnboarding]);

  return (
    <main className={styles.root} style={{ "--s": scale, "--check": `${113.34 * scale}px` }}>
      <div className={styles.center}>
        <img
          className={styles.logo}
          src={BASE + "logo.svg"}
          alt="The Chef's Way"
          draggable="false"
        />
        <div className={styles.status} aria-live="polite">
          {ready ? (
            <span className={styles.press}>Press any key to continue</span>
          ) : (
            <span className={styles.bar} role="progressbar" aria-valuenow={Math.round(progress * 100)}>
              <span className={styles.fill} style={{ transform: `scaleX(${progress})` }} />
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
