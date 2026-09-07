import { useGame } from "../game/GameContext.jsx";
import Screen from "../components/Screen.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import CharacterAvatar from "../components/CharacterAvatar.jsx";
import { CHARACTERS, CASILLA_INFO, EVENTS } from "../game/board.js";
import { FORKS } from "../game/forks.js";
import { ACHIEVEMENTS } from "../game/achievements.js";
import { BADGES } from "../game/badges.js";
import styles from "./DevRefScreen.module.css";

const CASILLAS = [
  ["Naranja · 35%", CASILLA_INFO.O.label, CASILLA_INFO.O.text],
  ["Aguamarina · 25%", CASILLA_INFO.A.label, CASILLA_INFO.A.text],
  ["Amarillo · 25%", CASILLA_INFO.Y.label, CASILLA_INFO.Y.text],
  ["Negro · 15%", CASILLA_INFO.B.label, CASILLA_INFO.B.text],
];

export default function DevRefScreen() {
  const { navigate } = useGame();
  return (
    <Screen onBack={() => navigate("rules")} layout="flow">
      <div className={styles.warn}>
        Referencia solo para desarrollo. Se borrará antes de publicar.
      </div>

      <section className={styles.block}>
        <SectionLabel tone="ink">Tipos de casilla</SectionLabel>
        {CASILLAS.map(([k, l, t]) => (
          <div key={k} className={styles.row}>
            <b>{k}</b> — {l}: {t}
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <SectionLabel tone="ink">Eventos ({EVENTS.length})</SectionLabel>
        {EVENTS.map((e) => (
          <div key={e.title} className={styles.row}>
            <b>{e.title}</b> — {e.text}
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <SectionLabel tone="ink">Bifurcaciones</SectionLabel>
        {Object.entries(FORKS).map(([sq, opts]) => (
          <div key={sq} className={styles.row}>
            <b>Casilla {sq}:</b>{" "}
            {opts.map((o) => `${o.label} (omite ${o.omite || 0})`).join(" · ")}
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <SectionLabel tone="ink">Logros ({ACHIEVEMENTS.length})</SectionLabel>
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={styles.row}>
            <b>{a.name}</b> [{a.scope}] — {a.desc}
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <SectionLabel tone="ink">Insignias de fin de partida ({BADGES.length})</SectionLabel>
        {BADGES.map((b) => (
          <div key={b.id} className={styles.row}>
            <b>{b.name}</b> — {b.desc}
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <SectionLabel tone="ink">Personajes ({CHARACTERS.length})</SectionLabel>
        <div className={styles.chars}>
          {CHARACTERS.map((c) => (
            <span key={c.id} className={styles.char}>
              <CharacterAvatar id={c.id} size="sm" />
              {c.name} <code>{c.id}</code>
            </span>
          ))}
        </div>
      </section>
    </Screen>
  );
}
