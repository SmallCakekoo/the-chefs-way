import CharacterAvatar from "./CharacterAvatar.jsx";
import { sfx } from "../lib/sfx.js";
import styles from "./Roster.module.css";

/** Lista de jugadores. `onRemove(index)` opcional; `rank` numera. */
export default function Roster({ players, onRemove, rank = false }) {
  return (
    <ul className={styles.roster}>
      {players.map((p, i) => (
        <li key={p.name + i} className={styles.row}>
          {rank && <span className={styles.num}>{i + 1}</span>}
          <CharacterAvatar id={p.characterId} size="sm" />
          <span className={styles.name}>{p.name}</span>
          {onRemove && (
            <button
              className={styles.rm}
              onClick={() => {
                sfx.back();
                onRemove(i);
              }}
              aria-label={`Quitar a ${p.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
