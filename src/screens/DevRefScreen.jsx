import { useGame } from "../game/GameContext.jsx";
import Screen from "../components/Screen.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import CharacterAvatar from "../components/CharacterAvatar.jsx";
import { CHARACTERS, INGREDIENTS, CASILLA_INFO, EVENTS, GRAPH } from "../game/board.js";
import { BRANCHES } from "../game/forks.js";
import { ACHIEVEMENTS } from "../game/achievements.js";
import { BADGES } from "../game/badges.js";
import styles from "./DevRefScreen.module.css";

const CASILLAS = [
  ["O", CASILLA_INFO.O.label, CASILLA_INFO.O.text],
  ["A", CASILLA_INFO.A.label, CASILLA_INFO.A.text],
  ["Y", CASILLA_INFO.Y.label, CASILLA_INFO.Y.text],
  ["B", CASILLA_INFO.B.label, CASILLA_INFO.B.text],
];

export default function DevRefScreen() {
  const { navigate } = useGame();
  return (
    <Screen onBack={() => navigate("menu")} layout="flow">
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
        <SectionLabel tone="ink">Ingredientes ({INGREDIENTS.length})</SectionLabel>
        {INGREDIENTS.map((i) => (
          <div key={i.id} className={styles.row}>
            <b>{i.id}</b> — {i.name}
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <SectionLabel tone="ink">Bifurcaciones ({BRANCHES.length})</SectionLabel>
        {BRANCHES.map((b) => (
          <div key={b.from} className={styles.row}>
            <b>Casilla {b.from}:</b> {b.options.join(" · ")}
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <SectionLabel tone="ink">Mapa ({Object.keys(GRAPH).length} nodos)</SectionLabel>
        {Object.entries(GRAPH).map(([id, n]) => (
          <div key={id} className={styles.row}>
            <b>{id}</b> [{n.c || "—"}] → {n.next.join(", ") || "meta"}
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
