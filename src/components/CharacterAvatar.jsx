import { characterById, faceStyle } from "../game/board.js";
import styles from "./CharacterAvatar.module.css";

/** Ficha redonda con el personaje-alimento. size: sm | md | lg | xl.
 *  El PNG puede venir en cualquier escala: se encuadra con contain. */
export default function CharacterAvatar({
  id,
  size = "md",
  shape = "circle",
  className = "",
}) {
  const c = characterById(id);
  return (
    <span
      className={[styles.wrap, styles[size], styles[shape], className]
        .filter(Boolean)
        .join(" ")}
      style={c.face ? { background: "#45b1fb" } : { background: c.tint }}
    >
      <img
        className={c.face ? styles.face : undefined}
        src={c.src}
        alt={c.name}
        loading="lazy"
        style={faceStyle(c)}
      />
    </span>
  );
}
