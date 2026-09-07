import { CHARACTERS } from "../game/board.js";
import { sfx } from "../lib/sfx.js";
import styles from "./CharacterPicker.module.css";

/** Rejilla de personajes-alimento seleccionables.
 *  `value` id actual · `taken` ids ya usados por otros · `onPick(id)` */
export default function CharacterPicker({ value, taken = [], onPick }) {
  return (
    <div className={styles.grid} role="radiogroup" aria-label="Elige personaje">
      {CHARACTERS.map((c) => {
        const isTaken = taken.includes(c.id) && c.id !== value;
        const selected = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={c.name}
            disabled={isTaken}
            className={`${styles.cell} ${selected ? styles.sel : ""}`}
            style={{ background: c.tint }}
            onClick={() => {
              sfx.select();
              onPick(c.id);
            }}
          >
            <img src={c.src} alt="" loading="lazy" />
            <span className={styles.name}>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
