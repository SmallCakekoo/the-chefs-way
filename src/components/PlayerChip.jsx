import CharacterAvatar from "./CharacterAvatar.jsx";
import styles from "./PlayerChip.module.css";

/** Pastilla plana: personaje + nombre. size: md | lg */
export default function PlayerChip({ characterId, name, size = "md" }) {
  return (
    <span className={`${styles.chip} ${styles[size]}`}>
      <CharacterAvatar id={characterId} size={size === "lg" ? "md" : "sm"} />
      <span className={styles.name}>{name}</span>
    </span>
  );
}
