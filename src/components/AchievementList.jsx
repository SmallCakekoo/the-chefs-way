import CharacterAvatar from "./CharacterAvatar.jsx";
import styles from "./AchievementList.module.css";

/** Lista de logros. `items` de achievements.evaluate(): {name,desc,icon,unlocked,scope} */
export default function AchievementList({ items }) {
  return (
    <ul className={styles.list}>
      {items.map((a) => (
        <li
          key={a.id}
          className={`${styles.row} ${a.unlocked ? styles.on : styles.off}`}
        >
          <span className={styles.medal}>
            {a.unlocked ? (
              <CharacterAvatar id={a.icon} size="sm" />
            ) : (
              <span className={styles.lock} aria-hidden="true">
                ?
              </span>
            )}
          </span>
          <span className={styles.txt}>
            <span className={styles.name}>{a.name}</span>
            <span className={styles.desc}>{a.desc}</span>
          </span>
          {a.scope === "host" && <span className={styles.host}>Host</span>}
        </li>
      ))}
    </ul>
  );
}
